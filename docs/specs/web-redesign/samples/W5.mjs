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
    checked('archer-over-piece', '7k/8/8/8/8/4a3/4P3/4K3 w - - 0 1'),
    checked('clay-check', '7k/8/8/8/8/4a3/4P3/4K3 w - - 0 1', 'clay'),
    checked('light-square', '7k/8/8/8/4a3/4P3/4K3/8 w - - 0 1'),
    checked('knight-check', '7k/p7/8/8/8/5n2/8/4K3 w - - 0 1'),
    checked('double-check', '4k3/8/8/8/8/5n2/8/4K2r w - - 0 1'),
  ],
};
