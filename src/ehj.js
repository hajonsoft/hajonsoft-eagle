const puppeteer = require("puppeteer-extra");
// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const fs = require("fs");
const path = require("path");
const budgie = require("./budgie");
const util = require("./util");
const { getPath } = require("./lib/getPath");
const moment = require("moment");
const totp = require("totp-generator");
const kea = require("./lib/kea");
const { cloneDeep } = require("lodash");
const { send: sendHsf } = require("./hsf");

let page;
let data;
let counter = 0;
const passports = [];
const housings = [];
let importClicks = 0;
let editPassportNumber;
let liberiaPassports = [];
const questionnaireClicked = {};

if (fs.existsSync(getPath("passports.txt"))) {
  const rawPassports = fs
    .readFileSync(getPath("passports.txt"), "utf-8")
    .split("\n");
  for (let pass of rawPassports) {
    liberiaPassports.push({
      passportNumber: pass,
      status: "unknown",
    });
  }
}

function getLogFile() {
  const logFolder = path
    .join(getPath("log"), data.info.munazim)
    .replace(/[^0-9A-Za-z]/g, "");
  if (!fs.existsSync(logFolder)) {
    fs.mkdirSync(logFolder, { recursive: true });
  }
  const logFile = path
    .join(
      logFolder,
      data.info.caravan?.replace(/[^0-9A-Za-z]/g, "") + "_ehj.txt"
    )
    .replace(/ /g, "");
  return logFile;
}

let startTime;

const config = [
  {
    name: "home",
    url: "https://ehaj.haj.gov.sa/",
    regex: "https://ehaj.haj.gov.sa/$",
  },
  {
    name: "index",
    regex: "https://ehaj.haj.gov.sa/EH/index.xhtml;jsessionid=",
  },
  {
    name: "index2",
    regex: "https://ehaj.haj.gov.sa/EH/index.xhtml.dswid=",
  },
  {
    name: "login",
    regex: "https://ehaj.haj.gov.sa/EH/login.xhtml",
    details: [
      {
        selector: "#j_username",
        value: (row) => row.username,
      },
      {
        selector: "#j_password",
        value: (row) => row.password,
      },
    ],
  },
  {
    name: "add-pilgrim-select-method",
    regex:
      "https://ehaj.haj.gov.sa/EH/pages/hajMission/lookup/hajData/Add1.xhtml",
  },
  {
    name: "add-pilgrim-select-method-company",
    regex:
      "https://ehaj.haj.gov.sa/EH/pages/hajCompany/lookup/hajData/Add1.xhtml",
  },
  {
    name: "mission-questionnaire",
    regex:
      "https://ehaj.haj.gov.sa/EH/pages/hajMission/lookup/hajData/Questionnaire.xhtml",
    details: [
      {
        selector:
          "#kt_app_content_container > div:nth-child(2) > form > div.ui-panel.ui-widget.ui-widget-content.ui-corner-all > div.ui-panel-content.ui-widget-content > div:nth-child(3) > div > input",
        value: (row) => new Date().valueOf().toString(),
      },
      {
        selector:
          "#kt_app_content_container > div:nth-child(2) > form > div.ui-panel.ui-widget.ui-widget-content.ui-corner-all > div.ui-panel-content.ui-widget-content > div:nth-child(4) > div > input",
        value: (row) => {
          const name = `${row.name.first}.${row.name.last}`.substring(0, 20);
          return `${name}.${row.passportNumber}@emailinthecloud.com`.toLowerCase();
        },
      },
      {
        selector:
          "#kt_app_content_container > div:nth-child(2) > form > div.ui-panel.ui-widget.ui-widget-content.ui-corner-all > div.ui-panel-content.ui-widget-content > div:nth-child(8) > div > input",
        value: () => "Employee",
      },
      {
        selector:
          "#kt_app_content_container > div:nth-child(2) > form > div.ui-panel.ui-widget.ui-widget-content.ui-corner-all > div.ui-panel-content.ui-widget-content > div:nth-child(13) > span > div > div > select",
        value: () => "7",
      },
    ],
  },
  {
    name: "company-questionnaire",
    regex:
      "https://ehaj.haj.gov.sa/EH/pages/hajCompany/lookup/hajData/Questionnaire.xhtml",
    details: [
      {
        selector:
          "#kt_app_content_container > div:nth-child(2) > form > div.ui-panel.ui-widget.ui-widget-content.ui-corner-all > div.ui-panel-content.ui-widget-content > div:nth-child(3) > div > input",
        value: (row) => new Date().valueOf().toString(),
      },
      {
        selector:
          "#kt_app_content_container > div:nth-child(2) > form > div.ui-panel.ui-widget.ui-widget-content.ui-corner-all > div.ui-panel-content.ui-widget-content > div:nth-child(4) > div > input",
        value: (row) => {
          const name = `${row.name.first}.${row.name.last}`.substring(0, 20);
          return `${name}.${row.passportNumber}@emailinthecloud.com`.toLowerCase();
        },
      },
      {
        selector:
          "#kt_app_content_container > div:nth-child(2) > form > div.ui-panel.ui-widget.ui-widget-content.ui-corner-all > div.ui-panel-content.ui-widget-content > div:nth-child(8) > div > input",
        value: () => "Employee",
      },
      {
        selector:
          "#kt_app_content_container > div:nth-child(2) > form > div.ui-panel.ui-widget.ui-widget-content.ui-corner-all > div.ui-panel-content.ui-widget-content > div:nth-child(13) > span > div > div > select",
        value: () => "7",
      },
    ],
  },
  {
    name: "package-quota-list",
    regex:
      "https://ehaj.haj.gov.sa/EH/pages/hajCompany/lookup/packagesQuota/List.xhtml",
  },
  {
    name: "authentication-settings",
    regex:
      "https://ehaj.haj.gov.sa/EH/pages/home/ChangeRepMobile/newMobile.xhtml",
  },
  {
    name: "hajj-group-details",
    regex: "https://ehaj.haj.gov.sa/EH/pages/hajData/lookup/hajGroup/Add.xhtml",
  },
  {
    name: "otp",
    regex: "https://ehaj.haj.gov.sa/EH/mobileVerify.xhtml",
  },
  {
    name: "profile",
    regex:
      "https://ehaj.haj.gov.sa/EH/pages/home/ChangeRepMobile/gAuthSettings.xhtml",
  },
  {
    name: "profile-verification",
    regex:
      "https://ehaj.haj.gov.sa/EH/pages/home/ChangeRepMobile/verificationCode.xhtml",
  },
  {
    name: "dashboard",
    regex: "https://ehaj.haj.gov.sa/EH/pages/home/dashboard.xhtml",
  },
  {
    name: "list-pilgrims-mission",
    regex:
      "https://ehaj.haj.gov.sa/EH/pages/hajMission/lookup/hajData/List.xhtml",
  },
  {
    name: "list-pilgrims",
    regex:
      "https://ehaj.haj.gov.sa/EH/pages/hajCompany/lookup/hajData/List.xhtml",
  },
  {
    name: "add-mission-pilgrim",
    regex:
      "https://ehaj.haj.gov.sa/EH/pages/hajMission/lookup/hajData/AddMrz.xhtml",
    controller: {
      selector: "#kt_app_content_container > div:nth-child(2) > h1",
      action: async () => {
        const selectedTraveler = await page.$eval(
          "#hajonsoft_select",
          (el) => el.value
        );
        if (selectedTraveler) {
          util.setSelectedTraveller(selectedTraveler);
          if (!fs.existsSync(getPath("loop.txt"))) {
            fs.writeFileSync(getPath("loop.txt"), "ehaj", "utf-8");
          }
          await page.reload();
        }
      },
    },
  },
  {
    name: "add-mission-pilgrim-upload",
    regex:
      "https://ehaj.haj.gov.sa/EH/pages/hajMission/lookup/hajData/AddPassportUpload.xhtml",
    controller: {
      selector: "#kt_app_content_container > div:nth-child(2) > h1",
      name: "uploadHajjPassport",
      action: async () => {
        const selectedTraveler = await page.$eval(
          "#hajonsoft_select",
          (el) => el.value
        );
        if (selectedTraveler) {
          util.setSelectedTraveller(selectedTraveler);
          if (!fs.existsSync(getPath("loop.txt"))) {
            fs.writeFileSync(getPath("loop.txt"), "ehaj", "utf-8");
          }
          await uploadPilgrimViaPassport(selectedTraveler);
        }
      },
    },
  },
  {
    name: "add-company-pilgrim",
    regex:
      "https://ehaj.haj.gov.sa/EH/pages/hajCompany/lookup/hajData/AddMrz.xhtml",

    controller: {
      selector: "#kt_app_content_container > div:nth-child(2) > h1",
      action: async () => {
        const selectedTraveler = await page.$eval(
          "#hajonsoft_select",
          (el) => el.value
        );
        if (selectedTraveler) {
          util.setSelectedTraveller(selectedTraveler);
          if (!fs.existsSync(getPath("loop.txt"))) {
            fs.writeFileSync(getPath("loop.txt"), "ehaj", "utf-8");
          }
          await page.reload();
        }
      },
    },
  },
  {
    name: "dashboard",
    regex: "https://ehaj.haj.gov.sa/EH/pages/home/dashboard.xhtml",
  },
  {
    name: "edit-pilgrim",
    regex:
      "https://ehaj.haj.gov.sa/EH/pages/hajCompany/lookup/hajData/Edit.xhtml",
  },
  {
    name: "edit-pilgrim-mission",
    regex:
      "https://ehaj.haj.gov.sa/EH/pages/hajMission/lookup/hajData/Edit.xhtml",
  },
  {
    name: "add-mission-pilgrim-3",
    regex:
      "https://ehaj.haj.gov.sa/EH/pages/hajMission/lookup/hajData/Add3.xhtml",
    details: [
      {
        selector: "#fatherNameEn",
        value: (row) => row.name.father,
      },
      {
        selector: "#grandFatherNameEn",
        value: (row) => row.name.grand,
      },
      {
        selector: "#placeofBirth",
        value: (row) => row.birthPlace || row.nationality.name,
      },
      {
        selector: "#address",
        value: (row) => "", // budgie.get("ehaj_pilgrim_address", row.address)
      },
      // {
      //   selector: "#passportIssueDate",
      //   value: (row) => row.passIssueDt.dmy,
      // },
      {
        selector: "#idno",
        value: (row) => "0",
      },
    ],
  },
  {
    name: "add-pilgrim-3",
    regex:
      "https://ehaj.haj.gov.sa/EH/pages/hajCompany/lookup/hajData/Add3.xhtml",
    details: [
      {
        selector: "#fatherNameEn",
        value: (row) => row.name.father,
      },
      {
        selector: "#grandFatherNameEn",
        value: (row) => row.name.grand,
      },
      {
        selector: "#placeofBirth",
        value: (row) => row.birthPlace || row.nationality.name,
      },
      {
        selector: "#address",
        value: (row) => "", // budgie.get("ehaj_pilgrim_address", row.address),
      },
      // {
      //   selector: "#passportIssueDate",
      //   value: (row) => row.passIssueDt.dmy,
      // },
      {
        selector: "#idno",
        value: (row) => "0",
      },
    ],
  },
  {
    name: "sms",
    regex: "https://ehaj.haj.gov.sa/EH/sms.xhtml",
  },
  {
    name: "sms-confirm",
    regex: "https://ehaj.haj.gov.sa/EH/sms-confirm.xhtml",
  },
  {
    name: "package-details",
    regex:
      "https://ehaj.haj.gov.sa/EH/pages/hajCompany/requests/packages/new/packageDetails.xhtml",
    details: [
      {
        selector: "#nameAr",
        value: () => " خدمات رقم " + moment().format("HHmm"),
      },
      {
        selector: "#nameEn",
        value: () => "Service " + moment().format("HHmm"),
      },
      {
        selector: "#pkgDescAr",
        value: (row) => "رحلة الحج من العمر. قم بزيارة مكه وأداء واجب الحج.",
      },
      {
        selector: "#pkgDescEn",
        value: (row) =>
          "Hajj journey of a lifetime. Visit Makkah and perform the duty of Hajj.",
      },
      { selector: "#packageOwnerPrice", value: () => "30000" },
    ],
  },
  {
    name: "housing-contract",
    regex:
      "https://ehaj.haj.gov.sa/EH/pages/hajCompany/requests/housingContr/epayment/List.xhtml",
  },
  {
    name: "package-details-2",
    regex:
      "https://ehaj.haj.gov.sa/EH/pages/hajCompany/requests/packages/new/contractInfo.xhtml",
  },
  {
    name: "house-details",
    regex:
      "https://ehaj.haj.gov.sa/EH/pages/hajCompany/requests/housingContr/epayment/View.xhtml",
  },
  {
    name: "reservation-data-1",
    regex: "https://ehaj.haj.gov.sa/EPATH/pages/StartBooking/hajData.xhtml",
    controller: {
      selector: "body > div.pre-header > div.col-md-10 > div > div.col-md-6",
      name: "makeReservation",
      action: async () => {
        const selectedTraveler = await page.$eval(
          "#hajonsoft_select",
          (el) => el.value
        );
        if (selectedTraveler) {
          util.setSelectedTraveller(selectedTraveler);
          const data = fs.readFileSync(getPath("data.json"), "utf-8");
          var passengersData = JSON.parse(data);
          // If there is phone number selected then save it to budgie
          const countryCode = await page.$eval("#countryKey", (el) => el.value);
          if (countryCode) {
            budgie.save("ehaj-reserve-country-code", countryCode.toString());
          } else {
            const budgieCountryCode = budgie.get(
              "ehaj-reserve-country-code",
              "7"
            );
            await page.select("#countryKey", budgieCountryCode.toString());
            await page.waitForTimeout(1000);
          }

          // const newSMSNumber = await SMS.getNewNumber();
          // await page.type("#mobileRep", newSMSNumber?.number?.toString()?.substring(1));

          await makeReservations(selectedTraveler, passengersData);
        }
      },
    },
  },
  {
    name: "review-reservation-1",
    regex: "https://ehaj.haj.gov.sa/EPATH/pages/StartBooking/review.xhtml",
  },
  {
    name: "reservation-complete",
    regex: "https://ehaj.haj.gov.sa/EPATH/pages/StartBooking/home.xhtml",
  },
];

async function sendPassenger(selectedTraveler) {
  const data = fs.readFileSync(getPath("data.json"), "utf-8");
  var passengersData = JSON.parse(data);
  util.setSelectedTraveller(selectedTraveler);
  await pasteCodeLine(selectedTraveler, passengersData);
}

async function rememberValue(selector, budgieKey) {
  const selectorPresent = await page.$(selector);
  if (!selectorPresent) {
    return;
  }
  const selectorValue = await page.$eval(selector, (el) => {
    if (el) {
      return el.value;
    } else {
      return null;
    }
  });
  if (selectorValue) {
    budgie.save(budgieKey, selectorValue);
  }
}
async function pasteCodeLine(selectedTraveler, passengersData) {
  await util.infoMessage(
    page,
    `${parseInt(selectedTraveler.toString()) + 1}/${
      passengersData.travellers.length
    }`
  );
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
  const passenger = data.travellers[util.getSelectedTraveler()];
  switch (currentConfig.name) {
    case "home":
    case "index":
    case "index2":
      console.log("index");
      if (global.headless) {
        await page.goto("https://ehaj.haj.gov.sa/EH/login.xhtml");
      }
      break;
    case "login":
      const isError = await page.$("#stepItemsMSGs > div > div");
      if (isError) {
        return;
      }
      await util.commit(page, currentConfig.details, data.system);
      if (data.system.username && data.system.password) {
        const loginButton = "#yj_idt95";
        await page.click(loginButton);
      }
      break;
    case "authentication-settings":
      const isAuthCode = await page.$("#secretKey");
      if (isAuthCode) {
        const code = await page.$eval("#secretKey", (el) => el.value);
        console.log(
          "Google Authenticator Code: " + code,
          "Ehaj Username: ",
          data.system.username,
          "Ehaj password: ",
          data.system.password
        );
        if (data?.system?.ehajCode?.length > 1) {
          return;
        }
        //save to data.json immediately
        data.system.ehajCode = code;
        fs.writeFileSync(getPath("data.json"), JSON.stringify(data, null, 2));
      }
      kea.updateTargetSystem(data.system.accountId, "ehj", {
        ehajCode: data.system.ehajCode,
      });

      break;
    case "otp":
      const messageSelector = "#loginPanel > h5";
      await page.waitForSelector(messageSelector);
      const message = await page.$eval(messageSelector, (el) => el.innerText);
      if (
        (message.includes("generated by Google Authenticator") ||
          message.includes("vérification généré par Google Authenticator") ||
          message.includes("ديك في تطبيق Google Authenticator")) &&
        data.system.ehajCode
      ) {
        const token = totp(data.system.ehajCode);
        await util.commit(
          page,
          [
            {
              selector: "#first",
              value: () => token,
            },
          ],
          passenger
        );
        const submitButton = "#sj1";
        await page.waitForSelector(submitButton);
        await page.click(submitButton);
      }

      break;
    case "profile-verification":
      await page.waitForSelector("#code");
      // #j_idt3421 > div.modal-body > div > h5
      if (data.system.ehajCode) {
        const token = totp(data.system.ehajCode);
        await util.commit(
          page,
          [
            {
              selector: "#code",
              value: () => token,
            },
          ],
          passenger
        );
      }
      break;
    case "profile":
      const tokenValue = await page.$eval("#tokenValue", (el) => el.value);
      if (tokenValue) {
        return;
      }
      await page.waitForSelector("#secretKey");
      const secretCode = await page.$eval("#secretKey", (el) => el.value);
      const token = totp(secretCode);
      await page.type("#tokenValue", token);
      await page.click("#verifyGAuthToken > div > div.col-lg-4 > a");
      break;
    case "dashboard":
      // find if it is a mission account or a company account
      // hajMission/lookup/hajData
      const url = await page.url();
      try {
        const missionQuota = await page.$eval(
          "#form > div > div > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > h4",
          (el) => el.innerText
        );

        if (global.headless && missionQuota.includes("Mission")) {
          const dswid = url.split("dswid=")[1];
          await page.goto(
            `https://ehaj.haj.gov.sa/EH/pages/hajMission/lookup/hajData/AddMrz.xhtml?dswid=${dswid}`
          );
        }
      } catch (err) {
        // console.log(err);
      }
      try {
        const companyQuota = await page.$eval(
          "#j_idt4630 > div > div > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > h4",
          (el) => el.innerText
        );

        if (global.headless && companyQuota.includes("Default")) {
          // get dswid value from the url
          const companydswid = url.split("dswid=")[1];
          await page.goto(
            `https://ehaj.haj.gov.sa/EH/pages/hajCompany/lookup/hajData/AddMrz.xhtml?dswid=${companydswid}`
          );
        }
      } catch (err) {
        // console.log(err);
      }
      break;
    case "add-pilgrim-select-method":
    case "add-pilgrim-select-method-company":
      const isConfirmationSpan = await page.$(
        "#stepItemsMSGs > div > div > div > ul > li > span"
      );
      if (isConfirmationSpan) {
        const confirmationMessage = await page.$eval(
          "#stepItemsMSGs > div > div > div > ul > li > span",
          (el) => el.innerText
        );
        fs.appendFileSync(getLogFile(), confirmationMessage + "\n");
        if (confirmationMessage.includes(passenger.name.last)) {
          util.incrementSelectedTraveler();
          //TODO: get the ehaj id as well and save it
          kea.updatePassenger(data.system.accountId, passenger.passportNumber, {
            "submissionData.ehj.status": "Submitted",
          });
        }
        // if loop.txt exists then go to the addMrz page
        if (fs.existsSync(getPath("loop.txt"))) {
          const url = await page.url();
          const addMrzUrl = url.replace("Add1", "AddMrz");
          await page.goto(addMrzUrl);
        }
      }
      break;
    case "edit-pilgrim":
    case "edit-pilgrim-mission":
      await page.waitForSelector("#pass");
      editPassportNumber = await page.$eval("#pass", (el) => el.value);
      const editPassenger = data.travellers.find(
        (p) => p.passportNumber == editPassportNumber
      );
      if (editPassenger) {
        await page.$eval(
          "#filedetails > span",
          (el, url) => {
            el.outerHTML =
              "<div style='width: 100%; height: 400px; overflow: scroll'> <img src='" +
              url +
              "'  /> </div>";
          },
          editPassenger?.images?.passport
        );
      }
      break;
    case "list-pilgrims":
    case "list-pilgrims-mission":
      await util.toggleBlur(page, false);
      const ehajNumbers = [];
      await util.commander(page, {
        controller: {
          // TODO: Replace with a more robust selector
          selector: "form > ul > li:nth-child(3)",
          title: "Import current page or find missing",
          arabicTitle: "إستيراد الصفحه الحاليه أو إستعلام مفقودين",
          name: "importEhajNumber",
          action: async () => {
            if (importClicks > 5) {
              sendHsf(data);
            }
            importClicks += 1;
            let missing = data.travellers.map((t, index) => {
              return {
                missing_index: index,
                slug: t.slug,
                passportNumber: t.passportNumber,
              };
            });
            for (let i = 1; i <= 200; i++) {
              const isRowValid = await page.$(
                `tbody > tr:nth-child(${i}) > td:nth-child(1)`
              );
              if (!isRowValid) {
                break;
              }

              const ehajNumber = await page.$eval(
                `tbody > tr:nth-child(${i}) > td:nth-child(1)`,
                (el) => el.innerText
              );
              const mofaNumber = await page.$eval(
                `tbody > tr:nth-child(${i}) > td:nth-child(2)`,
                (el) => el.innerText
              );
              const passportNumber = await page.$eval(
                `tbody > tr:nth-child(${i}) > td:nth-child(4)`,
                (el) => el.innerText
              );
              if (!ehajNumber) {
                break;
              }

              const status = await page.$eval(
                `tbody > tr:nth-child(${i}) > td:nth-child(11) > span`,
                (el) => el.innerText
              );
              const liberiaPass = liberiaPassports.find(
                (p) => p.passportNumber === passportNumber
              );
              if (liberiaPass) {
                liberiaPass.status = status;
              }
              if (
                status.toLowerCase().includes("cancel") ||
                status.toLowerCase().includes("not") ||
                status.toLowerCase().includes("لغ") ||
                status.toLowerCase().includes("رفض") ||
                status.toLowerCase().includes("لم") ||
                status.toLowerCase().includes("reject")
              ) {
                continue;
              }
              missing = missing.filter(
                (t) => t.passportNumber !== passportNumber
              );
              if (!ehajNumbers.find((p) => p === ehajNumber)) {
                ehajNumbers.push(ehajNumber);
                kea.updatePassenger(data.system.accountId, passportNumber, {
                  mofaNumber,
                  ehajNumber,
                  status,
                  "submissionData.ehj.status": "Submitted",
                });
              }

              fs.writeFileSync(
                getPath(passportNumber + ".txt"),
                JSON.stringify({
                  ehajNumber,
                  mofaNumber,
                  passportNumber,
                  status,
                })
              );
            }

            console.table(missing);
            console.log("local passports.txt comparison");
            console.table(liberiaPassports.filter((p) => p.status === "NEW"));
            console.table(liberiaPassports.filter((p) => p.status !== "NEW"));
            await page.evaluate((ehajNumbers) => {
              const eagleButton = document.querySelector("#importEhajNumber");
              eagleButton.textContent = `Done... [${ehajNumbers[0]}-${
                ehajNumbers[ehajNumbers.length - 1]
              }] => ${ehajNumbers.length}`;
            }, ehajNumbers);
          },
        },
        secondaryController: {
          title: "Mofa website",
          arabicTitle: "موفع الخارجيه",
          name: "mofaWebsite",
          action: async () => {
            page.goto("https://visa.mofa.gov.sa/Account/HajSmartForm");
          },
        },
      });

      if (fs.existsSync(getPath("loop.txt"))) {
        for (let i = 1; i <= 100; i++) {
          const isRowValid = await page.$(
            `tbody > tr:nth-child(${i}) > td:nth-child(1)`
          );
          if (!isRowValid) {
            break;
          }
          const passportNumber = await page.$eval(
            `tbody > tr:nth-child(${i}) > td:nth-child(4)`,
            (el) => el.innerText
          );
          if (!passportNumber) {
            break;
          }
          if (passportNumber === editPassportNumber) {
            const nextEdit = `#PackageReqForm > div > div > div:nth-child(1) > div > div > div.ui-datatable-tablewrapper > table > tbody > tr:nth-child(${
              i + 1
            }) > td:nth-child(13) > div > ul > li:nth-child(2) > a`;
            await page.evaluate((selector) => {
              const nextEditButton = document.querySelector(selector);
              if (nextEditButton) {
                nextEditButton.click();
              }
            }, nextEdit);
            return;
          }
        }
      }
      break;
    case "add-mission-pilgrim":
    case "add-company-pilgrim":
      if (!passenger || !passenger.codeline) {
        return;
      }
      // If the last pilgrim failed move on to the next one
      // #stepItemsMSGs > div > div > div > ul > li > span
      try {
        const errorMessage = await page.$eval(
          "#stepItemsMSGs > div > div > div > ul > li > span",
          (el) => el.innerText
        );
        if (errorMessage.includes("active Haj Data")) {
          util.incrementSelectedTraveler();
          await sendPassenger(util.getSelectedTraveler());
          return;
        }
      } catch (err) {
        // console.log(err);
      }
      console.log(passenger.codeline);
      if (startTime) {
        fs.appendFileSync(
          getLogFile(),
          `${moment().diff(startTime, "seconds")} seconds`
        );
      }
      startTime = moment().format("YYYY-MM-DD HH:mm:ss");
      fs.appendFileSync(
        getLogFile(),
        `\n${counter} - ${startTime} - ${passenger?.slug}\n${passenger.codeline}\n`
      );

      if (global.headless && !fs.existsSync(getPath("loop.txt"))) {
        fs.writeFileSync(getPath("loop.txt"), "ehaj", "utf-8");
      }
      await util.toggleBlur(page, false);
      if (fs.existsSync(getPath("loop.txt"))) {
        await sendPassenger(util.getSelectedTraveler());
        const loopContents = fs.readFileSync(getPath("loop.txt"), "utf-8");
        if (loopContents === "ehaj") {
          fs.unlinkSync(getPath("loop.txt"));
        }
      } else {
        await util.controller(page, currentConfig, data.travellers);
      }
      try {
        await page.waitForSelector("#proceedButton > input.btn.btn-primary", {
          visible: true,
          timeout: 5000,
        });
        await page.click("#proceedButton > input.btn.btn-primary");
      } catch (err) {
        const error = await page.$eval("#passportCaptureStatus", (el) => {
          return el.innerText;
        });
        if (error && error.includes("try again")) {
          util.incrementSelectedTraveler();
          await kea.updatePassenger(
            data.system.accountId,
            passenger.passportNumber,
            {
              "submissionData.ehj.status": "Rejected",
            }
          );
          await page.reload();
          return false;
        }
      }
      break;
    case "add-mission-pilgrim-upload":
      await util.controller(page, currentConfig, data.travellers);
      break;
    case "add-mission-pilgrim-3":
    case "add-pilgrim-3":
      const isErrorAdd = await page.$(
        "#stepItemsMSGs > div > div > div > ul > li > span"
      );
      if (isErrorAdd) {
        const errorMessage = await page.$eval(
          "#stepItemsMSGs > div > div > div > ul > li > span",
          (el) => el.innerText
        );
        fs.appendFileSync(getLogFile(), `${errorMessage}\n`);
        console.log(errorMessage);
      }
      await page.waitForSelector("#reference1");
      const tagValue = await page.$eval("#reference1", (el) => el.value);
      if (
        tagValue &&
        passports.filter((x) => x == passenger.passportNumber).length > 3
      ) {
        return;
      }
      console.log(passenger.slug);
      const pageUrl = await page.url();
      await page.waitForSelector("#pass");

      const visiblePassportNumber = await page.$eval("#pass", (el) => el.value);
      if (!visiblePassportNumber) {
        return;
      }
      const isArabic = await page.$("#firstNameAr");
      if (isArabic) {
        await util.commit(
          page,
          [
            {
              selector: "#firstNameAr",
              value: (row) => row.nameArabic.first,
            },
            {
              selector: "#fatherNameAr",
              value: (row) => row.nameArabic.father,
            },
            {
              selector: "#grandFatherNameAr",
              value: (row) => row.nameArabic.grand,
            },
            {
              selector: "#familyNameAr",
              value: (row) => row.nameArabic.last,
            },
          ],
          passenger
        );
      }

      const isYearOfBirth = await page.$("#yearOfBirth");
      if (isYearOfBirth) {
        const recentYear = await page.$eval(
          "#yearOfBirth > option:nth-child(2)",
          (el) => {
            return el.value;
          }
        );
        await page.select("#yearOfBirth", recentYear);
        console.log(
          "%cMyProject%cline:626%crecentYear",
          "color:#fff;background:#ee6f57;padding:3px;border-radius:2px",
          "color:#fff;background:#1f3c88;padding:3px;border-radius:2px",
          "color:#fff;background:rgb(252, 157, 154);padding:3px;border-radius:2px",
          recentYear
        );
      }

      await util.toggleBlur(page);
      passports.push(passenger.passportNumber);
      await util.commander(page, {
        controller: {
          selector: pageUrl.includes("hajMission")
            ? "#j_idt4267_header"
            : "#formData > div:nth-child(5) > div.ui-panel-titlebar.ui-widget-header.ui-helper-clearfix.ui-corner-all",
          title: "Remember",
          arabicTitle: "تذكر",
          action: async () => {
            rememberValue("#address", "ehaj_pilgrim_address");
            rememberValue("#embassy", "ehaj_pilgrim_embassy");
            rememberValue("#packge2", "ehaj_pilgrim_package");
            rememberValue("#roomType", "ehaj_pilgrim_roomType");
            rememberValue("#hajType", "ehaj_pilgrim_hajType");
          },
        },
      });
      await util.commit(page, currentConfig.details, passenger);
      await util.commit(
        page,
        [
          {
            selector: "#reference1",
            value: (row) =>
              row.caravan < 40
                ? row.caravan.replace(/[^a-zA-Z0-9 ]/, "")
                : row.caravan
                    .substring(row.caravan.length - 40, row.caravan.length)
                    .replace(/[^a-zA-Z0-9 ]/, ""),
          },
        ],
        data.info
      );
      await page.select("#passportType", "1");
      const embassyVisible = await page.$("#embassy");
      if (embassyVisible) {
        await page.select("#embassy", budgie.get("ehaj_pilgrim_embassy", 214));
      }

      const packageVisible = await page.$("#packge2");
      if (packageVisible) {
        await page.select("#packge2", budgie.get("ehaj_pilgrim_package", ""));
      }

      const roomTypeVisible = await page.$("#roomType");
      if (roomTypeVisible) {
        await page.select("#roomType", budgie.get("ehaj_pilgrim_roomType", ""));
      }
      const isIqamaVisible = await page.$("#iqamaNo");
      if (isIqamaVisible) {
        await util.commit(
          page,
          [
            {
              selector: "#iqamaNo",
              value: (row) => row.idNumber || moment().valueOf(),
            },
            {
              selector: "#iqamaIssueDate",
              value: (row) =>
                row.idIssueDt.dmy
                  ? getPermitIssueDt(row.idIssueDt.dmy)
                  : row.passIssueDt.dmy,
            },
            {
              selector: "#iqamaExpiryDate",
              value: (row) =>
                row.idExpireDt.dmy
                  ? getPermitExpireDt(row.idExpireDt.dmy)
                  : row.passExpireDt.dmy,
            },
          ],
          passenger
        );
        const resizedId = await util.downloadAndResizeImage(
          passenger,
          350,
          500,
          "id",
          30,
          100
        );

        await util.commitFile("#permit_attmnt_input", resizedId);
      }

      let resizedPhotoPath = await util.downloadAndResizeImage(
        passenger,
        200,
        200,
        "photo",
        5,
        20
      );

      if (resizedPhotoPath.includes("dummy")) {
        await util.commit(
          page,
          [
            {
              selector: "#reference1",
              value: () => "Error-Photo",
            },
          ],
          passenger
        );
      }

      await page.waitForTimeout(1000);
      // await page.click("#attachment_input");
      await util.commitFile("#attachment_input", resizedPhotoPath);
      await util.toggleBlur(page, false);
      // Wait here for 1 second
      await page.waitForTimeout(1000);
      try {
        await page.$eval(
          "#formData > div:nth-child(9) > div:nth-child(1) > div:nth-child(4) > label",
          (el, val) => (el.innerText = val),
          passenger.passIssueDt.dmy
        );
      } catch {}
      try {
        await page.$eval(
          "#formData > div:nth-child(11) > div:nth-child(1) > div:nth-child(4) > label",
          (el, val) => (el.innerText = val),
          passenger.passIssueDt.dmy
        );
      } catch {}
      await page.waitForTimeout(1000);
      // try issue date 5 times
      const passportIssueDateFromData = `${passenger.passIssueDt.dd}/${passenger.passIssueDt.mm}/${passenger.passIssueDt.yyyy}`;
      for (let i = 1; i <= 5; i++) {
        await util.commit(
          page,
          [
            {
              selector: "#passportIssueDate",
              value: (row) =>
                `${row.passIssueDt.dd}/${row.passIssueDt.mm}/${row.passIssueDt.yyyy}`,
            },
          ],
          passenger
        );
        await page.waitForTimeout(500);
        const passportIssueDateFromPage1 = await page.$eval(
          "#passportIssueDate",
          (el) => el.value
        );
        if (passportIssueDateFromPage1 === passportIssueDateFromData) {
          break;
        }
      }
      if (pageUrl.includes("hajMission")) {
        await page.$eval(
          "#j_idt4105_content > div > div:nth-child(4) > div > label",
          (el, val) => (el.innerText = `Passport Issue Date: => ${val}`),
          passenger.passIssueDt.dmmmy
        );
      } else {
        await page.$eval(
          "#formData > div:nth-child(3) > div.ui-panel-content.ui-widget-content > div > div:nth-child(4) > div > label",
          (el, val) => (el.innerText = `Passport Issue Date: => ${val}`),
          passenger.passIssueDt.dmmmy
        );
      }
      // try {
      //   await page.$eval(
      //     "#formData > div:nth-child(12) > div:nth-child(1) > div:nth-child(4) > label",
      //     (el, val) => (el.innerText = val),
      //     passenger.passIssueDt.dmy
      //   );
      // } catch {}
      await page.waitForSelector("#covidVaccines");
      const isVaccineClicked = await page.$eval(
        "#covidVaccines",
        (el) => el.checked
      );
      if (!isVaccineClicked) {
        await page.click("#covidVaccines");
      }

      const rememberedCountryOfResidence = data.system.country.telCode;
      if (rememberedCountryOfResidence) {
        const countryOfResidenceText = await page.$$eval(
          "#countryOfResidence > option",
          (els, val) => {
            return els.find((el) => el.value === val).innerText;
          },
          rememberedCountryOfResidence
        );
        await page.$eval(
          "#countryOfResidence",
          (el, vals) => {
            el.value = vals[0];
            document.querySelector(
              "#s2id_countryOfResidence > a > span.select2-chosen"
            ).innerText = vals[1];
          },
          [rememberedCountryOfResidence, countryOfResidenceText]
        );
      }
      try {
        await page.select("#hajType", budgie.get("ehaj_pilgrim_hajType", "1"));
      } catch {}

      // if (passports.filter((x) => x == passenger.passportNumber).length > 3) {
      //   // Stop
      // } else {
      //   if (fs.existsSync(getPath("loop.txt"))) {

      //     const submitButtonSelector =
      //       "#actionPanel > div > div > input.btn.btn-primary";
      //     await page.click(submitButtonSelector);
      //   }
      // }
      // scroll into view the passport issue date selector "#j_idt4105_content > div > div:nth-child(4) > div > label"
      await page.waitForTimeout(1000);
      const submitButtonSelector = "#actionPanel > div > input.btn.btn-primary";
      // read the passport issue date from the field and compare it with the passport issue date from the data
      const passportIssueDateFromPage = await page.$eval(
        "#passportIssueDate",
        (el) => el.value
      );
      if (passportIssueDateFromPage !== passportIssueDateFromData) {
        console.log(
          "passport issue date from page: ",
          passportIssueDateFromPage
        );
        console.log(
          "passport issue date from data: ",
          passportIssueDateFromData
        );
        console.log(
          "passport issue date from page is not equal to passport issue date from data"
        );
        await page.evaluate(() => {
          document.querySelector(
            "#actionPanel > div > input.btn.btn-primary"
          ).value = "Submit (Passport Issue Date Mismatch)";
        });
      } else {
        await page.evaluate(() => {
          document.querySelector(
            "#actionPanel > div > input.btn.btn-primary"
          ).value = "Submit (Ok)";
        });
        await page.waitForSelector(submitButtonSelector);
        await page.click(submitButtonSelector);
      }

      break;
    case "package-details":
      await util.commit(page, currentConfig.details, passenger);
      await page.select("#packageType", "2");
      await page.select("#hpArrivalAirline", "11435");
      await page.select("#arrivalPort", "50");
      await page.select("#hpDepartureAirline", "11435");
      await page.select("#deptPort", "50");
      break;
    case "company-questionnaire":
    case "mission-questionnaire":
      await util.commit(page, currentConfig.details, passenger);
      await page.type(
        "#kt_app_content_container > div:nth-child(2) > form > div.ui-panel.ui-widget.ui-widget-content.ui-corner-all > div.ui-panel-content.ui-widget-content > div:nth-child(14) > span > div > div > input",
        "01/06/2024"
      );
      await page.click(
        "#kt_app_content_container > div:nth-child(2) > form > div.ui-panel.ui-widget.ui-widget-content.ui-corner-all > div.ui-panel-content.ui-widget-content > div:nth-child(31) > div.form-group > div > table > tbody > tr > td:nth-child(2) > div"
      );
      await page.waitForSelector(
        "#kt_app_content_container > div:nth-child(2) > form > div.ui-panel.ui-widget.ui-widget-content.ui-corner-all > div.ui-panel-content.ui-widget-content > div:nth-child(31) > div.ui-outputpanel.ui-widget > div > div > div > table > tbody > tr > td > textarea",
        { visible: true }
      );
      await util.commit(
        page,
        [
          {
            selector:
              "#kt_app_content_container > div:nth-child(2) > form > div.ui-panel.ui-widget.ui-widget-content.ui-corner-all > div.ui-panel-content.ui-widget-content > div:nth-child(31) > div.ui-outputpanel.ui-widget > div > div > div > table > tbody > tr > td > textarea",
            value: () => "COVID, MENINGITIS, FLU, TYPHOID FEVER",
          },
        ],
        passenger
      );
      await page.click(
        "#kt_app_content_container > div:nth-child(2) > form > div.ui-panel.ui-widget.ui-widget-content.ui-corner-all > div.ui-panel-content.ui-widget-content > div:nth-child(32) > div.form-group > div > table > tbody > tr > td:nth-child(2) > div"
      );
      const hasRequiredVaccinationBeenTakenTextSelector =
        "#kt_app_content_container > div:nth-child(2) > form > div.ui-panel.ui-widget.ui-widget-content.ui-corner-all > div.ui-panel-content.ui-widget-content > div:nth-child(32) > div.ui-outputpanel.ui-widget > div > div > div > table > tbody > tr > td > textarea";
      await page.waitForSelector(hasRequiredVaccinationBeenTakenTextSelector);
      await util.commit(
        page,
        [
          {
            selector: hasRequiredVaccinationBeenTakenTextSelector,
            value: () => "covid-19, seasonal flu and others ",
          },
        ],
        passenger
      );
      if (!questionnaireClicked[passenger.passportNumber]) {
        questionnaireClicked[passenger.passportNumber] = true;
        await page.click("#actionPanel > div > input.btn.btn-primary");
      }
      return; // The code below does not apply for this year
      const iPledgeToAbideByTheRulesTextSelector =
        "body > div.wrapper > div > div.page-content > div.row > form > div > div.ui-panel-content.ui-widget-content > div:nth-child(32) > div.ui-outputpanel.ui-widget > div > div > div > div > table > tbody > tr > td > div > textarea";
      await page.waitForSelector(iPledgeToAbideByTheRulesTextSelector);
      await page.type(
        iPledgeToAbideByTheRulesTextSelector,
        "I pledge to abide by the rules"
      );

      // download passport image
      const resizedPassportPath = await util.downloadAndResizeImage(
        passenger,
        400,
        300,
        "passport"
      );
      try {
        await util.commitFile(
          "body > div.wrapper > div > div.page-content > div.row > form > div > div.ui-panel-content.ui-widget-content > div:nth-child(33) > div > div > div > div.ui-fileupload-buttonbar.ui-widget-header.ui-corner-top > span > input[type=file]",
          resizedPassportPath
        );
        const labelForPassportImageSelector =
          "body > div.wrapper > div > div.page-content > div.row > form > div > div.ui-panel-content.ui-widget-content > div:nth-child(33) > div > label";
        await page.$eval(
          labelForPassportImageSelector,
          (el, val) => (el.innerText = val),
          resizedPassportPath
        );
      } catch {}

      await page.evaluate(() => {
        document
          .querySelector("#actionPanel > div > div > input.btn.btn-primary")
          .scrollIntoView();
      });

      break;
    case "housing-contract":
      //
      await util.commander(page, {
        controller: {
          selector:
            "body > div.wrapper > div > div.page-content > div.row > div.form-wizard",
          title: "Analyze",
          arabicTitle: "تحليل",
          name: "analyzeContracts",
          action: async () => {
            for (let i = 1; i <= 100; i++) {
              const isRowValid = await page.$(
                `#primetable_data > tr:nth-child(${i}) > td:nth-child(2)`
              );
              if (!isRowValid) {
                break;
              }

              const Request_Id = await page.$eval(
                `#primetable_data > tr:nth-child(${i}) > td:nth-child(1)`,
                (el) => el.innerText
              );

              const Contract_Name = await page.$eval(
                `#primetable_data > tr:nth-child(${i}) > td:nth-child(2)`,
                (el) => el.innerText
              );
              const City = await page.$eval(
                `#primetable_data > tr:nth-child(${i}) > td:nth-child(4) > span`,
                (el) => el.innerText
              );
              const Date_From = await page.$eval(
                `#primetable_data > tr:nth-child(${i}) > td:nth-child(6)`,
                (el) => el.innerText
              );

              const Date_To = await page.$eval(
                `#primetable_data > tr:nth-child(${i}) > td:nth-child(7)`,
                (el) => el.innerText
              );

              const Capacity = await page.$eval(
                `#primetable_data > tr:nth-child(${i}) > td:nth-child(8)`,
                (el) => el.innerText
              );

              const Status = await page.$eval(
                `#primetable_data > tr:nth-child(${i}) > td:nth-child(13) > span`,
                (el) => el.innerText
              );

              if (
                !Status.toLowerCase().includes("approved") &&
                !Status.toLowerCase().includes("موافق")
              ) {
                continue;
              }
              const Duration = moment(Date_To, "DD/MM/YYYY").diff(
                moment(Date_From, "DD/MM/YYYY"),
                "days"
              );
              const house = {
                Request_Id,
                Contract_Name,
                City,
                Date_From,
                Date_To,
                Capacity,
                Duration,
                Status,
              };
              if (!housings.find((h) => h.Request_Id == house.Request_Id)) {
                housings.push(house);
              }
            }
            runHousingAnalysis();
          },
        },
      });
      break;
    case "package-details-2":
      await util.commit(
        page,
        [
          {
            selector: "#minaDescLa",
            value: () => "Camp with 24 hours service in conditioned tents",
          },
          {
            selector: "#minaDescAr",
            value: () => "مخيم مع خدمة 24 ساعة في خيام مكيفة",
          },
          {
            selector: "#arafaDescLa",
            value: () => "Camp with 24 hours service in conditioned tents",
          },
          {
            selector: "#arafaDescAr",
            value: () => "مخيم مع خدمة 24 ساعة في خيام مكيفة",
          },
          {
            selector: "#muzdalifaDescLa",
            value: () => "Camp with 24 hours service",
          },
          {
            selector: "#muzdalifaDescAr",
            value: () => "مخيم مع خدمة 24 ساعة   ",
          },
          {
            selector: "#makHouseContractStart",
            value: () => budgie.get("ehaj-package-dt-from-1"),
          },
          {
            selector: "#makHouseContractEnd",
            value: () => budgie.get("ehaj-package-dt-to-1"),
          },
          {
            selector: "#madHouseContractStart",
            value: () => budgie.get("ehaj-package-dt-from-2"),
          },
          {
            selector: "#madHouseContractEnd",
            value: () => budgie.get("ehaj-package-dt-to-2"),
          },
        ],
        passenger
      );
      await page.select(
        "#makHouseContract",
        budgie.get("ehaj-package-hotel-1")
      );
      await page.waitForTimeout(1000);
      await page.select(
        "#madHouseContract",
        budgie.get("ehaj-package-hotel-2")
      );
      await page.waitForTimeout(2000);

      await page.select(
        "#houseContractMakRoomType",
        budgie.get("ehaj-package-hotel-1-room-type")
      );

      await page.select(
        "#houseContractMadRoomType",
        budgie.get("ehaj-package-hotel-2-room-type")
      );

      await util.commander(page, {
        controller: {
          selector:
            "#formPack > div.ui-panel.ui-widget.ui-widget-content.ui-corner-all > div.ui-panel-titlebar.ui-widget-header.ui-helper-clearfix.ui-corner-all > span",
          title: "Remeber",
          arabicTitle: "تذكر",
          name: "rememberPackageDates",
          action: async () => {
            const hotel1 = await page.evaluate(() => {
              const makkahHotel = document.getElementById("makHouseContract");
              return makkahHotel.value;
            });
            budgie.save("ehaj-package-hotel-1", hotel1);

            const hotel2 = await page.$eval(
              "#madHouseContract",
              (el) => el.value
            );
            budgie.save("ehaj-package-hotel-2", hotel2);

            const hotel1RoomType = await page.$eval(
              "#houseContractMakRoomType",
              (el) => el.value
            );
            budgie.save("ehaj-package-hotel-1-room-type", hotel1RoomType);

            const hote21RoomType = await page.$eval(
              "#houseContractMadRoomType",
              (el) => el.value
            );
            budgie.save("ehaj-package-hotel-2-room-type", hote21RoomType);

            const fromDt1 = await page.$eval(
              "#makHouseContractStart",
              (el) => el.value
            );
            budgie.save("ehaj-package-dt-from-1", fromDt1);

            const tot1 = await page.$eval(
              "#makHouseContractEnd",
              (el) => el.value
            );
            budgie.save("ehaj-package-dt-to-1", tot1);

            const fromDt2 = await page.$eval(
              "#madHouseContractStart",
              (el) => el.value
            );
            budgie.save("ehaj-package-dt-from-2", fromDt2);

            const toDt2 = await page.$eval(
              "#madHouseContractEnd",
              (el) => el.value
            );
            budgie.save("ehaj-package-dt-to-2", toDt2);
          },
        },
      });

      break;
    case "house-details":
      await util.commander(page, {
        controller: {
          // TODO: Replace with a more robust selector
          selector:
            "body > div.wrapper > div > div.page-content > div.row > div:nth-child(21) > div.ui-panel-titlebar.ui-widget-header.ui-helper-clearfix.ui-corner-all > span",
          title: "Room Details",
          arabicTitle: "تفاصيل الغرفة",
          name: "analyzeRoomDetails",
          action: async () => {
            for (let i = 1; i <= 100; i++) {
              const isRowValid = await page.$(
                `#roomsDetails_data > tr:nth-child(${i}) > td:nth-child(1)`
              );
              if (!isRowValid) {
                break;
              }

              const roomType = await page.$eval(
                `#roomsDetails_data > tr:nth-child(${i}) > td:nth-child(1)`,
                (el) => el.innerText
              );
              const numberOfRooms = await page.$eval(
                `#roomsDetails_data > tr:nth-child(${i}) > td:nth-child(2)`,
                (el) => el.innerText
              );
              const requestId = await page.$eval(
                "body > div.wrapper > div > div.page-content > div.row > div:nth-child(3) > div.ui-panel-content.ui-widget-content > table > tbody > tr:nth-child(1) > td:nth-child(2)",
                (el) => el.innerText
              );
              const foodRequested = await page.$eval(
                "body > div.wrapper > div > div.page-content > div.row > div:nth-child(17) > div.ui-panel-content.ui-widget-content > table > tbody > tr > td:nth-child(4) > span",
                (el) => el.innerText
              );
              const housing = housings.find((h) => h.Request_Id == requestId);
              if (housing) {
                if (!housing.Comments) {
                  housing.Comments = "";
                }
                housing.Comments += `${roomType}x${numberOfRooms} `;
                housing.Food = foodRequested;
              }
            }
            runHousingAnalysis();
          },
        },
      });
      break;
    case "reservation-data-1":
      await util.controller(page, currentConfig, data.travellers);

      // await page.waitForSelector("#code");
      // for (let x = 0; x < 20; x++) {
      //   console.log(
      //     "%cMyProject%cline:1195%c0",
      //     "color:#fff;background:#ee6f57;padding:3px;border-radius:2px",
      //     "color:#fff;background:#1f3c88;padding:3px;border-radius:2px",
      //     "color:#fff;background:rgb(56, 13, 49);padding:3px;border-radius:2px",
      //     0
      //   );
      //   const code = await SMS.getSMSCode(newSMSNumber.activationId);
      //   console.log(
      //     "%cMyProject%cline:1196%ccode",
      //     "color:#fff;background:#ee6f57;padding:3px;border-radius:2px",
      //     "color:#fff;background:#1f3c88;padding:3px;border-radius:2px",
      //     "color:#fff;background:rgb(178, 190, 126);padding:3px;border-radius:2px",
      //     code
      //   );
      //   await page.waitForTimeout(1000);
      // }

      break;
    case "review-reservation-1":
      await page.click(
        "#confirmationPanel > div.portlet-body > form > div.reservation-button > div > div > div > input"
      );

      await page.waitForTimeout(1000);
      await page.waitForSelector("#submitResvBtn");
      await page.click("#submitResvBtn");

      break;
    case "dashboard":
      break;
    case "reservation-complete":
      await util.commander(page, {
        controller: {
          selector: "body > div.slider-block > div",
          title: "Back to Ehaj",
          arabicTitle: "العوده للمسار الإليكتروني",
          name: "backToEhaj",
          action: async () => {
            if (fs.existsSync("./ehaj.txt")) {
              const ehajUrl = fs.readFileSync("./ehaj.txt", "utf-8");
              page.goto(ehajUrl);
            } else {
              page.goto("https://ehaj.haj.gov.sa/EH/login.xhtml");
            }
          },
        },
      });

      const isReservationIdAvailable = await page.$(
        "#stepItemsMSGs > div > div > div > ul > li > span"
      );
      if (isReservationIdAvailable) {
        const reservation = await page.$eval(
          "#stepItemsMSGs > div > div > div > ul > li > span",
          (el) => el.innerText
        );
        const reservationId = reservation.match(/\d+/g)[0];
        fs.appendFileSync(getLogFile(), reservationId);
      }

      break;
    case "package-quota-list":
      await util.commander(page, {
        controller: {
          leftAlign: true,
          selector:
            "body > div.wrapper > form > header > nav > div > div.clearfix.navbar-fixed-top > div.logo > img",
          title: "Go to reservation",
          arabicTitle: "الي الحجز",
          name: "toReseervation",
          action: async () => {
            const thisUrl = await page.url();
            fs.writeFileSync("./ehaj.txt", thisUrl);
            page.goto(
              "https://ehaj.haj.gov.sa/EPATH/pages/StartBooking/home.xhtml"
            );
          },
        },
      });
      break;
    case "hajj-group-details":
      await page.type(
        "#grpName",
        data.info.caravan + "-" + moment().format("YYYYMMDDHHmm")
      );
      await page.type(
        "#arrivalDate",
        budgie.get("hajj-group-arrival-date", "")
      );
      await page.type(
        "#contractsEndDate",
        budgie.get("hajj-group-departure-date", "")
      );

      await util.commander(page, {
        controller: {
          selector: "#initiateHajGroupForm > h3:nth-child(2)",
          title: "Remember",
          arabicTitle: "تذكر",
          name: "rememberHajjGroupDetails",
          action: async () => {
            const arrivalDate = await page.$eval(
              "#arrivalDate",
              (el) => el.value
            );
            budgie.save("hajj-group-arrival-date", arrivalDate);

            const departureDate = await page.$eval(
              "#contractsEndDate",
              (el) => el.value
            );
            budgie.save("hajj-group-departure-date", departureDate);
          },
        },
      });

      break;
    default:
      break;
  }
}

function runHousingAnalysis() {
  console.table(housings);
  const suggestions = getMED_MAK_Capacity_Suggestions(cloneDeep(housings));
  console.table(suggestions);
}

function getMED_MAK_Capacity_Suggestions(incomingHousing) {
  const _housings = incomingHousing;
  const suggestions = [];
  const madinahHousings = _housings
    .filter((h) => h.City.toLowerCase().includes("madina"))
    .sort((a, b) => a.Capacity - b.Capacity);
  const makkahHousings = _housings
    .filter((h) => h.City.toLowerCase().includes("makkah"))
    .sort((a, b) => a.Capacity - b.Capacity);
  suggestions.push({
    capacity: "Madinah",
    K_Request_Id: "Makkah",
    K_Contract_Name: "Makkah",
    K_Date_From: "Makkah",
    K_Date_To: "Makkah",
    M_Request_Id: "Madinah",
    M_Contract_Name: "Madinah",
    M_Date_From: "Madinah",
    M_Date_To: "Madinah",
    K_Remaining_Capacity: "",
  });
  for (const madinahHousing of madinahHousings) {
    const validMakkahHousing = makkahHousings.find(
      (h) => parseInt(h.Capacity) >= parseInt(madinahHousing.Capacity)
    );
    if (validMakkahHousing) {
      validMakkahHousing.Capacity =
        parseInt(validMakkahHousing.Capacity) -
        parseInt(madinahHousing.Capacity);
      suggestions.push({
        capacity: madinahHousing.Capacity,
        K_Request_Id: validMakkahHousing.Request_Id,
        K_Contract_Name: validMakkahHousing.Contract_Name,
        K_Date_From: validMakkahHousing.Date_From,
        K_Date_To: validMakkahHousing.Date_To,
        M_Request_Id: madinahHousing.Request_Id,
        M_Contract_Name: madinahHousing.Contract_Name,
        M_Date_From: madinahHousing.Date_From,
        M_Date_To: madinahHousing.Date_To,
        K_Remaining_Capacity: validMakkahHousing.Capacity,
      });
    }
  }
  return suggestions;
}

function getPermitIssueDt(issDt) {
  const issueDateDraft = moment(issDt, "DD/MM/YYYY");
  if (
    issueDateDraft.isValid() &&
    issueDateDraft.isBefore(moment().add(-1, "day"))
  ) {
    return issDt;
  }
  return moment().add(-1, "year").format("DD/MM/YYYY");
}

async function makeReservations(index, passengersData) {
  const passengers = passengersData.travellers;
  let j = 0;
  for (let i = index; i < passengers.length; i++) {
    const passenger = passengers[i];
    if (i == index) {
      const isEmailPresnet = await page.$eval("#email", (el) => el.value);
      if (!isEmailPresnet) {
        await page.type(
          "#email",
          (passenger.name.first + passenger.name.last).replace(/ /g, "") +
            "@premiumemail.ca"
        );
      }
    }
    const isFieldVisible = page.$(`#hd\\\:${j}\\\:first_name_la`);
    if (!isFieldVisible) {
      break;
    }
    await page.type(
      `#hd\\\:${j}\\\:first_name_la`,
      passenger.name.first.replace(/ /g, "")
    );
    await page.type(
      `#hd\\\:${j}\\\:last_name_la`,
      passenger.name.last.replace(/ /g, "")
    );
    await page.type(`#hd\\\:${j}\\\:hdrPassportNoId`, passenger.passportNumber);
    await page.type(`#hd\\\:${j}\\\:PilgrimDateOfBirth`, passenger.dob.dmy);
    console.log(passenger.slug);
    fs.appendFileSync(getLogFile(), `${passenger.slug}\n`);
    if (passenger.nationality.telCode) {
      await page.select(
        `#hd\\\:${j}\\\:nationalityId`,
        passenger.nationality.telCode.toString()
      );
    }
    if (j > 0) {
      await page.select(`#hd\\\:${j}\\\:relationship`, "702");
    }
    j++;
  }
}

function getPermitExpireDt(expDt) {
  const expDtDraft = moment(expDt, "DD/MM/YYYY");
  if (expDtDraft.isValid() && expDtDraft.isAfter(moment().add(6, "months"))) {
    return expDt;
  }
  return moment().add(1, "year").format("DD/MM/YYYY");
}

async function uploadPilgrimViaPassport(selectedTraveler) {
  const passenger = data.travellers[selectedTraveler];
  // input file selector #kt_app_content_container > div:nth-child(2) > form > div.ui-panel.ui-widget.ui-widget-content.ui-corner-all > div.ui-panel-content.ui-widget-content > div > div > div > div > div.ui-fileupload-buttonbar.ui-widget-header.ui-corner-top > span > input[type=file]
  // download passport image
  const resizedPassportPath = await util.downloadAndResizeImage(
    passenger,
    400,
    300,
    "passport"
  );
  const inputs = await page.$$("input[type=file]");
  await inputs[0].uploadFile(resizedPassportPath);

  try {
    await inputs[0].uploadFile(resizedPassportPath);
    await page.waitForTimeout(3000);
    await page.waitForSelector("input[type=submit]");
    const submitButtons = await page.$$("input[type=submit]");
    await submitButtons[0].click();
  } catch (e) {
    console.log(e);
  }
}

module.exports = { send };
