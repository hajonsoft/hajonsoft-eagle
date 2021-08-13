const { send: sendBau } = require("./src/bau");
const { send: sendWtu } = require("./src/wtu");
const { send: sendGma } = require("./src/gma");
const { send: sendVst } = require("./src/vst");

const path = require("path");
const fs = require("fs");
const extract = require("extract-zip");

async function main() {
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
  if (fileParam) {
    let fileName = fileParam.substring(5);
    if (!fileName.endsWith(".zip")) {
      fileName = fileName + ".zip";
    }
    fileName = path.join("/users/ay9984588/Downloads", fileName); // TODO detect the download folder automatically and make sure the path in argv is not absolute
    if (!fs.existsSync(fileName)) {
      console.log(`File not found ${fileName}`);
      process.exit(1);
    }

    await unzipFile(fileName);
    console.log(fileName);
  }

  let dataFileName = path.join(__dirname, "data.json");
  if (!fs.existsSync(dataFileName)) {
    console.log(`Passenger file missing, I looked for ${dataFileName}`);
    process.exit(1);
  }
  return dataFileName;
}

main();
