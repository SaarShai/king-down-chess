import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { exampleStudies } from '../../src/study/examples';
import { ALL_POWERS } from '../../src/sim/tournament-plan';
import { createStudy, positionData } from '../../src/study/model';
import { DEFAULT_RULES } from '../../src/rules/rules';
import { startPosition } from '../../src/rules/setup';
import { previewStudyMeasurements, prepareStudyMeasurements, savedPlanOf, measurementContext } from '../../src/study/measurement-preview';
import { canonicalMeasurementJSON, type MeasurementRequest } from '../../src/study/measurement-plan';
import { setEvalParams } from '../../src/ai/eval';
import { playGame } from '../../src/sim/game';
import { stampOf } from '../../src/sim/run';
import { sha256, verifyBundle, assignParts, type FrozenRunBundle } from './bundle';
import { validateAndReport } from './report';
import { executePart, type ExecutedGame } from './execution';
const dirs: string[] = [];
const temp = () => { const d = mkdtempSync(join(tmpdir(), 'study-run-')); dirs.push(d); return d; };
afterEach(() => dirs.splice(0).forEach(d => rmSync(d, { recursive: true, force: true })));
const base = { start: 'population', seed: 19, pairs: 1, depth: 1, pool: 'NBRQALGMS', maxPlies: 2, openingRandomPlies: 2 } as const;
async function fixture(recipe: MeasurementRequest['recipe'] = 'activity', custom = false) {
  setEvalParams();
  const input = createStudy({ id:'fixture-study',version:1,parentVersion:null,title:'Fixture study',question:'Measure pieces',engine:'fixture-engine',rules:structuredClone(DEFAULT_RULES),start:positionData(startPosition()),prefix:[],actions:[],origin:'constructed' });
  if (custom) { const sample=exampleStudies('fixture-engine')[0].study; input.rules.design=sample.rules.design; input.design=sample.design; }
  const request = { ...base, recipe, ...(custom ? {pool:'NBRQALGMT'} : {}), ...(recipe === 'worth' ? { pieces: custom ? 'T' : 'A' } : {}), ...(['field','cross-play'].includes(recipe) ? { entrants: ['Strike','Freeze','none'] } : {}), ...(recipe === 'four-cell' ? { openingRandomPlies:4, factors: [{ kind:'piece',piece:'A',replacement:'N' }, { kind:'piece',piece:'G',replacement:'B' }], cardPool: ['Strike'] } : {}) } as MeasurementRequest;
  const preview = await previewStudyMeasurements(input, request, 'fixture-source');
  const prepared = prepareStudyMeasurements(input, request, 'fixture-source');
  const value = { schema: 'kingdown-frozen-run/1' as const, id: 'fixture-run', source: 'fixture-source', commit: 'fixture-commit', nodeVersion: process.version,
    study: { id: input.id, title: input.title, version: input.version, engine: input.engine },
    planFingerprint: preview.fingerprint, games: prepared.jobs.length, blocks: preview.preview.blocks, target: 'm1' as const,
    parts: [{ id: 'part-m1', machine: 'm1' as const, workers: 2, jobIndexes: prepared.jobs.map((_,i) => i), blocks: preview.preview.blocks }],
    originalDocument: { schema: 'kingdown-research/1' as const, document: input, plan: savedPlanOf(preview), evidence: [] }, prepared, sourceManifest: [], sourceArchiveSha256: sha256('fixture') };
  const bundle = { ...value, hash: sha256(canonicalMeasurementJSON(value)) } as FrozenRunBundle;
  return bundle;
}
function records(bundle: FrozenRunBundle): ExecutedGame[] {
  const result = bundle.prepared.jobs.map((g,index) => ({ index, bundleHash: bundle.hash, partId: 'part-m1', record: { ...playGame(g.spec,g.job), ...stampOf(g.spec,bundle.source) } }));
  setEvalParams(); return result;
}
function part(bundle: FrozenRunBundle, rows: ExecutedGame[]) {
  const dir = temp(), raw = rows.map(r=>JSON.stringify(r)+'\n').join(''); writeFileSync(join(dir,'games.jsonl'),raw);
  writeFileSync(join(dir,'attestation.json'), JSON.stringify({ bundleHash: bundle.hash, partId:'part-m1', sourceManifestHash:sha256(canonicalMeasurementJSON(bundle.sourceManifest)), nodeVersion:process.version, gamesSha256:sha256(raw) }));
  return dir;
}
describe('frozen study execution and report', () => {
  it.each(['worth','activity','field','cross-play','four-cell'] as const)('keeps exact %s jobs and produces strict measurements', async recipe => {
    const bundle = await fixture(recipe); verifyBundle(bundle);
    expect(bundle.prepared.report[recipe === 'four-cell' ? 'combo' : recipe === 'worth' ? 'worth' : 'tournament'] ?? recipe).toBeTruthy();
    expect(sha256(canonicalMeasurementJSON(measurementContext(bundle.prepared, bundle.originalDocument.plan!.contexts.map(c=>({rules:c.rules,pool:c.pool,rulesKey:'',specKey:c.specKey,specKeyVersion:2,src:c.sourceHash})))))).toHaveLength(64);
    const result = await validateAndReport(bundle,[part(bundle,records(bundle))],temp());
    expect(result, result.message).toMatchObject({state:'passed',games:bundle.games,illegalControls:1,legalReplays:Math.min(20,bundle.games)});
    const bytes = readFileSync(result.result!.path); expect(result.result!.sha256).toBe(sha256(bytes));
    expect(JSON.parse(bytes.toString()).measurements.length).toBeGreaterThan(0);
  });
  it('keeps partial work incomplete and refuses changed source, jobs, stamps and raw bytes', async () => {
    const bundle=await fixture(), rows=records(bundle);
    const partial=await validateAndReport(bundle,[part(bundle,rows.slice(0,1))],temp());
    expect(partial.state).toBe('incomplete');
    expect(JSON.parse(readFileSync(partial.result!.path,'utf8')).measurements[0]).toMatchObject({validity:'incomplete',value:null});
    for (const mutate of [(r:ExecutedGame[])=>r.push(r[0]),(r:ExecutedGame[])=>{r[0].record.seed++;},(r:ExecutedGame[])=>{r[0].record.src='other';},(r:ExecutedGame[])=>{r[0].record.moves[0].lan='Qa1-a8';}]) {
      const changed=structuredClone(rows); mutate(changed);
      expect((await validateAndReport(bundle,[part(bundle,changed)],temp())).state).toBe('failed');
    }
    const dir=part(bundle,rows); writeFileSync(join(dir,'games.jsonl'),'{}');
    expect((await validateAndReport(bundle,[dir],temp())).state).toBe('failed');
    const changed=structuredClone(bundle); changed.prepared.jobs[0].job.seed++;
    expect(()=>verifyBundle(changed)).toThrow('hash');
  });
  it.each(['worth','activity'] as const)('retains custom T in %s records and reports', async recipe => {
    const bundle=await fixture(recipe,true), result=await validateAndReport(bundle,[part(bundle,records(bundle))],temp());
    expect(result.state,result.message).toBe('passed');
    expect(JSON.parse(readFileSync(result.result!.path,'utf8')).measurements.some((m:{element:string})=>m.element==='T')).toBe(true);
  });
  it('accepts every named power and none without a historical matchup assumption', async () => {
    const bundle=await fixture('field');
    const request={...bundle.prepared.plan.request,entrants:[...ALL_POWERS,'none']};
    const planned=prepareStudyMeasurements(bundle.originalDocument.document,request,bundle.source);
    expect(planned.jobs.length).toBe(request.entrants.length*(request.entrants.length-1)*request.pairs);
    expect(planned.report.tournament!.entrants).toEqual(request.entrants);
  });
  it.each(['worth','four-cell','field'] as const)('assigns whole %s blocks once across both machines', async recipe => {
    const bundle=await fixture(recipe), prepared=prepareStudyMeasurements(bundle.originalDocument.document,{...bundle.prepared.plan.request,pairs:2},bundle.source);
    const split=assignParts(prepared,'both');
    expect(split.parts.map(p=>p.machine)).toEqual(['m1','kaggle']);
    expect(split.parts.flatMap(p=>p.jobIndexes).sort((a,b)=>a-b)).toEqual(prepared.jobs.map((_,i)=>i));
    expect(split.parts.every(p=>p.blocks>0)).toBe(true);
  });
  it('executes only assigned frozen jobs and keeps an attested complete prefix', async () => {
    const bundle = await fixture(), out=temp();
    await executePart(bundle,'part-m1',out,temp());
    expect(JSON.parse(readFileSync(join(out,'status.json'),'utf8'))).toMatchObject({state:'complete',completedGames:bundle.games});
    const result=await validateAndReport(bundle,[out],temp()); expect(result.state,result.message).toBe('passed');
    await expect(executePart(bundle,'part-m1',out,temp())).rejects.toThrow('already exists');
    await expect(executePart(bundle,'unknown',temp(),temp())).rejects.toThrow('Unknown part');
  }, 30000);
  it('checks every frozen source file before execution', async () => {
    const bundle=await fixture(), root=temp(); mkdirSync(join(root,'src'));
    writeFileSync(join(root,'src','fixture.ts'),'frozen'); bundle.sourceManifest=[{path:'src/fixture.ts',bytes:6,sha256:sha256('frozen')}];
    const {hash:_,...value}=bundle; bundle.hash=sha256(canonicalMeasurementJSON(value));
    verifyBundle(bundle,root); writeFileSync(join(root,'src','fixture.ts'),'mutated');
    expect(()=>verifyBundle(bundle,root)).toThrow('Source mismatch');
  });
});
