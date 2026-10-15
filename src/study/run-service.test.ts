import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { createHash, randomUUID } from 'node:crypto';
import { createCoordinator, type CoordinatorOptions } from '../../tools/study-runs/coordinator';
import { createRunHandler } from '../../tools/study-runs/http';
import { atomicJSON, createRunStore } from '../../tools/study-runs/store';
import { exampleStudies } from './examples';
import { createMeasurementPlan } from './measurement-plan';
import { parseResearch } from './evidence';

const roots: string[] = [];
afterEach(() => { roots.splice(0).forEach(p => rmSync(p, { recursive: true, force: true })); });
function document() {
  const doc = exampleStudies('source')[0]; doc.study.actions = []; doc.checks = doc.checks.filter(c => c.after === 0); doc.coverage[0].checks = doc.checks.map(c => c.id);
  const definition = createMeasurementPlan(doc, { recipe: 'activity', start: 'population', seed: 12, pairs: 2, depth: 1, pool: 'TTTTTTT' });
  return parseResearch({ schema: 'kingdown-research/1', document: doc, evidence: [], plan: { definition, source: 'source', fingerprint: 'a'.repeat(64), games: 4, blocks: 2, measures: ['activity'], limits: [], contexts: [{ sourceHash: 'source', specKey: 'key', specKeyVersion: 2, rules: doc.study.rules, pool: 'TTTTTTT' }] } });
}
async function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'study-run-')); roots.push(root); mkdirSync(join(root, 'docs'));
  writeFileSync(join(root, 'docs/QUEUE.md'), 'Existing edits stay here.\n| unrelated | keep |\n');
  let clock = Date.parse('2026-10-14T12:00:00Z');
  const transport = { preflight: vi.fn(async () => {}), launch: vi.fn(async () => ({ remoteId: 'remote', acceptedAt: new Date(clock).toISOString() })), status: vi.fn(async () => ({ state: 'complete' as 'running' | 'complete' | 'failed' | 'unknown', completedGames: 2, message: '', remoteId: 'remote' })), collect: vi.fn(async () => {}) };
  const options: CoordinatorOptions = {
    stateRoot: join(root, 'state'), resultsRoot: join(root, 'results'), mainRoot: root, now: () => clock,
    assertStorage: vi.fn(), verify: vi.fn(async () => {}), transports: { m1: transport, kaggle: transport },
    freeze: vi.fn<CoordinatorOptions['freeze']>(async (_d, target, id) => ({ id, hash: 'b'.repeat(64), source: 'source', commit: 'c'.repeat(40), nodeVersion: process.version, games: 4, blocks: 2, target,
      parts: [{ id: 'part-m1', machine: 'm1', workers: 8, jobIndexes: [0, 1], blocks: 1 }, { id: 'part-kaggle', machine: 'kaggle', workers: 4, jobIndexes: [2, 3], blocks: 1 }] })),
    validate: vi.fn<CoordinatorOptions['validate']>(async (_b, _dirs, out) => { const bytes = Buffer.from('{"schemaVersion":1,"measurements":[]}'); const path = join(out, 'measurements.json'); writeFileSync(path, bytes); return { state: 'passed', games: 4, legalReplays: 4, illegalControls: 2, message: 'Checked fixture', result: { path, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), filename: 'measurements.json' } }; }),
    backup: vi.fn<CoordinatorOptions['backup']>(async () => ({ verified: true, receiptPath: 'receipt', files: 5, bytes: 99 })),
  };
  return { root, options, transport, service: await createCoordinator(options), advance: (ms = 3600000) => { clock += ms; } };
}
describe('persistent study run coordinator', () => {
  it('requires preparation preflight and keeps a concurrent approval out of a failed recheck', async () => {
    const f = await fixture(), run = await f.service.prepare(document(), 'both');
    expect(f.transport.preflight).toHaveBeenCalledTimes(2);
    let started!: () => void, release!: () => void;
    const waiting = new Promise<void>(resolve => { started = resolve; });
    f.transport.preflight.mockImplementationOnce(async () => { started(); await new Promise<void>(resolve => { release = resolve; }); throw new Error('No machine capacity'); });
    const recheck = f.service.prepare(document(), 'both'); await waiting;
    expect(f.service.status(run.id).phase).toBe('preparing');
    const approval = expect(f.service.approve(run.id, randomUUID())).rejects.toThrow('not ready');
    release(); expect(await recheck).toMatchObject({ phase: 'failed', approvedAt: null, error: 'Preparation: No machine capacity' }); await approval;
    expect(f.transport.launch).not.toHaveBeenCalled();
    expect(readFileSync(join(f.root, 'docs/QUEUE.md'), 'utf8')).toBe('Existing edits stay here.\n| unrelated | keep |\n');
    f.transport.preflight.mockRejectedValueOnce(new Error('Power unavailable'));
    const failed = await f.service.prepare(document(), 'm1');
    expect(failed).toMatchObject({ phase: 'failed', approvedAt: null });
    expect(f.service.document(failed.id)).toEqual(document());
  });
  it('approves once, preserves queue edits, reads locally, then collects and links checked bytes', async () => {
    const f = await fixture(), prepared = await f.service.prepare(document(), 'both'), key = randomUUID();
    const a = await f.service.approve(prepared.id, key); expect(a.phase).toBe('launching');
    await f.service.settle(); await f.service.approve(prepared.id, key);
    expect(f.transport.launch).toHaveBeenCalledTimes(2);
    await expect(f.service.approve(prepared.id, randomUUID())).rejects.toThrow('already');
    for (let i = 0; i < 3; i++) { f.service.status(prepared.id); f.service.list(prepared.study.id); await f.service.tick(); }
    expect(f.transport.status).not.toHaveBeenCalled();
    f.advance(); await f.service.tick();
    expect(f.transport.status).toHaveBeenCalledTimes(2); expect(f.transport.collect).toHaveBeenCalledTimes(2);
    expect(f.service.status(prepared.id)).toMatchObject({ phase: 'complete', validation: { state: 'passed' }, backup: { state: 'verified' } });
    expect(JSON.parse(f.service.result(prepared.id).toString()).schemaVersion).toBe(1);
    expect(f.service.document(prepared.id)).toEqual(document());
    await f.service.tick(); expect(f.options.backup).toHaveBeenCalledTimes(1);
    const queue = readFileSync(join(f.root, 'docs/QUEUE.md'), 'utf8');
    expect(queue.startsWith('Existing edits stay here.\n| unrelated | keep |\n')).toBe(true);
    expect(queue.split('\n').filter(l => l.startsWith(`| ${prepared.id} |`))).toHaveLength(1);
    writeFileSync(join(f.root, 'results', prepared.id, 'measurements.json'), 'changed');
    expect(() => f.service.result(prepared.id)).toThrow('limit');
  });
  it('never retries an uncertain submission and bounds remote reconciliation', async () => {
    const f = await fixture(); f.transport.launch.mockRejectedValue(new Error('Lost reply'));
    f.transport.status.mockResolvedValue({ state: 'unknown', completedGames: 0, remoteId: 'remote', message: 'No receipt' });
    const run = await f.service.prepare(document(), 'both'); await f.service.approve(run.id, randomUUID()); await f.service.settle();
    expect(f.transport.launch).toHaveBeenCalledTimes(1); expect(f.service.status(run.id).phase).toBe('launch-unknown');
    f.advance(); await f.service.tick(); f.advance(1800000); await f.service.tick(); f.advance(1800000); await f.service.tick();
    expect(f.transport.status).toHaveBeenCalledTimes(2); expect(f.service.status(run.id).phase).toBe('attention-required');
    f.advance(36000000); await f.service.tick(); expect(f.transport.status).toHaveBeenCalledTimes(2); expect(f.transport.launch).toHaveBeenCalledTimes(1);
  });
  it('collects a terminal part even while another part is running; backs up only after validation', async () => {
    const f = await fixture(), run = await f.service.prepare(document(), 'both');
    f.transport.status.mockResolvedValueOnce({ state: 'complete', completedGames: 2, remoteId: 'remote', message: '' }).mockResolvedValue({ state: 'running', completedGames: 1, remoteId: 'remote', message: '' });
    await f.service.approve(run.id, randomUUID()); await f.service.settle(); f.advance(); await f.service.tick();
    expect(f.transport.collect).toHaveBeenCalledTimes(1); expect(f.options.validate).not.toHaveBeenCalled(); expect(f.options.backup).not.toHaveBeenCalled();
    await f.service.tick(); expect(f.transport.collect).toHaveBeenCalledTimes(1);
  });
  it('refuses an approval key used for different work', async () => {
    const f = await fixture(), first = await f.service.prepare(document(), 'm1'), second = await f.service.prepare(document(), 'kaggle'), key = randomUUID();
    await f.service.approve(first.id, key); await f.service.settle();
    await expect(f.service.approve(second.id, key)).rejects.toThrow('different work');
    expect(f.service.status(second.id).approvedAt).toBeNull(); expect(f.transport.launch).toHaveBeenCalledTimes(2);
  });
  it('releases a dead process lock and preserves a live process lock', async () => {
    const f = await fixture(), store = createRunStore(join(f.root,'lock-test')), path = join(store.root,'owned.lock');
    const child = spawn('python3',['-c',"import fcntl,sys,time; f=open(sys.argv[1],'w'); fcntl.flock(f,fcntl.LOCK_EX); print('ready',flush=True); time.sleep(30)",path]);
    await new Promise<void>((resolve,reject)=>{ child.stdout.once('data',()=>resolve()); child.once('error',reject); });
    try { await expect(store.locked('owned',async()=>true)).rejects.toThrow('busy'); }
    finally { const closed=new Promise<void>(resolve=>child.once('close',()=>resolve())); child.kill('SIGKILL'); await closed; }
    expect(await store.locked('owned',async()=>true)).toBe(true);
  });
  it('stops before approval when storage or frozen identity fails', async () => {
    const f = await fixture(), run = await f.service.prepare(document(), 'both');
    vi.mocked(f.options.verify).mockRejectedValue(new Error('Bundle mismatch'));
    await expect(f.service.approve(run.id, randomUUID())).rejects.toThrow('Bundle mismatch');
    expect(f.transport.launch).not.toHaveBeenCalled(); expect(f.service.status(run.id).approvedAt).toBeNull();
    vi.mocked(f.options.assertStorage).mockImplementation(() => { throw new Error('Card absent'); });
    await expect(f.service.prepare(document(), 'm1')).rejects.toThrow('Card absent');
  });
  it('keeps completed data separate from backup failure and never repeats backup', async () => {
    const f = await fixture(); vi.mocked(f.options.backup).mockRejectedValue(new Error('Live backup lock'));
    const run = await f.service.prepare(document(), 'both'); await f.service.approve(run.id, randomUUID()); await f.service.settle(); f.advance(); await f.service.tick();
    expect(f.service.status(run.id)).toMatchObject({ phase: 'complete', backup: { state: 'failed' } });
    expect(f.service.result(run.id).length).toBeGreaterThan(0); await f.service.tick(); expect(f.options.backup).toHaveBeenCalledTimes(1);
  });
  it('recovers an interrupted dispatch without sending the unattempted part', async () => {
    const f = await fixture(), run = await f.service.prepare(document(), 'both');
    await f.service.approve(run.id, randomUUID()); await f.service.settle();
    const path = join(f.root, 'state', `${run.id}.json`), saved = JSON.parse(readFileSync(path, 'utf8'));
    saved.summary.phase = 'launching'; saved.summary.parts[1].state = 'pending'; saved.summary.parts[1].deadline = null; atomicJSON(path, saved);
    const recovered = await createCoordinator(f.options); await recovered.tick();
    expect(recovered.studioId).toBe(f.service.studioId); expect(f.transport.launch).toHaveBeenCalledTimes(2);
    expect(recovered.status(run.id).parts[1]).toMatchObject({ state: 'failed', error: 'No dispatch receipt.' });
  });
  it('recovers a lost final launch response after restart without a second submission', async () => {
    const f = await fixture(), run = await f.service.prepare(document(), 'both');
    f.transport.launch.mockReset().mockResolvedValueOnce({ remoteId: 'remote', acceptedAt: new Date().toISOString() }).mockRejectedValueOnce(new Error('Response lost'));
    await f.service.approve(run.id, randomUUID()); await f.service.settle();
    const recovered = await createCoordinator(f.options);
    await recovered.tick(); expect(f.transport.status).not.toHaveBeenCalled();
    f.advance(); await recovered.tick();
    expect(f.transport.launch).toHaveBeenCalledTimes(2);
    expect(f.transport.collect).toHaveBeenCalledTimes(2);
    expect(recovered.status(run.id)).toMatchObject({ phase: 'complete', validation: { state: 'passed' }, backup: { state: 'verified' } });
    expect(recovered.result(run.id)).toBeDefined();
  });
  it('does not repeat failed validation or collect a failed part more than twice', async () => {
    const f = await fixture(); f.transport.collect.mockRejectedValue(new Error('Unavailable'));
    const run = await f.service.prepare(document(), 'both'); await f.service.approve(run.id, randomUUID()); await f.service.settle(); f.advance(); await f.service.tick();
    await f.service.tick(); expect(f.transport.collect).toHaveBeenCalledTimes(2); f.advance(); await f.service.tick(); f.advance(); await f.service.tick();
    expect(f.transport.collect).toHaveBeenCalledTimes(4); expect(f.service.status(run.id).phase).toBe('attention-required'); expect(f.options.validate).not.toHaveBeenCalled();
  });
});
describe('loopback studio boundary', () => {
  it('requires exact origin, token, bounded strict JSON, and keeps cached reads free of worker queries', async () => {
    const f = await fixture(); const get = vi.fn(async () => f.service); const handler = createRunHandler(get);
    const server = createServer((req, res) => { void handler(req, res, () => { res.writeHead(404); res.end(); }); });
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const address = server.address(); if (!address || typeof address === 'string') throw new Error('Missing port');
    const origin = `http://127.0.0.1:${address.port}`, url = origin + '/api/study-runs';
    const post = (value: unknown, headers: Record<string, string> = {}) => fetch(url, { method: 'POST', headers: { origin, 'content-type': 'application/json', ...headers }, body: JSON.stringify(value) });
    try {
      expect((await post({ action: 'connect' }, { origin: 'https://evil.test' })).status).toBe(403);
      expect((await fetch(url, { headers: { origin } })).status).toBe(405);
      expect(get).not.toHaveBeenCalled();
      const connected = await post({ action: 'connect' }); expect(connected.headers.get('cache-control')).toBe('no-store'); const session = await connected.json();
      expect((await post({ action: 'list', studyId: 'x' })).status).toBe(403);
      const token = { 'x-king-down-studio': session.token };
      expect((await post({ action: 'prepare', document: document(), target: 'm1', command: 'whoami' }, token)).status).toBe(400);
      expect((await post({ action: 'list', studyId: 'x'.repeat(1100000) }, token)).status).toBe(413);
      expect((await post({ action: 'list', studyId: 'x' }, token)).status).toBe(200);
      expect(f.transport.status).not.toHaveBeenCalled(); expect(f.transport.launch).not.toHaveBeenCalled();
    } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
  });
});
