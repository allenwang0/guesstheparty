import { describe, expect, it } from "vitest";
import daily from "../pages/api/daily";
import { dailyIds, shareText } from "../lib/daily";
import { MEMBERS } from "../lib/members";
import { createResponse } from "./http";

const ids = MEMBERS.map((m) => m.id);

function serverIds(date) {
  const res = createResponse();
  daily({ method: "GET", query: { date } }, res);
  return res.body.ids;
}

// A class plays /daily together, so every device must deal the same 10 faces for a UTC date.
describe("daily challenge", () => {
  it("deals the same 10 ids on the server and the client for a date", () => {
    const client = dailyIds("2026-11-11", [...ids].reverse());
    expect(client).toHaveLength(10);
    expect(new Set(client).size).toBe(10);
    expect(serverIds("2026-11-11")).toEqual(client);
  });

  it("deals a different set on a different date", () => {
    expect(dailyIds("2026-11-12", ids)).not.toEqual(dailyIds("2026-11-11", ids));
  });

  it("rejects a malformed date", () => {
    const res = createResponse();
    daily({ method: "GET", query: { date: "tomorrow" } }, res);
    expect(res.statusCode).toBe(400);
  });

  it("shares a text grid", () => {
    expect(shareText("2026-11-11", [true, false, true])).toBe("Guess the Party daily 2026-11-11: 2/3\n✓✗✓");
  });
});
