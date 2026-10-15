import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium, type Browser } from 'playwright';
import { startHarness } from './plugin-ui-harness';
import { controlBounds } from './lib/plugin-control-bounds.mjs';
vi.setConfig({ testTimeout: 120_000, hookTimeout: 120_000 });
// Test the built page. The build gives the seat its table styles.
// Host copies test sizes and insets. They do not replace a native ChatGPT iOS check.
let folder: string, harness: Awaited<ReturnType<typeof startHarness>>, browser: Browser;
beforeAll(async () => {
  folder = await mkdtemp(join(tmpdir(), 'kingdown-ios-size-'));
  execFileSync(process.execPath, ['tools/plugin-ui-build.mjs', folder], { stdio: 'pipe' });
  harness = await startHarness({ boardPath: join(folder, 'board.html') }); browser = await chromium.launch({ headless: true });
});
afterAll(async () => { await browser?.close(); await harness?.close(); await rm(folder, { recursive: true, force: true }); });
it.each([[393, 852, 102, 118, 118], [320, 568, 63, 84, 96], [393, 852, 0, 0, 96]])('reserves one bottom gap at %i × %i with insets %i/%i', async (width, height, top, bottom, gap) => {
  const page = await browser.newPage({ viewport: { width, height }, isMobile: true, hasTouch: true }), frame = page.frameLocator('iframe');
  try {
    await page.goto(harness.url);
    await page.locator('#remount').evaluate(e => { e.style.display = 'none'; });
    await page.locator('iframe').evaluate(e => { e.style.setProperty('height', '100dvh', 'important'); });
    await frame.locator('#home-play:not(:disabled)').click();
    await page.evaluate(async safe => { await (window as any).harnessSetContext({ displayMode: 'fullscreen', safeAreaInsets: safe, deviceCapabilities: { touch: true } }); }, { top, bottom, left: 0, right: 0 });
    await expect.poll(() => frame.locator('#app-frame').evaluate(e => innerHeight - e.getBoundingClientRect().bottom)).toBe(gap);
    expect((await frame.locator('#page-back').evaluate(controlBounds)).limit).toBe(height - gap);
  } finally { await page.close(); }
});
// The rule text is never cut (fault round 1), so on short phones the board gets what the text leaves: 156 px at 320 × 568 with insets 63/84.
it.each([[393, 852, 102, 118, 290], [320, 568, 63, 84, 150], [320, 568, 63, 180, 60]])('keeps the seat and board large at %i × %i with host insets %i/%i', async (width, height, top, bottom, min) => {
  const page = await browser.newPage({ viewport: { width, height }, isMobile: true, hasTouch: true }), frame = page.frameLocator('iframe');
  page.setDefaultTimeout(10_000);
  try {
    await page.goto(harness.url);
    await page.locator('#remount').evaluate(e => { e.style.display = 'none'; });
    await page.locator('iframe').evaluate(e => { e.style.setProperty('height', '100dvh', 'important'); });
    await frame.locator('#home-play:not(:disabled)').click();
    await page.evaluate(async safe => { await (window as any).harnessSetContext({ displayMode: 'fullscreen', safeAreaInsets: safe, deviceCapabilities: { touch: true } }); }, { top, bottom, left: 0, right: 0 });
    await frame.locator('#play-new').click(); await frame.getByRole('radio', { name: 'Computer', exact: true }).locator('..').click();
    await frame.getByRole('checkbox', { name: 'Arrangement', exact: true }).check();
    await frame.locator('#setup-pieces').click();
    for (const name of ['Rook', 'Bishop', 'Knight', 'Maester']) await frame.getByRole('checkbox', { name, exact: true }).uncheck();
    await frame.getByRole('button', { name: 'Done', exact: true }).click();
    await frame.locator('#setup-start').click(); await frame.locator('[data-screen="seat"]:not([hidden])').waitFor();
    await frame.locator('html').evaluate(() => document.fonts.ready.then(() => {}));
    await frame.locator('#board[aria-busy="false"]').waitFor();
    await frame.locator('#seat-shuffle').click();
    expect(await frame.locator('#seat-context').textContent()).toBe('Select one back-rank piece, then another, to swap them.');
    expect(await frame.locator('#seat-note').textContent()).toBe('The guard stays next to the king.');
    const canvasWidth = () => frame.locator('#board canvas').evaluate(e => e.getBoundingClientRect().width);
    const textFits = () => frame.locator(':is(#context-text, [data-seat-id="context-text"]):visible').evaluate(e => {
      const row = e.parentElement!.getBoundingClientRect(), problems: string[] = [];
      for (const node of [e, ...e.querySelectorAll<HTMLElement>('*')]) {
        if (!node.textContent?.trim()) continue;
        const box = node.getBoundingClientRect();
        if (box.height < 1 || node.scrollHeight > node.clientHeight + 1 || box.top < row.top - 1 || box.bottom > row.bottom + 1 || /(?:…|\.{3})$/.test(node.textContent.trim())) problems.push(node.id || node.getAttribute('data-seat-id') || node.tagName);
      }
      return problems;
    });
    expect(await frame.locator('#app-frame').evaluate(e => innerHeight - e.getBoundingClientRect().bottom)).toBe(Math.max(96, bottom));
    expect(await textFits()).toEqual([]);
    expect.soft(await canvasWidth()).toBeGreaterThanOrEqual(min);
    await frame.locator('#seat-ready').click(); await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    expect(await frame.locator('#app-frame').evaluate(e => innerHeight - e.getBoundingClientRect().bottom)).toBe(Math.max(96, bottom));
    expect.soft(await canvasWidth()).toBeGreaterThanOrEqual(min);
    expect(await frame.locator('#context-note').textContent()).toBe('Abort ends the game with no result, until each side moves once.');
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
it('sizes the seat and the board from their screens, with no viewport units and the short-phone rows', async () => {
  const page = await browser.newPage({ viewport: { width: 393, height: 760 }, hasTouch: true }), frame = page.frameLocator('iframe');
  page.setDefaultTimeout(10_000);
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
    // The table fills its screen, and the board is as large as its row allows. The screen is under 640 px tall in a
    // 760 px window, so the short-phone rows apply and the board is about 313 px (265 px with the full rows).
    const fill = () => frame.locator('html').evaluate(() => {
      const table = [...document.querySelectorAll<HTMLElement>('#game-table, [data-seat-id="game-table"]')].find(e => e.offsetParent)!, rect = (e: Element) => e.getBoundingClientRect();
      const canvas = table.querySelector('canvas')!, board = rect(table.querySelector('#board')!), screen = rect(table.parentElement!);
      return Math.abs(rect(table).height - screen.height) < 1 && Math.abs(rect(canvas).width - Math.min(board.width, board.height * 960 / 1024)) < 2 && rect(canvas).width / rect(document.getElementById('app-frame')!).width;
    });
    await frame.locator('#home-play').click(); await frame.locator('#play-new').click(); await frame.getByRole('radio', { name: 'Computer', exact: true }).locator('..').click();
    await frame.locator('#setup-start').click(); await frame.locator('[data-screen="seat"]:not([hidden])').waitFor();
    await expect.poll(fill).toBeGreaterThan(0.75);
    await frame.locator('#seat-ready').click(); await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    await expect.poll(fill).toBeGreaterThan(0.75);
  } finally { await page.close(); }
});

// The floors are the measured sizes with whole rule text, rounded down to 5 px.
it('keeps short-phone boards large, landscape controls reachable and the end table in its box', async () => {
  for (const [width,height,top,bottom,left,right,min] of [[320,568,20,0,0,0,170],[375,667,20,0,0,0,225],[393,852,59,34,0,0,308],[440,956,59,34,0,0,360],[852,393,0,21,59,59,175],[852,393,59,34,0,0,110]]) {
    const page=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true}), frame=page.frameLocator('iframe'); page.setDefaultTimeout(10000);
    try {
      await page.goto(harness.url); await frame.locator('#home-play:not(:disabled)').click();
      await page.evaluate(async safe => { await (window as any).harnessSetContext({displayMode:'fullscreen',safeAreaInsets:safe,deviceCapabilities:{touch:true}}); },{top,bottom,left,right});
      await frame.locator('#play-new').click(); await frame.getByRole('radio',{name:'Computer',exact:true}).locator('..').click();
      await frame.getByRole('checkbox',{name:'Arrangement',exact:true}).check();
      await frame.locator('#setup-start').click(); await frame.locator('[data-screen="seat"]:not([hidden])').waitFor();
      const canvasWidth=()=>frame.locator('#board canvas').evaluate(e=>e.getBoundingClientRect().width);
      await frame.locator('html').evaluate(() => document.fonts.ready.then(() => {}));
      await expect.poll(canvasWidth).toBeGreaterThan(0);
      expect.soft(await canvasWidth()).toBeGreaterThanOrEqual(min);
      expect(await frame.locator('#seat-context').textContent()).not.toMatch(/Tap/);
      const veil=await frame.locator('#seat-veil-layer .veil').evaluate(e=>{const r=e.getBoundingClientRect(),b=document.querySelector('#board')!.getBoundingClientRect(); return r.top>=b.top-1 && r.bottom<=b.bottom+1 && getComputedStyle(e).overflow==='hidden';});
      expect(veil).toBe(true);
      for(const id of ['seat-menu','seat-ready']) {
        await frame.locator(`#${id}`).scrollIntoViewIfNeeded();
        expect(await frame.locator(`#${id}`).evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})).toBe(true);
      }
      await frame.locator('#seat-ready').click(); await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
      await expect.poll(canvasWidth).toBeGreaterThan(0);
      expect.soft(await canvasWidth()).toBeGreaterThanOrEqual(min);
      expect(await frame.locator('.page-sheet').evaluate(e=>e.scrollTop)).toBe(0);
      const bar=await frame.locator('#table-bar').evaluate(e=>{const buttons=[...e.querySelectorAll('button')].filter(b=>!b.hidden),r=e.getBoundingClientRect(),b=buttons[0].getBoundingClientRect();return {count:buttons.length,empty:b.left-r.left};});
      expect(bar.count).toBe(2); expect(bar.empty).toBeLessThanOrEqual(8);
      for(const id of ['board-menu','resign']) {
        await frame.locator(`#${id}`).scrollIntoViewIfNeeded();
        expect(await frame.locator(`#${id}`).evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})).toBe(true);
      }
      await frame.locator('#resign').click(); await frame.locator('#board-sheet').getByRole('button',{name:'Resign',exact:true}).click();
      await frame.locator('#over.end-card[open]').waitFor();
      expect(await frame.locator('#end-table').evaluate(e=>Math.abs(e.getBoundingClientRect().height-e.querySelector('#game-table')!.getBoundingClientRect().height))).toBeLessThan(1);
    } finally {await page.close();}
  }
});

it('keeps card and power targets at 44 px without increasing the player rows', async () => {
  const page=await browser.newPage({viewport:{width:375,height:667},hasTouch:true}), frame=page.frameLocator('iframe');
  try {
    await page.goto(harness.url); await frame.locator('#home-play:not(:disabled)').click();
    await page.evaluate(async()=>{await (window as any).harnessSetContext({deviceCapabilities:{touch:true},displayMode:'fullscreen',safeAreaInsets:{top:20,bottom:0,left:0,right:0}});});
    await frame.locator('[data-nav="settings"]').first().click(); await frame.locator('[data-nav="handle"]').click();
    await frame.locator('#handle').fill('wwwwwwwwwwwwwwwwwwww'); await frame.locator('#save-handle').click(); await frame.locator('#page-back').click();
    await frame.locator('#play-new').click(); await frame.getByRole('radio',{name:'Computer',exact:true}).locator('..').click();
    await frame.getByRole('checkbox',{name:'Arrangement',exact:true}).check();
    await frame.getByRole('checkbox',{name:'Cards',exact:true}).check(); await frame.getByRole('checkbox',{name:'King powers',exact:true}).check();
    await frame.locator('#setup-start').click(); await frame.locator('#seat-ready').click(); await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    const bounds=await frame.locator('#game-table .coin').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return [r.width,r.height];}));
    expect(bounds.length).toBeGreaterThanOrEqual(8); for(const [w,h] of bounds){expect(w).toBeGreaterThanOrEqual(44);expect(h).toBeGreaterThanOrEqual(44);}
    expect(await frame.locator('#strip-me b').getAttribute('title')).toBe('wwwwwwwwwwwwwwwwwwww');
    expect(await frame.locator('#strip-me b').evaluate(e=>{const r=e.getBoundingClientRect(),p=e.closest('.player-strip')!.getBoundingClientRect();return r.top>=p.top && r.bottom<=p.bottom && getComputedStyle(e).textOverflow==='ellipsis';})).toBe(true);
    expect(await frame.locator('#strip-me').evaluate(e=>e.getBoundingClientRect().height)).toBe(44);
    for (const id of ['power-w','card-w-0']) {
      await frame.locator(`#${id}`).click();
      await frame.locator('#reload').evaluate(e=>{e.setAttribute('disabled','');e.removeAttribute('disabled');});
      await page.keyboard.press('Escape');
      expect(await frame.locator(`#${id}`).evaluate(e=>document.activeElement===e)).toBe(true);
    }
  } finally {await page.close();}
});

it('contains the Open games art and the wait art on a short phone', async () => {
  const page=await browser.newPage({viewport:{width:320,height:568},hasTouch:true}),frame=page.frameLocator('iframe');
  try {
    await page.goto(harness.url); await frame.locator('#home-play:not(:disabled)').click();
    expect(await frame.locator('#play-open .row-art').evaluate(e=>{const r=e.getBoundingClientRect();return [...e.querySelectorAll('img')].every(i=>{const b=i.getBoundingClientRect();return b.left>=r.left-1 && b.right<=r.right+1;});})).toBe(true);
    await frame.locator('#play-new').click(); await frame.getByRole('radio',{name:'A random player',exact:true}).locator('..').click();
    await frame.locator('#setup-start').click(); await frame.locator('[data-screen="wait"]:not([hidden])').waitFor();
    expect(await frame.locator('.wait-stage').evaluate(e=>({height:e.getBoundingClientRect().height,overflow:getComputedStyle(e).overflow}))).toEqual({height:180,overflow:'hidden'});
    expect(await frame.locator('#page-title').evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);
    expect(await frame.locator('#wait-time').textContent()).toMatch(/Waiting \d+:\d{2}\./);
    expect(await frame.locator('#wait-status').textContent()).toBe('');
    await frame.locator('#wait-cancel').click();
  } finally {await page.close();}
});

it.each([
  [820, 600, 59, 34, 0, 0, true, 300],
  [1024, 768, 24, 20, 0, 0, true, 475],
  [1280, 800, 0, 0, 0, 0, true, 530],
  [852, 393, 0, 21, 59, 59, true, 215],
  [400, 900, 0, 0, 0, 0, false, 385],
] as const)('fits the table at %i × %i', async (width, height, top, bottom, left, right, side, floor) => {
  const page = await browser.newPage({ viewport: { width, height } }), frame = page.frameLocator('iframe');
  try {
    await page.goto(harness.url);
    await page.locator('#remount').evaluate(e => { e.style.display = 'none'; });
    await page.locator('iframe').evaluate(e => { e.style.setProperty('height', '100dvh', 'important'); });
    await frame.locator('#home-play:not(:disabled)').click();
    await page.evaluate(safe => (window as any).harnessSetContext({ displayMode: 'fullscreen', safeAreaInsets: safe }), { top, bottom, left, right });
    await frame.locator('#play-new').click(); await frame.getByRole('radio', { name: 'Computer', exact: true }).locator('..').click();
    await frame.locator('#setup-start').click(); await frame.locator('#seat-ready').click();
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    await frame.locator('#board[aria-busy="false"]').waitFor();
    const measure = () => frame.locator('#game-table').evaluate(e => ({ width: e.querySelector('canvas')!.getBoundingClientRect().width, side: getComputedStyle(e.querySelector('.table-side')!).display === 'grid' }));
    await expect.poll(async () => (await measure()).width).toBeGreaterThanOrEqual(floor);
    expect((await measure()).side).toBe(side);
    await page.evaluate(() => { (window as any).rejectNextGet = true; });
    await frame.locator('html').evaluate(() => { const reload = document.querySelector<HTMLButtonElement>('#reload')!; reload.click(); });
    await frame.locator('#retry').waitFor();
    await expect.poll(() => frame.locator('#board').evaluate(e => { const r = e.getBoundingClientRect(); return Math.abs(e.querySelector('canvas')!.getBoundingClientRect().width - Math.min(r.width, r.height * 960 / 1024)); })).toBeLessThan(2);
    // The error and Retry rows use up to 85 px. The board must still fit beside the controls.
    expect((await measure()).width).toBeGreaterThanOrEqual(floor - 85);
    for (const id of ['board-menu', 'resign']) {
      await frame.locator('#' + id).scrollIntoViewIfNeeded();
      expect((await frame.locator('#' + id).evaluate(controlBounds)).accessible).toBe(true);
      expect(await frame.locator('#' + id).evaluate(e => { const r = e.getBoundingClientRect(); return e.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)); })).toBe(true);
    }
  } finally { await page.close(); }
});

// Fault round 4 (device matrix M1, M4, M5, M11).
async function hostPage(width: number, height: number, top: number, bottom: number) {
  const page = await browser.newPage({ viewport: { width, height }, isMobile: true, hasTouch: true }), frame = page.frameLocator('iframe');
  page.setDefaultTimeout(10_000);
  await page.goto(harness.url);
  await page.locator('#remount').evaluate(e => { e.style.display = 'none'; });
  await page.locator('iframe').evaluate(e => { e.style.setProperty('height', '100dvh', 'important'); });
  await frame.locator('#home-play:not(:disabled)').click();
  await page.evaluate(async safe => { await (window as any).harnessSetContext({ displayMode: 'fullscreen', safeAreaInsets: safe, deviceCapabilities: { touch: true } }); }, { top, bottom, left: 0, right: 0 });
  return { page, frame };
}
// The tap height and width at the centre lines of each visible control: the run of points that reach the control.
const hitSizes = (root: Element) => [...root.querySelectorAll('button, label, input:not([type=radio]):not([type=checkbox])')].filter(e => (e as HTMLElement).offsetParent && !e.closest('dialog:not([open])')).map(e => {
  e.scrollIntoView({ block: 'center' });
  const own = (p: Element | null) => p?.closest('button, label, input'), r = e.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, target = own(e);
  const run = (dx: number, dy: number) => { let n = 0; while (n < 40 && own(document.elementFromPoint(x + dx * (n + 1), y + dy * (n + 1))) === target) n++; return n; };
  return { name: e.id || e.textContent!.trim().slice(0, 20), height: run(0, -1) + run(0, 1) + 1, width: run(-1, 0) + run(1, 0) + 1 };
});
it.each([[768, 1024], [1024, 768]])('gives Settings toggles the 44 px floor with touch at %i × %i', async (width, height) => {
  const { page, frame } = await hostPage(width, height, 24, 20);
  try {
    await frame.locator('[data-nav="settings"]').first().click(); await frame.locator('[data-screen="settings"]:not([hidden])').waitFor();
    const heights = await frame.locator('[data-screen="settings"] .fields > label').evaluateAll(labels => labels.map(l => l.getBoundingClientRect().height));
    expect(heights).toHaveLength(2); for (const h of heights) expect(h).toBeGreaterThanOrEqual(44);
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
    await frame.locator('#play-new').click(); await frame.getByRole('radio', { name: 'Computer', exact: true }).locator('..').click();
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
it('reflows New game at 200% zoom (197 CSS px): no sideways scroll, every row tappable', async () => {
  const { page, frame } = await hostPage(197, 426, 51, 59);
  try {
    await frame.locator('#play-new').click();
    for (const name of ['Computer', 'A friend', 'Computer']) await frame.getByRole('radio', { name, exact: true }).locator('..').click({ timeout: 3000 });
    for (const name of ['Fairy pieces', 'Cards', 'King powers']) await frame.getByRole('checkbox', { name, exact: true }).check({ timeout: 3000 });
    await frame.getByRole('radio', { name: 'Strong', exact: true }).locator('..').click({ timeout: 3000 });
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
    await frame.locator('#setup-pieces').click({ timeout: 3000 });
    const title = frame.getByRole('dialog', { name: 'Fairy pieces' }).locator('h2');
    expect(await title.evaluate(h => { const t = h.getBoundingClientRect(), x = h.parentElement!.querySelector('button')!.getBoundingClientRect(); return h.scrollWidth <= h.clientWidth && t.right <= x.left; })).toBe(true);
  } finally { await page.close(); }
});
