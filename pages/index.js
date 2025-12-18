// pages/index.js
import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  const [politicians, setPoliticians] = useState([]);
  const [current, setCurrent] = useState(null);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/politicians.json')
      .then(res => res.json())
      .then(data => {
        setPoliticians(data);
        newQuestion(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load data:", err);
        setLoading(false);
      });
  }, []);

  const newQuestion = (data) => {
    const random = data[Math.floor(Math.random() * data.length)];
    setCurrent(random);
  };

  const handleGuess = (party) => {
    if (party === current.party) {
      setScore(score + 1);
      setFeedback({ type: 'success', msg: 'Correct!' });
    } else {
      setFeedback({ type: 'error', msg: `Wrong! They are a ${current.party}.` });
    }

    setTimeout(() => {
      setFeedback(null);
      newQuestion(politicians);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!current) return <div className="text-center p-10">Failed to load data.</div>;

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 flex items-center justify-center">
      <Head>
        <title>Guess The Party</title>
      </Head>

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 px-2">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Guess The Party</h1>
          <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
            <span className="text-sm font-medium text-gray-500">Score:</span>
            <span className="ml-2 text-lg font-bold text-blue-600">{score}</span>
          </div>
        </div>

        {/* Game Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          <div className="aspect-[4/5] relative bg-gray-200">
            <img
              src={current.img || 'https://via.placeholder.com/400x500?text=No+Image'}
              alt={current.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/400x500?text=Image+Not+Found';
              }}
            />
            {feedback && (
              <div className={`absolute inset-0 flex items-center justify-center backdrop-blur-md transition-all ${
                feedback.type === 'success' ? 'bg-green-500/30' : 'bg-red-500/30'
              }`}>
                <span className={`text-5xl font-black uppercase tracking-widest drop-shadow-lg ${
                  feedback.type === 'success' ? 'text-green-50' : 'text-red-50'
                }`}>
                  {feedback.msg}
                </span>
              </div>
            )}
          </div>

          <div className="p-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{current.name}</h2>
            <p className="text-gray-500 uppercase tracking-widest text-sm font-semibold mb-8">
              {current.state} • {current.chamber}
            </p>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleGuess('Democrat')}
                disabled={!!feedback}
                className="py-4 rounded-2xl bg-blue-600 text-white text-lg font-bold hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-200 disabled:opacity-70"
              >
                Democrat
              </button>
              <button
                onClick={() => handleGuess('Republican')}
                disabled={!!feedback}
                className="py-4 rounded-2xl bg-red-600 text-white text-lg font-bold hover:bg-red-700 active:scale-95 transition-all shadow-md shadow-red-200 disabled:opacity-70"
              >
                Republican
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}