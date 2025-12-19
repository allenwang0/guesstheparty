import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { Analytics } from '@vercel/analytics/react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import {
  RefreshCcw, Loader2, Check, X as XIcon, Share2, Flame, Info, Timer, Target
} from 'lucide-react';

// 1. Equal Horizontal Line Logo Component
const AllenWangLogo = () => (
  <div className="flex flex-col gap-1 items-center justify-center">
    <div className="h-[2px] w-8 bg-black"></div>
    <div className="h-[2px] w-8 bg-black"></div>
  </div>
);

export default function Home() {
  const [allPoliticians, setAllPoliticians] = useState([]);
  const [current, setCurrent] = useState(null);
  const [loadingQueue, setLoadingQueue] = useState([]);
  const [hasMounted, setHasMounted] = useState(false); // Fixes hydration error
  const [stats, setStats] = useState({
    correct: 0, total: 0, streak: 0, bestStreak: 0,
    demGuesses: 0, repGuesses: 0, demCorrect: 0, repCorrect: 0,
    senateCorrect: 0, senateTotal: 0, houseCorrect: 0, houseTotal: 0,
    totalTime: 0
  });
  const [gameState, setGameState] = useState('guessing');
  const [showStats, setShowStats] = useState(false);
  const [showWrapped, setShowWrapped] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);
  const [startTime, setStartTime] = useState(null);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacityDem = useTransform(x, [-60, -10], [1, 0]);
  const opacityRep = useTransform(x, [10, 60], [0, 1]);

  useEffect(() => {
    setHasMounted(true);
    fetch('/politicians.json')
      .then(res => res.json())
      .then(data => {
        const normalized = data.map(p => ({ ...p, imageUrl: p.img || p.image_url }));
        setAllPoliticians(normalized);
        const shuffled = [...normalized].sort(() => 0.5 - Math.random());
        setCurrent(shuffled[0]);
        setLoadingQueue(shuffled.slice(1, 11));
        setStartTime(Date.now());
      });

    const savedStats = localStorage.getItem('partyStats');
    if (savedStats) {
      try {
        const parsed = JSON.parse(savedStats);
        setStats(prev => ({ ...prev, ...parsed }));
      } catch (e) { console.error("Stats recovery failed", e); }
    }

    const dismissed = localStorage.getItem('instructionsDismissed');
    if (!dismissed) setShowInstructions(true);
  }, []);

  useEffect(() => {
    if (hasMounted) {
      localStorage.setItem('partyStats', JSON.stringify(stats));
    }
  }, [stats, hasMounted]);

  const accuracy = useMemo(() => {
    const total = stats.total || 0;
    return total === 0 ? 0 : Math.round(((stats.correct || 0) / total) * 100);
  }, [stats]);

  const avgSpeed = useMemo(() => {
    const total = stats.total || 0;
    return total === 0 ? 0 : ((stats.totalTime || 0) / total / 1000).toFixed(1);
  }, [stats]);

  const rank = useMemo(() => {
    const total = stats.total || 0;
    if (total < 20) return "Political Intern";
    if (total < 100) return "Campaign Staffer";
    if (total < 500) return "Party Whip";
    return "Speaker of the House";
  }, [stats.total]);

  // Dynamic Role Helper
  const getRole = (cat) => {
    const role = cat?.toLowerCase();
    if (role === 'senate') return 'Senator';
    if (role === 'house' || role === 'representative') return 'Representative';
    if (role === 'governor') return 'Governor';
    return role;
  };

  const handleGuess = (party) => {
    if (gameState !== 'guessing') return;
    const isCorrect = party === current.party;
    const isDem = current.party === 'Democrat';
    const isSenate = current.category?.toLowerCase() === 'senate';
    const timeTaken = Date.now() - (startTime || Date.now());

    setStats(s => ({
      ...s,
      total: (s.total || 0) + 1,
      correct: isCorrect ? (s.correct || 0) + 1 : (s.correct || 0),
      streak: isCorrect ? (s.streak || 0) + 1 : 0,
      bestStreak: isCorrect ? Math.max((s.streak || 0) + 1, s.bestStreak || 0) : (s.bestStreak || 0),
      demGuesses: isDem ? (s.demGuesses || 0) + 1 : (s.demGuesses || 0),
      repGuesses: !isDem ? (s.repGuesses || 0) + 1 : (s.repGuesses || 0),
      demCorrect: (isDem && isCorrect) ? (s.demCorrect || 0) + 1 : (s.demCorrect || 0),
      repCorrect: (!isDem && isCorrect) ? (s.repCorrect || 0) + 1 : (s.repCorrect || 0),
      senateTotal: isSenate ? (s.senateTotal || 0) + 1 : (s.senateTotal || 0),
      senateCorrect: (isSenate && isCorrect) ? (s.senateCorrect || 0) + 1 : (s.senateCorrect || 0),
      houseTotal: !isSenate ? (s.houseTotal || 0) + 1 : (s.houseTotal || 0),
      houseCorrect: (!isSenate && isCorrect) ? (s.houseCorrect || 0) + 1 : (s.houseCorrect || 0),
      totalTime: (s.totalTime || 0) + timeTaken
    }));

    setGameState('revealed');
    setTimeout(() => {
      const next = loadingQueue[0];
      setCurrent(next);
      setLoadingQueue(prev => [...prev.slice(1), allPoliticians[Math.floor(Math.random() * allPoliticians.length)]]);
      setGameState('guessing');
      setImgLoading(true);
      setStartTime(Date.now());
      x.set(0);
    }, 1600);
  };

  if (!hasMounted || !current) return <LoadingScreen message="Convening Congress..." />;

  return (
    <div className="fixed inset-0 h-[100dvh] bg-[#F5F5F7] text-[#1D1D1F] flex flex-col overflow-hidden font-sans select-none">
      <Head><title>Guess The Party | Allen Wang</title></Head>
      <Analytics />

      {/* Header */}
      <header className="px-6 pt-4 shrink-0 z-20 flex justify-center">
        <div className="w-full max-w-4xl flex justify-between items-center bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-white shadow-sm">
          <div className="flex items-center gap-4">
            <AllenWangLogo />
            <div className="flex flex-col">
              <h1 className="text-[clamp(14px,3vw,24px)] font-black tracking-tighter uppercase leading-[0.9]">
                GUESS <span className="text-blue-600 italic font-serif text-lg">the</span> PARTY
              </h1>
              <p className="text-[10px] font-bold text-gray-400 mt-1 lowercase tracking-wide">welcome, voter</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowInstructions(true)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><Info size={22} className="text-gray-400" /></button>
            {/* Updated to Stats Button with text */}
            <button
                onClick={() => setShowStats(true)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest text-gray-600"
            >
              Stats
            </button>
          </div>
        </div>
      </header>

      {/* Main Game Card */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 md:px-12 py-2 relative min-h-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.name}
            drag={gameState === 'guessing' ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            style={{ x, rotate }}
            onDragEnd={(e, i) => { if(i.offset.x < -80) handleGuess('Democrat'); else if(i.offset.x > 80) handleGuess('Republican'); }}
            className="relative w-full max-w-[500px] h-full max-h-[75dvh] bg-white rounded-[2.5rem] shadow-2xl border border-white overflow-hidden flex flex-col cursor-grab active:cursor-grabbing"
          >
            <div className="relative flex-grow min-h-0 bg-[#fbfbfb] flex items-center justify-center overflow-hidden">
              {imgLoading && <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-50"><Loader2 className="animate-spin text-blue-500" size={32} /></div>}
              <img src={current.imageUrl} onLoad={() => setImgLoading(false)} className={`w-full h-full object-contain object-top transition-all duration-700 ${gameState === 'revealed' ? 'scale-110 blur-xl brightness-[0.4]' : 'scale-100'}`} alt="Politician" />
              <motion.div style={{ opacity: opacityDem }} className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"><span className="border-[8px] border-blue-500 text-blue-500 font-black text-8xl px-8 py-4 rounded-3xl rotate-[-15deg] uppercase bg-white/10 backdrop-blur-sm">DEM</span></motion.div>
              <motion.div style={{ opacity: opacityRep }} className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"><span className="border-[8px] border-red-500 text-red-500 font-black text-8xl px-8 py-4 rounded-3xl rotate-[15deg] uppercase bg-white/10 backdrop-blur-sm">REP</span></motion.div>

              {gameState === 'revealed' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 z-20">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-2xl ${stats.streak > 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                    {stats.streak > 0 ? <Check size={40} className="text-white" strokeWidth={4} /> : <XIcon size={40} className="text-white" strokeWidth={4} />}
                  </motion.div>
                  <h2 className="text-[clamp(24px,5vw,40px)] font-black text-white leading-tight uppercase tracking-tight">{current.name}</h2>
                  {/* Dynamic Title (Senator/Governor/Rep) added here */}
                  <p className="text-[clamp(12px,1.5vw,18px)] font-bold opacity-90 uppercase tracking-[0.3em] mt-3 text-white">
                    {current.party} • {getRole(current.category)} • {current.state}
                  </p>
                </div>
              )}
            </div>
            <div className="p-4 grid grid-cols-2 gap-4 bg-white shrink-0">
              <button onClick={() => handleGuess('Democrat')} disabled={gameState === 'revealed'} className="h-16 md:h-20 rounded-2xl bg-[#00AEF3] text-white font-black text-xs uppercase tracking-widest active:scale-95 transition-all">Democrat</button>
              <button onClick={() => handleGuess('Republican')} disabled={gameState === 'revealed'} className="h-16 md:h-20 rounded-2xl bg-[#E81B23] text-white font-black text-xs uppercase tracking-widest active:scale-95 transition-all">Republican</button>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Main HUD Footer */}
      <footer className="px-6 pb-8 pt-4 shrink-0 flex justify-center">
        <div className="w-full max-w-4xl bg-white/50 backdrop-blur-xl border border-white/40 p-5 rounded-[2.5rem] shadow-xl flex justify-between items-center">
          <div className="flex gap-8">
            <div className="flex flex-col"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Streak</span><div className="flex items-center gap-1.5"><span className="text-2xl font-black text-blue-600 leading-none">{stats.streak || 0}</span>{stats.streak >= 5 && <Flame size={20} className="text-orange-500 fill-orange-500" />}</div></div>
            <div className="flex flex-col"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Accuracy</span><span className="text-2xl font-black leading-none">{accuracy}%</span></div>
            <div className="flex flex-col"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Correct</span><span className="text-2xl font-black leading-none">{stats.correct || 0}</span></div>
          </div>
          <button onClick={() => { if(confirm("Reset stats?")){localStorage.clear(); window.location.reload();}}} className="p-3 rounded-full bg-red-50 text-red-400 border border-red-100"><RefreshCcw size={20}/></button>
        </div>
      </footer>

      {/* OVERLAYS */}
      <AnimatePresence>
        {showInstructions && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setShowInstructions(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white rounded-[3rem] p-10 max-w-md w-full relative shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-3xl font-black mb-6">How to Play</h3>
              <div className="space-y-6 text-sm font-medium text-gray-600">
                <div className="flex items-center gap-4">
                   <span className="flex-shrink-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold italic">1</span>
                   <p>Swipe <span className="text-blue-600 font-bold">Left</span> for Democrats.</p>
                </div>
                <div className="flex items-center gap-4">
                   <span className="flex-shrink-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold italic">2</span>
                   <p>Swipe <span className="text-red-600 font-bold">Right</span> for Republicans.</p>
                </div>
                <div className="flex items-center gap-4">
                   <span className="flex-shrink-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold italic">3</span>
                   <p>Maintain your streak to increase your rank!</p>
                </div>
              </div>
              <button onClick={() => { localStorage.setItem('instructionsDismissed', 'true'); setShowInstructions(false); }} className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest mt-10">Got it</button>
            </motion.div>
          </div>
        )}

        {/* Dossier (Stats) */}
        {showStats && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xl flex flex-col items-center justify-end md:justify-center" onClick={() => setShowStats(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="bg-[#F5F5F7] w-full max-w-2xl h-[90dvh] md:h-auto md:max-h-[85dvh] rounded-t-[3rem] md:rounded-[3rem] p-8 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-4xl font-black italic tracking-tighter uppercase">Dossier</h2>
                <button onClick={() => setShowStats(false)} className="p-2 bg-white rounded-full shadow-sm"><XIcon/></button>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white p-6 rounded-[2rem] flex flex-col items-center shadow-sm"><Timer className="text-blue-500 mb-2"/><p className="text-[10px] font-black text-gray-400 uppercase">Avg Speed</p><p className="text-3xl font-black">{avgSpeed}s</p></div>
                <div className="bg-white p-6 rounded-[2rem] flex flex-col items-center shadow-sm"><Target className="text-red-500 mb-2"/><p className="text-[10px] font-black text-gray-400 uppercase">Best Streak</p><p className="text-3xl font-black text-blue-600">{stats.bestStreak || 0}</p></div>
              </div>
              <div className="bg-white p-8 rounded-[3rem] shadow-sm mb-6">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-4 tracking-widest">Chamber Proficiency</p>
                <div className="space-y-4">
                  <StatBar label="Senators" current={stats.senateCorrect} total={stats.senateTotal} />
                  <StatBar label="Representatives" current={stats.houseCorrect} total={stats.houseTotal} />
                </div>
              </div>
              <button onClick={() => setShowWrapped(true)} className="w-full py-6 bg-black text-white rounded-3xl font-black uppercase tracking-widest flex items-center justify-center gap-3"><Share2 size={18}/> View Wrapped</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Sub-components kept the same as your source
function StatBar({ label, current, total }) {
  const pct = !total ? 0 : Math.round(((current || 0) / total) * 100);
  return (
    <div>
      <div className="flex justify-between text-[10px] font-black mb-1 uppercase"><span>{label}</span><span className="text-gray-400">{pct}%</span></div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className="h-full bg-black" /></div>
    </div>
  );
}

function LoadingScreen({ message }) {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#F5F5F7] gap-4">
      <Loader2 className="animate-spin text-blue-600" size={48} />
      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{message}</p>
    </div>
  );
}