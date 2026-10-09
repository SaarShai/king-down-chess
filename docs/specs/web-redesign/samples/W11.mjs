// Previously with Motion Off, See again, and a full Haste turn.
import assert from 'node:assert/strict';
const controls = '#undo, #end-turn, #menu-btn, #moves-line';
const settled = async ({ page }) => {
  await page.waitForFunction(() => document.getElementById('context-text').dataset.rank === 'previously'
    && !window.view.scene.animating && document.getElementById('see-again').getAttribute('aria-disabled') === 'false');
};
const haste = async state => {
  await settled(state);
  assert.match(await state.page.locator('#context-text > span').first().innerText(), /a1 to a5.* Then .*a5 to e5/);
};
export default {
  sizes: ['smallPhone', 'phone', 'desktop'],
  states: [
    { name: 'previously', query: '?army=RNBQKBNR&moves=e2-e4_e7-e5', controls, steps: settled },
    { name: 'see-again', motion: 'normal', query: '?army=RNBQKBNR&moves=e2-e4_e7-e5', controls: `${controls}, #see-again`, steps: async state => {
      await settled(state);
      await state.page.locator('#see-again').waitFor({ state: 'visible' });
    } },
    { name: 'haste-turn', query: `?${new URLSearchParams({ fen: '7k/8/8/8/8/8/8/R5K1 b - - 0 1', kings: 'flame:haste,none', moves: 'Kh8-h7_Ra1-a5!H_Ra5-e5' })}`, controls, steps: haste },
    { name: 'haste-turn-end', query: `?${new URLSearchParams({ fen: '7k/8/8/8/8/8/8/R5K1 b - - 0 1', kings: 'flame:haste,none', moves: 'Kh8-h7_Ra1-a5!H_Ra5-e5' })}`, controls, steps: async state => {
      await haste(state);
      await state.page.locator('#context-text').evaluate(el => { el.scrollTop = el.scrollHeight; });
    } },
  ],
};
