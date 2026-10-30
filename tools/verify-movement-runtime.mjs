// Real game moves and Undo with synthetic banks; source assets remain read-only.
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { createServer } from 'vite';
import { launch, trapErrors, assertNoErrors, env } from './lib/checks.mjs';

if (process.env.MOVEMENT_RECORD) {
 const characters=process.env.MOVEMENT_RECORD.split(',');
 const chars={pawn:'P',knight:'N',bishop:'B',rook:'R',queen:'Q',archer:'A',guard:'G',maester:'M',ogre:'O',paladin:'L',beast:'S',
  'king-frost':'K','king-flame':'K','king-shadow':'K','king-mud':'K','king-spirit':'K','king-stratus':'K'};
 for(const character of characters)assert(chars[character],`unknown character ${character}`);
 const out=process.env.MOVEMENT_RECORD_OUT;assert(out);await mkdir(out,{recursive:true});
 const server=await createServer({root:process.cwd(),configLoader:'runner',cacheDir:join(env('PLAYABLE_OUT'),'vite-cache'),define:{__KINGDOWN_CHARACTER_RUNTIME__:'true'},server:{host:'127.0.0.1',port:0,strictPort:false}});
 let browser;
 try {
  await server.listen();browser=await launch();
  for(const character of characters)for(const army of ['white','black']){
   const context=await browser.newContext({viewport:{width:1100,height:950},recordVideo:{dir:out,size:{width:1100,height:950}},serviceWorkers:'block',reducedMotion:'no-preference'});
   const page=await context.newPage(),errors=trapErrors(page);await page.addInitScript(()=>sessionStorage.setItem('kingdown.title-seen','1'));
   const piece=army==='white'?chars[character]:chars[character].toLowerCase();
   const whiteKing=character.startsWith('king-')&&army==='white'?'8':'K7';
   const blackKing=character.startsWith('king-')&&army==='black'?'8':'7k';
   const fen=`${blackKing}/p7/8/8/3${piece}4/8/P7/${whiteKing} ${army==='white'?'w':'b'} - - 0 1`;
   const url=new URL(`http://127.0.0.1:${server.httpServer.address().port}/`);url.searchParams.set('fen',fen);url.searchParams.set('players','human,human');
   if(character.startsWith('king-')){const design=character.slice(5),power={frost:'freeze',flame:'haste',shadow:'darkness',mud:'march',spirit:'holylight',stratus:'sacrifice'}[design];url.searchParams.set('kings',army==='white'?`${design}:${power},flame:haste`:`frost:freeze,${design}:${power}`);}
   await page.goto(url.href);await page.waitForFunction(()=>window.view?.scene?.characterFrames?.some(f=>f.square===27),null,{timeout:20000});await page.evaluate(()=>view.ready());
   assert(!/draw by insufficient/i.test(await page.locator('body').innerText()),'the result dialog must not cover the board');
   await page.evaluate(()=>{window.trace=[];window.traceActive=true;function tick(){if(!traceActive)return;trace.push({at:performance.now(),playing:view.scene.playing,animating:view.scene.animating,frames:view.scene.characterFrames.filter(f=>f.square===27)});requestAnimationFrame(tick);}tick();});
   const start=await page.evaluate(()=>performance.now()),cases=[];
   for(const [name,to] of [['forward',army==='white'?35:19],['diagonal',army==='white'?36:20],['backward',army==='white'?19:35]]){
    const at=await page.evaluate(()=>performance.now());
    const ok=await page.evaluate(async to=>view.scene.play({from:27,to,captures:[]}),to);assert(ok,`${character} ${army} ${name} animation completes`);
    const end=await page.evaluate(()=>performance.now());cases.push({name,to,start:at-start,end:end-start});
    await page.waitForTimeout(500);
   }
   const trace=await page.evaluate(()=>{traceActive=false;return trace;});
   await writeFile(join(out,`${character}-${army}.json`),JSON.stringify({character,army,fen,start,cases,trace},null,2));
   assertNoErrors(errors);const video=page.video();await context.close();await rename(await video.path(),join(out,`${character}-${army}.webm`));
   console.log(`ok recorded ${character} ${army}: ${cases.map(c=>c.name).join(', ')}`);
  }
 } finally {await browser?.close();await server.close();}
} else {
const assets=process.env.MOVEMENT_BASELINE_DIR;
assert(assets,'Set MOVEMENT_BASELINE_DIR to the read-only pinned character package');
const bytes=await readFile(join(assets,'manifest.json'));
const manifest=JSON.parse(bytes);
const real=manifest.banks.filter(b=>b.kind==='movement');
if(!real.length){
 assert.equal(createHash('sha256').update(bytes).digest('hex'),'05ff4c215cd601486863cc00efbf6c080e6fa8fcb29c410380da6d8e98807f9e');
 assert.equal(manifest.banks.length,468);assert(!manifest.banks.some(b=>b.kind==='movement'));
}else{
 assert.deepEqual(real.map(b=>[b.character,b.army,b.facing]).sort(),[['pawn','white','E'],['pawn','white','W']]);
}
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
 if(real.length){
  const page=await browser.newPage({viewport:{width:1100,height:950},serviceWorkers:'block',reducedMotion:'no-preference'}),errors=trapErrors(page);
  await page.route('**/character-runtime/**',async route=>{const path=new URL(route.request().url()).pathname.split('/character-runtime/')[1];if(path==='manifest.json')return route.fulfill({json:manifest});assert(!path.includes('..'));return route.fulfill({body:await readFile(join(assets,path)),contentType:path.endsWith('.webp')?'image/webp':path.endsWith('.png')?'image/png':'text/javascript'});});
  await page.addInitScript(()=>sessionStorage.setItem('kingdown.title-seen','1'));
  const url=new URL(`http://127.0.0.1:${server.httpServer.address().port}/`);url.searchParams.set('fen','7k/8/8/8/3P4/8/8/K7 w - - 0 1');url.searchParams.set('players','human,human');
  await page.goto(url.href);await page.waitForFunction(()=>window.view?.scene?.characterFrames?.some(f=>f.square===27),null,{timeout:15000});await page.evaluate(()=>view.ready());
  const samples=await page.evaluate(async()=>{
   const frames=[],canvas=view.canvas,small=document.createElement('canvas');let last='';small.width=Math.round(canvas.getBoundingClientRect().width);small.height=Math.round(canvas.getBoundingClientRect().height);const ctx=small.getContext('2d');let active=true;
   function capture(){const f=view.scene.characterFrames.find(f=>f.square===27);if(f){const key=`${f.bank}:${f.time}`;if(key!==last){last=key;ctx.drawImage(canvas,0,0,small.width,small.height);frames.push({bank:f.bank,time:f.time,image:small.toDataURL('image/png')});}}if(active)requestAnimationFrame(capture);}
   capture();await view.scene.play({from:27,to:28,captures:[]});active=false;const board=view.pos.board.slice();board[28]=board[27];board[27]=0;view.scene.setPosition({...view.pos,board});await new Promise(resolve=>setTimeout(resolve,250));const rest=view.scene.characterFrames.find(f=>f.square===28);if(rest){ctx.drawImage(canvas,0,0,small.width,small.height);frames.push({bank:rest.bank,time:rest.time,image:small.toDataURL('image/png')});}view.scene.setPosition(view.pos);return frames;
  });
  const movement=real.find(b=>b.facing==='E'),walk=samples.filter(f=>f.bank===movement.id);
  assert(walk.some(f=>f.time===movement.frames[0].timeMs),'real E first frame');assert(walk.some(f=>f.time===movement.frames.at(-1).timeMs),'real E last frame');assert(walk.length>1,'real E movement samples');
  if(process.env.MOVEMENT_MEDIA_DIR){await mkdir(process.env.MOVEMENT_MEDIA_DIR,{recursive:true});for(const [i,f] of samples.entries())await writeFile(join(process.env.MOVEMENT_MEDIA_DIR,`${String(i).padStart(2,'0')}-${f.bank}-${f.time}.png`),Buffer.from(f.image.split(',')[1],'base64'));}
  const reverse=await page.evaluate(async()=>{const frames=[];let active=true;function capture(){const f=view.scene.characterFrames.find(f=>f.square===27);if(f)frames.push({bank:f.bank,time:f.time});if(active)requestAnimationFrame(capture);}capture();await view.scene.play({from:27,to:26,captures:[]});active=false;return frames;});
  const west=real.find(b=>b.facing==='W');assert(reverse.some(f=>f.bank===west.id&&f.time===west.frames[0].timeMs),'real W first frame');assert(reverse.some(f=>f.bank===west.id&&f.time===west.frames.at(-1).timeMs),'real W last frame');
  assertNoErrors(errors);console.log(`ok real Pawn E and W movement: ${walk.length} E frames; ${samples.length} game-size samples`);await page.close();
 }
}finally{await browser?.close();await server.close();}

}
