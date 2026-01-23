const { SELECTORS } = require("./selectors.js");
const {
  feedPlant,
  secure,
  showHelloController,
  whereDoYouLive,
  tellMeAboutYourSelf,
  recheck,
  answerQuestions,
  showApplicantListCommander,
  moreAndMore,
  editResidence,
  showEditController,
  enterGarden,
} = require("./actions.js");

const knowledge = {
  plants: {
    landscape: {
      url: "",
      allowOnce: true,
      visualHeadLessForwardTo: `pub/login`,
    },
    protect: {
      url: `pub/login`,
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
      action: (e) => feedPlant(e),
    },
    // challenge: {
    //   url: `pub/login`,
    //   needs: [
    //     SELECTORS.loginOtp.firstDigit,
    //     SELECTORS.loginOtp.label,
    //     SELECTORS.loginOtp.h1,
    //   ],
    //   action: (e) => secure(e),
    // },
    welcome: {
      url: `protected/hm/dashboard/requestsDashboard`,
      // should skip in automation
    },
    hello: {
      url: `protected-applicant-st/add/data-entry-method`,
      needs: [
        SELECTORS.dataEntry.automaticScan,
        SELECTORS.dataEntry.manualEntry,
      ],
      action: (e) => showHelloController(e),
    },
    edit: {
      url: `protected-applicant-st/add/Identity-and-residence\?id=`,
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
      action: (e) => showEditController(e),
    },
    gettingToKnow: {
      url: `protected-applicant-st/add/Identity-and-residence`,
      needs: [
        SELECTORS.identityAndResidence.placeOfIssue,
        SELECTORS.identityAndResidence.embassy,
      ],
      slots: [
        {
          selector: SELECTORS.identityAndResidence.placeOfIssue,
          value: (row) => row.placeOfIssue,
        },
        {
          selector: SELECTORS.identityAndResidence.placeOfBirth,
          value: (row) => row.placeOfBirth || row.nationality.name, 
        },
      ],
      action: (e) => whereDoYouLive(e),
    },
    moreGettingToKnow: {
      url: `protected-applicant-st/add/basic-data`,
      needs: [SELECTORS.basicData.email],
      slots: [
        {
          selector: SELECTORS.basicData.email,
          value: (row) => row.email,
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
    moreGettingToKnowEdit: {
      url: `protected-applicant-st/add/basic-data\?id=`,
      needs: [SELECTORS.basicData.email],
      slots: [
        {
          selector: SELECTORS.basicData.email,
          value: (row) => row.email,
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
      url: `protected-applicant-st/add/additinal-data`,
      needs: [SELECTORS.additionalData.expectedLength],
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
        moreAndMore(e);
      },
    },
    lastQuestions: {
      url: `protected-applicant-st/add/Questionnaire`,
      needs: [
        SELECTORS.questions.otherNationalitiesYes,
        SELECTORS.questions.haveYouTraveled,
      ],
      action: (e) => {
        answerQuestions(e);
      },
    },
    almostDone: {
      url: `protected-applicant-st/add/Review-application`,
      needs: [],
      action: (e) => {
        recheck(e);
      },
    },
    whoIsSent: {
      url: `protected/applicants-groups/applicants/list`,
      needs: [SELECTORS.applicantList.pilgrimsTitle],
      action: (e) => {
        showApplicantListCommander(e);
      },
    },
    groupList: {
      url: `umrah/mutamer-group/group-list`,
      needs: [SELECTORS.groupList.newGroupButton],
      action: () => {
        enterGarden();
      },
    },
    madamAfaf: {
      url: `umrah/mutamer-group/add-group/create-group`,
      needs: [SELECTORS.madamAfaf.groupNameInput],
      slots: [
        {
          selector: SELECTORS.madamAfaf.groupNameInput,
          value: (row) => row.groupName,
        },
      ],
      action: (e) => {
        feedPlant(e);
      },
    },
    mutamerList: {
      url: "umrah/mutamer/mutamer-list",
      needs: [SELECTORS.mutamerList.addMutamerButton],
      action: (e) => {
        plantNewMutamer(e);
      },
    },
    addMutamer: {
      url: "umrah/mutamer/add-mutamer",
      needs: [SELECTORS.addMutamer.addMutamerButton],
      action: (e) => {
        feedPlant(e);
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
};
