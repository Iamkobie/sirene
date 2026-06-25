import { useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../lib/supabase";
import { C, ui, pixel, LANGUAGES } from "../constants/theme";
import { SirenaLogo, Card, Btn, Input, PasswordInput, Select } from "../components/shared";

export function LoginScreen() {
  const navigate = useNavigate();
  const [mode, setMode]                 = useState<"login" | "signup">("login");
  const [email, setEmail]               = useState("");
  const [pw, setPw]                     = useState("");
  const [confirmPw, setConfirmPw]       = useState("");
  const [username, setUsername]         = useState("");
  const [age, setAge]                   = useState("");
  const [sex, setSex]                   = useState("");
  const [motherTongue, setMotherTongue] = useState("");
  const [error, setError]               = useState("");
  const [loading, setLoading]           = useState(false);

  const handleLogin = async () => {
    setError(""); setLoading(true);
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password: pw });
    setLoading(false);
    if (err) { setError(err.message); return; }
    console.log("[SIRENE] JWT Access Token:",  data.session?.access_token);
    console.log("[SIRENE] JWT Refresh Token:", data.session?.refresh_token);
    console.log("[SIRENE] User:", data.session?.user);
    navigate("/home");
  };

  const handleSignup = async () => {
    if (!username || !age || !sex || !motherTongue) { setError("Please fill in all fields."); return; }
    if (pw !== confirmPw) { setError("Passwords do not match."); return; }
    setError(""); setLoading(true);
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password: pw,
      options: { data: { username, age: Number(age), sex, mother_tongue: motherTongue } },
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    if (data.session) {
      console.log("[SIRENE] JWT Access Token:",  data.session.access_token);
      console.log("[SIRENE] JWT Refresh Token:", data.session.refresh_token);
      console.log("[SIRENE] User:", data.session.user);
    } else {
      console.log("[SIRENE] Signed up — check email for confirmation.", data.user);
    }
    navigate("/home");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", position: "relative", overflow: "hidden" }}>
      {/* Animated red particles */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "15%", left: "20%", width: 6, height: 6, borderRadius: "50%", background: C.red, opacity: 0.3, animation: "float 4s ease-in-out infinite" }} />
        <div style={{ position: "absolute", top: "60%", right: "15%", width: 4, height: 4, borderRadius: "50%", background: C.red, opacity: 0.2, animation: "float 5s ease-in-out infinite 1s" }} />
        <div style={{ position: "absolute", bottom: "25%", left: "10%", width: 8, height: 8, borderRadius: "50%", background: C.red, opacity: 0.15, animation: "float 6s ease-in-out infinite 2s" }} />
        <div style={{ position: "absolute", top: "30%", right: "25%", width: 5, height: 5, borderRadius: "50%", background: C.redLight, opacity: 0.2, animation: "float 4.5s ease-in-out infinite 0.5s" }} />
      </div>

      <div style={{ textAlign: "center", marginBottom: 36, animation: "slideDown 0.6s ease-out" }}>
        <div style={{ width: 84, height: 84, borderRadius: 22, margin: "0 auto 20px", background: `linear-gradient(135deg, #1a0808, ${C.surface})`, border: `2px solid ${C.red}33`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 24px ${C.red}22, 0 0 48px ${C.red}11`, animation: "pulse 2.5s ease-in-out infinite" }}><SirenaLogo size={56} /></div>
        <h1 style={{ ...pixel, fontSize: 18, color: C.text, letterSpacing: 3, margin: 0 }}>
          SI<span style={{ color: C.red, textShadow: `0 0 14px ${C.red}99` }}>RENE</span>
        </h1>
        <p style={{ ...ui, fontSize: 13, color: C.textMuted, marginTop: 10, maxWidth: 280, margin: "10px auto 0" }}>Master Philippine languages. Rise through mythical ranks. 🇵🇭</p>
      </div>

      <div style={{ width: "100%", maxWidth: 380, animation: "slideUp 0.6s ease-out 0.2s both" }}>
        <div style={{ display: "flex", background: "rgba(255,26,26,0.05)", border: `2px solid ${C.border}`, borderRadius: 14, padding: 4, marginBottom: 20 }}>
          {(["login", "signup"] as const).map((m) => (
            <button key={m} onClick={() => { setMode(m); setError(""); }}
              style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", cursor: "pointer", background: mode === m ? C.red : "transparent", color: mode === m ? "#fff" : C.textMuted, fontWeight: 800, fontSize: 13, transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)", boxShadow: mode === m ? `0 0 14px ${C.red}55` : "none", transform: mode === m ? "scale(1.02)" : "scale(1)", ...ui }}
            >{m === "login" ? "⚔️ Log In" : "🛡️ Sign Up"}</button>
          ))}
        </div>

        <Card style={{ padding: 28 }} glowColor={C.red}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {mode === "signup" && (
              <>
                <Input label="Username" value={username} onChange={setUsername} placeholder="PixelMaster42" />
                <Input label="Age" type="number" value={age} onChange={setAge} placeholder="18" />
                <Select label="Sex" value={sex} onChange={setSex} options={["Male", "Female", "Non-binary", "Prefer not to say"]} />
                <Select label="Mother Tongue" value={motherTongue} onChange={setMotherTongue} options={LANGUAGES} />
              </>
            )}
            <Input label="Email" value={email} onChange={setEmail} placeholder="player@sirene.ph" />
            <PasswordInput label="Password" value={pw} onChange={setPw} placeholder="••••••••" />
            {mode === "signup" && (
              <PasswordInput label="Repeat Password" value={confirmPw} onChange={setConfirmPw} placeholder="••••••••" />
            )}

            {error && (
              <div style={{ ...ui, fontSize: 12, color: C.redLight, background: "rgba(255,26,26,0.08)", border: `1.5px solid ${C.red}44`, borderRadius: 10, padding: "10px 14px" }}>
                {error}
              </div>
            )}

            <Btn color={C.red} onClick={mode === "login" ? handleLogin : handleSignup} full size="lg" disabled={loading}>
              {loading ? "Please wait…" : mode === "login" ? "▶  Start Playing" : "★  Create Account"}
            </Btn>
            {mode === "login" && (
              <p style={{ ...ui, fontSize: 12, color: C.textMuted, textAlign: "center", margin: 0 }}>
                Forgot password? <span style={{ color: C.red, cursor: "pointer", fontWeight: 600 }}>Reset it</span>
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
