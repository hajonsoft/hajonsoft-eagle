const { send: sendBau } = require("./src/bau");
const { send: sendWtu } = require("./src/wtu");
const { send: sendGma } = require("./src/gma");
const { send: sendVst } = require("./src/vst");

const path = require("path");
const fs = require("fs");
var inflater = require("unzipper");
const downloadsFolder = require("downloads-folder");

if (process.argv.length > 2) {
  const eagleParameters = process.argv[2];
  const eagleParametersParts = eagleParameters.split("/");
  if (eagleParametersParts) {
    let fileName = eagleParametersParts.find((x) => x.toLowerCase().endsWith(".zip"));
    fileName = path.join(downloadsFolder(), fileName);
    console.log('%c 🌭 fileName: ', 'font-size:20px;background-color: #4b4b4b;color:#fff;', fileName);
    fs.createReadStream(fileName).pipe(inflater.Extract({ path: __dirname }));
  }
} else {
  console.log("no file name found in eagle parameters url. I will continue to data.json");
}

let dataFileName = path.join(__dirname, "data.json");
if (!fs.existsSync(dataFileName)) {
  console.log(`Data file does not exist in ${dataFileName}`);
  process.exit(1);
}
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
