const { fetchOTPForMasar } = require("../../lib/imap");
const util = require("../../util");
const { CONFIG } = require("./config");
const { SELECTORS } = require("./selectors");

let globalPage = null;
let globalData = null;
let globalConfig = null;
let usedCodes = {};
let emailCodeCounter = 0;
let emailTimerHandler = null;
async function showController(page, data, config) {
  await util.controller(
    page,
    config.find((f) => f.name === "add-pilgrim-select-method"),
    data.travellers
  );
}

async function fillInputs(page, data, config) {
  await util.commit(page, config.inputs, data.system);
}

async function fillOtp(page, data, config) {
  globalPage = page;
  globalData = data;
  globalConfig = config;

  await util.commander(page, {
    controller: {
      selector: SELECTORS.loginOtp.h1,
      title: "Get Code",
      arabicTitle: "احصل عالرمز",
      name: "otp",
      action: async () => {
        emailCodeCounter = 0;
        startEmailTimer();
      },
    },
  });
  startEmailTimer();
}

async function startEmailTimer() {
  emailTimerHandler = setInterval(async () => {
    emailCodeCounter++;
    if (emailCodeCounter > 50) {
      clearInterval(emailTimerHandler);
      emailTimerHandler = null;
    } else {
      globalPage.$eval(
        SELECTORS.loginOtp.label,
        (el, i) =>
          (el.innerText = `Checking email ${i}/50  فحص البريد الإلكتروني`),
        emailCodeCounter
      );

      try {
        await fetchOTPForMasar(
          globalData.system.username,
          "Hajonsoft123",
          ["رمز التحقق|Verification Code", "رمز التحقق|Verification Code"],
          (err, code, page) => pasteOTPCode(err, code, page),
          "hajonsoft.net"
        );
      } catch (e) {
        await util.infoMessage(page, "Manual code required or try again!", e);
      }
    }
  }, 3000);
}

async function pasteOTPCode(err, code, page) {
  if (err === "no-code") {
    return;
  }
  if (err || !code) {
    try {
      await globalPage.waitForSelector(SELECTORS.loginOtp.label);
      if (err.startsWith("Error:")) {
        await globalPage.$eval(
          SELECTORS.loginOtp.label,
          (el, message) => (el.innerText = message),
          err
        );
        return;
      }
      await globalPage.$eval(
        SELECTORS.loginOtp.label,
        (el, i) =>
          (el.innerText = `Checking email ${i++}/50  فحص البريد الإلكتروني`),
        emailCodeCounter
      );
    } catch {}

    return;
  }
  if (codeUsed(code)) {
    return;
  }
  await util.commit(
    globalPage,
    [
      {
        selector: SELECTORS.loginOtp.firstDigit,
        value: () => code,
      },
    ],
    {}
  );
  clearInterval(emailTimerHandler);
  emailTimerHandler = null;
  await util.infoMessage(
    globalPage,
    "Code has been pasted successfully",
    null
  );
}

function codeUsed(code) {
  if (usedCodes[code]) {
    return true;
  }
  usedCodes[code] = true;
  return false;
}
module.exports = {
  showController,
  fillInputs,
  fillOtp,
};
