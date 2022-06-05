const fs = require("fs");
const path = require("path");
const util = require("./util");
const moment = require("moment");
const sharp = require("sharp");
const vision = require("@google-cloud/vision");
const inquirer = require("inquirer");
const _ = require("lodash");

let data;
let scanInputFolder;
let visionResultFolder;
const visionKeyFilePath = path.join(__dirname, "..", "scan/auth/key.json");
const logFolder = path.join(__dirname, "scan", "output", "log");

function createSandbox() {
  scanInputFolder = path.join(__dirname, "..", "scan", "input");
  if (!fs.existsSync(scanInputFolder)) {
    fs.mkdirSync(scanInputFolder, { recursive: true });
  } else {
    fs.readdirSync(scanInputFolder).forEach((file) => {
      fs.unlinkSync(path.join(scanInputFolder, file));
    });
  }

  visionResultFolder = path.join(__dirname, "..", "scan", "output", "vision");
  if (!fs.existsSync(visionResultFolder)) {
    fs.mkdirSync(visionResultFolder, { recursive: true });
  }
  if (!fs.existsSync(logFolder)) {
    fs.mkdirSync(logFolder, { recursive: true });
  }

  if (!fs.existsSync(visionKeyFilePath)) {
    throw new Error("vision key file not found");
  }
}

async function send(sendData) {
  data = sendData;
  createSandbox();

  const client = new vision.ImageAnnotatorClient({
    keyFilename: visionKeyFilePath,
  });

  for (let i = 0; i < data?.travellers?.length; i++) {
    const traveler = data.travellers[i];
    if (traveler.images.passport.includes("placeholder")) {
      console.warn(traveler.slug, "no passport");
      continue;
    }
    const passportImagePath = await downloadPassportImage(traveler);

    await runGoogleVision(passportImagePath, traveler, client);

    console.log(
      "processing passenger => ",
      i + 1,
      " of ",
      data.travellers.length
    );
  }
}

async function runGoogleVision(downloadPath, traveler, client) {
  // face detection
  const [result] = await client.faceDetection(downloadPath);
  const faces = result.faceAnnotations;
  const photoPath = path.join(
    visionResultFolder,
    traveler.nationality.name + "-" + traveler.passportNumber + ".jpg"
  );
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
      .toFile(photoPath);
  } else {
    console.warn(traveler.slug, "no face detected");
  }

  // text detection
  const detectionResult = await client.textDetection(downloadPath);
  const textPath = path.join(
    visionResultFolder,
    traveler.nationality.name + "-" + traveler.passportNumber + ".json"
  );
  fs.writeFileSync(textPath, JSON.stringify(detectionResult, null, 2));
  return {
    photoPath,
    textPath,
  };
}

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

async function downloadPassportImage(traveler) {
  const passportUrl = traveler.images.passport;
  const downloadPath = path.join(
    scanInputFolder,
    traveler.nationality.name + "-" + traveler.passportNumber.toString()
  );
  const isDownloaded = fs.existsSync(downloadPath);
  if (!isDownloaded) {
    await util.downloadImage(passportUrl, downloadPath);
  }
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
    // Detect all possible date formats here
    labels.forEach((label) => {
      const match = label.description.match(
        /([0-9]{2,4}[/\.-][0-9]{2}[/\.-][0-9]{2,4})|([0-3][0-9] [A-Z][a-z]{2} 2[0-9]{3})/g
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
      } else if (dt.includes(" ") && /[A-Za-z]/.test(dt)) {
        //24 Jul 2018
        const date = moment(dt, "DD MMM YYYY");
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

async function createCodelineFile(
  folder3M,
  dataArray,
  uniqueNumber,
  passportImagePath
) {
  const data = dataArray[0];
  let labelsWithPosition = [];
  data.textAnnotations.forEach((text) => {
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

  // check that mrz1 and mrz 2 conforms to the format mrz1 regex and mrz2 regex
  if (
    sortedLabels[0].text.length === 44 &&
    sortedLabels[1].text.length === 44
  ) {
    const mrz1Valid = await validateOrAskMrz1(
      sortedLabels[1].text,
      passportImagePath
    );
    const mrz2Valid = await validateOrAskMrz2(
      sortedLabels[0].text,
      passportImagePath
    );
    writeCodeLineSync(mrz1Valid, mrz2Valid, folder3M, uniqueNumber);
    return true;
  }
  // request help from the user, display lines from the array and ask the user what is it
  // or show the user mrz2 suggestions then mrz 1 suggestions
  // When the user confirms done, then pad with < for 44 chars
  let suggested = sortedLabels
    .map((l) => l.text.replace(/[^A-Z0-9<]/g, ""))
    .filter((a) => a && a.length > 5)
    .slice(0, 9);
  // get MRZ1 from the first label
  label0Mrz1(data, suggested);

  let mrz1;
  ({ mrz1, suggested } = await chooseMrz1(suggested, passportImagePath, labelsWithPosition.map(x=> x.text)));

  label0Mrz2(data, suggested);
  let mrz2;
  ({ mrz2, suggested } = await chooseMrz2(suggested, passportImagePath));
  writeCodeLineSync(mrz1, mrz2, folder3M, uniqueNumber);
  console.log(
    "-".repeat(88) +
      "\n" +
      `open -a Preview.app "${passportImagePath}"` +
      "\n" +
      "-".repeat(88) +
      "\n" +
      mrz1 +
      "\n" +
      mrz2 +
      "\n" +
      "*".repeat(44)
  );
  return true;
}

function label0Mrz1(data, suggested) {
  const firstLabel = data.textAnnotations[0].description;
  firstLabel.split("\n").forEach((line) => {
    const clean = line.replace(/\s/g, '');
    if (/P[A-Z0-9<][A-Z]{3}<*?[A-Z]{1,15}<[A-Z]{1,15}</.test(clean)) {
      suggested.push(clean);
    }
  });
}

function label0Mrz2(data, suggested) {
  const firstLabel = data.textAnnotations[0].description;
  firstLabel.split("\n").forEach((line) => {
    const clean = line.replace(/[^A-Z0-9<]/, '');
    if (/^[A-Z0-9<]{9}[0-9][A-Z]{3}/.test(clean)) {
      suggested.push(clean);
    }
  });
}

async function chooseMrz2(suggested, passportImagePath) {
  const linesWith44 = suggested.filter((x) => x.length === 44);
  if (linesWith44.length === 1) {
    return { mrz2: linesWith44[0], suggested: [] };
  }
  suggested.push('-Edit-');

  const answersMrz2 = await inquirer.prompt([
    {
      type: "list",
      message: `open -a Preview.app "${passportImagePath}"\nChoose best line for MRZ2 [${"2".repeat(
        10
      )}]`,
      name: "mrz2",
      choices: suggested,
    },
  ]);
  let mrz2 = answersMrz2.mrz2;
  if (mrz2 === '-Edit-') {
    const answersMrz2Edit = await inquirer.prompt([
      {
        type: "input",
        message: "Enter MRZ2",
        name: "mrz2",
      },
    ]);
    mrz2 = answersMrz2Edit.mrz2;
  }
  suggested = suggested.filter((s) => s != mrz2);
  suggested.push("<");

  if (mrz2.length < 44) {
    // ask the user for the remaining part or provide option to pad with <
    const mrz2Part2 = await inquirer.prompt([
      {
        type: "list",
        message: `Choose remaining line for MRZ2 [${"2".repeat(
          10
        )}] ${mrz2} => ${mrz2.length}`,
        name: "mrz2",
        choices: suggested,
      },
    ]);
    if (mrz2Part2.mrz2 === "<") {
      mrz2 = mrz2.padEnd(44, "<");
      suggested = suggested.filter((s) => s != "<");
    }

    mrz2 = mrz2 + mrz2Part2.mrz2;
    if (mrz2.length < 44) {
      mrz2 = mrz2.padEnd(44, "<");
    } else {
      mrz2 = mrz2.substring(0, 44);
    }
  } else {
    mrz2 = mrz2.substring(0, 44);
  }
  return { mrz2, suggested };
}

async function validateOrAskMrz1(text, imagePath) {
  // Validate MRZ 1 using this RegEx ([A-Z])([A-Z0-9<])([A-Z]{3})([A-Z<]{39})
  // If it does not conform to this RegEx, then ask the user to type the MRZ1, provide imagePath for reference
  const isValid = /^([A-Z])([A-Z0-9<])([A-Z]{3})([A-Z<]{39})$/.test(text);
  if (isValid) {
    return text;
  }
  // If valid but short in characters while ends with <<< it is safe to append <
  if (
    text.length < 44 &&
    text.endsWith("<<<") &&
    /^([A-Z])([A-Z0-9<])([A-Z]{3})([A-Z<]{1,39})$/.test(text)
  ) {
    return text.padEnd(44, "<");
  }

  const answersMrz1 = await inquirer.prompt([
    {
      type: "input",
      message: `open -a Preview.app "${imagePath}"\nMRZ1 ${text} (${text.length}) is not valid, Enter MRZ1."`,
      name: "mrz1",
      validate: (input) => {
        if (/^([A-Z])([A-Z0-9<])([A-Z]{3})([A-Z<]{39})$/.test(input)) {
          return true;
        }
        if (input.endsWith("<<<")) {
          return true;
        }
        return `MRZ1 ${input.length} must be 44 characters in the format [A-Z]{1}[A-Z0-9<]{1}[A-Z]{3}[A-Z<]{39}`;
      },
    },
  ]);
  return answersMrz1.mrz1.padEnd(44, "<<");
}

async function validateOrAskMrz2(text, imagePath) {
  // Validate MRZ 2 using this RegEx ([A-Z0-9<]{9})([0-9])([A-Z]{3})([0-9]{6})([0-9])([MF<])([0-9]{6})([0-9])([A-Z0-9<]{14})([0-9])([0-9])
  // If it does not conform to this RegEx, then ask the user to type the MRZ2, provide imagePath for reference
  const isValid =
    /^([A-Z0-9<]{9})([0-9])([A-Z]{3})([0-9]{6})([0-9])([MF<])([0-9]{6})([0-9])([A-Z0-9<]{14})([0-9])([0-9])$/.test(
      text
    );
  if (isValid) {
    return text;
  }

  const answersMrz2 = await inquirer.prompt([
    {
      type: "input",
      message: ` open -a Preview.app "${imagePath}"\nMRZ2 ${text} is not valid, Enter MRZ2"`,
      name: "mrz2",
      validate: (input) => {
        if (
          /^([A-Z0-9<]{9})([0-9])([A-Z]{3})([0-9]{6})([0-9])([MF<])([0-9]{6})([0-9])([A-Z0-9<]{14})([0-9])([0-9])$/.test(
            input
          )
        ) {
          return true;
        }
        return "MRZ2 must be 44 characters long and confirm to the format ([A-Z0-9<]{9})([0-9])([A-Z]{3})([0-9]{6})([0-9])([MF<])([0-9]{6})([0-9])([A-Z0-9<]{14})([0-9])([0-9])";
      },
    },
  ]);
  return answersMrz2.mrz2;
}

async function chooseMrz1(suggested, passportImagePath, allLabels) {
  // Check if you can capture it without asking the user
  let suggestedMrz1 = suggested
    .filter((entry) =>
      /^([A-Z])([A-Z0-9<])([A-Z]{3})([A-Z<]{1,39})$/.test(entry)
    )
    .sort((a, b) => {
      if (a.length > b.length) {
        return -1;
      }

      return 1;
    });
  if (
    (suggestedMrz1.length === 1 &&
      (suggestedMrz1[0].length === 44 || suggestedMrz1[0].endsWith("<<<"))) ||
    suggestedMrz1[0].length === 44
  ) {
    let confirmedMrz1 = await validateOrAskMrz1(
      suggestedMrz1[0],
      passportImagePath
    );
    return {
      mrz1: confirmedMrz1,
      suggested: suggested.filter((x) => x != suggestedMrz1[0]),
    };
  }
  suggestedMrz1.push('-Edit-')
  suggestedMrz1 = [...suggestedMrz1, ...allLabels]
  // Ask the user for help and provide suggestions
  const answers = await inquirer.prompt([
    {
      type: "list",
      message: `open -a Preview.app "${passportImagePath}"\nChoose best line for MRZ1 [${"1".repeat(
        10
      )}] `,
      name: "mrz1",
      choices: suggestedMrz1,
    },
  ]);
  let mrz1 = answers.mrz1;
  if (mrz1 === '-Edit-') {
    const answersMrz1Edit = await inquirer.prompt([
      {
        type: "input",
        message: "Enter MRZ1",
        name: "mrz1",
      },
    ]);
    mrz1 = answersMrz1Edit.mrz1;
  }
  suggested = suggested.filter((s) => s != mrz1);
  if (mrz1.length < 44 && mrz1.endsWith("<<<")) {
    mrz1 = await validateOrAskMrz1(mrz1, passportImagePath);
    return { mrz1, suggested };
  }
  // ask the user for the remaining part, MRZ1 does not have numbers
  const suggestedMrz1Remainder = suggested.filter((x) => !/[0-9]/.test(x));
  const mrz1Part2 = await inquirer.prompt([
    {
      type: "list",
      message: `Choose remaining line for MRZ1 [${"1".repeat(
        10
      )}]. ${mrz1} => ${mrz1.length}`,
      name: "mrz1",
      choices: suggestedMrz1Remainder,
    },
  ]);
  mrz1 = await validateOrAskMrz1(mrz1 + mrz1Part2.mrz1, passportImagePath);
  return { mrz1, suggested };
}

function writeCodeLineSync(mrz1, mrz2, folder3M, uniqueNumber) {
  const mrz = mrz1 + "\n" + mrz2;
  fs.writeFileSync(
    path.join(folder3M, uniqueNumber + "-" + "CODELINE.txt"),
    mrz
  );
}

function createImagePhoto(photoFile, passportFile, folder3M, uniqueNumber) {
  try {
    if (fs.existsSync(photoFile)) {
      fs.copyFileSync(photoFile, `${folder3M}/${uniqueNumber}-IMAGEPHOTO.jpg`);
    } else {
      fs.copyFileSync(
        passportFile,
        `${folder3M}/${uniqueNumber}-IMAGEPHOTO.jpg`
      );
    }
  } catch (err) {
    console.error(err);
    return false;
  }
  return true;
}

function createImageVis(file, folder3M, uniqueNumber) {
  try {
    if (!fs.existsSync(file)) {
      return false;
    }
    fs.copyFileSync(file, `${folder3M}/${uniqueNumber}-IMAGEVIS.jpg`);
  } catch (err) {
    console.error(err);
    return false;
  }
  return true;
}

function createEagleJson(folder3M, json, uniqueNumber) {
  const labels = json[0].textAnnotations;
  const issueDate = getIssueDate(labels);
  console.log("issueDate", issueDate);
  const eagleData = {
    comments: labels.map((l) => l.description),
    passIssueDt: issueDate,
    passIssuePlace: "unknown",
    arabicName: "unknown",
    egyptianId: "unknown",
    birthPlace: "unknown",
    profession: "unknown",
  };
  fs.writeFileSync(
    path.join(folder3M, uniqueNumber + "-" + "EAGLE.json"),
    JSON.stringify(eagleData)
  );
  return true;
}

module.exports = {
  send,
  createCodelineFile,
  createImagePhoto,
  createImageVis,
  createEagleJson,
};
