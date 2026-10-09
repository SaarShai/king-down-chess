// The browser checks use these stable actions and readouts when the controls move.
import { isDeepStrictEqual } from 'node:util';

/** The menu items and the button of each one today. */
const MENU = { 'New game': '#new-game-btn', Guide: '#rules-btn', Workshop: '#workshop-btn', Settings: '[data-go="help"]' };

export function menuItem(page, name) {
  if (!Object.hasOwn(MENU, name)) throw new Error(`menuItem: no menu item "${name}"; the items are ${Object.keys(MENU).join(', ')}`);
  return page.locator(MENU[name]);
}

/** The first visit has one Start. A returning game opens Home. */
export function titleStart(page) {
  return page.locator('#title-start:visible, #title-play:visible, #home-new:visible').first();
}

/** Learn opens from Guide after the first deal; a returning title still has Learn. */
export function arriveContinue(page) {
  return page.locator('#home-main:visible, #title-continue:visible').first();
}

export async function learnFromTitle(page, { tap = false } = {}) {
  const learn = page.locator('#title-learn');
  if (await learn.isVisible()) { await (tap ? learn.tap() : learn.click()); return; }
  if (!await page.locator('#home-head').isVisible()) await (tap ? titleStart(page).tap() : titleStart(page).click());
  await page.waitForFunction(() => !document.getElementById('title-screen').open);
  await startLesson(page, 'Archer', { tap });
}

export async function openMenu(page, options = {}) {
  const { tap = false, ...press } = options;
  if (await page.evaluate(() => document.getElementById('menu-sheet').open)) await page.locator('#menu-close').click(press);
  await (tap ? page.locator('#menu-btn').tap(press) : page.locator('#menu-btn').click(press));
}

export const closeMenu = page => page.locator('#menu-close').click();

export async function pressMenu(page, name, { tap = false, ...press } = {}) {
  await openMenu(page, { tap, ...press });
  if (name === 'New game' || name === 'Workshop') {
    const route = page.locator(`[data-go="${name === 'New game' ? 'new' : 'extra'}"]`);
    await (tap ? route.tap(press) : route.click(press));
  }
  const item = menuItem(page, name);
  await (tap ? item.tap(press) : item.click(press));
}

/** A named figure starts the same lesson even when another figure is Next. */
export async function startLesson(page, name = 'Archer', { tap = false } = {}) {
  await pressMenu(page, 'Guide', { tap });
  const figure = page.locator(`#lesson-shelf .shelf-piece[data-piece="${name.toLowerCase()}"]`);
  await (tap ? figure.tap() : figure.click());
}

export async function openExtra(page) {
  await openMenu(page);
  await page.locator('[data-go="extra"]').click();
}
export async function openTricks(page) {
  await openExtra(page);
  await page.locator('[data-go="tricks"]').click();
}
export async function openAccount(page) {
  await openExtra(page);
  await page.locator('[data-go="account"]').click();
}
export async function openThisGame(page) {
  await openExtra(page);
  await page.locator('[data-go="game"]').click();
}
export async function openResign(page) {
  await openMenu(page);
  await page.locator('#resign').click();
}
export async function confirmResign(page) {
  await openResign(page);
  await page.locator('#resign-confirm').click();
}

export async function startNewGame(page, accept = true) {
  if (!await page.evaluate(() => document.getElementById('new-game').open)) await pressMenu(page, 'New game');
  const warning = await page.evaluate(() => {
    const line = document.getElementById('new-game-warn');
    if (!line) throw new Error('startNewGame: the page has no #new-game-warn');
    return line.hidden ? null : line.textContent.trim();
  });
  if (accept || !warning) await page.click('#start-game');
  return warning;
}



export async function boardHelp(page, act, options = {}) {
  await pressMenu(page, 'Settings', options);
  await act();
  await page.locator('#menu-close').click();
}

export async function setPace(page, value) {
  await openMenu(page);
  await page.selectOption('#pace', value);
  await page.locator('#menu-close').click();
}

export async function focusBoard(page) {
  await page.locator('#menu-btn').focus();
  await page.keyboard.press('Tab');
  await page.locator('#board').focus();
}

export async function leaveBoard(page) {
  await page.locator('#menu-btn').focus();
}

export async function endTurn(page, { keyboard = false } = {}) {
  await page.waitForFunction(() => {
    const b = document.getElementById('end-turn');
    return b && !b.hidden && b.getAttribute('aria-disabled') === 'false';
  });
  if (keyboard) await page.keyboard.press('Enter');
  else await page.click('#end-turn');
}

export const powerCoin = (page, side) => page.locator(side ? `#power-${side}` : '.player-strip.is-turn .coin');
/** An off coin still reads. Use is a separate control. */
export const readPower = (page, side) => powerCoin(page, side).click();
export async function usePower(page) {
  await readPower(page);
  await page.locator('#power-use').click();
}
export const powerButtonText = page => powerCoin(page).getAttribute('aria-label');
export const powersHidden = async page => await page.locator('.coin').count() === 0;
/** The board's arrow keys move its cursor. Review arrows start outside the board. */
export async function previousReview(page) {
  await page.locator('#back-to-game').focus();
  await page.keyboard.press('ArrowLeft');
}
export const seeAgain = page => page.locator('#see-again[aria-disabled="false"]').click();

/** An opened link finishes its replay before the check taps the board. */
export const waitForLinkReplay = page => page.waitForFunction(() => document.getElementById('see-again').getAttribute('aria-disabled') === 'false');

/**
 * What the readouts show, read in the page. Playwright sends the source of this function to the page,
 * so it uses nothing from this module.
 */
export function readUi() {
  const element = id => {
    const found = document.getElementById(id);
    if (!found) throw new Error(`app-ui: the page has no #${id}`);
    return found;
  };
  const text = id => element(id).textContent.trim();
  const lan = row => row.dataset.lan; // a key moment adds ? or ?? to its row
  const moves = element('moves'), rows = [...moves.querySelectorAll('[data-ply]')];
  const status = text('status'), thinking = status === 'thinking…';
  const context = (element('context-text').innerText ?? element('context-text').textContent).trim();
  return {
    lan: rows.map(lan),
    turns: [...moves.querySelectorAll('li')].map(li => [...li.querySelectorAll('[data-ply]')].map(lan)),
    marks: rows.map(row => row.dataset.mark),
    context,
    lessonLearned: context.match(/^([A-Za-z]+) learned\.$/m)?.[1] ?? '',
    refusal: text('move-help'),
    thinking,
    result: thinking ? '' : status,
  };
}

const read = async (page, key) => (await page.evaluate(readUi))[key];
export const contextText = page => read(page, 'context');
/** Read each drawn rectangle of a word range in the wrapped context. */
export const contextWordsInView = (page, words) => page.evaluate(words => {
  const context = document.getElementById('context-text').getBoundingClientRect();
  return [...document.querySelectorAll('#context-text > span')].some(row => {
    const at = row.textContent.indexOf(words);
    if (at < 0) return false;
    const range = document.createRange();
    range.setStart(row.firstChild, at); range.setEnd(row.firstChild, at + words.length);
    return [...range.getClientRects()].every(r => r.left >= context.left && r.right <= context.right + 1 && r.top >= context.top && r.bottom <= context.bottom + 1);
  });
}, words);
export const lastMoveText = page => page.locator('#last-move').innerText();
export const refusalText = page => read(page, 'refusal');
export const computerThinks = page => read(page, 'thinking');
export const resultText = page => read(page, 'result');
export const lanMoves = page => read(page, 'lan');
export const lanTurns = page => read(page, 'turns');
export const moveMarks = page => read(page, 'marks');

export async function openMoves(page) {
  if (!await page.evaluate(() => document.getElementById('sheet-moves').open)) await page.locator('#moves-line').click();
}

/** The result opens Review; key moments stay in the Moves sheet. */
export async function openEndReview(page) {
  await page.locator('#over').waitFor({ state: 'visible' });
  await page.locator('#over-review').click();
  await page.locator('#sheet-moves').waitFor({ state: 'visible' });
}

export function moveRow(page, ply) {
  if (!Number.isInteger(ply) || ply < 1) throw new Error(`moveRow: ply ${ply} is not a whole number from 1`);
  return page.locator(`#moves [data-ply="${ply}"]`);
}

export async function waitForUi(page, test, arg = null, options = {}) {
  if (typeof test !== 'function') throw new Error('waitForUi: the test is not a function');
  const json = JSON.stringify(arg);
  if (json === undefined || !isDeepStrictEqual(JSON.parse(json), arg)) {
    throw new Error(`waitForUi: the argument does not go to the page as JSON with no change (a RegExp, NaN, Infinity, a Date or undefined): ${String(arg)}`);
  }
  try {
    return await page.waitForFunction(`(${test})((${readUi})(), ${json})`, undefined, options);
  } catch (error) {
    const now = await page.evaluate(readUi).then(ui => JSON.stringify(ui), e => e.message.split('\n')[0]);
    const detail = `\nwaitForUi: the test ${test} read #moves [data-ply], #status, #move-help and #moment; now: ${now}`;
    // Node prints the stack of an error that nobody catches, and Playwright sets the stack once: add the detail to both.
    const stack = typeof error.stack === 'string' ? error.stack : '';
    const frames = stack.indexOf('\n    at ');
    error.message += detail;
    error.stack = error.message + (frames < 0 ? '' : stack.slice(frames));
    throw error;
  }
}

/** Keep a copy now sits in the read-only view's footer. */
export const keepWorkshopCopy = page => page.locator('#workshop .ws-keep-copy');

/** Copy link is the main action when the device cannot share. */
export const workshopCopyLink = page => page.locator('#workshop .ws-sheet[open] :is(.ws-copy-link, .ws-send)').filter({ hasText: /^Copy link$/ }).filter({ visible: true });

/** Text controls on the Workshop card; the save label belongs to the editor. */
export async function workshopCardText(page) {
  const selectors = ['.ws-name-t', '.ws-worth', '.ws-bottom', '.ws-bar button', '.ws-footer button'];
  if (await page.locator('#workshop .ws-save-state').count()) selectors.push('.ws-save-state');
  return selectors;
}

/** The read line opens the Guide at the piece. */
export const openPieceRules = page => page.locator('#all-rules').click();

/** A coin read opens the same rules action at its power. */
export const openPowerRules = openPieceRules;

/** Lesson board IDs and taps follow the shelf's order. */
export const lessonPath = () => [
  [0, [27, 45]], [3, [27, 35, 43]], [2, [27, 28]],
  [4, [27, 35]], [1, [11, 12]], [5, [3, 43]],
];

/** King Down moves into the result when the board sequence ends. */
export const ceremonyWords = page => page.locator('#over-words:visible, .kd-words:visible').first();
/** Review tiles keep their ply when their display order changes. */
export const ceremonyTile = (page, ply) => page.locator(`.ceremony-tile[data-ply="${ply}"]`);
