const puppeteer = require("puppeteer");
let page;

async function getNewEmail() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: [
      "--incognito",
      "--disable-web-security",
      "--disable-features=IsolateOrigins,site-per-process",
    ],
  });
  const pages = await browser.pages();
  page = pages[0];
  await page.goto("https://www.minuteinbox.com/", {
    waitUntill: "networkidle0",
  });
  await page.waitForSelector("#email");
  const email = await page.$eval("#email", (el) => el.innerText);
  return email;
}

async function openMailinator(emailAddress) {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: [
      "--incognito",
      "--disable-web-security",
      "--disable-features=IsolateOrigins,site-per-process",
    ],
  });
  const pages = await browser.pages();
  page = pages[0];
  await page.goto(`https://www.mailinator.com/v4/public/inboxes.jsp?to=${emailAddress.split('@')[0]}`, {
    waitUntill: "networkidle0",
  });
  // await page.waitForSelector("#email");
  // const email = await page.$eval("#email", (el) => el.innerText);
  // return email;
}

async function getOtpFromEmail(email) {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: [
      "--incognito",
      "--disable-web-security",
      "--disable-features=IsolateOrigins,site-per-process",
    ],
  });
  const pages = await browser.pages();
  page = pages[0];
  await page.goto("https://www.minuteinbox.com/", {
    waitUntill: "networkidle0",
  });
  await page.waitForSelector("#emailInputModal");
  await page.type("#emailInputModal", email.split("@")[0]);
  await page.waitForSelector("#emailFormBtn");
  await page.click("#emailFormBtn");

  const code = await page.$eval("#email", (el) => el.innerText);
  return code;
}

async function readCode(id = 2) {
  for (let i = 0; i < 10; i++) {
    const content = await page.content();
      await page.goto(`https://www.minuteinbox.com/window/id/${id}`, {
        waitUntill: "domcontentloaded",
      });
      const selector =
        "body > div > table > tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(1) > td > table > tbody > tr > td > span";

      await page.waitForSelector(selector);
      const code = await page.$eval(selector, (el) => el.innerText);
      return code;
    
    await page.waitFor(2000);
  }
}

module.exports = { getNewEmail, getOtpFromEmail, readCode, openMailinator, page };
