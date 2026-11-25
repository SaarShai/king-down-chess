// Pictures of the check lines and the checkmate hold, from the built site (npm run build first).
//   PLAYABLE_OUT=<folder> node docs/specs/gui-check/capture.mjs [probe]
// Writes check-<width>.png (a queen check on a light square, a double check on a dark square, after a reload)
// and mate-<width>-strip.png (5 frames after the mating move) for 1280x800 and 390x844.
// The page runs on Playwright's clock, so each frame is at a known time after the move.
import { preview } from 'vite';
import sharp from 'sharp';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { env, launch } from '../../../tools/lib/checks.mjs';

const probe = process.argv[2] === 'probe';
const out = env('PLAYABLE_OUT');
const saveOf = fen => JSON.stringify({ back: '', fen, moves: [], white: 'human', black: 'ai', rules: { kings: [null, null], hands: [[], []] }, pace: 'normal', sound: false });
// The black queen on h5 checks the white king on d1 (a light square); the black rook e8 and knight d3 check e1 (dark).
const CHECKS = ['4k3/8/8/7q/8/8/8/3K4 w - - 0 1', '4r1k1/8/8/8/8/3n4/8/4K3 w - - 0 1'];
// Ra1-a8 mates the black king on g8.
const MATE = '6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1';
const FRAMES = [0, 150, 300, 450, 600];

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
async function open(width, height, fen) {
  const page = await browser.newPage({ viewport: { width, height }, colorScheme: 'light', reducedMotion: 'no-preference', hasTouch: width < 1000 });
  await page.clock.install();
  await page.addInitScript(s => {
    sessionStorage.setItem('kingdown.title-seen', '1');
    localStorage.setItem('kingdown.solo-launch-seen', '1');
    localStorage.setItem('kingdown.save', s);
  }, saveOf(fen));
  await page.goto(`${base}next.html`);
  await until(page, () => [...document.querySelectorAll('button')].find(b => b.textContent?.trim() === 'Continue' && b.checkVisibility()));
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await until(page, () => document.querySelector('.play-game:has(.play-grid:not([inert]))'));
  await page.clock.runFor(2500);
  return page;
}
const boardClip = async page => { const b = await page.locator('.play-grid').boundingBox(); return { x: b.x - 6, y: b.y - 6, width: b.width + 12, height: b.height + 12 }; };
try {
  for (const [width, height] of [[1280, 800], [390, 844]]) {
    if (!probe) {
      const shots = [];
      for (const [i, fen] of CHECKS.entries()) {
        const page = await open(width, height, fen);
        shots.push(join(out, `.check-${width}-${i}.png`));
        await page.screenshot({ path: shots.at(-1), clip: await boardClip(page) });
        await page.close();
      }
      await sheet(shots, join(out, `check-${width}.png`));
    }
    const page = await open(width, height, MATE);
    const clip = await boardClip(page);
    await page.locator('.play-square[data-square="0"]').click(); await page.clock.runFor(900);
    await page.locator('.play-square[data-square="56"]').click(); await page.clock.runFor(1500);
    await page.clock.pauseAt(await page.evaluate(() => Date.now() + 50));
    await page.locator('.play-turn [data-turn-state]').click();
    const frames = [];
    let t = 0;
    for (const ms of probe ? [0, 100, 200, 300, 400, 500, 600, 700, 800, 1000, 1200, 1400, 1600, 2000] : FRAMES) {
      await page.clock.runFor(ms - t || 1); t = ms;
      const state = await page.evaluate(() => ({ result: !!document.querySelector('.play-result')?.checkVisibility(), reading: document.querySelector('.play-game')?.dataset.reading, skip: !!document.querySelector('.play-sequence-skip') }));
      if (probe) console.log(width, ms, JSON.stringify(state));
      else { frames.push(join(out, `.mate-${width}-${frames.length}.png`)); await page.screenshot({ path: frames.at(-1), clip: width < 1000 ? undefined : { x: 0, y: 0, width: 820, height } }); }
    }
    if (!probe) await sheet(frames, join(out, `mate-${width}-strip.png`));
    await page.close();
  }
} finally {
  await browser.close();
  await server.close();
}
