import { describe, expect, it } from "vitest";
import { migrateLegacyStats, normalizeStats } from "../lib/player-stats";
import { addResponse, emptyResponseStats, RESPONSE_BINS } from "../lib/response-stats";

describe("player stats storage", () => {
  // responseTimes grew by one entry per guess in localStorage forever. v4 keeps a fixed-size summary,
  // and existing players must not lose their totals when they upgrade.
  it("migrates v3 stats to v4 keeping totals and folding response times into the summary", () => {
    const legacy = {
      correct: 30,
      total: 40,
      streak: 2,
      bestStreak: 11,
      demGuesses: 20,
      repGuesses: 20,
      demCorrect: 15,
      repCorrect: 15,
      guessedDemActualRep: 5,
      guessedRepActualDem: 5,
      responseTimes: [450, 950, 2500],
      totalTime: 3900,
      demTime: 0,
      repTime: 0,
    };
    const migrated = migrateLegacyStats(legacy);
    expect(migrated).toMatchObject({ correct: 30, total: 40, bestStreak: 11, guessedRepActualDem: 5 });
    expect(migrated.response).toMatchObject({
      count: 3,
      sum: 3900,
      sumSquares: 450 ** 2 + 950 ** 2 + 2500 ** 2,
    });
    expect(migrated.response.bins[4]).toBe(1);
    expect(migrated.response.bins[9]).toBe(1);
    expect(migrated.response.bins[RESPONSE_BINS - 1]).toBe(1);
    expect(migrated).not.toHaveProperty("responseTimes");
    expect(migrated).not.toHaveProperty("demTime");
    expect(migrated).not.toHaveProperty("repTime");
  });

  it("keeps the stored size constant no matter how many guesses are recorded", () => {
    let response = emptyResponseStats();
    const sizeAfter = (n) => {
      for (let i = 0; i < n; i++) response = addResponse(response, (i * 37) % 3000);
      return JSON.stringify(response).length;
    };
    const small = sizeAfter(10);
    const large = sizeAfter(10000);
    expect(large - small).toBeLessThan(80);
  });

  it("puts 1,900 ms and slower in the last bin", () => {
    expect(addResponse(emptyResponseStats(), 1900).bins[19]).toBe(1);
    expect(addResponse(emptyResponseStats(), 9000).bins[19]).toBe(1);
    expect(addResponse(emptyResponseStats(), 1899).bins[18]).toBe(1);
  });

  it("repairs malformed saved stats instead of crashing", () => {
    expect(normalizeStats({ total: "x", response: { bins: [1] } })).toMatchObject({
      total: 0,
      response: emptyResponseStats(),
    });
  });
});
