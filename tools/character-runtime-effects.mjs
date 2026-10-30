import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname,relative} from 'node:path';
import sharp from 'sharp';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
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
  for(const record of entry.files){
   const original=await readFile(safe(resolve(source,'..'),resolve(source,record.source)));
   if(!approvedHashes.has(record.sha256))throw Error(`Effect source has no publication hash: ${record.source}`);
   if(hash(original)!==record.sha256)throw Error(`Effect source hash mismatch: ${record.source}`);
   let bytes=original;
   if(record.path.endsWith('.png')){
    if(!audit.textures.some(t=>t.sha256===record.sha256&&t.pass===true))throw Error('Effect has no passing alpha receipt');
    const {data,info}=await sharp(bytes).ensureAlpha().extractChannel('alpha').raw().toBuffer({resolveWithObject:true});
    if(!data.includes(0)||!data.some(a=>a>0))throw Error('Effect alpha failed');decodedBytes+=info.width*info.height*4;if(record.path==='assets/golden-wisp.png')smokeDecodedBytes=info.width*info.height*4;
   }
   if(record.rewriteSmokeTextureURL){
    const text=bytes.toString('utf8'),old="'effects/golden-wisp.png'";
    if(text.split(old).length!==2)throw Error('Smoke texture URL contract changed');
    bytes=Buffer.from(text.replace(old,"new URL('./assets/golden-wisp.png',import.meta.url).href").replace('constructor(){this.image=new Image();this.image.src=', 'constructor(image){this.image=image??new Image();if(!image)this.image.src='));
    files.push({path:`provenance/${record.sha256}.mjs`,bytes:original,sourceSha256:record.sha256});
   }
   files.push({path:record.path,bytes,sourceSha256:record.sha256});
  }
  for(const receipt of receipts)files.push({path:`provenance/${receipt.record.sha256}.json`,bytes:receipt.bytes,sourceSha256:receipt.record.sha256});
  const inventory=files.map(f=>({path:f.path,sha256:hash(f.bytes),sourceSha256:f.sourceSha256}));
  const id=hash(Buffer.from(JSON.stringify(inventory))),dir=resolve(output,'effects',id);
  for(const file of files){const path=safe(dir,resolve(dir,file.path));await mkdir(dirname(path),{recursive:true});await writeFile(path,file.bytes);}
  await writeFile(resolve(dir,'sources.json'),JSON.stringify(inventory)+'\n');
  effects[entry.character]={module:`effects/${id}/${entry.module}`,smoke:entry.character==='archer'?`effects/${id}/smoke.mjs`:null,decodedBytes,smokeDecodedBytes,contactMs:entry.contactMs};
 }
 return {effects,cues};
}
