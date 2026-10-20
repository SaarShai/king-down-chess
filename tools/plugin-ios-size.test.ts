import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import type { Browser, FrameLocator, Locator, Page } from 'playwright';
import { launch, STEP } from './lib/checks.mjs';
import { startHarness } from './plugin-ui-harness';
import { hitSizes } from './lib/plugin-hit-sizes.mjs';
import { controlBounds } from './lib/plugin-control-bounds.mjs';
vi.setConfig({ testTimeout: 120_000 * STEP, hookTimeout: 120_000 * STEP, expect: { poll: { timeout: 1000 * STEP } } });
// Test the built page. The build gives the seat its table styles.
// Host copies test sizes and insets. They do not replace a native ChatGPT iOS check.
let folder: string, harness: Awaited<ReturnType<typeof startHarness>>, browser: Browser;
beforeAll(async () => {
  folder = await mkdtemp(join(tmpdir(), 'kingdown-ios-size-'));
  // Normal shared build: at most 601 ms in the M1 style test.
  execFileSync(process.execPath, ['tools/plugin-ui-build.mjs', folder], { stdio: 'pipe', timeout: 30_000 });
  harness = await startHarness({ boardPath: join(folder, 'board.html') }); browser = await launch({ headless: true, channel: process.env.PLAYABLE_BROWSER || 'chromium' });
});
afterAll(async () => { await browser?.close(); await harness?.close(); await rm(folder, { recursive: true, force: true }); });
// Check geometry after the visible canvas and its entry motion reach a frame.
async function waitForBoardPaint(frame: FrameLocator) {
  await frame.locator('#board canvas').waitFor({ state: 'visible' });
  await frame.locator('#board').evaluate(async board => {
    for (let run: Animation[]; (run = board.getAnimations({ subtree: true }).filter(a => a.playState !== 'finished')).length;) await Promise.all(run.map(a => a.finished.catch(() => {})));
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
  });
}
// Keep real pointer input without WebKit's stalled locator geometry check. Check the hit target in the frame.
async function clickButton(page: Page, button: Locator) {
  // Playwright's scrollIntoViewIfNeeded waits for a box that holds over two animation frames, as its click does, and CI
  // WebKit can stop sending frames. Scroll in the page instead, and wait until two reads 20 ms apart agree.
  const box = () => button.evaluate((button: HTMLElement) => {
    button.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
    const r = button.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].join();
  });
  let last = '';
  const seen: string[] = [];
  // The limit of the page wait that this step replaced (each page: 10 000 ms × STEP), not the 1 s poll default.
  await expect.poll(async () => { const next = await box(), still = next === last; seen.push(next); last = next; return still; }, { interval: 20, timeout: 10_000 * STEP }).toBe(true)
    .catch(error => { throw new Error(`clickButton: no two equal boxes in ${seen.length} reads, last ${seen.slice(-4).join(' | ')}`, { cause: error }); });
  const pane = await page.locator('iframe').evaluate(e => ({ x: e.getBoundingClientRect().x, y: e.getBoundingClientRect().y }));
  const point = await button.evaluate((button: HTMLButtonElement) => {
    const r = button.getBoundingClientRect(), x = r.x + r.width / 2, y = r.y + r.height / 2;
    return { x, y, hit: document.elementFromPoint(x, y)?.closest('button') === button,
      enabled: !button.disabled && button.getAttribute('aria-disabled') !== 'true' };
  });
  expect(point.hit).toBe(true); expect(point.enabled).toBe(true);
  await page.mouse.click(pane.x + point.x, pane.y + point.y);
}
it.each([[393, 852, 102, 118, 118], [320, 568, 63, 84, 96], [393, 852, 0, 0, 96]])('reserves one bottom gap at %i × %i with insets %i/%i', async (width, height, top, bottom, gap) => {
  const page = await browser.newPage({ viewport: { width, height }, isMobile: true, hasTouch: true }), frame = page.frameLocator('iframe');
  try {
    await page.goto(harness.url);
    await page.locator('#remount').evaluate(e => { e.style.display = 'none'; });
    await page.locator('iframe').evaluate(e => { e.style.setProperty('height', '100dvh', 'important'); });
    await hall(page);
    await page.evaluate(async safe => { await (window as any).harnessSetContext({ displayMode: 'fullscreen', safeAreaInsets: safe, deviceCapabilities: { touch: true } }); }, { top, bottom, left: 0, right: 0 });
    await expect.poll(() => frame.locator('#app-frame').evaluate(e => innerHeight - e.getBoundingClientRect().bottom)).toBe(gap);
    expect((await frame.locator('#page-back').evaluate(controlBounds)).limit).toBe(height - gap);
  } finally { await page.close(); }
});
// Rule and state text stay whole. The short-phone floors include the 4 px touch-bar padding.
it.each([[393, 852, 102, 118, 380, 380], [320, 568, 63, 84, 215, 175], [320, 568, 63, 180, 135, 95]])('keeps the seat and board large at %i × %i with host insets %i/%i', async (width, height, top, bottom, min, boardMin) => {
  const page = await browser.newPage({ viewport: { width, height }, isMobile: true, hasTouch: true }), frame = page.frameLocator('iframe');
  page.setDefaultTimeout(10_000 * STEP);
  try {
    await page.goto(harness.url);
    await page.locator('#remount').evaluate(e => { e.style.display = 'none'; });
    await page.locator('iframe').evaluate(e => { e.style.setProperty('height', '100dvh', 'important'); });
    await hall(page);
    await page.evaluate(async safe => { await (window as any).harnessSetContext({ displayMode: 'fullscreen', safeAreaInsets: safe, deviceCapabilities: { touch: true } }); }, { top, bottom, left: 0, right: 0 });
    await frame.getByRole('radio', { name: 'Computer', exact: true }).locator('..').click();
    await frame.getByRole('checkbox', { name: 'Arrangement', exact: true }).check();
    await frame.locator('#setup-pieces').click();
    for (const name of ['Rook', 'Bishop', 'Knight', 'Maester']) await frame.getByRole('checkbox', { name, exact: true }).uncheck();
    await frame.getByRole('button', { name: 'Done', exact: true }).click();
    await frame.locator('#setup-start').click(); await frame.locator('[data-screen="seat"]:not([hidden])').waitFor();
    await frame.locator('html').evaluate(() => document.fonts.ready.then(() => {}));
    await frame.locator('#board[aria-busy="false"]').waitFor();
    await frame.locator('#board canvas').evaluate(canvas => canvas.addEventListener('touchstart', event => {
      (window as any).setupTouchGuard = event.defaultPrevented;
    }, { once: true }));
    const setupBoard = (await frame.locator('#board canvas').boundingBox())!;
    await page.touchscreen.tap(setupBoard.x + 88 * setupBoard.width / 960, setupBoard.y + 936 * setupBoard.width / 960);
    expect(await frame.locator('html').evaluate(() => (window as any).setupTouchGuard), 'A setup piece keeps its touch drag guard').toBe(true);
    await frame.locator('#seat-shuffle').click();
    expect(await frame.locator('#seat-context').textContent()).toBe('Select one back-rank piece, then another, to swap them.');
    expect(await frame.locator('#seat-note').textContent()).toBe('The guard stays next to the king.');
    const canvasWidth = () => frame.locator('#board canvas').evaluate(e => e.getBoundingClientRect().width);
    const textFits = () => frame.locator(':is(#context-text, [data-seat-id="context-text"]):visible').evaluate(e => {
      const row = e.parentElement!.getBoundingClientRect(), problems: string[] = [];
      const actions = [...e.parentElement!.querySelectorAll('button')].map(b => b.getBoundingClientRect());
      for (const node of [e, ...e.querySelectorAll<HTMLElement>('*')]) {
        if (!node.textContent?.trim()) continue;
        const box = node.getBoundingClientRect();
        if (actions.some(b => box.left < b.right - 1 && box.right > b.left + 1 && box.top < b.bottom - 1 && box.bottom > b.top + 1) || box.left < row.left - 1 || box.right > row.right + 1 || box.height < 1 || node.scrollHeight > node.clientHeight + 1 || box.top < row.top - 1 || box.bottom > row.bottom + 1 || /(?:…|\.{3})$/.test(node.textContent.trim())) problems.push(node.id || node.getAttribute('data-seat-id') || node.tagName);
      }
      return problems;
    });
    expect(await frame.locator('#app-frame').evaluate(e => innerHeight - e.getBoundingClientRect().bottom)).toBe(Math.max(96, bottom));
    expect(await textFits()).toEqual([]);
    await expect.poll(canvasWidth).toBeGreaterThanOrEqual(min - (width < height ? 4 : 0));
    await frame.locator('#seat-ready:not(:disabled):not([aria-disabled="true"])').waitFor();
    await clickButton(page, frame.locator('#seat-ready')); await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    expect(await frame.locator('#app-frame').evaluate(e => innerHeight - e.getBoundingClientRect().bottom)).toBe(Math.max(96, bottom));
    await expect.poll(canvasWidth).toBeGreaterThanOrEqual(boardMin - (width < height ? 4 : 0));
    expect(await frame.locator('#context-note').textContent()).toBe('');
    expect(await textFits()).toEqual([]);
    await page.evaluate(async () => {
      const host = window as any;
      host.harnessNextView = { ...host.harnessView, kind: 'friend', opponent: { ...host.harnessView.opponent, computer: false }, draw_offer: 1 };
    });
    await frame.locator('#board-menu').click(); await frame.locator('#reload').click();
    await frame.locator('#context-note').filter({ hasText: 'Your opponent offers a draw.' }).waitFor();
    await frame.locator('#accept-draw').waitFor(); await frame.locator('#decline-draw').waitFor();
    expect(await textFits()).toEqual([]);
  } finally { await page.close(); }
});
// The host opens the chat route fullscreen.
async function hall(page: Page) {
  await page.frameLocator('iframe').locator('#home-play:not(:disabled)').waitFor();
  await page.evaluate(() => (window as any).harnessSetContext({ displayMode: 'fullscreen' }));
  const result = await page.evaluate(() => (window as any).harnessTool({ name: 'kingdown_open', arguments: { screen: 'play' } }));
  await page.evaluate(result => (window as any).harnessShow(result), result);
  await page.frameLocator('iframe').locator('[data-screen="play"]:not([hidden])').waitFor();
}
it('sizes the seat and the board from their screens, with no viewport units and the short-phone rows', async () => {
  const page = await browser.newPage({ viewport: { width: 393, height: 760 }, hasTouch: true }), frame = page.frameLocator('iframe');
  page.setDefaultTimeout(10_000 * STEP);
  try {
    await page.goto(harness.url); await frame.locator('#home-play:not(:disabled)').waitFor();
    // A host can keep vh and dvh at an old height (here 350 px); the seat and the board must not depend on them.
    await frame.locator('html').evaluate(() => {
      const stale = (rules: CSSRuleList) => { for (const rule of rules) {
        if (rule instanceof CSSStyleRule) for (const name of [...rule.style]) {
          const value = rule.style.getPropertyValue(name);
          if (/vh\b/.test(value)) rule.style.setProperty(name, value.replace(/(\d*\.?\d+)[dsl]?vh\b/g, (_, n) => `${Number(n) * 3.5}px`), rule.style.getPropertyPriority(name));
        }
        if ('cssRules' in rule) stale((rule as CSSGroupingRule).cssRules);
      } };
      for (const sheet of document.styleSheets) stale(sheet.cssRules);
    });
    // The table fills its screen. The portrait rows leave room for the board even when viewport units stay at an old height.
    const fill = () => frame.locator('html').evaluate(() => {
      const table = [...document.querySelectorAll<HTMLElement>('#game-table, [data-seat-id="game-table"]')].find(e => e.offsetParent)!, rect = (e: Element) => e.getBoundingClientRect();
      const canvas = table.querySelector('canvas')!, board = rect(table.querySelector('#board')!), screen = rect(table.parentElement!);
      return Math.abs(rect(table).height - screen.height) < 1 && Math.abs(rect(canvas).width - Math.min(board.width, board.height * 960 / 1024)) < 2 ? rect(canvas).width / rect(document.getElementById('app-frame')!).width : 0;
    });
    await hall(page); await frame.getByRole('radio', { name: 'Computer', exact: true }).locator('..').click();
    await frame.locator('#setup-start').click(); await frame.locator('[data-screen="seat"]:not([hidden])').waitFor();
    await frame.locator('#board[aria-busy="false"]').waitFor();
    await waitForBoardPaint(frame);
    expect(await fill()).toBeGreaterThan(0.75);
    await frame.locator('#seat-ready:not(:disabled):not([aria-disabled="true"])').waitFor();
    await clickButton(page, frame.locator('#seat-ready')); await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    await waitForBoardPaint(frame);
    expect(await fill()).toBeGreaterThan(0.75);
  } finally { await page.close(); }
});

// The floors keep whole rule text and include the 4 px touch-bar padding on short phones.
it('keeps short-phone boards large, landscape controls reachable and the end table in its box', async () => {
  for (const [width,height,top,bottom,left,right,min,boardMin] of [[320,568,20,0,0,0,235,190],[375,667,20,0,0,0,285,285],[393,852,59,34,0,0,380,380],[440,956,59,34,0,0,430,430],[852,393,0,21,59,59,195,150],[852,393,59,34,0,0,140,95]]) {
    const page=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true}), frame=page.frameLocator('iframe'); page.setDefaultTimeout(10000 * STEP);
    try {
      await page.goto(harness.url); await hall(page);
      await page.evaluate(async safe => { await (window as any).harnessSetContext({displayMode:'fullscreen',safeAreaInsets:safe,deviceCapabilities:{touch:true}}); },{top,bottom,left,right});
      await frame.getByRole('radio',{name:'Computer',exact:true}).locator('..').click();
      await frame.getByRole('checkbox',{name:'Arrangement',exact:true}).check();
      await frame.locator('#setup-start').click(); await frame.locator('[data-screen="seat"]:not([hidden])').waitFor();
      const canvasWidth=()=>frame.locator('#board canvas').evaluate(e=>e.getBoundingClientRect().width);
      await frame.locator('html').evaluate(() => document.fonts.ready.then(() => {}));
      await frame.locator('#board canvas').waitFor({ state: 'visible' });
      await expect.poll(canvasWidth).toBeGreaterThanOrEqual(min - (width < height ? 4 : 0));
      expect(await frame.locator('#seat-context').textContent()).not.toMatch(/Tap/);
      const veil=await frame.locator('#seat-veil-layer .veil').evaluate(e=>{const r=e.getBoundingClientRect(),b=document.querySelector('#board')!.getBoundingClientRect(); return r.top>=b.top-1 && r.bottom<=b.bottom+1 && getComputedStyle(e).overflow==='hidden';});
      expect(veil).toBe(true);
      for(const id of ['seat-menu','seat-ready']) {
        await frame.locator(`#${id}`).scrollIntoViewIfNeeded();
        expect(await frame.locator(`#${id}`).evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})).toBe(true);
      }
      await frame.locator('#seat-ready:not(:disabled):not([aria-disabled="true"])').waitFor();
      await clickButton(page, frame.locator('#seat-ready')); await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
      await frame.locator('#board canvas').waitFor({ state: 'visible' });
      await expect.poll(canvasWidth).toBeGreaterThanOrEqual(boardMin - (width < height ? 4 : 0));
      expect(await frame.locator('.page-sheet').evaluate(e=>e.scrollTop)).toBe(0);
      const bar=await frame.locator('#table-bar').evaluate(e=>{const buttons=[...e.querySelectorAll('button')].filter(b=>!b.hidden),r=e.getBoundingClientRect(),b=buttons[0].getBoundingClientRect();return {count:buttons.length,empty:b.left-r.left};});
      // Undo fills the first cell: no empty cell at the left of the bar.
      expect(bar.count).toBe(3); expect(bar.empty).toBeLessThanOrEqual(8);
      for(const id of ['undo','end-turn','board-menu']) {
        await frame.locator(`#${id}`).scrollIntoViewIfNeeded();
        expect(await frame.locator(`#${id}`).evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})).toBe(true);
      }
      await frame.locator('#board-menu').click(); await frame.locator('#menu-resign').click(); await frame.locator('#board-sheet').getByRole('button',{name:'Resign',exact:true}).click();
      await frame.locator('#over.end-card[open]').waitFor();
      expect(await frame.locator('#end-table').evaluate(e=>Math.abs(e.getBoundingClientRect().height-e.querySelector('#game-table')!.getBoundingClientRect().height))).toBeLessThan(1);
    } finally {await page.close();}
  }
});

it('keeps 44 px card and power targets in two player rows', async () => {
  const page=await browser.newPage({viewport:{width:375,height:667},hasTouch:true}), frame=page.frameLocator('iframe');
  try {
    await page.goto(harness.url); await hall(page);
    await page.evaluate(async()=>{await (window as any).harnessSetContext({deviceCapabilities:{touch:true},displayMode:'fullscreen',safeAreaInsets:{top:20,bottom:0,left:0,right:0}});});
    await frame.locator('[data-nav="settings"]').first().click(); await frame.locator('[data-nav="handle"]').click();
    await frame.locator('#handle').fill('wwwwwwwwwwwwwwwwwwww'); await frame.locator('#save-handle').click(); await frame.locator('#page-back').click();
    await frame.getByRole('radio',{name:'Computer',exact:true}).locator('..').click();
    await frame.getByRole('checkbox',{name:'Arrangement',exact:true}).check();
    await frame.getByRole('checkbox',{name:'Cards',exact:true}).check(); await frame.getByRole('checkbox',{name:'King powers',exact:true}).check();
    await frame.locator('#setup-start').click();
    await frame.locator('#seat-ready:not(:disabled):not([aria-disabled="true"])').waitFor();
    await clickButton(page, frame.locator('#seat-ready')); await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    // Measure the coins at rest, after the start deal (Lively motion).
    // A strip rebuild can cancel a running coin animation and start it again, so wait until no motion runs.
    const bounds=await frame.locator('#game-table').evaluate(async e => {
      for (let run: Animation[]; (run = e.getAnimations({ subtree: true }).filter(a => a.playState !== 'finished')).length;) await Promise.all(run.map(a => a.finished.catch(() => {})));
      // WebKit applies the final transform on the next frame. Find and measure the current coins together.
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      return [...e.querySelectorAll('.coin')].map(coin => { const r=coin.getBoundingClientRect(); return [r.width,r.height]; });
    });
    expect(bounds.length).toBeGreaterThanOrEqual(8); for(const [w,h] of bounds){expect(w).toBeGreaterThanOrEqual(44);expect(h).toBeGreaterThanOrEqual(44);}
    expect(await frame.locator('#strip-me b').getAttribute('title')).toBe('wwwwwwwwwwwwwwwwwwww');
    expect(await frame.locator('#strip-me b').evaluate(e=>{const r=e.getBoundingClientRect(),p=e.closest('.player-strip')!.getBoundingClientRect();return r.top>=p.top && r.bottom<=p.bottom && getComputedStyle(e).textOverflow==='ellipsis';})).toBe(true);
    expect(await frame.locator('#strip-me').evaluate(e=>e.getBoundingClientRect().height)).toBe(88);
  } finally {await page.close();}
});

// WebKit does not focus a clicked button. Each sheet must still give focus back to the control that opened it.
it('returns focus to each sheet opener after a pointer opens the sheet', async () => {
  const page=await browser.newPage({viewport:{width:393,height:852},hasTouch:true}), frame=page.frameLocator('iframe');
  page.setDefaultTimeout(10_000 * STEP);
  const focus: Record<string,string> = {};
  const active = () => frame.locator('html').evaluate(() => { const e = document.activeElement; return e ? e.id || e.tagName : 'none'; });
  const opens = async (id: string, sheet: string, close: 'Escape' | '×' = 'Escape') => {
    if (id === 'menu-resign') await frame.locator('#board-menu').click();
    await frame.locator(`#${id}`).click(); await frame.locator(`${sheet}[open]`).waitFor();
    // A refresh under the sheet rebuilds the coins.
    if (/^(power|card)-/.test(id)) await frame.locator('#reload').evaluate(e=>{e.setAttribute('disabled','');e.removeAttribute('disabled');});
    if (close === 'Escape') await page.keyboard.press('Escape'); else await frame.locator(`${sheet} .sheet-head button`).click();
    await expect.poll(() => frame.locator(`${sheet}[open]`).count()).toBe(0);
    focus[`${id} ${close}`] = await active();
  };
  try {
    await page.goto(harness.url); await frame.locator('#home-games:not(:disabled)').click();
    await page.evaluate(async()=>{await (window as any).harnessSetContext({deviceCapabilities:{touch:true},displayMode:'fullscreen',safeAreaInsets:{top:20,bottom:0,left:0,right:0}});});
    await frame.getByRole('radio',{name:'Computer',exact:true}).locator('..').click();
    await frame.getByRole('checkbox',{name:'Arrangement',exact:true}).check();
    await frame.getByRole('checkbox',{name:'Cards',exact:true}).check(); await frame.getByRole('checkbox',{name:'King powers',exact:true}).check();
    for (const id of ['setup-pieces','setup-cards','setup-king']) await opens(id, '#menu-sheet');
    await frame.locator('#setup-start').click(); await frame.locator('[data-screen="seat"]:not([hidden])').waitFor();
    await frame.locator('#seat-menu:not(:disabled)').waitFor();
    await opens('seat-menu', '#seat-menu-sheet'); await opens('seat-menu', '#seat-menu-sheet', '×');
    // The King sheet locks its coin while it is open.
    await opens('seat-king', '#menu-sheet');
    // A pointer click shows no focus ring.
    await frame.locator('#seat-shuffle').click();
    const ring = await frame.locator('#seat-shuffle').evaluate(e=>({focused:document.activeElement===e, ring:e.matches(':focus-visible')}));
    await frame.locator('#seat-ready:not(:disabled):not([aria-disabled="true"])').waitFor();
    await clickButton(page, frame.locator('#seat-ready')); await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    await frame.locator('#board-menu:not(:disabled)').waitFor();
    for (const id of ['board-menu','moves-line','menu-resign','power-w','card-w-0']) await opens(id, '#board-sheet');
    for (const id of ['board-menu','moves-line','card-w-0']) await opens(id, '#board-sheet', '×');
    expect(focus).toEqual(Object.fromEntries(Object.keys(focus).map(key => [key, key.startsWith('menu-resign ') ? 'board-menu' : key.split(' ')[0]])));
    expect(Object.keys(focus)).toHaveLength(14);
    expect(ring).toEqual({focused:true, ring:false});
  } finally {await page.close();}
});

it('contains the Open games art and the wait art on a short phone', async () => {
  const page=await browser.newPage({viewport:{width:320,height:568},hasTouch:true}),frame=page.frameLocator('iframe');
  try {
    await page.goto(harness.url); await hall(page);
    await frame.getByRole('radio',{name:'A random player',exact:true}).locator('..').click();
    expect(await frame.locator('#play-open .row-art').evaluate(e=>{const r=e.getBoundingClientRect();return [...e.querySelectorAll('img')].every(i=>{const b=i.getBoundingClientRect();return b.left>=r.left-1 && b.right<=r.right+1;});})).toBe(true);
    await frame.locator('#setup-start').click(); await frame.locator('[data-screen="wait"]:not([hidden])').waitFor();
    expect(await frame.locator('.wait-stage').evaluate(e=>({height:e.getBoundingClientRect().height,overflow:getComputedStyle(e).overflow}))).toEqual({height:180,overflow:'hidden'});
    expect(await frame.locator('#page-title').evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);
    expect(await frame.locator('#wait-time').textContent()).toMatch(/Waiting \d+:\d{2}\./);
    expect(await frame.locator('#wait-status').textContent()).toBe('');
    await frame.locator('#wait-cancel').click();
  } finally {await page.close();}
});

it.each([
  [820, 600, 59, 34, 0, 0, true, 315],
  [1024, 768, 24, 20, 0, 0, true, 480],
  [1280, 800, 0, 0, 0, 0, true, 535],
  [852, 393, 0, 21, 59, 59, true, 175],
  [400, 900, 0, 0, 0, 0, false, 390],
] as const)('fits the table at %i × %i', async (width, height, top, bottom, left, right, side, floor) => {
  const page = await browser.newPage({ viewport: { width, height } }), frame = page.frameLocator('iframe');
  try {
    await page.goto(harness.url);
    await page.locator('#remount').evaluate(e => { e.style.display = 'none'; });
    await page.locator('iframe').evaluate(e => { e.style.setProperty('height', '100dvh', 'important'); });
    await hall(page);
    await page.evaluate(safe => (window as any).harnessSetContext({ displayMode: 'fullscreen', safeAreaInsets: safe }), { top, bottom, left, right });
    await frame.getByRole('radio', { name: 'Computer', exact: true }).locator('..').click();
    await frame.locator('#setup-start').click();
    await frame.locator('#seat-ready:not(:disabled):not([aria-disabled="true"])').waitFor();
    await clickButton(page, frame.locator('#seat-ready'));
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    await frame.locator('#board[aria-busy="false"]').waitFor();
    const measure = () => frame.locator('#game-table').evaluate(e => ({ width: e.querySelector('canvas')!.getBoundingClientRect().width, side: getComputedStyle(e.querySelector('.table-side')!).display === 'grid' }));
    await expect.poll(async () => (await measure()).width).toBeGreaterThanOrEqual(floor);
    expect((await measure()).side).toBe(side);
    const wasShort = await frame.locator('#short-last-move').isVisible();
    await page.evaluate(() => { (window as any).rejectNextGet = true; });
    await frame.locator('html').evaluate(() => { const reload = document.querySelector<HTMLButtonElement>('#reload')!; reload.click(); });
    await frame.locator('#retry').waitFor();
    await expect.poll(() => frame.locator('#board').evaluate(e => { const r = e.getBoundingClientRect(); return Math.abs(e.querySelector('canvas')!.getBoundingClientRect().width - Math.min(r.width, r.height * 960 / 1024)); })).toBeLessThan(2);
    // The error can also make a tall table need the short last-move row.
    const errorHeight = await frame.locator('.page-error').evaluate(e => e.getBoundingClientRect().height);
    const moveHeight = !wasShort && await frame.locator('#short-last-move').isVisible() ? (await frame.locator('#short-last-move').boundingBox())!.height + 4 : 0;
    expect((await measure()).width).toBeGreaterThanOrEqual(floor - Math.ceil((errorHeight + moveHeight) * 960 / 1024));
    for (const id of ['undo','end-turn','board-menu']) {
      await frame.locator('#' + id).scrollIntoViewIfNeeded();
      expect((await frame.locator('#' + id).evaluate(controlBounds)).accessible).toBe(true);
      expect(await frame.locator('#' + id).evaluate(e => { const r = e.getBoundingClientRect(); return e.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)); })).toBe(true);
    }
  } finally { await page.close(); }
});

it('opens Play from the seat and board Back buttons on a portrait phone', async () => {
  const page = await browser.newPage({ viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true }), frame = page.frameLocator('iframe');
  try {
    await page.goto(harness.url); await hall(page); await frame.getByRole('radio', { name: 'Computer', exact: true }).locator('..').click();
    await frame.locator('#setup-start').click(); await frame.locator('[data-screen="seat"]:not([hidden])').waitFor();
    const gameId = await page.evaluate(() => (window as any).harnessView.game_id);
    expect(await frame.locator('#page-head').isVisible()).toBe(false);
    await frame.getByRole('button', { name: 'Back to Play', exact: true }).click();
    await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
    await frame.locator(`#games-list [data-game-id="${gameId}"]`).click();
    await frame.locator('#seat-ready:not(:disabled):not([aria-disabled="true"])').waitFor();
    await clickButton(page, frame.locator('#seat-ready')); await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    expect(await frame.locator('#page-head').isVisible()).toBe(false);
    await frame.getByRole('button', { name: 'Back to Play', exact: true }).click();
    await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
  } finally { await page.close(); }
});

it('shows each checked stone choice in light and dark mode', async () => {
  const page = await browser.newPage({ viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true }), frame = page.frameLocator('iframe');
  try {
    await page.goto(harness.url); await hall(page);
    const face = (name: string) => frame.getByRole('radio', { name, exact: true }).locator('..').evaluate(e => {
      const s = getComputedStyle(e); return { colour: s.color, fill: s.backgroundColor, shadow: s.boxShadow, repeat: s.backgroundRepeat };
    });
    for (const theme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme: theme });
      await page.evaluate(theme => (window as any).harnessSetContext({ theme }), theme);
      for (const [first, second] of [['A friend', 'Computer'], ['Strong', 'Club'], ['Black', 'White']]) {
        await frame.getByRole('radio', { name: first, exact: true }).locator('..').click();
        const selected = await face(first), clear = await face(second);
        expect(selected.fill).not.toBe(clear.fill); expect(selected.colour).not.toBe(clear.colour);
        expect(selected.shadow.split(/,(?![^()]*\))/).every(shadow => shadow.includes('inset'))).toBe(true);
        expect(selected.repeat).toBe('no-repeat');
        await frame.getByRole('radio', { name: second, exact: true }).locator('..').click();
        expect(await frame.getByRole('radio', { name: second, exact: true }).isChecked()).toBe(true);
        expect(await face(second)).toEqual(selected); expect(await face(first)).toEqual(clear);
      }
    }
  } finally { await page.close(); }
});

// Fault round 4 (device matrix M1, M4, M5, M11).
async function hostPage(width: number, height: number, top: number, bottom: number) {
  const page = await browser.newPage({ viewport: { width, height }, isMobile: true, hasTouch: true }), frame = page.frameLocator('iframe');
  page.setDefaultTimeout(10_000 * STEP);
  await page.goto(harness.url);
  await page.locator('#remount').evaluate(e => { e.style.display = 'none'; });
  await page.locator('iframe').evaluate(e => { e.style.setProperty('height', '100dvh', 'important'); });
  await hall(page);
  await page.evaluate(async safe => { await (window as any).harnessSetContext({ displayMode: 'fullscreen', safeAreaInsets: safe, deviceCapabilities: { touch: true } }); }, { top, bottom, left: 0, right: 0 });
  return { page, frame };
}
it.each([[768, 1024], [1024, 768]])('gives Settings controls the 44 px floor with touch at %i × %i', async (width, height) => {
  const { page, frame } = await hostPage(width, height, 24, 20);
  try {
    await frame.locator('[data-nav="settings"]').first().click(); await frame.locator('[data-screen="settings"]:not([hidden])').waitFor();
    const heights = await frame.locator('[data-screen="settings"] .fields > label').evaluateAll(labels => labels.map(l => l.getBoundingClientRect().height));
    expect(heights).toHaveLength(3); for (const h of heights) expect(h).toBeGreaterThanOrEqual(44);
    const online = await frame.locator('#online-visibility label').evaluateAll(labels => labels.map(l => l.getBoundingClientRect().height));
    expect(online).toHaveLength(3); for (const h of online) expect(h).toBeGreaterThanOrEqual(44);
  } finally { await page.close(); }
});
it('wraps the page title at 320 px and never cuts it', async () => {
  const { page, frame } = await hostPage(320, 568, 63, 84);
  try {
    await frame.locator('[data-nav="settings"]').first().click(); await frame.locator('[data-nav="handle"]').click(); await frame.locator('#handle').waitFor();
    expect(await frame.locator('#page-title').evaluate(e => ({ text: e.textContent, cut: e.scrollWidth > e.clientWidth || getComputedStyle(e).textOverflow === 'ellipsis' }))).toEqual({ text: 'Pick a name and a picture', cut: false });
  } finally { await page.close(); }
});
it('gives each Android control a 48 px tap area at 360 × 800', async () => {
  const { page, frame } = await hostPage(360, 800, 24, 80), small: unknown[] = [];
  const check = async () => small.push(...(await frame.locator('[data-screen]:not([hidden])').first().evaluate(hitSizes)).filter(c => c.height < 48 || c.width < 48));
  try {
    await check();
    await frame.getByRole('radio', { name: 'Computer', exact: true }).locator('..').click();
    await frame.getByRole('checkbox', { name: 'Fairy pieces', exact: true }).check(); await frame.getByRole('checkbox', { name: 'Cards', exact: true }).check();
    await check();
    await frame.getByRole('radio', { name: 'A friend', exact: true }).locator('..').click(); await frame.locator('#setup-start').click(); await frame.locator('#friend-copy:not([hidden])').waitFor();
    await check();
    await frame.locator('#page-back').click(); await frame.locator('[data-nav="settings"]').first().click(); await frame.locator('[data-screen="settings"]:not([hidden])').waitFor();
    await check();
    await frame.locator('[data-nav="handle"]').click(); await frame.locator('#handle').waitFor();
    await check();
    expect(small).toEqual([]);
  } finally { await page.close(); }
});
it('reflows New game and a waiting friend invite at 200% zoom (197 CSS px)', async () => {
  const { page, frame } = await hostPage(197, 426, 51, 59);
  try {
    for (const name of ['Computer', 'A friend', 'Computer']) await frame.getByRole('radio', { name, exact: true }).locator('..').click({ timeout: 3000 * STEP });
    for (const name of ['Fairy pieces', 'Cards', 'King powers']) await frame.getByRole('checkbox', { name, exact: true }).check({ timeout: 3000 * STEP });
    await frame.getByRole('radio', { name: 'Strong', exact: true }).locator('..').click({ timeout: 3000 * STEP });
    expect(await frame.locator('#setup-body').evaluate(e => e.scrollWidth - e.clientWidth)).toBeLessThanOrEqual(1);
    // The segments wrap two to a line; a tap 1 px inside each edge selects that segment, not the one below.
    const misses = await frame.locator('#setup-body .seg-row label').evaluateAll(labels => labels.filter(l => (l as HTMLElement).offsetParent).flatMap(label => {
      label.scrollIntoView({ block: 'center' });
      const r = label.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
      return [[x, r.top + 1], [x, r.bottom - 1], [r.left + 1, y], [r.right - 1, y]].flatMap(([px, py]) => {
        const hit = document.elementFromPoint(px, py)?.closest('label');
        return hit === label ? [] : [`${label.textContent}: ${Math.round(px)},${Math.round(py)} → ${hit?.textContent}`];
      });
    }));
    expect(misses).toEqual([]);
    // The "kinds" button sits clear of the row text.
    const clear = await frame.locator('#setup-pieces').evaluate(button => {
      const b = button.getBoundingClientRect(), range = document.createRange(); range.selectNodeContents(button.closest('label')!.querySelector('.grow')!); const t = range.getBoundingClientRect();
      return b.top >= t.bottom - 1 || b.left >= t.right - 1;
    });
    expect(clear).toBe(true);
    await frame.locator('#setup-pieces').click({ timeout: 3000 * STEP });
    const title = frame.getByRole('dialog', { name: 'Fairy pieces' }).locator('h2');
    expect(await title.evaluate(h => { const t = h.getBoundingClientRect(), x = h.parentElement!.querySelector('button')!.getBoundingClientRect(); return h.scrollWidth <= h.clientWidth && t.right <= x.left; })).toBe(true);
    await frame.getByRole('button', { name: 'Done', exact: true }).click();
    await frame.getByRole('radio', { name: 'A friend', exact: true }).locator('..').click();
    await frame.locator('#setup-start').click(); await frame.locator('.game-code span').first().waitFor();
    const code = (await frame.locator('.game-code span').allTextContents()).join('');
    await frame.locator('#page-back').click();
    const invite = frame.locator('.friend-invite-row').filter({ hasText: code }); await invite.waitFor();
    expect(await invite.evaluate(async row => {
      await document.fonts.ready;
      const button = row.querySelector('button[data-game-id]')!, bounds = button.getBoundingClientRect();
      const share = row.querySelector('button[aria-label]')!.getBoundingClientRect(), faults: string[] = [];
      const texts = document.createTreeWalker(button, NodeFilter.SHOW_TEXT);
      while (texts.nextNode()) {
        const node = texts.currentNode; if (!node.textContent?.trim()) continue;
        const range = document.createRange(); range.selectNodeContents(node);
        for (const box of range.getClientRects()) {
          if (box.left < bounds.left - 1 || box.right > bounds.right + 1 || box.top < bounds.top - 1 || box.bottom > bounds.bottom + 1) faults.push(`Outside row: ${node.textContent}`);
          if (box.left < share.right && box.right > share.left && box.top < share.bottom && box.bottom > share.top) faults.push(`Under Share: ${node.textContent}`);
        }
      }
      if (row.scrollWidth > row.clientWidth + 1) faults.push('Sideways scroll');
      return faults;
    })).toEqual([]);
    const share = invite.getByRole('button', { name: `Share game ${code}`, exact: true });
    await share.scrollIntoViewIfNeeded();
    expect((await share.evaluate(controlBounds)).accessible).toBe(true);
  } finally { await page.close(); }
});
it('keeps page-title words whole, the seat title short and the title at body size at 200% zoom (197 CSS px)', async () => {
  const { page, frame } = await hostPage(197, 426, 51, 59);
  // The lines of the page title, and the words that a line break cuts.
  const title = () => frame.locator('#page-title').evaluate(async h => {
    await document.fonts.ready;
    const text = h.firstChild!, cut: string[] = [], tops = new Set<number>(); let i = 0;
    for (const word of h.textContent!.split(' ')) {
      const range = document.createRange(); range.setStart(text, i); range.setEnd(text, i + word.length); i += word.length + 1;
      const rects = [...range.getClientRects()]; if (rects.length > 1) cut.push(word); for (const r of rects) tops.add(Math.round(r.top));
    }
    // A title sized by the frame alone stopped growing with zoom (WCAG 1.4.4, F94).
    const style = getComputedStyle(h), belowBody = parseFloat(style.fontSize) < parseFloat(style.getPropertyValue('--fs-md'));
    return { text: h.textContent, lines: tops.size, cut, belowBody };
  });
  try {
    await frame.locator('[data-nav="settings"]').first().click(); await frame.locator('[data-nav="handle"]').click(); await frame.locator('#handle').waitFor();
    expect(await title()).toMatchObject({ text: 'Pick a name and a picture', cut: [], belowBody: false });
    await frame.locator('#page-back').click(); await frame.locator('[data-screen="settings"]:not([hidden])').waitFor();
    await frame.locator('#page-back').click();
    await frame.getByRole('radio', { name: 'Computer', exact: true }).locator('..').click({ timeout: 3000 * STEP });
    await frame.getByRole('checkbox', { name: 'Arrangement', exact: true }).check({ timeout: 3000 * STEP });
     await frame.locator('#setup-start').click({ timeout: 3000 * STEP }); await frame.locator('[data-screen="seat"]:not([hidden])').waitFor();
     // Layout B hides this title in portrait. Keep the 197 px width and check it in landscape, where it shows.
     await page.setViewportSize({ width: 197, height: 196 });
     await page.evaluate(() => (window as any).harnessSetContext({ safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 } }));
     await frame.locator('#page-title').waitFor();
    // A seat title of three lines took the board's height (fault L2).
    const seat = await title();
    expect(seat).toMatchObject({ text: 'Set up your side', cut: [], belowBody: false });
    expect(seat.lines).toBeLessThanOrEqual(2);
  } finally { await page.close(); }
});
// Device matrix round 2, M1: at 200% zoom the board got only the height that the other rows left (3 px), and WebKit sent
// no move. Under 320 px the board keeps the full width, and the screen scrolls to the rows below it.
it('keeps a usable board, seat and move at 200% zoom (197 CSS px, insets 51/59)', async () => {
  const canvasWidth = (frame: FrameLocator) => frame.locator('#board canvas').evaluate(e => e.getBoundingClientRect().width);
  const reachable = async (frame: FrameLocator, id: string) => {
    await frame.locator(`#${id}`).scrollIntoViewIfNeeded();
    return frame.locator(`#${id}`).evaluate(e => { const r = e.getBoundingClientRect(); return e.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)); });
  };
  for (const features of [['Fairy pieces', 'Arrangement'], ['Fairy pieces', 'Arrangement', 'Cards', 'King powers']]) {
    const { page, frame } = await hostPage(197, 426, 51, 59), all = features.includes('Cards');
    try {
      await frame.getByRole('radio', { name: 'Computer', exact: true }).locator('..').click();
      for (const name of ['Fairy pieces', 'Arrangement', 'Cards', 'King powers']) await frame.getByRole('checkbox', { name, exact: true }).setChecked(features.includes(name));
      await frame.locator('#setup-start').click(); await frame.locator('[data-screen="seat"]:not([hidden])').waitFor();
      await frame.locator('#board[aria-busy="false"]').waitFor();
      await waitForBoardPaint(frame);
      await expect.poll(() => canvasWidth(frame), all ? 'all-features seat' : 'seat').toBeGreaterThanOrEqual(192);
      if (!all) {
        await frame.locator('#seat-shuffle').click();
        await frame.locator('#seat-context').filter({ hasText: 'Select one back-rank piece' }).waitFor();
        await waitForBoardPaint(frame);
        await expect.poll(() => canvasWidth(frame), 'seat after Shuffle').toBeGreaterThanOrEqual(192);
      }
      for (const id of ['seat-shuffle', 'seat-menu', 'seat-ready']) expect(await reachable(frame, id), id).toBe(true);
      await frame.locator('#seat-ready:not(:disabled):not([aria-disabled="true"])').waitFor();
      await clickButton(page, frame.locator('#seat-ready')); await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
      await frame.locator('#board[aria-busy="false"]').waitFor();
      await waitForBoardPaint(frame);
      await expect.poll(() => canvasWidth(frame), all ? 'all-features board' : 'board').toBeGreaterThanOrEqual(192);
      if (!all) {
        // White moves e2-e4 with two taps on the board.
        await frame.locator('#status').filter({ hasText: 'Your move' }).waitFor();
        const pane = (await page.locator('iframe').boundingBox())!;
        for (const square of [12, 28]) {
          const point = await frame.locator('#board canvas').evaluate((c, sq) => {
            const r = c.getBoundingClientRect(), k = r.width / 960;
            return { x: r.left + (32 + ((sq & 7) + 0.5) * 112) * k, y: r.top + (64 + 32 + (7 - (sq >> 3) + 0.5) * 112) * k };
          }, square);
          await page.mouse.click(pane.x + point.x, pane.y + point.y);
        }
        await frame.locator('#board[data-animating="false"]').waitFor();
        await page.evaluate(() => { (window as any).holdNext = 'kingdown_computer'; });
        await frame.locator('#end-turn:not(:disabled):not([aria-disabled="true"])').waitFor();
        await clickButton(page, frame.locator('#end-turn'));
        await expect.poll(() => page.evaluate(() => { const host = window as any; return { sent: host.harnessCalls.filter((c: any) => c.name === 'kingdown_move').map((c: any) => c.arguments.actions), moved: host.harnessView.revision > 0 }; })).toEqual({ sent: [['e2-e4']], moved: true });
        // A reply must keep the player's scroll while the lower controls are in view.
        await page.waitForFunction(() => typeof (window as any).releaseHeld === 'function');
        await frame.locator('#undo').scrollIntoViewIfNeeded();
        const screen = frame.locator('[data-screen="board"]'), scroll = await screen.evaluate(e => e.scrollTop);
        expect(scroll).toBeGreaterThan(0);
        await page.evaluate(() => (window as any).releaseHeld());
        await frame.locator('#status').filter({ hasText: 'Your move' }).waitFor();
        await frame.locator('#board[data-animating="false"]').waitFor();
        expect(await screen.evaluate(e => e.scrollTop), 'The computer reply keeps the screen scroll').toBe(scroll);
      }
      for (const id of ['undo','end-turn','board-menu']) expect(await reachable(frame, id), id).toBe(true);
    } finally { await page.close(); }
  }
});
// Review R1: under 320 px the screen scrolls only when the board would get less than its floor. At 314 × 681 (a 393 px
// phone at 125% zoom) the rows fit with Cards and King powers off, so the controls need no scroll.
it('keeps the board screen unscrolled without cards where the rows fit under 320 px (314 × 681, insets 82/94)', async () => {
  const { page, frame } = await hostPage(314, 681, 82, 94);
  try {
    await frame.getByRole('radio', { name: 'Computer', exact: true }).locator('..').click();
    for (const name of ['Fairy pieces', 'Arrangement', 'Cards', 'King powers']) await frame.getByRole('checkbox', { name, exact: true }).setChecked(['Fairy pieces', 'Arrangement'].includes(name));
    await frame.locator('#setup-start').click(); await frame.locator('[data-screen="seat"]:not([hidden])').waitFor();
    await frame.locator('#seat-ready:not(:disabled):not([aria-disabled="true"])').waitFor();
    await clickButton(page, frame.locator('#seat-ready')); await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    await frame.locator('#board[aria-busy="false"]').waitFor();
    await waitForBoardPaint(frame);
    const screen = frame.locator('[data-screen="board"]');
    expect(await screen.evaluate(e => e.scrollHeight - e.clientHeight)).toBe(0);
    expect(await frame.locator('#board canvas').evaluate(e => e.getBoundingClientRect().width)).toBeGreaterThanOrEqual(192);
    for (const id of ['undo','end-turn','board-menu']) {
      expect(await screen.evaluate((s, id) => {
        const box = s.getBoundingClientRect(), r = document.getElementById(id)!.getBoundingClientRect();
        return r.height > 0 && r.top >= box.top - 1 && r.bottom <= box.bottom + 1;
      }, id), id).toBe(true);
    }
  } finally { await page.close(); }
});
// The zoom rule leaves normal sizes alone. Device matrix round 2 measured 169/158 and 302/302 on the old phone rows;
// layout B (short portrait rows, Back in the opponent row) gives the seat more height, and with Cards and King powers
// its narrow opponent and player rows take two 44 px rows on the board. The touch bar adds 4 px; the short last-move row takes 24 px at short heights.
it.each([[320, 568, 63, 84, true, 214, 109], [393, 852, 102, 118, true, 382, 300], [820, 600, 59, 34, false, 360, 338]] as const)('keeps the seat and board widths at %i × %i with insets %i/%i', async (width, height, top, bottom, touch, seat, board) => {
  const page = await browser.newPage({ viewport: { width, height }, isMobile: touch, hasTouch: touch }), frame = page.frameLocator('iframe');
  page.setDefaultTimeout(10_000 * STEP);
  try {
    await page.goto(harness.url);
    await page.locator('#remount').evaluate(e => { e.style.display = 'none'; });
    await page.locator('iframe').evaluate(e => { e.style.setProperty('height', '100dvh', 'important'); });
    await hall(page);
    await page.evaluate(async ({ touch, ...safe }) => { await (window as any).harnessSetContext({ displayMode: 'fullscreen', safeAreaInsets: safe, ...(touch ? { deviceCapabilities: { touch: true } } : {}) }); }, { top, bottom, left: 0, right: 0, touch });
    await frame.getByRole('radio', { name: 'Computer', exact: true }).locator('..').click();
    // Cards and King powers stay on from the zoom test above; the test sets them, so its widths do not depend on the order.
    for (const name of ['Cards', 'King powers']) await frame.getByRole('checkbox', { name, exact: true }).check();
    // Every kind but the guard (an earlier test keeps a smaller pool), so no guard note takes a row from the seat board.
    await frame.getByRole('checkbox', { name: 'Arrangement', exact: true }).check(); await frame.locator('#setup-pieces').click();
    const pieces = frame.getByRole('dialog', { name: 'Fairy pieces' });
    for (const kind of await pieces.getByRole('checkbox').all()) await kind.check();
    await pieces.getByRole('checkbox', { name: 'Guard', exact: true }).uncheck(); await pieces.getByRole('button', { name: 'Done', exact: true }).click();
    await frame.locator('#setup-start').click(); await frame.locator('[data-screen="seat"]:not([hidden])').waitFor();
    await frame.locator('html').evaluate(() => document.fonts.ready.then(() => {}));
    await frame.locator('#board[aria-busy="false"]').waitFor();
    await frame.locator('#seat-context').filter({ hasText: /\S/ }).waitFor();
    const canvasWidth = () => frame.locator('#board canvas').evaluate(e => e.getBoundingClientRect().width);
    await waitForBoardPaint(frame);
    await expect.poll(canvasWidth).toBe(seat);
    await frame.locator('#seat-ready:not(:disabled):not([aria-disabled="true"])').waitFor();
    await clickButton(page, frame.locator('#seat-ready')); await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    await frame.locator('#status').filter({ hasText: 'Your move' }).waitFor();
    await waitForBoardPaint(frame);
    await expect.poll(canvasWidth).toBe(board);
  } finally { await page.close(); }
});

// The fixture shares saved setup. Keep this chess-only case after the fairy-piece size checks.
it.each([[426, 59], [800, 0]])('keeps Back clear and end actions reachable at 197 by %i', async (height, bottom) => {
  const { page, frame } = await hostPage(197, height, 51, bottom);
  try {
    await frame.getByRole('radio', { name: 'Computer', exact: true }).locator('..').click();
    await frame.getByRole('radio', { name: 'White', exact: true }).locator('..').click();
    await frame.getByRole('checkbox', { name: 'Fairy pieces', exact: true }).check();
    for (const name of ['Arrangement', 'Fairy pieces', 'Cards', 'King powers']) await frame.getByRole('checkbox', { name, exact: true }).uncheck();
    await frame.locator('#setup-start').click(); await frame.locator('#board[aria-busy="false"]').waitFor();
    await frame.locator('#board-menu').click(); await frame.locator('#menu-resign').click(); await frame.locator('#board-sheet').getByRole('button', { name: 'Resign', exact: true }).click();
    await frame.locator('#over[open]').waitFor();
    expect(await frame.locator('#over').evaluate(e => e.scrollHeight > e.clientHeight)).toBe(height === 426);
    const cue = await frame.locator('#over').evaluate(e => {
      e.scrollTop = 0;
      const card = e.getBoundingClientRect(), [first, next] = [...e.querySelectorAll('form button')].map(b => b.getBoundingClientRect());
      return { firstFits: first.top >= card.top && first.bottom <= card.bottom, visible: card.bottom - next.top, cut: next.bottom > card.bottom };
    });
    expect(cue.firstFits).toBe(true);
    if (height === 426) {
      expect(cue.visible).toBeGreaterThanOrEqual(12);
      expect(cue.cut).toBe(true);
    } else {
      expect(await frame.locator('#over form button:not([hidden])').evaluateAll(buttons => buttons.every(e => {
        const r = e.getBoundingClientRect(), card = e.closest('dialog')!.getBoundingClientRect(), frame = document.getElementById('app-frame')!.getBoundingClientRect();
        return r.top >= card.top && r.bottom <= card.bottom && r.left >= card.left && r.right <= card.right && r.top >= frame.top && r.bottom <= frame.bottom && r.left >= frame.left && r.right <= frame.right;
      }))).toBe(true);
    }
    expect(await frame.locator('#game-table .table-back').evaluate(e => {
      const r = e.getBoundingClientRect(), card = document.getElementById('over')!.getBoundingClientRect();
      return r.height >= 44 && r.bottom <= card.top && e.contains(document.elementFromPoint(r.x+r.width/2, r.y+r.height/2));
    })).toBe(true);
    for (const name of ['Play again', 'New game', 'See the board']) {
      const button = frame.locator('#over').getByRole('button', { name, exact: true }); await button.scrollIntoViewIfNeeded();
      expect((await button.evaluate(controlBounds)).accessible, name).toBe(true);
      expect(await button.evaluate(e => { const r=e.getBoundingClientRect(); return r.width>0 && e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)); }), name).toBe(true);
    }
    expect(await frame.locator('#over').evaluate(e => e.scrollWidth-e.clientWidth)).toBe(0);
    await frame.locator('#over').getByRole('button', { name: 'See the board', exact: true }).click();
    await frame.locator('#end-result').click(); await frame.locator('#over[open]').waitFor();
    await frame.locator('#game-table .table-back').click(); await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
  } finally { await page.close(); }
});
