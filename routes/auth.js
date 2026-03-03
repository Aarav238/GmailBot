import { Router } from "express";
import jwt from "jsonwebtoken";
import { createOAuth2Client } from "../controllers/gmailApi.js";
import User from "../models/User.js";
import { JWT_SECRET, REDIRECT_URI } from "../configs/configs.js";

const router = Router();

const SCOPES = [
  "https://mail.google.com",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",
];

// GET /api/auth/google — redirect to Google consent screen
router.get("/google", (req, res) => {
  const oAuth2Client = createOAuth2Client();
  const url = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });
  res.redirect(url);
});

// GET /api/auth/google/callback — exchange code, upsert user, set JWT cookie
router.get("/google/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: "No code provided" });

  try {
    const oAuth2Client = createOAuth2Client();
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // Fetch user profile
    const { google } = await import("googleapis");
    const oauth2 = google.oauth2({ version: "v2", auth: oAuth2Client });
    const { data: profile } = await oauth2.userinfo.get();

    // Upsert user in MongoDB
    const user = await User.findOneAndUpdate(
      { email: profile.email },
      {
        email: profile.email,
        name: profile.name,
        picture: profile.picture,
        refreshToken: tokens.refresh_token ?? undefined,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // If Google returned a new refresh_token, save it; otherwise keep existing
    if (tokens.refresh_token) {
      user.refreshToken = tokens.refresh_token;
      await user.save();
    }

    // Create JWT session cookie
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    const isProd = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "strict" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect(isProd ? "/" : "http://localhost:5173/dashboard");
  } catch (err) {
    console.error("OAuth callback error:", err);
    res.status(500).json({ error: "Authentication failed" });
  }
});

// GET /api/auth/me — return current user info
router.get("/me", async (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id).select("-refreshToken");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
});

export default router;
