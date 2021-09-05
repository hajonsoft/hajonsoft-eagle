const fs = require("fs");
const path = require("path");

const dbFile = path.join(__dirname, "budgie.json");
function get(key) {
  if (!key) {
    return ""; //TODO AA: Budgie should always return something
  }
  const data = readKey(key);
  if (data) {
    return data;
  }
  return "";
}

async function sniff(page, selector, key) {
  await page.waitForSelector(selector);
  let value = await page.$eval(selector, (el) => el.value || el.innerText);
  console.log(
    "%c 🥓 value: ",
    "font-size:20px;background-color: #F5CE50;color:#fff;",
    value
  );
  if (value) {
    save(key, value);
  }
}

function save(key, value) {
  let db = read();
  if (!db) {
    db = {};
  }
  db[key] = value; //TODO AA: Make this an array with useCount
  fs.writeFileSync(dbFile, JSON.stringify(db));
}

function read() {
  if (fs.existsSync(dbFile)) {
    const db = fs.readFileSync(dbFile, "utf-8");
    console.log(
      "%c 🦐 db: ",
      "font-size:20px;background-color: #6EC1C2;color:#fff;",
      db
    );
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
  sniff,
};
