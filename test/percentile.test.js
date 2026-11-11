import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { bucketIndex } from "../lib/buckets";
import { betterThanPercent } from "../lib/percentile";

describe("betterThanPercent", () => {
  it("returns null when nobody has played, so the UI cannot show an invented rank", () => {
    expect(betterThanPercent(75, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0])).toBeNull();
  });

  it("ranks a weak player low, so the label 'Better than X%' reads the right way round", () => {
    const counts = [1, 0, 0, 0, 0, 0, 0, 0, 0, 99];
    expect(betterThanPercent(5, counts)).toBe(1);
    expect(betterThanPercent(95, counts)).toBe(51);
  });

  it("never ranks a 90-100 player below a player in a lower bucket", () => {
    const counts = fc.array(fc.nat(1000), { minLength: 10, maxLength: 10 });
    fc.assert(
      fc.property(
        counts,
        fc.integer({ min: 90, max: 100 }),
        fc.integer({ min: 0, max: 89 }),
        (c, top, low) => {
          fc.pre(c.some((n) => n > 0));
          expect(bucketIndex(low)).toBeLessThan(bucketIndex(top));
          expect(betterThanPercent(top, c)).toBeGreaterThanOrEqual(betterThanPercent(low, c));
        },
      ),
    );
  });
});
