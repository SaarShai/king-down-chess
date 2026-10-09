// UX review capture: every screen at five sizes, plus visible text per screen.
// node docs/specs/web-ux/capture.mjs <base-url> <out-dir> [sizes]  (desktop,laptop,tablet,phone,landscape)
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://localhost:5173/';
const out = process.argv[3];
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const errors = [];
const texts = {};

const SAVE = { back: 'SQBKRSML', fen: '', moves: ['e2-e4', 'e7-e5', 'g1-f3', 'b8-c6'], white: 'human', black: 'ai', sound: false, skill: 'club' };
const sizes = {
  desktop: { width: 1440, height: 900 },
  laptop: { width: 1280, height: 720 },
  tablet: { width: 820, height: 1180, hasTouch: true, isMobile: true },
  phone: { width: 390, height: 844, hasTouch: true, isMobile: true },
  landscape: { width: 844, height: 390, hasTouch: true, isMobile: true },
};
const only = process.argv[4]?.split(',');

async function open(kind, { title = false, save = SAVE, query = '' } = {}) {
  const { width, height, ...rest } = sizes[kind];
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, ...rest });
  await ctx.addInitScript(([s, keepTitle]) => {
    if (!keepTitle) sessionStorage.setItem('kingdown.title-seen', '1');
    if (s && !localStorage.getItem('kingdown.seeded')) { localStorage.setItem('kingdown.save', JSON.stringify(s)); localStorage.setItem('kingdown.seeded', '1'); }
    localStorage.setItem('kingdown.seeded', '1');
  }, [save, title]);
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(`${kind}: ${e.message}`));
  page.on('dialog', d => d.accept());
  await page.goto(base + query);
  return page;
}
const ready = page => page.waitForFunction(() => window.view?.ready, null, { timeout: 30000 }).then(() => page.evaluate(() => window.view.ready()));
const settle = (page, ms = 700) => page.waitForTimeout(ms);
const tap = async (page, sq) => { const p = await page.evaluate(s => window.view.screenOf(s), sq); await page.mouse.click(p.x, p.y); };
async function shot(page, name, kind, sel) {
  await page.screenshot({ path: `${out}/${name}-${kind}.png` });
  const t = await page.evaluate(s => {
    const d = document.querySelector('dialog[open]:not(#title-screen)') ?? document.querySelector('dialog[open]');
    const el = s ? document.querySelector(s) : d ?? document.body;
    return el ? el.innerText : '';
  }, sel ?? null);
  texts[`${name}-${kind}`] = t;
  // If an open dialog scrolls, capture its bottom too.
  const scrolls = await page.evaluate(() => {
    const d = document.querySelector('dialog[open]');
    if (!d) return false;
    const sc = [d, ...d.querySelectorAll('*')].find(e => e.scrollHeight > e.clientHeight + 40 && getComputedStyle(e).overflowY !== 'visible' && getComputedStyle(e).overflowY !== 'hidden');
    if (!sc) return false;
    sc.scrollTop = sc.scrollHeight; return true;
  });
  if (scrolls) { await settle(page, 300); await page.screenshot({ path: `${out}/${name}-${kind}-end.png` }); }
  // Pages that scroll (no dialog): full page too.
  const tall = await page.evaluate(() => !document.querySelector('dialog[open]') && document.documentElement.scrollHeight > innerHeight + 20);
  if (tall) await page.screenshot({ path: `${out}/${name}-${kind}-full.png`, fullPage: true });
}
const step = async (label, fn) => { try { await fn(); } catch (e) { errors.push(`${label}: ${e.message.split('\n')[0]}`); } };

for (const kind of Object.keys(sizes)) {
  if (only && !only.includes(kind)) continue;
  await step(`${kind} title-first`, async () => {
    const page = await open(kind, { title: true, save: null });
    await ready(page); await settle(page, 2500);
    await shot(page, '01-title-first', kind);
    // First-visit Play: what comes next?
    await page.click('#title-play'); await settle(page, 1200);
    await shot(page, '02-after-title-play', kind);
    await page.context().close();
  });
  await step(`${kind} title-returning`, async () => {
    const page = await open(kind, { title: true });
    await ready(page); await settle(page, 2500);
    await shot(page, '03-title-returning', kind);
    await page.context().close();
  });
  await step(`${kind} game`, async () => {
    const page = await open(kind);
    await ready(page); await settle(page);
    await shot(page, '04-game-idle', kind);
    await tap(page, 11); await settle(page);
    await shot(page, '05-game-selected', kind);
    await page.keyboard.press('Escape');
    await page.click('#hint'); await settle(page, 2500);
    await shot(page, '06-game-hint', kind);
    await page.click('#settings-btn'); await page.check('#threats'); await page.keyboard.press('Escape');
    await settle(page); await shot(page, '07-game-threats', kind);
    await page.click('#settings-btn'); await page.uncheck('#threats'); await page.keyboard.press('Escape');
    // Review: open the first move in the list
    await step(`${kind} review`, async () => {
      await page.locator('#moves li').first().locator('button, a, span').first().click(); await settle(page);
      await shot(page, '08-game-review', kind);
      await page.keyboard.press('Escape'); await settle(page, 300);
    });
    for (const [btn, dlg] of [['#new-game-btn', '10-new-game'], ['#settings-btn', '14-settings'], ['#rules-btn', '15-guide']]) {
      await page.click(btn); await settle(page); await shot(page, dlg, kind);
      if (dlg === '10-new-game') {
        await page.click('label:has(#mode-powers)'); await settle(page); await shot(page, '11-new-game-powers', kind);
        await page.click('label:has(#mode-two)'); await settle(page); await shot(page, '12-new-game-two', kind);
        await page.click('label:has(#mode-computer)'); await page.click('#more-options summary'); await settle(page); await shot(page, '13-new-game-more', kind);
      }
      await page.keyboard.press('Escape'); await settle(page, 300);
    }
    await page.click('#rules-btn'); await page.click('#learn'); await settle(page, 1200);
    await shot(page, '16-lesson', kind);
    await page.context().close();
  });
  await step(`${kind} powers`, async () => {
    const page = await open(kind);
    await ready(page); await settle(page);
    await page.click('#new-game-btn'); await page.click('label:has(#mode-powers)');
    await page.click('#pick-0 .emblem[data-king="Frost"]'); await settle(page, 300);
    await shot(page, '11b-new-game-frost', kind);
    await page.click('#start-game'); await ready(page); await settle(page, 1500);
    await shot(page, '17-powers-game', kind);
    await page.click('#power-btn', { timeout: 5000 }); await settle(page);
    await shot(page, '18-powers-armed', kind);
    await page.context().close();
  });
  await step(`${kind} two`, async () => {
    const page = await open(kind);
    await ready(page); await settle(page);
    await page.click('#new-game-btn'); await page.click('label:has(#mode-two)');
    await page.click('#start-game'); await ready(page); await settle(page, 1200);
    await tap(page, 12); await tap(page, 28); await settle(page, 1500);
    await shot(page, '19-two-players', kind);
    await page.context().close();
  });
  await step(`${kind} workshop`, async () => {
    const page = await open(kind);
    await ready(page); await settle(page);
    await page.click('#workshop-btn'); await settle(page, 2500);
    await shot(page, '20-workshop', kind);
    await page.context().close();
  });
  await step(`${kind} promotion`, async () => {
    const page = await open(kind, { query: '?fen=' + encodeURIComponent('7k/P7/8/8/8/8/8/K7 w - - 0 1') });
    await ready(page); await tap(page, 48); await tap(page, 56);
    await page.locator('#promo').waitFor({ state: 'visible' }); await settle(page);
    await shot(page, '21-promotion', kind); await page.context().close();
  });
  await step(`${kind} push`, async () => {
    const page = await open(kind, { query: '?fen=' + encodeURIComponent('7k/8/8/2p5/2O5/8/P7/K7 w - - 0 1') });
    await ready(page); await tap(page, 26); await tap(page, 34);
    await page.locator('#move-choice').waitFor({ state: 'visible' }); await settle(page);
    await shot(page, '22-capture-or-push', kind); await page.context().close();
  });
  await step(`${kind} result`, async () => {
    const page = await open(kind);
    await ready(page);
    await page.click('#resign');
    await page.locator('#over').waitFor({ state: 'visible' }); await page.waitForTimeout(1800);
    await shot(page, '23-result', kind); await page.context().close();
  });
  if (kind === 'desktop') await step(`${kind} clay`, async () => {
    const page = await open(kind, { query: '?look=clay' });
    await ready(page); await settle(page, 2000);
    await tap(page, 11); await settle(page);
    await shot(page, '24-clay-selected', kind); await page.context().close();
  });
}
await browser.close();
writeFileSync(`${out}/texts.json`, JSON.stringify(texts, null, 1));
writeFileSync(`${out}/errors.json`, JSON.stringify(errors, null, 1));
console.log(`done; ${errors.length} errors`);
for (const e of errors) console.log(' ', e);
