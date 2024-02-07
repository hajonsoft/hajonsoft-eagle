const moment = require("moment");
const Imap = require("node-imap"),
  inspect = require("util").inspect;
const fs = require("fs");
const cheerio = require('cheerio');

const nusukFromEmail = "no_reply@hajj.nusuk.sa";
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
      imap.search(["UNSEEN"], function (err, results) {
        if (err) throw err;

        if (!results || !results.length) {
          imap.end();
          return callback("no-code");
        }
        for (let i = 0; i < Math.min(results.length, 5); i++) {
          var msgSeqNo = results[i];
          var f = imap.fetch(msgSeqNo, {
            bodies: ["HEADER.FIELDS (FROM TO SUBJECT DATE)", "TEXT"],
            struct: true,
            markSeen: true,
          });
        }

        f.on("message", function (msg, seqno) {
          messages[seqno] = {};
          msg.on("body", function (stream, info) {
            var buffer = "";
            stream.on("data", function (chunk) {
              buffer += chunk.toString("utf8");
            });
            stream.once("end", function () {
              if (info.which === "TEXT") {
                const clean = buffer;
                messages[seqno].body = clean;
                const englishOtp = messages[seqno].body.match(
                  /OTP is (\d{6})/
                )?.[1];
                if (englishOtp) {
                  messages[seqno].otp = englishOtp;
                } else {
                  const arabicOtp = messages[seqno].body.match(
                    / هو (\d+)/
                  )?.[1];
                  if (arabicOtp) {
                  } else {
                    callback("Error: Manual code required");
                  }
                }
              } else {
                messages[seqno].header = Imap.parseHeader(buffer);
              }
            });
          });
          msg.once("end", function () {
            // Apply the filter here and call the callback
            if (
              messages[seqno].header.from[0].includes(nusukFromEmail) &&
              messages[seqno].header.to[0].includes(recipient) &&
              subject.includes(messages[seqno].header.subject[0])
            ) {
              callback(null, messages[seqno].otp);
              imap.end();
            }
          });
        });
        f.once("error", function (err) {
          callback("Error: " + err);
        });
        f.once("end", function () {
          imap.end();
        });
      });
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

module.exports = {
  fetchNusukIMAPOTP,
};
