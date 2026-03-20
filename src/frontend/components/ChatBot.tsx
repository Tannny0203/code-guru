import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageCircle, X, Send, Loader2, Bot, User, Trash2, Copy, Check, Code2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100">
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
    </button>
  );
}

const SUGGESTIONS = [
  "How do I fix a null pointer exception?",
  "What's the difference between == and ===?",
  "Explain async/await in JavaScript",
  "How do I reverse a string in Python?",
];

export function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", content: "Hey! 👋 I'm **CodeBot**, your AI coding assistant.\n\nAsk me anything — bugs, concepts, code reviews, or best practices. I'm here to help you level up! 🚀", timestamp: new Date() }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) { setUnread(0); setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100); }
  }, [open, messages]);

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput("");

    const userMsg: Message = { id: Date.now().toString(), role: "user", content, timestamp: new Date() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("codementor_token") || ""}`,
        },
        body: JSON.stringify({ messages: updated.map(m => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
      const botMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: data.reply ?? "Sorry, something went wrong.", timestamp: new Date() };
      setMessages(m => [...m, botMsg]);
      if (!open) setUnread(u => u + 1);
    } catch {
      setMessages(m => [...m, { id: (Date.now() + 1).toString(), role: "assistant", content: "❌ Failed to connect. Check your server is running.", timestamp: new Date() }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const clearChat = () => setMessages([{ id: "welcome", role: "assistant", content: "Chat cleared! 🧹 What can I help you with?", timestamp: new Date() }]);

  return (
    <>
      {/* Floating button */}
      <motion.button
        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center"
        style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
      >
        <AnimatePresence mode="wait">
          {open
            ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><X className="w-6 h-6 text-white" /></motion.div>
            : <motion.div key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} className="relative">
                <MessageCircle className="w-6 h-6 text-white" />
                {unread > 0 && <span className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">{unread}</span>}
              </motion.div>
          }
        </AnimatePresence>
      </motion.button>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20, originX: 1, originY: 1 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden"
            style={{ height: "520px", background: "linear-gradient(160deg,#0f0c29,#1a1040)" }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 flex-shrink-0" style={{ background: "rgba(124,58,237,0.15)" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white font-black text-sm">CodeBot</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <p className="text-emerald-400 text-[10px] font-bold">Online · AI Coding Assistant</p>
                </div>
              </div>
              <button onClick={clearChat} className="p-1.5 rounded-lg hover:bg-white/10 transition-all text-slate-500 hover:text-slate-300">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
              {messages.map((msg) => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  {/* Avatar */}
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${msg.role === "user" ? "bg-violet-600" : "bg-indigo-700"}`}>
                    {msg.role === "user" ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                  </div>
                  {/* Bubble */}
                  <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm ${msg.role === "user" ? "rounded-tr-sm bg-violet-600/40 border border-violet-500/30 text-white" : "rounded-tl-sm bg-white/5 border border-white/10 text-slate-300"}`}>
                    <div className={`prose prose-sm max-w-none
                      [&_pre]:relative [&_pre]:group [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-black/40 [&_pre]:border [&_pre]:border-white/10 [&_pre]:p-3 [&_pre]:my-2 [&_pre]:text-xs
                      [&_code]:text-violet-300 [&_code]:bg-violet-500/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs
                      [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-slate-300
                      [&_p]:text-slate-300 [&_p]:my-1 [&_li]:text-slate-300 [&_strong]:text-white [&_h1]:text-white [&_h2]:text-white [&_h3]:text-slate-200
                      [&_ul]:my-1 [&_ol]:my-1 [&_ul]:space-y-0.5 [&_ol]:space-y-0.5
                    `}>
                      <ReactMarkdown
                        components={{
                          pre({ children, ...props }) {
                            const codeText = (children as any)?.props?.children ?? "";
                            return (
                              <div className="relative group">
                                <pre {...props} className="overflow-x-auto rounded-xl bg-black/40 border border-white/10 p-3 my-2 text-xs">{children}</pre>
                                <CopyBtn text={typeof codeText === "string" ? codeText : ""} />
                              </div>
                            );
                          },
                          code({ children, className, ...props }) {
                            return !className
                              ? <code className="text-violet-300 bg-violet-500/10 px-1 py-0.5 rounded text-xs" {...props}>{children}</code>
                              : <code className="text-slate-300 text-xs" {...props}>{children}</code>;
                          },
                        }}
                      >{msg.content}</ReactMarkdown>
                    </div>
                    <p className="text-[10px] text-slate-600 mt-1.5 text-right">
                      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-700 flex items-center justify-center flex-shrink-0"><Bot className="w-4 h-4 text-white" /></div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1 items-center h-4">
                      {[0,1,2].map(i => <motion.div key={i} animate={{ y: [0,-4,0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }} className="w-1.5 h-1.5 bg-violet-400 rounded-full" />)}
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Suggestions (only when 1 message) */}
            {messages.length === 1 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5 flex-shrink-0">
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => sendMessage(s)}
                    className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 hover:bg-violet-500/20 transition-all flex items-center gap-1">
                    <Code2 className="w-3 h-3" />{s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="px-4 pb-4 pt-2 flex-shrink-0 border-t border-white/10">
              <div className="flex gap-2 items-end">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask me anything about code..."
                  rows={1}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-300 placeholder-slate-600 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 resize-none transition-all"
                  style={{ maxHeight: "100px" }}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  className="w-10 h-10 rounded-xl flex items-center justify-center disabled:opacity-40 transition-all flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
                >
                  {loading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
                </motion.button>
              </div>
              <p className="text-[10px] text-slate-700 mt-1.5 text-center">Enter to send · Shift+Enter for new line</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
