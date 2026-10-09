// The app's controls and readouts for the browser checks and the sample tool: the one place that knows
// today's ids (docs/specs/web-redesign/issues/00-check-helpers.md). A step that moves a control or a
// readout changes the helper body here, and the checks do not change. Each helper fails with the id
// that it looked for.
//
// The menu
//   menuItem(page, name)    The Locator of a menu item: 'New game', 'Guide', 'Workshop' or 'Settings'.
//                           Today: #new-game-btn, #rules-btn, #workshop-btn, #settings-btn. Call openMenu first.
//   openMenu(page)          Opens the menu that holds the items. Today: nothing to open.
//   pressMenu(page, name)   Opens what the item opens (the New game dialog, the Guide, the Workshop, Settings).
//   openExtra(page)         Opens the place of Look, Reset view, This game and Account. Today: Settings.
//   setPace(page, value)    Sets the animations to 'normal', 'fast' or 'off'. Today: Settings and #pace, then Escape.
// The turn
//   endTurn(page)           Hands the turn to the other side. Today: nothing to press; the computer replies at once.
// The readouts
//   contextText(page)       The words beside the board. Today: #status, #move-help and #moment, one line each,
//                           with no empty line. Match a line with a RegExp and the m flag.
//   lanMoves(page)          The LAN of each ply, in order. Today: the #moves [data-ply] buttons with no ? or ?? mark.
//   lanTurns(page)          The LAN in groups, one group for each move number. Today: the #moves li rows.
//   moveMarks(page)         The key-moment mark of each ply: '?', '??' or ''. Today: the end of each #moves [data-ply] button.
//   openMoves(page)         Shows the move list. Today: nothing to open.
//   moveRow(page, ply)      The Locator of the row of ply `ply` (1 is the first ply); a click opens its review.
//                           Today: #moves [data-ply="<ply>"]. Call openMoves first.
//   waitForUi(page, test, arg, options)
//                           Waits until test(ui, arg) is true in the page, as page.waitForFunction does, and gives
//                           its handle. ui is { lan, turns, marks, context }: what lanMoves, lanTurns, moveMarks and
//                           contextText read.
//                           `test` runs in the page, so it can use only its arguments and the page.

/** The menu items and the button of each one today. */
const MENU = { 'New game': '#new-game-btn', Guide: '#rules-btn', Workshop: '#workshop-btn', Settings: '#settings-btn' };

export function menuItem(page, name) {
  if (!Object.hasOwn(MENU, name)) throw new Error(`menuItem: no menu item "${name}"; the items are ${Object.keys(MENU).join(', ')}`);
  return page.locator(MENU[name]);
}

export async function openMenu(page) {
  void page; // today the four items are always on the screen
}

export async function pressMenu(page, name) {
  await openMenu(page);
  await menuItem(page, name).click();
}

export const openExtra = page => pressMenu(page, 'Settings');

export async function setPace(page, value) {
  await pressMenu(page, 'Settings');
  await page.selectOption('#pace', value);
  await page.keyboard.press('Escape');
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
  const lan = row => row.textContent.trim().replace(/\?+$/, ''); // a key moment adds ? or ?? to its row
  const moves = element('moves'), rows = [...moves.querySelectorAll('[data-ply]')];
  return {
    lan: rows.map(lan),
    turns: [...moves.querySelectorAll('li')].map(li => [...li.querySelectorAll('[data-ply]')].map(lan)),
    marks: rows.map(row => row.textContent.trim().match(/\?*$/)[0]),
    context: ['status', 'move-help', 'moment'].map(id => element(id).textContent.trim()).filter(Boolean).join('\n'),
  };
}

export const contextText = async page => (await page.evaluate(readUi)).context;
export const lanMoves = async page => (await page.evaluate(readUi)).lan;
export const lanTurns = async page => (await page.evaluate(readUi)).turns;
export const moveMarks = async page => (await page.evaluate(readUi)).marks;

export async function openMoves(page) {
  void page; // today the list is always on the screen
}

export function moveRow(page, ply) {
  if (!Number.isInteger(ply) || ply < 1) throw new Error(`moveRow: ply ${ply} is not a whole number from 1`);
  return page.locator(`#moves [data-ply="${ply}"]`);
}

export async function waitForUi(page, test, arg = null, options = {}) {
  if (typeof test !== 'function') throw new Error('waitForUi: the test is not a function');
  try {
    return await page.waitForFunction(`(${test})((${readUi})(), ${JSON.stringify(arg)})`, undefined, options);
  } catch (error) {
    const now = await page.evaluate(readUi).then(ui => JSON.stringify(ui), e => e.message.split('\n')[0]);
    error.message += `\nwaitForUi: the test ${test} read #moves [data-ply], #status, #move-help and #moment; now: ${now}`;
    throw error;
  }
}
