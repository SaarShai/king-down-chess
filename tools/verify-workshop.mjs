// The Workshop in a real browser (docs/WORKSHOP.md §8.5): the layout at every size, the doors in
// and Back out, the keys, the brushes, the judge's live reactions, Mix two, reload, the link, the
// motion rules and Try it. Screenshots go to a temporary directory.
// Needs a running build: PLAYABLE_URL=http://127.0.0.1:5189/ node tools/verify-workshop.mjs
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';

const base = process.env.PLAYABLE_URL || 'http://127.0.0.1:5189/';
const out = mkdtempSync('/tmp/workshop-checks-');
console.log(`screenshots ${out}`);
const browser = await chromium.launch({ headless: true, channel: process.env.PLAYABLE_BROWSER || 'chrome' });
const errors = [];
const ok = msg => console.log(`ok ${msg}`);
const SIZES = [[320, 568], [328, 568], [375, 667], [375, 812], [390, 844], [568, 320], [768, 1024], [1280, 900], [375, 553], [375, 660], [390, 700], [568, 270]];

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
const chooser = '.ws-sheet:not(.ws-edit-sheet)[open]';
const viaMenu = async page => {
  await page.click('#workshop-btn');
  await page.waitForSelector('#workshop[open] .ws-door');
};
const closePart = async page => {
  if (await page.locator('.ws-edit-sheet[open]').count()) {
    await page.click('.ws-edit-done');
    await page.waitForSelector('.ws-edit-sheet[open]', { state: 'hidden' });
  }
};
const part = async (page, name) => {
  if (await page.locator('.ws-edit-sheet[open]').count() && await page.getAttribute('.ws-panel', 'data-tab') === name) return;
  await closePart(page);
  await page.click(`[data-editor="${name}"]`);
  await page.waitForSelector(`.ws-edit-sheet[open] .ws-panel[data-tab="${name}"]`);
};
const tab = (page, n) => part(page, ['moves', 'rules', 'look'][n - 1]);
const editPreset = async (page, key) => {
  await page.click('[data-door="piece"]'); await page.click(`[data-key="${key}"]`);
  await page.waitForSelector('.ws-piece-card'); await part(page, 'moves');
};
const back = async page => { await closePart(page); await page.click('.ws-back'); };
const shareAction = async (page, action) => {
  await closePart(page); await page.click('.ws-share');
  await page.click(`${chooser} .ws-${action}`);
};
const addRule = async (page, a) => { await part(page, 'rules'); await page.click('.ws-add'); await page.click(`.ws-book-row[data-a="${a}"]`); await page.waitForSelector(chooser, { state: 'detached' }); };
const gaugeNow = page => page.getAttribute('.ws-piece-card .ws-gauge', 'aria-valuenow');
const shot = async (page, name) => {
  await page.waitForFunction(() => [...document.querySelectorAll('#workshop img')].every(i => i.complete));
  await page.screenshot({ path: `${out}/${name}.jpg`, type: 'jpeg', quality: 86 });
};
/** Sideways scroll on the page or in any scroll area of the Workshop. */
const sideways = page => page.evaluate(() => [document.documentElement, ...document.querySelectorAll('#workshop, #workshop .ws-scroll, #workshop .ws-panel, #workshop .ws-screen, #workshop .ws-sheet, #workshop .ws-workspace')]
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
/** The card stays readable; the complete move board fits the active editing surface. */
const cardSpill = page => page.evaluate(() => {
  const card = document.querySelector('.ws-piece-card').getBoundingClientRect(), bad = [];
  for (const sel of ['.ws-model-box', '.ws-name-row', '.ws-worth', '.ws-bottom']) {
    const r = document.querySelector(sel).getBoundingClientRect();
    if (r.left < card.left - 1 || r.right > card.right + 1) bad.push(`${sel} outside card`);
  }
  const pen = document.querySelector('.ws-name .icon')?.getBoundingClientRect(), row = document.querySelector('.ws-name-row').getBoundingClientRect();
  if (!pen || pen.width < 10 || pen.right > row.right + 1) bad.push('the rename pencil is hidden');
  if (parseFloat(getComputedStyle(document.querySelector('.ws-name')).fontSize) < 14) bad.push('the name is under 14 px');
  return bad;
});
const boardSpill = page => page.evaluate(() => {
  const sheet = document.querySelector('.ws-edit-sheet').getBoundingClientRect();
  return [...document.querySelectorAll('.ws-cell')].filter(c => {
    const r = c.getBoundingClientRect();
    return r.left < Math.max(0, sheet.left) - 1 || r.top < Math.max(0, sheet.top) - 1 || r.bottom > Math.min(innerHeight, sheet.bottom) + 1 || r.right > Math.min(innerWidth, sheet.right) + 1;
  }).map(c => c.getAttribute('aria-label'));
});
const rename = async (page, name) => { await closePart(page); await page.click('.ws-name'); await page.fill('.ws-name-in', name); await page.keyboard.press('Enter'); };

try {
  // Card-first layout: every editing surface, including short phone landscape.
  const issues = [], check = (got, what) => { if (got.length) issues.push(`${what}: ${got.join('; ')}`); };
  for (const [w, h] of SIZES) {
    const page = await open({ w, h });
    await viaMenu(page);
    check(await sideways(page), `${w}x${h} home overflow`);
    check(await small(page, 44), `${w}x${h} home controls`);
    await page.click('[data-door="piece"]');
    check(await sideways(page), `${w}x${h} start overflow`);
    check(await small(page, 44), `${w}x${h} start controls`);
    await page.click('[data-key="knight"]');
    await page.waitForSelector('.ws-piece-card');
    assert.equal(await page.locator('.ws-edit-sheet[open]').count(), w > 720 ? 1 : 0, `${w}x${h} desktop inline / phone card`);
    if (w > 720) {
      const card = await page.locator('.ws-piece-card').boundingBox(), editor = await page.locator('.ws-edit-sheet').boundingBox();
      assert.ok(editor.x >= card.x + card.width - 1, `${w}x${h} the editor is beside the card`);
      assert.equal(await page.getAttribute('.ws-edit-sheet', 'data-inline'), 'true');
    }
    for (const action of ['.ws-try', '.ws-share']) {
      const r = await page.locator(action).boundingBox();
      assert.ok(r && r.y >= 0 && r.y + r.height <= h, `${w}x${h} ${action} visible`);
    }
    check(await cardSpill(page), `${w}x${h} card`);
    const cellMin = h < 300 ? 28 : h < 620 || w > h ? 32 : 44;
    for (const name of ['moves', 'rules', 'look']) {
      await part(page, name);
      assert.equal(await page.locator('.ws-edit-sheet:modal').count(), w > 720 ? 0 : 1, 'only the phone editor is modal');
      check(await sideways(page), `${w}x${h} ${name} overflow`);
      check(await small(page, cellMin), `${w}x${h} ${name} controls`);
      if (name === 'moves') {
        assert.equal(await page.locator('.ws-cell').count(), 49);
        check(await boardSpill(page), `${w}x${h} complete board`);
      }
    }
    await part(page, 'moves');
    await page.click('.ws-cell[data-x="1"][data-y="1"]');
    await addRule(page, 'chain');
    await page.click('.ws-add'); await page.click('.ws-book-row[data-a="movesLike"]');
    await page.waitForSelector(chooser, { state: 'detached' });
    await rename(page, 'Wandering Starlit');
    check(await cardSpill(page), `${w}x${h} long name and warning`);
    check(await sideways(page), `${w}x${h} warning card overflow`);
    await shot(page, `${w}x${h}-card`);
    await page.context().close();
  }
  assert.deepEqual(issues, []);
  ok(`${SIZES.length} sizes: card, editors, complete 7x7 board, 44 px controls and readable long names/warnings`);

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
    await viaMenu(page);
    await editPreset(page, 'knight');
    await tab(page, 2);
    await page.click('.ws-add');
    await page.waitForSelector('.ws-sheet:not(.ws-edit-sheet)[open]');
    const [x, y] = await outside('.ws-sheet:not(.ws-edit-sheet)[open]');
    const inner = await page.locator('.ws-sheet:not(.ws-edit-sheet)[open] .ws-key').boundingBox();
    await page.mouse.move(inner.x + 10, inner.y + 5); await page.mouse.down(); await page.mouse.move(x, y); await page.mouse.up();
    assert.equal(await isOpen('.ws-sheet:not(.ws-edit-sheet)'), true, 'a drag out of the sheet keeps it open');
    await page.mouse.click(x, y);
    assert.equal([await isOpen('.ws-sheet:not(.ws-edit-sheet)'), await isOpen('.ws-edit-sheet'), await isOpen('#workshop')].join(), 'false,true,true', 'a tap above the chooser leaves the editor and card open');
    assert.match(await page.textContent('.ws-name'), /\w/, 'the editor and its design stay');
    await page.context().close();
  }
  ok('a tap outside Settings, the Guide, New game and a Workshop sheet closes it; a drag from inside to outside does not; the editor stays');

  // 2. The doors: the title, the menu and a link. Back returns to the caller; Esc closes a sheet, then the Workshop.
  let page = await open({ title: true });
  await page.waitForSelector('#title-screen[open] #title-workshop');
  await shot(page, '375x660-title');
  await page.click('#title-workshop');
  await page.waitForSelector('#workshop[open]');
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'ws-h', 'focus on the h2');
  await back(page);
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
  await viaMenu(page);
  await editPreset(page, 'knight');
  await tab(page, 2);
  await page.click('.ws-add');
  await page.waitForSelector('.ws-sheet:not(.ws-edit-sheet)[open]');
  for (const k of ['z', 'ArrowLeft', 'ArrowRight']) await page.keyboard.press(k);
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(() => [!!document.querySelector('.ws-sheet:not(.ws-edit-sheet)[open]'), !!document.querySelector('#workshop[open]')].join()), 'false,true', 'Esc closes the sheet first');
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
  assert.equal(await page.locator('.ws-edit-sheet[open]').count(), 0, 'Escape closes the phone editor first');
  assert.equal(await page.locator('#workshop[open]').count(), 1);
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(() => !!document.querySelector('#workshop[open]')), false, 'Esc then closes the Workshop');
  const after = await page.evaluate(() => [localStorage.getItem('kingdown.save'), document.getElementById('info')?.textContent].join('|'));
  assert.equal(after, before, 'the game behind is unchanged');
  assert.equal(await page.evaluate(() => window.__hl), 0, 'no key reached the game (no highlight redraw)');
  ok('the menu door; Esc closes the chooser, editor, then Workshop; z, arrows and Esc never reach the game; the board has 49 labelled buttons and roving tabindex');

  // The action and scope are explicit controls; changing them never moves the board.
  page = await open();
  await viaMenu(page);
  assert.equal(await page.locator('.ws-lead').count(), 0, 'HOME has no lead line');
  assert.equal(await page.locator('.ws-door:disabled').count(), 0, 'no large unavailable card action');
  await editPreset(page, 'knight');
  const boardBounds = () => page.locator('.ws-board').boundingBox();
  const top0 = await boardBounds();
  assert.equal(await page.locator('[name="ws-brush"] option').count(), 5);
  await page.selectOption('[name="ws-brush"]', 'shoot');
  await page.selectOption('[name="ws-paint"]', 'one');
  assert.equal(await page.inputValue('[name="ws-brush"]'), 'shoot');
  assert.equal(await page.inputValue('[name="ws-paint"]'), 'one');
  assert.match(await page.textContent('.ws-mode'), /takes an enemy there and stays where it is/);
  assert.deepEqual(await boardBounds(), top0, 'changing action/scope does not move the board');
  await page.selectOption('[name="ws-brush"]', 'both');
  await page.selectOption('[name="ws-paint"]', 'all');
  for (const name of ['look', 'rules', 'moves', 'look']) {
    await closePart(page); await page.tap(`[data-editor="${name}"]`);
    assert.equal(await page.getAttribute('.ws-panel', 'data-tab'), name, `one tap opens ${name}`);
  }
  await closePart(page); await page.tap('.ws-name');
  await page.tap('[data-editor="moves"]');
  assert.equal(await page.getAttribute('.ws-panel', 'data-tab'), 'moves', 'one tap ends name input and opens the editor');
  assert.ok((await page.textContent('.ws-name')).trim().length > 0, 'an unchanged name remains visible');
  await part(page, 'look');
  await page.tap('.ws-glow[data-glow="Frost"]');
  assert.equal(await page.getAttribute('.ws-glow[data-glow="Frost"]', 'aria-pressed'), 'true');
  assert.equal(await page.locator('.ws-piece-card .ws-model.glow').count(), 1, 'the card model shows the glow at once');
  assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('#workshop h3')).fontVariantNumeric), 'lining-nums');
  await shot(page, '375x660-look-glow');
  ok('explicit action and scope, stable board, one-tap editing, unchanged name and immediate glow');

  // 4. Knight → Rules → Add a rule → Takes again in at most 6 actions; the gauge and the worth line react.
  await back(page);
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
  await back(page);
  await editPreset(page, 'rook');
  await page.evaluate(() => { window.__said = []; new MutationObserver(() => window.__said.push(document.querySelector('.ws-live').textContent)).observe(document.querySelector('.ws-live'), { childList: true, characterData: true, subtree: true }); });
  const r0 = [await gaugeNow(page), await page.textContent('.ws-worth')];
  await addRule(page, 'chain');
  assert.equal(await page.textContent('.ws-worth'), 'Estimated worth · 5½ pawns', 'estimate is shown beside the warning');
  assert.equal(await page.textContent('.ws-piece-card .ws-chip'), 'Possibly overpowered. Why?');
  assert.deepEqual(await page.evaluate(() => window.__said), ['About 5½ pawns. Possibly overpowered.'], 'one announcement');
  await shot(page, '375x660-rook-chain');
  // The rule book: the key to its numbers, plain words, and a small change shown as ¼, not 0.
  await page.click('.ws-add');
  await page.waitForSelector('.ws-sheet:not(.ws-edit-sheet)[open]');
  const book = await page.textContent('.ws-sheet:not(.ws-edit-sheet)[open]');
  assert.match(book, /The number is about how many pawns the rule adds to this piece\..*“\?” marks a guess/);
  assert.doesNotMatch(book, /capital|Cannot be taken\b/);
  assert.notEqual(await page.textContent('.ws-book-row[data-a="movesLike"] .ws-book-badge'), '+0', 'a small change is not shown as 0');
  await shot(page, '375x660-book');
  await page.keyboard.press('Escape');
  await tab(page, 1);
  await page.click('.ws-cell[data-x="1"][data-y="1"]');
  await closePart(page); await page.click('.ws-piece-card .ws-chip');
  await page.waitForSelector('.ws-sheet:not(.ws-edit-sheet)[open]');
  assert.match(await page.textContent('.ws-sheet:not(.ws-edit-sheet)[open] .ws-reasons'), /Without “moves and takes 1 square diagonally”: about [\d½]+ pawns\..*Without “takes again”: about [\d½]+ pawns\./s, 'Why? compares the design with itself less each part');
  assert.match(await page.textContent('.ws-sheet:not(.ws-edit-sheet)[open]'), /The parts overlap, so the differences do not add up\./, 'Why? says once that the parts do not add up');
  await shot(page, '375x660-why-diag');
  await page.click('.ws-sheet:not(.ws-edit-sheet)[open] .ws-undo-last');
  await closePart(page); await page.click('.ws-piece-card .ws-chip');
  await page.waitForSelector('.ws-sheet:not(.ws-edit-sheet)[open]');
  await shot(page, '375x660-why');
  await page.click('.ws-sheet:not(.ws-edit-sheet)[open] .ws-undo-last');
  assert.deepEqual([await gaugeNow(page), await page.textContent('.ws-worth')], r0, 'Undo restores the rook');
  assert.equal(await page.isVisible('.ws-piece-card .ws-chip'), false);
  ok('Rook + Takes again: "Possibly overpowered", the chip, one announcement; Undo restores it');

  // 6. Mix two: Knight + Guard leaves the immunity out.
  await back(page);
  await page.click('[data-door="piece"]');
  await page.check('.ws-mix input');
  await page.click('[data-key="knight"]');
  await page.click('[data-key="guard"]');
  await page.waitForSelector('.ws-piece-card');
  assert.match(await page.textContent('.ws-toast'), /^Mixed: Knight \+ Guard\. Left out: only a king can take it/);
  assert.match(await page.textContent('.ws-card-rules'), /0 of 3/, 'no rule');
  ok('Mix two: Knight + Guard shows "Left out", and the result has no rule');

  // 7. A likely-overpowered design: Mix Rook + Knight; share, reload and follow the link.
  await back(page);
  await page.click('[data-door="piece"]');
  await page.check('.ws-mix input');
  await page.click('[data-key="rook"]');
  await page.click('[data-key="knight"]');
  await page.waitForSelector('.ws-piece-card');
  assert.match(await page.textContent('.ws-piece-card .ws-chip'), /Likely overpowered/);
  await shot(page, '375x660-likely-op');
  await closePart(page);
  await page.waitForSelector('.ws-piece-card');
  const name = (await page.textContent('.ws-name-t')).trim(), worth = await page.textContent('.ws-worth');
  await shot(page, '375x660-saved');
  await shareAction(page, 'copy');
  const text = await page.evaluate(() => navigator.clipboard.readText());
  const link = text.trim().split('\n').at(-1);
  assert.match(link, /\?design=[\w-]+$/);
  assert.match(text, /\| piece \| .* \| 5\.89 \| likely overpowered \|/);
  await page.reload();
  await page.waitForFunction(() => window.view?.ready);
  await viaMenu(page);
  assert.ok((await page.locator('.ws-tile b').allTextContents()).includes(name), 'reload keeps the design');
  await page.context().close();
  page = await open({ query: link.slice(link.indexOf('?')) });
  await page.waitForSelector('#workshop[open] .ws-piece-card');
  assert.equal((await page.textContent('.ws-name-t')).trim(), name);
  assert.equal(await page.textContent('.ws-worth'), worth, 'the link shows the same verdict');
  assert.ok(await page.isVisible('.ws-keep-copy'));
  assert.equal(await page.locator('[data-editor], .ws-edit-sheet').count(), 0, 'incoming designs have no editing controls');
  assert.equal(await page.isDisabled('.ws-name'), true);
  assert.equal(await page.evaluate(() => localStorage.getItem('kingdown.workshop')), null, 'opening a link does not save it');
  await page.click('.ws-try'); await back(page);
  assert.equal(await page.evaluate(() => localStorage.getItem('kingdown.workshop')), null, 'trying a shared design does not save it');
  await page.click('.ws-keep-copy');
  assert.equal(await page.locator('[data-editor="moves"]').count(), 1, 'keeping a copy enables editing');
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('kingdown.workshop')).designs.length), 1);
  assert.equal(await page.evaluate(() => location.search), '', 'the link is taken out of the address');
  await page.context().close();
  ok(`Likely overpowered: ${worth}; reload keeps "${name}"; the link opens the read-only card with the same verdict`);

  // 7b. The shelf: open a design, edit it, make a copy, send the link, delete one (with its confirm).
  page = await open();
  await viaMenu(page);
  await editPreset(page, 'beast');
  await closePart(page);
  await back(page);
  const tiles = () => page.locator('.ws-tile b').allTextContents();
  const shelf0 = await tiles();
  await page.click('.ws-tile');
  await page.waitForSelector('.ws-piece-card');
  const title0 = (await page.textContent('.ws-name-t')).trim();

  await rename(page, 'Shelf Test');
  await closePart(page);
  assert.equal((await page.textContent('.ws-name-t')).trim(), 'Shelf Test', 'renaming immediately updates the card');
  await shareAction(page, 'dup');
  await page.waitForSelector('.ws-piece-card');
  assert.match(await page.textContent('.ws-name'), /Shelf Test copy/);
  await closePart(page);
  await shareAction(page, 'send');
  assert.match(await page.evaluate(() => navigator.clipboard.readText()), /\?design=[\w-]+$/, 'Send link copies the link where the device cannot share');
  await shareAction(page, 'del');
  await page.waitForSelector('.ws-sheet:not(.ws-edit-sheet)[open] .ws-yes');
  await page.click('.ws-sheet:not(.ws-edit-sheet)[open] .ws-yes');
  await page.waitForSelector('.ws-door');
  assert.deepEqual((await tiles()).sort(), ['Shelf Test'], `the copy is deleted, the first design stays (was ${shelf0} / ${title0})`);
  await page.context().close();
  ok('the shelf: open, rename, Make a copy, Send link and Delete (with its confirm) work');

  // Try/Share keep the edit state and undo history for every edit surface.
  for (const w of [390, 1280]) {
    page = await open({ w, h: 900 });
    await viaMenu(page);
    for (const name of ['moves', 'rules', 'look']) {
      await editPreset(page, 'knight');
      await rename(page, `Undo ${name}`);
      const design = () => page.evaluate(n => {
        const { updated, ...d } = JSON.parse(localStorage.getItem('kingdown.workshop')).designs.find(d => d.name === `Undo ${n}`);
        return d;
      }, name);
      const original = await design(), worth = await page.textContent('.ws-worth');
      await part(page, name);
      if (name === 'moves') await page.click('.ws-cell[data-x="1"][data-y="1"]');
      if (name === 'rules') await addRule(page, 'chain');
      if (name === 'look') await page.click('.ws-glow[data-glow="Frost"]');
      assert.notDeepEqual(await design(), original, `${name}: edit changes the design`);
      assert.equal(await page.textContent('.ws-name-t'), `Undo ${name}`, 'an explicit name survives changes');
      await shareAction(page, 'copy-link');
      assert.match(await page.evaluate(() => navigator.clipboard.readText()), /\?design=[\w-]+$/);
      await page.click('.ws-try'); await page.waitForSelector('.tb-board');
      await back(page);
      assert.equal(await page.getAttribute('.ws-panel', 'data-tab'), name, 'Try returns to the same editing part');
      await part(page, name);
      assert.equal(await page.isDisabled('.ws-undo'), false, 'Undo survives Try and Share');
      await page.click('.ws-undo');
      assert.deepEqual(await design(), original, `${w} ${name}: Undo restores exactly the previous design`);
      assert.equal(await page.textContent('.ws-worth'), worth);
      await back(page);
    }
    await page.context().close();
  }
  ok('phone and desktop: Moves, Rules and Look edits survive Share/Try/Back; Undo restores the design and worth');

  // 8. Try it: the knight's 8 squares; a chain asks "Take again / Finish".
  page = await open();
  await viaMenu(page);
  await editPreset(page, 'knight');
  await closePart(page);
  await page.click('.ws-try');
  await page.waitForSelector('.tb-board .tb-sq');
  assert.equal(await page.locator('.tb-sq.mk').count(), 8, 'the knight marks 8 squares');
  await back(page);

  await addRule(page, 'chain');
  await closePart(page);
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
    const refuse = () => { const o = Storage.prototype.setItem; window.__wsSetItem = o; Storage.prototype.setItem = function (k, v) { if (k === 'kingdown.workshop') throw new Error('full'); return o.call(this, k, v); }; };
    page = await open();
    await page.context().addInitScript(refuse); await page.reload(); await page.waitForFunction(() => window.view?.ready);
    await viaMenu(page);
    await editPreset(page, 'knight');
    await page.click('.ws-cell[data-x="1"][data-y="1"]');
    assert.match(await page.textContent('.ws-alert'), /^Not saved: this device did not keep the design\./);
    const alertBox = await page.locator('.ws-alert').boundingBox();
    assert.ok(alertBox && alertBox.y >= 0 && alertBox.y + alertBox.height <= 660, 'save failure is visible inside the phone editor');
    assert.deepEqual(await boardSpill(page), [], 'save failure leaves the full board visible');
    await closePart(page);
    await page.waitForSelector('.ws-piece-card');
    assert.doesNotMatch(await page.textContent('.ws-save-state'), /^Saved/, 'failed storage never claims success');
    assert.equal(await page.textContent('.ws-save-state'), 'Not saved');
    await shot(page, '375x660-not-saved');
    await shareAction(page, 'dup');
    await page.waitForSelector('.ws-piece-card');
    assert.notEqual(await page.textContent('.ws-toast'), 'A copy is on your shelf.');
    assert.equal(await page.isVisible('.ws-alert'), true, 'the alert stays');
    await page.click('.ws-try'); await back(page);
    assert.equal(await page.isVisible('.ws-alert'), true, 'failure survives Try and return');
    await page.evaluate(() => { Storage.prototype.setItem = window.__wsSetItem; });
    await page.click('.ws-alert-retry');
    assert.equal(await page.isVisible('.ws-alert'), false, 'Retry clears the alert only after storage succeeds');
    assert.equal(await page.textContent('.ws-save-state'), 'Saved on this device');
    await page.context().close();
    ok('a save the device refuses says so and keeps saying so; nothing claims it was saved');

    // A full shelf: nothing is dropped; the player deletes one, and the open design is saved.
    page = await open();
    await page.evaluate(() => {
      const d = n => ({ v: 1, kind: 'piece', id: `s${n}`, name: `Seed ${n}`, named: true, look: { body: 'N', auto: false, glow: null, army: 0 }, letter: 'D', squares: [{ x: 1, y: 2, mark: 'both' }], lines: [], rules: [], from: [], updated: 1000 + n });
      localStorage.setItem('kingdown.workshop', JSON.stringify({ v: 1, designs: [...Array.from({ length: 50 }, (_, i) => d(50 - i)), { kind: 'piece', id: 'broken' }] }));
    });
    await viaMenu(page);
    assert.match(await page.textContent('.ws-scroll'), /1 saved entry could not be read\. It stays on this device/, 'HOME names the damaged entry and shows the rest');
    assert.equal(await page.locator('.ws-tile').count(), 50);
    await editPreset(page, 'knight');
    await page.click('.ws-cell[data-x="1"][data-y="1"]');
    const ids = () => page.evaluate(() => JSON.parse(localStorage.getItem('kingdown.workshop')).designs.map(d => d.id));
    assert.match(await page.textContent('.ws-alert'), /your shelf is full \(50 designs\)/);
    assert.ok((await ids()).includes('s1'), 'the oldest design stays');
    await page.click('.ws-alert-del');
    await page.click('.ws-sheet:not(.ws-edit-sheet)[open] .ws-room-del[data-id="s1"]');
    const after = await ids();
    assert.equal(after.filter(x => x.startsWith('s')).length, 49);
    assert.equal(after.length, 51, '49 seeds, the new design and the damaged entry');
    assert.equal(await page.isVisible('.ws-alert'), false);
    await page.context().close();
    ok('a full shelf drops nothing: the player deletes one in a sheet and the open design is saved; a damaged entry stays and is named');

    // Copy where the device refuses: a sheet with the text, selected.
    page = await open();
    await page.evaluate(() => { navigator.clipboard.writeText = () => Promise.reject(new Error('denied')); });
    await viaMenu(page);
    await editPreset(page, 'knight');
    await closePart(page);
    await shareAction(page, 'copy');
    await page.waitForSelector('.ws-sheet:not(.ws-edit-sheet)[open] .ws-copy-box');
    assert.match(await page.inputValue('.ws-sheet:not(.ws-edit-sheet)[open] .ws-copy-box'), /\?design=[\w-]+$/);
    await page.keyboard.press('Escape');
    // The exact list of squares, the pictures' labels.
    await page.click('.ws-every summary');
    assert.equal((await page.locator('.ws-every li').allTextContents()).length, 8);
    assert.equal(await page.textContent('.ws-pat figcaption'), 'Base moves');
    await shot(page, '375x660-saved-every');
    await page.context().close();
    ok('where the device cannot copy, a sheet shows the text to copy by hand; the card lists every square and labels its picture');

    // Ctrl+Z in a sheet does nothing; the arrow keys move a choice and Enter commits it; the sheet acts on its own rule.
    page = await open({ w: 1280, h: 900 });
    await viaMenu(page);
    await editPreset(page, 'knight');
    await tab(page, 2);
    await page.click('.ws-add');
    await page.click('.ws-book-row[data-a="movesLike"]');
    await page.click('.ws-pill[data-pill="when"]');
    await page.waitForSelector('.ws-sheet:not(.ws-edit-sheet)[open]');
    await page.keyboard.press('Control+z');
    assert.equal(await page.locator('.ws-rule').count(), 1, 'the undo key does not reach the editor under a sheet');
    await page.focus('.ws-sheet:not(.ws-edit-sheet)[open] input[type="radio"]:checked');
    await page.keyboard.press('ArrowDown');
    assert.equal(await page.evaluate(() => !!document.querySelector('.ws-sheet:not(.ws-edit-sheet)[open]')), true, 'an arrow key only moves the choice');
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => !!document.querySelector('.ws-sheet:not(.ws-edit-sheet)[open]')), false, 'Enter commits it');
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
    await viaMenu(page);
    await editPreset(page, 'ogre');
    await closePart(page);
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
    await back(page); await back(page);
    await editPreset(page, 'guard');
    await closePart(page);
    await page.click('.ws-try');
    assert.equal(await page.textContent('.tb-safe'), 'It cannot be taken by anything but a king. That holds now. The other side never moves, so Try it cannot test this rule.');
    await page.context().close();
    ok('Try it: a square with push and take asks which one; one tab stop, arrows, focus on the landing square, each move announced; a Safe rule in its own words');

    // A Pawn keeps its own words; a Paladin's warning opens "Why this warning?".
    page = await open();
    await viaMenu(page);
    await editPreset(page, 'pawn');
    assert.match(await page.textContent('.ws-worth'), /1 pawn/);
    assert.match(await page.textContent('.ws-summary'), /unit of worth/i);
    await back(page);
    await editPreset(page, 'paladin');
    await closePart(page);
    await closePart(page); await page.click('.ws-chip');
    assert.equal(await page.textContent('.ws-sheet:not(.ws-edit-sheet)[open] h2'), 'Why this warning?');
    await page.context().close();
    ok('an unchanged Pawn keeps its own words; the Why? title follows the card verdict');

    // Phone landscape: every move square stays on screen.
    page = await open({ w: 568, h: 320 });
    await viaMenu(page);
    await editPreset(page, 'knight');
    assert.equal(await page.evaluate(() => [...document.querySelectorAll('.ws-cell')].filter(c => { const r = c.getBoundingClientRect(); return r.top < 0 || r.bottom > innerHeight + 0.5 || r.right > innerWidth + 0.5; }).length), 0, 'every cell on screen at 568x320');
    assert.equal(await page.isVisible('.ws-mode'), true);
    await shot(page, '568x320-moves');
    await page.context().close();
    ok('at 568x320 the whole board shows, with explicit action and scope');
  }

  // 9. No animation after each tap with reduced motion, and with Animations Off.
  for (const o of [{ reducedMotion: 'reduce' }, { pace: 'off' }]) {
    page = await open(o);
    await viaMenu(page);
    const still = async what => assert.equal(await page.evaluate(() => document.getAnimations().length), 0, `${JSON.stringify(o)}: ${what}`);
    await still('home');
    await page.click('[data-door="piece"]'); await still('start');
    await page.click('[data-key="beast"]'); await still('card');
    await part(page, 'moves'); await still('editor');
    await page.click('.ws-cell[data-x="2"][data-y="2"]'); await still('paint');
    await tab(page, 2); await still('rules');
    await page.click('.ws-add'); await still('book');
    await page.click('.ws-book-row[data-a="cannotTake"]'); await still('rule');
    await tab(page, 3); await still('look');
    await page.click('.ws-glow[data-glow="Flame"]'); await still('glow');
    await closePart(page); await still('saved');
    await page.click('.ws-try'); await still('try');
    await page.context().close();
  }
  ok('no animation after each tap with reduced motion, and with Animations Off');

  // Approved reactions are bounded, finish still, and cancel when motion is disabled.
  page = await open({ w: 1280, h: 900 });
  await viaMenu(page); await editPreset(page, 'knight');
  await page.evaluate(() => {
    window.__wsDurations = [];
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (frames, timing) {
      const animation = animate.call(this, frames, timing);
      if (this.closest('#workshop')) {
        const t = animation.effect.getTiming();
        window.__wsDurations.push(Number(t.duration) + t.delay);
      }
      return animation;
    };
  });
  await page.click('.ws-cell[data-x="1"][data-y="1"]');
  const durations = await page.evaluate(() => window.__wsDurations);
  assert.ok(durations.length > 0, 'an edit starts the approved reactions');
  assert.ok(durations.every(ms => ms <= 600), `reactions finish within 600 ms: ${durations}`);
  const still = () => page.waitForFunction(() => document.querySelector('#workshop').getAnimations({ subtree: true }).length === 0);
  await still();
  assert.equal(await page.locator('.ws-piece-card .ws-fig').count(), 1, 'the still card has no outgoing figure');
  await page.click('.ws-cell[data-x="1"][data-y="1"]');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await still();
  await page.click('.ws-cell[data-x="1"][data-y="1"]');
  assert.equal(await page.evaluate(() => document.querySelector('#workshop').getAnimations({ subtree: true }).length), 0, 'changed preference stops future reactions');
  await page.context().close();
  ok('approved reactions last at most 600 ms, finish still, and respect a changed reduced-motion preference');

  // Desktop: the card and editor, with estimate details revealed on request.
  page = await open({ w: 1280, h: 900 });
  await viaMenu(page);
  await shot(page, '1280x900-home');
  await editPreset(page, 'rook');
  await addRule(page, 'chain');
  await shot(page, '1280x900-rook-chain');
  await closePart(page); await page.click('.ws-piece-card .ws-chip');
  assert.equal(await page.locator(`${chooser} .ws-reasons`).count(), 1, 'Why? opens details on demand');
  await page.keyboard.press('Escape');
  await shot(page, '1280x900-why');
  await closePart(page);
  await page.click('.ws-try');
  await shot(page, '1280x900-try');
  await page.context().close();
  ok('desktop screenshots');

  assert.deepEqual(errors, [], 'no page or console errors');
  ok('no page or console errors');
} finally {
  await browser.close();
}
