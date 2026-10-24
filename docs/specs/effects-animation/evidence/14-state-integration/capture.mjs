// Capture the real game and its renderer on a private local server. No user's browser tab is used.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createServer } from 'vite';
import { launch } from '../../../../../tools/lib/checks.mjs';
import { readPower, usePower, readyBoard, startLesson } from '../../../../../tools/app-ui.mjs';
const out = resolve(process.env.PLAYABLE_OUT || '/tmp/effects-state-game');
mkdirSync(out, { recursive: true });
const server = await createServer({ root: process.cwd(), server: { host: '127.0.0.1', port: 0, strictPort: true }, logLevel: 'error' });
let browser;
const errors = [], images = [];
try {
  await server.listen();
  const url = server.resolvedUrls.local[0];
  browser = await launch();
  const page = await browser.newPage({ viewport: { width: 430, height: 932 }, hasTouch: true });
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => sessionStorage.setItem('kingdown.title-seen', '1'));
  await page.goto(url);
  await readyBoard(page);
  const fen = '4k3/p7/8/3n4/8/8/P7/4K3 w - - 0 1';
  await page.evaluate(fen => localStorage.setItem('kingdown.save', JSON.stringify({ fen, back: '', moves: [], white: 'human', black: 'human', sound: false, pace: 'normal' })), fen);
  await page.goto(`${url}?kings=frost:freeze,none&fen=${encodeURIComponent(fen)}&players=human,human`);
  await readyBoard(page);
  await readPower(page, 'w'); await usePower(page);
  const target = await page.evaluate(() => window.view.screenOf(35));
  await page.touchscreen.tap(target.x, target.y);
  await page.waitForFunction(() => window.view.stateEffects.frames.some(s => s.kind === 'freeze' && Number.isFinite(s.since) && performance.now() - s.since >= 1440));
  const capture = async name => { const path = `${out}/${name}.png`; await page.screenshot({ path, fullPage: true }); images.push(path); };
  await capture('early-freeze-430-white');
  for (const width of [430, 390]) for (const black of [false, true]) {
    await page.setViewportSize({ width, height: 932 });
    await page.evaluate(black => { window.view.setPace('off'); window.view.flip(black); }, black);
    await page.waitForFunction(() => !window.view.scene.animating);
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    await capture(`freeze-${width}-${black ? 'black' : 'white'}`);
  }
  for (const id of ['ward', 'firewall', 'firewall-moved', 'guard', 'holyLight', 'mercy', 'archer', 'swap', 'shove', 'check', 'rook']) {
    await page.evaluate(async id => {
      const { fixtures } = await import('/docs/specs/effects-animation/preview/signals/fixtures.ts');
      const f = fixtures[id === 'firewall-moved' ? 'firewall' : id];
      localStorage.setItem('kingdown.save', JSON.stringify({ fen: '', back: '', moves: [], white: 'human', black: 'human', sound: false, pace: 'off' }));
      const { toFen } = await import('/src/rules/setup.ts');
      localStorage.setItem('kingdown.save', JSON.stringify({ fen: toFen(f.before), back: '', moves: id === 'firewall-moved' ? ['!P', 'Ra2-d2'] : f.move && ['ward', 'firewall', 'guard', 'holyLight', 'mercy'].includes(id) ? [f.rules.toLan(f.before, f.move)] : [], rules: f.rules.rules, white: 'human', black: 'human', sound: false, pace: 'off' }));
    }, id);
    await page.goto(url); await readyBoard(page);
    const selected = { archer: 18, swap: 0, shove: 26, rook: 27 }[id];
    if (selected != null) {
      const point = await page.evaluate(sq => window.view.screenOf(sq), selected);
      await page.touchscreen.tap(point.x, point.y);
      if (id === 'rook') {
        const point = await page.evaluate(() => window.view.screenOf(35));
        await page.mouse.move(point.x, point.y);
      }
    }
    for (const width of [430, 390]) for (const black of [false, true]) {
      await page.setViewportSize({ width, height: 932 });
      await page.evaluate(black => window.view.flip(black), black);
      await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
      await capture(`${id}-${width}-${black ? 'black' : 'white'}`);
      if (id === 'guard') {
        await page.evaluate(async () => {
          const { symbols } = await import('/src/account-game/art.ts');
          const { typeOf, colorOf } = await import('/src/rules/engine.ts');
          const images = new Map();
          for (const value of window.view.pos.board) if (value && !images.has(value)) {
            const image = new Image(), name = window.view.context.nameOf(typeOf(value));
            image.src = symbols[`../../public/ui/icons/${name}.svg`][colorOf(value)];
            await image.decode(); images.set(value, image);
          }
          window.view.setSymbols(value => images.get(value));
        });
        await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
        await capture(`guard-symbols-${width}-${black ? 'black' : 'white'}`);
        await page.evaluate(() => window.view.setSymbols());
      }
    }
  }
  await startLesson(page, 'Beast');
  await page.locator('#show-me').click();
  await page.waitForFunction(() => window.view.marks.hint?.length > 1 && !document.getElementById('show-me').disabled);
  for (const width of [430, 390]) for (const black of [false, true]) {
    await page.setViewportSize({ width, height: 932 });
    await page.evaluate(black => window.view.flip(black), black);
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    await capture(`hint-${width}-${black ? 'black' : 'white'}`);
  }
  for (const group of ['signals', 'cards']) {
    await page.goto(`${url}docs/specs/effects-animation/preview/${group}/index.html`);
    await page.waitForFunction(() => window.effectsStudy?.ready);
  }
  writeFileSync(`${out}/capture.json`, JSON.stringify({ images, errors }, null, 2));
  console.log(JSON.stringify({ out, images: images.length, errors }, null, 2));
} finally { await browser?.close(); await server.close(); }
