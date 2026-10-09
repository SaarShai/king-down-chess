// D-4: Start game over an unfinished game asks first, and Cancel keeps the game and its save.
// In a lesson, that game is the one Return to game keeps. A finished game and a game with no move need no question.
import assert from 'node:assert/strict';
import { lanMoves, pressMenu, waitForUi } from '../app-ui.mjs';

/** You play White against the computer, two moves in. */
const UNFINISHED = { back: 'RNBQKBNR', fen: '', moves: ['e2-e4', 'e7-e5'], white: 'human', black: 'ai', skill: 'club', sound: false };

const saved = page => page.evaluate(() => JSON.parse(localStorage.getItem('kingdown.save')));
const plies = async page => (await lanMoves(page)).length;
const dialogOpen = page => page.evaluate(() => document.getElementById('new-game').open);
/** Opens New game and presses Start game; answers a question with OK when `accept`, else Cancel. Returns the question, or null. */
async function start(page, accept) {
  if (!await dialogOpen(page)) await pressMenu(page, 'New game');
  let asked = null;
  const answer = d => { asked = d.message(); void (accept ? d.accept() : d.dismiss()); };
  page.on('dialog', answer);
  try { await page.click('#start-game'); } finally { page.off('dialog', answer); }
  return asked;
}

export default async function ({ open }) {
  {
    const { page, tap, close } = await open({ save: UNFINISHED });
    // An unfinished game: Start game asks. Cancel keeps the game, its save and the open dialog.
    assert.equal(await start(page, false), 'Start a new game? It replaces your current game.', 'an unfinished game asks first');
    assert.deepEqual((await saved(page)).moves, ['e2-e4', 'e7-e5'], 'Cancel keeps the save');
    assert.equal(await plies(page), 2, 'Cancel keeps the game');
    assert.equal(await dialogOpen(page), true, 'Cancel keeps the New game dialog open');
    // OK starts the new game (you play White, so no move is made).
    assert.ok(await start(page, true));
    await page.waitForFunction(() => !document.getElementById('new-game').open);
    assert.deepEqual((await saved(page)).moves, [], 'OK starts the new game');
    // A game with no move needs no question.
    assert.equal(await start(page, false), null, 'no question before the first move');
    await page.waitForFunction(() => !document.getElementById('new-game').open);
    // A lesson over a game with no move needs no question, also after its goal move.
    await pressMenu(page, 'Guide'); await page.click('#learn');
    await tap(27); await tap(36); // lesson 1: the Archer shoots
    await waitForUi(page, ui => /^Well done\./m.test(ui.context));
    assert.equal(await plies(page), 1);
    assert.equal(await start(page, false), null, 'no question in a lesson');
    await page.waitForFunction(() => !document.getElementById('new-game').open);
    assert.doesNotMatch(await page.textContent('#turn'), /Lesson/, 'the new game ends the lesson');
    await close();
  }
  // In a lesson, Start game asks about the game that Return to game keeps. Cancel keeps that game and its save.
  {
    const { page, close } = await open({ save: UNFINISHED });
    await pressMenu(page, 'Guide'); await page.click('#learn');
    assert.equal(await start(page, false), 'Start a new game? It replaces your current game.', 'a lesson over an unfinished game asks first');
    assert.deepEqual((await saved(page)).moves, ['e2-e4', 'e7-e5'], 'Cancel keeps the save');
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.getElementById('new-game').open);
    await page.click('#return-game');
    assert.equal(await plies(page), 2, 'Return to game opens the kept game');
    await close();
  }
  // A finished game needs no question. The save opens with its result dialog, so the pace comes from the save.
  {
    const { page, close } = await open({ pace: null, save: { ...UNFINISHED, pace: 'off', resigned: 0 } });
    await page.waitForFunction(() => document.getElementById('over').open);
    await page.click('#over button[value="close"]');
    assert.equal(await start(page, false), null, 'no question after the game is over');
    await page.waitForFunction(() => !document.getElementById('new-game').open);
    assert.deepEqual((await saved(page)).moves, []);
    await close();
  }
}
