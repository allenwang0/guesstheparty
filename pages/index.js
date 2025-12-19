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
    x.set(0);
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

  const resetStats = () => {
    if (confirm("Reset your current session and score?")) {
      setStats({ correct: 0, total: 0, streak: 0, bestStreak: stats.bestStreak });
      newQuestion();
    }
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

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#F5F5F7]">
      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="fixed inset-0 h-[100dvh] bg-[#F5F5F7] text-[#1D1D1F] flex flex-col overflow-hidden font-sans select-none">
      <Head>
        <title>Guess The Party</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover"/>
      </Head>
      <Analytics />

      {/* Header */}
      <header className="px-6 pt-6 shrink-0 z-10">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-black tracking-tighter text-black leading-none">
            GUESS <span className="text-blue-600 font-serif italic">the</span> PARTY
          </h1>
          <button
            onClick={resetStats}
            className="text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors"
          >
            Reset Session
          </button>
        </div>

        {/* Categories Toggles */}
        <div className="flex gap-2 mb-2 no-scrollbar">
          {[
            { id: 'senate', label: 'Senator' },
            { id: 'house', label: 'Representative' },
            { id: 'governor', label: 'Governor' }
          ].map(cat => {
            const isActive = activeCategories.includes(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black transition-all border ${
                  isActive ? 'bg-black border-black text-white shadow-md' : 'bg-white border-gray-200 text-gray-400'
                }`}
              >
                <div className={`w-3 h-3 rounded-sm border flex items-center justify-center ${isActive ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                  {isActive && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </div>
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Scoring Dashboard */}
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
           <div className="text-center flex-1 border-r border-gray-50">
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Accuracy</p>
              <p className="text-lg font-black text-black">{accuracy}%</p>
           </div>
           <div className="text-center flex-1 relative">
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Current Streak</p>
              <p className="text-lg font-black text-blue-600">{stats.streak}</p>
              <AnimatePresence>
                {feedback === 'success' && (
                  <motion.span
                    initial={{ y: 0, opacity: 1 }}
                    animate={{ y: -20, opacity: 0 }}
                    className="absolute top-0 right-4 text-green-500 font-black text-xs"
                  >
                    +1
                  </motion.span>
                )}
              </AnimatePresence>
           </div>
           <div className="text-center flex-1 border-l border-gray-50">
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Best</p>
              <p className="text-lg font-black text-gray-800">{stats.bestStreak}</p>
           </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 min-h-0 py-2 relative">
        <AnimatePresence mode="wait">
          {current && (
            <motion.div
              key={current.name}
              drag={gameState === 'guessing' ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              style={{ x, rotate }}
              onDragEnd={onDragEnd}
              whileTap={{ scale: 1.02 }}
              className="relative w-full max-w-[380px] h-full bg-white rounded-[2.5rem] shadow-2xl border border-white overflow-hidden flex flex-col cursor-grab active:cursor-grabbing"
            >
              <div className="relative flex-grow min-h-0 overflow-hidden bg-gray-100">
                <img
                  src={current.imageUrl}
                  className={`w-full h-full object-cover object-top transition-all duration-700 ${gameState === 'revealed' ? 'scale-110 blur-lg brightness-50' : 'scale-100'}`}
                  alt="Politician"
                />

                {/* Tinder Stamps */}
                <motion.div style={{ opacity: opacityDem }} className="absolute top-12 right-8 border-4 border-[#00AEF3] text-[#00AEF3] font-black text-4xl px-4 py-1 rounded-xl rotate-12 pointer-events-none uppercase tracking-tighter">DEMOCRAT</motion.div>
                <motion.div style={{ opacity: opacityRep }} className="absolute top-12 left-8 border-4 border-[#E81B23] text-[#E81B23] font-black text-4xl px-4 py-1 rounded-xl -rotate-12 pointer-events-none uppercase tracking-tighter">REPUBLICAN</motion.div>

                {/* Reveal Overlay */}
                {gameState === 'revealed' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={`mb-4 rounded-full w-16 h-16 flex items-center justify-center text-white text-3xl shadow-xl ${feedback === 'success' ? 'bg-green-500' : 'bg-red-500'}`}
                    >
                      {feedback === 'success' ? '✓' : '✕'}
                    </motion.div>
                    <h2 className="text-3xl font-black text-white leading-tight px-2">{current.name}</h2>
                    <p className="text-white/80 font-bold uppercase tracking-widest text-[10px] mt-2">
                       {current.party} • {current.state}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="p-4 grid grid-cols-2 gap-4 bg-white shrink-0">
                <button
                  onClick={() => handleGuess('Democrat')}
                  disabled={gameState === 'revealed'}
                  className="h-14 rounded-2xl bg-[#00AEF3] text-white font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all disabled:opacity-10"
                >
                  Democrat
                </button>
                <button
                  onClick={() => handleGuess('Republican')}
                  disabled={gameState === 'revealed'}
                  className="h-14 rounded-2xl bg-[#E81B23] text-white font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all disabled:opacity-10"
                >
                  Republican
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="px-8 pb-8 pt-2 flex justify-center shrink-0">
         <p className="text-[10px] font-black text-gray-300 uppercase tracking-tighter">
            Developed by <span className="text-gray-900">Allen Wang</span>
         </p>
      </footer>
    </div>
  );
}