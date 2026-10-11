/** Fixed four-cell experiments. One block is an army and opening stream, not one game. */
import { createHash } from 'node:crypto';
import { ALL_CARDS, DEFAULT_RULES, setRules, type CardName, type Rules } from '../rules/rules';
import { randomBackRank } from '../rules/setup';
import { mulberry32 } from './rng';
import { pileFor, tFromZ, type TournamentSpec } from './tournament';
import type { Job, RunSpec } from './spec';
import type { GameRecord } from './game';

export type Factor = { kind: 'piece'; piece: string; replacement: string } | { kind: 'card'; card: CardName };
export type Strategy = 'standard' | 'spend';
export interface Candidate { id: string; factors: [Factor, Factor]; reason: string }
export interface ComboSpec {
  id: string; source: string; approval: { date: string; quote: string };
  rules: Rules; pool: string; cardPool: CardName[]; depth: number; blocks: number; seed: number;
  maxPlies: number; candidates: Candidate[];
}
export interface ComboJob extends Job { candidate: string; block: number; cell: number; strategy: Strategy; focal: 0 | 1; hand: CardName[] }
export interface ComboRecord { job: ComboJob; specHash: string; source: string; record: GameRecord }
export const digest = (x: unknown): string => createHash('sha256').update(JSON.stringify(x)).digest('hex');
export const strategies = (c: Candidate): Strategy[] => c.factors.some(f => f.kind === 'card') ? ['standard', 'spend'] : ['standard'];

export function validateSpec(s: ComboSpec): void {
  if (!/^[a-z0-9-]+$/.test(s.id) || !s.source || !s.approval?.quote) throw new Error('Missing run identity or approval');
  if (!Number.isInteger(s.blocks) || s.blocks < 1 || s.blocks > 1000 || !Number.isInteger(s.seed) || s.seed < 0) throw new Error('Invalid blocks or seed');
  if (![1,2,3,4].includes(s.depth) || !Number.isInteger(s.maxPlies) || s.maxPlies < 2 || s.maxPlies > 500) throw new Error('Invalid search limits');
  if (!s.rules || Object.keys(DEFAULT_RULES).some(k => !(k in s.rules))) throw new Error('Full frozen rules are required');
  if (!/^[PNBRQALGMSO]+$/.test(s.pool) || !s.cardPool.length || new Set(s.cardPool).size !== s.cardPool.length || s.cardPool.some(c => !ALL_CARDS.includes(c))) throw new Error('Invalid pool');
  if (!s.candidates.length || s.candidates.length > 10 || new Set(s.candidates.map(c => c.id)).size !== s.candidates.length) throw new Error('Invalid candidates');
  for (const c of s.candidates) {
    if (!/^[a-z0-9-]+$/.test(c.id) || c.factors.length !== 2 || new Set(c.factors.map(f => f.kind === 'piece' ? f.piece : f.card)).size !== 2) throw new Error('Invalid factors');
    for (const f of c.factors) {
      if (f.kind === 'piece') {
        if (!/^[ABRNGMLSO]$/.test(f.piece) || !/^[BNR]$/.test(f.replacement) || f.piece === f.replacement || !s.pool.includes(f.piece)) throw new Error('Invalid piece replacement');
      } else if (f.kind !== 'card' || !s.cardPool.includes(f.card)) throw new Error('Card is outside the frozen pool');
    }
  }
}

export function comboSchedule(s: ComboSpec): ComboJob[] {
  validateSpec(s); setRules(s.rules);
  const jobs: ComboJob[] = [];
  for (const [ci,c] of s.candidates.entries()) {
    const rng = mulberry32((s.seed + ci * 104729) >>> 0);
    for (let block = 0; block < s.blocks; block++) {
      let rank = '', tries = 0;
      do {
        if (++tries > 10000) throw new Error(`No eligible army for ${c.id}`);
        rank = randomBackRank(rng, s.pool);
      } while (c.factors.some(f => f.kind === 'piece' && [...rank].filter(x => x === f.piece).length !== 1));
      const seed = Math.floor(rng() * 0x100000000) >>> 0;
      const base = c.factors.reduce((r,f) => f.kind === 'piece' ? r.replace(f.piece,f.replacement) : r, rank);
      for (const strategy of strategies(c)) for (let cell=0;cell<4;cell++) {
        let focalRank=base; const hand: CardName[]=[];
        c.factors.forEach((f,i) => {
          if (!(cell & (1<<i))) return;
          if (f.kind === 'card') hand.push(f.card);
          else { const at=rank.indexOf(f.piece); focalRank=focalRank.slice(0,at)+f.piece+focalRank.slice(at+1); }
        });
        // With no cards, the two presets are identical; reuse the standard control in analysis.
        if(strategy==='spend'&&!hand.length)continue;
        for (const focal of [0,1] as const) jobs.push({
          gameId:jobs.length,pairId:Math.floor(jobs.length/2),colourSwapped:focal===1,configId:c.id,
          candidate:c.id,block,cell,strategy,focal,hand,seed,
          backRankWhite:focal===0?focalRank:base,backRankBlack:focal===1?focalRank:base,
        });
      }
    }
  }
  return jobs;
}

/** The spend preset values every unspent card at zero. It is an incentive, not a forced move. */
export function comboGameSpec(s: ComboSpec, j: ComboJob): RunSpec {
  const hands: [CardName[],CardName[]]=[[],[]];hands[j.focal]=j.hand;
  const piles: [CardName[],CardName[]]=[[],[]];
  if (j.hand.some(c=>c==='Growth'||c==='GrowthB')) {
    // Keep the draw order fixed across cells, including whether the other factor is present.
    const c=s.candidates.find(c=>c.id===j.candidate)!;
    const exclude=c.factors.flatMap(f=>f.kind==='card'?[f.card]:[]);
    piles[j.focal]=pileFor({cardPool:s.cardPool} as TournamentSpec,exclude,j.seed);
  }
  return {id:s.id,games:1,seed:j.seed,ai:{depth:s.depth,powerPlies:2},adjudicate:false,
    rules:{...s.rules,kings:[null,null],hands,piles},maxPlies:s.maxPlies,openingRandomPlies:4,
    ...(j.strategy==='spend'?{powerHold:{...Object.fromEntries(ALL_CARDS.map(c=>[c,0])),sacrificeShare:0}}:{}),
  };
}

export function validateResults(s: ComboSpec, rows: readonly ComboRecord[], blocks?: readonly number[]): void {
  const jobs=comboSchedule(s).filter(j=>!blocks||blocks.includes(j.block));
  const expected=new Map(jobs.map(j=>[j.gameId,j])); const seen=new Set<number>();
  for(const row of rows){
    const j=expected.get(row.job.gameId);
    if(!j || seen.has(row.job.gameId) || digest(j)!==digest(row.job)) throw new Error('Duplicate, extra, or changed job');
    if(row.source!==s.source || row.specHash!==digest(s)) throw new Error('Source or spec mismatch');
    const r=row.record;
    if(r.gameId!==j.gameId||r.seed!==j.seed||r.pairId!==j.pairId||r.colourSwapped!==j.colourSwapped||r.backRankWhite!==j.backRankWhite||r.backRankBlack!==j.backRankBlack||![0,.5,1].includes(r.result)||r.plies!==r.moves.length||r.plies>s.maxPlies||digest(r.rules)!==digest(comboGameSpec(s,j).rules)) throw new Error('Invalid record');
    seen.add(j.gameId);
  }
  if(seen.size!==expected.size)throw new Error(`Incomplete: ${seen.size}/${expected.size}`);
}
export function interval(xs: number[], joint=false): {n:number;mean:number;low:number|null;high:number|null} {
  if(!xs.length || xs.some(x=>!Number.isFinite(x))) throw new Error('Invalid observations');
  const mean=xs.reduce((a,b)=>a+b,0)/xs.length;
  if(xs.length<10)return {n:xs.length,mean,low:null,high:null};
  // 3.5 gives conservative Bonferroni coverage for at most 100 registered contrasts.
  const se=Math.sqrt(xs.reduce((a,b)=>a+(b-mean)**2,0)/(xs.length-1)/xs.length),err=tFromZ(joint?3.5:1.96,xs.length-1)*se;
  return {n:xs.length,mean,low:mean-err,high:mean+err};
}
export function comboReport(s:ComboSpec,rows:readonly ComboRecord[]){
  validateResults(s,rows);
  const metrics={score:(r:ComboRecord)=>r.job.focal===0?r.record.result:1-r.record.result,draw:(r:ComboRecord)=>r.record.result===.5?1:0,plies:(r:ComboRecord)=>r.record.plies};
  const results=[];
  const blockValues=(c:Candidate,strategy:Strategy,cell:number,get:(r:ComboRecord)=>number)=>{
    const effective=strategy==='spend'&&!c.factors.some((f,i)=>f.kind==='card'&&(cell&(1<<i)))?'standard':strategy;
    const rs=rows.filter(r=>r.job.candidate===c.id&&r.job.strategy===effective&&r.job.cell===cell);
    return Array.from({length:s.blocks},(_,block)=>rs.filter(r=>r.job.block===block).reduce((a,r)=>a+get(r),0)/2);
  };
  for(const c of s.candidates)for(const strategy of strategies(c)){
    for(const [metric,get] of Object.entries(metrics)){
      const cells=Array.from({length:4},(_,cell)=>blockValues(c,strategy,cell,get));
      const deltas=cells[0].map((_,i)=>cells[3][i]-cells[2][i]-cells[1][i]+cells[0][i]);
      results.push({candidate:c.id,strategy,metric,cells:cells.map(x=>interval(x)),interaction:interval(deltas),joint:interval(deltas,true)});
    }
  }
  const strategyEffects=s.candidates.filter(c=>strategies(c).length>1).flatMap(c=>Object.entries(metrics).map(([metric,get])=>{
    const a=blockValues(c,'standard',3,get),b=blockValues(c,'spend',3,get),d=b.map((v,i)=>v-a[i]);
    return {candidate:c.id,metric,comparison:'spend minus standard, both factors present',difference:interval(d),joint:interval(d,true)};
  }));
  return {id:s.id,source:s.source,specHash:digest(s),games:rows.length,blocks:s.blocks,caps:rows.filter(r=>r.record.reason==='plyCap').length,results,strategyEffects,
    scope:'Four-cell difference on the score scale, conditional on the named replacements and opponent. Fresh army/seed blocks; same RNG stream, not necessarily identical random opening moves. Low sample counts have no interval. No rule adoption.'};
}
