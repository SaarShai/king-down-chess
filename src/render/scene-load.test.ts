import { afterEach, expect, it, vi } from 'vitest';
import { createScene, type PaintedScene } from '../../docs/2d-first-pieces/board/scene.mjs';
import * as pieces from '../rules/engine';
import { fromFen } from '../rules/setup';

const isClip = (src: string) => /\/(tap|slam)(?:-[\w-]+)?\.webp/.test(src);
let scene: PaintedScene;

function board(motion: boolean, characterRuntime = false) {
  vi.useFakeTimers();
  const images: Art[] = [], draws: string[] = [];
  let decodeBoard = () => {};
  const decoded = new Promise<void>(resolve => { decodeBoard = resolve; });
  class Art {
    naturalWidth = 0; width = 1152; height = 1152; complete = false;
    onload?: () => void;
    onerror?: () => void;
    private url = '';
    set src(src: string) {
      this.url = src; images.push(this);
      if (!isClip(src) && !src.includes('runtime-deferred')) void Promise.resolve().then(() => this.finish());
    }
    get src() { return this.url; }
    finish(fail = false) { this.complete = true; this.naturalWidth = fail ? 0 : 1152; (fail ? this.onerror : this.onload)?.(); }
    decode() { return this.src.includes('stone-board') ? decoded : Promise.resolve(); }
  }
  const context: object = new Proxy({}, { get: (target, key) => key === 'drawImage'
    ? (image: Art) => { if (image.src) draws.push(image.src); }
    : key === 'getImageData' || key === 'createImageData' ? () => ({ data: new Uint8ClampedArray(4) })
    : key in target ? Reflect.get(target, key) : () => context });
  const canvas = () => ({ width: 960, height: 1024, getContext: () => context });
  vi.stubGlobal('Image', Art);
  vi.stubGlobal('DOMMatrix', class { scale() { return this; } });
  vi.stubGlobal('document', { createElement: canvas });
  vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => setTimeout(() => fn(performance.now()), 16));
  vi.stubGlobal('cancelAnimationFrame', clearTimeout);
  scene = createScene({ canvas: canvas() as unknown as HTMLCanvasElement, pieces, characterRuntime, kings: ['frost', 'flame'] });
  scene.setPosition(fromFen('4k3/8/8/8/8/8/8/1N2K2R w - - 0 1'));
  scene.setLively({ idle: true, atmosphere: true });
  scene.setReducedMotion(!motion);
  return { images, draws, decodeBoard, clips: () => images.filter(image => isClip(image.src)) };
}

afterEach(() => { scene?.dispose(); vi.useRealTimers(); vi.unstubAllGlobals(); });

it.each([false, true])('F7: the board is ready with stalled clips (motion %s), after stone decode', async motion => {
  const b = board(motion), ready = vi.fn();
  void scene.load().then(ready);
  await vi.advanceTimersByTimeAsync(0);
  expect(ready).not.toHaveBeenCalled();
  expect(scene.frames).toBe(0);
  b.decodeBoard();
  await vi.advanceTimersByTimeAsync(0);
  expect(ready).toHaveBeenCalledOnce();
  expect(b.clips()).toHaveLength(0);
  await vi.advanceTimersByTimeAsync(16);
  expect(scene.frames).toBe(1);
  expect(b.draws.some(src => src.includes('stone-board'))).toBe(true);
  expect(b.draws.some(src => src.includes('knight'))).toBe(true);
  expect(scene.drawnKings).toEqual(['frost', 'flame']);
  expect(b.clips()).toHaveLength(0);
  await vi.advanceTimersByTimeAsync(16);
  expect(b.clips()).toHaveLength(motion ? 2 : 0);
});

it.each(['late', 'failed'] as const)('F7: a %s clip keeps the plain figure and a move works', async result => {
  const b = board(false);
  void scene.load(); b.decodeBoard();
  await vi.advanceTimersByTimeAsync(16);
  scene.setSelected(1);
  await vi.advanceTimersByTimeAsync(16);
  expect(b.clips()).toHaveLength(0);
  scene.setReducedMotion(false);
  expect(b.clips()).toHaveLength(2);
  // A partial image can have a width before its load ends.
  for (const image of b.clips()) image.naturalWidth = 1152;
  scene.setSelected(null); scene.setSelected(1);
  await vi.advanceTimersByTimeAsync(16);
  expect(scene.clip).toBeNull();
  for (const image of b.clips()) image.finish(result === 'failed');
  await vi.advanceTimersByTimeAsync(64);
  expect(scene.clip).toBeNull(); // A late sheet does not start in the middle of a selection.
  scene.setSelected(null); scene.setSelected(1);
  await vi.advanceTimersByTimeAsync(32);
  expect(scene.clip?.name ?? null).toBe(result === 'late' ? 'knight' : null);
  scene.setSelected(null); scene.setSelected(7);
  await vi.advanceTimersByTimeAsync(32);
  expect(scene.clip?.name ?? null).toBe(result === 'late' ? 'rook' : null);
  const moving = scene.play({ from: 7, to: 15, captures: [] });
  await vi.advanceTimersByTimeAsync(2000);
  await expect(moving).resolves.toBe(true);
  scene.setReducedMotion(true); scene.setReducedMotion(false);
  expect(b.clips()).toHaveLength(2);
});

it('F7: disposal before the first frame starts no clip load', async () => {
  const b = board(true);
  void scene.load(); b.decodeBoard();
  await vi.advanceTimersByTimeAsync(0);
  scene.dispose();
  await vi.advanceTimersByTimeAsync(100);
  expect(b.clips()).toHaveLength(0);
});

it('reduced motion cancels a ready-body action while its frame load is pending', async () => {
 const base={character:'knight',army:'white',canvasSize:[768,768],pivot:[384,700],bodyHeightPx:600,registrationHeightPx:600,boardScale:null};
 const idle={...base,id:'white-idle',kind:'idle',facing:'SE',durationMs:2000,frames:[{url:'runtime-rest.png',timeMs:0}]};
 const turn={...base,id:'white-turn-SE-NE',kind:'turn',from:'SE',to:'NE',durationMs:120,frames:[{url:'runtime-rest.png',timeMs:0},{url:'runtime-deferred.png',timeMs:120}]};
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,turn]})})));
 const b=board(true,true);void scene.load();b.decodeBoard();await vi.advanceTimersByTimeAsync(32);
 expect(scene.characterFrames.some(frame=>frame.square===1)).toBe(true);
 const contact=vi.fn(),playing=scene.play({from:1,to:18,captures:[]},{onContact:contact});await vi.advanceTimersByTimeAsync(0);
 const deferred=b.images.find(image=>image.src.includes('runtime-deferred'));expect(deferred).toBeDefined();expect(scene.animating).toBe(true);
 scene.setReducedMotion(true);await expect(playing).resolves.toBe(false);deferred!.finish();await vi.advanceTimersByTimeAsync(3000);
 expect(scene.animating).toBe(false);expect(scene.playing).toBeNull();expect(contact).not.toHaveBeenCalled();expect(scene.characterFrames.find(frame=>frame.square===1)?.time).toBe(0);
});
