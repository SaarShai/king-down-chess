// D-4: Start game over an unfinished game asks first, and Cancel keeps the game and its save.
// A finished game, a game with no move and a lesson need no question.
import assert from 'node:assert/strict';

const saved = page => page.evaluate(() => JSON.parse(localStorage.getItem('kingdown.save')));
const plies = page => page.locator('#moves [data-ply]').count();
const dialogOpen = page => page.evaluate(() => document.getElementById('new-game').open);
/** Opens New game and presses Start game; answers a question with OK when `accept`, else Cancel. Returns the question, or null. */
async function start(page, accept) {
  if (!await dialogOpen(page)) await page.click('#new-game-btn');
  let asked = null;
  const answer = d => { asked = d.message(); void (accept ? d.accept() : d.dismiss()); };
  page.on('dialog', answer);
  try { await page.click('#start-game'); } finally { page.off('dialog', answer); }
  return asked;
}

export default async function ({ open }) {
  {
    const { page, tap, close } = await open({ save: { back: 'RNBQKBNR', fen: '', moves: ['e2-e4', 'e7-e5'], white: 'human', black: 'ai', skill: 'club', sound: false } });
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
    // A lesson needs no question, also after its goal move.
    await page.click('#rules-btn'); await page.click('#learn');
    await tap(27); await tap(36); // lesson 1: the Archer shoots
    await page.waitForFunction(() => document.getElementById('moment').textContent.startsWith('Well done.'));
    assert.equal(await plies(page), 1);
    assert.equal(await start(page, false), null, 'no question in a lesson');
    await page.waitForFunction(() => !document.getElementById('new-game').open);
    assert.doesNotMatch(await page.textContent('#turn'), /Lesson/, 'the new game ends the lesson');
    await close();
  }
  // A finished game needs no question. The save opens with its result dialog, so the pace comes from the save.
  {
    const { page, close } = await open({ pace: null, save: { back: 'RNBQKBNR', fen: '', moves: ['e2-e4', 'e7-e5'], white: 'human', black: 'ai', skill: 'club', sound: false, pace: 'off', resigned: 0 } });
    await page.waitForFunction(() => document.getElementById('over').open);
    await page.click('#over button[value="close"]');
    assert.equal(await start(page, false), null, 'no question after the game is over');
    await page.waitForFunction(() => !document.getElementById('new-game').open);
    assert.deepEqual((await saved(page)).moves, []);
    await close();
  }
}
