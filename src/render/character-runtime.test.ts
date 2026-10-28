import { describe, expect, it, vi } from 'vitest';
import { createCharacterRuntime, anchorAt, bankPointToWorld, idleBankAt, facingOf, frameAt, turnRoute, reverseRoute, type RuntimeBank } from '../../docs/2d-first-pieces/board/character-runtime.mjs';
const bank = (from = 'SE', to = 'S'): RuntimeBank => ({ id: `${from}-${to}`, character: 'pawn', army: 'white', kind: 'turn', from, to, facing: 'SE', durationMs: 120, nearest: true, pivot: [384,700], canvasSize: [768,768], bodyHeightPx: 600, registrationHeightPx: 600, frames: [0,60,120].map(timeMs => ({ url: `frame-${timeMs}`, timeMs })) });

describe('ready character playback', () => {
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
 it('loads the requested piece only and discards late decodes after disposal', async () => {
  const a = {...bank(),kind:'idle'}, other={...a,character:'knight'}, sources:string[]=[], pending:(()=>void)[]=[];
  const runtime=createCharacterRuntime({url:'https://example.invalid/character-runtime/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[a,other]})})) as unknown as typeof fetch,
   image:()=>{const img={onload:()=>{},decode:async()=>{},set src(s:string){sources.push(s);pending.push(()=>img.onload());}};return img as unknown as HTMLImageElement;}});
  await runtime.ready();const loading=runtime.warm('pawn','white');await Promise.resolve();
  expect(sources).toEqual(['https://example.invalid/character-runtime/frame-0']);
  runtime.dispose();pending[0]();await loading;expect(runtime.rest('pawn','white')).toBeNull();
 });
 it('projects authored effect anchors through the body pivot and scale without another facing flip', () => {
  const b={...bank(),effectAnchors:[{id:'ocular',timeMs:100,point:[200,100] as [number,number]},{id:'ocular',timeMs:200,point:[220,120] as [number,number]}]};
  expect(anchorAt(b,'ocular',150)).toEqual([210,110]);expect(anchorAt(b,'ocular',0)).toEqual([200,100]);expect(anchorAt(b,'missing',150)).toBeNull();
  expect(bankPointToWorld({pivot:[192,350],scale:.4},{x:424,y:464},[210,110])).toEqual({x:431.2,y:368});
 });
 it('bounds decoded pixels while the six-slot loader fills a clip', async () => {
  const b={...bank(),kind:'idle'},sources:string[]=[];
  const runtime=createCharacterRuntime({url:'https://example.invalid/package/manifest.json',fetcher:vi.fn(async()=>({ok:true,json:async()=>({schemaVersion:1,banks:[b]})})) as unknown as typeof fetch,
   image:()=>{const img={naturalWidth:4096,naturalHeight:4096,onload:()=>{},decode:async()=>{},set src(s:string){sources.push(s);queueMicrotask(()=>img.onload());}};return img as unknown as HTMLImageElement;}});
  await runtime.warm('pawn','white',true);
  expect(sources).toHaveLength(3);expect(runtime.stats.bytes).toBeLessThanOrEqual(64*1024*1024);expect(runtime.stats.peakBytes).toBeLessThanOrEqual(64*1024*1024);expect(runtime.stats.active).toBe(0);
  expect(runtime.rest('pawn','white')).not.toBeNull();runtime.dispose();
 });
 it('keeps the previous art available when the optional package fails', async () => {
  const runtime=createCharacterRuntime({fetcher:vi.fn(async()=>{throw Error('offline');}) as unknown as typeof fetch});
  await runtime.ready();expect(runtime.has('pawn','white')).toBe(false);expect(runtime.rest('queen','white',100,true)).toBeNull();expect(await runtime.prepare('pawn','white','E',true)).toBeNull();runtime.dispose();
 });
});
