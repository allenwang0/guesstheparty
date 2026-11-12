import { mulberry32 } from "./random";
import { MAX_GUESS_BATCH, recordGuesses, recordRun, SYNTHETIC_KEY } from "./stats-store";

export const SAMPLE_SEED = 20260101;
const SAMPLE_PLAYERS = 600;

function uuidFrom(random) {
  const hex = Array.from({ length: 32 }, () => Math.floor(random() * 16).toString(16)).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

// Synthetic players for local development and the Playwright test. Every number this produces is
// invented; the store is flagged so /api/insights reports synthetic: true and the page shows a banner.
export async function seedSample(redis, members, seed = SAMPLE_SEED) {
  const random = mulberry32(seed);
  const difficulty = new Map(members.map((m) => [m.id, (random() - 0.5) * 0.5]));
  await redis.multi().incr(SYNTHETIC_KEY).exec();
  for (let player = 0; player < SAMPLE_PLAYERS; player++) {
    const skill = 0.5 + random() * 0.25;
    const rounds = 20 + Math.floor(random() * 60);
    const guesses = [];
    let correct = 0;
    for (let round = 0; round < rounds; round++) {
      const member = members[Math.floor(random() * members.length)];
      const responseMs = Math.floor(350 + random() * 2200);
      const hurried = responseMs < 600 ? -0.08 : 0;
      const isCorrect =
        random() < Math.min(0.97, Math.max(0.03, skill + difficulty.get(member.id) + hurried));
      const other = member.party === "Democrat" ? "Republican" : "Democrat";
      guesses.push({ bioguideId: member.id, guessedParty: isCorrect ? member.party : other, responseMs });
      if (isCorrect) correct++;
    }
    const byId = new Map(members.map((m) => [m.id, m]));
    for (let i = 0; i < guesses.length; i += MAX_GUESS_BATCH) {
      await recordGuesses(redis, guesses.slice(i, i + MAX_GUESS_BATCH), byId);
    }
    await recordRun(redis, { runId: uuidFrom(random), correct, total: rounds });
  }
}
