import { Award, Flame, Lock, ShieldCheck, Star, Target, Trophy, XCircle, Zap } from "lucide-react";
import { TROPHIES } from "../lib/trophies";
import Modal from "./Modal";
import { IconButton } from "./ui";

const TROPHY_ICONS = {
  first_correct: <Star size={18} />,
  streak_5: <Flame size={18} />,
  streak_10: <Award size={18} />,
  streak_25: <ShieldCheck size={18} />,
  streak_50: <Trophy size={18} />,
  seen_50: <Target size={18} />,
  seen_200: <Trophy size={18} />,
  accuracy_80_50: <Award size={18} />,
  speed_fast: <Zap size={18} />,
};

function tierStyles(tier) {
  switch (tier) {
    case "bronze":
      return "bg-amber-100 text-amber-900 border-amber-200";
    case "silver":
      return "bg-slate-100 text-slate-900 border-slate-200";
    case "gold":
      return "bg-yellow-100 text-yellow-900 border-yellow-200";
    case "platinum":
      return "bg-indigo-100 text-indigo-900 border-indigo-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}
export default function TrophyCase({ unlocked, onClose }) {
  const unlockedSet = new Set(unlocked);
  const unlockedCount = unlockedSet.size;
  return (
    <Modal onClose={onClose}>
      <div className="flex flex-col gap-4 mb-4 pt-2">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-black uppercase tracking-tighter">Trophies</h2>
          <IconButton onClick={onClose} ariaLabel="Close">
            <XCircle size={20} />
          </IconButton>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-grow h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500"
              style={{ width: `${(unlockedCount / TROPHIES.length) * 100}%` }}
            />
          </div>
          <div className="text-[10px] font-black uppercase text-gray-400">
            {unlockedCount}/{TROPHIES.length}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {TROPHIES.map((t) => {
          const unlocked = unlockedSet.has(t.id);
          return (
            <div
              key={t.id}
              className={`p-4 rounded-2xl border flex items-center gap-4 ${
                unlocked
                  ? "bg-white border-gray-100 shadow-sm"
                  : "bg-gray-50 border-transparent opacity-60 grayscale"
              }`}
            >
              <div
                className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                  unlocked ? tierStyles(t.tier) : "bg-gray-200"
                }`}
              >
                {unlocked ? TROPHY_ICONS[t.id] : <Lock size={16} />}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-black uppercase tracking-tight truncate">{t.title}</div>
                <div className="text-[10px] font-bold text-gray-400">{t.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
