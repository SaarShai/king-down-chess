// W2 Menu pages use one native dialog and the saved board switches.
import assert from 'node:assert/strict';
import { openAccount, openExtra, openMenu, pressMenu } from './app-ui.mjs';
import { assertNoErrors, env, launch, noSidewaysScroll, shot, trapErrors } from './lib/checks.mjs';
const browser = await launch();
try {
  for (const [width, height] of [[390, 844], [844, 390], [1440, 900]]) {
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
    await context.addInitScript(() => { sessionStorage.setItem('kingdown.title-seen', '1'); localStorage.setItem('kingdown.save', JSON.stringify({ back: 'RNBQKBNR', fen: '', moves: [], white: 'human', black: 'human', pace: 'off', sound: false })); });
    const page = await context.newPage(); trapErrors(page);
    let confirms = 0; page.on('dialog', d => { confirms++; void d.dismiss(); });
    await page.goto(env('PLAYABLE_URL')); await page.waitForFunction(() => window.view?.ready); await page.evaluate(() => window.view.ready());
    await openMenu(page); await page.mouse.click(0, 0);
    assert.equal(await page.locator('#menu-sheet').isVisible(), false, 'a tap outside closes Menu');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'menu-btn');
    await openMenu(page);
    assert.equal(await page.locator('#pace-note').isVisible(), false, 'Motion Off hides the skip note');
    if (width === 844) {
      await page.locator('#resign').scrollIntoViewIfNeeded();
      const close = await page.locator('#menu-close').boundingBox();
      assert.ok(close.y >= 0 && close.y + close.height <= height, 'Close stays in view after the body scrolls');
      assert.equal(await page.locator('#menu-sheet .sheet-body').evaluate(el => el.scrollTop > 0), true, 'the Menu body scrolls to Resign');
    }
    for (const words of ['New game', 'Guide', 'Board help', 'Feel', 'Extra', 'Resign']) assert.ok((await page.locator('[data-menu-page="menu"]').textContent()).includes(words), words);
    for (const route of ['new', 'help', 'extra', 'resign']) {
      await page.locator(`[data-menu-page="menu"] [data-go="${route}"]`).click();
      assert.equal(await page.locator(`[data-menu-page="${route}"]`).isVisible(), true);
      await page.locator('#menu-back').click(); assert.equal(await page.locator('[data-menu-page="menu"]').isVisible(), true);
      await page.locator(`[data-menu-page="menu"] [data-go="${route}"]`).click();
      await page.keyboard.press('Escape'); assert.equal(await page.locator('[data-menu-page="menu"]').isVisible(), true);
    }
    await page.locator('[data-go="help"]').click(); await page.uncheck('#coords');
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('kingdown.save')).coords), false);
    assert.equal(await page.evaluate(() => window.view.coords), false);
    await page.locator('#menu-close').click(); assert.equal(await page.evaluate(() => document.activeElement.id), 'menu-btn');
    await openMenu(page); await page.check('#sound');
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('kingdown.save')).sound), true, 'Sound on saves');
    await page.uncheck('#sound');
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('kingdown.save')).sound), false);
    await page.selectOption('#pace', 'fast');
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('kingdown.save')).pace), 'fast', 'Motion changes its saved value');
    assert.equal(await page.evaluate(() => window.view.pace), 'fast', 'the board uses Fast motion');
    await page.selectOption('#pace', 'off');
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('kingdown.save')).pace), 'off');
    assert.equal(await page.evaluate(() => window.view.pace), 'off');
    await openExtra(page); assert.equal(await page.locator('#look').inputValue(), 'painted');
    assert.match(await page.locator('.coming-row').innerText(), /Card mode/);
    await shot(page, `extra-${width}`);
    await openAccount(page); assert.equal(await page.locator('#account').isVisible(), true);
    for (const item of ['Guide', 'New game', 'Workshop']) {
      await pressMenu(page, item);
      assert.equal(await page.locator('#menu-sheet').isVisible(), false, `${item}: Menu closes first`);
      await page.locator({ Guide: '#rules', 'New game': '#new-game', Workshop: '#workshop' }[item]).waitFor({ state: 'visible' });
      await page.keyboard.press('Escape');
    }
    await openMenu(page); await page.locator('[data-go="resign"]').click();
    assert.match(await page.locator('#resign-detail').innerText(), /Black wins/);
    assert.equal(confirms, 0, 'Resign asks in the sheet');
    await shot(page, `resign-${width}`); await noSidewaysScroll(page);
    await page.locator('#resign-confirm').click(); assert.equal(await page.locator('#menu-sheet').isVisible(), false);
    assert.equal(await page.locator('#over').isVisible(), true);
    console.log(`ok menu-extra ${width}×${height}: rows, Back, Esc, Close, focus, settings, Extra, dialogs, Resign`);
    await context.close();
  }
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => { sessionStorage.setItem('kingdown.title-seen', '1'); localStorage.setItem('kingdown.save', JSON.stringify({ back: 'RNBQKBNR', fen: '', moves: [], white: 'human', black: 'human', sound: false })); });
  const page = await context.newPage(); trapErrors(page);
  await page.goto(env('PLAYABLE_URL')); await page.waitForFunction(() => window.view?.ready); await page.evaluate(() => window.view.ready());
  await openExtra(page);
  await Promise.all([page.waitForURL(u => u.searchParams.get('look') === 'clay'), page.selectOption('#look', 'clay')]);
  await page.waitForFunction(() => window.view?.ready); await page.evaluate(() => window.view.ready());
  assert.equal(await page.evaluate(() => localStorage.getItem('kingdown.look')), 'clay');
  const home = await page.evaluate(() => window.view.camera.zoom);
  const board = await page.locator('#board').boundingBox();
  await page.mouse.move(board.x + board.width / 2, board.y + board.height / 2); await page.mouse.wheel(0, -300);
  await page.waitForFunction(z => window.view.camera.zoom > z, home);
  await openExtra(page); assert.equal(await page.locator('#reset-view').isVisible(), true);
  await page.click('#reset-view'); await page.waitForFunction(() => window.view.tweens.list.length === 0);
  assert.ok(Math.abs(await page.evaluate(() => window.view.camera.zoom) - home) < 0.00001, 'Reset view restores the view after zoom');
  console.log('ok menu-extra: Look switches to Clay; Reset view restores zoom');
  await context.close();
  assertNoErrors();
} finally { await browser.close(); }
