import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizePoliticians } from "../lib/politicians";

const politicians = JSON.parse(readFileSync(new URL("../public/politicians.json", import.meta.url)));

describe("politicians.json", () => {
  // Per-member stats are keyed by id, so ids must not depend on array order and must stay unique.
  it("uses unique bioguide ids that match each portrait's filename", () => {
    const ids = politicians.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of politicians) {
      expect(p.id).toMatch(/^[A-Z]\d{6}$/);
      expect(p.img).toContain(`-${p.id}.`);
    }
  });

  it("keeps the same ids when the array is reordered", () => {
    const ids = normalizePoliticians(politicians).map((p) => p.id);
    const reversed = normalizePoliticians([...politicians].reverse()).map((p) => p.id);
    expect(reversed).toEqual([...ids].reverse());
  });

  it("contains only Democrats and Republicans in the House and Senate", () => {
    expect(new Set(politicians.map((p) => p.party))).toEqual(new Set(["Democrat", "Republican"]));
    expect(new Set(politicians.map((p) => p.category))).toEqual(new Set(["house", "senate"]));
  });
});
