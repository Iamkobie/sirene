import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../lib/supabase";
import { C, ui, mono, pixel, RANKS, RANK_SVGS, COMING_SOON_RANKS } from "../constants/theme";
import type { Rank } from "../constants/theme";
import { ProgressBar, Card, Page } from "../components/shared";

export function AchievementsScreen() {
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ ...ui, fontSize: 28, fontWeight: 900, color: C.text, margin: 0 }}>🏆 Achievements</h1>
          <p style={{ ...ui, fontSize: 13, color: C.textMuted, margin: "6px 0 0" }}>{items.filter((a) => a.done).length} of {items.length} unlocked — keep going!</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 120 }}><ProgressBar pct={(items.filter((a) => a.done).length / items.length) * 100} color={C.gold} height={8} /></div>
          <span style={{ ...mono, fontSize: 12, color: C.gold, fontWeight: 700 }}>{Math.round((items.filter((a) => a.done).length / items.length) * 100)}%</span>
        </div>
      </div>

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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
        {items.map((a, i) => (
          <Card key={a.title} style={{ padding: 20, opacity: a.done ? 1 : 0.5, animation: `slideUp 0.4s ease-out ${i * 0.06}s both`, position: "relative", overflow: "hidden" }} glowColor={a.done ? a.color : undefined}>
            {a.done && <div style={{ position: "absolute", top: -15, right: -15, width: 50, height: 50, borderRadius: "50%", background: `radial-gradient(circle, ${a.color}15, transparent)` }} />}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontSize: 30, animation: a.done ? "bounce 3s ease-in-out infinite" : "none", animationDelay: `${i * 0.4}s` }}>{a.icon}</div>
              {a.done && <div style={{ ...ui, fontSize: 9, color: C.green, fontWeight: 700, background: "rgba(76,175,125,0.1)", border: "1px solid rgba(76,175,125,0.2)", padding: "3px 8px", borderRadius: 6 }}>✓ Done</div>}
              {!a.done && <div style={{ ...ui, fontSize: 9, color: C.textMuted, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", padding: "3px 8px", borderRadius: 6 }}>🔒</div>}
            </div>
            <div style={{ ...ui, fontSize: 13, fontWeight: 800, color: a.done ? C.text : C.textMuted, marginBottom: 4 }}>{a.title}</div>
            <p style={{ ...ui, fontSize: 11, color: C.textMuted, lineHeight: 1.5, margin: 0 }}>{a.desc}</p>
            {a.done && <div style={{ marginTop: 10, height: 3, borderRadius: 2, background: `linear-gradient(90deg, ${a.color}, ${a.color}55)`, boxShadow: `0 0 8px ${a.color}33` }} />}
          </Card>
        ))}
      </div>
    </Page>
  );
}
