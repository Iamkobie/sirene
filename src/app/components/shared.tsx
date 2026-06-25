import { useState } from "react";
import { C, ui, mono, pixel, RANKS, RANK_SVGS, LANGUAGES } from "../constants/theme";
import type { Rank } from "../constants/theme";

// ─── Mermaid / Sirena Logo SVG ────────────────────────────────────────────────
export function SirenaLogo({ size = 32 }: { size?: number }) {
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

export function RankBadge({ rank, size = 32 }: { rank: Rank; size?: number }) {
  const { color, bg, glow } = RANKS[rank];
  return (
    <span title={rank} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: size, height: size, borderRadius: "50%", background: bg, border: `2px solid ${color}66`, flexShrink: 0, boxShadow: glow, overflow: "hidden" }}>
      <img src={RANK_SVGS[rank]} alt={rank} style={{ width: size * 0.65, height: size * 0.65, objectFit: "contain", display: "block" }} />
    </span>
  );
}

export function ProgressBar({ pct, color, height = 7 }: { pct: number; color: string; height?: number }) {
  return (
    <div style={{ height, width: "100%", background: "rgba(255,255,255,0.06)", borderRadius: height, overflow: "hidden", border: `1px solid rgba(255,26,26,0.08)` }}>
      <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: `linear-gradient(90deg, ${color}cc, ${color})`, borderRadius: height, boxShadow: `0 0 12px ${color}55, inset 0 1px 0 rgba(255,255,255,0.3)`, transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)", backgroundSize: "200% 100%", animation: "shimmer 2s linear infinite" }} />
      </div>
    </div>
  );
}

export function Card({ children, style = {}, onClick, glowColor }: { children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void; glowColor?: string }) {
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

export function Btn({ children, color = C.red, onClick, full = false, variant = "solid", size = "md", disabled = false }: {
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

export function Input({ label, type = "text", value, onChange, placeholder }: { label?: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
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

export function PasswordInput({ label, value, onChange, placeholder }: { label?: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
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

export function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
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

export function SectionTitle({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, ...style }}>
      <div style={{ width: 4, height: 18, borderRadius: 2, background: C.red, boxShadow: `0 0 8px ${C.red}66` }} />
      <h2 style={{ ...pixel, fontSize: 10, fontWeight: 700, color: C.text, margin: 0, letterSpacing: "0.05em" }}>{children}</h2>
    </div>
  );
}

export function Page({ children, maxWidth = 860 }: { children: React.ReactNode; maxWidth?: number }) {
  return <main style={{ minHeight: "100vh", paddingTop: 80 }}><div style={{ maxWidth, margin: "0 auto", padding: "40px 24px 60px", animation: "fadeIn 0.3s ease-out" }}>{children}</div></main>;
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h1 style={{ ...ui, fontSize: 28, fontWeight: 900, color: C.text, margin: 0 }}>{title}</h1>
      {subtitle && <p style={{ ...ui, fontSize: 13, color: C.textMuted, margin: "6px 0 0" }}>{subtitle}</p>}
    </div>
  );
}

export function NavButton({ label, icon, active, onClick }: { label: string; icon: string; active: boolean; onClick: () => void }) {
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
