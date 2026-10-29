// D-9: each copy action says "copied" only after the copy succeeds, and says so when the copy fails.
// Copy moves, Copy today's result and Send the game link are parked (docs/PARKED.md), so the game screen has no
// copy action now. This check asserts that none shows. The copy outcome steps return with a copy action
// (`git log -- tools/ux-defects/d9-copy-feedback.mjs` holds them).
import assert from 'node:assert/strict';

const GAME = { back: 'RNBQKBNR', fen: '', moves: ['e2-e4'], white: 'human', black: 'human', sound: false, skill: 'club', pace: 'off' };

export default async function ({ open }) {
  const game = await open({ save: GAME, pace: null });
  assert.equal(await game.page.locator('#copy, #share').count(), 0, 'Copy moves and Send the game link are parked');
  await game.close();

  // A saved game from Today's army still loads, and its result dialog has no copy action.
  const daily = await open({ save: { ...GAME, black: 'ai', daily: '2026-10-08', resigned: 0 }, pace: null });
  await daily.page.waitForSelector('#over[open]');
  assert.equal(await daily.page.locator('#share-result').count(), 0, "no Copy today's result");
  await daily.close();
}
