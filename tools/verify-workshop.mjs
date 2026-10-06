// The Workshop in a real browser (docs/WORKSHOP.md §8.5): the layout at every size, the doors in
// and Back out, the keys, the brushes, the judge's live reactions, Mix two, reload, the link, the
// motion rules and Try it. Screenshots: docs/visual-design/workshop/.
// Needs a running build: PLAYABLE_URL=http://127.0.0.1:5189/ node tools/verify-workshop.mjs
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';

const base = process.env.PLAYABLE_URL || 'http://127.0.0.1:5189/';
const out = 'docs/visual-design/workshop';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: process.env.PLAYABLE_BROWSER || 'chrome' });
const errors = [];
const ok = msg => console.log(`ok ${msg}`);
const SIZES = [[320, 568], [375, 667], [375, 812], [390, 844], [568, 320], [768, 1024], [1280, 900], [375, 553], [375, 660], [390, 700], [568, 270]];

async function open({ w = 375, h = 660, title = false, query = '', reducedMotion = 'no-preference', pace = null } = {}) {
  const touch = w < 721;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: touch, isMobile: touch, reducedMotion });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
  await ctx.addInitScript(t => { if (!t) sessionStorage.setItem('kingdown.title-seen', '1'); }, title); // skip the title screen (main.ts)
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(`${w}x${h}: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') errors.push(`${w}x${h}: ${m.text()}`); });
  page.on('dialog', d => { errors.push(`alert: ${d.message()}`); void d.dismiss(); });
  await page.goto(base + query);
  await page.waitForFunction(() => window.view?.ready);
  await page.evaluate(() => window.view.ready());
  if (pace) await page.evaluate(p => { const s = document.getElementById('pace'); s.value = p; s.onchange(); }, pace); // Settings → Animations
  return page;
}
const viaGuide = async page => {
  await page.evaluate(() => document.getElementById('rules-btn').click());
  await page.click('#guide-workshop');
  await page.waitForSelector('#workshop[open] .ws-door');
};
const editPreset = async (page, key) => { await page.click('[data-door="piece"]'); await page.click(`[data-key="${key}"]`); await page.waitForSelector('.ws-editor'); };
const tab = (page, n) => page.click(`.ws-tabs label:nth-child(${n})`);
const addRule = async (page, a) => { await tab(page, 2); await page.click('.ws-add'); await page.click(`.ws-book-row[data-a="${a}"]`); await page.waitForSelector('.ws-sheet', { state: 'detached' }).catch(() => {}); };
const gaugeNow = page => page.getAttribute('.ws-stage .ws-gauge', 'aria-valuenow');
const shot = async (page, name) => { await page.waitForTimeout(400); await page.screenshot({ path: `${out}/${name}.jpg`, type: 'jpeg', quality: 86 }); }; // the wait: the piece icons are external SVG files
/** Sideways scroll on the page or in any scroll area of the Workshop. */
const sideways = page => page.evaluate(() => [document.documentElement, ...document.querySelectorAll('#workshop, #workshop .ws-scroll, #workshop .ws-panel, #workshop .ws-screen')]
  .filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.id || e.className));
/** Visible controls under 44 px (board cells: under 32 px, or under 44 px where the layout allows 44). */
const small = (page, cellMin) => page.evaluate(min => {
  const out = [];
  for (const e of document.querySelectorAll('#workshop button, #workshop .seg-row label, #workshop .check, #workshop select')) {
    const r = e.getBoundingClientRect();
    if (!r.width || !r.height || e.closest('[hidden]') || getComputedStyle(e).visibility === 'hidden') continue;
    const need = e.classList.contains('ws-cell') ? min : 44;
    if (Math.round(r.width) < need || Math.round(r.height) < need) out.push(`${e.className || e.tagName}${e.textContent.trim() ? ` "${e.textContent.trim().slice(0, 16)}"` : ''} ${Math.round(r.width)}x${Math.round(r.height)}`);
  }
  return [...new Set(out)];
}, cellMin);

try {
  // 1. Every size: no sideways scroll, 44 px controls, the stage and the cell (§2.3).
  const issues = [], check = (got, what) => { if (got.length) issues.push(`${what}: ${got.join('; ')}`); };
  for (const [w, h] of SIZES) {
    const page = await open({ w, h });
    await viaGuide(page);
    check(await sideways(page), `${w}x${h} home scrolls sideways`);
    check(await small(page, 44), `${w}x${h} home controls`);
    await page.click('[data-door="piece"]');
    check(await sideways(page), `${w}x${h} start scrolls sideways`);
    check(await small(page, 44), `${w}x${h} start controls`);
    await page.click('[data-key="knight"]');
    await page.waitForSelector('.ws-editor');
    const land = h < 480 && w > h, cellMin = h < 620 || land ? 32 : 44;
    for (const n of [1, 2, 3]) {
      await tab(page, n);
      check(await sideways(page), `${w}x${h} tab ${n} scrolls sideways`);
      check(await small(page, cellMin), `${w}x${h} tab ${n} controls`);
    }
    await tab(page, 1);
    const [stage, cell] = await page.evaluate(() => [document.querySelector('.ws-stage').getBoundingClientRect().height, document.querySelector('.ws-cell').getBoundingClientRect().width]);
    if ((w === 375 && h === 660) || (w === 390 && h === 700)) check([Math.round(stage), Math.round(cell)].join() === '156,44' ? [] : [`${stage} ${cell}`], `${w}x${h} stage and cell`);
    await shot(page, `${w}x${h}-knight`);
    await page.context().close();
  }
  assert.deepEqual(issues, []);
  ok(`${SIZES.length} sizes: no sideways scroll, controls 44 px (cells 32 px where short), stage 156 and cell 44 at 375x660 and 390x700`);

  // 2. The doors: the title, the Guide and a link. Back returns to the caller; Esc closes a sheet, then the Workshop.
  let page = await open({ title: true });
  await page.waitForSelector('#title-screen[open] #title-workshop');
  await shot(page, '375x660-title');
  await page.click('#title-workshop');
  await page.waitForSelector('#workshop[open]');
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'ws-h', 'focus on the h2');
  await page.click('.ws-back');
  assert.equal(await page.evaluate(() => [!!document.querySelector('#workshop[open]'), !!document.querySelector('#title-screen[open]')].join()), 'false,true', 'Back keeps the title open');
  await page.context().close();
  page = await open({ w: 1280, h: 900, title: true });
  await page.waitForSelector('#title-screen[open] #title-workshop');
  await shot(page, '1280x900-title');
  await page.context().close();
  ok('opens from the title; focus on the h2; Back leaves the title open');

  page = await open();
  await page.evaluate(() => { window.__hl = 0; const h = window.view.highlight.bind(window.view); window.view.highlight = a => { window.__hl++; return h(a); }; });
  const before = await page.evaluate(() => [localStorage.getItem('kingdown.save'), document.getElementById('info')?.textContent].join('|'));
  await viaGuide(page);
  await editPreset(page, 'knight');
  await tab(page, 2);
  await page.click('.ws-add');
  await page.waitForSelector('.ws-sheet[open]');
  for (const k of ['z', 'ArrowLeft', 'ArrowRight']) await page.keyboard.press(k);
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(() => [!!document.querySelector('.ws-sheet[open]'), !!document.querySelector('#workshop[open]')].join()), 'false,true', 'Esc closes the sheet first');
  await tab(page, 1);
  await page.focus('.ws-board [tabindex="0"]');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowRight');
  const focusCell = await page.evaluate(() => { const e = document.activeElement; return [e.dataset.x, e.dataset.y, document.querySelectorAll('.ws-board [tabindex="0"]').length].join(); });
  assert.equal(focusCell, '1,2,1', 'the board takes arrow keys with a roving tabindex');
  const label0 = await page.getAttribute('.ws-cell[data-x="1"][data-y="2"]', 'aria-label');
  await page.keyboard.press('Enter');
  assert.notEqual(await page.getAttribute('.ws-cell[data-x="1"][data-y="2"]', 'aria-label'), label0, 'Enter paints');
  assert.equal(await page.locator('.ws-board button').count(), 49);
  assert.match(await page.getAttribute('.ws-cell[data-x="1"][data-y="2"]', 'aria-label'), /^2 up, 1 right/);
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(() => !!document.querySelector('#workshop[open]')), false, 'Esc then closes the Workshop');
  const after = await page.evaluate(() => [localStorage.getItem('kingdown.save'), document.getElementById('info')?.textContent].join('|'));
  assert.equal(after, before, 'the game behind is unchanged');
  assert.equal(await page.evaluate(() => window.__hl), 0, 'no key reached the game (no highlight redraw)');
  ok('Guide door; Esc closes the sheet, then the Workshop; z, arrows and Esc never reach the game; the board has 49 labelled buttons and roving tabindex');

  // 3. The brushes on a first phone visit: 2 and More.
  page = await open();
  await viaGuide(page);
  await editPreset(page, 'knight');
  const visibleRadios = () => page.evaluate(() => [...document.querySelectorAll('input[name="ws-brush"]')].filter(i => i.closest('label').getBoundingClientRect().width > 0).length);
  assert.equal(await visibleRadios(), 2, '2 brushes first');
  await page.click('.ws-more');
  assert.equal(await visibleRadios(), 5, 'More shows the rest');
  ok('a first phone visit shows 2 brushes and More; More shows the rest');

  // 4. Knight → Rules → Add a rule → Takes again in at most 6 actions; the gauge and the worth line react.
  await page.click('.ws-back');
  let actions = 0;
  const act = async f => { actions++; await f(); };
  await act(() => page.click('[data-door="piece"]'));
  await act(() => page.click('[data-key="knight"]'));
  const g0 = await gaugeNow(page), w0 = await page.textContent('.ws-worth');
  await act(() => tab(page, 2));
  await act(() => page.click('.ws-add'));
  await act(() => page.click('.ws-book-row[data-a="chain"]'));
  assert.ok(actions <= 6, `${actions} actions`);
  const g1 = await gaugeNow(page), w1 = await page.textContent('.ws-worth');
  assert.notEqual(g1, g0, 'aria-valuenow changes');
  assert.notEqual(w1, w0, 'the worth line changes');
  await shot(page, '375x660-hungry-rider');
  ok(`Knight + Takes again in ${actions} actions: the gauge ${g0} → ${g1}, "${w0}" → "${w1}"`);

  // 5. Rook + Takes again: "Possibly overpowered", the chip, one announcement; Undo restores it.
  await page.click('.ws-back');
  await editPreset(page, 'rook');
  await page.evaluate(() => { window.__said = []; new MutationObserver(() => window.__said.push(document.querySelector('.ws-live').textContent)).observe(document.querySelector('.ws-live'), { childList: true, characterData: true, subtree: true }); });
  const r0 = [await gaugeNow(page), await page.textContent('.ws-worth')];
  await addRule(page, 'chain');
  assert.match(await page.textContent('.ws-worth'), /Possibly overpowered/);
  assert.ok(await page.isVisible('.ws-stage .ws-chip'), 'the chip shows');
  assert.deepEqual(await page.evaluate(() => window.__said), ['About 5½ pawns. Possibly overpowered.'], 'one announcement');
  await shot(page, '375x660-rook-chain');
  await page.click('.ws-stage .ws-chip');
  await page.waitForSelector('.ws-sheet[open]');
  await shot(page, '375x660-why');
  await page.click('.ws-sheet[open] .ws-undo-last');
  assert.deepEqual([await gaugeNow(page), await page.textContent('.ws-worth')], r0, 'Undo restores the rook');
  assert.equal(await page.isVisible('.ws-stage .ws-chip'), false);
  ok('Rook + Takes again: "Possibly overpowered", the chip, one announcement; Undo restores it');

  // 6. Mix two: Knight + Guard leaves the immunity out.
  await page.click('.ws-back');
  await page.click('[data-door="piece"]');
  await page.check('.ws-mix input');
  await page.click('[data-key="knight"]');
  await page.click('[data-key="guard"]');
  await page.waitForSelector('.ws-editor');
  assert.match(await page.textContent('.ws-toast'), /^Mixed: Knight \+ Guard\. Left out: only a king can take it/);
  assert.equal((await page.textContent('.ws-tabs label:nth-child(2) span')).trim(), 'Rules', 'no rule');
  ok('Mix two: Knight + Guard shows "Left out", and the result has no rule');

  // 7. A likely-overpowered design: Mix Rook + Knight. Then Done, reload, the link.
  await page.click('.ws-back');
  await page.click('[data-door="piece"]');
  await page.check('.ws-mix input');
  await page.click('[data-key="rook"]');
  await page.click('[data-key="knight"]');
  await page.waitForSelector('.ws-editor');
  assert.match(await page.textContent('.ws-worth'), /Likely overpowered/);
  await shot(page, '375x660-likely-op');
  await page.click('.ws-done');
  await page.waitForSelector('.ws-card');
  const name = (await page.textContent('#ws-h')).trim(), worth = await page.textContent('.ws-card-worth');
  await shot(page, '375x660-saved');
  await page.click('.ws-copy');
  const text = await page.evaluate(() => navigator.clipboard.readText());
  const link = text.trim().split('\n').at(-1);
  assert.match(link, /\?design=[\w-]+$/);
  assert.match(text, /\| piece \| .* \| 5\.89 \| likely overpowered \|/);
  await page.reload();
  await page.waitForFunction(() => window.view?.ready);
  await viaGuide(page);
  assert.ok((await page.locator('.ws-tile b').allTextContents()).includes(name), 'reload keeps the design');
  await page.context().close();
  page = await open({ query: link.slice(link.indexOf('?')) });
  await page.waitForSelector('#workshop[open] .ws-card');
  assert.equal((await page.textContent('#ws-h')).trim(), name);
  assert.equal(await page.textContent('.ws-card-worth'), worth, 'the link shows the same verdict');
  assert.ok(await page.isVisible('.ws-keep-copy'));
  assert.equal(await page.evaluate(() => location.search), '', 'the link is taken out of the address');
  await page.context().close();
  ok(`Likely overpowered: ${worth}; reload keeps "${name}"; the link opens SAVED with the same verdict`);

  // 8. Try it: the knight's 8 squares; a chain asks "Take again / Finish".
  page = await open();
  await viaGuide(page);
  await editPreset(page, 'knight');
  await page.click('.ws-done');
  await page.click('.ws-try');
  await page.waitForSelector('.tb-board .tb-sq');
  assert.equal(await page.locator('.tb-sq.mk').count(), 8, 'the knight marks 8 squares');
  await page.click('.ws-back');
  await page.click('.ws-edit');
  await addRule(page, 'chain');
  await page.click('.ws-done');
  await page.click('.ws-try');
  await page.click('.tb-sq[data-sq="33"]'); // takes the bishop on b5; the pawn on d6 is next
  assert.deepEqual(await page.locator('.tb-ask button').allTextContents(), ['Take again', 'Finish']);
  await shot(page, '375x660-try-chain');
  await page.click('.tb-ask [data-again]');
  await page.click('.tb-sq.mk'); // the pawn on d6; the knight on f7 is next
  assert.equal(await page.textContent('.tb-count'), 'Move 1', 'a chain is one move');
  await page.click('.tb-ask [data-finish]');
  assert.equal(await page.textContent('.tb-count'), 'Move 2');
  await page.context().close();
  ok('Try it: the knight marks 8 squares; a chain asks Take again / Finish and takes again');

  // 9. No animation after each tap with reduced motion, and with Animations Off.
  for (const o of [{ reducedMotion: 'reduce' }, { pace: 'off' }]) {
    page = await open(o);
    await viaGuide(page);
    const still = async what => assert.equal(await page.evaluate(() => document.getAnimations().length), 0, `${JSON.stringify(o)}: ${what}`);
    await still('home');
    await page.click('[data-door="piece"]'); await still('start');
    await page.click('[data-key="beast"]'); await still('editor');
    await page.click('.ws-cell[data-x="2"][data-y="2"]'); await still('paint');
    await tab(page, 2); await still('rules');
    await page.click('.ws-add'); await still('book');
    await page.click('.ws-book-row[data-a="cannotTake"]'); await still('rule');
    await tab(page, 3); await still('look');
    await page.click('.ws-glow[data-glow="Flame"]'); await still('glow');
    await page.click('.ws-done'); await still('saved');
    await page.click('.ws-try'); await still('try');
    await page.context().close();
  }
  ok('no animation after each tap with reduced motion, and with Animations Off');

  // 10. Desktop: the three columns, the Why? sheet.
  page = await open({ w: 1280, h: 900 });
  await viaGuide(page);
  await shot(page, '1280x900-home');
  await editPreset(page, 'rook');
  await addRule(page, 'chain');
  await shot(page, '1280x900-rook-chain');
  await page.click('.ws-stage .ws-chip');
  await shot(page, '1280x900-why');
  await page.keyboard.press('Escape');
  await page.click('.ws-done');
  await page.click('.ws-try');
  await shot(page, '1280x900-try');
  await page.context().close();
  ok('desktop screenshots');

  assert.deepEqual(errors, [], 'no page or console errors');
  ok('no page or console errors');
} finally {
  await browser.close();
}
