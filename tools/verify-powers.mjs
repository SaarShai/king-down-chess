// W3: a coin reads; Use arms; the engine spends a use.
// Run: npm run check:browser powers.
import assert from 'node:assert/strict';
import { contextText, endTurn, lanMoves, openMoves, openPowerRules, powerCoin, previousReview, readPower, usePower } from './app-ui.mjs';
import { assertNoErrors, env, launch, minTarget, noSidewaysScroll, shot, trapErrors } from './lib/checks.mjs';

const base = env('PLAYABLE_URL'), browser = await launch();
const FEN = '4k3/p7/8/3n4/8/8/P7/4K3 w - - 0 1';
const sq = name => (name.charCodeAt(1) - 49) * 8 + name.charCodeAt(0) - 97;
const tap = async (page, name) => {
  const p = await page.evaluate(s => window.view.screenOf(s), sq(name));
  await page.mouse.click(p.x, p.y);
};
async function open(page, kings = 'frost:freeze,none', fen = FEN) {
  await page.goto(base);
  await page.evaluate(fen => localStorage.setItem('kingdown.save', JSON.stringify({ back: '', fen, moves: [], white: 'human', black: 'human', sound: false, pace: 'off' })), fen);
  const url = new URL(base); url.searchParams.set('kings', kings); url.searchParams.set('fen', fen); url.searchParams.set('players', 'human,human');
  await page.goto(url.href);
  await page.waitForFunction(() => window.view?.ready);
  await page.evaluate(() => window.view.ready());
}
const marked = page => page.waitForFunction(() => document.querySelector('#power-w').dataset.state === 'used');
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await page.addInitScript(() => sessionStorage.setItem('kingdown.title-seen', '1'));
  trapErrors(page);

  // 1. A tap only reads, including a power with no legal target.
  await open(page);
  await readPower(page, 'w');
  assert.equal(await contextText(page), 'Freeze · 1 left');
  assert.equal(await powerCoin(page, 'w').getAttribute('aria-pressed'), 'false');
  assert.equal(await page.locator('#power-b').count(), 0, 'no coin for no power');
  assert.equal(await powerCoin(page, 'w').textContent(), '', 'the coin has no visible name');
  await tap(page, 'd5');
  assert.deepEqual(await lanMoves(page), [], 'a read does not arm Freeze');
  await open(page, 'stratus:sacrifice,none', '4k3/8/8/8/8/8/P7/4K3 w - - 0 1');
  await readPower(page, 'w');
  assert.match(await contextText(page), /No pawn can return a piece\./);
  assert.equal(await page.isHidden('#power-use'), true);
  await open(page);
  await readPower(page, 'w');
  assert.equal(await powerCoin(page, 'w').getAttribute('aria-current'), 'true');
  assert.equal(await powerCoin(page, 'w').getAttribute('aria-disabled'), null);
  assert.notEqual(await powerCoin(page, 'w').evaluate(b => getComputedStyle(b).outlineStyle), 'none');
  await openPowerRules(page);
  assert.equal(await page.evaluate(() => document.activeElement?.dataset.power), 'Freeze');
  await page.keyboard.press('Escape');
  console.log('ok a tap reads and does not arm; rules focus the named power');

  // 2. Use arms; Cancel, Esc and a second coin tap disarm.
  await open(page);
  await usePower(page);
  assert.equal(await powerCoin(page, 'w').getAttribute('aria-pressed'), 'true');
  assert.equal(await contextText(page), 'Freeze · 1 left\nTap an enemy piece.');
  assert.equal(await page.isHidden('#power-use'), true);
  await page.click('#power-cancel');
  assert.equal(await powerCoin(page, 'w').getAttribute('aria-pressed'), 'false');
  await usePower(page); await page.keyboard.press('Escape');
  assert.equal(await powerCoin(page, 'w').getAttribute('aria-pressed'), 'false');
  await usePower(page); await readPower(page, 'w');
  assert.equal(await powerCoin(page, 'w').getAttribute('aria-pressed'), 'false');
  console.log('ok Use arms and each cancel path disarms');

  // 3. Freeze is a free mark. End turn still hands the turn over.
  await open(page, 'frost:freeze,flame:haste');
  await usePower(page); await tap(page, 'd5'); await marked(page);
  assert.deepEqual(await lanMoves(page), ['!F:d5']);
  assert.equal(await page.locator('#power-w .notch.is-spent').count(), 1);
  await tap(page, 'a2'); await tap(page, 'a3');
  await readPower(page, 'b');
  assert.match(await contextText(page), /Black's power\./);
  assert.equal(await powerCoin(page, 'b').getAttribute('aria-disabled'), null);
  assert.equal(await page.isHidden('#power-use'), true, 'the next coin waits for the turn press');
  await readPower(page, 'w');
  assert.match(await contextText(page), /Tap End turn first\./);
  await endTurn(page);
  await tap(page, 'd5');
  assert.deepEqual(await lanMoves(page), ['!F:d5', 'a2-a3'], 'the frozen knight cannot move');
  await shot(page, 'freeze');
  console.log('ok Freeze marks and the turn press hands over');

  // 4. Uses read the full move number, restore on Undo, and read the shown review position.
  await open(page, 'frost:freeze,none', FEN.replace('0 1', '0 12'));
  await usePower(page); await tap(page, 'd5'); await marked(page); await readPower(page, 'w');
  assert.equal(await contextText(page), 'Freeze · Used on move 12');
  await page.click('#undo'); await readPower(page, 'w');
  assert.equal(await contextText(page), 'Freeze · 1 left');
  assert.equal(await page.locator('#power-w .notch.is-spent').count(), 0);
  await usePower(page); await tap(page, 'd5'); await marked(page); await endTurn(page);
  await readPower(page, 'w');
  assert.equal(await contextText(page), "Freeze · Used on move 12\nWhite's power.");
  await openMoves(page); await page.locator('#moves [data-ply="1"]').click();
  await previousReview(page);
  await readPower(page, 'w');
  assert.match(await contextText(page), /Review\. Freeze · 1 left/);
  assert.equal(await page.isHidden('#power-use'), true, 'review only reads');
  console.log('ok Used on move N, Undo and review');

  // 5. An always-on coin only reads, on a phone and by keyboard too.
  const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
  await phone.addInitScript(() => sessionStorage.setItem('kingdown.title-seen', '1'));
  trapErrors(phone);
  await open(phone, 'spirit:holylight,mud:leap');
  await readPower(phone, 'w');
  assert.equal(await contextText(phone), 'Holy Light · Always on');
  assert.equal(await phone.isHidden('#power-use'), true);
  assert.equal(await phone.locator('#power-w .notch').count(), 0);
  assert.equal(await powerCoin(phone, 'w').getAttribute('aria-pressed'), null);
  await powerCoin(phone, 'w').focus(); await phone.keyboard.press('Enter');
  assert.equal(await contextText(phone), 'Holy Light · Always on');
  await readPower(phone, 'b');
  assert.equal(await phone.isHidden('#power-use'), true, 'Leap only reads');
  await minTarget(phone, '.coin'); await noSidewaysScroll(phone);
  await shot(phone, 'always-on-phone');
  console.log('ok an always-on coin only reads');
  assertNoErrors();
} finally { await browser.close(); }
