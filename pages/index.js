import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';

export default function Home() {
  const [allPoliticians, setAllPoliticians] = useState([]);
  const [current, setCurrent] = useState(null);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgLoading, setImgLoading] = useState(true);

  // Filtering state
  const [activeCategories, setActiveCategories] = useState(['senate', 'house', 'governor']);

  useEffect(() => {
    fetch('/politicians.json')
      .then(res => res.json())
      .then(data => {
        // Normalize keys here so UI logic is cleaner
        const normalized = data.map(p => ({
          ...p,
          imageUrl: p.img || p.image_url // handles both naming conventions
        }));
        setAllPoliticians(normalized);
        setLoading(false);
      });
  }, []);

  // Filter the pool based on user selection
  const filteredPool = useMemo(() => {
    return allPoliticians.filter(p => activeCategories.includes(p.category.toLowerCase()));
  }, [allPoliticians, activeCategories]);

  // Select a new question whenever the pool changes or game resets
  useEffect(() => {
    if (filteredPool.length > 0 && !current && !loading) {
      newQuestion();
    }
  }, [filteredPool, current, loading]);

  const newQuestion = () => {
    const random = filteredPool[Math.floor(Math.random() * filteredPool.length)];
    setCurrent(random);
    setImgLoading(true); // Reset loader for new image
  };

  const handleGuess = (party) => {
    const isCorrect = party === current.party;
    if (isCorrect) setScore(s => s + 1);

    setFeedback({
      type: isCorrect ? 'success' : 'error',
      correctParty: current.party
    });

    setTimeout(() => {
      setFeedback(null);
      setCurrent(null); // Triggers the useEffect to pick a new one
    }, 1800);
  };

  const toggleCategory = (cat) => {
    setActiveCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
    setCurrent(null); // Refresh current card if filters change
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-sans selection:bg-blue-100">
      <Head><title>Guess The Party</title></Head>

      <main className="max-w-xl mx-auto pt-12 px-6">
        {/* Top Navigation / Filters */}
        <div className="flex flex-col gap-6 mb-8">
          <div className="flex justify-between items-end">
            <h1 className="text-4xl font-bold tracking-tight">Guess The Party</h1>
            <div className="text-right">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Score</p>
              <p className="text-3xl font-black text-blue-600 leading-none">{score}</p>
            </div>
          </div>

          <div className="flex gap-2 p-1 bg-gray-200/50 rounded-xl w-fit">
            {['Senate', 'House', 'Governor'].map(cat => (
              <button
                key={cat}
                onClick={() => toggleCategory(cat.toLowerCase())}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeCategories.includes(cat.toLowerCase())
                    ? 'bg-white shadow-sm text-black'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Game Card */}
        {current && (
          <div className="relative group">
            <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden border border-white transition-transform duration-500 hover:scale-[1.01]">

              {/* Image Section */}
              <div className="aspect-[4/5] relative bg-gray-100 overflow-hidden">
                {imgLoading && (
                  <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200" />
                )}
                <img
                  src={current.imageUrl}
                  alt={current.name}
                  className={`w-full h-full object-cover transition-opacity duration-500 ${imgLoading ? 'opacity-0' : 'opacity-100'}`}
                  onLoad={() => setImgLoading(false)}
                />

                {/* Feedback Overlay */}
                {feedback && (
                  <div className={`absolute inset-0 flex flex-col items-center justify-center backdrop-blur-xl transition-all duration-300 ${
                    feedback.type === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}>
                    <div className={`rounded-full p-4 mb-4 ${feedback.type === 'success' ? 'bg-green-500' : 'bg-red-500'} shadow-xl`}>
                      {feedback.type === 'success' ? <CheckIcon /> : <XIcon />}
                    </div>
                    <p className="text-2xl font-bold text-white drop-shadow-md">
                      {feedback.type === 'success' ? 'Brilliant' : `Incorrect`}
                    </p>
                    {feedback.type === 'error' && (
                      <p className="text-white/90 font-medium">They are a {feedback.correctParty}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Info & Buttons */}
              <div className="p-8 pb-10">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-1 tracking-tight">{current.name}</h2>
                  <span className="inline-block px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    {current.state} • {current.category}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleGuess('Democrat')}
                    disabled={!!feedback}
                    className="h-16 rounded-2xl bg-[#00AEF3] text-white font-bold text-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                  >
                    Democrat
                  </button>
                  <button
                    onClick={() => handleGuess('Republican')}
                    disabled={!!feedback}
                    className="h-16 rounded-2xl bg-[#E81B23] text-white font-bold text-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                  >
                    Republican
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Sub-components for cleaner code
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7]">
      <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
    </div>
  );
}

function CheckIcon() {
  return <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;
}

function XIcon() {
  return <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
}