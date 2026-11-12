import { readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const IMG_DIR = path.join(ROOT, "public", "images", "politicians");
const JSON_PATH = path.join(ROOT, "public", "politicians.json");
const WIDTH = 360;
const HEIGHT = 440;
const QUALITY = 75;

function mb(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function dirSize(dir) {
  const files = await readdir(dir);
  const sizes = await Promise.all(files.map(async (f) => (await stat(path.join(dir, f))).size));
  return { files: files.length, bytes: sizes.reduce((a, b) => a + b, 0) };
}

const before = await dirSize(IMG_DIR);
const jpegs = (await readdir(IMG_DIR)).filter((f) => f.endsWith(".jpg"));
for (const file of jpegs) {
  const source = path.join(IMG_DIR, file);
  const target = source.replace(/\.jpg$/, ".webp");
  await sharp(source).resize(WIDTH, HEIGHT, { fit: "cover" }).webp({ quality: QUALITY }).toFile(target);
  await rm(source);
}

const politicians = JSON.parse(await readFile(JSON_PATH, "utf8"));
const updated = politicians.map((p) => ({ ...p, img: p.img.replace(/\.jpg$/, ".webp") }));
await writeFile(JSON_PATH, `${JSON.stringify(updated, null, 2)}\n`);

const after = await dirSize(IMG_DIR);
console.log(`Converted ${jpegs.length} JPEGs to WebP (${WIDTH}x${HEIGHT}, quality ${QUALITY}).`);
console.log(`Before: ${before.files} files, ${mb(before.bytes)}`);
console.log(`After:  ${after.files} files, ${mb(after.bytes)}`);
