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
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file comptible with GoogleAUth.fromJSON.
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
  for (let i = 0; i < 20; i++) {
    const res = await gmail.users.messages.list({
      userId: "me",
      includeSpamTrash: true,
      q: `from:no_reply@hajj.nusuk.sa is:unread to:${recipient} subject:${subject}`,
    });
    const messages = res.data.messages;
    if (!messages || messages.length === 0) {
      console.log(
        `waiting for OTP from:no_reply@hajj.nusuk.sa is:unread to:${recipient} subject:${subject}`
      );
      // wait 10 seconds and try again
      await new Promise((resolve) => setTimeout(resolve, 10000));
      continue;
    }
    for (const message of messages) {
      const contents = await gmail.users.messages.get({
        userId: "me",
        id: message.id,
      });
      // try {
      //   const modify_request = {
      //     removeLabelIds: ["UNREAD"],
      //   };
      //   await gmail
      //     .users()
      //     .messages()
      //     .modify((userId = "me"), (id = message.id), (body = modify_request))
      //     .execute();
      // } catch (e) {
      //   console.log(e);
      // }
      const messageDate = moment(
        contents.data.payload.headers.find((h) => h.name === "Date").value
      );
      const verificationCode =
        contents.data.snippet.match(/Your OTP is (\d{4})/)?.[1];
      newMessages.push({ code: verificationCode, date: messageDate });
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

module.exports = { getVisitVisaCodeByEmail, getNusukCodeByEmail };
