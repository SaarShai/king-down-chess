import { bindControls } from './controls';
import { pulse } from './pulse';

export { ease, Spring } from './curves';
export { hold, later, onFrame, reducedMotion, setFxMotion, setPauseHook, tween } from './clock';
export { burst, edgeLight, shake, streak } from './canvas';
export { pulse, setVibration } from './pulse';

export type Curve = (progress: number) => number;
export type Point = { x: number; y: number };
export type SoundName = 'tick' | 'press' | 'ting' | 'clink' | 'knock' | 'impact' | 'whoosh' | 'pass'
  | 'arrive' | 'ice' | 'fire' | 'wind' | 'rewind' | 'no' | 'lift' | 'mark' | 'check';
export type SoundOptions = { piece?: number; king?: import('../../../rules/engine').KingName; volume?: number; pitch?: number };
export type PulseKind = 'tick' | 'light' | 'medium' | 'heavy' | 'success' | 'warn' | 'error' | 'refuse';
export type Effect = { cancel(): void; finish(): void };

export type Step = (deltaMs: number, timeMs: number) => false | void;
export type TweenOptions = { curve?: Curve; done?: () => void };
export type StreakOptions = { ms?: number; width?: number; bend?: number; curve?: Curve; onArrive?: () => void };
export type EdgeOptions = { ms?: number; width?: number; reverse?: boolean };
export type BurstOptions = { ms?: number; count?: number; rise?: number };
export type ShakeOptions = { ms?: number; amplitude?: number };
type SoundPlayer = (name: SoundName, options?: SoundOptions) => void;

export function at(element: Element, x = .5, y = .5): Point {
  const box = element.getBoundingClientRect();
  return { x: box.left + box.width * x, y: box.top + box.height * y };
}

let playSound: SoundPlayer | undefined;

export function startFx(player: SoundPlayer): void {
  playSound = player;
  if (typeof document !== 'undefined') bindControls(sound, pulse);
}

export function sound(name: SoundName, options?: SoundOptions): void { playSound?.(name, options); }
