// W1: the real turn press, its Undo floor and the guarded link send.
import assert from 'node:assert/strict';
import { usePower, startLesson, confirmResign, endTurn, lanMoves, setPace, waitForUi } from './app-ui.mjs';
import { assertNoErrors, env, launch, trapErrors } from './lib/checks.mjs';
const base = env('PLAYABLE_URL'), browser = await launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.addInitScript(() => {
  sessionStorage.setItem('kingdown.title-seen', '1');
  const seed = sessionStorage.getItem('w1.seed');
  if (seed) { localStorage.setItem('kingdown.save', seed); sessionStorage.removeItem('w1.seed'); }
});
trapErrors(page);
page.on('dialog', d => d.accept());
const sq = name => (name.charCodeAt(1) - 49) * 8 + name.charCodeAt(0) - 97;
const tap = async name => {
  const p = await page.evaluate(s => window.view.screenOf(s), sq(name));
  await page.mouse.click(p.x, p.y);
};
const open = async (fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1', query = '', moves = [], computer = false) => {
  await page.goto(base);
  await page.evaluate(({ fen, moves, computer }) => sessionStorage.setItem('w1.seed', JSON.stringify({ back: '', fen, moves, white: 'human', black: computer ? 'ai' : 'human', resigned: null, pace: 'off', sound: false, queen: false, skill: 'beginner' })), { fen, moves, computer });
  await page.goto(new URL(query || '?think=50', base).href);
  await page.waitForFunction(() => window.view?.pos);
  await page.evaluate(() => window.view.ready());
};
const move = async (from, to) => { await tap(from); await tap(to); await page.waitForFunction(() => !window.view.scene.animating); };
const undo = async () => page.click('#undo');
const undoOff = () => page.getAttribute('#undo', 'aria-disabled');
try {
  if (process.argv[2] !== 'link') {
    await open('7k/p7/8/8/8/r7/8/R6K w - - 0 1');
    await setPace(page, 'normal');
    await move('a1', 'a3');
    await undo();
    assert.equal(await page.evaluate(() => window.view.scene.animating), true, 'Undo plays backward');
    await page.waitForFunction(() => !window.view.scene.animating && window.view.pos.board[0] > 0);
    assert.equal(await page.evaluate(() => window.view.scene.position.board[16]), 20, 'the black rook returns');
    assert.equal(await page.evaluate(() => window.view.scene.animating), false, 'the rewind ends');
    console.log('ok capture rewinds; victim returns; no move remains');

    await open('4k3/p7/8/3n4/8/8/P7/4K3 w - - 0 1', '?kings=frost:freeze,none');
    await setPace(page, 'normal');
    await usePower(page); await tap('d5'); await move('a2', 'a3');
    await page.evaluate(() => { document.getElementById('undo').click(); document.getElementById('undo').click(); });
    await waitForUi(page, ui => ui.lan.length === 0 && !window.view.scene.animating);
    assert.equal(await page.evaluate(() => window.view.pos.board[8]), 1, 'two presses put the pawn back');
    assert.equal(await page.evaluate(() => window.view.pos.marks?.[0] ?? null), null, 'the second press removes Freeze');
    assert.doesNotMatch(await page.locator('#context-text').textContent(), /taken back|Undo/, 'Undo has no words on screen');
    console.log('ok rapid Undo ends the old rewind and takes the next ply');

    await open(undefined, '', [], true);
    await setPace(page, 'normal');
    await move('e2', 'e4'); await endTurn(page);
    await page.waitForFunction(() => window.view.scene.lifted != null, null, { timeout: 5000, polling: 10 });
    assert.equal(await page.evaluate(() => window.view.scene.animating), false, 'the tell comes before the reply');
    assert.deepEqual(await lanMoves(page), ['e2-e4'], 'the lift plays no move');
    await waitForUi(page, ui => ui.lan.length === 2 && !ui.thinking && !window.view.scene.animating);
    assert.equal(await page.evaluate(() => window.view.scene.lifted), null, 'the reply clears the lift');
    console.log('ok computer lifts the mover before its reply');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(undefined, '', [], true); await setPace(page, 'normal');
    await move('e2', 'e4'); await endTurn(page);
    await page.waitForFunction(() => window.view.scene.lifted != null, null, { timeout: 5000, polling: 10 });
    assert.equal(await page.evaluate(() => window.view.scene.animating), false, 'the still tell comes before the reply');
    assert.deepEqual(await lanMoves(page), ['e2-e4'], 'the still cue plays no move');
    await waitForUi(page, ui => ui.lan.length === 2 && !window.view.scene.animating);
    assert.equal(await page.evaluate(() => window.view.scene.lifted), null, 'the reply clears the still cue');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    console.log('ok reduced motion keeps a still computer tell');

    await open(undefined, '', [], true);
    assert.equal(await page.locator('#hint,#end-haste').count(), 0);
    assert.equal(await page.getAttribute('#end-turn', 'aria-disabled'), 'true');
    await move('e2', 'e4'); await page.waitForTimeout(300);
    assert.deepEqual(await lanMoves(page), ['e2-e4'], 'the computer waits');
    await undo(); assert.deepEqual(await lanMoves(page), []);
    assert.equal(await undoOff(), 'true');
    await move('e2', 'e4'); await endTurn(page);
    await waitForUi(page, ui => ui.lan.length === 2 && !ui.thinking);
    assert.equal(await undoOff(), 'true');
    console.log('ok computer waits; Undo stops at the press');

    await open(); await move('e2', 'e4'); await move('e7', 'e5');
    assert.deepEqual(await lanMoves(page), ['e2-e4'], 'next side cannot move');
    assert.equal(await page.textContent('#turn'), 'White to move');
    await endTurn(page); await move('e7', 'e5');
    assert.deepEqual(await lanMoves(page), ['e2-e4', 'e7-e5']);
    await undo(); assert.deepEqual(await lanMoves(page), ['e2-e4']);
    assert.equal(await undoOff(), 'true');
    console.log('ok one device; next side waits and Undo takes one ply');

    await open(); await move('e2', 'e4'); await endTurn(page);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'board', 'a pointer press keeps board focus');
    assert.equal(await page.locator('.mk-cursor').count(), 0, 'a pointer turn press shows no keyboard cursor');
    await move('e7', 'e5'); await page.locator('#end-turn').focus(); await endTurn(page, { keyboard: true });
    assert.equal(await page.evaluate(() => document.activeElement.id), 'board', 'a keyboard press returns board focus');
    assert.equal(await page.locator('.mk-cursor').count(), 1, 'a keyboard turn press shows the square cursor');
    assert.match(await page.locator('#cursor-say').innerText(), /e2/, 'the keyboard cursor reads its square');
    console.log('ok turn press: pointer has no cursor; keyboard has a cursor and square text');


    await open('7k/p7/8/8/8/8/8/R5K1 w - - 0 1', '?kings=flame:haste,none');
    await usePower(page); await move('a1', 'a4'); await endTurn(page);
    assert.deepEqual(await lanMoves(page), ['Ra1-a4!H', '--']);
    console.log('ok Haste press records the pass');

    await open('4k3/p7/8/3n4/8/8/P7/4K3 w - - 0 1', '?kings=frost:freeze,none');
    await usePower(page); await tap('d5'); await move('a2', 'a3');
    await undo(); assert.deepEqual(await lanMoves(page), ['!F:d5']);
    await undo(); assert.deepEqual(await lanMoves(page), []);
    await usePower(page); await tap('d5'); await move('a2', 'a3'); await endTurn(page);
    assert.deepEqual(await lanMoves(page), ['!F:d5', 'a2-a3']);
    assert.equal(await undoOff(), 'true');
    console.log('ok free Freeze, move, one-ply Undo and press');

    for (const [fen, from, to, dialog, cancel] of [
      ['4k3/P7/8/3n4/8/8/8/4K3 w - - 0 1', 'a7', 'a8', '#promo', '#cancel-promo'],
      ['4k3/8/8/2pn4/2O5/8/8/4K3 w - - 0 1', 'c4', 'c5', '#move-choice', '#cancel-choice'],
    ]) {
      await open(fen, '?kings=frost:freeze,none');
      await usePower(page); await tap('d5');
      assert.equal(await undoOff(), 'false');
      await move(from, to); await page.locator(dialog).waitFor({ state: 'visible' });
      assert.equal(await undoOff(), 'true', 'Undo is off during the choice');
      assert.equal(await page.getAttribute('#end-turn', 'aria-disabled'), 'true');
      await page.click(cancel);
      assert.equal(await undoOff(), 'false', 'Cancel keeps Undo for the mark');
      assert.deepEqual(await lanMoves(page), ['!F:d5']);
      await undo(); assert.deepEqual(await lanMoves(page), []);
    }
    console.log('ok free-mark choices turn Undo off; Cancel restores it');

    await open('6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1');
    await move('a1', 'a8');
    assert.equal(await page.locator('#over').isVisible(), false, 'staged mate waits');
    await undo(); assert.deepEqual(await lanMoves(page), []);
    await move('a1', 'a8'); await endTurn(page);
    await page.locator('#over').waitFor({ state: 'visible' });
    assert.equal(await undoOff(), 'true');
    console.log('ok staged mate; Undo removes it; press ends it');
    await page.keyboard.press('Escape');

    await open(); await move('e2', 'e4'); await confirmResign(page);
    const save = await page.evaluate(() => JSON.parse(localStorage.getItem('kingdown.save')));
    assert.deepEqual([save.moves, save.resigned], [[], 0]);
    console.log('ok staged Resign drops the turn and gives up White');
    await page.keyboard.press('Escape');

    await open(); await startLesson(page);
    assert.equal(await page.isHidden('#end-turn'), true);
    assert.equal(await page.isHidden('#undo'), true);
    await page.click('#show-me');
    await page.waitForFunction(() => window.view.marks.hint.length > 0 && !document.getElementById('show-me').disabled);
    assert.deepEqual(await page.evaluate(() => window.view.marks.hint), [27, 45]);
    await move('d4', 'f6'); await waitForUi(page, ui => !!ui.lessonLearned);
    console.log('ok Show me marks the lesson goal');
  } else {
    // An opened link plays Black. Stub only the browser share/copy boundary.
    await open(undefined, '?army=RNBQKBNR&moves=e2-e4');
    await page.evaluate(() => {
      window.sent = [];
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async url => { window.sent.push(url); } } });
    });
    await move('e7', 'e5'); await endTurn(page);
    assert.equal(await page.textContent('#end-turn'), 'Send again');
    assert.equal(await page.locator('.mk-cursor').count(), 0, 'a pointer send shows no keyboard cursor');
    assert.equal(await page.locator('#end-turn').evaluate(b => getComputedStyle(b).fontWeight), '700', 'Send again has live ink');
    assert.equal(await page.locator('#end-turn').evaluate(b => getComputedStyle(b).borderBottomWidth), '2px', 'Send again has an outline');
    assert.equal(await undoOff(), 'true');
    assert.equal(new URL(await page.evaluate(() => window.sent[0])).searchParams.get('moves'), 'e2-e4_e7-e5');
    await endTurn(page);
    assert.equal(await page.evaluate(() => window.sent[0] === window.sent[1]), true);
    console.log('ok copy hands over; Send again keeps the link');

    await open(undefined, '?army=RNBQKBNR&moves=e2-e4');
    await page.evaluate(() => {
      const original = window.matchMedia;
      window.matchMedia = q => q === '(pointer: coarse)' ? { matches: true } : original(q);
      Object.defineProperty(navigator, 'share', { configurable: true, writable: true, value: async () => { throw new DOMException('cancel', 'AbortError'); } });
    });
    await move('e7', 'e5'); await endTurn(page);
    await page.waitForFunction(() => document.getElementById('end-turn').getAttribute('aria-disabled') === 'false');
    assert.equal(await undoOff(), 'false');
    assert.equal(await page.textContent('#end-turn'), 'Send your turn');
    assert.deepEqual(await lanMoves(page), ['e2-e4', 'e7-e5']);
    console.log('ok cancelled share keeps the staged turn');
    await page.evaluate(() => {
      window.sends = 0;
      navigator.share = async () => { window.sends++; await new Promise(r => { window.finishSend = r; }); };
      document.getElementById('end-turn').click(); document.getElementById('end-turn').click();
    });
    assert.equal(await page.evaluate(() => window.sends), 1);
    await page.evaluate(() => window.finishSend());
    await page.waitForFunction(() => document.getElementById('undo').getAttribute('aria-disabled') === 'true');
    console.log('ok double press sends once');

    // Old links stop mid-turn; the receiver ends the sender's first Haste move.
    await open(undefined, '?kings=flame:haste,none&fen=7k/p7/8/8/8/8/8/R5K1%20w%20-%20-%200%201&moves=Ra1-a4!H');
    assert.deepEqual(await lanMoves(page), ['Ra1-a4!H', '--']);
    console.log('ok old mid-Haste link finishes for the sender');

    await open(undefined, '?kings=none,flame:haste&fen=r5k1/8/8/8/8/8/P7/7K%20w%20-%20-%200%201&moves=Kh1-g1');
    await page.evaluate(() => {
      window.sent = [];
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async url => { window.sent.push(url); } } });
    });
    await usePower(page); await move('a8', 'a5'); await endTurn(page);
    assert.equal(new URL(await page.evaluate(() => window.sent[0])).searchParams.get('moves'), 'Kh1-g1_Ra8-a5!H_--');
    assert.deepEqual(await lanMoves(page), ['Kh1-g1', 'Ra8-a5!H', '--']);
    console.log('ok mid-Haste send includes and commits the pass');
  }
  assertNoErrors();
} finally { await browser.close(); }
