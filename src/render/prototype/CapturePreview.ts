/** Standalone, deterministic capture studies. No gameplay or attacker dependency. */
import * as THREE from 'three';
import type { ClayCadence } from './WalkPreview';

export const CAPTURE_STYLES = ['burst', 'melt', 'implode', 'launch', 'crack'] as const;
export type CaptureStyle = typeof CAPTURE_STYLES[number];
export const CAPTURE_LABELS:Record<CaptureStyle,string> = {
 burst:'Clay burst', melt:'Melt into a puddle', implode:'Implode to a bead',
 launch:'Fly off the board', crack:'Crack and crumble',
};
export const CAPTURE_COPY:Record<CaptureStyle,string> = {
 burst:'A quick rupture throws coloured chunks outward. Heavy crumbs tumble and shrink away.',
 melt:'The sculpt slumps from the feet upward, spreads into coloured clay, then sinks away.',
 implode:'The figure twists inward, compresses to a tiny clay bead, and disappears.',
 launch:'A short wind-up, then the whole figure tumbles in an arc off the board.',
 crack:'Seams open through the sculpt before solid clay chunks break loose and settle.',
};
const clamp=(t:number)=>THREE.MathUtils.clamp(t,0,1);
const ease=(t:number)=>{t=clamp(t);return t*t*(3-2*t);};
type Surface={mesh:THREE.Mesh,rest:Float32Array};
type Fragment={group:THREE.Group,center:THREE.Vector3,velocity:THREE.Vector3,spin:THREE.Vector3,floor:number};

export class CapturePreview {
 readonly group=new THREE.Group();
 readonly duration:number;
 elapsed=0;
 active=true;
 private readonly surfaces:Surface[]=[];
 private readonly fragments:Fragment[]=[];
 private readonly materials=new Map<THREE.Material,THREE.Material>();
 private readonly geometries=new Set<THREE.BufferGeometry>();
 private readonly bounds=new THREE.Box3();
 private readonly center=new THREE.Vector3();
 private readonly size=new THREE.Vector3();
 private readonly originalVisible:boolean;
 private disposed=false;
 private readonly puddle=new THREE.Group();

 constructor(private readonly figure:THREE.Object3D,readonly style:CaptureStyle,private readonly side:number,private readonly cadence:ClayCadence){
  this.duration=style==='crack'?3.0:style==='melt'?2.8:style==='launch'?1.8:2.2;
  this.originalVisible=figure.visible;
  figure.parent?.updateMatrixWorld(true);figure.updateMatrixWorld(true);
  this.group.name='capture-'+style;
  this.group.position.copy(figure.position);this.group.quaternion.copy(figure.quaternion);this.group.scale.copy(figure.scale);
  const inverse=figure.matrixWorld.clone().invert();
  figure.traverse(object=>{
   const source=object as THREE.Mesh;if(!source.isMesh)return;
   if((source as THREE.SkinnedMesh).isSkinnedMesh)(source as THREE.SkinnedMesh).skeleton.update();
   const geo=source.geometry.clone(),position=geo.getAttribute('position'),v=new THREE.Vector3();
   for(let i=0;i<position.count;i++){source.getVertexPosition(i,v);position.setXYZ(i,v.x,v.y,v.z);}
   geo.morphAttributes={};for(const attr of ['skinIndex','skinWeight'])geo.deleteAttribute(attr);
   geo.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,source.matrixWorld));
   geo.computeBoundingBox();this.bounds.union(geo.boundingBox!);
   const mats=(Array.isArray(source.material)?source.material:[source.material]).map(m=>this.copyMaterial(m));
   const mesh=new THREE.Mesh(geo,Array.isArray(source.material)?mats:mats[0]);
   this.geometries.add(geo);this.surfaces.push({mesh,rest:new Float32Array(geo.getAttribute('position').array)});
  });
  this.bounds.getCenter(this.center);this.bounds.getSize(this.size);
  if(style==='burst'||style==='crack')this.breakIntoChunks();
  else for(const s of this.surfaces)this.group.add(s.mesh);
  if(style==='melt')this.makePuddle();
  figure.parent!.add(this.group);figure.visible=false;this.sample(0);
 }
 private copyMaterial(source:THREE.Material){
  if(!this.materials.has(source)){
   const m=source.clone();
   // Three's clone omits shader callbacks; retain the actual pressed-clay finish.
   m.onBeforeCompile=source.onBeforeCompile;m.customProgramCacheKey=source.customProgramCacheKey;
   m.side=THREE.DoubleSide;this.materials.set(source,m);
  }
  return this.materials.get(source)!;
 }
 private makePuddle(){
  const geometry=new THREE.SphereGeometry(1,40,16),pa=geometry.getAttribute('position');
  for(let i=0;i<pa.count;i++){
   const x=pa.getX(i),z=pa.getZ(i),angle=Math.atan2(z,x),r=1+.055*Math.sin(angle*5)+.025*Math.cos(angle*3);
   pa.setXYZ(i,x*r,pa.getY(i),z*r);
  }
  geometry.computeVertexNormals();this.geometries.add(geometry);
  const material=(role:string)=>{
   const source=[...this.materials.values()].find(m=>m.name===role);if(!source)return;
   const m=source.clone();m.onBeforeCompile=source.onBeforeCompile;m.customProgramCacheKey=source.customProgramCacheKey;
   if('vertexColors' in m)m.vertexColors=false;this.materials.set(m,m);return m;
  };
  const army=material('army');if(!army)return;
  const base=new THREE.Mesh(geometry,army);base.scale.set(Math.min(.8,this.size.x*.95),.045,Math.min(.65,this.size.z*1.1));base.position.y=.024;this.puddle.add(base);
  const accent=material('accent1');
  if(accent){
   const patch=new THREE.Mesh(geometry,accent);patch.scale.set(Math.min(.3,this.size.x*.3),.013,Math.min(.30,this.size.z*.45));patch.position.set(-this.size.x*.28,.052,this.size.z*.06);patch.rotation.y=.4;this.puddle.add(patch);
  }
  this.puddle.position.set(this.center.x,this.bounds.min.y,this.center.z);this.group.add(this.puddle);
 }
 private breakIntoChunks(){
  // Clip the surface at shared planes rather than assigning whole triangles:
  // clean seams, original paint, and closed clay interiors on every fragment.
  type Plane={axis:number,at:number,sign:number};
  const cut=(polygon:number[][],plane:Plane)=>{
   const out:number[][]=[];
   for(let i=0;i<polygon.length;i++){
    const a=polygon[i],b=polygon[(i+1)%polygon.length],da=(a[plane.axis]-plane.at)*plane.sign,db=(b[plane.axis]-plane.at)*plane.sign;
    if(da>=-1e-8)out.push(a);
    if((da>1e-8&&db< -1e-8)||(da< -1e-8&&db>1e-8)){const t=da/(da-db);out.push(a.map((v,j)=>v+(b[j]-v)*t));}
   }
   return out;
  };
  const army=[...this.materials.values()].find(m=>m.name==='army')??[...this.materials.values()][0];
  const coreMaterial=army.clone();coreMaterial.onBeforeCompile=army.onBeforeCompile;coreMaterial.customProgramCacheKey=army.customProgramCacheKey;
  if('vertexColors' in coreMaterial)coreMaterial.vertexColors=false;
  if('color' in coreMaterial)(coreMaterial.color as THREE.Color).multiplyScalar(.8);
  this.materials.set(coreMaterial,coreMaterial);
  for(let id=0;id<12;id++){
   const layer=Math.floor(id/4),planes:Plane[]=[
    {axis:0,at:this.center.x,sign:id%2?1:-1},{axis:2,at:this.center.z,sign:Math.floor(id/2)%2?1:-1},
    {axis:1,at:this.bounds.min.y+this.size.y*layer/3,sign:1},{axis:1,at:this.bounds.min.y+this.size.y*(layer+1)/3,sign:-1},
   ];
   const group=new THREE.Group(),points:THREE.Vector3[]=[];
   for(const {mesh} of this.surfaces){
    const geo=mesh.geometry,index=geo.index,n=index?.count??geo.getAttribute('position').count;
    const attrs=['position','normal','color','uv','uv1'].filter(a=>geo.hasAttribute(a)),sizes=attrs.map(a=>geo.getAttribute(a).itemSize);
    const batches=new Map<number,number[][]>();
    for(let i=0;i<n;i+=3){
     let polygon=[0,1,2].map(j=>{const vertex=index?index.getX(i+j):i+j;return attrs.flatMap(name=>{const a=geo.getAttribute(name);return Array.from({length:a.itemSize},(_,k)=>a.getComponent(vertex,k));});});
     // Reject whole triangles before allocating interpolated vertices.
     if(planes.some(p=>polygon.every(v=>(v[p.axis]-p.at)*p.sign< -1e-8)))continue;
     for(const plane of planes){polygon=cut(polygon,plane);if(polygon.length<3)break;}
     if(polygon.length<3)continue;
     const mi=geo.groups.find(g=>i>=g.start&&i<g.start+g.count)?.materialIndex??0;
     if(!batches.has(mi))batches.set(mi,[]);const data=batches.get(mi)!;
     for(let j=1;j<polygon.length-1;j++)data.push(polygon[0],polygon[j],polygon[j+1]);
    }
    for(const [mi,data] of batches){
     const geometry=new THREE.BufferGeometry();let offset=0;
     for(let k=0;k<attrs.length;k++){
      const array=new Float32Array(data.length*sizes[k]);data.forEach((v,i)=>array.set(v.slice(offset,offset+sizes[k]),i*sizes[k]));
      geometry.setAttribute(attrs[k],new THREE.BufferAttribute(array,sizes[k]));offset+=sizes[k];
     }
     const material=Array.isArray(mesh.material)?mesh.material[mi]:mesh.material;
     group.add(new THREE.Mesh(geometry,material));this.geometries.add(geometry);
     for(const v of data)points.push(new THREE.Vector3(v[0],v[1],v[2]));
    }
   }
   if(points.length<3)continue;
   const box=new THREE.Box3().setFromPoints(points),center=box.getCenter(new THREE.Vector3()),caps:number[]=[];
   // Convex hull in each cutting plane seals the exposed clay. No CSG or physics
   // dependency; only the interior cross-sections are simplified to convex caps.
   for(const plane of planes){
    const axes=[0,1,2].filter(a=>a!==plane.axis),unique=new Map<string,number[]>();
    for(const p of points){const v=p.toArray();if(Math.abs(v[plane.axis]-plane.at)<1e-6)unique.set(axes.map(a=>Math.round(v[a]*1e6)).join(','),v);}
    const sorted=[...unique.values()].sort((a,b)=>a[axes[0]]-b[axes[0]]||a[axes[1]]-b[axes[1]]);
    const cross=(a:number[],b:number[],c:number[])=>(b[axes[0]]-a[axes[0]])*(c[axes[1]]-a[axes[1]])-(b[axes[1]]-a[axes[1]])*(c[axes[0]]-a[axes[0]]);
    const half=(list:number[][])=>{const hull:number[][]=[];for(const p of list){while(hull.length>=2&&cross(hull[hull.length-2],hull[hull.length-1],p)<=0)hull.pop();hull.push(p);}return hull.slice(0,-1);};
    const hull=half(sorted).concat(half([...sorted].reverse()));
    for(let j=1;j<hull.length-1;j++)caps.push(...hull[0],...hull[j],...hull[j+1]);
   }
   if(caps.length){
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(caps,3));geometry.computeVertexNormals();
    geometry.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(caps.length/3*2),2));
    const mesh=new THREE.Mesh(geometry,coreMaterial);mesh.name='clay interior';group.add(mesh);this.geometries.add(geometry);
   }
   group.position.copy(center);for(const part of group.children)part.position.copy(center).negate();
   const radial=center.clone().sub(this.center);radial.y=0;if(radial.lengthSq()<.001)radial.set(Math.cos(id*2.4),0,Math.sin(id*2.4));radial.normalize();
   const velocity=radial.multiplyScalar(.9+(id%4)*.17);velocity.y=1.2+(id%3)*.27;
   this.fragments.push({group,center,velocity,spin:new THREE.Vector3(Math.sin(id*3.1),Math.cos(id*2.7),Math.sin(id+1)).multiplyScalar(3),floor:center.y-box.min.y+.025});
   this.group.add(group);
  }
 }
 update(dt:number){if(!this.active||this.disposed)return;this.elapsed+=dt;this.sample(this.elapsed/this.duration);if(this.elapsed>=this.duration)this.active=false;}
 /** Absolute sampling also makes replay and visual regression frames reproducible. */
 sample(progress:number){
  if(this.disposed)return;
  let t=clamp(progress);if(this.cadence==='stopmotion')t=Math.floor(t*this.duration*12)/(this.duration*12);
  this.group.visible=progress<1;
  const anchor=this.figure.position;
  this.group.position.copy(anchor);this.group.quaternion.copy(this.figure.quaternion);this.group.scale.copy(this.figure.scale);
  if(this.style==='burst'||this.style==='crack'){
   const burst=this.style==='burst',release=burst?.10:.28,flight=Math.max(0,t-release)*this.duration;
   const open=ease((t-.06)/(release-.06)),gone=1-ease((t-.75)/.25);
   for(const f of this.fragments){
    for(const part of f.group.children)if(part.name==='clay interior')part.visible=burst?flight>0:t>.065;
    f.group.position.copy(f.center);f.group.rotation.set(0,0,0);f.group.scale.setScalar(gone);
    if(burst){
     f.group.position.addScaledVector(f.velocity,flight);f.group.position.y-=2.9*flight*flight;
    }else{
     f.group.position.addScaledVector(f.velocity,.025*open+.20*flight);
     f.group.position.y=f.center.y-1.7*flight*flight;
    }
    if(flight>0)f.group.position.y=Math.max(f.floor*gone,f.group.position.y);
    f.group.rotation.set(f.spin.x*flight*(burst?1:.6),f.spin.y*flight*(burst?1:.6),f.spin.z*flight*(burst?1:.6));
   }
  }else if(this.style==='launch'){
   const wind=ease(t/.16),s=Math.max(0,(t-.16)/.84),direction=this.side===0?-1:1;
   this.group.position.y-=Math.sin(wind*Math.PI)*.055;
   this.group.rotation.z+=direction*Math.sin(wind*Math.PI)*.15;
   this.group.position.x+=direction*7*s;this.group.position.y+=5*s-2.4*s*s;this.group.position.z-=1.8*s;
   this.group.rotateZ(direction*s*5);this.group.rotateX(s*3);
  }else{
   const collapse=ease((t-.07)/.68),gone=1-ease((t-.79)/.21),melt=this.style==='melt';
   if(melt){this.puddle.visible=t>.25;this.puddle.scale.setScalar(ease((t-.25)/.35)*gone);}
   for(const surface of this.surfaces){
    surface.mesh.visible=!melt||t<.65;
    const pa=surface.mesh.geometry.getAttribute('position'),rest=surface.rest;
    for(let i=0;i<pa.count;i++){
     const x=rest[i*3]-this.center.x,y=rest[i*3+1]-this.bounds.min.y,z=rest[i*3+2]-this.center.z,h=y/this.size.y;
     if(melt){
      const slump=ease((collapse-h*.14)/.86),spread=1+slump*(1.0-h*.35),ripple=Math.sin(Math.atan2(z,x)*5+h*2)*.025*slump;
      pa.setXYZ(i,this.center.x+(x*spread+Math.sin(Math.atan2(z,x))*ripple)*gone,this.bounds.min.y+(y*(1-slump)+.025*slump*(1-h*.6))*gone-.075*ease((collapse-.65)/.2),this.center.z+z*spread*gone);
     }else{
      const twist=collapse*(1-h)*3,scale=(1-collapse)*gone,cs=Math.cos(twist),sn=Math.sin(twist);
      pa.setXYZ(i,this.center.x+(x*cs-z*sn)*scale,this.center.y+(rest[i*3+1]-this.center.y)*scale,this.center.z+(x*sn+z*cs)*scale);
     }
    }
    pa.needsUpdate=true;surface.mesh.geometry.computeVertexNormals();surface.mesh.geometry.computeBoundingSphere();
   }
   if(!melt){this.group.position.y-=this.center.y*ease((t-.68)/.24);}
  }
 }
 dispose(){
  if(this.disposed)return;this.disposed=true;this.active=false;
  this.group.removeFromParent();this.figure.visible=this.originalVisible;
  for(const g of this.geometries)g.dispose();for(const m of this.materials.values())m.dispose();
 }
}
