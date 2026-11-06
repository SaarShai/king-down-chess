import test from 'node:test';
import assert from 'node:assert/strict';
import {FALL,DEMISE,IMPACT,SWAP,FALLEN_FILES,fallFraction,fallPose,effectsLeft,selfRemovalAt,veilAt,drawLying} from './fx-fallen.mjs';

const pose={foot:{x:100,y:200},scale:.1,facing:1};

test('from the end of the fall he is exactly the plain lying figure, with the rotation he was given',()=>{
 for(const ms of [FALL,DEMISE,Infinity])assert.deepEqual(fallPose(pose,-1.5,ms),{...pose,rotation:-1.5});
 assert.equal(fallPose(pose,1.5,Infinity).rotation,1.5,'he falls inward at the board edge');
 assert.ok(fallPose(pose,-1.5,FALL-1).fall,'before it he is drawn as a bending body');
});

test('the fall starts upright, rocks back first, then gathers speed into the slam and rebounds',()=>{
 assert.equal(fallFraction(0),0);
 assert.ok(fallFraction(80)<0,'he rocks away from the fall first');
 assert.equal(fallFraction(FALL-70),1,'every point of the body has come to rest by the time the head does');
 const early=fallFraction(240)-fallFraction(200),late=fallFraction(IMPACT-5)-fallFraction(IMPACT-45);
 assert.ok(late>early*1.8,'a fall that gathers speed, not one that eases to a stop');
 assert.ok(fallFraction(IMPACT+40)<fallFraction(IMPACT-1)+.02&&fallFraction(IMPACT+40)<1,'the slam rebounds');
 for(let ms=0;ms<FALL;ms+=4)assert.ok(Math.abs(fallFraction(ms+4)-fallFraction(ms))<.09,`no jump at ${ms} ms`);
});

test('his effects hold as he goes and are gone when he rests',()=>{
 assert.equal(effectsLeft(0),1);assert.equal(effectsLeft(FALL),0);assert.equal(effectsLeft(Infinity),0);
});

test('a figure dying with his target is gone at the end of the strike and stays in his fall until then',()=>{
 const at=1000,end=1550;
 assert.equal(selfRemovalAt(at,at,end).opacity,1);
 assert.ok(selfRemovalAt(1300,at,end).opacity>.9,'he falls before he fades');
 assert.equal(selfRemovalAt(end,at,end).opacity,0);
 assert.ok(selfRemovalAt(end,at,end).fall<FALL,'a body frame keeps his fall to the end');
});

test('the veil is whole round the swap, comes only after the slam and clears before the end',()=>{
 assert.ok(SWAP>IMPACT&&SWAP<FALL,'the painted figure takes over between the slam and his rest');
 for(const [p,r] of [[0,0],[0,1],[1,0],[1,1],[.5,.5]]){
  assert.equal(veilAt(IMPACT,p,r),0,'the slam itself shows');
  for(let ms=SWAP-16;ms<=SWAP+30;ms+=2)assert.equal(veilAt(ms,p,r),1,`whole at ${ms} ms`);
  assert.equal(veilAt(DEMISE,p,r),0);
 }
});

test('his painted figure has its feet on his foot point, mirrored for a rightward fall, the charcoal army below',()=>{
 const calls=[],out=new Proxy({},{get:(_,key)=>(...args)=>calls.push([key,...args])});
 const at=name=>calls.find(c=>c[0]===name).slice(1);
 drawLying(out,'image',{foot:{x:100,y:200},dir:-1,side:0});
 assert.deepEqual(at('translate'),[100,200]);assert.deepEqual(at('scale'),[.5,.5]);
 const [,sx,sy,w,h,dx,dy,dw,dh]=at('drawImage');
 assert.deepEqual([sx,sy],[0,0]);assert.deepEqual([w,h],[dw,dh]);assert.ok(dx<0&&dx+dw>0&&dy<0&&dy+dh>0,'the foot point is inside the cell');
 assert.ok(-dx>dx+dw,'head at the left of the foot point');
 calls.length=0;drawLying(out,'image',{foot:{x:100,y:200},dir:1,side:1});
 assert.deepEqual(at('scale'),[-.5,.5]);assert.equal(at('drawImage')[2],h,'the charcoal row');
 assert.deepEqual(Object.keys(FALLEN_FILES).sort(),['flame','frost','mud','shadow','spirit','stratus']);
});
