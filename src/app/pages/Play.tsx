import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../lib/supabase";
import { C, ui, mono, pixel } from "../constants/theme";
import { Card, Btn, Page, ProgressBar } from "../components/shared";
import confetti from "canvas-confetti";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Hint { word: string; translation: string; }

interface PhraseData {
  phrase: string; hints: Hint[]; phrase_id: string;
  difficulty: number; source_language: string; target_language: string;
}

interface EvaluationResult {
  clip_id: string; transcription: string;
  fluency: number; pronunciation: number; completeness: number;
  accuracy: number; overall_score: number; feedback: string;
}

interface AttemptData {
  phraseData: PhraseData; evaluation?: EvaluationResult;
  xpEarned?: number; hintsUsed: number; hintDeductions: number;
}

type GameState = "setup" | "playing" | "waiting" | "results";
type RecordingPhase = "idle" | "recording" | "done";

// ─── Config ───────────────────────────────────────────────────────────────────

const DIFFICULTIES = [
  { value: 1, label: "Easy",   desc: "Max 25 XP",  color: "#4caf7d", maxXP: 25,  hintCost: 5  },
  { value: 2, label: "Medium", desc: "Max 50 XP",  color: "#ff1a1a", maxXP: 50,  hintCost: 15 },
  { value: 3, label: "Hard",   desc: "Max 100 XP", color: "#ffd700", maxXP: 100, hintCost: 25 },
] as const;

const SOURCE_LANGS = ["English", "Tagalog"];

const TARGET_LANGS = [
  { value: "Bisaya",      label: "Bisaya",      flag: "🌊" },
  { value: "Cebuano",     label: "Cebuano",     flag: "🏝️" },
  { value: "Kapampangan", label: "Kapampangan", flag: "🌾" },
  { value: "Ilocano",     label: "Ilocano",     flag: "⛰️" },
  { value: "Waray",       label: "Waray",       flag: "🌋" },
  { value: "Hiligaynon",  label: "Hiligaynon",  flag: "🌺" },
  { value: "Bicolano",    label: "Bicolano",    flag: "🔥" },
  { value: "Pangasinan",  label: "Pangasinan",  flag: "🌅" },
];

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

// ─── Styled dropdown (themed <select>) ──────────────────────────────────────

function LangSelect({
  label, options, value, onChange,
}: {
  label: string;
  options: { value: string; label: string; flag?: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div style={{ ...ui, fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 7 }}>
        {label}
      </div>
      <div style={{ position: "relative" }}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            ...ui,
            width: "100%",
            background: "rgba(255,255,255,0.04)",
            border: `1.5px solid ${C.border}`,
            borderRadius: 10,
            padding: "11px 36px 11px 14px",
            color: C.text,
            fontSize: 14,
            fontWeight: 600,
            outline: "none",
            cursor: "pointer",
            appearance: "none",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            transition: "border-color 0.15s, box-shadow 0.15s",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = C.red;
            e.currentTarget.style.boxShadow = `0 0 0 3px ${C.red}22`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = C.border;
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
          }}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.flag ? `${opt.flag} ${opt.label}` : opt.label}
            </option>
          ))}
        </select>
        <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: C.textMuted, pointerEvents: "none", fontSize: 12 }}>▾</span>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PlayScreen({
  setChallengePhrase, onXP, refreshProfile,
}: {
  setChallengePhrase: (p: any) => void;
  onXP?: (xp: number) => void;
  refreshProfile?: () => void;
}) {
  const navigate = useNavigate();

  const [sourceLang, setSourceLang] = useState("English");
  const [targetLang, setTargetLang] = useState("Bisaya");
  const [difficulty, setDifficulty] = useState(2);

  const [gameState, setGameState]       = useState<GameState>("setup");
  const [currentPhrase, setCurrentPhrase] = useState<PhraseData | null>(null);
  const [attempts, setAttempts]         = useState<AttemptData[]>([]);
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");

  const [recordingPhase, setRecordingPhase] = useState<RecordingPhase>("idle");
  const [recordingSecs, setRecordingSecs]   = useState(0);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [audioBlob, setAudioBlob]           = useState<Blob | null>(null);
  const mediaRecorderRef  = useRef<MediaRecorder | null>(null);
  const audioChunksRef    = useRef<Blob[]>([]);

  const evaluatingRef = useRef(false);
  const [evaluating, setEvaluating] = useState(false);
  const evalQueueRef  = useRef<{
    phraseData: PhraseData; audioBlob: Blob;
    hintsUsed: number; maxXP: number; hintCost: number;
  }[]>([]);

  const currentDiff = DIFFICULTIES.find((d) => d.value === difficulty) ?? DIFFICULTIES[1];

  // ── Hint reveal logic (dynamic, not hardcoded)
  const getRevealedHint = (word: string, idx: number): string => {
    if (idx >= hintsRevealed) return "";
    const len = word.length;
    let reveal: number;
    if (difficulty === 1)      reveal = Math.min(2, Math.ceil(len * 0.3));        // Easy: 1–2 letters
    else if (difficulty === 2) reveal = Math.min(len, Math.max(3, Math.ceil(len * 0.5))); // Medium: 3+ letters
    else                       reveal = len;                                        // Hard: full word
    return word.slice(0, reveal) + "_".repeat(len - reveal);
  };

  const hintDeductionFor = (n: number) => n * currentDiff.hintCost;

  // ── Fetch phrase from backend
  const fetchPhrase = async (): Promise<PhraseData | null> => {
    setLoading(true);
    setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError("Not logged in. Please log in first.");
        return null;
      }
      const params = new URLSearchParams({
        source_language: sourceLang.toLowerCase(),
        target_language: targetLang.toLowerCase(),
        difficulty: String(difficulty),
      });
      const res = await fetch(`${API_URL}/api/phrase?${params}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? body.message ?? `Server error (HTTP ${res.status})`);
      }
      return await res.json() as PhraseData;
    } catch (e: any) {
      const msg = e.message ?? "Failed to fetch phrase.";
      setError(msg.includes("Failed to fetch")
        ? `Cannot reach the backend at ${API_URL}. Is the server running?`
        : msg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ── Game actions
  const handleStartChallenge = async () => {
    const phrase = await fetchPhrase();
    if (phrase) {
      setCurrentPhrase(phrase);
      setHintsRevealed(0);
      setAttempts([]);
      setGameState("playing");
    }
  };

  const revealHint = () => {
    if (!currentPhrase || hintsRevealed >= Math.min(3, currentPhrase.hints.length)) return;
    setHintsRevealed((n) => n + 1);
  };

  // ── Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const mr = new MediaRecorder(stream, { mimeType });
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = () => {
        setAudioBlob(new Blob(audioChunksRef.current, { type: mr.mimeType }));
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setRecordingPhase("recording");
      setRecordingSecs(0);
      recordingTimerRef.current = setInterval(() => setRecordingSecs((s) => s + 1), 1000);
    } catch {
      setError("Cannot access microphone. Please check your browser permissions.");
    }
  };

  const stopRecording = () => {
    setRecordingPhase("done");
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (mediaRecorderRef.current?.state !== "inactive") mediaRecorderRef.current?.stop();
  };

  const reRecord = () => {
    setRecordingPhase("idle");
    setRecordingSecs(0);
    setAudioBlob(null);
    audioChunksRef.current = [];
  };

  // ── Submit + fetch next phrase in parallel
  const handleNext = async () => {
    if (!currentPhrase || !audioBlob) return;
    evalQueueRef.current.push({
      phraseData: currentPhrase, audioBlob,
      hintsUsed: hintsRevealed,
      maxXP: currentDiff.maxXP, hintCost: currentDiff.hintCost,
    });
    setAttempts((prev) => [
      ...prev,
      { phraseData: currentPhrase, hintsUsed: hintsRevealed, hintDeductions: hintDeductionFor(hintsRevealed) },
    ]);
    if (!evaluatingRef.current) processEvalQueue();
    setRecordingPhase("idle");
    setAudioBlob(null);
    setHintsRevealed(0);
    audioChunksRef.current = [];
    const next = await fetchPhrase();
    if (next) setCurrentPhrase(next);
  };

  // ── Background evaluation queue
  const processEvalQueue = async () => {
    if (evaluatingRef.current || evalQueueRef.current.length === 0) return;
    evaluatingRef.current = true;
    setEvaluating(true);
    while (evalQueueRef.current.length > 0) {
      const item = evalQueueRef.current.shift();
      if (!item) continue;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) continue;
        const fd = new FormData();
        fd.append("audio", item.audioBlob);
        fd.append("phrase_id", item.phraseData.phrase_id);
        fd.append("source_language", item.phraseData.source_language);
        fd.append("target_language", item.phraseData.target_language);
        fd.append("source_prompt", item.phraseData.phrase);  // the phrase text Gemini needs to evaluate against
        fd.append("tone", "neutral");                        // default tone; can be extended later
        const res = await fetch(`${API_URL}/api/evaluate`, {
          method: "POST",
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: fd,
        });
        if (res.ok) {
          const ev: EvaluationResult = await res.json();

          // Backend may return skipped:true when accuracy < 50 — still record it
          const xp = Math.max(0, Math.round(((ev.overall_score / 100) * item.maxXP - item.hintsUsed * item.hintCost) * 10) / 10);

          setAttempts((prev) =>
            prev.map((a) =>
              a.phraseData.phrase_id === item.phraseData.phrase_id ? { ...a, evaluation: ev, xpEarned: xp } : a
            )
          );
        }
      } catch (e) { console.error("Eval error:", e); }
    }
    evaluatingRef.current = false;
    setEvaluating(false);
  };

  // ── Save all evaluated attempts to DB, update profiles.xp
  const saveResultsToDB = async (): Promise<number> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    let sessionXP = 0;
    for (const a of attempts) {
      if (!a.evaluation) continue;
      const { error } = await supabase.from("user_phrase_attempts").insert({
        user_id:             user.id,
        phrase_id:           a.phraseData.phrase_id,
        target_language:     a.phraseData.target_language,
        clip_id:             a.evaluation.clip_id,
        transcription:       a.evaluation.transcription,
        fluency_score:       a.evaluation.fluency,
        pronunciation_score: a.evaluation.pronunciation,
        completeness_score:  a.evaluation.completeness,
        accuracy_score:      a.evaluation.accuracy,
        overall_score:       a.evaluation.overall_score,
        points_earned:       a.xpEarned ?? 0,
        feedback:            a.evaluation.feedback,
      });
      if (error) {
        console.error("Insert error:", error.message, error.details, error.hint);
      } else {
        sessionXP += a.xpEarned ?? 0;
      }
    }
    return sessionXP;
  };

  // ── End challenge — wait for evals, save to DB, then show results
  const handleEndChallenge = async () => {
    setGameState("waiting");

    // Wait for background evaluations to finish (max 60s)
    const deadline = Date.now() + 60_000;
    while ((evalQueueRef.current.length > 0 || evaluatingRef.current) && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 300));
    }

    // Save to DB immediately — don't wait for user to click "Save"
    const sessionXP = await saveResultsToDB();
    if (sessionXP > 0) onXP?.(sessionXP);
    refreshProfile?.();

    setGameState("results");
  };

  // ── "Save & Finish" on results screen — just confetti + navigate (already saved)
  const handleSaveResults = async () => {
    confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
    setGameState("setup");
    setAttempts([]);
    setCurrentPhrase(null);
    navigate("/home");
  };

  useEffect(() => {
    return () => { if (recordingTimerRef.current) clearInterval(recordingTimerRef.current); };
  }, []);

  // ── Derived stats
  const totalXP   = attempts.reduce((s, a) => s + (a.xpEarned ?? 0), 0);
  const evaluated = attempts.filter((a) => a.evaluation);
  const avgScore  = evaluated.length > 0
    ? evaluated.reduce((s, a) => s + a.evaluation!.overall_score, 0) / evaluated.length : 0;
  const avg = (key: keyof EvaluationResult) =>
    evaluated.length > 0
      ? evaluated.reduce((s, a) => s + (a.evaluation![key] as number), 0) / evaluated.length : 0;

  // ════════════════════════════════════════════════════════════════════════════
  // SETUP SCREEN
  // ════════════════════════════════════════════════════════════════════════════

  if (gameState === "setup") {
    const targetOpts = TARGET_LANGS.map((l) => ({ value: l.value, label: l.label, flag: l.flag }));
    const sourceOpts = SOURCE_LANGS.map((l) => ({ value: l, label: l }));

    return (
      <Page maxWidth={700}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ ...ui, fontSize: 28, fontWeight: 900, color: C.text, margin: 0 }}>
            Phrase Challenge
          </h1>
          <p style={{ ...ui, fontSize: 13, color: C.textMuted, margin: "6px 0 0" }}>
            Choose your languages and difficulty, then start playing!
          </p>
        </div>

        {/* Info banner */}
        <Card style={{ padding: "16px 20px", marginBottom: 20, background: "rgba(255,26,26,0.05)", border: `1.5px solid ${C.red}33` }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <span style={{ fontSize: 24 }}>🎙</span>
            <div>
              <div style={{ ...ui, fontSize: 13, fontWeight: 700, color: C.red, marginBottom: 4 }}>
                Test your dialect skills!
              </div>
              <div style={{ ...ui, fontSize: 12, color: C.textMuted, lineHeight: 1.6 }}>
                Translate phrases by speaking them in the target dialect.
                AI scores your pronunciation, fluency, accuracy, and completeness.
                Earn XP — use hints only if you need them.
              </div>
            </div>
          </div>
        </Card>

        {/* Setup card */}
        <Card style={{ padding: 0, overflow: "hidden", borderTop: `3px solid ${C.red}` }} glowColor={C.red}>
          <div style={{ padding: "20px 24px 16px", borderBottom: `1.5px solid ${C.border}`, background: "rgba(255,26,26,0.03)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.red, boxShadow: `0 0 8px ${C.red}`, animation: "pulse 1.5s ease-in-out infinite" }} />
              <span style={{ ...pixel, fontSize: 8, color: C.textMuted, letterSpacing: "0.08em" }}>CHALLENGE SETUP</span>
            </div>
          </div>

          <div style={{ padding: "24px" }}>

            {/* Language pickers — side by side */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
              <LangSelect
                label="Source Language"
                options={sourceOpts}
                value={sourceLang}
                onChange={setSourceLang}
              />
              <LangSelect
                label="Target Language"
                options={targetOpts}
                value={targetLang}
                onChange={setTargetLang}
              />
            </div>

            {/* Difficulty */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ ...ui, fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
                Difficulty
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                {DIFFICULTIES.map((d) => {
                  const active = difficulty === d.value;
                  return (
                    <button
                      key={d.value}
                      onClick={() => setDifficulty(d.value)}
                      style={{
                        flex: 1, padding: "14px 8px", borderRadius: 12, cursor: "pointer",
                        background: active ? `${d.color}22` : "rgba(255,255,255,0.02)",
                        border: `2px solid ${active ? d.color : "rgba(255,255,255,0.06)"}`,
                        color: active ? d.color : C.textMuted,
                        fontWeight: 700, fontSize: 13,
                        transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
                        boxShadow: active ? `0 4px 16px ${d.color}33` : "none",
                        transform: active ? "scale(1.04)" : "scale(1)",
                        ...ui, textAlign: "center",
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 800, marginBottom: 2 }}>{d.label}</div>
                      <div style={{ fontSize: 10, opacity: 0.7 }}>{d.desc}</div>
                      <div style={{ fontSize: 10, color: C.orange, marginTop: 4 }}>-{d.hintCost} XP/hint</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div style={{ background: "rgba(255,26,26,0.08)", border: `1.5px solid ${C.red}44`, padding: "12px 16px", borderRadius: 10, color: C.redLight, fontSize: 12, marginBottom: 16, ...ui, lineHeight: 1.5 }}>
                {error}
              </div>
            )}

            <Btn color={C.red} onClick={handleStartChallenge} full size="lg" disabled={loading}>
              {loading ? "Starting..." : "Start Challenge"}
            </Btn>
          </div>
        </Card>
      </Page>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PLAYING SCREEN
  // ════════════════════════════════════════════════════════════════════════════

  if (gameState === "playing" && currentPhrase) {
    const maxHints = Math.min(3, currentPhrase.hints.length);
    const targetInfo = TARGET_LANGS.find((l) => l.value.toLowerCase() === currentPhrase.target_language.toLowerCase());

    return (
      <Page maxWidth={660}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 style={{ ...ui, fontSize: 22, fontWeight: 900, color: C.text, margin: 0 }}>
              Challenge Active
            </h1>
            <p style={{ ...ui, fontSize: 12, color: C.textMuted, margin: "4px 0 0" }}>
              {currentPhrase.source_language} &rarr; {targetInfo?.flag} {targetInfo?.label ?? currentPhrase.target_language} &middot; {currentDiff.label}
            </p>
          </div>
          <Btn color={C.orange} variant="outline" size="sm" onClick={handleEndChallenge}>
            End Challenge
          </Btn>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, padding: "10px 16px", background: "rgba(255,255,255,0.02)", borderRadius: 10, border: `1px solid ${C.border}` }}>
          <span style={{ ...ui, fontSize: 12, color: C.textMuted }}>
            Phrases done: <strong style={{ color: C.text }}>{attempts.length}</strong>
          </span>
          <span style={{ ...mono, fontSize: 12, color: C.gold, fontWeight: 700 }}>
            XP: {totalXP.toFixed(1)}
          </span>
          {evaluating && (
            <span style={{ ...ui, fontSize: 11, color: C.cyan, display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.cyan, display: "inline-block", animation: "pulse 1s infinite" }} />
              Evaluating...
            </span>
          )}
        </div>

        {/* Phrase card */}
        <Card style={{ padding: 28, marginBottom: 16, borderLeft: `4px solid ${C.red}` }} glowColor={C.red}>
          <div style={{ ...pixel, fontSize: 8, color: C.textMuted, letterSpacing: "0.08em", marginBottom: 12 }}>
            TRANSLATE THIS
          </div>
          <p style={{ ...ui, fontSize: 20, fontWeight: 800, color: C.text, lineHeight: 1.6, margin: "0 0 20px" }}>
            &ldquo;{currentPhrase.phrase}&rdquo;
          </p>

          {hintsRevealed > 0 && (
            <div style={{ background: "rgba(255,140,66,0.06)", border: `1.5px solid ${C.orange}33`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
              <div style={{ ...ui, fontSize: 11, fontWeight: 700, color: C.orange, marginBottom: 8 }}>
                Hints ({hintsRevealed}/{maxHints})
              </div>
              {currentPhrase.hints.slice(0, hintsRevealed).map((hint, i) => (
                <div key={i} style={{ ...ui, fontSize: 13, color: C.text, marginBottom: 4 }}>
                  <span style={{ color: C.orange, fontWeight: 700, fontFamily: "monospace" }}>
                    {getRevealedHint(hint.word, i) || hint.word}
                  </span>
                  <span style={{ color: C.textMuted }}> = {hint.translation}</span>
                </div>
              ))}
            </div>
          )}

          {hintsRevealed < maxHints && (
            <Btn color={C.orange} variant="outline" size="sm" onClick={revealHint}>
              Get Hint (-{currentDiff.hintCost} XP)
            </Btn>
          )}
        </Card>

        {/* Recorder card */}
        <Card style={{ padding: 28, borderTop: `3px solid ${C.cyan}` }} glowColor={C.cyan}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
            <div
              onClick={recordingPhase === "recording" ? stopRecording : undefined}
              style={{
                width: 96, height: 96, borderRadius: "50%",
                cursor: recordingPhase === "recording" ? "pointer" : "default",
                background: recordingPhase === "recording"
                  ? `linear-gradient(135deg, ${C.red}, ${C.redDark})`
                  : "rgba(255,26,26,0.07)",
                border: `4px solid ${recordingPhase === "recording" ? C.red : C.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 38,
                boxShadow: recordingPhase === "recording" ? `0 0 48px ${C.red}55` : "0 4px 18px rgba(0,0,0,0.3)",
                transition: "all 0.3s ease",
                animation: recordingPhase === "recording" ? "pulse 1s ease-in-out infinite" : "none",
              }}
            >
              🎙
            </div>

            <div style={{ ...mono, fontSize: 30, color: recordingPhase === "recording" ? C.red : C.textMuted, letterSpacing: 4 }}>
              {String(Math.floor(recordingSecs / 60)).padStart(2, "0")}:{String(recordingSecs % 60).padStart(2, "0")}
            </div>

            {recordingPhase === "idle" && (
              <div style={{ width: "100%" }}>
                <Btn color={C.red} size="md" full onClick={startRecording}>Start Recording</Btn>
              </div>
            )}
            {recordingPhase === "recording" && (
              <div style={{ width: "100%" }}>
                <Btn color={C.red} size="md" full onClick={stopRecording}>Stop Recording</Btn>
              </div>
            )}
            {recordingPhase === "done" && (
              <div style={{ display: "flex", gap: 10, width: "100%" }}>
                <Btn color={C.textMuted} variant="outline" size="md" onClick={reRecord}>Re-record</Btn>
                <Btn color={C.green} size="md" onClick={handleNext} disabled={loading}>
                  {loading ? "Loading..." : "Next Phrase"}
                </Btn>
              </div>
            )}
          </div>
        </Card>

        {error && (
          <div style={{ ...ui, fontSize: 12, color: C.redLight, marginTop: 14, padding: "10px 16px", background: "rgba(255,26,26,0.06)", borderRadius: 8, lineHeight: 1.5 }}>
            {error}
          </div>
        )}
      </Page>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // WAITING SCREEN
  // ════════════════════════════════════════════════════════════════════════════

  if (gameState === "waiting") {
    return (
      <Page maxWidth={480}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 24 }}>
          <div style={{ width: 52, height: 52, border: `4px solid rgba(255,26,26,0.1)`, borderTop: `4px solid ${C.red}`, borderRadius: "50%", animation: "spin 1s linear infinite", boxShadow: `0 0 16px ${C.red}33` }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ ...ui, fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 8 }}>Finalizing...</div>
            <div style={{ ...ui, fontSize: 13, color: C.textMuted, lineHeight: 1.6 }}>
              Evaluating your last recording and saving results.<br />This only takes a few seconds.
            </div>
          </div>
        </div>
      </Page>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // RESULTS SCREEN
  // ════════════════════════════════════════════════════════════════════════════

  if (gameState === "results") {
    const lastFeedback = evaluated.length > 0
      ? evaluated[evaluated.length - 1].evaluation?.feedback
      : null;
    const scores = [
      { label: "Fluency",       val: avg("fluency"),       color: C.gold  },
      { label: "Pronunciation", val: avg("pronunciation"), color: C.cyan  },
      { label: "Completeness",  val: avg("completeness"),  color: C.green },
      { label: "Accuracy",      val: avg("accuracy"),      color: C.red   },
    ];

    return (
      <Page maxWidth={700}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ ...ui, fontSize: 28, fontWeight: 900, color: C.text, margin: 0 }}>
            Challenge Complete!
          </h1>
          <p style={{ ...ui, fontSize: 13, color: C.textMuted, margin: "6px 0 0" }}>
            You completed {attempts.length} phrase{attempts.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          <Card style={{ padding: 28, textAlign: "center", borderTop: `3px solid ${C.gold}` }} glowColor={C.gold}>
            <div style={{ ...pixel, fontSize: 8, color: C.textMuted, letterSpacing: "0.08em", marginBottom: 12 }}>TOTAL XP EARNED</div>
            <div style={{ fontSize: 56, fontWeight: 900, color: C.gold, lineHeight: 1, ...ui }}>{totalXP.toFixed(1)}</div>
            <div style={{ ...ui, fontSize: 11, color: C.textMuted, marginTop: 8 }}>{evaluated.length} evaluated</div>
          </Card>
          <Card style={{ padding: 28, textAlign: "center", borderTop: `3px solid ${C.cyan}` }} glowColor={C.cyan}>
            <div style={{ ...pixel, fontSize: 8, color: C.textMuted, letterSpacing: "0.08em", marginBottom: 12 }}>AVERAGE SCORE</div>
            <div style={{ fontSize: 56, fontWeight: 900, color: C.cyan, lineHeight: 1, ...ui }}>{avgScore.toFixed(0)}</div>
            <div style={{ ...ui, fontSize: 11, color: C.textMuted, marginTop: 8 }}>out of 100</div>
          </Card>
        </div>

        <Card style={{ padding: 22, marginBottom: 20 }} glowColor={C.red}>
          <div style={{ ...ui, fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 14 }}>Score Breakdown</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {scores.map((s) => (
              <div key={s.label}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ ...ui, fontSize: 12, color: C.text }}>{s.label}</span>
                  <span style={{ ...mono, fontSize: 12, color: s.color, fontWeight: 800 }}>{s.val.toFixed(0)}</span>
                </div>
                <ProgressBar pct={s.val} color={s.color} />
              </div>
            ))}
          </div>
        </Card>

        {lastFeedback && (
          <Card style={{ padding: 20, marginBottom: 20, background: "rgba(79,195,247,0.04)", border: `1.5px solid ${C.cyan}22` }}>
            <div style={{ ...ui, fontSize: 12, fontWeight: 700, color: C.cyan, marginBottom: 8 }}>AI Feedback</div>
            <div style={{ ...ui, fontSize: 13, color: C.text, lineHeight: 1.6 }}>{lastFeedback}</div>
          </Card>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <Btn color={C.textMuted} variant="outline" size="md" onClick={() => navigate("/home")}>Home</Btn>
          <Btn color={C.green} size="md" onClick={handleSaveResults}>Done</Btn>
          <Btn color={C.red} size="md" onClick={() => { setGameState("setup"); setAttempts([]); setCurrentPhrase(null); }}>
            New Challenge
          </Btn>
        </div>
      </Page>
    );
  }

  return null;
}
