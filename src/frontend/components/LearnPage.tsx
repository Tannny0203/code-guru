import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BookOpen, ChevronRight, ChevronLeft, Star, Trophy,
  CheckCircle2, Lock, Zap, X, RotateCcw, Code2, ArrowLeft
} from "lucide-react";
import { COURSES, Course, Lesson } from "../data/curriculum.ts";

// ── Helpers ───────────────────────────────────────────────────────────────────
function getStorageKey(courseId: string) { return `codeguru_progress_${courseId}`; }

function getProgress(courseId: string): number {
  try { return parseInt(localStorage.getItem(getStorageKey(courseId)) || "0"); } catch { return 0; }
}
function setProgress(courseId: string, level: number) {
  try { localStorage.setItem(getStorageKey(courseId), String(level)); } catch {}
}

// ── Code Block ────────────────────────────────────────────────────────────────
function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative group mt-4">
      <pre className="bg-black/50 border border-white/10 rounded-xl p-4 text-xs text-slate-300 overflow-x-auto font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
      <button onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
        className="absolute top-2 right-2 px-2 py-1 text-[10px] font-bold rounded-lg bg-white/10 hover:bg-white/20 text-slate-400 opacity-0 group-hover:opacity-100 transition-all">
        {copied ? "✓ Copied" : "Copy"}
      </button>
    </div>
  );
}

// ── Quiz Component ─────────────────────────────────────────────────────────────
function QuizModal({ questions, onComplete, onClose, course }: {
  questions: { q: string; options: string[]; answer: number; explanation: string }[];
  onComplete: (passed: boolean) => void;
  onClose: () => void;
  course: Course;
}) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [answers, setAnswers] = useState<boolean[]>([]);

  const q = questions[current];

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    const correct = idx === q.answer;
    if (correct) setScore(s => s + 1);
    setAnswers(a => [...a, correct]);
  };

  const handleNext = () => {
    if (current + 1 >= questions.length) {
      setDone(true);
    } else {
      setCurrent(c => c + 1);
      setSelected(null);
      setAnswered(false);
    }
  };

  const passed = score >= Math.ceil(questions.length * 0.6);

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md rounded-3xl border border-white/10 p-8 text-center space-y-5"
          style={{ background: "linear-gradient(135deg,#0f0c29,#1a1040)" }}>
          <div className="text-6xl">{passed ? "🏆" : "😅"}</div>
          <h2 className="text-3xl font-black text-white">{passed ? "Quiz Passed!" : "Try Again"}</h2>
          <p className="text-slate-400">You scored <span className="text-white font-black">{score}/{questions.length}</span></p>
          <div className="flex gap-2 justify-center">
            {answers.map((correct, i) => (
              <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${correct ? "bg-emerald-500" : "bg-rose-500"}`}>
                {correct ? "✓" : "✗"}
              </div>
            ))}
          </div>
          {passed
            ? <p className="text-emerald-400 text-sm font-bold">🎉 Excellent! Keep going to the next section!</p>
            : <p className="text-rose-400 text-sm font-bold">Review the lessons and try again!</p>
          }
          <div className="flex gap-3">
            {!passed && (
              <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                <RotateCcw className="w-4 h-4" />Review
              </button>
            )}
            <button onClick={() => onComplete(passed)}
              className="flex-1 py-3 rounded-xl font-black text-white transition-all"
              style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
              {passed ? "Continue →" : "Retry Quiz"}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg rounded-3xl border border-white/10 overflow-hidden"
        style={{ background: "linear-gradient(135deg,#0f0c29,#1a1040)" }}>
        {/* Header */}
        <div className={`px-6 py-4 bg-gradient-to-r ${course.color} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <Trophy className="w-5 h-5 text-white" />
            <span className="text-white font-black">Quiz Time! {course.emoji}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white/80 text-sm font-bold">{current + 1}/{questions.length}</span>
            <button onClick={onClose} className="text-white/60 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
        </div>
        {/* Progress */}
        <div className="h-1.5 bg-white/10">
          <motion.div animate={{ width: `${((current) / questions.length) * 100}%` }}
            className={`h-full bg-gradient-to-r ${course.color}`} />
        </div>
        <div className="p-6 space-y-5">
          <h3 className="text-white font-black text-lg leading-snug">{q.q}</h3>
          <div className="space-y-3">
            {q.options.map((opt, idx) => {
              let style = "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20";
              if (answered) {
                if (idx === q.answer) style = "bg-emerald-500/20 border-emerald-500/50 text-emerald-300";
                else if (idx === selected) style = "bg-rose-500/20 border-rose-500/50 text-rose-300";
                else style = "bg-white/5 border-white/5 text-slate-600 opacity-50";
              }
              return (
                <button key={idx} onClick={() => handleSelect(idx)}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${style}`}>
                  <span className="font-black mr-2 opacity-60">{String.fromCharCode(65 + idx)}.</span>{opt}
                </button>
              );
            })}
          </div>
          {answered && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`p-3 rounded-xl text-sm ${selected === q.answer ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300" : "bg-rose-500/10 border border-rose-500/20 text-rose-300"}`}>
              <span className="font-black">{selected === q.answer ? "✓ Correct! " : "✗ Incorrect. "}</span>
              {q.explanation}
            </motion.div>
          )}
          {answered && (
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={handleNext}
              className="w-full py-3 rounded-xl font-black text-white flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
              {current + 1 >= questions.length ? "See Results" : "Next Question"}
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Lesson View ────────────────────────────────────────────────────────────────
function LessonView({ lesson, course, onComplete, onBack, isCompleted }: {
  lesson: Lesson; course: Course; onComplete: () => void; onBack: () => void; isCompleted: boolean;
}) {
  const [showXP, setShowXP] = useState(false);

  const handleComplete = () => {
    if (!isCompleted) {
      setShowXP(true);
      setTimeout(() => { setShowXP(false); onComplete(); }, 1500);
    } else {
      onComplete();
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
      className="space-y-6">
      {/* Back button */}
      <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-semibold">
        <ArrowLeft className="w-4 h-4" />Back to lessons
      </button>

      {/* Header */}
      <div className={`p-6 rounded-2xl bg-gradient-to-br ${course.color} border border-white/10`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/70 text-xs font-bold uppercase tracking-widest">Lesson {lesson.id} of 20</span>
          <span className="text-white/70 text-xs font-bold">+{lesson.xp} XP</span>
        </div>
        <h2 className="text-2xl font-black text-white">{lesson.title}</h2>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-2xl">{course.emoji}</span>
          <span className="text-white/80 font-semibold">{course.name} Programming</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
        <p className="text-slate-300 leading-relaxed text-sm">{lesson.content}</p>
        {lesson.code && <CodeBlock code={lesson.code} />}
        {lesson.tip && (
          <div className="flex gap-3 p-4 bg-violet-500/10 border border-violet-500/20 rounded-xl">
            <span className="text-xl">💡</span>
            <div>
              <p className="text-violet-300 font-black text-xs uppercase tracking-wider mb-1">Pro Tip</p>
              <p className="text-slate-400 text-sm">{lesson.tip}</p>
            </div>
          </div>
        )}
      </div>

      {/* Complete button */}
      <AnimatePresence>
        {showXP && (
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl"
            style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
            <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
            <span className="font-black text-white text-lg">+{lesson.xp} XP Earned!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleComplete}
        className="w-full py-4 rounded-2xl font-black text-white text-lg flex items-center justify-center gap-3 shadow-xl"
        style={{ background: isCompleted ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
        {isCompleted ? <><CheckCircle2 className="w-5 h-5 text-emerald-400" />Completed — Next Lesson</> : <><Zap className="w-5 h-5 text-yellow-300" />Complete & Earn {lesson.xp} XP</>}
        <ChevronRight className="w-5 h-5" />
      </motion.button>
    </motion.div>
  );
}

// ── Course View ────────────────────────────────────────────────────────────────
function CourseView({ course, onBack }: { course: Course; onBack: () => void }) {
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem(`codeguru_lessons_${course.id}`);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [showQuiz, setShowQuiz] = useState<{ afterLevel: number; questions: any[] } | null>(null);
  const [totalXP, setTotalXP] = useState(0);
  const [quizzesPassed, setQuizzesPassed] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem(`codeguru_quizzes_${course.id}`);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  useEffect(() => {
    let xp = 0;
    completedLessons.forEach(id => {
      const l = course.lessons.find(l => l.id === id);
      if (l) xp += l.xp;
    });
    setTotalXP(xp);
  }, [completedLessons]);

  const saveCompleted = (newSet: Set<number>) => {
    try { localStorage.setItem(`codeguru_lessons_${course.id}`, JSON.stringify([...newSet])); } catch {}
  };

  const saveQuizzes = (newSet: Set<number>) => {
    try { localStorage.setItem(`codeguru_quizzes_${course.id}`, JSON.stringify([...newSet])); } catch {}
  };

  const handleLessonComplete = (lesson: Lesson) => {
    const newCompleted = new Set(completedLessons);
    newCompleted.add(lesson.id);
    setCompletedLessons(newCompleted);
    saveCompleted(newCompleted);

    // Check if quiz should trigger
    const quiz = course.quizzes.find(q => q.afterLevel === lesson.id && !quizzesPassed.has(q.afterLevel));
    if (quiz) {
      setActiveLesson(null);
      setShowQuiz(quiz);
      return;
    }

    // Move to next lesson
    const nextLesson = course.lessons.find(l => l.id === lesson.id + 1);
    if (nextLesson) setActiveLesson(nextLesson);
    else setActiveLesson(null);
  };

  const handleQuizComplete = (passed: boolean, afterLevel: number) => {
    if (passed) {
      const newQuizzes = new Set(quizzesPassed);
      newQuizzes.add(afterLevel);
      setQuizzesPassed(newQuizzes);
      saveQuizzes(newQuizzes);
      setShowQuiz(null);
      // Move to next lesson after quiz
      const nextLesson = course.lessons.find(l => l.id === afterLevel + 1);
      if (nextLesson) setActiveLesson(nextLesson);
    } else {
      setShowQuiz(null);
    }
  };

  const isLessonUnlocked = (lesson: Lesson) => {
    if (lesson.id === 1) return true;
    // Check if prev lesson done AND quiz (if any at prev level) passed
    const prevDone = completedLessons.has(lesson.id - 1);
    const quizAtPrev = course.quizzes.find(q => q.afterLevel === lesson.id - 1);
    if (quizAtPrev && !quizzesPassed.has(quizAtPrev.afterLevel)) return false;
    return prevDone;
  };

  const progressPct = Math.round((completedLessons.size / course.lessons.length) * 100);

  if (activeLesson) {
    return (
      <>
        <LessonView lesson={activeLesson} course={course}
          isCompleted={completedLessons.has(activeLesson.id)}
          onComplete={() => handleLessonComplete(activeLesson)}
          onBack={() => setActiveLesson(null)} />
        {showQuiz && (
          <QuizModal questions={showQuiz.questions} course={course}
            onClose={() => setShowQuiz(null)}
            onComplete={(passed) => handleQuizComplete(passed, showQuiz.afterLevel)} />
        )}
      </>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-semibold">
        <ArrowLeft className="w-4 h-4" />All Courses
      </button>

      {/* Header */}
      <div className={`p-8 rounded-3xl bg-gradient-to-br ${course.color} border border-white/10 relative overflow-hidden`}>
        <div className="absolute top-4 right-4 text-6xl opacity-20">{course.emoji}</div>
        <div className="relative">
          <div className="text-5xl mb-3">{course.emoji}</div>
          <h2 className="text-3xl font-black text-white">{course.name} Programming</h2>
          <p className="text-white/70 mt-1">{course.description}</p>
          <div className="flex items-center gap-4 mt-4">
            <span className="text-white font-black">{completedLessons.size}/{course.lessons.length} lessons</span>
            <span className="text-white/60">·</span>
            <span className="text-yellow-300 font-black">{totalXP} XP earned</span>
            <span className="text-white/60">·</span>
            <span className="text-white/80">{progressPct}% complete</span>
          </div>
          <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div animate={{ width: `${progressPct}%` }} transition={{ duration: 1 }}
              className="h-full bg-white rounded-full" />
          </div>
        </div>
      </div>

      {/* Lessons grid */}
      <div className="space-y-2">
        {course.lessons.map((lesson, idx) => {
          const unlocked = isLessonUnlocked(lesson);
          const completed = completedLessons.has(lesson.id);
          const isQuizAfterThis = course.quizzes.find(q => q.afterLevel === lesson.id);
          const quizPassed = isQuizAfterThis ? quizzesPassed.has(lesson.id) : null;

          return (
            <div key={lesson.id}>
              <motion.button
                whileHover={unlocked ? { x: 4 } : {}}
                onClick={() => unlocked && setActiveLesson(lesson)}
                disabled={!unlocked}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ${
                  completed ? `${course.bg} ${course.border}` :
                  unlocked ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20" :
                  "bg-white/[0.02] border-white/5 opacity-40 cursor-not-allowed"
                }`}>
                {/* Level number/icon */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-black ${
                  completed ? `bg-gradient-to-br ${course.color} text-white shadow-lg` :
                  unlocked ? "bg-white/10 text-slate-400" : "bg-white/5 text-slate-700"
                }`}>
                  {completed ? <CheckCircle2 className="w-6 h-6" /> : unlocked ? lesson.id : <Lock className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-black ${completed ? "text-white" : unlocked ? "text-slate-200" : "text-slate-600"}`}>
                    {lesson.title}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5 truncate">{lesson.content.slice(0, 60)}...</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs font-black ${completed ? course.text : "text-slate-600"}`}>+{lesson.xp} XP</span>
                  {unlocked && !completed && <ChevronRight className="w-4 h-4 text-slate-600" />}
                </div>
              </motion.button>

              {/* Quiz badge after every 5 lessons */}
              {isQuizAfterThis && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className={`mx-4 my-1 p-3 rounded-xl border flex items-center gap-3 ${
                    quizPassed ? "bg-emerald-500/10 border-emerald-500/30" :
                    completed ? "bg-amber-500/10 border-amber-500/30" : "bg-white/5 border-white/10 opacity-50"
                  }`}>
                  <div className="text-xl">{quizPassed ? "✅" : completed ? "📝" : "🔒"}</div>
                  <div className="flex-1">
                    <p className={`text-xs font-black ${quizPassed ? "text-emerald-400" : completed ? "text-amber-400" : "text-slate-600"}`}>
                      {quizPassed ? "Quiz Passed! ✓" : completed ? "Quiz Unlocked — Test Your Knowledge!" : "Complete lesson to unlock quiz"}
                    </p>
                    <p className="text-[10px] text-slate-600">5 questions · Earn bonus XP</p>
                  </div>
                  {completed && !quizPassed && (
                    <button onClick={() => setShowQuiz(isQuizAfterThis)}
                      className="px-3 py-1.5 rounded-lg text-xs font-black text-white"
                      style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}>
                      Take Quiz
                    </button>
                  )}
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quiz modals */}
      {showQuiz && (
        <QuizModal questions={showQuiz.questions} course={course}
          onClose={() => setShowQuiz(null)}
          onComplete={(passed) => handleQuizComplete(passed, showQuiz.afterLevel)} />
      )}
    </motion.div>
  );
}

// ── Main Learn Page ────────────────────────────────────────────────────────────
export function LearnPage() {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const getTotalXP = (course: Course) => {
    try {
      const saved = localStorage.getItem(`codeguru_lessons_${course.id}`);
      const completed: number[] = saved ? JSON.parse(saved) : [];
      return completed.reduce((sum, id) => {
        const l = course.lessons.find(l => l.id === id);
        return sum + (l?.xp || 0);
      }, 0);
    } catch { return 0; }
  };

  const getCompletedCount = (course: Course) => {
    try {
      const saved = localStorage.getItem(`codeguru_lessons_${course.id}`);
      return saved ? JSON.parse(saved).length : 0;
    } catch { return 0; }
  };

  if (selectedCourse) {
    return <CourseView course={selectedCourse} onBack={() => setSelectedCourse(null)} />;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      {/* Hero */}
      <div className="text-center space-y-3">
        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold border border-violet-500/30 bg-violet-500/10 text-violet-300">
          <BookOpen className="w-4 h-4" />Interactive Learning
        </motion.div>
        <h2 className="text-4xl md:text-5xl font-black text-white">Learn. Code. <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400">Level Up.</span></h2>
        <p className="text-slate-400 max-w-xl mx-auto">Master Python, C, and Java from basics to advanced with interactive lessons and quizzes every 5 levels.</p>
      </div>

      {/* Stats bar */}
      <div className="flex justify-center gap-8">
        {[
          { label: "Courses", value: "3" },
          { label: "Total Lessons", value: "60" },
          { label: "Quizzes", value: "12" },
          { label: "Max XP", value: "1,320" },
        ].map(s => (
          <div key={s.label} className="text-center">
            <p className="text-2xl font-black text-white">{s.value}</p>
            <p className="text-xs text-slate-500 font-semibold">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Course cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {COURSES.map((course, i) => {
          const completed = getCompletedCount(course);
          const xp = getTotalXP(course);
          const pct = Math.round((completed / course.lessons.length) * 100);

          return (
            <motion.button key={course.id}
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              whileHover={{ y: -6, scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedCourse(course)}
              className={`text-left p-6 rounded-3xl border ${course.bg} ${course.border} shadow-xl transition-all group`}>
              {/* Emoji & name */}
              <div className="flex items-start justify-between mb-4">
                <div className={`text-5xl`}>{course.emoji}</div>
                <div className={`px-2.5 py-1 rounded-full text-[10px] font-black ${course.bg} ${course.text} border ${course.border}`}>
                  {pct}% done
                </div>
              </div>
              <h3 className="text-xl font-black text-white mb-1">{course.name}</h3>
              <p className="text-slate-500 text-sm mb-4 leading-relaxed">{course.description}</p>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>{completed}/{course.lessons.length} lessons</span>
                  <span className={`font-bold ${course.text}`}>{xp} XP</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 1 }}
                    className={`h-full rounded-full bg-gradient-to-r ${course.color}`} />
                </div>
              </div>

              {/* Lessons & quizzes info */}
              <div className="flex gap-3 text-xs text-slate-600 mb-4">
                <span>📚 20 Lessons</span>
                <span>📝 4 Quizzes</span>
                <span>⭐ Up to 430 XP</span>
              </div>

              <div className={`w-full py-3 rounded-xl font-black text-sm text-center bg-gradient-to-r ${course.color} text-white group-hover:opacity-90 transition-all`}>
                {completed === 0 ? "Start Learning →" : completed === course.lessons.length ? "✓ Completed!" : "Continue →"}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* How it works */}
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
        <h3 className="font-black text-white mb-4 flex items-center gap-2"><Star className="w-5 h-5 text-yellow-400" />How It Works</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: "📖", title: "Read", desc: "Learn concepts with clear explanations" },
            { icon: "💻", title: "Code", desc: "See real code examples for every topic" },
            { icon: "✅", title: "Complete", desc: "Finish lessons to earn XP and unlock next" },
            { icon: "📝", title: "Quiz", desc: "Test yourself after every 5 lessons" },
          ].map(s => (
            <div key={s.title} className="text-center space-y-2">
              <div className="text-3xl">{s.icon}</div>
              <p className="font-black text-white text-sm">{s.title}</p>
              <p className="text-xs text-slate-600">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
