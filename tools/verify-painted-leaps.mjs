// Real Chromium moves with painted leap banks, contact timing and exact landing squares. With the argument "start"
// (the leap-start check), the start delay of a leap after the click instead.
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {join} from 'node:path';
import {env,launch,trapErrors,assertNoErrors} from './lib/checks.mjs';
const manifest=JSON.parse(await readFile('public/character-runtime/manifest.json'));
const browser=await launch();
if(process.argv[2]==='start'){
 // leap-start: the time from the click on the target to the start of the move. Each frame request waits 200 ms before
 // it goes out, as on a fast link to a far or cold CDN edge. Warm: the piece is selected 1 s before the click, so the
 // selection prefetch runs. Cold: the click comes 150 ms after the selection. The leaps assert a limit (PR 303 made a
 // leap wait up to 1 s on such a link); a capture and a walk only print theirs. A new browser makes its first sound
 // slowly, so one sound is made before the cases.
 const LIMIT={warm:150,cold:400};
 const cases=[
  ['knight white SE','7k/8/7p/8/3N4/8/P7/K7 w - - 0 1',27,21,true],['knight black NW','7k/8/7p/8/3n4/8/P7/K7 b - - 0 1',27,42,true],
  ['paladin white SE','7k/8/7p/8/3L4/8/P7/K7 w - - 0 1',27,13,true],['paladin black NE','7k/8/7p/8/3l4/8/P7/K7 b - - 0 1',27,45,true],
  ['knight capture','7k/8/7p/5p2/3N4/8/P7/K7 w - - 0 1',27,37,false],['rook walk','7k/8/8/8/8/8/8/R5K1 w - - 0 1',0,32,false],
 ];
 const faults=[],rows=[];
 try{
  {const page=await browser.newPage();await page.evaluate(()=>{const c=new AudioContext();return c.close();});await page.close();}
  for(const [name,fen,from,to,leap] of cases)for(const [kind,gap] of [['warm',1000],['cold',150]]){
   const context=await browser.newContext({viewport:{width:1000,height:900},serviceWorkers:'block',reducedMotion:'no-preference'});
   await context.route(/\/character-runtime\/assets\//,async route=>{await new Promise(resolve=>setTimeout(resolve,200));await route.continue().catch(()=>{});});
   const page=await context.newPage(),errors=trapErrors(page);
   try{
    await page.addInitScript(()=>sessionStorage.setItem('kingdown.title-seen','1'));
    const url=new URL(env('PLAYABLE_URL'));url.searchParams.set('players','human,human');url.searchParams.set('fen',fen);
    await page.goto(url.href);await page.waitForFunction(s=>window.view?.scene?.characterFrames?.some(f=>f.square===s),from);await page.evaluate(()=>view.ready());
    await page.waitForFunction(()=>view.scene.characterWarmupSettled,null,{timeout:15000});await page.waitForTimeout(500);
    // The move starts at now - actionElapsed (normal pace, speed 1), so the poll interval does not count.
    await page.evaluate(()=>{let downs=0;window.clickAt=null;window.startAt=null;addEventListener('pointerdown',()=>{if(++downs===2)clickAt=performance.now();},true);
     window.poll=setInterval(()=>{const e=view.scene.actionElapsed;if(clickAt!=null&&startAt==null&&e!=null)startAt=performance.now()-e;},4);});
    const a=await page.evaluate(s=>view.screenOf(s),from);await page.mouse.click(a.x,a.y);await page.waitForTimeout(gap);
    const b=await page.evaluate(s=>view.screenOf(s),to);await page.mouse.click(b.x,b.y);
    await page.waitForFunction(()=>startAt!=null,null,{timeout:5000});
    const ms=Math.round(await page.evaluate(()=>{clearInterval(poll);return startAt-clickAt;}));
    assertNoErrors(errors);rows.push({name,kind,ms});
    const fault=leap&&ms>LIMIT[kind];if(fault)faults.push(`${name} ${kind}: ${ms} ms, limit ${LIMIT[kind]} ms`);
    console.log(`${fault?'FAULT':'ok'} ${name} ${kind}: the move starts ${ms} ms after the click${leap?` (limit ${LIMIT[kind]} ms)`:''}`);
   }finally{await context.close();}
  }
 }finally{await browser.close();}
 await mkdir(env('PLAYABLE_OUT'),{recursive:true});await writeFile(join(env('PLAYABLE_OUT'),'leap-start.json'),JSON.stringify(rows,null,1));
 assert.deepEqual(faults,[],'a leap starts late');
 process.exit(0);
}
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
