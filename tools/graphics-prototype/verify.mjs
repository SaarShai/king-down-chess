/** Bounded visual-study verification. Start npm run graphics:study, then run this file. */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const out='docs/graphics-prototype';await mkdir(out+'/captures',{recursive:true});await mkdir('public/prototype/atlases',{recursive:true});
const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[],checks=[],observations=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const check=(name,ok,detail)=>{checks.push({name,ok,detail});if(!ok)throw new Error(name+': '+JSON.stringify(detail));};
await page.goto('http://localhost:5190/?study&variant=rebuilt');await page.waitForFunction(()=>window.study);
for(const variant of ['baseline','sculpt','rebuilt','sprites','quiet']){
 await page.evaluate(v=>window.study.choose(v),variant);await page.waitForTimeout(180);
 check(variant+' visible',await page.locator('[data-variant='+variant+']').evaluate(e=>e.classList.contains('active')));
 await page.screenshot({path:`${out}/captures/${variant}-desktop.png`});observations.push({variant,stats:await page.locator('#stats').textContent()});
}
const pan=await page.evaluate(()=>QH.cam.cam.x);await page.mouse.move(500,460);await page.mouse.down();await page.mouse.move(570,450,{steps:4});await page.mouse.up();await page.waitForTimeout(100);
check('QuietHours pan',await page.evaluate(p=>Math.abs(QH.cam.cam.x-p)>10,pan));
check('QuietHours rotation disabled',await page.locator('#spin').isDisabled());
await page.evaluate(()=>window.study.choose('sprites'));
const first=await page.evaluate(()=>window.study.entries.map(e=>e.visual.userData.frame));
await page.evaluate(()=>{const v=window.view;v.camera.position.copy(v.controls.target).add({x:8,y:11,z:-4});v.controls.update();});await page.waitForTimeout(150);
const second=await page.evaluate(()=>window.study.entries.map(e=>e.visual.userData.frame));check('Directional sprite changes view',first.some((x,i)=>x!==second[i]),{first,second});
const atlases=await page.evaluate(()=>[...window.study.atlasCache].map(([name,a])=>({name,png:a.texture.image.toDataURL().split(',')[1]})));
for(const a of atlases)await writeFile(`public/prototype/atlases/${a.name}.png`,Buffer.from(a.png,'base64'));
check('Four 16-view atlases',atlases.length===4,{count:atlases.length});
await page.evaluate(()=>window.study.choose('rebuilt'));
check('Desktop pair uses available space',await page.evaluate(()=>{const v=window.view;const b=v.frame3d.geometry.boundingBox??(v.frame3d.geometry.computeBoundingBox(),v.frame3d.geometry.boundingBox);const xs=[];for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z])xs.push(v.camera.position.clone().set(x,y,z).applyMatrix4(v.frame3d.matrixWorld).project(v.camera).x);const span=Math.max(...xs)-Math.min(...xs);return span>1&&span<1.9;}));
await page.locator('#move').click();await page.waitForTimeout(200);
check('Move changes world placement',await page.evaluate(()=>window.study.entries.some(e=>e.root.position.distanceTo(e.base)>.02)));
await page.waitForFunction(()=>!window.study.running,{},{timeout:12000});
check('Move returns to exact study placement',await page.evaluate(()=>window.study.entries.every(e=>e.root.position.distanceTo(e.base)<.00001)));
await page.locator('#ability').click();await page.waitForTimeout(650);await page.screenshot({path:out+'/captures/rebuilt-ability.png'});await page.waitForFunction(()=>!window.study.running,{},{timeout:12000});
check('Ability completes',!await page.evaluate(()=>window.study.running));
await page.evaluate(()=>window.study.setScene('six'));await page.screenshot({path:out+'/captures/rebuilt-six.png'});check('Six types both armies',await page.evaluate(()=>window.study.entries.length===12));
await page.evaluate(()=>window.study.setScene('board'));await page.screenshot({path:out+'/captures/rebuilt-board.png'});check('32 piece stress board',await page.evaluate(()=>window.study.entries.length===32));
await page.setViewportSize({width:390,height:844});await page.waitForTimeout(200);await page.screenshot({path:out+'/captures/rebuilt-mobile.png'});
check('Mobile board fits canvas',await page.evaluate(()=>{const v=window.view;const b=v.frame3d.geometry.boundingBox??(v.frame3d.geometry.computeBoundingBox(),v.frame3d.geometry.boundingBox);let extent=0;for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z]){const p=v.camera.position.clone().set(x,y,z).applyMatrix4(v.frame3d.matrixWorld).project(v.camera);extent=Math.max(extent,Math.abs(p.x),Math.abs(p.y));}return extent<.96;}));
await page.evaluate(()=>window.study.setScene('pair'));await page.waitForTimeout(150);await page.screenshot({path:out+'/captures/rebuilt-mobile-pair.png'});
await page.selectOption('#pixels','4');check('Pixel control updates renderer',await page.evaluate(()=>window.view.pixelPass.pixelSize===4));await page.screenshot({path:out+'/captures/rebuilt-mobile-px4.png'});
await page.selectOption('#palette','gray');check('Grayscale inspection',await page.locator('#stage-board').evaluate(e=>e.style.filter==='grayscale(1)'));
for(const f of ['guard_color_ref.jpg','Archer_color_ref.jpg']){const r=await page.request.get('http://localhost:5190/prototype/source-guides/'+f);check('Reference '+f,r.ok(),r.status());}
await page.goto('http://localhost:5190/');await page.waitForFunction(()=>window.view&&document.querySelector('#setup')?.title.length>5);check('Normal game still loads',await page.locator('#board canvas').count()===1);
check('No console/page errors',errors.length===0,errors);
const result={browser:browser.version(),checks,errors,observations,limits:'Visual/structural QA in Chromium software rendering. No physical-device performance benchmark.'};
await writeFile(out+'/verification.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({checks:checks.length,passed:checks.filter(x=>x.ok).length,errors}));await browser.close();
