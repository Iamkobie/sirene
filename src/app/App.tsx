import { useState, useEffect, useRef } from "react";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router";

type Screen = "login" | "home" | "play" | "mission" | "recording" | "evaluation" | "leaderboard" | "profile" | "achievements" | "daily";

type Rank = "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond";

const RANKS: Record<Rank, { color: string; bg: string; min: number; max: number }> = {
  Bronze:   { color: "#c97c4a", bg: "rgba(201,124,74,0.12)",  min: 0,     max: 1000  },
  Silver:   { color: "#8fa8c0", bg: "rgba(143,168,192,0.12)", min: 1000,  max: 3000  },
  Gold:     { color: "#d4a017", bg: "rgba(212,160,23,0.12)",  min: 3000,  max: 6000  },
  Platinum: { color: "#2ec4c4", bg: "rgba(46,196,196,0.12)",  min: 6000,  max: 10000 },
  Diamond:  { color: "#9b5de5", bg: "rgba(155,93,229,0.12)",  min: 10000, max: 15000 },
};

function getRank(xp: number): Rank {
  if (xp < 1000)  return "Bronze";
  if (xp < 3000)  return "Silver";
  if (xp < 6000)  return "Gold";
  if (xp < 10000) return "Platinum";
  return "Diamond";
}

const ui: React.CSSProperties  = { fontFamily: "'Inter', sans-serif" };
const mono: React.CSSProperties = { fontFamily: "'Space Mono', monospace" };
const pixel: React.CSSProperties = { fontFamily: "'Press Start 2P', monospace" };

// ─── Shared components ────────────────────────────────────────────────────────

function RankBadge({ rank, size = 32 }: { rank: Rank; size?: number }) {
  const { color, bg } = RANKS[rank];
  const emoji = { Bronze: "🥉", Silver: "🥈", Gold: "🥇", Platinum: "💎", Diamond: "💠" }[rank];
  return (
    <span title={rank} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: size, height: size, borderRadius: "50%", background: bg, border: `1.5px solid ${color}66`, fontSize: size * 0.46, flexShrink: 0 }}>
      {emoji}
    </span>
  );
}

function ProgressBar({ pct, color, height = 6 }: { pct: number; color: string; height?: number }) {
  return (
    <div style={{ height, width: "100%", background: "rgba(255,255,255,0.06)", borderRadius: height }}>
      <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: color, borderRadius: height, opacity: 0.85, transition: "width 0.5s ease" }} />
    </div>
  );
}

function Card({ children, style = {}, onClick }: { children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, ...style, cursor: onClick ? "pointer" : "default", transition: "background 0.15s ease" }}
      onMouseEnter={onClick ? (e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.07)"; } : undefined}
      onMouseLeave={onClick ? (e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)"; } : undefined}
    >
      {children}
    </div>
  );
}

function Btn({ children, color = "#9b5de5", onClick, full = false, variant = "solid", size = "md", disabled = false }: {
  children: React.ReactNode; color?: string; onClick?: () => void; full?: boolean;
  variant?: "solid" | "outline" | "ghost"; size?: "sm" | "md" | "lg"; disabled?: boolean;
}) {
  const pad = { sm: "8px 16px", md: "10px 22px", lg: "13px 32px" };
  const fs  = { sm: 12, md: 13, lg: 15 };
  const bg = variant === "solid" ? (disabled ? "rgba(155,93,229,0.2)" : color) : "transparent";
  const border = variant === "outline" ? `1.5px solid ${color}99` : "1.5px solid transparent";
  const textColor = variant === "solid" ? (disabled ? "#6b5f8a" : "#fff") : color;
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ ...ui, fontWeight: 700, fontSize: fs[size], background: bg, border, color: textColor, borderRadius: 10, padding: pad[size], cursor: disabled ? "not-allowed" : "pointer", width: full ? "100%" : undefined, boxShadow: variant === "solid" && !disabled ? `0 4px 18px ${color}44` : "none", transition: "all 0.15s ease" }}
    >
      {children}
    </button>
  );
}

function Input({ label, type = "text", value, onChange, placeholder }: { label?: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      {label && <div style={{ ...ui, fontSize: 11, fontWeight: 600, color: "#8878a8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{label}</div>}
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        style={{ ...ui, width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "11px 14px", color: "#f0eaff", fontSize: 14, outline: "none", boxSizing: "border-box" }}
        onFocus={(e) => { e.currentTarget.style.border = "1px solid rgba(155,93,229,0.6)"; }}
        onBlur={(e)  => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.1)"; }}
      />
    </div>
  );
}

// ─── Capsule Navbar ───────────────────────────────────────────────────────────

const NAV_ITEMS: { label: string; icon: string; screen: Screen }[] = [
  { label: "Home",         icon: "⌂",  screen: "home" },
  { label: "Play",         icon: "▶",  screen: "play" },
  { label: "Leaderboard",  icon: "★",  screen: "leaderboard" },
  { label: "Daily",        icon: "⚡", screen: "daily" },
  { label: "Achievements", icon: "🏆", screen: "achievements" },
  { label: "Profile",      icon: "◉",  screen: "profile" },
];

function Navbar({ xp, rank }: { xp: number; rank: Rank }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const screen = pathname.replace("/", "") || "home";
  return (
    <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(14,10,28,0.85)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(155,93,229,0.12)" }}>
      <button onClick={() => navigate("/home")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 20 }}>🌊</span>
        <span style={{ ...pixel, fontSize: 10, color: "#f0eaff", letterSpacing: 1 }}>SI<span style={{ color: "#9b5de5" }}>RENE</span></span>
      </button>

      <nav style={{ display: "flex", alignItems: "center", gap: 2, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 50, padding: "4px" }}>
        {NAV_ITEMS.map(({ label, icon, screen: s }) => {
          const active = screen === s;
          return (
            <button key={s} onClick={() => navigate(`/${s}`)} title={label}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 50, border: "none", background: active ? "#9b5de5" : "transparent", color: active ? "#fff" : "#8878a8", cursor: "pointer", fontSize: 12, fontWeight: 600, transition: "all 0.15s ease", boxShadow: active ? "0 0 14px rgba(155,93,229,0.45)" : "none", ...ui }}
              onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = "#d5cef0"; }}
              onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = "#8878a8"; }}
            >
              <span style={{ fontSize: 14, lineHeight: 1 }}>{icon}</span>
              <span style={{ fontSize: 12 }}>{label}</span>
            </button>
          );
        })}
      </nav>

      <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 50, padding: "6px 12px 6px 8px", cursor: "pointer" }} onClick={() => navigate("/profile")}>
        <RankBadge rank={rank} size={26} />
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ ...ui, fontSize: 11, fontWeight: 700, color: "#f0eaff" }}>PLAYER_ONE</div>
          <div style={{ ...mono, fontSize: 9, color: RANKS[rank].color }}>{xp.toLocaleString()} XP</div>
        </div>
      </div>
    </header>
  );
}

function Page({ children, maxWidth = 860 }: { children: React.ReactNode; maxWidth?: number }) {
  return (
    <main style={{ minHeight: "100vh", paddingTop: 80 }}>
      <div style={{ maxWidth, margin: "0 auto", padding: "40px 24px 60px" }}>{children}</div>
    </main>
  );
}

function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h1 style={{ ...ui, fontSize: 28, fontWeight: 800, color: "#f0eaff", margin: 0 }}>{title}</h1>
      {subtitle && <p style={{ ...ui, fontSize: 14, color: "#8878a8", margin: "6px 0 0" }}>{subtitle}</p>}
    </div>
  );
}

// ─── Screen: Login ────────────────────────────────────────────────────────────

function LoginScreen() {
  const navigate = useNavigate();
  const onLogin = () => navigate("/home");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [name, setName] = useState("");

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, margin: "0 auto 20px", background: "linear-gradient(135deg, #9b5de5, #5b21b6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, boxShadow: "0 8px 32px rgba(155,93,229,0.4)" }}>🌊</div>
        <h1 style={{ ...pixel, fontSize: 16, color: "#f0eaff", letterSpacing: 2, margin: 0 }}>
          SI<span style={{ color: "#9b5de5" }}>RENE</span>
        </h1>
        <p style={{ ...ui, fontSize: 14, color: "#8878a8", marginTop: 10 }}>Master Philippine languages. Earn ranks. Beat the board.</p>
      </div>

      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 4, marginBottom: 20 }}>
          {(["login", "signup"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              style={{ flex: 1, padding: "9px", borderRadius: 9, border: "none", cursor: "pointer", background: mode === m ? "#9b5de5" : "transparent", color: mode === m ? "#fff" : "#8878a8", fontWeight: 700, fontSize: 13, transition: "all 0.15s", boxShadow: mode === m ? "0 0 12px rgba(155,93,229,0.4)" : "none", ...ui }}
            >
              {m === "login" ? "Log In" : "Sign Up"}
            </button>
          ))}
        </div>

        <Card style={{ padding: 28 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {mode === "signup" && <Input label="Username" value={name} onChange={setName} placeholder="PixelMaster42" />}
            <Input label="Email" value={email} onChange={setEmail} placeholder="player@sirene.ph" />
            <Input label="Password" type="password" value={pw} onChange={setPw} placeholder="••••••••" />
            <Btn color="#9b5de5" onClick={onLogin} full size="lg">
              {mode === "login" ? "▶  Start Playing" : "★  Create Account"}
            </Btn>
            {mode === "login" && (
              <p style={{ ...ui, fontSize: 12, color: "#8878a8", textAlign: "center", margin: 0 }}>
                Forgot password? <span style={{ color: "#9b5de5", cursor: "pointer" }}>Reset it</span>
              </p>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
              <span style={{ ...ui, fontSize: 11, color: "#8878a8" }}>or</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
            </div>
            <Btn color="#8878a8" variant="outline" full size="md" onClick={onLogin}>👤  Continue as Guest</Btn>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Screen: Home ─────────────────────────────────────────────────────────────

function HomeScreen({ xp, rank }: { xp: number; rank: Rank }) {
  const navigate = useNavigate();
  const onNav = (s: Screen) => navigate(`/${s}`);
  const cfg = RANKS[rank];
  const pct = Math.min(100, ((xp - cfg.min) / (cfg.max - cfg.min)) * 100);
  const rankKeys = Object.keys(RANKS) as Rank[];
  const nextRank = rankKeys[Math.min(rankKeys.indexOf(rank) + 1, rankKeys.length - 1)];

  const langs = [
    { name: "Bisaya",      level: "Intermediate", pct: 68, color: "#e05a84" },
    { name: "Cebuano",     level: "Advanced",     pct: 85, color: "#2ec4c4" },
    { name: "Kapampangan", level: "Beginner",     pct: 24, color: "#9b5de5" },
    { name: "Ilocano",     level: "Beginner",     pct: 10, color: "#d4a017" },
  ];

  return (
    <Page>
      {/* Profile row — single clean card */}
      <Card style={{ padding: "22px 26px", marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{ width: 50, height: 50, borderRadius: 14, background: "linear-gradient(135deg, #3b1d72, #1e0f3a)", border: `2px solid ${cfg.color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🧑‍💻</div>
            <div style={{ position: "absolute", bottom: -6, right: -6 }}><RankBadge rank={rank} size={20} /></div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span style={{ ...ui, fontSize: 16, fontWeight: 800, color: "#f0eaff" }}>PLAYER_ONE</span>
              <span style={{ ...pixel, fontSize: 7, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}44`, padding: "3px 7px", borderRadius: 5 }}>{rank}</span>
              <span style={{ ...ui, fontSize: 13, color: "#e0763a" }}>🔥 7-day streak</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1 }}><ProgressBar pct={pct} color={cfg.color} height={6} /></div>
              <span style={{ ...mono, fontSize: 10, color: "#8878a8", flexShrink: 0 }}>{xp.toLocaleString()} / {cfg.max.toLocaleString()} XP · {(cfg.max - xp).toLocaleString()} to {nextRank}</span>
            </div>
          </div>
          <Btn color="#9b5de5" onClick={() => onNav("play")} size="md">▶  Play Now</Btn>
        </div>
      </Card>

      {/* Languages */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ ...ui, fontSize: 16, fontWeight: 700, color: "#f0eaff", margin: 0 }}>Your Languages</h2>
          <button onClick={() => onNav("play")} style={{ ...ui, fontSize: 12, color: "#9b5de5", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>+ Add language</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          {langs.map((l) => (
            <Card key={l.name} style={{ padding: 18 }} onClick={() => onNav("mission")}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ ...ui, fontSize: 13, fontWeight: 700, color: "#f0eaff" }}>{l.name}</div>
                <div style={{ ...ui, fontSize: 11, color: "#8878a8", marginTop: 2 }}>{l.level}</div>
              </div>
              <ProgressBar pct={l.pct} color={l.color} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                <span style={{ ...ui, fontSize: 11, color: "#8878a8" }}>{l.pct}%</span>
                <span style={{ ...ui, fontSize: 11, color: l.color, fontWeight: 600 }}>Practice →</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {[
          { label: "Daily Quest",  icon: "⚡", sub: "4 quests available",  color: "#e05a84", screen: "daily" as Screen },
          { label: "Leaderboard",  icon: "★",  sub: "You are ranked #142", color: "#d4a017", screen: "leaderboard" as Screen },
          { label: "Achievements", icon: "🏆", sub: "4 of 8 unlocked",     color: "#2ec4c4", screen: "achievements" as Screen },
        ].map((a) => (
          <Card key={a.label} style={{ padding: 20 }} onClick={() => onNav(a.screen)}>
            <div style={{ fontSize: 26, marginBottom: 8 }}>{a.icon}</div>
            <div style={{ ...ui, fontSize: 14, fontWeight: 700, color: "#f0eaff" }}>{a.label}</div>
            <div style={{ ...ui, fontSize: 12, color: "#8878a8", marginTop: 2 }}>{a.sub}</div>
            <div style={{ ...ui, fontSize: 12, color: a.color, marginTop: 8, fontWeight: 600 }}>View →</div>
          </Card>
        ))}
      </div>
    </Page>
  );
}

// ─── Screen: Play ─────────────────────────────────────────────────────────────

// Phrases keyed by source language
const SOURCE_PHRASES: Record<string, string[]> = {
  English: [
    "Have you eaten yet?",
    "Good morning, how are you?",
    "Where are you going?",
    "I am happy to see you.",
    "What is your name?",
    "Thank you very much.",
  ],
  Tagalog: [
    "Kumain ka na ba?",
    "Magandang umaga, kumusta ka?",
    "Saan ka pupunta?",
    "Masaya akong makita ka.",
    "Ano ang pangalan mo?",
    "Maraming salamat.",
  ],
};

function PlayScreen() {
  const navigate = useNavigate();
  const onNav = (s: Screen) => navigate(`/${s}`);
  const [from, setFrom]       = useState("English");
  const [to, setTo]           = useState("Bisaya");
  const [diff, setDiff]       = useState("Normal");
  const [phraseIdx, setPhraseIdx] = useState(0);

  const sources = ["English", "Tagalog"];
  const targets = ["Bisaya", "Cebuano", "Kapampangan", "Ilocano", "Waray", "Hiligaynon", "Bicolano", "Tagalog"];
  const diffs   = [
    { label: "Easy",   color: "#2ec4c4" },
    { label: "Normal", color: "#9b5de5" },
    { label: "Hard",   color: "#d4a017" },
    { label: "Expert", color: "#e05a84" },
  ];

  const phrases    = SOURCE_PHRASES[from] ?? [];
  const activePhraseText = phrases[phraseIdx] ?? phrases[0];

  const selStyle: React.CSSProperties = {
    ...ui, width: "100%", background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
    padding: "11px 36px 11px 14px", color: "#f0eaff", fontSize: 14,
    outline: "none", cursor: "pointer", appearance: "none",
  };

  return (
    <Page maxWidth={680}>
      <PageHeader title="New Challenge" subtitle="Choose your language, pick a phrase, then start speaking" />

      <Card style={{ padding: 0, overflow: "hidden", marginBottom: 16 }}>

        {/* ── Phrase to translate — prominent top section ── */}
        <div style={{ padding: "28px 28px 24px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(155,93,229,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#9b5de5", boxShadow: "0 0 6px #9b5de5" }} />
              <span style={{ ...ui, fontSize: 11, fontWeight: 700, color: "#8878a8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Phrase to Translate
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ ...ui, fontSize: 11, color: "#8878a8" }}>{phraseIdx + 1} / {phrases.length}</span>
              <button
                onClick={() => setPhraseIdx((i) => (i + 1) % phrases.length)}
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, padding: "4px 10px", color: "#8878a8", cursor: "pointer", fontSize: 11, ...ui }}
              >
                Next ↻
              </button>
            </div>
          </div>

          {/* The actual phrase — large and prominent */}
          <p style={{ ...ui, fontSize: 22, fontWeight: 800, color: "#f0eaff", margin: 0, lineHeight: 1.4, letterSpacing: "-0.01em" }}>
            "{activePhraseText}"
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16 }}>
            <span style={{ ...ui, fontSize: 12, color: "#8878a8" }}>Speak this in</span>
            <span style={{ ...ui, fontSize: 13, fontWeight: 700, color: "#9b5de5", background: "rgba(155,93,229,0.15)", border: "1px solid rgba(155,93,229,0.3)", borderRadius: 6, padding: "2px 10px" }}>{to}</span>
            <span style={{ ...ui, fontSize: 12, color: "#8878a8" }}>when the challenge begins</span>
          </div>
        </div>

        {/* ── Config section ── */}
        <div style={{ padding: "24px 28px 28px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            <div>
              <div style={{ ...ui, fontSize: 11, fontWeight: 600, color: "#8878a8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Source Language</div>
              <div style={{ position: "relative" }}>
                <select value={from} onChange={(e) => { setFrom(e.target.value); setPhraseIdx(0); }} style={selStyle}>
                  {sources.map((l) => <option key={l}>{l}</option>)}
                </select>
                <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#8878a8", pointerEvents: "none", fontSize: 11 }}>▾</span>
              </div>
            </div>
            <div>
              <div style={{ ...ui, fontSize: 11, fontWeight: 600, color: "#8878a8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Target Dialect</div>
              <div style={{ position: "relative" }}>
                <select value={to} onChange={(e) => setTo(e.target.value)} style={selStyle}>
                  {targets.map((l) => <option key={l}>{l}</option>)}
                </select>
                <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#8878a8", pointerEvents: "none", fontSize: 11 }}>▾</span>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ ...ui, fontSize: 11, fontWeight: 600, color: "#8878a8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Difficulty</div>
            <div style={{ display: "flex", gap: 8 }}>
              {diffs.map((d) => (
                <button key={d.label} onClick={() => setDiff(d.label)}
                  style={{ flex: 1, padding: "10px 0", borderRadius: 10, cursor: "pointer", background: diff === d.label ? d.color : "rgba(255,255,255,0.05)", border: `1.5px solid ${diff === d.label ? d.color : "transparent"}`, color: diff === d.label ? "#fff" : "#8878a8", fontWeight: 700, fontSize: 12, transition: "all 0.15s", boxShadow: diff === d.label ? `0 4px 14px ${d.color}44` : "none", ...ui }}
                >{d.label}</button>
              ))}
            </div>
          </div>

          <Btn color="#9b5de5" onClick={() => onNav("mission")} full size="lg">★  Start Challenge</Btn>
        </div>
      </Card>

      {/* All phrases list */}
      <div style={{ ...ui, fontSize: 11, fontWeight: 600, color: "#8878a8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
        All phrases in this set
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {phrases.map((p, i) => (
          <button key={i} onClick={() => setPhraseIdx(i)}
            style={{ ...ui, textAlign: "left", padding: "12px 16px", borderRadius: 10, border: `1px solid ${i === phraseIdx ? "rgba(155,93,229,0.4)" : "rgba(255,255,255,0.07)"}`, background: i === phraseIdx ? "rgba(155,93,229,0.1)" : "rgba(255,255,255,0.03)", cursor: "pointer", transition: "all 0.15s", display: "flex", alignItems: "center", gap: 12 }}
          >
            <span style={{ ...mono, fontSize: 10, color: i === phraseIdx ? "#9b5de5" : "#8878a8", width: 16, flexShrink: 0 }}>{i + 1}</span>
            <span style={{ ...ui, fontSize: 13, color: i === phraseIdx ? "#f0eaff" : "#8878a8", fontWeight: i === phraseIdx ? 600 : 400 }}>{p}</span>
            {i === phraseIdx && <span style={{ marginLeft: "auto", fontSize: 11, color: "#9b5de5" }}>Selected</span>}
          </button>
        ))}
      </div>
    </Page>
  );
}

// ─── Screen: Mission ──────────────────────────────────────────────────────────

function MissionScreen() {
  const navigate = useNavigate();
  const onNav = (s: Screen) => navigate(`/${s}`);
  const [idx, setIdx] = useState(0);
  const phrases = [
    { src: "Kumain ka na ba?",   tgt: "Nakakaon na ba ka?",   rom: "Have you eaten yet?" },
    { src: "Asan ka na?",        tgt: "Hain ka na?",           rom: "Where are you now?" },
    { src: "Magandang umaga.",   tgt: "Maayong buntag.",       rom: "Good morning." },
  ];
  const p = phrases[idx];

  return (
    <Page maxWidth={680}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ ...ui, fontSize: 22, fontWeight: 800, color: "#f0eaff", margin: 0 }}>Phrase Challenge</h1>
          <p style={{ ...ui, fontSize: 13, color: "#8878a8", margin: "4px 0 0" }}>Tagalog → Bisaya · Normal</p>
        </div>
        <span style={{ ...pixel, fontSize: 8, color: "#9b5de5", background: "rgba(155,93,229,0.12)", border: "1px solid rgba(155,93,229,0.25)", padding: "6px 10px", borderRadius: 8 }}>Level 4-2</span>
      </div>

      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ ...ui, fontSize: 12, color: "#8878a8" }}>Phrase {idx + 1} of {phrases.length}</span>
          <span style={{ ...ui, fontSize: 12, color: "#8878a8" }}>{Math.round((idx / phrases.length) * 100)}% complete</span>
        </div>
        <ProgressBar pct={(idx / phrases.length) * 100} color="#9b5de5" height={6} />
      </div>

      <Card style={{ padding: 32, marginBottom: 20 }}>
        <div style={{ ...ui, fontSize: 11, fontWeight: 600, color: "#8878a8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>Translate this phrase</div>
        <p style={{ ...ui, fontSize: 20, fontWeight: 700, color: "#f0eaff", lineHeight: 1.5, marginBottom: 24 }}>"{p.src}"</p>
        <div style={{ background: "rgba(155,93,229,0.08)", border: "1px solid rgba(155,93,229,0.2)", borderRadius: 12, padding: 20 }}>
          <div style={{ ...ui, fontSize: 11, color: "#8878a8", marginBottom: 6 }}>Bisaya translation</div>
          <div style={{ ...ui, fontSize: 20, color: "#c4a0f5", fontWeight: 700, marginBottom: 6 }}>{p.tgt}</div>
          <div style={{ ...mono, fontSize: 12, color: "#8878a8" }}>{p.rom}</div>
        </div>
      </Card>

      <div style={{ display: "flex", gap: 12 }}>
        <Btn color="#2ec4c4" variant="outline" size="md" onClick={() => {}}>♪  Listen</Btn>
        <Btn color="#9b5de5" size="md" onClick={() => onNav("recording")}>●  Record</Btn>
        <div style={{ flex: 1 }} />
        <Btn color="#8878a8" variant="ghost" size="md" onClick={() => setIdx((i) => Math.min(i + 1, phrases.length - 1))}>Skip  ▶</Btn>
      </div>
    </Page>
  );
}

// ─── Screen: Recording ────────────────────────────────────────────────────────

function RecordingScreen() {
  const navigate = useNavigate();
  const onNav = (s: Screen) => navigate(`/${s}`);
  const [phase, setPhase] = useState<"idle" | "rec" | "done">("idle");
  const [secs, setSecs] = useState(0);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = () => { setPhase("rec"); setSecs(0); ref.current = setInterval(() => setSecs((s) => s + 1), 1000); };
  const stop  = () => { setPhase("done"); if (ref.current) clearInterval(ref.current); };
  useEffect(() => () => { if (ref.current) clearInterval(ref.current); }, []);

  return (
    <Page maxWidth={560}>
      <PageHeader
        title={phase === "idle" ? "Ready to Record" : phase === "rec" ? "Recording…" : "Recording Complete"}
        subtitle={phase === "idle" ? "Tap the button when ready" : phase === "rec" ? "Speak clearly — tap mic to stop" : "Review before submitting"}
      />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28, marginBottom: 32 }}>
        <div onClick={phase === "rec" ? stop : undefined}
          style={{ width: 100, height: 100, borderRadius: "50%", cursor: phase === "rec" ? "pointer" : "default", background: phase === "rec" ? "linear-gradient(135deg, #e05a84, #9b5de5)" : "rgba(255,255,255,0.06)", border: `3px solid ${phase === "rec" ? "rgba(224,90,132,0.5)" : "rgba(255,255,255,0.1)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, boxShadow: phase === "rec" ? "0 0 40px rgba(224,90,132,0.3)" : "0 8px 30px rgba(0,0,0,0.4)", transition: "all 0.3s ease" }}
        >🎤</div>
        <div style={{ ...mono, fontSize: 36, color: phase === "rec" ? "#e05a84" : "#8878a8", letterSpacing: 4 }}>
          {String(Math.floor(secs / 60)).padStart(2, "0")}:{String(secs % 60).padStart(2, "0")}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 3, height: 40 }}>
          {[...Array(32)].map((_, i) => {
            const h = phase === "rec" ? 4 + Math.abs(Math.sin(i * 0.8 + secs * 3)) * 32 : 3;
            return <div key={i} style={{ width: 3, height: h, borderRadius: 2, background: phase === "rec" ? (i % 2 ? "#e05a84" : "#9b5de5") : "rgba(255,255,255,0.12)", transition: "height 0.1s ease" }} />;
          })}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 320, margin: "0 auto" }}>
        {phase === "idle" && <Btn color="#e05a84" size="lg" full onClick={start}>●  Start Recording</Btn>}
        {phase === "rec"  && <div style={{ display: "flex", gap: 10 }}><Btn color="#e05a84" size="md" full onClick={stop}>■  Stop</Btn><Btn color="#8878a8" variant="outline" size="md" full onClick={() => { setPhase("idle"); setSecs(0); }}>✕  Cancel</Btn></div>}
        {phase === "done" && <><Btn color="#2ec4c4" variant="outline" size="md" full onClick={() => {}}>▶  Play Back</Btn><Btn color="#9b5de5" size="md" full onClick={() => onNav("evaluation")}>★  Submit Recording</Btn><Btn color="#8878a8" variant="ghost" size="sm" full onClick={() => setPhase("idle")}>↺  Record again</Btn></>}
      </div>
    </Page>
  );
}

// ─── Screen: Evaluation ───────────────────────────────────────────────────────

function EvaluationScreen({ onXP }: { onXP: (n: number) => void }) {
  const navigate = useNavigate();
  const onNav = (s: Screen) => navigate(`/${s}`);
  const [coinsVisible, setCoinsVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setCoinsVisible(true), 300); return () => clearTimeout(t); }, []);

  const scores = [
    { label: "Pronunciation", val: 88, color: "#2ec4c4" },
    { label: "Accuracy",      val: 75, color: "#9b5de5" },
    { label: "Fluency",       val: 82, color: "#d4a017" },
    { label: "Timing",        val: 91, color: "#2ec4c4" },
  ];
  const total = Math.round(scores.reduce((a, s) => a + s.val, 0) / scores.length);
  const xp    = Math.round(total * 1.5);
  const grade = total >= 90 ? "S" : total >= 80 ? "A" : total >= 70 ? "B" : total >= 60 ? "C" : "D";
  const gc    = total >= 80 ? "#2ec4c4" : total >= 60 ? "#d4a017" : "#e05a84";

  return (
    <Page maxWidth={680}>
      {coinsVisible && (
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 200, overflow: "hidden" }}>
          {[...Array(8)].map((_, i) => <div key={i} style={{ position: "absolute", left: `${15 + i * 9}%`, bottom: "35%", fontSize: 22, animation: `coinFly 1.4s ease-out ${i * 0.1}s both` }}>🪙</div>)}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <Card style={{ padding: 32, textAlign: "center" }}>
          <div style={{ ...ui, fontSize: 11, fontWeight: 600, color: "#8878a8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>Mission Complete</div>
          <div style={{ fontSize: 80, fontWeight: 900, color: gc, lineHeight: 1, marginBottom: 8, ...ui }}>{grade}</div>
          <div style={{ ...mono, fontSize: 26, color: "#f0eaff" }}>{total}/100</div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12, padding: "6px 14px", borderRadius: 50, background: "rgba(212,160,23,0.12)", border: "1px solid rgba(212,160,23,0.3)" }}>
            <span>🪙</span>
            <span style={{ ...ui, fontSize: 13, fontWeight: 700, color: "#d4a017" }}>+{xp} XP earned</span>
          </div>
        </Card>
        <Card style={{ padding: 24 }}>
          <div style={{ ...ui, fontSize: 13, fontWeight: 700, color: "#f0eaff", marginBottom: 16 }}>Score Breakdown</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {scores.map((s) => (
              <div key={s.label}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ ...ui, fontSize: 12, color: "#d5cef0" }}>{s.label}</span>
                  <span style={{ ...mono, fontSize: 11, color: s.color, fontWeight: 700 }}>{s.val}</span>
                </div>
                <ProgressBar pct={s.val} color={s.color} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ ...ui, fontSize: 13, fontWeight: 700, color: "#f0eaff", marginBottom: 16 }}>AI Feedback</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {["Great pronunciation on vowels!", "Work on tonal patterns.", "Fluency improved +12% this week.", "Practice consonant clusters more."].map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{ fontSize: 14, marginTop: 1 }}>{i === 0 || i === 2 ? "✅" : "⚠️"}</span>
              <span style={{ ...ui, fontSize: 13, color: "#d5cef0", lineHeight: 1.5 }}>{f}</span>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: "flex", gap: 12 }}>
        <Btn color="#8878a8" variant="outline" size="md" onClick={() => { onXP(xp); onNav("home"); }}>← Back Home</Btn>
        <Btn color="#9b5de5" size="md" onClick={() => onNav("mission")}>Next Phrase →</Btn>
      </div>
    </Page>
  );
}

// ─── Screen: Leaderboard ──────────────────────────────────────────────────────

function LeaderboardScreen() {
  const [tab, setTab] = useState<"Global" | "Language" | "Weekly">("Global");
  const players = [
    { name: "PIXEL_MASTER",  xp: 14200, rank: "Diamond" as Rank,  flag: "🇵🇭", streak: 45, avatar: "🧑",   me: false },
    { name: "NEON_LINGUIST", xp: 11800, rank: "Diamond" as Rank,  flag: "🇵🇭", streak: 32, avatar: "👩",   me: false },
    { name: "ARCADE_NINJA",  xp: 9600,  rank: "Platinum" as Rank, flag: "🇵🇭", streak: 28, avatar: "🧙",   me: false },
    { name: "BYTE_SPEAKER",  xp: 8200,  rank: "Platinum" as Rank, flag: "🇵🇭", streak: 21, avatar: "🤖",   me: false },
    { name: "GLITCH_TONGUE", xp: 5900,  rank: "Gold" as Rank,     flag: "🇵🇭", streak: 15, avatar: "🦊",   me: false },
    { name: "PLAYER_ONE",    xp: 4750,  rank: "Gold" as Rank,     flag: "🇵🇭", streak: 7,  avatar: "🧑‍💻", me: true  },
    { name: "RETRO_TALKER",  xp: 2300,  rank: "Silver" as Rank,   flag: "🇵🇭", streak: 9,  avatar: "🎮",   me: false },
    { name: "LANG_ROOKIE",   xp: 800,   rank: "Bronze" as Rank,   flag: "🇵🇭", streak: 3,  avatar: "🌱",   me: false },
  ];
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <Page maxWidth={720}>
      <PageHeader title="Leaderboard" subtitle="Global ranking by total XP earned" />

      <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 12, marginBottom: 32 }}>
        {[players[1], players[0], players[2]].map((p, i) => {
          const orderIdx = [1, 0, 2];
          const heights  = [120, 150, 96];
          const ri = orderIdx[i];
          return (
            <div key={p.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1, maxWidth: 140 }}>
              <span style={{ fontSize: 20 }}>{medals[ri]}</span>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.06)", border: `2px solid ${RANKS[p.rank].color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{p.avatar}</div>
              <span style={{ ...ui, fontSize: 11, fontWeight: 700, color: "#f0eaff", textAlign: "center" }}>{p.name}</span>
              <div style={{ width: "100%", height: heights[i], borderRadius: "10px 10px 0 0", background: RANKS[p.rank].bg, border: `1px solid ${RANKS[p.rank].color}44`, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 10 }}>
                <span style={{ ...mono, fontSize: 11, color: RANKS[p.rank].color }}>{(p.xp / 1000).toFixed(1)}k</span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 4, marginBottom: 16, width: "fit-content" }}>
        {(["Global", "Language", "Weekly"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: "8px 20px", borderRadius: 9, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, transition: "all 0.15s", background: tab === t ? "#9b5de5" : "transparent", color: tab === t ? "#fff" : "#8878a8", boxShadow: tab === t ? "0 0 12px rgba(155,93,229,0.4)" : "none", ...ui }}
          >{t}</button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {players.map((p, i) => (
          <Card key={p.name} style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 14, ...(p.me ? { border: "1px solid rgba(155,93,229,0.4)", background: "rgba(155,93,229,0.07)" } : {}) }}>
            <div style={{ width: 24, textAlign: "center", flexShrink: 0 }}>
              {i < 3 ? <span style={{ fontSize: 18 }}>{medals[i]}</span> : <span style={{ ...mono, fontSize: 12, color: "#8878a8" }}>{i + 1}</span>}
            </div>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: `1.5px solid ${RANKS[p.rank].color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{p.avatar}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ ...ui, fontSize: 13, fontWeight: 700, color: p.me ? "#c4a0f5" : "#f0eaff" }}>{p.name}</span>
                <span>{p.flag}</span>
                {p.me && <span style={{ ...pixel, fontSize: 6, color: "#9b5de5", background: "rgba(155,93,229,0.15)", border: "1px solid rgba(155,93,229,0.3)", padding: "3px 6px", borderRadius: 4 }}>YOU</span>}
              </div>
              <span style={{ ...ui, fontSize: 11, color: "#8878a8" }}>{p.xp.toLocaleString()} XP · {p.streak}🔥</span>
            </div>
            <RankBadge rank={p.rank} size={28} />
          </Card>
        ))}
      </div>
    </Page>
  );
}

// ─── Screen: Achievements ─────────────────────────────────────────────────────

function AchievementsScreen() {
  const items = [
    { icon: "🏆", title: "First Blood",   desc: "Complete your first translation", done: true,  color: "#d4a017" },
    { icon: "🔥", title: "Hot Streak",    desc: "Maintain a 7-day streak",         done: true,  color: "#e0763a" },
    { icon: "💠", title: "Diamond Quest", desc: "Reach Diamond rank",              done: false, color: "#9b5de5" },
    { icon: "🌍", title: "Polyglot",      desc: "Start learning 5 dialects",       done: false, color: "#2ec4c4" },
    { icon: "⚡", title: "Speed Demon",   desc: "100 translations in one day",     done: false, color: "#e05a84" },
    { icon: "🎯", title: "Perfect Score", desc: "Score 100 on any evaluation",     done: true,  color: "#4caf7d" },
    { icon: "👑", title: "Top Rank",      desc: "Reach #1 on the leaderboard",     done: false, color: "#d4a017" },
    { icon: "📚", title: "Bookworm",      desc: "Learn 500 phrases",               done: true,  color: "#9b5de5" },
  ];

  return (
    <Page>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <h1 style={{ ...ui, fontSize: 28, fontWeight: 800, color: "#f0eaff", margin: 0 }}>Achievements</h1>
          <p style={{ ...ui, fontSize: 14, color: "#8878a8", margin: "6px 0 0" }}>{items.filter((a) => a.done).length} of {items.length} unlocked</p>
        </div>
      </div>

      <Card style={{ padding: 24, marginBottom: 28 }}>
        <div style={{ ...ui, fontSize: 13, fontWeight: 700, color: "#f0eaff", marginBottom: 16 }}>Rank Milestones</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {(Object.keys(RANKS) as Rank[]).map((r, i) => (
            <div key={r} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <RankBadge rank={r} size={36} />
                <span style={{ ...ui, fontSize: 11, fontWeight: 600, color: RANKS[r].color }}>{r}</span>
                <span style={{ ...mono, fontSize: 9, color: "#8878a8" }}>{RANKS[r].min / 1000}k XP</span>
              </div>
              {i < 4 && <div style={{ width: 32, height: 1, background: "rgba(255,255,255,0.1)", margin: "0 8px 20px" }} />}
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {items.map((a) => (
          <Card key={a.title} style={{ padding: 20, opacity: a.done ? 1 : 0.45, border: a.done ? `1px solid ${a.color}33` : "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>{a.icon}</div>
            <div style={{ ...ui, fontSize: 13, fontWeight: 700, color: a.done ? a.color : "#8878a8", marginBottom: 4 }}>{a.title}</div>
            <p style={{ ...ui, fontSize: 11, color: "#8878a8", lineHeight: 1.5, margin: 0 }}>{a.desc}</p>
            {a.done && <div style={{ ...ui, fontSize: 10, color: "#4caf7d", fontWeight: 600, marginTop: 10 }}>✓ Unlocked</div>}
          </Card>
        ))}
      </div>
    </Page>
  );
}

// ─── Screen: Daily ────────────────────────────────────────────────────────────

function DailyScreen() {
  const navigate = useNavigate();
  const onNav = (s: Screen) => navigate(`/${s}`);
  const quests = [
    { title: "Translation Sprint", desc: "Translate 10 phrases in 5 minutes", xp: 200, color: "#e05a84", icon: "⚡", done: false },
    { title: "Accent Master",      desc: "Score 90+ on pronunciation",         xp: 150, color: "#2ec4c4", icon: "🎤", done: true  },
    { title: "Vocab Blitz",        desc: "Learn 20 new words today",           xp: 100, color: "#4caf7d", icon: "📖", done: false },
    { title: "Community Share",    desc: "Contribute 5 voice recordings",      xp: 75,  color: "#9b5de5", icon: "🤝", done: false },
  ];

  return (
    <Page maxWidth={720}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 20, alignItems: "start", marginBottom: 32 }}>
        <div>
          <h1 style={{ ...ui, fontSize: 28, fontWeight: 800, color: "#f0eaff", margin: 0 }}>Daily Quests</h1>
          <p style={{ ...ui, fontSize: 14, color: "#8878a8", margin: "6px 0 0" }}>Complete all 4 for a bonus XP reward</p>
        </div>
        <Card style={{ padding: "14px 20px", textAlign: "center" }}>
          <div style={{ ...ui, fontSize: 11, color: "#8878a8", marginBottom: 4 }}>Resets in</div>
          <div style={{ ...mono, fontSize: 20, color: "#2ec4c4", fontWeight: 700, letterSpacing: 2 }}>14:23:07</div>
          <div style={{ display: "flex", gap: 4, justifyContent: "center", marginTop: 8 }}>
            {quests.map((q, i) => <div key={i} style={{ width: 20, height: 4, borderRadius: 2, background: q.done ? "#9b5de5" : "rgba(255,255,255,0.1)" }} />)}
          </div>
          <div style={{ ...ui, fontSize: 11, color: "#8878a8", marginTop: 4 }}>{quests.filter((q) => q.done).length}/{quests.length} done</div>
        </Card>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {quests.map((q) => (
          <Card key={q.title} style={{ padding: 20, border: q.done ? "1px solid rgba(76,175,125,0.25)" : `1px solid ${q.color}18` }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${q.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{q.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <span style={{ ...ui, fontSize: 15, fontWeight: 700, color: q.done ? "#8878a8" : "#f0eaff" }}>{q.title}</span>
                  {q.done && <span style={{ ...ui, fontSize: 11, fontWeight: 600, color: "#4caf7d", background: "rgba(76,175,125,0.12)", border: "1px solid rgba(76,175,125,0.25)", padding: "2px 8px", borderRadius: 50 }}>Done ✓</span>}
                </div>
                <p style={{ ...ui, fontSize: 13, color: "#8878a8", margin: 0 }}>{q.desc}</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
                <span style={{ ...ui, fontSize: 13, fontWeight: 700, color: "#d4a017" }}>+{q.xp} XP</span>
                {!q.done && <Btn color={q.color} size="sm" onClick={() => onNav("mission")}>Start →</Btn>}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Page>
  );
}

// ─── Screen: Profile ──────────────────────────────────────────────────────────

function ProfileScreen({ xp, rank }: { xp: number; rank: Rank }) {
  const cfg = RANKS[rank];
  const pct = Math.min(100, ((xp - cfg.min) / (cfg.max - cfg.min)) * 100);
  const rankKeys = Object.keys(RANKS) as Rank[];
  const nextRank = rankKeys[Math.min(rankKeys.indexOf(rank) + 1, rankKeys.length - 1)];

  const stats = [
    { val: "1,247", label: "Translations", color: "#2ec4c4" },
    { val: "4",     label: "Dialects",     color: "#9b5de5"  },
    { val: "7",     label: "Day Streak",   color: "#e0763a"  },
    { val: "82%",   label: "Accuracy",     color: "#4caf7d"  },
  ];
  const badges = [
    { icon: "🎯", label: "Sharpshooter", earned: true  },
    { icon: "🔥", label: "On Fire",      earned: true  },
    { icon: "⚡", label: "Speedster",    earned: true  },
    { icon: "🌟", label: "All-Star",     earned: true  },
    { icon: "🏆", label: "Champion",     earned: false },
    { icon: "💬", label: "Chatterbox",   earned: false },
  ];

  return (
    <Page>
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 24, marginBottom: 24 }}>
        <Card style={{ padding: 28 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center" }}>
            <div style={{ position: "relative" }}>
              <div style={{ width: 72, height: 72, borderRadius: 18, background: "linear-gradient(135deg, #3b1d72, #1e0f3a)", border: `2.5px solid ${cfg.color}66`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34 }}>🧑‍💻</div>
              <div style={{ position: "absolute", bottom: -4, right: -4 }}><RankBadge rank={rank} size={24} /></div>
            </div>
            <div>
              <div style={{ ...ui, fontSize: 18, fontWeight: 800, color: "#f0eaff" }}>PLAYER_ONE</div>
              <div style={{ ...ui, fontSize: 12, color: "#8878a8", marginTop: 2 }}>Joined June 2024 · #00142</div>
              <span style={{ ...pixel, fontSize: 7, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}44`, padding: "4px 8px", borderRadius: 6, display: "inline-block", marginTop: 8 }}>{rank} Rank</span>
            </div>
            <div style={{ width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ ...ui, fontSize: 11, color: "#8878a8" }}>→ {nextRank}</span>
                <span style={{ ...mono, fontSize: 10, color: cfg.color }}>{xp.toLocaleString()} XP</span>
              </div>
              <ProgressBar pct={pct} color={cfg.color} height={7} />
              <div style={{ ...ui, fontSize: 11, color: "#8878a8", marginTop: 4, textAlign: "right" }}>{(cfg.max - xp).toLocaleString()} XP to go</div>
            </div>
          </div>
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
            {stats.map((s) => (
              <Card key={s.label} style={{ padding: "16px 18px" }}>
                <div style={{ ...mono, fontSize: 22, color: s.color, fontWeight: 700 }}>{s.val}</div>
                <div style={{ ...ui, fontSize: 11, color: "#8878a8", marginTop: 4 }}>{s.label}</div>
              </Card>
            ))}
          </div>
          <Card style={{ padding: 20, flex: 1 }}>
            <div style={{ ...ui, fontSize: 13, fontWeight: 700, color: "#f0eaff", marginBottom: 14 }}>Badges</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {badges.map((b) => (
                <div key={b.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "12px 8px", borderRadius: 10, background: "rgba(255,255,255,0.04)", opacity: b.earned ? 1 : 0.3 }}>
                  <span style={{ fontSize: 22 }}>{b.icon}</span>
                  <span style={{ ...ui, fontSize: 10, color: "#8878a8", textAlign: "center" }}>{b.label}</span>
                  {b.earned && <span style={{ ...ui, fontSize: 9, color: "#4caf7d" }}>Unlocked</span>}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </Page>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [xp, setXP] = useState(4750);
  const rank = getRank(xp);
  const { pathname } = useLocation();
  const isLogin = pathname === "/" || pathname === "/login";

  return (
    <div style={{ ...ui, background: "#0e0a1c", minHeight: "100vh", color: "#f0eaff" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, background: "radial-gradient(ellipse at 15% 0%, rgba(155,93,229,0.08) 0%, transparent 45%), radial-gradient(ellipse at 85% 100%, rgba(46,196,196,0.06) 0%, transparent 45%)" }} />
      {!isLogin && <Navbar xp={xp} rank={rank} />}
      <div style={{ position: "relative", zIndex: 1 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login"        element={<LoginScreen />} />
          <Route path="/home"         element={<HomeScreen xp={xp} rank={rank} />} />
          <Route path="/play"         element={<PlayScreen />} />
          <Route path="/mission"      element={<MissionScreen />} />
          <Route path="/recording"    element={<RecordingScreen />} />
          <Route path="/evaluation"   element={<EvaluationScreen onXP={(n) => setXP((p) => p + n)} />} />
          <Route path="/leaderboard"  element={<LeaderboardScreen />} />
          <Route path="/achievements" element={<AchievementsScreen />} />
          <Route path="/daily"        element={<DailyScreen />} />
          <Route path="/profile"      element={<ProfileScreen xp={xp} rank={rank} />} />
          <Route path="*"             element={<Navigate to="/home" replace />} />
        </Routes>
      </div>
      <style>{`
        * { box-sizing: border-box; scrollbar-width: none; }
        *::-webkit-scrollbar { display: none; }
        select option { background: #1e1438; color: #f0eaff; }
        @keyframes coinFly { 0% { transform: translateY(0) scale(1); opacity: 1; } 100% { transform: translateY(-140px) scale(1.3); opacity: 0; } }
      `}</style>
    </div>
  );
}
