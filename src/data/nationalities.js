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

module.exports = { nationalities, hsf_nationalities, objNationalities };
