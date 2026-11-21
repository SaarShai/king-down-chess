// The new page's save wiring (src/interface/play/main.ts, interface-playable issue 01): the write after a step,
// Undo, End turn and the computer's reply; the stored game type; Continue of an old-page save with Strong, which
// plays and writes as Fierce; the stored Motion speed, Coordinates and Sound stay; the kept line and copy of a save
// that this page cannot open. Unit tests cannot reach main.ts.
import assert from 'node:assert/strict';
import { assertNoErrors, env, launch, shot, trapErrors } from './lib/checks.mjs';
import { kingDisplayName, panelText, releaseDriver, stateText, text } from './lib/release-browser.mjs';
const browser = await launch();
const NEXT = new URL('next.html', env('PLAYABLE_URL')).href;
const button = (page, name) => page.getByRole('button', { name, exact: true });
async function open(save, kept) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  // Each write of the save, in order. The seed goes in before the record starts, so it is not a write of the page.
  await context.addInitScript(([save, kept]) => {
    localStorage.setItem('kingdown.solo-launch-seen', '1');
    if (save) localStorage.setItem('kingdown.save', JSON.stringify(save));
    if (kept) localStorage.setItem('kingdown.save.kept', JSON.stringify(kept));
    window.writes = [];
    window.sawVersus = false;
    const versus = new MutationObserver(records => {
      for (const { addedNodes } of records) for (const node of addedNodes) {
        if (node instanceof Element && (node.matches('.play-versus') || node.querySelector('.play-versus'))) window.sawVersus = true;
      }
    });
    versus.observe(document, { childList: true, subtree: true });
    const set = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'kingdown.save') { const s = JSON.parse(value); window.writes.push({ moves: s.moves.length, staged: s.staged ?? 0, skill: s.skill, pace: s.pace, coords: s.coords, sound: s.sound }); }
      return set.call(this, key, value);
    };
  }, [save ?? null, kept ?? null]);
  const page = await context.newPage(); trapErrors(page);
  const driver = releaseDriver(page, NEXT);
  await driver.openHome();
  return { page, context, driver };
}
const writes = page => page.evaluate(() => window.writes);
const ready = page => page.waitForFunction(lines => document.body.dataset.page === 'game' && lines.includes(document.querySelector('.play-state')?.textContent), [text.ready, text.first, text.check]);
try {
  {
    // A fresh device: With powers (in the New game panel, launch decision 26), a step, Undo, a step, End turn and the reply.
    const { page, context, driver } = await open();
    await driver.openSoloSetup();
    await button(page, panelText.yourKing).click();
    await button(page, kingDisplayName('Spirit')).click();
    await driver.goBack(0);
    await driver.startFromSetup(); await ready(page);
    assert.equal(await page.evaluate(() => localStorage.getItem('kingdown.game-type')), 'powers', 'the last game type is stored');
    assert.deepEqual((await writes(page)).map(w => [w.moves, w.staged]), [[0, 0]], 'the new game writes a save with no move');
    await driver.movePawn();
    assert.deepEqual((await writes(page)).at(-1), { moves: 1, staged: 1, skill: 'beginner', pace: 'off', coords: true, sound: false }, 'a step writes the staged turn; reduced motion gives Off');
    await button(page, text.undo).click();
    assert.deepEqual((await writes(page)).at(-1).moves, 0, 'Undo writes');
    await driver.movePawn(); await button(page, text.finish).click(); await ready(page);
    const after = (await writes(page)).slice(-3).map(w => [w.moves > 1 ? 'more' : w.moves, w.staged]);
    assert.deepEqual(after, [[1, 1], [1, 0], ['more', 0]], 'End turn writes the handed-over turn, then the reply writes');
    await context.close();
  }
  {
    // An old-page save at Strong with the computer to move: Continue, no Versus, the reply writes Fierce and keeps the stored settings.
    const { page, context, driver } = await open({ back: 'RNBQKBNR', fen: '', moves: ['e2-e4'], white: 'human', black: 'ai', coords: false, link: null, daily: null, resigned: null, skill: 'strong', sound: true, pace: 'fast' });
    assert.equal(await button(page, text.resume).count(), 1, 'the saved game has one Continue button');
    const card = page.locator('.home-start .home-card');
    assert.deepEqual(await card.locator('.home-game-copy').evaluate(copy => [...copy.children].map(node => node.textContent)), [text.computer, text.club]);
    assert.equal(await card.locator('.home-state strong').innerText(), stateText.computer);
    const mini = card.locator('.mini-board');
    assert.equal(await mini.locator('.mini-cell').count(), 64);
    assert.equal(await mini.locator('[data-square="12"] img').count(), 0, 'e2 is empty on the home preview');
    assert.equal(await mini.locator('[data-square="28"] img').count(), 1, 'e4 has a piece on the home preview');
    assert.equal(await mini.locator('[data-square="28"] img').getAttribute('data-code'), '1', 'the Light pawn is on e4');
    assert.deepEqual(await mini.locator('.mini-last').evaluateAll(cells => cells.map(cell => Number(cell.dataset.square)).sort((a, b) => a - b)), [12, 28], 'the home preview marks e2 and e4');
    await shot(page, 'saved-home');
    await driver.continueGame(); await ready(page);
    assert.equal(await page.evaluate(() => window.sawVersus), false, 'Continue shows no Versus');
    assert.deepEqual((await writes(page)).at(-1), { moves: 2, staged: 0, skill: 'club', pace: 'fast', coords: false, sound: true }, 'the reply writes Fierce and the stored settings');
    const resumed = await page.evaluate(() => JSON.parse(localStorage.getItem('kingdown.save')));
    assert.deepEqual(resumed.moves.slice(0, 1), ['e2-e4'], 'the saved first turn stays');
    assert.deepEqual(resumed.rules.kings, [null, null], 'Continue keeps Pieces only');
    assert.deepEqual(resumed.rules.hands, [[], []], 'Continue keeps no cards');
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
      const { page, context, driver } = await open(save, kept);
      assert.equal(await button(page, text.resume).count(), 0, 'no Continue row');
      assert.equal(await button(page, text.play).count(), 1, 'the main action starts a new game');
      await page.getByText(text.kept, { exact: true }).waitFor();
      const stored = await page.evaluate(() => [localStorage.getItem('kingdown.save'), localStorage.getItem('kingdown.save.kept')]);
      assert.equal(stored[1], stored[0], 'the copy holds the newest bytes');
      assert.ok(await driver.startGame(), 'Play opens the full board'); await ready(page);
      assert.equal(await page.evaluate(() => localStorage.getItem('kingdown.save.kept')), stored[0], 'a new game keeps the rejected bytes');
      await context.close();
    }
  }
  assertNoErrors();
  console.log('ok next-save: writes after a step, Undo, End turn and the reply; the game type; Continue of a Strong save as Fierce with its settings; the kept line for an older engine and a game of two people played on');
} finally {
  await browser.close();
}
