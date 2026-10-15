import { DEFAULT_RULES, POWERS_BALANCED, RULES_2017, parseKings } from '../rules/rules';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cp, appendFile, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createMatch, loadMatch, LocalMatch } from './index';
import { fromFen, toFen } from '../rules/setup';
import type { Position } from '../rules/engine';
const matches: LocalMatch[] = [];
afterEach(async () => { await Promise.all(matches.splice(0).map(m => m.close())); });
async function create(setup = {}) { const m = await createMatch(setup); matches.push(m); return m; }
async function restart(m: LocalMatch) { const n = await loadMatch(await m.exportSave()); matches.push(n); return n; }
async function move(m: LocalMatch, lan: string, id?: string) { const s = await m.snapshot(); return m.apply({ id: id ?? String(s.revision), expectedRevision: s.revision, lan }); }
describe('isolated local matches', () => {
  it('exposes detached public rules and legal engine moves without private card state', async () => {
    const m = await create({ kings: 'Flame:Haste,none' }), before = await m.snapshot();
    expect(before.rules.hands).toEqual([[], []]);
    expect(before.rules).not.toHaveProperty('piles');
    expect(before.rules).not.toHaveProperty('cardPool');
    expect(before.moves.map(m => m.lan)).toEqual(before.legal);
    before.moves[0].move.from = 99;
    before.rules.kings = [null, null];
    expect((await m.snapshot()).moves[0].move.from).not.toBe(99);
    expect((await m.snapshot()).rules.kings).not.toEqual([null, null]);
  });
  it('selects bounded legal moves repeatedly without mutating or persisting search state', async () => {
    const m = await create(), before = await m.snapshot(), save = await m.exportSave();
    const selected = await m.chooseMove({ maxTimeMs: 1000, maxDepth: 1 });
    expect(before.legal).toContain(selected);
    expect(await m.chooseMove({ maxTimeMs: 1000, maxDepth: 1 })).toBe(selected);
    expect(before.legal).toContain(await m.chooseMove({ maxTimeMs: 1, maxDepth: 8 }));
    expect(await m.snapshot()).toEqual(before);
    expect(await m.exportSave()).toBe(save);
  });
  it('uses the actual Haste continuation turn for AI selection', async () => {
    const m = await create({ kings: 'Flame:Haste,none', fen: '7k/8/8/r3r3/8/8/8/R5K1 w - - 0 1' });
    const pending = await move(m, 'Ra1-a2!H');
    expect(pending.turn).toBe(0); expect(pending.ply).toBe(1);
    const lan = await m.chooseMove({ maxTimeMs: 25, maxDepth: 2 });
    expect(pending.legal).toContain(lan);
    expect(await m.snapshot()).toEqual(pending);
    expect((await move(m, lan)).turn).toBe(1);
  });
  it('rejects unbounded or malformed search options and terminal search', async () => {
    const m = await create(), before = await m.snapshot();
    for (const options of [{ maxTimeMs: 0 }, { maxTimeMs: 5001 }, { maxTimeMs: Infinity }, { maxTimeMs: 1.5 }, { maxDepth: 0 }, { maxDepth: 9 }, { maxDepth: NaN }, { maxTimeMs: null }, { unknown: 1 }]) {
      await expect(m.chooseMove(options as any)).rejects.toThrow(/Malformed/);
    }
    expect(await m.snapshot()).toEqual(before);
    const end = await create({ fen: '7k/8/8/8/8/8/8/K7 w - - 0 1' });
    await expect(end.chooseMove()).rejects.toThrow('terminal');
  });
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
  it('refuses the chess castling and en-passant FEN fields without the classic flag', async () => {
    await expect(createMatch({ fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' })).rejects.toThrow('Malformed FEN');
    await expect(createMatch({ fen: 'rnbqkbnr/pppp1ppp/8/8/3pP3/8/PPPP1PPP/RNBQKBNR b - e3 0 3' })).rejects.toThrow('Malformed FEN');
    expect((await (await create({ fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1' })).snapshot()).legal).not.toContain('O-O');
  });
  it.each([0, 1] as const)('roundtrips each mark kind and lifetime written by the engine for side %s', async side => {
    const base = '7k/8/8/8/8/8/P7/R5K1 w - - 0 1';
    for (const kind of ['', 'i', 'a']) for (const left of [0, 1, 2]) {
      const p = fromFen(base);
      p.marks = side === 0 ? [{ sq: 0, left, ward: kind !== '', all: kind === 'a' }, undefined] : [undefined, { sq: 0, left, ward: kind !== '', all: kind === 'a' }];
      const fen = toFen(p);
      expect(fen).toBe(`${base} ma1${side === 0 ? 'w' : 'b'}${kind}${left === 1 ? '' : left}`);
      const m = await create({ fen });
      expect((await m.snapshot()).fen).toBe(fen);
      expect(await (await restart(m)).snapshot()).toEqual(await m.snapshot());
    }
  }, 20_000); // Nine matches and nine restarts start eighteen workers; a CI runner needs more than 5 s.
  it.each([
    ['u1.2', { used: [1, 2] }],
    ['ma1wi/ma8ba2', { marks: [{ sq: 0, ward: true }, { sq: 56, all: true, left: 2 }] }],
    ['f', { free: true }],
    ['ha2', { haste: 8 }],
    ['ha2r', { haste: 8, rage: 1 }],
    ['ha2t', { haste: 8, rage: 2 }],
    ['ha2o', { haste: 8, rage: 3 }],
    ['l', { lost: Array(32).fill(0) }],
    ['lRn', { lost: Array.from({ length: 32 }, (_, i) => i === 4 || i === 18 ? 1 : 0) }],
    ['g1.2', { waiting: [1, 2] }],
    ['yHaste.Freeze', { last: ['Haste', 'Freeze'] }],
    ['y.MorphP', { last: [undefined, 'MorphP'] }],
    ['d1.2', { drawn: [1, 2] }],
  ] as const)('roundtrips the engine-written power form %s', async (field, state) => {
    const base = '7k/8/8/8/8/8/P7/R5K1 w - - 0 1';
    const p = { ...fromFen(base), ...state } as Position, fen = toFen(p);
    expect(fen).toBe(`${base} ${field}`);
    const m = await create({ fen });
    expect((await m.snapshot()).fen).toBe(fen);
    expect(await (await restart(m)).snapshot()).toEqual(await m.snapshot());
  });
  it.each(['ma1wx', 'ma1wia', 'ma1wi3', 'ma1wa3', 'ha2x', 'yUnknown.Freeze', 'yHaste.Unknown', 'd10001.0', 'd1.-1', 'd1.2.3'])('refuses malformed power form %s', async field => {
    await expect(createMatch({ fen: `7k/8/8/8/8/8/P7/R5K1 w - - 0 1 ${field}` })).rejects.toThrow();
  });
  it('plays a public mirror deal: the computer plays a card, the snapshot shows the hands, a reload replays it', async () => {
    const fen = '7k/8/8/8/4q3/8/8/R5K1 w - - 0 1', m = await create({ fen, hand: ['Haste'] }), plain = await create({ fen });
    const start = await m.snapshot(), card = await m.chooseMove({ level: 'club', maxTimeMs: 400 });
    expect(start.rules.hands).toEqual([['Haste'], ['Haste']]);
    expect((await plain.snapshot()).legal).not.toContain(card);
    const after = await move(m, card); expect(after.fen.split(' ')[6]).toContain('u1.0');
    await move(m, await m.chooseMove({ level: 'club', maxTimeMs: 400 }));
    const played = await m.snapshot(); expect(played.fen.split(' ')[0]).not.toContain('q');
    expect(await (await restart(m)).snapshot()).toEqual(played);
  });
  it('accepts an empty public hand as a game with no cards', async () => {
    expect(await (await create({ hand: [] })).snapshot()).toEqual(await (await create()).snapshot());
  });
  it.each([
    ['one empty slot', Array(1)],
    ['an empty slot after a card', ['Haste', ,]],
    ['a null slot', [null]],
    ['a null slot after a card', ['Haste', null]],
  ])('refuses a public hand with %s before it can produce an unloadable save', async (_label, hand) => {
    await expect(create({ hand } as any).then(() => undefined)).rejects.toThrow('Malformed hand');
  });
  it('refuses a private hand, a pile, an unknown card and a hand with a spendable king power', async () => {
    for (const setup of [{ hand: ['Nonsense'] }, { hand: ['Haste', 'Haste'] }, { hand: 'Haste' }, { hand: ['Haste'], kings: 'Flame:Strike,none' }]) await expect(createMatch(setup as any)).rejects.toThrow();
    const save = JSON.parse(await (await create({ hand: ['Haste'] })).exportSave());
    for (const rules of [{ ...save.rules, hands: [['Haste'], []] }, { ...save.rules, piles: [['Freeze'], ['Freeze']] }]) await expect(loadMatch(JSON.stringify({ ...save, rules }))).rejects.toThrow();
  });
  it('accepts the castling and en-passant FEN fields with the classic flag', async () => {
    expect((await (await create({ classic: true, fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' })).snapshot()).fen).toContain(' w KQkq - ');
    const ep = await create({ classic: true, fen: 'rnbqkbnr/pppp1ppp/8/8/3pP3/8/PPPP1PPP/RNBQKBNR b - e3 0 3' });
    expect((await ep.snapshot()).legal).toContain('d4xe3');
    await expect(createMatch({ classic: 'yes' } as any)).rejects.toThrow('Malformed');
  });
  // Only O-O mates: the Mercy king on g1 shelters the knight on g2 (Rh1-f1 allows Kxg2; Ke1-g1 gives no check).
  it('castles O-O with a Mercy king through apply and chooseMove, and replays it', async () => {
    const m = await create({ classic: true, kings: 'Spirit:Mercy,none', fen: '4R3/8/7N/7N/8/5k2/6N1/4K2R w K - 0 1' });
    const s = await m.snapshot(); expect(s.legal).toEqual(expect.arrayContaining(['O-O', 'Ke1-g1']));
    expect(await m.chooseMove({ level: 'club', maxTimeMs: 400 })).toBe('O-O');
    const castled = await move(m, 'O-O'); expect(castled.status).toBe('checkmate');
    expect(await (await restart(m)).snapshot()).toEqual(castled);
    const start = await create({ classic: true, kings: 'Spirit:Mercy,none', backRank: 'RNBQKBNR' });
    for (const lan of ['e2-e4', 'e7-e5', 'Ng1-f3', 'Nb8-c6', 'Bf1-c4', 'Ng8-f6', 'O-O']) await move(start, lan);
    const played = await start.snapshot(); expect(played.fen.split(' ')[0].split('/')[7]).toBe('RNBQ1RK1');
    expect(await (await restart(start)).snapshot()).toEqual(played);
  });
  it.each(['beginner', 'casual', 'club', 'strong'] as const)('the %s level returns a legal move within its time cap', async level => {
    const cap = { beginner: 700, casual: 800, club: 800, strong: 2500 }[level];
    const m = await create({ backRank: 'RAGKLMSO', kings: 'Spirit:Mercy,Shadow:Darkness', hand: ['Freeze', 'Strike', 'Burn', 'Rally'] });
    for (const lan of ['e2-e4', 'e7-e5']) await move(m, lan);
    const s = await m.snapshot(), t = performance.now(), lan = await m.chooseMove({ level });
    expect(s.legal).toContain(lan);
    expect(performance.now() - t).toBeLessThan(cap + 1000);
  }, 10000);
  it('refuses an unknown level', async () => {
    await expect((await create()).chooseMove({ level: 'master' } as any)).rejects.toThrow('Malformed');
  });
  it('keeps the Strong time cap when the caller asks for a longer search', async () => {
    const m = await create({ backRank: 'RAGKLMSO', kings: 'Spirit:Mercy,Shadow:Darkness', hand: ['Freeze', 'Strike', 'Burn', 'Rally'] });
    for (const lan of ['e2-e4', 'e7-e5']) await move(m, lan);
    const s = await m.snapshot(), t = performance.now(), lan = await m.chooseMove({ level: 'strong', maxTimeMs: 5000 });
    expect(s.legal).toContain(lan);
    expect(performance.now() - t).toBeLessThan(3500);
  }, 10000);
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
  it('deduplicates simultaneous retries and returns the latest state after later moves', async () => {
    const m = await create(), command = { id: 'retry', expectedRevision: 0, lan: 'e2-e4' };
    const results = await Promise.all([m.apply(command), m.apply(command)]);
    expect(results[0]).toEqual(results[1]);
    expect(results[0].revision).toBe(1);
    const current = await move(m, 'e7-e5');
    const resumed = await restart(m);
    expect(await resumed.apply(command)).toEqual(current);
    expect(JSON.parse(await resumed.exportSave()).commands).toHaveLength(2);
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
  it('rejects tampered results and duplicate IDs even when the moves themselves are legal', async () => {
    const m = await create(); await move(m, 'e2-e4'); await move(m, 'e7-e5');
    const original = await m.exportSave(), saved = JSON.parse(original);
    for (const patch of [
      { fen: saved.initialFen }, { ply: 999 }, { status: 'checkmate' },
      { expectedRevision: 0 }, { id: saved.commands[0].id },
    ]) {
      const altered = structuredClone(saved);
      Object.assign(altered.commands[1], patch);
      await expect(loadMatch(JSON.stringify(altered))).rejects.toThrow();
    }
    const partial = new LocalMatch(); matches.push(partial);
    saved.commands[1].ply = 999;
    await expect(partial.initialize(JSON.stringify(saved), true)).rejects.toThrow('Invalid replay');
    await expect(partial.snapshot()).rejects.toThrow('initialization failed');
    expect(await m.exportSave()).toBe(original);
  });
  it('rejects pending calls when its worker exits unexpectedly', async () => {
    const m = await create();
    const worker = (m as unknown as { worker: import('node:worker_threads').Worker }).worker;
    // Drop delivery so a quick successful reply cannot conceal broken pending-call rejection.
    const delivery = vi.spyOn(worker, 'postMessage').mockImplementation(() => {});
    try {
      const rejected = expect(m.snapshot()).rejects.toThrow('exited');
      await worker.terminate(); await rejected;
      await expect(m.snapshot()).rejects.toThrow('closed');
    } finally { delivery.mockRestore(); }
  });
  it('times out an unresponsive worker, rejects all pending calls and closes the handle', async () => {
    const m = await create();
    const worker = (m as unknown as { worker: import('node:worker_threads').Worker }).worker;
    const delivery = vi.spyOn(worker, 'postMessage').mockImplementation(() => {});
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    try {
      const rejected = [expect(m.snapshot()).rejects.toThrow('timed out'), expect(m.exportSave()).rejects.toThrow('timed out'), expect(m.chooseMove({ maxTimeMs: 1 })).rejects.toThrow('timed out')];
      vi.advanceTimersByTime(15000);
      await Promise.all(rejected);
      await expect(m.snapshot()).rejects.toThrow('closed');
    } finally { vi.useRealTimers(); delivery.mockRestore(); }
  });
  it('rejects pending and subsequent calls on close', async () => {
    const m = await create(); const pending = m.snapshot(); const assertion = expect(pending).rejects.toThrow('closed'); await m.close(); await assertion;
    await expect(m.snapshot()).rejects.toThrow('closed');
  });
  it('accepts test-only edits but rejects saves after an actual runtime source change', async () => {
    const root = fileURLToPath(new URL('../../', import.meta.url));
    const copy = await mkdtemp(join(tmpdir(), 'kingdown-match-version-'));
    try {
      await mkdir(join(copy, 'src/sim'), { recursive: true });
      await Promise.all([
        ...['rules', 'ai', 'match', 'workshop'].map(dir => cp(join(root, 'src', dir), join(copy, 'src', dir), { recursive: true })),
        ...['package.json', 'src/game.ts', 'src/sim/ts-worker.ts', 'src/sim/worker-boot.mjs'].map(file => cp(join(root, file), join(copy, file))),
        symlink(join(root, 'node_modules'), join(copy, 'node_modules'), 'dir'),
      ]);
      await writeFile(join(copy, 'probe.mts'), `
import { createMatch, loadMatch } from './src/match/index.ts';
import { readFile, writeFile } from 'node:fs/promises';
const creating = process.argv[2] === 'create';
const match = creating ? await createMatch() : await loadMatch(await readFile('save.json', 'utf8'));
try {
  if (creating) { await match.apply({ id: 'first', expectedRevision: 0, lan: 'e2-e4' }); await writeFile('save.json', await match.exportSave()); }
  console.log(JSON.stringify(await match.snapshot()));
} finally { await match.close(); }
`);
      const run = (action: string) => promisify(execFile)(process.execPath, ['--import', 'tsx', 'probe.mts', action], { cwd: copy, timeout: 8000 });
      const baseline = JSON.parse((await run('create')).stdout);
      const originalEngine = JSON.parse(await readFile(join(copy, 'save.json'), 'utf8')).engine;
      await writeFile(join(copy, 'src/rules/identity-probe.test.ts'), '// Test-only edit must not change compatibility.\n');
      expect(JSON.parse((await run('load')).stdout)).toEqual(baseline);
      await appendFile(join(copy, 'src/rules/setup.ts'), '\n// Runtime source changed in an isolated test copy.\n');
      await expect(run('load')).rejects.toThrow('Incompatible save');
      expect(JSON.parse((await run('create')).stdout)).toEqual(baseline);
      expect(JSON.parse(await readFile(join(copy, 'save.json'), 'utf8')).engine).not.toBe(originalEngine);
    } finally { await rm(copy, { recursive: true, force: true }); }
  }, 40000);
});
