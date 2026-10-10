// The read-only card, Share sheet and mini-card shelf. Renders stay outside Git.
// Run: SAMPLE=W12 node docs/specs/web-ux/capture.mjs <base-url> <out-dir>.
import { keepWorkshopCopy, pressMenu } from '../../../../tools/app-ui.mjs';

const design = {
  kind: 'piece', name: 'Rook Rider',
  look: { figure: 'antler-guardian', body: 'token', auto: true, glow: null, army: 0 },
  letter: 'D', squares: [{ x: 1, y: 2, mark: 'both' }, { x: -1, y: 2, mark: 'both' }],
  lines: ['n', 'e', 's', 'w'], rules: [],
};
const linkQuery = piece => `?design=${Buffer.from(JSON.stringify(piece)).toString('base64url')}`;
const query = linkQuery(design);
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
    { name: 'share', query, save, controls: '.ws-sheet[open] .ws-sheet-bar button, .ws-sheet[open] .ws-share-actions button:not([hidden])',
      steps: async ({ page }) => { await copy(page); await page.evaluate(() => Object.defineProperty(navigator, 'share', { value: async () => {}, configurable: true })); await page.click('.ws-share'); await page.locator('.ws-sheet[open]').waitFor(); } },
    { name: 'share-actions', query, save, controls: '.ws-sheet[open] .ws-sheet-bar button, .ws-sheet[open] .ws-share-actions button:not([hidden])',
      steps: async ({ page }) => { await copy(page); await page.evaluate(() => Object.defineProperty(navigator, 'share', { value: undefined, configurable: true })); await page.click('.ws-share'); await page.locator('.ws-sheet[open] .ws-share-actions').scrollIntoViewIfNeeded(); } },
    { name: 'shelf', query, save, controls: '#workshop .ws-bar button',
      steps: async ({ page }) => { await copy(page); await page.click('.ws-back'); await page.locator('.ws-tile').waitFor(); } },
    { name: 'rules', query: linkQuery({ ...design, rules: [
      { when: { on: 'takes' }, does: { a: 'chain' } },
      { when: { on: 'always' }, does: { a: 'cannotTake', what: 'king' } },
      { when: { on: 'always' }, does: { a: 'linesPass', over: 'own' } },
    ] }), save, controls: '.ws-sheet[open] .ws-sheet-bar button, .ws-sheet[open] .ws-share-actions button:not([hidden])',
      steps: async ({ page }) => { await copy(page); await page.click('.ws-share'); await page.locator('.ws-read-rules').scrollIntoViewIfNeeded(); } },
    { name: 'shooter', query: linkQuery({ ...design, name: 'Tower Archer', lines: [], squares: [
      { x: 1, y: 1, mark: 'both' }, { x: -1, y: 1, mark: 'both' },
      { x: 0, y: 2, mark: 'shoot' }, { x: 0, y: -2, mark: 'shoot' },
    ] }), save, controls: '#workshop .ws-bar button, #workshop .ws-footer button',
      steps: async ({ page }) => { await page.locator('.ws-read .c-shoot').first().waitFor(); } },
    { name: 'empty', save,
      controls: '.ws-sheet[open] .ws-sheet-bar button, .ws-sheet[open] .ws-share-actions button:not([hidden])',
      steps: async ({ page }) => {
        await pressMenu(page, 'Workshop');
        await page.click('[data-door="piece"]');
        await page.click('[data-new-figure="antler-guardian"]');
        await page.click('.ws-share');
        await page.locator('.ws-sheet[open] .ws-read .ws-worth').scrollIntoViewIfNeeded();
      } },
    { name: 'long-names', query: linkQuery({ ...design, name: 'North Tower Knight' }), save,
      controls: '#workshop .ws-bar button',
      steps: async ({ page }) => {
        await copy(page);
        await page.click('.ws-share');
        await page.click('.ws-sheet[open] .ws-dup');
        await page.click('.ws-back');
        await page.locator('.ws-tile').first().waitFor();
      } },
  ],
};
