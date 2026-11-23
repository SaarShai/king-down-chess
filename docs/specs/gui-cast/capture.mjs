// Pictures of the card cast beat, one card for each family, from the built site (npm run build first).
//   PLAYABLE_OUT=<folder> node docs/specs/gui-cast/capture.mjs
// Writes cast-<family>-1280-strip.png (4 frames after the beat starts, 1280x800) and cast-390-sheet.png (the
// middle frame of each family, 390x844). The page runs on Playwright's clock, so each frame is at a known time.
import { preview } from 'vite';
import sharp from 'sharp';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { build } from 'esbuild';
import { env, launch } from '../../../tools/lib/checks.mjs';

const out = env('PLAYABLE_OUT');
// A save opens only with the page's own card rules.
const { outputFiles: [bundle] } = await build({ stdin: { resolveDir: process.cwd(), contents: `export { POWERS_BALANCED } from './src/rules/rules.ts';` }, bundle: true, platform: 'node', format: 'esm', write: false });
const { POWERS_BALANCED } = await import('data:text/javascript;base64,' + Buffer.from(bundle.contents).toString('base64'));
// Each family: a released card, a position (White plays) and the squares to tap after the card is armed (then a
// choice button). No released card is in the rule family (Mirror plays the copied card's beat), so it has no picture.
const FAMILIES = [
  ['shift', 'Strike', '4k3/8/8/8/8/8/8/R3K3 w - - 0 1', [0, 36]],
  ['trade', 'SkyLift', '4k3/8/8/8/8/8/8/R2BK3 w - - 0 1', [0, 3]],
  ['ward', 'Freeze', '4k3/3p4/8/8/8/8/8/4K3 w - - 0 1', [51]],
  ['change', 'MorphP', '4k3/8/8/8/8/8/4P3/4K3 w - - 0 1', [12], 'Knight'],
  ['quake', 'EarthQuake', '4k2p/8/8/8/3n4/8/7P/4K3 w - - 0 1', [28]],
];
const FRAMES = [40, 150, 230, 360];

const server = await preview({ logLevel: 'silent', preview: { host: '127.0.0.1', port: 0, open: false } });
const base = server.resolvedUrls.local[0];
const browser = await launch();
async function until(page, test, step = 50) {
  for (let i = 0; i < 400; i++) { if (await page.evaluate(test)) return; await page.clock.runFor(step); await page.waitForTimeout(25); }
  await page.screenshot({ path: join(out, ".cast-timeout.png") }); throw new Error(`timeout: ${test}`);
}
// Stop the clock just before the tap that stages the card: the frames then come at known times.
const pause = async page => { await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000)); };
async function sheet(files, target) {
  const parts = await Promise.all(files.map(async file => ({ file, ...await sharp(file).metadata() })));
  let at = 0;
  const composite = parts.map(p => { const place = { input: p.file, left: at, top: 0 }; at += p.width + 8; return place; });
  await sharp({ create: { width: at - 8, height: Math.max(...parts.map(p => p.height)), channels: 3, background: '#3a2f22' } }).composite(composite).png().toFile(target);
  await Promise.all(files.map(file => rm(file)));
}
// The effect layer shows something: the beat has started.
const painted = () => {
  const canvas = document.querySelector('canvas.daylight-fx');
  if (!canvas?.width) return false;
  const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
  for (let i = 3; i < data.length; i += 64) if (data[i]) return true;
  return false;
};
const middles = [];
try {
  for (const [width, height] of [[1280, 800], [390, 844]]) for (const [family, card, fen, taps, pick] of FAMILIES) {
    const save = { back: '', fen, moves: [], white: 'human', black: 'ai', pace: 'normal', sound: false,
      rules: { ...POWERS_BALANCED, kings: [null, null], hands: [[card], []] } };
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
    await page.locator('.play-own .play-card').first().click();
    await page.clock.runFor(300);
    for (const [i, square] of taps.entries()) {
      if (i === taps.length - 1 && !pick) await pause(page);
      await page.locator(`.play-square[data-square="${square}"]`).click();
      if (i < taps.length - 1 || pick) await page.clock.runFor(300);
    }
    if (pick) {
      await pause(page);
      await page.getByRole('button', { name: pick }).first().click();
    }
    await until(page, painted, 16);
    const clip = width > 1000 ? await page.locator('.play-board').boundingBox() : undefined;
    const frames = [];
    for (const [i, ms] of FRAMES.entries()) {
      await page.clock.runFor(ms - (FRAMES[i - 1] ?? 0));
      frames.push(join(out, `.cast-${family}-${width}-${i}.png`));
      await page.screenshot({ path: frames.at(-1), ...clip && { clip } });
    }
    if (width > 1000) await sheet(frames, join(out, `cast-${family}-1280-strip.png`));
    else { middles.push(frames[2]); await Promise.all(frames.filter(file => file !== frames[2]).map(file => rm(file))); }
    await page.close();
  }
  await sheet(middles, join(out, 'cast-390-sheet.png'));
} finally {
  await browser.close();
  await server.close();
}
