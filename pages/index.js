import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Head from "next/head";
import Image from "next/image";
import { Analytics } from "@vercel/analytics/react";
import { motion, AnimatePresence, useMotionValue, useTransform, useAnimation } from "framer-motion";
import html2canvas from "html2canvas";
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
  TrendingUp,
  Download,
  Copy,
  HelpCircle,
  BarChart2
} from "lucide-react";

/* ----------------------------- Static Data ---------------------------- */
const FAKE_DISTRIBUTION = [
  { range: '0-10', count: 2, percentOfPlayers: 1 },
  { range: '10-20', count: 5, percentOfPlayers: 2 },
  { range: '20-30', count: 15, percentOfPlayers: 6 },
  { range: '30-40', count: 30, percentOfPlayers: 12 },
  { range: '40-50', count: 60, percentOfPlayers: 24 },
  { range: '50-60', count: 70, percentOfPlayers: 28 },
  { range: '60-70', count: 40, percentOfPlayers: 16 },
  { range: '70-80', count: 20, percentOfPlayers: 8 },
  { range: '80-90', count: 5, percentOfPlayers: 2 },
  { range: '90-100', count: 1, percentOfPlayers: 1 }
];

/* ----------------------------- Utility Helper ---------------------------- */
function calculatePercentile(userAcc, data) {
  if (!data || data.length === 0) return 0;
  let totalPlayers = 0;
  let playersStrictlyBelow = 0;
  let playersInSameBucket = 0;

  data.forEach(d => totalPlayers += d.count);

  const userBucketIndex = Math.min(Math.floor(userAcc / 10), 9);

  data.forEach((d, i) => {
    if (i < userBucketIndex) {
      playersStrictlyBelow += d.count;
    } else if (i === userBucketIndex) {
      playersInSameBucket += d.count;
    }
  });

  if (totalPlayers === 0) return 0;
  const weightedScore = playersStrictlyBelow + (playersInSameBucket * 0.5);
  return Math.round((weightedScore / totalPlayers) * 100);
}

/* ----------------------------- Utility Components ---------------------------- */
const Glass = ({ children, className = "" }) => (
  <div
    className={[
      "rounded-3xl border border-white/60 bg-white/60 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.04)]",
      className,
    ].join(" ")}
  >
    {children}
  </div>
);

const Pill = ({ children, className = "" }) => (
  <span
    className={[
      "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.20em]",
      className,
    ].join(" ")}
  >
    {children}
  </span>
);

const IconButton = ({ onClick, ariaLabel, children, className = "" }) => (
  <button
    onClick={onClick}
    aria-label={ariaLabel}
    className={[
      "h-10 w-10 rounded-2xl",
      "bg-white/60 border border-black/5 backdrop-blur shadow-sm hover:bg-white/90 active:scale-95 transition-all flex items-center justify-center",
      className,
    ].join(" ")}
  >
    {children}
  </button>
);

const ProgressBar = ({ label, value, color, total }) => (
  <div className="w-full">
    <div className="flex justify-between mb-1">
      <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{label}</span>
      <span className="text-[9px] font-black text-gray-600">
        {Math.round((value / (total || 1)) * 100)}%
      </span>
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

const Toast = ({ message }) => (
  <motion.div
    initial={{ opacity: 0, y: -20, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -20, scale: 0.9 }}
    className="fixed top-24 left-1/2 -translate-x-1/2 z-[150] bg-black/80 backdrop-blur text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 pointer-events-none whitespace-nowrap"
  >
    <span className="text-xs font-bold tracking-widest uppercase">{message}</span>
  </motion.div>
);

/* ----------------------------- Histogram Component ---------------------------- */
const Histogram = ({ userAccuracy, totalGamesPlayed, isDark = false, disableSubmit = false, compact = false }) => {
  const [data, setData] = useState(FAKE_DISTRIBUTION);

  useEffect(() => {
    let isMounted = true;
    const syncStats = async () => {
      try {
        if (!disableSubmit && totalGamesPlayed > 0) {
          await fetch('/api/submit-score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accuracy: userAccuracy }),
          });
        }
        const response = await fetch('/api/get-distribution');
        const result = await response.json();
        if (isMounted && result.distribution) {
          const totalRealPlayers = result.distribution.reduce((acc, curr) => acc + curr.count, 0);
          if (totalRealPlayers > 0) {
            setData(result.distribution);
          }
        }
      } catch (error) {
        console.error("Failed to sync stats", error);
      }
    };
    syncStats();
    return () => { isMounted = false; };
  }, [userAccuracy, totalGamesPlayed, disableSubmit]);

  const maxCount = Math.max(...data.map(d => d.count), 0);
  const containerHeight = compact ? "h-20" : "h-32";

  return (
    <div className={`w-full mt-4 pt-4 border-t ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
      <h3 className={`text-[10px] font-black uppercase tracking-widest mb-3 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
        Global Player Distribution
      </h3>
      <div className={`flex items-end justify-between ${containerHeight} gap-1 mb-2`}>
        {data.map((bucket, i) => {
          const rangeStart = i * 10;
          const isUserBucket = userAccuracy >= rangeStart && userAccuracy < rangeStart + 10;
          const isUser100 = userAccuracy === 100 && i === 9;
          const isActive = isUserBucket || isUser100;
          const barHeight = maxCount > 0 ? (bucket.count / maxCount) * 100 : 0;

          return (
            <div
              key={i}
              className="h-full flex flex-col justify-end items-center gap-1 flex-1 relative"
            >
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${barHeight}%` }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className={`w-full rounded-t-sm relative ${
                  isActive
                    ? 'bg-blue-500'
                    : (isDark ? 'bg-white/10' : 'bg-gray-200')
                }`}
              />
              <span className={`text-[7px] font-bold ${
                isActive
                  ? 'text-blue-500'
                  : (isDark ? 'text-white/20' : 'text-gray-300')
              }`}>
                {i === 0 ? '0' : i === 9 ? '100' : ''}
              </span>
            </div>
          );
        })}
      </div>
      {!compact && (
        <div className={`mt-3 text-center text-xs ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
          You performed better than <span className={`font-bold ${isDark ? 'text-white' : 'text-black'}`}>{calculatePercentile(userAccuracy, data)}%</span> of players.
        </div>
      )}
    </div>
  );
};

/* ----------------------------- Helper Screens ---------------------------- */
function LoadingScreen({ message }) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F5F5F7] gap-4">
      <Loader2 className="animate-spin text-blue-600" size={40} />
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">{message}</p>
    </div>
  );
}

function ErrorScreen({ title, detail }) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F5F5F7] px-6 text-center gap-3">
      <div className="h-14 w-14 rounded-2xl bg-white border border-black/5 flex items-center justify-center shadow-sm">
        <AlertCircle />
      </div>
      <div className="text-lg font-black tracking-tight">{title}</div>
      {detail && <div className="text-sm text-gray-500 max-w-lg">{detail}</div>}
      <div className="text-xs text-gray-400 mt-2">
        Check that <span className="font-mono">/public/politicians.json</span> is valid JSON (an array).
      </div>
    </div>
  );
}

function Modal({ children, onClose }) {
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "unset";
      };
    }
  }, []);
  return (
    <div
      className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 md:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0, scale: 0.95 }}
        className="w-full max-w-md max-h-[85vh] overflow-y-auto bg-white rounded-[2rem] shadow-2xl p-6 md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </div>
  );
}

/* -------------------------------- Logic & Data ------------------------------ */
const TROPHY_KEY = "partyTrophies_v3";
const INTRO_KEY = "partyHasSeenIntro_v3";
const STATS_KEY = "partyStats_v3";

const TROPHIES = [
  { id: "first_correct", title: "First Blood", desc: "First correct guess.", icon: <Star size={18} />, tier: "bronze", check: ({ stats }) => (stats.correct || 0) >= 1 },
  { id: "streak_5", title: "Warm Streak", desc: "Best streak ≥ 5.", icon: <Flame size={18} />, tier: "bronze", check: ({ stats }) => (stats.bestStreak || 0) >= 5 },
  { id: "streak_10", title: "Campaign Staff", desc: "Best streak ≥ 10.", icon: <Award size={18} />, tier: "silver", check: ({ stats }) => (stats.bestStreak || 0) >= 10 },
  { id: "streak_25", title: "Party Operator", desc: "Best streak ≥ 25.", icon: <ShieldCheck size={18} />, tier: "gold", check: ({ stats }) => (stats.bestStreak || 0) >= 25 },
  { id: "streak_50", title: "Floor Leader", desc: "Best streak ≥ 50.", icon: <Trophy size={18} />, tier: "platinum", check: ({ stats }) => (stats.bestStreak || 0) >= 50 },
  { id: "seen_50", title: "Caucus Regular", desc: "Seen ≥ 50.", icon: <Target size={18} />, tier: "bronze", check: ({ stats }) => (stats.total || 0) >= 50 },
  { id: "seen_200", title: "Capitol Fixture", desc: "Seen ≥ 200.", icon: <Trophy size={18} />, tier: "gold", check: ({ stats }) => (stats.total || 0) >= 200 },
  {
    id: "accuracy_80_50",
    title: "Solid Read",
    desc: "≥80% accuracy with ≥50 seen.",
    icon: <Award size={18} />,
    tier: "silver",
    check: ({ stats }) => {
      const t = stats.total || 0;
      return t >= 50 && (stats.correct / t) >= 0.8;
    },
  },
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
  if (!revealed) return base;
  if (p?.state) return `${base} • ${p.state}`;
  return base;
}

async function fireConfettiSafe() {
  if (typeof window === "undefined") return;
  const mod = await import("canvas-confetti");
  const confetti = mod?.default || mod;
  if (typeof confetti === "function") {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
    });
  }
}

const RANK_TIERS = [
  { title: "Speaker", min: 110000 },
  { title: "Party Whip", min: 100000 },
  { title: "Senior Senator", min: 90000 },
  { title: "Campaign Manager", min: 80000 },
  { title: "Staffer", min: 70000 },
  { title: "Intern", min: 0 },
];

/* ----------------------------- Main Application -------------------------- */
export default function Home() {
  const [allPoliticians, setAllPoliticians] = useState([]);
  const [current, setCurrent] = useState(null);
  const [loadingQueue, setLoadingQueue] = useState([]);
  const [hasMounted, setHasMounted] = useState(false);
  const [fatalError, setFatalError] = useState(null);
  const containerRef = useRef(null);
  const wrappedRef = useRef(null);

  // Logic Refs
  const recentIds = useRef(new Set());
  const startTimeRef = useRef(null);

  // UX State
  const [toast, setToast] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showScoreDetails, setShowScoreDetails] = useState(false);
  const [showWrapped, setShowWrapped] = useState(false);
  const [showTrophyCase, setShowTrophyCase] = useState(false);
  const shakeControls = useAnimation();

  // Game State
  const [gameState, setGameState] = useState("guessing");
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
    guessedDemActualRep: 0,
    guessedRepActualDem: 0,
    responseTimes: [],
    totalTime: 0,
    demTime: 0,
    repTime: 0,
  });
  const [trophies, setTrophies] = useState({ unlocked: [], firstUnlockedAt: {} });

  // Motion
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const swipeBg = useTransform(
    x,
    [-150, 0, 150],
    ["rgba(59, 130, 246, 0.15)", "rgba(255,255,255,0)", "rgba(239, 68, 68, 0.15)"]
  );

  const demStampOpacity = useTransform(x, [0, -60], [0, 1]);
  const demStampScale = useTransform(x, [0, -60], [2, 1]);
  const repStampOpacity = useTransform(x, [0, 60], [0, 1]);
  const repStampScale = useTransform(x, [0, 60], [2, 1]);

  const unlockedCount = trophies.unlocked?.length || 0;
  const unlockedSet = useMemo(() => new Set(trophies.unlocked || []), [trophies.unlocked]);

  const accuracy = useMemo(
    () => (stats.total === 0 ? 0 : Math.round((stats.correct / stats.total) * 100)),
    [stats]
  );

  const medianSpeed = useMemo(() => {
    if (stats.responseTimes.length === 0) return "0.0";
    const sorted = [...stats.responseTimes].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const ms =
      sorted.length % 2 !== 0
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;
    return (ms / 1000).toFixed(1);
  }, [stats.responseTimes]);

  const rank = useMemo(() => {
    if (stats.total < 20) {
      return { title: "Unranked", score: 0, nextGoal: 20 - stats.total };
    }

    const rawScore =
      (accuracy * 1000) +
      (stats.bestStreak * 40) +
      (Math.log1p(stats.total) * 200);

    const score = Math.round(rawScore);

    let title = "Intern";
    if (score >= 110000) title = "Speaker";
    else if (score >= 100000) title = "Party Whip";
    else if (score >= 90000) title = "Senior Senator";
    else if (score >= 80000) title = "Campaign Manager";
    else if (score >= 70000) title = "Staffer";

    return { title, score };
  }, [stats.total, accuracy, stats.bestStreak]);

  const bestGuessedParty = useMemo(() => {
    const demAcc = stats.demGuesses > 0 ? (stats.demCorrect / stats.demGuesses) : 0;
    const repAcc = stats.repGuesses > 0 ? (stats.repCorrect / stats.repGuesses) : 0;
    if (demAcc >= repAcc) {
      return {
        name: "Democrats",
        img: "https://upload.wikimedia.org/wikipedia/commons/9/93/Democratic_Disc.svg",
        color: "text-blue-500",
        value: Math.round(demAcc * 100)
      };
    } else {
      return {
        name: "Republicans",
        img: "https://upload.wikimedia.org/wikipedia/commons/e/ec/Republican_Disc.png",
        color: "text-red-500",
        value: Math.round(repAcc * 100)
      };
    }
  }, [stats]);

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
      try {
        localStorage.setItem(INTRO_KEY, "1");
      } catch {}
    }
  }, []);

  // --- DOWNLOAD LOGIC (Updated for CORS + Mobile Share) ---
  const handleDownloadWrapped = async () => {
    if (!wrappedRef.current) return;
    try {
        showToast("Generating image...");

        // Wait 100ms to ensure all images/fonts are settled
        await new Promise(resolve => setTimeout(resolve, 100));

        const canvas = await html2canvas(wrappedRef.current, {
            scale: 2,
            useCORS: true,
            allowTaint: false,
            backgroundColor: null,
            logging: false,
        });

        // 1. Try Native Sharing (Best for Mobile)
        canvas.toBlob(async (blob) => {
            if (!blob) throw new Error("Canvas is empty");
            const file = new File([blob], "GuessTheParty-Wrapped.png", { type: "image/png" });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        files: [file],
                        title: 'My Party IQ',
                        text: 'Can you beat my score?',
                    });
                    showToast("Shared successfully!");
                } catch (shareError) {
                    if (shareError.name !== 'AbortError') {
                        console.error(shareError);
                        triggerDownload(canvas); // Fallback if share actually fails
                    }
                }
            } else {
                 // 2. Fallback to classic download (Desktop)
                triggerDownload(canvas);
            }
        }, 'image/png');

    } catch (e) {
        console.error("Export failed", e);
        showToast("Download failed. Screenshot instead?");
    }
  };

  const triggerDownload = (canvas) => {
      try {
        const image = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = image;
        link.download = `GuessTheParty-Wrapped-2025.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("Saved to Photos");
      } catch(e) {
         console.error("DataURL failed", e);
         showToast("Save failed. Try screenshotting.");
      }
  }

  // --- Initialization ---
  useEffect(() => {
    setHasMounted(true);
    try {
      const savedStats = localStorage.getItem(STATS_KEY);
      if (savedStats) setStats((prev) => ({ ...prev, ...JSON.parse(savedStats) }));
    } catch {}
    try {
      const savedTrophies = localStorage.getItem(TROPHY_KEY);
      if (savedTrophies) setTrophies((prev) => ({ ...prev, ...JSON.parse(savedTrophies) }));
    } catch {}
    try {
      const hasSeenIntro = localStorage.getItem(INTRO_KEY);
      if (!hasSeenIntro) setShowInfo(true);
    } catch {
      setShowInfo(true);
    }
    (async () => {
      try {
        const res = await fetch("/politicians.json", { cache: "no-store" });
        if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
        const data = await res.json();
        if (!Array.isArray(data)) {
          throw new Error("politicians.json must be a JSON array.");
        }
        const normalized = data.map((p, idx) => {
          const imageUrl = p?.img || p?.image_url || p?.imageUrl;
          const name = p?.name || `Unknown #${idx + 1}`;
          const party = p?.party;
          const id = `${name}-${party}-${p?.state || ""}-${idx}`;
          return { ...p, imageUrl, id };
        });
        const bad = normalized.find((p) => !p.imageUrl || !p.party || !p.name);
        if (bad) throw new Error("Every entry must include name, party, and img.");
        setAllPoliticians(normalized);
        const shuffled = [...normalized].sort(() => 0.5 - Math.random());
        setCurrent(shuffled[0]);
        recentIds.current.add(shuffled[0].id);
        setLoadingQueue(shuffled.slice(1, 6));
        startTimeRef.current = Date.now();
      } catch (e) {
        setFatalError(e?.message || "Failed to load politicians.");
      }
    })();
    if (containerRef.current) containerRef.current.focus();
  }, []);

  useEffect(() => {
    if (!hasMounted) return;
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch {}
  }, [stats, hasMounted]);

  useEffect(() => {
    if (!hasMounted) return;
    try {
      localStorage.setItem(TROPHY_KEY, JSON.stringify(trophies));
    } catch {}
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

  const handleGuess = useCallback(
    async (guessedParty) => {
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
          shakeControls.start({
              x: [0, -10, 10, -10, 10, 0],
              transition: { duration: 0.4 }
          });
      }

      if (isCorrect && newStreak > 0 && newStreak % 10 === 0) {
        await fireConfettiSafe();
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
        guessedDemActualRep:
          guessedParty === "Democrat" && !isCorrect ? stats.guessedDemActualRep + 1 : stats.guessedDemActualRep,
        guessedRepActualDem:
          guessedParty === "Republican" && !isCorrect ? stats.guessedRepActualDem + 1 : stats.guessedRepActualDem,
        totalTime: stats.totalTime + (validTime || 0),
        responseTimes: validTime ? [...stats.responseTimes, validTime] : stats.responseTimes,
      };

      const resultObj = { isCorrect, guessedParty, correctParty: actualParty, isFast };

      const nextUnlocked = new Set(trophies.unlocked || []);
      let unlockedSomething = false;
      for (const t of TROPHIES) {
        if (!nextUnlocked.has(t.id) && t.check({ stats: nextStats, lastResult: resultObj })) {
          nextUnlocked.add(t.id);
          unlockedSomething = true;
        }
      }

      if (unlockedSomething) {
        setTrophies((prev) => ({
          ...prev,
          unlocked: Array.from(nextUnlocked),
        }));
        showToast("Trophy Unlocked!");
      }

      setStats(nextStats);
      setLastResult(resultObj);
      setGameState("revealed");

      const delay = isCorrect ? 2000 : 3000;
      setTimeout(advanceToNext, delay);
    },
    [gameState, current, stats, trophies, advanceToNext, shakeControls]
  );

  useEffect(() => {
    const onKeyDown = (e) => {
      if (showInfo || showStats || showTrophyCase || showWrapped) return;
      if (gameState !== "guessing") return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleGuess("Democrat");
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        handleGuess("Republican");
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }
  }, [gameState, showInfo, showStats, showTrophyCase, showWrapped, handleGuess]);

  const handleReset = () => {
    if (typeof window !== "undefined" && confirm("Reset run stats? (Trophies will persist)")) {
      setStats({
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
        totalTime: 0,
        responseTimes: [],
        demTime: 0,
        repTime: 0,
      });
      setGameState("guessing");
      x.set(0);
    }
  };

  const copyStats = async () => {
    const text = `🇺🇸 Guess The Party\nRank: ${rank.title}\nScore: ${rank.score}\nAccuracy: ${accuracy}%\nBest Streak: ${stats.bestStreak}\n\nguesstheparty.com`;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        showToast("Copied to clipboard!");
      } else {
        showToast("Clipboard not available");
      }
    } catch (err) {
      console.error("Copy failed", err);
      showToast("Failed to copy");
    }
  };

  if (fatalError) return <ErrorScreen title="App failed to start" detail={fatalError} />;
  if (!hasMounted || !current) return <LoadingScreen message="Loading..." />;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className={`fixed inset-0 w-full h-[100dvh] ${bgColor} text-[#1D1D1F] font-sans overflow-hidden transition-colors duration-500 overscroll-none touch-none focus:outline-none`}
    >
      <Head>
        <title>Guess The Party | Allen Wang</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🇺🇸</text></svg>"
        />
      </Head>
      <Analytics />
      <div
        className="absolute inset-0 opacity-40 pointer-events-none mix-blend-soft-light"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      <AnimatePresence>{toast && <Toast message={toast} />}</AnimatePresence>

      <div className="mx-auto max-w-2xl px-4 md:px-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] h-full flex flex-col relative z-20">
        {/* Header */}
        <header className="mb-4 mt-4 shrink-0 flex justify-center relative z-50">
          <Glass className="px-5 py-3 rounded-full flex items-center justify-between w-full max-w-lg">
            <div className="flex flex-col items-start pr-4">
              <h1 className="text-sm md:text-base font-black uppercase tracking-tighter leading-none whitespace-nowrap">
                🇺🇸 Guess the Party
              </h1>
              <div className="w-full flex justify-between px-[1px] mt-0.5 opacity-40">
                {"ALLEN WANG".split("").map((char, i) => (
                  <span key={i} className="text-[8px] font-black">
                    {char === " " ? "\u00A0" : char}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <IconButton onClick={() => setShowInfo(true)} ariaLabel="Info">
                <Info size={18} />
              </IconButton>
              <button
                onClick={() => setShowStats(true)}
                className="h-10 px-5 bg-black text-white rounded-2xl shadow-sm hover:bg-black/80 active:scale-95 transition-transform flex items-center justify-center min-w-[80px]"
              >
                {stats.total > 0 ? (
                  <div className="flex items-center gap-1.5">
                    <BarChart2 size={12} className="text-white/60" />
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] tabular-nums">
                      {accuracy}%
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Stats</span>
                )}
              </button>
            </div>
          </Glass>
        </header>

        {/* Main Game Area */}
        <main className="flex-grow flex flex-col items-center justify-center relative touch-none select-none py-2">
          {/* Hints */}
          {stats.total === 0 && !revealed && (
            <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none max-w-[420px] mx-auto z-0 opacity-40">
              <div className="flex flex-col items-center gap-2">
                <ArrowLeft size={24} />
                <span className="text-[9px] font-black uppercase tracking-widest">Dem</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <ArrowRight size={24} />
                <span className="text-[9px] font-black uppercase tracking-widest">Rep</span>
              </div>
            </div>
          )}

          {/* Card Stack */}
          <div className="relative w-full max-w-[400px] flex-grow flex flex-col max-h-[75vh]">
            <div className="relative flex-grow w-full">
              {loadingQueue[0] && (
                <div className="absolute inset-0 w-full h-full opacity-0 pointer-events-none">
                  <Image src={loadingQueue[0].imageUrl} fill alt="preload" sizes="400px" priority />
                </div>
              )}
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.id}
                  drag={gameState === "guessing" ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
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
                      <motion.div
                        style={{ opacity: demStampOpacity, scale: demStampScale }}
                        className="absolute top-8 right-8 z-20 pointer-events-none border-4 border-blue-500 text-blue-500 px-4 py-1 rounded-xl font-black text-3xl -rotate-12 uppercase tracking-tighter"
                      >
                        Dem
                      </motion.div>
                      <motion.div
                        style={{ opacity: repStampOpacity, scale: repStampScale }}
                        className="absolute top-8 left-8 z-20 pointer-events-none border-4 border-red-500 text-red-500 px-4 py-1 rounded-xl font-black text-3xl rotate-12 uppercase tracking-tighter"
                      >
                        Rep
                      </motion.div>
                    </>
                  )}

                  <div className="relative flex-grow bg-gray-50 overflow-hidden w-full h-full">
                    {imgLoading && (
                      <div className="absolute inset-0 flex items-center justify-center z-30 bg-white/50 backdrop-blur-sm">
                        <Loader2 className="animate-spin text-black/20" size={32} />
                      </div>
                    )}
                    <Image
                      src={current.imageUrl}
                      onLoadingComplete={() => setImgLoading(false)}
                      alt="Politician"
                      fill
                      priority
                      className={`object-cover transition-all duration-500 ${
                        revealed ? "scale-105" : "scale-100"
                      }`}
                    />
                    {revealed && (
                      <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute inset-x-0 bottom-0 z-40 flex flex-col items-center justify-end text-center pb-8 pt-32 bg-gradient-to-t from-black/90 via-black/60 to-transparent text-white"
                      >
                        <div
                          className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-lg ${
                            lastResult?.isCorrect ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                        >
                          {lastResult?.isCorrect ? <Check size={32} strokeWidth={4} /> : <XCircle size={32} strokeWidth={3} />}
                        </div>
                        <div className="space-y-1">
                          <div className="text-white/70 text-[10px] font-black uppercase tracking-[0.25em]">
                            {formatOffice(current, true)}
                          </div>
                          <h2 className="text-3xl font-black uppercase tracking-tighter leading-none px-4">{current.name}</h2>
                          <div className="flex items-center justify-center gap-2 pt-2">
                            <Pill className={`${current.party === "Democrat" ? "bg-blue-500" : "bg-red-500"} text-white border-none`}>
                              {current.party}
                            </Pill>
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

                  {/* Controls - FIXED: cursor-auto and stopPropagation */}
                  <div
                    className="relative shrink-0 h-32 px-5 py-4 bg-white flex flex-col justify-between z-50 cursor-auto"
                    onPointerDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                  >
                    <div className="grid grid-cols-2 gap-3 h-12">
                      <button
                        onClick={() => handleGuess("Democrat")}
                        disabled={revealed}
                        className="rounded-xl bg-blue-50 text-blue-600 border border-blue-100 font-black text-xs uppercase tracking-widest hover:bg-blue-100 active:scale-95 transition-all disabled:opacity-50"
                      >
                        Democrat
                      </button>
                      <button
                        onClick={() => handleGuess("Republican")}
                        disabled={revealed}
                        className="rounded-xl bg-red-50 text-red-600 border border-red-100 font-black text-xs uppercase tracking-widest hover:bg-red-100 active:scale-95 transition-all disabled:opacity-50"
                      >
                        Republican
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <button
                        onClick={() => setShowTrophyCase(true)}
                        className="flex items-center gap-2 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-100/50 px-4 py-2.5 rounded-xl transition-all active:scale-95"
                      >
                        <Trophy size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          {unlockedCount}/{TROPHIES.length}
                        </span>
                      </button>
                      <button
                        onClick={handleReset}
                        className="p-2.5 bg-gray-100 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-xl transition-all active:scale-95"
                      >
                        <RefreshCw size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </main>
      </div>

      <AnimatePresence>
        {showInfo && (
          <Modal onClose={closeInfoModal}>
            <div className="text-center space-y-5 py-2">
              <h3 className="text-xl font-black uppercase tracking-tight leading-none">
                Can you tell political leanings from a picture?
              </h3>
              <p className="text-sm font-medium text-gray-600 max-w-[260px] mx-auto leading-relaxed">
                Swipe or use arrow keys to guess.
                <br />
              </p>
              <div className="grid grid-cols-2 gap-4">
                 {/* Left Tile */}
                 <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex flex-col items-center gap-2">
                    <div className="h-8 w-8 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-sm">
                      <ArrowLeft size={16} strokeWidth={3} />
                    </div>
                    <div className="leading-none">
                      <div className="text-[10px] font-black uppercase tracking-widest text-blue-300">Left</div>
                      <div className="text-sm font-black uppercase text-blue-600">Democrat</div>
                    </div>
                 </div>
                 {/* Right Tile */}
                 <div className="bg-red-50/50 border border-red-100 rounded-2xl p-4 flex flex-col items-center gap-2">
                    <div className="h-8 w-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm">
                      <ArrowRight size={16} strokeWidth={3} />
                    </div>
                    <div className="leading-none">
                      <div className="text-[10px] font-black uppercase tracking-widest text-red-300">Right</div>
                      <div className="text-sm font-black uppercase text-red-600">Republican</div>
                    </div>
                 </div>
              </div>
              <button
                onClick={closeInfoModal}
                className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs active:scale-95 transition-transform shadow-xl"
              >
                Let's Play
              </button>
            </div>
          </Modal>
        )}

        {showStats && (
          <Modal onClose={() => setShowStats(false)}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tighter">Performance</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Pill className={`bg-black text-white`}>{rank.title}</Pill>
                  {rank.title === "Unranked" && (
                     <span className="text-[9px] font-bold text-gray-400 tracking-widest uppercase">
                       {rank.nextGoal} more to rank
                     </span>
                  )}
                </div>
              </div>
              <IconButton onClick={() => setShowStats(false)} ariaLabel="Close">
                <XCircle size={20} />
              </IconButton>
            </div>

            {/* Political Capital Score Section - UPDATED WITH EXPLANATION TOGGLE */}
             <div className="mb-4 bg-gradient-to-br from-gray-900 to-black rounded-3xl p-5 text-white relative overflow-hidden">
                <div className="relative z-10 flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                       <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Political Capital</span>
                       <button onClick={() => setShowScoreDetails(!showScoreDetails)} className="opacity-50 hover:opacity-100 transition-opacity">
                          <HelpCircle size={12} />
                       </button>
                    </div>
                    <div className="text-4xl font-black tracking-tighter tabular-nums">
                      {rank.score.toLocaleString()}
                    </div>
                  </div>
                  <div className="h-10 w-10 bg-white/10 rounded-full flex items-center justify-center">
                    <TrendingUp size={20} />
                  </div>
                </div>

                {/* Conditional Info Section */}
                <AnimatePresence>
                  {showScoreDetails && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="relative z-10 mt-3 pt-3 border-t border-white/10 text-xs text-white/70 space-y-1"
                    >
                      <p>Score = Accuracy + Streak + Experience.</p>
                      <ul className="list-disc pl-4 space-y-0.5 opacity-80 text-[10px]">
                        <li><b>Accuracy</b> gives the most points.</li>
                        <li><b>Streaks</b> provide bonus multipliers.</li>
                        <li><b>Total Games</b> adds a loyalty bonus.</li>
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
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
            </div>

            <Histogram userAccuracy={accuracy} totalGamesPlayed={stats.total} />

            {/* Career Ladder Legend */}
            <div className="mt-6 pt-6 border-t border-gray-100">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Career Ladder</h3>
               <div className="space-y-2">
                  {RANK_TIERS.map((tier) => {
                    const isCurrent = rank.title === tier.title;
                    const isPassed = rank.score >= tier.min;
                    return (
                      <div key={tier.title} className={`flex items-center justify-between text-xs ${isCurrent ? 'opacity-100' : 'opacity-40'}`}>
                         <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${isPassed ? 'bg-black' : 'bg-gray-200'}`} />
                            <span className="font-bold uppercase tracking-wide">{tier.title}</span>
                         </div>
                         <span className="font-mono text-[10px]">{tier.min > 0 ? `${(tier.min / 1000)}k+` : '0+'}</span>
                      </div>
                    )
                  })}
               </div>
            </div>

            <button
              onClick={() => {
                setShowStats(false);
                setShowWrapped(true);
              }}
              className="w-full h-14 mt-6 rounded-2xl bg-black text-white flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <Star size={16} className="text-yellow-400 fill-yellow-400" />
              <span className="font-black uppercase tracking-[0.2em] text-xs">Generate Wrapped</span>
            </button>
          </Modal>
        )}

        {showTrophyCase && (
          <Modal onClose={() => setShowTrophyCase(false)}>
            <div className="flex flex-col gap-4 mb-4 pt-2">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-black uppercase tracking-tighter">Trophies</h2>
                <IconButton onClick={() => setShowTrophyCase(false)} ariaLabel="Close">
                  <XCircle size={20} />
                </IconButton>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-grow h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500"
                    style={{ width: `${(unlockedCount / TROPHIES.length) * 100}%` }}
                  />
                </div>
                <div className="text-[10px] font-black uppercase text-gray-400">
                  {unlockedCount}/{TROPHIES.length}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {TROPHIES.map((t) => {
                const unlocked = unlockedSet.has(t.id);
                return (
                  <div
                    key={t.id}
                    className={`p-4 rounded-2xl border flex items-center gap-4 ${
                      unlocked ? "bg-white border-gray-100 shadow-sm" : "bg-gray-50 border-transparent opacity-60 grayscale"
                    }`}
                  >
                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                        unlocked ? tierStyles(t.tier) : "bg-gray-200"
                      }`}
                    >
                      {unlocked ? t.icon : <Lock size={16} />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-black uppercase tracking-tight truncate">{t.title}</div>
                      <div className="text-[10px] font-bold text-gray-400">{t.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Modal>
        )}

        {showWrapped && (
          <div
            className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setShowWrapped(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="relative w-full max-w-sm overflow-hidden bg-white/5 rounded-[2.5rem] p-4 flex flex-col gap-4"
              onClick={(e) => e.stopPropagation()}
            >
                {/* --- WRAPPED CARD (Captured) --- */}
                <div
                    ref={wrappedRef}
                    className="relative bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-[2rem] border border-white/10 p-6 text-white shadow-2xl flex flex-col justify-between aspect-[9/14]"
                >
                    {/* Header */}
                    <div className="flex justify-between items-start border-b border-white/10 pb-4">
                        <div>
                             <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mb-1">Rank</div>
                             <div className="text-2xl font-black uppercase text-blue-400 leading-none">{rank.title}</div>
                             <div className="text-[10px] font-mono opacity-50 mt-1">Score: {rank.score.toLocaleString()}</div>
                        </div>
                        <div className="text-right">
                            {/* Assuming percentile calculation logic from helper */}
                            <div className="text-3xl font-black leading-none">{calculatePercentile(accuracy, FAKE_DISTRIBUTION)}%</div>
                            <div className="text-[9px] font-black uppercase tracking-widest opacity-50 mt-1">Top Percentile</div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-2 my-2">
                        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                            <div className="text-[8px] uppercase tracking-widest opacity-50 mb-1">Accuracy</div>
                            <div className="text-xl font-black">{accuracy}%</div>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                            <div className="text-[8px] uppercase tracking-widest opacity-50 mb-1">Streak</div>
                            <div className="text-xl font-black text-amber-400">{stats.bestStreak}</div>
                        </div>
                    </div>

                    {/* Best Party - IMAGE FIX APPLIED HERE (crossOrigin="anonymous") */}
                    <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex items-center gap-3">
                        <div className="relative h-10 w-10 shrink-0 bg-white rounded-full p-1.5">
                            <img
                              src={bestGuessedParty.img}
                              alt={bestGuessedParty.name}
                              className="w-full h-full object-contain"
                              crossOrigin="anonymous" // <--- CRITICAL FIX FOR DOWNLOAD
                            />
                        </div>
                        <div>
                            <div className="text-[8px] uppercase tracking-widest opacity-50">Best Read</div>
                            <div className={`text-xs font-bold ${bestGuessedParty.color}`}>
                                {bestGuessedParty.name} <span className="opacity-50 text-white font-normal">({bestGuessedParty.value || 0}%)</span>
                            </div>
                        </div>
                    </div>

                    {/* Histogram (Compact) */}
                    <Histogram
                        userAccuracy={accuracy}
                        totalGamesPlayed={stats.total}
                        isDark={true}
                        disableSubmit={true}
                        compact={true}
                    />

                    {/* Footer */}
                    <div className="pt-4 border-t border-white/10 flex justify-between items-end opacity-50">
                         <div>
                            <div className="text-[8px] font-black uppercase tracking-widest">Guess The Party</div>
                            <div className="text-[8px]">2025 Review</div>
                         </div>
                         <div className="text-[8px] font-mono">guesstheparty.com</div>
                    </div>
                </div>
                {/* --- END CAPTURED AREA --- */}

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3">
                     <button
                        onClick={copyStats}
                        className="h-12 bg-white text-black rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
                     >
                        <Copy size={16} /> Copy Text
                     </button>
                     <button
                        onClick={handleDownloadWrapped}
                        className="h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
                     >
                        <Download size={16} /> Save Image
                     </button>
                </div>
                <button
                    onClick={() => setShowWrapped(false)}
                    className="w-full h-12 bg-black/40 text-white/50 hover:text-white rounded-2xl flex items-center justify-center font-black text-xs uppercase tracking-widest transition-colors"
                >
                    Close
                </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}