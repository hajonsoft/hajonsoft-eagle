const { config, SERVER_NUMBER } = require("../bau");
const util = require("../util");
const fs = require("fs");
const { homedir } = require("os");

let page;
let data;
let mofas = [];
async function initialize(pg, dta) {
  page = pg;
  data = dta;
}

async function injectBAUEagleButton(frame) {
  return
  try {
    const tdSelector = "#Section1";
    await frame.waitForSelector(tdSelector, { timeout: 0 });
    const isExposed = await frame.evaluate("!!window.handleImportBAUMofa");
    if (!isExposed) {
      await frame.exposeFunction("handleImportBAUMofa", handleImportBAUMofa);
    }
    await frame.$eval(
      tdSelector,
      (el) =>
        (el.innerHTML = `
        <div style="display: flex; width: 100%; align-items: center; justify-content: center; gap: 16px; background-color: #CCCCCC; border: 2px solid black; border-radius: 16px; padding: 0.5rem;">
        <img style='width: 32px; height: 32px; border-radius: 8px; margin-right: 0.5rem'  src='data:image/jpeg;base64,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'> </img> 
        <div>HAJOnSoft</div>
        <button style="color: white; background-color: forestgreen; border-radius: 16px; padding: 16px;" type="button"  onclick="handleImportBAUMofa(); return false">To Eagle (current view) النسر </button>
        </div>
        `)
    );
  } catch (err) {
    console.log("Eagle error: Wrapped", err);
  }
}

async function onBAUPageLoad(res) {
  const mofaUrl = await page.url();
  if (!mofaUrl) {
    return;
  }

  if (
    mofaUrl
      .toLowerCase()
      .includes(config.find((c) => c.name === "login").url.toLowerCase())
  ) {
    await page.waitForSelector("#txtUserName");
    const userName = await page.$eval("#txtUserName", (el) => el && el.value);
    if (!userName) {
      await page.type("#txtUserName", data.system.username);
    }
    await page.type("#txtPassword", data.system.password);
    await util.premiumSupportAlert(page, '#form1 > div:nth-child(14) > div', data);
    await page.waitForSelector("#rdCap_CaptchaTextBox");
    await page.focus("#rdCap_CaptchaTextBox");
    await util.commitCaptchaToken(
      page,
      "rdCap_CaptchaImage",
      "#rdCap_CaptchaTextBox",
      5
    );
    await page.waitForTimeout(5000);
    await page.waitForFunction(
      "document.querySelector('#rdCap_CaptchaTextBox').value.length === 5"
    );
    await page.click("#lnkLogin");
    return;
  }

  if (
    mofaUrl
      .toLowerCase()
      .includes("babalumra.com/Security/MainPage.aspx".toLowerCase())
  ) {
    await page.goto(`https://app${SERVER_NUMBER}.babalumra.com/Groups/SearchGroups.aspx`);
    return;
  }

  if (
    mofaUrl
      .toLowerCase()
      .includes("babalumra.com/Groups/SearchGroups.aspx".toLowerCase())
  ) {
    try {
       await page.$$eval("a", (els) => {
        els.map((el) => el.removeAttribute("target"));
      });
    } catch {}
    return;
  }

  if (
    mofaUrl
      .toLowerCase()
      .includes("reports2.babalumra.com/ReportViewer.aspx".toLowerCase())
  ) {
    for (const frame of page.frames()) {
      // console.log(frame.name());
      // if (frame.name().includes("bobjid_1659204399945_iframe")) {
      //   await injectBAUEagleButton();
      // }
    }
  }

  // const text = await frame.$eval('#Section1', element => element.textContent);
  // console.log(text);
}

async function handleImportBAUMofa() {
  return ;
  const tableSelector = "#dgrdMofaRpt";
  const table = await page.$(tableSelector);
  if (!table) {
    return;
  }

  const tableRows = await page.$$("#dgrdMofaRpt > tbody tr");
  const passports = [];
  for (let i = 1; i <= tableRows.length; i++) {
    const rowPassportNumberSelector = `#dgrdMofaRpt > tbody > tr:nth-child(${i}) > td:nth-child(6)`;
    const passportNumber = await page.$eval(
      rowPassportNumberSelector,
      (el) => el.innerText
    );
    // import name
    const rowNameSelector = `#dgrdMofaRpt > tbody > tr:nth-child(${i}) > td:nth-child(1)`;
    const name = await page.$eval(rowNameSelector, (el) => el.innerText);
    passports.push(passportNumber);

    const rowMofaSelector = `#dgrdMofaRpt > tbody > tr:nth-child(${i}) > td:nth-child(7)`;
    const mofaNumber = await page.$eval(rowMofaSelector, (el) => el.innerText);

    const rowNationalitySelector = `#dgrdMofaRpt > tbody > tr:nth-child(${i}) > td:nth-child(12)`;
    const nationality = await page.$eval(
      rowNationalitySelector,
      (el) => el.innerText
    );

    mofas.push({ passportNumber, mofaNumber, nationality, name });
    if (passportNumber) {
      fs.writeFileSync(
        passportNumber,
        JSON.stringify({ mofaNumber, nationality, name, passportNumber })
      );
    }
  }
  await page.evaluate((passportsArrayFromNode) => {
    const eagleButton = document.querySelector(
      "#Table1 > tbody > tr:nth-child(1) > td > table > tbody > tr:nth-child(3) > td:nth-child(2) > div > button"
    );
    eagleButton.textContent = `Done... [${passportsArrayFromNode[0]}-${
      passportsArrayFromNode[passportsArrayFromNode.length - 1]
    }]`;
  }, passports);
}

module.exports = { initialize, injectBAUEagleButton, onBAUPageLoad };
