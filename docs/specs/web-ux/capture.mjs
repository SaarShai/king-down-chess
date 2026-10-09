// Screenshots of the app for a review or a sample.
//
// The UX review: every screen at five sizes, plus the visible text of each screen.
//   node docs/specs/web-ux/capture.mjs <base-url> <out-dir> [sizes]  (desktop,laptop,tablet,phone,landscape)
//
// The sample of a web redesign step (spec rule 3 in docs/specs/web-redesign/spec.md):
//   SAMPLE=<NN> node docs/specs/web-ux/capture.mjs <base-url> [out-dir]
// It reads the state table docs/specs/web-redesign/samples/<NN>.mjs (the format is in samples/README.md),
// renders each state at the table's sizes with Motion Off, and checks each render: the app keeps every move
// of the seeded save, no sideways scroll, the state's controls inside the screen, and 44 px targets on a touch
// size. A state with `video: true` also gets one phone video of its steps, with Motion Normal. It writes
// <state>-<size>.png, <state>-phone.webm and report.json in the out folder (default <system temp
// folder>/kingdown-samples/<NN>; a folder inside the checkout is refused), and exits 1 when a check fails or a
// state cannot render. Copy the renders out of the out folder; never commit them.
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { boardHelp, lanMoves, moveRow, openMoves, pressMenu } from '../../../tools/app-ui.mjs';
import { insideViewport, isInside, launch, minTarget, noSidewaysScroll, trapErrors } from '../../../tools/lib/checks.mjs';

const base = process.argv[2] ?? 'http://localhost:5173/';
const sizes = {
  desktop: { width: 1440, height: 900 },
  laptop: { width: 1280, height: 720 },
  tablet: { width: 820, height: 1180, hasTouch: true, isMobile: true },
  phone: { width: 390, height: 844, hasTouch: true, isMobile: true },
  landscape: { width: 844, height: 390, hasTouch: true, isMobile: true },
};
const browser = await launch({ headless: true });
const ready = page => page.waitForFunction(() => window.view?.ready, null, { timeout: 30000 }).then(() => page.evaluate(() => window.view.ready()));
const settle = (page, ms = 700) => page.waitForTimeout(ms);

if (process.env.SAMPLE) await sample(process.env.SAMPLE, process.argv[3]);
else await review(process.argv[3], process.argv[4]?.split(','));

/** Renders the states of samples/<nn>.mjs and checks each render; see the header. */
async function sample(nn, out = join(tmpdir(), 'kingdown-samples', nn)) {
  const file = fileURLToPath(new URL(`../web-redesign/samples/${nn}.mjs`, import.meta.url));
  const stop = async message => { console.error(message); await browser.close(); process.exit(2); };
  if (!/^\d\d[a-z]?$/.test(nn) || !existsSync(file)) await stop(`capture: no sample "${nn}": SAMPLE names a file docs/specs/web-redesign/samples/<NN>.mjs`);
  const checkout = fileURLToPath(new URL('../../../', import.meta.url));
  if (isInside(checkout, out)) await stop(`capture: the out folder ${out} is inside the checkout ${checkout}; renders stay out of Git`);
  const table = (await import(pathToFileURL(file).href)).default;
  const unknown = (table.sizes ?? []).filter(s => !sizes[s]);
  if (unknown.length) throw new Error(`capture: sample ${nn}: unknown sizes ${unknown.join(', ')}; known: ${Object.keys(sizes).join(', ')}`);
  mkdirSync(out, { recursive: true });
  const report = [];
  for (const state of table.states) {
    for (const size of table.sizes ?? ['phone', 'desktop']) report.push(await render(state, size, false));
    if (state.video) report.push(await render(state, 'phone', true));
  }
  await browser.close();
  writeFileSync(join(out, 'report.json'), `${JSON.stringify({ sample: nn, base, renders: report }, null, 1)}\n`);
  const failed = report.filter(r => r.faults.length).length;
  console.log(`capture: sample ${nn}: ${report.length} renders, ${failed} with a fault; out folder ${out}`);
  process.exit(failed ? 1 : 0);

  /** One still of `state` at `size` with Motion Off, or (video) one video of its steps with Motion Normal. */
  async function render(state, size, video) {
    const { width, height, ...touch } = sizes[size];
    const ctx = await browser.newContext({
      viewport: { width, height }, deviceScaleFactor: size === 'phone' ? 2 : 1, ...touch,
      reducedMotion: video ? 'no-preference' : 'reduce', colorScheme: state.scheme ?? 'light',
      ...(video ? { recordVideo: { dir: join(out, '.video'), size: { width, height } } } : {}),
    });
    // A still has Motion Off: the seeded save says so, and with no save the app takes Off from reduced motion.
    await ctx.addInitScript(([save, title, pace]) => {
      if (!title) sessionStorage.setItem('kingdown.title-seen', '1');
      if (sessionStorage.getItem('sample.seeded')) return; // a reload in the steps keeps the game it made
      sessionStorage.setItem('sample.seeded', '1');
      if (save) localStorage.setItem('kingdown.save', JSON.stringify({ ...save, pace }));
    }, [state.save ?? null, state.title ?? false, video ? 'normal' : 'off']);
    const page = await ctx.newPage();
    const errors = trapErrors(page);
    page.on('dialog', d => d.accept());
    const tap = async sq => {
      const p = await page.evaluate(s => window.view.screenOf(s), sq);
      if (touch.hasTouch) await page.touchscreen.tap(p.x, p.y); else await page.mouse.click(p.x, p.y);
    };
    const row = { state: state.name, size, file: join(out, `${state.name}-${size}.${video ? 'webm' : 'png'}`), faults: [] };
    try {
      await page.goto(new URL(state.query ?? '', base).href);
      await ready(page);
      if (state.save) { // the app drops a saved move that is not legal, and the moves after it
        const want = state.save.moves ?? [], kept = await lanMoves(page);
        if (kept.join(' ') !== want.join(' ')) row.faults.push(`seed: the app keeps ${kept.length} of the ${want.length} saved moves: [${kept.join(' ')}] of [${want.join(' ')}]`);
      }
      await state.steps?.({ page, tap, size });
      if (video) {
        await settle(page, 2000); // the last motion ends on the video
      } else {
        await page.evaluate(() => document.fonts.ready);
        await settle(page);
        await page.screenshot({ path: row.file });
        const checks = [() => noSidewaysScroll(page)];
        if (state.controls) checks.push(() => insideViewport(page, state.controls));
        if (touch.hasTouch) checks.push(async () => {
          const scope = await page.evaluate(() => (document.querySelector('dialog[open]') ? 'dialog[open]' : 'body'));
          await minTarget(page, `${scope} :is(${state.targets ?? 'button, select, summary, label'})`);
        });
        for (const check of checks) await check().catch(e => row.faults.push(e.message.split('\n')[0]));
      }
    } catch (e) {
      row.faults.push(`cannot render: ${e.message.split('\n')[0]}`);
    }
    row.faults.push(...errors);
    await ctx.close(); // a video is complete only when its page closes
    if (video) {
      await page.video().saveAs(row.file).catch(e => row.faults.push(`no video: ${e.message.split('\n')[0]}`));
      await page.video().delete();
      rmSync(join(out, '.video'), { recursive: true, force: true });
    }
    console.log(`${row.faults.length ? 'FAIL' : 'ok  '} ${state.name} ${size}${video ? ' video' : ''}  ${row.file}${row.faults.map(f => `\n       ${f}`).join('')}`);
    return row;
  }
}

/** The UX review capture: the screens of docs/specs/web-ux/review.md. */
async function review(out, only) {
  mkdirSync(out, { recursive: true });
  const errors = [];
  const texts = {};
  const SAVE = { back: 'SQBKRSML', fen: '', moves: ['e2-e4', 'e7-e5', 'g1-f3', 'b8-c6'], white: 'human', black: 'ai', sound: false, skill: 'club' };

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
      await boardHelp(page, () => page.check('#threats'));
      await settle(page); await shot(page, '07-game-threats', kind);
      await boardHelp(page, () => page.uncheck('#threats'));
      // Review: open the first move in the list
      await step(`${kind} review`, async () => {
        await openMoves(page); await moveRow(page, 1).click(); await settle(page);
        await shot(page, '08-game-review', kind);
        await page.keyboard.press('Escape'); await settle(page, 300);
      });
      for (const [item, dlg] of [['New game', '10-new-game'], ['Settings', '14-settings'], ['Guide', '15-guide']]) {
        await pressMenu(page, item); await settle(page); await shot(page, dlg, kind);
        if (dlg === '10-new-game') {
          await page.click('label:has(#mode-powers)'); await settle(page); await shot(page, '11-new-game-powers', kind);
          await page.click('label:has(#mode-two)'); await settle(page); await shot(page, '12-new-game-two', kind);
          await page.click('label:has(#mode-computer)'); await page.click('#more-options summary'); await settle(page); await shot(page, '13-new-game-more', kind);
        }
        await page.keyboard.press('Escape'); await settle(page, 300);
      }
      await pressMenu(page, 'Guide'); await page.click('#learn'); await settle(page, 1200);
      await shot(page, '16-lesson', kind);
      await page.context().close();
    });
    await step(`${kind} powers`, async () => {
      const page = await open(kind);
      await ready(page); await settle(page);
      await pressMenu(page, 'New game'); await page.click('label:has(#mode-powers)');
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
      await pressMenu(page, 'New game'); await page.click('label:has(#mode-two)');
      await page.click('#start-game'); await ready(page); await settle(page, 1200);
      await tap(page, 12); await tap(page, 28); await settle(page, 1500);
      await shot(page, '19-two-players', kind);
      await page.context().close();
    });
    await step(`${kind} workshop`, async () => {
      const page = await open(kind);
      await ready(page); await settle(page);
      await pressMenu(page, 'Workshop'); await settle(page, 2500);
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
}
