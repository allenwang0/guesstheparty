import { useState, useEffect } from 'react';

export default function Home() {
  const [politicians, setPoliticians] = useState([]);
  const [current, setCurrent] = useState(null);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    // Fetches from the public folder automatically
    fetch('/politicians.json')
      .then(res => res.json())
      .then(data => {
        setPoliticians(data);
        if (data.length > 0) {
          setCurrent(data[Math.floor(Math.random() * data.length)]);
        }
      })
      .catch(err => console.error("Error loading JSON:", err));
  }, []);

  const handleGuess = (guess) => {
    if (guess === current.party) {
      setScore(s => s + 1);
      setFeedback("Correct! 🎉");
    } else {
      setFeedback(`Wrong! That was a ${current.party}.`);
    }

    // Wait a second then show next politician
    setTimeout(() => {
      const next = politicians[Math.floor(Math.random() * politicians.length)];
      setCurrent(next);
      setFeedback(null);
    }, 1200);
  };

  if (!current) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center p-8">
      <h1 className="text-4xl font-extrabold mb-4">Guess The Party</h1>
      <p className="text-xl mb-8">Score: <span className="text-yellow-400 font-bold">{score}</span></p>

      <div className="bg-slate-800 p-6 rounded-2xl shadow-2xl border border-slate-700 max-w-sm w-full text-center">
        <div className="relative h-96 w-full mb-4 overflow-hidden rounded-lg">
           <img
            src={current.img}
            alt={current.name}
            className="w-full h-full object-cover"
          />
        </div>

        <h2 className="text-2xl font-bold">{current.name}</h2>
        <p className="text-slate-400 mb-6 uppercase tracking-widest text-sm">{current.state} • {current.category}</p>

        {feedback ? (
          <div className={`py-4 text-xl font-bold ${feedback.includes('Correct') ? 'text-green-400' : 'text-red-400'}`}>
            {feedback}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleGuess('Democrat')}
              className="bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold transition-all"
            >
              Democrat
            </button>
            <button
              onClick={() => handleGuess('Republican')}
              className="bg-red-600 hover:bg-red-500 py-3 rounded-xl font-bold transition-all"
            >
              Republican
            </button>
          </div>
        )}
      </div>
    </div>
  );
}