const puppeteer = require("puppeteer-extra");
// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const fs = require("fs");
const path = require("path");
const util = require("./util");
const { getPath } = require("./lib/getPath");
const moment = require("moment");
const sharp = require("sharp");

let page;
let data;
let counter = 0;

const config = [
  {
    name: "login",
    url: `https://www.etawaf.com/tawaf${util.hijriYear}/index.html`,
    regex: `https?:\/\/www.etawaf.com\/tawaf${util.hijriYear}\/index(_ar)?\.html`,
    details: [
      {
        selector:
          "#login > table > tbody > tr > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(3) > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr > td:nth-child(2) > input",
        value: (system) => system.username,
      },
      {
        selector:
          "#login > table > tbody > tr > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(3) > td > table > tbody > tr:nth-child(3) > td > table > tbody > tr > td:nth-child(2) > input",
        value: (system) => system.password,
      },
    ],
  },
];

async function send(sendData) {
  data = sendData;
  page = await util.initPage(config, onContentLoaded);
  await page.goto(config[0].url, { waitUntil: "domcontentloaded" });
}

async function onContentLoaded(res) {
  const url = await page.url();
  const currentConfig = util.findConfig(url, config);
  try {
    await pageContentHandler(currentConfig);
  } catch (err) {
    console.log(err);
  }
}

async function pageContentHandler(currentConfig) {
  switch (currentConfig.name) {
    case "login":
      await util.commit(page, currentConfig.details, data.system);
      const token = await util.commitCaptchaTokenWithSelector(
        page,
        "#login > table > tbody > tr > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(3) > td > table > tbody > tr:nth-child(4) > td > table > tbody > tr > td:nth-child(1) > table > tbody > tr > td > img",
        "#login > table > tbody > tr > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(3) > td > table > tbody > tr:nth-child(5) > td > table > tbody > tr > td:nth-child(2) > input",
        5
      );
      if (token) {
        await page.click(
          "#login > table > tbody > tr > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(3) > td > table > tbody > tr:nth-child(6) > td > button"
        );
      }
      await page.waitForSelector(
        "#wrapper > div.gwt-DialogBox > div > table > tbody > tr.dialogMiddle > td.dialogMiddleCenter > div > div > div > table > tbody > tr:nth-child(4) > td > table > tbody > tr > td:nth-child(2) > table > tbody > tr > td:nth-child(1) > table > tbody > tr > td > table > tbody > tr:nth-child(1) > td > table > tbody > tr:nth-child(3) > td > img",
        { timeout: 0 }
      );
      await util.controller(
        page,
        {
          controller: {
            selector:
              "#wrapper > div.gwt-DialogBox > div > table > tbody > tr.dialogMiddle > td.dialogMiddleCenter > div > div > div > table > tbody > tr:nth-child(4) > td > table > tbody > tr > td:nth-child(1) > table > tbody",
            action: async () => {
              const selectedTraveler = await page.$eval(
                "#hajonsoft_select",
                (el) => el.value
              );
              if (selectedTraveler) {
                try {
                  await page.click(
                    "#wrapper > div.gwt-DialogBox > div > table > tbody > tr.dialogMiddle > td.dialogMiddleCenter > div > div > div > table > tbody > tr:nth-child(5) > td > fieldset > table > tbody > tr > td:nth-child(1) > button"
                  );
                  util.setSelectedTraveller(selectedTraveler);
                  const data = fs.readFileSync(getPath("data.json"), "utf-8");
                  var passengersData = JSON.parse(data);
                  var passenger = passengersData.travellers[selectedTraveler];
                  await page.keyboard.type(passenger.codeline);
                  await page.keyboard.type("{ENTER}");
                  await page.waitForXPath('//input[@type="text"]', {
                    timeout: 240000,
                  });
                  await util.commit(
                    page,
                    [
                      {
                        xPath: '//input[@type="text"]',
                        index: 38,
                        value: (row) => row.name.first,
                      },
                      {
                        xPath: '//input[@type="text"]',
                        index: 39,
                        value: (row) => row.name.father,
                      },
                      {
                        xPath: '//input[@type="text"]',
                        index: 40,
                        value: (row) => row.name.grand,
                      },
                      {
                        xPath: '//input[@type="text"]',
                        index: 41,
                        value: (row) => row.name.last,
                      },
                      {
                        selector:
                          "#wrapper > div.gwt-DialogBox > div > table > tbody > tr.dialogMiddle > td.dialogMiddleCenter > div > div > div > table > tbody > tr:nth-child(7) > td > table > tbody > tr:nth-child(1) > td > table > tbody > tr:nth-child(2) > td:nth-child(1) > input",
                        value: (row) =>
                          row.nationality.isArabic && row.nameArabic.first,
                      },
                      {
                        selector:
                          "#wrapper > div.gwt-DialogBox > div > table > tbody > tr.dialogMiddle > td.dialogMiddleCenter > div > div > div > table > tbody > tr:nth-child(7) > td > table > tbody > tr:nth-child(1) > td > table > tbody > tr:nth-child(2) > td:nth-child(2) > input",
                        value: (row) =>
                          row.nationality.isArabic && row.nameArabic.father,
                      },
                      {
                        selector:
                          "#wrapper > div.gwt-DialogBox > div > table > tbody > tr.dialogMiddle > td.dialogMiddleCenter > div > div > div > table > tbody > tr:nth-child(7) > td > table > tbody > tr:nth-child(1) > td > table > tbody > tr:nth-child(2) > td:nth-child(3) > input",
                        value: (row) =>
                          row.nationality.isArabic && row.nameArabic.grand,
                      },
                      {
                        selector:
                          "#wrapper > div.gwt-DialogBox > div > table > tbody > tr.dialogMiddle > td.dialogMiddleCenter > div > div > div > table > tbody > tr:nth-child(7) > td > table > tbody > tr:nth-child(1) > td > table > tbody > tr:nth-child(2) > td:nth-child(4) > input",
                        value: (row) =>
                          row.nationality.isArabic && row.nameArabic.last,
                      },
                      {
                        selector:
                          "#wrapper > div.gwt-DialogBox > div > table > tbody > tr.dialogMiddle > td.dialogMiddleCenter > div > div > div > table > tbody > tr:nth-child(7) > td > table > tbody > tr:nth-child(1) > td > table > tbody > tr:nth-child(8) > td:nth-child(3) > table > tbody > tr > td:nth-child(1) > input",
                        value: (row) => row.birthPlace,
                      },
                      {
                        selector:
                          "#wrapper > div.gwt-DialogBox > div > table > tbody > tr.dialogMiddle > td.dialogMiddleCenter > div > div > div > table > tbody > tr:nth-child(7) > td > table > tbody > tr:nth-child(1) > td > table > tbody > tr:nth-child(10) > td:nth-child(4) > table > tbody > tr > td:nth-child(1) > input",
                        value: (row) => row.profession,
                      },
                      {
                        selector:
                          "#wrapper > div.gwt-DialogBox > div > table > tbody > tr.dialogMiddle > td.dialogMiddleCenter > div > div > div > table > tbody > tr:nth-child(7) > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(1) > td:nth-child(6) > table > tbody > tr > td:nth-child(1) > input",
                        value: (row) => row.placeOfIssue,
                      },
                      {
                        selector:
                          "#wrapper > div.gwt-DialogBox > div > table > tbody > tr.dialogMiddle > td.dialogMiddleCenter > div > div > div > table > tbody > tr:nth-child(7) > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(2) > td:nth-child(4) > table > tbody > tr > td:nth-child(1) > input",
                        value: (row) => row.passIssueDt.dd,
                      },
                      {
                        selector:
                          "#wrapper > div.gwt-DialogBox > div > table > tbody > tr.dialogMiddle > td.dialogMiddleCenter > div > div > div > table > tbody > tr:nth-child(7) > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(2) > td:nth-child(4) > table > tbody > tr > td:nth-child(2) > input",
                        value: (row) => row.passIssueDt.mm,
                      },
                      {
                        selector:
                          "#wrapper > div.gwt-DialogBox > div > table > tbody > tr.dialogMiddle > td.dialogMiddleCenter > div > div > div > table > tbody > tr:nth-child(7) > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(2) > td:nth-child(4) > table > tbody > tr > td:nth-child(3) > input",
                        value: (row) => row.passIssueDt.yyyy,
                      },
                      {
                        selector:
                          "#wrapper > div.gwt-DialogBox > div > table > tbody > tr.dialogMiddle > td.dialogMiddleCenter > div > div > div > table > tbody > tr:nth-child(7) > td > table > tbody > tr:nth-child(1) > td > table > tbody > tr:nth-child(10) > td:nth-child(3) > table > tbody > tr > td:nth-child(1) > input",
                        value: (row) => row.nationality.name,
                      },
                      {
                        xPath: "//select",
                        index: 6,
                        value: (row) => "99",
                      },
                      {
                        xPath: "//select",
                        index: 7,
                        value: (row) => "99",
                      },
                      {
                        xPath: "//select",
                        index: 4,
                        value: (row) => "99",
                      },
                      {
                        selector:
                          "#wrapper > div.gwt-DialogBox > div > table > tbody > tr.dialogMiddle > td.dialogMiddleCenter > div > div > div > table > tbody > tr:nth-child(7) > td > table > tbody > tr:nth-child(3) > td > table > tbody > tr:nth-child(3) > td > table > tbody > tr > td:nth-child(2) > select",
                        value: (row) => "15",
                      },
                    ],
                    passenger
                  );

                  if (passenger.gender === "Female") {
                    await util.commit(
                      page,
                      [
                        {
                          selector:
                            "#wrapper > div.gwt-DialogBox > div > table > tbody > tr.dialogMiddle > td.dialogMiddleCenter > div > div > div > table > tbody > tr:nth-child(7) > td > table > tbody > tr:nth-child(3) > td > table > tbody > tr:nth-child(3) > td > table > tbody > tr > td:nth-child(2) > select",
                          value: (row) => "15",
                        },
                      ],
                      passenger
                    );
                  } else {
                    await util.commit(
                      page,
                      [
                        {
                          selector:
                            "#wrapper > div.gwt-DialogBox > div > table > tbody > tr.dialogMiddle > td.dialogMiddleCenter > div > div > div > table > tbody > tr:nth-child(7) > td > table > tbody > tr:nth-child(3) > td > table > tbody > tr:nth-child(3) > td > table > tbody > tr > td:nth-child(2) > select",
                          value: (row) => "0",
                        },
                      ],
                      passenger
                    );
                  }
                  await util.toggleBlur(page);
                  let portraitImage = await util.downloadAndResizeImage(
                    passenger,
                    200,
                    200,
                    "photo"
                  );
                  const resizedPassportPath = await util.downloadAndResizeImage(
                    passenger,
                    400,
                    300,
                    "passport"
                  );

                  await util.commitFile(
                    "#wrapper > div.gwt-DialogBox > div > table > tbody > tr.dialogMiddle > td.dialogMiddleCenter > div > div > div > table > tbody > tr:nth-child(4) > td > table > tbody > tr > td:nth-child(2) > table > tbody > tr > td:nth-child(1) > table > tbody > tr > td > table > tbody > tr:nth-child(3) > td > table > tbody > tr > td > table > tbody > tr:nth-child(2) > td > div > table > tbody > tr > td:nth-child(1) > form > div > input",
                    portraitImage
                  );
                  // await util.commitFile("#wrapper > div.gwt-DialogBox > div > table > tbody > tr.dialogMiddle > td.dialogMiddleCenter > div > div > div > table > tbody > tr:nth-child(7) > td > table > tbody > tr:nth-child(1) > td > table > tbody > tr:nth-child(12) > td:nth-child(3) > table > tbody > tr:nth-child(2) > td > div > table > tbody > tr > td:nth-child(1) > form > div > input", vaccineImage);
                  await util.toggleBlur(page,false);
                  await page.evaluate(() => {
                    const uplodPassportBtn = document.querySelector(
                      "#wrapper > div.gwt-DialogBox > div > table > tbody > tr.dialogMiddle > td.dialogMiddleCenter > div > div > div > table > tbody > tr:nth-child(4) > td > table > tbody > tr > td:nth-child(2) > table > tbody > tr > td:nth-child(2) > table > tbody > tr > td > table > tbody > tr:nth-child(3) > td > button"
                    );
                    if (uplodPassportBtn) {
                      uplodPassportBtn.click();
                    }
                  });
                  await util.commitFile(
                    "#wrapper > div:nth-child(18) > div > table > tbody > tr.dialogMiddle > td.dialogMiddleCenter > div > table > tbody > tr:nth-child(1) > td > table > tbody > tr > td:nth-child(2) > table > tbody > tr:nth-child(2) > td > div > table > tbody > tr > td:nth-child(1) > form > div > input",
                    resizedPassportPath
                  );

                  // Clip Crop photo here
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

module.exports = { send, config };
