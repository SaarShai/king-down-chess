import test from 'node:test';
import assert from 'node:assert/strict';
import {PIVOT,actionAt,transformPoint,CELLS} from './motion.mjs';
test('Rook rocks around fixed stone contact without stretching tower or fist',()=>{
 for(let i=0;i<=1000;i++){
  const amount=actionAt(i/1000);assert.ok(Number.isFinite(amount)&&amount>=-.14&&amount<=1);
  assert.deepEqual(transformPoint(PIVOT,amount),PIVOT);
  const a=transformPoint({x:576,y:500},amount),b=transformPoint({x:700,y:760},amount);
  assert.ok(Math.abs(Math.hypot(a.x-b.x,a.y-b.y)-Math.hypot(124,260))<1e-9);
 }
 assert.equal(actionAt(0),0);assert.equal(actionAt(1),0);assert.equal(actionAt(.48),1);
 assert.ok(transformPoint({x:576,y:964},1).y<964,'rear foot lifts as weight moves onto stone');
 assert.equal(CELLS[0][0]+CELLS[0][2],CELLS[1][0]);assert.equal(CELLS[1][0]+CELLS[1][2],1536);
 console.log('1,001 Rook poses: fixed stone contact, rigid tower/fist distances and recovery.');
});
