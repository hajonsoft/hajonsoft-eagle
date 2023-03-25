const util = require("../util");
const kea = require("../lib/kea");
const axios = require("axios");
const { getPath } = util;
const fs = require("fs");
const totp = require("totp-generator");
const { PDFDocument, StandardFonts } = require("pdf-lib");

let page;
let data;
let mofas = [];
async function initialize(pg, dta) {
  page = pg;
  data = dta;
}

async function injectNSKEagleButton1() {
  try {
    const tdSelector =
      "#kt_content > div > div > div > div.kt-portlet__head > div.kt-portlet__head-label > h3";
    await page.waitForSelector(tdSelector, { timeout: 0 });
    const isExposed = await page.evaluate("!!window.handleImportNSKMofa");
    if (!isExposed) {
      try {
        await page.exposeFunction("handleImportNSKMofa", handleImportNSKMofa);
      } catch {}
    }
    await page.$eval(
      tdSelector,
      (el) =>
        (el.innerHTML = `
        <div style="display: flex; width: 100%; align-items: center; justify-content: center; gap: 16px; background-color: #CCCCCC; border: 2px solid black; border-radius: 16px; padding: 0.5rem;">
        <img style='width: 32px; height: 32px; border-radius: 8px; margin-right: 0.5rem'  src='data:image/jpeg;base64,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'> </img> 
        <div>HAJOnSoft</div>
        <button style="color: white; background-color: forestgreen; border-radius: 16px; padding: 16px;" type="button"  onclick="handleImportNSKMofa(); return false">To Eagle (current view) النسر </button>
        </div>
        `)
    );
  } catch (err) {
    console.log("Eagle error: Wrapped", err);
  }
}

async function injectNSKEagleButton2() {
  try {
    const tdSelector =
      "#kt_content > div > div > div.kt-portlet__head > div.kt-portlet__head-label > h3";
    await page.waitForSelector(tdSelector, { timeout: 0 });
    const isExposed = await page.evaluate("!!window.handleImportNSKMofa2");
    if (!isExposed) {
      try {
        await page.exposeFunction("handleImportNSKMofa2", handleImportNSKMofa2);
      } catch {}
    }
    await page.$eval(
      tdSelector,
      (el) =>
        (el.innerHTML = `
        <div style="display: flex; width: 100%; align-items: center; justify-content: center; gap: 16px; background-color: #CCCCCC; border: 2px solid black; border-radius: 16px; padding: 0.5rem;">
        <img style='width: 32px; height: 32px; border-radius: 8px; margin-right: 0.5rem'  src='data:image/jpeg;base64,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'> </img> 
        <div>HAJOnSoft</div>
        <button style="color: white; background-color: forestgreen; border-radius: 16px; padding: 16px;" type="button"  onclick="handleImportNSKMofa2(); return false">To Eagle (current view) النسر </button>
        </div>
        `)
    );
  } catch (err) {
    console.log("Eagle error: Wrapped", err);
  }
}

let loginCount = 0;
async function onNSKPageLoad(res) {
  const mofaUrl = await page.url();
  console.log("📢[nsk.js:44]: mofaUrl: ", mofaUrl);
  if (!mofaUrl) {
    return;
  }

  if (
    mofaUrl
      .toLowerCase()
      .includes("bsp-nusuk.haj.gov.sa/Identity".toLowerCase())
  ) {
    await page.waitForSelector("#userName");
    await page.type("#userName", data.system.username);
    await page.type("#password", data.system.password);
    const token = await util.commitCaptchaTokenWithSelector(
      page,
      "#img-captcha",
      "#CaptchaCode",
      5
    );

    console.log("Token", token);
    if (!token) {
      page.evaluate("document.title='Eagle: Captcha Failed'");
      return;
    }
    if (data.system.username && data.system.password && loginCount < 1) {
      await page.click("#kt_login_signin_submit");
      loginCount++;
    }
    return;
  }
  // OTP
  if (
    mofaUrl.toLowerCase().includes("haj.gov.sa/OTP/GoogleAuth".toLowerCase())
  ) {
    if (!data.system.ehajCode) {
      return;
    }
    const googleToken = totp(data.system.ehajCode);
    console.log("Google setup token: ", data.system.ehajCode);
    console.log("googleToken: ", googleToken);
    await util.commit(
      page,
      [
        {
          selector: "#OtpValue",
          value: () => googleToken,
        },
      ],
      {}
    );
    await page.click("#newfrm > button");
    return;
  }

  if (
    mofaUrl
      .toLowerCase()
      .includes(
        "nusuk.haj.gov.sa/ExternalAgencies/Groups/ViewPackage/".toLowerCase()
      )
  ) {
    await injectNSKEagleButton1();
  }

  if (
    mofaUrl
      .toLowerCase()
      .includes(
        "nusuk.haj.gov.sa/UmrahOperators/Home/EditMuatamerList".toLowerCase()
      )
  ) {
    await injectNSKEagleButton2();
  }
}

async function handleImportNSKMofa() {
  console.log({ data });
  const tableSelector = "table:nth-child(2)";
  const table = await page.$(tableSelector);
  if (!table) {
    return;
  }

  const tableRows = await page.$$("table:nth-child(2) tr");
  const passports = [];
  for (let i = 1; i < tableRows.length; i++) {
    const row = tableRows[i];
    const passportNumber = await row.$eval(
      "td:nth-child(3)",
      (el) => el.innerText
    );
    // import name
    const name = await row.$eval("td:nth-child(1)", (el) => el.innerText);
    passports.push(passportNumber);
    const mofaNumber = await row.$eval("td:nth-child(7)", (el) => el.innerText);
    const nationality = await row.$eval(
      "td:nth-child(2)",
      (el) => el.innerText
    );
// #kt_content > div > div > div > div.kt-portlet__body.px-0 > div:nth-child(1) > div > div > div > div > div.kt-widget__body > table > tbody > tr:nth-child(1) > td:nth-child(10) > a
    const insurancePdf = await row.$eval(
      "td:nth-child(10) > a",
      (el) => el.href
    );
    mofas.push({ passportNumber, mofaNumber, nationality, name, insurancePdf });
    if (passportNumber) {
      fs.writeFileSync(
        getPath(passportNumber + ".txt"),
        JSON.stringify({ mofaNumber, nationality, name, passportNumber, insurancePdf })
      );
      // Write to Kea
      const params = {
        mofaNumber: mofaNumber || "waiting",
      };
      kea.updatePassenger(data.system.accountId, passportNumber, params);
    }
  }
  await page.evaluate((passportsArrayFromNode) => {
    const eagleButton = document.querySelector(
      "#kt_content > div > div > div > div.kt-portlet__head > div.kt-portlet__head-label > h3 > div > button"
    );
    eagleButton.textContent = `Done... [${passportsArrayFromNode[0]}-${
      passportsArrayFromNode[passportsArrayFromNode.length - 1]
    }] downloading insurance...`;
  }, passports);
  // const downloadPath = await downloadInsuranceFile(mofas);
  // await page.evaluate(() => {
  //   const eagleButton = document.querySelector(
  //     "#kt_content > div > div > div > div.kt-portlet__head > div.kt-portlet__head-label > h3 > div > button"
  //   );
  //   eagleButton.textContent = `Done... ${downloadPath}`;
  // });

}

async function handleImportNSKMofa2() {
  console.log({ data });
  const tableSelector = "#MuatamerList";
  const table = await page.$(tableSelector);
  if (!table) {
    return;
  }

  const tableRows = await page.$$("#MuatamerList > tbody > tr");
  const passports = [];
  for (let i = 1; i <= tableRows.length; i++) {
    const rowPassportNumberSelector = `#MuatamerList > tbody > tr:nth-child(${i}) > td:nth-child(4)`;
    const passportNumber = await page.$eval(
      rowPassportNumberSelector,
      (el) => el.innerText
    );
    // import name
    const rowNameSelector = `#MuatamerList > tbody > tr:nth-child(${i}) > td:nth-child(2)`;
    const name = await page.$eval(rowNameSelector, (el) => el.innerText);
    passports.push(passportNumber);

    const rowMofaSelector = `#MuatamerList > tbody > tr:nth-child(${i}) > td:nth-child(8)`;
    const mofaNumber = await page.$eval(rowMofaSelector, (el) => el.innerText);

    const rowNationalitySelector = `#MuatamerList > tbody > tr:nth-child(${i}) > td:nth-child(3)`;
    const nationality = await page.$eval(
      rowNationalitySelector,
      (el) => el.innerText
    );

    mofas.push({ passportNumber, mofaNumber, nationality, name });
    if (passportNumber) {
      fs.writeFileSync(
        getPath(passportNumber + ".txt"),
        JSON.stringify({ mofaNumber, nationality, name, passportNumber })
      );
      // Write to Kea
      const params = {
        mofaNumber: mofaNumber || "waiting",
      };
      kea.updatePassenger(data.system.accountId, passportNumber, params);
    }
    try {
      const rowInsurancePdfSelector = `#MuatamerList > tbody > tr:nth-child(${i}) > td:nth-child(12) > a`;
      const insurancePdf = await page.$eval(
        rowInsurancePdfSelector,
        (el) => el.href
      );
      console.log({ insurancePdf });
    } catch (e) {
      console.log(e);
    }
  }
  await page.evaluate((passportsArrayFromNode) => {
    const eagleButton = document.querySelector(
      "#kt_content > div > div > div.kt-portlet__head > div.kt-portlet__head-label > h3 > div > button"
    );
    eagleButton.textContent = `Done... [${passportsArrayFromNode[0]}-${
      passportsArrayFromNode[passportsArrayFromNode.length - 1]
    }]`;
  }, passports);
}

async function downloadInsuranceFile(mofas) {
// TODO: download all insurance docs and save to pdf here
const pdfDoc = await PDFDocument.create();
// download first page of insurance pdf found in mofas array and add to pdfDoc
const insurancePdfs = mofas.map(item => item.insurancePdf);
// use promise.all to download all insurance pdfs in parallel using axios
const insurancePdfBuffers = await Promise.all(
  insurancePdfs.map(async (insurancePdf) => {
    const response = await axios.get(insurancePdf, {
      responseType: "arraybuffer",
    });
    return PDFDocument.load(response.data);
  })
);
// add all insurance pdfs to pdfDoc
for (let i = 0; i < insurancePdfBuffers.length; i++) {
  const insurancePdfBuffer = insurancePdfBuffers[i];  
  const insurancePdf = await pdfDoc.embedPdf(insurancePdfBuffer);
  const insurancePages = insurancePdf.getPages();
  const insurancePage = insurancePages[0];
  pdfDoc.addPage(insurancePage);
}
// save pdfDoc
const pdfBytes = await pdfDoc.save();
const downloadPath = getPath(
  `${passportsArrayFromNode[0]}-${
    passportsArrayFromNode[passportsArrayFromNode.length - 1]
  }-insurance.pdf`
);
fs.writeFileSync(downloadPath, pdfBytes);
}
module.exports = {
  initialize,
  injectNSKEagleButton: injectNSKEagleButton1,
  onNSKPageLoad,
};
