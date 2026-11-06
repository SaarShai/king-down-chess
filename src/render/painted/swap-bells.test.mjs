import test from 'node:test';
import assert from 'node:assert/strict';
import {SWAP,swapBellsAt,bellAt,ringAt} from './swap-bells.mjs';

const from={x:100,y:300},to={x:212,y:188};
test('a swapping figure shows only outside its landed bell, and changes square while hidden',()=>{
 for(let i=0;i<=1000;i++){
  const p=i/1000,s=swapBellsAt(p);
  assert.equal(s.opacity,p<SWAP.covered||p>=SWAP.lift[0]?1:0);
  assert.equal(s.arrived,p>=SWAP.arrived);
 }
 assert.ok(SWAP.covered<SWAP.arrived&&SWAP.arrived<SWAP.lift[0]);
});
test('each bell stands on the floor, whole, whenever a figure appears or goes behind it',()=>{
 for(const first of [true,false]){
  const start=first?from:to,end=first?to:from;
  for(const [p,at] of [[SWAP.covered,start],[SWAP.lift[0],end]]){
   const b=bellAt(p,from,to,first);
   assert.equal(b.alpha,1);assert.ok(Math.abs(b.up)<1e-9);assert.ok(Math.hypot(b.x-at.x,b.y-at.y)<1e-9);
  }
 }
});
test('the bells, the rings and the fallback run with no jump between frames, and end gone',()=>{
 for(const first of [true,false]){
  let last=bellAt(0,from,to,first);
  for(let i=16;i<=1100;i+=16){
   const b=bellAt(i/1100,from,to,first);
   assert.ok(Math.abs(b.alpha-last.alpha)<.35);assert.ok(Math.hypot(b.x-last.x,b.y-last.y)<40);assert.ok(Math.abs(b.up-last.up)<70);assert.ok(Math.abs(b.tilt-last.tilt)<.1);
   last=b;
  }
  assert.equal(bellAt(1,from,to,first).alpha,0);assert.equal(bellAt(0,from,to,first).alpha,0);
 }
 let r=ringAt(0),f=swapBellsAt(0,false);
 assert.equal(r.alpha,0);
 for(let i=16;i<=1100;i+=16){
  const n=ringAt(i/1100),g=swapBellsAt(i/1100,false);
  assert.ok(Math.abs(n.alpha-r.alpha)<.3);assert.ok(Math.abs(n.size-r.size)<.2);assert.ok(Math.abs(n.turn-r.turn)<.2);assert.ok(Math.abs(g.opacity-f.opacity)<.2);
  r=n;f=g;
 }
 assert.equal(ringAt(1).alpha,0);
 assert.equal(swapBellsAt(1,false).opacity,1);assert.equal(swapBellsAt(1,false).arrived,true);assert.equal(swapBellsAt(.5,false).opacity,0);
});
