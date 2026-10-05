import test from 'node:test';
import assert from 'node:assert/strict';
import {PERIOD,KING_EFFECTS,hoverAt} from './king-effects.mjs';
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
