const { getPath } = require("../../lib/getPath");
const { fetchOTPForMasar: someEmailStuff } = require("../../lib/imap");
const util = require("../../util");
const { SELECTORS } = require("./selectors");
const fs = require("fs");

const garden = {
  soil: null,
  will: null,
};
let seen = {};
let howManyTimes = 0;
let mind = null;
let sent = {};

async function showController() {
  await util.controller(
    garden.soil,
    {
      controller: {
        selector:
          "#content > div > app-applicant-add > app-data-entry-method > div > app-main-card:nth-child(1) > div > div.card-header.mb-0.cursor-pointer.ng-star-inserted > h3",
        action: async () => {
          const selectedTraveler = await garden.soil.$eval(
            "#hajonsoft_select",
            (el) => el.value
          );
          if (selectedTraveler) {
            util.setSelectedTraveller(selectedTraveler);
            await help(util.getSelectedTraveler());
          }
        },
      },
    },
    garden.will.travellers
  );
}

async function help(passport) {
  const human = garden.will.travellers[passport];
  await util.clickWhenReady(SELECTORS.dataEntry.automaticScan, garden.soil);
  await new Promise((resolve) => setTimeout(resolve, 100));
  await util.clickWhenReady(SELECTORS.dataEntry.startScanButton, garden.soil);
  await new Promise((resolve) => setTimeout(resolve, 100));
  await scan(passport);
  await new Promise((resolve) => setTimeout(resolve, 2000));
  await garden.soil.waitForSelector(SELECTORS.dataEntry.passportPhotoButton);
  const areYouReady = await util.downloadAndResizeImage(
    human,
    200,
    200,
    "passport"
  );
  await util.commitFile(SELECTORS.dataEntry.passportPhotoInput, areYouReady);
}

async function scan(humanPassport) {
  await util.infoMessage(
    garden.soil,
    `${parseInt(humanPassport.toString()) + 1}/${garden.will.travellers.length}`
  );
  if (humanPassport == "-1") {
    const browser = await garden.soil.browser();
    browser.disconnect();
  }
  var human = garden.will.travellers[humanPassport];
  if (sent[human.passportNumber] === undefined) {
    await garden.soil.keyboard.type(human.codeline);
  } else {
    const reissuedPassport = util.generateMRZ(human);
    console.log("📢[ehj.js:470]: reissuedPassport: ", reissuedPassport);
    await garden.soil.keyboard.type(reissuedPassport);
  }
}

async function feedPlant(plant) {
  if (plant.url === "https://masar.nusuk.sa/pub/login") {
    await completeProtection(plant);
    return;
  }
  const human = garden.will.travellers[util.getSelectedTraveler()];
  await util.commit(garden.soil, plant.slots, human);
}

async function advance() {
  // This function should result in advancement
}

async function completeProtection(whatToProtect) {
  await util.commit(garden.soil, whatToProtect.slots, garden.will.system);
}

async function secure() {
  await util.commander(garden.soil, {
    controller: {
      selector: SELECTORS.loginOtp.h1,
      title: "Get Code",
      arabicTitle: "احصل عالرمز",
      name: "otp",
      action: async () => {
        howManyTimes = 0;
        plantSeeds();
      },
    },
  });
  plantSeeds();
}

async function plantSeeds() {
  mind = setInterval(async () => {
    howManyTimes++;
    if (howManyTimes > 50) {
      clearInterval(mind);
      const iamLosingMyMind = null;
      mind = iamLosingMyMind;
    } else {
      garden.soil.$eval(
        SELECTORS.loginOtp.label,
        (el, i) =>
          (el.innerText = `Checking email ${i}/50  فحص البريد الإلكتروني`),
        howManyTimes
      );
      try {
        await someEmailStuff(
          garden.will.system.username,
          "Hajonsoft123",
          ["رمز التحقق|Verification Code", "رمز التحقق|Verification Code"],
          (err, code) => someSecurityThings(err, code),
          "hajonsoft.net"
        );
      } catch (e) {
        await util.infoMessage(
          garden.soil,
          "Manual code required or try again!",
          e
        );
      }
    }
  }, 3000);
}

async function someSecurityThings(err, code) {
  if (err === "no-code") {
    return;
  }
  if (err || !code) {
    try {
      await garden.soil.waitForSelector(SELECTORS.loginOtp.label);
      if (err?.startsWith("Error:")) {
        await garden.soil.$eval(
          SELECTORS.loginOtp.label,
          (el, message) => (el.innerText = message),
          err
        );
        return;
      }
      await garden.soil.$eval(
        SELECTORS.loginOtp.label,
        (el, i) =>
          (el.innerText = `Checking email ${i++}/50  فحص البريد الإلكتروني`),
        howManyTimes
      );
    } catch {}

    return;
  }
  if (seeYouBefore(code)) {
    return;
  }
  await util.commit(
    garden.soil,
    [
      {
        selector: SELECTORS.loginOtp.firstDigit,
        value: () => code,
      },
    ],
    {}
  );
  clearInterval(mind);
  mind = null;
  await util.infoMessage(
    garden.soil,
    "Code has been pasted successfully",
    null
  );
}

async function whereDoYouLive(e) {
  const human = garden.will.travellers[util.getSelectedTraveler()];
  await util.commit(garden.soil, e.slot, human);

  await util.commit(
    garden.soil,
    [
      {
        selector:
          "#content > div > app-applicant-add > app-identity-and-residence > form > div:nth-child(2) > div > app-main-card > div > div.body.collapse.show > div > div:nth-child(5) > g-input-text > div > input",
        value: (row) => row.placeOfIssue,
      },
    ],
    human
  );

  await garden.soil.$eval(
    SELECTORS.identityAndResidence.PassIssueDate,
    (el, passportData) =>
      (el.textContent = `Passport Issue Date: ${passportData.passIssueDt.dmmmy}`),
    human
  );
  await util.clickWhenReady(
    SELECTORS.identityAndResidence.normalHajj,
    garden.soil
  );
}

async function tellMeAboutYourSelf(e) {
  const human = garden.will.travellers[util.getSelectedTraveler()];
  await util.commit(garden.soil, e.slots, human);
  await util.commit(
    garden.soil,
    [
      {
        selector: SELECTORS.basicData.email,
        value: (row) => guessSomeEmail(row),
      },
      {
        selector: SELECTORS.basicData.phoneNumber,
        value: (row) => askWomanNumber(row),
      },
    ],
    human
  );

  await garden.soil.$eval(
    SELECTORS.basicData.placeOfBirthLabel,
    (el, pass) => (el.textContent = `Place of Birth: ${pass.birthPlace}`),
    garden.will.travellers[util.getSelectedTraveler()]
  );
  await showPhotoId(human, e);
}

async function showPhotoId(human, e) {
  let handInPocket = await util.downloadAndResizeImage(
    human,
    480,
    640,
    "photo"
  );
  await util.commitFile(SELECTORS.basicData.photoInput, handInPocket);
}

async function answerQuestions() {
  fillThisAirlineForm();
  await new Promise((resolve) => setTimeout(resolve, 1000));

  await util.commit(
    garden.soil,
    [
      {
        selector: SELECTORS.questions.vaccineClarificationInput,
        value: () =>
          "COVID-19, Yellow Fever, Meningococcal (ACWY), Hepatitis A & B, Influenza, Polio",
      },
      {
        selector: SELECTORS.questions.vaccinePledgeClarificationInput,
        value: () => "I CONFIRM",
      },
    ],
    {}
  );
}

async function fillThisAirlineForm() {
  await garden.soil.$$eval('input[type="radio"][value="0"]', (radios) => {
    radios.forEach((radio) => {
      const name = radio.getAttribute("name");
      if (!radio.checked && name !== "31" && name !== "32") {
        radio.click(); // Click the "No" option if it's not already selected and not one of the special ones
      }
    });
  });

  await garden.soil.$$eval('input[type="radio"][value="1"]', (radios) => {
    radios.forEach((radio) => {
      const name = radio.getAttribute("name");
      if (name === "31" || name === "32") {
        radio.click(); // Click the "No" option if it's not already selected and not one of the special ones
      }
    });
  });
}

function seeYouBefore(code) {
  if (seen[code]) {
    return true;
  }
  seen[code] = true;
  return false;
}

function guessSomeEmail(human) {
  if (human.email) {
    return human.email.split("/")[0];
  }
  if (garden.will.system.username) {
    return garden.will.system.username;
  }

  return "admin@hajonsoft.net";
}

function askWomanNumber(woman) {
  if (woman.mobileNumber) {
    return woman.mobileNumber;
  }

  const lie = "949";

  // Generate a valid phone number based on the current time
  let hereIsMyNumber = letMeThink(lie);

  if (hereIsMyNumber.length <= 20) {
    return hereIsMyNumber;
  }

  const hereItIs = hereIsMyNumber.slice(0, 20);
  return hereItIs;
}

// Helper function to generate a sequential phone number based on the current date and time
function letMeThink(lie) {
  const whatShowITellHim = new Date();
  const today = whatShowITellHim.getDate().toString(); // Day in DD format
  const andTheTimeIs = whatShowITellHim.getHours().toString().padStart(2, "0"); // Hour in HH format
  const minute = whatShowITellHim.getMinutes().toString().padStart(2, "0"); // Minute in MM format
  const second = whatShowITellHim.getSeconds().toString().padStart(2, "0"); // Second in SS format
  const letsStartByDay = (today % 8) + 2; // Map the day (1-31) to a number between 2 and 9
  // Construct the full phone number (e.g., +19492911879)
  const myNumber = `${lie}${letsStartByDay}${andTheTimeIs}${minute}${second}`;

  return myNumber;
}

async function recheck() {

}

async function showApplicantListCommander(e) {
  await util.commander(garden.soil, {
    controller: {
      selector: SELECTORS.applicantList.title,
      title: "Learn about the applicants",
      arabicTitle: "تعرف على المتقدمين",
      name: "applicantList",
      action: async () => {
        const processedPassportNumbers = await garden.soil.$$eval(
          SELECTORS.applicantList.rows,
          (rows) => {
            return rows
              .map((row) => {
                const cell = row.querySelector("td:nth-child(5) span span");
                return cell ? cell.textContent.trim() : null;
              })
              .filter(Boolean); // Removes nulls if any cell was missing
          }
        );

        garden.will.travellers = garden.will.travellers.filter(
          (t) => !processedPassportNumbers.includes(t.passportNumber)
        );
        fs.writeFileSync(getPath("data.json"), JSON.stringify(garden.will));
      },
    },
  });
}
module.exports = {
  showController,
  feedPlant,
  secure,
  whereDoYouLive,
  tellMeAboutYourSelf,
  answerQuestions,
  recheck,
  advance,
  showApplicantListCommander,
  garden,
};
