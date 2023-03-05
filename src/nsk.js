const puppeteer = require("puppeteer-extra");
// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const fs = require("fs");
const path = require("path");
const budgie = require("./budgie");
const util = require("./util");
const { getPath } = util;
const moment = require("moment");
const sharp = require("sharp");
const homedir = require("os").homedir();
const SMS = require("./sms");
const email = require("./email");
const totp = require("totp-generator");
const { default: axios } = require("axios");
const { cloneDeep } = require("lodash");

let page;
let data;
let counter = 0;

function getLogFile() {
  const logFolder = path.join(getPath("log"), data.info.munazim);
  if (!fs.existsSync(logFolder)) {
    fs.mkdirSync(logFolder, { recursive: true });
  }
  const logFile = path.join(logFolder, data.info.caravan + "_ehj.txt");
  return logFile;
}

let startTime;

const config = [
  {
    name: "login",
    url: "https://bsp-nusuk.haj.gov.sa/Identity/Index",
    regex: "https://bsp-nusuk.haj.gov.sa/Identity/Index",
    details: [
      {
        selector: "#userName",
        value: (row) => row.username,
      },
      {
        selector: "#password",
        value: (row) => row.password,
      },
    ],
  },
  {
    name: "otp",
    regex: "https://bsp-nusuk.haj.gov.sa/OTP/GoogleAuth",
  },
  {
    name: "groups",
    url: "https://bsp-nusuk.haj.gov.sa/ExternalAgencies/Groups",
  },
  {
    name: "create-group",
    url: "https://bsp-nusuk.haj.gov.sa/ExternalAgencies/Groups/CreateGroup",
    details: [
      {
        selector: "#GroupNameEn",
        value: (row) => util.suggestGroupName(row),
      },
    ],
  },
  {
    name: "passengers",
    regex:
      "https://bsp-nusuk.haj.gov.sa/ExternalAgencies/Groups/EditMuatamerList/",
    details: [
      {
        selector: "#NationalityId",
        value: (row) => row.nationality.telCode,
      },
      {
        selector: "#Gender",
        value: (row) => (row.gender === "Male" ? "1" : "2"),
      },
      {
        selector: "#BirthDate",
        value: (row) => `${row.dob.yyyy}-${row.dob.mm}-${row.dob.dd}`,
      },
      {
        selector: "#FirstNameAr",
        value: (row) =>
          row?.nameArabic?.first?.match(/[a-zA-Z]/)
            ? ""
            : row?.nameArabic?.first,
      },
      {
        selector: "#FamilyNameAr",
        value: (row) =>
          row?.nameArabic?.last?.match(/[a-zA-Z]/) ? "" : row?.nameArabic?.last,
      },
      {
        selector: "#ThirdNameAr",
        value: (row) =>
          row?.nameArabic?.grand?.match(/[a-zA-Z]/)
            ? ""
            : row?.nameArabic?.grand,
      },
      {
        selector: "#SecondNameAr",
        value: (row) =>
          row?.nameArabic?.father?.match(/[a-zA-Z]/)
            ? ""
            : row?.nameArabic?.father,
      },
      {
        selector: "#FirstNameEn",
        value: (row) => row?.name?.first,
      },
      {
        selector: "#FamilyNameEn",
        value: (row) => row?.name?.last,
      },
      {
        selector: "#ThirdNameEn",
        value: (row) => row?.name?.grand,
      },
      {
        selector: "#SecondNameEn",
        value: (row) => row?.name?.father,
      },
      {
        selector: "#BirthCity",
        value: (row) => decodeURI(row.birthPlace) || row.nationality.name,
      },
      {
        selector: "#IssueCity",
        value: (row) => decodeURI(row.placeOfIssue),
      },
      {
        selector: "#PassportIssueDate",
        value: (row) =>
          `${row.passIssueDt.yyyy}-${row.passIssueDt.mm}-${row.passIssueDt.dd}`,
      },
      {
        selector: "#PassportExpiryDate",
        value: (row) =>
          `${row.passExpireDt.yyyy}-${row.passExpireDt.mm}-${row.passExpireDt.dd}`,
      },
      {
        selector: "#MartialStatus",
        value: (row) => "99",
      },
      {
        selector: "#BirthCountry",
        value: (row) => util.getIssuingCountry(row)?.telCode,
      },
      {
        selector: "#Job",
        value: (row) => decodeURI(row.profession) || "Employee",
      },
      {
        selector: "#IdNo",
        value: (row) => row.passportNumber,
      },
      {
        selector: "#PassportNumber",
        value: (row) => row.passportNumber,
      },
      {
        selector: "#PassportType",
        value: (row) => "1",
      },
    ],
  },
];

async function sendPassenger(selectedTraveler) {
  const data = fs.readFileSync(getPath("data.json"), "utf-8");
  var passengersData = JSON.parse(data);
  await pasteCodeLine(selectedTraveler, passengersData);
}

async function pasteCodeLine(selectedTraveler, passengersData) {
  await page.focus("#passportCaptureStatus");
  if (selectedTraveler == "-1") {
    const browser = await page.browser();
    browser.disconnect();
  }
  var passenger = passengersData.travellers[selectedTraveler];
  await page.keyboard.type(passenger.codeline);
}

async function send(sendData) {
  data = sendData;
  page = await util.initPage(config, onContentLoaded);
  // Accept the confirmation dialog, to prevent script hanging
  // page.on("dialog", async (dialog) => {
  //   console.log("dialog message: ", dialog.message());
  //   // if (dialog.message().match(/Record has been saved Successfully/i)) {
  //   //   // Store status in kea
  //   //   const passenger = data.travellers[util.getSelectedTraveler()];
  //   //   util.infoMessage(page, `🧟 passenger ${passenger.slug} saved`);
  //   //   kea.updatePassenger(data.system.accountId, passenger.passportNumber, {
  //   //     "submissionData.bau.status": "Submitted",
  //   //   });
  //   //   util.incrementSelectedTraveler();
  //   // }
  //   await dialog.accept();
  // });
  await page.goto(config[0].url, { waitUntil: "domcontentloaded" });
}

async function onContentLoaded(res) {
  counter = util.useCounter(counter);
  if (counter >= data?.travellers?.length) {
    util.setCounter(0);
    if (fs.existsSync(getPath("loop.txt"))) {
      fs.unlinkSync(getPath("loop.txt"));
    }
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
      const code = await util.commitCaptchaTokenWithSelector(
        page,
        "#img-captcha",
        "#CaptchaCode",
        5
      );
      if (code && data.system.username && data.system.password) {
        await page.click("#kt_login_signin_submit");
      }
      break;
    case "otp":
      const googleToken = totp(data.system.ehajCode);
      await util.commit(
        page,
        [
          {
            selector: "#OtpValue",
            value: () => googleToken,
          },
        ],
        {}
      );
      await page.click("#newfrm > button");
      break;
    case "groups":
      await page.click("#qa-create-group");
      break;
    case "create-group":
      await util.commit(page, currentConfig.details, data);
      await page.$eval("#EmbassyId", (e) => {
        const options = e.querySelectorAll("option");
        if (options.length === 2) {
          options[1].selected = true;
        }
      });
      // TODO: If there is more than 2 options in the select, then select the one that matches the data
      await page.click("#qa-next");
      break;
    case "passengers":
      const selectedTraveler = util.getSelectedTraveler();
      if (selectedTraveler >= data.travellers.length) {
        await page.goto("https://bsp-nusuk.haj.gov.sa/ExternalAgencies/Groups/")
        return;
      }
      await page.waitForSelector(
        "body > div.swal2-container.swal2-center.swal2-shown > div > div.swal2-actions > button.swal2-confirm.swal2-styled"
      );
      await page.click(
        "body > div.swal2-container.swal2-center.swal2-shown > div > div.swal2-actions > button.swal2-confirm.swal2-styled"
      );
      await page.waitForTimeout(500);
      await page.waitForSelector(
        "#newfrm > div.kt-wizard-v2__content > div.kt-heading.kt-heading--md.d-flex > a"
      );
      await page.click(
        "#newfrm > div.kt-wizard-v2__content > div.kt-heading.kt-heading--md.d-flex > a"
      );
      await page.waitForSelector("#PassportPictureUploader");
      const passportPath = path.join(
        util.passportsFolder,
        `${passenger.passportNumber}.jpg`
      );
      await util.downloadImage(passenger.images.passport, passportPath);
      // let resizedPassportFile = path.join(
      //   util.passportsFolder,
      //   `${passenger.passportNumber}_400x300.jpg`
      // );
      // await sharp(passportPath)
      //   .resize(400, 300, {
      //     fit: sharp.fit.inside,
      //     withoutEnlargement: true,
      //   })
      //   .toFile(resizedPassportFile);
      await util.commitFile("#PassportPictureUploader", passportPath);
      // wait until passport number is filled
      // #PassportNumber
      try {
        await page.waitForFunction(
          (arg) => {
            if (document.querySelector(arg).value.length > 0) {
              return true;
            }
          },
          { timeout: 3000 },
          "#PassportNumber"
        );
      } catch (err) {
        console.log(err);
      }

      await util.commit(page, currentConfig.details, passenger);

      let photoPath = path.join(
        util.photosFolder,
        `${passenger.passportNumber}.jpg`
      );

      await util.downloadImage(passenger.images.photo, photoPath);
      const resizedPhotoPath = path.join(
        util.photosFolder,
        `${passenger.passportNumber}_200x200.jpg`
      );
      await sharp(photoPath)
        .resize(200, 200, {
          fit: sharp.fit.inside,
          withoutEnlargement: true,
        })
        .toFile(resizedPhotoPath);
      await util.commitFile("#PersonalPictureUploader", resizedPhotoPath);
      await util.commitFile("#VaccinationPictureUploader", resizedPhotoPath);
      await util.commitFile("#ResidencyPictureUploader", resizedPhotoPath);

      await page.focus("#PassportNumber");
      await page.click("#PassportNumber");
      await page.waitForTimeout(500);
      util.incrementSelectedTraveler();
      await page.click("#qa-add-mutamer-save");
      await page.waitForTimeout(500);
    default:
      break;
  }
}

module.exports = { send };