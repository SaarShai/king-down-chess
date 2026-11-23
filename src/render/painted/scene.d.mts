// Types for scene.mjs, so the game's TypeScript can import the shared painted scene.
export const SIZE: number, PAD: number, TILE: number;
/** The floor round the board, by default ('#e6e1cf'). */
export const FLOOR: string;
/** The floor that createScene draws: FLOOR when `floor` is undefined, else `floor` (a colour, or null for none). */
export function floorOf(floor: string | null | undefined): string | null;
/** Clears the canvas (the headroom included) and fills it with `floor`; null only clears it. */
export function paintFloor(ctx: Pick<CanvasRenderingContext2D, 'clearRect' | 'fillRect' | 'fillStyle'>, floor: string | null, headroom: number): void;
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
export interface DaylightSceneHooks {
  /** Take over the contact hold (45 ms; 55 ms without this hook). Call the board's pause() now and resume() when the shared hold ends. */
  hold?: (ms: number) => void;
  /** Return true to replace the game's capture sound. */
  onCaptureContact?: (square: number, animated: boolean) => boolean | void;
  /** At contact. Call replace when the painted pose is ready. It returns false after the action ends. */
  onCaptureVictim?: (square: number, kind: string, army: 'white' | 'black', bodyHeight: number, rect: DOMRectReadOnly, replace: () => boolean) => void;
  onKingImpact?: (square: number, animated: boolean) => void;
}
/** A card uses the scene's clock and cancellation. It supplies only the approved drawing and real positions. */
export interface SceneEffect {
  duration: number;
  position(t: number): { board: ArrayLike<number> };
  draw(ctx: CanvasRenderingContext2D, scene: PaintedScene, layer: 'under' | 'over', row: number | undefined, t: number): void;
}
export interface PaintedScene {
  readonly SIZE: number; readonly PAD: number; readonly TILE: number; readonly headroom: number;
  readonly animating: boolean;
  /** Scene ms since the running move's action began, scaled by its speed; null while idle or while its bank loads. */
  readonly actionElapsed: number | null;
  /** Scene ms the running move's action takes in all, on the actionElapsed clock; null while idle or while its bank loads. */
  readonly actionTotal: number | null;
  readonly falling: boolean;
  /** Local time in ms. A pause holds all scene effects at this time. */
  readonly time: number;
  pause(): void;
  resume(): void;
  /** A gait name ('walk', 'glide', 'hop') for a quiet move with character, else the animation kind; null when nothing plays. */
  readonly playing: string | null;
  foot(square: number): { x: number; y: number };
  cell(square: number): { col: number; row: number };
  squareAt(x: number, y: number): number | null;
  load(): Promise<void>;
  readonly position: { board: ArrayLike<number> };
  setPosition(position: { board: ArrayLike<number> }, frozen?: ReadonlySet<number>): void;
  setSelected(square: number | null, destinations?: number[], captures?: number[]): void;
  /** Opt-in tell: glow and lift 3 screen pixels; lift=false keeps a still glow. Null clears it. */
  setLifted(square: number | null, lift?: boolean): void;
  readonly lifted: number | null;
  setAim(square: number | null): void;
  setFlipped(on: boolean): void;
  /** [white, black]: the king design each side's King is drawn with; a sheet not yet loaded loads now. */
  setKings(kings: readonly [KingDesign, KingDesign]): void;
  setFigure(type: number, urls: readonly [string, string] | null): void;
  readonly kings: KingDesign[];
  resetKingEffects(): void;
  /** The design each side's King was last drawn with (null: not drawn yet). */
  readonly drawnKings: (KingDesign | null)[];
  setCoords(on: boolean, size?: number, inset?: number): void;
  setLabels(on: boolean): void;
  setReducedMotion(on: boolean): void;
  setFallen(square: number | null, animate?: boolean, rotation?: number, speed?: number, onImpact?: (square: number) => void, painted?: boolean): void;
  /** Backing pixels per board unit; resizes the canvas and the effect layer. Default 1. */
  setResolution(k: number): void;
  /**
   * Opt-in liveliness (all off by default, so the trial and the trailer are unchanged):
   * moves: quiet moves use each figure's gait (gait.mjs); idle: the selected figure plays his clip once
   * (a Knight or a Rook: clips/clips.mjs), then breathes;
   * atmosphere: a stone frame, soft pools under the figures and warm light on the board;
   * kings: each king's own idle effect (king-effects.mjs), redrawn about 30 times a second while one shows;
   * captures: a piece a king takes dies that king's way (king-captures.mjs);
   * pawns: resting pawns now and then shake the spear, move the helmet or hitch the shield (lance/idle.mjs).
   */
  setLively(options: { ambient?: boolean; moves?: boolean; idle?: boolean; atmosphere?: boolean; kings?: boolean; captures?: boolean; pawns?: boolean }): void;
  /** The king designs whose effects the last frame drew (empty: none). */
  readonly effects: KingDesign[];
  /** The clip drawing the last frame showed, or null: none plays. */
  readonly clip: { name: 'knight' | 'rook'; frame: number } | null;
  /** Resting pawns in the last frame and how many of them were acting. */
  readonly idles: number[];
  readonly pawns: { resting: number; acting: number };
  /** Frames drawn since the scene was made. */
  readonly frames: number;
  readonly characterEffects: { kind: string; at: number; speed: number; bodyDurationMs: number; bodyTime: number; releaseMs: number; durationMs: number; elapsedMs: number; origin: { x: number; y: number }; target: { x: number; y: number }; foot: { x: number; y: number }; pivot: number[]; scale: number }[];
  readonly characterExit: number | null;
  readonly characterWarmupSettled: boolean;
  readonly characterMemory: { bytes: number; peakBytes: number; framesLoaded: number; active: number; queued: number; manifestReady: boolean; manifestLoading: boolean; manifestPending: boolean };
  readonly characterFrames: { square: number; opacity: number; struck: boolean; bank: string; time: number; foot: { x: number; y: number }; pivot: number[]; scale: number }[];
  /**
   * 'under': once, below every figure. 'over': once per screen row (0 = top) after that row's figures,
   * so a figure in a lower row stands in front of the markers behind it.
   */
  setDecorate(fn: ((ctx: CanvasRenderingContext2D, scene: PaintedScene, layer: 'under' | 'over', row?: number) => void) | null): void;
  redraw(): void;
  /** Draw a lettered piece at the centre of a square. */
  drawToken(ctx: CanvasRenderingContext2D, value: number, x: number, y: number): void;
  /** Swap the board texture. Square geometry does not change. A decode failure keeps the old art and rejects. */
  setBoardArt(url: string): Promise<void>;
  /** Draw every frame for the next `ms` milliseconds (a decoration's own short animation). */
  keepAwake(ms: number): void;
  /** The figures on `delays` (square: ms) rise `rise` units into place in `ms` each; an empty map or reduced motion ends it. */
  arrive(delays: Map<number, number>, ms?: number, rise?: number): void;
  /** Board-unit bounds of figure `piece` standing at rest on `square`: foot x and y, head top, left and right. */
  figureBox(piece: number, square: number): { x: number; foot: number; top: number; l: number; r: number };
  /** The figure's registration and optional last drawn pose, in canvas units. */
  momentFigure(square: number, snapshot: boolean): {
    x: number; y: number; bodyHeight: number;
    from?: { image: HTMLCanvasElement; rect: { x: number; y: number; width: number; height: number } };
  } | undefined;
  /** A see-through copy of figure `piece` standing on `square` (a move preview), drawn into `ctx`; for setDecorate. */
  ghost(ctx: CanvasRenderingContext2D, piece: number, square: number, opacity?: number): void;
  /** onContact fires once when the strike lands (not for plain moves or swaps). */
  /** speed scales duration: 2 is half playback speed; 0.5 is double. */
  /** gait: play a quiet move with this gait (a GAITS name) even when `moves` is off. */
  /** targetMs: opt-in action time before the speed factor; the default keeps the recorded timing. */
  play(move: SceneMove, options?: { speed?: number; onContact?: ((soundHandled?: boolean) => void) | null; onStart?: (() => void) | null; gait?: string | null; effect?: SceneEffect; targetMs?: number; finishSwapOnArrival?: boolean }): Promise<boolean>;
  prepareUndo(move: SceneMove, source?: { board: ArrayLike<number> }): boolean;
  rewindUndo(): Promise<boolean>;
  cancel(): void;
  dispose(): void;
}
export function createScene(options: {
  canvas: HTMLCanvasElement;
  pieces: ScenePieces;
  closeup?: { panel: HTMLElement; title: HTMLElement; ctx: CanvasRenderingContext2D } | null;
  onStatus?: (text: string) => void;
  headroom?: number;
  /** [white, black] king designs to start with; default Frost for both (the trial and the trailer). */
  kings?: readonly [KingDesign, KingDesign];
  /** The colour round the board; default FLOOR. null leaves the canvas clear there, so the page shows (the game). */
  floor?: string | null;
  /** Use the ready-only character body package in the game. */
  characterRuntime?: boolean;
  /** With the runtime: a figure keeps its rest still while its part is in transfer; only a figure the package lacks drops it. Default false. */
  holdStills?: boolean;
  /** With the runtime: ready needs only the stone and the rest stills; the legacy sheets, the wind, rift and king sheets load after the first frame, and a figure draws its still until its sheet loads. The stills and `setBoardArt` load without CORS, so their art must come from the page's origin. Default false. */
  lazySheets?: boolean;
  /** The first board surface. Default: the original stone image. With lazySheets, use the page's origin. */
  initialBoardArt?: string;
  /** Draw plain squares and lettered pieces while art loads. Use with lazySheets. */
  progressiveArt?: boolean;
  /** Called with the URL of a rest still that cannot load. Default none: the figure then waits for its sheet, as before. */
  onArtError?: (url: string) => void;
  daylight?: DaylightSceneHooks;
}): PaintedScene;
