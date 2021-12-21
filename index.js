const { send: sendBau } = require("./src/bau");
const { send: sendWtu } = require("./src/wtu");
const { send: sendGma } = require("./src/gma");
const { send: sendVst } = require("./src/vst");
const { send: sendEnj } = require("./src/enj");
const { send: sendTwf } = require("./src/twf");

const path = require("path");
const Cryptr = require("cryptr");
const fs = require("fs");
const extract = require("extract-zip");
const { homedir } = require("os");
const moment = require('moment');
const version = "0.1.1";
const budgie = require("./src/budgie");


async function main() {
  if (process.argv.includes("-v")) {
    console.log("version: " + version);
    process.exit(0);
  }

  if (process.argv.includes("budgie")) {
    const colonSeparatedKeys = process.argv.filter(arg => arg.includes(":"));
    if (colonSeparatedKeys && colonSeparatedKeys.length > 0){
      colonSeparatedKeys.forEach(colonSeparatedKey => {
        const [key, value] = colonSeparatedKey.split(':');
        budgie.save(key, value)
      }) 
    }
    budgie.print();
    process.exit(0);
  }

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
  console.log('\x1b[32m', `starting chrome ...`, "\x1b[0m");
  switch (data.system.name) {
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
    console.log('%cMyProject%cline:87%cfileName', 'color:#fff;background:#ee6f57;padding:3px;border-radius:2px', 'color:#fff;background:#1f3c88;padding:3px;border-radius:2px', 'color:#fff;background:rgb(17, 63, 61);padding:3px;border-radius:2px', fileName)
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
    console.log('\x1b[7m', `Success: ${fileName} => ${__dirname}/data.json`, "\x1b[0m");
  }

  if (!fs.existsSync(dataFileName)) {

    if (process.argv.includes("-d")) {
      fs.writeFileSync(dataFileName, JSON.stringify({
        system: {
          name: "wtu"
        }
      }))
      return dataFileName;

    }
    console.log(`Passenger file missing. I looked in ${dataFileName}\nuse -d to generate and use empty data.json.`);
    process.exit(1);
  }
  return dataFileName;
}

main();
