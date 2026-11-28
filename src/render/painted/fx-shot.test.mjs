import test from 'node:test';
import assert from 'node:assert/strict';
import {SKINS,resolveTimeline,mergeTimeline,shotTracks,hitFlash,punchAt,shotLook} from './fx-shot.mjs';
import {SHOT,rangedPlan} from './fx-ranged.mjs';
test('the golden arrow is the default look; a skin is data that changes, adds and keeps tracks', () => {
  const shot=resolveTimeline('shot'),flame=resolveTimeline('flame');
  assert.equal(shotLook(),shot);
  for(const type of ['star','ribbon','sprite','wedge','ring','particle','victim','punch'])assert.ok(shot.tracks.some(t=>t.type===type),type);
  assert.equal(flame.tracks.length,shot.tracks.length+1,'one added track');
  assert.equal(flame.tracks.find(t=>t.id==='bolt').tint.colour,'#ff6a1f');
  assert.deepEqual(flame.tracks.find(t=>t.id==='bolt').trail,shot.tracks.find(t=>t.id==='bolt').trail,'unnamed keys stay');
  assert.equal(flame.tracks.find(t=>t.id==='embers').type,'particle');
  assert.equal(SKINS.shot.tracks.find(t=>t.id==='bolt').tint,null,'the base data is not changed');
});
test('a timeline that is missing or extends itself is an error', () => {
  assert.throws(()=>resolveTimeline('nothing'));
  assert.throws(()=>resolveTimeline('a',{a:{extends:'b',tracks:[]},b:{extends:'a',tracks:[]}}));
  assert.deepEqual(mergeTimeline({x:{a:1,b:2},tracks:[{id:'t',w:1}]},{x:{b:3},tracks:[{id:'t',w:2}]}),{x:{a:1,b:3},tracks:[{id:'t',w:2}]});
});
test('reduced motion drops the punch and the hit-flash and keeps the arrow', () => {
  const shot=shotLook(),kept=shotTracks(shot,true).map(t=>t.type);
  assert.ok(!kept.includes('punch')&&!kept.includes('victim'));
  assert.ok(shotTracks(shot,true).some(t=>t.sprite==='bolt')&&kept.includes('ribbon'));
  assert.equal(hitFlash(shot,0,true).flash,0);
  assert.equal(punchAt(shot,28,{x:1,y:0},true),null);
});
test('the hit-flash is bright at the contact, fades without a jump and is gone after its track', () => {
  const shot=shotLook(),t=shot.tracks.find(x=>x.type==='victim');
  assert.equal(hitFlash(shot,-1).flash,0);
  assert.ok(hitFlash(shot,0).flash>=.85);
  assert.match(hitFlash(shot,0).colour,/^#fff/);
  let last=hitFlash(shot,0).flash;
  for(let ms=2;ms<=t.toMs;ms+=2){const f=hitFlash(shot,ms).flash;assert.ok(f<=last&&last-f<.15,`flash at ${ms}`);last=f;}
  assert.equal(hitFlash(shot,t.toMs+1).flash,0);
});
test('the punch is damped: none at the contact, about its size at its peak, exactly none at its end', () => {
  const shot=shotLook(),p=shot.tracks.find(x=>x.type==='punch'),dir={x:.6,y:.8};
  assert.equal(Math.hypot(punchAt(shot,0,dir).x,punchAt(shot,0,dir).y),0);
  const peak=punchAt(shot,p.peakMs,dir);assert.ok(Math.hypot(peak.x,peak.y)>p.px*.8&&Math.hypot(peak.x,peak.y)<=p.px);
  assert.ok(peak.x>0&&peak.y>0,'along the shot');
  assert.equal(punchAt(shot,p.toMs,dir),null);
  assert.equal(punchAt(shot,-5,dir),null);
});
test('the look keeps the Archer timing of the plain shot', () => {
  const attack={durationMs:850},plan=rangedPlan('archer',attack,420),flame=rangedPlan('archer',attack,420,'flame');
  assert.equal(plan.end,Math.max(850,420+SHOT.flightMs+SHOT.end));
  assert.equal(flame.end,plan.end);assert.equal(flame.effectMs,plan.effectMs);
  assert.equal(plan.look,shotLook());assert.equal(flame.look.id,'flame');
  for(const t of shotLook().tracks)if(t.beat==='contact')assert.ok((t.fromMs??0)+(t.toMs??0)<=SHOT.end,`${t.id} ends before the action`);
});
