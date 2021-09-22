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
  const oldValue = db[key];
  db[key] = value;
  fs.writeFileSync(dbFile, JSON.stringify(db));
  console.log(`Budgie ===> KEY ==> ${key}: {oldValue: ${oldValue}, newValue: ${value}}`);
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
    try {
      const db = fs.readFileSync(dbFile, "utf-8");
      if (db) {
        return JSON.parse(db)[key];
      }
    } catch (err) {
      console.log(err)
    }
  }
}

module.exports = {
  get,
  save,
};
