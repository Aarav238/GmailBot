import { Router } from "express";
import authMiddleware from "../middleware/auth.js";
import User from "../models/User.js";
import {
  markDisabled, markEnabled, triggerImmediateCycle,
  getReplyCount, getErrorCount, getSuccessRate,
  getActivityLog, getNextRunAt,
} from "../services/botEngine.js";

const router = Router();

// POST /api/bot/toggle
router.post("/toggle", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.botEnabled = !user.botEnabled;
    await user.save();

    if (user.botEnabled) {
      markEnabled(user._id);
      triggerImmediateCycle(); // restart the cycle within ~1 s
    } else {
      markDisabled(user._id);
    }

    res.json({ botEnabled: user.botEnabled });
  } catch (err) {
    console.error("Toggle error:", err);
    res.status(500).json({ error: "Failed to toggle bot" });
  }
});

// GET /api/bot/status
router.get("/status", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("email botEnabled lastRun lastError");
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      botEnabled:  user.botEnabled,
      lastRun:     user.lastRun,
      lastError:   user.lastError,
      replyCount:  getReplyCount(user.email),
      errorCount:  getErrorCount(user.email),
      successRate: getSuccessRate(user.email),
      nextRunAt:   getNextRunAt(),
    });
  } catch (err) {
    console.error("Status error:", err);
    res.status(500).json({ error: "Failed to get status" });
  }
});

// GET /api/bot/activity
router.get("/activity", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("email");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(getActivityLog(user.email));
  } catch (err) {
    console.error("Activity error:", err);
    res.status(500).json({ error: "Failed to get activity" });
  }
});

// GET /api/bot/settings
router.get("/settings", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("replyMessage minInterval maxInterval");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ replyMessage: user.replyMessage, minInterval: user.minInterval, maxInterval: user.maxInterval });
  } catch (err) {
    console.error("Settings fetch error:", err);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

// PUT /api/bot/settings
router.put("/settings", authMiddleware, async (req, res) => {
  try {
    const { replyMessage, minInterval, maxInterval } = req.body;
    const update = {};

    if (replyMessage !== undefined) {
      update.replyMessage = replyMessage.trim() ||
        "Thank you for your email. I have received your message and will get back to you as soon as possible.";
    }

    const minI = parseInt(minInterval);
    const maxI = parseInt(maxInterval);

    if (!isNaN(minI)) update.minInterval = Math.max(10, Math.min(300, minI));
    if (!isNaN(maxI)) update.maxInterval = Math.max(10, Math.min(600, maxI));

    if (update.minInterval && update.maxInterval && update.minInterval > update.maxInterval) {
      return res.status(400).json({ error: "Min interval must be ≤ max interval" });
    }

    const user = await User.findByIdAndUpdate(req.user.id, update, { new: true })
      .select("replyMessage minInterval maxInterval");

    res.json({ replyMessage: user.replyMessage, minInterval: user.minInterval, maxInterval: user.maxInterval });
  } catch (err) {
    console.error("Settings save error:", err);
    res.status(500).json({ error: "Failed to save settings" });
  }
});

export default router;
