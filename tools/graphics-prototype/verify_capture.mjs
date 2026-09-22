/** Standalone capture studies: real browser geometry, deterministic samples, lifecycle. */
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const out='docs/graphics-prototype/capture-verification';await mkdir(out,{recursive:true});
const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],results=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
try{
 await page.goto('http://localhost:5190/?study&variant=rebuilt&scene=character&character=guard&pixels=0.5&look=handmade&contours=adaptive');await page.waitForFunction(()=>window.study);
 for(const style of ['burst','melt','implode','launch','crack']){
  await page.selectOption('#capture-style',style);await page.click('#capture-play');
  const metrics=await page.evaluate(()=>{
   const s=study,original=s.entries.map(e=>e.visual),stats={bothArmies:s.captures.length===2,hidden:original.every(g=>!g.visible),finite:true,accent:true,deterministic:true,shaders:true,disposed:false,finished:false,restored:false,maxMeshes:0};
   const resources=new Set();
   for(const c of s.captures){
    c.active=false;let meshes=0,accent=false;
    c.group.traverse(m=>{if(!m.isMesh)return;meshes++;resources.add(m.geometry);for(const mat of Array.isArray(m.material)?m.material:[m.material]){resources.add(mat);accent||=mat.name==='accent1';stats.shaders&&=mat.onBeforeCompile.toString().includes('shader');}});
    stats.maxMeshes=Math.max(stats.maxMeshes,meshes);stats.accent&&=accent;
   }
   const fingerprint=c=>{c.group.updateMatrixWorld(true);const a=[];c.group.traverse(m=>{if(!m.isMesh)return;a.push(...m.matrixWorld.elements,...m.geometry.attributes.position.array);});return a;};
   for(const t of [0,.12,.25,.5,.72,.9,1])for(const c of s.captures){c.sample(t);stats.finite&&=fingerprint(c).every(Number.isFinite);}
   stats.finished=s.captures.every(c=>!c.group.visible);
   for(const c of s.captures){c.sample(.45);const a=fingerprint(c);c.sample(.9);c.sample(.45);const b=fingerprint(c);stats.deterministic&&=a.length===b.length&&a.every((v,i)=>v===b[i]);}
   let disposed=0;for(const r of resources)r.addEventListener('dispose',()=>disposed++);
   s.restoreCaptures();stats.disposed=disposed===resources.size;stats.restored=original.every(g=>g.visible)&&s.captures.length===0;
   return stats;
  });
  results.push({style,...metrics});
  for(const t of [.2,.45,.7]){
   await page.evaluate(({style,t})=>{study.capture(style);for(const c of study.captures){c.active=false;c.sample(t);}view.composer.render();},{style,t});
   await page.locator('.stage').screenshot({path:`${out}/${style}-${t}.png`});
  }
 }
 // Compare the actual fragment/deformed silhouette against the native render.
 for(const style of ['burst','melt','implode','crack']){
  const silhouette=await page.evaluate(style=>{
   study.capture(style);for(const c of study.captures){c.active=false;c.sample(.45);}view.composer.render();
   const target=study.contourPass.ids,renderer=view.renderer,ids=new Uint8Array(target.width*target.height*4);renderer.readRenderTargetPixels(target,0,0,target.width,target.height,ids);
   let Basic;view.scene.traverse(o=>{if(o.material?.type==='MeshBasicMaterial')Basic=o.material.constructor;});
   const white=new Basic({color:0xffffff,side:2}),black=new Basic({color:0,side:2}),decal=new Basic({visible:false}),figures=new Set(),original=new Map();
   for(const c of study.captures)c.group.traverse(m=>{if(m.isMesh)figures.add(m);});
   view.scene.traverse(o=>{if(o.isMesh){const m=o.material;original.set(o,m);o.material=figures.has(o)?white:m.transparent&&!m.depthWrite?decal:black;}});
   const background=view.scene.background,previous=renderer.getRenderTarget(),reference=target.clone();view.scene.background=background.clone().set(0);renderer.setRenderTarget(reference);renderer.render(view.scene,view.camera);
   const pixels=new Uint8Array(ids.length);renderer.readRenderTargetPixels(reference,0,0,target.width,target.height,pixels);let mismatch=0,area=0;for(let i=0;i<ids.length;i+=4){const a=ids[i]>0,b=pixels[i]>128;if(a!==b)mismatch++;if(a)area++;}
   for(const [o,m] of original)o.material=m;view.scene.background=background;renderer.setRenderTarget(previous);reference.dispose();white.dispose();black.dispose();decal.dispose();return {mismatch,area};
  },style);results.push({check:style+' outlined silhouette',pass:silhouette.area>100&&silhouette.mismatch===0,...silhouette});
 }
 await page.click('#capture-reset');await page.click('#capture-play');await page.click('#walk');
 results.push({check:'walk restores figures',pass:await page.evaluate(()=>study.captures.length===0&&study.entries.every(e=>e.visual.visible)&&study.walking)});
 await page.click('#capture-play');await page.selectOption('#look','current');await page.waitForFunction(()=>study.look==='current'&&study.captures.length===0);
 results.push({check:'look switch cleans up',pass:await page.evaluate(()=>study.entries.every(e=>e.visual.visible))});
 await page.selectOption('#scene','pair');await page.waitForFunction(()=>study.scene==='pair');results.push({check:'non-character controls disabled',pass:await page.locator('#capture-play').isDisabled()});
 await page.evaluate(()=>study.setLook('handmade'));
 const cast=await page.evaluate(()=>study.cast.map(c=>c.key));
 for(const key of cast){
  await page.evaluate(key=>study.setCharacter(key),key);
  const metrics=await page.evaluate(()=>{
   const bounds=o=>{o.updateMatrixWorld(true);const values=[Infinity,Infinity,Infinity,-Infinity,-Infinity,-Infinity];o.traverse(m=>{if(!m.isMesh)return;if(m.isSkinnedMesh)m.skeleton.update();const v=m.position.clone();for(let i=0;i<m.geometry.attributes.position.count;i++){m.getVertexPosition(i,v).applyMatrix4(m.matrixWorld);for(let j=0;j<3;j++){values[j]=Math.min(values[j],v.getComponent(j));values[j+3]=Math.max(values[j+3],v.getComponent(j));}}});return values;};
   const before=study.entries.map(e=>bounds(e.visual));let snapshotError=0,finite=true;
   for(const style of ['burst','melt']){
    study.capture(style);
    for(const [i,c] of study.captures.entries()){
     c.active=false;c.group.updateMatrixWorld(true);
     // Fragment caps and the hidden puddle may extend bounds; the baked source
     // surface itself must exactly match the actual native skinned/morphed pose.
     const b=[Infinity,Infinity,Infinity,-Infinity,-Infinity,-Infinity];
     for(const {mesh} of c.surfaces){mesh.updateMatrixWorld(true);const pa=mesh.geometry.attributes.position,v=mesh.position.clone();for(let k=0;k<pa.count;k++){v.fromBufferAttribute(pa,k).applyMatrix4(c.group.matrixWorld);for(let j=0;j<3;j++){b[j]=Math.min(b[j],v.getComponent(j));b[j+3]=Math.max(b[j+3],v.getComponent(j));}}}
     snapshotError=Math.max(snapshotError,...b.map((n,j)=>Math.abs(n-before[i][j])));
     for(const t of [.2,.5,.85]){c.sample(t);c.group.traverse(m=>{if(m.isMesh)finite&&=[...m.geometry.attributes.position.array].every(Number.isFinite);});}
     c.active=true;c.elapsed=0;c.update(c.duration);finite&&=!c.active&&!c.group.visible;
    }
    study.restoreCaptures();
   }
   return {snapshotError,finite};
  });
  results.push({check:key+' source snapshot and effects',pass:metrics.snapshotError<1e-5&&metrics.finite,...metrics});
 }
 await page.selectOption('#cadence','stopmotion');await page.waitForFunction(()=>study.cadence==='stopmotion');
 const cadenceOK=await page.evaluate(()=>{study.capture('implode');const c=study.captures[0];c.active=false;c.sample(.1);const a=Array.from(c.surfaces[0].mesh.geometry.attributes.position.array);c.sample(.101);const b=c.surfaces[0].mesh.geometry.attributes.position.array;const same=a.every((n,i)=>n===b[i]);study.restoreCaptures();return same;});
 results.push({check:'stop-motion holds poses between ticks',pass:cadenceOK});
 await page.setViewportSize({width:390,height:844});await page.selectOption('#capture-style','melt');await page.click('#capture-play');
 await page.evaluate(()=>{for(const c of study.captures){c.active=false;c.sample(.55);}view.composer.render();});await page.screenshot({path:out+'/mobile-melt.png'});
 results.push({check:'mobile controls and URL',pass:(await page.locator('#capture-reset').isEnabled())&&new URL(page.url()).searchParams.get('capture')==='melt'});
}finally{await browser.close();}
const passed=errors.length===0&&results.every(r=>'pass'in r?r.pass:Object.entries(r).every(([k,v])=>typeof v!=='boolean'||v));
await writeFile(`${out}/results.json`,JSON.stringify({passed,results,errors},null,2)+'\n');console.log(JSON.stringify({passed,results,errors},null,2));if(!passed)process.exitCode=1;
