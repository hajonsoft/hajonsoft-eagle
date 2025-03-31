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
let sent = {};
async function showController(page, data, config) {
  await util.controller(
    page,
    {
      controller: {
        selector:
          "#content > div > app-applicant-add > app-data-entry-method > div > app-main-card:nth-child(1) > div > div.card-header.mb-0.cursor-pointer.ng-star-inserted > h3",
        action: async () => {
          const selectedTraveler = await page.$eval(
            "#hajonsoft_select",
            (el) => el.value
          );
          if (selectedTraveler) {
            util.setSelectedTraveller(selectedTraveler);
            await sendPassenger(util.getSelectedTraveler());
          }
        },
      },
    },
    data.travellers
  );
}

async function sendPassenger(selectedTraveler) {
  const passenger = globalData.travellers[selectedTraveler];
  await util.clickWhenReady(SELECTORS.dataEntry.automaticScan, globalPage);
  await new Promise((resolve) => setTimeout(resolve, 100));
  await util.clickWhenReady(SELECTORS.dataEntry.startScanButton, globalPage);
  await new Promise((resolve) => setTimeout(resolve, 100));
  await pasteCodeLine(selectedTraveler, globalData);
  await new Promise((resolve) => setTimeout(resolve, 2000));
  await globalPage.waitForSelector(SELECTORS.dataEntry.passportPhotoButton);
  const resizedPassportPath = await util.downloadAndResizeImage(
    passenger,
    200,
    200,
    "passport"
  );
  await util.commitFile(
    SELECTORS.dataEntry.passportPhotoInput,
    resizedPassportPath
  );
}

async function pasteCodeLine(selectedTraveler, passengersData) {
  await util.infoMessage(
    globalPage,
    `${parseInt(selectedTraveler.toString()) + 1}/${
      passengersData.travellers.length
    }`
  );
  // await globalPage.waitForSelector(
  //   "#content > div > app-applicant-add > app-data-entry-method > p-dialog.p-element.ng-tns-c4042076560-7.ng-star-inserted > div > div > div.ng-tns-c4042076560-7.p-dialog-content > div > app-alert > div"
  // );
  // await globalPage.focus(
  //   "#content > div > app-applicant-add > app-data-entry-method > p-dialog.p-element.ng-tns-c4042076560-7.ng-star-inserted > div > div > div.ng-tns-c4042076560-7.p-dialog-content > div > app-alert > div"
  // );
  if (selectedTraveler == "-1") {
    const browser = await globalPage.browser();
    browser.disconnect();
  }
  var passenger = passengersData.travellers[selectedTraveler];
  if (sent[passenger.passportNumber] === undefined) {
    await globalPage.keyboard.type(passenger.codeline);
  } else {
    const newCodeLine = util.generateMRZ(passenger);
    console.log("📢[ehj.js:470]: newCodeLine: ", newCodeLine);
    await globalPage.keyboard.type(newCodeLine);
  }
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
  await util.infoMessage(globalPage, "Code has been pasted successfully", null);
}

async function fillIdAndResidence(page, data, config) {
  const passenger = data.travellers[util.getSelectedTraveler()];

  await util.commit(page, config.inputs, passenger);

  await util.commit(
    page,
    [
      {
        selector:
          "#content > div > app-applicant-add > app-identity-and-residence > form > div:nth-child(2) > div > app-main-card > div > div.body.collapse.show > div > div:nth-child(5) > g-input-text > div > input",
        value: (row) => row.placeOfIssue,
      },
    ],
    passenger
  );

  await page.$eval(
    SELECTORS.identityAndResidence.PassIssueDate,
    (el, pass) =>
      (el.textContent = `Passport Issue Date: ${pass.passIssueDt.dmmmy}`),
    passenger
  );
  await util.clickWhenReady(SELECTORS.identityAndResidence.hajjType, page);
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
  fillIdAndResidence,
};
