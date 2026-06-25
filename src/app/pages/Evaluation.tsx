import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../lib/supabase";
import { C, ui, mono, pixel } from "../constants/theme";
import type { Screen } from "../constants/theme";
import { ProgressBar, Card, Btn, Page } from "../components/shared";

export function EvaluationScreen({ challengePhrase, user, refreshProfile }: { challengePhrase: any; user: any; refreshProfile: () => void }) {
  const navigate = useNavigate();
  const onNav = (s: Screen) => navigate(`/${s}`);
  const [coinsVisible, setCoinsVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setCoinsVisible(true), 300);
    return () => clearTimeout(t);
  }, []);

  // Extract Gemini scores from challengePhrase or use mock fallbacks
  const gemini = challengePhrase?.geminiResult;
  const fluency        = gemini?.fluency         ?? 82;
  const pronunciation  = gemini?.pronunciation   ?? 88;
  const completeness   = gemini?.completeness    ?? 91;
  const accuracy       = gemini?.accuracy        ?? 75;
  const overallScore   = gemini?.overall_score   ?? Math.round((fluency + pronunciation + completeness + accuracy) / 4);
  const aiFeedback     = gemini?.feedback        ?? null;
  const transcription  = gemini?.transcription   ?? challengePhrase?.text ?? "";
  const clipId         = gemini?.clip_id         ?? null;

  const scores = [
    { label: "Pronunciation", val: pronunciation, color: C.cyan },
    { label: "Accuracy",      val: accuracy,      color: C.red },
    { label: "Fluency",       val: fluency,       color: C.gold },
    { label: "Completeness",  val: completeness,  color: C.green },
  ];

  // Difficulty-based XP calculation
  const difficultyLabel = challengePhrase?.difficulty || "Normal";
  const maxPoints = difficultyLabel === "Easy" ? 25 : difficultyLabel === "Normal" ? 50 : difficultyLabel === "Hard" ? 75 : 100;
  const xp = Number(((overallScore / 100.0) * maxPoints).toFixed(1));
  const grade = overallScore >= 90 ? "S" : overallScore >= 80 ? "A" : overallScore >= 70 ? "B" : overallScore >= 60 ? "C" : "D";
  const gc = overallScore >= 80 ? C.green : overallScore >= 60 ? C.gold : C.red;

  // Save attempt to Supabase
  useEffect(() => {
    const saveAttempt = async () => {
      if (!user || !challengePhrase?.id || saved) return;
      setSaving(true);
      try {
        const { error } = await supabase
          .from("user_phrase_attempts")
          .insert({
            user_id: user.id,
            phrase_id: challengePhrase.id,
            clip_id: clipId,
            transcription: transcription,
            fluency_score: fluency,
            pronunciation_score: pronunciation,
            completeness_score: completeness,
            accuracy_score: accuracy,
            overall_score: overallScore,
            points_earned: xp,
            feedback: aiFeedback || ("Great effort! " + (overallScore >= 90 ? "Phrase mastered!" : "Try again to reach 90+."))
          });
        if (error) {
          console.error("Save attempt error:", error);
        } else {
          setSaved(true);
          refreshProfile();
        }
      } catch (err) {
        console.error("Save attempt error:", err);
      } finally {
        setSaving(false);
      }
    };
    saveAttempt();
  }, [user, challengePhrase, saved]);

  // Feedback items
  const feedbackItems = aiFeedback
    ? [{ text: aiFeedback, positive: overallScore >= 70 }]
    : [
        { text: pronunciation >= 80 ? "Great pronunciation!" : "Work on your pronunciation.", positive: pronunciation >= 80 },
        { text: accuracy >= 80 ? "High accuracy — well done!" : "Try to improve word accuracy.", positive: accuracy >= 80 },
        { text: fluency >= 80 ? "Smooth and fluent delivery!" : "Work on tonal patterns and flow.", positive: fluency >= 80 },
        { text: completeness >= 90 ? "Complete phrase captured!" : "Try to say the full phrase clearly.", positive: completeness >= 90 },
      ];

  return (
    <Page maxWidth={660}>
      {coinsVisible && (
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 200, overflow: "hidden" }}>
          {[...Array(10)].map((_, i) => <div key={i} style={{ position: "absolute", left: `${10 + i * 8}%`, bottom: "35%", fontSize: 24, animation: `coinFly 1.4s ease-out ${i * 0.08}s both` }}>🪙</div>)}
        </div>
      )}

      {/* Challenge context banner */}
      <Card style={{ padding: "12px 18px", marginBottom: 18, display: "flex", alignItems: "center", justifyContent: "space-between", borderLeft: `4px solid ${gc}` }} glowColor={gc}>
        <div>
          <div style={{ ...ui, fontSize: 11, color: C.textMuted }}>
            {challengePhrase?.source_language || "Tagalog"} → {challengePhrase?.target_language || "Bisaya"} · {difficultyLabel}
          </div>
          <div style={{ ...ui, fontSize: 13, fontWeight: 700, color: C.text, marginTop: 2 }}>"{challengePhrase?.text || "Phrase"}"</div>
        </div>
        <div style={{ ...pixel, fontSize: 8, color: gc, background: `${gc}18`, border: `1.5px solid ${gc}33`, padding: "5px 10px", borderRadius: 6 }}>
          {maxPoints} MAX PTS
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
        <Card style={{ padding: 28, textAlign: "center", borderTop: `3px solid ${gc}` }} glowColor={gc}>
          <div style={{ ...pixel, fontSize: 8, color: C.textMuted, letterSpacing: "0.08em", marginBottom: 12 }}>MISSION COMPLETE</div>
          <div style={{ fontSize: 80, fontWeight: 900, color: gc, lineHeight: 1, marginBottom: 6, ...ui, textShadow: `0 0 30px ${gc}66`, animation: "bounce 1s ease-in-out" }}>{grade}</div>
          <div style={{ ...mono, fontSize: 26, color: C.text }}>{overallScore}/100</div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 12, padding: "6px 14px", borderRadius: 50, background: "rgba(255,215,0,0.1)", border: "1.5px solid rgba(255,215,0,0.25)", animation: "wiggle 1s ease-in-out infinite" }}>
            <span>🪙</span><span style={{ ...ui, fontSize: 13, fontWeight: 800, color: C.gold }}>+{xp} XP</span>
          </div>
          {overallScore >= 90 && (
            <div style={{ ...ui, fontSize: 11, color: C.green, fontWeight: 700, marginTop: 8, animation: "pulse 1.5s ease-in-out infinite" }}>🎯 Phrase Mastered!</div>
          )}
        </Card>
        <Card style={{ padding: 22 }} glowColor={C.red}>
          <div style={{ ...ui, fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 14 }}>Score Breakdown</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {scores.map((s) => (
              <div key={s.label}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ ...ui, fontSize: 12, color: C.text }}>{s.label}</span>
                  <span style={{ ...mono, fontSize: 12, color: s.color, fontWeight: 800 }}>{s.val}</span>
                </div>
                <ProgressBar pct={s.val} color={s.color} />
              </div>
            ))}
          </div>
          {/* XP calculation breakdown */}
          <div style={{ marginTop: 14, padding: "10px 12px", borderRadius: 8, background: "rgba(255,215,0,0.05)", border: "1px solid rgba(255,215,0,0.12)" }}>
            <div style={{ ...mono, fontSize: 10, color: C.textMuted }}>
              {overallScore}% of {maxPoints} pts ({difficultyLabel}) = <span style={{ color: C.gold, fontWeight: 800 }}>{xp} XP</span>
            </div>
          </div>
        </Card>
      </div>

      <Card style={{ padding: 22, marginBottom: 18 }}>
        <div style={{ ...ui, fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 12 }}>🤖 AI Feedback</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {saving ? (
            <div style={{ ...ui, fontSize: 13, color: C.textMuted, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ animation: "pulse 1s ease-in-out infinite" }}>⌛</span> Saving attempt to database...
            </div>
          ) : (
            feedbackItems.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 12px", borderRadius: 8, background: f.positive ? "rgba(76,175,125,0.06)" : "rgba(255,26,26,0.04)", border: `1px solid ${f.positive ? "rgba(76,175,125,0.15)" : "rgba(255,26,26,0.1)"}` }}>
                <span style={{ fontSize: 13 }}>{f.positive ? "✅" : "⚠️"}</span>
                <span style={{ ...ui, fontSize: 13, color: C.text, lineHeight: 1.5 }}>{f.text}</span>
              </div>
            ))
          )}
        </div>
        {saved && (
          <div style={{ ...ui, fontSize: 11, color: C.green, fontWeight: 700, marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <span>✓</span> Score saved to your profile
          </div>
        )}
      </Card>

      {/* Transcription display (from Gemini) */}
      {transcription && (
        <Card style={{ padding: 18, marginBottom: 18, borderLeft: `4px solid ${C.cyan}` }} glowColor={C.cyan}>
          <div style={{ ...ui, fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>What Gemini Heard</div>
          <div style={{ ...ui, fontSize: 15, color: C.text, fontWeight: 600, fontStyle: "italic" }}>"{transcription}"</div>
        </Card>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <Btn color={C.textMuted} variant="outline" size="md" onClick={() => onNav("home")}>⬅️ Home</Btn>
        <Btn color={C.gold} variant="outline" size="md" onClick={() => onNav("leaderboard")}>★ Leaderboard</Btn>
        <Btn color={C.red} size="md" onClick={() => onNav("play")}>Next Challenge ➡️</Btn>
      </div>
    </Page>
  );
}
