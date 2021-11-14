const puppeteer = require("puppeteer-extra");
// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const fs = require("fs");
const path = require("path");
const util = require("./util");
const moment = require("moment");
const sharp = require("sharp");
let page;
let data;
let counter = 0;
let groupNumber;
const config = [
  {
    name: "login",
    url: "https://www.etawaf.com/tawaf43/index.html?locale=en",
    details: [
      {
        selector:
          "#login > table > tbody > tr > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(3) > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr > td:nth-child(2) > input",
        value: (system) => system.username,
      },
      {
        selector:
          "#login > table > tbody > tr > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(3) > td > table > tbody > tr:nth-child(3) > td > table > tbody > tr > td:nth-child(2) > input",
        value: (system) => system.password,
      },
    ],
  },
];

async function send(sendData) {
  data = sendData;
  page = await util.initPage(config, onContentLoaded);
  await page.goto(config[0].url, { waitUntil: "domcontentloaded" });
}

async function onContentLoaded(res) {
  counter = util.useCounter(counter);
  if (counter >= data?.travellers?.length) {
    return;
  }
  const currentConfig = util.findConfig(await page.url(), config);
  try {
    await pageContentHandler(currentConfig);
  } catch (err) {
    console.log(err);
  }
}

async function pageContentHandler(currentConfig) {
  const passenger = data.travellers[counter];
  switch (currentConfig.name) {
    case "login":
      await util.commit(page, currentConfig.details, data.system);
      util.endCase(currentConfig.name);
      await util.waitForCaptcha(
        "#login > table > tbody > tr > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(3) > td > table > tbody > tr:nth-child(5) > td > table > tbody > tr > td:nth-child(2) > input",
        5
      );
      await page.click(
        "#login > table > tbody > tr > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(3) > td > table > tbody > tr:nth-child(6) > td > button"
      );
      await page.waitForXPath("//button[contains(text(), 'Upload Passport')]");
      // const inputs = await page.$x(`//input[@type="text"]`);
      // console.log('%cMyProject%cline:67%cinput.length', 'color:#fff;background:#ee6f57;padding:3px;border-radius:2px', 'color:#fff;background:#1f3c88;padding:3px;border-radius:2px', 'color:#fff;background:rgb(3, 101, 100);padding:3px;border-radius:2px', inputs.length)
      // if (inputs.length){
      //   let i = 1;
      //   for (const input of inputs){
      //     await input.type((i++).toString());

      //   }
      // }

      await util.commit(page, [
        {
          xPath: '//input[@type="text"]',
          index: 38,
          value: (row) => row.name.first
        },
        {
          xPath: '//input[@type="text"]',
          index: 39,
          value: (row) => row.name.father
        },
        {
          xPath: '//input[@type="text"]',
          index: 40,
          value: (row) => row.name.grand
        },
        {
          xPath: '//input[@type="text"]',
          index: 41,
          value: (row) => row.name.last
        },
        {
          xPath: '//input[@type="text"]',
          index: 46,
          value: (row) => row.birthPlace
        },
      ], data.travellers[0]);


      break;
    default:
      break;
  }
}

module.exports = { send };
