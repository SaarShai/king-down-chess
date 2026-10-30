// Diagonal captures in the real game; the recordings keep both armies at normal speed.
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {env,launch,trapErrors,assertNoErrors} from './lib/checks.mjs';
import {turnRoute} from '../docs/2d-first-pieces/board/character-runtime.mjs';

const out=env('PLAYABLE_OUT'),manifest=JSON.parse(await readFile('public/character-runtime/manifest.json','utf8'));
await mkdir(out,{recursive:true});
const browser=await launch(),results=[];
const kings=[['frost','freeze'],['flame','strike'],['stratus','flight'],['mud','march'],['spirit','holylight'],['shadow','darkness']];
try {
 for(const [design,power] of kings){
  const context=await browser.newContext({viewport:{width:1100,height:950},recordVideo:{dir:out,size:{width:1100,height:950}}});
  const page=await context.newPage(),errors=trapErrors(page),video=page.video();
  await page.addInitScript(()=>sessionStorage.setItem('kingdown.title-seen','1'));
  for(const [army,fen,from,to,direction] of [
   ['white','7k/8/8/3p4/4K3/8/8/7R w - - 0 1',28,35,'NW'],
   ['black','7r/8/8/4k3/3P4/8/8/K7 b - - 0 1',36,27,'SW'],
   ...(design==='flame' ? [
    ['white','7k/8/8/8/3pK3/8/8/7R w - - 0 1',28,27,'W'],
    ['white','7k/8/8/4p3/4K3/8/8/7R w - - 0 1',28,36,'N'],
    ['black','7r/8/8/4kP2/8/8/8/K7 b - - 0 1',36,37,'E'],
    ['black','7r/8/8/4k3/4P3/8/8/K7 b - - 0 1',36,28,'S'],
   ] : []),
  ]){
   const url=new URL(env('PLAYABLE_URL'));url.searchParams.set('fen',fen);url.searchParams.set('players','human,human');url.searchParams.set('kings',`${design}:${power},${design}:${power}`);
   await page.goto(url.href);await page.waitForFunction(from=>window.view?.scene?.characterFrames?.some(f=>f.square===from),from,{timeout:15000});await page.evaluate(()=>view.ready());
   await page.waitForTimeout(500);
   const before=await page.evaluate(from=>view.scene.characterFrames.find(f=>f.square===from),from);
   const banks=manifest.banks.filter(b=>b.character===`king-${design}`&&b.army===army),rest=banks.filter(b=>b.kind==='idle').sort((a,b)=>Number(b.facing==='SE')-Number(a.facing==='SE'))[0];
   const route=turnRoute(banks.filter(b=>b.kind==='turn'),rest.facing,direction);assert(route?.length,`${design} ${army}: route exists`);
   const last=route.at(-1),target=(last.reverse?last.bank.frames[0]:last.bank.frames.at(-1)).sourceSha256;
   await page.evaluate(from=>{window.kingTrace=[];const take=()=>{if(window.kingTraceOn){kingTrace.push({at:performance.now(),playing:view.scene.playing,frame:view.scene.characterFrames.find(f=>f.square===from)});requestAnimationFrame(take);}};window.kingTraceOn=true;take();},from);
   for(const sq of [from,to]){const point=await page.evaluate(s=>view.screenOf(s),sq);await page.mouse.click(point.x,point.y);}
   await page.waitForFunction(([from,to])=>!view.scene.animating&&!view.pos.board[from]&&view.pos.board[to],[from,to],{timeout:15000});
   await page.waitForTimeout(350);
   const data=await page.evaluate(to=>{kingTraceOn=false;return {trace:kingTrace,after:view.scene.characterFrames.find(f=>f.square===to)};},to);
   const action=data.trace.filter(t=>t.playing==='blow');
   assert(action.length,`${design} ${army}: capture played`);
   {
    const frames=action.map(t=>t.frame).filter(Boolean),at=frames.findIndex(f=>f.sourceSha256===target),end=frames.findLastIndex(f=>f.sourceSha256===target);
    assert(at>=0&&end>at,`${design} ${army}: target frame is held`);
    assert(frames.slice(end+1).some(f=>f.sourceSha256!==target),`${design} ${army}: reverse turn plays`);
   }
   assert.equal(data.after?.sourceSha256,before.sourceSha256,`${design} ${army}: destination rest`);
   await page.click('#undo');await page.waitForFunction(([from,to])=>!view.scene.animating&&view.pos.board[from]&&view.pos.board[to],[from,to],{timeout:10000});
   await page.waitForFunction(([from,sha])=>view.scene.characterFrames.some(f=>f.square===from&&f.sourceSha256===sha),[from,before.sourceSha256]);
   results.push({design,army,target,rest:before.sourceSha256,samples:action.length});
   assertNoErrors(errors);
  }
  await context.close();await video.saveAs(join(out,`${design}.webm`));await video.delete();
  console.log(`ok ${design}: both armies, captures, rest and Undo`);
 }
 await writeFile(join(out,'king-capture-facing.json'),JSON.stringify(results,null,2));
}finally{await browser.close();}
