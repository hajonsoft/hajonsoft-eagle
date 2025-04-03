const puppeteer = require("puppeteer-extra");
// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const fs = require("fs");
const budgie = require("../../budgie");
const util = require("../../util");
const { getPath } = require("../../lib/getPath");
const moment = require("moment");
const { CONFIG, baseAddress } = require("./config.js");

let page;
let data;
let sent = {};

async function send(sendData) {
  data = sendData;
  page = await util.initPage(config, onContentLoaded);
  let startingUrl = CONFIG.pages.home.url;
  if (global.headless || global.visualHeadless) {
    startingUrl = CONFIG.pages.login.url;
  }
  await page.goto(startingUrl, { waitUntil: "domcontentloaded" });
  startTimerObserver();
}

async function onContentLoaded() {}

async function startTimerObserver() {
  setInterval(() => {
    CheckAllPages();
  }, 100);
}

async function CheckAllPages() {
  const currentUrl = await page.url();
  for (const pageName of Object.keys(CONFIG.pages)) {
    const pageToObserve = CONFIG.pages[pageName];
    if (
      pageToObserve.url &&
      pageToObserve.requiredSelectors &&
      new RegExp(pageToObserve.url.toLowerCase()).test(currentUrl.toLowerCase()) &&
      !pageToObserve.active
    ) {
      const allSelectorsPresent = await checkSelectorsPresent(
        page,
        pageToObserve.requiredSelectors
      );

      console.log(
        "Checking required selectors for",
        pageName,
        allSelectorsPresent
      );
      if (allSelectorsPresent) {
        if (pageToObserve.action) {
          setPageActive(pageName);
          await pageToObserve.action(page, data, pageToObserve);
        }
        break;
      }
    }
  }
}

function setPageActive(pageName) {
  for (const pageKey of Object.keys(CONFIG.pages)) {
    if (pageKey === pageName) {
      CONFIG.pages[pageKey].active = true;
    } else {
      CONFIG.pages[pageKey].active = false;
    }
  }
}

async function checkSelectorsPresent(page, requiredSelectors) {
  // Use Promise.all to check all selectors concurrently
  const results = await Promise.all(
    requiredSelectors.map(async (selector) => {
      const element = await page.$(selector); // Try to get the element
      return !!element; // Return true if element exists, false if it doesn't
    })
  );

  // Check if all selectors are present
  const allSelectorsPresent = results.every((exists) => exists);
  return allSelectorsPresent;
}

const config = [
  {
    name: "login",
    regex: `${baseAddress}/pub/login`,
    details: [
      {
        selector:
          "#login > app-login > div.log-card.ng-star-inserted > form > div > div.col-sm-12.form-mb > g-input-text > div > input",
        value: (row) => row.username,
      },
      {
        selector:
          "#login > app-login > div.log-card.ng-star-inserted > form > div > div.col-sm-12.mb-2 > p-password > div > input",
        value: (row) => row.password,
      },
    ],
  },
  {
    name: "add-pilgrim-select-method",
    regex: `https://masar.nusuk.sa/protected-applicant-st/add/data-entry-method`,
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
  {
    name: "add-pilgrim-basic-data",
    regex: "https://masar.nusuk.sa/protected-applicant-st/add/basic-data",
  },
  {
    name: "add-pilgrim-additional-data",
    regex: "https://masar.nusuk.sa/protected-applicant-st/add/additinal-data",
  },
  {
    name: "haj-mission-group-details",
    regex:
      "https://ehaj.haj.gov.sa/EH/pages/hajMission/lookup/hajGroup/View.xhtml",
  },
  {
    name: "add-pilgrim-select-method-company",
    regex:
      "https://ehaj.haj.gov.sa/EH/pages/hajCompany/lookup/hajData/Add1.xhtml",
  },
  {
    name: "mission-questionnaire",
    regex:
      "https://ehaj.haj.gov.sa/EH/pages/hajMission/lookup/hajData/Questionnaire.xhtml",
    details: [
      {
        selector:
          "#kt_app_content_container > div:nth-child(2) > form > div.ui-panel.ui-widget.ui-widget-content.ui-corner-all > div.ui-panel-content.ui-widget-content > div:nth-child(3) > div > input",
        value: (row) => new Date().valueOf().toString(),
      },
      {
        selector:
          "#kt_app_content_container > div:nth-child(2) > form > div.ui-panel.ui-widget.ui-widget-content.ui-corner-all > div.ui-panel-content.ui-widget-content > div:nth-child(4) > div > input",
        value: (row) => {
          const name = `${row.name.first}.${row.name.last}`.substring(0, 20);
          return `${name}.${row.passportNumber}@emailinthecloud.com`.toLowerCase();
        },
      },
      {
        selector:
          "#kt_app_content_container > div:nth-child(2) > form > div.ui-panel.ui-widget.ui-widget-content.ui-corner-all > div.ui-panel-content.ui-widget-content > div:nth-child(8) > div > input",
        value: () => "Employee",
      },
      {
        selector:
          "#kt_app_content_container > div:nth-child(2) > form > div.ui-panel.ui-widget.ui-widget-content.ui-corner-all > div.ui-panel-content.ui-widget-content > div:nth-child(13) > span > div > div > select",
        value: () => "7",
      },
    ],
  },
  {
    name: "company-questionnaire",
    regex: "https://masar.nusuk.sa/protected-applicant-st/add/Questionnaire",
    details: [
      {
        selector:
          "#kt_app_content_container > div:nth-child(2) > form > div.ui-panel.ui-widget.ui-widget-content.ui-corner-all > div.ui-panel-content.ui-widget-content > div:nth-child(3) > div > input",
        value: (row) => new Date().valueOf().toString(),
      },
      {
        selector:
          "#kt_app_content_container > div:nth-child(2) > form > div.ui-panel.ui-widget.ui-widget-content.ui-corner-all > div.ui-panel-content.ui-widget-content > div:nth-child(8) > div > input",
        value: () => "Employee",
      },
      {
        selector:
          "#kt_app_content_container > div:nth-child(2) > form > div.ui-panel.ui-widget.ui-widget-content.ui-corner-all > div.ui-panel-content.ui-widget-content > div:nth-child(13) > span > div > div > select",
        value: () => "7",
      },
    ],
  },
  {
    name: "package-quota-list",
    regex:
      "https://ehaj.haj.gov.sa/EH/pages/hajCompany/lookup/packagesQuota/List.xhtml",
  },
  {
    name: "authentication-settings",
    regex:
      "https://ehaj.haj.gov.sa/EH/pages/home/ChangeRepMobile/newMobile.xhtml",
  },
  {
    name: "hajj-group-details",
    regex: "https://ehaj.haj.gov.sa/EH/pages/hajData/lookup/hajGroup/Add.xhtml",
  },
  {
    name: "otp",
    regex: "https://ehaj.haj.gov.sa/EH/mobileVerify.xhtml",
  },
  {
    name: "profile",
    regex:
      "https://ehaj.haj.gov.sa/EH/pages/home/ChangeRepMobile/gAuthSettings.xhtml",
  },
  {
    name: "profile-verification",
    regex:
      "https://ehaj.haj.gov.sa/EH/pages/home/ChangeRepMobile/verificationCode.xhtml",
  },
  {
    name: "dashboard",
    regex: `https://masar.nusuk.sa/protected/dhc/dashboard/requestsDashboard`,
  },
  {
    name: "list-pilgrims-mission",
    regex:
      "https://ehaj.haj.gov.sa/EH/pages/hajMission/lookup/hajData/List.xhtml",
  },
  {
    name: "list-pilgrims",
    regex: `https://masar.nusuk.sa/protected/applicants-groups/applicants/list`,
  },
  {
    name: "add-mission-pilgrim",
    regex:
      "https://ehaj.haj.gov.sa/EH/pages/hajMission/lookup/hajData/AddMrz.xhtml",
    controller: {
      selector: "#kt_app_content_container > div:nth-child(2) > h1",
      action: async () => {
        const selectedTraveler = await page.$eval(
          "#hajonsoft_select",
          (el) => el.value
        );
        if (selectedTraveler) {
          util.setSelectedTraveller(selectedTraveler);
          if (!fs.existsSync(getPath("loop.txt"))) {
            fs.writeFileSync(getPath("loop.txt"), "ehaj", "utf-8");
          }
          await page.reload();
        }
      },
    },
  },
  {
    name: "add-mission-pilgrim-upload",
    regex:
      "https://ehaj.haj.gov.sa/EH/pages/hajMission/lookup/hajData/AddPassportUpload.xhtml",
    controller: {
      selector: "#kt_app_content_container > div:nth-child(2) > h1",
      name: "uploadHajjPassport",
      action: async () => {
        const selectedTraveler = await page.$eval(
          "#hajonsoft_select",
          (el) => el.value
        );
        if (selectedTraveler) {
          util.setSelectedTraveller(selectedTraveler);
          if (!fs.existsSync(getPath("loop.txt"))) {
            fs.writeFileSync(getPath("loop.txt"), "ehaj", "utf-8");
          }
          await uploadPilgrimViaPassport(selectedTraveler);
        }
      },
    },
  },
  {
    name: "add-company-pilgrim",
    regex:
      "https://ehaj.haj.gov.sa/EH/pages/hajCompany/lookup/hajData/AddMrz.xhtml",

    controller: {
      selector: "#kt_app_content_container > div:nth-child(2) > h1",
      action: async () => {
        const selectedTraveler = await page.$eval(
          "#hajonsoft_select",
          (el) => el.value
        );
        if (selectedTraveler) {
          util.setSelectedTraveller(selectedTraveler);
          if (!fs.existsSync(getPath("loop.txt"))) {
            fs.writeFileSync(getPath("loop.txt"), "ehaj", "utf-8");
          }
          await page.reload();
        }
      },
    },
  },
  {
    name: "edit-pilgrim",
    regex:
      "https://ehaj.haj.gov.sa/EH/pages/hajCompany/lookup/hajData/Edit.xhtml",
  },
  {
    name: "edit-pilgrim-mission",
    regex:
      "https://ehaj.haj.gov.sa/EH/pages/hajMission/lookup/hajData/Edit.xhtml",
  },
  {
    name: "add-mission-pilgrim-3",
    regex:
      "https://ehaj.haj.gov.sa/EH/pages/hajMission/lookup/hajData/Add3.xhtml",
    details: [
      {
        selector: "#fatherNameEn",
        value: (row) => row.name.father,
      },
      {
        selector: "#grandFatherNameEn",
        value: (row) => row.name.grand,
      },
      {
        selector: "#placeofBirth",
        value: (row) => row.birthPlace || row.nationality.name,
      },
      {
        selector: "#address",
        value: (row) => "", // budgie.get("ehaj_pilgrim_address", row.address)
      },
      // {
      //   selector: "#passportIssueDate",
      //   value: (row) => row.passIssueDt.dmy,
      // },
      {
        selector: "#idno",
        value: (row) => "0",
      },
    ],
  },
  {
    name: "add-pilgrim-3",
    regex:
      "https://masar.nusuk.sa/protected-applicant-st/add/Identity-and-residence",
    details: [
      {
        selector: "#fatherNameEn",
        value: (row) => row.name.father,
      },
      {
        selector: "#grandFatherNameEn",
        value: (row) => row.name.grand,
      },
      {
        selector: "#placeofBirth",
        value: (row) => row.birthPlace || row.nationality.name,
      },
      {
        selector: "#address",
        value: (row) => "", // budgie.get("ehaj_pilgrim_address", row.address),
      },
      // {
      //   selector: "#passportIssueDate",
      //   value: (row) => row.passIssueDt.dmy,
      // },
      {
        selector: "#idno",
        value: (row) => "0",
      },
    ],
  },
  {
    name: "sms",
    regex: "https://ehaj.haj.gov.sa/EH/sms.xhtml",
  },
  {
    name: "sms-confirm",
    regex: "https://ehaj.haj.gov.sa/EH/sms-confirm.xhtml",
  },
  {
    name: "package-details",
    regex:
      "https://ehaj.haj.gov.sa/EH/pages/hajCompany/requests/packages/new/packageDetails.xhtml",
    details: [
      {
        selector: "#nameAr",
        value: () => " خدمات رقم " + moment().format("HHmm"),
      },
      {
        selector: "#nameEn",
        value: () => "Service " + moment().format("HHmm"),
      },
      {
        selector: "#pkgDescAr",
        value: (row) => "رحلة الحج من العمر. قم بزيارة مكه وأداء واجب الحج.",
      },
      {
        selector: "#pkgDescEn",
        value: (row) =>
          "Hajj journey of a lifetime. Visit Makkah and perform the duty of Hajj.",
      },
      { selector: "#packageOwnerPrice", value: () => "30000" },
    ],
  },
  {
    name: "housing-contract",
    regex:
      "https://ehaj.haj.gov.sa/EH/pages/hajCompany/requests/housingContr/epayment/List.xhtml",
  },
  {
    name: "package-details-2",
    regex:
      "https://ehaj.haj.gov.sa/EH/pages/hajCompany/requests/packages/new/contractInfo.xhtml",
  },
  {
    name: "house-details",
    regex:
      "https://ehaj.haj.gov.sa/EH/pages/hajCompany/requests/housingContr/epayment/View.xhtml",
  },
  {
    name: "reservation-data-1",
    regex: "https://ehaj.haj.gov.sa/EPATH/pages/StartBooking/hajData.xhtml",
    controller: {
      selector: "body > div.pre-header > div.col-md-10 > div > div.col-md-6",
      name: "makeReservation",
      action: async () => {
        const selectedTraveler = await page.$eval(
          "#hajonsoft_select",
          (el) => el.value
        );
        if (selectedTraveler) {
          util.setSelectedTraveller(selectedTraveler);
          // If there is phone number selected then save it to budgie
          const countryCode = await page.$eval("#countryKey", (el) => el.value);
          if (countryCode) {
            budgie.save("ehaj-reserve-country-code", countryCode.toString());
          } else {
            const budgieCountryCode = budgie.get(
              "ehaj-reserve-country-code",
              "7"
            );
            await page.select("#countryKey", budgieCountryCode.toString());
            await page.waitFor(1000);
          }

          // const newSMSNumber = await SMS.getNewNumber();
          // await page.type("#mobileRep", newSMSNumber?.number?.toString()?.substring(1));

          await makeReservations(selectedTraveler, data);
        }
      },
    },
  },
  {
    name: "review-reservation-1",
    regex: "https://ehaj.haj.gov.sa/EPATH/pages/StartBooking/review.xhtml",
  },
  {
    name: "reservation-complete",
    regex: "https://ehaj.haj.gov.sa/EPATH/pages/StartBooking/home.xhtml",
  },
  {
    name: "add-pilgrim-review-application",
    regex:
      "https://masar.nusuk.sa/protected-applicant-st/add/Review-application",
  },
];

module.exports = { send };
