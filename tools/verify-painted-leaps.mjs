// Real Chromium moves with painted leap banks, contact timing and exact landing squares.
import assert from 'node:assert/strict';
import {readFile,writeFile,rename} from 'node:fs/promises';
import {join} from 'node:path';
import {env,launch,trapErrors,assertNoErrors} from './lib/checks.mjs';
const manifest=JSON.parse(await readFile('public/character-runtime/manifest.json'));
const browser=await launch();
try{
 for(const character of ['knight','paladin'])for(const army of ['white','black'])for(const facing of character==='knight'?['SE']:['SE','NE','NW']){
  const to=character==='knight'?21:({SE:13,NE:45,NW:41})[facing],letter=character==='knight'?'N':'L',piece=army==='white'?letter:letter.toLowerCase();
  const context=await browser.newContext({viewport:{width:1000,height:900},serviceWorkers:'block',reducedMotion:'no-preference',recordVideo:{dir:env('PLAYABLE_OUT'),size:{width:1000,height:900}}});
  const page=await context.newPage(),errors=trapErrors(page);
  await page.addInitScript(()=>sessionStorage.setItem('kingdown.title-seen','1'));
  const url=new URL(env('PLAYABLE_URL'));url.searchParams.set('players','human,human');
  url.searchParams.set('fen',`7k/p7/8/8/3${piece}4/8/P7/K7 ${army==='white'?'w':'b'} - - 0 1`);
  await page.goto(url.href);await page.waitForFunction(()=>window.view?.scene?.characterFrames?.some(f=>f.square===27));await page.evaluate(()=>view.ready());
  const from=await page.evaluate(()=>view.screenOf(27));await page.mouse.click(from.x,from.y);
  await page.waitForFunction(()=>view.scene.characterWarmupSettled);await page.waitForTimeout(200);
  await page.evaluate(()=>{window.leapTrace=[];window.recordLeap=true;function tick(){if(!recordLeap)return;leapTrace.push({at:performance.now(),playing:view.scene.playing,frames:view.scene.characterFrames,memory:view.scene.characterMemory});requestAnimationFrame(tick);}tick();});
  const target=await page.evaluate(s=>view.screenOf(s),to);await page.mouse.click(target.x,target.y);
  await page.waitForFunction(to=>!view.scene.animating&&!view.pos.board[27]&&view.pos.board[to],to,{timeout:15000});
  await page.waitForTimeout(250);
  const trace=await page.evaluate(()=>{recordLeap=false;return leapTrace;});
  const name=`${character}-${army}-${facing}`;await writeFile(join(env('PLAYABLE_OUT'),`${name}.json`),JSON.stringify(trace));
  const bank=manifest.banks.find(b=>b.character===character&&b.army===army&&b.kind==='movement'&&b.facing===facing);assert(bank);
  const frames=trace.flatMap(t=>t.frames).filter(f=>f.square===27&&f.bank===bank.id);
  assert(frames.length>10,`${name}: painted leap plays`);
  assert.deepEqual([...new Set(frames.map(f=>f.time))],bank.frames.map(f=>f.timeMs),`${name}: all authored times`);
  const landed=frames.find(f=>f.time>=bank.contactMs),foot=await page.evaluate(s=>view.scene.foot(s),to);
  assert.deepEqual(landed.foot,foot,`${name}: exact target at contact`);
  assert.deepEqual(frames.at(-1).foot,foot,`${name}: no final position step`);
  assert(frames.every(f=>f.scale===(character==='knight'?129:124)/bank.registrationHeightPx));
  assert(trace.every(t=>t.memory.peakBytes<=64*1024*1024&&t.memory.active<=6),`${name}: cache limits`);
  assertNoErrors(errors);
  const video=page.video();await context.close();await rename(await video.path(),join(env('PLAYABLE_OUT'),`${name}.webm`));
  console.log(`ok ${name}: 8 poses, exact landing, scale and cache limits`);
 }
}finally{await browser.close();}
