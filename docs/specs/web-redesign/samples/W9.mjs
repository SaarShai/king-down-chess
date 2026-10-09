import { pressMenu, startLesson, waitForUi } from '../../../../tools/app-ui.mjs';

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
  }, {
    name: 'archer-learned', save,
    controls: '#next-lesson, #return-game',
    steps: async ({ page, tap }) => {
      await page.evaluate(() => localStorage.removeItem('kingdown.lessons'));
      await startLesson(page, 'Archer');
      await tap(27); await tap(45);
      await waitForUi(page, ui => ui.lessonLearned === 'Archer');
      if (await page.locator('#next-lesson').innerText() !== 'Next lesson: Beast') throw new Error('Archer must lead to Beast.');
    },
  }, {
    name: 'all-learned', save, controls: '.shelf-piece, #learn, .shelf-safe, .lesson-guide-head button',
    steps: async ({ page }) => {
      await page.evaluate(() => localStorage.setItem('kingdown.lessons', JSON.stringify({ done: ['Archer', 'Beast', 'Maester', 'Ogre', 'Guard', 'Paladin'] })));
      await pressMenu(page, 'Guide');
      await page.locator('.shelf-figure img').evaluateAll(imgs => Promise.all(imgs.map(img => img.decode())));
    },
  }, {
    name: 'shelf-focus', save, controls: '.lesson-guide-head button, .shelf-piece[data-piece="archer"]',
    steps: async ({ page }) => {
      await pressMenu(page, 'Guide');
      await page.keyboard.press('Tab');
      await page.locator('.shelf-piece[data-piece="archer"]').focus();
      await page.locator('.shelf-figure img').evaluateAll(imgs => Promise.all(imgs.map(img => img.decode())));
    },
  }],
};
