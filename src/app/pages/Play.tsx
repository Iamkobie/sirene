import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../lib/supabase";
import { C, ui, mono, pixel, SOURCE_PHRASES } from "../constants/theme";
import type { Screen } from "../constants/theme";
import { Card, Btn, Page, ProgressBar } from "../components/shared";
import confetti from "canvas-confetti";

export function PlayScreen({ setChallengePhrase, onXP }: { setChallengePhrase: (p: any) => void; onXP?: (xp: number) => void }) {
  const navigate = useNavigate();
  const onNav = (s: Screen) => navigate(`/${s}`);
  
  // Tabs: challenge or blitz
  const [mode, setMode] = useState<"challenge" | "blitz">("challenge");

  // State for Battle Challenge
  const [from, setFrom] = useState("English");
  const [to, setTo] = useState("Bisaya");
  const [diff, setDiff] = useState("Normal");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [loading, setLoading] = useState(false);

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

  const handleStartChallenge = async () => {
    setLoading(true);
    try {
      let phraseId = null;
      const { data, error } = await supabase
        .from("phrases")
        .select("*")
        .eq("source_text", activePhraseText)
        .eq("target_language", to)
        .maybeSingle();

      if (!error && data) {
        phraseId = data.id;
        setChallengePhrase({
          id: phraseId,
          text: activePhraseText,
          source_language: from,
          target_language: to,
          difficulty: diff,
          target_text_suggestion: data.target_text_suggestion,
          transliteration: data.transliteration
        });
      } else {
        const maxPoints = diff === "Easy" ? 25 : diff === "Normal" ? 50 : diff === "Hard" ? 75 : 100;
        const { data: newPhrase, error: insError } = await supabase
          .from("phrases")
          .insert({
            source_language: from,
            target_language: to,
            source_text: activePhraseText,
            difficulty: diff,
            points: maxPoints
          })
          .select("*")
          .single();

        if (!insError && newPhrase) {
          phraseId = newPhrase.id;
          setChallengePhrase({
            id: phraseId,
            text: activePhraseText,
            source_language: from,
            target_language: to,
            difficulty: diff,
            target_text_suggestion: newPhrase.target_text_suggestion,
            transliteration: newPhrase.transliteration
          });
        }
      }
      navigate("/mission");
    } catch (err) {
      console.error("Error setting up phrase:", err);
      setChallengePhrase({
        id: null,
        text: activePhraseText,
        source_language: from,
        target_language: to,
        difficulty: diff,
      });
      navigate("/mission");
    } finally {
      setLoading(false);
    }
  };

  // State for Vocab Blitz
  const [blitzFrom, setBlitzFrom] = useState("Tagalog");
  const [blitzTo, setBlitzTo] = useState("Bisaya");
  const [blitzLoading, setBlitzLoading] = useState(false);
  const [blitzError, setBlitzError] = useState("");
  
  // Word list and gameplay
  const [blitzWords, setBlitzWords] = useState<{ word: string; translation: string; explanation: string }[]>([]);
  const [blitzIdx, setBlitzIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [savingQuest, setSavingQuest] = useState(false);

  const startBlitz = async () => {
    setBlitzError("");
    setBlitzLoading(true);
    setCompleted(false);
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

  const handleFinishBlitz = async () => {
    setSavingQuest(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("User session not found.");
        setSavingQuest(false);
        return;
      }

      // 1. Fetch latest daily quest entry
      const { data: latestQuest, error: fetchErr } = await supabase
        .from("daily_quest")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const isToday = (dateStr: string) => {
        const d = new Date(dateStr);
        const today = new Date();
        return d.getDate() === today.getDate() &&
               d.getMonth() === today.getMonth() &&
               d.getFullYear() === today.getFullYear();
      };

      if (latestQuest && isToday(latestQuest.created_at)) {
        // Update today's existing row
        const { error: updateErr } = await supabase
          .from("daily_quest")
          .update({ vocab_blitz: true })
          .eq("id", latestQuest.id);
        if (updateErr) throw updateErr;
      } else {
        // Create a new row for today
        const { error: insertErr } = await supabase
          .from("daily_quest")
          .insert({
            user_id: user.id,
            vocab_blitz: true,
          });
        if (insertErr) throw insertErr;
      }

      // Confetti!
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });

      // Award XP locally
      if (onXP) {
        onXP(100);
      }

      setCompleted(true);
    } catch (err) {
      console.error("Error updating daily quest:", err);
      alert("Failed to save progress in daily quests.");
    } finally {
      setSavingQuest(false);
    }
  };

  return (
    <Page maxWidth={660}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ ...ui, fontSize: 28, fontWeight: 900, color: C.text, margin: 0 }}>
          {mode === "challenge" ? "New Challenge" : "⚡ Vocab Blitz"}
        </h1>
        <p style={{ ...ui, fontSize: 13, color: C.textMuted, margin: "6px 0 0" }}>
          {mode === "challenge" 
            ? "Choose your language, pick a phrase, then battle! ⚔️" 
            : "Generate 20 words from AI, learn them, and complete daily quests! 📖"}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", background: "rgba(255,26,26,0.05)", border: `2px solid ${C.border}`, borderRadius: 14, padding: 4, marginBottom: 20 }}>
        <button onClick={() => { setMode("challenge"); setBlitzWords([]); setCompleted(false); }}
          style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", cursor: "pointer", background: mode === "challenge" ? C.red : "transparent", color: mode === "challenge" ? "#fff" : C.textMuted, fontWeight: 800, fontSize: 13, transition: "all 0.25s", ...ui }}
        >⚔️ Battle Challenge</button>
        <button onClick={() => { setMode("blitz"); setBlitzWords([]); setCompleted(false); }}
          style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", cursor: "pointer", background: mode === "blitz" ? C.red : "transparent", color: mode === "blitz" ? "#fff" : C.textMuted, fontWeight: 800, fontSize: 13, transition: "all 0.25s", ...ui }}
        >⚡ Vocab Blitz</button>
      </div>

      {mode === "challenge" ? (
        <>
          <Card style={{ padding: 0, overflow: "hidden", marginBottom: 16, borderTop: `3px solid ${C.red}` }} glowColor={C.red}>
            <div style={{ padding: "24px 24px 20px", borderBottom: `1.5px solid ${C.border}`, background: "rgba(255,26,26,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.red, boxShadow: `0 0 8px ${C.red}88`, animation: "pulse 1.5s ease-in-out infinite" }} />
                  <span style={{ ...pixel, fontSize: 8, color: C.textMuted, letterSpacing: "0.08em" }}>PHRASE TO TRANSLATE</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ ...mono, fontSize: 11, color: C.textMuted }}>{phraseIdx + 1}/{phrases.length}</span>
                  <button onClick={() => setPhraseIdx((i) => (i + 1) % phrases.length)}
                    style={{ background: "rgba(255,26,26,0.08)", border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "5px 12px", color: C.red, cursor: "pointer", fontSize: 11, fontWeight: 700, ...ui, transition: "all 0.15s" }}>Next ↻</button>
                </div>
              </div>
              <p style={{ ...ui, fontSize: 22, fontWeight: 900, color: C.text, margin: 0, lineHeight: 1.4 }}>"{activePhraseText}"</p>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14 }}>
                <span style={{ ...ui, fontSize: 12, color: C.textMuted }}>Speak this in</span>
                <span style={{ ...ui, fontSize: 12, fontWeight: 800, color: C.red, background: `rgba(255,26,26,0.12)`, border: `1.5px solid ${C.red}44`, borderRadius: 6, padding: "3px 10px" }}>{to}</span>
              </div>
            </div>

            <div style={{ padding: "22px 24px 26px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
                <div>
                  <div style={{ ...ui, fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Source Language</div>
                  <div style={{ position: "relative" }}>
                    <select value={from} onChange={(e) => { setFrom(e.target.value); setPhraseIdx(0); }} style={selStyle}>{sources.map((l) => <option key={l}>{l}</option>)}</select>
                    <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: C.textMuted, pointerEvents: "none", fontSize: 11 }}>▾</span>
                  </div>
                </div>
                <div>
                  <div style={{ ...ui, fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Target Dialect</div>
                  <div style={{ position: "relative" }}>
                    <select value={to} onChange={(e) => setTo(e.target.value)} style={selStyle}>{targets.map((l) => <option key={l}>{l}</option>)}</select>
                    <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: C.textMuted, pointerEvents: "none", fontSize: 11 }}>▾</span>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 22 }}>
                <div style={{ ...ui, fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Difficulty</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {diffs.map((d) => (
                    <button key={d.label} onClick={() => setDiff(d.label)}
                      style={{ flex: 1, padding: "10px 0", borderRadius: 10, cursor: "pointer", background: diff === d.label ? d.color : "rgba(255,255,255,0.03)", border: `2px solid ${diff === d.label ? d.color : "transparent"}`, color: diff === d.label ? "#fff" : C.textMuted, fontWeight: 800, fontSize: 12, transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)", boxShadow: diff === d.label ? `0 4px 14px ${d.color}44` : "none", transform: diff === d.label ? "scale(1.03)" : "scale(1)", ...ui }}
                    >{d.icon} {d.label}</button>
                  ))}
                </div>
              </div>
              <Btn color={C.red} onClick={handleStartChallenge} full size="lg" disabled={loading}>
                {loading ? "⚔️ Starting..." : "⚔️  Start Challenge"}
              </Btn>
            </div>
          </Card>

          <div style={{ ...pixel, fontSize: 8, color: C.textMuted, letterSpacing: "0.08em", marginBottom: 10 }}>ALL PHRASES</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {phrases.map((p, i) => (
              <button key={i} onClick={() => setPhraseIdx(i)}
                style={{ ...ui, textAlign: "left", padding: "11px 14px", borderRadius: 10, border: `1.5px solid ${i === phraseIdx ? C.red + "55" : C.border}`, background: i === phraseIdx ? "rgba(255,26,26,0.06)" : "rgba(255,255,255,0.01)", cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 12, transform: i === phraseIdx ? "scale(1.01)" : "scale(1)" }}
              >
                <span style={{ ...mono, fontSize: 10, color: i === phraseIdx ? C.red : C.textMuted, width: 16, flexShrink: 0 }}>{i + 1}</span>
                <span style={{ ...ui, fontSize: 13, color: i === phraseIdx ? C.text : C.textMuted, fontWeight: i === phraseIdx ? 700 : 400 }}>{p}</span>
                {i === phraseIdx && <span style={{ marginLeft: "auto", fontSize: 11, color: C.red, fontWeight: 700 }}>●</span>}
              </button>
            ))}
          </div>
        </>
      ) : (
        /* Vocab Blitz Mode */
        <div>
          {blitzWords.length === 0 ? (
            /* Setup State */
            <Card style={{ padding: 26, borderTop: `3px solid ${C.green}` }} glowColor={C.green}>
              {blitzLoading ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 0", gap: 20 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    border: `3px solid rgba(76,175,125,0.1)`,
                    borderTop: `3px solid ${C.green}`,
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                    boxShadow: `0 0 10px ${C.green}33`
                  }} />
                  <span style={{ ...pixel, fontSize: 8, color: C.textMuted, letterSpacing: 1, animation: "pulse 1.5s infinite" }}>GENERATING 20 WORDS WITH AI...</span>
                </div>
              ) : (
                <div>
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
          ) : completed ? (
            /* Victory screen */
            <Card style={{ padding: 36, textAlign: "center", borderTop: `4px solid ${C.gold}` }} glowColor={C.gold}>
              <div style={{ fontSize: 54, marginBottom: 16, animation: "bounce 2s infinite" }}>🏆</div>
              <h2 style={{ ...pixel, fontSize: 14, color: C.gold, letterSpacing: 2, marginBottom: 12 }}>VOCAB BLITZ COMPLETE!</h2>
              <p style={{ ...ui, fontSize: 14, color: C.text, margin: "0 auto 24px", maxWidth: 380, lineHeight: 1.5 }}>
                Fantastic! You successfully learned 20 new words today in <b>{blitzFrom} → {blitzTo}</b>. Your daily quest is updated!
              </p>
              
              <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(255,215,0,0.08)", border: `1.5px solid ${C.gold}33`, padding: "12px 24px", borderRadius: 14, marginBottom: 28 }}>
                <span style={{ fontSize: 20 }}>💎</span>
                <span style={{ ...mono, fontSize: 18, fontWeight: 800, color: C.gold }}>+100 XP REWARD CLAIMED</span>
              </div>

              <div>
                <Btn color={C.red} onClick={() => { setBlitzWords([]); setCompleted(false); setMode("challenge"); }} size="md">Back to Challenges</Btn>
              </div>
            </Card>
          ) : (
            /* Flashcard screen */
            <Card style={{ padding: 24, borderTop: `3px solid ${C.green}` }} glowColor={C.green}>
              {/* Progress */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{ ...pixel, fontSize: 8, color: C.textMuted }}>CARD {blitzIdx + 1} OF {blitzWords.length}</span>
                <span style={{ ...mono, fontSize: 11, color: C.green }}>{Math.round(((blitzIdx) / blitzWords.length) * 100)}%</span>
              </div>
              <div style={{ marginBottom: 24 }}>
                <ProgressBar pct={(blitzIdx / blitzWords.length) * 100} color={C.green} height={6} />
              </div>

              {/* Word Box */}
              <div 
                onClick={() => setFlipped(!flipped)}
                style={{ 
                  background: flipped ? "rgba(76,175,125,0.03)" : "rgba(255,255,255,0.01)", 
                  border: `2px dashed ${flipped ? C.green + "44" : C.border}`, 
                  borderRadius: 16, 
                  padding: "48px 24px", 
                  textAlign: "center", 
                  marginBottom: 24, 
                  cursor: "pointer",
                  minHeight: 200,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  transition: "all 0.2s"
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

              {/* Navigation buttons */}
              <div style={{ display: "flex", gap: 12, justifyContent: "space-between", alignItems: "center" }}>
                <button 
                  disabled={blitzIdx === 0}
                  onClick={() => { setBlitzIdx((i) => i - 1); setFlipped(false); }}
                  style={{ ...ui, fontSize: 12, fontWeight: 700, color: blitzIdx === 0 ? C.textMuted + "44" : C.textMuted, background: "transparent", border: `1.5px solid ${blitzIdx === 0 ? "rgba(255,255,255,0.03)" : C.border}`, borderRadius: 10, padding: "10px 18px", cursor: blitzIdx === 0 ? "not-allowed" : "pointer", transition: "all 0.15s" }}
                >⬅️ Prev</button>

                {blitzIdx < blitzWords.length - 1 ? (
                  <Btn color={C.green} size="md" onClick={() => { setBlitzIdx((i) => i + 1); setFlipped(false); }}>Next Word ➡️</Btn>
                ) : (
                  <Btn color={C.gold} size="md" disabled={savingQuest} onClick={handleFinishBlitz}>
                    {savingQuest ? "Saving..." : "Finish Blitz 🏆"}
                  </Btn>
                )}
              </div>
            </Card>
          )}
        </div>
      )}
    </Page>
  );
}
