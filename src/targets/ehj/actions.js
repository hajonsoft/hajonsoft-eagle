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

  // TODO: check if loop.txt file is present and just go ahead and send the correct passenger.
  if (fs.existsSync(getPath("loop.txt"))) {
    util.incrementSelectedTraveler();
    await help(util.getSelectedTraveler());
  }
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
  const human = garden.will.travellers[util.getSelectedTraveler()];
  const dateToEnter = await garden.soil.$(SELECTORS.additionalData.dateIntoKSA);
  await dateToEnter.evaluate((el) => {
    el.removeAttribute("readonly");
    el.setAttribute("role", "");
  });
  await util.commit(
    garden.soil,
    [
      {
        selector: SELECTORS.additionalData.dateIntoKSA,
        value: (row) => `18-05-2025`,
      },
    ],
    human
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
  // for passport issue date field, remove the readonly attribute, and the role attribute, or at least make the role empty
  const passIssueDateField = await garden.soil.$(
    SELECTORS.identityAndResidence.passIssueDataCalendarField
  );
  await passIssueDateField.evaluate((el) => {
    el.removeAttribute("readonly");
    el.setAttribute("role", "");
  });
  await util.commit(
    garden.soil,
    [
      {
        selector: SELECTORS.identityAndResidence.passIssueDataCalendarField,
        value: (row) =>
          `${row.passIssueDt.dd}-${row.passIssueDt.mm}-${row.passIssueDt.yyyy}`,
      },
    ],
    human
  );
  await garden.soil.$eval(
    SELECTORS.identityAndResidence.placeOfIssue,
    (el) => el.click()
  );
  await new Promise((resolve) => setTimeout(resolve, 1000));
  await selectFirstItemInAllDropdowns();
}

async function selectFirstItemInAllDropdowns() {
  await garden.soil.evaluate(async () => {
    try {
      const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

      const dropdowns = Array.from(
        document.querySelectorAll("div#dropDownId.p-dropdown")
      );

      for (const dropdown of dropdowns) {
        try {
          if (dropdown.classList.contains("p-disabled")) continue;

          const trigger = dropdown.querySelector(".p-dropdown-trigger");
          if (trigger)
            trigger.dispatchEvent(new MouseEvent("click", { bubbles: true }));

          await sleep(300); // Give time for the dropdown to populate

          const label = dropdown.querySelector('[role="combobox"]');
          const listId = label?.getAttribute("aria-controls");
          if (!listId) continue;

          const list = document.getElementById(listId);
          const firstItem = list?.querySelector(".p-dropdown-item");

          if (firstItem) {
            firstItem.dispatchEvent(new MouseEvent("click", { bubbles: true }));
          }

          await sleep(300); // Space out clicks
        } catch (innerErr) {
          console.warn("Dropdown interaction failed on one element:", innerErr);
          continue;
        }
      }
    } catch (err) {
      console.error("Dropdown selection failed completely:", err);
    }
  });
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

  await chooseMaritalStatusAndCountryCode();
}

async function chooseMaritalStatusAndCountryCode() {
  await garden.soil.evaluate(async (countryCodeToSelect = "225") => {
    try {
      const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

      const openDropdownAndSelect = async (labelText, optionSelector) => {
        try {
          const dropdown = Array.from(
            document.querySelectorAll("p-dropdown")
          ).find((el) => {
            const label = el.querySelector('[role="combobox"]');
            return label
              ?.getAttribute("aria-label")
              ?.toLowerCase()
              .includes(labelText.toLowerCase());
          });

          if (!dropdown) {
            console.warn(`Dropdown with label "${labelText}" not found`);
            return;
          }

          const trigger = dropdown.querySelector(".p-dropdown-trigger");
          if (trigger)
            trigger.dispatchEvent(new MouseEvent("click", { bubbles: true }));
          await sleep(300);

          const label = dropdown.querySelector('[role="combobox"]');
          const listId = label?.getAttribute("aria-controls");
          if (!listId) return;

          const list = document.getElementById(listId);
          if (!list) return;

          const option = optionSelector(list);
          if (option) {
            option.dispatchEvent(new MouseEvent("click", { bubbles: true }));
          } else {
            console.warn(`Option not found for label "${labelText}"`);
          }

          await sleep(300);
        } catch (err) {
          console.warn(`Error handling dropdown for label "${labelText}"`, err);
        }
      };

      // Select last option for Marital Status
      await openDropdownAndSelect("Marital status", (list) => {
        const items = list.querySelectorAll(".p-dropdown-item");
        return items[items.length - 1] ?? null;
      });

      // Select matching country code (e.g. 225)
      await openDropdownAndSelect("Please Select", (list) => {
        const items = Array.from(list.querySelectorAll(".p-dropdown-item"));
        return (
          items.find((item) =>
            item.textContent?.includes(countryCodeToSelect)
          ) ?? null
        );
      });
    } catch (err) {
      console.error("Error selecting dropdown values:", err);
    }
  }, garden.will.system.country.telCode); // Pass the desired country code here
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
  // await safeClickCheckboxes();
}

async function safeClickCheckboxes() {
  await garden.soil.evaluate(() => {
    try {
      const checkboxes = Array.from(
        document.querySelectorAll('div.p-checkbox-box[data-p-disabled="false"]')
      ).slice(0, 2);

      if (checkboxes.length < 2) {
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
  });
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
  moreAndMore,
};
