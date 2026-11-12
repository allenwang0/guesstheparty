import { BUCKET_WIDTH, bucketLabel } from "./buckets";
import { RESPONSE_BIN_MS } from "./response-stats";

export function pct(value, digits = 0) {
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatCount(n) {
  return n.toLocaleString("en-US");
}

export function medianBucket(counts) {
  const total = counts.reduce((a, b) => a + b, 0);
  if (total === 0) return null;
  let seen = 0;
  for (let i = 0; i < counts.length; i++) {
    seen += counts[i];
    if (seen >= total / 2) return i;
  }
  return counts.length - 1;
}

export function distributionTakeaway(runs) {
  const median = medianBucket(runs.counts);
  return `Median run: ${bucketLabel(median)}% correct (${formatCount(runs.total)} runs).`;
}

export function rankMembers(members, { chamber = "all", party = "all", state = null } = {}, limit = 15) {
  const rows = members.filter(
    (m) =>
      (chamber === "all" || m.chamber === chamber) &&
      (party === "all" || m.party === party) &&
      (state === null || m.state === state),
  );
  const sorted = [...rows].sort((a, b) => a.accuracy - b.accuracy || b.n - a.n);
  return { hardest: sorted.slice(0, limit), easiest: sorted.slice(-limit).reverse(), count: rows.length };
}

export function memberTakeaway(hardest) {
  if (hardest.length === 0) return null;
  const m = hardest[0];
  return `Most misread: ${m.name}, ${pct(m.accuracy)} correct over ${formatCount(m.n)} guesses.`;
}

export function confusionTotals(confusion) {
  const guessedR = confusion.Democrat.R + confusion.Republican.R;
  const total = guessedR + confusion.Democrat.D + confusion.Republican.D;
  return { total, guessedRShare: total ? guessedR / total : null };
}

export function confusionTakeaway(confusion, roster) {
  const { guessedRShare } = confusionTotals(confusion);
  return `Players guess Republican ${pct(guessedRShare)} of the time; ${pct(roster.republicanShare)} of members are Republican.`;
}

export function stateTakeaway(states, minSample) {
  const enough = states.filter((s) => s.n >= minSample).sort((a, b) => a.accuracy - b.accuracy);
  if (enough.length === 0) return null;
  const low = enough[0];
  const high = enough[enough.length - 1];
  return `Lowest: ${low.state} at ${pct(low.accuracy)} (${formatCount(low.n)} guesses); highest: ${high.state} at ${pct(high.accuracy)}.`;
}

export const SPEED_SPLIT_MS = 1000;

export function speedTakeaway(speed) {
  const split = SPEED_SPLIT_MS / RESPONSE_BIN_MS;
  const sum = (bins) =>
    bins.reduce((acc, b) => ({ n: acc.n + b.n, correct: acc.correct + b.correct }), { n: 0, correct: 0 });
  const fast = sum(speed.slice(0, split));
  const slow = sum(speed.slice(split));
  if (fast.n === 0 || slow.n === 0) return null;
  return `Under 1,000 ms: ${pct(fast.correct / fast.n)} correct; 1,000 ms or slower: ${pct(slow.correct / slow.n)}.`;
}

export function binLabel(bin, last) {
  const start = bin * RESPONSE_BIN_MS;
  return bin === last
    ? `${formatCount(start)}+ ms`
    : `${formatCount(start)}-${formatCount(start + RESPONSE_BIN_MS - 1)} ms`;
}

export { BUCKET_WIDTH };
