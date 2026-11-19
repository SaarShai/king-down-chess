import assert from 'node:assert/strict';
import { minTarget, noSidewaysScroll, trapErrors, assertNoErrors } from './checks.mjs';

export const newGame = page => page.locator('.home-start').getByRole('button', { name: /^(Play|New game)$/ });
export const setupTable = page => page.locator('dialog.new-game-panel[open]');

export async function checkDaylightSetup(browser, origin) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
  const errors = trapErrors(page);
  try {
    await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    await page.goto(origin + '/next.html');
    await newGame(page).click();
    const setup = setupTable(page);
    await setup.getByRole('button', { name: 'Start game', exact: true }).waitFor();
    assert.equal(await setup.locator('input[type="checkbox"]').count(), 0);
    const level = setup.getByRole('radiogroup', { name: 'Computer level' });
    await level.getByRole('radio', { checked: true }).press('End');
    assert.equal(await level.getByRole('radio', { name: 'Fierce' }).getAttribute('aria-checked'), 'true');
    await level.getByRole('radio', { checked: true }).press('Home');
    assert.equal(await level.getByRole('radio', { name: 'Friendly' }).getAttribute('aria-checked'), 'true');
    await setup.getByRole('button', { name: 'Powers', exact: true }).click();
    const shadow = setup.locator('[data-focus="opponent"] .setup-figure img');
    const unknown = await shadow.getAttribute('src');
    await setup.locator('[data-king="Frost"]').click();
    assert.equal(await shadow.getAttribute('src'), unknown);
    await page.keyboard.press('Escape');
    assert.equal(await setup.getByRole('switch', { name: 'Powers', exact: true }).getAttribute('aria-checked'), 'true');
    await setup.getByRole('button', { name: 'Cards', exact: true }).click();
    assert.match(await setup.locator('.king-change').innerText(), /Spirit · Mercy replaces Frost · Freeze/);
    assert.equal(await setup.locator('.panel-card').count(), 21);
    const freeze = setup.getByRole('button', { name: 'Freeze', exact: true });
    assert.equal(await freeze.getAttribute('aria-pressed'), 'true');
    await freeze.click();
    assert.equal(await freeze.getAttribute('aria-pressed'), 'false');
    await freeze.press('Space');
    assert.equal(await freeze.getAttribute('aria-pressed'), 'true');
    await page.keyboard.press('Escape');
    await setup.getByRole('button', { name: 'Opponent', exact: true }).click();
    await setup.getByRole('button', { name: 'Earth', exact: true }).click();
    assert.match(await shadow.getAttribute('src'), /mud-b\.webp$/);
    await setup.getByRole('button', { name: 'Random king', exact: true }).click();
    assert.equal(await shadow.getAttribute('src'), unknown);
    await page.keyboard.press('Escape');
    await setup.getByRole('button', { name: 'More options', exact: true }).click();
    await setup.getByRole('radio', { name: 'Piece pool' }).click();
    const row = setup.locator('.pool-row').first(), piece = row.getByRole('checkbox');
    assert.equal(await piece.isChecked(), true);
    await row.click();
    assert.equal(await piece.isChecked(), false);
    await piece.press('Space');
    assert.equal(await piece.isChecked(), true);
    const side = setup.getByRole('radiogroup', { name: 'Your side' });
    await side.getByRole('radio', { name: 'Dark' }).click();
    assert.equal(await side.getByRole('radio', { name: 'Dark' }).getAttribute('aria-checked'), 'true');
    await minTarget(page, '.setup-sheet button:not([hidden])');
    await noSidewaysScroll(page);
    await page.goBack();
    await setup.waitFor({ state: 'detached' });
    await newGame(page).waitFor();
    assertNoErrors(errors);
  } finally { await page.close(); }
}

export async function checkDaylightSave(browser, origin) {
  const page = await browser.newPage({ viewport: { width: 844, height: 390 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
  const save = JSON.stringify({ back: 'RNBQKBNR', fen: '', moves: ['e2-e4', 'e7-e5'], white: 'human', black: 'ai', rules: { kings: [null, null], hands: [[], []] }, pace: 'off' });
  try {
    await page.addInitScript(save => { if (!localStorage.getItem('kingdown.save')) localStorage.setItem('kingdown.save', save); }, save);
    await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    await page.goto(origin + '/next.html');
    await page.getByRole('button', { name: 'Continue', exact: true }).waitFor();
    await newGame(page).click();
    const setup = setupTable(page);
    await setup.getByRole('button', { name: 'Start game', exact: true }).click();
    await setup.getByRole('heading', { name: 'Start a new game?' }).waitFor();
    assert.equal(await page.evaluate(() => localStorage.getItem('kingdown.save')), save);
    await setup.getByRole('button', { name: 'Keep my game' }).click();
    await setup.getByRole('button', { name: 'Start game', exact: true }).click();
    await setup.getByRole('heading', { name: 'Start a new game?' }).waitFor();
    await page.goBack();
    await page.getByRole('button', { name: 'Continue', exact: true }).waitFor();
    assert.equal(await page.evaluate(() => localStorage.getItem('kingdown.save')), save);
    await newGame(page).click();
    await setup.getByRole('button', { name: 'Start game', exact: true }).click();
    await setup.getByRole('button', { name: 'Start a new game', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('.play-game') && JSON.parse(localStorage.getItem('kingdown.save'))?.moves.length === 0);
    assert.equal(await page.locator('.shell-nav').isVisible(), false);
  } finally { await page.close(); }
}
