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
  const passenger = globalData.travellers[util.getSelectedTraveler()];
  await util.clickWhenReady(".p-dropdown .p-dropdown-label", globalPage);
  await util.clickWhenReady("#dropDownId_list .p-dropdown-item", globalPage);

  await util.commit(globalPage, config.inputs, passenger);

  await util.commit(
    globalPage,
    [
      {
        selector:
          "#content > div > app-applicant-add > app-identity-and-residence > form > div:nth-child(2) > div > app-main-card > div > div.body.collapse.show > div > div:nth-child(5) > g-input-text > div > input",
        value: (row) => row.placeOfIssue,
      },
    ],
    passenger
  );

  await globalPage.$eval(
    SELECTORS.identityAndResidence.PassIssueDate,
    (el, pass) =>
      (el.textContent = `Passport Issue Date: ${pass.passIssueDt.dmmmy}`),
    passenger
  );
  await util.clickWhenReady(
    SELECTORS.identityAndResidence.hajjType,
    globalPage
  );
}

async function fillBasicData(page, data, config) {
  const passenger = data.travellers[util.getSelectedTraveler()];
  await util.commit(page, config.inputs, passenger);
  await util.commit(
    page,
    [
      {
        selector: SELECTORS.basicData.email,
        value: (row) => suggestEmail(row),
      },
      {
        selector: SELECTORS.basicData.phoneNumber,
        value: (row) => suggestPhoneNumber(row),
      },
    ],
    passenger
  );

  await page.$eval(
    SELECTORS.basicData.placeOfBirthLabel,
    (el, pass) => (el.textContent = `Place of Birth: ${pass.birthPlace}`),
    data.travellers[util.getSelectedTraveler()]
  );
  await uploadPortrait(page, passenger, config);
}

async function uploadPortrait(page, data, config) {
  const passenger = globalData.travellers[util.getSelectedTraveler()];
  // let resizedPhotoPath = await util.downloadAndResizeImage(
  //   passenger,
  //   480,
  //   640,
  //   "photo",
  //   50,
  //   200
  // );
  let resizedPhotoPath = await util.downloadAndResizeImage(
    passenger,
    480,
    640,
    "photo"
  );
  await util.commitFile(SELECTORS.basicData.photoInput, resizedPhotoPath);
}

async function fillQuestions(page, data, config) {
  await globalPage.$$eval('input[type="radio"][value="0"]', (radios) => {
    radios.forEach((radio) => {
      if (!radio.checked) {
        radio.click(); // Click the "No" option if it's not already selected
      }
    });
  });

  // await globalPage.$eval(SELECTORS.questions.vaccineTakenYes, (radio) => {
  //   radio.click();
  // });
  // await globalPage.$eval(SELECTORS.questions.vaccinePledgeYes, (radio) => {
  //   radio.click();
  // });
  // await new Promise((resolve) => setTimeout(resolve, 1000));

  // await util.commit(
  //   globalPage,
  //   [
  //     {
  //       selector: SELECTORS.questions.vaccineClarificationInput,
  //       value: () => "COVID, Yellow fever, Hepatitis, Others",
  //     },
  //     {
  //       selector: SELECTORS.questions.vaccinePledgeClarificationInput,
  //       value: () => "I CONFIRM",
  //     },
  //   ],
  //   {}
  // );
}
function codeUsed(code) {
  if (usedCodes[code]) {
    return true;
  }
  usedCodes[code] = true;
  return false;
}

function suggestEmail(passenger) {
  if (passenger.email) {
    return passenger.email.split("/")[0];
  }
  if (globalData.system.username) {
    return globalData.system.username;
  }

  return "admin@hajonsoft.net";

  // const friendlyName = `${passenger.name.first}.${
  //   companion ? "companion." : ""
  // }${passenger.passportNumber}@${domain}`
  //   .toLowerCase()
  //   .replace(/ /g, "");
  // const email = friendlyName;
  // return email;
}

function suggestPhoneNumber(passenger) {
  if (passenger.mobileNumber) {
    return passenger.mobileNumber;
  }

  // Get the USA area code 949 (as an example)
  const areaCode = "949";

  // Generate a valid phone number based on the current time
  let generatedPhoneNumber = generateSequentialPhoneNumber(areaCode);

  if (generatedPhoneNumber.length <= 20) {
    return generatedPhoneNumber;
  }

  const suggestedPhoneNumber = generatedPhoneNumber.slice(0, 20);
  return suggestedPhoneNumber;
}

// Helper function to generate a sequential phone number based on the current date and time
function generateSequentialPhoneNumber(areaCode) {
  const now = new Date();
  const day = now.getDate().toString(); // Day in DD format
  const hour = now.getHours().toString().padStart(2, "0"); // Hour in HH format
  const minute = now.getMinutes().toString().padStart(2, "0"); // Minute in MM format
  const second = now.getSeconds().toString().padStart(2, "0"); // Second in SS format
  const hashedDay = (day % 8) + 2; // Map the day (1-31) to a number between 2 and 9
  // Construct the full phone number (e.g., +19492911879)
  const phoneNumber = `${areaCode}${hashedDay}${hour}${minute}${second}`;

  return phoneNumber;
}

async function reviewApplication(page, data, config) {

  // await page.$eval(
  //   SELECTORS.reviewApplication.pledgeVaccines,
  //   (radio) => {
  //     radio.click();
  //   }
  // );
  // await page.$eval(
  //   SELECTORS.reviewApplication.pledgeShowVaccine,
  //   (radio) => {
  //     radio.click();
  //   }
  // );
  // await util.clickWhenReady(SELECTORS.reviewApplication.next, globalPage);
}
module.exports = {
  showController,
  fillInputs,
  fillOtp,
  fillIdAndResidence,
  fillBasicData,
  fillQuestions,
  reviewApplication,
};
