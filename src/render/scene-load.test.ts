import { afterEach, expect, it, vi } from 'vitest';
import { createScene, type PaintedScene } from '../../docs/2d-first-pieces/board/scene.mjs';
import * as pieces from '../rules/engine';
import { fromFen } from '../rules/setup';

const isClip = (src: string) => /\/(tap|slam)(?:-[\w-]+)?\.webp/.test(src);
let scene: PaintedScene;

function board(motion: boolean, characterRuntime = false, largeRuntime = false, refreshMs = 16) {
  vi.useFakeTimers();
  const images: Art[] = [], draws: string[] = [], drawArgs: {src:string; args:number[]}[] = [], clouds: number[] = [], rotations: number[] = [];
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
    ? (image: Art, ...args: number[]) => { if (image.src) { draws.push(image.src); drawArgs.push({src:image.src,args}); } if (image.src?.includes('cloud-bank.png') && args.length === 4) clouds.push(Reflect.get(target, 'globalAlpha')); }
    : key === 'rotate' ? (angle: number) => { rotations.push(angle); }
    : key === 'getImageData' || key === 'createImageData' ? () => ({ data: new Uint8ClampedArray(4) })
    : key in target ? Reflect.get(target, key) : () => context });
  const canvas = () => ({ width: 960, height: 1024, getContext: () => context });
  vi.stubGlobal('addEventListener', () => {});
  vi.stubGlobal('removeEventListener', () => {});
  vi.stubGlobal('Image', Art);
  vi.stubGlobal('DOMMatrix', class { scale() { return this; } });
  vi.stubGlobal('document', { createElement: canvas });
  vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => setTimeout(() => fn(performance.now()), refreshMs));
  vi.stubGlobal('cancelAnimationFrame', clearTimeout);
  scene = createScene({ canvas: canvas() as unknown as HTMLCanvasElement, pieces, characterRuntime, kings: ['frost', 'flame'] });
  scene.setPosition(fromFen('4k3/8/8/8/8/8/8/1N2K2R w - - 0 1'));
  scene.setLively({ idle: true, atmosphere: true });
  scene.setReducedMotion(!motion);
  return { images, draws, drawArgs, clouds, rotations, decodeBoard, clips: () => images.filter(image => isClip(image.src)) };
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

it('starts character downloads after the first board frame', async () => {
 const fetcher=vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[]})}));
 vi.stubGlobal('fetch',fetcher);
 const b=board(true,true);void scene.load();
 await vi.advanceTimersByTimeAsync(0);expect(fetcher).not.toHaveBeenCalled();
 b.decodeBoard();await vi.advanceTimersByTimeAsync(16);
 expect(scene.frames).toBe(1);expect(b.draws.some(src=>src.includes('stone-board'))).toBe(true);expect(fetcher).not.toHaveBeenCalled();
 await vi.advanceTimersByTimeAsync(16);expect(fetcher).toHaveBeenCalledOnce();
});

it('waits for page load before starting character downloads', async () => {
 const fetcher=vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[]})}));
 vi.stubGlobal('fetch',fetcher);
 const b=board(true,true);let onLoad=()=>{};
 Object.assign(document,{readyState:'interactive'});
 vi.stubGlobal('addEventListener',(name:string,fn:()=>void)=>{if(name==='load')onLoad=fn;});vi.stubGlobal('removeEventListener',()=>{});
 void scene.load();b.decodeBoard();await vi.advanceTimersByTimeAsync(32);
 expect(scene.frames).toBeGreaterThan(0);expect(fetcher).not.toHaveBeenCalled();
 onLoad();await vi.advanceTimersByTimeAsync(0);expect(fetcher).toHaveBeenCalledOnce();
});

it('starts after load even if a worker install never becomes ready', async () => {
 const fetcher=vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[]})}));
 vi.stubGlobal('fetch',fetcher);
 const b=board(true,true), listeners=new Map<string,(event?: any)=>void>();
 Object.assign(document,{readyState:'interactive'});
 vi.stubGlobal('navigator',{serviceWorker:{ready:new Promise(()=>{})}});
 vi.stubGlobal('addEventListener',(name:string,fn:(event?: any)=>void)=>listeners.set(name,fn));
 void scene.load();b.decodeBoard();await vi.advanceTimersByTimeAsync(32);
 expect(fetcher).not.toHaveBeenCalled();expect(listeners.has('load')).toBe(true);
 listeners.get('load')!();await vi.advanceTimersByTimeAsync(0);expect(fetcher).toHaveBeenCalledOnce();
 listeners.get('pageshow')!({persisted:true});await vi.advanceTimersByTimeAsync(0);expect(fetcher).toHaveBeenCalledOnce();
});

it('starts at once on an already loaded page and on a restored page', async () => {
 const fetcher=vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[]})}));vi.stubGlobal('fetch',fetcher);
 const b=board(true,true);Object.assign(document,{readyState:'complete'});
 void scene.load();b.decodeBoard();await vi.advanceTimersByTimeAsync(32);expect(fetcher).toHaveBeenCalledOnce();
});

it('starts on a restored page when load did not run', async () => {
 const fetcher=vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[]})}));vi.stubGlobal('fetch',fetcher);
 const b=board(true,true),listeners=new Map<string,(event?: any)=>void>();Object.assign(document,{readyState:'interactive'});
 vi.stubGlobal('addEventListener',(name:string,fn:(event?: any)=>void)=>listeners.set(name,fn));
 void scene.load();b.decodeBoard();await vi.advanceTimersByTimeAsync(32);expect(fetcher).not.toHaveBeenCalled();
 listeners.get('pageshow')!({persisted:true});await vi.advanceTimersByTimeAsync(0);expect(fetcher).toHaveBeenCalledOnce();
 listeners.get('load')!();await vi.advanceTimersByTimeAsync(0);expect(fetcher).toHaveBeenCalledOnce();
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
 const b=board(true,true);void scene.load();b.decodeBoard();await vi.advanceTimersByTimeAsync(48);
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
 const b=board(true,true);scene.setPosition(fromFen('4k3/8/8/8/8/8/P7/4K3 w - - 0 1'));void scene.load();b.decodeBoard();await vi.advanceTimersByTimeAsync(48);
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

it('draws a padded movement canvas at the rest pivot and scale', async () => {
 const idle={character:'pawn',army:'white',id:'idle',kind:'idle',facing:'N',canvasSize:[768,768],pivot:[384,700],bodyHeightPx:600,registrationHeightPx:600,durationMs:200,frames:[{url:'runtime-rest.png',timeMs:0}]};
 const movement={...idle,id:'move',kind:'movement',canvasSize:[968,968],pivot:[484,800],durationMs:200,frames:[0,200].map(timeMs=>({url:`runtime-padded-${timeMs}.png`,timeMs}))};
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,movement]})})));
 const b=board(true,true);scene.setPosition(fromFen('4k3/8/8/8/8/8/P7/4K3 w - - 0 1'));void scene.load();b.decodeBoard();await vi.advanceTimersByTimeAsync(48);
 const rest=scene.characterFrames.find(f=>f.square===8)!;
 const playing=scene.play({from:8,to:16,captures:[]});await vi.advanceTimersByTimeAsync(16);
 const move=scene.characterFrames.find(f=>f.square===8)!;
 expect(move).toMatchObject({bank:'move',time:0,foot:rest.foot,scale:rest.scale,pivot:[484,800]});
 expect(b.drawArgs.slice().reverse().find(d=>d.src.endsWith('/runtime-padded-0.png'))?.args).toEqual([-484,-800]);
 expect(b.drawArgs.slice().reverse().find(d=>d.src.endsWith('/runtime-rest.png'))?.args).toEqual([-384,-700]);
 await vi.advanceTimersByTimeAsync(1000);await expect(playing).resolves.toBe(true);
});

it.each(['no turn','incoming turn'] as const)('draws the first movement frame at the boundary with %s', async route => {
 const base={character:'pawn',army:'white',canvasSize:[768,768],pivot:[384,700],bodyHeightPx:600,registrationHeightPx:600};
 const idle={...base,id:'idle',kind:'idle',facing:route==='no turn'?'N':'S',durationMs:200,frames:[{url:'runtime-rest.png',timeMs:0}]};
 const turn={...base,id:'turn',kind:'turn',from:'S',to:'N',durationMs:120,frames:[{url:'runtime-rest.png',timeMs:0},{url:'runtime-turn.png',timeMs:120}]};
 const movement={...base,id:'move',kind:'movement',facing:'N',durationMs:200,frames:[0,1,200].map(timeMs=>({url:`runtime-move-${timeMs}.png`,timeMs}))};
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,turn,movement]})})));
 const b=board(true,true);scene.setPosition(fromFen('4k3/8/8/8/8/8/P7/4K3 w - - 0 1'));void scene.load();b.decodeBoard();await vi.advanceTimersByTimeAsync(48);
 const origin=scene.characterFrames.find(f=>f.square===8)!.foot;
 const playing=scene.play({from:8,to:16,captures:[]});await vi.advanceTimersByTimeAsync(0);
 if(route==='incoming turn'){await vi.advanceTimersByTimeAsync(112);expect(scene.characterFrames.find(f=>f.square===8)).toMatchObject({bank:'turn'});}
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
 const b=board(true,true,false,600);scene.setPosition(fromFen('4k3/8/8/8/8/8/P7/4K3 w - - 0 1'));void scene.load();b.decodeBoard();await vi.advanceTimersByTimeAsync(1800);
 const playing=scene.play({from:8,to:16,captures:[]});await vi.advanceTimersByTimeAsync(0);
 await vi.advanceTimersByTimeAsync(600);expect(scene.characterFrames.find(f=>f.square===8)).toMatchObject({bank:'move',time:0});expect(b.draws.some(src=>src.endsWith('/runtime-move-0.png'))).toBe(true);expect(scene.animating).toBe(true);
 await vi.advanceTimersByTimeAsync(600);expect(scene.characterFrames.find(f=>f.square===8)).toMatchObject({bank:'move',time:200});expect(b.draws.some(src=>src.endsWith('/runtime-move-200.png'))).toBe(true);expect(scene.animating).toBe(true);
 await vi.advanceTimersByTimeAsync(1200);await expect(playing).resolves.toBe(true);
});

it.each(['equal start times','overlapping end intervals'] as const)('draws the exact movement endpoints with %s', async condition => {
 const base={character:'pawn',army:'white',canvasSize:[768,768],pivot:[384,700],bodyHeightPx:600,registrationHeightPx:600};
 const idle={...base,id:'idle',kind:'idle',facing:'N',durationMs:200,frames:[{url:'runtime-rest.png',timeMs:0}]};
 const frames=condition==='equal start times'
  ? [{url:'runtime-first.png',timeMs:0},{url:'runtime-middle.png',timeMs:0},{url:'runtime-last.png',timeMs:200}]
  : [{url:'runtime-first.png',timeMs:0,visibleIntervalMs:[0,50]},{url:'runtime-middle.png',timeMs:50,visibleIntervalMs:[50,200]},{url:'runtime-last.png',timeMs:150,visibleIntervalMs:[150,199]}];
 const movement={...base,id:'move',kind:'movement',facing:'N',nearest:false,durationMs:200,frames};
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,movement]})})));
 const b=board(true,true,false,600);scene.setPosition(fromFen('4k3/8/8/8/8/8/P7/4K3 w - - 0 1'));void scene.load();b.decodeBoard();await vi.advanceTimersByTimeAsync(1800);
 const playing=scene.play({from:8,to:16,captures:[]});await vi.advanceTimersByTimeAsync(0);
 let drawn=b.draws.length;await vi.advanceTimersByTimeAsync(600);expect(b.draws.slice(drawn).some(src=>src.endsWith('/runtime-first.png'))).toBe(true);expect(scene.animating).toBe(true);
 drawn=b.draws.length;await vi.advanceTimersByTimeAsync(600);expect(b.draws.slice(drawn).some(src=>src.endsWith('/runtime-last.png'))).toBe(true);expect(scene.animating).toBe(true);
 await vi.advanceTimersByTimeAsync(600);await expect(playing).resolves.toBe(true);
});

it.each(['cancel','replace'] as const)('releases prepared movement endpoints after %s before the first draw', async change => {
 const base={army:'white',canvasSize:[768,768],pivot:[384,700],bodyHeightPx:600,registrationHeightPx:600};
 const idle={...base,character:'pawn',id:'idle',kind:'idle',facing:'N',durationMs:200,frames:[{url:'runtime-rest.png',timeMs:0}]};
 const movement={...idle,id:'move',kind:'movement',frames:[{url:'runtime-first.png',timeMs:0},{url:'runtime-last.png',timeMs:200}]};
 const others=['knight','bishop','rook','queen'].map(character=>({...idle,character,id:character,frames:[{url:`runtime-${character}.png`,timeMs:0}]}));
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,movement,...others]})})));
 const b=board(true,true,true);scene.setPosition(fromFen('4k3/8/8/8/8/8/P7/4K3 w - - 0 1'));void scene.load();b.decodeBoard();await vi.advanceTimersByTimeAsync(48);
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
 const b=board(true,true);scene.setPosition(fromFen('4k3/8/8/8/8/8/P7/4K3 w - - 0 1'));void scene.load();b.decodeBoard();await vi.advanceTimersByTimeAsync(48);
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
 const b=board(true,true);scene.setKings(['stratus','flame']);void scene.load();b.decodeBoard();await vi.advanceTimersByTimeAsync(48);
 // The lazy runtime starts after the first board frame, one 16 ms tick later.
 scene.setSelected(4);await vi.advanceTimersByTimeAsync(176);expect(scene.characterFrames.find(frame=>frame.square===4)?.time).toBe(100);
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
 const b=board(true,true);scene.setKings(['stratus','flame']);void scene.load();b.decodeBoard();await vi.advanceTimersByTimeAsync(48);scene.setSelected(4);await vi.advanceTimersByTimeAsync(32);
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
 const b=board(true,true);scene.setKings(['stratus','flame']);void scene.load();b.decodeBoard();await vi.advanceTimersByTimeAsync(48);scene.setSelected(4);await vi.advanceTimersByTimeAsync(176);expect(scene.characterFrames.find(frame=>frame.square===4)?.time).toBe(100);scene.setSelected(null);const playing=scene.play({from:4,to:12,captures:[]});await vi.advanceTimersByTimeAsync(32);expect(scene.characterExit).not.toBeNull();
 if(change==='selection')scene.setSelected(1);else scene.setKings(['frost','flame']);
 await expect(playing).resolves.toBe(false);await vi.advanceTimersByTimeAsync(1000);expect(scene.animating).toBe(false);expect(scene.playing).toBeNull();expect(scene.characterExit).toBeNull();
});

it.each(['position', 'kings', 'cancel'] as const)('keeps the last painted Stratus body for an immediate move after %s', async refresh => {
 const base={character:'king-stratus',army:'white',canvasSize:[384,384],pivot:[192,345],bodyHeightPx:267,registrationHeightPx:267,boardScale:null};
 const idle={...base,id:'stratus-idle',kind:'idle',facing:'SE',durationMs:400,frames:[{url:'runtime-rest.png',timeMs:0},{url:'runtime-raised.png',timeMs:100},{url:'runtime-rest.png',timeMs:400}]};
 const turn={...base,id:'stratus-turn',kind:'turn',from:'SE',to:'N',durationMs:120,frames:[{url:'runtime-rest.png',timeMs:0},{url:'runtime-turn.png',timeMs:120}]};
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,turn]})})));
 const b=board(true,true);scene.setKings(['stratus','flame']);void scene.load();b.decodeBoard();await vi.advanceTimersByTimeAsync(48);scene.setSelected(4);await vi.advanceTimersByTimeAsync(176);expect(scene.characterFrames.find(frame=>frame.square===4)?.time).toBe(100);
 if(refresh==='position')scene.setPosition(fromFen('4k3/8/8/8/8/8/8/1N2K2R w - - 0 1'));else if(refresh==='kings')scene.setKings(['stratus','frost']);else scene.cancel();
 scene.setSelected(4);scene.setSelected(null);const playing=scene.play({from:4,to:12,captures:[]});await vi.advanceTimersByTimeAsync(32);
 expect(scene.characterExit).not.toBeNull();expect(scene.characterFrames.find(frame=>frame.square===4)?.time).toBe(100);await vi.advanceTimersByTimeAsync(2000);await expect(playing).resolves.toBe(true);
});

it('starts a Stratus idle when a position refresh puts that king on the selected square', async () => {
 const base={character:'king-stratus',army:'white',canvasSize:[384,384],pivot:[192,345],bodyHeightPx:267,registrationHeightPx:267,boardScale:null};
 const idle={...base,id:'stratus-idle',kind:'idle',facing:'SE',durationMs:400,frames:[{url:'runtime-rest.png',timeMs:0},{url:'runtime-raised.png',timeMs:100},{url:'runtime-rest.png',timeMs:400}]};
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle]})})));
 const b=board(true,true);scene.setKings(['stratus','flame']);void scene.load();b.decodeBoard();await vi.advanceTimersByTimeAsync(48);scene.setSelected(1);
 scene.setPosition(fromFen('4k3/8/8/8/8/8/8/1K5R w - - 0 1'));scene.setSelected(1);
 let raised=false;for(let i=0;i<40&&!raised;i++){await vi.advanceTimersByTimeAsync(16);raised=scene.characterFrames.find(frame=>frame.square===1)?.time===100;}expect(raised).toBe(true);
});

it.each([
 ['white', '7k/8/8/3p4/4K3/8/8/7R w - - 0 1', 28, 35, 'NW'],
 ['black', '7r/8/8/4k3/3P4/8/8/K7 b - - 0 1', 36, 27, 'SW'],
] as const)('a %s king turns, holds the target, and returns after the capture', async (army, fen, from, to, direction) => {
 const base={character:'king-frost',army,canvasSize:[384,384],pivot:[192,345],bodyHeightPx:267,registrationHeightPx:267};
 const idle={...base,id:'idle',kind:'idle',facing:'SE',durationMs:400,frames:[{url:'runtime-rest.png',timeMs:0}]};
 const turn={...base,id:'turn',kind:'turn',from:'SE',to:direction,durationMs:120,frames:[{url:'runtime-rest.png',timeMs:0},{url:'runtime-target.png',timeMs:120}]};
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,turn]})})));
 const b=board(true,true);scene.setKings(['frost','frost']);scene.setPosition(fromFen(fen));void scene.load();b.decodeBoard();await vi.advanceTimersByTimeAsync(48);
 const rest=scene.characterFrames.find(f=>f.square===from)!;
 const contact=vi.fn(),playing=scene.play({from,to,captures:[to]},{onContact:contact});await vi.advanceTimersByTimeAsync(80);
 expect(scene.characterFrames.find(f=>f.square===from)).toMatchObject({bank:'turn',time:0});
 await vi.advanceTimersByTimeAsync(300);expect(scene.characterFrames.find(f=>f.square===from)).toMatchObject({bank:'turn',time:120});
 b.rotations.length=0;await vi.advanceTimersByTimeAsync(800);expect(scene.characterFrames.find(f=>f.square===from)).toMatchObject({bank:'turn',time:120});expect(contact).toHaveBeenCalledOnce();
 expect(b.rotations.some(angle=>Math.abs(angle)>.01)).toBe(true);
 await vi.advanceTimersByTimeAsync(220);expect(scene.characterFrames.find(f=>f.square===from)).toMatchObject({bank:'turn',time:0});
 await vi.advanceTimersByTimeAsync(200);await expect(playing).resolves.toBe(true);
 scene.cancel();await vi.advanceTimersByTimeAsync(32);
 expect(scene.characterFrames.find(f=>f.square===from)).toMatchObject({bank:rest.bank,time:rest.time,foot:rest.foot,pivot:rest.pivot,scale:rest.scale});
});

it.each(['cancel','reduced'] as const)('restores the king rest frame when a capture is stopped by %s', async stop => {
 const base={character:'king-frost',army:'white',canvasSize:[384,384],pivot:[192,345],bodyHeightPx:267,registrationHeightPx:267};
 const idle={...base,id:'idle',kind:'idle',facing:'SE',durationMs:400,frames:[{url:'runtime-rest.png',timeMs:0}]};
 const turn={...base,id:'turn',kind:'turn',from:'SE',to:'NW',durationMs:120,frames:[{url:'runtime-rest.png',timeMs:0},{url:'runtime-target.png',timeMs:120}]};
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,turn]})})));
 const b=board(true,true);scene.setPosition(fromFen('7k/8/8/3p4/4K3/8/8/7R w - - 0 1'));void scene.load();b.decodeBoard();await vi.advanceTimersByTimeAsync(48);
 const rest=scene.characterFrames.find(f=>f.square===28)!;
 const playing=scene.play({from:28,to:35,captures:[35]});await vi.advanceTimersByTimeAsync(300);
 if(stop==='cancel')scene.cancel();else scene.setReducedMotion(true);
 await expect(playing).resolves.toBe(false);await vi.advanceTimersByTimeAsync(32);
 expect(scene.characterFrames.find(f=>f.square===28)).toMatchObject({bank:rest.bank,time:rest.time,foot:rest.foot,pivot:rest.pivot,scale:rest.scale});
});

it('exits the raised Stratus idle before a capture even if the turn cannot load', async () => {
 const base={character:'king-stratus',army:'white',canvasSize:[384,384],pivot:[192,345],bodyHeightPx:267,registrationHeightPx:267};
 const idle={...base,id:'idle',kind:'idle',facing:'SE',durationMs:400,frames:[{url:'runtime-rest.png',timeMs:0},{url:'runtime-raised.png',timeMs:100},{url:'runtime-rest.png',timeMs:400}]};
 const turn={...base,id:'turn',kind:'turn',from:'SE',to:'NW',durationMs:120,frames:[{url:'runtime-rest.png',timeMs:0},{url:'runtime-deferred.png',timeMs:120}]};
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,turn]})})));
 const b=board(true,true);scene.setKings(['stratus','flame']);scene.setPosition(fromFen('7k/8/8/3p4/4K3/8/8/7R w - - 0 1'));void scene.load();b.decodeBoard();await vi.advanceTimersByTimeAsync(48);
 scene.setSelected(28);await vi.advanceTimersByTimeAsync(176);expect(scene.characterFrames.find(f=>f.square===28)?.time).toBe(100);
 scene.setSelected(null);const playing=scene.play({from:28,to:35,captures:[35]});await vi.advanceTimersByTimeAsync(1050);
 expect(scene.characterExit).not.toBeNull();await vi.advanceTimersByTimeAsync(250);
 expect(scene.characterFrames.find(f=>f.square===28)).toBeUndefined();
 await vi.advanceTimersByTimeAsync(1500);await expect(playing).resolves.toBe(true);
});

it.each(['cancel','reduced'] as const)('a Flame capture restores rest on %s', async stop => {
 const idle={character:'king-flame',army:'white',canvasSize:[384,384],pivot:[192,345],bodyHeightPx:267,registrationHeightPx:267,id:'idle',kind:'idle',facing:'SE',durationMs:400,frames:[{url:'runtime-rest.png',timeMs:0}]};
 const turn={...idle,id:'turn',kind:'turn',from:'SE',to:'NW',durationMs:120,frames:[{url:'runtime-rest.png',timeMs:0},{url:'runtime-target.png',timeMs:120}]};
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,turn]})})));
 const b=board(true,true);scene.setKings(['flame','frost']);scene.setPosition(fromFen('7k/8/8/3p4/4K3/8/8/7R w - - 0 1'));void scene.load();b.decodeBoard();await vi.advanceTimersByTimeAsync(48);
 const rest=scene.characterFrames.find(f=>f.square===28)!;
 const playing=scene.play({from:28,to:35,captures:[35]});await vi.advanceTimersByTimeAsync(300);
 expect(scene.characterFrames.find(f=>f.square===28)).toMatchObject({bank:'turn',time:120});
 if(stop==='cancel')scene.cancel();else scene.setReducedMotion(true);await expect(playing).resolves.toBe(false);await vi.advanceTimersByTimeAsync(32);
 expect(scene.characterFrames.find(f=>f.square===28)).toMatchObject({bank:rest.bank,time:rest.time,foot:rest.foot,pivot:rest.pivot,scale:rest.scale});
});

it.each([
  ['white', 4, 12, false], ['black', 60, 52, false],
  ['white', 4, 12, true], ['black', 60, 52, true],
] as const)('rewinds a pending %s Stratus move and settles promises (skip %s)', async (_army, from, to, skip) => {
 const b=board(true);scene.setKings(['stratus','stratus']);scene.setLively({kings:true});void scene.load();b.decodeBoard();await vi.advanceTimersByTimeAsync(48);
 const move={from,to,captures:[]},playing=scene.play(move);await vi.advanceTimersByTimeAsync(160);
 expect(scene.prepareUndo({from,to:from,captures:[]})).toBe(false);
 expect(scene.prepareUndo(move)).toBe(true);await expect(playing).resolves.toBe(false);
 const rewinding=scene.rewindUndo();await vi.advanceTimersByTimeAsync(32);
 if(skip)scene.cancel();else await vi.advanceTimersByTimeAsync(1000);
 await expect(rewinding).resolves.toBe(!skip);expect(scene.animating).toBe(false);
 const shown=scene as unknown as {position:{board:ArrayLike<number>}};expect(shown.position.board[from]).not.toBe(0);expect(shown.position.board[to]).toBe(0);
});

it('ignores a delayed body load after Undo interrupts preparation', async () => {
 const base={character:'king-stratus',army:'white',canvasSize:[384,384],pivot:[192,345],bodyHeightPx:267,registrationHeightPx:267,boardScale:null};
 const idle={...base,id:'stratus-idle',kind:'idle',facing:'SE',durationMs:400,frames:[{url:'runtime-rest.png',timeMs:0},{url:'runtime-rest.png',timeMs:400}]};
 const turn={...base,id:'stratus-turn',kind:'turn',from:'SE',to:'N',durationMs:120,frames:[{url:'runtime-rest.png',timeMs:0},{url:'runtime-deferred.png',timeMs:120}]};
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,turn]})})));
 const b=board(true,true);scene.setKings(['stratus','flame']);void scene.load();b.decodeBoard();await vi.advanceTimersByTimeAsync(80);
 const move={from:4,to:12,captures:[]},playing=scene.play(move);await vi.advanceTimersByTimeAsync(32);
 const deferred=b.images.find(image=>image.src.includes('runtime-deferred'));expect(deferred).toBeDefined();expect(scene.animating).toBe(true);
 expect(scene.prepareUndo(move)).toBe(true);await expect(playing).resolves.toBe(false);const rewind=scene.rewindUndo();await vi.advanceTimersByTimeAsync(32);await expect(rewind).resolves.toBe(true);
 deferred!.finish();await vi.advanceTimersByTimeAsync(1500);expect(scene.animating).toBe(false);expect(scene.playing).toBeNull();
});

it('cancels the rewind when a replacement position arrives', async () => {
 const b=board(true);scene.setKings(['stratus','flame']);void scene.load();b.decodeBoard();await vi.advanceTimersByTimeAsync(48);
 const move={from:4,to:12,captures:[]},playing=scene.play(move);await vi.advanceTimersByTimeAsync(160);expect(scene.prepareUndo(move)).toBe(true);await expect(playing).resolves.toBe(false);
 const rewind=scene.rewindUndo();await vi.advanceTimersByTimeAsync(32);const next=fromFen('4k3/8/8/8/8/8/4K3/1N5R w - - 0 1');scene.setPosition(next);
 await expect(rewind).resolves.toBe(false);await vi.advanceTimersByTimeAsync(1000);expect(scene.animating).toBe(false);
 const shown=scene as unknown as {position:{board:ArrayLike<number>}};expect(shown.position.board[4]).toBe(0);expect(shown.position.board[12]).not.toBe(0);
});

it('cancels a prepared-body rewind when reduced motion turns on', async () => {
 const base={character:'king-stratus',army:'white',canvasSize:[384,384],pivot:[192,345],bodyHeightPx:267,registrationHeightPx:267,boardScale:null};
 const idle={...base,id:'stratus-idle',kind:'idle',facing:'SE',durationMs:400,frames:[{url:'runtime-rest.png',timeMs:0},{url:'runtime-rest.png',timeMs:400}]};
 const turn={...base,id:'stratus-turn',kind:'turn',from:'SE',to:'N',durationMs:120,frames:[{url:'runtime-rest.png',timeMs:0},{url:'runtime-turn.png',timeMs:120}]};
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,turn]})})));
 const b=board(true,true);scene.setKings(['stratus','flame']);void scene.load();b.decodeBoard();await vi.advanceTimersByTimeAsync(80);
 const move={from:4,to:12,captures:[]},playing=scene.play(move);await vi.advanceTimersByTimeAsync(160);expect(scene.prepareUndo(move)).toBe(true);await expect(playing).resolves.toBe(false);
 const rewind=scene.rewindUndo();await vi.advanceTimersByTimeAsync(32);scene.setReducedMotion(true);await expect(rewind).resolves.toBe(false);await vi.advanceTimersByTimeAsync(1000);expect(scene.animating).toBe(false);expect(scene.playing).toBeNull();
});

it('keeps the drawn Stratus ground and cloud continuous as a move reverses', async () => {
 const base={character:'king-stratus',army:'white',canvasSize:[384,384],pivot:[192,345],bodyHeightPx:267,registrationHeightPx:267,boardScale:null};
 const idle={...base,id:'stratus-idle',kind:'idle',facing:'SE',durationMs:400,frames:[{url:'runtime-rest.png',timeMs:0},{url:'runtime-rest.png',timeMs:400}]};
 const turn={...base,id:'stratus-turn',kind:'turn',from:'SE',to:'N',durationMs:120,frames:[{url:'runtime-rest.png',timeMs:0},{url:'runtime-turn.png',timeMs:120}]};
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,turn]})})));
 const b=board(true,true);scene.setKings(['stratus','flame']);scene.setLively({kings:true});void scene.load();b.decodeBoard();await vi.advanceTimersByTimeAsync(1216);
 const source=scene.foot(4),move={from:4,to:12,captures:[]},playing=scene.play(move);await vi.advanceTimersByTimeAsync(160);
 const before=scene.characterFrames.find(frame=>frame.square===4)!.foot,cloudBefore=b.clouds.at(-1)!;
 expect(cloudBefore).toBeGreaterThan(0);expect(cloudBefore).toBeLessThan(1);
 expect(scene.prepareUndo(move)).toBe(true);await expect(playing).resolves.toBe(false);const rewind=scene.rewindUndo();await vi.advanceTimersByTimeAsync(16);
 const after=scene.characterFrames.find(frame=>frame.square===4)!.foot,cloudAfter=b.clouds.at(-1)!;
 const distance=(p:{x:number;y:number})=>Math.hypot(p.x-source.x,p.y-source.y);
 expect(distance(after)).toBeLessThanOrEqual(distance(before));expect(cloudAfter).toBeGreaterThanOrEqual(cloudBefore);expect(cloudAfter-cloudBefore).toBeLessThan(.13);
 await vi.advanceTimersByTimeAsync(1000);await expect(rewind).resolves.toBe(true);expect(distance(scene.characterFrames.find(frame=>frame.square===4)!.foot)).toBeLessThan(.001);
});

it('cancels a fallback rewind promptly when reduced motion turns on', async () => {
 const b=board(true);scene.setKings(['stratus','flame']);void scene.load();b.decodeBoard();await vi.advanceTimersByTimeAsync(48);
 const move={from:4,to:12,captures:[]},playing=scene.play(move);await vi.advanceTimersByTimeAsync(160);expect(scene.prepareUndo(move)).toBe(true);await expect(playing).resolves.toBe(false);
 const rewind=scene.rewindUndo();await vi.advanceTimersByTimeAsync(32);scene.setReducedMotion(true);await expect(rewind).resolves.toBe(false);expect(scene.animating).toBe(false);
});

it('starts a mid-travel rewind at the current ground instead of snapping home', async () => {
 const base={character:'king-stratus',army:'white',canvasSize:[384,384],pivot:[192,345],bodyHeightPx:267,registrationHeightPx:267,boardScale:null};
 const idle={...base,id:'stratus-idle',kind:'idle',facing:'SE',durationMs:400,frames:[{url:'runtime-rest.png',timeMs:0},{url:'runtime-rest.png',timeMs:400}]};
 const turn={...base,id:'stratus-turn',kind:'turn',from:'SE',to:'N',durationMs:120,frames:[{url:'runtime-rest.png',timeMs:0},{url:'runtime-turn.png',timeMs:120}]};
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,turn]})})));
 const b=board(true,true);scene.setKings(['stratus','flame']);void scene.load();b.decodeBoard();await vi.advanceTimersByTimeAsync(80);
 const source=scene.foot(4),move={from:4,to:12,captures:[]},playing=scene.play(move);await vi.advanceTimersByTimeAsync(300);
 const before=scene.characterFrames.find(frame=>frame.square===4)!.foot,distance=(p:{x:number;y:number})=>Math.hypot(p.x-source.x,p.y-source.y);expect(distance(before)).toBeGreaterThan(20);
 expect(scene.prepareUndo(move)).toBe(true);await expect(playing).resolves.toBe(false);const rewind=scene.rewindUndo();await vi.advanceTimersByTimeAsync(16);
 const after=scene.characterFrames.find(frame=>frame.square===4)!.foot;expect(distance(after)).toBeLessThanOrEqual(distance(before));expect(distance(after)).toBeGreaterThan(distance(before)*.5);
 await vi.advanceTimersByTimeAsync(1000);await expect(rewind).resolves.toBe(true);expect(distance(scene.characterFrames.find(frame=>frame.square===4)!.foot)).toBeLessThan(.001);
});

it('does not keep a completed rewind clock across a replacement position', async () => {
 const b=board(true);scene.setKings(['stratus','flame']);scene.setLively({kings:true});void scene.load();b.decodeBoard();await vi.advanceTimersByTimeAsync(1216);
 const move={from:4,to:12,captures:[]},playing=scene.play(move);await vi.advanceTimersByTimeAsync(160);expect(scene.prepareUndo(move)).toBe(true);await expect(playing).resolves.toBe(false);
 let beforeReplace=0,afterIndex=0;const rewind=scene.rewindUndo().then(done=>{beforeReplace=b.clouds.at(-1)!;scene.setPosition(fromFen('4k3/8/8/8/8/8/8/1N2K3 w - - 0 1'));afterIndex=b.clouds.length;return done;});
 await vi.advanceTimersByTimeAsync(1000);await expect(rewind).resolves.toBe(true);const replacement=b.clouds.slice(afterIndex);expect(beforeReplace).toBeGreaterThan(.9);expect(replacement.length).toBeGreaterThan(1);expect(replacement[0]).toBeLessThan(.1);expect(replacement.at(-1)).toBeGreaterThan(.9);
});

it('keeps a completed rewind clock when the same position is synchronized', async () => {
 const b=board(true);scene.setKings(['stratus','flame']);scene.setLively({kings:true});void scene.load();b.decodeBoard();await vi.advanceTimersByTimeAsync(1216);
 const position=(scene as unknown as {position:{board:ArrayLike<number>}}).position,move={from:4,to:12,captures:[]},playing=scene.play(move);await vi.advanceTimersByTimeAsync(160);
 expect(scene.prepareUndo(move)).toBe(true);await expect(playing).resolves.toBe(false);
 const rewind=scene.rewindUndo().then(done=>{scene.setPosition(position);return done;});
 await vi.advanceTimersByTimeAsync(1000);await expect(rewind).resolves.toBe(true);expect(b.clouds.at(-1)).toBeGreaterThan(.9);
});

it('clears a skipped rewind clock when the game is replaced', async () => {
 const b=board(true);scene.setKings(['stratus','flame']);scene.setLively({kings:true});void scene.load();b.decodeBoard();await vi.advanceTimersByTimeAsync(1216);
 const position=(scene as unknown as {position:{board:ArrayLike<number>}}).position,move={from:4,to:12,captures:[]},playing=scene.play(move);await vi.advanceTimersByTimeAsync(160);
 expect(scene.prepareUndo(move)).toBe(true);await expect(playing).resolves.toBe(false);const rewind=scene.rewindUndo();await vi.advanceTimersByTimeAsync(32);scene.cancel();await expect(rewind).resolves.toBe(false);
 scene.setPosition(position);await vi.advanceTimersByTimeAsync(32);expect(b.clouds.at(-1)).toBeGreaterThan(0);
 scene.resetKingEffects();scene.setPosition(fromFen('4k3/8/8/8/8/8/8/1N2K3 w - - 0 1'));await vi.advanceTimersByTimeAsync(32);expect(b.clouds.at(-1)).toBeLessThan(.1);
});

it('keeps a stationary king clock across an ordinary move after a skipped rewind', async () => {
 const b=board(true);scene.setKings(['stratus','flame']);scene.setLively({kings:true});void scene.load();b.decodeBoard();await vi.advanceTimersByTimeAsync(1216);
 const position=(scene as unknown as {position:{board:ArrayLike<number>}}).position,move={from:4,to:12,captures:[]},playing=scene.play(move);await vi.advanceTimersByTimeAsync(160);
 expect(scene.prepareUndo(move)).toBe(true);await expect(playing).resolves.toBe(false);const rewind=scene.rewindUndo();await vi.advanceTimersByTimeAsync(32);scene.cancel();await expect(rewind).resolves.toBe(false);
 scene.setPosition(position);await vi.advanceTimersByTimeAsync(32);const before=b.clouds.at(-1)!;
 const other=scene.play({from:1,to:18,captures:[]}).then(done=>{scene.setPosition(fromFen('4k3/8/8/8/8/2N5/8/4K2R w - - 0 1'));return done;});
 await vi.advanceTimersByTimeAsync(2000);await expect(other).resolves.toBe(true);expect(b.clouds.at(-1)).toBeGreaterThanOrEqual(before);
});

it('rewinds the last landed Stratus move from the drawn cloud and position', async () => {
 const base={character:'king-stratus',army:'white',canvasSize:[384,384],pivot:[192,345],bodyHeightPx:267,registrationHeightPx:267,boardScale:null};
 const idle={...base,id:'stratus-idle',kind:'idle',facing:'SE',durationMs:400,frames:[{url:'runtime-rest.png',timeMs:0},{url:'runtime-rest.png',timeMs:400}]};
 const turn={...base,id:'stratus-turn',kind:'turn',from:'SE',to:'N',durationMs:120,frames:[{url:'runtime-rest.png',timeMs:0},{url:'runtime-turn.png',timeMs:120}]};
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,turn]})})));
 const b=board(true,true);scene.setKings(['stratus','flame']);scene.setLively({kings:true});void scene.load();b.decodeBoard();await vi.advanceTimersByTimeAsync(1216);
 const pre=scene.position,move={from:4,to:12,captures:[]},playing=scene.play(move);await vi.advanceTimersByTimeAsync(1600);await expect(playing).resolves.toBe(true);
 const post=fromFen('4k3/8/8/8/8/8/4K3/1N5R b - - 0 1');scene.setPosition(post);await vi.advanceTimersByTimeAsync(500);
 const before=b.clouds.at(-1)!,end=scene.foot(12),source=scene.foot(4);expect(before).toBeGreaterThan(0);
 expect(scene.prepareUndo(move,pre)).toBe(true);const rewind=scene.rewindUndo();await vi.advanceTimersByTimeAsync(16);
 const first=scene.characterFrames.find(frame=>frame.square===4)!.foot;expect(Math.hypot(first.x-end.x,first.y-end.y)).toBeLessThan(1);
 expect(Math.abs(b.clouds.at(-1)!-before)).toBeLessThan(.08);
 await vi.advanceTimersByTimeAsync(240);const middle=scene.characterFrames.find(frame=>frame.square===4)!.foot;
 expect(Math.hypot(middle.x-source.x,middle.y-source.y)).toBeLessThan(Math.hypot(end.x-source.x,end.y-source.y));
 await vi.advanceTimersByTimeAsync(1200);await expect(rewind).resolves.toBe(true);expect(scene.position).toBe(pre);
});

it('does not retain a landed move after a different position or with reduced motion', async () => {
 const b=board(true);scene.setKings(['stratus','flame']);void scene.load();b.decodeBoard();await vi.advanceTimersByTimeAsync(48);
 const pre=scene.position,move={from:4,to:12,captures:[]},playing=scene.play(move);await vi.advanceTimersByTimeAsync(1000);await playing;
 const post=fromFen('4k3/8/8/8/8/8/4K3/1N5R b - - 0 1');scene.setPosition(post);scene.setReducedMotion(true);
 expect(scene.prepareUndo(move,pre)).toBe(false);scene.setReducedMotion(false);expect(scene.prepareUndo(move,pre)).toBe(false);
});

it('rejects a non-Stratus king and a different shown position', async () => {
 const b=board(true);scene.setKings(['frost','flame']);void scene.load();b.decodeBoard();await vi.advanceTimersByTimeAsync(48);
 const pre=scene.position,move={from:4,to:12,captures:[]},first=scene.play(move);await vi.advanceTimersByTimeAsync(160);
 expect(scene.prepareUndo(move,pre)).toBe(false);scene.cancel();await first;
 scene.setKings(['stratus','flame']);const playing=scene.play(move);await vi.advanceTimersByTimeAsync(1000);await playing;
 const post=fromFen('4k3/8/8/8/8/8/4K3/1N5R b - - 0 1');scene.setPosition(post);
 scene.setPosition(fromFen('4k3/8/8/8/8/8/8/1N2K2R w - - 0 1'));
 expect(scene.prepareUndo(move,pre)).toBe(false);
});

it('does not prepare a Stratus rewind when reduced motion is already on', async () => {
 const b=board(false);scene.setKings(['stratus','flame']);void scene.load();b.decodeBoard();await vi.advanceTimersByTimeAsync(48);
 const move={from:4,to:12,captures:[]},playing=scene.play(move);await vi.advanceTimersByTimeAsync(80);
 expect(scene.prepareUndo(move)).toBe(false);scene.cancel();await expect(playing).resolves.toBe(false);
});
