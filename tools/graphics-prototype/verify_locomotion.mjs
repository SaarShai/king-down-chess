/** Actual-sculpt regression checks for shape-preserving clay locomotion. */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const out='docs/graphics-prototype';await mkdir(out+'/captures',{recursive:true});
const browser=await chromium.launch(),p=await browser.newPage({viewport:{width:1440,height:1000}}),checks=[],errors=[];
p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const check=(name,ok,detail)=>{checks.push({name,ok,detail});if(!ok)throw Error(name+': '+JSON.stringify(detail));};
try{
 await p.goto('http://localhost:5190/?study&variant=rebuilt&scene=character&character=beast&pixels=0.5&look=handmade&motion=character&contours=adaptive');await p.waitForFunction(()=>window.study);
 const beast=await p.evaluate(()=>{
  const e=study.entries[0],meshes=[];e.visual.traverse(m=>{if(m.isSkinnedMesh)meshes.push(m);});
  const sample=()=>{view.scene.updateMatrixWorld(true);return meshes.map(m=>{const a=[],v=m.position.clone();for(let i=0;i<m.geometry.attributes.position.count;i++)a.push(m.getVertexPosition(i,v).clone());return a;});};
  const probe=w=>{
   w.reset();const rest=sample();w.play();let max=1,min=1,scaleError=0;
   for(let frame=0;frame<24;frame++){
    w.update(w.action.getClip().duration/24);const pose=sample();scaleError=Math.max(scaleError,...e.visual.scale.toArray().map(v=>Math.abs(v-1)));
    meshes.forEach((m,k)=>{const ix=m.geometry.index,n=ix?ix.count:rest[k].length;for(let i=0;i<n;i+=3)for(let edge=0;edge<3;edge++){
     const a=ix?ix.getX(i+edge):i+edge,b=ix?ix.getX(i+(edge+1)%3):i+(edge+1)%3,length=rest[k][a].distanceTo(rest[k][b]);if(length<.005)continue;
     const ratio=pose[k][a].distanceTo(pose[k][b])/length;max=Math.max(max,ratio);min=Math.min(min,ratio);
    }});
   }
   w.reset();return {max,min,scaleError};
  };
  const result={kind:e.walk.kind,current:probe(e.walk)};
  // Negative control: replay the rejected baked clip on the same real sculpt.
  const raw=new e.walk.constructor(e.visual,e.visual.animations.find(c=>c.name==='Walk'),{motion:'stride'});
  result.rejectedClip=probe(raw);raw.dispose();return result;
 });
 check('Rejected Beast walk reproduces severe local stretching',beast.rejectedClip.max>4,beast.rejectedClip);
 check('Beast shuffle preserves triangle lengths and body scale through a complete cycle',beast.kind==='shuffle'&&beast.current.max<1.0001&&beast.current.min>.9999&&beast.current.scaleError===0,beast.current);
 await p.evaluate(()=>study.setWalking(true));await p.waitForTimeout(750);await p.screenshot({path:out+'/captures/motion-beast-shuffle.png'});
 await p.evaluate(()=>study.setCharacter('queen'));await p.evaluate(()=>study.setWalking(true));await p.waitForTimeout(650);await p.screenshot({path:out+'/captures/motion-queen-flow.png'});
 check('Queen uses flow without limb tracks',await p.evaluate(()=>study.entries.every(e=>e.walk.kind==='flow'&&e.walk.action.getClip().tracks.length===0)));
 const flow=await p.evaluate(()=>{
  study.setWalking(false);const e=study.entries[0],w=e.walk;w.reset();w.play();
  for(let i=0;i<30;i++)w.update(1/60);
  const a=Array.from(w.locomotion.patch.geometry.attributes.position.array),position=e.visual.position.clone();
  for(let i=0;i<30;i++)w.update(1/60);
  const b=w.locomotion.patch.geometry.attributes.position.array;
  const result={changed:a.filter((v,i)=>Math.abs(v-b[i])>.001).length,bodyScale:e.visual.scale.toArray(),shift:e.visual.position.distanceTo(position),patchVisible:w.locomotion.patch.visible};w.reset();return result;
 });
 check('Clay wave changes locally while the figure keeps its proportions',flow.changed>30&&flow.bodyScale.every(v=>v===1)&&flow.patchVisible,flow);
 await p.evaluate(()=>study.setScene('cast'));
 const cast=await p.evaluate(()=>{
  const result=[];for(const e of study.entries){
   const w=e.walk;w.reset();const position=e.visual.position.clone(),rotation=e.visual.quaternion.clone();
   const worldFloor=()=>{view.scene.updateMatrixWorld(true);let low=Infinity;const v=e.visual.position.clone();e.visual.traverse(m=>{if(m.isSkinnedMesh)for(let j=0;j<m.geometry.attributes.position.count;j++)low=Math.min(low,m.getVertexPosition(j,v).applyMatrix4(m.matrixWorld).y);});return low;};
   const restFloor=worldFloor();w.play();
   let scaleError=0,rotationTravel=0,groundDrift=0;
   for(let i=0;i<120;i++){
    w.update(1/60);scaleError=Math.max(scaleError,...e.visual.scale.toArray().map(v=>Math.abs(v-1)));rotationTravel=Math.max(rotationTravel,e.visual.quaternion.angleTo(rotation));
    if(w.kind!=='stride'&&i%20===0)groundDrift=Math.max(groundDrift,Math.abs(worldFloor()-restFloor));
   }
   const patch=w.locomotion.patch;view.scene.updateMatrixWorld(true);
   const centre=patch.getWorldPosition(e.root.position.clone()),figureCentre=e.visual.getWorldPosition(e.root.position.clone());
   const patchOffset=Math.hypot(centre.x-figureCentre.x,centre.z-figureCentre.z);
   w.stop();for(let i=0;i<30;i++)w.update(1/60);
   result.push({character:e.character,side:e.side,kind:w.kind,scaleError,rotationTravel,groundDrift,patchOffset,reset:e.visual.position.distanceTo(position)<1e-10&&e.visual.quaternion.angleTo(rotation)<1e-7&&!patch.visible&&!w.action.isRunning()});
  }return result;
 });
 check('All 32 figures keep constant scale during locomotion',cast.length===32&&cast.every(e=>e.scaleError===0),cast);
 check('Every flow/shuffle figure moves and keeps its supporting edge grounded',cast.filter(e=>e.kind!=='stride').every(e=>e.rotationTravel>.005&&e.groundDrift<1e-6));
 check('Contact patches stay beneath their own figure in both armies',cast.every(e=>e.patchOffset<.65),{maxOffset:Math.max(...cast.map(e=>e.patchOffset))});
 check('Stop restores original transforms and clears motion effects',cast.every(e=>e.reset));
 await p.evaluate(()=>study.setWalking(true));await p.waitForTimeout(400);await p.screenshot({path:out+'/captures/motion-cast.png'});
 await p.evaluate(()=>study.setCharacter('queen'));
 const travel=await p.evaluate(()=>{
  study.animate('move');const samples=[];
  for(let frame=0;frame<300;frame++){
   study.stepAction(1/60);for(const e of study.entries)e.walk.update(1/60);
   if(frame%30===0)samples.push(study.entries.map(e=>({z:e.root.position.z-e.base.z,y:e.root.position.y-e.base.y,scale:e.visual.scale.y})));
  }
  return {samples,running:study.running,end:study.entries.map(e=>({z:e.root.position.z-e.base.z,playing:e.walk.action.isRunning()}))};
 });
 check('Travel advances monotonically, stays on the board and finishes at its destination',!travel.running&&travel.end.every(e=>Math.abs(e.z-.65)<1e-8&&!e.playing)&&travel.samples.every((row,i)=>row.every((e,j)=>e.y===0&&e.scale===1&&(i===0||e.z>=travel.samples[i-1][j].z))),travel);
 await p.screenshot({path:out+'/captures/motion-queen-arrival.png'});
 await p.locator('#reset').click();check('Reset restores the original squares',await p.evaluate(()=>study.entries.every(e=>e.root.position.distanceTo(e.base)<1e-10)));
 await p.selectOption('#motion-style','shuffle');await p.reload();await p.waitForFunction(()=>window.study);
 check('Motion choice survives URL reload',await p.evaluate(()=>study.motionChoice==='shuffle'&&study.entries.every(e=>e.walk.kind==='shuffle')));
 await p.selectOption('#cadence','stopmotion');
 const cadence=await p.evaluate(()=>{const e=study.entries[0],w=e.walk;w.play();w.update(1/120);const first=w.action.time;for(let i=0;i<10;i++)w.update(1/120);const next=w.action.time;w.reset();return {first,next};});
 check('12 fps motion holds poses between steps',cadence.first===0&&cadence.next>=1/12,cadence);
 await p.setViewportSize({width:390,height:844});await p.evaluate(()=>study.setCharacter('beast'));await p.locator('#move').click();await p.waitForTimeout(1300);await p.screenshot({path:out+'/captures/motion-mobile.png'});
 check('Phone preview stays within the viewport',await p.evaluate(()=>document.documentElement.scrollWidth===innerWidth));
 check('No console, shader or page errors',errors.length===0,errors);
}finally{await writeFile(out+'/locomotion-verification.json',JSON.stringify({checks,errors},null,2)+'\n');await browser.close();}
console.log(JSON.stringify({checks:checks.length,passed:checks.filter(c=>c.ok).length,errors}));
