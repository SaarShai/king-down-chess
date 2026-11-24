import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

type Body = { image: object; pivot: number[]; bank: string; canvasSize: number[] };
const body = (bank: string): Body => ({ image: {}, pivot: [192, 350], bank, canvasSize: [384, 384] });
const runtime = { ready: vi.fn(async () => {}), warm: vi.fn(async () => {}), rest: vi.fn((): Body | null => body('one')), idleDuration: () => 2000, dispose: vi.fn() };
const create = vi.fn((_options: { fetcher: typeof fetch }) => runtime);
vi.mock('../../render/painted/character-runtime.mjs', () => ({ createCharacterRuntime: (options: { fetcher: typeof fetch }) => create(options) }));
vi.mock('../../render/painted/piece-stills.mjs', () => ({ PIECE_STILLS: { archer: { white: { size: [184, 326], pivot: [97, 323] } } } }));
const { portraitIdle } = await import('./portrait-idle');

let canvases: { style: Record<string, string>; on: boolean }[], painted: number, frames: FrameRequestCallback[], media: () => void;
beforeEach(() => {
  vi.useFakeTimers(); vi.clearAllMocks();
  runtime.ready.mockImplementation(async () => {}); runtime.rest.mockImplementation(() => body('one'));
  canvases = []; painted = 0; frames = []; media = () => {};
  vi.stubGlobal('document', { hidden: false, createElement: () => {
    const canvas = { style: {}, on: false, setAttribute() {}, getContext: () => ({ clearRect() {}, drawImage() { painted++; } }), remove() { canvas.on = false; } };
    canvases.push(canvas); return canvas;
  } });
  vi.stubGlobal('matchMedia', () => ({ addEventListener: (_: string, run: () => void) => { media = run; }, removeEventListener() { media = () => {}; } }));
  vi.stubGlobal('requestAnimationFrame', (run: FrameRequestCallback) => frames.push(run)); vi.stubGlobal('cancelAnimationFrame', () => { frames = []; });
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
const picture = (src = '/ui/pieces/archer-w.webp') => ({ style: { visibility: '' }, isConnected: true, clientWidth: 170, clientHeight: 220, offsetLeft: 100, offsetTop: 0,
  getAttribute: () => src, after: (canvas: typeof canvases[number]) => { canvas.on = true; } });
const play = (image = picture(), calm = () => false) => ({ image, stop: portraitIdle(image as unknown as HTMLImageElement, calm, 400) });
const pass = async (ms: number) => { await vi.advanceTimersByTimeAsync(ms); for (const run of frames.splice(0)) run(performance.now()); };
const shows = (image: ReturnType<typeof picture>) => [!!canvases[0]?.on, image.style.visibility, runtime.dispose.mock.calls.length];

it('plays one clip one time, 400 ms after it starts, over a still that keeps its box', async () => {
  const { image } = play();
  await pass(390); expect(shows(image)).toEqual([false, '', 0]);
  await pass(20); await pass(16);
  expect(shows(image)).toEqual([true, 'hidden', 0]);
  // The figure stands where its still stands: pivot 97,323 of a 184x326 still, shown 124x220 in the 170x220 box.
  const k = 220 / 326;
  expect(parseFloat(canvases[0].style.left)).toBeCloseTo(100 + (170 - 184 * k) / 2 + (97 - 192) * k);
  expect(parseFloat(canvases[0].style.top)).toBeCloseTo((323 - 350) * k);
  expect(parseFloat(canvases[0].style.width)).toBeCloseTo(384 * k);
  await pass(1900); expect(shows(image)).toEqual([true, 'hidden', 0]);
  await pass(200); expect(shows(image)).toEqual([false, '', 1]);
  const drawn = painted; await pass(30000);
  expect([painted, runtime.dispose.mock.calls.length]).toEqual([drawn, 1]);
});
it('ends at the second clip of a figure with two', async () => {
  const { image } = play();
  await pass(400); await pass(16); expect(shows(image)).toEqual([true, 'hidden', 0]);
  runtime.rest.mockImplementation(() => body('two'));
  await pass(16); expect(shows(image)).toEqual([false, '', 1]);
});
it('starts nothing with reduced motion, for a picture that is no figure, or for an unknown figure', async () => {
  play(picture(), () => true); play(picture('/cards/haste.webp')); play(picture('/ui/pieces/nobody-w.webp'));
  await pass(1000);
  expect([create.mock.calls.length, canvases.length]).toEqual([0, 0]);
});
it.each([
  ['a package that fails', () => { runtime.ready.mockRejectedValue(new Error('no package')); }],
  ['a figure that does not load', () => { runtime.rest.mockReturnValue(null); }],
])('%s leaves the still and shows no error', async (_name, fail) => {
  fail();
  const { image } = play();
  await pass(400); await pass(16);
  expect(shows(image)).toEqual([false, '', 1]);
});
it('a close before the start or in the clip, a hidden page, and reduced motion in the clip restore the still', async () => {
  const early = play(); await pass(100); early.stop(); await pass(1000);
  expect(shows(early.image)).toEqual([false, '', 1]);
  let calm = false;
  for (const end of [(stop: () => void) => stop(), () => media(), () => { calm = true; }, () => { (document as { hidden: boolean }).hidden = true; }]) {
    vi.clearAllMocks(); canvases = []; calm = false; (document as { hidden: boolean }).hidden = false;
    const { image, stop } = play(picture(), () => calm);
    await pass(400); await pass(16); expect(shows(image)).toEqual([true, 'hidden', 0]);
    end(stop); await pass(16);
    expect(shows(image)).toEqual([false, '', 1]);
    stop(); expect(runtime.dispose).toHaveBeenCalledOnce();
  }
});
it('a close stops the requests of the figure that still run', async () => {
  const request = vi.fn((_url: string, _options?: RequestInit) => new Promise<Response>(() => {}));
  vi.stubGlobal('fetch', request);
  const { stop } = play();
  void create.mock.lastCall![0].fetcher('/character-runtime/index.json');
  const signal = request.mock.lastCall![1]!.signal!;
  expect([request.mock.lastCall![0], signal.aborted]).toEqual(['/character-runtime/index.json', false]);
  stop(); expect(signal.aborted).toBe(true);
});
it('only the Guide asks for the clip, and only when a figure entry opens', () => {
  const guide = readFileSync(new URL('./guide.ts', import.meta.url), 'utf8');
  expect(guide).toContain("import('./portrait-idle')");
  expect(guide).not.toMatch(/^import .*portrait-idle/m);
  expect(readFileSync(new URL('./menus.css', import.meta.url), 'utf8')).toContain('.play-portrait-idle { position: absolute;');
});
