import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { Analytics } from '@vercel/analytics/react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { ChartBar, X, RefreshCcw, Loader2, ShieldCheck, Zap, Library, CheckCircle2 } from 'lucide-react';

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
  const [imgLoading, setImgLoading] = useState(true);
  const [activeCategories, setActiveCategories] = useState(['senate', 'house', 'governor']);
  const [toast, setToast] = useState(null);

  // Motion values
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacityDem = useTransform(x, [-150, -50], [1, 0]);
  const opacityRep = useTransform(x, [50, 150], [0, 1]);

  // Mastery Logic
  const badges = useMemo(() => [
    { id: 'dem_master', name: 'Blue Wave', icon: <ShieldCheck className="text-blue-500" size={14} />, unlocked: (stats.demCorrect / stats.demGuesses > 0.85) && stats.demGuesses >= 25, description: '85% Accuracy (D)' },
    { id: 'rep_master', name: 'Red Wall', icon: <ShieldCheck className="text-red-500" size={14} />, unlocked: (stats.repCorrect / stats.repGuesses > 0.85) && stats.repGuesses >= 25, description: '85% Accuracy (R)' },
    { id: 'streak_master', name: 'Incumbent', icon: <Zap className="text-yellow-500" size={14} />, unlocked: stats.bestStreak >= 15, description: '15+ Streak' },
    { id: 'total_master', name: 'Insider', icon: <Library className="text-purple-500" size={14} />, unlocked: stats.total >= 200, description: '200 Rounds' }
  ], [stats]);

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

  const newQuestion = () => {
    if (loadingQueue.length === 0) return;
    const next = loadingQueue[0];
    setCurrent(next);
    setLoadingQueue(prev => [...prev.slice(1), allPoliticians[Math.floor(Math.random() * allPoliticians.length)]]);
    setGameState('guessing');
    setImgLoading(true);
    x.set(0);
  };

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
    setTimeout(newQuestion, 1600);
  };

  if (!current) return <LoadingScreen />;

  return (
    <div className="fixed inset-0 h-[100dvh] bg-[#F5F5F7] text-[#1D1D1F] flex flex-col overflow-hidden font-sans select-none">
      <Head>
        <title>Guess The Party</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover"/>
      </Head>
      <Analytics />

      {/* Header */}
      <header className="px-6 pt-4 shrink-0 z-20">
        <div className="flex justify-between items-center bg-white/80 backdrop-blur-md p-3 rounded-2xl border border-white shadow-sm">
          <div className="flex items-center gap-2">
            <h1 className="text-[12px] font-black tracking-tighter uppercase">GUESS <span className="text-blue-600 italic font-serif">the</span> PARTY</h1>
            <div className="flex -space-x-1">
              {badges.filter(b => b.unlocked).map(b => (
                <div key={b.id} className="w-4 h-4 bg-white rounded-full flex items-center justify-center border border-gray-100 shadow-xs">
                  {b.icon}
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => setShowStats(true)} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
            <ChartBar size={18} className="text-gray-600" />
          </button>
        </div>
      </header>

      {/* Main Game Card - Scaled for Mobile */}
      <main className="flex-grow flex flex-col items-center justify-center px-6 py-2 relative min-h-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.name}
            drag={gameState === 'guessing' ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            style={{ x, rotate }}
            onDragEnd={(e, i) => { if(i.offset.x < -100) handleGuess('Democrat'); else if(i.offset.x > 100) handleGuess('Republican'); }}
            className="relative w-full max-w-[400px] h-full max-h-[75dvh] aspect-[3/4] bg-white rounded-[2rem] shadow-2xl border border-white overflow-hidden flex flex-col cursor-grab active:cursor-grabbing"
          >
            <div className="relative flex-grow min-h-0 bg-gray-50 flex items-center justify-center overflow-hidden">
              {imgLoading && <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-50"><Loader2 className="animate-spin text-blue-500" /></div>}

              <img
                src={current.imageUrl}
                onLoad={() => setImgLoading(false)}
                className={`w-full h-full object-contain object-top transition-all duration-700 ${gameState === 'revealed' ? 'scale-110 blur-xl brightness-50' : 'scale-100'}`}
                alt="Portrait"
              />

              {/* Tinder Stamps */}
              <motion.div style={{ opacity: opacityDem }} className="absolute top-8 right-6 border-4 border-blue-500 text-blue-500 font-black text-3xl px-3 py-1 rounded-lg rotate-12 pointer-events-none">DEM</motion.div>
              <motion.div style={{ opacity: opacityRep }} className="absolute top-8 left-6 border-4 border-red-500 text-red-500 font-black text-3xl px-3 py-1 rounded-lg -rotate-12 pointer-events-none">REP</motion.div>

              {gameState === 'revealed' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-white z-20">
                  <h2 className="text-2xl font-black leading-tight">{current.name}</h2>
                  <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mt-1">{current.party} • {current.state}</p>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="p-3 grid grid-cols-2 gap-2 bg-white shrink-0 border-t border-gray-50">
              <button onClick={() => handleGuess('Democrat')} disabled={gameState === 'revealed'} className="h-12 rounded-xl bg-[#00AEF3] text-white font-black text-[10px] uppercase tracking-widest active:scale-95 disabled:opacity-10">Democrat</button>
              <button onClick={() => handleGuess('Republican')} disabled={gameState === 'revealed'} className="h-12 rounded-xl bg-[#E81B23] text-white font-black text-[10px] uppercase tracking-widest active:scale-95 disabled:opacity-10">Republican</button>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer Stats - Ultra Slim */}
      <footer className="px-8 pb-8 pt-2 shrink-0 flex justify-between items-center text-gray-400">
        <div className="flex gap-4">
          <div className="flex flex-col">
            <span className="text-[8px] font-black uppercase">Streak</span>
            <span className="text-sm font-black text-blue-600">{stats.streak}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-black uppercase">Accuracy</span>
            <span className="text-sm font-black text-black">{stats.total === 0 ? 0 : Math.round((stats.correct / stats.total) * 100)}%</span>
          </div>
        </div>
        <p className="text-[8px] font-black uppercase tracking-tighter">By <span className="text-gray-900 font-bold underline">Allen Wang</span></p>
      </footer>

      {/* Stats Modal */}
      <AnimatePresence>
        {showStats && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }} className="fixed inset-0 z-50 bg-white flex flex-col">
            <div className="p-8 flex justify-between items-center border-b border-gray-50">
              <h2 className="text-2xl font-black">Mastery & Stats</h2>
              <button onClick={() => setShowStats(false)} className="p-2 bg-gray-100 rounded-full"><X size={20}/></button>
            </div>
            <div className="flex-grow overflow-y-auto p-8 space-y-8">
              <div className="grid grid-cols-2 gap-3">
                {badges.map(b => (
                  <div key={b.id} className={`p-4 rounded-3xl border ${b.unlocked ? 'bg-white border-gray-100 shadow-sm' : 'bg-gray-50 opacity-30 grayscale'}`}>
                    {b.icon}
                    <p className="text-[10px] font-black mt-2">{b.name}</p>
                    <p className="text-[8px] text-gray-500">{b.description}</p>
                  </div>
                ))}
              </div>
              <div className="h-px bg-gray-100" />
              <div className="flex justify-around">
                <div className="text-center"><p className="text-[8px] font-black text-gray-400 uppercase">Correct</p><p className="text-2xl font-black">{stats.correct}</p></div>
                <div className="text-center"><p className="text-[8px] font-black text-gray-400 uppercase">Best Streak</p><p className="text-2xl font-black text-blue-600">{stats.bestStreak}</p></div>
              </div>
              <button onClick={() => {if(confirm("Wipe data?")){localStorage.clear(); window.location.reload();}}} className="w-full py-4 text-[9px] font-black uppercase tracking-widest text-red-400 border border-red-50 rounded-2xl flex items-center justify-center gap-2"><RefreshCcw size={12}/> Reset Progress</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#F5F5F7] gap-4">
      <Loader2 className="animate-spin text-blue-600" />
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading House & Senate...</p>
    </div>
  );
}