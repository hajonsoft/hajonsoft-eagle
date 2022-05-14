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
    const traveler = data.travellers[i];
    if (traveler.images.passport.includes('placeholder')) {
      continue;
    }
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
    const extractedData = await eagleExtract(
      detectedTextResultPath,
      passportImgPath,
      detectedFaceResultPath
    );

    const message = extractedData.mrz && !extractedData.mrz.startsWith("P<XXX") ? `Success => ${extractedData.mrz.replace(/\n/,'')}` : "error";
    console.log(
      "processing passenger => ",
      i + 1,
      " of ",
      data.travellers.length,
      message
    );
  }
}

module.exports = { send };

async function eagleExtract(
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
      return extract;
    } catch (err) {
      console.log(err);
    }
  }
  return {};
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
    fs.copyFile(downloadPath, detectedFaceResultPath, (err) => {
      if (err) {
        return console.log(err);
      }
    });
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
    ...getMRZ(annotations[0]),
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

function getLabel0Mrz(label0) {
  let workText = label0;
  let indexOfP = workText.indexOf("\nP");
  try {
    while (indexOfP > -1) {
      const testMrz = workText
        .substring(indexOfP)
        .replace(/[^A-Z0-9<]/, "")
        .substring(0, 88);
      if (testMrz.includes("<")) {
        const goodMrz = testMrz.replace(/[^A-Z0-9<]/, "");
        const goodMrzLines = goodMrz.split("\n");
        let mrz1;
        let mrz2;
        if (goodMrzLines.length > 0) {
          mrz1 = goodMrzLines[0].replace(/\s/, "").padEnd(44, "<");
        }
        if (goodMrzLines.length > 1) {
          mrz2 = goodMrzLines[1].replace(/\s/, "").padEnd(44, "<");
          return mrz1 + "\n" + mrz2;
        }
        return goodMrz;
      } else {
        workText = workText.substring(indexOfP + 4);
        indexOfP = workText.indexOf("\nP");
      }
    }
  } catch {}
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

function getMRZ(json) {
  let labelsWithPosition = [];
  json.textAnnotations.forEach((text) => {
    const bottomLeft = text.boundingPoly.vertices[0];
    const topLeft = text.boundingPoly.vertices[1];
    const topRight = text.boundingPoly.vertices[2];
    const midPointX = (topRight.x - topLeft.x) / 2 + topLeft.x;
    const midPointY = (bottomLeft.y - topLeft.y) / 2 + topLeft.y;
    labelsWithPosition.push({
      text: text.description,
      point: {
        x: midPointX,
        y: midPointY,
      },
      length: text.description.length,
    });
  });

  const sortedLabels = labelsWithPosition.sort((a, b) => {
    if (a.point.y < b.point.y && a.point.x < b.point.x) {
      return 1;
    } else {
      return -1;
    }
  });

  if (sortedLabels[0].text === 44 && sortedLabels[1].text === 44) {
    return {mrz: sortedLabels[0].text + "\n" + sortedLabels[1].text}
  }

  // Sort and take lines only until you get to P<
  const mrzLines = [];
  let line = "";
  for (const label of sortedLabels) {
    if (/^P[A-Z<]{1}[A-Z]{3}.*<.*/.test(label.text)) {
      line = label.text.replace(/[^A-Z0-9<]/, "") + line;
      mrzLines.push(line.padEnd(44, "<"));
      break;
    }
    if (line.length + label.text.length <= 44) {
      line = label.text.replace(/[^A-Z0-9<]/, "") + line;
    } else {
      mrzLines.push(line);
      line = label.text.replace(/[^A-Z0-9<]/, "");
    }
  }
  const oneLine = mrzLines.join("");
  const output = oneLine.substring(0, 44) + "\n" + oneLine.substring(44);
  return {mrz: output};
}

