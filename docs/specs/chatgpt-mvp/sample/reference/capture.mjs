// Ticket 02: capture the web game on main as the reference for the sample.
// Serve a production build of origin/main (a detached worktree: npm run build, then npm run preview), then:
//   node docs/specs/chatgpt-mvp/sample/reference/capture.mjs <base-url>     (from the worktree root)
// It writes <state>-<size>.png beside this file: phone 390×844 (touch, DPR 2) and desktop 1440×900.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { endTurn, openMenu, readyBoard } from '../../../../../tools/app-ui.mjs';
import { setUpGame } from '../../../../../tools/new-game-ui.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const base = process.argv[2] ?? 'http://127.0.0.1:4173/';
const SIZES = {
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
};
const save = { back: 'QRNAKBBS', fen: '', moves: ['e2-e4', 'e7-e5', 'g1-f3', 'b8-c6'], white: 'human', black: 'ai', skill: 'club', sound: false };
const end = { back: '', white: 'human', black: 'human', sound: false, skill: 'beginner', fen: '7k/6pp/8/8/8/p7/8/R5MK w - - 0 1', moves: ['Ra1xa3', 'Kh8-g8', 'Mg1<>h1', 'Kg8-h8'] };
const rest = page => page.waitForFunction(() => !window.view.scene.animating && document.getElementById('end-turn').getAttribute('aria-disabled') === 'false');
const STATES = [
  { name: 'title', title: true, wait: '#title-screen[open]' },
  { name: 'home', title: true, save, wait: '#home-main' },
  { name: 'new-game-computer', save, steps: page => setUpGame(page, { mode: 'computer', army: null }) },
  { name: 'new-game-powers', save, steps: page => setUpGame(page, { mode: 'powers', army: null }) },
  { name: 'menu', save, steps: page => openMenu(page) },
  { name: 'settings', save, steps: async page => { await openMenu(page); await page.click('[data-go="help"]'); } },
  { name: 'board-powers', save: { ...save, black: 'human' }, query: '?kings=mud:march,shadow:darkness' },
  { name: 'ceremony', save: end, steps: async (page, tap) => {
    await tap(16); await tap(56); await rest(page); await endTurn(page);
    await page.locator('#over').waitFor({ state: 'visible' }); await page.waitForTimeout(1500);
  } },
];

const browser = await chromium.launch();
for (const [size, opts] of Object.entries(SIZES)) for (const s of STATES) {
  const ctx = await browser.newContext({ ...opts, reducedMotion: 'reduce' });
  await ctx.addInitScript(([save, title]) => {
    if (!title) sessionStorage.setItem('kingdown.title-seen', '1');
    if (sessionStorage.getItem('ref.seeded')) return;
    sessionStorage.setItem('ref.seeded', '1');
    if (save) localStorage.setItem('kingdown.save', JSON.stringify({ ...save, pace: 'off' }));
  }, [s.save ?? null, s.title ?? false]);
  const page = await ctx.newPage();
  const tap = async sq => {
    const p = await page.evaluate(q => window.view.screenOf(q), sq);
    if (opts.hasTouch) await page.touchscreen.tap(p.x, p.y); else await page.mouse.click(p.x, p.y);
  };
  await page.goto(new URL(s.query ?? '', base).href);
  if (s.wait) await page.locator(s.wait).first().waitFor({ state: 'visible' });
  else await readyBoard(page);
  await s.steps?.(page, tap);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);
  await page.screenshot({ path: join(here, `${s.name}-${size}.png`) });
  console.log(`${s.name}-${size}`);
  await ctx.close();
}
await browser.close();
