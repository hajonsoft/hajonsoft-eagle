const moment = require("moment");
const Imap = require("node-imap"),
  inspect = require("util").inspect;

const nusukFromEmail = "no_reply@hajj.nusuk.sa";

// TODO: delete this function once the above function is working
async function listNusukMessages(auth, recipient, subject, page) {
  const newMessages = [];
  const gmail = google.gmail({ version: "v1", auth });
  const query = `in:inbox from:no_reply@hajj.nusuk.sa is:unread to:${recipient} subject:${subject} newer_than:2m`;
  for (let i = 0; i < 50; i++) {
    console.log(`waiting for OTP ${i}/50 ${query}`);
    await page.evaluate("document.title='" + `OTP ${i}/50` + "'");
    await InformUser(page, i);
    const listResponse = await gmail.users.messages.list({
      userId: "me",
      includeSpamTrash: false,
      q: query,
    });
    const messages = listResponse.data.messages;
    if (!messages || messages.length === 0) {
      // wait 10 seconds and try again
      await new Promise((resolve) => setTimeout(resolve, 10000));
      continue;
    }
    for (const message of messages) {
      const contents = await gmail.users.messages.get({
        userId: "me",
        id: message.id,
      });
      const messageDate = moment(
        contents.data.payload.headers.find((h) => h.name === "Date").value
      );
      // if messageDate is older than 10 hours, skip it
      if (messageDate.isBefore(moment().subtract(10, "hours"))) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        continue;
      }

      const isEnglish = /^[a-zA-Z\s]+$/.test(subject);

      const verificationCode = isEnglish
        ? contents.data.snippet.match(/Your OTP is (\d{6})/)?.[1]
        : contents.data.snippet.match(/رمز الدخول لمرة واحدة هو (\d+)/)?.[1];
      if (verificationCode) {
        if (newMessages.length === 0) {
          newMessages.push({ code: verificationCode, date: messageDate });
        } else {
          if (newMessages.find((m) => m.code === verificationCode)) {
            continue;
          }
        }
      }
    }
    if (newMessages.length === 0) {
      continue;
    }
    return newMessages;
  }
}
async function InformUser(page, i, errorMessage) {
  try {
    await page.waitForSelector("#hajonsoft-commander-alert");
    if (errorMessage) {
      await page.$eval(
        "#hajonsoft-commander-alert",
        (el, message) => (el.innerText = message),
        errorMessage
      );
      return;
    }
    await page.$eval(
      "#hajonsoft-commander-alert",
      (el, i) =>
        (el.innerText = `Checking email ${i}/50  فحص البريد الإلكتروني`),
      i
    );
  } catch {}
}

async function getNusukOTP(
  recipient,
  password,
  subject,
  page,
  otpSelector,
  infoSelector
) {
  var imap = new Imap({
    user: recipient, //  "babatunde@xn--libert-gva.email",
    password: password, // "Yeshua1234",
    host: `mail.${recipient.split("@")[1]}`, //  "mail.xn--libert-gva.email",
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
  });

  function openInbox(cb) {
    imap.openBox("INBOX", false, cb); // Changed to false for read-only mode
  }

  // TODO: Need to keep checking email until the email is received
  imap.once("ready", function () {
    openInbox(function (err, box) {
      if (err) throw err;

      imap.search(['UNSEEN'], function (err, results) {
        if (err) throw err;

        if (!results || !results.length) {
          console.log("No unread mails");
          imap.end();
          return;
        }

        // Fetch the last unread email
        var lastUnreadMsgSeqNo = results[results.length - 1];
        var f = imap.fetch(lastUnreadMsgSeqNo, {
          bodies: ["HEADER.FIELDS (FROM TO SUBJECT DATE)", "TEXT"],
          struct: true,
          markSeen: false, // Set to true if you want to mark it as read
        });

        f.on("message", function (msg, seqno) {
          console.log("Message #%d", seqno);
          var prefix = "(#" + seqno + ") ";
          msg.on("body", function (stream, info) {
            var buffer = "";
            stream.on("data", function (chunk) {
              buffer += chunk.toString("utf8");
            });
            stream.once("end", function () {
              if (info.which === "TEXT") {
                body = buffer;
                console.log(prefix + "Body: %s", body);
              } else {
                header = Imap.parseHeader(buffer);
                console.log(prefix + "Parsed header: %s", inspect(header));
              }
            });
          });
          msg.once("attributes", function (attrs) {
            // console.log(prefix + "Attributes: %s", inspect(attrs, false, 8));
          });
          msg.once("end", function () {
            console.log(prefix + "Finished");
          });
        });
        f.once("error", function (err) {
          // TODO: probably just try again
          console.log("Fetch error: " + err);
        });
        f.once("end", function () {
          // TODO: return the OTP to the user
          // console.log("Done fetching all messages!");
          imap.end();
        });
      });
    });
  });

  imap.once("error", function (err) {
    // TODO: report error to user and try again
    console.log(err);
  });

  imap.once("end", function () {
    // TODO: tell user to check email again
    console.log("Connection ended");
  });

  imap.connect();
}

getNusukOTP(
  "admin@xn--libert-gva.email",
  "safarMuslim",
  ["One time password", "رمز الدخول لمرة واحدة"],
  null,
  null,
  null
);

module.exports = {
  getNusukOTP,
};
