/**
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/* eslint-disable camelcase */
// [START gmail_quickstart]
const fs = require("fs").promises;
const fsLegacy = require("fs");
const path = require("path");
const process = require("process");
const { authenticate } = require("@google-cloud/local-auth");
const { google } = require("googleapis");
const moment = require("moment");
const inquirer = require("inquirer");

// If modifying these scopes, delete token.json.
const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), "token.json");
const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  if (!fsLegacy.existsSync(TOKEN_PATH)) return;
  try {
    const content = await fsLegacy.readFileSync(TOKEN_PATH);
    //   const content = `{
    //     "type": "authorized_user",
    //     "client_id": "905193277281-1efrj0pqbdc98ipvidvae4qppauv2ctt.apps.googleusercontent.com",
    //     "client_secret": "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",
    //     "refresh_token": "1//06jUijhC2SOSBCgYIARAAGAYSNwF-L9IrCFZXVq3DDoMnnteShAqrBJsRHejyDPapQat3fAWN8Vdf0F_6OVNu9sRw_juup7AW0Rg"
    // }`;

    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file compatible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: "authorized_user",
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function listLabels(auth) {
  const gmail = google.gmail({ version: "v1", auth });
  const res = await gmail.users.labels.list({
    userId: "me",
  });
  const labels = res.data.labels;
  if (!labels || labels.length === 0) {
    console.log("No labels found.");
    return;
  }
  console.log("Labels:");
  labels.forEach((label) => {
    console.log(`- ${label.name}`);
  });
}

// Read email messages from the user's inbox.
async function listMessages(auth, recipient) {
  const newMessages = [];
  const gmail = google.gmail({ version: "v1", auth });
  const res = await gmail.users.messages.list({
    userId: "me",
    q: "from:noreply@visitsaudi.com",
  });
  const messages = res.data.messages;
  if (!messages || messages.length === 0) {
    console.log("No gmail messages found.");
    return;
  }
  for (const message of messages) {
    const contents = await gmail.users.messages.get({
      userId: "me",
      id: message.id,
    });

    const isValid = contents.data.payload.headers.some(
      (header) => header.name === "Delivered-To" && header.value === recipient
    );

    if (isValid) {
      const messageDate = moment(
        contents.data.payload.headers.find((h) => h.name === "Date").value
      );
      if (messageDate.isAfter(moment().subtract(1620, "minutes"))) {
        const verificationCode = contents.data.snippet.match(
          /Verification Code : (\d{5})/
        )[1];
        newMessages.push({ code: verificationCode, date: messageDate });
      }
    }
  }

  return newMessages;
}
async function getVisitVisaCodeByEmail(email) {
  const client = await authorize();
  const messages = await listMessages(client, email);
  messages.sort((a, b) => b.date - a.date);
  const message = messages?.[0];
  return message?.code;
}

// Read email messages from the user's inbox.
async function listNusukMessages(auth, recipient, subject) {
  const newMessages = [];
  const gmail = google.gmail({ version: "v1", auth });
  const query = `in:inbox from:no_reply@hajj.nusuk.sa is:unread to:${recipient} subject:${subject} newer_than:5m`;
  for (let i = 0; i < 50; i++) {
    console.log(`waiting for OTP ${i}/50 ${query}`);
    const listResponse = await gmail.users.messages.list({
      userId: "me",
      includeSpamTrash: false,
      q: query,
    });
    const messages = listResponse.data.messages;
    if (!messages || messages.length === 0) {
      // wait 10 seconds and try again
      await new Promise((resolve) => setTimeout(resolve, 10000));
      continue;
    }
    for (const message of messages) {
      const contents = await gmail.users.messages.get({
        userId: "me",
        id: message.id,
      });
      const messageDate = moment(
        contents.data.payload.headers.find((h) => h.name === "Date").value
      );
      // if messageDate is older than 5 minutes, skip it
      if (messageDate.isBefore(moment().subtract(1, "minutes"))) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }
      const verificationCode =
        contents.data.snippet.match(/Your OTP is (\d{4})/)?.[1];
      // try arabic here
      if (verificationCode) {
        newMessages.push({ code: verificationCode, date: messageDate });
      }
    }
    if (newMessages.length === 0) {
      continue;
    }
    return newMessages;
  }
}
async function getNusukCodeByEmail(email, subject) {
  const client = await authorize();
  const messages = await listNusukMessages(client, email, subject);
  if (!messages || messages.length === 0) {
    return;
  }
  messages.sort((a, b) => b.date - a.date);
  console.log("📢[gmail.js:197]: messages: ", messages);
  const message = messages?.[0];
  return message?.code;
}

const evisaFrom = "no-reply@mofa.gov.sa";
const emailList = [];
async function downloadNusukVisas() {
  const client = await authorize();
  const gmail = google.gmail({ version: "v1", auth: client });
  const res = await gmail.users.messages.list({
    userId: "me",
    q: "from:yazansaleh089@gmail.com",
  });
  const messages = res.data.messages;
  if (!messages || messages.length === 0) {
    console.log("No gmail messages found.");
    return;
  }
  //download the attachments from all messages
  let i = 1;
  for (const message of messages) {
    const contents = await gmail.users.messages.get({
      userId: "me",
      id: message.id,
    });

    const messageSubject = contents.data.payload.headers.find(
      (h) => h.name === "Subject"
    ).value;

    // get the attachment file name
    const attachmentFileName = contents.data.payload.parts[1].filename;
    const recordInfo = {
      seq: i,
      messageId: message.id,
      subject: messageSubject,
      file: attachmentFileName,
    };
    console.log(`${recordInfo.seq}.${recordInfo.file}`);
    emailList.push(recordInfo);
    i++;
  }

  // ask the user using inquirer to specify range for messages to download ex. 2-6
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "range",
      message: `Enter the range of messages to download`,
      default: `1-${emailList.length}`
    },
  ]);
  const range = answers.range.split("-");
  const start = parseInt(range[0]);
  const end = parseInt(range[1]);

  // ask the user for folder name and suggest folder name based on the first attachment file name
  const folderName = await inquirer.prompt([
    {
      type: "input",
      name: "folder",
      message: "Enter the folder name to save attachments in",
      default: `attachments/${emailList[start - 1].file
        .split(".")[0]
        .replace(/ /g, "_")}`,
    },
  ]);

  if (!fsLegacy.existsSync(folderName.folder)) {
    fsLegacy.mkdirSync(folderName.folder, { recursive: true });
  }

  // download the attachments from the specified range
  for (let i = start; i <= end; i++) {
    const message = messages[i - 1];
    const contents = await gmail.users.messages.get({
      userId: "me",
      id: message.id,
    });
    const attachmentId = contents.data.payload.parts[1].body.attachmentId;
    const attachment = await gmail.users.messages.attachments.get({
      userId: "me",
      messageId: message.id,
      id: attachmentId,
    });
    const buffer = Buffer.from(attachment.data.data, "base64");
    try {
      const fullFileName = path.join(
        process.cwd(),
        folderName.folder,
        emailList[i - 1].file
      );
      await fs.writeFile(fullFileName, buffer);
      console.log(`Attachment ${i} saved successfully. ${fullFileName}`);
    } catch (err) {
      console.error(`Error saving attachment ${i}:`, err);
    }
  }
}

downloadNusukVisas();
module.exports = { getVisitVisaCodeByEmail, getNusukCodeByEmail };
