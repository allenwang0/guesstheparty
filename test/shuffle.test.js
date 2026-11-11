import { describe, expect, it } from "vitest";
import { shuffle } from "../lib/shuffle";

describe("shuffle", () => {
  it("keeps every item exactly once", () => {
    expect([...shuffle([1, 2, 3, 4, 5])].sort()).toEqual([1, 2, 3, 4, 5]);
  });

  // sort(() => 0.5 - Math.random()) favors some orders, which makes some members show up early far more
  // often than others. A fair shuffle puts every item in every position equally often.
  it("puts each item in each position at a uniform rate (chi-square, 99.9%)", () => {
    const n = 5;
    const runs = 60000;
    const counts = Array.from({ length: n }, () => Array(n).fill(0));
    for (let r = 0; r < runs; r++) {
      shuffle([0, 1, 2, 3, 4]).forEach((item, position) => counts[item][position]++);
    }
    const expected = runs / n;
    // 99.9% critical value of chi-square with n - 1 = 4 degrees of freedom.
    const critical = 18.467;
    for (const row of counts) {
      const chiSquare = row.reduce((sum, observed) => sum + (observed - expected) ** 2 / expected, 0);
      expect(chiSquare).toBeLessThan(critical);
    }
  });
});
