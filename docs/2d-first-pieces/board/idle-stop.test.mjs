// F32: an idle board stops drawing. Passive effects (the kings' effects, resting pawns, the selected
// figure's breath) draw for five seconds after the last change, then the scene asks for no more frames.
import test from 'node:test';
import assert from 'node:assert/strict';

// A stand-in browser: every 2D context call is a no-op; images "load" at once; time is ours.
let now=0;const frames=[],timers=[];
const ctx2d=new Proxy({},{get:(t,k)=>k in t?t[k]:k==='getImageData'||k==='createImageData'?(x,y,w=1,h=1)=>({data:new Uint8ClampedArray(Math.max(1,w*h)*4)}):k==='getTransform'?()=>({}):k==='measureText'?()=>({width:1}):()=>ctx2d,set:(t,k,v)=>(t[k]=v,true)});
const canvas=()=>({width:1,height:1,style:{},getContext:()=>ctx2d,addEventListener(){}});
globalThis.document={createElement:canvas,hidden:false,addEventListener(){}};
globalThis.Image=class{constructor(){this.naturalWidth=this.width=this.height=1152;}set src(v){this._s=v;queueMicrotask(()=>this.onload?.());}get src(){return this._s;}decode(){return Promise.resolve();}};
Object.defineProperty(globalThis,'performance',{value:{now:()=>now},configurable:true});
globalThis.requestAnimationFrame=fn=>{frames.push(fn);return frames.length;};
globalThis.cancelAnimationFrame=()=>{};
const realSetTimeout=setTimeout;
globalThis.setTimeout=(fn,ms)=>{timers.push({fn,at:now+ms});return timers.length;};
globalThis.clearTimeout=()=>{};
const {createScene}=await import('./scene.mjs');
const {P,N,B,R,Q,K,S,L,M,G,A,O,typeOf,colorOf,sqName,parseSq}=await import('./rules.mjs');
const {createPosition}=await import('./model.mjs');
globalThis.setTimeout=realSetTimeout;

/** Advance the clock in 33 ms steps, running each due frame and timer; returns the time of the last frame. */
function run(ms){
 let last=-1;const end=now+ms;
 while(now<end){
  now+=33;
  for(const t of timers.splice(0))if(t.at<=now)t.fn();else timers.push(t);
  for(const f of frames.splice(0)){last=now;f(now);}
 }
 return last;
}

test('with passive effects lively (resting pawns, a selected pawn), the draw loop stops five seconds after the last change',async()=>{
 const scene=createScene({canvas:canvas(),pieces:{P,N,B,R,Q,K,S,L,M,G,A,O,typeOf,colorOf,sqName},headroom:64,kings:['plain','plain']});
 globalThis.setTimeout=(fn,ms)=>{timers.push({fn,at:now+ms});return timers.length;};
 try{
  await scene.load().catch(()=>{});
  scene.setLively({moves:true,atmosphere:true,captures:true,idle:true,kings:true,pawns:true});
  const pos=createPosition('king');pos.board=pos.board.map(v=>typeOf(v)===P?v:0);scene.setPosition(pos);scene.setSelected(parseSq('b3')); // a selected pawn breathes: a passive effect
  const changed=now;
  const last=run(20000);
  assert.ok(last>=changed+4000,`passive effects draw for about five seconds (the last frame came at ${last-changed} ms)`);
  assert.ok(last<=changed+5100,`the last frame comes at most 5 s after the change (it came at ${last-changed} ms)`);
  scene.redraw();const again=now;
  assert.ok(run(20000)<=again+5100,'a new change wakes it for five seconds again, then it stops');
 }finally{globalThis.setTimeout=realSetTimeout;}
});
