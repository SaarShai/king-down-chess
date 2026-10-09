// The harness: the game opens at both sizes with a saved game, and the board answers screenOf.
import assert from 'node:assert/strict';

export default async function ({ open }) {
  for (const size of ['desktop', 'phone']) {
    const { page, close } = await open({ size, save: { back: 'RNBQKBNR', fen: '', moves: ['e2-e4'], white: 'human', black: 'ai', sound: false, skill: 'club' } });
    const p = await page.evaluate(() => window.view.screenOf(12));
    assert.ok(p.x > 0 && p.y > 0, `${size}: screenOf gives a point on the page`);
    await close();
  }
}
