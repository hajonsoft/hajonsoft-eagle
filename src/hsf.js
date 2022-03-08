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
let mofas = [];

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
    name: "agreement",
    url: "https://visa.mofa.gov.sa/HajSmartForm/ElectronicAgreement",
  },
  {
    name: "step1",
    regex: "https://visa.mofa.gov.sa/HajSmartForm/Step1/\\d+",
  },
  {
    name: "step2",
    regex: "https://visa.mofa.gov.sa/HajSmartForm/Step2/\\d+",
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
        selector: "#SOCIAL_STATUS",
        value: (row) => "5",
      },
      {
        selector: "#FlightDataModel_TransportModeID",
        value: (row) => "2",
      },
    ],
  },
  {
    name: "step3",
    regex: "https://visa.mofa.gov.sa/HajSmartForm/Step3/\\d+",
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
let mokhaaPage;
async function pageContentHandler(currentConfig) {
  const passenger = data.travellers[counter];
  switch (currentConfig.name) {
    case "login":
      await util.commit(page, currentConfig.details, passenger);
      util.endCase(currentConfig.name);
      await util.controller(
        page,
        {
          controller: {
            selector: "#content > div > div > h4",
            mokhaa: true,
            action: async () => {
              const selectedTraveller = await page.$eval(
                "#hajonsoft_select",
                (el) => el.value
              );
              if (selectedTraveller) {
                try {
                  fs.writeFileSync(
                    "./selectedTraveller.txt",
                    selectedTraveller
                  );
                  const data = fs.readFileSync("./data.json", "utf-8");
                  var passengersData = JSON.parse(data);
                  var passenger = passengersData.travellers[selectedTraveller];
                  if (!passenger.mofaNumber) {
                    const found = mofas.find(
                      (mofa) => mofa.passportNumber === passenger.passportNumber
                    );
                    if (found) {
                      passenger.mofaNumber = found.mofaNumber;
                    }
                  }
                  await util.commit(
                    page,
                    config.find((con) => con.name === "login").details,
                    passenger
                  );
                } catch (err) {
                  console.log(err.message);
                }
              }
            },
            wtuAction: async () => {
              mokhaaPage = await util.newPage(onWTOLoad, onWTOClosed);
              await mokhaaPage.goto(
                "https://www.waytoumrah.com/prj_umrah/eng/eng_frmlogin.aspx",
                {
                  waitUntil: "domcontentloaded",
                }
              );
            },
          },
        },
        data.travellers
      );
      await page.click("#Captcha");
      break;
    case "agreement":
      await page.waitForSelector(
        "#content > div > div.row > div > div > div.portlet-body.form > div > div.form-actions.fluid.right > div > div > a.btn.green"
      );
      await page.click(
        "#content > div > div.row > div > div > div.portlet-body.form > div > div.form-actions.fluid.right > div > div > a.btn.green"
      );
      break;
    case "step1":
      break;
    case "step2":
      await util.commit(page, currentConfig.details, passenger);
      await page.click("#HaveTraveledToOtherCountriesNo");
      await page.waitForSelector("#CarNumber");
      const flightNumber = await page.$eval("#CarNumber", (el) => el.value);
      if (!flightNumber) {
        await page.type("#CarNumber", "SV216");
      }
      const emailAddress = await page.$eval(
        "#AddressContactInfoModel\\.Email",
        (el) => el.value
      );
      if (!emailAddress) {
        await page.type(
          "#AddressContactInfoModel\\.Email",
          passenger.name.full.replace(/ /g, "") + "@alldrys.com"
        );
      }
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
      await page.click("#QuestionModelList_1__AnswerNo");
      await page.waitForSelector("#QuestionModelList_12__AnswerNo");
      await page.click("#QuestionModelList_12__AnswerNo");
      await page.waitForSelector("#QuestionModelList_3__AnswerYes");
      await page.click("#QuestionModelList_3__AnswerYes");
      await page.waitForSelector("#QuestionModelList_3__Note");
      const vaccineNote = await page.$eval(
        "#QuestionModelList_3__Note",
        (el) => el.value
      );
      if (!vaccineNote) {
        await page.type(
          "#QuestionModelList_3__Note",
          "anti meningite, anti covid, anti flu"
        );
      }

      const resizedPassportPath = await util.downloadAndResizeImage(
        passenger,
        400,
        300,
        "passport"
      );
      const resizedVaccinePath = await util.downloadAndResizeImage(
        passenger,
        200,
        200,
        "vaccine"
      );
      await util.commitFile("#PassportImageFile", resizedPassportPath);
      await util.commitFile("#VaccinationImageFile", resizedVaccinePath);
      await util.commitFile("#MahramRelationFile", resizedPassportPath);

      await page.evaluate((passenger) => {
        const passportContainer = document.querySelector(
          "#myform > div.form-body.form-horizontal > div.table-scrollable.table-scrollable-borderless.table-fileupload > table > tbody > tr:nth-child(1) > td:nth-child(3)"
        );
        passportContainer.innerHTML = `
              <img src='${passenger.images.passport}' width="50" height="25"/>
              `;

        const vaccineContainer = document.querySelector(
          "#myform > div.form-body.form-horizontal > div.table-scrollable.table-scrollable-borderless.table-fileupload > table > tbody > tr.warning > td:nth-child(3)"
        );
        vaccineContainer.innerHTML = `
                <img src='${passenger.images.vaccine}' width="50" height="25"/>
                `;

        const muhramContainer = document.querySelector(
          "#myform > div.form-body.form-horizontal > div.table-scrollable.table-scrollable-borderless.table-fileupload > table > tbody > tr:nth-child(3) > td:nth-child(3)"
        );
        muhramContainer.innerHTML = `
                  <img src='${passenger.images.passport}' width="50" height="25"/>
                  `;
      }, passenger);

      break;
    default:
      break;
  }
}
async function onWTOLoad(res) {
  const url = await mokhaaPage.url();
  if (!url) {
    return;
  }
  if (url.toLowerCase().includes("Eng_RptMofaRtp.aspx?".toLowerCase())) {
    for (let i = 1; i < 1000; i++) {
      try {
        let passSelector = `#dgrdMofaRpt > tbody > tr:nth-child(${i}) > td:nth-child(7)`;
        let mofaSelector = `#dgrdMofaRpt > tbody > tr:nth-child(${i}) > td:nth-child(8)`;
        let nationalitySelector = `#dgrdMofaRpt > tbody > tr:nth-child(${i}) > td:nth-child(13)`;
        let passportNumber = await mokhaaPage.$eval(
          passSelector,
          (e) => e.innerText
        );
        let mofaNumber = await mokhaaPage.$eval(
          mofaSelector,
          (e) => e.innerText
        );
        let nationality = await mokhaaPage.$eval(
          nationalitySelector,
          (e) => e.innerText
        );
        mofas.push({ passportNumber, mofaNumber, nationality });
      } catch {
        console.log("mofa downloaded");
        return;
      }
    }
  }
}

async function onWTOClosed(res) {
  const url = await mokhaaPage.url();
  if (!url) {
    return;
  }
}

module.exports = { send };
