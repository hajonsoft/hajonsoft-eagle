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
    url: "https://visa.mofa.gov.sa/Account/HajSmartForm",
    details: [
      {
        selector: "#Id",
        value: (row) => row.mofaNumber,
      },
      {
        selector: "#PassportNumber",
        value: (row) => row.passportNumber,
      },
      {
        selector: "#NationalityIsoCode",
        value: (row) => row.nationality.code,
      },
    ],
  },
  {
    name: "step1",
    regex:
    "https://visa.mofa.gov.sa/HajSmartForm/Step1/\\d+",
  },
  {
    name: "step2",
    regex:
    "https://visa.mofa.gov.sa/HajSmartForm/Step2/\\d+",
    details: [
      {
        selector: "#AddressContactInfoModel_Address",
        value: (row) => row.address,
      },
      {
        selector: "#AddressContactInfoModel_HomePhone",
        value: (row) => row.tel,
      },
      {
        selector: "#AddressContactInfoModel_Mobile",
        value: (row) => row.cell,
      },
      {
        selector: "#AddressContactInfoModel_ZipCode",
        value: (row) => row.postalcode,
      },
      {
        selector: "#AddressContactInfoModel_POBox",
        value: (row) => row.pobox,
      },
      {
        selector: "#JobModel_Profession",
        value: (row) => row.profession,
      },
      {
        selector: "#JobModel_CurrentJob",
        value: (row) => row.profession,
      },
      {
        selector: "",
        value: (row) => row.cell,
      },
      {
        selector: "",
        value: (row) => row.cell,
      },
      {
        selector: "",
        value: (row) => row.cell,
      },
    ],
  },
  {
    name: "step3",
    regex:
    "https://visa.mofa.gov.sa/HajSmartForm/Step3/\\d+",
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
    case "login":
      await util.commit(page, currentConfig.details, passenger);
      util.endCase(currentConfig.name);
      await util.controller(page, {
        controller: {
          selector: '#content > div > div > h4',
          action: async () => {
            const selectedTraveller = await page.$eval(
              "#hajonsoft_select",
              (el) => el.value
            );
            if (selectedTraveller) {
              try {
                await page.click('#wrapper > div.gwt-DialogBox > div > table > tbody > tr.dialogMiddle > td.dialogMiddleCenter > div > div > div > table > tbody > tr:nth-child(5) > td > fieldset > table > tbody > tr > td:nth-child(1) > button');
                fs.writeFileSync("./selectedTraveller.txt", selectedTraveller);
                const data = fs.readFileSync("./data.json", "utf-8");
                var passengersData = JSON.parse(data);
                var passenger = passengersData.travellers[selectedTraveller];
                await page.keyboard.type(passenger.codeline);
                await page.keyboard.type("{ENTER}");
                await util.commit(page, [
                  {
                    xPath: '//input[@type="text"]',
                    index: 38,
                    value: (row) => row.name.first
                  },
                  {
                    xPath: '//input[@type="text"]',
                    index: 39,
                    value: (row) => row.name.father
                  },
                  {
                    xPath: '//input[@type="text"]',
                    index: 40,
                    value: (row) => row.name.grand
                  },
                  {
                    xPath: '//input[@type="text"]',
                    index: 41,
                    value: (row) => row.name.last
                  },
                  {
                    xPath: '//input[@type="text"]',
                    index: 33,
                    value: (row) => row.nationality.isArabic && row.nameArabic.first
                  },
                  {
                    xPath: '//input[@type="text"]',
                    index: 34,
                    value: (row) => row.nationality.isArabic && row.nameArabic.father
                  },
                  {
                    xPath: '//input[@type="text"]',
                    index: 35,
                    value: (row) => row.nationality.isArabic && row.nameArabic.grand
                  },
                  {
                    xPath: '//input[@type="text"]',
                    index: 36,
                    value: (row) => row.nationality.isArabic && row.nameArabic.last
                  },
                  {
                    xPath: '//input[@type="text"]',
                    index: 45,
                    value: (row) => row.birthPlace
                  },
                  {
                    xPath: '//input[@type="text"]',
                    index: 48,
                    value: (row) => 'Paris'
                  },
                  {
                    xPath: '//input[@type="text"]',
                    index: 49,
                    value: (row) => row.profession
                  },
                  {
                    xPath: '//input[@type="text"]',
                    index: 51,
                    value: (row) => row.placeOfIssue
                  },
                  {
                    xPath: '//input[@type="text"]',
                    index: 53,
                    value: (row) => row.passIssueDt.dd
                  },
                  {
                    xPath: '//input[@type="text"]',
                    index: 54,
                    value: (row) => row.passIssueDt.mm
                  },
                  {
                    xPath: '//input[@type="text"]',
                    index: 55,
                    value: (row) => row.passIssueDt.yyyy
                  },
                  {
                    xPath: '//select',
                    index: 6,
                    value: (row) => "99"
                  },
                  {
                    xPath: '//select',
                    index: 7,
                    value: (row) => "99"
                  },
                  {
                    xPath: '//select',
                    index: 4,
                    value: (row) => "99"
                  },
                  {
                    selector: '#wrapper > div.gwt-DialogBox > div > table > tbody > tr.dialogMiddle > td.dialogMiddleCenter > div > div > div > table > tbody > tr:nth-child(7) > td > table > tbody > tr:nth-child(3) > td > table > tbody > tr:nth-child(3) > td > table > tbody > tr > td:nth-child(2) > select',
                    value: (row) => "15"
                  },
                ], passenger);

                if (passenger.gender === "Female") {
                  await util.commit(page, [
                    {
                      selector: '#wrapper > div.gwt-DialogBox > div > table > tbody > tr.dialogMiddle > td.dialogMiddleCenter > div > div > div > table > tbody > tr:nth-child(7) > td > table > tbody > tr:nth-child(3) > td > table > tbody > tr:nth-child(3) > td > table > tbody > tr > td:nth-child(2) > select',
                      value: (row) => "15"
                    }
                  ], passenger)
                } else {
                  await util.commit(page, [
                    {
                      selector: '#wrapper > div.gwt-DialogBox > div > table > tbody > tr.dialogMiddle > td.dialogMiddleCenter > div > div > div > table > tbody > tr:nth-child(7) > td > table > tbody > tr:nth-child(3) > td > table > tbody > tr:nth-child(3) > td > table > tbody > tr > td:nth-child(2) > select',
                      value: (row) => "0"
                    }
                  ], passenger)
                }
                await page.emulateVisionDeficiency("blurredVision");
                let portraitImage = await util.downloadAndResizeImage(
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
                const vaccineImage = await util.downloadAndResizeImage(
                  passenger,
                  400,
                  400,
                  "vaccine"
                );

                await util.commitFile("#wrapper > div.gwt-DialogBox > div > table > tbody > tr.dialogMiddle > td.dialogMiddleCenter > div > div > div > table > tbody > tr:nth-child(4) > td > table > tbody > tr > td:nth-child(2) > table > tbody > tr > td:nth-child(1) > table > tbody > tr > td > table > tbody > tr:nth-child(3) > td > table > tbody > tr > td > table > tbody > tr:nth-child(2) > td > div > table > tbody > tr > td:nth-child(1) > form > div > input", portraitImage);
                await util.commitFile("#wrapper > div.gwt-DialogBox > div > table > tbody > tr.dialogMiddle > td.dialogMiddleCenter > div > div > div > table > tbody > tr:nth-child(7) > td > table > tbody > tr:nth-child(1) > td > table > tbody > tr:nth-child(12) > td:nth-child(3) > table > tbody > tr:nth-child(2) > td > div > table > tbody > tr > td:nth-child(1) > form > div > input", vaccineImage);
                await page.emulateVisionDeficiency("none");
                await page.evaluate(() => {
                  const uplodPassportBtn = document.querySelector("#wrapper > div.gwt-DialogBox > div > table > tbody > tr.dialogMiddle > td.dialogMiddleCenter > div > div > div > table > tbody > tr:nth-child(4) > td > table > tbody > tr > td:nth-child(2) > table > tbody > tr > td:nth-child(2) > table > tbody > tr > td > table > tbody > tr:nth-child(3) > td > button");
                  if (uplodPassportBtn) {
                    uplodPassportBtn.click();
                  }
                });
                await util.commitFile("#wrapper > div:nth-child(18) > div > table > tbody > tr.dialogMiddle > td.dialogMiddleCenter > div > table > tbody > tr:nth-child(1) > td > table > tbody > tr > td:nth-child(2) > table > tbody > tr:nth-child(2) > td > div > table > tbody > tr > td:nth-child(1) > form > div > input", resizedPassportPath);

                // Clip Crop photo here
              } catch (err) {
                console.log(err.message);
              }
            }
          }
        },
      }, data.travellers);
      await page.click('#Captcha')
      break;
    case "step1":
      break;
    case "step2":
      await util.commit(page, currentConfig.details, passenger);
      await page.click("#HaveTraveledToOtherCountriesNo");
      break;
    case "step3":
      await util.commit(page, currentConfig.details, passenger);
      await page.click("#HaveRejectedAppNo");
      await page.click("#HaveReleativesCurrentlyResidentKsaNo");
      await page.click("#QuestionModelList_4__AnswerNo");
      await page.click("#QuestionModelList_5__AnswerNo");
      await page.click("#QuestionModelList_6__AnswerNo");
      await page.click("#QuestionModelList_7__AnswerNo");
      await page.click("#QuestionModelList_8__AnswerNo");
      await page.click("#QuestionModelList_9__AnswerNo");
      await page.click("#QuestionModelList_10__AnswerNo");
      await page.click("#QuestionModelList_11__AnswerNo");
      await page.click("#QuestionModelList_12__AnswerNo");
      await page.click("#QuestionModelList_1__AnswerNo");
      await page.click("#QuestionModelList_3__AnswerYes");
      await page.waitForSelector('#QuestionModelList_3__Note')
      await page.type('#QuestionModelList_3__Note', 'anti meningite, anti covid, anti flu');

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
      await util.commitFile("#PassportImageFile", resizedPassportPath);
      await util.commitFile("#VaccinationImageFile", resizedVaccinePath);
      await util.commitFile("#MahramRelationFile", resizedPassportPath);
      break;
    default:
      break;
  }
}

module.exports = { send };
