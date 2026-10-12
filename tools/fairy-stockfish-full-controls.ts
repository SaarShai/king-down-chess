/** Native search, repetition, state-key and protocol controls. No strength campaign. */
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { Uci, toUci } from './fairy-stockfish-smoke';
import { fullFixtures } from './fairy-stockfish-full-check';
import { fullAction, configureFull, resolveFullTurn, fullConfig } from './fairy-stockfish-full';
import { Game } from '../src/game';
import { DEFAULT_RULES, setRules } from '../src/rules/rules';
import { legalMoves, makeMove, status } from '../src/rules/engine';
import { fromFen } from '../src/rules/setup';
const must=(ok:unknown,msg:string):void=>{if(!ok)throw Error(msg);};
export async function controls(binary:string,out:string):Promise<void>{
 must(!existsSync(out),'Output exists');mkdirSync(out,{recursive:true});const rows:unknown[]=[],fs=new Uci(binary,resolve('tools/fairy-stockfish.ini'));fs.stderrPath=resolve(out,'stderr.log');
 try{
  await fs.query('uci',s=>s==='uciok');await fs.ready('setoption name Threads value 1\nsetoption name Hash value 16\nsetoption name Use NNUE value false\nsetoption name Move Overhead value 0');
  for(const f of fullFixtures().filter(f=>f.name.startsWith('king-')||f.name.startsWith('card-'))){
   setRules(f.rules);if(status(f.pos)!=='playing')continue;await configureFull(fs);await fs.ready('position fen '+(await import('../src/rules/setup')).toFen(f.pos));
   const begin=performance.now(),lines=await fs.query('go depth 2 nodes 256',s=>s.startsWith('bestmove '),60000),token=lines.at(-1)!.split(' ')[1];const reply=resolveFullTurn(f.pos,token);
   rows.push({name:f.name,token,actions:reply.moves.length,elapsedMs:performance.now()-begin,info:lines.filter(s=>s.startsWith('info depth ')).slice(-1),pass:true});
   writeFileSync(resolve(out,'searches.json'),JSON.stringify(rows,null,2));
  }
  setRules(DEFAULT_RULES);await configureFull(fs);
  for(const variant of ['chess','kingdown'])for(const depth of [1,2,3]){
   await fs.ready('setoption name UCI_Variant value '+variant+'\nposition startpos');
   const lines=await fs.query('go perft '+depth,s=>s.startsWith('Nodes searched:'),60000),nodes=Number(lines.at(-1)!.split(':')[1]);must(nodes===[1,20,400,8902][depth],'Perft');rows.push({variant,depth,nodes,pass:true});
  }
  await configureFull(fs);const fen='7k/8/8/8/3p4/2BO4/8/7K w - - 0 1';
  let pos=fromFen(fen);const game=new Game();game.load(pos);const tokens:string[]=[];
  for(const label of Array(2).fill(['d3d4','h8h7','d4e4','d5d4','e4d3','h7h8']).flat()){
   const m=label==='d3d4'?legalMoves(pos).find(m=>m.shove&&m.from===19&&m.to===27):legalMoves(pos).find(m=>{try{return toUci(m)===label;}catch{return false;}});must(m,'Repetition move '+label);tokens.push(fullAction(pos,m!));game.play(m!);pos=makeMove(pos,m!);
  }
  must(game.status==='drawRepetition','Reference repetition');await fs.ready('position fen '+fen+' moves '+tokens.join(' '));const repetition=await fs.query('kdinspect',s=>s.startsWith('kdinspectok'));must(repetition.includes('historydraw 1'),'Native whole-history repetition');rows.push({name:'whole-history-repetition',fen,tokens,reference:game.status,pass:true});
  await fs.ready('position fen '+fen);const illegal=await fs.ready('position fen '+fen+' moves @d000:0:0:0');must(illegal.at(-1)==='readyok','Negative control did not complete');must((await fs.fen())===fen,'Illegal history action was accepted');rows.push({name:'illegal-history-action',pass:true});
  const invalid=await fs.query('kdconfig '+fullConfig().replace('2,2,1,1,1,1,3,3','0,2,1,1,1,1,3,3'),s=>s.startsWith('kdconfigerror '));must(invalid.at(-1)?.startsWith('kdconfigerror '),'Unsupported native config accepted');rows.push({name:'unlimited-stateful-rejected',pass:true});
  writeFileSync(resolve(out,'complete.json'),JSON.stringify({rows,pass:true},null,2)+'\n');
 }finally{fs.close();setRules(DEFAULT_RULES);}
}
controls(resolve(process.argv[2]),resolve(process.argv[3])).catch(e=>{console.error(e);process.exitCode=1;});
