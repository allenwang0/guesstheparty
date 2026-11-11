export const MIN_RUN_GUESSES = 20;
export const SUBMIT_EVERY = 25;
export const MAX_RUN_GUESSES = 5000;

export function shouldSubmitRun(total) {
  return total >= MIN_RUN_GUESSES && (total - MIN_RUN_GUESSES) % SUBMIT_EVERY === 0;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateRun(body) {
  const { runId, correct, total } = body ?? {};
  if (typeof runId !== "string" || !UUID_PATTERN.test(runId)) return "runId must be a UUID";
  if (!Number.isInteger(correct) || !Number.isInteger(total)) return "correct and total must be integers";
  if (total < MIN_RUN_GUESSES) return `total must be at least ${MIN_RUN_GUESSES}`;
  if (total > MAX_RUN_GUESSES) return `total must be at most ${MAX_RUN_GUESSES}`;
  if (correct < 0 || correct > total) return "correct must be between 0 and total";
  return null;
}
