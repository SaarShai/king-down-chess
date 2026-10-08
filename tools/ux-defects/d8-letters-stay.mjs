// D-8: Piece letters stay on after a reload and a look change (painted and clay). An old save with no
// letters field still loads, and ?labels=1 still turns the letters on.
import assert from 'node:assert/strict';

/** Records each view.setLabels() value in window.letters (main.ts sets window.view before its first setLabels). */
const recordLetters = () => {
  let view;
  Object.defineProperty(window, 'view', {
    configurable: true,
    get: () => view,
    set(v) { const set = v.setLabels.bind(v); v.setLabels = on => { window.letters = on; set(on); }; view = v; },
  });
};

const OLD_SAVE = { back: 'RNBQKBNR', fen: '', moves: ['e2-e4'], white: 'human', black: 'ai', sound: false, skill: 'club' };

export default async function ({ open }) {
  const { page, ready, close } = await open({ save: OLD_SAVE });
  await page.context().addInitScript(recordLetters);
  const state = () => page.evaluate(() => ({ box: document.getElementById('labels').checked, view: window.letters, moves: document.getElementById('moves').textContent }));
  const settings = async act => { await page.click('#settings-btn'); await act(); await page.keyboard.press('Escape'); };

  assert.equal((await state()).box, false, 'an old save with no letters field: the letters stay off');
  assert.match((await state()).moves, /e4/, 'an old save with no letters field: its game loads');

  await settings(() => page.check('#labels'));
  await page.reload();
  await ready();
  assert.deepEqual(await state().then(s => [s.box, s.view]), [true, true], 'the letters stay on after a reload');

  for (const look of ['clay', 'painted']) {
    await page.click('#settings-btn');
    await Promise.all([page.waitForURL(u => u.searchParams.get('look') === look), page.selectOption('#look', look)]);
    await ready();
    assert.deepEqual(await state().then(s => [s.box, s.view]), [true, true], `the letters stay on after the look changes to ${look}`);
  }

  await settings(() => page.uncheck('#labels'));
  await page.reload();
  await ready();
  assert.deepEqual(await state().then(s => [s.box, s.view]), [false, false], 'the letters stay off after a reload');
  await close();

  const url = await open({ save: { ...OLD_SAVE, labels: false }, query: '?labels=1' });
  assert.equal(await url.page.evaluate(() => document.getElementById('labels').checked), true, '?labels=1 turns the letters on over a saved off');
  await url.close();
}
