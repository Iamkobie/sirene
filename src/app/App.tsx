import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router";
import { supabase } from "../lib/supabase";
import { C, ui, NAV_ITEMS, getRank } from "./constants/theme";
import type { Rank } from "./constants/theme";
import { Navbar } from "./layout/Navbar";
import { LoginScreen } from "./pages/Login";
import { HomeScreen } from "./pages/Home";
import { PlayScreen } from "./pages/Play";
import { MissionScreen } from "./pages/Mission";
import { RecordingScreen } from "./pages/Recording";
import { EvaluationScreen } from "./pages/Evaluation";
import { LeaderboardScreen } from "./pages/Leaderboard";
import { AchievementsScreen } from "./pages/Achievements";
import { DailyScreen } from "./pages/Daily";
import { ProfileScreen } from "./pages/Profile";
import { TrainingScreen } from "./pages/Training";
import { ConsentModal } from "./components/ConsentModal";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const [checked, setChecked] = useState(false);
  const [authed, setAuthed]   = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session);
      setChecked(true);
    });
  }, []);
  if (!checked) return null;
  if (!authed) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const [xp, setXP] = useState(0.0);
  const [playerName, setPlayerName] = useState("PLAYER_ONE");
  const [user, setUser] = useState<any>(null);
  const [challengePhrase, setChallengePhrase] = useState<any>(null);
  const [citiesList, setCitiesList] = useState<string[]>([]);
  const [equippedBanner, _setEquippedBanner] = useState<string | null>(() => localStorage.getItem("sirene_banner"));
  const [equippedAvatar, _setEquippedAvatar] = useState<Rank | null>(() => localStorage.getItem("sirene_avatar") as Rank | null);
  const setEquippedBanner = (v: string | null) => { _setEquippedBanner(v); if (v) localStorage.setItem("sirene_banner", v); else localStorage.removeItem("sirene_banner"); };
  const setEquippedAvatar = (v: Rank | null) => { _setEquippedAvatar(v); if (v) localStorage.setItem("sirene_avatar", v); else localStorage.removeItem("sirene_avatar"); };
  const [showConsent, setShowConsent] = useState(false);
  const rank = getRank(xp);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isLogin = pathname === "/" || pathname === "/login";

  const refreshProfile = async (currentUser?: any) => {
    const u = currentUser ?? (await supabase.auth.getUser()).data.user;
    if (!u) return;
    // Always use user_metadata.username as source of truth
    const metaUsername = u.user_metadata?.username || "PLAYER_ONE";
    const { data, error } = await supabase
      .from("profiles")
      .select("xp")
      .eq("id", u.id)
      .maybeSingle();
    setPlayerName(metaUsername);
    setXP(!error && data ? Number(data.xp) || 0.0 : 0.0);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        refreshProfile(u);
        const hasAnswered = u.user_metadata?.agreed_to_share_audio !== undefined;
        if (!hasAnswered) {
          setShowConsent(true);
        } else if (u.user_metadata?.agreed_to_share_audio === false) {
          setShowConsent(true);
        } else {
          setShowConsent(false);
        }
      } else {
        setPlayerName("PLAYER_ONE");
        setXP(0.0);
        setShowConsent(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    supabase
      .from("cities")
      .select("name")
      .order("name", { ascending: true })
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          const names = data.map((d: any) => d.name);
          const hasOther = names.includes("Other");
          const filtered = names.filter((name: string) => name !== "Other");
          if (hasOther) {
            filtered.push("Other");
          }
          setCitiesList(filtered);
        }
      });
  }, []);

  return (
    <div style={{ ...ui, background: C.bg, minHeight: "100vh", color: C.text }}>
      {/* Ambient background layers — retro playful design */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        {/* Base gradient orbs */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 15% 0%, rgba(255,26,26,0.05) 0%, transparent 50%), radial-gradient(ellipse at 85% 100%, rgba(255,26,26,0.03) 0%, transparent 40%), radial-gradient(ellipse at 50% 50%, rgba(79,195,247,0.02) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(255,215,0,0.015) 0%, transparent 45%)" }} />
        {/* Retro grid */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,26,26,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,26,26,0.035) 1px, transparent 1px)", backgroundSize: "70px 70px", maskImage: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.4) 15%, rgba(0,0,0,0.4) 85%, transparent 100%)" }} />
        {/* Perspective grid floor effect */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "40%", backgroundImage: "linear-gradient(transparent 0%, rgba(255,26,26,0.02) 100%), linear-gradient(90deg, rgba(255,26,26,0.02) 1px, transparent 1px)", backgroundSize: "100% 100%, 80px 100%", maskImage: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.3) 100%)" }} />
        {/* Scanlines */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.025) 2px, rgba(0,0,0,0.025) 4px)", opacity: 0.6 }} />
        {/* Large floating orbs */}
        <div style={{ position: "absolute", top: -120, left: -120, width: 450, height: 450, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,26,26,0.06) 0%, transparent 65%)", animation: "float 14s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: -80, right: -80, width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle, rgba(79,195,247,0.045) 0%, transparent 65%)", animation: "float 17s ease-in-out infinite 4s" }} />
        <div style={{ position: "absolute", top: "40%", right: "15%", width: 250, height: 250, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,215,0,0.025) 0%, transparent 65%)", animation: "float 20s ease-in-out infinite 7s" }} />
        <div style={{ position: "absolute", top: "60%", left: "5%", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,140,66,0.02) 0%, transparent 65%)", animation: "float 16s ease-in-out infinite 2s" }} />
        {/* Floating particles */}
        <div style={{ position: "absolute", top: "18%", left: "10%", width: 4, height: 4, borderRadius: "50%", background: C.red, opacity: 0.2, animation: "float 5s ease-in-out infinite", boxShadow: `0 0 8px ${C.red}66` }} />
        <div style={{ position: "absolute", top: "42%", right: "12%", width: 3, height: 3, borderRadius: "50%", background: C.cyan, opacity: 0.18, animation: "float 7s ease-in-out infinite 1s", boxShadow: `0 0 6px ${C.cyan}66` }} />
        <div style={{ position: "absolute", top: "68%", left: "22%", width: 5, height: 5, borderRadius: "50%", background: C.gold, opacity: 0.14, animation: "float 6s ease-in-out infinite 2s", boxShadow: `0 0 10px ${C.gold}55` }} />
        <div style={{ position: "absolute", top: "30%", left: "55%", width: 3, height: 3, borderRadius: "50%", background: C.red, opacity: 0.12, animation: "float 8s ease-in-out infinite 3s", boxShadow: `0 0 6px ${C.red}44` }} />
        <div style={{ position: "absolute", top: "82%", right: "28%", width: 4, height: 4, borderRadius: "50%", background: C.orange, opacity: 0.1, animation: "float 10s ease-in-out infinite 5s", boxShadow: `0 0 8px ${C.orange}44` }} />
        <div style={{ position: "absolute", top: "12%", right: "35%", width: 3, height: 3, borderRadius: "50%", background: C.cyan, opacity: 0.1, animation: "float 9s ease-in-out infinite 6s", boxShadow: `0 0 6px ${C.cyan}44` }} />
        <div style={{ position: "absolute", top: "55%", left: "42%", width: 4, height: 4, borderRadius: "50%", background: C.gold, opacity: 0.08, animation: "float 12s ease-in-out infinite 4s", boxShadow: `0 0 8px ${C.gold}33` }} />
        <div style={{ position: "absolute", top: "90%", left: "65%", width: 3, height: 3, borderRadius: "50%", background: C.red, opacity: 0.1, animation: "float 7.5s ease-in-out infinite 2.5s", boxShadow: `0 0 6px ${C.red}44` }} />
        {/* Retro diagonal accent lines */}
        <div style={{ position: "absolute", top: "6%", right: "6%", width: 140, height: 1, background: `linear-gradient(90deg, transparent, ${C.red}18, transparent)`, transform: "rotate(-40deg)", animation: "pulse 5s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: "12%", left: "6%", width: 110, height: 1, background: `linear-gradient(90deg, transparent, ${C.cyan}15, transparent)`, transform: "rotate(25deg)", animation: "pulse 6s ease-in-out infinite 2s" }} />
        <div style={{ position: "absolute", top: "48%", left: "2%", width: 90, height: 1, background: `linear-gradient(90deg, transparent, ${C.gold}12, transparent)`, transform: "rotate(-18deg)", animation: "pulse 7s ease-in-out infinite 1s" }} />
        <div style={{ position: "absolute", top: "25%", right: "3%", width: 70, height: 1, background: `linear-gradient(90deg, transparent, ${C.orange}10, transparent)`, transform: "rotate(35deg)", animation: "pulse 8s ease-in-out infinite 3s" }} />
        <div style={{ position: "absolute", bottom: "35%", right: "12%", width: 100, height: 1, background: `linear-gradient(90deg, transparent, ${C.red}10, transparent)`, transform: "rotate(-55deg)", animation: "pulse 9s ease-in-out infinite 4s" }} />
        {/* Noise texture overlay */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.02, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
      </div>
      {showConsent && <ConsentModal onClose={() => setShowConsent(false)} />}
      {!isLogin && <Navbar xp={xp} rank={rank} playerName={playerName} onLogout={async () => { await supabase.auth.signOut(); navigate("/login"); }} equippedAvatar={equippedAvatar} />}
      {/* Mobile bottom nav */}
      {!isLogin && (
        <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100, display: "none", background: "rgba(10,10,10,0.96)", backdropFilter: "blur(20px)", borderTop: `1.5px solid ${C.border}`, padding: "8px 8px 12px", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <div style={{ display: "flex", justifyContent: "flex-start", gap: 4, minWidth: "max-content", padding: "0 4px" }}>
          {NAV_ITEMS.map(({ label, icon, screen: s }) => {
            const active = (pathname.replace("/", "") || "home") === s;
            return (
              <button key={s} onClick={() => navigate(`/${s}`)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", color: active ? C.red : C.textMuted, padding: "4px 10px", borderRadius: 8, transition: "all 0.2s", flexShrink: 0 }}>
                <span style={{ fontSize: 16 }}>{icon}</span>
                <span style={{ ...ui, fontSize: 9, fontWeight: 700, whiteSpace: "nowrap" }}>{label}</span>
              </button>
            );
          })}
          </div>
        </nav>
      )}
      <div style={{ position: "relative", zIndex: 1 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login"        element={<LoginScreen cities={citiesList} />} />
          <Route path="/home"         element={<RequireAuth><HomeScreen xp={xp} rank={rank} playerName={playerName} equippedAvatar={equippedAvatar} /></RequireAuth>} />
          <Route path="/play"         element={<RequireAuth><PlayScreen setChallengePhrase={setChallengePhrase} onXP={(n) => setXP((p) => p + n)} refreshProfile={refreshProfile} /></RequireAuth>} />
          <Route path="/training"     element={<RequireAuth><TrainingScreen onXP={(n) => setXP((p) => p + n)} /></RequireAuth>} />
          <Route path="/mission"      element={<RequireAuth><MissionScreen challengePhrase={challengePhrase} /></RequireAuth>} />
          <Route path="/recording"    element={<RequireAuth><RecordingScreen challengePhrase={challengePhrase} /></RequireAuth>} />
          <Route path="/evaluation"   element={<RequireAuth><EvaluationScreen challengePhrase={challengePhrase} user={user} refreshProfile={refreshProfile} /></RequireAuth>} />
          <Route path="/leaderboard"  element={<RequireAuth><LeaderboardScreen cities={citiesList} /></RequireAuth>} />
          <Route path="/achievements" element={<RequireAuth><AchievementsScreen /></RequireAuth>} />
          <Route path="/daily"        element={<RequireAuth><DailyScreen /></RequireAuth>} />
          <Route path="/profile"      element={<RequireAuth><ProfileScreen xp={xp} rank={rank} playerName={playerName} onNameChange={setPlayerName} equippedBanner={equippedBanner} setEquippedBanner={setEquippedBanner} equippedAvatar={equippedAvatar} setEquippedAvatar={setEquippedAvatar} /></RequireAuth>} />
          <Route path="*"             element={<Navigate to="/home" replace />} />
        </Routes>
      </div>
      <style>{`
        * { box-sizing: border-box; scrollbar-width: none; }
        *::-webkit-scrollbar { display: none; }
        select option { background: ${C.surface}; color: ${C.text}; }
        button { transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1); }
        button:hover { filter: brightness(1.1); }
        button:active { transform: scale(0.97); }
        img { transition: transform 0.3s ease; }
        .sirene-card:hover { background: ${C.surfaceHover} !important; border-color: ${C.borderHover} !important; box-shadow: 0 0 20px rgba(255,26,26,0.08), 0 8px 24px rgba(0,0,0,0.4) !important; transform: translateY(-2px); }
        .sirene-card[style*="cursor: pointer"]:hover { transform: translateY(-3px) scale(1.005); }
        a { color: ${C.red}; text-decoration: none; }
        ::selection { background: ${C.red}44; color: #fff; }
        @keyframes coinFly { 0% { transform: translateY(0) scale(1); opacity: 1; } 100% { transform: translateY(-160px) scale(1.4); opacity: 0; } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.9; transform: scale(1.03); } }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        @keyframes wiggle { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-3deg); } 75% { transform: rotate(3deg); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes glow { 0%, 100% { box-shadow: 0 0 5px rgba(255,26,26,0.2); } 50% { box-shadow: 0 0 20px rgba(255,26,26,0.4); } }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Mobile responsive */
        @media (max-width: 768px) {
          header { padding: 8px 14px !important; }
          header nav { display: none !important; }
          nav[style*="position: fixed"][style*="bottom: 0"] { display: block !important; }
          main > div { padding: 20px 14px 80px !important; }
        }
        @media (min-width: 769px) {
          nav[style*="position: fixed"][style*="bottom: 0"] { display: none !important; }
        }
      `}</style>
    </div>
  );
}
