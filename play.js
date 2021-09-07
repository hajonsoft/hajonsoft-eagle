
// const fs = require('fs')
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


const puppeteer = require("puppeteer-extra");

async function main() {
browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: [
      "--start-fullscreen",
      "--incognito",
      "--disable-web-security",
      "--disable-features=IsolateOrigins,site-per-process",
    ],
  });
  const pages = await browser.pages();
  // page = await browser.pages();
  page = pages[0];
  const page2 = await browser.newPage();
  await page2.close();
  await page.bringToFront();

}
main()