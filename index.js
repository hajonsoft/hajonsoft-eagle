const { send: sendEhj } = require("./src/ehj");
const { send: sendBau } = require("./src/bau");
const { send: sendWtu } = require("./src/wtu");
const { send: sendGma } = require("./src/gma");
const { send: sendVst } = require("./src/vst");
const { send: sendEnj } = require("./src/enj");
const { send: sendTwf } = require("./src/twf");
const { send: sendHsf } = require("./src/hsf");
const { send: sendSbr } = require("./src/sbr");

const path = require("path");
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

async function main() {
  if (process.argv.includes("-v")) {
    console.log("version: " + version);
    process.exit(0);
  }

  const selectedTravellerFile = "./selectedTraveller.txt";
  if (fs.existsSync(selectedTravellerFile)) {
    fs.unlinkSync(selectedTravellerFile);
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
  console.log("\x1b[32m", `starting chrome ...`, "\x1b[0m");
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

  inquirer
    .prompt({
      type: "input",
      message: `do you want to override api_Key:${api_key}? new api_key: [Enter for default]:`,
      name: "api_key",
    })
    .then(async (answers) => {
      console.log(answers.api_key);
      if (answers.api_key) {
        api_key = answers.api_key;
        fs.writeFileSync("./api_key", answers.api_key);
      } else {
        if (!api_key) {
          // double check in case api_key is undefiend to this stage - force HAJonSoft api_key
          api_key = defaultSMSAPIKeyMustOverride;
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
          inquirer
            .prompt([
              {
                type: "list",
                message: `Existing activation ${activation}?`,
                name: "activationAction",
                choices: [`1- cancel`, `2- code sent`, `3- status`],
              },
            ])
            .then(async (answers) => {
              const activationId = activation.split(":")[1];
              if (answers.activationAction) {
                if (answers.activationAction.startsWith("1-")) {
                  const cancelInquiry = await axios.get(
                    `https://api.sms-activate.org/stubs/handler_api.php?api_key=${api_key}&action=setStatus&status=8&id=${activationId}`
                  );
                  if (cancelInquiry.status === 200) {
                    console.log(balance, cancelInquiry.data);
                    return fs.unlinkSync("./activation");
                  }
                }
                if (answers.activationAction.startsWith("2-")) {
                  const codeInquiry = await axios.get(
                    `https://api.sms-activate.org/stubs/handler_api.php?api_key=${api_key}&action=setStatus&status=1&id=${activationId}`
                  );
                  if (codeInquiry.status === 200) {
                    console.log(balance, codeInquiry.data);
                  }
                }
                if (answers.activationAction.startsWith("3-")) {
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
            });
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
          inquirer
            .prompt([
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
            ])
            .then(async (answers) => {
              console.log(answers.country);
              country = answers.country.split(":")[0] | "0"; // russia by default
              return fs.writeFileSync(
                "./country",
                answers.country.split(":")[0]
              );
            });
        }

        const numberInquiry = await axios.get(
          `https://api.sms-activate.org/stubs/handler_api.php?api_key=${api_key}&action=getNumber&service=ot&country=${country}&freePrice=true&maxPrice=1`
        );
        if (numberInquiry.status === 200) {
          console.log(numberInquiry.data);
          fs.writeFileSync("./activation", numberInquiry.data);
        }
      }
    });
}

async function runScanDocument() {
  console.log("scan document in scan/input");
  if (!fs.existsSync("./scan/input")) {
    return console.log("folder not found: scan/input");
  }
  if (!fs.existsSync("./scan/auth/key.json")) {
    return console.log("file not found: scan/auth/key.json");
  }
  const images = fs.readdirSync("./scan/input");
  const imagesToProcess = images.filter((image) => image.toLowerCase().endsWith(".jpg"));
  for (const img of imagesToProcess) {
    console.log("processing", img);
    // google vision api
    const vision = require("@google-cloud/vision");
    const client = new vision.ImageAnnotatorClient({
      keyFilename: "./scan/auth/key.json",
    });
    client
      .textDetection(__dirname + `/scan/input/${img}`)
      .then((results) => {
        const labels = results[0].textAnnotations.filter(
          (ann) => ann.description.length > 20
        );
        console.log("Labels:");
        labels.forEach((label) => {
          // find MRZ and write it to CODELINE.txt
          // find egyptianId number and write it to nn-ID.txt
          // find issue date and write it to nn-ISSUEDT.txt
          // find profession and write it to nn-profession.txt
          // find issue place/ office and write it to nn-issueplace.txt
          // find arabic name and write it to nn-arabic-name.txt
          // etc ..
          
          console.log(label.description)});
      })
      .catch((err) => {
        console.error("ERROR:", err);
      });
  }
}

function runInteractive() {
  let currentSlug = "";
  if (fs.existsSync("./data.json")) {
    const data = JSON.parse(fs.readFileSync("./data.json", "utf-8"));
    if (data) {
      currentSlug = data?.travellers?.[0]?.slug;
    } else {
      currentSlug = "unknwon Slug";
    }
  } else {
    currentSlug: "NO data.json found - No Slug";
  }

  inquirer
    .prompt([
      {
        name: "action",
        message: "What advanced eagle tricks you want to do NOW?",
        type: "list",
        choices: [
          `1- Run eagle default file ${currentSlug}`,
          "2- Run Budgie display",
          "3- Update Budgie... [will prompt]",
          "4- Set download folder. [CURRENT-FOLDER]",
          "5- Get SMS number",
          "6- ML Kit image to text (scan image)",
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
        return console.log("not implmeneted, try node . budgie=KEY:VALUE");
      }
      if (answers.action.startsWith("5-")) {
        return runGetSMSNumber();
      }
      if (answers.action.startsWith("6-")) {
        return runScanDocument();
      }
      if (answers.action.startsWith("0-")) {
        process.exit(0);
      }
    });
}

main();
