import { addResponse, emptyResponseStats } from "./response-stats";

export const STATS_KEY = "partyStats_v4";
export const LEGACY_STATS_KEY = "partyStats_v3";

const COUNTERS = [
  "correct",
  "total",
  "streak",
  "bestStreak",
  "demGuesses",
  "repGuesses",
  "demCorrect",
  "repCorrect",
  "guessedDemActualRep",
  "guessedRepActualDem",
];

export function emptyStats(runId = null) {
  return {
    runId,
    ...Object.fromEntries(COUNTERS.map((key) => [key, 0])),
    response: emptyResponseStats(),
  };
}

function counters(source) {
  return Object.fromEntries(COUNTERS.map((key) => [key, Number(source?.[key]) || 0]));
}

export function migrateLegacyStats(legacy) {
  const response = (legacy?.responseTimes ?? [])
    .filter((ms) => Number.isFinite(ms) && ms >= 0)
    .reduce(addResponse, emptyResponseStats());
  return { ...emptyStats(), ...counters(legacy), response };
}

export function normalizeStats(saved) {
  const response = saved?.response;
  const validResponse =
    response && Array.isArray(response.bins) && response.bins.length === emptyResponseStats().bins.length;
  return {
    ...emptyStats(typeof saved?.runId === "string" ? saved.runId : null),
    ...counters(saved),
    response: validResponse ? response : emptyResponseStats(),
  };
}
