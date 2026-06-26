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
          {equippedAvatar ? (
            <div style={{ width: 28, height: 28, borderRadius: "50%", overflow: "hidden", border: `2px solid ${RANKS[equippedAvatar].color}66`, flexShrink: 0 }}>
              <img src={RANK_ICONS[equippedAvatar]} alt={equippedAvatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          ) : (
            <RankBadge rank={rank} size={28} />
          )}
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
