const puppeteer = require("puppeteer-extra");
// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const fs = require("fs");
const budgie = require("./budgie");
const path = require("path");
const util = require("./util");
const moment = require("moment");
const sharp = require("sharp");
const vision = require("@google-cloud/vision");

let page;
let mofaPage;
let data;
let counter = 0;

async function send(sendData) {
  data = sendData;
  const inputFolder = path.join(__dirname, "..", "scan", "input");
  if (!fs.existsSync(inputFolder)) {
    fs.mkdirSync(inputFolder, { recursive: true });
  }

  const outputFolder = path.join(__dirname, "..", "scan", "input", "done");
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
  }

  let visionKeyFilePath = "./scan/auth/key.json";
  if (!fs.existsSync(visionKeyFilePath)) {
    return console.log("vision key file not found", visionKeyFilePath);
  }

  const client = new vision.ImageAnnotatorClient({
    keyFilename: visionKeyFilePath,
  });

  for (let i = 0; i < data?.travellers?.length; i++) {
    const traveler = data.travellers[i];
    const localImagePath = path.join(
      inputFolder,
      traveler.nationality.name + "-" + traveler.passportNumber.toString()
    );
    await util.downloadImage(traveler.images.passport, localImagePath);
     client.textDetection(localImagePath).then((results) => {
      const labels = results[0].textAnnotations;
      labels.forEach((label) => {
        // find MRZ and write it to CODELINE.txt
        // find egyptianId number and write it to nn-ID.txt
        // find issue date and write it to nn-ISSUEDT.txt
        // find profession and write it to nn-profession.txt
        // find issue place/ office and write it to nn-issueplace.txt
        // find arabic name and write it to nn-arabic-name.txt
        // find address and write it to nn-address.txt
        // etc ..
        // tODO:Inquire about output path
      });
      const outputFile = path.join(
        outputFolder,
        `${
          traveler.nationality.name + "-" + traveler.passportNumber.toString()
        }.txt`
      );
      console.log('write to => ', outputFile);
      fs.writeFileSync(
        outputFile,
        JSON.stringify(results, null, 2)
      );
    })
    .catch((err) => {
      console.error("ERROR:", err);
    });



    // TODO: save the parsed passport data to firebase or create another data.json file that can be imported to firebase
  }
}

module.exports = { send };
