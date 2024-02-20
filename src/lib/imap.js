const moment = require("moment");
const Imap = require("node-imap"),
  inspect = require("util").inspect;
const fs = require("fs");
const simpleParser = require('mailparser').simpleParser; // To parse email content


const nshFromEmail = "no_reply@hajj.nusuk.sa";
const nskFromEmail = "no-reply@mofa.gov.sa";
const messages = {};

async function fetchNusukIMAPOTP(recipient, password, subject, callback) {
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
      const oneMinuteAgo = new Date();
      oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);

      // Convert the date to a formatted string in the IMAP date format
      const sinceDate = oneMinuteAgo
        .toISOString()
        .slice(0, -5)
        .replace(/T/g, " ");

      const subjectArray = subject.map((s) => ["HEADER", "SUBJECT", s]);

      imap.search(
        [
          "UNSEEN",
          ["OR", ...subjectArray],
          ["HEADER", "FROM", nshFromEmail],
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
              const englishOtp =
                messages[seqno].body.match(/OTP is (\d{6})/)?.[1];
              if (englishOtp) {
                messages[seqno].otp = englishOtp;
              } else {
                const arabicOtp =
                  messages[seqno].body.match(/;&#x648; (\d+)/)?.[1];
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

  imap.once("end", function () {
    callback("Error: Connection ended");
  });

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

function decodeBase64(text) {
  return Buffer.from(text, "base64").toString("utf-8");
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
// fetchNusukIMAPOTP(
//   "HAJJ.ABUOMAR@YOIGOMAIL.COM",
//   "replace with correct passsword",
//   ["One Time Password", "رمز سري لمرة واحدة"],
//   (err, otp) => {
//     console.log(err, otp);
//   }
// );

module.exports = {
  fetchNusukIMAPOTP,
  fetchNusukIMAPPDF,
};
