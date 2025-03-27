const SELECTORS = {
  login: {
    username:
      "#login > app-login > div.log-card.ng-star-inserted > form > div > div.col-sm-12.form-mb > g-input-text > div > input",
    password:
      "#login > app-login > div.log-card.ng-star-inserted > form > div > div.col-sm-12.mb-2 > p-password > div > input",
  },
  loginOtp: {
    firstDigit:
      "#login > app-login > div.login-otp.ng-star-inserted > g-otp-built-in-component > form > div:nth-child(3) > ng-otp-input > div > input.otp-input.ng-pristine.ng-valid.ng-star-inserted.ng-touched",
    label:
      "#login > app-login > div.login-otp.ng-star-inserted > g-otp-built-in-component > form > div:nth-child(1) > p",
    h1: "#login > app-login > div.login-otp.ng-star-inserted > g-otp-built-in-component > form > div:nth-child(1) > h3",
  },
  dataEntry: {
    automaticScan:
      "#content > div > app-applicant-add > app-data-entry-method > div > app-main-card > div > div.body.collapse.show > div.choices-container.justify-content-start > div:nth-child(2) > label > div > p-radiobutton > div > div.p-radiobutton-box",
    manualEntry:
      "#content > div > app-applicant-add > app-data-entry-method > div > app-main-card > div > div.body.collapse.show > div.choices-container.justify-content-start > div:nth-child(1) > label > div > p-radiobutton > div > div.p-radiobutton-box",
  },
};

module.exports = {
  SELECTORS,
};
