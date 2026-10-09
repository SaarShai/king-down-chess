// W4: three reads and four sets of verb marks.
const save = fen => ({ back: '', fen, moves: [], white: 'human', black: 'human', sound: false, pace: 'off' });
const controls = '#undo, #menu-btn, #moves-line, #all-rules';
export default {
  sizes: ['phone', 'desktop'],
  states: [
    { name: 'read-archer', save: save('7k/8/2a5/8/2P5/8/8/K7 w - - 0 1'), controls, steps: ({ tap }) => tap(42) },
    { name: 'read-ogre', save: save('7k/8/8/2P5/2o5/8/8/K7 w - - 0 1'), controls, steps: ({ tap }) => tap(26) },
    { name: 'read-frozen', query: '?kings=frost:freeze,none', save: save('4k3/p7/8/3n4/8/8/P7/4K3 w - - 0 1'), controls, steps: async ({ page, tap }) => { await page.click('#power-btn'); await tap(35); await page.waitForFunction(() => !document.getElementById('power-btn').classList.contains('armed')); await tap(35); } },
    { name: 'shove', save: save('7k/8/8/2p5/2O5/8/P7/K7 w - - 0 1'), controls, steps: ({ tap }) => tap(26) },
    { name: 'bites-1-and-2', save: save('7k/8/5p2/3pp3/2nS4/8/8/K7 w - - 0 1'), controls: `${controls}, #stop-chain`, steps: async ({ tap }) => { await tap(27); await tap(26); await tap(35); } },
    { name: 'swap', save: save('7k/8/8/8/8/8/P7/MN5K w - - 0 1'), controls, steps: ({ tap }) => tap(0) },
    { name: 'shot', save: save('7k/8/8/8/2p5/8/2A5/K7 w - - 0 1'), controls, steps: ({ tap }) => tap(10) },
  ],
};
