// Types for scene.mjs, so the game's TypeScript can import the shared painted scene.
export const SIZE: number, PAD: number, TILE: number;
/** A king sheet: docs/2d-first-pieces/king-<design>/. */
export type KingDesign = 'frost' | 'flame' | 'stratus' | 'mud' | 'spirit' | 'shadow';
export interface ScenePieces {
  P: number; N: number; B: number; R: number; Q: number; K: number; S: number; L: number; M: number; G: number; A: number; O: number;
  typeOf(piece: number): number;
  colorOf(piece: number): number;
  sqName(square: number): string;
  LETTERS?: { readonly [index: number]: string };
}
export interface SceneMove { from: number; to: number; captures: number[]; swap?: boolean; shove?: { from: number; to: number }; selfRemove?: boolean }
export interface PaintedScene {
  readonly SIZE: number; readonly PAD: number; readonly TILE: number; readonly headroom: number;
  readonly animating: boolean;
  /** A gait name ('walk', 'glide', 'hop') for a quiet move with character, else the animation kind; null when nothing plays. */
  readonly playing: string | null;
  foot(square: number): { x: number; y: number };
  cell(square: number): { col: number; row: number };
  squareAt(x: number, y: number): number | null;
  load(): Promise<void>;
  setPosition(position: { board: ArrayLike<number> }): void;
  setSelected(square: number | null): void;
  setAim(square: number | null): void;
  setFlipped(on: boolean): void;
  /** [white, black]: the king design each side's King is drawn with; a sheet not yet loaded loads now. */
  setKings(kings: readonly [KingDesign, KingDesign]): void;
  readonly kings: KingDesign[];
  /** The design each side's King was last drawn with (null: not drawn yet). */
  readonly drawnKings: (KingDesign | null)[];
  setCoords(on: boolean, size?: number): void;
  setLabels(on: boolean): void;
  setReducedMotion(on: boolean): void;
  setFallen(square: number | null, animate?: boolean): void;
  /** Backing pixels per board unit; resizes the canvas and the effect layer. Default 1. */
  setResolution(k: number): void;
  /**
   * Opt-in liveliness (all off by default, so the trial and the trailer are unchanged):
   * moves: quiet moves use each figure's gait (gait.mjs); idle: the selected figure breathes;
   * atmosphere: a stone frame, soft contact shadows and warm light on the board;
   * kings: each king's own idle effect (king-effects.mjs), redrawn about 30 times a second while one shows;
   * captures: a piece a king takes dies that king's way (king-captures.mjs; Stratus keeps the shatter);
   * pawns: resting pawns now and then shake the spear, move the helmet or hitch the shield (lance/idle.mjs).
   */
  setLively(options: { moves?: boolean; idle?: boolean; atmosphere?: boolean; kings?: boolean; captures?: boolean; pawns?: boolean }): void;
  /** The king designs whose effects the last frame drew (empty: none). */
  readonly effects: KingDesign[];
  /** Resting pawns in the last frame and how many of them were acting. */
  readonly pawns: { resting: number; acting: number };
  /** Frames drawn since the scene was made. */
  readonly frames: number;
  /**
   * 'under': once, below every figure. 'over': once per screen row (0 = top) after that row's figures,
   * so a figure in a lower row stands in front of the markers behind it.
   */
  setDecorate(fn: ((ctx: CanvasRenderingContext2D, scene: PaintedScene, layer: 'under' | 'over', row?: number) => void) | null): void;
  redraw(): void;
  /** Draw every frame for the next `ms` milliseconds (a decoration's own short animation). */
  keepAwake(ms: number): void;
  /** A see-through copy of figure `piece` standing on `square` (a move preview), drawn into `ctx`; for setDecorate. */
  ghost(ctx: CanvasRenderingContext2D, piece: number, square: number, opacity?: number): void;
  /** onContact fires once when the strike lands (not for plain moves or swaps). */
  /** gait: play a quiet move with this gait (a GAITS name) even when `moves` is off. */
  play(move: SceneMove, options?: { speed?: number; onContact?: (() => void) | null; gait?: string | null }): Promise<boolean>;
  cancel(): void;
}
export function createScene(options: {
  canvas: HTMLCanvasElement;
  pieces: ScenePieces;
  closeup?: { panel: HTMLElement; title: HTMLElement; ctx: CanvasRenderingContext2D } | null;
  onStatus?: (text: string) => void;
  headroom?: number;
  /** [white, black] king designs to start with; default Frost for both (the trial and the trailer). */
  kings?: readonly [KingDesign, KingDesign];
}): PaintedScene;
