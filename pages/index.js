import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  const [politicians, setPoliticians] = useState([]);
  const [current, setCurrent] = useState(null);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    fetch('/politicians.json')
      .then(res => res.json())
      .then(data => {
        setPoliticians(data);
        setCurrent(data[Math.floor(Math.random() * data.length)]);
      });
  }, []);

  const handleGuess = (party) => {
    if (party === current.party) {
      setScore(score + 1);
      setFeedback({ type: 'success', msg: 'Correct!' });
    } else {
      setFeedback({ type: 'error', msg: `Wrong! They are a ${current.party}.` });
    }

    setTimeout(() => {
      setFeedback(null);
      setCurrent(politicians[Math.floor(Math.random() * politicians.length)]);
    }, 1500);
  };

  if (!current) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <Head>
        <title>Guess The Party</title>
      </Head>

      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Guess The Party</h1>
          <div className="bg-white px-4 py-1 rounded-full shadow-sm border border-gray-200">
            <span className="text-sm font-medium text-gray-500">Score:</span>
            <span className="ml-2 font-bold text-blue-600">{score}</span>
          </div>
        </div>

        {/* Game Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 transition-all">
          <div className="aspect-[3/4] relative overflow-hidden bg-gray-200">
            <img
              src={current.image_url || 'https://via.placeholder.com/400x500'}
              alt={current.name}
              className="w-full h-full object-cover"
            />
            {feedback && (
              <div className={`absolute inset-0 flex items-center justify-center backdrop-blur-sm transition-opacity ${
                feedback.type === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'
              }`}>
                <span className={`text-4xl font-black uppercase tracking-widest drop-shadow-md ${
                  feedback.type === 'success' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {feedback.msg}
                </span>
              </div>
            )}
          </div>

          <div className="p-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{current.name}</h2>
            <p className="text-gray-500 uppercase tracking-widest text-xs font-semibold mb-6">
              {current.state} • {current.chamber}
            </p>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleGuess('Democrat')}
                disabled={!!feedback}
                className="py-4 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
              >
                Democrat
              </button>
              <button
                onClick={() => handleGuess('Republican')}
                disabled={!!feedback}
                className="py-4 rounded-2xl bg-red-600 text-white font-bold hover:bg-red-700 active:scale-95 transition-all shadow-lg shadow-red-200 disabled:opacity-50"
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