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
/** The game menu's own Workshop button, beside Guide. */
const viaGuide = async page => {
  await page.click('#workshop-btn');
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
/** Parts of the stage drawn outside it (the chip clipped under the tabs), and a name cut with no pencil. */
const stageSpill = page => page.evaluate(() => {
  const st = document.querySelector('.ws-stage').getBoundingClientRect(), bad = [];
  for (const e of document.querySelectorAll('.ws-stage .ws-info *, .ws-stage .ws-model')) {
    const r = e.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    if (r.top < st.top - 1 || r.bottom > st.bottom + 1 || r.right > st.right + 1) bad.push(`${e.className.baseVal ?? e.className} ${Math.round(r.top)}-${Math.round(r.bottom)} outside ${Math.round(st.top)}-${Math.round(st.bottom)}`);
  }
  const pen = document.querySelector('.ws-name .icon')?.getBoundingClientRect(), row = document.querySelector('.ws-name-row').getBoundingClientRect();
  if (!pen || pen.width < 10 || pen.right > row.right + 1) bad.push('the rename pencil is hidden');
  if (parseFloat(getComputedStyle(document.querySelector('.ws-name')).fontSize) < 14) bad.push('the name is under 14 px');
  const zone = document.querySelector('.ws-stage .ws-zone')?.getBoundingClientRect(), box = document.querySelector('.ws-stage .ws-model-box').getBoundingClientRect();
  if (zone && zone.right > box.right + 1) bad.push('the zone map runs out of the model, over the name');
  if (document.querySelector('.ws-stage .ws-chip') && !document.querySelector('.ws-chip').textContent.includes('Why?')) bad.push('the chip has no Why?');
  return bad;
});
const rename = async (page, name) => { await page.click('.ws-name'); await page.fill('.ws-name-in', name); await page.keyboard.press('Enter'); };

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
    // The stage holds everything at every size: a fair piece, a likely-overpowered one with its chip, a long name.
    check(await stageSpill(page), `${w}x${h} knight stage`);
    await page.click('.ws-cell[data-x="1"][data-y="1"]');
    await addRule(page, 'chain');
    await page.click('.ws-add');
    await page.click('.ws-book-row[data-a="movesLike"]');
    await page.waitForSelector('.ws-sheet', { state: 'detached' }).catch(() => {});
    await tab(page, 1);
    await page.click('.ws-cell[data-x="0"][data-y="1"]');
    await rename(page, 'Wandering Starlit');
    check(await stageSpill(page), `${w}x${h} overpowered stage`);
    for (let i = 0; i < 5; i++) await page.click('.ws-undo');
    const [stage, cell] = await page.evaluate(() => [document.querySelector('.ws-stage').getBoundingClientRect().height, document.querySelector('.ws-cell').getBoundingClientRect().width]);
    if ((w === 375 && h === 660) || (w === 390 && h === 700)) check([Math.round(stage), Math.round(cell)].join() === '156,44' ? [] : [`${stage} ${cell}`], `${w}x${h} stage and cell`);
    await shot(page, `${w}x${h}-knight`);
    await page.context().close();
  }
  assert.deepEqual(issues, []);
  ok(`${SIZES.length} sizes: no sideways scroll, controls 44 px (cells 32 px where short), stage 156 and cell 44 at 375x660 and 390x700; the stage holds the chip with its Why?, and a long name keeps its pencil`);

  // 1b. The game menu: New game, Guide, Workshop, Settings in one row, none cut or on top of another; the Guide has no Workshop door.
  for (const [w, h] of [[320, 568], [375, 812], [568, 320], [1280, 900]]) {
    const page = await open({ w, h });
    const menu = await page.evaluate(() => [...document.querySelectorAll('nav.menu button')].map(b => { const r = b.getBoundingClientRect(), l = b.querySelector('.label'); return { t: b.textContent.trim(), x: r.left, r: r.right, y: r.top, h: r.height, w: r.width, cut: l.scrollWidth > l.clientWidth + 1 || l.getBoundingClientRect().right > r.right }; }));
    assert.deepEqual(menu.map(m => m.t), ['New game', 'Guide', 'Workshop', 'Settings']);
    for (let i = 0; i < menu.length; i++) {
      assert.ok(menu[i].w >= 44 && menu[i].h >= 44 && !menu[i].cut, `${w}x${h} ${menu[i].t}: ${JSON.stringify(menu[i])}`);
      if (i) assert.ok(menu[i].x >= menu[i - 1].r - 0.5 && menu[i].y === menu[i - 1].y, `${w}x${h} ${menu[i].t} overlaps ${menu[i - 1].t}`);
    }
    if (w === 320) await shot(page, '320x568-menu');
    if (w === 568) await shot(page, '568x320-menu');
    await page.click('#rules-btn');
    await page.waitForSelector('#rules[open]');
    assert.equal(await page.locator('#rules [id*="workshop"], #rules :text("Make your own")').count(), 0, 'the Guide holds no Workshop door');
    await page.context().close();
  }
  ok('the menu: New game, Guide, Workshop, Settings fit in one row at 320x568, 375x812, 568x320 and 1280x900; the Guide has no Workshop door');

  // 1c. A tap outside a dialog or sheet closes it, as Escape does; a drag from inside to outside does not.
  {
    const page = await open({ w: 375, h: 812 });
    const outside = async sel => { const r = await page.locator(sel).boundingBox(); return [r.x + r.width / 2, Math.max(4, r.y - 20)]; };
    const isOpen = sel => page.evaluate(s => !!document.querySelector(`${s}[open]`), sel);
    for (const id of ['settings-btn', 'rules-btn', 'new-game-btn']) {
      await page.click(`#${id}`);
      const sel = { 'settings-btn': '#settings', 'rules-btn': '#rules', 'new-game-btn': '#new-game' }[id];
      await page.waitForSelector(`${sel}[open]`);
      const box = await page.locator(sel).boundingBox();
      // A drag that starts on the dialog's text and ends on the backdrop keeps it open.
      await page.mouse.move(box.x + 30, box.y + 30); await page.mouse.down(); await page.mouse.move(box.x + 30, 4); await page.mouse.up();
      assert.equal(await isOpen(sel), true, `${sel}: a drag out keeps it open`);
      // A dialog taller than the screen has no backdrop above it: tap below or beside it instead.
      const pt = box.y > 30 ? [box.x + box.width / 2, 8] : box.x > 8 ? [3, box.y + 60] : [box.x + box.width / 2, Math.min(811, box.y + box.height + 8)];
      if (box.y > 30 || box.x > 8 || box.y + box.height < 800) { await page.mouse.click(...pt); assert.equal(await isOpen(sel), false, `${sel}: a tap outside closes it`); }
      else { await page.keyboard.press('Escape'); }
    }
    await viaGuide(page);
    await editPreset(page, 'knight');
    await tab(page, 2);
    await page.click('.ws-add');
    await page.waitForSelector('.ws-sheet[open]');
    const [x, y] = await outside('.ws-sheet[open]');
    const inner = await page.locator('.ws-sheet[open] .ws-key').boundingBox();
    await page.mouse.move(inner.x + 10, inner.y + 5); await page.mouse.down(); await page.mouse.move(x, y); await page.mouse.up();
    assert.equal(await isOpen('.ws-sheet'), true, 'a drag out of the sheet keeps it open');
    await page.mouse.click(x, y);
    assert.equal([await isOpen('.ws-sheet'), await isOpen('#workshop')].join(), 'false,true', 'a tap above the sheet closes only the sheet');
    assert.match(await page.textContent('.ws-name'), /\w/, 'the editor and its design stay');
    await page.context().close();
  }
  ok('a tap outside Settings, the Guide, New game and a Workshop sheet closes it; a drag from inside to outside does not; the editor stays');

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
  ok('the menu door; Esc closes the sheet, then the Workshop; z, arrows and Esc never reach the game; the board has 49 labelled buttons and roving tabindex');

  // 3. The brushes on a first phone visit: 2, More and "?"; More opens a sheet with every brush and Paint on, and the board stays.
  page = await open();
  await viaGuide(page);
  assert.equal(await page.locator('.ws-lead').count(), 0, 'HOME has the title only, no lead line');
  await editPreset(page, 'knight');
  const visibleRadios = () => page.evaluate(() => [...document.querySelectorAll('input[name="ws-brush"]')].filter(i => i.closest('label').getBoundingClientRect().width > 0).length);
  const boardTop = () => page.evaluate(() => Math.round(document.querySelector('.ws-board').getBoundingClientRect().top));
  assert.equal(await visibleRadios(), 2, '2 brushes first');
  assert.equal(await page.textContent('.ws-mode'), 'Move+take, all sides. Tap to add or erase.');
  const top0 = await boardTop();
  await page.click('.ws-more');
  await page.waitForSelector('.ws-sheet[open]');
  assert.equal(await page.locator('.ws-sheet[open] input[name="ws-brush-s"]').count(), 5, 'More shows every brush');
  await page.click('.ws-sheet[open] input[name="ws-brush-s"][value="shoot"] >> xpath=..');
  await page.click('.ws-sheet[open] input[name="ws-paint-s"][value="one"] >> xpath=..');
  await page.click('.ws-sheet[open] .ws-sheet-done');
  assert.equal(await page.textContent('.ws-mode'), 'Shoot, one square. Tap to add or erase.', 'the mode line names a brush whose button More hides');
  assert.equal(await boardTop(), top0, 'the board does not move');
  await page.click('.ws-more'); await page.click('.ws-sheet[open] input[name="ws-brush-s"][value="both"] >> xpath=..'); await page.click('.ws-sheet[open] input[name="ws-paint-s"][value="all"] >> xpath=..'); await page.click('.ws-sheet[open] .ws-sheet-done');
  ok('a first phone visit shows 2 brushes, More and "?"; More opens every brush and Paint on in a sheet; the mode line always says what a tap does; the board stays put');

  // 3b. One tap on a tab switches it, also while the name is being typed; the name comes back after.
  for (const n of [3, 2, 1, 3]) { await page.tap(`.ws-tabs label:nth-child(${n})`); assert.equal(await page.getAttribute('.ws-panel', 'data-tab'), ['moves', 'rules', 'look'][n - 1], `one tap on tab ${n}`); }
  await page.tap('.ws-name');
  await page.tap('.ws-tabs label:nth-child(1)');
  assert.equal(await page.getAttribute('.ws-panel', 'data-tab'), 'moves', 'one tap on a tab ends the typing and switches');
  assert.ok((await page.textContent('.ws-name')).trim().length > 0, 'the name shows again after typing ends with no change');
  // The Look tab: a glow shows as chosen and on the model at once.
  await tab(page, 3);
  await page.tap('.ws-glow[data-glow="Frost"]');
  assert.equal(await page.getAttribute('.ws-glow[data-glow="Frost"]', 'aria-pressed'), 'true');
  assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.ws-glow[data-glow="Frost"]')).boxShadow.includes('3px')), true, 'the chosen glow has the thick ring');
  assert.match(await page.evaluate(() => document.querySelector('.ws-stage .ws-model').outerHTML.slice(0, 120)), /class="ws-model glow" style="--rim:rgb\(110,196,250\)/, 'the model shows the glow at once');
  assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('#workshop h3')).fontVariantNumeric), 'lining-nums', 'headings use lining figures');
  await shot(page, '375x660-look-glow');
  ok('one tap switches a tab, also while typing the name; the name comes back; a glow shows as chosen and on the model at once; lining figures');

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
  assert.equal(await page.textContent('.ws-worth'), 'About 5½ pawns', 'one line: the chip names the label');
  assert.equal(await page.textContent('.ws-stage .ws-chip'), 'Possibly overpowered. Why?');
  assert.deepEqual(await page.evaluate(() => window.__said), ['About 5½ pawns. Possibly overpowered.'], 'one announcement');
  await shot(page, '375x660-rook-chain');
  // The rule book: the key to its numbers, plain words, and a small change shown as ¼, not 0.
  await page.click('.ws-add');
  await page.waitForSelector('.ws-sheet[open]');
  const book = await page.textContent('.ws-sheet[open]');
  assert.match(book, /The number is about how many pawns the rule adds to this piece\..*“\?” marks a guess/);
  assert.doesNotMatch(book, /capital|Cannot be taken\b/);
  assert.notEqual(await page.textContent('.ws-book-row[data-a="movesLike"] .ws-book-badge'), '+0', 'a small change is not shown as 0');
  await shot(page, '375x660-book');
  await page.keyboard.press('Escape');
  await tab(page, 1);
  await page.click('.ws-cell[data-x="1"][data-y="1"]');
  await page.click('.ws-stage .ws-chip');
  await page.waitForSelector('.ws-sheet[open]');
  assert.match(await page.textContent('.ws-sheet[open] .ws-reasons'), /Without “moves and takes 1 square diagonally”: about [\d½]+ pawns\..*Without “takes again”: about [\d½]+ pawns\./s, 'Why? compares the design with itself less each part');
  assert.match(await page.textContent('.ws-sheet[open]'), /The parts overlap, so the differences do not add up\./, 'Why? says once that the parts do not add up');
  await shot(page, '375x660-why-diag');
  await page.click('.ws-sheet[open] .ws-undo-last');
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
  assert.match(await page.textContent('.ws-stage .ws-chip'), /Likely overpowered/);
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

  // 7b. The shelf: open a design, edit it, make a copy, send the link, delete one (with its confirm).
  page = await open();
  await viaGuide(page);
  await editPreset(page, 'beast');
  await page.click('.ws-done');
  await page.click('.ws-back');
  const tiles = () => page.locator('.ws-tile b').allTextContents();
  const shelf0 = await tiles();
  await page.click('.ws-tile');
  await page.waitForSelector('.ws-card');
  const title0 = (await page.textContent('#ws-h')).trim();
  await page.click('.ws-edit');
  await rename(page, 'Shelf Test');
  await page.click('.ws-done');
  assert.equal((await page.textContent('#ws-h')).trim(), 'Shelf Test', 'Edit, then Done, shows the saved design');
  await page.click('.ws-dup');
  await page.waitForSelector('.ws-editor');
  assert.match(await page.textContent('.ws-name'), /Shelf Test copy/);
  await page.click('.ws-done');
  await page.click('.ws-send');
  assert.match(await page.evaluate(() => navigator.clipboard.readText()), /\?design=[\w-]+$/, 'Send link copies the link where the device cannot share');
  await page.click('.ws-del');
  await page.waitForSelector('.ws-sheet[open] .ws-yes');
  await page.click('.ws-sheet[open] .ws-yes');
  await page.waitForSelector('.ws-door');
  assert.deepEqual((await tiles()).sort(), ['Shelf Test'], `the copy is deleted, the first design stays (was ${shelf0} / ${title0})`);
  await page.context().close();
  ok('the shelf: open, Edit, Make a copy, Send link and Delete (with its confirm) work');

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
  const where = () => page.evaluate(() => ['.tb-board', '.tb-row'].map(s => Math.round(document.querySelector(s).getBoundingClientRect().top)).join());
  const at0 = await where();
  await page.click('.tb-sq[data-sq="33"]'); // takes the bishop on b5; the pawn on d6 is next
  assert.equal(await page.locator('.tb-sq.mk').count(), 1, 'the next take shows at once');
  assert.equal(await page.isVisible('.tb-finish'), true, 'Finish ends the chain');
  assert.equal(await page.textContent('.tb-say'), 'It may take again: tap a marked piece, or tap Finish.');
  assert.equal(await where(), at0, 'the board and the buttons stay in place');
  await shot(page, '375x660-try-chain');
  await page.click('.tb-sq.mk'); // the pawn on d6; the knight on f7 is next
  assert.equal(await page.textContent('.tb-count'), 'Move 1', 'a chain is one move');
  await page.click('.tb-finish');
  assert.equal(await page.textContent('.tb-count'), 'Move 2');
  assert.equal(await page.isVisible('.tb-finish'), false);
  assert.equal(await where(), at0);
  await page.context().close();
  ok('Try it: the knight marks 8 squares; after a take the next targets show at once, Finish ends the chain, and nothing moves on the screen');

  // 8b. The review's fixes (docs/visual-design/workshop/REVIEW-2026-10-06.md), each found failing first.
  {
    // A save the device refuses: no "saved" anywhere, an alert that stays, and no "A copy is on your shelf".
    const refuse = () => { const o = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { if (k === 'kingdown.workshop') throw new Error('full'); return o.call(this, k, v); }; };
    page = await open();
    await page.context().addInitScript(refuse); await page.reload(); await page.waitForFunction(() => window.view?.ready);
    await viaGuide(page);
    await editPreset(page, 'knight');
    await page.click('.ws-cell[data-x="1"][data-y="1"]');
    assert.match(await page.textContent('.ws-alert'), /^Not saved: this device did not keep the design\./);
    await page.click('.ws-done');
    await page.waitForSelector('.ws-card');
    assert.equal(await page.locator('.ws-saved-note').count(), 0, 'SAVED does not say saved');
    assert.match(await page.textContent('.ws-lead'), /Custom pieces cannot join games yet\./);
    await shot(page, '375x660-not-saved');
    await page.click('.ws-dup');
    await page.waitForSelector('.ws-editor');
    assert.notEqual(await page.textContent('.ws-toast'), 'A copy is on your shelf.');
    assert.equal(await page.isVisible('.ws-alert'), true, 'the alert stays');
    await page.context().close();
    ok('a save the device refuses says so and keeps saying so; nothing claims it was saved');

    // A full shelf: nothing is dropped; the player deletes one, and the open design is saved.
    page = await open();
    await page.evaluate(() => {
      const d = n => ({ v: 1, kind: 'piece', id: `s${n}`, name: `Seed ${n}`, named: true, look: { body: 'N', auto: false, glow: null, army: 0 }, letter: 'D', squares: [{ x: 1, y: 2, mark: 'both' }], lines: [], rules: [], from: [], updated: 1000 + n });
      localStorage.setItem('kingdown.workshop', JSON.stringify({ v: 1, designs: [...Array.from({ length: 50 }, (_, i) => d(50 - i)), { kind: 'piece', id: 'broken' }] }));
    });
    await viaGuide(page);
    assert.match(await page.textContent('.ws-scroll'), /1 saved entry could not be read\. It stays on this device/, 'HOME names the damaged entry and shows the rest');
    assert.equal(await page.locator('.ws-tile').count(), 50);
    await editPreset(page, 'knight');
    await page.click('.ws-cell[data-x="1"][data-y="1"]');
    const ids = () => page.evaluate(() => JSON.parse(localStorage.getItem('kingdown.workshop')).designs.map(d => d.id));
    assert.match(await page.textContent('.ws-alert'), /your shelf is full \(50 designs\)/);
    assert.ok((await ids()).includes('s1'), 'the oldest design stays');
    await page.click('.ws-alert-del');
    await page.click('.ws-sheet[open] .ws-room-del[data-id="s1"]');
    const after = await ids();
    assert.equal(after.filter(x => x.startsWith('s')).length, 49);
    assert.equal(after.length, 51, '49 seeds, the new design and the damaged entry');
    assert.equal(await page.isVisible('.ws-alert'), false);
    await page.context().close();
    ok('a full shelf drops nothing: the player deletes one in a sheet and the open design is saved; a damaged entry stays and is named');

    // Copy where the device refuses: a sheet with the text, selected.
    page = await open();
    await page.evaluate(() => { navigator.clipboard.writeText = () => Promise.reject(new Error('denied')); });
    await viaGuide(page);
    await editPreset(page, 'knight');
    await page.click('.ws-done');
    await page.click('.ws-copy');
    await page.waitForSelector('.ws-sheet[open] .ws-copy-box');
    assert.match(await page.inputValue('.ws-sheet[open] .ws-copy-box'), /\?design=[\w-]+$/);
    await page.keyboard.press('Escape');
    // The exact list of squares, the pictures' labels.
    await page.click('.ws-every summary');
    assert.equal((await page.locator('.ws-every li').allTextContents()).length, 8);
    assert.equal(await page.textContent('.ws-pat figcaption'), 'Base moves');
    await shot(page, '375x660-saved-every');
    await page.context().close();
    ok('where the device cannot copy, a sheet shows the text to copy by hand; SAVED lists every square and labels its picture');

    // Ctrl+Z in a sheet does nothing; the arrow keys move a choice and Enter commits it; the sheet acts on its own rule.
    page = await open({ w: 1280, h: 900 });
    await viaGuide(page);
    await editPreset(page, 'knight');
    await tab(page, 2);
    await page.click('.ws-add');
    await page.click('.ws-book-row[data-a="movesLike"]');
    await page.click('.ws-pill[data-pill="when"]');
    await page.waitForSelector('.ws-sheet[open]');
    await page.keyboard.press('Control+z');
    assert.equal(await page.locator('.ws-rule').count(), 1, 'the undo key does not reach the editor under a sheet');
    await page.focus('.ws-sheet[open] input[type="radio"]:checked');
    await page.keyboard.press('ArrowDown');
    assert.equal(await page.evaluate(() => !!document.querySelector('.ws-sheet[open]')), true, 'an arrow key only moves the choice');
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => !!document.querySelector('.ws-sheet[open]')), false, 'Enter commits it');
    assert.match(await page.textContent('.ws-rule'), /In the enemy half/);
    // A stroke ends when the button is released off the board.
    await tab(page, 1);
    const cell = async (x, y) => { const b = await page.locator(`.ws-cell[data-x="${x}"][data-y="${y}"]`).boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2]; };
    const labels = () => page.evaluate(() => [...document.querySelectorAll('.ws-cell')].map(b => b.getAttribute('aria-label')).join('|'));
    await page.mouse.move(...await cell(1, 1)); await page.mouse.down(); await page.mouse.move(640, 890); await page.mouse.up();
    const l0 = await labels();
    await page.mouse.move(...await cell(3, 0)); await page.mouse.move(...await cell(-3, 3));
    assert.equal(await labels(), l0, 'no painting after a release off the board');
    await page.context().close();
    ok('Ctrl+Z stays out of a sheet; arrows move a choice and Enter commits it; a stroke released off the board ends');

    // A press on a dialog's padding that ends on the backdrop keeps it open.
    page = await open({ w: 375, h: 812 });
    await page.click('#settings-btn');
    const b = await page.locator('#settings').boundingBox();
    await page.mouse.move(b.x + 3, b.y + 3); await page.mouse.down(); await page.mouse.move(b.x + 3, Math.max(2, b.y - 10)); await page.mouse.up();
    assert.equal(await page.evaluate(() => !!document.querySelector('#settings[open]')), true);
    await page.context().close();
    ok('a drag from a dialog\'s padding to the backdrop keeps it open');

    // Try it: push or take asks; arrow keys, focus on the landing square, the move announced; a Safe rule in its own words.
    page = await open();
    await viaGuide(page);
    await editPreset(page, 'ogre');
    await page.click('.ws-done');
    await page.click('.ws-try');
    assert.equal(await page.locator('.tb-sq:not([tabindex="-1"])').count(), 1, 'one tab stop');
    await page.focus('.tb-sq[tabindex="0"]');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => document.activeElement.dataset.sq), '35', 'focus on the landing square');
    assert.equal(await page.textContent('.tb-live'), 'Moved to d5.');
    assert.match(await page.getAttribute('.tb-sq[data-sq="43"]', 'aria-label'), /take or push/);
    await page.click('.tb-sq[data-sq="43"]');
    assert.deepEqual(await page.locator('.tb-ask button').allTextContents(), ['Take', 'Push']);
    await shot(page, '375x660-try-choice');
    await page.click('.tb-ask button:text("Take")');
    assert.equal(await page.textContent('.tb-live'), 'Took the enemy pawn on d6.');
    assert.match(await page.getAttribute('.tb-sq[data-sq="43"]', 'aria-label'), /your piece/);
    await page.click('.ws-back'); await page.click('.ws-back');
    await editPreset(page, 'guard');
    await page.click('.ws-done');
    await page.click('.ws-try');
    assert.equal(await page.textContent('.tb-safe'), 'It cannot be taken by anything but a king. That holds now. The other side never moves, so Try it cannot test this rule.');
    await page.context().close();
    ok('Try it: a square with push and take asks which one; one tab stop, arrows, focus on the landing square, each move announced; a Safe rule in its own words');

    // A Pawn keeps its own words; a saved Paladin's warning opens "Why this warning?".
    page = await open();
    await viaGuide(page);
    await editPreset(page, 'pawn');
    assert.equal(await page.textContent('.ws-worth'), 'About 1 pawn · The unit of worth');
    await page.click('.ws-back');
    await editPreset(page, 'paladin');
    await page.click('.ws-done');
    await page.click('.ws-chip');
    assert.equal(await page.textContent('.ws-sheet[open] h2'), 'Why this warning?');
    await page.context().close();
    ok('an unchanged Pawn keeps its own words; the Why? title follows the verdict on SAVED');

    // Phone landscape: the whole board, the brushes beside it.
    page = await open({ w: 568, h: 320 });
    await viaGuide(page);
    await editPreset(page, 'knight');
    assert.equal(await page.evaluate(() => [...document.querySelectorAll('.ws-cell')].filter(c => { const r = c.getBoundingClientRect(); return r.top < 0 || r.bottom > innerHeight + 0.5 || r.right > innerWidth + 0.5; }).length), 0, 'every cell on screen at 568x320');
    assert.equal(await page.isVisible('.ws-mode'), true);
    await shot(page, '568x320-moves');
    await page.context().close();
    ok('at 568x320 the whole board shows, with the brushes and the mode line beside it');
  }

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
  assert.equal(await page.evaluate(() => document.activeElement.classList.contains('ws-side')), true, 'Why? on desktop moves focus to the side panel, which already shows the reasons');
  await shot(page, '1280x900-why');
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
