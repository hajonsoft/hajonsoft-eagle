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
const { cloneDeep } = require("lodash");
const { send: sendHsf } = require("./hsf");

let page;
let data;
let counter = 0;
const passports = [];
const housings = [];
let importClicks = 0;

function getLogFile() {
  const logFolder = path.join("./log", data.info.munazim);
  if (!fs.existsSync(logFolder)) {
    fs.mkdirSync(logFolder, { recursive: true });
  }
  const logFile = path.join(logFolder, data.info.caravan + ".txt");
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
    name: "package-quota-list",
    regex: "https://ehaj.haj.gov.sa/EH/pages/hajCompany/lookup/packagesQuota/List.xhtml",

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
      selector: "#passportImage > p",
      action: async () => {
        const selectedTraveler = await page.$eval(
          "#hajonsoft_select",
          (el) => el.value
        );
        if (selectedTraveler) {
          fs.writeFileSync("./selectedTraveller.txt", selectedTraveler);
          await sendPassenger(selectedTraveler);
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
    name: "dashboard",
    regex: "https://ehaj.haj.gov.sa/EH/pages/home/dashboard.xhtml",
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
        value: (row) => "", // budgie.get("ehaj_pilgrim_address", row.address)
      },
      {
        selector: "#passportIssueDate",
        value: (row) => row.passIssueDt.dmy,
      },
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
        value: (row) => row.birthPlace,
      },
      {
        selector: "#address",
        value: (row) => "", // budgie.get("ehaj_pilgrim_address", row.address),
      },
      {
        selector: "#passportIssueDate",
        value: (row) => row.passIssueDt.dmy,
      },
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
      { selector: "#packageOwnerPrice", value: () => "25000" },
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
      selector:
        "body > div.main > div > div.portlet.light.portlet-fit.bordered > div.portlet-title > div > span",
      name: "makeReservation",
      action: async () => {
        const selectedTraveler = await page.$eval(
          "#hajonsoft_select",
          (el) => el.value
        );
        if (selectedTraveler) {
          fs.writeFileSync("./selectedTraveller.txt", selectedTraveler);
          const data = fs.readFileSync("./data.json", "utf-8");
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
  const data = fs.readFileSync("./data.json", "utf-8");
  var passengersData = JSON.parse(data);
  await pasteCodeLine(selectedTraveler, passengersData);
}

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
    case "index":
      try {
        const anchors = await page.$$eval("a", (els) => {
          return els.map((el) => el.removeAttribute("target"));
        });
      } catch {}
      break;
    case "login":
      const isError = await page.$("#stepItemsMSGs > div > div");
      if (isError) {
        return;
      }
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
    case "authentication-settings":
      const isAuthCode = await page.$("#secretKey");
      if (isAuthCode) {
        const code = await page.$eval("#secretKey", (el) => el.value);
        console.log("Google Authenticator Code: " + code);
        if (data?.system?.ehajCode.length > 1) {
          return;
        }
        //save to data.json immediately
        data.system.ehajCode = code;
        fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));

        // Save to firebase
        const config = {
          headers: { Authorization: `Bearer ${data.info.accessToken}` },
        };
        let url = `${data.info.databaseURL}/${
          data.system.path || "protected/profile/"
        }.json`;
        try {
          await axios.patch(
            url,
            {
              ehajCode: code,
            },
            config
          );
        } catch (err) {
          console.log(err);
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
        await util.commit(page, [{
          selector: "#code",
          value: () => token,
        }], passenger)
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
      const tokenValue = await page.$eval("#tokenValue", (el) => el.value);
      if (tokenValue) {
        return;
      }
      await page.waitForSelector("#secretKey");
      const secretCode = await page.$eval("#secretKey", (el) => el.value);
      const token = totp(secretCode);
      await page.type("#tokenValue", token);
      await page.click("#verifyGAuthToken > div > div.col-lg-4 > a");
      // Save to firebase
      const config = {
        headers: { Authorization: `Bearer ${data.info.accessToken}` },
      };
      let url = `${data.info.databaseURL}/${
        data.system.path || "protected/profile/"
      }.json`;
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
    case "dashboard":
      // await page.goto(
      //   "https://ehaj.haj.gov.sa/EH/pages/hajMission/lookup/hajData/AddMrz.xhtml"
      // );
      break;
    case "list-pilgrims":
    case "list-pilgrims-mission":
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
              missing = missing.filter(
                (t) => t.passportNumber !== passportNumber
              );
              if (!ehajNumbers.find((p) => p === ehajNumber)) {
                ehajNumbers.push(ehajNumber);
              }
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
                  // console.log(err);
                }
              }
              fs.writeFileSync(
                passportNumber + ".txt",
                JSON.stringify({
                  ehajNumber,
                  mofaNumber,
                  passportNumber,
                  status,
                })
              );
            }

            console.table(missing);
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
      break;
    case "add-mission-pilgrim":
    case "add-company-pilgrim":
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
      const isConfirmationSpan = await page.$(
        "#stepItemsMSGs > div > div > div > ul > li > span"
      );
      if (isConfirmationSpan) {
        const confirmationMessage = await page.$eval(
          "#stepItemsMSGs > div > div > div > ul > li > span",
          (el) => el.innerText
        );
        fs.appendFileSync(getLogFile(), confirmationMessage + "\n");
      }

      await page.emulateVisionDeficiency("none");
      await util.controller(page, currentConfig, data.travellers);
      if (
        fs.existsSync("./loop.txt") &&
        fs.existsSync("./selectedTraveller.txt")
      ) {
        const selectedPassenger = fs.readFileSync(
          "./selectedTraveller.txt",
          "utf8"
        );
        const data = fs.readFileSync("./data.json", "utf-8");
        var passengersData = JSON.parse(data);
        if (
          passengersData.travellers.length >
          parseInt(selectedPassenger) + 1
        ) {
          fs.writeFileSync(
            "selectedTraveller.txt",
            (parseInt(selectedPassenger) + 1).toString()
          );
          await sendPassenger(parseInt(selectedPassenger) + 1);
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
      await page.select("#vaccineType", "1");
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

      await page.emulateVisionDeficiency("blurredVision");
      passports.push(passenger.passportNumber);
      await util.commander(page, {
        controller: {
          selector: pageUrl.includes("hajMission")
            ? "body > div.wrapper > div > div.page-content > div.row > ul > li:nth-child(3)"
            : "body > div.wrapper > div > div.page-content > div.row > ul > li:nth-child(3)",
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
              value: (row) => getPermitIssueDt(row.idIssueDt.dmy),
            },
            {
              selector: "#iqamaExpiryDate",
              value: (row) => getPermitExpireDt(row.idExpireDt.dmy),
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

      await page.select(
        "#vaccineType",
        budgie.get("ehaj_pilgrim_vaccine_type", 1)
      );
      await page.waitForTimeout(100);
      const isFirstDoseRequired = await page.$("#hdcviFirstDoseDate");
      if (isFirstDoseRequired) {
        // await page.type(
        //   "#hdcviFirstDoseDate",
        //   moment().add(-60, "days").format("DD/MM/YYYY")
        //   );

        await page.$eval("#hdcviFirstDoseDate", (el) => {
          el.value = "01/01/2022";
        });
        const vaccine1Input = "#vaccine_attmnt_1_input";
        await page.waitForSelector(vaccine1Input);
        await page.click(vaccine1Input);
        await util.commitFile(vaccine1Input, resizedVaccinePath);
        await page.waitForTimeout(500);
      }

      const isSecondDoseRequired = await page.$("#hdcviSecondDoseDate");
      if (isSecondDoseRequired) {
        await page.type(
          "#hdcviSecondDoseDate",
          moment().add(-30, "days").format("DD/MM/YYYY")
        );
        await page.click("#vaccine_attmnt_2_input");
        await util.commitFile("#vaccine_attmnt_2_input", resizedVaccinePath2);
      }

      await page.waitForTimeout(500);
      await page.click("#attachment_input");
      await util.commitFile("#attachment_input", resizedPhotoPath);
      await page.emulateVisionDeficiency("none");
      await page.waitForTimeout(500);

      if (passports.filter((x) => x == passenger.passportNumber).length > 3) {
        // Stop
      } else {
        if (fs.existsSync("./loop.txt")) {
          const submitButtonSelector =
            "#actionPanel > div > div > input.btn.btn-primary";
          await page.click(submitButtonSelector);
        }
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
        fs.appendFileSync(getLogFile(), reservationId)
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
            "@gmail.com"
        );
      }
    }
    const isFieldVisible = page.$(`#hd\\\:${j}\\\:first_name_la`);
    if (!isFieldVisible) {
      break;
    }
    await page.type(`#hd\\\:${j}\\\:first_name_la`, passenger.name.first);
    await page.type(`#hd\\\:${j}\\\:last_name_la`, passenger.name.last);
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

module.exports = { send };
