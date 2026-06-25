import { useState, useEffect, useRef } from "react";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router";
import { supabase } from "../lib/supabase";

type Screen = "login" | "home" | "play" | "mission" | "recording" | "evaluation" | "leaderboard" | "profile" | "achievements" | "daily";
type Rank = "Nuno" | "Tikbalang" | "Manananggal" | "Aswang" | "Sirena";

const RANKS: Record<Rank, { color: string; glow: string; bg: string; min: number; max: number; creature: string; tier: string }> = {
  Nuno:        { color: "#cd7f32", glow: "0 0 14px #cd7f3255", bg: "rgba(205,127,50,0.12)",  min: 0,     max: 1000,  creature: "🍄", tier: "Bronze" },
  Tikbalang:   { color: "#b0c4de", glow: "0 0 14px #b0c4de55", bg: "rgba(176,196,222,0.12)", min: 1000,  max: 3000,  creature: "🐴", tier: "Silver" },
  Manananggal: { color: "#ffd700", glow: "0 0 14px #ffd70055", bg: "rgba(255,215,0,0.12)",   min: 3000,  max: 6000,  creature: "🦇", tier: "Gold" },
  Aswang:      { color: "#ff1a1a", glow: "0 0 14px #ff1a1a55", bg: "rgba(255,26,26,0.12)",   min: 6000,  max: 10000, creature: "👁️", tier: "Platinum" },
  Sirena:      { color: "#4fc3f7", glow: "0 0 14px #4fc3f755", bg: "rgba(79,195,247,0.12)",  min: 10000, max: 15000, creature: "🧜‍♀️", tier: "Diamond" },
};

function getRank(xp: number): Rank {
  if (xp < 1000) return "Nuno";
  if (xp < 3000) return "Tikbalang";
  if (xp < 6000) return "Manananggal";
  if (xp < 10000) return "Aswang";
  return "Sirena";
}

// ─── STRONG Black & Red palette ───────────────────────────────────────────────
const C = {
  bg: "#0a0a0a",
  surface: "#131313",
  surfaceHover: "#1e1212",
  border: "rgba(255,26,26,0.18)",
  borderHover: "rgba(255,26,26,0.45)",
  borderStrong: "rgba(255,26,26,0.6)",
  text: "#f5eded",
  textMuted: "#9e7070",
  red: "#ff1a1a",
  redLight: "#ff5252",
  redDark: "#cc0000",
  redGlow: "0 0 20px rgba(255,26,26,0.4)",
  gold: "#ffd700",
  green: "#4caf7d",
  cyan: "#4fc3f7",
  orange: "#ff8c42",
};

const ui: React.CSSProperties = { fontFamily: "'Inter', sans-serif" };
const mono: React.CSSProperties = { fontFamily: "'Space Mono', monospace" };
const pixel: React.CSSProperties = { fontFamily: "'Press Start 2P', monospace" };

// ─── Shared Components ────────────────────────────────────────────────────────

function RankBadge({ rank, size = 32 }: { rank: Rank; size?: number }) {
  const { color, bg, glow, creature } = RANKS[rank];
  return (
    <span title={rank} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: size, height: size, borderRadius: "50%", background: bg, border: `2px solid ${color}66`, fontSize: size * 0.44, flexShrink: 0, boxShadow: glow, animation: "float 3s ease-in-out infinite" }}>
      {creature}
    </span>
  );
}

function ProgressBar({ pct, color, height = 7 }: { pct: number; color: string; height?: number }) {
  return (
    <div style={{ height, width: "100%", background: "rgba(255,255,255,0.06)", borderRadius: height, overflow: "hidden", border: `1px solid rgba(255,26,26,0.08)` }}>
      <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: `linear-gradient(90deg, ${color}, ${color}bb)`, borderRadius: height, boxShadow: `0 0 12px ${color}55, inset 0 1px 0 rgba(255,255,255,0.2)`, transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)" }} />
    </div>
  );
}

function Card({ children, style = {}, onClick, glowColor }: { children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void; glowColor?: string }) {
  const [hovered, setHovered] = useState(false);
  const gc = glowColor || C.red;
  return (
    <div onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? C.surfaceHover : C.surface,
        border: `1.5px solid ${hovered ? C.borderHover : C.border}`,
        borderRadius: 16,
        boxShadow: hovered ? `0 0 24px ${gc}22, 0 8px 24px rgba(0,0,0,0.4)` : "0 2px 8px rgba(0,0,0,0.2)",
        transform: hovered && onClick ? "translateY(-3px) scale(1.01)" : "translateY(0) scale(1)",
        transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >{children}</div>
  );
}

function Btn({ children, color = C.red, onClick, full = false, variant = "solid", size = "md", disabled = false }: {
  children: React.ReactNode; color?: string; onClick?: () => void; full?: boolean;
  variant?: "solid" | "outline" | "ghost"; size?: "sm" | "md" | "lg"; disabled?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const pad = { sm: "8px 16px", md: "11px 24px", lg: "14px 34px" };
  const fs = { sm: 12, md: 13, lg: 15 };
  const bg = variant === "solid" ? (disabled ? "rgba(255,26,26,0.12)" : color) : "transparent";
  const border = variant === "outline" ? `2px solid ${color}` : "2px solid transparent";
  const textColor = variant === "solid" ? (disabled ? "#6b3333" : "#fff") : color;
  const shadow = variant === "solid" && !disabled ? `0 4px 16px ${color}55, 0 0 24px ${color}22` : "none";
  const hoverShadow = variant === "solid" && !disabled ? `0 6px 24px ${color}66, 0 0 36px ${color}33` : variant === "outline" ? `0 0 16px ${color}33` : "none";
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ ...ui, fontWeight: 800, fontSize: fs[size], background: bg, border, color: textColor, borderRadius: 12, padding: pad[size], cursor: disabled ? "not-allowed" : "pointer", width: full ? "100%" : undefined, boxShadow: hovered ? hoverShadow : shadow, transform: hovered && !disabled ? "translateY(-2px) scale(1.03)" : "none", transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)", letterSpacing: "0.02em" }}
    >{children}</button>
  );
}

function Input({ label, type = "text", value, onChange, placeholder }: { label?: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      {label && <div style={{ ...ui, fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>{label}</div>}
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ ...ui, width: "100%", background: "rgba(255,26,26,0.03)", border: `2px solid ${focused ? C.red + "77" : C.border}`, borderRadius: 12, padding: "12px 16px", color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box", boxShadow: focused ? `0 0 16px ${C.red}33, inset 0 0 8px ${C.red}11` : "none", transition: "all 0.2s ease" }}
      />
    </div>
  );
}

function PasswordInput({ label, value, onChange, placeholder }: { label?: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);
  return (
    <div>
      {label && <div style={{ ...ui, fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>{label}</div>}
      <div style={{ position: "relative" }}>
        <input type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ ...ui, width: "100%", background: "rgba(255,26,26,0.03)", border: `2px solid ${focused ? C.red + "77" : C.border}`, borderRadius: 12, padding: "12px 44px 12px 16px", color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box", boxShadow: focused ? `0 0 16px ${C.red}33, inset 0 0 8px ${C.red}11` : "none", transition: "all 0.2s ease" }}
        />
        <button type="button" onClick={() => setShow((s) => !s)}
          style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: show ? C.red : C.textMuted, fontSize: 15, padding: 2, lineHeight: 1, transition: "color 0.2s" }}>
          {show ? "👁" : "👁‍🗨"}
        </button>
      </div>
    </div>
  );
}

function SectionTitle({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, ...style }}>
      <div style={{ width: 4, height: 18, borderRadius: 2, background: C.red, boxShadow: `0 0 8px ${C.red}66` }} />
      <h2 style={{ ...pixel, fontSize: 10, fontWeight: 700, color: C.text, margin: 0, letterSpacing: "0.05em" }}>{children}</h2>
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

const NAV_ITEMS: { label: string; icon: string; screen: Screen }[] = [
  { label: "Home",         icon: "⌂",  screen: "home" },
  { label: "Play",         icon: "▶",  screen: "play" },
  { label: "Leaderboard",  icon: "★",  screen: "leaderboard" },
  { label: "Daily",        icon: "⚡", screen: "daily" },
  { label: "Achievements", icon: "🏆", screen: "achievements" },
  { label: "Profile",      icon: "◉",  screen: "profile" },
];

function NavButton({ label, icon, active, onClick }: { label: string; icon: string; active: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button onClick={onClick} title={label}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 50, border: "none", background: active ? C.red : hovered ? "rgba(255,26,26,0.15)" : "transparent", color: active ? "#fff" : hovered ? C.text : C.textMuted, cursor: "pointer", fontSize: 12, fontWeight: 700, transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)", boxShadow: active ? `0 0 16px ${C.red}55, 0 2px 8px ${C.red}33` : "none", transform: hovered && !active ? "scale(1.08)" : active ? "scale(1)" : "scale(1)", ...ui }}
    >
      <span style={{ fontSize: 14, lineHeight: 1 }}>{icon}</span>
      <span style={{ fontSize: 12 }}>{label}</span>
    </button>
  );
}

function Navbar({ xp, rank }: { xp: number; rank: Rank }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const screen = pathname.replace("/", "") || "home";
  return (
    <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(10,10,10,0.94)", backdropFilter: "blur(20px)", borderBottom: `2px solid ${C.border}` }}>
      <button onClick={() => navigate("/home")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, boxShadow: C.redGlow, animation: "pulse 2s ease-in-out infinite" }}>🌊</div>
        <span style={{ ...pixel, fontSize: 10, color: C.text, letterSpacing: 1 }}>SI<span style={{ color: C.red, textShadow: `0 0 10px ${C.red}88` }}>RENE</span></span>
      </button>

      <nav style={{ display: "flex", alignItems: "center", gap: 2, background: "rgba(255,26,26,0.04)", border: `1.5px solid ${C.border}`, borderRadius: 50, padding: "4px" }}>
        {NAV_ITEMS.map(({ label, icon, screen: s }) => (
          <NavButton key={s} label={label} icon={icon} active={screen === s} onClick={() => navigate(`/${s}`)} />
        ))}
      </nav>

      <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,26,26,0.04)", border: `1.5px solid ${C.border}`, borderRadius: 50, padding: "5px 14px 5px 6px", cursor: "pointer", transition: "all 0.2s" }} onClick={() => navigate("/profile")}>
        <RankBadge rank={rank} size={28} />
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ ...ui, fontSize: 11, fontWeight: 800, color: C.text }}>PLAYER_ONE</div>
          <div style={{ ...mono, fontSize: 9, color: RANKS[rank].color, textShadow: `0 0 6px ${RANKS[rank].color}44` }}>{xp.toLocaleString()} XP</div>
        </div>
      </div>
    </header>
  );
}

function Page({ children, maxWidth = 860 }: { children: React.ReactNode; maxWidth?: number }) {
  return <main style={{ minHeight: "100vh", paddingTop: 80 }}><div style={{ maxWidth, margin: "0 auto", padding: "40px 24px 60px" }}>{children}</div></main>;
}

function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h1 style={{ ...ui, fontSize: 28, fontWeight: 900, color: C.text, margin: 0 }}>{title}</h1>
      {subtitle && <p style={{ ...ui, fontSize: 13, color: C.textMuted, margin: "6px 0 0" }}>{subtitle}</p>}
    </div>
  );
}

// ─── Screen: Login ────────────────────────────────────────────────────────────

const LANGUAGES = ["Cebuano", "Ilocano", "Hiligaynon", "Waray", "Kapampangan", "Pangasinan", "Tagalog", "English", "Other"];

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <div style={{ ...ui, fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>{label}</div>
      <div style={{ position: "relative" }}>
        <select value={value} onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ ...ui, width: "100%", background: "rgba(255,26,26,0.03)", border: `2px solid ${focused ? C.red + "77" : C.border}`, borderRadius: 12, padding: "12px 36px 12px 16px", color: value ? C.text : C.textMuted, fontSize: 14, outline: "none", cursor: "pointer", appearance: "none", boxSizing: "border-box", boxShadow: focused ? `0 0 16px ${C.red}33` : "none", transition: "all 0.2s ease" }}>
          <option value="">Select…</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: C.textMuted, pointerEvents: "none", fontSize: 11 }}>▾</span>
      </div>
    </div>
  );
}

function LoginScreen() {
  const navigate = useNavigate();
  const [mode, setMode]                 = useState<"login" | "signup">("login");
  const [email, setEmail]               = useState("");
  const [pw, setPw]                     = useState("");
  const [confirmPw, setConfirmPw]       = useState("");
  const [username, setUsername]         = useState("");
  const [age, setAge]                   = useState("");
  const [sex, setSex]                   = useState("");
  const [motherTongue, setMotherTongue] = useState("");
  const [error, setError]               = useState("");
  const [loading, setLoading]           = useState(false);

  const handleLogin = async () => {
    setError(""); setLoading(true);
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password: pw });
    setLoading(false);
    if (err) { setError(err.message); return; }
    console.log("[SIRENE] JWT Access Token:",  data.session?.access_token);
    console.log("[SIRENE] JWT Refresh Token:", data.session?.refresh_token);
    console.log("[SIRENE] User:", data.session?.user);
    navigate("/home");
  };

  const handleSignup = async () => {
    if (!username || !age || !sex || !motherTongue) { setError("Please fill in all fields."); return; }
    if (pw !== confirmPw) { setError("Passwords do not match."); return; }
    setError(""); setLoading(true);
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password: pw,
      options: { data: { username, age: Number(age), sex, mother_tongue: motherTongue } },
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    if (data.session) {
      console.log("[SIRENE] JWT Access Token:",  data.session.access_token);
      console.log("[SIRENE] JWT Refresh Token:", data.session.refresh_token);
      console.log("[SIRENE] User:", data.session.user);
    } else {
      console.log("[SIRENE] Signed up — check email for confirmation.", data.user);
    }
    navigate("/home");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", position: "relative", overflow: "hidden" }}>
      {/* Animated red particles */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "15%", left: "20%", width: 6, height: 6, borderRadius: "50%", background: C.red, opacity: 0.3, animation: "float 4s ease-in-out infinite" }} />
        <div style={{ position: "absolute", top: "60%", right: "15%", width: 4, height: 4, borderRadius: "50%", background: C.red, opacity: 0.2, animation: "float 5s ease-in-out infinite 1s" }} />
        <div style={{ position: "absolute", bottom: "25%", left: "10%", width: 8, height: 8, borderRadius: "50%", background: C.red, opacity: 0.15, animation: "float 6s ease-in-out infinite 2s" }} />
        <div style={{ position: "absolute", top: "30%", right: "25%", width: 5, height: 5, borderRadius: "50%", background: C.redLight, opacity: 0.2, animation: "float 4.5s ease-in-out infinite 0.5s" }} />
      </div>

      <div style={{ textAlign: "center", marginBottom: 36, animation: "slideDown 0.6s ease-out" }}>
        <div style={{ width: 80, height: 80, borderRadius: 20, margin: "0 auto 20px", background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38, boxShadow: `0 0 40px ${C.red}55, 0 0 80px ${C.red}22`, animation: "pulse 2.5s ease-in-out infinite" }}>🌊</div>
        <h1 style={{ ...pixel, fontSize: 18, color: C.text, letterSpacing: 3, margin: 0 }}>
          SI<span style={{ color: C.red, textShadow: `0 0 14px ${C.red}99` }}>RENE</span>
        </h1>
        <p style={{ ...ui, fontSize: 13, color: C.textMuted, marginTop: 10, maxWidth: 280, margin: "10px auto 0" }}>Master Philippine languages. Rise through mythical ranks. 🇵🇭</p>
      </div>

      <div style={{ width: "100%", maxWidth: 380, animation: "slideUp 0.6s ease-out 0.2s both" }}>
        <div style={{ display: "flex", background: "rgba(255,26,26,0.05)", border: `2px solid ${C.border}`, borderRadius: 14, padding: 4, marginBottom: 20 }}>
          {(["login", "signup"] as const).map((m) => (
            <button key={m} onClick={() => { setMode(m); setError(""); }}
              style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", cursor: "pointer", background: mode === m ? C.red : "transparent", color: mode === m ? "#fff" : C.textMuted, fontWeight: 800, fontSize: 13, transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)", boxShadow: mode === m ? `0 0 14px ${C.red}55` : "none", transform: mode === m ? "scale(1.02)" : "scale(1)", ...ui }}
            >{m === "login" ? "⚔️ Log In" : "🛡️ Sign Up"}</button>
          ))}
        </div>

        <Card style={{ padding: 28 }} glowColor={C.red}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {mode === "signup" && (
              <>
                <Input label="Username" value={username} onChange={setUsername} placeholder="PixelMaster42" />
                <Input label="Age" type="number" value={age} onChange={setAge} placeholder="18" />
                <Select label="Sex" value={sex} onChange={setSex} options={["Male", "Female", "Non-binary", "Prefer not to say"]} />
                <Select label="Mother Tongue" value={motherTongue} onChange={setMotherTongue} options={LANGUAGES} />
              </>
            )}
            <Input label="Email" value={email} onChange={setEmail} placeholder="player@sirene.ph" />
            <PasswordInput label="Password" value={pw} onChange={setPw} placeholder="••••••••" />
            {mode === "signup" && (
              <PasswordInput label="Repeat Password" value={confirmPw} onChange={setConfirmPw} placeholder="••••••••" />
            )}

            {error && (
              <div style={{ ...ui, fontSize: 12, color: C.redLight, background: "rgba(255,26,26,0.08)", border: `1.5px solid ${C.red}44`, borderRadius: 10, padding: "10px 14px" }}>
                {error}
              </div>
            )}

            <Btn color={C.red} onClick={mode === "login" ? handleLogin : handleSignup} full size="lg" disabled={loading}>
              {loading ? "Please wait…" : mode === "login" ? "▶  Start Playing" : "★  Create Account"}
            </Btn>
            {mode === "login" && (
              <p style={{ ...ui, fontSize: 12, color: C.textMuted, textAlign: "center", margin: 0 }}>
                Forgot password? <span style={{ color: C.red, cursor: "pointer", fontWeight: 600 }}>Reset it</span>
              </p>
            )}
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
    { name: "Bisaya",      level: "Intermediate", pct: 68, color: C.red },
    { name: "Cebuano",     level: "Advanced",     pct: 85, color: C.cyan },
    { name: "Kapampangan", level: "Beginner",     pct: 24, color: C.gold },
    { name: "Ilocano",     level: "Beginner",     pct: 10, color: C.orange },
  ];

  return (
    <Page>
      {/* Hero profile card */}
      <Card style={{ padding: "22px 26px", marginBottom: 28, borderLeft: `4px solid ${C.red}` }} glowColor={cfg.color}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg, #1a0808, ${C.surface})`, border: `2px solid ${cfg.color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, boxShadow: cfg.glow }}>🧑‍💻</div>
            <div style={{ position: "absolute", bottom: -5, right: -5 }}><RankBadge rank={rank} size={22} /></div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span style={{ ...ui, fontSize: 16, fontWeight: 900, color: C.text }}>PLAYER_ONE</span>
              <span style={{ ...pixel, fontSize: 7, color: cfg.color, background: cfg.bg, border: `1.5px solid ${cfg.color}44`, padding: "3px 8px", borderRadius: 6, boxShadow: `0 0 6px ${cfg.color}22` }}>{rank}</span>
              <span style={{ ...ui, fontSize: 12, color: C.orange, animation: "wiggle 2s ease-in-out infinite" }}>🔥 7-day streak</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1 }}><ProgressBar pct={pct} color={cfg.color} /></div>
              <span style={{ ...mono, fontSize: 10, color: C.textMuted, flexShrink: 0 }}>{xp.toLocaleString()} / {cfg.max.toLocaleString()} XP · {(cfg.max - xp).toLocaleString()} to {nextRank}</span>
            </div>
          </div>
          <Btn color={C.red} onClick={() => onNav("play")} size="md">▶ Play Now</Btn>
        </div>
      </Card>

      {/* Languages */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <SectionTitle>Your Languages</SectionTitle>
          <button onClick={() => onNav("play")} style={{ ...ui, fontSize: 12, color: C.red, background: "none", border: "none", cursor: "pointer", fontWeight: 700, textShadow: `0 0 8px ${C.red}33` }}>+ Add language</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {langs.map((l, i) => (
            <Card key={l.name} style={{ padding: 16, animation: `slideUp 0.4s ease-out ${i * 0.1}s both` }} onClick={() => onNav("mission")} glowColor={l.color}>
              <div style={{ marginBottom: 10 }}>
                <div style={{ ...ui, fontSize: 14, fontWeight: 800, color: C.text }}>{l.name}</div>
                <div style={{ ...ui, fontSize: 11, color: C.textMuted, marginTop: 2 }}>{l.level}</div>
              </div>
              <ProgressBar pct={l.pct} color={l.color} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                <span style={{ ...mono, fontSize: 11, color: C.textMuted }}>{l.pct}%</span>
                <span style={{ ...ui, fontSize: 11, color: l.color, fontWeight: 700 }}>Practice →</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Explore */}
      <SectionTitle style={{ marginBottom: 14 }}>Explore</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {[
          { label: "Daily Quest",  icon: "⚡", sub: "4 quests available",  color: C.red, screen: "daily" as Screen },
          { label: "Leaderboard",  icon: "★",  sub: "You are ranked #142", color: C.gold, screen: "leaderboard" as Screen },
          { label: "Achievements", icon: "🏆", sub: "4 of 8 unlocked",    color: C.green, screen: "achievements" as Screen },
        ].map((a, i) => (
          <Card key={a.label} style={{ padding: 20, animation: `slideUp 0.4s ease-out ${(i + 4) * 0.1}s both` }} onClick={() => onNav(a.screen)} glowColor={a.color}>
            <div style={{ fontSize: 28, marginBottom: 8, animation: "bounce 2s ease-in-out infinite", animationDelay: `${i * 0.3}s` }}>{a.icon}</div>
            <div style={{ ...ui, fontSize: 14, fontWeight: 800, color: C.text }}>{a.label}</div>
            <div style={{ ...ui, fontSize: 12, color: C.textMuted, marginTop: 3 }}>{a.sub}</div>
            <div style={{ ...ui, fontSize: 12, color: a.color, marginTop: 10, fontWeight: 700 }}>View →</div>
          </Card>
        ))}
      </div>
    </Page>
  );
}

// ─── Screen: Play ─────────────────────────────────────────────────────────────

const SOURCE_PHRASES: Record<string, string[]> = {
  English: ["Have you eaten yet?", "Good morning, how are you?", "Where are you going?", "I am happy to see you.", "What is your name?", "Thank you very much."],
  Tagalog: ["Kumain ka na ba?", "Magandang umaga, kumusta ka?", "Saan ka pupunta?", "Masaya akong makita ka.", "Ano ang pangalan mo?", "Maraming salamat."],
};

function PlayScreen() {
  const navigate = useNavigate();
  const onNav = (s: Screen) => navigate(`/${s}`);
  const [from, setFrom] = useState("English");
  const [to, setTo] = useState("Bisaya");
  const [diff, setDiff] = useState("Normal");
  const [phraseIdx, setPhraseIdx] = useState(0);

  const sources = ["English", "Tagalog"];
  const targets = ["Bisaya", "Cebuano", "Kapampangan", "Ilocano", "Waray", "Hiligaynon", "Bicolano", "Tagalog"];
  const diffs = [
    { label: "Easy",   color: C.green, icon: "🌱" },
    { label: "Normal", color: C.red, icon: "⚔️" },
    { label: "Hard",   color: C.gold, icon: "🔥" },
    { label: "Expert", color: "#ff1a1a", icon: "💀" },
  ];

  const phrases = SOURCE_PHRASES[from] ?? [];
  const activePhraseText = phrases[phraseIdx] ?? phrases[0];

  const selStyle: React.CSSProperties = {
    ...ui, width: "100%", background: "rgba(255,26,26,0.03)",
    border: `2px solid ${C.border}`, borderRadius: 12,
    padding: "12px 36px 12px 14px", color: C.text, fontSize: 14,
    outline: "none", cursor: "pointer", appearance: "none",
  };

  return (
    <Page maxWidth={660}>
      <PageHeader title="New Challenge" subtitle="Choose your language, pick a phrase, then battle! ⚔️" />

      <Card style={{ padding: 0, overflow: "hidden", marginBottom: 16, borderTop: `3px solid ${C.red}` }} glowColor={C.red}>
        <div style={{ padding: "24px 24px 20px", borderBottom: `1.5px solid ${C.border}`, background: "rgba(255,26,26,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.red, boxShadow: `0 0 8px ${C.red}88`, animation: "pulse 1.5s ease-in-out infinite" }} />
              <span style={{ ...pixel, fontSize: 8, color: C.textMuted, letterSpacing: "0.08em" }}>PHRASE TO TRANSLATE</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ ...mono, fontSize: 11, color: C.textMuted }}>{phraseIdx + 1}/{phrases.length}</span>
              <button onClick={() => setPhraseIdx((i) => (i + 1) % phrases.length)}
                style={{ background: "rgba(255,26,26,0.08)", border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "5px 12px", color: C.red, cursor: "pointer", fontSize: 11, fontWeight: 700, ...ui, transition: "all 0.15s" }}>Next ↻</button>
            </div>
          </div>
          <p style={{ ...ui, fontSize: 22, fontWeight: 900, color: C.text, margin: 0, lineHeight: 1.4 }}>"{activePhraseText}"</p>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14 }}>
            <span style={{ ...ui, fontSize: 12, color: C.textMuted }}>Speak this in</span>
            <span style={{ ...ui, fontSize: 12, fontWeight: 800, color: C.red, background: `rgba(255,26,26,0.12)`, border: `1.5px solid ${C.red}44`, borderRadius: 6, padding: "3px 10px" }}>{to}</span>
          </div>
        </div>

        <div style={{ padding: "22px 24px 26px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
            <div>
              <div style={{ ...ui, fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Source Language</div>
              <div style={{ position: "relative" }}>
                <select value={from} onChange={(e) => { setFrom(e.target.value); setPhraseIdx(0); }} style={selStyle}>{sources.map((l) => <option key={l}>{l}</option>)}</select>
                <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: C.textMuted, pointerEvents: "none", fontSize: 11 }}>▾</span>
              </div>
            </div>
            <div>
              <div style={{ ...ui, fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Target Dialect</div>
              <div style={{ position: "relative" }}>
                <select value={to} onChange={(e) => setTo(e.target.value)} style={selStyle}>{targets.map((l) => <option key={l}>{l}</option>)}</select>
                <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: C.textMuted, pointerEvents: "none", fontSize: 11 }}>▾</span>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 22 }}>
            <div style={{ ...ui, fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Difficulty</div>
            <div style={{ display: "flex", gap: 8 }}>
              {diffs.map((d) => (
                <button key={d.label} onClick={() => setDiff(d.label)}
                  style={{ flex: 1, padding: "10px 0", borderRadius: 10, cursor: "pointer", background: diff === d.label ? d.color : "rgba(255,255,255,0.03)", border: `2px solid ${diff === d.label ? d.color : "transparent"}`, color: diff === d.label ? "#fff" : C.textMuted, fontWeight: 800, fontSize: 12, transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)", boxShadow: diff === d.label ? `0 4px 14px ${d.color}44` : "none", transform: diff === d.label ? "scale(1.03)" : "scale(1)", ...ui }}
                >{d.icon} {d.label}</button>
              ))}
            </div>
          </div>
          <Btn color={C.red} onClick={() => onNav("mission")} full size="lg">⚔️  Start Challenge</Btn>
        </div>
      </Card>

      <div style={{ ...pixel, fontSize: 8, color: C.textMuted, letterSpacing: "0.08em", marginBottom: 10 }}>ALL PHRASES</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {phrases.map((p, i) => (
          <button key={i} onClick={() => setPhraseIdx(i)}
            style={{ ...ui, textAlign: "left", padding: "11px 14px", borderRadius: 10, border: `1.5px solid ${i === phraseIdx ? C.red + "55" : C.border}`, background: i === phraseIdx ? "rgba(255,26,26,0.06)" : "rgba(255,255,255,0.01)", cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 12, transform: i === phraseIdx ? "scale(1.01)" : "scale(1)" }}
          >
            <span style={{ ...mono, fontSize: 10, color: i === phraseIdx ? C.red : C.textMuted, width: 16, flexShrink: 0 }}>{i + 1}</span>
            <span style={{ ...ui, fontSize: 13, color: i === phraseIdx ? C.text : C.textMuted, fontWeight: i === phraseIdx ? 700 : 400 }}>{p}</span>
            {i === phraseIdx && <span style={{ marginLeft: "auto", fontSize: 11, color: C.red, fontWeight: 700 }}>●</span>}
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
    { src: "Kumain ka na ba?", tgt: "Nakakaon na ba ka?", rom: "Have you eaten yet?" },
    { src: "Asan ka na?", tgt: "Hain ka na?", rom: "Where are you now?" },
    { src: "Magandang umaga.", tgt: "Maayong buntag.", rom: "Good morning." },
  ];
  const p = phrases[idx];

  return (
    <Page maxWidth={660}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ ...ui, fontSize: 24, fontWeight: 900, color: C.text, margin: 0 }}>⚔️ Phrase Challenge</h1>
          <p style={{ ...ui, fontSize: 13, color: C.textMuted, margin: "4px 0 0" }}>Tagalog → Bisaya · Normal</p>
        </div>
        <span style={{ ...pixel, fontSize: 8, color: C.red, background: `rgba(255,26,26,0.1)`, border: `1.5px solid ${C.red}33`, padding: "6px 12px", borderRadius: 8, boxShadow: `0 0 8px ${C.red}22` }}>LVL 4-2</span>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ ...ui, fontSize: 12, color: C.textMuted }}>Phrase {idx + 1} of {phrases.length}</span>
          <span style={{ ...mono, fontSize: 12, color: C.red }}>{Math.round((idx / phrases.length) * 100)}%</span>
        </div>
        <ProgressBar pct={(idx / phrases.length) * 100} color={C.red} height={8} />
      </div>

      <Card style={{ padding: 28, marginBottom: 18, borderLeft: `4px solid ${C.red}` }} glowColor={C.red}>
        <div style={{ ...pixel, fontSize: 8, color: C.textMuted, letterSpacing: "0.08em", marginBottom: 12 }}>TRANSLATE THIS</div>
        <p style={{ ...ui, fontSize: 22, fontWeight: 800, color: C.text, lineHeight: 1.5, marginBottom: 22 }}>"{p.src}"</p>
        <div style={{ background: "rgba(255,26,26,0.05)", border: `2px solid ${C.red}22`, borderRadius: 14, padding: 18 }}>
          <div style={{ ...ui, fontSize: 11, color: C.textMuted, marginBottom: 5 }}>Bisaya translation</div>
          <div style={{ ...ui, fontSize: 22, color: C.redLight, fontWeight: 800, marginBottom: 4 }}>{p.tgt}</div>
          <div style={{ ...mono, fontSize: 12, color: C.textMuted }}>{p.rom}</div>
        </div>
      </Card>

      <div style={{ display: "flex", gap: 10 }}>
        <Btn color={C.cyan} variant="outline" size="md" onClick={() => {}}>♪ Listen</Btn>
        <Btn color={C.red} size="md" onClick={() => onNav("recording")}>● Record</Btn>
        <div style={{ flex: 1 }} />
        <Btn color={C.textMuted} variant="ghost" size="md" onClick={() => setIdx((i) => Math.min(i + 1, phrases.length - 1))}>Skip ▶</Btn>
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
  const stop = () => { setPhase("done"); if (ref.current) clearInterval(ref.current); };
  useEffect(() => () => { if (ref.current) clearInterval(ref.current); }, []);

  return (
    <Page maxWidth={540}>
      <PageHeader
        title={phase === "idle" ? "🎤 Ready to Record" : phase === "rec" ? "🔴 Recording…" : "✅ Recording Complete"}
        subtitle={phase === "idle" ? "Tap the button when ready" : phase === "rec" ? "Speak clearly — tap mic to stop" : "Review before submitting"}
      />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, marginBottom: 28 }}>
        <div onClick={phase === "rec" ? stop : undefined}
          style={{ width: 110, height: 110, borderRadius: "50%", cursor: phase === "rec" ? "pointer" : "default", background: phase === "rec" ? `linear-gradient(135deg, ${C.red}, ${C.redDark})` : "rgba(255,26,26,0.06)", border: `4px solid ${phase === "rec" ? C.red : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, boxShadow: phase === "rec" ? `0 0 50px ${C.red}55, 0 0 100px ${C.red}22` : "0 4px 20px rgba(0,0,0,0.3)", transition: "all 0.3s ease", animation: phase === "rec" ? "pulse 1s ease-in-out infinite" : "none" }}
        >🎤</div>
        <div style={{ ...mono, fontSize: 36, color: phase === "rec" ? C.red : C.textMuted, letterSpacing: 4, textShadow: phase === "rec" ? `0 0 14px ${C.red}66` : "none" }}>
          {String(Math.floor(secs / 60)).padStart(2, "0")}:{String(secs % 60).padStart(2, "0")}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 3, height: 36 }}>
          {[...Array(28)].map((_, i) => {
            const h = phase === "rec" ? 4 + Math.abs(Math.sin(i * 0.8 + secs * 3)) * 28 : 3;
            return <div key={i} style={{ width: 3, height: h, borderRadius: 2, background: phase === "rec" ? (i % 3 === 0 ? C.red : i % 3 === 1 ? C.redLight : C.redDark) : "rgba(255,255,255,0.06)", transition: "height 0.1s ease", boxShadow: phase === "rec" ? `0 0 4px ${C.red}33` : "none" }} />;
          })}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 300, margin: "0 auto" }}>
        {phase === "idle" && <Btn color={C.red} size="lg" full onClick={start}>● Start Recording</Btn>}
        {phase === "rec" && <div style={{ display: "flex", gap: 10 }}><Btn color={C.red} size="md" full onClick={stop}>■ Stop</Btn><Btn color={C.textMuted} variant="outline" size="md" full onClick={() => { setPhase("idle"); setSecs(0); }}>✕ Cancel</Btn></div>}
        {phase === "done" && <><Btn color={C.cyan} variant="outline" size="md" full onClick={() => {}}>▶ Play Back</Btn><Btn color={C.red} size="md" full onClick={() => onNav("evaluation")}>★ Submit</Btn><Btn color={C.textMuted} variant="ghost" size="sm" full onClick={() => setPhase("idle")}>↺ Record again</Btn></>}
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
    { label: "Pronunciation", val: 88, color: C.cyan },
    { label: "Accuracy",      val: 75, color: C.red },
    { label: "Fluency",       val: 82, color: C.gold },
    { label: "Timing",        val: 91, color: C.green },
  ];
  const total = Math.round(scores.reduce((a, s) => a + s.val, 0) / scores.length);
  const xp = Math.round(total * 1.5);
  const grade = total >= 90 ? "S" : total >= 80 ? "A" : total >= 70 ? "B" : total >= 60 ? "C" : "D";
  const gc = total >= 80 ? C.green : total >= 60 ? C.gold : C.red;

  return (
    <Page maxWidth={660}>
      {coinsVisible && (
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 200, overflow: "hidden" }}>
          {[...Array(10)].map((_, i) => <div key={i} style={{ position: "absolute", left: `${10 + i * 8}%`, bottom: "35%", fontSize: 24, animation: `coinFly 1.4s ease-out ${i * 0.08}s both` }}>🪙</div>)}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
        <Card style={{ padding: 28, textAlign: "center", borderTop: `3px solid ${gc}` }} glowColor={gc}>
          <div style={{ ...pixel, fontSize: 8, color: C.textMuted, letterSpacing: "0.08em", marginBottom: 12 }}>MISSION COMPLETE</div>
          <div style={{ fontSize: 80, fontWeight: 900, color: gc, lineHeight: 1, marginBottom: 6, ...ui, textShadow: `0 0 30px ${gc}66`, animation: "bounce 1s ease-in-out" }}>{grade}</div>
          <div style={{ ...mono, fontSize: 26, color: C.text }}>{total}/100</div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 12, padding: "6px 14px", borderRadius: 50, background: "rgba(255,215,0,0.1)", border: "1.5px solid rgba(255,215,0,0.25)", animation: "wiggle 1s ease-in-out infinite" }}>
            <span>🪙</span><span style={{ ...ui, fontSize: 13, fontWeight: 800, color: C.gold }}>+{xp} XP</span>
          </div>
        </Card>
        <Card style={{ padding: 22 }} glowColor={C.red}>
          <div style={{ ...ui, fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 14 }}>Score Breakdown</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {scores.map((s) => (
              <div key={s.label}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ ...ui, fontSize: 12, color: C.text }}>{s.label}</span>
                  <span style={{ ...mono, fontSize: 12, color: s.color, fontWeight: 800 }}>{s.val}</span>
                </div>
                <ProgressBar pct={s.val} color={s.color} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card style={{ padding: 22, marginBottom: 18 }}>
        <div style={{ ...ui, fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 12 }}>🤖 AI Feedback</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {["Great pronunciation on vowels!", "Work on tonal patterns.", "Fluency improved +12% this week.", "Practice consonant clusters more."].map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 12px", borderRadius: 8, background: i === 0 || i === 2 ? "rgba(76,175,125,0.06)" : "rgba(255,26,26,0.04)", border: `1px solid ${i === 0 || i === 2 ? "rgba(76,175,125,0.15)" : "rgba(255,26,26,0.1)"}` }}>
              <span style={{ fontSize: 13 }}>{i === 0 || i === 2 ? "✅" : "⚠️"}</span>
              <span style={{ ...ui, fontSize: 13, color: C.text, lineHeight: 1.5 }}>{f}</span>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: "flex", gap: 10 }}>
        <Btn color={C.textMuted} variant="outline" size="md" onClick={() => { onXP(xp); onNav("home"); }}>← Home</Btn>
        <Btn color={C.red} size="md" onClick={() => onNav("mission")}>Next Phrase →</Btn>
      </div>
    </Page>
  );
}

// ─── Screen: Leaderboard ──────────────────────────────────────────────────────

function LeaderboardScreen() {
  const [tab, setTab] = useState<"Global" | "Language" | "Weekly">("Global");
  const players = [
    { name: "PIXEL_MASTER",  xp: 14200, rank: "Sirena" as Rank,      flag: "🇵🇭", streak: 45, avatar: "🧑",   me: false },
    { name: "NEON_LINGUIST", xp: 11800, rank: "Sirena" as Rank,      flag: "🇵🇭", streak: 32, avatar: "👩",   me: false },
    { name: "ARCADE_NINJA",  xp: 9600,  rank: "Aswang" as Rank,      flag: "🇵🇭", streak: 28, avatar: "🧙",   me: false },
    { name: "BYTE_SPEAKER",  xp: 8200,  rank: "Aswang" as Rank,      flag: "🇵🇭", streak: 21, avatar: "🤖",   me: false },
    { name: "GLITCH_TONGUE", xp: 5900,  rank: "Manananggal" as Rank, flag: "🇵🇭", streak: 15, avatar: "🦊",   me: false },
    { name: "PLAYER_ONE",    xp: 4750,  rank: "Manananggal" as Rank, flag: "🇵🇭", streak: 7,  avatar: "🧑‍💻", me: true  },
    { name: "RETRO_TALKER",  xp: 2300,  rank: "Tikbalang" as Rank,   flag: "🇵🇭", streak: 9,  avatar: "🎮",   me: false },
    { name: "LANG_ROOKIE",   xp: 800,   rank: "Nuno" as Rank,        flag: "🇵🇭", streak: 3,  avatar: "🌱",   me: false },
  ];
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <Page maxWidth={700}>
      <PageHeader title="★ Leaderboard" subtitle="Global ranking by total XP earned" />

      <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 12, marginBottom: 28 }}>
        {[players[1], players[0], players[2]].map((p, i) => {
          const orderIdx = [1, 0, 2];
          const heights = [115, 145, 92];
          const ri = orderIdx[i];
          return (
            <div key={p.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, flex: 1, maxWidth: 130 }}>
              <span style={{ fontSize: 20, animation: "bounce 2s ease-in-out infinite", animationDelay: `${ri * 0.2}s` }}>{medals[ri]}</span>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(255,26,26,0.05)", border: `2px solid ${RANKS[p.rank].color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: RANKS[p.rank].glow }}>{p.avatar}</div>
              <span style={{ ...ui, fontSize: 10, fontWeight: 800, color: C.text, textAlign: "center" }}>{p.name}</span>
              <div style={{ width: "100%", height: heights[i], borderRadius: "12px 12px 0 0", background: `linear-gradient(180deg, ${RANKS[p.rank].color}20, ${RANKS[p.rank].color}05)`, border: `1.5px solid ${RANKS[p.rank].color}33`, borderBottom: "none", display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 10 }}>
                <span style={{ ...mono, fontSize: 11, color: RANKS[p.rank].color, fontWeight: 700 }}>{(p.xp / 1000).toFixed(1)}k</span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", background: "rgba(255,26,26,0.04)", border: `2px solid ${C.border}`, borderRadius: 12, padding: 4, marginBottom: 14, width: "fit-content" }}>
        {(["Global", "Language", "Weekly"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 800, fontSize: 12, transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)", background: tab === t ? C.red : "transparent", color: tab === t ? "#fff" : C.textMuted, boxShadow: tab === t ? `0 0 14px ${C.red}55` : "none", transform: tab === t ? "scale(1.03)" : "scale(1)", ...ui }}
          >{t}</button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {players.map((p, i) => (
          <Card key={p.name} style={{ padding: "11px 14px", display: "flex", alignItems: "center", gap: 12, ...(p.me ? { border: `2px solid ${C.red}55`, background: "rgba(255,26,26,0.05)" } : {}) }} glowColor={p.me ? C.red : undefined}>
            <div style={{ width: 22, textAlign: "center", flexShrink: 0 }}>
              {i < 3 ? <span style={{ fontSize: 16 }}>{medals[i]}</span> : <span style={{ ...mono, fontSize: 11, color: C.textMuted }}>{i + 1}</span>}
            </div>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(255,26,26,0.04)", border: `1.5px solid ${RANKS[p.rank].color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{p.avatar}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ ...ui, fontSize: 12, fontWeight: 800, color: p.me ? C.redLight : C.text }}>{p.name}</span>
                <span style={{ fontSize: 11 }}>{p.flag}</span>
                {p.me && <span style={{ ...pixel, fontSize: 6, color: "#fff", background: C.red, padding: "2px 6px", borderRadius: 4, boxShadow: `0 0 6px ${C.red}44` }}>YOU</span>}
              </div>
              <span style={{ ...ui, fontSize: 11, color: C.textMuted }}>{p.xp.toLocaleString()} XP · {p.streak}🔥</span>
            </div>
            <RankBadge rank={p.rank} size={26} />
          </Card>
        ))}
      </div>
    </Page>
  );
}

// ─── Screen: Achievements ─────────────────────────────────────────────────────

function AchievementsScreen() {
  const items = [
    { icon: "🏆", title: "First Blood",   desc: "Complete your first translation", done: true,  color: C.gold },
    { icon: "🔥", title: "Hot Streak",    desc: "Maintain a 7-day streak",         done: true,  color: C.orange },
    { icon: "🧜‍♀️", title: "Sirena Quest",  desc: "Reach Sirena rank",               done: false, color: C.cyan },
    { icon: "🌍", title: "Polyglot",      desc: "Start learning 5 dialects",       done: false, color: C.green },
    { icon: "⚡", title: "Speed Demon",   desc: "100 translations in one day",     done: false, color: C.red },
    { icon: "🎯", title: "Perfect Score", desc: "Score 100 on any evaluation",     done: true,  color: C.green },
    { icon: "👑", title: "Top Rank",      desc: "Reach #1 on the leaderboard",     done: false, color: C.gold },
    { icon: "📚", title: "Bookworm",      desc: "Learn 500 phrases",               done: true,  color: C.red },
  ];

  return (
    <Page>
      <PageHeader title="🏆 Achievements" subtitle={`${items.filter((a) => a.done).length} of ${items.length} unlocked — keep going!`} />

      <Card style={{ padding: 22, marginBottom: 24, borderTop: `3px solid ${C.red}` }} glowColor={C.red}>
        <div style={{ ...pixel, fontSize: 9, color: C.text, marginBottom: 14, letterSpacing: "0.05em" }}>MYTHICAL RANK PATH</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {(Object.keys(RANKS) as Rank[]).map((r, i) => (
            <div key={r} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                <RankBadge rank={r} size={38} />
                <span style={{ ...ui, fontSize: 10, fontWeight: 700, color: RANKS[r].color }}>{r}</span>
                <span style={{ ...mono, fontSize: 8, color: C.textMuted }}>{RANKS[r].min / 1000}k XP</span>
              </div>
              {i < 4 && <div style={{ width: 28, height: 2, background: `linear-gradient(90deg, ${RANKS[r].color}44, ${RANKS[(Object.keys(RANKS) as Rank[])[i + 1]].color}44)`, margin: "0 6px 18px", borderRadius: 1 }} />}
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {items.map((a, i) => (
          <Card key={a.title} style={{ padding: 18, opacity: a.done ? 1 : 0.4, animation: `slideUp 0.3s ease-out ${i * 0.05}s both` }} glowColor={a.done ? a.color : undefined}>
            <div style={{ fontSize: 28, marginBottom: 8, animation: a.done ? "bounce 3s ease-in-out infinite" : "none", animationDelay: `${i * 0.5}s` }}>{a.icon}</div>
            <div style={{ ...ui, fontSize: 12, fontWeight: 800, color: a.done ? a.color : C.textMuted, marginBottom: 3 }}>{a.title}</div>
            <p style={{ ...ui, fontSize: 11, color: C.textMuted, lineHeight: 1.4, margin: 0 }}>{a.desc}</p>
            {a.done && <div style={{ ...ui, fontSize: 10, color: C.green, fontWeight: 700, marginTop: 8 }}>✓ Unlocked</div>}
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
    { title: "Translation Sprint", desc: "Translate 10 phrases in 5 minutes", xp: 200, color: C.red, icon: "⚡", done: false },
    { title: "Accent Master",      desc: "Score 90+ on pronunciation",         xp: 150, color: C.cyan, icon: "🎤", done: true  },
    { title: "Vocab Blitz",        desc: "Learn 20 new words today",           xp: 100, color: C.green, icon: "📖", done: false },
    { title: "Community Share",    desc: "Contribute 5 voice recordings",      xp: 75,  color: C.gold, icon: "🤝", done: false },
  ];

  return (
    <Page maxWidth={700}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "start", marginBottom: 28 }}>
        <PageHeader title="⚡ Daily Quests" subtitle="Complete all 4 for a bonus XP reward!" />
        <Card style={{ padding: "14px 20px", textAlign: "center", borderTop: `3px solid ${C.red}` }} glowColor={C.red}>
          <div style={{ ...pixel, fontSize: 7, color: C.textMuted, marginBottom: 4, letterSpacing: "0.1em" }}>RESETS IN</div>
          <div style={{ ...mono, fontSize: 20, color: C.red, fontWeight: 700, letterSpacing: 3, textShadow: `0 0 12px ${C.red}55` }}>14:23:07</div>
          <div style={{ display: "flex", gap: 4, justifyContent: "center", marginTop: 8 }}>
            {quests.map((q, i) => <div key={i} style={{ width: 20, height: 5, borderRadius: 3, background: q.done ? C.red : "rgba(255,255,255,0.06)", boxShadow: q.done ? `0 0 6px ${C.red}66` : "none", transition: "all 0.3s" }} />)}
          </div>
          <div style={{ ...ui, fontSize: 10, color: C.textMuted, marginTop: 4, fontWeight: 700 }}>{quests.filter((q) => q.done).length}/{quests.length}</div>
        </Card>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {quests.map((q, i) => (
          <Card key={q.title} style={{ padding: 18, animation: `slideUp 0.3s ease-out ${i * 0.1}s both` }} glowColor={q.done ? C.green : q.color}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${q.color}15`, border: `1.5px solid ${q.color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0, animation: q.done ? "none" : "bounce 3s ease-in-out infinite", animationDelay: `${i * 0.5}s` }}>{q.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <span style={{ ...ui, fontSize: 14, fontWeight: 800, color: q.done ? C.textMuted : C.text }}>{q.title}</span>
                  {q.done && <span style={{ ...ui, fontSize: 10, fontWeight: 700, color: C.green, background: `rgba(76,175,125,0.12)`, border: `1.5px solid rgba(76,175,125,0.25)`, padding: "2px 8px", borderRadius: 50 }}>Done ✓</span>}
                </div>
                <p style={{ ...ui, fontSize: 12, color: C.textMuted, margin: 0 }}>{q.desc}</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                <span style={{ ...mono, fontSize: 12, fontWeight: 800, color: C.gold }}>+{q.xp} XP</span>
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
    { val: "1,247", label: "Translations", color: C.cyan, icon: "💬" },
    { val: "4",     label: "Dialects",     color: C.red, icon: "🌏" },
    { val: "7",     label: "Day Streak",   color: C.orange, icon: "🔥" },
    { val: "82%",   label: "Accuracy",     color: C.green, icon: "🎯" },
  ];
  const badges = [
    { icon: "🎯", label: "Sharpshooter", earned: true },
    { icon: "🔥", label: "On Fire",      earned: true },
    { icon: "⚡", label: "Speedster",    earned: true },
    { icon: "🌟", label: "All-Star",     earned: true },
    { icon: "🏆", label: "Champion",     earned: false },
    { icon: "💬", label: "Chatterbox",   earned: false },
  ];

  return (
    <Page>
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20, marginBottom: 20 }}>
        <Card style={{ padding: 26, borderLeft: `4px solid ${cfg.color}` }} glowColor={cfg.color}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, textAlign: "center" }}>
            <div style={{ position: "relative" }}>
              <div style={{ width: 72, height: 72, borderRadius: 18, background: `linear-gradient(135deg, #1a0808, ${C.surface})`, border: `3px solid ${cfg.color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, boxShadow: cfg.glow }}>🧑‍💻</div>
              <div style={{ position: "absolute", bottom: -4, right: -4 }}><RankBadge rank={rank} size={24} /></div>
            </div>
            <div>
              <div style={{ ...ui, fontSize: 18, fontWeight: 900, color: C.text }}>PLAYER_ONE</div>
              <div style={{ ...ui, fontSize: 11, color: C.textMuted, marginTop: 2 }}>Joined June 2024 · #00142</div>
              <span style={{ ...pixel, fontSize: 7, color: cfg.color, background: cfg.bg, border: `1.5px solid ${cfg.color}44`, padding: "4px 8px", borderRadius: 6, display: "inline-block", marginTop: 8, boxShadow: `0 0 8px ${cfg.color}22` }}>{rank}</span>
            </div>
            <div style={{ width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ ...ui, fontSize: 10, color: C.textMuted }}>→ {nextRank}</span>
                <span style={{ ...mono, fontSize: 10, color: cfg.color }}>{xp.toLocaleString()} XP</span>
              </div>
              <ProgressBar pct={pct} color={cfg.color} />
              <div style={{ ...ui, fontSize: 10, color: C.textMuted, marginTop: 3, textAlign: "right" }}>{(cfg.max - xp).toLocaleString()} XP to go</div>
            </div>
          </div>
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            {stats.map((s) => (
              <Card key={s.label} style={{ padding: "16px 18px" }} glowColor={s.color}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{s.icon}</span>
                  <div>
                    <div style={{ ...mono, fontSize: 20, color: s.color, fontWeight: 800 }}>{s.val}</div>
                    <div style={{ ...ui, fontSize: 10, color: C.textMuted, marginTop: 2 }}>{s.label}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <Card style={{ padding: 18, flex: 1 }} glowColor={C.red}>
            <div style={{ ...ui, fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 12 }}>🛡️ Badges</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {badges.map((b, i) => (
                <div key={b.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "12px 6px", borderRadius: 10, background: b.earned ? "rgba(255,26,26,0.04)" : "rgba(255,255,255,0.02)", opacity: b.earned ? 1 : 0.3, border: b.earned ? `1.5px solid ${C.red}22` : "1.5px solid transparent" }}>
                  <span style={{ fontSize: 22, animation: b.earned ? "bounce 3s ease-in-out infinite" : "none", animationDelay: `${i * 0.3}s` }}>{b.icon}</span>
                  <span style={{ ...ui, fontSize: 9, color: C.textMuted, textAlign: "center", fontWeight: 600 }}>{b.label}</span>
                  {b.earned && <span style={{ ...ui, fontSize: 8, color: C.green, fontWeight: 700 }}>Unlocked</span>}
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
    <div style={{ ...ui, background: C.bg, minHeight: "100vh", color: C.text }}>
      {/* Ambient red gradient — strong presence */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, background: "radial-gradient(ellipse at 15% 0%, rgba(255,26,26,0.07) 0%, transparent 50%), radial-gradient(ellipse at 85% 100%, rgba(255,26,26,0.04) 0%, transparent 40%), radial-gradient(circle at 50% 50%, rgba(255,26,26,0.02) 0%, transparent 60%)" }} />
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
        select option { background: ${C.surface}; color: ${C.text}; }
        @keyframes coinFly { 0% { transform: translateY(0) scale(1); opacity: 1; } 100% { transform: translateY(-160px) scale(1.4); opacity: 0; } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.9; transform: scale(1.03); } }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        @keyframes wiggle { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-3deg); } 75% { transform: rotate(3deg); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-16px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
