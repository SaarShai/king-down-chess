/** Bounded renderer ownership/contact checks. Run once against old code to confirm failures. */
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const out=process.env.ENGINE_CHECK_OUT||'docs/graphics-prototype/engine-reliability';await mkdir(out,{recursive:true});
const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1000,height:800}}),errors=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
try{
 await page.goto('http://localhost:5190/?study&variant=baseline&scene=pair&pixels=1');await page.waitForFunction(()=>window.study);
 const baseline=await page.evaluate(async()=>{
  const v=study.view;
  const workload=()=>{v.renderer.info.autoReset=false;v.renderer.info.reset();v.composer.render();const r={calls:v.renderer.info.render.calls,triangles:v.renderer.info.render.triangles};v.renderer.info.autoReset=true;return r;};
  v.debris.mesh.visible=true;const submitted=workload();v.debris.step(0);const idle=workload(),idleHidden=!v.debris.mesh.visible;
  const at=v.world.position.clone().set(0,.2,0);v.debris.burst(at,[0xdcc9a2],28);v.debris.step(.01);const burstVisible=v.debris.mesh.visible,burstCount=v.debris.mesh.count;
  v.debris.step(2);const expiredHidden=!v.debris.mesh.visible,expiredCount=v.debris.mesh.count;
  const e=study.entries[0],shadow=e.root.children.find(c=>c.geometry===v.shadowGeo);
  const hop=v.hop(e.root,e.sq,e.sq+1,1,.35);v.tweens.step(.5);v.scene.updateMatrixWorld(true);const shadowMid=shadow.getWorldPosition(shadow.position.clone()).y,bodyMid=e.root.position.y;v.tweens.flush();await hop;const shadowEnd=shadow.position.y;
  // Render live arrows so the test covers GPU allocation, then finish normally
  // or via the same flush used when the tab hides / game resets.
  const shot=async flush=>{const p=v.arrow(e.sq,e.sq+1);v.tweens.step(.1);v.composer.render();if(flush)v.tweens.flush();else v.tweens.step(.3);await p;v.composer.render();};
  await shot(false);const before={...v.renderer.info.memory};
  for(let i=0;i<8;i++)await shot(i%2===0);const after={...v.renderer.info.memory};
  return {idleHidden,burstVisible,burstCount,expiredHidden,expiredCount,shadowMid,bodyMid,shadowEnd,before,after,submitted,idle};
 });
 checks.push({name:'idle debris omitted',ok:baseline.idleHidden&&baseline.expiredHidden&&baseline.expiredCount===0});
 checks.push({name:'small burst trims unused instances',ok:baseline.burstVisible&&baseline.burstCount<=29});
 checks.push({name:'hop shadow remains at board height',ok:Math.abs(baseline.shadowMid-.02)<1e-6&&baseline.bodyMid>.3&&Math.abs(baseline.shadowEnd-.02)<1e-6});
 checks.push({name:'repeated normal/flush projectiles release GPU geometry',ok:baseline.after.geometries===baseline.before.geometries&&baseline.after.textures===baseline.before.textures});
 await writeFile(`${out}/baseline-metrics.json`,JSON.stringify(baseline,null,2)+'\n');
 if(!process.env.ENGINE_QUICK){
  await page.evaluate(()=>study.choose('rebuilt'));await page.evaluate(()=>study.setCharacter('guard'));await page.evaluate(()=>study.setLook('handmade'));
  const lifecycle=await page.evaluate(async()=>{
   const v=study.view,round=async()=>{
    for(const look of ['handmade','plasticine','current']){
     await study.setLook(look);study.setWalking(true);for(let i=0;i<12;i++)for(const e of study.entries)e.walk.update(1/60);study.setWalking(false);
     for(const style of ['burst','melt','implode','launch','crack']){study.capture(style);for(const c of study.captures){c.active=false;c.sample(.4);}v.composer.render();study.restoreCaptures();}
    }
    await study.setLook('handmade');v.composer.render();return {...v.renderer.info.memory};
   };
   const before=await round(),samples=[];for(let i=0;i<4;i++)samples.push(await round());return {before,samples};
  });
  checks.push({name:'warm repeated clay/walk/capture switches do not accumulate GPU resources',ok:lifecycle.samples.every(s=>s.geometries===lifecycle.before.geometries&&s.textures===lifecycle.before.textures),...lifecycle});
  const workloads=[];
  for(const scene of ['character','board','cast']){
   await page.evaluate(scene=>study.setScene(scene),scene);
   workloads.push(await page.evaluate(()=>{const v=study.view;v.renderer.info.autoReset=false;v.renderer.info.reset();v.composer.render();const r={scene:study.scene,pieces:study.entries.length,drawCalls:v.renderer.info.render.calls,submittedTriangles:v.renderer.info.render.triangles,canvasWidth:v.renderer.domElement.width,canvasHeight:v.renderer.domElement.height,geometries:v.renderer.info.memory.geometries,textures:v.renderer.info.memory.textures};v.renderer.info.autoReset=true;return r;}));
  }
  await writeFile(`${out}/workload.json`,JSON.stringify({note:'Complete composer-frame counters; not physical-device FPS.',workloads},null,2)+'\n');
 }
}finally{await browser.close();}
checks.push({name:'no browser or shader errors',ok:errors.length===0});const passed=checks.every(c=>c.ok);await writeFile(`${out}/checks.json`,JSON.stringify({passed,checks,errors},null,2)+'\n');console.log(JSON.stringify({passed,checks,errors},null,2));if(!passed)process.exitCode=1;
