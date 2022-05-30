const puppeteer = require("puppeteer");

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


module.exports = { getNewEmail };
