// Exercise a stalled character image through real game input and Undo.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { env, launch, trapErrors, assertNoErrors } from './lib/checks.mjs';
import { turnRoute } from '../docs/2d-first-pieces/board/character-runtime.mjs';

const browser=await launch();
try {
 for(const cancel of [false,true]){
  const page=await browser.newPage({viewport:{width:1100,height:950}}),errors=trapErrors(page);
  await page.addInitScript(()=>sessionStorage.setItem('kingdown.title-seen','1'));
  const url=new URL(env('PLAYABLE_URL'));url.searchParams.set('fen','7k/8/8/8/8/8/4P3/K7 w - - 0 1');url.searchParams.set('players','human,human');
  const manifest=await (await page.request.get(new URL('/character-runtime/manifest.json',url).href)).json();
  const banks=manifest.banks.filter(b=>b.character==='pawn'&&b.army==='white'),rest=banks.find(b=>b.kind==='idle'&&b.facing==='SE');
  const route=turnRoute(banks.filter(b=>b.kind==='turn'),rest.facing,'N');assert(route?.length);
  const blocked=route.flatMap(p=>[p.bank.frames[0],p.bank.frames.at(-1)]).find(f=>f.url!==rest.frames[0].url);assert(blocked);
  let release,hit,firstRequest;const gate=new Promise(resolve=>{release=resolve;}),intercepted=new Promise(resolve=>{hit=resolve;});
  const blockedUrl=new URL(blocked.url,new URL('/character-runtime/manifest.json',url)).href;
  await page.route(blockedUrl,async request=>{firstRequest??=request.request();hit();await gate;await request.continue().catch(()=>{});});
  await page.goto(url.href);await page.waitForFunction(()=>window.view?.scene?.characterFrames?.some(f=>f.square===12));await page.evaluate(()=>view.ready());
  const original=await page.evaluate(()=>[...view.pos.board]);
  await page.evaluate(()=>{window.prepareTrace=[];const capture=()=>{prepareTrace.push({at:performance.now(),animating:view.scene.animating,body:view.scene.characterFrames.some(f=>f.square===12),sha:view.scene.characterFrames.find(f=>f.square===12)?.sourceSha256});if(prepareTrace.length<600)requestAnimationFrame(capture);};capture();});
  const start=Date.now();for(const square of [12,20]){const p=await page.evaluate(s=>view.screenOf(s),square);await page.mouse.click(p.x,p.y);}
  await page.waitForFunction(()=>view.scene.animating);
  await Promise.race([intercepted,page.waitForTimeout(1500).then(()=>{throw Error('turn endpoint was not held');})]);
  if(cancel){
   await page.keyboard.press('z');
   await page.waitForFunction(board=>!view.scene.animating&&view.pos.board.every((v,i)=>v===board[i]),original,{timeout:5000});
   release();await page.waitForTimeout(1200);
   assert.deepEqual(await page.evaluate(()=>[...view.pos.board]),original,'late image cannot restore the cancelled move');
   assert.equal(await page.evaluate(()=>view.scene.animating),false);
  }else{
   await page.waitForFunction(()=>!view.scene.animating&&!view.pos.board[12]&&view.pos.board[20],null,{timeout:4000});
   assert(Date.now()-start<3500,'move settles with a stalled image');
   const trace=await page.evaluate(()=>prepareTrace);assert(trace.some(s=>s.animating&&!s.body),'legacy body is used after the deadline');
   const delivered=page.waitForResponse(response=>response.url()===blockedUrl&&response.request()!==firstRequest);release();await page.click('#undo');await page.waitForFunction(board=>!view.scene.animating&&view.pos.board.every((v,i)=>v===board[i]),original,{timeout:5000});
   const previous=await page.evaluate(()=>prepareTrace.length);
   for(const square of [12,20]){const p=await page.evaluate(s=>view.screenOf(s),square);await page.mouse.click(p.x,p.y);}
   await delivered;await page.waitForFunction(()=>!view.scene.animating&&!view.pos.board[12]&&view.pos.board[20],null,{timeout:5000});
   const recovered=await page.evaluate(index=>prepareTrace.slice(index),previous);assert(recovered.some(s=>s.sha===undefined?false:s.sha===blocked.sourceSha256),'a later move uses the recovered turn image');
  }
  assertNoErrors(errors);console.log(`ok stalled turn image: ${cancel?'Undo during preparation':'bounded fallback and Undo'}`);await page.close();
 }
 // Check real HTTP cancellation and concurrency, not just the runtime counters.
 const server=createServer();let active=0,peak=0,started=0,closed=0,notify=()=>{};const responses=new Set();
 server.on('request',(_request,response)=>{
  started++;active++;peak=Math.max(peak,active);responses.add(response);
  response.writeHead(200,{'Access-Control-Allow-Origin':'*','Content-Type':'image/png'});response.flushHeaders();
  response.on('close',()=>{active--;closed++;responses.delete(response);notify();});notify();
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const waitFor=predicate=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error(`request wait timed out: started=${started}, closed=${closed}`)),12000);notify=()=>{if(predicate()){clearTimeout(timer);resolve();}};notify();});
 try{
  const page=await browser.newPage();await page.goto(env('PLAYABLE_URL'));
  const source=await readFile(new URL('../docs/2d-first-pieces/board/character-runtime.mjs',import.meta.url),'utf8'),base=`http://127.0.0.1:${server.address().port}/`;
  await page.evaluate(async({source,base})=>{
   const moduleUrl=URL.createObjectURL(new Blob([source],{type:'text/javascript'})),{createCharacterRuntime}=await import(moduleUrl);URL.revokeObjectURL(moduleUrl);
   const banks=Array.from({length:7},(_,i)=>({id:`b${i}`,character:`p${i}`,army:'white',kind:'idle',facing:'SE',durationMs:100,pivot:[0,0],registrationHeightPx:1,frames:[{url:`image-${i}`,timeMs:0}]}));
   window.cancelRuntime=createCharacterRuntime({url:base+'manifest.json',fetcher:async()=>({ok:true,json:async()=>({schemaVersion:1,banks})})});
   await cancelRuntime.ready();for(const bank of banks)void cancelRuntime.warm(bank.character,'white');
  },{source,base});
  await waitFor(()=>started>=7&&closed>=6);assert(peak<=6,`at most six underlying requests, saw ${peak}`);
  await page.evaluate(()=>cancelRuntime.dispose());await waitFor(()=>active===0);
  assert.equal(started,7);console.log(`ok actual HTTP cancellation: peak ${peak}, ${closed} closed`);await page.close();
 }finally{for(const response of responses)response.destroy();await new Promise(resolve=>server.close(resolve));}
}finally{await browser.close();}
