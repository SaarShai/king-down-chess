/** Node-only local matches. Each live match owns one isolated engine worker. */
import { Worker as NodeWorker } from 'node:worker_threads';
import { existsSync } from 'node:fs';
import { tsWorker } from '../sim/ts-worker';
import type { CardName, Rules } from '../rules/rules';
import type { SkillName } from '../ai/skill';
import type { Move, Status } from '../rules/engine';
/** `classic`: chess castling and en passant (`Rules.classicChess`). `hand`: a public mirror deal, the same cards for both sides. */
export interface MatchSetup { backRank?: string; fen?: string; preset?: 'current' | '2017' | '2021'; kings?: string; classic?: boolean; hand?: CardName[] }
export interface MoveCommand { id: string; expectedRevision: number; lan: string }
export type PublicMatchRules = Omit<Rules, 'piles' | 'cardPool'>;
/** `level`: the website's skill settings (`skillPlan`); `maxTimeMs` then shortens its time cap. Old engines keep their built-in strength. */
export interface ChooseMoveOptions { level?: SkillName; maxTimeMs?: number; maxDepth?: number }
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
export class LocalMatch {
  private worker: NodeWorker;
  private next = 0;
  private closed = false;
  private supportsLevels = true;
  private pending = new Map<number, { resolve: (v: any) => void; reject: (e: Error) => void; timer: ReturnType<typeof setTimeout> }>();
  /** Without `engine` (an archived bundle) the match runs the current engine. */
  constructor(engine?: URL) {
    this.worker = engine ? new NodeWorker(engine) : compiled ? new NodeWorker(new URL('./worker.mjs', import.meta.url)) : tsWorker(new URL('./worker.ts', import.meta.url));
    this.worker.on('message', ({ id, value, error, code }) => {
      const p = this.pending.get(id); if (!p) return;
      clearTimeout(p.timer); this.pending.delete(id);
      if (error) p.reject(new MatchError(error, code));
      else {
        if (value?.rules) {
          // The two engines before public hands also reject level options.
          this.supportsLevels = value.rules.hands !== undefined;
          value.rules.hands ??= [[], []];
        }
        p.resolve(value);
      }
    });
    this.worker.on('error', e => this.fail(e instanceof Error ? e : new Error(String(e))));
    this.worker.on('exit', code => this.fail(new Error(`Match worker exited (${code})`)));
  }
  private fail(error: Error): void {
    this.closed = true;
    for (const p of this.pending.values()) { clearTimeout(p.timer); p.reject(error); }
    this.pending.clear();
    void this.worker.terminate();
  }
  private call<T>(op: string, input?: unknown): Promise<T> {
    if (this.closed) return Promise.reject(new Error('Match closed'));
    const id = ++this.next;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => this.fail(new Error('Match worker timed out')), 15000);
      this.pending.set(id, { resolve, reject, timer });
      try { this.worker.postMessage({ id, op, input }); } catch (e) { this.fail(e as Error); }
    });
  }
  async initialize(input: unknown, load = false): Promise<void> {
    await this.call(load ? 'load' : 'create', input);
    await this.call('snapshot');
  }
  snapshot(): Promise<MatchSnapshot> { return this.call('snapshot'); }
  apply(command: MoveCommand): Promise<MatchSnapshot> { return this.call('apply', command); }
  async chooseMove(options: ChooseMoveOptions = {}): Promise<string> {
    if (!this.supportsLevels && options.level !== undefined) {
      if (!['beginner', 'casual', 'club', 'strong'].includes(options.level)) throw new Error('Malformed level');
      const { level: _level, ...bounds } = options;
      return this.call('chooseMove', bounds);
    }
    return this.call('chooseMove', options);
  }
  exportSave(): Promise<string> { return this.call('save'); }
  async close(): Promise<void> { this.fail(new Error('Match closed')); await this.worker.terminate(); }
}
export async function createMatch(setup: MatchSetup = {}): Promise<LocalMatch> {
  const match = new LocalMatch(); try { await match.initialize(setup); return match; } catch (e) { await match.close(); throw e; }
}
/** An unknown fingerprint falls to the current engine, which refuses it with MATCH_INCOMPATIBLE. */
export async function loadMatch(save: string): Promise<LocalMatch> {
  const match = new LocalMatch(archivedEngine(save)); try { await match.initialize(save, true); return match; } catch (e) { await match.close(); throw e; }
}
