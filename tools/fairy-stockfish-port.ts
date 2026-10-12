/** Exact effect checks for the fixed base-piece native port. No game campaign. */
import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { A, S, K, C, V, LETTERS, colorOf, inCheck, isAttacked, legalMoves, makeMove, parseSq, piece, sqName, status, typeOf, type Color, type Move, type Position } from '../src/rules/engine';
import { fromFen, toFen } from '../src/rules/setup';
import { DEFAULT_RULES, RULES, setRules } from '../src/rules/rules';
import { sourceId } from '../src/sim/identity';
import { Game } from '../src/game';
import { Uci, toUci, sameMoves } from './fairy-stockfish-smoke';

export const PORT_RULES = { ...DEFAULT_RULES, promotionSet: 'standard' as const };
export const UPSTREAM = '9f778da667f6e07dae1e85d3e2ea204fc6dee94d';
const hash = (p: string): string => createHash('sha256').update(readFileSync(p)).digest('hex');
const json = (p: string, v: unknown): void => writeFileSync(p, JSON.stringify(v, null, 2) + '\n');
const must = (ok: unknown, why: string): void => { if (!ok) throw new Error(why); };
const fenState = (s: string): string => s.replace(/\[\]/g, '').trim();
async function selectVariant(fs: Uci, name: string): Promise<void> {
  const lines = await fs.ready('setoption name UCI_Variant value ' + name);
  must(lines.some(s => s.startsWith('info string variant ' + name + ' ')), 'Native variant was not selected: ' + name);
}

export function portAction(pos: Position, m: Move): string {
  if (m.power || m.pushes || m.via || m.pass || m.drop != null || m.drop2 != null)
    throw new Error('Action outside the fixed base-piece subset');
  const t = typeOf(pos.board[m.from]);
  if (!t || t > 15) throw new Error('Piece outside the fixed base-piece subset');
  const fromto = sqName(m.from) + sqName(m.to);
  if (m.swap) return fromto + '^';
  if (m.shove) return fromto + '>' + sqName(m.shove.to);
  if (m.captures.length && (t === S || ((t === A || t === C) && m.from === m.to) || m.selfRemove || (t === V && m.to !== m.captures[0]))) {
    if (m.promo || new Set(m.captures).size !== m.captures.length || m.captures.some(s => s < 0 || s >= 64 || !pos.board[s] || colorOf(pos.board[s]) === pos.turn || typeOf(pos.board[s]) === K))
      throw new Error('Invalid victim set');
    if (t === S && m.to !== m.captures[m.captures.length - 1]) throw new Error('Chain has wrong landing');
    let mask = 0n;
    for (const s of m.captures) mask |= 1n << BigInt(s);
    return fromto + (m.selfRemove ? '!' : '~') + mask.toString(16);
  }
  return toUci(m);
}

/** Path order is absent from these fixed rules. Prove the collapse for each input. */
export function portMoves(pos: Position): Map<string, Move> {
  if (JSON.stringify(RULES) !== JSON.stringify(PORT_RULES) || toFen(pos).split(' ').length !== 6
      || [...pos.board].some(p => p && (!typeOf(p) || typeOf(p) > 15)))
    throw new Error('Position or rules outside the fixed base-piece subset');
  const effects = new Map<string, Move>(), states = new Map<string, string>();
  for (const m of legalMoves(pos)) {
    const token = portAction(pos, m), fen = toFen(makeMove(pos, m));
    if (states.has(token) && states.get(token) !== fen) throw new Error('Path collapse changes state');
    effects.set(token, m); states.set(token, fen);
  }
  return effects;
}

export function resolvePortAction(pos: Position, token: string): Move {
  const m = portMoves(pos).get(token);
  if (!m) throw new Error('Native action is illegal in King Down');
  return m;
}

function board(name: string, entries: Record<string, string>, turn: Color = 0, halfmove = 0): { name: string; fen: string } {
  const p = fromFen('8/8/8/8/8/8/8/8 w - - 0 1');
  p.turn = turn; p.halfmove = halfmove;
  for (const [s, l] of Object.entries(entries)) p.board[parseSq(s)] = piece(LETTERS.indexOf(l.toUpperCase()) as Parameters<typeof piece>[0], l === l.toUpperCase() ? 0 : 1);
  return { name, fen: toFen(p) };
}

type Fixture = { name: string; fen: string; moves?: string[] };
function fixtures(): Fixture[] {
  const directed = [
    board('archer-white-blockers', { a1: 'K', h8: 'k', d4: 'A', d6: 'p', d5: 'P', f4: 'n', e4: 'P', b4: 'p', c4: 'p', d2: 'n', d3: 'p', b6: 'p', f6: 'p', b2: 'p', f2: 'p' }),
    board('archer-black-blockers', { a1: 'K', h8: 'k', e5: 'a', e3: 'P', e4: 'p', c5: 'N', d5: 'p', g5: 'P', f5: 'P', e7: 'N', e6: 'P', c3: 'P', g3: 'P', c7: 'P', g7: 'P' }, 1),
    { name: 'archer-pin', fen: '4r2k/8/8/8/4p3/8/4A3/4K3 w - - 0 1' },
    board('archer-check-evasion', { e1: 'K', h8: 'k', e2: 'r', c2: 'A', e3: 'P' }),
    board('beast-white-branches', { a1: 'K', h8: 'k', d4: 'S', e4: 'p', e5: 'p', d5: 'p', f5: 'n' }),
    board('beast-black-branches', { a1: 'K', h8: 'k', e5: 's', d5: 'P', d4: 'P', e4: 'P', c4: 'N' }, 1),
    board('beast-final-king-safety', { e1: 'K', h8: 'k', e8: 'r', e2: 'S', e3: 'p', f4: 'p', e5: 'p' }),
    board('beast-double-check-evasion', { e1: 'K', h8: 'k', b3: 'S', b4: 'b', e2: 'r', c4: 'p', d3: 'p' }),
    board('beast-long-chain', Object.fromEntries([['a1', 'K'], ['h8', 'k'], ['b2', 'S'], ...'c2 d2 e2 f2 g2 h3 h4 h5 g6 f6 e6 d6 c6 b6 a5 a4 a3'.split(' ').map(s => [s, 'p'])])),
    board('promotion', { e1: 'K', e8: 'k', a7: 'P', b8: 'r', h2: 'p' }),
    { name: 'mate', fen: '7k/6Q1/5K2/8/8/8/8/8 b - - 0 1' },
    { name: 'stalemate', fen: '7k/5Q2/5K2/8/8/8/8/8 b - - 0 1' },
    board('material-draw', { a1: 'K', h8: 'k', c3: 'N', f6: 'b' }),
    board('fifty-move-draw', { a1: 'K', h8: 'k', d4: 'A' }, 0, 100),
    board('beast-is-not-insufficient', { a1: 'K', h8: 'k', d4: 'S' }),
    board('two-minors-are-not-insufficient', { a1: 'K', h8: 'k', c3: 'N', d3: 'N' }),
    { ...board('promoted-archer-victim', { e1: 'K', h6: 'k', a7: 'P', c8: 'a' }), moves: ['a7a8q'] },
    { ...board('promoted-beast-victim', { e1: 'K', h6: 'k', a7: 'P', b8: 's', b7: 'N' }), moves: ['a7a8q'] },
    { ...board('promoted-mover', { e1: 'K', h6: 'k', a7: 'P' }), moves: ['a7a8q', 'h6h5'] },
    { ...board('ordinary-capture-archer-reply', { a1: 'K', h8: 'k', d4: 'R', e4: 'p', c4: 'a' }), moves: ['d4e4'] },
    board('guard-immunity', { a1: 'K', h8: 'k', d4: 'G', e5: 'p', c5: 'n', f4: 'a', d6: 's', d5: 'g', e4: 'R' }),
    board('king-takes-guard', { d3: 'K', h8: 'k', d4: 'g', f4: 'G' }),
    board('maester-white-swap', { e1: 'K', h8: 'k', a1: 'M', b1: 'G', d1: 'P', a2: 'N', b2: 'p' }, 0, 19),
    board('maester-black-swap', { a1: 'K', d8: 'k', h8: 'm', g8: 'g', e8: 'p', h7: 'n', g7: 'P' }, 1, 19),
    board('maester-swap-king-into-check', { e1: 'K', h8: 'k', a1: 'M', a8: 'r' }),
    board('maester-swap-king-out-of-check', { e1: 'K', h8: 'k', a1: 'M', e8: 'r', d1: 'P' }),
    board('paladin-white-jumps', { a1: 'K', h8: 'k', d4: 'L', d5: 'P', d7: 'p', f4: 'n', e4: 'N', b4: 'g', b6: 'r' }),
    board('paladin-black-jumps', { a1: 'K', h8: 'k', e5: 'l', e4: 'p', e2: 'P', c5: 'N', d5: 'n', g5: 'G', g3: 'R' }, 1),
    board('paladin-self-removal-pin', { e1: 'K', h8: 'k', e2: 'L', e8: 'r', f3: 'n', f2: 'p' }),
    board('ogre-white-push', { a1: 'K', h8: 'k', d4: 'O', e4: 'G', d5: 'p', c4: 'n', c3: 'P', d3: 'g', e5: 'n' }, 0, 37),
    board('ogre-black-push', { a1: 'K', h8: 'k', e5: 'o', d5: 'g', e4: 'P', f5: 'N', f6: 'p', e6: 'G' }, 1, 37),
    board('ogre-push-exposes-king', { e1: 'K', h8: 'k', d2: 'O', e2: 'G', e8: 'r' }),
    board('ogre-push-to-last-rank', { a1: 'K', h8: 'k', d6: 'O', d7: 'P' }, 0, 99),
    board('catapult-white-screens', { a1: 'K', h8: 'k', d4: 'C', d5: 'p', d7: 'r', e4: 'g', g4: 'n', c4: 'P', a4: 'r', d2: 'p', d1: 'G' }),
    board('catapult-black-screens', { a1: 'K', h8: 'k', e5: 'c', e4: 'P', e2: 'R', d5: 'G', b5: 'N', f5: 'p', h5: 'R', e7: 'P', e8: 'g' }, 1),
    board('catapult-screen-pin', { e1: 'K', h8: 'k', e2: 'C', e3: 'p', e8: 'r' }),
    board('reaver-white-step', { a1: 'K', h8: 'k', d4: 'V', e6: 'p', f5: 'g', c6: 'n', c3: 'P' }),
    board('reaver-black-step', { a1: 'K', h8: 'k', e5: 'v', d3: 'P', c4: 'G', f3: 'N', f6: 'p' }, 1),
    board('reaver-step-king-safety', { e1: 'K', h8: 'k', e2: 'V', f4: 'p', e8: 'r' }),
    board('templar-capital', { a1: 'K', h7: 'k', d4: 'T', d6: 'p', f4: 'g', c3: 'G' }),
    board('templar-off-capital', { a1: 'K', h8: 'k', c3: 'T', d4: 'p', b2: 'g' }),
    board('templar-black-capital', { a2: 'K', h8: 'k', e5: 't', e3: 'P', c5: 'G' }, 1),
    board('guard-paladin-material-draw', { a1: 'K', h8: 'k', c3: 'G', d4: 'L', f6: 'v' }),
    board('maester-is-not-insufficient', { a1: 'K', h8: 'k', d4: 'M' }),
    { ...board('promoted-swap', { e1: 'K', h6: 'k', a7: 'P', b8: 'M', c8: 'o' }), moves: ['a7a8q', 'h6h5'] },
    { ...board('promoted-push', { e1: 'K', h6: 'k', a7: 'P', a5: 'o' }), moves: ['a7a8q', 'h6h5', 'a8a6'] },
    { ...board('promoted-catapult-victim', { e1: 'K', h6: 'k', a7: 'P', a6: 'P', a5: 'c' }), moves: ['a7a8q'] },
    board('ogre-never-pushes-own-king', { c3: 'K', h8: 'k', d4: 'O', d5: 'g' })
  ];
  let seed = 72011;
  const rand = (n: number): number => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return (seed >>> 8) % n; };
  const generated: { name: string; fen: string }[] = [];
  for (let attempt = 0; generated.length < 192 && attempt < 10000; attempt++) {
    const p = fromFen('4k3/8/8/8/8/8/8/4K3 w - - 0 1');
    p.turn = rand(2) as Color;
    const types = 'ASGML OCVTasgmlocvtPNBRQpnbrq'.replace(' ', ''), count = 8 + rand(12);
    for (let i = 0; i < count; i++) {
      const s = rand(64), l = types[rand(types.length)];
      if (p.board[s] || (l.toLowerCase() === 'p' && (s < 8 || s >= 56))) continue;
      p.board[s] = piece(LETTERS.indexOf(l.toUpperCase()) as Parameters<typeof piece>[0], l === l.toUpperCase() ? 0 : 1);
    }
    if (inCheck(p, (1 - p.turn) as Color)) continue; // The last mover cannot have left its king in check.
    generated.push({ name: `seeded-${generated.length}`, fen: toFen(p) });
  }
  must(generated.length === 192, 'Corpus generation failed');
  const dense = board('growable-chain', Object.fromEntries([['a1', 'K'], ['h8', 'k'], ['b2', 'S'], ...'c2 d2 e2 f2 c3 d3 e3 f3 c4 d4 e4 f4 d5'.split(' ').map(s => [s, 'p'])]));
  return [...directed, ...generated, dense];
}

function effectPerft(p: Position, depth: number): number {
  if (!depth) return 1;
  let n = 0;
  for (const m of portMoves(p).values()) n += effectPerft(makeMove(p, m), depth - 1);
  return n;
}

async function run(binary: string, out: string): Promise<void> {
  must(!existsSync(out), 'Output exists; preserve it and choose a new verification directory');
  mkdirSync(out, { recursive: true });
  setRules(PORT_RULES);
  const inputs = fixtures();
  const patch = resolve('tools/fairy-stockfish/kingdown.patch');
  json(resolve(out, 'spec.json'), { upstream: UPSTREAM, source: sourceId(), binarySha256: hash(binary), patchSha256: hash(patch), harnessSha256: hash('tools/fairy-stockfish-port.ts'), rules: RULES, fixtures: inputs, threads: 1, nnue: false, check: 'Full semantic legal effects, all child FENs/check flags, all attacked squares, native make/undo/key/material/TT assertions; no strength claim.' });
  const fs = new Uci(binary, resolve('tools/fairy-stockfish.ini')); fs.stderrPath = resolve(out, 'stderr.log');
  const checks: unknown[] = [], searches: unknown[] = [], perfts: unknown[] = [];
  let rawPaths = 0, effects = 0, maxChain = 0, specialSearches = 0, recaptureChecks = 0;
  try {
    await fs.query('uci', s => s === 'uciok');
    await fs.ready('setoption name Threads value 1\nsetoption name Hash value 16\nsetoption name Use NNUE value false');
    await selectVariant(fs, 'kingdown-base');
    for (const input of inputs) {
      let pos = fromFen(input.fen);
      for (const token of input.moves ?? []) pos = makeMove(pos, resolvePortAction(pos, token));
      const raw = legalMoves(pos), expected = portMoves(pos);
      must(!inCheck(pos, (1 - pos.turn) as Color), `Invalid fixture: ${input.name}`);
      await fs.ready('position fen ' + input.fen + (input.moves?.length ? ' moves ' + input.moves.join(' ') : ''));
      const lines = await fs.query('kdinspect', s => s.startsWith('kdinspectok '), 120000);
      appendFileSync(resolve(out, 'transitions.jsonl'), JSON.stringify({ input, fen: toFen(pos), native: lines, reference: [...expected].map(([token, move]) => { const next = makeMove(pos, move); return { token, move, fen: toFen(next), check: inCheck(next) }; }) }) + '\n');
      const states = new Map(lines.filter(s => s.startsWith('kdstate ')).map(s => { const [m, fen, check] = s.slice(8).split('|'); return [m, { fen, check: check === '1' }]; }));
      sameMoves([...expected.keys()], [...states.keys()]);
      const terminal = lines.find(s => s.startsWith('kdterminal '))?.slice(11);
      const recaptures = Number(lines.find(s => s.startsWith('kdrecapturechecks '))?.split(' ')[1]);
      must(Number.isInteger(recaptures), 'Missing native recapture assertions');
      recaptureChecks += recaptures;
      must(terminal === status(pos), `Terminal mismatch ${input.name}: ${terminal} <> ${status(pos)}`);
      const nativeAttacks = lines.find(s => s.startsWith('kdattacks '))?.split(' ').slice(1);
      must(nativeAttacks?.length === 2, 'Missing attacks');
      for (const c of [0, 1] as const) {
        let mask = 0n;
        for (let s = 0; s < 64; s++) if (isAttacked(pos.board, s, c)) mask |= 1n << BigInt(s);
        must(mask === BigInt('0x' + nativeAttacks![c]), `Attacks mismatch ${input.name} side ${c}: ${mask.toString(16)} <> ${nativeAttacks![c]}`);
      }
      for (const [token, m] of expected) {
        const next = makeMove(pos, m), actual = states.get(token)!;
        must(fenState(actual.fen) === toFen(next), `State mismatch ${input.name} ${token}: ${actual.fen} <> ${toFen(next)}`);
        must(actual.check === inCheck(next), `Check mismatch ${input.name} ${token}`);
        maxChain = Math.max(maxChain, m.captures.length);
      }
      rawPaths += raw.length; effects += expected.size;
      checks.push({ ...input, resolvedFen: toFen(pos), rawPaths: raw.length, effects: expected.size, recaptureChecks: recaptures, terminal, pass: true });
      json(resolve(out, 'checks.json'), checks);
      if (status(pos) === 'playing' && (!input.name.startsWith('seeded-') || inputs.indexOf(input) % 12 === 0 || input.name === 'growable-chain')) {
        await fs.ready('setoption name Clear Hash');
        const command = input.name === 'growable-chain' ? 'go depth 1 nodes 1' : 'go depth 3 nodes 10000';
        const lines = await fs.query(command, s => s.startsWith('bestmove '), 120000);
        const token = lines[lines.length - 1].split(' ')[1];
        must(expected.has(token), `Search returned illegal action ${input.name}: ${token}; ${JSON.stringify(lines)}`);
        const m = resolvePortAction(pos, token);
        if (/[~!^>]/.test(token)) specialSearches++;
        searches.push({ name: input.name, token, move: m, info: lines.filter(s => s.startsWith('info depth ')).slice(-1), pass: true });
      }
    }
    must(rawPaths > effects && maxChain >= 17 && specialSearches > 0 && recaptureChecks > 0, 'Missing path collapse, long-chain, special-search or recapture coverage');
    for (const variant of ['chess', 'kingdown-base']) for (const depth of [1, 2, 3]) {
      await selectVariant(fs, variant);
      await fs.ready('position startpos');
      const lines = await fs.query(`go perft ${depth}`, s => s.startsWith('Nodes searched:'), 20000);
      const count = Number(lines[lines.length - 1].split(':')[1]);
      must(count === [1, 20, 400, 8902][depth], 'Ordinary perft regression');
      perfts.push({ variant, depth, count, pass: true });
    }
    await selectVariant(fs, 'kingdown-base');
    for (const input of inputs.filter(s => ['archer-white-blockers', 'archer-black-blockers', 'beast-white-branches', 'beast-double-check-evasion'].includes(s.name))) {
      await fs.ready('position fen ' + input.fen);
      const lines = await fs.query('go perft 2', s => s.startsWith('Nodes searched:'), 20000);
      const count = Number(lines[lines.length - 1].split(':')[1]), expected = effectPerft(fromFen(input.fen), 2);
      must(count === expected, `Effect perft mismatch ${input.name}: ${count} <> ${expected}`);
      perfts.push({ name: input.name, depth: 2, count, pass: true });
    }
    // History, rather than FEN alone, must produce a threefold draw.
    const initial = '4k3/8/8/8/3A4/8/8/4K3 w - - 0 1';
    const sequence = ['d4c4', 'e8f8', 'c4d4', 'f8e8', 'd4c4', 'e8f8', 'c4d4', 'f8e8'];
    const game = new Game(); game.load(fromFen(initial));
    for (const token of sequence) game.play(resolvePortAction(game.pos, token));
    must(game.status === 'drawRepetition', 'Reference repetition control failed');
    await fs.ready(`position fen ${initial} moves ${sequence.join(' ')}`);
    const repetition = await fs.query('kdinspect', s => s.startsWith('kdinspectok '));
    must(repetition.includes('kdterminal drawRepetition'), 'Native repetition control failed');
    const negative = fromFen(inputs[4].fen);
    let rejected = false; try { resolvePortAction(negative, 'd4d6'); } catch { rejected = true; }
    must(rejected, 'Illegal-action negative control failed');
    const capacity = checks.find((s: any) => s.name === 'growable-chain') as { effects: number };
    must(capacity.effects > 8192, 'Dense fixture does not exceed the old capacity');
    json(resolve(out, 'capacity.json'), { ...capacity, oldFixedLimit: 8192, fullStateParity: true, growableStorage: true });
    json(resolve(out, 'checks.json'), checks); json(resolve(out, 'searches.json'), searches); json(resolve(out, 'perft.json'), perfts);
    json(resolve(out, 'complete.json'), { positions: inputs.length, rawPaths, semanticActions: effects, collapsedPaths: rawPaths - effects, maxChain, searchPositions: searches.length, specialSearches, recaptureChecks, promotionMetadata: true, exchangePruningDisabled: true, repetition: true, illegalActionRejected: true, growableCapacity: capacity.effects, finishedAt: new Date().toISOString() });
    console.log(JSON.stringify({ positions: inputs.length, rawPaths, effects, maxChain, searches: searches.length, specialSearches, pass: true }));
  } finally { fs.close(); setRules(DEFAULT_RULES); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [binary, out] = process.argv.slice(2);
  if (!binary || !out) throw new Error('Usage: tsx tools/fairy-stockfish-port.ts <patched-binary> <new-output-directory>');
  run(resolve(binary), resolve(out)).catch(e => { console.error(e); process.exitCode = 1; });
}
