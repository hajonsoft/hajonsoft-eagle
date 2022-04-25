const puppeteer = require("puppeteer-extra");
// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const fs = require("fs");
const path = require("path");
const util = require("./util");
const moment = require("moment");
const sharp = require("sharp");
const {
  injectTWFEagleButton,
  onTWFPageLoad,
  initialize,
} = require("./mofa_import/twf");
const homedir = require("os").homedir();
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
      { selector: "#PASSPORType", value: (row) => "1" },
      { selector: "#NATIONALITY", value: (row) => row.nationality.code },
      { selector: "#NATIONALITY_FIRST", value: (row) => row.nationality.code },
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
let wtuPage;
let gmaPage;
let twfPage;
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
                    } else if (fs.existsSync("./" + passenger.passportNumber)) {
                      const data = fs.readFileSync(
                        "./" + passenger.passportNumber,
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
                } catch (err) {
                  console.log(err.message);
                }
              }
            },
            wtuAction: async () => {
              wtuPage = await util.newPage(onWTUPageLoad, () => {});
              wtuPage.on("response", injectWTUEagleButton);
              await wtuPage.goto(
                "https://www.waytoumrah.com/prj_umrah/eng/eng_frmlogin.aspx",
                {
                  waitUntil: "domcontentloaded",
                }
              );
            },
            gmaAction: async () => {
              gmaPage = await util.newPage(onGMAPageLoad, () => {});
              gmaPage.on("response", injectGMAEagleButton);
              const gmaBrowser = await gmaPage.browser();
              gmaBrowser.on("targetcreated", handleGMATargetCreated);
              await gmaPage.goto("https://eumra.com/login.aspx", {
                waitUntil: "domcontentloaded",
              });
            },
            twfAction: async () => {
              twfPage = await util.newPage(onTWFPageLoad, () => {});
              initialize(twfPage, data);
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
          passenger.name.first.replace(/ /g, "").toLowerCase() + "@hotmail.com"
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
      if (eNumber && fs.existsSync("./" + passenger.passportNumber)) {
        const existingPassengerDataString = fs.readFileSync(
          "./" + passenger.passportNumber,
          "utf-8"
        );
        const existingPassengerData = JSON.parse(existingPassengerDataString);
        existingPassengerData["eNumber"] = eNumber;

        fs.writeFileSync(
          passenger.passportNumber,
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
    case "step4":
      const printButtonSelector =
        "#myform > div.form-actions.fluid.right > div > div > a.btn.btn-default.green";
      await page.waitForSelector(printButtonSelector);
      const href = await page.$eval(printButtonSelector, (el) => el.href);
      // The visa screen shot is not done properly because "Error: Execution context was destroyed, most likely because of a navigation."
      // https://stackoverflow.com/questions/55877263/puppeteer-execution-context-was-destroyed-most-likely-because-of-a-navigation
      await page.goto(href, { waitUntil: "domcontentloaded" });
      const visaFolder = path.join(homedir, "hajonsoft", "visa");
      if (!fs.existsSync(visaFolder)) {
        fs.mkdirSync(visaFolder);
      }
      await page.waitForSelector(
        "body > form > page > div > div > div > div.evisa-header > div > div.evisa-col-12"
      );
      const visaElement = await page.$("body > form > page > div");
      await visaElement.screenshot({
        path:
          path.join(
            visaFolder,
            passenger.passportNumber +
              "_" +
              passenger.name.full.replace(/ /, "_")
          ) + ".png",
        type: "png",
      });
      await page.goto(config[0].url);
      break;
    case "add":
      await util.controller(
        page,
        {
          controller: {
            selector: "body > div.page-header > div.page-head",
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
                  await util.commit(
                    page,
                    config.find((con) => con.name === "add").details,
                    passenger
                  );
                } catch (err) {
                  console.log(err.message);
                }
              }
            },
          },
        },
        data.travellers
      );
      break;
    default:
      break;
  }
}

async function handleImportMofa() {
  const tableSelector = "#dgrdMofaRpt";
  const table = await wtuPage.$(tableSelector);
  if (!table) {
    return;
  }

  const tableRows = await wtuPage.$$("#dgrdMofaRpt > tbody tr");
  const passports = [];
  for (let i = 1; i <= tableRows.length; i++) {
    const rowPassportNumberSelector = `#dgrdMofaRpt > tbody > tr:nth-child(${i}) > td:nth-child(6)`;
    const passportNumber = await wtuPage.$eval(
      rowPassportNumberSelector,
      (el) => el.innerText
    );
    passports.push(passportNumber);

    const rowMofaSelector = `#dgrdMofaRpt > tbody > tr:nth-child(${i}) > td:nth-child(7)`;
    const mofaNumber = await wtuPage.$eval(
      rowMofaSelector,
      (el) => el.innerText
    );

    const rowNationalitySelector = `#dgrdMofaRpt > tbody > tr:nth-child(${i}) > td:nth-child(12)`;
    const nationality = await wtuPage.$eval(
      rowNationalitySelector,
      (el) => el.innerText
    );

    mofas.push({ passportNumber, mofaNumber, nationality });
    if (passportNumber) {
      fs.writeFileSync(
        passportNumber,
        JSON.stringify({ mofaNumber, nationality })
      );
    }
  }
  await wtuPage.evaluate((passportsArrayFromNode) => {
    const eagleButton = document.querySelector(
      "#Table1 > tbody > tr:nth-child(1) > td > table > tbody > tr:nth-child(3) > td:nth-child(2) > div > button"
    );
    eagleButton.textContent = `Done... [${passportsArrayFromNode[0]}-${
      passportsArrayFromNode[passportsArrayFromNode.length - 1]
    }]`;
  }, passports);
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

    mofas.push({ passportNumber, mofaNumber, nationality });
    if (passportNumber) {
      fs.writeFileSync(
        passportNumber,
        JSON.stringify({ mofaNumber, nationality })
      );
      // Add this passport to data.json if it is not present. This way you will be able to import from GMA and proceed with HSF even if the traveler is not present in HAJonSoft
    }
  }
  await gmaPage.evaluate((passportsArrayFromNode) => {
    const eagleButton = document.querySelector(
      "#frm_menue > center > table > tbody > tr > div > button"
    );
    eagleButton.textContent = `Done... [${passportsArrayFromNode[0]}-${
      passportsArrayFromNode[passportsArrayFromNode.length - 1]
    }]`;
  }, passports);
}

async function onWTUPageLoad(res) {
  const mofaUrl = await wtuPage.url();
  if (!mofaUrl) {
    return;
  }

  if (mofaUrl.toLowerCase().includes("_frmlogin.aspx".toLowerCase())) {
    await wtuPage.waitForSelector("#txtUserName");
    await wtuPage.type("#txtUserName", data.system.username);
    await wtuPage.type("#txtPwd", data.system.password);
    return;
  }
  if (
    mofaUrl.toLowerCase().includes("Waytoumrah".toLowerCase()) &&
    mofaUrl.toLowerCase().includes("prj_umrah".toLowerCase()) &&
    !mofaUrl.toLowerCase().includes("frmMofaRtp".toLowerCase())
  ) {
    await wtuPage.goto(
      "https://www.waytoumrah.com/prj_umrah/eng/Eng_frmMofaRtp.aspx"
    );
    return;
  }

  if (mofaUrl.toLowerCase().includes("Eng_frmMofaRtp".toLowerCase())) {
    await injectWTUEagleButton();
  }
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

async function injectWTUEagleButton() {
  try {
    const tdSelector =
      "#Table1 > tbody > tr:nth-child(1) > td > table > tbody > tr:nth-child(3) > td:nth-child(2)";
    await wtuPage.waitForSelector(tdSelector, { timeout: 0 });
    const isExposed = await wtuPage.evaluate("!!window.handleImportMofa");
    if (!isExposed) {
      await wtuPage.exposeFunction("handleImportMofa", handleImportMofa);
    }
    await wtuPage.$eval(
      tdSelector,
      (el) =>
        (el.innerHTML = `
      <div style="display: flex; width: 100%; align-items: center; justify-content: center; gap: 16px; background-color: #CCCCCC; border: 2px solid black; border-radius: 16px; padding: 0.5rem;">
      <img style='width: 32px; height: 32px; border-radius: 8px; margin-right: 0.5rem'  src='data:image/jpeg;base64,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'> </img> 
      <div>HAJOnSoft</div>
      <button style="color: white; background-color: forestgreen; border-radius: 16px; padding: 16px;" type="button"  onclick="handleImportMofa(); return false">To Eagle (current view) النسر </button>
      </div>
      `)
    );
  } catch (err) {
    console.log("Eagle error: Wrapped", err);
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

module.exports = { send };
