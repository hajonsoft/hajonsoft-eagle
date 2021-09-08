const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-extra");
// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const sharp = require("sharp");
const budgie = require("./budgie");

const axios = require("axios");
const moment = require("moment");
const { createCanvas, loadImage } = require("canvas");
const _ = require("lodash");
const homedir = require("os").homedir();
console.log("HOME: " + homedir);
let page;
const photosFolder = path.join(homedir, "hajonsoft", "photos");
const passportsFolder = path.join(homedir, "hajonsoft", "passports");
const vaccineFolder = path.join(homedir, "hajonsoft", "vaccine");
let browser;
async function initPage(config, onContentLoaded) {
  browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: [
      "--start-fullscreen",
      "--incognito",
      "--disable-web-security",
      "--disable-features=IsolateOrigins,site-per-process",
    ],
  });
  const pages = await browser.pages();
  // page = await browser.pages();
  page = pages[0];
  await page.bringToFront();
  page.on("domcontentloaded", onContentLoaded);
  if (process.argv.length > 2) {
    page.on("console", (msg) => console.log(msg.text()));
  }
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Safari/537.36."
  );

  if (!fs.existsSync(path.join(homedir, "hajonsoft"))) {
    fs.mkdirSync(path.join(homedir, "hajonsoft"));
  }

  if (!fs.existsSync(photosFolder)) {
    fs.mkdirSync(photosFolder);
  } else {
    fs.readdir(photosFolder, (err, files) => {
      for (const file of files) {
        fs.unlink(path.join(photosFolder, file), (err) => {});
      }
    });
  }
  if (!fs.existsSync(passportsFolder)) {
    fs.mkdirSync(passportsFolder);
  } else {
    fs.readdir(passportsFolder, (err, files) => {
      for (const file of files) {
        fs.unlink(path.join(passportsFolder, file), (err) => {});
      }
    });
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
  return page;
}

async function newPage(onMofaContentLoaded, onMofaContentClosed) {
  const sameBrowserNewPage = await browser.newPage(); // TODO AA: I had to hardcoded for readability
  sameBrowserNewPage.on("domcontentloaded", onMofaContentLoaded);
  sameBrowserNewPage.on("close", onMofaContentClosed);
  return sameBrowserNewPage;
}

async function storeControls(pageWithControls, url) {
  console.log(
    "%c 🥔 url: ",
    "font-size:20px;background-color: #4b4b4b;color:#fff;",
    `------------------starting verbose output on ${url}--------`
  );
  const logFolder = __dirname + "/../log/";
  if (!fs.existsSync(logFolder)) {
    fs.mkdirSync(logFolder);
  }
  const fileNameBase = logFolder + _.last(url.split("/"));
  const pageInputs = await pageWithControls.$$eval("input", (inputs) =>
    inputs
      .filter((i) => i.type !== "hidden")
      .map((i) => i.getAttribute("id") + "\n" + i.outerHTML)
  );
  const pageSelects = await pageWithControls.$$eval("select", (selects) =>
    selects.map((s) => s.outerHTML.replace(/\t/g, ""))
  );

  const pageFrames = await pageWithControls.$$eval("iframe", (frames) =>
    frames.map((f) => f.outerHTML)
  );
  console.log(
    `inputs/selects/frames: ${pageInputs.length}/${pageSelects.length}/${pageFrames.length}`
  );

  // frameId's
  const framesIds = await pageWithControls.$$eval("iframe", (frames) =>
    frames.map((f) => f.id)
  );

  await pageWithControls.waitFor(10000); //wait for frames to render - need to find a better solution - This is ok it is a debug feature anyway

  for (let i = 0; i < framesIds.length; i = i + 1) {
    console.log(
      "%c 🥩 i: ",
      "font-size:20px;background-color: #2EAFB0;color:#fff;",
      i
    );
    let frameHandle = await pageWithControls.$(`iframe[id='${framesIds[i]}']`);
    let frame = await frameHandle.contentFrame();

    let frameInputs = await frame.$$eval("input", (inputs) =>
      inputs.filter((i) => i.type !== "hidden").map((i) => i.outerHTML)
    );

    let frameSelects = await frame.$$eval("select", (selects) =>
      selects.map((s) => s.outerHTML.replace(/\t/g, ""))
    );

    if (frameInputs && frameInputs.length > 0) {
      let inputsString = `<html>${url}\n\n\n${frameInputs
        .toString()
        .replace(/,/g, "\n")}</html>`;
      fs.writeFileSync(
        fileNameBase + "_frame_" + framesIds[i] + "_inputs.html",
        inputsString
      );
    }
    if (frameSelects && frameSelects.length > 0) {
      let selectsString = `<html>${url}\n\n\n${frameSelects
        .toString()
        .replace(/,/g, "\n")}</html>`;
      fs.writeFileSync(
        fileNameBase + "_frame_" + framesIds[i] + "_selects.html",
        selectsString
      );
    }
  }

  if (pageInputs && pageInputs.length > 0) {
    const inputsString = `<html>${url}\n\n\n${pageInputs
      .toString()
      .replace(/,/g, "\n")}</html>`;
    fs.writeFileSync(fileNameBase + "_inputs.html", inputsString);
  }
  if (pageSelects && pageSelects.length > 0) {
    const selectsString = `<html>${url}\n\n\n${pageSelects
      .toString()
      .replace(/,/g, "\n")}</html>`;
    fs.writeFileSync(fileNameBase + "_selects.html", selectsString);
  }

  if (pageFrames && pageFrames.length > 0) {
    const framesString = `<html>${url}\n\n\n${pageFrames
      .toString()
      .replace(/,/g, "\n")}</html>`;
    fs.writeFileSync(fileNameBase + "_frames.html", framesString);
  }
}

function findConfig(url, config) {
  let lowerUrl = url.toLowerCase();
  if (process.argv.length > 2 && process.argv.includes(`verbose-url=${url}`)) {
    storeControls(page, lowerUrl);
  }

  const urlConfig = config.find(
    (x) =>
      (x.url && x.url.toLowerCase() === lowerUrl) ||
      (x.regex && RegExp(x.regex.toLowerCase()).test(lowerUrl))
  );

  if (urlConfig) {
    console.log("Workflow: ", urlConfig.name);
    return urlConfig;
  }
  return {};
}

async function commit(page, details, info) {
  for (const detail of details) {
    await page.waitForSelector(detail.selector);
    let value;
    let txt;
    if (detail.value) {
      value = detail.value(info); // call value function and pass current row info
      if (!value && details.autocomplete) {
        value = budgie.get(detail.autocomplete);
      }
    }
    if (detail.txt) {
      txt = detail.txt(info); // call txt function and pass current row info
    }
    const elementType = await page.$eval(detail.selector, (e) =>
      e.outerHTML
        .match(/<(.*?) /g)[0]
        .replace(/</g, "")
        .replace(/ /g, "")
        .toLowerCase()
    );
    // Budgie entry point
    switch (elementType) {
      case "input":
        await page.waitForSelector(detail.selector);
        await page.focus(detail.selector);
        await page.type(detail.selector, "");
        await page.evaluate((element) => {
          const field = document.querySelector(element.selector);
          if (field) {
            field.value = "";
            field.setAttribute("value", "");
          }
        }, detail);

        await page.waitForSelector(detail.selector);
        if (value) {
          await page.type(
            detail.selector,
            value
          );
        } else if (detail.autocomplete) {
          await page.type(
            detail.selector, budgie.get(detail.autocomplete, detail.defaultValue)
          );
        }
        break;
      case "select":
        if (value) {
          await page.select(detail.selector, value);
          break;
        } else if (detail.autocomplete) {
          await page.select(detail.selector, budgie.get(detail.autocomplete));
        }
        if (txt) {
          await selectByValue(detail.selector,txt);
          break;
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

async function controller(page, structure, travellers) {
  const isVisible = await page.evaluate(() => window.handleSendClick);
  if (isVisible) {
    return;
  }

  if (
    !structure.controller ||
    !structure.controller.selector ||
    !structure.controller.action
  ) {
    return;
  }

  const options =
    "<option>Select person and click send</option>" +
    travellers
      .map(
        (traveller, cursor) =>
          `<option value="${cursor}">${cursor} - ${traveller.name.full} - ${traveller.gender} - ${traveller.dob.age} years old</option>`
      )
      .join(" ");

  try {
    await page.evaluate(
      (params) => {
        const structureParam = params[0];
        const optionsParam = params[1];
        const controller = structureParam.controller;
        const container = document.querySelector(controller.selector);
        container.outerHTML = `
          <div style='background-color: #CCCCCC; border: 2px solid black; border-radius: 16px; padding: 0.5rem; display: flex; align-items: center; width: 50%; justify-content: space-between'>  
          <img style='width: 32px; height: 32px; border-radius: 8px; margin-right: 0.5rem'  src='data:image/jpeg;base64,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'> </img> 
          <h6 style='margin-right: 0.5rem'> HAJonSoft </h6> 
          <select id="hajonsoft_select" style='flex-grow: 1; margin-right: 0.5rem ; height: 90%' > 
          ${optionsParam}
          </select>  
          <button style='background-color: #666666; color: #ffffff; width: 5rem' type="button" onclick="handleSendClick();return false">Send</button> 
          </div>`;
      },
      [structure, options]
    );

    await page.exposeFunction("handleSendClick", structure.controller.action);
  } catch (err) {
    console.log(err);
  }
}

function useCounter(currentCounter) {
  let output = currentCounter;
  const fileName = "./selectedTraveller.txt";
  if (fs.existsSync(fileName)) {
    const selectedTraveller = fs.readFileSync(
      "./selectedTraveller.txt",
      "utf8"
    );
    output = parseInt(selectedTraveller);
    fs.unlinkSync(fileName);
  }
  return output;
}

function setCounter(currentCounter) {
  const fileName = "./selectedTraveller.txt";
  const selectedTraveller = fs.writeFileSync(
    "./selectedTraveller.txt",
    selectedTraveller
  );
}

async function commitFile(selector, fileName) {
  await page.waitForSelector(selector);
  let [fileChooser] = await Promise.all([
    page.waitForFileChooser(),
    page.evaluate((p) => document.querySelector(p[0]).click(), [selector]),
  ]);

  await fileChooser.accept([fileName]);
  try {
    await fileChooser.cancel();
  } catch {
    // console.log("File chooser is probably already handled");
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
  traveller,
  width,
  height,
  imageType = "photo"
) {
  let folder = imageType == "photo" ? photosFolder : passportsFolder;
  if (imageType == "vaccine") {
    folder = vaccineFolder;
  }
  const url =
    imageType == "photo" ? traveller.images.photo : traveller.images.passport;
  let imagePath = path.join(folder, `${traveller.passportNumber}.jpg`);
  const resizedPath = path.join(
    folder,
    `${traveller.passportNumber}_${width}x${height}.jpg`
  );
  if (fs.existsSync(imagePath) && fs.existsSync(resizedPath)) {
    return;
  }
  const writer = fs.createWriteStream(imagePath);
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
  await sharp(imagePath).resize(width, height).toFile(resizedPath);
  return resizedPath;
}

const loopMonitor = [];
function isCodelineLooping(traveller, numberOfEntries = 1) {
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

function createMRZImage(fileName, codeline) {
  const canvas = createCanvas(400, 300);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "black";
  ctx.font = "13px Arial";
  ctx.fillText(codeline.substring(0, 44), 25, canvas.height - 40);
  ctx.fillText(codeline.substring(44), 25, canvas.height - 20);

  const out = fs.createWriteStream(fileName);
  const stream = canvas.createJPEGStream({
    quality: 0.95,
    chromaSubsampling: false,
  });
  stream.pipe(out);
}

function endCase(name) {
  const regEx = new RegExp(`${name}[_-]only`);
  if (process.argv.some((arg) => regEx.test(arg))) {
    browser.disconnect();
  }
}

async function sniff(page, details) {
  for (const detail of details) {
    if (detail.autocomplete) {
      await page.waitForSelector(detail.selector);
      let value = await page.$eval(detail.selector, (el) => el.value || el.innerText);
      if (detail.autocomplete && value) {
        budgie.save(detail.autocomplete, value);
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
      mofaData = {};
      const closeButtonSelector =
        "#dlgMessageContent > div.modal-footer > button";
      await currentPage.waitForSelector(closeButtonSelector);
      await currentPage.$eval(closeButtonSelector, (btn) => {
        btn.click();
      });

      if (mofa_visaTypeValue) {
        await currentPage.select("#SearchingType", mofa_visaTypeValue);
      }
      await currentPage.waitForSelector("#ApplicationNumber");
      await currentPage.type("#ApplicationNumber", id1);
      await currentPage.type("#SponserID", id2);

      const captchaSelector = "#Captcha";
      await currentPage.waitForSelector(captchaSelector);
      await currentPage.$eval(captchaSelector, (e) => e.scrollIntoView());
      await currentPage.bringToFront();
      await currentPage.focus(captchaSelector);
      if (!process.argv.includes("slow")) {
        await currentPage.waitForFunction(
          "document.querySelector('#Captcha').value.length === 6"
        , {timeout: 0});
        await sniff(currentPage, [
          { selector: "#SearchingType", autocomplete: "mofa_visaType" },
          { selector: "#ApplicationNumber", autocomplete: "mofa_id1" },
          { selector: "#SponserID", autocomplete: "mofa_id2" },
        ]);

        await currentPage.click("#btnSearch");
      }
      break;
    case "https://visa.mofa.gov.sa/Home/PrintVisa".toLowerCase():
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
      const professionSelector = "#tblDocumentVisaList > tbody > tr > td:nth-child(8)";
      const id1Selector =
        "#content > div > div.row > div > div > div.portlet-body.form > div.form-body.form-display.form-horizontal.page-print > div:nth-child(4) > div:nth-child(2) > label";
        const telSelector = "#content > div > div.row > div > div > div.portlet-body.form > div.form-body.form-display.form-horizontal.page-print > div:nth-child(6) > div > label";
        const numberOfEntriesSelector = "#tblDocumentVisaList > tbody > tr > td:nth-child(9)";
        const durationSelector = "#tblDocumentVisaList > tbody > tr > td:nth-child(10)";

        mofaData = {
        ...mofaData,
        name: await readValue(currentPage, nameSelector),
        sponsorName: await readValue(currentPage, sponsorNameSelector),
        tel: await readValue(currentPage, telSelector),
        address: await readValue(currentPage, addressSelector),
        numberOfEntries: await readValue(currentPage, numberOfEntriesSelector),
        embassy: await readValue(currentPage, embassySelector),
        duration: await readValue(currentPage, durationSelector),
        visaType: await readValue(currentPage, visaTypeSelector),
        id1: await readValue(currentPage, id1Selector),
        id2: await readValue(currentPage, id2Selector),
        profession: await readValue(currentPage, professionSelector),
      };
      break;
  }
}

async function readValue(currentPage, selector) {
  await currentPage.waitForSelector(selector);
  const value = await currentPage.$eval(selector, (ele) => ele.innerText);
  return value;
}

module.exports = {
  findConfig,
  commit,
  controller,
  initPage,
  useCounter,
  commitFile,
  captchaClick,
  downloadImage,
  photosFolder,
  passportsFolder,
  vaccineFolder,
  isCodelineLooping,
  createMRZImage,
  endCase,
  setCounter,
  selectByValue,
  sniff,
  newPage,
  handleMofa,
  mofaData,
  getMofaData,
  downloadAndResizeImage,
};
