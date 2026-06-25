import { useState, useEffect, useRef } from "react";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router";
import { supabase } from "../lib/supabase";
import confetti from "canvas-confetti";


// Rank SVG imports
import nunoSvg from "../assets/ranks/nunorank.svg";
import tikbalangSvg from "../assets/ranks/tikbalrank.svg";
import manananggalSvg from "../assets/ranks/manananggalrank.svg";
import aswangSvg from "../assets/ranks/aswangrank.svg";
import sirenaSvg from "../assets/ranks/sirenarank.svg";

// Rank icon imports (for avatars)
import nunoIcon from "../assets/ranks/icon-nuno.png";
import tikbalangIcon from "../assets/ranks/icon-tikbalang.png";
import manananggalIcon from "../assets/ranks/icon-manananggal.png";
import aswangIcon from "../assets/ranks/icon-aswang.png";
import sirenaIcon from "../assets/ranks/icon-sirena.png";

type Screen = "login" | "home" | "play" | "mission" | "recording" | "evaluation" | "leaderboard" | "profile" | "achievements" | "daily";
type Rank = "Nuno" | "Tikbalang" | "Manananggal" | "Aswang" | "Sirena";

const RANK_SVGS: Record<Rank, string> = {
  Nuno: nunoSvg,
  Tikbalang: tikbalangSvg,
  Manananggal: manananggalSvg,
  Aswang: aswangSvg,
  Sirena: sirenaSvg,
};

const RANK_ICONS: Record<Rank, string> = {
  Nuno: nunoIcon,
  Tikbalang: tikbalangIcon,
  Manananggal: manananggalIcon,
  Aswang: aswangIcon,
  Sirena: sirenaIcon,
};

const RANKS: Record<Rank, { color: string; glow: string; bg: string; min: number; max: number; creature: string; tier: string }> = {
  Nuno:        { color: "#cd7f32", glow: "0 0 14px #cd7f3255", bg: "rgba(205,127,50,0.12)",  min: 0,     max: 1000,  creature: "🍄", tier: "Bronze" },
  Tikbalang:   { color: "#b0c4de", glow: "0 0 14px #b0c4de55", bg: "rgba(176,196,222,0.12)", min: 1000,  max: 3000,  creature: "🐴", tier: "Silver" },
  Manananggal: { color: "#ffd700", glow: "0 0 14px #ffd70055", bg: "rgba(255,215,0,0.12)",   min: 3000,  max: 6000,  creature: "🦇", tier: "Gold" },
  Aswang:      { color: "#a8b4c4", glow: "0 0 14px #a8b4c455", bg: "rgba(168,180,196,0.12)", min: 6000,  max: 10000, creature: "👁️", tier: "Platinum" },
  Sirena:      { color: "#b9f2ff", glow: "0 0 14px #b9f2ff55", bg: "rgba(185,242,255,0.12)", min: 10000, max: 15000, creature: "🧜‍♀️", tier: "Diamond" },
};

// Coming soon ranks (blacked out placeholders)
const COMING_SOON_RANKS = [
  { name: "???", color: "#1a1a1a", glow: "0 0 8px rgba(255,255,255,0.05)", min: "15k" },
  { name: "???", color: "#1a1a1a", glow: "0 0 8px rgba(255,255,255,0.05)", min: "20k" },
  { name: "???", color: "#1a1a1a", glow: "0 0 8px rgba(255,255,255,0.05)", min: "30k" },
];

// Profile banners unlocked at each rank — progressively more premium
const RANK_BANNERS: Record<Rank, { name: string; gradient: string; unlocked: boolean }[]> = {
  Nuno: [
    { name: "Earth Root", gradient: "linear-gradient(120deg, #1a0f05 0%, #2e1a0a 20%, #5c3a1a 40%, #8b5e34 50%, #cd7f32 55%, #8b5e34 60%, #5c3a1a 70%, #2e1a0a 85%, #1a0f05 100%)", unlocked: true },
  ],
  Tikbalang: [
    { name: "Silver Mane", gradient: "linear-gradient(120deg, #0d1520 0%, #1a2d44 15%, #3d5a80 30%, #7a9cb8 42%, #b0c4de 48%, #e8f0f8 52%, #b0c4de 58%, #7a9cb8 68%, #3d5a80 80%, #1a2d44 92%, #0d1520 100%)", unlocked: true },
  ],
  Manananggal: [
    { name: "Golden Wings", gradient: "linear-gradient(120deg, #1a1200 0%, #3d2e00 12%, #6b4e00 24%, #a67c00 36%, #d4a300 44%, #ffd700 48%, #fff8b0 52%, #ffd700 56%, #d4a300 64%, #a67c00 74%, #6b4e00 84%, #3d2e00 92%, #1a1200 100%)", unlocked: true },
  ],
  Aswang: [
    { name: "Platinum Ascent", gradient: "linear-gradient(120deg, #0f1a24 0%, #1a3040 12%, #2d5060 24%, #4a8090 36%, #6eaab8 44%, #8ecad6 48%, #c0e8f0 50%, #e8f8fc 52%, #c0e8f0 54%, #8ecad6 58%, #6eaab8 66%, #4a8090 76%, #2d5060 86%, #1a3040 94%, #0f1a24 100%)", unlocked: true },
  ],
  Sirena: [
    { name: "Diamond Tide", gradient: "linear-gradient(120deg, #05000d 0%, #0f0020 8%, #1a0044 16%, #330088 24%, #5500cc 32%, #7733ff 38%, #9966ff 42%, #bb99ff 46%, #ddccff 48%, #ffffff 50%, #ddccff 52%, #bb99ff 54%, #9966ff 58%, #7733ff 62%, #5500cc 68%, #330088 76%, #1a0044 84%, #0f0020 92%, #05000d 100%)", unlocked: true },
  ],
};

// Coming soon banners (locked, future content)
const COMING_SOON_BANNERS = [
  { name: "???", gradient: "linear-gradient(135deg, #0a0a0a, #111, #0a0a0a)" },
  { name: "???", gradient: "linear-gradient(135deg, #0a0a0a, #111, #0a0a0a)" },
  { name: "???", gradient: "linear-gradient(135deg, #0a0a0a, #111, #0a0a0a)" },
  { name: "???", gradient: "linear-gradient(135deg, #0a0a0a, #111, #0a0a0a)" },
];

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
  surfaceHover: "#1c1414",
  border: "rgba(255,26,26,0.12)",
  borderHover: "rgba(255,26,26,0.25)",
  borderStrong: "rgba(255,26,26,0.4)",
  text: "#f5eded",
  textMuted: "#9e7070",
  red: "#ff1a1a",
  redLight: "#ff5252",
  redDark: "#cc0000",
  redGlow: "0 0 12px rgba(255,26,26,0.2)",
  gold: "#ffd700",
  green: "#4caf7d",
  cyan: "#4fc3f7",
  orange: "#ff8c42",
};

const ui: React.CSSProperties = { fontFamily: "'Inter', sans-serif" };
const mono: React.CSSProperties = { fontFamily: "'Space Mono', monospace" };
const pixel: React.CSSProperties = { fontFamily: "'Press Start 2P', monospace" };

// ─── Mermaid / Sirena Logo SVG ────────────────────────────────────────────────
function SirenaLogo({ size = 32 }: { size?: number }) {
  // Clean iconic mermaid tail mark — abstract S-curve with a fin
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Main S-curve tail shape */}
      <path
        d="M20 4 C12 4, 8 10, 8 14 C8 18, 12 20, 16 20 C20 20, 24 18, 28 20 C32 22, 32 28, 28 32 C26 34, 22 36, 20 36"
        stroke="url(#logoGrad)" strokeWidth="4" strokeLinecap="round" fill="none"
      />
      {/* Left fin */}
      <path
        d="M20 36 C16 38, 12 40, 10 38 C9 37, 10 35, 12 35 C14 35, 17 36, 20 36"
        fill={C.red}
      />
      {/* Right fin */}
      <path
        d="M20 36 C24 38, 28 40, 30 38 C31 37, 30 35, 28 35 C26 35, 23 36, 20 36"
        fill={C.redDark}
      />
      <defs>
        <linearGradient id="logoGrad" x1="8" y1="4" x2="32" y2="36">
          <stop offset="0%" stopColor={C.redLight}/>
          <stop offset="50%" stopColor={C.red}/>
          <stop offset="100%" stopColor={C.redDark}/>
        </linearGradient>
      </defs>
    </svg>
  );
}

// ─── Shared Components ────────────────────────────────────────────────────────

function RankBadge({ rank, size = 32 }: { rank: Rank; size?: number }) {
  const { color, bg, glow } = RANKS[rank];
  return (
    <span title={rank} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: size, height: size, borderRadius: "50%", background: bg, border: `2px solid ${color}66`, flexShrink: 0, boxShadow: glow, overflow: "hidden" }}>
      <img src={RANK_SVGS[rank]} alt={rank} style={{ width: size * 0.65, height: size * 0.65, objectFit: "contain", display: "block" }} />
    </span>
  );
}

function ProgressBar({ pct, color, height = 7 }: { pct: number; color: string; height?: number }) {
  return (
    <div style={{ height, width: "100%", background: "rgba(255,255,255,0.06)", borderRadius: height, overflow: "hidden", border: `1px solid rgba(255,26,26,0.08)` }}>
      <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: `linear-gradient(90deg, ${color}cc, ${color})`, borderRadius: height, boxShadow: `0 0 12px ${color}55, inset 0 1px 0 rgba(255,255,255,0.3)`, transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)", backgroundSize: "200% 100%", animation: "shimmer 2s linear infinite" }} />
      </div>
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
        boxShadow: hovered ? `0 0 20px ${gc}15, 0 8px 24px rgba(0,0,0,0.4)` : "0 2px 8px rgba(0,0,0,0.2)",
        transform: hovered && onClick ? "translateY(-3px) scale(1.008)" : "translateY(0) scale(1)",
        transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
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
  const [pressed, setPressed] = useState(false);
  const pad = { sm: "8px 16px", md: "11px 24px", lg: "14px 34px" };
  const fs = { sm: 12, md: 13, lg: 15 };
  const bg = variant === "solid" ? (disabled ? "rgba(255,26,26,0.12)" : color) : "transparent";
  const border = variant === "outline" ? `2px solid ${color}` : "2px solid transparent";
  const textColor = variant === "solid" ? (disabled ? "#6b3333" : "#fff") : color;
  const shadow = variant === "solid" && !disabled ? `0 2px 10px ${color}33` : "none";
  const hoverShadow = variant === "solid" && !disabled ? `0 6px 20px ${color}55` : variant === "outline" ? `0 0 12px ${color}22` : "none";
  const t = pressed ? "translateY(0px) scale(0.97)" : hovered && !disabled ? "translateY(-3px) scale(1.04)" : "none";
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)}
      style={{ ...ui, fontWeight: 800, fontSize: fs[size], background: bg, border, color: textColor, borderRadius: 12, padding: pad[size], cursor: disabled ? "not-allowed" : "pointer", width: full ? "100%" : undefined, boxShadow: hovered ? hoverShadow : shadow, transform: t, transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)", letterSpacing: "0.02em" }}
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
        style={{ ...ui, width: "100%", background: "rgba(255,26,26,0.03)", border: `2px solid ${focused ? C.red + "77" : C.border}`, borderRadius: 12, padding: "12px 16px", color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box", boxShadow: focused ? `0 0 20px ${C.red}33, inset 0 0 10px ${C.red}11` : "none", transition: "all 0.3s ease", transform: focused ? "scale(1.01)" : "scale(1)" }}
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
      style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 50, border: "none", background: active ? C.red : hovered ? "rgba(255,26,26,0.12)" : "transparent", color: active ? "#fff" : hovered ? C.text : C.textMuted, cursor: "pointer", fontSize: 12, fontWeight: 700, transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)", boxShadow: active ? `0 2px 12px ${C.red}44` : "none", transform: hovered && !active ? "scale(1.06)" : active ? "scale(1)" : "scale(1)", ...ui }}
    >
      <span style={{ fontSize: 14, lineHeight: 1, transition: "transform 0.2s", transform: hovered ? "scale(1.2)" : "scale(1)" }}>{icon}</span>
      <span style={{ fontSize: 12 }}>{label}</span>
    </button>
  );
}

function Navbar({ xp, rank, playerName, onLogout }: { xp: number; rank: Rank; playerName: string; onLogout: () => void }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const screen = pathname.replace("/", "") || "home";
  const [showMenu, setShowMenu] = useState(false);
  return (
    <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(10,10,10,0.94)", backdropFilter: "blur(20px)", borderBottom: `2px solid ${C.border}` }}>
      <button onClick={() => navigate("/home")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, #1a0808, ${C.surface})`, border: `1.5px solid ${C.red}44`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: C.redGlow, animation: "pulse 2s ease-in-out infinite" }}><SirenaLogo size={28} /></div>
        <span style={{ ...pixel, fontSize: 10, color: C.text, letterSpacing: 1 }}>SI<span style={{ color: C.red, textShadow: `0 0 10px ${C.red}88` }}>RENE</span></span>
      </button>

      <nav style={{ display: "flex", alignItems: "center", gap: 2, background: "rgba(255,26,26,0.04)", border: `1.5px solid ${C.border}`, borderRadius: 50, padding: "4px" }}>
        {NAV_ITEMS.map(({ label, icon, screen: s }) => (
          <NavButton key={s} label={label} icon={icon} active={screen === s} onClick={() => navigate(`/${s}`)} />
        ))}
      </nav>

      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,26,26,0.04)", border: `1.5px solid ${C.border}`, borderRadius: 50, padding: "5px 14px 5px 6px", cursor: "pointer", transition: "all 0.2s" }} onClick={() => setShowMenu((v) => !v)}>
          <RankBadge rank={rank} size={28} />
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ ...ui, fontSize: 11, fontWeight: 800, color: C.text }}>{playerName}</div>
            <div style={{ ...mono, fontSize: 9, color: RANKS[rank].color }}>{xp.toLocaleString()} XP</div>
          </div>
        </div>
        {showMenu && (
          <>
            <div onClick={() => setShowMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 99 }} />
            <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 100, background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: 6, minWidth: 160, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", animation: "scaleIn 0.15s ease-out" }}>
              <button onClick={() => { setShowMenu(false); navigate("/profile"); }} style={{ ...ui, width: "100%", textAlign: "left", padding: "10px 14px", borderRadius: 8, border: "none", background: "transparent", color: C.text, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,26,26,0.06)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                <span>◉</span> Profile
              </button>
              <div style={{ height: 1, background: C.border, margin: "4px 8px" }} />
              <button onClick={() => { setShowMenu(false); onLogout(); }} style={{ ...ui, width: "100%", textAlign: "left", padding: "10px 14px", borderRadius: 8, border: "none", background: "transparent", color: C.redLight, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,26,26,0.08)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                <span>🚪</span> Logout
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

function Page({ children, maxWidth = 860 }: { children: React.ReactNode; maxWidth?: number }) {
  return <main style={{ minHeight: "100vh", paddingTop: 80 }}><div style={{ maxWidth, margin: "0 auto", padding: "40px 24px 60px", animation: "fadeIn 0.3s ease-out" }}>{children}</div></main>;
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
        <div style={{ width: 84, height: 84, borderRadius: 22, margin: "0 auto 20px", background: `linear-gradient(135deg, #1a0808, ${C.surface})`, border: `2px solid ${C.red}33`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 24px ${C.red}22, 0 0 48px ${C.red}11`, animation: "pulse 2.5s ease-in-out infinite" }}><SirenaLogo size={56} /></div>
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

function HomeScreen({ xp, rank, playerName }: { xp: number; rank: Rank; playerName: string }) {
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
      <Card style={{ padding: "22px 26px", marginBottom: 28, borderLeft: `4px solid ${C.red}`, position: "relative", overflow: "hidden" }} glowColor={cfg.color}>
        {/* Card shimmer accent */}
        <div style={{ position: "absolute", top: 0, right: 0, width: 200, height: "100%", background: `linear-gradient(135deg, transparent, ${cfg.color}05)`, pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 16, position: "relative" }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg, #1a0808, ${C.surface})`, border: `2px solid ${cfg.color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, boxShadow: cfg.glow }}>🧑‍💻</div>
            <div style={{ position: "absolute", bottom: -5, right: -5 }}><RankBadge rank={rank} size={22} /></div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span style={{ ...ui, fontSize: 16, fontWeight: 900, color: C.text }}>{playerName}</span>
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
          <button onClick={() => onNav("play")} style={{ ...ui, fontSize: 12, color: C.red, background: "rgba(255,26,26,0.06)", border: `1.5px solid ${C.red}33`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontWeight: 700 }}>+ Add language</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          {langs.map((l, i) => (
            <Card key={l.name} style={{ padding: 18, animation: `slideUp 0.4s ease-out ${i * 0.1}s both`, position: "relative", overflow: "hidden" }} onClick={() => onNav("mission")} glowColor={l.color}>
              <div style={{ position: "absolute", top: 0, right: 0, width: 60, height: 60, borderRadius: "50%", background: `radial-gradient(circle, ${l.color}10, transparent)`, transform: "translate(30%, -30%)" }} />
              <div style={{ marginBottom: 12 }}>
                <div style={{ ...ui, fontSize: 15, fontWeight: 800, color: C.text }}>{l.name}</div>
                <div style={{ ...ui, fontSize: 11, color: l.color, marginTop: 3, fontWeight: 600 }}>{l.level}</div>
              </div>
              <ProgressBar pct={l.pct} color={l.color} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
                <span style={{ ...mono, fontSize: 11, color: C.textMuted }}>{l.pct}%</span>
                <span style={{ ...ui, fontSize: 11, color: l.color, fontWeight: 700 }}>Practice →</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Explore */}
      <SectionTitle style={{ marginBottom: 14 }}>Explore</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {[
          { label: "Daily Quest",  icon: "⚡", sub: "4 quests available",  color: C.red, screen: "daily" as Screen },
          { label: "Leaderboard",  icon: "★",  sub: "You are ranked #142", color: C.gold, screen: "leaderboard" as Screen },
          { label: "Achievements", icon: "🏆", sub: "4 of 8 unlocked",    color: C.green, screen: "achievements" as Screen },
        ].map((a, i) => (
          <Card key={a.label} style={{ padding: 22, animation: `slideUp 0.4s ease-out ${(i + 4) * 0.1}s both`, position: "relative", overflow: "hidden" }} onClick={() => onNav(a.screen)} glowColor={a.color}>
            <div style={{ position: "absolute", bottom: -10, right: -10, width: 80, height: 80, borderRadius: "50%", background: `radial-gradient(circle, ${a.color}0a, transparent)` }} />
            <div style={{ fontSize: 32, marginBottom: 10, animation: "bounce 2s ease-in-out infinite", animationDelay: `${i * 0.3}s` }}>{a.icon}</div>
            <div style={{ ...ui, fontSize: 15, fontWeight: 800, color: C.text }}>{a.label}</div>
            <div style={{ ...ui, fontSize: 12, color: C.textMuted, marginTop: 4 }}>{a.sub}</div>
            <div style={{ ...ui, fontSize: 12, color: a.color, marginTop: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>View <span style={{ transition: "transform 0.2s", display: "inline-block" }}>→</span></div>
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

function PlayScreen({ onXP }: { onXP?: (xp: number) => void }) {
  const navigate = useNavigate();
  const onNav = (s: Screen) => navigate(`/${s}`);
  
  // Tabs: challenge or blitz
  const [mode, setMode] = useState<"challenge" | "blitz">("challenge");

  // State for Battle Challenge (the existing screen)
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

  // State for Vocab Blitz
  const [blitzFrom, setBlitzFrom] = useState("Tagalog");
  const [blitzTo, setBlitzTo] = useState("Bisaya");
  const [blitzLoading, setBlitzLoading] = useState(false);
  const [blitzError, setBlitzError] = useState("");
  
  // Word list and gameplay
  const [blitzWords, setBlitzWords] = useState<{ word: string; translation: string; explanation: string }[]>([]);
  const [blitzIdx, setBlitzIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [savingQuest, setSavingQuest] = useState(false);

  const startBlitz = async () => {
    setBlitzError("");
    setBlitzLoading(true);
    setCompleted(false);
    setBlitzIdx(0);
    setFlipped(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setBlitzError("Not logged in. Please log in first.");
        setBlitzLoading(false);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/vocab-blitz`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          source_language: blitzFrom.toLowerCase(),
          target_language: blitzTo.toLowerCase(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const resData = await response.json();
      if (resData.success && Array.isArray(resData.words) && resData.words.length > 0) {
        setBlitzWords(resData.words);
      } else {
        throw new Error("Invalid response format or empty word list.");
      }
    } catch (err: any) {
      console.error("Error generating Vocab Blitz:", err);
      setBlitzError(err.message || "Failed to load vocabulary words.");
    } finally {
      setBlitzLoading(false);
    }
  };

  const handleFinishBlitz = async () => {
    setSavingQuest(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("User session not found.");
        setSavingQuest(false);
        return;
      }

      // 1. Fetch latest daily quest entry
      const { data: latestQuest, error: fetchErr } = await supabase
        .from("daily_quest")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const isToday = (dateStr: string) => {
        const d = new Date(dateStr);
        const today = new Date();
        return d.getDate() === today.getDate() &&
               d.getMonth() === today.getMonth() &&
               d.getFullYear() === today.getFullYear();
      };

      if (latestQuest && isToday(latestQuest.created_at)) {
        // Update today's existing row
        const { error: updateErr } = await supabase
          .from("daily_quest")
          .update({ vocab_blitz: true })
          .eq("id", latestQuest.id);
        if (updateErr) throw updateErr;
      } else {
        // Create a new row for today
        const { error: insertErr } = await supabase
          .from("daily_quest")
          .insert({
            user_id: user.id,
            vocab_blitz: true,
          });
        if (insertErr) throw insertErr;
      }

      // Confetti!
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });

      // Award XP locally
      if (onXP) {
        onXP(100);
      }

      setCompleted(true);
    } catch (err) {
      console.error("Error updating daily quest:", err);
      alert("Failed to save progress in daily quests.");
    } finally {
      setSavingQuest(false);
    }
  };

  return (
    <Page maxWidth={660}>
      <PageHeader 
        title={mode === "challenge" ? "New Challenge" : "⚡ Vocab Blitz"} 
        subtitle={mode === "challenge" ? "Choose your language, pick a phrase, then battle! ⚔️" : "Generate 20 words from AI, learn them, and complete daily quests! 📖"} 
      />

      {/* Tabs */}
      <div style={{ display: "flex", background: "rgba(255,26,26,0.05)", border: `2px solid ${C.border}`, borderRadius: 14, padding: 4, marginBottom: 20 }}>
        <button onClick={() => { setMode("challenge"); setBlitzWords([]); setCompleted(false); }}
          style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", cursor: "pointer", background: mode === "challenge" ? C.red : "transparent", color: mode === "challenge" ? "#fff" : C.textMuted, fontWeight: 800, fontSize: 13, transition: "all 0.25s", ...ui }}
        >⚔️ Battle Challenge</button>
        <button onClick={() => { setMode("blitz"); setBlitzWords([]); setCompleted(false); }}
          style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", cursor: "pointer", background: mode === "blitz" ? C.red : "transparent", color: mode === "blitz" ? "#fff" : C.textMuted, fontWeight: 800, fontSize: 13, transition: "all 0.25s", ...ui }}
        >⚡ Vocab Blitz</button>
      </div>

      {mode === "challenge" ? (
        <>
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
        </>
      ) : (
        /* Vocab Blitz Mode */
        <div>
          {blitzWords.length === 0 ? (
            /* Setup State */
            <Card style={{ padding: 26, borderTop: `3px solid ${C.green}` }} glowColor={C.green}>
              {blitzLoading ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 0", gap: 20 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    border: `3px solid rgba(76,175,125,0.1)`,
                    borderTop: `3px solid ${C.green}`,
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                    boxShadow: `0 0 10px ${C.green}33`
                  }} />
                  <span style={{ ...pixel, fontSize: 8, color: C.textMuted, letterSpacing: 1, animation: "pulse 1.5s infinite" }}>GENERATING 20 WORDS WITH AI...</span>
                </div>
              ) : (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                    <div>
                      <div style={{ ...ui, fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Source Language</div>
                      <div style={{ position: "relative" }}>
                        <select value={blitzFrom} onChange={(e) => setBlitzFrom(e.target.value)} style={selStyle}>
                          {["Tagalog", "English", "Bisaya"].map((l) => <option key={l}>{l}</option>)}
                        </select>
                        <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: C.textMuted, pointerEvents: "none", fontSize: 11 }}>▾</span>
                      </div>
                    </div>
                    <div>
                      <div style={{ ...ui, fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Target Language</div>
                      <div style={{ position: "relative" }}>
                        <select value={blitzTo} onChange={(e) => setBlitzTo(e.target.value)} style={selStyle}>
                          {["Bisaya", "Cebuano", "Tagalog", "Ilocano", "Hiligaynon", "Waray", "Kapampangan"].map((l) => <option key={l}>{l}</option>)}
                        </select>
                        <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: C.textMuted, pointerEvents: "none", fontSize: 11 }}>▾</span>
                      </div>
                    </div>
                  </div>

                  {blitzError && (
                    <div style={{ background: "rgba(255,26,26,0.06)", border: `1.5px solid ${C.red}33`, padding: "10px 14px", borderRadius: 8, color: C.redLight, fontSize: 12, marginBottom: 16, ...ui }}>
                      ⚠️ {blitzError}
                    </div>
                  )}

                  <Btn color={C.green} onClick={startBlitz} full size="lg">⚡ Start Vocab Blitz</Btn>
                </div>
              )}
            </Card>
          ) : completed ? (
            /* Victory screen */
            <Card style={{ padding: 36, textAlign: "center", borderTop: `4px solid ${C.gold}` }} glowColor={C.gold}>
              <div style={{ fontSize: 54, marginBottom: 16, animation: "bounce 2s infinite" }}>🏆</div>
              <h2 style={{ ...pixel, fontSize: 14, color: C.gold, letterSpacing: 2, marginBottom: 12 }}>VOCAB BLITZ COMPLETE!</h2>
              <p style={{ ...ui, fontSize: 14, color: C.text, margin: "0 auto 24px", maxWidth: 380, lineHeight: 1.5 }}>
                Fantastic! You successfully learned 20 new words today in <b>{blitzFrom} → {blitzTo}</b>. Your daily quest is updated!
              </p>
              
              <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(255,215,0,0.08)", border: `1.5px solid ${C.gold}33`, padding: "12px 24px", borderRadius: 14, marginBottom: 28 }}>
                <span style={{ fontSize: 20 }}>💎</span>
                <span style={{ ...mono, fontSize: 18, fontWeight: 800, color: C.gold }}>+100 XP REWARD CLAIMED</span>
              </div>

              <div>
                <Btn color={C.red} onClick={() => { setBlitzWords([]); setCompleted(false); setMode("challenge"); }} size="md">Back to Challenges</Btn>
              </div>
            </Card>
          ) : (
            /* Flashcard screen */
            <Card style={{ padding: 24, borderTop: `3px solid ${C.green}` }} glowColor={C.green}>
              {/* Progress */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{ ...pixel, fontSize: 8, color: C.textMuted }}>CARD {blitzIdx + 1} OF {blitzWords.length}</span>
                <span style={{ ...mono, fontSize: 11, color: C.green }}>{Math.round(((blitzIdx) / blitzWords.length) * 100)}%</span>
              </div>
              <div style={{ marginBottom: 24 }}>
                <ProgressBar pct={(blitzIdx / blitzWords.length) * 100} color={C.green} height={6} />
              </div>

              {/* Word Box */}
              <div 
                onClick={() => setFlipped(!flipped)}
                style={{ 
                  background: flipped ? "rgba(76,175,125,0.03)" : "rgba(255,255,255,0.01)", 
                  border: `2px dashed ${flipped ? C.green + "44" : C.border}`, 
                  borderRadius: 16, 
                  padding: "48px 24px", 
                  textAlign: "center", 
                  marginBottom: 24, 
                  cursor: "pointer",
                  minHeight: 200,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  transition: "all 0.2s"
                }}
              >
                {!flipped ? (
                  <div>
                    <div style={{ ...pixel, fontSize: 8, color: C.textMuted, marginBottom: 14, letterSpacing: "0.1em" }}>WORD</div>
                    <div style={{ ...ui, fontSize: 32, fontWeight: 900, color: C.text }}>{blitzWords[blitzIdx].word}</div>
                    <div style={{ ...ui, fontSize: 11, color: C.green, marginTop: 24, fontWeight: 700 }}>Click card to reveal translation 👁️</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ ...pixel, fontSize: 8, color: C.green, marginBottom: 14, letterSpacing: "0.1em" }}>TRANSLATION</div>
                    <div style={{ ...ui, fontSize: 32, fontWeight: 900, color: C.green }}>{blitzWords[blitzIdx].translation}</div>
                    <div style={{ width: 40, height: 2, background: C.green + "33", margin: "16px auto" }} />
                    <p style={{ ...ui, fontSize: 13, color: C.textMuted, margin: 0, maxWidth: 300, lineHeight: 1.5 }}>{blitzWords[blitzIdx].explanation}</p>
                    <div style={{ ...ui, fontSize: 10, color: C.textMuted, marginTop: 20 }}>Click card to hide translation 👁️‍🗨️</div>
                  </div>
                )}
              </div>

              {/* Navigation buttons */}
              <div style={{ display: "flex", gap: 12, justifyContent: "space-between", alignItems: "center" }}>
                <button 
                  disabled={blitzIdx === 0}
                  onClick={() => { setBlitzIdx((i) => i - 1); setFlipped(false); }}
                  style={{ ...ui, fontSize: 12, fontWeight: 700, color: blitzIdx === 0 ? C.textMuted + "44" : C.textMuted, background: "transparent", border: `1.5px solid ${blitzIdx === 0 ? "rgba(255,255,255,0.03)" : C.border}`, borderRadius: 10, padding: "10px 18px", cursor: blitzIdx === 0 ? "not-allowed" : "pointer", transition: "all 0.15s" }}
                >← Prev</button>

                {blitzIdx < blitzWords.length - 1 ? (
                  <Btn color={C.green} size="md" onClick={() => { setBlitzIdx((i) => i + 1); setFlipped(false); }}>Next Word →</Btn>
                ) : (
                  <Btn color={C.gold} size="md" disabled={savingQuest} onClick={handleFinishBlitz}>
                    {savingQuest ? "Saving..." : "Finish Blitz 🏆"}
                  </Btn>
                )}
              </div>
            </Card>
          )}
        </div>
      )}
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
  type MainTab = "global" | "language" | "weekly";
  const languages = ["Bisaya", "Hiligaynon", "Ilokano", "Kapampangan", "Waray"] as const;
  type Lang = typeof languages[number];
  const [mainTab, setMainTab] = useState<MainTab>("global");
  const [selectedLang, setSelectedLang] = useState<Lang>("Bisaya");

  // Player data per language
  type PlayerEntry = { name: string; xp: number; rank: Rank; flag: string; streak: number; avatar: string; me: boolean };
  const globalData: PlayerEntry[] = [
      { name: "PIXEL_MASTER",  xp: 14200, rank: "Sirena",      flag: "🇵🇭", streak: 45, avatar: "🧑",   me: false },
      { name: "NEON_LINGUIST", xp: 11800, rank: "Sirena",      flag: "🇵🇭", streak: 32, avatar: "👩",   me: false },
      { name: "ARCADE_NINJA",  xp: 9600,  rank: "Aswang",      flag: "🇵🇭", streak: 28, avatar: "🧙",   me: false },
      { name: "BYTE_SPEAKER",  xp: 8200,  rank: "Aswang",      flag: "🇵🇭", streak: 21, avatar: "🤖",   me: false },
      { name: "GLITCH_TONGUE", xp: 5900,  rank: "Manananggal", flag: "🇵🇭", streak: 15, avatar: "🦊",   me: false },
      { name: "PLAYER_ONE",    xp: 4750,  rank: "Manananggal", flag: "🇵🇭", streak: 7,  avatar: "🧑‍💻", me: true  },
      { name: "RETRO_TALKER",  xp: 2300,  rank: "Tikbalang",   flag: "🇵🇭", streak: 9,  avatar: "🎮",   me: false },
      { name: "LANG_ROOKIE",   xp: 800,   rank: "Nuno",        flag: "🇵🇭", streak: 3,  avatar: "🌱",   me: false },
    ];

  const languageData: Record<Lang, PlayerEntry[]> = {
    Bisaya: [
      { name: "CEBU_KING",     xp: 12400, rank: "Sirena",      flag: "🇵🇭", streak: 50, avatar: "👑",   me: false },
      { name: "VISAYAN_PRO",   xp: 9800,  rank: "Aswang",      flag: "🇵🇭", streak: 33, avatar: "🌊",   me: false },
      { name: "ISLAND_VOICE",  xp: 7600,  rank: "Aswang",      flag: "🇵🇭", streak: 22, avatar: "🏝️",   me: false },
      { name: "SUGBO_MASTER",  xp: 6100,  rank: "Manananggal", flag: "🇵🇭", streak: 18, avatar: "�",   me: false },
      { name: "PLAYER_ONE",    xp: 4200,  rank: "Manananggal", flag: "🇵🇭", streak: 7,  avatar: "🧑‍💻", me: true  },
      { name: "BISAYA_NOOB",   xp: 2800,  rank: "Tikbalang",   flag: "🇵🇭", streak: 11, avatar: "🐣",   me: false },
      { name: "DIALECT_FAN",   xp: 1500,  rank: "Tikbalang",   flag: "🇵🇭", streak: 5,  avatar: "📖",   me: false },
      { name: "NEW_LEARNER",   xp: 600,   rank: "Nuno",        flag: "🇵🇭", streak: 2,  avatar: "🌱",   me: false },
    ],
    Hiligaynon: [
      { name: "ILONGGO_ACE",   xp: 11200, rank: "Sirena",      flag: "🇵🇭", streak: 40, avatar: "🎯",   me: false },
      { name: "PANAY_PRIDE",   xp: 8900,  rank: "Aswang",      flag: "🇵🇭", streak: 29, avatar: "🌺",   me: false },
      { name: "HILIG_MASTER",  xp: 7200,  rank: "Aswang",      flag: "🇵🇭", streak: 20, avatar: "🔥",   me: false },
      { name: "PLAYER_ONE",    xp: 3100,  rank: "Manananggal", flag: "🇵🇭", streak: 7,  avatar: "🧑‍💻", me: true  },
      { name: "SUGAR_LAND",    xp: 2400,  rank: "Tikbalang",   flag: "🇵🇭", streak: 8,  avatar: "🍬",   me: false },
      { name: "WEST_VIS",      xp: 1800,  rank: "Tikbalang",   flag: "🇵🇭", streak: 6,  avatar: "🧭",   me: false },
      { name: "ILOILO_KID",    xp: 900,   rank: "Nuno",        flag: "🇵🇭", streak: 4,  avatar: "🎮",   me: false },
      { name: "FRESH_START",   xp: 400,   rank: "Nuno",        flag: "🇵🇭", streak: 1,  avatar: "✨",   me: false },
    ],
    Ilokano: [
      { name: "NORTE_LEGEND",  xp: 13500, rank: "Sirena",      flag: "🇵🇭", streak: 55, avatar: "⭐",   me: false },
      { name: "ILOCOS_BEST",   xp: 10200, rank: "Sirena",      flag: "🇵🇭", streak: 38, avatar: "🏔️",   me: false },
      { name: "CORDILLERA",    xp: 8100,  rank: "Aswang",      flag: "🇵🇭", streak: 25, avatar: "🦅",   me: false },
      { name: "VIGAN_VOICE",   xp: 6500,  rank: "Manananggal", flag: "🇵🇭", streak: 19, avatar: "🏛️",   me: false },
      { name: "LAOAG_STAR",    xp: 4900,  rank: "Manananggal", flag: "🇵🇭", streak: 14, avatar: "💫",   me: false },
      { name: "PLAYER_ONE",    xp: 2100,  rank: "Tikbalang",   flag: "🇵🇭", streak: 7,  avatar: "🧑‍💻", me: true  },
      { name: "PINOY_LEARNER", xp: 1200,  rank: "Tikbalang",   flag: "🇵🇭", streak: 4,  avatar: "📚",   me: false },
      { name: "BAGONG_ARAL",   xp: 500,   rank: "Nuno",        flag: "🇵🇭", streak: 2,  avatar: "🌱",   me: false },
    ],
    Kapampangan: [
      { name: "PAMPANGA_PRO",  xp: 10800, rank: "Sirena",      flag: "🇵🇭", streak: 42, avatar: "🎖️",   me: false },
      { name: "SISIG_KING",    xp: 8400,  rank: "Aswang",      flag: "🇵🇭", streak: 30, avatar: "🍳",   me: false },
      { name: "KAPAMP_HERO",   xp: 6800,  rank: "Manananggal", flag: "🇵🇭", streak: 22, avatar: "🛡️",   me: false },
      { name: "PLAYER_ONE",    xp: 3800,  rank: "Manananggal", flag: "🇵🇭", streak: 7,  avatar: "🧑‍💻", me: true  },
      { name: "ANGELES_FAN",   xp: 2600,  rank: "Tikbalang",   flag: "🇵🇭", streak: 10, avatar: "😇",   me: false },
      { name: "TARLAC_KID",    xp: 1400,  rank: "Tikbalang",   flag: "🇵🇭", streak: 5,  avatar: "🎮",   me: false },
      { name: "LUZON_NOOB",    xp: 700,   rank: "Nuno",        flag: "🇵🇭", streak: 3,  avatar: "🐣",   me: false },
      { name: "DAY_ONE",       xp: 200,   rank: "Nuno",        flag: "🇵🇭", streak: 1,  avatar: "🌱",   me: false },
    ],
    Waray: [
      { name: "LEYTE_LEGEND",  xp: 9200,  rank: "Aswang",      flag: "🇵🇭", streak: 36, avatar: "🌋",   me: false },
      { name: "SAMAR_STAR",    xp: 7500,  rank: "Aswang",      flag: "🇵🇭", streak: 24, avatar: "⚡",   me: false },
      { name: "TACLOBAN_ACE",  xp: 5800,  rank: "Manananggal", flag: "🇵🇭", streak: 17, avatar: "🎯",   me: false },
      { name: "EASTERN_VIS",   xp: 4100,  rank: "Manananggal", flag: "🇵🇭", streak: 12, avatar: "🌊",   me: false },
      { name: "PLAYER_ONE",    xp: 1900,  rank: "Tikbalang",   flag: "🇵🇭", streak: 7,  avatar: "🧑‍💻", me: true  },
      { name: "WARAY_NEWBIE",  xp: 1100,  rank: "Tikbalang",   flag: "🇵🇭", streak: 4,  avatar: "📖",   me: false },
      { name: "REGION_EIGHT",  xp: 650,   rank: "Nuno",        flag: "🇵🇭", streak: 3,  avatar: "🎮",   me: false },
      { name: "FIRST_TIMER",   xp: 300,   rank: "Nuno",        flag: "🇵🇭", streak: 1,  avatar: "🌱",   me: false },
    ],
  };

  // Weekly data — shuffled XP values to simulate weekly rankings
  const weeklyData: PlayerEntry[] = [
    { name: "ARCADE_NINJA",  xp: 2400, rank: "Aswang",      flag: "🇵🇭", streak: 28, avatar: "🧙",   me: false },
    { name: "PIXEL_MASTER",  xp: 2100, rank: "Sirena",      flag: "🇵🇭", streak: 45, avatar: "🧑",   me: false },
    { name: "PLAYER_ONE",    xp: 1850, rank: "Manananggal", flag: "🇵🇭", streak: 7,  avatar: "🧑‍💻", me: true  },
    { name: "NEON_LINGUIST", xp: 1600, rank: "Sirena",      flag: "🇵🇭", streak: 32, avatar: "👩",   me: false },
    { name: "BYTE_SPEAKER",  xp: 1400, rank: "Aswang",      flag: "🇵🇭", streak: 21, avatar: "🤖",   me: false },
    { name: "GLITCH_TONGUE", xp: 1200, rank: "Manananggal", flag: "🇵🇭", streak: 15, avatar: "🦊",   me: false },
    { name: "RETRO_TALKER",  xp: 980,  rank: "Tikbalang",   flag: "🇵🇭", streak: 9,  avatar: "🎮",   me: false },
    { name: "CEBU_KING",     xp: 870,  rank: "Sirena",      flag: "🇵🇭", streak: 50, avatar: "👑",   me: false },
    { name: "LANG_ROOKIE",   xp: 650,  rank: "Nuno",        flag: "🇵🇭", streak: 3,  avatar: "🌱",   me: false },
    { name: "NEW_LEARNER",   xp: 320,  rank: "Nuno",        flag: "🇵🇭", streak: 2,  avatar: "🌱",   me: false },
  ];

  const players = mainTab === "global" ? globalData : mainTab === "language" ? languageData[selectedLang] : weeklyData;
  const medals = ["🥇", "🥈", "🥉"];
  const subtitle = mainTab === "global" ? "Global ranking by total XP earned" : mainTab === "language" ? `Top players in ${selectedLang}` : "Top performers this week";

  return (
    <Page maxWidth={700}>
      <PageHeader title="★ Leaderboard" subtitle={subtitle} />

      {/* Podium — top 3 */}
      {players.length >= 3 && (
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
      )}

      {/* Tab bar: Global | Language | Weekly */}
      <div style={{ display: "flex", background: "rgba(255,26,26,0.05)", border: `2px solid ${C.border}`, borderRadius: 14, padding: 4, marginBottom: 16 }}>
        {([
          { key: "global" as MainTab, label: "🌏 Global" },
          { key: "language" as MainTab, label: "🗣️ Language" },
          { key: "weekly" as MainTab, label: "📅 Weekly" },
        ]).map((t) => (
          <button key={t.key} onClick={() => setMainTab(t.key)}
            style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", cursor: "pointer", background: mainTab === t.key ? C.red : "transparent", color: mainTab === t.key ? "#fff" : C.textMuted, fontWeight: 800, fontSize: 13, transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)", boxShadow: mainTab === t.key ? `0 0 14px ${C.red}55` : "none", transform: mainTab === t.key ? "scale(1.02)" : "scale(1)", ...ui }}
          >{t.label}</button>
        ))}
      </div>

      {/* Language dropdown — only shown when Language tab is active */}
      {mainTab === "language" && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ position: "relative", width: 220 }}>
            <select value={selectedLang} onChange={(e) => setSelectedLang(e.target.value as Lang)}
              style={{ ...ui, width: "100%", background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "10px 36px 10px 14px", color: C.text, fontSize: 13, fontWeight: 700, outline: "none", cursor: "pointer", appearance: "none" }}>
              {languages.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: C.textMuted, pointerEvents: "none", fontSize: 12 }}>▾</span>
          </div>
        </div>
      )}

      {/* Player list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {players.map((p, i) => (
          <Card key={p.name + mainTab + (mainTab === "language" ? selectedLang : "")} style={{ padding: "11px 14px", display: "flex", alignItems: "center", gap: 12, ...(p.me ? { border: `1.5px solid ${C.red}44`, background: "rgba(255,26,26,0.04)" } : {}) }} glowColor={p.me ? C.red : undefined}>
            <div style={{ width: 22, textAlign: "center", flexShrink: 0 }}>
              {i < 3 ? <span style={{ fontSize: 16 }}>{medals[i]}</span> : <span style={{ ...mono, fontSize: 11, color: C.textMuted }}>{i + 1}</span>}
            </div>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(255,26,26,0.04)", border: `1.5px solid ${RANKS[p.rank].color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{p.avatar}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ ...ui, fontSize: 12, fontWeight: 800, color: p.me ? C.redLight : C.text }}>{p.name}</span>
                <span style={{ fontSize: 11 }}>{p.flag}</span>
                {p.me && <span style={{ ...pixel, fontSize: 6, color: "#fff", background: C.red, padding: "2px 6px", borderRadius: 4 }}>YOU</span>}
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
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState({
    first_blood: false,
    hot_streak: false,
    sirena_quest: false,
    polyglot: false,
    speed_demon: false,
    perfect_score: false,
    top_rank: false,
    book_worm: false,
  });

  useEffect(() => {
    let active = true;

    async function fetchAchievements() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          if (active) {
            setLoading(false);
          }
          return;
        }

        const { data, error } = await supabase
          .from("achievements")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (active) {
          if (error) {
            console.error("Error fetching achievements:", error);
          } else if (data) {
            setAchievements({
              first_blood: !!data.first_blood,
              hot_streak: !!data.hot_streak,
              sirena_quest: !!data.sirena_quest,
              polyglot: !!data.polyglot,
              speed_demon: !!data.speed_demon,
              perfect_score: !!data.perfect_score,
              top_rank: !!data.top_rank,
              book_worm: !!data.book_worm,
            });
          }
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load session/achievements:", err);
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchAchievements();

    return () => {
      active = false;
    };
  }, [navigate]);

  const items = [
    { icon: "🏆", title: "First Blood",   desc: "Complete your first translation", done: achievements.first_blood,   color: C.gold },
    { icon: "🔥", title: "Hot Streak",    desc: "Maintain a 7-day streak",         done: achievements.hot_streak,    color: C.orange },
    { icon: "🧜‍♀️", title: "Sirena Quest",  desc: "Reach Sirena rank",               done: achievements.sirena_quest,  color: C.cyan },
    { icon: "🌍", title: "Polyglot",      desc: "Start learning 5 dialects",       done: achievements.polyglot,      color: C.green },
    { icon: "⚡", title: "Speed Demon",   desc: "100 translations in one day",     done: achievements.speed_demon,   color: C.red },
    { icon: "🎯", title: "Perfect Score", desc: "Score 100 on any evaluation",     done: achievements.perfect_score, color: C.green },
    { icon: "👑", title: "Top Rank",      desc: "Reach #1 on the leaderboard",     done: achievements.top_rank,      color: C.gold },
    { icon: "📚", title: "Bookworm",      desc: "Learn 500 phrases",               done: achievements.book_worm,     color: C.red },
  ];

  if (loading) {
    return (
      <Page>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", gap: 20 }}>
          <div style={{
            width: 40,
            height: 40,
            border: `3px solid rgba(255,26,26,0.1)`,
            borderTop: `3px solid ${C.red}`,
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            boxShadow: `0 0 10px ${C.red}33`
          }} />
          <span style={{ ...pixel, fontSize: 8, color: C.textMuted, letterSpacing: 1, animation: "pulse 1.5s infinite" }}>LOADING ACHIEVEMENTS...</span>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader title="🏆 Achievements" subtitle={`${items.filter((a) => a.done).length} of ${items.length} unlocked — keep going!`} />

      <Card style={{ padding: "28px 20px", marginBottom: 24, borderTop: `3px solid ${C.red}` }} glowColor={C.red}>
        <div style={{ ...pixel, fontSize: 9, color: C.text, marginBottom: 24, letterSpacing: "0.05em" }}>MYTHICAL RANK PATH</div>
        <div style={{ overflowX: "auto", paddingBottom: 8 }}>
          <div style={{ display: "inline-flex", alignItems: "center" }}>
            {(Object.keys(RANKS) as Rank[]).map((r, i) => {
              return (
                <div key={r} style={{ display: "contents" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 100, flexShrink: 0 }}>
                    <div style={{ width: 72, height: 72, borderRadius: "50%", background: RANKS[r].bg, border: `2.5px solid ${RANKS[r].color}66`, boxShadow: RANKS[r].glow, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <img src={RANK_SVGS[r]} alt={r} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    </div>
                    <span style={{ ...ui, fontSize: 11, fontWeight: 700, color: RANKS[r].color, textAlign: "center", marginTop: 8 }}>{r}</span>
                    <span style={{ ...mono, fontSize: 9, color: C.textMuted, marginTop: 4 }}>{RANKS[r].tier}</span>
                    <span style={{ ...mono, fontSize: 8, color: C.textMuted, marginTop: 2 }}>{RANKS[r].min / 1000}k XP</span>
                  </div>
                  {i < Object.keys(RANKS).length - 1 && (
                    <div style={{ width: 24, height: 2, background: `linear-gradient(90deg, ${RANKS[r].color}55, ${RANKS[(Object.keys(RANKS) as Rank[])[i + 1]].color}55)`, borderRadius: 1, flexShrink: 0, marginBottom: 52 }} />
                  )}
                </div>
              );
            })}
            {/* Connector from last rank to coming soon */}
            <div style={{ width: 24, height: 2, background: `linear-gradient(90deg, ${RANKS.Sirena.color}44, rgba(255,255,255,0.08))`, borderRadius: 1, flexShrink: 0, marginBottom: 52 }} />
            {/* Coming soon blacked-out ranks */}
            {COMING_SOON_RANKS.map((cs, i) => (
              <div key={`cs-${i}`} style={{ display: "contents" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 100, flexShrink: 0 }}>
                  <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(255,255,255,0.02)", border: "2.5px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 22, opacity: 0.25 }}>🔒</span>
                  </div>
                  <span style={{ ...ui, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.15)", textAlign: "center", marginTop: 8 }}>{cs.name}</span>
                  <span style={{ ...mono, fontSize: 9, color: "rgba(255,255,255,0.1)", marginTop: 4 }}>???</span>
                  <span style={{ ...mono, fontSize: 8, color: "rgba(255,255,255,0.1)", marginTop: 2 }}>{cs.min} XP</span>
                </div>
                {i < COMING_SOON_RANKS.length - 1 && (
                  <div style={{ width: 24, height: 2, background: "rgba(255,255,255,0.04)", borderRadius: 1, flexShrink: 0, marginBottom: 52 }} />
                )}
              </div>
            ))}
          </div>
        </div>
        <div style={{ ...ui, fontSize: 11, color: "rgba(255,255,255,0.25)", textAlign: "center", marginTop: 18, fontStyle: "italic" }}>More mythical ranks coming soon…</div>
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
  const [loading, setLoading] = useState(true);
  const [dailyQuest, setDailyQuest] = useState({
    translation_sprint: false,
    accent_master: false,
    vocab_blitz: false,
    community_share: false,
  });
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchDailyQuests() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          if (active) {
            navigate("/login");
          }
          return;
        }

        const { data, error } = await supabase
          .from("daily_quest")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (active) {
          if (error) {
            console.error("Error fetching daily quests:", error);
          } else if (data) {
            setDailyQuest({
              translation_sprint: !!data.translation_sprint,
              accent_master: !!data.accent_master,
              vocab_blitz: !!data.vocab_blitz,
              community_share: !!data.community_share,
            });
          }
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load session/daily quests:", err);
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchDailyQuests();

    return () => {
      active = false;
    };
  }, [navigate]);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      const pad = (num: number) => String(num).padStart(2, "0");
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    };

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const quests = [
    { title: "Translation Sprint", desc: "Translate 10 phrases today",           xp: 200, color: C.red, icon: "⚡", done: dailyQuest.translation_sprint },
    { title: "Accent Master",      desc: "Score 90+ on pronunciation",         xp: 150, color: C.cyan, icon: "🎤", done: dailyQuest.accent_master },
    { title: "Vocab Blitz",        desc: "Learn 20 new words today",           xp: 100, color: C.green, icon: "📖", done: dailyQuest.vocab_blitz },
    { title: "Community Share",    desc: "Contribute 5 voice recordings",      xp: 75,  color: C.gold, icon: "🤝", done: dailyQuest.community_share },
  ];

  if (loading) {
    return (
      <Page>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", gap: 20 }}>
          <div style={{
            width: 40,
            height: 40,
            border: `3px solid rgba(255,26,26,0.1)`,
            borderTop: `3px solid ${C.red}`,
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            boxShadow: `0 0 10px ${C.red}33`
          }} />
          <span style={{ ...pixel, fontSize: 8, color: C.textMuted, letterSpacing: 1, animation: "pulse 1.5s infinite" }}>LOADING QUESTS...</span>
        </div>
      </Page>
    );
  }

  return (
    <Page maxWidth={700}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "start", marginBottom: 28 }}>
        <PageHeader title="⚡ Daily Quests" subtitle="Complete all 4 for a bonus XP reward!" />
        <Card style={{ padding: "14px 20px", textAlign: "center", borderTop: `3px solid ${C.red}` }} glowColor={C.red}>
          <div style={{ ...pixel, fontSize: 7, color: C.textMuted, marginBottom: 4, letterSpacing: "0.1em" }}>RESETS IN</div>
          <div style={{ ...mono, fontSize: 20, color: C.red, fontWeight: 700, letterSpacing: 3, textShadow: `0 0 12px ${C.red}55` }}>{timeLeft}</div>
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
                {!q.done && <Btn color={q.color} size="sm" onClick={() => navigate("/play")}>Start →</Btn>}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Page>
  );
}

// ─── Screen: Profile ──────────────────────────────────────────────────────────

function ProfileScreen({ xp, rank, playerName, onNameChange, equippedBanner, setEquippedBanner, equippedAvatar, setEquippedAvatar }: { xp: number; rank: Rank; playerName: string; onNameChange: (name: string) => void; equippedBanner: string | null; setEquippedBanner: (v: string | null) => void; equippedAvatar: Rank | null; setEquippedAvatar: (v: Rank | null) => void }) {
  const cfg = RANKS[rank];
  const pct = Math.min(100, ((xp - cfg.min) / (cfg.max - cfg.min)) * 100);
  const rankKeys = Object.keys(RANKS) as Rank[];
  const nextRank = rankKeys[Math.min(rankKeys.indexOf(rank) + 1, rankKeys.length - 1)];
  const [editMode, setEditMode] = useState(false);
  const [nameInput, setNameInput] = useState(playerName);

  // Get all unlocked banners/avatars up to current rank
  const currentRankIdx = rankKeys.indexOf(rank);
  const unlockedBanners: { name: string; gradient: string; rank: Rank }[] = [];
  const unlockedAvatars: Rank[] = [];
  rankKeys.forEach((r, i) => {
    if (i <= currentRankIdx) {
      RANK_BANNERS[r].forEach((b) => unlockedBanners.push({ ...b, rank: r }));
      unlockedAvatars.push(r);
    }
  });

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

  const activeBanner = unlockedBanners.find((b) => b.name === equippedBanner);
  const activeAvatarRank = equippedAvatar;
  const avatarBorderColor = activeAvatarRank ? RANKS[activeAvatarRank].color : cfg.color;

  return (
    <Page maxWidth={920}>
      {/* Main profile card — full width, prominent */}
      <Card style={{ padding: 0, overflow: "hidden", marginBottom: 24, border: `1.5px solid ${cfg.color}22` }} glowColor={cfg.color}>
        <div style={{ height: 160, width: "100%", background: activeBanner ? activeBanner.gradient : `linear-gradient(120deg, #0a0a0a 0%, #131318 30%, #1a1a22 50%, #131318 70%, #0a0a0a 100%)`, position: "relative", transition: "all 0.5s ease" }}>
          {/* Banner overlay layers */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 30%, rgba(0,0,0,0.6) 100%)" }} />
          {/* Animated shimmer on banner */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 55%, transparent 60%)", backgroundSize: "200% 100%", animation: "shimmer 6s linear infinite" }} />
          {/* Decorative corner accents */}
          <div style={{ position: "absolute", top: 12, left: 12, width: 40, height: 40, borderTop: `2px solid ${cfg.color}33`, borderLeft: `2px solid ${cfg.color}33`, borderRadius: "6px 0 0 0" }} />
          <div style={{ position: "absolute", top: 12, right: 12, width: 40, height: 40, borderTop: `2px solid ${cfg.color}33`, borderRight: `2px solid ${cfg.color}33`, borderRadius: "0 6px 0 0" }} />
          {/* Banner name tag */}
          {activeBanner && <div style={{ position: "absolute", bottom: 12, right: 14, ...pixel, fontSize: 7, color: "rgba(255,255,255,0.7)", background: "rgba(0,0,0,0.6)", padding: "4px 12px", borderRadius: 6, backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.1)" }}>{activeBanner.name}</div>}
        </div>
        <div style={{ padding: "20px 36px 36px" }}>
          <div style={{ display: "flex", gap: 24 }}>
            <div style={{ position: "relative", flexShrink: 0, marginTop: -70 }}>
              <div style={{ width: 110, height: 110, borderRadius: 22, background: `linear-gradient(135deg, #0a0a0a, ${C.surface})`, border: `4px solid ${avatarBorderColor}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 24px ${avatarBorderColor}55, 0 8px 32px rgba(0,0,0,0.5)`, overflow: "hidden" }}>
                {activeAvatarRank ? (<img src={RANK_ICONS[activeAvatarRank]} alt={activeAvatarRank} style={{ width: "100%", height: "100%", objectFit: "cover" }} />) : (<span style={{ fontSize: 44 }}>🧑‍💻</span>)}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                <h2 style={{ ...ui, fontSize: 26, fontWeight: 900, color: C.text, margin: 0, letterSpacing: "-0.02em" }}>{playerName}</h2>
                <span style={{ ...pixel, fontSize: 8, color: cfg.color, background: cfg.bg, border: `1.5px solid ${cfg.color}44`, padding: "5px 12px", borderRadius: 8, boxShadow: `0 0 10px ${cfg.color}22` }}>{rank}</span>
              </div>
              <div style={{ ...ui, fontSize: 13, color: C.textMuted, marginBottom: 14 }}>Joined June 2024 · #00142 · <span style={{ color: C.orange }}>🔥 7-day streak</span></div>
              <div style={{ maxWidth: 380 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ ...ui, fontSize: 11, color: C.textMuted }}>{rank === "Sirena" ? "✦ Max Rank" : `→ ${nextRank}`}</span>
                  <span style={{ ...mono, fontSize: 11, color: cfg.color, fontWeight: 700 }}>{xp.toLocaleString()} / {cfg.max.toLocaleString()} XP</span>
                </div>
                <ProgressBar pct={pct} color={cfg.color} height={9} />
                <div style={{ ...ui, fontSize: 10, color: C.textMuted, marginTop: 5 }}>{rank === "Sirena" ? "You've reached the top!" : `${(cfg.max - xp).toLocaleString()} XP to go`}</div>
              </div>
            </div>
            <div style={{ flexShrink: 0 }}>
              <Btn color={cfg.color} variant="outline" size="sm" onClick={() => setEditMode(true)}>✏️ Edit Profile</Btn>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {stats.map((s, i) => (
          <Card key={s.label} style={{ padding: "22px 22px", animation: `slideUp 0.4s ease-out ${i * 0.08}s both`, position: "relative", overflow: "hidden" }} glowColor={s.color}>
            <div style={{ position: "absolute", top: -10, right: -10, width: 50, height: 50, borderRadius: "50%", background: `radial-gradient(circle, ${s.color}12, transparent)` }} />
            <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative" }}>
              <span style={{ fontSize: 24 }}>{s.icon}</span>
              <div>
                <div style={{ ...mono, fontSize: 24, color: s.color, fontWeight: 800 }}>{s.val}</div>
                <div style={{ ...ui, fontSize: 11, color: C.textMuted, marginTop: 2 }}>{s.label}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Badges */}
      <Card style={{ padding: 22 }} glowColor={C.red}>
        <div style={{ ...ui, fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 14 }}>🛡️ Badges</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
          {badges.map((b, i) => (
            <div key={b.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "16px 8px", borderRadius: 12, background: b.earned ? "rgba(255,26,26,0.04)" : "rgba(255,255,255,0.02)", opacity: b.earned ? 1 : 0.3, border: b.earned ? `1.5px solid ${C.red}22` : "1.5px solid transparent" }}>
              <span style={{ fontSize: 26, animation: b.earned ? "bounce 3s ease-in-out infinite" : "none", animationDelay: `${i * 0.3}s` }}>{b.icon}</span>
              <span style={{ ...ui, fontSize: 10, color: C.textMuted, textAlign: "center", fontWeight: 600 }}>{b.label}</span>
              {b.earned && <span style={{ ...ui, fontSize: 9, color: C.green, fontWeight: 700 }}>Unlocked</span>}
            </div>
          ))}
        </div>
      </Card>

      {/* Edit Profile Modal */}
      {editMode && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={() => setEditMode(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }} />
          <div style={{ position: "relative", width: "100%", maxWidth: 580, maxHeight: "85vh", overflowY: "auto", background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 20, padding: 28, boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <h3 style={{ ...ui, fontSize: 18, fontWeight: 900, color: C.text, margin: 0 }}>✏️ Edit Profile</h3>
              <button onClick={() => setEditMode(false)} style={{ background: "rgba(255,26,26,0.08)", border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "6px 12px", color: C.textMuted, cursor: "pointer", fontSize: 12, fontWeight: 700, ...ui }}>✕ Close</button>
            </div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ ...ui, fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Username</div>
              <div style={{ display: "flex", gap: 10 }}>
                <input value={nameInput} onChange={(e) => setNameInput(e.target.value.toUpperCase())} maxLength={16} style={{ ...ui, flex: 1, fontSize: 15, fontWeight: 800, color: C.text, background: "rgba(255,26,26,0.03)", border: `2px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", outline: "none", boxSizing: "border-box" }} onKeyDown={(e) => { if (e.key === "Enter" && nameInput.trim()) { onNameChange(nameInput.trim()); setEditMode(false); } }} />
                <Btn color={C.red} size="sm" onClick={() => { if (nameInput.trim()) { onNameChange(nameInput.trim()); setEditMode(false); } }}>Save</Btn>
              </div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ ...ui, fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Profile Banner</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                <div onClick={() => setEquippedBanner(null)} style={{ height: 56, borderRadius: 10, background: `linear-gradient(135deg, #0a0a0a, ${C.surface})`, border: `2px solid ${!equippedBanner ? cfg.color : C.border}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ ...ui, fontSize: 10, color: C.textMuted }}>None</span></div>
                {unlockedBanners.map((b) => (
                  <div key={b.name} onClick={() => setEquippedBanner(b.name)} style={{ height: 56, borderRadius: 10, background: b.gradient, border: `2px solid ${equippedBanner === b.name ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.06)"}`, cursor: "pointer", position: "relative", transition: "all 0.2s", transform: equippedBanner === b.name ? "scale(1.03)" : "scale(1)" }}>
                    <div style={{ position: "absolute", inset: 0, borderRadius: 8, background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 40%, rgba(0,0,0,0.3) 100%)" }} />
                    <div style={{ position: "absolute", bottom: 4, left: 6, ...ui, fontSize: 8, color: "rgba(255,255,255,0.8)", fontWeight: 700, textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>{b.name}</div>
                    {equippedBanner === b.name && <div style={{ position: "absolute", top: 4, left: 6, fontSize: 10 }}>✓</div>}
                  </div>
                ))}
                {COMING_SOON_BANNERS.map((_, i) => (
                  <div key={`cs-${i}`} style={{ height: 56, borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "2px solid rgba(255,255,255,0.04)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: 0.3 }}><span style={{ fontSize: 10 }}>🔒</span><span style={{ ...ui, fontSize: 7, color: "rgba(255,255,255,0.2)" }}>Soon</span></div>
                ))}
              </div>
            </div>
            <div>
              <div style={{ ...ui, fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Avatar</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
                <div onClick={() => setEquippedAvatar(null)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "8px", borderRadius: 10, cursor: "pointer", border: `2px solid ${!equippedAvatar ? cfg.color : C.border}`, background: !equippedAvatar ? "rgba(255,26,26,0.06)" : "transparent" }}><div style={{ width: 40, height: 40, borderRadius: 10, background: `linear-gradient(135deg, #1a0808, ${C.surface})`, border: `2px solid ${cfg.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🧑‍💻</div><span style={{ ...ui, fontSize: 8, color: C.textMuted }}>Default</span></div>
                {unlockedAvatars.map((r) => (
                  <div key={r} onClick={() => setEquippedAvatar(r)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "8px", borderRadius: 10, cursor: "pointer", border: `2px solid ${equippedAvatar === r ? RANKS[r].color : C.border}`, background: equippedAvatar === r ? RANKS[r].bg : "transparent", transition: "all 0.2s" }}><div style={{ width: 40, height: 40, borderRadius: 10, border: `2px solid ${RANKS[r].color}`, overflow: "hidden", boxShadow: equippedAvatar === r ? RANKS[r].glow : "none" }}><img src={RANK_ICONS[r]} alt={r} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div><span style={{ ...ui, fontSize: 8, color: RANKS[r].color, fontWeight: 600 }}>{r}</span></div>
                ))}
                {rankKeys.slice(currentRankIdx + 1).map((r) => (
                  <div key={`l-${r}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "8px", borderRadius: 10, opacity: 0.3 }}><div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "2px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 12 }}>🔒</span></div><span style={{ ...ui, fontSize: 8, color: "rgba(255,255,255,0.2)" }}>{r}</span></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [xp, setXP] = useState(12000);
  const [playerName, setPlayerName] = useState("PLAYER_ONE");
  const [equippedBanner, setEquippedBanner] = useState<string | null>(null);
  const [equippedAvatar, setEquippedAvatar] = useState<Rank | null>(null);
  const rank = getRank(xp);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isLogin = pathname === "/" || pathname === "/login";

  return (
    <div style={{ ...ui, background: C.bg, minHeight: "100vh", color: C.text }}>
      {/* Ambient background layers — retro playful design */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        {/* Base gradient orbs */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 15% 0%, rgba(255,26,26,0.04) 0%, transparent 50%), radial-gradient(ellipse at 85% 100%, rgba(255,26,26,0.025) 0%, transparent 40%), radial-gradient(ellipse at 50% 50%, rgba(79,195,247,0.015) 0%, transparent 60%)" }} />
        {/* Retro grid */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,26,26,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,26,26,0.03) 1px, transparent 1px)", backgroundSize: "80px 80px", maskImage: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.5) 20%, rgba(0,0,0,0.5) 80%, transparent 100%)" }} />
        {/* Scanlines */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)", opacity: 0.5 }} />
        {/* Corner accent glow top-left */}
        <div style={{ position: "absolute", top: -100, left: -100, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,26,26,0.06) 0%, transparent 70%)", animation: "float 15s ease-in-out infinite" }} />
        {/* Corner accent glow bottom-right */}
        <div style={{ position: "absolute", bottom: -100, right: -100, width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(79,195,247,0.04) 0%, transparent 70%)", animation: "float 18s ease-in-out infinite 3s" }} />
        {/* Floating particles */}
        <div style={{ position: "absolute", top: "20%", left: "10%", width: 4, height: 4, borderRadius: "50%", background: C.red, opacity: 0.15, animation: "float 6s ease-in-out infinite", boxShadow: `0 0 6px ${C.red}44` }} />
        <div style={{ position: "absolute", top: "45%", right: "12%", width: 3, height: 3, borderRadius: "50%", background: C.cyan, opacity: 0.12, animation: "float 8s ease-in-out infinite 1s", boxShadow: `0 0 6px ${C.cyan}44` }} />
        <div style={{ position: "absolute", top: "70%", left: "25%", width: 5, height: 5, borderRadius: "50%", background: C.gold, opacity: 0.1, animation: "float 7s ease-in-out infinite 2s", boxShadow: `0 0 8px ${C.gold}44` }} />
        <div style={{ position: "absolute", top: "35%", left: "60%", width: 3, height: 3, borderRadius: "50%", background: C.red, opacity: 0.1, animation: "float 9s ease-in-out infinite 4s", boxShadow: `0 0 6px ${C.red}44` }} />
        <div style={{ position: "absolute", top: "80%", right: "30%", width: 4, height: 4, borderRadius: "50%", background: C.orange, opacity: 0.08, animation: "float 11s ease-in-out infinite 5s", boxShadow: `0 0 6px ${C.orange}44` }} />
        {/* Retro diagonal accent lines */}
        <div style={{ position: "absolute", top: "5%", right: "5%", width: 120, height: 1, background: `linear-gradient(90deg, transparent, ${C.red}15, transparent)`, transform: "rotate(-45deg)", animation: "pulse 4s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: "10%", left: "8%", width: 100, height: 1, background: `linear-gradient(90deg, transparent, ${C.cyan}12, transparent)`, transform: "rotate(30deg)", animation: "pulse 5s ease-in-out infinite 2s" }} />
        <div style={{ position: "absolute", top: "50%", left: "3%", width: 80, height: 1, background: `linear-gradient(90deg, transparent, ${C.gold}10, transparent)`, transform: "rotate(-20deg)", animation: "pulse 6s ease-in-out infinite 1s" }} />
        {/* Noise texture overlay */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.015, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
      </div>
      {!isLogin && <Navbar xp={xp} rank={rank} playerName={playerName} onLogout={async () => { await supabase.auth.signOut(); navigate("/login"); }} />}
      <div style={{ position: "relative", zIndex: 1 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login"        element={<LoginScreen />} />
          <Route path="/home"         element={<HomeScreen xp={xp} rank={rank} playerName={playerName} />} />
          <Route path="/play"         element={<PlayScreen onXP={(n) => setXP((p) => p + n)} />} />
          <Route path="/mission"      element={<MissionScreen />} />
          <Route path="/recording"    element={<RecordingScreen />} />
          <Route path="/evaluation"   element={<EvaluationScreen onXP={(n) => setXP((p) => p + n)} />} />
          <Route path="/leaderboard"  element={<LeaderboardScreen />} />
          <Route path="/achievements" element={<AchievementsScreen />} />
          <Route path="/daily"        element={<DailyScreen />} />
          <Route path="/profile"      element={<ProfileScreen xp={xp} rank={rank} playerName={playerName} onNameChange={setPlayerName} equippedBanner={equippedBanner} setEquippedBanner={setEquippedBanner} equippedAvatar={equippedAvatar} setEquippedAvatar={setEquippedAvatar} />} />
          <Route path="*"             element={<Navigate to="/home" replace />} />
        </Routes>
      </div>
      <style>{`
        * { box-sizing: border-box; scrollbar-width: none; }
        *::-webkit-scrollbar { display: none; }
        select option { background: ${C.surface}; color: ${C.text}; }
        button { transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1); }
        button:hover { filter: brightness(1.1); }
        button:active { transform: scale(0.97); }
        img { transition: transform 0.3s ease; }
        @keyframes coinFly { 0% { transform: translateY(0) scale(1); opacity: 1; } 100% { transform: translateY(-160px) scale(1.4); opacity: 0; } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.9; transform: scale(1.03); } }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        @keyframes wiggle { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-3deg); } 75% { transform: rotate(3deg); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes glow { 0%, 100% { box-shadow: 0 0 5px rgba(255,26,26,0.2); } 50% { box-shadow: 0 0 20px rgba(255,26,26,0.4); } }
      `}</style>
    </div>
  );
}
