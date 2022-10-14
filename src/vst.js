const puppeteer = require("puppeteer-extra");
// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const fs = require("fs");
const path = require("path");
const util = require("./util");
const { getPath } = util;
const moment = require("moment");
const sharp = require("sharp");
const homedir = require("os").homedir();
const gmail = require("./lib/gmail");

let currentAction = "init";

let page;
let email;
let data;
let status = "idle";

let counter = 0;
let loginsAttempted = 0;

const countryCodes = {
  afghanistan: "2",
  albania: "5",
  algeria: "59",
  "american samoa": "10",
  andorra: "6",
  angola: "3",
  anguilla: "4",
  antarctic: "11",
  antigua: "13",
  argentina: "8",
  armenia: "9",
  aruba: "1",
  australia: "15",
  austria: "14",
  azerbaijan: "16",
  bahamas: "24",
  bahrain: "23",
  bangladesh: "21",
  barbados: "31",
  belarus: "26",
  belgium: "18",
  belize: "27",
  benin: "19",
  bermuda: "28",
  bhutan: "33",
  bolivia: "29",
  bosnia: "25",
  botswana: "231",
  "bouvet island": "34",
  brazil: "30",
  "british indian ocean territory": "241",
  brunei: "32",
  bulgaria: "22",
  "burkina faso": "20",
  burundi: "17",
  cambodia: "106",
  cameroon: "42",
  canada: "36",
  "cape verde": "47",
  "cayman island": "51",
  "central african republic": "35",
  chad: "194",
  chile: "39",
  china: "40",
  "christmas island": "50",
  "cocos island": "37",
  colombia: "45",
  comoros: "46",
  congo: "43",
  "cook island": "44",
  "costa rica": "48",
  "cote divoire": "41",
  croatia: "90",
  cuba: "49",
  cyprus: "52",
  "czech republic": "53",
  denmark: "57",
  djibouti: "55",
  dominica: "56",
  "dominican republic": "58",
  "east timor": "228",
  ecuador: "60",
  egypt: "61",
  "el salvador": "181",
  "equatorial  guinea": "79",
  eritrea: "224",
  estonia: "63",
  ethiopia: "64",
  "falkland islands": "67",
  "faroe islands": "69",
  fiji: "66",
  finland: "65",
  france: "68",
  "france, metropolitan": "237",
  "french guiana": "84",
  "french polynesia": "167",
  "french southern and antarctic": "12",
  gabon: "70",
  gambia: "77",
  georgia: "72",
  germany: "54",
  ghana: "73",
  gibraltar: "74",
  greece: "80",
  greenland: "82",
  grenada: "81",
  guadeloupe: "76",
  guam: "85",
  guatemala: "83",
  guinea: "75",
  "guinea-bissau": "78",
  guyana: "86",
  haiti: "91",
  "heard island and mcdonald island": "88",
  honduras: "89",
  hungary: "92",
  iceland: "98",
  india: "94",
  indonesia: "93",
  iran: "96",
  iraq: "97",
  ireland: "95",
  italy: "99",
  jamaica: "100",
  japan: "102",
  jordan: "101",
  kazakhstan: "103",
  kenya: "104",
  kiribati: "107",
  "korea , south": "109",
  "korea, north": "164",
  kosovo: "87",
  kuwait: "110",
  kyrgyzstan: "105",
  laos: "111",
  latvia: "121",
  lebanon: "112",
  lesotho: "118",
  liberia: "113",
  libya: "114",
  liechtenstein: "116",
  lithuania: "119",
  luxembourg: "120",
  "macau china": "122",
  "macedonia, the former yugoslav republic of": "236",
  madagascar: "126",
  malawi: "140",
  malaysia: "141",
  maldives: "127",
  mali: "130",
  malta: "131",
  "marshall island": "129",
  "marshall islands": "230",
  martinique: "138",
  mauritania: "135",
  mauritius: "139",
  mayotte: "142",
  mexico: "128",
  "micronesia , federated stat": "229",
  monaco: "124",
  mongolia: "133",
  montenegro: "243",
  montserrat: "137",
  morocco: "123",
  mozambique: "134",
  myanmar: "132",
  namibia: "143",
  nauru: "153",
  nepal: "152",
  netherlands: "150",
  "netherlands antilles": "238",
  "new caledonia": "144",
  "new zealand": "154",
  nicaragua: "148",
  niger: "145",
  nigeria: "147",
  niue: "149",
  "norfolk island": "146",
  "northern mariana islands": "227",
  norway: "151",
  oman: "155",
  pakistan: "156",
  palau: "235",
  "palestinian territory, occupied": "234",
  panama: "157",
  "papua new guinea": "161",
  paraguay: "166",
  peru: "159",
  philippines: "160",
  "pitcairn islands": "158",
  poland: "162",
  portugal: "165",
  "puerto rico": "163",
  qatar: "168",
  "republic of moldova": "125",
  "republic of south sudan": "136",
  reunion: "169",
  romania: "170",
  "russian federation": "171",
  rwanda: "172",
  "saint helena": "233",
  "saint kitts and nevis": "108",
  "saint lucia": "115",
  "saint pierre and miquelon": "184",
  "saint vincent and  the grenadines": "212",
  samoa: "226",
  "san marino": "182",
  "sao tome and principe": "185",
  "saudi arabia": "173",
  senegal: "175",
  serbia: "242",
  "serbia and montenegro": "223",
  seychelles: "191",
  "sierra leone": "180",
  singapore: "176",
  "slovak republic": "187",
  slovenia: "188",
  "solomon islands": "179",
  somalia: "183",
  "south africa": "219",
  "south georgia and the south": "177",
  spain: "62",
  "sri lanka": "117",
  sudan: "174",
  suriname: "186",
  svalbard: "178",
  swaziland: "190",
  sweden: "189",
  switzerland: "38",
  syrian: "192",
  "taiwan china": "205",
  tajikistan: "197",
  thailand: "196",
  togo: "195",
  tokelau: "198",
  tonga: "200",
  "trinidad and tobago": "201",
  tunisia: "202",
  turkey: "203",
  turkmenistan: "199",
  "turks and caicos islands": "193",
  tuvalu: "204",
  uganda: "207",
  ukraine: "208",
  "united arab emirates": "7",
  "united kingdom": "71",
  "united states": "210",
  "united states minor outlying islands": "239",
  "ur tanzania": "206",
  uruguay: "209",
  uzbekistan: "211",
  vanuatu: "216",
  "vatican city state": "240",
  venezuela: "213",
  vietnam: "215",
  "virgin islands": "214",
  "virgin islands(u.s": "232",
  "wallis and futuna": "217",
  yemen: "218",
  yugoslavia: "225",
  zaire: "220",
  zambia: "221",
  zimbabwe: "222",
};
function getCountryCode(country) {
  const countryKey = country.toLowerCase();
  return countryCodes[countryKey];
}
const config = [
  {
    name: "login",
    url: "https://visa.visitsaudi.com/Login",
    details: [
      { selector: "#EmailId", value: (system) => system.username },
      { selector: "#Password", value: (system) => system.password },
    ],
  },
  {
    name: "print-visa",
    url: "https://visa.mofa.gov.sa/visaservices/searchvisa",
    controller: {
      selector: "#content > div > div.page-head > div",
      action: async () => {
        const selectedTraveller = await page.$eval(
          "#hajonsoft_select",
          (el) => el.value
        );
        if (selectedTraveller) {
          util.setSelectedTraveller(selectedTraveller);
          await sendPassengerToPrint(selectedTraveller);
          return;
        }
      },
    },
  },
  {
    name: "otp",
    url: "https://visa.visitsaudi.com/Login/OTPAuth",
  },
  {
    name: "group",
    url: "https://visa.visitsaudi.com/Visa/Index",
  },
  {
    name: "personal",
    regex: "https://visa.visitsaudi.com/Visa/PersonalInfo\\?(gName|gid)=",
    url: "https://visa.visitsaudi.com/Visa/PersonalInfo?gName",
    details: [
      { selector: "#FirstNameEnglish", value: (row) => row.name.first },
      { selector: "#LastNameEnglish", value: (row) => row.name.last },
      {
        selector: "#FatherNameEnglish",
        value: (row) => (row?.name?.father + row?.name?.grand)?.trim(),
      },
      {
        selector: "#Gender",
        value: (row) => (row.gender === "Male" ? "1" : "2"),
      },
      { selector: "#SocialStatus", value: () => "5" },
      {
        selector: "#Nationality",
        value: (row) => getCountryCode(row.nationality.name),
      },
      {
        selector: "#CountryOfBirth",
        value: (row) => getCountryCode(row.nationality.name),
      },
      {
        selector: "#Country",
        value: (row) => getCountryCode(row.nationality.name),
      },
      { selector: "#CityOfBirth", value: (row) => row.birthPlace || "city" },
      { selector: "#Profession", value: (row) => row.profession || "unknown" },
      {
        selector: "#City",
        value: (row) => row.address,
        autocomplete: "VisaCity",
        defaultValue: "main",
      },
      {
        selector: "#PostalCode",
        value: (row) => row.passportNumber.substring(0, 5),
      },
      {
        selector: "#Address",
        value: (row) => row.address,
        autocomplete: "visaAddress",
        defaultValue: "123 main street",
      },
    ],
    controller: {
      selector:
        "#formPersonalInfo > div.form-fields > div.bg-label-gray.d-flex.justify-content-between > div",
      action: async () => {
        const selectedTraveller = await page.$eval(
          "#hajonsoft_select",
          (el) => el.value
        );
        if (selectedTraveller) {
          util.setSelectedTraveller();
          await page.goto(await page.url());
        }
      },
    },
  },
  {
    name: "passport",
    url: "https://visa.visitsaudi.com/Visa/PassportInfo",
    regex: "https://visa.visitsaudi.com/Visa/PassportInfo/[A-Za-z0-9]",
    details: [
      { selector: "#PassportNumber", value: (row) => row.passportNumber },
      { selector: "#PassportIssuePlace", value: (row) => row.placeOfIssue },
      {
        selector: "#PlaceOfResidence",
        value: (row) => "",
        autocomplete: "PlaceOfResidence",
        defaultValue: "Mohamed Mohamed",
      },
      { selector: "#CityId", value: (row) => "33" },
      {
        selector: "#Address1",
        value: (row) => "",
        autocomplete: "visaAddress1",
        defaultValue: "123 main street",
      },
    ],
  },
  {
    name: "insurance",
    url: "https://visa.visitsaudi.com/Insurance/ChooseInsurance",
    regex: "https://visa.visitsaudi.com/Insurance/ChooseInsurance/[A-Za-z0-9]",
  },
  {
    name: "terms",
    url: "https://visa.visitsaudi.com/Visa/Terms",
    regex: "https://visa.visitsaudi.com/Visa/Terms/[A-Za-z0-9]",
  },
  {
    name: "review",
    url: "https://visa.visitsaudi.com/Visa/Review",
    regex: "https://visa.visitsaudi.com/Visa/Review/[A-Za-z0-9]",
  },
  {
    name: "screenshot",
    url: "https://visa.mofa.gov.sa/Home/PrintEventVisa",
  },
];

async function send(sendData) {
  data = sendData;
  page = await util.initPage(config, onContentLoaded);
  page.on("dialog", async (dialog) => {
    await dialog.dismiss();
  });
  await page.goto(config[0].url, { waitUntil: "networkidle0" });
}

async function onContentLoaded(res) {
  const currentConfig = util.findConfig(await page.url(), config);
  try {
    await runPageConfiguration(currentConfig);
  } catch (err) {
    console.log(err);
  }
}

async function sendPassengerToPrint(index) {
  status = "sending";
  let currentIndex = index;
  if (!currentIndex) {
    currentIndex = util.getSelectedTraveler();
  }
  const passenger = data.travellers[currentIndex];

  // paste passport number and first name
  await util.commit(
    page,
    [
      {
        selector: "#ddlFirstValue",
        value: (row) => "PassPortNo",
      },
      {
        selector: "#ddlSecondValue",
        value: (row) => "fName",
      },
      {
        selector: "#tbFirstValue",
        value: (row) => row?.passportNumber,
      },
      {
        selector: "#tbSecondValue",
        value: (row) => row?.name?.first,
      },
      {
        selector: "#NationalityId",
        value: (row) => row?.nationality?.code,
      },
    ],
    passenger
  );

  const captchaImg = await page.$("#imgCaptcha");
  const captchaTxt = await page.$("#Captcha");

  if (captchaImg && captchaTxt) {
    await util.commitCaptchaToken(page, "imgCaptcha", "#Captcha", 6);
  }
  await util.pauseMessage(page, 10);
  const url = await page.url();
  if (url == config.find((c) => c.name === "print-visa").url) {
    await page.click("#btnSubmit");
    await util.pauseMessage(page, 10);
    // Make sure the button is visible before clicking
    const isError = await page.$(
      "#dlgMessage > div.modal-dialog > div > div.modal-footer > button",
      { visible: true }
    );
    if (isError) {
      await page.click(
        "#dlgMessage > div.modal-dialog > div > div.modal-footer > button"
      );
      await util.pauseMessage(page, 10);
      util.incrementSelectedTraveler();
      await sendPassengerToPrint();
    }
  }
}

async function runPageConfiguration(currentConfig) {
  counter = util.getSelectedTraveler();
  const passenger = data.travellers[counter];
  switch (currentConfig.name) {
    case "main":
      await util.commit(page, currentConfig.details, data.travellers[counter]);
      await util.captchaClick("#CaptchaCode", 5, "#btnVerify");
      break;
    case "add":
      await util.commit(page, currentConfig.details, passenger);
      await page.waitForSelector("#Email");
      await page.type("#Email", email);
      await page.waitForSelector("#AlternativeEmail");
      await page.type("#AlternativeEmail", email);
      await page.bringToFront();
      await page.waitForSelector("#CaptchaCode");
      await page.focus("#CaptchaCode");
      await page.waitForFunction(
        "document.querySelector('#CaptchaCode').value.length === 5"
      );
      await page.click("#btnAdd");
      break;
    case "login":
      util.commander(page, {
        controller: {
          selector: "#app > div > nav",
          title: "Print Visa",
          arabicTitle: "طباعة الفيزا",
          name: "hajonsoft_printVisa",
          action: async () => {
            util.infoMessage(page, "Go to print visa...");
            await page.goto(config.find((c) => c.name === "print-visa").url, {
              waitUntil: "networkidle0",
            });
          },
        },
      });
      if (data.system.username && data.system.password && loginsAttempted < 2) {
        await util.commit(page, currentConfig.details, data.system);
        // Solve captcha
        await util.commitCaptchaToken(page, "imgCaptcha", "#CaptchaCode", 5);
        if ((await page.url()) === config.find((c) => c.name === "login").url) {
          await page.click("#btnSignIn");
          loginsAttempted += 1;
        }
        return;
      }

      // If no username and password provided, then go to print visa
      await util.infoMessage(page, "Printing in 90 seconds");
      await page.waitForTimeout(90000);
      if (status === "idle") {
        await page.goto(config.find((c) => c.name === "print-visa").url);
      }
      break;
    case "otp":
      await page.waitForSelector(
        "#formOTPAuth > div.form-fields > div.w-100 > div > div > h3"
      );
      // Ask user to forward otp to hajonsoft.owl@gmail.com
      // write the message on the DOM
      await page.$eval(
        "#formOTPAuth > div.form-fields > div.w-100 > div > div > h3",
        (el) => {
          el.innerHTML =
            "Please forward the OTP to <a href='mailto:hajonsoft.owl@gmail.com'>hajonsoft.owl@gmail.com<a>";
        }
      );

      if (await page.$("#resendOtp")) {
        await page.waitForSelector("#resendOtp");
        await page.click("#resendOtp");
        try {
          // wait at least 30 seconds
          await util.pauseMessage(page, 30);
          const code = await gmail.getVisitVisaCodeByEmail(
            data.system.username
          );
          await page.waitForSelector("#Otp");
          await page.type("#Otp", code);
          await page.waitForSelector("#btnSubmit");
          await page.click("#btnSubmit");
        } catch {
          console.log("error in otp");
        }
      }
      break;
    case "group":
      await page.waitForSelector("#btnApplyGroupVisa");
      await page.click("#btnApplyGroupVisa");
      await page.waitForSelector("#txtGroupName");
      await page.type("#txtGroupName", util.suggestGroupName(data.travellers));
      await page.click("#btnCreateGroup");
      break;
    case "personal":
      status = "personal";
      if (!passenger) {
        await util.infoMessage(page, "No more passengers to send");
        return;
      }
      await util.controller(page, currentConfig, data.travellers);
      await sendPersonal(currentConfig, passenger);
      break;
    case "passport":
      status = "passport";
      await util.commit(page, currentConfig.details, passenger);
      await page.click("#chk_4");
      await page.waitForSelector("#PassportIssueDate");
      await page.$eval("#PassportIssueDate", (e) => {
        e.removeAttribute("readonly");
        e.removeAttribute("disabled");
      });
      await page.type("#PassportIssueDate", passenger.passIssueDt.dmy);

      await page.waitForSelector("#PassportExpiryDate");
      await page.$eval("#PassportExpiryDate", (e) => {
        e.removeAttribute("readonly");
        e.removeAttribute("disabled");
      });
      await page.type("#PassportExpiryDate", passenger.passExpireDt.dmy);

      await page.waitForSelector("#ExpectedDateOfEntry");
      await page.$eval("#ExpectedDateOfEntry", (e) => {
        e.removeAttribute("readonly");
        e.removeAttribute("disabled");
        e.setAttribute("value", "");
      });
      await page.type(
        "#ExpectedDateOfEntry",
        moment().add(21, "days").format("DD/MM/YYYY")
      );

      await page.waitForSelector("#ExpectedDateOfLeave");
      await page.$eval("#ExpectedDateOfLeave", (e) => {
        e.removeAttribute("readonly");
        e.removeAttribute("disabled");
        e.setAttribute("value", "");
      });
      await page.type(
        "#ExpectedDateOfLeave",
        moment().add(31, "days").format("DD/MM/YYYY")
      );
      await page.click("#chkSelectDeselectAll");

      // click next if waiting for more than 30 seconds
      await util.pauseMessage(page, 30);
      if (status === "passport") {
        await page.click("#btnNext");
      }
      break;
    case "insurance":
      status = "insurance";
      await page.waitForSelector("#chkInsurance");
      await page.click("#chkInsurance");
      await page.click("#btnNext");
      break;
    case "terms":
      await page.waitForSelector("#chkSelectDeselectAll");
      await page.click("#chkSelectDeselectAll");
      await page.click("#btnNext");
      break;
    case "review":
      util.incrementSelectedTraveler();
      await page.waitForSelector("#btnAddMoreToGroup");
      await page.click("#btnAddMoreToGroup");
      break;
    case "print-visa":
      status = "print-visa";
      await util.controller(page, currentConfig, data.travellers);
      if (fs.existsSync(getPath("loop.txt"))) {
        await sendPassengerToPrint();
        return;
      }

      await util.pauseMessage(page, 15);
      if (status === "print-visa") {
        fs.writeFileSync(getPath("loop.txt"), "loop");
        await sendPassengerToPrint();
      }
      break;
    case "screenshot":
      util.pauseMessage(page, 3);
      // take screen shot for the visa element and then go back
      const visaFolder = path.join(homedir, "hajonsoft", "visa");
      const visaElement = await page.$("body > form > page");
      const caravanName = data.info?.caravan?.replace(/[^A-Z0-9]/g, "");
      let saveFolder = visaFolder;
      if (caravanName) {
        saveFolder = path.join(visaFolder, caravanName);
      }
      if (!fs.existsSync(saveFolder)) {
        fs.mkdirSync(saveFolder, { recursive: true });
      }

      const currentPassenger =
        data.travellers[parseInt(util.getSelectedTraveler())];

      // Save base64 image to kea
      try {
        await screenShotToKea(
          visaElement,
          data.system.accountId,
          currentPassenger
        );
      } catch (error) {}

      // Save image to file
      const visaFileName =
        path.join(
          saveFolder,
          currentPassenger?.passportNumber +
            "_" +
            currentPassenger?.name?.full.replace(/ /, "_") +
            "_" +
            moment().format("YYYY-MM-DD_HH-mm-ss")
        ) + ".png";

      await util.screenShotAndContinue(
        page,
        visaElement,
        visaFileName,
        "https://visa.mofa.gov.sa/visaservices/searchvisa"
      );
      util.infoMessage(page, "Visa saved to Kea and " + visaFileName);
      util.incrementSelectedTraveler();
      break;
    default:
      break;
  }
}

async function sendPersonal(currentConfig, passenger) {
  currentAction = await determineCurrentAction();
  await util.infoMessage(page, `${currentConfig.name}-${currentAction}`);

  switch (currentAction) {
    case "init":
      await page.waitForSelector("#ApplyingVisaForSomeoneElseYes");
      await page.click("#ApplyingVisaForSomeoneElseYes");
      await util.commit(page, currentConfig.details, passenger);
      await page.waitForSelector("#DateOfBirth");
      await page.$eval("#DateOfBirth", (e) => {
        e.removeAttribute("readonly");
        e.removeAttribute("disabled");
      });
      await page.type("#DateOfBirth", passenger.dob.dmy);
      await page.focus("#Address");
      await page.click("#Address");
      let photoPath = path.join(
        util.photosFolder,
        `${passenger.passportNumber}.jpg`
      );
      await util.downloadImage(passenger.images.photo, photoPath);
      let resizedPhotoPath = path.join(
        util.photosFolder,
        `${passenger.passportNumber}_200x200.jpg`
      );
      const sharpImage = await sharp(photoPath);
      const sharpImageMetadata = await sharpImage.metadata();
      const sizeOnDesk = Math.round(fs.statSync(photoPath).size / 1024);
      if (
        sharpImageMetadata.width === 200 &&
        sharpImageMetadata.height === 200 &&
        sizeOnDesk < 100 &&
        sizeOnDesk > 7
      ) {
        await sharpImage
          .clone()
          .jpeg({ quality: 100 })
          .toFile(resizedPhotoPath);
      } else {
        resizedPhotoPath = await util.downloadAndResizeImage(
          passenger,
          200,
          200,
          "photo",
          7,
          100
        );
      }

      const sharpNewImage = await sharp(resizedPhotoPath);
      const sharpNewImageMetadata = await sharpNewImage.metadata();
      const sizeOnDeskNew = Math.round(
        fs.statSync(resizedPhotoPath).size / 1024
      );

      console.log(
        resizedPhotoPath,
        `original: ${sharpImageMetadata.width}x${sharpImageMetadata.height} ${sizeOnDesk} kb`,
        `new: ${sharpNewImageMetadata.width}x${sharpNewImageMetadata.height} ${sizeOnDeskNew} kb`
      );
      await util.commitFile("#AttachmentPersonalPicture", resizedPhotoPath);
      await util.pauseMessage(page, 3);
      try {
        await page.click(
          "#divPhotoCroper > div > div > div.modal-footer > button.rounded-button.upload-result"
        );
      } catch {}
      await util.pauseMessage(page, 3);
      await page.click("#btnNext");
      await util.pauseMessage(page, 5);

      try {
        await page.waitForSelector("#GuardianList", { timeout: 3000 });
        const secondOption = await page.$eval(
          "#GuardianList option:nth-child(2)",
          (el) => el.value
        );
        await page.select("#GuardianList", secondOption);

        await util.pauseMessage(page, 5);
        await page.waitForSelector("#GuardianRelation");
        const secondRelationOption = await page.$eval(
          "#GuardianRelation option:nth-child(2)",
          (el) => el.value
        );
        await page.select("#GuardianRelation", secondRelationOption);
        await util.commit(page, currentConfig.details, passenger);
        await util.commitFile("#AttachmentPersonalPicture", resizedPhotoPath);
        await util.pauseMessage(page, 3);
        try {
          await page.click(
            "#divPhotoCroper > div > div > div.modal-footer > button.rounded-button.upload-result"
          );
        } catch {}
        
      } catch {}

      break;
    default:
      break;
  }
}

async function determineCurrentAction() {
  console.log("determine");
  const firstNamePresent = await page.$eval(
    "#FirstNameEnglish",
    (el) => el.value
  );
  if (!firstNamePresent) {
    return "init";
  }

  return "init";
}

module.exports = { send };
