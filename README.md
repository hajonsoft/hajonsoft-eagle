# Eagle

Home for eagle node application

# Getting started 

Note: Apple M1 Chip is not supported.

```
git clone https://github.com/hajonsoft/hajonsoft-eagle.git
cd hajonsoft-eagle
npm i
node . [file=FILENAME[.zip]] [noimage] [debug] [verbose-url=url]

```

Note: Eagle will use data.json from its root

# Puppeteer

This node application uses puppeteer to automate sending traveller data to various visa systems like
* Way to Umrah
* Bab Al Umrah
* Gabul Ya Hajj
* Tawaf
* Ehaj
* Visit Saudi
* other local visa systems


To start a recorder

```
npx @puppeteer/recorder [url]

npx @puppeteer/recorder https://www.waytoumrah.com/prj_umrah/eng/eng_frmlogin.aspx
npx @puppeteer/recorder https://eumra.com/
```

To send a photo

```
      // 1. Create pointer for fileChooser
      let futureFileChooser = page.waitForFileChooser();

      // 2. Browse to select image
        await page.evaluate(() =>
        document
          .querySelector("#ctl00_ContentHolder_ImageUploaderControl")
          .click()
      );
      // 3. Wait for the file chooser
      let fileChooser = await futureFileChooser;

      // 4. Perform anything while file chooser is opened
      const resizedPhotoPath = path.join(
        util.photosFolder,
        `${data.travellers[counter].passportNumber}_200x200.jpg`
      );
      await sharp(photoPath).resize(200, 200).toFile(resizedPhotoPath);

      // 5. Accept the image into the file chooser
      await fileChooser.accept([resizedPhotoPath]);
```
