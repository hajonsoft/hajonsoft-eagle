const puppeteer = require("puppeteer-extra");
// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const fs = require("fs");
const path = require("path");
const util = require("./util");
const moment = require("moment");
const sharp = require("sharp");
let page;
let data;
let counter = 0;
let groupNumber;
const config = [
  {
    name: "login",
    url: "https://www.etawaf.com/tawaf43/index.html?locale=en",
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
    case "login":
      await util.commit(page, currentConfig.details, data.system);
      util.endCase(currentConfig.name);
      await util.waitForCaptcha(
        "#login > table > tbody > tr > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(3) > td > table > tbody > tr:nth-child(5) > td > table > tbody > tr > td:nth-child(2) > input",
        5
      );
      await page.click(
        "#login > table > tbody > tr > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(3) > td > table > tbody > tr:nth-child(6) > td > button"
      );
      await page.waitForXPath("//button[contains(text(), 'Upload Passport')]");
      await util.controller(page, {
        controller: {
          selector: '#wrapper > div.gwt-DialogBox > div > table > tbody > tr.dialogMiddle > td.dialogMiddleCenter > div > div > div > table > tbody > tr:nth-child(1) > td > table > tbody > tr > td:nth-child(3)',
          action: async () => {
            const selectedTraveller = await page.$eval(
              "#hajonsoft_select",
              (el) => el.value
            );
            if (selectedTraveller) {
              try {
                await page.click('#wrapper > div.gwt-DialogBox > div > table > tbody > tr.dialogMiddle > td.dialogMiddleCenter > div > div > div > table > tbody > tr:nth-child(5) > td > fieldset > table > tbody > tr > td:nth-child(1) > button');
                fs.writeFileSync("./selectedTraveller.txt", selectedTraveller);
                const data = fs.readFileSync("./data.json", "utf-8");
                var passengersData = JSON.parse(data);
                var passenger = passengersData.travellers[selectedTraveller];
                await page.keyboard.type(passenger.codeline);
                await page.keyboard.type("{ENTER}");
                await util.commit(page, [
                  {
                    xPath: '//input[@type="text"]',
                    index: 38,
                    value: (row) => row.name.first
                  },
                  {
                    xPath: '//input[@type="text"]',
                    index: 39,
                    value: (row) => row.name.father
                  },
                  {
                    xPath: '//input[@type="text"]',
                    index: 40,
                    value: (row) => row.name.grand
                  },
                  {
                    xPath: '//input[@type="text"]',
                    index: 41,
                    value: (row) => row.name.last
                  },
                  {
                    xPath: '//input[@type="text"]',
                    index: 34,
                    value: (row) => row.nationality.isArabic && row.nameArabic.first
                  },
                  {
                    xPath: '//input[@type="text"]',
                    index: 35,
                    value: (row) => row.nationality.isArabic && row.nameArabic.father
                  },
                  {
                    xPath: '//input[@type="text"]',
                    index: 36,
                    value: (row) => row.nationality.isArabic && row.nameArabic.grand
                  },
                  {
                    xPath: '//input[@type="text"]',
                    index: 37,
                    value: (row) => row.nationality.isArabic && row.nameArabic.last
                  },
                  {
                    xPath: '//input[@type="text"]',
                    index: 46,
                    value: (row) => row.birthPlace
                  },
                  {
                    xPath: '//input[@type="text"]',
                    index: 49,
                    value: (row) => 'Paris'
                  },
                  {
                    xPath: '//input[@type="text"]',
                    index: 50,
                    value: (row) => row.profession
                  },
                  {
                    xPath: '//input[@type="text"]',
                    index: 52,
                    value: (row) => row.placeOfIssue
                  },
                  {
                    xPath: '//input[@type="text"]',
                    index: 54,
                    value: (row) => row.passIssueDt.dd
                  },
                  {
                    xPath: '//input[@type="text"]',
                    index: 55,
                    value: (row) => row.passIssueDt.mm
                  },
                  {
                    xPath: '//input[@type="text"]',
                    index: 56,
                    value: (row) => row.passIssueDt.yyyy
                  },
                  {
                    xPath: '//select',
                    index: 6,
                    value: (row) => "99"
                  },
                  {
                    xPath: '//select',
                    index: 7,
                    value: (row) => "99"
                  },
                  {
                    xPath: '//select',
                    index: 4,
                    value: (row) => "99"
                  },
                ], passenger);
                // BEGIN PHOTO UPLOAD
                let photoPath = path.join(
                  util.photosFolder,
                  `${passenger.passportNumber}.jpg`
                );
                await util.downloadImage(passenger.images.photo, photoPath);
                const resizedPhotoPath = path.join(
                  util.photosFolder,
                  `${passenger.passportNumber}_200x200.jpg`
                );
                await sharp(photoPath).resize(200, 200).toFile(resizedPhotoPath);
                if (!process.argv.includes("noimage")) {
                  let futureFileChooser = page.waitForFileChooser();
                  await page.evaluate(() =>
                    document.querySelector("#wrapper > div.gwt-DialogBox > div > table > tbody > tr.dialogMiddle > td.dialogMiddleCenter > div > div > div > table > tbody > tr:nth-child(4) > td > table > tbody > tr > td:nth-child(2) > table > tbody > tr > td:nth-child(1) > table > tbody > tr > td > table > tbody > tr:nth-child(3) > td > table > tbody > tr > td > table > tbody > tr:nth-child(2) > td > div > table > tbody > tr > td:nth-child(1) > form > div > input").click()
                  );
                  let fileChooser = await futureFileChooser;
                  await fileChooser.accept([resizedPhotoPath]);
                }

                // BEGIN PASSPORT UPLOAD
                const passportPath = path.join(
                  util.passportsFolder,
                  `${passenger.passportNumber}.jpg`
                );
                await util.downloadImage(passenger.images.passport, passportPath);
                let resizedPassportFile = path.join(
                  util.passportsFolder,
                  `${passenger.passportNumber}_400x300.jpg`
                );
                await sharp(passportPath)
                  .resize(400, 300)
                  .toFile(resizedPassportFile);
                if (fs.existsSync(passportPath) && !process.argv.includes("noimage")) {
                  const uploadPassportButtonSelector = "#wrapper > div.gwt-DialogBox > div > table > tbody > tr.dialogMiddle > td.dialogMiddleCenter > div > div > div > table > tbody > tr:nth-child(4) > td > table > tbody > tr > td:nth-child(2) > table > tbody > tr > td:nth-child(2) > table > tbody > tr > td > table > tbody > tr:nth-child(3) > td > button";
                  await page.click(uploadPassportButtonSelector);
                  // const passportSelector = "#wrapper > div:nth-child(16) > div > table > tbody > tr.dialogMiddle > td.dialogMiddleCenter > div > table > tbody > tr:nth-child(1) > td > table > tbody > tr > td:nth-child(2) > table > tbody > tr:nth-child(2) > td > div > table > tbody > tr > td:nth-child(1) > form > div > input"
                  await page.waitForXPath("//*[@id='wrapper']/div[5]/div/table/tbody/tr[2]/td[2]/div/table/tbody/tr[1]/td/table/tbody/tr/td[2]/table/tbody/tr[2]/td/div/table/tbody/tr/td[1]/form/div/input")

                  futureFileChooser = page.waitForFileChooser();
                  const uplodButton2 = await page.$x("//*[@id='wrapper']/div[5]/div/table/tbody/tr[2]/td[2]/div/table/tbody/tr[1]/td/table/tbody/tr/td[2]/table/tbody/tr[2]/td/div/table/tbody/tr/td[1]/form/div/input")
                  await uplodButton2.evaluate(e => e.click());
                  // await page.evaluate(() =>
                  //   document.querySelector("#wrapper > div:nth-child(16) > div > table > tbody > tr.dialogMiddle > td.dialogMiddleCenter > div > table > tbody > tr:nth-child(1) > td > table > tbody > tr > td:nth-child(2) > table > tbody > tr:nth-child(2) > td > div > table > tbody > tr > td:nth-child(1) > form > div > input").click()
                  // );
                  fileChooser = await futureFileChooser;
                  await fileChooser.accept([resizedPassportFile]);
                  await page.waitForSelector("#wrapper > div:nth-child(18) > div > table > tbody > tr.dialogMiddle > td.dialogMiddleCenter > div > table > tbody > tr:nth-child(2) > td > div > div > table > tbody > tr > td > div > div > div.GDECWS3CF > img");

                }
                // // BEGIN Vaccine UPLOAD
                // const vaccineSelector = "#wrapper > div.gwt-DialogBox > div > table > tbody > tr.dialogMiddle > td.dialogMiddleCenter > div > div > div > table > tbody > tr:nth-child(7) > td > table > tbody > tr:nth-child(1) > td > table > tbody > tr:nth-child(12) > td:nth-child(3) > table > tbody > tr:nth-child(2) > td > div > table > tbody > tr > td:nth-child(1) > form > div > input"
                // const passportPath = path.join(
                //   util.passportsFolder,
                //   `${passenger.passportNumber}.jpg`
                // );
                // await util.downloadImage(passenger.images.passport, passportPath);
                // if (fs.existsSync(passportPath)) {
                //   futureFileChooser = page.waitForFileChooser();
                //   await page.click(vaccineSelector)
                //   // await page.evaluate(() =>
                //   //   document.querySelector("#wrapper > div:nth-child(17) > div > table > tbody > tr.dialogMiddle > td.dialogMiddleCenter > div > table > tbody > tr:nth-child(1) > td > table > tbody > tr > td:nth-child(2) > table > tbody > tr:nth-child(2) > td > div > table > tbody > tr > td:nth-child(1) > form > div > input").click()
                //   // );
                //   fileChooser = await futureFileChooser;
                //   let resizedPassportFile = path.join(
                //     util.passportsFolder,
                //     `${passenger.passportNumber}_400x300.jpg`
                //   );
                //   await sharp(passportPath)
                //     .resize(400, 300)
                //     .toFile(resizedPassportFile);
                //   await fileChooser.accept([resizedPassportFile]);
                // }

                // passport image button 
                // await page.click("#wrapper > div:nth-child(15) > div > table > tbody > tr.dialogMiddle > td.dialogMiddleCenter > div > div > div > table > tbody > tr:nth-child(4) > td > table > tbody > tr > td:nth-child(2) > table > tbody > tr > td:nth-child(2) > table > tbody > tr > td > table > tbody > tr:nth-child(3) > td > button")
                // "#wrapper > div:nth-child(15) > div > table > tbody > tr.dialogMiddle > td.dialogMiddleCenter > div > div > div > table > tbody > tr:nth-child(4) > td > table > tbody > tr > td:nth-child(2) > table > tbody > tr > td:nth-child(2) > table > tbody > tr > td > table > tbody > tr:nth-child(3) > td > button"

              } catch (err) {
                console.log(err.message);
              }
            }
          }
        },
      }, data.travellers);
      break;
    default:
      break;
  }
}

module.exports = { send };
