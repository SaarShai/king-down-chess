// Focused local study check. Run with: node --import tsx <this file>
import assert from 'node:assert/strict';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { SHARED_MECHANICS, assertMechanicExpected } from '../../../../../tools/fixtures/shared-mechanics.ts';
import { GameRules } from '../../../../../src/game-rules.ts';
import { toFen } from '../../../../../src/rules/setup.ts';

const root = fileURLToPath(new URL('../../../../../', import.meta.url));
const out = process.env.PLAYABLE_OUT || '/tmp/effects-ui-objects';
mkdirSync(out, { recursive: true });
const fixture = JSON.parse(readFileSync(new URL('./card-fixture.json', import.meta.url)));
assert.deepEqual(fixture, SHARED_MECHANICS.find(f => f.id === 'card-freeze'), 'The browser fixture matches the source');
const context = new GameRules({ hands: [fixture.setup.hand, fixture.setup.hand] });
let pos = context.fromFen(fixture.setup.fen);
for (const action of fixture.actions) {
  const moves = context.legalMoves(pos).filter(move => context.toLan(pos, move) === action);
  assert.equal(moves.length, 1, 'One legal cast'); pos = context.makeMove(pos, moves[0]);
}
assertMechanicExpected({ fen: toFen(pos), rules: context.rules, turn: pos.turn, legal: context.legalMoves(pos).map(move => context.toLan(pos, move)) }, fixture.expected, 'Freeze coin');

// A saved pre-change GUI can prove that the new CSS leaves every accepted frame intact.
const plugins = process.env.GUI_BASELINE_DIR ? [{name:'accepted-gui-baseline',configureServer(server) {
  server.middlewares.use((request,response,next)=>{
    const file = request.url?.split('?')[0].match(/^\/__gui-baseline\/(index.html|main.js|samples.js|style.css)$/)?.[1];
    if (!file) return next();
    response.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');
    response.end(readFileSync(join(process.env.GUI_BASELINE_DIR,file)));
  });
}}] : [];
const server = await createServer({ root, plugins, configFile:false, logLevel:'error', server:{host:'127.0.0.1',port:0,hmr:false} });
await server.listen();
const browser = await chromium.launch({ headless:true });
const errors = [], report = { fixture:'card-freeze: all expected results match', samples:[], frames:0, checks:[] };
const watch = page => {
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  page.on('request', request => assert.equal(request.method(), 'GET', 'Samples send no writes'));
};
try {
  const page = await browser.newPage({viewport:{width:1280,height:720}}); watch(page);
  await page.addInitScript(()=>{
    window.previewSideEffects=[];
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>{window.previewSideEffects.push('clipboard');return Promise.resolve();}}});
    Object.defineProperty(navigator,'share',{configurable:true,value:()=>{window.previewSideEffects.push('share');return Promise.resolve();}});
  });
  const base = `${server.resolvedUrls.local[0]}docs/specs/effects-animation/preview/gui/`;
  await page.goto(`${base}?sample=coin-spend`);
  await page.waitForFunction(() => window.effectsStudy?.ready || window.effectsStudy?.error);
  assert.equal(await page.evaluate(() => window.effectsStudy.error), undefined);
  assert.equal(await page.evaluate(() => window.effectsStudy.getState().id), 'coin-spend', 'Query chooses the sample');
  const samples = await page.evaluate(() => window.effectsStudy.samples);
  assert.equal(new Set(samples.map(s=>s.id)).size, samples.length);
  const added = samples.filter(s=>s.group === 'Interface objects');
  assert(added.length >= 2 && added.length <= 6);
  assert.equal(samples.length, 18 + added.length, 'Accepted samples stay present');
  for (const sample of added) {
    report.samples.push({id:sample.id,duration:sample.duration});
    for (const viewport of [{width:1280,height:720},{width:390,height:844}]) {
      await page.setViewportSize(viewport);
      await page.evaluate(id => window.effectsStudy.select(id),sample.id);
      const states = new Map();
      for (const progress of [0,.18,.35,.55,.72,1,.35,0,1]) {
        await page.evaluate(p=>window.effectsStudy.seek(p),progress);
        const state = await page.evaluate(()=>({ ...window.effectsStudy.getState(), html:document.querySelector('#scene').innerHTML }));
        assert.equal(state.playing,false); assert(Math.abs(state.progress-progress)<.001);
        if (states.has(progress)) assert.equal(state.html,states.get(progress),`${sample.id}: deterministic reverse seek`);
        states.set(progress,state.html); report.frames++;
        const layout = await page.evaluate(()=>{
          const scene=document.querySelector('#scene').getBoundingClientRect();
          const visible=[...document.querySelectorAll('.object-study button,.object-study h2,.object-study .obj-status')].map(el=>({text:el.textContent,rect:el.getBoundingClientRect().toJSON()}));
          const transport=document.querySelector('.transport').getBoundingClientRect();
          const frame=document.querySelector('.game-frame').getBoundingClientRect();
          return {scene:scene.toJSON(),visible,transport:transport.toJSON(),frame:frame.toJSON(),width:document.documentElement.scrollWidth};
        });
        assert(layout.width<=viewport.width,`${sample.id}: no overflow at ${viewport.width}`);
        for(const item of layout.visible) assert(item.rect.top>=layout.scene.top-1 && item.rect.bottom<=layout.scene.bottom+1,`${sample.id}: visible ${item.text}`);
        if(viewport.width===1280) assert(layout.transport.bottom<=720,`${sample.id}: desktop controls visible`);
        else assert(layout.transport.bottom<layout.frame.top,`${sample.id}: phone controls above stage`);
      }
      await page.evaluate(()=>window.effectsStudy.seek(.35));
      await page.screenshot({path:join(out,`${sample.id}-${viewport.width}-action.png`),fullPage:true});
      await page.evaluate(()=>window.effectsStudy.seek(1));
      await page.screenshot({path:join(out,`${sample.id}-${viewport.width}-result.png`),fullPage:true});
    }
    await page.locator('#reduce').check();
    assert.deepEqual(await page.evaluate(()=>[window.effectsStudy.getState().progress,window.effectsStudy.getState().playing]),[1,false]);
    await page.evaluate(()=>window.effectsStudy.seek(.2));
    assert.equal(await page.evaluate(()=>window.effectsStudy.getState().progress),1);
    assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length),0,'No separate effect clock');
    await page.locator('#reduce').uncheck();
  }
  await page.setViewportSize({width:1280,height:720});
  const baseline=process.env.GUI_BASELINE_DIR ? await browser.newPage({viewport:{width:1280,height:720}}) : null;
  if(baseline) {
    watch(baseline); await baseline.goto(`${server.resolvedUrls.local[0]}__gui-baseline/index.html`);
    await baseline.waitForFunction(()=>window.effectsStudy?.ready);
  }
  for (const sample of samples.filter(s=>s.group!=='Interface objects')) {
    for(const progress of baseline ? [0,.45,1] : [.5]) {
      await page.evaluate(({id,progress})=>{window.effectsStudy.select(id);window.effectsStudy.seek(progress);},{id:sample.id,progress});
      if(baseline) {
        await baseline.evaluate(({id,progress})=>{window.effectsStudy.select(id);window.effectsStudy.seek(progress);},{id:sample.id,progress});
        assert((await page.locator('#scene').screenshot()).equals(await baseline.locator('#scene').screenshot()),`${sample.id}: accepted stage is pixel-identical at ${progress}`);
      }
      report.frames++;
    }
  }
  if(baseline) { await baseline.close(); report.checks.push('54 accepted stage PNGs match the saved baseline exactly'); }
  await page.evaluate(()=>{window.effectsStudy.select('coin-spend');window.effectsStudy.seek(.2);});
  await page.locator('#replay').click();
  await page.waitForFunction(()=>window.effectsStudy.getState().progress>.08);
  await page.locator('#play').click();
  const paused=await page.evaluate(()=>window.effectsStudy.getState().progress);
  await page.waitForTimeout(130);
  assert.equal(await page.evaluate(()=>window.effectsStudy.getState().progress),paused);
  await page.locator('#speed').selectOption('2');
  await page.locator('#play').click();
  await page.waitForFunction(()=>window.effectsStudy.getState().progress>.4);
  await page.locator('#play').click();
  await page.locator('#scrub').fill('500');
  assert.equal(await page.evaluate(()=>window.effectsStudy.getState().progress),.5);
  await page.locator('h1').click(); await page.keyboard.press('ArrowLeft');
  assert.equal(await page.evaluate(()=>window.effectsStudy.getState().progress),.45);
  await page.keyboard.press('Space');
  await page.waitForFunction(()=>window.effectsStudy.getState().playing);
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForFunction(()=>document.querySelector('#reduce').checked);
  assert.deepEqual(await page.evaluate(()=>[window.effectsStudy.getState().progress,window.effectsStudy.getState().playing]),[1,false]);
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.evaluate(()=>{window.effectsStudy.select('draw-reply');window.effectsStudy.seek(.4);});
  await page.locator('#play').click();
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  assert.equal(await page.evaluate(()=>window.effectsStudy.getState().playing),false,'Hidden page pauses');
  report.checks.push('query links','all assets decode','all 18 accepted IDs render','deterministic forward and reverse seek','pause/replay','speed','range input','keyboard','manual/OS reduced motion','hidden page pause','390 px controls above stage','1280 × 720 controls in view','GET requests only');
  const phone = await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  const touch = await phone.newPage(); watch(touch);
  await touch.goto(`${base}?sample=draw-reply`); await touch.waitForFunction(()=>window.effectsStudy?.ready);
  await touch.evaluate(()=>window.effectsStudy.seek(0));
  await touch.locator('.obj-action').tap();
  await touch.waitForFunction(()=>window.effectsStudy.getState().progress>.12);
  await touch.locator('#play').tap();
  assert.equal(await touch.evaluate(()=>window.effectsStudy.getState().playing),false);
  await touch.locator('#sample-select').selectOption('coin-spend');
  assert.equal(await touch.evaluate(()=>window.effectsStudy.getState().id),'coin-spend');
  await phone.close();
  report.checks.push('touch action/pause/picker');
  assert.deepEqual(await page.evaluate(()=>window.previewSideEffects),[],'No clipboard or share writes');
  report.checks.push('no clipboard or share writes');
  assert.deepEqual(errors,[]);
  writeFileSync(join(out,'report.json'),JSON.stringify(report,null,2));
  console.log(`PASS: ${added.length} new samples; ${samples.length} total; ${report.frames} frame checks; fixture, assets, controls and layouts. Renders: ${out}`);
} finally { await browser.close(); await server.close(); }
