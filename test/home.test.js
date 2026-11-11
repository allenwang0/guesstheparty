// @vitest-environment jsdom
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
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
  });
});
