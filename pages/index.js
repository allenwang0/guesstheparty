import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';

export default function Home() {
  const [allPoliticians, setAllPoliticians] = useState([]);
  const [current, setCurrent] = useState(null);
  const [stats, setStats] = useState({ correct: 0, incorrect: 0, streak: 0, bestStreak: 0 });
  const [feedback, setFeedback] = useState(null); // 'success' | 'error' | null
  const [gameState, setGameState] = useState('guessing'); // 'guessing' | 'revealed'
  const [loading, setLoading] = useState(true);
  const [imgLoading, setImgLoading] = useState(true);
  const [activeCategories, setActiveCategories] = useState(['senate', 'house', 'governor']);

  useEffect(() => {
    fetch('/politicians.json')
      .then(res => res.json())
      .then(data => {
        const normalized = data.map(p => ({
          ...p,
          imageUrl: p.img || p.image_url
        }));
        setAllPoliticians(normalized);
        setLoading(false);
      });

    // Load high score
    const saved = localStorage.getItem('bestStreak');
    if (saved) setStats(prev => ({ ...prev, bestStreak: parseInt(saved) }));
  }, []);

  const filteredPool = useMemo(() => {
    return allPoliticians.filter(p => activeCategories.includes(p.category.toLowerCase()));
  }, [allPoliticians, activeCategories]);

  useEffect(() => {
    if (filteredPool.length > 0 && !current && !loading) {
      newQuestion();
    }
  }, [filteredPool, current, loading]);

  const newQuestion = () => {
    const random = filteredPool[Math.floor(Math.random() * filteredPool.length)];
    setCurrent(random);
    setImgLoading(true);
    setGameState('guessing');
    setFeedback(null);
  };

  const handleGuess = (party) => {
    if (gameState !== 'guessing') return;

    const isCorrect = party === current.party;
    setGameState('revealed');

    if (isCorrect) {
      const newStreak = stats.streak + 1;
      const newBest = Math.max(newStreak, stats.bestStreak);
      setStats(s => ({ ...s, correct: s.correct + 1, streak: newStreak, bestStreak: newBest }));
      setFeedback('success');
      localStorage.setItem('bestStreak', newBest.toString());
    } else {
      setStats(s => ({ ...s, incorrect: s.incorrect + 1, streak: 0 }));
      setFeedback('error');
    }

    setTimeout(() => {
      newQuestion();
    }, 2200);
  };

  const resetGame = () => {
    setStats({ correct: 0, incorrect: 0, streak: 0, bestStreak: stats.bestStreak });
    newQuestion();
  };

  const toggleCategory = (cat) => {
    setActiveCategories(prev => {
      const next = prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat];
      return next.length === 0 ? prev : next; // Prevent selecting zero
    });
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#F5F5F7] text-[#1D1D1F] flex flex-col font-sans">
      <Head><title>Guess The Party</title></Head>

      {/* Header - Fixed Height */}
      <header className="p-4 md:p-6 flex justify-between items-center shrink-0">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold tracking-tight">Guess The Party</h1>
          <button onClick={resetGame} className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-red-500 transition-colors text-left">
            Reset Stats
          </button>
        </div>

        {/* Categories as Checkboxes */}
        <div className="flex gap-1 bg-gray-200/50 p-1 rounded-xl shrink-0 scale-90 md:scale-100">
          {['Senate', 'House', 'Governor'].map(cat => (
            <button
              key={cat}
              onClick={() => toggleCategory(cat.toLowerCase())}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeCategories.includes(cat.toLowerCase())
                  ? 'bg-white shadow-sm text-blue-600'
                  : 'text-gray-400 opacity-60'
              }`}
            >
              <div className={`w-3 h-3 rounded-sm border flex items-center justify-center ${activeCategories.includes(cat.toLowerCase()) ? 'bg-blue-600 border-blue-600' : 'border-gray-400'}`}>
                {activeCategories.includes(cat.toLowerCase()) && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
              </div>
              {cat}
            </button>
          ))}
        </div>
      </header>

      {/* Main Game Area - Flex Grow to fill space */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 pb-8 min-h-0">

        {/* Stats Row */}
        <div className="flex gap-8 mb-4 text-center">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Streak</p>
            <p className="text-2xl font-black text-blue-600 leading-none">{stats.streak}</p>
          </div>
          <div className="w-px h-8 bg-gray-200 self-center" />
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Best</p>
            <p className="text-2xl font-black text-gray-400 leading-none">{stats.bestStreak}</p>
          </div>
          <div className="w-px h-8 bg-gray-200 self-center" />
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">W/L</p>
            <p className="text-2xl font-black text-gray-800 leading-none">{stats.correct}/{stats.incorrect}</p>
          </div>
        </div>

        {/* The Card */}
        {current && (
          <div className="relative w-full max-w-[380px] h-full max-h-[580px] flex flex-col bg-white rounded-[2rem] shadow-2xl border border-white overflow-hidden shrink min-h-0">

            {/* Blind Image Container */}
            <div className="relative flex-grow bg-gray-100 overflow-hidden min-h-0">
              {imgLoading && (
                <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200" />
              )}
              <img
                src={current.imageUrl}
                alt="Politician"
                className={`w-full h-full object-cover transition-all duration-700 ${imgLoading ? 'opacity-0' : 'opacity-100'} ${gameState === 'revealed' ? 'scale-105' : 'scale-100'}`}
                onLoad={() => setImgLoading(false)}
              />

              {/* Reveal Info Overlay (Bottom-aligned) */}
              {gameState === 'revealed' && (
                <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white pt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h2 className="text-2xl font-black leading-tight">{current.name}</h2>
                  <p className="text-sm font-bold text-white/80 uppercase tracking-widest">
                    {current.party} • {current.state}
                  </p>
                </div>
              )}

              {/* Feedback Status Indicator */}
              {feedback && (
                <div className={`absolute top-6 right-6 px-4 py-2 rounded-full font-black text-white shadow-lg animate-bounce ${feedback === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                  {feedback === 'success' ? '+1' : 'WRONG'}
                </div>
              )}
            </div>

            {/* Buttons Area - Fixed size */}
            <div className="p-6 grid grid-cols-2 gap-4 bg-white shrink-0">
              <button
                onClick={() => handleGuess('Democrat')}
                disabled={gameState === 'revealed'}
                className="h-14 rounded-xl bg-[#00AEF3] text-white font-black text-sm uppercase tracking-widest hover:brightness-105 active:scale-95 transition-all disabled:grayscale disabled:opacity-20"
              >
                Democrat
              </button>
              <button
                onClick={() => handleGuess('Republican')}
                disabled={gameState === 'revealed'}
                className="h-14 rounded-xl bg-[#E81B23] text-white font-black text-sm uppercase tracking-widest hover:brightness-105 active:scale-95 transition-all disabled:grayscale disabled:opacity-20"
              >
                Republican
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#F5F5F7] gap-4">
      <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">Loading Congress...</p>
    </div>
  );
}