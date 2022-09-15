const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const argv = yargs(hideBin(process.argv)).argv;
const { logInWithRefreshToken } = require("./firebase");
const { updateDoc } = require("firebase/firestore");
const db = require("./db");

const init = async () => {
  const { submissionId, accountId, token, apiKey } = argv;
  console.log(argv);

  if (!token) {
    console.error("No token provided");
    return;
  }
  if (!apiKey) {
    console.error("No apiKey provided");
    return;
  }

  global.user = await logInWithRefreshToken(token, apiKey);
  global.accountId = accountId;
  global.submissionId = submissionId;

  // Set the submission status
  updateSubmissionStatus("In Progress");
};

const updateSubmissionStatus = async (status) => {
  console.log(
    `Updating submission status to ${status} [id: ${global.submissionId}]`
  );
  return updateDoc(db.submission(global.submissionId), { status });
};

module.exports = {
  init,
  updateSubmissionStatus,
};
