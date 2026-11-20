// @vitest-environment jsdom
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Home from "../pages/index";
import { installFetch, posts } from "./home-harness";

beforeEach(() => {
  localStorage.setItem("partyHasSeenIntro_v3", "1");
});

async function renderGame() {
  const fetchMock = installFetch();
  render(<Home />);
  await screen.findByRole("button", { name: /democrat$/i });
  return fetchMock;
}

async function guessRepublican() {
  const button = screen.getByRole("button", { name: /republican$/i });
  await waitFor(() => expect(button).not.toBeDisabled());
  fireEvent.click(button);
}

describe("Stats modal", () => {
  // Every open of the modal used to POST the current accuracy, so one player could add any number
  // of "games" to the global histogram.
  it("sends no score when opened and closed ten times after three guesses", async () => {
    localStorage.setItem("partyStats_v3", JSON.stringify({ correct: 2, total: 3 }));
    const fetchMock = await renderGame();
    for (let i = 0; i < 10; i++) {
      fireEvent.click(screen.getByRole("button", { name: /stats|%/i }));
      await screen.findByText(/global player distribution/i);
      fireEvent.click(screen.getByRole("button", { name: "Close" }));
      await waitFor(() => expect(screen.queryByText(/global player distribution/i)).toBeNull());
    }
    await act(async () => {});
    expect(posts(fetchMock, "/api/submit-score")).toHaveLength(0);
  }, 15_000); // Ten modal open/close cycles take about 5 s, right at the default timeout.
});

describe("guessing", () => {
  afterEach(() => vi.useRealTimers());

  function shownCard() {
    return screen.getByAltText("Politician").getAttribute("src");
  }

  // On a 9-streak the 10th correct guess fires confetti. Two quick key presses used to both count, and
  // each scheduled its own advance, so the card after this one was skipped without being shown.
  it("counts one guess when the right arrow is pressed twice in one tick on a 9-streak", async () => {
    localStorage.setItem("partyStats_v3", JSON.stringify({ correct: 9, total: 9, streak: 9, bestStreak: 9 }));
    await renderGame();
    const nextCard = screen.getByAltText("preload").getAttribute("src");
    expect(nextCard).not.toBe(shownCard());

    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    fireEvent.keyDown(window, { key: "ArrowRight" });
    fireEvent.keyDown(window, { key: "ArrowRight" });
    await act(async () => {});
    await act(async () => vi.advanceTimersByTime(3000));

    expect(shownCard()).toBe(nextCard);
  });

  // The reveal timer used to keep running after Reset, so the card changed under the player's feet.
  it("keeps the current card when Reset is pressed during the reveal", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    await renderGame();
    const card = shownCard();

    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    fireEvent.keyDown(window, { key: "ArrowRight" });
    await act(async () => {});
    fireEvent.click(screen.getByRole("button", { name: "Reset run" }));
    await act(async () => vi.advanceTimersByTime(3000));

    expect(shownCard()).toBe(card);
  });
});

describe("per-member guesses", () => {
  afterEach(() => vi.useRealTimers());

  // Per-member difficulty needs every guess, but one request per guess would hit the rate limit fast.
  it("sends guesses in one batch of 10, with member ids and no correctness flag", async () => {
    const fetchMock = await renderGame();
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    for (let i = 0; i < 10; i++) {
      expect(posts(fetchMock, "/api/guesses")).toHaveLength(0);
      fireEvent.keyDown(window, { key: i % 2 ? "ArrowLeft" : "ArrowRight" });
      await act(async () => vi.advanceTimersByTime(3000));
    }
    const sent = posts(fetchMock, "/api/guesses");
    expect(sent).toHaveLength(1);
    const { guesses } = JSON.parse(sent[0][1].body);
    expect(guesses).toHaveLength(10);
    expect(guesses[0]).toEqual({
      bioguideId: expect.stringMatching(/^T0/),
      guessedParty: "Republican",
      responseMs: null,
    });
    expect(guesses.some((g) => "correct" in g)).toBe(false);
  });
});

describe("load failure", () => {
  // Players cannot fix a server file; they get a plain retry message and the detail goes to the console.
  it("shows a refresh message without internal file paths", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    globalThis.fetch = vi.fn(async () => new Response("not json", { status: 500 }));
    render(<Home />);
    expect(await screen.findByText("Couldn't load the game. Refresh to try again.")).toBeTruthy();
    expect(screen.queryByText(/politicians\.json/)).toBeNull();
    expect(consoleError).toHaveBeenCalled();
  });
});

describe("Blue Wave theme", () => {
  // The edition is a look, not a different game: the player's choice must stick across visits,
  // and both party buttons must keep working exactly as in the classic theme.
  it("persists the toggle and keeps both guess buttons working", async () => {
    await renderGame();
    const toggle = screen.getByRole("button", { name: "Blue Wave theme" });
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    expect(document.querySelector('[data-theme="bluewave"]')).not.toBeNull();
    expect(screen.getByText("BLUE WAVE EDITION")).toBeTruthy();
    expect(localStorage.getItem("gtpTheme")).toBe("bluewave");
    expect(screen.getByRole("button", { name: /democrat$/i }).disabled).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: /republican$/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: /democrat$/i }).disabled).toBe(true));
  });

  it("starts in Blue Wave when the player chose it last visit, and toggles back to classic", async () => {
    localStorage.setItem("gtpTheme", "bluewave");
    await renderGame();
    const toggle = screen.getByRole("button", { name: "Blue Wave theme" });
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(toggle);
    expect(document.querySelector('[data-theme="classic"]')).not.toBeNull();
    expect(localStorage.getItem("gtpTheme")).toBe("classic");
  });
});
