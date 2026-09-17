/** Game state (no rendering) and the AI worker wrapper. */
import { Move, Position, Status, inCheck, legalMoves, makeMove, status } from './rules/engine';
import { randomBackRank, startPosition, toFen, toLan } from './rules/setup';
import { SearchOptions, SearchResult, search } from './ai/search';

export type Side = 'human' | 'ai';

export class Game {
  pos!: Position;
  backRank = '';
  history: { pos: Position; move: Move; lan: string }[] = [];
  status: Status = 'playing';
  private cache: Move[] | null = null;
  /** Occurrences per position (board + side to move) for threefold repetition. */
  private seen = new Map<string, number>();

  constructor(backRank?: string) { this.newGame(backRank); }

  newGame(backRank: string = randomBackRank()): void {
    this.backRank = backRank;
    this.pos = startPosition(backRank);
    this.history = [];
    this.seen.clear();
    this.cache = null;
    this.update();
  }

  /** Start from an arbitrary position (FEN via ?fen=… for testing and sharing). */
  load(pos: Position): void {
    this.backRank = '';
    this.pos = pos;
    this.history = [];
    this.seen.clear();
    this.cache = null;
    this.update();
  }

  /** Board + side to move; the repetition key. */
  private key(): string { return toFen(this.pos).split(' ', 2).join(' '); }

  /** Count the current position, then set `status`; a position met 3 times is a repetition draw. */
  private update(): void {
    this.seen.set(this.key(), (this.seen.get(this.key()) ?? 0) + 1);
    this.setStatus();
  }

  private setStatus(): void {
    const s = status(this.pos);
    this.status = s === 'playing' && (this.seen.get(this.key()) ?? 1) >= 3 ? 'drawRepetition' : s;
  }

  get legal(): Move[] { return (this.cache ??= legalMoves(this.pos)); }
  get inCheck(): boolean { return inCheck(this.pos); }

  play(m: Move): void {
    this.history.push({ pos: this.pos, move: m, lan: toLan(this.pos, m) });
    this.pos = makeMove(this.pos, m);
    this.cache = null;
    this.update();
  }

  /** Take back one ply. `history` keeps the position before each move, so no replay is needed. */
  undo(): boolean {
    const last = this.history.pop();
    if (!last) return false;
    const n = (this.seen.get(this.key()) ?? 1) - 1;
    if (n > 0) this.seen.set(this.key(), n); else this.seen.delete(this.key());
    this.pos = last.pos;
    this.cache = null;
    this.setStatus();
    return true;
  }

  /** Replay long-algebraic moves (autosave restore). Stops at the first move that is not legal now. */
  playLan(lans: readonly string[]): number {
    let n = 0;
    for (const lan of lans) {
      const m = this.legal.find(x => toLan(this.pos, x) === lan);
      if (!m) break;
      this.play(m);
      n++;
    }
    return n;
  }
}

export class Engine {
  private worker: Worker | null = this.spawn();
  private id = 0;

  /** Returns null where workers cannot start (e.g. a sandbox); the search then runs on the main thread. */
  private spawn(): Worker | null {
    try {
      const w = new Worker(new URL('./ai/worker.ts', import.meta.url), { type: 'module' });
      w.onerror = () => { this.worker = null; };
      return w;
    } catch { return null; }
  }

  /** Resolves only while this search is still the current one; a cancelled search never answers. */
  think(pos: Position, opts: SearchOptions): Promise<SearchResult> {
    const id = ++this.id;
    const worker = this.worker;
    const live = (): boolean => id === this.id;
    if (!worker) return new Promise(resolve => setTimeout(() => { if (live()) resolve(search(pos, opts)); }, 30));
    return new Promise(resolve => {
      const onMessage = (e: MessageEvent<SearchResult & { id: number }>) => {
        if (e.data.id !== id) return;
        clearTimeout(fallback);
        worker.removeEventListener('message', onMessage);
        if (live()) resolve(e.data);
      };
      // No reply well past the time budget: assume the worker is dead and search inline from now on.
      // `live()` first: after a cancel() this timer belongs to a terminated worker, and nulling
      // `this.worker` would kill the replacement and push every later search onto the main thread.
      const fallback = setTimeout(() => {
        worker.removeEventListener('message', onMessage);
        if (!live()) return;
        this.worker = null;
        resolve(search(pos, opts));
      }, (opts.timeMs ?? 1000) + 2500);
      worker.addEventListener('message', onMessage);
      worker.postMessage({ id, pos, opts });
    });
  }

  /** Abort a running search (its promise never resolves; the id bump is what silences it). */
  cancel(): void { this.worker?.terminate(); this.worker = this.spawn(); this.id++; }
}
