const puppeteer = require("puppeteer-extra");
// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const fs = require("fs");
const path = require("path");
const budgie = require("./budgie");
const util = require("./util");
const moment = require("moment");
const sharp = require("sharp");
const homedir = require("os").homedir();
const SMS = require("./sms");
const email = require("./email");
const totp = require("totp-generator");
const { default: axios } = require("axios");

let page;
let data;
let counter = 0;

const config = [
  {
    name: "home",
    url: "https://www.motawif.com.sa/",
    regex: "https://www.motawif.com.sa/home/",
    controller: {
      selector: "body > header > div > div",
      action: async () => {
        const selectedTraveler = await page.$eval(
          "#hajonsoft_select",
          (el) => el.value
        );
        if (selectedTraveler) {
          fs.writeFileSync("./selectedTraveller.txt", selectedTraveler);
          const data = fs.readFileSync("./data.json", "utf-8");
          var passengersData = JSON.parse(data);
          const passenger = passengersData.travellers[selectedTraveler];
          await page.type("#FirstName", passenger.name.first);
          await page.type("#LastName", passenger.name.last);
          await page.type("#Email", passenger.name.first + passenger.name.last  + "@gmail.com");
          await page.type("#PhoneNumber", '123456789');
        }
      },
    },
  },
  {
    name: "thankyou",
    regex: "https://www.motawif.com.sa/home/en-sa/thankyou",
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
      selector: "#passportImage > p",
      action: async () => {
        const selectedTraveler = await page.$eval(
          "#hajonsoft_select",
          (el) => el.value
        );
        if (selectedTraveler) {
          fs.writeFileSync("./selectedTraveller.txt", selectedTraveler);
          const data = fs.readFileSync("./data.json", "utf-8");
          var passengersData = JSON.parse(data);
          await pasteCodeLine(selectedTraveler, passengersData);
        }
      },
    },
  },
  {
    name: "add-company-pilgrim",
    regex:
      "https://ehaj.haj.gov.sa/EH/pages/hajCompany/lookup/hajData/AddMrz.xhtml",

    controller: {
      selector: "#passportImage > p",
      action: async () => {
        const selectedTraveler = await page.$eval(
          "#hajonsoft_select",
          (el) => el.value
        );
        if (selectedTraveler) {
          fs.writeFileSync("./selectedTraveller.txt", selectedTraveler);
          const data = fs.readFileSync("./data.json", "utf-8");
          var passengersData = JSON.parse(data);
          await pasteCodeLine(selectedTraveler, passengersData);
        }
      },
    },
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
        value: (row) => row.birthPlace,
      },
      {
        selector: "#address",
        value: (row) => budgie.get("ehaj_pilgrim_address", row.address),
      },
      {
        selector: "#passportIssueDate",
        value: (row) => row.passIssueDt.dmy,
      },
      {
        selector: "#idno",
        value: (row) => moment().valueOf().toString(),
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
        value: (row) => row.birthPlace,
      },
      {
        selector: "#address",
        value: (row) => budgie.get("ehaj_pilgrim_address", row.address),
      },
      {
        selector: "#passportIssueDate",
        value: (row) => row.passIssueDt.dmy,
      },
      {
        selector: "#idno",
        value: (row) => moment().valueOf().toString(),
      },
    ],
  },
  {
    name: "reserve",
    regex: "https://ehaj.haj.gov.sa/EPATH",
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
        value: () => "قافله رقم " + moment().valueOf().toString(),
      },
      {
        selector: "#nameEn",
        value: () => "Caravan #" + moment().valueOf().toString(),
      },
      {
        selector: "#pkgDescAr",
        value: () => "قافله رقم " + moment().valueOf().toString(),
      },
      {
        selector: "#pkgDescEn",
        value: () => "Caravan #" + moment().valueOf().toString(),
      },
    ],
  },
];

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
    case "home":
      await util.controller(page, currentConfig, data.travellers);
      break;
    case "index":
      try {
        const anchors = await page.$$eval("a", (els) => {
          return els.map((el) => el.removeAttribute("target"));
        });
      } catch {}
      break;
    case "login":
      await util.commit(page, currentConfig.details, data.system);
      if (data.system.username && data.system.password) {
        const loginButton = await page.$x(
          "/html/body/div[2]/div[2]/div/div[2]/div/form/div[4]/div/input"
        );
        if (
          loginButton &&
          Array.isArray(loginButton) &&
          loginButton.length > 0
        ) {
          loginButton[0].click();
        }
      }
      break;
    case "otp":
      // if ((await page.$(".insecure-form")) !== null) {
      //   await page.click("#proceed-button");
      //   await page.waitForNavigation({ waitUntil: "networkidle0" });
      // }
      const messageSelector = "#mobileVerForm > h5";
      await page.waitForSelector(messageSelector);
      const message = await page.$eval(messageSelector, (el) => el.innerText);
      if (
        (message.includes("generated by Google Authenticator") ||
          message.includes("vérification généré par Google Authenticator") ||
          message.includes("ديك في تطبيق Google Authenticator")) &&
        data.system.ehajCode
      ) {
        const token = totp(data.system.ehajCode);
        await page.type("#code", token);
        const submitButton = await page.$x(
          "/html/body/div[1]/div[2]/div[1]/form/div[2]/div/div/input[1]"
        );
        if (
          submitButton &&
          Array.isArray(submitButton) &&
          submitButton.length > 0
        ) {
          submitButton[0].click();
        }
      }

      break;
    case "profile-verification":
      await page.waitForSelector("#code");
      // #j_idt3421 > div.modal-body > div > h5
      if (data.system.ehajCode) {
        const token = totp(data.system.ehajCode);
        await page.type("#code", token);
      }
      break;
    case "profile":
      // TODO: Check if this code is working fine
      await page.waitForSelector("#secretKey");
      const secretCode = await page.$eval("#secretKey", (el) => el.value);
      console.log(
        "%c 🥃 secretCode: ",
        "font-size:20px;background-color: #2EAFB0;color:#fff;",
        secretCode
      );
      const token = totp(secretCode);
      await page.type("#tokenValue", token);
      await page.click("#verifyGAuthToken > div > div.col-lg-4 > a");
      // Save to firebase
      const config = {
        headers: { Authorization: `Bearer ${data.info.accessToken}` },
      };
      const url = `${data.info.databaseURL}/protected/profile//.json`;
      try {
        await axios.patch(
          url,
          {
            ehajCode: secretCode,
          },
          config
        );
      } catch (err) {
        console.log(err);
      }

      break;
    case "thankyou":
      await page.goto(
        "https://www.motawif.com.sa"
      );
      break;
    case "list-pilgrims":
    case "list-pilgrims-mission":
      const ehajNumbers = [];
      await util.commander(page, {
        controller: {
          // TODO: Replace with a more robust selector
          selector: "#j_idt3409 > ul > li:nth-child(3)",
          title: "Import current view",
          arabicTitle: "استيراد الصفحه",
          name: "importEhajNumber",
          action: async () => {
            for (let i = 1; i <= 100; i++) {
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
              ehajNumbers.push(ehajNumber);
              const config = {
                headers: { Authorization: `Bearer ${data.info.accessToken}` },
              };
              const passengerPath = data.travellers.find(
                (p) => p.passportNumber === passportNumber
              )?.path;
              if (passengerPath) {
                const url = `${data.info.databaseURL}/${passengerPath}/.json`;
                try {
                  await axios.patch(
                    url,
                    {
                      ehajNumber,
                      mofaNumber,
                    },
                    config
                  );
                } catch (err) {
                  console.log(err);
                }
              }
              fs.writeFileSync(
                passportNumber,
                JSON.stringify({
                  ehajNumber,
                  mofaNumber,
                  passportNumber,
                })
              );
            }
            await page.evaluate((ehajNumbers) => {
              const eagleButton = document.querySelector(
                "#importEhajNumber"
              );
              eagleButton.textContent = `Done... [${ehajNumbers[0]}-${
                ehajNumbers[ehajNumbers.length - 1]
              }]`;
            }, ehajNumbers);
          },
        },
      });
      break;
    case "add-mission-pilgrim":
    case "add-company-pilgrim":
      await util.controller(page, currentConfig, data.travellers);
      // await page.waitForXPath(`//*[@id="j_idt3419"]/div/ul/li/span`, {timeout: 1000});
      const ehajNumberNode = await page.$x(
        `//*[@id="j_idt3419"]/div/ul/li/span`
      );
      if (
        ehajNumberNode &&
        Array.isArray(ehajNumberNode) &&
        ehajNumberNode.length > 0
      ) {
        const ehajNumberLine = await ehajNumberNode[0].evaluate(
          (node) => node.innerText
        );
        const ehajNumberMatch = ehajNumberLine.match(/#[0-9]{7,8}/);
        if (ehajNumberMatch) {
          fs.writeFileSync(
            path.join(__dirname, passenger.passportNumber),
            JSON.stringify({ ehajNumber: ehajNumberMatch[0] })
          );
        }
      }
      await page.waitForSelector("#proceedButton > div > input", {
        visible: true,
        timeout: 0,
      });
      await page.waitForTimeout(2000);
      await page.click("#proceedButton > div > input");
      break;
    case "add-mission-pilgrim-3":
    case "add-pilgrim-3":
      await page.waitForSelector("#pass");
      const visiblePassportNumber = await page.$eval("#pass", (el) => el.value);
      if (!visiblePassportNumber) {
        // await page.goto(
        //   "https://ehaj.haj.gov.sa/EH/pages/hajMission/lookup/hajData/AddMrz.xhtml"
        // );
        return;
      }
      await page.emulateVisionDeficiency("blurredVision");
      await util.commander(page, {
        controller: {
          selector: "#formData > h3:nth-child(10)",
          title: "Remember",
          arabicTitle: "تذكر",
          action: async () => {
            const address = await page.$eval("#address", (el) => el.value);
            budgie.save("ehaj_pilgrim_address", address);
            const vaccineType = await page.$eval(
              "#vaccineType",
              (el) => el.value
            );
            budgie.save("ehaj_pilgrim_vaccine_type", vaccineType);
            const firstDoseDate = await page.$eval(
              "#hdcviFirstDoseDate",
              (el) => el.value
            );
            budgie.save("ehaj_pilgrim_vaccine_1_date", firstDoseDate);

            const embassy = await page.$eval("#embassy", (el) => el.value);
            if (embassy) {
              budgie.save("ehaj_pilgrim_embassy", embassy);
            }
            const packageName = await page.$eval("#packge2", (el) => el.value);
            if (packageName) {
              budgie.save("ehaj_pilgrim_package", packageName);
            }
            const roomType = await page.$eval("#roomType", (el) => el.value);
            if (roomType) {
              budgie.save("ehaj_pilgrim_roomType", roomType);
            }
            const isSecondDoseRequired = await page.$("#hdcviSecondDoseDate");
            if (isSecondDoseRequired) {
              const secondDoseDate = await page.$eval(
                "#hdcviSecondDoseDate",
                (el) => el.value
              );
              budgie.save("ehaj_pilgrim_vaccine_2_date", secondDoseDate);
            }
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
                ? row.caravan
                : row.caravan.substring(
                    row.caravan.length - 40,
                    row.caravan.length
                  ),
          },
        ],
        data.info
      );
      await page.select("#passportType", "1");
      await page.select(
        "#vaccineType",
        budgie.get("ehaj_pilgrim_vaccine_type", 1)
      );
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

      await page.waitForSelector("#hdcviFirstDoseDate");

      await page.type(
        "#hdcviFirstDoseDate",
        moment().add(-60, "days").format("DD/MM/YYYY")

        // budgie.get(
        //   "ehaj_pilgrim_vaccine_1_date",
        //   moment().add(-60, "days").format("DD/MM/YYYY")
        // )
      );
      await page.waitForTimeout(500);
      const isSecondDoseRequired = await page.$("#hdcviSecondDoseDate");
      if (isSecondDoseRequired) {
        await page.type(
          "#hdcviSecondDoseDate",
          moment().add(-30, "days").format("DD/MM/YYYY")
          // budgie.get(
          //   "ehaj_pilgrim_vaccine_2_date",
          //   moment().add(-30, "days").format("DD/MM/YYYY")
          // )
        );
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
              value: (row) => row.passIssueDt.dmy,
            },
            {
              selector: "#iqamaExpiryDate",
              value: (row) => row.passExpireDt.dmy,
            },
          ],
          passenger
        );
        const resizedId = await util.downloadAndResizeImage(
          passenger,
          350,
          500,
          "id"
        );

        await util.commitFile("#permit_attmnt_input", resizedId);
      }

      let resizedPhotoPath = await util.downloadAndResizeImage(
        passenger,
        200,
        200,
        "photo"
      );
      const resizedVaccinePath = await util.downloadAndResizeImage(
        passenger,
        100,
        100,
        "vaccine"
      );
      const resizedVaccinePath2 = await util.downloadAndResizeImage(
        passenger,
        100,
        100,
        "vaccine2"
      );
      await page.click("#vaccine_attmnt_1_input");
      await util.commitFile("#vaccine_attmnt_1_input", resizedVaccinePath);
      if (isSecondDoseRequired) {
        await page.click("#vaccine_attmnt_2_input");
        await util.commitFile("#vaccine_attmnt_2_input", resizedVaccinePath2);
      }
      await page.waitForTimeout(500);
      await page.click("#attachment_input");
      await util.commitFile("#attachment_input", resizedPhotoPath);
      await page.emulateVisionDeficiency("none");
      break;
    case "reserve":
      // const numberResult = await SMS.getNewNumber();
      // if (numberResult.error) {
      //   console.log("can not get telephone number");
      // } else {
      //   console.log(numberResult);
      // }

      // for (let i = 0; i < 1000; i++) {
      //   await page.waitForTimeout(3000);
      //   const code = await SMS.getSMSCode(numberResult.activationId);
      //   console.log(
      //     "%cMyProject%cline:492%ccode",
      //     "color:#fff;background:#ee6f57;padding:3px;border-radius:2px",
      //     "color:#fff;background:#1f3c88;padding:3px;border-radius:2px",
      //     "color:#fff;background:rgb(227, 160, 93);padding:3px;border-radius:2px",
      //     code
      //   );
      // }

      // await SMS.cancelActivation(numberResult.activationId);
      break;
    case "package-details":
      await util.commit(page, currentConfig.details, passenger);
      break;

    default:
      break;
  }
}

module.exports = { send };