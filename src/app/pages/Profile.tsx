import { useState } from "react";
import { C, ui, mono, pixel, RANKS, RANK_SVGS, RANK_ICONS, RANK_BANNERS, COMING_SOON_BANNERS } from "../constants/theme";
import type { Rank } from "../constants/theme";
import { ProgressBar, Card, Btn, Page } from "../components/shared";

export function ProfileScreen({ xp, rank, playerName, onNameChange, equippedBanner, setEquippedBanner, equippedAvatar, setEquippedAvatar }: { xp: number; rank: Rank; playerName: string; onNameChange: (name: string) => void; equippedBanner: string | null; setEquippedBanner: (v: string | null) => void; equippedAvatar: Rank | null; setEquippedAvatar: (v: Rank | null) => void }) {
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
          {/* Extra shimmer for diamond rank */}
          {rank === "Sirena" && <div style={{ position: "absolute", inset: 0, background: "linear-gradient(250deg, transparent 30%, rgba(255,255,255,0.04) 45%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 55%, transparent 70%)", backgroundSize: "200% 100%", animation: "shimmer 4s linear infinite 1s" }} />}
          {rank === "Sirena" && <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 60%, rgba(185,242,255,0.06) 80%, rgba(185,242,255,0.1) 100%)" }} />}
          {/* Decorative corner accents */}
          <div style={{ position: "absolute", top: 12, left: 12, width: 40, height: 40, borderTop: `2px solid ${cfg.color}33`, borderLeft: `2px solid ${cfg.color}33`, borderRadius: "6px 0 0 0" }} />
          <div style={{ position: "absolute", top: 12, right: 12, width: 40, height: 40, borderTop: `2px solid ${cfg.color}33`, borderRight: `2px solid ${cfg.color}33`, borderRadius: "0 6px 0 0" }} />
          {/* Diamond sparkle particles */}
          {rank === "Sirena" && <>
            <div style={{ position: "absolute", top: "20%", left: "20%", width: 3, height: 3, borderRadius: "50%", background: "#fff", opacity: 0.6, animation: "pulse 2s ease-in-out infinite", boxShadow: "0 0 6px #fff" }} />
            <div style={{ position: "absolute", top: "35%", right: "25%", width: 2, height: 2, borderRadius: "50%", background: "#fff", opacity: 0.4, animation: "pulse 2.5s ease-in-out infinite 0.5s", boxShadow: "0 0 4px #fff" }} />
            <div style={{ position: "absolute", top: "50%", left: "45%", width: 2, height: 2, borderRadius: "50%", background: "#b9f2ff", opacity: 0.5, animation: "pulse 3s ease-in-out infinite 1s", boxShadow: "0 0 6px #b9f2ff" }} />
            <div style={{ position: "absolute", top: "25%", right: "40%", width: 2, height: 2, borderRadius: "50%", background: "#fff", opacity: 0.3, animation: "pulse 2.2s ease-in-out infinite 1.5s", boxShadow: "0 0 4px #fff" }} />
            <div style={{ position: "absolute", top: "60%", left: "30%", width: 2, height: 2, borderRadius: "50%", background: "#b9f2ff", opacity: 0.35, animation: "pulse 2.8s ease-in-out infinite 0.8s", boxShadow: "0 0 5px #b9f2ff" }} />
          </>}
          {/* Banner name tag */}
          {activeBanner && <div style={{ position: "absolute", bottom: 12, right: 14, ...pixel, fontSize: 7, color: "rgba(255,255,255,0.7)", background: "rgba(0,0,0,0.6)", padding: "4px 12px", borderRadius: 6, backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.1)" }}>{activeBanner.name}</div>}
        </div>
        <div style={{ padding: "20px 24px 36px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
            <div style={{ position: "relative", flexShrink: 0, marginTop: -70 }}>
              <div style={{ position: "relative", width: 110, height: 110, borderRadius: 22, background: `linear-gradient(135deg, #0a0a0a, ${C.surface})`, border: `4px solid ${avatarBorderColor}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: rank === "Sirena" ? `0 0 30px ${avatarBorderColor}66, 0 0 60px ${avatarBorderColor}22, 0 8px 32px rgba(0,0,0,0.5)` : `0 0 24px ${avatarBorderColor}55, 0 8px 32px rgba(0,0,0,0.5)`, overflow: "hidden" }}>
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 24 }}>
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))", gap: 10 }}>
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
