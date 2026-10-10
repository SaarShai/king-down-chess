/** Explicit campaign import. A queue line or run name is never provenance. */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { armStats } from '../sim/experiments';
import { schedule, gameRules, gameSpec, resampleArmies, simultaneous, halfWidth, drawOf, type TRecord, type TournamentSpec } from '../sim/tournament';
import type { GameRecord } from '../sim/game';
import { stampOf } from '../sim/run';
import { buildJobs } from '../sim/spec';
import { oddsWorth } from './criteria';
import { stable, unknownContext, type Measurement, type MeasurementContext } from './measurements';
import type { BalanceDataset } from './dataset';
import { addGame, newTally, fromTournament, total, reported, summarise, bootstrap } from '../../tools/piece-activity';
import { DEFAULT_RULES } from '../rules/rules';
import { G, LETTERS } from '../rules/engine';

type Json = Record<string, any>;
const json = (p: string): Json => JSON.parse(readFileSync(p, 'utf8'));
const sha = (v: string | Buffer) => createHash('sha256').update(v).digest('hex');
const requireEqual = (a: unknown, b: unknown, label: string) => { if (stable(a) !== stable(b)) throw new Error(`Campaign mismatch: ${label}`); };

export function checkCampaignRows(rows: Json[], jobs: Json[], stamp?: Json): void {
  const expected = new Map(jobs.map(j => [j.gameId, j]));
  if (rows.length !== jobs.length || new Set(rows.map(r => r.gameId)).size !== jobs.length) throw new Error('Campaign schedule is incomplete or has duplicate IDs');
  for (const row of rows) {
    const job = expected.get(row.gameId);
    if (!job) throw new Error(`Extra game ${row.gameId}`);
    for (const [key, value] of Object.entries(job)) requireEqual(row[key === 'fen' ? 'startFen' : key], value, `game ${row.gameId} ${key}`);
    if (stamp) for (const [key, value] of Object.entries(stamp)) requireEqual(row[key], value, `stamp ${key}`);
    if (![0,.5,1].includes(row.result) || (!Number.isSafeInteger(row.plies) || row.plies < 0)) throw new Error('Invalid game result');
  }
}

export function checkedRaw(path: string, expectedHash: string): Json[] {
  const bytes = readFileSync(path);
  requireEqual(sha(bytes), expectedHash, `raw hash ${path}`);
  if (!bytes.length || bytes[bytes.length - 1] !== 10) throw new Error('Torn raw file');
  return bytes.toString().trim().split('\n').map(line => JSON.parse(line));
}

/** Import only complete studies with a saved validation record. Partial studies stay pending. */
export function importCampaign(dir: string, dataset: BalanceDataset): void {
  const manifest = json(join(dir, 'campaign.json'));
  const source = join(dir, 'analysis-source');
  requireEqual(sha(readFileSync(join(dir, 'source.tar'))), manifest.sourceArchiveSha256, 'source archive');
  const localRoot = fileURLToPath(new URL('../../', import.meta.url));
  for (const [path, digest] of Object.entries(manifest.files)) {
    requireEqual(sha(readFileSync(join(source, path))), digest, `source ${path}`);
    if (/^src\/(rules|sim|ai)\//.test(path) || path === 'tools/piece-activity.ts' || path === 'src/game.ts') requireEqual(sha(readFileSync(join(localRoot, path))), digest, `analysis source ${path}`);
  }
  dataset.inputDigest = sha(stable({previous:dataset.inputDigest, manifest:sha(readFileSync(join(dir,'campaign.json'))), provenance:manifest.runs.map((r:Json)=>{const path=join(dir,`${r.id}.provenance.json`);return existsSync(path)?sha(readFileSync(path)):null;})}));
  const all: Measurement[] = [];
  for (const run of manifest.runs as Json[]) {
    const provenancePath = join(dir, `${run.id}.provenance.json`);
    if (!existsSync(provenancePath)) continue;
    const p = json(provenancePath);
    requireEqual(p.commit, manifest.commit, 'commit'); requireEqual(p.sourceArchiveSha256, manifest.sourceArchiveSha256, 'archive identity');
    requireEqual(p.command, run.args, 'command');
    const baseContext = { ...unknownContext(), flagsKind:'full' as const, commit:p.commit, commitSource:'spec' as const, stampSource:'derived' as const, sourceHash:p.src, sourceArchiveSha256:p.sourceArchiveSha256, pool:p.pool, depth:null, machine:run.kind === 'm1' ? 'M1' : 'Kaggle', variantScope:'none' as const };
    const emit = (context: MeasurementContext, element: string, measure: Measurement['measure'], criterion: string | undefined, value: number, low: number | null, high: number | null, unit: string, errorKind: string, sample: number, more: Partial<Measurement> = {}) => {
      if (!Number.isFinite(value)) return;
      all.push({id:`campaign:${run.id}:${element}:${criterion ?? measure}:${measure}`, run:run.id,element,version:p.commit,context,measure,criterion,value,error:low === null || high === null ? null : Math.max(value-low,high-value),errorKind,sample,sampleUnit:'games',unit,validity:'valid',reasons:[],sources:[provenancePath],method:'checked immutable campaign; no price or rule adoption',...(low !== null && high !== null ? {interval:{low,high,kind:errorKind}} : {}),...more});
    };
    if (run.kind === 'm1') {
      const checkedPath = join(dir, 'worth-counts-stamps-check.json');
      if (!existsSync(checkedPath)) continue;
      const checks = json(checkedPath).arms as Json[];
      const out = join(dir, '../m1/kd-balance-20261009');
      const status = json(join(out, `${run.id}.status.json`));
      if (status.state !== 'finished' || status.exitCode !== 0) continue;
      requireEqual(status.commit,p.commit,'worth exit source');
      const arms = (p.arms as Json[]).map(a => {
        const check = checks.find(c=>c.id===a.spec.id); if(!check) throw new Error('Missing worth hash');
        requireEqual(a.jobs,buildJobs(a.spec),'regenerated worth schedule');
        requireEqual(a.stamp,stampOf(a.spec),'regenerated worth stamp');
        requireEqual(a.stamp.src,p.src,'worth source ID');
        requireEqual(a.stamp.pool,p.pool,'worth pool stamp');
        const rows=checkedRaw(join(out,`${a.spec.id}.jsonl`),check.sha256);checkCampaignRows(rows,a.jobs,a.stamp);
        return {a,rows,stats:armStats(a.spec.id.split('.').pop(),rows as GameRecord[])};
      });
      requireEqual(arms.reduce((n,a)=>n+a.rows.length,0),run.expectedGames,'worth total');
      const pawn=arms.find(x=>x.a.spec.id.endsWith('.pawn'))!.stats;
      const scale={id:'pawn',value:-pawn.elo,low:-pawn.elo-pawn.err95,high:-pawn.elo+pawn.err95};
      for(const {a,rows,stats} of arms.filter(x=>!x.a.spec.id.endsWith('.pawn'))) {
        const element=a.spec.id.split('.').pop()!;
        const context:MeasurementContext={...baseContext,depth:a.spec.ai.depth,stampSource:'row',flags:a.stamp.rules,specKey:a.stamp.specKey,settings:{...a.spec,kind:'classic-odds',population:'fixed classic knight substitution',referencePrice:3.16},population:'run'};
        const worth=oddsWorth({id:element,value:stats.elo,low:stats.elo-stats.err95,high:stats.elo+stats.err95},scale,3.16);
        if(worth?.value !== null && worth?.interval) emit(context,element,'pawnWorth','piece-worth',worth.value,worth.interval[0],worth.interval[1],'pawns',worth.intervalKind!,rows.length,{calibration:{eloPerPawn:scale.value,relativeError:pawn.err95/scale.value},reference:'knight 3.16; classic ranks; no Guard; one pass'});
      }
    } else {
      const specPath=join(dir,`${run.id}.tournament.json`),specBytes=readFileSync(specPath);
      requireEqual(sha(specBytes),p.specSha256,'spec bytes');const spec=JSON.parse(specBytes.toString()) as TournamentSpec;
      requireEqual(p.spec,spec,'provenance spec');
      requireEqual(p.jobs,schedule(spec),'regenerated tournament schedule');
      requireEqual(p.contexts,Object.fromEntries(p.jobs.map((j:Json)=>[`${j.white}|${j.black}`,{...DEFAULT_RULES,...gameRules(spec,j.white,j.black)}])),'regenerated contexts');
      requireEqual(p.shardCounts,Array.from({length:run.shards},(_,i)=>p.jobs.filter((j:Json)=>j.pairId%run.shards===i).length),'shard counts');
      const rows:TRecord[]=[]; let ready=true;
      const prefix=run.id.includes('activity')?'activity':run.id.includes('powers')?'powers':'four';
      for(let i=0;i<run.shards;i++) {
        const folder=join(dir,'kaggle',`${prefix}-s${i}of${run.shards}`);
        if(!existsSync(join(folder,'validation.json'))) {ready=false;break;}
        const v=json(join(folder,'validation.json')),status=json(join(folder,'status.json'));
        if (!Number.isFinite(status.seconds) || status.seconds >= 9*60*60) throw new Error('Campaign notebook time limit exceeded or unknown');
        requireEqual(status.exit,0,'exit');requireEqual(status.sha,p.commit,'kernel source');requireEqual(status.shard,`${i}/${run.shards}`,'shard');
        requireEqual(readFileSync(join(folder,`${run.id}.tournament.json`)).toString(),specBytes.toString(),'downloaded spec');
        const part=checkedRaw(join(folder,`${run.id}.shard${i}of${run.shards}.jsonl`),v.sha256);
        checkCampaignRows(part,p.jobs.filter((j:Json)=>j.pairId%run.shards===i));rows.push(...part as TRecord[]);
      }
      if(!ready) continue;
      checkCampaignRows(rows,p.jobs);requireEqual(rows.length,run.expectedGames,'tournament total');
      if (rows.some(r=>r.plies>spec.maxPlies)) throw new Error('Campaign ply cap exceeded');
      const flags={...DEFAULT_RULES,...spec.rules};
      const context:MeasurementContext={...baseContext,depth:spec.depth,flags,specKey:p.specSha256,settings:{...spec,perGameRules:'gameSpec with saved seed', matchupRules:p.contexts,effectiveRulesHash:sha(stable([...rows].sort((a,b)=>a.gameId-b.gameId).map(r=>gameSpec(spec,r).rules)))},population:'field'};
      if(prefix==='activity') {
        const tally=newTally();for(const r of rows)addGame(tally,fromTournament(r,spec,specPath));
        if(tally.failed.length || tally.powers || tally.rows.length!==rows.length) throw new Error('Activity replay failed');
        const sum=total(tally.rows),types=reported(sum),noCapture=new Set([G]),stats=summarise(sum,types,noCapture),ci=bootstrap(tally.rows,types,noCapture,1000);
        for(const [t,s] of stats) {
          emit(context,LETTERS[t],'activity','paralysis-never-moved',1-s.instUsed,null,null,'fraction','descriptive; no interval',rows.length);
          for(const [key,criterion] of [['movesX','piece-moves'],['capsX','piece-captures'],['instUsed','piece-use'],['ownBest','piece-phase'],['fieldBest','piece-phase-4b']] as const) {
            if(t===G && key==='capsX')continue;const interval=ci.get(t)?.[key];emit({...context,population:'run'},LETTERS[t],'activity',criterion,s[key],interval?.[0]??null,interval?.[1]??null,key==='instUsed'?'fraction':'ratio','95% bootstrap over independent armies',rows.length);
          }
          for(const [key,measure,unit] of [['dDraws','drawRate','fraction difference'],['dWhite','whiteScore','fraction difference'],['dLength','relativeLengthChange','fraction']] as const) {const v=ci.get(t)?.[key];emit(context,LETTERS[t],measure,'piece-game',s[key],v?.[0]??null,v?.[1]??null,unit,'95% bootstrap over independent armies',rows.length,{comparison:{baseRun:run.id+':without:'+LETTERS[t],variantRun:run.id+':with:'+LETTERS[t],kind:'with-without'},method:'within one pool; with/without groups, not causal or matched pairs'});}
        }
      } else if(prefix==='powers') {
        const a=resampleArmies(rows,spec.entrants,true),band=simultaneous(a,spec.entrants);
        for(const e of spec.entrants){const v=a.m.get(e)!,err=band.band.get(e)!;emit(context,e,'score','power-field',v,v-err,v+err,'fraction','95% simultaneous armies interval',a.draws,{sampleUnit:'pairs'});}
        const sp=['HolyLight','Mercy'] as const,sh=['DeathTouch','Darkness'] as const;const mean=(xs:number[])=>xs.reduce((a,b)=>a+b,0)/xs.length;
        const v=mean(sp.map(e=>a.m.get(e)!))-mean(sh.map(e=>a.m.get(e)!));const draws=a.samples.get(sp[0])!.map((_,i)=>mean(sp.map(e=>a.samples.get(e)![i]))-mean(sh.map(e=>a.samples.get(e)![i])));const err=halfWidth(a,draws);
        emit(context,'Spirit minus Shadow','score','light-dark',v,v-err,v+err,'fraction difference','95% armies interval',a.draws,{sampleUnit:'pairs'});
      } else {
        const groups=new Map<string,Map<string,TRecord>>();for(const r of rows){if(!groups.has(r.white))groups.set(r.white,new Map());groups.get(r.white)!.set(drawOf(r),r);}
        const base=groups.get('none')!,cards=groups.get('cards4')!;requireEqual([...base.keys()].sort(),[...cards.keys()].sort(),'paired openings');
        for(const [measure,get] of [['whiteScore',(r:TRecord)=>r.result],['drawRate',(r:TRecord)=>r.result===.5?1:0],['meanPlies',(r:TRecord)=>r.plies]] as const){const xs=[...cards].map(([k,r])=>get(r)-get(base.get(k)!)),v=xs.reduce((a,b)=>a+b,0)/xs.length,err=1.96*Math.sqrt(xs.reduce((a,b)=>a+(b-v)**2,0)/(xs.length-1)/xs.length);emit(context,'cards4',measure,measure==='drawRate'?'draws-first':'white-parity',v,v-err,v+err,measure==='meanPlies'?'plies':'fraction difference','95% paired openings interval',xs.length,{sampleUnit:'openings',comparison:{baseRun:run.id+':none',variantRun:run.id+':cards4',kind:'paired'}});}
      }
    }
    dataset.runs=dataset.runs.filter(r=>r.run!==run.id);
    dataset.runs.push({run:run.id,status:'valid',lifecycle:'complete',observedGames:run.expectedGames,selectedGames:run.expectedGames,expectedGames:run.expectedGames,sources:[provenancePath],queue:[],reasons:['Complete checked campaign; decision scopes remain separate.']});
  }
  dataset.measurements=dataset.measurements.filter(m=>!m.id.startsWith('campaign:'));dataset.measurements.push(...all);
}
