import { bucketIndex } from "./buckets";

export function betterThanPercent(accuracy, counts) {
  const total = counts.reduce((sum, count) => sum + count, 0);
  if (total === 0) return null;
  const own = bucketIndex(accuracy);
  const below = counts.slice(0, own).reduce((sum, count) => sum + count, 0);
  return Math.round(((below + counts[own] / 2) / total) * 100);
}
