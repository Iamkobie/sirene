import { useState } from "react";
import { useNavigate } from "react-router";
import { C, ui, mono, pixel } from "../constants/theme";
import type { Screen } from "../constants/theme";
import { ProgressBar, Card, Btn, Page } from "../components/shared";

export function MissionScreen({ challengePhrase }: { challengePhrase: any }) {
  const navigate = useNavigate();
  const onNav = (s: Screen) => navigate(`/${s}`);
  const [idx, setIdx] = useState(0);
  const phrases = [
    { src: "Kumain ka na ba?", tgt: "Nakakaon na ba ka?", rom: "Have you eaten yet?" },
    { src: "Asan ka na?", tgt: "Hain ka na?", rom: "Where are you now?" },
    { src: "Magandang umaga.", tgt: "Maayong buntag.", rom: "Good morning." },
  ];

  const activeSrc = challengePhrase?.text || phrases[idx].src;
  const activeTgtLang = challengePhrase?.target_language || "Bisaya";
  const activeDiff = challengePhrase?.difficulty || "Normal";
  const activeTgtSuggestion = challengePhrase?.target_text_suggestion || (challengePhrase ? "" : phrases[idx].tgt);
  const activeTransliteration = challengePhrase?.transliteration || (challengePhrase ? "" : phrases[idx].rom);

  return (
    <Page maxWidth={660}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ ...ui, fontSize: 24, fontWeight: 900, color: C.text, margin: 0 }}>⚔️ Phrase Challenge</h1>
          <p style={{ ...ui, fontSize: 13, color: C.textMuted, margin: "4px 0 0" }}>
            {challengePhrase?.source_language || "Tagalog"} → {activeTgtLang} · {activeDiff}
          </p>
        </div>
        <span style={{ ...pixel, fontSize: 8, color: C.red, background: `rgba(255,26,26,0.1)`, border: `1.5px solid ${C.red}33`, padding: "6px 12px", borderRadius: 8, boxShadow: `0 0 8px ${C.red}22` }}>LVL 4-2</span>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ ...ui, fontSize: 12, color: C.textMuted }}>Phrase {challengePhrase ? 1 : idx + 1} of {challengePhrase ? 1 : phrases.length}</span>
          <span style={{ ...mono, fontSize: 12, color: C.red }}>{challengePhrase ? "100" : Math.round((idx / phrases.length) * 100)}%</span>
        </div>
        <ProgressBar pct={challengePhrase ? 100 : (idx / phrases.length) * 100} color={C.red} height={8} />
      </div>

      <Card style={{ padding: 28, marginBottom: 18, borderLeft: `4px solid ${C.red}` }} glowColor={C.red}>
        <div style={{ ...pixel, fontSize: 8, color: C.textMuted, letterSpacing: "0.08em", marginBottom: 12 }}>TRANSLATE THIS</div>
        <p style={{ ...ui, fontSize: 22, fontWeight: 800, color: C.text, lineHeight: 1.5, marginBottom: 22 }}>"{activeSrc}"</p>
        {activeTgtSuggestion && (
          <div style={{ background: "rgba(255,26,26,0.05)", border: `2px solid ${C.red}22`, borderRadius: 14, padding: 18 }}>
            <div style={{ ...ui, fontSize: 11, color: C.textMuted, marginBottom: 5 }}>{activeTgtLang} translation suggestion</div>
            <div style={{ ...ui, fontSize: 22, color: C.redLight, fontWeight: 800, marginBottom: 4 }}>{activeTgtSuggestion}</div>
            {activeTransliteration && <div style={{ ...mono, fontSize: 12, color: C.textMuted }}>{activeTransliteration}</div>}
          </div>
        )}
      </Card>

      <div style={{ display: "flex", gap: 10 }}>
        <Btn color={C.cyan} variant="outline" size="md" onClick={() => {}}>♪ Listen</Btn>
        <Btn color={C.red} size="md" onClick={() => onNav("recording")}>● Record</Btn>
        <div style={{ flex: 1 }} />
        {!challengePhrase && (
          <Btn color={C.textMuted} variant="ghost" size="md" onClick={() => setIdx((i) => Math.min(i + 1, phrases.length - 1))}>Skip ➡️</Btn>
        )}
      </div>
    </Page>
  );
}
