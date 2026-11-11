import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { QUEUE_SIZE, queueReducer, RECENT_WINDOW, initialQueueState } from "../lib/game-queue";

const pool = Array.from({ length: 100 }, (_, i) => ({ id: `m${i}` }));

function start(shuffled = pool) {
  return queueReducer(initialQueueState, { type: "start", pool, shuffled });
}

describe("queueReducer", () => {
  it("seeds the recent window with all six opening cards", () => {
    const state = start();
    expect(state.recent).toEqual(pool.slice(0, QUEUE_SIZE + 1).map((p) => p.id));
  });

  // A player should not see the same face twice in a short stretch. With at least 50 other members to
  // choose from, the next card dealt is never one of the last 50 dealt.
  it("never deals a card from the recent window while 50 or more others exist", () => {
    fc.assert(
      fc.property(
        fc.array(fc.double({ min: 0, max: 1, maxExcluded: true, noNaN: true }), { maxLength: 300 }),
        (draws) => {
          let state = start();
          for (const random of draws) {
            const before = state.recent;
            expect(pool.length - before.length).toBeGreaterThanOrEqual(RECENT_WINDOW);
            state = queueReducer(state, { type: "advance", random });
            expect(before).not.toContain(state.queue.at(-1).id);
            expect(state.queue).toHaveLength(QUEUE_SIZE);
          }
        },
      ),
    );
  });

  it("does not mutate the previous state, so React can safely call it twice", () => {
    const state = start();
    const frozen = JSON.stringify(state);
    const once = queueReducer(state, { type: "advance", random: 0.3 });
    const twice = queueReducer(state, { type: "advance", random: 0.3 });
    expect(JSON.stringify(state)).toBe(frozen);
    expect(twice).toEqual(once);
  });

  it("moves the first queued card into view", () => {
    const state = start();
    expect(queueReducer(state, { type: "advance", random: 0 }).current).toBe(state.queue[0]);
  });
});
