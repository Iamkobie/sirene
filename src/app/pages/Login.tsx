import { useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../lib/supabase";
import { C, ui, pixel, mono, LANGUAGES } from "../constants/theme";
import { SirenaLogo, Card, Btn, Input, PasswordInput, Select } from "../components/shared";

const AGE_OPTIONS = Array.from({ length: 83 }, (_, i) => String(i + 8));

export function LoginScreen({ cities }: { cities: string[] }) {
  const navigate = useNavigate();
  const [mode, setMode]                 = useState<"login" | "signup">("login");
  const [email, setEmail]               = useState("");
  const [pw, setPw]                     = useState("");
  const [confirmPw, setConfirmPw]       = useState("");
  const [username, setUsername]         = useState("");
  const [age, setAge]                   = useState("");
  const [sex, setSex]                   = useState("");
  const [motherTongue, setMotherTongue] = useState("");
  const [city, setCity]                 = useState("");
  const [error, setError]               = useState("");
  const [loading, setLoading]           = useState(false);

  const handleLogin = async () => {
    setError(""); setLoading(true);
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password: pw });
    setLoading(false);
    if (err) { setError(err.message); return; }
    navigate("/home");
  };

  const handleSignup = async () => {
    if (!username || !age || !sex || !motherTongue || !city) { setError("Please fill in all fields."); return; }
    if (pw !== confirmPw) { setError("Passwords do not match."); return; }
    setError(""); setLoading(true);
    
    try {
      // Step 1: Sign up with user metadata
      const { data, error: signupError } = await supabase.auth.signUp({
        email, password: pw,
        options: { data: { username, age: Number(age), sex, mother_tongue: motherTongue, city } },
      });
      
      if (signupError) throw signupError;
      if (!data.user) throw new Error("Signup failed - no user returned");

      // Step 2: Also update the profiles table directly (in case trigger didn't fire or we need to ensure city is set)
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ city })
        .eq("id", data.user.id);
      
      if (updateError) {
        console.warn("Profile city update warning:", updateError);
      }

      navigate("/home");
    } catch (err: any) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", position: "relative", overflow: "hidden" }}>
      {/* Animated background */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {/* Grid */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,26,26,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,26,26,0.02) 1px, transparent 1px)", backgroundSize: "50px 50px", maskImage: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.5) 0%, transparent 70%)" }} />
        {/* Moving orbs */}
        <div style={{ position: "absolute", top: "-5%", left: "-5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,26,26,0.07) 0%, transparent 60%)", animation: "float 12s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: "-10%", right: "-5%", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(79,195,247,0.05) 0%, transparent 60%)", animation: "float 15s ease-in-out infinite 3s" }} />
        <div style={{ position: "absolute", top: "40%", left: "60%", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,215,0,0.03) 0%, transparent 60%)", animation: "float 18s ease-in-out infinite 6s" }} />
        <div style={{ position: "absolute", top: "20%", right: "20%", width: 150, height: 150, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,140,66,0.03) 0%, transparent 60%)", animation: "float 14s ease-in-out infinite 4s" }} />
        {/* Particles */}
        <div style={{ position: "absolute", top: "12%", left: "18%", width: 4, height: 4, borderRadius: "50%", background: C.red, opacity: 0.3, animation: "float 4s ease-in-out infinite", boxShadow: `0 0 10px ${C.red}88` }} />
        <div style={{ position: "absolute", top: "28%", right: "22%", width: 3, height: 3, borderRadius: "50%", background: C.cyan, opacity: 0.25, animation: "float 5.5s ease-in-out infinite 1s", boxShadow: `0 0 8px ${C.cyan}88` }} />
        <div style={{ position: "absolute", top: "60%", left: "12%", width: 5, height: 5, borderRadius: "50%", background: C.gold, opacity: 0.2, animation: "float 6s ease-in-out infinite 2s", boxShadow: `0 0 10px ${C.gold}66` }} />
        <div style={{ position: "absolute", top: "80%", right: "15%", width: 3, height: 3, borderRadius: "50%", background: C.red, opacity: 0.2, animation: "float 7s ease-in-out infinite 3s", boxShadow: `0 0 8px ${C.red}66` }} />
        <div style={{ position: "absolute", top: "45%", left: "5%", width: 4, height: 4, borderRadius: "50%", background: C.orange, opacity: 0.15, animation: "float 8s ease-in-out infinite 4s", boxShadow: `0 0 8px ${C.orange}66` }} />
        <div style={{ position: "absolute", top: "70%", left: "40%", width: 3, height: 3, borderRadius: "50%", background: C.cyan, opacity: 0.12, animation: "float 9s ease-in-out infinite 5s", boxShadow: `0 0 6px ${C.cyan}44` }} />
        <div style={{ position: "absolute", top: "5%", left: "55%", width: 4, height: 4, borderRadius: "50%", background: C.gold, opacity: 0.15, animation: "float 6.5s ease-in-out infinite 1.5s", boxShadow: `0 0 8px ${C.gold}55` }} />
        {/* Accent lines */}
        <div style={{ position: "absolute", top: "8%", right: "12%", width: 100, height: 1, background: `linear-gradient(90deg, transparent, ${C.red}20, transparent)`, transform: "rotate(-30deg)", animation: "pulse 5s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: "12%", left: "8%", width: 80, height: 1, background: `linear-gradient(90deg, transparent, ${C.cyan}15, transparent)`, transform: "rotate(20deg)", animation: "pulse 6s ease-in-out infinite 2s" }} />
        <div style={{ position: "absolute", top: "55%", right: "5%", width: 60, height: 1, background: `linear-gradient(90deg, transparent, ${C.gold}12, transparent)`, transform: "rotate(-15deg)", animation: "pulse 7s ease-in-out infinite 3s" }} />
        {/* Scanlines */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.02) 3px, rgba(0,0,0,0.02) 4px)", opacity: 0.4 }} />
      </div>

      {/* Content — centered */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 30, animation: "slideDown 0.6s ease-out" }}>
          <div style={{ width: 76, height: 76, borderRadius: 20, margin: "0 auto 14px", background: `linear-gradient(135deg, #1a0808, ${C.surface})`, border: `2px solid ${C.red}33`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 30px ${C.red}22, 0 0 60px ${C.red}08`, animation: "pulse 3s ease-in-out infinite" }}>
            <SirenaLogo size={50} />
          </div>
          <h1 style={{ ...pixel, fontSize: 20, color: C.text, letterSpacing: 4, margin: 0, animation: "fadeIn 0.7s ease-out 0.2s both" }}>
            SI<span style={{ color: C.red, textShadow: `0 0 14px ${C.red}88` }}>RENE</span>
          </h1>
          <p style={{ ...ui, fontSize: 13, color: C.textMuted, margin: "10px auto 0", maxWidth: 260, lineHeight: 1.5, animation: "fadeIn 0.7s ease-out 0.4s both" }}>
            Master Philippine languages.<br />Rise through mythical ranks.
          </p>
        </div>

        {/* Form */}
        <div style={{ width: "100%", maxWidth: 380, animation: "slideUp 0.6s ease-out 0.2s both" }}>
          {/* Toggle */}
          <div style={{ display: "flex", background: "rgba(255,26,26,0.04)", border: `2px solid ${C.border}`, borderRadius: 12, padding: 3, marginBottom: 18 }}>
            {(["login", "signup"] as const).map((m) => (
              <button key={m} onClick={() => { setMode(m); setError(""); }}
                style={{ flex: 1, padding: "10px", borderRadius: 9, border: "none", cursor: "pointer", background: mode === m ? C.red : "transparent", color: mode === m ? "#fff" : C.textMuted, fontWeight: 800, fontSize: 13, transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)", boxShadow: mode === m ? `0 2px 12px ${C.red}55` : "none", ...ui }}
              >{m === "login" ? "Log In" : "Sign Up"}</button>
            ))}
          </div>

          {/* Card */}
          <Card style={{ padding: "26px 22px" }} glowColor={C.red}>
            {/* Header */}
            <div style={{ marginBottom: 18, animation: "fadeIn 0.4s ease-out 0.3s both" }}>
              <h2 style={{ ...ui, fontSize: 18, fontWeight: 900, color: C.text, margin: 0 }}>
                {mode === "login" ? "Welcome back!" : "Join Sirene"}
              </h2>
              <p style={{ ...ui, fontSize: 12, color: C.textMuted, margin: "5px 0 0" }}>
                {mode === "login" ? "Sign in to continue your journey." : "Create an account to start learning."}
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {mode === "signup" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, animation: "slideUp 0.3s ease-out" }}>
                  <Input label="Username" value={username} onChange={setUsername} placeholder="Choose a username" />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <Select label="Age" value={age} onChange={setAge} options={AGE_OPTIONS} />
                    <Select label="Sex" value={sex} onChange={setSex} options={["Male", "Female", "Non-binary", "Prefer not to say"]} />
                  </div>
                  <Select label="Mother Tongue" value={motherTongue} onChange={setMotherTongue} options={LANGUAGES} />
                  <Select label="City" value={city} onChange={setCity} options={cities} />
                </div>
              )}

              <Input label="Email" value={email} onChange={setEmail} placeholder="your@email.com" />
              <PasswordInput label="Password" value={pw} onChange={setPw} placeholder="••••••••" />
              {mode === "signup" && (
                <div style={{ animation: "slideUp 0.2s ease-out" }}>
                  <PasswordInput label="Confirm Password" value={confirmPw} onChange={setConfirmPw} placeholder="••••••••" />
                </div>
              )}

              {error && (
                <div style={{ ...ui, fontSize: 12, color: C.redLight, background: "rgba(255,26,26,0.08)", border: `1.5px solid ${C.red}33`, borderRadius: 8, padding: "9px 12px", display: "flex", alignItems: "center", gap: 8, animation: "slideUp 0.2s ease-out" }}>
                  <span>⚠️</span> {error}
                </div>
              )}

              <div style={{ marginTop: 6 }}>
                <Btn color={C.red} onClick={mode === "login" ? handleLogin : handleSignup} full size="lg" disabled={loading}>
                  {loading ? "Please wait…" : mode === "login" ? "Start Playing →" : "Create Account →"}
                </Btn>
              </div>

              {mode === "login" && (
                <p style={{ ...ui, fontSize: 11, color: C.textMuted, textAlign: "center", margin: "4px 0 0" }}>
                  Forgot password? <span style={{ color: C.red, cursor: "pointer", fontWeight: 600 }}>Reset it</span>
                </p>
              )}
            </div>
          </Card>

          {/* Footer */}
          <p style={{ ...mono, fontSize: 8, color: "rgba(255,255,255,0.15)", textAlign: "center", marginTop: 16, letterSpacing: "0.06em" }}>
            SIRENE v0.1 · Learn languages through speech
          </p>
        </div>
      </div>
    </div>
  );
}
