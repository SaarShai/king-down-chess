/** Held-out replay/search diagnostics. No winner-move labels or repair selection. */
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {Game} from '../src/game';
import {setRules,DEFAULT_RULES} from '../src/rules/rules';
import {fromFen,toFen} from '../src/rules/setup';
import {fullAction,fullActions,configureFull,resolveFullTurn} from './fairy-stockfish-full';
import {Uci} from './fairy-stockfish-smoke';
import {search,resetSearchState,setEvaluator,positionKey} from '../src/ai/search';
const [candidatePath,baselinePath,input,out]=process.argv.slice(2);if(existsSync(out))throw Error('Preserve output');mkdirSync(out,{recursive:true});
const candidate=new Uci(resolve(candidatePath),resolve('tools/fairy-stockfish.ini')),baseline=new Uci(resolve(baselinePath),resolve('tools/fairy-stockfish.ini'));
const rows:any[]=[];
try{
 for(const fs of[candidate,baseline]){await fs.query('uci',s=>s==='uciok');await fs.ready('setoption name Threads value 1\nsetoption name Hash value 16\nsetoption name Use NNUE value false\nsetoption name Move Overhead value 0');}
 setEvaluator('residual');
 for(const line of readFileSync(input,'utf8').trim().split('\n')){
  const p=JSON.parse(line);setRules(p.rules);const game=new Game();game.load(fromFen(p.startFen));const history=[positionKey(game.pos)];
  for(const token of p.history){const m=fullActions(game.pos).get(token);if(!m)throw Error('Illegal held-out prefix');game.play(m);history.push(positionKey(game.pos));}
  if(toFen(game.pos)!==p.fen||JSON.stringify([...fullActions(game.pos).keys()])!==JSON.stringify(p.legal))throw Error('Held-out state/legal set differs');
  const results:any={};
  for(const [name,fs]of[['candidate',candidate],['baseline',baseline]]as const){await configureFull(fs);await fs.ready('position fen '+p.startFen+(p.history.length?' moves '+p.history.join(' '):''));const t=performance.now(),lines=await fs.query('go movetime 1000',s=>s.startsWith('bestmove '),60000),plan=lines.at(-1)!.split(' ')[1];resolveFullTurn(game.pos,plan);results[name]={plan,elapsedMs:performance.now()-t,info:lines.filter(s=>s.startsWith('info depth ')).slice(-1)};}
  resetSearchState();const t=performance.now(),current=search(game.pos,{timeMs:1000,maxDepth:62,history,multiPv:1,temperature:0});if(!current.move)throw Error('No current proposal');const token=fullAction(game.pos,current.move);if(!fullActions(game.pos).has(token))throw Error('Illegal current proposal');results.current={token,elapsedMs:performance.now()-t,depth:current.depth,nodes:current.nodes};
  rows.push({cohort:p.cohort,id:p.id,index:p.index,results});writeFileSync(resolve(out,'probes.json'),JSON.stringify(rows));
 }
 writeFileSync(resolve(out,'complete.json'),JSON.stringify({pass:true,positions:rows.length,method:'Full-history held-out legal proposal checks. Move agreement and depth are diagnostics, not best-move or strength labels.'},null,2)+'\n');
}finally{candidate.close();baseline.close();setRules(DEFAULT_RULES);}
