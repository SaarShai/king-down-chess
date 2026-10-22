/** Game state (no rendering) and the AI worker wrapper. */
import type { Color, Move, Position, Status } from './rules/engine';
import { DEFAULT_RULES, type Rules } from './rules/rules';
import type { SearchOptions, SearchResult } from './ai/search';
import { GameRules } from './game-rules';

export type Side = 'human' | 'ai';

/**
 * The side that Resign gives up on this device: its own side in a game link, the person's side
 * against the computer, else (two people on one device) the side to move. Null when no person plays.
 */
export function resigningSide(sides: readonly [Side, Side], turn: Color, linkSide: Color | null): Color | null {
  if (linkSide != null) return linkSide;
  if (sides[0] === sides[1]) return sides[0] === 'human' ? turn : null;
  return sides[0] === 'human' ? 0 : 1;
}

export class Game {
  private owned: GameRules;
  private lifetime = {};
  get context(): GameRules { return this.owned; }
  get rules(): Rules { return this.owned.rules; }
  get identity(): object { return this.lifetime; }
  pos!: Position;
  backRank = '';
  history: { pos: Position; move: Move; lan: string }[] = [];
  status: Status = 'playing';
  private cache: Move[] | null = null;
  /** Occurrences per position (board + side to move) for threefold repetition. */
  private seen = new Map<number, number>();

  constructor(backRank?: string, rules: Partial<Rules> = DEFAULT_RULES) {
    this.owned = new GameRules(rules);
    this.newGame(backRank);
  }

  newGame(backRank?: string, rules?: Partial<Rules>): void {
    const context = rules ? new GameRules(rules) : this.owned;
    const army = backRank ?? context.randomBackRank();
    const pos = context.startPosition(army);
    this.owned = context;
    this.lifetime = {};
    this.backRank = army;
    this.pos = pos;
    this.history = [];
    this.seen.clear();
    this.cache = null;
    this.update();
  }

  /** Start from an arbitrary position (FEN via ?fen=… for testing and sharing). */
  load(pos: Position): void {
    this.lifetime = {};
    this.backRank = '';
    this.pos = pos;
    this.history = [];
    this.seen.clear();
    this.cache = null;
    this.update();
  }

  /** Board + side to move; the repetition key. */
  private key(): number { return this.context.positionKey(this.pos); }

  /** Count the current position, then set `status`; a position met 3 times is a repetition draw. */
  private update(): void {
    this.seen.set(this.key(), (this.seen.get(this.key()) ?? 0) + 1);
    this.setStatus();
  }

  private setStatus(): void {
    const s = this.context.status(this.pos);
    this.status = s === 'playing' && this.rules.threefold && (this.seen.get(this.key()) ?? 1) >= 3 ? 'drawRepetition' : s;
  }

  /** The board after a recorded ply, including the last position. */
  positionAfter(ply: number): Position { return ply === this.history.length ? this.pos : this.history[ply].pos; }

  get legal(): Move[] { return (this.cache ??= this.context.legalMoves(this.pos)); }
  get inCheck(): boolean { return this.context.inCheck(this.pos); }

  play(m: Move): void {
    this.history.push({ pos: this.pos, move: m, lan: this.context.toLan(this.pos, m) });
    this.pos = this.context.makeMove(this.pos, m);
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
      const m = this.legal.find(x => this.context.toLan(this.pos, x) === lan);
      if (!m) break;
      this.play(m);
      n++;
    }
    return n;
  }
}

export class Engine {
  private worker: Worker | null = null;
  private owner: object | null = null;
  private id = 0;
  private clean: (() => void) | undefined;

  /** Returns null where workers cannot start (e.g. a sandbox); the search then runs on the main thread. */
  private spawn(): Worker | null {
    try {
      const w = new Worker(new URL('./ai/worker.ts', import.meta.url), { type: 'module' });
      w.onerror = () => { if (this.worker === w) this.worker = null; w.terminate(); };
      return w;
    } catch { return null; }
  }

  /** Resolves only while this search is still the current one; a cancelled search never answers. */
  think(game: Game, opts: Omit<SearchOptions, 'rng'>, position = game.pos): Promise<SearchResult> {
    if ('rng' in opts && opts.rng !== undefined) throw new Error('Game search does not accept callbacks');
    this.clean?.();
    if (this.owner !== game.identity) {
      this.worker?.terminate();
      this.worker = this.spawn();
      this.owner = game.identity;
    }
    // A later load or preview cannot change an already requested search.
    const owner = game.identity, context = game.context;
    const pos = structuredClone(position), options = {
      ...opts,
      ...(opts.history && { history: opts.history.slice() }),
      ...(opts.rootMoves && { rootMoves: structuredClone(opts.rootMoves) }),
    };
    const id = ++this.id;
    const worker = this.worker;
    const live = (): boolean => id === this.id && game.identity === owner;
    const inline = (resolve: (result: SearchResult) => void, reject: (error: unknown) => void): void => {
      // The adopted Q6 residual net, as in the worker (src/ai/worker.ts). It loads with the search, not the page.
      import('./ai/search').then(({ searchOwned, setEvaluator }) => {
        if (!live()) return;
        setEvaluator('residual');
        resolve(searchOwned(owner, context.rules, pos, options));
      }).catch(error => { if (live()) reject(error); });
    };
    if (!worker) return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.clean = undefined; if (live()) inline(resolve, reject); }, 30);
      this.clean = () => clearTimeout(timer);
    });
    return new Promise((resolve, reject) => {
      const onMessage = (e: MessageEvent<SearchResult & { id: number }>) => {
        if (e.data.id !== id) return;
        this.clean?.(); this.clean = undefined;
        if (live()) {
          const { id: _id, ...result } = e.data;
          resolve(result);
        }
      };
      // No reply well past the time budget: assume the worker is dead and search inline from now on.
      // `live()` first: after a cancel() this timer belongs to a terminated worker, and nulling
      // `this.worker` would kill the replacement and push every later search onto the main thread.
      const fallback = setTimeout(() => {
        worker.removeEventListener('message', onMessage);
        if (!live()) return;
        worker.terminate();
        this.worker = null;
        this.clean = undefined;
        inline(resolve, reject);
      }, (options.timeMs ?? 1000) + 2500);
      this.clean = () => { clearTimeout(fallback); worker.removeEventListener('message', onMessage); };
      worker.addEventListener('message', onMessage);
      worker.postMessage({ id, pos, opts: options, rules: context.rules });
    });
  }

  /** Abort a running search (its promise never resolves; the id bump is what silences it). */
  cancel(): void {
    this.clean?.(); this.clean = undefined;
    this.worker?.terminate(); this.worker = null; this.owner = null; this.id++;
  }
}
