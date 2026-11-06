export interface MaterialFrame {
  x: number;
  y: number;
  progress: number;
  front: boolean;
  seed?: number;
}
export function materialState(progress: number): { grow: number; melt: number; life: number };
export function drawFreeze(ctx: CanvasRenderingContext2D, frame: MaterialFrame): void;
export function drawIceWall(ctx: CanvasRenderingContext2D, frame: MaterialFrame): void;
