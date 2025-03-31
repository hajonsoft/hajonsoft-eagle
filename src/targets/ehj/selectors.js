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
    startScanButton:
      "#content > div > app-applicant-add > app-data-entry-method > div > app-main-card.ng-star-inserted > div > div.body.collapse.show > div > div > div.col-md-8 > div.passport-upload.mb-4.ng-star-inserted > button",
    passportPhotoButton:
      "#content > div > app-applicant-add > app-data-entry-method > div > app-main-card.ng-star-inserted > div > div.body.collapse.show > div > div > div.col-md-8 > div > button",
    passportPhotoInput:
      "#content > div > app-applicant-add > app-data-entry-method > div > app-main-card.ng-star-inserted > div > div.body.collapse.show > div > div > div.col-md-8 > input",
  },
  identityAndResidence: {
    hajjType:
      "#content > div > app-applicant-add > app-identity-and-residence > form > app-main-card > div > div.body.collapse.show > div > div > div:nth-child(1) > label > div > p-radiobutton > div > div.p-radiobutton-box",
    embassy:
      "#content > div > app-applicant-add > app-identity-and-residence > form > div:nth-child(1) > div > app-main-card > div > div.body.collapse.show > div > div:nth-child(2) > g-dropdown > p-dropdown",
    PassIssueDate:
      "#content > div > app-applicant-add > app-identity-and-residence > form > div:nth-child(2) > div > app-main-card > div > div.body.collapse.show > div > div:nth-child(3) > g-calendar > label",
    placeOfIssue:
      "#content > div > app-applicant-add > app-identity-and-residence > form > div:nth-child(2) > div > app-main-card > div > div.body.collapse.show > div > div:nth-child(5) > g-input-text > div > input",
  },
};

module.exports = {
  SELECTORS,
};
