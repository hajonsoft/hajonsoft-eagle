const nationalities = JSON.parse(
  `[
        {
            "name": "",
            "arabicName": "",
            "code": "",
            "telCode": ""
        },
      {
          "name": "Ethiopia",
          "arabicName": "إثيوبيــــا",
          "code": "ETH",
          "telCode": "251"
      },
      {
          "name": "Aruba",
          "arabicName": "آروبا",
          "code": "ABW",
          "telCode": "297"
      },
      {
          "name": "Eritrea",
          "arabicName": "أريتيريا",
          "code": "ERI",
          "isArabic": true,
          "telCode": "291"
      },
      {
          "name": "Spain",
          "arabicName": "أسبانيا",
          "code": "ESP",
          "telCode": "34"
      },
      {
          "name": "Afghanistan",
          "arabicName": "أفغانستان",
          "code": "AFG",
          "isMission": true,
          "telCode": "93"
      },
      {
          "name": "Albania",
          "arabicName": "ألبانيا",
          "code": "ALB",
          "telCode": "355"
      },
      {
          "name": "Germany",
          "arabicName": "ألمانيا",
          "code": "DEU",
          "telCode": "49"
      },
      {
          "name": "Angola",
          "arabicName": "أنجولا",
          "code": "AGO",
          "telCode": "244"
      },
      {
          "name": "Anguilla",
          "arabicName": "أنجويلا",
          "code": "AIA",
          "telCode": "2641"
      },
      {
          "name": "Indonesia",
          "arabicName": "إندونسيا",
          "code": "IDN",
          "isMission": true,
          "telCode": "62"
      },
      {
          "name": "Uruguay",
          "arabicName": "أورجواى",
          "code": "URY",
          "telCode": "598"
      },
      {
          "name": "Uganda",
          "arabicName": "أوغندا",
          "code": "UGA",
          "telCode": "256"
      },
      {
          "name": "Azerbaijan",
          "arabicName": "اذربيجان",
          "code": "AZE",
          "telCode": "994"
      },
      {
          "name": "Armenia",
          "arabicName": "ارمينيا",
          "code": "ARM",
          "telCode": "374"
      },
      {
          "name": "Australia",
          "arabicName": "استراليا",
          "code": "AUS",
          "telCode": "61"
      },
      {
          "name": "Estonia",
          "arabicName": "استونيا",
          "code": "EST",
          "telCode": "372"
      },
      {
          "name": "Ukraine",
          "arabicName": "اكرانيا",
          "code": "UKR",
          "telCode": "380"
      },
      {
          "name": "United Arab Emirates",
          "arabicName": "الإمارات العربية المتحدة",
          "code": "ARE",
          "isArabic": true,
          "telCode": "971"
      },
      {
          "name": "Argentina",
          "arabicName": "الارجنتين",
          "code": "ARG",
          "telCode": "54"
      },
      {
          "name": "Jordan",
          "arabicName": "الاردن",
          "code": "JOR",
          "isArabic": true,
          "isMission": true,
          "telCode": "962"
      },
      {
          "name": "Ecuador",
          "arabicName": "الاكوادور",
          "code": "ECU",
          "telCode": "593"
      },
      {
          "name": "Bahrain",
          "arabicName": "البحرين",
          "code": "BHR",
          "isArabic": true,
          "telCode": "973"
      },
      {
          "name": "Brazil",
          "arabicName": "البرازيل",
          "code": "BRA",
          "telCode": "55"
      },
      {
          "name": "Portugal",
          "arabicName": "البرتغال",
          "code": "PRT",
          "telCode": "351"
      },
      {
          "name": "Bosnia and Herzegovina",
          "arabicName": "البوسنة",
          "code": "BIH",
          "telCode": "387"
      },
      {
          "name": "Gabon",
          "arabicName": "الجابون",
          "code": "GAB",
          "telCode": "241"
      },
      {
          "name": "MONTENEGRO",
          "arabicName": "الجبل الاسود",
          "code": "MNE",
          "telCode": "382"
      },
      {
          "name": "Algeria",
          "arabicName": "الجزائر",
          "code": "DZA",
          "isArabic": true,
          "isMission": true,
          "telCode": "213"
      },
      {
          "name": "Dominican",
          "arabicName": "الدمنيكان",
          "code": "DMA"
      },
      {
          "name": "Denmark",
          "arabicName": "الدنمارك",
          "code": "DNK",
          "telCode": "45"
      },
      {
          "name": "Salvador",
          "arabicName": "السلفادور",
          "code": "SLV",
          "telCode": "503"
      },
      {
          "name": "Senegal",
          "arabicName": "السنغال",
          "code": "SEN",
          "telCode": "221"
      },
      {
          "name": "Sudan",
          "arabicName": "السودان",
          "code": "SDN",
          "isArabic": true,
          "isMission": true,
          "telCode": "249"
      },
      {
          "name": "Sweden",
          "arabicName": "السويد",
          "code": "SWE",
          "telCode": "46"
      },
      {
          "name": "Somalia",
          "arabicName": "الصومال",
          "code": "SOM",
          "isArabic": true,
          "telCode": "252"
      },
      {
          "name": "China",
          "arabicName": "الصين",
          "code": "CHN",
          "telCode": "86"

      },
      {
          "name": "Iraq",
          "arabicName": "العراق",
          "code": "IRQ",
          "isArabic": true,
          "telCode": "964"
      },
      {
          "name": "Vatican City",
          "arabicName": "الفاتيكان",
          "code": "VAT",
          "telCode": "1039"
      },
      {
          "name": "Philippines",
          "arabicName": "الفلبين",
          "code": "PHL",
          "telCode": "63"
      },
      {
          "name": "Cameroon",
          "arabicName": "الكاميرون",
          "code": "CMR",
          "telCode": "237"
      },
      {
          "name": "Congo COG",
          "arabicName": "الكنغو",
          "code": "COG",
          "telCode": "243"
      },
      {
          "name": "Kuwait",
          "arabicName": "الكويت",
          "code": "KWT",
          "isArabic": true,
          "telCode": "965"
      },
      {
          "name": "Maldives",
          "arabicName": "المالديف",
          "code": "MDV",
          "telCode": "960"
      },
      {
          "name": "Hungary",
          "arabicName": "المجر",
          "code": "HUN",
          "telCode": "36"
      },
      {
          "name": "Morocco",
          "arabicName": "المغرب",
          "code": "MAR",
          "isArabic": true,
          "isMission": true,
          "telCode": "212"
      },
      {
          "name": "Mexico",
          "arabicName": "المكسيك‏",
          "code": "MEX",
          "telCode": "52"
      },
      {
          "name": "Kingdom Saudi Arabia",
          "arabicName": "المملكة العربية السعودية",
          "code": "SAU",
          "isArabic": true,
          "telCode": "966"
      },
      {
          "name": "United Kingdom",
          "arabicName": "المملكة المتحدة",
          "code": "GBR",
          "telCode": "44"
      },
      {
          "name": "Norway",
          "arabicName": "النرويج",
          "code": "NOR",
          "telCode": "47"
      },
      {
          "name": "Austria",
          "arabicName": "النمسا",
          "code": "AUT",
          "telCode": "43"
      },
      {
          "name": "Niger",
          "arabicName": "النيجر",
          "code": "NER",
          "isMission": true,
          "telCode": "227"
      },
      {
          "name": "India",
          "arabicName": "الهند",
          "code": "IND",
          "isMission": true,
          "telCode": "91"
      },
      {
          "name": "United States",
          "arabicName": "الولايات المتحدة الامريكية",
          "code": "USA",
          "telCode": "1"
      },
      {
          "name": "Japan",
          "arabicName": "اليابان",
          "code": "JPN",
          "telCode": "81"
      },
      {
          "name": "Yemen",
          "arabicName": "اليمن",
          "code": "YEM",
          "isArabic": true,
          "isMission": true,
          "telCode": "967"
      },
      {
          "name": "Greece",
          "arabicName": "اليونان",
          "code": "GRC",
          "telCode": "30"
      },
      {
          "name": "Antigua and Barbuda",
          "arabicName": "انتيجوا و باربودا",
          "code": "ATG",
          "telCode": "268"
      },
      {
          "name": "Andorra",
          "arabicName": "اندورا",
          "code": "AND",
          "telCode": "376"
      },
      {
          "name": "Uzbekistan",
          "arabicName": "اوزبكستان",
          "code": "UZB",
          "telCode": "998"
      },
      {
          "name": "Iran",
          "arabicName": "ايران",
          "code": "IRN",
          "telCode": "98"
      },
      {
          "name": "Ireland",
          "arabicName": "ايرلاندا",
          "code": "IRL",
          "telCode": "353"
      },
      {
          "name": "Iceland",
          "arabicName": "ايسلاندا",
          "code": "ISL",
          "telCode": "354"
      },
      {
          "name": "Italy",
          "arabicName": "ايطاليا",
          "code": "ITA",
          "telCode": "39"
      },
      {
          "name": "Papua New Guinea",
          "arabicName": "بابوا - نيو - جونييا",
          "code": "PNG",
          "telCode": "675"
      },
      {
          "name": "Paraguay",
          "arabicName": "باراجواى",
          "code": "PRY",
          "telCode": "595"
      },
      {
          "name": "Barbados",
          "arabicName": "باربادوس",
          "code": "BRB",
          "telCode": "1246"
      },
      {
          "name": "Barbados",
          "arabicName": "باربادوس",
          "code": "BRD",
          "telCode": "1246"
      },
      {
          "name": "Pakistan",
          "arabicName": "باكستان",
          "code": "PAK",
          "isMission": true,
          "telCode": "92"
      },
      {
          "name": "Palau",
          "arabicName": "بالو",
          "code": "PLW",
          "telCode": "680"
      },
      {
          "name": "Bermuda",
          "arabicName": "برمودا",
          "code": "BMU",
          "telCode": "441"
      },
      {
          "name": "Brunei",
          "arabicName": "بروناى",
          "code": "BRN",
          "telCode": "673"
      },
      {
          "name": "Belgium",
          "arabicName": "بلجيكا",
          "code": "BEL",
          "telCode": "32"
      },
      {
          "name": "Bulgaria",
          "arabicName": "بلغاريا",
          "code": "BGR",
          "telCode": "359"
      },
      {
          "name": "Belize",
          "arabicName": "بليز",
          "code": "BLZ",
          "telCode": "501"
      },
      {
          "name": "Bangladesh",
          "arabicName": "بنجلاديش",
          "code": "BGD",
          "telCode": "880"
      },
      {
          "name": "Panama",
          "arabicName": "بنما",
          "code": "PAN",
          "telCode": "507"
      },
      {
          "name": "Benin",
          "arabicName": "بنين",
          "code": "BEN",
          "telCode": "229"
      },
      {
          "name": "Bhutan",
          "arabicName": "بوتان",
          "code": "BTN",
          "telCode": "975"
      },
      {
          "name": "Botswana",
          "arabicName": "بوتسوانا",
          "code": "BWA",
          "telCode": "267"
      },
      {
          "name": "Puerto Rico",
          "arabicName": "بورتوريكو",
          "code": "PRI",
          "telCode": "1787"
      },
      {
          "name": "Burkina Faso",
          "arabicName": "بوركينا",
          "code": "BFA",
          "telCode": "226"
      },
      {
          "name": "Burundi",
          "arabicName": "بوروندى",
          "code": "BDI",
          "telCode": "257"
      },
      {
          "name": "Poland",
          "arabicName": "بولندا",
          "code": "POL",
          "telCode": "48"
      },
      {
          "name": "Bolivia",
          "arabicName": "بوليفيا",
          "code": "BOL",
          "telCode": "591"
      },
      {
          "name": "French Polynesia",
          "arabicName": "بولينيزيا الفرنسية",
          "code": "PYF",
          "isArabic": false,
          "telCode": "689"
      },
      {
          "name": "Peru",
          "arabicName": "بيرو",
          "code": "PER",
          "telCode": "51"
      },
      {
          "name": "Belarus",
          "arabicName": "بيلاروس",
          "code": "BLR",
          "telCode": "375"
      },
      {
          "name": "Thailand",
          "arabicName": "تايلاند",
          "code": "THA",
          "isMission": true,
          "telCode": "66"
      },
      {
          "name": "Taiwan",
          "arabicName": "تايوان",
          "code": "TWN",
          "telCode": "886"
      },
      {
          "name": "Turkmenistan",
          "arabicName": "تركمنستان",
          "code": "TKM",
          "telCode": "993"
      },
      {
          "name": "Turkey",
          "arabicName": "تركيا",
          "code": "TUR",
          "isMission": true,
          "telCode": "90"
      },
      {
          "name": "Trinidad and tobago",
          "arabicName": "ترينيداد وتوباجو",
          "code": "TTO",
          "telCode": "868"
      },
      {
          "name": "Chad",
          "arabicName": "تشاد",
          "code": "TCD",
          "telCode": "235"
      },
      {
          "name": "Chile",
          "arabicName": "تشيلي",
          "code": "CHL",
          "telCode": "56"
      },
      {
          "name": "Tanzania",
          "arabicName": "تنزانيا",
          "code": "TZA",
          "telCode": "2551"
      },
      {
          "name": "Togo",
          "arabicName": "توجو",
          "code": "TGO",
          "telCode": "228"
      },
      {
          "name": "Tuvalu",
          "arabicName": "توفالــــــــو",
          "code": "TUV",
          "telCode": "688"
      },
      {
          "name": "Tokelau",
          "arabicName": "توكيلاو",
          "code": "TKL",
          "telCode": "690"
      },
      {
          "name": "Tonga Islands",
          "arabicName": "تونجــا",
          "code": "TON",
          "telCode": "676"
      },
      {
          "name": "Tunisia",
          "arabicName": "تونس",
          "code": "TUN",
          "isArabic": true,
          "isMission": true,
          "telCode": "216"
      },
      {
          "name": "Jamaica",
          "arabicName": "جامايكا",
          "code": "JAM",
          "telCode": "876"
      },
      {
          "name": "Gambia",
          "arabicName": "جامبيا",
          "code": "GMB",
          "telCode": "220"
      },
      {
          "name": "Gibraltar",
          "arabicName": "جبل طــــارق",
          "code": "GIB",
          "telCode": "350"
      },
      {
          "name": "Green Land",
          "arabicName": "جرين لاند",
          "code": "GRL",
          "telCode": "299"
      },
      {
          "name": "Grenada",
          "arabicName": "جرينادا",
          "code": "GRD",
          "telCode": "473"
      },
      {
          "name": "Islands - Falkland",
          "arabicName": "جزر - فوكلاند",
          "code": "FLK",
          "telCode": "500"
      },
      {
          "name": "Bahamas",
          "arabicName": "جزر البهاما",
          "code": "BHS",
          "telCode": "1242"
      },
      {
          "name": "Comoros Islands",
          "arabicName": "جزر القمر",
          "code": "COM",
          "isArabic": true,
          "telCode": "2691"
      },
      {
          "name": "Turks and Caicos Islands",
          "arabicName": "جزر تركس وكايكوس",
          "code": "TCA",
          "telCode": "649"
      },
      {
          "name": "Solomon Islands",
          "arabicName": "جزر سليمــــان",
          "code": "SLB",
          "telCode": "677"
      },
      {
          "name": "US Virgin Islands",
          "arabicName": "جزر فرجين",
          "code": "VGB",
          "telCode": "340"
      },
      {
          "name": "British Virgin Islands",
          "arabicName": "جزر فيرجينيا",
          "code": "VIR",
          "telCode": "284"
      },
      {
          "name": "Cayman Islands",
          "arabicName": "جزر كايمان",
          "code": "CYM",
          "telCode": "345"
      },
      {
          "name": "Cook Islands",
          "arabicName": "جزر كوك",
          "code": "COK",
          "telCode": "682"
      },
      {
          "name": "Cocos Islands",
          "arabicName": "جزر كوكوس",
          "code": "CCK",
          "telCode": "2061"
      },
      {
          "name": "Marshall Islands",
          "arabicName": "جزر مارشال",
          "code": "MHN",
          "telCode": "692"
      },
      {
          "name": "Marshall Islands",
          "arabicName": "جزر مارشال",
          "code": "MHL",
          "telCode": "692"
      },
      {
          "name": "Christmas Island",
          "arabicName": "جزيرة كريسماس",
          "code": "CXR",
          "telCode": "1061"
      },
      {
          "name": "Norfolk Island",
          "arabicName": "جزيرة نورفولك",
          "code": "NFK",
          "telCode": "6722"
      },
      {
          "name": "South Sudan",
          "arabicName": "جمهوربة جنوب السودان",
          "code": "SSD",
          "isMission": true,
          "telCode": "211"
      },
      {
          "name": "Czech Republic",
          "arabicName": "جمهورية التشيك",
          "code": "CZE",
          "telCode": "420"
      },
      {
          "name": "Dominican Republic",
          "arabicName": "جمهورية الدمنيكان",
          "code": "DOM",
          "telCode": "767"
      },
      {
          "name": "Slovakia",
          "arabicName": "جمهورية سلوفاكيا",
          "code": "SVK",
          "telCode": "421"
      },
      {
          "name": "Moldavia",
          "arabicName": "جمهورية مالدوفا",
          "code": "MDA",
          "telCode": "373"
      },
      {
          "name": "Central African Republic",
          "ArabicName": "جمهورية وسط أفريقيا",
          "code": "CAF",
          "telCode": "236"
      },
      {
          "name": "South Africa",
          "arabicName": "جنوب أفريقيا",
          "code": "ZAF",
          "isMission": true,
          "telCode": "27"
      },
      {
          "name": "Guatemala",
          "arabicName": "جواتيمالا",
          "code": "GTM",
          "telCode": "502"
      },
      {
          "name": "Guam",
          "arabicName": "جوام",
          "code": "GUM",
          "telCode": "671"
      },
      {
          "name": "French Guiana",
          "arabicName": "جوانا الفرنسية",
          "code": "GUF",
          "telCode": "594"
      },
      {
          "name": "Georgia",
          "arabicName": "جورجيا",
          "code": "GEO",
          "telCode": "995"
      },
      {
          "name": "Guyana",
          "arabicName": "جويانا",
          "code": "GUY",
          "telCode": "592"
      },
      {
          "name": "Djibouti",
          "arabicName": "جيبوتى",
          "code": "DJI",
          "isArabic": true,
          "telCode": "253"
      },
      {
          "name": "Rwanda",
          "arabicName": "روانــــــــــدا",
          "code": "RWA",
          "telCode": "250"
      },
      {
          "name": "Russia",
          "arabicName": "روسيا الإتحادية",
          "code": "RUS",
          "telCode": "7002"
      },
      {
          "name": "Romania",
          "arabicName": "رومانيا",
          "code": "ROU",
          "telCode": "40"
      },
      {
          "name": "Zambia",
          "arabicName": "زامبيا",
          "code": "ZMB",
          "telCode": "260"
      },
      {
          "name": "Zimbabwe",
          "arabicName": "زيمبابوى",
          "code": "ZIM",
          "telCode": "263"
      },
      {
          "name": "Western Samoa",
          "arabicName": "ساموا",
          "code": "WSM",
          "telCode": "685"
      },
      {
          "name": "American Samoa",
          "arabicName": "ساموا الأمريكية",
          "code": "ASM",
          "telCode": "684"
      },
      {
          "name": "San Marino",
          "arabicName": "سان مارينو",
          "code": "SMR",
          "telCode": "378"
      },
      {
          "name": "St. Lucia",
          "arabicName": "ســانت لوتشــيا",
          "code": "LCA",
          "telCode": "758"
      },
      {
          "name": "Sri Lanka",
          "arabicName": "سريلانكا",
          "code": "LKA",
          "telCode": "94"
      },
      {
          "name": "Slovenia",
          "arabicName": "سلوفينيا",
          "code": "SVN",
          "telCode": "386"
      },
      {
          "name": "Singapore",
          "arabicName": "سنغافورة",
          "code": "SGP",
          "telCode": "65"
      },
      {
          "name": "Swaziland",
          "arabicName": "سوازيـلانـــــــــد",
          "code": "SWZ",
          "telCode": "2683"
      },
      {
          "name": "Syria",
          "arabicName": "سوريا",
          "code": "SYR",
          "isArabic": true,
          "isMission": true,
          "telCode": "963"
      },
      {
          "name": "Suriname",
          "arabicName": "سورينام",
          "code": "SUR",
          "telCode": "597"
      },
      {
          "name": "Switzerland",
          "arabicName": "سويسرا",
          "code": "CHE",
          "telCode": "41"
      },
      {
          "name": "Sierra Leone",
          "arabicName": "سيراليون",
          "code": "SLE",
          "telCode": "232"
      },
      {
          "name": "Seychelles",
          "arabicName": "سيشل",
          "code": "SYC",
          "telCode": "248"
      },
      {
          "name": "East Timor",
          "arabicName": "شرق تيمور",
          "code": "TMP",
          "telCode": "6701"
      },
      {
          "name": "Serbia",
          "arabicName": "صربيا",
          "code": "SRB",
          "telCode": "381"
      },
      {
          "name": "Tajikistan",
          "arabicName": "طاجكستان",
          "code": "TJK",
          "telCode": "992"
      },
      {
          "name": "Ghana",
          "arabicName": "غانـا",
          "code": "GHA",
          "telCode": "233"
      },
      {
          "name": "Guinea",
          "arabicName": "غينيا",
          "code": "GIN"
      },
      {
          "name": "Equatorial Guinea",
          "arabicName": "غينيا الأستوائية",
          "code": "GNQ",
          "telCode": "240"
      },
      {
          "name": "Guinea Bissau",
          "arabicName": "غينيا بيساو",
          "code": "GNB",
          "telCode": "245"
      },
      {
          "name": "Vanuatu",
          "arabicName": "فانواتو",
          "code": "VUT",
          "telCode": "678"
      },
      {
          "name": "France",
          "arabicName": "فرنسا",
          "code": "FRA",
          "telCode": "33"
      },
      {
          "name": "Palestine",
          "arabicName": "فلسطين",
          "code": "PSE",
          "isArabic": true,
          "isMission": true,
          "telCode": "970"
      },
      {
          "name": "Venezuela",
          "arabicName": "فنزويلا",
          "code": "VEN",
          "telCode": "58"
      },
      {
          "name": "Finland",
          "arabicName": "فنلاندا",
          "code": "FIN",
          "telCode": "358"
      },
      {
          "name": "Fiji",
          "arabicName": "فيجــــــى",
          "code": "FJI",
          "telCode": "679"
      },
      {
          "name": "Vietnam",
          "arabicName": "فييتنام",
          "code": "VNM",
          "telCode": "84"
      },
      {
          "name": "Cyprus",
          "arabicName": "قبرص",
          "code": "CYP",
          "telCode": "357"
      },
      {
          "name": "Kyrgyzstan",
          "arabicName": "قرغيزستان",
          "code": "KGZ",
          "telCode": "996"
      },
      {
          "name": "Qatar",
          "arabicName": "قطر",
          "code": "QAT",
          "isArabic": true,
          "telCode": "974"
      },
      {
          "name": "Cape Verde Islands",
          "arabicName": "كاب فيرد",
          "code": "CPV",
          "telCode": "238"
      },
      {
          "name": "Kazakhstan",
          "arabicName": "كاذاخستان",
          "code": "KAZ",
          "telCode": "7001"
      },
      {
          "name": "Cambodia",
          "arabicName": "كامبوديا",
          "code": "KHM",
          "telCode": "855"
      },
      {
          "name": "Croatia",
          "arabicName": "كرواتيا",
          "code": "HRV",
          "telCode": "385"
      },
      {
          "name": "Canada",
          "arabicName": "كندا",
          "code": "CAN",
          "telCode": "1112"
      },
      {
          "name": "Cuba",
          "arabicName": "كوبا",
          "code": "CUB",
          "telCode": "53"
      },
      {
          "name": "Cote Divoire",
          "arabicName": "كوت دي فوار",
          "code": "CIV",
          "isMission": true,
          "telCode": "225"
      },
      {
          "name": "South Korea",
          "arabicName": "كوريا الجنــوبية",
          "code": "KOR",
          "telCode": "82"
      },
      {
          "name": "North Korea",
          "arabicName": "كوريا الشمالية",
          "code": "PRK",
          "telCode": "850"
      },
      {
          "name": "Costa Rica",
          "arabicName": "كوستاريكا",
          "code": "CRI",
          "telCode": "506"
      },
      {
          "name": "Kosovo",
          "arabicName": "كوسوفا",
          "code": "RKS",
          "telCode": "550"
      },
      {
          "name": "Colombia",
          "arabicName": "كولومبيا",
          "code": "COL",
          "telCode": "57"
      },
      {
          "name": "Kiribati",
          "arabicName": "كيريباتيا",
          "code": "KIR",
          "telCode": "686"
      },
      {
          "name": "Kenya",
          "arabicName": "كينيا",
          "code": "KEN",
          "telCode": "254"
      },
      {
          "name": "Latvia",
          "arabicName": "لاتفيا",
          "code": "LVA",
          "telCode": "371"
      },
      {
          "name": "Laos",
          "arabicName": "لاوس",
          "code": "LAO",
          "telCode": "856"
      },
      {
          "name": "Lebanon",
          "arabicName": "لبنان",
          "code": "LBN",
          "isArabic": true,
          "telCode": "961"
      },
      {
          "name": "Lithuania",
          "arabicName": "لتوانيا",
          "code": "LTU",
          "telCode": "370"
      },
      {
          "name": "Luxembourg",
          "arabicName": "لوكسمبورج",
          "code": "LUX",
          "telCode": "352"
      },
      {
          "name": "Libya",
          "arabicName": "ليبيا",
          "code": "LBY",
          "isArabic": true,
          "telCode": "218"
      },
      {
          "name": "Liberia",
          "arabicName": "ليبيريا",
          "code": "LBR",
          "isMission": true,
          "telCode": "231"
      },
      {
          "name": "Lesotho",
          "arabicName": "ليسوتو",
          "code": "LSO",
          "telCode": "266"
      },
      {
          "name": "Macau",
          "arabicName": "ماكاو",
          "code": "MAC",
          "telCode": "853"
      },
      {
          "name": "Macedonia",
          "arabicName": "ماكيدونيا",
          "code": "MKD",
          "telCode": "389"
      },
      {
          "name": "Malawi",
          "arabicName": "مالاوى",
          "code": "MWI",
          "telCode": "265"
      },
      {
          "name": "Malta",
          "arabicName": "مالطا",
          "code": "MLT",
          "telCode": "356"
      },
      {
          "name": "Mali",
          "arabicName": "مالى",
          "code": "MLI",
          "isMission": true,
          "telCode": "223"
      },
      {
          "name": "Malaysia",
          "arabicName": "ماليزيا",
          "code": "MYS",
          "isMission": true,
          "telCode": "60"
      },
      {
          "name": "Mayotte",
          "arabicName": "مايوت",
          "code": "MYT",
          "telCode": "2692"
      },
      {
          "name": "Madagascar",
          "arabicName": "مدغـشقر",
          "code": "MDG",
          "telCode": "261"
      },
      {
          "name": "Egypt",
          "arabicName": "مصر",
          "code": "EGY",
          "isArabic": true,
          "isMission": true,
          "telCode": "20"
      },
      {
          "name": "Mongolia",
          "arabicName": "منغوليا",
          "code": "MNG",
          "telCode": "976"
      },
      {
          "name": "Mauritania",
          "arabicName": "موريتانيا",
          "code": "MRT",
          "isArabic": true,
          "isMission": true,
          "telCode": "222"
      },
      {
          "name": "Mauritius",
          "arabicName": "موريشيوس",
          "code": "MUS",
          "telCode": "230"
      },
      {
          "name": "Mozambique",
          "arabicName": "موزمبيق",
          "code": "MOZ",
          "telCode": "258"
      },
      {
          "name": "Monaco",
          "arabicName": "موناكو",
          "code": "MCO",
          "telCode": "377"
      },
      {
          "name": "Montserrat",
          "arabicName": "مونتسرات",
          "code": "MSR",
          "telCode": "664"
      },
      {
          "name": "Myanmar",
          "arabicName": "مينمار",
          "code": "MMR",
          "telCode": "95"
      },
      {
          "name": "Namibia",
          "arabicName": "نامبيا",
          "code": "NAM",
          "telCode": "2642"
      },
      {
          "name": "Nauru",
          "arabicName": "ناورو",
          "code": "NRU",
          "telCode": "674"
      },
      {
          "name": "Nepal",
          "arabicName": "نيبال",
          "code": "NPL",
          "telCode": "977"
      },
      {
          "name": "Nigeria",
          "arabicName": "نيجيريا",
          "code": "NGA",
          "isMission": true,
          "telCode": "234"
      },
      {
          "name": "Nicaragua",
          "arabicName": "نيكاراجوا",
          "code": "NIC",
          "telCode": "505"
      },
      {
          "name": "New Caledonia",
          "arabicName": "نيو - كاليدونيا",
          "code": "NCL",
          "telCode": "687"
      },
      {
          "name": "New Zealand",
          "arabicName": "نيوزيلاند",
          "code": "NZL",
          "telCode": "64"
      },
      {
          "name": "Niue",
          "arabicName": "نيوى جزر",
          "code": "NIU",
          "telCode": "683"
      },
      {
          "name": "Haiti",
          "arabicName": "هايتى",
          "code": "HTI",
          "telCode": "509"
      },
      {
          "name": "Honduras",
          "arabicName": "هندوراس",
          "code": "HND",
          "telCode": "504"
      },
      {
          "name": "Netherlands",
          "arabicName": "هولندا",
          "code": "NLD",
          "telCode": "31"
      },
      {
          "name": "St. Helena",
          "arabicName": "هيلينا",
          "code": "SHN",
          "telCode": "290"
      },
      {
          "name": "Yugoslavia",
          "arabicName": "يوغسلافيا",
          "code": "YUG",
          "telCode": "3812"
      },
      {
          "name": "Reunion",
          "arabicName": "ريونيون",
          "code": "REU",
          "telCode": "262"
      },
      {
          "name": "Zimbabwe ZWE",
          "arabicName": "زمبابوي",
          "code": "ZWE",
          "telCode": "263"
      },
      {
          "name": "United Kingdom GBO",
          "arabicName": "المملكة المتحدة",
          "code": "GBO"
      },
      {
          "name": "United Kingdom GBD",
          "arabicName": "المملكة المتحدة",
          "code": "GBD"
      },
      {
          "name": "United Kingdom GBS",
          "arabicName": "المملكة المتحدة",
          "code": "GBS"
      },
      {
          "name": "United Kingdom GBP",
          "arabicName": "المملكة المتحدة",
          "code": "GBP",
          "telCode": "44"
      },
      {
          "name": "United Kingdom GBN",
          "arabicName": "المملكة المتحدة",
          "code": "GBN"
      },
      {
          "name": "Dominican DMA",
          "arabicName": "جمهورية الدمنيكان",
          "code": "DMA"
      },
      {
          "name": "Stateless Convention XXB",
          "code": "XXB"
      },
      {
        "name": "Stateless Other XXC",
        "code": "XXC"
      },
      {
          "name": "Stateless undetermined XXX",
          "code": "XXX"
      },
      {
          "name": "Serbia 381",
          "arabicName": "صربيا",
          "code": "SRB"
      },
      {
          "name": "Stateless XXA",
          "code": "XXA"
      },
      {
          "name": "Liechtenstein",
          "arabicName": "ليختنشتاين",
          "code": "LIE",
          "telCode": "423"
      },
      {
          "name": "Congo COD",
          "arabicName": "الكنغو",
          "code": "COD",
          "telCode": "242"
      }
  ]`
);

// HSF Nationalities Dictionary. TODO: Move to a separate file
// Nationality value uses some wiered numbering for example egypt is 71.
const hsf_nationalities = [
  { value: "9", name: "Afghanistan" },
  { value: "12", name: "Albania" },
  { value: "69", name: "Algeria" },
  { value: "17", name: "American Samoa" },
  { value: "13", name: "Andorra" },
  { value: "10", name: "Angola" },
  { value: "11", name: "Anguilla" },
  { value: "18", name: "Antarctic" },
  { value: "20", name: "Antigua And Barbuda" },
  { value: "15", name: "Argentina" },
  { value: "16", name: "Armenia" },
  { value: "8", name: "Aruba" },
  { value: "22", name: "Australia" },
  { value: "23", name: "Austria" },
  { value: "24", name: "Azerbaijan" },
  { value: "32", name: "Bahamas" },
  { value: "31", name: "Bahrain" },
  { value: "29", name: "Bangladesh" },
  { value: "39", name: "Barbados" },
  { value: "34", name: "Belarus" },
  { value: "26", name: "Belgium" },
  { value: "35", name: "Belize" },
  { value: "27", name: "Benin" },
  { value: "36", name: "Bermuda" },
  { value: "41", name: "Bhutan" },
  { value: "37", name: "Bolivia" },
  { value: "33", name: "Bosnia" },
  { value: "43", name: "Botswana" },
  { value: "42", name: "Bouvet Island" },
  { value: "38", name: "Brazil" },
  { value: "108", name: "British Indian Ocean Territory" },
  { value: "40", name: "Brunei Darussalam" },
  { value: "30", name: "Bulgaria" },
  { value: "28", name: "Burkina Faso" },
  { value: "25", name: "Burundi" },
  { value: "120", name: "Cambodia" },
  { value: "51", name: "Cameroon" },
  { value: "45", name: "Canada" },
  { value: "57", name: "Cape Verde" },
  { value: "61", name: "Cayman Island" },
  { value: "44", name: "Central African Republic" },
  { value: "213", name: "Chad" },
  { value: "48", name: "Chile" },
  { value: "49", name: "China" },
  { value: "60", name: "Christmas Island" },
  { value: "46", name: "Cocos Island" },
  { value: "55", name: "Colombia" },
  { value: "56", name: "Comoros" },
  { value: "53", name: "Congo" },
  { value: "54", name: "Cook Island" },
  { value: "58", name: "Costa Rica" },
  { value: "50", name: "Cote Divoire" },
  { value: "103", name: "Croatia" },
  { value: "59", name: "Cuba" },
  { value: "62", name: "Cyprus" },
  { value: "63", name: "Czech Republic" },
  { value: "253", name: "Democratic Republic of the Congo" },
  { value: "67", name: "Denmark" },
  { value: "65", name: "Djibouti" },
  { value: "66", name: "Dominica" },
  { value: "68", name: "Dominican Republic" },
  { value: "70", name: "Ecuador" },
  { value: "71", name: "Egypt" },
  { value: "200", name: "El Salvador" },
  { value: "92", name: "Equatorial  Guinea" },
  { value: "72", name: "Eritrea" },
  { value: "74", name: "Estonia" },
  { value: "75", name: "Ethiopia" },
  { value: "78", name: "Falkland Islands" },
  { value: "80", name: "Faroe Islands" },
  { value: "77", name: "Fiji" },
  { value: "76", name: "Finland" },
  { value: "79", name: "France" },
  { value: "82", name: "France, Meteropolitan" },
  { value: "97", name: "French Guiana" },
  { value: "184", name: "French Polynesia" },
  { value: "19", name: "French Southern and Antarctic" },
  { value: "83", name: "Gabon" },
  { value: "90", name: "Gambia" },
  { value: "85", name: "Georgia" },
  { value: "64", name: "Germany" },
  { value: "86", name: "Ghana" },
  { value: "87", name: "Gibraltar" },
  { value: "93", name: "Greece" },
  { value: "95", name: "Greenland" },
  { value: "94", name: "Grenada" },
  { value: "89", name: "Guadeloupe" },
  { value: "98", name: "Guam" },
  { value: "96", name: "Guatemala" },
  { value: "88", name: "Guinea" },
  { value: "91", name: "Guinea-Bissau" },
  { value: "99", name: "Guyana" },
  { value: "104", name: "Haiti" },
  { value: "101", name: "Heard Island and Mcdonald Island" },
  { value: "233", name: "Holy See(Vatican City State)" },
  { value: "102", name: "Honduras" },
  { value: "100", name: "Hong Kong China" },
  { value: "105", name: "Hungary" },
  { value: "112", name: "Iceland" },
  { value: "107", name: "India" },
  { value: "106", name: "Indonesia" },
  { value: "110", name: "Iran" },
  { value: "111", name: "Iraq" },
  { value: "109", name: "Ireland" },
  { value: "113", name: "Italy" },
  { value: "114", name: "Jamaica" },
  { value: "116", name: "Japan" },
  { value: "115", name: "Jordan" },
  { value: "117", name: "Kazakhstan" },
  { value: "118", name: "Kenya" },
  { value: "190", name: "Kingdom Saudi Arabia" },
  { value: "121", name: "Kiribati" },
  { value: "123", name: "Korea , Republic of" },
  { value: "180", name: "Korea, Democratic People's Republic of" },
  { value: "252", name: "Kosova" },
  { value: "124", name: "Kuwait" },
  { value: "119", name: "Kyrgyzstan" },
  { value: "125", name: "Lao People's Democratic Republic" },
  { value: "135", name: "Latvia" },
  { value: "126", name: "Lebanon" },
  { value: "132", name: "Lesotho" },
  { value: "127", name: "Liberia" },
  { value: "128", name: "Libya Arab Jamahiriya" },
  { value: "130", name: "Liechtenstein" },
  { value: "133", name: "Lithuania" },
  { value: "134", name: "Luxembourg" },
  { value: "136", name: "Macau China" },
  { value: "140", name: "Madagascar" },
  { value: "155", name: "Malawi" },
  { value: "156", name: "Malaysia" },
  { value: "141", name: "Maldives" },
  { value: "145", name: "Mali" },
  { value: "146", name: "Malta" },
  { value: "143", name: "Marshall Islands" },
  { value: "153", name: "Martinique" },
  { value: "151", name: "Mauritania" },
  { value: "154", name: "Mauritius" },
  { value: "157", name: "Mayotte" },
  { value: "142", name: "Mexico" },
  { value: "81", name: "Micronesia , Federated Stat" },
  { value: "139", name: "Moldova, Republic of" },
  { value: "138", name: "Monaco" },
  { value: "148", name: "Mongolia" },
  { value: "255", name: "MONTENEGRO" },
  { value: "152", name: "Montserrat" },
  { value: "137", name: "Morcco" },
  { value: "150", name: "Mozambique" },
  { value: "147", name: "Myanmar" },
  { value: "158", name: "Namibia" },
  { value: "168", name: "Nauru" },
  { value: "167", name: "Nepal" },
  { value: "165", name: "Netherlands" },
  { value: "21", name: "Netherlands Antilles" },
  { value: "159", name: "New Caledonia" },
  { value: "169", name: "New Zealand" },
  { value: "163", name: "Nicaragua" },
  { value: "160", name: "Niger" },
  { value: "162", name: "Nigeria" },
  { value: "164", name: "Niue" },
  { value: "248", name: "Non-Bahraini" },
  { value: "250", name: "Non-Emirati" },
  { value: "247", name: "Non-Kuwaiti" },
  { value: "251", name: "Non-Omani" },
  { value: "249", name: "Non-Qatari" },
  { value: "161", name: "Norfolk Island" },
  { value: "144", name: "North Macedonia" },
  { value: "149", name: "Northern Mariana Islands" },
  { value: "166", name: "Norway" },
  { value: "170", name: "Oman" },
  { value: "171", name: "Pakistan" },
  { value: "176", name: "Palau" },
  { value: "183", name: "Palestinian Territory, Occupied" },
  { value: "172", name: "Panama" },
  { value: "177", name: "Papua New Guinea" },
  { value: "182", name: "Paraguay" },
  { value: "174", name: "Peru" },
  { value: "175", name: "Philippines" },
  { value: "173", name: "Pitcairn Islands" },
  { value: "178", name: "Poland" },
  { value: "181", name: "Portugal" },
  { value: "179", name: "Puerto Rico" },
  { value: "185", name: "Qatar" },
  { value: "256", name: "Republic of South Sudan" },
  { value: "186", name: "Reunion" },
  { value: "187", name: "Romania" },
  { value: "188", name: "Russian Federation" },
  { value: "189", name: "Rwanda" },
  { value: "122", name: "Saint Kitts and Nevis" },
  { value: "129", name: "Saint Lucia" },
  { value: "203", name: "Saint pierre and Miquelon" },
  { value: "234", name: "Saint Vincent and  the Grenadines" },
  { value: "241", name: "Samoa" },
  { value: "201", name: "San Marino" },
  { value: "204", name: "Sao Tome And Principe" },
  { value: "193", name: "Senegal" },
  { value: "254", name: "SERBIA" },
  { value: "191", name: "Serbia and Montenegro" },
  { value: "210", name: "Seychelles" },
  { value: "199", name: "Sierra Leone" },
  { value: "194", name: "Singapore" },
  { value: "206", name: "Slovak Republic" },
  { value: "207", name: "Slovenia" },
  { value: "198", name: "Solomon Islands" },
  { value: "202", name: "Somalia" },
  { value: "244", name: "South Africa" },
  { value: "195", name: "South Georgia and The South Sandwich Islands" },
  { value: "73", name: "Spain" },
  { value: "131", name: "Sri Lanka" },
  { value: "196", name: "ST. Helena" },
  { value: "192", name: "Sudan" },
  { value: "205", name: "Suriname" },
  { value: "197", name: "Svalbard And Jan Mayen Islands" },
  { value: "209", name: "Swaziland" },
  { value: "208", name: "Sweden" },
  { value: "47", name: "Switzerland" },
  { value: "211", name: "Syrian Arab Republic" },
  { value: "225", name: "Taiwan China" },
  { value: "216", name: "Tajikistan" },
  { value: "226", name: "Tanzania, United Republic of" },
  { value: "215", name: "Thailand" },
  { value: "219", name: "Timor-Leste" },
  { value: "214", name: "Togo" },
  { value: "217", name: "Tokelau" },
  { value: "220", name: "Tonga" },
  { value: "221", name: "Trinidad and tobago" },
  { value: "222", name: "Tunisia" },
  { value: "223", name: "Turkey" },
  { value: "218", name: "Turkmenistan" },
  { value: "212", name: "Turks and Caicos Islands" },
  { value: "224", name: "Tuvalu" },
  { value: "227", name: "Uganda" },
  { value: "228", name: "Ukraine" },
  { value: "14", name: "United Arab Emirates" },
  { value: "84", name: "United Kingdom" },
  { value: "231", name: "United States" },
  { value: "229", name: "United States Minor Outlying Islands" },
  { value: "230", name: "Uruguay" },
  { value: "232", name: "Uzbekistan" },
  { value: "239", name: "Vanuatu" },
  { value: "235", name: "Venezuela" },
  { value: "238", name: "Vietnam" },
  { value: "236", name: "Virgin Islands(British)" },
  { value: "237", name: "Virgin Islands(U.S.)" },
  { value: "240", name: "Wallis and Futuna Islands" },
  { value: "242", name: "Yemen" },
  { value: "243", name: "Yugoslavia" },
  { value: "52", name: "Zaire" },
  { value: "245", name: "Zambia" },
  { value: "246", name: "Zimbabwe" },
];

const objNationalities = {
  ETH: {
    name: "Ethiopia",
    arabicName: "إثيوبيــــا",
    code: "ETH",
    telCode: "251",
    code2: "ET",
  },
  ABW: {
    name: "Aruba",
    arabicName: "آروبا",
    code: "ABW",
    telCode: "297",
    code2: "AW",
  },
  ERI: {
    name: "Eritrea",
    arabicName: "أريتيريا",
    code: "ERI",
    isArabic: true,
    telCode: "291",
    code2: "ER",
  },
  ESP: {
    name: "Spain",
    arabicName: "أسبانيا",
    code: "ESP",
    telCode: "34",
    code2: "ES",
  },
  AFG: {
    name: "Afghanistan",
    arabicName: "أفغانستان",
    code: "AFG",
    isMission: true,
    telCode: "93",
    code2: "AF",
  },
  ALB: {
    name: "Albania",
    arabicName: "ألبانيا",
    code: "ALB",
    telCode: "355",
    code2: "AL",
  },
  DEU: {
    name: "Germany",
    arabicName: "ألمانيا",
    code: "DEU",
    telCode: "49",
    code2: "DE",
  },
  AGO: {
    name: "Angola",
    arabicName: "أنجولا",
    code: "AGO",
    telCode: "244",
    code2: "AO",
  },
  AIA: {
    name: "Anguilla",
    arabicName: "أنجويلا",
    code: "AIA",
    telCode: "2641",
    code2: "AI",
  },
  IDN: {
    name: "Indonesia",
    arabicName: "إندونسيا",
    code: "IDN",
    isMission: true,
    telCode: "62",
    code2: "ID",
  },
  URY: {
    name: "Uruguay",
    arabicName: "أورجواى",
    code: "URY",
    telCode: "598",
    code2: "UY",
  },
  UGA: {
    name: "Uganda",
    arabicName: "أوغندا",
    code: "UGA",
    telCode: "256",
    code2: "UG",
  },
  AZE: {
    name: "Azerbaijan",
    arabicName: "اذربيجان",
    code: "AZE",
    telCode: "994",
    code2: "AZ",
  },
  ARM: {
    name: "Armenia",
    arabicName: "ارمينيا",
    code: "ARM",
    telCode: "374",
    code2: "AM",
  },
  AUS: {
    name: "Australia",
    arabicName: "استراليا",
    code: "AUS",
    telCode: "61",
    code2: "AU",
  },
  EST: {
    name: "Estonia",
    arabicName: "استونيا",
    code: "EST",
    telCode: "372",
    code2: "EE",
  },
  UKR: {
    name: "Ukraine",
    arabicName: "اكرانيا",
    code: "UKR",
    telCode: "380",
    code2: "UA",
  },
  ARE: {
    name: "United Arab Emirates",
    arabicName: "الإمارات العربية المتحدة",
    code: "ARE",
    isArabic: true,
    telCode: "971",
    code2: "AE",
  },
  ARG: {
    name: "Argentina",
    arabicName: "الارجنتين",
    code: "ARG",
    telCode: "54",
    code2: "AR",
  },
  JOR: {
    name: "Jordan",
    arabicName: "الاردن",
    code: "JOR",
    isArabic: true,
    isMission: true,
    telCode: "962",
    code2: "JO",
  },
  ECU: {
    name: "Ecuador",
    arabicName: "الاكوادور",
    code: "ECU",
    telCode: "593",
    code2: "EC",
  },
  BHR: {
    name: "Bahrain",
    arabicName: "البحرين",
    code: "BHR",
    isArabic: true,
    telCode: "973",
    code2: "BH",
  },
  BRA: {
    name: "Brazil",
    arabicName: "البرازيل",
    code: "BRA",
    telCode: "55",
    code2: "BR",
  },
  PRT: {
    name: "Portugal",
    arabicName: "البرتغال",
    code: "PRT",
    telCode: "351",
    code2: "PT",
  },
  BIH: {
    name: "Bosnia and Herzegovina",
    arabicName: "البوسنة",
    code: "BIH",
    telCode: "387",
    code2: "BA",
  },
  GAB: {
    name: "Gabon",
    arabicName: "الجابون",
    code: "GAB",
    telCode: "241",
    code2: "GA",
  },
  MNE: {
    name: "MONTENEGRO",
    arabicName: "الجبل الاسود",
    code: "MNE",
    telCode: "382",
    code2: "ME",
  },
  DZA: {
    name: "Algeria",
    arabicName: "الجزائر",
    code: "DZA",
    isArabic: true,
    isMission: true,
    telCode: "213",
    code2: "DZ",
  },
  DMA: {
    name: "Dominican",
    arabicName: "الدمنيكان",
    code: "DMA",
    code2: "DM",
  },
  DNK: {
    name: "Denmark",
    arabicName: "الدنمارك",
    code: "DNK",
    telCode: "45",
    code2: "DK",
  },
  SLV: {
    name: "Salvador",
    arabicName: "السلفادور",
    code: "SLV",
    telCode: "503",
    code2: "SV",
  },
  SEN: {
    name: "Senegal",
    arabicName: "السنغال",
    code: "SEN",
    telCode: "221",
    code2: "SN",
  },
  SDN: {
    name: "Sudan",
    arabicName: "السودان",
    code: "SDN",
    isArabic: true,
    isMission: true,
    telCode: "249",
    code2: "SD",
  },
  SWE: {
    name: "Sweden",
    arabicName: "السويد",
    code: "SWE",
    telCode: "46",
    code2: "SE",
  },
  SOM: {
    name: "Somalia",
    arabicName: "الصومال",
    code: "SOM",
    isArabic: true,
    telCode: "252",
    code2: "SO",
  },
  CHN: {
    name: "China",
    arabicName: "الصين",
    code: "CHN",
    telCode: "86",
    code2: "CN",
  },
  IRQ: {
    name: "Iraq",
    arabicName: "العراق",
    code: "IRQ",
    isArabic: true,
    telCode: "964",
    code2: "IQ",
  },
  VAT: {
    name: "Vatican City",
    arabicName: "الفاتيكان",
    code: "VAT",
    telCode: "1039",
    code2: "VA",
  },
  PHL: {
    name: "Philippines",
    arabicName: "الفلبين",
    code: "PHL",
    telCode: "63",
    code2: "PH",
  },
  CMR: {
    name: "Cameroon",
    arabicName: "الكاميرون",
    code: "CMR",
    telCode: "237",
    code2: "CM",
  },
  COG: {
    name: "Congo COG",
    arabicName: "الكنغو",
    code: "COG",
    telCode: "243",
    code2: "CG",
  },
  KWT: {
    name: "Kuwait",
    arabicName: "الكويت",
    code: "KWT",
    isArabic: true,
    telCode: "965",
    code2: "KW",
  },
  MDV: {
    name: "Maldives",
    arabicName: "المالديف",
    code: "MDV",
    telCode: "960",
    code2: "MV",
  },
  HUN: {
    name: "Hungary",
    arabicName: "المجر",
    code: "HUN",
    telCode: "36",
    code2: "HU",
  },
  MAR: {
    name: "Morocco",
    arabicName: "المغرب",
    code: "MAR",
    isArabic: true,
    isMission: true,
    telCode: "212",
    code2: "MA",
  },
  MEX: {
    name: "Mexico",
    arabicName: "المكسيك\u200f",
    code: "MEX",
    telCode: "52",
    code2: "MX",
  },
  SAU: {
    name: "Kingdom Saudi Arabia",
    arabicName: "المملكة العربية السعودية",
    code: "SAU",
    isArabic: true,
    telCode: "966",
    code2: "SA",
  },
  GBR: {
    name: "United Kingdom",
    arabicName: "المملكة المتحدة",
    code: "GBR",
    telCode: "44",
    code2: "GB",
  },
  NOR: {
    name: "Norway",
    arabicName: "النرويج",
    code: "NOR",
    telCode: "47",
    code2: "NO",
  },
  AUT: {
    name: "Austria",
    arabicName: "النمسا",
    code: "AUT",
    telCode: "43",
    code2: "AT",
  },
  NER: {
    name: "Niger",
    arabicName: "النيجر",
    code: "NER",
    isMission: true,
    telCode: "227",
    code2: "NE",
  },
  IND: {
    name: "India",
    arabicName: "الهند",
    code: "IND",
    isMission: true,
    telCode: "91",
    code2: "IN",
  },
  USA: {
    name: "United States",
    arabicName: "الولايات المتحدة الامريكية",
    code: "USA",
    telCode: "1",
    code2: "US",
  },
  JPN: {
    name: "Japan",
    arabicName: "اليابان",
    code: "JPN",
    telCode: "81",
    code2: "JP",
  },
  YEM: {
    name: "Yemen",
    arabicName: "اليمن",
    code: "YEM",
    isArabic: true,
    isMission: true,
    telCode: "967",
    code2: "YE",
  },
  GRC: {
    name: "Greece",
    arabicName: "اليونان",
    code: "GRC",
    telCode: "30",
    code2: "GR",
  },
  ATG: {
    name: "Antigua and Barbuda",
    arabicName: "انتيجوا و باربودا",
    code: "ATG",
    telCode: "268",
    code2: "AG",
  },
  AND: {
    name: "Andorra",
    arabicName: "اندورا",
    code: "AND",
    telCode: "376",
    code2: "AD",
  },
  UZB: {
    name: "Uzbekistan",
    arabicName: "اوزبكستان",
    code: "UZB",
    telCode: "998",
    code2: "UZ",
  },
  IRN: {
    name: "Iran",
    arabicName: "ايران",
    code: "IRN",
    telCode: "98",
    code2: "IR",
  },
  IRL: {
    name: "Ireland",
    arabicName: "ايرلاندا",
    code: "IRL",
    telCode: "353",
    code2: "IE",
  },
  ISL: {
    name: "Iceland",
    arabicName: "ايسلاندا",
    code: "ISL",
    telCode: "354",
    code2: "IS",
  },
  ITA: {
    name: "Italy",
    arabicName: "ايطاليا",
    code: "ITA",
    telCode: "39",
    code2: "IT",
  },
  PNG: {
    name: "Papua New Guinea",
    arabicName: "بابوا - نيو - جونييا",
    code: "PNG",
    telCode: "675",
    code2: "PG",
  },
  PRY: {
    name: "Paraguay",
    arabicName: "باراجواى",
    code: "PRY",
    telCode: "595",
    code2: "PY",
  },
  BRB: {
    name: "Barbados",
    arabicName: "باربادوس",
    code: "BRB",
    telCode: "1246",
    code2: "BB",
  },
  PAK: {
    name: "Pakistan",
    arabicName: "باكستان",
    code: "PAK",
    isMission: true,
    telCode: "92",
    code2: "PK",
  },
  PLW: {
    name: "Palau",
    arabicName: "بالو",
    code: "PLW",
    telCode: "680",
    code2: "PW",
  },
  BMU: {
    name: "Bermuda",
    arabicName: "برمودا",
    code: "BMU",
    telCode: "441",
    code2: "BM",
  },
  BRN: {
    name: "Brunei",
    arabicName: "بروناى",
    code: "BRN",
    telCode: "673",
    code2: "BN",
  },
  BEL: {
    name: "Belgium",
    arabicName: "بلجيكا",
    code: "BEL",
    telCode: "32",
    code2: "BE",
  },
  BGR: {
    name: "Bulgaria",
    arabicName: "بلغاريا",
    code: "BGR",
    telCode: "359",
    code2: "BG",
  },
  BLZ: {
    name: "Belize",
    arabicName: "بليز",
    code: "BLZ",
    telCode: "501",
    code2: "BZ",
  },
  BGD: {
    name: "Bangladesh",
    arabicName: "بنجلاديش",
    code: "BGD",
    telCode: "880",
    code2: "BD",
  },
  PAN: {
    name: "Panama",
    arabicName: "بنما",
    code: "PAN",
    telCode: "507",
    code2: "PA",
  },
  BEN: {
    name: "Benin",
    arabicName: "بنين",
    code: "BEN",
    telCode: "229",
    code2: "BJ",
  },
  BTN: {
    name: "Bhutan",
    arabicName: "بوتان",
    code: "BTN",
    telCode: "975",
    code2: "BT",
  },
  BWA: {
    name: "Botswana",
    arabicName: "بوتسوانا",
    code: "BWA",
    telCode: "267",
    code2: "BW",
  },
  PRI: {
    name: "Puerto Rico",
    arabicName: "بورتوريكو",
    code: "PRI",
    telCode: "1787",
    code2: "PR",
  },
  BFA: {
    name: "Burkina Faso",
    arabicName: "بوركينا",
    code: "BFA",
    telCode: "226",
    code2: "BF",
  },
  BDI: {
    name: "Burundi",
    arabicName: "بوروندى",
    code: "BDI",
    telCode: "257",
    code2: "BI",
  },
  POL: {
    name: "Poland",
    arabicName: "بولندا",
    code: "POL",
    telCode: "48",
    code2: "PL",
  },
  BOL: {
    name: "Bolivia",
    arabicName: "بوليفيا",
    code: "BOL",
    telCode: "591",
    code2: "BO",
  },
  PYF: {
    name: "French Polynesia",
    arabicName: "بولينيزيا الفرنسية",
    code: "PYF",
    isArabic: false,
    telCode: "689",
    code2: "PF",
  },
  PER: {
    name: "Peru",
    arabicName: "بيرو",
    code: "PER",
    telCode: "51",
    code2: "PE",
  },
  BLR: {
    name: "Belarus",
    arabicName: "بيلاروس",
    code: "BLR",
    telCode: "375",
    code2: "BY",
  },
  THA: {
    name: "Thailand",
    arabicName: "تايلاند",
    code: "THA",
    isMission: true,
    telCode: "66",
    code2: "TH",
  },
  TWN: {
    name: "Taiwan",
    arabicName: "تايوان",
    code: "TWN",
    telCode: "886",
    code2: "TW",
  },
  TKM: {
    name: "Turkmenistan",
    arabicName: "تركمنستان",
    code: "TKM",
    telCode: "993",
    code2: "TM",
  },
  TUR: {
    name: "Turkey",
    arabicName: "تركيا",
    code: "TUR",
    isMission: true,
    telCode: "90",
    code2: "TR",
  },
  TTO: {
    name: "Trinidad and tobago",
    arabicName: "ترينيداد وتوباجو",
    code: "TTO",
    telCode: "868",
    code2: "TT",
  },
  TCD: {
    name: "Chad",
    arabicName: "تشاد",
    code: "TCD",
    telCode: "235",
    code2: "TD",
  },
  CHL: {
    name: "Chile",
    arabicName: "تشيلي",
    code: "CHL",
    telCode: "56",
    code2: "CL",
  },
  TZA: {
    name: "Tanzania",
    arabicName: "تنزانيا",
    code: "TZA",
    telCode: "2551",
    code2: "TZ",
  },
  TGO: {
    name: "Togo",
    arabicName: "توجو",
    code: "TGO",
    telCode: "228",
    code2: "TG",
  },
  TUV: {
    name: "Tuvalu",
    arabicName: "توفالــــــــو",
    code: "TUV",
    telCode: "688",
    code2: "TV",
  },
  TKL: {
    name: "Tokelau",
    arabicName: "توكيلاو",
    code: "TKL",
    telCode: "690",
    code2: "TK",
  },
  TON: {
    name: "Tonga Islands",
    arabicName: "تونجــا",
    code: "TON",
    telCode: "676",
    code2: "TO",
  },
  TUN: {
    name: "Tunisia",
    arabicName: "تونس",
    code: "TUN",
    isArabic: true,
    isMission: true,
    telCode: "216",
    code2: "TN",
  },
  JAM: {
    name: "Jamaica",
    arabicName: "جامايكا",
    code: "JAM",
    telCode: "876",
    code2: "JM",
  },
  GMB: {
    name: "Gambia",
    arabicName: "جامبيا",
    code: "GMB",
    telCode: "220",
    code2: "GM",
  },
  GIB: {
    name: "Gibraltar",
    arabicName: "جبل طــــارق",
    code: "GIB",
    telCode: "350",
    code2: "GI",
  },
  GRL: {
    name: "Green Land",
    arabicName: "جرين لاند",
    code: "GRL",
    telCode: "299",
    code2: "GL",
  },
  GRD: {
    name: "Grenada",
    arabicName: "جرينادا",
    code: "GRD",
    telCode: "473",
    code2: "GD",
  },
  FLK: {
    name: "Islands - Falkland",
    arabicName: "جزر - فوكلاند",
    code: "FLK",
    telCode: "500",
    code2: "FK",
  },
  BHS: {
    name: "Bahamas",
    arabicName: "جزر البهاما",
    code: "BHS",
    telCode: "1242",
    code2: "BS",
  },
  COM: {
    name: "Comoros Islands",
    arabicName: "جزر القمر",
    code: "COM",
    isArabic: true,
    telCode: "2691",
    code2: "KM",
  },
  TCA: {
    name: "Turks and Caicos Islands",
    arabicName: "جزر تركس وكايكوس",
    code: "TCA",
    telCode: "649",
    code2: "TC",
  },
  SLB: {
    name: "Solomon Islands",
    arabicName: "جزر سليمــــان",
    code: "SLB",
    telCode: "677",
    code2: "SB",
  },
  VGB: {
    name: "US Virgin Islands",
    arabicName: "جزر فرجين",
    code: "VGB",
    telCode: "340",
    code2: "VG",
  },
  VIR: {
    name: "British Virgin Islands",
    arabicName: "جزر فيرجينيا",
    code: "VIR",
    telCode: "284",
    code2: "VI",
  },
  CYM: {
    name: "Cayman Islands",
    arabicName: "جزر كايمان",
    code: "CYM",
    telCode: "345",
    code2: "KY",
  },
  COK: {
    name: "Cook Islands",
    arabicName: "جزر كوك",
    code: "COK",
    telCode: "682",
    code2: "CK",
  },
  CCK: {
    name: "Cocos Islands",
    arabicName: "جزر كوكوس",
    code: "CCK",
    telCode: "2061",
    code2: "CC",
  },
  MHN: {
    name: "Marshall Islands",
    arabicName: "جزر مارشال",
    code: "MHN",
    telCode: "692",
  },
  CXR: {
    name: "Christmas Island",
    arabicName: "جزيرة كريسماس",
    code: "CXR",
    telCode: "1061",
    code2: "CX",
  },
  NFK: {
    name: "Norfolk Island",
    arabicName: "جزيرة نورفولك",
    code: "NFK",
    telCode: "6722",
    code2: "NF",
  },
  SSD: {
    name: "South Sudan",
    arabicName: "جمهوربة جنوب السودان",
    code: "SSD",
    isMission: true,
    telCode: "211",
    code2: "SS",
  },
  CZE: {
    name: "Czech Republic",
    arabicName: "جمهورية التشيك",
    code: "CZE",
    telCode: "420",
    code2: "CZ",
  },
  DOM: {
    name: "Dominican Republic",
    arabicName: "جمهورية الدمنيكان",
    code: "DOM",
    telCode: "767",
    code2: "DO",
  },
  SVK: {
    name: "Slovakia",
    arabicName: "جمهورية سلوفاكيا",
    code: "SVK",
    telCode: "421",
    code2: "SK",
  },
  MDA: {
    name: "Moldavia",
    arabicName: "جمهورية مالدوفا",
    code: "MDA",
    telCode: "373",
    code2: "MD",
  },
  CAF: {
    name: "Central African Republic",
    arabicName: "جمهورية وسط أفريقيا",
    code: "CAF",
    telCode: "236",
    code2: "CF",
  },
  ZAF: {
    name: "South Africa",
    arabicName: "جنوب أفريقيا",
    code: "ZAF",
    isMission: true,
    telCode: "27",
    code2: "ZA",
  },
  GTM: {
    name: "Guatemala",
    arabicName: "جواتيمالا",
    code: "GTM",
    telCode: "502",
    code2: "GT",
  },
  GUM: {
    name: "Guam",
    arabicName: "جوام",
    code: "GUM",
    telCode: "671",
    code2: "GU",
  },
  GUF: {
    name: "French Guiana",
    arabicName: "جوانا الفرنسية",
    code: "GUF",
    telCode: "594",
    code2: "GF",
  },
  GEO: {
    name: "Georgia",
    arabicName: "جورجيا",
    code: "GEO",
    telCode: "995",
    code2: "GE",
  },
  GUY: {
    name: "Guyana",
    arabicName: "جويانا",
    code: "GUY",
    telCode: "592",
    code2: "GY",
  },
  DJI: {
    name: "Djibouti",
    arabicName: "جيبوتى",
    code: "DJI",
    isArabic: true,
    telCode: "253",
    code2: "DJ",
  },
  RWA: {
    name: "Rwanda",
    arabicName: "روانــــــــــدا",
    code: "RWA",
    telCode: "250",
    code2: "RW",
  },
  RUS: {
    name: "Russia",
    arabicName: "روسيا الإتحادية",
    code: "RUS",
    telCode: "7002",
    code2: "RU",
  },
  ROU: {
    name: "Romania",
    arabicName: "رومانيا",
    code: "ROU",
    telCode: "40",
    code2: "RO",
  },
  ZMB: {
    name: "Zambia",
    arabicName: "زامبيا",
    code: "ZMB",
    telCode: "260",
    code2: "ZM",
  },
  ZIM: {
    name: "Zimbabwe",
    arabicName: "زيمبابوى",
    code: "ZIM",
    telCode: "263",
  },
  WSM: {
    name: "Western Samoa",
    arabicName: "ساموا",
    code: "WSM",
    telCode: "685",
    code2: "WS",
  },
  ASM: {
    name: "American Samoa",
    arabicName: "ساموا الأمريكية",
    code: "ASM",
    telCode: "684",
    code2: "AS",
  },
  SMR: {
    name: "San Marino",
    arabicName: "سان مارينو",
    code: "SMR",
    telCode: "378",
    code2: "SM",
  },
  LCA: {
    name: "St. Lucia",
    arabicName: "ســانت لوتشــيا",
    code: "LCA",
    telCode: "758",
    code2: "LC",
  },
  LKA: {
    name: "Sri Lanka",
    arabicName: "سريلانكا",
    code: "LKA",
    telCode: "94",
    code2: "LK",
  },
  SVN: {
    name: "Slovenia",
    arabicName: "سلوفينيا",
    code: "SVN",
    telCode: "386",
    code2: "SI",
  },
  SGP: {
    name: "Singapore",
    arabicName: "سنغافورة",
    code: "SGP",
    telCode: "65",
    code2: "SG",
  },
  SWZ: {
    name: "Swaziland",
    arabicName: "سوازيـلانـــــــــد",
    code: "SWZ",
    telCode: "2683",
    code2: "SZ",
  },
  SYR: {
    name: "Syria",
    arabicName: "سوريا",
    code: "SYR",
    isArabic: true,
    isMission: true,
    telCode: "963",
    code2: "SY",
  },
  SUR: {
    name: "Suriname",
    arabicName: "سورينام",
    code: "SUR",
    telCode: "597",
    code2: "SR",
  },
  CHE: {
    name: "Switzerland",
    arabicName: "سويسرا",
    code: "CHE",
    telCode: "41",
    code2: "CH",
  },
  SLE: {
    name: "Sierra Leone",
    arabicName: "سيراليون",
    code: "SLE",
    telCode: "232",
    code2: "SL",
  },
  SYC: {
    name: "Seychelles",
    arabicName: "سيشل",
    code: "SYC",
    telCode: "248",
    code2: "SC",
  },
  TMP: {
    name: "East Timor",
    arabicName: "شرق تيمور",
    code: "TMP",
    telCode: "6701",
  },
  SRB: {
    name: "Serbia",
    arabicName: "صربيا",
    code: "SRB",
    telCode: "381",
    code2: "RS",
  },
  TJK: {
    name: "Tajikistan",
    arabicName: "طاجكستان",
    code: "TJK",
    telCode: "992",
    code2: "TJ",
  },
  GHA: {
    name: "Ghana",
    arabicName: "غانـا",
    code: "GHA",
    telCode: "233",
    code2: "GH",
  },
  GIN: {
    name: "Guinea",
    arabicName: "غينيا",
    code: "GIN",
    code2: "GN",
  },
  GNQ: {
    name: "Equatorial Guinea",
    arabicName: "غينيا الأستوائية",
    code: "GNQ",
    telCode: "240",
    code2: "GQ",
  },
  GNB: {
    name: "Guinea Bissau",
    arabicName: "غينيا بيساو",
    code: "GNB",
    telCode: "245",
    code2: "GW",
  },
  VUT: {
    name: "Vanuatu",
    arabicName: "فانواتو",
    code: "VUT",
    telCode: "678",
    code2: "VU",
  },
  FRA: {
    name: "France",
    arabicName: "فرنسا",
    code: "FRA",
    telCode: "33",
    code2: "FR",
  },
  PSE: {
    name: "Palestine",
    arabicName: "فلسطين",
    code: "PSE",
    isArabic: true,
    isMission: true,
    telCode: "970",
    code2: "PS",
  },
  VEN: {
    name: "Venezuela",
    arabicName: "فنزويلا",
    code: "VEN",
    telCode: "58",
    code2: "VE",
  },
  FIN: {
    name: "Finland",
    arabicName: "فنلاندا",
    code: "FIN",
    telCode: "358",
    code2: "FI",
  },
  FJI: {
    name: "Fiji",
    arabicName: "فيجــــــى",
    code: "FJI",
    telCode: "679",
    code2: "FJ",
  },
  VNM: {
    name: "Vietnam",
    arabicName: "فييتنام",
    code: "VNM",
    telCode: "84",
    code2: "VN",
  },
  CYP: {
    name: "Cyprus",
    arabicName: "قبرص",
    code: "CYP",
    telCode: "357",
    code2: "CY",
  },
  KGZ: {
    name: "Kyrgyzstan",
    arabicName: "قرغيزستان",
    code: "KGZ",
    telCode: "996",
    code2: "KG",
  },
  QAT: {
    name: "Qatar",
    arabicName: "قطر",
    code: "QAT",
    isArabic: true,
    telCode: "974",
    code2: "QA",
  },
  CPV: {
    name: "Cape Verde Islands",
    arabicName: "كاب فيرد",
    code: "CPV",
    telCode: "238",
    code2: "CV",
  },
  KAZ: {
    name: "Kazakhstan",
    arabicName: "كاذاخستان",
    code: "KAZ",
    telCode: "7001",
    code2: "KZ",
  },
  KHM: {
    name: "Cambodia",
    arabicName: "كامبوديا",
    code: "KHM",
    telCode: "855",
    code2: "KH",
  },
  HRV: {
    name: "Croatia",
    arabicName: "كرواتيا",
    code: "HRV",
    telCode: "385",
    code2: "HR",
  },
  CAN: {
    name: "Canada",
    arabicName: "كندا",
    code: "CAN",
    telCode: "1112",
    code2: "CA",
  },
  CUB: {
    name: "Cuba",
    arabicName: "كوبا",
    code: "CUB",
    telCode: "53",
    code2: "CU",
  },
  CIV: {
    name: "Cote Divoire",
    arabicName: "كوت دي فوار",
    code: "CIV",
    isMission: true,
    telCode: "225",
    code2: "CI",
  },
  KOR: {
    name: "South Korea",
    arabicName: "كوريا الجنــوبية",
    code: "KOR",
    telCode: "82",
    code2: "KR",
  },
  PRK: {
    name: "North Korea",
    arabicName: "كوريا الشمالية",
    code: "PRK",
    telCode: "850",
    code2: "KP",
  },
  CRI: {
    name: "Costa Rica",
    arabicName: "كوستاريكا",
    code: "CRI",
    telCode: "506",
    code2: "CR",
  },
  RKS: {
    name: "Kosovo",
    arabicName: "كوسوفا",
    code: "RKS",
    telCode: "550",
  },
  COL: {
    name: "Colombia",
    arabicName: "كولومبيا",
    code: "COL",
    telCode: "57",
    code2: "CO",
  },
  KIR: {
    name: "Kiribati",
    arabicName: "كيريباتيا",
    code: "KIR",
    telCode: "686",
    code2: "KI",
  },
  KEN: {
    name: "Kenya",
    arabicName: "كينيا",
    code: "KEN",
    telCode: "254",
    code2: "KE",
  },
  LVA: {
    name: "Latvia",
    arabicName: "لاتفيا",
    code: "LVA",
    telCode: "371",
    code2: "LV",
  },
  LAO: {
    name: "Laos",
    arabicName: "لاوس",
    code: "LAO",
    telCode: "856",
    code2: "LA",
  },
  LBN: {
    name: "Lebanon",
    arabicName: "لبنان",
    code: "LBN",
    isArabic: true,
    telCode: "961",
    code2: "LB",
  },
  LTU: {
    name: "Lithuania",
    arabicName: "لتوانيا",
    code: "LTU",
    telCode: "370",
    code2: "LT",
  },
  LUX: {
    name: "Luxembourg",
    arabicName: "لوكسمبورج",
    code: "LUX",
    telCode: "352",
    code2: "LU",
  },
  LBY: {
    name: "Libya",
    arabicName: "ليبيا",
    code: "LBY",
    isArabic: true,
    telCode: "218",
    code2: "LY",
  },
  LBR: {
    name: "Liberia",
    arabicName: "ليبيريا",
    code: "LBR",
    isMission: true,
    telCode: "231",
    code2: "LR",
  },
  LSO: {
    name: "Lesotho",
    arabicName: "ليسوتو",
    code: "LSO",
    telCode: "266",
    code2: "LS",
  },
  MAC: {
    name: "Macau",
    arabicName: "ماكاو",
    code: "MAC",
    telCode: "853",
    code2: "MO",
  },
  MKD: {
    name: "Macedonia",
    arabicName: "ماكيدونيا",
    code: "MKD",
    telCode: "389",
    code2: "MK",
  },
  MWI: {
    name: "Malawi",
    arabicName: "مالاوى",
    code: "MWI",
    telCode: "265",
    code2: "MW",
  },
  MLT: {
    name: "Malta",
    arabicName: "مالطا",
    code: "MLT",
    telCode: "356",
    code2: "MT",
  },
  MLI: {
    name: "Mali",
    arabicName: "مالى",
    code: "MLI",
    isMission: true,
    telCode: "223",
    code2: "ML",
  },
  MYS: {
    name: "Malaysia",
    arabicName: "ماليزيا",
    code: "MYS",
    isMission: true,
    telCode: "60",
    code2: "MY",
  },
  MYT: {
    name: "Mayotte",
    arabicName: "مايوت",
    code: "MYT",
    telCode: "2692",
    code2: "YT",
  },
  MDG: {
    name: "Madagascar",
    arabicName: "مدغـشقر",
    code: "MDG",
    telCode: "261",
    code2: "MG",
  },
  EGY: {
    name: "Egypt",
    arabicName: "مصر",
    code: "EGY",
    isArabic: true,
    isMission: true,
    telCode: "20",
    code2: "EG",
  },
  MNG: {
    name: "Mongolia",
    arabicName: "منغوليا",
    code: "MNG",
    telCode: "976",
    code2: "MN",
  },
  MRT: {
    name: "Mauritania",
    arabicName: "موريتانيا",
    code: "MRT",
    isArabic: true,
    isMission: true,
    telCode: "222",
    code2: "MR",
  },
  MUS: {
    name: "Mauritius",
    arabicName: "موريشيوس",
    code: "MUS",
    telCode: "230",
    code2: "MU",
  },
  MOZ: {
    name: "Mozambique",
    arabicName: "موزمبيق",
    code: "MOZ",
    telCode: "258",
    code2: "MZ",
  },
  MCO: {
    name: "Monaco",
    arabicName: "موناكو",
    code: "MCO",
    telCode: "377",
    code2: "MC",
  },
  MSR: {
    name: "Montserrat",
    arabicName: "مونتسرات",
    code: "MSR",
    telCode: "664",
    code2: "MS",
  },
  MMR: {
    name: "Myanmar",
    arabicName: "مينمار",
    code: "MMR",
    telCode: "95",
    code2: "MM",
  },
  NAM: {
    name: "Namibia",
    arabicName: "نامبيا",
    code: "NAM",
    telCode: "2642",
    code2: "NA",
  },
  NRU: {
    name: "Nauru",
    arabicName: "ناورو",
    code: "NRU",
    telCode: "674",
    code2: "NR",
  },
  NPL: {
    name: "Nepal",
    arabicName: "نيبال",
    code: "NPL",
    telCode: "977",
    code2: "NP",
  },
  NGA: {
    name: "Nigeria",
    arabicName: "نيجيريا",
    code: "NGA",
    isMission: true,
    telCode: "234",
    code2: "NG",
  },
  NIC: {
    name: "Nicaragua",
    arabicName: "نيكاراجوا",
    code: "NIC",
    telCode: "505",
    code2: "NI",
  },
  NCL: {
    name: "New Caledonia",
    arabicName: "نيو - كاليدونيا",
    code: "NCL",
    telCode: "687",
    code2: "NC",
  },
  NZL: {
    name: "New Zealand",
    arabicName: "نيوزيلاند",
    code: "NZL",
    telCode: "64",
    code2: "NZ",
  },
  NIU: {
    name: "Niue",
    arabicName: "نيوى جزر",
    code: "NIU",
    telCode: "683",
    code2: "NU",
  },
  HTI: {
    name: "Haiti",
    arabicName: "هايتى",
    code: "HTI",
    telCode: "509",
    code2: "HT",
  },
  HND: {
    name: "Honduras",
    arabicName: "هندوراس",
    code: "HND",
    telCode: "504",
    code2: "HN",
  },
  NLD: {
    name: "Netherlands",
    arabicName: "هولندا",
    code: "NLD",
    telCode: "31",
    code2: "NL",
  },
  SHN: {
    name: "St. Helena",
    arabicName: "هيلينا",
    code: "SHN",
    telCode: "290",
    code2: "SH",
  },
  YUG: {
    name: "Yugoslavia",
    arabicName: "يوغسلافيا",
    code: "YUG",
    telCode: "3812",
  },
  REU: {
    name: "Reunion",
    arabicName: "ريونيون",
    code: "REU",
    telCode: "262",
    code2: "RE",
  },
  ZWE: {
    name: "Zimbabwe ZWE",
    arabicName: "زمبابوي",
    code: "ZWE",
    code2: "ZW",
  },
  GBO: {
    name: "United Kingdom GBO",
    arabicName: "المملكة المتحدة",
    code: "GBO",
  },
  GBD: {
    name: "United Kingdom GBD",
    arabicName: "المملكة المتحدة",
    code: "GBD",
  },
  GBS: {
    name: "United Kingdom GBS",
    arabicName: "المملكة المتحدة",
    code: "GBS",
  },
  GBP: {
    name: "United Kingdom GBP",
    arabicName: "المملكة المتحدة",
    code: "GBP",
    telCode: "44",
  },
  GBN: {
    name: "United Kingdom GBN",
    arabicName: "المملكة المتحدة",
    code: "GBN",
  },
  XXB: {
    name: "Stateless XXB",
    code: "XXB",
  },
  XXX: {
    name: "Stateless XXX",
    code: "XXX",
  },
  XXA: {
    name: "Stateless XXA",
    code: "XXA",
  },
  XXC: {
    name: "Stateless XXC",
    code: "XXC",
  },
  LIE: {
    name: "Liechtenstein",
    arabicName: "ليختنشتاين",
    code: "LIE",
    telCode: "423",
    code2: "LI",
  },
  COD: {
    name: "Congo COD",
    arabicName: "الكنغو",
    code: "COD",
    telCode: "242",
    code2: "CD",
  },
};


const nusukNationalities = [
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


module.exports = { nationalities, hsf_nationalities, objNationalities, nusukNationalities };
