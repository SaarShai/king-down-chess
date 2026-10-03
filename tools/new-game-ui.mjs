/**
 * Drives the New game dialog (index.html #new-game, src/new-game.ts) the way a player does. Every
 * browser check that starts a game uses it, so a change to the dialog is one edit here.
 *
 *   await startGame(page, { mode: 'two', army: 'classic' });
 *   await startGame(page, { mode: 'powers', kings: ['Mud:March', 'Frost:none'] });
 *
 * mode: 'computer' | 'powers' | 'two' · level: 'beginner' | 'casual' | 'club' | 'strong' ·
 * side: 'white' | 'black' (against the computer) · powers: the Two players box ·
 * kings: [White, Black] as 'King:Power' or 'King:none' · army: 'random' (the default), 'daily',
 * 'classic', 'custom', an example army's code or 'ogre'. Options left out keep the dialog's choice.
 */
export async function setUpGame(page, { mode, level, side, powers, kings, army = 'random' } = {}) {
  if (!await page.evaluate(() => document.getElementById('new-game').open)) await page.click('#new-game-btn');
  if (mode) await page.click(`#new-game label:has(#mode-${mode})`);
  if (level) await page.click(`#new-game label:has(#level-${level})`);
  if (powers !== undefined) await page.setChecked('#two-powers', powers);
  for (const [c, choice] of (kings ?? []).entries()) {
    if (!choice) continue;
    const [king, power] = choice.split(':');
    await page.click(`#pick-${c} .emblem[data-king="${king}"]`);
    await page.click(`#pick-${c} .power-choice button[data-power="${power === 'none' ? '' : power}"]`);
  }
  if (side || army) {
    if (!await page.evaluate(() => document.getElementById('more-options').open)) await page.click('#more-options summary');
    if (side) await page.click(`#new-game label:has(#side-${side})`);
    await page.selectOption('#army', army);
  }
}

/** Sets up the game as `setUpGame` does, then presses Start game. */
export async function startGame(page, options = {}) {
  await setUpGame(page, options);
  await page.click('#start-game');
}
