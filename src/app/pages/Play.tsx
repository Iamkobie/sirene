import { useState } from "react";
import { useNavigate } from "react-router";
import { C, ui, mono, pixel, SOURCE_PHRASES } from "../constants/theme";
import type { Screen } from "../constants/theme";
import { Card, Btn, Page } from "../components/shared";

export function PlayScreen() {
  const navigate = useNavigate();
  const onNav = (s: Screen) => navigate(`/${s}`);
  const [from, setFrom] = useState("English");
  const [to, setTo] = useState("Bisaya");
  const [diff, setDiff] = useState("Normal");
  const [phraseIdx, setPhraseIdx] = useState(0);

  const sources = ["English", "Tagalog"];
  const targets = ["Bisaya", "Cebuano", "Kapampangan", "Ilocano", "Waray", "Hiligaynon", "Bicolano", "Tagalog"];
  const diffs = [
    { label: "Easy",   color: C.green, icon: "🌱" },
    { label: "Normal", color: C.red, icon: "⚔️" },
    { label: "Hard",   color: C.gold, icon: "🔥" },
    { label: "Expert", color: "#ff1a1a", icon: "💀" },
  ];

  const phrases = SOURCE_PHRASES[from] ?? [];
  const activePhraseText = phrases[phraseIdx] ?? phrases[0];

  const selStyle: React.CSSProperties = {
    ...ui, width: "100%", background: "rgba(255,26,26,0.03)",
    border: `2px solid ${C.border}`, borderRadius: 12,
    padding: "12px 36px 12px 14px", color: C.text, fontSize: 14,
    outline: "none", cursor: "pointer", appearance: "none",
  };

  return (
    <Page maxWidth={660}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ ...ui, fontSize: 28, fontWeight: 900, color: C.text, margin: 0 }}>New Challenge</h1>
        <p style={{ ...ui, fontSize: 13, color: C.textMuted, margin: "6px 0 0" }}>Choose your language, pick a phrase, then battle! ⚔️</p>
      </div>

      <Card style={{ padding: 0, overflow: "hidden", marginBottom: 20, borderTop: `3px solid ${C.red}`, position: "relative" }} glowColor={C.red}>
        {/* Retro corner accents */}
        <div style={{ position: "absolute", top: 0, left: 0, width: 30, height: 30, borderBottom: `1px solid ${C.red}22`, borderRight: `1px solid ${C.red}22`, zIndex: 1, pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 0, right: 0, width: 30, height: 30, borderBottom: `1px solid ${C.red}22`, borderLeft: `1px solid ${C.red}22`, zIndex: 1, pointerEvents: "none" }} />

        <div style={{ padding: "24px 24px 20px", borderBottom: `1.5px solid ${C.border}`, background: "rgba(255,26,26,0.04)", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.red, boxShadow: `0 0 8px ${C.red}88`, animation: "pulse 1.5s ease-in-out infinite" }} />
              <span style={{ ...pixel, fontSize: 8, color: C.textMuted, letterSpacing: "0.1em" }}>PHRASE TO TRANSLATE</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ ...mono, fontSize: 11, color: C.textMuted }}>{phraseIdx + 1}/{phrases.length}</span>
              <button onClick={() => setPhraseIdx((i) => (i + 1) % phrases.length)}
                style={{ background: "rgba(255,26,26,0.08)", border: `1.5px solid ${C.red}33`, borderRadius: 8, padding: "6px 14px", color: C.red, cursor: "pointer", fontSize: 11, fontWeight: 700, ...ui }}>Next</button>
            </div>
          </div>
          <p style={{ ...ui, fontSize: 24, fontWeight: 900, color: C.text, margin: 0, lineHeight: 1.4 }}>"{activePhraseText}"</p>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16 }}>
            <span style={{ ...ui, fontSize: 12, color: C.textMuted }}>Speak this in</span>
            <span style={{ ...pixel, fontSize: 9, color: C.red, background: `rgba(255,26,26,0.12)`, border: `1.5px solid ${C.red}44`, borderRadius: 6, padding: "4px 12px" }}>{to}</span>
          </div>
        </div>

        <div style={{ padding: "24px 24px 28px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
            <div>
              <div style={{ ...ui, fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Source Language</div>
              <div style={{ position: "relative" }}>
                <select value={from} onChange={(e) => { setFrom(e.target.value); setPhraseIdx(0); }} style={selStyle}>{sources.map((l) => <option key={l}>{l}</option>)}</select>
                <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: C.textMuted, pointerEvents: "none", fontSize: 11 }}>▾</span>
              </div>
            </div>
            <div>
              <div style={{ ...ui, fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Target Dialect</div>
              <div style={{ position: "relative" }}>
                <select value={to} onChange={(e) => setTo(e.target.value)} style={selStyle}>{targets.map((l) => <option key={l}>{l}</option>)}</select>
                <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: C.textMuted, pointerEvents: "none", fontSize: 11 }}>▾</span>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ ...ui, fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Difficulty</div>
            <div style={{ display: "flex", gap: 8 }}>
              {diffs.map((d) => (
                <button key={d.label} onClick={() => setDiff(d.label)}
                  style={{ flex: 1, padding: "12px 0", borderRadius: 10, cursor: "pointer", background: diff === d.label ? d.color : "rgba(255,255,255,0.03)", border: `2px solid ${diff === d.label ? d.color : C.border}`, color: diff === d.label ? "#fff" : C.textMuted, fontWeight: 800, fontSize: 12, transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)", boxShadow: diff === d.label ? `0 4px 16px ${d.color}44` : "none", transform: diff === d.label ? "scale(1.04) translateY(-2px)" : "scale(1)", ...ui }}
                >{d.icon} {d.label}</button>
              ))}
            </div>
          </div>
          <Btn color={C.red} onClick={() => onNav("mission")} full size="lg">⚔️  Start Challenge</Btn>
        </div>
      </Card>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 14, borderRadius: 2, background: C.red, boxShadow: `0 0 6px ${C.red}66` }} />
        <span style={{ ...pixel, fontSize: 8, color: C.textMuted, letterSpacing: "0.1em" }}>ALL PHRASES</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {phrases.map((p, i) => (
          <button key={i} onClick={() => setPhraseIdx(i)}
            style={{ ...ui, textAlign: "left", padding: "12px 16px", borderRadius: 10, border: `1.5px solid ${i === phraseIdx ? C.red + "55" : C.border}`, background: i === phraseIdx ? "rgba(255,26,26,0.06)" : "rgba(255,255,255,0.01)", cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 12, transform: i === phraseIdx ? "scale(1.01)" : "scale(1)" }}
          >
            <span style={{ ...mono, fontSize: 10, color: i === phraseIdx ? C.red : C.textMuted, width: 18, flexShrink: 0 }}>{String(i + 1).padStart(2, "0")}</span>
            <span style={{ ...ui, fontSize: 13, color: i === phraseIdx ? C.text : C.textMuted, fontWeight: i === phraseIdx ? 700 : 400 }}>{p}</span>
            {i === phraseIdx && <span style={{ marginLeft: "auto", fontSize: 11, color: C.red, fontWeight: 700 }}>●</span>}
          </button>
        ))}
      </div>
    </Page>
  );
}
