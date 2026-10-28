// The ready character package through the actual game, with human move input.
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {checkCharacterEffects} from './lib/character-effects-game-check.mjs';
import { env, launch, shot, trapErrors, assertNoErrors } from './lib/checks.mjs';
const browser=await launch(),checks=[];
function runtimeNetwork(page){const records=[],pending=[];page.on('response',response=>{if(response.url().includes('/character-runtime/'))pending.push(response.body().then(bytes=>records.push({url:response.url(),bytes:bytes.length})).catch(()=>{}));});return async()=>{await Promise.all(pending);return {requests:records.length,bytes:records.reduce((n,r)=>n+r.bytes,0)};};}
try {
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
  for(const sq of [from,to]){const p=await page.evaluate(sq=>window.view.screenOf(sq),sq);await page.mouse.click(p.x,p.y);}
  await page.waitForFunction(from=>window.view.scene.characterFrames.some(f=>f.square===from&&f.bank.includes('attack')&&f.time>100),from,{timeout:20000});
  await shot(page,`${character}-game-attack`);
  await page.waitForFunction(([from,to])=>!window.view.scene.animating&&!window.view.pos.board[from]&&window.view.pos.board[to]>0,[from,to],{timeout:15000});
  const trace=await page.evaluate(()=>bodyTrace),attack=trace.flatMap(t=>t.frames).filter(f=>f.square===from&&f.bank.includes('attack'));
  assert(attack.length>1,`${character}: timed body frames played`);
  const after=await page.evaluate(to=>window.view.scene.characterFrames.find(f=>f.square===to),to);assert(after,`${character}: accepted rest at destination`);
  const memory=await page.evaluate(()=>view.scene.characterMemory);assert(memory.peakBytes<=64*1024*1024,'decoded body cache stays within 64 MiB');
  const totalNetwork=await network(),moveNetwork={requests:totalNetwork.requests-initialNetwork.requests,bytes:totalNetwork.bytes-initialNetwork.bytes};assert(moveNetwork.requests<=180&&moveNetwork.bytes<=16*1024*1024,'one move loads a clip window, not the cast');
  checks.push({character,flipped,initialNetwork,moveNetwork,memory,still,after,attackSamples:attack.length,banks:[...new Set(trace.flatMap(t=>t.frames).map(f=>f.bank))]});
  if(character==='pawn'){await page.click('#undo');await page.waitForFunction(board=>!view.scene.animating&&view.pos.board.every((v,sq)=>v===board[sq]),originalBoard,{timeout:10000});checks.at(-1).undoRestored=true;await shot(page,'pawn-game-undo');}
  assertNoErrors(errors);await page.close();
 }
 // The ready cast and all six king designs draw in the real game with their separate cues.
 for(const [label,kings,fen,count] of [
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
 // Repaired Guard and king turns retain adjacent endpoint pixels and transforms in the shipped package.
 for(const [character,army,fen,from,to,kings]of [
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
  await page.evaluate(()=>{window.turnTrace=[];const capture=()=>{turnTrace.push(...view.scene.characterFrames);if(turnTrace.length<1600)requestAnimationFrame(capture);};capture();});
  for(const square of [from,to]){const p=await page.evaluate(square=>view.screenOf(square),square);await page.mouse.click(p.x,p.y);}
  try {await page.waitForFunction(([from,to])=>!view.scene.animating&&!view.pos.board[from]&&view.pos.board[to]>0,[from,to],{timeout:15000});} catch(error) { await writeFile(join(env('PLAYABLE_OUT'),label+'-failure.json'),JSON.stringify(await page.evaluate(([from,to,label])=>({label,from,to,board:[...view.pos.board],animating:view.scene.animating,text:document.body.innerText}),[from,to,label]),null,2));await shot(page,label+'-failure');throw error;}
  const samples=(await page.evaluate(()=>turnTrace)).filter(frame=>turns.some(bank=>bank.id===frame.bank));
  assert(samples.length>1,`${label}: ready turn frames played in the game`);
  for(const frame of samples){const bank=turns.find(bank=>bank.id===frame.bank);assert.equal(frame.sourceBankSha256,bank.sourceSha256);assert(bank.frames.some(f=>f.sourceSha256===frame.sourceSha256));}
  await shot(page,`${label}-turn-settled`);await page.click('#undo');await page.waitForFunction(board=>!view.scene.animating&&view.pos.board.every((value,square)=>value===board[square]),original);
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
