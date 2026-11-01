import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';

it('ships every attack frame as an accepted key or a listed in-between, with transparent edges', async () => {
 const root=resolve('public/character-runtime');
 const manifest=JSON.parse(readFileSync(resolve(root,'manifest.json'),'utf8'));
 const accepted=JSON.parse(readFileSync(resolve('docs/specs/character-animation-samples/painted-attack-keys.json'),'utf8'));
 const smooth=JSON.parse(readFileSync(resolve('docs/specs/character-animation-samples/smooth-attack-frames.json'),'utf8'));
 const attacks=manifest.banks.filter((bank:any)=>bank.kind==='attack');
 expect(attacks).toHaveLength(256);
 expect(accepted).toHaveLength(255);
 expect(smooth).toHaveLength(191);
 for(const bank of attacks){
  expect(bank.frames.at(-1).sourceSha256,bank.id).toBe(bank.frames[0].sourceSha256);
  if(bank.character==='paladin'&&bank.army==='black'&&bank.id==='black-attack-N')continue;
  expect(accepted.some((r:any)=>r.character===bank.character&&r.army===bank.army&&r.direction===bank.facing),bank.id).toBe(true);
 }
 // Keys-only banks play the accepted keys at their accepted times. The four kings Flame, Frost, Mud and Shadow
 // stay keys only: their machine in-betweens failed the visual check (issue 37).
 const keysOnly=new Set(['king-flame','king-frost','king-mud','king-shadow']);
 let retimed=0;
 for(const record of accepted){
  const name=`${record.character}/${record.army}/${record.direction}`;
  const bank=attacks.find((b:any)=>b.character===record.character&&b.army===record.army&&b.facing===record.direction);
  const listed=smooth.find((s:any)=>s.character===record.character&&s.army===record.army&&s.direction===record.direction);
  expect(bank,name).toBeDefined();
  expect(Boolean(listed),name).toBe(!keysOnly.has(record.character));
  expect(bank.nearest).toBe(true);
  expect(bank.contactMs).toBe(record.contactMs);
  if(['maester','queen','archer'].includes(record.character))expect(bank.beatTimes.release).toBe(record.contactMs);
  // The record's contact key: its last key at contactMs (record times are rounded to 1 ms, so allow half a ms).
  const contactKey=record.frames.findLast((f:any)=>f.timeMs<=record.contactMs+0.5).sha256;
  expect(bank.frames.findLast((f:any)=>f.timeMs<=record.contactMs).sourceSha256,`${name} contact`).toBe(contactKey);
  if(!listed){
   expect(bank.frames.map((f:any)=>({sha256:f.sourceSha256,timeMs:f.timeMs})),name).toEqual(record.frames);
   continue;
  }
  const keys=new Set(record.frames.map((f:any)=>f.sha256));
  const between=new Map(listed.inbetweens.map((f:any)=>[`${f.timeMs}:${f.sha256}`,f]));
  for(const f of listed.inbetweens)expect(keys.has(f.sha256),`${name} ${f.timeMs}`).toBe(false);
  // Every frame is a key or a listed in-between; the keys keep their order and count.
  const shown=bank.frames.filter((f:any)=>!between.has(`${f.timeMs}:${f.sourceSha256}`));
  for(const f of shown)expect(keys.has(f.sourceSha256),`${name} ${f.timeMs}`).toBe(true);
  expect(shown.map((f:any)=>f.sourceSha256),name).toEqual(record.frames.map((f:any)=>f.sha256));
  expect(shown.map((f:any)=>f.timeMs),name).toEqual(listed.keyTimes);
  expect(bank.frames.length,name).toBe(shown.length+listed.inbetweens.length);
  // Smooth banks play the keys at their painted smooth times. The accepted record holds the keys-only times:
  // the same within 1 ms (1/3 ms rounding), except that keys only moved the second key to 120 ms.
  for(const [index,f] of shown.entries()){
   const was=record.frames[index].timeMs;
   if(Math.abs(f.timeMs-was)<1)continue;
   expect([index,was],`${name} key ${index}`).toEqual([1,120]);
   expect(f.timeMs>120&&f.timeMs<shown[2].timeMs,`${name} key 1`).toBe(true);
   retimed++;
  }
  // Each in-between sits between the two keys it was made from.
  for(const [index,frame] of bank.frames.entries()){
   const f=between.get(`${frame.timeMs}:${frame.sourceSha256}`) as any;
   if(!f)continue;
   expect(bank.frames.slice(0,index).findLast((x:any)=>keys.has(x.sourceSha256))?.sourceSha256,`${name} ${f.timeMs}`).toBe(f.sources[0]);
   expect(bank.frames.slice(index+1).find((x:any)=>keys.has(x.sourceSha256))?.sourceSha256,`${name} ${f.timeMs}`).toBe(f.sources[1]);
  }
 }
 // 47 smooth banks put the second key back at its painted time: pawn 14, maester 14, ogre 2, Spirit 16, Stratus 1.
 expect(retimed).toBe(47);
 const cues=JSON.parse(readFileSync(resolve('docs/specs/character-animation-samples/painted-attack-cues.json'),'utf8'));
 for(const cue of cues){
  const bank=attacks.find((b:any)=>b.character===cue.character&&b.army===cue.army&&b.facing===cue.facing);
  expect(bank.beatTimes).toMatchObject(cue.beatTimes);
  expect(bank.effectAnchors).toEqual(cue.effectAnchors);
  expect(bank.targetPoint).toEqual(cue.targetPoint);
 }
 for(const king of ['frost','flame','mud','shadow','spirit','stratus'])expect(attacks.filter((b:any)=>b.character===`king-${king}`)).toHaveLength(16);
 const files=[...new Set<string>(attacks.flatMap((bank:any)=>bank.frames.map((f:any)=>f.url)))];
 for(const file of files){
  const {data,info}=await sharp(resolve(root,file)).ensureAlpha().extractChannel('alpha').raw().toBuffer({resolveWithObject:true});
  let clear=true;
  for(let x=0;x<info.width;x++)if(data[x]||data[(info.height-1)*info.width+x])clear=false;
  for(let y=0;y<info.height;y++)if(data[y*info.width]||data[y*info.width+info.width-1])clear=false;
  expect(clear,file).toBe(true);
 }
}, 240_000);
