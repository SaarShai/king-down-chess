import { createScene, type KingDesign, type PaintedScene } from '../../docs/2d-first-pieces/board/scene.mjs';
import { A, B, G, K, L, LETTERS, M, N, O, P, PLAIN_KINGS, Q, R, RULES, S, colorOf, sqName, typeOf, type Color, type Move, type Position } from '../rules/engine';
import { drawMarks, POP_MS, RIPPLE_MS } from './marks';
import { pastTap } from './tap';
import type { Highlights } from './renderer';
import type { Style } from './styles';

/** Animation setting: Fast plays moves at double speed, Off shows only the result. */
export type Pace = 'normal' | 'fast' | 'off';

/** What main.ts needs from a board: the clay BoardRenderer and the PaintedView both provide it. */
export interface BoardView {
  onSquareClick: (sq: number, shift: boolean) => void;
  onDragSelect: (sq: number) => void;
  onSquareHover: (sq: number | null) => void;
  onLoadError?: (error: unknown) => void;
  sync(pos: Position): void;
  /** `onContact` fires when a capture or shove lands; it may fire more than once, or not at all. */
  animateMove(pos: Position, m: Move, onContact?: () => void): Promise<void>;
  setPace(pace: Pace): void;
  /** End the running move animation now; its animateMove() resolves. No-op when nothing plays. */
  skip(): void;
  /** The beaten king on `sq` topples; it stays down while the board shows this position. */
  setFallen(sq: number | null): void;
  highlight(h: Highlights): void;
  flip(black: boolean): void;
  setLabels(on: boolean): void;
  setCoords(on: boolean): void;
  resetView(): void;
  applyStyle(style: Style): void;
  ready(): Promise<void>;
  screenOf(sq: number): { x: number; y: number };
  /** The keyboard cursor's square (null: none), previewed like the square under the pointer. */
  setPreview?(sq: number | null): void;
}

/** The king sheet a side's King is drawn with: the king it plays, Spirit (White) and Shadow (Black) without powers. */
const kingDesign = (c: Color): KingDesign => (RULES.kings[c]?.king ?? PLAIN_KINGS[c]).toLowerCase() as KingDesign;

/** Canvas pixels above the board, so tall back-rank figures are not clipped. */
const HEADROOM = 64;

/** The painted 2D look: the board trial's figures and capture animations driving the real game. */
export class PaintedView implements BoardView {
  onSquareClick: (sq: number, shift: boolean) => void = () => {};
  onDragSelect: (sq: number) => void = () => {};
  onSquareHover: (sq: number | null) => void = () => {};
  onLoadError?: (error: unknown) => void;

  private canvas = document.createElement('canvas');
  private scene: PaintedScene;
  private loaded: Promise<void>;
  private pos: Position | null = null;
  private marks: Highlights = {};
  private hovered: number | null = null;
  private tap: PointerEvent | null = null;
  private tapSq: number | null = null; // the square under the press: a tap acts on it
  private dragFrom: number | null = null;
  private dragArmed = false;
  private pace: Pace = 'normal';
  /** Marker size factor: >1 on boards under 700 px, so a phone's markers stay visible. */
  private mark = 1;
  private coords = true;
  private fallen: { pos: Position; sq: number } | null = null;
  private motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  /** Keyboard cursor square, previewed like the hovered square. */
  private cursor: number | null = null;
  /** When the current set of move markers appeared, and which set it was (they pop in once per set). */
  private marksSince = 0;
  private marksKey = '';

  /**
   * options.floor: the colour round the board (default: the scene's own floor, as the plugin page draws it);
   * null leaves the canvas clear there, so the page's floor shows (the game).
   */
  constructor(private container: HTMLElement, options: { floor?: string | null } = {}) {
    container.classList.add('painted');
    this.canvas.width = 960; this.canvas.height = 960 + HEADROOM; // resolution 1 until the first resize
    container.appendChild(this.canvas);
    this.scene = createScene({ canvas: this.canvas, pieces: { P, N, B, R, Q, K, S, L, M, G, A, O, typeOf, colorOf, sqName, LETTERS }, headroom: HEADROOM, kings: [kingDesign(0), kingDesign(1)], floor: options.floor });
    this.scene.setDecorate((ctx, scene, layer, row) => this.drawMarks(ctx, scene, layer, row));
    // The game opts in to quiet-move gaits, the selected figure's idle and the framed, warm board
    // (the trial and the trailer keep the plain scene).
    this.motionQuery.addEventListener('change', () => this.applyLively());
    // The kings' effects redraw the board about 30 times a second: not while the tab is hidden.
    document.addEventListener('visibilitychange', () => this.applyLively());
    this.applyLively();
    this.loaded = this.scene.load().catch(error => { this.onLoadError?.(error); });
    // Keep the square board as large as the container allows.
    new ResizeObserver(([entry]) => {
      const box = entry.contentRect; // excludes the padding that keeps the title card clear
      const width = Math.floor(Math.min(box.width, box.height * 960 / (960 + HEADROOM)));
      this.canvas.style.width = `${width}px`;
      this.canvas.style.height = `${width * (960 + HEADROOM) / 960}px`;
      this.mark = Math.max(1, 700 / width);
      this.setCoords(this.coords);
      // Enough backing pixels for this size on this screen, in quarter steps, at most 2×.
      this.scene.setResolution(Math.min(2, Math.max(1, Math.ceil(width * devicePixelRatio / 960 * 4) / 4)));
    }).observe(container);
    this.canvas.addEventListener('pointerdown', e => this.onDown(e));
    this.canvas.addEventListener('pointermove', e => this.onMove(e));
    this.canvas.addEventListener('pointerup', e => this.onUp(e));
    this.canvas.addEventListener('pointercancel', () => this.clearPointer());
    this.canvas.addEventListener('pointerleave', () => this.hover(null));
  }

  sync(pos: Position): void {
    this.pos = pos;
    this.scene.setKings([kingDesign(0), kingDesign(1)]);
    this.scene.setPosition(pos);
    this.scene.setFallen(this.fallen?.pos === pos ? this.fallen.sq : null, false);
  }

  setFallen(sq: number | null): void {
    this.fallen = sq == null || !this.pos ? null : { pos: this.pos, sq };
    this.scene.setFallen(sq);
  }

  async animateMove(pos: Position, m: Move, onContact?: () => void): Promise<void> {
    if (this.pos !== pos) this.sync(pos);
    if (this.pace === 'off') return;
    // King powers that move nothing (Freeze, Ice Wall, a Haste pass) or change a piece in place
    // (Sacrifice): there is no motion to play, and main.ts syncs the new board right after.
    if (m.pass || m.power === 'freeze' || m.power === 'ward' || m.power === 'sacrifice') return;
    await this.scene.play(m, { onContact, speed: this.pace === 'fast' ? 0.5 : 1 });
  }

  setPace(pace: Pace): void { this.pace = pace; this.applyLively(); }
  skip(): void { if (this.scene.animating) this.scene.cancel(); }

  /**
   * The selected figure breathes, each king shows his own effect (king-effects.mjs) and resting pawns
   * fidget (lance/idle.mjs) only while animations are on and the system allows motion; the kings' effects
   * and the pawns also stop while the tab is hidden. A king's capture always uses his own death for the
   * victim (king-captures.mjs; Animations Off plays no capture at all).
   */
  private applyLively(): void {
    const motion = this.pace !== 'off' && !this.motionQuery.matches, shown = motion && !document.hidden;
    this.scene.setLively({ moves: true, atmosphere: true, captures: true, idle: motion, kings: shown, pawns: shown });
  }

  highlight(h: Highlights): void {
    this.marks = h;
    this.container.classList.toggle('king-in-check', h.check != null);
    this.scene.setSelected(h.selected ?? null);
    // A new selection (or new targets) pops its markers in, rippling out from the piece.
    const key = [h.selected, h.moves, h.captures, h.swaps, h.shoves, h.powers].map(l => String(l ?? '')).join('|');
    if (key !== this.marksKey) {
      this.marksKey = key; this.marksSince = performance.now();
      if (this.motion()) this.scene.keepAwake(POP_MS + 12 * RIPPLE_MS + 50);
    }
    this.aim();
    this.scene.redraw();
  }

  setPreview(sq: number | null): void {
    if (sq === this.cursor) return;
    this.cursor = sq;
    this.scene.redraw();
  }

  /** Markers animate only while animations are on and the system allows motion. */
  private motion(): boolean { return this.pace !== 'off' && !this.motionQuery.matches; }

  flip(black: boolean): void { this.scene.setFlipped(black); }
  setLabels(on: boolean): void { this.scene.setLabels(on); }
  setCoords(on: boolean): void { this.coords = on; this.scene.setCoords(on, 13 * this.mark); }
  resetView(): void {}
  applyStyle(): void {}
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

  private drawMarks(ctx: CanvasRenderingContext2D, scene: PaintedScene, layer: 'under' | 'over', row?: number): void {
    const { PAD, TILE } = scene, m = this.marks;
    if (layer === 'under') {
      const box = (sq: number) => { const c = scene.cell(sq); return { x: PAD + c.col * TILE, y: PAD + c.row * TILE }; };
      ctx.save();
      // The last move: a warm wash, strong enough for both stone colours (Hint keeps the outline).
      for (const sq of m.last ?? []) { const b = box(sq); ctx.fillStyle = '#e6b84a6e'; ctx.fillRect(b.x, b.y, TILE, TILE); }
      if (m.check != null) {
        const f = scene.foot(m.check);
        ctx.fillStyle = '#c0392b55'; ctx.strokeStyle = '#b3261e'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(f.x, f.y - 2, 44, 15, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
      ctx.restore();
    }
    if (scene.animating) return;
    const piece = m.selected != null ? this.pos?.board[m.selected] ?? 0 : 0;
    drawMarks(ctx, scene, layer, {
      marks: m, piece, preview: this.hovered ?? this.cursor, k: this.mark, motion: this.motion(), since: this.marksSince,
    }, row);
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

  // Same contract as the clay board: a tap (see pastTap) is onSquareClick on the pressed square;
  // dragging an own piece selects it and releases onto the target square.
  private onDown(e: PointerEvent): void {
    if (this.tap) { this.clearPointer(); return; }
    this.tap = e;
    if (e.button !== 0) return;
    const sq = this.tapSq = this.pick(e);
    if (sq == null || !this.ownPieceAt(sq)) return;
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
    this.aim();
    this.scene.redraw();
    this.onSquareHover(sq);
  }
}
