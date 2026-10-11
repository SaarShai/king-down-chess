// Round 2 style board: the nine reference presets, one full shot + one back-rank crop each.
// Usage: node tools/styleboard2.mjs [base-url]   (needs a dev server already running)
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const BASE = process.argv[2] || 'http://localhost:5199';
const FEN = 'rnbqklag/pppmsppp/8/8/8/8/PPPMSPPP/RNBQKLAG w - - 0 1'; // all 11 piece types, both sides
const OUT = fileURLToPath(new URL('../docs/styleboard/img/', import.meta.url));
const JSON_OUT = fileURLToPath(new URL('../docs/styleboard/round2.json', import.meta.url));
const W = 1600, H = 1000, CW = 800, CH = 360;

const SHOTS = [
  ['chunkyVoxel', 'A', 'Chunky voxel', 'Pixel 3 with two toon bands, a 1-art-pixel hull rim and a dark ring around every tile top; the flattest, most graphic option, but two bands throw away most of the sculpts’ modelling.'],
  ['chunkySprite', 'A', 'Chunky sprite', 'Painted sprites with a dilated near-black outline over the same ringed tiles; the crispest silhouettes of the nine, at the cost of the pieces never turning with the camera.'],
  ['chunkyPalette', 'A', 'Chunky + Endesga 32', 'Chunky voxel quantised to the Endesga-32 ramp for saturated poster colour; the strongest graphic unity, but the ramp swallows the tile edge ring on dark squares and pulls both armies toward the same navy.'],
  ['dungeonSprite', 'B', 'Dungeon sprite', 'Painted sprites on Drive stone tiles under four warm corner torches at 60°, with contact shadows; the most atmospheric, but the far corners go dark enough to hurt piece identification.'],
  ['dungeonVoxel', 'B', 'Dungeon voxel', 'Same stone board and torches with voxel sculpts, so the pieces catch the warm light in 3D; the light falloff costs contrast on the dark army more than the sprites do.'],
  ['dungeonBright', 'B', 'Dungeon bright', 'Stone tiles and contact shadows under the existing bright paper lighting; keeps reference B’s textured floor and full readability, but loses the torch mood entirely.'],
  ['isoVoxel', 'C', 'Iso voxel', 'True 45°/30° isometric on a tall board block with visible side faces, warm 32-colour ramp and a hull rim; the strongest sense of place, but a 30° camera makes front pieces occlude the rank behind.'],
  ['isoSprite', 'C', 'Iso sprite', 'The iso board with outlined painted sprites on the warm ramp; the closest match to the reference art, though billboards at 30° stand oddly tall against the flat board.'],
  ['isoClean', 'C', 'Iso clean', 'Iso camera and tall board with no palette quantisation, so the painted voxel colours survive; clearer piece colour than C1, but it loses the limited-palette cohesion the reference lives on.'],
];

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
const manifest = [];

for (const [key, ref, label, blurb] of SHOTS) {
  const url = `${BASE}/?style=${key}&fen=${encodeURIComponent(FEN)}`;
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForSelector('#board canvas');
  await page.waitForTimeout(3500); // textures, sprite outlines and voxel models finish loading
  await page.screenshot({ path: `${OUT}r2-${key}.png` });

  // Crop window centred on the white back rank (squares 0-7), clamped to the viewport.
  const box = await page.evaluate(() => {
    const pts = Array.from({ length: 8 }, (_, sq) => window.view.screenOf(sq));
    const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
    // One rank of on-screen pitch ≈ how far a piece rises above its tile centre; scales with the pose.
    const pitch = Math.abs(window.view.screenOf(8).y - window.view.screenOf(0).y);
    return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys), pitch };
  });
  const cx = (box.x0 + box.x1) / 2;
  const cy = (box.y0 + box.y1) / 2 - 1.2 * box.pitch;
  const clip = {
    x: Math.round(Math.min(Math.max(cx - CW / 2, 0), W - CW)),
    y: Math.round(Math.min(Math.max(cy - CH / 2, 0), H - CH)),
    width: CW, height: CH,
  };
  await page.screenshot({ path: `${OUT}r2-${key}-crop.png`, clip });

  manifest.push({ key, ref, label, blurb, img: `img/r2-${key}.png`, crop: `img/r2-${key}-crop.png` });
  console.log(`${key}  ${url}  crop ${clip.x},${clip.y}`);
}

await writeFile(JSON_OUT, JSON.stringify(manifest, null, 2) + '\n');
await browser.close();
