import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { C, ui, mono, pixel, RANKS, RANK_SVGS, COMING_SOON_RANKS } from "../constants/theme";
import type { Rank } from "../constants/theme";
import { ProgressBar, Card, Page } from "../components/shared";

type AchievementKey = "first_blood" | "hot_streak" | "sirena_quest" | "polyglot" | "speed_demon" | "perfect_score" | "top_rank" | "book_worm";

const DEFAULT: Record<AchievementKey, boolean> = {
  first_blood:   false,
  hot_streak:    false,
  sirena_quest:  false,
  polyglot:      false,
  speed_demon:   false,
  perfect_score: false,
  top_rank:      false,
  book_worm:     false,
};

export function AchievementsScreen() {
  const [loading, setLoading]           = useState(true);
  const [achievements, setAchievements] = useState<Record<AchievementKey, boolean>>(DEFAULT);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { if (active) setLoading(false); return; }

        // ── 1. Fetch all data in parallel ─────────────────────────────────
        const [
          { data: achRow },
          { data: profile },
          { count: totalAttempts },
          { count: todayAttempts },
          { data: langProgress },
          { data: leaderboard },
          { data: perfectCheck },
        ] = await Promise.all([
          supabase.from("achievements").select("*").eq("user_id", user.id).maybeSingle(),
          supabase.from("profiles").select("xp, streak").eq("id", user.id).single(),
          supabase.from("user_phrase_attempts").select("*", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("user_phrase_attempts").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", new Date().toISOString().split("T")[0]),
          supabase.from("user_language_progress").select("language").eq("user_id", user.id),
          supabase.from("profiles").select("id").order("xp", { ascending: false }).limit(1),
          supabase.from("user_phrase_attempts").select("id").eq("user_id", user.id).eq("overall_score", 100).limit(1),
        ]);

        const xp             = profile?.xp ?? 0;
        const streak         = profile?.streak ?? 0;
        const langCount      = langProgress?.length ?? 0;
        const hasPerfect     = (perfectCheck?.length ?? 0) > 0;
        const isTopRank      = leaderboard?.[0]?.id === user.id;

        const computed: Record<AchievementKey, boolean> = {
          first_blood:   achRow?.first_blood   ?? (totalAttempts ?? 0) >= 1,
          hot_streak:    achRow?.hot_streak    ?? streak >= 7,
          sirena_quest:  achRow?.sirena_quest  ?? xp >= 10000,
          polyglot:      achRow?.polyglot      ?? langCount >= 5,
          speed_demon:   achRow?.speed_demon   ?? (todayAttempts ?? 0) >= 100,
          perfect_score: achRow?.perfect_score ?? hasPerfect,
          top_rank:      achRow?.top_rank      ?? isTopRank,
          book_worm:     achRow?.book_worm     ?? (totalAttempts ?? 0) >= 500,
        };

        // ── 3. Console log ─────────────────────────────────────────────────
        console.log("[SIRENE] Achievements for", user.email);
        console.table(
          Object.entries(computed).map(([key, done]) => ({
            Achievement: key,
            Unlocked: done ? "✅ YES" : "❌ NO",
          }))
        );

        // ── 4. Upsert back to DB so achievements table stays up to date ───
        await supabase.from("achievements").upsert({
          user_id: user.id,
          ...computed,
        }, { onConflict: "user_id" });

        if (active) { setAchievements(computed); setLoading(false); }
      } catch (err) {
        console.error("[SIRENE] Failed to load achievements:", err);
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, []);

  const items = [
    { key: "first_blood"   as AchievementKey, icon: "🏆", title: "First Blood",   desc: "Complete your first translation",  color: C.gold },
    { key: "hot_streak"    as AchievementKey, icon: "🔥", title: "Hot Streak",    desc: "Maintain a 7-day streak",          color: C.orange },
    { key: "sirena_quest"  as AchievementKey, icon: "🧜‍♀️", title: "Sirena Quest",  desc: "Reach Sirena rank (10,000 XP)",    color: C.cyan },
    { key: "polyglot"      as AchievementKey, icon: "🌍", title: "Polyglot",      desc: "Contribute in 5 dialects",         color: C.green },
    { key: "speed_demon"   as AchievementKey, icon: "⚡", title: "Speed Demon",   desc: "100 translations in one day",      color: C.red },
    { key: "perfect_score" as AchievementKey, icon: "🎯", title: "Perfect Score", desc: "Score 100 on any evaluation",      color: C.green },
    { key: "top_rank"      as AchievementKey, icon: "👑", title: "Top Rank",      desc: "Reach #1 on the leaderboard",      color: C.gold },
    { key: "book_worm"     as AchievementKey, icon: "📚", title: "Bookworm",      desc: "Complete 500 phrase attempts",     color: C.red },
  ].map((item) => ({ ...item, done: achievements[item.key] }));

  if (loading) {
    return (
      <Page>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", gap: 20 }}>
          <div style={{ width: 40, height: 40, border: `3px solid rgba(255,26,26,0.1)`, borderTop: `3px solid ${C.red}`, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          <span style={{ ...pixel, fontSize: 8, color: C.textMuted, letterSpacing: 1 }}>LOADING ACHIEVEMENTS...</span>
        </div>
      </Page>
    );
  }

  const unlockedCount = items.filter((a) => a.done).length;

  return (
    <Page>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ ...ui, fontSize: 28, fontWeight: 900, color: C.text, margin: 0 }}>🏆 Achievements</h1>
          <p style={{ ...ui, fontSize: 13, color: C.textMuted, margin: "6px 0 0" }}>{unlockedCount} of {items.length} unlocked — keep going!</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 120 }}><ProgressBar pct={(unlockedCount / items.length) * 100} color={C.gold} height={8} /></div>
          <span style={{ ...mono, fontSize: 12, color: C.gold, fontWeight: 700 }}>{Math.round((unlockedCount / items.length) * 100)}%</span>
        </div>
      </div>

      {/* Rank path */}
      <Card style={{ padding: "28px 20px", marginBottom: 24, borderTop: `3px solid ${C.red}` }} glowColor={C.red}>
        <div style={{ ...pixel, fontSize: 9, color: C.text, marginBottom: 24, letterSpacing: "0.05em" }}>MYTHICAL RANK PATH</div>
        <div style={{ overflowX: "auto", paddingBottom: 8 }}>
          <div style={{ display: "inline-flex", alignItems: "center" }}>
            {(Object.keys(RANKS) as Rank[]).map((r, i) => (
              <div key={r} style={{ display: "contents" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 100, flexShrink: 0 }}>
                  <div style={{ width: 72, height: 72, borderRadius: "50%", background: RANKS[r].bg, border: `2.5px solid ${RANKS[r].color}66`, boxShadow: RANKS[r].glow, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img src={RANK_SVGS[r]} alt={r} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <span style={{ ...ui, fontSize: 11, fontWeight: 700, color: RANKS[r].color, textAlign: "center", marginTop: 8 }}>{r}</span>
                  <span style={{ ...mono, fontSize: 9, color: C.textMuted, marginTop: 4 }}>{RANKS[r].tier}</span>
                  <span style={{ ...mono, fontSize: 8, color: C.textMuted, marginTop: 2 }}>{RANKS[r].min / 1000}k XP</span>
                </div>
                {i < Object.keys(RANKS).length - 1 && (
                  <div style={{ width: 24, height: 2, background: `linear-gradient(90deg, ${RANKS[r].color}55, ${RANKS[(Object.keys(RANKS) as Rank[])[i + 1]].color}55)`, borderRadius: 1, flexShrink: 0, marginBottom: 52 }} />
                )}
              </div>
            ))}
            <div style={{ width: 24, height: 2, background: `linear-gradient(90deg, ${RANKS.Sirena.color}44, rgba(255,255,255,0.08))`, borderRadius: 1, flexShrink: 0, marginBottom: 52 }} />
            {COMING_SOON_RANKS.map((cs, i) => (
              <div key={`cs-${i}`} style={{ display: "contents" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 100, flexShrink: 0 }}>
                  <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(255,255,255,0.02)", border: "2.5px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 22, opacity: 0.25 }}>🔒</span>
                  </div>
                  <span style={{ ...ui, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.15)", textAlign: "center", marginTop: 8 }}>{cs.name}</span>
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

      {/* Achievement cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
        {items.map((a, i) => (
          <Card key={a.key} style={{ padding: 20, opacity: a.done ? 1 : 0.5, animation: `slideUp 0.4s ease-out ${i * 0.06}s both`, position: "relative", overflow: "hidden" }} glowColor={a.done ? a.color : undefined}>
            {a.done && <div style={{ position: "absolute", top: -15, right: -15, width: 50, height: 50, borderRadius: "50%", background: `radial-gradient(circle, ${a.color}15, transparent)` }} />}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontSize: 30, animation: a.done ? "bounce 3s ease-in-out infinite" : "none", animationDelay: `${i * 0.4}s` }}>{a.icon}</div>
              {a.done
                ? <div style={{ ...ui, fontSize: 9, color: C.green, fontWeight: 700, background: "rgba(76,175,125,0.1)", border: "1px solid rgba(76,175,125,0.2)", padding: "3px 8px", borderRadius: 6 }}>✓ Done</div>
                : <div style={{ ...ui, fontSize: 9, color: C.textMuted, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", padding: "3px 8px", borderRadius: 6 }}>🔒</div>
              }
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
