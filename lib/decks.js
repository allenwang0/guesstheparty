import { STATS_KEY } from "./player-stats";

export const DEFAULT_DECK_ID = "current";

// Only the default deck reports to the global stats API: the API checks guesses against the
// current roster, and mixing decks would make /insights compare different pools.
export const DECKS = [
  { id: DEFAULT_DECK_ID, label: "Current Congress", url: "/politicians.json" },
  { id: "congress-119", label: "119th Congress (2025–27)", url: "/decks/congress-119.json" },
  { id: "congress-118", label: "118th Congress (2023–25)", url: "/decks/congress-118.json" },
  { id: "congress-117", label: "117th Congress (2021–23)", url: "/decks/congress-117.json" },
  { id: "class-of-2026", label: "Class of 2026 (newly elected)", url: "/decks/class-of-2026.json" },
  {
    id: "class-of-2026-democrats",
    label: "Class of 2026: Democrats only",
    url: "/decks/class-of-2026-democrats.json",
  },
  { id: "blue-wave-120", label: "Blue Wave: 120th Congress", url: "/decks/blue-wave-120.json" },
  // State legislators: the reveal names the state office so a state senator never reads as a U.S. Senator.
  { id: "michigan-legislature", label: "Michigan Legislature", url: "/decks/michigan-legislature.json" },
];

export function findDeck(id) {
  return DECKS.find((deck) => deck.id === id) ?? DECKS[0];
}

export function deckFromSearch(search) {
  return findDeck(new URLSearchParams(search).get("deck"));
}

export function statsKeyFor(deck) {
  return deck.id === DEFAULT_DECK_ID ? STATS_KEY : `${STATS_KEY}:${deck.id}`;
}
