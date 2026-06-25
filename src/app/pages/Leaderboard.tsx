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
  const [selectedCity, setSelectedCity] = useState("Global");
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null);
    });
  }, []);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const cityParam = selectedCity === "Global" ? null : selectedCity;
        let res;
        if (mainTab === "global") {
          res = await supabase.rpc("get_overall_leaderboard", { p_city: cityParam });
        } else if (mainTab === "language") {
          res = await supabase.rpc("get_language_leaderboard", { p_language: selectedLang, p_city: cityParam });
        } else {
          res = await supabase.rpc("get_weekly_leaderboard", { p_city: cityParam });
        }

        if (res.error) {
          console.error("Leaderboard fetch error:", res.error);
        } else {
          const mapped = (res.data || []).map((row: any) => ({
            name: row.username,
            city: row.city,
            xp: Number(row.xp || row.language_xp || row.weekly_xp || 0),
            rank: row.creature_rank || row.language_level || "Nuno",
            flag: "🇵🇭",
            streak: row.streak || 0,
            avatar: "🧑‍💻",
            me: currentUserId && row.user_id === currentUserId
          }));
          setPlayers(mapped);
        }
      } catch (err) {
        console.error("Leaderboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [mainTab, selectedLang, selectedCity, currentUserId]);

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

      {/* City Dropdown filter */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 20 }}>
        <span style={{ ...ui, fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Filter City:</span>
        <div style={{ position: "relative", width: 180 }}>
          <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}
            style={{ ...ui, width: "100%", background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "8px 32px 8px 12px", color: C.text, fontSize: 12, fontWeight: 700, outline: "none", cursor: "pointer", appearance: "none" }}>
            <option value="Global">Global</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: C.textMuted, pointerEvents: "none", fontSize: 10 }}>▾</span>
        </div>
      </div>

      {loading ? (
        <div style={{ ...ui, textAlign: "center", padding: "40px", color: C.textMuted }}>⚔️ Loading rankings...</div>
      ) : players.length === 0 ? (
        <div style={{ ...ui, textAlign: "center", padding: "40px", color: C.textMuted }}>🛡️ No contributors found in this filter yet.</div>
      ) : (
        <>
          {/* Podium — top 3 */}
          {players.length >= 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 12, marginBottom: 28 }}>
              {[1, 0, 2].map((podIdx) => {
                const p = players[podIdx];
                if (!p) return <div key={podIdx} style={{ flex: 1, maxWidth: 130 }} />;
                const heights = [115, 145, 92];
                return (
                  <div key={p.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, flex: 1, maxWidth: 130 }}>
                    <span style={{ fontSize: 20, animation: "bounce 2s ease-in-out infinite", animationDelay: `${podIdx * 0.2}s` }}>{medals[podIdx]}</span>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(255,26,26,0.05)", border: `2px solid ${RANKS[p.rank as Rank]?.color || C.red}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: RANKS[p.rank as Rank]?.glow || C.redGlow }}>{p.avatar}</div>
                    <span style={{ ...ui, fontSize: 10, fontWeight: 800, color: C.text, textAlign: "center" }}>{p.name}</span>
                    <div style={{ width: "100%", height: heights[podIdx], borderRadius: "12px 12px 0 0", background: `linear-gradient(180deg, ${(RANKS[p.rank as Rank]?.color || C.red)}20, ${(RANKS[p.rank as Rank]?.color || C.red)}05)`, border: `1.5px solid ${(RANKS[p.rank as Rank]?.color || C.red)}33`, borderBottom: "none", display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 10 }}>
                      <span style={{ ...mono, fontSize: 11, color: RANKS[p.rank as Rank]?.color || C.red, fontWeight: 700 }}>{p.xp.toFixed(1)}</span>
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
                <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(255,26,26,0.04)", border: `1.5px solid ${RANKS[p.rank as Rank]?.color || C.red}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{p.avatar}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ ...ui, fontSize: 12, fontWeight: 800, color: p.me ? C.redLight : C.text }}>{p.name}</span>
                    <span style={{ fontSize: 11 }}>{p.flag}</span>
                    {p.me && <span style={{ ...pixel, fontSize: 6, color: "#fff", background: C.red, padding: "2px 6px", borderRadius: 4 }}>YOU</span>}
                  </div>
                  <span style={{ ...ui, fontSize: 11, color: C.textMuted }}>{p.xp.toFixed(1)} XP · {p.streak}🔥{p.city ? ` · 📍 ${p.city}` : ""}</span>
                </div>
                <RankBadge rank={p.rank as Rank} size={26} />
              </Card>
            ))}
          </div>
        </>
      )}
    </Page>
  );
}
