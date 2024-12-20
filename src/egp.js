const puppeteer = require("puppeteer-extra");
// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const axios = require("axios");
puppeteer.use(StealthPlugin());
const fs = require("fs");
const path = require("path");
const util = require("./util");
const { getPath } = require("./lib/getPath");
const totp = require("totp-generator");
const kea = require("./lib/kea");
const { PDFDocument, rgb } = require("pdf-lib");

let page;
let data;
let counter = 0;
let passenger;

function getLogFile() {
  const logFolder = path.join(getPath("log"), util.suggestGroupName(data));
  if (!fs.existsSync(logFolder)) {
    fs.mkdirSync(logFolder, { recursive: true });
  }
  const logFile = path.join(logFolder, data.info.caravan + "_ehj.txt");
  return logFile;
}

let startTime;
let autoMode = true;
const config = [
  {
    name: "home",
    url: "https://www.visa2egypt.gov.eg/eVisa/Home",
  },
  {
    name: "login",
    regex: "https://www.visa2egypt.gov.eg/eVisa/SignIn;jsessionid=",
    details: [
      {
        selector:
          "#signin_frm > div > div:nth-child(1) > div > div > div > div:nth-child(1) > div > input",
        value: (row) => row.username,
      },
      {
        selector:
          "#signin_frm > div > div:nth-child(1) > div > div > div > div.form-group.m-b-0.m-t-40.r-m-t-60 > div > input",
        value: (row) => row.password,
      },
    ],
  },

  {
    name: "groups",
    regex: "https://www.visa2egypt.gov.eg/eVisa/Applications?VISTK",
  },
  {
    name: "create-group",
    regex: "https://www.visa2egypt.gov.eg/eVisa/Application\-Details\?VISTK=",
    details: [
      {
        selector:
          "#travelInfo_frm > div.checkout-content-wrap > div > div.box-content > div:nth-child(3) > div:nth-child(2) > div > div > span > input",
        value: (row) => moment().add(1, "day").format("YYYY-MM-DD"),
      },
      {
        selector:
          "#travelInfo_frm > div.checkout-content-wrap > div > div.box-content > div:nth-child(3) > div:nth-child(2) > div > div > span > input",
        value: (row) => moment().add(60, "day").format("YYYY-MM-DD"),
      },
      {
        selector:
          "#travelInfo_frm > div.checkout-content-wrap > div > div.box-content > div:nth-child(2) > div:nth-child(1) > div > select",
        value: () => "1",
      },
      {
        selector:
          "#travelInfo_frm > div.checkout-content-wrap > div > div.box-content > div:nth-child(1) > div:nth-child(3) > div > select",
        value: () => "1",
      },
      {
        selector:
          "#travelInfo_frm > div.checkout-content-wrap > div > div.box-content > div:nth-child(1) > div:nth-child(2) > div > select",
        value: () => "3",
      },
      {
        selector:
          "#travelInfo_frm > div.checkout-content-wrap > div > div.box-content > div:nth-child(2) > div:nth-child(2) > div > select",
        value: (row) => row.nationality.code,
      },
    ],
  },
  {
    name: "passengers",
    regex:
      "https://bsp-nusuk.haj.gov.sa/ExternalAgencies/Groups/EditMuatamerList/",
    details: [
      {
        selector: "#NationalityId",
        value: (row) => row.nationality.telCode,
      },
      {
        selector: "#Gender",
        value: (row) => (row.gender === "Male" ? "1" : "2"),
      },
      {
        selector: "#BirthDate",
        value: (row) => `${row.dob.yyyy}-${row.dob.mm}-${row.dob.dd}`,
      },
      {
        selector: "#FirstNameAr",
        value: (row) =>
          row?.nameArabic?.first?.match(/[a-zA-Z]/)
            ? ""
            : row?.nameArabic?.first,
      },
      {
        selector: "#FamilyNameAr",
        value: (row) =>
          row?.nameArabic?.last?.match(/[a-zA-Z]/) ? "" : row?.nameArabic?.last,
      },
      {
        selector: "#ThirdNameAr",
        value: (row) =>
          row?.nameArabic?.grand?.match(/[a-zA-Z]/)
            ? ""
            : row?.nameArabic?.grand,
      },
      {
        selector: "#SecondNameAr",
        value: (row) =>
          row?.nameArabic?.father?.match(/[a-zA-Z]/)
            ? ""
            : row?.nameArabic?.father,
      },
      {
        selector: "#FirstNameEn",
        value: (row) => row?.name?.first,
      },
      {
        selector: "#FamilyNameEn",
        value: (row) => row?.name?.last,
      },
      {
        selector: "#ThirdNameEn",
        value: (row) => row?.name?.grand,
      },
      {
        selector: "#SecondNameEn",
        value: (row) => row?.name?.father,
      },
      {
        selector: "#BirthCity",
        value: (row) =>
          decodeURI(row.birthPlace?.replace(/,/, " ")) || row.nationality.name,
      },
      {
        selector: "#IssueCity",
        value: (row) => decodeURI(row.placeOfIssue),
      },
      {
        selector: "#PassportIssueDate",
        value: (row) =>
          `${row.passIssueDt.yyyy}-${row.passIssueDt.mm}-${row.passIssueDt.dd}`,
      },
      {
        selector: "#PassportExpiryDate",
        value: (row) =>
          `${row.passExpireDt.yyyy}-${row.passExpireDt.mm}-${row.passExpireDt.dd}`,
      },
      {
        selector: "#MartialStatus",
        value: (row) => "99",
      },
      {
        selector: "#BirthCountry",
        value: (row) => util.getIssuingCountry(row)?.telCode,
      },
      {
        selector: "#IssueCountry",
        value: (row) => util.getIssuingCountry(row)?.telCode,
      },
      {
        selector: "#Job",
        value: (row) => decodeURI(row.profession) || "Employee",
      },
      {
        selector: "#PassportNumber",
        value: (row) => row.passportNumber,
      },
      {
        selector: "#PassportType",
        value: (row) => "1",
      },
      {
        selector: "#MobileCountryKey",
        value: (row) => row.nationality.telCode,
      },
      {
        selector: "#MobileNo",
        value: (row) =>
          row.phone || new Date().valueOf().toString().substring(0, 10),
      },
    ],
  },
  {
    name: "permits-home",
    url: "https://bsp-nusuk.haj.gov.sa/UmrahOperators/Nusuk/",
  },
  {
    name: "permits",
    url: "https://bsp-nusuk.haj.gov.sa/UmrahOperators/Nusuk/SubmitPermit",
  },
  {
    name: "package-info",
    regex:
      "https://bsp-nusuk.haj.gov.sa/ExternalAgencies/Groups/ViewPackage/.*",
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
  switch (currentConfig.name) {
    case "home":
      await page.click(
        "#top-bar > div > div.top-bar-wrap > div > ul > li:nth-child(1) > a"
      );
      break;
    case "login":
      await util.commit(page, currentConfig.details, data.system);
      let captchaCode = await util.SolveIamNotARobot(
        "#g-recaptcha-response",
        "https://www.visa2egypt.gov.eg/eVisa/SignIn",
        "6LevVyMUAAAAAEPfoZhGBRL-dv_nxPQoUBJvb3bV"
      );

      if (!captchaCode) {
        await util.infoMessage(page, "Retry captcha ...");
        captchaCode = await util.SolveIamNotARobot(
          "#g-recaptcha-response",
          "https://www.visa2egypt.gov.eg/eVisa/SignIn",
          "6LevVyMUAAAAAEPfoZhGBRL-dv_nxPQoUBJvb3bV"
        );
      }
      if (!captchaCode) {
        await util.infoMessage(page, "Retry captcha ...");
        captchaCode = await util.SolveIamNotARobot(
          "#g-recaptcha-response",
          "https://www.visa2egypt.gov.eg/eVisa/SignIn",
          "6LevVyMUAAAAAEPfoZhGBRL-dv_nxPQoUBJvb3bV"
        );
      }
      if (!captchaCode) {
        await util.infoMessage(page, "Manual captcha required...");
      }
      if (captchaCode && data.system.username && data.system.password) {
        await page.click("#signin_frm > div > div:nth-child(3) > div > button");
      }
      break;

      case "groups":
      if (!autoMode) return;
      await page.click("#application_frm > div > div.row > div > button");
      return;
      await page.waitFor(5000);
      if (global.submission.targetGroupId) {
        // If a group already created for this submission, go directly to that page
        await page.goto(
          `https://bsp-nusuk.haj.gov.sa/ExternalAgencies/Groups/EditMuatamerList/${global.submission.targetGroupId}`
        );
      } else {
        // await page.click("#qa-create-group");
        await page.goto(
          "https://bsp-nusuk.haj.gov.sa/ExternalAgencies/Groups/CreateGroup"
        );
      }
      break;

      case "create-group":
      if (!autoMode) return;

      await page.waitFor(5000);
      await util.commit(page, currentConfig.details, data);
      await page.$eval(
        "#EmbassyId",
        (e, data) => {
          const options = e.querySelectorAll("option");
          if (options.length === 2) {
            options[1].selected = true;
          } else {
            const embassy = data.system.embassy;
            // Select the option that matches embassy text
            for (let i = 0; i < options.length; i++) {
              const embassyRegex = new RegExp(`^${embassy}$`, "i");
              if (embassyRegex.test(options[i].text)) {
                options[i].selected = true;
                break;
              }
            }
          }
        },
        data
      );
      await page.click("#qa-next");
      //Wait for the #EmbassyId-error div and get the text, otherwise wait for the next page to load
      try {
        await page.waitForSelector("#EmbassyId-error", {
          timeout: 1000,
        });
        const error = await page.$eval(
          "#EmbassyId-error",
          (e) => e.textContent
        );
        console.log(
          `Error creating group: Embassy not specified. Specify an embassy in your settings.`
        );
        // process.exit(1);
      } catch (err) {
        // Do nothing
      }
      try {
        await page.waitForSelector(
          "body > div.swal2-container.swal2-center.swal2-shown > div > div.swal2-actions > button.swal2-confirm.swal2-styled"
        );
        await page.click(
          "body > div.swal2-container.swal2-center.swal2-shown > div > div.swal2-actions > button.swal2-confirm.swal2-styled"
        );
      } catch (e) {
        // Do nothing
      }
      break;
    case "passengers":
      if (!autoMode) return;

      // Add a delay to allow the user to see the list of mutamers added so far
      await page.waitFor(1000);
      // Store group id
      if (!global.submission.targetGroupId) {
        const groupId = page
          .url()
          .match(/EditMuatamerList\/([a-zA-Z0-9\-_]+)/)?.[1];
        if (groupId) {
          global.submission.targetGroupId = groupId;
          kea.updateSubmission({
            targetGroupId: groupId,
          });
        }
      }

      // Parse modal content for success/error
      try {
        const modalContentSelector = "#swal2-content";
        await page.waitForSelector(modalContentSelector, {
          timeout: 1000,
        });
        const modalContent = await page.$eval(
          modalContentSelector,
          (e) => e.textContent
        );
        if (
          modalContent.match(
            /(Mutamer has been added Successfully)|(This Mutamer has been added before)/
          )
        ) {
          util.infoMessage(page, `🧟 passenger ${passenger.slug} saved`);
          kea.updatePassenger(data.system.accountId, passenger.passportNumber, {
            "submissionData.egp.status": "Submitted",
          });
          util.incrementSelectedTraveler();
        } else {
          try {
            // Wait for the error icon to appear
            await page.waitForSelector(
              "body > div.swal2-container.swal2-center.swal2-shown > div > div.swal2-header > div.swal2-icon.swal2-error.swal2-animate-error-icon > span",
              {
                visible: true,
              }
            );

            // this is an error, mark the passenger rejected and move on
            util.infoMessage(page, `🧟 passenger ${passenger.slug} rejected`);
            await kea.updatePassenger(
              data.system.accountId,
              passenger.passportNumber,
              {
                "submissionData.egp.status": "Rejected",
                "submissionData.egp.rejectionReason": modalContent,
              }
            );

            util.incrementSelectedTraveler();
          } catch (e) {
            // Do nothing
          }
        }
      } catch (e) {}

      // Submit passengers
      const selectedTraveler = util.getSelectedTraveler();
      if (selectedTraveler >= data.travellers.length) {
        await page.goto("https://bsp-nusuk.haj.gov.sa/ExternalAgencies/Groups");
        return;
      }
      passenger = data.travellers[selectedTraveler];
      util.infoMessage(page, `🧟 Inputting ${passenger.slug} saved`);
      // Close modal
      try {
        const groupCreatedOkButtonSelector =
          "body > div.swal2-container.swal2-center.swal2-shown > div > div.swal2-actions > button.swal2-confirm.swal2-styled";
        await page.waitForSelector(groupCreatedOkButtonSelector, {
          timeout: 1000,
        });
        await page.click(groupCreatedOkButtonSelector);
      } catch (e) {}
      await page.waitFor(500);
      const addMutamerButtonSelector =
        "#newfrm > div.kt-wizard-v2__content > div.kt-heading.kt-heading--md.d-flex > a";
      await page.waitForSelector(addMutamerButtonSelector);
      await page.click(addMutamerButtonSelector);
      await page.waitForSelector("#PassportPictureUploader", { timeout: 0 });
      const passportPath = path.join(
        util.passportsFolder,
        `${passenger.passportNumber}.jpg`
      );
      await util.downloadImage(passenger.images.passport, passportPath);
      await util.commitFile("#PassportPictureUploader", passportPath);
      // wait until passport number is filled
      // #PassportNumber
      let shouldSimulatePassport = false;
      try {
        await page.waitForFunction(
          (arg) => {
            if (document.querySelector(arg).value.length > 0) {
              return true;
            }
          },
          { timeout: 15000 },
          "#PassportNumber"
        );
      } catch (err) {
        // console.log("Passport number not filled, simulating");
        console.log("Passport number not filled, skipping");
        shouldSimulatePassport = true;
      }

      // await pasteSimulatedPassport(shouldSimulatePassport, passenger);

      await util.commit(page, currentConfig.details, passenger);
      await util.commit(
        page,
        [
          {
            selector: "#Email",
            value: (row) => row.email,
          },
        ],
        data.system
      );
      // select the first option in the select
      await page.$eval("#IssueCity", (e) => {
        const options = e.querySelectorAll("option");
        if (options.length >= 2) {
          options[1].selected = true;
        }
      });

      let resizedPhotoPath = await util.downloadAndResizeImage(
        passenger,
        100,
        150,
        "photo",
        5,
        20
      );

      await util.commitFile("#PersonalPictureUploader", resizedPhotoPath);

      if (passenger.images.vaccine) {
        let vaccinePath = await util.downloadAndResizeImage(
          passenger,
          100,
          150,
          "vaccine",
          5,
          20
        );
        await util.commitFile("#VaccinationPictureUploader", vaccinePath);
      } else {
        await util.commitFile("#VaccinationPictureUploader", resizedPhotoPath);
      }

      // is resident
      if (passenger.nationality.code !== data.system.country.code) {
        await page.type(
          "#IqamaId",
          passenger.idNumber || passenger.passportNumber
        );
        await util.commitFile("#ResidencyPictureUploader", resizedPhotoPath);
      }

      // allow photos to settle in the DOM
      await page.waitFor(1000);
      await page.focus("#PassportNumber");
      await page.click("#PassportNumber");
      await page.waitFor(500);
      await page.click("#qa-add-mutamer-save");
    case "permits":
      if (!autoMode) return;

      await util.commander(page, {
        controller: {
          selector:
            "#kt_form > div > div.kt-portlet__head > div.kt-portlet__head-label > h3",
          title: "Select 20",
          arabicTitle: "اختر 20",
          name: "select20",
          action: async () => {
            const tableSelector = "#DataTables_Table_0";
            const tableRowsSelector = `${tableSelector} > tbody > tr`;
            const tableRowsLength = await page.$eval(tableRowsSelector, (e) => {
              return e.length;
            });
            let loopLength = tableRowsLength < 20 ? tableRowsLength : 20;
            for (let i = 1; i <= loopLength; i++) {
              const checkboxSelector = `${tableRowsSelector}:nth-child(${i}) > td.sorting_1 > label > input[type=checkbox]`;
              await page.$eval(checkboxSelector, (e) => {
                if (e) {
                  e.click();
                }
              });
            }
            // await page.type("#SelectedTimeSlot", moment().add(1, 'day').format("YYYY-MM-DD"))
            // scroll to element #SelectedTimeSlot
            await page.evaluate((selector) => {
              const element = document.querySelector(selector);
              if (element) {
                element.scrollIntoView();
              }
            }, "#SelectedTimeSlot");
            await page.waitFor(500);
            await page.type(
              "#SelectedTimeSlot",
              moment().add(1, "day").format("YYYY-MM-DD")
            );
            await page.waitFor(500);
          },
        },
      });

      await page.select("#NusukPermitType", "11");
      break;
    case "package-info":
      await util.commander(page, {
        controller: {
          selector:
            "#kt_content > div > div > div > div.kt-portlet__head > div.kt-portlet__head-label",
          title: "Download All PDF's",
          arabicTitle: "تحميل جميع ملفات PDF",
          name: "downloadAllPDF",
          alert: `Files will download in the browser context, please wait until all files are downloaded\n
            الملفات ستتم تحميلها في الصفحة, الرجاء الانتظار حتى يتم تحميل جميع الملفات`,
          action: async () => {
            // get the table selector
            const tableSelector =
              "#kt_content > div > div > div > div.kt-portlet__body.px-0 > div:nth-child(1) > div > div > div > div > div.kt-widget__body > table";
            // get the table rows selector
            const tableRowsSelector = `${tableSelector} > tbody > tr`;
            // get the table rows length
            const tableRows = await page.$$(tableRowsSelector);
            const tableRowsLength = tableRows.length;
            // loop through the table rows

            const downloadPromises = [];

            for (let i = 1; i <= tableRowsLength; i++) {
              const anchorTagSelector = `${tableRowsSelector}:nth-child(${i}) > td:nth-child(10) > a`;

              const downloadPromise = page
                .$eval(anchorTagSelector, (e) => {
                  return e.getAttribute("href");
                })
                .then((href) => {
                  const pdfUrl = `https://bsp-nusuk.haj.gov.sa${href}`;
                  return page.evaluate(async (url) => {
                    const response = await fetch(url);
                    const blob = await response.blob();
                    const link = document.createElement("a");
                    link.href = URL.createObjectURL(blob);
                    const fileName = url.split("/").pop();
                    link.download = `${fileName}.pdf`;
                    link.click();
                  }, pdfUrl);
                });

              downloadPromises.push(downloadPromise);
            }

            // Wait for all downloads to complete
            await Promise.all(downloadPromises);

            console.log("PDF downloads initiated in parallel");
            // TODO: Get the first page only and merge all the pages in only one pdf
          },
        },
      });

      break;
    default:
      break;
  }
}

async function pasteSimulatedPassport(shouldSimulatePassport, passenger) {
  if (shouldSimulatePassport) {
    const blankPassportPath = getPath(`${passenger.passportNumber}_mrz.jpg`);
    // Generate simulated passport image using the browser canvas api
    const dataUrl = await page.evaluate((_passenger) => {
      const ele = document.createElement("canvas");
      ele.id = "hajonsoftcanvas";
      ele.style.display = "none";
      document.body.appendChild(ele);
      const canvas = document.getElementById("hajonsoftcanvas");
      canvas.width = 1060;
      canvas.height = 1500;
      const ctx = canvas.getContext("2d");
      // White background
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "black";
      // Font must be 11 to fit in the canvas
      ctx.font =
        "bold 18pt Courier New, Menlo, Verdana, Verdana, Geneva, sans-serif";
      ctx.fillText(
        _passenger.codeline?.replace(/\n/g, "")?.substring(0, 44),
        14,
        canvas.height - 60
      );
      ctx.fillText(
        _passenger.codeline?.replace(/\n/g, "")?.substring(44),
        14,
        canvas.height - 25
      );

      // Photo
      ctx.lineWidth = 1;
      ctx.fillStyle = "hsl(240, 25%, 94%)";
      ctx.fillRect(45, 25, 100, 125);
      // Visible area
      ctx.fillStyle = "hsl(240, 25%, 94%)";
      ctx.fillRect(170, 25, 200, 175);

      // under photo area
      ctx.fillStyle = "hsl(240, 25%, 94%)";
      ctx.fillRect(45, 165, 100, 35);
      return canvas.toDataURL("image/jpeg", 1.0);
    }, passenger);

    // Save dataUrl to file
    const imageData = dataUrl.replace(/^data:image\/\w+;base64,/, "");
    const buf = Buffer.from(imageData, "base64");
    fs.writeFileSync(blankPassportPath, buf);
    await util.commitFile("#PassportPictureUploader", blankPassportPath);
    try {
      await page.waitForFunction(
        (arg) => {
          if (document.querySelector(arg).value.length > 0) {
            return true;
          }
        },
        { timeout: 7000 },
        "#PassportNumber"
      );
    } catch (err) {
      console.log("Error: ", err);
    }
  }
}

module.exports = { send };
