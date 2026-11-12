import { mulberry32 } from "./random";
import { shuffle } from "./shuffle";

export const DAILY_COUNT = 10;

export function utcDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function seedForDate(dateKey) {
  return Number(dateKey.replaceAll("-", ""));
}

export function dailyIds(dateKey, ids, count = DAILY_COUNT) {
  const sorted = [...ids].sort();
  return shuffle(sorted, mulberry32(seedForDate(dateKey))).slice(0, count);
}

export function shareText(dateKey, results) {
  const correct = results.filter(Boolean).length;
  const grid = results.map((ok) => (ok ? "✓" : "✗")).join("");
  return `Guess the Party daily ${dateKey}: ${correct}/${results.length}\n${grid}`;
}
