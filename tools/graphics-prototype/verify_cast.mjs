/** Full-cast and live-clay integration checks. Run against the existing study server. */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const out='docs/graphics-prototype';await mkdir(out+'/captures',{recursive:true});
const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[],checks=[],characters=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const check=(name,ok,detail)=>{checks.push({name,ok,detail});if(!ok)throw new Error(name+': '+JSON.stringify(detail));};
try {
 await page.goto('http://localhost:5190/?study&variant=rebuilt&scene=cast&pixels=1&detail=refined&look=current');await page.waitForFunction(()=>window.study);
 const cast=await page.evaluate(()=>study.cast);
 check('Sixteen distinct source designs including Queen and six Kings',cast.length===16&&cast.filter(c=>c.type==='king').length===6&&cast.some(c=>c.key==='queen'));
 check('Full cast has two independently rigged armies',await page.evaluate(()=>{
  const entries=study.entries;const allBones=new Set();let sum=0;
  for(const e of entries){const own=new Set();e.visual.traverse(o=>{if(o.isSkinnedMesh)for(const bone of o.skeleton.bones){own.add(bone);allBones.add(bone);}});sum+=own.size;}
  return entries.length===32&&entries.every(e=>e.walk)&&sum===allBones.size&&new Set(entries.map(e=>e.character)).size===16;
 }));
 const assetChecks=await page.evaluate(()=>{
  const geometries=new Set(),failures=[];let vertices=0,maxNormalError=0,maxWeightError=0,maxLoopError=0;
  for(const e of study.entries){
   const clip=e.walk.action.getClip();
   for(const t of clip.tracks){const n=t.getValueSize();for(let j=0;j<n;j++){const a=t.values[j],b=t.values[t.values.length-n+j];if(!Number.isFinite(a)||!Number.isFinite(b))failures.push(e.character+': non-finite key');maxLoopError=Math.max(maxLoopError,Math.abs(a-b));}}
   e.visual.traverse(m=>{
    if(!m.isSkinnedMesh||geometries.has(m.geometry))return;geometries.add(m.geometry);
    const a=m.geometry.attributes;vertices+=a.position.count;
    const mats=Array.isArray(m.material)?m.material:[m.material];if(mats.some(x=>!['army','accent1'].includes(x.name)))failures.push(e.character+': non-semantic paint');
    for(let i=0;i<a.position.count;i++){
     if(![a.position.getX(i),a.position.getY(i),a.position.getZ(i)].every(Number.isFinite))failures.push(e.character+': non-finite position');
     maxNormalError=Math.max(maxNormalError,Math.abs(Math.hypot(a.normal.getX(i),a.normal.getY(i),a.normal.getZ(i))-1));
     maxWeightError=Math.max(maxWeightError,Math.abs(a.skinWeight.getX(i)+a.skinWeight.getY(i)+a.skinWeight.getZ(i)+a.skinWeight.getW(i)-1));
     if(Math.max(a.skinIndex.getX(i),a.skinIndex.getY(i),a.skinIndex.getZ(i),a.skinIndex.getW(i))>=m.skeleton.bones.length)failures.push(e.character+': invalid joint');
    }
   });
  }
  return {vertices,geometries:geometries.size,maxNormalError,maxWeightError,maxLoopError,failures};
 });
 check('Every cast asset has finite geometry, unit normals and normalized valid skin weights',assetChecks.failures.length===0&&assetChecks.maxNormalError<.002&&assetChecks.maxWeightError<.0001,assetChecks);
 check('All exported walks close their loop without a pose jump',assetChecks.maxLoopError<.0001,{maxEndpointDifference:assetChecks.maxLoopError});
 await page.screenshot({path:out+'/captures/complete-cast-current.png'});
 await page.locator('#walk').click();await page.waitForTimeout(450);
 check('Every cast mixer advances',await page.evaluate(()=>study.entries.every(e=>e.walk.action.time>0)));
 await page.locator('#walk').click();await page.waitForFunction(()=>study.entries.every(e=>!e.walk.action.isRunning()));
 for(const c of cast){
  await page.evaluate(key=>study.setCharacter(key),c.key);
  const state=await page.evaluate(()=>({keys:study.entries.map(e=>e.visual.userData.modelKey),sides:study.entries.map(e=>e.side),count:study.entries.length,canWalk:!document.querySelector('#walk').disabled}));
  check(c.label+' close-up loads both armies',state.count===2&&state.sides.includes(0)&&state.sides.includes(1)&&state.canWalk&&state.keys.every(k=>k==='rebuilt-'+c.key),state);
  characters.push({key:c.key,...state});
  await page.screenshot({path:out+'/captures/cast-'+c.key+'.png'});
 }
 await page.evaluate(()=>study.setScene('pair'));
 const stillScales=await page.evaluate(()=>study.entries.map(e=>e.visual.scale.toArray()));
 for(const look of ['plasticine','handmade']){
  await page.evaluate(v=>study.setLook(v),look);
  check(look+' uses nonconstant texture coordinates and physical materials',await page.evaluate(()=>study.entries.every(e=>{
   let ok=true;e.visual.traverse(o=>{if(!o.isMesh)return;const u=o.geometry.getAttribute('uv');const m=Array.isArray(o.material)?o.material:[o.material];ok&&=!!u&&m.every(x=>x.isMeshPhysicalMaterial&&x.bumpMap&&x.roughnessMap)&&u.array.some(v=>v!==u.array[0]);});return ok;
  })));
  await page.locator('#walk').click();await page.waitForTimeout(800);
  check(look+' clay visibly deforms volume',await page.evaluate(()=>study.entries.some(e=>Math.abs(e.visual.scale.y-1)>.001)));
  await page.screenshot({path:out+'/captures/clay-'+look+'-walk.png'});
  await page.locator('#walk').click();await page.waitForFunction(()=>study.entries.every(e=>!e.walk.action.isRunning()));
  check(look+' stop restores exact scale',await page.evaluate(scales=>study.entries.every((e,i)=>e.visual.scale.toArray().every((v,j)=>Math.abs(v-scales[i][j])<1e-10)),stillScales));
  check(look+' poke control compresses idle models',await page.evaluate(()=>{document.querySelector('#poke').click();for(const e of study.entries)e.walk.update(1/60);return study.entries.some(e=>e.visual.scale.y<.999);}));
  await page.waitForFunction(()=>study.entries.every(e=>Math.abs(e.visual.scale.y-1)<1e-10));
 }
 const rebound=await page.evaluate(()=>{
  const e=study.entries[0],w=e.walk,results=[];
  for(const dt of [1/120,1/15]){w.reset();w.poke();let low=1,high=1;for(let t=0;t<2;t+=dt){w.update(dt);low=Math.min(low,e.visual.scale.y);high=Math.max(high,e.visual.scale.y);}results.push({dt,low,high,end:e.visual.scale.y});}
  return results;
 });
 check('Clay poke compresses, rebounds beyond rest, and settles at 120 and 15 fps',rebound.every(r=>r.low<.97&&r.high>1.002&&Math.abs(r.end-1)<1e-10),rebound);
 const activePoke=await page.evaluate(()=>{
  const pair=study.entries.filter(e=>e.type==='guard');for(const e of pair){e.walk.reset();e.walk.play();for(let i=0;i<40;i++)e.walk.update(1/60);}
  pair[0].walk.poke();for(const e of pair)for(let i=0;i<8;i++)e.walk.update(1/60);
  const difference=Math.abs(pair[0].visual.scale.y-pair[1].visual.scale.y);for(const e of pair)e.walk.reset();return difference;
 });
 check('Poke also affects a walking figure',activePoke>.005,{scaleDifference:activePoke});
 await page.selectOption('#cadence','stopmotion');await page.waitForFunction(()=>study.cadence==='stopmotion');
 await page.locator('#walk').click();await page.waitForTimeout(400);
 check('Stop-motion option plays the same articulated cast',await page.evaluate(()=>study.walking&&study.entries.every(e=>e.walk.action.time>0)));
 await page.evaluate(()=>study.setCharacter('queen'));check('Character change cancels active walking',!await page.evaluate(()=>study.walking));
 await page.reload();await page.waitForFunction(()=>window.study);
 check('Character and clay settings survive URL reload',await page.evaluate(()=>study.character==='queen'&&study.scene==='character'&&study.look==='handmade'&&study.cadence==='stopmotion'));
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(100);
 check('Phone layout stays within viewport',await page.evaluate(()=>document.documentElement.scrollWidth===innerWidth));
 await page.screenshot({path:out+'/captures/clay-queen-mobile.png'});
 await page.evaluate(()=>study.setScene('cast'));await page.screenshot({path:out+'/captures/clay-cast-mobile.png'});
 await page.evaluate(()=>study.choose('sprites'));check('Older comparisons return safely to the supported pair',await page.evaluate(()=>study.scene==='pair'&&study.entries.length===4));
 check('No browser errors',errors.length===0,errors);
}finally{
 await writeFile(out+'/cast-verification.json',JSON.stringify({date:'2026-09-21',checks,characters,errors},null,2)+'\n');await browser.close();
}
console.log(JSON.stringify({checks:checks.length,passed:checks.filter(c=>c.ok).length,errors}));
