import test from 'node:test';
import assert from 'node:assert/strict';
import {kingActionMs} from './blows.mjs';
import {DEATHS} from './king-captures.mjs';
import {ICE,bandRadius,bodySpan,gripPoint,spiritSquash} from './fx-kings.mjs';

const victim={foot:{x:300,y:400},top:300,hit:{x:300,y:350},shape:[{y:390,l:280,r:320},{y:350,l:250,r:390},{y:310,l:290,r:310}]};

test('the climbing coat reaches a weapon held wide of the body',()=>{
 assert.deepEqual(bodySpan(victim),{l:250,r:390});
 assert.deepEqual(bodySpan({foot:{x:300,y:400}}),{l:282,r:318});
});
test('a shadow hand closes on the piece at the grip height, inside its reach',()=>{
 const p=gripPoint(victim,{fx:1,grip:.5});
 assert.equal(p.y,400-100*.5);
 assert.ok(p.x>300&&p.x<=390,`hand x ${p.x}`);
});
test('the spirit silhouette swells, narrows first, then is gone at the end of the implosion',()=>{
 const D=DEATHS.spirit,at=t=>spiritSquash(t,D),[a,b]=D.implode;
 assert.ok(at(a).x>1&&at(a).y>1);
 const mid=at((a+b)/2);
 assert.ok(mid.x<mid.y,'narrow before short');
 assert.equal(at(b).x,0);assert.equal(at(b).y,0);
});
test('the whirlwind widens upward',()=>{
 assert.ok(bandRadius(40,5)>bandRadius(40,0));
});
test('the charcoal king freezes in dark ice',()=>{
 const light=h=>{const n=parseInt(h.slice(1),16);return (n>>16)+((n>>8)&255)+(n&255);};
 assert.ok(light(ICE[1].mid)<light(ICE[0].mid)/2);
});
test('a king holds his attack until the death has had its time, and a long attack keeps its own length',()=>{
 assert.equal(kingActionMs(520,290),1050);
 assert.equal(kingActionMs(1400,420),1400);
});
