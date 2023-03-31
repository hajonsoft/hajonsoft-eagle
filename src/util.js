const fs = require("fs");
const path = require("path");
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
const photosFolder = path.join(homedir, "hajonsoft", "photos");
const idFolder = path.join(homedir, "hajonsoft", "id");
const passportsFolder = path.join(homedir, "hajonsoft", "passports");
const residencyFolder = path.join(homedir, "hajonsoft", "residency");
const vaccineFolder = path.join(homedir, "hajonsoft", "vaccine");

const VISION_DEFICIENCY = "none";
const IMGUR_CLIENT_ID = "0b4827447357d6b";
const IMGUR_CLIENT_SECRET = "c842b1a08f0748150465ec643c04c0aeb17329c7";
const kea = require("./lib/kea");

// or your client ID
const imgurClient = new ImgurClient({
  clientId: IMGUR_CLIENT_ID,
  clientSecret: IMGUR_CLIENT_SECRET,
});

let page;
let browser;

function getTmpDir() {
  const tmpDir = path.join(os.tmpdir(), "hajonsoft-eagle");
  // console.log("TMP DIR: " + tmpDir);
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  return tmpDir;
}

function getPath(filename) {
  const isCloudRun = Boolean(process.argv.find((c) => c.startsWith("-cloud")));
  switch (filename) {
    case "data.json":
      let dataFileName = path.join(getTmpDir(), "data.json");
      // Fallback to current working dir (used by eagle cloud)
      if (isCloudRun) {
        dataFileName = path.join(__dirname, "..", "data.json");
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

  const launchOptions = {
    headless: isCloudRun || isHeadless,
    ignoreHTTPSErrors: true,
    defaultViewport: null,
    args,
  };

  if (!isCloudRun && !isHeadless) {
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
  if (!fs.existsSync(residencyFolder)) {
    fs.mkdirSync(residencyFolder);
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
      `✈️  Workflow: ${urlConfig.name} ${urlConfig.url || urlConfig.regex}`,
      2
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
  } catch {}
  return "";
}

function getOptionNode(passenger, cursor) {
  return `
  <div style="width: 100%; display: flex; align-items: center; gap: 1rem; background-color: yellow; height: 200px;">
    <div>${cursor + 1}- </div>
    <div>
    ${
      passenger.nationality?.isArabic
        ? passenger?.nameArabic?.given + " " + passenger.nameArabic.last
        : passenger.name.full
    } - ${passenger.passportNumber} - ${passenger?.nationality?.name} - ${
    passenger?.gender || "gender"
  } - ${passenger?.dob?.age || "age"} years old${getMofaImportString(passenger)}
    </div>
  </div>
  `;
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
          }>
          ${getOptionNode(traveller, cursor)}
          </option>`
      )
      .join(" ");

  try {
    await page.waitForSelector(structure.controller.selector);
    const controllerHandleMethod = `handleEagle${
      structure.controller.name || "Send"
    }Click`;
    const htmlFileName = path.join(__dirname, "assets", "controller.html");
    let html = fs.readFileSync(htmlFileName, "utf8");

    await page.evaluate(
      (params) => {
        const structureParam = params[0];
        const optionsParam = params[1];
        const controller = structureParam.controller;
        const container = document.querySelector(controller.selector);
        const handleMethodName = params[2];
        const visaPath = params[3];
        const htmlContent = params[4];
        const pax = params[5];
        const lastTraveler = params[6];
        container.outerHTML = `${htmlContent
          .replace(/{handleMethodName}/, handleMethodName)
          .replace(/{options}/, optionsParam)
          .replace(/{visaPath}/, visaPath)
          .replace(/{pax}/, pax.length)
          .replace(/{current}/, lastTraveler + 1)
          .replace(/{mokhaa}/, controller.mokhaa ? "block" : "none")}`.replace(
          /{sendall}/,
          "Send All إرسل الكل"
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
      await page.exposeFunction(
        "handleNSKClick",
        structure.controller.nskAction || (() => {})
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

    const htmlFileName = path.join(__dirname, "assets", "commander.html");
    const html = fs.readFileSync(htmlFileName, "utf8");

    await page.evaluate(
      (params) => {
        const structureParam = params[0];
        const controller = structureParam.controller;
        const container = document.querySelector(controller.selector);
        const handleMethodName = params[1];
        const htmlContent = params[3]
          .replace(/{direction}/, controller.leftAlign ? "direction: rtl;" : "")
          .replace(
            /{structureParam+controller_name}/,
            params[0].controller.name
          )
          .replace(/{handleMethodName}/, handleMethodName)
          .replace(
            /{title}/g,
            structureParam.controller.title +
              " " +
              structureParam.controller.arabicTitle
          );
        container.outerHTML = htmlContent;
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
  const value = global.run.selectedTraveller;
  if (parseInt(value) >= data.travellers.length) {
    // Force reset the counter and avoid looping
    if (global.headless) {
      console.log("Last passenger reached!!. Exiting in 2 seconds...");
      setTimeout(() => {
        process.exit(0);
      }, 2000);
    } else {
      console.log("Last passenger reached!!. Exiting in 10 seconds...");
      setTimeout(() => {
        process.exit(0);
      }, 10000);
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
    // This must be an input with type="file"
    const input = await page.$(selector);
    await input.uploadFile(fileName);
    // await page.$eval(imgElementSelector, e=> e.setAttribute('src', fileName))
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
    if (url?.includes("placeholder")) {
      return path.join(__dirname, "id.jpg");
    }
  }

  let imagePath = path.join(folder, `${passenger.passportNumber}.jpg`);
  const resizedPath = path.join(
    folder,
    `${passenger.passportNumber}_${width ?? ""}x${height ?? ""}.jpg`
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
    // Make high quality bump up file size
    .jpeg({
      quality,
      chromaSubsampling: "4:4:4",
    })
    .toFile(resizedPath);

  let sizeAfter = Math.round(fs.statSync(resizedPath).size / 1024);

  while (sizeAfter < minKb && quality <= 100) {
    quality += 5;
    await sharp(imagePath)
      .resize(width, height, {
        fit: sharp.fit.contain,
      })
      .withMetadata()
      // Make high quality bump up file size
      .jpeg({
        quality,
        chromaSubsampling: "4:4:4",
      })
      .toFile(resizedPath);
    sizeAfter = Math.round(fs.statSync(resizedPath).size / 1024);
  }

  while (sizeAfter > maxKb && quality > 0) {
    quality -= 5;
    await sharp(imagePath)
      .resize(width, height, {
        fit: sharp.fit.contain,
      })
      .withMetadata()
      // Make high quality bump up file size
      .jpeg({
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

    global.currentCaptchaId = id;

    const token = await captchaSolver.get(id);
    infoMessage(page, `🔓 Captcha solved! ${token}`, 5);

    // Prevent an stale capthca from being used
    if (id === global.currentCaptchaId) {
      await commit(
        page,
        [{ selector: textFieldSelector, value: () => token }],
        {}
      );
      return token;
    } else {
      infoMessage(page, `🔓 Discarding stale captcha ${token}`, 5);
      return null;
    }
  } catch (err) {
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
  try {
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

    global.currentCaptchaId = id;

    const token = await captchaSolver.get(id);

    if (id === global.currentCaptchaId) {
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
  }
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

  if (fs.existsSync(fileName)) {
    imgurClient
      .upload({
        image: fs.createReadStream(fileName),
        type: "stream",
      })
      .then((result) => {
        console.log("View screenshot: ", result.data?.link);
      })
      .catch((err) => {
        console.log("error uploading image: ", err);
        console.log("local path: ", fileName);
      });
  }
}

const infoMessage = async (
  page,
  message,
  depth = 2,
  visaShot = false,
  takeScreenShot = false
) => {
  console.log(`🦅 ${getSelectedTraveler() + 1}.${".".repeat(depth)}${message}`);
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
        await page.waitForTimeout(1000);
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
    await page.waitForTimeout(1000);
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

  return suggestedName.replace(/[^a-zA-Z0-9_]/g, "");
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
};
