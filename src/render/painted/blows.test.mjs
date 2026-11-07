import test from 'node:test';
import assert from 'node:assert/strict';
import {BLOW,blows,tiltAt,footAt,stopPoint} from './blows.mjs';
test('blows wind up, peak at the strike, and end at rest in the target square',()=>{
 for(const {tilt} of Object.values(blows)){
  assert.equal(tiltAt(0,tilt),0);assert.equal(tiltAt(BLOW.duration,tilt),0);
  assert.ok(tiltAt(BLOW.wind-1,tilt)<0);assert.equal(tiltAt(BLOW.strike,tilt),tilt);
  for(let ms=1;ms<=BLOW.duration;ms++)assert.ok(Math.abs(tiltAt(ms,tilt)-tiltAt(ms-1,tilt))<.02);
 }
 const from={x:0,y:0},to={x:224,y:0},stop=stopPoint(from,to,60);
 assert.deepEqual(stop,{x:164,y:2});assert.deepEqual(footAt(BLOW.duration,from,stop,to),to);
 assert.deepEqual(stopPoint(from,{x:0,y:-112},60,-1),{x:60,y:-110});
});
