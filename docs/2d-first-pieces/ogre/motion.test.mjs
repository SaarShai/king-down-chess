import test from 'node:test';
import assert from 'node:assert/strict';
import {PUSH,shift,pushAt,palmAt} from './motion.mjs';
import {createPosition,actionsFor,destination} from '../board/model.mjs';
import {P,A,O,piece,parseSq,makeMove} from '../board/rules.mjs';
const at=parseSq, count=p=>Array.from(p.board).filter(Boolean).length;
test('Ogre shove preserves complete upper-body geometry, planted feet, and recovery',()=>{
 const upper=[{x:380,y:180},{x:220,y:320},{x:640,y:410},{x:480,y:525}];
 let minimumAreaRatio=Infinity;
 for(let i=0;i<=1000;i++){
  const extension=PUSH*pushAt(i/1000);
  assert.ok(extension>=-PUSH*.17-1e-8&&extension<=PUSH+1e-8);
  for(const p of upper){const d=shift(p,extension);assert.ok(Math.abs(d.x-p.x-extension)<1e-8);assert.ok(Math.abs(d.y-p.y+extension*.1)<1e-8);}
  for(const p of [{x:80,y:875},{x:100,y:917},{x:640,y:916}])assert.deepEqual(shift(p,extension),p);
  for(const [lo,hi] of [[630,680],[680,730],[730,780],[780,830],[830,875]]){
   const ratio=(shift({x:0,y:hi},extension).y-shift({x:0,y:lo},extension).y)/(hi-lo);minimumAreaRatio=Math.min(minimumAreaRatio,ratio);assert.ok(ratio>.98);
  }
  for(const side of [0,1]){const p=palmAt(side,extension);assert.ok(p.x>800&&p.x<930&&p.y>400&&p.y<460);}
 }
 assert.equal(pushAt(0),0);assert.equal(pushAt(1),0);assert.equal(pushAt(.48),1);assert.equal(pushAt(.84),1);
 console.log(`1,001 poses: rigid upper body, fixed soles, minimum vertical cell ratio ${minimumAreaRatio.toFixed(4)}.`);
});
test('both Ogre armies have distinct capture/push outcomes from the bundled engine',()=>{
 for(const [source,target,beyond,side] of [['c4','d4','e4',0],['f5','e5','d5',1]]){
  const p=createPosition('ogre'),options=actionsFor(p,at(source)).filter(m=>destination(m)===at(target));
  assert.equal(options.length,2);const push=options.find(m=>m.shove),capture=options.find(m=>m.captures.length);
  assert.equal(push.shove.to,at(beyond));
  const pushed=makeMove({...p,turn:side},push);assert.equal(pushed.board[at(source)],0);assert.equal(pushed.board[at(target)],piece(O,side));assert.equal(pushed.board[at(beyond)],piece(P,1-side));assert.equal(count(pushed),count(p));
  const captured=makeMove({...p,turn:side},capture);assert.equal(captured.board[at(target)],piece(O,side));assert.equal(captured.board[at(beyond)],0);assert.equal(count(captured),count(p)-1);
  assert.equal(p.board[at(source)],piece(O,side),'source position remains suitable for Undo');
 }
 const p=createPosition('ogre'),moves=actionsFor(p,at('c4'));
 const friendly=moves.find(m=>m.shove?.from===at('c5'));assert.equal(friendly.shove.to,at('c6'));
 assert.ok(!moves.some(m=>m.shove?.from===at('d3')),'occupied e2 prevents d3 push');
 p.board.fill(0);p.board[at('a1')]=piece(O,0);p.board[at('a2')]=piece(P,1);p.board[at('a3')]=piece(A,0);
 assert.ok(!actionsFor(p,at('a1')).some(m=>m.shove));
 p.board[at('a3')]=0;p.board[at('a2')]=piece(6,1);
 assert.ok(!actionsFor(p,at('a1')).some(m=>m.shove),'kings cannot be pushed');
});
