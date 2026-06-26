import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../lib/supabase";
import { isSameQuestDay } from "../../lib/dailyQuest";
import { C, ui, mono, pixel } from "../constants/theme";
import { Card, Btn, Page } from "../components/shared";

const QUEST_DEFS = [
  { key: "translation_sprint" as const, title: "Translation Sprint", desc: "Translate 10 phrases in 5 minutes", xp: 200, color: C.red, icon: "⚡", route: "/play" },
  { key: "accent_master" as const,      title: "Accent Master",      desc: "Score 90+ on pronunciation",         xp: 150, color: C.cyan, icon: "🎤", route: "/play" },
  { key: "vocab_blitz" as const,        title: "Vocab Blitz",        desc: "Learn 20 new words today",           xp: 100, color: C.green, icon: "📖", route: "/training" },
  { key: "community_share" as const,    title: "Community Share",    desc: "Contribute 5 voice recordings",      xp: 75,  color: C.gold, icon: "🤝", route: "/recording" },
];

export function DailyScreen() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [questFlags, setQuestFlags] = useState<Record<string, boolean>>({
    translation_sprint: false,
    accent_master: false,
    vocab_blitz: false,
    community_share: false,
  });

  const quests = QUEST_DEFS.map((q) => ({
    ...q,
    done: questFlags[q.key] === true,
  }));

  useEffect(() => {
    async function loadQuests() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("daily_quest")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data && isSameQuestDay(data.created_at)) {
          setQuestFlags({
            translation_sprint: data.translation_sprint === true,
            accent_master: data.accent_master === true,
            vocab_blitz: data.vocab_blitz === true,
            community_share: data.community_share === true,
          });
        } else {
          setQuestFlags({
            translation_sprint: false,
            accent_master: false,
            vocab_blitz: false,
            community_share: false,
          });
        }
      } catch (err) {
        console.error("Error loading daily quests:", err);
      } finally {
        setLoading(false);
      }
    }
    loadQuests();
  }, []);

  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    function calcTimeLeft() {
      const now = new Date();
      const next8am = new Date(now);
      next8am.setHours(8, 0, 0, 0);
      if (now >= next8am) next8am.setDate(next8am.getDate() + 1);
      const diff = next8am.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }
    setTimeLeft(calcTimeLeft());
    const interval = setInterval(() => setTimeLeft(calcTimeLeft()), 1000);
    return () => clearInterval(interval);
  }, []);

  const doneCount = quests.filter((q) => q.done).length;

  return (
    <Page maxWidth={700}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ ...ui, fontSize: 28, fontWeight: 900, color: C.text, margin: 0 }}>⚡ Daily Quests</h1>
          <p style={{ ...ui, fontSize: 13, color: C.textMuted, margin: "6px 0 0" }}>Complete all 4 for a bonus XP reward!</p>
        </div>
        <Card style={{ padding: "16px 22px", textAlign: "center", position: "relative", overflow: "hidden" }} glowColor={C.red}>
          <div style={{ position: "absolute", top: 6, left: 6, width: 12, height: 12, borderTop: `1.5px solid ${C.red}44`, borderLeft: `1.5px solid ${C.red}44`, borderRadius: "3px 0 0 0" }} />
          <div style={{ position: "absolute", top: 6, right: 6, width: 12, height: 12, borderTop: `1.5px solid ${C.red}44`, borderRight: `1.5px solid ${C.red}44`, borderRadius: "0 3px 0 0" }} />
          <div style={{ ...pixel, fontSize: 7, color: C.textMuted, marginBottom: 6, letterSpacing: "0.12em" }}>RESETS IN</div>
          <div style={{ ...mono, fontSize: 22, color: C.red, fontWeight: 700, letterSpacing: 3, textShadow: `0 0 14px ${C.red}55` }}>{timeLeft}</div>
        </Card>
      </div>

      <Card style={{ padding: "16px 22px", marginBottom: 20, display: "flex", alignItems: "center", gap: 16 }} glowColor={doneCount === quests.length ? C.green : C.red}>
        <div style={{ display: "flex", gap: 5 }}>
          {quests.map((q, i) => <div key={i} style={{ width: 28, height: 6, borderRadius: 3, background: q.done ? C.green : "rgba(255,255,255,0.06)", boxShadow: q.done ? `0 0 6px ${C.green}66` : "none", transition: "all 0.3s" }} />)}
        </div>
        <span style={{ ...mono, fontSize: 12, color: doneCount === quests.length ? C.green : C.textMuted, fontWeight: 700 }}>{doneCount}/{quests.length}</span>
        <div style={{ flex: 1 }} />
        {doneCount === quests.length && <span style={{ ...pixel, fontSize: 8, color: C.green, animation: "pulse 1.5s infinite" }}>ALL COMPLETE!</span>}
        {doneCount < quests.length && <span style={{ ...ui, fontSize: 11, color: C.textMuted }}>{quests.length - doneCount} remaining</span>}
      </Card>

      {loading ? (
        <div style={{ ...ui, fontSize: 13, color: C.textMuted, textAlign: "center", padding: 40 }}>Loading quests...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {quests.map((q, i) => (
            <Card key={q.title} style={{ padding: 20, animation: `slideUp 0.4s ease-out ${i * 0.08}s both`, position: "relative", overflow: "hidden", borderLeft: q.done ? `4px solid ${C.green}` : `4px solid ${q.color}33` }} glowColor={q.done ? C.green : q.color}>
              {!q.done && <div style={{ position: "absolute", top: -20, right: -20, width: 60, height: 60, borderRadius: "50%", background: `radial-gradient(circle, ${q.color}0a, transparent)` }} />}
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: q.done ? "rgba(76,175,125,0.1)" : `${q.color}12`, border: `2px solid ${q.done ? C.green + "44" : q.color + "44"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0, transition: "all 0.3s" }}>{q.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ ...ui, fontSize: 15, fontWeight: 800, color: q.done ? C.textMuted : C.text, textDecoration: q.done ? "line-through" : "none" }}>{q.title}</span>
                    {q.done && <span style={{ ...ui, fontSize: 10, fontWeight: 700, color: C.green, background: "rgba(76,175,125,0.12)", border: "1px solid rgba(76,175,125,0.25)", padding: "3px 10px", borderRadius: 50 }}>✓ Complete</span>}
                  </div>
                  <p style={{ ...ui, fontSize: 12, color: C.textMuted, margin: 0, lineHeight: 1.4 }}>{q.desc}</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
                  <span style={{ ...mono, fontSize: 13, fontWeight: 800, color: C.gold, textShadow: `0 0 8px ${C.gold}33` }}>+{q.xp} XP</span>
                  {!q.done && <Btn color={q.color} size="sm" onClick={() => navigate(q.route)}>Start →</Btn>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Page>
  );
}
