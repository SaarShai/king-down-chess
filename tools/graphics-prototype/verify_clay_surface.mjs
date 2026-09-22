/** Fixed-view evidence for the handmade clay correction. Uses the existing dev server. */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const out='docs/graphics-prototype';await mkdir(out+'/captures',{recursive:true});
const b=await chromium.launch(),p=await b.newPage({viewport:{width:1440,height:1000}}),errors=[],checks=[];
p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const check=(name,ok,detail)=>{checks.push({name,ok,detail});if(!ok)throw Error(name+': '+JSON.stringify(detail));};
try{
 await p.goto('http://localhost:5190/?study&variant=rebuilt&scene=character&character=guard&pixels=0.5&contours=adaptive&look=plasticine');await p.waitForFunction(()=>window.study);
 await p.screenshot({path:out+'/captures/clay-surface-polished-guard.png'});
 const original=await p.evaluate(()=>{
  const a=[];for(const g of study.models.values())g.traverse(o=>{if(o.isMesh)a.push(Array.from(o.geometry.attributes.normal.array));});return a;
 });
 await p.evaluate(()=>study.setLook('handmade'));
 await p.screenshot({path:out+'/captures/clay-surface-handmade-guard.png'});
 const relief=await p.evaluate(()=>{
  const mats=new Set();for(const e of study.entries)e.visual.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material])mats.add(m);});
  const target=study.contourPass.ids,w=target.width,h=target.height;
  function pixels(){
   view.composer.render();const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.drawImage(view.renderer.domElement,0,0,w,h);
   const beauty=new Uint16Array(w*h*4);view.renderer.readRenderTargetPixels(study.contourPass.beauty,0,0,w,h,beauty);
   return {display:x.getImageData(0,0,w,h).data,beauty};
  }
  const pressed=pixels(),textured=pressed.display,scales=[...mats].map(m=>m.bumpScale);for(const m of mats)m.bumpScale=0;
  const unpressed=pixels(),flat=unpressed.display;[...mats].forEach((m,i)=>m.bumpScale=scales[i]);
  const ids=new Uint8Array(w*h*4);view.renderer.readRenderTargetPixels(target,0,0,w,h,ids);
  let count=0,changed=0,total=0,backgroundChanges=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const i=(y*w+x)*4,j=((h-1-y)*w+x)*4;
   const delta=(Math.abs(textured[j]-flat[j])+Math.abs(textured[j+1]-flat[j+1])+Math.abs(textured[j+2]-flat[j+2]))/3;
   if(ids[i]){count++;total+=delta;if(delta>4)changed++;}
   // Compare raw beauty outside figures: display resampling blends their boundary into the background.
   else if([0,1,2].some(c=>pressed.beauty[i+c]!==unpressed.beauty[i+c]))backgroundChanges++;
  }
  view.composer.render();
  return {figurePixels:count,changedFraction:changed/count,meanChannelDifference:total/count,backgroundChanges,allMattes:[...mats].every(m=>m.clearcoat===0&&m.sheen===0&&m.roughness>=.95),mapSize:[...mats][0].bumpMap.image.width};
 });
 check('Pressed relief changes the figures under identical lights, without changing the background',relief.changedFraction>.15&&relief.meanChannelDifference>3&&relief.backgroundChanges===0,relief);
 check('Handmade uses matte response and authored relief maps',relief.allMattes&&relief.mapSize===256,relief);
 const geometry=await p.evaluate(()=>study.entries.every(e=>{
  let ok=true;const raw=[];study.models.get(e.visual.userData.modelKey).traverse(o=>{if(o.isMesh)raw.push(o.geometry);});let i=0;
  e.visual.traverse(o=>{if(o.isMesh){const g=raw[i++];ok&&=o.geometry.attributes.position===g.attributes.position&&o.geometry.attributes.skinWeight===g.attributes.skinWeight&&o.geometry.attributes.normal!==g.attributes.normal;}});return ok;
 }));
 check('Handmade softens normals while sharing unchanged positions and rig weights',geometry);
 await p.locator('#walk').click();await p.waitForTimeout(600);await p.screenshot({path:out+'/captures/clay-surface-handmade-walk.png'});
 check('Textured figures remain animated',await p.evaluate(()=>study.walking&&study.entries.every(e=>e.walk.action.time>0)));
 await p.evaluate(()=>study.setCharacter('archer'));await p.screenshot({path:out+'/captures/clay-surface-handmade-archer.png'});
 await p.evaluate(()=>study.setScene('cast'));await p.screenshot({path:out+'/captures/clay-surface-handmade-cast.png'});
 check('Full cast uses the handmade shader with separate accent impressions',await p.evaluate(()=>study.entries.length===32&&study.entries.every(e=>{let ok=true;e.visual.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material])ok&&=m.customProgramCacheKey()===`pressed-clay-v3-${m.name==='accent1'}`;});return ok;})));
 await p.setViewportSize({width:390,height:844});await p.waitForTimeout(150);await p.screenshot({path:out+'/captures/clay-surface-mobile-cast.png'});
 check('Phone layout fits',await p.evaluate(()=>document.documentElement.scrollWidth===innerWidth));
 await p.evaluate(()=>study.setLook('plasticine'));
 check('Switching back keeps original source normals intact',await p.evaluate(before=>{const after=[];for(const g of study.models.values())g.traverse(o=>{if(o.isMesh)after.push(Array.from(o.geometry.attributes.normal.array));});return before.every((row,i)=>row.every((v,j)=>v===after[i][j]));},original));
 check('No shader, console or page errors',errors.length===0,errors);
}finally{await writeFile(out+'/clay-surface-verification.json',JSON.stringify({checks,errors},null,2)+'\n');await b.close();}
console.log(JSON.stringify({checks:checks.length,passed:checks.filter(c=>c.ok).length,errors}));
