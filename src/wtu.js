const puppeteer = require("puppeteer-extra");
// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const fs = require("fs");
const path = require("path");
const kea = require("./lib/kea");
const util = require("./util");
const { getPath } = util;
const budgie = require("./budgie");
const os = require("os");
let page;
let data;
let token;
let groupName;
let status = "";
let passenger;

const getUserName = (system) => {
  const usernames = system.username.split(",");
  const index = global.run.index ?? 0;
  const username = usernames[index];
  if (!username) {
    console.log(`Could not find username: ${usernames} (index: ${index})`);
    process.exit(1);
  }
  return username;
};

const getPassword = (system) => {
  const passwords = system.password.split(",");
  const index = global.run.index ?? 0;
  const password = passwords[index];
  if (!password) {
    console.log(`Could not find password (index: ${index})`);
    process.exit(1);
  }
  return password;
};

const config = [
  {
    name: "login",
    regex: "https://www.waytoumrah.com/prj_umrah/eng/Eng_frmlogin.aspx",
    url: "https://www.waytoumrah.com/prj_umrah/eng/Eng_frmlogin.aspx",
    details: [
      { selector: "#txtUserName", value: (system) => getUserName(system) },
      { selector: "#txtPwd", value: (system) => getPassword(system) },
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
        value: (data) => util.suggestGroupName(data),
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
        value: (row) => global.submission.targetGroupId,
      },
      { selector: "#ddltitle", value: (row) => "99" },
      {
        selector: "#ddlpptype",
        value: (row) => (util.isTravelDocument(row) ? "3" : "1"),
      },
      {
        selector: "#ddlbirthcountry",
        value: (row) => row.nationality?.telCode,
      },
      { selector: "#ddladdcountry", value: (row) => row.nationality?.telCode },
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
  page = await util.initPage(config, onContentLoaded, data);

  page.on("dialog", async (dialog) => {
    // Accept the confirmation dialog, to prevent script hanging
    const message = dialog.message();
    console.log("dialog message: ", message);
    if (message.match(/Check points process failed for this passport/i)) {
      nextAction = "reject";
      rejectionReason = message;
    }
    await dialog.accept();
  });

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
  passenger = data?.travellers?.[parseInt(lastIndex)];
  if (!passenger) {
    return;
  }
  switch (currentConfig.name) {
    case "login":
      util.infoMessage(page, "Captcha thinking");
      await util.commit(page, currentConfig.details, data.system);
      await page.waitForTimeout(3000);
      token = await util.commitCaptchaTokenWithSelector(
        page,
        "#Panel1 > div:nth-child(6) > div > img",
        "#txtImagetext",
        6
      );

      if (!token) {
        util.infoMessage(page, "Captcha Failed");
        return;
      }

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
      await util.pauseMessage(page, 10);
      // Continue only if still on the same page
      if (
        currentConfig.name ===
        (await util.findConfig(await page.url(), config)).name
      ) {
        if (global.submission.targetGroupId) {
          // Group id exists, go to create mutamer page
          await page.goto(
            "https://www.waytoumrah.com/prj_umrah/eng/eng_mutamerentry.aspx"
          );
        } else {
          await page.goto(
            "https://www.waytoumrah.com/prj_umrah/Eng/Eng_frmGroup.aspx?PageId=M"
          );
        }
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

      await util.pauseMessage(page, 15);
      const url = await page.url();
      const createGroupRegex = config.find(
        (c) => c.name === "create-group"
      ).regex;
      if (new RegExp(createGroupRegex).test(url)) {
        try {
          await page.click("#BtnSave");
        } catch {}
      }

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

        // Save group id to kea
        global.submission.targetGroupId = groupName;
        kea.updateSubmission({
          targetGroupId: groupName,
        });
      }

      await page.goto(
        "https://www.waytoumrah.com/prj_umrah/eng/eng_mutamerentry.aspx"
      );
      break;
    case "create-mutamer":
      await util.toggleBlur(page, false);
      await util.controller(page, currentConfig, data.travellers);
      if (fs.existsSync(getPath("loop.txt"))) {
        return sendPassenger(passenger);
      }

      await util.pauseForInteraction(page, 10);

      if (status === "") {
        fs.writeFileSync(getPath("loop.txt"), "1");
        sendPassenger(passenger);
      }

      break;
    default:
      break;
  }
}
async function isServerError(page) {
  try {
    await page.waitForSelector("body > span > h1", {
      timeout: 1000,
    });
    const serverErrorText = await page.$eval(
      "body > span > h1",
      (el) => el.innerText
    );
    if (serverErrorText.match(/Server Error/i)) {
      console.log("checkForServerError: found error");
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}
async function getErrorIfExists() {
  try {
    const errorSelector =
      "body > div.lobibox.lobibox-error.animated-super-fast.zoomIn > div.lobibox-body > div.lobibox-body-text-wrapper > span";
    await page.waitForSelector(errorSelector, {
      timeout: 5000,
    });
    const errorReason = await page.$eval(errorSelector, (e) => e.textContent);
    util.infoMessage(page, `Error: ${errorReason}`);

    // dismiss the error
    const errorButton = await page.waitForSelector(
      "body > div.lobibox.lobibox-error.animated-super-fast.zoomIn > div.lobibox-footer.text-center > button"
    );
    await errorButton.click();
    return errorReason;
    // // await page.waitForTimeout(10000);

    // // Check for captcha error, Reload and try again
    // const isCaptchaError = errorReason.match(
    //   /(Please Enter Image Text)|(Sorry, mismatch images text)/i
    // );

    // if (isCaptchaError) {
    //   console.log("Captcha error, reload page to trying again in 10 seconds");
    //   await page.waitForTimeout(10000); // Wait for other timeouts to finish
    //   await page.goto(
    //     "https://www.waytoumrah.com/prj_umrah/eng/eng_mutamerentry.aspx"
    //   );
    //   return true;
    // }

    // // Check for passenger exists error, assume submitted already
    // const passengerExists = errorReason.match(
    //   /Passport No. cannot be repeated in the same group/i
    // );

    // if (passengerExists) {
    //   await kea.updatePassenger(
    //     data.system.accountId,
    //     passenger.passportNumber,
    //     {
    //       "submissionData.wtu.status": "Submitted",
    //     }
    //   );

    //   console.log("checkForError: Exists, next passenger in 10 seconds");
    //   await page.waitForTimeout(10000); // Wait for other timeouts to finish
    //   util.incrementSelectedTraveler();
    //   await page.goto(
    //     "https://www.waytoumrah.com/prj_umrah/eng/eng_mutamerentry.aspx"
    //   );
    //   return true;
    // }

    // // ALl other errors
    // await kea.updatePassenger(data.system.accountId, passenger.passportNumber, {
    //   "submissionData.wtu.status": "Rejected",
    //   "submissionData.wtu.rejectionReason": errorReason,
    // });

    // // dismiss the error
    // const errorButton = await page.waitForSelector(
    //   "body > div.lobibox.lobibox-error.animated-super-fast.zoomIn > div.lobibox-footer.text-center > button"
    // );

    // await errorButton.click();

    // // Try with dummy passport
    // const keepGoing = errorReason.match(
    //   /Sorry, There is a mismatch between data scanned and passport copy/i
    // );
    // if (keepGoing && keepGoingOnMismatchError) {
    //   console.log("checkForError: keep going");
    //   // No error
    //   return false;
    // } else {
    //   console.log(
    //     `checkForError: ${errorReason}, next passenger in 10 seconds`
    //   );
    //   await page.waitForTimeout(10000); // Wait for other timeouts to finish
    //   util.incrementSelectedTraveler();
    //   await page.goto(
    //     "https://www.waytoumrah.com/prj_umrah/eng/eng_mutamerentry.aspx"
    //   );
    //   return true;
    // }
  } catch (e) {
    return false;
  }
}

async function hasSucceeded() {
  try {
    await page.waitForSelector(
      "body > div.lobibox-notify-wrapper > div.lobibox-notify.lobibox-notify-success",
      {
        timeout: 1000,
      }
    );
    return true;
    // // Store submitted reason in kea
    // await kea.updatePassenger(data.system.accountId, passenger.passportNumber, {
    //   "submissionData.wtu.status": "Submitted",
    // });
    // console.log(
    //   "checkForSuccess: Detected success, next passenger in 10 seconds"
    // );
    // await page.waitForTimeout(10000); // Wait for other timeouts to finish
    // util.incrementSelectedTraveler();
    // page.goto("https://www.waytoumrah.com/prj_umrah/eng/eng_mutamerentry.aspx");
    // return true;
  } catch (e) {
    return false;
  }
}

async function rejectAndProceed() {
  // Mark as rejected
  await kea.updatePassenger(data.system.accountId, passenger.passportNumber, {
    "submissionData.wtu.status": "Rejected",
    "submissionData.wtu.rejectionReason": rejectionReason,
  });
  // Move next
  util.incrementSelectedTraveler();
  await restart();
}

/**
 * Array of actions, keyed by passenger id
 * type SendLog = {[key: string]:TAction[]}
 */
const sendLog = {};
/**
 * type TAction = "init" | "restart" | "next" | "commit-passenger-data" | "commit-mahram" | "upload-photo" | "upload-passport" | "save" | "upload-dummy-passport" | "save-with-dummy-passport"
 */
let currentAction = "init";
let prevAction;
let nextAction;
let rejectionReason;

async function determineCurrentAction() {
  // Check for serverError
  if (await isServerError()) {
    return "restart";
  }

  // Check for success
  if (await hasSucceeded()) {
    return "success";
  }

  // Check for errors
  const error = await getErrorIfExists();
  if (error) {
    rejectionReason = error;
    // Captcha error
    if (
      error.match(/(Please Enter Image Text)|(Sorry, mismatch images text)/i)
    ) {
      return "restart";
    }

    // Passenger exists
    if (error.match(/Passport No. cannot be repeated in the same group/i)) {
      return "success";
    }

    // Passport mismatch, try with dummy passport
    if (
      error.match(
        /Sorry, There is a mismatch between data scanned and passport copy/i
      )
    ) {
      return "commit-dummy-passport-image";
    }

    // Any other error should reject current passenger
    return "reject";
  }

  if (!nextAction) {
    return "init";
  }

  return nextAction;
}

function logAction() {
  if (!sendLog[passenger.passportNumber]) {
    sendLog[passenger.passportNumber] = [];
  }
  sendLog[passenger.passportNumber].push(currentAction);
  console.log(`[${passenger.slug}] currentAction`, currentAction);
}

async function restart() {
  await page.waitForTimeout(10000); // Wait for other timeouts to finish
  const url = config.find((c) => c.name === "create-mutamer").url;
  await page.goto(url);
}

async function sendPassenger(passenger) {
  // Actions to perform on every page load
  await onEveryPageLoad(page, passenger);

  // Determine the acton to perform for the current page load
  currentAction = await determineCurrentAction();

  // Log the action
  logAction();

  // Perform the action
  switch (currentAction) {
    case "init":
      // Break any infinite loops
      if (util.isCodelineLooping(passenger, 4)) {
        util.infoMessage(page, "Tried passenger 5 times, moving on");
        util.incrementSelectedTraveler();
        await restart();
      }

      // First page load for this passenger
      // Scan the passport mrz
      await page.waitForSelector("#ddlgroupname");
      await page.select("#ddlgroupname", global.submission.targetGroupId);
      const groupName = util.suggestGroupName(data);
      util.infoMessage(
        page,
        `👨‍👩‍👦  ${groupName}: Attention!!!Embassy-first-option`
      );
      // Wait for scan button and click it
      await page.waitForSelector("#btnppscan");
      await page.evaluate(() => {
        const divBtn = document.querySelector("#btnppscan");
        if (divBtn) {
          divBtn.click();
        }
      });

      // Wait for input and type in mrz
      await page.waitForSelector("#divshowmsg");
      util.infoMessage(page, `Passport ${passenger.passportNumber} scanned 👍`);
      await page.type("#divshowmsg", passenger.codeline, {
        delay: 0,
      });

      // Page load is triggered, specify next action
      nextAction = "commit-passenger-data";
      break;

    case "commit-passenger-data":
      // MRZ has been scanned, now we need to commit the passenger data
      // Fill in the form
      await util.commit(
        page,
        config.find((c) => c.name === "create-mutamer").details,
        passenger
      );

      await page.waitForTimeout(5000);
      // Handle filling in the issue date
      await page.waitForSelector("#ddlppissmm");
      if (passenger.passIssueDt.mm.startsWith("0")) {
        await page.select(
          "#ddlppissmm",
          `${passenger.passIssueDt.mm.substring(1)}`
        );
      } else {
        await page.select("#ddlppissmm", passenger.passIssueDt?.mm);
      }

      // Handle mahram details
      if (passenger.gender == "Female") {
        try {
          await page.waitForSelector("#ddlrelation");
          await page.select("#ddlrelation", "15");
        } catch {}
      }

      // Resize photo
      let resizedPhotoPath = await util.downloadAndResizeImage(
        passenger,
        200,
        200,
        "photo",
        4,
        17
      );

      resizedPhotoPath = util.getOverridePath(
        resizedPhotoPath,
        path.join(__dirname, `../photos/${passenger.passportNumber}.jpg`)
      );

      // Upload photo
      await page.click("#btn_uploadImage");
      util.infoMessage(page, "🌄 Uploading photo", 4);
      await page.waitForTimeout(2000);
      await util.commitFile("#file_photo_upload", resizedPhotoPath);
      await page.waitForTimeout(2000);
      try {
        const isProceedBtn = await page.$("#btnProceedtoUpload");
        if (isProceedBtn) {
          util.infoMessage(page, "Proceeding to upload photo", 6);
          await page.$eval("#btnProceedtoUpload", (e) => e.click());
        }

        // Page load is triggered, specify next action
        nextAction = "commit-passport-image";
      } catch (err) {
        console.log("Canvas: passport-photo-exception", err.message);
        await restart();
      }
      break;
    case "commit-passport-image":
      // Passenger data has been committed
      // Upload passport image
      const resizedPassportPath = await util.downloadAndResizeImage(
        passenger,
        400,
        300,
        "passport"
      );
      await page.waitForSelector("#imgppcopy");
      await util.commitFile("#fuppcopy", resizedPassportPath);
      util.infoMessage(page, "🌇 Uploading passport", 4);

      // Scroll to bottom
      await page.evaluate("window.scrollTo(0, document.body.scrollHeight)");

      await util.commitCaptchaTokenWithSelector(
        page,
        "#imgtxtsv",
        "#txtImagetext",
        5
      );
      await util.sniff(
        page,
        config.find((c) => c.name == "create-mutamer")?.details
      );

      // Click save
      await page.waitForSelector("#btnsave");
      await page.click("#btnsave");

      // Check for client side validation errors
      const error = await getErrorIfExists();
      if (error) {
        await rejectAndProceed();
      }

      // Assume success, so we don't specfiy next action
      // Any failure, retries or success is picked up on page reload
      break;

    case "commit-dummy-passport-image":
      // First passport image was rejected, use a dummy image
      const blankPassportPath = getPath(`${passenger.passportNumber}_mrz.jpg`);
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
      util.infoMessage(page, "🌇 Uploading passport exception", 6);
      try {
        await util.commitCaptchaTokenWithSelector(
          page,
          "#imgtxtsv",
          "#txtImagetext",
          5
        );

        await page.select("#ddlgroupname", global.submission.targetGroupId);
        await page.click("#btnsave");

        // Check for client side validation errors
        const error = await getErrorIfExists();
        if (error) {
          await rejectAndProceed();
        }

        // Assume success, so we don't specfiy next action
        // Any failure, retries or success is picked up on page reload
      } catch (err) {
        util.infoMessage(page, "Canvas: dummy-passport-error", 7);
        await rejectAndProceed();
      }
      break;

    case "reject":
      await rejectAndProceed();
      break;

    case "success":
      // Mark as submitted
      await kea.updatePassenger(
        data.system.accountId,
        passenger.passportNumber,
        {
          "submissionData.wtu.status": "Submitted",
        }
      );
      // Move next
      util.incrementSelectedTraveler();
      await restart();
      break;

    case "restart":
      // Restart with current passenger
      await restart();
      break;

    default:
      break;
  }

  return;

  // Check if finished

  if (await checkForServerError(page)) {
    return;
  }
  // Check for success, move on if true
  if (await checkForSuccess(page, passenger)) {
    return;
  }

  // Handle reload while sending
  await page.waitForSelector("#txtppno");
  if (await page.$("#txtppno")) {
    const passportNumber = await page.$eval("#txtppno", (e) => e.value);
    // Do not continue if the passport number field is not empty - This could be a manual page refresh
    if (passportNumber) {
      return;
    }
  } else {
    return;
  }

  status = "sending";
  // // Prevent infinite looping, max retries to 4
  // if (util.isCodelineLooping(passenger, 4)) {
  //   util.infoMessage(page, "Tried passenger 5 times, moving on");
  //   util.incrementSelectedTraveler();
  //   return page.goto(
  //     "https://www.waytoumrah.com/prj_umrah/eng/eng_mutamerentry.aspx"
  //   );
  // }

  // await util.toggleBlur(page, false);

  // await page.waitForSelector("#ddlgroupname");
  // await page.select("#ddlgroupname", global.submission.targetGroupId);
  // const groupName = util.suggestGroupName(data);
  // util.infoMessage(page, `👨‍👩‍👦  ${groupName}: Attention!!!Embassy-first-option`);
  // await page.waitForTimeout(3000);
  // await page.waitForSelector("#btnppscan");
  // await page.evaluate(() => {
  //   const divBtn = document.querySelector("#btnppscan");
  //   if (divBtn) {
  //     divBtn.click();
  //   }
  // });

  // await page.waitForSelector("#divshowmsg", { timeout: 5000 });
  // util.infoMessage(page, `Passport ${passenger.passportNumber} scanned 👍`);
  // await page.type("#divshowmsg", passenger.codeline, {
  //   delay: 0,
  // });
  // await util.toggleBlur(page, false);
  // await page.waitForTimeout(5000);

  // // Detect if there was any async errors with mrz scan
  // if (status !== "sending") {
  //   return;
  // }

  // await util.commit(
  //   page,
  //   config.find((c) => c.name === "create-mutamer").details,
  //   passenger
  // );

  // await page.waitForTimeout(5000);
  // await page.waitForSelector("#ddlppissmm");
  // if (passenger.passIssueDt.mm.startsWith("0")) {
  //   await page.select(
  //     "#ddlppissmm",
  //     `${passenger.passIssueDt.mm.substring(1)}`
  //   );
  // } else {
  //   await page.select("#ddlppissmm", `${passenger.passIssueDt?.mm}`);
  // }

  // if (passenger.gender == "Female") {
  //   try {
  //     await page.waitForSelector("#ddlrelation");
  //     await page.select("#ddlrelation", "15");
  //   } catch {}
  // }

  // let resizedPhotoPath = await util.downloadAndResizeImage(
  //   passenger,
  //   200,
  //   200,
  //   "photo",
  //   4,
  //   17
  // );
  // const resizedPassportPath = await util.downloadAndResizeImage(
  //   passenger,
  //   400,
  //   300,
  //   "passport"
  // );

  // resizedPhotoPath = util.getOverridePath(
  //   resizedPhotoPath,
  //   path.join(__dirname, `../photos/${passenger.passportNumber}.jpg`)
  // );

  // await page.click("#btn_uploadImage");
  // util.infoMessage(page, "🌄 Uploading photo", 4);
  // await page.waitForTimeout(2000);
  // await util.commitFile("#file_photo_upload", resizedPhotoPath);
  // await page.waitForTimeout(2000);
  // try {
  //   const isProceedBtn = await page.$("#btnProceedtoUpload");
  //   if (isProceedBtn) {
  //     util.infoMessage(page, "Proceeding to upload photo", 6);
  //     await page.$eval("#btnProceedtoUpload", (e) => e.click());
  //   }
  //   await page.waitForNavigation();
  // } catch (err) {
  //   console.log("Canvas: dummy-passport-exception", err.message);
  // }

  // if (await checkForServerError(page)) {
  //   return;
  // }

  // // Upload the passport image
  // await page.waitForSelector("#imgppcopy");
  // await util.commitFile("#fuppcopy", resizedPassportPath);
  // util.infoMessage(page, "🌇 Uploading passport", 4);
  // // scroll to bottom
  // await page.evaluate("window.scrollTo(0, document.body.scrollHeight)");

  // token = await util.commitCaptchaTokenWithSelector(
  //   page,
  //   "#imgtxtsv",
  //   "#txtImagetext",
  //   5
  // );
  // await util.sniff(
  //   page,
  //   config.find((c) => c.name == "create-mutamer")?.details
  // );

  // // This is assumed. fix starting from here. Because passports can succeed from the first time - check if this is a new page refresh?
  // // TODO: Wait for success message before advancing the counter
  // try {
  //   await page.select("#ddlgroupname", global.submission.targetGroupId);
  //   await page.waitForSelector("#btnsave");
  //   await page.click("#btnsave");
  // } catch (e) {
  //   console.log(`Passport ${passenger.passportNumber} failed. Plan B`, {
  //     error: e.message,
  //   });
  // }

  // If there is a passport number still that means it is the same page
  // await page.waitForNavigation();
  // await page.waitForTimeout(2000);
  // await page.waitForSelector("#txtppno");
  // const isSamePassenger = await page.$eval("#txtppno", (e) => e.value);
  // if (!isSamePassenger) {
  //   util.infoMessage(page, "👍 Mutamer saved successfully", 4);
  //   util.incrementSelectedTraveler();
  //   return page.goto(
  //     "https://www.waytoumrah.com/prj_umrah/eng/eng_mutamerentry.aspx"
  //   );
  // }

  // Check if we need a dummy passport
  await page.waitForTimeout(15000); // wait for page to load
  if (await checkForError(page, passenger, true, 5000)) {
    return;
  }

  // // Use fake passport image
  // const blankPassportPath = getPath(`${passenger.passportNumber}_mrz.jpg`);
  // // Generate fake passport image using the browser canvas api
  // const dataUrl = await page.evaluate((_passenger) => {
  //   const ele = document.createElement("canvas");
  //   ele.id = "hajonsoftcanvas";
  //   ele.style.display = "none";
  //   document.body.appendChild(ele);
  //   const canvas = document.getElementById("hajonsoftcanvas");
  //   canvas.width = 400;
  //   canvas.height = 300;
  //   const ctx = canvas.getContext("2d");
  //   // White background
  //   ctx.fillStyle = "white";
  //   ctx.fillRect(0, 0, canvas.width, canvas.height);

  //   ctx.fillStyle = "black";
  //   // Font must be 11 to fit in the canvas
  //   ctx.font = "11px Verdana, Verdana, Geneva, sans-serif";
  //   ctx.fillText(
  //     _passenger.codeline?.replace(/\n/g, "")?.substring(0, 44),
  //     15,
  //     canvas.height - 45
  //   );
  //   ctx.fillText(
  //     _passenger.codeline?.replace(/\n/g, "")?.substring(44),
  //     15,
  //     canvas.height - 25
  //   );

  //   // Photo
  //   ctx.lineWidth = 1;
  //   ctx.fillStyle = "hsl(240, 25%, 94%)";
  //   ctx.fillRect(45, 25, 100, 125);
  //   // Visible area
  //   ctx.fillStyle = "hsl(240, 25%, 94%)";
  //   ctx.fillRect(170, 25, 200, 175);

  //   // under photo area
  //   ctx.fillStyle = "hsl(240, 25%, 94%)";
  //   ctx.fillRect(45, 165, 100, 35);
  //   return canvas.toDataURL("image/jpeg", 1.0);
  // }, passenger);

  // // Save dataUrl to file
  // const imageData = dataUrl.replace(/^data:image\/\w+;base64,/, "");
  // const buf = Buffer.from(imageData, "base64");
  // fs.writeFileSync(blankPassportPath, buf);

  // await page.waitForSelector("#imgppcopy");
  // await util.commitFile("#fuppcopy", blankPassportPath);
  // util.infoMessage(page, "🌇 Uploading passport exception", 6);
  // try {
  //   await util.commitCaptchaTokenWithSelector(
  //     page,
  //     "#imgtxtsv",
  //     "#txtImagetext",
  //     5
  //   );

  //   await page.select("#ddlgroupname", global.submission.targetGroupId);
  //   await page.click("#btnsave");
  //   util.infoMessage(page, "Clicked save", 7);
  //   await page.waitForTimeout(15000); // wait for page to load
  //   await checkForError(page, passenger, false, 5000);
  // } catch (err) {
  //   util.infoMessage(page, "Canvas: dummy-passport-error", 7);
  // }
}

async function onEveryPageLoad(page, passenger) {
  // await util.toggleBlur(page);
  const titleMessage = `🧟 ${parseInt(util.getSelectedTraveler()) + 1}/${
    data.travellers.length
  }-${passenger?.slug}`;
  util.infoMessage(page, titleMessage);
}

module.exports = { send };
