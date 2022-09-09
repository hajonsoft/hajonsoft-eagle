const puppeteer = require("puppeteer-extra");
// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const RuCaptcha2Captcha = require("rucaptcha-2captcha");
const fs = require("fs");
const path = require("path");
const util = require("./util");
const moment = require("moment");
const sharp = require("sharp");
const { default: axios } = require("axios");
const JSZip = require('jszip');

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
const { SERVER_NUMBER } = require("./bau");
const homedir = require("os").homedir();
let page;
let data;
let counter = 0;
let mofas = [];
let startTime;
let status = "idle";

function getLogFile() {
  const logFolder = path.join("./log", data.info.munazim);
  if (!fs.existsSync(logFolder)) {
    fs.mkdirSync(logFolder, { recursive: true });
  }
  const logFile = path.join(logFolder, data.info.caravan + "_hsf.txt");
  return logFile;
}

const zip = new JSZip();

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
  page = await util.initPage(config, onContentLoaded);
  page.goto(config[0].url, { waitUntil: "domcontentloaded" });
}

async function onContentLoaded(res) {
  const currentConfig = util.findConfig(await page.url(), config);
  try {
    await pageContentHandler(currentConfig);
  } catch (err) {
    console.log(err);
  }
}
let wtuPage;
let gmaPage;
let bauPage;
let twfPage;
async function pageContentHandler(currentConfig) {
  let lastIndex = util.useCounter();
  if (lastIndex >= data.travellers.length) {
    lastIndex = 0;
  }
  const passenger = data.travellers[lastIndex];
  switch (currentConfig.name) {
    case "login":
      util.getSelectedTraveler();
      if (!fs.existsSync("./loop.txt")) {
        await util.premiumSupportAlert(
          page,
          "body > div.page-header > div.page-header-top > div > div.page-logo.pull-left",
          data
        );
        util.infoMessage(page, "pausing for 20 seconds");
        setTimeout(() => {
          if (status === "idle") {
            const currentIndex = util.getSelectedTraveler();
            sendPassenger(currentIndex);

          }
        }, 25000);
      }
      if (startTime) {
        fs.appendFileSync(
          getLogFile(),
          `${moment().diff(startTime, "seconds")} seconds`
        );
      }
      startTime = moment().format("YYYY-MM-DD HH:mm:ss");
      fs.appendFileSync(
        getLogFile(),
        `\n${counter} - ${startTime} - ${passenger?.slug}\n${passenger?.codeline}\n`
      );

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
              util.setSelectedTraveller(selectedTraveller);
              await sendPassenger(selectedTraveller);
            },
            wtuAction: async () => {
              wtuPage = await util.newPage(onWTUPageLoad, () => { });
              initializeWTUImport(wtuPage, data);
              wtuPage.on("response", injectWTUEagleButton);
              await wtuPage.goto(
                "https://www.waytoumrah.com/prj_umrah/eng/eng_frmlogin.aspx",
                {
                  waitUntil: "domcontentloaded",
                }
              );
            },
            gmaAction: async () => {
              gmaPage = await util.newPage(onGMAPageLoad, () => { });
              gmaPage.on("response", injectGMAEagleButton);
              const gmaBrowser = await gmaPage.browser();
              gmaBrowser.on("targetcreated", handleGMATargetCreated);
              await gmaPage.goto("https://eumra.com/login.aspx", {
                waitUntil: "domcontentloaded",
              });
            },
            bauAction: async () => {
              bauPage = await util.newPage(onBAUPageLoad, () => { });
              initializeBAUImport(bauPage, data);
              // bauPage.on("response", injectBAUEagleButton);
              await bauPage.goto(
                `http://app${SERVER_NUMBER}.babalumra.com/Security/login.aspx`,
                {
                  waitUntil: "domcontentloaded",
                }
              );
            },
            twfAction: async () => {
              twfPage = await util.newPage(onTWFPageLoad, () => { });
              initializeTWFImport(twfPage, data);
              twfPage.on("response", injectTWFEagleButton);
              await twfPage.goto(
                `https://www.etawaf.com/tawaf${util.hijriYear}/index.html`,
                {
                  waitUntil: "domcontentloaded",
                }
              );
            },
          },
        },
        data.travellers
      );
      await page.waitForTimeout(1000);
      try {
        const isDialog = await page.$(
          "#dlgMessage > div.modal-dialog > div > div.modal-footer > button",
          {
            visible: true,
          }
        );
        if (isDialog) {
          await page.click(
            "#dlgMessage > div.modal-dialog > div > div.modal-footer > button"
          );
        }
      } catch {
        // Do nothing
      }
      // Review this logic because hsf doesnt start auromatically

      if (fs.existsSync("./loop.txt")) {
        const nextIndex = util.incrementSelectedTraveler()
        for (
          let i = nextIndex;
          i < data.travellers.length;
          i++
        ) {
          const iPassenger = data.travellers[i];
          const passportNumber = iPassenger.passportNumber;
          if (fs.existsSync("./" + passportNumber + ".txt")) {
            const importFileContent = fs.readFileSync(
              `./${passportNumber}.txt`,
              "utf-8"
            );

            // TODO: revise for range
            fs.readFileSync("./loop.txt", "utf-8")
              .split("\n")
              .forEach((keyword) => {
                if (
                  keyword &&
                  keyword != "" &&
                  importFileContent.includes(keyword)
                ) {
                  fs.writeFileSync("./selectedTraveller.txt", i.toString());
                  nextIndex = i;
                  return;
                }
              });
          }
        }
        if (nextIndex < data.travellers.length) {
          await sendPassenger(nextIndex.toString());
        }
      }
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
        await page.type("#FlightDataModel\\.ExpectedStayDuration", "15");
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
      if (eNumber && fs.existsSync("./" + passenger.passportNumber + ".txt")) {
        const existingPassengerDataString = fs.readFileSync(
          "./" + passenger.passportNumber + ".txt",
          "utf-8"
        );
        const existingPassengerData = JSON.parse(existingPassengerDataString);
        existingPassengerData["eNumber"] = eNumber;

        fs.writeFileSync(
          passenger.passportNumber + ".txt",
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
      await page.click(
        "#myform > div.form-actions.fluid.right > div > div > button:nth-child(3)"
      );
      break;
    case "step4":
      if (fs.existsSync("./add.json")) {
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
            `./${passenger.passportNumber}.txt`,
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
        if (visaStatusMessage) {
          fs.appendFileSync(getLogFile(), visaStatusMessage + "\n");
        }
      }
      const printButtonSelector =
        "#myform > div.form-actions.fluid.right > div > div > a.btn.btn-default.green";
      await page.waitForTimeout(2000);

      const isPrintButton = await page.$(printButtonSelector);
      if (isPrintButton) {
        const href = await page.$eval(printButtonSelector, (el) => el.href);
        await page.goto(href, { waitUntil: "domcontentloaded" });
        const visaFolder = path.join(homedir, "hajonsoft", "visa");
        if (!fs.existsSync(visaFolder)) {
          fs.mkdirSync(visaFolder, { recursive: true });
        }
        await page.waitForSelector(
          "body > form > page > div > div > div > div.evisa-header > div > div.evisa-col-12"
        );
        const visaElement = await page.$("body > form > page > div");
        const caravanName = data.info?.caravan?.replace(/[^A-Z0-9]/g, "");
        let saveFolder = visaFolder;
        if (caravanName) {
          saveFolder = path.join(visaFolder, caravanName);
        }
        if (!fs.existsSync(saveFolder)) {
          fs.mkdirSync(saveFolder, { recursive: true });
        }

        await page.waitForTimeout(7000);
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

        const currentPassenger = data.travellers[parseInt(util.getSelectedTraveler())]
        await screenShotAndContinue(visaElement, saveFolder, currentPassenger);
        const visaFileName = path.join(
          saveFolder,
          currentPassenger?.passportNumber + "_" + currentPassenger?.name?.full.replace(/ /, "_") + "_" + moment().format("YYYY-MM-DD_HH-mm-ss")
        ) + ".png";


        const visaData = fs.readFileSync(visaFileName);
        zip.file(fileName, visaData);
        zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true })
          .pipe(fs.createWriteStream(path.join(__dirname, "visas.zip")))
          .on('finish', function () {
            console.log(path.join(__dirname, "visas.zip"));
            util.infoMessage(page, "Visas are zipped successfully", 2, path.join(__dirname, "visas.zip"), "visas.zip");
          });
        return;
      }
      page.goto(config[0].url);
      break;
    case "add":
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

      if (fs.existsSync("./add.json")) {
        if (
          fs.existsSync("./loop.txt")
        ) {
          const nextTraveller = incrementSelectedTraveler();
          sendNewApplication((nextTraveller).toString());
        }
        await page.hover(
          "#myform > div.form-actions.fluid.right > div > div > button"
        );
        await page.focus(
          "#myform > div.form-actions.fluid.right > div > div > button"
        );
      } else {
        fs.writeFileSync("./add.json", JSON.stringify(passenger));
      }
      break;
    default:
      break;
  }
}

async function screenShotAndContinue(visaElement, saveFolder, currentPassenger) {
  const fileName = path.join(
    saveFolder,
    currentPassenger?.passportNumber + "_" + currentPassenger?.name?.full.replace(/ /, "_") + "_" + moment().format("YYYY-MM-DD_HH-mm-ss")
  ) + ".png";
  await visaElement.screenshot({
    path: fileName,
    type: "png",
  });
  await page.goto(config[0].url);
}

async function sendNewApplication(selectedTraveller) {
  if (selectedTraveller) {
    try {
      const data = fs.readFileSync("./data.json", "utf-8");
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
    } catch (err) {
      console.log(err.message);
    }

    const captchaSelector = "#imgCaptcha";
    await page.waitForSelector(captchaSelector);
    await page.focus(captchaSelector);
    // Wait for image to load.
    await page.waitForTimeout(3000);
    const base64 = await page.evaluate(() => {
      const image = document.getElementById("imgCaptcha");
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      canvas.getContext("2d").drawImage(image, 0, 0);
      const dataURL = canvas.toDataURL();
      return dataURL.replace("data:", "").replace(/^.+,/, "");
    });

    const captchaSolver = new RuCaptcha2Captcha(
      "637a1787431d77ad2c1618440a3d7149",
      2
    );

    const id = await captchaSolver.send({
      method: "base64",
      body: base64,
      max_len: 6,
      min_len: 6,
    });
    const token = await captchaSolver.get(id);
    if (token) {
      await page.type("#Captcha", token);
    }
  }
}

async function sendPassenger(selectedTraveller) {
  if (selectedTraveller) {
    try {
      // await page.emulateVisionDeficiency("blurredVision");
      const data = fs.readFileSync("./data.json", "utf-8");
      var passengersData = JSON.parse(data);
      var passenger = passengersData.travellers[selectedTraveller];
      util.infoMessage(page, `Sending ${passenger.slug}`);
      if (!passenger.mofaNumber) {
        const found = mofas.find(
          (mofa) => mofa.passportNumber === passenger.passportNumber
        );
        if (found) {
          passenger.mofaNumber = found.mofaNumber;
        } else if (fs.existsSync("./" + passenger.passportNumber + ".txt")) {
          const data = fs.readFileSync(
            "./" + passenger.passportNumber + ".txt",
            "utf-8"
          );
          passenger.mofaNumber = JSON.parse(data)?.mofaNumber;
        }
      }
      await util.commit(
        page,
        config.find((con) => con.name === "login").details,
        passenger
      );
      const actionSelector = "#btnSubmit";
      const captchaSelector = "#imgCaptcha";
      await page.waitForSelector(captchaSelector);
      await page.focus(captchaSelector);
      // Wait for image to load.
      await page.waitForTimeout(3000);
      const base64 = await page.evaluate(() => {
        const image = document.getElementById("imgCaptcha");
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        canvas.getContext("2d").drawImage(image, 0, 0);
        const dataURL = canvas.toDataURL();
        return dataURL.replace("data:", "").replace(/^.+,/, "");
      });

      const captchaSolver = new RuCaptcha2Captcha(
        "637a1787431d77ad2c1618440a3d7149",
        2
      );

      const id = await captchaSolver.send({
        method: "base64",
        body: base64,
        max_len: 6,
        min_len: 6,
      });
      await page.emulateVisionDeficiency("blurredVision");
      const token = await captchaSolver.get(id);
      await page.emulateVisionDeficiency("none");

      if (token) {
        await page.type("#Captcha", token);
        // Check that mofa field is filled in and passport field is at least 8 characters before clicking submit
        const isMofaFilled = await page.$eval(
          "#Id",
          (el) => el.value.length > 6
        );
        const isPassportFilled = await page.$eval(
          "#PassportNumber",
          (el) => el.value.length > 7
        );
        if (isMofaFilled && isPassportFilled) {
          await page.waitForSelector(actionSelector);
          await page.click(actionSelector);
        }
      }
      // await page.emulateVisionDeficiency("none");
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

  const tableRows = await gmaPage.$$("#Detail > tbody > tr");
  const passports = [];
  for (let i = 2; i <= tableRows.length; i++) {
    const rowPassportNumberSelector = `#Detail > tbody > tr:nth-child(${i}) > td:nth-child(7)`;
    const passportNumber = await gmaPage.$eval(
      rowPassportNumberSelector,
      (el) => el.innerText
    );
    console.log(
      "%c 🍸 passportNumber: ",
      "font-size:20px;background-color: #F5CE50;color:#fff;",
      passportNumber
    );
    passports.push(passportNumber);

    const rowMofaSelector = `#Detail > tbody > tr:nth-child(${i}) > td:nth-child(2)`;
    const mofaNumber = await gmaPage.$eval(
      rowMofaSelector,
      (el) => el.innerText
    );

    const rowNationalitySelector = `#Detail > tbody > tr:nth-child(${i}) > td:nth-child(6)`;
    const nationality = await gmaPage.$eval(
      rowNationalitySelector,
      (el) => el.innerText
    );

    if (passportNumber) {
      fs.writeFileSync(
        passportNumber + ".txt",
        JSON.stringify({ mofaNumber, nationality, passportNumber })
      );
      // Add this passport to data.json if it is not present. This way you will be able to import from GMA and proceed with HSF even if the traveler is not present in HAJonSoft
    }
  }
  await gmaPage.evaluate((passportsArrayFromNode) => {
    const eagleButton = document.querySelector(
      "#frm_menue > center > table > tbody > tr > div > button"
    );
    eagleButton.textContent = `Done... [${passportsArrayFromNode[0]}-${passportsArrayFromNode[passportsArrayFromNode.length - 1]
      }]`;
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

async function onWTOClosed(res) {
  const url = await wtuPage.url();
  if (!url) {
    return;
  }
}

async function setHSFDate(dateSelector, year, month, day) {
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

const nationalities = [
  { value: "9", name: "Afghanistan" },
  { value: "12", name: "Albania" },
  { value: "69", name: "Algeria" },
  { value: "17", name: "American Samoa" },
  { value: "13", name: "Andorra" },
  { value: "10", name: "Angola" },
  { value: "11", name: "Anguilla" },
  { value: "18", name: "Antarctic" },
  { value: "20", name: "Antigua And Barbuda" },
  { value: "15", name: "Argentina" },
  { value: "16", name: "Armenia" },
  { value: "8", name: "Aruba" },
  { value: "22", name: "Australia" },
  { value: "23", name: "Austria" },
  { value: "24", name: "Azerbaijan" },
  { value: "32", name: "Bahamas" },
  { value: "31", name: "Bahrain" },
  { value: "29", name: "Bangladesh" },
  { value: "39", name: "Barbados" },
  { value: "34", name: "Belarus" },
  { value: "26", name: "Belgium" },
  { value: "35", name: "Belize" },
  { value: "27", name: "Benin" },
  { value: "36", name: "Bermuda" },
  { value: "41", name: "Bhutan" },
  { value: "37", name: "Bolivia" },
  { value: "33", name: "Bosnia" },
  { value: "43", name: "Botswana" },
  { value: "42", name: "Bouvet Island" },
  { value: "38", name: "Brazil" },
  { value: "108", name: "British Indian Ocean Territory" },
  { value: "40", name: "Brunei Darussalam" },
  { value: "30", name: "Bulgaria" },
  { value: "28", name: "Burkina Faso" },
  { value: "25", name: "Burundi" },
  { value: "120", name: "Cambodia" },
  { value: "51", name: "Cameroon" },
  { value: "45", name: "Canada" },
  { value: "57", name: "Cape Verde" },
  { value: "61", name: "Cayman Island" },
  { value: "44", name: "Central African Republic" },
  { value: "213", name: "Chad" },
  { value: "48", name: "Chile" },
  { value: "49", name: "China" },
  { value: "60", name: "Christmas Island" },
  { value: "46", name: "Cocos Island" },
  { value: "55", name: "Colombia" },
  { value: "56", name: "Comoros" },
  { value: "53", name: "Congo" },
  { value: "54", name: "Cook Island" },
  { value: "58", name: "Costa Rica" },
  { value: "50", name: "Cote Divoire" },
  { value: "103", name: "Croatia" },
  { value: "59", name: "Cuba" },
  { value: "62", name: "Cyprus" },
  { value: "63", name: "Czech Republic" },
  { value: "253", name: "Democratic Republic of the Congo" },
  { value: "67", name: "Denmark" },
  { value: "65", name: "Djibouti" },
  { value: "66", name: "Dominica" },
  { value: "68", name: "Dominican Republic" },
  { value: "70", name: "Ecuador" },
  { value: "71", name: "Egypt" },
  { value: "200", name: "El Salvador" },
  { value: "92", name: "Equatorial  Guinea" },
  { value: "72", name: "Eritrea" },
  { value: "74", name: "Estonia" },
  { value: "75", name: "Ethiopia" },
  { value: "78", name: "Falkland Islands" },
  { value: "80", name: "Faroe Islands" },
  { value: "77", name: "Fiji" },
  { value: "76", name: "Finland" },
  { value: "79", name: "France" },
  { value: "82", name: "France, Meteropolitan" },
  { value: "97", name: "French Guiana" },
  { value: "184", name: "French Polynesia" },
  { value: "19", name: "French Southern and Antarctic" },
  { value: "83", name: "Gabon" },
  { value: "90", name: "Gambia" },
  { value: "85", name: "Georgia" },
  { value: "64", name: "Germany" },
  { value: "86", name: "Ghana" },
  { value: "87", name: "Gibraltar" },
  { value: "93", name: "Greece" },
  { value: "95", name: "Greenland" },
  { value: "94", name: "Grenada" },
  { value: "89", name: "Guadeloupe" },
  { value: "98", name: "Guam" },
  { value: "96", name: "Guatemala" },
  { value: "88", name: "Guinea" },
  { value: "91", name: "Guinea-Bissau" },
  { value: "99", name: "Guyana" },
  { value: "104", name: "Haiti" },
  { value: "101", name: "Heard Island and Mcdonald Island" },
  { value: "233", name: "Holy See(Vatican City State)" },
  { value: "102", name: "Honduras" },
  { value: "100", name: "Hong Kong China" },
  { value: "105", name: "Hungary" },
  { value: "112", name: "Iceland" },
  { value: "107", name: "India" },
  { value: "106", name: "Indonesia" },
  { value: "110", name: "Iran" },
  { value: "111", name: "Iraq" },
  { value: "109", name: "Ireland" },
  { value: "113", name: "Italy" },
  { value: "114", name: "Jamaica" },
  { value: "116", name: "Japan" },
  { value: "115", name: "Jordan" },
  { value: "117", name: "Kazakhstan" },
  { value: "118", name: "Kenya" },
  { value: "190", name: "Kingdom Saudi Arabia" },
  { value: "121", name: "Kiribati" },
  { value: "123", name: "Korea , Republic of" },
  { value: "180", name: "Korea, Democratic People's Republic of" },
  { value: "252", name: "Kosova" },
  { value: "124", name: "Kuwait" },
  { value: "119", name: "Kyrgyzstan" },
  { value: "125", name: "Lao People's Democratic Republic" },
  { value: "135", name: "Latvia" },
  { value: "126", name: "Lebanon" },
  { value: "132", name: "Lesotho" },
  { value: "127", name: "Liberia" },
  { value: "128", name: "Libya Arab Jamahiriya" },
  { value: "130", name: "Liechtenstein" },
  { value: "133", name: "Lithuania" },
  { value: "134", name: "Luxembourg" },
  { value: "136", name: "Macau China" },
  { value: "140", name: "Madagascar" },
  { value: "155", name: "Malawi" },
  { value: "156", name: "Malaysia" },
  { value: "141", name: "Maldives" },
  { value: "145", name: "Mali" },
  { value: "146", name: "Malta" },
  { value: "143", name: "Marshall Islands" },
  { value: "153", name: "Martinique" },
  { value: "151", name: "Mauritania" },
  { value: "154", name: "Mauritius" },
  { value: "157", name: "Mayotte" },
  { value: "142", name: "Mexico" },
  { value: "81", name: "Micronesia , Federated Stat" },
  { value: "139", name: "Moldova, Republic of" },
  { value: "138", name: "Monaco" },
  { value: "148", name: "Mongolia" },
  { value: "255", name: "MONTENEGRO" },
  { value: "152", name: "Montserrat" },
  { value: "137", name: "Morcco" },
  { value: "150", name: "Mozambique" },
  { value: "147", name: "Myanmar" },
  { value: "158", name: "Namibia" },
  { value: "168", name: "Nauru" },
  { value: "167", name: "Nepal" },
  { value: "165", name: "Netherlands" },
  { value: "21", name: "Netherlands Antilles" },
  { value: "159", name: "New Caledonia" },
  { value: "169", name: "New Zealand" },
  { value: "163", name: "Nicaragua" },
  { value: "160", name: "Niger" },
  { value: "162", name: "Nigeria" },
  { value: "164", name: "Niue" },
  { value: "248", name: "Non-Bahraini" },
  { value: "250", name: "Non-Emirati" },
  { value: "247", name: "Non-Kuwaiti" },
  { value: "251", name: "Non-Omani" },
  { value: "249", name: "Non-Qatari" },
  { value: "161", name: "Norfolk Island" },
  { value: "144", name: "North Macedonia" },
  { value: "149", name: "Northern Mariana Islands" },
  { value: "166", name: "Norway" },
  { value: "170", name: "Oman" },
  { value: "171", name: "Pakistan" },
  { value: "176", name: "Palau" },
  { value: "183", name: "Palestinian Territory, Occupied" },
  { value: "172", name: "Panama" },
  { value: "177", name: "Papua New Guinea" },
  { value: "182", name: "Paraguay" },
  { value: "174", name: "Peru" },
  { value: "175", name: "Philippines" },
  { value: "173", name: "Pitcairn Islands" },
  { value: "178", name: "Poland" },
  { value: "181", name: "Portugal" },
  { value: "179", name: "Puerto Rico" },
  { value: "185", name: "Qatar" },
  { value: "256", name: "Republic of South Sudan" },
  { value: "186", name: "Reunion" },
  { value: "187", name: "Romania" },
  { value: "188", name: "Russian Federation" },
  { value: "189", name: "Rwanda" },
  { value: "122", name: "Saint Kitts and Nevis" },
  { value: "129", name: "Saint Lucia" },
  { value: "203", name: "Saint pierre and Miquelon" },
  { value: "234", name: "Saint Vincent and  the Grenadines" },
  { value: "241", name: "Samoa" },
  { value: "201", name: "San Marino" },
  { value: "204", name: "Sao Tome And Principe" },
  { value: "193", name: "Senegal" },
  { value: "254", name: "SERBIA" },
  { value: "191", name: "Serbia and Montenegro" },
  { value: "210", name: "Seychelles" },
  { value: "199", name: "Sierra Leone" },
  { value: "194", name: "Singapore" },
  { value: "206", name: "Slovak Republic" },
  { value: "207", name: "Slovenia" },
  { value: "198", name: "Solomon Islands" },
  { value: "202", name: "Somalia" },
  { value: "244", name: "South Africa" },
  { value: "195", name: "South Georgia and The South Sandwich Islands" },
  { value: "73", name: "Spain" },
  { value: "131", name: "Sri Lanka" },
  { value: "196", name: "ST. Helena" },
  { value: "192", name: "Sudan" },
  { value: "205", name: "Suriname" },
  { value: "197", name: "Svalbard And Jan Mayen Islands" },
  { value: "209", name: "Swaziland" },
  { value: "208", name: "Sweden" },
  { value: "47", name: "Switzerland" },
  { value: "211", name: "Syrian Arab Republic" },
  { value: "225", name: "Taiwan China" },
  { value: "216", name: "Tajikistan" },
  { value: "226", name: "Tanzania, United Republic of" },
  { value: "215", name: "Thailand" },
  { value: "219", name: "Timor-Leste" },
  { value: "214", name: "Togo" },
  { value: "217", name: "Tokelau" },
  { value: "220", name: "Tonga" },
  { value: "221", name: "Trinidad and tobago" },
  { value: "222", name: "Tunisia" },
  { value: "223", name: "Turkey" },
  { value: "218", name: "Turkmenistan" },
  { value: "212", name: "Turks and Caicos Islands" },
  { value: "224", name: "Tuvalu" },
  { value: "227", name: "Uganda" },
  { value: "228", name: "Ukraine" },
  { value: "14", name: "United Arab Emirates" },
  { value: "84", name: "United Kingdom" },
  { value: "231", name: "United States" },
  { value: "229", name: "United States Minor Outlying Islands" },
  { value: "230", name: "Uruguay" },
  { value: "232", name: "Uzbekistan" },
  { value: "239", name: "Vanuatu" },
  { value: "235", name: "Venezuela" },
  { value: "238", name: "Vietnam" },
  { value: "236", name: "Virgin Islands(British)" },
  { value: "237", name: "Virgin Islands(U.S.)" },
  { value: "240", name: "Wallis and Futuna Islands" },
  { value: "242", name: "Yemen" },
  { value: "243", name: "Yugoslavia" },
  { value: "52", name: "Zaire" },
  { value: "245", name: "Zambia" },
  { value: "246", name: "Zimbabwe" },
];

function getNationalityCode(name) {
  return nationalities.find((n) => n.name === name)?.value;
}
