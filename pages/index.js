import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Head from "next/head";
import Image from "next/image";
import { Analytics } from "@vercel/analytics/react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Loader2, Check, Info, Timer, Target, Award, Trophy,
  Flame, Star, ShieldCheck, Zap, XCircle, Lock, MousePointer2,
  Share2, ArrowLeft, ArrowRight, TrendingUp, AlertCircle, RefreshCw
} from "lucide-react";

/* ----------------------------- Utility Components ---------------------------- */

const Glass = ({ children, className = "" }) => (
  <div className={["rounded-3xl border border-white/60 bg-white/60 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.04)]", className].join(" ")}>{children}</div>
);

const Pill = ({ children, className = "" }) => (
  <span className={["inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.20em]", className].join(" ")}>{children}</span>
);

const IconButton = ({ onClick, ariaLabel, children, className = "" }) => (
  <button
    onClick={onClick}
    aria-label={ariaLabel}
    className={[
      "h-10 w-10 rounded-2xl",
      "bg-white/60 border border-black/5 backdrop-blur shadow-sm hover:bg-white/90 active:scale-95 transition-all flex items-center justify-center",
      className
    ].join(" ")}
  >
    {children}
  </button>
);

const ProgressBar = ({ label, value, color, total }) => (
  <div className="w-full">
    <div className="flex justify-between mb-1">
      <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{label}</span>
      <span className="text-[9px] font-black text-gray-600">{Math.round((value / (total || 1)) * 100)}%</span>
    </div>
    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${(value / (total || 1)) * 100}%` }}
        className={`h-full ${color}`}
      />
    </div>
  </div>
);

const Toast = ({ message, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: -20, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -20, scale: 0.9 }}
    className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-black/80 backdrop-blur text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 pointer-events-none"
  >
    <span className="text-xs font-bold tracking-widest uppercase">{message}</span>
  </motion.div>
);

// MOVED UP: LoadingScreen to prevent ReferenceError
function LoadingScreen({ message }) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F5F5F7] gap-4">
      <Loader2 className="animate-spin text-blue-600" size={40} />
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">{message}</p>
    </div>
  );
}

// MOVED UP: Modal to prevent ReferenceError
function Modal({ children, onClose }) {
  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = 'unset'; } }, []);
  return (
    <div className="fixed inset-0 z-[50] bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center p-4 md:p-6" onClick={onClose}>
      <motion.div
        initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
        className="w-full max-w-md max-h-[85vh] overflow-y-auto bg-white rounded-[2rem] shadow-2xl p-6 md:p-8"
        onClick={e => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </div>
  );
}

/* -------------------------------- Logic & Data ------------------------------ */

const TROPHY_KEY = "partyTrophies_v3";
const INTRO_KEY = "partyHasSeenIntro_v2";

const TROPHIES = [
  { id: "first_correct", title: "First Blood", desc: "First correct guess.", icon: <Star size={18} />, tier: "bronze", check: ({ stats }) => (stats.correct || 0) >= 1 },
  { id: "streak_5", title: "Warm Streak", desc: "Best streak ≥ 5.", icon: <Flame size={18} />, tier: "bronze", check: ({ stats }) => (stats.bestStreak || 0) >= 5 },
  { id: "streak_10", title: "Campaign Staff", desc: "Best streak ≥ 10.", icon: <Award size={18} />, tier: "silver", check: ({ stats }) => (stats.bestStreak || 0) >= 10 },
  { id: "streak_25", title: "Party Operator", desc: "Best streak ≥ 25.", icon: <ShieldCheck size={18} />, tier: "gold", check: ({ stats }) => (stats.bestStreak || 0) >= 25 },
  { id: "streak_50", title: "Floor Leader", desc: "Best streak ≥ 50.", icon: <Trophy size={18} />, tier: "platinum", check: ({ stats }) => (stats.bestStreak || 0) >= 50 },
  { id: "seen_50", title: "Caucus Regular", desc: "Seen ≥ 50.", icon: <Target size={18} />, tier: "bronze", check: ({ stats }) => (stats.total || 0) >= 50 },
  { id: "seen_200", title: "Capitol Fixture", desc: "Seen ≥ 200.", icon: <Trophy size={18} />, tier: "gold", check: ({ stats }) => (stats.total || 0) >= 200 },
  { id: "accuracy_80_50", title: "Solid Read", desc: "≥80% accuracy with ≥50 seen.", icon: <Award size={18} />, tier: "silver", check: ({ stats }) => { const t = stats.total || 0; return t >= 50 && (stats.correct / t) >= 0.8; } },
  { id: "speed_fast", title: "Fast Reflexes", desc: "Answer correctly in <1s.", icon: <Zap size={18} />, tier: "gold", check: ({ lastResult }) => lastResult?.isFast && lastResult?.isCorrect },
];

function tierStyles(tier) {
  switch (tier) {
    case "bronze": return "bg-amber-100 text-amber-900 border-amber-200";
    case "silver": return "bg-slate-100 text-slate-900 border-slate-200";
    case "gold": return "bg-yellow-100 text-yellow-900 border-yellow-200";
    case "platinum": return "bg-indigo-100 text-indigo-900 border-indigo-200";
    default: return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function formatOffice(p, revealed) {
  const c = (p?.category ?? "").toString().trim().toLowerCase();
  let base = "Public Official";
  if (c === "house") base = "Representative";
  if (c === "senate") base = "Senator";
  if (c === "gov") base = "Governor";

  // Only show state context if revealed to prevent geography bias during guess
  if (revealed && p?.description) {
     const match = p.description.match(/\b([A-Z]{2})\b/) || p.description.match(/from\s([A-Za-z\s]+)/);
     if(match) return `${base} • ${match[1] || match[0].replace('from ', '')}`;
  }
  return base;
}

/* ----------------------------- Main Application -------------------------- */

export default function Home() {
  const [allPoliticians, setAllPoliticians] = useState([]);
  const [current, setCurrent] = useState(null);
  const [loadingQueue, setLoadingQueue] = useState([]);
  const [hasMounted, setHasMounted] = useState(false);
  const containerRef = useRef(null);

  // Logic Refs
  const recentIds = useRef(new Set()); // Buffer to prevent repeats
  const startTimeRef = useRef(null); // Ref for timer to prevent stale state issues

  // UX State
  const [toast, setToast] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showWrapped, setShowWrapped] = useState(false);
  const [showTrophyCase, setShowTrophyCase] = useState(false);

  // Game State
  const [gameState, setGameState] = useState("guessing"); // guessing | revealed
  const [imgLoading, setImgLoading] = useState(true);
  const [lastResult, setLastResult] = useState(null);

  // Stats State
  const [stats, setStats] = useState({
    correct: 0,
    total: 0,
    streak: 0,
    bestStreak: 0,
    demGuesses: 0,
    repGuesses: 0,
    demCorrect: 0,
    repCorrect: 0,
    // Confusion Matrix:
    guessedDemActualRep: 0, // Confused by Republicans
    guessedRepActualDem: 0, // Confused by Democrats
    responseTimes: [], // Array of times for median calc
  });

  const [trophies, setTrophies] = useState({ unlocked: [], firstUnlockedAt: {} });

  // Motion
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const swipeBg = useTransform(x, [-150, 0, 150], ["rgba(0,174,243,0.15)", "rgba(255,255,255,0)", "rgba(232,27,35,0.15)"]);
  // Stamps only visible during drag
  const demStampOpacity = useTransform(x, [0, -60], [0, 1]);
  const repStampOpacity = useTransform(x, [0, 60], [0, 1]);

  // Derived Metrics
  const unlockedCount = trophies.unlocked?.length || 0;
  const unlockedSet = useMemo(() => new Set(trophies.unlocked || []), [trophies.unlocked]);
  const accuracy = useMemo(() => (stats.total === 0 ? 0 : Math.round((stats.correct / stats.total) * 100)), [stats]);

  const medianSpeed = useMemo(() => {
    if (stats.responseTimes.length === 0) return 0;
    const sorted = [...stats.responseTimes].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return (sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2 / 1000).toFixed(1);
  }, [stats.responseTimes]);

  const rank = useMemo(() => {
    const s = stats.bestStreak || 0;
    if (s >= 50) return { title: "Speaker of the House", color: "text-indigo-600" };
    if (s >= 30) return { title: "Party Whip", color: "text-red-600" };
    if (s >= 20) return { title: "Senior Senator", color: "text-blue-600" };
    if (s >= 10) return { title: "Campaign Manager", color: "text-emerald-600" };
    if (s >= 5) return { title: "Staffer", color: "text-amber-700" };
    return { title: "Political Intern", color: "text-gray-600" };
  }, [stats.bestStreak]);

  const revealed = gameState === "revealed";

  // Background Color Logic
  const bgColor = useMemo(() => {
    if (revealed && lastResult) {
      if (lastResult.correctParty === "Democrat") return "bg-blue-50/40";
      if (lastResult.correctParty === "Republican") return "bg-red-50/40";
    }
    return "bg-[#F5F5F7]";
  }, [revealed, lastResult]);

  // --- Initialization ---
  useEffect(() => {
    setHasMounted(true);
    // Load Stats
    const savedStats = localStorage.getItem("partyStats_v3");
    if (savedStats) try { setStats(prev => ({ ...prev, ...JSON.parse(savedStats) })); } catch {}
    // Load Trophies
    const savedTrophies = localStorage.getItem(TROPHY_KEY);
    if (savedTrophies) try { setTrophies(prev => ({ ...prev, ...JSON.parse(savedTrophies) })); } catch {}
    // Check Intro
    const hasSeenIntro = localStorage.getItem(INTRO_KEY);
    if (!hasSeenIntro) setShowInfo(true);

    // Fetch Data
    fetch("/politicians.json").then(res => res.json()).then(data => {
      const normalized = (data || []).map(p => ({ ...p, imageUrl: p.img || p.image_url, id: p.name + p.party })); // Simple ID gen
      setAllPoliticians(normalized);

      // Shuffle & Init
      const shuffled = [...normalized].sort(() => 0.5 - Math.random());
      setCurrent(shuffled[0]);
      recentIds.current.add(shuffled[0].id);
      setLoadingQueue(shuffled.slice(1, 6));

      startTimeRef.current = Date.now();
    });

    if (containerRef.current) containerRef.current.focus();
  }, []);

  // Persistence
  useEffect(() => { if (hasMounted) localStorage.setItem("partyStats_v3", JSON.stringify(stats)); }, [stats, hasMounted]);
  useEffect(() => { if (hasMounted) localStorage.setItem(TROPHY_KEY, JSON.stringify(trophies)); }, [trophies, hasMounted]);

  // --- Game Logic ---

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const advanceToNext = useCallback(() => {
    if (allPoliticians.length === 0) return;

    setLoadingQueue(prev => {
      // Get next card from queue
      const nextCard = prev[0];

      // Refill queue with a non-duplicate
      let pool = allPoliticians;
      let candidate = pool[Math.floor(Math.random() * pool.length)];
      let attempts = 0;

      // Attempt to find a card not in recent history
      while (recentIds.current.has(candidate.id) && attempts < 20) {
        candidate = pool[Math.floor(Math.random() * pool.length)];
        attempts++;
      }

      // Update History Buffer (Keep last 50)
      recentIds.current.add(candidate.id);
      if (recentIds.current.size > 50) {
        const first = recentIds.current.values().next().value;
        recentIds.current.delete(first);
      }

      setCurrent(nextCard);
      return [...prev.slice(1), candidate].filter(Boolean);
    });

    setGameState("guessing");
    setImgLoading(true);
    startTimeRef.current = Date.now();
    setLastResult(null);
    x.set(0);
  }, [allPoliticians, x]);

  const handleGuess = useCallback((guessedParty) => {
    if (gameState !== "guessing" || !current) return;

    const actualParty = current.party;
    const isCorrect = guessedParty === actualParty;
    const now = Date.now();
    const timeTaken = now - (startTimeRef.current || now);

    // Valid time check (ignore idle times > 10s)
    const validTime = timeTaken < 10000 ? timeTaken : null;
    const isFast = validTime && validTime < 1000;

    const newStreak = isCorrect ? stats.streak + 1 : 0;

    // Haptics & Confetti
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (isCorrect) navigator.vibrate(10);
      else navigator.vibrate([30, 50, 30]);
    }
    if (isCorrect && newStreak > 0 && newStreak % 10 === 0) {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 }, colors: ['#00AEF3', '#E81B23', '#ffffff'] });
    }

    // Update Stats
    const nextStats = {
      ...stats,
      total: stats.total + 1,
      correct: isCorrect ? stats.correct + 1 : stats.correct,
      streak: newStreak,
      bestStreak: Math.max(newStreak, stats.bestStreak),

      demGuesses: guessedParty === "Democrat" ? stats.demGuesses + 1 : stats.demGuesses,
      repGuesses: guessedParty === "Republican" ? stats.repGuesses + 1 : stats.repGuesses,
      demCorrect: actualParty === "Democrat" && isCorrect ? stats.demCorrect + 1 : stats.demCorrect,
      repCorrect: actualParty === "Republican" && isCorrect ? stats.repCorrect + 1 : stats.repCorrect,

      // Corrected Confusion Matrix Logic:
      // If I guessed Dem, but it was Rep -> I am confused by Republicans
      guessedDemActualRep: guessedParty === "Democrat" && !isCorrect ? stats.guessedDemActualRep + 1 : stats.guessedDemActualRep,
      // If I guessed Rep, but it was Dem -> I am confused by Democrats
      guessedRepActualDem: guessedParty === "Republican" && !isCorrect ? stats.guessedRepActualDem + 1 : stats.guessedRepActualDem,

      totalTime: stats.totalTime + (validTime || 0),
      responseTimes: validTime ? [...stats.responseTimes, validTime] : stats.responseTimes
    };

    // Trophies
    const resultObj = { isCorrect, guessedParty, correctParty: actualParty, isFast };
    const nextUnlocked = new Set(trophies.unlocked || []);
    let changed = false;
    TROPHIES.forEach(t => {
      if (!nextUnlocked.has(t.id) && t.check({ stats: nextStats, lastResult: resultObj })) {
        nextUnlocked.add(t.id);
        changed = true;
      }
    });
    if (changed) {
      setTrophies(prev => ({ unlocked: Array.from(nextUnlocked), firstUnlockedAt: { ...prev.firstUnlockedAt, [Date.now()]: true } }));
      showToast("Trophy Unlocked!");
    }

    setStats(nextStats);
    setLastResult(resultObj);
    setGameState("revealed");

    // Variable Reveal Timing
    const delay = isCorrect ? 650 : 1400; // Fast for correct, slow for wrong
    setTimeout(advanceToNext, delay);

  }, [gameState, current, stats, trophies, advanceToNext]);

  // Keyboard Handler (Corrected dependencies)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showInfo || showStats || showTrophyCase || showWrapped) return;
      if (gameState !== "guessing") return;

      if (e.key === "ArrowLeft") { e.preventDefault(); handleGuess("Democrat"); }
      if (e.key === "ArrowRight") { e.preventDefault(); handleGuess("Republican"); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, showInfo, showStats, showTrophyCase, showWrapped, handleGuess]);

  // Reset (In-App)
  const handleReset = () => {
    if(confirm("Reset run stats? (Trophies will persist)")) {
      setStats({
        correct: 0, total: 0, streak: 0, bestStreak: 0, demGuesses: 0, repGuesses: 0,
        demCorrect: 0, repCorrect: 0, guessedDemActualRep: 0, guessedRepActualDem: 0, totalTime: 0, responseTimes: []
      });
      // Don't reload, just reset state
      setGameState("guessing");
      x.set(0);
    }
  };

  const copyStats = () => {
    const text = `🇺🇸 Guess The Party\nRank: ${rank.title}\nAccuracy: ${accuracy}%\nStreak: ${stats.bestStreak}\n\nCan you beat my score?`;
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard!");
  };

  if (!hasMounted || !current) return <LoadingScreen message="Loading..." />;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className={`fixed inset-0 w-full h-[100dvh] ${bgColor} text-[#1D1D1F] font-sans overflow-hidden transition-colors duration-500 overscroll-none touch-none focus:outline-none`}
    >
      <Head>
        <title>Guess The Party | Allen Wang</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        {loadingQueue[0] && <link rel="preload" as="image" href={loadingQueue[0].imageUrl} />}
      </Head>
      <Analytics />

      {/* Noise Texture */}
      <div className="absolute inset-0 opacity-40 pointer-events-none mix-blend-soft-light"
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
      </div>

      {/* Toast Layer */}
      <AnimatePresence>
        {toast && <Toast message={toast} />}
      </AnimatePresence>

      <div className="mx-auto max-w-2xl px-4 md:px-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] h-full flex flex-col relative z-10">

        {/* Header */}
        <header className="mb-4 mt-4 shrink-0 flex justify-center">
          <Glass className="px-5 py-3 rounded-full flex items-center justify-between w-full max-w-lg">
            <div className="flex flex-col items-start pr-4">
              <h1 className="text-sm md:text-base font-black uppercase tracking-tighter leading-none whitespace-nowrap">🇺🇸 Guess the Party</h1>
              <div className="w-full flex justify-between px-[1px] mt-0.5 opacity-40">
                  {"ALLEN WANG".split("").map((char, i) => (
                     <span key={i} className="text-[8px] font-black">{char === " " ? "\u00A0" : char}</span>
                  ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <IconButton onClick={() => setShowInfo(true)} ariaLabel="Info"><Info size={18} /></IconButton>
              <button onClick={() => setShowStats(true)} className="h-10 px-5 bg-black text-white rounded-2xl shadow-sm hover:bg-black/80 active:scale-95 transition-transform flex items-center">
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Stats</span>
              </button>
            </div>
          </Glass>
        </header>

        {/* Main Game Area */}
        <main className="flex-grow flex flex-col items-center justify-center relative touch-none select-none">

           {/* Hints (Anchored to card container) */}
           {stats.total === 0 && !revealed && (
            <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none max-w-[420px] mx-auto z-0 opacity-40">
                <div className="flex flex-col items-center gap-2"><ArrowLeft size={24} /><span className="text-[9px] font-black uppercase tracking-widest">Dem</span></div>
                <div className="flex flex-col items-center gap-2"><ArrowRight size={24} /><span className="text-[9px] font-black uppercase tracking-widest">Rep</span></div>
            </div>
           )}

          {/* Streak Popup (Toast style, not overlapping card) */}
          <AnimatePresence>
            {stats.streak >= 2 && gameState === 'revealed' && lastResult?.isCorrect && (
              <motion.div
                key="streak-pop"
                initial={{ scale: 0.5, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: -40 }}
                exit={{ scale: 1.2, opacity: 0, y: -60 }}
                className="absolute top-0 z-30 flex items-center gap-2 pointer-events-none"
              >
                 <span className="text-4xl">🔥</span>
                 <span className="text-5xl font-black italic tracking-tighter text-white drop-shadow-xl stroke-black"
                       style={{ WebkitTextStroke: "2px black" }}>
                    {stats.streak}
                 </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Card Stack */}
          <div className="relative w-full max-w-[400px] aspect-[3/4] max-h-[70vh]">
            {loadingQueue[0] && (
              <div className="absolute inset-0 w-full h-full opacity-0 pointer-events-none">
                 <Image src={loadingQueue[0].imageUrl} fill alt="preload" sizes="400px" priority />
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={current.name}
                drag={gameState === "guessing" ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                style={{ x, rotate }}
                animate={revealed && !lastResult?.isCorrect ? { x: [-5, 5, -5, 5, 0], transition: { duration: 0.4 } } : {}}
                onDragEnd={(e, i) => { if (i.offset.x < -80) handleGuess("Democrat"); else if (i.offset.x > 80) handleGuess("Republican"); }}
                className="absolute inset-0 rounded-[2.5rem] overflow-hidden border-[6px] border-white bg-white shadow-2xl cursor-grab active:cursor-grabbing"
              >
                {/* Swipe Overlay Tints */}
                <motion.div className="absolute inset-0 z-10 pointer-events-none" style={{ backgroundColor: swipeBg }} />

                {/* Drag Stamps (Only visible when dragging) */}
                {!revealed && (
                  <>
                    <motion.div style={{ opacity: demStampOpacity }} className="absolute top-8 right-8 z-20 pointer-events-none border-4 border-blue-500 text-blue-500 px-4 py-1 rounded-xl font-black text-3xl -rotate-12 uppercase tracking-tighter">Dem</motion.div>
                    <motion.div style={{ opacity: repStampOpacity }} className="absolute top-8 left-8 z-20 pointer-events-none border-4 border-red-500 text-red-500 px-4 py-1 rounded-xl font-black text-3xl rotate-12 uppercase tracking-tighter">Rep</motion.div>
                  </>
                )}

                {/* Image Layer */}
                <div className="relative h-[75%] bg-gray-100 overflow-hidden">
                  {imgLoading && <div className="absolute inset-0 flex items-center justify-center z-30 bg-white/50 backdrop-blur-sm"><Loader2 className="animate-spin text-black/20" size={32} /></div>}
                  <Image
                    src={current.imageUrl}
                    onLoadingComplete={() => setImgLoading(false)}
                    alt="Politician"
                    fill
                    priority
                    className={`object-cover object-top transition-all duration-500 ${revealed ? "blur-md brightness-[0.4] scale-105" : "scale-100"}`}
                  />

                  {/* Reveal Overlay */}
                  {revealed && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 z-40 flex flex-col items-center justify-center text-center p-6 text-white">
                      <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-4 shadow-xl ${lastResult?.isCorrect ? "bg-emerald-500" : "bg-rose-500"}`}>
                        {lastResult?.isCorrect ? <Check size={36} strokeWidth={4} /> : <XCircle size={36} strokeWidth={3} />}
                      </div>
                      <div className="space-y-2">
                        <div className="text-white/70 text-[10px] font-black uppercase tracking-[0.25em]">{formatOffice(current, true)}</div>
                        <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">{current.name}</h2>
                        <div className="flex items-center justify-center gap-2 pt-2">
                           <Pill className={`${current.party === "Democrat" ? "bg-blue-500" : "bg-red-500"} text-white border-none`}>{current.party}</Pill>
                           {lastResult?.isFast && lastResult?.isCorrect && (
                              <div className="flex items-center gap-1 px-2 py-1 bg-yellow-400 text-yellow-900 rounded-full text-[9px] font-black uppercase tracking-widest">
                                 <Zap size={10} className="fill-yellow-900" /> Fast
                              </div>
                           )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="relative h-[25%] px-5 py-4 bg-white flex flex-col justify-between">
                  <div className="grid grid-cols-2 gap-3 h-12">
                    <button onClick={() => handleGuess("Democrat")} disabled={revealed} className="rounded-xl bg-blue-50 text-blue-600 border border-blue-100 font-black text-xs uppercase tracking-widest hover:bg-blue-100 active:scale-95 transition-all disabled:opacity-50">Democrat</button>
                    <button onClick={() => handleGuess("Republican")} disabled={revealed} className="rounded-xl bg-red-50 text-red-600 border border-red-100 font-black text-xs uppercase tracking-widest hover:bg-red-100 active:scale-95 transition-all disabled:opacity-50">Republican</button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <button onClick={() => setShowTrophyCase(true)} className="flex items-center gap-2 text-amber-600 hover:bg-amber-50 px-3 py-2 rounded-xl transition-colors">
                      <Trophy size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{unlockedCount}/{TROPHIES.length}</span>
                    </button>
                    <button onClick={handleReset} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"><RefreshCw size={16}/></button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Modals Container */}
      <AnimatePresence>
        {showInfo && <Modal onClose={closeInfoModal}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black uppercase tracking-tighter">How to Play</h3>
            <IconButton onClick={closeInfoModal}><XCircle size={20} /></IconButton>
          </div>
          <div className="bg-gray-50 rounded-3xl p-6 mb-6 flex justify-around">
             <div className="text-center"><div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-2 mx-auto"><ArrowLeft size={20} /></div><span className="text-[10px] font-black uppercase text-blue-600">Democrat</span></div>
             <div className="text-center"><div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-2 mx-auto"><ArrowRight size={20} /></div><span className="text-[10px] font-black uppercase text-red-600">Republican</span></div>
          </div>
          <p className="text-center text-xs text-gray-400 font-medium">Swipe or use arrow keys</p>
        </Modal>}

        {showStats && <Modal onClose={() => setShowStats(false)}>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-black uppercase tracking-tighter">Performance</h2>
              <div className="flex items-center gap-2 mt-1">
                 <Pill className="bg-black text-white">{rank.title}</Pill>
              </div>
            </div>
            <IconButton onClick={() => setShowStats(false)}><XCircle size={20} /></IconButton>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="col-span-2 bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
               <div className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Accuracy</div>
               <div className="text-5xl font-black tracking-tighter text-gray-900">{accuracy}%</div>
               <div className="mt-4 space-y-2">
                  <ProgressBar label="Democrat" value={stats.demCorrect} total={stats.demGuesses} color="bg-blue-500" />
                  <ProgressBar label="Republican" value={stats.repCorrect} total={stats.repGuesses} color="bg-red-500" />
               </div>
            </div>
            <div className="bg-white rounded-3xl border border-gray-100 p-4 text-center shadow-sm">
                <div className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Streak</div>
                <div className="text-2xl font-black">{stats.streak}</div>
            </div>
            <div className="bg-white rounded-3xl border border-gray-100 p-4 text-center shadow-sm">
                <div className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Median Speed</div>
                <div className="text-2xl font-black">{medianSpeed}s</div>
            </div>
          </div>
          <button onClick={() => { setShowStats(false); setShowWrapped(true); }} className="w-full h-14 rounded-2xl bg-black text-white flex items-center justify-center gap-2 active:scale-95 transition-transform">
             <Star size={16} className="text-yellow-400 fill-yellow-400" />
             <span className="font-black uppercase tracking-[0.2em] text-xs">Generate Wrapped</span>
          </button>
        </Modal>}

        {showTrophyCase && <Modal onClose={() => setShowTrophyCase(false)}>
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex justify-between items-center">
               <h2 className="text-xl font-black uppercase tracking-tighter">Trophies</h2>
               <IconButton onClick={() => setShowTrophyCase(false)}><XCircle size={20} /></IconButton>
            </div>
            <div className="flex items-center gap-3">
               <div className="flex-grow h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: `${(unlockedCount / TROPHIES.length) * 100}%` }}></div>
               </div>
               <div className="text-[10px] font-black uppercase text-gray-400">{unlockedCount}/{TROPHIES.length}</div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {TROPHIES.map(t => {
              const unlocked = unlockedSet.has(t.id);
              return (
                <div key={t.id} className={`p-4 rounded-2xl border flex items-center gap-4 ${unlocked ? "bg-white border-gray-100 shadow-sm" : "bg-gray-50 border-transparent opacity-60 grayscale"}`}>
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${unlocked ? tierStyles(t.tier) : "bg-gray-200"}`}>{unlocked ? t.icon : <Lock size={16} />}</div>
                  <div className="min-w-0">
                      <div className="text-xs font-black uppercase tracking-tight truncate">{t.title}</div>
                      <div className="text-[10px] font-bold text-gray-400">{t.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Modal>}

        {showWrapped && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 pt-32" onClick={() => setShowWrapped(false)}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="relative w-full max-w-sm bg-gradient-to-br from-gray-900 to-black rounded-[2.5rem] border border-white/10 p-8 text-white shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="relative z-10 flex flex-col gap-6">
                <div className="flex justify-between items-start">
                   <div className="text-[9px] font-black uppercase tracking-[0.25em] opacity-60">2025 Review</div>
                   <button onClick={() => setShowWrapped(false)} className="opacity-50 hover:opacity-100"><XCircle size={20} /></button>
                </div>

                <h3 className="text-3xl font-black tracking-tighter uppercase leading-none">My Party<br/><span className="text-blue-400">I.Q.</span></h3>

                <div className="space-y-3">
                   <div className="bg-white/10 rounded-2xl p-4 border border-white/5">
                      <div className="text-[9px] uppercase tracking-widest opacity-50 mb-1">Rank</div>
                      <div className="text-xl font-black uppercase">{rank.title}</div>
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/10 rounded-2xl p-4 border border-white/5">
                         <div className="text-[9px] uppercase tracking-widest opacity-50 mb-1">Accuracy</div>
                         <div className="text-2xl font-black">{accuracy}%</div>
                      </div>
                      <div className="bg-white/10 rounded-2xl p-4 border border-white/5">
                         <div className="text-[9px] uppercase tracking-widest opacity-50 mb-1">Streak</div>
                         <div className="text-2xl font-black text-amber-400">{stats.bestStreak}</div>
                      </div>
                   </div>

                   <div className="bg-white/10 rounded-2xl p-4 border border-white/5 flex items-center gap-3">
                       <AlertCircle className="text-white/40" size={16} />
                       <div>
                          <div className="text-[9px] uppercase tracking-widest opacity-50">Confused By</div>
                          <div className="text-sm font-bold">{mostConfusedBy.party} <span className="opacity-50 font-normal">({mostConfusedBy.count})</span></div>
                       </div>
                   </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Guess The Party</p>
                        <p className="text-[9px] font-bold opacity-30 mt-0.5">Allen Wang</p>
                    </div>
                    <IconButton onClick={copyStats} className="h-8 w-8 bg-white text-black"><Share2 size={14} /></IconButton>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}