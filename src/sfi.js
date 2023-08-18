const puppeteer = require("puppeteer-extra");
// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const RuCaptcha2Captcha = require("rucaptcha-2captcha");
const fs = require("fs");
const path = require("path");
const budgie = require("./budgie");
const util = require("./util");
const { getPath } = util;
const moment = require("moment");
const kea = require("./lib/kea");
const { default: axios } = require("axios");
const JSZip = require("jszip");

const { hsf_nationalities } = require("./data/nationalities");
const homedir = require("os").homedir();
let page;
let data;

let status = "idle";

let retries = 0;
let countEmbassy = 0;

const config = [
  {
    name: "login",
    url: "https://visa.mofa.gov.sa/Account/loginindividuals",
    details: [
      { selector: "#UserName", value: (system) => system.username },
      { selector: "#Password", value: (system) => system.password },
    ],
  },
  {
    name: "agreement",
    url: "https://visa.mofa.gov.sa/SmartForm/Agreement",
  },
  {
    name: "electronic",
    url: "https://visa.mofa.gov.sa/SmartForm/ElectronicAgreement",
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
    name: "traditional",
    regex: "https://visa.mofa.gov.sa/SmartForm/TraditionalApp",
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
      { selector: "#PASSPORType", value: (row) => "1" },
      {
        selector: "#NATIONALITY",
        value: (row) => row.nationality.code,
      },
      {
        selector: "#NATIONALITY_FIRST",
        value: (row) => row.nationality.code,
      },
      {
        selector: "#PASSPORT_ISSUE_PLACE",
        value: (row) => row.nationality.code,
      },
      { selector: "#RELIGION", value: (row) => "1" },
      { selector: "#SOCIAL_STATUS", value: (row) => "5" },
      { selector: "#Sex", value: (row) => (row.gender === "Male" ? "1" : "2") },
      { selector: "#PersonId", value: (row) => row.passportNumber },
      { selector: "#HaveTraveledToOtherCountriesNo", value: () => true },
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

async function login(currentConfig) {
  await util.commit(page, currentConfig.details, data.system);
  await util.commitCaptchaTokenWithSelector(page, "#imgCaptcha", "#Captcha", 6);
  if (currentConfig.name === "login") {
    await page.click("#btnSubmit");
  }
}

async function pageContentHandler(currentConfig) {
  let passenger = getPassenger();
  switch (currentConfig.name) {
    case "login":
      try {
        await page.waitForSelector(".page-header", {
          visible: true,
          timeout: 1000,
        });
      } catch {
        return;
      }
      await login(currentConfig);
      break;
    case "agreement":
    case "electronic":
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
    case "traditional":
      await util.controller(
        page,
        {
          controller: {
            selector: "#content > div > div.page-head > div",
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

      await util.commander(page, {
        controller: {
          selector:
            "body > div.pre-footer > div > div > div.col-md-3.col-sm-12",
          title: "Remember",
          arabicTitle: "تذكر",
          action: async () => {
            await util.remember(page, "#VisaKind");
            await util.remember(page, "#COMING_THROUGH");
            await util.remember(page, "#EmbassyCode");
            await util.remember(page, "#car_number");
            await util.remember(page, "#ENTRY_POINT");
            await util.remember(page, "#porpose");
          },
        },
      });
      break;
    default:
      break;
  }
}

async function sendNewApplication(selectedTraveler) {
  if (selectedTraveler) {
    let captchaId; 
    try {
      var passenger = data.travellers[selectedTraveler];
      await util.recall(page, "#VisaKind");
      await page.waitForTimeout(1000);
      await util.recall(page, "#COMING_THROUGH");
      await page.waitForTimeout(1000);
      await util.recall(page, "#EmbassyCode");
      await util.recall(page, "#car_number");
      await util.recall(page, "#ENTRY_POINT");
      await util.recall(page, "#porpose");
      await util.commit(
        page,
        config.find((con) => con.name === "traditional").details,
        passenger
      );
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

      const todayPlusOneWeek = moment().add(1, "week");
      await setHSFDate(
        "#ExpectedEntryDate",
        todayPlusOneWeek.format("YYYY"),
        todayPlusOneWeek.format("MM"),
        todayPlusOneWeek.format("DD")
      );

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

    await page.waitForTimeout(2000);
    await page.select(monthSelector, `${parseInt(month)}/${year}`);
    await page.waitForTimeout(2000);
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

    await page.waitForTimeout(1000);
  } catch (err) {
    console.log("Eagle error: Date select error", err);
  }
}

function getNationalityCode(name) {
  const found = hsf_nationalities.find((n) => n.name === name);
  if (found) {
    return found.code;
  }
}

module.exports = { send };
