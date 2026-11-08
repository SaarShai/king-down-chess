import { stripPng } from './character-runtime-effects.mjs';
import { registerBanks } from './build-character-runtime.mjs';
import { afterEach, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
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

it('converts a retained package to quality-90 WebP with exact alpha and keeps the frame source', async () => {
 scratch=mkdtempSync(join(tmpdir(),'kingdown-webp-package-'));const source=join(scratch,'source'),out=join(scratch,'out');mkdirSync(join(source,'assets'),{recursive:true});mkdirSync(join(source,'effects'));
 const pixels=Buffer.alloc(8*8*4);for(let i=0;i<pixels.length;i+=4){pixels[i]=120;pixels[i+1]=30;pixels[i+2]=40;pixels[i+3]=(i/4)%8>=2&&(i/4)%8<6&&Math.floor(i/32)>=2&&Math.floor(i/32)<6?255:0;}
 const image=await sharp(pixels,{raw:{width:8,height:8,channels:4}}).png().toBuffer();
 const hash=(b:Buffer)=>createHash('sha256').update(b).digest('hex'),sha=hash(image),url=`assets/${sha}.png`,sourceSha256='a'.repeat(64);
 writeFileSync(join(source,url),image);writeFileSync(join(source,'assets.json'),JSON.stringify([{url,sha256:sha,sourceSha256,size:[8,8],top:2}]));
 writeFileSync(join(source,'manifest.json'),JSON.stringify({schemaVersion:1,banks:[{frames:[{url,sourceSha256,timeMs:0}]}]}));
 const run=(dest:string)=>execFileSync(process.execPath,[resolve('tools/convert-character-runtime-webp.mjs'),source,dest],{encoding:'utf8',stdio:'pipe'});
 expect(JSON.parse(run(out))).toEqual({banks:1,assets:1});const manifest=JSON.parse(readFileSync(join(out,'manifest.json'),'utf8')),asset=JSON.parse(readFileSync(join(out,'assets.json'),'utf8'))[0],bytes=readFileSync(join(out,asset.url));
 expect(asset.url).toBe(`assets/${hash(bytes)}.webp`);expect(asset.encoding).toBe('webp-q90-alpha-lossless');expect(manifest.banks[0].frames[0]).toEqual({url:asset.url,sourceSha256,timeMs:0});expect((await sharp(bytes).metadata()).format).toBe('webp');
 const sourceRGB=await sharp(image).ensureAlpha().raw().toBuffer(),derivedRGB=await sharp(bytes).ensureAlpha().raw().toBuffer();expect(derivedRGB.length).toBe(sourceRGB.length);
 let worst=0;for(let i=0;i<sourceRGB.length;i+=4){expect(derivedRGB[i+3]).toBe(sourceRGB[i+3]);if(!sourceRGB[i+3])continue;const weight=sourceRGB[i+3]/255;for(let c=0;c<3;c++)worst=Math.max(worst,Math.abs(sourceRGB[i+c]-derivedRGB[i+c])*weight);}
 expect(worst).toBeLessThanOrEqual(20);
 expect(()=>run(out)).toThrow();writeFileSync(join(source,url),'changed');expect(()=>run(join(scratch,'bad'))).toThrow(/PNG hash mismatch/);
},30_000);

it('reuses converted frames from a WebP package when the source hash matches', async () => {
 scratch=mkdtempSync(join(tmpdir(),'kingdown-webp-cache-'));const source=join(scratch,'source'),out=join(scratch,'out'),reused=join(scratch,'reused');mkdirSync(join(source,'assets'),{recursive:true});mkdirSync(join(source,'effects'));
 const pixels=Buffer.alloc(8*8*4);for(let i=0;i<pixels.length;i+=4){pixels[i]=120;pixels[i+1]=30;pixels[i+2]=40;pixels[i+3]=(i/4)%8>=2&&(i/4)%8<6&&Math.floor(i/32)>=2&&Math.floor(i/32)<6?255:0;}
 const image=await sharp(pixels,{raw:{width:8,height:8,channels:4}}).png().toBuffer();
 const hash=(b:Buffer)=>createHash('sha256').update(b).digest('hex'),sha=hash(image),url=`assets/${sha}.png`,sourceSha256='a'.repeat(64);
 writeFileSync(join(source,url),image);writeFileSync(join(source,'assets.json'),JSON.stringify([{url,sha256:sha,sourceSha256,size:[8,8],top:2}]));
 writeFileSync(join(source,'manifest.json'),JSON.stringify({schemaVersion:1,banks:[{frames:[{url,sourceSha256,timeMs:0}]}]}));
 const convert=(args:string[])=>execFileSync(process.execPath,[resolve('tools/convert-character-runtime-webp.mjs'),...args],{encoding:'utf8',stdio:'pipe'});
 convert([source,out]);
 expect(JSON.parse(convert([source,reused,'--cache',out]))).toEqual({banks:1,assets:1,reused:1,converted:0});
 for(const name of ['manifest.json','assets.json'])expect(readFileSync(join(reused,name)).equals(readFileSync(join(out,name)))).toBe(true);
 const cached=JSON.parse(readFileSync(join(out,'assets.json'),'utf8'))[0];
 expect(readFileSync(join(reused,cached.url)).equals(readFileSync(join(out,cached.url)))).toBe(true);
 const cachedBytes=readFileSync(join(out,cached.url));writeFileSync(join(out,cached.url),'changed');
 expect(()=>convert([source,join(scratch,'bad'),'--cache',out])).toThrow(/Cached WebP hash mismatch/);writeFileSync(join(out,cached.url),cachedBytes);
 writeFileSync(join(source,'assets.json'),JSON.stringify([{url,sha256:sha,sourceSha256,size:[9,9],top:2}]));
 expect(()=>convert([source,join(scratch,'bad2'),'--cache',out])).toThrow(/PNG geometry or alpha mismatch/);
},30_000);

it('clears only alpha-1 attack pixels on the derived border', async () => {
 scratch=mkdtempSync(join(tmpdir(),'kingdown-attack-border-'));const source=join(scratch,'source'),out=join(scratch,'out');mkdirSync(join(source,'assets'),{recursive:true});mkdirSync(join(source,'effects'));
 const pixels=Buffer.alloc(8*8*4);pixels[(2*8)*4+3]=1;pixels[(3*8+3)*4+3]=1;pixels[(4*8+4)*4+3]=255;
 const image=await sharp(pixels,{raw:{width:8,height:8,channels:4}}).png().toBuffer(),sha=createHash('sha256').update(image).digest('hex'),url=`assets/${sha}.png`;
 writeFileSync(join(source,url),image);writeFileSync(join(source,'assets.json'),JSON.stringify([{url,sha256:sha,sourceSha256:'a'.repeat(64),size:[8,8],top:2}]));
 writeFileSync(join(source,'manifest.json'),JSON.stringify({banks:[{kind:'attack',frames:[{url,sourceSha256:'a'.repeat(64),timeMs:0}]}]}));
 execFileSync(process.execPath,[resolve('tools/convert-character-runtime-webp.mjs'),source,out],{stdio:'pipe'});
 const converted=JSON.parse(readFileSync(join(out,'assets.json'),'utf8'))[0],alpha=await sharp(join(out,converted.url)).ensureAlpha().extractChannel('alpha').raw().toBuffer();
 for(let i=0;i<alpha.length;i++)expect(alpha[i]).toBe(i===16?0:pixels[i*4+3]);
});

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

it('uses each movement bank facing-rest height even without an idle', () => {
 const frame = { sourceSha256: 'rest' };
 const idle: any = { character: 'knight', army: 'white', kind: 'idle', facing: 'SE', canvasSize: [100, 100], pivot: [50, 90], bodyHeightPx: 80, sourceSha256: 'idle', frames: [frame] };
 const movement: any = { character: 'knight', army: 'white', kind: 'movement', pivot: [50, 90], bodyHeightPx: 70, sourceSha256: 'move', frames: [frame, frame] };
 const noIdle = { ...movement, character: 'rook', sourceSha256: 'rook' };
 registerBanks([idle, movement, noIdle]);
 expect(idle.registrationHeightPx).toBe(80);
 expect(movement.registrationHeightPx).toBe(70);
 expect(noIdle.registrationHeightPx).toBe(70);
});

it('registers shared endpoints at the same effective pivot when one frame is padded', () => {
 const idle:any={character:'king-frost',army:'white',kind:'idle',facing:'SE',canvasSize:[384,384],pivot:[192,350],bodyHeightPx:300,sourceSha256:'idle',frames:[{sourceSha256:'rest'}]};
 const attack:any={character:'king-frost',army:'white',kind:'attack',canvasSize:[640,640],pivot:[320,478],bodyHeightPx:300,sourceSha256:'attack',frames:[{sourceSha256:'rest'},{sourceSha256:'rest'}]};
 expect(()=>registerBanks([idle,attack],new Map([['rest',{size:[384,384]}]]))).not.toThrow();
 expect(attack.registrationHeightPx).toBe(idle.registrationHeightPx);
});
it('builds painted moves with their own timing and rejects a gap', async () => {
 scratch=mkdtempSync(join(tmpdir(),'kingdown-painted-move-'));const source=join(scratch,'source'),out=join(scratch,'out');mkdirSync(join(source,'banks'),{recursive:true});mkdirSync(join(source,'assets'));
 const hash=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
 const frames:{url:string;sha256:string;timeMs:number;durationMs:number;pivot:number[]}[]=[];let timeMs=0;
 for(const [i,durationMs] of [120,160,240,160].entries()){
  const image=await sharp({create:{width:32,height:32,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:await sharp({create:{width:8,height:8,channels:4,background:{r:20+i*30,g:20,b:30,alpha:1}}}).png().toBuffer(),left:12,top:12}]).png().toBuffer();
  const sha256=hash(image);writeFileSync(join(source,'assets',`${sha256}.png`),image);frames.push({url:`../assets/${sha256}.png`,sha256,timeMs,durationMs,pivot:[16,28]});timeMs+=durationMs;
 }
 const original=Buffer.from(JSON.stringify({frames:frames.map(f=>({...f,uniformScale:1,translation:[0,0]}))})),originalHash=hash(original);writeFileSync(join(source,'banks',`${originalHash}.json`),original);
 const selection=join(scratch,'selection.json');
 const select=(bankFrames:typeof frames,pivot=[16,28],includeSource=true,sourceDirection='N',sampling='nearest',sourceHash=originalHash,playOrder?:number[])=>{
  const bytes=Buffer.from(JSON.stringify({status:'ready',character:'pawn',army:'white',direction:'N',facing:'N',canvasSize:[32,32],pivot,bodyHeightPx:20,strideSquares:.8,sampling,durationMs:timeMs,frames:bankFrames,...(playOrder?{playOrder}:{}),walkSourceBankSha256:sourceHash,walkRestTransform:{canonicalPivot:[16,28],scaleGamePxPerSourcePx:4.8,offsetGamePx:[-76.8,-134.4]},walkRanges:{topRangeAt160:0,groundRangeAt160:0}})),sha256=hash(bytes);
  writeFileSync(join(source,'banks',`${sha256}.json`),bytes);const entry={character:'pawn',army:'white',kind:'move',direction:'N',id:'white-walk-N',status:'ready',manifest:`banks/${sha256}.json`,sha256};
  const originalEntry={character:'pawn',army:'white',kind:'movement-study',direction:sourceDirection,id:'source',manifest:`banks/${sourceHash}.json`,sha256:sourceHash};
  const manifest=Buffer.from(JSON.stringify({entries:includeSource?[originalEntry,entry]:[entry]}));writeFileSync(join(source,'manifest.json'),manifest);writeFileSync(selection,JSON.stringify({schemaVersion:1,status:'ready',catalogSha256:hash(manifest),entries:[entry]}));
 };
 const run=()=>execFileSync(process.execPath,[resolve('tools/build-character-runtime.mjs'),'--source',source,'--output',out,'--selection',selection],{encoding:'utf8',stdio:'pipe',timeout:10_000});
 select(frames);expect(JSON.parse(run())).toEqual({banks:1,assets:4});const bank=JSON.parse(readFileSync(join(out,'manifest.json'),'utf8')).banks[0];
 expect(bank).toMatchObject({kind:'move',facing:'N',pivot:[8,14],registrationHeightPx:10,strideSquares:.8,durationMs:680,nearest:true});expect(bank.frames.map((f:{timeMs:number})=>f.timeMs)).toEqual([0,120,280,520]);
 select(frames,[16,28],true,'N','nearest',originalHash,[3,0,2,1]);expect(JSON.parse(run())).toEqual({banks:1,assets:4});const ordered=JSON.parse(readFileSync(join(out,'manifest.json'),'utf8')).banks[0];
 expect(ordered.frames.map((f:{sourceSha256:string})=>f.sourceSha256)).toEqual([frames[3].sha256,frames[0].sha256,frames[2].sha256,frames[1].sha256]);
 expect(ordered.frames.map((f:{timeMs:number})=>f.timeMs)).toEqual([0,160,280,520]);
 select(frames,[16,28],true,'N','nearest',originalHash,[0,0,1,2]);expect(run).toThrow(/Invalid painted move order/);
 select(frames,[16,28],false);expect(run).toThrow(/Painted move source is not in the catalog/);
 select(frames,[16,28],true,'S');expect(run).toThrow(/Painted move source is not in the catalog for this facing/);
 select(frames,[17,28]);expect(run).toThrow(/Painted move gates failed:.*placement/);
 select(frames.map((f,i)=>i===2?{...f,timeMs:f.timeMs+1}:f));expect(run).toThrow(/Invalid painted move timing/);
 select(frames,[16,28],true,'N','linear');expect(run).toThrow(/Invalid painted move/);
 const shifted=await sharp({create:{width:32,height:32,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:await sharp({create:{width:8,height:8,channels:4,background:{r:20,g:20,b:30,alpha:1}}}).png().toBuffer(),left:12,top:10}]).png().toBuffer(),shiftedHash=hash(shifted);
 writeFileSync(join(source,'assets',`${shiftedHash}.png`),shifted);
 const shiftedFrames=frames.map((f,i)=>i===0?{...f,url:`../assets/${shiftedHash}.png`,sha256:shiftedHash}:f);
 const shiftedOriginal=Buffer.from(JSON.stringify({frames:shiftedFrames.map(f=>({...f,uniformScale:1,translation:[0,0]}))})),shiftedOriginalHash=hash(shiftedOriginal);
 writeFileSync(join(source,'banks',`${shiftedOriginalHash}.json`),shiftedOriginal);
 select(shiftedFrames,[16,28],true,'N','nearest',shiftedOriginalHash);expect(run).toThrow(/Painted move gates failed:.*range/);
},30_000);

it('strips non-rendering PNG chunks without changing the pixels', async () => {
 const png=await sharp({create:{width:4,height:4,channels:4,background:{r:20,g:30,b:40,alpha:0.5}}}).png().toBuffer();
 const metadata=Buffer.concat(['caBX','gAMA','sRGB','PLTE','tRNS'].map(name=>Buffer.concat([Buffer.from('00000004','hex'),Buffer.from(name),Buffer.from('test'),Buffer.alloc(4)])));
 const withMetadata=Buffer.concat([png.subarray(0,33),metadata,png.subarray(33)]);
 const stripped=stripPng(withMetadata);
 expect(stripped.equals(stripPng(png))).toBe(true);
 expect((await sharp(stripped).ensureAlpha().raw().toBuffer()).equals(await sharp(png).ensureAlpha().raw().toBuffer())).toBe(true);
});

it('rejects an indexed PNG that needs its palette', async () => {
 const indexed=await sharp({create:{width:4,height:4,channels:4,background:{r:20,g:30,b:40,alpha:0.5}}}).png({palette:true}).toBuffer();
 expect(()=>stripPng(indexed)).toThrow('needs conversion to RGBA');
});

it.each([0,2,3])('rejects a PNG colour key for colour type %i', async colour => {
 const png=await sharp({create:{width:4,height:4,channels:4,background:{r:20,g:30,b:40,alpha:1}}}).png().toBuffer();
 png[25]=colour;
 const key=Buffer.concat([Buffer.from('00000004','hex'),Buffer.from('tRNS'),Buffer.alloc(8)]);
 expect(()=>stripPng(Buffer.concat([png.subarray(0,33),key,png.subarray(33)]))).toThrow('needs conversion to RGBA');
});

it('records the source, PNG and WebP hashes of every effect image', () => {
 const root=resolve('public/character-runtime'),manifest=JSON.parse(readFileSync(join(root,'manifest.json'),'utf8'));
 const selection=JSON.parse(readFileSync(resolve('docs/specs/character-animation-samples/runtime-effects.json'),'utf8'));
 for(const entry of selection.entries){
  const dir=resolve(root,manifest.effects[entry.character].module,'..');
  const records=JSON.parse(readFileSync(join(dir,'provenance/runtime-assets.json'),'utf8'));
  const expected=entry.files.filter((file:any)=>file.outputSha256).map((file:any)=>({path:file.path.replace(/\.png$/,'.webp'),sourceSha256:file.sha256,pngSha256:file.outputSha256,sha256:expect.any(String),encoding:'webp-q90-alpha-lossless'}));
  expect(records).toEqual(expected);
  for(const record of records)expect(createHash('sha256').update(readFileSync(join(dir,record.path))).digest('hex')).toBe(record.sha256);
 }
});

// A capture loads its effect art at play time: on a 1.6 Mbps link (200 KB/s) a large file makes the shot start late.
it('keeps each play-time effect texture a WebP of at most 256 KB', () => {
 const root=resolve('public/character-runtime'),manifest=JSON.parse(readFileSync(join(root,'manifest.json'),'utf8'));
 for(const effect of Object.values(manifest.effects) as {module:string}[]){
  const dir=resolve(root,effect.module,'..'),assets=readdirSync(join(dir,'assets'));
  expect(assets.length).toBeGreaterThan(0);
  for(const name of assets){expect(name).toMatch(/\.webp$/);expect(statSync(join(dir,'assets',name)).size).toBeLessThanOrEqual(256*1024);}
 }
 expect(statSync(resolve('docs/2d-first-pieces/king-stratus/cloud-bank.webp')).size).toBeLessThanOrEqual(320*1024);
});

// Two sheets of many frames that the game loads in play: the Shadow hand film (130 frames) and the Rook slam clip (52 drawings).
// Each is stored at the board's largest display size (film-poses-144.webp: pack-runtime.mjs; slam.webp: clips/build.mjs).
it('keeps the Shadow hand film and the Rook slam atlas small', () => {
 expect(statSync(resolve('docs/2d-first-pieces/king-shadow/hands/film-poses-144.webp')).size).toBeLessThanOrEqual(352*1024);
 expect(statSync(resolve('docs/2d-first-pieces/rook/slam.webp')).size).toBeLessThanOrEqual(512*1024);
});

it('converts each effect texture to WebP with exact alpha and points its module at it', async () => {
 scratch=mkdtempSync(join(tmpdir(),'kingdown-webp-effect-'));const source=join(scratch,'source'),out=join(scratch,'out'),id='e'.repeat(64),dir=join(source,'effects',id);
 mkdirSync(join(source,'assets'),{recursive:true});mkdirSync(join(dir,'assets'),{recursive:true});
 const pixels=Buffer.alloc(8*8*4);for(let i=0;i<pixels.length;i+=4){pixels[i]=200;pixels[i+1]=150;pixels[i+2]=20;pixels[i+3]=(i/4)%8*30;}
 const png=await sharp(pixels,{raw:{width:8,height:8,channels:4}}).png().toBuffer(),hash=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
 const module=Buffer.from("export const loadEffect=()=>['golden-arrow'].map(name=>`assets/${name}.png`);");
 const meta=Buffer.from(JSON.stringify({sprite:`assets/${hash(png)}.png`,sha256:hash(png)}));
 writeFileSync(join(dir,'assets/golden-arrow.png'),png);writeFileSync(join(dir,`assets/${hash(png)}.png`),png);writeFileSync(join(dir,'effect.js'),module);writeFileSync(join(dir,'effect.json'),meta);
 writeFileSync(join(dir,'sources.json'),JSON.stringify([{path:'assets/golden-arrow.png',sha256:hash(png),sourceSha256:'a'.repeat(64)},{path:`assets/${hash(png)}.png`,sha256:hash(png),sourceSha256:'b'.repeat(64)},{path:'effect.js',sha256:hash(module),sourceSha256:hash(module)},{path:'effect.json',sha256:hash(meta),sourceSha256:hash(meta)}]));
 writeFileSync(join(source,'assets.json'),'[]');writeFileSync(join(source,'manifest.json'),JSON.stringify({schemaVersion:1,effects:{archer:{module:`effects/${id}/effect.js`,smoke:null,decodedBytes:256,contactMs:1}},banks:[]}));
 execFileSync(process.execPath,[resolve('tools/convert-character-runtime-webp.mjs'),source,out],{stdio:'pipe'});
 const effect=JSON.parse(readFileSync(join(out,'manifest.json'),'utf8')).effects.archer,folder=resolve(out,effect.module,'..');
 expect(effect).toMatchObject({smoke:null,decodedBytes:256,contactMs:1});expect(effect.module).not.toContain(id);
 expect(readFileSync(join(folder,'effect.js'),'utf8')).toContain('assets/${name}.webp');
 const webp=readFileSync(join(folder,'assets/golden-arrow.webp')),json=JSON.parse(readFileSync(join(folder,'effect.json'),'utf8'));
 // The beam's sprite keeps its PNG-hash name with the WebP extension; the hash field names the WebP bytes.
 expect(json).toEqual({sprite:`assets/${hash(png)}.webp`,sha256:hash(webp)});expect(readFileSync(join(folder,json.sprite)).equals(webp)).toBe(true);expect((await sharp(webp).metadata()).format).toBe('webp');
 const alpha=await sharp(webp).ensureAlpha().extractChannel('alpha').raw().toBuffer();for(let i=0;i<alpha.length;i++)expect(alpha[i]).toBe(pixels[i*4+3]);
 writeFileSync(join(dir,'assets/golden-arrow.png'),'changed');expect(()=>execFileSync(process.execPath,[resolve('tools/convert-character-runtime-webp.mjs'),source,join(scratch,'bad')],{stdio:'pipe'})).toThrow(/Effect file hash mismatch/);
});
