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
const SMS = require("./sms");
const totp = require("totp-generator");

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
    name: "otp",
    regex: "https://ehaj.haj.gov.sa/EH/mobileVerify.xhtml",
  },
  {
    name: "dashboard",
    regex: "https://ehaj.haj.gov.sa/EH/pages/home/dashboard.xhtml",
  },
  {
    name: "add-mission-pilgrim",
    regex:
      "https://ehaj.haj.gov.sa/EH/pages/hajMission/lookup/hajData/AddMrz.xhtml",
    controller: {
      selector: "#passportImage > p",
      action: async () => {
        const selectedTraveler = await page.$eval(
          "#hajonsoft_select",
          (el) => el.value
        );
        console.log('%c 🍡 selectedTraveler: ', 'font-size:20px;background-color: #EA7E5C;color:#fff;', selectedTraveler);
        if (selectedTraveler) {
          fs.writeFileSync("./selectedTraveller.txt", selectedTraveler);
          const data = fs.readFileSync("./data.json", "utf-8");
          var passengersData = JSON.parse(data);
          await page.focus("#passportCaptureStatus");
          if (selectedTraveler == "-1") {
            const browser = await page.browser();
            browser.disconnect();
          }
          var passenger = passengersData.travellers[selectedTraveler];
          await page.keyboard.type(passenger.codeline);

        }
      },
    },
  },
  {
    name: "add-mission-pilgrim-3",
    regex:
      "https://ehaj.haj.gov.sa/EH/pages/hajMission/lookup/hajData/Add3.xhtml",
    details: [
      {
        selector: "#reference1",
        value: (row) =>
          row.slug < 40
            ? row.slug
            : row.slug.substring(row.slug.length - 40, row.slug.length),
      },
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
        value: (row) => row.birthPlace,
      },
      {
        selector: "#address",
        value: (row) => row.address,
      },
      {
        selector: "#passportIssueDate",
        value: (row) => row.passIssueDt.dmy,
      },
      {
        selector: "#idno",
        value: (row) => row.passportNumber,
      },
      {
        selector: "#iqamaNo",
        value: (row) => row.idNumber,
      },
      {
        selector: "#iqamaIssueDate",
        value: (row) => row.passIssueDt.dmy,
      },
      {
        selector: "#iqamaExpiryDate",
        value: (row) => row.passExpireDt.dmy,
      },
    ],
  },
  {
    name: "reserve",
    regex: "https://ehaj.haj.gov.sa/EPATH",
  },
  {
    name: "sms",
    regex: "https://ehaj.haj.gov.sa/EH/sms.xhtml",
  },
  {
    name: "sms-confirm",
    regex: "https://ehaj.haj.gov.sa/EH/sms-confirm.xhtml",
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
        await page.$$eval("#pulsate-regular > a", (el) =>
          el.removeAttribute("target")
        );
      } catch {}
      break;
    case "login":
      await util.commit(page, currentConfig.details, data.system);
      if (data.system.username && data.system.password) {
        const loginButton = await page.$x(
          "/html/body/div[2]/div[2]/div/div[2]/div/form/div[4]/div/input"
        );
        if (
          loginButton &&
          Array.isArray(loginButton) &&
          loginButton.length > 0
        ) {
          loginButton[0].click();
        }
      }
      break;
    case "otp":
      // if ((await page.$(".insecure-form")) !== null) {
      //   await page.click("#proceed-button");
      //   await page.waitForNavigation({ waitUntil: "networkidle0" });
      // }
      const messageSelector = "#mobileVerForm > h5";
      await page.waitForSelector(messageSelector);
      const message = await page.$eval(messageSelector, (el) => el.innerText);
      if (
        (message.includes("generated by Google Authenticator") ||
          message.includes("ديك في تطبيق Google Authenticator")) &&
        data.system.ehajCode
      ) {
        const token = totp(data.system.ehajCode);
        await page.type("#code", token);
        const submitButton = await page.$x(
          "/html/body/div[1]/div[2]/div[1]/form/div[2]/div/div/input[1]"
        );
        if (
          submitButton &&
          Array.isArray(submitButton) &&
          submitButton.length > 0
        ) {
          submitButton[0].click();
        }
      }

      break;
    case "dashboard":
      await page.goto(
        "https://ehaj.haj.gov.sa/EH/pages/hajMission/lookup/hajData/AddMrz.xhtml"
      );
      break;
    case "add-mission-pilgrim":
      await util.controller(page, currentConfig, data.travellers);
      await page.waitForSelector("#proceedButton > div > input", {
        visible: true,
        timeout: 0,
      });
      await page.click("#proceedButton > div > input");
      break;
    case "add-mission-pilgrim-3":
      await util.commit(page, currentConfig.details, passenger);
      await page.select("#passportType", "1");
      await page.select("#vaccineType", "1");
      await page.waitForSelector("#hdcviSecondDoseDate");
      await page.type(
        "#hdcviFirstDoseDate",
        moment().add(-60, "days").format("DD/MM/YYYY")
      );
      await page.type(
        "#hdcviSecondDoseDate",
        moment().add(-30, "days").format("DD/MM/YYYY")
      );
      // TODO: // Wait for #iqamaNo if the passenger nationality is not equal to local nationality

      // await page.waitForSelector("#iqamaNo")
      let resizedPhotoPath = await util.downloadAndResizeImage(
        passenger,
        200,
        200,
        "photo"
      );
      const resizedVaccinePath = await util.downloadAndResizeImage(
        passenger,
        100,
        100,
        "vaccine"
      );
      const resizedVaccinePath2 = await util.downloadAndResizeImage(
        passenger,
        100,
        100,
        "vaccine2"
      );
      await page.click("#vaccine_attmnt_1_input");
      await util.commitFile("#vaccine_attmnt_1_input", resizedVaccinePath);
      await page.click("#vaccine_attmnt_2_input");
      await util.commitFile("#vaccine_attmnt_2_input", resizedVaccinePath2);
      await page.waitForTimeout(1000);
      await page.click("#attachment_input");
      await util.commitFile("#attachment_input", resizedPhotoPath);
      break;
    case "reserve":

    default:
      break;
  }
}

module.exports = { send };
