const { doc, collection } = require("firebase/firestore");
const { firestore } = require("./firebase");

const converter = () => ({
  toFirestore: (data) => {
    const values = {
      ...data,
    };
    if (values.createdAt === undefined) {
      values.createdAt = new Date().toISOString();
    }
    values.updatedAt = new Date().toISOString();
    return values;
  },
  fromFirestore(snapshot, options) {
    const data = snapshot.data(options);
    return {
      ...data,
    };
  },
});

const getTypedCollection = (parts) =>
  collection(firestore, parts.join("/")).withConverter(converter());

const getTypedDoc = (parts) =>
  doc(firestore, parts.join("/")).withConverter(converter());

const db = {
  // Users
  users: () => getTypedCollection(["users"]),
  user: (id) => getTypedDoc(["users", id]),
  // Accounts
  accounts: () => getTypedCollection(["accounts"]),
  account: (id) => getTypedDoc(["accounts", id]),
  // Packages
  packages: () => getTypedCollection(["packages"]),
  package: (id) => getTypedDoc(["packages", id]),
  // Groups
  groups: () => getTypedCollection(["groups"]),
  group: (id) => getTypedDoc(["groups", id]),
  // Passengers
  passengers: () => getTypedCollection(["passengers"]),
  passenger: (id) => getTypedDoc(["passengers", id]),
  // Visa Submissions
  submissions: () => getTypedCollection(["submissions"]),
  submission: (id) => getTypedDoc(["submissions", id]),
  submissionRuns: (submissionId) =>
    getTypedCollection(["submissions", submissionId, "runs"]),
  submissionRun: (submissionId, runId) =>
    getTypedDoc(["submissions", submissionId, "runs", runId]),
  submissionRunLogs: (submissionId, runId) =>
    getTypedCollection([
      'submissions',
      submissionId,
      'runs',
      runId,
      'logs'
    ]),
  submissionRunLog: (submissionId, runId, logId) =>
    getTypedDoc([
      'submissions',
      submissionId,
      'runs',
      runId,
      'logs',
      logId
    ]),
  // Reports
  reportTemplates: () => getTypedCollection(["reportTemplates"]),
  reportTemplate: (id) => getTypedDoc(["reportTemplates", id]),
  // Target system integrations
  integrations: () => getTypedCollection(["integrations"]),
  integration: (id) => getTypedDoc(["integrations", id]),
  // Logs
  visionLogs: () => getTypedCollection(["visionLogs"]),
  visionLog: (id) => getTypedDoc(["visionLogs", id]),
};

module.exports = db;
