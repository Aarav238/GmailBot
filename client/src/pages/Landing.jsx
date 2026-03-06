const GoogleIcon = () => (
  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const features = [
  {
    icon: "magic_button",
    title: "Easy Setup",
    desc: "Connect your Gmail account in seconds and start automating your workflow immediately. No complex configuration required.",
  },
  {
    icon: "group_add",
    title: "Multi-Account Support",
    desc: "Manage multiple professional and personal email addresses from a single, centralized dashboard.",
  },
  {
    icon: "shield",
    title: "Secure & Private",
    desc: "We use industry-standard OAuth2 and never store your password. Your data remains private and protected.",
  },
];

const steps = [
  {
    number: "01",
    icon: "login",
    title: "Sign in with Google",
    desc: "Click the 'Sign in with Google' button and choose the Gmail account you want the bot to manage. No password is stored — we use Google's secure OAuth2 flow.",
  },
  {
    number: "02",
    icon: "verified_user",
    title: "Grant Gmail Access",
    desc: "Google will ask you to allow access to your Gmail. The bot only needs permission to read unread emails and send replies on your behalf. You can revoke access anytime.",
  },
  {
    number: "03",
    icon: "toggle_on",
    title: "Enable the Bot",
    desc: "Once signed in, you'll land on your dashboard. Flip the bot toggle to 'Active'. The bot will start watching your inbox immediately.",
  },
  {
    number: "04",
    icon: "mark_email_read",
    title: "Auto-Replies Go Out",
    desc: "Every 45–120 seconds the bot scans your unread emails. For any thread with no prior reply, it sends a polite acknowledgement on your behalf and labels it 'GmailBot'.",
  },
];

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const initial = (s = "") => s.trim()[0]?.toUpperCase() ?? "?";

export default function Landing() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Check login state — stay on landing page, just adapt the UI
  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => { if (r.ok) return r.json(); })
      .then((data) => { if (data) setUser(data); })
      .catch(() => {});
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col bg-background-light text-slate-900 antialiased">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-10">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#137fec] text-white">
              <span className="material-symbols-outlined text-2xl">mail</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight">AutoReply.ai</h1>
          </a>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-8">
            {[
              { label: "Features",     href: "#features"  },
              { label: "How it Works", href: "#guide"     },
              { label: "Security",     href: "#security"  },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="text-sm font-medium text-slate-600 hover:text-[#137fec] transition-colors"
              >
                {label}
              </a>
            ))}
          </nav>

          {/* Auth area */}
          {user ? (
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
            >
              {user.picture
                ? <img src={user.picture} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
                : <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: "#137fec" }}>{initial(user.name)}</div>
              }
              <span className="max-w-[120px] truncate">{user.name}</span>
              <span className="material-symbols-outlined text-base text-slate-400">arrow_forward</span>
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <a
                href="/api/auth/google"
                className="text-sm font-bold text-slate-700 hover:text-[#137fec] transition-colors"
              >
                Login
              </a>
              <a
                href="/api/auth/google"
                className="inline-flex items-center rounded-lg px-5 py-2 text-sm font-bold text-white shadow-sm transition-all hover:opacity-90"
                style={{ backgroundColor: "#137fec" }}
              >
                Sign Up
              </a>
            </div>
          )}
        </div>
      </header>

      <main className="flex-grow">

        {/* ── Hero ── */}
        <section className="mx-auto max-w-7xl px-6 py-10 lg:px-10 lg:py-24">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">

            {/* Left copy */}
            <div className="flex flex-col gap-8">
              <div className="space-y-4">
                <span className="inline-flex items-center rounded-full bg-[#137fec]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#137fec]">
                  Google OAuth · Zero password storage
                </span>
                <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                  Automate your Gmail replies{" "}
                  <span className="text-[#137fec]">effortlessly.</span>
                </h1>
                <p className="max-w-xl text-lg text-slate-600">
                  Stay responsive 24/7 without lifting a finger. Connect your Gmail, flip a switch, and let the bot handle first-touch replies automatically.
                </p>
              </div>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                {user ? (
                  <button
                    onClick={() => navigate("/dashboard")}
                    className="flex items-center justify-center gap-3 rounded-xl px-6 py-4 text-base font-bold text-white shadow-sm transition-all hover:opacity-90"
                    style={{ backgroundColor: "#137fec" }}
                  >
                    <span className="material-symbols-outlined text-xl">dashboard</span>
                    Go to Dashboard
                  </button>
                ) : (
                  <a
                    href="/api/auth/google"
                    className="flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-6 py-4 text-base font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
                  >
                    <GoogleIcon />
                    Sign in with Google
                  </a>
                )}
                <a
                  href="#guide"
                  className="flex items-center justify-center gap-2 rounded-xl border border-[#137fec]/30 bg-[#137fec]/5 px-6 py-4 text-base font-bold text-[#137fec] hover:bg-[#137fec]/10 transition-all"
                >
                  <span className="material-symbols-outlined text-xl">menu_book</span>
                  How it Works
                </a>
              </div>
            </div>

            {/* Right — mock dashboard preview */}
            <div className="relative lg:ml-10 hidden sm:block">
              <div className="absolute -inset-4 rounded-3xl bg-[#137fec]/5 blur-2xl" />
              <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                {/* Fake browser chrome */}
                <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/50 px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-400" />
                    <div className="h-3 w-3 rounded-full bg-amber-400" />
                    <div className="h-3 w-3 rounded-full bg-emerald-400" />
                  </div>
                  <div className="mx-auto text-xs font-medium text-slate-400">Inbox Automation Dashboard</div>
                </div>
                {/* Mock content */}
                <div className="p-6 space-y-4 bg-background-light">
                  <div className="flex gap-3">
                    <div className="flex-1 rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
                      <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Replies Sent</p>
                      <p className="text-3xl font-extrabold text-[#137fec]">24</p>
                    </div>
                    <div className="flex-1 rounded-xl p-4 shadow-sm text-white" style={{ backgroundColor: "#137fec" }}>
                      <p className="text-xs text-white/70 uppercase tracking-wide mb-1">Bot Status</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                        <p className="text-white font-bold">Active</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm space-y-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Recent Replies</p>
                    {[
                      { sub: "Project Update Request", time: "Just now" },
                      { sub: "Pricing Question", time: "12m ago" },
                      { sub: "Meeting Schedule", time: "34m ago" },
                    ].map((row, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#137fec]/10 text-[#137fec] flex items-center justify-center">
                            <span className="material-symbols-outlined text-sm">reply</span>
                          </div>
                          <p className="text-xs font-semibold text-slate-700">{row.sub}</p>
                        </div>
                        <span className="text-[10px] text-slate-400">{row.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="bg-white py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Streamline your communication
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
                Powerful features designed to help you manage your inbox without lifting a finger.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="group flex flex-col gap-6 rounded-2xl border border-slate-100 bg-white p-8 shadow-sm transition-all hover:border-[#137fec]/40 hover:shadow-lg"
                >
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#137fec]/10 text-[#137fec] group-hover:text-white transition-colors" style={{ '--tw-group-hover-bg': '#137fec' }}>
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#137fec]/10 text-[#137fec] group-hover:bg-[#137fec] group-hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-2xl">{f.icon}</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{f.title}</h3>
                    <p className="mt-2 text-slate-600">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it Works / Guide ── */}
        <section id="guide" className="bg-background-light py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="mb-16 text-center">
              <span className="inline-flex items-center rounded-full bg-[#137fec]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#137fec] mb-4">
                Getting Started
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Up and running in 4 steps
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
                No configuration files, no API keys to manage. Just sign in and go.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {steps.map((step, i) => (
                <div
                  key={step.number}
                  className="relative flex gap-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
                >
                  {/* Step number */}
                  <div className="shrink-0">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-white font-extrabold text-lg" style={{ backgroundColor: "#137fec" }}>
                      {step.number}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#137fec]">{step.icon}</span>
                      <h3 className="text-lg font-bold text-slate-900">{step.title}</h3>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed">{step.desc}</p>
                  </div>

                  {/* Connector line for first 2 on desktop */}
                  {i < steps.length - 1 && (
                    <div className="hidden md:block absolute -bottom-4 left-1/2 w-px h-8 bg-slate-200" />
                  )}
                </div>
              ))}
            </div>

            {/* Bottom CTA */}
            <div className="mt-16 text-center">
              <p className="text-slate-500 mb-6">{user ? "You're all set — head to your dashboard." : "Ready? It takes less than 30 seconds to set up."}</p>
              {user ? (
                <button
                  onClick={() => navigate("/dashboard")}
                  className="inline-flex items-center gap-3 rounded-xl px-8 py-4 text-base font-bold text-white shadow-sm hover:opacity-90 transition-all"
                  style={{ backgroundColor: "#137fec" }}
                >
                  <span className="material-symbols-outlined text-xl">dashboard</span>
                  Open Dashboard
                </button>
              ) : (
                <a
                  href="/api/auth/google"
                  className="inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-8 py-4 text-base font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
                >
                  <GoogleIcon />
                  Get started — it's free
                </a>
              )}
            </div>
          </div>
        </section>

        {/* ── Security ── */}
        <section id="security" className="bg-white py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="mb-16 text-center">
              <span className="inline-flex items-center rounded-full bg-[#137fec]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#137fec] mb-4">
                Security
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Built with your privacy in mind
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
                We never ask for your password and follow Google's official security guidelines throughout.
              </p>
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">

              {/* Left — key points */}
              <div className="flex flex-col gap-5">
                {[
                  {
                    icon: "lock",
                    title: "OAuth2 — No Password Stored",
                    desc: "Sign-in is handled entirely by Google. We receive a secure token, never your password. The token is encrypted and stored per-user in our database.",
                  },
                  {
                    icon: "visibility_off",
                    title: "Minimal Scope Access",
                    desc: "We only request the Gmail scope needed to read unread emails and send replies. We cannot access drafts, contacts, or any other Google service.",
                  },
                  {
                    icon: "cookie",
                    title: "HTTP-Only JWT Sessions",
                    desc: "Your session is stored in a secure, HTTP-only cookie that JavaScript cannot read, protecting you from XSS attacks.",
                  },
                  {
                    icon: "manage_accounts",
                    title: "Revoke Access Anytime",
                    desc: "You can immediately revoke the bot's access from your Google Account settings under 'Third-party apps with account access'. Your data is removed on request.",
                  },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4 rounded-2xl border border-slate-100 bg-background-light p-6">
                    <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ backgroundColor: "#137fec" }}>
                      <span className="material-symbols-outlined text-xl">{item.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{item.title}</h3>
                      <p className="mt-1 text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right — summary card */}
              <div className="flex flex-col gap-5">
                <div className="rounded-2xl border border-slate-200 bg-slate-900 p-8 text-white flex flex-col gap-6 h-full">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-3xl" style={{ color: "#137fec" }}>security</span>
                    <h3 className="text-xl font-bold">What we access</h3>
                  </div>
                  <ul className="flex flex-col gap-4">
                    {[
                      { icon: "check_circle", text: "Read unread email messages", allowed: true },
                      { icon: "check_circle", text: "Send reply emails on your behalf", allowed: true },
                      { icon: "check_circle", text: "Create a 'GmailBot' label", allowed: true },
                      { icon: "cancel",       text: "Read or modify your contacts", allowed: false },
                      { icon: "cancel",       text: "Access Google Drive or Calendar", allowed: false },
                      { icon: "cancel",       text: "Store or share your email content", allowed: false },
                    ].map((row) => (
                      <li key={row.text} className="flex items-center gap-3 text-sm">
                        <span className={`material-symbols-outlined text-xl shrink-0 ${row.allowed ? "text-emerald-400" : "text-red-400"}`}>
                          {row.icon}
                        </span>
                        <span className={row.allowed ? "text-slate-200" : "text-slate-500 line-through"}>
                          {row.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-slate-500 mt-auto pt-4 border-t border-slate-700">
                    Powered by Google OAuth2. Compliant with Google's API Services User Data Policy.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 px-8 py-16 text-center shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-[#137fec]/20 to-transparent" />
            <div className="relative z-10 flex flex-col items-center gap-6">
              <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                Ready to reclaim your time?
              </h2>
              <p className="max-w-xl text-lg text-slate-300">
                Sign in with Google and have your auto-reply bot running in under a minute.
              </p>
              <div className="mt-4 flex flex-col sm:flex-row gap-4">
                {user ? (
                  <button
                    onClick={() => navigate("/dashboard")}
                    className="inline-flex items-center justify-center gap-3 rounded-xl px-10 py-4 text-lg font-bold text-white shadow-xl transition-all hover:opacity-90"
                    style={{ backgroundColor: "#137fec" }}
                  >
                    <span className="material-symbols-outlined text-xl">dashboard</span>
                    Go to Dashboard
                  </button>
                ) : (
                  <a
                    href="/api/auth/google"
                    className="inline-flex items-center justify-center gap-3 rounded-xl px-10 py-4 text-lg font-bold text-white shadow-xl transition-all hover:opacity-90"
                    style={{ backgroundColor: "#137fec" }}
                  >
                    <GoogleIcon />
                    Sign in with Google
                  </a>
                )}
                <a
                  href="#guide"
                  className="rounded-xl bg-white/10 px-10 py-4 text-lg font-bold text-white backdrop-blur-md hover:bg-white/20 transition-all"
                >
                  Read the Guide
                </a>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ backgroundColor: "#137fec" }}>
                <span className="material-symbols-outlined text-xl">mail</span>
              </div>
              <span className="text-lg font-bold tracking-tight">AutoReply.ai</span>
            </div>
            <a
              href="mailto:aarav8090shukla@gmail.com"
              className="text-sm font-medium text-slate-500 hover:text-[#137fec] transition-colors"
            >
              Contact
            </a>
          </div>
          <div className="mt-12 text-center text-sm text-slate-400">
            <p>© {new Date().getFullYear()} AutoReply.ai. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
