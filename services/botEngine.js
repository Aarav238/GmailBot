import { createGmailClient, createLabelIfNeeded } from "../controllers/gmailApi.js";
import { getEmail, sendReplyEmail } from "../controllers/email.js";
import User from "../models/User.js";

// In-memory set of user IDs disabled mid-cycle
const disabledMidCycle = new Set();
export const markDisabled = (userId) => disabledMidCycle.add(userId.toString());
export const markEnabled  = (userId) => disabledMidCycle.delete(userId.toString());

// Per-user in-memory state
const userState = {};

const getState = (email) => {
  if (!userState[email]) {
    userState[email] = { replied: new Set(), replyCount: 0, errorCount: 0, log: [] };
  }
  return userState[email];
};

export const getReplyCount  = (email) => userState[email]?.replyCount  ?? 0;
export const getErrorCount  = (email) => userState[email]?.errorCount  ?? 0;
export const getSuccessRate = (email) => {
  const s = userState[email];
  if (!s) return 100;
  const total = s.replyCount + s.errorCount;
  return total === 0 ? 100 : Math.round((s.replyCount / total) * 100);
};
export const getActivityLog = (email) => (userState[email]?.log ?? []).slice().reverse();

let nextRunAt = null;
export const getNextRunAt = () => nextRunAt;

const processUser = async (user) => {
  const state = getState(user.email);
  const gmail = createGmailClient(user.refreshToken);

  console.log(`[BotEngine] Processing user: ${user.email}`);

  const res = await gmail.users.messages.list({ userId: "me", q: "is:unread" });
  const messages = res.data.messages;

  if (!messages || messages.length === 0) {
    console.log(`[BotEngine] No unread messages for ${user.email}`);
    return;
  }

  console.log(`[BotEngine] ${messages.length} unread messages for ${user.email}`);

  for (const message of messages) {
    if (disabledMidCycle.has(user._id.toString())) {
      console.log(`[BotEngine] Bot disabled mid-cycle for ${user.email}, stopping`);
      return;
    }

    const email = await getEmail(gmail, message.id);

    const fromHeader    = email.data.payload.headers.find((h) => h.name.toLowerCase() === "from");
    const toHeader      = email.data.payload.headers.find((h) => h.name.toLowerCase() === "to");
    const subjectHeader = email.data.payload.headers.find((h) => h.name.toLowerCase() === "subject");

    const fromEmail = fromHeader    ? fromHeader.value    : "";
    const toEmail   = toHeader      ? toHeader.value      : "";
    const subject   = subjectHeader ? subjectHeader.value : "(no subject)";

    if (state.replied.has(fromEmail)) continue;

    const thread  = await gmail.users.threads.get({ userId: "me", id: message.threadId });
    const replies = thread.data.messages.slice(1);

    if (replies.length === 0) {
      await sendReplyEmail(gmail, toEmail, fromEmail, subject, user.replyMessage);

      const labelId = await createLabelIfNeeded(gmail, "GmailBot");
      await gmail.users.messages.modify({
        userId: "me",
        id: message.id,
        requestBody: { addLabelIds: [labelId] },
      });

      state.replied.add(fromEmail);
      state.replyCount += 1;
      state.log.push({ from: fromEmail, subject, repliedAt: new Date() });
      if (state.log.length > 20) state.log.shift();

      console.log(`[BotEngine] Replied to ${fromEmail} for user ${user.email}`);
    }
  }
};

const getRandomInterval = (min, max) =>
  Math.floor(Math.random() * (max - min + 1) + min) * 1000;

const runCycle = async () => {
  let users;
  try {
    users = await User.find({ botEnabled: true });
  } catch (err) {
    console.error("[BotEngine] Failed to fetch users:", err.message);
    return;
  }

  for (const user of users) {
    disabledMidCycle.delete(user._id.toString());
    try {
      await processUser(user);
      await User.findByIdAndUpdate(user._id, { lastRun: new Date(), lastError: null });
    } catch (err) {
      console.error(`[BotEngine] Error for ${user.email}:`, err.message);
      getState(user.email).errorCount += 1;
      await User.findByIdAndUpdate(user._id, { lastRun: new Date(), lastError: err.message });
    }
  }

  return users;
};

// Module-level timeout handle so triggerImmediateCycle can cancel it
let tickTimeout = null;

const tick = async () => {
  tickTimeout = null;
  nextRunAt = null;
  const users = await runCycle();

  const enabled = (users || []).filter((u) => u.botEnabled);
  const minI = enabled.length ? Math.min(...enabled.map((u) => u.minInterval || 10)) : 10;
  const maxI = enabled.length ? Math.max(...enabled.map((u) => u.maxInterval || 10)) : 10;

  const delay = getRandomInterval(minI, maxI);
  nextRunAt = new Date(Date.now() + delay);
  tickTimeout = setTimeout(tick, delay);
};

// Called when a user toggles the bot ON — cancels the pending wait and
// re-runs the cycle within ~1 s so the user gets near-instant feedback.
export const triggerImmediateCycle = () => {
  if (tickTimeout) {
    clearTimeout(tickTimeout);
    tickTimeout = null;
  }
  nextRunAt = null;
  tickTimeout = setTimeout(tick, 1000);
};

export const startBotEngine = () => {
  console.log("[BotEngine] Starting multi-user polling loop...");
  tick();
};
