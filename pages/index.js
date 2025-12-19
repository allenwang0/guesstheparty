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

    setTimeout(newQuestion, 1800);
  };

  const resetGame = () => {
    if (confirm("Reset your current session and streak?")) {
      setStats({ ...stats, correct: 0, total: 0, streak: 0 });
      newQuestion();
    }
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
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="fixed inset-0 h-[100dvh] bg-[#F5F5F7] text-[#1D1D1F] flex flex-col overflow-hidden font-sans">
      <Head>
        <title>Guess The Party</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover"/>
      </Head>
      <Analytics />

      {/* Header */}
      <header className="px-6 pt-8 pb-2 shrink-0">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-black leading-none">
              GUESS <span className="text-blue-600 font-serif italic">the</span> PARTY
            </h1>
            <button
              onClick={resetGame}
              className="text-[9px] text-gray-400 font-bold tracking-widest uppercase mt-2 hover:text-red-500 transition-colors"
            >
              Reset Session
            </button>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Accuracy</p>
            <p className="text-2xl font-black text-black leading-none">{accuracy}%</p>
          </div>
        </div>

        {/* Toggles with Checkbox Indicators */}
        <div className="flex gap-2 mt-5 overflow-x-auto pb-2 no-scrollbar">
          {['Senate', 'House', 'Governor'].map(cat => {
            const isActive = activeCategories.includes(cat.toLowerCase());
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat.toLowerCase())}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                  isActive ? 'bg-black border-black text-white shadow-lg' : 'bg-white border-gray-200 text-gray-400'
                }`}
              >
                <div className={`w-3 h-3 rounded border flex items-center justify-center transition-colors ${isActive ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                  {isActive && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </div>
                {cat}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Game Card */}
      <main className="flex-grow flex flex-col items-center justify-center px-6 min-h-0 py-4">
        {current && (
          <div className="relative w-full max-w-[400px] h-full bg-white rounded-[2.5rem] shadow-2xl border border-white overflow-hidden flex flex-col">
            <div className="relative flex-grow min-h-0 overflow-hidden bg-gray-100">
              <img
                src={current.imageUrl}
                className={`w-full h-full object-cover transition-all duration-700 ${gameState === 'revealed' ? 'scale-110 blur-md brightness-50' : 'scale-100'}`}
                alt="Politician"
              />

              {gameState === 'revealed' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 animate-in fade-in zoom-in duration-300">
                  <div className={`mb-4 rounded-full w-16 h-16 flex items-center justify-center text-white text-3xl shadow-xl ${feedback === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {feedback === 'success' ? '✓' : '✕'}
                  </div>
                  <h2 className="text-3xl font-black text-white mb-1 leading-tight">{current.name}</h2>
                  <p className="text-white/80 font-bold uppercase tracking-widest text-sm">
                    {current.party} • {current.state}
                  </p>
                </div>
              )}

              {stats.total === 0 && gameState === 'guessing' && (
                <div className="absolute inset-x-0 bottom-6 flex justify-center animate-bounce">
                  <div className="bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/20">
                    Choose a party
                  </div>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="p-4 grid grid-cols-2 gap-3 bg-white shrink-0">
              <button
                onClick={() => handleGuess('Democrat')}
                disabled={gameState === 'revealed'}
                className="h-16 rounded-2xl bg-[#00AEF3] text-white font-black text-xs uppercase tracking-widest active:scale-95 transition-all disabled:opacity-20"
              >
                Democrat
              </button>
              <button
                onClick={() => handleGuess('Republican')}
                disabled={gameState === 'revealed'}
                className="h-16 rounded-2xl bg-[#E81B23] text-white font-black text-xs uppercase tracking-widest active:scale-95 transition-all disabled:opacity-20"
              >
                Republican
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="px-8 pt-4 pb-10 flex justify-between items-center shrink-0 border-t border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="flex gap-8">
          <div className="text-center">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Streak</p>
            <p className="text-xl font-black">{stats.streak}</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Best</p>
            <p className="text-xl font-black text-blue-600">{stats.bestStreak}</p>
          </div>
        </div>
        <div className="text-right">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Designed by</p>
            <p className="text-sm font-black text-gray-800 tracking-tight">Allen Wang</p>
        </div>
      </footer>
    </div>
  );
}