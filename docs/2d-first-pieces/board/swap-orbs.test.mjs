import test from 'node:test';
import assert from 'node:assert/strict';
import {SWAP,swapOrbsAt} from './swap-orbs.mjs';

test('a swapping figure shows only outside its opaque orb, and changes square while hidden',()=>{
 for(let i=0;i<=1000;i++){
  const p=i/1000,s=swapOrbsAt(p);
  assert.equal(s.shown,p<SWAP.covered||p>=SWAP.open);
  assert.equal(s.arrived,p>=SWAP.open);
 }
 for(const edge of [SWAP.covered,SWAP.open]){const s=swapOrbsAt(edge);assert.equal(s.alpha,1);assert.equal(s.size,1);}
 assert.equal(swapOrbsAt(0).lift,0);assert.equal(swapOrbsAt(1).lift,0);assert.equal(swapOrbsAt(1).alpha,0);
});
test('the orbs grow, travel and fade with no jump between frames',()=>{
 let last=swapOrbsAt(0);
 for(let i=1;i<=1100;i+=16){
  const s=swapOrbsAt(i/1100);
  assert.ok(Math.abs(s.size-last.size)<.12);assert.ok(Math.abs(s.alpha-last.alpha)<.2);assert.ok(Math.abs(s.travel-last.travel)<.08);
  last=s;
 }
});
