import { readFileSync, writeFileSync, mkdirSync, existsSync, lstatSync } from 'node:fs';
import { join } from 'node:path';
import { canonicalMeasurementJSON } from '../../src/study/measurement-plan';
import { measurementSchema } from '../../src/study/evidence';
import { unknownContext, type Measurement } from '../../src/balance/measurements';
import { verifyBundle, sha256, type FrozenRunBundle } from './bundle';
import type { ExecutedGame } from './execution';
import { stampOf } from '../../src/sim/run';
import { startGame } from '../../src/sim/game';
import { replayRecord } from '../../src/sim/replay';
import { legalMoves, LETTERS, status, WHITE } from '../../src/rules/engine';
import { toLan, toFen } from '../../src/rules/setup';
import { setRules } from '../../src/rules/rules';
import { armStats } from '../../src/sim/experiments';
import { comboReport, digest, type ComboJob } from '../../src/sim/combinations';
import { scheduleJobs } from '../../src/sim/tournament-plan';
import { compress, resampleArmies, halfWidth } from '../../src/sim/tournament';
import { fromRun, countGame, total, summarise, bootstrap } from '../piece-activity';
export interface ValidationReport {
  state: 'passed' | 'failed' | 'incomplete'; games: number; legalReplays: number; illegalControls: number; message: string;
  result: { path: string; filename: string; bytes: number; sha256: string } | null;
}
function bounded(path: string, limit: number): Buffer {
  if (lstatSync(path).isSymbolicLink() || lstatSync(path).size > limit) throw new Error('Unsafe or oversized result');
  return readFileSync(path);
}
function replay(row: ExecutedGame): void {
  setRules(row.record.rules);
  const played = replayRecord(row.record, (pos, move) => {
    if (!legalMoves(pos).some(m => toLan(pos, m) === toLan(pos, move))) throw new Error('Illegal replay');
  });
  if (['checkmate','stalemate','draw50','drawMaterial'].includes(row.record.reason) && status(played.end) !== row.record.reason) throw new Error('Replay ending mismatch');
  if (row.record.reason === 'checkmate' && row.record.result !== (played.end.turn === WHITE ? 0 : 1)) throw new Error('Replay winner mismatch');
  if (canonicalMeasurementJSON(played.events) !== canonicalMeasurementJSON(row.record.events)) throw new Error('Replay event mismatch');
}
export async function validateAndReport(bundle: FrozenRunBundle, directories: string[], output: string): Promise<ValidationReport> {
  verifyBundle(bundle);
  mkdirSync(output, { recursive: true });
  const receipt: ValidationReport = { state: 'incomplete', games: 0, legalReplays: 0, illegalControls: 0, message: '', result: null };
  const rows: ExecutedGame[] = [], seen = new Set<number>(), partSeen = new Set<string>();
  try {
    for (const dir of directories) {
      if (!existsSync(join(dir, 'games.jsonl'))) continue;
      const raw = bounded(join(dir, 'games.jsonl'), 512 * 1024 * 1024);
      if (raw.length && raw[raw.length - 1] !== 10) throw new Error('Torn game record');
      const attestation = JSON.parse(bounded(join(dir, 'attestation.json'), 65536).toString());
      const part = bundle.parts.find(p => p.id === attestation.partId);
      if (!part || attestation.sourceVerified !== true || partSeen.has(part.id) || attestation.bundleHash !== bundle.hash || attestation.gamesSha256 !== sha256(raw) || attestation.nodeVersion !== bundle.nodeVersion || attestation.sourceManifestHash !== sha256(canonicalMeasurementJSON(bundle.sourceManifest))) throw new Error('Part attestation mismatch');
      partSeen.add(part.id);
      const partRows = new TextDecoder('utf-8', {fatal:true}).decode(raw).split('\n').filter(Boolean).map(line => JSON.parse(line) as ExecutedGame);
      for (const row of partRows) {
        if (!row || Object.keys(row).sort().join(',') !== 'bundleHash,index,partId,record') throw new Error('Unknown game envelope field');
        if (row.bundleHash !== bundle.hash || row.partId !== part.id || !part.jobIndexes.includes(row.index) || seen.has(row.index)) throw new Error('Extra or duplicate job');
        const { spec, job } = bundle.prepared.jobs[row.index], rec = row.record, stamp = stampOf(spec, bundle.source);
        for (const key of ['gameId', 'pairId', 'colourSwapped', 'configId', 'seed', 'backRankWhite', 'backRankBlack'] as const) if (rec[key] !== job[key]) throw new Error(`Job identity mismatch: ${key}`);
        for (const key of Object.keys(stamp) as (keyof typeof stamp)[]) if (canonicalMeasurementJSON(rec[key]) !== canonicalMeasurementJSON(stamp[key])) throw new Error('Execution stamp mismatch');
        setRules(stamp.rules);
        if (rec.startFen !== toFen(startGame(job.backRankWhite, job.backRankBlack, job.fen).pos) || rec.plies !== rec.moves.length || rec.plies > (spec.maxPlies ?? 300) || rec.openingPlies !== (spec.openingRandomPlies ?? 0) || ![0,.5,1].includes(rec.result) || !['checkmate','stalemate','draw50','drawRepetition','drawMaterial','adjudicatedResign','adjudicatedDraw','plyCap'].includes(rec.reason) || rec.reason === 'plyCap' && rec.plies !== (spec.maxPlies ?? 300)) throw new Error('Invalid game record');
        if (rec.reason !== 'checkmate' && rec.reason !== 'adjudicatedResign' && rec.result !== .5 || rec.reason === 'adjudicatedResign' && rec.result === .5) throw new Error('Ending result mismatch');
        seen.add(row.index); rows.push(row);
      }
      partRows.sort((a,b) => a.index-b.index);
      const n = Math.min(20, partRows.length);
      for (let i = 0; i < n; i++) { replay(partRows[Math.floor(i * partRows.length / n)]); receipt.legalReplays++; }
      if (partRows.length) {
        const bad = structuredClone(partRows[0]); bad.record.moves = [{ lan: 'Qa1-a8', legal: 0, ms: 0 }];
        let refused = false; try { replay(bad); } catch { refused = true; }
        if (!refused) throw new Error('Illegal replay control failed'); receipt.illegalControls++;
      }
    }
    receipt.games = rows.length;
    receipt.state = rows.length === bundle.games && partSeen.size === bundle.parts.length ? 'passed' : 'incomplete';
    receipt.message = receipt.state === 'passed' ? 'All frozen jobs and replay controls pass.' : `Incomplete: ${rows.length}/${bundle.games} games.`;
    const measurements = makeMeasurements(bundle, rows, receipt.state === 'passed');
    const bytes = Buffer.from(JSON.stringify({ schemaVersion: 1, measurements }, null, 2));
    if (bytes.length > 64 * 1024 * 1024) throw new Error('Measurement export exceeds 64 MiB');
    const path = join(output, 'measurements.json'); writeFileSync(path, bytes);
    receipt.result = { path, filename: 'measurements.json', bytes: bytes.length, sha256: sha256(bytes) };
  } catch (error) { receipt.state = 'failed'; receipt.games = rows.length; receipt.message = String(error); receipt.result = null; }
  writeFileSync(join(output, 'validation.json'), JSON.stringify({ ...receipt, runId: bundle.id, bundleHash: bundle.hash, planFingerprint: bundle.planFingerprint }));
  return receipt;
}
function makeMeasurements(bundle: FrozenRunBundle, rows: ExecutedGame[], complete: boolean): Measurement[] {
  const output: Measurement[] = [], recipe = bundle.prepared.plan.request.recipe;
  const add = (element: string, measure: Measurement['measure'], value: number | null, error: number | null, sample: number, sampleUnit: Measurement['sampleUnit'], unit: string, method: string, index = 0, extras: Partial<Measurement> = {}) => {
    const { spec } = bundle.prepared.jobs[index], stamp = stampOf(spec, bundle.source);
    const row = { id: `${bundle.id}:${output.length}`, run: bundle.id, element, version: bundle.commit,
      context: { ...unknownContext(), flags: stamp.rules, flagsKind: 'full', commit: bundle.commit, commitSource: 'spec', stampSource: 'row', sourceArchiveSha256: bundle.sourceArchiveSha256, sourceHash: stamp.src, specKey: stamp.specKey, specKeyVersion: 2, pool: stamp.pool, depth: spec.ai.depth, machine: bundle.target, settings: { recipe }, population: recipe === 'field' ? 'field' : 'run' },
      measure, value: complete && Number.isFinite(value) ? value : null, error: complete && Number.isFinite(error) ? error : null, errorKind: error === null ? null : method, sample, sampleUnit, unit,
      validity: complete ? Number.isFinite(value) ? 'valid' : 'unverified' : 'incomplete', reasons: [complete ? 'Frozen jobs and replay controls pass. No rule adoption.' : 'Some frozen jobs are missing.', `Ply caps: ${rows.filter(r => r.record.reason === 'plyCap').length}.`], sources: ['games.jsonl'], method, ...extras };
    output.push(measurementSchema.parse(row) as Measurement);
  };
  if (!complete) { add('run', 'score', null, null, rows.length, 'games', 'fraction', 'Incomplete frozen schedule'); return output; }
  if (recipe === 'four-cell') {
    const spec = bundle.prepared.report.combo!;
    const result = comboReport(spec, rows.map(r => ({ job: bundle.prepared.jobs[r.index].job as ComboJob, record: r.record, source: spec.source, specHash: digest(spec) })));
    for (const item of result.results) { const v = item.interaction; add(`${item.candidate}:${item.strategy}:${item.metric}`, item.metric === 'plies' ? 'meanPlies' : item.metric === 'draw' ? 'drawRate' : 'score', v.mean, v.low === null ? null : Math.max(v.mean-v.low,v.high!-v.mean), v.n, 'arrangements', item.metric === 'plies' ? 'plies' : 'fraction difference', result.scope, 0, v.low === null ? {} : { interval: { low: v.low, high: v.high!, kind: '95% block interaction interval' } }); }
    for (const item of result.strategyEffects) { const v=item.difference; add(`${item.candidate}:strategy:${item.metric}`, item.metric==='plies' ? 'meanPlies' : item.metric==='draw' ? 'drawRate' : 'score',v.mean,v.low===null?null:Math.max(v.mean-v.low,v.high!-v.mean),v.n,'arrangements',item.metric==='plies'?'plies':'fraction difference',item.comparison,0,v.low===null?{}:{interval:{low:v.low,high:v.high!,kind:'95% block strategy interval'}}); }
  } else if (recipe === 'worth') {
    const specs = bundle.prepared.report.worth!, arms = specs.map(spec => armStats(spec.id.split('.').pop()!, rows.filter(r => bundle.prepared.jobs[r.index].spec.id === spec.id).map(r => r.record)));
    const cal = arms[arms.length-1], scale = -cal.elo, usable = scale > cal.err95 && scale > 20;
    for (const [i, arm] of arms.slice(0,-1).entries()) {
      const vs = bundle.prepared.plan.request.vs ?? 'N';
      const baseline = (bundle.prepared.plan.request.values[vs] ?? { N:316,B:322,R:449,Q:933 }[vs]) / 100;
      const delta = arm.elo / scale, width = arm.err95 / scale + Math.abs(delta) * cal.err95 / scale;
      add(arm.key, 'pawnWorth', usable ? baseline + delta : null, usable ? width : null, arm.pairs, 'pairs', 'pawns', 'Paired swap estimate; calibration source-error envelope', rows.find(r => bundle.prepared.jobs[r.index].spec.id === specs[i].id)!.index,
        usable ? { calibration: { eloPerPawn: scale, relativeError: cal.err95/scale }, ...(Math.abs(delta)>1.5 ? { bound: delta>0 ? 'greaterThan' : 'lessThan', value: baseline + Math.sign(delta)*1.5, error: null } : { interval: { low: baseline+delta-width, high: baseline+delta+width, kind: 'paired calibration source-error envelope' } }) } : { validity: 'unverified', reasons: ['Pawn calibration is too uncertain.'] });
    }
  } else if (recipe === 'activity') {
    const counts = rows.map(r => countGame(fromRun(r.record, 'games.jsonl')).row), sum = total(counts);
    const types = [...new Set((bundle.prepared.plan.request.pieces ?? bundle.prepared.plan.request.pool).split('').map(p => LETTERS.indexOf(p)).filter(t=>t>0))];
    const noCapture = new Set<number>(bundle.prepared.jobs[0].spec.rules?.guardCaptures === 'none' ? [LETTERS.indexOf('G')] : []);
    const intervals = bootstrap(counts,types,noCapture,500);
    for (const [type, stats] of summarise(sum, types, noCapture)) for (const key of ['movesPer','capsPer','movesX','capsX','instUsed','gameUsed','whole','ownBest','fieldBest','dDraws','dWhite','dLength'] as const) {
      const ci=intervals.get(type)?.[key];
      add(LETTERS[type], 'activity', stats[key], ci ? Math.max(stats[key]-ci[0],ci[1]-stats[key]) : null, rows.length, 'games', key, '95% game percentile interval; legal replay; random opening excluded; no independent army claim',0,ci ? {interval:{low:ci[0],high:ci[1],kind:'95% game percentile interval'}} : {});
    }
  } else {
    const spec = bundle.prepared.report.tournament!, jobs = scheduleJobs(spec), records = rows.map(r => compress(jobs[r.index], r.record));
    const resampled = resampleArmies(records, spec.entrants, false, 1000);
    for (const entrant of spec.entrants) {
      const estimate = { m: resampled.m.get(entrant) ?? NaN }, samples = resampled.samples.get(entrant);
      add(entrant, 'score', estimate.m, samples ? halfWidth(resampled, samples) : null, resampled.draws, 'arrangements', 'fraction', '95% army resample; named entrants and matchups retained', rows.find(r => jobs[r.index].white === entrant)!.index, { context: { ...unknownContext(), flags: spec.rules, flagsKind: 'full', commit: bundle.commit, commitSource: 'spec', stampSource: 'row', sourceArchiveSha256: bundle.sourceArchiveSha256, sourceHash: bundle.source, specKey: null, specKeyVersion: 2, pool: spec.pool ?? null, depth: spec.depth, machine: bundle.target, settings: JSON.parse(JSON.stringify({ tournament: spec })), variantScope: 'mixed', population: 'field' } });
    }
  }
  return output;
}
