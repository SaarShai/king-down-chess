// D-5: Strong and Club are different opponents. Strong thinks 2.5 s and Club 0.8 s, Settings has no
// Thinking time slider, and an old save with the removed `think` field still loads.
import assert from 'node:assert/strict';

/** Records the time budget of each search that the page sends to the AI worker (src/game.ts Engine). */
const recordBudgets = () => {
  window.budgets = [];
  const post = Worker.prototype.postMessage;
  Worker.prototype.postMessage = function (data, ...rest) {
    if (data?.opts) window.budgets.push(data.opts.timeMs);
    return post.call(this, data, ...rest);
  };
};

export default async function ({ open }) {
  for (const [skill, ms] of [['strong', 2500], ['club', 800]]) {
    const { page, close } = await open();
    // An old save: the computer plays White, so it thinks as soon as the page opens.
    await page.addInitScript(recordBudgets);
    await page.evaluate(s => localStorage.setItem('kingdown.save', JSON.stringify(s)),
      { back: 'RNBQKBNR', fen: '', moves: [], white: 'ai', black: 'human', think: 800, skill, sound: false, pace: 'off' });
    await page.reload();
    await page.waitForFunction(() => window.budgets?.length > 0);
    assert.equal(await page.evaluate(() => window.budgets[0]), ms, `${skill}: the computer's thinking time`);
    assert.equal(await page.locator('#think').count(), 0, 'Settings has no Thinking time slider');
    await close();
  }
}
