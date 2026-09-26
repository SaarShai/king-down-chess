import test from 'node:test';
import assert from 'node:assert/strict';
import {poseAt,elbow,armsAt} from './rig-motion.mjs';
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
  for(const [a,b]of [[108,94],[80,126]])for(const distance of [60,80,130,180,200])for(const angle of [-2,-1,0,1,2]){
    const end={x:start.x+Math.cos(angle)*distance,y:start.y+Math.sin(angle)*distance};
    const joint=elbow(start,end,a,b);
    assert(Math.abs(Math.hypot(joint.x-start.x,joint.y-start.y)-a)<1e-7);
    assert(Math.abs(Math.hypot(joint.x-end.x,joint.y-end.y)-b)<1e-7);
  }
});
test('singular and unreachable targets stay finite',()=>{
  for(const end of [{x:0,y:0},{x:10000,y:0}]){const j=elbow({x:0,y:0},end,90,124);assert(Number.isFinite(j.x)&&Number.isFinite(j.y));}
});

test('the complete shot keeps the bow reachable and both hands attached through aiming',()=>{
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  for(const aim of [-.26,0,.24])for(let i=0;i<=1000;i++){
    const a=armsAt(poseAt(i/1000),aim);
    for(const point of [a.bs,a.ds,a.hand,a.bw,a.be,a.stringHand,a.dw,a.de])assert(Number.isFinite(point.x)&&Number.isFinite(point.y));
    assert(Math.abs(distance(a.bs,a.be)-108)<1e-7);
    assert(Math.abs(distance(a.be,a.bw)-94)<1e-7);
    assert(Math.abs(distance(a.bw,a.hand)-24)<1e-7);
    assert(Math.abs(distance(a.dw,a.stringHand)-24)<1e-7);
    assert(Math.abs(distance(a.hand,a.stringHand)+a.nock)<1e-7);
    assert(distance(a.ds,a.de)>25,'drawing upper arm must not collapse');
    assert(distance(a.de,a.dw)>50,'drawing forearm must not collapse');
  }
  const rest=armsAt(poseAt(0),0),draw=armsAt(poseAt(.55),0);
  assert(rest.de.y>rest.ds.y+80,'resting elbow hangs below the shoulder');
  assert(draw.de.x<draw.ds.x,'drawn elbow sits behind the shoulder');
  assert(Math.abs(draw.de.y-draw.ds.y)<15,'drawn elbow stays near shoulder level');
});
