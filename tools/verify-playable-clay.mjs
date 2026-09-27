/** End-to-end checks against the running built game; no simulated balance games. */
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
const url = process.env.PLAYABLE_URL || 'http://127.0.0.1:5188/';
const out = process.env.PLAYABLE_OUT || 'docs/playable-clay'; mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: process.env.PLAYABLE_BROWSER });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.addInitScript(() => localStorage.setItem('kingdown.look', 'clay')); // painted is the default look
const errors = [], checks = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
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
  await page.waitForFunction(({sq,code}) => {
    const g = window.view.pieces.get(sq);
    return g?.userData.code === code && Math.abs(g.position.x - (sq % 8 - 3.5)) < .001 && Math.abs(g.position.z - (3.5 - Math.floor(sq / 8))) < .001 && !document.querySelector('#status').textContent.includes('thinking');
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
  await page.selectOption('#black', 'human'); await page.click('#new-classic'); await ready();
  assert.deepEqual(await page.evaluate(()=>Array.from({length:8},(_,i)=>{const sq=8+i,p=window.view.screenOf(sq);return window.view.pick({clientX:p.x,clientY:p.y});})),[8,9,10,11,12,13,14,15]);
  checks.push('every initial pawn-square centre selects its own pawn, not the back rank');
  await clickSquare(1); await clickSquare(18);
  await page.waitForFunction(()=>window.view.pieces.get(1)?.position.y>.1);
  await settled(18,2); await page.click('#undo'); await settled(1,2);
  checks.push('the clay knight retains its leap and returns to its rest pose');
  await clickSquare(12); await clickSquare(28); await settled(28, 1);
  assert.match(await page.locator('#moves').innerText(), /e2-e4/);
  checks.push('real board picking and a completed pawn walk');
  await page.evaluate(() => {
    const save = JSON.parse(localStorage.getItem('kingdown.save'));
    save.style = 'plasticine'; localStorage.setItem('kingdown.save', JSON.stringify(save));
  });
  await page.reload(); await ready(); await fixedPresentation();
  assert.match(await page.locator('#moves').innerText(), /e2-e4/);
  await page.goto(url+'?style=voxel&px=6'); await ready(); await fixedPresentation();
  assert.match(await page.locator('#moves').innerText(), /e2-e4/);
  checks.push('legacy saved styles and URL style/pixel overrides cannot change the fixed presentation');
  await page.click('#undo'); await settled(12,1);
  assert.equal(await page.locator('#moves').innerText(), '');
  checks.push('save/reload and undo restore the position');
  await page.selectOption('#black', 'ai');
  await page.locator('#think').fill('200');
  await clickSquare(12); await clickSquare(28);
  await page.waitForFunction(() => document.querySelector('#moves').textContent.trim().split(/\s+/).length >= 3 && document.querySelector('#turn').textContent.includes('White'));
  await page.waitForFunction(() => document.querySelector('#status').textContent === '');
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('kingdown.save')).moves.length >= 2);
  checks.push('human move receives a legal worker-AI reply');
  await page.selectOption('#black', 'human');
  await page.selectOption('#setup-example', 'SQBKRSML'); await ready();
  assert.equal(await page.locator('#setup').textContent(),'SQBKRSML');
  const pawnSquares = [...Array(8)].flatMap((_, i) => [8+i, 48+i]);
  assert.deepEqual(await page.evaluate(squares => squares.map(sq => {
    const p = window.view.screenOf(sq); return window.view.pick({clientX:p.x,clientY:p.y});
  }), pawnSquares), pawnSquares, 'resized pieces must not intercept neighbouring pawn-square centres');
  await fixedPresentation(); await facingOpponent();
  checks.push('optional mirrored setup keeps the fixed handmade material and opponent-facing armies');
  await page.click('#rules-btn');
  assert.match(await page.locator('#rules-rows tr').filter({hasText:'A Archer'}).textContent(), /forward diagonal at distance 2/);
  assert.match(await page.locator('#rules-rows tr').filter({hasText:'S Beast'}).textContent(), /Takes on any adjacent square/);
  await page.locator('#rules button').click();
  checks.push('piece guide describes the current Archer and Beast rules');
  // Interrupt the shove: a delayed animation must not change the restored position.
  await page.selectOption('#setup-example','ogre'); await ready();
  await clickSquare(26); await clickSquare(27);
  await page.waitForFunction(()=>document.querySelector('#moves').textContent.includes('Oc4>d4-e4'));
  await page.click('#undo'); await settled(27,1);
  await page.waitForTimeout(1800);
  assert.equal(await page.evaluate(()=>window.view.pieces.has(28)),false);
  assert.equal(await page.evaluate(()=>window.view.pieces.size),5);
  checks.push('undo during the Ogre shove cancels delayed movement');
  await clickSquare(26); await clickSquare(27); await settled(28,1);
  assert.match(await page.locator('#moves').textContent(),/Oc4>d4-e4/);
  checks.push('Ogre shove animation completes with the pawn on its legal square');
  // A legal rook capture also exercises figure disposal and contour membership.
  await page.goto(url+'?fen='+encodeURIComponent('7k/8/8/8/8/p7/8/R6K w - - 0 1')); await ready();
  await page.selectOption('#black','human'); await clickSquare(0); await clickSquare(16); await settled(16,4);
  assert.equal(await page.evaluate(()=>window.view.pieces.size),3);
  assert.match(await page.locator('#moves').textContent(),/Ra1xa3/);
  await page.click('#undo'); await ready();
  assert.equal(await page.evaluate(()=>window.view.pieces.size),4);
  checks.push('capture disposes the victim, and undo restores its model');
  await page.click('#new-classic'); await ready();
  await clickSquare(12); await clickSquare(28);
  await page.click('#new-random'); await ready(); await page.waitForTimeout(1000);
  assert.equal(await page.evaluate(()=>window.view.pieces.size),32);
  assert.equal(await page.locator('#moves').innerText(),'');
  checks.push('new game during a walk prevents stale animation from changing the new board');
  await page.selectOption('#setup-example', 'SQBKRSML'); await ready();
  await page.screenshot({path:out+'/desktop.png'});
  await page.setViewportSize({width:390,height:844}); await page.waitForTimeout(300);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  const panel=await page.locator('#panel').boundingBox();assert.ok(panel.width<=390 && panel.y>200 && panel.y<600);
  const header=await page.locator('#top').boundingBox(), board=await page.locator('#board').boundingBox();
  assert.ok(board.y>=header.y+header.height-1, 'mobile header must not cover the back rank');
  await fixedPresentation(); await facingOpponent();
  await page.screenshot({path:out+'/mobile.png'});
  checks.push('390px mobile board and scrollable controls fit without horizontal overflow');
  assert.deepEqual(errors,[]);
  writeFileSync(out+'/browser-checks.json',JSON.stringify({url,checksPassed:checks.length,checks,errors},null,2)+'\n');
  console.log(JSON.stringify({checksPassed:checks.length,checks,errors},null,2));
} catch(e) {
  await page.screenshot({path:out+'/failure.png'});
  console.error({completed:checks,errors});throw e;
} finally { await browser.close(); }
