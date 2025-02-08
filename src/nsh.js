const puppeteer = require("puppeteer-extra");
// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());
const fs = require("fs");
const path = require("path");
const util = require("./util");
const { getPath } = require("./lib/getPath");
const moment = require("moment");
const os = require('os');
const kea = require("./lib/kea");
const budgie = require("./budgie");
const { fetchOTPFromNusuk } = require("./lib/imap");
const { nusukNationalities: nationalities } = require("./data/nationalities");
const childProcess = require("child_process");
const sharp = require("sharp");
const registerCaptchaAbortController = new AbortController();
const loginCaptchaAbortController = new AbortController();
const { labeler } = require('./lib/labeler')
const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    for (const config of iface) {
      if (config.family === 'IPv4' && !config.internal) {
        return config.address;
      }
    }
  }
  return 'No external IPv4 found';
};

console.log(`Machine IP: ${getLocalIP()}`);

let page;
let data;
let counter = 0;
let emailAddress;
let telephoneNumber;
let manualMode;
const verifyClicked = {};
const loginRetries = {};
const clicked = {};
let uploadDocumentRetries = 0;
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
  SUCCESS: "https://hajj.nusuk.sa/registration/completed",
  MEMBERS: "https://hajj.nusuk.sa/profile/myfamily/members",
  SIGNOUT: "https://hajj.nusuk.sa/Account/Signout",
  DASHBOARD: "https://hajj.nusuk.sa/profile/dashboard",
  PACKAGE_SUMMARY: "https://hajj.nusuk.sa/sp/package/summary/[0-9a-f-]+",
  CONFIGURE_PACKAGE: "https://hajj.nusuk.sa/package/[0-9a-f-]+/booking/rooms/configure",
  ADDITIONAL_SERVICES: "https://hajj.nusuk.sa/package/[0-9a-f-]+/booking/[0-9a-f-]+/services/configure",
  CONFIGURE_ADDITIONAL_SERVICES: "https://hajj.nusuk.sa/package/[0-9a-f-]+/booking/[0-9a-f-]+/services/configure",
  CONFIGURE_FLIGHTS: "https://hajj.nusuk.sa/package/[0-9a-f-]+/booking/[0-9a-f-]+/flights/configure",
  CONFIGURE_TRANSPORTATION: "https://hajj.nusuk.sa/package/[0-9a-f-]+/booking/[0-9a-f-]+/transportation/configure",
  CONFIGURE_TRANSPORTATIONS: "https://hajj.nusuk.sa/package/[0-9a-f-]+/booking/[0-9a-f-]+/transportations/configure",
  SAVE_CONFIGURATION: "https://hajj.nusuk.sa/package/[0-9a-f-]+/booking/[0-9a-f-]+/checkout"
};

function getOTPEmailAddress(email) {
  // if (
  //   email.includes(".gmail") ||
  //   email.includes(".yahoo") ||
  //   email.includes(".outlook")
  // ) {
  //   const domain = data.system.username.includes("@")
  //     ? data.system.username.split("@")[1]
  //     : data.system.username;
  //   return `admin@${domain}`;
  // }
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
    focus: "#rc-anchor-container > div.rc-anchor-content"
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
    focus: "#LogInViewModel_Email"
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
  {
    name: "dashboard",
    regex: URLS.DASHBOARD,
  },
  {
    name: "package-summary",
    regex: URLS.PACKAGE_SUMMARY,
  },
  {
    name: "configure-package",
    regex: URLS.CONFIGURE_PACKAGE,
  },
  {
    name: "additional-services",
    regex: URLS.ADDITIONAL_SERVICES,
  },
  {
    name: "configure-additional-services",
    regex: URLS.CONFIGURE_ADDITIONAL_SERVICES,
  },
  {
    name: "configure-flights",
    regex: URLS.CONFIGURE_FLIGHTS,
  },
  {
    name: "configure-transportation",
    regex: URLS.CONFIGURE_TRANSPORTATION,
  },
  {
    name: "configure-transportations",
    regex: URLS.CONFIGURE_TRANSPORTATIONS,
  },
  {
    name: "save-configuration",
    regex: URLS.SAVE_CONFIGURATION,
  }
];

async function send(sendData) {
  data = sendData;
  page = await util.initPage(config, onContentLoaded);
  await page.goto(config[0].url, { waitUntil: "domcontentloaded" });
}
let timeoutId;
const MAX_WAIT_TIME_MS = 600000;
const handleTimeout = async () => {
  console.error("Timeout occurred: onContentLoaded not triggered within 10 minutes.");
  await takeScreenShot();
  await page.browser().close();
  process.exit(0);
};

function readSubmissionGorilla() {
  if (!data.system.gorillaScript) {
    return;
  }
  try {
    const gorillaJSON = JSON.parse(data.system.gorillaScript);
    if (gorillaJSON?.disabled) {
      return;
    }
    global.submissionGorilla = gorillaJSON;
    console.log("submission gorilla loaded", global.submissionGorilla);
  } catch (error) {
  }
}
async function onContentLoaded(res) {
  clearTimeout(timeoutId);
  timeoutId = setTimeout(handleTimeout, MAX_WAIT_TIME_MS);
  counter = util.useCounter(counter);
  if (counter >= data?.travellers?.length) {
    util.setCounter(0);
    if (fs.existsSync(getPath("loop.txt"))) {
      fs.unlinkSync(getPath("loop.txt"));
    }
  }
  const pageUrl = await page.url();
  console.log("🚀 ~ file: nsh.js ~ line 139 ~ onContentLoaded ~ pageUrl", pageUrl);
  readSubmissionGorilla();
  const beforeGorillaConfig = await util.findGorillaConfig(pageUrl, data.system.gorillaScript);
  if (beforeGorillaConfig?.executeBefore) {
    try {
      await gorillaHandler(beforeGorillaConfig);
    } catch (err) {
      console.log(err);
    }
  }
  const currentConfig = util.findConfig(pageUrl, config);
  try {
    await pageContentHandler(currentConfig);
  } catch (err) {
    console.log(err);
  }

  const afterGorillaConfig = await util.findGorillaConfig(pageUrl, data.system.gorillaScript);
  if (afterGorillaConfig && !afterGorillaConfig.executeBefore) {
    try {
      await gorillaHandler(afterGorillaConfig);
    } catch (err) {
      console.log(err);
    }
  }
}

// TODO: Refactor instead of a big switch case, see what other options you could utilize.
async function pageContentHandler(currentConfig) {
  const passenger = data.travellers[util.getSelectedTraveler()];
  // TODO: Create configHandler function that checks if there is a controller and execute it, if screen shot is expected,
  // if a scroll is expected
  if (currentConfig.controller) {
    await util.controller(page, currentConfig, data.travellers);
  }
  if (currentConfig.focus) {
    try {
      await page.$eval(
        currentConfig.focus,
        (el) => el.scrollIntoView({ behavior: "smooth", block: "start" })
      );
    } catch {
    }
  }
  switch (currentConfig.name) {
    case "home":
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
      if (global.headless || global.visualHeadless) {
        if (passenger.isCompanion) {
          console.log("can not login as a companion")
          await page.browser().close();
          return;
        }
        await loginOrRegister(util.getSelectedTraveler());
        return;
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
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      if (!manualMode) {
        manualMode = currentConfig.name;
      }
      if (fs.existsSync(getPath("loop.txt"))) {
        await signup_step1(util.getSelectedTraveler());
      }
      await signup_step1(util.getSelectedTraveler());
      break;
    case "verify-register-email":
      emailCodeCounter = 0;
      // stop captcha attempts
      // registerCaptchaAbortController.abort();
      // loginCaptchaAbortController.abort();

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
        await kea.updatePassenger(data.system.accountId, passenger.passportNumber, {
          email: passenger.email,
          phone: passenger.mobileNumber,
        });
        clicked[currentConfig.name] = {};
        clicked[currentConfig.name][passenger.passportNumber] = true;
      }
      break;
    case "register":
      await page.evaluate(() => {
        document.scrollTo(0, document.body.scrollHeight);
      });
      if (!manualMode) {
        manualMode = currentConfig.name;
      }
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
      // This code seems to be ok, just in case you think about it again, you are not supposed to come here if the manual mode is register
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
      await completeRegistration(util.getSelectedTraveler());
      break;
    case "contact":
      // review telephone number
      await util.commit(
        page,
        [
          {
            selector: "#ContactDetailsViewModel_Contact_MobileNumber",
            value: () => telephoneNumber || passenger.mobileNumber || suggestPhoneNumber(util.getSelectedTraveler()),
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
      // await util.clickWhenReady(
      //   "#ContactDetailsViewModel_Arrival_ExpectedEntryDate",
      //   page
      // );
      // await page.waitForSelector(
      //   "body > div.datepick-popup > div > div.datepick-month-row > div > div > select:nth-child(1)"
      // );
      // await page.select(
      //   "body > div.datepick-popup > div > div.datepick-month-row > div > div > select:nth-child(1)",
      //   "6/2024"
      // );
      // wait 500 ms for the days to load, then select the day
      await new Promise(resolve => setTimeout(resolve, 500));

      // await page.click(
      //   "body > div.datepick-popup > div > div.datepick-month-row > div > table > tbody > tr:nth-child(2) > td:nth-child(6) > a"
      // );
      if (global.headless || global.visualHeadless) {
        const nextSelector = "body > main > div.system > div > form > div.d-flex.align-items-md-center.justify-content-md-between.px-3.mb-4.flex-wrap.flex-column-reverse.flex-md-row > div.d-flex.justify-content-end.order-md-2.next-buttons > div > button.btn.btn-main.btn-next.mb-3";
        try {
          await page.waitForSelector(nextSelector)
          await page.click(nextSelector);
        } catch { }
      }
      break;
    case "summary":
      // if (passenger.nationality.code !== data.system.country.code) {
      //   await summaryResidence(util.getSelectedTraveler());
      // } else {
      //   await checkIfNotChecked("#HaveValidResidencyNo");
      // }
      await checkIfNotChecked("#PreviouslyReceivedVisaEnterKSANo");
      await checkIfNotChecked("#PreviousKSAVisaRejectionNo");
      await checkIfNotChecked("#PassportHasRestrictionForOneTripNo");
      await checkIfNotChecked("#HaveRelativesResigingInKSANo");
      await checkIfNotChecked("#HoldOtherNationalitiesNo");
      await checkIfNotChecked("#TraveledToOtherCountriesNo");
      if (global.headless || global.visualHeadless) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const nextSelector = "body > main > div.system > div > div.system-content.p-3 > form > div.d-flex.align-items-md-center.justify-content-md-between.mb-4.flex-wrap.flex-column-reverse.flex-md-row > div.ms-auto.order-md-2.next-buttons > div > button.btn.btn-main.btn-next.mb-3";
        try {
          await page.waitForSelector(nextSelector)
          await page.click(nextSelector);
        } catch { }
      }
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
      if (global.headless || global.visualHeadless) {
        const nextSelector = "body > main > div.system > div > div.system-content.p-3 > form > div.d-flex.align-items-md-center.justify-content-md-between.mb-4.flex-wrap.flex-column-reverse.flex-md-row > div.ms-auto.order-md-2.next-buttons > div > button.btn.btn-main.btn-next.mb-3";
        try {
          await page.waitForSelector(nextSelector)
          await page.click(nextSelector);
        } catch { }
      }
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
      await page.evaluate(() => {
        // Get all elements with an ID ending in "No"
        const radioButtons = document.querySelectorAll('[id$="No"]');

        // Iterate over each element and click it
        radioButtons.forEach((radioButton) => {
          radioButton.click();
        });
      });
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
      if (global.headless || global.visualHeadless) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const nextSelector = "body > main > div.system > div > form > div.d-flex.align-items-md-center.justify-content-md-between.px-3.mb-4.flex-wrap.flex-column-reverse.flex-md-row > div.ms-auto.order-md-2.next-buttons > div > button.btn.btn-main.btn-next.mb-3";
        try {
          await page.waitForSelector(nextSelector)
          await page.click(nextSelector);
        } catch { }
      }
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
      if (global.headless || global.visualHeadless) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const nextSelector = "body > main > div.system > div > form > div.d-flex.align-items-md-center.justify-content-md-between.px-3.mb-4.flex-wrap.flex-column-reverse.flex-md-row > div.ms-auto.order-md-2.next-buttons > div > button.btn.btn-submit.font-semibold.text-white.mb-3";
        try {
          await page.waitForSelector(nextSelector)
          await page.click(nextSelector);
        } catch { }
      }
      break;
    case "upload-documents":
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
        !clicked[passenger.passportNumber + "documents"]
      ) {
        clicked[passenger.passportNumber + "documents"] = true;
        await uploadDocuments(util.getSelectedTraveler());
      }
      if (global.headless || global.visualHeadless) {
        // wait for 5 seconds
        await new Promise(resolve => setTimeout(resolve, 5000));
        await page.click("#next-btn")
      }
      // Do you have residence Id
      // await util.clickWhenReady("#HaveValidResidencyNo", page);
      break;
    case "login":
      if (global.headless || global.visualHeadless) {
        if (passenger.mofaNumber?.startsWith("PENDING")) {
          console.log("🚦 passenger", passenger.slug, "Has PENDING Application, Please clear MOFA# field to try again");
          await page.browser().close();
          process.exit(0);
        }
      }
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
      await loginPassenger(util.getSelectedTraveler());
      break;

    case "success":
      if (global.headless || global.visualHeadless) {
        await page.goto("https://hajj.nusuk.sa/profile/myfamily/members")
      }

      // logout after 10 seconds if the user did not go to another page
      setTimeout(async () => {
        const currentUrl = await page.url();
        if (currentUrl === URLS.SUCCESS && !process.argv.includes("--auto")) {
          await page.goto("https://hajj.nusuk.sa/Account/SignOut");
        }
      }, 10000);
      break;
    case "members":
      if (global.headless || global.visualHeadless) {
        if (data.travellers.length > 1) {
          // get all registered family members
          await page.waitForSelector('#members-container');
          // Extract names inside <h6> elements
          const passengerNames = await page.evaluate(() => {
            const container = document.querySelector('#members-container');
            if (!container) return [];

            // Select all the child divs
            const childDivs = container.querySelectorAll('div');

            // Iterate over the divs and extract the <h6> text
            const names = [];
            childDivs.forEach(child => {
              const h6Element = child.querySelector('div.col-12.col-md-6.col-lg-6 > a > h6');
              if (h6Element) {
                names.push(h6Element.innerText.trim());
              }
            });

            return names;
          });
          while (true) {
            util.incrementSelectedTraveler(); // Move to the next traveler
            const currentPassenger = data.travellers[util.getSelectedTraveler()]; // Get the current traveler

            // Combine first and last name to match the format in passengerNames
            const fullName = `${currentPassenger.name.first} ${currentPassenger.name.last}`.trim();

            // Check if the full name exists in the passengerNames array
            if (!passengerNames.includes(fullName)) {
              // If not found, call addNewMember and break the loop
              await addNewMember(util.getSelectedTraveler());
              break;
            }

            // Optional safeguard to prevent infinite loops
            if (util.getSelectedTraveler() >= data.travellers.length - 1) {
              await takeScreenShot();
              console.error("No family members found to add.");
              await page.browser().close();
              process.exit(0);
              break;
            }
          }
        } else {
          await takeScreenShot();
          await page.browser().close();
          process.exit(0);
          break;
        }
      }
      break;
    case "signout":
      util.incrementSelectedTraveler();
      break;
    case "dashboard":
      if (global.headless || global.visualHeadless) {
        // put the package into the cart if the payment is not requested. if payment instruction is present then do not change the package
        try {
          if (global.submissionGorilla?.package && !global.submissionGorilla?.pay) {
            const packageId = global.submissionGorilla.package.split("/").pop();
            console.log("🚀 ~ file: nsh.js ~ line 139 ~ onContentLoaded ~ packageId", packageId);
            await page.goto(`https://hajj.nusuk.sa/package/${packageId}/booking/rooms/configure`);
            return;
          }
        } catch { }
        try {
          const bookingDetailsButtonTextSelector = "body > main > div.container-xxl.container-fluid.py-4 > div:nth-child(3) > div.col-12.col-xl-8.main-content > div.row.cards > div:nth-child(1) > div > div > div > div:nth-child(4) > div > div.text-end > a > span";
          const bookingDetailsButtonText = await page.$eval(
            bookingDetailsButtonTextSelector,
            (el) => { if (el) { return el.textContent } else { return null } }
          );

          if (bookingDetailsButtonText?.includes("Booking Details")) {
            const href = await page.$eval("body > main > div.container-xxl.container-fluid.py-4 > div:nth-child(3) > div.col-12.col-xl-8.main-content > div.row.cards > div:nth-child(1) > div > div > div > div:nth-child(4) > div > div.text-end > a", (el) => el.href);
            await page.goto(href);
            return;
          }
        } catch {
          await takeScreenShot();
          await page.browser().close();
          process.exit(0);
        }
      }
      break;
    case "package-summary":
      if (global.submissionGorilla?.package) {
        const packageId = global.submissionGorilla.package.split("/").pop();
        console.log("🚀 ~ file: nsh.js ~ line 139 ~ onContentLoaded ~ packageId", packageId);
        await page.goto(`https://hajj.nusuk.sa/package/${packageId}/booking/rooms/configure`);
        return;
      }
      break;
    case "configure-package":
      if (global.submissionGorilla?.makkah) {
        const makkahBeds = global.submissionGorilla.makkah.split(",");
        const makkahSingle = makkahBeds[0];
        const makkahDouble = makkahBeds[1];
        const makkahTriple = makkahBeds[2];
        const makkahQuad = makkahBeds[3];
        await configureBeds(makkahSingle, passenger, "#divMakkahWrapper > div:nth-child(1) > div.px-2.fs_12.d-flex.justify-content-center.quantity-controls.mt-2.mt-lg-1 > div > button.btn.border-0.bg-lightgrey.p-0.rounded-1.ms-2.add-quantity")
        await configureBeds(makkahDouble, passenger, "#divMakkahWrapper > div:nth-child(2) > div.px-2.fs_12.d-flex.justify-content-center.quantity-controls.mt-2.mt-lg-1 > div > button.btn.border-0.bg-lightgrey.p-0.rounded-1.ms-2.add-quantity")
        await configureBeds(makkahTriple, passenger, "#divMakkahWrapper > div:nth-child(3) > div.px-2.fs_12.d-flex.justify-content-center.quantity-controls.mt-2.mt-lg-1 > div > button.btn.border-0.bg-lightgrey.p-0.rounded-1.ms-2.add-quantity")
        await configureBeds(makkahQuad, passenger, "#divMakkahWrapper > div:nth-child(4) > div.px-2.fs_12.d-flex.justify-content-center.quantity-controls.mt-2.mt-lg-1 > div > button.btn.border-0.bg-lightgrey.p-0.rounded-1.ms-2.add-quantity")
        // apply the same to shifting
        await configureBeds(makkahSingle, passenger, "#divMakkahShiftingWrapper > div:nth-child(1) > div.px-2.fs_12.d-flex.justify-content-center.quantity-controls.mt-2.mt-lg-1 > div > button.btn.border-0.bg-lightgrey.p-0.rounded-1.ms-2.add-quantity")
        await configureBeds(makkahDouble, passenger, "#divMakkahShiftingWrapper > div:nth-child(2) > div.px-2.fs_12.d-flex.justify-content-center.quantity-controls.mt-2.mt-lg-1 > div > button.btn.border-0.bg-lightgrey.p-0.rounded-1.ms-2.add-quantity")
        await configureBeds(makkahTriple, passenger, "#divMakkahShiftingWrapper > div:nth-child(3) > div.px-2.fs_12.d-flex.justify-content-center.quantity-controls.mt-2.mt-lg-1 > div > button.btn.border-0.bg-lightgrey.p-0.rounded-1.ms-2.add-quantity")
        await configureBeds(makkahQuad, passenger, "#divMakkahShiftingWrapper > div:nth-child(4) > div.px-2.fs_12.d-flex.justify-content-center.quantity-controls.mt-2.mt-lg-1 > div > button.btn.border-0.bg-lightgrey.p-0.rounded-1.ms-2.add-quantity")

      }
      if (global.submissionGorilla?.madinah) {
        const madinahBeds = global.submissionGorilla.madinah.split(",");
        const madinahSingle = madinahBeds[0];
        const madinahDouble = madinahBeds[1];
        const madinahTriple = madinahBeds[2];
        const madinahQuad = madinahBeds[3];
        await configureBeds(madinahSingle, passenger, "#divMadinahWrapper > div:nth-child(1) > div.px-2.fs_12.d-flex.justify-content-center.quantity-controls.mt-2.mt-lg-1 > div > button.btn.border-0.bg-lightgrey.p-0.rounded-1.ms-2.add-quantity")
        await configureBeds(madinahDouble, passenger, "#divMadinahWrapper > div:nth-child(2) > div.px-2.fs_12.d-flex.justify-content-center.quantity-controls.mt-2.mt-lg-1 > div > button.btn.border-0.bg-lightgrey.p-0.rounded-1.ms-2.add-quantity")
        await configureBeds(madinahTriple, passenger, "#divMadinahWrapper > div:nth-child(3) > div.px-2.fs_12.d-flex.justify-content-center.quantity-controls.mt-2.mt-lg-1 > div > button.btn.border-0.bg-lightgrey.p-0.rounded-1.ms-2.add-quantity")
        await configureBeds(madinahQuad, passenger, "#divMadinahWrapper > div:nth-child(4) > div.px-2.fs_12.d-flex.justify-content-center.quantity-controls.mt-2.mt-lg-1 > div > button.btn.border-0.bg-lightgrey.p-0.rounded-1.ms-2.add-quantity")
      }
      await takeScreenShot();
      await page.waitForSelector("#roomingConfig > div > div > div.page-container.px-4.pt-4.px-xl-5.pt-md-5 > div.row.mt-4 > div > div.stepper-container > div.mt-lg-4.pt-4.px-3.px-lg-0 > div > button")
      await page.click("#roomingConfig > div > div > div.page-container.px-4.pt-4.px-xl-5.pt-md-5 > div.row.mt-4 > div > div.stepper-container > div.mt-lg-4.pt-4.px-3.px-lg-0 > div > button")
      await new Promise(resolve => setTimeout(resolve, 2000));
      try {
        const modal = await page.$(`body > div.swal-overlay.swal-overlay--show-modal > div`);
        if (modal) {
          await page.click("body > div.swal-overlay.swal-overlay--show-modal > div > div.swal-footer > div > button");
        }
      } catch { }
      // find this cart selector and get the href and visit it
      // body > header > nav > div > div.d-flex.align-items-center.d-lg-none > div > div > div > div > a.btn.btn-main.x-small.d-block.d-sm-inline-block.d-md-block.px-1.w-100.py-2

      try {
        const href = await page.$eval("body > header > nav > div > div.d-flex.align-items-center.d-lg-none > div > div > div > div > a.btn.btn-main.x-small.d-block.d-sm-inline-block.d-md-block.px-1.w-100.py-2", (el) => el.href);
        await page.goto(href);
      } catch { }
      break;
    case "additional-services":
      await page.click("#roomingConfig > div > div > div.page-container.px-4.pt-4.px-xl-5.pt-md-5 > div.row.mt-4 > div > div > div.mt-lg-4.pt-4.px-3.px-lg-0 > div > button")
      if (global.headless || global.visualHeadless) {
        await page.browser().close();
        process.exit(0);
      }
      break;
    case "configure-additional-services":
      await page.click("#roomingConfig > div > div > div.page-container.px-4.pt-4.px-xl-5.pt-md-5 > div.row.mt-4 > div > div > div.mt-lg-4.pt-4.px-3.px-lg-0 > div > button")
      break;
    case "configure-flights":
      break;
    case "configure-transportation":
    case "configure-transportations":
      await page.click("#nextButton")
      break;
    case "save-configuration":
      // Once here click the pay button
      const walletBalanceRaw = await page.$eval("#purchaseDetailsDiv > div.purchase-details > div.total-area > div.row.mt-3 > div > div > div > div.col.text-end.total-price > span", el => el.textContent);
      const walletBalance = parseFloat(walletBalanceRaw.replace("SAR", "").trim());
      const totalPriceRaw = await page.$eval("#purchaseDetailsDiv > div.purchase-details > div.total-area > div:nth-child(4) > div.col.text-end.total-price > span", el => el.textContent);
      const totalPrice = parseFloat(totalPriceRaw.replace("SAR", "").trim());
      await takeScreenShot();
      if (walletBalance >= totalPrice) {
        console.log("Wallet balance is enough to pay", walletBalanceRaw, ">", totalPriceRaw);
        await provokeMaleGorilla();
      } else {
        console.log("Wallet balance is not enough to pay", walletBalanceRaw, "<", totalPriceRaw);
        await page.browser().close();
        process.exit(0);
      }
      break;
    default:
      break;
  }
}

async function provokeMaleGorilla() {
  if (!global.submissionGorilla?.pay) {
    return;
  }
  const [button] = await page.$x("//button[text()='Purchase Package']");
  if (button) {
    await button.click();
    console.log("Clicked 'Purchase Package' button.");
  } else {
    console.log("'Purchase Package' button not found.");
  }
  await takeScreenShot();
  for (let i = 0; i < 20; i++) {
    const gorilla = kea.getGorilla();
    console.log("🚀 ~ file: nsh.js ~ line 139 ~ onContentLoaded ~ gorilla", gorilla);
    if (gorilla) {
      await gorillaHandler(gorilla);
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 30000));

  }
}
async function configureBeds(bedCount, passenger, selector) {
  try {
    const disabledSelector = `${selector}.disabled`;

    // Check if the "disabled" selector is present
    const isDisabled = await page.$(disabledSelector);
    if (isDisabled) {
      console.log("Button is disabled. Exiting function.");
    }
  } catch {
  }
  try {
    if (bedCount) {
      let bedCountInt = 0;
      if (bedCount === "*") {
        bedCountInt = (passenger.companionsCount ?? 0) + 1;
      } else {
        bedCountInt = parseInt(bedCount, 10); // Ensure roomCount is parsed as an integer
      }
      for (let i = 0; i < bedCountInt; i++) {
        // Use $eval with proper logic to click the button
        await page.$eval(selector, (el) => {
          if (el) {
            el.click();
          } else {
            console.error("Element not found for selector:", selector);
          }
        });

        // Wait 1 second between clicks to mimic natural interaction
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  } catch { }
}

const gorillaMemory = {};
async function takeScreenShot(elementSelector) {
  const passenger = data.travellers[util.getSelectedTraveler()]; // Get the current traveler
  // screen shot and save it as the visa picture
  let screenshotElement = await page.$("body");
  if (elementSelector) {
    screenshotElement = await page.$(elementSelector);
  }
  await new Promise(resolve => setTimeout(resolve, 1000));
  // save screenshot to kea
  try {
    await util.screenShotToKea(
      screenshotElement,
      data.system.accountId,
      passenger,
      "Embassy"
    );
  } catch (error) { }
  await new Promise(resolve => setTimeout(resolve, 1000));
}

async function gorillaHandler(gorillaConfig) {
  console.log(gorillaConfig)
  const actions = gorillaConfig?.actions;


  for (const action of actions) {
    if (gorillaMemory[action.id]) {
      continue;
    }
    gorillaMemory[action.id] = true;
    if (action.goto) {
      await page.goto(action.goto)
      return;
    }
    if (action.timeout) {
      await new Promise(resolve => setTimeout(resolve, action.timeout));
    }
    if (action.type) {
      await util.commit(
        page,
        [
          {
            selector: action.selector,
            value: () => action.type,
          },
        ],
        {}
      );
    }
    //TODO: check x selector and they will always start with // and check how to wait for it and how to find it and click it, is it always an array
    if (action.click) {
      if (action.wait) {
        if (selector.startsWith("//")) {

        } else {
          await page.waitForSelector(action.selector)
        }
      }
      if (selector.startsWith("//")) {
        const [element] = await page.$x(action.selector);
        await page.click(element)
      } else {
        await page.click(action.selector)
      }
    }
    if (action.screenshot) {
      await takeScreenShot();
    }
  }

}

async function handleDialogBox(passenger, saveReason = true) {
  try {
    // Define selectors for modal text, title, and the OK button
    const modalContentSelector = "body > div.swal-overlay.swal-overlay--show-modal > div > div.swal-text";
    const modalTitleSelector = "body > div.swal-overlay.swal-overlay--show-modal > div > div.swal-title";
    const okButtonSelector = "body > div.swal-overlay.swal-overlay--show-modal > div > div.swal-footer > div > button";

    // Wait for the OK button to appear (indicating the dialog is present)
    await page.waitForSelector(okButtonSelector, { timeout: 5000 }).catch(() => {
      console.warn("Dialog box did not appear.");
      return null;
    });

    // Check for text content
    const modalContent = await page.$eval(modalContentSelector, (e) => e.textContent.trim()).catch(() => null);

    // Check for title content if the text is empty
    const modalTitle = !modalContent
      ? await page.$eval(modalTitleSelector, (e) => e.textContent.trim()).catch(() => null)
      : null;

    // Determine the rejection reason
    const rejectionReason = modalContent || modalTitle;

    if (rejectionReason) {
      console.log(`Rejection Reason: ${rejectionReason}`);

      // Update passenger status and rejection reason
      if (rejectionReason.includes("The applicant already has pending application")) {
        // close the browser and exit
        await kea.updatePassenger(
          data.system.accountId,
          passenger.passportNumber,
          {
            "submissionData.nsk.status": "Rejected",
            "submissionData.nsk.rejectionReason": rejectionReason,
            mofaNumber: `PENDING-${moment().format('DD-MMM-YY')}`,
          }
        );
        await page.browser().close();
        process.exit(0);
      } else {
        await kea.updatePassenger(
          data.system.accountId,
          passenger.passportNumber,
          {
            "submissionData.nsk.status": "Rejected",
            "submissionData.nsk.rejectionReason": rejectionReason,
          }
        );
      }
    } else {
      console.warn("No rejection reason found in the dialog box.");
      return null;
    }

    // Click the "OK" button to close the dialog
    await page.click(okButtonSelector);
    return rejectionReason;
  } catch (error) {
    console.error("Error handling dialog box:", error);
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
// Function to generate a valid phone number
function suggestPhoneNumber(selectedTraveler) {
  const passenger = data.travellers[selectedTraveler];

  // If the traveler already has a mobile number, return it
  if (passenger.mobileNumber) {
    return passenger.mobileNumber;
  }

  // Get the USA area code 949 (as an example)
  const areaCode = '949';

  // Generate a valid phone number based on the current time
  let generatedPhoneNumber = generateSequentialPhoneNumber(areaCode);

  // Ensure the number fits the required length of 20
  if (generatedPhoneNumber.length <= 20) {
    return generatedPhoneNumber;
  }

  const suggestedPhoneNumber = generatedPhoneNumber.slice(0, 20);
  console.log(`Suggested phone number: ${suggestedPhoneNumber}`);
  // If too long, slice to fit within max length
  return suggestedPhoneNumber;
}

// Helper function to generate a sequential phone number based on the current date and time
function generateSequentialPhoneNumber(areaCode) {
  const now = new Date();
  const day = now.getDate().toString(); // Day in DD format
  const hour = now.getHours().toString().padStart(2, '0'); // Hour in HH format
  const minute = now.getMinutes().toString().padStart(2, '0'); // Minute in MM format
  const second = now.getSeconds().toString().padStart(2, '0'); // Second in SS format


  // Generate a number between 2 and 9 based on the current day
  const hashedDay = (day % 8) + 2; // Map the day (1-31) to a number between 2 and 9

  // Construct the full phone number (e.g., +19492911879)
  const phoneNumber = `+1${areaCode}${hashedDay}${hour}${minute}${second}`;

  return phoneNumber;
}
// TODO: Make it accept an array and recall itself in case of array. paralleize when possible
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
    `from (admin@${data.system.username.replace("@", "")})`
  );
  try {
    if (pageMode.includes("Registration") || pageMode.includes("التسجيل")) {
      await fetchOTPFromNusuk(
        getOTPEmailAddress((passenger.email || emailAddress).split("/")[0]),
        data.system.adminEmailPassword,
        ["Email Activation", "تفعيل البريد الالكتروني"],
        pasteOTPCode,
        data.system.username.replace("@", "")
      );
    } else if (
      pageMode.includes("OTP Verification") ||
      pageMode.includes("التثبت من رمز التحقق")
    ) {
      await fetchOTPFromNusuk(
        getOTPEmailAddress((passenger.email || emailAddress).split("/")[0]),
        data.system.adminEmailPassword,
        ["One Time Password", "رمز سري لمرة واحدة"],
        pasteOTPCode,
        data.system.username.replace("@", "")
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
      data.system.adminEmailPassword,
      ["One Time Password", "رمز سري لمرة واحدة"],
      pasteOTPCodeCompanion,
      data.system.username.replace("@", "")
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
    (el, params) =>
      (el.innerText = `${params[0].split("/")[0]} from (admin@${params[1]})`),
    [passenger.email || emailAddress, data.system.username]
  );
  await getCompanionOTPCode();
  try {
    // Wait for the span with ID #emailVerifiedSpan to appear and have the text "Email verified"
    await page.waitForFunction(
      () => {
        const span = document.querySelector('#emailVerifiedSpan');
        return span && span.textContent.trim() === 'Email verified';
      },
      { timeout: 120000 } // Set a timeout of 10 seconds (adjust as needed)
    );
    console.log('Email verified span is present and has the correct value.');
    await util.commit(
      page,
      [
        {
          selector: "#AddMemberViewModel_Relation",
          value: (row) => row.gender === "Male" ? "27a4b628-0cf2-43b6-9364-053855f580c9" : "f8350217-d93d-4e7b-a68c-74766360e3f8",
        }
      ],
      passenger
    );
    await new Promise(resolve => setTimeout(resolve, 3000));
    await page.click("#submitAddMember");
  } catch (error) {
    console.error('Error: The "Email verified" span did not appear within the timeout period.', error);
  }

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
  passenger.mobileNumber = telephoneNumber;
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
    registerCaptchaAbortController.signal
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
  const url = await page.url();
  if (url.toLowerCase() !== URLS.LOGIN.toLowerCase()) {
    return;
  }
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
    loginCaptchaAbortController.signal
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
    try {
      await page.waitForSelector("body > div.swal-overlay.swal-overlay--show-modal > div > div.swal-text", { timeout: 2000 }).catch(() => { });
      const loginFailed = await page.$eval("body > div.swal-overlay.swal-overlay--show-modal > div > div.swal-text", (el) => el.innerText);
      if (loginFailed) {
        await util.infoMessage(page, `Login failed`);
        await takeScreenShot();
        await page.browser().close();
        process.exit(0);
      }
    } catch {

    }

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
  const rejectionReason = await handleDialogBox(passenger);
  if (rejectionReason && uploadDocumentRetries < 2) {
    // retry uploading documents once to open manual mode
    uploadDocumentRetries = uploadDocumentRetries + 1;
    await uploadDocuments(util.getSelectedTraveler());
    await handleDialogBox(passenger);
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
  if (passenger.email && passenger.email.includes("/")) {
    return passenger.email.split("/")[1];
  }
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
  try {
    await checkIfNotChecked("#HaveValidResidencyYes");
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
  } catch (e) {
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
        value: (row) => row.birthPlace || row.nationality.name,
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
      {
        selector: "#PassportSummaryViewModel_CityId",
        value: () => "3ccb61fc-5947-4469-915f-884ed1b9666d"
      }
    ],
    passenger
  );

  await labeler(page, passenger.dob.dmmmy, "#summary-from > div.system-content.p-3 > div.d-flex.flex-column-reverse.flex-lg-row.mb-5 > div.col-xl-9.col-lg-8 > div:nth-child(1) > ul > li:nth-child(11) > div > div.col-md-6.font-semibold.align-self-center")
  await labeler(page, passenger.gender, "#summary-from > div.system-content.p-3 > div.d-flex.flex-column-reverse.flex-lg-row.mb-5 > div.col-xl-9.col-lg-8 > div:nth-child(1) > ul > li:nth-child(13) > div > div.col-md-6.font-semibold.align-self-center")
  await labeler(page, passenger.passportNumber, "#summary-from > div.system-content.p-3 > div.d-flex.flex-column-reverse.flex-lg-row.mb-5 > div.col-xl-9.col-lg-8 > div:nth-child(1) > ul > li:nth-child(15) > div > div.col-md-6.font-semibold.align-self-center")

  await labeler(page, passenger.passIssueDt.dmmmy, "#summary-from > div.system-content.p-3 > div.d-flex.flex-column-reverse.flex-lg-row.mb-5 > div.col-xl-9.col-lg-8 > div:nth-child(1) > ul > li:nth-child(17) > div > div.col-md-6.font-semibold.align-self-center")
  await labeler(page, passenger.passExpireDt.dmmmy, "#summary-from > div.system-content.p-3 > div.d-flex.flex-column-reverse.flex-lg-row.mb-5 > div.col-xl-9.col-lg-8 > div:nth-child(1) > ul > li:nth-child(18) > div > div.col-md-6.font-semibold.align-self-center")
  await labeler(page, passenger.placeOfIssue, "#summary-from > div.system-content.p-3 > div.d-flex.flex-column-reverse.flex-lg-row.mb-5 > div.col-xl-9.col-lg-8 > div:nth-child(1) > ul > li:nth-child(16) > div > div.col-md-6.font-semibold.align-self-center")

  await enterDate("#PassportSummaryViewModel_BirthDate", passenger.dob.dmmmy)
  await enterDate("#PassportSummaryViewModel_IssueDate", passenger.passIssueDt.dmmmy)
  await enterDate("#PassportSummaryViewModel_ExpiryDate", passenger.passExpireDt.dmmmy)

  kea.updatePassenger(data.system.accountId, passenger.passportNumber, {
    "submissionData.nsh.status": "Submitted",
  });

  if (global.headless || global.visualHeadless) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.click("#submitBtn")
    try {
      await page.waitForSelector("body > div.swal-overlay.swal-overlay--show-modal > div > div.swal-footer > div:nth-child(2) > button");
      await page.click("body > div.swal-overlay.swal-overlay--show-modal > div > div.swal-footer > div:nth-child(2) > button");
      await handleDialogBox(passenger);
    } catch { }
  }
}

async function enterDate(selector, value) {
  const elementValue = await page.$eval(
    selector,
    (el) => el.value
  );

  if (!elementValue) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.evaluate((params) => {
      const ele = document.querySelector(params[0]);
      ele.value = params[1];
    }, [selector, value]);
  }
}

function canGetCode(email, domain) {
  // if (email.includes(domain)) {
  //   return true;
  // }
  return true;
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


// TODO: Refactor opprtunities
//  2- modularize the code on seaparate files
//  4- implement new captcha mouse click