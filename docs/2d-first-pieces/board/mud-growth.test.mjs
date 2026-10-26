import test from 'node:test';
import assert from 'node:assert/strict';
import {MUD_CYCLE,mudCycle,MUD_TUFTS,MUD_VINES,mudTuftLife,mudVineLife,mudVinePoint} from './mud-growth.mjs';

test('Mud leaves a clear front corridor and keeps most grass behind the feet',()=>{
 assert.ok(MUD_TUFTS.length<20);
 assert.ok(MUD_TUFTS.filter(([,d])=>d<0).length>MUD_TUFTS.length/2);
 for(const[x,d,w,h]of MUD_TUFTS)if(d>0){assert.ok(Math.abs(x)-w/2>=24);assert.ok(h<=12);}
 assert.equal(MUD_VINES.filter(v=>v.front).length,1);
 for(let f=0;f<=1;f+=.01)assert.ok(mudVinePoint(MUD_VINES.find(v=>v.front),f).x<-24);
});
test('Mud plants keep a low bed and repeat without a seam after their first growth',()=>{
 for(const[,,,,,lag,peak]of MUD_TUFTS){
  assert.equal(mudTuftLife(0,lag,peak),0);
  assert.ok(mudTuftLife(lag+.35,lag,peak)>.8);
  assert.ok(mudTuftLife(lag+.99,lag,peak)<.14);
  for(let u=1;u<2;u+=.037)assert.ok(Math.abs(mudTuftLife(u,lag,peak)-mudTuftLife(u+1,lag,peak))<1e-10);
 }
});
test('Mud shoots have separate growth windows, open behind the tip, and return to soil',()=>{
 assert.equal(new Set(MUD_VINES.map(v=>v.start)).size,3);
 for(const v of MUD_VINES){
  assert.equal(mudVineLife(0,v),0);assert.equal(mudVineLife(v.start,v),0);
  assert.equal(mudVineLife(v.start+v.rise+.02,v),1);
  assert.equal(mudVineLife(v.start+v.rise+v.hold+v.sink+.001,v),0);
  for(let u=0;u<1;u+=.013){const life=mudVineLife(u,v);assert.ok(life>=0&&life<=1);assert.ok(Math.abs(life-mudVineLife(u+1,v))<1e-10);}
 }
 assert.equal(mudVineLife(.3,MUD_VINES[1]),0);assert.ok(mudVineLife(.3,MUD_VINES[0])>0);
});
test('Mud authored vine spans meet continuously and stay at the sides of the king',()=>{
 for(const v of MUD_VINES){
  assert.deepEqual(mudVinePoint(v,0),{x:v.path[0][0],y:v.path[0][1]});
  assert.deepEqual(mudVinePoint(v,1),{x:v.path[6][0],y:v.path[6][1]});
  const a=mudVinePoint(v,.5-1e-7),b=mudVinePoint(v,.5+1e-7);assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<.001);
  for(let f=0;f<1;f+=.017){const p=mudVinePoint(v,f);assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));assert.ok(Math.abs(p.x)<56&&p.y>=-38&&p.y<=11);}
 }
});

test('Mud alternates two full cycles in order and closes the floor at each handoff',()=>{
 assert.equal(MUD_CYCLE,8000);
 for(const base of [0,16000,32000]){
  for(const t of [0,300,4000,7999])assert.equal(mudCycle(base+t).painted,false);
  for(const t of [8000,8300,12000,15999])assert.equal(mudCycle(base+t).painted,true);
 }
 assert.deepEqual(mudCycle(-1500),{painted:false,t:0,fade:0});
 for(const t of [0,8000,16000])assert.equal(mudCycle(t).fade,0);
 for(const t of [300,4000,7600,8300,12000,15600])assert.equal(mudCycle(t).fade,1);
 for(let t=0;t<16000;t+=37){
  assert.deepEqual(mudCycle(t),mudCycle(t+16000));
  const {t:local,fade}=mudCycle(t);assert.ok(local>=0&&local<8000&&fade>=0&&fade<=1);
 }
 for(const t of [8000,16000]){
  assert.ok(mudCycle(t-1).fade<.00002);assert.ok(mudCycle(t+1).fade<.00004);
 }
});
