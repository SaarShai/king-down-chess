// The read-only card, Share sheet and mini-card shelf. Renders stay outside Git.
// Run: SAMPLE=W12 node docs/specs/web-ux/capture.mjs <base-url> <out-dir>.
import { keepWorkshopCopy } from '../../../../tools/app-ui.mjs';

const design = {
  kind: 'piece', name: 'Rook Rider',
  look: { figure: 'antler-guardian', body: 'token', auto: true, glow: null, army: 0 },
  letter: 'D', squares: [{ x: 1, y: 2, mark: 'both' }, { x: -1, y: 2, mark: 'both' }],
  lines: ['n', 'e', 's', 'w'], rules: [],
};
const query = `?design=${Buffer.from(JSON.stringify(design)).toString('base64url')}`;
const save = { back: 'SQBKRSML', fen: '', moves: [], white: 'human', black: 'human', sound: false, pace: 'off' };
const copy = async page => {
  await page.locator('#workshop .ws-read').waitFor();
  await keepWorkshopCopy(page).click();
  await page.locator('.ws-add').waitFor();
};

export default {
  sizes: ['smallPhone', 'phone', 'desktop'],
  states: [
    { name: 'read-only', query, save, controls: '#workshop .ws-bar button, #workshop .ws-footer button',
      steps: async ({ page }) => { await page.locator('.ws-read').waitFor(); } },
    { name: 'share', query, save, controls: '.ws-sheet[open] .ws-sheet-bar button',
      steps: async ({ page }) => { await copy(page); await page.click('.ws-share'); await page.locator('.ws-sheet[open]').waitFor(); } },
    { name: 'share-actions', query, save, controls: '.ws-sheet[open] .ws-sheet-bar button',
      steps: async ({ page }) => { await copy(page); await page.click('.ws-share'); await page.locator('.ws-sheet[open] .ws-share-actions').scrollIntoViewIfNeeded(); } },
    { name: 'shelf', query, save, controls: '#workshop .ws-bar button',
      steps: async ({ page }) => { await copy(page); await page.click('.ws-back'); await page.locator('.ws-tile').waitFor(); } },
  ],
};
