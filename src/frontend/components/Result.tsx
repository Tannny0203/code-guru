import React, { useState } from "react";
import { CheckCircle, AlertTriangle, Lightbulb, History, Target, Zap, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";

interface ResultProps {
  feedback: string;
  memories: string[];
  weakAreas: string[];
}

// Copy button for code blocks
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-slate-400 hover:text-white">
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

// Collapsible memory item — truncates long past mistakes
function MemoryItem({ content, index }: { content: string; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = content.length > 120;
  const display = expanded ? content : content.slice(0, 120) + (isLong ? "..." : "");
  return (
    <motion.li
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg"
    >
      <div className="flex gap-2">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-400 break-words leading-relaxed">{display}</p>
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 mt-1.5 text-[10px] font-bold text-amber-400 hover:text-amber-300 transition-colors"
            >
              {expanded ? <><ChevronUp className="w-3 h-3" />Show less</> : <><ChevronDown className="w-3 h-3" />Show more</>}
            </button>
          )}
        </div>
      </div>
    </motion.li>
  );
}

export const Result: React.FC<ResultProps> = ({ feedback, memories, weakAreas }) => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-4">

      {/* XP Badge */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400 }}
        className="flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/30 rounded-xl w-fit"
      >
        <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300" />
        <span className="text-sm font-black text-violet-300">+10 XP Earned!</span>
      </motion.div>

      {/* Feedback */}
      <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          </div>
          <h2 className="text-lg font-black text-white">Mentor Feedback</h2>
        </div>

        {/* Markdown with fixed overflow for code blocks */}
        <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed
          [&_pre]:relative
          [&_pre]:overflow-x-auto
          [&_pre]:rounded-xl
          [&_pre]:bg-black/40
          [&_pre]:border
          [&_pre]:border-white/10
          [&_pre]:p-4
          [&_pre]:my-3
          [&_pre]:text-xs
          [&_code]:break-words
          [&_code]:text-violet-300
          [&_code]:bg-violet-500/10
          [&_code]:px-1.5
          [&_code]:py-0.5
          [&_code]:rounded
          [&_code]:text-xs
          [&_pre_code]:bg-transparent
          [&_pre_code]:p-0
          [&_pre_code]:text-slate-300
          [&_pre_code]:break-normal
          [&_p]:break-words
          [&_li]:break-words
          [&_h1]:text-white
          [&_h2]:text-white
          [&_h3]:text-slate-200
          [&_strong]:text-white
          [&_ul]:space-y-1
          [&_ol]:space-y-1
        ">
          <ReactMarkdown
            components={{
              pre({ children, ...props }) {
                const codeText = (children as any)?.props?.children ?? "";
                return (
                  <div className="relative group">
                    <pre {...props} className="overflow-x-auto rounded-xl bg-black/40 border border-white/10 p-4 my-3 text-xs">
                      {children}
                    </pre>
                    <CopyButton text={typeof codeText === "string" ? codeText : ""} />
                  </div>
                );
              },
              code({ children, className, ...props }) {
                const isInline = !className;
                return isInline
                  ? <code className="text-violet-300 bg-violet-500/10 px-1.5 py-0.5 rounded text-xs break-words" {...props}>{children}</code>
                  : <code className="text-slate-300 text-xs" {...props}>{children}</code>;
              },
            }}
          >
            {feedback}
          </ReactMarkdown>
        </div>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Past Mistakes — fixed overflow */}
        <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <History className="w-4 h-4 text-amber-400" />
            </div>
            <h3 className="font-black text-white">Past Mistakes</h3>
            {memories.length > 0 && (
              <span className="ml-auto text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                {memories.length} found
              </span>
            )}
          </div>
          <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {memories.length > 0
              ? memories.map((m, i) => <MemoryItem key={i} content={m} index={i} />)
              : <p className="text-xs text-slate-600 italic">No past mistakes yet — keep analyzing!</p>
            }
          </ul>
        </div>

        {/* Weak Areas */}
        <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-rose-500/20 rounded-lg">
              <Target className="w-4 h-4 text-rose-400" />
            </div>
            <h3 className="font-black text-white">Weak Areas</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {weakAreas.map((area, i) => (
              <motion.span
                key={i}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.1, type: "spring" }}
                className="px-3 py-1 bg-rose-500/20 text-rose-300 text-xs font-black rounded-full border border-rose-500/30"
              >
                {area}
              </motion.span>
            ))}
          </div>
          <div className="mt-4 p-3 bg-violet-500/10 rounded-xl border border-violet-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Lightbulb className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-xs font-black text-violet-300">Mentor Tip</span>
            </div>
            <p className="text-xs text-slate-500 break-words">
              Focus on <span className="text-violet-300 font-bold">{weakAreas[0]?.toLowerCase() || "coding"}</span> to level up faster.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
