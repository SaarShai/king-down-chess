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

it('converts a retained package with checked hashes and keeps the frame source', async () => {
 scratch=mkdtempSync(join(tmpdir(),'kingdown-webp-package-'));const source=join(scratch,'source'),out=join(scratch,'out');mkdirSync(join(source,'assets'),{recursive:true});mkdirSync(join(source,'effects'));
 const pixels=Buffer.alloc(8*8*4);for(let i=0;i<pixels.length;i+=4){pixels[i]=120;pixels[i+1]=30;pixels[i+2]=40;pixels[i+3]=(i/4)%8>=2&&(i/4)%8<6&&Math.floor(i/32)>=2&&Math.floor(i/32)<6?255:0;}
 const image=await sharp(pixels,{raw:{width:8,height:8,channels:4}}).png().toBuffer();
 const hash=(b:Buffer)=>createHash('sha256').update(b).digest('hex'),sha=hash(image),url=`assets/${sha}.png`,sourceSha256='a'.repeat(64);
 writeFileSync(join(source,url),image);writeFileSync(join(source,'assets.json'),JSON.stringify([{url,sha256:sha,sourceSha256,size:[8,8],top:2}]));
 writeFileSync(join(source,'manifest.json'),JSON.stringify({schemaVersion:1,banks:[{frames:[{url,sourceSha256,timeMs:0}]}]}));
 const run=(dest:string)=>execFileSync(process.execPath,[resolve('tools/convert-character-runtime-webp.mjs'),source,dest],{encoding:'utf8',stdio:'pipe'});
 expect(JSON.parse(run(out))).toEqual({banks:1,assets:1});const manifest=JSON.parse(readFileSync(join(out,'manifest.json'),'utf8')),asset=JSON.parse(readFileSync(join(out,'assets.json'),'utf8'))[0],bytes=readFileSync(join(out,asset.url));
 expect(asset.url).toBe(`assets/${hash(bytes)}.webp`);expect(manifest.banks[0].frames[0]).toEqual({url:asset.url,sourceSha256,timeMs:0});expect((await sharp(bytes).metadata()).hasAlpha).toBe(true);expect((await sharp(bytes).ensureAlpha().raw().toBuffer()).equals(await sharp(image).ensureAlpha().raw().toBuffer())).toBe(true);
 expect(()=>run(out)).toThrow();writeFileSync(join(source,url),'changed');expect(()=>run(join(scratch,'bad'))).toThrow(/PNG hash mismatch/);
},30_000);
