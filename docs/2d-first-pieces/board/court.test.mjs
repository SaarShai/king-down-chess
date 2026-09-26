import test from 'node:test';
import assert from 'node:assert/strict';
import {P,R,Q,L,M,G,piece,parseSq,makeMove} from './rules.mjs';
import {createPosition,actionsFor,layouts} from './model.mjs';
import {chargeAt,swapAt,CHARGE_CONTACT} from './motion.mjs';
import {figures,actionAt,deformPoint,registeredPoint} from '../court-motion.mjs';
const sq=parseSq;
test('Queen rays, Paladin survival/sacrifice and Maester swaps use production rules for both armies',()=>{
 for(const side of [0,1]){
  const p=createPosition();p.board.fill(0);p.board[sq('d4')]=piece(Q,side);p.board[sq('f6')]=piece(P,1-side);p.board[sq('f4')]=piece(G,1-side);p.board[sq('d2')]=piece(P,side);
  const moves=actionsFor(p,sq('d4'));
  assert.ok(moves.some(m=>m.to===sq('f6')&&m.captures.length));
  for(const square of ['g7','f4','g4','d2','d1'])assert.ok(!moves.some(m=>m.to===sq(square)));
  for(const target of [P,R]){
   p.board.fill(0);p.board[sq('d4')]=piece(L,side);p.board[sq('e4')]=piece(G,side);p.board[sq('g4')]=piece(target,1-side);
   const move=actionsFor(p,sq('d4')).find(m=>m.to===sq('g4'));assert.ok(move,'Paladin passes a friendly Guard');assert.equal(Boolean(move.selfRemove),target!==P);
   const next=makeMove({...p,turn:side},move);assert.equal(next.board[sq('d4')],0);assert.equal(next.board[sq('g4')],target===P?piece(L,side):0);assert.equal(next.board[sq('e4')],piece(G,side));
  }
  p.board.fill(0);p.board[sq('d4')]=piece(M,side);p.board[sq('e4')]=piece(G,side);p.board[sq('d5')]=piece(P,1-side);p.board[sq('d6')]=piece(R,side);
  const swap=actionsFor(p,sq('d4')).find(m=>m.to===sq('e4'));assert.ok(swap.swap);assert.deepEqual(swap.captures,[]);
  const next=makeMove({...p,turn:side},swap);assert.equal(next.board[sq('e4')],piece(M,side));assert.equal(next.board[sq('d4')],piece(G,side));assert.equal(next.board.filter(Boolean).length,p.board.filter(Boolean).length);
  assert.ok(actionsFor(p,sq('d4')).some(m=>m.to===sq('d5')&&m.captures.length));assert.ok(!actionsFor(p,sq('d4')).some(m=>m.to===sq('d6')));
 }
});
test('new fixtures expose each special action and the full cast has ten pieces per army',()=>{
 for(const name of ['queen','paladin','maester','cast'])assert.equal(new Set(layouts[name].map(p=>p[0])).size,layouts[name].length);
 const paladin=createPosition('paladin');
 for(const [from,pawn,other] of [['c4','g4','c7'],['f5','b5','f2']]){
  const moves=actionsFor(paladin,sq(from));assert.ok(moves.some(m=>m.to===sq(pawn)&&m.captures.length&&!m.selfRemove));assert.ok(moves.some(m=>m.to===sq(other)&&m.selfRemove));
 }
 for(const [from,to] of [['c4','d4'],['f5','e5']])assert.ok(actionsFor(createPosition('maester'),sq(from)).some(m=>m.to===sq(to)&&m.swap));
 for(const side of [0,1])assert.equal(layouts.cast.filter(p=>p[2]===side).length,10);
});
test('Paladin travel stays still during preparation; swap paths retain both actors and finish exactly',()=>{
 let previous=0;
 for(let i=0;i<=1000;i++){
  const t=i/1000,c=chargeAt(t);assert.ok(c.travel>=previous);previous=c.travel;assert.ok(c.lift>=0&&c.lift<=1);
  if(t<=.2)assert.equal(c.travel,0);if(t>=CHARGE_CONTACT){assert.equal(c.travel,1);assert.equal(c.lift,0);}
  for(const to of [{x:112,y:0},{x:0,y:112},{x:-112,y:-112}]){const pose=swapAt(t,{x:0,y:0},to);assert.ok(Math.hypot(pose.actor.x-pose.partner.x,pose.actor.y-pose.partner.y)>=63.9);}
 }
 assert.deepEqual(swapAt(0,{x:0,y:0},{x:112,y:0}),{actor:{x:0,y:0},partner:{x:112,y:0}});
 const end=swapAt(1,{x:0,y:0},{x:112,y:0});assert.ok(Math.abs(end.actor.x-112)+Math.abs(end.actor.y)+Math.abs(end.partner.x)+Math.abs(end.partner.y)<1e-10);
});
test('coherent court figures preserve rigid equipment and fixed hems/boots across the complete motion',()=>{
 const area=([a,b,c])=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
 assert.equal(actionAt(0),0);assert.equal(actionAt(1),0);
 for(let i=0;i<=1000;i++){
  const amount=actionAt(i/1000);assert.ok(amount>=-.12&&amount<=1);
  for(const name of ['queen','paladin']){
   const spec=figures[name],a={x:250,y:300},b={x:620,y:spec.rigid-5};
   const da=deformPoint(name,a,amount),db=deformPoint(name,b,amount);assert.ok(Math.abs(Math.hypot(da.x-db.x,da.y-db.y)-Math.hypot(a.x-b.x,a.y-b.y))<1e-9);
   // Opaque points sampled from the final PNG: Queen lower hem and both
   // Paladin soles, not empty pixels below the artwork.
   const contacts=name==='queen'?[{x:300,y:970},{x:480,y:988}]:[{x:182,y:905},{x:511,y:893}];
   for(const p of contacts){assert.deepEqual(deformPoint(name,p,amount),p);for(const side of [0,1])assert.deepEqual(registeredPoint(name,side,p,amount),registeredPoint(name,side,p,0));}
   for(let j=0;j<spec.bands.length-1;j++){const points=[{x:0,y:spec.bands[j]},{x:768,y:spec.bands[j]},{x:0,y:spec.bands[j+1]}];assert.ok(area(points.map(p=>deformPoint(name,p,amount)))>0);}
  }
  for(const side of [0,1]){
   const a={x:200,y:250},b={x:650,y:850},ra=registeredPoint('maester',side,a,amount),rb=registeredPoint('maester',side,b,amount);
   assert.ok(Math.abs(Math.hypot(ra.x-rb.x,ra.y-rb.y)-Math.hypot(a.x-b.x,a.y-b.y))<1e-9);
  }
 }
});
