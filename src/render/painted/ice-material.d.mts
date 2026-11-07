export interface MaterialFrame {
  x: number;
  y: number;
  progress: number;
  front: boolean;
  seed?: number;
  /** The frozen figure's height and its widest half-width, board units. Absent: the Pawn-sized ice. */
  height?: number;
  half?: number;
}
export function iceScale(frame: MaterialFrame): [number, number];
export function materialState(progress: number): { grow: number; melt: number; life: number };
export function drawFreeze(ctx: CanvasRenderingContext2D, frame: MaterialFrame): void;
export function drawIceWall(ctx: CanvasRenderingContext2D, frame: MaterialFrame): void;
