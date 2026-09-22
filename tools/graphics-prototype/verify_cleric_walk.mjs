/** Bishop/Paladin: measure visible boot surfaces, not merely moving bones.
 * CLERIC_BASELINE=<git revision> runs the same checks on old assets as a negative control.
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
const out=process.env.CLERIC_CHECK_OUT||'docs/graphics-prototype/cleric-walk-verification';
await mkdir(out,{recursive:true});
const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],results=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
if(process.env.CLERIC_BASELINE)for(const key of ['bishop','paladin']){
 const body=execFileSync('git',['show',`${process.env.CLERIC_BASELINE}:public/prototype/models/rebuilt-${key}.glb`],{maxBuffer:10e6});
 await page.route(`**/rebuilt-${key}.glb`,route=>route.fulfill({contentType:'model/gltf-binary',body}));
}
try{
 for(const key of ['bishop','paladin'])for(const [look,cadence] of [['current','smooth'],['handmade','smooth'],['handmade','stopmotion']]){
  await page.goto(`http://localhost:5190/?study&variant=rebuilt&scene=character&character=${key}&pixels=0.5&contours=adaptive&look=${look}&cadence=${cadence}`);await page.waitForFunction(()=>window.study);
  const metrics=await page.evaluate(key=>{
   const e=study.entries[0],w=e.walk,meshes=[];w.reset();e.visual.updateMatrixWorld(true);e.visual.traverse(m=>{if(m.isSkinnedMesh)meshes.push(m);});
   const positions=()=>meshes.map(m=>{m.skeleton.update();const v=m.position.clone();return Array.from({length:m.geometry.attributes.position.count},(_,i)=>m.getVertexPosition(i,v).clone());});
   const rest=positions(),boots=[[],[]],calves=[[],[]],edges=[];
   const sample=(lists,k,i,v)=>lists[key==='bishop'?(v.x<.02?0:1):(v.x<-.1825?0:1)].push([k,i]);
   meshes.forEach((m,k)=>{
    rest[k].forEach((v,i)=>{
     if(key==='bishop' ? v.y<.07&&(v.x<-.13||(v.x>.07&&v.z>.165)) : v.y<.08)sample(boots,k,i,v);
     const x=key==='bishop'?(v.x<.02?-.05:.085):(v.x<-.1825?-.275:-.09),z=key==='bishop'?(v.x<.02?.005:.055):-.14;
     if(v.y>.12&&v.y<.24&&Math.hypot(v.x-x,v.z-z)<(key==='bishop'?.045:.065))sample(calves,k,i,v);
    });
    const index=m.geometry.index,n=index?index.count:rest[k].length;
    for(let i=0;i<n;i+=3)for(let j=0;j<3;j++){
     const a=index?index.getX(i+j):i+j,b=index?index.getX(i+(j+1)%3):i+(j+1)%3,A=rest[k][a],B=rest[k][b],length=A.distanceTo(B);
     if(length>.005)edges.push({k,a,b,length,boot:A.y<.08&&B.y<.08&&(key==='paladin'||(A.x<-.13&&B.x<-.13)||(A.z>.165&&B.z>.165&&A.x>.07&&B.x>.07))});
    }
   });
   const tracks=boots.map(()=>({z:[],y:[],calfZ:[]}));let minRatio=Infinity,maxRatio=0,maxBootStrain=0,minFloor=Infinity,maxContactError=0;const ratios=[];
   w.play();const dt=w.action.getClip().duration/192;
   for(let f=0;f<384;f++){
    w.update(dt);if(f<192||f%4!==3)continue;e.visual.updateMatrixWorld(true);const pose=positions();
    for(const edge of edges){const ratio=pose[edge.k][edge.a].distanceTo(pose[edge.k][edge.b])/edge.length;ratios.push(ratio);minRatio=Math.min(minRatio,ratio);maxRatio=Math.max(maxRatio,ratio);if(edge.boot)maxBootStrain=Math.max(maxBootStrain,Math.abs(ratio-1));}
    const heights=[];
    for(let side=0;side<2;side++){
     const refs=boots[side],baseFloor=Math.min(...refs.map(([k,i])=>rest[k][i].y)),floor=Math.min(...refs.map(([k,i])=>pose[k][i].y));
     tracks[side].z.push(refs.reduce((sum,[k,i])=>sum+pose[k][i].z,0)/refs.length);
     tracks[side].y.push(floor-baseFloor);heights.push(floor-baseFloor);minFloor=Math.min(minFloor,floor);
     tracks[side].calfZ.push(calves[side].reduce((sum,[k,i])=>sum+pose[k][i].z,0)/calves[side].length);
    }
    maxContactError=Math.max(maxContactError,Math.abs(Math.min(...heights)));
   }
   ratios.sort((a,b)=>a-b);
   const span=a=>Math.max(...a)-Math.min(...a),feet=tracks.map((t,i)=>({vertices:boots[i].length,calfVertices:calves[i].length,travel:span(t.z),lift:span(t.y),calfTravel:span(t.calfZ)}));
   let loopError=0;for(const t of w.action.getClip().tracks)for(let i=0;i<t.getValueSize();i++)loopError=Math.max(loopError,Math.abs(t.values[i]-t.values[t.values.length-t.getValueSize()+i]));
   w.reset();e.visual.updateMatrixWorld(true);const reset=positions();let resetError=0;for(let k=0;k<rest.length;k++)for(let i=0;i<rest[k].length;i++)resetError=Math.max(resetError,rest[k][i].distanceTo(reset[k][i]));
   return {feet,minRatio,maxRatio,p99:ratios[Math.floor(ratios.length*.99)],maxBootStrain,minFloor,maxContactError,loopError,resetError,armies:study.entries.length};
  },key);
  const checks={visibleBootsTakeFullSteps:metrics.feet.every(f=>f.vertices>5&&f.travel>.13&&f.lift>.03),lowerLegsFollow:metrics.feet.every(f=>f.calfVertices>5&&f.calfTravel>.065),shoesKeepTheirShape:metrics.maxBootStrain<.002,oneFootRemainsPlanted:metrics.minFloor>-.001&&metrics.maxContactError<.002,noTornOrCollapsedSurface:metrics.minRatio>.3&&metrics.maxRatio<2.5&&metrics.p99<1.2,loopAndReset:metrics.loopError<.0001&&metrics.resetError<.000001,bothArmies:metrics.armies===2};
  results.push({key,look,cadence,...metrics,checks});
  if(look==='handmade'&&cadence==='smooth')for(const angle of [0,Math.PI/2])for(const phase of [.06,.31,.56,.81]){
   await page.evaluate(({angle,phase})=>{
    const target=view.controls.target;view.camera.position.copy(target).add(target.clone().set(2,3.0,8).applyAxisAngle(view.camera.up,angle));view.controls.update();
    for(const e of study.entries){e.walk.reset();e.walk.play();const dt=e.walk.action.getClip().duration/192;for(let i=0;i<Math.round(192*(1+phase));i++)e.walk.update(dt);e.walk.active=false;e.visual.updateMatrixWorld(true);}view.composer.render();
   },{angle,phase});
   await page.screenshot({path:`${out}/${key}-${angle===0?'front':'side'}-${phase}.png`});
  }
 }
}finally{await browser.close();}
const passed=errors.length===0&&results.every(r=>Object.values(r.checks).every(Boolean));
await writeFile(`${out}/results.json`,JSON.stringify({passed,results,errors},null,2)+'\n');console.log(JSON.stringify({passed,results,errors},null,2));if(!passed)process.exitCode=1;
