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
  // remove this event to enable right click on the page
  // await page.evaluate(() => {
  //   window.removeEventListener('contextmenu', {});
  // });

  return page;
}

async function newPage(onMofaContentLoaded, onMofaContentClosed) {
  const _newPage = await browser.newPage();
  _newPage.on("domcontentloaded", onMofaContentLoaded);
  _newPage.on("close", onMofaContentClosed);
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
  let lowerUrl = url.toLowerCase();
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
          const removeReadOnlyAttribute = `document.querySelector('${detail.select}').removeAttribute('readonly')`
          const removeDisabledAttribute = `document.querySelector('${detail.select}').removeAttribute('disabled')`
          await page.evaluate(removeDisabledAttribute)
          await page.evaluate(removeReadOnlyAttribute)
          await page.evaluate((element) => {
            const field = document.querySelector(element.selector);
            if (field) {
              field.value = "";
              field.setAttribute("value", "");
            }
          }, detail);
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

  const options =
    "<option>Select passenger click send حدد الراكب انقر إرسل</option>" +
    travellers
      .map(
        (traveller, cursor) =>
          `<option value="${cursor}">${cursor} - ${
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
          <img style='width: 32px; height: 32px; border-radius: 8px; margin-right: 0.5rem'  src='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAAyADIDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD96PGvjXR/hv4P1TxB4g1Sw0XQtDtJb7UNQvZ1gtrK3jUvJLJIxCqiqCSxIAANfix+21/wdvSxeMbzw3+zv4L0vUraF2ji8S+LI52N+BkGS306No5VQjDK88itz88C4wf0X/4Kp+GfhX8R/hBo/hr4yeItWh8B3F+uoX/hPR5XhvfGb25V4LaR42WQWiSYlcKY90qW2ZkUNHL82+Cf+CmvhX9nTRP+Ef8Ag58D/B3gfwzCw2wQeXZm4x0d4reJVDnJJYu5JJJJJr6HKeFc0zKHtMJSbj3bSXybav8AK58/m3FWV5dP2eLqpS7JNv5pJ2+dj81fAf8AwdG/tXeGfFjXl7rngHxTbxuVl0vUfDiRwJzyoa2eKVWHbc5weoPQ/fH7MX/B2x8JfG9jbWvxY8C+LPh5qxwst7pQXXdJ4wC+VCXK5OTsEEmBxvY8nF/4KIftteGf2xP2eruzvP2aPhr46+IW37PZ3XiXUWWLT4iMtLBcwpDdq5YAeVHcW4wxPncbW/Ln4Jf8Ec/jp8cdIjudNsfA+m7iyLBrPjbSrW8bazISbcTNKgJUkF0XcMMuVIJyzDhvNMC7YmhJLuldferr8TXL+JMsxqvhq0X5N2f3Oz/A/oA8O/8ABwL+x74ntPOt/jbotupz8t9pWo2Mn/fE1ujfpWP45/4ONv2O/A1nLI3xa/taaNN6waX4d1S6aT2DrbeWD/vOo96/GzRv+DcP9oi9ulXU9Y+C3hm2YZN3qvjZBCo9T5MUrf8AjtfYP/BOr/g3G+DNn8YtJuPiX8ZvD3xe17Rwurt4Q8KqjaP+5kQEXsxMj3EG9kBjK24bIVg6llby44Su4uag7Ld2dl6npyxdBSUHNXeyurv0P1X+Gv7VN58Wfhz4f8VaP8LfiU2k+JtNt9VsTcpplrOYJ4llj3xSXoeNtrjKOAynIIBBFFet0VznQfPUP/BPbwz8R/iTqXjj4oyTeNvE2qODHaNM8Wl6RCufKtoY1KmRUU4LScSMWk8tGcirv7QX7I/wY0/4G+JmvvDPgPwParp0sY1+HQ7WObSWZSiTo2wFpFZlKqc7n2jDZwfeK+dtb+DGm/t6eJ4fEHiLVJr74YaDe3FtouhWc7RQ6xdQSyW819cyKQWUSJIkSIcbF37iJmjH0uEzLFYiaqYrEThSp2Xut6LpGEU0k3bTZaNvY+bxeW4WhBww2HhOrO795LV9ZTbTbSvru9UlufnB8RPBfhn4ifERtN+Cvh/4g69p1jCsczXMBvrm6cADzhFDFuhRsFvnPO77sYG2gfsafFe6C/8AFtfGTbum7SpB+eRx+Nfst4S8HaT4B0GDS9D0vT9H0y1GIbSyt0t4Y/oigAflXGa/+1r8OPCnxefwLqni3S9N8URxxyNa3TNDGpkG5EMzARCRlKkRlt5DqQMEV9xQ8SMa/wBzgMM5qC3k5TlZbyk0l8+i7nw9fw4waftsdiFBye0VGEbv7MU2/l1fY/M74ef8EuPjF49vI1fwna+HbWTrdaxeRQon1jjLzf8AkP8AGv0E/Yf/AGJtN/Y78H30Zvl1vxJrbo+oaiIPJUIgOyCJckiNSWOScszEnA2qvuQORRXyefccZlmtJ4eraNN7qKettrttv5XS8j6zIeB8tyqqsRSvKa2cmtL72SSX4N+YUUUV8cfYHn37WHiy+8C/sx/EDWNMkkh1DT/D97NbSxnDQSCFtsg91PzfhXz1/wAEe/2gdJ8RfA//AIVzNNDb674TlnmtrdmAa8spZWl8xP72ySR0YD7o8sn7wr648UeGrLxn4Z1HR9SgW603VrWWzuoWJAmikQo6nHPKkj8a/Ij9pP8AZD8efsVePP7RiOrNotjcebpPijT2aPyx0TzJI8GCbBwQcBjnaWGcfofCODwWZ4CvlFaahVlKM4N9Wk1bztd6b2ldbM/PuLcZjcsx1DNqMHOlGMozS6JtO/ley12urPdH7C1+fvxI/wCCPnijxd8eF1Obxlaa54b8Qao97rd5cobbU4Ud2kkCooaN2YfKrAqFLD93tWuD+Ev/AAWJ+JHgqzhtvEem6H40t4x/r5M6feyf70kYaI/hCD6k16dB/wAFv7M22ZfhreLN/dTW0ZP++jCD+ld+X8NcU5NVm8BCMuZWbTi/S3M1JW32Xnc4Mw4k4XzmlBY6bXK7pNSXrflTi77bvysfcug6FZ+F9Ds9M062hs9P06BLW2t4l2xwRIoVEUdgFAAHoK5v4mfEK58N694a0HSYY7rXPEt7sVXBKWllDte7uXx0VUKxqeR51xACMMa+Jh/wVh+KPx415PDvwx+HGnx6xdfKA00mqSxA8eYSFhjiAJHzy5Qd+K+qP2T/AIA+IPhlpl54j8f69L4r+I3iJEGo37vuisIFJZLO2UBVjiVmZiEVQ7sTjAXHy+P4dr5ZH22ZuKm9ocylJt9Xa6UVu23rslq2vqMBxDQzOXscsUnBbzs4xSXRXs3J7JJabt6JP2CiiivlT6gKbJGs0bKyqysMMpGQR6GiinHcUtj4v/4KG/A7wV4Zgt7rTfB/hfT7q5iaSaa20qCGSVtx+ZmVQSfc186/s1fDzw/4h+Jlpb6hoej31uzJuiuLKOVDz3DAiiiv6Wyv/kWr0P5uzT/kYv1P1G8HeBND+Hejrp/h/RtJ0LT1O5bbT7SO1hB9diAD9K1qKK/njNv98qerP6Cyn/c6f+FBRRRXnnoH/9k='> </img> 
          <h5 style='margin-right: 0.5rem; color: #311b92'> HAJonSoft </h5> 
          <select id="hajonsoft_select" style='flex-grow: 1; margin-right: 0.5rem' > 
          ${optionsParam}
          </select>  
          <button style='background-color: #2196f3; color: #ffffff; width: 6rem, padding: 0.5rem; margin: 0 5px; border-radius: 8px;' type="button" onclick="handleSendClick();return false">Send إرسل</button> 
          </div>`;
      },
      [structure, options]
    );
    const isExposed = await page.evaluate(() => window.handleSendClick);
    if (!isExposed) {
      await page.exposeFunction("handleSendClick", structure.controller.action);
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
  if (!fs.existsSync(fileName) || process.argv.includes("noimage")) {
    return;
  }
  await page.waitForSelector(selector);
  const input = await page.$(selector);
  await input.uploadFile(fileName);
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
  waitForCaptcha,
  waitForPageCaptcha,
  VISION_DEFICIENCY,
  downloadAndResizeImage,
};
