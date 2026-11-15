// Stage "speed" (docs/specs/interface-speed): the new board shows when the stone base and the rest stills are ready.
// With lazySheets the art that the first frame does not draw starts after that frame, and the stills and the board
// art load in the page's own mode (no CORS), so each file loads once. Without the option (the old screens, the
// plugin) the scene asks for the same files at the same points as before, in CORS mode.
// Each test imports fresh modules: the after-board gate and the module sheets are page-wide, once per page.
import { readFileSync } from 'node:fs';
import { afterEach, expect, it, vi } from 'vitest';
import * as pieces from '../rules/engine';
import { fromFen } from '../rules/setup';

interface Requested { src: string; cors: string | null }
const isStill = (src: string) => src.includes('/ui/pieces/');
const isStone = (src: string) => src.includes('/board-art/stone-board.webp');
const isLegacySheet = (src: string) => /\/2d-first-pieces\/(?:king-\w+\/king|[\w-]+\/(?:beast|queen|paladin|maester|pawn|archer|ogre|knight|bishop|rook|guard))\.webp$/.test(src);

it('the new page starts the required surface and piece images before it waits for board code', () => {
  const main = readFileSync(new URL('../interface/play/main.ts', import.meta.url), 'utf8');
  const start = main.slice(main.indexOf('async function start('), main.indexOf('try { await loadBoardCode(); }'));
  expect(start).toContain('resumed?.draft.position ?? next.game.pos');
  expect(start).toContain('resumed?.game.context.rules ?? next.game.context.rules');
  expect(start).toContain('new Set(position.board)');
  expect(start).toContain("link.rel = 'preload'; link.as = 'image'; link.href = href");
  expect(start).toContain('const files = [skinUrl,');
  expect(start).not.toContain('link.crossOrigin');
  expect(start).toContain("link.fetchPriority = 'high'");
  expect(start).toContain('!firstArt.has(href)');
});

async function scene(options: { lazySheets?: boolean; kings?: [string, string]; initialBoardArt?: string; failBoardArt?: boolean }) {
  vi.resetModules(); vi.useFakeTimers();
  const requested: Requested[] = [];
  let decodeStone = () => {};
  let rejectStone = (_error: Error) => {};
  const stone = new Promise<void>((resolve, reject) => { decodeStone = resolve; rejectStone = reject; });
  class Art {
    naturalWidth = 0; width = 64; height = 64; complete = false; crossOrigin: string | null = null;
    onload?: () => void; onerror?: () => void;
    private url = '';
    set src(src: string) { this.url = src; requested.push({ src, cors: this.crossOrigin }); void Promise.resolve().then(() => { if (options.failBoardArt && (isStone(src) || src === options.initialBoardArt)) { this.onerror?.(); return; } this.complete = true; this.naturalWidth = 64; this.onload?.(); }); }
    get src() { return this.url; }
    decode() { return (options.initialBoardArt ? this.url === options.initialBoardArt : isStone(this.url)) ? stone : Promise.resolve(); }
  }
  const context: object = new Proxy({}, { get: (_, key) => key === 'getImageData' || key === 'createImageData' ? () => ({ data: new Uint8ClampedArray(4) }) : () => context });
  const canvas = () => ({ width: 960, height: 1024, getContext: () => context });
  vi.stubGlobal('addEventListener', () => {}); vi.stubGlobal('removeEventListener', () => {});
  vi.stubGlobal('Image', Art); vi.stubGlobal('DOMMatrix', class { scale() { return this; } });
  vi.stubGlobal('document', { createElement: canvas });
  vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => setTimeout(() => fn(performance.now()), 16));
  vi.stubGlobal('cancelAnimationFrame', clearTimeout);
  const fetcher = vi.fn((url: string) => String(url).endsWith('/index.json')
    ? Promise.resolve({ ok: true, json: async () => ({ schemaVersion: 2, effects: {}, parts: { 'knight:white': 'parts/knight.white.json', 'king-frost:black': 'parts/king-frost.black.json' } }) })
    : new Promise(() => {}));
  vi.stubGlobal('fetch', fetcher);
  const { createScene } = await import('./painted/scene.mjs');
  const made = createScene({ canvas: canvas() as unknown as HTMLCanvasElement, pieces, characterRuntime: true, kings: (options.kings ?? ['frost', 'frost']) as never, lazySheets: options.lazySheets, initialBoardArt: options.initialBoardArt });
  made.setPosition(fromFen('4k3/8/8/8/8/8/8/1N2K3 w - - 0 1'));
  const fetched = () => fetcher.mock.calls.map(([url]) => String(url));
  return { scene: made, requested, fetched, decodeStone, rejectStone };
}
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.doUnmock('./painted/scene.mjs'); vi.doUnmock('./effects/dark-gate'); });

it('an initial surface replaces the stone request and the first frame waits for its decode', async () => {
  const url = '/interface/stone-refined-light.webp', s = await scene({ lazySheets: true, initialBoardArt: url });
  let loaded = false; void s.scene.load().then(() => { loaded = true; });
  await vi.advanceTimersByTimeAsync(1);
  expect(s.requested.filter(r => r.src === url)).toEqual([{ src: url, cors: null }]);
  expect(s.requested.some(r => isStone(r.src))).toBe(false);
  expect(loaded).toBe(false); expect(s.scene.frames).toBe(0);
  s.decodeStone(); await vi.advanceTimersByTimeAsync(17);
  expect(loaded).toBe(true); expect(s.scene.frames).toBe(1);
  s.scene.dispose();
});

it.each(['/interface/stone-refined-light.webp', undefined])('a failed surface %s rejects only with the option; the old stone fallback stays', async initialBoardArt => {
  const s = await scene({ lazySheets: true, initialBoardArt, failBoardArt: true });
  if (initialBoardArt) await expect(s.scene.load()).rejects.toBeUndefined();
  else await expect(s.scene.load()).resolves.toBeUndefined();
  s.scene.dispose();
});

it.each(['/interface/stone-refined-light.webp', undefined])('a failed decode of %s rejects only with the option', async initialBoardArt => {
  const s = await scene({ lazySheets: true, initialBoardArt }), loaded = s.scene.load();
  const result = initialBoardArt ? expect(loaded).rejects.toThrow('decode failed') : expect(loaded).resolves.toBeUndefined();
  await vi.advanceTimersByTimeAsync(1); s.rejectStone(new Error('decode failed')); await result;
  s.scene.dispose();
});

it('lazySheets: before the first frame only the stone base and the rest stills load; the sheets, the effect art and the parts start after it', async () => {
  const s = await scene({ lazySheets: true });
  void s.scene.load(); s.decodeStone(); await vi.advanceTimersByTimeAsync(1);
  expect(s.scene.frames).toBe(0);
  const before = s.requested.map(r => r.src);
  expect(before.some(isStone)).toBe(true); expect(before.some(isStill)).toBe(true);
  expect(before.filter(src => !isStone(src) && !isStill(src))).toEqual([]);
  expect(s.fetched().filter(url => !url.endsWith('/index.json'))).toEqual([]);
  await vi.advanceTimersByTimeAsync(16); // the first frame
  expect(s.scene.frames).toBe(1);
  expect(s.requested.map(r => r.src).filter(src => !isStone(src) && !isStill(src))).toEqual([]);
  await vi.advanceTimersByTimeAsync(40); // the frame after it
  const after = s.requested.map(r => r.src);
  for (const sheet of ['/wind-bands.webp', '/shadow-rift.webp', '/knight/knight.webp', '/king-frost/king.webp']) expect(after.some(src => src.endsWith(sheet))).toBe(true);
  expect(s.fetched().some(url => url.endsWith('/footprints.json'))).toBe(true);
  expect(s.fetched().some(url => url.endsWith('/parts/king-frost.black.json'))).toBe(true);
  s.scene.dispose();
});

it('no option (the old screens): the wind and rift sheets load when the scene is made, and load() asks for the sheets at once', async () => {
  const s = await scene({});
  const made = s.requested.map(r => r.src);
  expect(made.some(src => src.endsWith('/wind-bands.webp'))).toBe(true);
  expect(made.some(src => src.endsWith('/shadow-rift.webp'))).toBe(true);
  void s.scene.load();
  const loading = s.requested.map(r => r.src);
  expect(loading.some(src => src.endsWith('/knight/knight.webp'))).toBe(true);
  expect(loading.some(src => src.endsWith('/king-frost/king.webp'))).toBe(true);
  s.scene.dispose();
});

it.each([[true, null], [false, 'anonymous']])('lazySheets %s: the stills and the board art load in mode %s', async (lazy, cors) => {
  const s = await scene({ lazySheets: lazy });
  void s.scene.load(); s.decodeStone(); await vi.advanceTimersByTimeAsync(60);
  await s.scene.setBoardArt('/interface/stone-refined-light.webp');
  const stills = s.requested.filter(r => isStill(r.src)), art = s.requested.find(r => r.src === '/interface/stone-refined-light.webp')!;
  expect(stills.length).toBeGreaterThan(0);
  expect(new Set(stills.map(r => r.cors))).toEqual(new Set([cors]));
  expect(art.cors).toBe(cors);
  expect(s.requested.filter(r => isLegacySheet(r.src)).every(r => r.cors === 'anonymous')).toBe(true); // the sheets keep CORS
  s.scene.dispose();
});

it.each([true, false])('lazySheets %s: the sheet of a king that comes into play waits for the first frame only with the option', async lazy => {
  const s = await scene({ lazySheets: lazy });
  s.scene.setKings(['stratus', 'mud']);
  const asked = () => s.requested.some(r => r.src.endsWith('/king-stratus/king.webp'));
  expect(asked()).toBe(!lazy);
  void s.scene.load(); s.decodeStone(); await vi.advanceTimersByTimeAsync(60);
  expect(asked()).toBe(true);
  s.scene.dispose();
});

it.each([true, false])('PaintedView lazySheets %s: the Darkness art waits for the board gate only with the option', async lazy => {
  vi.resetModules();
  const loadDarkGate = vi.fn();
  vi.doMock('./effects/dark-gate', async original => ({ ...await original<object>(), loadDarkGate }));
  vi.doMock('./painted/scene.mjs', () => ({ createScene: () => new Proxy({ load: () => new Promise(() => {}) }, { get: (t: Record<string, unknown>, k: string) => k in t ? t[k] : () => {} }) }));
  const el = () => ({ style: {}, classList: { add() {}, toggle() {} }, addEventListener() {}, appendChild() {}, getContext: () => new Proxy({}, { get: () => () => {} }) });
  vi.stubGlobal('document', { createElement: el, addEventListener() {}, hidden: false });
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {} }));
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.stubGlobal('requestAnimationFrame', () => 0);
  const { PaintedView } = await import('./PaintedView'), { GameRules } = await import('../game-rules'), { boardReady } = await import('./painted/after-board.mjs');
  const view = new PaintedView(el() as unknown as HTMLElement, { lazySheets: lazy });
  view.setRules(new GameRules({ kings: [{ king: 'Shadow', power: 'Darkness' }, null] }));
  expect(loadDarkGate).toHaveBeenCalledTimes(lazy ? 0 : 1);
  boardReady();
  expect(loadDarkGate).toHaveBeenCalledTimes(1);
  view.dispose();
});

it('the board picture of the new page is the same 1024 px picture, lossy, at 150 kB or less', () => {
  const file = readFileSync(new URL('../../public/interface/stone-refined-light.webp', import.meta.url));
  expect(file.length).toBeLessThanOrEqual(150_000);
  expect(file.toString('latin1', 0, 4)).toBe('RIFF'); expect(file.toString('latin1', 8, 16)).toBe('WEBPVP8 ');
  // VP8 key frame: the sizes follow the start code 9d 01 2a (14 bits each).
  const start = file.indexOf(Buffer.from([0x9d, 0x01, 0x2a]));
  expect([file.readUInt16LE(start + 3) & 0x3fff, file.readUInt16LE(start + 5) & 0x3fff]).toEqual([1024, 1024]);
});

it('the board picture is smaller than the stone base: on a shared link it arrives first, so the first frame has it', () => {
  const picture = readFileSync(new URL('../../public/interface/stone-refined-light.webp', import.meta.url)).length;
  const stone = readFileSync(new URL('../../docs/2d-first-pieces/board-art/stone-board.webp', import.meta.url)).length;
  expect(picture).toBeLessThan(stone);
});

it('the new page uses its prepared picture as the first surface and waits for the board frame', () => {
  const main = readFileSync(new URL('../interface/play/main.ts', import.meta.url), 'utf8');
  const loaded = /const loaded = .*/.exec(main)?.[0] ?? '';
  expect(loaded).toMatch(/board\.ready\(\)/);
  expect(main).toContain('initialBoardArt: skinUrl');
  expect(main).toContain('skinUrl = `${SKIN}?retry=${generation}`');
  expect(main).not.toContain('applySkin');
});
