import Image from "next/image";
import { motion } from "framer-motion";
import { bucketCounts, MIN_RUNS_TO_SHOW } from "../lib/buckets";
import { betterThanPercent } from "../lib/percentile";
import Histogram from "./Histogram";

function bestRead(stats) {
  const demAcc = stats.demGuesses > 0 ? stats.demCorrect / stats.demGuesses : 0;
  const repAcc = stats.repGuesses > 0 ? stats.repCorrect / stats.repGuesses : 0;
  if (demAcc >= repAcc) {
    return {
      name: "Democrats",
      img: "/brand/democrat.svg",
      color: "text-blue-500",
      value: Math.round(demAcc * 100),
    };
  }
  return {
    name: "Republicans",
    img: "/brand/republican.svg",
    color: "text-red-500",
    value: Math.round(repAcc * 100),
  };
}

export default function WrappedModal({ stats, accuracy, rank, distribution, onClose }) {
  const bestGuessedParty = bestRead(stats);
  const wrappedBetterThan =
    distribution.status === "ready" && distribution.total >= MIN_RUNS_TO_SHOW
      ? betterThanPercent(
          stats.total === 0 ? 0 : (stats.correct / stats.total) * 100,
          bucketCounts(distribution.buckets.map((b) => b.count)),
        )
      : null;
  return (
    <div
      className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative w-full max-w-sm overflow-hidden bg-white/5 rounded-[2.5rem] p-4 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-[2rem] border border-white/10 p-6 text-white shadow-2xl flex flex-col justify-between aspect-[9/14]">
          <div className="flex justify-between items-start border-b border-white/10 pb-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mb-1">Rank</div>
              <div className="text-2xl font-black uppercase text-blue-400 leading-none">{rank.title}</div>
              <div className="text-[10px] font-mono opacity-50 mt-1">
                Score: {rank.score.toLocaleString()}
              </div>
            </div>
            {wrappedBetterThan !== null && (
              <div className="text-right">
                <div className="text-3xl font-black leading-none">{wrappedBetterThan}%</div>
                <div className="text-[9px] font-black uppercase tracking-widest opacity-50 mt-1">
                  Better than
                </div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 my-2">
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <div className="text-[8px] uppercase tracking-widest opacity-50 mb-1">Accuracy</div>
              <div className="text-xl font-black">{accuracy}%</div>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <div className="text-[8px] uppercase tracking-widest opacity-50 mb-1">Streak</div>
              <div className="text-xl font-black text-amber-400">{stats.bestStreak}</div>
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex items-center gap-3">
            <div className="relative h-10 w-10 shrink-0 bg-white rounded-full p-2 flex items-center justify-center">
              <Image
                src={bestGuessedParty.img}
                alt={bestGuessedParty.name}
                width={24}
                height={24}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="text-[8px] uppercase tracking-widest opacity-50">Best Read</div>
              <div className={`text-xs font-bold ${bestGuessedParty.color}`}>
                {bestGuessedParty.name}{" "}
                <span className="opacity-50 text-white font-normal">({bestGuessedParty.value || 0}%)</span>
              </div>
            </div>
          </div>
          <Histogram distribution={distribution} userAccuracy={accuracy} isDark={true} compact={true} />
          <div className="pt-4 border-t border-white/10 flex justify-between items-end opacity-50">
            <div>
              <div className="text-[8px] font-black uppercase tracking-widest">Guess The Party</div>
              <div className="text-[8px]">2025 Review</div>
            </div>
            <div className="text-[8px] font-mono">guesstheparty.vercel.app</div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full h-12 bg-black/40 text-white/50 hover:text-white rounded-2xl flex items-center justify-center font-black text-xs uppercase tracking-widest transition-colors"
        >
          Close
        </button>
      </motion.div>
    </div>
  );
}
