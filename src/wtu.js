const puppeteer = require("puppeteer-extra");
// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const _ = require("lodash");
const fs = require("fs");
const path = require("path");
const util = require("./util");
const moment = require("moment");
const sharp = require("sharp");
const budgie = require("./budgie");
const os = require("os");

let page;
let data;
let token;
let groupName;
let status = "";

const config = [
  {
    name: "login",
    regex: "https://www.waytoumrah.com/prj_umrah/eng/Eng_frmlogin.aspx",
    url: "https://www.waytoumrah.com/prj_umrah/eng/Eng_frmlogin.aspx",
    details: [
      { selector: "#txtUserName", value: (system) => system.username },
      { selector: "#txtPwd", value: (system) => system.password },
    ],
  },
  {
    name: "main",
    url: "https://www.waytoumrah.com/prj_umrah/Eng/Eng_Waytoumrah_EA.aspx",
  },
  {
    name: "create-group",
    regex:
      "https://www.waytoumrah.com/prj_umrah/Eng/Eng_frmGroup.aspx\\?PageId=M.*",
    details: [
      {
        selector: "#txtGrpdesc",
        value: (row) =>
          `${row.travellers?.[0].name?.first?.substring(
            0,
            10
          )}-${row.travellers?.[0].name?.last?.substring(0, 10)}-${os
            .hostname()
            .substring(0, 8)}${moment().format("mmss")}_${row.info.run}`,
      },
    ],
  },
  {
    name: "create-mutamer",
    url: "https://www.waytoumrah.com/prj_umrah/eng/eng_mutamerentry.aspx",
    controller: {
      selector:
        "#Table2 > tbody > tr > td > div > div > div > div.widget-title",
      action: async () => {
        const selectedTraveller = await page.$eval(
          "#hajonsoft_select",
          (el) => el.value
        );
        if (selectedTraveller) {
          util.setSelectedTraveller(selectedTraveller);
          sendPassenger(data.travellers[selectedTraveller]);
        }
      },
    },
    details: [
      {
        selector: "#ddlgroupname",
        value: (row) => groupName,
        autocomplete: "wtu_group",
      },
      { selector: "#ddltitle", value: (row) => "99" },
      { selector: "#ddlpptype", value: (row) => "1" },
      { selector: "#ddlbirthcountry", value: (row) => row.nationality.telCode },
      { selector: "#ddladdcountry", value: (row) => row.nationality.telCode },
      { selector: "#ddlhealth", value: (row) => "0" },
      {
        selector: "#txtprofession",
        value: (row) => decodeURI(row.profession),
        autocomplete: "wtu_profession",
      },
      { selector: "#ddlmstatus", value: (row) => "99" },
      { selector: "#ddleducation", value: (row) => "99" },
      {
        selector: "#txtbirthcity",
        value: (row) => decodeURI(row.birthPlace) || row.nationality.name,
      },
      {
        selector: "#txtAfirstname",
        value: (row) =>
          row?.nameArabic?.first?.match(/[a-zA-Z]/)
            ? ""
            : row?.nameArabic?.first,
      },
      {
        selector: "#txtAfamilyname",
        value: (row) =>
          row?.nameArabic?.last?.match(/[a-zA-Z]/) ? "" : row?.nameArabic?.last,
      },
      {
        selector: "#txtAgfathername",
        value: (row) =>
          row?.nameArabic?.grand?.match(/[a-zA-Z]/)
            ? ""
            : row?.nameArabic?.grand,
      },
      {
        selector: "#txtAfathername",
        value: (row) =>
          row?.nameArabic?.father?.match(/[a-zA-Z]/)
            ? ""
            : row?.nameArabic?.father,
      },
      {
        selector: "#txtppissdd",
        value: (row) => row.passIssueDt.dd,
      },
      {
        selector: "#ddlppissmm",
        txt: (row) => row.passIssueDt.mmm,
      },
      {
        selector: "#txtppissyy",
        value: (row) => row.passIssueDt.yyyy,
      },
      {
        selector: "#txtppisscity",
        value: (row) => decodeURI(row.placeOfIssue),
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
  const currentConfig = util.findConfig(await page.url(), config);
  try {
    await pageContentHandler(currentConfig);
  } catch (err) {
    console.log(err);
  }
}

async function pageContentHandler(currentConfig) {
  const lastIndex = util.getSelectedTraveler();
  const passenger = data?.travellers?.[parseInt(lastIndex)];
  switch (currentConfig.name) {
    case "login":
      await util.commit(page, currentConfig.details, data.system);
      // use selector or Id for the image
      page.evaluate("document.title='Eagle: Captcha thinking'");
      await page.waitForTimeout(3000);
      token = await util.commitCaptchaTokenWithSelector(
        page,
        "#Panel1 > div:nth-child(6) > div > img",
        "#txtImagetext",
        6
      );

      if (!token) {
        page.evaluate("document.title='Eagle: Captcha Failed'");
        return;
      }
      page.evaluate("document.title='Eagle: Captcha solved'");

      await page.waitForTimeout(5000);
      await page.click("#cmdlogin");
      await page.waitForTimeout(2000);
      const isIDo = await page.$("#Button4");
      if (isIDo) {
        await page.click('aria/button[name="Yes, I DO"]');
      }
      break;
    case "main":
      // set document title
      util.infoMessage(page, "Redirect in 10 seconds);
      await page.waitForTimeout(10000);
      // Continue only if still on the same page
      if (
        currentConfig.name ===
        (await util.findConfig(await page.url(), config)).name
      ) {
        await page.goto(
          "https://www.waytoumrah.com/prj_umrah/Eng/Eng_frmGroup.aspx?PageId=M"
        );
      }
      break;
    case "create-group":
      await util.commit(page, currentConfig.details, data);
      const firstOption = await page.$eval("#cmbEmb", (e) => {
        const options = e.querySelectorAll("option");
        for (const opt of options) {
          if (opt.value && /[0-9]/.test(opt.value)) {
            return { value: opt.value, label: opt.innerText };
          }
        }
      });
      if (firstOption) {
        await page.$eval(
          "#cmbEmb_chosen > a > span",
          (e, val) => (e.innerText = val),
          firstOption.label
        );
        await page.select("#cmbEmb", firstOption.value);
      }

      await page.focus("#BtnSave");
      await page.hover("#BtnSave");
      // update title
      await page.evaluate("document.title='Eagle: pause 15 seconds'");
      setTimeout(async () => {
        const url = await page.url();
        const createGroupRegex = config.find(
          (c) => c.name === "create-group"
        ).regex;
        if (new RegExp(createGroupRegex).test(url)) {
          try {
            await page.click("#BtnSave");
          } catch { }
        }
      }, 15000);

      // Wait for this string: Group saved successfully, Group code is 153635
      const groupCreatedSuccessfullyElement =
        "body > div.lobibox.lobibox-success.animated-super-fast.zoomIn > div.lobibox-body > div.lobibox-body-text-wrapper > span";
      await page.waitForSelector(groupCreatedSuccessfullyElement, {
        visible: true,
        timeout: 0,
      });
      const groupCreatedSuccessfullyElementText = await page.$eval(
        groupCreatedSuccessfullyElement,
        (el) => el.innerText
      );
      const numberMatch = groupCreatedSuccessfullyElementText.match(/\d+/g);
      if (numberMatch) {
        groupName = numberMatch[0];
        budgie.save("wtu_group", groupName);
      }

      await page.goto(
        "https://www.waytoumrah.com/prj_umrah/eng/eng_mutamerentry.aspx"
      );
      break;
    case "create-mutamer":
      await page.emulateVisionDeficiency("none");
      await util.controller(page, currentConfig, data.travellers);
      if (fs.existsSync("./loop.txt")) {
        return sendPassenger(passenger);
      }

      await page.evaluate("document.title='Eagle: Pause 10 seconds'");
      await page.waitForTimeout(10000);

      setTimeout(() => {
        if (status === "") {
          fs.writeFileSync("./loop.txt", "1");
          sendPassenger(passenger);
        }
      }, 10000);

      break;
    default:
      break;
  }
}

async function sendPassenger(passenger) {
  util.infoMessage(page, `sending ${passenger?.slug}`);
  status = "sending";
  await page.emulateVisionDeficiency("none");
  // await page.emulateVisionDeficiency("blurredVision");
  const titleMessage = `sending ${parseInt(util.getSelectedTraveler()) + 1
    }/${data.travellers.length}-${passenger?.slug}`;
  await util.infoMessage(page, titleMessage);

  await page.waitForSelector("#txtppno");
  if (await page.$("#txtppno")) {
    const passportNumber = await page.$eval("#txtppno", (e) => e.value);
    // Do not continue if the passport number field is not empty - This could be a manual page refresh
    if (passportNumber || util.isCodelineLooping(passenger)) {
      return;
    }
  } else {
    return;
  }
  await page.waitForSelector("#ddlgroupname");
  if (!groupName) {
    groupName = budgie.get("wtu_group");
  }

  const submittionName = `${data.travellers?.[0].name?.first?.substring(
    0,
    10
  )}-${data.travellers?.[0].name?.last?.substring(0, 10)}-${os
    .hostname()
    .substring(0, 8)}`;

  util.infoMessage(page, `group 👨‍👩‍👦  ${submittionName}[${groupName}]: Attention!!!Embassy-first-option`);
  await page.select("#ddlgroupname", groupName);
  await page.waitForTimeout(3000);
  await page.waitForSelector("#btnppscan");
  await page.evaluate(() => {
    const divBtn = document.querySelector("#btnppscan");
    if (divBtn) {
      divBtn.click();
    }
  });

  await page.waitForSelector("#divshowmsg");
  util.infoMessage(page, `Passport ${passenger.passportNumber} scanned 👍`);
  await page.type("#divshowmsg", passenger.codeline, {
    delay: 0,
  });
  await page.emulateVisionDeficiency("none");

  await page.waitForTimeout(5000);
  await util.commit(
    page,
    config.find((c) => c.name === "create-mutamer").details,
    passenger
  );
  if (passenger.gender == "Female") {
    try {
      await page.waitForSelector("#ddlrelation");
      await page.select("#ddlrelation", "15");
    } catch { }
  }

  let resizedPhotoPath = await util.downloadAndResizeImage(
    passenger,
    200,
    200,
    "photo",
    4,
    17
  );
  const resizedPassportPath = await util.downloadAndResizeImage(
    passenger,
    400,
    300,
    "passport"
  );

  resizedPhotoPath = util.getOverridePath(
    resizedPhotoPath,
    path.join(__dirname, `../photos/${passenger.passportNumber}.jpg`)
  );

  await page.click("#btn_uploadImage");
  util.infoMessage(page, "Uploading photo", 4);
  await page.waitForTimeout(2000);
  await util.commitFile("#file_photo_upload", resizedPhotoPath);
  await page.waitForTimeout(2000);
  try {
    const isProceedBtn = await page.$("#btnProceedtoUpload");
    if (isProceedBtn) {
      util.infoMessage(page, "Proceeding to upload photo", 6);
      await page.$eval("#btnProceedtoUpload", (e) => e.click());
    }
    await page.waitForNavigation();
  } catch (err) {
    console.log("Canvas: dummy-passport-exception");
  }

  // Upload the passport image
  await page.waitForSelector("#imgppcopy");
  await util.commitFile("#fuppcopy", resizedPassportPath);
  util.infoMessage(page, "Uploading passport", 4);
  // scroll to bottom
  await page.evaluate("window.scrollTo(0, document.body.scrollHeight)");

  token = await util.commitCaptchaTokenWithSelector(
    page,
    "#imgtxtsv",
    "#txtImagetext",
    5
  );
  await util.sniff(
    page,
    config.find((c) => c.name == "create-mutamer")?.details
  );
  // This is assumed. fix starting from here. Because passports can succeed from the first time - check if this is a new page refresh?
  // TODO: Wait for success message before advancing the counter
  try {
    await page.waitForSelector("#btnsave");
    await page.click("#btnsave"); // TODO: Make sure this is not a full page refresh
    // Wait for this string: Mutamer saved successfully
    await page.waitForSelector(
      "body > div.lobibox-notify-wrapper > div.lobibox-notify.lobibox-notify-success",
      {
        timeout: 10000,
      }
    );
    // Store submitted reason in kea
    util.updatePassengerInKea(data.system.accountId, passenger.passportNumber, {
      "submissionData.wtu.status": "Submitted",
    });
  } catch { }

  // If there is a passport number still that means it is the same page
  await page.waitForTimeout(2000);
  await page.waitForSelector("#txtppno");
  const pn = await page.$eval("#txtppno", (e) => e.value);
  if (!pn) {
    util.incrementSelectedTraveler();
    return page.goto(
      "https://www.waytoumrah.com/prj_umrah/eng/eng_mutamerentry.aspx"
    );
  }

  // If there is a passport number still that means it is the same page

  // Passenger rejected
  const errorMessageSelector =
    "body > div.lobibox.lobibox-error.animated-super-fast.zoomIn > div.lobibox-body > div.lobibox-body-text-wrapper > span";
  const isError = await page.$(errorMessageSelector);

  // Store error reason in kea
  if (isError) {
    util.updatePassengerInKea(data.system.accountId, passenger.passportNumber, {
      "submissionData.wtu.status": "Rejected",
      "submissionData.wtu.rejectionReason": await page.$eval(
        errorMessageSelector,
        (el) => el.textContent
      ),
    });
    const errorButton = await page.waitForSelector(
      "body > div.lobibox.lobibox-error.animated-super-fast.zoomIn > div.lobibox-footer.text-center > button"
    );

    await errorButton.click();
  }

  // Use fake passport image
  const blankPassportPath = `./${passenger.passportNumber}_mrz.jpg`;
  // Generate fake passport image using the browser canvas api
  const dataUrl = await page.evaluate((_passenger) => {
    const ele = document.createElement("canvas");
    ele.id = "hajonsoftcanvas";
    ele.style.display = "none";
    document.body.appendChild(ele);
    const canvas = document.getElementById("hajonsoftcanvas");
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");
    // White background
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "black";
    // Font must be 11 to fit in the canvas
    ctx.font = "11px Verdana, Verdana, Geneva, sans-serif";
    ctx.fillText(
      _passenger.codeline?.replace(/\n/g, "")?.substring(0, 44),
      15,
      canvas.height - 45
    );
    ctx.fillText(
      _passenger.codeline?.replace(/\n/g, "")?.substring(44),
      15,
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

  await page.waitForSelector("#imgppcopy");
  await util.commitFile("#fuppcopy", blankPassportPath);
  util.infoMessage(page, "Uploading passport exception retry", 6);
  try {
    await util.commitCaptchaTokenWithSelector(
      page,
      "#imgtxtsv",
      "#txtImagetext",
      5
    );
    await page.click("#btnsave");
    await page.waitForSelector(
      "body > div.lobibox-notify-wrapper > div.lobibox-notify.lobibox-notify-success",
      {
        timeout: 10000,
      }
    );
    util.updatePassengerInKea(data.system.accountId, passenger.passportNumber, {
      "submissionData.wtu.status": "Submitted",
    });
    util.incrementSelectedTraveler();
    return page.goto(
      "https://www.waytoumrah.com/prj_umrah/eng/eng_mutamerentry.aspx"
    );
  } catch (err) {
    console.log("Canvas: dummy-passport-error", err);
  }
}

module.exports = { send };
