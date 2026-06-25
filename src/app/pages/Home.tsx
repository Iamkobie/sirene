import { useNavigate } from "react-router";
import { C, ui, mono, pixel, RANKS } from "../constants/theme";
import type { Rank, Screen } from "../constants/theme";
import { RankBadge, ProgressBar, Card, Btn, SectionTitle, Page } from "../components/shared";

export function HomeScreen({ xp, rank, playerName }: { xp: number; rank: Rank; playerName: string }) {
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
        <div style={{ position: "absolute", top: 0, right: 0, width: 200, height: "100%", background: `linear-gradient(135deg, transparent, ${cfg.color}08)`, pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 16, position: "relative", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg, #1a0808, ${C.surface})`, border: `2px solid ${cfg.color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, boxShadow: cfg.glow }}>🧑‍💻</div>
            <div style={{ position: "absolute", bottom: -5, right: -5 }}><RankBadge rank={rank} size={22} /></div>
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
              <span style={{ ...ui, fontSize: 16, fontWeight: 900, color: C.text }}>{playerName}</span>
              <span style={{ ...pixel, fontSize: 7, color: cfg.color, background: cfg.bg, border: `1.5px solid ${cfg.color}44`, padding: "3px 8px", borderRadius: 6, boxShadow: `0 0 6px ${cfg.color}22` }}>{rank}</span>
              <span style={{ ...ui, fontSize: 12, color: C.orange, animation: "wiggle 2s ease-in-out infinite" }}>🔥 7-day streak</span>
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
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
