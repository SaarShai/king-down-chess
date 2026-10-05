// Checks the visual design pass in a real browser: title screen, keyboard play, move announcements,
// Show threats, refusal messages, piece cards, phone tap targets, the title's piece lineup and the move markers.
// Needs a running build: PLAYABLE_URL=http://127.0.0.1:5189/ PLAYABLE_BROWSER=chromium node docs/visual-design/verify.mjs
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const base = process.env.PLAYABLE_URL || 'http://127.0.0.1:5189/';
const browser = await chromium.launch({ headless: true, channel: process.env.PLAYABLE_BROWSER || 'chrome' });
const errors = [], checks = [];
const ok = msg => { checks.push(msg); console.log(`ok ${msg}`); };
const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1';

async function open(query = '', { skipTitle = true, save = null, viewport = { width: 1280, height: 900 }, touch = false } = {}) {
  const ctx = await browser.newContext({ viewport, hasTouch: touch, isMobile: touch });
  await ctx.addInitScript(([skip, s]) => {
    if (skip) sessionStorage.setItem('kingdown.title-seen', '1');
    if (s && !sessionStorage.getItem('seeded')) { localStorage.setItem('kingdown.save', JSON.stringify(s)); sessionStorage.setItem('seeded', '1'); }
  }, [skipTitle, save]);
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('dialog', d => d.accept());
  await page.goto(base + query);
  await page.waitForFunction(() => window.view?.ready);
  return page;
}
const ready = page => page.waitForFunction(() => window.view?.ready).then(() => page.evaluate(() => window.view.ready()));
const tap = async (page, sq) => { const p = await page.evaluate(s => window.view.screenOf(s), sq); await page.mouse.click(p.x, p.y); };
const titleOpen = page => page.evaluate(() => !!document.querySelector('#title-screen[open]'));
const help = page => page.locator('#move-help').innerText();

try {
  // 1. Title screen: a first visit leads with the lessons.
  let page = await open('', { skipTitle: false });
  assert.equal(await titleOpen(page), true, 'title on a first visit');
  assert.equal(await page.locator('#title-learn').evaluate(b => b.classList.contains('primary') && !b.previousElementSibling), true, 'Learn leads, first, on a first visit');
  assert.equal(await page.locator('.title-kings img').evaluateAll(imgs => imgs.filter(i => i.complete && i.naturalWidth && i.checkVisibility()).length), 6, 'the six kings on the title');
  assert.equal(await page.locator('#title-continue').isVisible(), false, 'no Continue without a saved game');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'title-learn', 'Learn has the focus on a first visit');
  await page.click('#title-learn');
  await page.waitForFunction(() => /Lesson 1 of 6/.test(document.getElementById('turn').textContent));
  assert.equal(await page.locator('#lesson-progress span').count(), 6);
  await page.reload(); await ready(page);
  assert.equal(await titleOpen(page), false, 'once per tab: a reload goes straight to the game');
  ok('title: first visit points to the lessons, Learn starts lesson 1, a reload skips the title');
  await page.context().close();

  // Returning player: Continue resumes the saved game; Play opens New game.
  const save = { back: 'RNBQKBNR', fen: START, moves: ['e2-e4', 'e7-e5'], white: 'human', black: 'ai', sound: false };
  page = await open('', { skipTitle: false, save });
  assert.equal(await page.locator('#title-continue').isVisible(), true);
  assert.match(await page.locator('#title-continue').innerText(), /Continue · move 2/);
  assert.equal(await page.locator('#title-learn').evaluate(b => b.classList.contains('primary')), false, 'Learn does not lead for a returning player');
  await page.click('#title-continue');
  assert.equal(await titleOpen(page), false);
  assert.match(await page.locator('#moves').innerText(), /e2-e4/);
  await page.context().close();
  // Play with the computer to move: it waits while New game is open, and moves once it is closed.
  page = await open('', { skipTitle: false, save: { ...save, moves: ['e2-e4'], skill: 'beginner', think: 200 } });
  await page.click('#title-play');
  await page.waitForFunction(() => document.getElementById('new-game').open);
  await page.waitForTimeout(2500); // the beginner computer answers in well under a second
  assert.equal(await page.locator('#moves button').count(), 1, 'the computer does not move behind New game');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => document.querySelectorAll('#moves button').length === 2, null, { timeout: 15000 });
  await page.context().close();
  ok('title: Continue resumes the saved game, Play opens New game and the computer waits for it');

  for (const q of ['?fen=' + encodeURIComponent(START), '?army=RNBQKBNR&moves=e2-e4', '?title=0']) {
    page = await open(q, { skipTitle: false });
    assert.equal(await titleOpen(page), false, `no title for ${q}`);
    await page.context().close();
  }
  ok('title: never over ?fen=, a game link, or ?title=0');

  // 2. Keyboard play and announcements: Tab to the board, arrows and Enter play e2-e4; both sides are announced.
  page = await open('?fen=' + encodeURIComponent(START));
  await ready(page);
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'board');
  assert.equal(await page.locator('#board-marks .mk-cursor').count(), 1, 'the cursor shows');
  assert.match(await page.locator('#cursor-say').textContent(), /^e2, white pawn/);
  await page.keyboard.press('Enter');
  assert.match(await page.locator('#cursor-say').textContent(), /e2 selected\. It can go to e3, e4/);
  await page.keyboard.press('ArrowUp'); await page.keyboard.press('ArrowUp');
  assert.match(await page.locator('#cursor-say').textContent(), /^e4, empty, can go here/);
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => /e2-e4/.test(document.getElementById('moves').textContent));
  assert.match(await page.locator('#announce').textContent(), /^White pawn e2 to e4\./);
  await page.waitForFunction(() => /^Black /.test(document.getElementById('announce').textContent), null, { timeout: 20000 });
  ok(`keyboard: Tab, arrows and Enter play e2-e4; announced "White pawn e2 to e4." then "${await page.locator('#announce').textContent()}"`);
  // The move list is a row of buttons: Tab reaches them, Enter opens the review.
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('kingdown.save') || '{}').moves?.length === 2); // the reply has finished
  const first = page.locator('#moves [data-ply="1"]');
  await first.focus(); await page.keyboard.press('Enter');
  await page.waitForFunction(() => /Reviewing after 1\. e2-e4/.test(document.getElementById('turn').textContent));
  await page.keyboard.press('Escape');
  ok('keyboard: a move in the list is a button; Enter opens its review');
  // A mouse tap focuses the board without the cursor, so ← still steps back through the moves.
  await tap(page, 0); await page.keyboard.press('ArrowLeft');
  await page.waitForFunction(() => /^Reviewing/.test(document.getElementById('turn').textContent));
  assert.equal(await page.locator('#board-marks .mk-cursor').count(), 0);
  await page.keyboard.press('Escape');
  ok('mouse: after a tap on the board, ← still opens the review (no cursor)');
  await page.context().close();

  // 3. Show threats: a rook on d5 attacks the knight on d2 and covers 12 empty squares; its king 3 more.
  page = await open('?fen=' + encodeURIComponent('4k3/8/8/3r4/8/8/3N4/4K3 w - - 0 1'));
  await ready(page);
  assert.equal(await page.locator('#board-marks i').count(), 0, 'off by default');
  await page.click('#settings-btn'); await page.check('#threats'); await page.keyboard.press('Escape');
  assert.equal(await page.locator('#board-marks .mk-threat').count(), 1);
  assert.equal(await page.locator('#board-marks .mk-cover').count(), 15);
  const ring = await page.locator('#board-marks .mk-threat').boundingBox(), d2 = await page.evaluate(() => window.view.screenOf(11));
  assert.ok(Math.abs(ring.x + ring.width / 2 - d2.x) < 2 && Math.abs(ring.y + ring.height / 2 - d2.y) < 2, 'the ring sits on d2');
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('kingdown.save')).threats), true, 'the choice is saved');
  ok('Show threats: off by default; marks the attacked knight and 15 covered squares; saved');
  await page.context().close();

  // 4. Refusals say why.
  page = await open('?fen=' + encodeURIComponent('4k3/4r3/8/8/8/8/4B3/4K3 w - - 0 1'));
  await ready(page);
  await tap(page, 52); assert.match(await help(page), /That is Black's rook\. White to move/);
  await tap(page, 12); assert.match(await help(page), /This bishop has no legal move/);
  await tap(page, 19); assert.match(await help(page), /that bishop move would leave your king in check/);
  await page.context().close();
  page = await open('?fen=' + encodeURIComponent('4k3/8/8/g7/8/8/8/R3K3 w - - 0 1'));
  await ready(page);
  await tap(page, 0); await tap(page, 32); assert.match(await help(page), /a guard can only be taken by a king/);
  await tap(page, 0); await tap(page, 9); assert.match(await help(page), /the rook cannot reach b2/);
  ok('refusals: enemy piece, no legal move, pinned, guard, unreachable square');
  await page.context().close();

  // 5. Guide cards carry painted art; promotion shows figures.
  page = await open('?fen=' + encodeURIComponent('7k/P7/8/8/8/8/8/K7 w - - 0 1'));
  await ready(page);
  await page.click('#rules-btn');
  const cards = page.locator('#rules-rows .piece-card');
  assert.ok(await cards.count() >= 12);
  // The figures load lazily: when the Guide opens, some are not loaded yet, and decode() on such an image
  // can reject. So, one at a time, scroll each figure into view, wait for its load (10 s at most), then decode it.
  const loaded = await page.$$eval('#rules-rows img', async imgs => {
    const out = [];
    for (const i of imgs) {
      i.scrollIntoView({ block: 'center' });
      if (!i.complete) await Promise.race([
        new Promise(r => { i.addEventListener('load', r, { once: true }); i.addEventListener('error', r, { once: true }); }),
        new Promise(r => setTimeout(r, 10_000))]);
      out.push(await i.decode().then(() => i.naturalWidth > 0, () => false));
    }
    return out;
  });
  assert.ok(loaded.length >= 12 && loaded.every(Boolean), 'every card figure loads');
  const kingCard = p => p.$eval('#rules-rows [data-piece="king"] img', i => new URL(i.src).pathname.split('/').slice(-2).join('/'));
  assert.equal(await kingCard(page), 'kings/spirit.webp', 'the King card shows White\'s king as the board draws him (Spirit without powers)');
  await page.locator('#rules form button').click();
  await tap(page, 48); await tap(page, 56);
  await page.locator('#promo').waitFor({ state: 'visible' });
  assert.equal(await page.locator('#promo-choices img').count(), 4);
  const nCards = await cards.count();
  await page.context().close();
  page = await open('?kings=mud:march,stratus:flight&fen=' + encodeURIComponent('4k3/p7/8/8/8/8/P7/4K3 w - - 0 1'));
  await ready(page);
  await page.click('#rules-btn');
  assert.equal(await kingCard(page), 'kings/mud.webp', 'the King card shows the picked White king');
  ok(`Guide: ${nCards} piece cards, ${loaded.length} painted figures loaded; the King card shows White's king (Spirit; Mud when picked); promotion shows figures`);
  await page.context().close();

  // 6. Phone: tap targets of at least 44 px, no sideways scroll.
  page = await open('', { viewport: { width: 390, height: 844 }, touch: true, save });
  await ready(page);
  const small = async scope => page.$$eval(`${scope} button, ${scope} select, ${scope} label, ${scope} summary`, els => els
    .filter(e => e.offsetParent && getComputedStyle(e).visibility !== 'hidden')
    .map(e => ({ id: e.id || e.textContent.trim().slice(0, 24), r: e.getBoundingClientRect() }))
    .filter(({ r }) => r.height < 44 || r.width < 44)
    .map(({ id, r }) => `${id} ${Math.round(r.width)}×${Math.round(r.height)}`));
  assert.deepEqual(await small('#panel'), []);
  for (const [btn, dlg] of [['#new-game-btn', '#new-game'], ['#settings-btn', '#settings'], ['#rules-btn', '#rules']]) {
    await page.click(btn); assert.deepEqual(await small(dlg), [], dlg); await page.keyboard.press('Escape');
  }
  // New game in each of its three modes, with More options open: the king picker's emblems and powers too.
  await page.click('#new-game-btn'); await page.click('#more-options summary');
  for (const mode of ['computer', 'powers', 'two']) {
    await page.click(`label:has(#mode-${mode})`);
    if (mode === 'two') await page.check('#two-powers');
    assert.deepEqual(await small('#new-game'), [], `New game: ${mode}`);
  }
  assert.equal(await page.locator('#new-game .emblem:visible').count(), 12, 'six emblems a side');
  await page.keyboard.press('Escape');
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  ok('phone: every visible control in the panel, New game (all three modes, More options open), Settings and Guide is at least 44 px');
  await page.context().close();

  // 7. Round 2: the title's lineup shows all twelve pieces and leaves the buttons on screen.
  for (const [kind, viewport, touch] of [['desktop', { width: 1280, height: 900 }, false], ['phone', { width: 390, height: 844 }, true]]) {
    page = await open('', { skipTitle: false, viewport, touch });
    const figs = page.locator('.title-lineup img');
    assert.equal(await figs.count(), 12, 'twelve figures');
    await page.waitForFunction(() => [...document.querySelectorAll('.title-lineup img')].every(i => i.complete && i.naturalWidth > 0));
    const names = await page.locator('.title-lineup span').allInnerTexts();
    assert.equal(new Set(names.map(n => n.toLowerCase())).size, 12, 'twelve different names');
    for (const id of ['#title-learn', '#title-play']) {
      const r = await page.locator(id).boundingBox();
      assert.ok(r && r.y >= 0 && r.y + r.height <= viewport.height, `${id} on screen (${kind})`);
    }
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `no sideways scroll (${kind})`);
    await page.context().close();
  }
  ok('title lineup: twelve painted figures with names; Learn and Play stay on screen at 1280×900 and 390×844');

  // 7b. The title from a small phone to a desktop: the lineup inside the screen, no name into the next one,
  // and the lineup, kings, wordmark and buttons centred (a tablet's lineup once widened the whole title);
  // top to bottom, every figure, the wordmark and the buttons on the screen (a phone in landscape once cut
  // off the top row and Play).
  for (const [w, h] of [[320, 568], [390, 844], [568, 320], [667, 375], [721, 1000], [768, 1024], [834, 1112], [844, 390], [1024, 768], [1440, 900]]) {
    page = await open('', { skipTitle: false, viewport: { width: w, height: h }, touch: w < 721 });
    await page.waitForFunction(() => [...document.querySelectorAll('#title-screen img')].every(i => i.complete) && document.fonts.status === 'loaded');
    const m = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth, r = e => e.getBoundingClientRect(), mid = e => { const b = r(e); return (b.left + b.right) / 2 - vw / 2; };
      const spans = [...document.querySelectorAll('.title-lineup span')].map(s => ({ name: s.textContent, ...r(s).toJSON() }));
      const out = spans.filter(s => s.left < -0.5 || s.right > vw + 0.5).map(s => s.name);
      const into = spans.slice(1).filter((s, i) => Math.abs(s.top - spans[i].top) < 4 && spans[i].right > s.left + 0.5).map(s => s.name);
      const lineup = [...document.querySelectorAll('.title-lineup li')], buttons = [...document.querySelectorAll('.title-actions button:not([hidden])')];
      const row = { left: Math.min(...buttons.map(b => r(b).left)), right: Math.max(...buttons.map(b => r(b).right)) };
      const tall = [...lineup, document.getElementById('title-word'), ...buttons].filter(e => r(e).top < -0.5 || r(e).bottom > innerHeight + 0.5).map(e => e.textContent.trim().slice(0, 16));
      return { out, into, tall, wide: r(document.getElementById('title-screen')).width - vw,
        off: [(r(lineup[0]).left + r(lineup.at(-1)).right) / 2 - vw / 2, mid(document.querySelector('.title-kings')), mid(document.getElementById('title-word')), (row.left + row.right) / 2 - vw / 2] };
    });
    assert.deepEqual(m.out, [], `${w}×${h}: names off the screen`);
    assert.deepEqual(m.into, [], `${w}×${h}: names running into the one before`);
    assert.deepEqual(m.tall, [], `${w}×${h}: off the top or the bottom of the screen`);
    assert.ok(m.wide <= 0.5 && m.off.every(d => Math.abs(d) <= 2), `${w}×${h}: the title is ${m.wide} px wider than the screen; lineup, kings, wordmark, buttons off centre by ${m.off.map(d => d.toFixed(1))}`);
    await page.context().close();
  }
  ok('title at 320–1440 px (and 568×320, 667×375, 844×390): the lineup fits the screen, no name runs into the next, all centred, nothing off the top or bottom');

  // 8. Round 2 markers: shots, powers and the keyboard preview reach the painted board.
  page = await open('?fen=' + encodeURIComponent('4k3/8/1p3r2/8/3A4/8/8/4K3 w - - 0 1'));
  await ready(page);
  await tap(page, 27); // the archer on d4
  const shotMarks = await page.evaluate(() => ({ shots: window.view.marks.shots, captures: window.view.marks.captures }));
  assert.deepEqual([...shotMarks.shots].sort(), [41, 45], 'the archer sights b6 and f6');
  assert.deepEqual([...shotMarks.captures].sort(), [41, 45]);
  await page.context().close();
  page = await open('?kings=stratus:flight,none&fen=' + encodeURIComponent('4k3/p7/8/8/8/8/P7/1N2K3 w - - 0 1'));
  await ready(page);
  await page.click('#power-btn'); await tap(page, 1);
  const flight = await page.evaluate(() => ({ powers: window.view.marks.powers.length, moves: window.view.marks.moves.length }));
  assert.ok(flight.powers > 0 && flight.powers === flight.moves, `Flight's squares are power marks (${flight.powers}/${flight.moves})`);
  await page.context().close();
  ok('markers: Archer targets are sights; an armed Flight marks its squares as power moves');

  assert.deepEqual(errors, []);
  writeFileSync(new URL('./checks.json', import.meta.url), JSON.stringify({ url: base, checksPassed: checks.length, checks, errors }, null, 2) + '\n');
} finally { await browser.close(); }
