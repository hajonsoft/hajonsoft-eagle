const puppeteer = require("puppeteer-extra");
// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const axios = require("axios");
puppeteer.use(StealthPlugin());
const fs = require("fs");
const moment = require("moment");
const path = require("path");
const util = require("./util");
const { getPath } = require("./lib/getPath");
const totp = require("totp-generator");
const kea = require("./lib/kea");
const { fetchNusukIMAPPDF } = require("./lib/imap");
const sharp = require("sharp");

let page;
let data;
let counter = 0;
let passenger;
let downloadVisaMode = false;
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
    name: "login",
    url: "https://bsp-nusuk.haj.gov.sa/Identity",
    regex: "https://bsp-nusuk.haj.gov.sa/Identity",
    details: [
      {
        selector: "#userName",
        value: (row) => row.username,
      },
      {
        selector: "#password",
        value: (row) => row.password,
      },
    ],
  },
  {
    name: "dashboard",
    regex: "https://bsp-nusuk.haj.gov.sa/ExternalAgencies/Dashboard",
  },
  {
    name: "otp",
    regex: "https://bsp-nusuk.haj.gov.sa/OTP/GoogleAuth",
  },
  {
    name: "groups",
    url: "https://bsp-nusuk.haj.gov.sa/ExternalAgencies/Groups",
  },
  {
    name: "groups",
    url: "https://bsp-nusuk.haj.gov.sa/ExternalAgencies/Groups/",
  },
  {
    name: "create-group",
    url: "https://bsp-nusuk.haj.gov.sa/ExternalAgencies/Groups/CreateGroup",
    details: [
      {
        selector: "#GroupNameEn",
        value: (row) => util.suggestGroupName(row),
      },
    ],
  },
  {
    name: "create-group",
    url: "https://bsp-nusuk.haj.gov.sa/ExternalAgencies/ManageSubAgents/CreateGroup",
    details: [
      {
        selector: "#GroupNameEn",
        value: (row) => util.suggestGroupName(row),
      },
    ],
  },
  {
    name: "passengers",
    regex:
      "https://bsp-nusuk.haj.gov.sa/ExternalAgencies/(ManageSubAgents|Groups)/EditMuatamerList/",
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
        selector: "#ThirdNameAr",
        value: (row) =>
          row?.nameArabic?.grand?.match(/[a-zA-Z]/)
            ? ""
            : row?.nameArabic?.grand,
      },
      {
        selector: "#FamilyNameAr",
        value: (row) =>
          row?.nameArabic?.last?.match(/[a-zA-Z]/) ? "" : row?.nameArabic?.last,
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
  {
    name: "package-info",
    regex:
      "https://bsp-nusuk.haj.gov.sa/ExternalAgencies/ManageSubAgents/ViewPackage/.*",
  },
];

async function downloadVisas() {
  downloadVisaMode = true;
  // TODO: review the english email subject
  for (let i = 0; i < data.travellers.length; i++) {
    if (data.travellers[i].email) {
      await fetchNusukIMAPPDF(
        data.travellers[i].email,
        data.system.adminEmailPassword || "(HajonSoft123)",
        ["التأشيرة الإلكترونية", "Electronic Visa"],
        (err, pdf) =>
          saveVisaPDF(
            err,
            pdf,
            data.travellers[i],
            i === data.travellers.length - 1
          )
      );
    }
  }
}

async function saveVisaPDF(err, pdf, passenger, lastPassenger) {
  if (err) {
    console.log("Error: ", err);
    return;
  }
  if (pdf) {
    await util.pdfToKea(pdf.content, data.system.accountId, passenger);
    if (lastPassenger) {
      setTimeout(async () => {
        console.log("All visas downloaded successfully");
        process.exit(0);
      }, 5000);
    }
  }
}

function canActivateVisaDownloadMode(data) {
  return (
    data?.travellers?.length > 0 &&
    data?.system?.adminEmailPassword &&
    data.travellers.every((t) => t.email)
  );
}

async function send(sendData) {
  data = sendData;
  // if (canActivateVisaDownloadMode(data)) {
  //   console.log("Visa download mode activated. Downloading visas from email.");
  //   await downloadVisas(data);
  //   return;
  // }
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

function getCreateGroupUrl() {
  // return "https://bsp-nusuk.haj.gov.sa/ExternalAgencies/ManageSubAgents/CreateGroup";
  return "https://bsp-nusuk.haj.gov.sa/ExternalAgencies/Groups/CreateGroup";
}

async function pageContentHandler(currentConfig) {
  switch (currentConfig.name) {
    case "login":
      await util.commit(page, currentConfig.details, data.system);
      const viasToDownload = data.travellers.filter((t) => t.email);
      if (viasToDownload.length > 0 && data.system.email.startsWith("@")) {
        await util.commander(page, {
          controller: {
            selector: "#form1 > h1",
            title: `Download ${viasToDownload.length} Visas`,
            arabicTitle: "تحميل التأشيرات",
            name: "downloadVisas",
            action: async () => {
              await downloadVisas();
            },
          },
        });
      }
      const code = await util.commitCaptchaTokenWithSelector(
        page,
        "#img-captcha",
        "#CaptchaCode",
        5
      );
      if (
        code &&
        data.system.username &&
        data.system.password &&
        !downloadVisaMode
      ) {
        await page.click("#kt_login_signin_submit");
      }
      break;
    case "otp":
      const googleToken = totp(data.system.ehajCode);
      console.log("📢[nsk.js:227]: googleToken: ", googleToken);
      await page.type("#OtpValue", googleToken);
      await page.click("#newfrm > button");

      try {
        await page.waitForSelector("#swal2-content", { timeout: 1000 });
        const content = await page.$eval(
          "#swal2-content",
          (el) => el.textContent
        );
        if (content === "Invalid OTP") {
          console.log("Error: Invalid OTP");
          process.exit(1);
        }
      } catch (e) {}
      break;
    case "groups":
      if (!autoMode) return;
      await page.waitForTimeout(5000);

      await page.goto(getCreateGroupUrl());

      break;
    case "dashboard":
      // put a commander at this selector to change the autoModel to false
      if (!autoMode) return;
      await util.commander(page, {
        controller: {
          selector:
            "#kt_content > div > div > div > div.kt-portlet__head > div",
          title: "Stop Auto Mode",
          arabicTitle: "إيقاف الوضع التلقائي",
          name: "autoMode",
          action: async () => {
            autoMode = false;
            await page.reload();
          },
        },
      });

      if (global.headless) {
        await page.goto(getCreateGroupUrl());
      } else {
        await page.waitForTimeout(5000);
        // if the page is still dashboard after 10 seconds, click on groups
        if (autoMode) {
          await page.goto(getCreateGroupUrl());
        }
      }
      break;
    case "create-group":
      if (!autoMode) return;

      await page.waitForTimeout(5000);
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
        // Click to close modal
        await page.waitForSelector(
          "body > div.swal2-container.swal2-center.swal2-shown > div > div.swal2-actions > button.swal2-confirm.swal2-styled"
        );
        await page.click(
          "body > div.swal2-container.swal2-center.swal2-shown > div > div.swal2-actions > button.swal2-confirm.swal2-styled"
        );
        // click add mutamer
        await page.waitForSelector(
          "#newfrm > div.kt-wizard-v2__content > div.kt-heading.kt-heading--md.d-flex > a"
        );
        await page.click(
          "#newfrm > div.kt-wizard-v2__content > div.kt-heading.kt-heading--md.d-flex > a"
        );
      } catch (e) {
        // Do nothing
      }
      break;
    case "passengers":
      await dismissGroupCreated();
      await sendCurrentPassenger();
      break;
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
            await page.waitForTimeout(500);
            await page.type(
              "#SelectedTimeSlot",
              moment().add(1, "day").format("YYYY-MM-DD")
            );
            await page.waitForTimeout(500);
          },
        },
      });

      // await page.select("#NusukPermitType", "11");
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
              const nameSelector = `${tableRowsSelector}:nth-child(${i}) > td:nth-child(1)`;

              const downloadPromise = page
                .evaluate(
                  (selectors) => {
                    const anchor = document.querySelector(selectors[0]);
                    const href = anchor.getAttribute("href");
                    const name = document.querySelector(selectors[1]).innerText;
                    return [href, name];
                  },
                  [anchorTagSelector, nameSelector]
                )
                .then((hrefName) => {
                  return page.evaluate(
                    async (params) => {
                      const fileName = params[1];
                      const label = (document.querySelector(
                        "#kt_content > div > div > div > div.kt-portlet__body.px-0 > div:nth-child(1) > div > div > div > div > div.kt-widget__body > label"
                      ).textContent = `Downloading ${params[2]} insurance files ...`);
                      const url = `https://bsp-nusuk.haj.gov.sa${params[0]}`;

                      const response = await fetch(url);
                      const blob = await response.blob();
                      const link = document.createElement("a");
                      link.href = URL.createObjectURL(blob);
                      label.textContent = `Downloaded ${fileName}`;
                      link.download = `${fileName}_insurance.pdf`;
                      link.click();
                    },
                    [...hrefName, tableRowsLength]
                  );
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

async function pasteSimulatedPassport() {
  const passenger = data.travellers[util.getSelectedTraveler()];
  await util.downloadImage(
    passenger.images.passport,
    getPath(`${passenger.passportNumber}.jpg`)
  );
  const fontName = "OCRB";
  // Text to be added at the bottom
  const textLine1 = passenger.codeline.split("\n")[0];
  const textLine2 = passenger.codeline.split("\n")[1];
  const encodedTextLine1 = textLine1.replace(/</g, "&lt;");
  const encodedTextLine2 = textLine2.replace(/</g, "&lt;");

  const height = 100;
  const mrzImage = `
<svg width="600" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background rectangle -->
  <rect fill="white" x="0" y="0" width="600" height="${height}" />
  <text x="40" y="50" font-family="${fontName}" font-size="16" fill="black">
  ${encodedTextLine1}
  </text>
  <text x="40" y="75" font-family="${fontName}" font-size="16" fill="black">
  ${encodedTextLine2}
  </text>
</svg>
`;

  const passportPathMrz = path.join(
    util.passportsFolder,
    `${passenger.passportNumber}_mrz.png`
  );
  const mrzBuffer = Buffer.from(mrzImage);
  await sharp(getPath(`${passenger.passportNumber}.jpg`))
    .resize(600, 400)
    .grayscale()
    .composite([
      {
        input: mrzBuffer,
        top: 300,
        left: 0,
      },
    ])
    .png()
    .toFile(passportPathMrz);

  await util.commitFile("#PassportPictureUploader", passportPathMrz);
  const isSuccess = await assertPassportImage();
  return isSuccess;
}

function suggestEmail(passenger) {
  if (passenger.email) {
    return passenger.email;
  }

  if (!data.system.email.startsWith("@")) {
    return data.system.email;
  }

  const domain = data.system.email.split("@")[1];
  const friendlyName = `${passenger.name.first}.${passenger.name.last}${moment()
    .unix()
    .toString(36)}`
    .toLowerCase()
    .replace(/ /g, "")
    .padEnd(50 - 1 - domain.length, "x");
  const email = `${friendlyName}@${domain}`;

  return email;
}

async function sendCurrentPassenger() {
  if (!autoMode) return;
  await addMutamerClick();
  const selectedTraveler = util.getSelectedTraveler();
  if (selectedTraveler >= data.travellers.length) {
    await page.goto("https://bsp-nusuk.haj.gov.sa/ExternalAgencies/Groups");
    // #newfrm > div.kt-wizard-v2__content > div.kt-heading.kt-heading--md.d-flex > a
    return;
  }
  passenger = data.travellers[selectedTraveler];
  util.infoMessage(page, `🧟 Inputting ${passenger.slug} saved`);
  let isPassportScanSuccessful = await pastePassportImage(passenger);
  if (!isPassportScanSuccessful) {
    isPassportScanSuccessful = await pasteSimulatedPassport(passenger);
  }
  await pasteRemainingImages(passenger);
  await showCommanders(passenger);
  await commitRemainingFields(passenger);
  await page.waitForTimeout(1000);
  await page.focus("#PassportNumber");
  await page.click("#PassportNumber");
  await page.waitForTimeout(500);

  if (!isPassportScanSuccessful) {
    await page.$eval("#qa-add-mutamer-save", (e) => {
      e.textContent =
        "Save (Be careful Passport number or Last name is not correct)";
    });
    // scroll to this selector
    // #qa-add-mutamer-save
    await page.evaluate((selector) => {
      const element = document.querySelector(selector);
      if (element) {
        element.scrollIntoView();
      }
    }, "#qa-add-mutamer-save");

    openFields();
    await kea.updatePassenger(data.system.accountId, passenger.passportNumber, {
      "submissionData.nsk.status": "Rejected",
      "submissionData.nsk.rejectionReason":
        "Passport number or Last name is not correct",
    });
    util.incrementSelectedTraveler();
    if (global.headless) {
      // Skip the passenger, increment the selected traveler and move on
      await sendCurrentPassenger();
      return;
    }
  } else {
    try {
      await page.waitForSelector("#qa-add-mutamer-save");
      await page.click("#qa-add-mutamer-save");
      recordStatus(passenger);
    } catch (e) {
      // console.log("Error: ", e);
    }
  }
}

async function commitRemainingFields(passenger) {
  const passengersConfig = config.find((c) => c.name === "passengers");

  await util.commit(page, passengersConfig.details, passenger);
  const email = suggestEmail(passenger);
  if (data.system.email.startsWith("@")) {
    await kea.updatePassenger(data.system.accountId, passenger.passportNumber, {
      email: email,
    });
  }
  await util.commit(
    page,
    [
      {
        selector: "#Email",
        value: (row) => email,
      },
    ],
    {}
  );
  // select the first option in the select
  await page.$eval("#IssueCity", (e) => {
    const options = e.querySelectorAll("option");
    if (options.length >= 2) {
      options[1].selected = true;
    }
  });

  await page.$eval(
    "#mutamerForm > div.modal-body > div:nth-child(13) > div:nth-child(1) > label",
    (e, passIssueDt) => {
      e.textContent = `Passport Issue Date (${passIssueDt})`;
    },
    passenger.passIssueDt.dmmmy
  );

  await page.click("#PassportIssueDate");
  await page.waitForTimeout(500);
  await util.commit(
    page,
    [
      {
        selector: "#PassportIssueDate",
        value: (row) =>
          `${row.passIssueDt.yyyy}-${row.passIssueDt.mm}-${row.passIssueDt.dd}`,
      },
    ],
    passenger
  );
}

async function showCommanders() {
  await util.commander(page, {
    controller: {
      selector: "#mutamerForm > div.modal-body > h1",
      title: "Open fields",
      arabicTitle: "فتح الحقول",
      name: "openfields",
      action: async () => {
        // Open name fields for editing
        await openFields();
      },
    },
  });

  // await util.commander(page, {
  //   controller: {
  //     selector: "#mutamerForm > div.modal-body > div:nth-child(3) > h4",
  //     title: "Simulate passport",
  //     arabicTitle: "محاكاة جواز السفر",
  //     name: "simulatePassport",
  //     action: async () => {
  //       // Open name fields for editing
  //       await pasteSimulatedPassport();
  //       await originalPassport();
  //     },
  //   },
  // });
}

async function pasteRemainingImages(passenger) {
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
    try {
      await page.type(
        "#IqamaId",
        passenger.idNumber || passenger.passportNumber
      );
      if (passenger.images.residency) {
        const permitPath = await util.downloadAndResizeImage(
          passenger,
          800,
          400,
          "residency",
          400,
          1024,
          true
        );
        await util.commitFile("#ResidencyPictureUploader", permitPath);
      } else {
        await util.commitFile("#ResidencyPictureUploader", resizedPhotoPath);
      }


      await page.click("#IqamaExpiryDate");
      await page.waitForTimeout(500);
      await util.commit(
        page,
        [
          {
            selector: "#IqamaExpiryDate",
            value: (row) =>
              `${row.idExpireDt.yyyy || row.passExpireDt.yyyy}-${row.idExpireDt.mm || row.passExpireDt.mm}-${row.idExpireDt.dd || row.passExpireDt.dd}`,
          },
        ],
        passenger
      );

      await page.$eval(
        "#dvResidencyExpiryDate > label",
        (e, idExpireDt) => {
          e.textContent = `Residency Expiry Date: => (${idExpireDt})`;
        },
        passenger.idExpireDt.dmmmy
      );

      await page.$eval(
        "#dvResidencyId > label",
        (e, residenceId) => {
          e.textContent = `Residency ID: => (${residenceId})`;
        },
        passenger.idNumber
      );

    } catch (e) {
      console.log("Error: ", e);
    }
  }
}

async function pastePassportImage(passenger, resized = true) {
  await page.waitForSelector("#PassportPictureUploader", { timeout: 0 });
  if (resized) {
    const passportPathResized = await util.downloadAndResizeImage(
      passenger,
      600,
      400,
      "passport",
      400,
      1024,
      true
    );

    await util.commitFile("#PassportPictureUploader", passportPathResized);
  } else {
    const passportPath = path.join(
      util.passportsFolder,
      `${passenger.passportNumber}.jpg`
    );
    await util.downloadImage(passenger.images.passport, passportPath);
    await util.commitFile("#PassportPictureUploader", passportPath);
  }
  await page.waitForTimeout(1000);
  const isSuccess = await assertPassportImage();
  return isSuccess;
}

async function assertPassportImage() {
  try {
    const modalContentSelector =
      "body > div.swal2-container.swal2-center.swal2-shown > div > div.swal2-content";
    await page.waitForSelector(modalContentSelector, {
      timeout: 1000,
    });
    const modalContent = await page.$eval(
      modalContentSelector,
      (e) => e.textContent
    );
    if (
      modalContent.match(
        /(Please upload a valid passport image)|(Please upload a valid passport image)/
      )
    ) {
      // close the modal
      const closeButtonSelector =
        "body > div.swal2-container.swal2-center.swal2-shown > div > div.swal2-actions > button.swal2-confirm.swal2-styled";
      await page.waitForSelector(closeButtonSelector);
      await page.click(closeButtonSelector);
      return false;
    }
  } catch (e) {
    // Do nothing
  }

  try {
    // wait for passport number value to appear in the page
    await page.waitForFunction(
      `document.querySelector("#PassportNumber").value !== ""`
    );

    const passportNumberInPage = await page.$eval(
      "#PassportNumber",
      (e) => e.value
    );
    return (
      passportNumberInPage !== "" &&
      passenger.passportNumber === passportNumberInPage
    );
  } catch (e) {}
  return false;
}

async function addMutamerClick() {
  const addMutamerButtonSelector =
    "#newfrm > div.kt-wizard-v2__content > div.kt-heading.kt-heading--md.d-flex > a";
  await page.waitForSelector(addMutamerButtonSelector);
  await page.click(addMutamerButtonSelector);
  await page.waitForTimeout(1000);
}

async function dismissGroupCreated() {
  try {
    const groupCreatedOkButtonSelector =
      "body > div.swal2-container.swal2-center.swal2-shown > div > div.swal2-actions > button.swal2-confirm.swal2-styled";
    await page.waitForSelector(groupCreatedOkButtonSelector, {
      timeout: 1000,
    });
    await page.click(groupCreatedOkButtonSelector);
  } catch (e) {}

  await page.waitForTimeout(1000);
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
}

async function openFields() {
  const details = [
    {
      selector: "#NationalityId",
    },
    {
      selector: "#Gender",
    },
    {
      selector: "#BirthDate",
    },
    {
      selector: "#FirstNameAr",
    },
    {
      selector: "#FamilyNameAr",
    },
    {
      selector: "#ThirdNameAr",
    },
    {
      selector: "#SecondNameAr",
    },
    {
      selector: "#FirstNameEn",
    },
    {
      selector: "#FamilyNameEn",
    },
    {
      selector: "#ThirdNameEn",
    },
    {
      selector: "#SecondNameEn",
    },
    {
      selector: "#BirthCity",
    },
    {
      selector: "#IssueCity",
    },
    {
      selector: "#PassportIssueDate",
    },
    {
      selector: "#PassportExpiryDate",
    },
    {
      selector: "#MartialStatus",
    },
    {
      selector: "#BirthCountry",
    },
    {
      selector: "#IssueCountry",
    },
    {
      selector: "#Job",
    },
    {
      selector: "#PassportNumber",
    },
    {
      selector: "#PassportType",
    },
    {
      selector: "#MobileCountryKey",
    },
    {
      selector: "#MobileNo",
    },
  ];
  // remove readonly attribute for all details array above
  details.forEach((detail) => {
    page.$eval(detail.selector, (e) => {
      e.removeAttribute("readonly");
    });
  });
}

async function recordStatus(passenger) {
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
      await kea.updatePassenger(
        data.system.accountId,
        passenger.passportNumber,
        {
          "submissionData.nsk.status": "Submitted",
        }
      );
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
            "submissionData.nsk.status": "Rejected",
            "submissionData.nsk.rejectionReason": modalContent,
          }
        );
      } catch (e) {
        // Do nothing
      }
    }
  } catch (e) {}
  util.incrementSelectedTraveler();
}
module.exports = { send };
