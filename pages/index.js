import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { Analytics } from '@vercel/analytics/react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import {
  ChartBar, X, RefreshCcw, Loader2, ShieldCheck, Zap,
  Library, Check, X as XIcon, Share2, Flame, Info, Timer, Target
} from 'lucide-react';

// Custom Party Icons
const DonkeyIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M21,12.22c0-3.66-2-5.46-4-6V4H15V6.1c-1.12,0.14-2.22,0.48-3.23,1C11.53,5.92,11,4,11,4H9c0,0-0.53,1.92-0.77,3.1C7.22,7.48,6.12,7.82,5,7.96V4H3V7.12 C1.66,7.8,1,8.96,1,10.22c0,0.66,0.18,1.29,0.5,1.83C1.18,12.59,1,13.22,1,13.88c0,1.26,0.66,2.42,2,3.1V21h2v-3.04 c1.12,0.14,2.22,0.48,3.23,1c0.24,1.18,0.77,3.1,0.77,3.1h2c0,0,0.53-1.92,0.23-3.1c1.01-0.52,2.11-0.86,3.23-1V21h2v-3.04 c1.34-0.68,2-1.84,2-3.1c0-0.66-0.18-1.29-0.5-1.83C20.82,13.51,21,12.88,21,12.22z"/>
  </svg>
);

const ElephantIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M22,10.22c0-1.26-0.66-2.42-2-3.1V4h-2v3.1c-1.12-0.14-2.22-0.48-3.23-1c-0.24-1.18-0.77-3.1-0.77-3.1h-2 c0,0-0.53,1.92-0.23,3.1c-1.01,0.52-2.11,0.86-3.23,1V4H6.54v3.1c-1.34,0.68-2,1.84-2,3.1c0,0.66,0.18,1.29,0.5,1.83 C4.72,12.59,4.54,13.22,4.54,13.88c0,3.66,2,5.46,4,6V22h2V19.9c1.12-0.14,2.22-0.48,3.23-1c0.24,1.18,0.77,3.1,0.77,3.1h2 c0,0,0.53-1.92,0.77-3.1c1.01-0.52,2.11-0.86,3.23-1V22h2V18.88c1.34-0.68,2-1.84,2-3.1c0-0.66-0.18-1.29-0.5-1.83 C21.82,13.51,22,12.88,22,12.22z"/>
  </svg>
);

export default function Home() {
  const [allPoliticians, setAllPoliticians] = useState([]);
  const [current, setCurrent] = useState(null);
  const [loadingQueue, setLoadingQueue] = useState([]);
  const [stats, setStats] = useState({
    correct: 0, total: 0, streak: 0, bestStreak: 0,
    demGuesses: 0, repGuesses: 0, demCorrect: 0, repCorrect: 0,
    senateCorrect: 0, senateTotal: 0, houseCorrect: 0, houseTotal: 0,
    totalTime: 0 // For average speed
  });
  const [gameState, setGameState] = useState('guessing');
  const [showStats, setShowStats] = useState(false);
  const [showWrapped, setShowWrapped] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);
  const [startTime, setStartTime] = useState(Date.now());

  // Motion values
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacityDem = useTransform(x, [-60, -10], [1, 0]);
  const opacityRep = useTransform(x, [10, 60], [0, 1]);

  useEffect(() => {
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
    if (savedStats) setStats(JSON.parse(savedStats));

    const dismissed = localStorage.getItem('instructionsDismissed');
    if (!dismissed) setShowInstructions(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('partyStats', JSON.stringify(stats));
  }, [stats]);

  const accuracy = useMemo(() =>
    stats.total === 0 ? 0 : Math.round((stats.correct / stats.total) * 100),
    [stats]
  );

  const avgSpeed = useMemo(() =>
    stats.total === 0 ? 0 : (stats.totalTime / stats.total / 1000).toFixed(1),
    [stats]
  );

  const handleGuess = (party) => {
    if (gameState !== 'guessing') return;
    const isCorrect = party === current.party;
    const isDem = current.party === 'Democrat';
    const isSenate = current.category.toLowerCase() === 'senate';
    const timeTaken = Date.now() - startTime;

    setStats(s => ({
      ...s,
      total: s.total + 1,
      correct: isCorrect ? s.correct + 1 : s.correct,
      streak: isCorrect ? s.streak + 1 : 0,
      bestStreak: isCorrect ? Math.max(s.streak + 1, s.bestStreak) : s.bestStreak,
      demGuesses: isDem ? s.demGuesses + 1 : s.demGuesses,
      repGuesses: !isDem ? s.repGuesses + 1 : s.repGuesses,
      demCorrect: (isDem && isCorrect) ? s.demCorrect + 1 : s.demCorrect,
      repCorrect: (!isDem && isCorrect) ? s.repCorrect + 1 : s.repCorrect,
      senateTotal: isSenate ? s.senateTotal + 1 : s.senateTotal,
      senateCorrect: (isSenate && isCorrect) ? s.senateCorrect + 1 : s.senateCorrect,
      houseTotal: !isSenate ? s.houseTotal + 1 : s.houseTotal,
      houseCorrect: (!isSenate && isCorrect) ? s.houseCorrect + 1 : s.houseCorrect,
      totalTime: s.totalTime + timeTaken
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

  const dismissInstructions = () => {
    localStorage.setItem('instructionsDismissed', 'true');
    setShowInstructions(false);
  };

  const resetEverything = () => {
    if (confirm("This will wipe all your stats and high scores permanently. Continue?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  if (!current) return <LoadingScreen />;

  return (
    <div className="fixed inset-0 h-[100dvh] bg-[#F5F5F7] text-[#1D1D1F] flex flex-col overflow-hidden font-sans select-none">
      <Head><title>Guess The Party | Allen Wang</title></Head>
      <Analytics />

      {/* Header */}
      <header className="px-6 pt-4 shrink-0 z-20 flex justify-center">
        <div className="w-full max-w-4xl flex justify-between items-center bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-white shadow-sm">
          <div className="flex flex-col">
            <h1 className="text-[clamp(14px,3vw,24px)] font-black tracking-tighter uppercase leading-[0.9]">
              GUESS <span className="text-blue-600 italic font-serif text-lg">the</span> PARTY
            </h1>
            <p className="text-[clamp(8px,1vw,10px)] font-bold text-gray-400 mt-1 uppercase tracking-[0.2em]">Created by Allen Wang</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowInstructions(true)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><Info size={22} className="text-gray-400" /></button>
            <button onClick={() => setShowStats(true)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ChartBar size={22} className="text-gray-600" /></button>
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
              <img
                src={current.imageUrl}
                onLoad={() => setImgLoading(false)}
                className={`w-full h-full object-contain object-top transition-all duration-700 ${gameState === 'revealed' ? 'scale-110 blur-xl brightness-[0.4]' : 'scale-100'}`}
                alt="Politician"
              />

              <motion.div style={{ opacity: opacityDem }} className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                <span className="border-[8px] border-blue-500 text-blue-500 font-black text-8xl px-8 py-4 rounded-3xl rotate-[-15deg] uppercase shadow-2xl bg-white/10 backdrop-blur-sm">DEM</span>
              </motion.div>
              <motion.div style={{ opacity: opacityRep }} className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                <span className="border-[8px] border-red-500 text-red-500 font-black text-7xl md:text-8xl px-8 py-4 rounded-3xl rotate-[15deg] uppercase shadow-2xl bg-white/10 backdrop-blur-sm">REP</span>
              </motion.div>

              {gameState === 'revealed' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 z-20">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-2xl ${gameState === 'revealed' && current.party === (stats.streak > 0 || stats.total === 1 ? current.party : '') ? 'bg-green-500' : 'bg-red-500'}`}>
                    {stats.streak > 0 ? <Check size={40} className="text-white" strokeWidth={4} /> : <XIcon size={40} className="text-white" strokeWidth={4} />}
                  </motion.div>
                  <h2 className="text-[clamp(24px,5vw,40px)] font-black leading-tight text-white drop-shadow-lg uppercase tracking-tight">{current.name}</h2>
                  <p className="text-[clamp(12px,1.5vw,18px)] font-bold opacity-90 uppercase tracking-[0.3em] mt-3 text-white">{current.party} • {current.state}</p>
                </div>
              )}
            </div>
            <div className="p-4 md:p-6 grid grid-cols-2 gap-4 bg-white shrink-0">
              <button onClick={() => handleGuess('Democrat')} disabled={gameState === 'revealed'} className="h-16 md:h-20 rounded-2xl bg-[#00AEF3] text-white font-black text-xs uppercase tracking-widest active:scale-95 transition-all">Democrat</button>
              <button onClick={() => handleGuess('Republican')} disabled={gameState === 'revealed'} className="h-16 md:h-20 rounded-2xl bg-[#E81B23] text-white font-black text-xs uppercase tracking-widest active:scale-95 transition-all">Republican</button>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Main Screen Footer Dashboard */}
      <footer className="px-6 pb-8 pt-4 shrink-0 flex flex-col items-center gap-3">
        <div className="w-full max-w-4xl bg-white/50 backdrop-blur-xl border border-white/40 p-5 rounded-[2.5rem] shadow-xl flex justify-between items-center">
          <div className="flex gap-8 items-center">
            <div className="flex flex-col">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Streak</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl font-black text-blue-600 leading-none">{stats.streak}</span>
                  {stats.streak >= 5 && <Flame size={20} className="text-orange-500 fill-orange-500" />}
                </div>
            </div>
            <div className="w-px h-8 bg-gray-200 hidden md:block" />
            <div className="flex flex-col">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Accuracy</span>
                <span className="text-2xl font-black leading-none">{accuracy}%</span>
            </div>
            <div className="w-px h-8 bg-gray-200 hidden md:block" />
            <div className="flex flex-col">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Correct</span>
                <span className="text-2xl font-black leading-none">{stats.correct}</span>
            </div>
          </div>

          <button
            onClick={resetEverything}
            className="flex flex-col items-center group"
          >
            <div className="p-3 rounded-full bg-red-50 text-red-400 group-active:scale-90 transition-all border border-red-100">
                <RefreshCcw size={20} />
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest mt-1 text-red-300">Reset</span>
          </button>
        </div>
      </footer>

      {/* Instruction Overlay */}
      <AnimatePresence>
        {showInstructions && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-[3rem] p-10 max-w-md w-full relative shadow-2xl">
              <button onClick={dismissInstructions} className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full"><X size={24} /></button>
              <h3 className="text-3xl font-black tracking-tight mb-6">Welcome, Voter.</h3>
              <div className="space-y-6">
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-blue-600 font-black">1</div>
                  <p className="text-sm font-medium text-gray-600 leading-relaxed">Swipe <span className="text-blue-600 font-bold underline">Left</span> for Democrats.</p>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0 text-red-600 font-black">2</div>
                  <p className="text-sm font-medium text-gray-600 leading-relaxed">Swipe <span className="text-red-600 font-bold underline">Right</span> for Republicans.</p>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-gray-600 font-black">3</div>
                  <p className="text-sm font-medium text-gray-600 leading-relaxed">Maintain your streak to increase your political rank.</p>
                </div>
              </div>
              <button onClick={dismissInstructions} className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest mt-10 hover:brightness-125 transition-all">Begin Session</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Modal (The Dossier) */}
      <AnimatePresence>
        {showStats && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="fixed inset-0 z-50 bg-[#F5F5F7] flex flex-col items-center p-8 overflow-y-auto">
            <div className="w-full max-w-2xl pb-20">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-4xl font-black tracking-tighter uppercase italic">Dossier</h2>
                <button onClick={() => setShowStats(false)} className="p-3 bg-white shadow-md rounded-full"><XIcon size={24}/></button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white p-6 rounded-[2rem] shadow-sm flex flex-col items-center">
                    <Timer size={24} className="text-blue-500 mb-2" />
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Avg Speed</p>
                    <p className="text-3xl font-black">{avgSpeed}s</p>
                </div>
                <div className="bg-white p-6 rounded-[2rem] shadow-sm flex flex-col items-center">
                    <Target size={24} className="text-red-500 mb-2" />
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Accuracy</p>
                    <p className="text-3xl font-black">{accuracy}%</p>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[3rem] shadow-sm mb-4">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-6 tracking-widest">Chamber Proficiency</p>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-xs font-black mb-2"><span>Senators</span><span>{stats.senateTotal === 0 ? 0 : Math.round((stats.senateCorrect / stats.senateTotal) * 100)}%</span></div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-black transition-all" style={{ width: `${stats.senateTotal === 0 ? 0 : (stats.senateCorrect / stats.senateTotal) * 100}%` }} /></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-black mb-2"><span>Reps & Govs</span><span>{stats.houseTotal === 0 ? 0 : Math.round((stats.houseCorrect / stats.houseTotal) * 100)}%</span></div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-black transition-all" style={{ width: `${stats.houseTotal === 0 ? 0 : (stats.houseCorrect / stats.houseTotal) * 100}%` }} /></div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[3rem] shadow-sm mb-10 text-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Political Rank</p>
                  <p className="text-3xl font-black uppercase text-blue-600 tracking-tight">{rank}</p>
              </div>

              <button onClick={() => setShowWrapped(true)} className="w-full py-6 mb-4 text-sm font-black uppercase tracking-widest text-white bg-black rounded-3xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                <Share2 size={18}/> View Political Wrapped
              </button>
            </div>
          </motion.div>
        )}

        {/* Wrapped Component - Same as previous version */}
        {showWrapped && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="relative w-full max-w-sm aspect-[9/16] bg-gradient-to-b from-[#1c1c1e] to-black rounded-[3rem] p-8 flex flex-col border border-white/10 shadow-2xl">
                    <button onClick={() => setShowWrapped(false)} className="absolute top-8 right-8 z-10 p-2 bg-white/10 rounded-full text-white/50"><XIcon size={20}/></button>
                    <div className="flex-grow pt-10">
                        <h3 className="text-6xl font-black text-white leading-none tracking-tighter mb-12">POLITICAL<br/><span className="text-blue-500 italic font-serif">wrapped</span></h3>
                        <div className="space-y-8">
                            <div><p className="text-[10px] font-black text-white/40 uppercase mb-2 tracking-widest">Rank</p><p className="text-4xl font-black text-white">{rank}</p></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><p className="text-[10px] font-black text-white/40 uppercase mb-1">Best Streak</p><p className="text-3xl font-black text-blue-500">{stats.bestStreak}</p></div>
                                <div><p className="text-[10px] font-black text-white/40 uppercase mb-1">Correct</p><p className="text-3xl font-black text-white">{stats.correct}</p></div>
                            </div>
                        </div>
                    </div>
                    <div className="shrink-0 text-center pt-8 border-t border-white/5">
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">GUESS THE PARTY <br/> <span className="text-white/60">Created by Allen Wang</span></p>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#F5F5F7]">
      <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
      <p className="text-xs font-black text-gray-400 uppercase tracking-widest animate-pulse">Convening Congress...</p>
    </div>
  );
}