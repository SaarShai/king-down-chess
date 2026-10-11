/** Native applied-clay morphs: surface locality, playback, outlines, and saved looks.
 * Optional revision verifies every walk's actual sample bytes against an accepted cast.
 */
import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const out='docs/graphics-prototype/applied-clay-verification';await mkdir(out,{recursive:true});
const checks=[],errors=[];
const check=(name,ok,detail)=>{checks.push({name,ok,detail});if(!ok)throw new Error(name+': '+JSON.stringify(detail));};
function walkHash(blob){
 const n=blob.readUInt32LE(12),g=JSON.parse(blob.subarray(20,20+n)),bin=blob.subarray(28+n);
 const values=id=>{const a=g.accessors[id],v=g.bufferViews[a.bufferView],size=({SCALAR:1,VEC3:3,VEC4:4})[a.type]*4,parts=[];for(let i=0;i<a.count;i++){const at=(v.byteOffset||0)+(a.byteOffset||0)+i*(v.byteStride||size);parts.push(bin.subarray(at,at+size));}return Buffer.concat(parts).toString('base64');};
 const channels=g.animations.flatMap(a=>a.channels.map(c=>{const s=a.samplers[c.sampler];return [g.nodes[c.target.node].name,c.target.path,s.interpolation,values(s.input),values(s.output)];}));
 return createHash('sha256').update(JSON.stringify(channels.sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b))))).digest('hex');
}
const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1440,height:1000}});
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
try {
 await page.goto('http://localhost:5190/?study&variant=rebuilt&scene=cast&pixels=0.5&contours=adaptive&detail=refined&look=handmade&cadence=smooth');await page.waitForFunction(()=>window.study);
 const cast=await page.evaluate(()=>study.cast);
 if(process.argv[2])for(const c of cast){const path=`public/prototype/models/rebuilt-${c.key}.glb`,before=execFileSync('git',['show',`${process.argv[2]}:${path}`],{maxBuffer:20e6}),after=await readFile(path);check(c.label+' walk sample bytes unchanged',walkHash(before)===walkHash(after));}
 const layerMetrics=await page.evaluate(()=>study.entries.map(e=>{
  let count=0,raised=0,armyMax=0,maxLift=0,weightOK=true,finite=true;
  e.visual.traverse(m=>{if(!m.isMesh)return;const i=m.morphTargetDictionary?.ClayLayer;if(i===undefined)return;count++;weightOK&&=m.morphTargetInfluences[i]===1;
   const p=m.geometry.morphAttributes.position[i];for(let j=0;j<p.count;j++){const d=Math.hypot(p.getX(j),p.getY(j),p.getZ(j));finite&&=Number.isFinite(d);maxLift=Math.max(maxLift,d);if(d>1e-7)raised++;if(m.material.name==='army')armyMax=Math.max(armyMax,d);}
  });return {key:e.character,side:e.side,count,raised,armyMax,maxLift,weightOK,finite};
 }));
 check('All 15 accent designs have a raised clay surface in both armies',layerMetrics.every(m=>m.key==='pawn'?m.count===0:m.count>0&&m.raised>0&&m.weightOK),layerMetrics);
 check('Relief stays on the coloured feature and below 0.8% of a board unit',layerMetrics.every(m=>m.armyMax<1e-7&&m.maxLift<.008&&m.finite));
 await page.screenshot({path:out+'/cast-handmade.png'});
 const playback=await page.evaluate(()=>{
  for(const e of study.entries){e.walk.reset();e.walk.play();for(let i=0;i<40;i++)e.walk.update(1/60);e.walk.active=false;e.visual.updateMatrixWorld(true);}
  let ok=true;for(const e of study.entries)e.visual.traverse(m=>{const i=m.morphTargetDictionary?.ClayLayer;if(i!==undefined)ok&&=m.morphTargetInfluences[i]===1;});return ok;
 });
 check('Walking does not animate away or detach the applied layer',playback);
 const silhouette=await page.evaluate(()=>{
  view.composer.render();const t=study.contourPass.ids,renderer=view.renderer,ids=new Uint8Array(t.width*t.height*4);renderer.readRenderTargetPixels(t,0,0,t.width,t.height,ids);
  let Basic;view.scene.traverse(o=>{if(o.material?.type==='MeshBasicMaterial')Basic=o.material.constructor;});
  const white=new Basic({color:0xffffff,side:2}),black=new Basic({color:0,side:2}),decal=new Basic({visible:false}),figures=new Set(),original=new Map();
  for(const e of study.entries)e.visual.traverse(m=>{if(m.isMesh)figures.add(m);});
  view.scene.traverse(o=>{if(o.isMesh){const m=o.material;original.set(o,m);o.material=figures.has(o)?white:m.transparent&&!m.depthWrite?decal:black;}});
  const background=view.scene.background,previous=renderer.getRenderTarget(),reference=t.clone();view.scene.background=background.clone().set(0);renderer.setRenderTarget(reference);renderer.render(view.scene,view.camera);
  const pixels=new Uint8Array(t.width*t.height*4);renderer.readRenderTargetPixels(reference,0,0,t.width,t.height,pixels);let mismatch=0,area=0;for(let i=0;i<ids.length;i+=4){const a=ids[i]>0,b=pixels[i]>128;if(a!==b)mismatch++;if(a)area++;}
  for(const [o,m] of original)o.material=m;view.scene.background=background;renderer.setRenderTarget(previous);reference.dispose();white.dispose();black.dispose();decal.dispose();return {mismatch,area};
 });
 check('Animated outlines match the native skinned + raised silhouettes exactly',silhouette.area>1000&&silhouette.mismatch===0,silhouette);
 for(const look of ['current','plasticine','handmade']){
  await page.evaluate(x=>study.setLook(x),look);
  const ok=await page.evaluate(expected=>study.entries.every(e=>{let ok=true;e.visual.traverse(m=>{const i=m.morphTargetDictionary?.ClayLayer;if(i!==undefined)ok&&=m.morphTargetInfluences[i]===expected;});return ok;}),look==='handmade'?1:0);
  check(look+' selects the intended surface relief',ok);
 }
 for(const key of ['queen','maester','rook','king-gaya','king-frost','king-spirit']){
  await page.evaluate(key=>study.setCharacter(key),key);
  await page.evaluate(()=>{const target=view.controls.target;view.camera.position.copy(target).add(target.clone().set(2,3.7,10));view.controls.update();view.composer.render();});
  await page.screenshot({path:out+'/'+key+'.png'});
 }
 check('No browser or shader errors',errors.length===0,errors);
}finally{
 await writeFile(out+'/runtime-checks.json',JSON.stringify({checks,errors},null,2)+'\n');await browser.close();
}
console.log(JSON.stringify({checks:checks.length,passed:checks.filter(c=>c.ok).length,errors}));
