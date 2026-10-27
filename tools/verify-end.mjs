// W6: the handed-over end, board Ceremony and result review tiles.
import assert from 'node:assert/strict';
import { readyBoard, rulesAt,ceremonyTile, ceremonyWords, confirmResign, endTurn, usePower, lanMoves, openEndReview, openMoves, pressMenu, startNewGame, waitForUi } from './app-ui.mjs';
import { assertNoErrors, env, launch, minTarget, noSidewaysScroll, shot, trapErrors } from './lib/checks.mjs';
const base = env('PLAYABLE_URL'), browser = await launch();
const faults = [];
const check = (actual, expected, name) => {
  try { assert.equal(actual, expected, name); } catch (error) { faults.push(error); }
};
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.addInitScript(() => {
  window.uiMotionEvents = [];
  const animate = Element.prototype.animate;
  Element.prototype.animate = function(frames, options) {
    window.uiMotionEvents.push({id:this.id, className:this.getAttribute('class'), frames, options});
    return animate.call(this,frames,options);
  };
  window.resultsSpoken = [];
  let last = '';
  new MutationObserver(() => {
    const line = document.getElementById('announce')?.textContent ?? '';
    if (line === last) return;
    last = line;
    if (/wins/.test(line)) window.resultsSpoken.push(line);
  }).observe(document, { childList: true, characterData: true, subtree: true });
  sessionStorage.setItem('kingdown.title-seen', '1');
  const seed = sessionStorage.getItem('w6.seed');
  if (seed) { localStorage.setItem('kingdown.save', seed); sessionStorage.removeItem('w6.seed'); }
});
trapErrors(page);
// Cached images can load before the initial resize. Keep that order under test.
await page.addInitScript(() => {
  const Native = ResizeObserver;
  window.ResizeObserver = class extends Native {
    constructor(callback) { super((...args) => setTimeout(() => callback(...args), 250)); }
  };
});
page.on('dialog', d => d.accept());
const tap = async sq => {
  const p = await page.evaluate(s => window.view.screenOf(s), sq);
  await page.mouse.click(p.x, p.y);
};
const open = async (fen, moves = [], pace = 'off', sides = ['human', 'human'], query = '') => {
  await page.goto(base);
  const url = new URL(`?think=50${query}`, base).href;
  // A save holds the rules of its game. A save with the URL rules replays under them.
  const rules = /[?&](kings|rules)=/.test(url) ? await rulesAt(browser, url) : undefined;
  await page.evaluate(seed => sessionStorage.setItem('w6.seed', JSON.stringify(seed)), { back: '', fen, moves, white: sides[0], black: sides[1], pace, sound: false, skill: 'club', ...(rules && { rules }) });
  await page.goto(url);
  await readyBoard(page);
};
const stageMate = async (pace = 'off') => {
  await open('7k/6pp/8/8/8/p7/8/R5MK w - - 0 1', ['Ra1xa3', 'Kh8-g8', 'Mg1<>h1', 'Kg8-h8'], pace);
  await tap(16); await tap(56);
  await page.waitForFunction(() => !window.view.scene?.animating && !window.view.moving);
};
const mate = async () => {
  await stageMate();
  await endTurn(page);
  await page.locator('#over').waitFor({ state: 'visible' });
};
try {
  // These input checks run before a test clock is installed.
  for (const start of [false, true]) {
    await stageMate('normal');
    // Window capture records the press before the board's document capture handler.
    await page.evaluate(() => {
      window.menuPress = null;
      window.addEventListener('pointerdown', e => {
        if (!e.target.closest('#menu-btn')) return;
        window.menuPress = { animating: window.view.scene.animating, falling: window.view.scene.falling };
      }, { capture: true });
    });
    await endTurn(page);
    await page.waitForFunction(() => window.view.scene.animating);
    await page.locator('#menu-btn').click();
    assert.equal(await page.evaluate(() => window.menuPress?.animating), true, 'Menu receives a press during the active final blow');
    assert.equal(await page.locator('#menu-sheet').evaluate(d => d.open), false, 'A8: the skip press keeps Menu closed');
    assert.equal(await page.evaluate(() => window.view.scene.animating || window.view.scene.falling), false, 'A8: the Menu press ends board motion');
    await page.locator('#over').waitFor({ state: 'visible' });
    assert.equal(await page.evaluate(() => document.activeElement.id), 'over-title', 'A9: the skip opens the result with heading focus');
    console.log('ok real-clock A8/A9 Menu press during the active final blow', await page.evaluate(() => window.menuPress));
    await page.locator('#over [value=close]').click();
    await page.locator('#menu-btn').click();
    assert.equal(await page.locator('#menu-sheet').evaluate(d => d.open), true, 'Menu opens after board motion ends');
    await page.locator('[data-go="new"]').click();
    await page.locator('#new-game-btn').click();
    await page.locator('#new-game').waitFor({ state: 'visible' });
    await page.locator('#start-game').focus();
    if (start) {
      await page.keyboard.press('Enter');
      await waitForUi(page, ui => ui.lan.length === 0);
      assert.equal(await page.locator('dialog[open]').count(), 0, 'Enter starts the new game');
    } else {
      await page.waitForTimeout(2500); // No result may cover the sheet after the Ceremony ends.
      assert.equal(await page.locator('dialog[open]').count(), 1, 'only New game stays open');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'start-game', 'the sheet keeps focus');
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#new-game').evaluate(d => d.open), false, 'Escape belongs to New game');
      await page.locator('#new-game').waitFor({state:'hidden'});
    }
    assert.equal(await page.locator('#over').isVisible(), false, 'the old result does not open');
    assert.equal(await page.locator('.kd-words').count(), 0, 'the old Ceremony is cancelled');
  }
  console.log('ok New game keeps its keys and focus after the skip');

  await page.clock.install();

  await mate();
  assert.equal(await page.locator('#over .ceremony-tile').count(), 3, 'three review tiles');
  assert.equal(await ceremonyWords(page).textContent(), 'King Down');
  assert.equal(await page.locator('.kd-words').count(), 0, 'no words sit behind the dialog');
  assert.deepEqual(await page.locator('#over .ceremony-tile').evaluateAll(bs => bs.map(b => +b.dataset.ply)), [0, 2, 4], 'tiles follow play order');
  assert.deepEqual(await page.locator('#over .ceremony-tile span').allTextContents(), ['Rook takes pawn', 'Maester swaps', 'Rook moves'], 'tiles name the act');
  assert.equal(await page.locator('#over-review').evaluate(b => getComputedStyle(b).justifyContent), 'center', 'Review has a centred label');
  assert.ok(await page.locator('#over-review').evaluate(b => parseFloat(getComputedStyle(b).marginTop) >= 12), 'Review has its own space');
  assert.doesNotMatch(await page.locator('#over-detail').innerText(), /setup|Ra3-a8/, 'the result uses words');
  assert.match(await page.locator('#over-detail').innerText(), /3 moves\.$/);
  assert.equal(await page.evaluate(() => window.view.fallen?.sq), 63, 'the beaten king stays down');
  await ceremonyTile(page, 0).click();
  await waitForUi(page, ui => /Review/.test(ui.context));
  assert.equal(await page.locator('#over').isVisible(), false, 'a tile closes the result');
  assert.equal(await page.evaluate(() => window.view.pos.board[0]), 4, 'the tile opens before its capture');
  assert.equal(await page.locator('.kd-words').count(), 0, 'Review clears the end words');
  console.log('ok Ceremony tiles open their review ply');
  for (const width of [430, 390]) {
    await page.setViewportSize({width, height: 844});
    await mate();
    for (const flipped of [false, true]) {
      await page.evaluate(flipped => window.view.flip(flipped), flipped);
      await noSidewaysScroll(page);
      await shot(page, `ui-ready-${width}-${flipped ? 'black' : 'white'}`);
    }
  }


  await open('7k/6pp/8/8/8/R7/8/6MK w - - 0 1', [], 'off', ['human', 'human'], '&kings=flame:haste,none');
  await usePower(page); await tap(16); await tap(56); await endTurn(page);
  await page.locator('#over').waitFor({ state: 'visible' });
  assert.doesNotMatch(await page.locator('#over-detail').innerText(), /ends the turn/, 'the result skips the trailing pass');
  assert.doesNotMatch(await page.locator('#over-detail').innerText(), /may move again|may move next/, 'the finished game promises no further move');
  assert.equal(await page.locator('#over .ceremony-tile span').last().innerText(), 'Rook moves with Haste');

  await stageMate('normal'); await endTurn(page);
  await page.locator('.kd-words').waitFor({ state: 'attached' });
  assert.equal(await page.locator('.ceremony-caption').evaluate(el => el.closest('#board') === null && el.closest('#context-line') !== null), true, 'the replay caption sits outside the squares');
  assert.equal(await page.locator('#end-turn').innerText(), 'End turn', 'the Ceremony keeps the turn label');
  assert.equal(await page.locator('.ceremony-caption').innerText(), 'The final blow · Tap the board to skip', 'the caption names its tap target');
  assert.equal(await page.locator('#end-turn').getAttribute('aria-disabled'), 'true', 'the bar stays off during the Ceremony');
  await page.locator('#end-turn').focus();
  await page.keyboard.press('Space');
  assert.equal(await page.locator('#over').isVisible(), false, 'Space on End turn does not skip');
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('#over').isVisible(), false, 'Enter on End turn does not skip');
  await page.locator('#board').focus();
  await page.keyboard.press('Escape');
  await page.locator('#over').waitFor({ state: 'visible' });
  assert.equal(await page.locator('.kd-words').count(), 0, 'the result hides the board words');
  await page.locator('#over [value=rematch]').click();
  await page.clock.runFor(100);
  assert.deepEqual(await lanMoves(page), [], 'dialog Rematch starts the next game');
  assert.equal(await page.locator('.kd-words').count(), 0, 'Rematch clears the old end');
  assert.equal(await page.locator('#over').isVisible(), false, 'no old result opens on the new game');
  console.log('ok disabled turn button and dialog Rematch');

  await stageMate('normal'); await endTurn(page);
  await page.locator('.kd-words').waitFor({ state: 'attached' });
  await pressMenu(page, 'Settings');
  await page.locator('#menu-back').focus(); await page.keyboard.press('Space');
  assert.equal(await page.locator('#menu-title').textContent(), 'Menu', 'Space works on the sheet button');
  await page.clock.runFor(2500); // The result waits for the sheet to close.
  assert.equal(await page.locator('#over').isVisible(), false, 'the result waits behind Menu');
  await page.keyboard.press('Escape');
  await page.locator('#over').waitFor({ state: 'visible' });
  assert.equal(await page.locator('dialog[open]').count(), 1, 'only the result opens after Menu closes');
  console.log('ok sheet keys work and the result waits for close');

  await stageMate('normal');
  assert.equal(await page.locator('.kd-words').count(), 0, 'a staged mate plays no Ceremony');
  await page.evaluate(() => { const s = window.view.scene, play = s.play.bind(s); s.play = (m, o) => { window.blowSpeed = o?.speed; return play(m, o); }; });
  await endTurn(page);
  await page.locator('.kd-words').waitFor({ state: 'attached' });
  check(await (await page.waitForFunction(() => window.blowSpeed)).jsonValue(), 2, 'the Ceremony replays the final blow at half speed');
  assert.equal(await page.locator('#over').isVisible(), false, 'the board beats come before the dialog');
  await page.locator('#board').focus();
  await page.keyboard.press('Enter');
  await page.locator('#over').waitFor({ state: 'visible' });
  check(await page.evaluate(() => document.querySelector('.ceremony-tiles').getAnimations({ subtree: true }).filter(a => a.playState === 'running').length), 0, 'skip shows tiles at rest');
  assert.equal((await lanMoves(page)).length, 5, 'Enter skips and does not Rematch');
  assert.equal(await page.locator('#over .ceremony-tile').count(), 3, 'skip shows the tiles');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'over-title', 'The result heading has the end focus');
  assert.equal(await page.locator('#over').evaluate(dialog => dialog.scrollTop), 0, 'The result opens at the top');
  assert.equal(await page.evaluate(() => [...document.querySelectorAll('.over-king')].flatMap(k => k.getAnimations()).some(a => a.effect.getKeyframes().some(f => /rotate/.test(f.transform ?? '')))), false, 'the dialog has no second king fall');
  await minTarget(page, '#over button'); await noSidewaysScroll(page);
  await shot(page, 'ceremony-phone');
  await page.setViewportSize({ width: 1440, height: 900 });
  await shot(page, 'ceremony-desktop');
  console.log('ok staged end; Enter skips; one king fall; result focus');

  await openEndReview(page);
  assert.ok(await page.locator('#over-moments').textContent(), 'Review starts the key-moment search');
  await page.locator('#sheet-moves header button').click();
  await startNewGame(page); await openMoves(page);
  check(await page.locator('#over-moments').textContent(), '', 'a new game clears the old review data');
  await page.locator('#sheet-moves header button').click();

  await open('4r1k1/8/8/8/8/8/5PPP/R5K1 w - - 0 1', ['Ra1-a7'], 'off', ['human', 'ai']);
  await page.locator('#over').waitFor({ state: 'visible' });
  assert.equal(await page.locator('.kd-words').count(), 0, 'a loss stays quiet');
  assert.equal(await page.locator('#over .ceremony-tile').count(), 0, 'a loss has no Ceremony tiles');
  assert.equal(await page.evaluate(() => window.view.fallen?.sq), 6, 'the losing king lies down');
  check(await page.evaluate(() => window.resultsSpoken.length), 1, 'the result is spoken once');
  await open('7k/8/8/8/8/8/8/7K w - - 0 1');
  await page.locator('#over').waitFor({ state: 'visible' });
  assert.equal(await page.locator('.kd-words').count(), 0, 'a draw stays quiet');
  assert.equal(await page.evaluate(() => window.view.fallen), null, 'a draw has no beaten king');
  console.log('checked quiet loss, draw and result announcement');
  for (const pace of ['normal', 'fast']) {
    await stageMate(pace); await endTurn(page);
    await page.locator('#over').waitFor({state:'visible'});
    await page.waitForFunction(() => window.uiMotionEvents.some(event => event.id === 'over-words'));
    const beat = await page.evaluate(() => window.uiMotionEvents.filter(event => event.id === 'over-words'));
    assert.equal(beat.length, 1, 'The live victory title enters once');
    assert.equal(beat[0].options.duration, pace === 'fast' ? 310 : 620, 'Result motion uses the chosen pace');
    await page.locator('#over').evaluate(el => Promise.all(el.getAnimations({subtree:true}).map(a => a.finished.catch(() => {}))));
    for (const width of [430, 390]) {
      await page.setViewportSize({width, height:844}); await noSidewaysScroll(page);
      await shot(page, `ui-motion-${pace}-${width}`);
    }
    assert.equal(await page.evaluate(() => window.uiMotionEvents.filter(event => event.id === 'over-words').length), 1, 'Resize never replays a result');
    await page.reload(); await readyBoard(page); await page.locator('#over').waitFor({state:'visible'});
    assert.equal(await page.evaluate(() => window.uiMotionEvents.length), 0, 'Reload shows a stable historic result');
    assert.equal(await page.locator('.kd-words').count(), 0, 'Reload never starts the final-blow replay');
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  await stageMate('normal'); await endTurn(page); await page.locator('#over').waitFor({state:'visible'});
  assert.equal(await page.evaluate(() => window.uiMotionEvents.length), 0, 'System reduced motion leaves the UI still');
  await page.emulateMedia({reducedMotion:'no-preference'});
  await stageMate('off'); await endTurn(page); await page.locator('#over').waitFor({state:'visible'});
  assert.equal(await page.evaluate(() => window.uiMotionEvents.length), 0, 'Motion Off leaves the UI still');
  console.log('ok UI motion: live once, Fast, 430/390, resize, reload, reduced and Off');
  for (const [side, moves, last] of [
    ['White', ['e2-e4', 'e7-e5'], 'Black pawn e7 to e5.'],
    ['Black', ['e2-e4'], 'White pawn e2 to e4.'],
  ]) {
    await open('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1', moves);
    await confirmResign(page);
    await page.locator('#over').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#over-detail').textContent(), `${last} ${side} resigns. 1 move.`, 'the last move and the side that resigns have separate sentences');
    assert.match(await page.locator('#announce').textContent(), new RegExp(`${side} resigns`), 'the announcement names the side');
    await openEndReview(page);
    assert.match(await page.locator('#context-text').textContent(), new RegExp(`${side} resigns`), 'Review keeps the result');
  }
  console.log('ok resignation detail, Review and announcement for both sides');
  assertNoErrors();
  if (faults.length) throw new AggregateError(faults, 'End frame checks fail');
  console.log('ok end frames and one result announcement');
} finally { await browser.close(); }
