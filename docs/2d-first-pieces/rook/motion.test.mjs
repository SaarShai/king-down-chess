import test from 'node:test';
import assert from 'node:assert/strict';
import {ANCHOR,SHIFT,actionAt,poseAt,transformPoint} from './motion.mjs';

test('Rook ram keeps the painted pose rigid, planted, and bounded through anticipation, contact, and recovery',()=>{
  let minimumDistance=Infinity, peak=0;
  for(let i=0;i<=1000;i++){
    const t=i/1000, amount=actionAt(t), pose=poseAt(t);
    assert.ok(Number.isFinite(amount)&&Number.isFinite(pose.rotation));
    assert.ok(amount>=-.14-1e-9&&amount<=1+1e-9);
    peak=Math.max(peak,amount);
    const a=transformPoint({x:ANCHOR.x+120,y:500},SHIFT*amount);
    const b=transformPoint({x:ANCHOR.x-90,y:760},SHIFT*amount);
    const distance=Math.hypot(a.x-b.x,a.y-b.y);
    minimumDistance=Math.min(minimumDistance,distance);
    assert.ok(Math.abs(distance-Math.hypot(210,260))<1e-8,'rigid transform must not stretch the fists/tower pose');
    const planted=transformPoint(ANCHOR,SHIFT*amount);
    assert.ok(Math.abs(planted.x-(ANCHOR.x+SHIFT*amount))<1e-8);
    assert.ok(Math.abs(planted.y-(ANCHOR.y-SHIFT*amount*.10))<1e-8);
    assert.ok(Math.abs(pose.rotation)<=SHIFT*.00028+1e-12);
  }
  assert.equal(actionAt(0),0);assert.equal(actionAt(1),0);
  assert.ok(actionAt(.18)<0);assert.equal(actionAt(.48),1);assert.equal(actionAt(.82),1);
  assert.ok(peak>0.999);
  console.log(`1,001 Rook poses: rigid translation/rotation, fixed scale, bounded ${SHIFT}px shift; minimum sampled point distance ${minimumDistance.toFixed(3)}.`);
});
