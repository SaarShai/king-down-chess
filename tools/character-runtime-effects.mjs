import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname,relative,basename} from 'node:path';
import sharp from 'sharp';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
export const stripPng=bytes=>{
 if(!bytes.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')))throw Error('Invalid effect PNG');
 const chunks=[bytes.subarray(0,8)];let i=8;
 while(i<bytes.length){if(i+12>bytes.length)throw Error('Invalid effect PNG chunk');const n=bytes.readUInt32BE(i),end=i+n+12,name=bytes.toString('ascii',i+4,i+8);if(end>bytes.length)throw Error('Invalid effect PNG chunk');if(name==='PLTE'&&bytes[25]===3||name==='tRNS'&&[0,2,3].includes(bytes[25]))throw Error('Effect PNG needs conversion to RGBA');if(['IHDR','IDAT','IEND'].includes(name))chunks.push(bytes.subarray(i,end));i=end;}
 return Buffer.concat(chunks);
};
const safe=(root,path)=>{const rel=relative(root,path);if(rel.startsWith('..')||rel.startsWith('/'))throw Error('Effect path leaves its package');return path;};
/** Exact published separate effects and their review receipts. Only the smoke texture URL needs bundling. */
export async function buildRuntimeEffects(source,output,banks,selectionPath){
 const selection=JSON.parse(await readFile(selectionPath,'utf8'));
 const chosen=selection.entries.filter(e=>banks.some(b=>b.character===e.character&&b.kind==='attack'));
 if(!chosen.length)return {effects:{},cues:[]};
 const receipts=[];
 for(const record of selection.receipts){
  const bytes=await readFile(safe(resolve(source,'..'),resolve(source,record.source)));
  if(hash(bytes)!==record.sha256)throw Error('Effect review receipt changed');
  receipts.push({record,bytes,json:JSON.parse(bytes)});
 }
 const ready=receipts.find(r=>r.record.source.endsWith('ready-effects.fragment.json')).json;
 const audit=receipts.find(r=>r.record.source.endsWith('effects-alpha-audit.json')).json;
 const approvedHashes=new Set(Object.values(receipts.find(r=>r.record.source.endsWith('source-hashes.original.json')).json));
 const cues=receipts.find(r=>r.record.source.endsWith('catalog.fragment.json')).json.actions;
 const effects={};
 for(const entry of chosen){
  if(entry.status!=='ready'||!ready.effects.some(e=>e.moduleUrl.includes(entry.character==='archer'?'arrow-flight':`${entry.character}-`)))throw Error('Effect is not published ready');
  const files=[];let decodedBytes=0,smokeDecodedBytes=0;
  const outputHashes=entry.files.filter(f=>f.outputSha256).map(f=>[f.sha256,f.outputSha256]);
  // A module publishes as .js (a JavaScript type on every iOS); the metadata names it by its published name.
  const renamedModules=entry.files.filter(f=>f.path.endsWith('.js')).map(f=>({source:basename(f.source),path:f.path})).filter(f=>f.source!==f.path);
  for(const record of entry.files){
   const original=await readFile(safe(resolve(source,'..'),resolve(source,record.source)));
   if(!approvedHashes.has(record.sha256))throw Error(`Effect source has no publication hash: ${record.source}`);
   if(hash(original)!==record.sha256)throw Error(`Effect source hash mismatch: ${record.source}`);
   let bytes=original;
   if(record.path.endsWith('.png')){
    bytes=stripPng(bytes);if(hash(bytes)!==record.outputSha256)throw Error(`Effect output hash mismatch: ${record.path}`);
    if(!audit.textures.some(t=>t.sha256===record.sha256&&t.pass===true))throw Error('Effect has no passing alpha receipt');
    const {data,info}=await sharp(bytes).ensureAlpha().extractChannel('alpha').raw().toBuffer({resolveWithObject:true});
    if(!data.includes(0)||!data.some(a=>a>0))throw Error('Effect alpha failed');decodedBytes+=info.width*info.height*4;if(record.path==='assets/golden-wisp.png')smokeDecodedBytes=info.width*info.height*4;
   }
   if(record.path==='effect.json'){let text=bytes.toString('utf8');for(const [oldHash,newHash] of outputHashes)text=text.replaceAll(oldHash,newHash);for(const {source,path} of renamedModules)text=text.replaceAll(source,path);bytes=Buffer.from(text);}
   if(record.rewriteSmokeTextureURL){
    const text=bytes.toString('utf8'),old="'effects/golden-wisp.png'";
    if(text.split(old).length!==2)throw Error('Smoke texture URL contract changed');
    bytes=Buffer.from(text.replace(old,"new URL('./assets/golden-wisp.png',import.meta.url).href").replace('constructor(){this.image=new Image();this.image.src=', 'constructor(image){this.image=image??new Image();if(!image)this.image.src='));
    files.push({path:`provenance/${record.sha256}.js`,bytes:original,sourceSha256:record.sha256});
   }
   files.push({path:record.path,bytes,sourceSha256:record.sha256});
  }
  for(const receipt of receipts)files.push({path:`provenance/${receipt.record.sha256}.json`,bytes:receipt.bytes,sourceSha256:receipt.record.sha256});
  const derived=files.filter(f=>f.path.endsWith('.png')).map(f=>({path:f.path,sourceSha256:f.sourceSha256,sha256:hash(f.bytes)}));
  files.push({path:'provenance/runtime-assets.json',bytes:Buffer.from(JSON.stringify(derived)+'\n')});
  const inventory=files.map(f=>({path:f.path,sha256:hash(f.bytes),sourceSha256:f.sourceSha256}));
  const id=hash(Buffer.from(JSON.stringify(inventory))),dir=resolve(output,'effects',id);
  for(const file of files){const path=safe(dir,resolve(dir,file.path));await mkdir(dirname(path),{recursive:true});await writeFile(path,file.bytes);}
  await writeFile(resolve(dir,'sources.json'),JSON.stringify(inventory)+'\n');
  effects[entry.character]={module:`effects/${id}/${entry.module}`,smoke:entry.character==='archer'?`effects/${id}/smoke.js`:null,decodedBytes,smokeDecodedBytes,contactMs:entry.contactMs};
 }
 return {effects,cues};
}
// The frames' encoding (tools/convert-character-runtime-webp.mjs): lossy colour, lossless alpha.
export const EFFECT_WEBP={quality:90,alphaQuality:100,exact:true,effort:6};
const RUNTIME_TEXT=['effect.js','smoke.js','effect.json'],PNG_REF=/assets\/(\$\{name\}|[\w.-]+)\.png/g;
/**
 * The WebP copy of each published effect in `effects` (manifest.effects of the PNG package at `source`): each
 * texture in the frames' encoding with the same size and alpha, the module, smoke and metadata pointed at it, and a
 * new folder id. Returns the new manifest.effects. A 1.1 MB PNG arrow is 0.34 MB of WebP, so it arrives on a slow link.
 */
export async function convertRuntimeEffects(source,output,effects){
 const result={};
 for(const [character,effect] of Object.entries(effects??{})){
  const from=safe(resolve(source,'effects'),resolve(source,dirname(effect.module)));
  const files=[],renamed=[];
  for(const record of JSON.parse(await readFile(resolve(from,'sources.json')))){
   if(record.path==='provenance/runtime-assets.json')continue;
   let bytes=await readFile(safe(from,resolve(from,record.path)));
   if(hash(bytes)!==record.sha256)throw Error(`Effect file hash mismatch: ${record.path}`);
   if(/^assets\/[\w.-]+\.png$/.test(record.path)){
    const before=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true}),webp=await sharp(bytes).webp(EFFECT_WEBP).toBuffer();
    const after=await sharp(webp).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    if(after.info.width!==before.info.width||after.info.height!==before.info.height)throw Error(`Effect WebP geometry mismatch: ${record.path}`);
    for(let i=3;i<before.data.length;i+=4)if(after.data[i]!==before.data[i])throw Error(`Effect WebP alpha mismatch: ${record.path}`);
    const path=record.path.replace(/\.png$/,'.webp');renamed.push([record.sha256,hash(webp)]);
    files.push({path,bytes:webp,sourceSha256:record.sourceSha256,pngSha256:record.sha256});continue;
   }
   files.push({path:record.path,bytes,sourceSha256:record.sourceSha256});
  }
  for(const file of files.filter(f=>RUNTIME_TEXT.includes(f.path))){
   let text=file.bytes.toString('utf8').replace(PNG_REF,'assets/$1.webp');
   // The metadata's hash fields name the WebP; a file name that is a PNG hash stays (the beam's sprite paths).
   if(file.path==='effect.json')for(const [png,webp] of renamed)text=text.replace(new RegExp(`("sha256"\\s*:\\s*")${png}"`,'g'),`$1${webp}"`);
   if(/assets\/[^'"`\s]*\.png/.test(text))throw Error(`Effect still names a PNG: ${file.path}`);
   for(const [ref] of text.matchAll(/assets\/[\w.-]+\.webp/g))if(!files.some(f=>f.path===ref))throw Error(`Effect names a missing texture: ${file.path} ${ref}`);
   file.bytes=Buffer.from(text);
  }
  const derived=files.filter(f=>f.pngSha256).map(f=>({path:f.path,sourceSha256:f.sourceSha256,pngSha256:f.pngSha256,sha256:hash(f.bytes),encoding:'webp-q90-alpha-lossless'}));
  files.push({path:'provenance/runtime-assets.json',bytes:Buffer.from(JSON.stringify(derived)+'\n')});
  const inventory=files.map(f=>({path:f.path,sha256:hash(f.bytes),sourceSha256:f.sourceSha256}));
  const id=hash(Buffer.from(JSON.stringify(inventory))),dir=resolve(output,'effects',id);
  for(const file of files){const path=safe(dir,resolve(dir,file.path));await mkdir(dirname(path),{recursive:true});await writeFile(path,file.bytes);}
  await writeFile(resolve(dir,'sources.json'),JSON.stringify(inventory)+'\n');
  const moved=path=>path&&`effects/${id}/${relative(from,resolve(source,path))}`;
  result[character]={...effect,module:moved(effect.module),smoke:moved(effect.smoke)};
 }
 return result;
}
