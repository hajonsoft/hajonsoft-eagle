const { add } = require("lodash");

//TODO: Check the confirm scan button selector
const SELECTORS = {
  login: {
    username:
      "#login > app-login > div.log-card.ng-star-inserted > form > div > div.col-sm-12.form-mb > g-input-text > div > div.input-text-wrapper-class > input",
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
    helloControllerHeader:
      "#content > div > app-applicant-add > app-data-entry-method > div > app-main-card:nth-child(1) > div > div.card-header.mb-0.cursor-pointer.d-flex.justify-content-between.align-items-center.ng-star-inserted",
    startScanButton:
      "#content > div > app-applicant-add > app-data-entry-method > div > app-main-card.ng-star-inserted > div > div.body.collapse.show > div > div > div.col-md-8 > div.passport-upload.mb-4.ng-star-inserted > button",
    passportPhotoButton:
      "#content > div > app-applicant-add > app-data-entry-method > div > app-main-card.ng-star-inserted > div > div.body.collapse.show > div > div > div.col-md-8 > div:nth-child(6) > button",
    passportPhotoInput:
      "#content > div > app-applicant-add > app-data-entry-method > div > app-main-card.ng-star-inserted > div > div.body.collapse.show > div > div > div.col-md-8 > input",
    confirmScanButton:
      "#content > div > app-applicant-add > app-data-entry-method > p-dialog:nth-child(3) > div > div > div:nth-child(4) > action-btns > div > div > button",
    nextButton:
      "#content > div > app-applicant-add > app-data-entry-method > action-btns > div > div > button",
    spinnerImage: "g-spinner > div > img",
    editControllerLabel: "#content > div > app-applicant-add > app-add-basic-data > form > div.row > div.col-md-12.col-sm-12 > app-main-card > div > div.card-header.mb-0.cursor-pointer.d-flex.justify-content-between.align-items-center.ng-star-inserted",
  },
  identityAndResidence: {
    nationalityHeader: "#content > div > app-applicant-add > app-identity-and-residence > form > div:nth-child(1) > div > app-main-card > div > div.card-header.mb-0.cursor-pointer.ng-star-inserted > h3",
    firstEmbassyOption: "#dropDownId_list > p-dropdownitem:nth-child(1) > li",
    embassyXPath: '//*[@id="content"]/div/app-applicant-add/app-identity-and-residence/form/div[1]/div/app-main-card/div/div[2]/div/div[2]/g-dropdown',
    passportTypeXPath:
      '//*[@id="content"]/div/app-applicant-add/app-identity-and-residence/form/div[2]/div/app-main-card/div/div[2]/div/div[2]/g-dropdown',
    normalHajj:
      "#content > div > app-applicant-add > app-identity-and-residence > form > app-main-card > div > div.body.collapse.show > div > div > div:nth-child(1) > label > div > p-radiobutton > div > div.p-radiobutton-box",
    normalPassport:
      "#content > div > app-applicant-add > app-identity-and-residence > form > div:nth-child(2) > div > app-main-card > div > div.body.collapse.show > div > div:nth-child(2) > g-dropdown > p-dropdown > div",
    embassy:
      "#content > div > app-applicant-add > app-identity-and-residence > form > div:nth-child(1) > div > app-main-card > div > div.body.collapse.show > div > div:nth-child(2) > g-dropdown > p-dropdown",
    PassIssueDate:
      "#content > div > app-applicant-add > app-identity-and-residence > form > div:nth-child(2) > div > app-main-card > div > div.body.collapse.show > div > div:nth-child(3) > g-calendar > label",
    placeOfIssue:
      "#content > div > app-applicant-add > app-identity-and-residence > form > div:nth-child(2) > div > app-main-card > div > div.body.collapse.show > div > div:nth-child(5) > g-input-text > div > div.input-text-wrapper-class > input",
    passIssueDataCalendarField:
      "#content > div > app-applicant-add > app-identity-and-residence > form > div:nth-child(2) > div > app-main-card > div > div.body.collapse.show > div > div:nth-child(3) > g-calendar > p-calendar > span > input",
    placeOfBirth:
      "#content > div > app-applicant-add > app-identity-and-residence > form > div.ng-pristine.ng-invalid.ng-touched > app-main-card > div > div.body.collapse.show > div:nth-child(1) > div:nth-child(8) > g-input-text > div > div.input-text-wrapper-class > input",
    residenceIdImage:
      "#content > div > app-applicant-add > app-identity-and-residence > form > div.row.ng-star-inserted > div > app-main-card > div > div.body.collapse.show > div > div.row > div:nth-child(1) > g-attachment-upload > div.form-control.file-upload.enabled > div.upload-info-container > input",
    residenceIdNumber:
      "#content > div > app-applicant-add > app-identity-and-residence > form > div.row.ng-star-inserted > div > app-main-card > div > div.body.collapse.show > div > div:nth-child(2) > g-input-text > div > input",
    residenceIdIssueDate:
      "#content > div > app-applicant-add > app-identity-and-residence > form > div.row.ng-star-inserted > div > app-main-card > div > div.body.collapse.show > div > div:nth-child(3) > g-calendar > p-calendar > span > input",
    residenceIdExpireDate:
      "#content > div > app-applicant-add > app-identity-and-residence > form > div.row.ng-star-inserted > div > app-main-card > div > div.body.collapse.show > div > div:nth-child(4) > g-calendar > p-calendar > span > input",
    residenceIdIssueDateLabel: "#content > div > app-applicant-add > app-identity-and-residence > form > div.row.ng-star-inserted > div > app-main-card > div > div.body.collapse.show > div > div:nth-child(3) > g-calendar > label",
    residenceIdExpireDateLabel: "#content > div > app-applicant-add > app-identity-and-residence > form > div.row.ng-star-inserted > div > app-main-card > div > div.body.collapse.show > div > div:nth-child(4) > g-calendar > label",
    residenceIdLabel: "#content > div > app-applicant-add > app-identity-and-residence > form > div.row.ng-star-inserted > div > app-main-card > div > div.body.collapse.show > div > div:nth-child(2) > g-input-text > div > label",
    nextButton:
      "#content > div > app-applicant-add > app-identity-and-residence > action-btns > div > div > button",
  },
  basicData: {
    fatherName:
      "#content > div > app-applicant-add > app-add-basic-data > form > div.row > div.col-md-12.col-sm-12 > app-main-card > div > div.body.collapse.show > div:nth-child(2) > div:nth-child(2) > g-input-text > div > input",
    firstNameArabic:
      "#content > div > app-applicant-add > app-add-basic-data > form > div.row > div.col-md-12.col-sm-12 > app-main-card > div > div.body.collapse.show > div:nth-child(2) > div:nth-child(1) > g-input-text > div > input",
    secondNameArabic:
      "#content > div > app-applicant-add > app-add-basic-data > form > div.row > div.col-md-12.col-sm-12 > app-main-card > div > div.body.collapse.show > div:nth-child(2) > div:nth-child(3) > g-input-text > div > input",
    thirdNameArabic:
      "#content > div > app-applicant-add > app-add-basic-data > form > div.row > div.col-md-12.col-sm-12 > app-main-card > div > div.body.collapse.show > div:nth-child(2) > div:nth-child(5) > g-input-text > div > input",
    lastNameArabic:
      "#content > div > app-applicant-add > app-add-basic-data > form > div.row > div.col-md-12.col-sm-12 > app-main-card > div > div.body.collapse.show > div:nth-child(2) > div:nth-child(7) > g-input-text > div > input",
    email:
      "#content > div > app-applicant-add > app-add-basic-data > form > div.row > div:nth-child(3) > app-main-card > div > div.body.collapse.show > div > div.col-md-12 > div > div > g-input-text > div > div.input-text-wrapper-class > input",
    maritalStatusXPath:
      '//*[@id="content"]/div/app-applicant-add/app-add-basic-data/form/div[1]/div[1]/app-main-card/div/div[2]/div[2]/div[5]/g-dropdown',
    countryCodeXPath:
      '//*[@id="content"]/div/app-applicant-add/app-add-basic-data/form/div[1]/div[2]/app-main-card/div/div[2]/div/div[2]/div/div[1]/g-dropdown',
    placeOfBirth:
      "#content > div > app-applicant-add > app-add-basic-data > form > div.row > div.col-md-12.col-sm-12 > app-main-card > div > div.body.collapse.show > div:nth-child(2) > div:nth-child(8) > g-input-text > div > input",
    placeOfBirthLabel:
      "#content > div > app-applicant-add > app-identity-and-residence > form > div.ng-pristine.ng-invalid.ng-touched > app-main-card > div > div.body.collapse.show > div:nth-child(1) > div:nth-child(8) > g-input-text > div > label",
    residentialAddress:
      "#content > div > app-applicant-add > app-add-basic-data > form > div.row > div.col-md-12.col-sm-12 > app-main-card > div > div.body.collapse.show > div:nth-child(2) > div:nth-child(6) > g-input-text > div > input",
    phoneNumber:
      "#content > div > app-applicant-add > app-add-basic-data > form > div.row > div:nth-child(3) > app-main-card > div > div.body.collapse.show > div > div:nth-child(2) > div > div.col-md-8 > g-input-text > div > div.input-text-wrapper-class > input",
    zipCode:
      "#content > div > app-applicant-add > app-add-basic-data > form > div.row > div:nth-child(3) > app-main-card > div > div.body.collapse.show > div > div:nth-child(4) > g-input-text > div > div > input",
    mailBox:
      "#content > div > app-applicant-add > app-add-basic-data > form > div.row > div:nth-child(3) > app-main-card > div > div.body.collapse.show > div > div:nth-child(5) > g-input-text > div > div > input",
    photoInput:
      "#content > div > app-applicant-add > app-add-basic-data > form > div.row > div.col-md-12.col-sm-12 > app-main-card > div > div.body.collapse.show > div > div:nth-child(1) > g-attachment-upload > div.form-control.file-upload.enabled > div.upload-info-container > input",
    referenceRadio:
      "#content > div > app-applicant-add > app-add-basic-data > form > div.col-md-12 > app-main-card > div > div.body.collapse.show > div > div.col-md-12.mt-3 > div > div.choice-box.flex-row.align-items-ceter.d-flex.align-items-center.justify-content-center.gap-3 > p-radiobutton > div > div.p-radiobutton-box",
    nextButton:
      "#content > div > app-applicant-add > app-add-basic-data > form > action-btns > div > div > button",
  },
  additionalData: {
    notEmployed:
      "#content > div > app-applicant-add > app-additional-data > form > div:nth-child(1) > div > app-main-card > div > div.body.collapse.show > div > div.col-md-6.mt-3 > div > div:nth-child(1) > div > p-radiobutton > div > div.p-radiobutton-box",
    expectedLength:
      "#content > div > app-applicant-add > app-additional-data > form > div:nth-child(2) > div > app-main-card > div > div.body.collapse.show > div > div:nth-child(2) > g-input-text > div > input",
    flightNumber:
      "#content > div > app-applicant-add > app-additional-data > form > div:nth-child(2) > div > app-main-card > div > div.body.collapse.show > div > div:nth-child(3) > g-input-text > div > input",
    dateIntoKSA:
      "#content > div > app-applicant-add > app-additional-data > form > div:nth-child(2) > div > app-main-card > div > div.body.collapse.show > div > div.col-md-6.my-3 > g-calendar > p-calendar > span > input",
    nextButton:
      "#content > div > app-applicant-add > app-additional-data > action-btns > div > div > button",
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
      "#content > div > app-applicant-add > app-questionnaire > app-main-card > div > div.body.collapse.show > form > div > div:nth-child(16) > div > div > div.question-details.ng-star-inserted > div > div > g-text-area > div:nth-child(2) > div.input-text-area-wrapper-class > textarea",
    vaccinePledgeYes:
      "#content > div > app-applicant-add > app-questionnaire > app-main-card > div > div.body.collapse.show > form > div > div:nth-child(17) > div > div > div.main-question > div > div > div:nth-child(1) > label > p-radiobutton > div > div.p-radiobutton-box.p-highlight",
    vaccinePledgeClarificationInput:
      "#content > div > app-applicant-add > app-questionnaire > app-main-card > div > div.body.collapse.show > form > div > div:nth-child(17) > div > div > div.question-details.ng-star-inserted > div > div > g-text-area > div:nth-child(2) > div.input-text-area-wrapper-class > textarea",
    nextButton:
      "#content > div > app-applicant-add > app-questionnaire > action-btns > div > div > button",
  },
  reviewApplication: {
    pledgeVaccines:
      "#content > div > app-applicant-add > app-review-application > app-main-card:nth-child(10) > div > div.body.collapse.show > div > g-checkbox:nth-child(1) > div > p-checkbox > div > div.p-checkbox-box",
    pledgeShowVaccine:
      "#content > div > app-applicant-add > app-review-application > app-main-card:nth-child(10) > div > div.body.collapse.show > div > g-checkbox:nth-child(2) > div > p-checkbox > div > div.p-checkbox-box",
    pledgePilgrimAffairs:
      "#content > div > app-applicant-add > app-review-application > app-main-card:nth-child(10) > div > div.body.collapse.show > div > g-checkbox:nth-child(3) > div > p-checkbox > div > div.p-checkbox-box",
    nextButton:
      "#content > div > app-applicant-add > app-review-application > action-btns > div > div > button",
  },
  applicantList: {
    title:
      "body > app-root > app-layout > div > div > div > applicants-list > div > div",
    rows: "#listNormalApplicantId > div > div.p-datatable-wrapper > table > tbody > tr",
    tdIndexedPassportNumber:
      "#listNormalApplicantId > div > div.p-datatable-wrapper > table > tbody > tr:nth-child({i}) > td:nth-child(5) > div > span > span",
    pilgrimsTitle:
      "#listNormalApplicantId > div > div.p-datatable-header.ng-star-inserted > div:nth-child(1)",
    addPilgrimsButton:
      "body > app-root > app-layout > div > div > div > applicants-list > div.d-flex.justify-content-between.align-items-center > button",
  },
  groupList: {
    newGroupButton:
      "body > app-root > app-dynamic-layout > app-shared-layout > div > div > div > app-group-management > app-mutamer-group-list > app-group-states > div > div.group__header > div.group__header-actions.ng-star-inserted > button",
  },
  madamAfaf: {
    groupNameInput: "#stepper_parent > app-create-group > div > app-haj-main-card > div > div.body.collapse.show > form > div.row > div > div > div:nth-child(1) > input"
  },
  mutamerList: {
    addMutamerButton:
      "body > app-root > app-dynamic-layout > app-shared-layout > div > div > div > app-mutamer > app-mutamer-list > div > div > div > div.mutamer__header-actions.ng-star-inserted > button",
  },
  addMutamer: {
    chooseFileButton: "#stepper_parent > app-form-passport-info > app-haj-main-card > div > div.body.collapse.show > div > div.container__notes.col-9 > div.container__notes__upload.rounded-3.p-4 > div.container__notes__upload__button > button",
  }
};

module.exports = {
  SELECTORS,
};
