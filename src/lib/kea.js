// Test firebase auth
const { login, database } = require("./src/lib/firebase");
// const db = require("./src/lib/db");
// const { getDoc } = require("firebase/firestore");
const { ref } = require("firebase/database");
const { database } = require("./firebase");
const { set } = require("lodash");

const init = async () => {
  await login();
};

module.exports = {
  init,
};
