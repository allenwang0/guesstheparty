import { accuracyPercent, bucketCounts, bucketIndex, MIN_RUNS_TO_SHOW } from "./buckets";
import { RESPONSE_BINS, responseBin } from "./response-stats";
import { wilson } from "./wilson";

export const RUNS_KEY = "stats:runs";
export const BUCKETS_KEY = "stats:buckets";
export const MEMBERS_KEY = "stats:members";
export const STATES_KEY = "stats:states";
export const SPEED_KEY = "stats:speed";
export const SYNTHETIC_KEY = "stats:synthetic";

export const MAX_GUESS_BATCH = 10;
export const MIN_GUESSES_TO_SHOW = MIN_RUNS_TO_SHOW;
const PARTY_CODES = { Democrat: "D", Republican: "R" };

export async function recordRun(redis, { runId, correct, total }) {
  const bucket = bucketIndex(accuracyPercent(correct, total));
  const previous = await redis.hget(RUNS_KEY, runId);
  const previousBucket = previous === null ? null : Number(previous);
  if (previousBucket === bucket) return bucket;
  const tx = redis
    .multi()
    .hset(RUNS_KEY, { [runId]: bucket })
    .hincrby(BUCKETS_KEY, String(bucket), 1);
  if (previousBucket !== null) tx.hincrby(BUCKETS_KEY, String(previousBucket), -1);
  await tx.exec();
  return bucket;
}

export function validateGuesses(body, membersById) {
  const guesses = body?.guesses;
  if (!Array.isArray(guesses) || guesses.length === 0 || guesses.length > MAX_GUESS_BATCH) {
    return `guesses must be an array of 1 to ${MAX_GUESS_BATCH} items`;
  }
  for (const g of guesses) {
    if (!membersById.has(g?.bioguideId)) return "unknown bioguideId";
    if (!(g.guessedParty in PARTY_CODES)) return "guessedParty must be Democrat or Republican";
    if (g.responseMs !== null && !(Number.isInteger(g.responseMs) && g.responseMs >= 0)) {
      return "responseMs must be a non-negative integer or null";
    }
  }
  return null;
}

export async function recordGuesses(redis, guesses, membersById) {
  const pipeline = redis.pipeline();
  for (const { bioguideId, guessedParty, responseMs } of guesses) {
    const member = membersById.get(bioguideId);
    const correct = member.party === guessedParty ? 1 : 0;
    pipeline
      .hincrby(MEMBERS_KEY, `${bioguideId}:shown`, 1)
      .hincrby(MEMBERS_KEY, `${bioguideId}:correct`, correct)
      .hincrby(MEMBERS_KEY, `${bioguideId}:guessed${PARTY_CODES[guessedParty]}`, 1)
      .hincrby(STATES_KEY, `${member.state}:shown`, 1)
      .hincrby(STATES_KEY, `${member.state}:correct`, correct);
    if (responseMs !== null) {
      const bin = responseBin(responseMs);
      pipeline.hincrby(SPEED_KEY, `${bin}:shown`, 1).hincrby(SPEED_KEY, `${bin}:correct`, correct);
    }
  }
  await pipeline.exec();
}

function grouped(hash) {
  const groups = new Map();
  for (const [field, value] of Object.entries(hash ?? {})) {
    const split = field.lastIndexOf(":");
    const key = field.slice(0, split);
    const group = groups.get(key) ?? {};
    group[field.slice(split + 1)] = Number(value) || 0;
    groups.set(key, group);
  }
  return groups;
}

function interval(correct, n) {
  const w = wilson(correct, n);
  return w ? { accuracy: w.p, low: w.low, high: w.high } : { accuracy: null, low: null, high: null };
}

export async function readInsights(redis, members) {
  const [buckets, memberHash, stateHash, speedHash, synthetic] = await Promise.all([
    redis.hgetall(BUCKETS_KEY),
    redis.hgetall(MEMBERS_KEY),
    redis.hgetall(STATES_KEY),
    redis.hgetall(SPEED_KEY),
    redis.get(SYNTHETIC_KEY),
  ]);
  const runCounts = bucketCounts(buckets);
  const memberStats = grouped(memberHash);
  const confusion = { Democrat: { D: 0, R: 0 }, Republican: { D: 0, R: 0 } };
  let shown = 0;
  let correct = 0;
  const memberRows = [];
  for (const member of members) {
    const s = memberStats.get(member.id);
    if (!s) continue;
    const n = s.shown ?? 0;
    shown += n;
    correct += s.correct ?? 0;
    confusion[member.party].D += s.guessedD ?? 0;
    confusion[member.party].R += s.guessedR ?? 0;
    if (n >= MIN_GUESSES_TO_SHOW) {
      memberRows.push({
        id: member.id,
        name: member.name,
        party: member.party,
        chamber: member.category,
        state: member.state,
        n,
        correct: s.correct ?? 0,
        ...interval(s.correct ?? 0, n),
      });
    }
  }
  const states = [...grouped(stateHash)].map(([state, s]) => ({
    state,
    n: s.shown ?? 0,
    correct: s.correct ?? 0,
    accuracy: s.shown ? s.correct / s.shown : null,
  }));
  const speedStats = grouped(speedHash);
  const speed = Array.from({ length: RESPONSE_BINS }, (_, bin) => {
    const s = speedStats.get(String(bin)) ?? {};
    return { bin, n: s.shown ?? 0, correct: s.correct ?? 0, accuracy: s.shown ? s.correct / s.shown : null };
  });
  const republicans = members.filter((m) => m.party === "Republican").length;
  return {
    synthetic: synthetic !== null,
    minSample: MIN_GUESSES_TO_SHOW,
    runs: { total: runCounts.reduce((a, b) => a + b, 0), counts: runCounts },
    guesses: { n: shown, correct, ...interval(correct, shown) },
    members: memberRows,
    confusion,
    states,
    speed,
    roster: { total: members.length, republicanShare: members.length ? republicans / members.length : null },
  };
}
