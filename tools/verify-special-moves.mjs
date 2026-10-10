// The special moves through the real board, with a mouse and by touch: the Ogre's capture or push,
// the Guard push, the Beast's capture chain and the Maester's swaps.
// Run: npm run check:browser special-moves (screenshots and browser-checks.json go to PLAYABLE_OUT).
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { contextText, endTurn, lanMoves } from './app-ui.mjs';
import { assertNoErrors, env, launch, shot, trapErrors } from './lib/checks.mjs';
const out = env('PLAYABLE_OUT');
mkdirSync(out, { recursive: true });
const browser = await launch();
const checks = [];
try {
  for (const mobile of [false, true]) {
    const page = await browser.newPage({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 }, hasTouch: mobile });
    await page.addInitScript(() => sessionStorage.setItem('kingdown.title-seen', '1')); // skip the title screen (main.ts)
    await page.addInitScript(() => localStorage.setItem('kingdown.look', 'clay')); // painted is the default look
    trapErrors(page);
    const url = env('PLAYABLE_URL');
    await page.goto(url);
    async function seed(fen) {
      await page.evaluate(fen => localStorage.setItem('kingdown.save', JSON.stringify({ fen, back: '', moves: [], white: 'human', black: 'human', sound: false })), fen);
      await page.goto(url); await page.waitForFunction(() => window.view?.pieces.size > 0);
      await page.evaluate(() => window.view.ready());
    }
    async function tap(sq) {
      const p = await page.evaluate(s => window.view.screenOf(s), sq);
      if (mobile) await page.touchscreen.tap(p.x, p.y); else await page.mouse.click(p.x, p.y);
    }
    async function button(id) {
      if (mobile) await page.locator(id).tap(); else await page.click(id);
    }
    const played = n => page.waitForFunction(n => JSON.parse(localStorage.getItem('kingdown.save')).moves.length === n, n);
    const ogre = '7k/8/8/2p5/2O5/8/P7/K7 w - - 0 1';
    await seed(ogre);
    const bounds = await page.locator('#board').boundingBox();
    await tap(26); assert.match(await contextText(page), /Can shove a neighbour/);

    await tap(34); await page.locator('#move-choice').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#move-choice-title').innerText(), 'Take or shove?');
    assert.equal(await page.locator('#choose-capture').innerText(), 'Take on c5');
    assert.equal(await page.locator('#choose-push').innerText(), 'Shove to c6');
    assert.equal(await page.locator('#move-choice .primary').count(), 1);
    assert.deepEqual(await lanMoves(page), []);
    assert.match(await page.locator('#move-choice-detail').innerText(), /c5.*c6/);
    await shot(page, `${mobile ? 'mobile' : 'desktop'}-choice`);
    await button('#cancel-choice'); await played(0);
    assert.equal(await page.locator('#move-choice').isVisible(), false);
    await tap(26); await tap(34); await button('#choose-push'); await played(1);
    assert.match((await lanMoves(page)).join(' '), /Oc4>c5-c6/);
    assert.ok(await page.evaluate(() => window.view.pieces.has(42) && window.view.pieces.has(34) && !window.view.pieces.has(26)));
    await button('#undo'); await played(0);
    await tap(26); await tap(34); await button('#choose-capture'); await played(1);
    assert.match((await lanMoves(page)).join(' '), /Oc4xc5/);
    assert.equal(await page.evaluate(() => window.view.pieces.has(42)), false);
    assert.deepEqual(await page.locator('#board').boundingBox(), bounds);
    checks.push(`${mobile ? 'touch' : 'mouse'}: capture/push chooser, cancel, both outcomes, undo and stable board`);

    await seed('7k/8/8/2g5/2O5/8/P7/K7 w - - 0 1');
    await tap(26); await tap(34); await played(1);
    assert.equal(await page.locator('#move-choice').isVisible(), false);
    assert.match((await lanMoves(page)).join(' '), /Oc4>c5-c6/);
    checks.push(`${mobile ? 'touch' : 'mouse'}: Guard push needs no ambiguous choice`);

    const beast = '7k/8/5p2/3pp3/2nS4/8/8/K7 w - - 0 1';
    await seed(beast); await tap(27); await tap(26);
    assert.match(await contextText(page), /Bite again/);
    assert.match(await contextText(page), /Nothing moves until you stop\./);
    assert.match(await page.locator('#stop-chain').innerText(), /1 bite/);
    assert.deepEqual(await lanMoves(page), []);
    await page.keyboard.press('Escape'); await played(0);
    await tap(27); await tap(26); await button('#stop-chain'); await played(1);
    assert.match((await lanMoves(page)).join(' '), /Sd4xc4/);
    await button('#undo'); await played(0);
    await tap(27); await tap(26); await tap(35); await button('#stop-chain'); await played(1);
    assert.match((await lanMoves(page)).join(' '), /Sd4xc4xd5/);
    checks.push(`${mobile ? 'touch' : 'mouse'}: Beast cancel, finish after one, and continue then finish`);

    await seed('7k/8/8/8/8/8/P7/MN5K w - - 0 1');
    await tap(0); assert.match(await contextText(page), /Swaps places with a friendly piece/);
    await tap(1); await played(1); assert.match((await lanMoves(page)).join(' '), /Ma1<>b1/);
    await button('#undo'); await played(0);
    await tap(0); await tap(7); await played(1); assert.match((await lanMoves(page)).join(' '), /Ma1<>h1/);
    checks.push(`${mobile ? 'touch' : 'mouse'}: Maester friendly swap and home-rank king swap`);
    if (!mobile) {
      await seed(ogre); await tap(26); await tap(34); await page.keyboard.press('Escape');
      assert.equal(await page.locator('#move-choice').isVisible(), false); await played(0);
      await tap(26); await page.keyboard.down('Shift'); await tap(34); await page.keyboard.up('Shift'); await played(1);
      assert.match((await lanMoves(page)).join(' '), /Oc4>c5-c6/);
      checks.push('keyboard: Escape cancels and Shift-click remains a push shortcut');
      await seed('7k/8/3o4/2p5/2O5/8/P7/K7 w - - 0 1');
      await tap(26); await tap(34); await button('#choose-capture'); await played(1);
      await endTurn(page);
      await tap(43); await tap(34); await page.locator('#move-choice').waitFor({ state: 'visible' });
      await page.keyboard.press('z'); // no game key acts under a dialog
      assert.equal(await page.locator('#move-choice').isVisible(), true);
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('kingdown.save')).moves.length), 1);
      checks.push('Z under an open choice does nothing');
      await page.evaluate(() => document.getElementById('undo').onclick());
      assert.equal(await page.locator('#move-choice').isVisible(), true);
      assert.equal(await page.locator('#undo').getAttribute('aria-disabled'), 'true');
      await button('#cancel-choice');
      await tap(43); await tap(34); await button('#choose-capture'); await played(2);
      await button('#undo'); await played(1);
      assert.equal(await page.locator('#move-choice').isVisible(), false);
      assert.ok(await page.evaluate(() => window.view.pieces.has(34) && window.view.pieces.has(43)));
      checks.push('Undo waits for the choice and keeps the turn that was handed over');
    }
    await seed('7k/8/8/8/8/4a3/4P3/4K3 w - - 0 1');
    const haloPixels = await page.evaluate(() => {
      const view = window.view, halo = view.markers.children.find(m => m.material === view.checkHaloMat);
      const canvas = document.createElement('canvas');
      canvas.width = view.renderer.domElement.width; canvas.height = view.renderer.domElement.height;
      const ctx = canvas.getContext('2d');
      const lightPixels = () => {
        view.composer.render(); ctx.drawImage(view.renderer.domElement, 0, 0);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let light = 0;
        for (let i = 0; i < data.length; i += 4) if (data[i] > 200 && data[i + 1] > 190 && data[i + 2] > 160) light++;
        return light;
      };
      const shown = lightPixels(); halo.visible = false;
      const hidden = lightPixels(); halo.visible = true; view.composer.render();
      return shown - hidden;
    });
    assert.ok(haloPixels > 20, `${mobile ? 'phone' : 'desktop'}: the check halo draws above the stone (${haloPixels} light pixels)`);
    checks.push(`${mobile ? 'touch' : 'mouse'}: the 3D check halo is visible`);
    await page.close();
  }
  assertNoErrors();
  writeFileSync(join(out, 'browser-checks.json'), JSON.stringify({ checksPassed: checks.length, checks, errors: [] }, null, 2) + '\n');
  console.log(JSON.stringify({ checksPassed: checks.length, checks, errors: [] }, null, 2));
} finally { await browser.close(); }
