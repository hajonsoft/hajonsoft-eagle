# 🦅 Eagle

We control chrome using eagle. Eagle is built on top of puppeteer and can send data to any website.

# Getting started 

Note: for Apple M1 Chip choose ["open with rosetta"](https://www.courier.com/blog/tips-and-tricks-to-setup-your-apple-m1-for-development) when configuring your terminal in order to successfully install packages.

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

Extract DOM elements for one page only and only one time no intervals

# Puppeteer

Use node and [puppeteer](https://github.com/puppeteer/puppeteer/tree/main#readme) to automate passenger data exchange with third party sites like

* Way to Umrah
* Bab Al Umrah
* Gabul Ya Hajj
* Tawaf
* Ehaj
* Visit Saudi
* other local visa systems

Puppeteer should easily be installed using `npm i puppeteer` check package.json for the version we use. If it is 5.5.0 then this uses chromium version 818858 (go using 997535). If 14.0.0no then r991974

Some machines refuse to install puppeteer and chromium and one way of overcoming this install error is by installing manually from [here](https://commondatastorage.googleapis.com/chromium-browser-snapshots/index.html).

For example on M1 machine you can download [here](https://commondatastorage.googleapis.com/chromium-browser-snapshots/index.html?prefix=Mac/818858/) directly (it's an Intel build, but runs fine via Rosetta 2 on M1 – get chrome-mac.zip). Also notice the revision for chromium in the url. Read this [article](https://linguinecode.com/post/how-to-fix-m1-mac-puppeteer-chromium-arm64-bug) for more info.

```
Open a rosetta terminal => This is just a regular terminal (with use rosetta checked in settings)
brew install chromium
go to Applications, try to open chromium, if you get warning, try to right click open
which chromium
  `will print the path. Mine is /opt/homebrew/bin/chromium`
open your shell config mine is => ~/.zshrc
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_EXECUTABLE_PATH=`which chromium`
```

Make sure which chromium points to the correct path and that you can open it free of warnings, try right click open if you get warnings.


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
      await sharp(photoPath, {
              fit: sharp.fit.inside,
              withoutEnlargement: true,
            }).resize(200, 200).toFile(resizedPhotoPath);

      // 5. Accept the image into the file chooser
      await fileChooser.accept([resizedPhotoPath]);
```

## user message
Since we communicate with advanced eagle users in these messages, we color console.log messages 

`console.log('\x1b[7m', "message","\x1b[0m");`

If you use ansi color your must reset using "\x1b[0m"
Here is the reference for [ansi colors](https://telepathy.freedesktop.org/doc/telepathy-glib/telepathy-glib-debug-ansi.html#TP-ANSI-RESET:CAPS) 

## Budgie

node . budgie
_List all budgie entries_

node . budgie [key:value] [key:value]
node . budgie PlaceOfResidence:"New place of birth"
_Set PlaceOfResidence to new value_

## SMS
We use third party provider for SMS, you must have an api_key to purchase sms tokens. HAJonSoft gladly shares api_key, but feel free to override with your own api_key with, contact us for details. 
https://sms-activate.org/en/getNumber

alialiayman@gmail.com/ Paris until 4

## Vision Api

To use vision api, enable billing in [console.googlcloud.com](https://console.cloud.google.com/), search for Vision api, enable it, create service account in credentials, then download a json in to ./scan/auth/key.json and you are good to image to text with google latest ML 

## Benefits of Eagle

1- Quick atomic send (no looking for photos, vaccine file or residence permit)
2- What if you have to re-enter the same passport? one click with eagle vs all clicks and manual entry all over
3- Reuse the same data to print artifacts
4- capture important data as they appear on screen like mofa number
5- Platform for support. We can't support outside HAJonSoft. We can send thousands of passports quickly.
6- Reduce risk of Ehaj timeout
7- With google vision, You don't need expensive 3M scanner. We read issue date too.

## References
css escape characters. Sometimes an external visa system uses special character in the selector like . or : (\3A)

CSS represents escaped characters in a different way. Escapes start with a backslash followed by the hexadecimal number that represents the character's hexadecimal Unicode code point value.

https://www.w3.org/International/questions/qa-escapes#:~:text=CSS%20represents%20escaped%20characters%20in,that%20is%20all%20you%20need.

