export declare const RIBBON_COUNT: number;
export interface WindOptions { tint?: 'lilac' | null; keep?: ((u: number, x: number, y: number) => boolean) | null; fade?: ((u: number) => number) | null }
export declare function windStroke(ctx: CanvasRenderingContext2D, at: (u: number) => { x: number; y: number }, thick: number, alpha: number, i: number, options?: WindOptions): void;
export declare function windArc(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, thick: number, alpha: number, i: number, options?: WindOptions): void;
