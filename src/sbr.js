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
let mofaPage;
let data;
let counter = 0;
const defaultNoImage = false;
const config = [
  {
    name: "login",
    url: "https://srw.sabre.com",
  },
  {
    name: "main",
    url: "https://accounts.havail.sabre.com/login/",
    regex: "https://accounts.havail.sabre.com/login/",
    details: [
      {
        selector: "#username",
        value: (system) => system.username,
      },
      {
        selector: "#password",
        value: (system) => system.password,
      },
      {
        selector: "#pcc",
        value: (system) => system.embassy,
      },
    ],
  },
  {
    name: "data-entry",
    regex: "https://srw.sabre.com/21.12.12/.ts=",
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
        autocomplete: "birthPlace",
      },
      {
        selector: "#PASSPORT_ISSUE_PLACE",
        value: (row) => decodeURI(row.placeOfIssue),
        autocomplete: "passportIssuePlace",
      },
      {
        selector: "#JOB_OR_RELATION",
        value: (row) => decodeURI(row.profession),
        autocomplete: "profession",
      },
      {
        selector: "#DEGREE",
        value: (row) => "",
        autocomplete: "degree",
      },
      {
        selector: "#DEGREE_SOURCE",
        value: (row) => "",
        autocomplete: "degreeSource",
      },
      {
        selector: "#ADDRESS_HOME",
        value: (row) => "",
        autocomplete: "homeAddress",
      },
      { selector: "#PASSPORType", value: (row) => "1" },
      { selector: "#NATIONALITY", value: (row) => row.nationality.code },
      { selector: "#NATIONALITY_FIRST", value: (row) => row.nationality.code },
      { selector: "#RELIGION", value: (row) => "1" },
      { selector: "#SOCIAL_STATUS", value: (row) => "5" },
      { selector: "#Sex", value: (row) => (row.gender === "Male" ? "1" : "2") },
      { selector: "#PersonId", value: (row) => row.passportNumber },
    ],
  },
  {
    name: "pay-passenger",
    regex: "https://enjazit.com.sa/payment.appno=.*",
    details: [
      {
        selector: "#CreditNumber",
        value: (row) => "",
        autocomplete: "credit-card",
      },
      {
        selector: "#CVV2",
        value: (row) => "",
        autocomplete: "credit-card-cvv2",
      },
      {
        selector: "#CardName",
        value: (row) => "",
        autocomplete: "credit-card-name",
      },
      {
        selector: "#ExpirationMonth",
        value: (row) => "12",
        autocomplete: "credit-card-expire-month",
      },
      {
        selector: "#ExpirationYear",
        value: (row) => "2025",
        autocomplete: "credit-card-expire-year",
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
  switch (currentConfig.name) {
    case "login":
      break;
    case "main":
      await util.commit(page, currentConfig.details, data.system);
      await page.click("#submitButton");
      break;
    case "data-entry":
      // await page.waitForTimeout(5000);
      // const nextButton = await page.$(
      //   "body > div.app > div > div.dn-layer.ui-container.qa-container.ui-container-view368.dn-layer-view368.qa-container-view368 > div.ui-container-items.dn-layer-items.qa-container-items.ui-container-items-view368 > li > div > div > div > div > div > div.modal-footer > button.btn-success.btn.btn-default"
      // );
      // if (nextButton) {
      //   await nextButton.click();
      // }
      await page.waitForSelector("#cmdln");
      await page.waitForTimeout(5000);
      const firstPassenger = data.travellers[counter];
      await page.type(
        "#cmdln",
        `*-${firstPassenger.name.last}/${firstPassenger.name.first}`
      );
      await page.click(
        "body > div.app > div > div.area-in > div > ul > li > div > ul > li.ui-container-item.command-line-envelope-item.main-command-bar-item.qa-container-item.send-button-parent > button"
      );
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
      await page.emulateVisionDeficiency(util.VISION_DEFICIENCY);
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
      await util.commitFile("#PersonalImage", resizedPhotoPath);

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
      const travelDateDefault = moment().add(10, "day");
      await setEnjazDate(
        "#ExpectedEntryDate",
        travelDateDefault.format("YYYY"),
        travelDateDefault.format("MM"),
        travelDateDefault.format("DD")
      );
      await page.emulateVisionDeficiency("none");
      await page.click("#HaveTraveledToOtherCountriesNo");
      mofaPage = await util.newPage(onMofaContentLoaded, onMofaContentClosed);
      await mofaPage.goto("https://visa.mofa.gov.sa", {
        waitUntil: "domcontentloaded",
      });

      counter = counter + 1;
      // util.setCounter(counter + 1);
      break;
    case "pay-passenger":
      await util.commit(page, currentConfig.details, {});
      // await util.waitForCaptcha("#CreditNumber", 16)
      // await util.sniff(page, currentConfig.details);
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
        dayTd.focus();
        dayTd.click();
      }
    }
  }

  await page.waitForTimeout(1000);
}
module.exports = { send };
