const axios = require("axios");
const fs = require("fs");
// const { createCanvas, loadImage } = require('canvas')
// // https://github.com/Automattic/node-canvas
// function createPassport() {

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

const pricesRaw = fs.readFileSync("./prices.json", "utf8");
const prices = JSON.parse(pricesRaw);
const pricesArray = [];
for (const [key, value] of Object.entries(prices)) {
  for (const [serviceKey, serviceValue] of Object.entries(value)) {
    const price = {
      country: key,
      service: serviceKey,
      cost: serviceValue.cost,
      count: serviceValue.count,
    };
    if (price.count > 0) {
      pricesArray.push(price);
    }
  }
}
pricesArray.sort((a, b) => a.cost - b.cost);
console.log(pricesArray);
