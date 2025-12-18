import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Game() {
  const [fullPool, setFullPool] = useState([]);
  const [currentRound, setCurrentRound] = useState([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [globalScore, setGlobalScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [mode, setMode] = useState('mixed');

  useEffect(() => {
    // Load local data - No CORS errors possible
    fetch('/politicians.json')
      .then(res => res.json())
      .then(data => {
        setFullPool(data);
        startNewRound(data, 'mixed');
      });
    setGlobalScore(parseInt(localStorage.getItem('total_score') || 0));
  }, []);

  const startNewRound = (data, selectedMode) => {
    const pool = data || fullPool;
    const filtered = selectedMode === 'mixed' ? pool : pool.filter(p => p.category === selectedMode);
    const shuffled = [...filtered].sort(() => 0.5 - Math.random()).slice(0, 20);
    setCurrentRound(shuffled);
    setIndex(0);
    setScore(0);
    setFeedback(null);
    setIsLocked(false);
  };

  const makeGuess = (guess) => {
    if (isLocked || index >= currentRound.length) return; // Fix multi-click glitch
    setIsLocked(true);

    const current = currentRound[index];
    const isCorrect = guess === current.party;

    if (isCorrect) {
      const newGlobal = globalScore + 1;
      setScore(s => s + 1);
      setGlobalScore(newGlobal);
      localStorage.setItem('total_score', newGlobal);
    }

    setFeedback({
      correct: isCorrect,
      name: current.name,
      party: current.party,
      state: current.state
    });

    setTimeout(() => {
      setFeedback(null);
      if (index + 1 < currentRound.length) {
        setIndex(i => i + 1);
        setIsLocked(false);
      } else {
        setIndex(20); // End round
      }
    }, 1500);
  };

  if (currentRound.length === 0) return <div className="min-h-screen bg-[#0b0e14] flex items-center justify-center">Loading Database...</div>;

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col items-center p-4">
      <Head><title>Guess The Party</title></Head>

      {/* Header */}
      <div className="w-full max-w-md flex justify-between items-center mt-4">
        <div>
          <p className="text-[10px] font-black uppercase text-gray-500">Global Correct</p>
          <p className="text-xl font-bold text-blue-400">{globalScore}</p>
        </div>
        <p className="text-sm font-bold text-gray-400">{index < 20 ? index + 1 : 20} / 20</p>
      </div>

      {/* Mode Selector */}
      <div className="grid grid-cols-4 gap-2 w-full max-w-md mt-6">
        {['house', 'senate', 'gov', 'mixed'].map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); startNewRound(null, m); }}
            className={`py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${mode === m ? 'bg-blue-600' : 'bg-white/5'}`}
          >
            {m === 'gov' ? 'Gov' : m}
          </button>
        ))}
      </div>

      {/* Main Stage */}
      <div className="relative mt-8 h-[60vh] w-full max-w-[400px] bg-[#161b22] rounded-[40px] overflow-hidden border border-white/10 shadow-2xl">
        {index < 20 ? (
          <>
            <img src={currentRound[index].img} className="w-full h-full object-cover" alt="Portrait" />
            {feedback && (
              <div className={`absolute inset-0 flex flex-col items-center justify-center backdrop-blur-xl transition-opacity duration-300 ${feedback.correct ? 'bg-green-900/80' : 'bg-red-900/80'}`}>
                <p className="text-7xl mb-4">{feedback.correct ? '✓' : '✕'}</p>
                <p className="text-xl font-bold">{feedback.name}</p>
                <p className="text-sm uppercase tracking-widest mt-2">{feedback.party} • {feedback.state}</p>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <h2 className="text-3xl font-black mb-4">ROUND OVER</h2>
            <p className="text-6xl font-black text-blue-500">{score} / 20</p>
            <button onClick={() => startNewRound(null, mode)} className="mt-8 px-10 py-4 bg-white text-black rounded-full font-bold">REPLAY</button>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {index < 20 && (
        <div className="w-full max-w-md flex gap-4 mt-8 mb-8">
          <button onClick={() => makeGuess('Democrat')} disabled={isLocked} className="flex-1 py-6 rounded-[2.5rem] bg-[#0d1526] border border-blue-900 text-blue-400 font-black uppercase tracking-widest active:scale-95 disabled:opacity-50">Democrat</button>
          <button onClick={() => makeGuess('Republican')} disabled={isLocked} className="flex-1 py-6 rounded-[2.5rem] bg-[#1a0f12] border border-red-900 text-red-400 font-black uppercase tracking-widest active:scale-95 disabled:opacity-50">Republican</button>
        </div>
      )}
    </div>
  );
}