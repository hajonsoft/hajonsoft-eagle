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
  confirmScan: {
    confirmScanButton:
      "#content > div > app-applicant-add > app-data-entry-method > p-dialog.p-element.ng-tns-c4042076560-71.ng-star-inserted > div > div > div.p-dialog-footer.ng-tns-c4042076560-71.ng-star-inserted > action-btns > div > div > button",
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
    firstEmbassyOption: "#dropDownId_list > p-dropdownitem:nth-child(1) > li",
    normalHajj: "#content > div > app-applicant-add > app-identity-and-residence > form > app-main-card > div > div.body.collapse.show > div > div > div:nth-child(1) > label > div",
    normalPassport:
      "#content > div > app-applicant-add > app-identity-and-residence > form > div:nth-child(2) > div > app-main-card > div > div.body.collapse.show > div > div:nth-child(2) > g-dropdown > p-dropdown > div",
    embassy:
      "#content > div > app-applicant-add > app-identity-and-residence > form > div:nth-child(1) > div > app-main-card > div > div.body.collapse.show > div > div:nth-child(2) > g-dropdown > p-dropdown",
    PassIssueDate:
      "#content > div > app-applicant-add > app-identity-and-residence > form > div:nth-child(2) > div > app-main-card > div > div.body.collapse.show > div > div:nth-child(3) > g-calendar > label",
    placeOfIssue:
      "#content > div > app-applicant-add > app-identity-and-residence > form > div:nth-child(2) > div > app-main-card > div > div.body.collapse.show > div > div:nth-child(5) > g-input-text > div > input",
    passIssueDataCalendarField:
      "body > div.ng-trigger.ng-trigger-overlayAnimation.ng-tns-c419082668-90.p-datepicker.p-component.ng-star-inserted > div.p-datepicker-buttonbar.ng-tns-c419082668-22.ng-star-inserted",
    passIssueDataCalendarYear: "body > div.ng-trigger.ng-trigger-overlayAnimation.ng-tns-c419082668-79.p-datepicker.p-component.ng-star-inserted > div.p-datepicker-group-container.ng-tns-c419082668-79.ng-star-inserted > div > div.p-datepicker-header.ng-tns-c419082668-79 > div > button.p-datepicker-year.p-link.ng-tns-c419082668-79.ng-star-inserted",
    passIssueDateCalendarYearsContainer: "body > div.ng-trigger.ng-trigger-overlayAnimation.ng-tns-c419082668-79.p-datepicker.p-component.ng-star-inserted > div.p-yearpicker.ng-tns-c419082668-79.ng-star-inserted",
    passIssueDateCalendarMonthsContainer: "body > div.ng-trigger.ng-trigger-overlayAnimation.ng-tns-c419082668-79.p-datepicker.p-component.ng-star-inserted > div.p-monthpicker.ng-tns-c419082668-79.ng-star-inserted",
    passIssueDateCalendarDaysContainer: "body > div.ng-trigger.ng-trigger-overlayAnimation.ng-tns-c419082668-79.p-datepicker.p-component.ng-star-inserted > div.p-datepicker-group-container.ng-tns-c419082668-79.ng-star-inserted > div > div.p-datepicker-calendar-container.ng-tns-c419082668-79.ng-star-inserted > table > tbody"

  },
  basicData: {
    fatherName:
      "#content > div > app-applicant-add > app-add-basic-data > form > div.row > div.col-md-12.col-sm-12 > app-main-card > div > div.body.collapse.show > div:nth-child(2) > div:nth-child(2) > g-input-text > div > input",
    email:
      "#content > div > app-applicant-add > app-add-basic-data > form > div.row > div:nth-child(2) > app-main-card > div > div.body.collapse.show > div > div.col-md-12 > div > div > g-input-text > div > input",
    placeOfBirth:
      "#content > div > app-applicant-add > app-add-basic-data > form > div.row > div.col-md-12.col-sm-12 > app-main-card > div > div.body.collapse.show > div:nth-child(2) > div:nth-child(8) > g-input-text > div > input",
    placeOfBirthLabel:
      "#content > div > app-applicant-add > app-add-basic-data > form > div.row > div.col-md-12.col-sm-12 > app-main-card > div > div.body.collapse.show > div:nth-child(2) > div:nth-child(8) > g-input-text > div > label",
    residentialAddress:
      "#content > div > app-applicant-add > app-add-basic-data > form > div.row > div.col-md-12.col-sm-12 > app-main-card > div > div.body.collapse.show > div:nth-child(2) > div:nth-child(6) > g-input-text > div > input",
    phoneNumber:
      "#content > div > app-applicant-add > app-add-basic-data > form > div.row > div:nth-child(2) > app-main-card > div > div.body.collapse.show > div > div:nth-child(2) > div > div.col-md-8 > g-input-text > div > input",
    zipCode:
      "#content > div > app-applicant-add > app-add-basic-data > form > div.row > div:nth-child(2) > app-main-card > div > div.body.collapse.show > div > div:nth-child(4) > g-input-text > div > input",
    mailBox:
      "#content > div > app-applicant-add > app-add-basic-data > form > div.row > div:nth-child(2) > app-main-card > div > div.body.collapse.show > div > div:nth-child(5) > g-input-text > div > input",
    photoInput:
      "#content > div > app-applicant-add > app-add-basic-data > form > div.row > div.col-md-12.col-sm-12 > app-main-card > div > div.body.collapse.show > div.row.mb-3 > div:nth-child(1) > g-attachment-upload > div.form-control.file-upload.enabled > div.upload-info-container > input",
  },
  additionalData: {
    notEmployed:
      "#content > div > app-applicant-add > app-additional-data > form > div:nth-child(1) > div > app-main-card > div > div.body.collapse.show > div > div.col-md-6.mt-3 > div > div:nth-child(1) > div > p-radiobutton > div > div.p-radiobutton-box.p-highlight",
    expectedLength:
      "#content > div > app-applicant-add > app-additional-data > form > div:nth-child(2) > div > app-main-card > div > div.body.collapse.show > div > div:nth-child(2) > g-input-text > div > input",
    flightNumber:
      "#content > div > app-applicant-add > app-additional-data > form > div:nth-child(2) > div > app-main-card > div > div.body.collapse.show > div > div:nth-child(3) > g-input-text > div > input",
  },
  questions: {
    otherNationalitiesYes:
      "#content > div > app-applicant-add > app-questionnaire > app-main-card > div > div.body.collapse.show > form > div > div:nth-child(1) > div > div > div > div > div > div:nth-child(2) > label > p-radiobutton > div > div.p-radiobutton-box",
    haveYouTraveled:
      "#content > div > app-applicant-add > app-questionnaire > app-main-card > div > div.body.collapse.show > form > div > div:nth-child(2) > div > div > div > div > div > div:nth-child(2) > label > p-radiobutton > div > div.p-radiobutton-box",
    rejectedVisa:
      "#content > div > app-applicant-add > app-questionnaire > app-main-card > div > div.body.collapse.show > form > div > div:nth-child(3) > div > div > div > div > div > div:nth-child(2) > label > p-radiobutton > div > div.p-radiobutton-box.p-highlight",
    everSaudiVisa:
      "#content > div > app-applicant-add > app-questionnaire > app-main-card > div > div.body.collapse.show > form > div > div:nth-child(4) > div > div > div > div > div > div:nth-child(2) > label > p-radiobutton > div > div.p-radiobutton-box.p-highlight",
    relatives:
      "#content > div > app-applicant-add > app-questionnaire > app-main-card > div > div.body.collapse.show > form > div > div:nth-child(5) > div > div > div > div > div > div:nth-child(2) > label > p-radiobutton > div > div.p-radiobutton-box.p-highlight",
    arrested:
      "#content > div > app-applicant-add > app-questionnaire > app-main-card > div > div.body.collapse.show > form > div > div:nth-child(6) > div > div > div > div > div > div:nth-child(2) > label > p-radiobutton > div > div.p-radiobutton-box.p-highlight",
    prison:
      "#content > div > app-applicant-add > app-questionnaire > app-main-card > div > div.body.collapse.show > form > div > div:nth-child(7) > div > div > div > div > div > div:nth-child(2) > label > p-radiobutton > div > div.p-radiobutton-box.p-highlight",
    deported:
      "#content > div > app-applicant-add > app-questionnaire > app-main-card > div > div.body.collapse.show > form > div > div:nth-child(8) > div > div > div > div > div > div:nth-child(2) > label > p-radiobutton > div > div.p-radiobutton-box.p-highlight",
    smuggling:
      "#content > div > app-applicant-add > app-questionnaire > app-main-card > div > div.body.collapse.show > form > div > div:nth-child(9) > div > div > div > div > div > div:nth-child(2) > label > p-radiobutton > div > div.p-radiobutton-box.p-highlight",
    arrestWarrent:
      "#content > div > app-applicant-add > app-questionnaire > app-main-card > div > div.body.collapse.show > form > div > div:nth-child(10) > div > div > div > div > div > div:nth-child(2) > label > p-radiobutton > div > div.p-radiobutton-box.p-highlight",
    armedForced:
      "#content > div > app-applicant-add > app-questionnaire > app-main-card > div > div.body.collapse.show > form > div > div:nth-child(11) > div > div > div > div > div > div:nth-child(2) > label > p-radiobutton > div > div.p-radiobutton-box.p-highlight",
    workedInMedia:
      "#content > div > app-applicant-add > app-questionnaire > app-main-card > div > div.body.collapse.show > form > div > div:nth-child(12) > div > div > div > div > div > div:nth-child(2) > label > p-radiobutton > div > div.p-radiobutton-box.p-highlight",
    terrorist:
      "#content > div > app-applicant-add > app-questionnaire > app-main-card > div > div.body.collapse.show > form > div > div:nth-child(13) > div > div > div > div > div > div:nth-child(2) > label > p-radiobutton > div > div.p-radiobutton-box.p-highlight",
    passportRestriction:
      "#content > div > app-applicant-add > app-questionnaire > app-main-card > div > div.body.collapse.show > form > div > div:nth-child(14) > div > div > div > div > div > div:nth-child(2) > label > p-radiobutton > div > div.p-radiobutton-box.p-highlight",
    physicalDisability:
      "#content > div > app-applicant-add > app-questionnaire > app-main-card > div > div.body.collapse.show > form > div > div:nth-child(15) > div > div > div > div > div > div:nth-child(2) > label > p-radiobutton > div > div.p-radiobutton-box.p-highlight",
    vaccineTakenYes:
      "#content > div > app-applicant-add > app-questionnaire > app-main-card > div > div.body.collapse.show > form > div > div:nth-child(16) > div > div > div.main-question > div > div > div:nth-child(1) > label > p-radiobutton > div > div.p-radiobutton-box.p-highlight",
    vaccineClarificationInput:
      "#content > div > app-applicant-add > app-questionnaire > app-main-card > div > div.body.collapse.show > form > div > div:nth-child(16) > div > div > div.question-details.ng-star-inserted > div > div > g-text-area > div:nth-child(2) > textarea",
    vaccinePledgeYes:
      "#content > div > app-applicant-add > app-questionnaire > app-main-card > div > div.body.collapse.show > form > div > div:nth-child(17) > div > div > div.main-question > div > div > div:nth-child(1) > label > p-radiobutton > div > div.p-radiobutton-box.p-highlight",
    vaccinePledgeClarificationInput:
      "#content > div > app-applicant-add > app-questionnaire > app-main-card > div > div.body.collapse.show > form > div > div:nth-child(17) > div > div > div.question-details.ng-star-inserted > div > div > g-text-area > div:nth-child(2) > textarea",
  },
  reviewApplication: {
    pledgeVaccines:
      "#content > div > app-applicant-add > app-review-application > app-main-card:nth-child(10) > div > div.body.collapse.show > div > g-checkbox:nth-child(1) > div > p-checkbox > div > div.p-checkbox-box",
    pledgeShowVaccine:
      "#content > div > app-applicant-add > app-review-application > app-main-card:nth-child(10) > div > div.body.collapse.show > div > g-checkbox:nth-child(2) > div > p-checkbox > div > div.p-checkbox-box.p-highlight",
    next: "#content > div > app-applicant-add > app-review-application > action-btns > div > div > button",
  },
  applicantList: {
    title: "body > app-root > app-layout > div > div > div > applicants-list > div > div",
    rows: "#listNormalApplicantId > div > div.p-datatable-wrapper > table > tbody > tr",
    tdIndexedPassportNumber: "#listNormalApplicantId > div > div.p-datatable-wrapper > table > tbody > tr:nth-child({i}) > td:nth-child(5) > div > span > span",

  }
};

module.exports = {
  SELECTORS,
};
