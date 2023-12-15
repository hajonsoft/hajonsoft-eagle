const puppeteer = require("puppeteer-extra");
// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const fs = require("fs");
const path = require("path");
const util = require("./util");
const { getPath } = util;
const totp = require("totp-generator");
const kea = require("./lib/kea");
const email = require("./email");
const moment = require("moment");
const budgie = require("./budgie");
const gmail = require("./lib/gmail");

let page;
let data;
let counter = 0;
let passenger;
let emailAddress;
let telephoneNumber;
let manualMode;
const verifyClicked = {};
const loginRetries = {};

const URLS = {
  SIGN_UP: "https://hajj.nusuk.sa/registration/signup",
  HOME: "https://hajj.nusuk.sa/",
  PROFILE: "https://hajj.nusuk.sa/Account/Profile",
  VERIFY_REGISTER_EMAIL: "https://hajj.nusuk.sa/account/verify",
  REGISTER_PASSWORD: "https://hajj.nusuk.sa/registration/signup/password",
  INDEX: "https://hajj.nusuk.sa/Index",
  UPLOAD_DOCUMENTS: "https://hajj.nusuk.sa/registration/documents/[0-9a-f-]+",
  COMPLETE_REGISTRATION:
    "https://hajj.nusuk.sa/registration/documents/summary/[0-9a-f-]+",
  registrationForward:
    "https://hajj.nusuk.sa/Applicants/Individual/Registration.handler=RegisterApplicant",
  LOGIN: "https://hajj.nusuk.sa/Account/Login",
  CONTACT: "https://hajj.nusuk.sa/registration/contact/[0-9a-f-]+",
  SUMMARY: "https://hajj.nusuk.sa/registration/form/step1/[0-9a-f-]+",
  SUMMARY2: "https://hajj.nusuk.sa/registration/form/step2/[0-9a-f-]+",
  PREFERENCES: "https://hajj.nusuk.sa/Registration/Preferences/[0-9a-f-]+",
  REGISTRATION_SUMMARY: "https://hajj.nusuk.sa/registration/summary/[0-9a-f-]+",
};

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
  },
  {
    name: "contact",
    regex: URLS.CONTACT,
  },
  {
    name: "summary",
    regex: URLS.SUMMARY,
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
    name: "registration-summary",
    regex: URLS.REGISTRATION_SUMMARY,
  },
  {
    name: "login",
    url: URLS.LOGIN,
    controller: {
      name: "login",
      selector:
        "body > main > div.signup > div > div.container-lg.container-fluid.position-relative.h-100 > div > div > div.my-5",
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
    name: "verify-login",
    regex: "https://hajj.nusuk.sa/Account/VerifyOTP/",
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
  const currentConfig = util.findConfig(await page.url(), config);
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
      // check if you should perform a login flow or a register flow
      if (data.travellers.filter((t) => t.mofaNumber === "").length > 0) {
        // At least one passenger does not have a mofa number, then we need to register
        await util.infoMessage(page, "Registering in 30 seconds");

        timerHandler = setTimeout(async () => {
          util.registerLoop();
          await page.goto(URLs.SIGN_UP, {
            waitUntil: "domcontentloaded",
          });
        }, 30000);
      } else {
        await util.infoMessage(page, "Logging-in 30 seconds");
        timerHandler = setTimeout(async () => {
          util.registerLoop();
          await page.goto(URLs.LOGIN, {
            waitUntil: "domcontentloaded",
          });
        }, 30000);
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
      } catch (error) {}
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
      break;
    case "verify-register-email":
      clearTimeout(timerHandler);

      await page.waitForSelector(
        "#otp-inputs > input.form-control.signup-otp.me-1",
        { visible: true }
      );

      await util.infoMessage(page, "OTP ...");
      // TODO: figure out if the email subject is Email Activation or One Time Password
      // If the page contain the word Registration, then registration. If it contains "OTP Verification"
      const pageMode = await page.$eval(
        "body > main > div.signup > div > div.container-lg.container-fluid.position-relative.h-100 > div > div > div > ol > li.breadcrumb-item.small.active",
        (el) => el.innerText
      );

      if (pageMode.includes("Registration")) {
        const signupVerificationCode = await gmail.getNusukCodeByEmail(
          emailAddress,
          "Email Activation"
        );

        await util.commit(
          page,
          [
            {
              selector: "#otp-inputs > input.form-control.signup-otp.me-1",
              value: (row) => signupVerificationCode,
            },
          ],
          passenger
        );
      } else {
        const loginVerificationCode = await gmail.getNusukCodeByEmail(
          emailAddress,
          "One Time Password"
        );

        await util.commit(
          page,
          [
            {
              selector: "#otp-inputs > input.form-control.signup-otp.me-1",
              value: (row) => loginVerificationCode,
            },
          ],
          passenger
        );
      }
      break;
    case "signup-password":
      clearTimeout(timerHandler);
      await util.commit(
        page,
        [
          {
            selector: "#CreatePasswordViewModel_Password",
            value: () => data.system.password,
          },
          {
            selector: "#CreatePasswordViewModel_PasswordConfirmation",
            value: () => data.system.password,
          },
        ],
        passenger
      );
      // await page.waitForTimeout(1000);
      // await page.click(
      //   "body > main > div.signup > div > div.container-lg.container-fluid.position-relative.h-100 > div > div > div.row > div > form > button"
      // );
      break;
    case "register":
      clearTimeout(timerHandler);
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
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
      if (fs.existsSync(getPath("loop.txt"))) {
        await registerPassenger(util.getSelectedTraveler());
      }
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
      // await page.goto(
      //   "https://hajj.nusuk.sa/Applicants/Individual/Registration/Index"
      // );
      await checkIfNotChecked(
        "#PassportSummaryViewModel_ConsentToAllAboveData"
      );
      await checkIfNotChecked(
        "#PassportSummaryViewModel_ConfirmAccuracyOfData"
      );
      // TODO: enter arabic names if present
      await util.commit(
        page,
        [
          {
            selector: "#PassportSummaryViewModel_FirstNameAr",
            value: () => passenger.nameArabic.first,
          },
          {
            selector: "#PassportSummaryViewModel_SecondNameAr",
            value: () => passenger.nameArabic.father,
          },
          {
            selector: "#PassportSummaryViewModel_MiddleNameAr",
            value: () => passenger.nameArabic.grand,
          },
          {
            selector: "#PassportSummaryViewModel_LastNameAr",
            value: () => passenger.nameArabic.last,
          },
        ],
        passenger
      );
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
          }
        ],
        passenger
      );
      break;
    case "summary":
      await checkIfNotChecked("#HaveValidResidencyNo");
      await checkIfNotChecked("#PreviouslyReceivedVisaEnterKSANo");
      await checkIfNotChecked("#PreviousKSAVisaRejectionNo");
      await checkIfNotChecked("#PassportHasRestrictionForOneTripNo");
      await checkIfNotChecked("#HaveRelativesResigingInKSANo");
      await checkIfNotChecked("#HoldOtherNationalitiesNo");
      await checkIfNotChecked("#TraveledToOtherCountriesNo");
      break;
    case "summary2":
      await checkIfNotChecked("#DeportedFromAnyCountryBeforeNo");
      await checkIfNotChecked("#WorkedInMediaOrPoliticsNo");
      await checkIfNotChecked("#ServedInArmedOrSecurityForcesNo");
      await checkIfNotChecked("#SentencedToPrisonBeforeNo");
      await checkIfNotChecked("#ConvictedInSmugglingMoneyLaunderingNo");
      await checkIfNotChecked("#BelongedToTerroristOrganizationBeforeNo");
      await checkIfNotChecked("#RequiredVaccinationsBeenTakenNo");
      await checkIfNotChecked("#HaveAnyPhysicalDisabilityNo");
      await checkIfNotChecked("#ArrestedOrConvictedForTerrorismBeforeNo");
      break;
    case "preferences":
      break;
    case "registration-summary":
      await checkIfNotChecked("#summarycheck1");
      await checkIfNotChecked("#summarycheck2");
      await checkIfNotChecked("#summarycheck3");
      await checkIfNotChecked("#summarycheck5");
      break;
    case "upload-documents":
      await util.controller(page, currentConfig, data.travellers);
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      if (fs.existsSync(getPath("loop.txt"))) {
        await uploadDocuments(util.getSelectedTraveler());
      }
      break;
    case "login":
      clearTimeout(timerHandler);

      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      if (!manualMode) {
        manualMode = currentConfig.name;
      }
      if (manualMode === "register") {
        util.infoMessage(page, `🧟 passenger ${passenger.slug} saved`);
        kea.updatePassenger(data.system.accountId, passenger.passportNumber, {
          "submissionData.nsh.status": "Submitted",
          mofaNumber: "registered",
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

      break;
    case "verify-login":
      const passengerForEmail = data.travellers[util.getSelectedTraveler()];
      util.infoMessage(page, `OTP ...`);
      const code = await gmail.getNusukCodeByEmail(
        passengerForEmail.email,
        "One Time Password"
      );
      if (code) {
        await util.commit(
          page,
          [
            {
              selector: "#VerifyOTPViewModel_OTPCode",
              value: () => code,
            },
          ],
          {}
        );
      }
      // click the verify button only once
      if (!verifyClicked[code]) {
        const isSelectorAvailable = await page.$(
          "body > main > div > form > div.text-center > input"
        );
        if (isSelectorAvailable) {
          await page.waitForTimeout(1000); // wait because this throws an error if clicked too fast
          try {
            await page.click(
              "body > main > div > form > div.text-center > input"
            );
            verifyClicked[code] = true;
          } catch (e) {
            console.log(e);
          }
        }
      }

      await page.waitForTimeout(1000);
      try {
        const isAlert = await page.$(
          "body > div.swal-overlay.swal-overlay--show-modal > div > div.swal-text"
        );
        if (isAlert) {
          const codeError = await page.$eval(
            "body > div.swal-overlay.swal-overlay--show-modal > div > div.swal-text",
            (el) => (el ? el.innerText : null)
          );
          if (codeError) {
            util.infoMessage(page, `OTP error: ${codeError}`);
            util.incrementSelectedTraveler();
            if (manualMode === "login") {
              await page.goto(URLS.LOGIN);
            } else {
              await page.goto(
                "https://hajj.nusuk.sa/Applicants/Individual/Registration/Index"
              );
            }
          }
        }
      } catch (e) {
        console.log(e);
      }
    default:
      break;
  }
}

function suggestEmail(selectedTraveler) {
  const passenger = data.travellers[selectedTraveler];
  if (passenger.email) {
    return passenger.email;
  }
  const domain = data.system.username.includes("@")
    ? data.system.username.split("@")[1]
    : data.system.username;
  const friendlyName = `${passenger.name.first}.${
    passenger.name.last
  }.${moment().unix().toString(36)}@${domain}`.toLowerCase();
  const unfriendlyName = `${passenger.name.first}.${
    data.system.accountId
  }.${moment().unix().toString(36)}@${domain}`.toLowerCase();
  const email = data.system.username.includes("@")
    ? friendlyName
    : unfriendlyName;
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
  const isChecked = await page.$eval(selector, (el) => el.checked);
  if (isChecked) {
    return;
  }
  await page.$eval(selector, (el) => (el.checked = true));
}

async function signup_step1(selectedTraveler) {
  util.setSelectedTraveller(selectedTraveler);
  const passenger = data.travellers[selectedTraveler];
  emailAddress = suggestEmail(selectedTraveler);
  telephoneNumber = suggestPhoneNumber(selectedTraveler);
  console.log(
    "📢[nsh.js:489]: emailAddress and Telephone: ",
    emailAddress,
    telephoneNumber
  );
  await kea.updatePassenger(data.system.accountId, passenger.passportNumber, {
    email: emailAddress,
    phone: telephoneNumber,
  });
  const nationality = nationalities.find(
    (n) =>
      n.name.toLowerCase().trim() ===
      passenger.nationality.name.toLowerCase().trim()
  )?.uuid;

  await util.commit(
    page,
    [
      {
        selector: "#SignupViewModel_Email",
        value: (row) => emailAddress,
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
  await page.waitForTimeout(1000);

  await checkIfNotChecked("#chkResidenceCountry");
  await checkIfNotChecked("#SignupViewModel_AgreeToTermsAndCondition");
  await checkIfNotChecked("#SignupViewModel_SubscribeToNewsLetter");
  await util.infoMessage(page, "Captcha ...");
  const captchaCode = await util.SolveIamNotARobot(
    "#g-recaptcha-response",
    URLS.SIGN_UP,
    "6LcNy-0jAAAAAJDOXjYW4z7yV07DWyivFD1mmjek"
  );

  if (captchaCode) {
    await page.click(
      "body > main > div.signup > div > div.container-lg.container-fluid.position-relative.h-100 > div > div > div.row > div > form > input.btn.btn-main.px-5.mt-5.w-100"
    );
  }

  if (!captchaCode) {
    await util.infoMessage(page, "Manual captcha required ...");
  }
}

async function registerPassenger(selectedTraveler) {
  util.setSelectedTraveller(selectedTraveler);
  const rawData = fs.readFileSync(getPath("data.json"), "utf-8");
  var data = JSON.parse(rawData);
  const passenger = data.travellers[selectedTraveler];
  const emailDomain = data.system.username.includes("@")
    ? data.system.username.split("@")[1]
    : data.system.username;
  console.log("📢[nsh.js:359]: emailDomain: ", emailDomain);
  emailAddress =
    passenger.email ||
    `${passenger.name.first}${data.system.accountId}${moment()
      .unix()
      .toString(36)}@${emailDomain}`.toLowerCase();

  let telephoneNumber = passenger.phone;
  if (!telephoneNumber) {
    const nusukPhone = budgie.get("nusuk-hajj-phone");
    if (nusukPhone) {
      // find the number of zeros at the end of the phone number
      const numberOfTrailingZeros = nusukPhone.match(/0*$/)[0].length;
      const generatedNumber = new Date()
        .valueOf()
        .toString()
        .substring(13 - numberOfTrailingZeros, 13);

      // replace the zeros at the end of the phone number with the generated number
      telephoneNumber = nusukPhone.replace(/0*$/, generatedNumber);
    } else {
      telephoneNumber =
        "+1949" + new Date().valueOf().toString().substring(6, 13);
    }
  }

  passenger.phone = telephoneNumber;
  await kea.updatePassenger(data.system.accountId, passenger.passportNumber, {
    email: emailAddress,
    phone: telephoneNumber,
  });
  // );

  const nationality = nationalities.find(
    (n) =>
      n.name.toLowerCase().trim() ===
      passenger.nationality.name.toLowerCase().trim()
  )?.uuid;

  await util.commit(
    page,
    [
      {
        selector: "#ApplicantRegistrationViewModel_FirstNameEn",
        value: (row) => row.name.first,
      },
      {
        selector: "#ApplicantRegistrationViewModel_LastNameEn",
        value: (row) => row.name.last,
      },
      {
        selector: "#ApplicantRegistrationViewModel_SecondNameEn",
        value: (row) => row.name.father,
      },
      {
        selector: "#ApplicantRegistrationViewModel_MiddleNameEn",
        value: (row) => row.name.grand,
      },
      {
        selector: "#ApplicantRegistrationViewModel_FirstNameAr",
        value: (row) => row.nameArabic.first,
      },
      {
        selector: "#ApplicantRegistrationViewModel_LastNameAr",
        value: (row) => row.nameArabic.last,
      },
      {
        selector: "#ApplicantRegistrationViewModel_CountryResidenceId",
        value: (row) => budgie.get("nusuk-hajj-residence", nationality),
      },
      {
        selector: "#ApplicantRegistrationViewModel_SecondNameAr",
        value: (row) => row.nameArabic.father,
      },
      {
        selector: "#ApplicantRegistrationViewModel_MiddleNameAr",
        value: (row) => row.nameArabic.grand,
      },
      {
        selector: "#ApplicantRegistrationViewModel_BirthDate",
        value: (row) => `${row.dob.yyyy}-${row.dob.mm}-${row.dob.dd}`,
      },
      {
        selector: "#SignupViewModel_Email",
        value: (row) => emailAddress,
      },
      {
        selector: "#ApplicantRegistrationViewModel_Password",
        value: (row) => data.system.password,
      },
      {
        selector: "#ApplicantRegistrationViewModel_PasswordConfirmation",
        value: (row) => data.system.password,
      },
      {
        selector: "#ApplicantRegistrationViewModel_GenderId",
        value: (row) =>
          row.gender.toLowerCase() === "female"
            ? "24d70000-4100-0250-08e6-08da85bae1e6"
            : "24d70000-4100-0250-c0aa-08da85bad857",
      },
      {
        selector: "#ApplicantRegistrationViewModel_NationalityId",
        value: (row) => nationality,
      },
    ],
    passenger
  );
  // wait for all javascript functions to execute
  await page.waitForTimeout(1000);

  await page.waitForSelector("#ApplicantRegistrationViewModel_MobileNumber", {
    visible: true,
  });
  for (let i = 0; i < 10; i++) {
    const telephoneValue = await page.$eval(
      "#ApplicantRegistrationViewModel_MobileNumber",
      (el) => el.value
    );
    if (!telephoneValue) {
      await page.waitForTimeout(1000);
      await page.evaluate((passenger) => {
        const telephoneNumberElement = document.querySelector(
          "#ApplicantRegistrationViewModel_MobileNumber"
        );
        telephoneNumberElement.value = passenger.phone;
      }, passenger);
    }
  }

  const isEndorsementCheckbox = await page.$eval(
    "#ApplicantRegistrationViewModel_EndorsementAgree",
    (el) => el.checked
  );
  if (!isEndorsementCheckbox) {
    await page.$eval(
      "#ApplicantRegistrationViewModel_EndorsementAgree",
      (el) => (el.checked = true)
    );
  }

  const isPrivacyCheckbox = await page.$eval(
    "#ApplicantRegistrationViewModel_PrivacyAgree",
    (el) => el.checked
  );
  if (!isPrivacyCheckbox) {
    await page.$eval(
      "#ApplicantRegistrationViewModel_PrivacyAgree",
      (el) => (el.checked = true)
    );
  }

  await page.click("#frmRegisteration");
  await page.waitForSelector("#OTPCode", { visible: true });
  await util.infoMessage(page, "Captcha ...");
  const captchaCode = await util.SolveIamNotARobot(
    "#g-recaptcha-response",
    URLS.SIGN_UP,
    "6LcNy-0jAAAAAJDOXjYW4z7yV07DWyivFD1mmjek"
  );

  if (!captchaCode) {
    await util.infoMessage(page, "Manual captcha required ...");
  }
  await util.infoMessage(page, "OTP ...");
  const code = await gmail.getNusukCodeByEmail(
    emailAddress,
    "Email Activation"
  );

  await util.commit(
    page,
    [
      {
        selector: "#OTPCode",
        value: (row) => code,
      },
    ],
    passenger
  );
  if (code && captchaCode) {
    await page.click(
      "#verifyOtpModal > div > div > form > div.modal-footer.justify-content-center > button.btn.btn-main.btn-sm"
    );
  }
}

async function loginPassenger(selectedTraveler) {
  util.setSelectedTraveller(selectedTraveler);
  const rawData = fs.readFileSync(getPath("data.json"), "utf-8");
  var data = JSON.parse(rawData);
  const passenger = data.travellers[selectedTraveler];
  await util.commit(
    page,
    [
      {
        selector: "#LogInViewModel_Email",
        value: (row) => row.email || emailAddress,
      },

      {
        selector: "#LogInViewModel_Password",
        value: (row) => data.system.password,
      },
    ],
    passenger
  );

  util.infoMessage(page, `Captcha ...`);
  const loginCaptchaValue = await util.SolveIamNotARobot(
    "#g-recaptcha-response",
    URLS.LOGIN,
    "6LcNy-0jAAAAAJDOXjYW4z7yV07DWyivFD1mmjek"
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
    await page.waitForSelector(
      "body > main > div > form > div:nth-child(2) > div > div.text-center.d-grid.gap-3 > input",
      { visible: true }
    );
    await page.waitForTimeout(1000); // this takes sometime to be enabled and it throws an error if we don't wait
    try {
      await page.click(
        "body > main > div > form > div:nth-child(2) > div > div.text-center.d-grid.gap-3 > input"
      );
    } catch (e) {
      console.log(e);
    }
  }
}

async function uploadDocuments(selectedTraveler) {
  const passenger = data.travellers[selectedTraveler];

  // await page.$eval("#CompleteViewModel_PassportTypeId", (e) => {
  //   if (e) {
  //     e.value = "074240a9-e07f-4959-889d-b163c8743dad";
  //   }
  // });

  // await util.commit(
  //   page,
  //   [
  //     {
  //       selector: "#CompleteViewModel_PassportNumber",
  //       value: (row) => row.passportNumber,
  //     },

  //     {
  //       selector: "#CompleteViewModel_IssueDate",
  //       value: (row) =>
  //         `${row.passIssueDt.yyyy}-${row.passIssueDt.mm}-${row.passIssueDt.dd}`,
  //     },
  //     {
  //       selector: "#CompleteViewModel_ExpiryDate",
  //       value: (row) =>
  //         `${row.passExpireDt.yyyy}-${row.passExpireDt.mm}-${row.passExpireDt.dd}`,
  //     },
  //     {
  //       selector: "#CompleteViewModel_IssuePlace",
  //       value: (row) => row.placeOfIssue,
  //     },
  //     {
  //       selector: "#CompleteViewModel_BirthPlace",
  //       value: (row) => row.nationality.name,
  //     },
  //   ],
  //   passenger
  // );

  // passport upload
  const passportPath = path.join(
    util.passportsFolder,
    `${passenger.passportNumber}.jpg`
  );

  await page.waitForSelector("#passportPhoto", {
    timeout: 0,
  });
  await util.downloadImage(passenger.images.passport, passportPath);
  await util.commitFile("#passportPhoto", passportPath);

  // personal photo upload
  let photoPath = path.join(
    util.photosFolder,
    `${passenger.passportNumber}.jpg`
  );
  await page.waitForSelector("#personalPhoto", {
    timeout: 0,
  });

  // TODO: image not being resized to 15kb...
  const resizedPhotoPath = await util.downloadAndResizeImage(
    passenger,
    200,
    200,
    "photo",
    5,
    17
  );
  await util.commitFile("#personalPhoto", resizedPhotoPath);

  // residence upload
  // let residencyPath = path.join(
  //   util.residencyFolder,
  //   `${passenger.passportNumber}.jpg`
  // );
  // await page.waitForSelector("#CompleteViewModel_ResidencyPhoto", {
  //   timeout: 0,
  // });

  // await util.downloadImage(
  //   passenger.images.residency || passenger.images.passport,
  //   residencyPath
  // );
  // await util.commitFile("#CompleteViewModel_ResidencyPhoto", residencyPath);

  // if (!passenger.images.residency) {
  //   const haveResidence = await page.$("#HaveResidence_No");
  //   if (haveResidence) {
  //     await page.$eval("#HaveResidence_No", (e) => {
  //       if (e) {
  //         e.checked = true;
  //       }
  //     });
  //   }
  // } else {
  //   const haveResidence = await page.$("#HaveResidence_Yes");
  //   if (haveResidence) {
  //     await page.$eval("#HaveResidence_Yes", (e) => {
  //       if (e) {
  //         e.checked = true;
  //       }
  //     });
  //   }
  // }

  // try {
  //   await page.click("body > main > div > form > div.text-center.mt-5 > input");
  // } catch (e) {
  //   console.log(e);
  //   const pageElement = await page.$("body");
  //   // save screenshot to kea
  //   try {
  //     await util.screenShotToKea(
  //       pageElement,
  //       data.system.accountId,
  //       passenger,
  //       "Embassy"
  //     );
  //   } catch (error) {}
  //   util.incrementSelectedTraveler();
  //   await page.goto("https://hajj.nusuk.sa/Account/SignOut");
  // }
}

module.exports = { send };

const nationalities = [
  { uuid: "59d1d3c1-0fd8-4c9e-a4ee-cf2e136a4be8", name: "Afghanistan" },
  { uuid: "29f6c7b9-f973-4afc-a5b4-9b57ae24bc2a", name: "Albania" },
  { uuid: "1691c6da-6251-4c76-a6d5-533fe2d354dd", name: "Algeria" },
  { uuid: "e369ec67-684a-4777-ae6f-40c5c7e298bd", name: "American Islander" },
  { uuid: "a406acab-f81f-4e98-bc2a-83dde3717037", name: "American Samoa" },
  { uuid: "34e619a7-6634-48f3-b21c-5624760bab09", name: "Andorra" },
  { uuid: "eb5c9fec-df5b-4dfe-ad48-7b341ab7f943", name: "Angola" },
  { uuid: "2f390746-f6b6-41ae-a2af-49df21f5d9d4", name: "Anguilla" },
  { uuid: "ef6691a9-bde1-4ab6-8321-8232df2bdf28", name: "Antigua" },
  { uuid: "7bb02d0c-498d-4a39-963a-2af853fcd55e", name: "Argentina" },
  { uuid: "b2f944a7-7b03-4f6a-844b-cbfd360b2375", name: "Armenia" },
  { uuid: "fe7228c7-fa80-4019-ad38-1bb6e2f16a68", name: "Aruba" },
  { uuid: "32496cfc-4a95-4b80-a454-ba4a2ac1cc38", name: "Australia" },
  { uuid: "c18849e2-aeaf-457e-abdc-45c180a951eb", name: "Austria" },
  { uuid: "b9c53704-e1e6-4f21-ad3c-8280272d1b8e", name: "Azerbaijan" },
  { uuid: "6f0427f0-792d-41ec-96af-38b169c35b13", name: "Bahamas" },
  { uuid: "c91344a8-24a9-446c-b7e0-8b5b2c988e51", name: "Bahrain" },
  { uuid: "1ccf4757-71e6-413f-a0f9-ce99e152a9d3", name: "Bangladesh" },
  { uuid: "abe3bfd3-d992-4230-806a-d36ae6d6ff18", name: "Barbados" },
  { uuid: "dbfa5997-e481-4332-9db5-c644cf6a579f", name: "Belarus" },
  { uuid: "aceb49ed-1fb2-4832-a3ae-1111fc7b95fb", name: "Belgium" },
  { uuid: "40daa6ea-a41d-471a-90d0-2128746601d0", name: "Belize" },
  { uuid: "7812f80c-ee8e-43ef-94cc-ec0f2f028cec", name: "Benin" },
  { uuid: "4598e7b6-9a31-4ee8-bfab-f7ecb1cbc3ac", name: "Bermuda" },
  { uuid: "6a4c1319-500d-4070-a317-56fb22d0e819", name: "Bhutan" },
  { uuid: "9d66ea4d-10a5-42b1-a961-eac84d7286d1", name: "Bolivia" },
  {
    uuid: "8f07dab3-7833-4f87-bc5d-c588f96b25fd",
    name: "Bosnia and Herzegovina",
  },
  { uuid: "3a610679-e4bd-4224-aeb9-051dc496d9f7", name: "Botswana" },
  { uuid: "33c14394-d3e2-4edd-af41-8c28e00119ba", name: "Brazil" },
  {
    uuid: "73d8dbd7-e4f7-4c9f-9032-d127b06f6dc5",
    name: "British Virgin Islands",
  },
  { uuid: "202329f2-5c6d-4267-bd58-e0ff5b045be2", name: "Brunei" },
  { uuid: "2ef16f5b-50f3-4546-9faf-3f00637c0860", name: "Bulgaria " },
  { uuid: "fecb34df-24b5-4a46-b6d9-fe08ae855929", name: "Burkina Faso" },
  { uuid: "2414d709-40cb-4c0e-9ab3-d0ef4851b98a", name: "Burundi" },
  { uuid: "1b8c629c-7ea9-452a-bece-a02f177bd574", name: "Cambodia" },
  { uuid: "9d98b867-b514-4a5a-8915-86785f79adb6", name: "Cameroon" },
  { uuid: "4e46e17f-5fa7-4973-afef-f46145e70704", name: "Canada" },
  { uuid: "2afb7daa-6007-4f95-b013-f645b9ece9d8", name: "Cape Verde Islands" },
  { uuid: "797ff8d8-c857-4418-a27f-5fd156c15e09", name: "Cayman Islands" },
  {
    uuid: "8f303812-e02c-44b1-86b0-7c56b6baf807",
    name: "Central African Republic",
  },
  { uuid: "f3e59098-ec78-4bb0-bd09-1af4ac20d7d8", name: "Chad" },
  { uuid: "dbf2e762-3fe1-4b4c-b872-4193d18e5812", name: "Chile" },
  { uuid: "90eceaf2-7b30-4d40-ac1a-69fd8852bbdd", name: "China (PRC)" },
  { uuid: "3642d473-a600-45e2-a1d3-97605860a5b7", name: "Christmas Island" },
  {
    uuid: "6f46b852-b10a-4df2-a851-c8de6caa6931",
    name: "Cocos-Keeling Islands",
  },
  { uuid: "2d7a223d-131f-4a3b-aa7f-4aaaf5b72431", name: "Colombia" },
  { uuid: "efb1040a-adff-4f7c-a9cd-67a11d8eeac7", name: "Comoros Islands" },
  { uuid: "d0835a85-2e51-4571-ad59-368a6b5022db", name: "CONGO" },
  {
    uuid: "2e27127f-7343-4d06-9b27-a83aec46de44",
    name: "Congo, Dem. Rep. of (former Zaire)",
  },
  { uuid: "8f1955d7-b472-4f7a-82cc-c1e572c686af", name: "Cook Islands" },
  { uuid: "2ef34c67-b94c-43c5-8fc4-cf5ab0fa1516", name: "Costa Rica" },
  { uuid: "f8ceb9c5-6c43-463e-96dd-e7c87e51d6d3", name: "Croatia" },
  { uuid: "8e67f4f1-4144-48dc-86c8-8a67706e299c", name: "Cuba" },
  { uuid: "b6607f31-8093-42ac-a284-02a93a52a48d", name: "Curaçaoan" },
  { uuid: "e59f7fd7-8f97-423d-9b70-c68b7819d556", name: "Cyprus" },
  { uuid: "7e5277f8-4ff5-4c38-a567-a7fbf0163bba", name: "Czech Republic" },
  { uuid: "b4292fd3-6e4d-4285-8b55-1d6491575f32", name: "Denmark" },
  { uuid: "be5c6f55-a87f-4b40-b96e-9e028e6eeb19", name: "Djibouti" },
  { uuid: "cb5f56f7-27ff-46f0-9bf1-7b5281967a55", name: "Dominican" },
  { uuid: "ab59b39c-f4fb-49cd-827e-9cf6c13fe47c", name: "Dominican Republic" },
  { uuid: "9cbff721-64c5-47f3-8b76-4fb64321a39a", name: "Ecuador" },
  { uuid: "33387529-87f5-42c9-ae59-c1f3775f6937", name: "Egypt" },
  { uuid: "e07b8168-23fe-4261-a3b4-6533762fdbd8", name: "Equatorial Guinea" },
  { uuid: "b10e2f58-58c3-4ff1-8d72-3ba511d6162f", name: "Eritrea" },
  { uuid: "966a6b08-795b-4516-a192-e9ee7d6078fa", name: "Estonia " },
  { uuid: "ac945608-d4ac-4ae6-8a3f-5cdd7f57b4d7", name: "Ethiopia" },
  { uuid: "c1b1c646-10a9-4dca-ac06-b048a621df02", name: "Faeroe Islands" },
  {
    uuid: "0c5ede46-78d2-4bad-b7ba-9e2b609b8f80",
    name: "Falkland Islands  Dem. Rep. of (former Zaire)",
  },
  { uuid: "4b818765-b784-44c5-a19e-897994187092", name: "Fiji" },
  { uuid: "9d071498-522c-4229-9342-a6fc9c65e796", name: "Finland" },
  { uuid: "c7e1e86f-5e3b-4971-b3bf-5e93d8ae6552", name: "France" },
  { uuid: "fbd92037-b178-419e-8ca0-5b9f4208fb9b", name: "French Guiana" },
  { uuid: "2d401127-0a2c-4084-920d-9fe00bd16d23", name: "French Polynesia" },
  { uuid: "2ddd2b9b-7249-44e1-b4e8-0c9bb9f43168", name: "Gabon" },
  { uuid: "5f361ecb-ba2b-4ba5-95bd-8e0d48b1f204", name: "Gambia" },
  { uuid: "3cb1dea7-08da-495a-b54a-9fe354eb277f", name: "Georgia" },
  { uuid: "4db2dcc2-cc0b-4d22-ba74-41b48f7dfa96", name: "Germany" },
  { uuid: "9abef00d-df28-4bd1-994f-af191d68374e", name: "Ghana" },
  { uuid: "e28be5cc-8b11-4d54-9330-6028f3b65441", name: "Gibraltar" },
  { uuid: "f24a813b-0644-415b-80f8-6f7daeeb4ceb", name: "Greece" },
  { uuid: "d4fb0331-86d7-4f4a-b4c7-313673f730d7", name: "Greenland" },
  { uuid: "f88793ab-ba8a-4f52-9f14-6d958fcfefda", name: "Grenada" },
  { uuid: "7368eac9-c6e5-45eb-affb-92e5bba59d84", name: "Guadeloupe" },
  { uuid: "1743117e-f67a-43dd-a940-610ef81625d9", name: "Guam" },
  { uuid: "dd2ab65c-87d8-4cd1-a34a-7a56180b938b", name: "Guatemala" },
  {
    uuid: "61c29a5d-5873-4f54-9bc2-a024c67efe2c",
    name: "Guinea Conakry (PRP)",
  },
  { uuid: "b5c7a9af-b1e5-4e96-86d8-ab3d0944cd7b", name: "Guinea-Bissau" },
  { uuid: "567e838d-e527-4336-9fd4-2c0196a1be74", name: "Guyana" },
  { uuid: "47793df3-90b2-4067-add0-b103af3b67ad", name: "Haiti" },
  { uuid: "f3cbd1a7-60ad-414d-bcd2-c11ef8990233", name: "Honduras" },
  { uuid: "861ee307-bec7-477d-a5c8-bb48c9e0e30f", name: "Hong Konger" },
  { uuid: "83730e60-f19f-44a8-bf51-a37dc8de3304", name: "Hungary " },
  { uuid: "a1ee80d3-e33d-4aa6-a611-591938a5fd03", name: "Iceland" },
  { uuid: "422be95d-db6b-4e83-9888-764f66e53a3f", name: "India" },
  { uuid: "16a784f0-cd94-4fb8-b16b-ea775a0eb2bf", name: "Indian" },
  { uuid: "90fd5ba6-df7f-4939-be96-5db087d397a4", name: "Indonesia" },
  { uuid: "58ecfd5e-0a01-49f1-8b85-25542d55825f", name: "Iran" },
  { uuid: "ef0d18fa-a185-4d7c-a784-6340992c7b60", name: "Iraq" },
  { uuid: "8a948ea4-1489-4091-9b77-6c2dc4845ada", name: "Ireland" },
  { uuid: "7161b7bb-4077-4987-89dc-3bbd8e966c27", name: "Italy" },
  { uuid: "357266cd-5662-41b8-9966-91257f1f41f6", name: "Ivory Coast" },
  { uuid: "b88d6ca6-4d15-497b-95bf-276bd73ee626", name: "Jamaica" },
  { uuid: "f462f468-ff69-41a8-8315-32363ca7c1b5", name: "Japan" },
  { uuid: "57da4f36-3bc6-4f22-803e-5d80161f3e6e", name: "Jordan " },
  { uuid: "0761d3d3-5e2a-4174-a388-6ef75f539b25", name: "Kazakhstan" },
  { uuid: "4573d968-ae39-4d04-9ec2-da1c8e790269", name: "Kenya" },
  { uuid: "64bc18ad-fe76-4937-b19c-92e092596e43", name: "Kiribati" },
  { uuid: "b584c93d-54e3-4ee7-9a63-0032b02b24ee", name: "KOSOVO" },
  { uuid: "89fe6abf-4e8e-41d3-9673-aff82c28ccb4", name: "Kyrgyzstan" },
  { uuid: "c6a3ef7f-1856-4ad9-8a76-109d83726797", name: "Laos" },
  { uuid: "09152af6-adb6-4d40-806f-342ebddc26fa", name: "Latvia" },
  { uuid: "45d64375-74dd-4450-b8b7-3c4a7f17ba09", name: "Lebanon" },
  { uuid: "3abb9bc4-1bcd-4dd8-9bd0-a48aeb276279", name: "Lesotho" },
  { uuid: "414e0b3f-2b6e-4f52-bec5-a2c71ce0149f", name: "Liberia" },
  { uuid: "c619fefe-c3c6-4189-912e-6e49eed2b4b4", name: "Libya" },
  { uuid: "8a47380d-05f1-4320-af73-4d3996205ca8", name: "Liechtenstein" },
  { uuid: "a60e810e-217a-4995-a4f7-6a6b991a1eef", name: "Lithuania" },
  { uuid: "15725425-f1d1-444f-84e4-6b6f65fde9c6", name: "Luxembourg" },
  { uuid: "a1277afb-e1c9-4a8b-86ad-8e5d25d38d1d", name: "Macau" },
  { uuid: "c36b60e7-0e53-4622-83dc-0a39f121ae6c", name: "Macedonia" },
  { uuid: "b3b27906-4d43-4344-8970-0b187f557832", name: "Madagascar" },
  { uuid: "215cc64a-14ea-44e7-83ee-8e9a8777039a", name: "Malawi" },
  { uuid: "0516f1ca-1a38-4a30-9393-2aea8b021b22", name: "Malaysia" },
  { uuid: "1eef95c4-e78a-4981-bca0-5a515b3365f3", name: "Maldives" },
  { uuid: "c183153d-c828-4a40-aaaf-ce929b7311d8", name: "Mali" },
  { uuid: "71b74d3b-fe8c-48d0-bada-715b91e1007f", name: "Malta" },
  { uuid: "5516afb9-7370-4589-b392-5f38b145d429", name: "Marshall Islands" },
  { uuid: "f259f863-27cb-4c98-bb9b-cc48564d8b96", name: "Martinique" },
  { uuid: "4c11aa65-e341-4f81-a3af-8cad693fe63b", name: "Mauritania" },
  { uuid: "491ca369-a026-4623-89a8-466be50e715c", name: "Mauritius" },
  { uuid: "b7759a74-a26f-48c9-bff1-651ce134ddac", name: "Mayotte Island" },
  { uuid: "c2771b71-5c46-40fc-b32f-700b09100a2f", name: "Mexico" },
  {
    uuid: "00dfc9c2-362c-46cd-b345-512bbf57f65b",
    name: "Micronesia  (Federal States of)",
  },
  { uuid: "cadc2a2a-8dee-4e92-bde1-611ee4f5c1d8", name: "Moldavia" },
  { uuid: "a89d7ea5-418b-478f-80f5-5a7ab6158b88", name: "Monaco" },
  { uuid: "76fbd612-5fce-447d-a6db-ab42ca2ba095", name: "Mongolia" },
  { uuid: "8615eaf3-df26-4d32-95ba-f631e4d64b7b", name: "Montenegrin" },
  { uuid: "4067064b-6802-4348-bbab-3a81b1dbea17", name: "Montserrat" },
  { uuid: "b81beeca-1524-4604-93f8-b16be1c5a395", name: "Morocco   " },
  { uuid: "85ca57c4-2c54-4364-83f0-f7bd0c3b89ee", name: "Mozambique" },
  { uuid: "90764741-5373-41d7-b2c0-dca0833d7842", name: "Myanmar" },
  { uuid: "f4d45bbd-ae8f-4709-bcc3-63d916820029", name: "Namibia" },
  { uuid: "73eb8d12-862d-4e84-a0be-4c97f165b900", name: "Nauru" },
  { uuid: "2660d31d-07cd-4a77-9ab8-33cc8e4525d6", name: "Nepal" },
  { uuid: "0b983305-e188-411b-8b38-620d934a7d96", name: "Netherlands" },
  { uuid: "8a01746a-614a-47de-82ea-786d4c22010a", name: "New Caledonia" },
  { uuid: "4fb68cd2-1968-4450-b07d-f94987fea0b8", name: "New Zealand" },
  { uuid: "9cf98527-d5e6-4697-ac14-daf65b2590be", name: "Nicaragua" },
  { uuid: "12131b45-5a78-43dc-9ebe-2971dc31f661", name: "Niger" },
  {
    uuid: "15e77ce7-2c20-466c-b9ca-15305aa2d9b3",
    name: "Nigeria",
    code: "NGA",
  },
  { uuid: "4c265e56-dc1f-44e0-b291-49211892a36a", name: "Niue" },
  { uuid: "7b48771f-cb44-4251-add2-1c598be3b2e3", name: "Non Kuwaiti" },
  { uuid: "5ce75316-f7e1-4874-9389-c55532c015fa", name: "Norfolk Island" },
  { uuid: "e97de31f-85c8-44b7-acf9-b5ad8c1d2923", name: "North Korea" },
  {
    uuid: "057b0e57-cf9c-474d-876d-79755a8491df",
    name: "Northern Marianas Islands",
  },
  { uuid: "18c3a0d4-4593-43af-8847-b67afe5a4687", name: "Norway" },
  { uuid: "79d536e6-30f7-4489-9be1-bb515a5d08d6", name: "Oman" },
  { uuid: "ccea576a-db9f-44ea-a2ad-cd682f69b04b", name: "Pakistan" },
  { uuid: "06d331aa-e72c-4833-a2e1-8fc1b11b350c", name: "Palau" },
  {
    uuid: "8a4060c4-bfa4-48a6-afc2-6d38df6d22dc",
    name: "Palestine document  Iraq",
  },
  { uuid: "1104d087-6fea-41f2-a133-b9f70ce0f747", name: "Panama" },
  { uuid: "168fcdab-cf04-40c6-aa2b-ebac4968f317", name: "Papua New Guinea" },
  { uuid: "5f85ba9f-5c19-40c4-b417-6dcd694fcac0", name: "Paraguay" },
  { uuid: "cdcbfb3f-18c2-4695-9dbd-c2bc787cc879", name: "Peru" },
  { uuid: "52bbcfa7-c2f7-411f-bf69-9abebc0797f7", name: "Philippines" },
  { uuid: "507e1ece-903b-4b63-9e52-2403e485929f", name: "Poland" },
  { uuid: "24fe553b-68b7-4ad2-9cf9-ad1f8de5fd47", name: "Portugal" },
  { uuid: "5176b5d1-9eca-411f-b51d-79c46c096871", name: "Puerto Rico" },
  { uuid: "a5159911-6642-41b7-bb93-b4f7db00a822", name: "Qatar " },
  { uuid: "40c20909-b8d5-45bf-840a-145ee9ed029d", name: "R?union Island" },
  { uuid: "b5527e59-d8fb-4a77-ab8a-2acafc60837c", name: "Romania" },
  { uuid: "84ba5c16-680b-4f82-8d9f-3593269636df", name: "Russia" },
  { uuid: "bb003d97-d1e6-4612-ad71-9352e31dc184", name: "Rwanda" },
  {
    uuid: "2e11ad88-7b40-4792-bf45-65c88ac9e29e",
    name: "S.o Tom? and Principe",
  },
  {
    uuid: "6b68459c-8288-4ff1-b3da-4ef55c32360d",
    name: "Saint Kitts and Nevis",
  },
  { uuid: "733c2cc5-ac36-4fd3-a0de-0c41c7afce65", name: "Salvador" },
  { uuid: "350f486b-66d8-46b4-82c0-f69171eb9acc", name: "San Marino" },
  { uuid: "ff9d3578-9efa-4fda-be84-986a0ea79f4b", name: "Senegal" },
  { uuid: "33e00d93-9bcd-4881-8fd7-30dda5e4e1ec", name: "Serbia" },
  { uuid: "79607e24-9467-4e1d-908a-d4becbe83f0d", name: "Seychelles" },
  { uuid: "204cfbf5-d916-4705-905b-bf6228e481c0", name: "Sierra Leone" },
  { uuid: "6a1c9711-a430-451e-a895-0c8f0791e89a", name: "Singapore" },
  { uuid: "c27e3962-8edd-4b48-92ac-16ffc5be6c57", name: "Slovakia" },
  { uuid: "fd23edc3-b4e8-42f7-a91e-c07432bfee38", name: "Slovenia" },
  { uuid: "fedf4dce-e62a-4077-b7a9-208bfe1b5fb8", name: "Solomon Islands" },
  { uuid: "f21908bf-1628-4046-9fd4-4422bab5968b", name: "Somalia" },
  { uuid: "45af962f-2fac-49ae-803e-fb613092f073", name: "South Africa" },
  { uuid: "4d3a943e-0e66-47aa-a43f-efd890731c2c", name: "South Korea" },
  { uuid: "6452f5cc-aa52-452f-a4ad-8c3517d3f263", name: "SOUTH SUDAN" },
  { uuid: "3ab01162-0c6b-4ce3-a4f6-3f7d4f767a68", name: "Spain" },
  { uuid: "3e86f4c5-5cfa-4877-bc33-67daa46bfff2", name: "Sri Lanka" },
  { uuid: "0d1681c5-02e4-4121-9510-bb6d379924ed", name: "St. Helena" },
  { uuid: "bcef948f-2da5-4742-9926-2b18a9303f56", name: "St. Lucia" },
  {
    uuid: "e3e0a67f-87f6-4242-8e01-5350f0ee64f3",
    name: "St. Pierre ,Miquelon",
  },
  {
    uuid: "af09b54f-683b-4de7-a3ba-78d53446741d",
    name: "St. Vincent , Grenadines",
  },
  { uuid: "a9e6c75b-f17c-454f-ad1a-8f952c222d62", name: "Sudan" },
  { uuid: "fdea388b-c062-4b1b-9b2b-b3ebc0154c16", name: "Suriname" },
  { uuid: "525e053f-6a02-4d10-a60f-79ec745f6c25", name: "Swaziland" },
  { uuid: "2f0dd009-dbfc-45ad-88cd-4e89f87bcb39", name: "Sweden" },
  { uuid: "d5d077e2-e068-47df-a2e5-c83fbc5af43c", name: "Switzerland" },
  { uuid: "b1387bcf-98d9-4977-aca9-fb7d78b28683", name: "Syria " },
  { uuid: "2851e9e7-40ba-4074-b6d0-4d2f2c4d1946", name: "Taiwan" },
  { uuid: "9b30bef1-449c-47f0-a6d0-d4998d17b006", name: "Tajikistan" },
  { uuid: "83acefc0-12a8-4f2e-86d6-0a55490aceed", name: "Tanzania" },
  { uuid: "22034210-b53c-4c64-8728-8bd0d97c9e0c", name: "Thailand" },
  { uuid: "0b8b2ba6-28d3-4c4e-bcef-f4c24acca917", name: "Togo" },
  { uuid: "689c12a4-1578-46b1-a1a7-632fba0dfbdd", name: "Tokelau" },
  { uuid: "7b3a0fa2-401a-49e0-b460-37090cdd555a", name: "Tonga Islands" },
  { uuid: "6d4ded44-3104-40e1-b759-2c1d7852dbf7", name: "Trinidad , Tobago" },
  { uuid: "c9298667-9a5c-4b7c-9c0d-16bf552d1d88", name: "Tunisia" },
  { uuid: "fcb51726-3d4f-4466-9601-2e7eb5d0d050", name: "Turkey" },
  { uuid: "9dc26365-66a4-485b-a664-bdc62ef38da4", name: "Turkmenistan" },
  {
    uuid: "d3f3e706-0b1b-4c4f-97e8-d7be73cef05e",
    name: "Turks and Caicos Islands",
  },
  { uuid: "4ab39e96-91f5-4dab-a940-1db76826624e", name: "Tuvalu" },
  { uuid: "ebfb35f0-364f-4ee2-b5ce-463aa7500179", name: "Uganda" },
  { uuid: "c1bc4e16-684a-4d1a-b53c-643919b2589c", name: "Ukraine" },
  {
    uuid: "b10c1043-89f0-4014-bd8b-f766e760018e",
    name: "United Arab Emirates",
  },
  { uuid: "a9c91738-ac3c-44c6-ad25-ec626ace73e0", name: "United Kingdom" },
  {
    uuid: "7d4ffd39-0694-4160-810c-5ea9fb353dac",
    name: "united states",
  },
  { uuid: "70ddeab9-c07a-46c6-a63a-b9ebde30082d", name: "Uruguay" },
  { uuid: "8310344d-4b26-4ce4-bc2c-90fa8750446e", name: "US Virgin Islands" },
  { uuid: "f81ee7d7-707d-4e02-82b0-93d9c84b1e0c", name: "Uzbekistan" },
  { uuid: "6a8b1977-f0a6-4fc7-9a3e-f2154fc59085", name: "Vanuatu" },
  { uuid: "49e11c54-a32c-4fee-97d6-248d1b6c0729", name: "Vatican City" },
  { uuid: "adf8cc66-ac09-4aa8-add0-badf96f20c69", name: "Venezuela" },
  { uuid: "47ecf584-ff0c-452e-806e-31d016166b89", name: "Vietnam " },
  {
    uuid: "e4036286-adae-41a3-af42-358133e1383e",
    name: "Wallis and Futuna Islands",
  },
  { uuid: "60919e13-949c-412e-bc5d-c83ab91eb9df", name: "Western Samoa" },
  { uuid: "a1c1256f-20fd-4dda-9ce9-e45968958f77", name: "Yemen " },
  { uuid: "b452739f-a0d5-48a0-88f0-4b7eb5a36479", name: "Zambia" },
  { uuid: "f8e2f567-fbe2-417e-8efa-d337386476e4", name: "Zimbabwe" },
];
