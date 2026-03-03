import { google } from "googleapis";
import { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } from "../configs/configs.js";

/*
 * Create a per-user Gmail client using the user's stored refresh token.
 * param {string} refreshToken - The user's OAuth refresh token.
 * returns the Gmail client object.
 */
export const createGmailClient = (refreshToken) => {
  const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  oAuth2Client.setCredentials({ refresh_token: refreshToken });
  return google.gmail({ version: "v1", auth: oAuth2Client });
};

/*
 * Create a per-user OAuth2 client (used during auth flow).
 */
export const createOAuth2Client = () => {
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
};

/*
 * Get the Gmail labels for the given gmail client.
 * returns the array of Gmail labels.
 */
export const getGmailLabels = async (gmail) => {
  const res = await gmail.users.labels.list({ userId: "me" });
  return res.data.labels;
};

/*
 * Create a Gmail label if it does not already exist.
 * param {object} gmail - The Gmail client.
 * param {string} labelName - The name of the label to create.
 * returns {string} The ID of the created or existing label.
 */
export const createLabelIfNeeded = async (gmail, labelName) => {
  const labels = await getGmailLabels(gmail);

  const existingLabel = labels.find((label) => label.name === labelName);
  if (existingLabel) {
    return existingLabel.id;
  }

  const newLabel = await gmail.users.labels.create({
    userId: "me",
    requestBody: {
      name: labelName,
      labelListVisibility: "labelShow",
      messageListVisibility: "show",
    },
  });

  return newLabel.data.id;
};
