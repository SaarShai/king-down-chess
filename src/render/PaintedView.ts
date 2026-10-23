import { StateEffects } from './effects/states';
import { drawBoardEffects } from './effects/board-effects';
import { GameRules } from '../game-rules';
import { cardPlayback, type CardPlayback } from './effects/card';
import { createScene, type KingDesign, type PaintedScene } from '../../docs/2d-first-pieces/board/scene.mjs';
import { A, B, G, K, L, LETTERS, M, N, O, P, PLAIN_KINGS, Q, R, S, T, colorOf, sqName, typeOf, type Color, type Move, type Position } from '../rules/engine';
import { figureUrl, selectedFigure } from '../workshop/figures';
import { drawMarks, type Highlights } from './marks';
import { boardInk, coordInk } from './board-ink';
import { pastTap } from './tap';

/** Animation setting: Fast plays moves at double speed, Off shows only the result. */
export type Pace = 'normal' | 'fast' | 'off';

/** What the game screen needs from a board (main.ts makes it, screen/play.ts drives it). */
export interface BoardView {
  onSquareClick: (sq: number, shift: boolean) => void;
  onDragSelect: (sq: number) => void;
  onSquareHover: (sq: number | null) => void;
  onLoadError?: (error: unknown) => void;
  /** Finish the active reply or ceremony before a skip gesture ends the scene. */
  onSkipAnimation?: () => void;
  setRules?(context: GameRules): void;
  sync(pos: Position): void;
  /** `onContact` can fire more than once, or not at all. Optional playback speed: 0.5 is half speed. */
  animateMove(pos: Position, m: Move, onContact?: () => void, speed?: number): Promise<void>;
  /** Rewind one ply; other looks may sync at once. */
  animateBack?(pre: Position, m: Move, post: Position): Promise<void>;
  setLifted?(sq: number | null): void;
  setPace(pace: Pace): void;
  /** End the running move animation now; its animateMove() resolves. No-op when nothing plays. */
  skip(): void;
  /** The beaten king on `sq` topples; it stays down while the board shows this position. */
  setFallen(sq: number | null, animate?: boolean): void;
  highlight(h: Highlights): void;
  flip(black: boolean): void;
  setLabels(on: boolean): void;
  setCoords(on: boolean): void;
  ready(): Promise<void>;
  screenOf(sq: number): { x: number; y: number };
  /** The keyboard cursor's square (null: none), previewed like the square under the pointer. */
  setPreview?(sq: number | null): void;
}

/** The king sheet a side's King is drawn with: the king it plays, Spirit (White) and Shadow (Black) without powers. */
const kingDesign = (context: GameRules, c: Color): KingDesign => (context.rules.kings[c]?.king ?? PLAIN_KINGS[c]).toLowerCase() as KingDesign;

/** Canvas pixels above the board, so tall back-rank figures are not clipped. */
const HEADROOM = 64;

/** The painted 2D look: the board trial's figures and capture animations driving the real game. */
export class PaintedView implements BoardView {
  context = new GameRules();
  setRules(context: GameRules): void { this.context = context; }
  onSquareClick: (sq: number, shift: boolean) => void = () => {};
  onDragSelect: (sq: number) => void = () => {};
  onSquareHover: (sq: number | null) => void = () => {};
  onLoadError?: (error: unknown) => void;
  onSkipAnimation?: () => void;
  canDrag = () => true;

  private canvas = document.createElement('canvas');
  private scene: PaintedScene;
  private loaded: Promise<void>;
  private disposed = false;
  private card: CardPlayback | null = null;
  private cardStates = new StateEffects();
  private skippedMark?: { after: Position; owner: Color };
  private moveSquares?: ReadonlySet<number>;
  private events = new AbortController();
  private resize: ResizeObserver;
  private pos: Position | null = null;
  private symbols?: (piece: number) => HTMLImageElement;
  private marks: Highlights = {};
  private stateEffects = new StateEffects();
  private hovered: number | null = null;
  private tap: PointerEvent | null = null;
  private tapSq: number | null = null; // the square under the press: a tap acts on it
  private dragFrom: number | null = null;
  private dragArmed = false;
  private pace: Pace = 'normal';
  /** Marker size factor: >1 on boards under 700 px, so a phone's markers stay visible. */
  private mark = 1;
  private coords = true;
  private width = 960;
  private fallen: { pos: Position; sq: number } | null = null;
  private motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  /** Keyboard cursor square, previewed like the hovered square. */
  private cursor: number | null = null;

  /**
   * options.floor: the colour round the board (default: the scene's own floor, as the plugin page draws it);
   * null leaves the canvas clear there, so the page's floor shows (the game).
   */
  constructor(private container: HTMLElement, private options: { floor?: string | null; webInk?: boolean } = {}) {
    container.classList.add('painted');
    this.canvas.width = 960; this.canvas.height = 960 + HEADROOM; // resolution 1 until the first resize
    container.appendChild(this.canvas);
    this.scene = createScene({ canvas: this.canvas, pieces: { P, N, B, R, Q, K, S, L, M, G, A, O, typeOf, colorOf, sqName, LETTERS }, headroom: HEADROOM, kings: [kingDesign(this.context, 0), kingDesign(this.context, 1)], floor: options.floor });
    this.scene.setDecorate((ctx, scene, layer, row) => this.drawMarks(ctx, scene, layer, row));
    // The game opts in to quiet-move gaits, the selected figure's idle and the framed, warm board
    // (the trial and the trailer keep the plain scene).
    const signal = this.events.signal;
    this.motionQuery.addEventListener('change', () => this.applyLively(), { signal });
    // The kings' effects redraw the board about 30 times a second: not while the tab is hidden.
    document.addEventListener('visibilitychange', () => this.applyLively(), { signal });
    this.applyLively();
    // F13: no board before the stone art is decoded; the first frame shows stone and pieces together.
    // ready() waits for that frame, so a hidden tab or off-screen frame becomes ready when it shows.
    this.canvas.style.visibility = 'hidden';
    this.loaded = this.scene.load().catch(error => { if (!this.disposed) this.onLoadError?.(error); }).then(() => new Promise<void>(resolve => {
      if (this.disposed) { resolve(); return; }
      requestAnimationFrame(() => { if (!this.disposed) this.canvas.style.visibility = ''; resolve(); });
    }));
    // Keep the square board as large as the container allows.
    this.resize = new ResizeObserver(([entry]) => {
      if (this.disposed) return;
      const box = entry.contentRect; // excludes the padding that keeps the title card clear
      const width = Math.floor(Math.min(box.width, box.height * 960 / (960 + HEADROOM)));
      this.canvas.style.width = `${width}px`;
      this.canvas.style.height = `${width * (960 + HEADROOM) / 960}px`;
      this.width = width;
      this.mark = Math.max(1, 700 / width);
      this.setCoords(this.coords);
      // Enough backing pixels for this size on this screen, in quarter steps, at most 2×.
      this.scene.setResolution(Math.min(2, Math.max(1, Math.ceil(width * devicePixelRatio / 960 * 4) / 4)));
    });
    this.resize.observe(container);
    let skippedPointer: number | null = null;
    const consume = (e: Event) => { e.preventDefault(); e.stopImmediatePropagation(); };
    document.addEventListener('pointerdown', e => {
      skippedPointer = null;
      if (e.button !== 0 || !this.canvas.getClientRects().length || !(this.scene.animating || this.scene.falling)) return;
      skippedPointer = e.pointerId;
      this.clearPointer(); this.onSkipAnimation?.(); this.skip(); consume(e);
    }, { capture: true, signal });
    document.addEventListener('pointerup', e => { if (e.pointerId === skippedPointer) consume(e); }, { capture: true, signal });
    document.addEventListener('click', e => {
      if (skippedPointer == null || e.detail === 0) return;
      skippedPointer = null; consume(e);
    }, { capture: true, signal });
    document.addEventListener('pointercancel', () => { skippedPointer = null; }, { capture: true, signal });
    this.canvas.addEventListener('pointerdown', e => this.onDown(e), { signal });
    // Keep piece drags; a touch that starts elsewhere can scroll the screen.
    this.canvas.addEventListener('touchstart', e => { if (this.dragFrom != null && this.canDrag()) e.preventDefault(); }, { passive: false, signal });
    this.canvas.addEventListener('pointermove', e => this.onMove(e), { signal });
    this.canvas.addEventListener('pointerup', e => this.onUp(e), { signal });
    this.canvas.addEventListener('pointercancel', () => this.clearPointer(), { signal });
    this.canvas.addEventListener('pointerleave', () => this.hover(null), { signal });
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.card = null;
    this.events.abort(); this.resize.disconnect(); this.clearPointer(); this.scene.dispose();
    this.pos = null; this.marks = {}; this.symbols = undefined; this.stateEffects.dispose(); this.cardStates.dispose(); this.moveSquares = undefined; this.skippedMark = undefined;
  }

  sync(pos: Position): void {
    if (this.disposed) return;
    this.card = null;
    this.moveSquares = undefined;
    this.stateEffects.sync(this.context, pos, performance.now(), this.motion() && !document.hidden);
    const skipped = this.skippedMark; this.skippedMark = undefined;
    if (skipped && skipped.after.ply === pos.ply && skipped.after.turn === pos.turn
      && skipped.after.board.every((value, sq) => value === pos.board[sq])
      && JSON.stringify(skipped.after.marks) === JSON.stringify(pos.marks)) this.stateEffects.settleMark(skipped.owner);
    this.pos = pos;
    this.scene.setKings([kingDesign(this.context, 0), kingDesign(this.context, 1)]);
    // The design that plays as `T` (ticket 17) stands as its Workshop figure.
    const d = this.context.playedDesign(), id = d && selectedFigure(d).id;
    this.scene.setFigure(T, id ? [figureUrl(id, 0), figureUrl(id, 1)] : null);
    this.scene.setPosition(this.symbols ? { ...pos, board: new Uint8Array(64) } : pos);
    const sq = this.fallen?.pos === pos ? this.fallen.sq : null;
    this.scene.setFallen(sq, false, this.fallRotation(sq));
    this.wakeStateEffects();
  }

  setSymbols(symbols?: (piece: number) => HTMLImageElement): void {
    // A resync ends the running move; the plugin sets the same symbols after every view.
    if (symbols === this.symbols) return;
    this.symbols = symbols;
    if (this.pos) this.sync(this.pos);
  }

  setFallen(sq: number | null, animate = true): void {
    this.fallen = sq == null || !this.pos ? null : { pos: this.pos, sq };
    this.scene.setFallen(sq, animate && this.motion(), this.fallRotation(sq));
  }

  private fallRotation(sq: number | null): number {
    return this.options.webInk && sq != null && this.scene.cell(sq).col === 7 ? 1.5 : -1.5;
  }

  async animateMove(pos: Position, m: Move, onContact?: () => void, speed?: number): Promise<void> {
    if (this.disposed) return;
    if (this.card) this.skip();
    if (this.pos !== pos) this.sync(pos);
    this.skippedMark = undefined;
    const card = cardPlayback(this.context, pos, m);
    if (card) {
      this.skip();
      if (!this.motion() || document.hidden) return;
      this.card = card;
      try {
        const completed = await this.scene.play(m, { effect: card, onContact, speed: speed == null ? (this.pace === 'fast' ? 0.5 : 1) : 1 / speed });
        if (completed && this.card === card) {
          this.stateEffects.sync(this.context, card.after, performance.now(), this.motion() && !document.hidden);
          // The card already reveals its new material; its persistent hold must not start again.
          if (m.power === 'freeze' || m.power === 'ward' || m.power === 'firewall') this.stateEffects.settleMark(pos.turn);
        }
      } finally {
        if (this.card === card) this.card = null;
      }
      return;
    }
    if (this.pace === 'off') return;
    // Marks, passes, replacements and area pushes have no single-piece motion.
    // The caller syncs the resulting board after this resolves.
    if (m.pass || m.drop !== undefined || m.power === 'freeze' || m.power === 'ward' || m.power === 'sacrifice' || m.pushes) return;
    // The scene scales duration; the caller gives playback speed.
    const moving = new Set([m.from, m.to, ...m.captures, ...(m.shove ? [m.shove.from, m.shove.to] : []), ...(m.castle ? [m.castle.from, m.castle.to] : [])]);
    this.moveSquares = moving;
    try { await this.scene.play(m, { onContact, speed: speed == null ? (this.pace === 'fast' ? 0.5 : 1) : 1 / speed }); }
    finally { if (this.moveSquares === moving) this.moveSquares = undefined; }
  }

  async animateBack(pre: Position, m: Move, post: Position): Promise<void> {
    this.sync(post);
    // A shot has no travel. A removed or changed figure has no reverse scene move.
    if (this.motion() && !m.pass && !m.promo && !m.selfRemove && m.from !== m.to
      && post.board[m.to] === pre.board[m.from]) {
      const moving = new Set([m.from, m.to]); this.moveSquares = moving;
      try { await this.scene.play({ from: m.to, to: m.from, captures: [], swap: m.swap }, { speed: this.pace === 'fast' ? 0.5 : 1 }); }
      finally { if (this.moveSquares === moving) this.moveSquares = undefined; }
    }
    // A new position cancels the old rewind; never draw it over that position.
    if (this.pos === post) this.sync(pre);
  }

  setLifted(sq: number | null): void { this.scene.setLifted(this.pace !== 'off' ? sq : null, !this.motionQuery.matches); }

  setPace(pace: Pace): void { this.pace = pace; this.stateEffects.rate = pace === 'fast' ? 2 : 1; if (pace === 'off') this.skip(); this.applyLively(); }
  skip(): void {
    if (this.card && ['freeze', 'ward', 'firewall'].includes(this.card.move.power ?? '')) this.skippedMark = { after: this.card.after, owner: this.card.before.turn };
    this.card = null;
    this.moveSquares = undefined;
    this.stopStateEffects();
    if (this.scene.animating) this.scene.cancel();
    if (this.scene.falling) this.scene.setFallen(this.fallen?.sq ?? null, false, this.fallRotation(this.fallen?.sq ?? null));
  }

  /**
   * The selected figure breathes. Kings and resting pawns move while motion is on and the tab is visible.
   * Reduced motion keeps the slide and victim fade.
   */
  private applyLively(): void {
    if (this.card && (!this.motion() || document.hidden)) this.skip();
    const motion = this.pace !== 'off' && !this.motionQuery.matches, shown = motion && !document.hidden;
    if (this.pace === 'off') this.scene.setLifted(null);
    if (!shown) this.stateEffects.settle();
    this.scene.setReducedMotion(!shown);
    this.scene.setLively({ moves: motion, atmosphere: true, captures: motion, idle: motion, kings: shown, pawns: shown });
  }

  highlight(h: Highlights): void {
    if (this.disposed) return;
    this.marks = h;
    this.container.classList.toggle('king-in-check', h.check != null);
    this.scene.setSelected(h.selected ?? null);
    const now = performance.now(), motion = this.motion() && !document.hidden;
    this.stateEffects.signal('archer', h.shots?.length ? `${h.selected}:${h.shots}` : '', now, motion);
    this.stateEffects.signal('swap', h.swaps?.length ? `${h.selected}:${h.swaps}` : '', now, motion);
    this.stateEffects.signal('shove', h.shoveTo?.length ? JSON.stringify(h.shoveTo) : '', now, motion);
    this.stateEffects.signal('hint', h.hint?.length ? String(h.hint) : '', now, motion);
    this.stateEffects.signal('check', h.check != null ? `${h.check}:${JSON.stringify(h.checkers)}` : '', now, motion, this.stateEffects.forward);
    this.updateGhostEffect();
    this.wakeStateEffects();
    this.aim();
    this.scene.redraw();
  }

  setPreview(sq: number | null): void {
    if (this.disposed || sq === this.cursor) return;
    this.cursor = sq;
    this.updateGhostEffect();
    this.scene.redraw();
  }

  /** Markers animate only while animations are on and the system allows motion. */
  motion(): boolean { return this.pace !== 'off' && !this.motionQuery.matches; }

  flip(black: boolean): void { this.scene.setFlipped(black); }
  setLabels(on: boolean): void { this.scene.setLabels(on); }
  setCoords(on: boolean): void {
    this.coords = on;
    if (this.options.webInk) { const ink = coordInk(this.width); this.scene.setCoords(on && ink.shown, ink.size, ink.inset); }
    else this.scene.setCoords(on, 13 * this.mark, 14);
  }
  ready(): Promise<void> { return this.loaded; }
  /** [white, black] king designs on the board, and the ones last drawn (for the browser checks). */
  get kings(): { set: KingDesign[]; drawn: (KingDesign | null)[] } { return { set: this.scene.kings, drawn: this.scene.drawnKings }; }

  screenOf(sq: number): { x: number; y: number } {
    const r = this.canvas.getBoundingClientRect(), { col, row } = this.scene.cell(sq), k = r.width / 960, t = this.scene.TILE;
    return { x: r.left + (this.scene.PAD + (col + 0.5) * t) * k, y: r.top + (HEADROOM + this.scene.PAD + (row + 0.5) * t) * k };
  }

  /** Point the selected Archer or Pawn at a hovered target. */
  private aim(): void {
    const h = this.hovered, m = this.marks;
    this.scene.setAim(h != null && [...(m.captures ?? []), ...(m.moves ?? [])].includes(h) ? h : null);
  }

  private stopStateEffects(): void { this.stateEffects.settle(); }

  private wakeStateEffects(): void {
    if (this.disposed || !this.motion() || document.hidden) return;
    const remaining = this.stateEffects.remaining(performance.now());
    if (remaining > 0) this.scene.keepAwake(remaining + 40);
  }

  private updateGhostEffect(): void {
    const sq = this.hovered ?? this.cursor;
    const key = sq != null && this.marks.moves?.includes(sq) ? `${this.marks.selected}:${sq}` : '';
    this.stateEffects.signal('ghost', key, performance.now(), this.motion() && !document.hidden);
    this.wakeStateEffects();
  }

  private drawMarks(ctx: CanvasRenderingContext2D, scene: PaintedScene, layer: 'under' | 'over', row?: number): void {
    const { PAD, TILE } = scene, m = this.marks;
    if (layer === 'under') {
      const box = (sq: number) => { const c = scene.cell(sq); return { x: PAD + c.col * TILE, y: PAD + c.row * TILE }; };
      ctx.save();
      // The last move: a warm wash, strong enough for both stone colours (Hint keeps the outline).
      for (const sq of m.last ?? []) { const b = box(sq); ctx.fillStyle = '#e6b84a6e'; ctx.fillRect(b.x, b.y, TILE, TILE); }
      ctx.restore();
    }
    const piece = m.selected != null ? this.pos?.board[m.selected] ?? 0 : 0;
    if (!scene.animating) drawMarks(ctx, scene, layer, {
      marks: m, piece, preview: this.hovered ?? this.cursor, k: this.mark, px: 960 / Math.max(1, this.width), board: this.pos?.board,
      ghost: !this.symbols ? undefined : (ctx, piece, sq, opacity = 0.4) => {
        const cell = scene.cell(sq);
        ctx.save(); ctx.globalAlpha = opacity;
        ctx.drawImage(this.symbols!(piece), PAD + cell.col * TILE + 14, PAD + cell.row * TILE + 14, TILE - 28, TILE - 28);
        ctx.restore();
      },
      ink: this.options.webInk ? boardInk(this.width) : undefined,
    }, row);
    const now = performance.now();
    if (this.card && layer === 'under') this.cardStates.sync(this.context, this.card.shown, now, false);
    // Keep unaffected states visible during playback. The scene owns moving figures and their material.
    drawBoardEffects(ctx, scene, layer, row, this.card ? this.cardStates : this.stateEffects, scene.animating ? {} : m,
      this.width, now, this.motion() && !document.hidden, !!this.symbols, scene.animating ? null : this.hovered ?? this.cursor, piece,
      this.card ? undefined : this.moveSquares);
    if (scene.animating) return;
    if (layer === 'under' && this.symbols && this.pos) {
      this.pos.board.forEach((piece, sq) => {
        if (!piece) return;
        const cell = scene.cell(sq);
        ctx.drawImage(this.symbols!(piece), PAD + cell.col * TILE + 14, PAD + cell.row * TILE + 14, TILE - 28, TILE - 28);
      });
    }
  }

  private pick(e: PointerEvent): number | null {
    const r = this.canvas.getBoundingClientRect();
    return this.scene.squareAt((e.clientX - r.left) * 960 / r.width, (e.clientY - r.top) * 960 / r.width);
  }

  private ownPieceAt(sq: number): boolean {
    const v = this.pos?.board[sq] ?? 0;
    return v !== 0 && colorOf(v) === this.pos!.turn;
  }

  private clearPointer(): void {
    if (this.tap && this.canvas.hasPointerCapture(this.tap.pointerId)) this.canvas.releasePointerCapture(this.tap.pointerId);
    this.tap = null; this.tapSq = null; this.dragFrom = null; this.dragArmed = false;
  }

  // A tap (see pastTap) is onSquareClick on the pressed square;
  // dragging an own piece selects it and releases onto the target square.
  private onDown(e: PointerEvent): void {
    if (this.tap) { this.clearPointer(); return; }
    this.tap = e;
    if (e.button !== 0) return;
    const sq = this.tapSq = this.pick(e);
    if (sq == null || !this.ownPieceAt(sq) || !this.canDrag()) return;
    this.dragFrom = sq;
    this.canvas.setPointerCapture(e.pointerId);
  }

  private onMove(e: PointerEvent): void {
    const d = this.tap;
    if (d && this.dragFrom != null && !this.dragArmed && pastTap(d, e)) {
      this.dragArmed = true;
      this.onDragSelect(this.dragFrom);
    }
    this.hover(this.pick(e));
  }

  private onUp(e: PointerEvent): void {
    const d = this.tap, sq = this.tapSq, from = this.dragFrom, armed = this.dragArmed;
    this.clearPointer();
    if (e.button !== 0 || d?.pointerId !== e.pointerId) return;
    if (!pastTap(d, e)) {
      if (sq != null) this.onSquareClick(sq, e.shiftKey);
      return;
    }
    if (from == null) return;
    if (!armed) this.onDragSelect(from);
    this.onSquareClick(this.pick(e) ?? from, e.shiftKey);
  }

  private hover(sq: number | null): void {
    if (sq === this.hovered) return;
    this.hovered = sq;
    this.updateGhostEffect();
    this.aim();
    this.scene.redraw();
    this.onSquareHover(sq);
  }
}
