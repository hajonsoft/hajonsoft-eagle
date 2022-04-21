const puppeteer = require("puppeteer-extra");
// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const fs = require("fs");
const path = require("path");
const util = require("./util");
const moment = require("moment");
const sharp = require("sharp");
const homedir = require("os").homedir();
const SMS = require('./sms')
let page;
let data;
let counter = 0;

const config = [
  {
    name: "home",
    url: "https://ehaj.haj.gov.sa/",
    regex: "https://ehaj.haj.gov.sa/$",
  },
  {
    name: "login",
    regex: "https://ehaj.haj.gov.sa/EH/login.xhtml",
    details: [
      {
        selector: "#j_username",
        value: (row) => row.username,
      },
      {
        selector: "#j_password",
        value: (row) => row.password,
      },
    ],
  },
  {
    name: "reserve",
    regex: "https://ehaj.haj.gov.sa/EPATH",
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
    case "home":
      try {
        await page.$$eval("#pulsate-regular > a", (el) => el.removeAttribute("target"));
      } catch {}
      break
    case "login":
      await util.commit(page, currentConfig.details, data.system);
      const smsNumber = await SMS.runGetSMSNumber();
      if (smsNumber?.error){
        return console.log(smsNumber.error);
      }
      break;
    case "reserve":

    default:
      break;
  }
}

module.exports = { send };
