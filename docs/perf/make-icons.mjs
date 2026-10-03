/** Draws the app icons from the painted ivory Frost King (docs/2d-first-pieces/king/king.webp).
 *  PLAYABLE_BROWSER=chromium node docs/perf/make-icons.mjs  →  public/icons/*.png */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
const art = 'data:image/webp;base64,' + readFileSync(new URL('../2d-first-pieces/king/king.webp', import.meta.url)).toString('base64');
// Head, crown and shoulders of the left (ivory) figure, in source pixels; the maskable icon zooms out
// so the crown stays inside the 80 % safe circle.
const ICONS = [
  { file: 'icon-192.png', size: 192, crop: [265, 0, 400] },
  { file: 'icon-512.png', size: 512, crop: [265, 0, 400] },
  { file: 'apple-touch-icon.png', size: 180, crop: [265, 0, 400] },
  { file: 'maskable-512.png', size: 512, crop: [215, -70, 520] },
];
const browser = await chromium.launch({ channel: process.env.PLAYABLE_BROWSER });
const page = await browser.newPage();
for (const { file, size, crop: [x, y, s] } of ICONS) {
  const png = await page.evaluate(async ({ art, size, x, y, s }) => {
    const img = new Image(); img.src = art; await img.decode();
    const c = document.createElement('canvas'); c.width = c.height = size;
    const g = c.getContext('2d');
    // The ink of the game's frame, with the art's own pale glow behind the figure.
    const glow = g.createRadialGradient(size * .5, size * .45, 0, size * .5, size * .45, size * .6);
    glow.addColorStop(0, '#5a5f66'); glow.addColorStop(1, '#151515');
    g.fillStyle = glow; g.fillRect(0, 0, size, size);
    g.imageSmoothingQuality = 'high';
    g.drawImage(img, x, y, s, s, 0, 0, size, size);
    return c.toDataURL('image/png');
  }, { art, size, x, y, s });
  writeFileSync(new URL(`../../public/icons/${file}`, import.meta.url), Buffer.from(png.split(',')[1], 'base64'));
}
await browser.close();
