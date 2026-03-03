# AutoReply.ai — Gmail Auto-Reply Bot

A multi-user web application that automatically sends personalised replies to unread Gmail messages. Users sign in with Google, flip a toggle, and the bot handles first-touch replies on their behalf.

---

## Features

- **Google OAuth2 sign-in** — no passwords stored, secure token-based auth
- **Per-user bot control** — each user independently toggles their bot on/off
- **Instant first run** — toggling ON triggers an inbox scan within ~1 second
- **Custom reply message** — configure your own auto-reply text from the dashboard
- **Adjustable check interval** — set how often the bot scans your inbox (10–300 s min, 10–600 s max)
- **Live dashboard** — real-time countdown, reply count, success rate, activity feed
- **GmailBot label** — auto-replied emails are labelled `GmailBot` in Gmail
- **Duplicate-reply protection** — per-sender in-memory tracking + thread-reply check
- **HTTP-only JWT sessions** — XSS-safe, 7-day cookie lifetime

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Express (ESM) |
| Database | MongoDB + Mongoose |
| Auth | Google OAuth2 + JWT (HTTP-only cookie) |
| Gmail | Google APIs Node.js client (`googleapis`) |
| Frontend | React 18 + Vite + Tailwind CSS |
| Routing | React Router v6 |

---

## Project Structure

```
GmailBot/
├── index.js                  # Entry point: MongoDB connect, routes, bot engine
├── configs/
│   └── configs.js            # Exports env vars (CLIENT_ID, CLIENT_SECRET, …)
├── models/
│   └── User.js               # Mongoose schema (email, refreshToken, settings, …)
├── middleware/
│   └── auth.js               # JWT cookie verification middleware
├── routes/
│   ├── auth.js               # /api/auth/* (google, callback, me, logout)
│   └── bot.js                # /api/bot/* (toggle, status, activity, settings)
├── controllers/
│   ├── gmailApi.js           # createGmailClient(refreshToken), createLabelIfNeeded()
│   └── email.js              # getEmail(), sendReplyEmail()
├── services/
│   └── botEngine.js          # Multi-user polling loop, triggerImmediateCycle()
└── client/                   # Vite + React frontend
    ├── index.html
    ├── vite.config.js        # Proxies /api → http://localhost:8000
    ├── tailwind.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx           # React Router: / → Landing, /dashboard → Dashboard
        └── pages/
            ├── Landing.jsx   # Marketing page with auth-aware navbar
            └── Dashboard.jsx # Bot control, stats, activity feed, settings
```

---

## Prerequisites

1. **Node.js** v18+
2. **MongoDB** running locally or a MongoDB Atlas URI
3. A **Google Cloud project** with the Gmail API enabled and an OAuth 2.0 client configured

### Setting up Google OAuth2

1. Go to [Google Cloud Console](https://console.cloud.google.com) and create (or select) a project.
2. Enable the **Gmail API** for the project.
3. Under **APIs & Services → Credentials**, create an **OAuth 2.0 Client ID** (Web application).
4. Add the following **Authorised redirect URI**:
   ```
   http://localhost:8000/api/auth/google/callback
   ```
5. Copy the **Client ID** and **Client Secret** — you'll need them in `.env`.

---

## Environment Variables

Create a `.env` file in the project root (see `.env.example`):

```env
CLIENT_ID=your_google_client_id
CLIENT_SECRET=your_google_client_secret
REDIRECT_URI=http://localhost:8000/api/auth/google/callback
MONGODB_URI=mongodb://localhost:27017/gmailbot
JWT_SECRET=a_long_random_secret_string
```

> `REFRESH_TOKEN` is **not** needed — it is stored per-user in MongoDB after OAuth sign-in.

---

## Installation

### Backend

```bash
npm install
```

### Frontend

```bash
cd client && npm install
```

---

## Running the App

Open **two terminals**:

```bash
# Terminal 1 — backend (port 8000)
npm run dev

# Terminal 2 — frontend (port 5173)
npm run dev:client
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

---

## API Reference

### Auth — `/api/auth`

| Method | Path | Description |
|---|---|---|
| `GET` | `/google` | Redirect to Google consent screen |
| `GET` | `/google/callback` | OAuth2 callback — issues JWT cookie, redirects to `/dashboard` |
| `GET` | `/me` | Returns current user (`{ email, name, picture }`) or `401` |
| `POST` | `/logout` | Clears the JWT cookie |

### Bot — `/api/bot` *(requires auth)*

| Method | Path | Description |
|---|---|---|
| `POST` | `/toggle` | Toggle bot on/off; triggers immediate cycle when enabling |
| `GET` | `/status` | `{ botEnabled, lastRun, lastError, replyCount, errorCount, successRate, nextRunAt }` |
| `GET` | `/activity` | Last 20 auto-reply events (most recent first) |
| `GET` | `/settings` | `{ replyMessage, minInterval, maxInterval }` |
| `PUT` | `/settings` | Update reply message and/or check interval |

---

## Bot Logic

1. **Polling loop** — a single `tick()` runs `runCycle()`, then schedules the next tick using a random delay within each user's configured `[minInterval, maxInterval]` range.
2. **Immediate trigger** — when a user enables the bot, `triggerImmediateCycle()` cancels the pending wait and fires a new cycle within ~1 second.
3. **Per-user processing** — each enabled user's Gmail inbox is scanned for unread messages.
4. **Reply logic** — for each unread thread, if no reply has been sent yet (checked via the Gmail thread API and an in-memory per-sender Set), the bot sends the user's custom message.
5. **Labelling** — the replied email is labelled `GmailBot` in Gmail (created automatically if absent).
6. **Mid-cycle stop** — toggling the bot OFF is recorded in an in-memory `disabledMidCycle` Set; the engine checks this before processing each email, so it stops without waiting for the current cycle to finish.

---

## Dashboard

The React dashboard provides:

- **Bot toggle** with animated switch and instant status feedback
- **System status card** — active/paused state, last run time, error display, success rate
- **Stat cards** — success rate, replies sent this session, last run, next check countdown
- **Activity feed** — chronological list of auto-replied emails (subject, sender, time)
- **Settings panel**:
  - Custom auto-reply message (textarea, character count)
  - Min/Max check interval with live frontend validation (red borders, inline errors, Save disabled until valid)

---

## User Settings

| Setting | Default | Min | Max |
|---|---|---|---|
| Min interval | 10 s | 10 s | 300 s |
| Max interval | 10 s | 10 s | 600 s |
| Reply message | *"Thank you for your email…"* | — | — |

> **Existing accounts**: if you signed up before the 10 s default was set, go to **Settings → Check Interval** and update your values to take effect.

---

## Security

- **No password storage** — Google OAuth2 only; a `refresh_token` is stored encrypted in MongoDB.
- **Minimal Gmail scopes** — `https://mail.google.com`, `userinfo.profile`, `userinfo.email`.
- **HTTP-only JWT cookie** — not accessible from JavaScript, protecting against XSS.
- **Revoke anytime** — remove access from [Google Account → Third-party apps](https://myaccount.google.com/permissions).

---

## Scripts

| Command | Description |
|---|---|
| `npm start` | Start backend (production) |
| `npm run dev` | Start backend with nodemon (development) |
| `npm run dev:client` | Start Vite dev server for the frontend |
| `cd client && npm run build` | Build frontend for production |
