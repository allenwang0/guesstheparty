import { isRateLimited } from "../../lib/rate-limit";
import { getRedis } from "../../lib/redis";
import { recordRun } from "../../lib/stats-store";
import { validateRun } from "../../lib/submission";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const redis = await getRedis();
    if (await isRateLimited(redis, req)) return res.status(429).json({ error: "Too many requests" });

    const problem = validateRun(req.body);
    if (problem) return res.status(400).json({ error: problem });

    const bucket = await recordRun(redis, req.body);
    return res.status(200).json({ bucket });
  } catch (error) {
    console.error("submit-score failed", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
