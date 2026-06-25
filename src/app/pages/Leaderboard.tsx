import { useState } from "react";
import { C, ui, mono, pixel, RANKS } from "../constants/theme";
import type { Rank } from "../constants/theme";
import { RankBadge, Card, Page } from "../components/shared";

export function LeaderboardScreen() {
  type MainTab = "global" | "language" | "weekly";
  const languages = ["Bisaya", "Hiligaynon", "Ilokano", "Kapampangan", "Waray"] as const;
  type Lang = typeof languages[number];
  const [mainTab, setMainTab] = useState<MainTab>("global");
  const [selectedLang, setSelectedLang] = useState<Lang>("Bisaya");

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
      { name: "SUGBO_MASTER",  xp: 6100,  rank: "Manananggal", flag: "🇵🇭", streak: 18, avatar: "🔱",   me: false },
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
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <h1 style={{ ...ui, fontSize: 28, fontWeight: 900, color: C.text, margin: 0 }}>★ Leaderboard</h1>
        </div>
        <p style={{ ...ui, fontSize: 13, color: C.textMuted, margin: 0 }}>{subtitle}</p>
      </div>

      {/* Podium — top 3 */}
      {players.length >= 3 && (
        <Card style={{ padding: "24px 20px 0", marginBottom: 24, position: "relative", overflow: "hidden" }} glowColor={C.gold}>
          {/* Retro corner brackets */}
          <div style={{ position: "absolute", top: 10, left: 10, width: 20, height: 20, borderTop: `2px solid ${C.gold}33`, borderLeft: `2px solid ${C.gold}33`, borderRadius: "4px 0 0 0" }} />
          <div style={{ position: "absolute", top: 10, right: 10, width: 20, height: 20, borderTop: `2px solid ${C.gold}33`, borderRight: `2px solid ${C.gold}33`, borderRadius: "0 4px 0 0" }} />
          <div style={{ ...pixel, fontSize: 7, color: C.gold, letterSpacing: "0.1em", textAlign: "center", marginBottom: 16, opacity: 0.7 }}>TOP PLAYERS</div>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 14 }}>
            {[players[1], players[0], players[2]].map((p, i) => {
              const orderIdx = [1, 0, 2];
              const heights = [110, 140, 88];
              const sizes = [44, 52, 40];
              const ri = orderIdx[i];
              return (
                <div key={p.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1, maxWidth: 140, animation: `slideUp 0.4s ease-out ${ri * 0.1}s both` }}>
                  <span style={{ fontSize: ri === 0 ? 26 : 20, animation: "bounce 2s ease-in-out infinite", animationDelay: `${ri * 0.2}s` }}>{medals[ri]}</span>
                  <div style={{ width: sizes[i], height: sizes[i], borderRadius: 14, background: "rgba(255,26,26,0.05)", border: `2.5px solid ${RANKS[p.rank].color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: sizes[i] * 0.45, boxShadow: `0 0 12px ${RANKS[p.rank].color}33` }}>{p.avatar}</div>
                  <span style={{ ...ui, fontSize: 10, fontWeight: 800, color: C.text, textAlign: "center" }}>{p.name}</span>
                  <div style={{ width: "100%", height: heights[i], borderRadius: "14px 14px 0 0", background: `linear-gradient(180deg, ${RANKS[p.rank].color}22, ${RANKS[p.rank].color}08)`, border: `1.5px solid ${RANKS[p.rank].color}33`, borderBottom: "none", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 12, gap: 4 }}>
                    <span style={{ ...mono, fontSize: 13, color: RANKS[p.rank].color, fontWeight: 800 }}>{(p.xp / 1000).toFixed(1)}k</span>
                    <span style={{ ...ui, fontSize: 9, color: C.textMuted }}>XP</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Tab bar */}
      <div style={{ display: "flex", background: "rgba(255,26,26,0.04)", border: `2px solid ${C.border}`, borderRadius: 14, padding: 4, marginBottom: 16 }}>
        {([
          { key: "global" as MainTab, label: "🌏 Global" },
          { key: "language" as MainTab, label: "🗣️ Language" },
          { key: "weekly" as MainTab, label: "📅 Weekly" },
        ]).map((t) => (
          <button key={t.key} onClick={() => setMainTab(t.key)}
            style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", cursor: "pointer", background: mainTab === t.key ? C.red : "transparent", color: mainTab === t.key ? "#fff" : C.textMuted, fontWeight: 800, fontSize: 13, transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)", boxShadow: mainTab === t.key ? `0 2px 14px ${C.red}55` : "none", transform: mainTab === t.key ? "scale(1.02)" : "scale(1)", ...ui }}
          >{t.label}</button>
        ))}
      </div>

      {/* Language dropdown */}
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
          <Card key={p.name + mainTab + (mainTab === "language" ? selectedLang : "")} style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, animation: `slideUp 0.3s ease-out ${i * 0.03}s both`, ...(p.me ? { border: `1.5px solid ${C.red}44`, background: "rgba(255,26,26,0.04)" } : {}) }} glowColor={p.me ? C.red : undefined}>
            <div style={{ width: 24, textAlign: "center", flexShrink: 0 }}>
              {i < 3 ? <span style={{ fontSize: 16 }}>{medals[i]}</span> : <span style={{ ...mono, fontSize: 12, color: C.textMuted, fontWeight: 700 }}>#{i + 1}</span>}
            </div>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(255,26,26,0.04)", border: `1.5px solid ${RANKS[p.rank].color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>{p.avatar}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ ...ui, fontSize: 13, fontWeight: 800, color: p.me ? C.redLight : C.text }}>{p.name}</span>
                <span style={{ fontSize: 11 }}>{p.flag}</span>
                {p.me && <span style={{ ...pixel, fontSize: 6, color: "#fff", background: C.red, padding: "2px 7px", borderRadius: 4, boxShadow: `0 0 6px ${C.red}44` }}>YOU</span>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                <span style={{ ...mono, fontSize: 11, color: C.textMuted }}>{p.xp.toLocaleString()} XP</span>
                <span style={{ ...ui, fontSize: 10, color: C.orange }}>{p.streak}🔥</span>
              </div>
            </div>
            <RankBadge rank={p.rank} size={28} />
          </Card>
        ))}
      </div>
    </Page>
  );
}
