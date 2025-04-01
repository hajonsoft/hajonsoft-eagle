const { SELECTORS } = require("./selectors.js");
const {
  fillInputs,
  fillOtp,
  showController,
  fillIdAndResidence,
  fillBasicData,
  reviewApplication,
  fillQuestions,
} = require("./actions.js");

const baseAddress = "https://masar.nusuk.sa";

const CONFIG = {
  pages: {
    home: {
      url: baseAddress,
    },
    login: {
      url: `${baseAddress}/pub/login`,
      inputs: [
        {
          selector: SELECTORS.login.username,
          value: (row) => row.username,
        },
        {
          selector: SELECTORS.login.password,
          value: (row) => row.password,
        },
      ],
      requiredSelectors: [SELECTORS.login.username, SELECTORS.login.password],
      action: (page, data, pageToObserve) =>
        fillInputs(page, data, pageToObserve),
    },
    loginOtp: {
      url: `${baseAddress}/pub/login`,
      requiredSelectors: [
        SELECTORS.loginOtp.firstDigit,
        SELECTORS.loginOtp.label,
        SELECTORS.loginOtp.h1,
      ],
      action: (page, data, pageToObserve) => fillOtp(page, data, pageToObserve),
    },
    dataEntry: {
      url: `${baseAddress}/protected-applicant-st/add/data-entry-method`,
      requiredSelectors: [
        SELECTORS.dataEntry.automaticScan,
        SELECTORS.dataEntry.manualEntry,
      ],
      action: (page, data, pageToObserve) =>
        showController(page, data, pageToObserve),
    },
    identityAndResidence: {
      url: `${baseAddress}/protected-applicant-st/add/Identity-and-residence`,
      requiredSelectors: [
        SELECTORS.identityAndResidence.hajjType,
        SELECTORS.identityAndResidence.embassy,
      ],
      inputs: [
        {
          selector: SELECTORS.identityAndResidence.placeOfIssue,
          value: (row) => row.placeOfIssue,
        },
      ],
      action: (page, data, pageToObserve) =>
        fillIdAndResidence(page, data, pageToObserve),
    },
    confirmScan: {
      url: `${baseAddress}/protected-applicant-st/add/data-entry-method`,
      requiredSelectors: [SELECTORS.confirmScan.confirmScanButton],
      action: async (page, data, pageToObserve) => {
        // TODO: Make sure it is visible and click it
      },
    },
    basicData: {
      url: `${baseAddress}/protected-applicant-st/add/basic-data`,
      requiredSelectors: [
        SELECTORS.basicData.fatherName,
        SELECTORS.basicData.email,
      ],
      inputs: [
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
      action: async (page, data, pageToObserve) => {
        fillBasicData(page, data, pageToObserve);
      },
    },
    additionalData: {
      url: `${baseAddress}/protected-applicant-st/add/additinal-data`,
      requiredSelectors: [
        SELECTORS.additionalData.notEmployed,
        SELECTORS.additionalData.expectedLength,
      ],
      inputs: [
        {
          selector: SELECTORS.additionalData.flightNumber,
          value: (row) => "SV25",
        },
        {
          selector: SELECTORS.additionalData.expectedLength,
          value: (row) => "20",
        },
      ],
      action: (page, data, pageToObserve) => {
        fillInputs(page, data, pageToObserve);
      },
    },
    questions: {
      url: `${baseAddress}/protected-applicant-st/add/questions`,
      requiredSelectors: [
        SELECTORS.questions.otherNationalitiesYes,
        SELECTORS.questions.haveYouTraveled,
      ],
      action: (page, data, pageToObserve) => {
        fillQuestions(page, data, pageToObserve);
      },
    },
    reviewApplication: {
      url: `${baseAddress}/protected-applicant-st/add/review-application`,
      requiredSelectors: [
        SELECTORS.reviewApplication.pledgeShowVaccine,
        SELECTORS.reviewApplication.pledgeShowVaccine,
      ],
      action: async (page, data, pageToObserve) => {
        reviewApplication(page, data, pageToObserve);
      },
    },
  },
};

module.exports = {
  CONFIG,
  baseAddress,
};
