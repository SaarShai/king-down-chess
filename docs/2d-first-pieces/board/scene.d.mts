// Types for scene.mjs, so the game's TypeScript can import the shared painted scene.
export const SIZE: number, PAD: number, TILE: number;
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
  foot(square: number): { x: number; y: number };
  cell(square: number): { col: number; row: number };
  squareAt(x: number, y: number): number | null;
  load(): Promise<void>;
  setPosition(position: { board: ArrayLike<number> }): void;
  setSelected(square: number | null): void;
  setAim(square: number | null): void;
  setFlipped(on: boolean): void;
  setCoords(on: boolean, size?: number): void;
  setLabels(on: boolean): void;
  setReducedMotion(on: boolean): void;
  setFallen(square: number | null, animate?: boolean): void;
  /** Backing pixels per board unit; resizes the canvas and the effect layer. Default 1. */
  setResolution(k: number): void;
  setDecorate(fn: ((ctx: CanvasRenderingContext2D, scene: PaintedScene, layer: 'under' | 'over') => void) | null): void;
  redraw(): void;
  /** onContact fires once when the strike lands (not for plain moves or swaps). */
  play(move: SceneMove, options?: { speed?: number; onContact?: (() => void) | null }): Promise<boolean>;
  cancel(): void;
}
export function createScene(options: {
  canvas: HTMLCanvasElement;
  pieces: ScenePieces;
  closeup?: { panel: HTMLElement; title: HTMLElement; ctx: CanvasRenderingContext2D } | null;
  onStatus?: (text: string) => void;
  headroom?: number;
}): PaintedScene;
