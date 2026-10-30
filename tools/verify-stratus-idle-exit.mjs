// Observe selected-idle handoffs through the game and real animation frames.
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {env,launch,trapErrors,assertNoErrors} from './lib/checks.mjs';
import {turnRoute} from '../docs/2d-first-pieces/board/character-runtime.mjs';

const manifest=JSON.parse(await readFile('public/character-runtime/manifest.json','utf8'));
const browser=await launch(),results=[];
try {
 for(const army of ['white','black'])for(const bankKind of ['continuous-4s','occasional-12s'])for(const [phase,lo,hi] of [['early',1291,1500],['middle',1900,2085],['late',2500,2708]]){
  const page=await browser.newPage({viewport:{width:1100,height:950}}),errors=trapErrors(page);
  await page.addInitScript(()=>sessionStorage.setItem('kingdown.title-seen','1'));
  const url=new URL(env('PLAYABLE_URL'));
  url.searchParams.set('fen',army==='white'?'6k1/p7/8/3K4/8/8/P7/8 w - - 0 1':'8/7p/8/3k4/8/8/P7/K7 b - - 0 1');
  url.searchParams.set('players','human,human');url.searchParams.set('kings','stratus:flight,stratus:flight');
  await page.goto(url.href);await page.waitForFunction(()=>window.view?.scene?.characterFrames?.some(f=>f.square===35));await page.evaluate(()=>view.ready());
  await page.evaluate(()=>{const scene=view.scene,original=scene.play.bind(scene);scene.play=(move,options)=>{if(move.from===35){window.beforeExit=scene.characterFrames.find(f=>f.square===35);window.exitTrace=[];window.exitTraceOn=true;const sample=()=>{if(exitTraceOn){exitTrace.push({at:performance.now(),frame:scene.characterFrames.find(f=>f.square===35),start:scene.characterExit,animating:scene.animating});requestAnimationFrame(sample);}};requestAnimationFrame(sample);}return original(move,options);};});
  const click=async sq=>{const p=await page.evaluate(s=>view.screenOf(s),sq);await page.mouse.click(p.x,p.y);};
  await click(35);
  const bankId=`king-stratus-${army}-idle-${bankKind}`;
  await page.waitForFunction(([id,lo,hi])=>{const f=view.scene.characterFrames.find(f=>f.square===35);return f?.bank===id&&f.time>=lo&&f.time<=hi;},[bankId,lo,hi],{timeout:12000});
  await click(43);
  await page.waitForFunction(()=>!view.scene.animating&&!view.pos.board[35]&&view.pos.board[43],null,{timeout:10000});
  const data=await page.evaluate(()=>{exitTraceOn=false;return {before:beforeExit,trace:exitTrace,memory:view.scene.characterMemory};});
  const idle=manifest.banks.find(b=>b.id===bankId),rest=idle.frames[0].sourceSha256;
  assert.equal(data.before.bank,bankId);assert.notEqual(data.before.sourceSha256,rest);
  const relevant=data.trace.filter(x=>x.frame),firstTurn=relevant.findIndex(x=>x.frame.bank!==bankId);
  assert(firstTurn>0,`${army} ${bankKind} ${phase}: no turn`);
  const exit=relevant.slice(0,firstTurn),turn=relevant[firstTurn];
  assert.equal(exit[0].frame.sourceSha256,data.before.sourceSha256,'the first observed frame is the last drawn body');
  assert.equal(turn.frame.sourceSha256,rest,'turn begins at exact rest');
  let path=null;for(let i=0;i<idle.frames.length;i++)if(idle.frames[i].sourceSha256===data.before.sourceSha256)for(let j=0;j<idle.frames.length;j++)if(idle.frames[j].sourceSha256===rest&&(!path||Math.abs(i-j)<Math.abs(path[0]-path[1])))path=[i,j];
  assert(path);const step=Math.sign(path[1]-path[0]),allowed=[];for(let i=path[0];;i+=step){allowed.push(idle.frames[i].sourceSha256);if(i===path[1])break;}
  let cursor=0;for(const sample of exit){const index=allowed.indexOf(sample.frame.sourceSha256,cursor);assert(index>=0,'exit follows the original frames toward rest');cursor=index;}
  const changed=exit.findIndex(x=>x.frame.sourceSha256!==data.before.sourceSha256);assert(changed>=0,'exit changes the pose');
  const start=exit.find(x=>x.start!=null)?.start;assert(start!=null,'exit clock started');const duration=turn.at-start;assert(duration>=190&&duration<=350,`exit sampled ${duration} ms`);
  for(const sample of [...exit,turn]){assert.deepEqual(sample.frame.pivot,data.before.pivot);assert.equal(sample.frame.scale,data.before.scale);assert.deepEqual(sample.frame.foot,data.before.foot);}
  assert(data.memory.peakBytes<=64*1024*1024);
  await page.click('#undo');await page.waitForFunction(()=>!view.scene.animating&&view.pos.board[35]&&!view.pos.board[43],null,{timeout:10000});
  assertNoErrors(errors);results.push({army,bankKind,phase,duration,samples:exit.length,before:data.before.sourceSha256,rest,memory:data.memory});await page.close();
 }
 // Refresh the actual view while its king stays selected, then move from the newly drawn idle.
 for(const army of ['white','black'])for(const refresh of ['position','kings']){
  const page=await browser.newPage({viewport:{width:1100,height:950}}),errors=trapErrors(page);await page.addInitScript(()=>sessionStorage.setItem('kingdown.title-seen','1'));
  const url=new URL(env('PLAYABLE_URL'));url.searchParams.set('fen',army==='white'?'6k1/p7/8/3K4/8/8/P7/8 w - - 0 1':'8/7p/8/3k4/8/8/P7/K7 b - - 0 1');url.searchParams.set('players','human,human');url.searchParams.set('kings','stratus:flight,stratus:flight');
  await page.goto(url.href);await page.waitForFunction(()=>window.view?.scene?.characterFrames?.some(f=>f.square===35));await page.evaluate(()=>view.ready());
  const click=async sq=>{const p=await page.evaluate(s=>view.screenOf(s),sq);await page.mouse.click(p.x,p.y);};await click(35);
  const bankId=`king-stratus-${army}-idle-continuous-4s`,raised=([id])=>{const f=view.scene.characterFrames.find(f=>f.square===35);return f?.bank===id&&f.time>=1900&&f.time<=2085;};
  await page.waitForFunction(raised,[bankId],{timeout:10000});
  const frameBefore=await page.evaluate(([kind,side])=>{if(kind==='position')view.sync(view.pos);else {const kings=[...view.scene.kings];kings[side==='white'?1:0]='frost';view.scene.setKings(kings);}view.highlight({selected:35});return view.scene.frames;},[refresh,army]);
  await page.waitForFunction(([id,frame])=>{const f=view.scene.characterFrames.find(f=>f.square===35);return view.scene.frames>frame&&f?.bank===id&&f.time>=1291&&f.time<=2708;},[bankId,frameBefore],{timeout:10000});
  await page.evaluate(()=>{const scene=view.scene,play=scene.play.bind(scene);scene.play=(move,options)=>{window.refreshStart=scene.characterFrames.find(f=>f.square===35);window.refreshTrace=[];window.refreshTraceOn=true;const sample=()=>{if(refreshTraceOn){refreshTrace.push({at:performance.now(),frame:scene.characterFrames.find(f=>f.square===35),start:scene.characterExit});requestAnimationFrame(sample);}};requestAnimationFrame(sample);return play(move,options);};});
  await click(43);await page.waitForFunction(()=>!view.scene.animating&&!view.pos.board[35]&&view.pos.board[43],null,{timeout:10000});
  const data=await page.evaluate(()=>{refreshTraceOn=false;return {before:refreshStart,trace:refreshTrace};});const idle=manifest.banks.find(b=>b.id===bankId),rest=idle.frames[0].sourceSha256;
  assert.notEqual(data.before.sourceSha256,rest);const exit=data.trace.filter(x=>x.start!=null&&x.frame?.bank===bankId);assert(exit.length,`${army} ${refresh}: exit after refresh`);assert.equal(exit[0].frame.sourceSha256,data.before.sourceSha256);assert(data.trace.some(x=>x.start!=null&&x.frame?.bank!==bankId&&x.frame?.sourceSha256===rest),'turn joins exact rest');
  assertNoErrors(errors);results.push({case:'selected-refresh',army,refresh,first:data.before.sourceSha256,samples:exit.length});await page.close();
 }
 // A same-task move after refresh must still use the image already on screen.
 for(const army of ['white','black'])for(const refresh of ['position','kings']){
  const page=await browser.newPage({viewport:{width:1100,height:950}}),errors=trapErrors(page);await page.addInitScript(()=>sessionStorage.setItem('kingdown.title-seen','1'));
  const url=new URL(env('PLAYABLE_URL'));url.searchParams.set('fen',army==='white'?'6k1/p7/8/3K4/8/8/P7/8 w - - 0 1':'8/7p/8/3k4/8/8/P7/K7 b - - 0 1');url.searchParams.set('players','human,human');url.searchParams.set('kings','stratus:flight,stratus:flight');
  await page.goto(url.href);await page.waitForFunction(()=>window.view?.scene?.characterFrames?.some(f=>f.square===35));await page.evaluate(()=>view.ready());const point=await page.evaluate(()=>view.screenOf(35));await page.mouse.click(point.x,point.y);
  await page.waitForFunction(()=>{const f=view.scene.characterFrames.find(f=>f.square===35);return f?.time>=1900&&f.time<=2085;},{},{timeout:10000});
  const before=await page.evaluate(([kind,side])=>{const scene=view.scene,play=scene.play.bind(scene),painted=scene.characterFrames.find(f=>f.square===35);scene.play=(move,options)=>{window.immediateFrames=[];window.immediateTrace=true;const sample=()=>{if(immediateTrace){immediateFrames.push({start:scene.characterExit,frame:scene.characterFrames.find(f=>f.square===35)});requestAnimationFrame(sample);}};requestAnimationFrame(sample);return play(move,options);};if(kind==='position')view.sync(view.pos);else {const kings=[...scene.kings];kings[side==='white'?1:0]='frost';scene.setKings(kings);}view.highlight({selected:35});view.onSquareClick(43,false);return painted;},[refresh,army]);
  await page.waitForFunction(()=>!view.scene.animating&&!view.pos.board[35]&&view.pos.board[43],null,{timeout:10000});const trace=await page.evaluate(()=>{immediateTrace=false;return immediateFrames;});const exit=trace.filter(x=>x.start!=null&&x.frame?.bank===before.bank);assert(exit.length,`${army} ${refresh}: immediate exit`);assert.equal(exit[0].frame.sourceSha256,before.sourceSha256);assertNoErrors(errors);results.push({case:'immediate-refresh-move',army,refresh,before:before.sourceSha256,samples:exit.length});await page.close();
 }
 // A cold idle image keeps the selected king at rest. Its late completion cannot restart an old move.
 {
  const page=await browser.newPage({viewport:{width:1100,height:950}}),errors=trapErrors(page);
  await page.addInitScript(()=>sessionStorage.setItem('kingdown.title-seen','1'));
  const url=new URL(env('PLAYABLE_URL'));url.searchParams.set('fen','6k1/p7/8/3K4/8/8/P7/8 w - - 0 1');url.searchParams.set('players','human,human');url.searchParams.set('kings','stratus:flight,stratus:flight');
  const idle=manifest.banks.find(b=>b.id==='king-stratus-white-idle-continuous-4s'),rest=idle.frames[0],blocked=idle.frames.find(f=>f.url!==rest.url);
  let release;const gate=new Promise(resolve=>{release=resolve;});await page.route(new URL(blocked.url,new URL('/character-runtime/manifest.json',url)).href,async route=>{await gate;await route.continue().catch(()=>{});});
  await page.goto(url.href);await page.waitForFunction(()=>window.view?.scene?.characterFrames?.some(f=>f.square===35));await page.evaluate(()=>view.ready());
  const click=async sq=>{const p=await page.evaluate(s=>view.screenOf(s),sq);await page.mouse.click(p.x,p.y);};await click(35);await page.waitForTimeout(2300);
  assert.equal(await page.evaluate(()=>view.scene.characterFrames.find(f=>f.square===35)?.sourceSha256),rest.sourceSha256,'cold idle stays at rest');
  await click(43);await page.waitForFunction(()=>!view.scene.animating&&!view.pos.board[35]&&view.pos.board[43],null,{timeout:10000});await page.click('#undo');await page.waitForFunction(()=>!view.scene.animating&&view.pos.board[35]&&!view.pos.board[43]);release();await page.waitForTimeout(1200);
  assert.equal(await page.evaluate(()=>view.scene.animating),false,'late idle image cannot replay move');assertNoErrors(errors);results.push({case:'cold-idle-and-late-image'});await page.close();
 }
 // Undo during the exit must cancel it and every later preparation callback.
 {
  const page=await browser.newPage({viewport:{width:1100,height:950}}),errors=trapErrors(page);await page.addInitScript(()=>sessionStorage.setItem('kingdown.title-seen','1'));
  const url=new URL(env('PLAYABLE_URL'));url.searchParams.set('fen','6k1/p7/8/3K4/8/8/P7/8 w - - 0 1');url.searchParams.set('players','human,human');url.searchParams.set('kings','stratus:flight,stratus:flight');
  await page.goto(url.href);await page.waitForFunction(()=>window.view?.scene?.characterFrames?.some(f=>f.square===35));await page.evaluate(()=>view.ready());
  const click=async sq=>{const p=await page.evaluate(s=>view.screenOf(s),sq);await page.mouse.click(p.x,p.y);};await click(35);await page.waitForFunction(()=>{const f=view.scene.characterFrames.find(f=>f.square===35);return f?.time>=1900&&f.time<=2085;});await click(43);
  await page.waitForFunction(()=>view.scene.characterExit!=null&&performance.now()-view.scene.characterExit<150);await page.keyboard.press('z');await page.waitForFunction(()=>!view.scene.animating&&view.pos.board[35]&&!view.pos.board[43]);await page.waitForTimeout(1200);
  assert.equal(await page.evaluate(()=>view.scene.animating),false,'Undo prevents late replay');assertNoErrors(errors);results.push({case:'undo-during-exit'});await page.close();
 }
 // A pointer on Undo must reach the rewind while the selected body is still exiting.
 {
  const page=await browser.newPage({viewport:{width:1100,height:950}}),errors=trapErrors(page);await page.addInitScript(()=>sessionStorage.setItem('kingdown.title-seen','1'));
  const url=new URL(env('PLAYABLE_URL'));url.searchParams.set('fen','6k1/p7/8/3K4/8/8/P7/8 w - - 0 1');url.searchParams.set('players','human,human');url.searchParams.set('kings','stratus:flight,stratus:flight');
  await page.goto(url.href);await page.waitForFunction(()=>window.view?.scene?.characterFrames?.some(f=>f.square===35));await page.evaluate(()=>view.ready());
  await page.evaluate(()=>{window.pointerRewinds=0;const rewind=view.scene.rewindUndo.bind(view.scene);view.scene.rewindUndo=()=>{pointerRewinds++;return rewind();};});
  const click=async sq=>{const p=await page.evaluate(s=>view.screenOf(s),sq);await page.mouse.click(p.x,p.y);};await click(35);await page.waitForFunction(()=>{const f=view.scene.characterFrames.find(f=>f.square===35);return f?.time>=1900&&f.time<=2085;});await click(43);
  await page.waitForFunction(()=>view.scene.characterExit!=null&&performance.now()-view.scene.characterExit<150);await page.locator('#undo').click({force:true});
  await page.waitForFunction(()=>!view.scene.animating&&view.pos.board[35]&&!view.pos.board[43]);assert.equal(await page.evaluate(()=>pointerRewinds),1,'pointer Undo starts the retained rewind');
  assertNoErrors(errors);results.push({case:'pointer-undo-during-exit'});await page.close();
 }
 // Undo while the king glides and immediately after it lands.
 for(const when of ['glide','landed']){
  const page=await browser.newPage({viewport:{width:1100,height:950}}),errors=trapErrors(page);await page.addInitScript(()=>sessionStorage.setItem('kingdown.title-seen','1'));
  const url=new URL(env('PLAYABLE_URL'));url.searchParams.set('fen','6k1/p7/8/3K4/8/8/P7/8 w - - 0 1');url.searchParams.set('players','human,human');url.searchParams.set('kings','stratus:flight,stratus:flight');
  await page.goto(url.href);await page.waitForFunction(()=>window.view?.scene?.characterFrames?.some(f=>f.square===35));await page.evaluate(()=>view.ready());
  await page.evaluate(()=>{window.glideRewinds=0;const rewind=view.scene.rewindUndo.bind(view.scene);view.scene.rewindUndo=()=>{glideRewinds++;return rewind();};});
  const click=async sq=>{const p=await page.evaluate(s=>view.screenOf(s),sq);await page.mouse.click(p.x,p.y);};await click(35);await click(43);
  if(when==='glide')await page.waitForFunction(()=>{const f=view.scene.characterFrames.find(f=>f.square===35),start=view.scene.foot(35);return view.scene.animating&&f&&Math.hypot(f.foot.x-start.x,f.foot.y-start.y)>20;},null,{timeout:10000});
  else await page.waitForFunction(()=>!view.scene.animating&&!view.pos.board[35]&&view.pos.board[43],null,{timeout:10000});
  await page.keyboard.press('z');await page.waitForFunction(()=>!view.scene.animating&&view.pos.board[35]&&!view.pos.board[43],null,{timeout:10000});
  assert.equal(await page.evaluate(()=>glideRewinds),1,`${when}: Undo uses retained rewind`);assertNoErrors(errors);results.push({case:`undo-${when}`});await page.close();
 }
 // Hold a turn endpoint, cancel during preparation, then deliver it after Undo.
 {
  const page=await browser.newPage({viewport:{width:1100,height:950}}),errors=trapErrors(page);await page.addInitScript(()=>sessionStorage.setItem('kingdown.title-seen','1'));
  const url=new URL(env('PLAYABLE_URL'));url.searchParams.set('fen','6k1/p7/8/3K4/8/8/P7/8 w - - 0 1');url.searchParams.set('players','human,human');url.searchParams.set('kings','stratus:flight,stratus:flight');
  const banks=manifest.banks.filter(b=>b.character==='king-stratus'&&b.army==='white'),rest=banks.find(b=>b.kind==='idle'),route=turnRoute(banks.filter(b=>b.kind==='turn'),'SE','N');
  const blocked=route.flatMap(p=>[p.bank.frames[0],p.bank.frames.at(-1)]).find(f=>f.url!==rest.frames[0].url);assert(blocked);
  let release,hit;const gate=new Promise(resolve=>{release=resolve;}),held=new Promise(resolve=>{hit=resolve;});await page.route(new URL(blocked.url,new URL('/character-runtime/manifest.json',url)).href,async route=>{hit();await gate;await route.continue().catch(()=>{});});
  await page.goto(url.href);await page.waitForFunction(()=>window.view?.scene?.characterFrames?.some(f=>f.square===35));await page.evaluate(()=>view.ready());
  const click=async sq=>{const p=await page.evaluate(s=>view.screenOf(s),sq);await page.mouse.click(p.x,p.y);};await click(35);await page.waitForFunction(()=>{const f=view.scene.characterFrames.find(f=>f.square===35);return f?.time>=1900&&f.time<=2085;});await click(43);await Promise.race([held,page.waitForTimeout(3000).then(()=>{throw Error('turn endpoint was not held');})]);
  assert.equal(await page.evaluate(()=>view.scene.animating),true);await page.keyboard.press('z');await page.waitForFunction(()=>!view.scene.animating&&view.pos.board[35]&&!view.pos.board[43]);release();await page.waitForTimeout(1200);assert.equal(await page.evaluate(()=>view.scene.animating),false);
  // A different selection cannot consume the old king's captured body.
  await click(35);await page.waitForFunction(()=>{const f=view.scene.characterFrames.find(f=>f.square===35);return f?.time>=1900&&f.time<=2085;});await click(8);await click(16);
  await page.waitForFunction(()=>!view.scene.animating&&!view.pos.board[8]&&view.pos.board[16]);assert.equal(await page.evaluate(()=>view.scene.characterExit),null);assertNoErrors(errors);results.push({case:'undo-during-preparation-and-selection-change'});await page.close();
 }
 // A king already on rest starts its turn without a needless exit delay.
 {
  const page=await browser.newPage({viewport:{width:1100,height:950}}),errors=trapErrors(page);await page.addInitScript(()=>sessionStorage.setItem('kingdown.title-seen','1'));
  const url=new URL(env('PLAYABLE_URL'));url.searchParams.set('fen','6k1/p7/8/3K4/8/8/P7/8 w - - 0 1');url.searchParams.set('players','human,human');url.searchParams.set('kings','stratus:flight,stratus:flight');
  await page.goto(url.href);await page.waitForFunction(()=>window.view?.scene?.characterFrames?.some(f=>f.square===35));await page.evaluate(()=>view.ready());
  await page.evaluate(()=>{window.sawExit=false;const check=()=>{if(view.scene.characterExit!=null)sawExit=true;requestAnimationFrame(check);};requestAnimationFrame(check);});
  const click=async sq=>{const p=await page.evaluate(s=>view.screenOf(s),sq);await page.mouse.click(p.x,p.y);};await click(35);await page.waitForFunction(()=>{const f=view.scene.characterFrames.find(f=>f.square===35);return f?.time>=400&&f.time<1200;});await click(43);
  await page.waitForFunction(()=>!view.scene.animating&&!view.pos.board[35]&&view.pos.board[43]);assert.equal(await page.evaluate(()=>sawExit),false);assertNoErrors(errors);results.push({case:'rest-has-no-exit'});await page.close();
 }
 // The system reduced-motion setting keeps the idle at rest and skips the move animation.
 {
  const page=await browser.newPage({viewport:{width:1100,height:950},reducedMotion:'reduce'}),errors=trapErrors(page);await page.addInitScript(()=>sessionStorage.setItem('kingdown.title-seen','1'));
  const url=new URL(env('PLAYABLE_URL'));url.searchParams.set('fen','6k1/p7/8/3K4/8/8/P7/8 w - - 0 1');url.searchParams.set('players','human,human');url.searchParams.set('kings','stratus:flight,stratus:flight');
  await page.goto(url.href);await page.waitForFunction(()=>window.view?.scene?.characterFrames?.some(f=>f.square===35));await page.evaluate(()=>view.ready());
  const click=async sq=>{const p=await page.evaluate(s=>view.screenOf(s),sq);await page.mouse.click(p.x,p.y);};await click(35);await page.waitForTimeout(2300);
  const rest=manifest.banks.find(b=>b.id==='king-stratus-white-idle-continuous-4s').frames[0].sourceSha256;
  assert.equal(await page.evaluate(()=>view.scene.characterFrames.find(f=>f.square===35)?.sourceSha256),rest);await click(43);await page.waitForFunction(()=>!view.pos.board[35]&&view.pos.board[43]);
  assert.equal(await page.evaluate(()=>view.scene.animating),false);await page.click('#undo');await page.waitForFunction(()=>view.pos.board[35]&&!view.pos.board[43]);assertNoErrors(errors);results.push({case:'reduced-motion'});await page.close();
 }
 await mkdir(env('PLAYABLE_OUT'),{recursive:true});
 await writeFile(join(env('PLAYABLE_OUT'),'stratus-idle-exit.json'),JSON.stringify(results,null,2));console.log(`ok: ${results.length} actual-game idle exits and Undo cases`);
}finally{await browser.close();}
