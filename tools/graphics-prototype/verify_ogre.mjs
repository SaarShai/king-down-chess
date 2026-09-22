import { chromium } from 'playwright';
import { mkdir,writeFile } from 'node:fs/promises';
const out='docs/graphics-prototype/ogre-verification';await mkdir(out,{recursive:true});
const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],results=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
try{
 for(const quality of ['sculpt','board']){
  await page.goto(`http://localhost:5190/?study&variant=rebuilt&scene=character&character=ogre&pixels=.5&look=handmade&mesh=${quality}`);await page.waitForFunction(()=>window.study);
  for(const clip of ['Walk','Shove']){
   const metrics=await page.evaluate(clip=>{
    const e=study.entries[0],w=e.walk;w.reset();e.visual.updateMatrixWorld(true);
    const meshes=[];e.visual.traverse(o=>{if(o.isSkinnedMesh)meshes.push(o);});
    const positions=()=>meshes.map(m=>{m.skeleton.update();const p=m.position.clone();return Array.from({length:m.geometry.attributes.position.count},(_,i)=>m.getVertexPosition(i,p).clone().applyMatrix4(m.matrixWorld).sub(e.base));});
    const rest=positions(),edges=[],feet=[[],[]];let wrongAccentWeights=0;
    meshes.forEach((m,k)=>{
     const a=m.geometry.attributes,ix=m.geometry.index;
     for(let i=0;i<ix.count;i+=3)for(let j=0;j<3;j++){
      const u=ix.getX(i+j),v=ix.getX(i+(j+1)%3),length=rest[k][u].distanceTo(rest[k][v]);
      if(length>.005)edges.push({k,u,v,length,rigid:m.material.name==='accent1'||rest[k][u].y>1.15&&rest[k][v].y>1.15});
     }
     for(let i=0;i<a.position.count;i++){
      if(rest[k][i].y<.04)feet[rest[k][i].x<0?0:1].push({k,i});
      if(m.material.name==='accent1')for(let j=0;j<4;j++)if(a.skinWeight.array[i*4+j]>1e-5&&!m.skeleton.bones[a.skinIndex.array[i*4+j]].name.startsWith('hand'))wrongAccentWeights++;
     }
    });
    const action=clip==='Walk'?w.action:e.shove;action.reset().play();action.stopFading();action.setEffectiveWeight(1);
    let worstLow,worstHigh;let minRatio=Infinity,maxRatio=0,rigidError=0,minFloor=Infinity,maxContact=0,travel=0;const ratios=[];
    for(let f=0;f<=48;f++){
     action.time=f/48*action.getClip().duration;w.mixer.update(0);e.visual.updateMatrixWorld(true);const pose=positions();
     for(const edge of edges){const r=pose[edge.k][edge.u].distanceTo(pose[edge.k][edge.v])/edge.length;if(r<minRatio){worstLow={frame:f,at:rest[edge.k][edge.u].toArray()};}if(r>maxRatio){worstHigh={frame:f,at:rest[edge.k][edge.u].toArray()};}minRatio=Math.min(minRatio,r);maxRatio=Math.max(maxRatio,r);ratios.push(r);if(edge.rigid)rigidError=Math.max(rigidError,Math.abs(1-r));}
     const floor=feet.map(list=>Math.min(...list.map(({k,i})=>pose[k][i].y)));minFloor=Math.min(minFloor,...floor);maxContact=Math.max(maxContact,Math.min(...floor));
     for(const list of feet)for(const {k,i} of list)travel=Math.max(travel,pose[k][i].distanceTo(rest[k][i]));
    }
    ratios.sort((a,b)=>a-b);w.reset();e.visual.updateMatrixWorld(true);const reset=positions();let resetError=0,loopError=0;
    for(let k=0;k<rest.length;k++)for(let i=0;i<rest[k].length;i++)resetError=Math.max(resetError,rest[k][i].distanceTo(reset[k][i]));
    for(const track of action.getClip().tracks)for(let i=0;i<track.getValueSize();i++)loopError=Math.max(loopError,Math.abs(track.values[i]-track.values[track.values.length-track.getValueSize()+i]));
    action.reset().play().stopFading();action.time=action.getClip().duration*.45;w.mixer.update(0);view.scene.updateMatrixWorld(true);view.composer.render();
    const target=study.contourPass.ids,ids=new Uint8Array(target.width*target.height*4);view.renderer.readRenderTargetPixels(target,0,0,target.width,target.height,ids);
    let Basic;view.scene.traverse(o=>{if(o.material?.type==='MeshBasicMaterial')Basic=o.material.constructor;});
    const white=new Basic({color:0xffffff,side:2}),black=new Basic({color:0,side:2}),decal=new Basic({visible:false}),figures=new Set(),original=new Map();
    for(const e of study.entries)e.visual.traverse(o=>{if(o.isMesh)figures.add(o);});
    view.scene.traverse(o=>{if(o.isMesh){original.set(o,o.material);o.material=figures.has(o)?white:o.material.transparent&&!o.material.depthWrite?decal:black;}});
    const background=view.scene.background,previous=view.renderer.getRenderTarget(),reference=target.clone();view.scene.background=background.clone().set(0);view.renderer.setRenderTarget(reference);view.renderer.render(view.scene,view.camera);
    const pixels=new Uint8Array(ids.length);view.renderer.readRenderTargetPixels(reference,0,0,target.width,target.height,pixels);let maskMismatch=0;for(let i=0;i<ids.length;i+=4)if((ids[i]>0)!==(pixels[i]>128))maskMismatch++;
    for(const [o,m] of original)o.material=m;view.scene.background=background;view.renderer.setRenderTarget(previous);reference.dispose();white.dispose();black.dispose();decal.dispose();w.reset();
    return {maskMismatch,worstLow,worstHigh,minRatio,maxRatio,p99:ratios[Math.floor(ratios.length*.99)],rigidError,minFloor,maxContact,travel,resetError,loopError,wrongAccentWeights};
   },clip);
   results.push({quality,clip,...metrics,ok:metrics.maskMismatch===0&&metrics.minRatio>.3&&metrics.maxRatio<2.5&&metrics.p99<1.25&&metrics.rigidError<.001&&metrics.minFloor>-.002&&metrics.maxContact<.015&&metrics.resetError<1e-6&&metrics.loopError<1e-4&&metrics.wrongAccentWeights===0&&(clip!=='Walk'||metrics.travel>.06)});
   if(quality==='sculpt'&&!process.env.OGRE_METRICS_ONLY)for(const angle of [0,Math.PI/2])for(const phase of [.15,.45,.75]){
    await page.evaluate(({angle,phase,clip})=>{
     const t=view.controls.target;view.camera.position.copy(t).add(t.clone().set(2,3.7,10).applyAxisAngle(view.camera.up,angle));view.controls.update();
     for(const e of study.entries){e.walk.reset();const a=clip==='Walk'?e.walk.action:e.shove;a.reset().play().stopFading();a.setEffectiveWeight(1);a.time=phase*a.getClip().duration;e.walk.mixer.update(0);}
     view.scene.updateMatrixWorld(true);view.composer.render();
    },{angle,phase,clip});
    await page.screenshot({path:`${out}/${clip}-${Math.round(angle*180/Math.PI)}-${phase}.png`});
   }
  }
  await page.evaluate(()=>{for(const e of study.entries)e.walk.reset();study.animate('ability');});
  await page.waitForFunction(()=>!study.running);
  results.push({quality,check:'Ability completes and resets',ok:await page.evaluate(()=>study.entries.every(e=>!e.shove.isRunning()))});
  await page.evaluate(()=>{study.animate('ability');study.setWalking(true);});
  results.push({quality,check:'Walking interrupts shove',ok:await page.evaluate(()=>study.walking&&study.entries.every(e=>!e.shove.isRunning()))});
  await page.evaluate(()=>{study.setWalking(false);for(const e of study.entries)e.walk.reset();});
  for(const effect of ['burst','melt','implode','launch','crack']){await page.evaluate(style=>{study.capture(style);for(const c of study.captures){c.active=false;c.sample(.45);}view.composer.render();study.restoreCaptures();},effect);}
 }
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:out+'/ogre-mobile.png'});
 results.push({check:'Phone viewport fits',ok:await page.evaluate(()=>document.documentElement.scrollWidth===innerWidth)});
}finally{await browser.close();}
const passed=errors.length===0&&results.every(r=>r.ok);await writeFile(out+'/checks.json',JSON.stringify({passed,results,errors},null,2)+'\n');console.log(JSON.stringify({passed,results,errors},null,2));if(!passed)process.exitCode=1;
