const axios = require("axios");
const { initializeApp } = require("firebase/app");
const { getFunctions } = require("firebase/functions");
const { getAuth, signInWithCustomToken } = require("firebase/auth");
const { getFirestore, initializeFirestore } = require("firebase/firestore");
const { getStorage } = require("firebase/storage");
const { getDatabase } = require("firebase/database");
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
    console.log("Logging in...");
    const { data: tokenResult } = await axios.post(
      `https://securetoken.googleapis.com/v1/token?key=${apiKey}`,
      {
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }
    );
    const code = short.generate();
    const { data: authTokenResult } = await axios.get(
      `${config.functionURL}/https-createAuthToken?ot-auth-code=${code}&id-token=${tokenResult.access_token}`
    );

    const userCredential = await signInWithCustomToken(
      auth,
      authTokenResult.token
    );
    console.log(`AUTH: logged in with ${userCredential.user.email}`);
    return userCredential.user;
  } catch (e) {
    console.error(`Error: ${e.message}`);
  }
  return null;
};

module.exports = {
  config,
  auth,
  firestore,
  database,
  storage,
  functions,
  logInWithRefreshToken,
};
