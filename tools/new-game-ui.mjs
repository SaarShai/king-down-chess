import { pressMenu, startNewGame } from './app-ui.mjs';

/**
 * Drives the New game dialog (index.html #new-game, src/new-game.ts) the way a player does. Every
 * browser check that starts a game uses it, so a change to the dialog is one edit here.
 *
 *   await startGame(page, { mode: 'two', army: 'classic' }); // two people: a check fixture, see startGame
 *   await startGame(page, { mode: 'powers', kings: ['Mud:March', 'Frost:none'] });
 *
 * mode: 'computer' | 'powers' (and 'two' in startGame only) · level: 'beginner' | 'casual' | 'club' ·
 * side: 'white' | 'black' (against the computer) · powers: the Two players box ·
 * kings: [White, Black] as 'King:Power' or 'King:none' · army: 'random' (the default), 'daily',
 * 'classic', 'custom', an example army's code or 'ogre' · design: a Workshop design's name, or 'No design'.
 * Options left out keep the dialog's choice.
 */
export async function setUpGame(page, { mode, level, side, powers, kings, design, army = 'random' } = {}) {
  if (!await page.evaluate(() => document.getElementById('new-game').open)) await pressMenu(page, 'New game');
  if (mode) await page.click(`#new-game label:has(#mode-${mode})`);
  if (level) await page.locator('#level-slider').fill(String(['beginner','casual','club'].indexOf(level)));
  if (design) await page.selectOption('#design', { label: design });
  for (const [c, choice] of (kings ?? []).entries()) {
    if (!choice) continue;
    const [king, power] = choice.split(':');
    await page.click(`#pick-${c} .emblem[data-king="${king}"]`);
    await page.click(`#pick-${c} .power-choice button[data-power="${power === 'none' ? '' : power}"]`);
  }
  if (side || army) {
    if (!await page.evaluate(() => document.getElementById('more-options').open)) await page.click('#more-options summary');
    if (side) await page.click(`#new-game label:has(#side-${side})`);
    if (['random', 'daily', 'classic'].includes(army)) await page.click(`#new-game label:has(input[name="army"][value="${army}"])`);
    else if (army) {
      if (!await page.evaluate(() => document.getElementById('other-armies').open)) await page.click('#other-armies summary');
      await page.selectOption('#army', army);
    }
  }
}

/**
 * Sets up the sheet, then presses Start. The warn line says when this ends the current game.
 * Pass-and-play is parked (docs/PARKED.md), so New game has no two-person choice. `mode: 'two'` starts the game
 * against the computer (`powers: true`: with Kings' powers), then seats two people with the hidden `?players=`
 * check fixture, and gives the page its address back.
 */
export async function startGame(page, options = {}) {
  const two = options.mode === 'two';
  const { powers, ...rest } = options;
  await setUpGame(page, two ? { ...rest, mode: powers ? 'powers' : 'computer', side: 'white' } : rest);
  await startNewGame(page);
  if (two) await seatTwoPeople(page);
}

/** Seats both sides of the saved game as people (`?players=human,human&title=0`), then restores the address. */
export async function seatTwoPeople(page) {
  const address = page.url(), url = new URL(address);
  url.searchParams.set('players', 'human,human'); url.searchParams.set('title', '0');
  await page.goto(url.href);
  await page.waitForFunction(() => window.view?.ready);
  await page.evaluate(() => window.view.ready());
  await page.evaluate(href => history.replaceState(null, '', href), address);
}
