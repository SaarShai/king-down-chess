// D-4: Start game over an unfinished game shows the warn line, and Close keeps the game and its save.
// In a lesson, that game is the one Return to game keeps. A finished game and a game with no move need no warn line.
import assert from 'node:assert/strict';
import { startLesson, lanMoves, startNewGame, waitForUi } from '../app-ui.mjs';

/** You play White against the computer, two moves in. */
const UNFINISHED = { back: 'RNBQKBNR', fen: '', moves: ['e2-e4', 'e7-e5'], white: 'human', black: 'ai', skill: 'club', sound: false };

const saved = page => page.evaluate(() => JSON.parse(localStorage.getItem('kingdown.save')));
const plies = async page => (await lanMoves(page)).length;
const dialogOpen = page => page.evaluate(() => document.getElementById('new-game').open);
/** A false answer leaves the sheet open when it has a warn line. */
const start = (page, accept) => startNewGame(page, accept);

export default async function ({ open }) {
  {
    const { page, tap, close } = await open({ save: UNFINISHED });
    // An unfinished game: the sheet warns. The warn line keeps the game and its save until Start.
    assert.equal(await start(page, false), 'This ends your game at move 2.', 'an unfinished game shows its move');
    assert.deepEqual((await saved(page)).moves, ['e2-e4', 'e7-e5'], 'Cancel keeps the save');
    assert.equal(await plies(page), 2, 'Cancel keeps the game');
    assert.equal(await dialogOpen(page), true, 'Cancel keeps the New game dialog open');
    // Start begins the new game (you play White, so no move is made).
    assert.ok(await start(page, true));
    await page.waitForFunction(() => !document.getElementById('new-game').open);
    assert.deepEqual((await saved(page)).moves, [], 'OK starts the new game');
    // A game with no move needs no warn line.
    assert.equal(await start(page, false), null, 'no question before the first move');
    await page.waitForFunction(() => !document.getElementById('new-game').open);
    // A lesson over a game with no move needs no warn line, also after its goal move.
    await startLesson(page);
    await tap(27); await tap(36); // lesson 1: the Archer shoots
    await waitForUi(page, ui => !!ui.lessonLearned);
    assert.equal(await plies(page), 1);
    assert.equal(await start(page, false), null, 'no question in a lesson');
    await page.waitForFunction(() => !document.getElementById('new-game').open);
    assert.doesNotMatch(await page.textContent('#turn'), /Lesson/, 'the new game ends the lesson');
    await close();
  }
  // In a lesson, the sheet warns about the game that Return to game keeps. Cancel keeps that game and its save.
  {
    const { page, close } = await open({ save: UNFINISHED });
    await startLesson(page);
    assert.equal(await start(page, false), 'This ends your game at move 2.', 'a lesson warns about the kept game');
    assert.deepEqual((await saved(page)).moves, ['e2-e4', 'e7-e5'], 'Cancel keeps the save');
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.getElementById('new-game').open);
    await page.click('#return-game');
    assert.equal(await plies(page), 2, 'Return to game opens the kept game');
    await close();
  }
  // A finished game needs no warn line. The save opens with its result dialog, so the pace comes from the save.
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
