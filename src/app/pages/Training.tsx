import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { isSameQuestDay } from "../../lib/dailyQuest";
import { C, ui, mono, pixel } from "../constants/theme";
import { Card, Btn, Page, ProgressBar } from "../components/shared";
import confetti from "canvas-confetti";

type BlitzWord = { word: string; translation: string; explanation: string };
type Phase = "setup" | "flashcards" | "quiz" | "victory" | "quiz_fail";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildMcqOptions(words: BlitzWord[], idx: number): string[] {
  const correct = words[idx].translation;
  const distractors = words
    .filter((_, i) => i !== idx)
    .map((w) => w.translation)
    .filter((t) => t !== correct);
  const wrong = shuffle(distractors).slice(0, 3);
  while (wrong.length < 3 && distractors.length > 0) {
    const extra = distractors.find((d) => !wrong.includes(d));
    if (!extra) break;
    wrong.push(extra);
  }
  return shuffle([correct, ...wrong.slice(0, 3)]);
}

const PASS_THRESHOLD = 16;

export function TrainingScreen({ onXP }: { onXP?: (xp: number) => void }) {
  const [phase, setPhase] = useState<Phase>("setup");
  const [blitzFrom, setBlitzFrom] = useState("Tagalog");
  const [blitzTo, setBlitzTo] = useState("Bisaya");
  const [blitzLoading, setBlitzLoading] = useState(false);
  const [blitzError, setBlitzError] = useState("");
  const [blitzWords, setBlitzWords] = useState<BlitzWord[]>([]);
  const [blitzIdx, setBlitzIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [savingQuest, setSavingQuest] = useState(false);

  // MCQ state
  const [quizOrder, setQuizOrder] = useState<number[]>([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizOptions, setQuizOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const selStyle: React.CSSProperties = {
    ...ui, width: "100%", background: "rgba(255,26,26,0.03)",
    border: `2px solid ${C.border}`, borderRadius: 12,
    padding: "12px 36px 12px 14px", color: C.text, fontSize: 14,
    outline: "none", cursor: "pointer", appearance: "none",
  };

  const resetSession = () => {
    setPhase("setup");
    setBlitzWords([]);
    setBlitzIdx(0);
    setFlipped(false);
    setQuizIdx(0);
    setQuizOrder([]);
    setQuizOptions([]);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setCorrectCount(0);
  };

  const startBlitz = async () => {
    setBlitzError("");
    setBlitzLoading(true);
    setBlitzIdx(0);
    setFlipped(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setBlitzError("Not logged in. Please log in first.");
        setBlitzLoading(false);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/vocab-blitz`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          source_language: blitzFrom.toLowerCase(),
          target_language: blitzTo.toLowerCase(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const resData = await response.json();
      if (resData.success && Array.isArray(resData.words) && resData.words.length > 0) {
        setBlitzWords(resData.words);
        setPhase("flashcards");
      } else {
        throw new Error("Invalid response format or empty word list.");
      }
    } catch (err: any) {
      console.error("Error generating Vocab Blitz:", err);
      setBlitzError(err.message || "Failed to load vocabulary words.");
    } finally {
      setBlitzLoading(false);
    }
  };

  const startQuiz = () => {
    const order = shuffle(blitzWords.map((_, i) => i));
    setQuizOrder(order);
    setQuizIdx(0);
    setQuizOptions(buildMcqOptions(blitzWords, order[0]));
    setSelectedAnswer(null);
    setShowFeedback(false);
    setCorrectCount(0);
    setPhase("quiz");
  };

  const retryQuiz = () => {
    startQuiz();
    setPhase("quiz");
  };

  const handleSelectAnswer = (option: string) => {
    if (showFeedback) return;
    setSelectedAnswer(option);
    setShowFeedback(true);
    const wordIdx = quizOrder[quizIdx];
    if (option === blitzWords[wordIdx].translation) {
      setCorrectCount((c) => c + 1);
    }
  };

  const handleQuizContinue = () => {
    const nextIdx = quizIdx + 1;
    if (nextIdx >= quizOrder.length) {
      if (correctCount >= PASS_THRESHOLD) {
        handleFinishBlitz();
      } else {
        setPhase("quiz_fail");
      }
      return;
    }
    setQuizIdx(nextIdx);
    setQuizOptions(buildMcqOptions(blitzWords, quizOrder[nextIdx]));
    setSelectedAnswer(null);
    setShowFeedback(false);
  };

  const handleFinishBlitz = async () => {
    setSavingQuest(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("User session not found.");
        setSavingQuest(false);
        return;
      }

      const { data: latestQuest, error: fetchErr } = await supabase
        .from("daily_quest")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchErr) throw fetchErr;

      if (latestQuest && isSameQuestDay(latestQuest.created_at)) {
        const { error: updateErr } = await supabase
          .from("daily_quest")
          .update({ vocab_blitz: true })
          .eq("id", latestQuest.id);
        if (updateErr) throw updateErr;
      } else {
        const { error: insertErr } = await supabase
          .from("daily_quest")
          .insert({
            user_id: user.id,
            vocab_blitz: true,
          });
        if (insertErr) throw insertErr;
      }

      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      if (onXP) onXP(100);
      setPhase("victory");
    } catch (err) {
      console.error("Error updating daily quest:", err);
      alert("Failed to save progress in daily quests.");
    } finally {
      setSavingQuest(false);
    }
  };

  const currentQuizWordIdx = quizOrder[quizIdx];
  const currentWord = currentQuizWordIdx !== undefined ? blitzWords[currentQuizWordIdx] : null;
  const isAnswerCorrect = showFeedback && selectedAnswer === currentWord?.translation;

  return (
    <Page maxWidth={660}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ ...ui, fontSize: 28, fontWeight: 900, color: C.text, margin: 0 }}>📖 Training</h1>
        <p style={{ ...ui, fontSize: 13, color: C.textMuted, margin: "6px 0 0" }}>
          Practice modes to sharpen your skills. More modes coming soon!
        </p>
      </div>

      <div style={{ ...pixel, fontSize: 8, color: C.green, letterSpacing: "0.08em", marginBottom: 12 }}>⚡ VOCAB BLITZ</div>

      {phase === "setup" && (
        <Card style={{ padding: 26, borderTop: `3px solid ${C.green}` }} glowColor={C.green}>
          {blitzLoading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 0", gap: 20 }}>
              <div style={{
                width: 40, height: 40,
                border: `3px solid rgba(76,175,125,0.1)`,
                borderTop: `3px solid ${C.green}`,
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                boxShadow: `0 0 10px ${C.green}33`,
              }} />
              <span style={{ ...pixel, fontSize: 8, color: C.textMuted, letterSpacing: 1, animation: "pulse 1.5s infinite" }}>GENERATING 20 WORDS WITH AI...</span>
            </div>
          ) : (
            <div>
              <p style={{ ...ui, fontSize: 13, color: C.textMuted, margin: "0 0 20px", lineHeight: 1.5 }}>
                Learn 20 words with flashcards, then pass an 80% quiz to complete your daily quest.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                <div>
                  <div style={{ ...ui, fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Source Language</div>
                  <div style={{ position: "relative" }}>
                    <select value={blitzFrom} onChange={(e) => setBlitzFrom(e.target.value)} style={selStyle}>
                      {["Tagalog", "English", "Bisaya"].map((l) => <option key={l}>{l}</option>)}
                    </select>
                    <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: C.textMuted, pointerEvents: "none", fontSize: 11 }}>▾</span>
                  </div>
                </div>
                <div>
                  <div style={{ ...ui, fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Target Language</div>
                  <div style={{ position: "relative" }}>
                    <select value={blitzTo} onChange={(e) => setBlitzTo(e.target.value)} style={selStyle}>
                      {["Bisaya", "Cebuano", "Tagalog", "Ilocano", "Hiligaynon", "Waray", "Kapampangan"].map((l) => <option key={l}>{l}</option>)}
                    </select>
                    <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: C.textMuted, pointerEvents: "none", fontSize: 11 }}>▾</span>
                  </div>
                </div>
              </div>

              {blitzError && (
                <div style={{ background: "rgba(255,26,26,0.06)", border: `1.5px solid ${C.red}33`, padding: "10px 14px", borderRadius: 8, color: C.redLight, fontSize: 12, marginBottom: 16, ...ui }}>
                  ⚠️ {blitzError}
                </div>
              )}

              <Btn color={C.green} onClick={startBlitz} full size="lg">⚡ Start Vocab Blitz</Btn>
            </div>
          )}
        </Card>
      )}

      {phase === "flashcards" && (
        <Card style={{ padding: 24, borderTop: `3px solid ${C.green}` }} glowColor={C.green}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <span style={{ ...pixel, fontSize: 8, color: C.textMuted }}>CARD {blitzIdx + 1} OF {blitzWords.length}</span>
            <span style={{ ...mono, fontSize: 11, color: C.green }}>{Math.round((blitzIdx / blitzWords.length) * 100)}%</span>
          </div>
          <div style={{ marginBottom: 24 }}>
            <ProgressBar pct={(blitzIdx / blitzWords.length) * 100} color={C.green} height={6} />
          </div>

          <div
            onClick={() => setFlipped(!flipped)}
            style={{
              background: flipped ? "rgba(76,175,125,0.03)" : "rgba(255,255,255,0.01)",
              border: `2px dashed ${flipped ? C.green + "44" : C.border}`,
              borderRadius: 16, padding: "48px 24px", textAlign: "center", marginBottom: 24,
              cursor: "pointer", minHeight: 200,
              display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
              transition: "all 0.2s",
            }}
          >
            {!flipped ? (
              <div>
                <div style={{ ...pixel, fontSize: 8, color: C.textMuted, marginBottom: 14, letterSpacing: "0.1em" }}>WORD</div>
                <div style={{ ...ui, fontSize: 32, fontWeight: 900, color: C.text }}>{blitzWords[blitzIdx].word}</div>
                <div style={{ ...ui, fontSize: 11, color: C.green, marginTop: 24, fontWeight: 700 }}>Click card to reveal translation 👁️</div>
              </div>
            ) : (
              <div>
                <div style={{ ...pixel, fontSize: 8, color: C.green, marginBottom: 14, letterSpacing: "0.1em" }}>TRANSLATION</div>
                <div style={{ ...ui, fontSize: 32, fontWeight: 900, color: C.green }}>{blitzWords[blitzIdx].translation}</div>
                <div style={{ width: 40, height: 2, background: C.green + "33", margin: "16px auto" }} />
                <p style={{ ...ui, fontSize: 13, color: C.textMuted, margin: 0, maxWidth: 300, lineHeight: 1.5 }}>{blitzWords[blitzIdx].explanation}</p>
                <div style={{ ...ui, fontSize: 10, color: C.textMuted, marginTop: 20 }}>Click card to hide translation 👁️‍🗨️</div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "space-between", alignItems: "center" }}>
            <button
              disabled={blitzIdx === 0}
              onClick={() => { setBlitzIdx((i) => i - 1); setFlipped(false); }}
              style={{ ...ui, fontSize: 12, fontWeight: 700, color: blitzIdx === 0 ? C.textMuted + "44" : C.textMuted, background: "transparent", border: `1.5px solid ${blitzIdx === 0 ? "rgba(255,255,255,0.03)" : C.border}`, borderRadius: 10, padding: "10px 18px", cursor: blitzIdx === 0 ? "not-allowed" : "pointer", transition: "all 0.15s" }}
            >⬅️ Prev</button>

            {blitzIdx < blitzWords.length - 1 ? (
              <Btn color={C.green} size="md" onClick={() => { setBlitzIdx((i) => i + 1); setFlipped(false); }}>Next Word ➡️</Btn>
            ) : (
              <Btn color={C.gold} size="md" onClick={startQuiz}>Start Quiz 📝</Btn>
            )}
          </div>
        </Card>
      )}

      {phase === "quiz" && currentWord && (
        <Card style={{ padding: 24, borderTop: `3px solid ${C.gold}` }} glowColor={C.gold}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <span style={{ ...pixel, fontSize: 8, color: C.textMuted }}>QUESTION {quizIdx + 1} OF {quizOrder.length}</span>
            <span style={{ ...mono, fontSize: 11, color: C.gold }}>{correctCount} correct · need {PASS_THRESHOLD}</span>
          </div>
          <div style={{ marginBottom: 24 }}>
            <ProgressBar pct={((quizIdx + (showFeedback ? 1 : 0)) / quizOrder.length) * 100} color={C.gold} height={6} />
          </div>

          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ ...pixel, fontSize: 8, color: C.textMuted, marginBottom: 12, letterSpacing: "0.1em" }}>WHAT IS THE TRANSLATION OF</div>
            <div style={{ ...ui, fontSize: 28, fontWeight: 900, color: C.text }}>{currentWord.word}</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            {quizOptions.map((option) => {
              let bg = "rgba(255,255,255,0.02)";
              let border = C.border;
              let color = C.text;
              if (showFeedback) {
                if (option === currentWord.translation) {
                  bg = "rgba(76,175,125,0.12)";
                  border = C.green + "66";
                  color = C.green;
                } else if (option === selectedAnswer) {
                  bg = "rgba(255,26,26,0.08)";
                  border = C.red + "66";
                  color = C.redLight;
                }
              } else if (option === selectedAnswer) {
                bg = "rgba(255,215,0,0.08)";
                border = C.gold + "66";
              }
              return (
                <button
                  key={option}
                  disabled={showFeedback}
                  onClick={() => handleSelectAnswer(option)}
                  style={{
                    ...ui, textAlign: "left", padding: "14px 18px", borderRadius: 12,
                    background: bg, border: `2px solid ${border}`, color,
                    fontSize: 14, fontWeight: 600, cursor: showFeedback ? "default" : "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {showFeedback && (
            <div style={{
              padding: "12px 16px", borderRadius: 10, marginBottom: 16,
              background: isAnswerCorrect ? "rgba(76,175,125,0.08)" : "rgba(255,26,26,0.06)",
              border: `1.5px solid ${isAnswerCorrect ? C.green + "44" : C.red + "33"}`,
              ...ui, fontSize: 13, color: isAnswerCorrect ? C.green : C.redLight,
            }}>
              {isAnswerCorrect
                ? "✓ Correct!"
                : `✗ Wrong — the correct answer is "${currentWord.translation}"`}
            </div>
          )}

          {showFeedback && (
            <Btn
              color={C.gold}
              full
              size="md"
              disabled={savingQuest}
              onClick={handleQuizContinue}
            >
              {quizIdx >= quizOrder.length - 1
                ? (savingQuest ? "Saving..." : "See Results")
                : "Continue →"}
            </Btn>
          )}
        </Card>
      )}

      {phase === "quiz_fail" && (
        <Card style={{ padding: 36, textAlign: "center", borderTop: `4px solid ${C.red}` }} glowColor={C.red}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
          <h2 style={{ ...pixel, fontSize: 12, color: C.redLight, letterSpacing: 2, marginBottom: 12 }}>QUIZ NOT PASSED</h2>
          <p style={{ ...ui, fontSize: 14, color: C.text, margin: "0 auto 24px", maxWidth: 380, lineHeight: 1.5 }}>
            You scored <b>{correctCount}/{quizOrder.length}</b>. You need at least <b>{PASS_THRESHOLD}</b> correct (80%) to complete the daily quest.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Btn color={C.gold} onClick={retryQuiz} size="md">Retry Quiz 🔄</Btn>
            <Btn color={C.green} onClick={() => { setPhase("flashcards"); setBlitzIdx(0); setFlipped(false); }} size="md">Review Flashcards</Btn>
          </div>
        </Card>
      )}

      {phase === "victory" && (
        <Card style={{ padding: 36, textAlign: "center", borderTop: `4px solid ${C.gold}` }} glowColor={C.gold}>
          <div style={{ fontSize: 54, marginBottom: 16, animation: "bounce 2s infinite" }}>🏆</div>
          <h2 style={{ ...pixel, fontSize: 14, color: C.gold, letterSpacing: 2, marginBottom: 12 }}>VOCAB BLITZ COMPLETE!</h2>
          <p style={{ ...ui, fontSize: 14, color: C.text, margin: "0 auto 24px", maxWidth: 380, lineHeight: 1.5 }}>
            You passed the quiz with <b>{correctCount}/{quizOrder.length}</b> in <b>{blitzFrom} → {blitzTo}</b>. Your daily quest is updated!
          </p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(255,215,0,0.08)", border: `1.5px solid ${C.gold}33`, padding: "12px 24px", borderRadius: 14, marginBottom: 28 }}>
            <span style={{ fontSize: 20 }}>💎</span>
            <span style={{ ...mono, fontSize: 18, fontWeight: 800, color: C.gold }}>+100 XP REWARD CLAIMED</span>
          </div>
          <div>
            <Btn color={C.green} onClick={resetSession} size="md">Train Again</Btn>
          </div>
        </Card>
      )}
    </Page>
  );
}
