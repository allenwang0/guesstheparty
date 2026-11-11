import { describe, expect, it } from "vitest";
import { shouldSubmitRun } from "../lib/submission";

describe("shouldSubmitRun", () => {
  // A run reaches the global histogram at 20 guesses and then at most once per 25 more, so a long run
  // costs a handful of requests and short runs never skew the distribution.
  it("submits at 20 and every 25 guesses after that", () => {
    const submittedAt = Array.from({ length: 100 }, (_, i) => i + 1).filter(shouldSubmitRun);
    expect(submittedAt).toEqual([20, 45, 70, 95]);
  });
});
