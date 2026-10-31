import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';

it('ships only the accepted attack keys with their times and transparent edges', async () => {
 const root=resolve('public/character-runtime');
 const manifest=JSON.parse(readFileSync(resolve(root,'manifest.json'),'utf8'));
 const accepted=JSON.parse(readFileSync(resolve('docs/specs/character-animation-samples/painted-attack-keys.json'),'utf8'));
 const attacks=manifest.banks.filter((bank:any)=>bank.kind==='attack');
 expect(attacks).toHaveLength(256);
 expect(accepted).toHaveLength(255);
 for(const bank of attacks){
  expect(bank.frames.at(-1).sourceSha256,bank.id).toBe(bank.frames[0].sourceSha256);
  if(bank.character==='paladin'&&bank.army==='black'&&bank.id==='black-attack-N')continue;
  expect(accepted.some((r:any)=>r.character===bank.character&&r.army===bank.army&&r.direction===bank.facing),bank.id).toBe(true);
 }
 for(const record of accepted){
  const bank=attacks.find((b:any)=>b.character===record.character&&b.army===record.army&&b.facing===record.direction);
  expect(bank,`${record.character}/${record.army}/${record.direction}`).toBeDefined();
  expect(bank.nearest).toBe(true);
  expect(bank.contactMs).toBe(record.contactMs);
  if(['maester','queen','archer'].includes(record.character))expect(bank.beatTimes.release).toBe(record.contactMs);
  expect(bank.frames.map((f:any)=>({sha256:f.sourceSha256,timeMs:f.timeMs}))).toEqual(record.frames);
 }
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
}, 120_000);
