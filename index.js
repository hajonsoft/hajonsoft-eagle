#!/usr/bin/env node
require("dotenv").config();
const pjson = require("./package.json");
const { send: sendEhj } = require("./src/ehj");
const { send: sendBau } = require("./src/bau");
const { send: sendWtu } = require("./src/wtu");
const { send: sendGma } = require("./src/gma");
const { send: sendVst } = require("./src/vst");
const { send: sendEnj } = require("./src/enj");
const { send: sendTwf } = require("./src/twf");
const { send: sendHsf } = require("./src/hsf");
const { send: sendSbr } = require("./src/sbr");
const { send: sendMtf } = require("./src/mtf");
const { send: sendGhb } = require("./src/ghb");

const util = require("./src/util");
const { getPath } = util;
const path = require("path");
const Cryptr = require("cryptr");
const fs = require("fs");
const axios = require("axios");
const extract = require("extract-zip");
const { homedir } = require("os");
const moment = require("moment");
const budgie = require("./src/budgie");
const kea = require("./src/lib/kea");
const inquirer = require("inquirer");
const defaultSMSAPIKeyMustOverride = "88fd2e1A3f4d327740A9408c12872A39";

const version = pjson.version;

let userInput;
let data = readDataFile();

async function main() {
  console.log(`=== Eagle v${version} ===`);
  console.log(`https://hajonsoft-kea.web.app/admin/submissions/${process.argv.find(arg => arg.startsWith("--submissionId"))?.split("=")?.[1]}/edit`)
  // Authenticate firebase
  try {
    await kea.init();
  } catch (error) {
    console.error("Error: " + error);
  }

  if (process.argv.includes("-v")) {
    console.log("version: " + version);
    process.exit(0);
  }

  // Cleanups
  const addModeFile = getPath("add.json");
  if (fs.existsSync(addModeFile)) {
    fs.unlinkSync(addModeFile);
  }

  const loopFile = getPath("loop.txt");
  if (fs.existsSync(loopFile)) {
    fs.unlinkSync(loopFile);
  }

  if (process.argv.includes("-i")) {
    return runInteractive();
  }

  if (process.argv.includes("budgie")) {
    printBudgie();
  }

  return await submitToProvider();
}

function printBudgie() {
  const colonSeparatedKeys = process.argv.filter((arg) => arg.includes(":"));
  if (colonSeparatedKeys && colonSeparatedKeys.length > 0) {
    colonSeparatedKeys.forEach((colonSeparatedKey) => {
      const [key, value] = colonSeparatedKey.split(":");
      budgie.save(key, value);
    });
  }
  budgie.print();
  console.log(
    'To edit budgie entries, use the following syntax: node . budgie key:value example node . homeAddress:"123 main street"'
  );
  process.exit(0);
}

async function sendToCloud(data) {
  util.setSelectedTraveller(0);
  data.info.caravan = "CLOUD_" + data.info.caravan;
  data.info.range = process.argv
    .find((arg) => arg.toLowerCase().startsWith("range"))
    ?.substring(6)
    ?.replace(",", "-");
  data.info.stamp = moment().format("YYYY-MM-DD hh:mm:ss a");
  fs.writeFileSync(getPath("data.json"), JSON.stringify(data));
  const command = `git add . && git commit -m "${data.system?.country?.code} ${
    data.travellers?.length
  } Pax ${data.system?.name} ${data.system?.username}.0${moment().format(
    "mm"
  )} ${
    process.argv
      .find((arg) => arg.toLowerCase().startsWith("range"))
      ?.replace(",", "-") ?? ""
  }" && git push origin main:job --force`;
  const childProcess = require("child_process");

  childProcess.exec(command, function (error, stdout, stderr) {
    if (error) {
      console.log("Eagle Cloud Error: " + error.code);
    }
    if (stdout) {
      console.log("Eagle Cloud: " + stdout);
    }
    if (stderr) {
      console.log("Eagle cloud: " + stderr);
    }
  });
  // sendGhb(data);
}

async function submitToProvider() {
  const dataFileName = await getDataFileName();
  const content = fs.readFileSync(dataFileName, "utf8");
  const data = JSON.parse(content);
  if (!data.info.run) {
    data.info.run = 0;
  }
  data.info.run += 1;
  fs.writeFileSync(dataFileName, JSON.stringify(data, null, 2));
  // if (data?.info?.munazim) {
  //   const cryptr = new Cryptr(data?.info?.munazim);
  //   if (data.system.username && data.system.username.length > 30) {
  //     data.system.username = cryptr.decrypt(data.system.username);
  //     // console.log(data.system.username);
  //   }
  //   if (data.system.password && data.system.password.length > 30) {
  //     data.system.password = cryptr.decrypt(data.system.password);
  //     // console.log(data.system.password);
  //   }
  // }
  console.log(
    "\x1b[32m",
    `starting process ...[${data.system.name} ${
      data.travellers.length
    } PAX => ${util.getSelectedTraveler()}]`,
    "\x1b[0m"
  );
  const lastIndex = util.getSelectedTraveler();
  if (lastIndex >= data.travellers.length) {
    util.setSelectedTraveller(0);
  }

  if (process.argv.includes("-cloud") || process.argv.includes("-submit")) {
    return sendToCloud(data);
  }

  switch (data.system.name) {
    case "ehj":
      return sendEhj(data);
    case "bau":
      return sendBau(data);
    case "wtu":
      return sendWtu(data);
    case "ghb":
      return sendGhb(data);
    case "gma":
      return sendGma(data);
    case "twf":
      return sendTwf(data);
    // case "mot":
    //   return sendMot(data);
    case "vst":
      return sendVst(data);
    case "enj":
      return sendEnj(data);
    case "hsf":
      return sendHsf(data);
    case "sbr":
      return sendSbr(data);
    case "mtf":
      return sendMtf(data);
    default:
      console.log("unknown system");
  }
}

async function unzipFile(source, outputDir) {
  const dir = outputDir ?? __dirname;
  try {
    const files = fs.readFileSync(dir);
    for (const file of files.filter(
      (file) =>
        file.endsWith("_photo.jpg") ||
        file.endsWith("_mrz.jpg") ||
        file.endsWith("_passport.jpg")
    )) {
      fs.unlinkSync(path.join(dir, file));
    }
  } catch {}

  try {
    await extract(source, { dir: dir });
  } catch (err) {
    console.log(err);
  }
}

async function getDataFileName() {
  const fileParam = process.argv.find((arg) =>
    arg.toLowerCase().startsWith("file")
  );

  let dataFileName = getPath("data.json");

  if (fileParam) {
    let fileName = fileParam.substring(5);
    if (!fileName) {
      fileName = "bundle.zip";
    }
    if (/^[0-9]$/.test(fileName)) {
      fileName = "bundle (" + fileName + ").zip";
    }
    if (!fileName.endsWith(".zip")) {
      fileName = fileName + ".zip";
    }
    if (!fileParam.includes("/") && !fileParam.includes("\\")) {
      //Only file name was provided: Assume default download folder
      fileName = path.join(getDownloadFolder(), fileName);
      console.log("FILE NAME: ", fileName);
    }
    if (!fs.existsSync(fileName)) {
      console.log(`File not found ${fileName}`);
      process.exit(1);
    }

    const outputDir = dataFileName.replace("data.json", "");
    await unzipFile(fileName, outputDir);

    console.log(
      "\x1b[7m",
      `Success: ${fileName} => ${outputDir}/data.json`,
      "\x1b[0m"
    );
  }

  if (!fs.existsSync(dataFileName)) {
    if (fs.existsSync(path.join(__dirname, "./data.json"))) {
      fs.copyFileSync(path.join(__dirname, "./data.json"), dataFileName);
      return dataFileName;
    }

    console.log(`Passenger file missing. I looked in ${dataFileName}`);
    process.exit(1);
  }
  return dataFileName;
}

function readDataFile() {
  if (fs.existsSync(getPath("data.json"))) {
    return JSON.parse(fs.readFileSync(getPath("data.json"), "utf-8"));
  }
  if (fs.existsSync(path.join(__dirname, "data.json"))) {
    return JSON.parse(
      fs.readFileSync(path.join(__dirname, "data.json"), "utf-8")
    );
  }
  console.error("NO data.json found");
}

function runInteractive() {
  readDataFile();
  let currentSlug = data?.travellers?.[0]?.slug || "unknown Slug";
  setTimeout(() => {
    if (userInput) {
      return console.log("userInput", userInput);
    }
    process.exit(0);
  }, 15000);

  inquirer
    .prompt([
      {
        name: "action",
        message: "Advanced options!",
        type: "list",
        choices: [
          `1- Run eagle default file ${currentSlug}`,
          "2- Run Budgie display",
          "3- Update Budgie... [will prompt]",
          `4- Set download folder. [${getDownloadFolder()}]`,
          "5- Get SMS number",
          "0- Exit",
        ],
      },
    ])
    .then((answers) => {
      userInput = answers.action;
      if (answers.action.startsWith("1-")) {
        return submitToProvider();
      }

      if (answers.action.startsWith("2-")) {
        return printBudgie();
      }
      if (answers.action.startsWith("3-")) {
        return console.log("not implemented, try node . budgie=KEY:VALUE");
      }
      if (answers.action.startsWith("4-")) {
        inquirer
          .prompt({
            type: "input",
            message: `Download folder: ${getDownloadFolder()}`,
            name: "downloadFolder",
          })
          .then((answers) => {
            if (answers.downloadFolder) {
              fs.writeFileSync(
                getPath(".downloadFolder"),
                answers.downloadFolder
              );
            }
          });
        return;
      }
      if (answers.action.startsWith("5-")) {
        return runGetSMSNumber();
      }
      if (answers.action.startsWith("0-")) {
        process.exit(0);
      }
    });
}

function getDownloadFolder() {
  if (fs.existsSync(getPath(".downloadFolder"))) {
    return fs.readFileSync(getPath(".downloadFolder"), "utf-8");
  }
  return path.join(homedir(), "Downloads");
}

process.on("uncaughtException", function (error) {
  util.infoMessage(null, "uncaughtException: " + error);
  util.infoMessage(null, "exit error code 1");
  process.exit(1);
});

process.on("unhandledRejection", function (reason, p) {
  util.infoMessage(null, "unhandledRejection: " + reason);
});

main();
