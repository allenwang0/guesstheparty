import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { initialQueueState, queueReducer } from "../lib/game-queue";
import {
  emptyStats,
  LEGACY_STATS_KEY,
  migrateLegacyStats,
  normalizeStats,
  STATS_KEY,
} from "../lib/player-stats";
import { normalizePoliticians } from "../lib/politicians";
import { addResponse, MAX_COUNTED_RESPONSE_MS } from "../lib/response-stats";
import { shuffle } from "../lib/shuffle";
import { shouldSubmitRun } from "../lib/submission";
import { newlyUnlocked } from "../lib/trophies";
import { parseJson, readStorage, usePersistentState } from "./usePersistentState";

export const TROPHY_KEY = "partyTrophies_v3";
export const FAST_RESPONSE_MS = 1000;
export const REVEAL_CORRECT_MS = 2000;
export const REVEAL_WRONG_MS = 3000;
const CONFETTI_STREAK = 10;

function loadStats(raw) {
  const saved = parseJson(raw);
  if (saved) return normalizeStats(saved);
  const legacy = parseJson(readStorage(LEGACY_STATS_KEY));
  return legacy ? migrateLegacyStats(legacy) : emptyStats();
}

function loadTrophies(raw) {
  const saved = parseJson(raw);
  return { unlocked: Array.isArray(saved?.unlocked) ? saved.unlocked : [] };
}

async function fireConfetti() {
  const { default: confetti } = await import("canvas-confetti");
  confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
}

function submitRun(runId, correct, total) {
  fetch("/api/submit-score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ runId, correct, total }),
  }).catch((error) => console.error("Failed to submit the run", error));
}

function nextStatsAfter(stats, { guessedParty, actualParty, isCorrect, responseMs }) {
  const streak = isCorrect ? stats.streak + 1 : 0;
  return {
    ...stats,
    runId: stats.runId || crypto.randomUUID(),
    total: stats.total + 1,
    correct: stats.correct + (isCorrect ? 1 : 0),
    streak,
    bestStreak: Math.max(streak, stats.bestStreak),
    demGuesses: stats.demGuesses + (guessedParty === "Democrat" ? 1 : 0),
    repGuesses: stats.repGuesses + (guessedParty === "Republican" ? 1 : 0),
    demCorrect: stats.demCorrect + (actualParty === "Democrat" && isCorrect ? 1 : 0),
    repCorrect: stats.repCorrect + (actualParty === "Republican" && isCorrect ? 1 : 0),
    guessedDemActualRep: stats.guessedDemActualRep + (guessedParty === "Democrat" && !isCorrect ? 1 : 0),
    guessedRepActualDem: stats.guessedRepActualDem + (guessedParty === "Republican" && !isCorrect ? 1 : 0),
    response: responseMs === null ? stats.response : addResponse(stats.response, responseMs),
  };
}

export function useGame({ onWrongGuess, onAdvance, onTrophyUnlocked } = {}) {
  const [{ current, queue }, dispatchQueue] = useReducer(queueReducer, initialQueueState);
  const [status, setStatus] = useState("loading");
  const [revealed, setRevealed] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);
  const [lastResult, setLastResult] = useState(null);
  const [stats, setStats] = usePersistentState(STATS_KEY, loadStats);
  const [trophies, setTrophies] = usePersistentState(TROPHY_KEY, loadTrophies);

  const startTimeRef = useRef(null);
  const advanceTimerRef = useRef(null);
  const guessLockRef = useRef(false);
  const callbacksRef = useRef({});
  useEffect(() => {
    callbacksRef.current = { onWrongGuess, onAdvance, onTrophyUnlocked };
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/politicians.json");
        if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
        const pool = normalizePoliticians(await res.json());
        dispatchQueue({ type: "start", pool, shuffled: shuffle(pool) });
        setStatus("ready");
      } catch (error) {
        console.error("Failed to load politicians.json", error);
        setStatus("error");
      }
    })();
    return () => clearTimeout(advanceTimerRef.current);
  }, []);

  const advance = useCallback(() => {
    advanceTimerRef.current = null;
    dispatchQueue({ type: "advance", random: Math.random() });
    guessLockRef.current = false;
    startTimeRef.current = null;
    setRevealed(false);
    setImgLoading(true);
    setLastResult(null);
    callbacksRef.current.onAdvance?.();
  }, []);

  const handleImageLoad = useCallback(() => {
    setImgLoading(false);
    startTimeRef.current = Date.now();
  }, []);

  const guess = useCallback(
    (guessedParty) => {
      if (revealed || !current || guessLockRef.current) return;
      guessLockRef.current = true;
      const actualParty = current.party;
      const isCorrect = guessedParty === actualParty;
      const elapsed = startTimeRef.current === null ? null : Date.now() - startTimeRef.current;
      const responseMs = elapsed !== null && elapsed < MAX_COUNTED_RESPONSE_MS ? elapsed : null;
      const isFast = responseMs !== null && responseMs < FAST_RESPONSE_MS;

      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(isCorrect ? 10 : [30, 50, 30]);
      }
      if (!isCorrect) callbacksRef.current.onWrongGuess?.();

      const nextStats = nextStatsAfter(stats, { guessedParty, actualParty, isCorrect, responseMs });
      if (isCorrect && nextStats.streak % CONFETTI_STREAK === 0) {
        fireConfetti().catch((error) => console.error("Confetti failed", error));
      }
      const result = { isCorrect, guessedParty, correctParty: actualParty, isFast };
      const unlocked = newlyUnlocked(trophies.unlocked, { stats: nextStats, lastResult: result });
      if (unlocked.length > 0) {
        setTrophies((prev) => ({ ...prev, unlocked: [...prev.unlocked, ...unlocked] }));
        callbacksRef.current.onTrophyUnlocked?.();
      }
      setStats(nextStats);
      if (shouldSubmitRun(nextStats.total)) submitRun(nextStats.runId, nextStats.correct, nextStats.total);
      setLastResult(result);
      setRevealed(true);
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = setTimeout(advance, isCorrect ? REVEAL_CORRECT_MS : REVEAL_WRONG_MS);
    },
    [revealed, current, stats, trophies, advance, setStats, setTrophies],
  );

  const reset = useCallback(() => {
    clearTimeout(advanceTimerRef.current);
    advanceTimerRef.current = null;
    guessLockRef.current = false;
    setStats(emptyStats(crypto.randomUUID()));
    setLastResult(null);
    setRevealed(false);
    callbacksRef.current.onAdvance?.();
  }, [setStats]);

  const accuracy = stats.total === 0 ? 0 : Math.round((stats.correct / stats.total) * 100);

  return {
    status,
    current,
    next: queue[0],
    stats,
    trophies,
    accuracy,
    revealed,
    lastResult,
    imgLoading,
    handleImageLoad,
    guess,
    reset,
  };
}
