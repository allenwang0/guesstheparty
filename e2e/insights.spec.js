import { expect, test } from "@playwright/test";
import {
  confusionTakeaway,
  distributionTakeaway,
  formatCount,
  memberTakeaway,
  pct,
  rankMembers,
  speedTakeaway,
  stateTakeaway,
} from "../lib/insights.js";

async function apiInsights(request) {
  const res = await request.get("/api/insights");
  expect(res.ok()).toBe(true);
  return res.json();
}

for (const width of [375, 1280]) {
  for (const colorScheme of ["light", "dark"]) {
    test(`renders the synthetic sample at ${width}px in ${colorScheme} mode`, async ({ page, request }) => {
      const data = await apiInsights(request);
      expect(data.synthetic).toBe(true);

      await page.emulateMedia({ colorScheme });
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/insights");
      await expect(page.getByRole("status")).toContainText("Synthetic sample data");

      const takeaway = (id) => page.getByTestId(`${id}-takeaway`);
      await expect(takeaway("distribution")).toHaveText(distributionTakeaway(data.runs));
      await expect(takeaway("distribution")).toContainText(formatCount(data.runs.total));
      await expect(takeaway("confusion")).toHaveText(confusionTakeaway(data.confusion, data.roster));
      await expect(takeaway("confusion")).toContainText(pct(data.roster.republicanShare));
      const { hardest } = rankMembers(data.members);
      await expect(takeaway("members")).toHaveText(memberTakeaway(hardest));
      await expect(takeaway("members")).toContainText(formatCount(hardest[0].n));
      await expect(takeaway("states")).toHaveText(stateTakeaway(data.states, data.minSample));
      await expect(takeaway("speed")).toHaveText(speedTakeaway(data.speed));
      await expect(page.getByTestId("overall")).toContainText(formatCount(data.guesses.n));

      const horizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );
      expect(horizontalOverflow).toBe(false);

      await page.screenshot({ path: `test-results/insights-${width}-${colorScheme}.png`, fullPage: true });
      if (width === 1280 && colorScheme === "light") {
        await page.screenshot({ path: "docs/insights.png", fullPage: true });
      }
    });
  }
}

test("tapping a state filters the member chart", async ({ page, request }) => {
  const data = await apiInsights(request);
  const state = data.states.filter((s) => s.n >= data.minSample).sort((a, b) => b.n - a.n)[0].state;
  await page.goto("/insights");
  await page.getByRole("button", { name: new RegExp(`^${state}: `) }).click();
  await expect(page.getByRole("button", { name: `State: ${state} ✕` })).toBeVisible();
  await expect(page.getByTestId("members-takeaway")).toHaveText(
    memberTakeaway(rankMembers(data.members, { state }).hardest),
  );
});

test("shows an error with retry and no charts when the API fails", async ({ page }) => {
  await page.route("**/api/insights", (route) => route.fulfill({ status: 500, body: "{}" }));
  await page.goto("/insights");
  await expect(page.getByText("Stats are unavailable right now").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry" }).first()).toBeVisible();
  await expect(page.locator('[data-testid$="-chart"]')).toHaveCount(0);
  await expect(page.locator('[data-testid$="-takeaway"]')).toHaveCount(0);
});
