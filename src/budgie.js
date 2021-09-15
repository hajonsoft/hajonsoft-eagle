const fs = require("fs");
const path = require("path");

const dbFile = path.join(__dirname, "budgie.json");
function get(key, defaultValue) {
  if (!key) {
    return "unknown key"; 
  }
  const data = readKey(key);
  if (data) {
    return data;
  }
  if (defaultValue || defaultValue === ""){
    return defaultValue;
  }
  return key;
}

function save(key, value) {
  let db = read();
  if (!db) {
    db = {};
  }
  db[key] = value; //TODO AA: Make this an array with useCount
  fs.writeFileSync(dbFile, JSON.stringify(db));
  console.log("Budgie+: ", key, value);
}

function read() {
  if (fs.existsSync(dbFile)) {
    const db = fs.readFileSync(dbFile, "utf-8");
    if (db) {
      return JSON.parse(db);
    }
  }
}

function readKey(key) {
  if (fs.existsSync(dbFile)) {
    const db = fs.readFileSync(dbFile, "utf-8");
    if (db) {
      return JSON.parse(db)[key];
    }
  }
}

module.exports = {
  get,
  save,
};
