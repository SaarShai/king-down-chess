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
