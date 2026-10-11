import { colorOf, isStill, legalMoves, LETTERS, TAG_POWER, typeOf, type PieceType } from '../rules/engine';
import { setRules, type Rules } from '../rules/rules';
import { fromFen, toLan } from '../rules/setup';
import type { GameRecord } from './game';
import { replayRecord } from './replay';
import { advanceIdentities, checkIdentities } from './piece-identities';

/** Card actions and piece motion are separate: a pushed piece did not choose to move. */
export function traceActions(rec: Pick<GameRecord,'gameId'|'startFen'|'openingPlies'> & {moves: readonly {lan:string}[]}, rules: Rules) {
  setRules(rules);
  const start=fromFen(rec.startFen),ids=new Int32Array(64).fill(-1);
  const pieces:{type:PieceType;side:number;start:boolean;ordinaryMoves:number;cardMoves:number;displacements:number}[]=[];
  function add(square:number,board=start.board,original=false){const id=pieces.length;pieces.push({type:typeOf(board[square]),side:colorOf(board[square]),start:original,ordinaryMoves:0,cardMoves:0,displacements:0});return id;}
  for(let s=0;s<64;s++)if(start.board[s])ids[s]=add(s,start.board,true);
  const waiting:number[][]=[[],[]];
  start.waiting?.forEach((n,c)=>{for(let i=0;i<n;i++){waiting[c].push(pieces.length);pieces.push({type:9,side:c,start:true,ordinaryMoves:0,cardMoves:0,displacements:0});}});
  const cards:{ply:number;side:number;card:string;effect:string;actor:string|null;affected:string[];captures:string[]}[]=[];
  replayRecord(rec,(pos,m,next,i)=>{
    const lan=toLan(pos,m);
    if(!legalMoves(pos).some(x=>toLan(pos,x)===lan))throw new Error(`Illegal move ${rec.gameId}/${i}: ${lan}`);
    const old=Int32Array.from(ids),actor=!isStill(m)&&!m.drop&&!m.pushes&&pos.board[m.from]?ids[m.from]:-1;
    if(i>=rec.openingPlies){
      if(actor>=0&&!m.pass){
        if(m.power)pieces[actor].cardMoves++;
        else pieces[actor].ordinaryMoves++;
      }
      if(m.power)cards.push({ply:i+1,side:pos.turn,card:m.via==='mirror'?'Mirror':m.via==='mirrorb'?'MirrorB':TAG_POWER[m.power],effect:m.power,
        actor:actor>=0?LETTERS[pieces[actor].type]:null,
        affected:[...new Set([m.from,m.to,...(m.shove?[m.shove.from]:[]),...(m.pushes?.map(p=>p.from)??[])].filter(s=>pos.board[s]).map(s=>LETTERS[typeOf(pos.board[s])]))],
        captures:m.captures.map(s=>LETTERS[typeOf(pos.board[s])])});
    }
    const reserve=m.drop&&!m.power?waiting[pos.turn].pop():undefined;
    if(reserve!==undefined&&i>=rec.openingPlies)pieces[reserve].ordinaryMoves++;
    advanceIdentities(ids,m,s=>add(s,next.board),reserve);
    checkIdentities(ids,next);
    for(let s=0;s<64;s++)if(next.board[s]){
      const id=ids[s];
      if(pieces[id].type!==typeOf(next.board[s]))ids[s]=add(s,next.board);
      else if(i>=rec.openingPlies && id!==actor && old.includes(id) && old.indexOf(id)!==s)pieces[id].displacements++;
    }
  });
  return {cards,pieces};
}
