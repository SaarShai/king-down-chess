// Before/after screenshots for the visual design pass (docs/visual-design/README.md).
// node docs/visual-design/shots.mjs <base-url> <before|after>   (PLAYABLE_BROWSER=chromium in cloud sessions)
// Writes docs/visual-design/<label>/<view>-<desktop|phone>.png at 1280×900 and 390×844.
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://127.0.0.1:5189/';
const label = process.argv[3] ?? 'after';
const out = fileURLToPath(new URL(`./${label}/`, import.meta.url));
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: process.env.PLAYABLE_BROWSER || 'chrome' });
const errors = [];

const SAVE = { back: 'SQBKRSML', fen: '', moves: ['e2-e4', 'e7-e5', 'g1-f3'], white: 'human', black: 'ai', sound: false, skill: 'club' };
const sizes = { desktop: { width: 1280, height: 900 }, phone: { width: 390, height: 844, hasTouch: true, isMobile: true } };

async function open(kind, { title = false, save = SAVE, query = '' } = {}) {
  const { width, height, ...rest } = sizes[kind];
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, ...rest });
  await ctx.addInitScript(([s, keepTitle]) => {
    if (!keepTitle) sessionStorage.setItem('kingdown.title-seen', '1');
    if (s && !localStorage.getItem('kingdown.seeded')) { localStorage.setItem('kingdown.save', JSON.stringify(s)); localStorage.setItem('kingdown.seeded', '1'); }
  }, [save, title]);
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(`${kind}: ${e.message}`));
  page.on('dialog', d => d.accept());
  await page.goto(base + query);
  return page;
}
const ready = page => page.waitForFunction(() => window.view?.ready).then(() => page.evaluate(() => window.view.ready()));
const settle = page => page.waitForTimeout(500);
const tap = async (page, sq) => { const p = await page.evaluate(s => window.view.screenOf(s), sq); await page.mouse.click(p.x, p.y); };
const shot = (page, name, kind) => page.screenshot({ path: `${out}${name}-${kind}.png` });

for (const kind of Object.keys(sizes)) {
  // Title (after) — the first thing a new player sees; "before" has none, so it shows the first load.
  let page = await open(kind, { title: true, save: null });
  await ready(page); await settle(page);
  await shot(page, 'title', kind); await page.context().close();

  // Title for a returning player (a saved game: Continue leads).
  page = await open(kind, { title: true });
  await ready(page); await settle(page);
  if (await page.locator('#title-screen[open]').count()) await shot(page, 'title-returning', kind);
  await page.context().close();

  page = await open(kind);
  await ready(page);
  await page.waitForFunction(() => document.querySelector('#title-screen[open]') == null || !document.querySelector('#title-screen'));
  await tap(page, 11); await settle(page); // select the d2 piece
  await shot(page, 'game', kind);
  await page.keyboard.press('Escape');
  if (await page.locator('#threats').count()) {
    await page.click('#settings-btn'); await page.check('#threats'); await page.keyboard.press('Escape');
    await settle(page); await shot(page, 'threats', kind);
  }
  for (const [btn, dlg] of [['#new-game-btn', 'new-game'], ['#settings-btn', 'settings'], ['#rules-btn', 'guide']]) {
    await page.click(btn); await settle(page); await shot(page, dlg, kind);
    await page.keyboard.press('Escape');
  }
  await page.click('#rules-btn'); await page.click('#learn'); await settle(page);
  await shot(page, 'lesson', kind);
  await page.context().close();

  // Promotion
  page = await open(kind, { query: '?fen=' + encodeURIComponent('7k/P7/8/8/8/8/8/K7 w - - 0 1') });
  await ready(page); await tap(page, 48); await tap(page, 56);
  await page.locator('#promo').waitFor({ state: 'visible' }); await settle(page);
  await shot(page, 'promotion', kind); await page.context().close();

  // Capture or push
  page = await open(kind, { query: '?fen=' + encodeURIComponent('7k/8/8/2p5/2O5/8/P7/K7 w - - 0 1') });
  await ready(page);
  await tap(page, 26); await tap(page, 34);
  await page.locator('#move-choice').waitFor({ state: 'visible' }); await settle(page);
  await shot(page, 'capture-or-push', kind); await page.context().close();

  // Result dialog after a resignation
  page = await open(kind);
  await ready(page);
  await page.click('#resign');
  await page.locator('#over').waitFor({ state: 'visible' }); await page.waitForTimeout(1500);
  await shot(page, 'result', kind); await page.context().close();
}
await browser.close();
if (errors.length) { console.error(errors); process.exit(1); }
console.log(`screenshots in ${out}`);
