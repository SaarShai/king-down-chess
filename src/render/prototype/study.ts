/** THROWAWAY: Which representation preserves King Down's identity at small pixel sizes?
 * Five candidates on the existing route (?study&variant=rebuilt), committed only to the study branch.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { BoardRenderer } from '../renderer';
import { STYLES } from '../styles';
import { loadModels } from '../voxels';
import { fromFen } from '../../rules/setup';
import { PieceContourPass, type ContourMode } from './PieceContourPass';
import './study.css';

const variants=['baseline','sculpt','rebuilt','sprites','quiet'] as const;
type Variant=typeof variants[number];
const names=['Existing Dungeon','Original sculpts','Rebuilt for pixels','16-angle sprites','QuietHours Canvas'];
const copy=[
 'The shipped voxel conversion and Dungeon lighting. Use this as the reference for lost detail.',
 'Six original sculptures, simplified to about 6,500 triangles each. Colour regions are provisional.',
 'New Guard and Archer geometry made for small pixels. Broader planes, larger gaps and deliberate accent regions.',
 'The rebuilt pair baked into sixteen viewing angles. World movement stays smooth; the picture changes in steps.',
 'Actual QuietHours Canvas projection, drawing, shading and ink quantizer. Fixed isometric angle; drag pans.'
];
const params=new URLSearchParams(location.search);
let variant:Variant=variants.includes(params.get('variant') as Variant)?params.get('variant') as Variant:'rebuilt';
let pixel=[.5,1,1.5,2,3,4].includes(Number(params.get('pixels')))?Number(params.get('pixels')):1.5;
let contourMode:ContourMode=['off','silhouette','adaptive'].includes(params.get('contours')??'')?params.get('contours') as ContourMode:'adaptive';
let running=false, orbit=false, motion=0, lastFrame=0;
let epoch=0;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const source=import.meta.env.BASE_URL+'prototype/';
document.title='King Down · Graphics study';
document.body.innerHTML=`<main class="study"><header><div class="wordmark">KING DOWN<span>GRAPHICS STUDY · 02</span></div><div class="header-note">Two familiar characters. Five ways to see them.</div><a href="?">Open game ↗</a></header><section class="stage"><div id="stage-board"></div><canvas id="quiet-canvas" hidden></canvas><div class="scene-label"><span id="mode-label"></span><span id="view-hint">Drag to orbit · scroll to zoom</span></div><div class="armies"><span><i class="ivory"></i>Alabaster</span><span><i class="ink"></i>Ink blue</span></div></section><aside><div class="eyebrow">THE QUESTION</div><h1 id="variant-title"></h1><p id="description"></p><div class="controls"><label>Pixel size <select id="pixels"><option value="0.5">0.5 px · double detail</option><option value="1">1 px · fine</option><option value="1.5">1.5 px · balanced</option><option value="2">2 px · chunky</option><option value="3">3 px · coarse</option><option value="4">4 px · stress test</option></select></label><label>Scene <select id="scene"><option value="pair">Guard + Archer</option><option value="overlap">Overlap close-up</option><option value="six">Six-piece lineup</option><option value="board">Full board · 32 pieces</option></select></label><label>Contours <select id="contours"><option value="off">Off</option><option value="silhouette">Even silhouette</option><option value="adaptive">Overlap aware</option></select></label><p class="control-note" id="contour-note"></p><label>Palette <select id="palette"><option value="colour">Army + type accents</option><option value="gray">Grayscale check</option></select></label><div class="button-row"><button id="move">Move</button><button id="ability">Ability</button></div><div class="button-row"><button id="spin">Rotate</button><button id="reset">Reset view</button></div></div><div class="detail"><b>Guard</b><p>Keep the raised shoulder wings, recessed helmet and heavy fists. Steel blue + mint accents.</p><b>Archer</b><p>Keep the pointed hood, split skirt and <em>two wrist crossbows</em>. Green + ochre accents.</p></div><details><summary>Compare the source artwork</summary><a href="${source}source-guides/guard_color_ref.jpg" target="_blank">Guard colour guide ↗</a><a href="${source}source-guides/Archer_color_ref.jpg" target="_blank">Archer colour guide ↗</a></details><p class="limits" id="limits"></p><output id="stats">Loading study assets…</output></aside><nav class="switcher" aria-label="Rendering candidates"><button id="prev" aria-label="Previous option">←</button><div class="tabs">${variants.map((v,i)=>`<button data-variant="${v}"><span>0${i+1}</span>${names[i]}</button>`).join('')}</div><button id="next" aria-label="Next option">→</button></nav></main>`;
const el=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
// Access to existing renderer internals is intentional and isolated to this throwaway study.
const view:any=new BoardRenderer(el('stage-board'));
(window as any).view=view;
view.renderer.setAnimationLoop(null);
view.controls.enableDamping=false;
view.controls.minZoom=.6;view.controls.maxZoom=5;
const contourPass=new PieceContourPass(view.scene,view.camera);
view.composer.insertPass(contourPass,1);
el<HTMLSelectElement>('pixels').value=String(pixel);el<HTMLSelectElement>('contours').value=contourMode;
const quiet=el<HTMLCanvasElement>('quiet-canvas');
const loader=new GLTFLoader();
const models=new Map<string,THREE.Group>();
const types:Record<number,string>={1:'pawn',2:'knight',3:'bishop',6:'king',7:'archer',9:'guard'};
const accents:Record<string,[number,number]>={guard:[0x5082ab,0xb8efd6],archer:[0x718b3c,0xdaab60],pawn:[0xe8d7af,0xe8d7af],knight:[0xb84939,0xe5af5d],bishop:[0x92567e,0xefd388],king:[0xc9a452,0x8ec8cb]};
const palettes=[{army:0xdcc9a2,shade:0x958365,light:0xf2e2c0,ink:0x514638},{army:0x485875,shade:0x28374c,light:0x839abc,ink:0x192335}];
const matCache=new Map<string,THREE.Material>();
const toonSteps=new THREE.DataTexture(new Uint8Array([100,160,214,255]),4,1,THREE.RedFormat);toonSteps.needsUpdate=true;toonSteps.minFilter=toonSteps.magFilter=THREE.NearestFilter;
function material(role:string,type:string,side:number):THREE.Material {
 const key=`${role}:${type}:${side}`;if(matCache.has(key))return matCache.get(key)!;
 const pair=accents[type]??accents.guard;
 const color=role==='accent1'?pair[0]:role==='accent2'?pair[1]:(palettes[side] as any)[role]??palettes[side].army;
 const m=new THREE.MeshToonMaterial({color,gradientMap:toonSteps});m.name=role;matCache.set(key,m);return m;
}
function visual(name:string,side:number,rebuilt:boolean):THREE.Group {
 const key=(rebuilt&&(name==='guard'||name==='archer')?'rebuilt-':'original-')+name;
 const g=clone(models.get(key)!) as THREE.Group;
 g.traverse(o=>{if((o as THREE.Mesh).isMesh){const m=o as THREE.Mesh;const mats=Array.isArray(m.material)?m.material:[m.material];const replaced=mats.map(x=>material(x.name,name,side));m.material=Array.isArray(m.material)?replaced:replaced[0];m.castShadow=false;m.receiveShadow=false;}});
 g.userData.modelKey=key;return g;
}
await loadModels('/');
await Promise.all(['rebuilt-guard','rebuilt-archer',...Object.values(types).map(x=>'original-'+x)].map(async key=>{models.set(key,(await loader.loadAsync(source+'models/'+key+'.glb')).scene);}));
// QuietHours engine subset is MIT; original license and exact provenance are bundled.
for(const file of ['core','palette','camera','draw','light'])await new Promise<void>((resolve,reject)=>{const s=document.createElement('script');s.src=source+'quiet-hours/'+file+'.js';s.onload=()=>resolve();s.onerror=reject;document.head.append(s);});
const QH:any=(window as any).QH;
// Add the study's colour ramps before the unmodified quantizer builds its lookup table.
for(const [side,pal] of palettes.entries())for(const [role,color] of Object.entries(pal)){const c=new THREE.Color(color);const a=c.getHex();QH.M[`study_${side}_${role}`]=[(a>>16)&255,(a>>8)&255,a&255];}
for(const [name,pair] of Object.entries(accents))for(let i=0;i<2;i++){const c=pair[i];QH.M[`type_${name}_${i}`]=[(c>>16)&255,(c>>8)&255,c&255];}
await new Promise<void>((resolve,reject)=>{const s=document.createElement('script');s.src=source+'quiet-hours/inks.js';s.onload=()=>resolve();s.onerror=reject;document.head.append(s);});

type Entry={sq:number,type:string,side:number,root:THREE.Group,visual:THREE.Group|THREE.Mesh,base:THREE.Vector3};
let entries:Entry[]=[];
let sceneMode=['pair','overlap','six','board'].includes(params.get('scene')??'')?params.get('scene')!:'pair';
el<HTMLSelectElement>('scene').value=sceneMode;
const pairFen='8/8/3ga3/8/8/3GA3/8/8 w - - 0 1';
const overlapFen='8/8/8/3gG3/3aA3/8/8/8 w - - 0 1';
const sixFen='8/8/pngabk2/8/8/PNGABK2/8/8 w - - 0 1';
const boardFen='nagkkgan/pppppppp/8/8/8/8/PPPPPPPP/NAGKKGAN w - - 0 1'; // visual stress arrangement; not a playable game
let pos=fromFen(pairFen);
const atlasCache=new Map<string,{texture:THREE.CanvasTexture,w:number,h:number}>();
let atlasBytes=0;
async function atlas(name:string,side:number):Promise<{texture:THREE.CanvasTexture,w:number,h:number}> {
 const key=name+side;if(atlasCache.has(key))return atlasCache.get(key)!;
 const cell=160,cols=4,rows=4;
 const cv=document.createElement('canvas');cv.width=cell*cols;cv.height=cell*rows;const ctx=cv.getContext('2d')!;
 const scene=new THREE.Scene(),model=visual(name,side,true);scene.add(model);
 scene.add(new THREE.HemisphereLight(0xfff6e4,0x4a5b72,1.8));const sun=new THREE.DirectionalLight(0xffffff,2.1);sun.position.set(-3,8,5);scene.add(sun);
 const cam=new THREE.OrthographicCamera(-.91,.91,.91,-.91,.1,20);
 const r=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});r.setSize(cell,cell);r.setClearColor(0,0);
 const target=new THREE.Vector3(0,.71,0);
 for(let i=0;i<16;i++){
  const a=i*Math.PI*2/16;cam.position.set(Math.sin(a)*5,6.5,Math.cos(a)*5).add(target);cam.lookAt(target);r.render(scene,cam);ctx.drawImage(r.domElement,(i%cols)*cell,Math.floor(i/cols)*cell);
 }
 r.dispose();r.forceContextLoss();
 const texture=new THREE.CanvasTexture(cv);texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=THREE.NearestFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;
 // No mipmaps in this compact atlas study: padding is needed before enabling them.
 texture.generateMipmaps=false;texture.minFilter=THREE.NearestFilter;texture.needsUpdate=true;
 const result={texture,w:1.82,h:1.82};atlasCache.set(key,result);atlasBytes+=cv.width*cv.height*4;return result;
}
async function sprite(name:string,side:number):Promise<THREE.Mesh>{
 const a=await atlas(name,side);const tex=a.texture.clone();tex.repeat.set(.25,.25);tex.needsUpdate=true;
 const mat=new THREE.MeshBasicMaterial({map:tex,alphaTest:.3,side:THREE.DoubleSide});
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(a.w,a.h),mat);
 mesh.position.y=.71;mesh.userData.frame=-1;return mesh;
}
function clearStudyPieces(){
 for(const e of entries)if((e.visual as THREE.Mesh).isMesh){const m=e.visual as THREE.Mesh;m.geometry.dispose();const mat=m.material as THREE.MeshBasicMaterial;mat.map?.dispose();mat.dispose();}
 entries=[];
}
function resetCamera(){
 const focus=sceneMode==='board'?new THREE.Vector3(0,.3,0):new THREE.Vector3(sceneMode==='six'?-1:.0,.35,0);
 view.controls.target.copy(focus);
 view.camera.position.copy(focus).add(sceneMode==='overlap'?new THREE.Vector3(2.7,4.6,9.5):new THREE.Vector3(6.2,9.0,8.6));
 view.camera.zoom=1;view.camera.updateProjectionMatrix();view.controls.update();view.camera.updateMatrixWorld(true);view.scene.updateMatrixWorld(true);
 const boxes=[new THREE.Box3().setFromObject(view.frame3d),...entries.map(e=>new THREE.Box3().setFromObject(e.visual))];
 let extent=0;for(const b of boxes)for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z]){const p=new THREE.Vector3(x,y,z).project(view.camera);extent=Math.max(extent,Math.abs(p.x),Math.abs(p.y));}
 view.camera.zoom=Math.min(2.3,.85/Math.max(.1,extent));view.camera.updateProjectionMatrix();qPan={x:0,y:0};qZoom=1;
}
let qPan={x:0,y:0},qZoom=1;
async function apply(){
 const id=++epoch;running=false;motion=0;clearStudyPieces();view.tweens.flush();
 const i=variants.indexOf(variant);el('variant-title').textContent=names[i];el('description').textContent=copy[i];el('mode-label').textContent=`0${i+1} / ${names[i]}`;
 document.querySelectorAll('[data-variant]').forEach(x=>x.classList.toggle('active',(x as HTMLElement).dataset.variant===variant));
 syncUrl();
 const isQuiet=variant==='quiet';quiet.hidden=!isQuiet;el('stage-board').style.visibility=isQuiet?'hidden':'visible';
 el('view-hint').textContent=isQuiet?'Fixed 2:1 isometric · drag to pan · scroll to zoom':variant==='sprites'?'Drag to orbit · 16 views · elevation locked':'Drag to orbit · scroll to zoom';
 el<HTMLButtonElement>('spin').disabled=isQuiet;el<HTMLSelectElement>('scene').querySelector<HTMLOptionElement>('[value=overlap]')!.disabled=isQuiet;el<HTMLSelectElement>('scene').querySelector<HTMLOptionElement>('[value=six]')!.disabled=isQuiet;
 el<HTMLSelectElement>('scene').querySelector<HTMLOptionElement>('[value=board]')!.disabled=isQuiet;
 if(isQuiet&&sceneMode!=='pair'){sceneMode='pair';el<HTMLSelectElement>('scene').value='pair';syncUrl();}
 const canContour=variant!=='baseline'&&!isQuiet;contourPass.enabled=canContour;view.pixelPass.enabled=!canContour;contourPass.mode=contourMode;
 el<HTMLSelectElement>('contours').disabled=!canContour;
 el('contour-note').textContent=canContour?'One thin contour per figure. Overlap aware strengthens shared edges and adjusts ink to the surface brightness.':'Contour comparison is available on Original sculpts, Rebuilt and Sprites.';
 el('limits').textContent=isQuiet?'Canvas study: rebuilt pair only. Palette extended for the two armies. Painter sorting can misorder intersecting faces; this is not a production fallback.':variant==='sprites'?'One idle pose per angle; movement and effects animate in world space. Elevation is locked to the bake. No interpolated pose animation.':variant==='sculpt'?'Simplified original geometry with provisional colour zones. This is not a finished repaint of the source sculpts.':variant==='baseline'?'Existing voxel models and Dungeon style, placed on the same comparison board. This scene tests appearance, not chess rules.':'Only Guard and Archer are rebuilt. Other pieces, when shown, are original sculpt controls. This scene tests appearance, not chess rules.';
 pos=fromFen(sceneMode==='board'?boardFen:sceneMode==='six'?sixFen:sceneMode==='overlap'?overlapFen:pairFen);
 const style=variant==='baseline'?STYLES.dungeonVoxel:{...STYLES.cel,outline:false,pixelSize:pixel,pieceScale:1,tiles:'flat' as const,shadow:true,lights:'bright' as const};
 view.applyStyle(style);view.rebuild(pos);
 for(const tile of view.tiles){const f=tile.userData.sq%8,r=Math.floor(tile.userData.sq/8);tile.visible=sceneMode==='board'||(r>=2&&r<=5&&(sceneMode==='six'?f<6:f>=2&&f<=5));}
 view.frame3d.scale.set(sceneMode==='board'?1:sceneMode==='six'?6.35/8.9:4.35/8.9,1,sceneMode==='board'?1:4.35/8.9);view.frame3d.position.x=sceneMode==='six'?-1:0;
 view.setLabels(false);view.setCoords(false);view.setPalette(false);applyPixelSize();
 view.setEdges(variant==='baseline'?.05:0,variant==='baseline'?.15:0);
 view.controls.minPolarAngle=variant==='sprites'?Math.atan2(5,6.5):.25;view.controls.maxPolarAngle=variant==='sprites'?Math.atan2(5,6.5):1.25;
 if(variant!=='baseline'){
  view.scene.background=new THREE.Color(0x141c29);view.hemi.intensity=1.6;view.hemi.color.setHex(0xfff2d9);view.hemi.groundColor.setHex(0x59657b);view.sun.intensity=2.0;
  view.sun.position.set(-4,10,6);
  for(const tile of view.tiles){const sq=tile.userData.sq;tile.material.map=null;tile.material.color.setHex(((sq%8+Math.floor(sq/8))%2)?0xb9b2a0:0x596470);tile.material.needsUpdate=true;}
  view.frame3d.material.map=null;view.frame3d.material.color.setHex(0x2d3948);view.frame3d.material.needsUpdate=true;
 }
 for(const [sq,g] of view.pieces as Map<number,THREE.Group>){
  const type=types[g.userData.code&15];const side=g.userData.code>>4;let model:any=g.children[0];
  if(variant!=='baseline'&&type){
   // Only replace the figure; keep the renderer's ground shadow and label.
   g.remove(model);
   model=variant==='sprites'?await sprite(type,side):visual(type,side,variant!=='sculpt');
   if(id!==epoch)return;
   g.add(model);g.userData.sprite=false;
  }
  entries.push({sq,type,side,root:g,visual:model,base:g.position.clone()});
 }
 contourPass.setPieces(entries.map(e=>e.visual));resetCamera();
 // Candidate styles use one beauty draw plus an optional piece-ID draw; baseline retains its original pass.
 view.debris.mesh.visible=false;
 rebuildCanvas();updateStats();
}
function updateStats(){
 let tris=0;for(const e of entries)e.visual.traverse((o:any)=>{if(o.isMesh)tris+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;});
 el('stats').textContent=`${entries.length} pieces · ${Math.round(tris).toLocaleString()} figure triangles${variant==='sprites'?` · ${(atlasBytes/1048576).toFixed(1)} MiB atlas texels`:''}\n${variant==='quiet'?'Canvas':variant==='baseline'?'Original pixel pass':contourMode==='off'?'1 scene draw':'2 scene draws · beauty + piece IDs'} · no hardware FPS claim`;
}
function applyPixelSize(){
 // Keep the extra samples in the output canvas; a CSS-sized canvas would discard them.
 const ratio=pixel<1?2:1;
 view.renderer.setPixelRatio(ratio);view.composer.setPixelRatio(ratio);
 view.setPixelSize(pixel*ratio);contourPass.setPixelSize(pixel*ratio);
}
function syncUrl(){const url=new URL(location.href);url.searchParams.set('variant',variant);url.searchParams.set('scene',sceneMode);url.searchParams.set('pixels',String(pixel));url.searchParams.set('contours',contourMode);history.replaceState({},'',url);}
function choose(v:Variant){variant=v;return apply();}
document.querySelectorAll<HTMLButtonElement>('[data-variant]').forEach(b=>b.onclick=()=>choose(b.dataset.variant as Variant));
const cycle=(d:number)=>choose(variants[(variants.indexOf(variant)+d+variants.length)%variants.length]);
el('prev').onclick=()=>cycle(-1);el('next').onclick=()=>cycle(1);
addEventListener('keydown',e=>{if((e.target as HTMLElement).closest('input,select,textarea,[contenteditable]'))return;if(e.key==='ArrowLeft')cycle(-1);if(e.key==='ArrowRight')cycle(1);});
el<HTMLSelectElement>('pixels').onchange=e=>{pixel=Number((e.target as HTMLSelectElement).value);applyPixelSize();resizeQuiet();syncUrl();};
el<HTMLSelectElement>('scene').onchange=e=>{sceneMode=(e.target as HTMLSelectElement).value;void apply();};
el<HTMLSelectElement>('contours').onchange=e=>{contourMode=(e.target as HTMLSelectElement).value as ContourMode;contourPass.mode=contourMode;syncUrl();updateStats();};
el<HTMLSelectElement>('palette').onchange=e=>{const gray=(e.target as HTMLSelectElement).value==='gray';el('stage-board').style.filter=gray?'grayscale(1)':'';quiet.style.filter=gray?'grayscale(1)':'';};
el('reset').onclick=()=>{orbit=false;el('spin').textContent='Rotate';resetCamera();};
el('spin').onclick=()=>{orbit=!orbit;el('spin').textContent=orbit?'Stop rotation':'Rotate';};
let action:'move'|'ability'='move';
function animate(which:'move'|'ability'){if(running)return;action=which;running=true;motion=0;}
el('move').onclick=()=>animate('move');el('ability').onclick=()=>animate('ability');
// Projectiles and impact rings stay in world space for the mesh and sprite approaches.
const bolt=new THREE.Mesh(new THREE.ConeGeometry(.045,.35,4),new THREE.MeshBasicMaterial({color:0xecc279}));bolt.rotation.x=Math.PI/2;bolt.visible=false;view.world.add(bolt);
const ring=new THREE.Mesh(new THREE.RingGeometry(.40,.47,32),new THREE.MeshBasicMaterial({color:0x9ed7c7,transparent:true,depthWrite:false,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.visible=false;view.world.add(ring);
function stepAction(dt:number){
 if(!running)return;motion+=dt;const dur=action==='move'?1.4:1.65,t=Math.min(1,motion/dur);
 const eased=(1-Math.cos(t*2*Math.PI))*.5;
 for(const e of entries){if(e.side!==0)continue;
  e.root.position.copy(e.base);
  if(action==='move'){
   e.root.position.z-=eased*(sceneMode==='board'?1:1.05);e.root.position.y=Math.sin(eased*Math.PI)*(e.type==='guard'?.09:.30);
   // A visual-only settle; the foot shadow is kept on the board.
   e.visual.rotation.z=Math.sin(t*2*Math.PI)*.035;
  }else if(e.type==='guard'){e.visual.rotation.x=-Math.sin(t*Math.PI)*.11;ring.visible=true;ring.position.copy(e.base).setY(.025);ring.scale.setScalar(.9+eased*.45);(ring.material as THREE.MeshBasicMaterial).opacity=Math.sin(t*Math.PI)*.85;}
  else if(e.type==='archer'){
   e.visual.rotation.x=-Math.sin(t*Math.PI)*.065;
   const b=(t-.22)/.5;bolt.visible=b>=0&&b<=1;bolt.position.copy(e.base).add(new THREE.Vector3(.35,.85,-Math.max(0,b)*3.4));
  }
  for(const child of e.root.children)if((child as THREE.Mesh).geometry===view.shadowGeo){child.position.y=.02-e.root.position.y;child.scale.setScalar(.75+e.root.position.y*.3);}
 }
 if(t>=1){running=false;bolt.visible=ring.visible=false;for(const e of entries){e.root.position.copy(e.base);e.visual.rotation.x=e.visual.rotation.z=0;}}
}
// Fixed-view Canvas option: reuse QH's camera, face drawing/shading and quantizer.
// This small adapter projects the same low-poly model triangles, with painter-order limits.
type Face={p:THREE.Vector3[],normal:THREE.Vector3,color:number[]};
let canvasModels=new Map<Entry,Face[]>();
function rebuildCanvas(){view.scene.updateMatrixWorld(true);canvasModels.clear();if(variant!=='quiet')return;
 for(const e of entries){const faces:Face[]=[];e.visual.updateMatrixWorld(true);const inverse=e.root.matrixWorld.clone().invert();
  e.visual.traverse((o:any)=>{if(!o.isMesh)return;const geo=o.geometry,pa=geo.attributes.position,ix=geo.index;const count=ix?.count??pa.count;const tr=new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld);const mats=Array.isArray(o.material)?o.material:[o.material];
   for(let j=0;j<count;j+=3){const group=geo.groups.find((g:any)=>j>=g.start&&j<g.start+g.count);const mat=mats[group?.materialIndex??0];const p=[0,1,2].map(k=>new THREE.Vector3().fromBufferAttribute(pa,ix?ix.getX(j+k):j+k).applyMatrix4(tr));const normal=new THREE.Vector3().subVectors(p[1],p[0]).cross(new THREE.Vector3().subVectors(p[2],p[0])).normalize();const c=mat.color.clone().convertLinearToSRGB();faces.push({p,normal,color:[c.r*255,c.g*255,c.b*255]});}
  });canvasModels.set(e,faces);
 }
 resizeQuiet();
}
function resizeQuiet(){const r=el('stage-board').getBoundingClientRect();quiet.width=Math.max(1,Math.round(r.width/pixel));quiet.height=Math.max(1,Math.round(r.height/pixel));}
new ResizeObserver(()=>{resizeQuiet();if(entries.length)resetCamera();}).observe(el('stage-board'));
let drag:{x:number,y:number}|null=null;
quiet.onpointerdown=e=>{quiet.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY};};quiet.onpointermove=e=>{if(drag){qPan.x+=(e.clientX-drag.x)/pixel;qPan.y+=(e.clientY-drag.y)/pixel;drag={x:e.clientX,y:e.clientY};}};quiet.onpointerup=()=>drag=null;quiet.onpointercancel=()=>drag=null;
quiet.onwheel=e=>{e.preventDefault();qZoom=THREE.MathUtils.clamp(qZoom*Math.exp(-e.deltaY*.001),.6,2.8);};
function renderQuiet(){
 const ctx=quiet.getContext('2d',{willReadFrequently:true})!,w=quiet.width,h=quiet.height;QH.draw.use(ctx);
 ctx.fillStyle='#101d2d';ctx.fillRect(0,0,w,h);const cam=QH.cam.cam;cam.s=Math.min(w/10,h/8)*qZoom;cam.x=w*.5+qPan.x;cam.y=h*.56+qPan.y;QH.cam.at(0,0,0);
 // A small raised four-by-four board makes this a fixed-angle piece study.
 for(let d=-4;d<=4;d++)for(let x=-2;x<2;x++){const z=d-x;if(z< -2||z>=2)continue;QH.draw.box(x,z,-.18,1,1,.18,((x+z)&1)?[123,139,149]:[190,183,160],{edgeCol:[32,44,58]});}
 const all:{p:number[][],depth:number,fill:string}[]=[];
 for(const [e,faces] of canvasModels){
  const x=e.base.x*1.25,z=e.base.z*.65;const dx=e.root.position.x-e.base.x,dz=e.root.position.z-e.base.z,dy=e.root.position.y;
  QH.draw.disc(x,z,.006,.35,'rgba(5,12,22,.40)',12);
  // root side-facing is applied here (the cached coordinates are root-local).
  const rot=e.side?Math.PI:0;
  const cos=Math.cos(rot),sin=Math.sin(rot);
  for(const f of faces){const n=new THREE.Vector3(f.normal.x*cos+f.normal.z*sin,f.normal.y,-f.normal.x*sin+f.normal.z*cos);if(n.x+n.y+n.z<=0)continue;
   const p=f.p.map(v=>[v.x*cos+v.z*sin+x+dx,-v.x*sin+v.z*cos+z+dz,v.y+dy]);
   const factor=THREE.MathUtils.clamp(.72+n.y*.30-n.x*.09+n.z*.09,.46,1.08);
   all.push({p,depth:p.reduce((s,a)=>s+a[0]+a[1]+a[2],0)/3,fill:QH.draw.sh(f.color,factor)});
  }
 }
 all.sort((a,b)=>a.depth-b.depth);for(const f of all)QH.draw.poly(f.p,f.fill);
 if(running&&action==='ability'){QH.light.begin();QH.light.glow(.6,1,.75,.7,[231,174,89],Math.sin(motion/1.65*Math.PI)*.20);QH.light.end();}
 const img=ctx.getImageData(0,0,w,h);QH.inks.quantise(img,w,h,{spread:3,grain:1});ctx.putImageData(img,0,0);
}
function updateSprites(){
 if(variant!=='sprites')return;
 for(const e of entries){const mesh=e.visual as THREE.Mesh;const angle=Math.atan2(view.camera.position.x-view.controls.target.x,view.camera.position.z-view.controls.target.z)-(e.side?Math.PI:0);let frame=(Math.round(angle/(Math.PI*2)*16)+32)%16;
  const old=mesh.userData.frame as number;
  // A small dead band holds a frame at sector boundaries instead of switching on tiny movements.
  if(old>=0){const centre=old*Math.PI*2/16;const delta=Math.atan2(Math.sin(angle-centre),Math.cos(angle-centre));if(Math.abs(delta)<Math.PI/16+.025)frame=old;}
  mesh.userData.frame=frame;
  const tex=(mesh.material as THREE.MeshBasicMaterial).map!;tex.offset.set((frame%4)*.25,(3-Math.floor(frame/4))*.25);
  mesh.quaternion.copy(e.root.quaternion.clone().invert().multiply(view.camera.quaternion));
 }
}
function frame(now:number){const dt=Math.min(.04,(now-lastFrame)/1000||0);lastFrame=now;stepAction(dt);
 if(orbit&&!reduced&&variant!=='quiet'){const off=view.camera.position.clone().sub(view.controls.target);off.applyAxisAngle(new THREE.Vector3(0,1,0),dt*.27);view.camera.position.copy(view.controls.target).add(off);}
 view.controls.update();view.scene.updateMatrixWorld();updateSprites();
 if(variant==='quiet')renderQuiet();else view.composer.render();
 requestAnimationFrame(frame);
}
await apply();requestAnimationFrame(frame);
(window as any).study={choose,apply,get variant(){return variant},get entries(){return entries},get running(){return running},models,atlasCache,animate,view,contourPass,get scene(){return sceneMode},setScene:(mode:string)=>{sceneMode=mode;el<HTMLSelectElement>('scene').value=mode;return apply();},get pixel(){return pixel}};
