import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  try {
    // Fetch all buckets in parallel (0, 10, 20... 90)
    // We stick to 10 buckets. Bucket "90" covers 90-100%
    const keys = Array.from({ length: 10 }, (_, i) => `stats:accuracy:${i * 10}`);

    const [counts, total] = await Promise.all([
      kv.mget(...keys),
      kv.get('stats:total_games')
    ]);

    // Format for the frontend
    const distribution = keys.map((_, i) => {
      const count = Number(counts[i]) || 0;
      const totalNum = Number(total) || 0;

      return {
        // Label the range nicely
        range: i === 9 ? '90-100' : `${i * 10}-${(i * 10) + 9}`,
        count: count,
        // Calculate percentage of players in this bucket for the bar height
        percentOfPlayers: totalNum > 0 ? Math.round((count / totalNum) * 100) : 0
      };
    });

    return res.status(200).json({ distribution });
  } catch (error) {
    console.error(error);
    // Return empty array on error so UI doesn't crash
    return res.status(500).json({ distribution: [] });
  }
}