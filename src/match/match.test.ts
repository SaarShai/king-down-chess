import { DEFAULT_RULES, POWERS_BALANCED, RULES_2017, parseKings } from '../rules/rules';
import { afterEach, describe, expect, it } from 'vitest';
import { createMatch, loadMatch, LocalMatch } from './index';
const matches: LocalMatch[] = [];
afterEach(async () => { await Promise.all(matches.splice(0).map(m => m.close())); });
async function create(setup = {}) { const m = await createMatch(setup); matches.push(m); return m; }
async function restart(m: LocalMatch) { const n = await loadMatch(await m.exportSave()); matches.push(n); return n; }
async function move(m: LocalMatch, lan: string, id?: string) { const s = await m.snapshot(); return m.apply({ id: id ?? String(s.revision), expectedRevision: s.revision, lan }); }
describe('isolated local matches', () => {
  it('accepts only one of two concurrent commands at the same revision', async () => {
    const m = await create();
    const results = await Promise.allSettled([
      m.apply({ id: 'first-client', expectedRevision: 0, lan: 'e2-e4' }),
      m.apply({ id: 'second-client', expectedRevision: 0, lan: 'd2-d4' }),
    ]);
    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
    const rejected = results.find(r => r.status === 'rejected') as PromiseRejectedResult;
    expect(rejected.reason.message).toBe('Stale revision');
    const current = await m.snapshot();
    expect(current.revision).toBe(1);
    expect(current.history).toHaveLength(1);
    expect(await (await restart(m)).snapshot()).toEqual(current);
  });
  it('rejects illegal/stale/conflicting commands and deduplicates after reload', async () => {
    const m = await create(); const start = await m.snapshot();
    await expect(move(m, 'invented')).rejects.toThrow('Illegal');
    expect(await m.snapshot()).toEqual(start);
    const command = { id: 'first', expectedRevision: 0, lan: 'e2-e4' };
    await m.apply(command); const played = await m.snapshot();
    await expect(m.apply({ ...command, id: 'stale' })).rejects.toThrow('Stale');
    await expect(m.apply({ ...command, lan: 'd2-d4' })).rejects.toThrow('conflict');
    expect(await m.apply(command)).toEqual(played);
    const n = await restart(m); expect(await n.apply(command)).toEqual(played);
    expect(await n.exportSave()).toEqual(await m.exportSave());
  });
  it('preserves repetition history over restart and blocks terminal moves', async () => {
    let m = await create();
    for (const lan of ['Ng1-f3', 'Ng8-f6', 'Nf3-g1', 'Nf6-g8']) await move(m, lan);
    m = await restart(m);
    for (const lan of ['Ng1-f3', 'Ng8-f6', 'Nf3-g1', 'Nf6-g8']) await move(m, lan);
    const end = await m.snapshot(); expect(end.status).toBe('drawRepetition');
    await expect(move(m, 'e2-e4')).rejects.toThrow('terminal'); expect(await m.snapshot()).toEqual(end);
    expect(await (await restart(m)).snapshot()).toEqual(end);
  });
  it.each([
    ['7k/8/8/2p5/8/2A5/8/4K3 w - - 0 1', ['Ac3*c5', 'Kh8-h7', 'Ac3-c4']],
    ['k7/8/8/4r3/3p4/4S3/8/4K3 w - - 0 1', ['Se3xd4xe5']],
    ['7k/P7/8/8/3p4/3O4/8/4K3 w - - 0 1', ['Od3>d4-d5', 'Kh8-h7', 'a7-a8=Q']],
    ['7k/8/8/8/8/8/8/MN5K w - - 0 1', ['Ma1<>b1', 'Kh8-h7', 'Na1-c2']],
  ])('roundtrips special moves from %s', async (fen, lans) => {
    const m = await create({ fen }); for (const lan of lans) await move(m, lan);
    expect(await (await restart(m)).snapshot()).toEqual(await m.snapshot());
  });
  it('roundtrips Haste between same-side moves using actual turn and move number', async () => {
    const m = await create({ kings: 'Flame:Haste,none', fen: '7k/8/8/r3r3/8/8/8/R5K1 w - - 0 1' });
    await expect(move(m, 'Ra1xa5!H')).rejects.toThrow('Illegal');
    const first = await move(m, 'Ra1-a2!H'); expect(first.turn).toBe(0); expect(first.moveNumber).toBe(1); expect(first.ply).toBe(1);
    const n = await restart(m); expect(await n.snapshot()).toEqual(first);
    const end = await move(n, 'Ra2-a3'); expect(end.turn).toBe(1); expect(end.moveNumber).toBe(1);
  });
  it.each(['current', '2017'] as const)('matches website power/preset precedence for %s', async preset => {
    const kings = 'Flame:Haste,none';
    const m = await create({ preset, kings });
    const rules = JSON.parse(await m.exportSave()).rules;
    const expected = { ...DEFAULT_RULES, ...POWERS_BALANCED, ...(preset === '2017' ? RULES_2017 : {}), kings: parseKings(kings) };
    expect(rules).toEqual(JSON.parse(JSON.stringify(expected)));
    expect(rules.hasteCaptures).toBe(preset === '2017');
  });
  it('never exposes a partly initialized game after invalid FEN', async () => {
    const m = new LocalMatch(); matches.push(m);
    await expect(m.initialize({ fen: 'invalid' })).rejects.toThrow();
    await expect(m.snapshot()).rejects.toThrow('initialization failed');
    await expect(m.exportSave()).rejects.toThrow('initialization failed');
  });
  it('isolates interleaved presets', async () => {
    const fen = '7k/8/8/2p5/8/2A5/8/4K3 w - - 0 1';
    const a = await create({ fen, preset: 'current' }), b = await create({ fen, preset: '2017' });
    const as = await a.snapshot(), bs = await b.snapshot(); expect(as.legal).not.toEqual(bs.legal);
    await move(a, 'Ac3*c5'); expect(await b.snapshot()).toEqual(bs);
    await move(b, bs.legal[0]); expect(await (await restart(a)).snapshot()).toEqual(await a.snapshot());
    expect(await (await restart(b)).snapshot()).toEqual(await b.snapshot());
  });
  it.each(['7k/6Q1/6K1/8/8/8/8/8 b - - 0 1','7k/5Q2/6K1/8/8/8/8/8 b - - 0 1'])('blocks initially terminal position %s', async fen => {
    const m = await create({ fen }); const s = await m.snapshot(); expect(s.status).not.toBe('playing'); expect(s.legal).toEqual([]);
    await expect(move(m, 'Kh8-h7')).rejects.toThrow('terminal'); expect(await m.snapshot()).toEqual(s);
  });
  it('rejects malformed/incompatible saves and illegal replay', async () => {
    const m = await create(); await move(m, 'e2-e4'); const save = JSON.parse(await m.exportSave());
    for (const changed of [{ ...save, engine: 'caller-version' }, { ...save, revision: 2 }, { ...save, rules: { ...save.rules, hands: [['Haste'], []] } }, { ...save, commands: [{ ...save.commands[0], lan: 'invalid' }] }]) await expect(loadMatch(JSON.stringify(changed))).rejects.toThrow();
    await expect(createMatch({ fen: '7k/8/8/8/8/8/8/K w - - 0 1' })).rejects.toThrow('FEN');
    await expect(createMatch({ kings: 'nonsense,none' })).rejects.toThrow('king');
  });
  it('rejects pending calls when its worker exits unexpectedly', async () => {
    const m = await create();
    const pending = m.snapshot();
    // Kill the real thread to exercise the lifecycle boundary, without a test-only protocol.
    const worker = (m as unknown as { worker: import('node:worker_threads').Worker }).worker;
    const result = pending.catch(e => e);
    await worker.terminate();
    await result;
    await expect(m.snapshot()).rejects.toThrow();
  });
  it('rejects pending and subsequent calls on close', async () => {
    const m = await create(); const pending = m.snapshot(); const assertion = expect(pending).rejects.toThrow('closed'); await m.close(); await assertion;
    await expect(m.snapshot()).rejects.toThrow('closed');
  });
});
