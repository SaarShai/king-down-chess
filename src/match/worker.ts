import { parentPort } from 'node:worker_threads';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Game } from '../game';
import { ALL_CARDS, RULES_2017, RULES_2021, POWERS_BALANCED, RULES, parseKings, setRules } from '../rules/rules';
import { fromFen, toFen, toLan } from '../rules/setup';
import { HAND_MAX, moveNumber, type Position } from '../rules/engine';
import { positionKey, resetSearchState, search } from '../ai/search';
import { skillPlan, type SkillName } from '../ai/skill';
import type { MatchSave, MatchSetup, MatchSnapshot, MoveCommand } from './index';

declare const __KINGDOWN_ENGINE__: string;
// Conservative development compatibility: every engine/search source change invalidates replay.
const hash = createHash('sha256');
function hashTree(url: URL): void {
  for (const entry of readdirSync(url, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const child = new URL(entry.name + (entry.isDirectory() ? '/' : ''), url);
    if (entry.isDirectory()) hashTree(child);
    else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')) { hash.update(fileURLToPath(child).split('/src/')[1]); hash.update(readFileSync(child)); }
  }
}
// The build stamps the hash of this bundle instead (tools/plugin-runtime-build.mjs, G2).
if (typeof __KINGDOWN_ENGINE__ === 'undefined') {
  hash.update(readFileSync(new URL('../game.ts', import.meta.url)));
  hash.update(readFileSync(new URL('./worker.ts', import.meta.url)));
  // The workshop holds the design rule's checks (`RULES.design`, src/rules/rules.ts imports its model).
  hashTree(new URL('../rules/', import.meta.url)); hashTree(new URL('../ai/', import.meta.url)); hashTree(new URL('../workshop/', import.meta.url));
}
const engine = typeof __KINGDOWN_ENGINE__ !== 'undefined' ? __KINGDOWN_ENGINE__ : `sha256:${hash.digest('hex')}`;
// Bounds keep every accepted match export within the JSON load limit.
const MAX_COMMANDS = 1000, MAX_SAVE_LENGTH = 8_000_000;
const LEVELS: readonly SkillName[] = ['beginner', 'casual', 'club', 'strong'];
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
  if (fields.length < 6 || fields.length > 7 || !['w', 'b'].includes(fields[1]) || !(RULES.classicChess ? /^(-|K?Q?k?q?)$/.test(fields[2]) && /^(-|[a-h][36])$/.test(fields[3]) : fields[2] === '-' && fields[3] === '-') || !/^\d+$/.test(fields[4]) || !/^[1-9]\d*$/.test(fields[5]) || rows.length !== 8 || rows.some(r => !/^[1-8PNBRQKALGMSOCVTHpnbrqkalgmsocvth]+$/.test(r) || [...r].reduce((n, c) => n + (/\d/.test(c) ? +c : 1), 0) !== 8) || (fields[0].match(/K/g) ?? []).length !== 1 || (fields[0].match(/k/g) ?? []).length !== 1) throw new Error('Malformed FEN');
  if (fields[6] && fields[6].split('/').some(t => !/^(u\d+\.\d+|m[a-h][1-8][wb]\d*|f|h[a-h][1-8]|l[PNBRQKALGMSOCVTpnbrqkalgmsocvt]*|g\d+\.\d+)$/.test(t))) throw new Error('Unsupported or malformed power state');
  const p = fromFen(fen);
  if ([...(p.used ?? []), ...(p.waiting ?? []), ...(p.lost ?? [])].some(n => !integer(n) || n > 10000) || p.marks?.some(m => m && (!integer(m.sq) || m.sq > 63 || m.left !== undefined && (!integer(m.left) || m.left > 2))) || p.haste !== undefined && (!integer(p.haste) || p.haste > 63)) throw new Error('Malformed power state');
  if (!integer(p.halfmove) || !integer(p.ply) || !integer(moveNumber(p)) || toFen(p) !== fen) throw new Error('Noncanonical FEN');
  return p;
}
function create(input: unknown): void {
  const s = object(input, ['backRank', 'fen', 'preset', 'kings', 'classic', 'hand']) as MatchSetup;
  if (s.backRank !== undefined && (typeof s.backRank !== 'string' || !/^[PNBRQKALGMSOCVT]{8}$/.test(s.backRank)) || s.fen !== undefined && s.backRank !== undefined || s.preset !== undefined && !['current', '2017', '2021'].includes(s.preset) || s.classic !== undefined && typeof s.classic !== 'boolean') throw new Error('Malformed setup');
  if (s.hand !== undefined && (!Array.isArray(s.hand) || s.hand.length > HAND_MAX || new Set(s.hand).size !== s.hand.length || s.hand.some(c => !ALL_CARDS.includes(c)))) throw new Error('Malformed hand');
  if (s.kings !== undefined && (typeof s.kings !== 'string' || s.kings.length > 100 || s.kings.split(',').length !== 2 || s.kings.split(',').some(x => x !== 'none' && !parseKings(`${x},none`)[0]))) throw new Error('Malformed kings');
  const kings = s.kings !== undefined ? parseKings(s.kings) : undefined;
  const preset = s.preset === '2017' ? RULES_2017 : s.preset === '2021' ? RULES_2021 : undefined;
  // Same precedence as website main.ts: current powers, older preset, explicit king choices.
  const hands = [s.hand ?? [], s.hand ?? []] as const;
  // A hand with a spendable king power is a refused rule mix (`setRules`), so it is a setup error.
  try { setRules(structuredClone({ ...(kings?.some(Boolean) ? POWERS_BALANCED : {}), ...preset, ...(kings ? { kings } : {}), ...(s.classic ? { classicChess: true } : {}), hands })); } catch (e) { throw new Error(`Malformed setup: ${(e as Error).message}`); }
  if (RULES.piles.some(h => h.length)) throw new Error('Private card data unsupported');
  game = new Game(s.backRank ?? 'RNBQKBNR');
  if (s.fen !== undefined) game.load(position(s.fen));
  saved = { schema: 'kingdown-local-match/1', engine, setup: structuredClone(s), initialFen: toFen(game.pos), rules: structuredClone(RULES), revision: 0, commands: [] };
}
function snapshot(): MatchSnapshot {
  if (!game || !initialized) throw new Error('Match not initialized');
  const { piles: _piles, ...rules } = RULES;
  const moves = game.status === 'playing' ? game.legal.map(move => ({ lan: toLan(game!.pos, move), move })) : [];
  return { rules: structuredClone(rules), moves: structuredClone(moves), revision: saved.revision, fen: toFen(game.pos), ply: game.pos.ply, turn: game.pos.turn, moveNumber: moveNumber(game.pos), status: game.status, inCheck: game.inCheck, legal: moves.map(m => m.lan), history: game.history.map(h => h.lan) };
}
function chooseMove(input: unknown): string {
  if (!game || !initialized) throw new Error('Match not initialized');
  if (game!.status !== 'playing') throw new Error('Match terminal');
  const options = object(input, ['level', 'maxTimeMs', 'maxDepth']), level = options.level as SkillName | undefined;
  if (level !== undefined && !LEVELS.includes(level)) throw new Error('Malformed level');
  // A level has no depth cap, as on the website; its time cap bounds the search.
  let timeMs = options.maxTimeMs === undefined ? 250 : options.maxTimeMs;
  const maxDepth = options.maxDepth === undefined ? (level ? undefined : 4) : options.maxDepth;
  if (!integer(timeMs) || timeMs < 1 || timeMs > 5000 || maxDepth !== undefined && (!integer(maxDepth) || maxDepth < 1 || maxDepth > 8)) throw new Error('Malformed search bounds');
  const plan = level && skillPlan(level, game.history.length);
  if (plan) timeMs = Math.min(options.maxTimeMs ?? plan.timeMs, plan.timeMs);
  const legal = game.legal;
  resetSearchState();
  const result = search(game.pos, { timeMs, maxDepth, temperature: plan ? plan.temperature : undefined, history: game.history.map(h => positionKey(h.pos)) });
  const move = plan && plan.blunder > 0 && Math.random() < plan.blunder ? legal[Math.floor(Math.random() * legal.length)] : result.move;
  if (!move) throw new Error('Search returned no move');
  const lan = toLan(game!.pos, move);
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
