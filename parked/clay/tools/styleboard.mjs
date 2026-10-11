// Capture the style-board screenshots: same position, one PNG per art-style variant.
// Usage: node tools/styleboard.mjs [base-url]
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const BASE = process.argv[2] || 'http://localhost:58062';
const FEN = 'rnbqklag/pppmsppp/8/8/8/8/PPPMSPPP/RNBQKLAG w - - 0 1'; // all 11 piece types, both sides
const OUT = fileURLToPath(new URL('../docs/styleboard/img/', import.meta.url));

/** [id, query, width?, height?] */
const SHOTS = [
  ['A1', 'style=sprites'],
  ['A2', 'style=hd'],
  ['A3', 'style=cel'],
  ['A4', 'style=voxel'],
  ['A5', 'style=db32'],
  ['B1', 'style=sprites&army=green-purple'],
  ['B2', 'style=sprites&army=ivory-charcoal'],
  ['B3', 'style=sprites&px=1'],
  ['B4', 'style=sprites&px=3'],
  ['B5', 'style=sprites&spriteScale=0.85'],
  ['B6', 'style=sprites&spriteScale=1.15'],
  ['M1', 'style=sprites', 390, 844],
  ['M2', 'style=hd', 390, 844],
];

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
for (const [id, q, width = 1440, height = 900] of SHOTS) {
  const page = await browser.newPage({ viewport: { width, height } });
  const url = `${BASE}/?${q}&fen=${encodeURIComponent(FEN)}`;
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForSelector('#board canvas');
  await page.waitForTimeout(3000); // textures and voxel models finish loading
  await page.screenshot({ path: `${OUT}${id}.png` });
  await page.close();
  console.log(`${id}  ${url}`);
}
await browser.close();
