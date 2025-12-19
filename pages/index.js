import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { Analytics } from '@vercel/analytics/react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { ChartBar, X, RefreshCcw, Loader2, ShieldCheck, Zap, Library, Check, X as XIcon, Share2, Flame, Flag, Trophy } from 'lucide-react';

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
    demGuesses: 0, repGuesses: 0, demCorrect: 0, repCorrect: 0
  });
  const [gameState, setGameState] = useState('guessing');
  const [showStats, setShowStats] = useState(false);
  const [showWrapped, setShowWrapped] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);
  const [activeCategories, setActiveCategories] = useState(['senate', 'house', 'governor']);

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
      });
    const saved = localStorage.getItem('partyStats');
    if (saved) setStats(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('partyStats', JSON.stringify(stats));
  }, [stats]);

  const accuracy = useMemo(() =>
    stats.total === 0 ? 0 : Math.round((stats.correct / stats.total) * 100),
    [stats]
  );

  const rank = useMemo(() => {
    if (stats.total < 20) return "Political Intern";
    if (stats.total < 100) return "Campaign Staffer";
    if (stats.total < 500) return "Party Whip";
    return "Speaker of the House";
  }, [stats.total]);

  const demPct = stats.demGuesses === 0 ? 0 : Math.round((stats.demCorrect / stats.demGuesses) * 100);
  const repPct = stats.repGuesses === 0 ? 0 : Math.round((stats.repCorrect / stats.repGuesses) * 100);

  const handleGuess = (party) => {
    if (gameState !== 'guessing') return;
    const isCorrect = party === current.party;
    const isDem = current.party === 'Democrat';

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
    }));

    setGameState('revealed');
    setTimeout(() => {
      const next = loadingQueue[0];
      setCurrent(next);
      setLoadingQueue(prev => [...prev.slice(1), allPoliticians[Math.floor(Math.random() * allPoliticians.length)]]);
      setGameState('guessing');
      setImgLoading(true);
      x.set(0);
    }, 1600);
  };

  const copyAndShowWrapped = () => {
    const text = `🗳️ GUESS THE PARTY\n\nRank: ${rank}\nAccuracy: ${accuracy}%\nBest Streak: ${stats.bestStreak}\n\nCan you beat my streak? https://guesstheparty.vercel.app/`;
    navigator.clipboard.writeText(text);
    setShowWrapped(true);
  };

  if (!current) return <LoadingScreen />;

  return (
    <div className="fixed inset-0 h-[100dvh] bg-[#F5F5F7] text-[#1D1D1F] flex flex-col overflow-hidden font-sans select-none">
      <Head><title>Guess The Party</title></Head>
      <Analytics />

      {/* Header */}
      <header className="px-6 pt-4 shrink-0 z-20 flex justify-center">
        <div className="w-full max-w-4xl flex justify-between items-center bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-white shadow-sm">
          <h1 className="text-[clamp(14px,3vw,24px)] font-black tracking-tighter uppercase leading-none">
            GUESS <span className="text-blue-600 italic font-serif text-lg">the</span> PARTY
          </h1>
          <button onClick={() => setShowStats(true)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ChartBar size={24} className="text-gray-600" />
          </button>
        </div>
      </header>

      {/* Main Game Card */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 py-2 relative min-h-0 overflow-hidden">
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
              {/* BIG Tinder Swipe Feedback Labels */}
              <motion.div style={{ opacity: opacityDem }} className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="border-[8px] border-blue-500 text-blue-500 font-black text-8xl px-8 py-4 rounded-3xl rotate-[-15deg] uppercase shadow-2xl bg-white/10 backdrop-blur-sm">DEM</span>
              </motion.div>
              <motion.div style={{ opacity: opacityRep }} className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="border-[8px] border-red-500 text-red-500 font-black text-8xl px-8 py-4 rounded-3xl rotate-[15deg] uppercase shadow-2xl bg-white/10 backdrop-blur-sm">REP</span>
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

      {/* Stats Modal */}
      <AnimatePresence>
        {showStats && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="fixed inset-0 z-40 bg-[#F5F5F7] flex flex-col items-center p-8 overflow-y-auto">
            <div className="w-full max-w-2xl">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-4xl font-black tracking-tighter uppercase italic">Dossier</h2>
                <button onClick={() => setShowStats(false)} className="p-3 bg-white shadow-md rounded-full"><XIcon size={24}/></button>
              </div>
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-white p-8 rounded-[3rem] shadow-sm"><p className="text-xs font-black text-gray-400 uppercase mb-2">Played</p><p className="text-5xl font-black">{stats.total}</p></div>
                <div className="bg-white p-8 rounded-[3rem] shadow-sm"><p className="text-xs font-black text-gray-400 uppercase mb-2">Best Streak</p><p className="text-5xl font-black text-blue-600">{stats.bestStreak}</p></div>
              </div>
              <button onClick={copyAndShowWrapped} className="w-full py-6 mb-4 text-sm font-black uppercase tracking-widest text-white bg-black rounded-3xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl">
                <Share2 size={18}/> Generate Shareable Wrapped
              </button>
              <button onClick={() => {if(confirm("Wipe all stats?")){localStorage.clear(); window.location.reload();}}} className="w-full py-4 text-xs font-black uppercase tracking-widest text-red-400 border border-red-100 rounded-3xl">Reset Session</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* WRAPPED SHAREABLE POPUP */}
      <AnimatePresence>
        {showWrapped && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="relative w-full max-w-sm aspect-[9/16] bg-gradient-to-b from-[#1D1D1F] to-black rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 flex flex-col p-8">
              <button onClick={() => setShowWrapped(false)} className="absolute top-6 right-6 p-2 bg-white/10 rounded-full text-white/50"><XIcon size={20}/></button>

              {/* Wrapped Design */}
              <div className="flex-grow flex flex-col gap-6 pt-8">
                <div className="flex gap-1 mb-2">
                  <div className="w-6 h-1 bg-red-500"></div>
                  <div className="w-6 h-1 bg-white"></div>
                  <div className="w-6 h-1 bg-blue-500"></div>
                </div>

                <h3 className="text-6xl font-black text-white leading-none tracking-tighter">POLITICAL<br/><span className="text-blue-500 italic font-serif">wrapped</span><br/>2025</h3>

                <div className="mt-8 space-y-6">
                  <div>
                    <p className="text-xs font-black text-white/40 uppercase tracking-widest">My Final Rank</p>
                    <p className="text-4xl font-black text-white tracking-tight">{rank}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Accuracy</p>
                      <p className="text-3xl font-black text-white">{accuracy}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Best Streak</p>
                      <p className="text-3xl font-black text-blue-500">{stats.bestStreak}</p>
                    </div>
                  </div>

                  <div className="pt-4 space-y-4 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <DonkeyIcon className="w-8 h-8 text-blue-500" />
                        <span className="text-xs font-black text-white uppercase tracking-widest">Democrat Knowledge</span>
                      </div>
                      <span className="text-xl font-black text-white">{demPct}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <ElephantIcon className="w-8 h-8 text-red-500" />
                        <span className="text-xs font-black text-white uppercase tracking-widest">Republican Knowledge</span>
                      </div>
                      <span className="text-xl font-black text-white">{repPct}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="shrink-0 pt-8 border-t border-white/10 text-center">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">GUESS THE PARTY • BY ALLEN WANG</p>
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
    <div className="h-screen flex items-center justify-center bg-[#F5F5F7]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-blue-600" size={48} />
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Tabulating Results...</p>
      </div>
    </div>
  );
}