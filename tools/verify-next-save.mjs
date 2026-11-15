// The new page's save wiring (src/interface/play/main.ts, interface-playable issue 01): the write after a step,
// Undo, End turn and the computer's reply; the stored game type; Continue of an old-page save with Strong, which
// plays and writes as Club; the stored Motion speed, Coordinates and Sound stay; the kept line and copy of a save
// that this page cannot open. Unit tests cannot reach main.ts.
import assert from 'node:assert/strict';
import { assertNoErrors, env, launch, trapErrors } from './lib/checks.mjs';
const browser = await launch();
const NEXT = new URL('next.html', env('PLAYABLE_URL')).href;
const MAIN = '.play-home .kd-button[data-kind="main"]', END = '.play-turn .kd-button[data-kind="main"]';
async function open(save, kept) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  // Each write of the save, in order. The seed goes in before the record starts, so it is not a write of the page.
  await context.addInitScript(([save, kept]) => {
    if (save) localStorage.setItem('kingdown.save', JSON.stringify(save));
    if (kept) localStorage.setItem('kingdown.save.kept', JSON.stringify(kept));
    window.writes = [];
    const set = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'kingdown.save') { const s = JSON.parse(value); window.writes.push({ moves: s.moves.length, staged: s.staged ?? 0, skill: s.skill, pace: s.pace, coords: s.coords, sound: s.sound }); }
      return set.call(this, key, value);
    };
  }, [save ?? null, kept ?? null]);
  const page = await context.newPage(); trapErrors(page);
  await page.goto(NEXT); await page.waitForSelector('.play-home');
  return { page, context };
}
const writes = page => page.evaluate(() => window.writes);
const ready = page => page.waitForFunction(() => document.body.dataset.page === 'game' && /^(Your turn\.|Your move is ready\.|Now make your move\.|Check\.)/.test(document.querySelector('.play-state')?.textContent ?? ''), null, { timeout: 30000 });
/** Stage a pawn step: tap a pawn, then a square with a legal action description. */
async function pawnStep(page) {
  for (let sq = 8; sq < 16; sq++) {
    await page.click(`.play-square[data-square="${sq}"]`);
    const to = await page.evaluate(from => {
      const action = `Your Pawn moves from ${String.fromCharCode(97 + from % 8)}${1 + (from >> 3)} to `;
      const c = [...document.querySelectorAll('.play-square[aria-description]')].find(cell => cell.getAttribute('aria-description').includes(action));
      return c ? Number(c.dataset.square) : null;
    }, sq);
    if (to != null) { await page.click(`.play-square[data-square="${to}"]`); return; }
    await page.click(`.play-square[data-square="${sq}"]`);
  }
  throw new Error('no pawn step');
}
try {
  {
    // A fresh device: With powers (in the New game panel, launch decision 26), a step, Undo, a step, End turn and the reply.
    const { page, context } = await open();
    await page.click('.home-hero button'); await page.waitForSelector('dialog.new-game-panel[open]');
    await page.getByRole('checkbox', { name: 'With powers', exact: true }).click();
    await page.getByRole('button', { name: 'Start game', exact: true }).click(); await ready(page);
    assert.equal(await page.evaluate(() => localStorage.getItem('kingdown.game-type')), 'powers', 'the last game type is stored');
    assert.deepEqual((await writes(page)).map(w => [w.moves, w.staged]), [[0, 0]], 'the new game writes a save with no move');
    await pawnStep(page);
    assert.deepEqual((await writes(page)).at(-1), { moves: 1, staged: 1, skill: 'beginner', pace: 'off', coords: true, sound: false }, 'a step writes the staged turn; reduced motion gives Off');
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    assert.deepEqual((await writes(page)).at(-1).moves, 0, 'Undo writes');
    await pawnStep(page); await page.click(END); await ready(page);
    const after = (await writes(page)).slice(-3).map(w => [w.moves > 1 ? 'more' : w.moves, w.staged]);
    assert.deepEqual(after, [[1, 1], [1, 0], ['more', 0]], 'End turn writes the handed-over turn, then the reply writes');
    await context.close();
  }
  {
    // An old-page save at Strong with the computer to move: Continue, no Versus, the reply writes Club and keeps the stored settings.
    const { page, context } = await open({ back: 'RNBQKBNR', fen: '', moves: ['e2-e4'], white: 'human', black: 'ai', coords: false, link: null, daily: null, resigned: null, skill: 'strong', sound: true, pace: 'fast' });
    assert.equal(await page.locator(MAIN).innerText(), 'Continue');
    // The saved game card (launch decision 25): the level, the game type and the turn, and who is to move.
    assert.deepEqual(await page.locator('.home-copy').first().evaluate(copy => [...copy.children].map(node => node.textContent)), ['Fierce computer', 'Pieces · Turn 1', 'Computer to move']);
    await page.click(MAIN); await ready(page);
    assert.equal(await page.locator('.play-versus').count(), 0, 'Continue shows no Versus');
    assert.deepEqual((await writes(page)).at(-1), { moves: 2, staged: 0, skill: 'club', pace: 'fast', coords: false, sound: true }, 'the reply writes Club and the stored settings');
    await context.close();
  }
  {
    // Saves that this page cannot open: a king power of an older engine, and a game of two people that the old page
    // played on after its copy (a Dark game opens since side choice). The home shows the kept line and no Continue; the copy holds the newest bytes.
    const old = { back: 'RNBQKBNR', fen: '', moves: ['e2-e4'], white: 'human', black: 'ai', coords: true, link: null, daily: null, resigned: null, rules: { kings: [{ king: 'Mud', power: 'OldPower' }, null], hands: [[], []] } };
    const pair = { ...old, white: 'human', black: 'human', rules: undefined };
    const branched = { ...pair, moves: ['e2-e4', 'd7-d6'], staged: 1 };
    const withDefaults = { ...pair, rules: { kings: [null, null], hands: [[], []] } };
    // Missing rules and explicit defaults name the same game; staged steps may change after Undo.
    const cases = [[old], [{ ...pair, moves: ['e2-e4', 'e7-e5', 'd2-d4'] }, pair],
      [{ ...pair, moves: ['e2-e4', 'e7-e6', 'f2-f3'] }, branched],
      [{ ...withDefaults, moves: ['e2-e4', 'e7-e6', 'f2-f3'] }, pair]];
    for (const side of [0, 1]) for (const king of [{ king: 'Frost', power: ['Freeze'] }, { king: ['Frost'], power: 'Freeze' }]) {
      const kings = [null, null]; kings[side] = king;
      cases.push([{ ...old, moves: ['e2-e4', 'e7-e5'], rules: { ...old.rules, kings } }]);
    }
    for (const [save, kept] of cases) {
      const { page, context } = await open(save, kept);
      assert.equal(await page.locator(MAIN).innerText(), 'New game', 'no Continue');
      assert.ok((await page.locator('.play-home .home-note').allInnerTexts()).includes('A game from the earlier version cannot open here yet. It is kept.'), 'the kept line shows');
      const stored = await page.evaluate(() => [localStorage.getItem('kingdown.save'), localStorage.getItem('kingdown.save.kept')]);
      assert.equal(stored[1], stored[0], 'the copy holds the newest bytes');
      await page.click(MAIN); await page.getByRole('button', { name: 'Start game', exact: true }).click(); await ready(page);
      assert.equal(await page.evaluate(() => localStorage.getItem('kingdown.save.kept')), stored[0], 'a new game keeps the rejected bytes');
      await context.close();
    }
  }
  assertNoErrors();
  console.log('ok next-save: writes after a step, Undo, End turn and the reply; the game type; Continue of a Strong save as Club with its settings; the kept line for an older engine and a game of two people played on');
} finally {
  await browser.close();
}
