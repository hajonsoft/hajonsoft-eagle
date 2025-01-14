const puppeteer = require("puppeteer-extra");
// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const RuCaptcha2Captcha = require("rucaptcha-2captcha");
const fs = require("fs");
const path = require("path");
const util = require("./util");
const { getPath } = require("./lib/getPath");
const moment = require("moment");
const kea = require("./lib/kea");
const { default: axios } = require("axios");
const { homedir } = require("os");
const JSZip = require("jszip");

const {
  injectTWFEagleButton,
  onTWFPageLoad,
  initialize: initializeTWFImport,
} = require("./mofa_import/twf");
const {
  injectWTUEagleButton,
  onWTUPageLoad,
  initialize: initializeWTUImport,
} = require("./mofa_import/wtu");
const {
  injectBAUEagleButton,
  onBAUPageLoad,
  initialize: initializeBAUImport,
} = require("./mofa_import/bau");
const {
  injectNSKEagleButton,
  onNSKPageLoad,
  initialize: initializeNSKImport,
} = require("./mofa_import/nsk");
const { SERVER_NUMBER } = require("./bau");
const { hsf_nationalities } = require("./data/nationalities");
const { clearInterval } = require("timers");

let page;
let data;
let counter = 0;
let mofas = [];

let wtuPage;
let gmaPage;
let bauPage;
let twfPage;
let nskPage;

let status = "idle";

let retries = 0;
let countEmbassy = 0;
const downloadsFolder = path.join(homedir(), "Downloads");

const config = [
  {
    name: "print-visa",
    url: "https://visa.mofa.gov.sa/visaservices/searchvisa",
    controller: {
      name: "searchVisa",
      selector: "#content > div > div.page-head > div",
      visaPath: `Downloading to: ${downloadsFolder}`,
      action: async () => {
        const selectedTraveller = await page.$eval(
          "#hajonsoft_select",
          (el) => el.value
        );
        if (selectedTraveller) {
          util.setSelectedTraveller(selectedTraveller);
          await sendPassengerToPrint(selectedTraveller);
          return;
        }
      },
    },
  },
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
    name: "print-haj-visa",
    url: "https://visa.mofa.gov.sa/Home/PrintHajVisa",
  },
  {
    name: "print-event-visa",
    url: "https://visa.mofa.gov.sa/Home/PrintEventVisa",
  },
  {
    name: "print-tour-visa",
    url: "https://visa.mofa.gov.sa/Home/PrintTourVisit",
  },
  {
    name: "agreement",
    url: "https://visa.mofa.gov.sa/HajSmartForm/ElectronicAgreement",
  },
  {
    name: "step1",
    regex: "https://visa.mofa.gov.sa/HajSmartForm/Step1",
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
        value: (row) => row.phone,
      },
      {
        selector: "#AddressContactInfoModel_Mobile",
        value: (row) => row.phone,
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
        value: (row) => row.profession || "unknown",
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
  {
    name: "step4",
    regex: "https://visa.mofa.gov.sa/HajSmartForm/Step4/\\d+",
  },
  {
    name: "add",
    regex: "https://visa.mofa.gov.sa/HajSmartForm/Add",
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
      { selector: "#PASSPORType", value: (row) => "680" },
      {
        selector: "#NATIONALITY",
        value: (row) => getNationalityCode(row.nationality.name),
      },
      {
        selector: "#NATIONALITY_FIRST",
        value: (row) => getNationalityCode(row.nationality.name),
      },
      { selector: "#RELIGION", value: (row) => "1" },
      { selector: "#SOCIAL_STATUS", value: (row) => "5" },
      { selector: "#Sex", value: (row) => (row.gender === "Male" ? "1" : "2") },
      { selector: "#PersonId", value: (row) => row.passportNumber },
    ],
  },
];

async function send(sendData) {
  data = sendData;
  page = await util.initPage(config, onContentLoaded, data);
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

const getPassenger = () => {
  const index = util.getSelectedTraveler();
  if (index < data.travellers.length) {
    return data.travellers[index];
  }
  // TODO: Exit if no more valid passenger
  return null;
};

async function showController() {
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
          status = "sending";
          util.setSelectedTraveller(selectedTraveller);
          await sendPassenger(selectedTraveller);
        },
        wtuAction: async () => {
          await beginWTUImport();
        },
        gmaAction: async () => {
          await beginGMAImport();
        },
        bauAction: async () => {
          await beginBAUImport();
        },
        twfAction: async () => {
          await beginTWFImport();
        },
        nskAction: async () => {
          await beginNSKImport();
        },
      },
    },
    data.travellers
  );
}

async function beginTWFImport() {
  status = "twf";
  twfPage = await util.newPage(onTWFPageLoad, () => {});
  initializeTWFImport(twfPage, data);
  twfPage.on("response", injectTWFEagleButton);
  await twfPage.goto(
    `https://www.etawaf.com/tawaf${util.hijriYear}/index.html`,
    {
      waitUntil: "domcontentloaded",
    }
  );
}

async function beginBAUImport() {
  status = "bau";
  bauPage = await util.newPage(onBAUPageLoad, () => {});
  initializeBAUImport(bauPage, data);
  // bauPage.on("response", injectBAUEagleButton);
  await bauPage.goto(
    `http://app${SERVER_NUMBER}.babalumra.com/Security/login.aspx`,
    {
      waitUntil: "domcontentloaded",
    }
  );
}

async function beginGMAImport() {
  status = "gma";
  gmaPage = await util.newPage(onGMAPageLoad, () => {});
  gmaPage.on("response", injectGMAEagleButton);
  const gmaBrowser = await gmaPage.browser();
  gmaBrowser.on("targetcreated", handleGMATargetCreated);
  await gmaPage.goto("https://eumra.com/login.aspx", {
    waitUntil: "domcontentloaded",
  });
}

async function beginWTUImport() {
  status = "wtu";
  wtuPage = await util.newPage(onWTUPageLoad, () => {});
  initializeWTUImport(wtuPage, data);
  wtuPage.on("response", injectWTUEagleButton);
  await wtuPage.goto(
    "https://www.waytoumrah.com/prj_umrah/eng/eng_frmlogin.aspx",
    {
      waitUntil: "domcontentloaded",
    }
  );
}

async function beginNSKImport() {
  status = "nsk";
  nskPage = await util.newPage(onNSKPageLoad, () => {});
  initializeNSKImport(nskPage, data);
  nskPage.on("response", injectNSKEagleButton);
  await nskPage.goto("https://bsp-nusuk.haj.gov.sa/Identity", {
    waitUntil: "domcontentloaded",
  });
}

function isValidPassenger(passenger) {
  return (
    passenger.mofaNumber &&
    passenger.passportNumber &&
    passenger.nationality.code
  );
}

async function startImport(page, data) {
  util.infoMessage(page, `start import from ${data.system.serviceProvider}`);
  status = "importing";
  switch (data.system.serviceProvider) {
    case "twf":
      beginTWFImport();
      break;
    case "bau":
      beginBAUImport();
      break;
    case "gma":
      beginGMAImport();
      break;
    case "wtu":
      beginWTUImport();
      break;
    case "nsk":
      beginNSKImport();
      break;
    default:
      return;
  }
}

async function pageContentHandler(currentConfig) {
  let passenger = getPassenger();
  switch (currentConfig.name) {
    case "login":
      // Check if page is REALLY loaded, since domcontentloaded is fired twice
      try {
        await page.waitForSelector(".page-header", {
          visible: true,
          timeout: 1000,
        });
      } catch {
        return;
      }
      showController();
      if (fs.existsSync(getPath("loop.txt"))) {
        const nextIndex = util.getSelectedTraveler();
        if (nextIndex < data.travellers.length) {
          await sendPassenger(nextIndex.toString());
        }
      } else {
        setTimeout(async () => {
          if (status === "idle") {
            fs.writeFileSync(getPath("loop.txt"), "loop");
            // await page.goto(config[0].url, { waitUntil: "domcontentloaded" });
            const nextIndex = util.getSelectedTraveler();
            if (nextIndex < data.travellers.length) {
              await sendPassenger(nextIndex.toString());
            }
          }
        }, 20000);
      }

      break;
    case "print-visa":
      await util.controller(page, currentConfig, data.travellers);
      // if loop.txt file exists, then loop
      if (fs.existsSync(getPath("loop.txt"))) {
        const nextIndex = util.getSelectedTraveler();
        if (nextIndex < data.travellers.length) {
          await sendPassengerToPrint(nextIndex.toString());
        }
      }

      break;
    case "print-haj-visa":
      const pageElement = await page.$("body > form > page");
      // take screen shot to kea
      try {
        await util.screenShotToKea(
          pageElement,
          data.system.accountId,
          passenger
        );
      } catch (error) {
        console.log(error);
      }
      // save screen shot to file

      util.incrementSelectedTraveler();
      await page.goto("https://visa.mofa.gov.sa/visaservices/searchvisa");
      break;
    case "print-event-visa":
    case "print-tour-visa":
      // make pdfPath, the download folder and append the passport number to it
      const pdfPath = path.join(
        path.join(homedir(), "Downloads"),
        passenger.passportNumber + ".pdf"
      );
      const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
      fs.writeFileSync(pdfPath, pdfBuffer);
      console.log("pdf saved to: ", pdfPath);
      const pageElement2 = await page.$("body");
      // save screenshot to kea
      try {
        await util.screenShotToKea(
          pageElement2,
          data.system.accountId,
          passenger,
          "Submitted"
        );
      } catch (error) {}
      // save status to kea
      await kea.updatePassenger(
        data.system.accountId,
        passenger.passportNumber,
        {
          "submissionData.hsf.status": "Submitted",
        }
      );
      util.incrementSelectedTraveler();
      await page.goto("https://visa.mofa.gov.sa/visaservices/searchvisa");
      break;
    case "agreement":
      await page.waitForSelector(
        "#content > div > div.page-content-inner > div.row > div > div > div.portlet-body.form > div > div.form-actions.fluid.right > div > div > a.btn.green"
      );
      await page.click(
        "#content > div > div.page-content-inner > div.row > div > div > div.portlet-body.form > div > div.form-actions.fluid.right > div > div > a.btn.green"
      );
      break;
    case "step1":
      await page.waitForSelector(
        "#myform > div.form-actions.fluid.right > div > div > button:nth-child(2)"
      );
      //#myform > div.form-actions.fluid.right > div > div > button:nth-child(2)
      await page.click(
        "#myform > div.form-actions.fluid.right > div > div > button:nth-child(2)"
      );
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
        (el) => el.value.trim()
      );
      if (!emailAddress) {
        await page.type("#AddressContactInfoModel\\.Email", "");
        await page.type(
          "#AddressContactInfoModel\\.Email",
          (passenger.name?.first?.replace(/ /g, "")?.toLowerCase() ||
            moment().format("YYYYMMDDHHmmss")) + "@hotmail.com"
        );
      }

      const flightDuration = await page.$eval(
        "#FlightDataModel\\.ExpectedStayDuration",
        (el) => el.value.trim()
      );
      if (!flightDuration) {
        await page.type("#FlightDataModel\\.ExpectedStayDuration", "");
        await page.type("#FlightDataModel\\.ExpectedStayDuration", "7");
      }
      await page.waitForSelector(
        "#myform > div.form-actions.fluid.right > div > div > button:nth-child(3)"
      );
      await page.click(
        "#myform > div.form-actions.fluid.right > div > div > button:nth-child(3)"
      );
      break;
    case "step3":
      await util.commit(page, currentConfig.details, passenger);
      await page.click("#HaveRejectedAppNo");
      await page.click("#HaveReleativesCurrentlyResidentKsaNo");
      await page.waitForSelector("#QuestionModelList_4__AnswerNo");
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
      const eNumber = await page.$eval(
        "#myform > div.form-body.form-horizontal > div:nth-child(2) > div",
        (el) => el.innerText
      );
      // Save eNumber
      if (eNumber) {
        await kea.updatePassenger(
          data.system.accountId,
          passenger.passportNumber,
          {
            eNumber,
          }
        );
      }

      if (
        eNumber &&
        fs.existsSync(getPath(passenger.passportNumber + ".txt"))
      ) {
        const existingPassengerDataString = fs.readFileSync(
          getPath(passenger.passportNumber + ".txt"),
          "utf-8"
        );
        const existingPassengerData = JSON.parse(existingPassengerDataString);
        existingPassengerData["eNumber"] = eNumber;

        fs.writeFileSync(
          getPath(passenger.passportNumber + ".txt"),
          JSON.stringify(existingPassengerData)
        );
      }
      const vaccineNote = await page.$eval(
        "#QuestionModelList_3__Note",
        (el) => el.value
      );
      if (!vaccineNote) {
        await page.type(
          "#QuestionModelList_3__Note",
          "anti meningite, anti covid, anti flu"
        );
        await page.$eval("#QuestionModelList_3__Note", (el) => el.blur());
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
      const isPassportUploadRequired = await page.$("PassportImageFile");
      if (isPassportUploadRequired) {
        await util.commitFile("#PassportImageFile", resizedPassportPath);
      }
      const isVaccineUploadRequired = await page.$("VaccinationImageFile");
      if (isVaccineUploadRequired) {
        await util.commitFile("#VaccinationImageFile", resizedVaccinePath);
      }
      const isMuhramRelationshipRequired = await page.$("#MahramRelationFile");
      if (isMuhramRelationshipRequired) {
        await util.commitFile("#MahramRelationFile", resizedPassportPath);
      }

      if (
        isPassportUploadRequired ||
        isVaccineUploadRequired ||
        isMuhramRelationshipRequired
      ) {
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
      }

      await page.waitForSelector(
        "#myform > div.form-actions.fluid.right > div > div > button:nth-child(3)"
      );

      await util.infoMessage(page, "saveButton clicked", 4, false, true);
      await page.click(
        "#myform > div.form-actions.fluid.right > div > div > button:nth-child(3)"
      );
      break;
    case "step4":
      if (fs.existsSync(getPath("add.json"))) {
        await util.commander(page, {
          controller: {
            selector: "#tab_wizard",
            title: "Add New",
            arabicTitle: "إضافه جديد",
            action: async () => {
              page.goto("https://visa.mofa.gov.sa/HajSmartForm/Add");
            },
          },
        });

        const mofaNumber = await page.$eval(
          "#myform > div.form-body.form-horizontal > div > div:nth-child(1) > div:nth-child(2)",
          (el) => el.innerText
        );
        const eNumber = await page.$eval(
          "#myform > div.form-body.form-horizontal > div > div:nth-child(2) > div",
          (el) => el.innerText
        );
        if (mofaNumber) {
          fs.writeFileSync(
            getPath(`${passenger.passportNumber}.txt`),
            JSON.stringify({
              mofaNumber,
              eNumber,
              passportNumber: passenger.passportNumber,
            })
          );
        }

        return;
      }

      const isSendToEmbassy = await page.$(
        "#myform > div.form-actions.fluid.right > div > div > button"
      );
      if (isSendToEmbassy) {
        await page.click(
          "#myform > div.form-actions.fluid.right > div > div > button"
        );
        return;
      }

      const visaStatus = await page.$(
        "#myform > div.form-body.form-horizontal > div.alert.alert-warning.text-center > h3"
      );
      if (visaStatus) {
        const visaStatusMessage = await page.$eval(
          "#myform > div.form-body.form-horizontal > div.alert.alert-warning.text-center > h3",
          (el) => el.innerText
        );

        if (
          visaStatusMessage &&
          (visaStatusMessage.includes("جاري") ||
            visaStatusMessage.includes("being"))
        ) {
          fs.appendFileSync(util.getLogFile(), visaStatusMessage + "\n");
          const pageElement = await page.$("body");
          // save screenshot to kea
          try {
            await util.screenShotToKea(
              pageElement,
              data.system.accountId,
              passenger,
              "Embassy"
            );
          } catch (error) {}
          // If sent to embassy twice in a row, exit because the website is malfunctioning
          countEmbassy += 1;
          if (
            countEmbassy >= 2 &&
            // Only for Moulavi account for now
            data.system.accountId === "saRY4bAqkkjJoACV7i5kaf"
          ) {
            console.log(
              "Sent to embassy twice in a row, exiting. Try again later."
            );
            process.exit(1);
          }
          util.incrementSelectedTraveler();
          await page.goto(config[0].url);
        }
      }
      const printButtonSelector =
        "#myform > div.form-actions.fluid.right > div > div > a.btn.btn-default.green";
      await page.waitFor(2000);

      const isPrintButton = await page.$(printButtonSelector);
      if (isPrintButton) {
        const href = await page.$eval(printButtonSelector, (el) => el.href);
        await page.goto(href, { waitUntil: "domcontentloaded" });
        // const visaFolder = path.join(homedir, "hajonsoft", "visa");
        // if (!fs.existsSync(visaFolder)) {
        //   fs.mkdirSync(visaFolder, { recursive: true });
        // }
        await page.waitForSelector(
          "body > form > page > div > div > div > div.evisa-header > div > div.evisa-col-12"
        );
        const visaElement = await page.$("body > form > page > div");
        // const caravanName = data.info?.caravan?.replace(/[^A-Z0-9]/g, "");
        // let saveFolder = visaFolder;
        // if (caravanName) {
        //   saveFolder = path.join(visaFolder, caravanName);
        // }
        // if (!fs.existsSync(saveFolder)) {
        //   fs.mkdirSync(saveFolder, { recursive: true });
        // }

        await page.waitFor(7000);
        await page.waitForSelector("#btnPrevious");
        await util.commander(page, {
          controller: {
            selector: "#btnPrevious",
            title: "Continue",
            arabicTitle: "استمرار",
            action: async () => {
              page.goto("https://visa.mofa.gov.sa/Account/HajSmartForm");
            },
          },
        });

        const currentPassenger =
          data.travellers[parseInt(util.getSelectedTraveler())];

        // Save base64 image to kea
        try {
          await util.screenShotToKea(
            visaElement,
            data.system.accountId,
            currentPassenger
          );
        } catch (error) {}
        countEmbassy = 0;
        util.incrementSelectedTraveler();
        await page.goto(config[0].url);

        // Save image to file
        // const visaFileName =
        //   path.join(
        //     saveFolder,
        //     currentPassenger?.passportNumber +
        //       "_" +
        //       currentPassenger?.name?.full.replace(/ /, "_") +
        //       "_" +
        //       moment().format("YYYY-MM-DD_HH-mm-ss")
        //   ) + ".png";

        // console.log("Saving visa to file: ", visaFileName);
        // await util.screenShotAndContinue(
        //   page,
        //   visaElement,
        //   visaFileName,
        //   config[0].url
        // );
        return;
      }
      await page.goto(config[0].url);
      break;
    case "add":
      status = "add";
      await util.controller(
        page,
        {
          controller: {
            selector:
              "#myform > div.form-body.form-horizontal > h3:nth-child(1)",
            name: "add",
            action: async () => {
              const selectedTraveller = await page.$eval(
                "#hajonsoft_select",
                (el) => el.value
              );
              await sendNewApplication(selectedTraveller);
            },
          },
        },
        data.travellers
      );
      await page.waitForSelector("#OrganizationId");
      await page.select("#OrganizationId", "302");

      fs.writeFileSync(getPath("add.json"), JSON.stringify(passenger));

      // if (fs.existsSync(getPath("loop.txt"))) {
      //   const nextTraveller = util.incrementSelectedTraveler();
      //   sendNewApplication(nextTraveller.toString());
      // }
      await page.hover(
        "#myform > div.form-actions.fluid.right > div > div > button"
      );
      await page.focus(
        "#myform > div.form-actions.fluid.right > div > div > button"
      );

      break;
    default:
      break;
  }
}

async function sendNewApplication(selectedTraveller) {
  // if loop.txt exists delete it
  if (fs.existsSync(getPath("loop.txt"))) {
    fs.unlinkSync(getPath("loop.txt"));
  }

  if (selectedTraveller) {
    let captchaId;
    try {
      const data = fs.readFileSync(getPath("data.json"), "utf-8");
      var passengersData = JSON.parse(data);
      var passenger = passengersData.travellers[selectedTraveller];

      await util.commit(
        page,
        config.find((con) => con.name === "add").details,
        passenger
      );

      await page.waitForSelector("#MahramType");
      if (passenger.gender === "Female") {
        await page.select("#MahramType", "661");
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

      await setHSFDate(
        "#PASSPORT_ISSUE_DATE",
        passenger.passIssueDt.yyyy,
        passenger.passIssueDt.mm,
        passenger.passIssueDt.dd
      );

      await setHSFDate(
        "#PASSPORT_EXPIRY_DATe",
        passenger.passExpireDt.yyyy,
        passenger.passExpireDt.mm,
        passenger.passExpireDt.dd
      );

      await setHSFDate(
        "#BIRTH_DATE",
        passenger.dob.yyyy,
        passenger.dob.mm,
        passenger.dob.dd
      );

      const captchaSelector = "#imgCaptcha";
      await page.waitForSelector(captchaSelector);
      await page.focus(captchaSelector);
      // Wait for image to load.
      await page.waitFor(3000);
      const base64 = await page.evaluate(() => {
        const image = document.getElementById("imgCaptcha");
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        canvas.getContext("2d").drawImage(image, 0, 0);
        const dataURL = canvas.toDataURL();
        return dataURL.replace("data:", "").replace(/^.+,/, "");
      });

      const captchaSolver = new RuCaptcha2Captcha(global.captchaKey, 2);

      captchaId = await captchaSolver.send({
        method: "base64",
        body: base64,
        max_len: 6,
        min_len: 6,
      });
      const token = await captchaSolver.get(captchaId);
      await captchaSolver.reportGood(captchaId);
      if (token) {
        await page.type("#Captcha", token);
      }
    } catch (err) {
      await captchaSolver.reportBad(captchaId);
      console.log(err.message);
    }
  }
}

async function sendPassenger(index) {
  if (status === "importing" || status === "add") {
    return;
  }
  // Handle error popup
  try {
    const isDialog = await page.waitForSelector(
      "#dlgMessage > div.modal-dialog > div > div.modal-footer > button",
      {
        visible: true,
        timeout: 5000,
      }
    );
    if (isDialog) {
      const message = await page.$eval(
        "#dlgMessage #dlgMessageContent .note",
        (el) => el.textContent.trim()
      );
      if (
        message.match(
          /The code entered does not match the code displayed on the page/
        ) ||
        message.match(/رمز الصورة المدخل غير صحيح/)
      ) {
        // Incorrect captcha, try again
        console.log("Incorrect captcha, try again");
        await page.click(
          "#dlgMessage > div.modal-dialog > div > div.modal-footer > button"
        );
      } else {
        // Legitimate error, try 3 times, then move on
        console.log("Error: ", message, "Retry count: ", retries);
        retries += 1;
        if (retries > 2) {
          retries = 0;
          const passenger = data.travellers[index];
          await kea.updatePassenger(
            data.system.accountId,
            passenger.passportNumber,
            {
              "submissionData.hsf.status": "Rejected",
              "submissionData.hsf.rejectionReason": message,
            }
          );
          util.incrementSelectedTraveler();
        }

        await page.goto(config[0].url, { waitUntil: "domcontentloaded" });
        return;
      }
    }
  } catch (e) {
    // Do nothing
  }

  // Dismiss cookies alert
  try {
    const isCookies = await page.waitForSelector("button.acceptcookies", {
      visible: true,
      timeout: 2000,
    });
    if (isCookies) {
      await page.click("button.acceptcookies");
      page.waitFor(2000);
    }
  } catch {}

  if (index) {
    try {
      // await util.toggleBlur(page);
      const passenger = data.travellers[index];
      util.infoMessage(page, `Sending ${passenger.slug}`);

      if (!isValidPassenger(passenger)) {
        await kea.updatePassenger(
          data.system.accountId,
          passenger.passportNumber,
          {
            "submissionData.hsf.status": "Rejected",
            "submissionData.hsf.rejectionReason": "Missing Mofa number",
          }
        );
        util.incrementSelectedTraveler();
        await page.goto(config[0].url, { waitUntil: "domcontentloaded" });
        return;
      }
      const found = mofas?.find(
        (mofa) => mofa.passportNumber === passenger.passportNumber
      );
      if (found) {
        passenger.mofaNumber = found.mofaNumber;
      } else if (fs.existsSync(getPath(passenger.passportNumber + ".txt"))) {
        const data = fs.readFileSync(
          getPath(passenger.passportNumber + ".txt"),
          "utf-8"
        );
        passenger.mofaNumber = JSON.parse(data)?.mofaNumber;
      }

      await util.commit(
        page,
        config.find((con) => con.name === "login").details,
        passenger
      );
      const actionSelector = "#btnSubmit";
      await util.toggleBlur(page);
      const token = await util.commitCaptchaToken(
        page,
        "imgCaptcha",
        "#Captcha",
        6
      );

      await util.toggleBlur(page, false);
      if (token) {
        await page.waitForSelector(actionSelector);
        await page.click(actionSelector);
      }
    } catch (err) {
      console.log(err.message);
    }
  }
}

async function handleImportGMAMofa() {
  const tableSelector = "#Detail";
  const table = await gmaPage.$(tableSelector);
  if (!table) {
    return;
  }

  const passports = [];
  const rows = await gmaPage.$$("#Detail > tbody > tr");
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const cells = await row.$$("td");
    if (cells.length === 0) {
      continue;
    }
    const passportNumber = await cells[6].evaluate((el) => el.innerText.trim());
    const mofaNumber = await cells[1].evaluate((el) => el.innerText.trim());
    const nationality = await cells[5].evaluate((el) => el.innerText.trim());
    passports.push(passportNumber);

    if (passportNumber && /[0-9]/.test(passportNumber)) {
      fs.writeFileSync(
        getPath(passportNumber + ".txt"),
        JSON.stringify({
          mofaNumber,
          nationality,
          passportNumber,
        })
      );
      kea.updatePassenger(data.system.accountId, passportNumber, {
        mofaNumber: mofaNumber || "waiting",
      });
    }
  }
  await gmaPage.evaluate((passportsArrayFromNode) => {
    const eagleButton = document.querySelector(
      "#frm_menue > center > table > tbody > tr > div > button"
    );
    const confirmationText = `Done... [${passportsArrayFromNode[0]}-${
      passportsArrayFromNode[passportsArrayFromNode.length - 1]
    }] => ${passportsArrayFromNode.length}`;

    eagleButton.textContent = confirmationText;
  }, passports);
}

async function onGMAPageLoad(res) {
  const mofaUrl = await gmaPage.url();
  if (!mofaUrl) {
    return;
  }

  if (mofaUrl.toLowerCase().includes("login.aspx".toLowerCase())) {
    await gmaPage.waitForSelector("#LoginName");
    await gmaPage.type("#LoginName", data.system.username);
    await gmaPage.type("#password", data.system.password);
    return;
  }
  if (
    mofaUrl.toLowerCase().includes("homepage.aspx".toLowerCase()) &&
    mofaUrl.toLowerCase().includes("P=DashboardClassic".toLowerCase())
  ) {
    await gmaPage.goto("https://eumra.com/homepage.aspx?P=GroupsOperations2");
    return;
  }

  if (
    mofaUrl.toLowerCase().includes("homepage.aspx".toLowerCase()) &&
    mofaUrl.toLowerCase().includes("P=GroupsOperations2".toLowerCase())
  ) {
    await injectGMAEagleButton();
  }
}

async function handleGMATargetCreated() {
  const gmaBrowser = await gmaPage.browser();
  const gmapages = await gmaBrowser.pages();
  if (gmapages.length > 2) {
    const lastUrl = await gmapages[gmapages.length - 1].url();
    await gmaPage.goto(lastUrl);
    await gmapages[gmapages.length - 1].close();
    return;
  }
}

async function injectGMAEagleButton() {
  const gmaUrl = await gmaPage.url();
  if (
    gmaUrl
      .toLowerCase()
      .includes("U_GRP_Managements/MOFA.aspx?g=".toLowerCase())
  ) {
    try {
      const tdSelector = "#frm_menue > center > table > tbody > tr";
      await gmaPage.waitForSelector(tdSelector, { timeout: 0 });
      const isGmaExposed = await gmaPage.evaluate(
        "!!window.handleImportGMAMofa"
      );
      try {
        if (!isGmaExposed) {
          await gmaPage.exposeFunction(
            "handleImportGMAMofa",
            handleImportGMAMofa
          );
        }
      } catch {
        console.log(
          "Eagle error: Exposed already. handling error and continuing"
        );
      }
      await gmaPage.$eval(
        tdSelector,
        (el) =>
          (el.innerHTML = `
      <div style="display: flex; width: 100%; align-items: center; justify-content: center; gap: 16px; background-color: #CCCCCC; border: 2px solid black; border-radius: 16px; padding: 0.5rem; margin: 32px;">
      <img style='width: 32px; height: 32px; border-radius: 8px; margin-right: 0.5rem'  src='data:image/jpeg;base64,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'> </img> 
      <div>HAJOnSoft</div>
      <button style="color: white; background-color: forestgreen; border-radius: 16px; padding: 16px; height: 3rem" type="button"  onclick="handleImportGMAMofa(); return false">To Eagle (current view) النسر </button>
      </div>
      `)
      );
    } catch (err) {
      console.log("Eagle error: Wrapped", err);
    }
  }
}

async function setHSFDate(dateSelector, year, month, day) {
  try {
    await page.click(dateSelector);
    const yearSelector =
      "body > div.calendars-popup > div > div.calendars-month-row > div > div > select.floatleft.calendars-month-year";
    await page.waitForSelector(yearSelector);
    await util.selectByValueStrict(yearSelector, `${year}`);

    const monthSelector =
      "body > div.calendars-popup > div > div.calendars-month-row > div > div > select:nth-child(1)";
    await page.waitForSelector(monthSelector);
    // TODO AA: Replace with page.waitForXPath(xpath[, options])
    await page.waitForFunction(
      (info) => document.querySelector(info[0])?.innerHTML?.includes(info[1]),
      {},
      [monthSelector, `${parseInt(month)}/${year}`]
    );

    await page.waitFor(2000);
    await page.select(monthSelector, `${parseInt(month)}/${year}`);
    await page.waitFor(2000);
    const dayTds = await page.$$("td");
    for (const dayTd of dayTds) {
      const dayAnchor = await dayTd.$("a");
      if (dayAnchor) {
        const anchorContent = await dayAnchor.evaluate(
          (node) => node.innerText
        );
        if (anchorContent == parseInt(day)) {
          dayTd.focus();
          dayTd.click();
        }
      }
    }

    await page.waitFor(1000);
  } catch (err) {
    console.log("Eagle error: Date select error", err);
  }
}

async function sendPassengerToPrint(index) {
  status = "sending";
  let currentIndex = index;
  if (!currentIndex) {
    currentIndex = util.getSelectedTraveler();
  }
  const passenger = data.travellers[currentIndex];

  // paste passport number and first name
  await util.commit(
    page,
    [
      {
        selector: "#ddlFirstValue",
        value: (row) => "PassPortNo",
      },
      {
        selector: "#ddlSecondValue",
        value: (row) => "fName",
      },
      {
        selector: "#tbFirstValue",
        value: (row) => row?.passportNumber,
      },
      {
        selector: "#tbSecondValue",
        value: (row) => row?.name?.first,
      },
      {
        selector: "#NationalityId",
        value: (row) => row?.nationality?.code,
      },
    ],
    passenger
  );

  const captchaImg = await page.$("#imgCaptcha");
  const captchaTxt = await page.$("#Captcha");

  if (captchaImg && captchaTxt) {
    await util.commitCaptchaToken(page, "imgCaptcha", "#Captcha", 6);
  }
  await util.pauseMessage(page, 10);
  const url = await page.url();
  if (url == config.find((c) => c.name === "print-visa").url) {
    await page.click("#btnSubmit");
    await util.pauseMessage(page, 10);
    // Make sure the button is visible before clicking
    const isError = await page.$(
      "#dlgMessage > div.modal-dialog > div > div.modal-footer > button",
      { visible: true }
    );
    if (isError) {
      await page.click(
        "#dlgMessage > div.modal-dialog > div > div.modal-footer > button"
      );
      await util.pauseMessage(page, 10);
      util.incrementSelectedTraveler();
      await sendPassengerToPrint();
    }
  }
}

module.exports = { send };

function getNationalityCode(name) {
  return hsf_nationalities.find((n) => n.name === name)?.value;
}
