const { SELECTORS } = require("./selectors.js");
const {
  feedPlant,
  secure,
  showController,
  whereDoYouLive,
  tellMeAboutYourSelf,
  recheck,
  answerQuestions,
  showApplicantListCommander
} = require("./actions.js");

const baseAddress = "https://masar.nusuk.sa";
let soil;
let will;

const knowledge = {
  plants: {
    landscape: {
      url: baseAddress,
      allowOnce: true,
      visualHeadLessForwardTo: `${baseAddress}/pub/login`,
    },
    protect: {
      url: `${baseAddress}/pub/login`,
      allowOnce: true,
      slots: [
        {
          selector: SELECTORS.login.username,
          value: (row) => row.username,
        },
        {
          selector: SELECTORS.login.password,
          value: (row) => row.password,
        },
      ],
      needs: [SELECTORS.login.username, SELECTORS.login.password],
      action: (e) =>
        feedPlant(e),
    },
    challenge: {
      url: `${baseAddress}/pub/login`,
      allowOnce: true,
      needs: [
        SELECTORS.loginOtp.firstDigit,
        SELECTORS.loginOtp.label,
        SELECTORS.loginOtp.h1,
      ],
      action: (e) => secure(e),
    },
    welcome: {
      url: `${baseAddress}/protected/hm/dashboard/requestsDashboard`, 
      // should skip in automation
    },
    hello: {
      url: `${baseAddress}/protected-applicant-st/add/data-entry-method`,
      needs: [
        SELECTORS.dataEntry.automaticScan,
        SELECTORS.dataEntry.manualEntry,
      ],
      action: (e) =>
        showController(e),
    },
    gettingToKnow: {
      url: `${baseAddress}/protected-applicant-st/add/Identity-and-residence`,
      needs: [
        SELECTORS.identityAndResidence.placeOfIssue,
        SELECTORS.identityAndResidence.embassy,
      ],
      slots: [
        {
          selector: SELECTORS.identityAndResidence.placeOfIssue,
          value: (row) => row.placeOfIssue,
        },
      ],
      action: (e) =>
        whereDoYouLive(e),
    },
    moreGettingToKnow: {
      url: `${baseAddress}/protected-applicant-st/add/basic-data`,
      needs: [
        SELECTORS.basicData.fatherName,
        SELECTORS.basicData.email,
      ],
      slots: [
        {
          selector: SELECTORS.basicData.email,
          value: (row) => row.email,
        },
        {
          selector: SELECTORS.basicData.placeOfBirth,
          value: (row) => row.birthPlace,
        },
        {
          selector: SELECTORS.basicData.residentialAddress,
          value: (row) => row.birthPlace,
        },
        {
          selector: SELECTORS.basicData.phoneNumber,
          value: (row) => "9495221000",
        },
        {
          selector: SELECTORS.basicData.zipCode,
          value: (row) => "12345",
        },
        {
          selector: SELECTORS.basicData.mailBox,
          value: (row) => "12345",
        },
      ],
      action: (e) => {
        tellMeAboutYourSelf(e);
      },
    },
    moreAndMoreGettingToKnowYou: {
      url: `${baseAddress}/protected-applicant-st/add/additinal-data`,
      needs: [
        SELECTORS.additionalData.notEmployed,
        SELECTORS.additionalData.expectedLength,
      ],
      slots: [
        {
          selector: SELECTORS.additionalData.flightNumber,
          value: (row) => "SV25",
        },
        {
          selector: SELECTORS.additionalData.expectedLength,
          value: (row) => "20",
        },
      ],
      action: (e) => {
        feedPlant(e);
      },
    },
    lastQuestions: {
      url: `${baseAddress}/protected-applicant-st/add/Questionnaire`,
      needs: [
        SELECTORS.questions.otherNationalitiesYes,
        SELECTORS.questions.haveYouTraveled,
      ],
      action: (e) => {
        answerQuestions(e);
      },
    },
    almostDone: {
      url: `${baseAddress}/protected-applicant-st/add/Review-application`,
      needs: [
        SELECTORS.reviewApplication.pledgeShowVaccine,
        SELECTORS.reviewApplication.pledgeShowVaccine,
      ],
      action:  (e) => {
        recheck(e);
      },
    },
    whoIsSent: {
      url: `${baseAddress}/protected/applicants-groups/applicants/list`,
      needs: [
        SELECTORS.applicantList.title,
      ],
      action: (e) => {
        showApplicantListCommander(e);
      },
    },
  },
  begin: (garden) => {
    soil = garden.soil;
    will = garden.will;
  },
};

module.exports = {
  knowledge,
  baseAddress,
};
