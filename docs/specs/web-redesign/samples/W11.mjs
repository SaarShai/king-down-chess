// Previously with Motion Off, See again, and a full Haste turn.
import assert from 'node:assert/strict';
import { assertHiddenDetail } from '../../../../tools/previously-layout-check.mjs';
const controls = '#undo, #end-turn, #menu-btn, #moves-line';
const settled = async ({ page }) => {
  await page.waitForFunction(() => document.getElementById('context-text').dataset.rank === 'previously'
    && !window.view.scene.animating && document.getElementById('see-again').getAttribute('aria-disabled') === 'false');
};
const haste = async state => {
  await settled(state);
  assert.match(await state.page.locator('#context-text > span').nth(1).innerText(), /a1 (to|takes) a5 with Haste, then (to|takes) e5/);
};
export default {
  sizes: ['smallPhone', 'phone', 'desktop'],
  states: [
    { name: 'haste-chain', motion: 'normal', query: `?${new URLSearchParams({ fen: 'k7/6pp/5pp/3pp1pp/2nS3p/8/8/K7 b - - 0 1', rules: '2017', kings: 'flame:haste,none', moves: 'Ka8-a7_Sd4xc4xd5xe5xf6!H_Sf6xg7xh7xg6xh5xg5xh4' })}`, controls: `${controls}, #see-again`, steps: async state => {
      await settled(state);
      assert.equal(await state.page.locator('#context-text > span').nth(1).textContent(), 'Beast d4 takes c4 and d5 and e5 and f6 with Haste, then takes g7 and h7 and g6 and h5 and g5 and h4.');
      if (state.size === 'smallPhone') await assertHiddenDetail(state.page);
    } },
    { name: 'long-turn', motion: 'normal', query: `?${new URLSearchParams({ fen: '7k/6p1/5p2/3pp3/2nS4/8/8/K7 b - - 0 1', moves: 'Kh8-h7_Sd4xc4xd5xe5xf6' })}`, controls: `${controls}, #see-again`, steps: async state => {
      await settled(state);
      assert.equal(await state.page.locator('#context-text > span').first().innerText(), 'Previously: their beast took 4 pieces.');
      assert.ok(await state.page.locator('#context-text').evaluate(el => {
        const area = document.getElementById('context-line').getBoundingClientRect(), box = el.getBoundingClientRect();
        return box.bottom <= document.getElementById('moves-line').getBoundingClientRect().top && box.top >= area.top && box.bottom <= area.bottom;
      }), 'the long friend turn stays above Moves');
    } },
    { name: 'previously', query: '?army=RNBQKBNR&moves=e2-e4_e7-e5', controls, steps: settled },
    { name: 'see-again', motion: 'normal', query: '?army=RNBQKBNR&moves=e2-e4_e7-e5', controls: `${controls}, #see-again`, steps: async state => {
      await settled(state);
      await state.page.locator('#see-again').waitFor({ state: 'visible' });
    } },
    { name: 'haste-turn', query: `?${new URLSearchParams({ fen: '7k/8/8/8/8/8/8/R5K1 b - - 0 1', kings: 'flame:haste,none', moves: 'Kh8-h7_Ra1-a5!H_Ra5-e5' })}`, controls, steps: haste },
    { name: 'haste-takes', motion: 'normal', query: `?${new URLSearchParams({ fen: '7k/8/8/r3r3/8/8/8/R5K1 b - - 0 1', rules: '2017', kings: 'flame:haste,none', moves: 'Kh8-h7_Ra1xa5!H_Ra5xe5' })}`, controls, steps: async state => {
      await haste(state);
      assert.equal(await state.page.locator('#context-text > span').first().innerText(), 'Previously: their rook took your rook.');
    } },
  ],
};
