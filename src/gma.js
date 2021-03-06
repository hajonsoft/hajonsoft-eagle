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

const mutamerConfig = {
  details: [
    { selector: "#txt_EnglishName1", value: (row) => row.name.first },
    { selector: "#txt_EnglishName2", value: (row) => row.name.father },
    { selector: "#txt_EnglishName3", value: (row) => row.name.grand },
    { selector: "#txt_EnglishName4", value: (row) => row.name.last },
    { selector: "#txt_PassportNumber", value: (row) => row.passportNumber },
    { selector: "#ddl_Titles", value: (row) => "99" },
    {
      selector: "#ddl_Gender",
      value: (row) => (row.gender == "Female" ? "2" : "1"),
    },
    { selector: "#ddl_BirthCountry", value: (row) => row.nationality.telCode },
    { selector: "#ddl_Nationality", value: (row) => row.nationality.code },
    {
      selector: "#ddl_RelationShip",
      value: (row) => row.gender == "Female" && "15",
    },

    { selector: "#ddl_IssueCountry", value: (row) => row.nationality.code },
    {
      selector: "#txt_Occupation",
      value: (row) => decodeURI(row.profession || "unknown"),
    },
    { selector: "#ddl_MaritalStatus", value: (row) => "99" },
    { selector: "#ddl_EducationalLevel", value: (row) => "99" },
    {
      selector: "#txt_BirthCity",
      value: (row) => decodeURI(row.birthPlace),
    },
    {
      selector: "#txt_ArabicName1",
      value: (row) => row.nameArabic.first,
    },
    {
      selector: "#txt_ArabicName4",
      value: (row) => row.nameArabic.last,
    },
    {
      selector: "#txt_ArabicName3",
      value: (row) => row.nameArabic.grand,
    },
    {
      selector: "#txt_ArabicName2",
      value: (row) => row.nameArabic.father,
    },
    {
      selector: "#txt_IssueDate",
      value: (row) =>
        `${row.passIssueDt.yyyy}/${row.passIssueDt.mm}/${row.passIssueDt.dd}`,
    },
    {
      selector: "#txt_ExpiryDate",
      value: (row) =>
        `${row.passExpireDt.yyyy}/${row.passExpireDt.mm}/${row.passExpireDt.dd}`,
    },
    {
      selector: "#txt_BirthDate",
      value: (row) => `${row.dob.yyyy}/${row.dob.mm}/${row.dob.dd}`,
    },
    {
      selector: "#txt_IssueCity",
      value: (row) => decodeURI(row.placeOfIssue),
    },
  ],
};

const config = [
  {
    name: "login",
    url: "https://eumra.com/login.aspx",
    details: [
      { selector: "#LoginName", value: (system) => system.username },
      { selector: "#password", value: (system) => system.password },
    ],
  },
  {
    name: "download",
    url: "https://eumra.com/homepage.aspx?P=downloads",
  },
  {
    name: "main",
    url: "https://eumra.com/homepage.aspx?P=DashboardClassic",
  },
  {
    name: "create-group-or-mutamer",
    url: "https://eumra.com/auploader.aspx#/tab1_1",
    details: [
      {
        selector: "#txt_GroupName",
        value: (row) =>
          `${row.name.first}-${row.name.last}-${moment().format("HH:mm:ss")}`,
      },
    ],
    controller: {
      selector: "#li1_2",
      action: async () => {
        const selectedTraveller = await page.$eval(
          "#hajonsoft_select",
          (el) => el.value
        );
        if (selectedTraveller) {
          try {
            await page.click(
              "#tab1_1 > div:nth-child(4) > div > div > button.btn.btn-warning"
            );
            fs.writeFileSync("./selectedTraveller.txt", selectedTraveller);
            const data = fs.readFileSync("./data.json", "utf-8");
            var passengersData = JSON.parse(data);
            var passenger = passengersData.travellers[selectedTraveller];
            await page.evaluate(
              () => (document.querySelector("#txt_Mrz").disabled = false)
            );
            await page.type(
              "#txt_Mrz",
              passenger.codeline || "codeline missing"
            );
            await page.emulateVisionDeficiency("blurredVision");

            await page.waitForTimeout(5000);
            await util.commit(page, mutamerConfig.details, passenger);
            for (const field of mutamerConfig.details) {
              await page.$eval(field.selector, e=> {
                e.removeAttribute('readonly');
                e.removeAttribute('disabled');
              });
            }
            await page.click("#CodeNumberTextBox");
            let photoPath = path.join(
              util.photosFolder,
              `${passenger.passportNumber}.jpg`
            );

            await util.downloadImage(passenger.images.photo, photoPath);
            const resizedPhotoPath = path.join(
              util.photosFolder,
              `${passenger.passportNumber}_200x200.jpg`
            );
            await sharp(photoPath).resize(200, 200, {
              fit: sharp.fit.inside,
              withoutEnlargement: true,
            }).toFile(resizedPhotoPath);
            if (!process.argv.includes("noimage")) {
              await util.commitFile("#img_Mutamer", resizedPhotoPath);
            }

            const passportPath = path.join(
              util.passportsFolder,
              `${passenger.passportNumber}.jpg`
            );
            await util.downloadImage(passenger.images.passport, passportPath);
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

            await page.waitForSelector("#Mutamer_imgPP");
            if (!process.argv.includes("noimage")) {
              await util.commitFile("#img_MutamerPP", resizedPassportFile);
            }
            // const resizedVaccinePath = await util.downloadAndResizeImage(
            //   passenger,
            //   100,
            //   100,
            //   "vaccine"
            // );
            // if (
            //   !process.argv.includes("noimage")
            // ) {
            //   await util.commitFile("#VaccineCertificate", resizedVaccinePath);
            // }
            await page.emulateVisionDeficiency("none");
            await util.waitForCaptcha("#CodeNumberTextBox", 5);
            await page.click(
              "#tab1_1 > div:nth-child(4) > div > div > button.btn.btn-success"
            );
          } catch (err) {
            console.log(err.message);
          }
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
  counter = util.useCounter(counter);
  if (counter >= data?.travellers?.length) {
    return;
  }
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
      await util.waitForCaptcha("#CodeNumberTextBox", 5);
      await page.click("#btn_Login");
      break;
    case "main":
    case "download":
      await page.goto("https://eumra.com/auploader.aspx#/tab1_1", {
        waitUntil: "networkidle2",
      });
      break;
    case "create-group-or-mutamer":
      await util.commit(page, currentConfig.details, data.travellers[0]);

      await page.waitFor("#txt_PassportNumber", { visible: true });
      await util.controller(page, currentConfig, data.travellers);

      break;
    case "create-mutamer":
      // await util.commit(page, currentConfig.details, traveller);
      break;
    default:
      break;
  }
}

module.exports = { send };
