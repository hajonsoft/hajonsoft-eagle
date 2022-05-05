const fs = require("fs");
const path = require("path");
const util = require("./util");
const moment = require("moment");
const sharp = require("sharp");
const vision = require("@google-cloud/vision");
const _ = require("lodash");

let data;

async function send(sendData) {
  data = sendData;
  const scanInput = path.join(__dirname, "..", "scan", "input");
  if (!fs.existsSync(scanInput)) {
    return fs.mkdirSync(scanInput, { recursive: true });
  }

  const scanInputDone = path.join(__dirname, "..", "scan", "input", "done");
  if (!fs.existsSync(scanInputDone)) {
    fs.mkdirSync(scanInputDone, { recursive: true });
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
    const visionResultPath = path.join(
      __dirname,
      "..",
      "scan",
      "input",
      "done",
      `${traveler.nationality.name}-${traveler.passportNumber.toString()}.json`
    );

    const imgPath = path.join(
      scanInput,
      traveler.nationality.name + "-" + traveler.passportNumber.toString()
    );

    if (processExistingFiles(visionResultPath, imgPath)) {
      continue;
    }

    await downloadVision(imgPath, traveler, client, visionResultPath);
    processExistingFiles(visionResultPath, imgPath);
  }
}

module.exports = { send };

function processExistingFiles(visionResultPath, imgPath) {
  if (fs.existsSync(visionResultPath)) {
    const rawData = fs.readFileSync(visionResultPath, "utf-8");
    const annotations = JSON.parse(rawData);
    const extract = runEagleExtract(annotations);
    prepare();
    createDeviceFiles(extract, imgPath);
    return true;
  }
  return false;
}
async function downloadVision(
  downloadPath,
  traveler,
  client,
  done_already_path
) {
  const passportUrl = traveler.images.passport;
  if (!fs.existsSync(downloadPath)) {
    await util.downloadImage(passportUrl, downloadPath);
  }
  const detectionResult = await client.textDetection(downloadPath);
  console.log("write to => ", done_already_path);
  fs.writeFileSync(done_already_path, JSON.stringify(detectionResult, null, 2));
}

function runEagleExtract(annotations) {
  eagleVisionResult = {};
  const labels = annotations[0].textAnnotations;
  const filteredLabels = labels.filter((label) => {
    return label.description.length > 1;
  });
  const extract = {
    eagle: {
      comments: filteredLabels.map((l) => l.description),
      passIssueDt: getIssueDate(filteredLabels),
      passIssuePlace: "invalid",
      arabicName: "invalid",
      egyptianId: getEgyptianId(filteredLabels),
      birthPlace: "invalid",
      profession: getProfession(filteredLabels),
    },
    ...getMRZ(filteredLabels),
    ...getIssuePlace(filteredLabels),
    ...getArabicName(filteredLabels),
    ...getAddress(filteredLabels),
  };
  return extract;
}

function prepare() {
  const folder3M = "./scan/input/done/3M";
  if (fs.existsSync(folder3M)) {
    fs.readdirSync(folder3M).forEach((file) => {
      fs.unlinkSync(path.join(folder3M, file));
    });
  }
}

function createDeviceFiles(extract, imgPath) {
  const unique = moment().valueOf();
  const folder3M = "./scan/input/done/3M";
  if (!fs.existsSync(folder3M)) {
    return fs.mkdirSync(folder3M, { recursive: true });
  }
  fs.copyFile(imgPath, `${folder3M}/${unique}-IMAGEVIS.jpg`, (err) => {
    if (err) {
      return console.log(err);
    }
    console.log(`${folder3M}/${unique}-IMAGEVIS.jpg`);
  });

  sharp(imgPath)
    .extract({ left: 100, top: 100, width: 500, height: 700 })
    .toFile(`${folder3M}/${unique}-IMAGEPHOTO.jpg`, function (err) {
      if (err) {
        console.log(err);
      }
      console.log(`${folder3M}/${unique}-IMAGEPHOTO.jpg`);
    });

  fs.writeFileSync(
    `${folder3M}/${unique}-CODELINE.txt`,
    extract?.mrz?.join("\n")
  );
  console.log(`${folder3M}/${unique}-CODELINE.txt`);
  fs.writeFileSync(
    `${folder3M}/${unique}-EAGLE.json`,
    JSON.stringify(extract.eagle)
  );
  console.log(`${folder3M}/${unique}-EAGLE.json`);
}

function getMRZ(labels) {
  const mrz = labels.filter((label) => {
    return /^[A-Z0-9<]{22,88}$/.test(label.description);
  });

  if (mrz && mrz.length > 0) {
    return {
      mrz: mrz.map((label) => label.description),
    };
  }
}
function getIssueDate(labels) {
  let dates = [];
  labels.forEach((label) => {
    const match = label.description.match(
      /[0-9]{2,4}[/\.-][0-9]{2}[/\.-][0-9]{2,4}/g
    );
    if (match) {
      dates = [...dates, ...match];
    }
  });
  dates = _.uniq(dates);

  dates = dates.sort((a, b) => {
    return moment(a.trim()).isBefore(b.trim()) ? -1 : 1;
  });

  if (dates && dates.length > 1) {
    return moment(dates[0]).format("DD-MMM-YYYY");
  } else {
    return "invalid";
  }
}

function getProfession(labels) {
  const professions = labels.filter((label) => {
    return /profession:/i.test(label.description);
  });

  if (professions && professions.length > 0) {
    return _.uniq(
      professions.map((label) =>
        label.description.match(/profession:(.*)/i)?.[1]?.trim()
      )
    )?.join(" ");
  }
  return "unknown";
}
function getEgyptianId(labels) {}
function getIssuePlace(labels) {}
function getArabicName(labels) {}
function getAddress(labels) {}
