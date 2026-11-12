import { bucketCounts, bucketLabel } from "../../lib/buckets";
import { getRedis } from "../../lib/redis";
import { BUCKETS_KEY } from "../../lib/stats-store";

export default async function handler(req, res) {
  try {
    const counts = bucketCounts(await (await getRedis()).hgetall(BUCKETS_KEY));
    const total = counts.reduce((sum, count) => sum + count, 0);
    const buckets = counts.map((count, i) => ({
      range: bucketLabel(i),
      count,
      share: total > 0 ? count / total : 0,
    }));
    return res.status(200).json({ total, buckets });
  } catch (error) {
    console.error("get-distribution failed", error);
    return res.status(500).json({ error: "Stats are unavailable" });
  }
}
