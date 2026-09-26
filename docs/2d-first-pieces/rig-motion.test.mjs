import test from 'node:test';
import assert from 'node:assert/strict';
import {poseAt,elbow} from './rig-motion.mjs';
test('shot holds at full draw, releases once, and returns to rest',()=>{
  assert.equal(poseAt(0).draw,0);
  assert.equal(poseAt(.55).draw,1);
  assert.equal(poseAt(.55).phase,'Hold');
  assert.equal(poseAt(.65).phase,'Release');
  assert.equal(poseAt(.7).draw,0);
  assert.equal(poseAt(1).lift,0);
  let previousFlight=0;
  for(let i=0;i<=1000;i++){
    const p=poseAt(i/1000);
    for(const k of ['draw','lift','recoil','flight']) assert(Number.isFinite(p[k])&&p[k]>=0&&p[k]<=1);
    assert(p.flight>=previousFlight);previousFlight=p.flight;
  }
});
test('arm solver preserves both segment lengths across reachable targets',()=>{
  const start={x:293,y:317};
  for(const [a,b]of [[90,124],[110,118]])for(const distance of [40,80,130,180,210])for(const angle of [-2,-1,0,1,2]){
    const end={x:start.x+Math.cos(angle)*distance,y:start.y+Math.sin(angle)*distance};
    const joint=elbow(start,end,a,b);
    assert(Math.abs(Math.hypot(joint.x-start.x,joint.y-start.y)-a)<1e-7);
    assert(Math.abs(Math.hypot(joint.x-end.x,joint.y-end.y)-b)<1e-7);
  }
});
test('singular and unreachable targets stay finite',()=>{
  for(const end of [{x:0,y:0},{x:10000,y:0}]){const j=elbow({x:0,y:0},end,90,124);assert(Number.isFinite(j.x)&&Number.isFinite(j.y));}
});
