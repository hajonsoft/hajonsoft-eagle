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
    regex: "https://www.waytoumrah.com/prj_umrah/eng/Eng_frmlogin.aspx",
    url: "https://www.waytoumrah.com/prj_umrah/eng/Eng_frmlogin.aspx",
    details: [
      { selector: "#txtUserName", value: (system) => system.username },
      { selector: "#txtPwd", value: (system) => system.password },
    ],
  },
  {
    name: "main",
    url: "https://www.waytoumrah.com/prj_umrah/Eng/Eng_Waytoumrah_EA.aspx",
  },
  {
    name: "create-group",
    regex:
      "https://www.waytoumrah.com/prj_umrah/Eng/Eng_frmGroup.aspx\\?PageId=M.*",
    details: [
      {
        selector: "#txtGrpdesc",
        value: (row) =>
          (row.name.full + row.passportNumber).replace(/ /g, "") +
          parseInt(moment().format("DDMMYYYYHHmmss")).toString(32),
      },
      {
        selector: "#txtEADate",
        value: () => moment().add(7, "days").format("MM-DD-YYYY"),
      },
    ],
  },
  {
    name: "create-mutamer",
    url: "https://www.waytoumrah.com/prj_umrah/eng/eng_mutamerentry.aspx",
    controller: {
      selector:
        "#Table2 > tbody > tr > td > div > div > div > div.widget-title",
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
      { selector: "#ddlgroupname", value: (row) => groupNumber },
      { selector: "#ddltitle", value: (row) => "99" },
      { selector: "#ddlpptype", value: (row) => "1" },
      { selector: "#ddlbirthcountry", value: (row) => row.nationality.telCode },
      { selector: "#ddladdcountry", value: (row) => row.nationality.telCode },
      { selector: "#ddlhealth", value: (row) => "0" },
      {
        selector: "#txtprofession",
        value: (row) => decodeURI(row.profession || "unknown"),
      },
      { selector: "#ddlmstatus", value: (row) => "99" },
      { selector: "#ddleducation", value: (row) => "99" },
      {
        selector: "#txtbirthcity",
        value: (row) => decodeURI(row.birthPlace),
      },
      {
        selector: "#txtAfirstname",
        value: (row) => row.nameArabic.first,
      },
      {
        selector: "#txtAfamilyname",
        value: (row) => row.nameArabic.last,
      },
      {
        selector: "#txtAgfathername",
        value: (row) => row.nameArabic.grand,
      },
      {
        selector: "#txtAfathername",
        value: (row) => row.nameArabic.father,
      },
      {
        selector: "#txtppissdd",
        value: (row) => row.passIssueDt.dd,
      },
      {
        selector: "#ddlppissmm",
        txt: (row) => row.passIssueDt.mmm,
      },
      {
        selector: "#txtppissyy",
        value: (row) => row.passIssueDt.yyyy,
      },
      {
        selector: "#txtppisscity",
        value: (row) => decodeURI(row.placeOfIssue),
      },
      {
        selector: "#txtcity",
        value: (row) => "",
      },
      {
        selector: "#txtstreet",
        value: (row) => "",
      },
      {
        selector: "#txtstate",
        value: (row) => "",
      },
      {
        selector: "#txtzipcode",
        value: (row) => "",
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
  const passenger = data.travellers[counter];
  switch (currentConfig.name) {
    case "login":
      await util.commit(page, currentConfig.details, data.system);
      await page.waitForSelector("#txtImagetext");
      await page.focus("#txtImagetext");
      await page.waitForFunction(
        "document.querySelector('#txtImagetext').value.length === 6"
      );
      await page.click("#cmdlogin");
      await page.waitForSelector("#Button4");
      const isIDo = await page.$("#Button4");
      if (isIDo) {
        await page.click('aria/button[name="Yes, I DO"]');
      }
      break;
    case "main":
      await page.goto(
        "https://www.waytoumrah.com/prj_umrah/Eng/Eng_frmGroup.aspx?PageId=M"
      );
      break;
    case "create-group":
      await util.commit(page, currentConfig.details, data.travellers[0]);
      const embassyCount = await page.evaluate(() => {
        const consulate = document.querySelector("#cmbEmb");
        const consulateOptions = consulate.querySelectorAll("option");
        const consulateOptionsCount = [...consulateOptions].length;
        return consulateOptionsCount;
      });
      await page.focus("#BtnSave");
      const onlyOneEmbassy = embassyCount == 2;
      if (onlyOneEmbassy) {
        await page.click("#BtnSave");
      }
      // Wait for this string: Group saved successfully, Group code is 153635
      const groupCreatedSuccessfullyElement =
        "body > div.lobibox.lobibox-success.animated-super-fast.zoomIn > div.lobibox-body > div.lobibox-body-text-wrapper > span";
      await page.waitForSelector(groupCreatedSuccessfullyElement, {
        visible: true,
        timeout: 0,
      });
      const groupCreatedSuccessfullyElementText = await page.$eval(
        groupCreatedSuccessfullyElement,
        (el) => el.innerText
      );
      groupNumber = groupCreatedSuccessfullyElementText.match(/\d+/g)[0];
      console.log(
        "%c 🥒 groupNumber: ",
        "font-size:20px;background-color: #FCA650;color:#fff;",
        groupNumber
      );
      await page.goto(
        "https://www.waytoumrah.com/prj_umrah/eng/eng_mutamerentry.aspx"
      );
      break;
    case "create-mutamer":
      await util.controller(page, currentConfig, data.travellers);
      await page.waitForSelector("#txtppno");
      const passportNumber = await page.$eval("#txtppno", (e) => e.value);
      // Do not continue if the passport number field is not empty - This could be a manual page refresh
      if (passportNumber || util.isCodelineLooping(passenger)) {
        return;
      }
      await page.waitForSelector("#ddlgroupname");
      await page.select("#ddlgroupname", groupNumber);
      await page.waitFor(3000);
      await page.waitForSelector("#btnppscan");
      await page.evaluate(() => {
        const divBtn = document.querySelector("#btnppscan");
        if (divBtn) {
          divBtn.click();
        }
      });

      await page.waitForSelector("#divshowmsg");
      await page.type("#divshowmsg", passenger.codeline, {
        delay: 0,
      });
      await page.waitFor(5000);
      await util.commit(page, currentConfig.details, passenger);
      if (passenger.gender == "Female") {
        await page.waitForSelector('#ddlrelation');
        await page.select('#ddlrelation', "15");
      }
      // Open photo dialogue
      await page.click("#btn_uploadImage");
      let resizedPhotoPath = await util.downloadAndResizeImage(
        passenger,
        200,
        200,
        "photo"
      );

      await util.commitFile("#file_photo_upload", resizedPhotoPath);
      await page.waitForNavigation();

      await page.waitForSelector("#imgppcopy");
      const passportElementSourceValue = await page.$eval("#imgppcopy", (e) =>
        e.getAttribute("src")
      );
      console.log(
        "%c 🍅 ppSrc: ",
        "font-size:20px;background-color: #465975;color:#fff;",
        passportElementSourceValue
      );

      if (!passportElementSourceValue) {
        const resizedPassportPath = await util.downloadAndResizeImage(
          passenger,
          400,
          300,
          "passport"
        );
        await util.commitFile("#fuppcopy", resizedPassportPath);
        await page.waitForNavigation();
      }
      await page.waitForSelector("#txtImagetext");
      await page.focus("#txtImagetext");
      await page.waitForFunction(
        "document.querySelector('#txtImagetext').value.length === 5"
      );
      await page.click("#btnsave");
      counter = counter + 1;
      break;
    default:
      break;
  }
}

module.exports = { send };
