import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { Analytics } from '@vercel/analytics/react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import {
  RefreshCcw, Loader2, Check, X as XIcon, Share2, Flame, Info, Timer, Target, Award
} from 'lucide-react';

// --- Assets & Icons ---
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

// --- Main Application ---
export default function Home() {
  const [allPoliticians, setAllPoliticians] = useState([]);
  const [current, setCurrent] = useState(null);
  const [loadingQueue, setLoadingQueue] = useState([]);
  const [hasMounted, setHasMounted] = useState(false);
  const [stats, setStats] = useState({
    correct: 0, total: 0, streak: 0, bestStreak: 0,
    demGuesses: 0, repGuesses: 0, demCorrect: 0, repCorrect: 0,
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
    if (savedStats) setStats(prev => ({ ...prev, ...JSON.parse(savedStats) }));

    const dismissed = localStorage.getItem('instructionsDismissed');
    if (!dismissed) setShowInstructions(true);
  }, []);

  useEffect(() => {
    if (hasMounted) localStorage.setItem('partyStats', JSON.stringify(stats));
  }, [stats, hasMounted]);

  const rank = useMemo(() => {
    const s = stats.bestStreak || 0;
    if (s >= 50) return { title: "Speaker of the House", color: "text-purple-600" };
    if (s >= 30) return { title: "Party Whip", color: "text-red-600" };
    if (s >= 20) return { title: "Senior Senator", color: "text-blue-600" };
    if (s >= 10) return { title: "Campaign Manager", color: "text-green-600" };
    if (s >= 5) return { title: "Staffer", color: "text-amber-600" };
    return { title: "Political Intern", color: "text-gray-400" };
  }, [stats.bestStreak]);

  const accuracy = useMemo(() => {
    const total = stats.total || 0;
    return total === 0 ? 0 : Math.round(((stats.correct || 0) / total) * 100);
  }, [stats]);

  const avgSpeed = useMemo(() => {
    const total = stats.total || 0;
    return total === 0 ? 0 : ((stats.totalTime || 0) / total / 1000).toFixed(1);
  }, [stats]);

  const handleGuess = (party) => {
    if (gameState !== 'guessing') return;
    const isCorrect = party === current.party;
    const isDem = current.party === 'Democrat';
    const timeTaken = Date.now() - (startTime || Date.now());

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
    }, 1800);
  };

  if (!hasMounted || !current) return <LoadingScreen message="Convening Congress..." />;

  return (
    <div className="fixed inset-0 h-[100dvh] w-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col overflow-hidden font-sans select-none overscroll-none touch-none">
      <Head>
        <title>Guess The Party | Allen Wang</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"/>
      </Head>
      <Analytics />

      {/* Header */}
      <header className="px-6 pt-6 shrink-0 z-20 flex justify-center">
        <div className="w-full max-w-xl flex justify-between items-center bg-white/80 backdrop-blur-md p-5 rounded-3xl border border-white shadow-sm relative overflow-hidden">
          <div className="flex flex-col items-start">
            <h1 className="text-xl font-black tracking-tighter uppercase leading-[0.8] w-full flex items-center gap-2">
              <span className="text-lg">🇺🇸</span> GUESS THE PARTY <span className="text-lg">🇺🇸</span>
            </h1>
            <p className="text-[7.5px] font-black text-gray-400 uppercase tracking-[0.38em] w-full mt-1">
              Created by Allen Wang
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowInstructions(true)} className="p-2 bg-gray-50 rounded-full active:scale-90 transition-transform"><Info size={20} className="text-gray-400" /></button>
            <button onClick={() => setShowStats(true)} className="px-4 py-2 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform">Stats</button>
          </div>
        </div>
      </header>

      {/* Main Game Card */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 py-2 relative min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.name}
            drag={gameState === 'guessing' ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            style={{ x, rotate }}
            onDragEnd={(e, i) => { if(i.offset.x < -80) handleGuess('Democrat'); else if(i.offset.x > 80) handleGuess('Republican'); }}
            className="relative w-full max-w-[450px] h-full max-h-[70dvh] bg-white rounded-[3rem] shadow-2xl border border-white overflow-hidden flex flex-col cursor-grab active:cursor-grabbing"
          >
            <div className="relative flex-grow min-h-0 bg-[#fbfbfb] flex items-center justify-center overflow-hidden">
              {imgLoading && <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-50"><Loader2 className="animate-spin text-blue-500" size={32} /></div>}
              <img src={current.imageUrl} onLoad={() => setImgLoading(false)} className={`w-full h-full object-contain object-top transition-all duration-700 ${gameState === 'revealed' ? 'scale-110 blur-2xl brightness-[0.3]' : 'scale-100'}`} alt="Politician" />

              {gameState === 'revealed' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 z-20">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 shadow-xl ${stats.streak > 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                    {stats.streak > 0 ? <Check size={32} className="text-white" strokeWidth={4} /> : <XIcon size={32} className="text-white" strokeWidth={4} />}
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">{current.name}</h2>
                    <div className="flex flex-col items-center gap-1 pt-4">
                      <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] ${current.party === 'Democrat' ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'}`}>
                        {current.party}
                      </span>
                      <span className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em] mt-3">{current.state}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
            <div className="p-4 grid grid-cols-2 gap-4 bg-white shrink-0">
              <button onClick={() => handleGuess('Democrat')} disabled={gameState === 'revealed'} className="h-16 rounded-2xl bg-[#00AEF3] text-white font-black text-xs uppercase tracking-widest active:scale-95 transition-all">Democrat</button>
              <button onClick={() => handleGuess('Republican')} disabled={gameState === 'revealed'} className="h-16 rounded-2xl bg-[#E81B23] text-white font-black text-xs uppercase tracking-widest active:scale-95 transition-all">Republican</button>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer HUD */}
      <footer className="px-6 pb-10 pt-4 shrink-0 flex justify-center">
        <div className="w-full max-w-xl bg-white/50 backdrop-blur-xl border border-white/40 p-5 rounded-[2.5rem] shadow-xl flex justify-between items-center">
          <div className="flex gap-8">
            <div className="flex flex-col"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Streak</span><div className="flex items-center gap-1.5"><span className="text-2xl font-black text-blue-600 leading-none">{stats.streak || 0}</span>{stats.streak >= 5 && <Flame size={18} className="text-orange-500 fill-orange-500" />}</div></div>
            <div className="flex flex-col"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Accuracy</span><span className="text-2xl font-black leading-none">{accuracy}%</span></div>
          </div>
          <button onClick={() => { if(confirm("Reset stats?")){localStorage.clear(); window.location.reload();}}} className="p-3 rounded-full bg-red-50 text-red-400 active:rotate-180 transition-transform duration-500"><RefreshCcw size={18}/></button>
        </div>
      </footer>

      {/* Overlays */}
      <AnimatePresence>
        {showInstructions && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setShowInstructions(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-[3rem] p-10 max-w-md w-full relative" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-3xl font-black mb-8 italic uppercase tracking-tighter">How to Play</h3>
              <div className="space-y-6">
                <div className="flex items-center gap-4"><span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">1</span><p className="font-bold text-gray-600">Swipe <span className="text-blue-600">Left</span> for Democrats</p></div>
                <div className="flex items-center gap-4"><span className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold">2</span><p className="font-bold text-gray-600">Swipe <span className="text-red-600">Right</span> for Republicans</p></div>
              </div>
              <button onClick={() => { localStorage.setItem('instructionsDismissed', 'true'); setShowInstructions(false); }} className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest mt-10">Start Playing</button>
            </motion.div>
          </div>
        )}

        {showStats && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xl flex flex-col items-center justify-center p-6" onClick={() => setShowStats(false)}>
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-[#F5F5F7] w-full max-w-md rounded-[3rem] p-8 shadow-2xl relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <StarFlair className="top-10 left-10" />
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-black italic uppercase tracking-tighter">Dossier</h2>
                <button onClick={() => setShowStats(false)} className="p-2 bg-white rounded-full active:scale-90"><XIcon size={20}/></button>
              </div>

              <div className="bg-white p-6 rounded-[2rem] shadow-sm mb-6 flex flex-col items-center border-t-4 border-blue-500">
                <Award className={`mb-2 ${rank.color}`} size={32} />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Current Standing</p>
                <p className={`text-2xl font-black ${rank.color} uppercase tracking-tight`}>{rank.title}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-5 rounded-[2rem] flex flex-col items-center border-b-4 border-red-500"><Timer className="text-blue-500 mb-1" size={20}/><p className="text-[9px] font-black text-gray-400 uppercase">Avg Speed</p><p className="text-xl font-black">{avgSpeed}s</p></div>
                <div className="bg-white p-5 rounded-[2rem] flex flex-col items-center border-b-4 border-blue-500"><Target className="text-red-500 mb-1" size={20}/><p className="text-[9px] font-black text-gray-400 uppercase">Total Seen</p><p className="text-xl font-black">{stats.total}</p></div>
              </div>

              <div className="bg-white p-6 rounded-[2rem] space-y-4 mb-6">
                <StatBar label="Democrat Accuracy" current={stats.demCorrect} total={stats.demGuesses} color="bg-blue-500" />
                <StatBar label="Republican Accuracy" current={stats.repCorrect} total={stats.repGuesses} color="bg-red-500" />
              </div>

              <button onClick={() => { setShowStats(false); setShowWrapped(true); }} className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-transform"><Share2 size={16}/> View Wrapped 🇺🇸</button>
            </motion.div>
          </div>
        )}

        {showWrapped && (
          <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6" onClick={() => setShowWrapped(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-sm aspect-[9/16] bg-gradient-to-b from-[#1c1c1e] to-black rounded-[3rem] p-10 flex flex-col border border-white/10 overflow-hidden" onClick={(e) => e.stopPropagation()}>

              <button onClick={() => setShowWrapped(false)} className="absolute top-8 right-8 p-2 bg-white/10 backdrop-blur-xl rounded-full z-50 active:scale-90"><XIcon size={20} className="text-white" /></button>

              <div className="flex-grow pt-10 text-white">
                <h3 className="text-5xl font-black leading-[0.85] tracking-tighter mb-12">POLITICAL<br/><span className="text-blue-500 italic font-serif text-4xl">wrapped</span></h3>
                <div className="space-y-10 relative">
                    <div><p className="text-[10px] font-black text-white/40 uppercase mb-2">Your Identity</p><p className="text-3xl font-black uppercase leading-tight">{rank.title}</p></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><p className="text-[10px] font-black text-white/40 uppercase mb-1">Accuracy</p><p className="text-3xl font-black">{accuracy}%</p></div>
                        <div><p className="text-[10px] font-black text-white/40 uppercase mb-1">Max Streak</p><p className="text-3xl font-black text-blue-500">{stats.bestStreak}</p></div>
                    </div>
                    <div className="pt-10 border-t border-white/10 flex justify-between items-center px-4">
                        <DonkeyIcon className="w-14 h-14 object-contain brightness-125 contrast-125" />
                        <div className="h-10 w-[1px] bg-white/10" />
                        <ElephantIcon className="w-14 h-14 object-contain brightness-125 contrast-125" />
                    </div>
                </div>
              </div>
              <div className="text-center pt-8">
                <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em]">🇺🇸 Guess the Party • Allen Wang 🇺🇸</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Helpers ---
function StatBar({ label, current, total, color }) {
  const pct = !total ? 0 : Math.round(((current || 0) / total) * 100);
  return (
    <div>
      <div className="flex justify-between text-[9px] font-black mb-1 uppercase tracking-tighter"><span>{label}</span><span className="text-gray-400">{pct}%</span></div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className={`h-full ${color || 'bg-black'}`} />
      </div>
    </div>
  );
}

function LoadingScreen({ message }) {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#F5F5F7] gap-4 overscroll-none touch-none">
      <Loader2 className="animate-spin text-blue-600" size={48} />
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">{message}</p>
    </div>
  );
}