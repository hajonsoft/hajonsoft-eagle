
const fs = require('fs')
const { createCanvas, loadImage } = require('canvas')
// https://github.com/Automattic/node-canvas
function createPassport() {

 
    const canvas = createCanvas(400, 300)
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = "white";
ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.font = '12px Arial'
    ctx.fillText('P<UZBALIAKHUNOVA<<ROBIYA<<<<<<<<<<<<<<<<<<<<', 25, canvas.height -40)
    ctx.fillText('AA43573271UZB9802023F24021924020298658002462', 25, canvas.height - 20)
    
    
    const out = fs.createWriteStream(__dirname + '/test.jpeg')
    const stream = canvas.createJPEGStream({
        quality: 0.95,
        chromaSubsampling: false
      })
    stream.pipe(out)
    out.on('finish', () =>  console.log('The JPEG file was created.'))

}
createPassport()
module.exports = {ayman: createPassport}



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
// console.log(moment().format('mmssa'))