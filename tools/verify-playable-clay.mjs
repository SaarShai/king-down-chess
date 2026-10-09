/** End-to-end checks against the running built game; no simulated balance games. */
// Run: npm run check:browser playable-clay (screenshots and browser-checks.json go to PLAYABLE_OUT).
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { endTurn, lanMoves, pressMenu, setPace, waitForUi } from './app-ui.mjs';
import { assertNoErrors, env, launch, shot, trapErrors } from './lib/checks.mjs';
import { startGame } from './new-game-ui.mjs';
const url = env('PLAYABLE_URL');
const out = env('PLAYABLE_OUT'); mkdirSync(out, { recursive: true });
const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.addInitScript(() => sessionStorage.setItem('kingdown.title-seen', '1')); // skip the title screen (main.ts)
await page.addInitScript(() => localStorage.setItem('kingdown.look', 'clay')); // painted is the default look
const errors = trapErrors(page), checks = [];
async function ready() {
  await page.waitForFunction(() => window.view && window.view.pieces.size > 0 && [...window.view.pieces.values()].every(g => g.userData.figure));
  await page.evaluate(() => window.view.ready());
}
async function fixedPresentation() {
  assert.equal(await page.locator('#style,#pixel,#edges,#sculpts,#palette,#dither').count(), 0);
  assert.ok(await page.evaluate(() => {
    const v = window.view, canvas = v.renderer.domElement;
    return v.style.pieces === 'clay' && v.style.clayLook === 'handmade'
      && v.clayPass.enabled && v.clayPass.pixelSize === .5
      && v.clayPass.beauty.width === canvas.width * 2
      && v.clayPass.beauty.height === canvas.height * 2
      && [...v.pieces.values()].every(g => {
        let handmade = true;
        g.userData.figure.model.traverse(m => {
          if (m.isMesh) for (const material of [m.material].flat()) handmade &&= material.userData.clayLook === 'handmade';
        });
        return handmade;
      });
  }), 'fixed handmade clay at twice the canvas resolution in both dimensions');
}
async function facingOpponent() {
  assert.ok(await page.evaluate(() => [...window.view.pieces.values()].every(g =>
    Math.abs(g.rotation.y - ((g.userData.code & 16) ? 0 : Math.PI)) < .001
    && g.userData.figure.model.rotation.y === 0)), 'both armies must face their opponent at rest');
}
async function clickSquare(sq, shift = false) {
  const point = await page.evaluate(sq => window.view.screenOf(sq), sq);
  if (shift) await page.keyboard.down('Shift');
  await page.mouse.click(point.x, point.y);
  if (shift) await page.keyboard.up('Shift');
}
async function settled(sq, code) {
  await waitForUi(page, (ui, {sq,code}) => {
    const g = window.view.pieces.get(sq);
    return g?.userData.code === code && Math.abs(g.position.x - (sq % 8 - 3.5)) < .001 && Math.abs(g.position.z - (3.5 - Math.floor(sq / 8))) < .001 && !ui.thinking;
  }, {sq,code});
  await page.waitForFunction(() => [...window.view.pieces.values()].every(g => {
    const f=g.userData.figure;return !f || f.model.rotation.y === 0;
  }));
  await facingOpponent();
}
try {
  await page.goto(url); await ready();
  await fixedPresentation(); await facingOpponent();
  checks.push('fixed handmade clay at 0.5 px, no rendering controls, armies facing one another');
  assert.equal(await page.evaluate(() => window.view.pieces.size), 32);
  checks.push('32 independently animated clay figures load in the default game');
  // Kings with no power are Spirit (White) and Shadow (Black); a king with a power shows its own king.
  const kings = () => page.evaluate(() => [...window.view.pieces.values()].filter(g => g.userData.king)
    .map(g => `${g.userData.code & 16 ? 'b' : 'w'}:${g.userData.king}`).sort());
  const kingFiles = () => page.evaluate(() => performance.getEntriesByType('resource')
    .map(e => e.name.match(/board-king-([a-z]+)\.glb/)?.[1]).filter(Boolean));
  assert.deepEqual(await kings(), ['b:Shadow', 'w:Spirit']);
  assert.deepEqual((await kingFiles()).sort(), ['shadow', 'spirit']);
  await startGame(page, { mode: 'powers', kings: ['Frost:Freeze', 'Mud:none'], army: 'classic' }); await ready();
  assert.deepEqual(await kings(), ['b:Shadow', 'w:Frost'], 'the White king is rebuilt as Frost; Black has no power');
  assert.ok((await kingFiles()).includes('frost'));
  checks.push('kings with no power are the Spirit and Shadow figures; a new game with Frost Freeze rebuilds the White king');
  await startGame(page, { mode: 'two', army: 'classic' }); await ready();
  assert.deepEqual(await page.evaluate(()=>Array.from({length:8},(_,i)=>{const sq=8+i,p=window.view.screenOf(sq);return window.view.pick({clientX:p.x,clientY:p.y});})),[8,9,10,11,12,13,14,15]);
  checks.push('every initial pawn-square centre selects its own pawn, not the back rank');
  await clickSquare(1); await clickSquare(18);
  await page.waitForFunction(()=>window.view.pieces.get(1)?.position.y>.1);
  await settled(18,2); await page.click('#undo'); await settled(1,2);
  checks.push('the clay knight retains its leap and returns to its rest pose');
  await clickSquare(12); await clickSquare(28); await settled(28, 1);
  assert.match((await lanMoves(page)).join(' '), /e2-e4/);
  checks.push('real board picking and a completed pawn walk');
  await page.evaluate(() => {
    const save = JSON.parse(localStorage.getItem('kingdown.save'));
    save.style = 'plasticine'; localStorage.setItem('kingdown.save', JSON.stringify(save));
  });
  await page.reload(); await ready(); await fixedPresentation();
  assert.match((await lanMoves(page)).join(' '), /e2-e4/);
  await page.goto(url+'?style=voxel&px=6'); await ready(); await fixedPresentation();
  assert.match((await lanMoves(page)).join(' '), /e2-e4/);
  checks.push('legacy saved styles and URL style/pixel overrides cannot change the fixed presentation');
  await clickSquare(52); await clickSquare(36); await settled(36, 17);
  await page.click('#undo'); await settled(52,17);
  assert.deepEqual(await lanMoves(page), ['e2-e4']);
  checks.push('reload hands over; Undo restores the next staged move');
  await startGame(page, { mode: 'computer', side: 'white', army: 'classic' }); await ready();
  await clickSquare(12); await clickSquare(28);
  await endTurn(page);
  await waitForUi(page, ui => ui.lan.length >= 2 && document.querySelector('#turn').textContent.includes('White'));
  await waitForUi(page, ui => !ui.thinking && !ui.result); // the reply is in, and the game goes on
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('kingdown.save')).moves.length >= 2);
  checks.push('human move receives a legal worker-AI reply');
  await startGame(page, { mode: 'two', army: 'SQBKRSML' }); await ready();
  assert.equal(await page.locator('#setup').textContent(),'SQBKRSML');
  const pawnSquares = [...Array(8)].flatMap((_, i) => [8+i, 48+i]);
  assert.deepEqual(await page.evaluate(squares => squares.map(sq => {
    const p = window.view.screenOf(sq); return window.view.pick({clientX:p.x,clientY:p.y});
  }), pawnSquares), pawnSquares, 'resized pieces must not intercept neighbouring pawn-square centres');
  await fixedPresentation(); await facingOpponent();
  checks.push('optional mirrored setup keeps the fixed handmade material and opponent-facing armies');
  await pressMenu(page, 'Guide');
  assert.match(await page.locator('#rules-rows .piece-card[data-piece="archer"]').textContent(), /forward diagonal at distance 2/);
  assert.match(await page.locator('#rules-rows .piece-card[data-piece="beast"]').textContent(), /Takes on any adjacent square/);
  await page.locator('#rules form button').click();
  checks.push('piece guide describes the current Archer and Beast rules');
  // Interrupt the shove: a delayed animation must not change the restored position.
  await startGame(page, { army: 'ogre' }); await ready();
  await clickSquare(26); await clickSquare(27);
  await waitForUi(page, ui => ui.lan.join(' ').includes('Oc4>d4-e4'));
  await page.click('#undo'); await settled(27,1);
  await page.waitForTimeout(1800);
  assert.equal(await page.evaluate(()=>window.view.pieces.has(28)),false);
  assert.equal(await page.evaluate(()=>window.view.pieces.size),5);
  checks.push('undo during the Ogre shove cancels delayed movement');
  await clickSquare(26); await clickSquare(27); await settled(28,1);
  assert.match((await lanMoves(page)).join(' '), /Oc4>d4-e4/);
  checks.push('Ogre shove animation completes with the pawn on its legal square');
  // A legal rook capture also exercises figure disposal and contour membership.
  await page.goto(url+'?players=human,human&fen='+encodeURIComponent('7k/8/8/8/8/p7/8/R6K w - - 0 1')); await ready();
  await clickSquare(0); await clickSquare(16); await settled(16,4);
  assert.equal(await page.evaluate(()=>window.view.pieces.size),3);
  assert.match((await lanMoves(page)).join(' '), /Ra1xa3/);
  await page.click('#undo'); await ready();
  assert.equal(await page.evaluate(()=>window.view.pieces.size),4);
  checks.push('capture disposes the victim, and undo restores its model');
  // Animations: a tap during the walk ends it on the final board; Fast doubles the tween rate; Off plays none.
  const moving = () => page.evaluate(()=>window.view.moving);
  await clickSquare(0); await clickSquare(16); await page.waitForTimeout(150);
  const walking = await moving(); await clickSquare(63); const afterTap = await moving();
  await settled(16,4);
  assert.equal(await page.evaluate(()=>window.view.pieces.size),3);
  await page.click('#undo'); await ready();
  await setPace(page, 'fast'); assert.equal(await page.evaluate(()=>window.view.tweens.rate), 2);
  await setPace(page, 'off');
  await clickSquare(0); await clickSquare(16); const offMoving = await moving(); await settled(16,4);
  assert.deepEqual({ walking, afterTap, offMoving }, { walking: true, afterTap: false, offMoving: false });
  await setPace(page, 'normal'); await page.click('#undo'); await ready();
  checks.push('a tap skips the capture walk, Fast doubles the tween rate, Off shows only the result');
  // Review: ← shows the board before the capture, → replays it. Back to game leaves Review.
  await clickSquare(0); await clickSquare(16); await settled(16,4);
  await page.keyboard.press('ArrowLeft'); await settled(0,4);
  assert.ok(await page.evaluate(()=>window.view.pieces.has(16) && !window.view.moving), 'the pawn is back on a3');
  await page.keyboard.press('ArrowRight');
  assert.ok(await page.evaluate(()=>window.view.moving), '→ replays the capture');
  await settled(16,4);
  assert.equal(await page.evaluate(()=>window.view.pieces.size),3);
  await page.click('#back-to-game');
  await page.click('#undo'); await ready();
  checks.push('review: ← shows the board before the capture, → replays it');
  await startGame(page, { army: 'classic' }); await ready();
  await clickSquare(12); await clickSquare(28);
  await startGame(page); await ready(); await page.waitForTimeout(1000);
  assert.equal(await page.evaluate(()=>window.view.pieces.size),32);
  assert.deepEqual(await lanMoves(page), []);
  checks.push('new game during a walk prevents stale animation from changing the new board');
  await startGame(page, { army: 'SQBKRSML' }); await ready();
  await shot(page, 'desktop');
  await page.setViewportSize({width:390,height:844}); await page.waitForTimeout(300);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  const panel=await page.locator('#table-bar').boundingBox();assert.ok(panel.width<=390 && panel.y>=700 && panel.y+panel.height<=844);
  const header=await page.locator('#strip-them').boundingBox(), board=await page.locator('#board').boundingBox();
  assert.ok(board.y>=header.y+header.height-1, 'mobile header must not cover the back rank');
  await fixedPresentation(); await facingOpponent();
  await shot(page, 'mobile');
  checks.push('390px mobile board and scrollable controls fit without horizontal overflow');
  assertNoErrors();
  writeFileSync(join(out, 'browser-checks.json'),JSON.stringify({url,checksPassed:checks.length,checks,errors},null,2)+'\n');
  console.log(JSON.stringify({checksPassed:checks.length,checks,errors},null,2));
} catch(e) {
  await shot(page, 'failure');
  console.error({completed:checks,errors});throw e;
} finally { await browser.close(); }
