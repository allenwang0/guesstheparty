import { accuracyPercent, bucketIndex } from "../../lib/buckets";
import { isRateLimited } from "../../lib/rate-limit";
import { getRedis } from "../../lib/redis";
import { validateRun } from "../../lib/submission";

export const RUNS_KEY = "stats:runs";
export const BUCKETS_KEY = "stats:buckets";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const redis = getRedis();
  try {
    if (await isRateLimited(redis, req)) return res.status(429).json({ error: "Too many requests" });

    const problem = validateRun(req.body);
    if (problem) return res.status(400).json({ error: problem });

    const { runId, correct, total } = req.body;
    const bucket = bucketIndex(accuracyPercent(correct, total));
    const previous = await redis.hget(RUNS_KEY, runId);
    const previousBucket = previous === null ? null : Number(previous);
    if (previousBucket === bucket) return res.status(200).json({ bucket });

    const tx = redis
      .multi()
      .hset(RUNS_KEY, { [runId]: bucket })
      .hincrby(BUCKETS_KEY, String(bucket), 1);
    if (previousBucket !== null) tx.hincrby(BUCKETS_KEY, String(previousBucket), -1);
    await tx.exec();

    return res.status(200).json({ bucket });
  } catch (error) {
    console.error("submit-score failed", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
