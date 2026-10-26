// The preview's real canvas supplies evidence; the game is not changed.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createServer } from 'vite';
import { launch, trapErrors, assertNoErrors, noSidewaysScroll, shot, env } from '../../../tools/lib/checks.mjs';
import { available } from './preview/card-art/availability.js';

const server = await createServer({ root:resolve('.'), logLevel:'error', server:{ host:'127.0.0.1', port:0, hmr:false } });
await server.listen();
const url = `${server.resolvedUrls.local[0]}docs/specs/effects-animation/preview/card-art/index.html`;
const browser = await launch();
const out = env('PLAYABLE_OUT');
mkdirSync(out,{recursive:true});
const report = [];
const settle = page => page.evaluate(async () => {
  await document.fonts.ready;
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
});
try {
  const page = await browser.newPage({ viewport:{width:1280,height:720}, reducedMotion:'no-preference' });
  const errors = trapErrors(page);
  page.on('response', response => { if (response.status() >= 400) errors.push(`HTTP ${response.status()} ${response.url()}`); });
  await page.goto(url);
  await page.waitForFunction(() => window.cardArtStudy?.getState().ready);
  for (const sample of available) {
    await page.locator(`#choose-${sample}`).click();
    await page.waitForFunction(id => window.cardArtStudy.getState().ready && window.cardArtStudy.getState().sample === id, sample);
    if (sample === 'mimic') assert.equal((await page.evaluate(() => window.cardArtStudy.getState())).mode,'idle','Mimic opens in the owner-selected gentle loop');
    await page.evaluate(() => window.cardArtStudy.seek(.35));
    const contract = await page.evaluate(async id => {
      const image = new Image(); image.src = `/ui/cards/${id}.webp`; await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512;
      const c = canvas.getContext('2d');
      c.drawImage(image,0,0,512,512);
      const original = canvas.toDataURL();
      const originalPixels = c.getImageData(0,0,512,512).data;
      const originalDelta = async encoded => {
        const rendered = new Image(); rendered.src = encoded; await rendered.decode();
        c.clearRect(0,0,512,512); c.drawImage(rendered,0,0);
        const pixels = c.getImageData(0,0,512,512).data;
        let max = 0;
        for (let i=0;i<pixels.length;i++) max = Math.max(max,Math.abs(pixels[i]-originalPixels[i]));
        return max;
      };
      const api = window.cardArtStudy;
      api.setVariant('original');
      const exactOriginal = api.frame() === original;
      api.setVariant('animated'); api.setMode('idle'); api.seek(.35);
      const first = api.frame(); api.seek(.75); const later = api.frame(); api.seek(.35);
      const deterministic = api.frame() === first;
      api.seek(0); const start = api.frame(); api.seek(1);
      const loopMatches = api.frame() === start;
      api.setMode('awaken'); api.seek(0); const awakenStart = api.frame(); api.seek(1);
      // Cached source canvases can round colour channels by one or two levels.
      const settledDelta = Math.max(await originalDelta(awakenStart),await originalDelta(api.frame()));
      const settledAwakening = settledDelta <= 2;
      const {createEffect} = await import(`/docs/specs/effects-animation/preview/card-art/${id}/effect.js`);
      const renderer = createEffect(image);
      const faults = [];
      const monitored = new Proxy(c, {
        get(target,key) {
          const value = Reflect.get(target,key,target);
          if (typeof value !== 'function') return value;
          return (...args) => {
            if (args.some(arg => typeof arg === 'number' && !Number.isFinite(arg))) faults.push(`Non-finite ${String(key)}`);
            return value.apply(target,args);
          };
        },
        set(target,key,value) {
          if (key === 'globalAlpha' && (!Number.isFinite(value) || value < 0 || value > 1)) faults.push(`Alpha ${value}`);
          return Reflect.set(target,key,value,target);
        },
      });
      for (const mode of ['idle','awaken']) for (const time of [0,.2,.8,1.6,2.7,3.2,4,7.99,8]) {
        c.clearRect(0,0,512,512); c.globalAlpha = .61; c.globalCompositeOperation = 'source-over';
        const priorAlpha = c.globalAlpha;
        renderer.draw(monitored,{time,mode,reduced:false});
        if (c.globalAlpha !== priorAlpha || c.globalCompositeOperation !== 'source-over' || !c.getTransform().isIdentity) faults.push('Canvas state leak');
      }
      c.globalAlpha = 1; c.clearRect(0,0,512,512);
      renderer.draw(c,{time:1.2,mode:'awaken',reduced:true}); const reduced = canvas.toDataURL();
      c.clearRect(0,0,512,512); renderer.draw(c,{time:6.2,mode:'idle',reduced:true});
      const stableReduced = reduced === canvas.toDataURL();
      const reducedDelta = await originalDelta(reduced);
      return { exactOriginal, deterministic, changed:first !== later && first !== original, loopMatches, settledAwakening, originalReduced:reducedDelta <= 2, stableReduced, settledDelta, reducedDelta, faults };
    },sample);
    for (const key of ['exactOriginal','deterministic','changed','loopMatches','settledAwakening','originalReduced','stableReduced']) assert.equal(contract[key],true,`${sample}: ${key}`);
    assert.deepEqual(contract.faults,[],`${sample}: finite drawing and canvas state`);
    for (const [width,height] of [[1280,720],[390,844]]) {
      await page.setViewportSize({width,height});
      for (const [mode,progress] of [['idle',.35],['awaken',.24],['awaken',.5],['awaken',1]]) {
        await page.evaluate(({mode,progress}) => { window.cardArtStudy.setMode(mode); window.cardArtStudy.setVariant('animated'); window.cardArtStudy.seek(progress); },{mode,progress});
        await settle(page); await noSidewaysScroll(page);
        await shot(page,`${sample}-${mode}-${progress}-${width}`,{fullPage:true});
      }
      const sizes = await page.evaluate(() => {
        const size = id => { const r=document.getElementById(id).getBoundingClientRect(); return {width:r.width,height:r.height,bottom:r.bottom}; };
        return { art:size('art'), crop:size('crop'), desktop:size('coin-desktop'), touch:size('coin-touch') };
      });
      assert(Math.abs(sizes.crop.width/sizes.crop.height-16/9)<.01,`${sample}: real crop`);
      assert.equal(sizes.desktop.width,34); assert.equal(sizes.touch.width,44);
      if (width===1280) assert(sizes.art.bottom<=720,`${sample}: full art visible on short desktop`);
    }
    report.push({sample,contract,viewports:[1280,390],captures:8});
  }
  await page.setViewportSize({width:1280,height:720});
  await page.locator('#idle').click();
  await page.waitForFunction(() => window.cardArtStudy.getState().time>.05);
  await page.locator('#play').click();
  assert.equal((await page.evaluate(() => window.cardArtStudy.getState())).playing,false,'pause works');
  await page.locator('#awaken').click();
  await page.evaluate(() => window.cardArtStudy.seek(.995));
  await page.locator('#play').click();
  await page.waitForFunction(() => { const s=window.cardArtStudy.getState(); return !s.playing && s.progress===1; });
  await page.locator('#reduced').check();
  for (const sample of available) {
    await page.locator(`#choose-${sample}`).click();
    await page.waitForFunction(id => window.cardArtStudy.getState().ready && window.cardArtStudy.getState().sample===id,sample);
    assert.equal((await page.evaluate(() => window.cardArtStudy.getState())).playing,false,'reduced selection stays still');
    assert.equal(await page.locator('#play').isDisabled(),true);
  }
  await page.locator('#reduced').uncheck();
  await page.locator('#idle').click();
  await page.evaluate(() => { Object.defineProperty(document,'hidden',{configurable:true,value:true}); document.dispatchEvent(new Event('visibilitychange')); });
  assert.equal((await page.evaluate(() => window.cardArtStudy.getState())).playing,false,'hidden event stops playback');
  await page.evaluate(() => { delete document.hidden; const spacer=document.createElement('div'); spacer.id='check-spacer'; spacer.style.height='2000px'; document.body.append(spacer); });
  await page.locator('#idle').click();
  await page.evaluate(() => window.scrollTo(0,document.body.scrollHeight));
  await page.waitForFunction(() => !window.cardArtStudy.getState().playing);
  await page.evaluate(() => { document.getElementById('check-spacer').remove(); window.scrollTo(0,0); });
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForFunction(() => window.cardArtStudy.getState().reduced);
  assert.equal((await page.evaluate(() => window.cardArtStudy.getState())).playing,false,'system motion preference stops playback');
  assertNoErrors(errors);
  writeFileSync(join(out,'card-art.json'),JSON.stringify({report,errors,controls:'pause, replay, one-shot completion, preference, hidden event and actual offscreen stop'},null,2)+'\n');
  console.log(`PASS: ${available.length} living card paintings; exact original, deterministic frames, seamless loop endpoints, finite drawing, reduced motion, controls, ${available.length*8} desktop/phone captures.`);
} finally { await browser.close(); await server.close(); }
