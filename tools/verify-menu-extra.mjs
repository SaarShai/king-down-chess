// W2 Menu pages use one native dialog and the saved board switches. Parked (docs/PARKED.md): the Extra page, This game,
// Tricks and seals, Today's army, the Workshop row and the Card mode row; Account is a main Menu row.
import assert from 'node:assert/strict';
import { endTurn, lanMoves, openAccount, openMenu, pressMenu } from './app-ui.mjs';
import { assertNoErrors, env, launch, noSidewaysScroll, shot, trapErrors } from './lib/checks.mjs';
async function assertPhoneSheet(page, height) {
  const bounds = await page.locator('#menu-sheet').evaluate(sheet => {
    const body = sheet.querySelector('.sheet-body'), section = body.querySelector(':scope > section:not([hidden])');
    const box = sheet.getBoundingClientRect(), style = getComputedStyle(body);
    return { bottom: box.bottom, height: box.height, content: section.offsetHeight,
      head: sheet.querySelector('.sheet-head').offsetHeight,
      padding: parseFloat(style.paddingTop) + parseFloat(style.paddingBottom),
      overflow: body.scrollHeight > body.clientHeight + 1,
      below: body.scrollHeight - body.clientHeight - body.scrollTop > 1,
      shade: getComputedStyle(sheet, '::after').display,
      shadeContent: getComputedStyle(sheet, '::after').content,
      page: section.dataset.menuPage, sizing: sheet.computedStyleMap().get('height').toString(),
    };
  });
  assert.equal(bounds.sizing, 'fit-content', 'phone sheets use content height, not auto or a fixed height');
  assert.ok(Math.abs(bounds.bottom - height) <= 1, 'each phone page meets the screen bottom');
  assert.ok(bounds.height <= bounds.head + bounds.content + bounds.padding + 24, 'each phone sheet fits its page content');
  // The shade marks rows below the fold; scrolled to the end, none shows (menu.ts updateShade).
  if (bounds.below) assert.equal(bounds.shade, 'block', 'the overflowing body has a bottom shade');
  if (bounds.below) assert.equal(bounds.shadeContent, '""', 'the bottom shade has generated content and paints');
}
const browser = await launch();
try {
  {
    // Tricks and seals are parked: a found trick gives no seal and no dot, and old seal data loads with no error.
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, reducedMotion: 'reduce' });
    await context.addInitScript(() => {
      sessionStorage.setItem('kingdown.title-seen', '1');
      if (sessionStorage.getItem('w10.seeded')) return;
      sessionStorage.setItem('w10.seeded', '1');
      localStorage.setItem('kingdown.tricks', JSON.stringify({ found: ['wall'], unseen: true }));
      localStorage.setItem('kingdown.save', JSON.stringify({ back: '', fen: '7k/8/8/3p4/3Sp3/8/8/K7 w - - 0 1', moves: [], white: 'human', black: 'human', pace: 'off', sound: false }));
    });
    const page = await context.newPage(); trapErrors(page);
    await page.goto(env('PLAYABLE_URL')); await page.waitForFunction(() => window.view?.ready); await page.evaluate(() => window.view.ready());
    assert.equal(await page.locator('#menu-seal-dot, .seal-dot').count(), 0, 'no seal dot, also with old unseen seal data');
    for (const sq of [27, 35, 28]) {
      const point = await page.evaluate(s => window.view.screenOf(s), sq);
      await page.touchscreen.tap(point.x, point.y);
    }
    await page.waitForFunction(() => document.getElementById('end-turn').getAttribute('aria-disabled') === 'false');
    assert.deepEqual(await lanMoves(page), ['Sd4xd5xe4']);
    await endTurn(page);
    assert.doesNotMatch(await page.locator('#announce').textContent(), /seal/i, 'the press speaks no seal');
    assert.doesNotMatch(await page.locator('#context-text').textContent(), /seal/i, 'the press shows no seal');
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('kingdown.tricks'))), { found: ['wall'], unseen: true }, 'the press writes no seal; old data stays');
    await openMenu(page);
    assert.equal(await page.locator('[data-go="tricks"], #tricks-row, [data-menu-page="tricks"]').count(), 0, 'no Tricks row or page');
    console.log('ok menu-extra: Tricks parked: a found trick gives no seal and no dot; old seal data stays');
    await context.close();
  }
  for (const [width, height] of [[320, 568], [390, 844], [844, 390], [1440, 900]]) {
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
    await context.addInitScript(() => { sessionStorage.setItem('kingdown.title-seen', '1'); localStorage.setItem('kingdown.tricks', JSON.stringify({ found: ['chain'], unseen: false })); localStorage.setItem('kingdown.save', JSON.stringify({ back: 'RNBQKBNR', fen: '', moves: [], white: 'human', black: 'human', pace: 'off', sound: false })); });
    const page = await context.newPage(); trapErrors(page);
    let confirms = 0; page.on('dialog', d => { confirms++; void d.dismiss(); });
    await page.goto(env('PLAYABLE_URL')); await page.waitForFunction(() => window.view?.ready); await page.evaluate(() => window.view.ready());
    await openMenu(page); await page.mouse.click(0, 0);
    assert.equal(await page.locator('#menu-sheet').isVisible(), false, 'a tap outside closes Menu');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'menu-btn');
    await openMenu(page);
    assert.equal(await page.locator('#pace-note').isVisible(), false, 'Motion Off hides the skip note');
    if (width === 844) {
      for (let tab = 0; tab < 20 && await page.evaluate(() => document.activeElement.id !== 'pace'); tab++) await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'pace', 'Tab reaches Motion');
      assert.ok(await page.locator('#pace').evaluate(control => {
        const body = control.closest('.sheet-body'), box = body.getBoundingClientRect(), r = control.getBoundingClientRect();
        const padding = parseFloat(getComputedStyle(body).paddingBottom);
        return r.top >= box.top && r.bottom <= box.bottom - padding;
      }), 'focused Motion fits fully above the bottom shade and cut');
      await page.locator('#resign').scrollIntoViewIfNeeded();
      const close = await page.locator('#menu-close').boundingBox();
      assert.ok(close.y >= 0 && close.y + close.height <= height, 'Close stays in view after the body scrolls');
      assert.equal(await page.locator('#menu-sheet .sheet-body').evaluate(el => el.scrollTop > 0), true, 'the Menu body scrolls to Resign');
    }
    for (const words of ['New game', 'Guide', 'Board help', 'Feel', 'Account', 'Resign']) assert.ok((await page.locator('[data-menu-page="menu"]').textContent()).includes(words), words);
    const menuBox = await page.locator('#menu-sheet').boundingBox();
    if (width < 900) await assertPhoneSheet(page, height);
    else assert.ok(Math.abs(menuBox.y - (height - menuBox.height) / 2) <= 1, 'the desktop Menu opens in the centre');
    if (width === 320) assert.ok(await page.locator('#menu-sheet .sheet-body').evaluate(body => {
      const box = body.getBoundingClientRect();
      return [...body.querySelectorAll('[data-menu-page="menu"] button, [data-menu-page="menu"] label')].filter(row => row.checkVisibility()).every(row => {
        const r = row.getBoundingClientRect(); return r.top >= box.top && r.bottom <= box.bottom;
      });
    }), 'every short-phone Menu row fits inside the sheet body');
    const menuClose = await page.locator('#menu-close').boundingBox();
    for (const route of ['new', 'help', 'account', 'resign']) {
      await page.locator(`[data-menu-page="menu"] [data-go="${route}"]`).click();
      assert.equal(await page.locator(`[data-menu-page="${route}"]`).isVisible(), true);
      if (width >= 900) assert.equal((await page.locator('#menu-close').boundingBox()).y, menuClose.y, 'desktop Close keeps its opening position');
      if (width < 900) await assertPhoneSheet(page, height);
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
    await openMenu(page); assert.equal(await page.locator('#look, #reset-view').count(), 0, 'Menu has no Look and no Reset view: the clay look is parked');
    assert.equal(await page.locator('[data-go="extra"], [data-go="game"], #copy, #today-army, #workshop-btn, .coming-row').count(), 0, 'no Extra, This game, Copy moves, Today, Workshop or Card mode row');
    await shot(page, `menu-${width}`);
    await openAccount(page); assert.equal(await page.locator('#account').isVisible(), true);
    // Let Account finish its asynchronous render before replacing its test content.
    await page.locator('#account-body [data-provider="github"]').waitFor({ state: 'visible' });
    const accountContent = await page.locator('#account-body').innerHTML();
    await page.locator('#account-body').evaluate(body => { body.innerHTML = '<p>Account</p>' + '<label>Saved game</label>'.repeat(30); });
    await page.waitForFunction(() => document.getElementById('menu-sheet').classList.contains('has-overflow'));
    assert.equal(await page.locator('#menu-sheet').evaluate(sheet => getComputedStyle(sheet, '::after').display), 'block', 'Account content changes update the shade');
    // The sheet body ends between rows (menu.ts fitBody), also after a scrolled resize; Tricks held these checks before it was parked.
    if (width < 900) await assertPhoneSheet(page, height);
    const endsBetweenRows = slack => page.locator('#menu-sheet .sheet-body').evaluate((body, slack) => {
      const edge = body.getBoundingClientRect().bottom - parseFloat(getComputedStyle(body).paddingBottom);
      return [...body.querySelectorAll('#account-body label')].every(row => { const r = row.getBoundingClientRect(); return r.top >= edge - slack || r.bottom <= edge + slack; });
    }, slack);
    assert.ok(await endsBetweenRows(0), 'long Account ends between rows');
    await page.locator('#menu-sheet .sheet-body').evaluate(body => { body.scrollTop = 53; });
    assert.ok(await page.locator('#menu-sheet .sheet-body').evaluate(body => body.scrollTop > 0), 'long Account scrolls before resize');
    await page.setViewportSize({ width, height: height - 37 });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
    await page.locator('#menu-sheet .sheet-body').evaluate(body => { body.scrollTop = 0; });
    assert.ok(await endsBetweenRows(1), 'after a scrolled resize, long Account still ends between rows at scroll zero');
    await page.setViewportSize({ width, height });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
    if (width >= 900) {
      assert.ok(await page.locator('#menu-sheet .sheet-body').evaluate(body => body.scrollHeight > body.clientHeight + 1), 'desktop long Account overflows');
      assert.equal(await page.locator('#menu-sheet').evaluate(sheet => getComputedStyle(sheet, '::after').display), 'block', 'desktop long Account paints a scroll shade');
    }
    await page.locator('#menu-sheet .sheet-body').evaluate(body => { body.scrollTop = body.scrollHeight; });
    await page.waitForFunction(() => {
      const body = document.querySelector('#menu-sheet .sheet-body');
      return body.scrollHeight - body.clientHeight - body.scrollTop <= 1;
    });
    await page.waitForFunction(() => !document.getElementById('menu-sheet').classList.contains('has-overflow'));
    assert.equal(await page.locator('#menu-sheet').evaluate(sheet => getComputedStyle(sheet, '::after').display), 'none', 'the shade hides at the scroll end');
    await page.locator('#account-body').evaluate((body, html) => { body.innerHTML = html; }, accountContent);
    await page.waitForFunction(() => !document.getElementById('menu-sheet').classList.contains('has-overflow'));
    assert.equal(await page.locator('#menu-sheet').evaluate(sheet => getComputedStyle(sheet, '::after').display), 'none', 'short Account content clears the shade');

    for (const item of ['Guide', 'New game']) {
      await pressMenu(page, item);
      assert.equal(await page.locator('#menu-sheet').isVisible(), false, `${item}: Menu closes first`);
      await page.locator({ Guide: '#rules', 'New game': '#new-game' }[item]).waitFor({ state: 'visible' });
      await page.keyboard.press('Escape');
    }
    await openMenu(page); await page.locator('[data-go="resign"]').click();
    assert.match(await page.locator('#resign-detail').innerText(), /Black wins/);
    assert.equal(confirms, 0, 'Resign asks in the sheet');
    await shot(page, `resign-${width}`); await noSidewaysScroll(page);
    await page.locator('#resign-confirm').click(); assert.equal(await page.locator('#menu-sheet').isVisible(), false);
    assert.equal(await page.locator('#over').isVisible(), true);
    console.log(`ok menu-extra ${width}×${height}: rows, Back, Esc, Close, focus, settings, Account, dialogs, Resign`);
    await context.close();
  }
  // Old data (park-clay spec §3): a saved clay look and a `?look=clay` link open the painted board, with no error and no notice.
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => { sessionStorage.setItem('kingdown.title-seen', '1'); localStorage.setItem('kingdown.look', 'clay'); localStorage.setItem('kingdown.save', JSON.stringify({ back: 'RNBQKBNR', fen: '', moves: [], white: 'human', black: 'human', sound: false })); });
  const page = await context.newPage(); trapErrors(page);
  await page.goto(new URL('?look=clay', env('PLAYABLE_URL')).href); await page.waitForFunction(() => window.view?.ready); await page.evaluate(() => window.view.ready());
  assert.ok(await page.evaluate(() => 'kings' in window.view && window.view.pos.board[4] > 0), 'an old clay look opens the painted board');
  assert.equal(await page.locator('#asset-status').innerText(), '', 'an old clay look gives no notice');
  assert.equal(await page.locator('dialog[open]').count(), 0, 'an old clay look opens no dialog');
  console.log('ok menu-extra: a saved clay look and a ?look=clay link open the painted board');
  await context.close();
  assertNoErrors();
} finally { await browser.close(); }
