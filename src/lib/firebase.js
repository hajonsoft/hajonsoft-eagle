const axios = require("axios");
const { initializeApp } = require("firebase/app");
const { getFunctions } = require("firebase/functions");
const { getAuth, signInWithCustomToken } = require("firebase/auth");
const { getFirestore, initializeFirestore } = require("firebase/firestore");
const { getStorage } = require("firebase/storage");
const { getDatabase, ref, onValue } = require("firebase/database");
const short = require("short-uuid");

const config = {
  apiKey: process.env.VITE_FIREBASE_APIKEY,
  authDomain: process.env.VITE_FIREBASE_AUTHDOMAIN,
  databaseURL: process.env.VITE_FIREBASE_DATABASEURL,
  projectId: process.env.VITE_FIREBASE_PROJECTID,
  storageBucket: process.env.VITE_FIREBASE_STORAGEBUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGINGSENDERID,
  appId: process.env.VITE_FIREBASE_APPID,
  functionURL: process.env.VITE_FIREBASE_FUNCTIONSURL,
};

console.log("firebase config", config);

const app = initializeApp(config);
const auth = getAuth(app);

initializeFirestore(app, {
  ignoreUndefinedProperties: true,
});
const firestore = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);
const database = getDatabase(app);

const logInWithRefreshToken = async (refreshToken, apiKey) => {
  // https://stackoverflow.com/questions/38233687/how-to-use-the-firebase-refreshtoken-to-reauthenticate
  // Get api key from here: https://console.cloud.google.com/customer-identity/providers?authuser=1&project=hajonsoft-kea
  try {
    console.log("AUTH: getting access token");
    const { data: tokenResult } = await axios.post(
      `https://securetoken.googleapis.com/v1/token?key=${apiKey}`,
      {
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }
    );
    console.log("AUTH: getting auth token");
    const code = short.generate();
    const { data: authTokenResult } = await axios.get(
      `${config.functionURL}/https-createAuthToken?ot-auth-code=${code}&id-token=${tokenResult.access_token}`
    );

    console.log("AUTH: logging in");
    const userCredential = await signInWithCustomToken(
      auth,
      authTokenResult.token
    );
    return userCredential.user;
  } catch (e) {
    console.error(`Error: ${e.message}`);
  }
  return null;
};

const login = async () => {
  const tokenArg = process.argv.find((arg) => arg.startsWith("token="));

  const apiKeyArg = process.argv.find((arg) => arg.startsWith("apiKey="));
  let refreshToken = tokenArg ? tokenArg.substring(6) : null;
  let apiKey = apiKeyArg ? apiKeyArg.substring(7) : null;

  if (!refreshToken) {
    console.error("No token provided");
    return;
  }
  if (!apiKey) {
    console.error("No apiKey provided");
    return;
  }

  global.user = await logInWithRefreshToken(refreshToken, apiKey);
  console.log(`AUTH: logged in with ${global.user.email}`);
  return global.user;
};

module.exports = {
  config,
  auth,
  firestore,
  database,
  storage,
  functions,
  login,
};
