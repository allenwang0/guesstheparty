import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("partyHasSeenIntro_v3", "1"));
});

test("opening the Stats modal 10 times sends no score", async ({ page }) => {
  const posts = [];
  page.on("request", (req) => {
    if (req.method() === "POST") posts.push(req.url());
  });
  await page.goto("/");
  for (let i = 0; i < 3; i++) {
    const button = page.getByRole("button", { name: /republican$/i });
    await expect(button).toBeEnabled();
    await button.click();
    await expect(button).toBeDisabled();
  }
  await expect(page.getByRole("button", { name: /republican$/i })).toBeEnabled();
  for (let i = 0; i < 10; i++) {
    await page.getByRole("button", { name: /^\d+%$|stats/i }).click();
    await expect(page.getByText("Global Player Distribution")).toBeVisible();
    await page.getByRole("button", { name: "Close" }).click();
    await expect(page.getByText("Global Player Distribution")).toHaveCount(0);
  }
  expect(posts.filter((url) => url.includes("/api/submit-score"))).toEqual([]);
});

test("without Upstash the game plays and /insights shows its empty state", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /democrat$/i }).click();
  await expect(page.getByRole("heading", { level: 2 }).first()).toBeVisible();

  await page.goto("/insights");
  await expect(page.getByText(/Not enough games yet \(\d+ of 30\)/).first()).toBeVisible();
  await expect(page.getByText("Synthetic sample data")).toHaveCount(0);
  await expect(page.locator('[data-testid$="-chart"]')).toHaveCount(0);
});

test("/daily deals the server's 10 faces and ends with a share grid", async ({ page, request }) => {
  const { ids } = await (await request.get("/api/daily")).json();
  const guesses = [];
  page.on("request", (req) => {
    if (req.url().endsWith("/api/guesses")) guesses.push(JSON.parse(req.postData()).guesses);
  });
  await page.goto("/daily");
  for (let i = 0; i < 10; i++) {
    await expect(page.getByText(`Face ${i + 1} of 10`)).toBeVisible();
    await page.getByRole("button", { name: "D: Democrat" }).click();
  }
  await expect(page.getByTestId("daily-grid")).toHaveText(/^[✓✗]{10}$/);
  await expect.poll(() => guesses.length).toBe(1);
  expect(guesses[0].map((g) => g.bioguideId)).toEqual(ids);
});
