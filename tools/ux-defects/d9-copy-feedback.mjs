// D-9: each copy action says "copied" only after the copy succeeds, says so when the copy fails, and
// Copy moves gives feedback too. The page's Clipboard API is a stub, so each outcome is certain. The
// fallback copy keeps the keyboard focus on the button.
import assert from 'node:assert/strict';
import { openMenu, openThisGame } from '../app-ui.mjs';

const GAME = { back: 'RNBQKBNR', fen: '', moves: ['e2-e4'], white: 'human', black: 'human', sound: false, skill: 'club', pace: 'off' };

/**
 * The Clipboard API in `mode`: 'wait' never answers, 'ok' copies, 'no' refuses and so does the
 * execCommand fallback, 'fallback' refuses and the real execCommand fallback copies.
 */
const clipboard = (page, mode) => page.evaluate(async mode => {
  delete navigator.clipboard.writeText;
  await navigator.clipboard.writeText('nothing yet'); // the browser's own clipboard: headless, not the system's
  navigator.clipboard.writeText = () => (mode === 'wait' ? new Promise(() => {}) : mode === 'ok' ? Promise.resolve() : Promise.reject(new DOMException('Refused', 'NotAllowedError')));
  if (mode === 'no') document.execCommand = () => false; else delete document.execCommand;
}, mode);

/** Clicks the copy button `sel` with the clipboard in `mode`; gives the button's text and the clipboard's. */
async function copy(page, sel, mode) {
  await clipboard(page, mode);
  await page.click(sel);
  await page.waitForTimeout(300);
  return { text: (await page.locator(sel).innerText()).trim(), copied: await page.evaluate(() => navigator.clipboard.readText()) };
}

/** Each outcome of one copy action: no "copied" while the copy waits or after it fails; `done` after it succeeds. */
async function outcomes(page, sel, done, holds, before = () => {}) {
  for (const [mode, want] of [['wait', null], ['no', /could not copy/i], ['ok', done], ['fallback', done]]) {
    await before();
    const { text, copied } = await copy(page, sel, mode);
    if (want) assert.match(text, want, `${sel} with the clipboard "${mode}"`);
    if (!want || mode === 'no') assert.doesNotMatch(text, /copied/i, `${sel} with the clipboard "${mode}"`);
    if (mode === 'fallback') assert.match(copied, holds, `${sel}: the fallback copies the text`);
    await page.keyboard.press('Escape'); // closes Settings; on the game screen it does nothing here
    await page.waitForTimeout(2600); // the button's own text comes back
  }
}

/** The fallback copy from the keyboard: Enter on the focused button says `done`, and the focus stays on the button. */
async function keepsFocus(page, sel, done, before = () => {}) {
  await before();
  await clipboard(page, 'fallback');
  await page.focus(sel);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  assert.match((await page.locator(sel).innerText()).trim(), done, `${sel} from the keyboard, the fallback path`);
  assert.equal(await page.evaluate(() => `#${document.activeElement?.id}`), sel, `${sel}: the focus stays on the button after the fallback copy`);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(2600);
}

export default async function ({ open }) {
  const game = await open({ save: GAME, pace: null });
  await game.page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await outcomes(game.page, '#share', /^Link copied/, /moves=e2-e4/, () => openMenu(game.page));
  await outcomes(game.page, '#copy', /^Moves copied$/, /^1\. e2-e4$/, () => openThisGame(game.page));
  await keepsFocus(game.page, '#share', /^Link copied/, () => openMenu(game.page));
  await keepsFocus(game.page, '#copy', /^Moves copied$/, () => openThisGame(game.page));
  await game.close();

  const daily = await open({ save: { ...GAME, black: 'ai', daily: '2026-10-08', resigned: 0 }, pace: null });
  await daily.page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await daily.page.waitForSelector('#over[open] #share-result:not([hidden])');
  const reopen = () => daily.page.evaluate(() => { const over = document.getElementById('over'); if (!over.open) over.showModal(); });
  await outcomes(daily.page, '#share-result', /^Result copied$/, /^King Down daily 2026-10-08 /, reopen);
  await keepsFocus(daily.page, '#share-result', /^Result copied$/, reopen);
  await daily.close();
}
