const { fetchOTPForMasar } = require("../../lib/imap");
const util = require("../../util");

let globalPage = null;
let globalData = null;
let globalConfig = null;
let usedCodes = {};
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
  try {
    await fetchOTPForMasar(
      data.system.username,
      "Hajonsoft123",
      ["رمز التحقق|Verification Code", "رمز التحقق|Verification Code"],
      (err, code, page) => pasteOTPCode(err, code, page),
      "hajonsoft.net"
    );
  } catch (e) {
    await util.infoMessage(page, "Manual code required or try again!", e);
  }
}

let emailCodeCounter = 0;
async function pasteOTPCode(err, code, page) {
  if (err === "no-code") {
    setTimeout(async () => {
      if (emailCodeCounter < 50) {
        emailCodeCounter++;
        try {
          await globalPage.waitForSelector(
            "#login > app-login > div.login-otp.ng-star-inserted > g-otp-built-in-component > form > div:nth-child(1) > p"
          );
          if (err.startsWith("Error:")) {
            await globalPage.$eval(
              "#login > app-login > div.login-otp.ng-star-inserted > g-otp-built-in-component > form > div:nth-child(1) > p",
              (el, message) => (el.innerText = message),
              err
            );
            return;
          }
          await globalPage.$eval(
            "#login > app-login > div.login-otp.ng-star-inserted > g-otp-built-in-component > form > div:nth-child(1) > p",
            (el, i) =>
              (el.innerText = `Checking email ${i}/00:02:30 فحص البريد`),
            formatTime(emailCodeCounter * 3)
          );
        } catch {}
        await fillOtp(globalPage, globalData, globalConfig);
      } else {
        // manual code is required
      }
    }, 3000);
    return;
  }
  if (err || !code) {
    try {
      await globalPage.waitForSelector(
        "#login > app-login > div.login-otp.ng-star-inserted > g-otp-built-in-component > form > div:nth-child(1) > p"
      );
      if (err.startsWith("Error:")) {
        await globalPage.$eval(
          "#login > app-login > div.login-otp.ng-star-inserted > g-otp-built-in-component > form > div:nth-child(1) > p",
          (el, message) => (el.innerText = message),
          err
        );
        return;
      }
      await globalPage.$eval(
        "#login > app-login > div.login-otp.ng-star-inserted > g-otp-built-in-component > form > div:nth-child(1) > p",
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
        selector:
          "#login > app-login > div.login-otp.ng-star-inserted > g-otp-built-in-component > form > div:nth-child(3) > ng-otp-input > div > input.otp-input.ng-pristine.ng-valid.ng-star-inserted.ng-touched",
        value: () => code,
      },
    ],
    {}
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
  fillOtp
};
