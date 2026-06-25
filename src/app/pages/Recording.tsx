import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { C, mono } from "../constants/theme";
import type { Screen } from "../constants/theme";
import { Btn, Page, PageHeader } from "../components/shared";

export function RecordingScreen({ challengePhrase }: { challengePhrase?: any }) {
  const navigate = useNavigate();
  const onNav = (s: Screen) => navigate(`/${s}`);
  const [phase, setPhase] = useState<"idle" | "rec" | "done">("idle");
  const [secs, setSecs] = useState(0);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = () => { setPhase("rec"); setSecs(0); ref.current = setInterval(() => setSecs((s) => s + 1), 1000); };
  const stop = () => { setPhase("done"); if (ref.current) clearInterval(ref.current); };
  useEffect(() => () => { if (ref.current) clearInterval(ref.current); }, []);

  return (
    <Page maxWidth={540}>
      <PageHeader
        title={phase === "idle" ? "🎤 Ready to Record" : phase === "rec" ? "🔴 Recording…" : "✅ Recording Complete"}
        subtitle={phase === "idle" ? "Tap the button when ready" : phase === "rec" ? "Speak clearly — tap mic to stop" : "Review before submitting"}
      />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, marginBottom: 28 }}>
        <div onClick={phase === "rec" ? stop : undefined}
          style={{ width: 110, height: 110, borderRadius: "50%", cursor: phase === "rec" ? "pointer" : "default", background: phase === "rec" ? `linear-gradient(135deg, ${C.red}, ${C.redDark})` : "rgba(255,26,26,0.06)", border: `4px solid ${phase === "rec" ? C.red : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, boxShadow: phase === "rec" ? `0 0 50px ${C.red}55, 0 0 100px ${C.red}22` : "0 4px 20px rgba(0,0,0,0.3)", transition: "all 0.3s ease", animation: phase === "rec" ? "pulse 1s ease-in-out infinite" : "none" }}
        >🎤</div>
        <div style={{ ...mono, fontSize: 36, color: phase === "rec" ? C.red : C.textMuted, letterSpacing: 4, textShadow: phase === "rec" ? `0 0 14px ${C.red}66` : "none" }}>
          {String(Math.floor(secs / 60)).padStart(2, "0")}:{String(secs % 60).padStart(2, "0")}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 3, height: 36 }}>
          {[...Array(28)].map((_, i) => {
            const h = phase === "rec" ? 4 + Math.abs(Math.sin(i * 0.8 + secs * 3)) * 28 : 3;
            return <div key={i} style={{ width: 3, height: h, borderRadius: 2, background: phase === "rec" ? (i % 3 === 0 ? C.red : i % 3 === 1 ? C.redLight : C.redDark) : "rgba(255,255,255,0.06)", transition: "height 0.1s ease", boxShadow: phase === "rec" ? `0 0 4px ${C.red}33` : "none" }} />;
          })}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 300, margin: "0 auto" }}>
        {phase === "idle" && <Btn color={C.red} size="lg" full onClick={start}>● Start Recording</Btn>}
        {phase === "rec" && <div style={{ display: "flex", gap: 10 }}><Btn color={C.red} size="md" full onClick={stop}>■ Stop</Btn><Btn color={C.textMuted} variant="outline" size="md" full onClick={() => { setPhase("idle"); setSecs(0); }}>✕ Cancel</Btn></div>}
        {phase === "done" && <><Btn color={C.cyan} variant="outline" size="md" full onClick={() => {}}>▶ Play Back</Btn><Btn color={C.red} size="md" full onClick={() => onNav("evaluation")}>★ Submit</Btn><Btn color={C.textMuted} variant="ghost" size="sm" full onClick={() => setPhase("idle")}>↺ Record again</Btn></>}
      </div>
    </Page>
  );
}
