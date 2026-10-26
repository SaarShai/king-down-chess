import { afterAll, expect, it, vi } from 'vitest';

const harness = vi.hoisted(() => {
  const events = new Map<string, () => void>(), nodes = new Map<string, any>();
  const ctx: any = new Proxy({}, { get: (_, key) => key === 'createLinearGradient' ? () => ({ addColorStop() {} }) : () => {}, set: () => true });
  const element = () => ({ dataset: {}, textContent: '', value: '', checked: false, hidden: false, disabled: false, onclick: null, onchange: null, oninput: null, setAttribute() {}, getContext: () => ctx, getBoundingClientRect: () => ({ width: 500 }) });
  const node = (id: string) => { if (!nodes.has(id)) nodes.set(id, element()); return nodes.get(id); };
  const document = { hidden: false, createElement: element, getElementById: node, querySelector: node, addEventListener: (key: string, fn: () => void) => events.set(key, fn) };
  const scene = { setLively() {}, setReducedMotion() {}, setDecorate() {}, setPosition() {}, redraw() {}, setCoords() {}, setFlipped() {}, ghost() {}, dispose() {}, load: () => Promise.resolve(), foot: (sq: number) => ({ x: sq * 10, y: sq * 10 }), frames: 0 };
  return { events, node, document, scene, frame: null as null | ((time: number) => void), intersect: null as any, media: { matches: false, addEventListener: (_: string, fn: () => void) => events.set('media', fn) } };
});
vi.mock('/docs/2d-first-pieces/board/scene.mjs', () => ({ createScene: () => harness.scene }));
vi.stubGlobal('document', harness.document);
vi.stubGlobal('window', { addEventListener: (key: string, fn: () => void) => harness.events.set(key, fn) });
vi.stubGlobal('location', { search: '' });
vi.stubGlobal('matchMedia', () => harness.media);
vi.stubGlobal('requestAnimationFrame', (fn: (time: number) => void) => { harness.frame = fn; return 1; });
vi.stubGlobal('cancelAnimationFrame', () => { harness.frame = null; });
vi.stubGlobal('ResizeObserver', class { observe() {} });
vi.stubGlobal('IntersectionObserver', class { constructor(fn: unknown) { harness.intersect = fn; } observe() {} });
afterAll(() => vi.unstubAllGlobals());

it('keeps exact frames across toggles and stops on hidden, offscreen and reduced motion', async () => {
  await import('./main.js');
  await Promise.resolve();
  const api = (window as any).comparisonStudy;
  expect(api.ready).toBe(true);
  expect(api.getState()).toMatchObject({ sample: 'holy-light', progress: 1, playing: false });
  for (const sample of ['holy-light', 'mercy', 'Control', 'Mimic']) {
    harness.node('choose-' + sample).onclick();
    expect(api.getState()).toMatchObject({ sample, progress: 0, playing: true });
  }
  for (const sample of ['holy-light', 'mercy', 'Control', 'Mimic']) {
    api.select(sample); api.seek(.41); api.setVariant('current');
    expect(api.getState()).toMatchObject({ sample, variant: 'current', progress: .41, playing: false, fixtureLegal: true });
    api.setVariant('proposed');
    expect(api.getState()).toMatchObject({ sample, variant: 'proposed', progress: .41 });
    if (sample === 'Control' || sample === 'Mimic') expect(api.getState().lender).toBe('a1');
  }
  harness.node('replay').onclick(); expect(api.getState().playing).toBe(true);
  harness.document.hidden = true; harness.events.get('visibilitychange')!();
  expect(api.getState().playing).toBe(false); expect(harness.frame).toBeNull();
  harness.document.hidden = false;
  harness.node('replay').onclick(); harness.intersect([{ isIntersecting: false }]);
  expect(api.getState().playing).toBe(false);
  harness.intersect([{ isIntersecting: true }]);
  harness.node('replay').onclick(); harness.node('reduced').onchange({ target: { checked: true } });
  expect(api.getState()).toMatchObject({ reduced: true, progress: 1, playing: false });
  api.seek(.2); harness.node('replay').onclick();
  expect(api.getState()).toMatchObject({ reduced: true, progress: 1, playing: false });
  harness.node('reduced').onchange({ target: { checked: false } });
  harness.node('speed').onchange({ target: { value: '.35' } });
  expect(api.getState().speed).toBe(.35);
  harness.node('replay').onclick(); harness.frame!(100); harness.frame!(200);
  expect(api.getState().progress).toBeCloseTo(100 * .35 / 1700);
  harness.node('play').onclick(); expect(api.getState().playing).toBe(false);
  api.seek(-2); expect(api.getState().progress).toBe(0);
  api.seek(2); expect(api.getState().progress).toBe(1);
  harness.media.matches = true; harness.events.get('media')!();
  expect(api.getState()).toMatchObject({ reduced: true, progress: 1, playing: false });
  harness.events.get('pagehide')!(); expect(harness.frame).toBeNull();
});
