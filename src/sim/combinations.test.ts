import { describe, expect, it } from 'vitest';
import { DEFAULT_RULES, setRules } from '../rules/rules';
import { fromFen, toLan } from '../rules/setup';
import { legalMoves, makeMove, P, type Position } from '../rules/engine';
import { comboSchedule,comboGameSpec,comboReport,digest,interval,validateResults,type ComboSpec,type ComboRecord } from './combinations';
import { traceActions } from './action-trace';
import { countGame, at, F } from '../../tools/piece-activity';
import type { GameRecord } from './game';
const spec:ComboSpec={id:'test-combos',source:'fixed',approval:{date:'2026-10-10',quote:'test'},rules:{...DEFAULT_RULES},pool:'QOLRRBBNNAAGMMS',cardPool:['Flight','GrowthB','MorphP'],depth:1,blocks:12,seed:9011,maxPlies:10,candidates:[{id:'beast-flight',factors:[{kind:'piece',piece:'S',replacement:'N'},{kind:'card',card:'Flight'}],reason:'test'}]};
function records(s=spec):ComboRecord[]{return comboSchedule(s).map(job=>({job,source:s.source,specHash:digest(s),record:{...job,openingPlies:4,result:.5,plies:0,moves:[],rules:comboGameSpec(s,job).rules} as unknown as GameRecord}));}
describe('combination experiments',()=>{
 it('pairs four cells and swaps focal hands and armies without changing block seeds',()=>{
  const jobs=comboSchedule(spec);expect(jobs).toHaveLength(12*12);
  for(let b=0;b<12;b++){
   const rs=jobs.filter(j=>j.block===b);expect(new Set(rs.map(j=>j.seed)).size).toBe(1);
   const both=rs.filter(j=>j.cell===3&&j.strategy==='standard');
   expect(both[0].backRankWhite).toBe(both[1].backRankBlack);expect(both[0].backRankBlack).not.toContain('S');
   expect(comboGameSpec(spec,both[0]).rules!.hands).toEqual([['Flight'],[]]);expect(comboGameSpec(spec,both[1]).rules!.hands).toEqual([[],['Flight']]);
  }
  expect(comboSchedule(spec)).toEqual(jobs);
 });
 it('registers a real search incentive while leaving legal rules unchanged',()=>{
  const jobs=comboSchedule(spec),a=jobs.find(j=>j.cell===3&&j.strategy==='standard')!,b=jobs.find(j=>j.cell===3&&j.strategy==='spend')!;
  expect(comboGameSpec(spec,a).rules).toEqual(comboGameSpec(spec,b).rules);expect(comboGameSpec(spec,b).powerHold?.Flight).toBe(0);expect(comboGameSpec(spec,a).powerHold).toBeUndefined();
 });
 it('rejects incomplete, duplicate, altered and wrong-source results',()=>{
  const r=records();expect(()=>validateResults(spec,r)).not.toThrow();
  expect(()=>validateResults(spec,r.slice(1))).toThrow('Incomplete');expect(()=>validateResults(spec,[...r,r[0]])).toThrow('Duplicate');
  expect(()=>validateResults(spec,[{...r[0],source:'wrong'},...r.slice(1)])).toThrow('Source');
  expect(()=>validateResults(spec,[{...r[0],job:{...r[0].job,seed:2}},...r.slice(1)])).toThrow('changed');
 });
 it('finds zero interaction and preserves the independent block count',()=>{
  const report=comboReport(spec,records());expect(report.results.every(r=>r.interaction.mean===0)).toBe(true);expect(report.results[0].interaction.n).toBe(12);expect(interval([1,2]).low).toBeNull();
 });
 it('uses a fixed draw order in the Growth cells',()=>{
  const s={...spec,candidates:[{id:'draw-morph',factors:[{kind:'card',card:'GrowthB'},{kind:'card',card:'MorphP'}],reason:'test'}]} as ComboSpec;
  const jobs=comboSchedule(s),a=jobs.find(j=>j.cell===1)!,b=jobs.find(j=>j.cell===3)!;
  expect(comboGameSpec(s,a).rules!.piles).toEqual(comboGameSpec(s,b).rules!.piles);
 });
 it('refuses missing provenance and bad factors',()=>{
  expect(()=>comboSchedule({...spec,rules:{} as ComboSpec['rules']})).toThrow('Full');
  expect(()=>comboSchedule({...spec,blocks:0})).toThrow('blocks');
 });
});

function cardSequence(card:string,fen:string,select:(p:Position)=>ReturnType<typeof legalMoves>[number]){
 const rules={...DEFAULT_RULES,hands:[[card],[]],piles:[['Flight'],[]]} as ComboSpec['rules'];setRules(rules);const p=fromFen(fen),m=select(p);expect(m).toBeTruthy();
 const lans=[toLan(p,m)];const g={gameId:7,startFen:fen,moves:lans.map(lan=>({lan})),openingPlies:0};
 return {trace:traceActions(g,rules),counts:countGame({key:'card',gameId:7,startFen:fen,lans,openingPlies:0,rules,result:.5,ordinary:false}),next:makeMove(p,m)};
}
describe('card action identity tracking',()=>{
 it('tracks both spawned pawns without pretending they started or chose a move',()=>{
  const x=cardSequence('Spawn2','4k3/8/8/8/8/8/4P3/4K3 w - - 0 1',p=>legalMoves(p).find(m=>m.drop2!==undefined)!);
  expect(x.trace.pieces.filter(p=>p.type===P&&!p.start)).toHaveLength(2);expect(x.counts.row[at(P,F.start)]).toBe(1);expect(x.trace.pieces.every(p=>p.displacements===0)).toBe(true);
 });
 it('tracks a multi-piece push and an unchanged-board draw',()=>{
  const q=cardSequence('EarthQuakeB','4k3/8/8/3PP3/3RR3/8/8/4K3 w - - 0 1',p=>legalMoves(p).find(m=>(m.pushes?.length??0)>=2)!);
  expect(q.trace.pieces.filter(p=>p.displacements>0).length).toBeGreaterThanOrEqual(2);
  const g=cardSequence('GrowthB','4k3/8/8/8/8/8/4P3/4K3 w - - 0 1',p=>legalMoves(p).find(m=>m.power==='growthb')!);
  expect(g.trace.cards[0].actor).toBeNull();expect(g.trace.pieces.every(p=>p.cardMoves===0)).toBe(true);
 });
 it('tracks swaps and transformations and refuses illegal ordinary moves',()=>{
  const x=cardSequence('SkyLift','4k3/8/8/8/8/8/3RN3/4K3 w - - 0 1',p=>legalMoves(p).find(m=>m.power==='skylift')!);expect(x.trace.cards[0].card).toBe('SkyLift');
  const m=cardSequence('MorphP','4k3/8/8/8/8/8/4P3/4K3 w - - 0 1',p=>legalMoves(p).find(m=>m.power==='morphp')!);expect(m.trace.pieces.filter(p=>!p.start)).toHaveLength(1);
  expect(()=>traceActions({gameId:9,startFen:'4k3/8/8/8/8/8/4P3/4K3 w - - 0 1',moves:[{lan:'e2-e5'}],openingPlies:0},{...DEFAULT_RULES})).toThrow('Illegal');
 });
});
