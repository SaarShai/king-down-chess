import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const out = resolve(process.argv[2] ?? '/tmp/kingdown-board-comparison');
mkdirSync(out, { recursive: true });
const url = 'http://127.0.0.1:5301/docs/specs/effects-animation/preview/comparisons/board/index.html';
const browser = await chromium.launch({ headless: true });
const failures = [], evidence = [], baseline = [];
try {
  for (const [size, viewport] of [['desktop-short', { width: 1280, height: 720 }], ['desktop', { width: 1440, height: 900 }], ['phone', { width: 390, height: 844 }]]) {
    const page = await browser.newPage({ viewport, reducedMotion: 'no-preference' });
    page.on('pageerror', error => failures.push(error.message));
    page.on('console', message => { if (message.type() === 'error') failures.push(message.text()); });
    page.on('response', response => { if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`); });
    await page.goto(url);
    await page.waitForFunction(() => window.comparisonStudy?.ready);
    await page.evaluate(() => document.fonts.ready);
    for (const sample of ['rook', 'archer']) {
      console.log(`Check ${size} ${sample}`);
      await page.selectOption('#sample', sample);
      const initial = await page.evaluate(() => window.comparisonStudy.getState());
      const legal = initial.legalFixture;
      assert.equal(legal.pieces, 32);
      assert(legal.steps.every(step => step.legal));
      assert.equal(legal.frozenCannotMove, true);
      assert(legal.freezeControl.withoutFreeze.length > 0);
      assert.equal(legal.protection.blocked, true);
      assert.deepEqual(legal.protection.withoutWard, ['f5xe4']);
      assert.deepEqual(legal.captures, ['d6']);
      assert.deepEqual(legal.shots, sample === 'archer' ? ['d6'] : []);
      assert.deepEqual(legal.last, ['a7','a6']);
      assert(initial.marks.threats.some(t => t.from === 34 && t.to === 27), 'c5 pawn threatens d4');
      const expectedMoves = sample === 'rook' ? ['a4','b4','c4','d2','d3','d5'] : ['c4','d3','d5','e3','e5'];
      assert.deepEqual([...legal.destinations].sort(), expectedMoves);
      evidence.push({ size, sample, ...legal, threats: initial.marks.threats });
      for (const variant of ['current','proposed']) {
        await page.getByRole('button', { name: variant === 'current' ? 'Current' : 'Proposed', exact: true }).click();
        const after = await page.evaluate(() => window.comparisonStudy.getState());
        assert.equal(after.variant, variant);
        assert.equal(after.playing, false);
        assert.equal(after.scene.playing, null);
        assert.deepEqual(after.board, initial.board);
        assert.deepEqual(after.bounds, initial.bounds);
        assert.equal(after.selected, initial.selected);
        await page.screenshot({ path: `${out}/${size}-${sample}-${variant}.png`, fullPage: true });
        const still = await page.locator('#board').evaluate(c => c.toDataURL());
        await page.waitForTimeout(900);
        assert.equal(await page.locator('#board').evaluate(c => c.toDataURL()), still, `${size} ${sample} ${variant} stays still`);
      }
      await page.getByRole('button', { name: 'Current', exact: true }).click();
      const comparison = await page.evaluate(async () => {
        const { PaintedView } = await import('/src/render/PaintedView.ts');
        const { samples } = await import('/docs/specs/effects-animation/preview/comparisons/board/fixtures.ts');
        const state = window.comparisonStudy.getState();
        const sample = samples.find(s => s.id === state.sample);
        const host = document.createElement('div');
        const width = Math.floor(state.bounds.width);
        host.style.cssText = `position:fixed;left:0;top:0;width:${width}px;height:${width*1024/960+2}px;z-index:999;background:#eee8d9`;
        document.body.appendChild(host);
        const view = new PaintedView(host, { floor:null, webInk:true });
        view.setPace('off');view.setRules(sample.rules);view.sync(sample.pos);view.highlight(state.marks);
        await view.ready();
        // Contact-shadow stamps load in idle time and then fade. Compare their settled hold.
        await new Promise(resolve => requestIdleCallback(resolve, { timeout:1000 }));
        await new Promise((resolve,reject) => {
          let previous = -1, quietSince = performance.now();
          const start = performance.now();
          const check = () => {
            const now = performance.now(), frames = view.scene.frames;
            if (frames !== previous) { previous = frames; quietSince = now; }
            if (now - quietSince > 300) { resolve(); return; }
            if (now - start > 5000) { reject(new Error('Production scene does not settle')); return; }
            requestAnimationFrame(check);
          };
          check();
        });
        const current = document.querySelector('#board'), actual = host.querySelector('canvas');
        const a = current.getContext('2d').getImageData(0,0,960,1024).data;
        const b = actual.getContext('2d').getImageData(0,0,960,1024).data;
        let changed = 0, max = 0;
        for(let i=0;i<a.length;i++) { const delta=Math.abs(a[i]-b[i]);if(delta)changed++;max=Math.max(max,delta); }
        const result = { changedChannels:changed,maxDelta:max,currentSize:[current.width,current.height],actualSize:[actual.width,actual.height],actualBounds:actual.getBoundingClientRect().toJSON(),actualImage:actual.toDataURL() };
        view.dispose();host.remove();return result;
      });
      writeFileSync(`${out}/${size}-${sample}-production-baseline.png`, Buffer.from(comparison.actualImage.split(',')[1],'base64'));
      delete comparison.actualImage;
      baseline.push({ size, sample, ...comparison });
      console.log(JSON.stringify({size,sample,...comparison}));
      assert.equal(comparison.changedChannels, 0, `${size} ${sample}: matches real PaintedView`);
    }
    await page.selectOption('#selection', '18');
    let state = await page.evaluate(() => window.comparisonStudy.getState());
    assert.equal(state.selectedSquare, 'c3');
    assert.equal(state.legalFixture.legalMoves.length, 0);
    assert.match(await page.locator('#detail').innerText(), /frozen/);
    await page.selectOption('#selection', '21');
    await page.locator('#board').focus();
    await page.keyboard.press('ArrowLeft');await page.keyboard.press('Enter');
    state = await page.evaluate(() => window.comparisonStudy.getState());
    assert.equal(state.selectedSquare,'f3', 'empty e3 does not change selection');
    await page.keyboard.press('ArrowLeft');await page.keyboard.press('ArrowLeft');await page.keyboard.press('Enter');
    assert.equal((await page.evaluate(() => window.comparisonStudy.getState())).selectedSquare,'c3');
    await page.keyboard.press('f');
    assert.equal((await page.evaluate(() => window.comparisonStudy.getState())).flipped,true);
    await page.getByRole('button',{name:'Flip board'}).click();
    assert.equal((await page.evaluate(() => window.comparisonStudy.getState())).flipped,false);
    await page.locator('#current').focus();await page.keyboard.press('Enter');
    assert.equal((await page.evaluate(() => window.comparisonStudy.getState())).variant,'current');
    await page.keyboard.press('Tab');await page.keyboard.press('Enter');
    assert.equal((await page.evaluate(() => window.comparisonStudy.getState())).variant,'proposed');
    await page.emulateMedia({ reducedMotion:'reduce' });
    assert.equal((await page.evaluate(() => window.comparisonStudy.getState())).reduced,true);
    assert.equal((await page.evaluate(() => window.comparisonStudy.getState())).playing,false);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    const visible = await page.evaluate(() => ['board','detail','current','proposed','sample','flip','key'].every(id => {const r=document.getElementById(id).getBoundingClientRect();return r.top>=0 && r.bottom<=innerHeight;}));
    assert(visible, `${size}: board, readout and controls fit viewport`);
    await page.close();
  }
  assert.deepEqual(failures, []);
  writeFileSync(`${out}/legal-evidence.json`, JSON.stringify(evidence,null,2)+'\n');
  writeFileSync(`${out}/verification.json`, JSON.stringify({ passed:true, errors:failures, baseline, checks:['32 pieces in both samples','engine move/target equality','freeze and ward counterfactual controls','current equals real PaintedView pixels','same bounds, board and selected square across toggle','12 still-image checks over 900 ms','1280x720, 1440x900 and 390x844','keyboard controls, inspect and flip','reduced motion','no horizontal overflow','controls and readout visible','zero browser errors'] },null,2)+'\n');
  console.log(JSON.stringify({ passed:true, baseline, screenshots:12, errors:failures.length, out }));
} finally { await browser.close(); }
