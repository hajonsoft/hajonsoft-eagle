const pdfLib = require("pdf-lib");
const fs = require("fs");

const mergeAndSavePDF = async (buffers) => {
  const mergedPdf = await pdfLib.PDFDocument.create();

  for (const pdfBuffer of buffers) {
    // Load a PDFDocument from each buffer
    const pdf = await pdfLib.PDFDocument.load(pdfBuffer);

    // Copy all pages from the loaded PDFDocument to the new one
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => {
      mergedPdf.addPage(page);
    });
  }

  const mergedPdfBytes = await mergedPdf.save();

  fs.writeFileSync("./result.pdf", mergedPdfBytes);
};

const createPDF = async (name, country, passportNumber) => {
  try {
    const templatePdfBytes = fs.readFileSync("../assets/insurance.pdf");
    // Use PDFDocument.load to load the PDF from bytes
    const pdfDoc = await pdfLib.PDFDocument.load(templatePdfBytes);

    const helveticaFont = await pdfDoc.embedFont(
      pdfLib.StandardFonts.Helvetica
    );

    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    const { height } = firstPage.getSize();

    firstPage.drawText(name, {
      x: 100,
      y: height - 155,
      size: 10,
      font: helveticaFont,
    });

    firstPage.drawText(country, {
      x: 100,
      y: height - 175,
      size: 10,
      font: helveticaFont,
    });

    firstPage.drawText(passportNumber, {
      x: 280,
      y: height - 175,
      size: 10,
      font: helveticaFont,
    });

    const pdfBytes = await pdfDoc.save();

    const buffer = Buffer.from(pdfBytes.buffer);

    return buffer;
  } catch (error) {
    console.error("Error processing PDF:", error);
  }
};

const createInsurance = async (userDetails) => {
  try {
    const pdfCreationPromises = userDetails.map((user) =>
      createPDF(user.name, user.country, user.passportNumber)
    );

    const pdfBuffers = await Promise.all(pdfCreationPromises);

    await mergeAndSavePDF(pdfBuffers);
    console.log("All PDFs merged successfully!");
  } catch (error) {
    console.error("An error occurred while creating PDFs:", error);
  }
};

createInsurance([
  { name: "Ayman", country: "Wonderland", passportNumber: "123456789", arabicName: "أيمن", arabicNationality: "مصري", policyNumber: "123456789" },
  { name: "Babatunde", country: "Builderland", passportNumber: "987654321" , arabicName: "أيمن", arabicNationality: "مصري", policyNumber: "123456789"},
  { name: "Noorah", country: "Builderland", passportNumber: "987654321" , arabicName: "أيمن", arabicNationality: "مصري", policyNumber: "123456789"},
  { name: "Hesham", country: "Builderland", passportNumber: "987654321" , arabicName: "أيمن", arabicNationality: "مصري", policyNumber: "123456789"},
  { name: "Abdullah", country: "Builderland", passportNumber: "987654321" , arabicName: "أيمن", arabicNationality: "مصري", policyNumber: "123456789"},
  { name: "Lateef", country: "Builderland", passportNumber: "987654321" , arabicName: "أيمن", arabicNationality: "مصري", policyNumber: "123456789"},
  { name: "Umrah", country: "Builderland", passportNumber: "987654321" , arabicName: "أيمن", arabicNationality: "مصري", policyNumber: "123456789"},
  { name: "Hajj", country: "Builderland", passportNumber: "987654321" , arabicName: "أيمن", arabicNationality: "مصري", policyNumber: "123456789"},
  { name: "Bab Umrah", country: "Builderland", passportNumber: "987654321" , arabicName: "أيمن", arabicNationality: "مصري", policyNumber: "123456789"},
  { name: "Happiness", country: "Builderland", passportNumber: "987654321" , arabicName: "أيمن", arabicNationality: "مصري", policyNumber: "123456789"},
]);

module.exports = {
    createInsurance
    };
