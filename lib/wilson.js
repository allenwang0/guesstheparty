export const Z_95 = 1.959963984540054;

export function wilson(successes, trials, z = Z_95) {
  if (trials === 0) return null;
  const p = successes / trials;
  const z2 = z * z;
  const denominator = 1 + z2 / trials;
  const center = (p + z2 / (2 * trials)) / denominator;
  const margin = (z * Math.sqrt((p * (1 - p)) / trials + z2 / (4 * trials * trials))) / denominator;
  return { p, low: Math.max(0, center - margin), high: Math.min(1, center + margin) };
}
