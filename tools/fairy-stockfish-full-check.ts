/** Independent native rules conformance. This performs no game campaign. */
import { createHash } from 'node:crypto';
import { mkdirSync, appendFileSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { BUILT, ALL_CARDS, DEFAULT_RULES, POWERS_BALANCED, KINGS, RULES, setRules, type Rules, type CardName, type KingName } from '../src/rules/rules';
import { legalMoves, makeMove, isAttacked, inCheck, status, type Position, type Color } from '../src/rules/engine';
import { fromFen, toFen } from '../src/rules/setup';
import { Uci, sameMoves, toUci } from './fairy-stockfish-smoke';
import { baseFixtures } from './fairy-stockfish-corpus';
import { configureFull, fullActions, fullTurns, fullAction } from './fairy-stockfish-full';
const must = (ok: unknown, message: string): void => { if (!ok) throw new Error(message); };
const BASE = '7k/1qprnb2/2a1s3/1p1o1p2/2P1P3/1ALNMC2/1P2RP2/K7 w - - 17 4';
function reflect(p: Position): Position {
  const n = fromFen(toFen(p)); n.turn = (p.turn ^ 1) as Color;
  for(let i=0;i<64;i++) n.board[63-i] = p.board[i] ? p.board[i] ^ 16 : 0;
  if(p.used)n.used=[p.used[1],p.used[0]];
  if(p.drawn)n.drawn=[p.drawn[1],p.drawn[0]];
  if(p.last)n.last=[p.last[1],p.last[0]];
  if(p.lost)n.lost=[...p.lost.slice(16),...p.lost.slice(0,16)];
  if(p.marks)n.marks=[p.marks[1]&&{...p.marks[1],sq:63-p.marks[1].sq},p.marks[0]&&{...p.marks[0],sq:63-p.marks[0].sq}];
  if(p.haste!==undefined)n.haste=63-p.haste;
  return n;
}
type Fixture={name:string;pos:Position;rules:Rules;turns?:boolean;start?:string;history?:string[]};
export function fullFixtures(): Fixture[] {
 const fixtures:Fixture[]=[];
 for(const side of [0,1] as const)for(const balanced of [false,true]){
  const pos=fromFen('7k/8/3n4/8/2LR4/8/8/K7 w - - 0 1');
  fixtures.push({name:`control-borrowed-paladin-${side}-${balanced}`,pos:side?reflect(pos):pos,rules:{...DEFAULT_RULES,...(balanced?POWERS_BALANCED:{}),hands:[['Control','MirrorB'],['Control','MirrorB']]},turns:true});
 }
 setRules(DEFAULT_RULES);
 for(const input of baseFixtures()) {
  let pos=fromFen(input.fen);const history:string[]=[];
  for(const label of input.moves??[]){const m=legalMoves(pos).find(m=>{try{return toUci(m)===label;}catch{return false;}});must(m,'Missing base prefix');history.push(fullAction(pos,m!));pos=makeMove(pos,m!);}
  fixtures.push({name:input.name,pos,rules:{...DEFAULT_RULES},turns:false,start:input.fen,history});
 }
 for(const balanced of [false,true]) {
  const profile={...DEFAULT_RULES,...(balanced?POWERS_BALANCED:{})} as Rules;
  for(const power of BUILT) for(const side of [0,1] as const){
   const pos=fromFen(BASE+' lNBRAOnbrao');
   fixtures.push({name:`king-${balanced}-${power}-${side}`,pos:side?reflect(pos):pos,rules:{...profile,kings:[{king:Object.keys(KINGS).find(k=>KINGS[k as KingName].includes(power)) as KingName,power},{king:Object.keys(KINGS).find(k=>KINGS[k as KingName].includes(power)) as KingName,power}]},turns:true});
  }
  for(const card of ALL_CARDS) for(const side of [0,1] as const){
   const pos=fromFen(BASE+' lNBRAOnbrao'+(card==='Rescue'?'/mc3w0/mf6b0':''));
   const other:CardName=card==='Mirror'?'Haste':card;
   const hands:Rules['hands']=[[card,...card==='MirrorB'?['Haste' as const]:[]],[other]];
   if(card==='Mirror')pos.last=['Haste','Haste'];
   fixtures.push({name:`card-${balanced}-${card}-${side}`,pos:side?reflect(pos):pos,rules:{...profile,hands:side?[hands[1],hands[0]]:hands,piles:[['Strike','Growth'],['Strike','Growth']]},turns:true});
  }
 }
 for(const state of ['u1.0','mc3wi2/mf6ba2','mc3w0/mf6b0','f','hc3','hc3r','hc3t','hc3o','d1.1/u2.1/yHaste.Strike','u3.0/lNBRAO']) {
  const rules={...DEFAULT_RULES,...POWERS_BALANCED,hands:[['Freeze','Haste','Mirror','GrowthB','Rescue','EarthQuake','Salvation','MirrorB'],['Haste','Freeze','Mirror','Growth','Rescue','EarthQuake','Salvation','MirrorB']],piles:[[],[]]} as Rules;
  if(state.startsWith('d')){rules.hands=[['Mirror','GrowthB','Freeze'],['Mirror','GrowthB','Freeze']];rules.piles=[['Strike'],['Haste']];}
  fixtures.push({name:'state-'+state,pos:fromFen(BASE+' '+state),rules,turns:true});
 }
 for(const halfmove of [99,100])fixtures.push({name:'first-action-terminal-'+halfmove,pos:fromFen(BASE.replace('17 4',`${halfmove} 4`)),rules:{...DEFAULT_RULES,...POWERS_BALANCED,hands:[['Freeze','GrowthB'],['Haste']],piles:[['Strike'],[]]},turns:true});
 for(const power of ['March','Leap'] as const)fixtures.push({name:'always-'+power,pos:fromFen(BASE),rules:{...DEFAULT_RULES,kings:[{king:Object.keys(KINGS).find(k=>KINGS[k as KingName].includes(power)) as KingName,power},{king:Object.keys(KINGS).find(k=>KINGS[k as KingName].includes(power)) as KingName,power}],[power==='March'?'marchUses':'leapUses']:0},turns:true});
 for(const move of [1,3,4,5])fixtures.push({name:'delayed-'+move,pos:fromFen(BASE.replace('17 4',`17 ${move}`)),rules:{...DEFAULT_RULES,hands:[['Haste','Freeze','MirrorB'],['Mirror','Haste']],fromMove:{Haste:4,Freeze:3,MirrorB:5}},turns:true});
 for(const balanced of [false,true])for(const white of BUILT)for(const black of BUILT)fixtures.push({name:`mixed-${balanced}-${white}-${black}`,pos:fromFen(BASE),rules:{...DEFAULT_RULES,...(balanced?POWERS_BALANCED:{}),kings:[{king:Object.keys(KINGS).find(k=>KINGS[k as KingName].includes(white)) as KingName,power:white},{king:Object.keys(KINGS).find(k=>KINGS[k as KingName].includes(black)) as KingName,power:black}]},turns:true});
 for(const card of ALL_CARDS)for(const reserve of ['', ' lRnb'])fixtures.push({name:`material-${card}-${reserve}`,pos:fromFen('7k/8/8/8/3N4/8/8/K7 w - - 0 1'+reserve),rules:{...DEFAULT_RULES,hands:[[card],['Mirror']],piles:[['Salvation'],['Strike']]},turns:true});
 for(const markTurns of [1,2] as const)for(const strikeMode of ['move','capture'] as const)for(const hasteSecond of ['any','quiet'] as const)fixtures.push({name:`readings-${markTurns}-${strikeMode}-${hasteSecond}`,pos:fromFen(BASE),rules:{...DEFAULT_RULES,markTurns,strikeMode,hasteSecond,hands:[['Freeze','IceWall','Strike','Haste'],['Freeze','IceWall','Strike','Haste']]},turns:true});
 for(const balanced of [false,true])for(const side of [0,1] as const)for(const card of ALL_CARDS){
  const base=fromFen('3n3k/8/2p1p3/8/2K1PN2/3NAM2/8/8 w - - 0 4 lNBRAOnbrao/md3w0');
  const pos=side?reflect(base):base;
  const profile={...DEFAULT_RULES,...(balanced?POWERS_BALANCED:{})} as Rules;
  for(const via of ['direct','mirror','mirrorb'] as const){
   const hand:CardName[]=via==='mirror'?['Mirror']:via==='mirrorb'?['MirrorB',card]:[card];
   if(via==='mirror'&&(card==='Mirror'||card==='MirrorB'))continue;
   if(via==='mirrorb'&&(card==='Mirror'||card==='MirrorB'))continue;
   pos.last=[card,card];
   const rules={...profile,hands:side?[[card],hand]:[hand,[card]],piles:[['Haste','GrowthB'],['Haste','GrowthB']]} as Rules;
   fixtures.push({name:`copy-${balanced}-${side}-${card}-${via}`,pos:fromFen(toFen(pos)),rules,turns:true});
  }
 }
 return fixtures;
}
export async function checkFull(binary:string,out:string):Promise<void>{
 must(!existsSync(out),'Output exists; preserve it');mkdirSync(out,{recursive:true});
 const fixtures=fullFixtures();writeFileSync(resolve(out,'spec.json'),JSON.stringify({binarySha256:createHash('sha256').update(readFileSync(binary)).digest('hex'),patchSha256:createHash('sha256').update(readFileSync('tools/fairy-stockfish/kingdown.patch')).digest('hex'),fixtures:fixtures.map(f=>({...f,pos:toFen(f.pos)})),traceSeed:817211,traceDeals:24,traceActions:48},null,2)+'\n');const fs=new Uci(binary,resolve('tools/fairy-stockfish.ini'));fs.stderrPath=resolve(out,'stderr.log');
 const coverage=new Set<string>();let count=0,effects=0,turns=0;
 try{
  await fs.query('uci',s=>s==='uciok');await fs.ready('setoption name Threads value 1\nsetoption name Hash value 16\nsetoption name Use NNUE value false');
  const check=async(f:Fixture):Promise<void>=>{
   setRules(f.rules);await configureFull(fs);const fen=toFen(f.pos);await fs.ready('position fen '+(f.start??fen)+(f.history?.length?' moves '+f.history.join(' '):''));
   const hashes:string[]=[];
   const inspect=async(whole:boolean):Promise<void>=>{
    const lines=await fs.query(whole?'kdturninspect':'kdinspect',s=>s.startsWith('kdinspectok'),60000);
    must(lines.find(s=>s.startsWith('fen '))==='fen '+fen,f.name+' FEN');
    must(lines.includes('check '+Number(inCheck(f.pos))),f.name+' check');
    const statuses=['playing','checkmate','stalemate','draw50','drawMaterial'];
    must(lines.includes('status '+statuses.indexOf(status(f.pos))),f.name+' status '+status(f.pos));
    for(const side of [0,1] as const){let attack=0n;for(let s=0;s<64;s++)if(isAttacked(f.pos.board,s,side))attack|=1n<<BigInt(s);must(lines.includes(`attack ${side} ${attack.toString(16)}`),f.name+' attack '+side);}
    const expected=whole?fullTurns(f.pos):new Map([...fullActions(f.pos)].map(([t,m])=>[t,makeMove(f.pos,m)]));
    const actual=new Map(lines.filter(s=>s.startsWith('effect ')).map(s=>{const split=s.indexOf(' ',7);return [s.slice(7,split),s.slice(split+1)];}));
    try{sameMoves([...expected.keys()],[...actual.keys()]);}catch(e){throw new Error(f.name+' '+(whole?'turns':'actions')+' '+String(e));}
    for(const [token,pos]of expected){must(actual.get(token)===toFen(pos),f.name+' child '+token+' '+actual.get(token)+' <> '+toFen(pos));must(lines.includes('childcheck '+token+' '+Number(inCheck(pos))),f.name+' child check '+token);}
    hashes.push(createHash('sha256').update(lines.join('\n')).digest('hex'));
    if(whole)turns+=expected.size;else effects+=expected.size;
   };
   await inspect(false);if(f.turns)await inspect(true);
   for(const m of legalMoves(f.pos))if(m.power)coverage.add(m.power+(m.via?':'+m.via:''));
   appendFileSync(resolve(out,'checks.jsonl'),JSON.stringify({name:f.name,fen,rules:RULES,effects:fullActions(f.pos).size,hashes,start:f.start,history:f.history,pass:true})+'\n');count++;
  };
  for(const f of fixtures)await check(f);
  // Legal traces mix marks, copies, draws and all fixed pieces. These are not strength games.
  let seed=817211;const rand=(n:number):number=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return(seed>>>8)%n;};
  for(let deal=0;deal<24;deal++){
   const cards=ALL_CARDS.filter(c=>c!=='Spawn2'&&c!=='SpawnK2');
   const rules={...DEFAULT_RULES,...(deal%2?POWERS_BALANCED:{}),hands:[Array.from({length:4},()=>cards[rand(cards.length)]),Array.from({length:4},()=>cards[rand(cards.length)])],piles:[['GrowthB','Mirror'],['MirrorB','GrowthB']]} as Rules;
   setRules(rules);let pos=fromFen(BASE);
   for(let ply=0;ply<48;ply++){await check({name:`trace-${deal}-${ply}`,pos,rules,turns:ply%4===0});if(status(pos)!=='playing')break;const moves=legalMoves(pos),powers=moves.filter(m=>m.power);const pool=powers.length&&rand(2)?powers:moves;pos=makeMove(pos,pool[rand(pool.length)]);}
  }
  writeFileSync(resolve(out,'complete.json'),JSON.stringify({count,effects,turns,coverage:[...coverage].sort(),pass:true},null,2)+'\n');
 }finally{fs.close();setRules(DEFAULT_RULES);}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)checkFull(resolve(process.argv[2]),resolve(process.argv[3])).catch(e=>{console.error(e);process.exitCode=1;});
