import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

/* ── helpers ── */
const timeAgo = (d) => {
  if (!d) return "Never";
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";
const parseName = (raw = "") => { const m = raw.match(/^"?([^"<]+)"?\s*<?[^>]*>?$/); return (m ? m[1].trim() : raw) || raw; };
const initial  = (s = "") => s.trim()[0]?.toUpperCase() ?? "?";

/* ── StatCard ── */
const StatCard = ({ label, value, badge }) => (
  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
    <p className="text-sm text-slate-500 mb-1">{label}</p>
    <div className="flex items-end justify-between gap-2">
      <span className="text-2xl font-bold">{value}</span>
      {badge && <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${badge.cls}`}>{badge.text}</span>}
    </div>
  </div>
);

/* ── Toggle ── */
const Toggle = ({ checked, onChange, disabled }) => (
  <button
    onClick={onChange}
    disabled={disabled}
    className={`relative inline-flex h-8 w-14 items-center rounded-full p-1 transition-colors duration-300 ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    style={{ backgroundColor: checked ? "#137fec" : "#cbd5e1" }}
  >
    <span className={`inline-block h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-300 ${checked ? "translate-x-6" : "translate-x-0"}`} />
  </button>
);

/* ── main ── */
export default function Dashboard() {
  const [user,      setUser]      = useState(null);
  const [status,    setStatus]    = useState({ botEnabled: false, lastRun: null, lastError: null, replyCount: 0, errorCount: 0, successRate: 100, nextRunAt: null });
  const [activity,  setActivity]  = useState([]);
  const [settings,  setSettings]  = useState({ replyMessage: "", minInterval: 45, maxInterval: 120 });
  const [view,      setView]      = useState("dashboard");
  const [loading,   setLoading]   = useState(true);
  const [toggling,  setToggling]  = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [countdown, setCountdown] = useState(null);
  const navigate = useNavigate();

  const fetchStatus   = useCallback(async () => { const r = await fetch("/api/bot/status",   { credentials: "include" }); if (r.ok) setStatus(await r.json()); }, []);
  const fetchActivity = useCallback(async () => { const r = await fetch("/api/bot/activity", { credentials: "include" }); if (r.ok) setActivity(await r.json()); }, []);
  const fetchSettings = useCallback(async () => { const r = await fetch("/api/bot/settings", { credentials: "include" }); if (r.ok) setSettings(await r.json()); }, []);

  useEffect(() => {
    (async () => {
      try {
        const me = await fetch("/api/auth/me", { credentials: "include" });
        if (me.status === 401) { navigate("/"); return; }
        setUser(await me.json());
        await Promise.all([fetchStatus(), fetchActivity(), fetchSettings()]);
      } catch { navigate("/"); }
      finally { setLoading(false); }
    })();
  }, [navigate, fetchStatus, fetchActivity, fetchSettings]);

  useEffect(() => {
    const id = setInterval(() => { fetchStatus(); fetchActivity(); }, 10000);
    return () => clearInterval(id);
  }, [fetchStatus, fetchActivity]);

  useEffect(() => {
    if (!status.nextRunAt) { setCountdown(null); return; }
    const tick = () => setCountdown(Math.max(0, Math.floor((new Date(status.nextRunAt) - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [status.nextRunAt]);

  const handleToggle = async () => {
    setToggling(true);
    try {
      const r = await fetch("/api/bot/toggle", { method: "POST", credentials: "include" });
      const d = await r.json();
      setStatus((p) => ({ ...p, botEnabled: d.botEnabled }));
    } finally { setToggling(false); }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/bot/settings", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (r.ok) { setSettings(await r.json()); setSaved(true); setTimeout(() => setSaved(false), 3000); }
    } finally { setSaving(false); }
  };

  const minErr       = settings.minInterval < 10 ? "Minimum is 10 s" : settings.minInterval > 300 ? "Cannot exceed 300 s" : null;
  const maxErr       = settings.maxInterval < 10 ? "Minimum is 10 s" : settings.maxInterval > 600 ? "Cannot exceed 600 s" : null;
  const orderErr     = !minErr && !maxErr && settings.minInterval > settings.maxInterval ? "Min must be ≤ Max" : null;
  const intervalInvalid = !!(minErr || maxErr || orderErr);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    navigate("/");
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-background-light">
      <div className="flex gap-2">
        {[0, 150, 300].map((d) => (
          <span key={d} className="w-2.5 h-2.5 rounded-full animate-bounce" style={{ backgroundColor: "#137fec", animationDelay: `${d}ms` }} />
        ))}
      </div>
    </div>
  );

  const nextLabel = status.nextRunAt === null ? "Running…" : countdown !== null ? `${countdown}s` : "—";

  const navItems = [
    { id: "dashboard", icon: "dashboard", label: "Dashboard" },
    { id: "settings",  icon: "settings",  label: "Settings"  },
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background-light text-slate-900">

      {/* ── Mobile Top Header ── */}
      <header className="md:hidden shrink-0 flex items-center justify-between px-4 h-14 bg-white border-b border-slate-200">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="p-1.5 rounded-lg text-white" style={{ backgroundColor: "#137fec" }}>
            <span className="material-symbols-outlined text-xl">mail</span>
          </div>
          <span className="text-lg font-bold tracking-tight">AutoReply.ai</span>
        </button>
        {user && (
          user.picture
            ? <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
            : <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: "#137fec" }}>{initial(user.name)}</div>
        )}
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Desktop Sidebar ── */}
        <aside className="hidden md:flex w-64 shrink-0 border-r border-slate-200 bg-white flex-col justify-between p-6">
          <div className="flex flex-col gap-8">

            {/* Branding */}
            <button onClick={() => navigate("/")} className="flex items-center gap-3 px-2 hover:opacity-80 transition-opacity">
              <div className="p-2 rounded-lg text-white" style={{ backgroundColor: "#137fec" }}>
                <span className="material-symbols-outlined text-2xl">mail</span>
              </div>
              <span className="text-xl font-bold tracking-tight">AutoReply.ai</span>
            </button>

            {/* User profile */}
            {user && (
              <div className="flex items-center gap-3 px-2 py-4 border-y border-slate-100">
                {user.picture
                  ? <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                  : <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: "#137fec" }}>{initial(user.name)}</div>
                }
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
            )}

            {/* Nav */}
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors font-medium ${
                    view === item.id ? "text-white" : "text-slate-600 hover:bg-slate-100"
                  }`}
                  style={view === item.id ? { backgroundColor: "#137fec" } : {}}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors">
            <span className="material-symbols-outlined">logout</span>
            <span>Logout</span>
          </button>
        </aside>

        {/* ── Main ── */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12">

          {/* ════ DASHBOARD VIEW ════ */}
          {view === "dashboard" && (
            <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">

              {/* Header + toggle */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Dashboard Overview</h1>
                  <p className="text-slate-500 mt-1 text-sm md:text-base">Monitor and control your Gmail auto-reply bot.</p>
                </div>
                <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm w-full sm:w-auto">
                  <div>
                    <p className="text-sm font-bold">Bot Operation</p>
                    <p className="text-xs text-slate-500">Global control</p>
                  </div>
                  <Toggle checked={status.botEnabled} onChange={handleToggle} disabled={toggling} />
                </div>
              </div>

              {/* Status card + highlight */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">

                {/* Status card */}
                <div className="lg:col-span-2 bg-white rounded-xl p-5 md:p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-5 md:gap-6 items-start sm:items-center">
                  <div className="flex-1 space-y-4 w-full">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">System Status</p>
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${status.botEnabled ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
                        <p className="text-lg md:text-xl font-bold">{status.botEnabled ? "Bot is Active" : "Bot is Paused"}</p>
                      </div>
                      <p className="text-sm text-slate-500">
                        Last run: {status.lastRun ? `${fmtTime(status.lastRun)} · ${timeAgo(status.lastRun)}` : "Never"}
                      </p>
                      {status.botEnabled && countdown !== null && (
                        <p className="text-sm font-medium" style={{ color: "#137fec" }}>Next check in {nextLabel}</p>
                      )}
                    </div>
                    {status.lastError && (
                      <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{status.lastError}</p>
                    )}
                    <button
                      onClick={() => setView("settings")}
                      className="px-4 py-2 text-white rounded-lg font-medium text-sm transition-opacity hover:opacity-90 flex items-center gap-2"
                      style={{ backgroundColor: "#137fec" }}
                    >
                      <span className="material-symbols-outlined text-sm">settings</span>
                      Configure Bot
                    </button>
                  </div>

                  {/* Success rate block */}
                  <div className="w-full sm:w-36 md:w-44 shrink-0 flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-4 md:p-5">
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Success Rate</p>
                    <p className="text-3xl md:text-4xl font-extrabold" style={{ color: "#137fec" }}>{status.successRate}%</p>
                    <p className="text-xs text-slate-400 text-center">
                      {status.replyCount} sent · {status.errorCount} error{status.errorCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                {/* Replies highlight */}
                <div className="text-white rounded-xl p-5 md:p-6 shadow-lg flex flex-row lg:flex-col justify-between items-center lg:items-start gap-4" style={{ backgroundColor: "#137fec" }}>
                  <span className="material-symbols-outlined text-3xl opacity-80 hidden lg:block">auto_awesome</span>
                  <div>
                    <p className="text-sm font-medium opacity-80">Replies This Session</p>
                    <h3 className="text-4xl md:text-5xl font-bold mt-1">{status.replyCount}</h3>
                  </div>
                  <div className="lg:mt-4 lg:pt-4 lg:border-t lg:border-white/20 text-right lg:text-left">
                    <p className="text-xs opacity-80">Last Checked</p>
                    <p className="text-lg md:text-xl font-semibold">{fmtTime(status.lastRun)}</p>
                  </div>
                </div>
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                <StatCard label="Success Rate"  value={`${status.successRate}%`}
                  badge={status.successRate === 100
                    ? { text: "Perfect",  cls: "text-emerald-600 bg-emerald-500/10" }
                    : { text: "Degraded", cls: "text-amber-600 bg-amber-500/10" }} />
                <StatCard label="Replies Sent" value={status.replyCount}
                  badge={{ text: "Session", cls: "text-[#137fec] bg-[#137fec]/10" }} />
                <StatCard label="Last Run"     value={fmtTime(status.lastRun)}
                  badge={{ text: timeAgo(status.lastRun), cls: "text-[#137fec] bg-[#137fec]/10" }} />
                <StatCard label="Next Check"   value={status.botEnabled ? nextLabel : "—"}
                  badge={status.botEnabled
                    ? { text: "Scheduled", cls: "text-emerald-600 bg-emerald-500/10" }
                    : { text: "Bot off",   cls: "text-slate-400 bg-slate-100" }} />
              </div>

              {/* Activity feed */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-bold">Recent Automated Replies</h3>
                  <span className="text-xs text-slate-400">{activity.length} this session</span>
                </div>

                {activity.length === 0 ? (
                  <div className="p-8 md:p-12 text-center">
                    <span className="material-symbols-outlined text-4xl text-slate-200">mark_email_read</span>
                    <p className="mt-3 text-sm text-slate-400">No replies sent yet this session.</p>
                    <p className="text-xs text-slate-300 mt-1">Enable the bot and wait for the next check cycle.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {activity.map((item, i) => (
                      <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 text-white" style={{ backgroundColor: "#137fec" }}>
                            {initial(parseName(item.from))}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{item.subject}</p>
                            <p className="text-xs text-slate-500 truncate">{parseName(item.from)}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p className="text-xs font-medium text-slate-600">{timeAgo(item.repliedAt)}</p>
                          <p className="text-[10px] text-emerald-500 font-bold uppercase mt-0.5">Success</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════ SETTINGS VIEW ════ */}
          {view === "settings" && (
            <div className="max-w-2xl mx-auto space-y-6 md:space-y-8">

              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Settings</h1>
                <p className="text-slate-500 mt-1">Customise how the bot behaves for your account.</p>
              </div>

              {/* Reply message */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 md:p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: "#137fec" }}>
                    <span className="material-symbols-outlined text-xl">edit_note</span>
                  </div>
                  <div>
                    <h2 className="font-bold">Auto-Reply Message</h2>
                    <p className="text-xs text-slate-500">This is the message sent to senders automatically.</p>
                  </div>
                </div>
                <textarea
                  rows={5}
                  value={settings.replyMessage}
                  onChange={(e) => setSettings((p) => ({ ...p, replyMessage: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 resize-none"
                  style={{ "--tw-ring-color": "#137fec" }}
                  placeholder="Type your auto-reply message…"
                />
                <p className="text-xs text-slate-400">{settings.replyMessage.length} characters</p>
              </div>

              {/* Check interval */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 md:p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: "#137fec" }}>
                    <span className="material-symbols-outlined text-xl">timer</span>
                  </div>
                  <div>
                    <h2 className="font-bold">Check Interval</h2>
                    <p className="text-xs text-slate-500">How often the bot scans your inbox (in seconds). A random value between min and max is used each cycle.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Min (seconds)</label>
                    <input
                      type="number"
                      value={settings.minInterval}
                      onChange={(e) => setSettings((p) => ({ ...p, minInterval: Number(e.target.value) }))}
                      className={`w-full rounded-lg border px-4 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 ${
                        minErr || orderErr ? "border-red-400 focus:ring-red-300" : "border-slate-200"
                      }`}
                    />
                    {minErr && <p className="mt-1 text-xs text-red-500">{minErr}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Max (seconds)</label>
                    <input
                      type="number"
                      value={settings.maxInterval}
                      onChange={(e) => setSettings((p) => ({ ...p, maxInterval: Number(e.target.value) }))}
                      className={`w-full rounded-lg border px-4 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 ${
                        maxErr || orderErr ? "border-red-400 focus:ring-red-300" : "border-slate-200"
                      }`}
                    />
                    {maxErr && <p className="mt-1 text-xs text-red-500">{maxErr}</p>}
                  </div>
                </div>

                {orderErr && (
                  <p className="flex items-center gap-1.5 text-xs text-red-500">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {orderErr}
                  </p>
                )}

                <p className="text-xs text-slate-400">Allowed range: 10–300 s (min) · 10–600 s (max) · Default: 10 s</p>
              </div>

              {/* Save */}
              <div className="flex items-center gap-4">
                <button
                  onClick={handleSaveSettings}
                  disabled={saving || intervalInvalid}
                  title={intervalInvalid ? "Fix the errors above before saving" : ""}
                  className="px-8 py-3 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#137fec" }}
                >
                  {saving ? "Saving…" : "Save Settings"}
                </button>
                {saved && (
                  <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                    Saved successfully
                  </div>
                )}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="md:hidden shrink-0 bg-white border-t border-slate-200 flex items-center justify-around px-2 py-1 safe-area-bottom">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className="flex flex-col items-center gap-0.5 px-5 py-1.5 rounded-xl text-xs font-medium transition-colors"
            style={view === item.id ? { color: "#137fec" } : { color: "#94a3b8" }}
          >
            <span className="material-symbols-outlined text-2xl">{item.icon}</span>
            {item.label}
          </button>
        ))}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-0.5 px-5 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-red-500 transition-colors"
        >
          <span className="material-symbols-outlined text-2xl">logout</span>
          Logout
        </button>
      </nav>

    </div>
  );
}
