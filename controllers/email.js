const DEFAULT_MESSAGE = "Thank you for your email. I have received your message and will get back to you as soon as possible.";

export const getEmail = async (gmail, messageId) => {
  return await gmail.users.messages.get({ userId: "me", id: messageId });
};

export const sendReplyEmail = async (gmail, fromEmail, toEmail, subject, customMessage) => {
  await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: createReplyRaw(fromEmail, toEmail, subject, customMessage),
    },
  });
};

export const createReplyRaw = (from, to, subject, customMessage) => {
  const body = customMessage?.trim() || DEFAULT_MESSAGE;
  const emailContent = `From: ${from}\nTo: ${to}\nSubject: Re: ${subject}\n\n${body}`;
  return Buffer.from(emailContent)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
};
