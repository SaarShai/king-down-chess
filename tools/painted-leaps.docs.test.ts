import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';

it('ships 32 painted leap banks and keeps all walk and attack banks',()=>{
 const selection=JSON.parse(readFileSync('docs/specs/character-animation-samples/runtime-selection.json','utf8'));
 const runtime=JSON.parse(readFileSync('public/character-runtime/manifest.json','utf8'));
 expect(selection.entries).toHaveLength(846);
 expect(runtime.banks).toHaveLength(846);
 const counts=Object.fromEntries(['idle','turn','attack','move','movement'].map(kind=>[kind,runtime.banks.filter((b:any)=>b.kind===kind).length]));
 expect(counts).toEqual({idle:46,turn:272,attack:256,move:240,movement:32});
 for(const army of ['white','black']){
  const knight=runtime.banks.filter((b:any)=>b.army===army&&b.character==='knight'&&b.kind==='movement');
  expect(knight).toHaveLength(8);
  // The smoother leaps: 27 Knight and 28 Paladin frame slots, which the runtime streams during the jump.
  expect(knight.every((b:any)=>b.frames.length===27)).toBe(true);
  const paladin=runtime.banks.filter((b:any)=>b.army===army&&b.character==='paladin'&&b.kind==='movement');
  expect(paladin.map((b:any)=>b.facing).sort()).toEqual(['E','N','NE','NW','S','SE','SW','W']);
  expect(paladin.every((b:any)=>b.frames.length===28)).toBe(true);
 }
});
