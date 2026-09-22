import { fromFen, toFen, toLan } from '../../src/rules/setup';
import { legalMoves, makeMove, inCheck } from '../../src/rules/engine';
import { search, resetSearchState, positionKey, quiesceScore } from '../../src/ai/search';
const fen = '7k/8/8/8/3p4/2BOK3/8/8 w - - 0 1';
let pos = fromFen(fen);
const original = positionKey(pos);
for (let i=0; i<2; i++) {
  const moves=legalMoves(pos);
  console.log({fen:toFen(pos),check:inCheck(pos),moves:moves.map(m=>toLan(pos,m))});
  const move=i===0?moves.find(m=>!!m.shove):moves.find(m=>toLan(pos,m)==='d5-d4');
  if(!move) throw Error('no cycle move');
  pos=makeMove(pos,move);
}
console.log({fen:toFen(pos),same:positionKey(pos)===original,halfmove:pos.halfmove});
for (const depth of [1,2,3,4]) {
 resetSearchState();const start=performance.now();const result=search(fromFen(fen),{maxDepth:depth,timeMs:1000});
 console.log({depth,result:{...result,move:result.move&&toLan(fromFen(fen),result.move)},ms:performance.now()-start});
}
resetSearchState();const start=performance.now();console.log({q:quiesceScore(fromFen(fen)),ms:performance.now()-start});
