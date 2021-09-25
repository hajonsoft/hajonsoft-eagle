# Eagle

We control chrome using eagle. Eagle is built on top of puppeteer and can send data to any website.

# Getting started 

Note: for Apple M1 Chip try this. But it didn't work for me 
https://github.com/puppeteer/puppeteer/issues/6622
https://linguinecode.com/post/how-to-fix-m1-mac-puppeteer-chromium-arm64-bug

```
git clone https://github.com/hajonsoft/hajonsoft-eagle.git
cd hajonsoft-eagle
npm i
node . [file=FILENAME[.zip]] [noimage] [debug] [WORKFLOWNAME-only] [verbose-url=[url]] [slow]

```

Note: Eagle will use data.json from its root, WORKFLOWNAME values (login, main, create-group, create-mutamer)

# Puppeteer

Use node and puppeteer https://github.com/puppeteer/puppeteer/tree/main#readme to automate passenger data exchange with 
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
npx @puppeteer/recorder https://www.etawaf.com/tawaf43/index.html?locale=en
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
