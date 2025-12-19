import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Head from "next/head";
import { Analytics } from "@vercel/analytics/react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import {
  Loader2,
  Check,
  Info,
  Share2,
  Timer,
  Target,
  Award,
  Trophy,
  Flame,
  Star,
  ShieldCheck,
  Zap,
  XCircle,
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

const Glass = ({ children, className = "" }) => (
  <div
    className={[
      "rounded-3xl border border-white/70 bg-white/70 backdrop-blur-xl",
      "shadow-[0_18px_60px_rgba(0,0,0,0.10)]",
      className,
    ].join(" ")}
  >
    {children}
  </div>
);

const Pill = ({ children, className = "" }) => (
  <span
    className={[
      "inline-flex items-center gap-2 rounded-full px-3 py-1",
      "text-[10px] font-black uppercase tracking-[0.20em]",
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
      "h-10 w-10 rounded-full",
      "bg-white/70 border border-black/10 backdrop-blur",
      "shadow-sm active:scale-95 transition-transform",
      "flex items-center justify-center",
      className,
    ].join(" ")}
  >
    {children}
  </button>
);

/* -------------------------------- Trophies ------------------------------ */

const TROPHY_KEY = "partyTrophies_v1";

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
    case "bronze": return "bg-amber-50 text-amber-800 border-amber-200";
    case "silver": return "bg-slate-50 text-slate-800 border-slate-200";
    case "gold": return "bg-yellow-50 text-yellow-900 border-yellow-200";
    case "platinum": return "bg-indigo-50 text-indigo-800 border-indigo-200";
    default: return "bg-gray-50 text-gray-700 border-gray-200";
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
  const [showInfo, setShowInfo] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showWrapped, setShowWrapped] = useState(false);
  const [showTrophyCase, setShowTrophyCase] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const revealTimeoutRef = useRef(null);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-10, 10]);
  const swipeBg = useTransform(x, [-160, 0, 160], ["rgba(0,174,243,0.10)", "rgba(0,0,0,0)", "rgba(232,27,35,0.10)"]);

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

  useEffect(() => {
    setHasMounted(true);
    const savedStats = localStorage.getItem("partyStats");
    if (savedStats) try { setStats(prev => ({ ...prev, ...JSON.parse(savedStats) })); } catch {}
    const savedTrophies = localStorage.getItem(TROPHY_KEY);
    if (savedTrophies) try { setTrophies(prev => ({ ...prev, ...JSON.parse(savedTrophies) })); } catch {}

    fetch("/politicians.json").then(res => res.json()).then(data => {
      const normalized = (data || []).map(p => ({ ...p, imageUrl: p.img || p.image_url }));
      setAllPoliticians(normalized);
      const shuffled = [...normalized].sort(() => 0.5 - Math.random());
      setCurrent(shuffled[0] || null);
      setLoadingQueue(shuffled.slice(1, 11));
      setStartTime(Date.now());
    });
  }, []);

  useEffect(() => { if (hasMounted) localStorage.setItem("partyStats", JSON.stringify(stats)); }, [stats, hasMounted]);
  useEffect(() => { if (hasMounted) localStorage.setItem(TROPHY_KEY, JSON.stringify(trophies)); }, [trophies, hasMounted]);

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
    if (!next) return;
    setCurrent(next);
    setLoadingQueue(prev => [...prev.slice(1), allPoliticians[Math.floor(Math.random() * allPoliticians.length)]].filter(Boolean));
    setGameState("guessing"); setImgLoading(true); setStartTime(Date.now()); setLastResult(null); x.set(0);
  }, [loadingQueue, allPoliticians, x]);

  const handleGuess = useCallback((party) => {
    if (gameState !== "guessing" || !current) return;
    const isCorrect = party === current.party;
    const isDem = current.party === "Democrat";
    const timeTaken = Date.now() - startTime;
    const nextStats = {
      ...stats,
      total: stats.total + 1,
      correct: isCorrect ? stats.correct + 1 : stats.correct,
      streak: isCorrect ? stats.streak + 1 : 0,
      bestStreak: isCorrect ? Math.max(stats.streak + 1, stats.bestStreak) : stats.bestStreak,
      demGuesses: isDem ? stats.demGuesses + 1 : stats.demGuesses,
      repGuesses: !isDem ? stats.repGuesses + 1 : stats.repGuesses,
      demCorrect: isDem && isCorrect ? stats.demCorrect + 1 : stats.demCorrect,
      repCorrect: !isDem && isCorrect ? stats.repCorrect + 1 : stats.repCorrect,
      totalTime: stats.totalTime + timeTaken,
    };
    setStats(nextStats); maybeUnlockTrophies(nextStats); setLastResult({ isCorrect, guessedParty: party, correctParty: current.party }); setGameState("revealed");
    if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
    revealTimeoutRef.current = setTimeout(advanceToNext, 1100);
  }, [gameState, current, startTime, stats, maybeUnlockTrophies, advanceToNext]);

  if (!hasMounted || !current) return <LoadingScreen message="Loading..." />;

  return (
    <div className="min-h-screen w-full bg-[#F5F5F7] text-[#1D1D1F] font-sans overflow-x-hidden">
      <Head>
        <title>Guess The Party | Allen Wang</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </Head>
      <Analytics />

      <div className="mx-auto max-w-4xl px-4 md:px-8 pt-4 pb-6 md:pt-8">
        <header className="mb-4 md:mb-8">
          <Glass className="px-4 py-3 md:px-5 md:py-4 rounded-[2rem] md:rounded-[2.5rem]">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <h1 className="text-base md:text-xl font-black tracking-tighter uppercase truncate">🇺🇸 Guess the Party</h1>
                <div className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Allen Wang</div>
              </div>
              <div className="flex items-center gap-2">
                <IconButton onClick={() => setShowInfo(true)} ariaLabel="Info" className="h-9 w-9 md:h-11 md:w-11"><Info size={16} /></IconButton>
                <button onClick={() => setShowStats(true)} className="h-9 md:h-11 rounded-xl md:rounded-2xl px-4 md:px-6 bg-black text-white shadow-sm active:scale-95 transition-transform">
                  <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em]">Stats</span>
                </button>
              </div>
            </div>
          </Glass>
        </header>

        <main className="flex justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.name}
              drag={gameState === "guessing" ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              style={{ x, rotate }}
              onDragEnd={(e, i) => { if (i.offset.x < -80) handleGuess("Democrat"); else if (i.offset.x > 80) handleGuess("Republican"); }}
              className="relative w-full max-w-[560px] h-[68vh] md:h-[76vh] max-h-[760px] min-h-[500px] rounded-[2.5rem] overflow-hidden border border-white bg-white shadow-[0_24px_80px_rgba(0,0,0,0.14)]"
            >
              <motion.div className="absolute inset-0 z-0" style={{ backgroundColor: swipeBg }} />
              <div className="relative z-10 h-[75%] md:h-[78%] bg-[#fbfbfb] overflow-hidden">
                {imgLoading && <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/70 backdrop-blur"><Loader2 className="animate-spin text-blue-500" size={34} /></div>}
                <img src={current.imageUrl} onLoad={() => setImgLoading(false)} className={`absolute inset-0 w-full h-full object-contain p-4 transition-all duration-700 ${revealed ? "scale-110 blur-2xl brightness-[0.35]" : "scale-100"}`} alt="Portrait" />
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
                  <button onClick={() => { if(confirm("Reset stats?")) setStats({ correct: 0, total: 0, streak: 0, bestStreak: 0, demGuesses: 0, repGuesses: 0, demCorrect: 0, repCorrect: 0, totalTime: 0 }); }} className="h-8 rounded-xl px-3 text-[9px] font-black uppercase tracking-[0.18em] text-gray-400">Reset</button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Modals & Screens */}
      <AnimatePresence>
        {showInfo && <Modal onClose={() => setShowInfo(false)} maxW="max-w-lg">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-2xl font-black uppercase tracking-tighter">How to Play</h3>
            <IconButton onClick={() => setShowInfo(false)}><XCircle size={20} /></IconButton>
          </div>
          <div className="space-y-4 text-sm font-bold text-gray-700 leading-relaxed">
            <p>A portrait will appear. Your goal is to identify their political party.</p>
            <p>Drag <span className="text-blue-500">left</span> for Democrat, or <span className="text-red-500">right</span> for Republican.</p>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 pt-4">Data via public records</p>
          </div>
        </Modal>}

        {showStats && <Modal onClose={() => setShowStats(false)} maxW="max-w-2xl">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter">Your Stats</h2>
              <Pill className="mt-2 bg-black text-white">{rank.title}</Pill>
            </div>
            <IconButton onClick={() => setShowStats(false)}><XCircle size={20} /></IconButton>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Total" value={stats.total} />
            <StatCard label="Accuracy" value={`${accuracy}%`} />
            <StatCard label="Streak" value={stats.bestStreak} />
            <StatCard label="Avg Speed" value={`${avgSpeed}s`} />
          </div>
          <button onClick={() => { setShowStats(false); setShowWrapped(true); }} className="w-full mt-6 h-12 rounded-2xl bg-black text-white font-black uppercase tracking-[0.2em] text-[11px]">View Political Wrapped</button>
        </Modal>}
        
        {showTrophyCase && <Modal onClose={() => setShowTrophyCase(false)} maxW="max-w-3xl">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-black uppercase tracking-tighter">Trophies</h2>
            <IconButton onClick={() => setShowTrophyCase(false)}><XCircle size={20} /></IconButton>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-2">
            {TROPHIES.map(t => {
              const unlocked = unlockedSet.has(t.id);
              return (
                <div key={t.id} className={`p-4 rounded-[2rem] border flex items-center gap-4 ${unlocked ? "bg-white border-black/10" : "bg-black/5 border-transparent opacity-60"}`}>
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${unlocked ? tierStyles(t.tier) : "bg-gray-200"}`}>{t.icon}</div>
                  <div className="min-w-0">
                    <div className="text-sm font-black uppercase tracking-tight truncate">{t.title}</div>
                    <div className="text-[11px] font-bold text-gray-500 line-clamp-1">{t.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Modal>}
        
        {showWrapped && (
          <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6" onClick={() => setShowWrapped(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-sm aspect-[9/16] bg-gradient-to-b from-[#1c1c1e] to-black rounded-[3rem] p-10 flex flex-col border border-white/10" onClick={e => e.stopPropagation()}>
              <div className="flex-grow pt-10 text-white">
                <h3 className="text-5xl font-black leading-[0.85] tracking-tighter mb-10">POLITICAL<br/><span className="text-blue-500 italic font-serif text-4xl">wrapped</span></h3>
                <div className="space-y-8">
                  <div><p className="text-[10px] font-black text-white/40 uppercase mb-2 tracking-widest">Identity</p><p className="text-3xl font-black uppercase">{rank.title}</p></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-[10px] font-black text-white/40 uppercase mb-1 tracking-widest">Accuracy</p><p className="text-3xl font-black">{accuracy}%</p></div>
                    <div><p className="text-[10px] font-black text-white/40 uppercase mb-1 tracking-widest">Streak</p><p className="text-3xl font-black text-blue-500">{stats.bestStreak}</p></div>
                  </div>
                </div>
              </div>
              <p className="text-center text-[8px] font-black text-white/20 uppercase tracking-[0.4em]">🇺🇸 Guess the Party • Allen Wang</p>
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

function StatCard({ label, value }) {
  return (
    <div className="rounded-3xl bg-white border border-black/10 p-5 text-center">
      <div className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">{label}</div>
      <div className="text-2xl font-black tabular-nums">{value}</div>
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