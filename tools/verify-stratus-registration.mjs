import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import sharp from 'sharp';
import {join} from 'node:path';
import {env,launch,shot,trapErrors,assertNoErrors} from './lib/checks.mjs';
// Check the selected rest authority and every padded turn join in the built package.
const root=join(process.cwd(),'public/character-runtime');
const manifest=JSON.parse(await readFile(join(root,'manifest.json'),'utf8'));
const assets=JSON.parse(await readFile(join(root,'assets.json'),'utf8'));
for(const army of ['white','black']) {
 const rows=manifest.banks.filter(b=>b.character==='king-stratus'&&b.army===army&&['idle','turn'].includes(b.kind));
 const turns=rows.filter(b=>b.kind==='turn'),idles=rows.filter(b=>b.kind==='idle');
 assert.equal(turns.length,8);assert.equal(idles.length,2);
 const height=army==='black'?266.5:267;
 for(const bank of rows){assert.deepEqual(bank.pivot,[192,345]);assert.equal(bank.registrationHeightPx,height);}
 const rest=idles.find(b=>b.id===`king-stratus-${army}-idle-continuous-4s`);assert(rest);assert.equal(rest.facing,'SE');
 const restAsset=assets.find(a=>a.sourceSha256===rest.frames[0].sourceSha256);assert(restAsset);assert.equal(rest.pivot[1]-restAsset.top/2,height);
 async function equal(a,b){
  const width=Math.max(a.bank.canvasSize[0],b.bank.canvasSize[0]),height=Math.max(a.bank.canvasSize[1],b.bank.canvasSize[1]);
  async function pixels({bank,frame}){return sharp(join(root,frame.url)).ensureAlpha().extend({top:0,left:0,right:width-bank.canvasSize[0],bottom:height-bank.canvasSize[1],background:{r:0,g:0,b:0,alpha:0}}).raw().toBuffer();}
  assert((await pixels(a)).equals(await pixels(b)),`${army} endpoint pixels differ`);
 }
 for(const direction of ['N','NE','E','SE','S','SW','W','NW']){
  const ends=turns.flatMap(bank=>[{direction:bank.from,bank,frame:bank.frames[0]},{direction:bank.to,bank,frame:bank.frames.at(-1)}]).filter(end=>end.direction===direction);
  assert.equal(ends.length,2,`${army} ${direction}`);await equal(ends[0],ends[1]);
  if(direction==='SE')for(const bank of idles)await equal({bank,frame:bank.frames[0]},ends[0]);
 }
}
const browser=await launch(),cases=[];
try {
 for(const army of ['white','black'])for(const [direction,to] of [['N',43],['NE',44],['E',36],['SE',28],['S',27],['SW',26],['W',34],['NW',42]]) {
  const fen=army==='white'?'6k1/p7/8/3K4/8/8/P7/8 w - - 0 1':'8/7p/8/3k4/8/8/P7/K7 b - - 0 1',flipped=false;
  const banks=manifest.banks.filter(b=>b.character==='king-stratus'&&b.army===army&&b.kind==='turn');
  const {turnRoute}=await import('../docs/2d-first-pieces/board/character-runtime.mjs');const route=turnRoute(banks,'SE',direction);assert(route);const expected=route.map(p=>p.bank.id);
  const from=35,page=await browser.newPage({viewport:{width:1100,height:950}}),errors=trapErrors(page);
  await page.addInitScript(()=>sessionStorage.setItem('kingdown.title-seen','1'));
  const url=new URL(env('PLAYABLE_URL'));url.searchParams.set('fen',fen);url.searchParams.set('players','human,human');url.searchParams.set('kings','stratus:flight,stratus:flight');
  await page.goto(url.href);await page.waitForFunction(s=>window.view?.scene?.characterFrames?.some(f=>f.square===s),from);await page.evaluate(()=>view.ready());if(flipped){await page.evaluate(()=>view.flip(true));await page.waitForFunction(s=>view.scene.characterFrames.some(f=>f.square===s&&f.foot.x===536),from);}
  const rest=await page.evaluate(s=>({frame:view.scene.characterFrames.find(f=>f.square===s),foot:view.scene.foot(s)}),from);
  assert.equal(rest.frame.bank,`king-stratus-${army}-idle-continuous-4s`);assert.deepEqual(rest.frame.foot,rest.foot);
  await page.evaluate(()=>{window.joinTrace=[];window.traceOn=true;const tick=()=>{if(traceOn){joinTrace.push({at:performance.now(),frames:view.scene.characterFrames,animating:view.scene.animating});requestAnimationFrame(tick);}};tick();});
  for(const sq of [from,to]){const p=await page.evaluate(s=>view.screenOf(s),sq);await page.mouse.click(p.x,p.y);}
  try { await page.waitForFunction(([from,to])=>!view.scene.animating&&!view.pos.board[from]&&view.pos.board[to]>0,[from,to],{timeout:15000}); } catch (error) { console.log(JSON.stringify(await page.evaluate(()=>({board:[...view.pos.board],animating:view.scene.animating,text:document.body.innerText,trace:joinTrace.slice(-8)})))); throw error; }
  await page.waitForFunction(s=>view.scene.characterFrames.some(f=>f.square===s),to);
  const data=await page.evaluate(([from,to])=>{traceOn=false;return {trace:joinTrace,after:view.scene.characterFrames.find(f=>f.square===to),dest:view.scene.foot(to)}},[from,to]);
  const actor=data.trace.flatMap(s=>s.frames.filter(f=>f.square===from));
  for(const id of expected)assert(actor.some(f=>f.bank===id),`${army} ${to}: ${id}`);
  const frames=actor.filter(f=>expected.includes(f.bank));const first=expected.map(id=>frames.findIndex(f=>f.bank===id)),last=expected.map(id=>frames.findLastIndex(f=>f.bank===id));
  assert(first.every((v,i)=>v>=0&&(!i||v>first[i-1])),`${army} ${direction}: outward sequence`);assert(last.every((v,i)=>v>first[i]&&(!i||v<last[i-1])),`${army} ${direction}: return sequence`);
  for(const [i,id] of expected.entries()){const outward=frames.slice(first[i],last[i]+1).filter(f=>f.bank===id);assert(outward.some((f,j)=>j&&f.time>outward[j-1].time),`${army} ${direction} ${id}: forward frames`);assert(outward.some((f,j)=>j&&f.time<outward[j-1].time),`${army} ${direction} ${id}: reverse frames`);}
  for(const f of frames){assert.equal(f.scale,rest.frame.scale);assert.deepEqual(f.pivot,rest.frame.pivot);}assert.equal(rest.frame.scale,130/(army==='black'?266.5:267));
  const memory=await page.evaluate(()=>view.scene.characterMemory);assert(memory.peakBytes<=64*1024*1024);
  assert.equal(data.after.sourceSha256,rest.frame.sourceSha256);assert.deepEqual(data.after.foot,data.dest);
  await shot(page,`stratus-${army}-${to}-settled`);await page.click('#undo');await page.waitForFunction(([from,to])=>!view.scene.animating&&view.pos.board[from]>0&&!view.pos.board[to],[from,to]);await page.waitForFunction(([from,sha])=>view.scene.characterFrames.some(f=>f.square===from&&f.sourceSha256===sha),[from,rest.frame.sourceSha256]);const undo=await page.evaluate(s=>view.scene.characterFrames.find(f=>f.square===s),from);assert.deepEqual([undo.foot,undo.pivot,undo.scale],[rest.frame.foot,rest.frame.pivot,rest.frame.scale]);assertNoErrors(errors);
  cases.push({army,from,to,flipped:!!flipped,direction,first,last,memory,rest,after:data.after,undo,dest:data.dest,banks:[...new Set(actor.map(f=>f.bank))],samples:actor.length,trace:data.trace});await page.close();
 }
 await writeFile(join(env('PLAYABLE_OUT'),'stratus-runtime-join.json'),JSON.stringify(cases,null,2));console.log(`ok: ${cases.length} game route cases`);
}finally{await browser.close();}
