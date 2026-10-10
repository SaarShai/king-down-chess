import { arriveContinue } from '../../../../tools/app-ui.mjs';
// W5: still check causes. Run with SAMPLE=W5 and the sample tool.
const checked = (name, fen, look = 'painted') => ({
  name,
  query: `?fen=${encodeURIComponent(fen)}&players=human,human&look=${look}`,
  controls: '#undo, #end-turn, #menu-btn',
  steps: async ({ page }) => page.waitForFunction(() =>
    document.querySelector('.king-in-check') && document.querySelector('#context-text').dataset.rank === 'check' && !document.querySelector('dialog[open]')),
});

export default {
  sizes: ['phone', 'desktop'],
  states: [
    { name: 'online-in-check', save: { back: '', fen: '4k2R/8/8/8/8/P7/8/7K b - - 0 1', moves: [], white: 'human', black: 'human', link: 0, sound: false }, controls: '#undo, #end-turn, #menu-btn',
      steps: async ({ page }) => page.waitForFunction(() => document.getElementById('context-text').textContent.includes('Your rook attacks their king.')) },
    { name: 'computer-in-check', title: true, save: { back: '', fen: '4k2R/8/8/8/8/8/P7/7K w - - 0 1', moves: ['a2-a3'], white: 'human', black: 'ai', sound: false },
      controls: '#undo, #end-turn, #menu-btn', steps: async ({ page }) => {
        await page.evaluate(() => { Worker.prototype.postMessage = () => {}; });
        await arriveContinue(page).click(); await page.waitForFunction(() => document.getElementById('context-text').textContent.includes('Your rook attacks their king.'));
      } },
    checked('archer-over-piece', '7k/8/8/8/8/4a3/4P3/4K3 w - - 0 1'),
    checked('clay-check', '7k/8/8/8/8/4a3/4P3/4K3 w - - 0 1', 'clay'),
    checked('light-square', '7k/8/8/8/4a3/4P3/4K3/8 w - - 0 1'),
    checked('knight-check', '7k/p7/8/8/8/5n2/8/4K3 w - - 0 1'),
    checked('double-check', '4k3/8/8/8/8/5n2/8/4K2r w - - 0 1'),
  ],
};
