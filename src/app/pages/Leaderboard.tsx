import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { C, ui, mono, pixel, RANKS } from "../constants/theme";
import type { Rank } from "../constants/theme";
import { RankBadge, Card, Page } from "../components/shared";

export function LeaderboardScreen({ cities }: { cities: string[] }) {
  type MainTab = "global" | "language" | "weekly";
  const languages = ["Bisaya", "Hiligaynon", "Ilokano", "Kapampangan", "Waray"] as const;
  type Lang = typeof languages[number];
  const [mainTab, setMainTab] = useState<MainTab>("global");
  const [selectedLang, setSelectedLang] = useState<Lang>("Bisaya");
  const [selectedCity, setSelectedCity] = useState<string>("Global");
  const [loading, setLoading] = useState(false);
  const [liveData, setLiveData] = useState<LivePlayerData[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  type PlayerEntry = { name: string; xp: number; rank: Rank; flag: string; streak: number; avatar: string; me: boolean };
  
  // Type for live data to fix TypeScript errors
  interface LivePlayerData {
    name: string;
    xp: number;
    rank: Rank;
    flag: string;
    streak: number;
    avatar: string;
    me: boolean;
  }
  const globalData: PlayerEntry[] = [
    { name: "PIXEL_MASTER", xp: 14200, rank: "Sirena", flag: "🇵🇭", streak: 45, avatar: "🧑", me: false },
    { name: "NEON_LINGUIST", xp: 11800, rank: "Sirena", flag: "🇵🇭", streak: 32, avatar: "👩", me: false },
    { name: "ARCADE_NINJA", xp: 9600, rank: "Aswang", flag: "🇵🇭", streak: 28, avatar: "🧙", me: false },
    { name: "BYTE_SPEAKER", xp: 8200, rank: "Aswang", flag: "🇵🇭", streak: 21, avatar: "🤖", me: false },
    { name: "GLITCH_TONGUE", xp: 5900, rank: "Manananggal", flag: "🇵🇭", streak: 15, avatar: "🦊", me: false },
    { name: "PLAYER_ONE", xp: 4750, rank: "Manananggal", flag: "🇵🇭", streak: 7, avatar: "🧑‍💻", me: true },
    { name: "RETRO_TALKER", xp: 2300, rank: "Tikbalang", flag: "🇵🇭", streak: 9, avatar: "🎮", me: false },
    { name: "LANG_ROOKIE", xp: 800, rank: "Nuno", flag: "🇵🇭", streak: 3, avatar: "🌱", me: false },
  ];

  const languageData: Record<Lang, PlayerEntry[]> = {
    Bisaya: [
      { name: "CEBU_KING", xp: 12400, rank: "Sirena", flag: "🇵🇭", streak: 50, avatar: "👑", me: false },
      { name: "VISAYAN_PRO", xp: 9800, rank: "Aswang", flag: "🇵🇭", streak: 33, avatar: "🌊", me: false },
      { name: "ISLAND_VOICE", xp: 7600, rank: "Aswang", flag: "🇵🇭", streak: 22, avatar: "🏝️", me: false },
      { name: "SUGBO_MASTER", xp: 6100, rank: "Manananggal", flag: "🇵🇭", streak: 18, avatar: "🔱", me: false },
      { name: "PLAYER_ONE", xp: 4200, rank: "Manananggal", flag: "🇵🇭", streak: 7, avatar: "🧑‍💻", me: true },
      { name: "BISAYA_NOOB", xp: 2800, rank: "Tikbalang", flag: "🇵🇭", streak: 11, avatar: "🐣", me: false },
      { name: "DIALECT_FAN", xp: 1500, rank: "Tikbalang", flag: "🇵🇭", streak: 5, avatar: "📖", me: false },
      { name: "NEW_LEARNER", xp: 600, rank: "Nuno", flag: "🇵🇭", streak: 2, avatar: "🌱", me: false },
    ],
    Hiligaynon: [
      { name: "ILONGGO_ACE", xp: 11200, rank: "Sirena", flag: "🇵🇭", streak: 40, avatar: "🎯", me: false },
      { name: "PANAY_PRIDE", xp: 8900, rank: "Aswang", flag: "🇵🇭", streak: 29, avatar: "🌺", me: false },
      { name: "HILIG_MASTER", xp: 7200, rank: "Aswang", flag: "🇵🇭", streak: 20, avatar: "🔥", me: false },
      { name: "PLAYER_ONE", xp: 3100, rank: "Manananggal", flag: "🇵🇭", streak: 7, avatar: "🧑‍💻", me: true },
      { name: "SUGAR_LAND", xp: 2400, rank: "Tikbalang", flag: "🇵🇭", streak: 8, avatar: "🍬", me: false },
      { name: "WEST_VIS", xp: 1800, rank: "Tikbalang", flag: "🇵🇭", streak: 6, avatar: "🧭", me: false },
      { name: "ILOILO_KID", xp: 900, rank: "Nuno", flag: "🇵🇭", streak: 4, avatar: "🎮", me: false },
      { name: "FRESH_START", xp: 400, rank: "Nuno", flag: "🇵🇭", streak: 1, avatar: "✨", me: false },
    ],
    Ilokano: [
      { name: "NORTE_LEGEND", xp: 13500, rank: "Sirena", flag: "🇵🇭", streak: 55, avatar: "⭐", me: false },
      { name: "ILOCOS_BEST", xp: 10200, rank: "Sirena", flag: "🇵🇭", streak: 38, avatar: "🏔️", me: false },
      { name: "CORDILLERA", xp: 8100, rank: "Aswang", flag: "🇵🇭", streak: 25, avatar: "🦅", me: false },
      { name: "VIGAN_VOICE", xp: 6500, rank: "Manananggal", flag: "🇵🇭", streak: 19, avatar: "🏛️", me: false },
      { name: "LAOAG_STAR", xp: 4900, rank: "Manananggal", flag: "🇵🇭", streak: 14, avatar: "💫", me: false },
      { name: "PLAYER_ONE", xp: 2100, rank: "Tikbalang", flag: "🇵🇭", streak: 7, avatar: "🧑‍💻", me: true },
      { name: "PINOY_LEARNER", xp: 1200, rank: "Tikbalang", flag: "🇵🇭", streak: 4, avatar: "📚", me: false },
      { name: "BAGONG_ARAL", xp: 500, rank: "Nuno", flag: "🇵🇭", streak: 2, avatar: "🌱", me: false },
    ],
    Kapampangan: [
      { name: "PAMPANGA_PRO", xp: 10800, rank: "Sirena", flag: "🇵🇭", streak: 42, avatar: "🎖️", me: false },
      { name: "SISIG_KING", xp: 8400, rank: "Aswang", flag: "🇵🇭", streak: 30, avatar: "🍳", me: false },
      { name: "KAPAMP_HERO", xp: 6800, rank: "Manananggal", flag: "🇵🇭", streak: 22, avatar: "🛡️", me: false },
      { name: "PLAYER_ONE", xp: 3800, rank: "Manananggal", flag: "🇵🇭", streak: 7, avatar: "🧑‍💻", me: true },
      { name: "ANGELES_FAN", xp: 2600, rank: "Tikbalang", flag: "🇵🇭", streak: 10, avatar: "😇", me: false },
      { name: "TARLAC_KID", xp: 1400, rank: "Tikbalang", flag: "🇵🇭", streak: 5, avatar: "🎮", me: false },
      { name: "LUZON_NOOB", xp: 700, rank: "Nuno", flag: "🇵🇭", streak: 3, avatar: "🐣", me: false },
      { name: "DAY_ONE", xp: 200, rank: "Nuno", flag: "🇵🇭", streak: 1, avatar: "🌱", me: false },
    ],
    Waray: [
      { name: "LEYTE_LEGEND", xp: 9200, rank: "Aswang", flag: "🇵🇭", streak: 36, avatar: "🌋", me: false },
      { name: "SAMAR_STAR", xp: 7500, rank: "Aswang", flag: "🇵🇭", streak: 24, avatar: "⚡", me: false },
      { name: "TACLOBAN_ACE", xp: 5800, rank: "Manananggal", flag: "🇵🇭", streak: 17, avatar: "🎯", me: false },
      { name: "EASTERN_VIS", xp: 4100, rank: "Manananggal", flag: "🇵🇭", streak: 12, avatar: "🌊", me: false },
      { name: "PLAYER_ONE", xp: 1900, rank: "Tikbalang", flag: "🇵🇭", streak: 7, avatar: "🧑‍💻", me: true },
      { name: "WARAY_NEWBIE", xp: 1100, rank: "Tikbalang", flag: "🇵🇭", streak: 4, avatar: "📖", me: false },
      { name: "REGION_EIGHT", xp: 650, rank: "Nuno", flag: "🇵🇭", streak: 3, avatar: "🎮", me: false },
      { name: "FIRST_TIMER", xp: 300, rank: "Nuno", flag: "🇵🇭", streak: 1, avatar: "🌱", me: false },
    ],
  };

  const weeklyData: PlayerEntry[] = [
    { name: "ARCADE_NINJA", xp: 2400, rank: "Aswang", flag: "🇵🇭", streak: 28, avatar: "🧙", me: false },
    { name: "PIXEL_MASTER", xp: 2100, rank: "Sirena", flag: "🇵🇭", streak: 45, avatar: "🧑", me: false },
    { name: "PLAYER_ONE", xp: 1850, rank: "Manananggal", flag: "🇵🇭", streak: 7, avatar: "🧑‍💻", me: true },
    { name: "NEON_LINGUIST", xp: 1600, rank: "Sirena", flag: "🇵🇭", streak: 32, avatar: "👩", me: false },
    { name: "BYTE_SPEAKER", xp: 1400, rank: "Aswang", flag: "🇵🇭", streak: 21, avatar: "🤖", me: false },
    { name: "GLITCH_TONGUE", xp: 1200, rank: "Manananggal", flag: "🇵🇭", streak: 15, avatar: "🦊", me: false },
    { name: "RETRO_TALKER", xp: 980, rank: "Tikbalang", flag: "🇵🇭", streak: 9, avatar: "🎮", me: false },
    { name: "CEBU_KING", xp: 870, rank: "Sirena", flag: "🇵🇭", streak: 50, avatar: "👑", me: false },
    { name: "LANG_ROOKIE", xp: 650, rank: "Nuno", flag: "🇵🇭", streak: 3, avatar: "🌱", me: false },
    { name: "NEW_LEARNER", xp: 320, rank: "Nuno", flag: "🇵🇭", streak: 2, avatar: "🌱", me: false },
  ];

  // Fetch current user ID once for "YOU" badge
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id ?? null);
    });
  }, []);

  // Fetch live data from backend
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    
    async function fetchLeaderboard() {
      try {
        const cityFilter = selectedCity === "Global" ? null : selectedCity;
        
        if (mainTab === "global") {
          const { data, error } = await supabase.rpc("get_overall_leaderboard", { p_city: cityFilter });
          if (!error && data && isMounted) {
            setLiveData(data.map((row: any) => {
              const validRank: Rank = (row.creature_rank && ["Nuno", "Tikbalang", "Manananggal", "Aswang", "Sirena"].includes(row.creature_rank)) 
                ? row.creature_rank as Rank 
                : "Nuno";
              return {
                name: row.username || "PLAYER",
                xp: Number(row.xp) || 0,
                rank: validRank,
                flag: "🇵🇭",
                streak: row.streak || 0,
                avatar: "🧑‍💻",
                me: currentUserId ? row.user_id === currentUserId : false
              };
            }));
          }
        } else if (mainTab === "language") {
          const { data, error } = await supabase.rpc("get_language_leaderboard", { 
            p_language: selectedLang,
            p_city: cityFilter 
          });
          if (!error && data && isMounted) {
            setLiveData(data.map((row: any) => ({
              name: row.username || "PLAYER",
              xp: Number(row.language_xp) || 0,
              rank: "Nuno" as Rank,
              flag: "🇵🇭",
              streak: 0,
              avatar: "🧑‍💻",
              me: currentUserId ? row.user_id === currentUserId : false
            })));
          }
        } else {
          const { data, error } = await supabase.rpc("get_weekly_leaderboard", { p_city: cityFilter });
          if (!error && data && isMounted) {
            setLiveData(data.map((row: any) => ({
              name: row.username || "PLAYER",
              xp: Number(row.weekly_xp) || 0,
              rank: "Nuno" as Rank,
              flag: "🇵🇭",
              streak: 0,
              avatar: "🧑‍💻",
              me: currentUserId ? row.user_id === currentUserId : false
            })));
          }
        }
      } catch (err) {
        console.error("Leaderboard fetch error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchLeaderboard();
    return () => { isMounted = false; };
  }, [mainTab, selectedLang, selectedCity, currentUserId]);

  // Fallback to mock data if live data is empty
  const players = liveData.length > 0 ? liveData : (mainTab === "global" ? globalData : mainTab === "language" ? languageData[selectedLang] : weeklyData);
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

      {/* City Dropdown Filter - Enhanced Design */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ ...ui, fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
          <span>📍</span>
          <span>Filter by City</span>
        </div>
        <div style={{ position: "relative", maxWidth: 280 }}>
          <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}
            style={{ 
              ...ui, 
              width: "100%", 
              background: `linear-gradient(135deg, ${C.surface}, #161616)`,
              border: `2px solid ${C.border}`, 
              borderRadius: 12, 
              padding: "12px 40px 12px 16px", 
              color: C.text, 
              fontSize: 14, 
              fontWeight: 700, 
              outline: "none", 
              cursor: "pointer", 
              appearance: "none",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = C.borderHover;
              e.currentTarget.style.boxShadow = `0 6px 16px rgba(255,26,26,0.15)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
            }}
          >
            <option value="Global" style={{ background: C.surface, color: C.text }}>🌏 All Cities (Global)</option>
            {cities.map((city) => <option key={city} value={city} style={{ background: C.surface, color: C.text }}>📍 {city}</option>)}
          </select>
          <div style={{ 
            position: "absolute", 
            right: 14, 
            top: "50%", 
            transform: "translateY(-50%)", 
            width: 20, 
            height: 20,
            background: `linear-gradient(135deg, ${C.red}44, ${C.red}22)`,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            boxShadow: `0 0 8px ${C.red}33`
          }}>
            <span style={{ fontSize: 10, color: "#fff" }}>▾</span>
          </div>
        </div>
        <div style={{ ...ui, fontSize: 10, color: C.textMuted, marginTop: 6, fontStyle: "italic" }}>
          {selectedCity === "Global" ? "Showing players from all cities" : `Showing players from ${selectedCity}`}
        </div>
      </div>

      {/* Language dropdown - Enhanced Design */}
      {mainTab === "language" && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ ...ui, fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <span>🗣️</span>
            <span>Select Language</span>
          </div>
          <div style={{ position: "relative", maxWidth: 280 }}>
            <select value={selectedLang} onChange={(e) => setSelectedLang(e.target.value as Lang)}
              style={{ 
                ...ui, 
                width: "100%", 
                background: `linear-gradient(135deg, ${C.surface}, #161616)`,
                border: `2px solid ${C.border}`, 
                borderRadius: 12, 
                padding: "12px 40px 12px 16px", 
                color: C.text, 
                fontSize: 14, 
                fontWeight: 700, 
                outline: "none", 
                cursor: "pointer", 
                appearance: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = C.borderHover;
                e.currentTarget.style.boxShadow = `0 6px 16px rgba(255,26,26,0.15)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = C.border;
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
              }}
            >
              {languages.map((l) => <option key={l} value={l} style={{ background: C.surface, color: C.text }}>🗣️ {l}</option>)}
            </select>
            <div style={{ 
              position: "absolute", 
              right: 14, 
              top: "50%", 
              transform: "translateY(-50%)", 
              width: 20, 
              height: 20,
              background: `linear-gradient(135deg, ${C.red}44, ${C.red}22)`,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
              boxShadow: `0 0 8px ${C.red}33`
            }}>
              <span style={{ fontSize: 10, color: "#fff" }}>▾</span>
            </div>
          </div>
        </div>
      )}

      {/* Player list */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "30vh", gap: 20 }}>
          <div style={{
            width: 40,
            height: 40,
            border: `3px solid rgba(255,26,26,0.1)`,
            borderTop: `3px solid ${C.red}`,
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            boxShadow: `0 0 10px ${C.red}33`
          }} />
          <span style={{ ...pixel, fontSize: 8, color: C.textMuted, letterSpacing: 1, animation: "pulse 1.5s infinite" }}>LOADING LEADERBOARD...</span>
        </div>
      ) : (
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
      )}
    </Page>
  );
}
