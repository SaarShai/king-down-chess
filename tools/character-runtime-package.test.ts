import { afterEach, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
let scratch='';
afterEach(()=>{if(scratch)rmSync(scratch,{recursive:true,force:true});});
it('derives only pinned ready frames with uniform geometry and rejects a changed hash',async()=>{
 scratch=mkdtempSync(join(tmpdir(),'kingdown-character-package-'));const source=join(scratch,'source'),out=join(scratch,'out');mkdirSync(join(source,'banks'),{recursive:true});mkdirSync(join(source,'assets'));
 const image=await sharp({create:{width:8,height:8,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:await sharp({create:{width:4,height:4,channels:4,background:{r:10,g:20,b:30,alpha:1}}}).png().toBuffer(),left:0,top:0}]).png().toBuffer();
 const hash=(b:Buffer)=>createHash('sha256').update(b).digest('hex'),imageHash=hash(image);writeFileSync(join(source,'assets',`${imageHash}.png`),image);
 const large=await sharp(image).resize(16,16,{kernel:'nearest'}).png().toBuffer(),largeHash=hash(large);writeFileSync(join(source,'assets',`${largeHash}.png`),large);
 const makeBank=(id:string,kind:string,size:number,sha:string,height:number,declareCanvas=true)=>{
  const bytes=Buffer.from(JSON.stringify({status:'ready',kind,from:'SE',to:'S',facing:'SE',...(declareCanvas?{canvasSize:[size,size],footPivot:[size/2,size*7/8]}:{}),bodyHeightPx:height,durationMs:100,frames:[{url:`../assets/${sha}.png`,sha256:sha,timeMs:0}]})),bankHash=hash(bytes);writeFileSync(join(source,'banks',`${bankHash}.json`),bytes);
  return {character:'pawn',army:'white',kind,id,status:'ready',manifest:`banks/${bankHash}.json`,sha256:bankHash};
 };
 const entry=makeBank('white-idle','idle',8,imageHash,8),turn=makeBank('white-turn-SE-S','turn',8,imageHash,7,false),attack=makeBank('white-attack-E','attack',16,largeHash,16),entries=[entry,turn,attack];
 writeFileSync(join(source,'manifest.json'),JSON.stringify({entries:[...entries,{...entry,id:'pending-idle',status:'needs-repair'}]}));
 const selection=join(scratch,'selection.json');writeFileSync(selection,JSON.stringify({schemaVersion:1,status:'ready',catalogSha256:hash(readFileSync(join(source,'manifest.json'))),entries}));
 const run=()=>execFileSync(process.execPath,[resolve('tools/build-character-runtime.mjs'),'--source',source,'--output',out,'--selection',selection],{encoding:'utf8',stdio:'pipe',timeout:10_000});
 expect(JSON.parse(run())).toEqual({banks:3,assets:2});const manifest=JSON.parse(readFileSync(join(out,'manifest.json'),'utf8'));expect(manifest.banks).toHaveLength(3);expect(manifest.banks.map((b:{registrationHeightPx:number})=>b.registrationHeightPx)).toEqual([4,4,8]);expect(manifest.banks[0].pivot).toEqual(manifest.banks[1].pivot);expect(manifest.banks[2].pivot).toEqual(manifest.banks[0].pivot.map((n:number)=>n*2));const derived=readFileSync(join(out,manifest.banks[0].frames[0].url));expect((await sharp(derived).metadata()).width).toBe(4);expect(manifest.banks[0].canvasSize).toEqual([4,4]);expect(manifest.banks[1].canvasSize).toEqual([4,4]);expect(manifest.banks[0].frames[0].sourceSha256).toBe(imageHash);expect(readFileSync(join(source,'assets',`${imageHash}.png`)).equals(image)).toBe(true);expect(JSON.stringify(manifest)).not.toContain(source);
 expect(JSON.parse(run())).toEqual({banks:3,assets:2});const derivedPath=join(out,manifest.banks[0].frames[0].url);writeFileSync(derivedPath,'changed');expect(run).toThrow(/Cached runtime frame hash mismatch/);writeFileSync(derivedPath,derived);
 writeFileSync(join(source,'assets',`${imageHash}.png`),'changed');expect(run).toThrow(/Frame hash mismatch/);writeFileSync(join(source,'assets',`${imageHash}.png`),image);
 const mismatch=makeBank('white-turn-S-SW','turn',16,imageHash,16);writeFileSync(join(source,'manifest.json'),JSON.stringify({entries:[mismatch]}));writeFileSync(selection,JSON.stringify({schemaVersion:1,status:'ready',catalogSha256:hash(readFileSync(join(source,'manifest.json'))),entries:[mismatch]}));expect(run).toThrow(/Frame canvas mismatch/);
}, 30_000);

it.each(['registration','joins','duplicate','validation'] as const)('checks movement %s', async check => {
 scratch=mkdtempSync(join(tmpdir(),'kingdown-movement-package-'));const source=join(scratch,'source'),out=join(scratch,'out');mkdirSync(join(source,'banks'),{recursive:true});mkdirSync(join(source,'assets'));
 const image=await sharp({create:{width:32,height:32,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:await sharp({create:{width:8,height:8,channels:4,background:{r:10,g:20,b:30,alpha:1}}}).png().toBuffer(),left:12,top:12}]).png().toBuffer();
 const hash=(b:Buffer)=>createHash('sha256').update(b).digest('hex'),imageHash=hash(image);writeFileSync(join(source,'assets',`${imageHash}.png`),image);
 const selection=join(scratch,'selection.json');
 const idleImage=await sharp(image).modulate({brightness:0.5}).png().toBuffer(),idleHash=hash(idleImage);writeFileSync(join(source,'assets',`${idleHash}.png`),idleImage);
 const idleBytes=Buffer.from(JSON.stringify({status:'ready',canvasSize:[32,32],footPivot:[16,28],bodyHeightPx:20,durationMs:100,frames:[{url:`../assets/${idleHash}.png`,sha256:idleHash,timeMs:0}]})),idleBankHash=hash(idleBytes);writeFileSync(join(source,'banks',`${idleBankHash}.json`),idleBytes);
 const idle={character:'pawn',army:'white',kind:'idle',id:'white-idle-SE',status:'ready',manifest:`banks/${idleBankHash}.json`,sha256:idleBankHash};
 const select=(facing:string,frames:unknown[],sections:object={},duplicate=false)=>{
  const bytes=Buffer.from(JSON.stringify({status:'draft',army:'white',direction:facing,canvasSize:[32,32],durationMs:100,frames,...sections})),bankHash=hash(bytes);writeFileSync(join(source,'banks',`${bankHash}.json`),bytes);
  const entry={character:'pawn',army:'white',kind:'movement-study',direction:facing,id:'white-move-E',status:'draft',manifest:`banks/${bankHash}.json`,sha256:bankHash};
  const entries=[idle,entry,...(duplicate?[{...entry,id:'white-move-E-2'}]:[])];
  writeFileSync(join(source,'manifest.json'),JSON.stringify({entries}));writeFileSync(selection,JSON.stringify({schemaVersion:1,status:'ready',catalogSha256:hash(readFileSync(join(source,'manifest.json'))),entries}));
 };
 const run=()=>execFileSync(process.execPath,[resolve('tools/build-character-runtime.mjs'),'--source',source,'--output',out,'--selection',selection],{encoding:'utf8',stdio:'pipe',timeout:10_000});
 const frames=[0,100].map(timeMs=>({url:`../assets/${imageHash}.png`,sha256:imageHash,timeMs,pivot:[16,28]}));
 if(check==='registration'){
  select('E',frames);expect(JSON.parse(run())).toEqual({banks:2,assets:2});
  const [rest,bank]=JSON.parse(readFileSync(join(out,'manifest.json'),'utf8')).banks;expect(bank).toMatchObject({character:'pawn',army:'white',kind:'movement',facing:'E',durationMs:100,pivot:[8,14],registrationHeightPx:10,registrationSourceSha256:rest.sourceSha256,frames:[{timeMs:0},{timeMs:100}]});return;
 }
 if(check==='joins'){
  const outer={url:`../assets/${idleHash}.png`,sha256:idleHash,timeMs:0,durationMs:20,pivot:[16,28]};
  select('E',frames,{entryFrames:[outer],settleFrames:[outer]});run();
  const joined=JSON.parse(readFileSync(join(out,'manifest.json'),'utf8')).banks[1];expect(joined.durationMs).toBe(140);expect(joined.frames.map((f:{timeMs:number;sourceSha256:string})=>[f.timeMs,f.sourceSha256])).toEqual([[0,idleHash],[20,imageHash],[120,imageHash],[120,idleHash]]);return;
 }
 if(check==='duplicate'){select('E',frames,{},true);expect(run).toThrow(/Duplicate movement facing/);return;}
 select('bad',frames);expect(run).toThrow(/Invalid movement facing/);
 select('E',[]);expect(run).toThrow(/Invalid ready bank/);
 select('E',[frames[0],{...frames[1],url:'../assets/missing.png'}]);expect(run).toThrow(/ENOENT/);
 const opaque=await sharp({create:{width:32,height:32,channels:4,background:{r:10,g:20,b:30,alpha:1}}}).png().toBuffer(),opaqueHash=hash(opaque);writeFileSync(join(source,'assets',`${opaqueHash}.png`),opaque);
 select('E',frames.map(frame=>({...frame,url:`../assets/${opaqueHash}.png`,sha256:opaqueHash})));expect(run).toThrow(/transparent exterior/);
 select('E',[frames[0],{...frames[1],pivot:[17,28]}]);expect(run).toThrow(/Invalid movement pivot/);
}, 30_000);
