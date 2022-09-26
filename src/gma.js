const puppeteer = require("puppeteer-extra");
// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const fs = require("fs");
const path = require("path");
const util = require("./util");
const { getPath } = util;
const sharp = require("sharp");
const kea = require("./lib/kea");

let page;
let data;
let counter = 0;
let groupName = "";
let previousTableInfo = "dummy";
let status = "idle";

const mutamerConfig = {
  details: [
    { selector: "#txt_EnglishName1", value: (row) => row.name.first },
    { selector: "#txt_EnglishName2", value: (row) => row.name.father },
    { selector: "#txt_EnglishName3", value: (row) => row.name.grand },
    { selector: "#txt_EnglishName4", value: (row) => row.name.last },
    { selector: "#txt_PassportNumber", value: (row) => row.passportNumber },
    { selector: "#ddl_Titles", value: (row) => "99" },
    {
      selector: "#ddl_Gender",
      value: (row) => (row.gender == "Female" ? "2" : "1"),
    },
    { selector: "#ddl_BirthCountry", value: (row) => row.nationality.telCode },
    { selector: "#ddl_Nationality", value: (row) => row.nationality.code },
    {
      selector: "#ddl_RelationShip",
      value: (row) => row.gender == "Female" && "15",
    },

    { selector: "#ddl_IssueCountry", value: (row) => row.nationality.code },
    {
      selector: "#txt_Occupation",
      value: (row) => decodeURI(row.profession || "unknown"),
    },
    { selector: "#ddl_MaritalStatus", value: (row) => "99" },
    { selector: "#ddl_EducationalLevel", value: (row) => "99" },
    {
      selector: "#txt_BirthCity",
      value: (row) => decodeURI(row.birthPlace) || "unknown",
    },
    {
      selector: "#txt_ArabicName1",
      value: (row) => row.nameArabic.first,
    },
    {
      selector: "#txt_ArabicName4",
      value: (row) => row.nameArabic.last,
    },
    {
      selector: "#txt_ArabicName3",
      value: (row) => row.nameArabic.grand,
    },
    {
      selector: "#txt_ArabicName2",
      value: (row) => row.nameArabic.father,
    },
    {
      selector: "#txt_IssueDate",
      setValueDirectly: true,
      value: (row) =>
        `${row.passIssueDt.yyyy}/${row.passIssueDt.mm}/${row.passIssueDt.dd}`,
    },
    {
      selector: "#txt_ExpiryDate",
      setValueDirectly: true,
      value: (row) =>
        `${row.passExpireDt.yyyy}/${row.passExpireDt.mm}/${row.passExpireDt.dd}`,
    },
    {
      selector: "#txt_BirthDate",
      setValueDirectly: true,
      value: (row) => `${row.dob.yyyy}/${row.dob.mm}/${row.dob.dd}`,
    },
    {
      selector: "#txt_IssueCity",
      value: (row) => decodeURI(row.placeOfIssue),
    },
  ],
};

const config = [
  {
    name: "login",
    url: "https://eumra.com/login.aspx",
    details: [
      { selector: "#LoginName", value: (system) => system.username },
      { selector: "#password", value: (system) => system.password },
    ],
  },
  {
    name: "download",
    url: "https://eumra.com/homepage.aspx?P=downloads",
  },
  {
    name: "uploader",
    url: "https://eumra.com/homepage.aspx?P=auploader",
  },
  {
    name: "main",
    url: "https://eumra.com/homepage.aspx?P=DashboardClassic",
  },
  {
    name: "create-group-or-mutamer",
    url: "https://eumra.com/auploader.aspx#/tab1_1",
    controller: {
      selector: "#li1_2",
      action: async () => {
        const selectedTraveller = await page.$eval(
          "#hajonsoft_select",
          (el) => el.value
        );
        if (selectedTraveller) {
          try {
            await page.click(
              "#tab1_1 > div:nth-child(4) > div > div > button.btn.btn-warning"
            );
            util.setSelectedTraveller(selectedTraveller);
            const dataRaw = fs.readFileSync(getPath("data.json"), "utf-8");
            var data = JSON.parse(dataRaw);
            var passenger = data.travellers[selectedTraveller];
            sendPassenger(passenger);
          } catch (err) {
            console.log(err.message);
          }
        }
      },
    },
  },
];

async function sendPassenger(passenger) {
  try {
    // Check if pax exists by filtering by passport number
    const searchSelector = "#tableGroupMutamers_filter input[type='search']"
    await page.focus(searchSelector);
    await page.type(searchSelector, passenger.passportNumber);
    await page.waitForTimeout(2000)
    const filterResults = await page.$eval(
      "#tableGroupMutamers_info",
      (el) => el.innerText
    );
    const exists = filterResults && filterResults.match(/Showing [1-9]+/);

    // Clear search
    const input = await page.$(searchSelector);
    await input.click({ clickCount: 3 })
    await page.keyboard.press('Backspace')
    await page.waitForTimeout(2000)

    if(exists) {
      console.log(`Skipping ${passenger.slug}, already exists.`)

      // Update kea status
      await await kea.updatePassenger(
        data.system.accountId,
        passenger.passportNumber,
        {
          "submissionData.gma.status": "Submitted",
        }
      );

      await proccedToNextPassenger()
      return
    }
  } catch {}

  status = "sending";
  // select group if not selected
  const groupSelector = "#ddl_EAGroups";
  const selectedGroup = await page.$eval(groupSelector, (el) => el.value);
  if (!selectedGroup || selectedGroup == "0") {
    const options = await page.$eval(groupSelector, (e) => e.innerHTML);
    const valuePattern = new RegExp(`value="(.*)".*?>.*?${groupName}</option>`, "im");
    const found = valuePattern.exec(options.replace(/\n/gim, ""));
    if (found && found.length >= 2) {
      await page.select(groupSelector, `${found?.[1]?.split("=")[1].replace(/["']/gim, "")}`);
    }
  }

  await page.evaluate(
    () => (document.querySelector("#txt_Mrz").disabled = false)
  );
  await page.type("#txt_Mrz", passenger.codeline || "codeline missing");
  await util.toggleBlur(page);
  const titleMessage = `Eagle: send.. ${
    parseInt(util.getSelectedTraveler()) + 1
  }/${data.travellers.length}-${passenger?.name?.last}`;
  util.infoMessage(page, titleMessage);
  await page.waitForTimeout(5000)
  await util.commit(page, mutamerConfig.details, passenger);
  for (const field of mutamerConfig.details) {
    await page.$eval(field.selector, (e) => {
      e.removeAttribute("readonly");
      e.removeAttribute("disabled");
    });
  }
  await page.click("#CodeNumberTextBox");
  let photoPath = path.join(
    util.photosFolder,
    `${passenger.passportNumber}.jpg`
  );

  await util.downloadImage(passenger.images.photo, photoPath);
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
  if (!process.argv.includes("noimage")) {
    await util.commitFile("#img_Mutamer", resizedPhotoPath);
  }

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
    .resize(400, 300, {
      fit: sharp.fit.inside,
      withoutEnlargement: true,
    })
    .toFile(resizedPassportFile);

  await page.waitForSelector("#Mutamer_imgPP");
  if (!process.argv.includes("noimage")) {
    await util.commitFile("#img_MutamerPP", resizedPassportFile);
  }
  await util.toggleBlur(page,false);

  await captchaAndSave(page)
}

async function captchaAndSave(page) {
  const passenger = data.travellers[util.getSelectedTraveler()];
  const token = await util.commitCaptchaToken(
    page,
    "imgCaptcha",
    "#CodeNumberTextBox",
    5
  );
  await util.pauseMessage(page);
  if (token) {
    await page.click(
      "#tab1_1 > div:nth-child(4) > div > div > button.btn.btn-success"
    );
    await page.waitForTimeout(2000)
    util.infoMessage(page, "Save clicked", 2, false, true)
  }
  await util.pauseForInteraction(page, 10000);
  const isTableExist = await page.$("#tableGroupMutamers_info");
  let tableInfo;
  if (isTableExist) {
    tableInfo = await page.$eval(
      "#tableGroupMutamers_info",
      (el) => el.innerText
    );
  }
  console.log({previousTableInfo, tableInfo}, 'loop.txt', fs.existsSync(getPath("loop.txt")))
  if (previousTableInfo != tableInfo && fs.existsSync(getPath("loop.txt"))) {
    // Update kea status
    await kea.updatePassenger(
      data.system.accountId,
      passenger.passportNumber,
      {
        "submissionData.gma.status": "Submitted",
      }
    );
  }
  previousTableInfo = tableInfo;
  await proccedToNextPassenger();
}

async function proccedToNextPassenger() {
  const nextTraveller = util.incrementSelectedTraveler();
  const nextPassenger = data.travellers[nextTraveller];
  if (nextPassenger) {
    sendPassenger(nextPassenger);
  } else {
    console.log("Exiting in 5 seconds...");
    setTimeout(() => {
      process.exit(0);
    }, 5000)
  }
}

async function send(sendData) {
  data = sendData;
  page = await util.initPage(config, onContentLoaded);
  await page.goto(config[0].url, { waitUntil: "domcontentloaded" });

  // Read save group response for id
  page.on('response', response => {
    if(response.url() === "https://eumra.com/auploader.aspx/SaveGroup") {
      response.text().then(body => {
        // eg. {"d":[{"Errcode":0,"Key":27675,"ErrDescription":"KEY=27675"},{"Errcode":0,"Key":27675,"ErrDescription":"Success"}]}
        const data = JSON.parse(body);
        const [res1, res2] = data.d
        if(res2.ErrDescription === "Success") {
          // Write group id to submission
          const targetGroupId = parseInt(res2.Key,10)
          global.submission.targetGroupId = targetGroupId;
          kea.updateSubmission({
            targetGroupId,
          });

        }
      })
    }
  })

  // Dsimiss invalid captch message
  page.on("dialog", async (dialog) => {
    console.log("dialog message: ", dialog.message());
    if (dialog.message().match(/invalid captcha/i)) {
      await dialog.accept();
      captchaAndSave(page)
    }
  });
    
}

async function onContentLoaded(res) {
  counter = util.useCounter(counter);
  if (counter >= data?.travellers?.length) {
    return;
  }
  const currentConfig = util.findConfig(await page.url(), config);
  try {
    await runPageConfiguration(currentConfig);
  } catch (err) {
    console.log(err);
  }
}

async function runPageConfiguration(currentConfig) {
  switch (currentConfig.name) {
    case "login":
      await util.commit(page, currentConfig.details, data.system);

      const token = await util.commitCaptchaToken(
        page,
        "imgCaptcha",
        "#CodeNumberTextBox",
        5
      );
        await util.pauseMessage(page);

      if (token) {
        await page.click("#btn_Login");
      }

      break;
    case "main":
    case "download":
    case "uploader":
      await page.goto("https://eumra.com/auploader.aspx#/tab1_1", {
        waitUntil: "networkidle2",
      });
      break;
    case "create-group-or-mutamer":
      
      let editGroupRowIndex = null;
      const targetGroupId = global.submission.targetGroupId
      if(targetGroupId) {
          // If submission has group id, go to that group
          // Get more groups in table
          await page.select("select[name='table_Groups_length']", "100")
          await page.waitForTimeout(5000)
          
          editGroupRowIndex = await page.$$eval("#table_Groups tbody tr", (rows, targetGroupId) => {
            console.log(`found ${rows.length} rows`)
            for(let i = 0; i < rows.length; i += 1) {
              const tr = rows[i];
              const td = tr.querySelector('td:nth-child(3)');
              const groupId = td.innerHTML
              if(parseInt(groupId,10) === parseInt(targetGroupId,10)) {
                return i
              }
            }
            return null;
          }, targetGroupId)
        }
        
      if(editGroupRowIndex !== null) {
        // Group already exists
        console.log(`Edit existing group ${targetGroupId}`)
        await page.click(`#table_Groups tbody tr:nth-child(${editGroupRowIndex + 1}) td:nth-child(13) > a:last-child`);
      } else {
        // Create group
        groupName = util.suggestGroupName(data);
        console.log(`Creating new group ${groupName}`)
        await util.commit(
          page,
          [
            {
              selector: "#txt_GroupName",
              value: () => groupName,
            },
          ],
          null
        );

        // select embassy here
        // #ddl_Consulates
        if (data.system.embassy) {
          const embassySelector = "#ddl_Consulates";
          await page.waitForTimeout(5000);
          const optionsEmbassy = await page.$eval(
            embassySelector,
            (e) => e.innerHTML
            );
            const valuePatternEmbassy = new RegExp(
              `value="(.*)">${data.system.embassy}.*?</option>`,
              "im"
            );
            const foundEmbassy = valuePatternEmbassy.exec(
              optionsEmbassy.replace(/\n/gim, "")
            );
            if (foundEmbassy && foundEmbassy.length >= 2) {
              await page.select(embassySelector, foundEmbassy[1]);
            }
        }

        await util.pauseMessage(page);
        await page.click("#btnUpdateGroup");
      }

      // Submit passenger
      await util.pauseMessage(page);
      await page.click("#li1_1 > a");

      await page.waitFor("#txt_PassportNumber", { visible: true });
      await util.controller(page, currentConfig, data.travellers);

      if (!fs.existsSync(getPath("loop.txt"))) {
        await util.pauseMessage(page, 5);
        if (status === "idle") {
          fs.writeFileSync(getPath("loop.txt"), "loop");
          const nextTraveller = util.getSelectedTraveler();
          sendPassenger(data.travellers[nextTraveller]);
        }
        return;
      }

      break;
    case "create-mutamer":
      // await util.commit(page, currentConfig.details, traveller);
      break;
    default:
      break;
  }
}

module.exports = { send };
