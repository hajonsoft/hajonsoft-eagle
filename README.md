# Eagle

We control chrome using eagle. Eagle is built on top of puppeteer and can send data to any website.

# Getting started 

Note: for Apple M1 Chip choose ["open with rosetta"](https://www.courier.com/blog/tips-and-tricks-to-setup-your-apple-m1-for-development) when configuring your terminal in order to succesfully install packages.

Once packages are installed via rosetta, you can use `node .` from a regular terminal without a problem.

You may need to install [chromium via brew](https://linguinecode.com/post/how-to-fix-m1-mac-puppeteer-chromium-arm64-bug).


```
git clone https://github.com/hajonsoft/hajonsoft-eagle.git
cd hajonsoft-eagle
npm i
node . [file=FILENAME[.zip]] [noimage] [WORKFLOWNAME-only] [verbose-url=[url]] [slow]

```

Note: Eagle will use data.json from its root, WORKFLOWNAME values (login, main, create-group, create-mutamer)

# Verbose mode

node . verbose

Enable extraction of DOM elements every few seconds to a log file as they appear

node . verbose-url="https://www.etawaf.com/tawaf43/index.html?locale=en"

Extrct DOM elements for one page only and only one time no intervals

# Puppeteer

Use node and [puppeteer](https://github.com/puppeteer/puppeteer/tree/main#readme) to automate passenger data exchange with 
* Way to Umrah
* Bab Al Umrah
* Gabul Ya Hajj
* Tawaf
* Ehaj
* Visit Saudi
* other local visa systems

M1
https://commondatastorage.googleapis.com/chromium-browser-snapshots/index.html?prefix=Mac/818858/
(it's the Intel build, but runs fine via Rosetta 2 – get chrome-mac.zip)

https://linguinecode.com/post/how-to-fix-m1-mac-puppeteer-chromium-arm64-bug

~/.zshrc
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_EXECUTABLE_PATH=`which chromium`


To start a recorder (not helpful)

```
npx @puppeteer/recorder [url]

npx @puppeteer/recorder https://www.waytoumrah.com/prj_umrah/eng/eng_frmlogin.aspx
npx @puppeteer/recorder https://eumra.com/
npx @puppeteer/recorder https://www.etawaf.com/tawaf43/index.html?locale=en
```

To send a photo

I used this site for testing
https://anonfiles.com/

a better approach to uploading file is https://www.codegrepper.com/code-examples/javascript/upload+file+from+local+puppeteer

Basically 
await input.uploadFile(`${pathFile}/travis_1.png`)
instead of fileChooser below

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
