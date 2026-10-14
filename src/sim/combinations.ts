import { comboSchedule, comboGameSpec, strategies, type ComboSpec, type ComboJob, type Candidate, type Strategy } from './combination-plan';
export * from './combination-plan';
/** Fixed four-cell experiments. One block is an army and opening stream, not one game. */
import { createHash } from 'node:crypto';
import { toFen } from '../rules/setup';
import { tFromZ } from './tournament';
import { startGame, type GameRecord } from './game';

export interface ComboRecord { job: ComboJob; specHash: string; source: string; record: GameRecord }
export const digest = (x: unknown): string => createHash('sha256').update(JSON.stringify(x)).digest('hex');
export function validateResults(s: ComboSpec, rows: readonly ComboRecord[], blocks?: readonly number[]): void {
  const jobs=comboSchedule(s).filter(j=>!blocks||blocks.includes(j.block));
  const expected=new Map(jobs.map(j=>[j.gameId,j])); const seen=new Set<number>();
  for(const row of rows){
    const j=expected.get(row.job.gameId);
    if(!j || seen.has(row.job.gameId) || digest(j)!==digest(row.job)) throw new Error('Duplicate, extra, or changed job');
    if(row.source!==s.source || row.specHash!==digest(s)) throw new Error('Source or spec mismatch');
    const r=row.record;
    const expectedStart=toFen(startGame(j.backRankWhite,j.backRankBlack,j.fen).pos);
    if(r.startFen!==expectedStart||r.configId!==j.configId||r.openingPlies!==4) throw new Error('Invalid start or opening');
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
