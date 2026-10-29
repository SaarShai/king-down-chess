export const FACINGS: string[];
export const DECODED_BUDGET: number;
export interface RuntimeFrame { url: string; timeMs: number; visibleIntervalMs?: [number, number]; endMs?: number }
export interface RuntimeBank { id: string; character: string; army: string; kind: string; from: string; to: string; facing: string; durationMs: number; nearest?: boolean; frames: RuntimeFrame[]; pivot: [number, number]; canvasSize: [number, number]; bodyHeightPx: number; registrationHeightPx: number; boardScale?: number; contactMs?: number; effectAnchors?: { id: string; timeMs: number; point: [number, number] }[] }
export function facingOf(dx: number, dy: number): string;
export function frameAt(bank: RuntimeBank, time: number): RuntimeFrame;
export function turnRoute(banks: RuntimeBank[], from: string, to: string): { bank: RuntimeBank; reverse: boolean }[] | null;
export function createCharacterRuntime(options?: { url?: string; wake?: () => void; fetcher?: typeof fetch; image?: () => HTMLImageElement }): {
 ready(): Promise<void>;
 readonly stats: { bytes: number; peakBytes: number; active: number; queued: number };
 has(character: string, army: string): boolean;
 smoke(): { tick(dt: number, anchor: number[], scale?: number): void; draw(ctx: CanvasRenderingContext2D): void } | null;
 warm(character: string, army: string, full?: boolean): Promise<void>;
 reserveIdle(character: string, army: string): Promise<boolean>;
 releaseIdle(): void;
 idleExit(character: string, army: string, body: { bank: string; url: string }): ((fraction: number) => { url: string } | null) | null;
 rest(character: string, army: string, time?: number, active?: boolean): unknown;
 prepare(character: string, army: string, direction: string, capture: boolean, oneSquare?: boolean): Promise<unknown>;
 action(prepared: unknown, time: number, duration: number, contact: number): unknown;
 dispose(): void;
};

export function bankPointToWorld(body: { scale: number; pivot: number[] }, foot: { x: number; y: number }, point: number[], scale?: number): { x: number; y: number };
export function anchorAt(bank: RuntimeBank, id: string, time: number): number[] | null;

export function reverseRoute(route: { bank: RuntimeBank; reverse: boolean }[]): { bank: RuntimeBank; reverse: boolean }[];

export function idleBankAt(clips: RuntimeBank[], turns: RuntimeBank[], restFacing: string, time: number): { bank: RuntimeBank; time: number; reverse: boolean } | null;
