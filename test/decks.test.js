import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { formatOffice, normalizePoliticians } from "../lib/politicians";
import { DECKS, DEFAULT_DECK_ID, deckFromSearch, statsKeyFor } from "../lib/decks";
import { STATS_KEY } from "../lib/player-stats";

describe("decks", () => {
  it("keeps the default deck on the existing stats key so returning players keep their progress", () => {
    expect(statsKeyFor(deckFromSearch(""))).toBe(STATS_KEY);
  });

  it("gives every other deck its own stats so accuracy on one pool never mixes with another", () => {
    const keys = DECKS.map(statsKeyFor);
    expect(new Set(keys).size).toBe(DECKS.length);
  });

  it("falls back to the default deck for an unknown or missing ?deck= value", () => {
    expect(deckFromSearch("?deck=congress-1").id).toBe(DEFAULT_DECK_ID);
    expect(deckFromSearch("?deck=congress-118").id).toBe("congress-118");
  });
});

describe("deck files", () => {
  const root = path.join(__dirname, "..", "public");
  for (const deck of DECKS) {
    it(`${deck.id}: every card has a party the game can score and a portrait that exists`, () => {
      const members = normalizePoliticians(JSON.parse(readFileSync(path.join(root, deck.url), "utf8")));
      // The Michigan pilot is the smallest pool: 20 legislators with verified photo rights.
      expect(members.length).toBeGreaterThanOrEqual(20);
      for (const m of members) {
        expect(["Democrat", "Republican"]).toContain(m.party);
        expect(existsSync(path.join(root, m.img))).toBe(true);
      }
    });
  }

  it("credits the author and license of every non-official Class of 2026 photo", () => {
    const members = JSON.parse(readFileSync(path.join(root, "decks", "class-of-2026.json"), "utf8"));
    for (const m of members)
      expect(m.credit).toMatchObject({ author: expect.any(String), license: expect.any(String) });
  });

  it("keeps the Blue Wave and Michigan decks evenly split so always guessing one party scores 50%", () => {
    for (const file of ["blue-wave-120.json", "michigan-legislature.json"]) {
      const members = JSON.parse(readFileSync(path.join(root, "decks", file), "utf8"));
      const dems = members.filter((m) => m.party === "Democrat").length;
      expect(dems * 2).toBe(members.length);
    }
  });

  it("labels Michigan legislators with their state office, never as members of Congress", () => {
    const members = JSON.parse(readFileSync(path.join(root, "decks", "michigan-legislature.json"), "utf8"));
    for (const m of members) {
      expect(formatOffice(m, false)).toMatch(/^Michigan State (Senator|Representative)$/);
      expect(formatOffice(m, true)).toMatch(/^Michigan State (Senator|Representative) • District \d+$/);
    }
  });
});
