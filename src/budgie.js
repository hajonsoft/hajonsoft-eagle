const fs = require("fs");
const path = require("path");
const { getPath } = require("./util");

const dbFile = getPath("budgie.json");

function print() {
  const data = readKey();
  console.log("Budgie: ", data);
}

function get(key, defaultValue) {
  if (!key) {
    return defaultValue || "unknown key";
  }
  const data = readKey(key);
  if (data) {
    return data;
  }
  save(key, (defaultValue ?? "").toString());
  return (defaultValue || key).toString();
}

function save(key, value) {
  let db = read();
  if (!db) {
    db = {};
  }
  const oldValue = db[key];
  db[key] = value;
  fs.writeFileSync(dbFile, JSON.stringify(db));
  console.log(
    `Budgie ===> KEY ==> ${key}: {oldValue: ${oldValue}, newValue: ${value}}`
  );
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
        if (key) {
          return JSON.parse(db)[key];
        }
        return JSON.parse(db);
      }
    } catch (err) {
      console.log(err);
    }
  }
}

module.exports = {
  get,
  save,
  print,
};
