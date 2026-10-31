// The ready character package through the actual game, with human move input.
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {checkCharacterEffects} from './lib/character-effects-game-check.mjs';
import { env, launch, shot, trapErrors, assertNoErrors } from './lib/checks.mjs';
const browser=await launch(),checks=[];
function runtimeNetwork(page){const records=[],pending=[];page.on('response',response=>{if(response.url().includes('/character-runtime/'))pending.push(response.body().then(bytes=>records.push({url:response.url(),bytes:bytes.length})).catch(()=>{}));});return async()=>{await Promise.all(pending);return {requests:records.length,bytes:records.reduce((n,r)=>n+r.bytes,0),frameBytes:records.filter(r=>/\/character-runtime\/assets\//.test(r.url)).reduce((n,r)=>n+r.bytes,0),manifestBytes:records.filter(r=>/\/character-runtime\/manifest\.json/.test(r.url)).reduce((n,r)=>n+r.bytes,0)};};}
// Serve the game through a shared link. Browser routing misses image requests in WebKit.
async function throttleProxy(upstream){
 let config=null;const transfers=new Set();
 const timer=setInterval(()=>{
  let budget=(config?.kbps??1e9)*1000/8/100;const ready=[...transfers].filter(t=>t.ready<=Date.now());
  while(budget>1&&ready.length){const share=Math.max(1,Math.floor(budget/ready.length));for(const t of [...ready]){
   const n=Math.min(share,t.body.length-t.sent);t.res.write(t.body.subarray(t.sent,t.sent+n));t.sent+=n;budget-=n;
   if(t.sent===t.body.length){t.res.end();transfers.delete(t);ready.splice(ready.indexOf(t),1);}
  }}
 },10);
 const server=http.createServer((req,res)=>{
  const limit=config&&req.url.includes('/character-runtime/assets/'),setting=config;
  const proxy=http.request(new URL(req.url,upstream),{method:req.method,headers:{...req.headers,host:upstream.host}},response=>{
   if(!limit){res.writeHead(response.statusCode,response.headers);response.pipe(res);return;}
   const chunks=[];response.on('data',chunk=>chunks.push(chunk));response.on('end',()=>{
    if(res.destroyed)return;const body=Buffer.concat(chunks),headers={...response.headers,'content-length':body.length};delete headers['transfer-encoding'];
    res.writeHead(response.statusCode,headers);const transfer={res,body,sent:0,ready:Date.now()+setting.latency};transfers.add(transfer);res.on('close',()=>transfers.delete(transfer));
   });
  });proxy.on('error',()=>{if(!res.destroyed){res.statusCode=502;res.end();}});req.pipe(proxy);
 });
 server.listen(0,'127.0.0.1');await once(server,'listening');
 return {url:new URL(`http://127.0.0.1:${server.address().port}`),set:(kbps,latency)=>{config={kbps,latency};},clear:()=>{config=null;},close:async()=>{clearInterval(timer);server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}};
}

try {
 // A quiet move uses its painted loop on the real board and returns to rest.
 for(const [army,fen,from,to] of [
  ['white','7k/p7/8/8/3P4/8/P7/K7 w - - 0 1',27,35],
  ['black','7k/p7/8/3p4/8/8/P7/K7 b - - 0 1',35,27],
 ]){
  const page=await browser.newPage({viewport:{width:1100,height:950}}),errors=trapErrors(page);
  await page.addInitScript(()=>sessionStorage.setItem('kingdown.title-seen','1'));
  const url=new URL(env('PLAYABLE_URL'));url.searchParams.set('fen',fen);url.searchParams.set('players','human,human');
  await page.goto(url.href);await page.waitForFunction(sq=>window.view?.scene?.characterFrames?.some(f=>f.square===sq),from);await page.evaluate(()=>view.ready());
  await page.evaluate(()=>{window.walkTrace=[];window.walkTraceOn=true;const take=()=>{if(walkTraceOn){walkTrace.push(...view.scene.characterFrames);requestAnimationFrame(take);}};take();});
  for(const square of [from,to]){const p=await page.evaluate(sq=>view.screenOf(sq),square);await page.mouse.click(p.x,p.y);}
  await page.waitForFunction(([a,b])=>!view.scene.animating&&!view.pos.board[a]&&view.pos.board[b]>0,[from,to],{timeout:20000});
  const result=await page.evaluate(sq=>{walkTraceOn=false;return {frames:walkTrace,after:view.scene.characterFrames.find(f=>f.square===sq)};},to);
  const walking=result.frames.filter(frame=>frame.bank===`${army}-walk-${army==='white'?'N':'S'}`);
  assert(walking.length>1,`${army}: painted frames play during travel`);
  assert(new Set(walking.map(frame=>JSON.stringify(frame.foot))).size>1,`${army}: the painted body moves across the board`);
  assert(result.after&&!result.after.bank.includes('-walk-'),`${army}: the piece settles on its rest`);
  checks.push({label:`pawn-${army}-walk`,samples:walking.length,banks:[...new Set(walking.map(frame=>frame.bank))]});assertNoErrors(errors);await page.close();
 }
 for(const [character,fen,from,to,flipped] of [
  ['pawn','7k/8/8/3p4/4P3/8/8/K7 w - - 0 1',28,35],
  ['knight','7k/8/8/3p4/8/2N5/8/K7 w - - 0 1',18,35,false],
  ['pawn-black','7k/8/8/3p4/4P3/8/8/K7 b - - 0 1',35,28,false],
  ['knight-black','7k/8/2n5/8/3P4/8/8/K7 b - - 0 1',42,27,true],
  ['pawn-flipped','7k/8/8/3p4/4P3/8/8/K7 w - - 0 1',28,35,true],
  ['rook-white-repaired-E','7k/8/8/8/3Rp3/8/8/K7 w - - 0 1',27,28,false],
  ['rook-black-repaired-W','7k/8/8/2Pr4/8/8/8/K7 b - - 0 1',35,34,false],
  ['beast-black-repaired-SW','7k/8/8/3s4/2P5/8/8/K7 b - - 0 1',35,26,false],
 ]) {
  const page=await browser.newPage({viewport:{width:1100,height:950}}),errors=trapErrors(page);
  const network=runtimeNetwork(page);
  await page.addInitScript(()=>sessionStorage.setItem('kingdown.title-seen','1'));
  const url=new URL(env('PLAYABLE_URL'));url.searchParams.set('fen',fen);url.searchParams.set('players','human,human');
  await page.goto(url.href);await page.waitForFunction(from=>window.view?.scene?.characterFrames?.some(f=>f.square===from),from);
  await page.evaluate(()=>window.view.ready());
  if(flipped)await page.evaluate(()=>view.flip(true));
  const originalBoard=await page.evaluate(()=>[...view.pos.board]);
  const still=await page.evaluate(from=>window.view.scene.characterFrames.find(f=>f.square===from),from);
  assert(still,`${character}: ready body on game board`);const initialNetwork=await network();assert(initialNetwork.requests<=40&&initialNetwork.bytes<=8*1024*1024,'initial runtime download stays bounded');await shot(page,`${character}-game-still`);
  await page.evaluate(()=>{window.bodyTrace=[];const capture=()=>{bodyTrace.push({at:performance.now(),frames:view.scene.characterFrames,animating:view.scene.animating});if(bodyTrace.length<600)requestAnimationFrame(capture);};capture();});
  let rookIdle=null,actionTraceStart=0;
  if(character==='rook-black-repaired-W'){
   const banks=await page.evaluate(async()=>(await(await fetch('/character-runtime/manifest.json')).json()).banks.filter(b=>b.character==='rook'&&b.army==='black'));
   const idle=banks.find(b=>b.id==='black-idle-slam'),turns=banks.filter(b=>b.kind==='turn');
   assert(idle,'reviewed black Rook idle is selected');assert.equal(idle.facing,'S');assert.equal(still.bank,idle.id);
   assert.equal(idle.frames.length,120);assert.equal(idle.frames[0].sourceSha256,idle.frames.at(-1).sourceSha256,'idle closes on exact S rest pixels');
   assert.equal(still.sourceSha256,idle.frames[0].sourceSha256);assert.equal(idle.registrationHeightPx,280);assert.deepEqual(idle.pivot,[192,350]);
   const component=turns.filter(b=>b.registrationSourceSha256===idle.sourceSha256);assert.equal(component.length,8);
   for(const bank of component)assert.deepEqual([bank.pivot,bank.registrationHeightPx,bank.boardScale],[idle.pivot,idle.registrationHeightPx,idle.boardScale],'connected turns and idle share one world transform');
   const sEnds=turns.flatMap(bank=>[[bank.from,bank.frames[0]],[bank.to,bank.frames.at(-1)]]).filter(([facing])=>facing==='S');assert.equal(sEnds.length,2);
   for(const [,frame]of sEnds)assert.equal(frame.sourceSha256,idle.frames[0].sourceSha256,'both S turns join exact idle rest pixels');
   assert(Math.abs(still.scale/(132/275)-55/56)<1e-12,'board scale applies the uniform 55/56 component change');
   const p=await page.evaluate(from=>view.screenOf(from),from);await page.mouse.click(p.x,p.y);
   await page.waitForFunction(([from,id])=>bodyTrace.some((sample,index)=>{const frame=sample.frames.find(f=>f.square===from&&f.bank===id),previous=bodyTrace[index-1]?.frames.find(f=>f.square===from&&f.bank===id);return frame&&previous&&previous.time>1800&&frame.time<100;}),[from,idle.id],{timeout:15000});
   const samples=(await page.evaluate(()=>bodyTrace)).flatMap(sample=>sample.frames).filter(frame=>frame.square===from&&frame.bank===idle.id);
   assert(new Set(samples.map(frame=>frame.sourceSha256)).size>=12,'selected idle plays distinct poses across a full live cycle');
   const foot=await page.evaluate(from=>view.scene.foot(from),from);
   for(const frame of samples){assert.deepEqual(frame.foot,foot,'idle remains at its world foot');assert.deepEqual(frame.pivot,idle.pivot);assert.equal(frame.scale,still.scale);assert(idle.frames.some(f=>f.sourceSha256===frame.sourceSha256));}
   await shot(page,'rook-black-selected-idle-cycle');
   rookIdle={id:idle.id,sourceSha256:idle.sourceSha256,cycleSamples:samples.length,uniquePoses:new Set(samples.map(frame=>frame.sourceSha256)).size,restSha256:idle.frames[0].sourceSha256,sharedSEndpoints:sEnds.length,componentTurns:component.length,registrationHeightPx:idle.registrationHeightPx,scaleRatio:55/56,worldFoot:foot};
   actionTraceStart=await page.evaluate(()=>bodyTrace.length);
  }
  for(const sq of rookIdle?[to]:[from,to]){const p=await page.evaluate(sq=>window.view.screenOf(sq),sq);await page.mouse.click(p.x,p.y);}
  await page.waitForFunction(from=>window.view.scene.characterFrames.some(f=>f.square===from&&f.bank.includes('attack')&&f.time>100),from,{timeout:20000});
  await shot(page,`${character}-game-attack`);
  await page.waitForFunction(([from,to])=>!window.view.scene.animating&&!window.view.pos.board[from]&&window.view.pos.board[to]>0,[from,to],{timeout:15000});
  const trace=await page.evaluate(()=>bodyTrace),attack=trace.flatMap(t=>t.frames).filter(f=>f.square===from&&f.bank.includes('attack'));
  assert(attack.length>1,`${character}: timed body frames played`);
  const after=await page.evaluate(to=>window.view.scene.characterFrames.find(f=>f.square===to),to);assert(after,`${character}: accepted rest at destination`);
  if(rookIdle){
   const actor=trace.slice(actionTraceStart).flatMap(t=>t.frames).filter(frame=>frame.square===from),attackStart=actor.findIndex(frame=>frame.bank==='black-attack-W'),attackEnd=actor.findLastIndex(frame=>frame.bank==='black-attack-W');
   assert(attackStart>0&&attackEnd<actor.length-1,'S turns precede the action and return after it');
   for(const id of ['black-turn-S-SW','black-turn-SW-W']){assert(actor.slice(0,attackStart).some(frame=>frame.bank===id),`${id}: outward route plays`);assert(actor.slice(attackEnd+1).some(frame=>frame.bank===id),`${id}: actual route returns in reverse`);}
   assert.equal(after.bank,rookIdle.id);assert.equal(after.sourceSha256,rookIdle.restSha256);assert.equal(after.scale,still.scale);assert.deepEqual(after.pivot,still.pivot);assert.deepEqual(after.foot,await page.evaluate(to=>view.scene.foot(to),to));
  }
  const memory=await page.evaluate(()=>view.scene.characterMemory);assert(memory.peakBytes<=64*1024*1024,'decoded body cache stays within 64 MiB');
  const totalNetwork=await network(),moveNetwork={requests:totalNetwork.requests-initialNetwork.requests,bytes:totalNetwork.bytes-initialNetwork.bytes};assert(moveNetwork.requests<=180&&moveNetwork.bytes<=16*1024*1024,'one move loads a clip window, not the cast');
  checks.push({character,flipped,initialNetwork,moveNetwork,memory,still,after,attackSamples:attack.length,banks:[...new Set(trace.flatMap(t=>t.frames).map(f=>f.bank))],...(rookIdle?{selectedIdle:rookIdle}:{})});
  if(character==='pawn'||rookIdle){await page.click('#undo');await page.waitForFunction(board=>!view.scene.animating&&view.pos.board.every((v,sq)=>v===board[sq]),originalBoard,{timeout:10000});checks.at(-1).undoRestored=true;if(rookIdle){await page.waitForFunction(from=>view.scene.characterFrames.some(f=>f.square===from),from);const restored=await page.evaluate(from=>view.scene.characterFrames.find(f=>f.square===from),from);assert.equal(restored.bank,rookIdle.id);assert.equal(restored.sourceSha256,rookIdle.restSha256);assert.deepEqual([restored.foot,restored.pivot,restored.scale],[still.foot,still.pivot,still.scale]);checks.at(-1).undoFrame=restored;}await shot(page,`${character}-game-undo`);}
  assertNoErrors(errors);await page.close();
 }
 // Repeat the staging capture in fresh pages, including idle selection before the move.
 const proxy=await throttleProxy(new URL(env('PLAYABLE_URL')));
 try{for(const [kbps,latency] of [[4000,100],[1600,150]]){let passed=0;
 for(let run=1;run<=5;run++){
  const page=await browser.newPage({viewport:{width:1100,height:950}}),errors=trapErrors(page);
  try{
   await page.addInitScript(()=>sessionStorage.setItem('kingdown.title-seen','1'));
   const url=new URL(proxy.url);url.searchParams.set('fen','7k/8/8/2Pr4/8/8/8/K7 b - - 0 1');url.searchParams.set('players','human,human');
   await page.goto(url.href);await page.waitForFunction(()=>window.view?.scene?.characterFrames?.some(f=>f.square===35));await page.evaluate(()=>view.ready());
   proxy.set(kbps,latency);
   await page.evaluate(()=>{window.captureTrace=[];window.captureTracing=true;const tick=()=>{if(!captureTracing)return;captureTrace.push(...view.scene.characterFrames.filter(f=>f.square===35).map(f=>({bank:f.bank,sha:f.sourceSha256,time:f.time})));requestAnimationFrame(tick);};tick();});
   const from=await page.evaluate(()=>view.screenOf(35));await page.mouse.click(from.x,from.y);
   await page.waitForTimeout(2000);
   const to=await page.evaluate(()=>view.screenOf(34));await page.mouse.click(to.x,to.y);
   await page.waitForFunction(()=>!view.scene.animating&&!view.pos.board[35]&&view.pos.board[34]>0,null,{timeout:20000});
   const trace=await page.evaluate(()=>{window.captureTracing=false;return captureTrace;}),attack=trace.filter(f=>f.bank==='black-attack-W');
   const ok=attack.length>1&&attack.some(f=>f.time>100);if(ok)passed++;
   assertNoErrors(errors);checks.push({kbps,latency,captureRun:run,attackSamples:attack.length});console.log(`capture ${kbps} kbps ${latency} ms ${run}/5: ${attack.length} attack samples`);
  }finally{proxy.clear();await page.close();}
 }
 console.log(`capture ${kbps} kbps ${latency} ms: ${passed}/5`);
 if(kbps===4000)assert.equal(passed,5,`${kbps} kbps ${latency} ms: all five captures show attack frames`);
 }}finally{await proxy.close();}
 // The ready cast and all six king designs draw in the real game with their separate cues.
 for(const [label,kings,fen,count] of [
  ['standard-position',null,'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',32],
  ['ready-cast',null,'onbalmgk/pppppppp/8/8/8/8/PPPPPPPP/ONBALMGK w - - 0 1',32],
  ['kings-frost-flame','frost:freeze,flame:haste','7k/8/8/3p4/4P3/8/8/K7 w - - 0 1',4],
  ['kings-mud-stratus','mud:march,stratus:flight','7k/8/8/3p4/4P3/8/8/K7 w - - 0 1',4],
 ]) {
  const page=await browser.newPage({viewport:{width:1100,height:950}}),errors=trapErrors(page);
  const network=runtimeNetwork(page);
  await page.addInitScript(()=>sessionStorage.setItem('kingdown.title-seen','1'));
  const url=new URL(env('PLAYABLE_URL'));url.searchParams.set('fen',fen);url.searchParams.set('players','human,human');if(kings)url.searchParams.set('kings',kings);
  await page.goto(url.href);await page.waitForFunction(count=>window.view?.scene?.characterFrames?.length===count,count);await page.evaluate(()=>view.ready());await page.waitForTimeout(1000);
  await shot(page,label);const memory=await page.evaluate(()=>view.scene.characterMemory);assert(memory.peakBytes<=64*1024*1024,'ready cast decoded cache stays within 64 MiB');const initialNetwork=await network();assert(initialNetwork.requests<=40&&initialNetwork.bytes<=8*1024*1024,'full board only loads its runtime stills and ambient texture');checks.push({label,initialNetwork,memory,frames:await page.evaluate(()=>view.scene.characterFrames)});assertNoErrors(errors);await page.close();
 }
 // The shipped package carries every selected bank as content-named WebP.
 {
  const page=await browser.newPage({viewport:{width:1100,height:950}}),errors=trapErrors(page);
  await page.addInitScript(()=>sessionStorage.setItem('kingdown.title-seen','1'));
  const url=new URL(env('PLAYABLE_URL'));url.searchParams.set('fen','rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');url.searchParams.set('players','human,human');
  await page.goto(url.href);
  const pack=await page.evaluate(async()=>(await(await fetch('/character-runtime/manifest.json')).json())),urls=pack.banks.flatMap(bank=>bank.frames.map(frame=>frame.url));
  assert.equal(pack.sourceToRuntimeScale,0.5);assert(pack.banks.length>=478,'the ready package carries every selected bank');assert(urls.every(url=>/^assets\/[a-f0-9]{64}\.webp$/.test(url)),'every runtime frame is content-named WebP');
  checks.push({packageBanks:pack.banks.length,packageFrames:urls.length});assertNoErrors(errors);await page.close();
 }

 // Repaired Queen, Guard and king turns retain adjacent endpoint pixels and transforms in the shipped package.
 for(const [character,army,fen,from,to,kings]of [
  ['queen','white','6k1/p7/8/8/3Q4/8/P7/K7 w - - 0 1',27,36,null],
  ['queen','black','7k/p7/8/8/3q4/8/P7/1K6 b - - 0 1',27,36,null],
  ['guard','white','7k/p7/8/8/8/2G5/P7/K7 w - - 0 1',18,26,null],
  ['guard','black','7k/p7/8/2g5/8/8/P7/K7 b - - 0 1',34,42,null],
  ['king-frost','white','7k/p7/8/8/3K4/8/P7/8 w - - 0 1',27,34,'frost:freeze,flame:haste'],
  ['king-frost','black','8/7p/8/3k4/8/8/P7/K7 b - - 0 1',35,44,'flame:haste,frost:freeze'],
  ['king-flame','white','7k/p7/8/8/3K4/8/P7/8 w - - 0 1',27,34,'flame:haste,frost:freeze'],
  ['king-flame','white','7k/p7/8/8/3K4/8/P7/8 w - - 0 1',27,35,'flame:haste,frost:freeze'],
  ['king-flame','black','8/7p/8/3k4/8/8/P7/K7 b - - 0 1',35,34,'frost:freeze,flame:haste'],
  ['king-flame','black','8/7p/8/3k4/8/8/P7/K7 b - - 0 1',35,44,'frost:freeze,flame:haste'],
 ]){
  const page=await browser.newPage({viewport:{width:1100,height:950}}),errors=trapErrors(page),label=`${character}-${army}-${to}`;
  await page.addInitScript(()=>sessionStorage.setItem('kingdown.title-seen','1'));
  const url=new URL(env('PLAYABLE_URL'));url.searchParams.set('fen',fen);url.searchParams.set('players','human,human');if(kings)url.searchParams.set('kings',kings);
  await page.goto(url.href);await page.waitForFunction(from=>window.view?.scene?.characterFrames?.some(f=>f.square===from),from);await page.evaluate(()=>view.ready());
  const turns=await page.evaluate(async([character,army])=>(await(await fetch('/character-runtime/manifest.json')).json()).banks.filter(b=>b.character===character&&b.army===army&&b.kind==='turn'),[character,army]);
  let joins=0;
  for(const bank of turns)for(const [facing,frame]of [[bank.from,bank.frames[0]],[bank.to,bank.frames.at(-1)]]){
   const peers=turns.filter(other=>other!==bank).flatMap(other=>[[other.from,other.frames[0],other],[other.to,other.frames.at(-1),other]]).filter(([otherFacing])=>otherFacing===facing);
   assert(peers.length,`${label}: adjacent ready edge at ${facing}`);
   for(const [,otherFrame,other]of peers){assert.equal(frame.sourceSha256,otherFrame.sourceSha256,`${label}: exact shared endpoint pixels`);assert.deepEqual([bank.pivot,bank.registrationHeightPx,bank.boardScale],[other.pivot,other.registrationHeightPx,other.boardScale],`${label}: shared endpoint transform`);joins++;}
  }
  const original=await page.evaluate(()=>[...view.pos.board]);
  const queenRest=character==='queen'?await page.evaluate(from=>view.scene.characterFrames.find(frame=>frame.square===from),from):null;
  await page.evaluate(()=>{window.turnTrace=[];window.turnTraceActive=true;const capture=()=>{if(!turnTraceActive)return;turnTrace.push(...view.scene.characterFrames);requestAnimationFrame(capture);};capture();});
  for(const square of [from,to]){const p=await page.evaluate(square=>view.screenOf(square),square);await page.mouse.click(p.x,p.y);}
  try {await page.waitForFunction(([from,to])=>!view.scene.animating&&!view.pos.board[from]&&view.pos.board[to]>0,[from,to],{timeout:15000});} catch(error) { await writeFile(join(env('PLAYABLE_OUT'),label+'-failure.json'),JSON.stringify(await page.evaluate(([from,to,label])=>({label,from,to,board:[...view.pos.board],animating:view.scene.animating,text:document.body.innerText}),[from,to,label]),null,2));await shot(page,label+'-failure');throw error;}
  const trace=await page.evaluate(()=>{window.turnTraceActive=false;return turnTrace;}),samples=trace.filter(frame=>turns.some(bank=>bank.id===frame.bank));
  assert(samples.length>1,`${label}: ready turn frames played in the game`);
  for(const frame of samples){const bank=turns.find(bank=>bank.id===frame.bank);assert.equal(frame.sourceBankSha256,bank.sourceSha256);assert(bank.frames.some(f=>f.sourceSha256===frame.sourceSha256));}
  if(character==='queen'){
   const frames=trace.filter(frame=>(frame.square===from||frame.square===to)&&frame.bank===`${army}-turn-NE-E`);
   const firstRest=frames.findIndex(frame=>frame.time===0),lastRest=frames.findLastIndex(frame=>frame.time===0);
   await writeFile(join(env('PLAYABLE_OUT'),`${label}-turn-route.json`),JSON.stringify({firstRest,lastRest,frames},null,2));
   assert(firstRest>0&&Math.max(...frames.slice(0,firstRest).map(frame=>frame.time))>=64,'outward Queen turn runs E to NE');
   assert(lastRest<frames.length-1&&Math.max(...frames.slice(lastRest+1).map(frame=>frame.time))>=64,'return Queen turn runs NE to E');
   const outward=frames.slice(0,firstRest+1),back=frames.slice(lastRest);
   assert(outward.every((frame,i)=>!i||frame.time<=outward[i-1].time),'outward turn never jumps backwards while images load');
   assert(back.every((frame,i)=>!i||frame.time>=back[i-1].time),'return turn never jumps backwards while images load');
  }
  await shot(page,`${label}-turn-settled`);await page.click('#undo');await page.waitForFunction(board=>!view.scene.animating&&view.pos.board.every((value,square)=>value===board[square]),original);
  if(queenRest){
   await page.waitForFunction(([square,sha])=>view.scene.characterFrames.some(frame=>frame.square===square&&frame.sourceSha256===sha),[from,queenRest.sourceSha256]);
   const restored=await page.evaluate(from=>view.scene.characterFrames.find(frame=>frame.square===from),from);
   assert.deepEqual([restored.bank,restored.sourceSha256,restored.pivot,restored.scale,restored.foot],[queenRest.bank,queenRest.sourceSha256,queenRest.pivot,queenRest.scale,queenRest.foot],'Undo restores the Queen drawing and world placement');
  }
  checks.push({label,joins,turnSamples:samples.length,banks:[...new Set(samples.map(frame=>frame.bank))],undoRestored:true});assertNoErrors(errors);await page.close();
 }
 checks.push({nativeEffectCases:await checkCharacterEffects(browser)});
 // A new position cancels a load or action; a late decoded frame must not replace the new position.
 const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}),errors=trapErrors(page);
 await page.addInitScript(()=>sessionStorage.setItem('kingdown.title-seen','1'));
 const url=new URL(env('PLAYABLE_URL'));url.searchParams.set('fen','7k/8/8/3p4/4P3/8/8/K7 w - - 0 1');url.searchParams.set('players','human,human');
 await page.goto(url.href);await page.waitForFunction(()=>window.view?.scene?.characterFrames?.length>0);await page.evaluate(()=>window.view.ready());
 await page.evaluate(()=>{const pos=view.pos;void view.scene.play({from:28,to:35,captures:[35]});view.sync(pos);});
 await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>view.scene.animating),false);
 await shot(page,'phone-reduced-still');assertNoErrors(errors);checks.push({reducedMotion:true,cancelled:true});await page.close();
 await writeFile(join(env('PLAYABLE_OUT'),'character-runtime.json'),JSON.stringify(checks,null,2));
 console.log(`ok ready game character bodies: ${checks.length} cases`);
} finally {await browser.close();}
