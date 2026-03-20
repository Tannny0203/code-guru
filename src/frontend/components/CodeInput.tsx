import React, { useState } from "react";
import { Code, Send, Loader2, Sparkles } from "lucide-react";
import { motion } from "motion/react";

interface CodeInputProps {
  onAnalyze: (code: string) => void;
  isLoading: boolean;
}

export const CodeInput: React.FC<CodeInputProps> = ({ onAnalyze, isLoading }) => {
  const [code, setCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) onAnalyze(code);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 bg-white/5">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-rose-500" />
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
        </div>
        <div className="flex items-center gap-2 mx-auto">
          <Code className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-bold text-slate-400">Code Input</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <textarea
          value={code}
          onChange={e => setCode(e.target.value)}
          placeholder="// Paste your code here...\n// Every analysis earns +10 XP 🎮"
          className="w-full h-64 p-4 font-mono text-sm bg-black/30 border border-white/10 rounded-xl text-slate-300 placeholder-slate-700 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 outline-none resize-none transition-all"
          spellCheck={false}
        />
        <motion.button
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          disabled={isLoading || !code.trim()}
          data-analyze-btn
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-black text-white text-base disabled:opacity-50 transition-all shadow-lg shadow-violet-900/50"
          style={{ background: isLoading || !code.trim() ? undefined : "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
          {isLoading
            ? <><Loader2 className="w-5 h-5 animate-spin" />Analyzing...</>
            : <><Send className="w-5 h-5" />Analyze Code &amp; Earn XP <Sparkles className="w-4 h-4 text-yellow-300" /></>}
        </motion.button>
      </form>
    </motion.div>
  );
};
