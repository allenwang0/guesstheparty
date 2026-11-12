import { describe, expect, it } from "vitest";
import { confusionTakeaway, medianBucket, rankMembers, speedTakeaway } from "../lib/insights";

describe("insights takeaways", () => {
  it("finds the median bucket of the run histogram", () => {
    expect(medianBucket([0, 0, 0, 0, 0, 0, 0, 0, 0, 0])).toBeNull();
    expect(medianBucket([1, 1, 1, 0, 0, 0, 0, 0, 0, 7])).toBe(9);
    expect(medianBucket([0, 0, 0, 0, 3, 4, 3, 0, 0, 0])).toBe(5);
  });

  // The confusion takeaway compares how often players say "Republican" with how often it is true;
  // mixing up rows and columns would report a bias that does not exist.
  it("computes the Republican guess share across both actual parties", () => {
    const confusion = { Democrat: { D: 60, R: 40 }, Republican: { D: 20, R: 80 } };
    expect(confusionTakeaway(confusion, { republicanShare: 0.5 })).toBe(
      "Players guess Republican 60% of the time; 50% of members are Republican.",
    );
  });

  it("ranks the hardest member first and respects filters", () => {
    const members = [
      { id: "a", chamber: "house", party: "Democrat", state: "CA", accuracy: 0.9, n: 40 },
      { id: "b", chamber: "senate", party: "Democrat", state: "NY", accuracy: 0.3, n: 40 },
      { id: "c", chamber: "house", party: "Republican", state: "TX", accuracy: 0.5, n: 40 },
    ];
    expect(rankMembers(members).hardest.map((m) => m.id)).toEqual(["b", "c", "a"]);
    expect(rankMembers(members, { chamber: "house" }).hardest.map((m) => m.id)).toEqual(["c", "a"]);
    expect(rankMembers(members, { state: "TX" }).easiest.map((m) => m.id)).toEqual(["c"]);
  });

  it("splits speed at 1,000 ms", () => {
    const speed = Array.from({ length: 20 }, (_, bin) => ({ bin, n: 10, correct: bin < 10 ? 5 : 8 }));
    expect(speedTakeaway(speed)).toBe("Under 1,000 ms: 50% correct; 1,000 ms or slower: 80%.");
  });
});
