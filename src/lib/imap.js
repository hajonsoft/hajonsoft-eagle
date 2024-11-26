const moment = require("moment");
const Imap = require("node-imap");
const inspect = require("util").inspect;
const fs = require("fs");
const { simpleParser } = require("mailparser");
const cheerio = require('cheerio');

const NUSUK_FROM_EMAIL = "no_reply@notification.nusuk.sa";
const nskFromEmail = "no-reply@mofa.gov.sa";
const messages = {};

function getHostName(recipient) {
  if (recipient.includes("@triamail.com")) {
    return "mail.privateemail.com";
  }
  if (recipient.includes("hajonsoft.net")) {
    return "giow1026.siteground.us";
  }
  return `mail.${recipient.split("@")[1]}`;
}

function decodeBase64(text) {
  return Buffer.from(text, "base64").toString("utf-8");
}


function extractOtpFromHtml(body) {
  const $ = cheerio.load(body);

  // Normalize the body text to handle line breaks and line continuation artifacts like '='
  let normalizedHtml = body.replace(/=\n/g, "").replace(/=\s*/g, "");

  const $normalized = cheerio.load(normalizedHtml);

  // For English OTP: Look for <h2> containing digits near the "Your OTP is" context
  const englishOtpContext = $normalized("p:contains('Your OTP is')");
  let englishOtp = englishOtpContext.next("h2").text().trim();

  if (!englishOtp) {
    // Fallback: Extract any 6-digit OTP from <h2> if context-specific extraction fails
    const otpText = $normalized("h2").text().trim();
    const otpMatch = otpText.match(/\d{6}/);
    englishOtp = otpMatch ? otpMatch[0] : null;
  }

  // For Arabic OTP: Match the "رمز الدخول لمرة واحدة هو" context and extract digits
  const arabicOtpMatch = normalizedHtml.match(/رمز الدخول لمرة واحدة هو.*?<h2.*?>(\d{6})<\/h2>/);
  const arabicOtp = arabicOtpMatch ? arabicOtpMatch[1] : null;

  // Return the first found OTP (English preferred over Arabic, or fallback to null)
  return englishOtp || arabicOtp || null;
}



async function fetchOTPFromNusuk(recipient, password, subject, callback, isNotVirtualEmail) {
  var imap = new Imap({
    user: isNotVirtualEmail ? recipient : `admin@${recipient.split("@")[1]}`,
    password: password,
    host: getHostName(recipient),
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
  });

  function openInbox(cb) {
    imap.openBox("INBOX", false, cb);
  }
  imap.once("ready", function () {
    openInbox(function (err, box) {
      if (err) throw err;
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000); // 1 minute ago in milliseconds
      const oneMinuteAgoUTC = new Date(
        oneMinuteAgo.getUTCFullYear(),
        oneMinuteAgo.getUTCMonth(),
        oneMinuteAgo.getUTCDate(),
        oneMinuteAgo.getUTCHours(),
        oneMinuteAgo.getUTCMinutes(),
        oneMinuteAgo.getUTCSeconds()
      );

      // Convert to IMAP-compatible date format (e.g., "26-Nov-2024 15:02:08")
      const sinceDate = oneMinuteAgoUTC
        .toISOString()
        .replace("T", " ")
        .split(".")[0] + " +0000"; // Ensuring the timezone is in UTC


      const subjectArray = subject.map((s) => ["HEADER", "SUBJECT", s]);

      imap.search(
        [
          "UNSEEN",
          ["OR", ...subjectArray],
          ["HEADER", "FROM", NUSUK_FROM_EMAIL],
          ["HEADER", "TO", recipient],
          ["SINCE", sinceDate],
        ],
        function (err, results) {
          if (err) throw err;

          if (!results || !results.length) {
            imap.end();
            return callback("no-code");
          }
          for (let i = 0; i < Math.min(results.length, 5); i++) {
            var msgSeqNo = results[i];
            var f = imap.fetch(msgSeqNo, {
              bodies: ["TEXT"],
              struct: true,
              markSeen: true,
            });
          }

          f.on("message", function (msg, seqno) {
            messages[seqno] = {};
            let buffer = "";
            msg.on("body", function (stream, info) {
              stream.on("data", function (chunk) {
                buffer += chunk.toString("utf8");
              });
            });
            msg.once("attributes", function (attrs) {
              messages[seqno].encoding = attrs.struct?.[0]?.encoding;
            });
            msg.once("end", function () {
              switch (messages[seqno].encoding) {
                case "quoted-printable":
                  messages[seqno].body = decodeQuotedPrintable(buffer);
                  break;
                case "base64":
                  messages[seqno].body = decodeBase64(buffer);
                  break;
                default:
                  messages[seqno].body = buffer;
                  break;
              }
              // Check if the body is HTML
              if (/<\/?[a-z][\s\S]*>/i.test(messages[seqno].body)) {
                try {
                  const otp = extractOtpFromHtml(messages[seqno].body); // Use Cheerio if it's HTML
                  if (otp) {
                    messages[seqno].otp = otp;
                    messages.codeFound = true;
                    callback(null, otp);
                    imap.end();
                    return; // Stop further processing since OTP is found
                  }
                } catch (error) {
                  console.error("Failed to parse HTML with cheerio:", error);
                }
              }

              // Fallback to existing regex-based parsing for plain text
              const englishOtp =
                messages[seqno].body.match(/Your OTP is\s*\n?\s*(\d{6})/)?.[1];
              if (englishOtp) {
                messages[seqno].otp = englishOtp;
              } else {
                const arabicOtp = messages[seqno].body.match(
                  /رمز الدخول لمرة واحدة هو\s*\n?\s*(\d{6})/
                )?.[1];
                if (arabicOtp) {
                  messages[seqno].otp = arabicOtp;
                }
              }

              if (messages[seqno].otp) {
                messages.codeFound = true;
                callback(null, messages[seqno].otp);
                imap.end();
              }
            });
          });
          f.once("error", function (err) {
            callback("Error: " + err);
          });
          f.once("end", function () {
            if (!messages.codeFound) callback("no-code");
            imap.end();
          });
        }
      );
    });
  });

  imap.once("error", function (err) {
    callback("Error: " + err);
  });

  // imap.once("end", function () {
  //   callback("Error: Connection ended");
  // });

  imap.connect();
}

async function fetchNusukIMAPPDF(recipient, password, subject, callback) {
  var imap = new Imap({
    user: `admin@${recipient.split("@")[1]}`,
    password: password,
    host: `mail.${recipient.split("@")[1]}`,
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
  });

  function openInbox(cb) {
    imap.openBox("INBOX", false, cb);
  }
  imap.once("ready", function () {
    openInbox(function (err, box) {
      if (err) throw err;
      const subjectArray = subject.map((s) => ["HEADER", "SUBJECT", s]);

      imap.search(
        [
          // "UNSEEN",
          // ["OR", ...subjectArray],
          ["HEADER", "FROM", nskFromEmail],
          ["HEADER", "TO", recipient],
        ],
        function (err, results) {
          if (err) throw err;

          if (!results || !results.length) {
            imap.end();
            return callback("no-visa-pdf");
          }
          for (let i = 0; i < Math.min(results.length, 1); i++) {
            var msgSeqNo = results[i];
            var f = imap.fetch(msgSeqNo, {
              bodies: "",
              struct: true,
              markSeen: false,
            });
          }

          f.on("message", function (msg, seqno) {
            msg.on("body", function (stream, info) {
              simpleParser(stream, {}, (err, parsed) => {
                if (err) throw err;

                if (parsed.attachments && parsed.attachments.length) {
                  parsed.attachments.forEach((attachment) => {
                    if (attachment.contentType === "application/pdf") {
                      callback(null, attachment);
                      return;
                    }
                  });
                }
              });
            });

            msg.once("end", function () {

            });
          });

          f.once("error", function (err) {
            callback("Error: " + err);
          });
        }
      );
    });
  });

  imap.once("error", function (err) {
    callback("Error: " + err);
  });

  imap.once("end", function () {
    callback("Error: Connection ended");
  });

  imap.connect();
}

function decodeQuotedPrintable(encodedText) {
  // Replace soft line breaks (encoded as '=') followed by newline characters with empty string
  let text = encodedText.replace(/=\n/g, "");

  // Replace equal signs followed by two hexadecimal characters with their corresponding ASCII character
  text = text.replace(/=([0-9A-F]{2})/g, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });

  // Replace equal signs followed by a single hexadecimal character with their corresponding ASCII character
  text = text.replace(/=([0-9A-F])/gi, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });

  // Decode percent-encoded characters
  // text = decodeURIComponent(text);

  return text;
}

// test code
// fetchOTPFromNusuk(
//   "HAJJ.ABUOMAR@YOIGOMAIL.COM",
//   "replace with correct passsword",
//   ["One Time Password", "رمز سري لمرة واحدة"],
//   (err, otp) => {
//     console.log(err, otp);
//   }
// );

module.exports = {
  fetchOTPFromNusuk,
  fetchNusukIMAPPDF,
};
