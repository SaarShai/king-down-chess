/** Frozen, paired comparison. Every native proposal is checked by the reference rules. */
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Game } from '../src/game';
import { BUILT, KINGS, DEFAULT_RULES, POWERS_BALANCED, setRules, type Rules, type CardName, type KingName } from '../src/rules/rules';
import { startPosition, randomBackRank, toFen, fromFen, shuffle } from '../src/rules/setup';
import { fullAction, fullActions, fullConfig, configureFull, resolveFullTurn } from './fairy-stockfish-full';
import { Uci, sameMoves } from './fairy-stockfish-smoke';
import { sourceId } from '../src/sim/identity';
import { search, resetSearchState, setEvaluator, positionKey } from '../src/ai/search';
import { evalParams } from '../src/ai/eval';
export const MATCH_POOL:CardName[]=['Freeze','IceWall','Strike','Haste','Flight','Sacrifice','March','Leap','Mimic','Vault','Curse','SkyLift','Salvation','Firewall','FirewallB','EarthQuake','EarthQuakeB','Burn','FireStarter','Control','Growth','GrowthB','Rally','Spawn2','SpawnK','SpawnK2','MorphP','MirrorB'];
export type MatchJob={id:number;block:number;stratum:string;fairyWhite:boolean;fen:string;rules:Rules};
export type MatchSpec={id:string;approval:string;source:string;runtime:Record<string,string>;cardPool:CardName[];seed:number;timeMs:number;maxActions:number;nnue:false;evaluator:'residual';eval:ReturnType<typeof evalParams>;parts:{name:string;ids:number[]}[];jobs:MatchJob[]};
const must=(ok:unknown,msg:string):void=>{if(!ok)throw Error(msg);};
export const fileHash=(path:string):string=>createHash('sha256').update(readFileSync(path)).digest('hex');
export function runtimeManifest():Record<string,string>{
 const paths=['src/game.ts','src/sim/identity.ts','src/sim/spec.ts','tools/fairy-stockfish-match.ts','tools/fairy-stockfish-full.ts','tools/fairy-stockfish-smoke.ts','tools/fairy-stockfish.ini','tools/fairy-stockfish/kingdown.patch'];
 const walk=(root:string):void=>{for(const name of readdirSync(root).sort()){const path=root+'/'+name;if(statSync(path).isDirectory())walk(path);else if(path.endsWith('.ts')&&!path.endsWith('.test.ts'))paths.push(path);}};
 for(const dir of ['src/rules','src/ai','src/workshop'])walk(dir);
 return Object.fromEntries([...new Set(paths)].sort().map(path=>[path,fileHash(path)]));
}
export function matchSpec(pilot=false):MatchSpec{
 setEvaluator('residual');let seed=143211;const rng=():number=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};const jobs:MatchJob[]=[];
 for(let block=0;block<(pilot?1:24);block++){
  setRules(DEFAULT_RULES);const rank=randomBackRank(rng,'QOLRRBBNNAAGMMS'),fen=toFen(startPosition(rank));
  const power=BUILT[block%BUILT.length],king=Object.keys(KINGS).find(k=>KINGS[k as KingName].includes(power)) as KingName;
  const deal=shuffle([...MATCH_POOL],rng).slice(0,4);
  const profiles:[string,Rules][]=[['base',{...DEFAULT_RULES}],['kings-default',{...DEFAULT_RULES,kings:[{king,power},{king,power}]}],['kings-balanced',{...DEFAULT_RULES,...POWERS_BALANCED,kings:[{king,power},{king,power}]}],['cards-balanced',{...DEFAULT_RULES,...POWERS_BALANCED,hands:[deal,deal]}]];
  for(const [stratum,rules]of profiles)for(const fairyWhite of [true,false]){fullConfig(rules);jobs.push({id:jobs.length,block,stratum,fairyWhite,fen,rules});}
 }
 const parts=pilot?[{name:'smoke',ids:jobs.map(j=>j.id)}]:[{name:'pilot',ids:[0,1]},...Array.from({length:5},(_,i)=>({name:'wave'+i,ids:jobs.filter(j=>j.id>=2&&Math.floor((j.id-2)/2)%5===i).map(j=>j.id)}))];
 return {id:pilot?'fairy-full-smoke':'fairy-full-match-20261011',approval:"go ahead and port the king powers and cards, verify them against our rules engine, and then compare Fairy-Stockfish against our current AI. don't merge yet.",source:sourceId(),runtime:runtimeManifest(),cardPool:[...MATCH_POOL],seed:143211,timeMs:80,maxActions:400,nnue:false,evaluator:'residual',eval:evalParams(),parts,jobs};
}
export async function runMatch(binary:string,specPath:string,partName:string,out:string):Promise<void>{
 must(!existsSync(out),'Output exists; preserve partials and investigate before any retry');const spec=JSON.parse(readFileSync(specPath,'utf8')) as MatchSpec;
 const part=spec.parts.find(p=>p.name===partName);must(part&&part.ids.length>0,'Part is absent');must(spec.source===sourceId(),'Reference source differs');must(JSON.stringify(spec.runtime)===JSON.stringify(runtimeManifest()),'Frozen runtime differs');must(spec.timeMs===80&&spec.maxActions===400&&!spec.nnue&&spec.evaluator==='residual','Unexpected limits');
 mkdirSync(out,{recursive:true});setEvaluator('residual');must(JSON.stringify(evalParams())===JSON.stringify(spec.eval),'Evaluation differs');
 const header={part:partName,ids:part!.ids,specSha256:fileHash(specPath),binarySha256:fileHash(binary),source:sourceId(),at:new Date().toISOString(),approval:spec.approval,platform:process.platform,arch:process.arch,node:process.version};writeFileSync(resolve(out,'header.json'),JSON.stringify(header,null,2)+'\n');
 const fs=new Uci(binary,resolve('tools/fairy-stockfish.ini'));fs.stderrPath=resolve(out,'stderr.log');
 try{
  const protocol=await fs.query('uci',s=>s==='uciok');must(protocol.some(s=>s.startsWith('id name Fairy-Stockfish')),'Wrong engine');writeFileSync(resolve(out,'uci.json'),JSON.stringify(protocol));
  await fs.ready('setoption name Threads value 1\nsetoption name Hash value 16\nsetoption name Use NNUE value false\nsetoption name Move Overhead value 0');
  for(const id of part!.ids){
   const job=spec.jobs.find(j=>j.id===id);must(job,'Missing job');setRules(job!.rules);await configureFull(fs);resetSearchState();
   const game=new Game();game.load(fromFen(job!.fen));const history=[positionKey(game.pos)],tokens:string[]=[],trace:unknown[]=[];let plans=0;
   const sync=async():Promise<void>=>{
    writeFileSync(resolve(out,'active-game.json'),JSON.stringify({...job,tokens,trace,fen:toFen(game.pos)},null,2)+'\n');
    await fs.ready('position fen '+job!.fen+(tokens.length?' moves '+tokens.join(' '):''));
    const lines=await fs.query('kdlegal',s=>s==='kdlegalok',60000);must(lines.includes('fen '+toFen(game.pos)),'Native state diverged');sameMoves([...fullActions(game.pos).keys()],lines.filter(s=>s.startsWith('action ')).map(s=>s.slice(7)));
   };
   await sync();
   while(game.status==='playing'&&tokens.length<spec.maxActions){
    const fairy=(game.pos.turn===0)===job!.fairyWhite,begin=performance.now();let token:string,info:unknown,plan:string|undefined;
    if(fairy){const lines=await fs.query('go movetime '+spec.timeMs,s=>s.startsWith('bestmove '),60000);plan=lines.at(-1)!.split(' ')[1];const reply=resolveFullTurn(game.pos,plan);plans+=reply.moves.length===2?1:0;token=plan.split(',')[0];info=lines.filter(s=>s.startsWith('info depth ')).slice(-1);}
    else{const r=search(game.pos,{timeMs:spec.timeMs,maxDepth:62,history,multiPv:1,temperature:0});must(r.move,'No current-AI move');token=fullAction(game.pos,r.move!);info={depth:r.depth,nodes:r.nodes,score:r.score};}
    const elapsedMs=performance.now()-begin,m=fullActions(game.pos).get(token);must(m,'Illegal proposal');
    trace.push({index:tokens.length,side:game.pos.turn,engine:fairy?'fairy':'current',token,plan,elapsedMs,info});game.play(m!);tokens.push(token);history.push(positionKey(game.pos));await sync();
   }
   const capped=game.status==='playing',winner=game.status==='checkmate'?1-game.pos.turn:null;
   const result={...job,tokens,trace,plans,status:game.status,capped,winner,fairyScore:capped?null:winner===null ? .5 : ((winner===0)===job!.fairyWhite?1:0),terminalFen:toFen(game.pos),legalSetChecks:tokens.length+1};
   appendFileSync(resolve(out,'games.jsonl'),JSON.stringify(result)+'\n');console.log(JSON.stringify({id,stratum:job!.stratum,actions:tokens.length,status:game.status,capped,fairyScore:result.fairyScore}));
  }
  writeFileSync(resolve(out,'complete.json'),JSON.stringify({...header,games:part!.ids.length,finishedAt:new Date().toISOString()},null,2)+'\n');
 }finally{fs.close();setRules(DEFAULT_RULES);}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){const [command,...args]=process.argv.slice(2);if(command==='freeze'){const spec=matchSpec(args[1]==='smoke');writeFileSync(resolve(args[0]),JSON.stringify(spec,null,2)+'\n',{flag:'wx'});}else if(command==='run')runMatch(resolve(args[0]),resolve(args[1]),args[2],resolve(args[3])).catch(e=>{console.error(e);process.exitCode=1;});else throw Error('Usage: freeze <new-spec> [smoke] | run <binary> <spec> <part-name> <new-out>');}
