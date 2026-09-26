import test from 'node:test';
import assert from 'node:assert/strict';
import {leapAt,LANDING} from './motion.mjs';
import {createPosition,actionsFor,destination} from '../board/model.mjs';
import {P,N,piece,parseSq,makeMove} from '../board/rules.mjs';
const at=parseSq;
test('leap separates travel from altitude, lands exactly, and never reverses travel',()=>{
 let previous=0,peak=0;
 for(let i=0;i<=1100;i++){
  const p=leapAt(i/1100);assert.ok(Object.values(p).every(Number.isFinite));
  assert.ok(p.travel>=previous&&p.travel<=1);previous=p.travel;
  assert.ok(p.lift>=-1e-12&&p.lift<=1);assert.ok(Math.abs(p.rotation)<=.045);peak=Math.max(peak,p.lift);
 }
 assert.ok(peak>.999);assert.equal(leapAt(0).travel,0);assert.equal(leapAt(0).lift,0);
 assert.equal(leapAt(LANDING).travel,1);assert.equal(leapAt(LANDING).lift,0);
 assert.equal(leapAt(1).travel,1);assert.ok(Math.abs(leapAt(1).lift)<1e-12);assert.ok(Math.abs(leapAt(1).rotation)<1e-12);
 console.log('1,101 leap samples: monotonic travel, bounded flight, exact first landing and recovered pose.');
});
test('Knight jumps an occupied ring, keeps intervening pieces, and captures at its L destination',()=>{
 for(const side of [0,1]){
  const p=createPosition('knight');p.board.fill(0);const source=at('d4');p.board[source]=piece(N,side);
  for(const s of ['c3','c4','c5','d3','d5','e3','e4','e5'])p.board[at(s)]=piece(P,side);
  p.board[at('e6')]=piece(P,1-side);p.board[at('f5')]=piece(P,side);
  const moves=actionsFor(p,source);assert.equal(moves.length,7,'friendly landing excluded; adjacent blockers do not affect the other seven');
  for(const m of moves){const dx=Math.abs((m.to&7)-(source&7)),dy=Math.abs((m.to>>3)-(source>>3));assert.equal(dx*dy,2);assert.equal(dx+dy,3);}
  assert.ok(!moves.some(m=>m.to===at('f5')));
  const capture=moves.find(m=>destination(m)===at('e6'));assert.deepEqual(capture.captures,[at('e6')]);
  const result=makeMove({...p,turn:side},capture);assert.equal(result.board[source],0);assert.equal(result.board[at('e6')],piece(N,side));
  for(const s of ['c3','c4','c5','d3','d5','e3','e4','e5'])assert.equal(result.board[at(s)],piece(P,side));
  assert.equal(p.board[source],piece(N,side));
 }
 const opening=createPosition('knight');assert.ok(actionsFor(opening,at('c4')).some(m=>m.to===at('e5')&&m.captures.length));assert.ok(actionsFor(opening,at('f5')).some(m=>m.to===at('d4')&&m.captures.length));
 const edge=createPosition('knight');edge.board.fill(0);edge.board[at('a1')]=piece(N,0);assert.deepEqual(actionsFor(edge,at('a1')).map(m=>m.to).sort((a,b)=>a-b),[at('c2'),at('b3')]);
});
