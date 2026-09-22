import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {MeshoptDecoder} from 'meshoptimizer';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';
const out='docs/graphics-prototype/board-model-verification';await mkdir(out,{recursive:true});
const checks=[],errors=[],manifest=JSON.parse(await readFile('public/prototype/models/board-manifest.json'));
const check=(name,ok,detail)=>checks.push({name,ok,detail});
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder});await MeshoptDecoder.ready;
const animation=doc=>doc.getRoot().listAnimations().map(a=>({name:a.getName(),channels:a.listChannels().map(c=>({node:c.getTargetNode().getName(),path:c.getTargetPath(),interpolation:c.getSampler().getInterpolation(),input:[...c.getSampler().getInput().getArray()],output:[...c.getSampler().getOutput().getArray()]}))}));
const skeleton=doc=>doc.getRoot().listSkins().map(s=>({joints:s.listJoints().map(j=>j.getName()),bind:[...s.getInverseBindMatrices().getArray()]}));
for(const m of manifest.models){
 const original=`public/prototype/models/rebuilt-${m.character}.glb`,board=`public/prototype/models/board-${m.character}.glb`,bytes=await readFile(original);
 const a=await io.read(original),b=await io.read(board);
 let valid=true,accent=0,clay=0;
 for(const mesh of b.getRoot().listMeshes())for(const p of mesh.listPrimitives()){
  if(p.getMaterial().getName()==='accent1')accent++;
  clay+=p.listTargets().length;
  for(const semantic of p.listSemantics())valid&&=[...p.getAttribute(semantic).getArray()].every(Number.isFinite);
  const weights=p.getAttribute('WEIGHTS_0').getArray();for(let i=0;i<weights.length;i+=4)valid&&=Math.abs(weights[i]+weights[i+1]+weights[i+2]+weights[i+3]-1)<1e-4;
 }
 check(`${m.character}: valid reduced mesh, paint and clay retained`,valid&&m.boardTriangles<m.sourceTriangles&&(m.character==='pawn'||accent>0&&clay>0),{triangles:m.boardTriangles,accent,clay});
 check(`${m.character}: exact skeleton and clips`,JSON.stringify(animation(a))===JSON.stringify(animation(b))&&JSON.stringify(skeleton(a))===JSON.stringify(skeleton(b)));
 check(`${m.character}: source hash intact`,createHash('sha256').update(bytes).digest('hex')===m.sourceSha256&&(m.character==='ogre'||bytes.equals(execFileSync('git',['show',`c5c2de3:${original}`],{maxBuffer:10_000_000}))));
}
const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1000,height:800}}),requests=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('request',r=>requests.push(r.url()));
try{
 await page.goto('http://localhost:5190/?study&variant=rebuilt&scene=character&character=ogre&pixels=.5&look=handmade&mesh=sculpt');await page.waitForFunction(()=>window.study);
 check('Fresh character scene loads only its GLB',requests.filter(u=>u.endsWith('.glb')).length===1&&requests.some(u=>u.endsWith('rebuilt-ogre.glb'))&&!requests.some(u=>u.includes('/voxels/')||u.includes('/quiet-hours/')),requests.filter(u=>u.endsWith('.glb')));
 for(const scene of ['board','cast']){
  await page.evaluate(s=>study.setScene(s),scene);
  for(const phase of [0,.25,.75]){
   await page.evaluate(()=>study.setMeshQuality('sculpt'));
   const before=await page.evaluate(phase=>{
    const pose=()=>{for(const e of study.entries){e.walk.reset();e.walk.action.reset().play().stopFading();e.walk.action.time=phase*e.walk.action.getClip().duration;e.walk.mixer.update(0);}view.scene.updateMatrixWorld(true);};pose();
    window.referenceCamera={position:view.camera.position.clone(),target:view.controls.target.clone(),zoom:view.camera.zoom};
    view.renderer.info.autoReset=false;view.renderer.info.reset();view.composer.render();const work={...view.renderer.info.render};view.renderer.info.autoReset=true;
    const t=study.contourPass.ids,a=new Uint8Array(t.width*t.height*4);view.renderer.readRenderTargetPixels(t,0,0,t.width,t.height,a);window.referenceMask=a;return work;
   },phase);
   if(phase===0)await page.screenshot({path:`${out}/${scene}-sculpt.png`});
   await page.evaluate(()=>study.setMeshQuality('board'));
   const after=await page.evaluate(phase=>{
    for(const e of study.entries){e.walk.reset();e.walk.action.reset().play().stopFading();e.walk.action.time=phase*e.walk.action.getClip().duration;e.walk.mixer.update(0);}
    const c=window.referenceCamera;view.camera.position.copy(c.position);view.controls.target.copy(c.target);view.camera.zoom=c.zoom;view.camera.updateProjectionMatrix();view.controls.update();view.scene.updateMatrixWorld(true);
    view.renderer.info.autoReset=false;view.renderer.info.reset();view.composer.render();const work={...view.renderer.info.render};view.renderer.info.autoReset=true;
    const t=study.contourPass.ids,a=new Uint8Array(t.width*t.height*4);view.renderer.readRenderTargetPixels(t,0,0,t.width,t.height,a);let union=0,mismatch=0;
    for(let i=0;i<a.length;i+=4){const b=window.referenceMask[i];if(a[i]||b){union++;if(a[i]!==b)mismatch++;}}
    return {...work,union,mismatch,difference:mismatch/union};
   },phase);
   check(`${scene} at phase ${phase}: silhouette retained and workload reduced`,after.difference<.035&&after.triangles<before.triangles*.85,{before,after});
   if(phase===0)await page.screenshot({path:`${out}/${scene}-board.png`});
  }
 }
 await page.evaluate(()=>study.setMeshQuality('auto'));await page.waitForFunction(()=>!study.switchingTier);
 check('Distant cast automatically uses board meshes',await page.evaluate(()=>study.meshTier==='board'));
 const zoom=await page.evaluate(async()=>{
  study.setWalking(true);for(const e of study.entries){e.walk.action.time=.6;e.walk.action.stopFading();}const roots=study.entries.map(e=>e.root.uuid);
  view.camera.zoom*=3;view.camera.updateProjectionMatrix();await study.updateMeshTier();
  return {tier:study.meshTier,walking:study.walking,rootsStable:study.entries.every((e,i)=>e.root.uuid===roots[i]),times:study.entries.map(e=>e.walk.action.time)};
 });
 check('Zoom swaps detail without replacing roots or restarting walking',zoom.tier==='sculpt'&&zoom.walking&&zoom.rootsStable&&zoom.times.every(t=>t>.5),zoom);
 const memory=await page.evaluate(async()=>{
  study.setWalking(false);const samples=[];
  for(let i=0;i<4;i++){await study.setMeshQuality('sculpt');await study.setMeshQuality('board');view.composer.render();samples.push({...view.renderer.info.memory});}return samples;
 });
 check('Repeated detail switching has stable GPU resources',memory.slice(1).every(s=>s.geometries===memory[0].geometries&&s.textures===memory[0].textures),memory);
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:out+'/cast-mobile.png'});
 check('Mobile cast fits viewport',await page.evaluate(()=>document.documentElement.scrollWidth===innerWidth));
}finally{await browser.close();}
check('No browser or shader errors',errors.length===0,errors);
const totals=Object.fromEntries(['sourceTriangles','boardTriangles','sourceBytes','boardBytes'].map(k=>[k,manifest.models.reduce((sum,m)=>sum+m[k],0)]));
const passed=checks.every(c=>c.ok);await writeFile(out+'/checks.json',JSON.stringify({passed,totals,checks,errors},null,2)+'\n');console.log(JSON.stringify({passed,totals,checks:checks.length,failures:checks.filter(c=>!c.ok),errors},null,2));if(!passed)process.exitCode=1;
