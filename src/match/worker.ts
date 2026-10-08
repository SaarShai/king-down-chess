import { parentPort } from 'node:worker_threads';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Game } from '../game';
import { RULES_2017, RULES_2021, POWERS_BALANCED, RULES, parseKings, setRules } from '../rules/rules';
import { fromFen, toFen, toLan } from '../rules/setup';
import { moveNumber, type Position } from '../rules/engine';
import { positionKey, resetSearchState, search } from '../ai/search';
import type { MatchSave, MatchSetup, MatchSnapshot, MoveCommand } from './index';

declare const __KINGDOWN_COMPILED__: boolean;
// Conservative development compatibility: every engine/search source change invalidates replay.
const hash = createHash('sha256');
function hashTree(url: URL): void {
  for (const entry of readdirSync(url, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const child = new URL(entry.name + (entry.isDirectory() ? '/' : ''), url);
    if (entry.isDirectory()) hashTree(child);
    else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')) { hash.update(fileURLToPath(child).split('/src/')[1]); hash.update(readFileSync(child)); }
  }
}
if (typeof __KINGDOWN_COMPILED__ !== 'undefined' && __KINGDOWN_COMPILED__) {
  hash.update(readFileSync(new URL('./worker.mjs', import.meta.url)));
} else {
  hash.update(readFileSync(new URL('../game.ts', import.meta.url)));
  hash.update(readFileSync(new URL('./worker.ts', import.meta.url)));
  hashTree(new URL('../rules/', import.meta.url)); hashTree(new URL('../ai/', import.meta.url));
}
const engine = `sha256:${hash.digest('hex')}`;
// Bounds keep every accepted match export within the JSON load limit.
const MAX_COMMANDS = 1000, MAX_SAVE_LENGTH = 8_000_000;
let game: Game | undefined, saved: MatchSave;
let initializationFailed = false, initialized = false;
function object(value: unknown, keys: string[]): Record<string, any> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(k => !keys.includes(k))) throw new Error('Malformed input');
  return value as Record<string, any>;
}
function integer(n: unknown): boolean { return Number.isSafeInteger(n) && (n as number) >= 0; }
function position(fen: unknown): Position {
  if (typeof fen !== 'string' || fen.length > 4096) throw new Error('Malformed FEN');
  const fields = fen.split(' '), rows = fields[0].split('/');
  if (fields.length < 6 || fields.length > 7 || !['w', 'b'].includes(fields[1]) || fields[2] !== '-' || fields[3] !== '-' || !/^\d+$/.test(fields[4]) || !/^[1-9]\d*$/.test(fields[5]) || rows.length !== 8 || rows.some(r => !/^[1-8PNBRQKALGMSOCVTHpnbrqkalgmsocvth]+$/.test(r) || [...r].reduce((n, c) => n + (/\d/.test(c) ? +c : 1), 0) !== 8) || (fields[0].match(/K/g) ?? []).length !== 1 || (fields[0].match(/k/g) ?? []).length !== 1) throw new Error('Malformed FEN');
  if (fields[6] && fields[6].split('/').some(t => !/^(u\d+\.\d+|m[a-h][1-8][wb]\d*|f|h[a-h][1-8]|l[PNBRQKALGMSOCVTpnbrqkalgmsocvt]*|g\d+\.\d+)$/.test(t))) throw new Error('Unsupported or malformed power state');
  const p = fromFen(fen);
  if ([...(p.used ?? []), ...(p.waiting ?? []), ...(p.lost ?? [])].some(n => !integer(n) || n > 10000) || p.marks?.some(m => m && (!integer(m.sq) || m.sq > 63 || m.left !== undefined && (!integer(m.left) || m.left > 2))) || p.haste !== undefined && (!integer(p.haste) || p.haste > 63)) throw new Error('Malformed power state');
  if (!integer(p.halfmove) || !integer(p.ply) || !integer(moveNumber(p)) || toFen(p) !== fen) throw new Error('Noncanonical FEN');
  return p;
}
function create(input: unknown): void {
  const s = object(input, ['backRank', 'fen', 'preset', 'kings']) as MatchSetup;
  if (s.backRank !== undefined && (typeof s.backRank !== 'string' || !/^[PNBRQKALGMSOCVT]{8}$/.test(s.backRank)) || s.fen !== undefined && s.backRank !== undefined || s.preset !== undefined && !['current', '2017', '2021'].includes(s.preset)) throw new Error('Malformed setup');
  if (s.kings !== undefined && (typeof s.kings !== 'string' || s.kings.length > 100 || s.kings.split(',').length !== 2 || s.kings.split(',').some(x => x !== 'none' && !parseKings(`${x},none`)[0]))) throw new Error('Malformed kings');
  const kings = s.kings !== undefined ? parseKings(s.kings) : undefined;
  const preset = s.preset === '2017' ? RULES_2017 : s.preset === '2021' ? RULES_2021 : undefined;
  // Same precedence as website main.ts: current powers, older preset, explicit king choices.
  setRules(structuredClone({ ...(kings?.some(Boolean) ? POWERS_BALANCED : {}), ...preset, ...(kings ? { kings } : {}) }));
  if (RULES.hands.some(h => h.length) || RULES.piles.some(h => h.length)) throw new Error('Private card data unsupported');
  game = new Game(s.backRank ?? 'RNBQKBNR');
  if (s.fen !== undefined) game.load(position(s.fen));
  saved = { schema: 'kingdown-local-match/1', engine, setup: structuredClone(s), initialFen: toFen(game.pos), rules: structuredClone(RULES), revision: 0, commands: [] };
}
function snapshot(): MatchSnapshot {
  if (!game || !initialized) throw new Error('Match not initialized');
  const { hands: _hands, piles: _piles, ...rules } = RULES;
  const moves = game.status === 'playing' ? game.legal.map(move => ({ lan: toLan(game!.pos, move), move })) : [];
  return { rules: structuredClone(rules), moves: structuredClone(moves), revision: saved.revision, fen: toFen(game.pos), ply: game.pos.ply, turn: game.pos.turn, moveNumber: moveNumber(game.pos), status: game.status, inCheck: game.inCheck, legal: moves.map(m => m.lan), history: game.history.map(h => h.lan) };
}
function chooseMove(input: unknown): string {
  if (!game || !initialized) throw new Error('Match not initialized');
  if (game!.status !== 'playing') throw new Error('Match terminal');
  const options = object(input, ['maxTimeMs', 'maxDepth']);
  const timeMs = options.maxTimeMs === undefined ? 250 : options.maxTimeMs, maxDepth = options.maxDepth === undefined ? 4 : options.maxDepth;
  if (!integer(timeMs) || timeMs < 1 || timeMs > 5000 || !integer(maxDepth) || maxDepth < 1 || maxDepth > 8) throw new Error('Malformed search bounds');
  resetSearchState();
  const result = search(game!.pos, { timeMs, maxDepth, history: game!.history.map(h => positionKey(h.pos)) });
  if (!result.move) throw new Error('Search returned no move');
  const lan = toLan(game!.pos, result.move);
  if (game!.legal.filter(m => toLan(game!.pos, m) === lan).length !== 1) throw new Error('Search returned illegal or ambiguous move');
  return lan;
}
function command(input: unknown): MoveCommand {
  const c = object(input, ['id', 'expectedRevision', 'lan']);
  if (typeof c.id !== 'string' || !c.id.length || c.id.length > 200 || typeof c.lan !== 'string' || !c.lan.length || c.lan.length > 1024 || !integer(c.expectedRevision)) throw new Error('Malformed command');
  return c as MoveCommand;
}
function apply(input: unknown): MatchSnapshot {
  if (!game || !initialized) throw new Error('Match not initialized');
  const c = command(input), previous = saved.commands.find(x => x.id === c.id);
  if (previous) {
    if (previous.lan !== c.lan || previous.expectedRevision !== c.expectedRevision) throw new Error('Command ID conflict');
    return snapshot();
  }
  if (c.expectedRevision !== saved.revision) throw new Error('Stale revision');
  if (game.status !== 'playing') throw new Error('Match terminal');
  if (saved.commands.length >= MAX_COMMANDS) throw new Error('Match history limit reached');
  const moves = game.legal.filter(m => toLan(game!.pos, m) === c.lan);
  if (moves.length !== 1) throw new Error('Illegal or ambiguous move');
  game.play(moves[0]); saved.revision++;
  saved.commands.push({ ...c, fen: toFen(game.pos), ply: game.pos.ply, status: game.status });
  return snapshot();
}
function load(input: unknown): void {
  if (typeof input !== 'string' || input.length > MAX_SAVE_LENGTH) throw new Error('Malformed save');
  const s = object(JSON.parse(input), ['schema', 'engine', 'setup', 'initialFen', 'rules', 'revision', 'commands']);
  if (s.schema !== 'kingdown-local-match/1' || s.engine !== engine) throw Object.assign(new Error('Incompatible save'), { code: 'MATCH_INCOMPATIBLE' });
  if (!integer(s.revision) || !Array.isArray(s.commands) || s.commands.length > MAX_COMMANDS || s.commands.length !== s.revision) throw new Error('Malformed history');
  create(s.setup);
  if (s.initialFen !== saved.initialFen || JSON.stringify(s.rules) !== JSON.stringify(saved.rules)) throw new Error('Incompatible setup or rules');
  initialized = true;
  for (const raw of s.commands) {
    const r = object(raw, ['id', 'expectedRevision', 'lan', 'fen', 'ply', 'status']);
    if (r.expectedRevision !== saved.revision) throw new Error('Invalid replay revision');
    const before = saved.revision;
    const state = apply({ id: r.id, expectedRevision: r.expectedRevision, lan: r.lan });
    if (saved.revision !== before + 1 || state.fen !== r.fen || state.ply !== r.ply || state.status !== r.status) throw new Error('Invalid replay');
  }
}
parentPort!.on('message', ({ id, op, input }) => {
  const wasInitialized = initialized;
  try {
    if (initializationFailed) throw new Error('Match initialization failed');
    if ((op === 'create' || op === 'load') && game) throw new Error('Already initialized');
    let value: unknown;
    switch (op) { case 'create': create(input); break; case 'load': load(input); break; case 'snapshot': value = snapshot(); break; case 'chooseMove': value = chooseMove(input); break; case 'apply': value = apply(input); break; case 'save': snapshot(); value = JSON.stringify(saved); break; default: throw new Error('Unknown operation'); }
    if (op === 'create' || op === 'load') initialized = true;
    parentPort!.postMessage({ id, value });
  } catch (e) { if ((op === 'create' || op === 'load') && !wasInitialized) { initializationFailed = true; initialized = false; game = undefined; } parentPort!.postMessage({ id, error: (e as Error).message, code: (e as { code?: string }).code }); }
});
