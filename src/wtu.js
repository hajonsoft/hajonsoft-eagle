const puppeteer = require("puppeteer-extra");
// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

const fs = require("fs");
const path = require("path");
const util = require("./util");
const moment = require("moment");
const sharp = require("sharp");
const budgie = require("./budgie");

let page;
let data;
let groupName;

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
        value: (row) => `${row.caravan}-${moment().format("HH:mm:ss")}`,
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
          util.setSelectedTraveller(selectedTraveller);
          sendPassenger(data.travellers[selectedTraveller]);
        }
      },
    },
    details: [
      {
        selector: "#ddlgroupname",
        value: (row) => groupName,
        autocomplete: "wtu_group",
      },
      { selector: "#ddltitle", value: (row) => "99" },
      { selector: "#ddlpptype", value: (row) => "1" },
      { selector: "#ddlbirthcountry", value: (row) => row.nationality.telCode },
      { selector: "#ddladdcountry", value: (row) => row.nationality.telCode },
      { selector: "#ddlhealth", value: (row) => "0" },
      {
        selector: "#txtprofession",
        value: (row) => decodeURI(row.profession),
        autocomplete: "wtu_profession",
      },
      { selector: "#ddlmstatus", value: (row) => "99" },
      { selector: "#ddleducation", value: (row) => "99" },
      {
        selector: "#txtbirthcity",
        value: (row) => decodeURI(row.birthPlace) || row.nationality.name,
      },
      {
        selector: "#txtAfirstname",
        value: (row) =>
          row?.nameArabic?.first?.match(/[a-zA-Z]/)
            ? ""
            : row?.nameArabic?.first,
      },
      {
        selector: "#txtAfamilyname",
        value: (row) =>
          row?.nameArabic?.last?.match(/[a-zA-Z]/) ? "" : row?.nameArabic?.last,
      },
      {
        selector: "#txtAgfathername",
        value: (row) =>
          row?.nameArabic?.grand?.match(/[a-zA-Z]/)
            ? ""
            : row?.nameArabic?.grand,
      },
      {
        selector: "#txtAfathername",
        value: (row) =>
          row?.nameArabic?.father?.match(/[a-zA-Z]/)
            ? ""
            : row?.nameArabic?.father,
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
        autocomplete: "wtu_address_city",
      },
      {
        selector: "#txtstreet",
        value: (row) => "",
        autocomplete: "wtu_address_street",
      },
      {
        selector: "#txtstate",
        value: (row) => "",
        autocomplete: "wtu_address_state",
      },
      {
        selector: "#txtzipcode",
        value: (row) => "",
        autocomplete: "wtu_address_zipcode",
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
  const currentConfig = util.findConfig(await page.url(), config);
  try {
    await pageContentHandler(currentConfig);
  } catch (err) {
    console.log(err);
  }
}

async function pageContentHandler(currentConfig) {
  const lastIndex = fs.readFileSync("./selectedTraveller.txt", "utf8");
  const passenger = data?.travellers?.[parseInt(lastIndex)];
  switch (currentConfig.name) {
    case "login":
      await util.commit(page, currentConfig.details, data.system);
      util.endCase(currentConfig.name);
      await util.waitForCaptcha("#txtImagetext", 6);
      await page.click("#cmdlogin");
      await page.waitForTimeout(2000);
      // Captcha image selector #Panel1 > div:nth-child(6) > div > img
      // Captcha text selector #txtImagetext

      const isIDo = await page.$("#Button4");
      if (isIDo) {
        await page.click('aria/button[name="Yes, I DO"]');
      }
      // use selector or Id for the image
      // await util.commitCaptchaTokenWithSelector(
      //   page,
      //   "#Panel1 > div:nth-child(6) > div > img",
      //   "#txtImagetext",
      //   6
      // );
      break;
    case "main":
      await page.goto(
        "https://www.waytoumrah.com/prj_umrah/Eng/Eng_frmGroup.aspx?PageId=M"
      );
      break;
    case "create-group":
      await util.commit(page, currentConfig.details, data.info);
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

      await page.focus("#BtnSave");
      await page.hover("#BtnSave");

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
      const numberMatch = groupCreatedSuccessfullyElementText.match(/\d+/g);
      if (numberMatch) {
        groupName = numberMatch[0];
        budgie.save("wtu_group", groupName);
      }

      await page.goto(
        "https://www.waytoumrah.com/prj_umrah/eng/eng_mutamerentry.aspx"
      );
      break;
    case "create-mutamer":
      await page.emulateVisionDeficiency("none");
      await util.controller(page, currentConfig, data.travellers);
      if (fs.existsSync("./loop.txt")) {
        sendPassenger(passenger);
      }

      break;
    default:
      break;
  }
}

async function sendPassenger(passenger) {
  await page.emulateVisionDeficiency("none");
  // await page.emulateVisionDeficiency("blurredVision");

  await page.waitForSelector("#txtppno");
  const passportNumber = await page.$eval("#txtppno", (e) => e.value);
  // Do not continue if the passport number field is not empty - This could be a manual page refresh
  if (passportNumber || util.isCodelineLooping(passenger)) {
    return;
  }
  await page.waitForSelector("#ddlgroupname");
  if (!groupName) {
    groupName = budgie.get("wtu_group");
  }
  await page.select("#ddlgroupname", groupName);
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
  await page.emulateVisionDeficiency("none");

  await page.waitForTimeout(5000);
  await util.commit(
    page,
    config.find((c) => c.name === "create-mutamer").details,
    passenger
  );
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
    console.log("Canvas: dummy-passport-error",  err);
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

  resizedPhotoPath = util.getOverridePath(
    resizedPhotoPath,
    path.join(__dirname, `/photos/${passenger.passportNumber}.jpg`)
  );

  if (!process.argv.includes("noimage")) {
    await page.click("#btn_uploadImage");
    await page.waitForTimeout(2000);
    await util.commitFile("#file_photo_upload", resizedPhotoPath);
    await page.waitForNavigation();
  }

  // Upload the passport image
  await page.waitForSelector("#imgppcopy");
  if (!process.argv.includes("noimage")) {
    await util.commitFile("#fuppcopy", resizedPassportPath);
  }
  // await page.emulateVisionDeficiency("none");
  await util.waitForCaptcha("#txtImagetext", 5);
  await util.sniff(
    page,
    config.find((c) => c.name == "create-mutamer")?.details
  );
  await page.waitForSelector("#btnsave");
  await page.click("#btnsave"); // TODO: Make sure this is not a full page refresh
  util.incrementSelectedTraveler();

  // This is assumed. fix starting from here. Because passports can succeed from the first time - check if you this is a new page refresh?
  // TODO: Wait for success message before advancing the counter
  try {
    await page.waitForSelector(
      "body > div.lobibox.lobibox-error.animated-super-fast.zoomIn > div.lobibox-body > div.lobibox-body-text-wrapper > span"
    );
    const errorButton = await page.waitForSelector(
      "body > div.lobibox.lobibox-error.animated-super-fast.zoomIn > div.lobibox-footer.text-center > button"
    );
    await errorButton.click();
  } catch {}
  
  await page.waitForNavigation();
  // If there is a passport number still that means it is the same page
  await page.waitForSelector("#txtppno");
  const pn = await page.$eval("#txtppno", (e) => e.value);
  if (!pn) {
    return;
  }

  await page.waitForSelector("#imgppcopy");
  if (!process.argv.includes("noimage")) {
    await util.commitFile("#fuppcopy", blankPassportPath);
  }
  // TODO: Read the captcha value and renter it #txtImagetext
  await util.waitForCaptcha("#txtImagetext", 5);
  await page.waitForSelector("#btnsave");
  await page.click("#btnsave"); // TODO: Make sure this is not a full page refresh
}

module.exports = { send };
