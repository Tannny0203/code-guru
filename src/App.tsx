import React, { useState, useEffect, useRef, useCallback } from "react";
import { CodeInput } from "./frontend/components/CodeInput.tsx";
import { Result } from "./frontend/components/Result.tsx";
import { ChatBot } from "./frontend/components/ChatBot.tsx";
import { AuthPage } from "./frontend/components/AuthPage.tsx";
import { LearnPage } from "./frontend/components/LearnPage.tsx";
import { useAuth } from "./frontend/context/AuthContext.tsx";
import { analyzeCode, AnalysisResult, getUserStats, UserStats, generateChallenge } from "./frontend/services/api.ts";
import {
  Brain, Sparkles, Terminal, BarChart3, Trophy, History,
  Loader2, Zap, Star, Shield, Flame, Crown, ChevronRight,
  Code2, Target, Lock, CheckCircle2, Swords, BookOpen, Medal, LogOut
} from "lucide-react";import { motion, AnimatePresence, useSpring, useTransform } from "motion/react";
import ReactMarkdown from "react-markdown";

type Tab = "analyze" | "dashboard" | "challenges" | "learn";

// ─── Level System ─────────────────────────────────────────────────────────────
const LEVELS = [
  {
    name: "Beginner", min: 0, max: 4, emoji: "🌱",
    color: "from-emerald-400 to-teal-500", glow: "shadow-emerald-500/40",
    bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30",
    icon: Code2, desc: "Just getting started. Every expert was once a beginner.",
    perks: ["Code analysis", "Basic feedback", "Language detection"],
  },
  {
    name: "Debugger", min: 5, max: 14, emoji: "🔍",
    color: "from-blue-400 to-cyan-500", glow: "shadow-blue-500/40",
    bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30",
    icon: Zap, desc: "You've learned to find bugs. The hunt is on!",
    perks: ["Memory tracking", "Past mistake recall", "Bug pattern detection"],
  },
  {
    name: "Intermediate", min: 15, max: 29, emoji: "⚡",
    color: "from-violet-400 to-purple-600", glow: "shadow-violet-500/40",
    bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/30",
    icon: Shield, desc: "Solid fundamentals. You write code that works.",
    perks: ["Multi-language mastery", "Personalized challenges", "Pattern recognition"],
  },
  {
    name: "Master", min: 30, max: 49, emoji: "🔥",
    color: "from-orange-400 to-rose-500", glow: "shadow-orange-500/40",
    bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/30",
    icon: Flame, desc: "Elite coder. You think in algorithms.",
    perks: ["Advanced optimizations", "Architecture feedback", "Elite challenges"],
  },
  {
    name: "Algorithm Master", min: 50, max: Infinity, emoji: "👑",
    color: "from-yellow-400 to-amber-500", glow: "shadow-yellow-500/40",
    bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/30",
    icon: Crown, desc: "Legendary. You ARE the algorithm.",
    perks: ["Unlimited wisdom", "Hall of Fame", "God-tier feedback"],
  },
];

const ACHIEVEMENTS = [
  { id: "first_blood",  name: "First Blood",     emoji: "🩸", desc: "Complete your first analysis",      req: (s: UserStats) => s.totalAnalyses >= 1  },
  { id: "on_a_roll",   name: "On a Roll",        emoji: "🎲", desc: "Complete 5 analyses",               req: (s: UserStats) => s.totalAnalyses >= 5  },
  { id: "polyglot",    name: "Polyglot",          emoji: "🌍", desc: "Analyze code in 3+ languages",     req: (s: UserStats) => s.languages.length >= 3 },
  { id: "grind",       name: "The Grind",         emoji: "⚙️", desc: "Complete 15 analyses",              req: (s: UserStats) => s.totalAnalyses >= 15 },
  { id: "dedicated",   name: "Dedicated",         emoji: "💎", desc: "Complete 30 analyses",              req: (s: UserStats) => s.totalAnalyses >= 30 },
  { id: "legend",      name: "Legend",            emoji: "🏆", desc: "Reach Algorithm Master",           req: (s: UserStats) => s.totalAnalyses >= 50 },
];

function getLevel(n: number) { return LEVELS.find(l => n >= l.min && n <= l.max) ?? LEVELS[0]; }
function getProgress(n: number) {
  const l = getLevel(n);
  if (l.max === Infinity) return 100;
  return Math.round(((n - l.min) / (l.max - l.min + 1)) * 100);
}
function getXPToNext(n: number) {
  const l = getLevel(n);
  return l.max === Infinity ? 0 : l.max + 1 - n;
}

// ─── Particles ────────────────────────────────────────────────────────────────
function Particle({ x, y, color }: { x: number; y: number; color: string }) {
  const angle = Math.random() * 360;
  const distance = 80 + Math.random() * 120;
  const dx = Math.cos((angle * Math.PI) / 180) * distance;
  const dy = Math.sin((angle * Math.PI) / 180) * distance;
  return (
    <motion.div
      className={`fixed w-2 h-2 rounded-full pointer-events-none z-50 ${color}`}
      style={{ left: x, top: y }}
      initial={{ scale: 1, x: 0, y: 0, opacity: 1 }}
      animate={{ scale: 0, x: dx, y: dy, opacity: 0 }}
      transition={{ duration: 0.8 + Math.random() * 0.4, ease: "easeOut" }}
    />
  );
}

// ─── Animated Number ──────────────────────────────────────────────────────────
function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let cur = 0;
    const step = Math.max(1, Math.ceil(value / 30));
    const t = setInterval(() => {
      cur = Math.min(cur + step, value);
      setDisplay(cur);
      if (cur >= value) clearInterval(t);
    }, 20);
    return () => clearInterval(t);
  }, [value]);
  return <>{display}</>;
}

// ─── XP Toast ─────────────────────────────────────────────────────────────────
function XPToast({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.7 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.8 }}
          className="fixed bottom-8 right-8 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl"
          style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
        >
          <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
          <span className="font-black text-lg text-white">+10 XP Earned!</span>
          <Sparkles className="w-5 h-5 text-yellow-300" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Level Up Modal ───────────────────────────────────────────────────────────
function LevelUpModal({ levelName, onClose }: { levelName: string; onClose: () => void }) {
  const level = LEVELS.find(l => l.name === levelName) ?? LEVELS[0];
  const Icon = level.icon;
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.3, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="relative text-center space-y-5 p-8 md:p-14 rounded-3xl border border-white/20 shadow-2xl overflow-hidden max-w-md mx-4"
        style={{ background: "linear-gradient(135deg,#1e1b4b,#312e81,#1e1b4b)" }}
      >
        {/* Glow rings */}
        <motion.div animate={{ scale: [1,1.4,1], opacity: [0.3,0.6,0.3] }} transition={{ repeat: Infinity, duration: 2 }}
          className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${level.color} opacity-20`} />
        <div className="relative">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
            className={`w-24 h-24 mx-auto rounded-full bg-gradient-to-br ${level.color} flex items-center justify-center shadow-2xl ${level.glow}`}>
            <Icon className="w-12 h-12 text-white" />
          </motion.div>
          <motion.div animate={{ y: [0,-8,0] }} transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute -top-2 -right-2 text-4xl">⭐</motion.div>
        </div>
        <div>
          <p className="text-white/60 font-semibold text-sm uppercase tracking-widest">Level Up!</p>
          <h2 className="text-5xl font-black text-white mt-1">{level.emoji} {level.name}</h2>
          <p className="text-slate-400 mt-2 text-sm">{level.desc}</p>
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          {level.perks.map(p => (
            <span key={p} className={`text-xs font-bold px-3 py-1 rounded-full ${level.bg} ${level.text} border ${level.border}`}>✓ {p}</span>
          ))}
        </div>
        <p className="text-slate-500 text-xs">Click anywhere to continue</p>
      </motion.div>
    </motion.div>
  );
}

// ─── Achievement Toast ─────────────────────────────────────────────────────────
function AchievementToast({ achievement, onDone }: { achievement: typeof ACHIEVEMENTS[0]; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, [onDone]);
  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 300, opacity: 0 }}
      className="fixed top-24 right-6 z-50 flex items-center gap-4 px-5 py-4 bg-slate-800 border border-amber-500/40 rounded-2xl shadow-2xl shadow-amber-900/30 max-w-xs"
    >
      <div className="text-3xl">{achievement.emoji}</div>
      <div>
        <p className="text-amber-400 text-xs font-bold uppercase tracking-wider">Achievement Unlocked!</p>
        <p className="text-white font-black">{achievement.name}</p>
        <p className="text-slate-400 text-xs">{achievement.desc}</p>
      </div>
    </motion.div>
  );
}

// ─── Skill Bar ─────────────────────────────────────────────────────────────────
function SkillBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-semibold">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-300">{value}%</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 1.2, ease: "easeOut" }}
          className={`h-full rounded-full bg-gradient-to-r ${color}`} />
      </div>
    </div>
  );
}

// ─── Level Progress Strip ──────────────────────────────────────────────────────
function LevelProgressStrip({ analyses }: { analyses: number }) {
  const level = getLevel(analyses);
  const progress = getProgress(analyses);
  const nextLevel = LEVELS[LEVELS.indexOf(level) + 1];
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className={`text-sm font-bold ${level.text}`}>{level.emoji} {level.name}</span>
        {nextLevel && <span className="text-slate-500 text-xs">{getXPToNext(analyses)} analyses to {nextLevel.emoji} {nextLevel.name}</span>}
        {!nextLevel && <span className="text-yellow-400 text-xs font-bold">👑 MAX LEVEL</span>}
      </div>
      <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/10">
        <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full rounded-full bg-gradient-to-r ${level.color} relative`}>
          <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
        </motion.div>
      </div>
      <div className="flex justify-between text-xs text-slate-600">
        <span>{analyses} XP</span><span>{level.max === Infinity ? "∞" : (level.max + 1) * 10} XP</span>
      </div>
    </div>
  );
}

// ─── Level Roadmap Card ────────────────────────────────────────────────────────
function LevelRoadmap({ analyses }: { analyses: number }) {
  const currentLevel = getLevel(analyses);
  return (
    <div className="space-y-3">
      {LEVELS.map((level, i) => {
        const Icon = level.icon;
        const isUnlocked = analyses >= level.min;
        const isCurrent = level.name === currentLevel.name;
        return (
          <motion.div key={level.name} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
            className={`relative flex items-center gap-4 p-4 rounded-2xl border-2 transition-all overflow-hidden ${
              isCurrent ? `${level.bg} ${level.border} shadow-lg ${level.glow}` :
              isUnlocked ? "bg-white/5 border-white/10" : "bg-white/[0.02] border-white/5 opacity-50"
            }`}>
            {isCurrent && (
              <motion.div animate={{ x: ["-100%","100%"] }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent`} />
            )}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${
              isUnlocked ? `bg-gradient-to-br ${level.color}` : "bg-white/5"
            }`}>
              {isUnlocked ? <Icon className="w-6 h-6 text-white" /> : <Lock className="w-5 h-5 text-slate-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-white">{level.emoji} {level.name}</span>
                {isCurrent && <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${level.bg} ${level.text} border ${level.border}`}>YOU ARE HERE</span>}
                {isUnlocked && !isCurrent && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{level.desc}</p>
              <p className="text-xs text-slate-600 mt-0.5">{level.max === Infinity ? `${level.min}+ analyses` : `${level.min}–${level.max} analyses`}</p>
            </div>
            <div className="text-2xl">{isUnlocked ? level.emoji : "🔒"}</div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const { user, logout, loading: authLoading } = useAuth();

  // Show loading spinner while checking saved session
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "radial-gradient(ellipse at top,#0f0c29,#1a1040,#0d0d0d)" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-2xl" style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
            <Brain className="w-8 h-8 text-white animate-pulse" />
          </div>
          <p className="text-slate-400 text-sm font-semibold">Loading CodeMentor AI...</p>
        </div>
      </div>
    );
  }

  // Show auth page if not logged in
  if (!user) return <AuthPage />;

  return <AppContent user={user} onLogout={logout} />;
}

function AppContent({ user, onLogout }: { user: { id: string; name: string; email: string; createdAt: string }; onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>("analyze");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [challenge, setChallenge] = useState<string | null>(null);
  const [isGeneratingChallenge, setIsGeneratingChallenge] = useState(false);
  const [showXP, setShowXP] = useState(false);
  const [levelUp, setLevelUp] = useState<string | null>(null);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string }[]>([]);
  const [newAchievement, setNewAchievement] = useState<typeof ACHIEVEMENTS[0] | null>(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Set<string>>(new Set());
  const prevLevelRef = useRef<string | null>(null);
  const prevAchievementsRef = useRef<Set<string>>(new Set());

  useEffect(() => { fetchStats(); }, []);

  const spawnParticles = useCallback((x: number, y: number) => {
    const colors = ["bg-violet-400","bg-yellow-300","bg-pink-400","bg-emerald-400","bg-blue-400","bg-orange-400"];
    const newP = Array.from({ length: 16 }, (_, i) => ({
      id: Date.now() + i,
      x: x + Math.random() * 40 - 20,
      y: y + Math.random() * 40 - 20,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    setParticles(p => [...p, ...newP]);
    setTimeout(() => setParticles(p => p.filter(pt => !newP.find(n => n.id === pt.id))), 1500);
  }, []);

  const fetchStats = async () => {
    try {
      const data = await getUserStats();
      setStats(data);
      // Check achievements
      const unlocked = new Set<string>();
      ACHIEVEMENTS.forEach(a => { if (a.req(data)) unlocked.add(a.id); });
      setUnlockedAchievements(unlocked);
      prevAchievementsRef.current = unlocked;
    } catch (err) { console.error("Failed to fetch stats:", err); }
  };

  const handleAnalyze = async (code: string) => {
    setIsLoading(true);
    setError(null);
    const prevLevelName = stats ? getLevel(stats.totalAnalyses).name : null;
    prevLevelRef.current = prevLevelName;
    const prevAch = new Set(prevAchievementsRef.current);
    try {
      const data = await analyzeCode(code);
      setResult(data);

      // Spawn particles on button
      const btn = document.querySelector("[data-analyze-btn]");
      if (btn) {
        const r = btn.getBoundingClientRect();
        spawnParticles(r.left + r.width / 2, r.top + r.height / 2);
      }

      const newStats = await getUserStats().catch(() => null);
      if (newStats) {
        setStats(newStats);
        // Level up check
        const newLevelName = getLevel(newStats.totalAnalyses).name;
        if (prevLevelRef.current && newLevelName !== prevLevelRef.current) {
          setLevelUp(newLevelName);
        }
        // Achievement check
        const newUnlocked = new Set<string>();
        ACHIEVEMENTS.forEach(a => { if (a.req(newStats)) newUnlocked.add(a.id); });
        setUnlockedAchievements(newUnlocked);
        const justUnlocked = ACHIEVEMENTS.find(a => newUnlocked.has(a.id) && !prevAch.has(a.id));
        if (justUnlocked) setNewAchievement(justUnlocked);
        prevAchievementsRef.current = newUnlocked;
      }

      setShowXP(true);
      setTimeout(() => setShowXP(false), 3000);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateChallenge = async () => {
    if (!stats) return;
    setIsGeneratingChallenge(true);
    try { setChallenge(await generateChallenge(stats)); }
    catch (err) { console.error("Failed to generate challenge:", err); }
    finally { setIsGeneratingChallenge(false); }
  };

  const analyses = stats?.totalAnalyses ?? 0;
  const level = getLevel(analyses);
  const Icon = level.icon;

  // Skill scores (derived from analyses + languages)
  const langs = stats?.languages.length ?? 0;
  const skillScores = {
    "Problem Solving": Math.min(100, analyses * 2 + 10),
    "Code Quality": Math.min(100, analyses * 1.5 + 15),
    "Bug Detection": Math.min(100, analyses * 2.5 + 5),
    "Language Breadth": Math.min(100, langs * 25),
    "Consistency": Math.min(100, analyses * 1.8 + 8),
  };

  return (
    <div className="min-h-screen font-sans" style={{ background: "radial-gradient(ellipse at top,#0f0c29,#1a1040,#0d0d0d)" }}>

      {/* Ambient background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-20" style={{ background: "radial-gradient(circle,#7c3aed,transparent 70%)" }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-15" style={{ background: "radial-gradient(circle,#2563eb,transparent 70%)" }} />
        <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] rounded-full opacity-10" style={{ background: "radial-gradient(circle,#db2777,transparent 70%)" }} />
      </div>

      {/* Particles */}
      {particles.map(p => <Particle key={p.id} x={p.x} y={p.y} color={p.color} />)}

      {/* Toasts & Modals */}
      <XPToast show={showXP} />
      <AnimatePresence>
        {levelUp && <LevelUpModal levelName={levelUp} onClose={() => setLevelUp(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {newAchievement && <AchievementToast achievement={newAchievement} onDone={() => setNewAchievement(null)} />}
      </AnimatePresence>

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-white/10 backdrop-blur-xl" style={{ background: "rgba(10,8,30,0.85)" }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex flex-wrap items-center justify-between gap-2">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <motion.div whileHover={{ rotate: 15 }} className="p-2.5 rounded-xl shadow-lg shadow-violet-900" style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
              <Brain className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-lg font-black text-white tracking-tight">CodeMentor AI</h1>
              <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">Powered by Gemini + Hindsight</p>
            </div>
          </div>

          {/* Level display in header */}
          {stats && (
            <div className="hidden lg:flex items-center gap-3 px-4 py-2 rounded-xl border border-white/10 bg-white/5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${level.color}`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className={`text-sm font-black ${level.text}`}>{level.emoji} {level.name}</p>
                <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden mt-0.5">
                  <motion.div animate={{ width: `${getProgress(analyses)}%` }} transition={{ duration: 1 }}
                    className={`h-full rounded-full bg-gradient-to-r ${level.color}`} />
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-black text-white">{analyses * 10} XP</p>
                <p className="text-[10px] text-slate-500">{analyses} analyses</p>
              </div>
            </div>
          )}

          {/* Nav + User */}
          <div className="flex items-center gap-2">
            <nav className="flex gap-1 p-1 rounded-xl border border-white/10 bg-white/5">
              {[
                { id: "analyze",    icon: Terminal,  label: "Analyze"    },
                { id: "dashboard",  icon: BarChart3,  label: "Dashboard"  },
                { id: "challenges", icon: Trophy,     label: "Challenges" },
                { id: "learn",      icon: BookOpen,   label: "Learn"      },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as Tab)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    activeTab === tab.id
                      ? "text-white shadow-lg" : "text-slate-400 hover:text-white"
                  }`}
                  style={activeTab === tab.id ? { background: "linear-gradient(135deg,#7c3aed,#4f46e5)" } : {}}>
                  <tab.icon className="w-4 h-4" /><span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </nav>
            {/* User + Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <div className="hidden sm:flex flex-col items-end">
                <p className="text-xs font-black text-white leading-tight">{user.name}</p>
                <p className="text-[10px] text-slate-600 leading-tight">{user.email}</p>
              </div>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm text-white flex-shrink-0" style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/10 transition-all text-xs font-bold flex-shrink-0">
                <LogOut className="w-3.5 h-3.5" /><span className="hidden sm:inline">Logout</span>
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
        <AnimatePresence mode="wait">

          {/* ── ANALYZE TAB ── */}
          {activeTab === "analyze" && (
            <motion.div key="analyze" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-10">
              {/* Hero */}
              <div className="text-center space-y-4">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold border border-violet-500/30 bg-violet-500/10 text-violet-300">
                  <Sparkles className="w-4 h-4" />AI-Powered Code Mentorship
                </motion.div>
                <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  className="text-3xl sm:text-4xl md:text-6xl font-black text-white tracking-tight leading-tight">
                  Code. Earn XP.<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-pink-400 to-indigo-400">
                    Level Up.
                  </span>
                </motion.h2>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                  className="text-slate-400 max-w-xl mx-auto text-lg">
                  Paste your code, earn <span className="text-yellow-400 font-bold">+10 XP</span> per analysis, and climb from <span className="text-emerald-400 font-bold">🌱 Beginner</span> to <span className="text-yellow-400 font-bold">👑 Algorithm Master</span>.
                </motion.p>
              </div>

              {/* Progress strip */}
              {stats && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                  className="max-w-2xl mx-auto p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
                  <LevelProgressStrip analyses={analyses} />
                </motion.div>
              )}

              {error && (
                <div className="max-w-4xl mx-auto p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-sm flex items-center gap-3">
                  <Terminal className="w-4 h-4 flex-shrink-0" />{error}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div data-analyze-btn>
                  <CodeInput onAnalyze={handleAnalyze} isLoading={isLoading} />
                </div>
                <div className="min-h-[300px] md:min-h-[420px]">
                  {result ? (
                    <Result feedback={result.feedback} memories={result.memories} weakAreas={result.weakAreas} />
                  ) : (
                    <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 3 }}
                      className="h-full flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-3xl p-12 text-center space-y-5">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center">
                          <Terminal className="w-10 h-10 text-slate-600" />
                        </div>
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                          className="absolute -top-2 -right-2 text-xl">⭐</motion.div>
                      </div>
                      <div>
                        <p className="font-black text-slate-300 text-lg">No analysis yet</p>
                        <p className="text-sm text-slate-600 mt-1">Submit code to earn XP and unlock levels</p>
                      </div>
                      <div className="flex gap-2">
                        {["🌱","🔍","⚡","🔥","👑"].map((e,i) => (
                          <motion.span key={i} animate={{ scale: [1, i === 0 ? 1.3 : 1, 1] }} transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }}
                            className="text-xl opacity-40">{e}</motion.span>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── DASHBOARD TAB ── */}
          {activeTab === "dashboard" && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-8">

              {/* Stat cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                {[
                  {
                    label: "Total XP", value: <><AnimatedNumber value={analyses * 10} /><span className="text-3xl ml-1">XP</span></>,
                    sub: `${analyses} analyses completed`, icon: <Zap className="w-5 h-5 text-yellow-300" />,
                    bg: "from-violet-700 to-indigo-800", glow: "shadow-violet-900/60",
                  },
                  {
                    label: "Current Level", value: <>{level.emoji} {level.name}</>,
                    sub: getXPToNext(analyses) > 0 ? `${getXPToNext(analyses)} to next level` : "👑 MAX REACHED",
                    icon: <Icon className="w-5 h-5 text-white" />,
                    bg: level.color, glow: level.glow,
                  },
                  {
                    label: "Languages", value: <AnimatedNumber value={stats?.languages.length ?? 0} />,
                    sub: stats?.languages.slice(0, 3).join(" · ") || "None yet",
                    icon: <Star className="w-5 h-5 text-amber-300" />,
                    bg: "from-slate-700 to-slate-800", glow: "shadow-slate-900/60",
                  },
                ].map((card, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                    className={`p-6 rounded-2xl bg-gradient-to-br ${card.bg} shadow-2xl ${card.glow} border border-white/10`}>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-white/60 text-xs font-bold uppercase tracking-wider">{card.label}</p>
                      {card.icon}
                    </div>
                    <p className="text-4xl font-black text-white leading-none">{card.value}</p>
                    <p className="text-white/50 text-sm mt-2">{card.sub}</p>
                  </motion.div>
                ))}
              </div>

              {/* Skills + Level Roadmap */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Skill bars */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                  className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-500/20 rounded-lg"><Swords className="w-5 h-5 text-blue-400" /></div>
                    <h3 className="font-black text-white text-lg">Skill Scores</h3>
                  </div>
                  <div className="space-y-4">
                    {Object.entries(skillScores).map(([label, value], i) => (
                      <SkillBar key={label} label={label} value={value}
                        color={["from-blue-400 to-cyan-400","from-violet-400 to-purple-500","from-emerald-400 to-teal-500","from-orange-400 to-amber-500","from-rose-400 to-pink-500"][i]} />
                    ))}
                  </div>
                </motion.div>

                {/* Level Roadmap */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}
                  className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 bg-violet-500/20 rounded-lg"><Target className="w-5 h-5 text-violet-400" /></div>
                    <h3 className="font-black text-white text-lg">Level Roadmap</h3>
                  </div>
                  <div className="max-h-[380px] overflow-y-auto pr-1 space-y-1">
                    <LevelRoadmap analyses={analyses} />
                  </div>
                </motion.div>
              </div>

              {/* Achievements + Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Achievements */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 bg-amber-500/20 rounded-lg"><Medal className="w-5 h-5 text-amber-400" /></div>
                    <h3 className="font-black text-white text-lg">Achievements</h3>
                    <span className="ml-auto text-xs font-bold text-amber-400">{unlockedAchievements.size}/{ACHIEVEMENTS.length}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {ACHIEVEMENTS.map((ach, i) => {
                      const unlocked = unlockedAchievements.has(ach.id);
                      return (
                        <motion.div key={ach.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}
                          whileHover={unlocked ? { scale: 1.05 } : {}}
                          className={`p-3 rounded-xl border text-center transition-all ${
                            unlocked ? "bg-amber-500/10 border-amber-500/30 shadow-lg shadow-amber-900/20" : "bg-white/[0.02] border-white/5 opacity-40"
                          }`}>
                          <div className="text-2xl mb-1">{unlocked ? ach.emoji : "🔒"}</div>
                          <p className={`text-xs font-black ${unlocked ? "text-amber-300" : "text-slate-600"}`}>{ach.name}</p>
                          <p className="text-[10px] text-slate-600 mt-0.5">{ach.desc}</p>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Recent Activity */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                  className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 bg-emerald-500/20 rounded-lg"><History className="w-5 h-5 text-emerald-400" /></div>
                    <h3 className="font-black text-white text-lg">Recent Activity</h3>
                  </div>
                  <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                    {stats?.history.length ? stats.history.map((item, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                        className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all group">
                        <div>
                          <p className="font-bold text-white text-sm">{item.metadata?.language || "Unknown"} Analysis</p>
                          <p className="text-xs text-slate-600">{item.metadata?.timestamp ? new Date(item.metadata.timestamp).toLocaleString() : "—"}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-violet-500/20 text-violet-300 text-xs font-black rounded-lg">+10 XP</span>
                          <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-slate-400 transition-colors" />
                        </div>
                      </motion.div>
                    )) : (
                      <div className="py-12 text-center">
                        <BookOpen className="w-10 h-10 mx-auto text-slate-700 mb-3" />
                        <p className="text-slate-600 text-sm">No history yet. Start analyzing!</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Journey tracker */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3 mb-6">
                  <Flame className="w-5 h-5 text-orange-400" />
                  <h3 className="font-black text-white text-lg">Journey to Algorithm Master</h3>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {LEVELS.map((l, i) => {
                    const isReached = analyses >= l.min;
                    const isCurrent = getLevel(analyses).name === l.name;
                    return (
                      <React.Fragment key={l.name}>
                        <div className="flex flex-col items-center gap-2 flex-shrink-0">
                          <motion.div
                            animate={isCurrent ? { scale: [1,1.2,1], boxShadow: ["0 0 0px #7c3aed","0 0 20px #7c3aed","0 0 0px #7c3aed"] } : {}}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-xl border-2 transition-all ${
                              isReached ? `bg-gradient-to-br ${l.color} border-white/20 shadow-lg` : "bg-white/5 border-white/10"
                            }`}>
                            {isReached ? l.emoji : "🔒"}
                          </motion.div>
                          <span className={`text-[10px] font-bold text-center leading-tight ${isReached ? "text-slate-300" : "text-slate-700"}`}>
                            {l.name.split(" ")[0]}
                          </span>
                        </div>
                        {i < LEVELS.length - 1 && (
                          <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <motion.div
                              animate={{ width: analyses >= LEVELS[i+1].min ? "100%" : isCurrent ? `${getProgress(analyses)}%` : "0%" }}
                              transition={{ duration: 1.2 }}
                              className={`h-full rounded-full bg-gradient-to-r ${l.color} relative overflow-hidden`}>
                              <div className="absolute inset-0 bg-white/30 animate-pulse" />
                            </motion.div>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ── CHALLENGES TAB ── */}
          {activeTab === "challenges" && (            <motion.div key="challenges" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-8">

              {/* Hero banner */}
              <motion.div className="relative rounded-3xl p-10 overflow-hidden border border-white/20 shadow-2xl"
                style={{ background: "linear-gradient(135deg,#4c1d95,#1e3a8a,#0f172a)" }}>
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 50%,#7c3aed 0%,transparent 50%),radial-gradient(circle at 80% 50%,#2563eb 0%,transparent 50%)" }} />
                <motion.div className="absolute top-4 right-4 text-6xl opacity-20" animate={{ rotate: [0,10,-10,0], scale: [1,1.1,1] }} transition={{ repeat: Infinity, duration: 4 }}>⚔️</motion.div>
                <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="space-y-3 text-center md:text-left">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-yellow-300" />
                      <span className="text-yellow-300 font-black text-xs uppercase tracking-widest">Daily Challenge</span>
                    </div>
                    <h3 className="text-4xl font-black text-white">Ready for battle?</h3>
                    <p className="text-slate-300 text-lg">
                      AI generates a challenge for <span className={`font-black ${level.text}`}>{level.emoji} {level.name}</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {level.perks.map(p => (
                        <span key={p} className={`text-xs font-bold px-3 py-1 rounded-full ${level.bg} ${level.text} border ${level.border}`}>✓ {p}</span>
                      ))}
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={handleGenerateChallenge}
                    disabled={isGeneratingChallenge || !stats}
                    className="px-8 py-4 bg-white text-indigo-700 font-black rounded-2xl shadow-xl text-lg flex items-center gap-3 disabled:opacity-50 flex-shrink-0">
                    {isGeneratingChallenge
                      ? <><Loader2 className="w-5 h-5 animate-spin" />Generating...</>
                      : <><Trophy className="w-5 h-5" />Generate Challenge</>}
                  </motion.button>
                </div>
              </motion.div>

              {challenge && (
                <motion.div initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="p-8 rounded-3xl bg-white/5 border border-white/10 prose prose-invert max-w-none">
                  <ReactMarkdown>{challenge}</ReactMarkdown>
                </motion.div>
              )}

              {/* All levels preview */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
                {LEVELS.map((l, i) => {
                  const LIcon = l.icon;
                  const unlocked = analyses >= l.min;
                  return (
                    <motion.div key={l.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                      whileHover={unlocked ? { y: -6, scale: 1.03 } : {}}
                      className={`p-5 rounded-2xl border text-center transition-all ${
                        unlocked ? `${l.bg} ${l.border} shadow-lg ${l.glow}` : "bg-white/[0.02] border-white/5 opacity-40"
                      }`}>
                      <div className={`w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center bg-gradient-to-br ${l.color} shadow-lg`}>
                        {unlocked ? <LIcon className="w-6 h-6 text-white" /> : <Lock className="w-5 h-5 text-white/50" />}
                      </div>
                      <div className="text-2xl mb-1">{unlocked ? l.emoji : "🔒"}</div>
                      <p className={`font-black text-sm ${unlocked ? l.text : "text-slate-600"}`}>{l.name}</p>
                      <p className="text-[10px] text-slate-600 mt-1">{l.max === Infinity ? `${l.min}+` : `${l.min}–${l.max}`} analyses</p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {activeTab === "learn" && (
            <motion.div key="learn" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
              <LearnPage />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      <footer className="mt-20 py-8 border-t border-white/5 text-center">
        <p className="text-xs text-slate-700">© 2026 CodeGuru · Built with React, Gemini & Hindsight</p>
      </footer>
      <ChatBot />
    </div>
  );
}
