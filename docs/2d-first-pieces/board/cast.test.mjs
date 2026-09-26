import test from 'node:test';
import assert from 'node:assert/strict';
import {P,B,R,G,O,piece,parseSq,makeMove} from './rules.mjs';
import {createPosition,actionsFor,destination,layouts} from './model.mjs';
const sq=parseSq;
test('Bishop and Rook obey their rays, stop at blockers and capture for either army',()=>{
 for(const side of [0,1])for(const [type,enemy,friendly,beyond] of [[B,'f6','b2','g7'],[R,'d6','b4','d7']]){
  const p=createPosition();p.board.fill(0);p.board[sq('d4')]=piece(type,side);p.board[sq(enemy)]=piece(P,1-side);p.board[sq(friendly)]=piece(P,side);
  const moves=actionsFor(p,sq('d4'));
  for(const move of moves){const dx=Math.abs((move.to&7)-3),dy=Math.abs((move.to>>3)-3);assert.ok(type===B?dx===dy:dx===0||dy===0);}
  assert.ok(!moves.some(m=>m.to===sq(friendly)||m.to===sq(beyond)));
  const capture=moves.find(m=>m.to===sq(enemy));assert.deepEqual(capture.captures,[sq(enemy)]);
  const next=makeMove({...p,turn:side},capture);assert.equal(next.board[sq('d4')],0);assert.equal(next.board[sq(enemy)],piece(type,side));assert.equal(p.board[sq(enemy)],piece(P,1-side));
  p.board[sq(enemy)]=piece(G,1-side);assert.ok(!actionsFor(p,sq('d4')).some(m=>m.to===sq(enemy)||m.to===sq(beyond)),'Guard blocks the ray and cannot be captured');
 }
});
test('Guard moves to empty neighbours, cannot attack, and can be pushed',()=>{
 for(const side of [0,1]){
  const p=createPosition();p.board.fill(0);p.board[sq('d4')]=piece(G,side);p.board[sq('e4')]=piece(P,1-side);p.board[sq('c4')]=piece(O,1-side);
  const moves=actionsFor(p,sq('d4'));assert.equal(moves.length,6);assert.ok(moves.every(m=>m.captures.length===0&&Math.max(Math.abs((m.to&7)-3),Math.abs((m.to>>3)-3))===1));
  const ogreActions=actionsFor(p,sq('c4'));assert.ok(!ogreActions.some(m=>m.captures.includes(sq('d4'))));assert.ok(!ogreActions.some(m=>m.shove?.from===sq('d4')),'occupied square behind Guard prevents shove');
  p.board[sq('e4')]=0;const push=actionsFor(p,sq('c4')).find(m=>m.shove?.from===sq('d4'));assert.ok(push);const next=makeMove({...p,turn:1-side},push);assert.equal(next.board[sq('e4')],piece(G,side));assert.equal(next.board[sq('d4')],piece(O,1-side));
 }
});
test('new trial positions expose the intended interactions without duplicate squares',()=>{
 for(const name of ['bishop','rook','guard','cast']){assert.equal(new Set(layouts[name].map(p=>p[0])).size,layouts[name].length);assert.ok(actionsFor(createPosition(name),sq('c4')).length);}
 for(const [layout,target] of [['bishop','e2'],['rook','c7']])assert.ok(actionsFor(createPosition(layout),sq('c4')).some(m=>destination(m)===sq(target)&&m.captures.length));
 assert.ok(actionsFor(createPosition('guard'),sq('e5')).some(m=>m.shove?.from===sq('f5')));
});
