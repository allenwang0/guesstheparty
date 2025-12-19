import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Head from "next/head";
import Image from "next/image";
import { Analytics } from "@vercel/analytics/react";
import { motion, AnimatePresence, useMotionValue, useTransform, useAnimation } from "framer-motion";
import {
  Loader2,
  Check,
  Info,
  Target,
  Award,
  Trophy,
  Flame,
  Star,
  ShieldCheck,
  Zap,
  XCircle,
  Lock,
  Share2,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  BarChart3,
  Users
} from "lucide-react";

/* ----------------------------- Mock Backend Data ---------------------------- */

// We simulate the backend response here. In a real app, this comes from /api/rank
const MOCK_BACKEND_DATA = {
  totalPlayers: 4812,
  // Accuracy: 0-100 in 5% bins (20 bins)
  accuracyDistribution: [
    { range: '0-5', count: 10 }, { range: '5-10', count: 5 }, { range: '10-15', count: 8 },
    { range: '15-20', count: 12 }, { range: '20-25', count: 20 }, { range: '25-30', count: 40 },
    { range: '30-35', count: 80 }, { range: '35-40', count: 150 }, { range: '40-45', count: 300 },
    { range: '45-50', count: 600 }, { range: '50-55', count: 800 }, { range: '55-60', count: 900 },
    { range: '60-65', count: 700 }, { range: '65-70', count: 500 }, { range: '70-75', count: 300 },
    { range: '75-80', count: 200 }, { range: '80-85', count: 100 }, { range: '85-90', count: 50 },
    { range: '90-95', count: 25 }, { range: '95-100', count: 12 }
  ],
  // Streak: Log-ish bins (0–1, 2–3, 4–7, 8–15, 16–31, 32–63, 64+)
  streakDistribution: [
    { range: '0-1', label: '0-1', count: 1200 },
    { range: '2-3', label: '2-3', count: 1500 },
    { range: '4-7', label: '4-7', count: 1100 },
    { range: '8-15', label: '8-15', count: 600 },
    { range: '16-31', label: '16-31', count: 300 },
    { range: '32-63', label: '32-63', count: 100 },
    { range: '64+', label: '64+', count: 12 }
  ]
};

/* ----------------------------- Helpers ---------------------------- */

function getStreakBinIndex(streak) {
  if (streak <= 1) return 0;
  if (streak <= 3) return 1;
  if (streak <= 7) return 2;
  if (streak <= 15) return 3;
  if (streak <= 31) return 4;
  if (streak <= 63) return 5;
  return 6;
}

function getAccuracyBinIndex(acc) {
  // 0-100 mapped to 0-19 (5% chunks)
  return Math.min(Math.floor(acc / 5), 19);
}

function calculatePercentile(userValue, distribution, type = 'accuracy') {
  let totalPlayers = 0;
  let playersBeaten = 0;

  distribution.forEach(d => totalPlayers += d.count);

  const userIndex = type === 'accuracy'
    ? getAccuracyBinIndex(userValue)
    : getStreakBinIndex(userValue);

  distribution.forEach((d, i) => {
    if (i < userIndex) {
      playersBeaten += d.count;
    }
  });

  if (totalPlayers === 0) return 0;
  // Top X% logic: if you beat 80% of players, you are Top 20%
  const beatPercent = (playersBeaten / totalPlayers) * 100;
  return Math.max(1, Math.round(100 - beatPercent));
}

/* ----------------------------- Components ---------------------------- */

const Glass = ({ children, className = "" }) => (
  <div className={["rounded-3xl border border-white/60 bg-white/60 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.04)]", className].join(" ")}>
    {children}
  </div>
);

const Pill = ({ children, className = "" }) => (
  <span className={["inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.20em]", className].join(" ")}>
    {children}
  </span>
);

const IconButton = ({ onClick, ariaLabel, children, className = "" }) => (
  <button onClick={onClick} aria-label={ariaLabel} className={["h-10 w-10 rounded-2xl", "bg-white/60 border border-black/5 backdrop-blur shadow-sm hover:bg-white/90 active:scale-95 transition-all flex items-center justify-center", className].join(" ")}>
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
      <motion.div initial={{ width: 0 }} animate={{ width: `${(value / (total || 1)) * 100}%` }} className={`h-full ${color}`} />
    </div>
  </div>
);

const Toast = ({ message }) => (
  <motion.div initial={{ opacity: 0, y: -20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.9 }} className="fixed top-24 left-1/2 -translate-x-1/2 z-[150] bg-black/80 backdrop-blur text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 pointer-events-none">
    <span className="text-xs font-bold tracking-widest uppercase">{message}</span>
  </motion.div>
);

/* --- The New Sophisticated Histogram Component --- */
const CommunityRank = ({ stats }) => {
  const [metric, setMetric] = useState('accuracy'); // 'accuracy' | 'streak'
  const [loading, setLoading] = useState(true);

  // Logic Gate: Lock functionality if under 50 seen
  const isProvisional = stats.total < 50;
  const userAccuracy = stats.total === 0 ? 0 : Math.round((stats.correct / stats.total) * 100);
  const userStreak = stats.bestStreak;

  useEffect(() => {
    // Simulate API Fetch
    setTimeout(() => setLoading(false), 800);
  }, []);

  const data = metric === 'accuracy' ? MOCK_BACKEND_DATA.accuracyDistribution : MOCK_BACKEND_DATA.streakDistribution;
  const maxCount = Math.max(...data.map(d => d.count));

  const userBinIndex = metric === 'accuracy'
    ? getAccuracyBinIndex(userAccuracy)
    : getStreakBinIndex(userStreak);

  const percentile = calculatePercentile(metric === 'accuracy' ? userAccuracy : userStreak, data, metric);

  if (loading) return (
    <div className="w-full h-48 bg-gray-50 rounded-2xl flex flex-col items-center justify-center animate-pulse gap-2 mt-4">
      <Loader2 className="animate-spin text-gray-300" size={20} />
      <span className="text-[10px] font-black uppercase text-gray-300 tracking-widest">Loading Community Data...</span>
    </div>
  );

  return (
    <div className="w-full mt-6 bg-gray-50/50 rounded-3xl p-5 border border-gray-100 relative overflow-hidden">
      {/* Header / Toggles */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-1 bg-gray-200/50 p-1 rounded-xl">
          <button
            onClick={() => setMetric('accuracy')}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${metric === 'accuracy' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Accuracy
          </button>
          <button
            onClick={() => setMetric('streak')}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${metric === 'streak' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Streak
          </button>
        </div>

        {!isProvisional && (
          <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
             <Target size={12} />
             <span className="text-[9px] font-black uppercase tracking-wider">Top {percentile}%</span>
          </div>
        )}
      </div>

      {/* Logic Gate Overlay */}
      {isProvisional && (
        <div className="absolute inset-0 z-20 backdrop-blur-sm bg-white/30 flex flex-col items-center justify-center text-center p-6">
          <div className="h-12 w-12 bg-black text-white rounded-2xl flex items-center justify-center mb-3 shadow-xl">
            <Lock size={20} />
          </div>
          <h4 className="text-sm font-black uppercase tracking-tight">Rank Locked</h4>
          <p className="text-xs text-gray-500 mt-1 max-w-[200px]">
            Identify <span className="text-black font-bold">50 politicians</span> to unlock your global ranking.
          </p>
          <div className="mt-3 w-full max-w-[120px]">
            <ProgressBar label="Progress" value={stats.total} total={50} color="bg-black" />
          </div>
        </div>
      )}

      {/* The Chart */}
      <div className={`flex items-end justify-between h-28 gap-[2px] ${isProvisional ? 'opacity-20 blur-sm' : ''}`}>
        {data.map((bucket, i) => {
          const isUser = i === userBinIndex;
          const height = Math.max(5, (bucket.count / maxCount) * 100);

          return (
            <div key={i} className="flex-1 flex flex-col justify-end group relative h-full">
               {/* Bar */}
               <motion.div
                 initial={{ height: 0 }}
                 animate={{ height: `${height}%` }}
                 transition={{ duration: 0.5, delay: i * 0.02 }}
                 className={`w-full rounded-t-[2px] relative min-h-[4px] ${isUser ? 'bg-blue-500' : 'bg-gray-300'}`}
               >
                 {isUser && (
                   <div className="absolute -top-2 left-1/2 -translate-x-1/2 h-1.5 w-1.5 bg-black rounded-full ring-2 ring-white" />
                 )}
               </motion.div>
            </div>
          );
        })}
      </div>

      {/* X-Axis Labels */}
      <div className={`flex justify-between mt-2 text-[8px] font-bold text-gray-400 uppercase tracking-widest ${isProvisional ? 'opacity-20' : ''}`}>
        <span>{metric === 'accuracy' ? '0%' : '0'}</span>
        <span>{metric === 'accuracy' ? '50%' : '15'}</span>
        <span>{metric === 'accuracy' ? '100%' : '64+'}</span>
      </div>

      {/* Footer Stats */}
      <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
        <div className="flex items-center gap-2 text-gray-400">
          <Users size={12} />
          <span className="text-[9px] font-bold tracking-wider">{MOCK_BACKEND_DATA.totalPlayers.toLocaleString()} Players</span>
        </div>
        <div className="text-[9px] font-bold text-gray-400">
           {metric === 'accuracy' ? 'Min 50 Seen' : 'All Time Best'}
        </div>
      </div>
    </div>
  );
};

/* ----------------------------- Main App ---------------------------- */

export default function Home() {
  const [allPoliticians, setAllPoliticians] = useState([]);
  const [current, setCurrent] = useState(null);
  const [loadingQueue, setLoadingQueue] = useState([]);
  const [hasMounted, setHasMounted] = useState(false);
  const [fatalError, setFatalError] = useState(null);
  const containerRef = useRef(null);

  // Logic Refs
  const recentIds = useRef(new Set());
  const startTimeRef = useRef(null);
  const shakeControls = useAnimation();

  // UX State
  const [toast, setToast] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showWrapped, setShowWrapped] = useState(false);
  const [showTrophyCase, setShowTrophyCase] = useState(false);

  // Identity State
  const [playerId, setPlayerId] = useState(null);

  // Game State
  const [gameState, setGameState] = useState("guessing");
  const [imgLoading, setImgLoading] = useState(true);
  const [lastResult, setLastResult] = useState(null);

  const [stats, setStats] = useState({
    correct: 0,
    total: 0,
    streak: 0,
    bestStreak: 0,
    demGuesses: 0,
    repGuesses: 0,
    demCorrect: 0,
    repCorrect: 0,
    guessedDemActualRep: 0,
    guessedRepActualDem: 0,
    responseTimes: [],
    totalTime: 0,
    demTime: 0,
    repTime: 0,
  });

  const [trophies, setTrophies] = useState({ unlocked: [], firstUnlockedAt: {} });

  // Motion Logic
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const swipeBg = useTransform(x, [-150, 0, 150], ["rgba(59, 130, 246, 0.15)", "rgba(255,255,255,0)", "rgba(239, 68, 68, 0.15)"]);
  const demStampOpacity = useTransform(x, [0, -60], [0, 1]);
  const demStampScale = useTransform(x, [0, -60], [2, 1]);
  const repStampOpacity = useTransform(x, [0, 60], [0, 1]);
  const repStampScale = useTransform(x, [0, 60], [2, 1]);

  // Derived Metrics
  const unlockedCount = trophies.unlocked?.length || 0;
  const unlockedSet = useMemo(() => new Set(trophies.unlocked || []), [trophies.unlocked]);
  const accuracy = useMemo(() => (stats.total === 0 ? 0 : Math.round((stats.correct / stats.total) * 100)), [stats]);

  const medianSpeed = useMemo(() => {
    if (stats.responseTimes.length === 0) return "0.0";
    const sorted = [...stats.responseTimes].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const ms = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    return (ms / 1000).toFixed(1);
  }, [stats.responseTimes]);

  const rank = useMemo(() => {
    const s = stats.bestStreak || 0;
    if (s >= 50) return { title: "Speaker of the House" };
    if (s >= 30) return { title: "Party Whip" };
    if (s >= 20) return { title: "Senior Senator" };
    if (s >= 10) return { title: "Campaign Manager" };
    if (s >= 5) return { title: "Staffer" };
    return { title: "Political Intern" };
  }, [stats.bestStreak]);

  const revealed = gameState === "revealed";

  const bgColor = useMemo(() => {
    if (revealed && lastResult) {
      if (lastResult.correctParty === "Democrat") return "bg-blue-50/40";
      if (lastResult.correctParty === "Republican") return "bg-red-50/40";
    }
    return "bg-[#F5F5F7]";
  }, [revealed, lastResult]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const closeInfoModal = useCallback(() => {
    setShowInfo(false);
    if (typeof window !== "undefined") {
      try { localStorage.setItem("partyHasSeenIntro_v3", "1"); } catch {}
    }
  }, []);

  // --- Initialization ---
  useEffect(() => {
    setHasMounted(true);

    // Identity Management
    try {
      let pid = localStorage.getItem("partyPlayerId");
      if (!pid) {
        pid = crypto.randomUUID();
        localStorage.setItem("partyPlayerId", pid);
      }
      setPlayerId(pid);
    } catch (e) { console.error("Identity setup failed", e); }

    try {
      const savedStats = localStorage.getItem("partyStats_v3");
      if (savedStats) setStats((prev) => ({ ...prev, ...JSON.parse(savedStats) }));
    } catch {}

    try {
      const savedTrophies = localStorage.getItem("partyTrophies_v3");
      if (savedTrophies) setTrophies((prev) => ({ ...prev, ...JSON.parse(savedTrophies) }));
    } catch {}

    try {
      const hasSeenIntro = localStorage.getItem("partyHasSeenIntro_v3");
      if (!hasSeenIntro) setShowInfo(true);
    } catch { setShowInfo(true); }

    (async () => {
      try {
        const res = await fetch("/politicians.json", { cache: "no-store" });
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        const data = await res.json();
        const normalized = data.map((p, idx) => ({ ...p, imageUrl: p.img || p.imageUrl, id: `${p.name}-${idx}` }));
        setAllPoliticians(normalized);
        const shuffled = [...normalized].sort(() => 0.5 - Math.random());
        setCurrent(shuffled[0]);
        recentIds.current.add(shuffled[0].id);
        setLoadingQueue(shuffled.slice(1, 6));
        startTimeRef.current = Date.now();
      } catch (e) { setFatalError(e?.message); }
    })();
    if (containerRef.current) containerRef.current.focus();
  }, []);

  useEffect(() => {
    if (!hasMounted) return;
    localStorage.setItem("partyStats_v3", JSON.stringify(stats));
  }, [stats, hasMounted]);

  useEffect(() => {
    if (!hasMounted) return;
    localStorage.setItem("partyTrophies_v3", JSON.stringify(trophies));
  }, [trophies, hasMounted]);

  const advanceToNext = useCallback(() => {
    if (allPoliticians.length === 0) return;
    setLoadingQueue((prev) => {
      const nextCard = prev[0];
      let candidate = allPoliticians[Math.floor(Math.random() * allPoliticians.length)];
      let attempts = 0;
      while (recentIds.current.has(candidate.id) && attempts < 20) {
        candidate = allPoliticians[Math.floor(Math.random() * allPoliticians.length)];
        attempts++;
      }
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

  const handleGuess = useCallback(async (guessedParty) => {
    if (gameState !== "guessing" || !current) return;
    const actualParty = current.party;
    const isCorrect = guessedParty === actualParty;
    const now = Date.now();
    const timeTaken = now - (startTimeRef.current || now);
    const validTime = timeTaken < 10000 ? timeTaken : null;
    const isFast = !!validTime && validTime < 1000;
    const newStreak = isCorrect ? stats.streak + 1 : 0;

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      if (isCorrect) navigator.vibrate(10);
      else navigator.vibrate([30, 50, 30]);
    }
    if (!isCorrect) {
      shakeControls.start({ x: [0, -10, 10, -10, 10, 0], transition: { duration: 0.4 } });
    }
    if (isCorrect && newStreak > 0 && newStreak % 10 === 0) {
      await (await import("canvas-confetti")).default({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    }

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
      responseTimes: validTime ? [...stats.responseTimes, validTime] : stats.responseTimes,
    };

    setStats(nextStats);
    setLastResult({ isCorrect, guessedParty, correctParty: actualParty, isFast });
    setGameState("revealed");
    setTimeout(advanceToNext, isCorrect ? 400 : 1600);
  }, [gameState, current, stats, advanceToNext, shakeControls]);

  // Key Bindings
  useEffect(() => {
    const onKeyDown = (e) => {
      if (showInfo || showStats || showTrophyCase || showWrapped) return;
      if (gameState !== "guessing") return;
      if (e.key === "ArrowLeft") { e.preventDefault(); handleGuess("Democrat"); }
      if (e.key === "ArrowRight") { e.preventDefault(); handleGuess("Republican"); }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }
  }, [gameState, showInfo, showStats, showTrophyCase, showWrapped, handleGuess]);

  if (fatalError) return <div className="p-10 text-center font-bold">Error: {fatalError}</div>;
  if (!hasMounted || !current) return <LoadingScreen message="Loading..." />;

  return (
    <div ref={containerRef} tabIndex={0} className={`fixed inset-0 w-full h-[100dvh] ${bgColor} text-[#1D1D1F] font-sans overflow-hidden transition-colors duration-500 overscroll-none touch-none focus:outline-none`}>
      <Head>
        <title>Guess The Party</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      <Analytics />

      {/* Background Noise */}
      <div className="absolute inset-0 opacity-40 pointer-events-none mix-blend-soft-light" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

      <AnimatePresence>{toast && <Toast message={toast} />}</AnimatePresence>

      <div className="mx-auto max-w-2xl px-4 md:px-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] h-full flex flex-col relative z-10">
        {/* Header */}
        <header className="mb-4 mt-4 shrink-0 flex justify-center">
          <Glass className="px-5 py-3 rounded-full flex items-center justify-between w-full max-w-lg">
            <h1 className="text-sm font-black uppercase tracking-tighter">🇺🇸 Guess the Party</h1>
            <div className="flex items-center gap-2">
              <IconButton onClick={() => setShowInfo(true)} ariaLabel="Info"><Info size={18} /></IconButton>
              <button onClick={() => setShowWrapped(true)} className="h-10 px-5 bg-black text-white rounded-2xl shadow-sm hover:bg-black/80 active:scale-95 transition-transform flex items-center">
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Rank</span>
              </button>
            </div>
          </Glass>
        </header>

        {/* Main Game Area */}
        <main className="flex-grow flex flex-col items-center justify-center relative touch-none select-none py-2">
          {/* Card Stack */}
          <div className="relative w-full max-w-[400px] flex-grow flex flex-col max-h-[75vh]">
             <div className="relative flex-grow w-full">
                {/* Preload Image */}
                {loadingQueue[0] && <div className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"><Image src={loadingQueue[0].imageUrl} fill alt="preload" sizes="400px" priority /></div>}

                <AnimatePresence mode="wait">
                  <motion.div
                    key={current.id}
                    drag={gameState === "guessing" ? "x" : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.6} // Added Spring Feel
                    style={{ x, rotate }}
                    animate={revealed && !lastResult?.isCorrect ? shakeControls : {}}
                    onDragEnd={(e, i) => {
                      if (i.offset.x < -80) handleGuess("Democrat");
                      else if (i.offset.x > 80) handleGuess("Republican");
                    }}
                    className="absolute inset-0 rounded-[2.5rem] overflow-hidden border-[6px] border-white bg-white shadow-2xl cursor-grab active:cursor-grabbing flex flex-col"
                  >
                    <motion.div className="absolute inset-0 z-10 pointer-events-none" style={{ backgroundColor: swipeBg }} />

                    {!revealed && (
                      <>
                        <motion.div style={{ opacity: demStampOpacity, scale: demStampScale }} className="absolute top-8 right-8 z-20 pointer-events-none border-4 border-blue-500 text-blue-500 px-4 py-1 rounded-xl font-black text-3xl -rotate-12 uppercase tracking-tighter">Dem</motion.div>
                        <motion.div style={{ opacity: repStampOpacity, scale: repStampScale }} className="absolute top-8 left-8 z-20 pointer-events-none border-4 border-red-500 text-red-500 px-4 py-1 rounded-xl font-black text-3xl rotate-12 uppercase tracking-tighter">Rep</motion.div>
                      </>
                    )}

                    <div className="relative flex-grow bg-gray-50 overflow-hidden w-full h-full">
                      {imgLoading && <div className="absolute inset-0 flex items-center justify-center z-30 bg-white/50 backdrop-blur-sm"><Loader2 className="animate-spin text-black/20" size={32} /></div>}
                      <Image src={current.imageUrl} onLoadingComplete={() => setImgLoading(false)} alt="Politician" fill priority className={`object-contain transition-all duration-500 ${revealed ? "scale-105" : "scale-100"}`} />

                      {revealed && (
                         <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} className="absolute inset-x-0 bottom-0 z-40 flex flex-col items-center justify-end text-center pb-8 pt-32 bg-gradient-to-t from-black/90 via-black/60 to-transparent text-white">
                           <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-lg ${lastResult?.isCorrect ? "bg-emerald-500" : "bg-rose-500"}`}>
                             {lastResult?.isCorrect ? <Check size={32} strokeWidth={4} /> : <XCircle size={32} strokeWidth={3} />}
                           </div>
                           <h2 className="text-3xl font-black uppercase tracking-tighter leading-none px-4 mb-2">{current.name}</h2>
                           <Pill className={`${current.party === "Democrat" ? "bg-blue-500" : "bg-red-500"} text-white border-none`}>{current.party}</Pill>
                         </motion.div>
                      )}
                    </div>

                    <div className="relative shrink-0 h-32 px-5 py-4 bg-white flex flex-col justify-between z-50">
                      <div className="grid grid-cols-2 gap-3 h-12">
                        <button onClick={() => handleGuess("Democrat")} disabled={revealed} className="rounded-xl bg-blue-50 text-blue-600 border border-blue-100 font-black text-xs uppercase tracking-widest hover:bg-blue-100 active:scale-95 transition-all disabled:opacity-50">Democrat</button>
                        <button onClick={() => handleGuess("Republican")} disabled={revealed} className="rounded-xl bg-red-50 text-red-600 border border-red-100 font-black text-xs uppercase tracking-widest hover:bg-red-100 active:scale-95 transition-all disabled:opacity-50">Republican</button>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                         <button onClick={() => setShowStats(true)} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black">View Stats</button>
                         <button onClick={() => { if(confirm("Reset?")) setStats({ correct: 0, total: 0, streak: 0, bestStreak: 0, demGuesses: 0, repGuesses: 0, demCorrect: 0, repCorrect: 0, responseTimes: [] }); }} className="p-2 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200"><RefreshCw size={14} /></button>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
             </div>
          </div>
        </main>
      </div>

      <AnimatePresence>
        {/* Info Modal */}
        {showInfo && (
          <Modal onClose={closeInfoModal}>
             <div className="text-center space-y-6 py-4">
               <h3 className="text-2xl font-black uppercase tracking-tighter">How to Play</h3>
               <div className="flex justify-center gap-8">
                 <div className="flex flex-col items-center gap-2">
                   <div className="h-12 w-12 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg"><ArrowLeft size={24} /></div>
                   <span className="text-xs font-black uppercase tracking-widest">Democrat</span>
                 </div>
                 <div className="flex flex-col items-center gap-2">
                   <div className="h-12 w-12 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg"><ArrowRight size={24} /></div>
                   <span className="text-xs font-black uppercase tracking-widest">Republican</span>
                 </div>
               </div>
               <button onClick={closeInfoModal} className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-transform">Start Guessing</button>
             </div>
          </Modal>
        )}

        {/* Standard Stats Modal */}
        {showStats && (
          <Modal onClose={() => setShowStats(false)}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black uppercase tracking-tighter">Your Session</h2>
              <IconButton onClick={() => setShowStats(false)} ariaLabel="Close"><XCircle size={20} /></IconButton>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                <div className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Accuracy</div>
                <div className="text-4xl font-black">{accuracy}%</div>
                <div className="flex gap-2 mt-4">
                  <div className="flex-1 h-2 bg-blue-200 rounded-full overflow-hidden"><div style={{ width: `${(stats.demCorrect / (stats.demGuesses || 1)) * 100}%` }} className="h-full bg-blue-500" /></div>
                  <div className="flex-1 h-2 bg-red-200 rounded-full overflow-hidden"><div style={{ width: `${(stats.repCorrect / (stats.repGuesses || 1)) * 100}%` }} className="h-full bg-red-500" /></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-center">
                   <div className="text-[9px] font-black uppercase tracking-widest text-gray-400">Streak</div>
                   <div className="text-2xl font-black mt-1">{stats.streak}</div>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-center">
                   <div className="text-[9px] font-black uppercase tracking-widest text-gray-400">Total</div>
                   <div className="text-2xl font-black mt-1">{stats.total}</div>
                </div>
              </div>
            </div>
          </Modal>
        )}

        {/* Community / Wrapped Modal (The Big Update) */}
        {showWrapped && (
           <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setShowWrapped(false)}>
             <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto bg-white rounded-[2.5rem] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
               <div className="flex justify-between items-start mb-6">
                 <div className="flex flex-col">
                   <h2 className="text-2xl font-black uppercase tracking-tighter">Community Rank</h2>
                   <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Player ID: {playerId?.slice(0, 8)}</span>
                 </div>
                 <IconButton onClick={() => setShowWrapped(false)} ariaLabel="Close"><XCircle size={20} /></IconButton>
               </div>

               {/* Stats Overview */}
               <div className="grid grid-cols-2 gap-3 mb-2">
                 <div className="bg-black text-white rounded-2xl p-4">
                    <div className="text-[9px] font-black uppercase tracking-widest opacity-60">Accuracy</div>
                    <div className="text-3xl font-black">{accuracy}%</div>
                 </div>
                 <div className="bg-gray-100 rounded-2xl p-4 border border-gray-200">
                    <div className="text-[9px] font-black uppercase tracking-widest text-gray-400">Best Streak</div>
                    <div className="text-3xl font-black text-gray-900">{stats.bestStreak}</div>
                 </div>
               </div>

               {/* The Sophisticated Histogram */}
               <CommunityRank stats={stats} />

               {/* Share Button */}
               <button onClick={() => { navigator.clipboard.writeText(`My Party IQ: ${accuracy}% (Top ${calculatePercentile(accuracy, MOCK_BACKEND_DATA.accuracyDistribution)}%)\nRank: ${rank.title}`); showToast("Copied Stats!"); }} className="w-full mt-6 py-4 bg-black text-white rounded-2xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 active:scale-95 transition-transform">
                 <Share2 size={16} /> Share Rank
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
      <Loader2 className="animate-spin text-blue-600" size={40} />
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">{message}</p>
    </div>
  );
}

function Modal({ children, onClose }) {
  useEffect(() => {
    if (typeof document !== "undefined") { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = "unset"; }; }
  }, []);
  return (
    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 md:p-6" onClick={onClose}>
      <motion.div initial={{ y: 20, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0, scale: 0.95 }} className="w-full max-w-md max-h-[85vh] overflow-y-auto bg-white rounded-[2rem] shadow-2xl p-6 md:p-8" onClick={(e) => e.stopPropagation()}>
        {children}
      </motion.div>
    </div>
  );
}