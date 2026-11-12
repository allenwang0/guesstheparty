import { MEMBERS_BY_ID } from "../../lib/members";
import { isRateLimited } from "../../lib/rate-limit";
import { getRedis } from "../../lib/redis";
import { recordGuesses, validateGuesses } from "../../lib/stats-store";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const redis = await getRedis();
    if (await isRateLimited(redis, req)) return res.status(429).json({ error: "Too many requests" });

    const problem = validateGuesses(req.body, MEMBERS_BY_ID);
    if (problem) return res.status(400).json({ error: problem });

    await recordGuesses(redis, req.body.guesses, MEMBERS_BY_ID);
    return res.status(200).json({ recorded: req.body.guesses.length });
  } catch (error) {
    console.error("guesses failed", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
