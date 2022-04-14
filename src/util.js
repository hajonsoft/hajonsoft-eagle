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
const _ = require("lodash");
const beautify = require("beautify");
const homedir = require("os").homedir();
console.log("HOME: " + homedir);
const photosFolder = path.join(homedir, "hajonsoft", "photos");
const passportsFolder = path.join(homedir, "hajonsoft", "passports");
const vaccineFolder = path.join(homedir, "hajonsoft", "vaccine");
const VISION_DEFICIENCY = "none";

let page;
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
  const logFolder = __dirname + "/../log/";
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
    console.log("Workflow: ", urlConfig.name);
    return urlConfig;
  }
  return {};
}

async function commit(page, details, row) {
  if (!details) return;
  if (details?.[0].selector) {
    await page.waitForSelector(details?.[0].selector, {
      timeout: 240000,
    });
  }
  if (details?.[0].xPath) {
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
        if (detail.selector) {
          await page.waitForSelector(detail.selector);
          await page.focus(detail.selector);
          await page.type(detail.selector, "");
          await page.evaluate((element) => {
            const field = document.querySelector(element.selector);
            field.removeAttribute('readonly');
            field.removeAttribute('disabled');
            if (field) {
              field.value = "";
              field.setAttribute("value", "");
            }
          }, detail);
          await page.waitForTimeout(10)
        }

        if (value) {
          if (detail.selector) {
            await page.type(detail.selector, value);
          }
          if (detail.xPath) {
            const xElements = await page.$x(detail.xPath);
            const xElement = xElements[detail.index];
            await xElement.type(value);
          }
        } else if (detail.autocomplete) {
          if (detail.selector) {
            console.log(
              "%cMyProject%cline:237%cdetail",
              "color:#fff;background:#ee6f57;padding:3px;border-radius:2px",
              "color:#fff;background:#1f3c88;padding:3px;border-radius:2px",
              "color:#fff;background:rgb(114, 83, 52);padding:3px;border-radius:2px",
              detail
            );
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

async function controller(page, structure, travellers) {
  if (
    !structure.controller ||
    !structure.controller.selector ||
    !structure.controller.action
  ) {
    return;
  }

  let lastTraveller = useCounter();

  const options =
    "<option>Select passenger click send حدد الراكب انقر إرسل</option>" +
    travellers
      .map(
        (traveller, cursor) =>
          `<option value="${cursor}" ${cursor == lastTraveller ? 'selected' : ''}>${cursor} - ${
            traveller.nationality.isArabic
              ? traveller.nameArabic.given + " " + traveller.nameArabic.last
              : traveller.name.full
          } - ${traveller.passportNumber} - ${traveller.gender} - ${
            traveller.dob.age
          } years old</option>`
      )
      .join(" ");

  try {
    await page.waitForSelector(structure.controller.selector);
    await page.evaluate(
      (params) => {
        const structureParam = params[0];
        const optionsParam = params[1];
        const controller = structureParam.controller;
        const container = document.querySelector(controller.selector);
        container.outerHTML = `
          <div style='background-color: #CCCCCC; border: 2px solid black; border-radius: 16px; padding: 0.5rem; display: flex; align-items: center; justify-content: space-between'>  
          <button style='background-color: #2196f3; color: #ffffff; width: 6rem, padding: 0.5rem; margin: 0 5px; border-radius: 8px;' type="button" onclick="handleSendClick();return false">Send إرسل</button> 
          <img style='width: 32px; height: 32px; border-radius: 8px; margin-right: 0.5rem'  src='data:image/jpeg;base64,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'> </img> 
          <h5 style='margin-right: 0.5rem; color: #311b92'> HAJonSoft-Eagle </h5> 
          <select id="hajonsoft_select" style='flex-grow: 1; margin-right: 0.5rem'> 
          ${optionsParam}
          </select>
          <button style='background-color: #2196f3; color: #ffffff; width: 6rem, padding: 0.5rem; margin: 0 5px; border-radius: 8px;' type="button" onclick="handleSendClick();return false">Send إرسل</button> 
          </div>
          ${controller.mokhaa ? 
            `<div style="width: 100%; display: flex; justify-content: center; align-items: center; gap: 20px; margin-top: 10px">
            <div>جلب ارقام المراجع</div>
            <button onclick="handleWTUClick();return false" style="color: white; background-color: forestgreen; font-size: 1.5rem; font-weight: bold; border-radius: 16px; padding: 8px">Way to umrah</button> 
            <button onclick="handleTWFClick();return false" style="color: #8f006b; font-size: 1.5rem; font-weight: bold; border-radius: 16px; padding: 8px">
            <div style="display: flex; justify-content: space-around; align-items: center;">
           <div>Tawaf </div>
           <img style='width: 32px; height: 32px; border-radius: 8px; margin-right: 0.5rem' src="data:image/png;base64,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/GMzLdsAADoUaVRYdFhNTDpjb20uYWRvYmUueG1wAAAAAAA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/Pgo8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjUtYzAxNCA3OS4xNTE0ODEsIDIwMTMvMDMvMTMtMTI6MDk6MTUgICAgICAgICI+CiAgIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CiAgICAgIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiCiAgICAgICAgICAgIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIKICAgICAgICAgICAgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iCiAgICAgICAgICAgIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiCiAgICAgICAgICAgIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIKICAgICAgICAgICAgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIgogICAgICAgICAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyIKICAgICAgICAgICAgeG1sbnM6ZXhpZj0iaHR0cDovL25zLmFkb2JlLmNvbS9leGlmLzEuMC8iPgogICAgICAgICA8eG1wOkNyZWF0b3JUb29sPkFkb2JlIFBob3Rvc2hvcCBDQyAoV2luZG93cyk8L3htcDpDcmVhdG9yVG9vbD4KICAgICAgICAgPHhtcDpDcmVhdGVEYXRlPjIwMjItMDQtMTRUMDc6NTM6MjYtMDc6MDA8L3htcDpDcmVhdGVEYXRlPgogICAgICAgICA8eG1wOk1ldGFkYXRhRGF0ZT4yMDIyLTA0LTE0VDA3OjUzOjI2LTA3OjAwPC94bXA6TWV0YWRhdGFEYXRlPgogICAgICAgICA8eG1wOk1vZGlmeURhdGU+MjAyMi0wNC0xNFQwNzo1MzoyNi0wNzowMDwveG1wOk1vZGlmeURhdGU+CiAgICAgICAgIDx4bXBNTTpJbnN0YW5jZUlEPnhtcC5paWQ6NTY3M2U0MjEtOTI3Yy00YjRlLWI5ZmEtZDRkMWZjYWQyOTYwPC94bXBNTTpJbnN0YW5jZUlEPgogICAgICAgICA8eG1wTU06RG9jdW1lbnRJRD54bXAuZGlkOmM3ZTc3MWRiLTg3MzYtMzg0Mi05NzRjLTNiODFkZjczZGQwNzwveG1wTU06RG9jdW1lbnRJRD4KICAgICAgICAgPHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD54bXAuZGlkOmM3ZTc3MWRiLTg3MzYtMzg0Mi05NzRjLTNiODFkZjczZGQwNzwveG1wTU06T3JpZ2luYWxEb2N1bWVudElEPgogICAgICAgICA8eG1wTU06SGlzdG9yeT4KICAgICAgICAgICAgPHJkZjpTZXE+CiAgICAgICAgICAgICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0iUmVzb3VyY2UiPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6YWN0aW9uPmNyZWF0ZWQ8L3N0RXZ0OmFjdGlvbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0Omluc3RhbmNlSUQ+eG1wLmlpZDpjN2U3NzFkYi04NzM2LTM4NDItOTc0Yy0zYjgxZGY3M2RkMDc8L3N0RXZ0Omluc3RhbmNlSUQ+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDp3aGVuPjIwMjItMDQtMTRUMDc6NTM6MjYtMDc6MDA8L3N0RXZ0OndoZW4+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDpzb2Z0d2FyZUFnZW50PkFkb2JlIFBob3Rvc2hvcCBDQyAoV2luZG93cyk8L3N0RXZ0OnNvZnR3YXJlQWdlbnQ+CiAgICAgICAgICAgICAgIDwvcmRmOmxpPgogICAgICAgICAgICAgICA8cmRmOmxpIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmFjdGlvbj5zYXZlZDwvc3RFdnQ6YWN0aW9uPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6aW5zdGFuY2VJRD54bXAuaWlkOjU2NzNlNDIxLTkyN2MtNGI0ZS1iOWZhLWQ0ZDFmY2FkMjk2MDwvc3RFdnQ6aW5zdGFuY2VJRD4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OndoZW4+MjAyMi0wNC0xNFQwNzo1MzoyNi0wNzowMDwvc3RFdnQ6d2hlbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OnNvZnR3YXJlQWdlbnQ+QWRvYmUgUGhvdG9zaG9wIENDIChXaW5kb3dzKTwvc3RFdnQ6c29mdHdhcmVBZ2VudD4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmNoYW5nZWQ+Lzwvc3RFdnQ6Y2hhbmdlZD4KICAgICAgICAgICAgICAgPC9yZGY6bGk+CiAgICAgICAgICAgIDwvcmRmOlNlcT4KICAgICAgICAgPC94bXBNTTpIaXN0b3J5PgogICAgICAgICA8ZGM6Zm9ybWF0PmltYWdlL3BuZzwvZGM6Zm9ybWF0PgogICAgICAgICA8cGhvdG9zaG9wOkNvbG9yTW9kZT4zPC9waG90b3Nob3A6Q29sb3JNb2RlPgogICAgICAgICA8cGhvdG9zaG9wOklDQ1Byb2ZpbGU+c1JHQiBJRUM2MTk2Ni0yLjE8L3Bob3Rvc2hvcDpJQ0NQcm9maWxlPgogICAgICAgICA8dGlmZjpPcmllbnRhdGlvbj4xPC90aWZmOk9yaWVudGF0aW9uPgogICAgICAgICA8dGlmZjpYUmVzb2x1dGlvbj43MjAwMDAvMTAwMDA8L3RpZmY6WFJlc29sdXRpb24+CiAgICAgICAgIDx0aWZmOllSZXNvbHV0aW9uPjcyMDAwMC8xMDAwMDwvdGlmZjpZUmVzb2x1dGlvbj4KICAgICAgICAgPHRpZmY6UmVzb2x1dGlvblVuaXQ+MjwvdGlmZjpSZXNvbHV0aW9uVW5pdD4KICAgICAgICAgPGV4aWY6Q29sb3JTcGFjZT4xPC9leGlmOkNvbG9yU3BhY2U+CiAgICAgICAgIDxleGlmOlBpeGVsWERpbWVuc2lvbj4xMTM8L2V4aWY6UGl4ZWxYRGltZW5zaW9uPgogICAgICAgICA8ZXhpZjpQaXhlbFlEaW1lbnNpb24+OTI8L2V4aWY6UGl4ZWxZRGltZW5zaW9uPgogICAgICA8L3JkZjpEZXNjcmlwdGlvbj4KICAgPC9yZGY6UkRGPgo8L3g6eG1wbWV0YT4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAKPD94cGFja2V0IGVuZD0idyI/Pj+nbJgAAAAgY0hSTQAAeiUAAICDAAD5/wAAgOkAAHUwAADqYAAAOpgAABdvkl/FRgAAHFNJREFUeNrsfW1sW2eW3nPee/klUdSXJX9KsZ3EdiQ5m4Gb2LLsWac7M4soSReLNIO2P4oWKCbtArPFBA0yDcamrzM7s0WALbCDDrA/immBtoOt6mY8Mq/gJN14JpZkxatJxpZoO5tYsWVJlkSLEiVSJO+97+mPS1KkRFLUhxMp8QsEjmVd8t73ueec53y+xMx4uEpbFz/W3na6DLdpUFJxqE4hpZQMSSQEKL2PBDCDwRAkAJYQljBVY9Q8dOhvXnoQ90UPQcy/rgS1gJn5G4NBgGQJohfSP1vBNgPM5wECC0u458fj6wnoQxBT67dXT55zqKoqpbQlywaqHaAigNHCH8yZv9uQE/KBTSAwoDMAmUwkj3/jJ3/6EMRVrv7+V84mPDvczBIEgQXQCoHFAKATAZIJRBIMAWFBJu4jdOIETti/exqXrv1wQFHcAizBNmhpSHM/n3GewTC8wntit//ZhyCWsDo6vvtWwxP7DzBU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" />
            </div>
            </button> 
            <button onclick="handleGMAClick();return false" style="color: white; background-color: forestgreen; font-size: 1.5rem; font-weight: bold; border-radius: 16px; padding: 8px">Gabul ya hajj</button>
            <div>Import mofa number</div>
            </div>
            `
            : ''}
          `;
      },
      [structure, options]
    );
    const isExposed = await page.evaluate(() => window.handleSendClick);
    if (!isExposed) {
      await page.exposeFunction("handleSendClick", structure.controller.action);
      await page.exposeFunction("handleWTUClick", structure.controller.wtuAction);
      await page.exposeFunction("handleGMAClick", structure.controller.gmaAction);
      await page.exposeFunction("handleTWFClick", structure.controller.twfAction);
    }
  } catch (err) {
    console.log(err);
  }
}

function useCounter(currentCounter) {
  let output = currentCounter;
  const fileName = "./selectedTraveller.txt";
  if (fs.existsSync(fileName)) {
    const selectedTraveller = fs.readFileSync(
      fileName,
      "utf8"
    );
    output = parseInt(selectedTraveller);
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
  imageType = "photo"
) {
  let folder = photosFolder;
  let url = passenger.images.photo;
  if (imageType == "passport") {
    folder = passportsFolder;
    url = passenger.images.passport;
  }
  if (imageType == "vaccine") {
    folder = vaccineFolder;
    url = passenger.images.vaccine;
  }

  let imagePath = path.join(folder, `${passenger.passportNumber}.jpg`);
  const resizedPath = path.join(
    folder,
    `${passenger.passportNumber}_${width}x${height}.jpg`
  );
  if (fs.existsSync(imagePath) && fs.existsSync(resizedPath)) {
    return resizedPath;
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
  await sharp(imagePath).resize(width, height, {
    fit: sharp.fit.inside,
    withoutEnlargement: true,
  }).toFile(resizedPath);
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
  // let f = new FontFace("test", "url(x)");
  // await f.load();
  if (!process.argv.includes("nocanvas")) {
    const { createCanvas } = require("canvas");

    const canvas = createCanvas(400, 300);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.font = "11px Verdana, Verdana, Geneva, sans-serif"; // Verdana, Verdana, Geneva, sans-serif
    ctx.fillText(codeline.substring(0, 44), 15, canvas.height - 45);
    ctx.fillText(codeline.substring(44), 15, canvas.height - 20);

    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, 120, 150);
    ctx.fillStyle = "blue";
    ctx.strokeRect(180, 20, 200, 150);

    const out = fs.createWriteStream(fileName);
    const stream = canvas.createJPEGStream({
      quality: 0.95,
      chromaSubsampling: false,
    });
    stream.pipe(out);
  }
  return fileName;
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
      console.log(
        "%c 🍕 applicationType: ",
        "font-size:20px;background-color: #42b983;color:#fff;",
        applicationType
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
const hijriYear = 43;
module.exports = {
  hijriYear,
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
  waitForCaptcha,
  waitForPageCaptcha,
  VISION_DEFICIENCY,
  downloadAndResizeImage,
};
