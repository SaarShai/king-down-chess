// The kings' powers through the real HUD: arm a power, spend it with clicks, end a Haste turn, and
// pick powers in New game.
// Run: npm run check:browser powers (screenshots go to PLAYABLE_OUT).
import assert from 'node:assert/strict';
import { lanMoves, lanTurns, waitForUi } from './app-ui.mjs';
import { assertNoErrors, env, launch, shot, trapErrors } from './lib/checks.mjs';
import { startGame } from './new-game-ui.mjs';

const base = env('PLAYABLE_URL');
const browser = await launch();
// The check's own navigation (page.goto while the page still loads its art) cuts off requests,
// and a cut-off request shows as "Failed to fetch". This error also shows on main.
const allow = [{ pattern: /Failed to fetch/, reason: 'a request that the check\'s own navigation cuts off' }];
const sq = name => (name.charCodeAt(1) - 49) * 8 + (name.charCodeAt(0) - 97);
const moves = async page => (await lanMoves(page)).join(' ');

/** A page on `fen` with these kings, White human, Black the beginner computer (fast replies). */
async function open(page, kings, fen) {
  const url = new URL(base);
  url.searchParams.set('kings', kings);
  url.searchParams.set('fen', fen);
  await page.goto(base);
  await page.evaluate(() => localStorage.setItem('kingdown.save', JSON.stringify({ back: '', fen: '8/8/8/8/8/8/8/8 w - - 0 1', moves: [], white: 'human', black: 'ai', think: 200, skill: 'beginner', coords: true, resigned: null, pace: 'off' })));
  await page.goto(url.href);
  await page.waitForFunction(() => document.querySelector('#board canvas') && !document.getElementById('powers').hidden);
}
const click = async (page, name) => {
  const p = await page.evaluate(s => window.view.screenOf(s), sq(name));
  await page.mouse.click(p.x, p.y);
};
const waitText = (page, re, timeout = 10000) =>
  waitForUi(page, (ui, r) => new RegExp(r).test(ui.lan.join(' ')), re.source, { timeout });

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.addInitScript(() => sessionStorage.setItem('kingdown.title-seen', '1')); // skip the title screen (main.ts)
  trapErrors(page, allow);

  // Freeze (balanced: once a game, then the ordinary move): the button arms it, a tap on the enemy
  // knight spends it, White still moves, and the computer cannot move the knight.
  await open(page, 'frost:freeze,none', '4k3/p7/8/3n4/8/8/P7/4K3 w - - 0 1');
  assert.match(await page.textContent('#power-btn'), /Use Freeze \(1 left\)/);
  await click(page, 'd5');                      // unarmed: tapping an enemy does nothing
  assert.doesNotMatch(await moves(page), /!F/);
  await page.click('#power-btn');
  assert.match(await page.textContent('#power-status'), /Tap an enemy piece/);
  await click(page, 'd5');
  await waitText(page, /!F:d5/);
  await page.waitForFunction(() => /Now make your move/.test(document.getElementById('power-status').textContent));
  await click(page, 'a2'); await click(page, 'a3');
  await waitText(page, /a2-a3/);
  await waitForUi(page, ui => ui.lan.length >= 3, null, { timeout: 15000 });
  assert.doesNotMatch(await moves(page), /Nd5-/, 'the frozen knight did not move');
  assert.match(await page.textContent('#power-btn'), /0 left/);
  console.log(`ok freeze: ${(await moves(page)).trim()}`);

  // Haste (balanced: neither move captures): arm, move the rook, the same rook moves again.
  await open(page, 'flame:haste,none', '7k/p7/8/8/8/8/8/R5K1 w - - 0 1');
  await page.click('#power-btn');
  await click(page, 'a1'); await click(page, 'a4');
  await waitText(page, /Ra1-a4!H/);
  await page.waitForFunction(() => !document.getElementById('end-haste').hidden);
  assert.match(await page.textContent('#power-status'), /move the same piece again/);
  await click(page, 'e4');                      // the hasted rook is already selected
  await waitText(page, /Ra4-e4/);
  const line = (await lanTurns(page))[0];
  assert.deepEqual(line.slice(0, 2), ['Ra1-a4!H', 'Ra4-e4'], 'one turn, two plies, one line');
  console.log(`ok haste: ${line}`);

  // Haste ended early with the End turn button.
  await open(page, 'flame:haste,none', '7k/p7/8/8/8/8/8/R5K1 w - - 0 1');
  await page.click('#power-btn');
  await click(page, 'a1'); await click(page, 'a4');
  await page.waitForFunction(() => !document.getElementById('end-haste').hidden);
  await page.click('#end-haste');
  await waitText(page, /--/);
  console.log('ok haste ended early');

  // Sacrifice: the pawn becomes the lost queen.
  await open(page, 'stratus:sacrifice,none', '4k3/8/8/8/8/8/P7/4K3 w - - 0 1 lQ');
  await page.click('#power-btn');
  await click(page, 'a2');
  await waitText(page, /!S:a2=Q/);
  console.log('ok sacrifice');

  // Flight: arm, choose the knight, a square in our half.
  await open(page, 'stratus:flight,none', '4k3/p7/8/8/8/8/P7/1N2K3 w - - 0 1');
  await page.click('#power-btn');
  await click(page, 'b1'); await click(page, 'h4');
  await waitText(page, /Nb1~h4/);
  console.log('ok flight');

  // Always-on power: no button, a line that says what it does.
  await open(page, 'shadow:deathtouch,none', '4k3/p7/8/8/8/8/P7/4K3 w - - 0 1');
  assert.equal(await page.isHidden('#power-btn'), true);
  assert.match(await page.textContent('#info'), /White's king: Death Touch/);
  console.log('ok always-on power shown');

  // The Guide lists the twelve as a game with powers plays them, in a game with powers and without.
  const mercyLine = /Mercy \(always on\) — your king steps 1–2 squares and jumps your pieces, but takes only a pawn or a guard; your pieces next to it cannot be taken except by pawns/;
  assert.match(await page.textContent('#powers-list'), mercyLine);
  await page.evaluate(() => localStorage.setItem('kingdown.save', JSON.stringify({ back: '', fen: '4k3/p7/8/8/8/8/P7/4K3 w - - 0 1', moves: [], white: 'human', black: 'ai', think: 200, skill: 'beginner', coords: true, resigned: null, pace: 'off' })));
  await page.goto(base);
  await page.waitForFunction(() => document.querySelector('#board canvas') && /Mercy/.test(document.getElementById('powers-list').textContent));
  assert.equal(await page.isHidden('#powers'), true, 'a game without powers');
  const guide = await page.textContent('#powers-list');
  assert.match(guide, mercyLine);
  assert.match(guide, /Freeze \(once a game\)/);
  assert.match(guide, /Darkness \(always on\) — your pawns may also step diagonally, and take only straight ahead; your king may also step two squares in a straight line, over an empty square\./);
  // `?rules=2017` plays the powers as printed (the preset overrides the official readings), so its Guide lists them so.
  await page.goto(`${base}?rules=2017`);
  await page.waitForFunction(() => document.querySelector('#board canvas') && /Mercy/.test(document.getElementById('powers-list').textContent));
  const printed = await page.textContent('#powers-list');
  assert.match(printed, /Freeze \(twice a game\)/);
  assert.match(printed, /Mercy \(always on\) — your king steps 1–2 squares and jumps your pieces, but takes only a guard\./);
  assert.match(printed, /Darkness \(always on\) — your pawns step diagonally and take straight ahead, with no double step\./);
  await page.goto(base);
  console.log('ok the Guide lists the official powers, and the printed ones under ?rules=2017');

  // New game: Kings' powers, a king and a power per side; the game starts with them (and the info card names them).
  await startGame(page, { mode: 'powers', kings: ['Mud:March', 'Frost:IceWall'], army: 'classic' });
  await page.waitForFunction(() => /White's king: March — /.test(document.getElementById('info').textContent)
    && /Black's king: Ice Wall, 2 left/.test(document.getElementById('info').textContent));
  await shot(page, 'new-game-powers');
  console.log('ok new game with powers');

  // Phone width: the power bar fits and stays usable.
  const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  await phone.addInitScript(() => sessionStorage.setItem('kingdown.title-seen', '1')); // skip the title screen (main.ts)
  trapErrors(phone, allow);
  await open(phone, 'frost:freeze,flame:haste', '4k3/p7/8/3n4/8/8/P7/4K3 w - - 0 1');
  const box = await phone.$eval('#power-btn', b => { const r = b.getBoundingClientRect(); return { right: r.right, w: innerWidth }; });
  assert.ok(box.right <= box.w, 'the power button fits the phone width');
  await shot(phone, 'phone-powers');
  console.log('ok phone layout');

  assertNoErrors();
  console.log('ok no page errors');
} finally {
  await browser.close();
}
