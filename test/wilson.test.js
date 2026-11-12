import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { wilson } from "../lib/wilson";

const counts = fc
  .integer({ min: 1, max: 5000 })
  .chain((n) => fc.tuple(fc.integer({ min: 0, max: n }), fc.constant(n)));

// /insights ranks members by accuracy. Raw percentages on a handful of guesses rank noise, so each
// member is shown with a Wilson 95% interval; these properties are what make that interval usable.
describe("wilson", () => {
  it("returns null with no trials instead of inventing a rate", () => {
    expect(wilson(0, 0)).toBeNull();
  });

  it("matches the closed-form interval for 81 of 263 (0.255 to 0.366)", () => {
    const { low, high } = wilson(81, 263);
    expect(low).toBeCloseTo(0.2553, 3);
    expect(high).toBeCloseTo(0.3662, 3);
  });

  it("always contains the point estimate", () => {
    fc.assert(
      fc.property(counts, ([k, n]) => {
        const { p, low, high } = wilson(k, n);
        expect(low).toBeLessThanOrEqual(p + 1e-12);
        expect(high).toBeGreaterThanOrEqual(p - 1e-12);
      }),
    );
  });

  it("lies in [0, 1]", () => {
    fc.assert(
      fc.property(counts, ([k, n]) => {
        const { low, high } = wilson(k, n);
        expect(low).toBeGreaterThanOrEqual(0);
        expect(high).toBeLessThanOrEqual(1);
      }),
    );
  });

  it("narrows as n grows at a fixed rate", () => {
    fc.assert(
      fc.property(counts, fc.integer({ min: 2, max: 10 }), ([k, n], factor) => {
        const small = wilson(k, n);
        const large = wilson(k * factor, n * factor);
        expect(large.high - large.low).toBeLessThan(small.high - small.low);
      }),
    );
  });
});
