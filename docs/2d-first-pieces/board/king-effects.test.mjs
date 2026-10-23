import test from 'node:test';
import assert from 'node:assert/strict';
import {PERIOD,KING_EFFECTS,hoverAt,cloudAt,groundLife} from './king-effects.mjs';
import {KING_DESIGNS} from '../court-motion.mjs';

test('every king design has an effect that loops',()=>{
 assert.deepEqual([...KING_EFFECTS].sort(),[...KING_DESIGNS].sort());
 for(const design of KING_EFFECTS)assert.ok(PERIOD[design]>=3000&&PERIOD[design]<=10000,`${design}: a slow loop`);
});
test('Stratus hovers a few board units, repeats each period and drops to the floor as his effect fades',()=>{
 for(let t=0;t<PERIOD.stratus;t+=97){
  const h=hoverAt(t);assert.ok(h>=3&&h<=9,`${t} ms: ${h}`);
  assert.ok(Math.abs(hoverAt(t+PERIOD.stratus)-h)<1e-9);
  assert.equal(hoverAt(t,0),0);
 }
});

test('Sky clouds loop without a seam and stay on the king floor',()=>{
 for(let i=0;i<11;i++)for(let t=0;t<PERIOD.stratus;t+=73){
  const a=cloudAt(t,i),b=cloudAt(t+PERIOD.stratus,i);
  for(const key of Object.keys(a)) assert.ok(Math.abs(a[key]-b[key])<1e-9);
  assert.ok(a.alpha>=0&&a.alpha<=.86);
  assert.ok(Math.abs(a.x)+a.radius<68);
  assert.ok(a.y>=-16&&a.y<=3);
 }
 assert.equal(cloudAt(0,0).alpha,0);
 assert.equal(cloudAt(PERIOD.stratus,0).alpha,0);
});

test('ground material forms, holds and fades to a seamless empty floor',()=>{
 for(const period of [PERIOD.stratus,PERIOD.frost,PERIOD.flame]){
  assert.equal(groundLife(0,period),0);assert.equal(groundLife(period,period),0);
  assert.equal(groundLife(period*.5,period),1);assert.ok(groundLife(period*.9,period)<.2);
 }
});
