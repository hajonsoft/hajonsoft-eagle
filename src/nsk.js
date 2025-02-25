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
const { TOTP } = require("totp-generator");
const kea = require("./lib/kea");
const { fetchNusukIMAPPDF } = require("./lib/imap");
const sharp = require("sharp");
const { nationalities } = require("./data/nationalities");
const { createInsurance } = require("./lib/insurance");

let page;
let data;
let counter = 0;
let passenger;
let downloadVisaMode = false;
let groupCreated = false;
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
const defaultDomain = "https://umrahmasar.nusuk.sa/bsp";
const config = [
  {
    name: "login",
    url: `${defaultDomain}/Identity/Index`,
    regex: `${defaultDomain}/Identity/Index`,
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
    name: "contracts",
    url: `${defaultDomain}/ExternalAgencies/Dashboard/Contracts`,
  },
  {
    name: "dashboard",
    regex: `${defaultDomain}/ExternalAgencies/Dashboard`,
  },
  {
    name: "otp",
    regex: `${defaultDomain}/OTP/GoogleAuth`,
  },
  {
    name: "groups",
    url: `${defaultDomain}/ExternalAgencies/Groups`,
  },
  {
    name: "groups",
    url: `${defaultDomain}/ExternalAgencies/Groups/`,
  },
  {
    name: "create-group",
    url: `${defaultDomain}/ExternalAgencies/Groups/CreateGroup`,
    details: [
      {
        selector: "#GroupNameEn",
        value: (row) => util.suggestGroupName(row),
      },
    ],
  },
  {
    name: "create-group",
    url: `${defaultDomain}/ExternalAgencies/ManageSubAgents/CreateGroup`,
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
      `${defaultDomain}/ExternalAgencies/(ManageSubAgents|Groups)/EditMuatamerList/`,
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
        selector: "#BirthCity",
        value: (row) =>
          decodeURI(row.birthPlace?.replace(/,/, " ")) || row.nationality.name,
      },
      {
        selector: "#IssueCity",
        value: (row) => decodeURI(row.placeOfIssue),
      },
      // {
      //   selector: "#PassportExpiryDate",
      //   value: (row) =>
      //     `${row.passExpireDt.yyyy}-${row.passExpireDt.mm}-${row.passExpireDt.dd}`,
      // },
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
    url: `${defaultDomain}/UmrahOperators/Nusuk/`,
  },
  {
    name: "permits",
    url: `${defaultDomain}/UmrahOperators/Nusuk/SubmitPermit`,
  },
  {
    name: "package-info",
    regex:
      `${defaultDomain}/ExternalAgencies/Groups/ViewPackage/.*`,
  },
  {
    name: "package-info",
    regex:
      `${defaultDomain}/ExternalAgencies/ManageSubAgents/ViewPackage/.*`,
  },
  {
    name: "umrah-operator-create-package",
    regex: `${defaultDomain}/UmrahOperators/Home/CreatePackage`,
  },
  {
    name: "mutamer-list-details",
    regex: "https://umrahmasar.nusuk.sa/bsp/ExternalAgencies/Groups/GetMuatamerListDetails",
  }
];

async function downloadVisas() {
  downloadVisaMode = true;
  // Extract data
  const passengersFromPage = await page.evaluate(() => {
    const rows = document.querySelectorAll('#MuatamerList > tbody > tr');
    let passengers = [];

    rows.forEach((row, index) => {
      const columns = row.querySelectorAll('td');

      if (columns.length >= 6) { // Ensure there are enough columns
        const fullName = columns[3].innerText.trim(); // 4th column (index 3)
        const passportNumber = columns[5].innerText.trim(); // 6th column (index 5)

        passengers.push({ fullName, passportNumber, statusElement: columns[2], index });
      }
    });

    return passengers;
  });
  // TODO: review the english email subject
  for (const passengerFromPage of passengersFromPage) {
    const passengerEmail = `${passengerFromPage.fullName.split(" ")[0].toLowerCase()}.${passengerFromPage.passportNumber}@${data.system.email}`.toLowerCase();
    await fetchNusukIMAPPDF(
      passengerEmail,
      data.system.adminEmailPassword,
      ["التأشيرة الإلكترونية", "Electronic Visa"],
      (err, pdf) =>
        saveVisaPDF(
          err,
          pdf,
          passengerFromPage
        )
    );

  }
}

async function saveVisaPDF(err, pdf, passengerFromPage) {
  if (err) {
    console.log("Error: ", err);
    await page.evaluate(
      (element, err) => {
        element.innerText = er;
      },
      passengerFromPage.statusElement,
      err
    );
    return;
  }
  if (pdf) {
    const paths = await util.pdfToKea(pdf.content, data.system.accountId, passengerFromPage);
    await page.evaluate(
      (statusElementSelector, paths) => {
        if (!paths || !paths.pdfUrl || !paths.pdfFileName) return;
    
        // Find the element again inside the browser context
        const element = document.querySelector(statusElementSelector);
        if (!element) return; // Exit if not found
    
        // Ensure it's a valid HTML element
        if (!(element instanceof HTMLElement)) return;
    
        // Create the first anchor for the PDF URL
        const pdfLink = document.createElement("a");
        pdfLink.href = paths.pdfUrl;
        pdfLink.innerText = "Download PDF";
        pdfLink.target = "_blank"; // Open in a new tab
    
        // Create the second anchor for the file name
        const fileNameLink = document.createElement("a");
        fileNameLink.href = paths.pdfFileName;
        fileNameLink.innerText = paths.pdfFileName;
        fileNameLink.target = "_blank"; // Open in a new tab
    
        // Clear existing content and append the new anchors
        element.innerHTML = "";
        element.appendChild(pdfLink);
        element.appendChild(document.createTextNode(" | ")); // Add a separator
        element.appendChild(fileNameLink);
      },
      `#MuatamerList > tbody > tr:nth-child(${passengerFromPage.index + 1}) > td:nth-child(2)`, // Pass a selector instead of the element itself
      paths
    );
    
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
  // return `${defaultDomain}/ExternalAgencies/ManageSubAgents/CreateGroup`;
  return `${defaultDomain}/ExternalAgencies/Groups/CreateGroup`;
}

async function pageContentHandler(currentConfig) {
  switch (currentConfig.name) {
    case "login":
      await util.commit(page, currentConfig.details, data.system);
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
      if (!data.system.ehajCode) {
        return;
      }
      const googleToken = TOTP.generate(data.system.ehajCode);
      console.log("📢[nsk.js:227]: googleToken: ", googleToken);
      await page.type("#OtpValue", googleToken.otp);
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
      } catch (e) { }
      break;
    case "groups":
      if (!autoMode) return;
      await new Promise((resolve) => setTimeout(resolve, 5000));

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
      try {
        if (global.headless) {
          await page.goto(getCreateGroupUrl());
        } else {
          await new Promise((resolve) => setTimeout(resolve, 5000));
          // if the page is still dashboard after 10 seconds, click on groups
          if (autoMode) {
            await page.goto(getCreateGroupUrl());
          }
        }
      } catch {
      }
      break;
    case "contracts":
      await page.waitForSelector("#ContractsListTable");
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const targetContractId = data.system.contractId;
      // Check if there is only one contract
      // Select all rows in the table
      const rows = await page.$$("#ContractsListTable > tbody > tr");
      let activeRows = [];
      let targetRow = null;
      for (const row of rows) {
        // Get the contract ID from the first column
        const contractId = await row.$eval(
          "td:nth-child(1)",
          (td) => td.textContent.trim()
        );
        // Get the contract status from the fifth column
        const status = await row.$eval("td:nth-child(5)", (td) =>
          td.textContent.trim()
        );
        if (status === "Active") {
          activeRows.push(row);
          if (contractId === targetContractId) {
            targetRow = row;
            break; // Stop searching once the target contract is found
          }
        }
      }
      // Determine which contract to click
      let selectedRow = targetRow || (activeRows.length === 1 ? activeRows[0] : null);
      if (selectedRow) {
        const link = await selectedRow.$("td:nth-child(6) a");
        if (link) {
          await link.click();
          console.log("Navigating to contract details...");
        } else {
          console.log("No link found for the selected contract.");
        }
      } else {
        console.log("No matching contract found.");
      }
      break;
    case "create-group":
      // don't create group twice
      if (groupCreated) {
        return;
      }
      groupCreated = true;
      if (!autoMode) return;

      await new Promise((resolve) => setTimeout(resolve, 5000));
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
            await new Promise((resolve) => setTimeout(resolve, 500));
            await page.type(
              "#SelectedTimeSlot",
              moment().add(1, "day").format("YYYY-MM-DD")
            );
            await new Promise((resolve) => setTimeout(resolve, 500));
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
      //
      await util.commander(page, {
        controller: {
          selector:
            "#kt_content > div > div > div > div.kt-portlet__body.px-0 > div:nth-child(1) > div > div > div > div > div.kt-widget__head > div.kt-widget__info > div.kt-widget__username",
          title: "Create One PDF",
          arabicTitle: "إنشاء ملف PDF واحد",
          name: "createallpdf",
          alert: `One file will be created at ${getPath("")}\n
      سيتم إنشاء ملف واحد بناءً على المعلومات المخزنة `,
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

            const userDetails = [];
            for (let i = 1; i <= tableRowsLength; i++) {
              const nameSelector = `${tableRowsSelector}:nth-child(${i}) > td:nth-child(1)`;
              const nameRaw = await page.$eval(
                nameSelector,
                (e) => e.textContent
              );
              const name = nameRaw?.replace(/  /g, " ");
              const countrySelector = `${tableRowsSelector}:nth-child(${i}) > td:nth-child(2)`;
              const countryRaw = await page.$eval(
                countrySelector,
                (e) => e.textContent
              );
              const country =
                countryRaw?.replace(/^[A-Za-z ]/g, "")?.replace(/\n/g, "") ??
                "";
              const passportNumberSelector = `${tableRowsSelector}:nth-child(${i}) > td:nth-child(3)`;
              const passportNumber = await page.$eval(
                passportNumberSelector,
                (e) => e.textContent
              );
              const policyNumberSelector = `${tableRowsSelector}:nth-child(${i}) > td:nth-child(9)`;
              const policyNumber = await page.$eval(
                policyNumberSelector,
                (e) => e.textContent
              );
              const arabicNationality = nationalities.find(
                (n) => n.name === country
              )?.arabicName;
              const arabicName =
                data.travellers.find((t) => t.passportNumber === passportNumber)
                  ?.nameArabic?.full ?? "";
              userDetails.push({
                name,
                country,
                passportNumber,
                policyNumber,
                arabicName,
                arabicNationality,
              });
            }

            const resultFileName = getPath(
              userDetails[0].name.replace(/\s/g, "_") + "_insurance.pdf"
            );
            await createInsurance(userDetails, resultFileName);
            // todo , create an a link to open the file in the browser at this selector location
            // #kt_content > div > div > div > div.kt-portlet__body.px-0 > div:nth-child(1) > div > div > div > div > div.kt-widget__head > div.kt-widget__info > div.kt-widget__subhead.mt-2 > div:nth-child(1)
            await page.evaluate((resultFileName) => {
              const label = (document.querySelector(
                "#kt_content > div > div > div > div.kt-portlet__body.px-0 > div:nth-child(1) > div > div > div > div > div.kt-widget__head > div.kt-widget__info > div.kt-widget__subhead.mt-2 > div:nth-child(1)"
              ).textContent = `Downloaded ${resultFileName}`);
              const link = document.createElement("a");
              link.href = resultFileName;
              link.download = resultFileName;
              link.click();
            }, resultFileName);
            // open the PDF file so the user can see it
            const pdfBuffer = fs.readFileSync(resultFileName);
            const pdfDataUri = `data:application/pdf;base64,${pdfBuffer.toString(
              "base64"
            )}`;
            await page.goto(pdfDataUri, {
              waitUntil: "networkidle0", // Wait for network activity to be idle
            });
          },
        },
      });

      break;
    case "umrah-operator-create-package":
      page
        .waitForSelector(
          "#kt_form > div:nth-child(8) > div.kt-form__section.kt-form__section--first > div > div > div > div.form-group > div > label:nth-child(1) > input[type=radio]", { visible: true }
        )
        .then(() =>
          page.evaluate(() => {
            const radio = document.querySelector(
              "#kt_form > div:nth-child(8) > div.kt-form__section.kt-form__section--first > div > div > div > div.form-group > div > label:nth-child(1) > input[type=radio]"
            );
            if (radio) {
              radio.checked = true;
            }
          })
        )
        // .then(() =>
        //   page.click(
        //     "#kt_form > div.kt-form__actions > button.btn.btn-brand.btn-md.btn-tall.btn-wide.kt-font-bold.kt-font-transform-u.js-next-btn"
        //   )
        // )
        .catch((err) => console.error(err));

      const date = new Date();
      const checkInDate = new Date(date.setDate(date.getDate() + 3))
        .toISOString()
        .split("T")[0];
      const checkOutDate = new Date(date.setDate(date.getDate() + 7))
        .toISOString()
        .split("T")[0];

      page
        .waitForSelector("#BRN", { visible: true })
        .then(() => page.type("#BRN", "123"))
        .then(() => page.waitForSelector("#None_GDS_NoOfRooms"))
        .then(() => page.type("#None_GDS_NoOfRooms", "4"))
        .then(() => page.waitForSelector("#None_GDS_Hotel_Makkah"))
        .then(() => page.select("#None_GDS_Hotel_Makkah", "1"))
        .then(() => page.waitForSelector("#None_GDS_PurchasingPrice"))
        .then(() => page.type("#None_GDS_PurchasingPrice", "1"))
        .then(() => page.waitForSelector("#None_GDS_CheckIn"))
        .then(() => page.type("#None_GDS_CheckIn", checkInDate))
        .then(() => page.waitForSelector("#None_GDS_CheckOut"))
        .then(() => page.type("#None_GDS_CheckOut", checkOutDate))
        // .then(() =>
        //   page.click(
        //     "#kt_form > div.kt-form__actions > button.btn.btn-brand.btn-md.btn-tall.btn-wide.kt-font-bold.kt-font-transform-u.js-next-btn"
        //   )
        // )
        .catch((err) => console.error(err));

      page
        .waitForSelector("#None_GDS_Transportation_BRN", { visible: true })
        .then(() => page.type("#None_GDS_Transportation_BRN", "1234"))
        .then(() => page.waitForSelector("#None_GDS_Transportation_Date"))
        .then(() => page.type("#None_GDS_Transportation_Date", checkInDate))
        .then(() => page.waitForSelector("#None_GDS_Transportation_Company"))
        .then(() => page.select("#None_GDS_Transportation_Company", "1"))
        .then(() => page.waitForSelector("#None_GDS_TransPurchasingPrice"))
        .then(() => page.type("#None_GDS_TransPurchasingPrice", "1"))
        .catch((err) => console.error(err));

      page
        .waitForSelector("#Search_ArrivalFlightNo", { visible: true })
        .then(() => page.type("#Search_ArrivalFlightNo", "173"))
        .then(() =>
          page.click(
            "#kt_form > div:nth-child(11) > div.kt-form__section.kt-form__section--first > div > div > div:nth-child(2) > div:nth-child(3) > div > button"
          )
        )
        .catch((err) => console.error(err));

      break;
    case "mutamer-list-details":
      if (data.system.email.includes("@")) {
        return;
      }
      await util.commander(page, {
        controller: {
          selector: "#kt_content > div > div > div.kt-portlet__head > div.kt-portlet__head-label > h3",
          title: "download visas",
          arabicTitle: "تحميل التأشيرات",
          name: "downloadvisasfromlist",
          action: async () => {
            await downloadVisas();
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

async function pasteOriginalPassport() {
  const passenger = data.travellers[util.getSelectedTraveler()];
  const passportOriginalPath = getPath(
    `${passenger.passportNumber}_original.jpg`
  );
  await util.downloadImage(passenger.images.passport, passportOriginalPath);

  await util.commitFile("#PassportPictureUploader", passportOriginalPath);
  const isSuccess = await assertPassportImage();
  return isSuccess;
}

async function suggestEmail(passenger) {
  if (passenger.email) {
    return passenger.email;
  }

  if (data.system.email.includes("@")) {
    await kea.updatePassenger(data.system.accountId, passenger.passportNumber, {
      email: data.system.email,
    });
    return data.system.email;
  }

  const domain = data.system.email;
  const friendlyName = `${passenger.name.first}.${passenger.passportNumber}@${domain}`
    .toLowerCase()
    .replace(/ /g, "");
  const email = friendlyName;
  await kea.updatePassenger(data.system.accountId, passenger.passportNumber, {
    email,
  });
  return email;
}

async function sendCurrentPassenger() {
  if (!autoMode) return;
  await addMutamerClick();
  const selectedTraveler = util.getSelectedTraveler();
  if (selectedTraveler >= data.travellers.length) {
    await page.goto(`${defaultDomain}/ExternalAgencies/Groups`);
    // #newfrm > div.kt-wizard-v2__content > div.kt-heading.kt-heading--md.d-flex > a
    return;
  }
  passenger = data.travellers[selectedTraveler];
  // #mutamerForm > div.modal-body > div:nth-child(2) > h4
  await page.waitForSelector("#mutamerForm > div.modal-body > div:nth-child(2) > h4");
  await page.$eval(
    "#mutamerForm > div.modal-body > div:nth-child(2) > h4",
    (e, params) => {
      e.innerText = `Add Mutamer ${parseInt(params[0]) + 1} of ${params[1]} - ${params[2].slug
        }`;
    },
    [selectedTraveler, data.travellers.length, passenger]
  );
  util.infoMessage(page, `🧟 Inputting ${passenger.slug} saved`);
  // let isPassportScanSuccessful = await pastePassportImage(passenger);
  let isPassportScanSuccessful = false;
  if (!isPassportScanSuccessful) {
    isPassportScanSuccessful = await pasteSimulatedPassport();
  }
  if (!isPassportScanSuccessful) {
    isPassportScanSuccessful = await pasteOriginalPassport();
  }
  await pasteRemainingImages(passenger);
  await showCommanders(passenger);
  await commitRemainingFields(passenger);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  await page.focus("#PassportNumber");
  await page.click("#PassportNumber");
  await new Promise((resolve) => setTimeout(resolve, 500));

  if (!isPassportScanSuccessful) {
    await page.$eval("#qa-add-mutamer-save", (e) => {
      e.textContent =
        "Save (Be careful Passport number or Last name is not correct) - download OCRB font from https://fontsgeek.com/fonts/OCRB-Medium";
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
    const code = await util.commitCaptchaTokenWithSelector(
      page,
      "#img-captcha",
      "#CaptchaCode",
      5
    );
    try {
      if (code) {
        await page.waitForSelector("#qa-add-mutamer-save");
        await page.click("#qa-add-mutamer-save");
        await recordStatus(passenger);
      }
    } catch (e) {
      // console.log("Error: ", e);
    }
  }
}

async function commitRemainingFields(passenger) {
  const passengersConfig = config.find((c) => c.name === "passengers");

  await util.commit(page, passengersConfig.details, passenger);
  const email = await suggestEmail(passenger);
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

  await page.$eval(
    "#mutamerForm > div.modal-body > div:nth-child(12) > div:nth-child(1) > label",
    (e, passIssueDt) => {
      e.textContent = `Passport Issue Date (${passIssueDt})`;
    },
    passenger.passIssueDt.dmmmy
  );

  await page.click("#PassportIssueDate");
  await new Promise((resolve) => setTimeout(resolve, 500));
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

  // read the last name from the page, then subtract this from the passenger name then computer the first, second and third name
  const lastName = await page.$eval("#FamilyNameEn", (e) => e.value);
  // here are the first, second and third names
  const fullName = passenger.name.full;
  // remove the last name from the full name from its tail using regex
  const firstSecondThird = fullName
    .replace(new RegExp(`\\s+${lastName}.*?$`), "")
    .trim();
  let first = "";
  let second = "";
  let third = "";
  const firstSecondThirdArray = firstSecondThird.split(" ");
  if (firstSecondThirdArray.length === 1) {
    first = firstSecondThirdArray[0];
  } else if (firstSecondThirdArray.length === 2) {
    first = firstSecondThirdArray[0];
    second = firstSecondThirdArray[1];
  } else if (firstSecondThirdArray.length === 3) {
    first = firstSecondThirdArray[0];
    second = firstSecondThirdArray[1];
    third = firstSecondThirdArray[2];
  } else {
    first = firstSecondThirdArray[0];
    second = firstSecondThirdArray[1];
    third = firstSecondThirdArray.slice(2).join(" ");
  }
  await util.commit(
    page,
    [
      {
        selector: "#FirstNameEn",
        value: () => first,
      },
      {
        selector: "#SecondNameEn",
        value: () => second,
      },
      {
        selector: "#ThirdNameEn",
        value: () => third,
      },
    ],
    {}
  );
}

async function showCommanders() {
  // await util.commander(page, {
  //   controller: {
  //     selector: "#mutamerForm > div.modal-body > h1",
  //     title: "Open fields",
  //     arabicTitle: "فتح الحقول",
  //     name: "openfields",
  //     action: async () => {
  //       // Open name fields for editing
  //       await openFields();
  //     },
  //   },
  // });

  // await util.commander(page, {
  //   controller: {
  //     selector: "#qa-add-mutamer-close",
  //     title: "Close",
  //     arabicTitle: "أغلق",
  //     name: "close",
  //     keepOriginalElement: true,
  //     action: async () => {
  //       // Close the modal
  //       await page.click("#qa-add-mutamer-close");
  //       // mark traveller rejected
  //       kea.updatePassenger(data.system.accountId, passenger.passportNumber, {
  //         "submissionData.nsk.status": "Rejected",
  //         "submissionData.nsk.rejectionReason": "Manual close",
  //       });
  //       // Increment the selected traveler
  //       util.incrementSelectedTraveler();
  //       // Send the next passenger
  //       await sendCurrentPassenger();
  //     },
  //   },
  // });

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
    await new Promise((resolve) => setTimeout(resolve, 500));
    await util.commit(
      page,
      [
        {
          selector: "#IqamaExpiryDate",
          value: (row) =>
            `${row.idExpireDt.yyyy || row.passExpireDt.yyyy}-${row.idExpireDt.mm || row.passExpireDt.mm
            }-${row.idExpireDt.dd || row.passExpireDt.dd}`,
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
    // console.log("Error: ", e);
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
  await new Promise((resolve) => setTimeout(resolve, 1000));
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
  } catch (e) { }
  return false;
}

async function addMutamerClick() {
  const addMutamerButtonSelector =
    "#newfrm > div.kt-wizard-v2__content > div.kt-heading.kt-heading--md.d-flex > a";
  await page.waitForSelector(addMutamerButtonSelector);
  await page.click(addMutamerButtonSelector);
  await new Promise((resolve) => setTimeout(resolve, 1000));
}

async function dismissGroupCreated() {
  try {
    const groupCreatedOkButtonSelector =
      "body > div.swal2-container.swal2-center.swal2-shown > div > div.swal2-actions > button.swal2-confirm.swal2-styled";
    await page.waitForSelector(groupCreatedOkButtonSelector, {
      timeout: 1000,
    });
    await page.click(groupCreatedOkButtonSelector);
  } catch (e) { }

  await new Promise((resolve) => setTimeout(resolve, 1000));
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
      timeout: 5000,
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
        console.log("Status was not saved: ", e);
      }
    }
  } catch (e) {
    console.log("Status was not saved: ", e);
  }
  util.incrementSelectedTraveler();
}
module.exports = { send };
