const puppeteer = require("puppeteer-extra");
// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const fs = require("fs");
const path = require("path");
const util = require("./util");
const moment = require("moment");
const sharp = require("sharp");
const os = require("os");
const { default: axios } = require("axios");

const SERVER_NUMBER = 1;
let page;
let data;
let counter = 0;
let configs = [];

const config = [
  {
    name: "login",
    url: `https://github.com/hajonsoft/hajonsoft-eagle/actions/workflows/submit.yml`,
  },
];

async function send(sendData) {
  data = sendData;
  data.info.caravan = data?.info?.caravan?.replace(/CLOUD_/g, "");
  page = await util.initPage(config, onContentLoaded, data);
  await page.goto(config[0].url, { waitUntil: "domcontentloaded" });
  await page.browser().disconnect();
}

async function onContentLoaded(res) {
  const currentConfig = util.findConfig(await page.url(), config);
  configs.push(currentConfig);
  try {
    await runPageConfiguration(currentConfig);
  } catch (err) {
    console.log(err);
  }
}

async function runPageConfiguration(currentConfig) {
  switch (currentConfig.name) {
    case "login":
      await util.commit(page, currentConfig.details, data.system);
      break;
    default:
      break;
  }
}

module.exports = { send, config, SERVER_NUMBER };
