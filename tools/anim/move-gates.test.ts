import { expect, it } from 'vitest';
import { runMoveGates } from './move-gates.mjs';

it('checks the painted source order, holds, placement and motion ranges', () => {
 const source=Array.from({length:4},(_,i)=>({sha256:String(i),durationMs:120,scale:1,translation:[0,0],pivot:[10,20]}));
 const bank={sampling:'nearest',durationMs:480,bodyHeightPx:100,pivot:[20,30],frames:source.map((f,i)=>({...f,timeMs:i*120,pivot:[10,20]}))};
 const args={bank,source,catalogHashes:new Set(source.map(f=>f.sha256)),restHashes:new Set<string>(),transform:{scaleGamePxPerSourcePx:1,canonicalPivot:[10,20],offsetGamePx:[-20,-30]},height:100,ranges:{topRangeAt160:9.9,groundRangeAt160:20.6}};
 expect(runMoveGates(args).status).toBe('pass');
 expect(runMoveGates({...args,bank:{...bank,pivot:[21,30]}}).failures).toContain('placement');
 expect(runMoveGates({...args,bank:{...bank,frames:[bank.frames[1],bank.frames[0],...bank.frames.slice(2)]}}).failures).toContain('painted-keys');
 expect(runMoveGates({...args,bank:{...bank,frames:bank.frames.map((f,i)=>i===1?{...f,method:'rife'}:f)}}).failures).toContain('painted-keys');
 expect(runMoveGates({...args,bank:{...bank,frames:bank.frames.map((f,i)=>i===1?{...f,timeMs:121}:f)}}).failures).toContain('timing');
 expect(runMoveGates({...args,restHashes:new Set(['0'])}).failures).toContain('painted-keys');
 expect(runMoveGates({...args,catalogHashes:new Set(['0','1','2'])}).failures).toContain('painted-keys');
 expect(runMoveGates({...args,ranges:{topRangeAt160:10,groundRangeAt160:20.6}}).failures).toContain('range');
});
