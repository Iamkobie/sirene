import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { C, ui, mono, pixel } from "../constants/theme";
import type { Screen } from "../constants/theme";
import { ProgressBar, Card, Btn, Page } from "../components/shared";

export function EvaluationScreen({ onXP }: { onXP: (n: number) => void }) {
  const navigate = useNavigate();
  const onNav = (s: Screen) => navigate(`/${s}`);
  const [coinsVisible, setCoinsVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setCoinsVisible(true), 300); return () => clearTimeout(t); }, []);

  const scores = [
    { label: "Pronunciation", val: 88, color: C.cyan },
    { label: "Accuracy",      val: 75, color: C.red },
    { label: "Fluency",       val: 82, color: C.gold },
    { label: "Timing",        val: 91, color: C.green },
  ];
  const total = Math.round(scores.reduce((a, s) => a + s.val, 0) / scores.length);
  const xp = Math.round(total * 1.5);
  const grade = total >= 90 ? "S" : total >= 80 ? "A" : total >= 70 ? "B" : total >= 60 ? "C" : "D";
  const gc = total >= 80 ? C.green : total >= 60 ? C.gold : C.red;

  return (
    <Page maxWidth={660}>
      {coinsVisible && (
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 200, overflow: "hidden" }}>
          {[...Array(10)].map((_, i) => <div key={i} style={{ position: "absolute", left: `${10 + i * 8}%`, bottom: "35%", fontSize: 24, animation: `coinFly 1.4s ease-out ${i * 0.08}s both` }}>🪙</div>)}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
        <Card style={{ padding: 28, textAlign: "center", borderTop: `3px solid ${gc}` }} glowColor={gc}>
          <div style={{ ...pixel, fontSize: 8, color: C.textMuted, letterSpacing: "0.08em", marginBottom: 12 }}>MISSION COMPLETE</div>
          <div style={{ fontSize: 80, fontWeight: 900, color: gc, lineHeight: 1, marginBottom: 6, ...ui, textShadow: `0 0 30px ${gc}66`, animation: "bounce 1s ease-in-out" }}>{grade}</div>
          <div style={{ ...mono, fontSize: 26, color: C.text }}>{total}/100</div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 12, padding: "6px 14px", borderRadius: 50, background: "rgba(255,215,0,0.1)", border: "1.5px solid rgba(255,215,0,0.25)", animation: "wiggle 1s ease-in-out infinite" }}>
            <span>🪙</span><span style={{ ...ui, fontSize: 13, fontWeight: 800, color: C.gold }}>+{xp} XP</span>
          </div>
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
        </Card>
      </div>

      <Card style={{ padding: 22, marginBottom: 18 }}>
        <div style={{ ...ui, fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 12 }}>🤖 AI Feedback</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {["Great pronunciation on vowels!", "Work on tonal patterns.", "Fluency improved +12% this week.", "Practice consonant clusters more."].map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 12px", borderRadius: 8, background: i === 0 || i === 2 ? "rgba(76,175,125,0.06)" : "rgba(255,26,26,0.04)", border: `1px solid ${i === 0 || i === 2 ? "rgba(76,175,125,0.15)" : "rgba(255,26,26,0.1)"}` }}>
              <span style={{ fontSize: 13 }}>{i === 0 || i === 2 ? "✅" : "⚠️"}</span>
              <span style={{ ...ui, fontSize: 13, color: C.text, lineHeight: 1.5 }}>{f}</span>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: "flex", gap: 10 }}>
        <Btn color={C.textMuted} variant="outline" size="md" onClick={() => { onXP(xp); onNav("home"); }}>← Home</Btn>
        <Btn color={C.red} size="md" onClick={() => onNav("mission")}>Next Phrase →</Btn>
      </div>
    </Page>
  );
}
