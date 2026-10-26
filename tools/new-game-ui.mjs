import { pressMenu, startNewGame } from './app-ui.mjs';

/**
 * Drives the New game dialog (index.html #new-game, src/new-game.ts) the way a player does. Every
 * browser check that starts a game uses it, so a change to the dialog is one edit here.
 *
 *   await startGame(page, { mode: 'two', army: 'classic' });
 *   await startGame(page, { mode: 'powers', kings: ['Mud:March', 'Frost:none'] });
 *
 * mode: 'computer' | 'powers' | 'two' · level: 'beginner' | 'casual' | 'club' ·
 * side: 'white' | 'black' (against the computer) · powers: powers in a two-player test fixture ·
 * kings: [White, Black] as 'King:Power' or 'King:none' · army: 'random' (the default), 'daily',
 * 'classic', 'custom', an example army's code or 'ogre' · design: a Workshop design's name, or 'No design'.
 * Options left out keep the dialog's choice.
 */
export async function setUpGame(page, { mode, level, side, powers, kings, design, army = 'random' } = {}) {
  if (!await page.evaluate(() => document.getElementById('new-game').open)) await pressMenu(page, 'New game');
  if (mode) await page.click(`#new-game label:has(#mode-${mode === 'two' ? powers ? 'powers' : 'computer' : mode})`);
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

/** Sets up the sheet, then presses Start. The warn line says when this ends the current game. */
export async function startGame(page, options = {}) {
  await setUpGame(page, options.mode === 'two' ? { ...options, side: 'white' } : options);
  await startNewGame(page);
  // Two local players are a browser fixture. The New game sheet offers online friends.
  if (options.mode === 'two') {
    await page.evaluate(() => {
      const save = JSON.parse(localStorage.getItem('kingdown.save'));
      save.white = save.black = 'human';
      localStorage.setItem('kingdown.save', JSON.stringify(save));
    });
    const url = new URL(page.url());
    for (const key of ['army', 'fen', 'moves']) url.searchParams.delete(key);
    url.searchParams.set('title', '0');
    await page.goto(url.href);
    await page.waitForFunction(() => !!window.view?.ready);
    await page.evaluate(() => window.view.ready());
  }
}
