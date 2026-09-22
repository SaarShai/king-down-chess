/** CPU verification of the shipped GLBs, including actual Three.js skinning. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { readFile, writeFile } from 'node:fs/promises';
globalThis.ProgressEvent ??= class { constructor(type, data) { Object.assign(this, data); } };
const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
loader.register(()=>({name:'SkipImageDecode',loadTexture:async()=>new THREE.Texture()}));
async function load(path){const b=await readFile(path);return loader.parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');}
const source=await load('docs/graphics-prototype/ogre-reconstruction/clay-refinement/ogre-repaired.glb');
const key=p=>p.toArray().map(x=>x.toFixed(5)).join(',');
const accepted=new Set();source.scene.traverse(m=>{if(m.isMesh){const p=new THREE.Vector3();for(let i=0;i<m.geometry.attributes.position.count;i++)accepted.add(key(p.fromBufferAttribute(m.geometry.attributes.position,i)));}});
const results=[];
for(const tier of ['rebuilt','board']){
 const {scene,animations}=await load(`public/prototype/models/${tier}-ogre.glb`),meshes=[];
 scene.traverse(m=>{if(m.isSkinnedMesh)meshes.push(m);});scene.updateMatrixWorld(true);
 const pose=()=>meshes.map(m=>{m.skeleton.update();return Array.from({length:m.geometry.attributes.position.count},(_,i)=>m.getVertexPosition(i,new THREE.Vector3()).applyMatrix4(m.matrixWorld));});
 const rest=pose(),edges=[],feet=[[],[]],hands=[[],[]];let restChanges=0,weightError=0,invalid=0;
 meshes.forEach((m,k)=>{
  const a=m.geometry.attributes,ix=m.geometry.index;
  for(let i=0;i<a.position.count;i++){
   const p=new THREE.Vector3().fromBufferAttribute(a.position,i);if(!accepted.has(key(p)))restChanges++;
   const total=[0,1,2,3].reduce((s,j)=>s+a.skinWeight.getComponent(i,j),0);weightError=Math.max(weightError,Math.abs(total-1));
   if(!Number.isFinite(total))invalid++;
   if(rest[k][i].y<.025)feet[rest[k][i].x<0?0:1].push({k,i});
   if(Math.abs(p.x)>.34&&p.y<-.07&&p.y>-.3)hands[p.x<0?0:1].push({k,i});
  }
  for(let i=0;i<ix.count;i+=3)for(let j=0;j<3;j++){
   const u=ix.getX(i+j),v=ix.getX(i+(j+1)%3),length=rest[k][u].distanceTo(rest[k][v]);
   if(length>.005)edges.push({k,u,v,length,rigid:rest[k][u].y>1.08&&rest[k][v].y>1.08});
  }
 });
 for(const clip of animations){
  const mixer=new THREE.AnimationMixer(scene),action=mixer.clipAction(clip);action.play();
  let minRatio=Infinity,maxRatio=0,minFloor=Infinity,maxContact=0,travel=0,handStrain=0,rigidError=0,worstLow,worstHigh;const ratios=[];
  for(let f=0;f<=60;f++){
   action.time=clip.duration*f/60;mixer.update(0);scene.updateMatrixWorld(true);const current=pose();
   for(const e of edges){const r=current[e.k][e.u].distanceTo(current[e.k][e.v])/e.length;
    if(r<minRatio){minRatio=r;worstLow={phase:f/60,at:rest[e.k][e.u].toArray()};}if(r>maxRatio){maxRatio=r;worstHigh={phase:f/60,at:rest[e.k][e.u].toArray()};}ratios.push(r);if(e.rigid)rigidError=Math.max(rigidError,Math.abs(r-1));}
   const floor=feet.map(list=>Math.min(...list.map(({k,i})=>current[k][i].y)));minFloor=Math.min(minFloor,...floor);maxContact=Math.max(maxContact,Math.min(...floor));
   for(const list of feet)for(const {k,i} of list)travel=Math.max(travel,current[k][i].distanceTo(rest[k][i]));
   for(const list of hands){const a=list[0];for(const b of list){const length=rest[a.k][a.i].distanceTo(rest[b.k][b.i]);if(length>.005)handStrain=Math.max(handStrain,Math.abs(current[a.k][a.i].distanceTo(current[b.k][b.i])/length-1));}}
  }
  mixer.stopAllAction();scene.updateMatrixWorld(true);const reset=pose();let resetError=0,loopError=0;
  for(let k=0;k<rest.length;k++)for(let i=0;i<rest[k].length;i++)resetError=Math.max(resetError,rest[k][i].distanceTo(reset[k][i]));
  for(const track of clip.tracks)for(let i=0;i<track.getValueSize();i++)loopError=Math.max(loopError,Math.abs(track.values[i]-track.values[track.values.length-track.getValueSize()+i]));
  ratios.sort((a,b)=>a-b);const p99=ratios[Math.floor(ratios.length*.99)];
  const ok=(tier==='board'||restChanges===0)&&invalid===0&&weightError<1e-5&&minRatio>.3&&maxRatio<2.5&&p99<1.25&&handStrain<.001&&rigidError<.001&&minFloor>-.002&&maxContact<.015&&resetError<1e-6&&loopError<1e-4&&(clip.name!=='Walk'||travel>.04);
  results.push({tier,clip:clip.name,ok,restChanges,weightError,invalid,minRatio,maxRatio,p99,handStrain,rigidError,minFloor,maxContact,travel,resetError,loopError,worstLow,worstHigh});
 }
}
const report={passed:results.every(r=>r.ok),results};await writeFile('docs/graphics-prototype/ogre-integration/asset-checks.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;
