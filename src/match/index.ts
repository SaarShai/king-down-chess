/** Node-only local matches. Each live match owns its engine and lazy search worker. */
import { Worker as NodeWorker } from 'node:worker_threads';
import { existsSync } from 'node:fs';
import { tsWorker } from '../sim/ts-worker';
import { DEFAULT_RULES, type CardName, type Rules } from '../rules/rules';
import type { SkillName } from '../ai/skill';
import type { Move, Position, Status } from '../rules/engine';
/** `classic`: chess castling and en passant (`Rules.classicChess`). `hand`: a public mirror deal, the same cards for both sides. */
export interface MatchSetup { backRank?: string; fen?: string; preset?: 'current' | '2017' | '2021'; kings?: string; classic?: boolean; hand?: CardName[] }
export interface MoveCommand { id: string; expectedRevision: number; lan: string }
export type PublicMatchRules = Omit<Rules, 'piles' | 'cardPool'>;
/** `level`: the website's skill settings (`skillPlan`); `maxTimeMs` then shortens its time cap. Old engines keep their built-in strength. */
export interface ChooseMoveOptions { level?: SkillName; maxTimeMs?: number; maxDepth?: number }
/** Private Node worker transport, never a save or account projection. */
export interface RuntimeSearch {
  kind: 'runtime-search'; engine: string; revision: number; rules: Rules; pos: Position;
  history: number[]; ply: number; legal: string[]; options: ChooseMoveOptions;
}
export class MatchError extends Error { constructor(message: string, public code?: 'MATCH_INCOMPATIBLE') { super(message); } }
declare const __KINGDOWN_COMPILED__: boolean;
export interface MatchSnapshot { rules: PublicMatchRules; moves: { lan: string; move: Move }[]; revision: number; fen: string; ply: number; turn: 0 | 1; moveNumber: number; status: Status; inCheck: boolean; legal: string[]; history: string[] }
export interface MatchSave { schema: 'kingdown-local-match/1'; engine: string; setup: MatchSetup; initialFen: string; rules: Rules; revision: number; commands: (MoveCommand & { fen: string; ply: number; status: Status })[] }
const compiled = typeof __KINGDOWN_COMPILED__ !== 'undefined' && __KINGDOWN_COMPILED__;
/** Released engine bundles, `<hex>.mjs` (G2): a save runs on the bundle of its fingerprint. */
const engines = compiled ? new URL('./engines/', import.meta.url) : new URL('../../engines/', import.meta.url);
function archivedEngine(save: unknown): URL | undefined {
  if (typeof save !== 'string' || save.length > 8_000_000) return;
  let engine: unknown; try { engine = JSON.parse(save)?.engine; } catch { return; }
  const hex = typeof engine === 'string' ? /^sha256:([a-f0-9]{64})$/.exec(engine)?.[1] : undefined;
  const url = hex ? new URL(`${hex}.mjs`, engines) : undefined;
  return url && existsSync(url) ? url : undefined;
}
function searchContext(value: unknown): RuntimeSearch {
  const v = value as RuntimeSearch | undefined;
  const count = (n: unknown, max = Number.MAX_SAFE_INTEGER): n is number => Number.isSafeInteger(n) && (n as number) >= 0 && (n as number) <= max;
  const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
  if (!object(v) || Object.keys(v).some(k => !['kind', 'engine', 'revision', 'rules', 'pos', 'history', 'ply', 'legal', 'options'].includes(k)) ||
    v.kind !== 'runtime-search' || typeof v.engine !== 'string' || !/^sha256:[a-f0-9]{64}$/.test(v.engine) || !count(v.revision, 1000) ||
    !object(v.rules) || Object.keys(v.rules).length !== Object.keys(DEFAULT_RULES).length || !Object.keys(DEFAULT_RULES).every(k => Object.hasOwn(v.rules, k)) || !object(v.pos) || !(v.pos.board instanceof Uint8Array) || v.pos.board.length !== 64 || ![0, 1].includes(v.pos.turn) ||
    !count(v.pos.ply) || !count(v.pos.halfmove) || !count(v.ply, 1000) || !Array.isArray(v.history) || v.history.length !== v.ply || !v.history.every(n => count(n)) ||
    !Array.isArray(v.legal) || !v.legal.length || !v.legal.every(lan => typeof lan === 'string' && lan.length > 0 && lan.length <= 1024) ||
    !object(v.options) || Object.keys(v.options).some(k => !['level', 'maxTimeMs', 'maxDepth'].includes(k)) ||
    v.options.level !== undefined && (typeof v.options.level !== 'string' || !['beginner', 'casual', 'club', 'strong'].includes(v.options.level)) ||
    v.options.maxTimeMs !== undefined && (!count(v.options.maxTimeMs, 5000) || v.options.maxTimeMs < 1) ||
    v.options.maxDepth !== undefined && (!count(v.options.maxDepth, 8) || v.options.maxDepth < 1)) throw new MatchError('Malformed runtime search context');
  return v;
}
export class LocalMatch {
  private worker: NodeWorker;
  private searchWorker?: NodeWorker;
  private next = 0;
  private closed = false;
  private supportsLevels = true;
  private pending = new Map<number, { op: string; worker: NodeWorker; resolve: (v: any) => void; reject: (e: Error) => void; timer: ReturnType<typeof setTimeout> }>();
  /** Without `engine` (an archived bundle) the match runs the current engine. */
  constructor(engine?: URL) {
    this.worker = this.watch(engine ? new NodeWorker(engine) : compiled ? new NodeWorker(new URL('./worker.mjs', import.meta.url)) : tsWorker(new URL('./worker.ts', import.meta.url)), 'Match');
  }
  private watch(worker: NodeWorker, name: string): NodeWorker {
    worker.on('message', ({ id, value, error, code }) => {
      const p = this.pending.get(id); if (!p || p.worker !== worker) return;
      clearTimeout(p.timer); this.pending.delete(id);
      if (error) p.reject(new MatchError(error, code));
      else {
        if (worker === this.worker && (p.op === 'snapshot' || p.op === 'apply') && value?.rules) {
          // The two engines before public hands also reject level options.
          this.supportsLevels = value.rules.hands !== undefined;
          value.rules.hands ??= [[], []];
        }
        p.resolve(value);
      }
    });
    worker.on('error', e => this.fail(e instanceof Error ? e : new Error(String(e))));
    worker.on('exit', code => this.fail(new Error(`${name} worker exited (${code})`)));
    return worker;
  }
  private fail(error: Error): void {
    if (this.closed) return;
    this.closed = true;
    for (const p of this.pending.values()) { clearTimeout(p.timer); p.reject(error); }
    this.pending.clear();
    void this.worker.terminate();
    void this.searchWorker?.terminate();
  }
  private call<T>(op: string, input?: unknown, worker = this.worker, deadline = performance.now() + 15000): Promise<T> {
    if (this.closed) return Promise.reject(new Error('Match closed'));
    const remaining = deadline - performance.now();
    if (remaining <= 0) { const error = new Error('Match worker timed out'); this.fail(error); return Promise.reject(error); }
    const id = ++this.next;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => this.fail(new Error('Match worker timed out')), remaining);
      this.pending.set(id, { op, worker, resolve, reject, timer });
      try { worker.postMessage({ id, op, input }); } catch (e) { this.fail(e as Error); }
    });
  }
  async initialize(input: unknown, load = false): Promise<void> {
    await this.call(load ? 'load' : 'create', input);
    await this.call('snapshot');
  }
  snapshot(): Promise<MatchSnapshot> { return this.call('snapshot'); }
  apply(command: MoveCommand): Promise<MatchSnapshot> { return this.call('apply', command); }
  async chooseMove(options: ChooseMoveOptions = {}): Promise<string> {
    const deadline = performance.now() + 15000;
    let input = options;
    if (!this.supportsLevels && options.level !== undefined) {
      if (!['beginner', 'casual', 'club', 'strong'].includes(options.level)) throw new Error('Malformed level');
      const { level: _level, ...bounds } = options;
      input = bounds;
    }
    const value = await this.call<unknown>('chooseMove', input, this.worker, deadline);
    if (typeof value === 'string') return value;
    const context = searchContext(value);
    if (this.closed) throw new Error('Match closed');
    this.searchWorker ??= this.watch(compiled ? new NodeWorker(new URL('./search-worker.mjs', import.meta.url)) : tsWorker(new URL('./search-worker.ts', import.meta.url)), 'Search');
    const lan = await this.call<unknown>('search', context, this.searchWorker, deadline);
    if (typeof lan !== 'string' || context.legal.filter(move => move === lan).length !== 1) throw new MatchError('Search returned illegal or ambiguous move');
    const current = await this.call<MatchSnapshot>('snapshot', undefined, this.worker, deadline);
    if (current.revision !== context.revision) throw new MatchError('Stale search revision');
    if (current.legal.filter(move => move === lan).length !== 1) throw new MatchError('Search returned illegal or ambiguous move');
    return lan;
  }
  exportSave(): Promise<string> { return this.call('save'); }
  async close(): Promise<void> { this.fail(new Error('Match closed')); await Promise.all([this.worker.terminate(), this.searchWorker?.terminate()]); }
}
export async function createMatch(setup: MatchSetup = {}): Promise<LocalMatch> {
  const match = new LocalMatch(); try { await match.initialize(setup); return match; } catch (e) { await match.close(); throw e; }
}
/** Finish a drawn account setup with its fixed archive; never substitute the current worker. */
export async function createPinnedMatch(setup: MatchSetup, engine: string): Promise<LocalMatch> {
  const url = archivedEngine(JSON.stringify({ engine }));
  // Source workers need no archive while their exact identity is still running. A changed identity refuses below.
  const match = new LocalMatch(url);
  try {
    await match.initialize(setup);
    if (JSON.parse(await match.exportSave()).engine !== engine) throw new MatchError('Incompatible setup engine', 'MATCH_INCOMPATIBLE');
    return match;
  } catch (e) { await match.close(); throw e; }
}
/** An unknown fingerprint falls to the current engine, which refuses it with MATCH_INCOMPATIBLE. */
export async function loadMatch(save: string): Promise<LocalMatch> {
  const match = new LocalMatch(archivedEngine(save)); try { await match.initialize(save, true); return match; } catch (e) { await match.close(); throw e; }
}
