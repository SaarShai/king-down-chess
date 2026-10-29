import { pressMenu, startNewGame } from './app-ui.mjs';

/**
 * Drives the New game dialog (index.html #new-game, src/new-game.ts) the way a player does. Every
 * browser check that starts a game uses it, so a change to the dialog is one edit here.
 *
 *   await startGame(page, { mode: 'two', army: 'classic' }); // two people: a check fixture, see startGame
 *   await startGame(page, { mode: 'powers', kings: ['Mud:March', 'Frost:none'] });
 *
 * mode: 'computer' | 'powers' (and 'two' in startGame only) · level: 'beginner' | 'casual' | 'club' ·
 * side: 'white' | 'black' (against the computer) · powers: Kings' powers for startGame's `mode: 'two'` ·
 * kings: [White, Black] as 'King:Power' or 'King:none' · army: 'random' (the default) or 'classic'
 * (the other armies and "Bring a design" are parked: docs/PARKED.md). Options left out keep the dialog's choice.
 */
export async function setUpGame(page, { mode, level, side, kings, army = 'random' } = {}) {
  if (!await page.evaluate(() => document.getElementById('new-game').open)) await pressMenu(page, 'New game');
  if (mode) await page.click(`#new-game label:has(#mode-${mode})`);
  if (level) await page.locator('#level-slider').fill(String(['beginner','casual','club'].indexOf(level)));
  for (const [c, choice] of (kings ?? []).entries()) {
    if (!choice) continue;
    const [king, power] = choice.split(':');
    await page.click(`#pick-${c} .emblem[data-king="${king}"]`);
    await page.click(`#pick-${c} .power-choice button[data-power="${power === 'none' ? '' : power}"]`);
  }
  if (side || army) {
    if (!await page.evaluate(() => document.getElementById('more-options').open)) await page.click('#more-options summary');
    if (side) await page.click(`#new-game label:has(#side-${side})`);
    if (army) await page.click(`#new-game label:has(input[name="army"][value="${army}"])`);
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
