import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // Fetch all buckets in parallel
  const keys = Array.from({ length: 10 }, (_, i) => `stats:accuracy:${i * 10}`);

  const [counts, total] = await Promise.all([
    kv.mget(...keys),
    kv.get('stats:total_games')
  ]);

  // Format for the frontend
  const distribution = keys.map((_, i) => ({
    range: `${i * 10}-${(i * 10) + 9}%`,
    count: counts[i] || 0,
    // Calculate percentage of players in this bucket
    percentOfPlayers: total ? Math.round(((counts[i] || 0) / total) * 100) : 0
  }));

  return res.status(200).json({ distribution, totalGames: total });
}