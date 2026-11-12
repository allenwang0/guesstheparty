import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HelpCircle, Star, TrendingUp, XCircle } from "lucide-react";
import { RANK_TIERS } from "../lib/rank";
import Histogram from "./Histogram";
import Modal from "./Modal";
import { IconButton, Pill, ProgressBar } from "./ui";

export default function StatsModal({ stats, accuracy, rank, distribution, onClose, onOpenWrapped }) {
  const [showScoreDetails, setShowScoreDetails] = useState(false);
  return (
    <Modal onClose={onClose}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tighter">Performance</h2>
          <div className="flex items-center gap-2 mt-1">
            <Pill className={`bg-black text-white`}>{rank.title}</Pill>
            {rank.title === "Unranked" && (
              <span className="text-[9px] font-bold text-gray-400 tracking-widest uppercase">
                {rank.nextGoal} more to rank
              </span>
            )}
          </div>
        </div>
        <IconButton onClick={onClose} ariaLabel="Close">
          <XCircle size={20} />
        </IconButton>
      </div>
      <div className="mb-4 bg-gradient-to-br from-gray-900 to-black rounded-3xl p-5 text-white relative overflow-hidden">
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-black uppercase tracking-widest opacity-60">
                Political Capital
              </span>
              <button
                onClick={() => setShowScoreDetails(!showScoreDetails)}
                className="opacity-50 hover:opacity-100 transition-opacity"
              >
                <HelpCircle size={12} />
              </button>
            </div>
            <div className="text-4xl font-black tracking-tighter tabular-nums">
              {rank.score.toLocaleString()}
            </div>
          </div>
          <div className="h-10 w-10 bg-white/10 rounded-full flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
        </div>
        <AnimatePresence>
          {showScoreDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="relative z-10 mt-3 pt-3 border-t border-white/10 text-xs text-white/70 space-y-1"
            >
              <p>Score = Accuracy + Streak + Experience.</p>
              <ul className="list-disc pl-4 space-y-0.5 opacity-80 text-[10px]">
                <li>
                  <b>Accuracy</b> gives the most points.
                </li>
                <li>
                  <b>Streaks</b> provide bonus multipliers.
                </li>
                <li>
                  <b>Total Games</b> adds a loyalty bonus.
                </li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="col-span-2 bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
          <div className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">
            Total Accuracy
          </div>
          <div className="text-5xl font-black tracking-tighter text-gray-900">{accuracy}%</div>
          <div className="mt-4 space-y-2">
            <ProgressBar
              label="Democrat"
              value={stats.demCorrect}
              total={stats.demGuesses}
              color="bg-blue-500"
            />
            <ProgressBar
              label="Republican"
              value={stats.repCorrect}
              total={stats.repGuesses}
              color="bg-red-500"
            />
          </div>
        </div>
      </div>
      <Histogram distribution={distribution} userAccuracy={accuracy} />
      <div className="mt-6 pt-6 border-t border-gray-100">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Career Ladder</h3>
        <div className="space-y-2">
          {RANK_TIERS.map((tier) => {
            const isCurrent = rank.title === tier.title;
            const isPassed = rank.score >= tier.min;
            return (
              <div
                key={tier.title}
                className={`flex items-center justify-between text-xs ${isCurrent ? "opacity-100" : "opacity-40"}`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isPassed ? "bg-black" : "bg-gray-200"}`} />
                  <span className="font-bold uppercase tracking-wide">{tier.title}</span>
                </div>
                <span className="font-mono text-[10px]">{tier.min > 0 ? `${tier.min / 1000}k+` : "0+"}</span>
              </div>
            );
          })}
        </div>
      </div>
      <button
        onClick={onOpenWrapped}
        className="w-full h-14 mt-6 rounded-2xl bg-black text-white flex items-center justify-center gap-2 active:scale-95 transition-transform"
      >
        <Star size={16} className="text-yellow-400 fill-yellow-400" />
        <span className="font-black uppercase tracking-[0.2em] text-xs">Generate Wrapped</span>
      </button>
    </Modal>
  );
}
