import assert from 'node:assert/strict';
import { launch, env, shot, trapErrors, assertNoErrors } from './lib/checks.mjs';
const base = env('PLAYABLE_URL'), browser = await launch();
try {
  for (const [width,height] of [[393,852],[1280,800]]) {
    const page = await browser.newPage({viewport:{width,height},hasTouch:true});
    trapErrors(page); page.setDefaultTimeout(15000);
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.goto(base);
    const frame = page.frameLocator('iframe');
    await frame.locator('#home-play:not(:disabled)').waitFor();
    await page.evaluate(()=>window.harnessSetContext({displayMode:'fullscreen',safeAreaInsets:{top:0,right:0,bottom:0,left:0}}));
    const settle = async () => {
      await frame.locator('#board[aria-busy="false"]:not([data-animating="true"])').waitFor();
      await frame.locator('canvas').evaluate(c=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    };
    const pick = async sq => {
      await settle(); const box=await frame.locator('canvas').boundingBox(); assert(box);
      const x=box.x+(32+((sq&7)+.5)*112)*box.width/960,y=box.y+(96+(7-(sq>>3)+.5)*112)*box.width/960;
      if(width===393) await page.touchscreen.tap(x,y); else await page.mouse.click(x,y);
    };
    for (const [from,target] of [[0,6],[6,0]]) {
      const fen='4k3/8/8/8/8/8/P7/RNB1K1N1 w - - 0 1';
      const seeded=await (await page.request.post(new URL(`/fixture-position?case=skylift&fen=${encodeURIComponent(fen)}`,base).href)).json();
      assert(!seeded.isError,JSON.stringify(seeded));
      await page.evaluate(result=>window.harnessShow(result),seeded);
      await frame.locator('#status').filter({hasText:'Your move'}).waitFor(); await settle();
      const arm = async () => {
        await frame.locator('#card-w-0').click();
        await frame.locator('#board-sheet').getByRole('button',{name:'Use',exact:true}).click();
      };
      await arm(); await pick(from); await settle();
      await shot(page,`skylift-source-${from}-${width}`);
      // The accessible move list and the canvas use the same oriented legal choices.
      assert.equal(await frame.locator('#choices button[title="!K:a1<>g1"]').count(),1);
      await pick(target);
      assert.equal(await frame.locator('#status').textContent(),'Select again to swap.');
      assert.equal(await frame.locator('#undo').getAttribute('aria-disabled'),'true');
      await pick(target); await settle();
      assert.equal(await frame.locator('#undo').getAttribute('aria-disabled'),'false');
      assert.equal(await page.evaluate(()=>window.harnessView.revision),seeded._meta.view.revision);
      await frame.locator('#undo').click();
      assert.equal(await frame.locator('#undo').getAttribute('aria-disabled'),'true');
      await arm(); await pick(from); await pick(target); await pick(target); await settle();
      await frame.locator('#end-turn[aria-disabled="false"]').click();
      await page.waitForFunction(id=>window.harnessCalls.some(c=>c.name==='kingdown_move'&&c.arguments.game_id===id),seeded._meta.view.game_id);
      assert.equal(await page.evaluate(id=>window.harnessCalls.filter(c=>c.name==='kingdown_move'&&c.arguments.game_id===id&&c.arguments.actions?.[0]==='!K:a1<>g1').length,seeded._meta.view.game_id),1,'Both orders send one canonical action');
      console.log(`PASS Sky Lift ${from}->${target}, ${width}px: choices, held confirmation, Undo, canonical Send`);
    }
    await page.close();
  }
  assertNoErrors();
} finally { await browser.close(); }
