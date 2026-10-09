import { pressMenu } from '../../../../tools/app-ui.mjs';

const save = { back: 'RNBQKBNR', fen: '', moves: ['e2-e4', 'e7-e5'], white: 'human', black: 'human', pace: 'off', sound: false };
export default {
  sizes: ['phone', 'desktop'],
  states: [{
    name: 'piece-shelf', save,
    controls: '.shelf-piece, #learn, .shelf-safe, .lesson-guide-head button',
    steps: async ({ page }) => {
      await page.evaluate(() => localStorage.setItem('kingdown.lessons', JSON.stringify({ done: ['Archer', 'Beast', 'Maester', 'Ogre'] })));
      await pressMenu(page, 'Guide');
      await page.locator('.shelf-figure img').evaluateAll(imgs => Promise.all(imgs.map(img => img.decode())));
    },
  }],
};
