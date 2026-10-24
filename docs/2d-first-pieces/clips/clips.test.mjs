// The selected Knight and Rook each play their clip once, from the first drawing to the last, then breathe.
// Reduced motion or motion off shows the still figure at once (the clip's last drawing is the rest pose).
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// A stand-in browser (as board/idle-stop.test.mjs): 2D calls are no-ops, images load at once, time is ours.
let now=0;const frames=[],timers=[];
const ctx2d=new Proxy({},{get:(t,k)=>k in t?t[k]:k==='getImageData'||k==='createImageData'?(x,y,w=1,h=1)=>({data:new Uint8ClampedArray(Math.max(1,w*h)*4)}):k==='getTransform'?()=>({a:1,b:0,c:0,d:1,e:0,f:0}):k==='measureText'?()=>({width:1}):()=>ctx2d,set:(t,k,v)=>(t[k]=v,true)});
const canvas=()=>({width:1,height:1,style:{},getContext:()=>ctx2d,addEventListener(){},getBoundingClientRect:()=>({width:960})});
globalThis.document={createElement:canvas,hidden:false,addEventListener(){}};
globalThis.Image=class{constructor(){this.naturalWidth=this.width=this.height=1152;}set src(v){this._s=v;queueMicrotask(()=>this.onload?.());}get src(){return this._s;}decode(){return Promise.resolve();}};
Object.defineProperty(globalThis,'performance',{value:{now:()=>now},configurable:true});
globalThis.requestAnimationFrame=fn=>{frames.push(fn);return frames.length;};
globalThis.cancelAnimationFrame=()=>{};
const realSetTimeout=setTimeout;
const {createScene}=await import('../board/scene.mjs');
const {CLIPS,frameAt}=await import('./clips.mjs');
const {P,N,B,R,Q,K,S,L,M,G,A,O,typeOf,colorOf,sqName,parseSq}=await import('../board/rules.mjs');
const {createPosition}=await import('../board/model.mjs');

/** Advance the clock in 16 ms steps, running each due frame and timer; returns what each drawn frame showed. */
function run(scene,ms){
 const shown=[];const end=now+ms;
 while(now<end){
  now+=16;
  for(const t of timers.splice(0))if(t.at<=now)t.fn();else timers.push(t);
  for(const f of frames.splice(0)){f(now);shown.push(scene.clip);}
 }
 return shown;
}
async function selected(value,lively){
 const scene=createScene({canvas:canvas(),pieces:{P,N,B,R,Q,K,S,L,M,G,A,O,typeOf,colorOf,sqName},headroom:64,kings:['plain','plain']});
 await scene.load().catch(()=>{});
 scene.setLively(lively);scene.setReducedMotion(!lively.idle);
 const pos=createPosition('king');pos.board=Array(64).fill(0);pos.board[parseSq('d4')]=value;scene.setPosition(pos);
 run(scene,100);scene.setSelected(parseSq('d4'));
 return scene;
}

test('each clip ends on the drawing it starts with, and its drawings exist in its atlas',()=>{
 for(const [name,c] of Object.entries(CLIPS)){
  assert.equal(c.sequence[0],c.sequence.at(-1),`${name} returns to its first drawing`);
  assert.ok(c.sequence.every(i=>i>=0&&i<c.cells.length),`${name} names only drawings it has`);
  assert.equal(frameAt(name,-1),null);assert.equal(frameAt(name,c.duration),null,`${name} has ended at ${c.duration} ms`);
  assert.equal(frameAt(name,0),c.sequence[0]);
 }
 assert.equal(CLIPS.knight.duration,750);assert.equal(CLIPS.rook.duration,2000);
});

test('the selected Knight and Rook play their clip once, through every drawing, then stop',async()=>{
 globalThis.setTimeout=(fn,ms)=>{timers.push({fn,at:now+ms});return timers.length;};
 try{
  for(const [value,name] of [[N,'knight'],[R,'rook'],[N|16,'knight'],[R|16,'rook']]){
   const scene=await selected(value,{idle:true,atmosphere:true,moves:true});
   const c=CLIPS[name],shown=run(scene,c.duration+6000);
   const playing=shown.map(s=>s?s.frame:null),first=playing.findIndex(f=>f!==null),last=playing.findLastIndex(f=>f!==null);
   assert.ok(first>=0,`${name} (${colorOf(value)?'Charcoal':'Ivory'}) plays`);
   assert.ok(shown.slice(first,last+1).every(s=>s?.name===name),`${name} plays without a break`);
   assert.deepEqual(new Set(playing.slice(first,last+1)),new Set(c.sequence),`${name} shows each of its drawings`);
   assert.ok((last-first+1)*16>=c.duration-50,`${name} plays at full rate for its whole length`);
   assert.ok(playing.slice(last+1).length>0&&playing.slice(last+1).every(f=>f===null),`${name} does not play again while he stays selected`);
   scene.setSelected(null);run(scene,100);scene.setSelected(parseSq('d4'));
   assert.ok(run(scene,200).some(s=>s?.name===name),`${name} plays again when selected again`);
   scene.dispose();
  }
 }finally{globalThis.setTimeout=realSetTimeout;}
});

test('with reduced motion or motion off the selected figure stays still: no clip',async()=>{
 globalThis.setTimeout=(fn,ms)=>{timers.push({fn,at:now+ms});return timers.length;};
 try{
  for(const value of [N,R]){
   const scene=await selected(value,{idle:false,atmosphere:true,moves:false});
   scene.redraw();
   assert.ok(run(scene,3000).every(s=>s===null),'no clip drawing shows');
   scene.dispose();
  }
 }finally{globalThis.setTimeout=realSetTimeout;}
});

test('the clip atlases are in the build graph and match their provenance',()=>{
 const provenance=JSON.parse(readFileSync(new URL('./provenance.json',import.meta.url)));
 for(const [name,p] of Object.entries(provenance)){
  const bytes=readFileSync(new URL(`../${p.atlas.file}`,import.meta.url));
  assert.equal(bytes.length,p.atlas.bytes,`${name}: the atlas is the one the build wrote`);
  assert.ok(bytes.length<1_500_000,`${name}: the atlas stays small (${bytes.length} bytes)`);
  assert.equal(p.ms,CLIPS[name].duration);
 }
});
