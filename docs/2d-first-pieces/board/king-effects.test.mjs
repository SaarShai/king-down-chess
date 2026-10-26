import test from 'node:test';
import assert from 'node:assert/strict';
import {PERIOD,KING_EFFECTS,hoverAt,groundLife,stratusCloudAt,createKingEffects} from './king-effects.mjs';
import {KING_DESIGNS} from '../court-motion.mjs';

test('every king design has an effect that loops',()=>{
 assert.deepEqual([...KING_EFFECTS].sort(),[...KING_DESIGNS].sort());
 for(const design of KING_EFFECTS)assert.ok(PERIOD[design]>=3000&&PERIOD[design]<=(design==='mud'?16000:10000),`${design}: a slow loop`);
});
test('Stratus hovers a few board units, repeats each period and drops to the floor as his effect fades',()=>{
 for(let t=0;t<PERIOD.stratus;t+=97){
  const h=hoverAt(t);assert.ok(h>=3&&h<=9,`${t} ms: ${h}`);
  assert.ok(Math.abs(hoverAt(t+PERIOD.stratus)-h)<1e-9);
  assert.equal(hoverAt(t,0),0);
 }
});

test('ground material forms, holds and fades to a seamless empty floor',()=>{
 for(const period of [PERIOD.stratus,PERIOD.frost,PERIOD.flame]){
  assert.equal(groundLife(0,period),0);assert.equal(groundLife(period,period),0);
  assert.equal(groundLife(period*.5,period),1);assert.ok(groundLife(period*.9,period)<.2);
 }
});

test('Stratus keeps a fixed core and separately staggered billows within a four-second loop',()=>{
 assert.equal(PERIOD.stratus,4000);
 assert.deepEqual(stratusCloudAt(0),stratusCloudAt(PERIOD.stratus));
 const peaks=new Set();
 for(let t=0;t<PERIOD.stratus;t+=10){
  const a=stratusCloudAt(t),b=stratusCloudAt(t+PERIOD.stratus);
  assert.equal(a.core.w,92);
  assert.ok(a.billows.some(x=>x.alpha>.1),`${t}: an outer billow remains visible`);
  peaks.add(a.billows.reduce((max,x,i,all)=>x.alpha>all[max].alpha?i:max,0));
  for(let i=0;i<a.billows.length;i++){
   const x=a.billows[i];
   assert.ok(x.alpha>=0&&x.alpha<=.86);
   assert.ok(Math.abs(x.x)+x.w/2<=66,`${t}: restrained footprint`);
   for(const key of ['alpha','x','y','angle','w'])assert.ok(Math.abs(x[key]-b.billows[i][key])<1e-9,`${t}: ${key} repeats`);
  }
 }
 assert.equal(peaks.size,4,'each billow has its own visible peak');
 for(const start of [0,...[.04,.31,.57,.79].map(p=>p*PERIOD.stratus)]){
  const before=stratusCloudAt(start-.001),after=stratusCloudAt(start+.001);
  for(let i=0;i<4;i++){
   assert.ok(Math.abs(before.billows[i].alpha-after.billows[i].alpha)<1e-5);
   if(before.billows[i].alpha>.001)assert.ok(Math.abs(before.billows[i].x-after.billows[i].x)<1e-3);
  }
 }
});

test('Stratus draws one persistent full painting, keeps floor and hover clocks separate, and obeys fades',async()=>{
 const previousDocument=globalThis.document,previousImage=globalThis.Image;
 const context=()=>({globalAlpha:1,draws:[],stack:[],save(){this.stack.push(this.globalAlpha);},restore(){this.globalAlpha=this.stack.pop();},
  translate(){},scale(){},rotate(){},createRadialGradient(){return {addColorStop(){}};},fillRect(){},
  drawImage(image,...box){this.draws.push({core:image instanceof CloudImage,alpha:this.globalAlpha,box});}});
 class CloudImage {width=2048;height=683;set src(value){queueMicrotask(()=>this.onload());}}
 try{
  globalThis.Image=CloudImage;
  globalThis.document={createElement(){return {width:0,height:0,getContext(){return context();}};}};
  const effects=createKingEffects({sheet:()=>null});effects.has('stratus');await Promise.resolve();
  const s={design:'stratus',side:0,t:0,now:850,k:1,g:1,opacity:1,ground:{x:100,y:200},pose:{foot:{x:100,y:200},scale:.14,facing:1}};
  const draw=state=>{const ctx=context();effects.back(ctx,state);return ctx.draws;};
  for(let t=0;t<=PERIOD.stratus;t+=40){
   const draws=draw({...s,t}),core=draws.filter(d=>d.core);
   assert.equal(core.length,1,`${t}: floor never goes bare`);
   assert.equal(core[0].alpha,1);assert.equal(core[0].box[2],92);
   assert.equal(core[0].box[3],92*683/2048,'source aspect ratio stays fixed');
  }
  assert.deepEqual(draw({...s,t:1600,now:0}),draw({...s,t:1600,now:2700}),'floor uses its square clock');
  assert.deepEqual(effects.pose({...s,t:0}),effects.pose({...s,t:2700}),'hover uses its continuous clock');
  const full=draw({...s,t:1600}),faded=draw({...s,t:1600,k:.4,g:.3});
  for(let i=0;i<full.length;i++)assert.ok(Math.abs(faded[i].alpha-full[i].alpha*.12)<1e-12);
  for(const state of [{...s,g:0},{...s,k:0}])assert.ok(draw(state).every(d=>d.alpha===0));
  const front=context();effects.front(front,s);assert.equal(front.draws.length,0,'clouds stay behind the figure');
 }finally{
  if(previousDocument===undefined)delete globalThis.document;else globalThis.document=previousDocument;
  if(previousImage===undefined)delete globalThis.Image;else globalThis.Image=previousImage;
 }
});
