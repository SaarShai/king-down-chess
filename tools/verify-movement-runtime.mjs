// Real game moves and Undo with synthetic banks; source assets remain read-only.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { createServer } from 'vite';
import { launch, trapErrors, assertNoErrors, env } from './lib/checks.mjs';

const assets=process.env.MOVEMENT_BASELINE_DIR;
assert(assets,'Set MOVEMENT_BASELINE_DIR to the read-only pinned character package');
const bytes=await readFile(join(assets,'manifest.json'));
assert.equal(createHash('sha256').update(bytes).digest('hex'),'05ff4c215cd601486863cc00efbf6c080e6fa8fcb29c410380da6d8e98807f9e');
const manifest=JSON.parse(bytes);
assert.equal(manifest.banks.length,468);assert(!manifest.banks.some(b=>b.kind==='movement'));
for(const army of ['white','black'])for(const facing of ['SW','NE']){
 const idle=manifest.banks.find(b=>b.character==='paladin'&&b.army===army&&b.kind==='idle');
 assert(idle);
 manifest.banks.push({...idle,id:`synthetic-${army}-${facing}`,kind:'movement',facing,durationMs:200,nearest:false,
  frames:[0,100,200].map(timeMs=>({...idle.frames[0],timeMs,sourceSha256:`synthetic-${army}-${facing}-${timeMs}`}))});
}
const server=await createServer({root:process.cwd(),configLoader:'runner',cacheDir:join(env('PLAYABLE_OUT'),'vite-cache'),define:{__KINGDOWN_CHARACTER_RUNTIME__:'true'},server:{host:'127.0.0.1',port:0,strictPort:false}});
let browser;
try{
 await server.listen();browser=await launch();
 for(const army of ['white','black'])for(const flip of [false,true]){
  const page=await browser.newPage({viewport:{width:1100,height:950},serviceWorkers:'block',reducedMotion:'no-preference'}),errors=trapErrors(page);
  await page.route('**/character-runtime/**',async route=>{
   const pathname=new URL(route.request().url()).pathname;const path=pathname.slice(pathname.lastIndexOf('/character-runtime/')+'/character-runtime/'.length);
   if(!pathname.includes('/character-runtime/'))return route.continue();
   if(path==='manifest.json')return route.fulfill({json:manifest});
   assert(!path.includes('..'));return route.fulfill({body:await readFile(join(assets,path)),contentType:path.endsWith('.webp')?'image/webp':path.endsWith('.png')?'image/png':'text/javascript'});
  });
  await page.addInitScript(()=>sessionStorage.setItem('kingdown.title-seen','1'));
  const url=new URL(`http://127.0.0.1:${server.httpServer.address().port}/`);url.searchParams.set('fen',`7k/p7/8/8/3${army==='white'?'L':'l'}4/8/P7/K7 ${army==='white'?'w':'b'} - - 0 1`);url.searchParams.set('players','human,human');
  await page.goto(url.href);await page.waitForFunction(()=>window.view?.scene?.characterFrames?.some(f=>f.square===27),null,{timeout:15000});await page.evaluate(()=>view.ready());
  if(flip){await page.evaluate(()=>view.flip(true));await page.waitForFunction(()=>view.scene.foot(27).x===536);}
  const original=await page.evaluate(()=>[...view.pos.board]);
  await page.evaluate(()=>{window.moveTrace=[];window.traceOn=true;function record(){if(!window.traceOn)return;moveTrace.push({animating:view.scene.animating,frames:view.scene.characterFrames});requestAnimationFrame(record);}record();});
  for(const sq of [27,18]){const p=await page.evaluate(s=>view.screenOf(s),sq);await page.mouse.click(p.x,p.y);}
  await page.waitForFunction(()=>!view.scene.animating&&!view.pos.board[27]&&view.pos.board[18],null,{timeout:12000});
  const forward=flip?'NE':'SW',back=flip?'SW':'NE';
  const index=await page.evaluate(()=>moveTrace.length);await page.click('#undo');
  await page.waitForFunction(board=>!view.scene.animating&&view.pos.board.every((v,i)=>v===board[i]),original,{timeout:12000});
  const trace=await page.evaluate(()=>{window.traceOn=false;return moveTrace;});
  for(const [samples,direction] of [[trace.slice(0,index),forward],[trace.slice(index),back]]){
   const frames=samples.filter(s=>s.animating).flatMap(s=>s.frames).filter(f=>f.bank===`synthetic-${army}-${direction}`);
   assert(frames.length>1,`${army} ${flip} ${direction} bank`);assert(frames.some(f=>f.time===0));assert(frames.some(f=>f.time===100));
   assert(frames.some(f=>f.time===200),`${army} ${flip} ${direction} final frame`);
   const bank=manifest.banks.find(b=>b.id===`synthetic-${army}-${direction}`);
   for(const f of frames){assert.deepEqual(f.pivot,bank.pivot);assert.equal(f.scale,bank.boardScale??124/bank.registrationHeightPx);}
   assert(frames.some(f=>f.foot.x!==frames[0].foot.x||f.foot.y!==frames[0].foot.y),'travel');
  }
  await page.evaluate(()=>{window.moveTrace=[];window.traceOn=true;function record(){if(!window.traceOn)return;moveTrace.push({animating:view.scene.animating,frames:view.scene.characterFrames});requestAnimationFrame(record);}record();});
  for(const sq of [27,54]){const p=await page.evaluate(s=>view.screenOf(s),sq);await page.mouse.click(p.x,p.y);}
  await page.waitForFunction(()=>!view.scene.animating&&!view.pos.board[27]&&view.pos.board[54],null,{timeout:12000});
  const longIndex=await page.evaluate(()=>moveTrace.length);await page.click('#undo');
  await page.waitForFunction(board=>!view.scene.animating&&view.pos.board.every((v,i)=>v===board[i]),original,{timeout:12000});
  const longTrace=await page.evaluate(()=>{window.traceOn=false;return moveTrace;});
  for(const [samples,square] of [[longTrace.slice(0,longIndex),27],[longTrace.slice(longIndex),54]]){
   const frames=samples.filter(s=>s.animating).flatMap(s=>s.frames).filter(f=>f.square===square);
   assert(frames.length>1,`${army} ${flip} long move fallback frames`);
   assert(frames.every(f=>!f.bank.startsWith('synthetic-')),`${army} ${flip} long move must not use movement bank`);
   assert(frames.some(f=>f.foot.x!==frames[0].foot.x||f.foot.y!==frames[0].foot.y),'long move fallback travels');
  }
  console.log(`ok ${army} ${flip?'flipped':'normal'} three-square move and Undo use fallback`);
  const captureURL=new URL(url);captureURL.searchParams.set('fen',`7k/p7/8/8/3${army==='white'?'L':'l'}4/2${army==='white'?'p':'P'}5/P7/K7 ${army==='white'?'w':'b'} - - 0 1`);
  await page.goto(captureURL.href);await page.waitForFunction(()=>window.view?.scene?.characterFrames?.some(f=>f.square===27),null,{timeout:15000});await page.evaluate(()=>view.ready());
  if(flip){await page.evaluate(()=>view.flip(true));await page.waitForFunction(()=>view.scene.foot(27).x===536);}
  const captureBoard=await page.evaluate(()=>[...view.pos.board]);
  const victim=await page.evaluate(()=>view.pos.board[18]),mover=captureBoard[27];
  await page.evaluate(()=>{window.captureTrace=[];window.captureTraceOn=true;function record(){if(!captureTraceOn)return;captureTrace.push({animating:view.scene.animating,frames:view.scene.characterFrames});requestAnimationFrame(record);}record();});
  for(const sq of [27,18]){const p=await page.evaluate(s=>view.screenOf(s),sq);await page.mouse.click(p.x,p.y);}
  await page.waitForFunction(mover=>!view.scene.animating&&!view.pos.board[27]&&view.pos.board[18]===mover,mover,{timeout:12000});
  assert.notEqual(victim,mover);
  const captureIndex=await page.evaluate(()=>captureTrace.length);
  const captureFrames=await page.evaluate(()=>captureTrace.flatMap(s=>s.frames).filter(f=>f.square===27));
  assert(captureFrames.some(f=>f.bank===`${army}-attack-${forward}`),`${army} ${flip} capture uses attack`);
  assert(captureFrames.every(f=>!f.bank.startsWith('synthetic-')),`${army} ${flip} capture must not use movement`);
  await page.click('#undo');
  await page.waitForFunction(board=>!view.scene.animating&&view.pos.board.every((v,i)=>v===board[i]),captureBoard,{timeout:12000});
  const undoFrames=await page.evaluate(index=>{window.captureTraceOn=false;return captureTrace.slice(index).filter(s=>s.animating).flatMap(s=>s.frames);},captureIndex);
  const reverse=undoFrames.filter(f=>f.bank===`synthetic-${army}-${back}`);
  for(const time of [0,100,200])assert(reverse.some(f=>f.time===time),`${army} ${flip} capture Undo ${back} frame ${time}`);
  assert(reverse.some(f=>f.foot.x!==reverse[0].foot.x||f.foot.y!==reverse[0].foot.y),`${army} ${flip} capture Undo travels`);
  console.log(`ok ${army} ${flip?'flipped':'normal'} real capture uses attack and Undo uses ${back} movement`);
  assertNoErrors(errors);console.log(`ok ${army} ${flip?'flipped':'normal'} move ${forward}, Undo ${back}`);await page.close();
 }
}finally{await browser?.close();await server.close();}
