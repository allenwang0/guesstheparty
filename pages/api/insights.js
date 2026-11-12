import { MEMBERS } from "../../lib/members";
import { getRedis } from "../../lib/redis";
import { readInsights } from "../../lib/stats-store";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    const insights = await readInsights(await getRedis(), MEMBERS);
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    return res.status(200).json(insights);
  } catch (error) {
    console.error("insights failed", error);
    return res.status(500).json({ error: "Stats are unavailable" });
  }
}
