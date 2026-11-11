export const BUCKET_COUNT = 10;
export const BUCKET_WIDTH = 100 / BUCKET_COUNT;

export function accuracyPercent(correct, total) {
  return total > 0 ? (correct / total) * 100 : 0;
}

export function bucketIndex(accuracy) {
  return Math.min(Math.floor(accuracy / BUCKET_WIDTH), BUCKET_COUNT - 1);
}

export function bucketLabel(index) {
  const start = index * BUCKET_WIDTH;
  return index === BUCKET_COUNT - 1 ? `${start}-100` : `${start}-${start + BUCKET_WIDTH - 1}`;
}

export function bucketCounts(hash) {
  return Array.from({ length: BUCKET_COUNT }, (_, i) => Math.max(0, Number(hash?.[i]) || 0));
}

export const MIN_RUNS_TO_SHOW = 30;
