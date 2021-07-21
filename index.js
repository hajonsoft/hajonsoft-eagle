const { send: sendBau } = require("./src/bau");
const { send: sendWtu } = require("./src/wtu");
const { send: sendGma } = require("./src/gma");
const { send: sendVst } = require("./src/vst");

const path = require("path");
const fs = require("fs");

let dataFileName = path.join(__dirname, "data.json");
if (!fs.existsSync(dataFileName)) {
  console.log(`Traveller file missing, I looked for ${dataFileName}`);
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
