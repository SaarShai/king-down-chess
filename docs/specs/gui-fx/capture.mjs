// Pictures of the board marks and of the capture beat, from the built site (npm run build first).
//   PLAYABLE_OUT=<folder> node docs/specs/gui-fx/capture.mjs marks <name>   two selected pieces, one on each tile tone
//   PLAYABLE_OUT=<folder> node docs/specs/gui-fx/capture.mjs capture        a melee and an Archer capture, 6 frames each
// The page runs on Playwright's clock, so each frame is at a known time after the capture contact.
import { preview } from 'vite';
import sharp from 'sharp';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { env, launch } from '../../../tools/lib/checks.mjs';

const [mode = 'marks', name = 'marks'] = process.argv.slice(2);
const out = env('PLAYABLE_OUT');
// Light-square figures and targets on both tones: rook d4 (dark), rook b3 (light), black pawn d7 (light), black knight h4 (dark).
const MARKS = '4k3/3p4/8/8/3R3n/1R6/8/4K3 w - - 0 1';
// Melee: the rook on d4 takes the pawn on d7. Ranged: the Archer on d4 shoots the pawn on d6.
const CAPTURES = { melee: ['4k3/3p4/8/8/3R4/8/8/4K3 w - - 0 1', 27, 51], archer: ['4k3/8/3p4/8/3A4/8/8/4K3 w - - 0 1', 27, 43] };
const save = fen => ({ back: '', fen, moves: [], white: 'human', black: 'ai', rules: { kings: [null, null], hands: [[], []] }, pace: 'normal', sound: false });

const server = await preview({ logLevel: 'silent', preview: { host: '127.0.0.1', port: 0, open: false } });
const base = server.resolvedUrls.local[0];
const browser = await launch();
async function open(fen, [width, height]) {
  const page = await browser.newPage({ viewport: { width, height }, colorScheme: 'light', reducedMotion: 'no-preference', hasTouch: width < 1000 });
  await page.clock.install();
  await page.addInitScript(s => {
    sessionStorage.setItem('kingdown.title-seen', '1');
    localStorage.setItem('kingdown.solo-launch-seen', '1');
    localStorage.setItem('kingdown.save', s);
  }, JSON.stringify(save(fen)));
  await page.goto(`${base}next.html`);
  await until(page, () => [...document.querySelectorAll('button')].find(b => b.textContent?.trim() === 'Continue' && b.checkVisibility()));
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await until(page, () => document.querySelector('.play-game:has(.play-grid:not([inert]))'));
  await page.clock.runFor(2500);
  return page;
}
async function until(page, test) {
  for (let i = 0; i < 400; i++) { if (await page.evaluate(test)) return; await page.clock.runFor(50); await page.waitForTimeout(10); }
  throw new Error(`timeout: ${test}`);
}
const box = (page, square) => page.locator(`.play-square[data-square="${square}"]`).boundingBox();
const tap = async (page, square) => { await page.locator(`.play-square[data-square="${square}"]`).click(); await page.clock.runFor(600); };
// Join pictures side by side (x) or one under the other (y).
async function sheet(files, target, axis) {
  const parts = await Promise.all(files.map(async file => ({ file, ...await sharp(file).metadata() })));
  const width = axis === 'x' ? parts.reduce((n, p) => n + p.width, 0) : Math.max(...parts.map(p => p.width));
  const height = axis === 'x' ? Math.max(...parts.map(p => p.height)) : parts.reduce((n, p) => n + p.height, 0);
  let at = 0;
  const composite = parts.map(p => { const place = { input: p.file, left: axis === 'x' ? at : 0, top: axis === 'x' ? 0 : at }; at += axis === 'x' ? p.width : p.height; return place; });
  await sharp({ create: { width, height, channels: 3, background: '#f5f0e4' } }).composite(composite).png().toFile(target);
  await Promise.all(files.map(file => rm(file)));
}

try {
  if (mode === 'marks') {
    const page = await open(MARKS, [1280, 800]);
    const board = await page.locator('.play-grid').boundingBox();
    const parts = [];
    for (const square of [27, 17]) {
      await tap(page, square);
      parts.push(join(out, `.${name}-${square}.png`));
      await page.screenshot({ path: parts.at(-1), clip: board });
      await tap(page, square);
    }
    // Empty tiles for the tone samples: a5 (dark) and b5 (light), the middle 40% of each.
    const tiles = {};
    for (const [tone, square] of [['dark', 32], ['light', 33]]) {
      const b = await box(page, square);
      tiles[tone] = { x: b.x - board.x + b.width * .3, y: b.y - board.y + b.height * .3, size: b.width * .4 };
    }
    await sheet(parts, join(out, `${name}.png`), 'y');
    console.log(JSON.stringify(tiles));
  } else {
    for (const [kind, [fen, from, to]] of Object.entries(CAPTURES)) for (const size of [[1280, 800], [390, 844]]) {
      const page = await open(fen, size);
      await tap(page, from); await tap(page, to);
      await page.getByRole('button', { name: /End turn/ }).first().click();
      const target = await box(page, to), start = await box(page, from), t = target.width;
      const clip = { x: Math.max(0, Math.min(target.x, start.x) - t), y: Math.max(0, Math.min(target.y, start.y) - 1.6 * t), width: Math.abs(target.x - start.x) + 3 * t, height: Math.abs(target.y - start.y) + 3.2 * t };
      // Contact: the first frame where the effect layer paints inside the struck square.
      await until(page, ({ x, y, width, height }) => {
        const fx = document.querySelector('canvas.daylight-fx'), k = fx ? fx.width / innerWidth : 1;
        const data = fx?.getContext('2d').getImageData(x * k, y * k, width * k, height * k).data;
        return data?.some((v, i) => i % 4 === 3 && v > 0);
      }, target).catch(() => { throw new Error(`${kind}: no beat at the contact`); });
      const frames = [];
      // 0 and 30 ms: the hold (rim light). Then the beat on the effect clock after the hold.
      for (const [i, step] of [0, 30, 50, 60, 70, 80].entries()) {
        if (step) await page.clock.runFor(step === 30 ? 30 : step);
        frames.push(join(out, `.fx-${kind}-${size[0]}-${i}.png`));
        await page.screenshot({ path: frames.at(-1), clip });
      }
      await sheet(frames, join(out, `fx-capture-${kind}-${size[0]}.png`), 'x');
      await page.close();
    }
  }
} finally {
  await browser.close();
  await server.close();
}
