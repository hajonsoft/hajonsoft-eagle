const os = require("os");
const path = require("path");
const fs = require("fs");


function getPath(filename) {
  const isCloudRun = Boolean(process.argv.find((c) => c.startsWith("-cloud")));
  switch (filename) {
    case "data.json":
      let dataFileName = path.join(getTmpDir(), "data.json");
      // Fallback to current working dir (used by eagle cloud)
      if (isCloudRun) {
        dataFileName = path.join(__dirname, "..", "data.json");
      }
      return dataFileName;
    default:
      return path.join(getTmpDir(), filename);
  }
}

function getTmpDir() {
  const passengerIds = process.argv.find((c) => c.startsWith("--passengerIds"));
  let scope = "";
  if (passengerIds) {
    scope = passengerIds.split("=")[1].split(",")[0];
  }
  const tmpDir = path.join(os.tmpdir(), "hajonsoft-eagle", scope);
  // console.log("TMP DIR: " + tmpDir);
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  return tmpDir;
}

module.exports = { getPath, getTmpDir };
