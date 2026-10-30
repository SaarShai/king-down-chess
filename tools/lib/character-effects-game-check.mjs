import assert from 'node:assert/strict';
import {join} from 'node:path';
import {writeFile} from 'node:fs/promises';
import {env,shot,trapErrors,assertNoErrors} from './checks.mjs';

/** The published native effects through the production game, sampled on its actual canvas clock. */
export async function checkCharacterEffects(browser){
 const cases=[
  ['archer-white','archer','7k/8/2p5/8/2A5/8/8/K7 w - - 0 1',26,42,false],
  ['archer-black','archer','7k/8/8/2a5/8/2P5/8/K7 b - - 0 1',34,18,false],
  ['maester-white','maester','7k/8/8/2p5/2M5/8/8/K7 w - - 0 1',26,34,false],
  ['maester-black','maester','7k/8/8/2m5/2P5/8/8/K7 b - - 0 1',34,26,false],
  ['queen-white','queen','7k/8/2Q5/8/4p3/8/8/K7 w - - 0 1',42,28,false],
  ['queen-black','queen','7k/8/2q5/8/4P3/8/8/K7 b - - 0 1',42,28,true],
  ['archer-cancel','archer','7k/8/2p5/8/2A5/8/8/K7 w - - 0 1',26,42,false],
 ];
 const evidence=[];
 for(const [label,kind,fen,from,target,flipped]of cases){
  const page=await browser.newPage({viewport:{width:1100,height:950}}),errors=trapErrors(page);
  await page.clock.install();
  await page.addInitScript(()=>{
   sessionStorage.setItem('kingdown.title-seen','1');window.nativeDraws=[];
   const draw=CanvasRenderingContext2D.prototype.drawImage;
   CanvasRenderingContext2D.prototype.drawImage=function(image,...args){
    if(image?.src?.includes('/character-runtime/effects/')&&this.globalAlpha>0){const m=this.getTransform();nativeDraws.push({at:performance.now(),url:image.src,alpha:this.globalAlpha,matrix:[m.a,m.b,m.c,m.d,m.e,m.f],width:image.naturalWidth,height:image.naturalHeight});}
    return Reflect.apply(draw,this,[image,...args]);
   };
  });
  const url=new URL(env('PLAYABLE_URL'));url.searchParams.set('fen',fen);url.searchParams.set('players','human,human');await page.goto(url.href);
  await page.waitForFunction(from=>window.view?.scene?.characterFrames?.some(f=>f.square===from),from);await page.evaluate(()=>view.ready());if(flipped)await page.evaluate(()=>view.flip(true));
  await page.clock.pauseAt(await page.evaluate(()=>Date.now())+50);
  const legal=await page.evaluate(([from,target])=>view.context.legalMoves(view.pos).some(m=>m.from===from&&m.captures.includes(target)),[from,target]);assert(legal,`${label}: legal game capture`);
  await page.evaluate(([from,target])=>{view.onSquareClick(from,false);view.onSquareClick(target,false);},[from,target]);
  const state=()=>page.evaluate(()=>({effect:view.scene.characterEffects[0],bodies:view.scene.characterFrames,memory:view.scene.characterMemory,animating:view.scene.animating,draws:nativeDraws}));
  const step=async()=>{
   await page.evaluate(()=>view.scene.redraw());await page.clock.runFor(16);
   for(let i=0;i<400;i++){const m=await page.evaluate(()=>view.scene.characterMemory);if(!m.active&&!m.queued)break;await page.waitForTimeout(5);}
  };
  let current;
  for(let i=0;i<500;i++){await step();current=await state();if(current.effect?.kind===kind)break;await page.waitForTimeout(2);}
  assert.equal(current.effect?.kind,kind,`${label}: published separate effect loaded`);
  const contact={archer:220,maester:30,queen:600}[kind],duration=current.effect.durationMs;
  const isProjectile=d=>kind==='archer'?/golden-arrow|contact-flash/.test(d.url):kind==='queen'?d.url.includes('thorn-shard'):!d.url.includes('provenance');
  const capture=async(name,elapsed,expectPixels)=>{
   for(let i=0;i<500;i++){current=await state();if(current.effect.elapsedMs>=elapsed)break;await step();}
   current=await state();const e=current.effect;assert(e,`${label}/${name}: scene still owns effect clock`);
   const draws=current.draws.filter(d=>Math.abs(d.at-e.at)<1&&isProjectile(d));
   if(expectPixels){assert(draws.length>0,`${label}/${name}: native raster pixels drawn`);assert(draws.every(d=>d.alpha>0&&d.width>0&&d.height>0&&d.matrix.every(Number.isFinite)),`${label}/${name}: visible finite native draws`);}
   else assert.equal(draws.length,0,`${label}/${name}: no projectile remains`);
   await shot(page,`${label}-${name}`);
   const victim=current.bodies.find(b=>b.square===target);
   const result={name,elapsedMs:e.elapsedMs,bodyTime:e.bodyTime,bodyDurationMs:e.bodyDurationMs,releaseMs:e.releaseMs,victimOpacity:victim?.opacity,nativeDraws:draws.length,assets:[...new Set(draws.map(d=>d.url))],origin:e.origin,target:e.target,memory:current.memory};
   assert(current.memory.peakBytes<=64*1024*1024,`${label}: total retained runtime pixels stay within64MiB`);
   return result;
  };
  const phases=[await capture('release',kind==='maester'?.5:16,true)];
  if(label==='archer-cancel'){
   const cancelledAt=await page.evaluate(()=>{view.skip();return performance.now();});await page.clock.runFor(2000);await page.evaluate(()=>view.scene.redraw());await page.clock.runFor(16);
   const after=await state();assert(!after.animating);assert(!after.effect);assert(!after.draws.filter(d=>d.at>cancelledAt&&isProjectile(d)).length,'skip removes travelling arrow');await shot(page,`${label}-settled`);evidence.push({label,phases,cancelled:true});assertNoErrors(errors);await page.close();continue;
  }
  if(kind==='queen'){const returned=await capture('after-body-return',current.effect.bodyDurationMs-current.effect.releaseMs+32,true);assert.equal(returned.bodyTime,returned.bodyDurationMs,'thorns continue after exact body rest');phases.push(returned);}
  const before=await capture('before-contact',kind==='maester'?.5:Math.max(16,contact-32),true);assert.equal(before.victimOpacity,1,`${label}: victim waits for effect contact`);phases.push(before);
  const hit=await capture('contact',contact+16,true);assert(hit.victimOpacity<1,`${label}: victim reacts after effect contact`);phases.push(hit);
  phases.push(await capture('last-fade',duration-24,true));phases.push(await capture('after-fade',duration+32,false));
  if(kind==='archer')assert(current.draws.some(d=>d.url.includes('golden-wisp')),`${label}: independent native smoke draws`);
  await page.evaluate(()=>view.skip());await page.clock.runFor(3000);assertNoErrors(errors);evidence.push({label,phases});await page.close();
 }
 await writeFile(join(env('PLAYABLE_OUT'),'native-effects.json'),JSON.stringify(evidence,null,2));
 return evidence.length;
}
