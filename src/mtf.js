const puppeteer = require("puppeteer-extra");
// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const fs = require("fs");
const path = require("path");
const budgie = require("./budgie");
const util = require("./util");
const moment = require("moment");
const sharp = require("sharp");
const homedir = require("os").homedir();
const SMS = require("./sms");
const email = require("./email");
const totp = require("totp-generator");
const { default: axios } = require("axios");

let page;
let data;
let counter = 0;

const config = [
  {
    name: "home",
    url: "https://www.motawif.com.sa/",
    regex: "https://www.motawif.com.sa/home/[a-z]{2}-[a-z]{2}$",
    controller: {
      selector: "body > header > div > div",
      action: async () => {
        const selectedTraveler = await page.$eval(
          "#hajonsoft_select",
          (el) => el.value
        );
        if (selectedTraveler) {
          fs.writeFileSync("./selectedTraveller.txt", selectedTraveler);
          await sendPassenger(selectedTraveler);
        }
      },
    },
  },
  {
    name: "thankyou",
    url: "https://www.motawif.com.sa/home/en-sa/thankyou",
  },
];

async function sendPassenger(selectedTraveler) {
  const data = fs.readFileSync("./data.json", "utf-8");
  var passengersData = JSON.parse(data);
  const passenger = passengersData.travellers[selectedTraveler];
  await page.type("#FirstName", passenger.name.first);
  await page.type("#LastName", passenger.name.last);
  await page.type(
    "#Email",
    passenger.name.first + passenger.name.last + "@gmail.com"
  );
  await page.type("#PhoneNumber", moment().format("9MMDDHHmmss"));
  await util.commit(page, [
    {
      selector: "#cor",
      value: () => budgie.get("motawif_country_of_residence", "US"),
    },
  ]);
}

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
      const acceptCookiesButton = await page.$(
        "body > div.cky-consent-container.cky-classic-bottom > div.cky-consent-bar > div.cky-notice > div > div.cky-notice-btn-wrapper > button.cky-btn.cky-btn-accept"
      );
      if (acceptCookiesButton) {
        await acceptCookiesButton.click();
      }
      if (fs.existsSync("./loop.txt") && fs.existsSync("./selectedTraveller.txt")) {
        sendPassenger(fs.readFileSync("./selectedTraveller.txt", "utf-8"));
      }
      await util.controller(page, currentConfig, data.travellers);
      await util.commander(page, {
        controller: {
          selector:
            "body > div.hero__section > div > div > div.hero__info > p:nth-child(3)",
          title: "Remember",
          arabicTitle: "تذكر",
          action: async () => {
            const cor = await page.$eval("#cor", (el) => el.value);
            if (cor) {
              budgie.save("motawif_country_of_residence", cor);
            }
          },
        },
      });
      break;
    case "thankyou":
      const selectedTravelerRaw = fs.readFileSync(
        "./selectedTraveller.txt",
        "utf-8"
      );
      if (selectedTravelerRaw) {
        if (/\d+/.test(selectedTravelerRaw)) {
          const selectedTraveler = parseInt(selectedTravelerRaw);
          fs.writeFileSync("./selectedTraveller.txt", (selectedTraveler + 1).toString());
        }
      }
      await page.goto("https://www.motawif.com.sa");
      break;
    default:
      break;
  }
}

module.exports = { send };
