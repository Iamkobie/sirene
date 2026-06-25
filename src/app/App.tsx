import { useState } from "react";
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

export default function App() {
  const [xp, setXP] = useState(12000);
  const [playerName, setPlayerName] = useState("PLAYER_ONE");
  const [equippedBanner, setEquippedBanner] = useState<string | null>(null);
  const [equippedAvatar, setEquippedAvatar] = useState<Rank | null>(null);
  const rank = getRank(xp);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isLogin = pathname === "/" || pathname === "/login";

  return (
    <div style={{ ...ui, background: C.bg, minHeight: "100vh", color: C.text }}>
      {/* Ambient background layers — retro playful design */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        {/* Base gradient orbs */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 15% 0%, rgba(255,26,26,0.04) 0%, transparent 50%), radial-gradient(ellipse at 85% 100%, rgba(255,26,26,0.025) 0%, transparent 40%), radial-gradient(ellipse at 50% 50%, rgba(79,195,247,0.015) 0%, transparent 60%)" }} />
        {/* Retro grid */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,26,26,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,26,26,0.03) 1px, transparent 1px)", backgroundSize: "80px 80px", maskImage: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.5) 20%, rgba(0,0,0,0.5) 80%, transparent 100%)" }} />
        {/* Scanlines */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)", opacity: 0.5 }} />
        {/* Corner accent glow top-left */}
        <div style={{ position: "absolute", top: -100, left: -100, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,26,26,0.06) 0%, transparent 70%)", animation: "float 15s ease-in-out infinite" }} />
        {/* Corner accent glow bottom-right */}
        <div style={{ position: "absolute", bottom: -100, right: -100, width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(79,195,247,0.04) 0%, transparent 70%)", animation: "float 18s ease-in-out infinite 3s" }} />
        {/* Floating particles */}
        <div style={{ position: "absolute", top: "20%", left: "10%", width: 4, height: 4, borderRadius: "50%", background: C.red, opacity: 0.15, animation: "float 6s ease-in-out infinite", boxShadow: `0 0 6px ${C.red}44` }} />
        <div style={{ position: "absolute", top: "45%", right: "12%", width: 3, height: 3, borderRadius: "50%", background: C.cyan, opacity: 0.12, animation: "float 8s ease-in-out infinite 1s", boxShadow: `0 0 6px ${C.cyan}44` }} />
        <div style={{ position: "absolute", top: "70%", left: "25%", width: 5, height: 5, borderRadius: "50%", background: C.gold, opacity: 0.1, animation: "float 7s ease-in-out infinite 2s", boxShadow: `0 0 8px ${C.gold}44` }} />
        <div style={{ position: "absolute", top: "35%", left: "60%", width: 3, height: 3, borderRadius: "50%", background: C.red, opacity: 0.1, animation: "float 9s ease-in-out infinite 4s", boxShadow: `0 0 6px ${C.red}44` }} />
        <div style={{ position: "absolute", top: "80%", right: "30%", width: 4, height: 4, borderRadius: "50%", background: C.orange, opacity: 0.08, animation: "float 11s ease-in-out infinite 5s", boxShadow: `0 0 6px ${C.orange}44` }} />
        {/* Retro diagonal accent lines */}
        <div style={{ position: "absolute", top: "5%", right: "5%", width: 120, height: 1, background: `linear-gradient(90deg, transparent, ${C.red}15, transparent)`, transform: "rotate(-45deg)", animation: "pulse 4s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: "10%", left: "8%", width: 100, height: 1, background: `linear-gradient(90deg, transparent, ${C.cyan}12, transparent)`, transform: "rotate(30deg)", animation: "pulse 5s ease-in-out infinite 2s" }} />
        <div style={{ position: "absolute", top: "50%", left: "3%", width: 80, height: 1, background: `linear-gradient(90deg, transparent, ${C.gold}10, transparent)`, transform: "rotate(-20deg)", animation: "pulse 6s ease-in-out infinite 1s" }} />
        {/* Noise texture overlay */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.015, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
      </div>
      {!isLogin && <Navbar xp={xp} rank={rank} playerName={playerName} onLogout={async () => { await supabase.auth.signOut(); navigate("/login"); }} />}
      {/* Mobile bottom nav */}
      {!isLogin && (
        <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100, display: "none", background: "rgba(10,10,10,0.96)", backdropFilter: "blur(20px)", borderTop: `1.5px solid ${C.border}`, padding: "8px 12px 12px", justifyContent: "space-around" }}>
          {NAV_ITEMS.slice(0, 5).map(({ label, icon, screen: s }) => {
            const active = (pathname.replace("/", "") || "home") === s;
            return (
              <button key={s} onClick={() => navigate(`/${s}`)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", color: active ? C.red : C.textMuted, padding: "4px 8px", borderRadius: 8, transition: "all 0.2s" }}>
                <span style={{ fontSize: 16 }}>{icon}</span>
                <span style={{ ...ui, fontSize: 9, fontWeight: 700 }}>{label}</span>
              </button>
            );
          })}
        </nav>
      )}
      <div style={{ position: "relative", zIndex: 1 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login"        element={<LoginScreen />} />
          <Route path="/home"         element={<HomeScreen xp={xp} rank={rank} playerName={playerName} />} />
          <Route path="/play"         element={<PlayScreen />} />
          <Route path="/mission"      element={<MissionScreen />} />
          <Route path="/recording"    element={<RecordingScreen />} />
          <Route path="/evaluation"   element={<EvaluationScreen onXP={(n) => setXP((p) => p + n)} />} />
          <Route path="/leaderboard"  element={<LeaderboardScreen />} />
          <Route path="/achievements" element={<AchievementsScreen />} />
          <Route path="/daily"        element={<DailyScreen />} />
          <Route path="/profile"      element={<ProfileScreen xp={xp} rank={rank} playerName={playerName} onNameChange={setPlayerName} equippedBanner={equippedBanner} setEquippedBanner={setEquippedBanner} equippedAvatar={equippedAvatar} setEquippedAvatar={setEquippedAvatar} />} />
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
          nav[style*="position: fixed"][style*="bottom: 0"] { display: flex !important; }
          main > div { padding: 20px 14px 80px !important; }
        }
        @media (min-width: 769px) {
          nav[style*="position: fixed"][style*="bottom: 0"] { display: none !important; }
        }
      `}</style>
    </div>
  );
}
