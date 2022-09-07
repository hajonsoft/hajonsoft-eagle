const puppeteer = require("puppeteer-extra");
// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const util = require("./util");

let page;
let data;
let counter = 0;
let configs = [];

const config = [
  {
    name: "login",
    url: `https://github.com/hajonsoft/hajonsoft-eagle/actions/workflows/eagle.yml`,
  },
];

async function send(sendData) {
  data = sendData;
  data.info.caravan = data?.info?.caravan?.replace(/CLOUD_/g, "");
  page = await util.initPage(config, onContentLoaded, data);
  await page.goto(config[0].url, { waitUntil: "domcontentloaded" });
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
      await page.waitForTimeout(10000);
      setTimeout(async () => {
        await page.reload({ waitUntil: "domcontentloaded" });
      }, 10000);
      break;
    default:
      break;
  }
}

module.exports = { send, config, SERVER_NUMBER };
