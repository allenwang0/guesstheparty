import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { Analytics } from '@vercel/analytics/react';

export default function Home() {
  const [allPoliticians, setAllPoliticians] = useState([]);
  const [current, setCurrent] = useState(null);
  const [stats, setStats] = useState({ correct: 0, total: 0, streak: 0, bestStreak: 0 });
  const [gameState, setGameState] = useState('guessing');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategories, setActiveCategories] = useState(['senate', 'house', 'governor']);

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

  const handleSkip = () => {
    if (gameState !== 'guessing') return;
    newQuestion();
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
    <div className="fixed inset-0 h-[100dvh] bg-[#F5F5F7] text-[#1D1D1F] flex flex-col overflow-hidden font-sans">
      <Head>
        <title>Guess The Party</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover"/>
      </Head>
      <Analytics />

      {/* Header - Compact */}
      <header className="px-6 pt-6 pb-2 shrink-0">
        <div className="flex justify-between items-end">
          <h1 className="text-xl font-black tracking-tighter text-black leading-none">
            GUESS <span className="text-blue-600 font-serif italic">the</span> PARTY
          </h1>
          <div className="flex gap-4">
            <div className="text-right">
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Accuracy</p>
              <p className="text-lg font-black text-black">{accuracy}%</p>
            </div>
            <div className="text-right">
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Streak</p>
              <p className="text-lg font-black text-blue-600">{stats.streak}</p>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 mt-4 no-scrollbar">
          {['Senate', 'House', 'Governor'].map(cat => {
            const isActive = activeCategories.includes(cat.toLowerCase());
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat.toLowerCase())}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${
                  isActive ? 'bg-black border-black text-white' : 'bg-white border-gray-200 text-gray-400'
                }`}
              >
                <div className={`w-2 h-2 rounded-sm border transition-colors ${isActive ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`} />
                {cat}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Game Card */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 min-h-0 pt-2 pb-2">
        {current && (
          <div className="relative w-full max-w-[400px] h-full bg-white rounded-[2rem] shadow-xl border border-white overflow-hidden flex flex-col">
            <div className="relative flex-grow min-h-0 overflow-hidden bg-gray-100">
              <img
                src={current.imageUrl}
                className={`w-full h-full object-cover object-top transition-all duration-700 ${gameState === 'revealed' ? 'scale-110 blur-sm brightness-50' : 'scale-100'}`}
                alt="Politician"
              />

              {/* Skip Button - Floating */}
              {gameState === 'guessing' && (
                <button
                  onClick={handleSkip}
                  className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-full transition-all uppercase tracking-widest border border-white/10"
                >
                  Skip
                </button>
              )}

              {/* Reveal Overlay */}
              {gameState === 'revealed' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 animate-in fade-in zoom-in duration-300">
                  <div className={`mb-4 rounded-full w-14 h-14 flex items-center justify-center text-white text-2xl shadow-xl ${feedback === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {feedback === 'success' ? '✓' : '✕'}
                  </div>
                  <h2 className="text-2xl font-black text-white leading-tight">{current.name}</h2>
                  <p className="text-white/80 font-bold uppercase tracking-widest text-[10px] mt-1">
                    {current.party} • {current.state}
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons - Left Rep / Right Dem */}
            <div className="p-3 grid grid-cols-2 gap-2 bg-white shrink-0">
              <button
                onClick={() => handleGuess('Republican')}
                disabled={gameState === 'revealed'}
                className="h-14 rounded-xl bg-[#E81B23] text-white font-black text-[10px] uppercase tracking-[0.2em] active:scale-95 transition-all disabled:opacity-10"
              >
                Republican
              </button>
              <button
                onClick={() => handleGuess('Democrat')}
                disabled={gameState === 'revealed'}
                className="h-14 rounded-xl bg-[#00AEF3] text-white font-black text-[10px] uppercase tracking-[0.2em] active:scale-95 transition-all disabled:opacity-10"
              >
                Democrat
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer - Minimalistic */}
      <footer className="px-6 py-4 flex justify-between items-center shrink-0 text-gray-400">
        <div className="flex gap-4 items-center">
            <span className="text-[9px] font-black uppercase tracking-widest">Best: {stats.bestStreak}</span>
            <span className="w-1 h-1 bg-gray-200 rounded-full" />
            <span className="text-[9px] font-black uppercase tracking-widest">Total: {stats.total}</span>
        </div>
        <p className="text-[9px] font-black uppercase tracking-tighter">
            By <span className="text-gray-900">Allen Wang</span>
        </p>
      </footer>
    </div>
  );
}