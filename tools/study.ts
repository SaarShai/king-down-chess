import { openSync, closeSync, fstatSync, readSync, writeFileSync, mkdirSync, fsyncSync, linkSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { createHash, randomUUID } from 'node:crypto';
import { parseStudy } from '../src/study/model';
import { openStudy } from '../src/study/session';
import { checkStudy } from '../src/study/check';
import { baseDocument, parseDocument, studyOf, testOf } from '../src/study/browser-service';
import { MAX_STUDY_BYTES, parseEvidence, parseResearch, researchStatus } from '../src/study/evidence';
import { previewStudyMeasurements } from './lib/study-measurements';
import { canonicalMeasurementJSON, type MeasurementRequest } from '../src/study/measurement-plan';
import { exampleStudies } from '../src/study/examples';
import { studySource } from './lib/study-source';

export { MAX_STUDY_BYTES };
function readBounded(path: string, limit = MAX_STUDY_BYTES): Buffer {
  const fd = openSync(path, 'r');
  try {
    const info = fstatSync(fd);
    if (!info.isFile()) throw new Error('Input must be a regular file.');
    const tooLarge = `Input file exceeds ${limit / MAX_STUDY_BYTES} MiB.`;
    if (info.size > limit) throw new Error(tooLarge);
    // Bound the read too: the file can grow after the size check.
    const buffer = Buffer.alloc(limit + 1);
    let used = 0;
    // readFileSync cannot bound a file that grows during the read.
    while (used < buffer.length) {
      const count = readSync(fd, buffer, used, buffer.length - used, null);
      if (!count) break;
      used += count;
    }
    if (used > limit) throw new Error(tooLarge);
    return buffer.subarray(0, used);
  } finally { closeSync(fd); }
}
export function readStudyFile(path: string): unknown { return JSON.parse(readBounded(path).toString('utf8')); }
export function saveStudyFile(path: string, value: unknown, limit = MAX_STUDY_BYTES): void {
  const encoded = `${JSON.stringify(value, null, 2)}\n`;
  if (Buffer.byteLength(encoded) > limit) throw new Error('Output exceeds the file size limit. Select fewer measurements or pairs.');
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    const fd = openSync(temporary, 'wx');
    try { writeFileSync(fd, encoded); fsyncSync(fd); } finally { closeSync(fd); }
    linkSync(temporary, path); // Publish only complete bytes, without replacing an existing file.
  } finally { rmSync(temporary, { force: true }); }
}
function savedPlanOf(p: ReturnType<typeof previewStudyMeasurements>) {
  return { definition: p.plan, fingerprint: p.fingerprint, source: p.source, games: p.preview.games, blocks: p.preview.blocks,
    measures: p.preview.measures, limits: p.preview.limits,
    contexts: p.execution.contexts.map(c => ({ sourceHash: c.src, specKey: c.specKey, specKeyVersion: c.specKeyVersion, rules: c.rules, pool: c.pool })) };
}
export function runStudy(args: string[]): number {
  try {
    const { positionals, values } = parseArgs({ args, allowPositionals: true, options: { out: { type: 'string' }, run: { type: 'string' }, element: { type: 'string' } } });
    const [command, file, lan] = positionals;
    const sizes: Record<string, number> = { examples: 1, inspect: 2, play: 3, undo: 2, check: 2, extract: 2, plan: 3, preview: 2, evidence: 3 };
    if (!(command in sizes) || positionals.length !== sizes[command]) throw new Error('Use examples, inspect, play, undo, check, extract, plan FILE REQUEST --out NEWFILE, preview FILE --out JOBS, or evidence FILE DATASET --run ID [--element ID] --out NEWFILE.');
    if (command === 'evidence' ? !values.run : values.run !== undefined || values.element !== undefined) throw new Error('Only evidence accepts --run and --element; --run is required.');
    const writes = ['examples', 'play', 'undo', 'extract', 'plan', 'preview', 'evidence'].includes(command);
    if (writes !== (values.out !== undefined)) throw new Error(writes ? 'Supply --out.' : 'This command does not accept --out.');
    const engine = studySource();
    if (command === 'examples') {
      mkdirSync(values.out!, { recursive: false });
      for (const test of exampleStudies(engine)) saveStudyFile(resolve(values.out!, `${test.study.id}.json`), test);
      console.log(JSON.stringify({ out: values.out, status: 'saved' }));
      return 0;
    }
    const input = parseDocument(readStudyFile(file)), study = studyOf(input);
    openStudy(study, engine);
    if (command === 'plan') {
      const p = previewStudyMeasurements(baseDocument(input), readStudyFile(lan) as MeasurementRequest);
      const record = parseResearch({ schema: 'kingdown-research/1', document: baseDocument(input), evidence: input.schema === 'kingdown-research/1' ? input.evidence : [],
        plan: savedPlanOf(p) });
      saveStudyFile(values.out!, record);
      console.log(JSON.stringify({ out: values.out, fingerprint: p.fingerprint, ...p.preview }, null, 2));
      return 0;
    }
    if (command === 'preview') {
      if (input.schema !== 'kingdown-research/1' || researchStatus(input).plan !== 'current') throw new Error('Create a current plan first.');
      const p = previewStudyMeasurements(baseDocument(input), input.plan!.definition.request);
      if (canonicalMeasurementJSON(savedPlanOf(p)) !== canonicalMeasurementJSON(input.plan)) throw new Error('Plan source, settings or metadata changed. Create a new plan.');
      saveStudyFile(values.out!, p, 32 * MAX_STUDY_BYTES);
      console.log(JSON.stringify({ out: values.out, games: p.jobs.length, launched: false }));
      return 0;
    }
    if (command === 'evidence') {
      const bytes = readBounded(lan, 64 * MAX_STUDY_BYTES), dataset = JSON.parse(bytes.toString('utf8'));
      if (dataset?.schemaVersion !== 1 || !Array.isArray(dataset.measurements)) throw new Error('Expected a balance measurements dataset.');
      const measurements = dataset.measurements.filter((m: { run?: unknown; element?: unknown } | null) => m?.run === values.run && (values.element === undefined || m.element === values.element));
      const evidence = parseEvidence({ schema: 'kingdown-evidence/1', source: { path: resolve(lan), sha256: createHash('sha256').update(bytes).digest('hex') },
        measurements, verification: 'measurement-export', approval: 'not-reviewed' });
      const record = parseResearch({ schema: 'kingdown-research/1', document: baseDocument(input), plan: input.schema === 'kingdown-research/1' ? input.plan : null,
        evidence: [...(input.schema === 'kingdown-research/1' ? input.evidence : []), evidence] });
      saveStudyFile(values.out!, record);
      console.log(JSON.stringify({ out: values.out, ...researchStatus(record) }, null, 2));
      return 0;
    }
    if (command === 'check') {
      if (!testOf(input)) throw new Error('Add checks before running a test.');
      const report = checkStudy(testOf(input), engine);
      console.log(JSON.stringify(report, null, 2));
      return report.status === 'passed' ? 0 : 1;
    }
    if (command === 'extract') {
      openStudy(study, engine);
      saveStudyFile(values.out!, study);
      console.log(JSON.stringify({ out: values.out, status: 'saved' }));
      return 0;
    }
    if (writes && testOf(input)) throw new Error('A test contains indexed checks. Edit a separate plain study file to keep those checks safe.');
    const session = openStudy(study, engine);
    if (command === 'inspect') console.log(JSON.stringify({ study, ...session.snapshot(), ...(input.schema === 'kingdown-research/1' ? { research: researchStatus(input), plan: input.plan, evidence: input.evidence } : {}) }, null, 2));
    else {
      if (command === 'play') session.play(lan);
      else if (!session.undo()) throw new Error('No recorded action to undo.');
      const saved = session.exportStudy();
      const document = parseStudy({ ...saved, version: study.version + 1, parentVersion: study.version });
      saveStudyFile(values.out!, input.schema === 'kingdown-research/1' ? parseResearch({ ...input, document }) : document);
      console.log(JSON.stringify({ out: values.out, status: 'saved' }));
    }
    return 0;
  } catch (error) {
    console.error(`Study error: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) process.exitCode = runStudy(process.argv.slice(2));
