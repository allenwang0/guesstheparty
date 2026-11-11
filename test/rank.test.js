import { describe, expect, it } from "vitest";
import { computeRank, RANK_TIERS, rankForScore } from "../lib/rank";

describe("rank", () => {
  // The career ladder in the Stats modal lists RANK_TIERS; the title a player gets must match it exactly.
  it.each(RANK_TIERS.filter((t) => t.min > 0).map((t) => [t.title, t.min]))(
    "%s starts exactly at %i",
    (title, min) => {
      expect(rankForScore(min)).toBe(title);
      expect(rankForScore(min - 1)).not.toBe(title);
    },
  );

  it("gives Intern to a score of 0", () => {
    expect(rankForScore(0)).toBe("Intern");
  });

  it("stays Unranked until 20 guesses", () => {
    expect(computeRank({ accuracy: 100, bestStreak: 19, total: 19 })).toEqual({
      title: "Unranked",
      score: 0,
      nextGoal: 1,
    });
    expect(computeRank({ accuracy: 100, bestStreak: 20, total: 20 }).title).toBe("Party Whip");
  });
});
