import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send();

  try {
    const { accuracy } = req.body;

    // Validate input
    if (typeof accuracy !== 'number' || accuracy < 0 || accuracy > 100) {
      return res.status(400).json({ error: 'Invalid accuracy' });
    }

    // Calculate which bucket this falls into (0, 10, 20... 90)
    let bucket = Math.floor(accuracy / 10) * 10;

    // Edge case: If accuracy is 100, Math.floor gives 100.
    // We want to group 100 into the 90+ bucket.
    if (bucket === 100) bucket = 90;

    const key = `stats:accuracy:${bucket}`;

    // Atomic increment
    await kv.incr(key);
    await kv.incr('stats:total_games');

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}