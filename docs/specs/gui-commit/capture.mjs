// Pictures of the End Turn commit moment, from the built site (npm run build first).
//   PLAYABLE_OUT=<folder> node docs/specs/gui-commit/capture.mjs [prefix]
// Writes <prefix>-<width>-strip.png (5 frames after the tap) and <prefix>-<width>-rest.png for 1280x800 and 390x844.
// The page runs on Playwright's clock, so each frame is at a known time after the tap.
import { preview } from 'vite';
import sharp from 'sharp';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { env, launch } from '../../../tools/lib/checks.mjs';

const [prefix = 'commit'] = process.argv.slice(2);
const out = env('PLAYABLE_OUT');
const FEN = '4k3/3p4/8/8/3R4/8/8/4K3 w - - 0 1';
const save = { back: '', fen: FEN, moves: [], white: 'human', black: 'ai', rules: { kings: [null, null], hands: [[], []] }, pace: 'normal', sound: false };
const FRAMES = [0, 100, 190, 300, 430];

const server = await preview({ logLevel: 'silent', preview: { host: '127.0.0.1', port: 0, open: false } });
const base = server.resolvedUrls.local[0];
const browser = await launch();
async function until(page, test) {
  for (let i = 0; i < 400; i++) { if (await page.evaluate(test)) return; await page.clock.runFor(50); await page.waitForTimeout(10); }
  throw new Error(`timeout: ${test}`);
}
async function sheet(files, target) {
  const parts = await Promise.all(files.map(async file => ({ file, ...await sharp(file).metadata() })));
  let at = 0;
  const composite = parts.map(p => { const place = { input: p.file, left: at, top: 0 }; at += p.width + 8; return place; });
  await sharp({ create: { width: at - 8, height: Math.max(...parts.map(p => p.height)), channels: 3, background: '#3a2f22' } }).composite(composite).png().toFile(target);
  await Promise.all(files.map(file => rm(file)));
}
try {
  for (const [width, height] of [[1280, 800], [390, 844]]) {
    const page = await browser.newPage({ viewport: { width, height }, colorScheme: 'light', reducedMotion: 'no-preference', hasTouch: width < 1000 });
    await page.clock.install();
    await page.addInitScript(s => {
      sessionStorage.setItem('kingdown.title-seen', '1');
      localStorage.setItem('kingdown.solo-launch-seen', '1');
      localStorage.setItem('kingdown.save', s);
    }, JSON.stringify(save));
    await page.goto(`${base}next.html`);
    await until(page, () => [...document.querySelectorAll('button')].find(b => b.textContent?.trim() === 'Continue' && b.checkVisibility()));
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await until(page, () => document.querySelector('.play-game:has(.play-grid:not([inert]))'));
    await page.clock.runFor(2500);
    // Stage the rook d4 to d5, let the board settle, then tap End turn on a paused clock.
    for (const square of [27, 35]) { await page.locator(`.play-square[data-square="${square}"]`).click(); await page.clock.runFor(900); }
    // The frame takes the reading area and the turn controls: from the turn text to End turn.
    const top = await page.locator('.play-reader').boundingBox(), end = await page.locator('.play-turn').boundingBox();
    const clip = { x: Math.min(top.x, end.x) - 12, y: top.y - 8, width: Math.max(top.width, end.width) + 24 };
    clip.height = end.y + end.height + 12 - clip.y;
    await page.clock.pauseAt(await page.evaluate(() => Date.now() + 50));
    await page.locator('.play-turn [data-turn-state]').click();
    const frames = [];
    for (const [i, ms] of FRAMES.entries()) {
      await page.clock.runFor(ms - (FRAMES[i - 1] ?? 0) || 1);
      frames.push(join(out, `.${prefix}-${width}-${i}.png`));
      await page.screenshot({ path: frames.at(-1), clip });
    }
    await sheet(frames, join(out, `${prefix}-${width}-strip.png`));
    await page.clock.runFor(1200);
    await page.screenshot({ path: join(out, `${prefix}-${width}-rest.png`) });
    await page.close();
  }
} finally {
  await browser.close();
  await server.close();
}
