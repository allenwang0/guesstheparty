export const RANK_MIN_GUESSES = 20;

export const RANK_TIERS = [
  { title: "Speaker", min: 110000 },
  { title: "Party Whip", min: 100000 },
  { title: "Senior Senator", min: 90000 },
  { title: "Campaign Manager", min: 80000 },
  { title: "Staffer", min: 70000 },
  { title: "Intern", min: 0 },
];

export function rankScore({ accuracy, bestStreak, total }) {
  return Math.round(accuracy * 1000 + bestStreak * 40 + Math.log1p(total) * 200);
}

export function rankForScore(score) {
  return RANK_TIERS.find((tier) => score >= tier.min).title;
}

export function computeRank({ accuracy, bestStreak, total }) {
  if (total < RANK_MIN_GUESSES) {
    return { title: "Unranked", score: 0, nextGoal: RANK_MIN_GUESSES - total };
  }
  const score = rankScore({ accuracy, bestStreak, total });
  return { title: rankForScore(score), score };
}
