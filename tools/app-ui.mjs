// The app's controls and readouts for the browser checks and the sample tool: the one place that knows
// today's ids (docs/specs/web-redesign/issues/00-check-helpers.md). A step that moves a control or a
// readout changes the helper body here, and the checks do not change. Each helper fails with the id
// that it looked for.
//
// The menu
//   menuItem(page, name)    The Locator of a menu item: 'New game', 'Guide', 'Workshop' or 'Settings'.
//                           Today: #new-game-btn, #rules-btn, #workshop-btn, #settings-btn. Call openMenu first.
//   openMenu(page, options) Opens the menu that holds the items. Today: nothing to open.
//   pressMenu(page, name, options)
//                           Opens what the item opens (the New game dialog, the Guide, the Workshop, Settings).
//                           options: { tap: true } taps on a touch page; the rest (such as timeout) go to each
//                           click or tap, so a press that something covers fails at the first control it meets.
//   openExtra(page)         Opens the place of Look, Reset view, This game and Account. Today: Settings.
//   boardHelp(page, act, options)
//                           Opens the place of the board switches (#threats, #coords, #labels, #queen), runs
//                           act(), and closes it. options go to pressMenu. Today: Settings, then Escape.
//   setPace(page, value)    Sets the animations to 'normal', 'fast' or 'off'. Today: Settings and #pace, then Escape.
// The board
//   focusBoard(page)        Moves the keyboard focus to the board, so that it shows its square cursor. Today:
//                           the focus goes to #new-game-btn, then Shift+Tab (a key, so the focus is :focus-visible).
//   leaveBoard(page)        Moves the keyboard focus off the board, so that the cursor goes. Today: to #new-game-btn.
// The turn
//   endTurn(page)           Hands the turn to the other side. Today: nothing to press; the computer replies at once.
// The readouts
//   contextText(page)       The words beside the board. Today: #status, #move-help and #moment, one line each,
//                           with no empty line. Match a line with a RegExp and the m flag.
//   refusalText(page)       The words that say why a tap did nothing (a refusal or a notice, spec §4.9 rank 4),
//                           or ''. Today: #move-help. It also holds the help of a selected piece, the review note
//                           and the link line, so read it when no piece is selected and no review is open.
//   computerThinks(page)    True while the computer searches for its move. Today: #status is "thinking…".
//   resultText(page)        The result words of a finished game, or ''. Today: #status when it is not "thinking…".
//   lanMoves(page)          The LAN of each ply, in order. Today: the #moves [data-ply] buttons with no ? or ?? mark.
//   lanTurns(page)          The LAN in groups, one group for each move number. Today: the #moves li rows.
//   moveMarks(page)         The key-moment mark of each ply: '?', '??' or ''. Today: the end of each #moves [data-ply] button.
//   openMoves(page)         Shows the move list. Today: nothing to open.
//   moveRow(page, ply)      The Locator of the row of ply `ply` (1 is the first ply); a click opens its review.
//                           Today: #moves [data-ply="<ply>"]. Call openMoves first.
//   waitForUi(page, test, arg, options)
//                           Waits until test(ui, arg) is true in the page, as page.waitForFunction does, and gives
//                           its handle. ui is { lan, turns, marks, context, refusal, thinking, result }: what
//                           lanMoves, lanTurns, moveMarks, contextText, refusalText, computerThinks and resultText
//                           read. `test` runs in the page, so it can use only its arguments and the page. `arg`
//                           goes to the page as JSON: a value that JSON changes (a RegExp, NaN, a Date) is refused.
import { isDeepStrictEqual } from 'node:util';

/** The menu items and the button of each one today. */
const MENU = { 'New game': '#new-game-btn', Guide: '#rules-btn', Workshop: '#workshop-btn', Settings: '#settings-btn' };

export function menuItem(page, name) {
  if (!Object.hasOwn(MENU, name)) throw new Error(`menuItem: no menu item "${name}"; the items are ${Object.keys(MENU).join(', ')}`);
  return page.locator(MENU[name]);
}

export async function openMenu(page, options = {}) {
  void [page, options]; // today the four items are always on the screen
}

export async function pressMenu(page, name, { tap = false, ...press } = {}) {
  await openMenu(page, { tap, ...press });
  const item = menuItem(page, name);
  await (tap ? item.tap(press) : item.click(press));
}

export const openExtra = page => pressMenu(page, 'Settings');

export async function boardHelp(page, act, options = {}) {
  await pressMenu(page, 'Settings', options);
  await act();
  await page.keyboard.press('Escape');
}

export async function setPace(page, value) {
  await pressMenu(page, 'Settings');
  await page.selectOption('#pace', value);
  await page.keyboard.press('Escape');
}

export async function focusBoard(page) {
  await leaveBoard(page);
  await page.keyboard.press('Shift+Tab');
}

export async function leaveBoard(page) {
  await openMenu(page);
  await menuItem(page, 'New game').focus();
}

export async function endTurn(page) {
  void page; // today the turn ends with the move
}

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
  const lan = row => row.textContent.trim().replace(/\?+$/, ''); // a key moment adds ? or ?? to its row
  const moves = element('moves'), rows = [...moves.querySelectorAll('[data-ply]')];
  const status = text('status'), thinking = status === 'thinking…';
  return {
    lan: rows.map(lan),
    turns: [...moves.querySelectorAll('li')].map(li => [...li.querySelectorAll('[data-ply]')].map(lan)),
    marks: rows.map(row => row.textContent.trim().match(/\?*$/)[0]),
    context: [status, text('move-help'), text('moment')].filter(Boolean).join('\n'),
    refusal: text('move-help'),
    thinking,
    result: thinking ? '' : status,
  };
}

const read = async (page, key) => (await page.evaluate(readUi))[key];
export const contextText = page => read(page, 'context');
export const refusalText = page => read(page, 'refusal');
export const computerThinks = page => read(page, 'thinking');
export const resultText = page => read(page, 'result');
export const lanMoves = page => read(page, 'lan');
export const lanTurns = page => read(page, 'turns');
export const moveMarks = page => read(page, 'marks');

export async function openMoves(page) {
  void page; // today the list is always on the screen
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
