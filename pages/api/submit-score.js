import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send();

  const { accuracy } = req.body; // e.g., 85

  // Calculate which bucket this falls into (0, 10, 20... 90)
  const bucket = Math.floor(accuracy / 10) * 10;
  const key = `stats:accuracy:${bucket}`;

  // Atomic increment: fast and thread-safe
  await kv.incr(key);

  // Also increment total games played for percentage math
  await kv.incr('stats:total_games');

  return res.status(200).json({ success: true });
}