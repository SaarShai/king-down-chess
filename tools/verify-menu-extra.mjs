// W2 Menu pages use one native dialog and the saved board switches.
import assert from 'node:assert/strict';
import { endTurn, lanMoves, openAccount, openExtra, openMenu, openTricks, pressMenu } from './app-ui.mjs';
import { assertNoErrors, env, launch, noSidewaysScroll, shot, trapErrors } from './lib/checks.mjs';
const browser = await launch();
try {
  for (const undoFirst of [false, true]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, reducedMotion: 'reduce' });
    await context.addInitScript(() => {
      sessionStorage.setItem('kingdown.title-seen', '1');
      if (sessionStorage.getItem('w10.seeded')) return;
      sessionStorage.setItem('w10.seeded', '1');
      localStorage.setItem('kingdown.save', JSON.stringify({ back: '', fen: '7k/8/8/3p4/3Sp3/8/8/K7 w - - 0 1', moves: [], white: 'human', black: 'human', pace: 'off', sound: false }));
    });
    const page = await context.newPage(); trapErrors(page);
    await page.goto(env('PLAYABLE_URL')); await page.waitForFunction(() => window.view?.ready); await page.evaluate(() => window.view.ready());
    await openExtra(page);
    assert.equal(await page.locator('[data-go="tricks"]').isVisible(), false, 'Tricks waits for the first find');
    await page.locator('#menu-close').click();
    for (const sq of [27, 35, 28]) {
      const point = await page.evaluate(s => window.view.screenOf(s), sq);
      await page.touchscreen.tap(point.x, point.y);
    }
    await page.waitForFunction(() => document.getElementById('end-turn').getAttribute('aria-disabled') === 'false');
    assert.deepEqual(await lanMoves(page), ['Sd4xd5xe4']);
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('kingdown.tricks'))?.found ?? []), [], 'staged moves give no seal');
    if (undoFirst) {
      await page.click('#undo');
      assert.deepEqual(await lanMoves(page), []);
      assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('kingdown.tricks'))?.found ?? []), [], 'Undo before the press gives no seal');
      await openExtra(page);
      assert.equal(await page.locator('[data-go="tricks"]').isVisible(), false);
      console.log('ok menu-extra: Undo before the press gives no seal');
    } else {
      await endTurn(page);
      assert.match(await page.locator('#announce').textContent(), /New seal: Bite chain/, 'the new seal is spoken');
      assert.match(await page.locator('#context-text').textContent(), /New seal: Bite chain/, 'the new seal has words');
      assert.equal(await page.locator('#menu-seal-dot').isVisible(), true, 'the press gives the gold dot');
      assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('kingdown.tricks'))), { found: ['chain'], unseen: true });
      await page.reload(); await page.waitForFunction(() => window.view?.ready); await page.evaluate(() => window.view.ready());
      assert.equal(await page.locator('#menu-seal-dot').isVisible(), true, 'a reload keeps the unseen mark');
      await openMenu(page);
      assert.equal(await page.locator('#extra-seal-dot').isVisible(), true, 'Menu keeps the new seal path');
      assert.equal(await page.locator('#extra-row').getAttribute('aria-label'), 'Extra, new seal');
      await openExtra(page);
      assert.equal(await page.locator('#tricks-seal-dot').isVisible(), true, 'Extra points to Tricks');
      assert.equal(await page.locator('#tricks-row').getAttribute('aria-label'), 'Tricks, new seal');
      await openTricks(page);
      assert.equal(await page.locator('#menu-seal-dot').isVisible(), false, 'Menu takes the dot');
      assert.equal(await page.locator('[data-menu-page="tricks"]').isVisible(), true);
      assert.equal(await page.locator('#tricks-intro').textContent(), '1 of 6 found. Each trick you find gets a seal.');
      assert.equal(await page.locator('#tricks-list .found-row').count(), 1);
      assert.equal(await page.locator('#tricks-list .riddle').count(), 5);
      assert.match(await page.locator('#tricks-list .found-row').innerText(), /Bite chain/);
      await page.locator('#menu-back').click();
      assert.equal(await page.locator('[data-menu-page="extra"]').isVisible(), true);
      await page.locator('#menu-close').click(); await page.reload(); await page.waitForFunction(() => window.view?.ready); await page.evaluate(() => window.view.ready());
      assert.equal(await page.locator('#menu-seal-dot').isVisible(), false, 'a reload keeps the seen mark');
      await openTricks(page);
      assert.equal(await page.locator('#tricks-list .found-row').count(), 1, 'a reload keeps the seal');
      await shot(page, 'tricks-390'); await noSidewaysScroll(page);
      console.log('ok menu-extra: press, seal, gold dot, Tricks, Back and reload');
    }
    await context.close();
  }
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
    const menuClose = await page.locator('#menu-close').boundingBox();
    for (const route of ['new', 'help', 'extra', 'resign']) {
      await page.locator(`[data-menu-page="menu"] [data-go="${route}"]`).click();
      assert.equal(await page.locator(`[data-menu-page="${route}"]`).isVisible(), true);
      assert.equal((await page.locator('#menu-close').boundingBox()).y, menuClose.y, 'Menu Close stays in place across pages');
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
