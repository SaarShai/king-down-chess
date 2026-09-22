/** THROWAWAY: Which representation preserves King Down's identity at small pixel sizes?
 * Five candidates on the existing route (?study&variant=rebuilt), committed only to the study branch.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { BoardRenderer } from '../renderer';
import { STYLES } from '../styles';
import { loadModels } from '../voxels';
import { fromFen } from '../../rules/setup';
import { PieceContourPass, type ContourMode } from './PieceContourPass';
import { WalkPreview, type ClayCadence } from './WalkPreview';
import { CLAY_LOOK_COPY, CLAY_LOOK_LABELS, CLAY_LOOKS, type ClayLook, applyLookLighting, ensureSurfaceUv, materialForLook, softenClayNormals } from './ClayLook';
import { CAST, character, defaultCharacter } from './CastCatalog';
import { CapturePreview, CAPTURE_STYLES, CAPTURE_LABELS, CAPTURE_COPY, type CaptureStyle } from './CapturePreview';
import './study.css';

const variants=['baseline','sculpt','rebuilt','sprites','quiet'] as const;
type Variant=typeof variants[number];
const names=['Existing Dungeon','Original sculpts','Refined figures','16-angle sprites','QuietHours Canvas'];
const copy=[
 'The shipped voxel conversion and Dungeon lighting. Use this as the reference for lost detail.',
 'Six original sculptures, simplified to about 6,500 triangles each. Colour regions are provisional.',
 'Seventeen characters: the source-derived cast and the newly sculpted Ogre. Original silhouettes, one army colour and one identifying accent feature. Compare their articulated movement and two tactile clay looks.',
 'The rebuilt pair baked into sixteen viewing angles. World movement stays smooth; the picture changes in steps.',
 'Actual QuietHours Canvas projection, drawing, shading and ink quantizer. Fixed isometric angle; drag pans.'
];
const params=new URLSearchParams(location.search);
let variant:Variant=variants.includes(params.get('variant') as Variant)?params.get('variant') as Variant:'rebuilt';
let pixel=[.5,1,1.5,2,3,4].includes(Number(params.get('pixels')))?Number(params.get('pixels')):1.5;
let figureDetail=params.get('detail')==='blockout'?'blockout':'refined';
let contourMode:ContourMode=['off','silhouette','adaptive'].includes(params.get('contours')??'')?params.get('contours') as ContourMode:'adaptive';
let look:ClayLook=CLAY_LOOKS.includes(params.get('look') as ClayLook)?params.get('look') as ClayLook:'current';
let cadence:ClayCadence=params.get('cadence')==='stopmotion'?'stopmotion':'smooth';
let running=false, walking=false, orbit=false, motion=0, lastFrame=0;
let captureStyle:CaptureStyle=CAPTURE_STYLES.includes(params.get('capture') as CaptureStyle)?params.get('capture') as CaptureStyle:'burst';
let epoch=0;
type MeshQuality='auto'|'sculpt'|'board';
let meshQuality:MeshQuality=['sculpt','board'].includes(params.get('mesh')??'')?params.get('mesh') as MeshQuality:'auto';
let meshTier:'sculpt'|'board'='sculpt';
let switchingTier=false,applying=false,tierFailedAt=-1;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const source=import.meta.env.BASE_URL+'prototype/';
document.title='King Down · Graphics study';
document.body.innerHTML=`<main class="study"><header><div class="wordmark">KING DOWN<span>GRAPHICS STUDY · 04</span></div><div class="header-note">Seventeen characters. Sculpted, painted, brought to life.</div><a href="?">Open game ↗</a></header><section class="stage"><div id="stage-board"></div><canvas id="quiet-canvas" hidden></canvas><div class="scene-label"><span id="mode-label"></span><span id="view-hint">Drag to orbit · scroll to zoom</span></div><div class="armies"><span><i class="ivory"></i>Alabaster</span><span><i class="ink"></i>Ink blue</span></div></section><aside><div class="eyebrow">THE QUESTION</div><h1 id="variant-title"></h1><p id="description"></p><div class="controls"><label>Look <select id="look"><option value="current">Current refined</option><option value="plasticine">Polished plasticine</option><option value="handmade">Handmade clay</option></select></label><p class="control-note look-copy" id="look-copy"></p><label>Figure detail <select id="figure-detail"><option value="refined">Refined sculpture</option><option value="blockout">Earlier blockout</option></select></label><label>Mesh detail <select id="mesh-quality"><option value="auto">Automatic · board / close-up</option><option value="sculpt">Original sculpt</option><option value="board">Lighter board model</option></select></label><label>Clay motion <select id="cadence"><option value="smooth">Smooth · spring clay</option><option value="stopmotion">Stop-motion · 12 fps</option></select></label><p class="control-note" id="motion-note"></p><label>Pixel size <select id="pixels"><option value="0.5">0.5 px · double detail</option><option value="1">1 px · fine</option><option value="1.5">1.5 px · balanced</option><option value="2">2 px · chunky</option><option value="3">3 px · coarse</option><option value="4">4 px · stress test</option></select></label><label>Scene <select id="scene"><option value="pair">Guard + Archer</option><option value="overlap">Overlap close-up</option><option value="six">Six-piece lineup</option><option value="board">Full board · 32 pieces</option><option value="cast">All 17 designs · both armies</option><option value="character">Character close-up</option></select></label><label id="character-control">Character <select id="character">${CAST.map(c=>`<option value="${c.key}">${c.label}</option>`).join('')}</select></label><label>Contours <select id="contours"><option value="off">Off</option><option value="silhouette">Even silhouette</option><option value="adaptive">Overlap aware</option></select></label><p class="control-note" id="contour-note"></p><label>Palette <select id="palette"><option value="colour">Army + type accents</option><option value="gray">Grayscale check</option></select></label><button id="walk" aria-pressed="false">Walk in place</button><button id="poke">Poke / squish clay</button><p class="control-note" id="walk-note"></p><div class="button-row"><button id="move">Move</button><button id="ability">Ability</button></div><label>Capture finish <select id="capture-style">${CAPTURE_STYLES.map(c=>`<option value="${c}">${CAPTURE_LABELS[c]}</option>`).join('')}</select></label><p class="control-note" id="capture-note"></p><div class="button-row"><button id="capture-play">Preview capture</button><button id="capture-reset">Restore pieces</button></div><div class="button-row"><button id="spin">Rotate</button><button id="reset">Reset view</button></div></div><div class="detail" id="character-detail"><b>Guard</b><p>Keep the raised shoulder wings, recessed helmet and heavy fists. Steel blue on the shoulder plates; the rest stays in the army family.</p><b>Archer</b><p>Keep the pointed hood, split skirt and <em>two wrist crossbows</em>. Green on the hood; face, braid and crossbows stay in the army family.</p></div><details><summary>Compare the source artwork</summary><a href="${source}source-guides/guard_color_ref.jpg" target="_blank">Guard colour guide ↗</a><a href="${source}source-guides/Archer_color_ref.jpg" target="_blank">Archer colour guide ↗</a></details><p class="limits" id="limits"></p><output id="stats">Loading study assets…</output></aside><nav class="switcher" aria-label="Rendering candidates"><button id="prev" aria-label="Previous option">←</button><div class="tabs">${variants.map((v,i)=>`<button data-variant="${v}"><span>0${i+1}</span>${names[i]}</button>`).join('')}</div><button id="next" aria-label="Next option">→</button></nav></main>`;
const el=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
// Access to existing renderer internals is intentional and isolated to this throwaway study.
const view:any=new BoardRenderer(el('stage-board'));
(window as any).view=view;
// Keep the final colour-conversion pass from blending neighbouring pixel cells.
for(const target of [view.composer.renderTarget1,view.composer.renderTarget2])target.texture.minFilter=target.texture.magFilter=THREE.NearestFilter;
view.renderer.setAnimationLoop(null);
view.controls.enableDamping=false;
view.controls.minZoom=.6;view.controls.maxZoom=5;
const contourPass=new PieceContourPass(view.scene,view.camera);
view.composer.insertPass(contourPass,1);
el<HTMLSelectElement>('look').value=look;el<HTMLSelectElement>('figure-detail').value=figureDetail;el<HTMLSelectElement>('cadence').value=cadence;el<HTMLSelectElement>('pixels').value=String(pixel);el<HTMLSelectElement>('contours').value=contourMode;
el<HTMLSelectElement>('capture-style').value=captureStyle;
const quiet=el<HTMLCanvasElement>('quiet-canvas');
const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const models=new Map<string,THREE.Group>();
const types:Record<number,string>=Object.fromEntries(CAST.map(c=>[c.code,c.type]));
const accents:Record<string,[number,number]>={guard:[0x5082ab,0xb8efd6],archer:[0x718b3c,0xdaab60],pawn:[0xe8d7af,0xe8d7af],knight:[0xb84939,0xe5af5d],bishop:[0x92567e,0xefd388],king:[0xc9a452,0x8ec8cb]};
for(const c of CAST)accents[c.key]=[c.accent,c.accent];
const palettes=[{army:0xdcc9a2,shade:0x958365,light:0xf2e2c0,ink:0x514638},{army:0x485875,shade:0x28374c,light:0x839abc,ink:0x192335}];
const matCache=new Map<string,THREE.Material>();
const toonSteps=new THREE.DataTexture(new Uint8Array([100,160,214,255]),4,1,THREE.RedFormat);toonSteps.needsUpdate=true;toonSteps.minFilter=toonSteps.magFilter=THREE.NearestFilter;
function material(role:string,type:string,side:number,vertexColors=false):THREE.Material {
 const materialLook=variant==='rebuilt'?look:'current';
 const key=`${role}:${type}:${side}:${vertexColors}:${materialLook}`;if(matCache.has(key))return matCache.get(key)!;
 const pair=accents[type]??accents.guard;
 const color=role==='accent1'?pair[0]:role==='accent2'?pair[1]:(palettes[side] as any)[role]??palettes[side].army;
 const m=materialForLook({color,role,vertexColors,look:materialLook,currentGradientMap:toonSteps});matCache.set(key,m);return m;
}
function visual(name:string,side:number,rebuilt:boolean):THREE.Group {
 const pair=name==='guard'||name==='archer';
 const refined=rebuilt&&variant==='rebuilt'&&figureDetail==='refined';
 const key=refined?(meshTier==='board'?'board-':'rebuilt-')+defaultCharacter(name):pair&&rebuilt?(variant==='quiet'||figureDetail==='blockout'?'blockout-':'rebuilt-')+name:'original-'+name;
 const g=clone(models.get(key)!) as THREE.Group;
 g.traverse(o=>{const m=o as THREE.Mesh;const layer=m.morphTargetDictionary?.ClayLayer;if(layer!==undefined&&m.morphTargetInfluences)m.morphTargetInfluences[layer]=variant==='rebuilt'&&look==='handmade'?1:0;});
 if(variant==='rebuilt'&&look==='handmade')softenClayNormals(g);
 g.traverse(o=>{if((o as THREE.Mesh).isMesh){const m=o as THREE.Mesh;ensureSurfaceUv(m.geometry);const mats=Array.isArray(m.material)?m.material:[m.material];const replaced=mats.map(x=>material(x.name,name,side,m.geometry.hasAttribute('color')));m.material=Array.isArray(m.material)?replaced:replaced[0];m.castShadow=false;m.receiveShadow=false;if((m as THREE.SkinnedMesh).isSkinnedMesh)m.frustumCulled=false;}});
 g.userData.modelKey=key;return g;
}
let baselineReady:Promise<void>|undefined;
const pendingModels=new Map<string,Promise<void>>();
function ensureModel(key:string):Promise<void>{
 if(models.has(key))return Promise.resolve();
 if(!pendingModels.has(key))pendingModels.set(key,loader.loadAsync(source+'models/'+key+'.glb').then(gltf=>{gltf.scene.animations=gltf.animations;models.set(key,gltf.scene);}).finally(()=>pendingModels.delete(key)));
 return pendingModels.get(key)!;
}

let QH:any,quietReady:Promise<void>|undefined;
function ensureQuiet(){
 return quietReady??=(async()=>{
// QuietHours engine subset is MIT; original license and exact provenance are bundled.
for(const file of ['core','palette','camera','draw','light'])await new Promise<void>((resolve,reject)=>{const s=document.createElement('script');s.src=source+'quiet-hours/'+file+'.js';s.onload=()=>resolve();s.onerror=reject;document.head.append(s);});
QH=(window as any).QH;
// Add the study's colour ramps before the unmodified quantizer builds its lookup table.
for(const [side,pal] of palettes.entries())for(const [role,color] of Object.entries(pal)){const c=new THREE.Color(color);const a=c.getHex();QH.M[`study_${side}_${role}`]=[(a>>16)&255,(a>>8)&255,a&255];}
for(const [name,pair] of Object.entries(accents))for(let i=0;i<2;i++){const c=pair[i];QH.M[`type_${name}_${i}`]=[(c>>16)&255,(c>>8)&255,c&255];}
await new Promise<void>((resolve,reject)=>{const s=document.createElement('script');s.src=source+'quiet-hours/inks.js';s.onload=()=>resolve();s.onerror=reject;document.head.append(s);});
 })();
}

type Entry={sq:number,type:string,character:string,side:number,root:THREE.Group,visual:THREE.Group|THREE.Mesh,base:THREE.Vector3,walk?:WalkPreview,shove?:THREE.AnimationAction};
let entries:Entry[]=[];
function motionFor(model:THREE.Group|THREE.Mesh,design:string){
 const clip=model.animations?.find(a=>a.name==='Walk');
 const groundedBones:(string|RegExp)[]=[/^cloth/,'tail',...(design==='rook'||design==='knight'?['arm.L']:design==='pawn'?['arm.R']:[])];
 const walk=clip?new WalkPreview(model,clip,{pliable:variant==='rebuilt'&&look!=='current',cadence:variant==='rebuilt'&&look!=='current'?cadence:'smooth',groundedBones,squash:design!=='ogre'}):undefined;
 const shove=model.animations?.find(a=>a.name==='Shove');
 return {walk,shove:shove&&walk?walk.mixer.clipAction(shove):undefined};
}
function disposeMotion(e:Entry){
 e.walk?.dispose();const skeletons=new Set<THREE.Skeleton>();
 e.visual.traverse(o=>{if((o as THREE.SkinnedMesh).isSkinnedMesh)skeletons.add((o as THREE.SkinnedMesh).skeleton);});
 for(const s of skeletons)s.dispose();
}
const captures=new Map<Entry,{preview:CapturePreview,shadows:THREE.Object3D[]}>();
let selectedCharacter=CAST.some(c=>c.key===params.get('character'))?params.get('character')!:'queen';
el<HTMLSelectElement>('character').value=selectedCharacter;
let sceneMode=['pair','overlap','six','board','cast','character'].includes(params.get('scene')??'')?params.get('scene')!:'pair';
el<HTMLSelectElement>('scene').value=sceneMode;
const pairFen='8/8/3ga3/8/8/3GA3/8/8 w - - 0 1';
const overlapFen='8/8/8/3gG3/3aA3/8/8/8 w - - 0 1';
const sixFen='8/8/pngabk2/8/8/PNGABK2/8/8 w - - 0 1';
const boardFen='nagkkgan/pppppppp/8/8/8/8/PPPPPPPP/NAGKKGAN w - - 0 1'; // visual stress arrangement; not a playable game
let pos=fromFen(pairFen);
const designAt=new Map<number,string>();
function preparePosition(){
 designAt.clear();
 pos=fromFen(sceneMode==='board'?boardFen:sceneMode==='six'?sixFen:sceneMode==='overlap'?overlapFen:pairFen);
 if(sceneMode==='cast'||sceneMode==='character'){
  pos.board.fill(0);
  for(let side=0;side<2;side++){
   const roster=sceneMode==='cast'?CAST:[character(selectedCharacter)];
   roster.forEach((c,i)=>{
    const square=sceneMode==='cast'?(i===16?(side===0?27:36):(side===0?Math.floor(i/8)*2:5+Math.floor(i/8)*2)*8+i%8):27+side*2;
    pos.board[square]=c.code|(side<<4);designAt.set(square,c.key);
   });
  }
 }
}
const atlasCache=new Map<string,{texture:THREE.CanvasTexture,w:number,h:number}>();
let atlasBytes=0;
async function atlas(name:string,side:number):Promise<{texture:THREE.CanvasTexture,w:number,h:number}> {
 const key=figureDetail+'-'+name+side;if(atlasCache.has(key))return atlasCache.get(key)!;
 const cell=figureDetail==='refined'?256:160,cols=4,rows=4;
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
 restoreCaptures();
 for(const e of entries)disposeMotion(e);
 for(const e of entries)if((e.visual as THREE.Mesh).isMesh){const m=e.visual as THREE.Mesh;m.geometry.dispose();const mat=m.material as THREE.MeshBasicMaterial;mat.map?.dispose();mat.dispose();}
 entries=[];
}
function resetCamera(){
 const focus=sceneMode==='character'?new THREE.Vector3(.5,.55,.5):sceneMode==='board'||sceneMode==='cast'?new THREE.Vector3(0,.3,0):new THREE.Vector3(sceneMode==='six'?-1:.0,.35,0);
 view.controls.target.copy(focus);
 view.camera.position.copy(focus).add(sceneMode==='character'?new THREE.Vector3(2.0,3.7,10):sceneMode==='overlap'?new THREE.Vector3(2.7,4.6,9.5):new THREE.Vector3(6.2,9.0,8.6));
 view.camera.zoom=1;view.camera.updateProjectionMatrix();view.controls.update();view.camera.updateMatrixWorld(true);view.scene.updateMatrixWorld(true);
 const boxes=[new THREE.Box3().setFromObject(view.frame3d),...entries.map(e=>new THREE.Box3().setFromObject(e.visual))];
 let extent=0;for(const b of boxes)for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z]){const p=new THREE.Vector3(x,y,z).project(view.camera);extent=Math.max(extent,Math.abs(p.x),Math.abs(p.y));}
 view.camera.zoom=Math.min(sceneMode==='character'?4:2.3,.85/Math.max(.1,extent));view.camera.updateProjectionMatrix();qPan={x:0,y:0};qZoom=1;
}
let qPan={x:0,y:0},qZoom=1;
async function apply(){
 const id=++epoch;
 applying=true;
 const refined=variant==='rebuilt'&&figureDetail==='refined';
 if(!refined&&(sceneMode==='cast'||sceneMode==='character'))sceneMode='pair';
 el<HTMLSelectElement>('scene').value=sceneMode;
 for(const value of ['cast','character'])el<HTMLSelectElement>('scene').querySelector<HTMLOptionElement>(`[value=${value}]`)!.disabled=!refined;
 el('character-control').hidden=sceneMode!=='character';
 preparePosition();
 meshTier=meshQuality==='auto'?(sceneMode==='board'||sceneMode==='cast'?'board':'sculpt'):meshQuality;
 el<HTMLSelectElement>('mesh-quality').value=meshQuality;el<HTMLSelectElement>('mesh-quality').disabled=!refined;
 el('stats').textContent='Loading scene assets…';
 if(variant==='baseline')await (baselineReady??=loadModels('/'));
 else {
  const keys=[...new Set([...pos.board].flatMap((code,sq)=>{
   if(!code)return [];const type=types[code&15],design=designAt.get(sq)??defaultCharacter(type);
   if(refined)return [(meshTier==='board'?'board-':'rebuilt-')+design];
   return [(variant==='sculpt'||!['guard','archer'].includes(type)?'original-':variant==='quiet'||figureDetail==='blockout'?'blockout-':'rebuilt-')+type];
  }))];
  await Promise.all(keys.map(ensureModel));
  if(variant==='quiet')await ensureQuiet();
 }
 if(id!==epoch)return;
 running=false;walking=false;motion=0;bolt.visible=ring.visible=false;clearStudyPieces();view.tweens.flush();
 const i=variants.indexOf(variant);el('variant-title').textContent=variant==='rebuilt'&&figureDetail==='blockout'?'Earlier blockouts':names[i];el('description').textContent=copy[i];el('mode-label').textContent=`0${i+1} / ${names[i]}${variant==='rebuilt'?' · '+CLAY_LOOK_LABELS[look]:''}`;el('look-copy').textContent=variant==='rebuilt'?CLAY_LOOK_COPY[look]:'Clay looks are available on Refined figures.';el<HTMLSelectElement>('look').disabled=variant!=='rebuilt';
 document.querySelectorAll('[data-variant]').forEach(x=>x.classList.toggle('active',(x as HTMLElement).dataset.variant===variant));
 syncUrl();
 const isQuiet=variant==='quiet';el<HTMLSelectElement>('figure-detail').disabled=variant!=='rebuilt'&&variant!=='sprites';el<HTMLSelectElement>('figure-detail').value=isQuiet?'blockout':figureDetail;
 if(variant==='rebuilt'&&figureDetail==='blockout')el('description').textContent='The earlier broad-form study, before restoring the source proportions and surface detail.';quiet.hidden=!isQuiet;el('stage-board').style.visibility=isQuiet?'hidden':'visible';
 el('view-hint').textContent=isQuiet?'Fixed 2:1 isometric · drag to pan · scroll to zoom':variant==='sprites'?'Drag to orbit · 16 views · elevation locked':'Drag to orbit · scroll to zoom';
 el<HTMLButtonElement>('spin').disabled=isQuiet;el<HTMLSelectElement>('scene').querySelector<HTMLOptionElement>('[value=overlap]')!.disabled=isQuiet;el<HTMLSelectElement>('scene').querySelector<HTMLOptionElement>('[value=six]')!.disabled=isQuiet;
 el<HTMLSelectElement>('scene').querySelector<HTMLOptionElement>('[value=board]')!.disabled=isQuiet;
 if(isQuiet&&sceneMode!=='pair'){sceneMode='pair';el<HTMLSelectElement>('scene').value='pair';syncUrl();}
 const canContour=variant!=='baseline'&&!isQuiet;contourPass.enabled=canContour;view.pixelPass.enabled=!canContour;contourPass.mode=contourMode;
 el<HTMLSelectElement>('contours').disabled=!canContour;
 el('contour-note').textContent=canContour?'One thin contour per figure. Overlap aware strengthens shared edges and adjusts ink to the surface brightness.':'Contour comparison is available on Original sculpts, Rebuilt and Sprites.';
 el('limits').textContent=isQuiet?'Canvas study: earlier blockout pair only. Palette extended for the two armies. Painter sorting can misorder intersecting faces; this is not a production fallback.':variant==='sprites'?'One idle pose per angle; movement and effects animate in world space. Elevation is locked to the bake. No interpolated pose animation.':variant==='sculpt'?'Simplified original geometry with provisional colour zones. This is not a finished repaint of the source sculpts.':variant==='baseline'?'Existing voxel models and Dungeon style, placed on the same comparison board. This scene tests appearance, not chess rules.':'Sixteen designs come from the original sculpts; the Ogre is newly authored from its approved concept. Army/type colours stay tied to defining features. All seventeen designs have articulated movement; closed robes suggest concealed steps. This is an in-place motion study. Sprite poses remain static; clay springs are authored secondary motion, not a collision simulation.';
 const style=variant==='baseline'?STYLES.dungeonVoxel:{...STYLES.cel,outline:false,pixelSize:pixel,pieceScale:1,tiles:'flat' as const,shadow:true,lights:'bright' as const};
 view.applyStyle(style);view.rebuild(pos);
 for(const tile of view.tiles){const f=tile.userData.sq%8,r=Math.floor(tile.userData.sq/8);tile.visible=sceneMode==='board'||sceneMode==='cast'||(sceneMode==='character'?(r>=3&&r<=4&&f>=2&&f<=5):(r>=2&&r<=5&&(sceneMode==='six'?f<6:f>=2&&f<=5)));}
 view.frame3d.scale.set(sceneMode==='board'||sceneMode==='cast'?1:sceneMode==='six'?6.35/8.9:4.35/8.9,1,sceneMode==='board'||sceneMode==='cast'?1:sceneMode==='character'?2.35/8.9:4.35/8.9);view.frame3d.position.x=sceneMode==='six'?-1:0;
 view.setLabels(false);view.setCoords(false);view.setPalette(false);applyPixelSize();
 view.setEdges(variant==='baseline'?.05:0,variant==='baseline'?.15:0);
 view.controls.minPolarAngle=variant==='sprites'?Math.atan2(5,6.5):.25;view.controls.maxPolarAngle=variant==='sprites'?Math.atan2(5,6.5):1.25;
 if(variant!=='baseline'){
  view.scene.background=new THREE.Color(0x141c29);view.hemi.intensity=1.6;view.hemi.color.setHex(0xfff2d9);view.hemi.groundColor.setHex(0x59657b);view.sun.intensity=2.0;
  view.sun.position.set(-4,10,6);
  for(const tile of view.tiles){const sq=tile.userData.sq;tile.material.map=null;tile.material.color.setHex(((sq%8+Math.floor(sq/8))%2)?0xb9b2a0:0x596470);tile.material.needsUpdate=true;}
  view.frame3d.material.map=null;view.frame3d.material.color.setHex(0x2d3948);view.frame3d.material.needsUpdate=true;
 }
 if(variant==='rebuilt')applyLookLighting({scene:view.scene,hemi:view.hemi,sun:view.sun,shadowMat:view.shadowMat},look);
 else view.shadowMat.opacity=1;
 for(const [sq,g] of view.pieces as Map<number,THREE.Group>){
  const type=types[g.userData.code&15];const design=designAt.get(sq)??defaultCharacter(type);const side=g.userData.code>>4;let model:any=g.children[0];
  if(variant!=='baseline'&&type){
   // Only replace the figure; keep the renderer's ground shadow and label.
   g.remove(model);
   model=variant==='sprites'?await sprite(type,side):visual(refined?design:type,side,variant!=='sculpt');
   if(id!==epoch)return;
   g.add(model);g.userData.sprite=false;
  }
  if(sceneMode==='character')g.rotation.y=0;
  entries.push({sq,type,character:design,side,root:g,visual:model,base:g.position.clone(),...motionFor(model,design)});
 }
 el('ability').textContent=sceneMode==='character'&&selectedCharacter==='ogre'?'Shove':'Ability';
 const selected=character(selectedCharacter);
 el('character-detail').innerHTML=sceneMode==='character'?`<b>${selected.label}</b><p>${selected.feature}${selected.key==='pawn'?'.':': the identifying colour stays on this feature; the rest belongs to the army.'}</p><p>${['queen','king-shadow','king-spirit'].includes(selected.key)?'The original closed robe keeps its silhouette; motion suggests steps underneath.':selected.key==='ogre'?'A newly authored Shover: planted steps, stable body and separate clay palm pads. Shove previews its brace-and-push gesture.':'An articulated gait tailored to the original pose and equipment.'}</p>`:sceneMode==='cast'?'<b>The complete sculpt library</b><p>Pawn, Knight, Bishop, Rook, Queen, Guard, Archer, Paladin, Maester, Beast, Ogre and six Kings. Choose Character close-up to inspect a design in both armies.</p>':'<b>Guard · shoulder plates</b><p>Steel blue on the raised shoulder plates.</p><b>Archer · hood</b><p>Green on the hood; face, braid and wrist crossbows stay in the army colour.</p>';
 syncWalkButton();syncCaptureControls();contourPass.setPieces(entries.map(e=>e.visual));resetCamera();
 // Candidate styles use one beauty draw plus an optional piece-ID draw; baseline retains its original pass.
 view.debris.mesh.visible=false;
 rebuildCanvas();updateStats();
 applying=false;
}
function updateStats(){
 let tris=0;for(const e of entries)e.visual.traverse((o:any)=>{if(o.isMesh)tris+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;});
 el('stats').textContent=`${entries.length} pieces · ${Math.round(tris).toLocaleString()} figure triangles${variant==='rebuilt'?' · '+(meshTier==='board'?'board mesh':'close-up sculpt'):''}${variant==='sprites'?` · ${(atlasBytes/1048576).toFixed(1)} MiB atlas texels`:''}\n${variant==='quiet'?'Canvas':variant==='baseline'?'Original pixel pass':contourMode==='off'?'1 scene draw':'2 scene draws · beauty + piece IDs'} · no hardware FPS claim`;
}
/** Switch the whole visible cast at a screen-size threshold, without resetting the
 * camera, square roots or walk phase. Capture/action snapshots finish on their mesh. */
async function updateMeshTier(){
 if(meshQuality!=='auto'||variant!=='rebuilt'||figureDetail!=='refined'||applying||switchingTier||tierFailedAt===epoch||running||captures.size||!entries.length)return;
 const height=1.5*view.camera.zoom/(view.camera.top-view.camera.bottom)*el('stage-board').clientHeight;
 const next=height>155?'sculpt':height<115?'board':meshTier;
 if(next===meshTier)return;
 const id=epoch;switchingTier=true;
 try{
  await Promise.all([...new Set(entries.map(e=>(next==='board'?'board-':'rebuilt-')+e.character))].map(ensureModel));
  if(id!==epoch||meshQuality!=='auto'||running||captures.size)return;
  meshTier=next;
  for(const e of entries){
   const time=e.walk?.action.time??0;disposeMotion(e);e.root.remove(e.visual);
   e.visual=visual(e.character,e.side,true);e.root.add(e.visual);Object.assign(e,motionFor(e.visual,e.character));
   if(walking&&e.walk){e.walk.play();e.walk.action.stopFading();e.walk.action.setEffectiveWeight(1);e.walk.action.time=time;e.walk.mixer.update(0);}
  }
  contourPass.setPieces(entries.map(e=>e.visual));updateStats();
 }catch(error){tierFailedAt=id;console.error('Board mesh load failed',error);}
 finally{switchingTier=false;}
}
function applyPixelSize(){
 // Keep the extra samples in the output canvas; a CSS-sized canvas would discard them.
 const ratio=pixel<1?2:1;
 view.renderer.setPixelRatio(ratio);view.composer.setPixelRatio(ratio);
 view.setPixelSize(pixel*ratio);contourPass.setPixelSize(pixel*ratio);
}
function syncUrl(){const url=new URL(location.href);url.searchParams.set('variant',variant);url.searchParams.set('scene',sceneMode);url.searchParams.set('pixels',String(pixel));url.searchParams.set('contours',contourMode);url.searchParams.set('detail',figureDetail);url.searchParams.set('character',selectedCharacter);url.searchParams.set('look',look);url.searchParams.set('cadence',cadence);url.searchParams.set('capture',captureStyle);url.searchParams.set('mesh',meshQuality);history.replaceState({},'',url);}
function choose(v:Variant){variant=v;return apply();}
document.querySelectorAll<HTMLButtonElement>('[data-variant]').forEach(b=>b.onclick=()=>choose(b.dataset.variant as Variant));
const cycle=(d:number)=>choose(variants[(variants.indexOf(variant)+d+variants.length)%variants.length]);
el('prev').onclick=()=>cycle(-1);el('next').onclick=()=>cycle(1);
addEventListener('keydown',e=>{if((e.target as HTMLElement).closest('input,select,textarea,[contenteditable]'))return;if(e.key==='ArrowLeft')cycle(-1);if(e.key==='ArrowRight')cycle(1);});
el<HTMLSelectElement>('figure-detail').onchange=e=>{figureDetail=(e.target as HTMLSelectElement).value;void apply();};
el<HTMLSelectElement>('mesh-quality').onchange=e=>{meshQuality=(e.target as HTMLSelectElement).value as MeshQuality;void apply();};
el<HTMLSelectElement>('look').onchange=e=>{look=(e.target as HTMLSelectElement).value as ClayLook;void apply();};
el<HTMLSelectElement>('cadence').onchange=e=>{cadence=(e.target as HTMLSelectElement).value as ClayCadence;void apply();};
el<HTMLSelectElement>('pixels').onchange=e=>{pixel=Number((e.target as HTMLSelectElement).value);applyPixelSize();resizeQuiet();syncUrl();};
el<HTMLSelectElement>('character').onchange=e=>{selectedCharacter=(e.target as HTMLSelectElement).value;void apply();};
el<HTMLSelectElement>('scene').onchange=e=>{sceneMode=(e.target as HTMLSelectElement).value;void apply();};
el<HTMLSelectElement>('contours').onchange=e=>{contourMode=(e.target as HTMLSelectElement).value as ContourMode;contourPass.mode=contourMode;syncUrl();updateStats();};
el<HTMLSelectElement>('palette').onchange=e=>{const gray=(e.target as HTMLSelectElement).value==='gray';el('stage-board').style.filter=gray?'grayscale(1)':'';quiet.style.filter=gray?'grayscale(1)':'';};
el('reset').onclick=()=>{orbit=false;el('spin').textContent='Rotate';resetCamera();};
el('spin').onclick=()=>{orbit=!orbit;el('spin').textContent=orbit?'Stop rotation':'Rotate';};
let action:'move'|'ability'='move';
function syncWalkButton(){
 const available=entries.some(e=>e.walk),clay=variant==='rebuilt'&&look!=='current';const b=el<HTMLButtonElement>('walk');b.disabled=!available;b.textContent=walking?'Stop walking':'Walk in place';b.setAttribute('aria-pressed',String(walking));
 const cadenceControl=el<HTMLSelectElement>('cadence');cadenceControl.disabled=!clay;el('motion-note').textContent=clay?(cadence==='smooth'?'Smooth spring motion adds a small, deterministic lag to arms and cloth.':'12 fps stepping keeps the same spring motion between authored poses.'):'Clay motion is available for the two clay looks.';
 el<HTMLButtonElement>('poke').disabled=!clay||!available;
 el('walk-note').textContent=available?'Each figure has its own stride and timing. Armour stays composed; cloth and the Beast’s tail follow through. Drag to inspect.':'Walking is available on all seventeen refined 3D designs.';
}
function setWalking(value:boolean){
 if(value)restoreCaptures();
 walking=value&&entries.some(e=>e.walk);
 if(walking){running=false;motion=0;bolt.visible=ring.visible=false;for(const e of entries){e.root.position.copy(e.base);e.visual.rotation.x=e.visual.rotation.z=0;for(const c of e.root.children)if((c as THREE.Mesh).geometry===view.shadowGeo){c.position.y=.02;c.scale.setScalar(.8);}e.walk?.reset();e.walk?.play();}}
 else for(const e of entries)e.walk?.stop();
 syncWalkButton();
}
el('walk').onclick=()=>setWalking(!walking);
el('poke').onclick=()=>{restoreCaptures();for(const e of entries)e.walk?.poke();};
function animate(which:'move'|'ability'){restoreCaptures();if(running)return;setWalking(false);for(const e of entries)e.walk?.reset();action=which;running=true;motion=0;if(which==='ability')for(const e of entries)if(e.shove&&e.side===0){e.shove.reset().setLoop(THREE.LoopOnce,1).play();e.shove.clampWhenFinished=true;}}
el('move').onclick=()=>animate('move');el('ability').onclick=()=>animate('ability');
function syncCaptureControls(){
 const available=variant==='rebuilt'&&figureDetail==='refined'&&sceneMode==='character';
 el<HTMLSelectElement>('capture-style').disabled=!available;
 el<HTMLButtonElement>('capture-play').disabled=!available;
 el<HTMLButtonElement>('capture-reset').disabled=captures.size===0;
 el('capture-note').textContent=available?CAPTURE_COPY[captureStyle]:'Choose Character close-up with Refined figures to preview a capture.';
}
function restoreCaptures(){
 for(const {preview,shadows} of captures.values()){preview.dispose();for(const shadow of shadows)shadow.visible=true;}
 captures.clear();contourPass.setPieces(entries.map(e=>e.visual));syncCaptureControls();
}
function capture(style:CaptureStyle=captureStyle){
 if(variant!=='rebuilt'||figureDetail!=='refined'||sceneMode!=='character')return;
 restoreCaptures();setWalking(false);running=false;motion=0;bolt.visible=ring.visible=false;
 captureStyle=style;el<HTMLSelectElement>('capture-style').value=style;syncUrl();
 for(const e of entries){
  e.walk?.reset();e.root.position.copy(e.base);e.visual.rotation.x=e.visual.rotation.z=0;
  const shadows=e.root.children.filter(c=>(c as THREE.Mesh).geometry===view.shadowGeo&&c.visible);
  for(const shadow of shadows){shadow.visible=false;shadow.position.y=.02;shadow.scale.setScalar(.8);}
  captures.set(e,{preview:new CapturePreview(e.visual,style,e.side,look==='current'?'smooth':cadence),shadows});
 }
 contourPass.setPieces(entries.map(e=>captures.get(e)?.preview.group??e.visual));syncCaptureControls();
}
el<HTMLSelectElement>('capture-style').onchange=e=>{captureStyle=(e.target as HTMLSelectElement).value as CaptureStyle;restoreCaptures();syncUrl();};
el('capture-play').onclick=()=>capture();el('capture-reset').onclick=restoreCaptures;
// Projectiles and impact rings stay in world space for the mesh and sprite approaches.
const bolt=new THREE.Mesh(new THREE.ConeGeometry(.045,.35,4),new THREE.MeshBasicMaterial({color:0xecc279}));bolt.rotation.x=Math.PI/2;bolt.visible=false;view.world.add(bolt);
const ring=new THREE.Mesh(new THREE.RingGeometry(.40,.47,32),new THREE.MeshBasicMaterial({color:0x9ed7c7,transparent:true,depthWrite:false,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.visible=false;view.world.add(ring);
function stepAction(dt:number){
 if(!running)return;motion+=dt;for(const e of entries)if(action==='ability'&&e.shove&&e.side===0){e.shove.time=Math.min(e.shove.getClip().duration,look!=='current'&&cadence==='stopmotion'?Math.floor(motion*12)/12:motion);e.walk!.mixer.update(0);}const dur=action==='move'?1.4:1.65,t=Math.min(1,motion/dur);
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
 if(t>=1){for(const e of entries)e.shove?.stop();running=false;bolt.visible=ring.visible=false;for(const e of entries){e.root.position.copy(e.base);e.visual.rotation.x=e.visual.rotation.z=0;}}
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
let lastTierCheck=0;
function frame(now:number){if(applying){lastFrame=now;requestAnimationFrame(frame);return;}if(now-lastTierCheck>300){lastTierCheck=now;void updateMeshTier();}const elapsed=(now-lastFrame)/1000||0,dt=Math.min(.04,elapsed);lastFrame=now;stepAction(dt);for(const {preview} of captures.values())preview.update(Math.min(.1,elapsed));
 // Preserve walk cadence on slower devices; clamp only long pauses such as a hidden tab.
 for(const e of entries)e.walk?.update(Math.min(.25,elapsed));
 if(orbit&&!reduced&&variant!=='quiet'){const off=view.camera.position.clone().sub(view.controls.target);off.applyAxisAngle(new THREE.Vector3(0,1,0),dt*.27);view.camera.position.copy(view.controls.target).add(off);}
 view.controls.update();view.scene.updateMatrixWorld();updateSprites();
 if(variant==='quiet')renderQuiet();else view.composer.render();
 requestAnimationFrame(frame);
}
await apply();requestAnimationFrame(frame);
(window as any).study={choose,apply,capture,restoreCaptures,get captures(){return [...captures.values()].map(c=>c.preview)},get captureStyle(){return captureStyle},get variant(){return variant},get look(){return look},get cadence(){return cadence},setLook:(value:ClayLook)=>{look=value;el<HTMLSelectElement>('look').value=value;return apply();},poke:()=>{for(const e of entries)e.walk?.poke();},get entries(){return entries},get running(){return running},models,atlasCache,animate,setWalking,get walking(){return walking},view,contourPass,get scene(){return sceneMode},setScene:(mode:string)=>{sceneMode=mode;el<HTMLSelectElement>('scene').value=mode;return apply();},updateMeshTier,get switchingTier(){return switchingTier},get meshTier(){return meshTier},get meshQuality(){return meshQuality},setMeshQuality:(value:MeshQuality)=>{meshQuality=value;return apply();},get pixel(){return pixel},get figureDetail(){return figureDetail},cast:CAST,get character(){return selectedCharacter},setCharacter:(key:string)=>{if(!CAST.some(c=>c.key===key))throw new Error('Unknown character');selectedCharacter=key;sceneMode='character';variant='rebuilt';figureDetail='refined';el<HTMLSelectElement>('character').value=key;return apply();}};
