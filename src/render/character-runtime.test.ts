import { describe, expect, it, vi } from 'vitest';
import { createCharacterRuntime, anchorAt, bankPointToWorld, idleBankAt, facingOf, figureHeight, frameAt, turnRoute, reverseRoute, walkStride, type RuntimeBank } from './painted/character-runtime.mjs';
const bank = (from = 'SE', to = 'S'): RuntimeBank => ({ id: `${from}-${to}`, character: 'pawn', army: 'white', kind: 'turn', from, to, facing: 'SE', durationMs: 120, nearest: true, pivot: [384,700], canvasSize: [768,768], bodyHeightPx: 600, registrationHeightPx: 600, frames: [0,60,120].map(timeMs => ({ url: `frame-${timeMs}`, timeMs })) });

it('sets the final figure heights, and a walk stride follows its figure', () => {
 expect(['pawn','maester','knight','queen','beast','bishop','guard','ogre','rook'].map(figureHeight)).toEqual([82,84,129,132,104,125,108,116,132]);
 expect(walkStride({character:'maester',strideSquares:.84})).toBeCloseTo(.63);
 expect(walkStride({character:'knight',strideSquares:1})).toBeCloseTo(129/112);
 expect(walkStride({character:'rook',strideSquares:.9})).toBe(.9);
});

describe('ready character playback', () => {
 it('gives each frame its footprint from the table, and a missing frame its character\'s standing one', async () => {
  const sha=(c:string)=>c.repeat(64);
  const idle={...bank(),id:'idle',kind:'idle',frames:[{url:'rest',sourceSha256:sha('a'),timeMs:0}]};
  const move={...bank(),id:'walk',kind:'move',strideSquares:1,durationMs:40,frames:[{url:'walk-0',sourceSha256:sha('b'),timeMs:0},{url:'walk-1',sourceSha256:sha('c'),timeMs:20}]};
  const table={schemaVersion:1,keyLength:7,frames:{[sha('a').slice(0,7)]:[100,-3],[sha('b').slice(0,7)]:[140,4,-2,5,9]}};
  const urls:string[]=[];
  const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',wake:()=>{},fetcher:vi.fn(async(url:string)=>{urls.push(url);return {ok:true,json:async()=>url.endsWith('footprints.json')?table:{schemaVersion:1,banks:[idle,move]}};}) as unknown as typeof fetch,
   image:()=>{const img={naturalWidth:10,naturalHeight:10,onload:null as null|(()=>void),decode:async()=>{},removeAttribute:vi.fn(),set src(_:string){queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
  await runtime.ready();await vi.waitFor(()=>expect(urls).toContain('https://example.invalid/footprints.json'));
  await runtime.warm('pawn','white');
  const print=(body:unknown)=>(body as {footprint?:number[]}|null)?.footprint;
  await vi.waitFor(()=>expect(print(runtime.rest('pawn','white'))).toEqual([100,-3]));
  const prepared=await runtime.prepare('pawn','white','SE',false);
  expect(prepared).toBeTruthy();
  const at=(ms:number)=>runtime.action(prepared!,ms,40,0);
  expect(print(at(0))).toEqual([140,4,-2,5,9]);
  expect(print(at(25))).toEqual([100,-3]);
  runtime.dispose();
 });
 it('decodes a capture up to its contact frame before the attack starts', async () => {
  const idle={...bank(),id:'idle',kind:'idle',frames:[{url:'rest',timeMs:0}]};
  const attack={...idle,id:'attack-SE',kind:'attack',contactMs:60,durationMs:90,frames:Array.from({length:10},(_,i)=>({url:`attack-${i}`,timeMs:i*10}))};
  const make=(started:string[])=>createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,attack]})})) as unknown as typeof fetch,
   image:()=>{const img={naturalWidth:10,naturalHeight:10,onload:null as null|(()=>void),decode:async()=>{},removeAttribute:vi.fn(),set src(s:string){started.push(s.split('/').at(-1)!);queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
  const cold=make([]);
  const prepared=await cold.prepare('pawn','white','SE',true);
  expect((cold.action(prepared!,60,90,60) as {url?:string}|null)?.url).toBe('attack-6');
  cold.dispose();
  const started:string[]=[],selected=make(started);
  await selected.ready();await selected.prefetchMoves('pawn','white',[],['SE']);
  expect(started.filter(s=>s.startsWith('attack-'))).toEqual(Array.from({length:7},(_,i)=>`attack-${i}`));
  selected.dispose();
 });
 it('decodes a selected capture route before its bounded preparation', async () => {
  vi.useFakeTimers();
  const idle={...bank(),id:'idle',character:'king-frost',kind:'idle',frames:[{url:'rest',timeMs:0}]};
  const turn={...bank('SE','N'),id:'turn',character:'king-frost',frames:[idle.frames[0],...Array.from({length:17},(_,i)=>({url:`turn-${i}`,timeMs:i+1}))]};
  const attacks=['N','S'].map(facing=>({...idle,id:`attack-${facing}`,kind:'attack',facing,frames:Array.from({length:8},(_,i)=>({url:`attack-${facing}-${i}`,timeMs:i*10}))}));
  const started:string[]=[];
  const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,turn,...attacks]})})) as unknown as typeof fetch,
   image:()=>{const img={naturalWidth:10,naturalHeight:10,onload:null as null|(()=>void),decode:async()=>{},removeAttribute:vi.fn(),set src(s:string){started.push(s);setTimeout(()=>img.onload?.(),300);}};return img as unknown as HTMLImageElement;}});
  try{
   await runtime.ready();const warm=runtime.warm('king-frost','white');await vi.advanceTimersByTimeAsync(300);await warm;
   void runtime.prefetchMoves('king-frost','white',[],['N']);await vi.advanceTimersByTimeAsync(1000);
   expect(started.some(s=>s.endsWith('/turn-16'))).toBe(true);
   expect(started.filter(s=>s.includes('/attack-N-'))).toHaveLength(4);
   expect(started.some(s=>s.includes('/attack-S-'))).toBe(false);
   runtime.releaseMovePrefetch();const preparing=runtime.prepare('king-frost','white','N',true);await vi.advanceTimersByTimeAsync(1000);
   expect(await preparing).toMatchObject({attack:{id:'attack-N'}});
  }finally{runtime.dispose();vi.useRealTimers();}
 });
 it('keeps the selection\'s requests on the network for the move that follows', async () => {
  vi.useFakeTimers();
  const idle={...bank(),id:'idle',character:'king-frost',kind:'idle',frames:[{url:'rest',timeMs:0}]};
  const turn={...bank('SE','N'),id:'turn',character:'king-frost',frames:[idle.frames[0],{url:'turn-0',timeMs:60},{url:'turn-1',timeMs:120}]};
  const attack={...idle,id:'attack-N',kind:'attack',facing:'N',frames:Array.from({length:4},(_,i)=>({url:`attack-${i}`,timeMs:i*10}))};
  const started:string[]=[],aborted:string[]=[];
  const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,turn,attack]})})) as unknown as typeof fetch,
   image:()=>{let source='';const img={naturalWidth:10,naturalHeight:10,onload:null as null|(()=>void),decode:async()=>{},removeAttribute:()=>aborted.push(source),set src(s:string){source=s;started.push(s);setTimeout(()=>img.onload?.(),s.endsWith('/rest')?0:300);}};return img as unknown as HTMLImageElement;}});
  try{
   const ready=runtime.ready();await vi.advanceTimersByTimeAsync(10);await ready;const warm=runtime.warm('king-frost','white');await vi.advanceTimersByTimeAsync(10);await warm;
   void runtime.prefetchMoves('king-frost','white',[],['N']);await vi.advanceTimersByTimeAsync(100);
   expect(runtime.stats.active).toBe(6);
   // The click ends the selection, then the capture prepares: its frames already on the network are not asked again.
   runtime.releaseMovePrefetch();const preparing=runtime.prepare('king-frost','white','N',true);await vi.advanceTimersByTimeAsync(400);
   expect(await preparing).toMatchObject({attack:{id:'attack-N'}});
   expect(aborted).toEqual([]);expect(started.length).toBe(new Set(started).size);
  }finally{runtime.dispose();vi.useRealTimers();}
 });
 it('starts a selected King capture at once when one turn frame stalls, and holds the pose before it', async () => {
  // Live: 1 in 20 frame requests waits more than 500 ms for its first byte. One such request among the 50 frames of a
  // King capture held the start until the 1 s limit in 1 of 4 runs.
  vi.useFakeTimers();
  const idle={...bank(),id:'idle',character:'king-frost',kind:'idle',frames:[{url:'rest',timeMs:0}]};
  const turn={...bank('SE','N'),id:'turn',character:'king-frost',nearest:false,frames:[idle.frames[0],...Array.from({length:8},(_,i)=>({url:i===3?'stall':`turn-${i}`,timeMs:(i+1)*15}))]};
  const attack={...idle,id:'attack-N',kind:'attack',facing:'N',contactMs:120,durationMs:320,frames:Array.from({length:8},(_,i)=>({url:`attack-${i}`,timeMs:i*40}))};
  const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,turn,attack]})})) as unknown as typeof fetch,
   image:()=>{const img={naturalWidth:10,naturalHeight:10,onload:null as null|(()=>void),decode:async()=>{},removeAttribute:vi.fn(),set src(s:string){setTimeout(()=>img.onload?.(),s.endsWith('/stall')?3000:30);}};return img as unknown as HTMLImageElement;}});
  try{
   const ready=runtime.ready();await vi.advanceTimersByTimeAsync(10);await ready;const warm=runtime.warm('king-frost','white');await vi.advanceTimersByTimeAsync(40);await warm;
   void runtime.prefetchMoves('king-frost','white',[],['N']);await vi.advanceTimersByTimeAsync(1500);
   runtime.releaseMovePrefetch();let prepared:unknown=undefined;void runtime.prepare('king-frost','white','N',true).then(p=>{prepared=p;});
   await vi.advanceTimersByTimeAsync(50);
   expect(prepared).toMatchObject({attack:{id:'attack-N'}});
   // The stalled frame's slot shows the decoded turn frame before it.
   expect(runtime.action(prepared as never,-120+60,320,120)).toMatchObject({url:'turn-2'});
   expect(runtime.action(prepared as never,-120+75,320,120)).toMatchObject({url:'turn-4'});
  }finally{runtime.dispose();vi.useRealTimers();}
 });
 it('loads a capture in clock order, and loads again a warm frame that the selection stopped', async () => {
  vi.useFakeTimers();
  const idle={...bank(),id:'idle',character:'king-frost',kind:'idle',frames:[{url:'rest',timeMs:0}]};
  const others=Array.from({length:6},(_,i)=>({...idle,id:`other-${i}`,character:`other-${i}`,frames:[{url:`other-${i}`,timeMs:0}]}));
  const turn={...bank('SE','N'),id:'turn',character:'king-frost',frames:[idle.frames[0],...Array.from({length:8},(_,i)=>({url:`turn-${i}`,timeMs:(i+1)*15}))]};
  const attack={...idle,id:'attack-N',kind:'attack',facing:'N',contactMs:120,durationMs:320,frames:Array.from({length:8},(_,i)=>({url:`attack-${i}`,timeMs:i*40}))};
  const started:string[]=[];
  const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,turn,attack,...others]})})) as unknown as typeof fetch,
   image:()=>{const img={naturalWidth:10,naturalHeight:10,onload:null as null|(()=>void),decode:async()=>{},removeAttribute:vi.fn(),set src(s:string){started.push(s.split('/').at(-1)!);setTimeout(()=>img.onload?.(),s.includes('/other-')?300:30);}};return img as unknown as HTMLImageElement;}});
  try{
   const ready=runtime.ready();await vi.advanceTimersByTimeAsync(10);await ready;const warm=runtime.warm('king-frost','white');await vi.advanceTimersByTimeAsync(40);await warm;
   // The board warms the other figures: six slow loads fill the six slots when the King is selected.
   for(const other of others)void runtime.warm(other.character,'white');await vi.advanceTimersByTimeAsync(10);
   expect(runtime.stats.active).toBe(6);started.length=0;
   void runtime.prefetchMoves('king-frost','white',[],['N']);await vi.advanceTimersByTimeAsync(2000);
   expect(started.filter(s=>s.startsWith('turn-')||s.startsWith('attack-'))).toEqual([...Array.from({length:8},(_,i)=>`turn-${i}`),...Array.from({length:4},(_,i)=>`attack-${i}`)]);
   for(const other of others)expect(runtime.rest(other.character,'white')).toMatchObject({url:other.frames[0].url});
  }finally{runtime.dispose();vi.useRealTimers();}
 });
 it('plays a capture whose frames still load at the limit and holds the decoded poses', async () => {
  vi.useFakeTimers();
  const idle={...bank(),id:'idle',character:'king-frost',kind:'idle',frames:[{url:'rest',timeMs:0}]};
  const turn={...bank('SE','N'),id:'turn',character:'king-frost',nearest:false,frames:[idle.frames[0],{url:'turn-0',timeMs:40},{url:'late-turn',timeMs:80},{url:'late-end',timeMs:120}]};
  const attack={...idle,id:'attack-N',kind:'attack',facing:'N',frames:Array.from({length:4},(_,i)=>({url:`late-attack-${i}`,timeMs:i*10}))};
  const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,turn,attack]})})) as unknown as typeof fetch,
   image:()=>{const img={naturalWidth:10,naturalHeight:10,onload:null as null|(()=>void),decode:async()=>{},removeAttribute:vi.fn(),set src(s:string){if(!s.includes('/late-'))queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
  try{
   await runtime.warm('king-frost','white');const preparing=runtime.prepare('king-frost','white','N',true);await vi.advanceTimersByTimeAsync(1001);
   const prepared=await preparing as {releaseFallback:()=>void};expect(prepared).toMatchObject({attack:{id:'attack-N'}});
   // The end of the turn and the attack hold the last decoded turn frame until their own frames arrive.
   expect(runtime.action(prepared,-1,100,0)).toMatchObject({url:'turn-0'});
   expect(runtime.action(prepared,20,100,0)).toMatchObject({url:'turn-0'});
   expect(runtime.stats.active).toBeGreaterThan(0);prepared.releaseFallback();
  }finally{runtime.dispose();vi.useRealTimers();}
 });
 it('plays a walk whose later frames still load at the limit', async () => {
  vi.useFakeTimers();
  const idle={...bank(),id:'idle',kind:'idle',facing:'N',frames:[{url:'rest',timeMs:0}]};
  const move={...bank(),id:'walk',kind:'move',facing:'N',strideSquares:1,frames:[{url:'walk-0',timeMs:0},{url:'late-walk',timeMs:60}]};
  const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,move]})})) as unknown as typeof fetch,
   image:()=>{const img={naturalWidth:10,naturalHeight:10,onload:null as null|(()=>void),decode:async()=>{},removeAttribute:vi.fn(),set src(s:string){if(!s.includes('/late-'))queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
  try{
   const preparing=runtime.prepare('pawn','white','N',false,true);await vi.advanceTimersByTimeAsync(1001);
   const prepared=await preparing as {releaseMovement:()=>void};expect(prepared).toMatchObject({movement:{id:'walk'}});
   expect(runtime.action(prepared,70,1000,0)).toMatchObject({url:'walk-0'});prepared.releaseMovement();
  }finally{runtime.dispose();vi.useRealTimers();}
 });
 it('loads a capture\'s separate effect with the selection', async () => {
  const idle={...bank(),id:'idle',character:'archer',kind:'idle',facing:'N',frames:[{url:'rest',timeMs:0}]};
  const attack={...idle,id:'attack-N',kind:'attack',frames:[{url:'attack',timeMs:0}]};
  const module='data:text/javascript,export async function loadEffect(){globalThis.__effectLoads=(globalThis.__effectLoads||0)+1;return {durationMs:1,draw(){}};}';
  const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,attack],effects:{archer:{module,decodedBytes:1024,contactMs:10}}})})) as unknown as typeof fetch,
   image:()=>{const img={naturalWidth:10,naturalHeight:10,onload:null as null|(()=>void),decode:async()=>{},removeAttribute:vi.fn(),set src(_s:string){queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
  try{
   await runtime.ready();void runtime.prefetchMoves('archer','white',[],['N']);
   await vi.waitFor(()=>expect((globalThis as {__effectLoads?:number}).__effectLoads).toBe(1));
   runtime.releaseMovePrefetch();expect(await runtime.prepare('archer','white','N',true)).toMatchObject({effect:{contactMs:10}});
   expect((globalThis as {__effectLoads?:number}).__effectLoads).toBe(1);
  }finally{runtime.dispose();delete (globalThis as {__effectLoads?:number}).__effectLoads;}
 });
 it('loads the target walk while its turn endpoints load', async () => {
  const idle={...bank(),id:'idle',kind:'idle',frames:[{url:'rest',timeMs:0}]};
  const turn={...bank(),id:'turn',frames:[{url:'rest',timeMs:0},{url:'held-turn',timeMs:120}]};
  const move={...bank(),id:'walk',kind:'move',facing:'S',strideSquares:1,frames:[{url:'walk-0',timeMs:0},{url:'walk-1',timeMs:120}]};
  const started:string[]=[];let finishTurn=()=>{};
  const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,turn,move]})})) as unknown as typeof fetch,
   image:()=>{const img={naturalWidth:10,naturalHeight:10,onload:null as null|(()=>void),decode:async()=>{},removeAttribute:vi.fn(),set src(s:string){started.push(s);if(s.endsWith('/held-turn'))finishTurn=()=>img.onload?.();else queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
  const pending=runtime.prepare('pawn','white','S',false,true);await vi.waitFor(()=>expect(started.some(s=>s.endsWith('/walk-1'))).toBe(true));
  finishTurn();expect(await pending).toMatchObject({movement:{id:'walk'}});runtime.dispose();
 });
 it('finishes earlier selected facings before later ones', async () => {
  const idle={...bank(),id:'idle',kind:'idle',frames:[{url:'rest',timeMs:0},{url:'idle-extra',timeMs:60}]};
  const moves=['N','E','S'].map(facing=>({...bank(),id:`walk-${facing}`,kind:'move',facing,strideSquares:1,frames:Array.from({length:4},(_,i)=>({url:`walk-${facing}-${i}`,timeMs:i*20}))}));
  const started:string[]=[],finish:(()=>void)[]=[];
  const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,...moves]})})) as unknown as typeof fetch,
   image:()=>{const img={naturalWidth:10,naturalHeight:10,onload:null as null|(()=>void),decode:async()=>{},removeAttribute:vi.fn(),set src(s:string){started.push(s);finish.push(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
  await runtime.ready();void runtime.prefetchMoves('pawn','white',['N','E','S']);await vi.waitFor(()=>expect(started.filter(s=>s.includes('/walk-N-'))).toHaveLength(4));
  void runtime.warm('pawn','white',true);
  expect(started.some(s=>s.includes('/walk-E-'))).toBe(false);
  finish.slice(0,5).forEach(done=>done());await vi.waitFor(()=>expect(started.filter(s=>s.includes('/walk-E-'))).toHaveLength(4));
  expect(started.some(s=>s.includes('/idle-extra'))).toBe(false);
  runtime.releaseMovePrefetch();runtime.dispose();
 });
 it('prefetches turn endpoints and defers idle frames behind the walk', async () => {
  const idle={...bank(),id:'idle',kind:'idle',facing:'N',frames:[{url:'rest',timeMs:0},...Array.from({length:4},(_,i)=>({url:`idle-${i}`,timeMs:i+1}))]};
  const turn={...bank('N','E'),id:'turn',frames:[{url:'rest',timeMs:0},{url:'turn-E',timeMs:120}]};
  const move={...bank(),id:'walk',kind:'move',facing:'E',strideSquares:1,frames:Array.from({length:4},(_,i)=>({url:`walk-${i}`,timeMs:i*20}))},started:string[]=[];
  const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,turn,move]})})) as unknown as typeof fetch,
   image:()=>{const img={naturalWidth:10,naturalHeight:10,onload:null as null|(()=>void),decode:async()=>{},removeAttribute:vi.fn(),set src(s:string){started.push(s);if(s.endsWith('/rest'))queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
  await runtime.warm('pawn','white');void runtime.prefetchMoves('pawn','white',['E']);await vi.waitFor(()=>expect(started.some(s=>s.endsWith('/turn-E'))).toBe(true));
  void runtime.warm('pawn','white',true);await vi.waitFor(()=>expect(runtime.stats.queued).toBe(4));expect(started.some(s=>s.includes('/idle-'))).toBe(false);
  runtime.releaseMovePrefetch();runtime.dispose();
 });
 it('gives preparation the link even when idle downloads leave free slots', async () => {
  const idle={...bank(),id:'idle',kind:'idle',facing:'N',frames:[{url:'rest',timeMs:0},...Array.from({length:4},(_,i)=>({url:`idle-${i}`,timeMs:i+1}))]};
  const attack={...bank(),id:'attack',kind:'attack',facing:'N',frames:[{url:'attack',timeMs:0}]},removed:string[]=[];
  const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,attack]})})) as unknown as typeof fetch,
   image:()=>{let source='';const img={naturalWidth:10,naturalHeight:10,onload:null as null|(()=>void),decode:async()=>{},removeAttribute:()=>removed.push(source),set src(s:string){source=s;if(!s.includes('/idle-'))queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
  await runtime.ready();void runtime.warm('pawn','white',true);await vi.waitFor(()=>expect(runtime.stats.active).toBe(4));
  expect(await runtime.prepare('pawn','white','N',true)).toMatchObject({attack:{id:'attack'}});expect(removed).toHaveLength(4);runtime.dispose();
 });
 it('prioritizes walk preparation over idle downloads', async () => {
  const idle={...bank(),id:'idle',kind:'idle',facing:'N',frames:[{url:'rest',timeMs:0},...Array.from({length:6},(_,i)=>({url:`idle-${i}`,timeMs:i+1}))]};
  const move={...bank(),id:'walk',kind:'move',facing:'N',strideSquares:1,frames:Array.from({length:4},(_,i)=>({url:`walk-${i}`,timeMs:i*30}))};
  const started:string[]=[];
  const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,move]})})) as unknown as typeof fetch,
   image:()=>{const img={naturalWidth:10,naturalHeight:10,onload:null as null|(()=>void),decode:async()=>{},removeAttribute:vi.fn(),set src(s:string){started.push(s);if(!s.includes('/idle-'))queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
  await runtime.ready();void runtime.warm('pawn','white',true);await vi.waitFor(()=>expect(runtime.stats.active).toBe(5));runtime.rest('pawn','white',100,true);await vi.waitFor(()=>expect(runtime.stats.active).toBe(6));
  const prepared=await runtime.prepare('pawn','white','N',false,true);expect(prepared).toMatchObject({movement:{id:'walk'}});
  expect(started.filter(s=>s.includes('/walk-'))).toHaveLength(4);runtime.dispose();
 });
 it('prefetches only selected facings and lets captures interrupt it', async () => {
  const idle={...bank(),id:'idle',kind:'idle',facing:'N',frames:[{url:'rest',timeMs:0}]};
  const moves=['N','S'].map(facing=>({...bank(),id:`walk-${facing}`,kind:'move',facing,strideSquares:1,frames:Array.from({length:6},(_,i)=>({url:`walk-${facing}-${i}`,timeMs:i*20}))}));
  const attack={...bank(),id:'attack',kind:'attack',facing:'N',frames:[{url:'attack',timeMs:0}]},started:string[]=[];
  const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,...moves,attack]})})) as unknown as typeof fetch,
   image:()=>{const img={naturalWidth:10,naturalHeight:10,onload:null as null|(()=>void),decode:async()=>{},removeAttribute:vi.fn(),set src(s:string){started.push(s);if(!s.includes('/walk-'))queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
  await runtime.warm('pawn','white');void runtime.prefetchMoves('pawn','white',['N']);await vi.waitFor(()=>expect(runtime.stats.active).toBe(6));
  const capture=await runtime.prepare('pawn','white','N',true);expect(capture).toMatchObject({attack:{id:'attack'}});
  expect(started.some(s=>s.includes('/walk-S-'))).toBe(false);runtime.releaseMovePrefetch();runtime.dispose();
 });
 it('prepares a chain with one attack per bite and the turn back from the last bite', async () => {
  const idle={...bank(),id:'idle',kind:'idle',frames:[{url:'rest',timeMs:0}]};
  const attacks=['N','S'].map(facing=>({...idle,id:`attack-${facing}`,kind:'attack',facing,durationMs:100,frames:[{url:`attack-${facing}`,timeMs:0}]}));
  const turns=[{...bank('SE','N'),id:'turn-a',frames:[{url:'turn-a',timeMs:0}]},{...bank('N','S'),id:'turn-b',frames:[{url:'turn-b',timeMs:0}]}];
  const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,...attacks,...turns]})})) as unknown as typeof fetch,
   image:()=>{const img={naturalWidth:10,naturalHeight:10,onload:null as null|(()=>void),decode:async()=>{},removeAttribute:vi.fn(),set src(_s:string){queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
  await runtime.ready();
  const prepared=await runtime.prepare('pawn','white','N',true,false,undefined,['N','S']) as {chain:{attack:{id:string},turnMs:number}[],after:{bank:{id:string}}[]};
  expect(prepared.chain.map(bite=>[bite.attack.id,bite.turnMs])).toEqual([['attack-N',0],['attack-S',120]]);
  const shown=(ms:number)=>(runtime.action(prepared,ms,320,50) as {bank:string}).bank;
  expect(shown(50)).toBe('attack-N');
  expect(shown(160)).toBe('turn-b');
  expect(shown(270)).toBe('attack-S');
  // The way back to rest starts from the last bite's facing.
  expect(prepared.after.map(part=>part.bank.id)).toEqual(['turn-b','turn-a']);
  runtime.dispose();
 });
 it('keeps the start frames of a capture decoded until the capture ends', async () => {
  const idle={...bank(),id:'idle',kind:'idle',frames:[{url:'rest',timeMs:0}]};
  const attack={...idle,id:'attack',kind:'attack',facing:'SE',frames:[{url:'attack-0',timeMs:0}]};
  const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,attack]})})) as unknown as typeof fetch,
   image:()=>{const img={naturalWidth:10,naturalHeight:10,onload:null as null|(()=>void),decode:async()=>{},removeAttribute:vi.fn(),set src(_s:string){queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
  await runtime.ready();
  const prepared=await runtime.prepare('pawn','white','SE',true) as {releaseFallback?:()=>void};
  expect(prepared.releaseFallback).toBeTypeOf('function');
  prepared.releaseFallback?.();runtime.dispose();
 });
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
  const idle={...bank(),id:'idle',kind:'idle',facing:'N',frames:[{url:'rest',timeMs:0}]};
  const move={...bank(),id:'painted',kind:'move',facing:'N',strideSquares:1,nearest:true,durationMs:600,frames:[0,120,360].map(timeMs=>({url:`walk-${timeMs}`,timeMs}))};
  const older={...move,id:'older',kind:'movement'};
  const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,older,move]})})) as unknown as typeof fetch,
   image:()=>{const img={naturalWidth:10,naturalHeight:10,onload:null as null|(()=>void),decode:async()=>{},set src(_s:string){queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
  const prepared=await runtime.prepare('pawn','white','N',false,true);
  expect((prepared as {movement:{id:string}} | null)?.movement?.id).toBe('painted');
  expect([0,119,120,359,360,599,600,720].map(t=>(runtime.action(prepared,t,1000,0) as {time:number}).time)).toEqual([0,0,120,120,360,360,0,120]);
  (prepared as {movementRate:number}).movementRate=2;
  expect((runtime.action(prepared,60,1000,0) as {time:number}).time).toBe(120);
  expect((runtime.action(prepared,1000,1000,0,'end') as {bank:string}).bank).toBe('idle');
  expect((runtime.action(prepared,1001,1000,0) as {bank:string}).bank).toBe('idle');
  runtime.dispose();
 });
 it('returns no prepared action when a painted walk has no turn route', async () => {
  const idle={...bank(),id:'idle',kind:'idle',frames:[{url:'rest',timeMs:0}]};
  const move={...bank(),id:'painted',kind:'move',facing:'N',strideSquares:1,frames:[{url:'walk',timeMs:0}]};
  const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,move]})})) as unknown as typeof fetch,
   image:()=>{const img={naturalWidth:10,naturalHeight:10,onload:null as null|(()=>void),decode:async()=>{},set src(_s:string){queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
  expect(await runtime.prepare('pawn','white','N',false,true)).toBeNull();runtime.dispose();
 });
 it('shows the outward turn endpoint before the painted walk', async () => {
  const idle={...bank(),id:'idle',kind:'idle',frames:[{url:'rest',timeMs:0}]};
  const turn={...bank(),id:'turn',frames:[{url:'rest',timeMs:0},{url:'facing',timeMs:120}]};
  const move={...bank(),id:'painted',kind:'move',facing:'S',strideSquares:1,frames:[{url:'walk',timeMs:0}]};
  const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,turn,move]})})) as unknown as typeof fetch,
   image:()=>{const img={naturalWidth:10,naturalHeight:10,onload:null as null|(()=>void),decode:async()=>{},set src(_s:string){queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
  const prepared=await runtime.prepare('pawn','white','S',false,true);
  expect(runtime.action(prepared,0,640,0,'turn-end')).toMatchObject({bank:'turn',url:'facing'});
  expect(runtime.action(prepared,0,640,0,'start')).toMatchObject({bank:'painted',url:'walk'});runtime.dispose();
 });
 it('does not play a painted walk with an invalid stride', async () => {
  const idle={...bank(),id:'idle',kind:'idle',facing:'N',frames:[{url:'rest',timeMs:0}]};
  const move={...bank(),id:'painted',kind:'move',facing:'N',strideSquares:0,frames:[{url:'walk',timeMs:0}]};
  const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,move]})})) as unknown as typeof fetch,
   image:()=>{const img={naturalWidth:10,naturalHeight:10,onload:null as null|(()=>void),decode:async()=>{},set src(_s:string){queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
  const prepared=await runtime.prepare('pawn','white','N',false,true) as {movement:unknown};expect(prepared.movement).toBeNull();runtime.dispose();
 });
 it.each(['knight','paladin'])('selects %s jump poses for both armies and falls back for missing or slow banks', async character => {
  vi.useFakeTimers();
  const banks=['white','black'].flatMap(army=>{
   const idle={...bank(),character,army,id:`${army}-idle`,kind:'idle',facing:'SE',frames:[{url:`${army}-rest`,timeMs:0}]};
   const turn={...idle,id:`${army}-turn`,kind:'turn',from:'SE',to:'N',frames:[idle.frames[0],{url:`${army}-N`,timeMs:120}]};
   const movement={...idle,id:`${army}-jump`,kind:'movement',nearest:false,durationMs:1350,frames:[0,90,300,510,840,1107,1250,1350].map(timeMs=>({url:`${army}-jump-${timeMs}`,timeMs}))};
   return [idle,turn,movement,{...idle,id:`${army}-attack`,kind:'attack'}];
  });
  let slow=false;
  const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks})})) as unknown as typeof fetch,
   image:()=>{const img={naturalWidth:10,naturalHeight:10,onload:null as null|(()=>void),decode:async()=>{},removeAttribute:vi.fn(),set src(s:string){if(!slow||!s.includes('jump-'))queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
  try{
   const ready=await runtime.prepare(character,'white','SE',false,false) as any;
   expect(ready.movement.id).toBe('white-jump');
   expect([89,90,1106,1107,1350].map(t=>(runtime.action(ready,t,1350,1107) as {time:number}).time)).toEqual([0,90,840,1107,1350]);
   const capture=await runtime.prepare(character,'white','SE',true,false) as any;
   expect(capture.attack?.id).toBe('white-attack');
   expect(capture.movement).toBeNull();
   const missing=await runtime.prepare(character,'white','N',false,false) as any;
   expect(missing.movement).toBeNull();expect(runtime.action(missing,500,1350,1107)).toMatchObject({bank:'white-turn'});
   slow=true;
   const pending=runtime.prepare(character,'black','SE',false,false);await vi.advanceTimersByTimeAsync(1000);
   const fallback=await pending as any;
   expect(fallback.movement).toBeNull();expect(runtime.action(fallback,500,1350,1107)).toMatchObject({bank:'black-idle'});
   expect(runtime.stats.active).toBe(0);
  }finally{runtime.dispose();vi.useRealTimers();}
 });
 it('starts a jump on its first frames and streams the rest, every second frame first, holding the last decoded pose', async () => {
  vi.useFakeTimers();
  const idle={...bank(),character:'knight',id:'idle',kind:'idle',frames:[{url:'rest',timeMs:0}]};
  const leap={...idle,id:'leap',kind:'movement',nearest:false,durationMs:450,frames:[...Array.from({length:9},(_,i)=>({url:`leap-${i}`,timeMs:i*50})),{url:'rest',timeMs:450}]};
  const started:string[]=[],cancelled:string[]=[],held=new Map<string,()=>void>();
  const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,leap]})})) as unknown as typeof fetch,
   image:()=>{let name='';const img={naturalWidth:10,naturalHeight:10,onload:null as null|(()=>void),decode:async()=>{},removeAttribute:()=>cancelled.push(name),set src(s:string){name=s.split('/').at(-1)!;started.push(name);const load=()=>img.onload?.();if(/^leap-[4-8]$/.test(name))held.set(name,load);else queueMicrotask(load);}};return img as unknown as HTMLImageElement;}});
  try{
   const pending=runtime.prepare('knight','white','SE',false,false);await vi.advanceTimersByTimeAsync(1000);
   const prepared=await pending as any;
   expect(prepared.movement?.id).toBe('leap');
   // A 768 px frame keeps seven frames past the playhead within a quarter of the decoded budget.
   expect(started.filter(s=>s.startsWith('leap-'))).toEqual(['leap-0','leap-1','leap-2','leap-3','leap-4','leap-6','leap-8','leap-5','leap-7']);
   const at=(t:number)=>(runtime.action(prepared,t,450,0) as {url:string}).url;
   expect(at(260)).toBe('leap-3');
   // The passed frame in transfer runs on, and is the nearer pose once decoded.
   expect(cancelled).toEqual([]);
   held.get('leap-4')!();await vi.advanceTimersByTimeAsync(0);expect(at(260)).toBe('leap-4');
   held.get('leap-5')!();await vi.advanceTimersByTimeAsync(0);
   expect(at(260)).toBe('leap-5');expect(at(450)).toBe('rest');
   prepared.releaseMovementStart?.();prepared.releaseMovement?.();prepared.releaseFallback?.();
  }finally{runtime.dispose();vi.useRealTimers();}
 });
 it('starts a jump while its frames load when the measured link brings each in time, and waits for a late first frame', async () => {
  vi.useFakeTimers();
  const banks=['white','black'].flatMap(army=>{
   const idle={...bank(),character:'knight',army,id:`${army}-idle`,kind:'idle',frames:[{url:`${army}-rest`,timeMs:0}]};
   return [idle,{...idle,id:`${army}-leap`,kind:'movement',nearest:false,durationMs:900,frames:[...Array.from({length:9},(_,i)=>({url:`${army}-leap-${i}`,timeMs:i*100})),idle.frames[0]]}];
  });
  // A frame decodes 20 ms after its request, the other white leap frames 150 ms after it, a black leap frame 400 ms after it.
  const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks})})) as unknown as typeof fetch,
   image:()=>{const img={naturalWidth:10,naturalHeight:10,onload:null as null|(()=>void),decode:async()=>{},removeAttribute:()=>{},set src(s:string){setTimeout(()=>img.onload?.(),/black-leap/.test(s)?400:/white-leap-[1-8]/.test(s)?150:20);}};return img as unknown as HTMLImageElement;}});
  const settle=async(prepare:Promise<unknown>)=>{let at:number|null=null;const began=performance.now();void prepare.then(()=>{at=performance.now()-began;});for(let t=0;t<1100&&at===null;t+=5)await vi.advanceTimersByTimeAsync(5);return {at:at as unknown as number,prepared:await prepare as any};};
  try{
   const warm=runtime.warm('knight','white');await vi.advanceTimersByTimeAsync(100);await warm;
   // The link is fast: the jump starts on its first frame. Its next frames come within the hold, so it does not wait for them.
   const fast=await settle(runtime.prepare('knight','white','SE',false,false));
   expect(fast.prepared.movement?.id).toBe('white-leap');expect(fast.at).toBeLessThanOrEqual(30);expect(runtime.stats.active+runtime.stats.queued).toBeGreaterThan(0);
   fast.prepared.releaseMovementStart?.();fast.prepared.releaseMovement?.();fast.prepared.releaseFallback?.();
   const warmBlack=runtime.warm('knight','black');await vi.advanceTimersByTimeAsync(100);await warmBlack;
   // A first frame past the measured latency is late: the start waits for it, within the limit.
   const late=await settle(runtime.prepare('knight','black','SE',false,false));
   expect(late.prepared.movement?.id).toBe('black-leap');expect(late.at).toBeGreaterThanOrEqual(400);expect(late.at).toBeLessThan(1000);
   late.prepared.releaseMovementStart?.();late.prepared.releaseMovement?.();late.prepared.releaseFallback?.();
  }finally{runtime.dispose();vi.useRealTimers();}
 });
 it('streams a selected jump on a slow link in fewer slots: it starts soon, loads no frame twice and holds no needed pose 150 ms past its slot', async () => {
  vi.useFakeTimers();vi.advanceTimersByTime(100);
  const idle={...bank(),character:'knight',id:'idle',kind:'idle',frames:[{url:'rest',timeMs:0}]};
  const times=[0,50,100,150,200,250,300,352.5,405,457.5,510,576,642,708,774,840,893.4,946.8,1000.2,1053.6,1107,1142.75,1178.5,1214.25,1250,1300,1350];
  const leap={...idle,id:'leap',kind:'movement',nearest:false,durationMs:1350,canvasSize:[388,388] as [number,number],frames:times.map((timeMs,i)=>({url:`leap-${i}`,timeMs}))};
  // The link of the slow-link probe: the first byte 150 ms after the request, then 200 bytes a millisecond that all
  // transfers share; a frame is 20 kB. The resource timing of each frame comes before its load event.
  let report=(_list:{getEntries():unknown[]})=>{};
  vi.stubGlobal('PerformanceObserver',class{constructor(callback:typeof report){report=callback;}observe(){}disconnect(){}});
  const flows=new Set<{ready:number;left:number;end:()=>void}>(),starts:string[]=[];
  const link=setInterval(()=>{const now=performance.now(),ready=[...flows].filter(f=>f.ready<=now);for(const f of ready){f.left-=2000/ready.length;if(f.left<=0){flows.delete(f);f.end();}}},10);
  const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,leap]})})) as unknown as typeof fetch,
   image:()=>{let flow:{ready:number;left:number;end:()=>void}|null=null;const img={naturalWidth:388,naturalHeight:388,onload:null as null|(()=>void),decode:async()=>{},removeAttribute:()=>{if(flow)flows.delete(flow);},set src(s:string){
    if(s.endsWith('/rest')){queueMicrotask(()=>img.onload?.());return;}
    const began=performance.now();starts.push(s.split('/').at(-1)!);
    flow={ready:began+150,left:20000,end:()=>{report({getEntries:()=>[{name:s,requestStart:began,responseStart:began+150,responseEnd:performance.now(),transferSize:20000}]});img.onload?.();}};flows.add(flow);
   }};return img as unknown as HTMLImageElement;}});
  try{
   // Select, then click one second later, as the probe does.
   void runtime.prefetchMoves('knight','white',['SE']);await vi.advanceTimersByTimeAsync(1000);runtime.releaseMovePrefetch();
   let prepared:any=null,wait=0;const click=performance.now();void runtime.prepare('knight','white','SE',false,false).then(p=>{prepared=p;wait=performance.now()-click;});
   while(!prepared&&performance.now()-click<2000)await vi.advanceTimersByTimeAsync(10);
   expect(prepared?.movement?.id).toBe('leap');
   let late=0;
   for(let t=0;t<=1350;t+=10){const body=runtime.action(prepared,t,1350,0) as {time:number};const next=times.find(x=>x>body.time)??1350;late=Math.max(late,t-next);await vi.advanceTimersByTimeAsync(10);}
   // Main: six transfers share the link, the click stops the selection's transfers and loads them again, and the jump
   // waits 760 ms.
   expect(late).toBeLessThanOrEqual(150);expect(wait).toBeLessThanOrEqual(400);expect(new Set(starts).size).toBe(starts.length);
   prepared.releaseMovementStart?.();prepared.releaseMovement?.();prepared.releaseFallback?.();
  }finally{clearInterval(link);runtime.dispose();vi.unstubAllGlobals();vi.useRealTimers();}
 });
 it('keeps a partly cached jump while its missing frames load under cache pressure', async()=>{
  const idle={...bank(),character:'paladin',id:'idle',kind:'idle',frames:[{url:'rest',timeMs:0}]};
  const movement={...idle,id:'charge',kind:'movement',nearest:false,frames:[0,60,120].map(timeMs=>({url:`charge-${timeMs}`,timeMs}))};
  const others=Array.from({length:13},(_,i)=>({...idle,character:`other-${i}`,id:`other-${i}`,frames:[{url:`other-${i}`,timeMs:0}]}));
  const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,movement,...others]})})) as unknown as typeof fetch,
   image:()=>{const img={naturalWidth:1024,naturalHeight:1024,onload:null as null|(()=>void),decode:async()=>{},set src(_s:string){queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
  try{
   await runtime.prefetchMoves('paladin','white',['SE']);
   for(const other of others)await runtime.warm(other.character,'white');
   const prepared=await runtime.prepare('paladin','white','SE',false,false) as any;
   expect(prepared.movement?.id).toBe('charge');
   expect([0,60,120].map(t=>(runtime.action(prepared,t,120,0) as {time:number}).time)).toEqual([0,60,120]);
   expect(runtime.stats.peakBytes).toBeLessThanOrEqual(64*1024*1024);
   prepared.releaseMovementStart?.();prepared.releaseMovement?.();prepared.releaseFallback?.();
  }finally{runtime.dispose();}
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
   expect(sample(0)).toMatchObject({bank:`${army}-move`,pivot:[100,200],scale:82/400});
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
   expect(runtime.stats).toMatchObject({active:1,queued:0});expect(removed).toHaveLength(6);expect(releases.size).toBe(7);
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
 it('streams a turn frame still loading at the limit, reloads it after release and ignores its late callback', async () => {
  vi.useFakeTimers();
  try {
   const idle={...bank(),kind:'idle',frames:[{url:'frame-0',timeMs:0}]},turn=bank();let finish=()=>{},attempts=0;
   const runtime=createCharacterRuntime({url:'https://example.invalid/package/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,turn]})})) as unknown as typeof fetch,
    image:()=>{const img={naturalWidth:384,naturalHeight:384,onload:null as null|(()=>void),onerror:null as null|(()=>void),decode:async()=>{},set src(s:string){if(s.endsWith('/frame-120')&&++attempts===1){const callback=img.onload;finish=()=>callback?.();}else queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
   await runtime.warm('pawn','white');const preparing=runtime.prepare('pawn','white','S',false);
   await vi.advanceTimersByTimeAsync(1001);const streamed=await preparing as {releaseFallback:()=>void};expect(streamed).not.toBeNull();
   expect(runtime.stats.active).toBe(1);
   streamed.releaseFallback();expect(runtime.stats.active).toBe(0);
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
   let attempts=0;const runtime=createCharacterRuntime({fetcher:vi.fn(async(url:string)=>{if(url.endsWith('manifest.json'))attempts++;if(attempts===1)throw Error('offline');return {ok:true,json:async()=>({schemaVersion:1,banks:[{...bank(),kind:'idle'}]})} as Response;}) as unknown as typeof fetch});
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
 it('never loads the package of an effect the scene draws itself', async () => {
  const idle={...bank(),kind:'idle',frames:[{url:'frame-0',timeMs:0}]},attack={...bank(),kind:'attack',facing:'SE',frames:[{url:'frame-0',timeMs:0}]};
  const module='data:text/javascript,'+encodeURIComponent('globalThis.__drawnEffectLoaded=true;export const loadEffect=()=>({})');
  const runtime=createCharacterRuntime({url:'https://example.invalid/package/manifest.json',drawnEffects:['pawn'],fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,attack],effects:{pawn:{module,decodedBytes:5000,contactMs:600}}})})) as unknown as typeof fetch,
   image:()=>{const img={naturalWidth:384,naturalHeight:384,onload:null as null|(()=>void),decode:async()=>{},set src(_s:string){queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
  await runtime.warm('pawn','white');const base=runtime.stats.bytes;
  const prepared=await runtime.prepare('pawn','white','SE',true);
  expect((prepared as {effect?:unknown}).effect).toMatchObject({player:null,contactMs:600});expect(runtime.stats.bytes).toBe(base);
  expect((globalThis as {__drawnEffectLoaded?:boolean}).__drawnEffectLoaded).toBeUndefined();runtime.dispose();
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

 it('streams a late effect: the shot starts at the limit and its player appears when the art is decoded', async () => {
  vi.useFakeTimers();
  try {
   const idle={...bank(),kind:'idle',frames:[{url:'frame-0',timeMs:0}]},attack={...bank(),kind:'attack',facing:'SE'},module='data:text/javascript,export const loadEffect=()=>new Promise(resolve=>{globalThis.__lateResolve=resolve})';
   const runtime=createCharacterRuntime({url:'https://example.invalid/package/manifest.json',lateEffects:['pawn'],fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[idle,attack],effects:{pawn:{module,decodedBytes:100,contactMs:50}}})})) as unknown as typeof fetch,
    image:()=>{const img={naturalWidth:384,naturalHeight:384,onload:null as null|(()=>void),decode:async()=>{},set src(_s:string){queueMicrotask(()=>img.onload?.());}};return img as unknown as HTMLImageElement;}});
   await runtime.warm('pawn','white');const preparing=runtime.prepare('pawn','white','SE',true);
   await vi.advanceTimersByTimeAsync(1001);const prepared=await preparing as {effect:{contactMs:number,player:unknown}};
   expect(prepared.effect.contactMs).toBe(50);expect(prepared.effect.player).toBeNull();
   const player={durationMs:1,draw(){}};(globalThis as {__lateResolve?:(value:object)=>void}).__lateResolve?.(player);await vi.advanceTimersByTimeAsync(0);
   expect(prepared.effect.player).toBe(player);
   delete (globalThis as {__lateResolve?:unknown}).__lateResolve;runtime.dispose();
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
  const fetcher=vi.fn(async(_url:string)=>({ok:true,json:async()=>({schemaVersion:1,banks:[]})})),listeners=new Map<string,()=>void>();let online=false;
  vi.stubGlobal('addEventListener',(name:string,fn:()=>void)=>listeners.set(name,fn));vi.stubGlobal('removeEventListener',(name:string)=>listeners.delete(name));
  vi.stubGlobal('navigator',{get onLine(){return online;}});
  const runtime=createCharacterRuntime({url:'https://example.invalid/manifest.json',fetcher:fetcher as unknown as typeof fetch});
  try{
   await runtime.ready();expect(runtime.has('pawn','white')).toBe(false);expect(runtime.rest('pawn','white',0,true)).toBeNull();expect(fetcher).not.toHaveBeenCalled();
   online=true;listeners.get('online')?.();await vi.waitFor(()=>expect(fetcher).toHaveBeenCalledWith('https://example.invalid/manifest.json'));
  }finally{runtime.dispose();expect(listeners.has('online')).toBe(false);vi.unstubAllGlobals();}
 });
});
