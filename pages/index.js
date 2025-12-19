import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Head from "next/head";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { 
  RefreshCcw, Loader2, Check, X, Share2, Flame, Info, Timer, 
  Target, Award, Trophy, Keyboard, Zap, Star, ShieldCheck 
} from "lucide-react";

// --- UI Constants & Components ---
const COLORS = {
  dem: "#00AEF3",
  rep: "#E81B23",
  bg: "#F5F5F7",
  text: "#1D1D1F",
  glass: "rgba(255, 255, 255, 0.7)"
};

const GlassCard = ({ children, className = "" }) => (
  <div className={`rounded-[2.5rem] border border-white/60 bg-white/70 backdrop-blur-2xl shadow-[0_18px_60px_rgba(0,0,0,0.08)] ${className}`}>
    {children}
  </div>
);

const Pill = ({ children, className = "" }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] ${className}`}>
    {children}
  </span>
);

const StatBox = ({ label, value, subValue, icon: Icon, color = "text-gray-400" }) => (
  <div className="bg-white rounded-[1.75rem] p-5 border border-black/[0.03]">
    <div className="flex justify-between items-start mb-3">
      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</span>
      {Icon && <Icon size={14} className={color} />}
    </div>
    <div className="text-3xl font-black tracking-tight">{value}</div>
    {subValue && <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">{subValue}</div>}
  </div>
);

// --- Main App ---
export default function GuessTheParty() {
  const [politicians, setPoliticians] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [gameState, setGameState] = useState("guessing"); // guessing, revealed
  const [imgLoading, setImgLoading] = useState(true);
  const [showStats, setShowStats] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  // Stats State
  const [stats, setStats] = useState({
    correct: 0, total: 0, streak: 0, bestStreak: 0, totalTime: 0
  });

  // Framer Motion Values for Swiping
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacityDem = useTransform(x, [-150, 0], [1, 0]);
  const opacityRep = useTransform(x, [0, 150], [0, 1]);

  // Load Data & Stats
  useEffect(() => {
    fetch("/politicians.json")
      .then(res => res.json())
      .then(data => setPoliticians(data.sort(() => Math.random() - 0.5)));

    const saved = localStorage.getItem("party_stats_v2");
    if (saved) setStats(JSON.parse(saved));
  }, []);

  // Persist Stats
  useEffect(() => {
    if (stats.total > 0) localStorage.setItem("party_stats_v2", JSON.stringify(stats));
  }, [stats]);

  const currentPerson = politicians[currentIndex];

  const handleGuess = useCallback((guess) => {
    if (gameState !== "guessing" || !currentPerson) return;

    const isCorrect = guess === currentPerson.party;
    setLastResult({ isCorrect, correctParty: currentPerson.party });
    setGameState("revealed");

    setStats(prev => ({
      ...prev,
      total: prev.total + 1,
      correct: isCorrect ? prev.correct + 1 : prev.correct,
      streak: isCorrect ? prev.streak + 1 : 0,
      bestStreak: isCorrect ? Math.max(prev.streak + 1, prev.bestStreak) : prev.bestStreak
    }));

    setTimeout(() => {
      setGameState("guessing");
      setCurrentIndex(prev => (prev + 1) % politicians.length);
      setImgLoading(true);
      x.set(0);
    }, 1500);
  }, [currentPerson, gameState, politicians.length, x]);

  if (!currentPerson) return <div className="h-screen flex items-center justify-center bg-[#F5F5F7] font-black uppercase tracking-[.3em]">Convening Congress...</div>;

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] p-4 md:p-8 font-sans selection:bg-blue-100">
      <Head>
        <title>Guess The Party | Allen Wang</title>
      </Head>

      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/70 backdrop-blur-xl p-5 rounded-[2.5rem] border border-white">
          <div className="flex flex-col items-center md:items-start">
            <h1 className="text-2xl font-black tracking-tighter uppercase flex items-center gap-2">
              🇺🇸 Guess The Party 🇺🇸
            </h1>
            <div className="flex gap-2 mt-1">
              <Pill className="bg-black/5 text-gray-500 tracking-normal">← Dem · → Rep · S Stats</Pill>
              <Pill className="bg-white border border-black/5 text-gray-400">Created by <span className="text-black">Allen Wang</span></Pill>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button className="h-11 w-11 flex items-center justify-center rounded-2xl bg-white border border-black/5 shadow-sm active:scale-90 transition-all">
              <Info size={18} className="text-gray-400" />
            </button>
            <button className="h-11 px-4 flex items-center gap-2 rounded-2xl bg-white border border-black/5 shadow-sm active:scale-95 transition-all">
              <Trophy size={16} className="text-amber-500" />
              <span className="text-[11px] font-black uppercase tracking-widest">Trophies</span>
              <span className="text-gray-400 font-bold tabular-nums">0/10</span>
            </button>
            <button onClick={() => setShowStats(true)} className="h-11 px-6 rounded-2xl bg-black text-white font-black uppercase tracking-widest text-[11px] active:scale-95 transition-all">
              Stats
            </button>
          </div>
        </header>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-8">
          
          {/* Left Rail: Progress */}
          <div className="hidden lg:flex flex-col gap-4">
            <GlassCard className="p-6">
              <div className="flex justify-between items-center mb-6">
                <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">Now</span>
                <Pill className="bg-black/5 text-gray-500 lowercase"><Timer size={12}/> 8.8s avg</Pill>
              </div>
              <div className="text-5xl font-black mb-1">{stats.streak}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">Current Streak</div>
              
              <div className="bg-white rounded-3xl p-5 border border-black/5">
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Rank</span>
                <div className="text-lg font-black mt-1">Political Intern</div>
                <div className="mt-4 text-[9px] font-black uppercase tracking-widest text-gray-400">
                  Best Streak: <span className="text-black">{stats.bestStreak}</span>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">Tip</span>
              <p className="text-sm font-bold leading-relaxed mt-3 text-gray-600">
                Drag the card or use arrow keys. Photos can be deceptive—hair, lighting, and age will try to trick you.
              </p>
            </GlassCard>
          </div>

          {/* Center: Game Card */}
          <div className="relative flex justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPerson.id}
                style={{ x, rotate }}
                drag={gameState === "guessing" ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -100) handleGuess("Democrat");
                  if (info.offset.x > 100) handleGuess("Republican");
                }}
                className="w-full max-w-[500px] aspect-[3/4] bg-white rounded-[3rem] shadow-[0_30px_90px_rgba(0,0,0,0.12)] border border-white overflow-hidden relative cursor-grab active:cursor-grabbing"
              >
                {/* Swipe Overlays */}
                <motion.div style={{ opacity: opacityDem }} className="absolute inset-0 bg-blue-500/10 z-10 pointer-events-none" />
                <motion.div style={{ opacity: opacityRep }} className="absolute inset-0 bg-red-500/10 z-10 pointer-events-none" />

                {/* Loading State */}
                {imgLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-20">
                    <Loader2 className="animate-spin text-blue-500" size={40} />
                  </div>
                )}

                <img 
                  src={currentPerson.img} 
                  className={`w-full h-full object-cover transition-all duration-700 ${gameState === 'revealed' ? 'scale-110 blur-xl brightness-50' : 'scale-100'}`}
                  onLoad={() => setImgLoading(false)}
                />

                {/* Reveal UI */}
                {gameState === "revealed" && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="absolute inset-0 z-30 flex flex-col items-center justify-center text-center p-6 text-white">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-2xl ${lastResult.isCorrect ? 'bg-emerald-500' : 'bg-red-500'}`}>
                      {lastResult.isCorrect ? <Check size={32} strokeWidth={4}/> : <X size={32} strokeWidth={4}/>}
                    </div>
                    <h2 className="text-4xl font-black uppercase tracking-tighter leading-none">{currentPerson.name}</h2>
                    <Pill className={`mt-4 ${lastResult.correctParty === 'Democrat' ? 'bg-blue-500' : 'bg-red-500'} text-white`}>
                      {lastResult.correctParty}
                    </Pill>
                  </motion.div>
                )}

                {/* Bottom Buttons */}
                <div className="absolute bottom-0 left-0 right-0 p-4 grid grid-cols-2 gap-3 bg-gradient-to-t from-black/20 to-transparent z-40">
                  <button onClick={() => handleGuess("Democrat")} className="h-16 rounded-[1.5rem] bg-[#00AEF3] text-white font-black uppercase tracking-[0.2em] text-xs shadow-lg active:scale-95 transition-all">
                    Democrat
                  </button>
                  <button onClick={() => handleGuess("Republican")} className="h-16 rounded-[1.5rem] bg-[#E81B23] text-white font-black uppercase tracking-[0.2em] text-xs shadow-lg active:scale-95 transition-all">
                    Republican
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Rail: Session Info */}
          <div className="hidden lg:flex flex-col gap-4">
            <GlassCard className="p-6">
              <div className="flex justify-between items-center mb-6">
                <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">Session</span>
                <button onClick={() => setStats({correct: 0, total: 0, streak: 0, bestStreak: 0, totalTime: 0})} className="text-red-400 p-2 hover:bg-red-50 rounded-xl transition-colors">
                  <RefreshCcw size={16} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <StatBox label="Accuracy" value={`${Math.round((stats.correct / (stats.total || 1)) * 100)}%`} />
                <StatBox label="Seen" value={stats.total} />
              </div>

              <div className="bg-white rounded-3xl p-5 border border-black/5">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">
                  <span>Trophies</span>
                  <span>0/10</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 w-[10%]" />
                </div>
                <button className="w-full mt-4 h-11 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 active:scale-95 transition-all">
                  <Trophy size={14}/> Open Trophy Case
                </button>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">Quick Actions</span>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button className="h-11 bg-white rounded-2xl font-black uppercase tracking-widest text-[10px] border border-black/5 shadow-sm active:scale-95 transition-all">Stats</button>
                <button className="h-11 bg-white rounded-2xl font-black uppercase tracking-widest text-[10px] border border-black/5 shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-all">
                  <Share2 size={12}/> Wrapped
                </button>
              </div>
            </GlassCard>
          </div>

        </div>
      </div>
    </div>
  );
}