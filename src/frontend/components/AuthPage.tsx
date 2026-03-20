import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Brain, Mail, Lock, User, Eye, EyeOff, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext.tsx";

export function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        if (!name.trim()) { setError("Please enter your name"); setLoading(false); return; }
        await register(name, email, password);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(m => m === "login" ? "register" : "login");
    setError("");
    setName("");
    setEmail("");
    setPassword("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 font-sans"
      style={{ background: "radial-gradient(ellipse at top,#0f0c29,#1a1040,#0d0d0d)" }}>

      {/* Ambient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-20" style={{ background: "radial-gradient(circle,#7c3aed,transparent 70%)" }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full opacity-15" style={{ background: "radial-gradient(circle,#2563eb,transparent 70%)" }} />
      </div>

      <div className="relative w-full max-w-md">

        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 rounded-2xl shadow-2xl shadow-violet-900" style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-black text-white">CodeMentor AI</h1>
              <p className="text-xs font-bold text-violet-400 uppercase tracking-widest">Powered by Gemini</p>
            </div>
          </div>
          <p className="text-slate-400 text-sm">
            {mode === "login" ? "Welcome back! Ready to level up?" : "Join thousands of developers leveling up their skills"}
          </p>
        </motion.div>

        {/* Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-3xl border border-white/10 p-8 shadow-2xl"
          style={{ background: "rgba(15,12,41,0.9)", backdropFilter: "blur(20px)" }}>

          {/* Tab switcher */}
          <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10 mb-6">
            {(["login", "register"] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-black transition-all ${mode === m ? "text-white shadow-lg" : "text-slate-500 hover:text-slate-300"}`}
                style={mode === m ? { background: "linear-gradient(135deg,#7c3aed,#4f46e5)" } : {}}>
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl mb-4">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <p className="text-rose-300 text-sm">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name (register only) */}
            <AnimatePresence>
              {mode === "register" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input type="text" value={name} onChange={e => setName(e.target.value)}
                      placeholder="Tanmay Patil"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-slate-600 outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-all" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-slate-600 outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-all" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder={mode === "register" ? "At least 6 characters" : "Your password"}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-12 py-3 text-white text-sm placeholder-slate-600 outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-all" />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-black text-white text-base flex items-center justify-center gap-2 disabled:opacity-60 mt-2 shadow-lg shadow-violet-900/40"
              style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
              {loading
                ? <><Loader2 className="w-5 h-5 animate-spin" />Please wait...</>
                : mode === "login"
                  ? <><Sparkles className="w-5 h-5" />Sign In & Level Up</>
                  : <><Sparkles className="w-5 h-5" />Create Account</>
              }
            </motion.button>
          </form>

          {/* Switch mode */}
          <p className="text-center text-sm text-slate-500 mt-5">
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button onClick={switchMode} className="text-violet-400 font-black hover:text-violet-300 transition-colors">
              {mode === "login" ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </motion.div>

        {/* Features */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="flex justify-center gap-6 mt-6">
          {["🌱 5 Levels", "🏆 Achievements", "🤖 AI Mentor"].map(f => (
            <span key={f} className="text-xs text-slate-600 font-semibold">{f}</span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
