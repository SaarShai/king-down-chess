import test from 'node:test';
import assert from 'node:assert/strict';
import {RAY,SHOT,rangedPlan,heldClock,struckAt,scanAt} from './fx-ranged.mjs';
const attack={durationMs:850};
test('the Maester holds his release frame for the ray, then plays on without a jump', () => {
  const plan=rangedPlan('maester',attack,360);
  assert.equal(plan.end,850+RAY.holdMs);
  assert.ok(plan.effectMs<=100+RAY.holdMs,'the ray ends before the painted hold ends');
  assert.equal(heldClock(360,plan.hold),360);
  assert.equal(heldClock(360+RAY.holdMs/2,plan.hold),360);
  assert.equal(heldClock(360+RAY.holdMs,plan.hold),360);
  assert.equal(heldClock(361+RAY.holdMs,plan.hold),361);
  assert.equal(heldClock(plan.end,plan.hold),850);
});
test('the ray is gone and the victim dissolved before he steps in', () => {
  const plan=rangedPlan('maester',attack,360);
  assert.equal(scanAt(0).power,0);assert.equal(scanAt(RAY.reach).power,1);assert.equal(scanAt(RAY.beamMs).power,0);
  assert.equal(scanAt(RAY.dissolve[1]).front,1);
  assert.ok(360+RAY.end<=plan.end,'the last mote is gone at the step');
});
test('the Archer waits for the fall; other effects keep their timing', () => {
  const plan=rangedPlan('archer',attack,420);
  assert.equal(plan.end,420+SHOT.flightMs+SHOT.end);
  assert.ok(420+plan.effectMs<plan.end,'the arrow goes before the action ends');
  assert.equal(rangedPlan('queen',attack,420),null);
});
test('the struck figure stands, staggers without a pop, falls away and is gone', () => {
  const dir={x:0,y:-1};
  assert.equal(struckAt(-1,1,dir).tilt,0);
  let last=struckAt(0,1,dir);
  assert.equal(last.tilt,0);assert.ok(last.flash>0);
  for(let ms=4;ms<=SHOT.end;ms+=4){
    const m=struckAt(ms,1,dir);
    assert.ok(Math.abs(m.tilt-last.tilt)<.08,`tilt jump at ${ms}`);
    assert.ok(Math.hypot(m.dx-last.dx,m.dy-last.dy)<1.5,`step jump at ${ms}`);
    last=m;
  }
  assert.ok(last.tilt>1.3,'it lies down');assert.equal(last.opacity,0);
  assert.ok(struckAt(SHOT.land,-1,dir).tilt<-1.3,'it falls to the side it is sent');
});
