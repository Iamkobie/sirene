import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { C, ui, mono, pixel, RANKS, NAV_ITEMS, RANK_ICONS } from "../constants/theme";
import type { Rank } from "../constants/theme";
import { SirenaLogo, RankBadge, NavButton } from "../components/shared";

export function Navbar({ xp, rank, playerName, onLogout, equippedAvatar }: { xp: number; rank: Rank; playerName: string; onLogout: () => void; equippedAvatar: Rank | null }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const screen = pathname.replace("/", "") || "home";
  const [showMenu, setShowMenu] = useState(false);
  const cfg = RANKS[rank];

  return (
    <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(8,8,8,0.95)", backdropFilter: "blur(24px)", borderBottom: `1.5px solid ${C.border}`, boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
      {/* Logo */}
      <button onClick={() => navigate("/home")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, minWidth: 120 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, #1a0808, ${C.surface})`, border: `1.5px solid ${C.red}44`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 12px ${C.red}22` }}><SirenaLogo size={28} /></div>
        <span style={{ ...pixel, fontSize: 10, color: C.text, letterSpacing: 1 }}>SI<span style={{ color: C.red, textShadow: `0 0 10px ${C.red}88` }}>RENE</span></span>
      </button>

      {/* Nav capsule — absolute centered */}
      <nav style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 3, background: "rgba(20,20,20,0.9)", border: `2px solid rgba(255,26,26,0.18)`, borderRadius: 50, padding: "6px 8px", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.03)" }}>
        {NAV_ITEMS.map(({ label, icon, screen: s }) => (
          <NavButton key={s} label={label} icon={icon} active={screen === s} onClick={() => navigate(`/${s}`)} />
        ))}
      </nav>

      {/* Profile pill */}
      <div style={{ position: "relative" }}>
        <div onClick={() => setShowMenu((v) => !v)}
          style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.03)", border: `1.5px solid ${showMenu ? C.borderHover : C.border}`, borderRadius: 50, padding: "5px 16px 5px 6px", cursor: "pointer", transition: "all 0.25s ease", boxShadow: showMenu ? `0 0 12px ${cfg.color}22` : "0 2px 8px rgba(0,0,0,0.15)" }}>
          {equippedAvatar ? (
            <div style={{ width: 30, height: 30, borderRadius: "50%", overflow: "hidden", border: `2px solid ${RANKS[equippedAvatar].color}`, flexShrink: 0, boxShadow: `0 0 8px ${RANKS[equippedAvatar].color}44` }}>
              <img src={RANK_ICONS[equippedAvatar]} alt={equippedAvatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          ) : (
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg, #1a0808, ${C.surface})`, border: `2px solid ${cfg.color}55`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 14 }}>🧑‍💻</span>
            </div>
          )}
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ ...ui, fontSize: 11, fontWeight: 800, color: C.text }}>{playerName}</div>
            <div style={{ ...mono, fontSize: 9, color: cfg.color }}>{xp.toLocaleString()} XP</div>
          </div>
          <span style={{ fontSize: 8, color: C.textMuted, marginLeft: 2, transition: "transform 0.2s", transform: showMenu ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
        </div>

        {/* Dropdown */}
        {showMenu && (
          <>
            <div onClick={() => setShowMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 99 }} />
            <div style={{ position: "absolute", top: "calc(100% + 10px)", right: 0, zIndex: 100, background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: 6, minWidth: 170, boxShadow: "0 12px 40px rgba(0,0,0,0.6), 0 0 1px rgba(255,255,255,0.05)", animation: "scaleIn 0.15s ease-out" }}>
              <button onClick={() => { setShowMenu(false); navigate("/profile"); }} style={{ ...ui, width: "100%", textAlign: "left", padding: "11px 14px", borderRadius: 10, border: "none", background: "transparent", color: C.text, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,26,26,0.06)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                <span style={{ fontSize: 14 }}>◉</span> Profile
              </button>
              <div style={{ height: 1, background: C.border, margin: "4px 10px" }} />
              <button onClick={() => { setShowMenu(false); onLogout(); }} style={{ ...ui, width: "100%", textAlign: "left", padding: "11px 14px", borderRadius: 10, border: "none", background: "transparent", color: C.redLight, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,26,26,0.08)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                <span style={{ fontSize: 14 }}>🚪</span> Logout
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
