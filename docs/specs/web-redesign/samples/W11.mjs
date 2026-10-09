// W11: the kept Previously still, with Motion Off.
export default {
  sizes: ['phone', 'desktop'],
  states: [{
    name: 'previously',
    query: '?army=RNBQKBNR&moves=e2-e4_e7-e5',
    controls: '#undo, #end-turn, #menu-btn, #moves-line',
    steps: async ({ page }) => {
      await page.waitForFunction(() => document.getElementById('context-text').dataset.rank === 'previously');
    },
  }],
};
