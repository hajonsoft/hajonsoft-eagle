const puppeteer = require("puppeteer-extra");
// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const fs = require("fs");
const path = require("path");
const util = require("./util");
const moment = require("moment");
const sharp = require("sharp");
const SERVER_NUMBER = 1;
let page;
let data;
let counter = 0;

const config = [
  {
    name: "login",
    url: `https://app${SERVER_NUMBER}.babalumra.com/Security/login.aspx`,
    details: [
      { selector: "#txtUserName", value: (system) => system.username },
      { selector: "#txtPassword", value: (system) => system.password },
    ],
  },
  {
    name: "main",
    url: `http://app${SERVER_NUMBER}.babalumra.com/Security/MainPage.aspx`,
  },
  {
    name: "create-group",
    url: `http://app${SERVER_NUMBER}.babalumra.com/Groups/AddNewGroup.aspx?gMode=1`,
    details: [
      {
        selector: "#ctl00_ContentHolder_TxtGroupName",
        value: (row) =>
          row.info.caravan.replace(/ /g, "-") +
          "-" +
          moment().format("MMDDHHmmss"),
      },
      {
        selector: "#ctl00_ContentHolder_TxtNotes",
        value: () => new Date().toString(),
      },
      {
        selector: "#ctl00_ContentHolder_TxtExpectedArrivalDate_dateInput",
        value: () => moment().add(7, "days").format("DD/MM/YYYY"),
      },
    ],
  },
  {
    name: "create-mutamer",
    regex: `http://app${SERVER_NUMBER}.babalumra.com/Groups/EditMutamerNew.aspx\\?GroupId=\\d+`,
    controller: {
      selector:
        "#aspnetForm > div.container-fluid.body-content > div.page-header",
      action: async () => {
        const selectedTraveller = await page.$eval(
          "#hajonsoft_select",
          (el) => el.value
        );
        if (selectedTraveller) {
          fs.writeFileSync("./selectedTraveller.txt", selectedTraveller);
          const passenger = data.travellers[selectedTraveller];
          await sendPassenger(passenger);
        }
      },
    },
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
    await runPageConfiguration(currentConfig);
  } catch (err) {
    console.log(err);
  }
}

async function runPageConfiguration(currentConfig) {
  switch (currentConfig.name) {
    case "login":
      await util.commit(page, currentConfig.details, data.system);
      await util.premiumSupportAlert(page, '#form1 > div:nth-child(14) > div', data);
      await page.waitForSelector("#rdCap_CaptchaTextBox");
      await page.focus("#rdCap_CaptchaTextBox");
      await util.commitCaptchaToken(
        page,
        "rdCap_CaptchaImage",
        "#rdCap_CaptchaTextBox",
        5
      );
      await page.waitForTimeout(5000);
      await page.waitForFunction(
        "document.querySelector('#rdCap_CaptchaTextBox').value.length === 5"
      );
      await page.click("#lnkLogin");
      break;
    case "main":
      await page.goto(
        `http://app${SERVER_NUMBER}.babalumra.com/Groups/AddNewGroup.aspx?gMode=1`
      );
      break;
    case "create-group":
      const groupName = await page.$eval(
        "#ctl00_ContentHolder_TxtGroupName",
        (e) => e.value
      );
      if (groupName) {
        return;
      }
      await util.commit(page, currentConfig.details, data);
      await page.evaluate(() => {
        const consulate = document.querySelector(
          "#ctl00_ContentHolder_LstConsulate"
        );
        const consulateOptions = consulate.querySelectorAll("option");
        const consulateOptionsCount = [...consulateOptions].length;
        if (consulateOptionsCount === 2) {
          consulateOptions[1].selected = true;
        }
      });
      // await page.click("#ctl00_ContentHolder_btnCreate");
      // #ctl00_ContentHolder_LblDepLtPackEnd
      break;
    case "create-mutamer":
      await util.controller(page, currentConfig, data.travellers);
      if (fs.existsSync("./loop.txt")) {
        const passenger =
          data.travellers[
            parseInt(fs.readFileSync("./selectedTraveller.txt", "utf-8"))
          ];
        sendPassenger(passenger);
      }
      break;
    default:
      break;
  }
}

async function sendPassenger(passenger) {
  const passportNumber = await page.$eval(
    "#ctl00_ContentHolder_TxtNumber",
    (e) => e.value
  );
  // Do not continue if the passport number field is not empty - This could be a manual page refresh
  if (passportNumber) {
    return;
  }
  await page.waitForTimeout(3000);
  await page.waitForSelector("#btnclick");
  await page.evaluate(() => {
    const scanButton = document.querySelector("#btnclick");
    if (scanButton) {
      scanButton.click();
    }
  });

  const scanInputSelector = "#ctl00_ContentHolder_btngetValues";

  await page.waitForSelector(scanInputSelector);
  await page.type("#ctl00_ContentHolder_btngetValues", passenger.codeline, {
    delay: 0,
  });
  // Wait for the input field to receieve the value
  await page.waitForTimeout(4000);
  await util.commit(
    page,
    [
      { selector: "#ctl00_ContentHolder_LstTitle", value: (row) => "99" },
      {
        selector: "#ctl00_ContentHolder_txtMutamerOcc",
        value: (row) => decodeURI(row.profession),
      },
      { selector: "#ctl00_ContentHolder_LstSocialState", value: (row) => "99" },
      { selector: "#ctl00_ContentHolder_LstEducation", value: (row) => "99" },
      {
        selector: "#ctl00_ContentHolder_TxtBirthCity",
        value: (row) => decodeURI(row.birthPlace),
      },
      {
        selector: "#ctl00_ContentHolder_TxtAddressCity",
        value: (row) => decodeURI(util.getIssuingCountry(row)?.name),
      },
      {
        selector: "#ctl00_ContentHolder_TxtAltFirstName",
        value: (row) => row.nameArabic.first,
      },
      {
        selector: "#ctl00_ContentHolder_TxtAltLastName",
        value: (row) => row.nameArabic.last,
      },
      {
        selector: "#ctl00_ContentHolder_TxtAltGrandFatherName",
        value: (row) => row.nameArabic.grand,
      },
      {
        selector: "#ctl00_ContentHolder_TxtAltSecondName",
        value: (row) => row.nameArabic.father,
      },
      {
        selector: "#ctl00_ContentHolder_calPassIssue_dateInput",
        value: (row) => row.passIssueDt.dmy,
      },
      {
        selector: "#ctl00_ContentHolder_TxtCityIssuedAt",
        value: (row) => decodeURI(row.placeOfIssue),
      },
      {
        selector: "#ctl00_ContentHolder_LstType",
        value: (row) =>
          row.codeline.substring(2, 5) != row.codeline.substring(54, 57)
            ? "3"
            : "1",
      },
      {
        selector: "#ctl00_ContentHolder_LstBirthCountry",
        value: (row) => row.nationality.telCode,
      },
      {
        selector: "#ctl00_ContentHolder_LstAddressCountry",
        value: (row) => util.getIssuingCountry(row)?.telCode,
      },
    ],
    passenger
  );
  // paste 2 images
  let photoPath = path.join(
    util.photosFolder,
    `${passenger.passportNumber}.jpg`
  );
  await util.downloadImage(passenger.images.photo, photoPath);
  await page.waitForSelector("#ctl00_ContentHolder_imgSelectedFile");
  let futureFileChooser = page.waitForFileChooser();
  await page.evaluate(() =>
    document.querySelector("#ctl00_ContentHolder_ImageUploaderControl").click()
  );
  let fileChooser = await futureFileChooser;
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
  await fileChooser.accept([resizedPhotoPath]);

  const passportPath = path.join(
    util.passportsFolder,
    `${passenger.passportNumber}.jpg`
  );
  await util.downloadImage(passenger.images.passport, passportPath);
  if (fs.existsSync(passportPath)) {
    futureFileChooser = page.waitForFileChooser();
    await page.evaluate(() =>
      document
        .querySelector("#ctl00_ContentHolder_ImageUploaderControlPassport")
        .click()
    );
    fileChooser = await futureFileChooser;
    let resizedPassportFile = path.join(
      util.passportsFolder,
      `${passenger.passportNumber}_400x300.jpg`
    );
    await sharp(passportPath)
      .resize(400, 300, {
        fit: sharp.fit.inside,
        withoutEnlargement: true,
      })
      .toFile(resizedPassportFile);
    await fileChooser.accept([resizedPassportFile]);
  }

  // move index to next passenger if exists
  const passengerIndex = fs.readFileSync("./selectedTraveller.txt", "utf8");
  if (passengerIndex < data.travellers.length - 1) {
    const nextIndex = parseInt(passengerIndex) + 1;
    fs.writeFileSync("./selectedTraveller.txt", nextIndex.toString());
  } else {
    // if no more passengers, delete loop.txt
    if (fs.existsSync("./loop.txt")) {
      fs.unlinkSync("./loop.txt");
    }
  }

  await util.commitCaptchaToken(
    page,
    "ctl00_ContentHolder_rdCap_CaptchaImageUP",
    "#ctl00_ContentHolder_rdCap_CaptchaTextBox",
    5
  );
}

module.exports = { send, config, SERVER_NUMBER };
