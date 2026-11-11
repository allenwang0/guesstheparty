export const RESPONSE_BIN_MS = 100;
export const RESPONSE_BINS = 20;
export const MAX_COUNTED_RESPONSE_MS = 10000;

export function responseBin(ms) {
  return Math.min(Math.floor(ms / RESPONSE_BIN_MS), RESPONSE_BINS - 1);
}

export function emptyResponseStats() {
  return { count: 0, sum: 0, sumSquares: 0, bins: Array(RESPONSE_BINS).fill(0) };
}

export function addResponse(stats, ms) {
  const bins = [...stats.bins];
  bins[responseBin(ms)] += 1;
  return {
    count: stats.count + 1,
    sum: stats.sum + ms,
    sumSquares: stats.sumSquares + ms * ms,
    bins,
  };
}
