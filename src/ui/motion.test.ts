import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { castRelease, handoff, UiMotion } from './motion';
import { drawFreeze } from '../render/effects/materials';
// The material sets its own alpha, as the real one does.
vi.mock('../render/effects/materials', () => ({ drawFreeze: vi.fn((ctx: CanvasRenderingContext2D) => { ctx.globalAlpha = 1; }), drawFirewall: vi.fn() }));

let now: number, timelineOffset: number, setupDelay: number, pace: string, hidden: boolean, reduced: boolean;
let documentEvents: EventTarget, media: EventTarget;
let settingsChanged: () => void;
let animations: ReturnType<typeof animation>[];
function animation(options: KeyframeAnimationOptions = { duration: 500 }) {
  let finish!: () => void, reject!: () => void;
  const finished = new Promise<void>((resolve, no) => { finish = resolve; reject = no; });
  let heldTime: number | undefined;
  const a = {
    startTime: null as number | null,
    get currentTime() { return heldTime ?? (a.startTime === null ? 0 : Number(document.timeline.currentTime) - a.startTime); },
    set currentTime(value: number) { heldTime = value; },
    playState: 'running', effect: { getComputedTiming: () => ({ duration: options.duration, endTime: Number(options.duration) + Number(options.delay ?? 0) }) },
    finished, finish, cancel: vi.fn(() => reject()),
  };
  return a;
}
class Control {
  isConnected = true;
  animate = vi.fn((_frames: Keyframe[], _options: KeyframeAnimationOptions) => { now += setupDelay; const a = animation(_options); animations.push(a); return a; });
  contains(target: unknown) { return target === this; }
}
beforeEach(() => {
  now = 1000; timelineOffset = 0; setupDelay = 0; pace = 'normal'; hidden = reduced = false; animations = [];
  documentEvents = new EventTarget(); media = new EventTarget();
  vi.spyOn(performance, 'now').mockImplementation(() => now);
  vi.stubGlobal('document', {
    timeline: { get currentTime() { return now - timelineOffset; } },
    get hidden() { return hidden; }, documentElement: { dataset: { get pace() { return pace; } } },
    addEventListener: documentEvents.addEventListener.bind(documentEvents), removeEventListener: documentEvents.removeEventListener.bind(documentEvents),
  });
  vi.stubGlobal('matchMedia', () => ({ get matches() { return reduced; }, addEventListener: media.addEventListener.bind(media), removeEventListener: media.removeEventListener.bind(media) }));
  vi.stubGlobal('MutationObserver', class { constructor(callback: () => void) { settingsChanged = callback; } observe() {} disconnect() {} });
  vi.stubGlobal('Node', Control);
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const element = () => new Control() as unknown as Element;

it.each([0, 40])('keeps the original onset through %s ms of setup and never replays a finished onset', async delay => {
  setupDelay = delay;
  const motion = new UiMotion(), first = element(), next = element();
  motion.reveal(first, 400, 12, 100, 1000);
  now = 1250; first.remove?.(); (first as unknown as Control).isConnected = false;
  motion.reveal(next, 400, 12, 100, 1000);
  expect(animations[0].cancel).toHaveBeenCalledOnce();
  expect(animations.map(a => a.startTime)).toEqual([1000, 1000]);
  now = 1500;
  motion.reveal(next, 400, 12, 100, 1000);
  expect(animations).toHaveLength(2);
  animations[1].finish(); await Promise.resolve();
  expect(animations[1].cancel).toHaveBeenCalledOnce();
  motion.dispose();
});

it.each([-60_000, 60_000])('ends at the correct age when the timeline has a %s ms clock offset', async offset => {
  timelineOffset = offset; now = 100_000; setupDelay = 40;
  const motion = new UiMotion();
  const a = motion.play(element(), [{ opacity: 0 }, { opacity: 1 }], 500, 0, now - 125)!;
  expect(a.currentTime).toBe(165);
  let ended = false;
  void a.finished.then(() => { ended = true; });
  const step = async (ms: number) => {
    now += ms;
    for (const animation of animations) {
      if (animation.currentTime >= animation.effect.getComputedTiming().endTime) animation.finish();
    }
    await Promise.resolve();
  };
  await step(334); expect(ended).toBe(false);
  await step(1); expect(ended).toBe(true);
  expect(animations[0].cancel).toHaveBeenCalledOnce();
  motion.dispose();
});

it('keeps one timeline start through frozen-frame setup, other events and a row rebuild', () => {
  let timelineNow = 7000;
  Object.assign(document, { timeline: { get currentTime() { return timelineNow; } } });
  now = 100_000; setupDelay = 40;
  const motion = new UiMotion(), first = element();
  motion.reveal(first, 500, 0, 0, 100_000);
  now = 100_100; timelineNow = 7100;
  motion.reveal(element(), 500, 0, 0, 100_100);
  now = 100_200; timelineNow = 7200;
  (first as unknown as Control).isConnected = false;
  motion.reveal(element(), 500, 0, 0, 100_000);
  expect(animations.map(a => a.startTime)).toEqual([7000, 7100, 7000]);
  expect(animations[0].cancel).toHaveBeenCalledOnce();
  expect(animations[2].currentTime).toBe(200);
  motion.dispose();
});

it.each(['off', 'reduced', 'hidden', 'disabled'])('leaves a readable DOM state with %s motion', mode => {
  pace = mode === 'off' ? 'off' : 'normal'; reduced = mode === 'reduced'; hidden = mode === 'hidden';
  const motion = new UiMotion(() => mode !== 'disabled'), control = element();
  motion.reveal(control);
  expect(animations).toHaveLength(0);
  motion.dispose();
});

it('uses Fast for duration and delay, and consumes the same event window', () => {
  pace = 'fast';
  const motion = new UiMotion(), control = element();
  motion.reveal(control, 500, 8, 200, 1000);
  expect((control as unknown as Control).animate.mock.calls[0][1]).toMatchObject({ duration: 250, delay: 100 });
  now = 1350; motion.reveal(element(), 500, 8, 200, 1000);
  expect(animations).toHaveLength(1);
  motion.dispose();
});

it('cancels replacement, hidden-tab work and disposed playback without late work', async () => {
  const motion = new UiMotion(), control = element();
  motion.reveal(control); now = 1050; motion.reveal(control);
  expect(animations[0].cancel).toHaveBeenCalledOnce();
  now = 1100; hidden = true; documentEvents.dispatchEvent(new Event('visibilitychange'));
  expect(animations[1].cancel).toHaveBeenCalledOnce();
  hidden = false; now = 1150; motion.reveal(element(), 500, 8, 0, 1050);
  expect(animations).toHaveLength(2);
  now = 1200; motion.reveal(control); motion.dispose();
  expect(animations[2].cancel).toHaveBeenCalledOnce();
  now = 1300; motion.reveal(control); expect(animations).toHaveLength(3);
  await Promise.resolve();
});

it('stops current motion when settings change and keeps focus visible', async () => {
  const motion = new UiMotion(), control = element();
  motion.reveal(control); pace = 'off'; settingsChanged();
  expect(animations[0].cancel).toHaveBeenCalledOnce();
  pace = 'normal'; now = 1100; motion.reveal(control);
  const focus = new Event('focusin'); Object.defineProperty(focus, 'target', { value: control });
  documentEvents.dispatchEvent(focus);
  expect(animations[1].cancel).toHaveBeenCalledOnce();
  motion.dispose(); await Promise.resolve();
});

it('consumes an event that arrives while hidden, before the tab returns', () => {
  const motion = new UiMotion();
  hidden = true; now = 1100; documentEvents.dispatchEvent(new Event('visibilitychange'));
  now = 1200; motion.reveal(element(), 500, 8, 0, 1200);
  hidden = false; now = 1250; motion.reveal(element(), 500, 8, 0, 1200);
  expect(animations).toHaveLength(0);
  motion.dispose();
});

it.each(['finished', 'cancelled', 'disabled'])('removes the handoff token when %s', async state => {
  const token = { style: {}, setAttribute: vi.fn(), remove: vi.fn() };
  Object.assign(document, { createElement: () => token });
  const rect = () => ({ left: 0, top: 0, width: 36, height: 36 });
  const target = { getBoundingClientRect: rect }, other = { getBoundingClientRect: rect };
  const host = { querySelector: () => null, querySelectorAll: () => [other, target], getBoundingClientRect: rect, append: vi.fn() };
  const a = animation(), motion = { play: () => state === 'disabled' ? undefined : a };
  handoff(motion as unknown as UiMotion, host as unknown as HTMLElement, target as HTMLElement, now);
  if (state === 'finished') a.finish();
  if (state === 'cancelled') a.cancel();
  await Promise.resolve();
  expect(token.remove).toHaveBeenCalledOnce();
});

it('fades the Freeze material at its card as one image, and greys only the coin face', () => {
  const frames: FrameRequestCallback[] = [], canvases: Canvas[] = [];
  class Canvas extends Control {
    style = {}; dataset: Record<string, string> = {}; className = ''; width = 0; height = 0; alphas: number[] = [];
    context = { globalAlpha: 1, setTransform() {}, drawImage: (_: unknown) => { this.alphas.push(this.context.globalAlpha); } };
    getContext() { return this.context; }
    setAttribute() {}
    remove() { this.isConnected = false; }
  }
  const paint = new Control(), coin = Object.assign(new Control(), { id: 'card-w-0', querySelector: () => paint, getBoundingClientRect: () => ({ left: 10, top: 10, width: 142, height: 142 }) });
  const host = { querySelector: () => null, append() {}, getBoundingClientRect: () => ({ left: 0, top: 0 }) } as unknown as HTMLElement;
  Object.assign(document, { createElement: () => { const canvas = new Canvas(); canvases.push(canvas); return canvas; }, getElementById: () => coin });
  vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => frames.push(fn));
  vi.stubGlobal('devicePixelRatio', 1);
  castRelease(new UiMotion(), host, coin as unknown as HTMLElement, 'Freeze', 1000);
  expect(coin.animate).not.toHaveBeenCalled();
  expect(paint.animate).toHaveBeenCalledOnce();
  const [layer] = canvases, clock = animations[1];
  for (const ms of [375, 499]) { clock.currentTime = ms; frames.shift()!(ms); }
  // 0.86 x (1 - smoothstep((ms - 125) / 375)) at 0, 375 and 499 ms.
  expect(layer.alphas[0]).toBe(.86);
  expect(layer.alphas[1]).toBeCloseTo(.223, 3);
  expect(layer.alphas[2]).toBeLessThan(.001);
  expect(vi.mocked(drawFreeze).mock.calls.map(call => call[1].progress)).toEqual([0, 0, .32, .32, .32, .32]);
});
