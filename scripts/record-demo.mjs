// Captures two guesses and their reveals from a running server and writes docs/demo.gif.
// Usage: npm run build && npx next start -p 3200 & node scripts/record-demo.mjs http://localhost:3200
import { chromium, expect } from "@playwright/test";
import sharp from "sharp";

const baseUrl = process.argv[2] ?? "http://localhost:3200";
const size = { width: 390, height: 760 };
const GIF_WIDTH = 300;
const FRAME_DELAY_MS = 120;

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: size, deviceScaleFactor: 1 });
await context.addInitScript(() => localStorage.setItem("partyHasSeenIntro_v3", "1"));
const page = await context.newPage();
page.setDefaultTimeout(60000);
await page.goto(baseUrl, { waitUntil: "networkidle" });

const frames = [];
const capture = async (count = 1) => {
  for (let i = 0; i < count; i++) frames.push(await page.screenshot());
};

const card = page.getByAltText("Politician");
for (const direction of [-1, 1]) {
  await expect(page.getByRole("button", { name: /democrat$/i })).toBeEnabled({ timeout: 60000 });
  await page.waitForTimeout(800);
  await capture(3);
  const box = await card.boundingBox();
  const startX = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(startX, y);
  await page.mouse.down();
  for (let step = 1; step <= 8; step++) {
    await page.mouse.move(startX + direction * step * 18, y, { steps: 2 });
    await capture();
  }
  await page.mouse.up();
  if (await page.getByRole("button", { name: /democrat$/i }).isEnabled()) {
    await page.keyboard.press(direction < 0 ? "ArrowLeft" : "ArrowRight");
  }
  for (let i = 0; i < 14; i++) {
    await page.waitForTimeout(150);
    await capture();
  }
}
await browser.close();

const resized = await Promise.all(
  frames.map((f) => sharp(f).resize(GIF_WIDTH).ensureAlpha().raw().toBuffer({ resolveWithObject: true })),
);
const { width, height } = resized[0].info;
await sharp(Buffer.concat(resized.map((r) => r.data)), {
  raw: { width, height: height * resized.length, channels: 4, pageHeight: height },
})
  .gif({ delay: resized.map(() => FRAME_DELAY_MS), loop: 0, colours: 96 })
  .toFile("docs/demo.gif");
console.log(
  `Wrote docs/demo.gif from ${frames.length} frames (${new Set(frames.map((f) => f.toString("base64"))).size} distinct)`,
);
