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
          `${row.name.first}-${row.name.last}-${moment().format("HH:mm:ss")}`,
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
        value: (row) => decodeURI(row.profession),
        autocomplete: 'wtu_profession',
      },
      { selector: "#ddlmstatus", value: (row) => "99" },
      { selector: "#ddleducation", value: (row) => "99" },
      {
        selector: "#txtbirthcity",
        value: (row) => decodeURI(row.birthPlace),
      },
      {
        selector: "#txtAfirstname",
        value: (row) => row?.nameArabic?.first?.match(/[a-zA-Z]/) ? '' : row?.nameArabic?.first,
      },
      {
        selector: "#txtAfamilyname",
        value: (row) => row?.nameArabic?.last?.match(/[a-zA-Z]/) ? '' : row?.nameArabic?.last,
      },
      {
        selector: "#txtAgfathername",
        value: (row) => row?.nameArabic?.grand?.match(/[a-zA-Z]/) ? '' : row?.nameArabic?.grand,
      },
      {
        selector: "#txtAfathername",
        value: (row) => row?.nameArabic?.father?.match(/[a-zA-Z]/) ? '' : row?.nameArabic?.father,
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
        autocomplete: 'wtu_address_city',
      },
      {
        selector: "#txtstreet",
        value: (row) => "",
        autocomplete: 'wtu_address_street',
      },
      {
        selector: "#txtstate",
        value: (row) => "",
        autocomplete: 'wtu_address_state'

      },
      {
        selector: "#txtzipcode",
        value: (row) => "",
        autocomplete: 'wtu_address_zipcode'
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
  const passenger = data?.travellers?.[counter];
  switch (currentConfig.name) {
    case "login":
      await util.commit(page, currentConfig.details, data.system);
      util.endCase(currentConfig.name);
      await util.waitForCaptcha("#txtImagetext", 6);
      await page.click("#cmdlogin");
      await page.waitForTimeout(2000);
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
      const firstOption = await page.$eval("#cmbEmb", (e) => {
        const options = e.querySelectorAll("option");
        for (const opt of options) {
          if (opt.value && /[0-9]/.test(opt.value)) {
            return { value: opt.value, label: opt.innerText };
          }
        }
      });
      if (firstOption) {
        await page.$eval(
          "#cmbEmb_chosen > a > span",
          (e, val) => (e.innerText = val),
          firstOption.label
        );
        await page.select("#cmbEmb", firstOption.value);
      }

      await page.focus('#BtnSave')
      await page.hover('#BtnSave')

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
      await page.waitForTimeout(3000);
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
      await page.waitForTimeout(5000);
      await util.commit(page, currentConfig.details, passenger);
      if (passenger.gender == "Female") {
        await page.waitForSelector("#ddlrelation");
        await page.select("#ddlrelation", "15");
      }

      let blankPassportPath;

      try {
        blankPassportPath = util.createMRZImage(
          path.join(
            util.passportsFolder,
            passenger.passportNumber + "_400x300_mrz.jpg"
          ),
          passenger?.codeline
        );
      } catch (err) {
        console.log(err)
      }

      let resizedPhotoPath = await util.downloadAndResizeImage(
        passenger,
        200,
        200,
        "photo"
      );
      const resizedPassportPath = await util.downloadAndResizeImage(
        passenger,
        400,
        300,
        "passport"
      );
      const resizedVaccinePath = await util.downloadAndResizeImage(
        passenger,
        100,
        100,
        "vaccine"
      );

      await page.select("#cmbVacc_cert_type", "2");
      await page.waitForSelector("#img_vaccination_copy");

      if (!process.argv.includes("noimage")) {
        await page.click("#btn_uploadImage");
        await util.commitFile("#file_photo_upload", resizedPhotoPath);
        await page.waitForNavigation();
      }

      await page.waitForSelector("#imgppcopy");
      if (
        !process.argv.includes("noimage")
      ) {
        await util.commitFile("#fuppcopy", resizedPassportPath);
      }

      await page.waitForSelector("#img_vaccination_copy")
      if (
        !process.argv.includes("noimage")
      ) {
        await util.commitFile("#F_Vaccinationcopy", resizedVaccinePath);
      }

      await util.waitForCaptcha("#txtImagetext", 5);
      await util.sniff(page, currentConfig.details)
      await page.click("#btnsave"); // TODO: Make sure this is not a full page refresh
      counter = counter + 1;
      // TODO: Wait for success message before advancing the counter
      await page.waitForSelector("body > div.lobibox.lobibox-error.animated-super-fast.zoomIn > div.lobibox-body > div.lobibox-body-text-wrapper > span");
      const errorButton = await page.waitForSelector('body > div.lobibox.lobibox-error.animated-super-fast.zoomIn > div.lobibox-footer.text-center > button')
      await errorButton.click();
      await page.waitForSelector("#imgppcopy");
      if (
        !process.argv.includes("noimage")
      ) {
        await util.commitFile("#fuppcopy", blankPassportPath);
      }
      await util.waitForCaptcha("#txtImagetext", 5);
      await page.click("#btnsave"); // TODO: Make sure this is not a full page refresh
      break;
    default:
      break;
  }
}

module.exports = { send };
