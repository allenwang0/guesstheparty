export const QUEUE_SIZE = 5;
export const RECENT_WINDOW = 50;

export const initialQueueState = { pool: [], current: null, queue: [], recent: [] };

function remember(recent, id) {
  return [...recent.filter((r) => r !== id), id].slice(-RECENT_WINDOW);
}

function pickFresh(pool, recent, random) {
  const excluded = new Set(recent);
  const fresh = pool.filter((p) => !excluded.has(p.id));
  const candidates = fresh.length > 0 ? fresh : pool;
  return candidates[Math.floor(random * candidates.length)];
}

export function queueReducer(state, action) {
  switch (action.type) {
    case "start": {
      const [current, ...queue] = action.shuffled.slice(0, QUEUE_SIZE + 1);
      const recent = [current, ...queue].reduce((ids, p) => remember(ids, p.id), []);
      return { pool: action.pool, current, queue, recent };
    }
    case "advance": {
      if (state.pool.length === 0 || state.queue.length === 0) return state;
      const [current, ...rest] = state.queue;
      const candidate = pickFresh(state.pool, state.recent, action.random);
      return {
        ...state,
        current,
        queue: [...rest, candidate],
        recent: remember(state.recent, candidate.id),
      };
    }
    default:
      throw new Error(`Unknown queue action: ${action.type}`);
  }
}
