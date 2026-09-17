// Photo tiles vs procedural pixel stone: two full shots, two 3× crops of the centre four squares,
// and the mean luminance of each albedo. Usage: node tools/tiles-proc.mjs [base-url]
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const BASE = process.argv[2] || 'http://localhost:5199';
const FEN = 'rnbqklag/pppmsppp/8/8/8/8/PPPMSPPP/RNBQKLAG w - - 0 1'; // all 11 piece types, both sides
const OUT = fileURLToPath(new URL('../docs/research/tiles-proc/', import.meta.url));
const W = 1280, H = 800, ZOOM = 3, SQUARES = [27, 28, 35, 36]; // d4 e4 d5 e5 — empty, two of each colour

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errors = [];
page.on('console', m => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', e => errors.push(String(e)));

/** Screenshot the four-square block and blow it up ZOOM× with nearest neighbour. */
async function shoot(name) {
  await page.screenshot({ path: `${OUT}${name}.png` });
  const b = await page.evaluate(sqs => {
    const pts = sqs.map(sq => window.view.screenOf(sq));
    const pitch = Math.abs(window.view.screenOf(8).y - window.view.screenOf(0).y);
    return { x0: Math.min(...pts.map(p => p.x)), x1: Math.max(...pts.map(p => p.x)), y0: Math.min(...pts.map(p => p.y)), y1: Math.max(...pts.map(p => p.y)), pitch };
  }, SQUARES);
  const pad = b.pitch * 0.8;
  const clip = { x: Math.round(b.x0 - pad), y: Math.round(b.y0 - pad), width: Math.round(b.x1 - b.x0 + 2 * pad), height: Math.round(b.y1 - b.y0 + 2 * pad) };
  const crop = `${OUT}${name}-crop.png`;
  await page.screenshot({ path: crop, clip });
  // Nearest-neighbour blow-up, so the art pixels stay square. Playwright cannot upscale a shot.
  execFileSync('python3', ['-c', 'import sys;from PIL import Image;p=sys.argv[1];k=int(sys.argv[2]);i=Image.open(p);i.resize((i.width*k,i.height*k),Image.NEAREST).save(p)', crop, String(ZOOM)]);
  console.log(`${name}  clip ${clip.x},${clip.y} ${clip.width}×${clip.height} → ${clip.width * ZOOM}×${clip.height * ZOOM}`);
}

await page.goto(`${BASE}/?style=dungeonVoxel&fen=${encodeURIComponent(FEN)}`, { waitUntil: 'load' });
await page.waitForSelector('#board canvas');
await page.waitForTimeout(4000); // JPEG tiles, sprite outlines and voxel models finish loading
await shoot('before');
await page.selectOption('#style', 'dungeonProc');
await page.waitForTimeout(1500);
await shoot('after');

// Mean sRGB byte and mean linear luminance of each albedo, read straight off the texture images.
const means = await page.evaluate(() => {
  const cv = document.createElement('canvas'), ctx = cv.getContext('2d');
  const lin = c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const out = {};
  for (const [set, maps] of [['photo', window.view.stone], ['proc', window.view.proc]]) {
    for (const [k, tex] of Object.entries(maps)) {
      const img = tex.image;
      cv.width = img.width; cv.height = img.height;
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
      let srgb = 0, linear = 0;
      for (let i = 0; i < d.length; i += 4) { const g = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; srgb += g; linear += lin(g / 255); }
      const n = d.length / 4;
      out[`${set}.${k}`] = { size: `${cv.width}×${cv.height}`, srgb: +(srgb / n).toFixed(2), linear: +(linear / n).toFixed(5) };
    }
  }
  return out;
});
console.log(JSON.stringify(means, null, 2));
await writeFile(`${OUT}means.json`, JSON.stringify(means, null, 2) + '\n');
console.log(errors.length ? `CONSOLE ERRORS:\n${errors.join('\n')}` : 'no console errors');
await browser.close();
