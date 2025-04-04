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
      new RegExp(pageToObserve.url.toLowerCase()).test(
        currentUrl.toLowerCase()
      ) &&
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
];

module.exports = { send };
