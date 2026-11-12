export const TROPHIES = [
  {
    id: "first_correct",
    title: "First Blood",
    desc: "First correct guess.",
    tier: "bronze",
    check: ({ stats }) => (stats.correct || 0) >= 1,
  },
  {
    id: "streak_5",
    title: "Warm Streak",
    desc: "Best streak ≥ 5.",
    tier: "bronze",
    check: ({ stats }) => (stats.bestStreak || 0) >= 5,
  },
  {
    id: "streak_10",
    title: "Campaign Staff",
    desc: "Best streak ≥ 10.",
    tier: "silver",
    check: ({ stats }) => (stats.bestStreak || 0) >= 10,
  },
  {
    id: "streak_25",
    title: "Party Operator",
    desc: "Best streak ≥ 25.",
    tier: "gold",
    check: ({ stats }) => (stats.bestStreak || 0) >= 25,
  },
  {
    id: "streak_50",
    title: "Floor Leader",
    desc: "Best streak ≥ 50.",
    tier: "platinum",
    check: ({ stats }) => (stats.bestStreak || 0) >= 50,
  },
  {
    id: "seen_50",
    title: "Caucus Regular",
    desc: "Seen ≥ 50.",
    tier: "bronze",
    check: ({ stats }) => (stats.total || 0) >= 50,
  },
  {
    id: "seen_200",
    title: "Capitol Fixture",
    desc: "Seen ≥ 200.",
    tier: "gold",
    check: ({ stats }) => (stats.total || 0) >= 200,
  },
  {
    id: "accuracy_80_50",
    title: "Solid Read",
    desc: "≥80% accuracy with ≥50 seen.",
    tier: "silver",
    check: ({ stats }) => {
      const t = stats.total || 0;
      return t >= 50 && stats.correct / t >= 0.8;
    },
  },
  {
    id: "speed_fast",
    title: "Fast Reflexes",
    desc: "Answer correctly in <1s.",
    tier: "gold",
    check: ({ lastResult }) => lastResult?.isFast && lastResult?.isCorrect,
  },
];

export function newlyUnlocked(unlocked, context) {
  const owned = new Set(unlocked);
  return TROPHIES.filter((t) => !owned.has(t.id) && t.check(context)).map((t) => t.id);
}
