// W6: the handed-over end, board Ceremony and result review tiles.
import assert from 'node:assert/strict';
import { endTurn, lanMoves, openEndReview, openMoves, startNewGame, waitForUi } from './app-ui.mjs';
import { assertNoErrors, env, launch, minTarget, noSidewaysScroll, shot, trapErrors } from './lib/checks.mjs';
const base = env('PLAYABLE_URL'), browser = await launch();
const faults = [];
const check = (actual, expected, name) => {
  try { assert.equal(actual, expected, name); } catch (error) { faults.push(error); }
};
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.addInitScript(() => {
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
page.on('dialog', d => d.accept());
const tap = async sq => {
  const p = await page.evaluate(s => window.view.screenOf(s), sq);
  await page.mouse.click(p.x, p.y);
};
const open = async (fen, moves = [], pace = 'off', sides = ['human', 'human'], look = 'painted') => {
  await page.goto(base);
  await page.evaluate(seed => sessionStorage.setItem('w6.seed', JSON.stringify(seed)), { back: '', fen, moves, white: sides[0], black: sides[1], pace, sound: false, skill: 'club' });
  await page.goto(new URL(`?think=50&look=${look}`, base).href);
  await page.waitForFunction(() => window.view?.pos || window.view?.pieces?.size);
  await page.evaluate(() => window.view.ready());
};
const stageMate = async (pace = 'off', look = 'painted') => {
  await open('7k/6pp/8/8/8/p7/8/R5MK w - - 0 1', ['Ra1xa3', 'Kh8-g8', 'Mg1<>h1', 'Kg8-h8'], pace, ['human', 'human'], look);
  await tap(16); await tap(56);
  await page.waitForFunction(() => !window.view.scene?.animating && !window.view.moving);
};
const mate = async () => {
  await stageMate();
  await endTurn(page);
  await page.locator('#over').waitFor({ state: 'visible' });
};
try {
  await mate();
  assert.equal(await page.locator('#over .ceremony-tile').count(), 3, 'three review tiles');
  assert.equal(await page.locator('.kd-words').textContent(), 'King Down');
  assert.equal(await page.evaluate(() => window.view.fallen?.sq), 63, 'the beaten king stays down');
  await page.locator('#over .ceremony-tile').nth(1).click();
  await waitForUi(page, ui => /Review/.test(ui.context));
  assert.equal(await page.locator('#over').isVisible(), false, 'a tile closes the result');
  assert.equal(await page.evaluate(() => window.view.pos.board[0]), 4, 'the tile opens before its capture');
  assert.equal(await page.locator('.kd-words').count(), 0, 'Review clears the end words');
  console.log('ok Ceremony tiles open their review ply');

  await stageMate('normal'); await endTurn(page);
  await page.locator('.ceremony-rematch').waitFor({ state: 'visible' });
  await page.locator('.ceremony-rematch').click();
  await page.waitForTimeout(100);
  assert.deepEqual(await lanMoves(page), [], 'pointer Rematch works from the first frame');
  assert.equal(await page.locator('.kd-words').count(), 0, 'Rematch clears the old end');
  assert.equal(await page.locator('#over').isVisible(), false, 'no old result opens on the new game');
  console.log('ok pointer Rematch cancels every end wait');

  await stageMate('normal');
  assert.equal(await page.locator('.kd-words').count(), 0, 'a staged mate plays no Ceremony');
  await endTurn(page);
  await page.locator('.ceremony-rematch').waitFor({ state: 'visible' });
  assert.equal(await page.locator('#over').isVisible(), false, 'the board beats come before the dialog');
  await page.keyboard.press('Enter');
  await page.locator('#over').waitFor({ state: 'visible' });
  check(await page.evaluate(() => document.querySelector('.ceremony-tiles').getAnimations({ subtree: true }).filter(a => a.playState === 'running').length), 0, 'skip shows tiles at rest');
  assert.equal((await lanMoves(page)).length, 5, 'Enter skips and does not Rematch');
  assert.equal(await page.locator('#over .ceremony-tile').count(), 3, 'skip shows the tiles');
  assert.equal(await page.evaluate(() => document.activeElement.value), 'rematch', 'Rematch has the end focus');
  assert.equal(await page.evaluate(() => [...document.querySelectorAll('.over-king')].flatMap(k => k.getAnimations()).length), 0, 'the dialog has no second king fall');
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

  await stageMate('normal', 'clay'); await endTurn(page);
  await page.waitForFunction(() => window.view.moving && document.querySelector('.kd-words'));
  check(await page.evaluate(() => window.view.tweens.rate), 0.5, 'Clay replays at half speed');
  await page.locator('#over').waitFor({ state: 'visible' });
  await stageMate('off', 'clay'); await endTurn(page);
  await page.locator('#over').waitFor({ state: 'visible' });
  check(await page.evaluate(() => window.view.pieces.get(63).rotation.z), 1.4, 'Clay Off shows the fallen frame at once');
  console.log('checked Clay replay speed and fallen frame');
  assertNoErrors();
  if (faults.length) throw new AggregateError(faults, 'End frame checks fail');
  console.log('ok end frames and one result announcement');
} finally { await browser.close(); }
