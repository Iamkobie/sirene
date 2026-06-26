import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../lib/supabase";
import { fetchTodayDailyQuest, flagsFromRow } from "../../lib/dailyQuest";
import { C, ui, mono, pixel, RANKS, RANK_ICONS } from "../constants/theme";
import type { Rank, Screen } from "../constants/theme";
import { RankBadge, ProgressBar, Card, Btn, SectionTitle, Page } from "../components/shared";

const LANG_COLORS = [C.red, C.cyan, C.gold, C.orange, C.green];

export function HomeScreen({ xp, rank, playerName, equippedAvatar }: { xp: number; rank: Rank; playerName: string; equippedAvatar: Rank | null }) {
  const navigate = useNavigate();
  const onNav = (s: Screen) => navigate(`/${s}`);
  const cfg = RANKS[rank];
  const pct = Math.min(100, ((xp - cfg.min) / (cfg.max - cfg.min)) * 100);
  const rankKeys = Object.keys(RANKS) as Rank[];
  const nextRank = rankKeys[Math.min(rankKeys.indexOf(rank) + 1, rankKeys.length - 1)];

  const [streak, setStreak]               = useState(0);
  const [leaderRank, setLeaderRank]       = useState<number | null>(null);
  const [unlockedCount, setUnlockedCount] = useState(0);
  const [questDone, setQuestDone]         = useState(0);
  const [langs, setLangs]                 = useState<{ name: string; level: string; pct: number; color: string }[]>([]);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [
        { data: profile },
        { data: allProfiles },
        { data: achRow },
        { data: langProgress },
      ] = await Promise.all([
        supabase.from("profiles").select("streak").eq("id", user.id).maybeSingle(),
        supabase.from("profiles").select("id").order("xp", { ascending: false }),
        supabase.from("achievements").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_language_progress").select("language, xp, level").eq("user_id", user.id).order("xp", { ascending: false }),
      ]);

      // Daily quest count
      const questRow = await fetchTodayDailyQuest(user.id);
      const flags = flagsFromRow(questRow);
      const done = Object.values(flags).filter(Boolean).length;
      setQuestDone(done);

      // Streak
      setStreak(profile?.streak ?? 0);

      // Leaderboard rank — position of current user in sorted profiles
      if (allProfiles) {
        const pos = allProfiles.findIndex((p) => p.id === user.id);
        setLeaderRank(pos >= 0 ? pos + 1 : null);
      }

      // Achievements unlocked count
      if (achRow) {
        const keys = ["first_blood", "hot_streak", "sirena_quest", "polyglot", "speed_demon", "perfect_score", "top_rank", "book_worm"];
        setUnlockedCount(keys.filter((k) => !!(achRow as any)[k]).length);
      }

      // Language progress — map to display cards
      if (langProgress && langProgress.length > 0) {
        setLangs(
          langProgress.map((l, i) => ({
            name:  l.language.charAt(0).toUpperCase() + l.language.slice(1),
            level: l.level,
            pct:   l.level === "Advanced" ? 85 : l.level === "Intermediate" ? 50 : Math.min(Math.round((l.xp / 1000) * 100), 99),
            color: LANG_COLORS[i % LANG_COLORS.length],
          }))
        );
      }
    }
    load();
  }, []);

  const exploreCards = [
    { label: "Daily Quest",  icon: "⚡", sub: `${questDone}/4 quests completed`,                                 color: C.red,   screen: "daily"        as Screen },
    { label: "Leaderboard",  icon: "★",  sub: leaderRank ? `You are ranked #${leaderRank}` : "View rankings",   color: C.gold,  screen: "leaderboard"  as Screen },
    { label: "Achievements", icon: "🏆", sub: `${unlockedCount} of 8 unlocked`,                                  color: C.green, screen: "achievements" as Screen },
  ];

  return (
    <Page>
      {/* Hero profile card */}
      <Card style={{ padding: "22px 26px", marginBottom: 28, borderLeft: `4px solid ${C.red}`, position: "relative", overflow: "hidden" }} glowColor={cfg.color}>
        <div style={{ position: "absolute", top: 0, right: 0, width: 200, height: "100%", background: `linear-gradient(135deg, transparent, ${cfg.color}08)`, pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 16, position: "relative", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg, #1a0808, ${C.surface})`, border: `2px solid ${cfg.color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, boxShadow: cfg.glow, overflow: "hidden" }}>
              {equippedAvatar ? <img src={RANK_ICONS[equippedAvatar]} alt={equippedAvatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span>🧑💻</span>}
            </div>
            <div style={{ position: "absolute", bottom: -5, right: -5 }}><RankBadge rank={rank} size={22} /></div>
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
              <span style={{ ...ui, fontSize: 16, fontWeight: 900, color: C.text }}>{playerName}</span>
              <span style={{ ...pixel, fontSize: 7, color: cfg.color, background: cfg.bg, border: `1.5px solid ${cfg.color}44`, padding: "3px 8px", borderRadius: 6, boxShadow: `0 0 6px ${cfg.color}22` }}>{rank}</span>
              {streak > 0 && <span style={{ ...ui, fontSize: 12, color: C.orange, animation: "wiggle 2s ease-in-out infinite" }}>🔥 {streak}-day streak</span>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1 }}><ProgressBar pct={pct} color={cfg.color} /></div>
              <span style={{ ...mono, fontSize: 10, color: C.textMuted, flexShrink: 0 }}>{xp.toLocaleString()} / {cfg.max.toLocaleString()} XP</span>
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
        {langs.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
            {langs.map((l, i) => (
              <Card key={l.name} style={{ padding: 18, animation: `slideUp 0.4s ease-out ${i * 0.1}s both`, position: "relative", overflow: "hidden" }} onClick={() => onNav("play")} glowColor={l.color}>
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
        ) : (
          <Card style={{ padding: 22, textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🌏</div>
            <div style={{ ...ui, fontSize: 13, color: C.textMuted }}>No languages yet — start a challenge to track your progress!</div>
          </Card>
        )}
      </div>

      {/* Explore */}
      <SectionTitle style={{ marginBottom: 14 }}>Explore</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        {exploreCards.map((a, i) => (
          <Card key={a.label} style={{ padding: 22, animation: `slideUp 0.4s ease-out ${(i + 4) * 0.1}s both`, position: "relative", overflow: "hidden" }} onClick={() => onNav(a.screen)} glowColor={a.color}>
            <div style={{ position: "absolute", bottom: -10, right: -10, width: 80, height: 80, borderRadius: "50%", background: `radial-gradient(circle, ${a.color}0a, transparent)` }} />
            <div style={{ fontSize: 32, marginBottom: 10, animation: "bounce 2s ease-in-out infinite", animationDelay: `${i * 0.3}s` }}>{a.icon}</div>
            <div style={{ ...ui, fontSize: 15, fontWeight: 800, color: C.text }}>{a.label}</div>
            <div style={{ ...ui, fontSize: 12, color: C.textMuted, marginTop: 4 }}>{a.sub}</div>
            <div style={{ ...ui, fontSize: 12, color: a.color, marginTop: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>View <span>→</span></div>
          </Card>
        ))}
      </div>
    </Page>
  );
}
