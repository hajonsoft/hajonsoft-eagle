const puppeteer = require("puppeteer-extra");
// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const fs = require("fs");
const budgie = require("./budgie");
const path = require("path");
const util = require("./util");
const moment = require("moment");
const sharp = require("sharp");
let page;
let data;
let counter = 0;
const defaultNoImage = false;
let groupNumber;
const config = [
  {
    name: "login",
    url: "https://enjazit.com.sa/Account/Login/Person",
    details: [
      {
        selector: "#UserName",
        value: (system) => system.username,
        autocomplete: "username",
      },
      {
        selector: "#Password",
        value: (system) => system.password,
        autocomplete: "password",
      },
    ],
  },
  {
    name: "main",
    url: "https://enjazit.com.sa/SmartForm",
  },
  {
    name: "agreement",
    url: "https://enjazit.com.sa/SmartForm/Agreement",
  },
  {
    name: "electronic-agreement",
    url: "https://enjazit.com.sa/SmartForm/ElectronicAgreement",
  },
  {
    name: "error-main",
    url: "https://enjazit.com.sa/",
  },
  {
    name: "create-passenger",
    url: "https://enjazit.com.sa/SmartForm/TraditionalApp",
    controller: {
      selector: "body > div.page-header > div.page-head.hidden-print",
      action: async () => {
        const selectedTraveller = await page.$eval(
          "#hajonsoft_select",
          (el) => el.value
        );
        if (selectedTraveller) {
          fs.writeFileSync("./selectedTraveller.txt", selectedTraveller);
          await page.goto(await page.url());
        }
      },
    },
    details: [
      {
        selector: "#AFIRSTNAME",
        value: (row) => row.nameArabic.first,
      },
      {
        selector: "#AFAMILY",
        value: (row) => row.nameArabic.last,
      },
      {
        selector: "#AGRAND",
        value: (row) => row.nameArabic.grand,
      },
      {
        selector: "#AFATHER",
        value: (row) => row.nameArabic.father,
      },
      {
        selector: "#EFIRSTNAME",
        value: (row) => row.name.first,
      },
      {
        selector: "#EFATHER",
        value: (row) => row.name.father,
      },
      {
        selector: "#EGRAND",
        value: (row) => row.name.grand,
      },
      {
        selector: "#EFAMILY",
        value: (row) => row.name.last,
      },
      {
        selector: "#PASSPORTnumber",
        value: (row) => row.passportNumber,
      },
      {
        selector: "#BIRTH_PLACE",
        value: (row) => decodeURI(row.birthPlace),
      },
      {
        selector: "#PASSPORT_ISSUE_PLACE",
        value: (row) => decodeURI(row.placeOfIssue),
      },
      {
        selector: "#JOB_OR_RELATION",
        value: (row) => decodeURI(row.profession || "unknown"),
      },
      {
        selector: "#DEGREE",
        value: (row) => "bachelor",
      },
      {
        selector: "#DEGREE_SOURCE",
        value: (row) => "university of ",
      },
      {
        selector: "#ADDRESS_HOME",
        value: (row) => "123 utopia street",
      },
      { selector: "#PASSPORType", value: (row) => "1" },
      { selector: "#NATIONALITY", value: (row) => row.nationality.code },
      { selector: "#RELIGION", value: (row) => "1" },
      { selector: "#SOCIAL_STATUS", value: (row) => "5" },
      { selector: "#Sex", value: (row) => (row.gender === "MALE" ? "1" : "2") },
      { selector: "#VisaKind", value: (row) => "3" },
      { selector: "#ENTRY_POINT", value: (row) => "2" },
      { selector: "#COMING_THROUGH", value: (row) => "2" },
      {
        selector: "#EmbassyCode",
        value: (row) => "302",
      },
      { selector: "#SPONSER_NAME", value: (row) => "value" },
      { selector: "#SPONSER_ADDRESS", value: (row) => "value" },

      { selector: "#NATIONALITY_FIRST", value: (row) => row.nationality.code },
      { selector: "#SPONSER_PHONE", value: (row) => "123456789" },

      { selector: "#PersonId", value: (row) => "123456789" },
      { selector: "#SPONSER_NUMBER", value: (row) => "123456789" },
      { selector: "#car_number", value: (row) => "123456789" },
      { selector: "#porpose", value: (row) => "123456789" },
    ],
  },
];

async function send(sendData) {
  data = sendData;
  page = await util.initPage(config, onContentLoaded);
  await page.goto(config[0].url, { waitUntil: "domcontentloaded" });
}

async function onContentLoaded(res) {
  if (counter >= data.travellers.length) {
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
  switch (currentConfig.name) {
    case "login":
      await util.commit(page, currentConfig.details, data.system);
      const captchaSelector = "#Captcha";
      await page.waitForSelector(captchaSelector);
      await page.evaluate((selector) => {
        document.querySelector(selector).scrollIntoView();
      }, captchaSelector);
      await page.focus(captchaSelector);
      await page.waitForFunction(
        "document.querySelector('#Captcha').value.length === 6"
      );
      util.endCase(currentConfig.name);
      await util.sniff(page, currentConfig.details);
      await page.click("#btnSubmit");
      break;
    case "main":
      const addNewApplicationSelector =
        "#content > div > div.row.page-user-container > div > div.row > div > div > div.portlet-body.form > div > div.form-actions.fluid > div > div.col-md-4 > a";
      await page.waitForSelector(addNewApplicationSelector);
      await page.click(addNewApplicationSelector);
      break;
    case "agreement":
      const agreeSelector =
        "#content > div > div.row.page-user-container > div > div.row > div > div > div.portlet-body.form > div > div.form-actions.fluid.right > div > div > a.btn.green";
      await page.waitForSelector(agreeSelector);
      await page.click(agreeSelector);
      break;
    case "error-main":
      await page.goto(config[0].url);
      break;
    case "electronic-agreement":
      const electronicagreeSelector =
        "#content > div > div.row.page-user-container > div > div.row > div > div > div.portlet-body.form > div > div.form-actions.fluid.right > div > div > a.btn.green";
      await page.waitForSelector(electronicagreeSelector);
      await page.click(electronicagreeSelector);
      break;
    case "create-passenger":
      // counter = util.useCounter(counter);
      const passenger = data.travellers[counter];
      await util.controller(page, currentConfig, data.travellers);
      await page.waitForSelector("#PASSPORTnumber");
      const passportNumber = await page.$eval(
        "#PASSPORTnumber",
        (e) => e.value
      );
      // Do not continue if the passport number field is not empty - This could be a manual page refresh
      if (passportNumber || util.isCodelineLooping(passenger)) {
        return;
      }

      let resizedPhotoPath = await util.downloadAndResizeImage(
        passenger,
        200,
        200,
        "photo"
      );

      await page.waitForSelector("#PersonalImage");
      const portraitSrc = await page.$eval("#image", (e) =>
        e.getAttribute("src")
      );
      console.log(
        "%c 🍊 portraitSrc: ",
        "font-size:20px;background-color: #33A5FF;color:#fff;",
        portraitSrc
      );
      await util.commitFile("#PersonalImage", resizedPhotoPath);
      // await page.waitForNavigation();

      await util.commit(page, currentConfig.details, passenger);
      await setEnjazDate(
        "#PASSPORT_ISSUE_DATE",
        passenger.passIssueDt.yyyy,
        passenger.passIssueDt.mm,
        passenger.passIssueDt.dd
      );
      await setEnjazDate(
        "#PASSPORT_EXPIRY_DATe",
        passenger.passExpireDt.yyyy,
        passenger.passExpireDt.mm,
        passenger.passExpireDt.dd
      );

      await setEnjazDate(
        "#BIRTH_DATE",
        passenger.dob.yyyy,
        passenger.dob.mm,
        passenger.dob.dd
      );
      const travelDateDefault = moment().add(10, "days");
      // await setEnjazDate(
      //   "#ExpectedEntryDate",
      //   travelDateDefault.year(),
      //   travelDateDefault.month(),
      //   travelDateDefault.day()
      // );
      await page.click("#HaveTraveledToOtherCountriesNo");
      counter = counter + 1;
      console.log(
        "%c 🥡 counter: ",
        "font-size:20px;background-color: #B03734;color:#fff;",
        counter
      );
      await page.select("#EmbassyCode", "302");

      await page.waitForSelector("#Captcha");
      await page.focus("#Captcha");

      await page.evaluate(() => {
        const captchaElement = document.querySelector("#Captcha");
        captchaElement.scrollIntoView({ block: "end" });
      });
      await page.waitForFunction(
        "document.querySelector('#Captcha').value.length === 6"
      );
      await page.click(
        "#myform > div.form-actions.fluid.right > div > div > button"
      );
      // util.setCounter(counter + 1);
      break;
    default:
      break;
  }
}

async function setEnjazDate(dateSelector, year, month, day) {
  await page.click(dateSelector);
  const yearSelector =
    "body > div.calendars-popup > div > div.calendars-month-row > div > div > select.floatleft.calendars-month-year";
  await page.waitForSelector(yearSelector);
  await util.selectByValue(yearSelector, `${year}`);

  const monthSelector =
    "body > div.calendars-popup > div > div.calendars-month-row > div > div > select:nth-child(1)";
  await page.waitForSelector(monthSelector);
  // TODO AA: Replace with page.waitForXPath(xpath[, options])
  await page.waitForFunction(
    (info) => document.querySelector(info[0])?.innerHTML?.includes(info[1]),
    {},
    [monthSelector, `${parseInt(month)}/${year}`]
  );
  await page.select(monthSelector, `${parseInt(month)}/${year}`);
  await page.waitForTimeout(1000);
  const dayTds = await page.$$("td");
  for (const dayTd of dayTds) {
    const dayAnchor = await dayTd.$("a");
    if (dayAnchor) {
      const anchorContent = await dayAnchor.evaluate((node) => node.innerText);
      if (anchorContent == parseInt(day)) {
        dayTd.click();
        dayTd.focus();
      }
    }
  }

  await page.waitForTimeout(1000);
}
module.exports = { send };
