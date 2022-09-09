const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const puppeteer = require("puppeteer-extra");
const os = require("os");
const { ImgurClient } = require("imgur");
const RuCaptcha2Captcha = require("rucaptcha-2captcha");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const RecaptchaPlugin = require("puppeteer-extra-plugin-recaptcha");
// TODO: Copilot suggestion to use recaptcha
puppeteer.use(RecaptchaPlugin());

const sharp = require("sharp");
const budgie = require("./budgie");
const axios = require("axios");
const nationalities = require("./data/nationalities");
const moment = require("moment");
const _ = require("lodash");
const beautify = require("beautify");
const homedir = require("os").homedir();
console.log("HOME: " + homedir);
const photosFolder = path.join(homedir, "hajonsoft", "photos");
const idFolder = path.join(homedir, "hajonsoft", "id");
const passportsFolder = path.join(homedir, "hajonsoft", "passports");
const vaccineFolder = path.join(homedir, "hajonsoft", "vaccine");
const VISION_DEFICIENCY = "none";
const IMGUR_CLIENT_ID = "0b4827447357d6b";

// or your client ID
const imgurClient = new ImgurClient({
  clientId: IMGUR_CLIENT_ID,
  clientSecret: "c842b1a08f0748150465ec643c04c0aeb17329c7",
});

let page;
let browser;

function getTmpDir() {
  const tmpDir = path.join(os.tmpdir(), "hajonsoft-eagle");
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir);
  }
  return tmpDir;
}

function isCloudRun() {
  return Boolean(process.argv.find((c) => c.startsWith("-cloud")))
}

function getPath(filename) {
  switch (filename) {
    case "data.json":
      let dataFileName = path.join(getTmpDir(), "data.json");
      // Fallback to current working dir (used by eagle cloud)
      if (isCloudRun()) {
        dataFileName = path.join(__dirname,"..","data.json");
      }
      return dataFileName;
    default:
      return path.join(getTmpDir(), filename);
  }
}

function getChromePath() {
  switch (os.platform()) {
    case "darwin":
      const chromePath =
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
      if (fs.existsSync(chromePath)) {
        console.log(os.platform(), chromePath);
        return chromePath;
      }

      throw new Error(`Google Chrome not found at ${chromePath}`);
      break;
    case "linux":
      const linuxChromePath = "/usr/bin/google-chrome-stable";
      if (fs.existsSync(linuxChromePath)) {
        console.log(os.platform(), linuxChromePath);
        return linuxChromePath;
      }

      throw new Error(`Google Chrome not found at ${linuxChromePath}`);
      break;
    default:
      const windows46ChromePath =
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
      if (fs.existsSync(windows46ChromePath)) {
        console.log(os.platform(), windows46ChromePath);
        return windows46ChromePath;
      }
      const userPath = path.join(
        homedir,
        "AppData",
        "Local",
        "Google",
        "Chrome",
        "Application",
        "chrome.exe"
      );
      if (fs.existsSync(userPath)) {
        console.log(os.platform(), userPath);
        return userPath;
      }

      const windows32ChromePath =
        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";
      if (fs.existsSync(windows32ChromePath)) {
        console.log(os.platform(), windows32ChromePath);
        return windows32ChromePath;
      }
      throw new Error(
        `Google Chrome not found at ${windows32ChromePath} or ${windows46ChromePath}`
      );
  }
}

function getIssuingCountry(passenger) {
  const issuingCountry = nationalities.nationalities.find(
    (nationality) => nationality.code === passenger.codeline.substring(2, 5)
  );
  return issuingCountry;
}

async function initPage(config, onContentLoaded, data) {
  const args = [
    "--disable-web-security",
    "--disable-features=IsolateOrigins,site-per-process",
    "--allow-running-insecure-content",
  ];

  const isCloudRun = Boolean(data?.info?.caravan?.startsWith("CLOUD_"));
  if (!isCloudRun) {
    args.push("--incognito");
  }

  const isWindowed = process.argv.find((c) => c.startsWith("-windowed"));
  if (!process.argv.find((c) => c.startsWith("range=")) && !isWindowed) {
    args.push("--start-fullscreen");
  }
  const launchOptions = {
    headless: isCloudRun,
    ignoreHTTPSErrors: true,
    defaultViewport: null,
    args,
  };

  if (!isCloudRun) {
    launchOptions.executablePath = getChromePath();
  }
  browser = await puppeteer.launch(launchOptions);
  const pages = await browser.pages();
  page = pages[0];
  await page.bringToFront();
  page.on("domcontentloaded", onContentLoaded);

  page.on("dialog", async (dialog) => {
    await page.waitForTimeout(5000);
    try {
      await dialog.accept();
    } catch {}
  });

  if (process.argv.length > 2) {
    page.on("console", (msg) => {
      // console.log("Eagle: Message=> " + msg.text());
    });
  }
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Safari/537.36."
  );

  if (!fs.existsSync(path.join(homedir, "hajonsoft"))) {
    fs.mkdirSync(path.join(homedir, "hajonsoft"));
  }

  if (!fs.existsSync(photosFolder)) {
    fs.mkdirSync(photosFolder);
  }
  if (!fs.existsSync(idFolder)) {
    fs.mkdirSync(idFolder);
  }
  if (!fs.existsSync(passportsFolder)) {
    fs.mkdirSync(passportsFolder);
  }
  if (!fs.existsSync(vaccineFolder)) {
    fs.mkdirSync(vaccineFolder);
  } else {
    fs.readdir(vaccineFolder, (err, files) => {
      for (const file of files) {
        fs.unlink(path.join(vaccineFolder, file), (err) => {});
      }
    });
  }
  // remove this event to enable right click on the page
  // await page.evaluate(() => {
  //   window.removeEventListener('contextmenu', {});
  // });

  return page;
}

async function newPage(onNewPageLoaded, onNewPageClosed) {
  const _newPage = await browser.newPage();
  _newPage.on("domcontentloaded", onNewPageLoaded);
  _newPage.on("close", onNewPageClosed);
  return _newPage;
}

async function createControlsFile(
  url,
  container,
  xPath,
  fieldFunction = async () => {}
) {
  const logFolder = getPath("log");
  if (!fs.existsSync(logFolder)) {
    fs.mkdirSync(logFolder);
  }
  const fileName =
    logFolder +
    _.last(url.split("/")).replace(/[^a-z0-9]/gim, "") +
    "_" +
    xPath.replace(/[^a-z0-9]/gim, "") +
    ".html";
  const handlers = await container.$x(xPath);

  let i = 0;
  let allText = "";
  for (const handler of handlers) {
    await fieldFunction(handler, i);
    const outerHtml = await handler.evaluate((e) =>
      e.outerHTML.replace(/\t/g, "")
    );
    allText += `${xPath}-${i}\n`;
    allText += `\t${beautify(outerHtml, { format: "html" })}\n\n`;
    // if select // .replace(/,/g, "\n")}</html>`;
    i++;
  }
  allText +=
    "\n\n\n-------------------BEGIN HTML DUMP-------------------\n\n\n\n\n";
  const html = await container.content();
  console.log(html);
  allText += beautify(html, { format: "html" });
  fs.writeFileSync(fileName, allText);
}

async function storeControls(container, url) {
  createControlsFile(
    url,
    container,
    `//input[@type="text"]`,
    async (handler, index) => {
      await handler.evaluate((e) => {
        e.disabled = false;
        e.readonly = false;
      });
      await handler.type(index.toString());
    }
  );
  createControlsFile(url, container, `//input[@type="file"]`);
  createControlsFile(url, container, `//input[@type="radio"]`);
  createControlsFile(url, container, `//select`);
  createControlsFile(url, container, `//button`);
  createControlsFile(url, container, `//iframe`);
}

function findConfig(url, config) {
  let lowerUrl = url?.toLowerCase();
  const urlConfig = config.find(
    (x) =>
      (x.url && x.url.toLowerCase() === lowerUrl) ||
      (x.regex && RegExp(x.regex.toLowerCase()).test(lowerUrl))
  );
  for (const param of process.argv) {
    if (
      param === "verbose-url=" ||
      param === "verbose-url" ||
      param === "verbose" ||
      param === "-verbose"
    ) {
      setInterval(function () {
        console.log(`Verbose Mode: Navigation: ${url}`);
        storeControls(page, lowerUrl);
      }, 30000);
    }
  }

  if (process.argv.includes(`verbose-url=${url}`)) {
    storeControls(page, lowerUrl);
  }

  if (urlConfig) {
    infoMessage(
      page,
      `✈️ Workflow: ${urlConfig.name} ${urlConfig.url || urlConfig.regex}`,
      9
    );
    return urlConfig;
  }
  return {};
}

async function commit(page, details, row) {
  if (!details) return;
  if (details?.[0]?.selector) {
    await page.waitForSelector(details?.[0].selector, {
      timeout: 240000,
    });
  }
  if (details?.[0]?.xPath) {
    await page.$x(details?.[0].xPath);
  }
  for (const detail of details) {
    let value;
    let txt;
    if (detail.value) {
      value = detail.value(row); // call value function and pass current row info
      if (!value && detail.autocomplete) {
        value = budgie.get(detail.autocomplete, detail.defaultValue);
      }
    }
    if (detail.txt) {
      txt = detail.txt(row); // call txt function and pass current row info
    }

    let element;
    if (detail.selector) {
      element = await page.$(detail.selector);
    }
    if (detail.xPath) {
      const xElements = await page.$x(detail.xPath);
      element = xElements[detail.index || 0];
    }
    if (!element || (!value && !txt)) {
      continue;
    }
    let elementType;
    if (detail.selector) {
      elementType = await page.$eval(detail.selector, (e) =>
        e.outerHTML
          .match(/<(.*?) /g)[0]
          .replace(/</g, "")
          .replace(/ /g, "")
          .toLowerCase()
      );
    }
    if (detail.xPath) {
      const xElements = await page.$x(detail.xPath);
      const xElement = xElements[detail.index];
      elementType = await xElement.evaluate((e) =>
        e.outerHTML
          .match(/<(.*?) /g)[0]
          .replace(/</g, "")
          .replace(/ /g, "")
          .toLowerCase()
      );
    }
    switch (elementType) {
      case "input":
      case "textarea":
        if (detail.selector) {
          await page.waitForSelector(detail.selector);
          await page.focus(detail.selector);
          await page.type(detail.selector, "");
          await page.evaluate((element) => {
            const field = document.querySelector(element.selector);
            field.removeAttribute("readonly");
            field.removeAttribute("disabled");
            if (field) {
              field.value = "";
              field.setAttribute("value", "");
            }
          }, detail);
          await page.waitForTimeout(10);
        }

        if (value) {
          if (detail.selector) {
            await page.type(detail.selector, (value || "").toString());
          }
          if (detail.xPath) {
            const xElements = await page.$x(detail.xPath);
            const xElement = xElements[detail.index];
            await xElement.type(value);
          }
        } else if (detail.autocomplete) {
          if (detail.selector) {
            await page.type(
              detail.selector,
              budgie.get(detail.autocomplete, detail.defaultValue)
            );
          }
          if (detail.xPath) {
            const xElements = await page.$x(detail.xPath);
            const xElement = xElements[detail.index];
            await xElement.type(
              budgie.get(detail.autocomplete, detail.defaultValue)
            );
          }
        }
        break;
      case "select":
        if (value) {
          if (detail.selector) {
            await page.select(detail.selector, value);
          }
          if (detail.xPath) {
            const xElements = await page.$x(detail.xPath);
            const xElement = xElements[detail.index];
            xElement.select(value);
          }
        } else if (txt) {
          if (detail.selector) {
            await selectByValue(detail.selector, txt);
          }
        }
        break;
      default:
        break;
    }
  }
}

async function selectByValue(selector, txt) {
  await page.waitForSelector(selector);
  const options = await page.$eval(selector, (e) => e.innerHTML);
  const valuePattern = new RegExp(
    `value="([0-9a-zA-Z/]+)">${txt}</option>`,
    "im"
  );
  const found = valuePattern.exec(options.replace(/\n/gim, ""));
  if (found && found.length >= 2) {
    await page.select(selector, found[1]);
  }
}

function getMofaImportString(passportNumber) {
  try {
    const file = getPath(passportNumber + ".txt");
    if (fs.existsSync(file)) {
      const importContent = fs.readFileSync(file, "utf-8");
      const importJSON = JSON.parse(importContent);
      return " - MOFA: " + importJSON?.status;
    }
  } catch {}
  return "";
}

async function controller(page, structure, travellers) {
  if (
    !structure.controller ||
    !structure.controller.selector ||
    !structure.controller.action
  ) {
    return;
  }

  let lastTraveler = getSelectedTraveler();
  // check the last traveler is less than travellers otherwise set last traveler to 0
  if (lastTraveler >= travellers.length) {
    lastTraveler = 0;
  }

  // TODO: If mofa import is active, then use the SENT status otherwise load all passengers

  let options =
    "<option value='-1'>Select passenger click send حدد الراكب انقر إرسل</option>" +
    travellers
      .map(
        (traveller, cursor) =>
          `<option value="${cursor}" ${
            cursor == lastTraveler ? "selected" : ""
          }>${cursor + 1} - ${
            traveller.nationality?.isArabic
              ? traveller?.nameArabic?.given + " " + traveller.nameArabic.last
              : traveller.name.full
          } - ${traveller.passportNumber} - ${traveller?.nationality?.name} - ${
            traveller?.gender || "gender"
          } - ${traveller?.dob?.age || "age"} years old${getMofaImportString(
            traveller.passportNumber
          )}</option>`
      )
      .join(" ");

  try {
    await page.waitForSelector(structure.controller.selector);
    const controllerHandleMethod = `handleEagle${
      structure.controller.name || "Send"
    }Click`;
    await page.evaluate(
      (params) => {
        const structureParam = params[0];
        const optionsParam = params[1];
        const controller = structureParam.controller;
        const container = document.querySelector(controller.selector);
        const handleMethodName = params[2];
        const visaPath = params[3];
        const htLogo = `data:image/jpeg;base64,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`;

        container.outerHTML = `
        <div style="background-color: #8BC34B; padding: 16px;"> 
        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 8px">
        <img style='width: 32px; height: 32px; border-radius: 8px; '  src=${htLogo} onclick="closeBrowser(); return false;"> </img> 
        <div style='color: #151F0A; font-size: 2rem;flex: 1;'> HAJonSoft Eagle حج أونسوفت النسر</div> 
        <div style="color: #F0F7E8; font-size: 1.5rem; text-transform: uppercase;">إرسال Send</div>
        </div>
          <div style='background-color: #F0F7E8; border: 2px solid black; border-radius: 16px; padding: 0.5rem; display: flex; align-items: center; justify-content: space-between'>  
          <button style='background-color: #2196f3; color: #ffffff; width: 6rem, padding: 0.5rem; margin: 0 5px; border-radius: 8px;' type="button" onclick="${handleMethodName}();return false">Send selected  أرسل </button> 
          <select id="hajonsoft_select" style='flex-grow: 1; margin-right: 0.5rem'> 
          ${optionsParam}
          </select>
          <button style='background-color: #F27F21; color: #ffffff; width: 6rem, padding: 0.5rem; margin: 0 5px; border-radius: 8px;' type="button" onclick="registerLoop();${handleMethodName}();return false">Send All إرسل الكل</button> 
          </div>
          <hr />
          ${
            controller.mokhaa
              ? `<div>
              <div style="display: flex; width: 100%; align-items: center; justify-content: space-between;"> 
              <div>Visa folder: ${visaPath}</div>
              <div style="color: #F0F7E8; font-size: 1.5rem; text-transform: uppercase;">إستقبال Receive</div>
  
                
                </div>
              
              <div style="width: 100%; display: flex; justify-content: center; align-items: center; gap: 20px; margin-top: 10px;">

            <button onclick="handleLoadImportedOnlyClick();return false" style="color: white; background-color: green; font-size: 1.5rem; font-weight: bold; border-radius: 16px;">Expert [node .]</button>
            <button onclick="handleWTUClick();return false" style="color: white; background-color: white; font-size: 1.5rem; font-weight: bold; border-radius: 16px;">
            <img style='width: 120px; height: 42px;' src="data:image/png;base64,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" />
            </button> 
            <button onclick="handleBAUClick();return false" style="color: #8f006b; font-size: 1.5rem; font-weight: bold; border-radius: 16px; padding: 8px">
            <div style="display: flex; justify-content: space-around; align-items: center;">
           <div>Bab-Umrah </div>
           <img style='width: 32px; height: 32px; border-radius: 8px; margin-right: 0.5rem' src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAASABIAAD/4QBkRXhpZgAATU0AKgAAAAgABAEGAAMAAAABAAIAAAESAAMAAAABAAEAAAEoAAMAAAABAAIAAIdpAAQAAAABAAAAPgAAAAAAAqACAAQAAAABAAAAKqADAAQAAAABAAAAKQAAAAD/4QkhaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLwA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/PiA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJYTVAgQ29yZSA2LjAuMCI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiLz4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8P3hwYWNrZXQgZW5kPSJ3Ij8+AP/tADhQaG90b3Nob3AgMy4wADhCSU0EBAAAAAAAADhCSU0EJQAAAAAAENQdjNmPALIE6YAJmOz4Qn7/4hAISUNDX1BST0ZJTEUAAQEAAA/4YXBwbAIQAABtbnRyUkdCIFhZWiAH5gACAAMAEAAyAB5hY3NwQVBQTAAAAABBUFBMAAAAAAAAAAAAAAAAAAAAAAAA9tYAAQAAAADTLWFwcGwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABJkZXNjAAABXAAAAGJkc2NtAAABwAAABJxjcHJ0AAAGXAAAACN3dHB0AAAGgAAAABRyWFlaAAAGlAAAABRnWFlaAAAGqAAAABRiWFlaAAAGvAAAABRyVFJDAAAG0AAACAxhYXJnAAAO3AAAACB2Y2d0AAAO/AAAADBuZGluAAAPLAAAAD5jaGFkAAAPbAAAACxtbW9kAAAPmAAAACh2Y2dwAAAPwAAAADhiVFJDAAAG0AAACAxnVFJDAAAG0AAACAxhYWJnAAAO3AAAACBhYWdnAAAO3AAAACBkZXNjAAAAAAAAAAhEaXNwbGF5AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAbWx1YwAAAAAAAAAmAAAADGhySFIAAAAUAAAB2GtvS1IAAAAMAAAB7G5iTk8AAAASAAAB+GlkAAAAAAASAAACCmh1SFUAAAAUAAACHGNzQ1oAAAAWAAACMGRhREsAAAAcAAACRm5sTkwAAAAWAAACYmZpRkkAAAAQAAACeGl0SVQAAAAYAAACiGVzRVMAAAAWAAACoHJvUk8AAAASAAACtmZyQ0EAAAAWAAACyGFyAAAAAAAUAAAC3nVrVUEAAAAcAAAC8mhlSUwAAAAWAAADDnpoVFcAAAAKAAADJHZpVk4AAAAOAAADLnNrU0sAAAAWAAADPHpoQ04AAAAKAAADJHJ1UlUAAAAkAAADUmVuR0IAAAAUAAADdmZyRlIAAAAWAAADim1zAAAAAAASAAADoGhpSU4AAAASAAADsnRoVEgAAAAMAAADxGNhRVMAAAAYAAAD0GVuQVUAAAAUAAADdmVzWEwAAAASAAACtmRlREUAAAAQAAAD6GVuVVMAAAASAAAD+HB0QlIAAAAYAAAECnBsUEwAAAASAAAEImVsR1IAAAAiAAAENHN2U0UAAAAQAAAEVnRyVFIAAAAUAAAEZnB0UFQAAAAWAAAEemphSlAAAAAMAAAEkABMAEMARAAgAHUAIABiAG8AagBpzuy37AAgAEwAQwBEAEYAYQByAGcAZQAtAEwAQwBEAEwAQwBEACAAVwBhAHIAbgBhAFMAegDtAG4AZQBzACAATABDAEQAQgBhAHIAZQB2AG4A/QAgAEwAQwBEAEwAQwBEAC0AZgBhAHIAdgBlAHMAawDmAHIAbQBLAGwAZQB1AHIAZQBuAC0ATABDAEQAVgDkAHIAaQAtAEwAQwBEAEwAQwBEACAAYQAgAGMAbwBsAG8AcgBpAEwAQwBEACAAYQAgAGMAbwBsAG8AcgBMAEMARAAgAGMAbwBsAG8AcgBBAEMATAAgAGMAbwB1AGwAZQB1AHIgDwBMAEMARAAgBkUGRAZIBkYGKQQaBD4EOwRMBD4EQAQ+BDIEOAQ5ACAATABDAEQgDwBMAEMARAAgBeYF0QXiBdUF4AXZX2mCcgBMAEMARABMAEMARAAgAE0A4AB1AEYAYQByAGUAYgBuAP0AIABMAEMARAQmBDIENQRCBD0EPgQ5ACAEFgQaAC0ENAQ4BEEEPwQ7BDUEOQBDAG8AbABvAHUAcgAgAEwAQwBEAEwAQwBEACAAYwBvAHUAbABlAHUAcgBXAGEAcgBuAGEAIABMAEMARAkwCQIJFwlACSgAIABMAEMARABMAEMARAAgDioONQBMAEMARAAgAGUAbgAgAGMAbwBsAG8AcgBGAGEAcgBiAC0ATABDAEQAQwBvAGwAbwByACAATABDAEQATABDAEQAIABDAG8AbABvAHIAaQBkAG8ASwBvAGwAbwByACAATABDAEQDiAOzA8cDwQPJA7wDtwAgA78DuAPMA70DtwAgAEwAQwBEAEYA5AByAGcALQBMAEMARABSAGUAbgBrAGwAaQAgAEwAQwBEAEwAQwBEACAAYQAgAEMAbwByAGUAczCrMOkw/ABMAEMARHRleHQAAAAAQ29weXJpZ2h0IEFwcGxlIEluYy4sIDIwMjIAAFhZWiAAAAAAAADzUQABAAAAARbMWFlaIAAAAAAAAIPfAAA9v////7tYWVogAAAAAAAASr8AALE3AAAKuVhZWiAAAAAAAAAoOAAAEQsAAMi5Y3VydgAAAAAAAAQAAAAABQAKAA8AFAAZAB4AIwAoAC0AMgA2ADsAQABFAEoATwBUAFkAXgBjAGgAbQByAHcAfACBAIYAiwCQAJUAmgCfAKMAqACtALIAtwC8AMEAxgDLANAA1QDbAOAA5QDrAPAA9gD7AQEBBwENARMBGQEfASUBKwEyATgBPgFFAUwBUgFZAWABZwFuAXUBfAGDAYsBkgGaAaEBqQGxAbkBwQHJAdEB2QHhAekB8gH6AgMCDAIUAh0CJgIvAjgCQQJLAlQCXQJnAnECegKEAo4C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" />
            </div>
            </button>
            <button onclick="handleTWFClick();return false" style="color: #8f006b; font-size: 1.5rem; font-weight: bold; border-radius: 16px; padding: 8px">
            <div style="display: flex; justify-content: space-around; align-items: center;">
           <div>Tawaf </div>
           <img style='width: 32px; height: 32px; border-radius: 8px; margin-right: 0.5rem' src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHEAAABcCAYAAABZTFo4AAAACXBIWXMAAAsTAAALEwEAmpwYAAAKT2lDQ1BQaG90b3Nob3AgSUNDIHByb2ZpbGUAAHjanVNnVFPpFj333vRCS4iAlEtvUhUIIFJCi4AUkSYqIQkQSoghodkVUcERRUUEG8igiAOOjoCMFVEsDIoK2AfkIaKOg6OIisr74Xuja9a89+bN/rXXPues852zzwfACAyWSDNRNYAMqUIeEeCDx8TG4eQuQIEKJHAAEAizZCFz/SMBAPh+PDwrIsAHvgABeNMLCADATZvAMByH/w/qQplcAYCEAcB0kThLCIAUAEB6jkKmAEBGAYCdmCZTAKAEAGDLY2LjAFAtAGAnf+bTAICd+Jl7AQBblCEVAaCRACATZYhEAGg7AKzPVopFAFgwABRmS8Q5ANgtADBJV2ZIALC3AMDOEAuyAAgMADBRiIUpAAR7AGDIIyN4AISZABRG8lc88SuuEOcqAAB4mbI8uSQ5RYFbCC1xB1dXLh4ozkkXKxQ2YQJhmkAuwnmZGTKBNA/g88wAAKCRFRHgg/P9eM4Ors7ONo62Dl8t6r8G/yJiYuP+5c+rcEAAAOF0ftH+LC+zGoA7BoBt/qIl7gRoXgugdfeLZrIPQLUAoOnaV/Nw+H48PEWhkLnZ2eXk5NhKxEJbYcpXff5nwl/AV/1s+X48/Pf14L7iJIEyXYFHBPjgwsz0TKUcz5IJhGLc5o9H/LcL//wd0yLESWK5WCoU41EScY5EmozzMqUiiUKSKcUl0v9k4t8s+wM+3zUAsGo+AXuRLahdYwP2SycQWHTA4vcAAPK7b8HUKAgDgGiD4c93/+8//UegJQCAZkmScQAAXkQkLlTKsz/HCAAARKCBKrBBG/TBGCzABhzBBdzBC/xgNoRCJMTCQhBCCmSAHHJgKayCQiiGzbAdKmAv1EAdNMBRaIaTcA4uwlW4Dj1wD/phCJ7BKLyBCQRByAgTYSHaiAFiilgjjggXmYX4IcFIBBKLJCDJiBRRIkuRNUgxUopUIFVIHfI9cgI5h1xGupE7yAAygvyGvEcxlIGyUT3UDLVDuag3GoRGogvQZHQxmo8WoJvQcrQaPYw2oefQq2gP2o8+Q8cwwOgYBzPEbDAuxsNCsTgsCZNjy7EirAyrxhqwVqwDu4n1Y8+xdwQSgUXACTYEd0IgYR5BSFhMWE7YSKggHCQ0EdoJNwkDhFHCJyKTqEu0JroR+cQYYjIxh1hILCPWEo8TLxB7iEPENyQSiUMyJ7mQAkmxpFTSEtJG0m5SI+ksqZs0SBojk8naZGuyBzmULCAryIXkneTD5DPkG+Qh8lsKnWJAcaT4U+IoUspqShnlEOU05QZlmDJBVaOaUt2ooVQRNY9aQq2htlKvUYeoEzR1mjnNgxZJS6WtopXTGmgXaPdpr+h0uhHdlR5Ol9BX0svpR+iX6AP0dwwNhhWDx4hnKBmbGAcYZxl3GK+YTKYZ04sZx1QwNzHrmOeZD5lvVVgqtip8FZHKCpVKlSaVGyovVKmqpqreqgtV81XLVI+pXlN9rkZVM1PjqQnUlqtVqp1Q61MbU2epO6iHqmeob1Q/pH5Z/YkGWcNMw09DpFGgsV/jvMYgC2MZs3gsIWsNq4Z1gTXEJrHN2Xx2KruY/R27iz2qqaE5QzNKM1ezUvOUZj8H45hx+Jx0TgnnKKeX836K3hTvKeIpG6Y0TLkxZVxrqpaXllirSKtRq0frvTau7aedpr1Fu1n7gQ5Bx0onXCdHZ4/OBZ3nU9lT3acKpxZNPTr1ri6qa6UbobtEd79up+6Ynr5egJ5Mb6feeb3n+hx9L/1U/W36p/VHDFgGswwkBtsMzhg8xTVxbzwdL8fb8VFDXcNAQ6VhlWGX4YSRudE8o9VGjUYPjGnGXOMk423GbcajJgYmISZLTepN7ppSTbmmKaY7TDtMx83MzaLN1pk1mz0x1zLnm+eb15vft2BaeFostqi2uGVJsuRaplnutrxuhVo5WaVYVVpds0atna0l1rutu6cRp7lOk06rntZnw7Dxtsm2qbcZsOXYBtuutm22fWFnYhdnt8Wuw+6TvZN9un2N/T0HDYfZDqsdWh1+c7RyFDpWOt6azpzuP33F9JbpL2dYzxDP2DPjthPLKcRpnVOb00dnF2e5c4PziIuJS4LLLpc+Lpsbxt3IveRKdPVxXeF60vWdm7Obwu2o26/uNu5p7ofcn8w0nymeWTNz0MPIQ+BR5dE/C5+VMGvfrH5PQ0+BZ7XnIy9jL5FXrdewt6V3qvdh7xc+9j5yn+M+4zw33jLeWV/MN8C3yLfLT8Nvnl+F30N/I/9k/3r/0QCngCUBZwOJgUGBWwL7+Hp8Ib+OPzrbZfay2e1BjKC5QRVBj4KtguXBrSFoyOyQrSH355jOkc5pDoVQfujW0Adh5mGLw34MJ4WHhVeGP45wiFga0TGXNXfR3ENz30T6RJZE3ptnMU85ry1KNSo+qi5qPNo3ujS6P8YuZlnM1VidWElsSxw5LiquNm5svt/87fOH4p3iC+N7F5gvyF1weaHOwvSFpxapLhIsOpZATIhOOJTwQRAqqBaMJfITdyWOCnnCHcJnIi/RNtGI2ENcKh5O8kgqTXqS7JG8NXkkxTOlLOW5hCepkLxMDUzdmzqeFpp2IG0yPTq9MYOSkZBxQqohTZO2Z+pn5mZ2y6xlhbL+xW6Lty8elQfJa7OQrAVZLQq2QqboVFoo1yoHsmdlV2a/zYnKOZarnivN7cyzytuQN5zvn//tEsIS4ZK2pYZLVy0dWOa9rGo5sjxxedsK4xUFK4ZWBqw8uIq2Km3VT6vtV5eufr0mek1rgV7ByoLBtQFr6wtVCuWFfevc1+1dT1gvWd+1YfqGnRs+FYmKrhTbF5cVf9go3HjlG4dvyr+Z3JS0qavEuWTPZtJm6ebeLZ5bDpaql+aXDm4N2dq0Dd9WtO319kXbL5fNKNu7g7ZDuaO/PLi8ZafJzs07P1SkVPRU+lQ27tLdtWHX+G7R7ht7vPY07NXbW7z3/T7JvttVAVVN1WbVZftJ+7P3P66Jqun4lvttXa1ObXHtxwPSA/0HIw6217nU1R3SPVRSj9Yr60cOxx++/p3vdy0NNg1VjZzG4iNwRHnk6fcJ3/ceDTradox7rOEH0x92HWcdL2pCmvKaRptTmvtbYlu6T8w+0dbq3nr8R9sfD5w0PFl5SvNUyWna6YLTk2fyz4ydlZ19fi753GDborZ752PO32oPb++6EHTh0kX/i+c7vDvOXPK4dPKy2+UTV7hXmq86X23qdOo8/pPTT8e7nLuarrlca7nuer21e2b36RueN87d9L158Rb/1tWeOT3dvfN6b/fF9/XfFt1+cif9zsu72Xcn7q28T7xf9EDtQdlD3YfVP1v+3Njv3H9qwHeg89HcR/cGhYPP/pH1jw9DBY+Zj8uGDYbrnjg+OTniP3L96fynQ89kzyaeF/6i/suuFxYvfvjV69fO0ZjRoZfyl5O/bXyl/erA6xmv28bCxh6+yXgzMV70VvvtwXfcdx3vo98PT+R8IH8o/2j5sfVT0Kf7kxmTk/8EA5jz/GMzLdsAADoUaVRYdFhNTDpjb20uYWRvYmUueG1wAAAAAAA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/Pgo8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjUtYzAxNCA3OS4xNTE0ODEsIDIwMTMvMDMvMTMtMTI6MDk6MTUgICAgICAgICI+CiAgIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CiAgICAgIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiCiAgICAgICAgICAgIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIKICAgICAgICAgICAgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iCiAgICAgICAgICAgIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiCiAgICAgICAgICAgIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIKICAgICAgICAgICAgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIgogICAgICAgICAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyIKICAgICAgICAgICAgeG1sbnM6ZXhpZj0iaHR0cDovL25zLmFkb2JlLmNvbS9leGlmLzEuMC8iPgogICAgICAgICA8eG1wOkNyZWF0b3JUb29sPkFkb2JlIFBob3Rvc2hvcCBDQyAoV2luZG93cyk8L3htcDpDcmVhdG9yVG9vbD4KICAgICAgICAgPHhtcDpDcmVhdGVEYXRlPjIwMjItMDQtMTRUMDc6NTM6MjYtMDc6MDA8L3htcDpDcmVhdGVEYXRlPgogICAgICAgICA8eG1wOk1ldGFkYXRhRGF0ZT4yMDIyLTA0LTE0VDA3OjUzOjI2LTA3OjAwPC94bXA6TWV0YWRhdGFEYXRlPgogICAgICAgICA8eG1wOk1vZGlmeURhdGU+MjAyMi0wNC0xNFQwNzo1MzoyNi0wNzowMDwveG1wOk1vZGlmeURhdGU+CiAgICAgICAgIDx4bXBNTTpJbnN0YW5jZUlEPnhtcC5paWQ6NTY3M2U0MjEtOTI3Yy00YjRlLWI5ZmEtZDRkMWZjYWQyOTYwPC94bXBNTTpJbnN0YW5jZUlEPgogICAgICAgICA8eG1wTU06RG9jdW1lbnRJRD54bXAuZGlkOmM3ZTc3MWRiLTg3MzYtMzg0Mi05NzRjLTNiODFkZjczZGQwNzwveG1wTU06RG9jdW1lbnRJRD4KICAgICAgICAgPHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD54bXAuZGlkOmM3ZTc3MWRiLTg3MzYtMzg0Mi05NzRjLTNiODFkZjczZGQwNzwveG1wTU06T3JpZ2luYWxEb2N1bWVudElEPgogICAgICAgICA8eG1wTU06SGlzdG9yeT4KICAgICAgICAgICAgPHJkZjpTZXE+CiAgICAgICAgICAgICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0iUmVzb3VyY2UiPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6YWN0aW9uPmNyZWF0ZWQ8L3N0RXZ0OmFjdGlvbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0Omluc3RhbmNlSUQ+eG1wLmlpZDpjN2U3NzFkYi04NzM2LTM4NDItOTc0Yy0zYjgxZGY3M2RkMDc8L3N0RXZ0Omluc3RhbmNlSUQ+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDp3aGVuPjIwMjItMDQtMTRUMDc6NTM6MjYtMDc6MDA8L3N0RXZ0OndoZW4+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDpzb2Z0d2FyZUFnZW50PkFkb2JlIFBob3Rvc2hvcCBDQyAoV2luZG93cyk8L3N0RXZ0OnNvZnR3YXJlQWdlbnQ+CiAgICAgICAgICAgICAgIDwvcmRmOmxpPgogICAgICAgICAgICAgICA8cmRmOmxpIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmFjdGlvbj5zYXZlZDwvc3RFdnQ6YWN0aW9uPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6aW5zdGFuY2VJRD54bXAuaWlkOjU2NzNlNDIxLTkyN2MtNGI0ZS1iOWZhLWQ0ZDFmY2FkMjk2MDwvc3RFdnQ6aW5zdGFuY2VJRD4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OndoZW4+MjAyMi0wNC0xNFQwNzo1MzoyNi0wNzowMDwvc3RFdnQ6d2hlbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OnNvZnR3YXJlQWdlbnQ+QWRvYmUgUGhvdG9zaG9wIENDIChXaW5kb3dzKTwvc3RFdnQ6c29mdHdhcmVBZ2VudD4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmNoYW5nZWQ+Lzwvc3RFdnQ6Y2hhbmdlZD4KICAgICAgICAgICAgICAgPC9yZGY6bGk+CiAgICAgICAgICAgIDwvcmRmOlNlcT4KICAgICAgICAgPC94bXBNTTpIaXN0b3J5PgogICAgICAgICA8ZGM6Zm9ybWF0PmltYWdlL3BuZzwvZGM6Zm9ybWF0PgogICAgICAgICA8cGhvdG9zaG9wOkNvbG9yTW9kZT4zPC9waG90b3Nob3A6Q29sb3JNb2RlPgogICAgICAgICA8cGhvdG9zaG9wOklDQ1Byb2ZpbGU+c1JHQiBJRUM2MTk2Ni0yLjE8L3Bob3Rvc2hvcDpJQ0NQcm9maWxlPgogICAgICAgICA8dGlmZjpPcmllbnRhdGlvbj4xPC90aWZmOk9yaWVudGF0aW9uPgogICAgICAgICA8dGlmZjpYUmVzb2x1dGlvbj43MjAwMDAvMTAwMDA8L3RpZmY6WFJlc29sdXRpb24+CiAgICAgICAgIDx0aWZmOllSZXNvbHV0aW9uPjcyMDAwMC8xMDAwMDwvdGlmZjpZUmVzb2x1dGlvbj4KICAgICAgICAgPHRpZmY6UmVzb2x1dGlvblVuaXQ+MjwvdGlmZjpSZXNvbHV0aW9uVW5pdD4KICAgICAgICAgPGV4aWY6Q29sb3JTcGFjZT4xPC9leGlmOkNvbG9yU3BhY2U+CiAgICAgICAgIDxleGlmOlBpeGVsWERpbWVuc2lvbj4xMTM8L2V4aWY6UGl4ZWxYRGltZW5zaW9uPgogICAgICAgICA8ZXhpZjpQaXhlbFlEaW1lbnNpb24+OTI8L2V4aWY6UGl4ZWxZRGltZW5zaW9uPgogICAgICA8L3JkZjpEZXNjcmlwdGlvbj4KICAgPC9yZGY6UkRGPgo8L3g6eG1wbWV0YT4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAKPD94cGFja2V0IGVuZD0idyI/Pj+nbJgAAAAgY0hSTQAAeiUAAICDAAD5/wAAgOkAAHUwAADqYAAAOpgAABdvkl/FRgAAHFNJREFUeNrsfW1sW2eW3nPee/klUdSXJX9KsZ3EdiQ5m4Gb2LLsWac7M4soSReLNIO2P4oWKCbtArPFBA0yDcamrzM7s0WALbCDDrA/immBtoOt6mY8Mq/gJN14JpZkxatJxpZoO5tYsWVJlkSLEiVSJO+97+mPS1KkRFLUhxMp8QsEjmVd8t73ueec53y+xMx4uEpbFz/W3na6DLdpUFJxqE4hpZQMSSQEKL2PBDCDwRAkAJYQljBVY9Q8dOhvXnoQ90UPQcy/rgS1gJn5G4NBgGQJohfSP1vBNgPM5wECC0u458fj6wnoQxBT67dXT55zqKoqpbQlywaqHaAigNHCH8yZv9uQE/KBTSAwoDMAmUwkj3/jJ3/6EMRVrv7+V84mPDvczBIEgQXQCoHFAKATAZIJRBIMAWFBJu4jdOIETti/exqXrv1wQFHcAizBNmhpSHM/n3GewTC8wntit//ZhyCWsDo6vvtWwxP7DzBU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" />
            </div>
            </button> 
            <button onclick="handleGMAClick();return false" style="color: #1c497c; background-color: white; font-size: 1.5rem; font-weight: bold; border-radius: 16px; padding: 8px">
            <div style="display: flex; justify-content: space-around; align-items: center;">
<div>Gabul ya Hajj</div>

<img style='width: 32px; height: 32px; border-radius: 8px; margin-right: 0.5rem' src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAASABIAAD/4QBkRXhpZgAATU0AKgAAAAgABAEGAAMAAAABAAIAAAESAAMAAAABAAEAAAEoAAMAAAABAAIAAIdpAAQAAAABAAAAPgAAAAAAAqACAAQAAAABAAABRaADAAQAAAABAAABVgAAAAD/4QkhaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLwA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/PiA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJYTVAgQ29yZSA2LjAuMCI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiLz4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8P3hwYWNrZXQgZW5kPSJ3Ij8+AP/tADhQaG90b3Nob3AgMy4wADhCSU0EBAAAAAAAADhCSU0EJQAAAAAAENQdjNmPALIE6YAJmOz4Qn7/4hAISUNDX1BST0ZJTEUAAQEAAA/4YXBwbAIQAABtbnRyUkdCIFhZWiAH5gADAAYACwAJACphY3NwQVBQTAAAAABBUFBMAAAAAAAAAAAAAAAAAAAAAAAA9tYAAQAAAADTLWFwcGwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABJkZXNjAAABXAAAAGJkc2NtAAABwAAABJxjcHJ0AAAGXAAAACN3dHB0AAAGgAAAABRyWFlaAAAGlAAAABRnWFlaAAAGqAAAABRiWFlaAAAGvAAAABRyVFJDAAAG0AAACAxhYXJnAAAO3AAAACB2Y2d0AAAO/AAAADBuZGluAAAPLAAAAD5jaGFkAAAPbAAAACxtbW9kAAAPmAAAACh2Y2dwAAAPwAAAADhiVFJDAAAG0AAACAxnVFJDAAAG0AAACAxhYWJnAAAO3AAAACBhYWdnAAAO3AAAACBkZXNjAAAAAAAAAAhEaXNwbGF5AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAbWx1YwAAAAAAAAAmAAAADGhySFIAAAAUAAAB2GtvS1IAAAAMAAAB7G5iTk8AAAASAAAB+GlkAAAAAAASAAACCmh1SFUAAAAUAAACHGNzQ1oAAAAWAAACMGRhREsAAAAcAAACRm5sTkwAAAAWAAACYmZpRkkAAAAQAAACeGl0SVQAAAAYAAACiGVzRVMAAAAWAAACoHJvUk8AAAASAAACtmZyQ0EAAAAWAAACyGFyAAAAAAAUAAAC3nVrVUEAAAAcAAAC8mhlSUwAAAAWAAADDnpoVFcAAAAKAAADJHZpVk4AAAAOAAADLnNrU0sAAAAWAAADPHpoQ04AAAAKAAADJHJ1UlUAAAAkAAADUmVuR0IAAAAUAAADdmZyRlIAAAAWAAADim1zAAAAAAASAAADoGhpSU4AAAASAAADsnRoVEgAAAAMAAADxGNhRVMAAAAYAAAD0GVuQVUAAAAUAAADdmVzWEwAAAASAAACtmRlREUAAAAQAAAD6GVuVVMAAAASAAAD+HB0QlIAAAAYAAAECnBsUEwAAAASAAAEImVsR1IAAAAiAAAENHN2U0UAAAAQAAAEVnRyVFIAAAAUAAAEZnB0UFQAAAAWAAAEemphSlAAAAAMAAAEkABMAEMARAAgAHUAIABiAG8AagBpzuy37AAgAEwAQwBEAEYAYQByAGcAZQAtAEwAQwBEAEwAQwBEACAAVwBhAHIAbgBhAFMAegDtAG4AZQBzACAATABDAEQAQgBhAHIAZQB2AG4A/QAgAEwAQwBEAEwAQwBEAC0AZgBhAHIAdgBlAHMAawDmAHIAbQBLAGwAZQB1AHIAZQBuAC0ATABDAEQAVgDkAHIAaQAtAEwAQwBEAEwAQwBEACAAYQAgAGMAbwBsAG8AcgBpAEwAQwBEACAAYQAgAGMAbwBsAG8AcgBMAEMARAAgAGMAbwBsAG8AcgBBAEMATAAgAGMAbwB1AGwAZQB1AHIgDwBMAEMARAAgBkUGRAZIBkYGKQQaBD4EOwRMBD4EQAQ+BDIEOAQ5ACAATABDAEQgDwBMAEMARAAgBeYF0QXiBdUF4AXZX2mCcgBMAEMARABMAEMARAAgAE0A4AB1AEYAYQByAGUAYgBuAP0AIABMAEMARAQmBDIENQRCBD0EPgQ5ACAEFgQaAC0ENAQ4BEEEPwQ7BDUEOQBDAG8AbABvAHUAcgAgAEwAQwBEAEwAQwBEACAAYwBvAHUAbABlAHUAcgBXAGEAcgBuAGEAIABMAEMARAkwCQIJFwlACSgAIABMAEMARABMAEMARAAgDioONQBMAEMARAAgAGUAbgAgAGMAbwBsAG8AcgBGAGEAcgBiAC0ATABDAEQAQwBvAGwAbwByACAATABDAEQATABDAEQAIABDAG8AbABvAHIAaQBkAG8ASwBvAGwAbwByACAATABDAEQDiAOzA8cDwQPJA7wDtwAgA78DuAPMA70DtwAgAEwAQwBEAEYA5AByAGcALQBMAEMARABSAGUAbgBrAGwAaQAgAEwAQwBEAEwAQwBEACAAYQAgAEMAbwByAGUAczCrMOkw/ABMAEMARHRleHQAAAAAQ29weXJpZ2h0IEFwcGxlIEluYy4sIDIwMjIAAFhZWiAAAAAAAADzFgABAAAAARbKWFlaIAAAAAAAAIM3AAA9hP///7xYWVogAAAAAAAAS6UAALNZAAAK1FhZWiAAAAAAAAAn+QAADyMAAMieY3VydgAAAAAAAAQAAAAABQAKAA8AFAAZAB4AIwAoAC0AMgA2ADsAQABFAEoATwBUAFkAXgBjAGgAbQByAHcAfACBAIYAiwCQAJUAmgCfAKMAqACtALIAtwC8AMEAxgDLANAA1QDbAOAA5QDrAPAA9gD7AQEBBwENARMBGQEfASUBKwEyATgBPgFFAUwBUgFZAWABZwFuAXUBfAGDAYsBkgGaAaEBqQGxAbkBwQHJAdEB2QHhAekB8gH6AgMCDAIUAh0CJgIvAjgCQQJLAlQCXQJnAnECegKEAo4C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" />

            </div>
            </button>
            </div>
            </div>
            </div>
            `
              : ""
          }
          `;
      },
      [
        structure,
        options,
        controllerHandleMethod,
        path.join(homedir, "hajonsoft", "visa"),
      ]
    );
    const isExposed = await page.evaluate(
      (p) => window[p],
      controllerHandleMethod
    );
    if (!isExposed) {
      await page.exposeFunction(
        controllerHandleMethod,
        structure.controller.action
      );
      await page.exposeFunction("registerLoop", registerLoop);
      await page.exposeFunction("unregisterLoop", unregisterLoop);
      await page.exposeFunction("getVisaCount", getVisaCount);
      await page.exposeFunction(
        "handleWTUClick",
        structure.controller.wtuAction || (() => {})
      );
      await page.exposeFunction(
        "handleGMAClick",
        structure.controller.gmaAction || (() => {})
      );
      await page.exposeFunction(
        "handleBAUClick",
        structure.controller.bauAction || (() => {})
      );
      await page.exposeFunction(
        "handleTWFClick",
        structure.controller.twfAction || (() => {})
      );
      await page.exposeFunction(
        "handleLoadImportedOnlyClick",
        handleLoadImportedOnlyClick
      );
      await page.exposeFunction("closeBrowser", closeBrowser);
    }
  } catch (err) {
    // console.log(err);
  }
}

function registerLoop() {
  fs.writeFileSync(getPath("loop.txt"), "", "utf8");
}
function unregisterLoop() {
  if (fs.existsSync(getPath("loop.txt"))) {
    fs.unlink(getPath("loop.txt"), (err) => {});
  }
}
function getVisaCount() {
  const files = fs.readdirSync(path.join(homedir, "hajonsoft", "visa"));
  console.log(
    "%cMyProject%cline:570%cfiles",
    "color:#fff;background:#ee6f57;padding:3px;border-radius:2px",
    "color:#fff;background:#1f3c88;padding:3px;border-radius:2px",
    "color:#fff;background:rgb(254, 67, 101);padding:3px;border-radius:2px",
    files
  );
}
async function closeBrowser() {
  await browser.close();
}
async function commander(page, structure, travellers) {
  if (
    !structure.controller ||
    !structure.controller.selector ||
    !structure.controller.action
  ) {
    return;
  }

  try {
    await page.waitForSelector(structure.controller.selector);
    const controllerHandleMethod = `handleEagle${
      structure.controller.name || "Budgie"
    }Click`;
    const isLoop = fs.existsSync(getPath("loop.txt"));
    await page.evaluate(
      (params) => {
        const structureParam = params[0];
        const controller = structureParam.controller;
        const container = document.querySelector(controller.selector);
        const handleMethodName = params[1];
        container.outerHTML = `
          <div style='${
            controller.leftAlign ? "direction: rtl;" : ""
          } background-color: #CCCCCC; border: 2px solid black; border-radius: 16px; padding: 0.5rem; display: flex; align-items: center; justify-content: space-between'>  
          <img style='width: 32px; height: 32px; border-radius: 8px; margin-right: 0.5rem'  src='data:image/jpeg;base64,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'> </img> 
          <h5 style='margin-right: 0.5rem; color: #311b92'> HAJonSoft-Eagle </h5> 

          <button id="${
            structureParam.controller.name
          }" style='background-color: #2196f3; color: #ffffff; width: 6rem, padding: 0.5rem; margin: 0 5px; border-radius: 8px; font-size: 2rem;' type="button" onclick="${handleMethodName}();return false"> ${
          structureParam.controller.title +
          " " +
          structureParam.controller.arabicTitle
        } </button> 
          </div>
          `;
      },
      [structure, controllerHandleMethod, isLoop]
    );
    const isExposed = await page.evaluate(
      (p) => window[p],
      controllerHandleMethod
    );
    if (!isExposed) {
      await page.exposeFunction(
        controllerHandleMethod,
        structure.controller.action
      );
      await page.exposeFunction("closeBrowser", closeBrowser);
    }
  } catch (err) {
    // console.log(err);
  }
}

async function handleLoadImportedOnlyClick() {
  const existingDataRaw = fs.readFileSync(getPath("data.json"), "utf8");
  const existingData = JSON.parse(existingDataRaw);
  const travellersData = [];
  const files = fs.readdirSync(getPath("")).filter((f) => f.endsWith(".txt"));
  const defaultNationalityCode = await page.$eval(
    "#NationalityIsoCode",
    (ele) => ele.value
  );
  if (!defaultNationalityCode) {
    return;
  }
  const defaultNationalityName = await page.$eval(
    "#NationalityIsoCode",
    (ele) => ele.options[ele.selectedIndex].text
  );
  for (const file of files) {
    try {
      const data = fs.readFileSync(getPath(file), "utf8");
      if (data.includes("mofaNumber")) {
        const jsonData = JSON.parse(data);
        const nationality = nationalities.nationalities.find(
          (n) => n.name === jsonData.nationality
        );
        travellersData.push({
          nationality: nationality || {
            name: defaultNationalityName,
            code: defaultNationalityCode,
            telCode: defaultNationalityCode,
          },
          name: { full: jsonData.name || "coming soon" },
          passportNumber: jsonData.passportNumber,
        });
      }
    } catch {}
  }

  const data = {
    system: {
      name: "hsf",
    },
    info: existingData.info,
    travellers: travellersData,
  };

  fs.writeFileSync(getPath("data.json"), JSON.stringify(data));
  await browser.close();
}

const getRange = () => {
  const data = JSON.parse(fs.readFileSync(getPath("data.json"), "utf8"));
  const isCloudRun = data.info.caravan.startsWith("CLOUD_");
  if (isCloudRun) {
    // read range from data.json
    const range = data.info?.range?.replace(",", "-");
    return range ? `range=${range}` : "";
  }
  // Not a cloud run
  const cliRange = process.argv.find((arg) => arg.startsWith("range="));
  if (cliRange) {
    return cliRange?.replace(",", "-");
  }
  return "";
};
function getSelectedTraveler() {
  const data = JSON.parse(fs.readFileSync(getPath("data.json"), "utf8"));
  const range = getRange();
  const fileName = getPath("selectedTraveller" + range + ".txt");
  console.log("counter file name", fileName);
  if (fs.existsSync(fileName)) {
    const lastIndex = fs.readFileSync(fileName, "utf8");
    if (
      parseInt(lastIndex) >= data.travellers.length ||
      (range &&
        parseInt(lastIndex) >= parseInt(range.split("=")[1].split("-")[1]))
    ) {
      process.exit(0);
    }
    if (range && lastIndex < parseInt(range.split("=")[1].split("-")[0])) {
      return range.split("=")[1].split("-")[0];
    }
    return lastIndex;
  } else {
    if (range) {
      fs.writeFileSync(fileName, range.split("=")?.[1]?.split("-")?.[0]);
      return range.split("=")?.[1]?.split("-")?.[0];
    }
    fs.writeFileSync(fileName, "0");
    return "0";
  }
}

function incrementSelectedTraveler(overrideValue) {
  const selectedTraveler = getSelectedTraveler();
  const nextTraveler = parseInt(selectedTraveler) + 1;
  const range = getRange();
  const fileName = getPath("selectedTraveller" + range + ".txt");
  fs.writeFileSync(fileName, nextTraveler.toString());
  return nextTraveler;
}

function setSelectedTraveller(value) {
  getSelectedTraveler(); // Make sure the file exists
  const range = getRange();
  const fileName = getPath("selectedTraveller" + range + ".txt");
  if (fs.existsSync(fileName)) {
    return fs.writeFileSync(fileName, value.toString());
  }
}

function useCounter(currentCounter) {
  return getSelectedTraveler(currentCounter);
}

function setCounter(currentCounter = 0) {
  incrementSelectedTraveler(currentCounter);
}

async function commitFile(selector, fileName, imgElementSelector) {
  if (!fs.existsSync(fileName) || process.argv.includes("noimage")) {
    return;
  }
  await page.waitForSelector(selector);
  if (imgElementSelector) {
    await page.waitForSelector(imgElementSelector);
  }
  // This must be an input with type="file"
  const input = await page.$(selector);
  await input.uploadFile(fileName);
  // await page.$eval(imgElementSelector, e=> e.setAttribute('src', fileName))
}

async function captchaClick(selector, numbers, actionSelector) {
  await page.waitForSelector(selector);
  await page.focus(selector);
  await page.waitForFunction(
    (args) => {
      document.querySelector(args[0]).value.length === args[1];
    },
    { timeout: 0 },
    [selector, numbers]
  );
  await page.click(actionSelector);
}

async function downloadImage(url, imagePath) {
  if (!url) return;
  const writer = fs.createWriteStream(imagePath);
  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });

  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

async function downloadAndResizeImage(
  passenger,
  width,
  height,
  imageType = "photo",
  minKb,
  maxKb
) {
  let folder = photosFolder;
  let url = passenger?.images?.photo;
  if (!url) {
    return path.join(__dirname, "./dummy-image.jpg");
  }

  if (imageType == "passport") {
    folder = passportsFolder;
    url = passenger.images.passport;
  }

  if (imageType == "vaccine") {
    folder = vaccineFolder;
    url = passenger.images.vaccine;
    if (url?.includes("placeholder")) {
      return path.join(__dirname, "covid-1.jpg");
    }
  }

  if (imageType == "vaccine2") {
    folder = vaccineFolder;
    url = passenger.images.vaccine2;
    if (url?.includes("placeholder")) {
      return path.join(__dirname, "covid-2.jpg");
    }
  }

  if (imageType == "id") {
    folder = idFolder;
    url = passenger.images.id;
    if (url?.includes("placeholder")) {
      return path.join(__dirname, "id.jpg");
    }
  }

  let imagePath = path.join(folder, `${passenger.passportNumber}.jpg`);
  const resizedPath = path.join(
    folder,
    `${passenger.passportNumber}_${width}x${height}.jpg`
  );

  if (url?.includes("placeholder")) {
    return path.join(__dirname, "dummy-image.jpg");
  }

  const writer = fs.createWriteStream(imagePath);
  if (!url) {
    return path.join(__dirname, "dummy-image.jpg");
  }
  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });

  response.data.pipe(writer);
  const result = new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
  await result;

  const overridePhoto = path.join(
    __dirname,
    "..",
    "photos",
    passenger.passportNumber + ".jpg"
  );
  if (imageType == "photo" && fs.existsSync(overridePhoto)) {
    console.log("override found at: ", overridePhoto);
    imagePath = overridePhoto;
  }
  await sharp(imagePath)
    .resize(width, height, {
      fit: sharp.fit.inside,
      withoutEnlargement: true,
    })
    .toFile(resizedPath);
  let sizeAfter = Math.round(fs.statSync(resizedPath).size / 1024);
  if (sizeAfter < minKb) {
    for (let i = 1; i < 20; i++) {
      // TODO: handle this better. May be increase image size on desk by stuffing strings in the image
      await sharp(imagePath)
        .resize(width * i, height * i, {
          fit: sharp.fit.inside,
          withoutEnlargement: true,
        })
        .toFile(resizedPath);
      sizeAfter = Math.round(fs.statSync(resizedPath).size / 1024);
      if (sizeAfter > minKb) {
        return resizedPath;
      }
    }
  }

  // TODO: Test with wtu group 7 pax because the size of the photo is too small
  if (sizeAfter > maxKb) {
  }
  return resizedPath;
}

const loopMonitor = [];

function isCodelineLooping(traveller, numberOfEntries = 1) {
  if (!traveller) {
    return true;
  }

  loopMonitor.push({
    key: traveller.codeline,
    data: traveller,
  });
  if (
    loopMonitor.filter((x) => x.key === traveller.codeline).length >
    numberOfEntries
  ) {
    return true;
  }
  return false;
}

function endCase(name) {
  const regEx = new RegExp(`${name}[_-]only`);
  if (process.argv.some((arg) => regEx.test(arg))) {
    browser.disconnect();
  }
}

async function sniff(page, details) {
  //TODO: Add xPath processing for all page operations below so we can sniff based on xPath
  // TODO: Sniff tawaf birth place and other important fields
  for (const detail of details) {
    if (detail.autocomplete) {
      let tagName = await page.$eval(detail.selector, (el) => el.tagName);
      switch (tagName.toLowerCase()) {
        case "input":
          let inputText = await page.$eval(
            detail.selector,
            (el) => el.value || el.innerText
          );
          if (detail.autocomplete && inputText) {
            budgie.save(detail.autocomplete, inputText);
          }
          break;
        case "select":
          let selectedValue = await page.$eval(
            detail.selector,
            (el) => el.value,
            tagName
          );
          if (detail.autocomplete && selectedValue) {
            budgie.save(detail.autocomplete, selectedValue);
          }
          break;
      }
    }
  }
}

let mofaData = {};

function getMofaData() {
  return mofaData;
}
async function handleMofa(currentPage, id1, id2, mofa_visaTypeValue) {
  const url = await currentPage.url();
  if (!url) {
    return;
  }
  switch (url.toLowerCase()) {
    case "https://visa.mofa.gov.sa/".toLowerCase():
    case "https://visa.mofa.gov.sa".toLowerCase():
      mofaData = {};
      const closeButtonSelector =
        "#dlgMessageContent > div.modal-footer > button";
      await currentPage.waitForSelector(closeButtonSelector);
      await currentPage.$eval(closeButtonSelector, (btn) => {
        btn.click();
      });

      if (mofa_visaTypeValue && /^[0-9]{1,5}$/.test(mofa_visaTypeValue)) {
        await currentPage.select("#SearchingType", mofa_visaTypeValue);
      }
      await currentPage.waitForSelector("#ApplicationNumber");
      await currentPage.type("#ApplicationNumber", id1);
      await currentPage.type("#SponserID", id2);

      await waitForPageCaptcha(currentPage, "#Captcha", 6);
      await sniff(currentPage, [
        { selector: "#SearchingType", autocomplete: "mofa_visaType" },
        { selector: "#ApplicationNumber", autocomplete: "mofa_id1" },
        { selector: "#SponserID", autocomplete: "mofa_id2" },
      ]);
      await currentPage.click("#btnSearch");
      break;
    case "https://visa.mofa.gov.sa/Home/PrintVisa".toLowerCase():
      const applicationTypeSelector =
        "#content > div > div.row > div > div > div.portlet-body.form > div.form-body.form-display.form-horizontal.page-print > div:nth-child(1) > div:nth-child(2) > h2";
      const applicationType = await readValue(
        currentPage,
        applicationTypeSelector
      );
      if (applicationType == "خطاب الدعوة") {
        mofaData.applicationType = "invitation";

        const inv_id1Selector =
          "#content > div > div.row > div > div > div.portlet-body.form > div.form-body.form-display.form-horizontal.page-print > div:nth-child(4) > div:nth-child(2) > label";
        const id2Selector =
          "#content > div > div.row > div > div > div.portlet-body.form > div.form-body.form-display.form-horizontal.page-print > div:nth-child(5) > div:nth-child(4) > label";

        const sponsorNameSelector =
          "#content > div > div.row > div > div > div.portlet-body.form > div.form-body.form-display.form-horizontal.page-print > div:nth-child(5) > div:nth-child(2) > label";
        const addressSelector =
          "#content > div > div.row > div > div > div.portlet-body.form > div.form-body.form-display.form-horizontal.page-print > div:nth-child(7) > div > label";
        const visaTypeSelector =
          "#tblDocumentVisaList > tbody > tr > td:nth-child(1)";
        const embassySelector =
          "#tblDocumentVisaList > tbody > tr > td:nth-child(5)";
        const nameSelector =
          "#tblDocumentVisaList > tbody > tr > td:nth-child(4)";
        const professionSelector =
          "#tblDocumentVisaList > tbody > tr > td:nth-child(8)";
        const id1Selector =
          "#content > div > div.row > div > div > div.portlet-body.form > div.form-body.form-display.form-horizontal.page-print > div:nth-child(4) > div:nth-child(2) > label";
        const telSelector =
          "#content > div > div.row > div > div > div.portlet-body.form > div.form-body.form-display.form-horizontal.page-print > div:nth-child(6) > div > label";
        const numberOfEntriesSelector =
          "#tblDocumentVisaList > tbody > tr > td:nth-child(9)";
        const durationSelector =
          "#tblDocumentVisaList > tbody > tr > td:nth-child(10)";

        // #content > div > div.row > div > div > div.portlet-body.form > div.form-body.form-display.form-horizontal.page-print > div:nth-child(4) > div:nth-child(2) > label
        mofaData = {
          ...mofaData,
          name: await readValue(currentPage, nameSelector),
          sponsorName: await readValue(currentPage, sponsorNameSelector),
          tel: await readValue(currentPage, telSelector),
          address: await readValue(currentPage, addressSelector),
          numberOfEntries: await readValue(
            currentPage,
            numberOfEntriesSelector
          ),
          embassy: await readValue(currentPage, embassySelector),
          duration: await readValue(currentPage, durationSelector),
          visaType: await readValue(currentPage, visaTypeSelector),
          id1: await readValue(currentPage, id1Selector),
          id2: await readValue(currentPage, id2Selector),
          profession: await readValue(currentPage, professionSelector),
        };
      } else if (applicationType == "مستند تأشيرة") {
        mofaData.applicationType = "visa";
        const sponsorNameSelector =
          "#content > div > div.row > div > div > div.portlet-body.form > div.form-body.form-display.form-horizontal.page-print > div:nth-child(5) > div:nth-child(2) > label";
        const addressSelector =
          "#content > div > div.row > div > div > div.portlet-body.form > div.form-body.form-display.form-horizontal.page-print > div:nth-child(7) > div > label";
        const visaTypeSelector =
          "#tblDocumentVisaList > tbody > tr > td:nth-child(1)";
        const embassySelector =
          "#tblDocumentVisaList > tbody > tr > td:nth-child(5)";
        const nameSelector =
          "#tblDocumentVisaList > tbody > tr > td:nth-child(4)";
        const id2Selector =
          "#content > div > div.row > div > div > div.portlet-body.form > div.form-body.form-display.form-horizontal.page-print > div:nth-child(5) > div:nth-child(4) > label";
        const professionSelector =
          "#tblDocumentVisaList > tbody > tr > td:nth-child(8)";
        const id1Selector =
          "#content > div > div.row > div > div > div.portlet-body.form > div.form-body.form-display.form-horizontal.page-print > div:nth-child(4) > div:nth-child(2) > label";
        const telSelector =
          "#content > div > div.row > div > div > div.portlet-body.form > div.form-body.form-display.form-horizontal.page-print > div:nth-child(6) > div > label";
        const numberOfEntriesSelector =
          "#tblDocumentVisaList > tbody > tr > td:nth-child(9)";
        const durationSelector =
          "#tblDocumentVisaList > tbody > tr > td:nth-child(10)";

        mofaData = {
          ...mofaData,
          name: await readValue(currentPage, nameSelector),
          sponsorName: await readValue(currentPage, sponsorNameSelector),
          tel: await readValue(currentPage, telSelector),
          address: await readValue(currentPage, addressSelector),
          numberOfEntries: await readValue(
            currentPage,
            numberOfEntriesSelector
          ),
          embassy: await readValue(currentPage, embassySelector),
          duration: await readValue(currentPage, durationSelector),
          visaType: await readValue(currentPage, visaTypeSelector),
          id1: await readValue(currentPage, id1Selector),
          id2: await readValue(currentPage, id2Selector),
          profession: await readValue(currentPage, professionSelector),
        };
      }

      break;
  }
}

async function readValue(currentPage, selector) {
  await currentPage.waitForSelector(selector);
  const value = await currentPage.$eval(selector, (ele) => ele.innerText);
  return value;
}

async function waitForCaptcha(selector, captchaLength, timeout = 0) {
  const captchaElement = await page.$(selector);
  if (!captchaElement) {
    return;
  }
  try {
    await page.waitForSelector(selector);
    await page.evaluate((cap) => {
      const captchaElement = document.querySelector(cap);
      captchaElement.scrollIntoView({ block: "end" });
      captchaElement.value = "";
    }, selector);
    await page.focus(selector);
    await page.hover(selector);
    await page.waitForFunction(
      `document.querySelector('${selector}').value.length === ${captchaLength}`,
      { timeout }
    );
  } catch (err) {
    console.log(err);
  }
}

async function waitForPageCaptcha(
  captchaPage,
  selector,
  captchaLength,
  timeout = 0
) {
  await captchaPage.waitForSelector(selector);
  await captchaPage.bringToFront();
  await captchaPage.evaluate((cap) => {
    const captchaElement = document.querySelector(cap);
    captchaElement.scrollIntoView({ block: "end" });
    captchaElement.value = "";
  }, selector);
  await captchaPage.focus(selector);
  await captchaPage.hover(selector);
  await captchaPage.waitForFunction(
    `document.querySelector('${selector}').value.length === ${captchaLength}`,
    { timeout }
  );
}

async function commitCaptchaToken(
  page,
  imgId,
  textFieldSelector,
  captchaLength = 6
) {
  await page.waitForTimeout(3000);
  infoMessage(page, "🔓 Captcha thinking...");

  try {
    const base64 = await page.evaluate((selector) => {
      const image = document.getElementById(selector);
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      canvas.getContext("2d").drawImage(image, 0, 0);
      const dataURL = canvas.toDataURL();
      return dataURL.replace("data:", "").replace(/^.+,/, "");
    }, imgId);

    if (!base64) {
      return;
    }

    const captchaSolver = new RuCaptcha2Captcha(
      "637a1787431d77ad2c1618440a3d7149",
      2
    );
    const id = await captchaSolver.send({
      method: "base64",
      body: base64,
      max_len: captchaLength,
      min_len: captchaLength,
    });

    const token = await captchaSolver.get(id);
    infoMessage(page, `🔓 Captcha solved! ${token}`);

    await commit(
      page,
      [{ selector: textFieldSelector, value: () => token }],
      {}
    );
    return token;
  } catch (err) {
    infoMessage(page, `🔓 Captcha error!!!`);
  }
}

async function commitCaptchaTokenWithSelector(
  page,
  imageSelector,
  textFieldSelector,
  captchaLength = 6
) {
  infoMessage(page, "🔓 Captcha is being solved...");
  try {
    const base64 = await page.evaluate((selector) => {
      const image = document.querySelector(selector);
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      canvas.getContext("2d").drawImage(image, 0, 0);
      const dataURL = canvas.toDataURL();
      return dataURL.replace("data:", "").replace(/^.+,/, "");
    }, imageSelector);

    if (!base64) {
      return;
    }

    const captchaSolver = new RuCaptcha2Captcha(
      "637a1787431d77ad2c1618440a3d7149",
      2
    );

    const id = await captchaSolver.send({
      method: "base64",
      body: base64,
      max_len: captchaLength,
      min_len: captchaLength,
    });

    const token = await captchaSolver.get(id);
    await commit(
      page,
      [{ selector: textFieldSelector, value: () => token.toString() }],
      {}
    );
    infoMessage(page, "🔓 Captcha solved! " + token);
    return token;
  } catch (err) {
    infoMessage(page, "🔓 Captcha error!");
  }
}

const premiumSupportAlert = async (page, selector, data) => {
  const adNode = await page.$(selector);
  if (!adNode) {
    return;
  }
  await page.$eval(
    selector,
    (el, json) => {
      return (el.outerHTML = `<div style="width: 100%; height: 100px; background-color: #4CAE4F; padding: 16px 8px 8px 16px ">
      <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px">
<img style='width: 32px; height: 32px; border-radius: 8px; margin-right: 0.5rem'  src='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAAyADIDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD96PGvjXR/hv4P1TxB4g1Sw0XQtDtJb7UNQvZ1gtrK3jUvJLJIxCqiqCSxIAANfix+21/wdvSxeMbzw3+zv4L0vUraF2ji8S+LI52N+BkGS306No5VQjDK88itz88C4wf0X/4Kp+GfhX8R/hBo/hr4yeItWh8B3F+uoX/hPR5XhvfGb25V4LaR42WQWiSYlcKY90qW2ZkUNHL82+Cf+CmvhX9nTRP+Ef8Ag58D/B3gfwzCw2wQeXZm4x0d4reJVDnJJYu5JJJJJr6HKeFc0zKHtMJSbj3bSXybav8AK58/m3FWV5dP2eLqpS7JNv5pJ2+dj81fAf8AwdG/tXeGfFjXl7rngHxTbxuVl0vUfDiRwJzyoa2eKVWHbc5weoPQ/fH7MX/B2x8JfG9jbWvxY8C+LPh5qxwst7pQXXdJ4wC+VCXK5OTsEEmBxvY8nF/4KIftteGf2xP2eruzvP2aPhr46+IW37PZ3XiXUWWLT4iMtLBcwpDdq5YAeVHcW4wxPncbW/Ln4Jf8Ec/jp8cdIjudNsfA+m7iyLBrPjbSrW8bazISbcTNKgJUkF0XcMMuVIJyzDhvNMC7YmhJLuldferr8TXL+JMsxqvhq0X5N2f3Oz/A/oA8O/8ABwL+x74ntPOt/jbotupz8t9pWo2Mn/fE1ujfpWP45/4ONv2O/A1nLI3xa/taaNN6waX4d1S6aT2DrbeWD/vOo96/GzRv+DcP9oi9ulXU9Y+C3hm2YZN3qvjZBCo9T5MUrf8AjtfYP/BOr/g3G+DNn8YtJuPiX8ZvD3xe17Rwurt4Q8KqjaP+5kQEXsxMj3EG9kBjK24bIVg6llby44Su4uag7Ld2dl6npyxdBSUHNXeyurv0P1X+Gv7VN58Wfhz4f8VaP8LfiU2k+JtNt9VsTcpplrOYJ4llj3xSXoeNtrjKOAynIIBBFFet0VznQfPUP/BPbwz8R/iTqXjj4oyTeNvE2qODHaNM8Wl6RCufKtoY1KmRUU4LScSMWk8tGcirv7QX7I/wY0/4G+JmvvDPgPwParp0sY1+HQ7WObSWZSiTo2wFpFZlKqc7n2jDZwfeK+dtb+DGm/t6eJ4fEHiLVJr74YaDe3FtouhWc7RQ6xdQSyW819cyKQWUSJIkSIcbF37iJmjH0uEzLFYiaqYrEThSp2Xut6LpGEU0k3bTZaNvY+bxeW4WhBww2HhOrO795LV9ZTbTbSvru9UlufnB8RPBfhn4ifERtN+Cvh/4g69p1jCsczXMBvrm6cADzhFDFuhRsFvnPO77sYG2gfsafFe6C/8AFtfGTbum7SpB+eRx+Nfst4S8HaT4B0GDS9D0vT9H0y1GIbSyt0t4Y/oigAflXGa/+1r8OPCnxefwLqni3S9N8URxxyNa3TNDGpkG5EMzARCRlKkRlt5DqQMEV9xQ8SMa/wBzgMM5qC3k5TlZbyk0l8+i7nw9fw4waftsdiFBye0VGEbv7MU2/l1fY/M74ef8EuPjF49vI1fwna+HbWTrdaxeRQon1jjLzf8AkP8AGv0E/Yf/AGJtN/Y78H30Zvl1vxJrbo+oaiIPJUIgOyCJckiNSWOScszEnA2qvuQORRXyefccZlmtJ4eraNN7qKettrttv5XS8j6zIeB8tyqqsRSvKa2cmtL72SSX4N+YUUUV8cfYHn37WHiy+8C/sx/EDWNMkkh1DT/D97NbSxnDQSCFtsg91PzfhXz1/wAEe/2gdJ8RfA//AIVzNNDb674TlnmtrdmAa8spZWl8xP72ySR0YD7o8sn7wr648UeGrLxn4Z1HR9SgW603VrWWzuoWJAmikQo6nHPKkj8a/Ij9pP8AZD8efsVePP7RiOrNotjcebpPijT2aPyx0TzJI8GCbBwQcBjnaWGcfofCODwWZ4CvlFaahVlKM4N9Wk1bztd6b2ldbM/PuLcZjcsx1DNqMHOlGMozS6JtO/ley12urPdH7C1+fvxI/wCCPnijxd8eF1Obxlaa54b8Qao97rd5cobbU4Ud2kkCooaN2YfKrAqFLD93tWuD+Ev/AAWJ+JHgqzhtvEem6H40t4x/r5M6feyf70kYaI/hCD6k16dB/wAFv7M22ZfhreLN/dTW0ZP++jCD+ld+X8NcU5NVm8BCMuZWbTi/S3M1JW32Xnc4Mw4k4XzmlBY6bXK7pNSXrflTi77bvysfcug6FZ+F9Ds9M062hs9P06BLW2t4l2xwRIoVEUdgFAAHoK5v4mfEK58N694a0HSYY7rXPEt7sVXBKWllDte7uXx0VUKxqeR51xACMMa+Jh/wVh+KPx415PDvwx+HGnx6xdfKA00mqSxA8eYSFhjiAJHzy5Qd+K+qP2T/AIA+IPhlpl54j8f69L4r+I3iJEGo37vuisIFJZLO2UBVjiVmZiEVQ7sTjAXHy+P4dr5ZH22ZuKm9ocylJt9Xa6UVu23rslq2vqMBxDQzOXscsUnBbzs4xSXRXs3J7JJabt6JP2CiiivlT6gKbJGs0bKyqysMMpGQR6GiinHcUtj4v/4KG/A7wV4Zgt7rTfB/hfT7q5iaSaa20qCGSVtx+ZmVQSfc186/s1fDzw/4h+Jlpb6hoej31uzJuiuLKOVDz3DAiiiv6Wyv/kWr0P5uzT/kYv1P1G8HeBND+Hejrp/h/RtJ0LT1O5bbT7SO1hB9diAD9K1qKK/njNv98qerP6Cyn/c6f+FBRRRXnnoH/9k='> </img> 
    <div style="font-size: 1.5rem;">Eagle Support</div>
    </div>
    <span style="font-size: 1.4rem; margin-bottom: 8px;">
      Pay as-you-go. hire a worker!
      </span>

      <button onclick="location.href='https://hajonsoft.on.spiceworks.com/portal/registrations'" type="button" style="background-color: #5B9A63; color: #C7E5C8; border: none; padding: 8px 16px; border-radius: 4px; font-size: 1.4rem; cursor: pointer;">
      Pay ${json.travellers.length * 1.5}.00 USD to a temporary worker (${
        json.travellers.length
      } pax x $1.5 = ${json.travellers.length * 1.5} USD)
      </button
       
      
        </div>
        </div>
        
        `);
    },
    data
  );
};

function getOverridePath(original, override) {
  if (fs.existsSync(override)) {
    console.log("override found: using ", override);
    return override;
  }

  return original;
}
async function uploadImage(fileName) {
  return new Promise(async (resolve, reject) => {
    imgurClient.on("uploadProgress", (progress) => console.log(progress));
    imgurClient
      .upload({
        image: fs.createReadStream(fileName),
        type: "stream",
      })
      .then((json) => {
        resolve(json.data.link);
      })
      .catch((err) => {
        resolve("Error uploading image to imgur " + fileName);
      });
  });
}

function updatePassengerInKea(accountId, passportNumber, params = {}, logFile) {
  axios
    .post(
      "https://us-central1-hajonsoft-kea.cloudfunctions.net/https-putPassenger",
      {
        accountId,
        passportNumber,
        ...params,
      }
    )
    .then((result) => {
      // Log post call
      if (!logFile) return;
      fs.appendFileSync(
        logFile,
        `Writing to kea: ${JSON.stringify(params)} (status: ${result.status})\n`
      );
    })
    .catch((err) => {
      if (!logFile) return;
      fs.appendFileSync(
        logFile,
        `Writing to kea: ${JSON.stringify(params)} (status: ${err.status})\n`
      );
    });
}

const infoMessage = async (page, message, depth = 2, screenshot, title) => {
  const screenshotsDir = getPath("screenshots");
  if(!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir)
  }
  const signature = path.join(screenshotsDir,`${moment().format("YYYY-MM-DD-HH-mm-ss")}.png`);
  console.log("signature", signature);
  if (page) {
    try {
      await page.evaluate("document.title='" + message + "'");
      // Capture screenshot and display image in log
      await page.screenshot({ path: signature, fullPage: true });
      const url = await uploadImage(signature);
      console.log("Screenshot: ", url);
      // upload image to imgur and get url
      if (screenshot) {
        const additionalUrl = await uploadImage(screenshot);
        console.log(`${title} ${additionalUrl}`);
      }
    } catch (e) {
      console.log("Error while taking screenshot: ", e);
    }
  }

  console.log(`🦅 ${getSelectedTraveler()}.${".".repeat(depth)}${message}`);
};

const hijriYear = 44;

module.exports = {
  getTmpDir,
  getPath,
  hijriYear,
  findConfig,
  commit,
  controller,
  commander,
  initPage,
  useCounter,
  commitFile,
  captchaClick,
  downloadImage,
  photosFolder,
  passportsFolder,
  vaccineFolder,
  isCodelineLooping,
  endCase,
  setCounter,
  selectByValue,
  sniff,
  newPage,
  handleMofa,
  mofaData,
  getMofaData,
  waitForCaptcha,
  waitForPageCaptcha,
  VISION_DEFICIENCY,
  downloadAndResizeImage,
  commitCaptchaToken,
  commitCaptchaTokenWithSelector,
  getIssuingCountry,
  premiumSupportAlert,
  getOverridePath,
  getSelectedTraveler,
  incrementSelectedTraveler,
  setSelectedTraveller,
  updatePassengerInKea,
  infoMessage,
  isCloudRun
};
