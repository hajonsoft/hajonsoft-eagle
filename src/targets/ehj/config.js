const { SELECTORS } = require("./selectors.js");
const {
  fillInputs,
  fillOtp,
  showController,
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
      reload: true,
      action: (page, data, pageToObserve) =>
        showController(page, data, pageToObserve),
    },
  },
};

module.exports = {
  CONFIG,
  baseAddress,
};
