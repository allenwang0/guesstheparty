import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { Analytics } from '@vercel/analytics/react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';

export default function Home() {
  const [allPoliticians, setAllPoliticians] = useState([]);
  const [current, setCurrent] = useState(null);
  const [stats, setStats] = useState({ correct: 0, total: 0, streak: 0, bestStreak: 0 });
  const [gameState, setGameState] = useState('guessing');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategories, setActiveCategories] = useState(['senate', 'house', 'governor']);

  // Motion values for swipe logic
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacityDem = useTransform(x, [-150, -50], [1, 0]);
  const opacityRep = useTransform(x, [50, 150], [0, 1]);

  useEffect(() => {
    fetch('/politicians.json')
      .then(res => res.json())
      .then(data => {
        setAllPoliticians(data.map(p => ({ ...p, imageUrl: p.img || p.image_url })));
        setLoading(false);
      });
    const saved = localStorage.getItem('bestStreak');
    if (saved) setStats(s => ({ ...s, bestStreak: parseInt(saved) }));
  }, []);

  const filteredPool = useMemo(() =>
    allPoliticians.filter(p => activeCategories.includes(p.category.toLowerCase())),
    [allPoliticians, activeCategories]
  );

  const accuracy = useMemo(() =>
    stats.total === 0 ? 0 : Math.round((stats.correct / stats.total) * 100),
    [stats]
  );

  useEffect(() => {
    if (filteredPool.length > 0 && !current && !loading) newQuestion();
  }, [filteredPool, current, loading]);

  const newQuestion = () => {
    const random = filteredPool[Math.floor(Math.random() * filteredPool.length)];
    setCurrent(random);
    setGameState('guessing');
    setFeedback(null);
    x.set(0); // Reset drag position
  };

  const handleGuess = (party) => {
    if (gameState !== 'guessing') return;
    const isCorrect = party === current.party;
    setGameState('revealed');
    setFeedback(isCorrect ? 'success' : 'error');

    const newStreak = isCorrect ? stats.streak + 1 : 0;
    const newBest = Math.max(newStreak, stats.bestStreak);
    if (isCorrect) localStorage.setItem('bestStreak', newBest.toString());

    setStats(s => ({
      ...s,
      correct: isCorrect ? s.correct + 1 : s.correct,
      total: s.total + 1,
      streak: newStreak,
      bestStreak: newBest
    }));

    setTimeout(newQuestion, 1600);
  };

  const onDragEnd = (event, info) => {
    if (gameState !== 'guessing') return;
    if (info.offset.x < -100) handleGuess('Democrat');
    else if (info.offset.x > 100) handleGuess('Republican');
  };

  const toggleCategory = (cat) => {
    setActiveCategories(prev => {
      const next = prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat];
      return next.length === 0 ? prev : next;
    });
    setCurrent(null);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#F5F5F7]"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="fixed inset-0 h-[100dvh] bg-[#F5F5F7] text-[#1D1D1F] flex flex-col overflow-hidden font-sans">
      <Head>
        <title>Guess The Party</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover"/>
      </Head>
      <Analytics />

      {/* Unified Header */}
      <header className="px-6 pt-6 shrink-0">
        <div className="flex justify-between items-center bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex flex-col">
            <h1 className="text-sm font-black tracking-tighter text-black leading-none">GUESS <span className="text-blue-600 font-serif italic">the</span> PARTY</h1>
            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">Accuracy: {accuracy}%</p>
          </div>
          <div className="flex gap-1">
            {['Senate', 'House', 'Governor'].map(cat => (
              <button
                key={cat}
                onClick={() => toggleCategory(cat.toLowerCase())}
                className={`px-2 py-1 rounded-lg text-[9px] font-black transition-all border ${
                  activeCategories.includes(cat.toLowerCase()) ? 'bg-black border-black text-white' : 'bg-gray-50 border-gray-200 text-gray-400'
                }`}
              >
                {cat[0]}
              </button>
            ))}
          </div>
          <div className="text-right border-l pl-3 border-gray-100">
            <p className="text-[8px] font-black text-gray-400 uppercase">Streak</p>
            <p className="text-sm font-black text-blue-600 leading-none">{stats.streak}</p>
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 min-h-0 py-4 relative">
        <AnimatePresence mode="wait">
          {current && (
            <motion.div
              key={current.name}
              drag={gameState === 'guessing' ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              style={{ x, rotate }}
              onDragEnd={onDragEnd}
              whileTap={{ scale: 1.02 }}
              className="relative w-full max-w-[400px] h-full bg-white rounded-[2.5rem] shadow-2xl border border-white overflow-hidden flex flex-col cursor-grab active:cursor-grabbing"
            >
              <div className="relative flex-grow min-h-0 overflow-hidden bg-gray-100">
                <img
                  src={current.imageUrl}
                  className={`w-full h-full object-cover object-top transition-all duration-700 ${gameState === 'revealed' ? 'scale-110 blur-md brightness-50' : 'scale-100'}`}
                  alt="Politician"
                />

                {/* Tinder Stamps */}
                <motion.div style={{ opacity: opacityDem }} className="absolute top-10 right-10 border-4 border-[#00AEF3] text-[#00AEF3] font-black text-4xl px-4 py-2 rounded-xl rotate-12 pointer-events-none uppercase">DEM</motion.div>
                <motion.div style={{ opacity: opacityRep }} className="absolute top-10 left-10 border-4 border-[#E81B23] text-[#E81B23] font-black text-4xl px-4 py-2 rounded-xl -rotate-12 pointer-events-none uppercase">REP</motion.div>

                {/* Reveal Overlay */}
                {gameState === 'revealed' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 animate-in fade-in zoom-in duration-300">
                    <div className={`mb-4 rounded-full w-14 h-14 flex items-center justify-center text-white text-2xl shadow-xl ${feedback === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                      {feedback === 'success' ? '✓' : '✕'}
                    </div>
                    <h2 className="text-2xl font-black text-white leading-tight">{current.name}</h2>
                    <p className="text-white/80 font-bold uppercase tracking-widest text-[10px] mt-1">{current.party} • {current.state}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="p-4 grid grid-cols-2 gap-3 bg-white shrink-0">
                <button
                  onClick={() => handleGuess('Democrat')}
                  disabled={gameState === 'revealed'}
                  className="h-14 rounded-2xl border-2 border-[#00AEF3] text-[#00AEF3] font-black text-[10px] uppercase tracking-widest active:bg-[#00AEF3] active:text-white transition-all disabled:opacity-10"
                >
                  Democrat
                </button>
                <button
                  onClick={() => handleGuess('Republican')}
                  disabled={gameState === 'revealed'}
                  className="h-14 rounded-2xl border-2 border-[#E81B23] text-[#E81B23] font-black text-[10px] uppercase tracking-widest active:bg-[#E81B23] active:text-white transition-all disabled:opacity-10"
                >
                  Republican
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="px-8 py-4 flex justify-between items-center shrink-0">
         <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Best: {stats.bestStreak}</p>
         <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">By <span className="text-gray-900">Allen Wang</span></p>
      </footer>
    </div>
  );
}