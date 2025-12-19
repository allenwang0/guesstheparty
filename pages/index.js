import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Head from "next/head";
import Image from "next/image";
import { Analytics } from "@vercel/analytics/react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import confetti from "canvas-confetti"; // Make sure to npm install canvas-confetti
import {
  Loader2, Check, Info, Timer, Target, Award, Trophy,
  Flame, Star, ShieldCheck, Zap, XCircle, Lock, MousePointer2
} from "lucide-react";

/* ----------------------------- Sub-Components ---------------------------- */

const Glass = ({ children, className = "" }) => (
  <div className={["rounded-3xl border border-white/70 bg-white/70 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.10)]", className].join(" ")}>{children}</div>
);

const Pill = ({ children, className = "" }) => (
  <span className={["inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.20em]", className].join(" ")}>{children}</span>
);

const IconButton = ({ onClick, ariaLabel, children, className = "" }) => (
  <button
    onClick={onClick}
    aria-label={ariaLabel}
    className={[
      "h-9 w-9 md:h-11 md:w-11 rounded-xl md:rounded-2xl",
      "bg-white/70 border border-black/10 backdrop-blur shadow-sm active:scale-95 transition-transform flex items-center justify-center",
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

/* -------------------------------- Trophies ------------------------------ */

const TROPHY_KEY = "partyTrophies_v1";
const INTRO_KEY = "partyHasSeenIntro_v1";

const TROPHIES = [
  { id: "first_correct", title: "First Blood", desc: "First correct guess.", icon: <Star size={18} />, tier: "bronze", check: ({ stats }) => (stats.correct || 0) >= 1 },
  { id: "streak_5", title: "Warm Streak", desc: "Best streak ≥ 5.", icon: <Flame size={18} />, tier: "bronze", check: ({ stats }) => (stats.bestStreak || 0) >= 5 },
  { id: "streak_10", title: "Campaign Staff", desc: "Best streak ≥ 10.", icon: <Award size={18} />, tier: "silver", check: ({ stats }) => (stats.bestStreak || 0) >= 10 },
  { id: "streak_25", title: "Party Operator", desc: "Best streak ≥ 25.", icon: <ShieldCheck size={18} />, tier: "gold", check: ({ stats }) => (stats.bestStreak || 0) >= 25 },
  { id: "streak_50", title: "Floor Leader", desc: "Best streak ≥ 50.", icon: <Trophy size={18} />, tier: "platinum", check: ({ stats }) => (stats.bestStreak || 0) >= 50 },
  { id: "seen_50", title: "Caucus Regular", desc: "Seen ≥ 50.", icon: <Target size={18} />, tier: "bronze", check: ({ stats }) => (stats.total || 0) >= 50 },
  { id: "seen_200", title: "Capitol Fixture", desc: "Seen ≥ 200.", icon: <Trophy size={18} />, tier: "gold", check: ({ stats }) => (stats.total || 0) >= 200 },
  { id: "accuracy_80_50", title: "Solid Read", desc: "≥80% accuracy with ≥50 seen.", icon: <Award size={18} />, tier: "silver", check: ({ stats }) => { const t = stats.total || 0; return t >= 50 && (stats.correct / t) >= 0.8; } },
  { id: "accuracy_90_100", title: "Polling Wizard", desc: "≥90% accuracy with ≥100 seen.", icon: <Trophy size={18} />, tier: "platinum", check: ({ stats }) => { const t = stats.total || 0; return t >= 100 && (stats.correct / t) >= 0.9; } },
  { id: "speed_2s_50", title: "Rapid Fire", desc: "Avg <2.0s with ≥50 seen.", icon: <Zap size={18} />, tier: "gold", check: ({ stats }) => { const t = stats.total || 0; return t >= 50 && (stats.totalTime / t / 1000) < 2.0; } },
];

function tierStyles(tier) {
  switch (tier) {
    case "bronze": return "bg-amber-100 text-amber-900 border-amber-300";
    case "silver": return "bg-slate-100 text-slate-900 border-slate-300";
    case "gold": return "bg-yellow-100 text-yellow-900 border-yellow-300";
    case "platinum": return "bg-indigo-100 text-indigo-900 border-indigo-300";
    default: return "bg-gray-100 text-gray-700 border-gray-300";
  }
}

function formatOffice(p) {
  const c = (p?.category ?? "").toString().trim().toLowerCase();
  if (c === "house") return "Representative";
  if (c === "senate") return "Senator";
  if (c === "gov") return "Governor";
  return "Public Official";
}

/* ----------------------------- Main Application -------------------------- */

export default function Home() {
  const [allPoliticians, setAllPoliticians] = useState([]);
  const [current, setCurrent] = useState(null);
  const [loadingQueue, setLoadingQueue] = useState([]);
  const [hasMounted, setHasMounted] = useState(false);
  const [stats, setStats] = useState({ correct: 0, total: 0, streak: 0, bestStreak: 0, demGuesses: 0, repGuesses: 0, demCorrect: 0, repCorrect: 0, totalTime: 0 });
  const [trophies, setTrophies] = useState({ unlocked: [], firstUnlockedAt: {} });
  const [gameState, setGameState] = useState("guessing");
  const [imgLoading, setImgLoading] = useState(true);
  const [startTime, setStartTime] = useState(null);

  // Modals
  const [showInfo, setShowInfo] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showWrapped, setShowWrapped] = useState(false);
  const [showTrophyCase, setShowTrophyCase] = useState(false);

  const [lastResult, setLastResult] = useState(null);
  const revealTimeoutRef = useRef(null);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-10, 10]);
  const swipeBg = useTransform(x, [-120, 0, 120], ["rgba(0,174,243,0.18)", "rgba(255,255,255,0)", "rgba(232,27,35,0.18)"]);
  const demStampOpacity = useTransform(x, [0, -80], [0, 1]);
  const repStampOpacity = useTransform(x, [0, 80], [0, 1]);

  const unlockedCount = trophies.unlocked?.length || 0;
  const unlockedSet = useMemo(() => new Set(trophies.unlocked || []), [trophies.unlocked]);
  const accuracy = useMemo(() => (stats.total === 0 ? 0 : Math.round((stats.correct / stats.total) * 100)), [stats]);
  const avgSpeed = useMemo(() => (stats.total === 0 ? 0 : (stats.totalTime / stats.total / 1000).toFixed(1)), [stats]);

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

  // Initial Load & Data Fetch
  useEffect(() => {
    setHasMounted(true);
    const savedStats = localStorage.getItem("partyStats");
    if (savedStats) try { setStats(prev => ({ ...prev, ...JSON.parse(savedStats) })); } catch {}
    const savedTrophies = localStorage.getItem(TROPHY_KEY);
    if (savedTrophies) try { setTrophies(prev => ({ ...prev, ...JSON.parse(savedTrophies) })); } catch {}

    const hasSeenIntro = localStorage.getItem(INTRO_KEY);
    if (!hasSeenIntro) {
      setShowInfo(true);
    }

    fetch("/politicians.json").then(res => res.json()).then(data => {
      const normalized = (data || []).map(p => ({ ...p, imageUrl: p.img || p.image_url }));
      setAllPoliticians(normalized);
      const shuffled = [...normalized].sort(() => 0.5 - Math.random());
      setCurrent(shuffled[0] || null);
      setLoadingQueue(shuffled.slice(1, 6));
      setStartTime(Date.now());
    });
  }, []);

  useEffect(() => { if (hasMounted) localStorage.setItem("partyStats", JSON.stringify(stats)); }, [stats, hasMounted]);
  useEffect(() => { if (hasMounted) localStorage.setItem(TROPHY_KEY, JSON.stringify(trophies)); }, [trophies, hasMounted]);

  // Keyboard Handlers
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showInfo || showStats || showTrophyCase || showWrapped) return;
      if (gameState !== "guessing") return;

      if (e.key === "ArrowLeft") handleGuess("Democrat");
      if (e.key === "ArrowRight") handleGuess("Republican");
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, showInfo, showStats, showTrophyCase, showWrapped]);

  const maybeUnlockTrophies = useCallback((nextStats) => {
    const nextUnlocked = new Set(trophies.unlocked || []);
    const firstUnlockedAt = { ...(trophies.firstUnlockedAt || {}) };
    let changed = false;
    TROPHIES.forEach(t => {
      if (!nextUnlocked.has(t.id) && t.check({ stats: nextStats })) {
        nextUnlocked.add(t.id);
        firstUnlockedAt[t.id] = Date.now();
        changed = true;
      }
    });
    if (changed) setTrophies({ unlocked: Array.from(nextUnlocked), firstUnlockedAt });
  }, [trophies]);

  const advanceToNext = useCallback(() => {
    const next = loadingQueue[0];
    if (!next) {
       if (allPoliticians.length > 0) {
         const random = allPoliticians[Math.floor(Math.random() * allPoliticians.length)];
         setCurrent(random);
       }
       return;
    }

    setCurrent(next);
    setLoadingQueue(prev => {
      const nextCard = allPoliticians[Math.floor(Math.random() * allPoliticians.length)];
      return [...prev.slice(1), nextCard].filter(Boolean);
    });
    setGameState("guessing"); setImgLoading(true); setStartTime(Date.now()); setLastResult(null); x.set(0);
  }, [loadingQueue, allPoliticians, x]);

  const handleGuess = useCallback((party) => {
    if (gameState !== "guessing" || !current) return;

    const isCorrect = party === current.party;

    // Haptic feedback
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (isCorrect) navigator.vibrate(10);
      else navigator.vibrate([30, 50, 30]);
    }

    const timeTaken = Date.now() - startTime;
    const newStreak = isCorrect ? stats.streak + 1 : 0;

    // Confetti on milestones (every 10 streak)
    if (isCorrect && newStreak > 0 && newStreak % 10 === 0) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00AEF3', '#E81B23', '#ffffff'] // R, W, B
      });
    }

    const nextStats = {
      ...stats,
      total: stats.total + 1,
      correct: isCorrect ? stats.correct + 1 : stats.correct,
      streak: newStreak,
      bestStreak: Math.max(newStreak, stats.bestStreak),
      demGuesses: current.party === "Democrat" ? stats.demGuesses + 1 : stats.demGuesses,
      repGuesses: current.party !== "Democrat" ? stats.repGuesses + 1 : stats.repGuesses,
      demCorrect: current.party === "Democrat" && isCorrect ? stats.demCorrect + 1 : stats.demCorrect,
      repCorrect: current.party !== "Democrat" && isCorrect ? stats.repCorrect + 1 : stats.repCorrect,
      totalTime: stats.totalTime + timeTaken,
    };

    setStats(nextStats);
    maybeUnlockTrophies(nextStats);
    setLastResult({ isCorrect, guessedParty: party, correctParty: current.party });
    setGameState("revealed");

    if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
    revealTimeoutRef.current = setTimeout(advanceToNext, 1100);
  }, [gameState, current, startTime, stats, maybeUnlockTrophies, advanceToNext]);

  const closeInfoModal = () => {
    setShowInfo(false);
    localStorage.setItem(INTRO_KEY, "true");
  };

  const handleReset = () => {
    if(confirm("Reset all stats and trophies?")) {
      setStats({ correct: 0, total: 0, streak: 0, bestStreak: 0, demGuesses: 0, repGuesses: 0, demCorrect: 0, repCorrect: 0, totalTime: 0 });
      setTrophies({ unlocked: [], firstUnlockedAt: {} });
      localStorage.removeItem(INTRO_KEY);
      window.location.reload();
    }
  }

  if (!hasMounted || !current) return <LoadingScreen message="Loading..." />;

  return (
    <div className="min-h-screen w-full bg-[#F5F5F7] text-[#1D1D1F] font-sans overflow-x-hidden">
      <Head>
        <title>Guess The Party | Allen Wang</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        {loadingQueue[0] && (
          <link rel="preload" as="image" href={loadingQueue[0].imageUrl} />
        )}
      </Head>
      <Analytics />

      {/* Preload Buffer */}
      <div className="fixed -left-[9999px] top-0 h-1 w-1 overflow-hidden pointer-events-none" aria-hidden="true">
        {loadingQueue.map((p, i) => (
          <Image key={`${p.name}-${i}`} src={p.imageUrl} alt="preload" width={400} height={500} priority={i < 2} quality={60} />
        ))}
      </div>

      <div className="mx-auto max-w-4xl px-4 md:px-8 pt-4 pb-6 md:pt-8">
        <header className="mb-4 md:mb-8">
          <Glass className="px-4 py-3 md:px-5 md:py-4 rounded-[2rem] md:rounded-[2.25rem]">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <h1 className="text-base md:text-xl font-black tracking-tighter uppercase truncate">🇺🇸 Guess the Party</h1>
                <div className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Allen Wang</div>
              </div>
              <div className="flex items-center gap-2">
                {/* PERSISTENT SMALL STREAK INDICATOR */}
                {stats.streak > 0 && (
                  <div className="h-9 md:h-11 px-3 rounded-xl md:rounded-2xl bg-orange-50 border border-orange-100 flex items-center gap-1.5 text-orange-600 shadow-sm">
                    <Flame size={14} className="fill-orange-600" />
                    <span className="text-[10px] font-black">{stats.streak}</span>
                  </div>
                )}

                <IconButton onClick={() => setShowInfo(true)} ariaLabel="Info"><Info size={16} /></IconButton>
                <button
                  onClick={() => setShowStats(true)}
                  className="h-9 md:h-11 rounded-xl md:rounded-2xl px-4 md:px-6 bg-black text-white shadow-sm active:scale-95 transition-transform flex items-center justify-center"
                >
                  <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em]">Stats</span>
                </button>
              </div>
            </div>
          </Glass>
        </header>

        <main className="flex justify-center relative">

          {/* TRANSIENT COMBO STREAK POPUP - MOVED TO TOP OF CARD AREA */}
          <AnimatePresence>
            {stats.streak >= 3 && gameState === 'revealed' && lastResult?.isCorrect && (
              <motion.div
                key={`streak-${stats.streak}`}
                initial={{ scale: 0.5, opacity: 0, y: 0 }}
                animate={{ scale: 1.1, opacity: 1, y: 10 }}
                exit={{ scale: 1.5, opacity: 0, filter: "blur(10px)", y: -20 }}
                transition={{ duration: 0.5, ease: "backOut" }}
                className="absolute top-[5%] md:top-[8%] left-0 right-0 z-50 pointer-events-none flex flex-col items-center justify-center"
              >
                <div className="relative">
                  <span className="absolute -inset-2 bg-orange-500 blur-xl opacity-30 rounded-full"></span>
                  <div className="relative text-6xl md:text-8xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-orange-400 to-red-600 drop-shadow-sm stroke-white"
                       style={{ WebkitTextStroke: "2px white" }}>
                    {stats.streak}
                  </div>
                </div>
                <div className="mt-2 text-orange-500 font-black uppercase tracking-[0.5em] text-[10px] bg-white/90 backdrop-blur px-3 py-1 rounded-full shadow-xl">
                  Combo!
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {loadingQueue[0] && (
            <div className="absolute inset-0 w-full max-w-[560px] h-[68vh] md:h-[76vh] opacity-0 pointer-events-none">
               <Image src={loadingQueue[0].imageUrl} fill alt="next" sizes="(max-width: 768px) 90vw, 560px" priority />
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={current.name}
              drag={gameState === "guessing" ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              style={{ x, rotate }}
              onDragEnd={(e, i) => { if (i.offset.x < -80) handleGuess("Democrat"); else if (i.offset.x > 80) handleGuess("Republican"); }}
              className="relative z-10 w-full max-w-[560px] h-[68vh] md:h-[76vh] max-h-[760px] min-h-[500px] rounded-[2.5rem] overflow-hidden border border-white bg-white shadow-[0_24px_80px_rgba(0,0,0,0.14)]"
            >
              <motion.div className="absolute inset-0 z-0 pointer-events-none" style={{ backgroundColor: swipeBg }} />

              {!revealed && (
                <>
                  <motion.div
                    style={{ opacity: demStampOpacity }}
                    className="absolute top-10 right-10 z-50 pointer-events-none border-4 border-[#00AEF3] text-[#00AEF3] px-4 py-1 rounded-xl font-black text-2xl md:text-4xl -rotate-12 uppercase tracking-tighter"
                  >
                    Democrat
                  </motion.div>
                  <motion.div
                    style={{ opacity: repStampOpacity }}
                    className="absolute top-10 left-10 z-50 pointer-events-none border-4 border-[#E81B23] text-[#E81B23] px-4 py-1 rounded-xl font-black text-2xl md:text-4xl rotate-12 uppercase tracking-tighter"
                  >
                    Republican
                  </motion.div>
                </>
              )}

              <div className="relative z-10 h-[75%] md:h-[78%] bg-[#fbfbfb] overflow-hidden">
                {imgLoading && <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/70 backdrop-blur"><Loader2 className="animate-spin text-blue-500" size={34} /></div>}
                <div className="relative w-full h-full p-4">
                  <Image
                    src={current.imageUrl}
                    onLoadingComplete={() => setImgLoading(false)}
                    alt="Politician"
                    fill
                    priority
                    quality={75}
                    sizes="(max-width: 768px) 90vw, 560px"
                    className={`object-contain transition-all duration-700 ${revealed ? "scale-110 blur-2xl brightness-[0.35]" : "scale-100"}`}
                  />
                </div>
                {revealed && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="absolute inset-0 z-30 flex flex-col items-center justify-center text-center p-6">
                    <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-4 md:mb-6 shadow-xl ${lastResult?.isCorrect ? "bg-emerald-500" : "bg-rose-500"}`}>
                      {lastResult?.isCorrect ? <Check size={30} className="text-white" strokeWidth={3.5} /> : <XCircle size={30} className="text-white" strokeWidth={2.8} />}
                    </div>
                    <div className="space-y-1">
                      <div className="text-white/60 text-[9px] font-black uppercase tracking-[0.3em]">{formatOffice(current)}</div>
                      <h2 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tighter leading-tight">{current.name}</h2>
                      <Pill className={`mt-3 ${current.party === "Democrat" ? "bg-blue-600 text-white" : "bg-red-600 text-white"}`}>{current.party}</Pill>
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="relative z-10 h-[25%] md:h-[22%] px-4 md:px-6 py-4 bg-white border-t border-black/5">
                <div className="grid grid-cols-2 gap-3 md:gap-4 h-[60%]">
                  <button onClick={() => handleGuess("Democrat")} disabled={revealed} className="rounded-2xl bg-[#00AEF3] text-white font-black text-[10px] md:text-xs uppercase tracking-widest active:scale-95 transition-transform disabled:opacity-60">Democrat</button>
                  <button onClick={() => handleGuess("Republican")} disabled={revealed} className="rounded-2xl bg-[#E81B23] text-white font-black text-[10px] md:text-xs uppercase tracking-widest active:scale-95 transition-transform disabled:opacity-60">Republican</button>
                </div>
                <div className="mt-2 md:mt-3 flex items-center justify-between">
                  <button onClick={() => setShowTrophyCase(true)} className="h-8 rounded-xl px-3 bg-white border border-black/10 shadow-sm flex items-center gap-1.5 active:scale-95 transition-transform">
                    <Trophy size={14} className="text-amber-600" />
                    <span className="text-[9px] font-black uppercase tracking-[0.18em]">{unlockedCount}/{TROPHIES.length}</span>
                  </button>
                  <button
                    onClick={handleReset}
                    className="h-8 rounded-xl px-3 bg-white border border-black/10 shadow-sm active:scale-95 transition-transform text-[9px] font-black uppercase tracking-[0.18em] text-gray-500"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {/* INFO MODAL */}
        {showInfo && <Modal onClose={closeInfoModal} maxW="max-w-lg">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-2xl font-black uppercase tracking-tighter">How to Play</h3>
            <IconButton onClick={closeInfoModal}><XCircle size={20} /></IconButton>
          </div>

          <div className="bg-white rounded-3xl border border-black/5 p-4 mb-6 shadow-sm">
             <div className="flex items-center justify-center gap-8 py-4">
                <div className="text-center">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white mb-2 mx-auto">
                        <MousePointer2 className="rotate-[-90deg]" size={20} />
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-blue-600">Democrat</div>
                </div>
                <div className="h-12 w-[1px] bg-gray-200"></div>
                <div className="text-center">
                    <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white mb-2 mx-auto">
                         <MousePointer2 className="rotate-[90deg]" size={20} />
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-red-600">Republican</div>
                </div>
             </div>
             <p className="text-xs text-center font-bold text-gray-500 leading-relaxed px-4">
                Swipe card or use arrow keys
             </p>
          </div>

          <div className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-gray-400">Data via public records</p>
          </div>
        </Modal>}

        {/* STATS MODAL (BENTO GRID) */}
        {showStats && <Modal onClose={() => setShowStats(false)} maxW="max-w-2xl">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter">Performance</h2>
              <div className="flex items-center gap-2 mt-2">
                 <Pill className="bg-black text-white">{rank.title}</Pill>
                 <span className="text-[10px] font-bold text-gray-400">Top Streak: {stats.bestStreak}</span>
              </div>
            </div>
            <IconButton onClick={() => setShowStats(false)}><XCircle size={20} /></IconButton>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {/* Large Accuracy Block */}
            <div className="col-span-2 row-span-2 bg-white rounded-[2rem] border border-black/5 p-6 flex flex-col justify-between shadow-sm relative overflow-hidden">
               <div className="relative z-10">
                  <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Accuracy</div>
                  <div className="text-6xl font-black tracking-tighter text-[#1D1D1F]">{accuracy}<span className="text-2xl text-gray-300">%</span></div>
               </div>
               <div className="relative z-10 space-y-3 mt-4">
                  <ProgressBar label="Democrat" value={stats.demCorrect} total={stats.demGuesses} color="bg-blue-500" />
                  <ProgressBar label="Republican" value={stats.repCorrect} total={stats.repGuesses} color="bg-red-500" />
               </div>
               {/* Decor */}
               <Target className="absolute -bottom-4 -right-4 text-gray-50 opacity-50" size={120} />
            </div>

            {/* Small Metric Blocks */}
            <div className="col-span-1 bg-white rounded-[2rem] border border-black/5 p-4 flex flex-col justify-center items-center text-center shadow-sm">
                <div className="mb-2 p-2 bg-orange-50 text-orange-500 rounded-xl"><Flame size={20} /></div>
                <div className="text-2xl font-black">{stats.streak}</div>
                <div className="text-[8px] font-black uppercase tracking-widest text-gray-400">Current</div>
            </div>
            <div className="col-span-1 bg-white rounded-[2rem] border border-black/5 p-4 flex flex-col justify-center items-center text-center shadow-sm">
                <div className="mb-2 p-2 bg-blue-50 text-blue-500 rounded-xl"><Timer size={20} /></div>
                <div className="text-2xl font-black">{avgSpeed}s</div>
                <div className="text-[8px] font-black uppercase tracking-widest text-gray-400">Avg Speed</div>
            </div>
            <div className="col-span-2 bg-white rounded-[2rem] border border-black/5 p-5 flex items-center justify-between shadow-sm">
                <div>
                   <div className="text-[9px] font-black uppercase tracking-widest text-gray-400">Cards Seen</div>
                   <div className="text-3xl font-black">{stats.total}</div>
                </div>
                <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-black">🇺🇸</span>
                </div>
            </div>
          </div>

          <button onClick={() => { setShowStats(false); setShowWrapped(true); }} className="group w-full h-14 rounded-[1.5rem] bg-[#1d1d1f] text-white flex items-center justify-center gap-2 active:scale-95 transition-transform">
             <Star size={16} className="text-yellow-400 fill-yellow-400 group-hover:rotate-180 transition-transform duration-500" />
             <span className="font-black uppercase tracking-[0.2em] text-[11px]">Generate Wrapped</span>
          </button>
        </Modal>}

        {/* WRAPPED (GLOSSY CARD) */}
        {showWrapped && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setShowWrapped(false)}>
            <motion.div
              initial={{ scale: 0.8, opacity: 0, rotateX: 20 }}
              animate={{ scale: 1, opacity: 1, rotateX: 0 }}
              className="relative w-full max-w-sm aspect-[9/16] rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/20 select-none"
              onClick={e => e.stopPropagation()}
            >
              {/* Dynamic Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-black"></div>
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

              {/* Content */}
              <div className="relative z-10 h-full flex flex-col p-8 text-white">
                <div className="flex justify-between items-start">
                   <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">2025 Review</div>
                   {/* Star icon removed as requested */}
                </div>

                <div className="mt-8">
                   <h3 className="text-6xl font-black tracking-tighter leading-none mb-2">MY<br/>PARTY<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-red-400">IQ</span></h3>
                </div>

                <div className="flex-grow flex flex-col justify-center gap-6">
                   <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/10">
                      <div className="text-[9px] font-black uppercase tracking-widest text-white/50 mb-1">Rank Achieved</div>
                      <div className="text-2xl font-black uppercase tracking-tight">{rank.title}</div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/10">
                         <div className="text-[9px] font-black uppercase tracking-widest text-white/50 mb-1">Accuracy</div>
                         <div className="text-3xl font-black">{accuracy}%</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/10">
                         <div className="text-[9px] font-black uppercase tracking-widest text-white/50 mb-1">Top Streak</div>
                         <div className="text-3xl font-black text-orange-400">{stats.bestStreak}</div>
                      </div>
                   </div>
                </div>

                <div className="mt-auto pt-6 border-t border-white/10 text-center">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40">Guess The Party</p>
                    <p className="text-[9px] font-bold opacity-30 mt-1">Allen Wang</p>
                </div>
              </div>

              <button onClick={() => setShowWrapped(false)} className="absolute top-4 right-4 h-8 w-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center backdrop-blur z-20 transition-colors">
                <XCircle size={16} className="text-white" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LoadingScreen({ message }) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F5F5F7] gap-4">
      <Loader2 className="animate-spin text-blue-600" size={52} />
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">{message}</p>
    </div>
  );
}

function Modal({ children, onClose, maxW = "max-w-xl" }) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-xl flex items-center justify-center p-4 md:p-6" onClick={onClose}>
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={`w-full ${maxW} max-h-[90vh] overflow-y-auto rounded-[2.5rem] bg-[#F5F5F7] shadow-2xl p-7 md:p-10`} onClick={e => e.stopPropagation()}>
        {children}
      </motion.div>
    </div>
  );
}