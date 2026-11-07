import test from 'node:test';
import assert from 'node:assert/strict';
import {shadowHandsAt,shadowHandFrame,drawPaintedShadowHand} from './painted-shadow-hands.mjs';
import {PERIOD} from './king-effects.mjs';

test('painted Shadow hands leave pauses, overlap at most two, and repeat at the existing period',()=>{
 const frames=new Set();let empty=0,overlap=0;
 for(let t=0;t<PERIOD.shadow;t+=10){
  const hands=shadowHandsAt(t,PERIOD.shadow);
  assert.ok(hands.length<=2);if(!hands.length)empty++;if(hands.length===2)overlap++;
  const later=shadowHandsAt(t+PERIOD.shadow,PERIOD.shadow);
  assert.deepEqual(hands.map(h=>[h.i,h.frame]),later.map(h=>[h.i,h.frame]));
  hands.forEach((h,i)=>{
   frames.add(h.frame);assert.ok(h.rise>=0&&h.rise<=1&&h.open>=0&&h.open<=1);
   assert.ok(Math.abs(h.rise-later[i].rise)<1e-12);
  });
 }
 assert.ok(empty>40,'the floor has visible empty pauses');
 assert.ok(overlap>0&&overlap<100,'only brief overlaps');
 assert.ok(frames.size>50,'the loop uses intermediate frames across the painted keys');
});

test('each painted hand draws one coherent pose behind the near crevice lip',()=>{
 const calls=[],ctx={globalAlpha:1,save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},clip(){calls.push('clip');},translate(){},rotate(){},scale(){},drawImage(...args){calls.push(args);},stroke(){calls.push('lip');}};
 const hand={side:0,frame:32,size:1,rise:1,alpha:1,angle:0,flip:false,lip:[[-12,0],[0,2],[12,0]]};
 drawPaintedShadowHand(ctx,{},0,0,hand);
 assert.equal(calls.filter(Array.isArray).length,1);
 assert.equal(calls[0],'clip');assert.equal(calls.at(-1),'lip');
 calls.length=0;drawPaintedShadowHand(ctx,{},0,0,{...hand,rise:0});assert.equal(calls.length,0);
 drawPaintedShadowHand(ctx,{},0,0,{...hand,alpha:0});assert.equal(calls.length,0);
});


test('FILM hand frames hold the endpoints and advance through every painted key without jumps',()=>{
 assert.equal(shadowHandFrame(0),0);assert.equal(shadowHandFrame(1),64);
 for(const [u,frame]of [[.12,0],[.34,16],[.5,32],[.65,48],[.85,64]])assert.equal(shadowHandFrame(u),frame);
 let prev=0;
 for(let u=0;u<=1;u+=.001){const frame=shadowHandFrame(u);assert.ok(frame>=prev&&frame-prev<=1);prev=frame;}
});
