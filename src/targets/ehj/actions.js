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
            await simulateScan(util.getSelectedTraveler());
          }
        },
      },
    },
    garden.will.travellers
  );

  await eatApple();
}


async function showEditController() {
  await util.controller(
    garden.soil,
    {
      controller: {
        selector:
          "#content > div > app-applicant-add > app-identity-and-residence > form > div:nth-child(1) > div > app-main-card > div > div.card-header.mb-0.cursor-pointer.ng-star-inserted > h3",
        action: async () => {
          const selectedTraveler = await garden.soil.$eval(
            "#hajonsoft_select",
            (el) => el.value
          );
          if (selectedTraveler) {
            util.setSelectedTraveller(selectedTraveler);
            await editResidence();
          }
        },
      },
    },
    garden.will.travellers
  );

}

async function eatApple() {
  if (fs.existsSync(getPath("loop.txt"))) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await garden.soil.waitForSelector(SELECTORS.dataEntry.spinnerImage, {
      hidden: true,
    });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await simulateScan(util.getSelectedTraveler());
  }
}

async function simulateScan(paxNumber) {
  const human = garden.will.travellers[paxNumber];
  await util.clickWhenReady(SELECTORS.dataEntry.automaticScan, garden.soil);
  await new Promise((resolve) => setTimeout(resolve, 100));
  await util.clickWhenReady(SELECTORS.dataEntry.startScanButton, garden.soil);
  await new Promise((resolve) => setTimeout(resolve, 100));
  await scan(paxNumber);
  await new Promise((resolve) => setTimeout(resolve, 2000));
  await garden.soil.waitForSelector(SELECTORS.dataEntry.passportPhotoButton);
  const areYouReady = await util.downloadAndResizeImage(
    human,
    200,
    200,
    "passport"
  );
  await util.commitFile(SELECTORS.dataEntry.passportPhotoInput, areYouReady);
  await new Promise((resolve) => setTimeout(resolve, 2000));
  try {
    const success = await waitForPleaseWaitToDisappear();
    if (success) {
      await garden.soil.waitForSelector(SELECTORS.dataEntry.confirmScanButton, {
        visible: true,
      });
      await util.clickWhenReady(
        SELECTORS.dataEntry.confirmScanButton,
        garden.soil
      );

      await new Promise((resolve) => setTimeout(resolve, 1000));
      // Check if next button is visible and clickable
      const nextButton = await garden.soil.$(SELECTORS.dataEntry.nextButton, {
        visible: true,
      });
      if (nextButton) {
        await util.clickWhenReady(SELECTORS.dataEntry.nextButton, garden.soil);
      } else {
        console.log("Next button is not visible or clickable.");
      }
    }
  } catch {}
}

async function scan(paxNumber) {
  await util.infoMessage(
    garden.soil,
    `${parseInt(paxNumber.toString()) + 1}/${garden.will.travellers.length}`
  );
  if (paxNumber == "-1") {
    const browser = await garden.soil.browser();
    browser.disconnect();
  }
  var human = garden.will.travellers[paxNumber];
  if (!human) {
    console.error("No human found for the given paxNumber:", paxNumber);
    return;
  }
  if (sent[human.passportNumber] === undefined) {
    await garden.soil.keyboard.type(human.codeline);
  } else {
    const reissuedPassport = util.generateMRZ(human);
    console.log("📢[ehj.js:470]: reissuedPassport: ", reissuedPassport);
    await garden.soil.keyboard.type(reissuedPassport);
  }
}

async function feedPlant(plant) {
  if (plant.url === "pub/login") {
    await completeProtection(plant);
    return;
  }
  const human = garden.will.travellers[util.getSelectedTraveler()];
  await util.commit(garden.soil, plant.slots, human);
}

async function waitForPleaseWaitToDisappear(timeout = 10000, interval = 300) {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const isVisible = await garden.soil.evaluate(() => {
      const elements = Array.from(document.querySelectorAll("body *"));
      return elements.some((el) => {
        const text = el.textContent?.trim();
        const style = window.getComputedStyle(el);
        return (
          text === "Please wait" &&
          style.display !== "none" &&
          style.visibility !== "hidden"
        );
      });
    });

    if (!isVisible) {
      console.log("✅ 'Please wait' is gone.");
      return true;
    }

    await new Promise((r) => setTimeout(r, interval));
  }

  console.warn("⏰ Timeout: 'Please wait' is still visible after timeout.");
  return false;
}

async function moreAndMore(plant) {
  feedPlant(plant);

  await new Promise((resolve) => setTimeout(resolve, 1000));
  await markTheDate(SELECTORS.additionalData.dateIntoKSA, "18-05-2025");
  try {
    await garden.soil.$eval(SELECTORS.additionalData.notEmployed, (el) =>
      el.click()
    );
  } catch {}

  await new Promise((resolve) => setTimeout(resolve, 1000));
  await clickNext(SELECTORS.additionalData.nextButton);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  try {
    await clickNext(SELECTORS.additionalData.nextButton);
  } catch {}
}

async function markTheDate(selector, value) {
  const dateSelector = await garden.soil.$(selector);
  await dateSelector.evaluate((el) => {
    el.removeAttribute("readonly");
    el.setAttribute("role", "");
  });
  await util.commit(
    garden.soil,
    [
      {
        selector: selector,
        value: (row) => value,
      },
    ],
    {}
  );
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
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const human = garden.will.travellers[util.getSelectedTraveler()];
  await util.commit(garden.soil, e.slots, human);
  await garden.soil.$eval(
    SELECTORS.identityAndResidence.PassIssueDate,
    (el, passportData) =>
      (el.textContent = `Passport Issue Date: ${passportData.passIssueDt.dd}-${passportData.passIssueDt.mm}-${passportData.passIssueDt.yyyy}`),
    human
  );
  await markTheDate(
    SELECTORS.identityAndResidence.passIssueDataCalendarField,
    `${human.passIssueDt.dd}-${human.passIssueDt.mm}-${human.passIssueDt.yyyy}`
  );
  await garden.soil.$eval(SELECTORS.identityAndResidence.placeOfIssue, (el) =>
    el.click()
  );
  await new Promise((resolve) => setTimeout(resolve, 1000));
  await selectDropdownByXPathOrFirstOption(
    SELECTORS.identityAndResidence.embassyXPath,
    "PUT YOUR EMBASSY NAME HERE"
  );
  await selectDropdownByXPathAndText(
    SELECTORS.identityAndResidence.passportTypeXPath,
    "Normal"
  );
  try {
    await garden.soil.$eval(SELECTORS.identityAndResidence.normalHajj, (el) =>
      el.click()
    );
  } catch {}

  // Residence
  try {
    const residenceImage = await garden.soil.$(
      SELECTORS.identityAndResidence.residenceIdImage
    );
    if (residenceImage) {
      // if (garden.will.travellers[util.getSelectedTraveler()].images.id) {
      //   await plantTomato(human);
      // } else {
      await plantApple(human);
      // }
    }
  } catch {}

  await new Promise((resolve) => setTimeout(resolve, 1000));
  await clickNext(SELECTORS.identityAndResidence.nextButton);
}

async function editResidence() {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const human = garden.will.travellers[util.getSelectedTraveler()];
  await util.commit(garden.soil, e.slots, human);


  // Residence
  try {
    const residenceImage = await garden.soil.$(
      SELECTORS.identityAndResidence.residenceIdImage
    );
    if (residenceImage) {
      // if (garden.will.travellers[util.getSelectedTraveler()].images.id) {
      //   await plantTomato(human);
      // } else {
      await plantTomato(human);
      // }
    }
  } catch {}

  await new Promise((resolve) => setTimeout(resolve, 1000));
  await clickNext(SELECTORS.identityAndResidence.nextButton);
}

async function plantTomato(human) {
  const myResidenceId = await util.downloadAndResizeImage(
    human,
    200,
    200,
    "id"
  );
  await util.commitFile(SELECTORS.dataEntry.residenceIdImage, myResidenceId);
  await util.commit(
    garden.soil,
    [
      {
        selector: SELECTORS.identityAndResidence.residenceIdNumber,
        value: (row) => row.residenceId,
      },
    ],
    human
  );

  await markTheDate(
    SELECTORS.identityAndResidence.residenceIdIssueDate,
    `${human.idIssueDt.dd}-${human.idIssueDt.mm}-${human.idIssueDt.yyyy}`
  );
  await markTheDate(
    SELECTORS.identityAndResidence.residenceIdExpireDate,
    `${human.idExpireDt.dd}-${human.idExpireDt.mm}-${human.idExpireDt.yyyy}`
  );
}

async function plantApple(human) {
  const myPassport = await util.downloadAndResizeImage(
    human,
    200,
    200,
    "passport"
  );
  await util.commitFile(
    SELECTORS.identityAndResidence.residenceIdImage,
    myPassport
  );
  await util.commit(
    garden.soil,
    [
      {
        selector: SELECTORS.identityAndResidence.residenceIdNumber,
        value: (row) => row.passportNumber,
      },
    ],
    human
  );
  await markTheDate(
    SELECTORS.identityAndResidence.residenceIdIssueDate,
    `${human.passIssueDt.dd}-${human.passIssueDt.mm}-${human.passIssueDt.yyyy}`
  );
  await markTheDate(
    SELECTORS.identityAndResidence.residenceIdExpireDate,
    `${human.passExpireDt.dd}-${human.passExpireDt.mm}-${human.passExpireDt.yyyy}`
  );
  await garden.soil.click(SELECTORS.identityAndResidence.placeOfIssue);
}

async function clickNext(nextSelector) {
  const isClickable = await garden.soil.evaluate((selector) => {
    const button = document.querySelector(selector);
    if (!button) return false;

    const rect = button.getBoundingClientRect();
    const style = window.getComputedStyle(button);

    return (
      style.visibility !== "hidden" &&
      style.display !== "none" &&
      !button.disabled &&
      rect.width > 0 &&
      rect.height > 0
    );
  }, nextSelector);

  if (isClickable) {
    await garden.soil.click(nextSelector);
  }
}

async function selectDropdownByXPathAndText(dropdownXPath, visibleText) {
  // Evaluate the logic in the browser context using the provided XPath
  await garden.soil.evaluate(
    async (dropdownXPath, visibleText) => {
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

      // Find the dropdown trigger using XPath
      const trigger = document.evaluate(
        dropdownXPath +
          '//p-dropdown//div[contains(@class,"p-dropdown-trigger")]',
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      ).singleNodeValue;

      if (!trigger) {
        console.warn("Dropdown trigger not found.");
        return;
      }

      // Simulate opening the dropdown
      trigger.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      trigger.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      // Wait and search for the correct item
      let found = false;
      for (let i = 0; i < 20; i++) {
        const allItems = Array.from(
          document.querySelectorAll(".p-dropdown-item")
        );
        const option = allItems.find(
          (el) => el.textContent.trim() === visibleText
        );

        if (option) {
          option.scrollIntoView();
          option.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
          option.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
          option.dispatchEvent(new MouseEvent("click", { bubbles: true }));
          found = true;
          break;
        }

        await sleep(200);
      }

      if (!found) console.warn(`Option "${visibleText}" not found.`);
    },
    dropdownXPath,
    visibleText
  );
}

async function selectDropdownByXPathOrFirstOption(dropdownXPath, visibleText) {
  await garden.soil.evaluate(
    async (dropdownXPath, visibleText) => {
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

      const trigger = document.evaluate(
        dropdownXPath +
          '//p-dropdown//div[contains(@class,"p-dropdown-trigger")]',
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      ).singleNodeValue;

      if (!trigger) {
        console.warn("Dropdown trigger not found.");
        return;
      }

      trigger.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      trigger.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      let option = null;
      for (let i = 0; i < 20; i++) {
        const allItems = Array.from(
          document.querySelectorAll(".p-dropdown-item")
        );
        option =
          allItems.find((el) => el.textContent.trim() === visibleText) ||
          allItems[0];

        if (option) {
          option.scrollIntoView();
          option.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
          option.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
          option.dispatchEvent(new MouseEvent("click", { bubbles: true }));
          return;
        }

        await sleep(400);
      }

      console.warn(`No options found in dropdown at: ${dropdownXPath}`);
    },
    dropdownXPath,
    visibleText
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

  await selectDropdownByXPathAndText(
    SELECTORS.basicData.maritalStatusXPath,
    "Other"
  );

  await new Promise((resolve) => setTimeout(resolve, 500));
  await selectDropdownByXPathOrFirstOption(
    SELECTORS.basicData.countryCodeXPath,
    "PUT SOMETHING HERE"
  );
  await new Promise((resolve) => setTimeout(resolve, 200));
  await garden.soil.$eval(SELECTORS.basicData.referenceRadio, (el) =>
    el.click()
  );
  await new Promise((resolve) => setTimeout(resolve, 1000));
  await clickNext(SELECTORS.basicData.nextButton);
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
  await new Promise((resolve) => setTimeout(resolve, 1000));
  await util.clickWhenReady(SELECTORS.questions.nextButton, garden.soil);
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
  await new Promise((resolve) => setTimeout(resolve, 1000));
  await garden.soil.evaluate(() => {
    const container = document.querySelector(
      "#content > div > app-applicant-add > app-review-application"
    );
    if (container) {
      const lastChild = container.lastElementChild;
      if (lastChild && typeof lastChild.scrollIntoView === "function") {
        lastChild.scrollIntoView({ behavior: "smooth", block: "end" });
      } else {
        console.log("No scrollable child found");
      }
    } else {
      console.log("Container not found");
    }
  });

  await new Promise((resolve) => setTimeout(resolve, 1000));
  // Click all checkboxes that are not disabled
  await safeClickCheckboxes(3);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  // Click the "Next" button
  await clickNext(SELECTORS.reviewApplication.nextButton);
}

async function safeClickCheckboxes(maxCount = 2) {
  await garden.soil.evaluate((maxCount) => {
    try {
      const checkboxes = Array.from(
        document.querySelectorAll("div.p-checkbox-box")
      ).slice(0, maxCount);

      if (checkboxes.length < maxCount) {
        console.warn("Less than two enabled checkboxes found");
      }

      checkboxes.forEach((checkbox, index) => {
        try {
          checkbox.click();
          console.log(`Clicked checkbox ${index + 1}`);
        } catch (err) {
          console.error(`Failed to click checkbox ${index + 1}`, err);
        }
      });
    } catch (error) {
      console.error("Checkbox click script failed:", error);
    }
  }, maxCount);
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

  try {
    if (fs.existsSync(getPath("loop.txt"))) {
      util.incrementSelectedTraveler();
      await new Promise((resolve) => setTimeout(resolve, 10000));
      await garden.soil.click(SELECTORS.applicantList.addPilgrimsButton);
    }
  } catch {}
}

async function enterGarden() {
  await garden.soil.click(SELECTORS.groupList.newGroupButton);
}
module.exports = {
  showController,
  showEditController,
  eatApple,
  feedPlant,
  secure,
  whereDoYouLive,
  editResidence,
  tellMeAboutYourSelf,
  answerQuestions,
  recheck,
  advance,
  showApplicantListCommander,
  garden,
  moreAndMore,
  enterGarden
};
