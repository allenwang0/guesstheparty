import { beforeEach, describe, expect, it } from "vitest";
import guesses from "../pages/api/guesses";
import insights from "../pages/api/insights";
import submitScore from "../pages/api/submit-score";
import { MemoryRedis } from "../lib/memory-redis";
import { MEMBERS } from "../lib/members";
import { setRedis } from "../lib/redis";
import { call } from "./http";

const dem = MEMBERS.find((m) => m.party === "Democrat");
const rep = MEMBERS.find((m) => m.party === "Republican");

async function readInsights() {
  return (await call(insights, { method: "GET" })).body;
}

function batch(member, guessedParty, size, extra = {}) {
  return Array.from({ length: size }, () => ({
    bioguideId: member.id,
    guessedParty,
    responseMs: 450,
    ...extra,
  }));
}

describe("POST /api/guesses", () => {
  beforeEach(() => setRedis(new MemoryRedis()));

  it.each([
    [
      "an unknown member",
      { guesses: [{ bioguideId: "X999999", guessedParty: "Democrat", responseMs: 500 }] },
    ],
    [
      "an independent party",
      { guesses: [{ bioguideId: dem.id, guessedParty: "Independent", responseMs: 500 }] },
    ],
    ["more than 10 guesses", { guesses: batch(dem, "Democrat", 11) }],
    ["an empty batch", { guesses: [] }],
    ["a negative response time", { guesses: batch(dem, "Democrat", 1, { responseMs: -5 }) }],
  ])("rejects %s with 400 and records nothing", async (_, body) => {
    expect((await call(guesses, { body })).statusCode).toBe(400);
    expect((await readInsights()).guesses.n).toBe(0);
  });

  // The server decides correctness from politicians.json; a client cannot mark its own guess correct.
  it("ignores a client-supplied correct flag", async () => {
    await call(guesses, { body: { guesses: batch(rep, "Democrat", 3, { correct: true }) } });
    const result = await readInsights();
    expect(result.guesses).toMatchObject({ n: 3, correct: 0 });
    expect(result.confusion.Republican).toEqual({ D: 3, R: 0 });
  });

  it("shares the 30-per-10-minutes rate limit with run submissions", async () => {
    for (let i = 0; i < 30; i++) await call(guesses, { body: { guesses: batch(dem, "Democrat", 1) } });
    expect((await call(guesses, { body: { guesses: batch(dem, "Democrat", 1) } })).statusCode).toBe(429);
    const run = { runId: "3f2b8c1e-4a5d-4e6f-8a9b-0c1d2e3f4a5b", correct: 15, total: 20 };
    expect((await call(submitScore, { body: run })).statusCode).toBe(429);
  });
});

describe("GET /api/insights", () => {
  beforeEach(() => setRedis(new MemoryRedis()));

  it("hides members with fewer than 30 guesses and attaches a Wilson interval to the rest", async () => {
    for (let i = 0; i < 3; i++) {
      await call(guesses, { body: { guesses: batch(dem, "Democrat", 10) }, ip: `198.51.100.${i}` });
    }
    await call(guesses, { body: { guesses: batch(rep, "Republican", 10) }, ip: "198.51.100.9" });

    const result = await readInsights();
    expect(result.members.map((m) => m.id)).toEqual([dem.id]);
    const [row] = result.members;
    expect(row).toMatchObject({ n: 30, correct: 30, accuracy: 1 });
    expect(row.high).toBeCloseTo(1, 10);
    expect(row.low).toBeGreaterThan(0.88);
    expect(row.low).toBeLessThan(0.9);
  });

  it("returns aggregates only, with no run ids or IP hashes", async () => {
    const runId = "3f2b8c1e-4a5d-4e6f-8a9b-0c1d2e3f4a5b";
    await call(submitScore, { body: { runId, correct: 15, total: 20 } });
    await call(guesses, { body: { guesses: batch(dem, "Democrat", 1) } });
    const text = JSON.stringify(await readInsights());
    expect(text).not.toContain(runId);
    expect(text).not.toMatch(/[0-9a-f]{64}/);
    expect(text).not.toContain("203.0.113.7");
  });

  it("reports synthetic: false for real data", async () => {
    expect((await readInsights()).synthetic).toBe(false);
  });
});
