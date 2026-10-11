// Checks the visual design pass in a real browser: title screen, keyboard play, move announcements,
// Show threats, refusal messages, piece cards, phone tap targets, the title's piece lineup, the move markers and
// the Quiet Table floor (light only, also in device dark mode).
// Run: npm run check:browser visual-design (the result file checks.json goes to PLAYABLE_OUT).
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { usePower, startLesson, boardHelp, contextText, titleStart, arriveContinue, endTurn, lanMoves, moveRow, openMoves, pressMenu, refusalText, waitForUi } from '../../tools/app-ui.mjs';
import { assertNoErrors, env, launch, trapErrors } from '../../tools/lib/checks.mjs';

const base = env('PLAYABLE_URL');
const browser = await launch();
const checks = [];
const ok = msg => { checks.push(msg); console.log(`ok ${msg}`); };
const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1';

async function open(query = '', { skipTitle = true, save = null, viewport = { width: 1280, height: 900 }, touch = false, scheme = 'light' } = {}) {
  const ctx = await browser.newContext({ viewport, hasTouch: touch, isMobile: touch, colorScheme: scheme });
  await ctx.addInitScript(([skip, s]) => {
    if (skip) sessionStorage.setItem('kingdown.title-seen', '1');
    if (s && !sessionStorage.getItem('seeded')) { localStorage.setItem('kingdown.save', JSON.stringify(s)); sessionStorage.setItem('seeded', '1'); }
  }, [skipTitle, save]);
  const page = await ctx.newPage();
  trapErrors(page);
  page.on('dialog', d => d.accept());
  await page.goto(base + query);
  await page.waitForFunction(() => window.view?.ready);
  return page;
}
const ready = page => page.waitForFunction(() => window.view?.ready).then(() => page.evaluate(() => window.view.ready()));
const tap = async (page, sq) => { const p = await page.evaluate(s => window.view.screenOf(s), sq); await page.mouse.click(p.x, p.y); };
const titleOpen = page => page.evaluate(() => !!document.querySelector('#title-screen[open]'));
const help = page => contextText(page);

try {
  // 1. A first visit shows one Start and deals seed 83.
  let page = await open('', { skipTitle: false });
  assert.equal(await titleOpen(page), true, 'title on a first visit');
  assert.equal(await page.locator('.title-actions button:visible').count(), 1, 'one Start on a first visit');
  assert.equal(await page.locator('.title-kings img').evaluateAll(imgs => imgs.filter(i => i.complete && i.naturalWidth && i.checkVisibility()).length), 6, 'the six kings on the title');
  assert.equal(await page.locator('#title-continue').isVisible(), false, 'no Continue without a saved game');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'title-start', 'Start has the focus on a first visit');
  await page.reload(); await ready(page);
  assert.equal(await page.locator('#title-start').isVisible(), true, 'reload before Start keeps the first visit');
  await titleStart(page).click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('kingdown.save') || '{}').back === 'QRNAKBBS');
  const firstDeal = await page.evaluate(() => JSON.parse(localStorage.getItem('kingdown.save')));
  assert.deepEqual([firstDeal.back, firstDeal.white, firstDeal.black, firstDeal.skill, firstDeal.rules.kings], ['QRNAKBBS', 'human', 'ai', 'beginner', [null, null]], 'Start deals seed 83 against Beginner as White, without powers');
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('kingdown.new-game')).level), 'beginner', 'the next New game keeps Beginner');
  assert.equal(await page.evaluate(() => localStorage.getItem('kingdown.first-deal')), '1', 'Start stores the first-deal key');
  await startLesson(page);
  await page.waitForFunction(() => /Lesson 1 of 6/.test(document.getElementById('turn').textContent));
  assert.equal(await page.locator('#lesson-progress span').count(), 6);
  await page.reload(); await ready(page);
  assert.equal(await titleOpen(page), false, 'once per tab: a reload goes straight to the game');
  ok('title: one Start deals QRNAKBBS, then Guide opens lessons; a reload skips the title');
  await page.context().close();

  // Returning player: Home keeps the saved board; New game opens the sheet.
  const save = { back: 'RNBQKBNR', fen: START, moves: ['e2-e4', 'e7-e5'], white: 'human', black: 'ai', sound: false };
  page = await open('', { skipTitle: false, save });
  assert.equal(await arriveContinue(page).isVisible(), true);
  assert.match(await arriveContinue(page).innerText(), /Continue/);
  assert.equal(await page.locator('#home-progress').innerText(), 'Move 2', 'Home shows the saved move');
  await arriveContinue(page).click();
  assert.equal(await titleOpen(page), false);
  assert.match((await lanMoves(page)).join(' '), /e2-e4/);
  await page.context().close();
  // The computer waits on Home and behind New game. Continue starts it.
  page = await open('', { skipTitle: false, save: { ...save, moves: ['e2-e4'], skill: 'beginner', think: 200 } });
  await titleStart(page).click();
  await page.waitForFunction(() => document.getElementById('new-game').open);
  await page.waitForTimeout(2500); // the beginner computer answers in well under a second
  assert.equal((await lanMoves(page)).length, 1, 'the computer does not move behind New game');
  await page.keyboard.press('Escape');
  await arriveContinue(page).click();
  await waitForUi(page, ui => ui.lan.length === 2, null, { timeout: 15000 });
  await page.context().close();
  ok('Home: Continue resumes the saved game; New game opens the sheet; the computer waits for Continue');

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
  await waitForUi(page, ui => /e2-e4/.test(ui.lan.join(' ')));
  assert.match(await page.locator('#announce').textContent(), /^White pawn e2 to e4\./);
  await page.waitForFunction(() => document.activeElement.id === 'end-turn');
  await endTurn(page, { keyboard: true });
  assert.equal(await page.evaluate(() => document.activeElement.id), 'board');
  assert.equal(await page.locator('#board-marks .mk-cursor').count(), 1);
  await page.waitForFunction(() => /^Black /.test(document.getElementById('announce').textContent), null, { timeout: 20000 });
  ok(`keyboard: Tab, arrows and Enter play e2-e4; announced "White pawn e2 to e4." then "${await page.locator('#announce').textContent()}"`);
  // The move list is a row of buttons: Tab reaches them, Enter opens the review.
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('kingdown.save') || '{}').moves?.length === 2); // the reply has finished
  await openMoves(page);
  const first = moveRow(page, 1);
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
  await boardHelp(page, () => page.check('#threats'));
  assert.equal(await page.locator('#board-marks .mk-threat').count(), 1);
  assert.equal(await page.locator('#board-marks .mk-cover').count(), 15);
  const ring = await page.locator('#board-marks .mk-threat').boundingBox(), d2 = await page.evaluate(() => window.view.screenOf(11));
  assert.ok(Math.abs(ring.x + ring.width / 2 - d2.x) < 2 && Math.abs(ring.y + ring.height / 2 - d2.y) < 2, 'the ring sits on d2');
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('kingdown.save')).threats), true, 'the choice is saved');
  ok('Show threats: off by default; marks the attacked knight and 15 covered squares; saved');
  await page.context().close();

  // 4. Refusals say why. A tap on an enemy piece with no piece selected is no refusal: it shows the piece's card.
  page = await open('?fen=' + encodeURIComponent('4k3/4r3/8/8/8/8/4B3/4K3 w - - 0 1'));
  await ready(page);
  await tap(page, 52); assert.equal(await refusalText(page), ''); assert.match(await contextText(page), /Black rook/);
  await tap(page, 12); assert.match(await help(page), /This bishop has no legal move/);
  await tap(page, 19); assert.match(await help(page), /That leaves your king in check/);
  await page.context().close();
  page = await open('?fen=' + encodeURIComponent('4k3/8/8/g7/8/8/8/R3K3 w - - 0 1'));
  await ready(page);
  await tap(page, 0); await tap(page, 32); assert.match(await help(page), /Only a king can take a guard/);
  await tap(page, 9); assert.match(await help(page), /The rook cannot reach b2/);
  ok('refusals: no legal move, pinned, guard, unreachable square; an enemy piece shows its card');
  await page.context().close();

  // 5. Guide cards carry painted art; promotion shows figures.
  page = await open('?fen=' + encodeURIComponent('7k/P7/8/8/8/8/8/K7 w - - 0 1'));
  await ready(page);
  await pressMenu(page, 'Guide');
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
  await pressMenu(page, 'Guide');
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
  assert.deepEqual(await small('#game-table'), []);
  for (const [item, dlg] of [['New game', '#new-game'], ['Settings', '#menu-sheet'], ['Guide', '#rules']]) {
    await pressMenu(page, item); assert.deepEqual(await small(dlg), [], dlg); await page.keyboard.press('Escape');
  }
  // New game in each of its three modes, with More options open: the king picker's emblems and powers too.
  await pressMenu(page, 'New game'); await page.click('#more-options summary');
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
  for (const [kind, viewport, touch] of [['desktop', { width: 1440, height: 900 }, false], ['phone', { width: 390, height: 844 }, true]]) {
    page = await open('', { skipTitle: false, viewport, touch });
    const figs = page.locator('.title-lineup img');
    assert.equal(await figs.count(), 12, 'twelve figures');
    await page.waitForFunction(() => [...document.querySelectorAll('.title-lineup img')].every(i => i.complete && i.naturalWidth > 0));
    const names = await page.locator('.title-lineup span').allInnerTexts();
    assert.equal(new Set(names.map(n => n.toLowerCase())).size, 12, 'twelve different names');
    for (const id of ['#title-start']) {
      const r = await page.locator(id).boundingBox();
      assert.ok(r && r.y >= 0 && r.y + r.height <= viewport.height, `${id} on screen (${kind})`);
    }
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `no sideways scroll (${kind})`);
    if (process.env.SAMPLE === 'W8') {
      const out = env('PLAYABLE_OUT'); mkdirSync(out, { recursive: true });
      await page.screenshot({ path: join(out, `w8-first-${kind}.png`), animations: 'disabled' });
      await titleStart(page).click(); await ready(page);
      await page.waitForFunction(() => JSON.parse(localStorage.getItem('kingdown.save') || '{}').back === 'QRNAKBBS');
      await page.screenshot({ path: join(out, `w8-deal-${kind}.png`), animations: 'disabled' });
    }
    await page.context().close();
  }
  ok('title lineup: twelve painted figures with names; Start stays on screen at 1440×900 and 390×844');

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
  assert.deepEqual([...shotMarks.shots].sort(), [41, 45], 'the archer\'s shot targets are b6 and f6');
  assert.deepEqual([...shotMarks.captures].sort(), [41, 45]);
  await page.context().close();
  page = await open('?kings=stratus:flight,none&fen=' + encodeURIComponent('4k3/p7/8/8/8/8/P7/1N2K3 w - - 0 1'));
  await ready(page);
  await usePower(page); await tap(page, 1);
  const flight = await page.evaluate(() => ({ powers: window.view.marks.powers.length, moves: window.view.marks.moves.length }));
  assert.ok(flight.powers > 0 && flight.powers === flight.moves, `Flight's squares are power marks (${flight.powers}/${flight.moves})`);
  await page.context().close();
  ok('markers: Archer targets are shot targets; an armed Flight marks its squares as power moves');

  // 9. The Quiet Table (web redesign ticket 01): the page is light only. With the device in dark mode, the
  // page, the first-visit title and the Workshop surround show the same parchment floor as in light mode, and
  // the painted board's canvas is clear round its frame, so the floor shows there.
  const background = (p, selector, pseudo = null) => p.evaluate(([s, ps]) => {
    const c = getComputedStyle(document.querySelector(s), ps);
    return `${c.backgroundColor} ${c.backgroundImage}`;
  }, [selector, pseudo]);
  const looks = {};
  for (const scheme of ['light', 'dark']) {
    page = await open('', { skipTitle: false, scheme });
    assert.equal(await page.evaluate(() => matchMedia('(prefers-color-scheme: dark)').matches), scheme === 'dark', `the device is in ${scheme} mode`);
    assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme), 'light only', `${scheme}: the computed color-scheme`);
    assert.equal(await titleOpen(page), true, `${scheme}: the title on a first visit`);
    const look = { body: await background(page, 'body'), title: await background(page, '#title-screen'), titleBackdrop: await background(page, '#title-screen', '::backdrop') };
    await page.context().close();
    page = await open('', { scheme });
    await ready(page);
    // The art can be in before the first frame: wait until the scene draws, so the canvas read sees its floor.
    await page.waitForFunction(() => window.view.scene.frames > 0);
    // A point inside the canvas, outside the board's frame: the top right corner, above the back rank.
    const corner = await page.evaluate(() => {
      const c = document.querySelector('#board canvas'), r = c.getBoundingClientRect(), x = Math.floor(r.right) - 4, y = Math.ceil(r.top) + 4;
      const alpha = c.getContext('2d').getImageData(Math.floor((x - r.left) * c.width / r.width), Math.floor((y - r.top) * c.height / r.height), 1, 1).data[3];
      return { x, y, alpha, board: getComputedStyle(document.getElementById('board')).backgroundColor };
    });
    assert.equal(corner.alpha, 0, `${scheme}: the canvas is clear outside the board's frame`);
    assert.equal(corner.board, 'rgba(0, 0, 0, 0)', `${scheme}: the board area has no colour of its own`);
    const pixel = () => page.screenshot({ clip: { x: corner.x, y: corner.y, width: 1, height: 1 } });
    // Hide every layer over the body (the board, its canvas and the panels): the pixel must not change, so the
    // screen shows the body's floor there, with no colour or image of the board area or of a layer between.
    const layers = visible => page.evaluate(v => { for (const el of document.body.children) el.style.visibility = v; }, visible ? '' : 'hidden');
    const shown = await pixel();
    await layers(false);
    assert.ok(shown.equals(await pixel()), `${scheme}: outside the frame the screen shows the floor under the canvas`);
    await layers(true);
    await pressMenu(page, 'Workshop');
    await page.locator('#workshop').waitFor();
    look.workshopBackdrop = await background(page, '#workshop', '::backdrop');
    looks[scheme] = look;
    await page.context().close();
  }
  for (const [part, value] of Object.entries(looks.light)) assert.match(value, /^rgb\(242, 233, 214\) radial-gradient\(/, `${part}: the parchment floor`);
  assert.deepEqual(looks.dark, looks.light, 'dark mode: the same floor under the page, the title and the Workshop');
  ok('Quiet Table: color-scheme "light only"; in light and dark mode the page, the title, its backdrop and the Workshop backdrop show the parchment floor; the canvas is clear outside the board frame');

  assertNoErrors();
  const out = env('PLAYABLE_OUT');
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, 'checks.json'), JSON.stringify({ url: base, checksPassed: checks.length, checks, errors: [] }, null, 2) + '\n');
} finally { await browser.close(); }
