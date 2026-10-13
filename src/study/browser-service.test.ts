import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_RULES, RULES, setRules } from '../rules/rules';
import { fromFen, toLan } from '../rules/setup';
import { type StudyTest } from './check';
import { createStudy, positionData, positionOf } from './model';
import { service, studyOf, withChecks } from './browser-service';
import { createStudyClient } from './client';
function fixture() {
  return createStudy({ id: 'one', version: 1, parentVersion: null, title: 'Rook', question: 'Can it move?', engine: 'test-source', rules: structuredClone(DEFAULT_RULES), start: positionData(fromFen('7k/8/8/8/3R4/8/8/K7 w - - 0 1')), prefix: [], actions: [], origin: 'constructed' });
}
function testDoc(): StudyTest {
  return { schema: 'kingdown-test/1', study: fixture(), checks: [{ id: 'legal', label: 'Rook can move', after: 0, kind: 'legal', lan: 'Rd4-d5', expected: true }], coverage: [{ id: 'rook', items: ['Rook'], state: 'tested', reason: 'One move', checks: ['legal'] }] };
}
afterEach(() => { setRules(); vi.unstubAllGlobals(); });
describe('browser study service', () => {
  it('keeps challenge and coverage when assertions change', () => {
    const document = testDoc();
    document.coverage.push({ id: 'identity', items: ['entity identity'], state: 'unsupported', reason: 'No entity IDs', checks: [] });
    document.challenge = { goal: 'Move up', horizon: 1, solutions: [['Rd4-d5']], claim: 'suggested', difficulty: 'unmeasured' };
    const before = structuredClone(document);
    const added = { ...document.checks[0], id: 'new', lan: 'Rd4-d6' };
    const both = withChecks(document, [...document.checks, added]);
    expect(both.coverage.slice(0, 2)).toEqual(document.coverage);
    const changed = withChecks(both, [added]);
    expect(changed.challenge).toEqual(document.challenge);
    expect(changed.coverage[0]).toEqual({ ...document.coverage[0], state: 'untested', checks: [] });
    expect(changed.coverage[1]).toEqual(document.coverage[1]);
    expect(service({ type: 'check', document: changed }, 'test-source').report?.status).toBe('passed');
    expect(() => withChecks(changed, [])).toThrow('Add another check');
    expect(document).toEqual(before);
  });
  it('returns real moves and keeps the ambient rules and input intact', () => {
    setRules({ archerChecks: false }); const before = structuredClone(RULES);
    const document = fixture(); document.rules.hands = [['Haste'], []]; const input = structuredClone(document);
    const result = service({ type: 'play', document, lan: 'Rd4-d5!H' }, 'test-source');
    expect(result.snapshot.position.turn).toBe(0);
    expect(result.moves.map(m => m.lan)).toEqual(result.snapshot.legal);
    for (const m of result.moves) expect(toLan(positionOf(result.snapshot.position), m.move)).toBe(m.lan);
    expect(studyOf(result.document).version).toBe(1); expect(document).toEqual(input); expect(RULES).toEqual(before);
    expect(service({ type: 'undo', document: result.document }, 'test-source').snapshot.position).toEqual(document.start);
    expect(() => service({ type: 'play', document, lan: 'bad' }, 'test-source')).toThrow();
    expect(document).toEqual(input); expect(RULES).toEqual(before);
  });
  it('keeps check results, rejects source mismatch, and locks checked actions', () => {
    const document = testDoc();
    expect(service({ type: 'check', document }, 'test-source').report?.status).toBe('passed');
    expect(service({ type: 'undo', document }, 'test-source').document).toEqual(document);
    if (document.checks[0].kind === 'legal') document.checks[0].expected = false;
    expect(service({ type: 'check', document }, 'test-source').report?.status).toBe('failed');
    document.study.actions = ['Rd4-d5']; document.checks[0].after = 1;
    expect(() => service({ type: 'undo', document }, 'test-source')).toThrow('Remove the check');
    document.checks[0].after = 0;
    expect(service({ type: 'undo', document }, 'test-source').document).toEqual({ ...document, study: fixture() });
    document.challenge = { goal: 'Move', horizon: 1, solutions: [['bad']], claim: 'suggested', difficulty: 'unmeasured' };
    expect(service({ type: 'check', document }, 'test-source').report?.status).toBe('invalid');
    expect(() => service({ type: 'inspect', document }, 'other')).toThrow('Incompatible');
    expect(() => service({ type: 'check', document: { ...document, study: { ...document.study, actions: ['bad'] } } }, 'test-source')).toThrow();
  });
});
describe('study worker client', () => {
  class FakeWorker {
    static all: FakeWorker[] = [];
    onmessage?: (event: { data: any }) => void;
    onerror?: () => void;
    onmessageerror?: () => void;
    calls: any[] = []; stopped = false;
    constructor() { FakeWorker.all.push(this); }
    postMessage(value: unknown) { this.calls.push(value); }
    terminate() { this.stopped = true; }
  }
  it('starts lazily, matches replies, and rejects pending calls on close', async () => {
    FakeWorker.all = []; vi.stubGlobal('Worker', FakeWorker);
    const client = createStudyClient(); expect(FakeWorker.all).toHaveLength(0);
    const request = { type: 'inspect' as const, document: fixture() };
    const first = client.request(request), second = client.request(request), worker = FakeWorker.all[0];
    const result = service(request, 'test-source');
    worker.onmessage!({ data: { id: worker.calls[1].id, result } }); expect(await second).toEqual(result);
    worker.onmessage!({ data: { id: worker.calls[0].id, error: 'bad study' } }); await expect(first).rejects.toThrow('bad study');
    const last = client.request(request); client.close();
    await expect(last).rejects.toThrow('closed'); expect(worker.stopped).toBe(true);
    await expect(client.request(request)).rejects.toThrow('closed');
  });
  it('rejects calls when the worker fails', async () => {
    for (const failure of ['onerror', 'onmessageerror'] as const) {
      FakeWorker.all = []; vi.stubGlobal('Worker', FakeWorker);
      const client = createStudyClient(), call = client.request({ type: 'inspect', document: fixture() });
      FakeWorker.all[0][failure]!(); await expect(call).rejects.toThrow(/worker/); expect(FakeWorker.all[0].stopped).toBe(true);
    }
  });
});
