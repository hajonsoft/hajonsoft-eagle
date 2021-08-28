const { send: sendBau } = require("./src/bau");
const { send: sendWtu } = require("./src/wtu");
const { send: sendGma } = require("./src/gma");
const { send: sendVst } = require("./src/vst");

const path = require("path");
const fs = require("fs");
const extract = require("extract-zip");
const { homedir } = require("os");
const version = "0.1.0";

async function main() {
  if (process.argv.includes("-v")) {
    console.log("version: " + version);
    process.exit(0);
  }
  const dataFileName = await getDataFileName();
  const content = fs.readFileSync(dataFileName, "utf8");
  const data = JSON.parse(content);

  switch (data.system.name) {
    case "bau":
      return sendBau(data);
    case "wtu":
      return sendWtu(data);
    case "gma":
      return sendGma(data);
    case "twf":
      return sendBau(data);
    case "mot":
      return sendBau(data);
    case "vst":
      return sendVst(data);
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
    if (!fs.existsSync(dataFileName)) {
      try {
        await fs.rename(dataFileName , path.join(__dirname,`data_${moment().format("DDHHmmss")}.json`));
      } catch (err) {
        console.log("unable to rename ", dataFileName, err);
        process.exit(1);
      }
    }
    console.log("unziping ...... to ", __dirname, "/data.json");
    await unzipFile(fileName);
    console.log(fileName);
  }

  if (!fs.existsSync(dataFileName)) {
    console.log(`Passenger file missing, I looked for ${dataFileName}`);
    process.exit(1);
  }
  return dataFileName;
}

main();
