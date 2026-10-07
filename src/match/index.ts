/** Node-only local matches. Each live match owns one isolated engine worker. */
import { Worker as NodeWorker } from 'node:worker_threads';
import { tsWorker } from '../sim/ts-worker';
import type { Rules } from '../rules/rules';
import type { Move, Status } from '../rules/engine';
export interface MatchSetup { backRank?: string; fen?: string; preset?: 'current' | '2017' | '2021'; kings?: string }
export interface MoveCommand { id: string; expectedRevision: number; lan: string }
export type PublicMatchRules = Omit<Rules, 'hands' | 'piles' | 'cardPool'>;
export interface ChooseMoveOptions { maxTimeMs?: number; maxDepth?: number }
declare const __KINGDOWN_COMPILED__: boolean;
export interface MatchSnapshot { rules: PublicMatchRules; moves: { lan: string; move: Move }[]; revision: number; fen: string; ply: number; turn: 0 | 1; moveNumber: number; status: Status; inCheck: boolean; legal: string[]; history: string[] }
export interface MatchSave { schema: 'kingdown-local-match/1'; engine: string; setup: MatchSetup; initialFen: string; rules: Rules; revision: number; commands: (MoveCommand & { fen: string; ply: number; status: Status })[] }
export class LocalMatch {
  private worker = typeof __KINGDOWN_COMPILED__ !== 'undefined' && __KINGDOWN_COMPILED__
    ? new NodeWorker(new URL('./worker.mjs', import.meta.url))
    : tsWorker(new URL('./worker.ts', import.meta.url));
  private next = 0;
  private closed = false;
  private pending = new Map<number, { resolve: (v: any) => void; reject: (e: Error) => void; timer: ReturnType<typeof setTimeout> }>();
  constructor() {
    this.worker.on('message', ({ id, value, error }) => {
      const p = this.pending.get(id); if (!p) return;
      clearTimeout(p.timer); this.pending.delete(id);
      if (error) p.reject(new Error(error)); else p.resolve(value);
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
  async initialize(input: unknown, load = false): Promise<void> { await this.call(load ? 'load' : 'create', input); }
  snapshot(): Promise<MatchSnapshot> { return this.call('snapshot'); }
  apply(command: MoveCommand): Promise<MatchSnapshot> { return this.call('apply', command); }
  chooseMove(options: ChooseMoveOptions = {}): Promise<string> { return this.call('chooseMove', options); }
  exportSave(): Promise<string> { return this.call('save'); }
  async close(): Promise<void> { this.fail(new Error('Match closed')); await this.worker.terminate(); }
}
export async function createMatch(setup: MatchSetup = {}): Promise<LocalMatch> {
  const match = new LocalMatch(); try { await match.initialize(setup); return match; } catch (e) { await match.close(); throw e; }
}
export async function loadMatch(save: string): Promise<LocalMatch> {
  const match = new LocalMatch(); try { await match.initialize(save, true); return match; } catch (e) { await match.close(); throw e; }
}
