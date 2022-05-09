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
    fs.mkdirSync(scanInput, { recursive: true });
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
  delete3MExistingFiles();

  for (let i = 0; i < data?.travellers?.length; i++) {
    console.log('processing traveler => ', i, ' of ', data.travellers.length);
    const traveler = data.travellers[i];
    // if passport seen by vision api then continue with eagle detection
    // else perform vision api label annotation
    const detectedTextResultPath = path.join(
      __dirname,
      "..",
      "scan",
      "input",
      "done",
      `${traveler.nationality.name}-${traveler.passportNumber.toString()}.json`
    );

    const detectedFaceResultPath = path.join(
      __dirname,
      "..",
      "scan",
      "input",
      "done",
      `${traveler.nationality.name}-${traveler.passportNumber.toString()}.jpg`
    );

    const passportImgPath = path.join(
      scanInput,
      traveler.nationality.name + "-" + traveler.passportNumber.toString()
    );

    await downloadVision(
      passportImgPath,
      traveler,
      client,
      detectedTextResultPath,
      detectedFaceResultPath
    );
    await processExistingFiles(
      detectedTextResultPath,
      passportImgPath,
      detectedFaceResultPath
    );
  }
}

module.exports = { send };

async function processExistingFiles(
  visionResultPath,
  passportImgPath,
  detectedFaceResultPath
) {
  if (fs.existsSync(visionResultPath)) {
    const rawData = fs.readFileSync(visionResultPath, "utf-8");
    try {
      const annotations = JSON.parse(rawData);
      const extract = runEagleExtract(annotations);
      await createDeviceFiles(extract, passportImgPath, detectedFaceResultPath);
    } catch (err) {
      console.log(err);
    }
    return true;
  }
  return false;
}

async function downloadVision(
  downloadPath,
  traveler,
  client,
  detectedTextResultPath,
  detectedFaceResultPath
) {
  const passportUrl = traveler.images.passport;
  if (!fs.existsSync(downloadPath)) {
    await util.downloadImage(passportUrl, downloadPath);
  }

  // face detection
  const [result] = await client.faceDetection(downloadPath);
  const faces = result.faceAnnotations;
  if (faces && faces.length > 0) {
    const face = faces[0];
    await sharp(downloadPath)
      .extract({
        top: face.boundingPoly.vertices[0].y,
        left: face.boundingPoly.vertices[0].x,
        width:
          face.boundingPoly.vertices[2].x - face.boundingPoly.vertices[0].x,
        height:
          face.boundingPoly.vertices[2].y - face.boundingPoly.vertices[0].y,
      })
      .toFile(detectedFaceResultPath);
  } else {
    fs.copyFile(downloadPath, detectedFaceResultPath );
  }

  // text detection
  const detectionResult = await client.textDetection(downloadPath);
  fs.writeFileSync(
    detectedTextResultPath,
    JSON.stringify(detectionResult, null, 2)
  );
  return downloadPath;
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

function delete3MExistingFiles() {
  const folder3M = "./scan/input/done/3M";
  if (fs.existsSync(folder3M)) {
    fs.readdirSync(folder3M).forEach((file) => {
      fs.unlinkSync(path.join(folder3M, file));
    });
  }
}

async function createDeviceFiles(extract, passImgPath, detectedFaceResultPath) {
  const unique = moment().valueOf();
  const folder3M = "./scan/input/done/3M";
  if (!fs.existsSync(folder3M)) {
    fs.mkdirSync(folder3M, { recursive: true });
  }
  fs.copyFile(passImgPath, `${folder3M}/${unique}-IMAGEVIS.jpg`, (err) => {
    if (err) {
      return console.log(err);
    }
  });

  if (detectedFaceResultPath && fs.existsSync(detectedFaceResultPath)) {
    fs.copyFile(
      detectedFaceResultPath,
      `${folder3M}/${unique}-IMAGEPHOTO.jpg`,
      (err) => {
        if (err) {
          return console.log(err);
        }
      }
    );
  }

  fs.writeFileSync(`${folder3M}/${unique}-CODELINE.txt`, extract?.mrz);
  fs.writeFileSync(
    `${folder3M}/${unique}-EAGLE.json`,
    JSON.stringify(extract.eagle)
  );
}

function getMRZ(labels) {
  const mrzRegEx = new RegExp("P[A-Z<][A-Z<]{42}\\n?[A-Z0-9<]{44}", "gm");
  let mrz = "";

  labels.forEach((lbl) => {
    if (lbl.description.length > 44) {
      const match = lbl.description.match(mrzRegEx);
      if (match) {
        mrz = match[0];
        return;
      }
    }
  });

  if (!mrz) {
    mrz =
      "P<XXXPASSENGER<<ERROR<<<<<<<<<<<<<<<<<<<<<<<\n1234567897XXX0001018M3001019<<<<<<<<<<<<<<06";
  }
  return { mrz };
}
function getIssueDate(labels) {
  try {
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
    let parsedDates = [];
    dates.forEach((dt) => {
      if (dt.includes("/")) {
        const date = moment(dt, "DD/MM/YYYY");
        if (date.isValid()) {
          parsedDates.push(date.format("YYYY-MM-DD"));
        }
      } else if (dt.includes(".")) {
        const date = moment(dt, "DD.MM.YYYY");
        if (date.isValid()) {
          parsedDates.push(date.format("YYYY-MM-DD"));
        }
      } else if (dt.includes("-")) {
        const date = moment(dt, "YYYY-MM-DD");
        if (date.isValid()) {
          parsedDates.push(date.format("YYYY-MM-DD"));
        }
      }
    });
    parsedDates = parsedDates.filter(
      (dt) =>
        moment(dt).isBefore(moment()) &&
        moment(dt).isAfter(moment().subtract(10, "year"))
    );

    if (!parsedDates || parsedDates.length === 0) {
      return "invalid";
    }

    parsedDates = parsedDates.sort((a, b) => {
      return moment(a.trim()).isBefore(b.trim()) ? -1 : 1;
    });

    if (parsedDates.length === 1) {
      return parsedDates[0];
    }
    if (parsedDates.length > 1) {
      return parsedDates[1];
    }
  } catch (err) {
    console.log(err);
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
