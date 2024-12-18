const puppeteer = require("puppeteer-extra");
// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const fs = require("fs");
const path = require("path");
const util = require("./util");
const { getPath } = require("./lib/getPath");
const kea = require("./lib/kea");
const moment = require("moment");
const budgie = require("./budgie");
const gmail = require("./lib/gmail");
const { fetchOTPFromNusuk } = require("./lib/imap");
const { nusukNationalities: nationalities } = require("./data/nationalities");
const childProcess = require("child_process");
const sharp = require("sharp");
const abortController = new AbortController();

let page;
let data;
let counter = 0;
let emailAddress;
let telephoneNumber;
let manualMode;
const verifyClicked = {};
const loginRetries = {};
const clicked = {};
let emailCodeCounter = 0;
const URLS = {
  SIGN_UP: "https://hajj.nusuk.sa/registration/signup",
  HOME: "https://hajj.nusuk.sa/",
  HOME2: "https://hajj.nusuk.sa/Index",
  PROFILE: "https://hajj.nusuk.sa/Account/Profile",
  VERIFY_REGISTER_EMAIL: "https://hajj.nusuk.sa/account/authorize/otp/verify",
  REGISTER_PASSWORD: "https://hajj.nusuk.sa/registration/signup/password",
  INDEX: "https://hajj.nusuk.sa/Index",
  UPLOAD_DOCUMENTS: "https://hajj.nusuk.sa/registration/documents/[0-9a-f-]+",
  COMPLETE_REGISTRATION:
    "https://hajj.nusuk.sa/registration/documents/summary/[0-9a-f-]+",
  registrationForward:
    "https://hajj.nusuk.sa/Applicants/Individual/Registration.handler=RegisterApplicant",
  LOGIN: "https://hajj.nusuk.sa/account/authorize",
  CONTACT: "https://hajj.nusuk.sa/registration/contact/[0-9a-f-]+",
  SUMMARY: "https://hajj.nusuk.sa/registration/form/step1/[0-9a-f-]+",
  SUMMARY2: "https://hajj.nusuk.sa/registration/form/step2/[0-9a-f-]+",
  PREFERENCES: "https://hajj.nusuk.sa/Registration/Preferences/[0-9a-f-]+",
  PREFERENCES_YOURS: "https://hajj.nusuk.sa/Registration/Preferences/yours/[0-9a-f-]+",
  REGISTRATION_SUMMARY: "https://hajj.nusuk.sa/registration/summary/[0-9a-f-]+",
  SUCCESS: "https://hajj.nusuk.sa/Registration/Success",
  MEMBERS: "https://hajj.nusuk.sa/profile/members",
  SIGNOUT: "https://hajj.nusuk.sa/Account/Signout",
};

function getOTPEmailAddress(email) {
  if (
    email.includes(".gmail") ||
    email.includes(".yahoo") ||
    email.includes(".outlook")
  ) {
    const domain = data.system.username.includes("@")
      ? data.system.username.split("@")[1]
      : data.system.username;
    return `admin@${domain}`;
  }
  return email;
}

function getLogFile() {
  const logFolder = path.join(getPath("log"), data.info.munazim);
  if (!fs.existsSync(logFolder)) {
    fs.mkdirSync(logFolder, { recursive: true });
  }
  const logFile = path.join(logFolder, data.info.caravan + "_ehj.txt");
  return logFile;
}

let startTime;
let timerHandler;
const config = [
  {
    name: "home",
    url: URLS.HOME,
    controller: {
      name: "home",
      selector:
        "#navbarNav > div > ul.navbar-nav.align-items-center.flex-lg-grow-1.justify-content-lg-around",
      action: async () => {
        const selectedTraveler = await page.$eval(
          "#hajonsoft_select",
          (el) => el.value
        );
        if (selectedTraveler) {
          fs.writeFileSync(getPath("selectedTraveller.txt"), selectedTraveler);
          await loginOrRegister(selectedTraveler);
        }
      },
    },
  },
  {
    name: "home",
    url: URLS.HOME2,
    controller: {
      name: "home",
      selector:
        "body > main > div.home-full-bg > div.container-lg.container-fluid.h-100 > div.row.z-1.position-relative.align-content-end.home-full-text > div > h3",
      action: async () => {
        const selectedTraveler = await page.$eval(
          "#hajonsoft_select",
          (el) => el.value
        );
        if (selectedTraveler) {
          fs.writeFileSync(getPath("selectedTraveller.txt"), selectedTraveler);
          await loginOrRegister(selectedTraveler);
        }
      },
    },
  },
  {
    name: "signup-step1",
    url: URLS.SIGN_UP,
    controller: {
      selector: "body > header > nav > div",
      action: async () => {
        const selectedTraveler = await page.$eval(
          "#hajonsoft_select",
          (el) => el.value
        );
        if (selectedTraveler) {
          fs.writeFileSync(getPath("selectedTraveller.txt"), selectedTraveler);
          await signup_step1(selectedTraveler);
        }
      },
    },
  },
  {
    name: "verify-register-email",
    regex: URLS.VERIFY_REGISTER_EMAIL,
  },
  {
    name: "signup-password",
    url: URLS.REGISTER_PASSWORD,
  },
  {
    name: "profile",
    url: URLS.PROFILE,
  },
  {
    name: "index",
    url: URLS.INDEX,
  },
  {
    name: "signout",
    url: URLS.SIGNOUT,
  },
  {
    name: "upload-documents",
    regex: URLS.UPLOAD_DOCUMENTS,
    controller: {
      selector:
        "body > main > div.system > div > div.sys-page-title.px-3.py-4.mb-4 > div.row > div:nth-child(1)",
      name: "upload_documents",
      action: async () => {
        const selectedTraveler = await page.$eval(
          "#hajonsoft_select",
          (el) => el.value
        );
        if (selectedTraveler) {
          fs.writeFileSync(getPath("selectedTraveller.txt"), selectedTraveler);
          await uploadDocuments(selectedTraveler);
        }
      },
    },
  },
  {
    name: "complete-registration",
    regex: URLS.COMPLETE_REGISTRATION,
    controller: {
      selector: "body > main > div.system > div > div > div.row > div > p",
      name: "complete_registration",
      action: async () => {
        const selectedTraveler = await page.$eval(
          "#hajonsoft_select",
          (el) => el.value
        );
        if (selectedTraveler) {
          fs.writeFileSync(getPath("selectedTraveller.txt"), selectedTraveler);
          await completeRegistration(selectedTraveler);
        }
      },
    },
  },
  {
    name: "contact",
    regex: URLS.CONTACT,
  },
  {
    name: "summary",
    regex: URLS.SUMMARY,
    controller: {
      name: "summary",
      selector:
        "body > main > div.system > div > div.sys-page-title.px-3.py-4.mb-4 > div.row > div > p",
      action: async () => {
        const selectedTraveler = await page.$eval(
          "#hajonsoft_select",
          (el) => el.value
        );
        if (selectedTraveler) {
          fs.writeFileSync(getPath("selectedTraveller.txt"), selectedTraveler);
          await summaryResidence(selectedTraveler);
        }
      },
    },
  },
  {
    name: "summary2",
    regex: URLS.SUMMARY2,
  },
  {
    name: "preferences",
    regex: URLS.PREFERENCES,
  },
  {
    name: "preferences_yours",
    regex: URLS.PREFERENCES_YOURS,
  },
  {
    name: "registration-summary",
    regex: URLS.REGISTRATION_SUMMARY,
  },
  {
    name: "login",
    url: URLS.LOGIN,
    controller: {
      name: "login",
      selector:
        "#navbarNav > div > ul.navbar-nav.align-items-center.flex-lg-grow-1.justify-content-lg-around",
      action: async () => {
        const selectedTraveler = await page.$eval(
          "#hajonsoft_select",
          (el) => el.value
        );
        if (selectedTraveler) {
          fs.writeFileSync(getPath("selectedTraveller.txt"), selectedTraveler);
          await loginPassenger(selectedTraveler);
        }
      },
    },
  },
  {
    name: "success",
    regex: URLS.SUCCESS,
  },
  {
    name: "members",
    regex: URLS.MEMBERS,
    controller: {
      name: "members",
      selector:
        "body > main > div > div > div > div.profile-container.p-4.p-md-5 > div.profile-title.ps-4.pe-3",
      action: async () => {
        const selectedTraveler = await page.$eval(
          "#hajonsoft_select",
          (el) => el.value
        );
        if (selectedTraveler) {
          fs.writeFileSync(getPath("selectedTraveller.txt"), selectedTraveler);
          await addNewMember(selectedTraveler);
        }
      },
    },
  },
];

async function send(sendData) {
  data = sendData;
  page = await util.initPage(config, onContentLoaded);
  await page.goto(config[0].url, { waitUntil: "domcontentloaded" });
}

async function onContentLoaded(res) {
  counter = util.useCounter(counter);
  if (counter >= data?.travellers?.length) {
    util.setCounter(0);
    if (fs.existsSync(getPath("loop.txt"))) {
      fs.unlinkSync(getPath("loop.txt"));
    }
  }
  const pageUrl = await page.url();
  console.log("🚀 ~ file: nsh.js ~ line 139 ~ onContentLoaded ~ pageUrl", pageUrl);
  const currentConfig = util.findConfig(pageUrl, config);
  try {
    await pageContentHandler(currentConfig);
  } catch (err) {
    console.log(err);
  }
}

async function pageContentHandler(currentConfig) {
  const passenger = data.travellers[util.getSelectedTraveler()];
  switch (currentConfig.name) {
    case "home":
      await util.controller(page, currentConfig, data.travellers);
      const leads = data.travellers.filter(
        (traveller) =>
          !traveller.isCompanion &&
          traveller.email &&
          !traveller.email.includes(".companion")
      );

      if (leads.length > 1) {
        await util.commander(page, {
          controller: {
            selector:
              "body > main > div.home-full-bg > div.container-lg.container-fluid.h-100 > div.row.z-1.position-relative.align-content-end.home-full-text > div > h3",
            title: `Login All Passengers (${Math.min(leads.length, 15)}/${leads.length
              })`,
            arabicTitle: "تسجيل الدخول لجميع الركاب",
            name: "parallel",
            action: async () => {
              await runParallel();
            },
          },
        });
      }

      if (process.argv.includes("--auto") || global.headless) {
        if (passenger.email.includes(".companion") || passenger.isCompanion) {
          await page.browser().close();
        } else {
          await loginOrRegister("0");
        }
      }
      break;
    case "index":
      if (manualMode === "login") {
        await page.goto(URLS.LOGIN);
      }
      break;
    case "profile":
      // take screenshot and save it as the visa picture
      const pageElement = await page.$("body");
      // save screenshot to kea
      try {
        await util.screenShotToKea(
          pageElement,
          data.system.accountId,
          passenger,
          "Embassy"
        );
      } catch (error) { }
      util.incrementSelectedTraveler();
      kea.updatePassenger(data.system.accountId, passenger.passportNumber, {
        "submissionData.nsh.status": "Submitted",
        eNumber: "completed",
      });
      if (fs.existsSync(getPath("loop.txt"))) {
        await page.goto("https://hajj.nusuk.sa/Account/Signout");
      }
      break;
    case "signup-step1":
      clearTimeout(timerHandler);
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      if (!manualMode) {
        manualMode = currentConfig.name;
      }
      await util.controller(page, currentConfig, data.travellers);
      if (fs.existsSync(getPath("loop.txt"))) {
        await signup_step1(util.getSelectedTraveler());
      }
      await signup_step1(util.getSelectedTraveler());
      break;
    case "verify-register-email":
      emailCodeCounter = 0;
      clearTimeout(timerHandler);
      // stop captcha attempts
      abortController.abort();

      await page.waitForSelector(
        "#otp-inputs > input.form-control.signup-otp.me-1",
        { visible: true }
      );

      await util.infoMessage(page, "OTP ...");

      await util.commander(page, {
        controller: {
          selector:
            "body > main > div.signup > div > div.container-lg.container-fluid.position-relative.h-100 > div > div > p",
          title: "Get Code",
          arabicTitle: "احصل عالرمز",
          name: "otp",
          action: async () => {
            emailCodeCounter = 0;
            await getOTPCode();
          },
        },
      });
      await getOTPCode();
      break;
    case "signup-password":
      clearTimeout(timerHandler);
      await util.commit(
        page,
        [
          {
            selector: "#CreatePasswordViewModel_Password",
            value: (row) => getPassword(row),
          },
          {
            selector: "#CreatePasswordViewModel_PasswordConfirmation",
            value: (row) => getPassword(row),
          },
        ],
        passenger
      );
      if (!clicked?.[currentConfig.name]?.[passenger.passportNumber]) {
        const createAccountSelector =
          "body > main > div.signup > div > div.container-lg.container-fluid.position-relative.h-100 > div > div > div.row > div > form > button";

        await util.clickWhenReady(createAccountSelector, page);
        // save the email only at this stage
        kea.updatePassenger(data.system.accountId, passenger.passportNumber, {
          email: passenger.email,
          phone: passenger.phone,
        });
        clicked[currentConfig.name] = {};
        clicked[currentConfig.name][passenger.passportNumber] = true;
      }
      break;
    case "register":
      clearTimeout(timerHandler);
      await page.evaluate(() => {
        document.scrollTo(0, document.body.scrollHeight);
      });
      if (!manualMode) {
        manualMode = currentConfig.name;
      }
      await util.controller(page, currentConfig, data.travellers);
      await util.commander(page, {
        controller: {
          selector:
            "#footerId > div > div:nth-child(1) > div.col-lg-3.offset-lg-3.col-md-4.offset-md-4",
          title: "Remember",
          arabicTitle: "تذكر",
          name: "rememberPassword",
          action: async () => {
            // store password into budgie
            const nusukPhone = await page.$eval(
              "#ApplicantRegistrationViewModel_MobileNumber",
              (el) => el.value
            );
            if (nusukPhone) {
              budgie.save("nusuk-hajj-phone", nusukPhone.toString());
            }

            const nusukResidence = await page.$eval(
              "#ApplicantRegistrationViewModel_CountryResidenceId",
              (el) => el.value
            );
            if (nusukResidence) {
              budgie.save("nusuk-hajj-residence", nusukResidence.toString());
            }
          },
        },
      });
      break;
    case "complete-registration":
      if (manualMode === "register") {
        const errorMessage = await page.$eval(
          "body > div.swal-overlay.swal-overlay--show-modal > div > div.swal-text",
          (el) => (el ? el.innerText : null)
        );
        util.infoMessage(
          page,
          `🚦 passenger ${passenger.slug} ERROR not registered`
        );
        kea.updatePassenger(data.system.accountId, passenger.passportNumber, {
          "submissionData.nsh.status": "Rejected",
          "submissionData.nsh.rejectionReason": errorMessage || "Unknown error",
        });
        util.incrementSelectedTraveler();
      }
      await util.controller(page, currentConfig, data.travellers);
      completeRegistration(util.getSelectedTraveler());
      break;
    case "contact":
      // review telephone number
      await util.commit(
        page,
        [
          {
            selector: "#ContactDetailsViewModel_Contact_MobileNumber",
            value: () => telephoneNumber,
          },
          {
            selector: "#ContactDetailsViewModel_Contact_StreetAddress",
            value: () => "123 main st city state",
          },
          {
            selector: "#ContactDetailsViewModel_Contact_HomeAddress",
            value: () => "123 main st city state",
          },
          {
            selector: "#ContactDetailsViewModel_Contact_SocialStatusId",
            value: () => "4",
          },
          {
            selector: "#ContactDetailsViewModel_Contact_ApartmentHouseNumber",
            value: () => "1",
          },
          {
            selector: "#ContactDetailsViewModel_Occupation_Name",
            value: () => "unknown",
          },
          {
            selector: "#ContactDetailsViewModel_Occupation_CurrentEmployer",
            value: () => "unknown",
          },
          {
            selector: "#ContactDetailsViewModel_Occupation_PreviousWork",
            value: () => "unknown",
          },
          {
            selector: "#ContactDetailsViewModel_Occupation_NameSector",
            value: () => "Private",
          },
          {
            selector: "#ContactDetailsViewModel_Arrival_EntryTypeId",
            value: () => "1",
          },
          {
            selector: "#ContactDetailsViewModel_Arrival_TravelIdentifier",
            value: () => "SV123",
          },
          {
            selector: "#ContactDetailsViewModel_Arrival_TotalExpectedDays",
            value: () => "20",
          },
          {
            selector: "#ContactDetailsViewModel_Contact_PoBox",
            value: () => "123",
          },
          {
            selector: "#ContactDetailsViewModel_Contact_ZipCode",
            value: () => "123",
          }
        ],
        passenger
      );
      // select first embassy #ContactDetailsViewModel_Contact_EmbassyId
      const embassySelector = "#ContactDetailsViewModel_Contact_EmbassyId";
      const firstOption = await page.$eval(embassySelector, (e) => {
        const options = e.querySelectorAll("option");
        for (const opt of options) {
          if (opt.value && /[0-9]/.test(opt.value)) {
            return { value: opt.value, label: opt.innerText };
          }
        }
      });
      if (firstOption) {
        await page.$eval(
          "#select2-ContactDetailsViewModel_Contact_EmbassyId-container",
          (e, val) => (e.innerText = val),
          firstOption.label
        );
        await page.select(embassySelector, firstOption.value);
      }
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await util.clickWhenReady(
        "#ContactDetailsViewModel_Arrival_ExpectedEntryDate",
        page
      );
      await page.waitForSelector(
        "body > div.datepick-popup > div > div.datepick-month-row > div > div > select:nth-child(1)"
      );
      await page.select(
        "body > div.datepick-popup > div > div.datepick-month-row > div > div > select:nth-child(1)",
        "6/2024"
      );
      // wait 500 ms for the days to load, then select the day
      await new Promise(resolve => setTimeout(resolve, 500));

      await page.click(
        "body > div.datepick-popup > div > div.datepick-month-row > div > table > tbody > tr:nth-child(2) > td:nth-child(6) > a"
      );
      break;
    case "summary":
      await util.controller(page, currentConfig, data.travellers);
      if (passenger.nationality.code !== data.system.country.code) {
        await summaryResidence(util.getSelectedTraveler());
      } else {
        await checkIfNotChecked("#HaveValidResidencyNo");
      }
      await checkIfNotChecked("#PreviouslyReceivedVisaEnterKSANo");
      await checkIfNotChecked("#PreviousKSAVisaRejectionNo");
      await checkIfNotChecked("#PassportHasRestrictionForOneTripNo");
      await checkIfNotChecked("#HaveRelativesResigingInKSANo");
      await checkIfNotChecked("#HoldOtherNationalitiesNo");
      await checkIfNotChecked("#TraveledToOtherCountriesNo");
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      // if (passenger.nationality.code === data.system.country.code) {
      //   await page.waitFor(1000);
      //   await page.click(
      //     "body > main > div.system > div > div.system-content.p-3 > form > div.d-flex.align-items-md-center.justify-content-md-between.px-3.mb-4.flex-wrap.flex-column-reverse.flex-md-row > div.d-flex.justify-content-end.order-md-2.next-buttons > div > button.btn.btn-main.btn-next.mb-3"
      //   );
      // }
      break;
    case "summary2":
      await checkIfNotChecked("#DeportedFromAnyCountryBeforeNo");
      await checkIfNotChecked("#WorkedInMediaOrPoliticsNo");
      await checkIfNotChecked("#ServedInArmedOrSecurityForcesNo");
      await checkIfNotChecked("#SentencedToPrisonBeforeNo");
      await checkIfNotChecked("#ConvictedInSmugglingMoneyLaunderingNo");
      await checkIfNotChecked("#BelongedToTerroristOrganizationBeforeNo");
      await checkIfNotChecked("#RequiredVaccinationsBeenTakenYes");
      await checkIfNotChecked("#HaveAnyPhysicalDisabilityNo");
      await checkIfNotChecked("#ArrestedOrConvictedForTerrorismBeforeNo");
      await new Promise(resolve => setTimeout(resolve, 1000));

      await util.commit(
        page,
        [
          {
            selector:
              "#BackgroundStepTwoViewModel_RequiredVaccinationsBeenTakenAnswer",
            value: () => "ACWY",
          },
        ],
        {}
      );
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      // await util.clickWhenReady(
      //   "body > main > div.system > div > div.system-content.p-3 > form > div.d-flex.align-items-md-center.justify-content-md-between.px-3.mb-4.flex-wrap.flex-column-reverse.flex-md-row > div.d-flex.justify-content-end.order-md-2.next-buttons > div > button.btn.btn-main.btn-next.mb-3",
      //   page
      // );
      break;
    case "preferences":
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await util.clickWhenReady(
        "body > main > div.system > div > form > div.d-flex.align-items-md-center.justify-content-md-between.px-3.mb-4.flex-wrap.flex-column-reverse.flex-md-row > div.d-flex.justify-content-end.order-md-2.next-buttons > div > button.btn.btn-main.btn-next.mb-3",
        page
      );
      break;
    case "preferences_yours":
      await util.clickWhenReady(
        "#HasChronicDiseasesOrAllergiesNo",
        page
      );
      await util.clickWhenReady(
        "#HasMentalIllnessNo",
        page
      );
      await util.clickWhenReady(
        "#HasSpecialNeedsNo",
        page
      );
      await util.clickWhenReady(
        "#HasUndergoneSurgeryNo",
        page
      );
      await util.commit(
        page,
        [
          {
            selector: "#PreferenceAnswerViewModel_BloodType",
            value: () => "1",
          },
        ],
        {}
      );
      break;
    case "registration-summary":
      await checkIfNotChecked("#summarycheck1");
      await checkIfNotChecked("#summarycheck2");
      await checkIfNotChecked("#summarycheck3");
      await checkIfNotChecked("#summarycheck5");
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });

      await util.clickWhenReady(
        "body > main > div.system > div > form > div > div.d-flex.justify-content-end.order-md-2.next-buttons > div > button",
        page
      );
      break;
    case "upload-documents":
      await util.controller(page, currentConfig, data.travellers);

      // Close the modal by clicking this element if it is in the DOM
      const documentGuideSelector =
        "#uploadDocumentsGuide > div > div > div > div.d-flex.align-items-center.justify-content-between > span";
      await util.clickWhenReady(documentGuideSelector, page);

      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });

      await util.commander(page, {
        controller: {
          selector:
            "body > main > div.system > div > div.sys-page-title.px-3.py-4.mb-4 > div.row > div.align-self-end.col-md-6",
          title: "Upload Sample",
          arabicTitle: "تحميل عينات",
          name: "uploadDocumentsCommander",
          action: async () => {
            await pasteSimulatedPassport();
          },
        },
      });
      // in Companion mode do not upload documents
      if (
        !passenger.email?.includes(".companion") &&
        !clicked[passenger.passportNumber + "documents"]
      ) {
        clicked[passenger.passportNumber + "documents"] = true;
        await uploadDocuments(util.getSelectedTraveler());
      }
      // Do you have residence Id
      // #HaveValidResidencyNo
      util.clickWhenReady("#HaveValidResidencyNo", page);
      break;
    case "login":
      clearTimeout(timerHandler);
      await closeAccountCreatedSuccessModal();
      await page.$eval(
        "body > main > div.signup > div > div.container-lg.container-fluid.position-relative.h-100 > div > div > div.row > div > form > input.btn.btn-main.mt-5.w-100",
        (el) => el.scrollIntoView({ behavior: "smooth", block: "start" })
      );
      if (!manualMode) {
        manualMode = currentConfig.name;
      }
      if (manualMode === "register") {
        util.infoMessage(page, `🧟 passenger ${passenger.slug} saved`);
        kea.updatePassenger(data.system.accountId, passenger.passportNumber, {
          "submissionData.nsh.status": "Submitted",
          email: passenger.email,
        });
        util.incrementSelectedTraveler();
        await page.goto(
          "https://hajj.nusuk.sa/Applicants/Individual/Registration/Index"
        );
        return;
      }
      if (fs.existsSync(getPath("loop.txt"))) {
        await loginPassenger(util.getSelectedTraveler());
      }
      await util.controller(page, currentConfig, data.travellers);

      await loginPassenger(util.getSelectedTraveler());
      break;

    case "success":
      // logout after 10 seconds if the user did not go to another page
      setTimeout(async () => {
        const currentUrl = await page.url();
        if (currentUrl === URLS.SUCCESS && !process.argv.includes("--auto")) {
          await page.goto("https://hajj.nusuk.sa/Account/SignOut");
        }
      }, 10000);
      break;
    case "members":
      await util.controller(page, currentConfig, data.travellers);
      break;
    case "signout":
      util.incrementSelectedTraveler();
    default:
      break;
  }
}

function suggestEmail(selectedTraveler, companion = false) {
  const passenger = data.travellers[selectedTraveler];
  if (passenger.email) {
    return passenger.email.split("/")[0];
  }
  const domain = data.system.username.includes("@")
    ? data.system.username.split("@")[1]
    : data.system.username;
  const friendlyName = `${passenger.name.first}.${companion ? "companion." : ""
    }${passenger.passportNumber}@${domain}`
    .toLowerCase()
    .replace(/ /g, "");
  const email = friendlyName;
  return email;
}

function suggestPhoneNumber(selectedTraveler) {
  const passenger = data.travellers[selectedTraveler];
  if (passenger.phone) {
    return passenger.phone;
  }
  const nusukPhone = budgie.get("nusuk-hajj-phone");
  if (nusukPhone && nusukPhone !== "nusuk-hajj-phone") {
    // find the number of zeros at the end of the phone number
    const numberOfTrailingZeros = nusukPhone.match(/0*$/)[0].length;
    const generatedNumber = new Date()
      .valueOf()
      .toString()
      .substring(13 - numberOfTrailingZeros, 13);

    // replace the zeros at the end of the phone number with the generated number
    return nusukPhone.replace(/0*$/, generatedNumber);
  } else {
    return "+1949" + new Date().valueOf().toString().substring(6, 13);
  }
}

async function checkIfNotChecked(selector) {
  try {
    const isChecked = await page.$eval(selector, (el) => el.checked);
    if (isChecked) {
      return;
    }
    await page.evaluate((selector) => {
      const radioButton = document.querySelector(selector);
      radioButton.checked = true;
      radioButton.dispatchEvent(new Event("change"));
    }, selector);
  } catch (error) {
    // console.error("Error:", error);
  }
}

async function uncheckIfChecked(selector) {
  try {
    const isUnChecked = await page.$eval(selector, (el) => !el.checked);
    if (isUnChecked) {
      return;
    }
    await page.evaluate((selector) => {
      const radioButton = document.querySelector(selector);
      radioButton.checked = false;
      radioButton.dispatchEvent(new Event("change"));
    }, selector);
  } catch (error) {
    // console.error("Error:", error);
  }
}

async function loginOrRegister(selectedTraveler) {
  util.setSelectedTraveller(selectedTraveler);
  const passenger = data.travellers[selectedTraveler];
  if (passenger.email) {
    await page.goto(URLS.LOGIN);
    return;
  }

  // go to register
  await page.goto(URLS.SIGN_UP);
}

async function getOTPCode() {
  const passenger = data.travellers[util.getSelectedTraveler()];
  await page.$eval(
    "#otpForm > label",
    (el, email) => (el.innerText = `${email.split("/")[0]}`),
    passenger.email || emailAddress
  );
  if (!canGetCode(passenger.email || emailAddress, data.system.username)) {
    await util.infoMessage(page, "Manual code required or try again!");
    return;
  }

  // If the page contain the word Registration, then registration. If it contains "OTP Verification"
  const pageMode = await page.$eval(
    "body > main > div.signup > div > div.container-lg.container-fluid.position-relative.h-100 > div > div > div > ol > li.breadcrumb-item.small.active",
    (el) => el.innerText
  );
  await page.$eval(
    "#otpForm > label",
    (el, email, fromString) =>
      (el.innerText = `${email.split("/")[0]} ${fromString}`),
    passenger.email || emailAddress,
    (passenger.email || emailAddress).includes("/")
      ? ""
      : `from (admin@${(passenger.email || emailAddress).split("@")[1].split("/")[0]
      })`
  );
  try {
    if (pageMode.includes("Registration") || pageMode.includes("التسجيل")) {
      await fetchOTPFromNusuk(
        getOTPEmailAddress((passenger.email || emailAddress).split("/")[0]),
        (passenger.email || emailAddress).includes("/")
          ? (passenger.email || emailAddress).split("/")[1]
          : data.system.adminEmailPassword,
        ["Email Activation", "تفعيل البريد الالكتروني"],
        pasteOTPCode,
        (passenger.email || emailAddress).includes("/")
      );
    } else if (
      pageMode.includes("OTP Verification") ||
      pageMode.includes("التثبت من رمز التحقق")
    ) {
      await fetchOTPFromNusuk(
        getOTPEmailAddress((passenger.email || emailAddress).split("/")[0]),
        (passenger.email || emailAddress).includes("/")
          ? (passenger.email || emailAddress).split("/")[1]
          : data.system.adminEmailPassword,
        ["One Time Password", "رمز سري لمرة واحدة"],
        pasteOTPCode,
        (passenger.email || emailAddress).includes("/")
      );
    }
  } catch (e) {
    await util.infoMessage(page, "Manual code required or try again!");
  }
}

async function getCompanionOTPCode() {
  const passenger = data.travellers[util.getSelectedTraveler()];
  if (!canGetCode(passenger.email || emailAddress, data.system.username)) {
    await util.infoMessage(page, "Manual code required or try again!");
    return;
  }
  // If the page contain the word Registration, then registration. If it contains "OTP Verification"
  const pageMode = "OTP Verification";
  try {
    await fetchOTPFromNusuk(
      getOTPEmailAddress((passenger.email || emailAddress).split("/")[0]),
      (passenger.email || emailAddress).includes("/")
        ? (passenger.email || emailAddress).split("/")[1]
        : data.system.adminEmailPassword,
      ["One Time Password", "رمز سري لمرة واحدة"],
      pasteOTPCodeCompanion,
      (passenger.email || emailAddress).includes("/")
    );
  } catch (e) {
    await util.infoMessage(page, "Manual code required!");
  }
}

// Utility function to handle country adjustments
function adjustCountryName(countryName) {
  // New logic: Change India to Canada
  if (countryName.toLowerCase().trim() === "india") {
    return "Canada";
  }
  return countryName;
}

// Function to find the nationality UUID
function getNationalityUUID(nationalities, countryName) {
  const adjustedCountryName = adjustCountryName(countryName);
  return nationalities.find(
    (n) => n.name.toLowerCase().trim() === adjustedCountryName.toLowerCase().trim()
  )?.uuid;
}


async function addNewMember(selectedTraveler) {
  emailCodeCounter = 0;
  await util.setSelectedTraveller(selectedTraveler);
  const addCompanionSelector = "button[data-bs-target='#addFamilyMemberModal']";
  await util.clickWhenReady(addCompanionSelector, page);
  // wait for the popup to appear, then type the email address, also store the email address with the companion text in it
  const email = suggestEmail(selectedTraveler, true);
  await new Promise(resolve => setTimeout(resolve, 1000));
  await page.waitForSelector("#AddMemberViewModel_Email");
  const passenger = data.travellers[selectedTraveler];
  passenger.email = email;
  emailAddress = email;

  await util.commit(
    page,
    [
      {
        selector: "#AddMemberViewModel_Email",
        value: () => email.split("/")[0],
      },
    ],
    {}
  );

  await util.clickWhenReady("#verifyEmailBtn", page);

  await util.commander(page, {
    controller: {
      selector: "#OTPModalMsg",
      title: "Get Code (Comp)",
      arabicTitle: "احصل عالرمز",
      name: "otp-companion",
      action: async () => {
        emailCodeCounter = 0;
        await getCompanionOTPCode();
      },
    },
  });

  await page.$eval(
    "#OTPModal > div > div > div > form > label",
    (el, email) =>
    (el.innerText = `${email.split("/")[0]} from (admin@${email.split("@")[1].split("/")[0]
      })`),
    passenger.email || emailAddress
  );
  await getCompanionOTPCode();
}
const usedCodes = {};
function codeUsed(code) {
  if (usedCodes[code]) {
    return true;
  }
  usedCodes[code] = true;
  return false;
}
async function signup_step1(selectedTraveler) {
  util.setSelectedTraveller(selectedTraveler);
  const passenger = data.travellers[selectedTraveler];
  emailAddress = suggestEmail(selectedTraveler);
  telephoneNumber = suggestPhoneNumber(selectedTraveler);
  // store temporarily in the passenger object
  passenger.email = emailAddress;
  passenger.phone = telephoneNumber;
  const nationality = getNationalityUUID(nationalities, data.system.country.name);

  await util.commit(
    page,
    [
      {
        selector: "#SignupViewModel_Email",
        value: (row) => emailAddress.split("/")[0],
      },
      {
        selector: "#SignupViewModel_CountryResidenceId",
        value: () => nationality,
      },
    ],
    passenger
  );
  //
  // wait for all javascript functions to execute
  await new Promise(resolve => setTimeout(resolve, 1000));
  await checkIfNotChecked("#chkResidenceCountry");
  await checkIfNotChecked("#SignupViewModel_AgreeToTermsAndCondition");
  await checkIfNotChecked("#SignupViewModel_SubscribeToNewsLetter");
  await util.infoMessage(page, "Captcha ...");
  const captchaCode = await util.SolveIamNotARobot(
    "#g-recaptcha-response",
    URLS.SIGN_UP,
    "6LcNy-0jAAAAAJDOXjYW4z7yV07DWyivFD1mmjek",
    abortController.signal
  );

  if (captchaCode) {
    await page.click(
      "body > main > div.signup > div > div.container-lg.container-fluid.position-relative.h-100 > div > div > div.row > div > form > input.btn.btn-main.px-5.mt-5.w-100"
    );
  }

  if (!captchaCode) {
    await util.infoMessage(page, "Manual captcha required ...");
    if (clicked?.["signup_1"]?.[passenger.passportNumber]) {
      return;
    } else {
      await signup_step1(selectedTraveler);
      clicked["signup_1"] = {};
      clicked["signup_1"][passenger.passportNumber] = true;
    }
  }
}

async function loginPassenger(selectedTraveler) {
  util.setSelectedTraveller(selectedTraveler);
  const rawData = fs.readFileSync(getPath("data.json"), "utf-8");
  var data = JSON.parse(rawData);
  const passenger = data.travellers[selectedTraveler];
  await new Promise(resolve => setTimeout(resolve, 1000));
  await util.commit(
    page,
    [
      {
        selector: "#LogInViewModel_Email",
        value: (row) => (row.email || emailAddress).split("/")[0],
      },

      {
        selector: "#LogInViewModel_Password",
        value: (row) => getPassword(row),
      },
    ],
    passenger
  );

  util.infoMessage(page, `Captcha ...`);
  const loginCaptchaValue = await util.SolveIamNotARobot(
    "#g-recaptcha-response",
    URLS.LOGIN,
    "6LcNy-0jAAAAAJDOXjYW4z7yV07DWyivFD1mmjek",
    abortController.signal
  );
  if (!loginCaptchaValue) {
    util.infoMessage(page, `Manual captcha required`);
    if ((loginRetries[selectedTraveler] || 0) < 3) {
      if (!loginRetries[selectedTraveler]) {
        loginRetries[selectedTraveler] = 0;
      }
      loginRetries[selectedTraveler] += 1;
      await loginPassenger(selectedTraveler);
    }
  } else {
    util.infoMessage(page, `Login ...`);
    const loginButtonSelector =
      "body > main > div.signup > div > div.container-lg.container-fluid.position-relative.h-100 > div > div > div.row > div > form > input.btn.btn-main.mt-5.w-100";
    await util.clickWhenReady(loginButtonSelector, page);
  }
}

async function uploadDocuments(selectedTraveler) {
  const passenger = data.travellers[selectedTraveler];
  const isPassportNotUploaded = await page.$("#passportPhoto");
  if (isPassportNotUploaded) {
    // await page.waitForSelector("#passportPhoto", {
    //   timeout: 0,
    // });

    const resizedPassportPath = await util.downloadAndResizeImage(
      passenger,
      400,
      800,
      "passport",
      400,
      1024,
      true
    );
    await util.commitFile("#passportPhoto", resizedPassportPath);
  }

  // const passportPath = path.join(
  //   util.passportsFolder,
  //   `${passenger.passportNumber}.jpg`
  // );
  // await util.downloadImage(passenger.images.passport, passportPath);

  // await util.commitFile("#passportPhoto", passportPath);

  const isPhotoNotUploaded = await page.$("#personalPhoto");
  if (isPhotoNotUploaded) {
    // await page.waitForSelector("#personalPhoto", {
    //   timeout: 0,
    // });

    // TODO: image not being resized to 15kb...
    const resizedPhotoPath = await util.downloadAndResizeImage(
      passenger,
      200,
      200,
      "photo",
      5,
      17,
      true
    );
    await util.commitFile("#personalPhoto", resizedPhotoPath);
  }
  // const photoPath = path.join(
  //   util.photosFolder,
  //   `${passenger.passportNumber}_photo.jpg`
  // );

  // await util.downloadImage(passenger.images.photo, photoPath);

  // await util.commitFile("#personalPhoto", photoPath);

  const isResidencyNotUploaded = await page.$("#residencyPhoto");

  if (isResidencyNotUploaded) {
    // residence upload
    try {
      // await page.waitForSelector("#residencyPhoto", {
      //   timeout: 0,
      // });

      // let residencyPath = path.join(
      //   util.residencyFolder,
      //   `${passenger.passportNumber}_res.jpg`
      // );
      // await util.downloadImage(
      //   passenger.images.residency || passenger.images.passport,
      //   residencyPath
      // );

      const residencyPath = await util.downloadAndResizeImage(
        passenger,
        400,
        800,
        "residency",
        400,
        1024,
        true
      );
      await util.commitFile("#residencyPhoto", residencyPath);
    } catch {
      const residencyPath2 = await util.downloadAndResizeImage(
        passenger,
        400,
        800,
        "passport",
        400,
        1024,
        true
      );

      await util.commitFile("#residencyPhoto", residencyPath2);
    }
  }
}

async function pasteSimulatedPassport() {
  const passenger = data.travellers[util.getSelectedTraveler()];
  await util.downloadImage(
    passenger.images.passport,
    getPath(`${passenger.passportNumber}.jpg`)
  );
  const fontName = "OCRB";
  // Text to be added at the bottom
  const textLine1 = passenger.codeline.split("\n")[0];
  const textLine2 = passenger.codeline.split("\n")[1];
  const encodedTextLine1 = textLine1.replace(/</g, "&lt;");
  const encodedTextLine2 = textLine2.replace(/</g, "&lt;");

  const height = 100;
  const mrzImage = `
<svg width="600" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background rectangle -->
  <rect fill="white" x="0" y="0" width="600" height="${height}" />
  <text x="40" y="50" font-family="${fontName}" font-size="16" fill="black">
  ${encodedTextLine1}
  </text>
  <text x="40" y="75" font-family="${fontName}" font-size="16" fill="black">
  ${encodedTextLine2}
  </text>
</svg>
`;

  const passportPathMrz = path.join(
    util.passportsFolder,
    `${passenger.passportNumber}_mrz.png`
  );
  const mrzBuffer = Buffer.from(mrzImage);
  await sharp(getPath(`${passenger.passportNumber}.jpg`))
    .resize(600, 400)
    .grayscale()
    .composite([
      {
        input: mrzBuffer,
        top: 300,
        left: 0,
      },
    ])
    .png()
    .toFile(passportPathMrz);

  await util.commitFile("#passportPhoto", passportPathMrz);
}

async function uploadFakePassport() {
  await page.waitForSelector("#personalPhoto");
  const blankPhotoPath = path.join(__dirname, "dummy-nusuk-hajj-photo.jpg");
  await util.commitFile("#personalPhoto", blankPhotoPath);

  await new Promise(resolve => setTimeout(resolve, 1000));


  await page.waitForSelector("#passportPhoto");
  const blankPassportPath = path.join(
    __dirname,
    "dummy-nusuk-hajj-passport.png"
  );
  await util.commitFile("#passportPhoto", blankPassportPath);
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `00:${minutes}:${secs}`;
}

async function pasteOTPCode(err, code) {
  if (err === "no-code") {
    setTimeout(async () => {
      if (emailCodeCounter < 50) {
        emailCodeCounter++;
        try {
          await page.waitForSelector("#hajonsoft-commander-alert");
          if (err.startsWith("Error:")) {
            await page.$eval(
              "#hajonsoft-commander-alert",
              (el, message) => (el.innerText = message),
              err
            );
            return;
          }
          await page.$eval(
            "#hajonsoft-commander-alert",
            (el, i) =>
              (el.innerText = `Checking email ${i}/00:02:30 فحص البريد`),
            formatTime(emailCodeCounter * 3)
          );
        } catch { }
        getOTPCode();
      }
    }, 3000);
    return;
  }
  if (err || !code) {
    try {
      await page.waitForSelector("#hajonsoft-commander-alert");
      if (err.startsWith("Error:")) {
        await page.$eval(
          "#hajonsoft-commander-alert",
          (el, message) => (el.innerText = message),
          err
        );
        return;
      }
      await page.$eval(
        "#hajonsoft-commander-alert",
        (el, i) =>
          (el.innerText = `Checking email ${i++}/50  فحص البريد الإلكتروني`),
        emailCodeCounter
      );
    } catch { }

    return;
  }
  if (codeUsed(code)) {
    return;
  }
  await util.commit(
    page,
    [
      {
        selector: "#otp-inputs > input.form-control.signup-otp.me-1",
        value: () => code,
      },
    ],
    {}
  );
}

async function pasteOTPCodeCompanion(err, code) {
  if (err === "no-code") {
    setTimeout(async () => {
      if (emailCodeCounter < 50) {
        emailCodeCounter++;
        try {
          await page.waitForSelector("#hajonsoft-commander-alert");
          if (err.startsWith("Error:")) {
            await page.$eval(
              "#hajonsoft-commander-alert",
              (el, message) => (el.innerText = message),
              err
            );
            return;
          }
          await page.$eval(
            "#hajonsoft-commander-alert",
            (el, i) =>
              (el.innerText = `Checking email ${i}/50  فحص البريد الإلكتروني`),
            emailCodeCounter
          );
        } catch { }
        getCompanionOTPCode();
      }
    }, 3000);
    return;
  }
  if (err || !code) {
    try {
      await page.waitForSelector("#hajonsoft-commander-alert");
      if (err.startsWith("Error:")) {
        await page.$eval(
          "#hajonsoft-commander-alert",
          (el, message) => (el.innerText = message),
          err
        );
        return;
      }
      await page.$eval(
        "#hajonsoft-commander-alert",
        (el, i) =>
          (el.innerText = `Checking email ${i++}/50  فحص البريد الإلكتروني`),
        emailCodeCounter
      );
    } catch { }

    return;
  }
  if (codeUsed(code)) {
    return;
  }
  await util.commit(
    page,
    [
      {
        selector: "#otp-inputs > input.form-control.form-input-otp.me-1",
        value: () => code,
      },
    ],
    {}
  );

  await util.clickWhenReady("#OTPModalBtn", page);
}

function getPassword(passenger) {
  return data.system.password;
}

async function closeAccountCreatedSuccessModal() {
  try {
    const isAccountCreatedModal = await page.$(
      "body > div.swal-overlay.swal-overlay--show-modal > div > div.swal-title"
    );
    if (isAccountCreatedModal) {
      await page.click(
        "body > div.swal-overlay.swal-overlay--show-modal > div > div.swal-footer > div > button"
      );
      return new Promise(resolve => setTimeout(resolve, 500));

    }
  } catch (e) {
    console.log(e);
  }
}

async function summaryResidence(selectedTraveler) {
  const passenger = data.travellers[selectedTraveler];
  checkIfNotChecked("#HaveValidResidencyYes");
  await util.commit(
    page,
    [
      {
        selector: "#BackgroundStepOneViewModel_ResidencyIdNumber",
        value: (row) => passenger.idNumber,
      },
    ],
    passenger
  );

  await page.$eval(
    "body > main > div.system > div > div.system-content.p-3 > form > div.row.mb-4 > div:nth-child(2) > div > label",
    (el, idNumber) => (el.innerText = "Residency ID Number: => " + idNumber),
    passenger.idNumber
  );

  if (passenger.idIssueDt) {
    await page.$eval(
      "body > main > div.system > div > div.system-content.p-3 > form > div.row.mb-4 > div:nth-child(3) > div > label",
      (el, issueDate) =>
        (el.innerText = "Residence ID Issue Date: => " + issueDate),
      passenger.idIssueDt.dmmmy
    );

    // await util.clickWhenReady(
    //   "#BackgroundStepOneViewModel_ResidenceIdIssueDate",
    //   page
    // );
    // await page.waitForSelector(
    //   "body > div.datepick-popup > div > div.datepick-month-row > div > div > select:nth-child(1)"
    // );
    // await page.select(
    //   "body > div.datepick-popup > div > div.datepick-month-row > div > div > select:nth-child(1)",
    //   "6/2024"
    // );
  }

  if (passenger.idExpireDt) {
    uncheckIfChecked("#expiryDateNotSpecified");
    await page.$eval(
      "body > main > div.system > div > div.system-content.p-3 > form > div.row.mb-4 > div:nth-child(4) > div.mb-3.datepicker-input > label",
      (el, expireDate) =>
        (el.innerText = "Residence ID Expiry Date: => " + expireDate),
      passenger.idExpireDt.dmmmy
    );
  } else {
    checkIfNotChecked("#expiryDateNotSpecified");
  }
}

async function completeRegistration(selectedTraveler) {
  const passenger = data.travellers[selectedTraveler];

  await checkIfNotChecked("#PassportSummaryViewModel_ConsentToAllAboveData");
  await checkIfNotChecked("#PassportSummaryViewModel_ConfirmAccuracyOfData");
  const nationality = nationalities.find(
    (n) =>
      n.name.toLowerCase().trim() ===
      passenger.nationality.name.toLowerCase().trim()
  )?.uuid;
  await util.commit(
    page,
    [
      {
        selector: "#PassportSummaryViewModel_FirstNameAr",
        value: (row) => row.nameArabic.first,
      },
      {
        selector: "#PassportSummaryViewModel_SecondNameAr",
        value: (row) => row.nameArabic.father,
      },
      {
        selector: "#PassportSummaryViewModel_MiddleNameAr",
        value: (row) => row.nameArabic.grand,
      },
      {
        selector: "#PassportSummaryViewModel_LastNameAr",
        value: (row) => row.nameArabic.last,
      },
      {
        selector: "#PassportSummaryViewModel_FirstNameEn",
        value: (row) => row.name.first,
      },
      {
        selector: "#PassportSummaryViewModel_SecondNameEn",
        value: (row) => row.name.father,
      },
      {
        selector: "#PassportSummaryViewModel_MiddleNameEn",
        value: (row) => row.name.grand,
      },
      {
        selector: "#PassportSummaryViewModel_LastNameEn",
        value: (row) => row.name.last,
      },
      {
        selector: "#PassportSummaryViewModel_BirthPlace",
        value: (row) => row.birthPlace,
      },
      {
        selector: "#PassportSummaryViewModel_IssueDate",
        value: (row) => row.issueDate,
      },
      {
        selector: "#PassportSummaryViewModel_IssuePlace",
        value: (row) => row.issuePlace,
      },
      {
        selector: "#PassportSummaryViewModel_PassportNumber",
        value: (row) => row.passportNumber,
      },
      {
        selector: "#PassportSummaryViewModel_GenderId",
        value: (row) =>
          row.gender === "Male"
            ? "24d70000-4100-0250-c0aa-08da85bad857"
            : "24d70000-4100-0250-08e6-08da85bae1e6",
      },
      {
        selector: "#PassportSummaryViewModel_PassportTypeId",
        value: (row) => "074240a9-e07f-4959-889d-b163c8743dad",
      },
      {
        selector: "#PassportSummaryViewModel_IssuePlace",
        value: (row) => row.placeOfIssue,
      },
      {
        selector: "#PassportSummaryViewModel_NationalityId",
        value: (row) => nationality,
      },
    ],
    passenger
  );

  await page.$eval(
    "#summary-from > div.system-content.p-3 > div.d-flex.flex-column-reverse.flex-lg-row.mb-5 > div.col-xl-9.col-lg-8 > div:nth-child(1) > ul > li:nth-child(11) > div > div.col-md-6.font-semibold.align-self-center",
    (el, birthPlace) => (el.innerText = `Birth Place: ${birthPlace}`),
    passenger.birthPlace
  );

  await page.$eval(
    "#summary-from > div.system-content.p-3 > div.d-flex.flex-column-reverse.flex-lg-row.mb-5 > div.col-xl-9.col-lg-8 > div:nth-child(1) > ul > li:nth-child(16) > div > div.col-md-6.font-semibold.align-self-center",
    (el, issueDate) => (el.innerText = `Issue Date: ${issueDate}`),
    passenger.passIssueDt.dmmmy
  );

  await page.$eval(
    "#summary-from > div.system-content.p-3 > div.d-flex.flex-column-reverse.flex-lg-row.mb-5 > div.col-xl-9.col-lg-8 > div:nth-child(1) > ul > li:nth-child(10) > div > div.col-md-6.font-semibold.align-self-center",
    (el, birthDate) => (el.innerText = `Birth Date: ${birthDate}`),
    passenger.dob.dmmmy
  );

  await page.$eval(
    "#summary-from > div.system-content.p-3 > div.d-flex.flex-column-reverse.flex-lg-row.mb-5 > div.col-xl-9.col-lg-8 > div:nth-child(1) > ul > li:nth-child(9) > div > div.col-md-6.font-semibold.align-self-center",
    (el, nationality) => (el.innerText = `Nationality: ${nationality}`),
    passenger.nationality.name
  );

  await page.$eval(
    "#summary-from > div.system-content.p-3 > div.d-flex.flex-column-reverse.flex-lg-row.mb-5 > div.col-xl-9.col-lg-8 > div:nth-child(1) > ul > li:nth-child(12) > div > div.col-md-6.font-semibold.align-self-center",
    (el, gender) => (el.innerText = `Gender: ${gender}`),
    passenger.gender
  );

  await page.$eval(
    "#summary-from > div.system-content.p-3 > div.d-flex.flex-column-reverse.flex-lg-row.mb-5 > div.col-xl-9.col-lg-8 > div:nth-child(1) > ul > li:nth-child(17) > div > div.col-md-6.font-semibold.align-self-center",
    (el, expireDate) => (el.innerText = `Expire Date: ${expireDate}`),
    passenger.passExpireDt.dmmmy
  );

  await page.$eval(
    "#summary-from > div.system-content.p-3 > div.d-flex.flex-column-reverse.flex-lg-row.mb-5 > div.col-xl-9.col-lg-8 > div:nth-child(1) > ul > li:nth-child(14) > div > div.col-md-6.font-semibold.align-self-center",
    (el, passportNumber) => (el.innerText = `Passport No: ${passportNumber}`),
    passenger.passportNumber
  );

  await page.$eval(
    "#summary-from > div.system-content.p-3 > div.d-flex.flex-column-reverse.flex-lg-row.mb-5 > div.col-xl-9.col-lg-8 > div:nth-child(1) > ul > li:nth-child(15) > div > div.col-md-6.font-semibold.align-self-center",
    (el, issuePlace) => (el.innerText = `Issue Place: ${issuePlace}`),
    passenger.placeOfIssue
  );

  kea.updatePassenger(data.system.accountId, passenger.passportNumber, {
    "submissionData.nsh.status": "Submitted",
  });
}

function canGetCode(email, domain) {
  if (email.includes(domain)) {
    return true;
  }
  return false;
}

async function runParallel() {
  const leads = data.travellers.filter(
    (traveller) =>
      !traveller.isCompanion &&
      traveller.email &&
      !traveller.email.includes(".companion")
  );
  // get screenWidth and height of the page
  const monitorWidth = await page.evaluate(() => screen.width);
  const monitorHeight = await page.evaluate(() => screen.height);
  const commands = [];
  for (let index = 0; index < Math.min(leads.length, 15); index++) {
    const passenger = leads[index];
    const newArgs = process.argv.map((v) => {
      if (v.includes("/node") || v.includes("\\node")) {
        return `"${v}"`;
      }
      if (v.includes("hajonsoft-eagle")) {
        return `"${v}"`;
      }
      if (v.startsWith("--submissionId")) {
        return `${v} --passengerIds=${passenger.id
          } --auto -windowed --index=${index}/${Math.min(
            leads.length,
            15
          )} --monitor-width=${monitorWidth} --monitor-height=${monitorHeight}`;
      }
      if (v.startsWith("--passengerId")) {
        return ``;
      }
      return v;
    });
    const command = newArgs.join(" ");
    console.log("📢[nsh.js:1517]: command: ", command);
    commands.push(command);
    childProcess.exec(command, function (error, stdout, stderr) {
      if (error) {
        console.log("Parallel Run Error: " + error.code);
      }
      if (stdout) {
        console.log("Parallel Run: " + stdout);
      }
      if (stderr) {
        console.log("Parallel Run: " + stderr);
      }
    });
  }
  // const newCommand = commands.join(" & ");
  // console.log("📢[nsh.js:1491]: oneCommand: ", newCommand);
  // run the command using child process

  await page.browser().close();
}

module.exports = { send };
