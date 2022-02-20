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

const config = [
  {
    name: "login",
    url: "https://enjazit.com.sa/Account/Login/Person",
    details: [
      {
        selector: "#UserName",
        value: (system) => system.username,
      },
      {
        selector: "#Password",
        value: (system) => system.password,
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

async function onMofaContentLoaded(res) {
  const mofa_visaType = budgie.get("mofa_visaType");
  const mofa_id1 = budgie.get("mofa_id1");
  const mofa_id2 = budgie.get("mofa_id2");
  util.handleMofa(mofaPage, mofa_id1, mofa_id2, mofa_visaType);
}

async function onMofaContentClosed(res) {
  await page.bringToFront();
  const mofaData = util.getMofaData();
  await pasteMofaData(mofaData);
  await page.emulateVisionDeficiency("none"); // Just in case 
  await util.waitForCaptcha("#Captcha", 6);
  await util.sniff(page, [
    {
      selector: "#ENTRY_POINT",
      autocomplete: "portOfEntry",
    },
    {
      selector: "#DEGREE",
      autocomplete: "degree",
    },
    {
      selector: "#DEGREE_SOURCE",
      autocomplete: "degreeSource",
    },
    {
      selector: "#ADDRESS_HOME",
      autocomplete: "homeAddress",
    },
    {
      selector: "#COMING_THROUGH",
      autocomplete: "transportationMode",
    },
    {
      selector: "#car_number",
      autocomplete: "flightNumber",
    },
    { selector: "#porpose", autocomplete: "visaPurpose" },
  ]);

  await page.click(
    "#myform > div.form-actions.fluid.right > div > div > button"
  );
}

async function pasteMofaData(mofaData) {
  console.log('mofaData',mofaData)
  const numberOfEntries = mofaData?.numberOfEntries?.split("-")?.[0]?.trim();
  const validityDuration = mofaData?.numberOfEntries
    ?.split("-")?.[1]
    ?.match(/[0-9]+/)?.[0];

  await util.commit(page, [
    {
      selector: "#JOB_OR_RELATION",
      value: () => `${mofaData.profession}`,
    },
    { selector: "#VisaKind", txt: (row) => `${mofaData.visaType}` },
    {
      selector: "#ENTRY_POINT",
      value: (row) => ``,
      autocomplete: "portOfEntry",
    },
    {
      selector: "#COMING_THROUGH",
      txt: (row) => ``,
      autocomplete: "transportationMode",
    },
    {
      selector: "#SPONSER_NAME",
      value: (row) => `${mofaData.sponsorName}`,
    },
    {
      selector: "#SPONSER_ADDRESS",
      value: (row) => `${mofaData.address}`,
    },
    {
      selector: "#DocumentNumber",
      value: (row) => `${mofaData.id1}`,
    },
    {
      selector: "#SPONSER_NUMBER",
      value: (row) => !mofaData.applicationType == "invitation" && `${mofaData.id2}`,
    },
    {
      selector: "#SPONSER_PHONE",
      value: (row) => `${mofaData.tel}`,
    },
    {
      selector: "#car_number",
      value: (row) => ``,
      autocomplete: "flightNumber",
    },
    { selector: "#porpose", value: (row) => ``, autocomplete: "visaPurpose" },
  ]);

  // paste the name in the four fields at the end
  const nameParts = mofaData.name.split(" ");
  if (nameParts.length > 0) {
    if (nameParts.length == 1) {
      nameParts.push();
      nameParts.push();
      nameParts.push(nameParts[0]);
    }
    if (nameParts.length == 2) {
      nameParts.push();
      nameParts.push(nameParts[1]);
      nameParts[1] = "";
    }
    if (nameParts.length == 3) {
      nameParts.push(nameParts[2]);
      nameParts[2] = "";
    }
    if (nameParts.length > 4) {
      nameParts[3] = nameParts.slice(3).join(" ");
    }
    await util.commit(page, [
      { selector: "#AFIRSTNAME", value: (row) => nameParts[0] },
      { selector: "#AFAMILY", value: (row) => nameParts[3] },
      { selector: "#AGRAND", value: (row) => nameParts[2] },
      { selector: "#AFATHER", value: (row) => nameParts[1] },
    ]);
  }

  await page.waitForTimeout(2000);
  await util.selectByValue("#EmbassyCode", `${mofaData.embassy}`);
  await page.click("#PerformUmrahNo");

  await util.commit(page, [
    { selector: "#NUMBER_OF_ENTRIES", txt: (row) => `${numberOfEntries}` },
  ]);

  await page.waitForTimeout(2000);
  await util.commit(page, [
    {
      selector: "#Number_Entry_Day",
      value: (row) => `${validityDuration.match(/[0-9]+/)}`,
    },
  ]);
  await page.waitForTimeout(2000);
  await util.commit(page, [
    { selector: "#RESIDENCY_IN_KSA", value: (row) => `${mofaData.duration}` },
  ]);

  //Process ny additional data for type = invitation here
  if (mofaData.applicationType == "invitation") {
    await util.commit(page, [
      {selector: '#Personal_Phone', value: (row) => `${mofaData.tel}`}
    ])
    return;
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
      if (!process.argv.includes("slow")) {
        await page.waitForFunction(
          "document.querySelector('#Captcha').value.length === 6",
          { timeout: 0 }
        );
        util.endCase(currentConfig.name);
        await util.sniff(page, currentConfig.details);
        await page.click("#btnSubmit");
      }
      break;
    case "main":
      const addNewApplicationSelector =
        "#content > div > div.row.page-user-container > div > div.row > div > div > div.portlet-body.form > div > div.form-actions.fluid > div > div.col-md-4 > a";
      await page.waitForSelector(addNewApplicationSelector);
      await page.evaluate((cap) => {
        const captchaElement = document.querySelector(cap);
        captchaElement.scrollIntoView({ block: "end" });
      }, addNewApplicationSelector);
      await page.focus(addNewApplicationSelector);
      await page.hover(addNewApplicationSelector);
      // await page.click(addNewApplicationSelector);
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
      await page.emulateVisionDeficiency('none');
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
