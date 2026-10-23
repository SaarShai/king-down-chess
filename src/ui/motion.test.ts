import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { handoff, UiMotion } from './motion';

let now: number, pace: string, hidden: boolean, reduced: boolean;
let documentEvents: EventTarget, media: EventTarget;
let settingsChanged: () => void;
let animations: ReturnType<typeof animation>[];
function animation() {
  let finish!: () => void, reject!: () => void;
  const finished = new Promise<void>((resolve, no) => { finish = resolve; reject = no; });
  return { currentTime: 0, finished, finish, cancel: vi.fn(() => reject()) };
}
class Control {
  isConnected = true;
  animate = vi.fn((_frames: Keyframe[], _options: KeyframeAnimationOptions) => { const a = animation(); animations.push(a); return a; });
  contains(target: unknown) { return target === this; }
}
beforeEach(() => {
  now = 1000; pace = 'normal'; hidden = reduced = false; animations = [];
  documentEvents = new EventTarget(); media = new EventTarget();
  vi.spyOn(performance, 'now').mockImplementation(() => now);
  vi.stubGlobal('document', {
    get hidden() { return hidden; }, documentElement: { dataset: { get pace() { return pace; } } },
    addEventListener: documentEvents.addEventListener.bind(documentEvents), removeEventListener: documentEvents.removeEventListener.bind(documentEvents),
  });
  vi.stubGlobal('matchMedia', () => ({ get matches() { return reduced; }, addEventListener: media.addEventListener.bind(media), removeEventListener: media.removeEventListener.bind(media) }));
  vi.stubGlobal('MutationObserver', class { constructor(callback: () => void) { settingsChanged = callback; } observe() {} disconnect() {} });
  vi.stubGlobal('Node', Control);
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const element = () => new Control() as unknown as Element;

it('seeks a rebuilt control to its original onset and never replays a finished onset', async () => {
  const motion = new UiMotion(), first = element(), next = element();
  motion.reveal(first, 400, 12, 100, 1000);
  now = 1250; first.remove?.(); (first as unknown as Control).isConnected = false;
  motion.reveal(next, 400, 12, 100, 1000);
  expect(animations[0].cancel).toHaveBeenCalledOnce();
  expect(animations[1].currentTime).toBe(250);
  now = 1500;
  motion.reveal(next, 400, 12, 100, 1000);
  expect(animations).toHaveLength(2);
  animations[1].finish(); await Promise.resolve();
  expect(animations[1].cancel).toHaveBeenCalledOnce();
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
