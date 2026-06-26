import nunoSvg from "../../assets/ranks/nunorank.svg";
import tikbalangSvg from "../../assets/ranks/tikbalrank.svg";
import manananggalSvg from "../../assets/ranks/manananggalrank.svg";
import aswangSvg from "../../assets/ranks/aswangrank.svg";
import sirenaSvg from "../../assets/ranks/sirenarank.svg";

import nunoIcon from "../../assets/ranks/icon-nuno.png";
import tikbalangIcon from "../../assets/ranks/icon-tikbalang.png";
import manananggalIcon from "../../assets/ranks/icon-manananggal.png";
import aswangIcon from "../../assets/ranks/icon-aswang.png";
import sirenaIcon from "../../assets/ranks/icon-sirena.png";

export type Screen = "login" | "home" | "play" | "training" | "mission" | "recording" | "evaluation" | "leaderboard" | "profile" | "achievements" | "daily";
export type Rank = "Nuno" | "Tikbalang" | "Manananggal" | "Aswang" | "Sirena";

export const RANK_SVGS: Record<Rank, string> = {
  Nuno: nunoSvg,
  Tikbalang: tikbalangSvg,
  Manananggal: manananggalSvg,
  Aswang: aswangSvg,
  Sirena: sirenaSvg,
};

export const RANK_ICONS: Record<Rank, string> = {
  Nuno: nunoIcon,
  Tikbalang: tikbalangIcon,
  Manananggal: manananggalIcon,
  Aswang: aswangIcon,
  Sirena: sirenaIcon,
};

export const RANKS: Record<Rank, { color: string; glow: string; bg: string; min: number; max: number; creature: string; tier: string }> = {
  Nuno:        { color: "#cd7f32", glow: "0 0 14px #cd7f3255", bg: "rgba(205,127,50,0.12)",  min: 0,     max: 1000,  creature: "🍄", tier: "Bronze" },
  Tikbalang:   { color: "#b0c4de", glow: "0 0 14px #b0c4de55", bg: "rgba(176,196,222,0.12)", min: 1000,  max: 3000,  creature: "🐴", tier: "Silver" },
  Manananggal: { color: "#ffd700", glow: "0 0 14px #ffd70055", bg: "rgba(255,215,0,0.12)",   min: 3000,  max: 6000,  creature: "🦇", tier: "Gold" },
  Aswang:      { color: "#a8b4c4", glow: "0 0 14px #a8b4c455", bg: "rgba(168,180,196,0.12)", min: 6000,  max: 10000, creature: "👁️", tier: "Platinum" },
  Sirena:      { color: "#b9f2ff", glow: "0 0 14px #b9f2ff55", bg: "rgba(185,242,255,0.12)", min: 10000, max: 15000, creature: "🧜‍♀️", tier: "Diamond" },
};

export const COMING_SOON_RANKS = [
  { name: "???", color: "#1a1a1a", glow: "0 0 8px rgba(255,255,255,0.05)", min: "15k" },
  { name: "???", color: "#1a1a1a", glow: "0 0 8px rgba(255,255,255,0.05)", min: "20k" },
  { name: "???", color: "#1a1a1a", glow: "0 0 8px rgba(255,255,255,0.05)", min: "30k" },
];

export const RANK_BANNERS: Record<Rank, { name: string; gradient: string; unlocked: boolean }[]> = {
  Nuno: [
    { name: "Earth Root", gradient: "linear-gradient(120deg, #1a0f05 0%, #2e1a0a 20%, #5c3a1a 40%, #8b5e34 50%, #cd7f32 55%, #8b5e34 60%, #5c3a1a 70%, #2e1a0a 85%, #1a0f05 100%)", unlocked: true },
  ],
  Tikbalang: [
    { name: "Silver Mane", gradient: "linear-gradient(120deg, #0d1520 0%, #1a2d44 15%, #3d5a80 30%, #7a9cb8 42%, #b0c4de 48%, #e8f0f8 52%, #b0c4de 58%, #7a9cb8 68%, #3d5a80 80%, #1a2d44 92%, #0d1520 100%)", unlocked: true },
  ],
  Manananggal: [
    { name: "Golden Wings", gradient: "linear-gradient(120deg, #1a1200 0%, #3d2e00 12%, #6b4e00 24%, #a67c00 36%, #d4a300 44%, #ffd700 48%, #fff8b0 52%, #ffd700 56%, #d4a300 64%, #a67c00 74%, #6b4e00 84%, #3d2e00 92%, #1a1200 100%)", unlocked: true },
  ],
  Aswang: [
    { name: "Platinum Ascent", gradient: "linear-gradient(120deg, #0f1a24 0%, #1a3040 12%, #2d5060 24%, #4a8090 36%, #6eaab8 44%, #8ecad6 48%, #c0e8f0 50%, #e8f8fc 52%, #c0e8f0 54%, #8ecad6 58%, #6eaab8 66%, #4a8090 76%, #2d5060 86%, #1a3040 94%, #0f1a24 100%)", unlocked: true },
  ],
  Sirena: [
    { name: "Diamond Tide", gradient: "linear-gradient(120deg, #05000d 0%, #0f0020 8%, #1a0044 16%, #330088 24%, #5500cc 32%, #7733ff 38%, #9966ff 42%, #bb99ff 46%, #ddccff 48%, #ffffff 50%, #ddccff 52%, #bb99ff 54%, #9966ff 58%, #7733ff 62%, #5500cc 68%, #330088 76%, #1a0044 84%, #0f0020 92%, #05000d 100%)", unlocked: true },
  ],
};

export const COMING_SOON_BANNERS = [
  { name: "???", gradient: "linear-gradient(135deg, #0a0a0a, #111, #0a0a0a)" },
  { name: "???", gradient: "linear-gradient(135deg, #0a0a0a, #111, #0a0a0a)" },
  { name: "???", gradient: "linear-gradient(135deg, #0a0a0a, #111, #0a0a0a)" },
  { name: "???", gradient: "linear-gradient(135deg, #0a0a0a, #111, #0a0a0a)" },
];

export function getRank(xp: number): Rank {
  if (xp < 1000) return "Nuno";
  if (xp < 3000) return "Tikbalang";
  if (xp < 6000) return "Manananggal";
  if (xp < 10000) return "Aswang";
  return "Sirena";
}

export const C = {
  bg: "#0a0a0a",
  surface: "#131313",
  surfaceHover: "#1c1414",
  border: "rgba(255,26,26,0.12)",
  borderHover: "rgba(255,26,26,0.25)",
  borderStrong: "rgba(255,26,26,0.4)",
  text: "#f5eded",
  textMuted: "#9e7070",
  red: "#ff1a1a",
  redLight: "#ff5252",
  redDark: "#cc0000",
  redGlow: "0 0 12px rgba(255,26,26,0.2)",
  gold: "#ffd700",
  green: "#4caf7d",
  cyan: "#4fc3f7",
  orange: "#ff8c42",
};

export const ui: React.CSSProperties = { fontFamily: "'Inter', sans-serif" };
export const mono: React.CSSProperties = { fontFamily: "'Space Mono', monospace" };
export const pixel: React.CSSProperties = { fontFamily: "'Press Start 2P', monospace" };

export const SOURCE_PHRASES: Record<string, string[]> = {
  English: ["Have you eaten yet?", "Good morning, how are you?", "Where are you going?", "I am happy to see you.", "What is your name?", "Thank you very much."],
  Tagalog: ["Kumain ka na ba?", "Magandang umaga, kumusta ka?", "Saan ka pupunta?", "Masaya akong makita ka.", "Ano ang pangalan mo?", "Maraming salamat."],
};

export const LANGUAGES = ["Cebuano", "Ilocano", "Hiligaynon", "Waray", "Kapampangan", "Pangasinan", "Tagalog", "English", "Other"];

export const NAV_ITEMS: { label: string; icon: string; screen: Screen }[] = [
  { label: "Home",         icon: "⌂",  screen: "home" },
  { label: "Play",         icon: "▶",  screen: "play" },
  { label: "Training",     icon: "📖", screen: "training" },
  { label: "Leaderboard",  icon: "★",  screen: "leaderboard" },
  { label: "Daily",        icon: "⚡", screen: "daily" },
  { label: "Achievements", icon: "🏆", screen: "achievements" },
  { label: "Profile",      icon: "◉",  screen: "profile" },
];
