import { beforeEach, describe, expect, it } from "vitest";
import getDistribution from "../pages/api/get-distribution";
import submitScore from "../pages/api/submit-score";
import { MemoryRedis } from "../lib/memory-redis";
import { setRedis } from "../lib/redis";
import { call } from "./http";

const RUN = "3f2b8c1e-4a5d-4e6f-8a9b-0c1d2e3f4a5b";

async function bucketSum() {
  const res = await call(getDistribution, { method: "GET" });
  return res.body.total;
}

describe("POST /api/submit-score", () => {
  beforeEach(() => setRedis(new MemoryRedis()));

  // The client used to post its accuracy on every Stats modal render, and the server trusted any 0-100
  // number. The server now only accepts a plausible run summary and computes accuracy itself.
  it.each([
    ["an accuracy instead of a run", { accuracy: 100 }],
    ["a short run", { runId: RUN, correct: 3, total: 3 }],
    ["more correct than total", { runId: RUN, correct: 25, total: 20 }],
    ["non-integer counts", { runId: RUN, correct: 19.5, total: 20 }],
    ["an implausibly long run", { runId: RUN, correct: 6000, total: 6000 }],
    ["a missing run id", { correct: 15, total: 20 }],
  ])("rejects %s with 400 and stores nothing", async (_, body) => {
    const res = await call(submitScore, { body });
    expect(res.statusCode).toBe(400);
    expect(await bucketSum()).toBe(0);
  });

  it("returns 429 on the 31st request from one IP inside a window", async () => {
    const statuses = [];
    for (let i = 0; i < 31; i++) {
      statuses.push((await call(submitScore, { body: { runId: RUN, correct: 15, total: 20 } })).statusCode);
    }
    expect(statuses.slice(0, 30).every((s) => s === 200)).toBe(true);
    expect(statuses[30]).toBe(429);

    const otherIp = await call(submitScore, {
      body: { runId: RUN, correct: 15, total: 20 },
      ip: "198.51.100.1",
    });
    expect(otherIp.statusCode).toBe(200);
  });

  it("counts a run once even when it is submitted again with a new score", async () => {
    await call(submitScore, { body: { runId: RUN, correct: 10, total: 20 } });
    await call(submitScore, { body: { runId: RUN, correct: 40, total: 45 } });

    const res = await call(getDistribution, { method: "GET" });
    expect(res.body.total).toBe(1);
    expect(res.body.buckets[5].count).toBe(0);
    expect(res.body.buckets[8].count).toBe(1);
  });
});

describe("GET /api/get-distribution", () => {
  beforeEach(() => setRedis(new MemoryRedis()));

  it("computes shares from the bucket sum", async () => {
    const runs = [
      ["aaaaaaaa-0000-4000-8000-000000000001", 20, 20],
      ["aaaaaaaa-0000-4000-8000-000000000002", 10, 20],
      ["aaaaaaaa-0000-4000-8000-000000000003", 11, 20],
      ["aaaaaaaa-0000-4000-8000-000000000004", 0, 20],
    ];
    for (const [runId, correct, total] of runs) {
      await call(submitScore, { body: { runId, correct, total } });
    }
    const res = await call(getDistribution, { method: "GET" });
    expect(res.body.total).toBe(4);
    expect(res.body.buckets.map((b) => b.share).reduce((a, b) => a + b, 0)).toBeCloseTo(1);
    expect(res.body.buckets[5]).toEqual({ range: "50-59", count: 2, share: 0.5 });
  });
});
