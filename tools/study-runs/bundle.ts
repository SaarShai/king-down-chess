import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, lstatSync, readdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { parseResearch, researchStatus, type ResearchDocument } from '../../src/study/evidence';
import { verifyMeasurementPlan } from '../../src/study/measurement-service';
import { stampOf } from '../../src/sim/run';
import { prepareStudyMeasurements, measurementContext } from '../../src/study/measurement-preview';
import { canonicalMeasurementJSON } from '../../src/study/measurement-plan';
import { studySource } from '../lib/study-source';
import type { RunTarget, RunMachine } from '../../src/study/run-types';
export const sha256 = (x: string | Buffer) => createHash('sha256').update(x).digest('hex');
export interface FrozenRunBundle {
  schema: 'kingdown-frozen-run/1'; id: string; hash: string; source: string; commit: string; nodeVersion: string;
  study: { id: string; title: string; version: number; engine: string };
  planFingerprint: string; games: number; blocks: number; target: RunTarget;
  parts: { id: string; machine: RunMachine; workers: number; jobIndexes: number[]; blocks: number }[];
  originalDocument: ResearchDocument; prepared: ReturnType<typeof prepareStudyMeasurements>;
  sourceManifest: { path: string; sha256: string; bytes: number }[]; sourceArchiveSha256: string;
}
function sourceIdentity(root: string): string {
  const files = ['src/rules', 'src/ai', 'src/sim', 'src/workshop'].flatMap(dir => execFileSync('git', ['ls-files', '-z', dir], { cwd: root }).toString().split('\0').filter(p => p.endsWith('.ts')).sort());
  const h = createHash('sha1');
  for (const path of files) h.update(path.slice(1)).update('\0').update(readFileSync(join(root, path))).update('\0');
  return h.digest('hex').slice(0, 12);
}
function blockKey(prepared: ReturnType<typeof prepareStudyMeasurements>, index: number): string {
  const { spec, job } = prepared.jobs[index], request = prepared.plan.request;
  if (request.recipe === 'four-cell') return `${job.configId}|${(job as { block?: number }).block}`;
  // Keep each comparison pair and its three calibration pairs on one machine.
  if (request.recipe === 'worth') return `worth|${job.pairId % request.pairs}`;
  return `${spec.id}|${job.pairId}`;
}
export function assignParts(prepared: ReturnType<typeof prepareStudyMeasurements>, target: RunTarget) {
  const groups = new Map<string, number[]>();
  prepared.jobs.forEach((_game, index) => {
    const key = blockKey(prepared, index);
    groups.set(key, [...groups.get(key) ?? [], index]);
  });
  if (target === 'both' && groups.size < 2) throw new Error('Both machines need at least two complete blocks');
  const machines: RunMachine[] = target === 'both' ? ['m1', 'kaggle'] : [target];
  const parts = machines.map(machine => ({ id: `part-${machine}`, machine, workers: machine === 'm1' ? 8 : 4, jobIndexes: [] as number[], blocks: 0 }));
  [...groups.values()].forEach((indexes, i) => { const part = parts[i % parts.length]; part.jobIndexes.push(...indexes); part.blocks++; });
  return {parts,blocks:groups.size};
}
export async function freezeRun(document: unknown, target: RunTarget, runId: string, sourceRoot: string, outputDirectory: string): Promise<FrozenRunBundle> {
  if (!/^[a-z0-9-]{1,100}$/.test(runId) || !['m1', 'kaggle', 'both'].includes(target)) throw new Error('Invalid run identity or target');
  const root = resolve(sourceRoot), originalDocument = parseResearch(document);
  if (!originalDocument.plan || researchStatus(originalDocument).plan !== 'current') throw new Error('Save a current measurement plan first');
  if (execFileSync('git', ['status', '--porcelain', '--untracked-files=normal'], { cwd: root }).length) throw new Error('A clean source commit is required');
  const commit = execFileSync('git', ['rev-parse','HEAD'], {cwd:root}).toString().trim();
  const origin = originalDocument.document.schema === 'kingdown-test/1' ? originalDocument.document.study : originalDocument.document;
  if (origin.engine !== studySource(root)) throw new Error('Study engine source changed');
  const source = sourceIdentity(root);
  await verifyMeasurementPlan(originalDocument.plan, source);
  const prepared = prepareStudyMeasurements(originalDocument.plan.definition.input, originalDocument.plan.definition.request, source);
  const { parts, blocks } = assignParts(prepared,target);
  const paths = execFileSync('git', ['ls-files', '-z', 'src', 'tools', 'package.json', 'package-lock.json', 'tsconfig.json'], { cwd: root }).toString().split('\0').filter(Boolean).sort();
  let total = 0;
  const sourceManifest = paths.map(path => {
    if (path.includes('..') || path.startsWith('/') || /(?:^|\/)(?:\.secrets|node_modules)(?:\/|$)/.test(path) || lstatSync(join(root, path)).isSymbolicLink()) throw new Error('Unsafe source file');
    const bytes = readFileSync(join(root, path)); total += bytes.length;
    if (total > 128 * 1024 * 1024) throw new Error('Source exceeds 128 MiB');
    return { path, sha256: sha256(bytes), bytes: bytes.length };
  });
  if (existsSync(join(outputDirectory, 'bundle.json')) || existsSync(join(outputDirectory, 'source.tar.gz'))) throw new Error('Bundle output already exists');
  mkdirSync(outputDirectory, { recursive: true });
  execFileSync('git', ['archive', '--format=tar.gz', `--output=${resolve(outputDirectory, 'source.tar.gz')}`, commit, '--', ...paths], { cwd: root });
  if (execFileSync('git', ['status','--porcelain','--untracked-files=normal'], {cwd:root}).length) throw new Error('Source changed while freezing');
  if (execFileSync('git', ['rev-parse','HEAD'], {cwd:root}).toString().trim() !== commit) throw new Error('Source commit changed while freezing');
  const study = originalDocument.document.schema === 'kingdown-test/1' ? originalDocument.document.study : originalDocument.document;
  const value = { schema: 'kingdown-frozen-run/1' as const, id: runId, source, commit, nodeVersion: process.version,
    study: { id: study.id, title: study.title, version: study.version, engine: study.engine }, planFingerprint: originalDocument.plan.fingerprint,
    games: prepared.jobs.length, blocks, target, parts, originalDocument, prepared, sourceManifest,
    sourceArchiveSha256: sha256(readFileSync(join(outputDirectory, 'source.tar.gz'))) };
  const bundle = { ...value, hash: sha256(canonicalMeasurementJSON(value)) };
  writeFileSync(join(outputDirectory, 'bundle.json'), JSON.stringify(bundle));
  return bundle;
}
export function verifyBundle(bundle: FrozenRunBundle, sourceRoot?: string): void {
  const allowed = ['schema','id','hash','source','commit','nodeVersion','study','planFingerprint','games','blocks','target','parts','originalDocument','prepared','sourceManifest','sourceArchiveSha256'];
  if (!bundle || typeof bundle !== 'object' || Object.keys(bundle).some(k => !allowed.includes(k))) throw new Error('Unknown bundle field');
  const { hash, ...value } = bundle;
  if (bundle.schema !== 'kingdown-frozen-run/1' || sha256(canonicalMeasurementJSON(value)) !== hash) throw new Error('Bundle hash mismatch');
  if (sourceRoot) {
    const manifest = new Set(bundle.sourceManifest.map(f => f.path));
    function walk(path: string): void {
      for (const e of readdirSync(join(sourceRoot!,path), {withFileTypes:true})) {
        const next = `${path}/${e.name}`;
        if (e.isSymbolicLink()) throw new Error('Unsafe source symlink');
        if (e.isDirectory()) walk(next);
        else if (!manifest.has(next)) throw new Error(`Unexpected source file: ${next}`);
      }
    }
    for (const path of ['src','tools']) if (existsSync(join(sourceRoot,path))) walk(path);
    for (const file of bundle.sourceManifest) {
    if (!/^(src|tools)\//.test(file.path) && !['package.json', 'package-lock.json', 'tsconfig.json'].includes(file.path)) throw new Error('Unsafe manifest path');
    if (file.path.split('/').includes('..') || lstatSync(join(sourceRoot, file.path)).isSymbolicLink()) throw new Error('Unsafe manifest file');
    const bytes = readFileSync(join(sourceRoot, file.path));
    if (bytes.length !== file.bytes || sha256(bytes) !== file.sha256) throw new Error(`Source mismatch: ${file.path}`);
    }
  }
  const machines = bundle.target === 'both' ? ['m1','kaggle'] : [bundle.target];
  if (bundle.parts.length !== machines.length || bundle.parts.some((p,i) => p.machine !== machines[i] || p.id !== `part-${p.machine}` || !Number.isInteger(p.workers) || p.workers < 1 || p.workers > (p.machine === 'm1' ? 8 : 4))) throw new Error('Invalid machine assignment');
  const ownership = new Map<string,string>();
  for (const part of bundle.parts) for (const i of part.jobIndexes) {
    const g = bundle.prepared.jobs[i]; if (!g) throw new Error('Unknown job index');
    const key = blockKey(bundle.prepared, i);
    if (ownership.has(key) && ownership.get(key) !== part.id) throw new Error('Split block'); ownership.set(key,part.id);
  }
  for (const part of bundle.parts) if ([...ownership.values()].filter(id => id === part.id).length !== part.blocks) throw new Error('Part block count mismatch');
  if (ownership.size !== bundle.blocks) throw new Error('Block count mismatch');
  const indexes = bundle.parts.flatMap(p => p.jobIndexes).sort((a,b) => a-b);
  if (indexes.length !== bundle.games || indexes.some((n,i) => n !== i) || bundle.prepared.jobs.length !== bundle.games) throw new Error('Invalid job assignment');
  parseResearch(bundle.originalDocument);
  if (bundle.originalDocument.plan?.fingerprint !== bundle.planFingerprint || bundle.originalDocument.plan.source !== bundle.source) throw new Error('Plan identity mismatch');
  const expected = prepareStudyMeasurements(bundle.originalDocument.plan!.definition.input, bundle.originalDocument.plan!.definition.request, bundle.source);
  expected.evaluation = bundle.prepared.evaluation;
  const fingerprint = sha256(canonicalMeasurementJSON(measurementContext(expected, expected.specs.map(spec => stampOf(spec, bundle.source)))));
  if (fingerprint !== bundle.planFingerprint) throw new Error('Frozen plan fingerprint mismatch');
  if (canonicalMeasurementJSON(expected) !== canonicalMeasurementJSON(bundle.prepared)) throw new Error('Frozen schedule mismatch');
}
export function loadBundle(path: string): FrozenRunBundle {
  const bytes = readFileSync(path); if (bytes.length > 64 * 1024 * 1024) throw new Error('Bundle exceeds 64 MiB');
  const bundle = JSON.parse(bytes.toString()) as FrozenRunBundle; verifyBundle(bundle);
  const archive = join(resolve(path, '..'), 'source.tar.gz');
  if (sha256(readFileSync(archive)) !== bundle.sourceArchiveSha256) throw new Error('Source archive mismatch');
  return bundle;
}
