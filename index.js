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
const {
  send: sendVsn,
  createCodelineFile,
  createImagePhoto,
  createImageVis,
  createEagleJson,
} = require("./src/vsn");

const path = require("path");
const mrz = require("mrz");
const Cryptr = require("cryptr");
const fs = require("fs");
const axios = require("axios");
const extract = require("extract-zip");
const { homedir } = require("os");
const moment = require("moment");
const version = "0.1.1";
const budgie = require("./src/budgie");
const inquirer = require("inquirer");
const defaultSMSAPIKeyMustOverride = "88fd2e1A3f4d327740A9408c12872A39";

let data = readDataFile();
async function main() {
  if (process.argv.includes("-v")) {
    console.log("version: " + version);
    process.exit(0);
  }

  // const selectedTravellerFile = "./selectedTraveller.txt";
  // if (fs.existsSync(selectedTravellerFile)) {
  //   fs.unlinkSync(selectedTravellerFile);
  // }

  const addModeFile = "./add.json";
  if (fs.existsSync(addModeFile)) {
    fs.unlinkSync(addModeFile);
  }

  const loopFile = "./loop.txt";
  if (fs.existsSync(loopFile)) {
    fs.unlinkSync(loopFile);
  }

  if (process.argv.includes("-i")) {
    return runInteractive();
  }

  if (process.argv.includes("-download")) {
    await getDataFileName();
    await downloadImages();
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

async function submitToProvider() {
  const dataFileName = await getDataFileName();
  const content = fs.readFileSync(dataFileName, "utf8");
  const data = JSON.parse(content);
  if (data?.info?.munazim) {
    const cryptr = new Cryptr(data?.info?.munazim);
    if (data.system.username && data.system.username.length > 30) {
      data.system.username = cryptr.decrypt(data.system.username);
      // console.log(data.system.username);
    }
    if (data.system.password && data.system.password.length > 30) {
      data.system.password = cryptr.decrypt(data.system.password);
      // console.log(data.system.password);
    }
  }
  console.log("\x1b[32m", `starting process ...`, "\x1b[0m");

  switch (data.system.name) {
    case "ehj":
      return sendEhj(data);
    case "bau":
      return sendBau(data);
    case "wtu":
      return sendWtu(data);
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
    case "vsn":
      return sendVsn(data);
    default:
      console.log("unknown system");
  }
}

async function unzipFile(source) {
  try {
    await extract(source, { dir: __dirname });
  } catch (err) {
    console.log(err);
  }
}

async function getDataFileName() {
  const fileParam = process.argv.find((arg) =>
    arg.toLowerCase().startsWith("file")
  );

  let dataFileName = path.join(__dirname, "data.json");

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
    if (!fileParam.includes("/")) {
      //Only file name was provided: Assume default download folder
      fileName = path.join(homedir(), "Downloads", fileName);
      console.log("FILE NAME: ", fileName);
    }
    if (!fs.existsSync(fileName)) {
      console.log(`File not found ${fileName}`);
      process.exit(1);
    }

    await unzipFile(fileName);
    console.log(
      "\x1b[7m",
      `Success: ${fileName} => ${__dirname}/data.json`,
      "\x1b[0m"
    );
  }

  if (!fs.existsSync(dataFileName)) {
    if (process.argv.includes("-d")) {
      fs.writeFileSync(
        dataFileName,
        JSON.stringify({
          system: {
            name: "wtu",
          },
        })
      );
      return dataFileName;
    }
    console.log(
      `Passenger file missing. I looked in ${dataFileName}\nuse -d to generate and use empty data.json.`
    );
    process.exit(1);
  }
  return dataFileName;
}

async function runGetSMSNumber() {
  let api_key = "";
  if (fs.existsSync("./api_key")) {
    api_key = fs.readFileSync("./api_key", "utf-8");
  } else {
    api_key = defaultSMSAPIKeyMustOverride;
  }

  const incomingApiKey = await inquirer.prompt({
    type: "input",
    message: `do you want to override api_Key:${api_key}? new api_key: [Enter for default]:`,
    name: "api_key",
  });

  if (incomingApiKey.api_key && incomingApiKey.api_key.length > 0) {
    api_key = incomingApiKey.api_key;
    fs.writeFileSync("./api_key", incomingApiKey.api_key);
  }

  let balance = "";
  const balanceInquiry = await axios.get(
    `https://api.sms-activate.org/stubs/handler_api.php?api_key=${api_key}&action=getBalance`
  );
  if (balanceInquiry.status === 200) {
    balance = balanceInquiry.data;
    console.log(balanceInquiry.data);
  }
  let activation = "";
  if (fs.existsSync("./activation")) {
    activation = fs.readFileSync("./activation", "utf-8");
  }
  if (activation) {
    const activationInquiry = axios.get(
      `https://api.sms-activate.org/stubs/handler_api.php?api_key=${api_key}&action=getStatus&id=${activation}`
    );
    if (activationInquiry.status === 200) {
      console.log(activationInquiry.data);
    }
  }
  if (activation) {
    if (activation === "NO_NUMBERS") {
      fs.unlinkSync("./activation");
      return console.log(balance, activation);
    }
    console.log(
      `existing activation ${activation} must be used first, can not request new number`
    );
    const incomingActivationChoice = await inquirer.prompt([
      {
        type: "list",
        message: `Existing activation ${activation}?`,
        name: "activationAction",
        choices: [`1- cancel`, `2- code sent`, `3- status`],
      },
    ]);
    const activationId = activation.split(":")[1];
    if (incomingActivationChoice.activationAction) {
      if (incomingActivationChoice.activationAction.startsWith("1-")) {
        const cancelInquiry = await axios.get(
          `https://api.sms-activate.org/stubs/handler_api.php?api_key=${api_key}&action=setStatus&status=8&id=${activationId}`
        );
        if (cancelInquiry.status === 200) {
          console.log(balance, cancelInquiry.data);
          return fs.unlinkSync("./activation");
        }
      }
      if (incomingActivationChoice.activationAction.startsWith("2-")) {
        const codeInquiry = await axios.get(
          `https://api.sms-activate.org/stubs/handler_api.php?api_key=${api_key}&action=setStatus&status=1&id=${activationId}`
        );
        if (codeInquiry.status === 200) {
          console.log(balance, codeInquiry.data);
        }
      }
      if (incomingActivationChoice.activationAction.startsWith("3-")) {
        const activationId = activation.split(":")[1];
        const statusInquiry = await axios.get(
          `https://api.sms-activate.org/stubs/handler_api.php?api_key=${api_key}&action=getStatus&id=${activationId}`
        );
        if (statusInquiry.status === 200) {
          console.log(statusInquiry.data);
          if (statusInquiry.data.startsWith("STATUS_OK")) {
            // Mark activation complete
            const completeInquiry = await axios.get(
              `https://api.sms-activate.org/stubs/handler_api.php?api_key=${api_key}&action=setStatus&status=6&id=${activationId}`
            );
            if (completeInquiry.status === 200) {
              console.log(balance, completeInquiry.data);
              return fs.unlinkSync("./activation");
            }
          }
        }
      }
    }
    return;
  }
  let country = "";
  if (fs.existsSync("./country")) {
    country = fs.readFileSync("./country", "utf-8");
  }
  const countriesInquiry = await axios.get(
    `https://api.sms-activate.org/stubs/handler_api.php?api_key=${api_key}&action=getCountries`
  );
  if (countriesInquiry.status === 200) {
    const incomingCountry = await inquirer.prompt([
      {
        type: "list",
        name: "country",
        message: `change country: ${country}`,
        choices: [
          `${country}`,
          ...Object.values(countriesInquiry.data)
            .filter((country) => country.visible)
            .map((country) => `${country.id}:${country.eng}`),
        ],
      },
    ]);
    console.log(incomingCountry.country);
    country = incomingCountry.country.split(":")[0] | "2"; // kazakhestan by default
    fs.writeFileSync("./country", incomingCountry.country.split(":")[0]);
  }

  const numberInquiry = await axios.get(
    `https://api.sms-activate.org/stubs/handler_api.php?api_key=${api_key}&action=getNumber&service=dp&country=${country}&freePrice=true&maxPrice=1`
  );
  if (numberInquiry.status === 200) {
    console.log(numberInquiry.data);
    fs.writeFileSync("./activation", numberInquiry.data);
  }
}

const visionFolder = path.join(__dirname, "scan", "output", "vision");
const inputFolder = path.join(__dirname, "scan", "input");
const folder3M = path.join(__dirname, "scan", "output", "3M");
const logFolder = path.join(__dirname, "scan", "output", "log");

function createSandBox() {
  if (!fs.existsSync(folder3M)) {
    fs.mkdirSync(folder3M, { recursive: true });
  }
  if (!fs.existsSync(logFolder)) {
    fs.mkdirSync(logFolder, { recursive: true });
  }
}

async function generateFour3MFiles(file, json) {
  const uniqueNumber = moment().valueOf();
  const isProcessed = fs.existsSync(
    path.join(logFolder, file.replace(".jpg", ""))
  );
  if (isProcessed) {
    return true;
  }

  const isCodelineDone = await createCodelineFile(
    folder3M,
    json,
    uniqueNumber,
    path.join(inputFolder, file.replace(".json", ""))
  );
  if (!isCodelineDone) {
    console.warn("codeline failed");
    return false;
  }

  const isPhotoDone = await createImagePhoto(
    path.join(visionFolder, file.replace(".json", ".jpg")),
    path.join(inputFolder, file.replace(".json", "")),
    folder3M,
    uniqueNumber
  );
  if (!isPhotoDone) {
    console.warn("photo failed");
    return false;
  }

  const isImageVisDone = createImageVis(
    path.join(inputFolder, file.replace(".json", "")),
    folder3M,
    uniqueNumber
  );
  if (!isImageVisDone) {
    console.warn(
      "image vis not done because passport image is not found. Ok for testing"
    );
    return false;
  }

  const isJSONDone = createEagleJson(folder3M, json, uniqueNumber);
  if (!isJSONDone) {
    console.warn("json failed");
    return false;
  }

  fs.writeFileSync(path.join(logFolder, file.replace(".jpg", "")), "hajonsoft");
  // TODO: Write to firebase
  const config = {
    headers: { Authorization: `Bearer ${data.info.accessToken}` },
  };
  const url = `${data.info.databaseURL}/customer/${data.info.caravan}-data/.json`;
  const mrzData = mrz.parse(`P<DZABEN<KHADA<<FATIHA<<<<<<<<<<<<<<<<<<<<<<
  1663192019DZA7502064F2602084X158<<<<<<<<52`);
  const body = {
    name: mrzData.firstName + " " + mrzData.lastName,
    passPlaceOfIssue: mrzData.issuingState,
    passportNumber: mrzData.documentNumber,
    nationality: mrzData.nationality, //TODO: Translate to humming bird
    birthDate: mrzData.dateOfBirth, //TODO: //format YYYY-MM-DD
    gender: mrzData.sex, //Translate
    passExpireDt: mrzData.dateOfExpiry, //translate
    passIssueDt: "2020-01-01", //Read from json
  };
  try {
    await axios.post(url, body, config);
  } catch (err) {
    console.log(err.message);
  }

  return true;
}

async function create3MFiles() {
  const incomingContinue = await inquirer.prompt([
    {
      type: "list",
      name: "mode",
      choices: ["1- Continue previous run?", "2- Start from beginning?"],
      message: "continue previous 3M files?",
    },
  ]);

  if (incomingContinue.mode.startsWith("2-")) {
    // cleanup log folder and 3M folder
    if (fs.existsSync(logFolder)) {
      fs.readdirSync(logFolder).forEach((file) => {
        fs.unlinkSync(path.join(logFolder, file));
      });
    }

    if (fs.existsSync(folder3M)) {
      fs.readdirSync(folder3M).forEach((file) => {
        fs.unlinkSync(path.join(folder3M, file));
      });
    }
  }

  const files = fs.readdirSync(visionFolder);
  createSandBox();
  for (const file of files) {
    if (!file.endsWith(".json")) {
      continue;
    }
    const raw = fs.readFileSync(path.join(visionFolder, file), "utf-8");
    const json = JSON.parse(raw);
    const isDone = await generateFour3MFiles(file, json);
  }
  console.log(`open "${folder3M}"`);
}

async function downloadImages() {
  const data = readDataFile();
  for (const passenger of data.travellers) {
    for (const [imageType, url] of Object.entries(passenger?.images)) {
      if (
        url.includes(".placeholder.com") ||
        imageType.includes("vaccine") ||
        imageType.includes("id")
      )
        continue;
      const image = await axios.get(url, {
        responseType: "arraybuffer",
      });
      const fileName = path.join(
        inputFolder,
        imageType,
        `${passenger.name.full}.jpg`
      );
      if (!fs.existsSync(path.join(inputFolder, imageType))) {
        fs.mkdirSync(path.join(inputFolder, imageType), { recursive: true });
      }
      fs.writeFileSync(fileName, Buffer.from(image.data, "binary"));
      console.log(fileName);
    }
  }
}

function readDataFile() {
  if (fs.existsSync("./data.json")) {
    return JSON.parse(fs.readFileSync("./data.json", "utf-8"));
  }
  console.error("NO data.json found");
}

function runInteractive() {
  readDataFile();
  let currentSlug = data?.travellers?.[0]?.slug || "unknown Slug";

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
          "4- Set download folder. [CURRENT-FOLDER]",
          "5- Get SMS number",
          `6- Vision to 3M ${visionFolder}`,
          "0- Exit",
        ],
      },
    ])
    .then((answers) => {
      if (answers.action.startsWith("1-")) {
        return submitToProvider();
      }

      if (answers.action.startsWith("2-")) {
        return printBudgie();
      }
      if (answers.action.startsWith("3-")) {
        return console.log("not implemented, try node . budgie=KEY:VALUE");
      }
      if (answers.action.startsWith("5-")) {
        return runGetSMSNumber();
      }
      if (answers.action.startsWith("6-")) {
        return create3MFiles();
      }
      if (answers.action.startsWith("0-")) {
        process.exit(0);
      }
    });
}

main();
