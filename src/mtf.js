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
const { default: axios } = require("axios");

let page;
let data;
let counter = 0;
let ticketNumber;

const mtfNationalities = [
  { mtfCode: "AF-93", code: "AFG" },
  { mtfCode: "AL-355", code: "ALB" },
  { mtfCode: "DZ-213", code: "DZA" },
  { mtfCode: "AS-684", code: "ASM" },
  { mtfCode: "AD-376", code: "AND" },
  { mtfCode: "AO-244", code: "AGO" },
  { mtfCode: "AI-2641", code: "AIA" },
  { mtfCode: "AQ-6721", code: "ATA" },
  { mtfCode: "AG-2681", code: "ATG" },
  { mtfCode: "AR-54", code: "ARG" },
  { mtfCode: "AM-374", code: "ARM" },
  { mtfCode: "AW-297", code: "ABW" },
  { mtfCode: "AU-61", code: "AUS" },
  { mtfCode: "AT-43", code: "AUT" },
  { mtfCode: "AZ-994", code: "AZE" },
  { mtfCode: "BS-1242", code: "BHS" },
  { mtfCode: "BD-880", code: "BGD" },
  { mtfCode: "BB-1246", code: "BRB" },
  { mtfCode: "BY-375", code: "BLR" },
  { mtfCode: "BE-32", code: "BEL" },
  { mtfCode: "BZ-501", code: "BLZ" },
  { mtfCode: "BJ-229", code: "BEN" },
  { mtfCode: "BM-441", code: "BMU" },
  { mtfCode: "BT-975", code: "BTN" },
  { mtfCode: "BO-591", code: "BOL" },
  { mtfCode: "BA-387", code: "BIH" },
  { mtfCode: "BW-267", code: "BWA" },
  { mtfCode: "BR-55", code: "BRA" },
  { mtfCode: "VG-284", code: "VGB" },
  { mtfCode: "BN-673", code: "BRN" },
  { mtfCode: "BG-359", code: "BGR" },
  { mtfCode: "BF-226", code: "BFA" },
  { mtfCode: "BI-257", code: "BDI" },
  { mtfCode: "KH-855", code: "KHM" },
  { mtfCode: "CM-237", code: "CMR" },
  { mtfCode: "CA-1112", code: "CAN" },
  { mtfCode: "CV-238", code: "CPV" },
  { mtfCode: "KY-345", code: "CYM" },
  { mtfCode: "CF-236", code: "CAF" },
  { mtfCode: "TD-235", code: "TCD" },
  { mtfCode: "CL-56", code: "CHL" },
  { mtfCode: "CN-86", code: "CHN" },
  { mtfCode: "CX-1061", code: "CXR" },
  { mtfCode: "CC-2061", code: "CCK" },
  { mtfCode: "CO-57", code: "COL" },
  { mtfCode: "KM-2691", code: "COM" },
  { mtfCode: "CG-242", code: "COG" },
  { mtfCode: "CD-243", code: "COD" },
  { mtfCode: "CK-682", code: "COK" },
  { mtfCode: "CR-506", code: "CRI" },
  { mtfCode: "HR-385", code: "HRV" },
  { mtfCode: "CU-53", code: "CUB" },
  { mtfCode: "CY-357", code: "CYP" },
  { mtfCode: "CZ-420", code: "CZE" },
  { mtfCode: "CZ-9807", code: "CZE" },
  { mtfCode: "DK-45", code: "DNK" },
  { mtfCode: "DJ-253", code: "DJI" },
  { mtfCode: "DM-767", code: "DMA" },
  { mtfCode: "DO-809", code: "DOM" },
  { mtfCode: "EC-593", code: "ECU" },
  { mtfCode: "EG-20", code: "EGY" },
  { mtfCode: "GQ-240", code: "GNQ" },
  { mtfCode: "ER-291", code: "ERI" },
  { mtfCode: "EE-372", code: "EST" },
  { mtfCode: "ET-251", code: "ETH" },
  { mtfCode: "FO-298", code: "FRO" },
  { mtfCode: "FK-500", code: "FLK" },
  { mtfCode: "FJ-679", code: "FJI" },
  { mtfCode: "FI-358", code: "FIN" },
  { mtfCode: "FR-33", code: "FRA" },
  { mtfCode: "GF-594", code: "GUF" },
  { mtfCode: "PF-689", code: "PYF" },
  { mtfCode: "GA-241", code: "GAB" },
  { mtfCode: "GM-220", code: "GMB" },
  { mtfCode: "GE-995", code: "GEO" },
  { mtfCode: "DE-49", code: "DEU" },
  { mtfCode: "GH-233", code: "GHA" },
  { mtfCode: "GI-350", code: "GIB" },
  { mtfCode: "GR-30", code: "GRC" },
  { mtfCode: "GL-299", code: "GRL" },
  { mtfCode: "GD-473", code: "GRD" },
  { mtfCode: "GP-590", code: "GLP" },
  { mtfCode: "GU-671", code: "GUM" },
  { mtfCode: "GT-502", code: "GTM" },
  { mtfCode: "GN-224", code: "GIN" },
  { mtfCode: "GW-245", code: "GNB" },
  { mtfCode: "GY-592", code: "GUY" },
  { mtfCode: "HT-509", code: "HTI" },
  { mtfCode: "HN-504", code: "HND" },
  { mtfCode: "HU-36", code: "HUN" },
  { mtfCode: "IS-354", code: "ISL" },
  { mtfCode: "IN-91", code: "IND" },
  { mtfCode: "ID-62", code: "IDN" },
  { mtfCode: "IR-98", code: "IRN" },
  { mtfCode: "IQ-964", code: "IRQ" },
  { mtfCode: "IE-353", code: "IRL" },
  { mtfCode: "IT-39", code: "ITA" },
  { mtfCode: "CI-225", code: "CIV" },
  { mtfCode: "JM-876", code: "JAM" },
  { mtfCode: "JP-81", code: "JPN" },
  { mtfCode: "JO-962", code: "JOR" },
  { mtfCode: "KZ-7001", code: "KAZ" },
  { mtfCode: "KE-254", code: "KEN" },
  { mtfCode: "KI-686", code: "KIR" },
  { mtfCode: "XK-550", code: "KOS" },
  { mtfCode: "KG-996", code: "KGZ" },
  { mtfCode: "LA-856", code: "LAO" },
  { mtfCode: "LV-371", code: "LVA" },
  { mtfCode: "LB-961", code: "LBN" },
  { mtfCode: "LS-266", code: "LSO" },
  { mtfCode: "LR-231", code: "LBR" },
  { mtfCode: "LY-218", code: "LBY" },
  { mtfCode: "LI-423", code: "LIE" },
  { mtfCode: "LT-370", code: "LTU" },
  { mtfCode: "LU-352", code: "LUX" },
  { mtfCode: "MO-853", code: "MAC" },
  { mtfCode: "MK-389", code: "MKD" },
  { mtfCode: "TN-9800", code: "TUN" },
  { mtfCode: "MG-261", code: "MDG" },
  { mtfCode: "MW-265", code: "MWI" },
  { mtfCode: "MY-60", code: "MYS" },
  { mtfCode: "MV-960", code: "MDV" },
  { mtfCode: "ML-223", code: "MLI" },
  { mtfCode: "MT-356", code: "MLT" },
  { mtfCode: "MH-692", code: "MHL" },
  { mtfCode: "MQ-5962", code: "MTQ" },
  { mtfCode: "MR-222", code: "MRT" },
  { mtfCode: "MU-230", code: "MUS" },
  { mtfCode: "YT-2692", code: "MYT" },
  { mtfCode: "YE-9802", code: "YEM" },
  { mtfCode: "MX-52", code: "MEX" },
  { mtfCode: "FM-691", code: "FSM" },
  { mtfCode: "MD-373", code: "MDA" },
  { mtfCode: "MC-377", code: "MCO" },
  { mtfCode: "MN-976", code: "MNG" },
  { mtfCode: "-9806", code: "MNE" },
  { mtfCode: "MS-664", code: "MSR" },
  { mtfCode: "MA-212", code: "MAR" },
  { mtfCode: "MZ-258", code: "MOZ" },
  { mtfCode: "MM-95", code: "MMR" },
  { mtfCode: "NA-2642", code: "NAM" },
  { mtfCode: "NR-674", code: "NRU" },
  { mtfCode: "NP-977", code: "NPL" },
  { mtfCode: "NL-31", code: "NLD" },
  { mtfCode: "NC-687", code: "NCL" },
  { mtfCode: "NZ-64", code: "NZL" },
  { mtfCode: "NI-505", code: "NIC" },
  { mtfCode: "NE-227", code: "NER" },
  { mtfCode: "NG-234", code: "NGA" },
  { mtfCode: "NU-683", code: "NIU" },
  { mtfCode: "BH-9731", code: "BHR" },
  { mtfCode: "KW-9651", code: "KWT" },
  { mtfCode: "OM-9681", code: "OMN" },
  { mtfCode: "QA-9741", code: "QAT" },
  { mtfCode: "AE-9711", code: "ARE" },
  { mtfCode: "NF-6722", code: "NFK" },
  { mtfCode: "KP-850", code: "PRK" },
  { mtfCode: "MP-6702", code: "MNP" },
  { mtfCode: "NO-47", code: "NOR" },
  { mtfCode: "PK-92", code: "PAK" },
  { mtfCode: "PW-680", code: "PLW" },
  { mtfCode: "PS-9812", code: "PSE" },
  { mtfCode: "PS-9810", code: "PSE" },
  { mtfCode: "PS-9811", code: "PSE" },
  { mtfCode: "PS-9804", code: "PSE" },
  { mtfCode: "PS-9803", code: "PSE" },
  { mtfCode: "PA-507", code: "PAN" },
  { mtfCode: "PG-675", code: "PNG" },
  { mtfCode: "PY-595", code: "PRY" },
  { mtfCode: "PE-51", code: "PER" },
  { mtfCode: "PH-63", code: "PHL" },
  { mtfCode: "PS-970", code: "PSE" },
  { mtfCode: "PL-48", code: "POL" },
  { mtfCode: "BH-9805", code: "BHR" },
  { mtfCode: "PT-351", code: "PRT" },
  { mtfCode: "PR-1787", code: "PRI" },
  { mtfCode: "RO-40", code: "ROU" },
  { mtfCode: "RU-7002", code: "RUS" },
  { mtfCode: "RW-250", code: "RWA" },
  { mtfCode: "RE-262", code: "REU" },
  { mtfCode: "ST-239", code: "STP" },
  { mtfCode: "KN-9809", code: "KNA" },
  { mtfCode: "SV-503", code: "SLV" },
  { mtfCode: "SM-378", code: "SMR" },
  { mtfCode: "SN-221", code: "SEN" },
  { mtfCode: "-9801", code: "SRB" },
  { mtfCode: "SC-248", code: "SYC" },
  { mtfCode: "SL-232", code: "SLE" },
  { mtfCode: "SG-65", code: "SGP" },
  { mtfCode: "SK-421", code: "SVK" },
  { mtfCode: "SI-386", code: "SVN" },
  { mtfCode: "SB-677", code: "SLB" },
  { mtfCode: "SO-252", code: "SOM" },
  { mtfCode: "ZA-27", code: "ZAF" },
  { mtfCode: "KR-82", code: "KOR" },
  { mtfCode: "SS-211", code: "SSD" },
  { mtfCode: "ES-34", code: "ESP" },
  { mtfCode: "LK-94", code: "LKA" },
  { mtfCode: "SH-290", code: "SHN" },
  { mtfCode: "LC-758", code: "LCA" },
  { mtfCode: "PM-508", code: "SPM" },
  { mtfCode: "VC-784", code: "VCT" },
  { mtfCode: "SD-249", code: "SDN" },
  { mtfCode: "SR-597", code: "SUR" },
  { mtfCode: "SZ-2683", code: "SWZ" },
  { mtfCode: "SE-46", code: "SWE" },
  { mtfCode: "CH-41", code: "CHE" },
  { mtfCode: "SY-963", code: "SYR" },
  { mtfCode: "TW-886", code: "TWN" },
  { mtfCode: "TJ-992", code: "TJK" },
  { mtfCode: "TZ-2551", code: "TZA" },
  { mtfCode: "TH-66", code: "THA" },
  { mtfCode: "TG-228", code: "TGO" },
  { mtfCode: "TK-690", code: "TKL" },
  { mtfCode: "TO-676", code: "TON" },
  { mtfCode: "TT-868", code: "TTO" },
  { mtfCode: "TN-216", code: "TUN" },
  { mtfCode: "TR-90", code: "TUR" },
  { mtfCode: "TM-993", code: "TKM" },
  { mtfCode: "TC-649", code: "TCA" },
  { mtfCode: "TV-688", code: "TUV" },
  { mtfCode: "UG-256", code: "UGA" },
  { mtfCode: "UA-380", code: "UKR" },
  { mtfCode: "GB-44", code: "GBR" },
  { mtfCode: "US-1", code: "USA" },
  { mtfCode: "UY-598", code: "URY" },
  { mtfCode: "VI-340", code: "VIR" },
  { mtfCode: "UZ-998", code: "UZB" },
  { mtfCode: "VU-678", code: "VUT" },
  { mtfCode: "VA-1039", code: "VAT" },
  { mtfCode: "VE-58", code: "VEN" },
  { mtfCode: "VN-84", code: "VNM" },
  { mtfCode: "WF-681", code: "WLF" },
  { mtfCode: "WS-685", code: "WSM" },
  { mtfCode: "YE-967", code: "YEM" },
  { mtfCode: "YU-3812", code: "YUG" },
  { mtfCode: "ZM-260", code: "ZMB" },
  { mtfCode: "ZW-263", code: "ZWE" },
];

const config = [
  // {
  //   name: "home",
  //   url: "https://www.motawif.com.sa/",
  //   regex: "https://www.motawif.com.sa/home/[a-z]{2}-[a-z]{2}$",
  //   controller: {
  //     selector: "body > header > div > div",
  //     action: async () => {
  //       const selectedTraveler = await page.$eval(
  //         "#hajonsoft_select",
  //         (el) => el.value
  //       );
  //       if (selectedTraveler) {
  //         fs.writeFileSync("./selectedTraveller.txt", selectedTraveler);
  //         await sendPassenger(selectedTraveler);
  //       }
  //     },
  //   },
  // },
  {
    name: "home",
    url: "https://www.motawif.com.sa/",
  },
  {
    name: "list",
    regex:
      "https://(www.)?motawif.com.sa/package/[a-z]{2}-[a-z]{2}/listing.*occupancy=.*countryofresidence",
  },
  {
    name: "reserve-contact",
    regex:
      "https://(www.)?motawif.com.sa/booking/[a-z]{2}-[a-z]{2}/hajj_package/customer.tid=",
    controller: {
      selector:
        "#frmSaveCustomer > div.card.card-custom.gutter-b > div.card-header > h3",
      action: async () => {
        const selectedTraveler = await page.$eval(
          "#hajonsoft_select",
          (el) => el.value
        );
        if (selectedTraveler) {
          fs.writeFileSync("./selectedTraveller.txt", selectedTraveler);
          await sendContactInfo(selectedTraveler);
        }
      },
    },
  },
  {
    name: "pilgrim-profile-information",
    regex:
      "https://www.motawif.com.sa/booking/[a-z]{2}-[a-z]{2}/hajj_package/traveler.transaction=",
    controller: {
      name: "sendPilgrim",
      selector:
        "#kt_tab_pane_2_4 > div > div.card-header.align-items-center > h3",
      action: async () => {
        const selectedTraveler = await page.$eval(
          "#hajonsoft_select",
          (el) => el.value
        );
        if (selectedTraveler) {
          fs.writeFileSync("./selectedTraveller.txt", selectedTraveler);
          await sendPilgrimInformation(selectedTraveler);
        }
      },
    },
  },
];

// async function sendPassenger(selectedTraveler) {
//   const data = fs.readFileSync("./data.json", "utf-8");
//   var passengersData = JSON.parse(data);
//   const passenger = passengersData.travellers[selectedTraveler];
//   await page.type("#FirstName", passenger.name.first);
//   await page.type("#LastName", passenger.name.last);
//   const uniqueNumber = moment().format("9MMDDHHmmss");
//   let newEmail = await email.getNewEmail();
//   await page.type("#Email", "forhajjhajj+" + uniqueNumber + "@gmail.com");
//   await page.type("#PhoneNumber", uniqueNumber);
//   await util.commit(page, [
//     {
//       selector: "#cor",
//       value: () => budgie.get("motawif_country_of_residence", "US"),
//     },
//   ]);
//   //   await page.solveRecaptchas()
//   //   await Promise.all([
//   //     page.waitForNavigation(),
//   //     page.click(`#recaptcha-demo-submit`)
//   //   ])
// }

async function sendContactInfo(selectedTraveler) {
  const data = fs.readFileSync("./data.json", "utf-8");
  var passengersData = JSON.parse(data);
  const passenger = passengersData.travellers[selectedTraveler];
  await page.waitForSelector("#NamePrefix");
  await page.select("#NamePrefix", passenger.gender === "Male" ? "1" : "2");
  await page.type("#GivenName", passenger.name.first);
  await page.type("#SurName", passenger.name.last);
  const uniqueNumber = moment().format("9MMDDHHmmss");
  await page.waitForSelector("#txtPhone");
  await page.type("#txtPhone", uniqueNumber);
  fs.appendFileSync("./emails.txt", uniqueNumber.toString() + "\n");
  await page.waitForSelector("#txtEmail");
  let newEmail = "forhajjhajj+" + uniqueNumber + "@gmail.com"; // await email.getNewEmail();
  fs.appendFileSync("./emails.txt", newEmail + "\n");
  await page.type("#txtEmail", newEmail);
  await page.click("#send_otp_btn");
  await page.waitForTimeout(2000);
  const code = await email.readCode();
  console.log(code);
}
async function sendPilgrimInformation(selectedTraveler) {
  const data = fs.readFileSync("./data.json", "utf-8");
  var passengersData = JSON.parse(data);
  const passenger = passengersData.travellers[selectedTraveler];

  const wizardSteps = await page.$(
    "#kt_wizard_v2 > div.wizard-nav.border-right.py-8.px-8 > div"
  );
  const steps = await wizardSteps.$$eval("div", (divs) =>
    divs.map((d) => {
      if (d.getAttribute("data-wizard-state") === "current") {
        return d.getAttribute("data-wizard-index");
      }
    })
  );

  const pilgrimIndex = steps.filter((f) => f != null)?.[0];
  await util.commit(
    page,
    [
      {
        selector: "#ddlNationality_" + pilgrimIndex,
        value: (row) =>
          mtfNationalities.find((d) => d.code === passenger.nationality.code)
            ?.mtfCode || "US-1",
      },
      {
        selector: "#ddlPassportType_" + pilgrimIndex,
        value: (row) => "1",
      },
      {
        selector: "#ddlGender_" + pilgrimIndex,
        value: (row) => (row.gender === "Male" ? "1" : "2"),
      },
      {
        selector: "#ddlVaccine1_" + pilgrimIndex,
        value: (row) => "4",
      },
      {
        selector: "#txtPassportId_" + pilgrimIndex,
        value: (row) => row.passportNumber,
      },
      {
        selector: "#txtPassportIssuePlace_" + pilgrimIndex,
        value: (row) => row.placeOfIssue,
      },
      {
        selector: "#txtPlaceOfBirth_" + pilgrimIndex,
        value: (row) => row.birthPlace,
      },
      {
        selector: "#txtFirstname_" + pilgrimIndex,
        value: (row) => row.name.first,
      },
      {
        selector: "#txtMiddleName_" + pilgrimIndex,
        value: (row) => row.name.father,
      },
      {
        selector: "#txtSurname_" + pilgrimIndex,
        value: (row) => row.name.last,
      },
      {
        selector: "#txtGrandfatherName_" + pilgrimIndex,
        value: (row) => row.name.last,
      },
    ],
    passenger
  );

  await page.$eval("#passportIssueDate_" + pilgrimIndex, (el) => {
    el.removeAttribute("readonly");
  });
  await page.$eval("#passportExpiry_" + pilgrimIndex, (el) => {
    el.removeAttribute("readonly");
    el.value = "";
  });
  await page.$eval("#birthDate_" + pilgrimIndex, (el) => {
    el.removeAttribute("readonly");
    el.value = "";
  });
  await page.$eval("#vaccine1Date_" + pilgrimIndex, (el) => {
    el.removeAttribute("readonly");
    el.value = "";
  });

  const url = await page.url();

  const isArabic = url.includes("ar-sa");
  if (isArabic) {
    moment.locale("ar_SA");
  }
  await util.commit(
    page,
    [
      {
        selector: "#passportIssueDate_" + pilgrimIndex,
        value: (row) =>
          isArabic
            ? moment(row.passIssueDt.dmy, "DD/MM/YYYY")
                .clone()
                .local("ar-sa")
                .format("MMM DD, YYYY")
            : `${row.passIssueDt.mmm} ${row.passIssueDt.dd}, ${row.passIssueDt.yyyy}`,
      },
      {
        selector: "#birthDate_" + pilgrimIndex,
        value: (row) =>
          isArabic
            ? moment(row.dob.dmy, "DD/MM/YYYY")
                .clone()
                .local("ar-sa")
                .format("MMM DD, YYYY")
            : `${row.dob.mmm} ${row.dob.dd}, ${row.dob.yyyy}`,
      },
      {
        selector: "#passportExpiry_" + pilgrimIndex,
        value: (row) =>
          isArabic
            ? moment(row.passExpireDt.dmy, "DD/MM/YYYY")
                .clone()
                .local("ar-sa")
                .format("MMM DD, YYYY")
            : `${row.passExpireDt.mmm} ${row.passExpireDt.dd}, ${row.passExpireDt.yyyy}`,
      },
      {
        selector: "#vaccine1Date_" + pilgrimIndex,
        value: (row) =>
          isArabic
            ? moment()
                .add(-30, "days")
                .clone()
                .local("ar-sa")
                .format("MMM DD, YYYY")
            : `${moment().add(-30, "days").format("MMM DD, YYYY")}`,
      },
    ],
    passenger
  );

  let resizedPhotoPath = await util.downloadAndResizeImage(
    passenger,
    200,
    200,
    "photo"
  );
  await util.commitFile("#profile_avatar_" + pilgrimIndex, resizedPhotoPath);

  let resizedPassportPath = await util.downloadAndResizeImage(
    passenger,
    400,
    300,
    "passport"
  );
  await util.commitFile("#passportFile_" + pilgrimIndex, resizedPassportPath);

  let resizedVaccinePath = await util.downloadAndResizeImage(
    passenger,
    400,
    300,
    "vaccine"
  );
  await util.commitFile("#vaccine1File_" + pilgrimIndex, resizedVaccinePath);
  // await page.select("#ddlEmbassy", "62a1c7a85e08d7e37dbe33ef")
  await page.click("#isHajjPerfomed_" + pilgrimIndex);
  const isResident = await page.$(
    "#residencyIdentificationNumber_" + pilgrimIndex
  );
  if (isResident) {
    await util.commit(
      page,
      [
        {
          selector: "#residencyIdentificationNumber_" + pilgrimIndex,
          value: (row) => passenger.idNumber || moment().valueOf(),
        },
      ],
      passenger
    );

    await page.$eval("#residencyIdIssueDate_" + pilgrimIndex, (el) => {
      el.removeAttribute("readonly");
      el.value = "";
    });
    let issueDt = moment(passenger.idIssueDt.dmy, "DD/MM/YYYY");
    if (true) {
      // issueDt.isAfter(moment())) {
      issueDt = moment().add(-1, "month");
    }
    await page.type(
      "#residencyIdIssueDate_" + pilgrimIndex,
      `${issueDt.format("MMM DD, YYYY")}`
    );

    await page.$eval("#residencyIdExpiryDate_" + pilgrimIndex, (el) => {
      el.removeAttribute("readonly");
      el.value = "";
    });
    let expireDt = moment(passenger.idExpireDt.dmy, "DD/MM/YYYY");
    if (expireDt.isBefore(moment().add(6, "month"))) {
      expireDt = moment().add(10, "month");
    }
    await page.type(
      "#residencyIdExpiryDate_" + pilgrimIndex,
      isArabic
        ? `${expireDt.format("MMM DD, YYYY")}`
        : `${passenger.idExpireDt.mmm} ${passenger.idExpireDt.dd}, ${passenger.idExpireDt.yyyy}`
    );

    let resizedIdPath = await util.downloadAndResizeImage(
      passenger,
      400,
      300,
      "id"
    );
    await util.commitFile("#residencyProofFile_" + pilgrimIndex, resizedIdPath);
  }

  await page.click(
    "#kt_wizard_v2 > div.wizard-body.py-8.px-8 > div > div > div.d-flex.justify-content-between.align-items-stretch.border-top.mt-5.pt-10 > div:nth-child(3) > button:nth-child(2)"
  );
}

async function setMotawifDate(dateSelector, year, month, day) {
  await page.click(dateSelector);
  const yearSelector =
    "#kt_body > div.daterangepicker.ltr.auto-apply.single.opensright.show-calendar > div.drp-calendar.left.single > div.calendar-table > table > thead > tr:nth-child(1) > th.month > select.yearselect";
  await page.waitForSelector(yearSelector);
  await util.selectByValue(yearSelector, `${year}`);

  const monthSelector =
    "#kt_body > div.daterangepicker.ltr.auto-apply.single.opensright.show-calendar > div.drp-calendar.left.single > div.calendar-table > table > thead > tr:nth-child(1) > th.month > select.monthselect";
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
    // const acceptCookiesButton = await page.$(
    //   "body > div.cky-consent-container.cky-classic-bottom > div.cky-consent-bar > div.cky-notice > div > div.cky-notice-btn-wrapper > button.cky-btn.cky-btn-accept"
    // );
    // if (acceptCookiesButton) {
    //   await acceptCookiesButton.click();
    // }
    // if (
    //   fs.existsSync("./loop.txt") &&
    //   fs.existsSync("./selectedTraveller.txt")
    // ) {
    //   sendPassenger(fs.readFileSync("./selectedTraveller.txt", "utf-8"));
    // }
    // await util.controller(page, currentConfig, data.travellers);
    // await util.commander(page, {
    //   controller: {
    //     selector:
    //       "body > div.hero__section > div > div > div.hero__info > p:nth-child(3)",
    //     title: "Remember",
    //     arabicTitle: "تذكر",
    //     action: async () => {
    //       const cor = await page.$eval("#cor", (el) => el.value);
    //       if (cor) {
    //         budgie.save("motawif_country_of_residence", cor);
    //       }
    //     },
    //   },
    // });
    // break;
    case "thankyou":
      // const selectedTravelerRaw = fs.readFileSync(
      //   "./selectedTraveller.txt",
      //   "utf-8"
      // );
      // if (selectedTravelerRaw) {
      //   if (/\d+/.test(selectedTravelerRaw)) {
      //     const selectedTraveler = parseInt(selectedTravelerRaw);
      //     fs.writeFileSync(
      //       "./selectedTraveller.txt",
      //       (selectedTraveler + 1).toString()
      //     );
      //   }
      // }
      // await page.goto("https://www.motawif.com.sa");
      break;
    case "reserve-contact":
      await util.controller(page, currentConfig, data.travellers);
      break;
    case "list":
      // const isOk = await page.$("#exampleModal > div > div > div.modal-footer > button");
      // console.log('%cMyProject%cline:702%cisOk', 'color:#fff;background:#ee6f57;padding:3px;border-radius:2px', 'color:#fff;background:#1f3c88;padding:3px;border-radius:2px', 'color:#fff;background:rgb(89, 61, 67);padding:3px;border-radius:2px', isOk)
      // if (isOk) {
      //   await page.click("#exampleModal > div > div > div.modal-footer > button");
      // }
      const anchors = await page.$$("a");
      for (const anchor of anchors) {
        const outer = await anchor.evaluate((e) => {
          e.innerText = "Ayman";
        })
      }
      break;
    case "pilgrim-profile-information":
      const isIUnderstand = await page.$(
        "#disclaimerModal > div > div > div.modal-footer > button"
      );
      if (isIUnderstand) {
        await page.click(
          "#disclaimerModal > div > div > div.modal-footer > button"
        );
      }

      const isOkDone = await page.$(
        "#kt_body > div.swal2-container.swal2-center.swal2-backdrop-show > div > div.swal2-actions > button.swal2-confirm.swal2-styled"
      );
      if (isOkDone) {
        await page.click(
          "#kt_body > div.swal2-container.swal2-center.swal2-backdrop-show > div > div.swal2-actions > button.swal2-confirm.swal2-styled"
        );
      }

      await util.controller(page, currentConfig, data.travellers);
      await page.waitForSelector("#ticket-idguestpage");
      ticketNumber = await page.$eval("#ticket-idguestpage", (el) => el.value);
      fs.appendFileSync("./emails.txt", "ticket: " + ticketNumber + "\n");
      await page.waitForTimeout(2000);
      await page.screenshot({
        path: path.join(__dirname, ticketNumber) + ".png",
        type: "png",
        fullPage: true,
      });
      break;
    default:
      break;
  }
}

module.exports = { send };
