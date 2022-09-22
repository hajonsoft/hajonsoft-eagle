const fs = require("fs-extra");
const os = require("os");
const path = require("path");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const argv = yargs(hideBin(process.argv)).argv;
const { logInWithRefreshToken } = require("./firebase");
const {
  updateDoc,
  getDocs,
  where,
  getDoc,
  onSnapshot,
  setDoc,
} = require("firebase/firestore");
const db = require("./db");
const { toData } = require("./factory");
const { query } = require("firebase/database");
const { storage } = require("./firebase");
const short = require("short-uuid");
const sharp = require("sharp");
const { ref, uploadString, getDownloadURL } = require("firebase/storage");

function chunkArray(array, perChunk) {
  return array.reduce((accumulator, item, index) => {
    const chunkIndex = Math.floor(index / perChunk);

    if (!accumulator[chunkIndex]) {
      accumulator[chunkIndex] = []; // start a new chunk
    }

    accumulator[chunkIndex].push(item);

    return accumulator;
  }, []);
}

const init = async () => {
  const { submissionId, runId, token, apiKey, passengerIds } = argv;
  let newRun = {};

  if (!token) {
    throw new Error("No token provided");
  }
  if (!apiKey) {
    throw new Error("No apiKey provided");
  }
  if (!submissionId) {
    throw new Error("No submissionId provided");
  }
  if (passengerIds) {
    global.passengerIds = passengerIds.split(",");
  }

  global.user = await logInWithRefreshToken(token, apiKey);

  await getSubmission(submissionId);

  if (!runId) {
    // Create run
    console.log("No runId supplied, creating new run");
    newRun = await createRun(global.submission);
    console.log("Created run", newRun.id);
  }

  await watchRun(runId ?? newRun.id);
  await writeData();
};

const getSubmission = async (submissionId) => {
  const snap = await getDoc(db.submission(submissionId));
  const data = snap.data();
  if (!data) {
    throw new Error(`Submission not found [id: ${submissionId}]`);
  }
  global.submission = data;
  return data;
};

const createRun = async (submission) => {
  const id = short.generate();
  const ids = global.passengerIds ?? submission.passengerIds;
  const isWholeSubmission = ids.length === submission.passengerIds.length;

  const payload = {
    id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    label: `1 - ${ids.length} of ${ids.length} Pax`,
    attempts: 1,
    status: "Running",
    selectedTraveller: 0,
    submissionId: submission.id,
    submissionName: submission.name,
    accountId: submission.accountId,
    source: "Cli",
    passengerIds: isWholeSubmission ? undefined : ids,
    numPassengers: ids.length,
  };
  await setDoc(db.run(id), payload);
  return payload;
};

const watchRun = (runId) => {
  return new Promise((resolve, reject) => {
    console.log(`KEA: Watching run [id: ${runId}]`);
    return onSnapshot(db.run(runId), (snapshot) => {
      const data = snapshot.data();
      if (!data || data.status === "Killed") {
        console.log("Kill code received");
        // Run is marked as killed, so do not continue
        process.exit(2);
      }
      if (global.run) {
        // Log diff
        const diff = Object.keys(data)
          .filter((key) => data[key] !== global.run[key])
          .map((key) => `${key}: ${global.run[key]} -> ${data[key]}`);
        if (diff.length) {
          console.log("Run updated:", diff);
        }
      }
      global.run = data;
      resolve(data);
    });
  });
};

const fetchPassengers = async (passengerIds) => {
  const chunkSize = 10;
  const chunks = chunkArray(passengerIds, chunkSize);
  let data = [];
  for (const chunk of chunks) {
    /* eslint-disable no-await-in-loop */
    const results = await getDocs(
      query(db.passengers(), where("id", "in", chunk))
    );
    data = [...data, ...results.docs.map((doc) => doc.data())];
  }

  console.log(`KEA: Fetched ${data.length} passengers`);
  return data;
};

const getAccount = async (accountId) => {
  const snap = await getDoc(db.account(accountId));
  return snap.data();
};

// Get data and write to data.json
const writeData = async () => {
  const dataFilePath = path.join(os.tmpdir(), "hajonsoft-eagle", "data.json");
  // Generate specific passengers (if specified), or whole submission
  const passengers = await fetchPassengers(
    global.passengerIds ?? submission.passengerIds
  );
  const integration = submission.integration;
  const account = await getAccount(submission.accountId);

  // Write data.json file
  const jsonData = await toData(passengers, integration, account);
  fs.ensureFileSync(dataFilePath);
  fs.writeFileSync(dataFilePath, JSON.stringify(jsonData));
};

const updateSelectedTraveller = async (value) => {
  console.log(
    `KEA: Updating selectedTraveller to ${value} [id: ${global.run.id}]`
  );
  // optimistic update
  global.run.selectedTraveller = value;
  return updateDoc(db.run(global.run.id), {
    selectedTraveller: value,
  });
};

const updatePassenger = async (accountId, passportNumber, payload) => {
  const snaps = await getDocs(
    query(
      db.passengers(),
      where("accountId", "==", accountId),
      where("passportNumber", "==", passportNumber)
    )
  );
  const promises = [];
  snaps.docs.forEach(async (doc) => {
    console.log(`KEA: Updating passenger [id: ${doc.id}]`, { payload });
    promises.push(updateDoc(doc.ref, payload));
  });
  await Promise.all(promises);
};

const uploadImageToStorage = async (base64, destination) => {
  const imageRef = ref(storage, destination);
  const snapshot = await uploadString(imageRef, base64, "base64");
  return await getDownloadURL(snapshot.ref);
};

module.exports = {
  init,
  updateSelectedTraveller,
  uploadImageToStorage,
  updatePassenger,
};
