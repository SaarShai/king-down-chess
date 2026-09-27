import { createScene, type PaintedScene } from '../../docs/2d-first-pieces/board/scene.mjs';
import { A, B, G, K, L, LETTERS, M, N, O, P, Q, R, S, colorOf, sqName, typeOf, type Move, type Position } from '../rules/engine';
import type { Highlights } from './renderer';
import type { Style } from './styles';

/** What main.ts needs from a board: the clay BoardRenderer and the PaintedView both provide it. */
export interface BoardView {
  onSquareClick: (sq: number, shift: boolean) => void;
  onDragSelect: (sq: number) => void;
  onSquareHover: (sq: number | null) => void;
  onLoadError?: (error: unknown) => void;
  sync(pos: Position): void;
  /** `onContact` fires when a capture or shove lands; it may fire more than once, or not at all. */
  animateMove(pos: Position, m: Move, onContact?: () => void): Promise<void>;
  highlight(h: Highlights): void;
  flip(black: boolean): void;
  setLabels(on: boolean): void;
  setCoords(on: boolean): void;
  resetView(): void;
  applyStyle(style: Style): void;
  ready(): Promise<void>;
  screenOf(sq: number): { x: number; y: number };
}

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
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
  private dragFrom: number | null = null;
  private dragArmed = false;

  constructor(private container: HTMLElement) {
    container.classList.add('painted');
    this.canvas.width = 960; this.canvas.height = 960 + HEADROOM;
    container.appendChild(this.canvas);
    this.scene = createScene({ canvas: this.canvas, pieces: { P, N, B, R, Q, K, S, L, M, G, A, O, typeOf, colorOf, sqName, LETTERS }, headroom: HEADROOM });
    this.scene.setDecorate((ctx, scene, layer) => this.drawMarks(ctx, scene, layer));
    this.loaded = this.scene.load().catch(error => { this.onLoadError?.(error); });
    // Keep the square board as large as the container allows.
    new ResizeObserver(([entry]) => {
      const box = entry.contentRect; // excludes the padding that keeps the title card clear
      const width = Math.floor(Math.min(box.width, box.height * 960 / (960 + HEADROOM)));
      this.canvas.style.width = `${width}px`;
      this.canvas.style.height = `${width * (960 + HEADROOM) / 960}px`;
    }).observe(container);
    this.canvas.addEventListener('pointerdown', e => this.onDown(e));
    this.canvas.addEventListener('pointermove', e => this.onMove(e));
    this.canvas.addEventListener('pointerup', e => this.onUp(e));
    this.canvas.addEventListener('pointercancel', () => this.clearPointer());
    this.canvas.addEventListener('pointerleave', () => this.hover(null));
  }

  sync(pos: Position): void {
    this.pos = pos;
    this.scene.setPosition(pos);
  }

  async animateMove(pos: Position, m: Move, onContact?: () => void): Promise<void> {
    if (this.pos !== pos) this.sync(pos);
    if (reducedMotion.matches) return;
    await this.scene.play(m, { onContact });
  }

  highlight(h: Highlights): void {
    this.marks = h;
    this.container.classList.toggle('king-in-check', h.check != null);
    this.scene.setSelected(h.selected ?? null);
    this.aim();
    this.scene.redraw();
  }

  flip(black: boolean): void { this.scene.setFlipped(black); }
  setLabels(on: boolean): void { this.scene.setLabels(on); }
  setCoords(on: boolean): void { this.scene.setCoords(on); }
  resetView(): void {}
  applyStyle(): void {}
  ready(): Promise<void> { return this.loaded; }

  screenOf(sq: number): { x: number; y: number } {
    const r = this.canvas.getBoundingClientRect(), { col, row } = this.scene.cell(sq), k = r.width / 960, t = this.scene.TILE;
    return { x: r.left + (this.scene.PAD + (col + 0.5) * t) * k, y: r.top + (HEADROOM + this.scene.PAD + (row + 0.5) * t) * k };
  }

  /** Point the selected Archer or Pawn at a hovered target. */
  private aim(): void {
    const h = this.hovered, m = this.marks;
    this.scene.setAim(h != null && [...(m.captures ?? []), ...(m.moves ?? [])].includes(h) ? h : null);
  }

  private drawMarks(ctx: CanvasRenderingContext2D, scene: PaintedScene, layer: 'under' | 'over'): void {
    const { PAD, TILE } = scene, m = this.marks;
    const box = (sq: number) => { const c = scene.cell(sq); return { x: PAD + c.col * TILE, y: PAD + c.row * TILE }; };
    ctx.save();
    if (layer === 'under') {
      for (const sq of m.last ?? []) { const b = box(sq); ctx.fillStyle = '#c7a55a38'; ctx.fillRect(b.x, b.y, TILE, TILE); }
      if (m.check != null) {
        const f = scene.foot(m.check);
        ctx.fillStyle = '#c0392b55'; ctx.strokeStyle = '#b3261e'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(f.x, f.y - 2, 44, 15, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
    } else if (!scene.animating) {
      for (const sq of m.hint ?? []) { const b = box(sq); ctx.strokeStyle = '#c99a2e'; ctx.lineWidth = 4; ctx.strokeRect(b.x + 4, b.y + 4, TILE - 8, TILE - 8); }
      for (const sq of m.moves ?? []) {
        const b = box(sq); ctx.fillStyle = '#58754f'; ctx.strokeStyle = '#f3f3dfaa'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(b.x + TILE / 2, b.y + TILE * 0.86, 8, 0, Math.PI * 2); ctx.stroke(); ctx.fill();
      }
      for (const sq of m.captures ?? []) {
        const b = box(sq); ctx.strokeStyle = '#b17b4d'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(b.x + TILE / 2, b.y + TILE / 2, TILE * 0.44, 0, Math.PI * 2); ctx.stroke();
      }
      for (const [squares, colour, glyph] of [[m.swaps, '#80659c', '↔'], [m.shoves, '#3d8179', '⇥']] as const) {
        for (const sq of squares ?? []) {
          const b = box(sq); ctx.strokeStyle = colour; ctx.fillStyle = colour; ctx.lineWidth = 2.5; ctx.setLineDash([7, 5]);
          ctx.strokeRect(b.x + 7, b.y + 7, TILE - 14, TILE - 14); ctx.setLineDash([]);
          ctx.font = 'bold 22px system-ui'; ctx.textAlign = 'right'; ctx.textBaseline = 'top'; ctx.fillText(glyph, b.x + TILE - 11, b.y + 10);
        }
      }
      if (this.hovered != null) { const b = box(this.hovered); ctx.strokeStyle = '#ffffffaa'; ctx.lineWidth = 2; ctx.strokeRect(b.x + 1, b.y + 1, TILE - 2, TILE - 2); }
    }
    ctx.restore();
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
    this.tap = null; this.dragFrom = null; this.dragArmed = false;
  }

  // Same contract as the clay board: a click (≤6 px) is onSquareClick; dragging an own piece
  // selects it and releases onto the target square.
  private onDown(e: PointerEvent): void {
    if (this.tap) { this.clearPointer(); return; }
    this.tap = e;
    if (e.button !== 0) return;
    const sq = this.pick(e);
    if (sq == null || !this.ownPieceAt(sq)) return;
    this.dragFrom = sq;
    this.canvas.setPointerCapture(e.pointerId);
  }

  private onMove(e: PointerEvent): void {
    const d = this.tap;
    if (d && this.dragFrom != null && !this.dragArmed && Math.hypot(e.clientX - d.clientX, e.clientY - d.clientY) > 6) {
      this.dragArmed = true;
      this.onDragSelect(this.dragFrom);
    }
    this.hover(this.pick(e));
  }

  private onUp(e: PointerEvent): void {
    const d = this.tap, from = this.dragFrom, armed = this.dragArmed;
    this.clearPointer();
    if (e.button !== 0 || d?.pointerId !== e.pointerId) return;
    if (Math.hypot(e.clientX - d.clientX, e.clientY - d.clientY) <= 6) {
      const sq = this.pick(e);
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
