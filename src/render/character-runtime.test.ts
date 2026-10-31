import { describe, expect, it, vi } from 'vitest';
import { createCharacterRuntime, anchorAt, bankPointToWorld, idleBankAt, facingOf, frameAt, turnRoute, reverseRoute, type RuntimeBank } from '../../docs/2d-first-pieces/board/character-runtime.mjs';
const bank = (from = 'SE', to = 'S'): RuntimeBank => ({ id: `${from}-${to}`, character: 'pawn', army: 'white', kind: 'turn', from, to, facing: 'SE', durationMs: 120, nearest: true, pivot: [384,700], canvasSize: [768,768], bodyHeightPx: 600, registrationHeightPx: 600, frames: [0,60,120].map(timeMs => ({ url: `frame-${timeMs}`, timeMs })) });

describe('ready character playback', () => {
 it('releases idle downloads before a capture needs the loader', async () => {
  const idle={...bank(),id:'idle',kind:'idle',frames:[{url:'rest',timeMs:0},...Array.from({length:12},(_,i)=>({url:`idle-${i}`,timeMs:(i+1)*10})),{url:'rest',timeMs:140}]};
  const attack={...bank(),id:'attack',kind:'attack',facing:'SE',frames:[{url:'attack-0',timeMs:0},{url:'attack-1',timeMs:120}]};
  const started:string[]=[];
  const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,attack]})})) as unknown as typeof fetch,
   image:()=>{const img={naturalWidth:10,naturalHeight:10,onload:null as null|(()=>void),decode:async()=>{},removeAttribute:vi.fn(),set src(s:string){started.push(s);if(!s.includes('/idle-'))queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
  const reservation=runtime.reserveIdle('pawn','white');await vi.waitFor(()=>expect(started.filter(s=>s.includes('/idle-')).length).toBe(6));
  runtime.releaseIdle();expect(runtime.stats.active).toBe(0);const prepared=await runtime.prepare('pawn','white','SE',true);
  expect(await reservation).toBe(false);expect(prepared).not.toBeNull();expect(runtime.action(prepared,120,120,0)).toMatchObject({bank:'attack'});
  expect(started.filter(s=>s.includes('/idle-'))).toHaveLength(6);runtime.dispose();
 });
 it('prioritizes capture over shared idle prefetch and bounds the idle queue', async () => {
  const idle={...bank(),id:'idle',kind:'idle',durationMs:1000,frames:Array.from({length:100},(_,i)=>({url:`idle-${i}`,timeMs:i*10}))};
  const attack={...bank(),id:'attack',kind:'attack',facing:'SE',frames:[{url:'attack-0',timeMs:0},{url:'attack-1',timeMs:120}]};
  const started:string[]=[],finish:(()=>void)[]=[];
  const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,attack]})})) as unknown as typeof fetch,
   image:()=>{const img={naturalWidth:10,naturalHeight:10,onload:null as null|(()=>void),decode:async()=>{},removeAttribute:vi.fn(),set src(s:string){started.push(s);if(!s.includes('/idle-')||s.endsWith('/idle-0'))queueMicrotask(()=>img.onload?.());else finish.push(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
  await runtime.ready();void runtime.warm('pawn','white',true);await vi.waitFor(()=>expect(runtime.stats.active).toBe(5));
  for(let t=0;t<900;t+=10)runtime.rest('pawn','white',t,true);
  expect(runtime.stats.queued).toBeLessThanOrEqual(6);
  finish.slice(0,5).forEach(done=>done());await vi.waitFor(()=>expect(started.some(s=>s.endsWith('/idle-89'))).toBe(true));expect(started.some(s=>s.endsWith('/idle-20'))).toBe(false);
  const prepared=await runtime.prepare('pawn','white','SE',true);expect(prepared).not.toBeNull();expect(runtime.action(prepared,120,120,0)).toMatchObject({bank:'attack'});runtime.dispose();
 });
 it('bounds idle prefetch across distinct bodies when the loader is full', async () => {
  const banks=Array.from({length:4},(_,i)=>({...bank(),id:`idle-${i}`,character:`piece-${i}`,kind:'idle',durationMs:100,frames:Array.from({length:10},(_,j)=>({url:`piece-${i}-${j}`,timeMs:j*10}))}));
  const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks})})) as unknown as typeof fetch,
   image:()=>({naturalWidth:10,naturalHeight:10,onload:null,onerror:null,removeAttribute:vi.fn(),set src(_s:string){}} as unknown as HTMLImageElement)});
  await runtime.ready();void runtime.warm('piece-0','white',true);await vi.waitFor(()=>expect(runtime.stats.active).toBe(6));
  for(let i=1;i<4;i++)runtime.rest(`piece-${i}`,'white',50,true);
  expect(runtime.stats.queued).toBe(6);runtime.dispose();
 });
 it('drains synchronous image failures without re-entering the pump', async () => {
  const idle={...bank(),id:'idle',kind:'idle',frames:[...Array.from({length:10000},(_,i)=>({url:`frame-${i}`,timeMs:i})),{url:'frame-0',timeMs:10000}]};
  const held:(()=>void)[]=[];let count=0;
  const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle]})})) as unknown as typeof fetch,
   image:()=>{const img={onload:null as null|(()=>void),onerror:null as null|(()=>void),removeAttribute:vi.fn(),set src(_s:string){if(count++<6)held.push(()=>img.onerror?.());else img.onerror?.();}};return img as unknown as HTMLImageElement;}});
  const pending=runtime.reserveIdle('pawn','white');await vi.waitFor(()=>expect(runtime.stats.active).toBe(6));
  held[0]();expect(runtime.stats.queued).toBe(0);runtime.dispose();await pending;
 });
 it('keeps slow idle downloads alive until deselection', async () => {
  vi.useFakeTimers();
  try{
   const idle={...bank(),id:'idle',character:'king-stratus',kind:'idle',frames:[{url:'rest',timeMs:0},...Array.from({length:6},(_,i)=>({url:`idle-${i}`,timeMs:(i+1)*10})),{url:'rest',timeMs:140}]};
   const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle]})})) as unknown as typeof fetch,
    image:()=>{const img={naturalWidth:10,naturalHeight:10,onload:null as null|(()=>void),decode:async()=>{},removeAttribute:vi.fn(),set src(s:string){setTimeout(()=>img.onload?.(),s.includes('/idle-')?1200:0);}};return img as unknown as HTMLImageElement;}});
   const results=[];for(let i=0;i<3;i++){const pending=runtime.reserveIdle('king-stratus','white');await vi.advanceTimersByTimeAsync(1000);results.push(await pending);await vi.advanceTimersByTimeAsync(300);runtime.releaseIdle();}
   expect(results).toEqual([false,true,true]);runtime.dispose();
  }finally{vi.useRealTimers();}
 });
 it('does not release another preparation when offline skips ownership', async () => {
  const idle={...bank(),id:'idle',character:'king-stratus',kind:'idle',frames:[{url:'rest',timeMs:0},{url:'held',timeMs:60},{url:'rest',timeMs:120}]};let finish=()=>{};
  const attack={...idle,id:'attack',kind:'attack',frames:[{url:'held',timeMs:0}]};
  vi.stubGlobal('navigator',{onLine:true});
  try{
   const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,attack]})})) as unknown as typeof fetch,
    image:()=>{const img={naturalWidth:10,naturalHeight:10,onload:null as null|(()=>void),decode:async()=>{},removeAttribute:vi.fn(),set src(s:string){if(s.endsWith('/held'))finish=()=>img.onload?.();else queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
   const first=runtime.reserveIdle('king-stratus','white');await vi.waitFor(()=>expect(runtime.stats.active).toBe(1));
   vi.stubGlobal('navigator',{onLine:false});const preparing=runtime.prepare('king-stratus','white','SE',true);await preparing;
   expect(runtime.stats.active).toBe(1);vi.stubGlobal('navigator',{onLine:true});finish();expect(await first).toBe(true);runtime.dispose();
  }finally{vi.unstubAllGlobals();}
 });
 it('keeps a preparation load that a visible rest frame also needs', async () => {
  const idle={...bank(),id:'idle',kind:'idle',frames:[{url:'held',timeMs:0}]};let finish=()=>{};
  const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle]})})) as unknown as typeof fetch,
   image:()=>{const img={naturalWidth:10,naturalHeight:10,onload:null as null|(()=>void),decode:async()=>{},removeAttribute:vi.fn(),set src(_s:string){finish=()=>img.onload?.();}};return img as unknown as HTMLImageElement;}});
  const controller=new AbortController(),pending=runtime.prepare('pawn','white','SE',false,false,controller.signal);
  await vi.waitFor(()=>expect(runtime.stats.active).toBe(1));runtime.rest('pawn','white');controller.abort();expect(await pending).toBeNull();
  expect(runtime.stats.active).toBe(1);finish();await vi.waitFor(()=>expect(runtime.rest('pawn','white')).toMatchObject({url:'held'}));runtime.dispose();
 });
 it('reserves the actual idle images through cache pressure and releases stale reservations', async () => {
  const frames=['rest','a','b','c','b','a','rest'].map((url,i)=>({url,timeMs:i*100}));
  const idle={...bank(),id:'idle',character:'king-stratus',kind:'idle',durationMs:600,frames};
  const later={...idle,id:'later',durationMs:1200,frames:[...frames,{url:'rest',timeMs:1200}]};
  const pressure=Array.from({length:120},(_,i)=>({...idle,id:`p${i}`,character:`p${i}`,frames:[{url:`p${i}`,timeMs:0}]}));
  const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,later,...pressure]})})) as unknown as typeof fetch,
   image:()=>{const img={naturalWidth:384,naturalHeight:384,onload:null as null|(()=>void),decode:async()=>{},set src(_s:string){queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
  expect(await runtime.reserveIdle('king-stratus','white')).toBe(true);
  const painted=runtime.rest('king-stratus','white',300,true) as {bank:string;url:string};expect(painted.url).toBe('c');
  const exit=runtime.idleExit('king-stratus','white',painted);expect(exit?.(0)?.url).toBe('c');expect(exit?.(1)?.url).toBe('rest');
  for(let i=0;i<pressure.length;i++)await runtime.warm(`p${i}`,'white');
  expect([0,.25,.5,.75,1].map(t=>exit?.(t)?.url)).toEqual(['c','b','b','a','rest']);
  expect(runtime.stats.peakBytes).toBeLessThanOrEqual(64*1024*1024);
  runtime.releaseIdle();expect(runtime.idleExit('king-stratus','white',painted)).toBeNull();runtime.dispose();
 });
 it.each(['white','black'])('holds a king turn endpoint and returns along the same route for %s', async army => {
  const idle={...bank(),id:'idle',character:'king-frost',army,kind:'idle',frames:[{url:army+'-rest',timeMs:0}]};
  const turn={...bank(),id:'turn',character:'king-frost',army,frames:[{url:army+'-rest',timeMs:0},{url:army+'-middle',timeMs:60},{url:army+'-target',timeMs:120}]};
  const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,turn]})})) as unknown as typeof fetch,
   image:()=>{const img={naturalWidth:384,naturalHeight:384,onload:null as null|(()=>void),decode:async()=>{},set src(_s:string){queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
  const prepared=await runtime.prepare('king-frost',army,'S',true,true);expect(prepared).not.toBeNull();
  expect(runtime.action(prepared,-120,1000,0)).toMatchObject({url:army+'-rest'});
  expect(runtime.action(prepared,0,1000,0)).toMatchObject({url:army+'-target'});
  expect(runtime.action(prepared,700,1000,0)).toMatchObject({url:army+'-target'});
  expect(runtime.action(prepared,1120,1000,0)).toMatchObject({url:army+'-rest'});
  runtime.dispose();
 });
 it.each(['white','black'])('plays the target-facing king attack for %s', async army => {
  const idle={...bank(),id:'idle',character:'king-frost',army,kind:'idle',frames:[{url:army+'-rest',timeMs:0}]};
  const turn={...bank(),id:'turn',character:'king-frost',army,frames:[{url:army+'-rest',timeMs:0},{url:army+'-target',timeMs:120}]};
  const attack={...bank(),id:'attack',character:'king-frost',army,kind:'attack',facing:'S',frames:[{url:army+'-target',timeMs:0},{url:army+'-strike',timeMs:40},{url:army+'-target',timeMs:100}]};
  const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,turn,attack]})})) as unknown as typeof fetch,
   image:()=>{const img={naturalWidth:384,naturalHeight:384,onload:null as null|(()=>void),decode:async()=>{},set src(_s:string){queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
  const prepared=await runtime.prepare('king-frost',army,'S',true,true);expect(prepared).not.toBeNull();
  expect(runtime.action(prepared,0,120,40)).toMatchObject({url:army+'-target'});
  expect(runtime.action(prepared,40,120,40)).toMatchObject({url:army+'-strike'});
  expect(runtime.action(prepared,100,120,40)).toMatchObject({url:army+'-target'});
  expect(runtime.action(prepared,240,120,40)).toMatchObject({url:army+'-rest'});
  runtime.dispose();
 });
 it('places a smaller key at its authored offset', async () => {
  const idle={...bank(),id:'idle',character:'king-frost',kind:'idle',frames:[{url:'rest',timeMs:0}]};
  const attack={...bank(),id:'attack',character:'king-frost',kind:'attack',facing:'SE',canvasSize:[640,640] as [number,number],pivot:[512,478] as [number,number],frames:[{url:'rest',timeMs:0},{url:'strike',timeMs:60}]};
  const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,attack]})})) as unknown as typeof fetch,
   image:()=>{const img={naturalWidth:384,naturalHeight:384,onload:null as null|(()=>void),decode:async()=>{},set src(s:string){if(s.endsWith('/strike'))img.naturalWidth=img.naturalHeight=640;queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
  const prepared=await runtime.prepare('king-frost','white','SE',true,true);
  expect(runtime.action(prepared,0,120,60)).toMatchObject({pivot:[384,350],canvasSize:[384,384]});
  expect(runtime.action(prepared,60,120,60)).toMatchObject({pivot:[512,478],canvasSize:[640,640]});
  runtime.dispose();
 });
 it('keeps every king turn frame under cache pressure until the capture ends', async () => {
  const idle={...bank(),id:'idle',character:'king-frost',kind:'idle',frames:[{url:'rest',timeMs:0}]};
  const turn={...bank(),id:'turn',character:'king-frost',frames:[{url:'rest',timeMs:0},{url:'middle',timeMs:60},{url:'target',timeMs:120}]};
  const pressure=Array.from({length:5},(_,i)=>({...idle,id:`other-${i}`,character:`other-${i}`,frames:[{url:`other-${i}`,timeMs:0}]}));
  const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,turn,...pressure]})})) as unknown as typeof fetch,
   image:()=>{const img={naturalWidth:384,naturalHeight:384,onload:null as null|(()=>void),decode:async()=>{},set src(s:string){if(s.includes('/other-')){img.naturalWidth=2048;img.naturalHeight=2048;}queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
  const prepared=await runtime.prepare('king-frost','white','S',true,true) as {releaseFallback:()=>void};
  expect(prepared).not.toBeNull();
  for(const b of pressure)await runtime.warm(b.character,'white');
  expect(runtime.action(prepared,-60,1000,0)).toMatchObject({url:'middle'});
  expect(runtime.action(prepared,500,1000,0)).toMatchObject({url:'target'});
  expect(runtime.action(prepared,1120,1000,0)).toMatchObject({url:'rest'});
  expect(runtime.stats.peakBytes).toBeLessThanOrEqual(64*1024*1024);prepared.releaseFallback();runtime.dispose();
 });
 it.each(['endpoint','middle'])('rejects a king turn when its %s frame fails to load', async missing => {
  const idle={...bank(),id:'idle',character:'king-frost',kind:'idle',frames:[{url:'rest',timeMs:0}]};
  const turn={...bank(),id:'turn',character:'king-frost',frames:[{url:'rest',timeMs:0},{url:missing==='middle'?'bad':'middle',timeMs:60},{url:missing==='endpoint'?'bad':'target',timeMs:120}]};
  const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,turn]})})) as unknown as typeof fetch,
   image:()=>{const img={naturalWidth:384,naturalHeight:384,onload:null as null|(()=>void),onerror:null as null|(()=>void),decode:async()=>{},set src(s:string){queueMicrotask(()=>s.endsWith('/bad')?img.onerror?.():img.onload?.());}};return img as unknown as HTMLImageElement;}});
  expect(await runtime.prepare('king-frost','white','S',true,true)).toBeNull();runtime.dispose();
 });
 it('does not pin an idle bank after selection is cancelled while images load', async () => {
  const idle={...bank(),id:'idle',character:'king-stratus',kind:'idle',frames:[{url:'rest',timeMs:0},{url:'late',timeMs:60},{url:'rest',timeMs:120}]};let finish=()=>{};
  const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle]})})) as unknown as typeof fetch,
   image:()=>{const img={naturalWidth:384,naturalHeight:384,onload:null as null|(()=>void),decode:async()=>{},set src(s:string){if(s.endsWith('/late'))finish=()=>img.onload?.();else queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
  const pending=runtime.reserveIdle('king-stratus','white');await vi.waitFor(()=>expect(finish.toString()).not.toBe('()=>{}'));runtime.releaseIdle();finish();expect(await pending).toBe(false);
  expect(runtime.idleExit('king-stratus','white',{bank:'idle',url:'rest'})).toBeNull();runtime.dispose();
 });
 it('retries smoke once idle pins release its budget', async () => {
  const idle={...bank(),id:'idle',character:'king-stratus',kind:'idle',frames:[{url:'rest',timeMs:0},{url:'raise',timeMs:60},{url:'rest',timeMs:120}]};
  const archer={...idle,id:'archer',character:'archer',frames:[{url:'archer',timeMs:0}]};
  const smoke='data:text/javascript,export class ArrowSmoke{constructor(){globalThis.__smokeAttempts=(globalThis.__smokeAttempts||0)+1;this.image={decode:async()=>{}}}}';
  const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,archer],effects:{archer:{smoke,smokeDecodedBytes:48*1024*1024}}})})) as unknown as typeof fetch,
   image:()=>{const img={naturalWidth:2048,naturalHeight:2048,onload:null as null|(()=>void),decode:async()=>{},set src(s:string){if(s.endsWith('/archer')){img.naturalWidth=384;img.naturalHeight=384;}queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
  expect(await runtime.reserveIdle('king-stratus','white')).toBe(true);await runtime.warm('archer','white');
  await vi.waitFor(()=>expect((globalThis as {__smokeAttempts?:number}).__smokeAttempts).toBe(1));expect(runtime.smoke()).toBeNull();
  runtime.releaseIdle();await vi.waitFor(()=>expect(runtime.smoke()).not.toBeNull());expect(runtime.stats.peakBytes).toBeLessThanOrEqual(64*1024*1024);runtime.dispose();delete (globalThis as {__smokeAttempts?:number}).__smokeAttempts;
 });
 it('discards a late reserved-idle image after disposal', async () => {
  const idle={...bank(),id:'idle',character:'king-stratus',kind:'idle',frames:[{url:'rest',timeMs:0},{url:'late',timeMs:60},{url:'rest',timeMs:120}]};let finish:(()=>void)|undefined;
  const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle]})})) as unknown as typeof fetch,
   image:()=>{const img={naturalWidth:384,naturalHeight:384,onload:null as null|(()=>void),decode:async()=>{},set src(s:string){if(s.endsWith('/late')){const callback=img.onload;finish=()=>callback?.();}else queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
  const pending=runtime.reserveIdle('king-stratus','white');await vi.waitFor(()=>expect(finish).toBeDefined());runtime.dispose();finish?.();expect(await pending).toBe(false);expect(runtime.stats.bytes).toBe(0);
 });
 it('holds the painted move keys at their own times and repeats during long travel', async () => {
  const idle={...bank(),id:'idle',kind:'idle',frames:[{url:'rest',timeMs:0}]};
  const move={...bank(),id:'painted',kind:'move',facing:'N',nearest:true,durationMs:600,frames:[0,120,360].map(timeMs=>({url:`walk-${timeMs}`,timeMs}))};
  const older={...move,id:'older',kind:'movement'};
  const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,older,move]})})) as unknown as typeof fetch,
   image:()=>{const img={naturalWidth:10,naturalHeight:10,onload:null as null|(()=>void),decode:async()=>{},set src(_s:string){queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
  const prepared=await runtime.prepare('pawn','white','N',false,true);
  expect((prepared as {movement:{id:string}} | null)?.movement?.id).toBe('painted');
  expect([0,119,120,359,360,599,600,720].map(t=>(runtime.action(prepared,t,1000,0) as {time:number}).time)).toEqual([0,0,120,120,360,360,0,120]);
  expect((runtime.action(prepared,1001,1000,0) as {bank:string}).bank).toBe('idle');
  runtime.dispose();
 });
 it('plays explicit movement for each army and direction over the scene travel time', async () => {
  const banks = ['white','black'].flatMap(army => {
   const idle={...bank(),id:`${army}-idle`,army,kind:'idle',frames:[{url:`${army}-rest`,timeMs:0}]};
   const turn={...bank(),id:`${army}-turn`,army,frames:[{url:`${army}-rest`,timeMs:0},{url:`${army}-turn`,timeMs:120}]};
   const movement={...bank(),id:`${army}-move`,army,kind:'movement',facing:'S',nearest:false,durationMs:200,pivot:[100,200] as [number,number],registrationHeightPx:400,frames:[0,100,200].map(timeMs=>({url:`${army}-move-${timeMs}`,timeMs}))};
   return [idle,turn,movement];
  });
  const sources:string[]=[];
  const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks})})) as unknown as typeof fetch,
   image:()=>{const img={naturalWidth:768,naturalHeight:768,onload:null as null|(()=>void),decode:async()=>{},set src(s:string){sources.push(s);queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
  for(const army of ['white','black']){
   const long=await runtime.prepare('pawn',army,'S',false,false);
   expect((runtime.action(long,500,1000,0) as {bank:string}).bank).toBe(`${army}-turn`);
   expect(sources.filter(s=>s.includes(`${army}-move-`))).toHaveLength(0);
   const prepared=await runtime.prepare('pawn',army,'S',false,true);
   const sample=(t:number)=>runtime.action(prepared,t,1000,0) as {bank:string;time:number;pivot:number[];scale:number};
   expect(sources.filter(s=>s.includes(`${army}-move-`))).toHaveLength(3);
   expect([0,499,500,999,1000].map(t=>sample(t).time)).toEqual([0,0,100,100,200]);
   expect(sample(0)).toMatchObject({bank:`${army}-move`,pivot:[100,200],scale:96/400});
   expect(sample(-1).bank).toBe(`${army}-turn`);expect(sample(1001).bank).toBe(`${army}-turn`);
   const opposite=await runtime.prepare('pawn',army,'SE',false,true);
   expect((runtime.action(opposite,500,1000,0) as {bank:string}).bank).toBe(`${army}-idle`);
   const capture=await runtime.prepare('pawn',army,'S',true,true);
   expect((runtime.action(capture,500,1000,0) as {bank:string}).bank).toBe(`${army}-turn`);
  }
  runtime.dispose();
 });
 it.each(['missing','decode'])('falls back when a movement frame has a %s failure', async failure => {
  const idle={...bank(),id:'idle',kind:'idle',frames:[{url:'rest',timeMs:0}]};
  const movement={...bank(),id:'move',kind:'movement',facing:'SE',frames:[{url:'move-0',timeMs:0},{url:'bad',timeMs:120}]};
  const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,movement]})})) as unknown as typeof fetch,
   image:()=>{let bad=false;const img={naturalWidth:10,naturalHeight:10,onload:null as null|(()=>void),onerror:null as null|(()=>void),decode:async()=>{if(bad&&failure==='decode')throw Error('decode');},set src(s:string){bad=s.endsWith('/bad');queueMicrotask(()=>bad&&failure==='missing'?img.onerror?.():img.onload?.());}};return img as unknown as HTMLImageElement;}});
  const prepared=await runtime.prepare('pawn','white','SE',false,true);
  expect((runtime.action(prepared,60,120,0) as {bank:string}).bank).toBe('idle');runtime.dispose();
 });
 it.each(['equal start times','overlapping end intervals'] as const)('selects the exact movement boundary with %s', async condition => {
  const idle={...bank(),id:'idle',kind:'idle',frames:[{url:'rest',timeMs:0}]};
  const frames=condition==='equal start times'
   ? [{url:'first',timeMs:0},{url:'middle',timeMs:0},{url:'last',timeMs:120}]
   : [{url:'first',timeMs:0,visibleIntervalMs:[0,40] as [number,number]},{url:'middle',timeMs:40,visibleIntervalMs:[40,120] as [number,number]},{url:'last',timeMs:100,visibleIntervalMs:[100,119] as [number,number]}];
  const movement={...bank(),id:'move',kind:'movement',facing:'SE',nearest:false,frames};
  const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,movement]})})) as unknown as typeof fetch,
   image:()=>{const img={naturalWidth:10,naturalHeight:10,onload:null as null|(()=>void),decode:async()=>{},set src(_s:string){queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
  const prepared=await runtime.prepare('pawn','white','SE',false,true);
  expect(runtime.action(prepared,0,120,0,'start')).toMatchObject({url:'first'});
  expect(runtime.action(prepared,120,120,0,'end')).toMatchObject({url:'last'});
  expect(runtime.action(prepared,condition==='equal start times'?0:120,120,0)).toMatchObject({url:'middle'});
  const held=prepared as {releaseMovementStart:()=>void;releaseMovement:()=>void;releaseFallback:()=>void};held.releaseMovementStart();held.releaseMovement();held.releaseFallback();runtime.dispose();
 });
 it.each([true,false])('keeps baseline unreserved fallback under pressure with no bank (one square %s)', async oneSquare => {
  const idle={...bank(),id:'idle',kind:'idle',frames:[{url:'rest',timeMs:0}]};
  const turn={...bank(),id:'turn',frames:[{url:'rest',timeMs:0},{url:'turn-end',timeMs:120}]};
  const others=Array.from({length:3},(_,i)=>({...idle,id:`other-${i}`,character:`other-${i}`,frames:[{url:`other-${i}`,timeMs:0}]}));
  const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,turn,...others]})})) as unknown as typeof fetch,
   image:()=>{const img={naturalWidth:2048,naturalHeight:2048,onload:null as null|(()=>void),decode:async()=>{},set src(_s:string){queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
  await runtime.warm('pawn','white');
  const prepared=await runtime.prepare('pawn','white','S',false,oneSquare) as {releaseFallback:null};expect(prepared.releaseFallback).toBeNull();
  for(let i=0;i<others.length;i++)await runtime.warm(`other-${i}`,'white');
  expect(runtime.action(prepared,50,100,0)).toMatchObject({bank:'turn',url:'rest'});
  expect(runtime.stats.peakBytes).toBeLessThanOrEqual(64*1024*1024);runtime.dispose();
 });
 it('keeps the turn fallback after a movement load exceeds the move deadline', async () => {
  vi.useFakeTimers();
  try {
   const idle={...bank(),id:'idle',kind:'idle',frames:[{url:'rest',timeMs:0}]};
   const movement={...bank(),id:'move',kind:'movement',facing:'SE',frames:[{url:'slow',timeMs:0}]};
   const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,movement]})})) as unknown as typeof fetch,
    image:()=>{const img={naturalWidth:10,naturalHeight:10,onload:null as null|(()=>void),decode:async()=>{},set src(s:string){if(!s.endsWith('/slow'))queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
   const preparing=runtime.prepare('pawn','white','SE',false,true);await vi.advanceTimersByTimeAsync(1001);
   const prepared=await preparing;expect(prepared).not.toBeNull();expect((runtime.action(prepared,50,100,0) as {bank:string}).bank).toBe('idle');runtime.dispose();
  } finally {vi.useRealTimers();}
 });
 it('keeps ready turn frames under 64 MiB pressure through a late movement load and releases them', async () => {
  vi.useFakeTimers();
  try {
   const idle={...bank(),id:'idle',kind:'idle',frames:[{url:'rest',timeMs:0}]};
   const turn={...bank(),id:'turn',frames:[{url:'rest',timeMs:0},{url:'turn-end',timeMs:120}]};
   const movement={...bank(),id:'move',kind:'movement',facing:'S',frames:Array.from({length:7},(_,i)=>({url:`move-${i}`,timeMs:i*20}))};
   const other={...idle,id:'other',character:'queen',frames:[{url:'other',timeMs:0}]};let release=()=>{};
   const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,turn,movement,other]})})) as unknown as typeof fetch,
    image:()=>{const img={naturalWidth:2048,naturalHeight:2048,onload:null as null|(()=>void),decode:async()=>{},set src(s:string){if(s.endsWith('/move-6'))release=()=>img.onload?.();else queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
   const pending=runtime.prepare('pawn','white','S',false,true);await vi.advanceTimersByTimeAsync(1001);
   const prepared=await pending;expect(prepared).not.toBeNull();expect(runtime.action(prepared,50,100,0)).toMatchObject({bank:'turn',url:'turn-end'});
   expect(runtime.action(prepared,-120,100,0)).toMatchObject({bank:'turn',url:'rest'});expect(runtime.stats.peakBytes).toBeLessThanOrEqual(64*1024*1024);
   release();await vi.advanceTimersByTimeAsync(0);expect(runtime.action(prepared,50,100,0)).toMatchObject({bank:'turn',url:'turn-end'});
   (prepared as {releaseFallback:()=>void}).releaseFallback();await runtime.warm('queen','white');expect(runtime.rest('queen','white')).toMatchObject({url:'other'});
   expect(runtime.stats.peakBytes).toBeLessThanOrEqual(64*1024*1024);runtime.dispose();expect(runtime.stats.bytes).toBe(0);
  } finally {vi.useRealTimers();}
 });
 it('releases fallback reservations when a pending movement is cancelled', async () => {
  const idle={...bank(),id:'idle',kind:'idle',frames:[{url:'rest',timeMs:0}]};
  const turn={...bank(),id:'turn',frames:[{url:'rest',timeMs:0},{url:'turn-end',timeMs:120}]};
  const movement={...bank(),id:'move',kind:'movement',facing:'S',frames:[{url:'held',timeMs:0}]};
  const others=Array.from({length:4},(_,i)=>({...idle,id:`other-${i}`,character:`other-${i}`,frames:[{url:`other-${i}`,timeMs:0}]}));let held=false;
  const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,turn,movement,...others]})})) as unknown as typeof fetch,
   image:()=>{const img={naturalWidth:2048,naturalHeight:2048,onload:null as null|(()=>void),decode:async()=>{},set src(s:string){if(s.endsWith('/held'))held=true;else queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
  const controller=new AbortController(),pending=runtime.prepare('pawn','white','S',false,true,controller.signal);
  await vi.waitFor(()=>expect(held).toBe(true));controller.abort();expect(await pending).toBeNull();
  for(let i=0;i<4;i++)await runtime.warm(`other-${i}`,'white');
  for(let i=0;i<4;i++)expect(runtime.rest(`other-${i}`,'white')).toMatchObject({url:`other-${i}`});
  expect(runtime.stats.peakBytes).toBeLessThanOrEqual(64*1024*1024);runtime.dispose();expect(runtime.stats.bytes).toBe(0);
 });
 it.each(['abort','timeout'] as const)('retires held and queued movement loads on %s before a replacement', async reason => {
  vi.useFakeTimers();
  try {
   const idle={...bank(),id:'idle',kind:'idle',frames:[{url:'rest',timeMs:0}]};
   const movement={...bank(),id:'move',kind:'movement',facing:'SE',frames:Array.from({length:8},(_,i)=>({url:`held-${i}`,timeMs:i*10}))};
   const other={...idle,id:'other',character:'queen',frames:[{url:'other-rest',timeMs:0}]};
   const turn={...bank(),id:'other-turn',character:'queen',frames:[{url:'other-rest',timeMs:0},{url:'held-0',timeMs:120}]};
   const late:(()=>void)[]=[],sources:string[]=[],removed:string[]=[];let replacementImage:unknown;
   const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,movement,other,turn]})})) as unknown as typeof fetch,
    image:()=>{let source='';const img={naturalWidth:10,naturalHeight:10,onload:null as null|(()=>void),decode:async()=>{},removeAttribute:()=>removed.push(source),set src(s:string){source=s;sources.push(s);if(s.includes('/held-')&&sources.filter(x=>x===s).length===1){const callback=img.onload;late.push(()=>callback?.());}else{if(s.endsWith('/held-0'))replacementImage=img;queueMicrotask(()=>img.onload?.());}}};return img as unknown as HTMLImageElement;}});
   const controller=new AbortController(),pending=runtime.prepare('pawn','white','SE',false,true,controller.signal);
   await vi.advanceTimersByTimeAsync(0);expect(runtime.stats).toMatchObject({active:6,queued:2});expect(late).toHaveLength(6);
   if(reason==='abort')controller.abort();else await vi.advanceTimersByTimeAsync(1000);
   const original=await pending;if(reason==='abort')expect(original).toBeNull();else{expect(original).not.toBeNull();(original as {releaseFallback:()=>void}).releaseFallback();}
   expect(runtime.stats).toMatchObject({active:0,queued:0});expect(removed).toHaveLength(6);
   const nextPromise=runtime.prepare('queen','white','S',false);await vi.advanceTimersByTimeAsync(0);
   const next=await nextPromise;expect(next).not.toBeNull();expect(runtime.action(next,50,100,0)).toMatchObject({bank:'other-turn',url:'held-0',image:replacementImage});
   const bytes=runtime.stats.bytes;late.forEach(release=>release());await vi.advanceTimersByTimeAsync(0);
   expect(runtime.action(next,50,100,0)).toMatchObject({url:'held-0',image:replacementImage});expect(runtime.stats).toMatchObject({bytes,active:0,queued:0});
   expect(sources.filter(s=>s.endsWith('/held-0'))).toHaveLength(2);expect(sources.some(s=>s.endsWith('/held-6'))).toBe(false);
   expect(runtime.stats.peakBytes).toBeLessThanOrEqual(64*1024*1024);runtime.dispose();expect(runtime.stats).toMatchObject({bytes:0,active:0,queued:0});
  } finally {vi.useRealTimers();}
 });
 it.each(['abort','timeout'] as const)('retires initial turn loads on %s and starts an uncached replacement', async reason => {
  vi.useFakeTimers();
  try {
   const idle={...bank(),id:'idle',kind:'idle',frames:[{url:'rest',timeMs:0}]};
   const directions=['SE','S','SW','W','NW'];
   const turns=directions.slice(0,-1).map((from,i)=>({...bank(from,directions[i+1]),frames:[{url:`held-${i*2}`,timeMs:0},{url:`held-${i*2+1}`,timeMs:120}]}));
   const other={...idle,id:'other',character:'queen',frames:[{url:'other-rest',timeMs:0}]};
   const turn={...bank(),id:'other-turn',character:'queen',frames:[{url:'other-rest',timeMs:0},{url:'held-0',timeMs:120}]};
   const late:(()=>void)[]=[],sources:string[]=[],removed:string[]=[];let replacementImage:unknown;
   const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,...turns,other,turn]})})) as unknown as typeof fetch,
    image:()=>{let source='';const img={naturalWidth:10,naturalHeight:10,onload:null as null|(()=>void),decode:async()=>{},removeAttribute:()=>removed.push(source),set src(s:string){source=s;sources.push(s);if(s.includes('/held-')&&sources.filter(x=>x===s).length===1){const callback=img.onload;late.push(()=>callback?.());}else{if(s.endsWith('/held-0'))replacementImage=img;queueMicrotask(()=>img.onload?.());}}};return img as unknown as HTMLImageElement;}});
   const controller=new AbortController(),pending=runtime.prepare('pawn','white','NW',false,false,controller.signal);
   await vi.advanceTimersByTimeAsync(0);expect(runtime.stats).toMatchObject({active:6,queued:2});
   if(reason==='abort')controller.abort();else await vi.advanceTimersByTimeAsync(1000);
   expect(await pending).toBeNull();expect(runtime.stats).toMatchObject({active:0,queued:0});expect(removed).toHaveLength(6);
   const nextPromise=runtime.prepare('queen','white','S',false);await vi.advanceTimersByTimeAsync(0);
   const next=await nextPromise;expect(next).not.toBeNull();expect(runtime.action(next,50,100,0)).toMatchObject({url:'held-0',image:replacementImage});
   const bytes=runtime.stats.bytes;late.forEach(release=>release());await vi.advanceTimersByTimeAsync(0);
   expect(runtime.action(next,50,100,0)).toMatchObject({url:'held-0',image:replacementImage});expect(runtime.stats).toMatchObject({bytes,active:0,queued:0});
   expect(sources.filter(s=>s.endsWith('/held-0'))).toHaveLength(2);expect(sources.some(s=>s.endsWith('/held-6'))).toBe(false);
   runtime.dispose();expect(runtime.stats).toMatchObject({bytes:0,active:0,queued:0});
  } finally {vi.useRealTimers();}
 });
 it('keeps initial active and queued frames shared with preparations and warm consumers', async () => {
  vi.useFakeTimers();
  try {
   const idle={...bank(),id:'idle',kind:'idle',frames:[{url:'rest',timeMs:0}]};
   const directions=['SE','S','SW','W','NW'];
   const turns=directions.slice(0,-1).map((from,i)=>({...bank(from,directions[i+1]),frames:[{url:`held-${i*2}`,timeMs:0},{url:`held-${i*2+1}`,timeMs:120}]}));
   const other={...idle,id:'other',character:'queen',frames:[{url:'held-7',timeMs:0}]};
   const releases=new Map<string,()=>void>(),removed:string[]=[];
   const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,...turns,other]})})) as unknown as typeof fetch,
    image:()=>{let source='';const img={naturalWidth:10,naturalHeight:10,onload:null as null|(()=>void),decode:async()=>{},removeAttribute:()=>removed.push(source),set src(s:string){source=s;if(s.includes('/held-'))releases.set(s,()=>img.onload?.());else queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
   const controller=new AbortController(),otherController=new AbortController(),first=runtime.prepare('pawn','white','NW',false,false,controller.signal),second=runtime.prepare('pawn','white','NW',false,false,otherController.signal);
   await vi.advanceTimersByTimeAsync(0);const warming=runtime.warm('queen','white');await vi.advanceTimersByTimeAsync(0);
   expect(runtime.stats).toMatchObject({active:6,queued:2});controller.abort();expect(await first).toBeNull();
   expect(runtime.stats).toMatchObject({active:6,queued:2});expect(removed).toHaveLength(0);
   otherController.abort();expect(await second).toBeNull();await vi.advanceTimersByTimeAsync(0);
   expect(runtime.stats).toMatchObject({active:1,queued:0});expect(removed).toHaveLength(5);expect(releases.size).toBe(6);
   [...releases].find(([url])=>url.endsWith('/held-7'))?.[1]();await vi.advanceTimersByTimeAsync(0);await warming;expect(runtime.rest('queen','white')).toMatchObject({url:'held-7'});
   expect(runtime.stats).toMatchObject({active:0,queued:0});runtime.dispose();expect(runtime.stats.bytes).toBe(0);
  } finally {vi.useRealTimers();}
 });
 it('keeps shared active and queued movement loads for another preparation', async () => {
  vi.useFakeTimers();
  try {
   const idle={...bank(),id:'idle',kind:'idle',frames:[{url:'rest',timeMs:0}]};
   const movement={...bank(),id:'move',kind:'movement',facing:'SE',frames:Array.from({length:8},(_,i)=>({url:`held-${i}`,timeMs:i*10}))};
   const releases:(()=>void)[]=[],removed:string[]=[];
   const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,movement]})})) as unknown as typeof fetch,
    image:()=>{let source='';const img={naturalWidth:10,naturalHeight:10,onload:null as null|(()=>void),decode:async()=>{},removeAttribute:()=>removed.push(source),set src(s:string){source=s;if(s.includes('/held-'))releases.push(()=>img.onload?.());else queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
   const controller=new AbortController(),first=runtime.prepare('pawn','white','SE',false,true,controller.signal),second=runtime.prepare('pawn','white','SE',false,true);
   await vi.advanceTimersByTimeAsync(0);expect(runtime.stats).toMatchObject({active:6,queued:2});controller.abort();expect(await first).toBeNull();
   expect(runtime.stats).toMatchObject({active:6,queued:2});expect(removed).toHaveLength(0);
   releases.slice().forEach(release=>release());await vi.advanceTimersByTimeAsync(0);expect(releases).toHaveLength(8);
   releases.slice(6).forEach(release=>release());await vi.advanceTimersByTimeAsync(0);
   const prepared=await second;expect(prepared).not.toBeNull();expect(runtime.action(prepared,0,100,0)).toMatchObject({bank:'move',url:'held-0'});
   const held=prepared as {releaseMovementStart:()=>void;releaseMovement:()=>void;releaseFallback:()=>void};held.releaseMovementStart();held.releaseMovement();held.releaseFallback();
   expect(runtime.stats).toMatchObject({active:0,queued:0});runtime.dispose();expect(runtime.stats.bytes).toBe(0);
  } finally {vi.useRealTimers();}
 });
 it('keeps a movement frame requested by a normal warm after cancellation', async () => {
  vi.useFakeTimers();
  try {
   const idle={...bank(),id:'idle',kind:'idle',frames:[{url:'rest',timeMs:0}]};
   const movement={...bank(),id:'move',kind:'movement',facing:'SE',frames:[{url:'shared',timeMs:0}]};
   const other={...idle,id:'other',character:'queen',frames:[{url:'shared',timeMs:0}]};let release=()=>{},removed=false;
   const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,movement,other]})})) as unknown as typeof fetch,
    image:()=>{const img={naturalWidth:10,naturalHeight:10,onload:null as null|(()=>void),decode:async()=>{},removeAttribute:()=>{removed=true;},set src(s:string){if(s.endsWith('/shared'))release=()=>img.onload?.();else queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
   const controller=new AbortController(),pending=runtime.prepare('pawn','white','SE',false,true,controller.signal);await vi.advanceTimersByTimeAsync(0);
   const warming=runtime.warm('queen','white');await vi.advanceTimersByTimeAsync(0);controller.abort();expect(await pending).toBeNull();
   expect(removed).toBe(false);expect(runtime.stats.active).toBe(1);release();await vi.advanceTimersByTimeAsync(0);await warming;
   expect(runtime.rest('queen','white')).toMatchObject({url:'shared'});expect(runtime.stats).toMatchObject({active:0,queued:0});runtime.dispose();expect(runtime.stats.bytes).toBe(0);
  } finally {vi.useRealTimers();}
 });
 it('reserves both movement endpoints under pressure and releases them on interruption', async () => {
  const idle={...bank(),id:'idle',kind:'idle',frames:[{url:'rest',timeMs:0}]};
  const movement={...bank(),id:'move',kind:'movement',facing:'SE',frames:[{url:'first',timeMs:0},{url:'last',timeMs:120}]};
  const others=Array.from({length:4},(_,i)=>({...idle,id:`other-${i}`,character:`other-${i}`,frames:[{url:`other-${i}`,timeMs:0}]}));
  const otherMove={...movement,character:'other-0',frames:[{url:'other-0',timeMs:0}]};
  const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,movement,...others,otherMove]})})) as unknown as typeof fetch,
   image:()=>{const img={naturalWidth:2048,naturalHeight:2048,onload:null as null|(()=>void),decode:async()=>{},set src(_s:string){queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
  const prepared=await runtime.prepare('pawn','white','SE',false,true) as {releaseMovementStart:()=>void;releaseMovement:()=>void;releaseFallback:()=>void};
  for(let i=0;i<4;i++)await runtime.warm(`other-${i}`,'white');
  expect(runtime.action(prepared,0,100,0)).toMatchObject({bank:'move',url:'first'});
  expect(runtime.action(prepared,100,100,0)).toMatchObject({bank:'move',url:'last'});
  prepared.releaseMovementStart();prepared.releaseMovement();prepared.releaseFallback();
  const next=await runtime.prepare('other-0','white','SE',false,true) as typeof prepared;
  expect(runtime.action(next,0,100,0)).toMatchObject({url:'other-0'});next.releaseMovementStart();next.releaseMovement();next.releaseFallback();
  for(let i=0;i<4;i++)await runtime.warm(`other-${i}`,'white');
  for(let i=0;i<4;i++)expect(runtime.rest(`other-${i}`,'white')).toMatchObject({url:`other-${i}`});
  expect(runtime.stats.peakBytes).toBeLessThanOrEqual(64*1024*1024);runtime.dispose();
 });
 it('uses screen direction for both board orientations', () => {
  expect(facingOf(112,-112)).toBe('NE'); expect(facingOf(-112,112)).toBe('SW');
  expect(facingOf(0,-112)).toBe('N'); expect(facingOf(112,0)).toBe('E');
 });
 it('reverses the same ready edges and refuses a missing path', () => {
  const first = bank(), next = bank('S','SW');
  expect(turnRoute([first,next],'SW','SE')).toEqual([{bank:next,reverse:true},{bank:first,reverse:true}]);
  expect(turnRoute([first],'SE','N')).toBeNull(); expect(turnRoute([first],'SE','SE')).toEqual([]);
 });
 it('returns through the exact antipodal turn frames in reverse order', () => {
  const edges=['SE','S','SW','W','NW','N','NE','E'].map((from,i,all)=>bank(from,all[(i+1)%all.length]));
  const outward=turnRoute(edges,'SE','NW')!;expect(outward.map(p=>p.bank.id)).toEqual(['SE-S','S-SW','SW-W','W-NW']);
  const back=reverseRoute(outward);expect(back.map(p=>p.bank.id)).toEqual(['W-NW','SW-W','S-SW','SE-S']);expect(back.every(p=>p.reverse)).toBe(true);expect(reverseRoute(back)).toEqual(outward);
 });
 it('alternates accepted idle variations only after each complete loop', () => {
  const first={...bank(),kind:'idle',facing:'SE',durationMs:2000},second={...bank(),id:'other-idle',kind:'idle',facing:'SE',durationMs:3000};
  expect(idleBankAt([first,second],[],'SE',1999)).toMatchObject({bank:first,time:1999});expect(idleBankAt([first,second],[],'SE',2000)).toMatchObject({bank:second,time:0});expect(idleBankAt([first,second],[],'SE',4999)).toMatchObject({bank:second,time:2999});expect(idleBankAt([first,second],[],'SE',5000)).toMatchObject({bank:first,time:0});
 });
 it('does not cache a missing rest before the optional manifest arrives', async () => {
  let resolve!:(value:Response)=>void;const response=new Promise<Response>(r=>{resolve=r;});const b={...bank(),kind:'idle'};
  const runtime=createCharacterRuntime({fetcher:()=>response});expect(runtime.has('pawn','white')).toBe(false);
  resolve({ok:true,json:async()=>({schemaVersion:1,banks:[b]})} as Response);await runtime.ready();expect(runtime.has('pawn','white')).toBe(true);runtime.dispose();
 });
 it('uses recorded intervals before nearest turn samples and floor attack times', () => {
  const b = bank(); expect(frameAt(b,31).timeMs).toBe(60); expect(frameAt(b,120).timeMs).toBe(120);
  b.nearest=false; expect(frameAt(b,59).timeMs).toBe(0);
  b.frames[0].visibleIntervalMs=[0,90];b.frames[1].visibleIntervalMs=[90,110];b.frames[2].visibleIntervalMs=[110,120];
  expect(frameAt(b,80).timeMs).toBe(0); expect(frameAt(b,90).timeMs).toBe(60);
 });
 it('holds nearest attack keys until their recorded times', () => {
  const attack={...bank(),kind:'attack',durationMs:200,frames:[0,40,150].map(timeMs=>({url:`frame-${timeMs}`,timeMs}))};
  expect([0,39,40,149,150,200].map(time=>frameAt(attack,time).timeMs)).toEqual([0,0,40,40,150,150]);
 });
 it('loads the requested piece only and discards late decodes after disposal', async () => {
  const a = {...bank(),kind:'idle'}, other={...a,character:'knight'}, sources:string[]=[], pending:(()=>void)[]=[];
  const runtime=createCharacterRuntime({url:'https://example.invalid/character-runtime/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[a,other]})})) as unknown as typeof fetch,
   image:()=>{const img={onload:()=>{},decode:async()=>{},set src(s:string){sources.push(s);const callback=img.onload;pending.push(()=>callback());}};return img as unknown as HTMLImageElement;}});
  await runtime.ready();const loading=runtime.warm('pawn','white');await vi.waitFor(()=>expect(sources).toHaveLength(1));
  expect(sources).toEqual(['https://example.invalid/character-runtime/frame-0']);
  runtime.dispose();pending[0]();await loading;expect(runtime.rest('pawn','white')).toBeNull();
 });
 it('holds a previously passed frame while a reverse turn image loads', async () => {
  const turn=bank('S','SE');let finishMiddle=()=>{};
  const runtime=createCharacterRuntime({url:'https://example.invalid/package/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[turn]})})) as unknown as typeof fetch,
   image:()=>{const img={naturalWidth:768,naturalHeight:768,onload:()=>{},decode:async()=>{},set src(s:string){if(s.endsWith('frame-60'))finishMiddle=()=>img.onload();else queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
  const prepared=await runtime.prepare('pawn','white','S',false);expect(prepared).not.toBeNull();
  const sample=()=>runtime.action(prepared,-60,1000,0) as {time:number}|null;
  expect(sample()?.time).toBe(120);
  finishMiddle();await vi.waitFor(()=>expect(sample()?.time).toBe(60));runtime.dispose();
 });
 it('keeps the displayed turn frame under cache pressure in either direction', async () => {
  for(const reverse of [false,true]){
   const turn=reverse?bank('S','SE'):bank('SE','S');let finishMiddle=()=>{};
   const pressure=Array.from({length:24},(_,i)=>({...bank(),id:`pressure-${i}`,character:`pressure-${i}`,kind:'idle',frames:Array.from({length:6},(_,j)=>({url:`pressure-${i}-${j}`,timeMs:j*20}))}));
   const runtime=createCharacterRuntime({url:'https://example.invalid/package/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[turn,...pressure]})})) as unknown as typeof fetch,
    image:()=>{const img={naturalWidth:384,naturalHeight:384,onload:()=>{},decode:async()=>{},set src(s:string){if(s.endsWith('/frame-60'))finishMiddle=()=>img.onload();else queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
   await runtime.warm('pawn','white');const prepared=await runtime.prepare('pawn','white','S',false);
   const sample=(time:number)=>runtime.action(prepared,time,1000,0) as {time:number}|null;
   expect(sample(-60)?.time).toBe(reverse?120:0);finishMiddle();await vi.waitFor(()=>expect(sample(-60)?.time).toBe(60));
   for(let i=0;i<pressure.length;i++)await runtime.warm(`pressure-${i}`,'white',true);
   expect(runtime.stats.peakBytes).toBeLessThanOrEqual(64*1024*1024);expect(sample(-40)?.time).toBe(60);runtime.dispose();
  }
 });
 it('projects authored effect anchors through the body pivot and scale without another facing flip', () => {
  const b={...bank(),effectAnchors:[{id:'ocular',timeMs:100,point:[200,100] as [number,number]},{id:'ocular',timeMs:200,point:[220,120] as [number,number]}]};
  expect(anchorAt(b,'ocular',150)).toEqual([210,110]);expect(anchorAt(b,'ocular',0)).toEqual([200,100]);expect(anchorAt(b,'missing',150)).toBeNull();
  expect(bankPointToWorld({pivot:[192,350],scale:.4},{x:424,y:464},[210,110])).toEqual({x:431.2,y:368});
 });
 it('bounds decoded pixels while the six-slot loader fills a clip', async () => {
  const b={...bank(),kind:'idle'},sources:string[]=[];
  const runtime=createCharacterRuntime({url:'https://example.invalid/package/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[b]})})) as unknown as typeof fetch,
   image:()=>{const img={naturalWidth:4096,naturalHeight:4096,onload:()=>{},decode:async()=>{},set src(s:string){sources.push(s);queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
  await runtime.warm('pawn','white',true);
  expect(sources).toHaveLength(3);expect(runtime.stats.bytes).toBeLessThanOrEqual(64*1024*1024);expect(runtime.stats.peakBytes).toBeLessThanOrEqual(64*1024*1024);expect(runtime.stats.active).toBe(0);
  expect(runtime.rest('pawn','white')).not.toBeNull();runtime.dispose();
 });
 it('retries a timed-out turn frame and ignores its late callback', async () => {
  vi.useFakeTimers();
  try {
   const idle={...bank(),kind:'idle',frames:[{url:'frame-0',timeMs:0}]},turn=bank();let finish=()=>{},attempts=0;
   const runtime=createCharacterRuntime({url:'https://example.invalid/package/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,turn]})})) as unknown as typeof fetch,
    image:()=>{const img={naturalWidth:384,naturalHeight:384,onload:null as null|(()=>void),onerror:null as null|(()=>void),decode:async()=>{},set src(s:string){if(s.endsWith('/frame-120')&&++attempts===1){const callback=img.onload;finish=()=>callback?.();}else queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
   await runtime.warm('pawn','white');const preparing=runtime.prepare('pawn','white','S',false);
   await vi.advanceTimersByTimeAsync(1001);expect(await preparing).toBeNull();expect(runtime.stats.active).toBe(0);
   finish();await vi.advanceTimersByTimeAsync(0);const pending=runtime.prepare('pawn','white','S',false);await vi.advanceTimersByTimeAsync(0);const next=await pending;
   expect(attempts).toBe(2);expect(next).not.toBeNull();expect(runtime.action(next,-120,100,0)).not.toBeNull();runtime.dispose();
  } finally {vi.useRealTimers();}
 });
 it('cancels timed-out image requests before releasing queue slots', async () => {
  vi.useFakeTimers();
  try {
   const banks=Array.from({length:7},(_,i)=>({...bank(),character:`p${i}`,kind:'idle',frames:[{url:`image-${i}`,timeMs:0}]}));
   const sources:string[]=[],cancelled:string[]=[],late:(()=>void)[]=[];
   const runtime=createCharacterRuntime({url:'https://example.invalid/package/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks})})) as unknown as typeof fetch,
    image:()=>{let source='';const img={naturalWidth:384,naturalHeight:384,onload:null as null|(()=>void),onerror:null as null|(()=>void),decode:async()=>{},removeAttribute:()=>cancelled.push(source),set src(s:string){source=s;sources.push(s);const callback=img.onload;late.push(()=>callback?.());if(s.endsWith('image-6'))queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
   await runtime.ready();const warming=banks.map(b=>runtime.warm(b.character,'white'));await vi.advanceTimersByTimeAsync(0);
   expect(sources).toHaveLength(6);expect(runtime.stats.queued).toBe(1);
   await vi.advanceTimersByTimeAsync(5001);await Promise.all(warming);expect(cancelled).toHaveLength(6);expect(sources).toHaveLength(7);expect(runtime.stats.active).toBe(0);
   expect(runtime.rest('p6','white')).not.toBeNull();runtime.dispose();late.forEach(f=>f());await Promise.resolve();expect(runtime.stats.bytes).toBe(0);
  } finally {vi.useRealTimers();}
 });
 it('times out a stalled decode and ignores its late result', async () => {
  vi.useFakeTimers();
  try {
   const idle={...bank(),kind:'idle',frames:[{url:'frame-0',timeMs:0}]};let finishDecode=()=>{},cancelled=0;
   const runtime=createCharacterRuntime({url:'https://example.invalid/package/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle]})})) as unknown as typeof fetch,
    image:()=>{const img={naturalWidth:384,naturalHeight:384,onload:null as null|(()=>void),onerror:null as null|(()=>void),removeAttribute:()=>cancelled++,decode:()=>new Promise<void>(resolve=>{finishDecode=resolve;}),set src(_s:string){queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
   const warming=runtime.warm('pawn','white');await vi.advanceTimersByTimeAsync(5001);await warming;expect(cancelled).toBe(1);expect(runtime.stats.active).toBe(0);
   finishDecode();await Promise.resolve();expect(runtime.rest('pawn','white')).toBeNull();runtime.dispose();
  } finally {vi.useRealTimers();}
 });
 it('backs off a failed image, then retries it successfully', async () => {
  vi.useFakeTimers();
  try {
   const idle={...bank(),kind:'idle',frames:[{url:'frame-0',timeMs:0}]};let attempts=0;
   const runtime=createCharacterRuntime({url:'https://example.invalid/package/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle]})})) as unknown as typeof fetch,
    image:()=>{const img={naturalWidth:384,naturalHeight:384,onload:null as null|(()=>void),onerror:null as null|(()=>void),decode:async()=>{},set src(_s:string){attempts++;queueMicrotask(()=>attempts===1?img.onerror?.():img.onload?.());}};return img as unknown as HTMLImageElement;}});
   await runtime.warm('pawn','white');for(let i=0;i<50;i++)runtime.rest('pawn','white');await vi.advanceTimersByTimeAsync(4999);expect(attempts).toBe(1);
   await vi.advanceTimersByTimeAsync(1);runtime.rest('pawn','white');await vi.advanceTimersByTimeAsync(0);expect(attempts).toBe(2);expect(runtime.rest('pawn','white')).not.toBeNull();runtime.dispose();
  } finally {vi.useRealTimers();}
 });
 it('uses a manifest that succeeds after the move deadline', async () => {
  vi.useFakeTimers();
  try {
   let resolve!:(r:Response)=>void;const response=new Promise<Response>(r=>{resolve=r;});
   const runtime=createCharacterRuntime({fetcher:()=>response});const ready=runtime.ready();
   await vi.advanceTimersByTimeAsync(1001);await ready;expect(runtime.has('pawn','white')).toBe(false);
   resolve({ok:true,json:async()=>({schemaVersion:1,banks:[{...bank(),kind:'idle'}]})} as Response);await vi.advanceTimersByTimeAsync(0);
   expect(runtime.has('pawn','white')).toBe(true);runtime.dispose();
  } finally {vi.useRealTimers();}
 });
 it('backs off a failed manifest and accepts a later retry', async () => {
  vi.useFakeTimers();
  try {
   let attempts=0;const runtime=createCharacterRuntime({fetcher:vi.fn(async()=>{attempts++;if(attempts===1)throw Error('offline');return {ok:true,json:async()=>({schemaVersion:1,banks:[{...bank(),kind:'idle'}]})} as Response;}) as unknown as typeof fetch});
   await runtime.ready();for(let i=0;i<50;i++)runtime.has('pawn','white');await vi.advanceTimersByTimeAsync(4999);expect(attempts).toBe(1);
   await vi.advanceTimersByTimeAsync(1);runtime.has('pawn','white');await vi.advanceTimersByTimeAsync(0);expect(attempts).toBe(2);expect(runtime.has('pawn','white')).toBe(true);runtime.dispose();
  } finally {vi.useRealTimers();}
 });
 it('backs off a failed effect before trying it again', async () => {
  vi.useFakeTimers();
  try {
   const idle={...bank(),kind:'idle',frames:[{url:'frame-0',timeMs:0}]},attack={...bank(),kind:'attack',facing:'SE'},module='data:text/javascript,export const loadEffect=()=>{globalThis.__effectCalls++;throw Error("offline")}';
   (globalThis as {__effectCalls?:number}).__effectCalls=0;
   const runtime=createCharacterRuntime({url:'https://example.invalid/package/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,attack],effects:{pawn:{module,decodedBytes:100,contactMs:50}}})})) as unknown as typeof fetch,
    image:()=>{const img={naturalWidth:384,naturalHeight:384,onload:null as null|(()=>void),decode:async()=>{},set src(_s:string){queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
   await runtime.warm('pawn','white');for(let i=0;i<20;i++)expect(await runtime.prepare('pawn','white','SE',true)).toBeNull();expect((globalThis as {__effectCalls?:number}).__effectCalls).toBe(1);
   await vi.advanceTimersByTimeAsync(5000);expect(await runtime.prepare('pawn','white','SE',true)).toBeNull();expect((globalThis as {__effectCalls?:number}).__effectCalls).toBe(2);
   delete (globalThis as {__effectCalls?:number}).__effectCalls;runtime.dispose();
  } finally {vi.useRealTimers();}
 });
 it('shares pending effects across overlapping A B A preparations and accounts for both', async () => {
  vi.useFakeTimers();
  type Job = {name:string;resolve:(value:object)=>void;reject:(error:Error)=>void};
  try {
   const jobs:Job[]=[];(globalThis as {__overlapJobs?:Job[]}).__overlapJobs=jobs;
   const idle={...bank(),kind:'idle',frames:[{url:'frame-0',timeMs:0}]},attack={...bank(),kind:'attack',facing:'SE',frames:[{url:'frame-0',timeMs:0}]};
   const makeModule=(name:string)=>'data:text/javascript,'+encodeURIComponent(`export const loadEffect=()=>new Promise((resolve,reject)=>globalThis.__overlapJobs.push({name:"${name}",resolve,reject}))`);
   const banks=[idle,attack,{...idle,character:'queen'},{...attack,character:'queen'}];
   const runtime=createCharacterRuntime({url:'https://example.invalid/package/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks,effects:{pawn:{module:makeModule('pawn'),decodedBytes:1000,contactMs:50},queen:{module:makeModule('queen'),decodedBytes:2000,contactMs:50}}})})) as unknown as typeof fetch,
    image:()=>{const img={naturalWidth:384,naturalHeight:384,onload:null as null|(()=>void),decode:async()=>{},set src(_s:string){queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
   await runtime.warm('pawn','white');await runtime.warm('queen','white');const base=runtime.stats.bytes;
   const first=runtime.prepare('pawn','white','SE',true);await vi.advanceTimersByTimeAsync(1001);expect(await first).toBeNull();
   const other=runtime.prepare('queen','white','SE',true);await vi.advanceTimersByTimeAsync(1001);expect(await other).toBeNull();
   expect(jobs.map(j=>j.name)).toEqual(['pawn','queen']);expect(runtime.stats.bytes).toBe(base+3000);
   jobs[0].resolve({token:'pawn'});await vi.advanceTimersByTimeAsync(0);expect(runtime.stats.bytes).toBe(base+3000);
   const again=runtime.prepare('pawn','white','SE',true);await vi.advanceTimersByTimeAsync(0);expect(jobs).toHaveLength(2);expect(await again).not.toBeNull();
   jobs[1].reject(Error('offline'));await vi.advanceTimersByTimeAsync(0);expect(runtime.stats.bytes).toBe(base+1000);
   expect(await runtime.prepare('pawn','white','SE',true)).not.toBeNull();expect(jobs).toHaveLength(2);
   runtime.dispose();expect(runtime.stats.bytes).toBe(0);delete (globalThis as {__overlapJobs?:Job[]}).__overlapJobs;
  } finally {vi.useRealTimers();}
 });
 it('evicts the least recently used completed effect to keep the decoded budget', async () => {
  const calls:Record<string,number>={};(globalThis as {__effectCacheCalls?:Record<string,number>}).__effectCacheCalls=calls;
  const names=['pawn','queen','rook'],idle={...bank(),kind:'idle',frames:[{url:'frame-0',timeMs:0}]},attack={...bank(),kind:'attack',facing:'SE',frames:[{url:'frame-0',timeMs:0}]};
  const banks=names.flatMap(character=>[{...idle,character},{...attack,character}]);
  const effects=Object.fromEntries(names.map(name=>[name,{module:'data:text/javascript,'+encodeURIComponent(`export const loadEffect=()=>{globalThis.__effectCacheCalls["${name}"]=(globalThis.__effectCacheCalls["${name}"]??0)+1;return {name:"${name}"}}`),decodedBytes:30*1024*1024,contactMs:50}]));
  const runtime=createCharacterRuntime({url:'https://example.invalid/package/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks,effects})})) as unknown as typeof fetch,
   image:()=>{const img={naturalWidth:384,naturalHeight:384,onload:null as null|(()=>void),decode:async()=>{},set src(_s:string){queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
  for(const name of names)await runtime.warm(name,'white');const base=runtime.stats.bytes;
  for(const name of names)expect(await runtime.prepare(name,'white','SE',true)).not.toBeNull();
  expect(calls).toEqual({pawn:1,queen:1,rook:1});expect(runtime.stats.bytes).toBe(base+60*1024*1024);expect(runtime.stats.peakBytes).toBeLessThanOrEqual(64*1024*1024);
  expect(await runtime.prepare('queen','white','SE',true)).not.toBeNull();expect(calls.queen).toBe(1);
  expect(await runtime.prepare('pawn','white','SE',true)).not.toBeNull();expect(calls.pawn).toBe(2);expect(runtime.stats.bytes).toBe(base+60*1024*1024);
  runtime.dispose();expect(runtime.stats.bytes).toBe(0);delete (globalThis as {__effectCacheCalls?:Record<string,number>}).__effectCacheCalls;
 });
 it('keeps a pending effect when another cannot fit the decoded budget', async () => {
  vi.useFakeTimers();
  try {
   const idle={...bank(),kind:'idle',frames:[{url:'frame-0',timeMs:0}]},attack={...bank(),kind:'attack',facing:'SE',frames:[{url:'frame-0',timeMs:0}]};
   const banks=[idle,attack,{...idle,character:'queen'},{...attack,character:'queen'}];
   const a='data:text/javascript,'+encodeURIComponent('export const loadEffect=()=>new Promise(resolve=>{globalThis.__budgetEffect=resolve})');
   const b='data:text/javascript,'+encodeURIComponent('export const loadEffect=()=>{globalThis.__budgetOther=true;return {}}');
   const runtime=createCharacterRuntime({url:'https://example.invalid/package/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks,effects:{pawn:{module:a,decodedBytes:40*1024*1024,contactMs:50},queen:{module:b,decodedBytes:30*1024*1024,contactMs:50}}})})) as unknown as typeof fetch,
    image:()=>{const img={naturalWidth:384,naturalHeight:384,onload:null as null|(()=>void),decode:async()=>{},set src(_s:string){queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
   await runtime.warm('pawn','white');const base=runtime.stats.bytes,first=runtime.prepare('pawn','white','SE',true);await vi.advanceTimersByTimeAsync(1001);expect(await first).toBeNull();
   expect(await runtime.prepare('queen','white','SE',true)).toBeNull();expect((globalThis as {__budgetOther?:boolean}).__budgetOther).toBeUndefined();expect(runtime.stats.bytes).toBe(base+40*1024*1024);
   (globalThis as {__budgetEffect?:(value:object)=>void}).__budgetEffect?.({});await vi.advanceTimersByTimeAsync(0);expect(await runtime.prepare('pawn','white','SE',true)).not.toBeNull();
   expect(await runtime.prepare('queen','white','SE',true)).not.toBeNull();expect((globalThis as {__budgetOther?:boolean}).__budgetOther).toBe(true);expect(runtime.stats.peakBytes).toBeLessThanOrEqual(64*1024*1024);
   runtime.dispose();delete (globalThis as {__budgetEffect?:unknown}).__budgetEffect;delete (globalThis as {__budgetOther?:boolean}).__budgetOther;
  } finally {vi.useRealTimers();}
 });
 it('preserves turn endpoints under realistic effect and image pressure', async () => {
  const counts={archer:18878368,maester:12584376,queen:6294152},names=['archer','maester','queen',...Array.from({length:16},(_,i)=>`p${i}`)],frame=(url:string)=>({url,timeMs:0});
  const idle=(character:string)=>({...bank(),id:character+'-idle',character,kind:'idle',frames:[frame(character+'-idle')]});
  const attack=(character:string)=>({...bank(),id:character+'-attack',character,kind:'attack',facing:character==='queen'?'NW':'SE',frames:Array.from({length:6},(_,i)=>({url:character+'-attack-'+i,timeMs:i*20}))});
  const edges=[['SE','S'],['S','SW'],['SW','W'],['W','NW']].map(([from,to],i)=>({...bank(from,to),id:'turn-'+i,character:'queen',frames:[frame('turn-'+i),{url:'turn-'+(i+1),timeMs:120}]}));
  const banks=[...names.map(idle),...Object.keys(counts).map(attack),...edges];
  const module='data:text/javascript,export function loadEffect(){return {}}',smoke='data:text/javascript,export class ArrowSmoke{constructor(){this.image={decode:async()=>{}}}}';
  const effects=Object.fromEntries(Object.entries(counts).map(([c,decodedBytes])=>[c,{module,decodedBytes,contactMs:0,...c==='archer'?{smoke,smokeDecodedBytes:6290064}:{}}]));
  const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks,effects})})) as unknown as typeof fetch,
   image:()=>{const img={naturalWidth:384,naturalHeight:384,onload:null as null|(()=>void),decode:async()=>{},set src(s:string){if(s.includes('queen-attack')){this.naturalWidth=768;this.naturalHeight=512;}queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
  await runtime.ready();await Promise.all(names.map(name=>runtime.warm(name,'white')));await vi.waitFor(()=>expect(runtime.smoke()).not.toBeNull());
  expect(await runtime.prepare('maester','white','SE',true)).not.toBeNull();expect(await runtime.prepare('archer','white','SE',true)).not.toBeNull();
  const prepared=await runtime.prepare('queen','white','NW',true) as {beforeMs:number}|null;expect(prepared).not.toBeNull();
  expect(runtime.action(prepared,-prepared!.beforeMs,100,0)).toMatchObject({bank:'turn-0',time:0});
  expect(runtime.action(prepared,-prepared!.beforeMs+60,100,0)).toMatchObject({bank:'turn-0'});
  expect(runtime.stats.peakBytes).toBeLessThanOrEqual(64*1024*1024);runtime.dispose();
 });
 it('falls back when the required frames cannot fit beside the active effect', async () => {
  const idle={...bank(),kind:'idle',frames:[{url:'rest',timeMs:0}]},attack={...bank(),kind:'attack',facing:'SE',frames:Array.from({length:6},(_,i)=>({url:`attack-${i}`,timeMs:i*20}))};
  let loads=0;const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,attack],effects:{pawn:{module:'data:text/javascript,export function loadEffect(){return {}}',decodedBytes:63*1024*1024,contactMs:0}}})})) as unknown as typeof fetch,
   image:()=>{const img={naturalWidth:384,naturalHeight:384,onload:null as null|(()=>void),decode:async()=>{},set src(_s:string){loads++;queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
  await runtime.warm('pawn','white');expect(await runtime.prepare('pawn','white','SE',true)).toBeNull();expect(loads).toBeLessThanOrEqual(14);expect(runtime.stats.peakBytes).toBeLessThanOrEqual(64*1024*1024);runtime.dispose();
 });
 it('releases a pending effect on disposal and ignores its late completion', async () => {
  vi.useFakeTimers();
  try {
   const idle={...bank(),kind:'idle',frames:[{url:'frame-0',timeMs:0}]},attack={...bank(),kind:'attack',facing:'SE',frames:[{url:'frame-0',timeMs:0}]};
   const module='data:text/javascript,'+encodeURIComponent('export const loadEffect=()=>new Promise(resolve=>{globalThis.__disposeEffect=resolve})');
   const runtime=createCharacterRuntime({url:'https://example.invalid/package/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,attack],effects:{pawn:{module,decodedBytes:1000,contactMs:50}}})})) as unknown as typeof fetch,
    image:()=>{const img={naturalWidth:384,naturalHeight:384,onload:null as null|(()=>void),decode:async()=>{},set src(_s:string){queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
   await runtime.warm('pawn','white');const base=runtime.stats.bytes,preparing=runtime.prepare('pawn','white','SE',true);await vi.advanceTimersByTimeAsync(1001);
   expect(await preparing).toBeNull();expect(runtime.stats.bytes).toBe(base+1000);runtime.dispose();
   (globalThis as {__disposeEffect?:(value:object)=>void}).__disposeEffect?.({});await vi.advanceTimersByTimeAsync(0);expect(runtime.stats.bytes).toBe(0);
   delete (globalThis as {__disposeEffect?:unknown}).__disposeEffect;
  } finally {vi.useRealTimers();}
 });
 it('bounds a stalled effect and keeps the body fallback available', async () => {
  vi.useFakeTimers();
  try {
   const idle={...bank(),kind:'idle',frames:[{url:'frame-0',timeMs:0}]},attack={...bank(),kind:'attack',facing:'SE'},module='data:text/javascript,globalThis.__effectProbe=true;export const loadEffect=()=>new Promise(resolve=>{globalThis.__effectResolve=resolve})';
   const runtime=createCharacterRuntime({url:'https://example.invalid/package/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,attack],effects:{pawn:{module,decodedBytes:100,contactMs:50}}})})) as unknown as typeof fetch,
    image:()=>{const img={naturalWidth:384,naturalHeight:384,onload:null as null|(()=>void),decode:async()=>{},set src(_s:string){queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
   await runtime.warm('pawn','white');const preparing=runtime.prepare('pawn','white','SE',true);
   await vi.advanceTimersByTimeAsync(1001);expect((globalThis as {__effectProbe?:boolean}).__effectProbe).toBe(true);expect(await preparing).toBeNull();
   (globalThis as {__effectResolve?:(value:object)=>void}).__effectResolve?.({});await vi.advanceTimersByTimeAsync(0);expect(await runtime.prepare('pawn','white','SE',true)).not.toBeNull();
   delete (globalThis as {__effectProbe?:boolean}).__effectProbe;delete (globalThis as {__effectResolve?:unknown}).__effectResolve;runtime.dispose();
  } finally {vi.useRealTimers();}
 });
 it('keeps the previous art available when the optional package fails', async () => {
  const runtime=createCharacterRuntime({fetcher:vi.fn(async()=>{throw Error('offline');}) as unknown as typeof fetch});
  await runtime.ready();expect(runtime.has('pawn','white')).toBe(false);expect(runtime.rest('queen','white',100,true)).toBeNull();expect(await runtime.prepare('pawn','white','E',true)).toBeNull();runtime.dispose();
 });
 it('drops queued frame jobs when the browser goes offline', async () => {
  let online=true;const listeners=new Map<string,()=>void>();vi.stubGlobal('navigator',{get onLine(){return online;}});
  vi.stubGlobal('addEventListener',(name:string,fn:()=>void)=>listeners.set(name,fn));vi.stubGlobal('removeEventListener',(name:string)=>listeners.delete(name));
  const banks=Array.from({length:7},(_,i)=>({...bank(),id:`idle-${i}`,character:`piece-${i}`,kind:'idle',frames:[{url:`frame-${i}`,timeMs:0}]}));
  const sources:string[]=[], images:Array<{onerror:null|(()=>void)}> = [];
  const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks})})) as unknown as typeof fetch,
   image:()=>{const img={onerror:null as null|(()=>void),onload:null,removeAttribute:()=>{},set src(s:string){sources.push(s);}};images.push(img);return img as unknown as HTMLImageElement;}});
  try {
   await runtime.ready();const pending=banks.map(b=>runtime.warm(b.character,'white'));
   await vi.waitFor(()=>expect(runtime.stats.queued).toBe(1));expect(sources).toHaveLength(6);
   online=false;images[0].onerror?.();await vi.waitFor(()=>expect(runtime.stats.queued).toBe(0));expect(sources).toHaveLength(6);
   online=true;const reconnect=listeners.get('online');expect(reconnect).toBeDefined();reconnect!();void runtime.warm('piece-0','white');
   await vi.waitFor(()=>expect(sources.filter(source=>source==='https://example.invalid/frame-0')).toHaveLength(2));
   runtime.dispose();await Promise.all(pending);
  } finally {runtime.dispose();vi.unstubAllGlobals();}
 });
 it('asks the network for no art while the browser reports offline and resumes when it returns', async () => {
  const fetcher=vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[]})})),listeners=new Map<string,()=>void>();let online=false;
  vi.stubGlobal('addEventListener',(name:string,fn:()=>void)=>listeners.set(name,fn));vi.stubGlobal('removeEventListener',(name:string)=>listeners.delete(name));
  vi.stubGlobal('navigator',{get onLine(){return online;}});
  const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:fetcher as unknown as typeof fetch});
  try{
   await runtime.ready();expect(runtime.has('pawn','white')).toBe(false);expect(runtime.rest('pawn','white',0,true)).toBeNull();expect(fetcher).not.toHaveBeenCalled();
   online=true;listeners.get('online')?.();await vi.waitFor(()=>expect(fetcher).toHaveBeenCalledTimes(1));
  }finally{runtime.dispose();expect(listeners.has('online')).toBe(false);vi.unstubAllGlobals();}
 });
});
