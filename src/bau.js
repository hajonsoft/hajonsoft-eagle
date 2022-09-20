const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const fs = require("fs");
const path = require("path");
const util = require("./util");
const { getPath } = util;
const moment = require("moment");
const sharp = require("sharp");
const os = require("os");
const { default: axios } = require("axios");

const SERVER_NUMBER = 1;
let page;
let data;
let configs = [];

const config = [
  {
    name: "login",
    url: `https://app${SERVER_NUMBER}.babalumra.com/Security/login.aspx`,
    details: [
      { selector: "#txtUserName", value: (system) => system.username },
      { selector: "#txtPassword", value: (system) => system.password },
    ],
    commit: true,
    supportSelector: "#form1 > div:nth-child(14) > div",
    success: {
      name: "main",
    },
  },
  {
    name: "main",
    regex: `https?://app${SERVER_NUMBER}.babalumra.com/Security/MainPage.aspx`,
    redirect: `https://app${SERVER_NUMBER}.babalumra.com/Groups/AddNewGroup.aspx?gMode=1`,
  },
  {
    name: "search-group",
    regex: `https://app${SERVER_NUMBER}.babalumra.com/Groups/SearchGroups.aspx`,
  },
  {
    name: "create-group",
    regex: `https?://app${SERVER_NUMBER}.babalumra.com/Groups/AddNewGroup.aspx.gMode=1`,
    details: [
      {
        selector: "#ctl00_ContentHolder_TxtGroupName",
        value: (data) => util.suggestGroupName(data),
      },
      {
        selector: "#ctl00_ContentHolder_TxtExpectedArrivalDate_dateInput",
        value: () => moment().add(7, "days").format("DD/MM/YYYY"),
      },
    ],
  },
  {
    name: "create-mutamer",
    regex: `https?://app${SERVER_NUMBER}.babalumra.com/Groups/EditMutamerNew.aspx\\?GroupId=\\d+`,
    controller: {
      selector:
        "#aspnetForm > div.container-fluid.body-content > div.page-header",
      action: async () => {
        const selectedTraveller = await page.$eval(
          "#hajonsoft_select",
          (el) => el.value
        );
        if (selectedTraveller) {
          util.setSelectedTraveller(selectedTraveller);
          const passenger = data.travellers[selectedTraveller];
          await sendPassenger(passenger);
        }
      },
    },
  },
];

async function send(sendData) {
  data = sendData;
  page = await util.initPage(config, onContentLoaded);
  // exit program if no login 2 mins
  setTimeout(() => {
    if (!configs.find((c) => c.name === "main")) {
      util.infoMessage(null, "Login timed out", 2, null, true);
      process.exit(1);
    }
  }, 1200000);
  await page.goto(config[0].url, { waitUntil: "domcontentloaded" });
}

async function commonTasks(currentConfig) {
  if (currentConfig.supportSelector) {
    await util.premiumSupportAlert(page, currentConfig.supportSelector, data);
    return;
  }
  if (currentConfig.controller) {
    await util.controller(page, currentConfig, data.travellers);
  }
}

async function onContentLoaded(res) {
  const currentConfig = util.findConfig(await page.url(), config);
  configs.push(currentConfig);
  try {
    await commonTasks(currentConfig);
    await runPageConfiguration(currentConfig);
  } catch (err) {
    console.log(err);
  }
}

async function runPageConfiguration(currentConfig) {
  switch (currentConfig.name) {
    case "login":
      await util.commit(page, currentConfig.details, data.system);
      await util.commitCaptchaToken(
        page,
        "rdCap_CaptchaImage",
        "#rdCap_CaptchaTextBox",
        5
      );
      if (currentConfig.name === "login") {
        await page.click("#lnkLogin");
      }

      break;
    case "main":
      await page.goto(
        `https://app${SERVER_NUMBER}.babalumra.com/Groups/AddNewGroup.aspx?gMode=1`
      );
      break;
    case "search-group":
      // remove target _blank from all links
      await page.evaluate(() => {
        const links = document.querySelectorAll("a");
        links.forEach((link) => {
          link.removeAttribute("target");
        });
      });
      break;
    case "create-group":
      const groupName = await page.$eval(
        "#ctl00_ContentHolder_TxtGroupName",
        (e) => e.value
      );
      if (groupName) {
        return;
      }

      await util.commit(page, currentConfig.details, data);
      util.infoMessage(
        page,
        `🏘 create group => ${
          groupName ||
          `${data.info?.caravan.replace(/ /g, "-").substring(0, 20)}-${os
            .hostname()
            .substring(0, 8)}`
        }`
      );
      await page.evaluate(() => {
        const consulate = document.querySelector(
          "#ctl00_ContentHolder_LstConsulate"
        );
        const consulateOptions = consulate.querySelectorAll("option");
        consulateOptions[1].selected = true;
      });

      if (!data.info?.caravan.startsWith("CLOUD_")) {
        await page.waitForTimeout(10000);
      }

      try {
        await page.waitForSelector("#ctl00_ContentHolder_LstConsulate", {
          timeout: 5000,
        });
        await page.click("#ctl00_ContentHolder_btnCreate");
      } catch {}
      break;
    case "create-mutamer":
      if (fs.existsSync(getPath("loop.txt"))) {
        const currentIndex = util.getSelectedTraveler();
        const passenger = data.travellers[parseInt(currentIndex)];
        sendPassenger(passenger);
      } else {
        if (!data.info.caravan.startsWith("CLOUD_")) {
          util.infoMessage(page, `pausing for 10 seconds`);
          await page.waitForTimeout(10000);
        }
        fs.writeFileSync(getPath("loop.txt"), "loop");
        await page.reload();
      }
      break;
    default:
      break;
  }
}

async function sendPassenger(passenger) {
  util.infoMessage(page, `Sending passenger ${passenger.slug}`);
  const passportNumber = await page.$eval(
    "#ctl00_ContentHolder_TxtNumber",
    (e) => e.value
  );
  // Do not continue if the passport number field is not empty - This could be a manual page refresh
  if (passportNumber) {
    return;
  }
  await page.waitForTimeout(3000);
  await page.waitForSelector("#btnclick");
  await page.evaluate(() => {
    const scanButton = document.querySelector("#btnclick");
    if (scanButton) {
      scanButton.click();
    }
  });

  const scanInputSelector = "#ctl00_ContentHolder_btngetValues";

  await page.waitForSelector(scanInputSelector);
  await page.type("#ctl00_ContentHolder_btngetValues", passenger.codeline, {
    delay: 0,
  });
  // Wait for the input field to receieve the value
  await page.waitForTimeout(10000);
  await util.commit(
    page,
    [
      {
        selector: "#ctl00_ContentHolder_LstTitle",
        value: (row) => (row.gender === "Male" ? "1" : "3"),
      },
      {
        selector: "#ctl00_ContentHolder_txtMutamerOcc",
        value: (row) => decodeURI(row.profession),
      },
      { selector: "#ctl00_ContentHolder_LstSocialState", value: (row) => "99" },
      { selector: "#ctl00_ContentHolder_LstEducation", value: (row) => "99" },
      {
        selector: "#ctl00_ContentHolder_TxtBirthCity",
        value: (row) => decodeURI(row.birthPlace) || row.nationality.name,
      },
      {
        selector: "#ctl00_ContentHolder_TxtAddressCity",
        value: (row) => decodeURI(util.getIssuingCountry(row)?.name),
      },
      {
        selector: "#ctl00_ContentHolder_TxtAltFirstName",
        value: (row) => row.nameArabic.first,
      },
      {
        selector: "#ctl00_ContentHolder_TxtAltSecondName",
        value: (row) => row.nameArabic.father,
      },
      {
        selector: "#ctl00_ContentHolder_TxtAltGrandFatherName",
        value: (row) => row.nameArabic.grand,
      },
      {
        selector: "#ctl00_ContentHolder_TxtAltLastName",
        value: (row) => row.nameArabic.last,
      },
      {
        selector: "#ctl00_ContentHolder_TxtFirstName",
        value: (row) => row.name.first,
      },
      {
        selector: "#ctl00_ContentHolder_TxtSecondName",
        value: (row) => row.name.father,
      },
      {
        selector: "#ctl00_ContentHolder_TxtGrandFatherName",
        value: (row) => row.name.grand,
      },
      {
        selector: "#ctl00_ContentHolder_TxtLastName",
        value: (row) => row.name.last,
      },
      {
        selector: "#ctl00_ContentHolder_calPassIssue_dateInput",
        value: (row) => row.passIssueDt.dmy,
      },
      {
        selector: "#ctl00_ContentHolder_TxtCityIssuedAt",
        value: (row) => decodeURI(row.placeOfIssue),
      },
      {
        selector: "#ctl00_ContentHolder_LstType",
        value: (row) =>
          row.codeline?.replace(/\n/g, "")?.substring(2, 5) !=
          row.codeline?.replace(/\n/g, "")?.substring(54, 57)
            ? "3"
            : "1",
      },
      {
        selector: "#ctl00_ContentHolder_LstBirthCountry",
        value: (row) => row.nationality.telCode,
      },
      {
        selector: "#ctl00_ContentHolder_LstAddressCountry",
        value: (row) => util.getIssuingCountry(row)?.telCode,
      },
    ],
    passenger
  );
  // Try to get the current city of the passenger
  const currentLocation = await axios.get("https://ipapi.co/json/");
  if (currentLocation?.data?.city) {
    await util.commit(
      page,
      [
        {
          selector: "#ctl00_ContentHolder_TxtAddressCity",
          value: (row) => currentLocation?.data?.city,
        },
      ],
      passenger
    );
  }

  if (passenger.gender === "Female") {
    try {
      await page.waitForSelector("#ctl00_ContentHolder_LstSponsorRelationship");
      await page.select("#ctl00_ContentHolder_LstSponsorRelationship", "15");
    } catch {}
  }

  // commit "#ctl00_ContentHolder_LstAddressCountry" from system.country.telCode
  await util.commit(
    page,
    [
      {
        selector: "#ctl00_ContentHolder_LstAddressCountry",
        value: (row) => row.country?.telCode,
      },
    ],
    data.system
  );

  // paste 2 images
  let photoPath = path.join(
    util.photosFolder,
    `${passenger.passportNumber}.jpg`
  );
  await util.downloadImage(passenger.images.photo, photoPath);
  photoPath = util.getOverridePath(
    photoPath,
    path.join(__dirname, `../photos/${passenger.passportNumber}.jpg`)
  );
  await page.waitForSelector("#ctl00_ContentHolder_imgSelectedFile");
  let futureFileChooser = page.waitForFileChooser();
  await page.evaluate(() =>
    document.querySelector("#ctl00_ContentHolder_ImageUploaderControl").click()
  );
  let fileChooser = await futureFileChooser;
  const resizedPhotoPath = path.join(
    util.photosFolder,
    `${passenger.passportNumber}_200x200.jpg`
  );
  await sharp(photoPath)
    .resize(200, 200, {
      fit: sharp.fit.inside,
      withoutEnlargement: true,
    })
    .toFile(resizedPhotoPath);
  await fileChooser.accept([resizedPhotoPath]);
  util.infoMessage(page, `🌇 portrait accepted ${resizedPhotoPath}`);

  const passportPath = path.join(
    util.passportsFolder,
    `${passenger.passportNumber}.jpg`
  );
  await util.downloadImage(passenger.images.passport, passportPath);
  if (fs.existsSync(passportPath)) {
    futureFileChooser = page.waitForFileChooser();
    await page.evaluate(() =>
      document
        .querySelector("#ctl00_ContentHolder_ImageUploaderControlPassport")
        .click()
    );
    fileChooser = await futureFileChooser;
    let resizedPassportFile = path.join(
      util.passportsFolder,
      `${passenger.passportNumber}_400x300.jpg`
    );
    await sharp(passportPath)
      .resize(400, 300, {
        fit: sharp.fit.inside,
        withoutEnlargement: true,
      })
      .toFile(resizedPassportFile);
    await fileChooser.accept([resizedPassportFile]);
    util.infoMessage(page, `🛂 passport accepted ${resizedPassportFile}`);
  }

  util.infoMessage(page, `🧟 passenger ${passenger.passportNumber} captcha`);
  await util.commitCaptchaToken(
    page,
    "ctl00_ContentHolder_rdCap_CaptchaImageUP",
    "#ctl00_ContentHolder_rdCap_CaptchaTextBox",
    5
  );
  util.infoMessage(
    page,
    `🧟 passenger ${passenger.slug} done, waiting to save`
  );
  await page.waitForTimeout(10000);
  const saveBtn = await page.$("#ctl00_ContentHolder_BtnEdit");
  if (saveBtn) {
    await page.click("#ctl00_ContentHolder_BtnEdit");
    await page.waitForTimeout(5000);
    util.infoMessage(
      page,
      `🧟 passenger ${passenger.slug} saved`,
      2,
      false,
      true
    );
    try {
      const errorMessage = await page.$eval(
        "#ctl00_ContentHolder_divErrorsList > div > ul > li",
        (el) => el.textContent || el.innerText
      );
      if (errorMessage) {
        util.infoMessage(page, `🖐 🖐 🖐 🖐 🖐 Error: ${errorMessage}`);
      }
    } catch {}
  } else {
    util.infoMessage(
      page,
      `Error 🖐 🖐 🖐 🖐 passenger ${passenger.slug} skipped. Save button unavailable`
    );
  }
  util.incrementSelectedTraveler();
}

module.exports = { send, config, SERVER_NUMBER };
