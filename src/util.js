const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-extra");
const os = require("os");
const RuCaptcha2Captcha = require("rucaptcha-2captcha");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const RecaptchaPlugin = require("puppeteer-extra-plugin-recaptcha");
// TODO: Find out the best way to use this plugin
// puppeteer.use(RecaptchaPlugin());
const { getPath } = require("./lib/getPath");

const sharp = require("sharp");
const budgie = require("./budgie");
const axios = require("axios");
const nationalities = require("./data/nationalities");
const moment = require("moment");
const _ = require("lodash");
const beautify = require("beautify");
const homedir = require("os").homedir();
const photosFolder = path.join(homedir, "hajonsoft", "photos");
const idFolder = path.join(homedir, "hajonsoft", "id");
const passportsFolder = path.join(homedir, "hajonsoft", "passports");
const residencyFolder = path.join(homedir, "hajonsoft", "residency");
const vaccineFolder = path.join(homedir, "hajonsoft", "vaccine");

const VISION_DEFICIENCY = "none";
const kea = require("./lib/kea");
const { array } = require("yargs");

const MRZ_TD3_LINE_LENGTH = 44;


let page;
let browser;
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
    "--use-fake-ui-for-media-stream",
  ];

  const isCloudRun = Boolean(data?.info?.caravan?.startsWith("CLOUD_"));
  if (!isCloudRun) {
    args.push("--incognito");
  }

  const isWindowed = process.argv.find((c) => c.startsWith("-windowed"));
  if (!process.argv.find((c) => c.startsWith("range=")) && !isWindowed) {
    args.push("--start-fullscreen");
  }

  const isHeadless = Boolean(
    process.argv.find((c) => c.startsWith("--headless"))
  );

  let defaultViewport = null;
  if (process.argv.includes("--auto")) {
    const autoIndexArg = process.argv.find((c) => c.startsWith("--index"));
    if (autoIndexArg) {
      const indexArray = autoIndexArg.split("=")?.[1]?.split("/");
      if (indexArray.length === 2) {
        const monitorWidth = parseInt(process.argv
          .find((c) => c.startsWith("--monitor-width"))
          ?.split("=")?.[1]);
        const monitorHeight = parseInt(process.argv
          .find((c) => c.startsWith("--monitor-height"))
          ?.split("=")?.[1]);

        const index = parseInt(indexArray[0]);
        const total = parseInt(indexArray[1]);
        let rows = 1;
        let cols = 1;

        switch (total) {
          case 2:
            rows = 1;
            cols = 2;
            break;
          case 3:
            rows = 2;
            cols = 2;
            break;
          case 4:
            rows = 2;
            cols = 2;
            break;
          case 5:
            rows = 2;
            cols = 3;
            break;
          case 6:
            rows = 2;
            cols = 3;
            break;
          case 7:
            rows = 2;
            cols = 4;
            break;
          case 8:
            rows = 2;
            cols = 4;
            break;
          case 9:
            rows = 3;
            cols = 3;
            break;
          case 10:
            rows = 3;
            cols = 4;
            break;
          case 11:
            rows = 3;
            cols = 4;
            break;
          case 12:
            rows = 3;
            cols = 4;
            break;
          case 13:
            rows = 3;
            cols = 5;
            break;
          case 14:
            rows = 3;
            cols = 5;
            break;
          case 15:
            rows = 3;
            cols = 5;
            break;
          default:
            rows = 1;
            cols = 1;
            break;
        }

        const boxWidth = Math.floor(monitorWidth / cols);
        const boxHeight = Math.floor(monitorHeight / rows);

        const row = Math.floor(index / cols);
        const column = index % cols;

        const xPos = column * boxWidth;
        const yPos = row * boxHeight;

        args.push(
          `--window-size=${boxWidth},${boxHeight}`,
          `--window-position=${xPos},${yPos}`
        );
        defaultViewport = {
          width: monitorWidth,
          height: monitorHeight,
        };
      }
    }
  }

  const launchOptions = {
    headless: process.argv.includes("--debug") ? false : isCloudRun || isHeadless,
    ignoreHTTPSErrors: true,
    defaultViewport,
    args,
  };

  if (process.argv.includes("--debug") || (!isCloudRun && !isHeadless)) {
    launchOptions.executablePath = getChromePath();
  }
  browser = await puppeteer.launch(launchOptions);
  const pages = await browser.pages();
  page = pages[0];
  await page.bringToFront();
  page.on("domcontentloaded", onContentLoaded);

  page.on("dialog", async (dialog) => {
    await pauseMessage(page, 5);
    try {
      await dialog.accept();
    } catch { }
  });

  if (process.argv.length > 2) {
    page.on("console", (msg) => {
      // console.log("Eagle: Message=> " + msg.text());
    });
  }
  // await page.setUserAgent(
  //   "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Safari/537.36."
  // );

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
  if (!fs.existsSync(residencyFolder)) {
    fs.mkdirSync(residencyFolder);
  }
  if (!fs.existsSync(vaccineFolder)) {
    fs.mkdirSync(vaccineFolder);
  } else {
    fs.readdir(vaccineFolder, (err, files) => {
      for (const file of files) {
        fs.unlink(path.join(vaccineFolder, file), (err) => { });
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
  fieldFunction = async () => { }
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
let lastTime = new Date();
function timeElapsed() {
  // find time difference in seconds between now and lastTime, then set lasttime to now
  const now = new Date();
  const diff = (now.getTime() - lastTime.getTime()) / 1000;
  lastTime = now;
  return diff.toFixed(0);
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
      `✈️  Workflow: ${urlConfig.name} ${urlConfig.url || urlConfig.regex
      } ${timeElapsed()} seconds`,
      2
    );
    return urlConfig;
  }
  return {};
}

function findGorillaConfig(url, gorillaConfigsString) {
  if (!gorillaConfigsString) {
    return;
  }
  const lowerUrl = url?.toLowerCase();
  let gorillaConfigs = "";
  try {
    gorillaConfigs = JSON.parse(gorillaConfigsString);
  } catch (e) {
    console.log("Invalid Gorilla Script, skipping gorilla...", gorillaConfigsString);
    return;
  }
  if (!Array.isArray(gorillaConfigs)) {
    return;
  }

  // Find the first matching gorilla configuration
  const matchedGorilla = gorillaConfigs.find((gorilla) => {
    return RegExp(gorilla.regex).test(lowerUrl);
  });
  if (matchedGorilla) {
    infoMessage(
      page,
      `🦍  Gorilla: ${matchedGorilla.description} ${matchedGorilla.regex}`,
      2
    );
    return matchedGorilla;
  }
}

async function commit(page, details, row) {
  if (!details) return;
  if (details?.[0]?.selector) {
    await page.waitForSelector(details?.[0].selector, {
      timeout: 900000,
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
        }

        if (value) {
          if (detail.selector) {
            await page.type(detail.selector, (value || "").toString());
            if (detail.setValueDirectly) {
              await page.$eval(
                detail.selector,
                (el, value) => (el.value = (value || "").toString()),
                value
              );
            }
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
  const valuePattern = new RegExp(`value="(.*)".*?>.*?${txt}</option>`, "im");
  const found = valuePattern.exec(options.replace(/\n/gim, ""));
  if (found && found.length >= 2) {
    await page.select(selector, found[1]);
  }
}

async function selectByValueStrict(selector, txt) {
  try {
    await page.waitForSelector(selector);
    const options = await page.$eval(selector, (e) => e.innerHTML);
    const valuePattern = new RegExp(
      `value="(.{6,7})"( selected="selected")?>${txt}</option>`,
      "im"
    );
    const found = valuePattern.exec(options.replace(/\n/gim, ""));
    if (found && found.length >= 2) {
      await page.select(selector, found[1]);
    }
  } catch (e) {
    console.log("unable to select by value strict", selector);
  }
}

function getMofaImportString(passenger) {
  const passportNumber = passenger.passportNumber;
  const mofaNumber = passenger.mofaNumber;
  if (mofaNumber) {
    return " - MOFA: " + mofaNumber;
  }
  try {
    const file = getPath(passportNumber + ".txt");
    if (fs.existsSync(file)) {
      const importContent = fs.readFileSync(file, "utf-8");
      const importJSON = JSON.parse(importContent);
      return " - MOFA: " + importJSON?.status;
    }
  } catch { }
  return "";
}

function getOptionNode(passenger, cursor) {
  return `
  <div style="width: 100%; display: flex; align-items: center; gap: 1rem; background-color: yellow; height: 200px;">
    <div>${cursor + 1}- </div>
    <div>
    ${passenger.nationality?.isArabic
      ? passenger?.nameArabic?.given + " " + passenger.nameArabic.last
      : passenger.name.full
    } - ${passenger.passportNumber} - ${passenger?.nationality?.name} - ${passenger?.gender || "gender"
    } - ${passenger?.dob?.age || "age"} years old${getMofaImportString(
      passenger
    )}${passenger.email?.includes(".companion") || passenger.isCompanion
      ? "(companion)"
      : ""
    }
    </div>
  </div>
  `;
}

async function controller(page, structure, travellers) {
  if (global.headless) {
    return;
  }
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
      // .filter((t) => !t.email.includes(".companion"))
      .map(
        (traveller, cursor) =>
          `<option value="${cursor}" ${cursor == lastTraveler ? "selected" : ""
          }>
          ${getOptionNode(traveller, cursor)}
          </option>`
      )
      .join(" ");

  try {
    await page.waitForSelector(structure.controller.selector);
    const controllerHandleMethod = `handleEagle${structure.controller.name || "Send"
      }Click`;
    const htmlFileName = path.join(__dirname, "assets", "controller.html");
    let html = fs.readFileSync(htmlFileName, "utf8");

    // Attach controller
    await page.evaluate(
      (params) => {
        const structureParam = params[0];
        const optionsParam = params[1];
        const controller = structureParam.controller;
        const container = document.querySelector(controller.selector);
        const handleMethodName = params[2];
        const visaPath = structureParam.controller.visaPath || params[3];
        const htmlContent = params[4];
        const pax = params[5];
        const lastTraveler = params[6];
        container.outerHTML = `${htmlContent
          .replace(/{handleMethodName}/, handleMethodName)
          .replace(/{options}/, optionsParam)
          .replace(/{visaPath}/, visaPath)
          .replace(/{pax}/, pax.length)
          .replace(/{current}/, (parseInt(lastTraveler) + 1).toString())
          .replace(/{mokhaa}/, controller.mokhaa ? "block" : "none")}`.replace(
            /{sendall}/,
            "Continuous مستمر"
          );
      },
      [
        structure,
        options,
        controllerHandleMethod,
        path.join(homedir, "hajonsoft", "visa"),
        html,
        travellers,
        lastTraveler,
      ]
    );
    const isRegisterLoopRegistered = await page.evaluate(
      () => window.registerLoop
    );
    if (!isRegisterLoopRegistered) {
      await page.exposeFunction("registerLoop", registerLoop);
    }

    const isExposed = await page.evaluate(
      (p) => window[p],
      controllerHandleMethod
    );
    if (!isExposed) {
      await page.exposeFunction(
        controllerHandleMethod,
        structure.controller.action
      );
      await page.exposeFunction("unregisterLoop", unregisterLoop);
      await page.exposeFunction("getVisaCount", getVisaCount);
      await page.exposeFunction(
        "handleWTUClick",
        structure.controller.wtuAction || (() => { })
      );
      await page.exposeFunction(
        "handleGMAClick",
        structure.controller.gmaAction || (() => { })
      );
      await page.exposeFunction(
        "handleBAUClick",
        structure.controller.bauAction || (() => { })
      );
      await page.exposeFunction(
        "handleTWFClick",
        structure.controller.twfAction || (() => { })
      );
      await page.exposeFunction(
        "handleLoadImportedOnlyClick",
        handleLoadImportedOnlyClick
      );
      await page.exposeFunction(
        "handleNSKClick",
        structure.controller.nskAction || (() => { })
      );
      await page.exposeFunction("closeBrowser", closeBrowser);
    }
  } catch (err) {
    // console.log(err);
  }
}

function registerLoop() {
  fs.writeFileSync(getPath("loop.txt"), "", "utf8");
  console.log("Loop registered");
}
function unregisterLoop() {
  if (fs.existsSync(getPath("loop.txt"))) {
    fs.unlink(getPath("loop.txt"), (err) => { });
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
  if (global.headless) {
    return;
  }
  if (
    !structure.controller ||
    !structure.controller.selector ||
    !structure.controller.action
  ) {
    return;
  }

  try {
    await page.waitForSelector(structure.controller.selector, {
      timeout: 0,
    });
    const controllerHandleMethod = `handleEagle${structure.controller.name || "Budgie"
      }Click`;
    const isLoop = fs.existsSync(getPath("loop.txt"));

    const htmlFileName = path.join(__dirname, "assets", "commander.html");
    const html = fs.readFileSync(htmlFileName, "utf8");

    await page.evaluate(
      (params) => {
        const structureParam = params[0];
        const controller = structureParam.controller;
        const container = document.querySelector(controller.selector);
        const alertText = controller.alert;
        const handleMethodName = params[1];
        const htmlContent = params[3]
          .replace(/{direction}/, controller.leftAlign ? "direction: rtl;" : "")
          .replace(
            /{structureParam+controller_name}/,
            params[0].controller.name
          )
          .replace(/{handleMethodName}/, handleMethodName)
          .replace(/{alert}/, alertText || "")
          .replace(
            /{title}/g,
            structureParam.controller.title +
            " " +
            structureParam.controller.arabicTitle
          );
        container.outerHTML = controller.keepOriginalElement
          ? `<div>${container.outerHTML}${htmlContent}</div>`
          : htmlContent;
      },
      [structure, controllerHandleMethod, isLoop, html]
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
    }

    const isCloseBrowserExposed = await page.evaluate(
      (p) => window[p],
      "closeBrowser"
    );
    if (!isCloseBrowserExposed) {
      await page.exposeFunction("closeBrowser", closeBrowser);
    }
  } catch (err) {
    console.log(err);
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
    } catch { }
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

function downloadPDF(pdfUrl, pdfName) {
  const pdfPath = path.join(homedir, "hajonsoft", "pdf");
  if (!fs.existsSync(pdfPath)) {
    fs.mkdirSync(pdfPath);
  }
  const pdfFile = path.join(pdfPath, pdfName);
  if (fs.existsSync(pdfFile)) {
    return;
  }
  // download the pdf file
  console.log("Downloading PDF: " + pdfUrl);
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
  const value = global.run.selectedTraveller;
  if (parseInt(value) >= data.travellers.length) {
    // Force reset the counter and avoid looping
    if (global.headless) {
      console.log("Last passenger reached!!. Exiting in 2 seconds...");
      setTimeout(() => {
        process.exit(0);
      }, 2000);
    } else {
      let timeoutValue = 30000;
      if (data.system.name === "nsk") {
        timeoutValue = 30000;
      }
      console.log(
        `Last passenger reached!!. Exiting in ${timeoutValue / 1000} seconds...`
      );
      setTimeout(() => {
        process.exit(0);
      }, timeoutValue);
    }
  }
  return value;
}

function incrementSelectedTraveler(overrideValue) {
  const selectedTraveler = getSelectedTraveler();
  const nextTraveler = parseInt(selectedTraveler) + 1;
  setSelectedTraveller(nextTraveler);
  return nextTraveler;
}

function setSelectedTraveller(value) {
  getSelectedTraveler(); // Make sure the file exists
  kea.updateSelectedTraveller(value);
  return value;
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
  try {
    await page.waitForSelector(selector);
    if (imgElementSelector) {
      await page.waitForSelector(imgElementSelector);
    }
    const input = await page.$(selector);
    await input.uploadFile(fileName);
  } catch (err) {
    console.log(err);
  }
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
  // console.log("Deprecated, please use downloadAndResizeImage");
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
// TODO: review https://imageresizer.com/ for a better resize information including size on desk
async function downloadAndResizeImage(
  passenger,
  width,
  height,
  imageType = "photo",
  minKb,
  maxKb,
  convertToPNG = false
) {
  let folder = photosFolder;
  let url = passenger?.images?.photo;
  if (!url && imageType == "photo") {
    return path.join(__dirname, "./dummy-image.jpg");
  }

  if (imageType == "passport") {
    folder = passportsFolder;
    url = passenger.images.passport;
  }

  if (imageType == "residency") {
    folder = residencyFolder;
    url = passenger.images.residency ?? passenger.images.passport;
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
    if (!url || url?.includes("placeholder")) {
      return path.join(__dirname, "id.jpg");
    }
  }

  let imagePath = path.join(folder, `${passenger.passportNumber}.jpg`);
  const resizedPath = path.join(
    folder,
    `${passenger.passportNumber}_${width ?? ""}x${height ?? ""}.${convertToPNG ? "png" : "jpg"
    }`
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
  let quality = 80;
  await sharp(imagePath)
    .resize(width, height, {
      fit: sharp.fit.contain,
    })
    .withMetadata()
    .toFormat(convertToPNG ? "png" : "jpeg", {
      quality,
      chromaSubsampling: "4:4:4",
    })
    .toFile(resizedPath);

  let sizeAfter = Math.round(fs.statSync(resizedPath).size / 1024);

  while (sizeAfter < minKb && quality <= 95) {
    quality += 5;
    await sharp(imagePath)
      .resize(width, height, {
        fit: sharp.fit.contain,
      })
      .withMetadata()
      .toFormat(convertToPNG ? "png" : "jpeg", {
        quality,
        chromaSubsampling: "4:4:4",
      })
      .toFile(resizedPath);
    sizeAfter = Math.round(fs.statSync(resizedPath).size / 1024);
  }

  while (sizeAfter > maxKb && quality > 10) {
    quality -= 5;
    await sharp(imagePath)
      .resize(width, height, {
        fit: sharp.fit.contain,
      })
      .withMetadata()
      .toFormat(convertToPNG ? "png" : "jpeg", {
        quality,
        chromaSubsampling: "4:4:4",
      })
      .toFile(resizedPath);
    sizeAfter = Math.round(fs.statSync(resizedPath).size / 1024);
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
  infoMessage(page, "🔓 Captcha thinking...", 5);
  await pauseMessage(page, 3);
  let captchaId;

  try {
    await page.waitForSelector(textFieldSelector);
    await page.focus(textFieldSelector);
    await page.hover(textFieldSelector);
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
      console.log("captcha: No base64");
      return;
    }

    const captchaSolver = new RuCaptcha2Captcha(global.captchaKey, 2);
    captchaId = await captchaSolver.send({
      method: "base64",
      body: base64,
      max_len: captchaLength,
      min_len: captchaLength,
    });

    global.currentCaptchaId = captchaId;

    const token = await captchaSolver.get(captchaId);

    infoMessage(page, `🔓 Captcha solved! ${token}`, 5);

    // Prevent an stale capthca from being used
    if (captchaId === global.currentCaptchaId) {
      await commit(
        page,
        [{ selector: textFieldSelector, value: () => token }],
        {}
      );
      await captchaSolver.reportGood(captchaId);
      return token;
    } else {
      infoMessage(page, `🔓 Discarding stale captcha ${token}`, 5);
      return null;
    }
  } catch (err) {
    await captchaSolver.reportBad(captchaId);
    console.log("BAD CAPTCHA REPORT SENT!!!");
    infoMessage(page, `🔓 Captcha error!!!`, 5);
  }
}

async function commitCaptchaTokenWithSelector(
  page,
  imageSelector,
  textFieldSelector,
  captchaLength = 6
) {
  infoMessage(page, "🔓 Captcha thinking...", 5);
  await pauseMessage(page, 3);
  let captchaId;
  await page.waitForSelector(imageSelector);
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

  const captchaSolver = new RuCaptcha2Captcha(global.captchaKey, 2);

  try {
    captchaId = await captchaSolver.send({
      method: "base64",
      body: base64,
      max_len: captchaLength,
      min_len: captchaLength,
    });

    global.currentCaptchaId = captchaId;

    const token = await captchaSolver.get(captchaId);

    if (captchaId === global.currentCaptchaId) {
      await commit(
        page,
        [{ selector: textFieldSelector, value: () => token.toString() }],
        {}
      );
      infoMessage(page, "🔓 Captcha solved! " + token, 5);
      return token;
    } else {
      infoMessage(page, `🔓 Discarding stale captcha ${token}`, 5);
      return null;
    }
  } catch (err) {
    infoMessage(page, "🔓 Captcha error!", 5);
    console.log(err);
  }
}

async function SolveIamNotARobot(responseSelector, url, siteKey, signal) {
  const data = await axios.get(
    `http://2captcha.com/in.php?key=${global.captchaKey}&method=userrecaptcha&googlekey=${siteKey}&pageurl=${url}`
  );
  const id = data.data.split("|")?.[1];
  if (!id) {
    return null;
  }

  try {
    for (let i = 0; i < 10; i++) {
      if (signal?.aborted) {
        console.log("Solving Captcha aborted.");
        throw new Error("Captcha solving was cancelled.");
      }
      const res = await axios.get(
        `http://2captcha.com/res.php?key=${global.captchaKey}&action=get&id=${id}`
      );
      console.log("solving I am not a robot", id, i);
      if (res.data.split("|")[0] === "OK") {
        const tokenValue = res.data.split("|")[1].replace(/ /g, "");
        console.log(
          "📢[util.js:1358]: I am not a robot tokenValue: ",
          "solved"
        );
        await page.$eval(responseSelector, (el) => {
          el.style.display = "block";
        });
        await page.type(responseSelector, tokenValue);
        return tokenValue;
      }
      // wait 5 seconds
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  } catch { }
}
const premiumSupportAlert = async (page, selector, data) => {
  await page.waitForSelector(selector);
  const adNode = await page.$(selector);
  if (!adNode) {
    return;
  }
  const htmlFileName = path.join(__dirname, "assets", "premium-support.html");
  const html = fs.readFileSync(htmlFileName, "utf8");
  await page.$eval(
    selector,
    (el, params) => {
      const json = params[0];
      const html = params[1];
      let htmlContent = html;
      htmlContent = html
        .replace(/{price}/g, json.travellers.length * 1.5)
        .replace(/{pax}/g, json.travellers.length);

      el.outerHTML = htmlContent;
    },
    [data, html]
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
  const image = await sharp(fileName);
  const metadata = await image.metadata();
  if (metadata.width < 10) {
    return;
  }
}

const infoMessage = async (
  page,
  message,
  depth = 2,
  visaShot = false,
  takeScreenShot = false
) => {
  console.log(
    `🦅 ${parseInt(getSelectedTraveler()) + 1}.${".".repeat(depth)}${message}`
  );
  const screenshotsDir = getPath("screenshots");
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }
  const screenshotFileName = path.join(
    screenshotsDir,
    `${moment().format("YYYY-MM-DD-HH-mm-ss")}.png`
  );
  const isCloudRun = Boolean(global.headless);
  if (page) {
    try {
      await page.evaluate("document.title='" + message + "'");
      // Capture screenshot and display image in log
      if (isCloudRun && takeScreenShot) {
        await page.screenshot({ path: screenshotFileName, fullPage: true });
        await uploadImage(screenshotFileName);
        if (visaShot) {
          await uploadImage(visaShot);
        }
      }
    } catch (e) {
      // console.log("Error while taking screenshot: ", e);
    }
  }
};

const pauseMessage = async (page, seconds = 3) => {
  try {
    if (page) {
      if (seconds <= 0) {
        await page.evaluate("document.title=''");
      } else {
        await page.evaluate(
          "document.title='Eagle: pause for " + seconds + " seconds'"
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await pauseMessage(page, seconds - 1);
      }
    }
  } catch (err) {
    // Uncomment to debug
    // console.log("Error while pausing: ", err);
  }
};

const pauseForInteraction = async (page, seconds) => {
  if (global.headless) {
    await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
    return;
  }
  await pauseMessage(page, seconds);
};

function getLogFile(eagleData) {
  if (!eagleData) {
    const rawData = fs.readFileSync(getPath("data.json"), "utf-8");
    eagleData = JSON.parse(rawData);
  }
  const logFolder = path.join(getPath("log"), eagleData.info.munazim);
  if (!fs.existsSync(logFolder)) {
    fs.mkdirSync(logFolder, { recursive: true });
  }
  const logFile = path.join(
    logFolder,
    eagleData.info.caravan + "_" + eagleData.system.name + ".txt"
  );
  return logFile;
}

const suggestGroupName = (data) => {
  if (global.submission) {
    return `${new Date().getTime()}_${global.submission.name}`.substring(0, 50);
  }

  const time = moment().format("mmss");

  const suggestedName = `${data.travellers?.[0]?.name?.first.substring(
    0,
    10
  )}_${data.travellers?.[0]?.name?.last.substring(0, 10)}$_${os
    .hostname()
    .substring(0, 8)}${time}_${data.info.run}`;

  return (
    suggestedName.replace(/[^a-zA-Z0-9_]/g, "") +
    Math.random().toString(36).substring(2, 5)
  );
};

async function screenShotAndContinue(page, visaElement, visaFileName, url) {
  await visaElement.screenshot({
    path: visaFileName,
    type: "png",
  });
  await page.goto(url);
}

async function toggleBlur(page, blur = true) {
  if (global.headless) {
    return;
  }
  if (blur) {
    await page.emulateVisionDeficiency("blurredVision");
  } else {
    await page.emulateVisionDeficiency("none");
  }
}

function isTravelDocument(passenger) {
  // if nationality code is XXA, XXB, XXC or XXX then it is a travel document
  if (["XXX", "XXA", "XXB", "XXC"].includes(passenger.nationality.code)) {
    return true;
  }

  // if the issuing country is not the same as nationality then it is a travel document
  if (passenger.codeline.substring(2, 5) !== passenger.nationality.code) {
    return true;
  }
  return false;
}

async function screenShotToKea(
  visaElement,
  accountId,
  currentPassenger,
  status = "Submitted"
) {
  // save base64 image to firestore
  const base64 = await visaElement.screenshot({
    encoding: "base64",
    type: "jpeg",
    quality: 70,
  });

  const filename = `visa_${currentPassenger.passportNumber}.jpeg`;
  const destination = `${accountId}/visaImageUrl/${filename}`;
  const visaImageUrl = await kea.uploadImageToStorage(base64, destination);

  // Send base64 encoded string to kea
  await kea.updatePassenger(accountId, currentPassenger.passportNumber, {
    visaImageUrl,
    "submissionData.hsf.status": status,
  });
}

function getDownloadFolder() {
  if (fs.existsSync(getPath(".downloadFolder"))) {
    return fs.readFileSync(getPath(".downloadFolder"), "utf-8");
  }
  return path.join(homedir, "Downloads");
}

async function pdfToKea(
  pdfBuffer,
  accountId,
  passengerFromPage,
  status = "visa"
) {
  const folder = path.join(getDownloadFolder(), "hajonsoft", "pdf");
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
  const pdfFileName = path.join(
    folder,
    `visa_${passengerFromPage.passportNumber}.pdf`
  );
  fs.writeFileSync(pdfFileName, pdfBuffer);
  const base64 = await pdfBuffer.toString("base64");
  const pdfFilename = `visa_${passengerFromPage.passportNumber}.pdf`;
  const pdfDestination = `${accountId}/visaImageUrl/${pdfFilename}`;
  const pdfUrl = await kea.uploadImageToStorage(base64, pdfDestination);
  await kea.updatePassenger(accountId, passengerFromPage.passportNumber, {
    visaImageUrl: pdfUrl,
    "submissionData.nsk.status": status,
  });
  return {pdfUrl, pdfFileName};
}

async function remember(page, selector) {
  const val = await page.$eval(selector, (el) => el.value);
  budgie.save(selector, val);
}

async function recall(page, selector) {
  const val = budgie.get(selector);
  if (val) {
    await commit(page, [{ selector, value: () => val }]);
  }
}

async function getCurrentTime() {
  try {
    const response = await axios.get("http://worldtimeapi.org/api/ip");
    const { unixtime } = response.data;
    return new Date(unixtime * 1000);
  } catch (error) {
    console.error(error);
    return null;
  }
}

const hijriYear = 44;

async function clickWhenReady(selector, page) {
  try {
    await page.waitForSelector(selector);
    for (let i = 0; i < 10; i++) {
      try {
        await page.click(selector);
        return;
      } catch (err) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  } catch { }
}

function generateMRZ(passenger) {
  console.log(passenger);
  try {
    // LINE 1
    const codeLine1 = `P<${passenger.nationality.code}${passenger.name.last.replace(
      / /g,
      "<"
    )}<<${passenger.name.given.replace(/ /g, "<")}`
      .padEnd(MRZ_TD3_LINE_LENGTH, "<")
      .substring(0, MRZ_TD3_LINE_LENGTH);
    // LINE 2
    const icaoPassportNumber = passenger.passportNumber.padEnd(9, "<");
    const birthDate = `${passenger.dob.yyyy.substring(2)}${passenger.dob.mm}${passenger.dob.dd}`;
    const expiryDate = `${passenger.passExpireDt.yyyy.substring(2)}${passenger.passExpireDt.mm}${passenger.passExpireDt.dd}`;
    const gender = passenger.gender.substring(0, 1).toUpperCase();
    let codeLine2 = `${icaoPassportNumber}${checkDigit(
      icaoPassportNumber
    )}${passenger.nationality.code}${birthDate}${checkDigit(
      birthDate
    )}${gender}${expiryDate}${checkDigit(expiryDate)}`;

    if (codeLine2.length) {
      const filler = "<".repeat(MRZ_TD3_LINE_LENGTH - 2 - codeLine2.length);
      codeLine2 += filler;
      codeLine2 += checkDigit(filler);

      // Composite check digit for characters of machine readable data of the lower line in positions 1 to 10, 14 to 20 and 22 to 43, including values for
      // letters that are a part of the number fields and their check digits.
      const compositeCheckDigit = checkDigit(
        codeLine2.substring(0, 10) +
        codeLine2.substring(13, 20) +
        codeLine2.substring(21, 43)
      );
      codeLine2 += compositeCheckDigit.replace(/[-]/g, "<");
    }

    return `${codeLine1}\n${codeLine2}`.toUpperCase();
  } catch (error) {
    console.warn(error);
    return null;
  }
};

function checkDigit(inputData) {
  // http://www.highprogrammer.com/alan/numbers/mrp.html#checkdigit
  let multiplier = 7;
  let total = 0;
  for (const char of inputData) {
    total += checkDigitDiagram[char] * multiplier;
    if (multiplier === 7) multiplier = 3;
    else if (multiplier === 3) multiplier = 1;
    else if (multiplier === 1) multiplier = 7;
  }

  const result = total % 10;
  return result.toString();
}

const checkDigitDiagram = {
  "<": 0,
  0: 0,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  A: 10,
  B: 11,
  C: 12,
  D: 13,
  E: 14,
  F: 15,
  G: 16,
  H: 17,
  I: 18,
  J: 19,
  K: 20,
  L: 21,
  M: 22,
  N: 23,
  O: 24,
  P: 25,
  Q: 26,
  R: 27,
  S: 28,
  T: 29,
  U: 30,
  V: 31,
  W: 32,
  X: 33,
  Y: 34,
  Z: 35
};
module.exports = {
  hijriYear,
  findConfig,
  findGorillaConfig,
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
  residencyFolder,
  vaccineFolder,
  isCodelineLooping,
  endCase,
  setCounter,
  selectByValue,
  selectByValueStrict,
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
  infoMessage,
  pauseMessage,
  pauseForInteraction,
  getLogFile,
  suggestGroupName,
  screenShotAndContinue,
  toggleBlur,
  isTravelDocument,
  screenShotToKea,
  remember,
  recall,
  getCurrentTime,
  SolveIamNotARobot,
  registerLoop,
  downloadPDF,
  clickWhenReady,
  pdfToKea,
  generateMRZ,
};
