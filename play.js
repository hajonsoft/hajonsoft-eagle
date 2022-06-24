const axios = require("axios");
const fs = require("fs");
const path = require("path");

// const Canvas, { createCanvas, loadImage } = require('canvas')
// // https://github.com/Automattic/node-canvas
// function createPassport() {
//     var Image = Canvas.Image;
//     var imageObj = new Image();
//     imageObj.onload = function(){
//         context.drawImage(imageObj, 10, 10);
//         context.font = "40pt Calibri";
//         context.fillText("My TEXT!", 20, 20);
//     };
// img.src = 'covid.jpg'; // Set source path
//     const canvas = createCanvas(400, 300)
//     const ctx = canvas.getContext('2d')
//     ctx.fillStyle = "white";
// ctx.fillRect(0, 0, canvas.width, canvas.height);
//     ctx.fillStyle = "black";
//     ctx.font = '12px Arial'
//     ctx.fillText('P<UZBALIAKHUNOVA<<ROBIYA<<<<<<<<<<<<<<<<<<<<', 25, canvas.height -40)
//     ctx.fillText('AA43573271UZB9802023F24021924020298658002462', 25, canvas.height - 20)

//     const out = fs.createWriteStream(__dirname + '/test.jpeg')
//     const stream = canvas.createJPEGStream({
//         quality: 0.95,
//         chromaSubsampling: false
//       })
//     stream.pipe(out)
//     out.on('finish', () =>  console.log('The JPEG file was created.'))

// }
// createPassport()
// module.exports = {ayman: createPassport}

//           // fs.writeFileSync(
//           //   pngFile,
//           //   text2png(codeline, {
//           //     font: '30px sans-serif',
//           //     color: "black",
//           //     bgColor: "white",
//           //     lineSpacing: 20,
//           //   })
//           // );

// const moment = require('moment')
// console.log(moment().format('HHmmssSSS'))
// console.log(new Date("2021-01-01").toLocaleDateString())
// console.log(moment("2021-01-01").format('L'))
// console.log(new Date("2021-01-01").toLocaleDateString())
// console.log(moment().add(10,'days').year())

// console.log(
// /login[_-]only/.test('login_sonly')
// )

// const puppeteer = require("puppeteer-extra");

// async function main() {
// browser = await puppeteer.launch({
//     headless: false,
//     defaultViewport: null,
//     args: [
//       "--start-fullscreen",
//       "--incognito",
//       "--disable-web-security",
//       "--disable-features=IsolateOrigins,site-per-process",
//     ],
//   });
//   const pages = await browser.pages();
//   // page = await browser.pages();
//   page = pages[0];
//   const page2 = await browser.newPage();
//   await page2.close();
//   await page.bringToFront();

// }
// main()

// const object1 = {
//   "ayman" : {
//     "-Mp4LNyeBmlGuA459JLB" : {
//       "columns" : [ {
//         "Header" : "Name",
//         "accessor" : "name"
//       }, {
//         "Header" : "Gender",
//         "accessor" : "gender"
//       }, {
//         "Header" : "Passport Number",
//         "accessor" : "passportNumber"
//       }, {
//         "Header" : "Profession",
//         "accessor" : "profession"
//       } ]
//     }
//   }
// }
// const array = [];
//     for (const [key, value] of Object.entries(object1)) {
//       console.log(Object.values(value)[0].columns)

//       array.push({
//         name: key,
//         columns: Object.values(value)[0].columns
//       })
//       //  const valueValue = Object.values(value)[0];
//       //  array.push({ columns: valueValue, name: key });
//     }
//       console.log(array)

// private string GetSMSCode(string requestId)
// {
//     var webClient = new WebClient();
//     var url = MakeSMSString("http://sms-activate.ru/stubs/handler_api.php?api_key=$api_key&action=getStatus&id=$id".Replace("$id", requestId));
//     for (int i = 0; i < 60; i++)
//     {
//         Thread.Sleep(1000);
//         var number = webClient.DownloadString(url);

//         if (Regex.IsMatch(number, @"(\d{6})"))
//         {
//             number = Regex.Match(number, @"\d{6}").ToString();
//             url = "http://sms-activate.ru/stubs/handler_api.php?api_key=$api_key&action=setStatus&status=$status&id=$id&forward=$forward";
//             url = url.Replace("$id", telephoneRequestId).Replace("$status", "6");
//             url = MakeSMSString(url);
//             var result = webClient.DownloadString(url);

//             return number;
//         }
//     }

//     //"STATUS_OK:confirmation Code 137961"

//     return string.Empty;
// }

// private string GetSMSNumber(string service)
// {
//     // Connect using API key
//     var webClient = new WebClient();
//     var url = MakeSMSString("http://sms-activate.ru/stubs/handler_api.php?api_key=$api_key&action=getNumber&service=$service&forward=$forward&operator=$operator&ref=$ref&country=$country");
//     var requestResult = webClient.DownloadString(url);

//     var pattern = @".*?:(.*?):(\d+)";
//     var number = Regex.Match(requestResult, pattern).Groups[2].ToString();
//     if (string.IsNullOrEmpty(number)) return string.Empty;
//     telephoneRequestId = Regex.Match(requestResult, pattern).Groups[1].ToString();
//     // ACCESS_NUMBER:158008768:79262397137
//     // Order number in russia

//     // click SMS Sent

//     url = "http://sms-activate.ru/stubs/handler_api.php?api_key=$api_key&action=setStatus&status=$status&id=$id&forward=$forward";
//     url = url.Replace("$id", telephoneRequestId).Replace("$status", "1");
//     url = MakeSMSString(url, service);
//     var result = webClient.DownloadString(url);

//     return number.Substring(1);
// }

// const pricesRaw = fs.readFileSync("./prices.json", "utf8");
// const prices = JSON.parse(pricesRaw);
// const pricesArray = [];
// for (const [key, value] of Object.entries(prices)) {
//   for (const [serviceKey, serviceValue] of Object.entries(value)) {
//     const price = {
//       country: key,
//       service: serviceKey,
//       cost: serviceValue.cost,
//       count: serviceValue.count,
//     };
//     if (price.count > 0) {
//       pricesArray.push(price);
//     }
//   }
// }
// pricesArray.sort((a, b) => a.cost - b.cost);
// console.log(pricesArray);

// const totp = require("totp-generator");

// // Keys provided must be base32 strings, ie. only containing characters matching (A-Z, 2-7, =).
// const token = totp("DPJ5CZPPY2IC7BFV");

// console.log(token); // prints a 6-digit time-based token based on provided key and current time

// const cleaned = "SODENMANE OUSSEINI\nConissaire de Police\nPasseport Passport\nRépublique du Niger\n01. Type / Type 02. Code du pays / Country Code 03 N° du Passeport / Passport Nc\n....\nOrdinaire\n04. Nom / Suname\n10PC37000\n06. Date de naissance / Date of Birth.\nNER\nALMOU CHEFOU\n12.07.1984\n05 Prénoms / Given names\n07 Sexe / Sex\nADAMOU\nM\n08 Lieu de naissance / Place of Birth\n09. Nationalité / Nationality\nNIAMEY\n10. N de contróle / Control No\nNigérienne\n11 Adresse / Address\nAKOKAN VILLA NO 104\nEN782VN\nCEL 90 39 17 51\n15 Autorité / Authority\nD.G.P.N/D.ST\nCre Principal de Police\nAbdourahmane Alfa\n12 Date de délivrance / Date of issue\n16.08.2017\n13 Date d'expiration / Date of Expiry\n15.08.2022\n14 Signature du titulaire / Holder's signature\nPONERALMOU<CHEFOU<<ADAMOU<<<<<<<<<<<<<<<<<<<\n10PC370002NER8407122M2208154EN782VN<<<<<<<82\n非00LC340\n1000\nFait à / Performed a\naua / ne,nbsn\nProrogation de validité / Ertenston of ealidit\nne,nbsnf ajqeje\n".replace(/[^A-Z0-9<]/g, "")
// const mrzRegEx = new RegExp("\\nP[A-Z<][A-Z<]{42}\\n?[A-Z0-9<]{44}", "gm");
// const matches = cleaned.matchAll(mrzRegEx);
// for(const match of matches) {
//     console.log(match)
// }

// let mrz1;
// let mrz2;

// let workSet = [];
// const files = fs.readdirSync("scan/input/done");
// for (const file of files) {
//   if (!file.endsWith(".json")) {
//     continue;
//   }
//   const ff = fs.readFileSync(__dirname + "/scan/input/done/" + file, "utf8");
//   const json = JSON.parse(ff);
//   const annotations = json[0].textAnnotations;
//   for (const ano of annotations) {
//     if (
//       ano.description.length > 90 ||
//       ano.description.length < 44 ||
//       /[^A-Z0-9<]/.test(ano.description)
//     ) {
//       continue;
//     }
//     workSet.push({
//       text: ano.description,
//       len: ano.description.length,
//       y: ano.boundingPoly.vertices
//         .map((v) => v.y)
//         .reduce((acc, v) => (acc += v)),
//     });
//   }
//   const sorted = workSet.sort((a, b) => b.y - a.y);
//   //   console.log(sorted);
//   if (sorted.length <= 1) {
//     workSet = [];
//     continue;
//   }

//   console.log('%cMyProject%cline:222%csorted', 'color:#fff;background:#ee6f57;padding:3px;border-radius:2px', 'color:#fff;background:#1f3c88;padding:3px;border-radius:2px', 'color:#fff;background:rgb(3, 38, 58);padding:3px;border-radius:2px', sorted)
//   mrz2 = sorted[0].text;
//   mrz1 = sorted[1].text;
//   console.log(mrz1, mrz2);
//   workSet = [];
// }
// const files = fs.readdirSync("scan/input/done");
// for (const file of files.filter((f) => f.endsWith("XXX-1652112365402.json"))) {
//   console.log('%cMyProject%cline:229%cfile', 'color:#fff;background:#ee6f57;padding:3px;border-radius:2px', 'color:#fff;background:#1f3c88;padding:3px;border-radius:2px', 'color:#fff;background:rgb(89, 61, 67);padding:3px;border-radius:2px', file)
//   const rawData = fs.readFileSync("./scan/input/done/" + file, "utf-8");
//   const json = JSON.parse(rawData);
//   console.log('%cMyProject%cline:232%cjson', 'color:#fff;background:#ee6f57;padding:3px;border-radius:2px', 'color:#fff;background:#1f3c88;padding:3px;border-radius:2px', 'color:#fff;background:rgb(95, 92, 51);padding:3px;border-radius:2px', json)
//   const result = getSplitMrz(json[0]);
//   console.log('%cMyProject%cline:232%cresult', 'color:#fff;background:#ee6f57;padding:3px;border-radius:2px', 'color:#fff;background:#1f3c88;padding:3px;border-radius:2px', 'color:#fff;background:rgb(153, 80, 84);padding:3px;border-radius:2px', result)
// }

// function getSplitMrz(json) {
//   let labelsWithPosition = [];
//   json.textAnnotations.forEach((text) => {
//     const bottomLeft = text.boundingPoly.vertices[0];
//     const topLeft = text.boundingPoly.vertices[1];
//     const topRight = text.boundingPoly.vertices[2];
//     const midPointX = (topRight.x - topLeft.x) / 2 + topLeft.x;
//     const midPointY = (bottomLeft.y - topLeft.y) / 2 + topLeft.y;
//     labelsWithPosition.push({
//       text: text.description,
//       point: {
//         x: midPointX,
//         y: midPointY,
//       },
//       length: text.description.length,
//     });
//   });

//   const sortedLabels = labelsWithPosition.sort((a, b) => {
//     if (a.point.y < b.point.y && a.point.x < b.point.x) {
//       return 1;
//     } else {
//       return -1;
//     }
//   });

//   // Sort and take lines only until you get to P<
//   const mrzLines = [];
//   let line = "";
//   for (const label of sortedLabels) {
//     if (/^P[A-Z<]{1}[A-Z]{3}.*<.*/.test(label.text)) {
//       line = label.text.replace(/[^A-Z0-9<]/, "") + line;
//       mrzLines.push(line.padEnd(44, "<"));
//       break;
//     }
//     if (line.length + label.text.length <= 44) {
//       line = label.text.replace(/[^A-Z0-9<]/, "") + line;
//     } else {
//       mrzLines.push(line);
//       line = label.text.replace(/[^A-Z0-9<]/, "");
//     }
//   }
//   const oneLine = mrzLines.join("");
//   const output = oneLine.substring(0, 44) + "\n" + oneLine.substring(44);
//   return output;
// }

// console.log("abc".replace(/[^A-Z]/g, ""))

const folder = "sante_3m"
const files = fs.readdirSync(path.join(__dirname, "../../..", 'Downloads/senegal/' + folder)).filter(f => f.endsWith("CODELINE.txt"));
for (const file of files) {
    const passportNumber = fs.readFileSync(path.join(__dirname, "../../..", 'Downloads/senegal/' + folder, file), 'utf-8').split('\n')[1].substring(0,9)
    const goodPhoto = path.join(__dirname, "../../..", 'Downloads/senegal/photos', passportNumber + ".jpg");
    if (fs.existsSync(goodPhoto)) {
        fs.copyFileSync(goodPhoto, path.join(__dirname, "../../..", 'Downloads/senegal/' + folder, file.replace(/CODELINE.txt/, 'IMAGEPHOTO.jpg')))
    }
}