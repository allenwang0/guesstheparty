// pages/index.js
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Head from "next/head";
import { Analytics } from "@vercel/analytics/react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import {
  RefreshCcw,
  Loader2,
  Check,
  X as XIcon,
  Share2,
  Flame,
  Info,
  Timer,
  Target,
  Award,
  Trophy,
  Keyboard,
  Zap,
  Star,
  ShieldCheck,
} from "lucide-react";

/* ----------------------------- Assets & Icons ---------------------------- */

const DonkeyIcon = ({ className }) => (
  <img
    src="https://upload.wikimedia.org/wikipedia/commons/9/93/Democratic_Disc.svg"
    alt="Democratic Logo"
    className={className}
  />
);

const ElephantIcon = ({ className }) => (
  <img
    src="https://upload.wikimedia.org/wikipedia/commons/e/ec/Republican_Disc.png"
    alt="Republican Logo"
    className={className}
  />
);

const StarFlair = ({ className }) => (
  <motion.span
    initial={{ opacity: 0, scale: 0 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
    className={`text-yellow-400 pointer-events-none absolute ${className}`}
  >
    ★
  </motion.span>
);

const Pill = ({ children, className = "" }) => (
  <span
    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${className}`}
  >
    {children}
  </span>
);

const GlassCard = ({ children, className = "" }) => (
  <div
    className={[
      "rounded-[2.25rem] border border-white/60 bg-white/70 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.10)]",
      className,
    ].join(" ")}
  >
    {children}
  </div>
);

const StatTile = ({ icon, label, value, sub, accent = "border-blue-500" }) => (
  <div className={`rounded-[1.75rem] bg-white p-5 shadow-sm border border-black/5 ${accent}`}>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="h-9 w-9 rounded-2xl bg-black/5 flex items-center justify-center">{icon}</div>
        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-400">{label}</div>
      </div>
      {sub ? <div className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-400">{sub}</div> : null}
    </div>
    <div className="mt-4 text-3xl font-black tracking-tight leading-none">{value}</div>
  </div>
);

/* -------------------------------- Trophies ------------------------------ */

const TROPHY_KEY = "partyTrophies_v1";

const TROPHIES = [
  {
    id: "first_correct",
    title: "First Blood",
    desc: "Get your first correct guess.",
    icon: <Star size={18} />,
    tier: "bronze",
    check: ({ stats }) => (stats.correct || 0) >= 1,
  },
  {
    id: "streak_5",
    title: "Warm Streak",
    desc: "Reach a 5 streak.",
    icon: <Flame size={18} />,
    tier: "bronze",
    check: ({ stats }) => (stats.bestStreak || 0) >= 5,
  },
  {
    id: "streak_10",
    title: "Campaign Staff",
    desc: "Reach a 10 streak.",
    icon: <Award size={18} />,
    tier: "silver",
    check: ({ stats }) => (stats.bestStreak || 0) >= 10,
  },
  {
    id: "streak_25",
    title: "Party Operator",
    desc: "Reach a 25 streak.",
    icon: <ShieldCheck size={18} />,
    tier: "gold",
    check: ({ stats }) => (stats.bestStreak || 0) >= 25,
  },
  {
    id: "streak_50",
    title: "Floor Leader",
    desc: "Reach a 50 streak.",
    icon: <Trophy size={18} />,
    tier: "platinum",
    check: ({ stats }) => (stats.bestStreak || 0) >= 50,
  },
  {
    id: "seen_50",
    title: "Caucus Regular",
    desc: "See 50 politicians.",
    icon: <Target size={18} />,
    tier: "bronze",
    check: ({ stats }) => (stats.total || 0) >= 50,
  },
  {
    id: "seen_200",
    title: "Capitol Fixture",
    desc: "See 200 politicians.",
    icon: <Trophy size={18} />,
    tier: "gold",
    check: ({ stats }) => (stats.total || 0) >= 200,
  },
  {
    id: "accuracy_80_50",
    title: "Solid Read",
    desc: "80% accuracy with at least 50 seen.",
    icon: <Award size={18} />,
    tier: "silver",
    check: ({ stats }) => {
      const total = stats.total || 0;
      const acc = total ? (stats.correct || 0) / total : 0;
      return total >= 50 && acc >= 0.8;
    },
  },
  {
    id: "accuracy_90_100",
    title: "Polling Wizard",
    desc: "90% accuracy with at least 100 seen.",
    icon: <Trophy size={18} />,
    tier: "platinum",
    check: ({ stats }) => {
      const total = stats.total || 0;
      const acc = total ? (stats.correct || 0) / total : 0;
      return total >= 100 && acc >= 0.9;
    },
  },
  {
    id: "speed_2s_50",
    title: "Rapid Fire",
    desc: "Average under 2.0s with at least 50 seen.",
    icon: <Zap size={18} />,
    tier: "gold",
    check: ({ stats }) => {
      const total = stats.total || 0;
      const avg = total ? (stats.totalTime || 0) / total / 1000 : Infinity;
      return total >= 50 && avg < 2.0;
    },
  },
];

function tierStyles(tier) {
  switch (tier) {
    case "bronze":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "silver":
      return "bg-slate-50 text-slate-700 border-slate-200";
    case "gold":
      return "bg-yellow-50 text-yellow-800 border-yellow-200";
    case "platinum":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

/* ----------------------------- Main Application -------------------------- */

export default function Home() {
  const [allPoliticians, setAllPoliticians] = useState([]);
  const [current, setCurrent] = useState(null);
  const [loadingQueue, setLoadingQueue] = useState([]);
  const [hasMounted, setHasMounted] = useState(false);

  const [stats, setStats] = useState({
    correct: 0,
    total: 0,
    streak: 0,
    bestStreak: 0,
    demGuesses: 0,
    repGuesses: 0,
    demCorrect: 0,
    repCorrect: 0,
    totalTime: 0,
  });

  const [trophies, setTrophies] = useState({
    unlocked: [], // list of trophy ids
    firstUnlockedAt: {}, // id -> timestamp
  });

  const [gameState, setGameState] = useState("guessing");
  const [imgLoading, setImgLoading] = useState(true);
  const [startTime, setStartTime] = useState(null);

  const [showInstructions, setShowInstructions] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showWrapped, setShowWrapped] = useState(false);
  const [showTrophyCase, setShowTrophyCase] = useState(false);

  const [lastResult, setLastResult] = useState(null); // { isCorrect, guessedParty, correctParty }
  const revealTimeoutRef = useRef(null);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-14, 14]);
  const swipeBg = useTransform(x, [-160, 0, 160], ["rgba(0,174,243,0.14)", "rgba(0,0,0,0)", "rgba(232,27,35,0.14)"]);

  /* ------------------------------ Derived data ------------------------------ */

  const accuracy = useMemo(() => {
    const total = stats.total || 0;
    return total === 0 ? 0 : Math.round(((stats.correct || 0) / total) * 100);
  }, [stats]);

  const avgSpeed = useMemo(() => {
    const total = stats.total || 0;
    return total === 0 ? 0 : ((stats.totalTime || 0) / total / 1000).toFixed(1);
  }, [stats]);

  const rank = useMemo(() => {
    const s = stats.bestStreak || 0;
    if (s >= 50) return { title: "Speaker of the House", color: "text-indigo-600" };
    if (s >= 30) return { title: "Party Whip", color: "text-red-600" };
    if (s >= 20) return { title: "Senior Senator", color: "text-blue-600" };
    if (s >= 10) return { title: "Campaign Manager", color: "text-green-600" };
    if (s >= 5) return { title: "Staffer", color: "text-amber-700" };
    return { title: "Political Intern", color: "text-gray-500" };
  }, [stats.bestStreak]);

  const unlockedSet = useMemo(() => new Set(trophies.unlocked || []), [trophies.unlocked]);
  const unlockedCount = trophies.unlocked?.length || 0;

  /* ------------------------------ Load + Persist ----------------------------- */

  useEffect(() => {
    setHasMounted(true);

    // Load game stats
    const savedStats = typeof window !== "undefined" ? localStorage.getItem("partyStats") : null;
    if (savedStats) {
      try {
        setStats((prev) => ({ ...prev, ...JSON.parse(savedStats) }));
      } catch {}
    }

    // Load trophies (DO NOT reset on game reset)
    const savedTrophies = typeof window !== "undefined" ? localStorage.getItem(TROPHY_KEY) : null;
    if (savedTrophies) {
      try {
        setTrophies((prev) => ({ ...prev, ...JSON.parse(savedTrophies) }));
      } catch {}
    }

    // Instructions
    const dismissed = typeof window !== "undefined" ? localStorage.getItem("instructionsDismissed") : null;
    if (!dismissed) setShowInstructions(true);

    // Load politicians
    fetch("/politicians.json")
      .then((res) => res.json())
      .then((data) => {
        const normalized = (data || []).map((p) => ({ ...p, imageUrl: p.img || p.image_url }));
        setAllPoliticians(normalized);

        const shuffled = [...normalized].sort(() => 0.5 - Math.random());
        setCurrent(shuffled[0] || null);
        setLoadingQueue(shuffled.slice(1, 11));
        setStartTime(Date.now());
      });
  }, []);

  useEffect(() => {
    if (!hasMounted) return;
    localStorage.setItem("partyStats", JSON.stringify(stats));
  }, [stats, hasMounted]);

  useEffect(() => {
    if (!hasMounted) return;
    localStorage.setItem(TROPHY_KEY, JSON.stringify(trophies));
  }, [trophies, hasMounted]);

  // Preload queued images
  useEffect(() => {
    if (!loadingQueue?.length) return;
    loadingQueue.forEach((p) => {
      if (!p?.imageUrl) return;
      const img = new Image();
      img.src = p.imageUrl;
    });
  }, [loadingQueue]);

  // Cleanup reveal timer
  useEffect(() => {
    return () => {
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
    };
  }, []);

  /* ------------------------------ Trophy unlocking --------------------------- */

  const maybeUnlockTrophies = useCallback(
    (nextStats) => {
      const newlyUnlocked = [];
      const nextUnlocked = new Set(trophies.unlocked || []);
      const firstUnlockedAt = { ...(trophies.firstUnlockedAt || {}) };
      const now = Date.now();

      for (const t of TROPHIES) {
        if (nextUnlocked.has(t.id)) continue;
        if (t.check({ stats: nextStats })) {
          nextUnlocked.add(t.id);
          newlyUnlocked.push(t.id);
          firstUnlockedAt[t.id] = now;
        }
      }

      if (newlyUnlocked.length) {
        setTrophies({
          unlocked: Array.from(nextUnlocked),
          firstUnlockedAt,
        });
      }
    },
    [trophies.unlocked, trophies.firstUnlockedAt]
  );

  /* -------------------------------- Game logic ------------------------------ */

  const advanceToNext = useCallback(() => {
    const next = loadingQueue[0];
    if (!next) return;

    setCurrent(next);
    setLoadingQueue((prev) => {
      const tail = prev.slice(1);
      const random =
        allPoliticians.length > 0
          ? allPoliticians[Math.floor(Math.random() * allPoliticians.length)]
          : null;
      return [...tail, random].filter(Boolean);
    });

    setGameState("guessing");
    setImgLoading(true);
    setStartTime(Date.now());
    setLastResult(null);
    x.set(0);
  }, [loadingQueue, allPoliticians, x]);

  const handleGuess = useCallback(
    (party) => {
      if (gameState !== "guessing" || !current) return;

      const correctParty = current.party;
      const isCorrect = party === correctParty;
      const isDem = correctParty === "Democrat";
      const timeTaken = Date.now() - (startTime || Date.now());

      const nextStats = (() => {
        const s = stats;
        const nextStreak = isCorrect ? (s.streak || 0) + 1 : 0;
        const nextBest = isCorrect ? Math.max(nextStreak, s.bestStreak || 0) : s.bestStreak || 0;

        return {
          ...s,
          total: (s.total || 0) + 1,
          correct: isCorrect ? (s.correct || 0) + 1 : s.correct || 0,
          streak: nextStreak,
          bestStreak: nextBest,
          demGuesses: isDem ? (s.demGuesses || 0) + 1 : s.demGuesses || 0,
          repGuesses: !isDem ? (s.repGuesses || 0) + 1 : s.repGuesses || 0,
          demCorrect: isDem && isCorrect ? (s.demCorrect || 0) + 1 : s.demCorrect || 0,
          repCorrect: !isDem && isCorrect ? (s.repCorrect || 0) + 1 : s.repCorrect || 0,
          totalTime: (s.totalTime || 0) + timeTaken,
        };
      })();

      setStats(nextStats);
      maybeUnlockTrophies(nextStats);

      setLastResult({ isCorrect, guessedParty: party, correctParty });
      setGameState("revealed");

      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = setTimeout(() => {
        advanceToNext();
      }, 1400);
    },
    [gameState, current, startTime, stats, maybeUnlockTrophies, advanceToNext]
  );

  // Keyboard controls (desktop polish)
  useEffect(() => {
    const onKeyDown = (e) => {
      if (showStats || showWrapped || showInstructions || showTrophyCase) return;
      if (gameState !== "guessing") return;

      if (e.key === "ArrowLeft") handleGuess("Democrat");
      if (e.key === "ArrowRight") handleGuess("Republican");
      if (e.key.toLowerCase() === "i") setShowInstructions(true);
      if (e.key.toLowerCase() === "s") setShowStats(true);
      if (e.key.toLowerCase() === "t") setShowTrophyCase(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [gameState, handleGuess, showStats, showWrapped, showInstructions, showTrophyCase]);

  const resetGameStatsOnly = useCallback(() => {
    if (!confirm("Reset game stats? (Trophies will stay.)")) return;

    localStorage.removeItem("partyStats");
    // keep instructions dismissed flag as-is; change if you want:
    // localStorage.removeItem("instructionsDismissed");

    setStats({
      correct: 0,
      total: 0,
      streak: 0,
      bestStreak: 0,
      demGuesses: 0,
      repGuesses: 0,
      demCorrect: 0,
      repCorrect: 0,
      totalTime: 0,
    });
  }, []);

  if (!hasMounted || !current) return <LoadingScreen message="Convening Congress..." />;

  return (
    <div className="min-h-screen w-full bg-[#F5F5F7] text-[#1D1D1F] font-sans">
      <Head>
        <title>Guess The Party | Allen Wang</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Analytics />

      <div className="mx-auto max-w-6xl px-4 md:px-8 py-6 md:py-8">
        {/* Header */}
        <header className="sticky top-0 z-30 pb-4 md:pb-6">
          <GlassCard className="px-5 md:px-7 py-5 md:py-6 rounded-[2.75rem]">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col">
                <h1 className="text-xl md:text-2xl font-black tracking-tighter uppercase leading-[0.9] flex items-center gap-2">
                  <span className="text-lg">🇺🇸</span>
                  GUESS THE PARTY
                  <span className="text-lg">🇺🇸</span>
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Pill className="bg-black/5 text-gray-600 border border-black/10">
                    <Keyboard size={14} className="opacity-70" />
                    ← Dem • → Rep • S Stats • T Trophies • I Help
                  </Pill>
                  <Pill className="bg-white text-gray-600 border border-black/10">
                    Created by <span className="text-black">Allen Wang</span>
                  </Pill>
                </div>
              </div>

              <div className="flex items-center gap-2 md:gap-3">
                <button
                  onClick={() => setShowInstructions(true)}
                  className="h-11 w-11 rounded-2xl bg-white border border-black/10 shadow-sm active:scale-95 transition-transform flex items-center justify-center"
                  aria-label="How to play"
                >
                  <Info size={18} className="text-gray-500" />
                </button>

                <button
                  onClick={() => setShowTrophyCase(true)}
                  className="h-11 rounded-2xl px-4 bg-white border border-black/10 shadow-sm active:scale-95 transition-transform flex items-center gap-2"
                >
                  <Trophy size={18} className="text-amber-600" />
                  <span className="text-[11px] font-black uppercase tracking-[0.18em]">Trophies</span>
                  <span className="ml-1 text-[11px] font-black tabular-nums text-gray-500">
                    {unlockedCount}/{TROPHIES.length}
                  </span>
                </button>

                <button
                  onClick={() => setShowStats(true)}
                  className="h-11 rounded-2xl px-5 bg-black text-white shadow-sm active:scale-95 transition-transform"
                >
                  <span className="text-[11px] font-black uppercase tracking-[0.22em]">Stats</span>
                </button>
              </div>
            </div>
          </GlassCard>
        </header>

        {/* Main responsive layout */}
        <div className="md:grid md:grid-cols-[1fr_auto_1fr] md:gap-8 md:items-start">
          {/* Left Rail */}
          <div className="hidden md:block">
            <div className="sticky top-[110px] space-y-4">
              <GlassCard className="p-6">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-black uppercase tracking-[0.22em] text-gray-500">Now</div>
                  <Pill className="bg-black/5 text-gray-600 border border-black/10">
                    <Timer size={14} className="opacity-70" /> {avgSpeed}s avg
                  </Pill>
                </div>
                <div className="mt-5">
                  <div className="text-4xl font-black tracking-tight leading-none">{stats.streak || 0}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-400">
                      Current streak
                    </div>
                    {(stats.streak || 0) >= 5 ? <Flame size={16} className="text-orange-500 fill-orange-500" /> : null}
                  </div>
                </div>

                <div className="mt-6 rounded-[1.75rem] border border-black/5 bg-white p-5">
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-400">Rank</div>
                  <div className={`mt-2 text-xl font-black tracking-tight ${rank.color}`}>{rank.title}</div>
                  <div className="mt-4 text-[10px] font-black uppercase tracking-[0.22em] text-gray-400">
                    Best streak: <span className="text-black tabular-nums">{stats.bestStreak || 0}</span>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <div className="text-[11px] font-black uppercase tracking-[0.22em] text-gray-500">Tip</div>
                <div className="mt-3 text-sm font-bold text-gray-700 leading-relaxed">
                  Drag the card or use arrow keys. Photos can be deceptive—hair, lighting, age, and committee headshots will
                  try to trick you.
                </div>
              </GlassCard>
            </div>
          </div>

          {/* Center: Game Card */}
          <main className="flex justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.name}
                drag={gameState === "guessing" ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                style={{ x, rotate }}
                onDragEnd={(e, i) => {
                  if (i.offset.x < -80) handleGuess("Democrat");
                  else if (i.offset.x > 80) handleGuess("Republican");
                }}
                className={[
                  "relative w-full",
                  "max-w-[440px] md:max-w-[560px] lg:max-w-[620px]",
                  "h-[72dvh] md:h-[74vh] lg:h-[78vh]",
                  "rounded-[3rem] overflow-hidden",
                  "border border-white shadow-[0_24px_80px_rgba(0,0,0,0.18)] bg-white",
                  "cursor-grab active:cursor-grabbing",
                ].join(" ")}
              >
                {/* Swipe tint */}
                <motion.div className="absolute inset-0 z-0" style={{ backgroundColor: swipeBg }} />

                {/* Image Area */}
                <div className="relative z-10 flex-grow min-h-0 bg-[#fbfbfb] flex items-center justify-center overflow-hidden">
                  {imgLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/70 backdrop-blur">
                      <Loader2 className="animate-spin text-blue-500" size={34} />
                    </div>
                  ) : null}

                  <img
                    src={current.imageUrl}
                    onLoad={() => setImgLoading(false)}
                    className={[
                      "w-full h-full transition-all duration-700",
                      "object-cover md:object-contain object-top",
                      gameState === "revealed" ? "scale-110 blur-2xl brightness-[0.35]" : "scale-100",
                    ].join(" ")}
                    alt={current.name}
                  />

                  {/* Reveal overlay */}
                  {gameState === "revealed" ? (
                    <motion.div
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute inset-0 z-30 flex flex-col items-center justify-center text-center p-8"
                    >
                      <div
                        className={[
                          "w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-xl",
                          lastResult?.isCorrect ? "bg-emerald-500" : "bg-rose-500",
                        ].join(" ")}
                      >
                        {lastResult?.isCorrect ? (
                          <Check size={34} className="text-white" strokeWidth={3.5} />
                        ) : (
                          <XIcon size={34} className="text-white" strokeWidth={3.5} />
                        )}
                      </div>

                      <div className="space-y-2">
                        <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter leading-none">
                          {current.name}
                        </h2>

                        <div className="pt-4 flex flex-col items-center gap-2">
                          <Pill
                            className={[
                              "border border-white/10",
                              current.party === "Democrat" ? "bg-blue-600 text-white" : "bg-red-600 text-white",
                            ].join(" ")}
                          >
                            {current.party}
                          </Pill>

                          <div className="text-white/50 text-[10px] font-black uppercase tracking-[0.34em]">
                            {current.state}
                          </div>

                          {!lastResult?.isCorrect ? (
                            <div className="mt-2 text-white/70 text-[11px] font-bold">
                              You picked{" "}
                              <span className="font-black">{lastResult?.guessedParty}</span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </motion.div>
                  ) : null}
                </div>

                {/* Controls */}
                <div className="relative z-10 p-4 md:p-5 grid grid-cols-2 gap-4 bg-white border-t border-black/5">
                  <button
                    onClick={() => handleGuess("Democrat")}
                    disabled={gameState === "revealed"}
                    className={[
                      "h-16 md:h-[72px] rounded-2xl",
                      "bg-[#00AEF3] text-white",
                      "font-black text-xs uppercase tracking-widest",
                      "active:scale-95 transition-transform",
                      "disabled:opacity-60 disabled:active:scale-100",
                    ].join(" ")}
                  >
                    Democrat
                  </button>

                  <button
                    onClick={() => handleGuess("Republican")}
                    disabled={gameState === "revealed"}
                    className={[
                      "h-16 md:h-[72px] rounded-2xl",
                      "bg-[#E81B23] text-white",
                      "font-black text-xs uppercase tracking-widest",
                      "active:scale-95 transition-transform",
                      "disabled:opacity-60 disabled:active:scale-100",
                    ].join(" ")}
                  >
                    Republican
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Right Rail */}
          <div className="hidden md:block">
            <div className="sticky top-[110px] space-y-4">
              <GlassCard className="p-6">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-black uppercase tracking-[0.22em] text-gray-500">Session</div>
                  <button
                    onClick={resetGameStatsOnly}
                    className="h-10 w-10 rounded-2xl bg-rose-50 text-rose-500 border border-rose-100 shadow-sm active:rotate-180 transition-transform duration-500 flex items-center justify-center"
                    aria-label="Reset stats"
                  >
                    <RefreshCcw size={18} />
                  </button>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4">
                  <div className="rounded-[1.75rem] bg-white border border-black/5 p-5">
                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-400">Accuracy</div>
                    <div className="mt-2 text-3xl font-black tabular-nums">{accuracy}%</div>
                  </div>

                  <div className="rounded-[1.75rem] bg-white border border-black/5 p-5">
                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-400">Seen</div>
                    <div className="mt-2 text-3xl font-black tabular-nums">{stats.total || 0}</div>
                  </div>
                </div>

                <div className="mt-4 rounded-[1.75rem] bg-white border border-black/5 p-5">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-400">Trophies</div>
                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-400 tabular-nums">
                      {unlockedCount}/{TROPHIES.length}
                    </div>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-black/5 overflow-hidden">
                    <div
                      className="h-full bg-amber-400"
                      style={{ width: `${Math.round((unlockedCount / TROPHIES.length) * 100)}%` }}
                    />
                  </div>
                  <button
                    onClick={() => setShowTrophyCase(true)}
                    className="mt-4 w-full h-11 rounded-2xl bg-black text-white font-black uppercase tracking-[0.22em] text-[11px] active:scale-95 transition-transform flex items-center justify-center gap-2"
                  >
                    <Trophy size={16} />
                    Open Trophy Case
                  </button>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <div className="text-[11px] font-black uppercase tracking-[0.22em] text-gray-500">Quick actions</div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setShowStats(true)}
                    className="h-11 rounded-2xl bg-white border border-black/10 shadow-sm font-black uppercase tracking-[0.22em] text-[10px] active:scale-95 transition-transform"
                  >
                    Stats
                  </button>
                  <button
                    onClick={() => setShowWrapped(true)}
                    className="h-11 rounded-2xl bg-white border border-black/10 shadow-sm font-black uppercase tracking-[0.22em] text-[10px] active:scale-95 transition-transform flex items-center justify-center gap-2"
                  >
                    <Share2 size={14} className="text-gray-700" />
                    Wrapped
                  </button>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>

        {/* Mobile Footer HUD */}
        <div className="md:hidden mt-6">
          <GlassCard className="px-5 py-5 rounded-[2.75rem]">
            <div className="flex items-center justify-between">
              <div className="flex gap-8">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.22em]">Streak</span>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-black text-blue-600 leading-none tabular-nums">{stats.streak || 0}</span>
                    {(stats.streak || 0) >= 5 ? <Flame size={18} className="text-orange-500 fill-orange-500" /> : null}
                  </div>
                </div>

                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.22em]">Accuracy</span>
                  <span className="text-3xl font-black leading-none tabular-nums">{accuracy}%</span>
                </div>
              </div>

              <button
                onClick={resetGameStatsOnly}
                className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-500 border border-rose-100 shadow-sm active:rotate-180 transition-transform duration-500 flex items-center justify-center"
              >
                <RefreshCcw size={18} />
              </button>
            </div>

            <button
              onClick={() => setShowTrophyCase(true)}
              className="mt-4 w-full h-12 rounded-2xl bg-black text-white font-black uppercase tracking-[0.22em] text-[11px] active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              <Trophy size={16} />
              Trophy Case ({unlockedCount}/{TROPHIES.length})
            </button>
          </GlassCard>
        </div>
      </div>

      {/* ------------------------------- Overlays ------------------------------- */}
      <AnimatePresence>
        {showInstructions ? (
          <ModalOverlay onClose={() => setShowInstructions(false)}>
            <div className="relative">
              <StarFlair className="top-6 left-8" />
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-3xl font-black italic uppercase tracking-tighter">How to Play</h3>
                <button
                  onClick={() => setShowInstructions(false)}
                  className="h-10 w-10 rounded-2xl bg-black/5 border border-black/10 active:scale-95 transition-transform flex items-center justify-center"
                >
                  <XIcon size={18} className="text-gray-600" />
                </button>
              </div>

              <div className="mt-8 space-y-5">
                <HowRow n="1" color="bg-blue-600" text={<>Swipe <span className="text-blue-600">left</span> for Democrats</>} />
                <HowRow n="2" color="bg-red-600" text={<>Swipe <span className="text-red-600">right</span> for Republicans</>} />
                <div className="rounded-[1.75rem] bg-white border border-black/5 p-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-black/5 flex items-center justify-center">
                      <Keyboard size={18} className="text-gray-700" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-400">Desktop</div>
                      <div className="mt-1 text-sm font-bold text-gray-700">Use ← / →. Press S for stats, T for trophies.</div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  localStorage.setItem("instructionsDismissed", "true");
                  setShowInstructions(false);
                }}
                className="mt-8 w-full h-14 rounded-2xl bg-black text-white font-black uppercase tracking-[0.22em] text-[12px] active:scale-95 transition-transform"
              >
                Start Playing
              </button>
            </div>
          </ModalOverlay>
        ) : null}

        {showStats ? (
          <ModalOverlay onClose={() => setShowStats(false)}>
            <div className="relative">
              <StarFlair className="top-6 left-8" />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter">Dossier</h2>
                  <div className="mt-2 flex items-center gap-2">
                    <Pill className="bg-white border border-black/10 text-gray-600">
                      <Award size={14} className={`${rank.color} opacity-90`} />
                      <span className={`${rank.color}`}>{rank.title}</span>
                    </Pill>
                    <Pill className="bg-white border border-black/10 text-gray-600">
                      <Trophy size={14} className="text-amber-600 opacity-90" />
                      {unlockedCount}/{TROPHIES.length}
                    </Pill>
                  </div>
                </div>

                <button
                  onClick={() => setShowStats(false)}
                  className="h-10 w-10 rounded-2xl bg-black/5 border border-black/10 active:scale-95 transition-transform flex items-center justify-center"
                >
                  <XIcon size={18} className="text-gray-600" />
                </button>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <StatTile
                  icon={<Target size={18} className="text-gray-700" />}
                  label="Total Seen"
                  value={<span className="tabular-nums">{stats.total || 0}</span>}
                  accent="border-b-4 border-blue-500"
                />
                <StatTile
                  icon={<Award size={18} className="text-gray-700" />}
                  label="Best Streak"
                  value={<span className="tabular-nums">{stats.bestStreak || 0}</span>}
                  accent="border-b-4 border-indigo-500"
                />
                <StatTile
                  icon={<Timer size={18} className="text-gray-700" />}
                  label="Avg Speed"
                  value={
                    <span className="tabular-nums">
                      {avgSpeed}
                      <span className="text-base font-black text-gray-500">s</span>
                    </span>
                  }
                  accent="border-b-4 border-emerald-500"
                />
                <StatTile
                  icon={<Flame size={18} className="text-gray-700" />}
                  label="Accuracy"
                  value={<span className="tabular-nums">{accuracy}%</span>}
                  accent="border-b-4 border-rose-500"
                />
              </div>

              <div className="mt-6 rounded-[2.25rem] bg-white border border-black/5 p-6">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-black uppercase tracking-[0.22em] text-gray-500">Party breakdown</div>
                  <button
                    onClick={() => setShowTrophyCase(true)}
                    className="h-10 rounded-2xl px-4 bg-black text-white font-black uppercase tracking-[0.22em] text-[10px] active:scale-95 transition-transform flex items-center gap-2"
                  >
                    <Trophy size={14} />
                    Trophy Case
                  </button>
                </div>

                <div className="mt-5 space-y-5">
                  <StatBar label="Democrat Accuracy" current={stats.demCorrect} total={stats.demGuesses} color="bg-blue-500" />
                  <StatBar label="Republican Accuracy" current={stats.repCorrect} total={stats.repGuesses} color="bg-red-500" />
                </div>

                <div className="mt-6 rounded-[1.75rem] border border-black/5 bg-[#F5F5F7] p-5">
                  <div className="grid grid-cols-3 gap-3 items-center">
                    <div className="flex items-center gap-2">
                      <DonkeyIcon className="w-10 h-10 object-contain" />
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-400">Guesses</div>
                        <div className="text-lg font-black tabular-nums">{stats.demGuesses || 0}</div>
                      </div>
                    </div>

                    <div className="h-9 w-[1px] bg-black/10 mx-auto" />

                    <div className="flex items-center justify-end gap-2">
                      <div className="text-right">
                        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-400">Guesses</div>
                        <div className="text-lg font-black tabular-nums">{stats.repGuesses || 0}</div>
                      </div>
                      <ElephantIcon className="w-10 h-10 object-contain" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setShowStats(false);
                    setShowWrapped(true);
                  }}
                  className="h-14 rounded-2xl bg-black text-white font-black uppercase tracking-[0.22em] text-[11px] active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                  <Share2 size={16} />
                  View Wrapped
                </button>

                <button
                  onClick={resetGameStatsOnly}
                  className="h-14 rounded-2xl bg-white border border-black/10 shadow-sm font-black uppercase tracking-[0.22em] text-[11px] active:scale-95 transition-transform flex items-center justify-center gap-2 text-rose-600"
                >
                  <RefreshCcw size={16} />
                  Reset Stats
                </button>
              </div>
            </div>
          </ModalOverlay>
        ) : null}

        {showTrophyCase ? (
          <ModalOverlay onClose={() => setShowTrophyCase(false)} maxW="max-w-2xl">
            <div className="relative">
              <StarFlair className="top-6 left-8" />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter">Trophy Case</h2>
                  <div className="mt-2 flex items-center gap-2">
                    <Pill className="bg-white border border-black/10 text-gray-600">
                      <Trophy size={14} className="text-amber-600 opacity-90" />
                      <span className="tabular-nums">{unlockedCount}</span> / {TROPHIES.length} unlocked
                    </Pill>
                    <Pill className="bg-black/5 border border-black/10 text-gray-600">
                      Does not reset with game stats
                    </Pill>
                  </div>
                </div>

                <button
                  onClick={() => setShowTrophyCase(false)}
                  className="h-10 w-10 rounded-2xl bg-black/5 border border-black/10 active:scale-95 transition-transform flex items-center justify-center"
                >
                  <XIcon size={18} className="text-gray-600" />
                </button>
              </div>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                {TROPHIES.map((t) => {
                  const unlocked = unlockedSet.has(t.id);
                  return (
                    <div
                      key={t.id}
                      className={[
                        "rounded-[2rem] border p-5 shadow-sm",
                        unlocked ? "bg-white border-black/5" : "bg-[#F5F5F7] border-black/10",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={[
                              "h-11 w-11 rounded-2xl flex items-center justify-center border",
                              unlocked ? tierStyles(t.tier) : "bg-white/50 text-gray-400 border-black/10",
                            ].join(" ")}
                          >
                            {t.icon}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="text-base font-black tracking-tight">{t.title}</div>
                              <span
                                className={[
                                  "text-[9px] font-black uppercase tracking-[0.22em] px-2 py-1 rounded-full border",
                                  tierStyles(t.tier),
                                ].join(" ")}
                              >
                                {t.tier}
                              </span>
                            </div>
                            <div className="mt-1 text-sm font-bold text-gray-600">{t.desc}</div>
                          </div>
                        </div>

                        <div className="pt-1">
                          {unlocked ? (
                            <Pill className="bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Check size={14} /> unlocked
                            </Pill>
                          ) : (
                            <Pill className="bg-white text-gray-500 border border-black/10">locked</Pill>
                          )}
                        </div>
                      </div>

                      {unlocked && trophies.firstUnlockedAt?.[t.id] ? (
                        <div className="mt-4 text-[10px] font-black uppercase tracking-[0.22em] text-gray-400">
                          First unlocked:{" "}
                          <span className="text-gray-600">
                            {new Date(trophies.firstUnlockedAt[t.id]).toLocaleString()}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 rounded-[2rem] bg-white border border-black/5 p-5">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-black uppercase tracking-[0.22em] text-gray-500">Progress</div>
                  <div className="text-[11px] font-black uppercase tracking-[0.22em] text-gray-500 tabular-nums">
                    {Math.round((unlockedCount / TROPHIES.length) * 100)}%
                  </div>
                </div>
                <div className="mt-3 h-2 rounded-full bg-black/5 overflow-hidden">
                  <div className="h-full bg-amber-400" style={{ width: `${(unlockedCount / TROPHIES.length) * 100}%` }} />
                </div>
                <div className="mt-4 text-sm font-bold text-gray-600">
                  Tip: trophies are earned from your lifetime performance, even if you reset the current game stats.
                </div>
              </div>
            </div>
          </ModalOverlay>
        ) : null}

        {showWrapped ? (
          <div
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6"
            onClick={() => setShowWrapped(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative w-full max-w-sm aspect-[9/16] bg-gradient-to-b from-[#1c1c1e] to-black rounded-[3rem] p-10 flex flex-col border border-white/10 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowWrapped(false)}
                className="absolute top-8 right-8 h-10 w-10 bg-white/10 backdrop-blur-xl rounded-2xl z-50 active:scale-90 transition-transform flex items-center justify-center"
              >
                <XIcon size={18} className="text-white" />
              </button>

              <div className="flex-grow pt-10 text-white">
                <h3 className="text-5xl font-black leading-[0.85] tracking-tighter mb-10">
                  POLITICAL
                  <br />
                  <span className="text-blue-500 italic font-serif text-4xl">wrapped</span>
                </h3>

                <div className="space-y-9 relative">
                  <div>
                    <p className="text-[10px] font-black text-white/40 uppercase mb-2 tracking-[0.22em]">Your identity</p>
                    <p className="text-3xl font-black uppercase leading-tight">{rank.title}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-black text-white/40 uppercase mb-1 tracking-[0.22em]">Accuracy</p>
                      <p className="text-3xl font-black tabular-nums">{accuracy}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-white/40 uppercase mb-1 tracking-[0.22em]">Max streak</p>
                      <p className="text-3xl font-black text-blue-500 tabular-nums">{stats.bestStreak || 0}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-black text-white/40 uppercase mb-1 tracking-[0.22em]">Seen</p>
                      <p className="text-3xl font-black tabular-nums">{stats.total || 0}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-white/40 uppercase mb-1 tracking-[0.22em]">Trophies</p>
                      <p className="text-3xl font-black tabular-nums">{unlockedCount}</p>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-white/10 flex justify-between items-center px-4">
                    <DonkeyIcon className="w-14 h-14 object-contain brightness-125 contrast-125" />
                    <div className="h-10 w-[1px] bg-white/10" />
                    <ElephantIcon className="w-14 h-14 object-contain brightness-125 contrast-125" />
                  </div>
                </div>
              </div>

              <div className="text-center pt-8">
                <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em]">
                  🇺🇸 Guess the Party • Allen Wang 🇺🇸
                </p>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/* -------------------------------- Helpers -------------------------------- */

function HowRow({ n, color, text }) {
  return (
    <div className="rounded-[1.75rem] bg-white border border-black/5 p-5">
      <div className="flex items-center gap-4">
        <span className={`w-9 h-9 ${color} text-white rounded-2xl flex items-center justify-center font-black`}>
          {n}
        </span>
        <p className="text-sm font-bold text-gray-700">{text}</p>
      </div>
    </div>
  );
}

function StatBar({ label, current, total, color }) {
  const pct = !total ? 0 : Math.round(((current || 0) / total) * 100);
  return (
    <div>
      <div className="flex justify-between text-[10px] font-black mb-2 uppercase tracking-[0.18em]">
        <span className="text-gray-600">{label}</span>
        <span className="text-gray-400 tabular-nums">{pct}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden border border-black/5">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className={`h-full ${color || "bg-black"}`} />
      </div>
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

function ModalOverlay({ children, onClose, maxW = "max-w-xl" }) {
  return (
    <div
      className="fixed inset-0 z-[100] bg-black/55 backdrop-blur-xl flex items-center justify-center p-4 md:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 18, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        className={`w-full ${maxW} rounded-[3rem] bg-[#F5F5F7] border border-white/20 shadow-[0_30px_120px_rgba(0,0,0,0.40)] p-7 md:p-8`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </div>
  );
}
