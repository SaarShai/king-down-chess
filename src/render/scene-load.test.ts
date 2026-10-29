import { afterEach, expect, it, vi } from 'vitest';
import { createScene, type PaintedScene } from '../../docs/2d-first-pieces/board/scene.mjs';
import * as pieces from '../rules/engine';
import { fromFen } from '../rules/setup';

const isClip = (src: string) => /\/(tap|slam)(?:-[\w-]+)?\.webp/.test(src);
let scene: PaintedScene;

function board(motion: boolean, characterRuntime = false, largeRuntime = false, refreshMs = 16) {
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
    finish(fail = false) { this.complete = true; this.naturalWidth = fail ? 0 : largeRuntime && this.src.includes('runtime-') ? 2048 : 1152; if(largeRuntime && this.src.includes('runtime-'))this.height=2048; (fail ? this.onerror : this.onload)?.(); }
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
  vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => setTimeout(() => fn(performance.now()), refreshMs));
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

it('draws the movement endpoint across a straddled refresh on a move and its reverse', async () => {
 const base={character:'pawn',army:'white',canvasSize:[768,768],pivot:[384,700],bodyHeightPx:600,registrationHeightPx:600};
 const idle={...base,id:'idle',kind:'idle',facing:'N',durationMs:200,frames:[{url:'runtime-rest.png',timeMs:0}]};
 const turn={...base,id:'turn',kind:'turn',from:'N',to:'S',durationMs:120,frames:[{url:'runtime-rest.png',timeMs:0},{url:'runtime-turn.png',timeMs:120}]};
 const movements=['N','S'].map(facing=>({...base,id:`move-${facing}`,kind:'movement',facing,durationMs:200,frames:[0,100,200].map(timeMs=>({url:`runtime-${facing}-${timeMs}.png`,timeMs}))}));
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,turn,...movements]})})));
 const b=board(true,true);scene.setPosition(fromFen('4k3/8/8/8/8/8/P7/4K3 w - - 0 1'));void scene.load();b.decodeBoard();await vi.advanceTimersByTimeAsync(32);
 const forward=scene.play({from:8,to:16,captures:[]});await vi.advanceTimersByTimeAsync(0);
 await vi.advanceTimersByTimeAsync(432);expect(scene.characterFrames.find(f=>f.square===8)).toMatchObject({bank:'move-N',time:100});expect(scene.animating).toBe(true);
 await vi.advanceTimersByTimeAsync(16);expect(scene.characterFrames.find(f=>f.square===8)).toMatchObject({bank:'move-N',time:200});expect(scene.animating).toBe(true);
 await vi.advanceTimersByTimeAsync(16);await expect(forward).resolves.toBe(true);
 scene.setPosition(fromFen('4k3/8/8/8/8/P7/8/4K3 b - - 0 1'));
 const reverse=scene.play({from:16,to:8,captures:[]});await vi.advanceTimersByTimeAsync(0);
 await vi.advanceTimersByTimeAsync(528);expect(scene.characterFrames.find(f=>f.square===16)).toMatchObject({bank:'move-S',time:100});
 await vi.advanceTimersByTimeAsync(32);expect(scene.characterFrames.find(f=>f.square===16)).toMatchObject({bank:'move-S',time:200});
 await vi.advanceTimersByTimeAsync(16);expect(scene.characterFrames.find(f=>f.square===16)).toMatchObject({bank:'turn'});
 await vi.advanceTimersByTimeAsync(200);await expect(reverse).resolves.toBe(true);
});

it.each(['no turn','incoming turn'] as const)('draws the first movement frame at the boundary with %s', async route => {
 const base={character:'pawn',army:'white',canvasSize:[768,768],pivot:[384,700],bodyHeightPx:600,registrationHeightPx:600};
 const idle={...base,id:'idle',kind:'idle',facing:route==='no turn'?'N':'S',durationMs:200,frames:[{url:'runtime-rest.png',timeMs:0}]};
 const turn={...base,id:'turn',kind:'turn',from:'S',to:'N',durationMs:120,frames:[{url:'runtime-rest.png',timeMs:0},{url:'runtime-turn.png',timeMs:120}]};
 const movement={...base,id:'move',kind:'movement',facing:'N',durationMs:200,frames:[0,1,200].map(timeMs=>({url:`runtime-move-${timeMs}.png`,timeMs}))};
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,turn,movement]})})));
 const b=board(true,true);scene.setPosition(fromFen('4k3/8/8/8/8/8/P7/4K3 w - - 0 1'));void scene.load();b.decodeBoard();await vi.advanceTimersByTimeAsync(32);
 const origin=scene.characterFrames.find(f=>f.square===8)!.foot;
 const playing=scene.play({from:8,to:16,captures:[]});await vi.advanceTimersByTimeAsync(0);
 if(route==='incoming turn'){await vi.advanceTimersByTimeAsync(128);expect(scene.characterFrames.find(f=>f.square===8)).toMatchObject({bank:'turn'});}
 await vi.advanceTimersByTimeAsync(16);expect(scene.characterFrames.find(f=>f.square===8)).toMatchObject({bank:'move',time:0,foot:origin});expect(b.draws.some(src=>src.endsWith('/runtime-move-0.png'))).toBe(true);
 await vi.advanceTimersByTimeAsync(16);expect(scene.characterFrames.find(f=>f.square===8)).toMatchObject({bank:'move',time:1});
 await vi.advanceTimersByTimeAsync(1000);await expect(playing).resolves.toBe(true);
});

it.each(['no turn','incoming turn'] as const)('keeps both movement endpoints when a refresh skips the full action with %s', async route => {
 const base={character:'pawn',army:'white',canvasSize:[768,768],pivot:[384,700],bodyHeightPx:600,registrationHeightPx:600};
 const idle={...base,id:'idle',kind:'idle',facing:route==='no turn'?'N':'S',durationMs:200,frames:[{url:'runtime-rest.png',timeMs:0}]};
 const turn={...base,id:'turn',kind:'turn',from:'S',to:'N',durationMs:120,frames:[{url:'runtime-rest.png',timeMs:0},{url:'runtime-turn.png',timeMs:120}]};
 const movement={...base,id:'move',kind:'movement',facing:'N',durationMs:200,frames:[0,1,200].map(timeMs=>({url:`runtime-move-${timeMs}.png`,timeMs}))};
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,turn,movement]})})));
 const b=board(true,true,false,600);scene.setPosition(fromFen('4k3/8/8/8/8/8/P7/4K3 w - - 0 1'));void scene.load();b.decodeBoard();await vi.advanceTimersByTimeAsync(600);
 const playing=scene.play({from:8,to:16,captures:[]});await vi.advanceTimersByTimeAsync(0);
 await vi.advanceTimersByTimeAsync(600);expect(scene.characterFrames.find(f=>f.square===8)).toMatchObject({bank:'move',time:0});expect(b.draws.some(src=>src.endsWith('/runtime-move-0.png'))).toBe(true);expect(scene.animating).toBe(true);
 await vi.advanceTimersByTimeAsync(600);expect(scene.characterFrames.find(f=>f.square===8)).toMatchObject({bank:'move',time:200});expect(b.draws.some(src=>src.endsWith('/runtime-move-200.png'))).toBe(true);expect(scene.animating).toBe(true);
 await vi.advanceTimersByTimeAsync(1200);await expect(playing).resolves.toBe(true);
});

it.each(['cancel','replace'] as const)('releases prepared movement endpoints after %s before the first draw', async change => {
 const base={army:'white',canvasSize:[768,768],pivot:[384,700],bodyHeightPx:600,registrationHeightPx:600};
 const idle={...base,character:'pawn',id:'idle',kind:'idle',facing:'N',durationMs:200,frames:[{url:'runtime-rest.png',timeMs:0}]};
 const movement={...idle,id:'move',kind:'movement',frames:[{url:'runtime-first.png',timeMs:0},{url:'runtime-last.png',timeMs:200}]};
 const others=['knight','bishop','rook','queen'].map(character=>({...idle,character,id:character,frames:[{url:`runtime-${character}.png`,timeMs:0}]}));
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,movement,...others]})})));
 const b=board(true,true,true);scene.setPosition(fromFen('4k3/8/8/8/8/8/P7/4K3 w - - 0 1'));void scene.load();b.decodeBoard();await vi.advanceTimersByTimeAsync(32);
 const playing=scene.play({from:8,to:16,captures:[]});await vi.advanceTimersByTimeAsync(0);
 expect(b.images.some(image=>image.src.includes('runtime-last.png'))).toBe(true);
 if(change==='cancel')scene.cancel();else void scene.play({from:8,to:24,captures:[]});
 await expect(playing).resolves.toBe(false);
 scene.setPosition(fromFen('4k3/8/8/8/8/8/8/1NBRQ2K w - - 0 1'));await vi.advanceTimersByTimeAsync(32);
 for(const bank of ['knight','bishop','rook','queen'])expect(scene.characterFrames.some(frame=>frame.bank===bank)).toBe(true);
 expect(scene.characterMemory.peakBytes).toBeLessThanOrEqual(64*1024*1024);
});

it.each(['cancel','replace'] as const)('ignores a held movement load after %s', async change => {
 const base={character:'pawn',army:'white',canvasSize:[768,768],pivot:[384,700],bodyHeightPx:600,registrationHeightPx:600};
 const idle={...base,id:'idle',kind:'idle',facing:'N',durationMs:200,frames:[{url:'runtime-rest.png',timeMs:0}]};
 const movement={...base,id:'move',kind:'movement',facing:'N',durationMs:200,frames:[{url:'runtime-deferred.png',timeMs:0}]};
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,movement]})})));
 const b=board(true,true);scene.setPosition(fromFen('4k3/8/8/8/8/8/P7/4K3 w - - 0 1'));void scene.load();b.decodeBoard();await vi.advanceTimersByTimeAsync(32);
 const first=scene.play({from:8,to:16,captures:[]});await vi.advanceTimersByTimeAsync(0);
 const held=b.images.find(image=>image.src.includes('runtime-deferred'));expect(held).toBeDefined();
 let replacement: Promise<boolean> | undefined;
 if(change==='cancel')scene.cancel();else replacement=scene.play({from:8,to:24,captures:[]});
 await expect(first).resolves.toBe(false);held!.finish();await vi.advanceTimersByTimeAsync(32);
 expect(scene.characterFrames.find(f=>f.square===8)?.bank).not.toBe('move');
 if(replacement){expect(scene.animating).toBe(true);await vi.advanceTimersByTimeAsync(1000);await expect(replacement).resolves.toBe(true);}else expect(scene.animating).toBe(false);
 expect(scene.characterMemory.peakBytes).toBeLessThanOrEqual(64*1024*1024);
});

it.each(['position', 'kings', 'cancel'] as const)('restores a selected Stratus idle after a %s refresh and exits from its drawn frame', async refresh => {
 const base={character:'king-stratus',army:'white',canvasSize:[384,384],pivot:[192,345],bodyHeightPx:267,registrationHeightPx:267,boardScale:null};
 const idle={...base,id:'stratus-idle',kind:'idle',facing:'SE',durationMs:400,frames:[{url:'runtime-rest.png',timeMs:0},{url:'runtime-raised.png',timeMs:100},{url:'runtime-rest.png',timeMs:400}]};
 const turn={...base,id:'stratus-turn',kind:'turn',from:'SE',to:'N',durationMs:120,frames:[{url:'runtime-rest.png',timeMs:0},{url:'runtime-turn.png',timeMs:120}]};
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,turn]})})));
 const b=board(true,true);scene.setKings(['stratus','flame']);void scene.load();b.decodeBoard();await vi.advanceTimersByTimeAsync(32);
 scene.setSelected(4);await vi.advanceTimersByTimeAsync(160);expect(scene.characterFrames.find(frame=>frame.square===4)?.time).toBe(100);
 if(refresh==='position')scene.setPosition(fromFen('4k3/8/8/8/8/8/8/1N2K2R w - - 0 1'));else if(refresh==='kings')scene.setKings(['stratus','frost']);else scene.cancel();
 scene.setSelected(4);
 let raised=false;for(let i=0;i<40&&!raised;i++){await vi.advanceTimersByTimeAsync(16);raised=scene.characterFrames.find(frame=>frame.square===4)?.time===100;}
 expect(raised).toBe(true);
 scene.setSelected(null);const playing=scene.play({from:4,to:12,captures:[]});await vi.advanceTimersByTimeAsync(32);
 expect(scene.characterExit).not.toBeNull();expect(scene.characterFrames.find(frame=>frame.square===4)?.time).toBe(100);
 await vi.advanceTimersByTimeAsync(2000);await expect(playing).resolves.toBe(true);
});

it.each(['position', 'kings'] as const)('ignores a late Stratus reservation after %s removes the selected king', async refresh => {
 const base={character:'king-stratus',army:'white',canvasSize:[384,384],pivot:[192,345],bodyHeightPx:267,registrationHeightPx:267,boardScale:null};
 const idle={...base,id:'stratus-idle',kind:'idle',facing:'SE',durationMs:400,frames:[{url:'runtime-rest.png',timeMs:0},{url:'runtime-deferred.png',timeMs:100},{url:'runtime-rest.png',timeMs:400}]};
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle]})})));
 const b=board(true,true);scene.setKings(['stratus','flame']);void scene.load();b.decodeBoard();await vi.advanceTimersByTimeAsync(32);scene.setSelected(4);await vi.advanceTimersByTimeAsync(32);
 const deferred=b.images.find(image=>image.src.includes('runtime-deferred'));expect(deferred).toBeDefined();
 if(refresh==='position')scene.setPosition(fromFen('4k3/8/8/8/8/8/4K3/1N5R w - - 0 1'));else scene.setKings(['frost','flame']);
 deferred!.finish();await vi.advanceTimersByTimeAsync(500);expect(scene.characterFrames.some(frame=>frame.square===4)).toBe(false);
 if(refresh==='kings'){
  scene.setKings(['stratus','flame']);let raised=false;for(let i=0;i<40&&!raised;i++){await vi.advanceTimersByTimeAsync(16);raised=scene.characterFrames.find(frame=>frame.square===4)?.time===100;}expect(raised).toBe(true);
 }
});


it.each(['selection', 'kings'] as const)('cancels an active Stratus exit when %s changes', async change => {
 const base={character:'king-stratus',army:'white',canvasSize:[384,384],pivot:[192,345],bodyHeightPx:267,registrationHeightPx:267,boardScale:null};
 const idle={...base,id:'stratus-idle',kind:'idle',facing:'SE',durationMs:400,frames:[{url:'runtime-rest.png',timeMs:0},{url:'runtime-raised.png',timeMs:100},{url:'runtime-rest.png',timeMs:400}]};
 const turn={...base,id:'stratus-turn',kind:'turn',from:'SE',to:'N',durationMs:120,frames:[{url:'runtime-rest.png',timeMs:0},{url:'runtime-turn.png',timeMs:120}]};
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,turn]})})));
 const b=board(true,true);scene.setKings(['stratus','flame']);void scene.load();b.decodeBoard();await vi.advanceTimersByTimeAsync(32);scene.setSelected(4);await vi.advanceTimersByTimeAsync(160);
 expect(scene.characterFrames.find(frame=>frame.square===4)?.time).toBe(100);scene.setSelected(null);const playing=scene.play({from:4,to:12,captures:[]});await vi.advanceTimersByTimeAsync(32);expect(scene.characterExit).not.toBeNull();
 if(change==='selection')scene.setSelected(1);else scene.setKings(['frost','flame']);
 await expect(playing).resolves.toBe(false);await vi.advanceTimersByTimeAsync(1000);expect(scene.animating).toBe(false);expect(scene.playing).toBeNull();expect(scene.characterExit).toBeNull();
});

it.each(['position', 'kings', 'cancel'] as const)('keeps the last painted Stratus body for an immediate move after %s', async refresh => {
 const base={character:'king-stratus',army:'white',canvasSize:[384,384],pivot:[192,345],bodyHeightPx:267,registrationHeightPx:267,boardScale:null};
 const idle={...base,id:'stratus-idle',kind:'idle',facing:'SE',durationMs:400,frames:[{url:'runtime-rest.png',timeMs:0},{url:'runtime-raised.png',timeMs:100},{url:'runtime-rest.png',timeMs:400}]};
 const turn={...base,id:'stratus-turn',kind:'turn',from:'SE',to:'N',durationMs:120,frames:[{url:'runtime-rest.png',timeMs:0},{url:'runtime-turn.png',timeMs:120}]};
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,turn]})})));
 const b=board(true,true);scene.setKings(['stratus','flame']);void scene.load();b.decodeBoard();await vi.advanceTimersByTimeAsync(32);scene.setSelected(4);await vi.advanceTimersByTimeAsync(160);
 expect(scene.characterFrames.find(frame=>frame.square===4)?.time).toBe(100);
 if(refresh==='position')scene.setPosition(fromFen('4k3/8/8/8/8/8/8/1N2K2R w - - 0 1'));else if(refresh==='kings')scene.setKings(['stratus','frost']);else scene.cancel();
 scene.setSelected(4);scene.setSelected(null);const playing=scene.play({from:4,to:12,captures:[]});await vi.advanceTimersByTimeAsync(32);
 expect(scene.characterExit).not.toBeNull();expect(scene.characterFrames.find(frame=>frame.square===4)?.time).toBe(100);await vi.advanceTimersByTimeAsync(2000);await expect(playing).resolves.toBe(true);
});

it('starts a Stratus idle when a position refresh puts that king on the selected square', async () => {
 const base={character:'king-stratus',army:'white',canvasSize:[384,384],pivot:[192,345],bodyHeightPx:267,registrationHeightPx:267,boardScale:null};
 const idle={...base,id:'stratus-idle',kind:'idle',facing:'SE',durationMs:400,frames:[{url:'runtime-rest.png',timeMs:0},{url:'runtime-raised.png',timeMs:100},{url:'runtime-rest.png',timeMs:400}]};
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle]})})));
 const b=board(true,true);scene.setKings(['stratus','flame']);void scene.load();b.decodeBoard();await vi.advanceTimersByTimeAsync(32);scene.setSelected(1);
 scene.setPosition(fromFen('4k3/8/8/8/8/8/8/1K5R w - - 0 1'));scene.setSelected(1);
 let raised=false;for(let i=0;i<40&&!raised;i++){await vi.advanceTimersByTimeAsync(16);raised=scene.characterFrames.find(frame=>frame.square===1)?.time===100;}expect(raised).toBe(true);
});
