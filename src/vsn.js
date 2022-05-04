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
    return fs.mkdirSync(inputFolder, { recursive: true });
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
    // if passport seen by vision api then continue with eagle detection
    // else perform vision api label annotation
    const documentJsonPath = path.join(
      __dirname,
      "..",
      "scan",
      "input",
      "done",
      `${traveler.nationality.name}-${traveler.passportNumber.toString()}.json`
    );
    const document_seen = fs.existsSync(documentJsonPath);
    if (document_seen) {
      const rawData = fs.readFileSync(documentJsonPath, "utf-8");
      const annotations = JSON.parse(rawData);
      const eagleExtract = runEagleExtract(annotations);
      continue;
    }
   //  await seeTravelerDocuments(inputFolder, traveler, client, documentJsonPath);
    // TODO: save the parsed passport data to firebase or create another data.json file that can be imported to firebase
  }
}

module.exports = { send };

async function seeTravelerDocuments(
  inputFolder,
  traveler,
  client,
  done_already_path
) {
  const downloadPath = path.join(
    inputFolder,
    traveler.nationality.name + "-" + traveler.passportNumber.toString()
  );
  const passportUrl = traveler.images.passport;
  await util.downloadImage(passportUrl, downloadPath);
  client
    .textDetection(downloadPath)
    .then((results) => {
      console.log("write to => ", done_already_path);
      fs.writeFileSync(done_already_path, JSON.stringify(results, null, 2));
    })
    .catch((err) => {
      console.error("ERROR:", err);
    });
}

let eagleVisionResult = {};
function runEagleExtract(annotations) {
  eagleVisionResult = {};
  const labels = annotations[0].textAnnotations;
  const interestingLabels = labels.filter((label) => {
    return label.description.length > 0;
  });
  const extract = {
    ...getMRZ(interestingLabels),
    ...getDates(interestingLabels),
    ...getProfession(interestingLabels),
    ...getEgyptianId(interestingLabels),
    ...getIssuePlace(interestingLabels),
    ...getArabicName(interestingLabels),
    ...getAddress(interestingLabels),
  };
  createDeviceFiles(extract);
  return extract;
}

function createDeviceFiles(extract) {
  // 3M files are codeline, IMAGEVIS, PHOTO
  // fs.writeFileSync("codeline.txt", extract.mrz);
}

function getMRZ(labels) {
  const mrz = labels.filter((label) => {
    return /^[A-Z0-9<]{22,88}$/.test(label.description);
  });

  if (mrz) {
    eagleVisionResult.mrz = mrz.map((label) => {
      return label.description;
    });
  }
}
function getDates(labels) {
  // Better regex to match date is needed
  // const dates = labels.map((label) => {
  //   return label.description.match(/[0-9]{2,4}.?[0-9]{2}.?[0-9]{2,4}/)?.[0];
  // })?.filter(x => x);
  // let earliest ;

  // for (const oneDate of dates) {
  //   const aDate = moment(oneDate);
  //   if (!aDate.isValid()) {
  //     continue;
  //   }

  //   if (!earliest) {
  //     earliest = oneDate;
  //   } else {
  //     if (moment(oneDate).isBefore(earliest)) {
  //       earliest = oneDate;
  //     }
  //   }
  // }
  // if (earliest) {
  //   eagleVisionResult.dateOfBirth = moment(earliest).format("DD/MM/YYYY");
  // }
}

function getProfession(labels) {}
function getEgyptianId(labels) {}
function getIssuePlace(labels) {}
function getArabicName(labels) {}
function getAddress(labels) {}
