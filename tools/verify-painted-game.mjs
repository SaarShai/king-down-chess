// Plays real games in the painted 2D look and checks the view keeps up with the game.
// Run: npm run check:browser painted-game (screenshots go to PLAYABLE_OUT).
import assert from 'node:assert/strict';
import { confirmResign, endTurn, contextText, lanMoves, moveRow, openEndReview, openMenu, openMoves, pressMenu, resultText, waitForUi } from './app-ui.mjs';
import { assertNoErrors, env, launch, shot, trapErrors } from './lib/checks.mjs';
import { startGame } from './new-game-ui.mjs';
const url = new URL(env('PLAYABLE_URL'));
url.searchParams.set('look', 'painted'); // also the default; the phone check below uses the bare URL
const browser = await launch();
/** The saved game's players, [White, Black]. */
const players = page => page.evaluate(() => { const s = JSON.parse(localStorage.getItem('kingdown.save')); return [s.white, s.black]; });
const plies = async page => (await lanMoves(page)).length;
try {
  // 1. Computer vs computer: every capture animation must finish and hand the move on.
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.addInitScript(() => sessionStorage.setItem('kingdown.title-seen', '1')); // skip the title screen (main.ts)
  trapErrors(page);
  await page.goto(url.href);
  await page.evaluate(() => localStorage.removeItem('kingdown.save'));
  await page.goto(url.href);
  await page.waitForFunction(() => document.getElementById('board').classList.contains('painted') && document.querySelector('#board canvas'));
  // A beginner game, reopened with the computer on both sides (`?players=`) and 200 ms to think (`?think=`).
  await startGame(page, { mode: 'computer', level: 'beginner' });
  const both = new URL(url); both.searchParams.set('players', 'ai,ai'); both.searchParams.set('think', '200');
  await page.goto(both.href);
  await page.waitForFunction(() => document.querySelector('#board canvas'));
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('kingdown.save')).white === 'ai');
  assert.deepEqual(await players(page), ['ai', 'ai']);
  // The game runs to 60 plies and at least one capture (a random 60-ply game can have none), or to its end.
  const captures = () => page.$$eval('#took-w span, #took-b span', s => s.length);
  let last = -1, stalls = 0, taken = 0;
  for (let i = 0; i < 120; i++) {
    await page.waitForTimeout(1500);
    const n = await plies(page), over = await page.evaluate(() => document.getElementById('over').open) || (await resultText(page)) !== '';
    taken = await captures();
    if (over || (n >= 60 && taken > 0)) { console.log(`ok computer game: ${n} plies${over ? ', finished' : ''}`); break; }
    stalls = n === last ? stalls + 1 : 0; last = n;
    assert.ok(stalls < 6, `no progress for 9 s at ply ${n}`);
  }
  assert.ok(taken > 0, 'the game included captures');
  await shot(page, 'computer-game');
  console.log(`ok ${taken} captures animated`);
  // A game that finished before 60 plies leaves the result dialog open over the board; close it so
  // the next case's clicks reach the panel.
  if (await page.evaluate(() => document.getElementById('over').open)) await page.click('#over button[value="close"]');

  // 1a. A game that ends: the result window opens over the board, closes, and hands the panel back.
  await page.goto(`${url.href}&fen=${encodeURIComponent('6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1')}`);
  // "Loading pieces…" clears only after the position is loaded and the view is ready to take clicks.
  await page.waitForFunction(() => document.querySelector('#board canvas') && document.getElementById('asset-status').textContent === '');
  const rook = await page.evaluate(() => window.view.screenOf(0)), mate = await page.evaluate(() => window.view.screenOf(56));
  await page.mouse.click(rook.x, rook.y); await page.mouse.click(mate.x, mate.y); // Ra1-a8 mates
  await endTurn(page);
  await page.waitForFunction(() => document.getElementById('over').open, null, { timeout: 10000 });
  await assert.rejects(pressMenu(page, 'New game', { timeout: 1000 }), 'the open result window covers the panel');
  await page.click('#over button[value="close"]');
  await pressMenu(page, 'New game', { timeout: 2000 });
  assert.ok(await page.evaluate(() => document.getElementById('new-game').open), 'the panel works after the result window closes');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.getElementById('new-game').open);
  console.log('ok a finished game: the result window opens, closes and hands the panel back');

  // 1b. Human mouse input: drag a pawn two squares, then click-click a knight or any legal move.
  await startGame(page, { mode: 'computer', side: 'white', level: 'beginner' });
  await page.waitForTimeout(300);
  const at = sq => page.evaluate(sq => window.view.screenOf(sq), sq);
  const e2 = await at(12), e4 = await at(28);
  await page.mouse.move(e2.x, e2.y); await page.mouse.down(); await page.mouse.move(e4.x, e4.y, { steps: 8 }); await page.mouse.up();
  await waitForUi(page, ui => /e2-e4/.test(ui.lan.join(' ')), null, { timeout: 5000 });
  await endTurn(page);
  await waitForUi(page, ui => ui.turns[0]?.length >= 2, null, { timeout: 15000 });
  await page.locator('#resign[aria-disabled="false"]').waitFor({ state: 'attached' });
  const d2 = await at(11), d3 = await at(19);
  await page.mouse.click(d2.x, d2.y); await page.mouse.click(d3.x, d3.y);
  await waitForUi(page, ui => /d2-d3/.test(ui.lan.join(' ')), null, { timeout: 5000 });
  console.log('ok human drag and click-click moves');

  // 2. Human as Black: the board turns round, and Undo during the computer's animation is clean.
  // Move words precede landing; Menu would consume its click by skipping that animation.
  await page.locator('#resign[aria-disabled="false"]').waitFor({ state: 'attached' });
  await startGame(page, { mode: 'computer', side: 'black', level: 'beginner' });
  assert.deepEqual(await players(page), ['ai', 'human']);
  await waitForUi(page, ui => ui.lan.length > 0, null, { timeout: 15000 });
  const a8 = await page.evaluate(() => window.view.screenOf(56)), a1 = await page.evaluate(() => window.view.screenOf(0));
  assert.ok(a8.y > a1.y, 'Black at the bottom when the human plays Black');
  assert.equal(await page.getAttribute('#undo', 'aria-disabled'), 'true', 'the computer turn is final');
  await page.waitForTimeout(300);
  console.log('ok flipped board; Undo is off after the computer turn');

  // 2b. The Maester's goggle beam and a lab piece (a token) capture and finish without errors.
  for (const [fen, from, to, move] of [['7k/8/8/2p5/2M5/8/8/4K3 w - - 0 1', 26, 34, 'Mc4xc5'], ['7k/8/4p3/8/4p3/8/4C3/K7 w - - 0 1', 12, 44, 'Ce2*e6']]) {
    const u = new URL(url); u.searchParams.set('fen', fen);
    await page.goto(u.href);
    await page.waitForFunction(sq => window.view?.pos?.board[sq] > 0, to); // the FEN position has loaded
    // The board stays hidden, and takes no click, until its art shows (PaintedView F13).
    await page.evaluate(() => window.view.ready());
    for (const sq of [from, to]) { const p = await at(sq); await page.mouse.click(p.x, p.y); }
    await waitForUi(page, (ui, m) => ui.lan.join(' ').includes(m), move, { timeout: 5000 });
    await page.waitForFunction(() => !window.view.scene.animating, null, { timeout: 5000 });
  }
  console.log('ok Maester beam and Catapult token captures');

  // 2c. Animations: Fast plays a capture in about half the time, a tap on the board skips it,
  // Off shows only the result. Each case ends on the post-move board.
  const pawnTakes = async (pace, tapAfter = null) => {
    const u = new URL(url); u.searchParams.set('fen', '7k/8/8/3p4/4P3/8/8/K7 w - - 0 1');
    await page.goto(u.href);
    await page.waitForFunction(() => window.view?.pos?.board[35] > 0);
    await page.evaluate(() => window.view.ready());
    await page.evaluate(v => { const s = document.getElementById('pace'); s.value = v; s.dispatchEvent(new Event('change')); }, pace);
    for (const sq of [28, 35]) { const p = await at(sq); await page.mouse.click(p.x, p.y); }
    const t0 = Date.now(), started = await page.evaluate(() => window.view.scene.animating);
    if (tapAfter != null) { await page.waitForTimeout(tapAfter); const p = await at(0); await page.mouse.click(p.x, p.y); }
    await page.waitForFunction(() => !window.view.scene.animating && window.view.pos.board[28] === 0 && window.view.pos.board[35] > 0, null, { timeout: 5000 });
    return { started, ms: Date.now() - t0 };
  };
  const normal = await pawnTakes('normal'), fast = await pawnTakes('fast'), tapped = await pawnTakes('normal', 150), off = await pawnTakes('off');
  assert.ok(normal.started && fast.started && tapped.started && !off.started, JSON.stringify({ normal, fast, tapped, off }));
  assert.ok(fast.ms < normal.ms * 0.65, `fast ${fast.ms} ms vs normal ${normal.ms} ms`);
  assert.ok(tapped.ms < 600 && off.ms < 400, `tap-skip ${tapped.ms} ms, off ${off.ms} ms`);
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('kingdown.save')).pace), 'off', 'the choice is saved');
  await page.evaluate(() => { const s = document.getElementById('pace'); s.value = 'normal'; s.dispatchEvent(new Event('change')); });
  // 2c'. Quiet moves have a gait (Rook glide, Pawn hop, King walk), under 500 ms at Normal; Fast halves
  // it, a tap skips it, Off shows only the result. Timed in the page from the first animated frame.
  const quiet = async (fen, from, to, pace, tapAfter = null) => {
    const u = new URL(url); u.searchParams.set('fen', fen);
    await page.goto(u.href);
    await page.waitForFunction(sq => window.view?.pos?.board[sq] > 0, from);
    await page.evaluate(() => window.view.ready());
    await page.evaluate(v => { const s = document.getElementById('pace'); s.value = v; s.dispatchEvent(new Event('change')); }, pace);
    // A frame watcher started before the click times the animation from its first frame to its last.
    await page.evaluate(() => {
      window.__quiet = new Promise(done => {
        let t0 = null, kind = null; const limit = performance.now() + 4000;
        const f = () => {
          // Ends when this animation does (a computer reply may start right after it).
          const on = window.view.scene.animating && (kind == null || window.view.scene.playing === kind);
          if (on && t0 == null) { t0 = performance.now(); kind = window.view.scene.playing; }
          if ((t0 != null && !on) || performance.now() > limit) done({ kind, ms: t0 == null ? 0 : Math.round(performance.now() - t0) }); else requestAnimationFrame(f);
        };
        f();
      });
    });
    for (const sq of [from, to]) { const p = await at(sq); await page.mouse.click(p.x, p.y); }
    const timing = page.evaluate(() => window.__quiet);
    if (tapAfter != null) { await page.waitForTimeout(tapAfter); const p = await at(56); await page.mouse.click(p.x, p.y); }
    const r = await timing;
    await page.waitForFunction(([from, to]) => window.view.pos.board[from] === 0 && window.view.pos.board[to] > 0, [from, to], { timeout: 5000 }).catch(async e => {
      console.log(r, { moves: await lanMoves(page), context: await contextText(page) }, await page.evaluate(() => ({ dialogs: [...document.querySelectorAll('dialog[open]')].map(d => d.id + ':' + d.textContent.slice(0, 120)), save: localStorage.getItem('kingdown.save'), board: [...window.view.pos.board].map((v, i) => v ? i : -1).filter(i => i >= 0) })));
      throw e;
    });
    return r;
  };
  const glides = [];
  for (const [fen, from, to, gait] of [['7k/8/8/8/8/8/8/R6K w - - 0 1', 0, 24, 'glide'], ['7k/8/8/8/8/8/4P3/K7 w - - 0 1', 12, 28, 'hop'], ['7k/p7/8/8/8/8/8/3K4 w - - 0 1', 3, 4, 'walk']]) {
    const n = await quiet(fen, from, to, 'normal'), f = await quiet(fen, from, to, 'fast');
    assert.equal(n.kind, gait, `quiet move ${from}-${to}: ${gait}`);
    assert.ok(n.ms < 560 && f.ms < n.ms * 0.7, `quiet ${gait}: normal ${n.ms} ms, fast ${f.ms} ms`);
    glides.push(`${gait} ${n.ms}/${f.ms} ms`);
  }
  const qTap = await quiet('7k/8/8/8/8/8/8/R6K w - - 0 1', 0, 24, 'normal', 80), qOff = await quiet('7k/8/8/8/8/8/8/R6K w - - 0 1', 0, 24, 'off');
  assert.ok(qTap.ms < 300, `quiet tap-skip ${qTap.ms} ms`);
  assert.equal(qOff.kind, null, 'Off: no quiet animation');
  await page.evaluate(() => { const s = document.getElementById('pace'); s.value = 'normal'; s.dispatchEvent(new Event('change')); });
  console.log(`ok quiet moves (normal/fast): ${glides.join(', ')}; tap-skip ${qTap.ms} ms; off none`);
  // 2d. Review: a move in the list shows the board after it, ← steps back, → replays the next move,
  // the board reads pieces meanwhile; Back to game or Esc returns to play.
  {
    const u = new URL(url); u.searchParams.set('fen', '7k/8/8/3p4/4P3/8/8/K7 w - - 0 1'); u.searchParams.set('players', 'human,human');
    await page.goto(u.href);
    await page.waitForFunction(() => window.view?.pos?.board[35] > 0);
    await page.evaluate(() => window.view.ready());
    for (const sq of [28, 35, 63, 62]) { const p = await at(sq); await page.mouse.click(p.x, p.y); await page.waitForFunction(() => !window.view.scene.animating); if (sq === 35 || sq === 62) await endTurn(page); }
    await waitForUi(page, ui => /Kh8-g8/.test(ui.lan.join(' ')));
    const board = () => page.evaluate(() => [28, 35, 62, 63].map(sq => window.view.pos.board[sq] > 0 ? 1 : 0).join(''));
    assert.equal(await board(), '0110', 'live: pawn on d5, king on g8');
    await openMoves(page); await moveRow(page, 1).click();
    assert.equal(await board(), '0101', 'after move 1: pawn on d5, king still on h8');
    assert.equal(await page.textContent('#turn'), 'Reviewing after 1. e4xd5');
    const pawn = await at(35); await page.mouse.click(pawn.x, pawn.y);
    assert.equal(await board(), '0101', 'a tap reads the shown board and keeps Review');
    await page.click('#back-to-game');
    assert.equal(await board(), '0110', 'Back to game returns to the live board');
    await openMoves(page); await moveRow(page, 1).click(); await page.keyboard.press('ArrowLeft');
    assert.equal(await board(), '1101', 'the start: both pawns, king on h8');
    await page.keyboard.press('ArrowRight');
    assert.ok(await page.evaluate(() => window.view.scene.animating), '→ replays the capture');
    await page.waitForFunction(() => !window.view.scene.animating);
    assert.equal(await board(), '0101');
    assert.equal(await moveRow(page, 1).getAttribute('aria-current'), 'true');
    await page.keyboard.press('Escape');
    assert.equal(await board(), '0110');
    assert.equal((await lanMoves(page)).length, 2, 'review changes no move');
    console.log('ok review: list, arrows, replay, return');
  }

  // 2e. Key moments are parked (docs/PARKED.md): Black mates on e1, the king topples, and Review opens the
  // move list with no key-moment search.
  {
    const u = new URL(url); u.searchParams.set('fen', '4r1k1/8/8/8/8/8/5PPP/R5K1 w - - 0 1'); u.searchParams.set('players', 'human,human');
    await page.goto(u.href);
    await page.waitForFunction(() => window.view?.pos?.board[60] > 0);
    await page.evaluate(() => window.view.ready());
    for (const sq of [0, 48, 60, 4]) { const p = await at(sq); await page.mouse.click(p.x, p.y); await page.waitForFunction(() => !window.view.scene.animating); if (sq === 48 || sq === 4) await endTurn(page); }
    await openEndReview(page);
    assert.equal(await page.evaluate(() => window.view.fallen?.sq), 6, 'the mated king on g1 topples');
    await page.waitForTimeout(1000);
    assert.equal(await page.locator('#over-moments button').count(), 0, 'Review starts no key-moment search');
    console.log('ok key moments are parked');
    await page.evaluate(() => localStorage.removeItem('kingdown.save')); // leave the finished game for a fresh table
    await page.goto(url.href);
    await page.waitForFunction(() => window.view?.ready);
    await page.evaluate(() => window.view.ready());
  }
  // 2f. The game link (parked, docs/PARKED.md) has its own check by name: link-game.
  // 2g. A resigned game against the computer: the resigning White king topples. (Lessons and Today's army are parked: docs/PARKED.md.)
  {
    await startGame(page, { mode: 'computer', side: 'white', army: 'classic' });
    await confirmResign(page);
    await page.waitForFunction(() => document.getElementById('over').open);
    assert.equal(await page.evaluate(() => window.view.fallen?.sq), await page.evaluate(() => window.view.pos.board.findIndex(v => v === 6)), 'the resigning White king topples');
    assert.equal(await page.locator('#share-result').count(), 0, "no Copy today's result");
    await page.keyboard.press('Escape');
    console.log('ok resign: the White king topples');
  }
  console.log(`ok animations: normal ${normal.ms} ms, fast ${fast.ms} ms, tap-skip ${tapped.ms} ms, off ${off.ms} ms`);

  // 2i. A game with a Workshop design: the Workshop and the game link are parked (docs/PARKED.md), so the design game
  // check lives in the parked check link-game (tools/verify-link-game.mjs).

  // 3. Phone width: the board fits without horizontal scrolling.
  const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  await phone.addInitScript(() => sessionStorage.setItem('kingdown.title-seen', '1')); // skip the title screen (main.ts)
  trapErrors(phone);
  await phone.goto(url.origin + url.pathname); // no parameter: painted must be the default
  await phone.waitForFunction(() => document.getElementById('board').classList.contains('painted') && document.querySelector('#board canvas')?.clientWidth > 300);
  await phone.evaluate(() => window.view.ready()); // the art, so the screenshot shows the board
  const fit = await phone.evaluate(() => ({ doc: document.documentElement.scrollWidth, board: document.querySelector('#board canvas').getBoundingClientRect().width }));
  assert.ok(fit.doc <= 390 && fit.board >= 340, JSON.stringify(fit));
  await shot(phone, 'phone');
  console.log(`ok phone: board ${Math.round(fit.board)} px`);
  assertNoErrors();
} finally { await browser.close(); }
