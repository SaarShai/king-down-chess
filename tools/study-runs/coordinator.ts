import { exportReplays } from './replays';
import { mkdirSync, existsSync, readFileSync, openSync, closeSync, readSync, fstatSync, constants } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { parseResearch, researchStatus, type ResearchDocument } from '../../src/study/evidence';
import { studyOf } from '../../src/study/browser-service';
import type { RunTarget, StudyRunSummary } from '../../src/study/run-types';
import type { DispatchInput, RemoteReceipt, RunTransport, BackupProof } from './transport-types';
import { atomicText, atomicJSON, createRunStore, readJSON, validRunId } from './store';

export interface CoordinatorBundle {
  id: string; hash: string; source: string; commit: string; nodeVersion: string;
  games: number; blocks: number; target: RunTarget;
  parts: { id: string; machine: 'm1' | 'kaggle'; workers: number; jobIndexes: number[]; blocks: number }[];
}
export interface RunValidation {
  state: 'passed' | 'failed' | 'incomplete'; games: number; legalReplays: number; illegalControls: number; message: string;
  result: { path: string; bytes: number; sha256: string; filename: string } | null;
}
interface RunRecord {
  summary: StudyRunSummary; document: ResearchDocument; bundle: CoordinatorBundle;
  key: string | null; queueWritten: boolean; receipts: Record<string, RemoteReceipt>;
  collected: string[]; lateChecks: Record<string, number>; resultPath: string | null;
  backupAttempted: boolean; collectionAttempts: Record<string, { count: number; next: number }>; validationAttempted: boolean;
}
export interface CoordinatorOptions {
  stateRoot: string; resultsRoot: string; mainRoot: string;
  assertStorage: () => void;
  freeze: (document: ResearchDocument, target: RunTarget, id: string, directory: string) => Promise<CoordinatorBundle>;
  verify: (bundle: CoordinatorBundle, directory: string) => Promise<void>;
  transports: Record<'m1' | 'kaggle', RunTransport>;
  validate: (bundle: CoordinatorBundle, directories: Record<string, string>, directory: string) => Promise<RunValidation>;
  backup: (id: string, directory: string) => Promise<BackupProof>;
  now?: () => number;
}
const HOUR = 3_600_000, LIMIT_SECONDS = 8 * 3600;
const pending = (s: StudyRunSummary['parts'][number]) => ['attempted', 'running', 'unknown'].includes(s.state);
function readResult(path: string): Buffer {
  const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const stat = fstatSync(fd), limit = 64 * 1024 * 1024;
    if (!stat.isFile() || stat.size > limit) throw new Error('Result export exceeds its recorded limit.');
    const bytes = Buffer.alloc(stat.size + 1); let used = 0;
    while (used < bytes.length) { const n = readSync(fd, bytes, used, bytes.length - used, null); if (!n) break; used += n; }
    if (used !== stat.size) throw new Error('Result export changed while reading.');
    return bytes.subarray(0, used);
  } finally { closeSync(fd); }
}
const sha = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

/** Local reads never query a worker. Preparation checks availability; only approval dispatches. */
export async function createCoordinator(options: CoordinatorOptions) {
  options.assertStorage();
  const store = createRunStore(options.stateRoot), now = options.now ?? Date.now;
  const time = () => new Date(now()).toISOString();
  const studioFile = join(store.root, 'installation.json');
  const studioId = await store.locked('installation', async () => {
    if (!existsSync(studioFile)) atomicJSON(studioFile, { id: randomUUID() });
    return readJSON<{ id: string }>(studioFile).id;
  });
  const background = new Set<Promise<unknown>>(), dispatching = new Set<string>(), backingUp = new Set<string>(), checking = new Set<string>();
  const save = (r: RunRecord) => { options.assertStorage(); atomicJSON(store.path(r.summary.id), r); };
  const read = (id: string) => readJSON<RunRecord>(store.path(id));
  const directory = (id: string) => { validRunId(id); return join(options.resultsRoot, id); };
  const input = (r: RunRecord, partId: string): DispatchInput => {
    const part = r.bundle.parts.find(p => p.id === partId)!;
    const dir = directory(r.summary.id);
    return { runId: r.summary.id, bundleHash: r.bundle.hash, partId, machine: part.machine, workers: part.workers,
      directory: dir, sourceArchive: join(dir, 'source.tar.gz'), bundlePath: join(dir, 'bundle.json'),
      nodeVersion: r.bundle.nodeVersion, limitSeconds: LIMIT_SECONDS };
  };
  const start = (promise: Promise<unknown>) => { background.add(promise); void promise.catch(() => {}).finally(() => background.delete(promise)); };
  function writable(): void { options.assertStorage(); }
  async function preflight(r: RunRecord): Promise<StudyRunSummary> {
    r.summary.phase = 'preparing'; r.summary.error = null; save(r);
    try {
      await options.verify(r.bundle, directory(r.summary.id));
      for (const p of r.summary.parts) await options.transports[p.machine].preflight(input(r, p.id));
      r.summary.phase = 'prepared';
    } catch (error) {
      r.summary.phase = 'failed'; r.summary.error = `Preparation: ${error instanceof Error ? error.message : String(error)}`;
    }
    save(r); return structuredClone(r.summary);
  }
  async function queue(r: RunRecord): Promise<void> {
    await store.locked('queue', async () => {
      const path = join(options.mainRoot, 'docs/QUEUE.md');
      const original = readFileSync(path, 'utf8');
      const prefix = `| ${r.summary.id} |`;
      const existing = original.split('\n').filter(line => line.startsWith(prefix));
      if (existing.length) {
        if (existing.length !== 1 || !existing[0].includes(r.bundle.hash)) throw new Error('Queue run identity differs.');
        return;
      }
      const quote = r.summary.approvalText.replaceAll('|', '/').replaceAll('\n', ' ');
      const row = `${prefix} ${r.summary.target} | Frozen browser approval by run ID | ${r.summary.games} games; ${r.summary.blocks} blocks | Owner ${r.summary.approvedAt}: "${quote}" Bundle ${r.bundle.hash}. Approved; launch pending. |\n`;
      const heading = '## Browser-approved study runs';
      const start = original.indexOf(heading);
      let next: string;
      if (start < 0) next = original + `\n${heading}\n\n| Run | Machine | Launch | Work | Approval and result |\n|---|---|---|---|---|\n${row}`;
      else {
        const table = original.indexOf('|---|---|---|---|---|', start);
        if (table < 0) throw new Error('Browser run queue table is incomplete.');
        const at = original.indexOf('\n', table) + 1;
        next = original.slice(0, at) + row + original.slice(at);
      }
      atomicText(path, next, original);
    });
  }
  async function updateQueue(r: RunRecord): Promise<void> {
    await store.locked('queue', async () => {
      const path = join(options.mainRoot, 'docs/QUEUE.md'), before = readFileSync(path, 'utf8');
      const lines = before.split('\n'), prefix = `| ${r.summary.id} |`;
      const indexes = lines.map((l, i) => l.startsWith(prefix) ? i : -1).filter(i => i >= 0);
      if (indexes.length !== 1) throw new Error('Run queue row is missing or ambiguous.');
      const i = indexes[0];
      const marker = `Bundle ${r.bundle.hash}.`;
      if (!lines[i].includes(marker)) throw new Error('Queue bundle differs.');
      lines[i] = lines[i].slice(0, lines[i].indexOf(marker) + marker.length) + ` ${r.summary.phase}; validation ${r.summary.validation.state}; ${r.summary.validation.games}/${r.summary.games} games; backup ${r.summary.backup.state}. |`;
      if (lines.join('\n') === before) return;
      atomicText(path, lines.join('\n'), before);
    });
  }
  async function dispatch(id: string): Promise<void> {
    dispatching.add(id);
    try { await store.locked(id, async () => {
      const r = read(id);
      try {
        writable();
        await options.verify(r.bundle, directory(id));
        // Check every target before the first launch. A failure cannot move work elsewhere.
        for (const p of r.summary.parts) await options.transports[p.machine].preflight(input(r, p.id));
        for (const p of r.summary.parts) {
          p.state = 'attempted'; p.deadline = new Date(now() + LIMIT_SECONDS * 1000).toISOString();
          p.nextCheckAt = new Date(now() + HOUR).toISOString(); r.summary.phase = 'launching'; save(r);
          try {
            const receipt = await options.transports[p.machine].launch(input(r, p.id));
            r.receipts[p.id] = receipt; p.state = 'running';
          } catch (error) { p.state = 'unknown'; p.error = String(error instanceof Error ? error.message : error); }
          save(r);
          // An uncertain submission must not trigger more submissions in this approval.
          if (p.state === 'unknown') {
            for (const rest of r.summary.parts.filter(x => x.state === 'pending')) { rest.state = 'failed'; rest.error = 'Not dispatched after an uncertain submission.'; }
            break;
          }
        }
        r.summary.phase = r.summary.parts.some(p => p.state === 'unknown') ? 'launch-unknown' : 'running';
      } catch (error) {
        r.summary.phase = 'failed'; r.summary.error = error instanceof Error ? error.message : String(error);
        for (const p of r.summary.parts.filter(x => x.state === 'pending')) { p.state = 'failed'; p.error = r.summary.error; }
      }
      save(r);
      try { await updateQueue(r); } catch (error) { r.summary.error = `Queue status: ${String(error)}`; save(r); }
    }); } finally { dispatching.delete(id); }
  }
  async function collectTerminal(r: RunRecord): Promise<void> {
    for (const p of r.summary.parts) {
      if (!['complete', 'failed'].includes(p.state) || r.collected.includes(p.id)) continue;
      if (!p.deadline) { r.collected.push(p.id); save(r); continue; }
      const attempt = r.collectionAttempts[p.id];
      if (attempt && (attempt.count >= 2 || attempt.next > now())) continue;
      writable();
      r.collectionAttempts[p.id] = { count: (attempt?.count ?? 0) + 1, next: now() + HOUR }; save(r);
      try {
        const dest = join(directory(r.summary.id), 'parts', p.id);
        mkdirSync(dest, { recursive: true });
        await options.transports[p.machine].collect(input(r, p.id), r.receipts[p.id] ?? null, dest);
        r.collected.push(p.id);
      } catch (error) {
        r.summary.error = `Collection ${p.id}: ${String(error)}`;
        if (r.collectionAttempts[p.id].count >= 2) r.summary.phase = 'attention-required';
      }
      save(r);
    }
  }
  async function finish(r: RunRecord): Promise<void> {
    if (r.summary.validation.state !== 'pending') return;
    writable();
    if (r.validationAttempted || r.summary.parts.some(p => !r.collected.includes(p.id))) return;
    r.validationAttempted = true; save(r);
    r.summary.phase = 'validating'; save(r);
    const dirs = Object.fromEntries(r.summary.parts.filter(p => p.deadline && r.collected.includes(p.id)).map(p => [p.id, join(directory(r.summary.id), 'parts', p.id)]));
    const result = await options.validate(r.bundle, dirs, directory(r.summary.id));
    const { result: artifact, ...validation } = result;
    if (artifact) {
      if (result.state === 'failed' || !resolve(artifact.path).startsWith(resolve(directory(r.summary.id)) + sep)) throw new Error('Invalid result export path or validation state.');
      const file = readResult(artifact.path);
      if (file.length > 64 * 1024 * 1024 || file.length !== artifact.bytes || sha(file) !== artifact.sha256) throw new Error('Result export size or hash differs.');
      r.summary.result = { bytes: artifact.bytes, sha256: artifact.sha256, filename: artifact.filename }; r.resultPath = artifact.path;
    }
    r.summary.validation = validation;
    r.summary.phase = result.state === 'passed' && r.summary.parts.every(p => p.state === 'complete') ? 'complete' : result.state === 'failed' ? 'failed' : 'partial';
    atomicJSON(join(directory(r.summary.id), 'run-receipt.json'), { studioId, bundleHash: r.bundle.hash, planFingerprint: r.summary.planFingerprint, approval: r.summary.approvalText, approvedAt: r.summary.approvedAt, parts: r.summary.parts, remoteReceipts: r.receipts, validation, export: r.summary.result });
    save(r);
  }
  async function backUp(r: RunRecord): Promise<void> {
    if (r.backupAttempted || r.summary.validation.state === 'pending') return;
    writable(); r.backupAttempted = true; r.summary.backup = { state: 'running', message: 'Backup and cloud-byte proof in progress.' }; save(r);
    backingUp.add(r.summary.id);
    try {
      const proof = await options.backup(r.summary.id, directory(r.summary.id));
      r.summary.backup = { state: 'verified', message: `${proof.files} files, ${proof.bytes} bytes verified from downloaded cloud bytes.` };
    } catch (error) { r.summary.backup = { state: 'failed', message: error instanceof Error ? error.message : String(error) }; }
    backingUp.delete(r.summary.id); save(r);
  }
  return {
    studioId,
    async prepare(value: unknown, target: RunTarget) {
      if (!['m1', 'kaggle', 'both'].includes(target)) throw new Error('Unknown run target.');
      const document = parseResearch(value), study = studyOf(document);
      if (!document.plan || researchStatus(document).plan !== 'current') throw new Error('Save and preview a current measurement plan first.');
      return store.locked('prepare', async () => {
        for (const id of store.ids()) {
          const r = read(id);
          if (r.summary.phase === 'prepared' && r.summary.target === target && JSON.stringify(r.document) === JSON.stringify(document)) {
            return store.locked(id, async () => {
              const current = read(id);
              return current.summary.phase === 'prepared' ? preflight(current) : structuredClone(current.summary);
            });
          }
        }
        writable();
        const id = `study-${time().slice(0, 10).replaceAll('-', '')}-${randomUUID().replaceAll('-', '').slice(0, 12)}`;
        const dir = directory(id); mkdirSync(dir, { recursive: true });
        const frozen = await options.freeze(document, target, id, dir);
        const bundle: CoordinatorBundle = { id: frozen.id, hash: frozen.hash, source: frozen.source, commit: frozen.commit, nodeVersion: frozen.nodeVersion, games: frozen.games, blocks: frozen.blocks, target: frozen.target, parts: frozen.parts };
        const split = bundle.parts.map(p => `${p.machine === 'm1' ? 'M1' : 'Kaggle'} ${p.jobIndexes.length} games`).join('; ');
        const summary: StudyRunSummary = { id, studioId, createdAt: time(), study: { id: study.id, title: study.title, version: study.version, engine: study.engine },
          planFingerprint: document.plan!.fingerprint, bundleHash: bundle.hash, source: bundle.source, commit: bundle.commit,
          recipe: document.plan!.definition.request.recipe, games: bundle.games, blocks: bundle.blocks, target,
          approvalText: `I approve ${id}: ${bundle.games} games (${split}), depth ${document.plan!.definition.request.depth}, pool ${document.plan!.definition.request.pool}, seed ${document.plan!.definition.request.seed}, plan ${document.plan!.fingerprint}, bundle ${bundle.hash}, source ${bundle.commit}, with an eight-hour remote limit including setup and play. First status check after one hour.`,
          approvedAt: null, phase: 'preparing', parts: bundle.parts.map(p => ({ id: p.id, machine: p.machine, workers: p.workers, games: p.jobIndexes.length, blocks: p.blocks, state: 'pending', completedGames: null, checkedAt: null, nextCheckAt: null, deadline: null, error: null })),
          validation: { state: 'pending', games: 0, legalReplays: 0, illegalControls: 0, message: 'No results yet.' }, backup: { state: 'pending', message: 'Backup follows collection and validation.' }, result: null, error: null };
        const record: RunRecord = { summary, document, bundle, key: null, queueWritten: false, receipts: {}, collected: [], lateChecks: {}, resultPath: null, backupAttempted: false, collectionAttempts: {}, validationAttempted: false };
        return store.locked(id, () => preflight(record));
      });
    },
    async approve(id: string, key: string) {
      if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(key)) throw new Error('Invalid approval request key.');
      let launch = false;
      const summary = await store.locked(id, async () => {
        const r = read(id);
        if (r.key) { if (r.key !== key) throw new Error('This run already has an approval. Read its status.'); return structuredClone(r.summary); }
        if (r.summary.phase !== 'prepared') throw new Error('Run is not ready for approval.');
        options.assertStorage();
        await options.verify(r.bundle, directory(id));
        await store.locked('approvals', async () => {
          const claim = join(store.root, `approval-${key}.json`);
          if (existsSync(claim)) {
            const prior = readJSON<{ id: string; hash: string }>(claim);
            if (prior.id !== id || prior.hash !== r.bundle.hash) throw new Error('Approval key already names different work.');
          } else atomicJSON(claim, { id, hash: r.bundle.hash });
        });
        r.key = key; r.summary.approvedAt = time(); r.summary.phase = 'launching'; save(r);
        try { await queue(r); r.queueWritten = true; save(r); launch = true; }
        catch (error) { r.summary.phase = 'failed'; r.summary.error = error instanceof Error ? error.message : String(error); save(r); }
        return structuredClone(r.summary);
      });
      if (launch) start(dispatch(id));
      return summary;
    },
    status(id: string) { return structuredClone(read(id).summary); },
    list(studyId: string) { return store.ids().map(read).filter(r => r.summary.study.id === studyId).map(r => structuredClone(r.summary)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); },
    document(id: string) { return structuredClone(read(id).document); },
    replays(id: string) {
      const r = read(id);
      if (!['passed','incomplete'].includes(r.summary.validation.state)) throw new Error('Run validation is not ready.');
      return exportReplays(directory(id));
    },
    result(id: string) {
      const r = read(id), meta = r.summary.result;
      if (!meta || !r.resultPath) throw new Error('No checked result export is ready.');
      const bytes = readResult(r.resultPath);
      if (bytes.length !== meta.bytes) throw new Error('Result export exceeds its recorded limit.');
      if (sha(bytes) !== meta.sha256) throw new Error('Result export hash differs.');
      return bytes;
    },
    async tick() {
      for (const id of store.ids()) {
        if (checking.has(id)) continue;
        checking.add(id);
        await store.locked(id, async () => {
          const r = read(id);
          if (!r.key) {
            if (r.summary.phase === 'preparing') { r.summary.phase = 'failed'; r.summary.error = 'Preparation stopped. Prepare the saved plan again.'; save(r); }
            return;
          }
          if (!r.queueWritten) { r.summary.phase = 'attention-required'; r.summary.error = 'Approval stopped before the queue receipt. Nothing is dispatched.'; save(r); return; }
          if (r.backupAttempted && ['verified', 'failed'].includes(r.summary.backup.state) && !r.summary.error?.startsWith('Queue status:')) return;
          if (r.summary.phase === 'launching' && !dispatching.has(id)) {
            r.summary.phase = 'attention-required'; r.summary.error = 'Studio stopped during dispatch. No unattempted work is sent again.';
            for (const p of r.summary.parts) if (p.state === 'pending') { p.state = 'failed'; p.error = 'No dispatch receipt.'; }
            save(r);
          }
          if (r.summary.backup.state === 'running' && !backingUp.has(id)) { r.summary.backup = { state: 'failed', message: 'Studio stopped during backup. Inspect the saved receipt and live backup lock before another backup.' }; save(r); }
          for (const p of r.summary.parts.filter(pending)) {
            if (!p.nextCheckAt || Date.parse(p.nextCheckAt) > now()) continue;
            const late = p.state === 'unknown' || !!p.deadline && now() >= Date.parse(p.deadline);
            if (late && (r.lateChecks[p.id] ?? 0) >= 2) { p.nextCheckAt = null; r.summary.phase = 'attention-required'; r.summary.error = 'Remote state remains uncertain after bounded checks.'; save(r); continue; }
            if (late) r.lateChecks[p.id] = (r.lateChecks[p.id] ?? 0) + 1;
            p.checkedAt = time(); p.nextCheckAt = new Date(late ? now() + HOUR / 2 : Math.min(now() + HOUR, Date.parse(p.deadline!))).toISOString(); save(r);
            try {
              const status = await options.transports[p.machine].status(input(r, p.id), r.receipts[p.id] ?? null);
              p.state = status.state; p.completedGames = status.completedGames; p.error = status.message || null;
              if (p.state === 'complete' || p.state === 'failed') p.nextCheckAt = null;
            } catch (error) { p.state = 'unknown'; p.error = error instanceof Error ? error.message : String(error); }
            save(r);
          }
          try { await collectTerminal(r); } catch (error) { r.summary.error = String(error); save(r); }
          if (r.summary.parts.some(pending)) {
            if (r.summary.phase !== 'attention-required') r.summary.phase = r.summary.parts.some(p => p.state === 'unknown') ? 'launch-unknown' : 'running';
            save(r); return;
          }
          if (r.validationAttempted && r.summary.validation.state === 'pending') { r.summary.phase = 'attention-required'; r.summary.error = 'Validation was interrupted or failed. Inspect the preserved files.'; save(r); }
          try { await finish(r); await backUp(r); }
          catch (error) { r.summary.phase = 'attention-required'; r.summary.error = error instanceof Error ? error.message : String(error); save(r); }
          try { await updateQueue(r); if (r.summary.error?.startsWith('Queue status:')) { r.summary.error = null; save(r); } } catch (error) { r.summary.error = `Queue status: ${String(error)}`; save(r); }
        }).catch(() => { console.warn(`Studio check stopped for ${id}; inspect its local receipt and card.`); }).finally(() => checking.delete(id));
      }
    },
    async settle() { await Promise.allSettled([...background]); },
  };
}
export type RunCoordinator = Awaited<ReturnType<typeof createCoordinator>>;
