const { format, isAfter, parseISO, differenceInYears } = require("date-fns");
const { objNationalities: nationalities } = require("../data/nationalities");

const humanize = (name) => (name ? name.replace(/-/g, " ") : "invalid");

const getAge = (p) =>
  p.birthDate ? differenceInYears(new Date(), parseISO(p.birthDate)) : null;

function checkDigit(inputData) {
  // http://www.highprogrammer.com/alan/numbers/mrp.html#checkdigit
  let multiplier = 7;
  let total = 0;
  for (const char of inputData) {
    total += checkDigitDiagram[char] * multiplier;
    if (multiplier === 7) multiplier = 3;
    else if (multiplier === 3) multiplier = 1;
    else if (multiplier === 1) multiplier = 7;
  }

  const result = total % 10;
  return result.toString();
}
async function toSystem(integration, account) {
  const country = nationalities[account.country];
  return {
    username: integration?.username,
    password: integration?.password,
    adminEmailPassword: integration?.adminEmailPassword,
    ehajCode: integration.authenticatorCode || integration.ehajCode,
    country,
    // Write back path
    writeBack: "",
    embassy: integration?.embassy,
    name: integration?.targetSystemId,
    accountId: integration?.accountId,
    email: integration?.email,
  };
}

function toInfo(passengers) {
  return {
    pax: passengers.length,
    caravan: global.submission.name,
    // write back url - optional
    caravanUrl: "",
    munazim: "munazim",
    databaseURL: "",
    accessToken: "",
  };
}

function toDate(eventDate) {
  if (!eventDate)
    return {
      dmy: "",
      dmmmy: "",
      dd: "",
      mm: "",
      mmm: "",
      yyyy: "",
    };

  const parsed = parseISO(eventDate);
  return {
    dmy: format(parsed, "dd/MM/yyyy"),
    dmmmy: format(parsed, "dd-MMM-yyyy"),
    dd: format(parsed, "dd"),
    mm: format(parsed, "MM"),
    mmm: format(parsed, "MMM"),
    yyyy: format(parsed, "yyyy"),
  };
}

const splitQuad = (name) => {
  if (!name) return ["invalid", "invalid", "invalid", "invalid"];

  const nameArray = name
    .trim()
    .split(" ")
    .map((part) => humanize(part));

  switch (nameArray.length) {
    case 0:
      return ["invalid", "invalid", "invalid", "invalid"];
    case 1:
      return [nameArray[0], nameArray[0], "invalid", "invalid"];
    case 2:
      return [nameArray[0], "", "", nameArray[1]];
    case 3:
      return [nameArray[0], nameArray[1], "", nameArray[2]];
    case 4:
      return [nameArray[0], nameArray[1], nameArray[2], nameArray[3]];
    default:
      return [
        nameArray[0],
        nameArray[1],
        nameArray.slice(2, nameArray.length - 1).join(" "),
        nameArray[nameArray.length - 1],
      ];
  }
};

/**
 * Builds MRZ based on passenger data
 * @param passenger
 * @returns
 */
function toCodeLine(passenger) {
  let codeLine1 = "";
  let codeLine2 = "";
  const fullName = `${passenger.givenNames} ${passenger.surname}`;
  const nameQuad = splitQuad(fullName).map((n) => n.trim()?.replace(/ /g, "<"));

  codeLine1 =
    `P<${passenger.nationality}${nameQuad[3]}<<${nameQuad[0]}<${nameQuad[1]}<${nameQuad[2]}`
      .padEnd(44, "<")
      .replace(/[-]/g, "<");
  if (codeLine1.length > 44) codeLine1 = codeLine1.substring(0, 44);

  if (!passenger.passportNumber) {
    return null;
  }

  const paddedPassportNumber = passenger.passportNumber?.padEnd(9, "<");
  codeLine2 = passenger.passportNumber?.padEnd(9, "<");
  codeLine2 += checkDigit(paddedPassportNumber);
  codeLine2 += passenger.nationality;
  if (!passenger.birthDate) {
    return null;
  }
  const birthDate = format(parseISO(passenger.birthDate), "yyMMdd");
  codeLine2 += birthDate;
  codeLine2 += checkDigit(birthDate);
  if (!passenger.gender) {
    return null;
  }

  codeLine2 += passenger.gender.substring(0, 1);
  if (!passenger.passportExpiryDate) {
    return null;
  }
  const expireDate = format(parseISO(passenger.passportExpiryDate), "yyMMdd");
  codeLine2 += expireDate;
  codeLine2 += checkDigit(expireDate);
  const filler = "<".repeat(42 - codeLine2.length);
  codeLine2 += filler;
  codeLine2 += checkDigit(filler);

  // Composite check digit for characters of machine readable data of the lower line in positions 1 to 10, 14 to 20 and 22 to 43, including values for
  // letters that are a part of the number fields and their check digits.
  const compositeCheckDigit = checkDigit(
    codeLine2.substring(0, 10) +
      codeLine2.substring(13, 20) +
      codeLine2.substring(21, 43)
  );
  codeLine2 += compositeCheckDigit.replace(/[-]/g, "<");
  return `${codeLine1}${codeLine2}`;
}

function getPassengersByGender(passengers, gender, adultsOnly = true) {
  let result = passengers;
  if (gender) {
    result = passengers.filter((p) => p.gender === gender);
  }

  if (adultsOnly) {
    result = result.filter((p) => getAge(p) >= 18);
  } else {
    result = result.filter((p) => getAge(p) < 18);
  }

  return result.sort((a, b) => {
    if (!a.birthDate || !b.birthDate) {
      return -1;
    }
    if (isAfter(parseISO(a.birthDate), parseISO(b.birthDate))) {
      return 1;
    }

    return -1;
  });
}

function toPassengers(passengers) {
  // create sorted list of passengers
  const males = getPassengersByGender(passengers, "Male");
  const females = getPassengersByGender(passengers, "Female");
  const minors = getPassengersByGender(passengers, "", false);
  const sortedTravelers = males || [];
  sortedTravelers.push(...females);
  sortedTravelers.push(...minors);

  // start kea to eagle translation
  const eagleTravellers = [];
  for (const passenger of sortedTravelers) {
    const codeLine = passenger.mrz?.trim() ?? toCodeLine(passenger);
    const fullName = `${passenger.givenNames} ${passenger.surname}`;
    if (!codeLine) {
      // using continue here because we don't want to add a passenger to the list if we don't have a code line
      // eslint-disable-next-line no-continue
      continue;
    }
    const names = splitQuad(fullName);
    const namesArabic = passenger.nameArabic
      ? splitQuad(passenger.nameArabic)
      : ["", "", "", ""];
    const issuerCode = codeLine?.substring(2, 5);

    const eagleTraveler = {
      slug: `${fullName} ${getAge(passenger) ?? 0} ${passenger.gender ?? ""} ${
        passenger.nationality ?? ""
      }`,
      writeBack: "",
      nationality:
        passenger.nationality && nationalities[passenger.nationality],
      issuer: issuerCode ? nationalities[issuerCode] : undefined,
      name: {
        full: fullName.replace(/[^A-Z ]/g, " ")?.trim(),
        given: names.slice(0, -1).join(" ").trim(),
        first: names[0],
        last: names[3],
        father: names[1],
        grand: names[2],
      },
      nameArabic: {
        full: passenger.nameArabic,
        given: namesArabic.slice(0, -1).join(" ").trim(),
        first: namesArabic[0],
        last: namesArabic[3],
        father: namesArabic[1],
        grand: namesArabic[2],
      },
      mobileNumber: passenger.phone,
      email: passenger.email,
      gender: passenger.gender,
      dob: {
        ...toDate(passenger.birthDate),
        age: getAge(passenger),
      },
      passIssueDt: toDate(passenger.passportIssueDate),
      passExpireDt: toDate(passenger.passportExpiryDate),
      idIssueDt: toDate(passenger.residencyIssueDate),
      idExpireDt: toDate(passenger.residencyExpiryDate),
      birthPlace: passenger.passportBirthPlace,
      profession: passenger.profession ?? "unknown",
      address: "",
      passportNumber: passenger.passportNumber,
      idNumber: passenger.residencyNumber,
      mofaNumber: passenger.mofaNumber,
      eNumber: passenger.eNumber,
      placeOfIssue: passenger.passportIssuePlace,
      codeline: codeLine,
      images: {
        photo: passenger.photoUrl,
        passport: passenger.passportScanUrl,
        residency: passenger.residencyScanUrl,
        covid1: passenger.covidVaccination1ScanUrl,
        covid2: passenger.covidVaccination2ScanUrl,
        id: passenger.residencyScanUrl,
      },
    };
    eagleTravellers.push(eagleTraveler);
  }
  return eagleTravellers;
}

async function toData(passengers, integration, account) {
  return {
    system: await toSystem(integration, account),
    info: toInfo(passengers),
    travellers: toPassengers(passengers),
  };
}

module.exports = {
  toData,
};
