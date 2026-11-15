import assert from 'node:assert/strict';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from '/Users/za/Documents/king down chess (new)/app/node_modules/playwright/index.mjs';
const out = '/Users/za/Documents/king down (fresh)/runs/launch/owner-playtest/build/b-shots';
mkdirSync(out,{recursive:true});
const fixture=JSON.parse(readFileSync(new URL('../docs/specs/owner-playtest/board-fixture.json',import.meta.url)));
const undoFixture=JSON.parse(readFileSync(new URL('../docs/specs/owner-playtest/undo-fixture.json',import.meta.url)));
const manifest=JSON.parse(readFileSync(new URL('../public/character-runtime/manifest.json',import.meta.url)));
const rests=new Set(manifest.banks.filter(b=>b.kind==='idle').map(b=>b.frames[0].url));
const idleFrames=Object.fromEntries(manifest.banks.filter(b=>b.kind==='idle').flatMap(b=>b.frames.filter(f=>!rests.has(f.url)).map(f=>[f.url.split('/').at(-1),b.army])));
let server;
if(!process.env.PLAYABLE_URL){const {preview}=await import('vite');server=await preview({preview:{host:'127.0.0.1',port:5443,strictPort:true},logLevel:'error'});}
const url=process.env.PLAYABLE_URL??'http://127.0.0.1:5443/';
const browser=await chromium.launch({headless:true});
const results=[];
async function open(size,reducedMotion='reduce',save=fixture){
 const context=await browser.newContext({viewport:{width:size[0],height:size[1]},hasTouch:true,reducedMotion});
 await context.addInitScript(({save,idleFrames})=>{
  localStorage.setItem('kingdown.save',JSON.stringify(save));localStorage.setItem('kingdown.setup',save.rules.hands.some(h=>h.length)?'cards':'powers');
  const fill=CanvasRenderingContext2D.prototype.fillRect,clear=CanvasRenderingContext2D.prototype.clearRect,draw=CanvasRenderingContext2D.prototype.drawImage;
  window.idlePoses=new Set();window.idleSides=new Set();window.idleMax=0;
  CanvasRenderingContext2D.prototype.drawImage=function(...args){const army=idleFrames[args[0]?.src?.split('/').at(-1)];if(army&&this.canvas.closest('.play-board-host')){const t=this.getTransform();window.idlePoses.add(`${Math.round(t.e)}:${Math.round(t.f)}`);window.idleSides.add(army);window.idleMax=Math.max(window.idleMax,window.idlePoses.size);}return draw.apply(this,args);};
  window.cueSquares=[];window.cueDraws=0;window.lastCueAt=0;window.boardInputAt=0;
  document.addEventListener('click',event=>{if(event.target.closest?.('.play-square'))window.boardInputAt=performance.now();},true);
  CanvasRenderingContext2D.prototype.clearRect=function(...args){if(this.canvas.closest('.play-board-host')){window.cueSquares=[];window.idlePoses.clear();}return clear.apply(this,args);};
  CanvasRenderingContext2D.prototype.fillRect=function(...args){if(this.canvas.closest('.play-board-host')&&/^rgba\(50, 62, 66,/.test(this.fillStyle))(window.cueSquares.push(args),window.cueDraws++,window.lastCueAt=performance.now());return fill.apply(this,args);};
 },{save:{...save,pace:reducedMotion==='reduce'?'off':'normal'},idleFrames});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(new URL('next.html',url).href);
 await page.locator('.home-game-row[data-kind=computer]').click();
 await page.waitForSelector('.play-board-host[style*="visibility: hidden"]',{state:'detached'});
 await page.waitForFunction(()=>document.querySelectorAll('.play-square').length===64);
 return {page,context,errors};
}
async function shot(page,size,name){await page.waitForTimeout(220);await page.screenshot({path:`${out}/${size.join('x')}-${name}.png`});}
async function geometry(page,selector,size){
 const box=await page.locator(selector).boundingBox();assert(box&&box.width>0&&box.height>0,selector+' opens');
 assert(box.x>=0&&box.y>=0&&box.x+box.width<=size[0]+1&&box.y+box.height<=size[1]+1,selector+' fits');
 if(size[0]>size[1]*1.2){const board=await page.locator('.play-board').boundingBox();assert(box.x>=board.x+board.width,selector+' stays in rail');}
 assert.equal(await page.locator(selector).evaluate(el=>getComputedStyle(el).borderRadius),'14px');
 assert.equal(await page.locator('dialog[open]').count(),0,'anchored panels have no modal scrim');
 const close=await page.locator(selector).locator('.kd-x').first().boundingBox();assert(close&&close.width>=44&&close.height>=44,'the X keeps a 44 px target');
}
async function panel(page,size,source,selector,name,closeName){
 await source.click();await page.locator(selector).waitFor({state:'visible'});await geometry(page,selector,size);await shot(page,size,name);
 await page.keyboard.press('Escape');assert.equal(await source.evaluate(el=>el===document.activeElement),true,name+' returns focus');
 await source.tap();await page.getByRole('button',{name:closeName,exact:true}).tap();
 assert.equal(await source.evaluate(el=>el===document.activeElement),true,name+' touch close returns focus');
 await source.focus();await page.keyboard.press('Enter');await page.getByRole('button',{name:closeName,exact:true}).waitFor({state:'visible'});
 const saved=await page.evaluate(()=>localStorage.getItem('kingdown.save'));
 await page.locator('.play-square[data-square="0"]').tap();
 assert.equal(await page.evaluate(()=>localStorage.getItem('kingdown.save')),saved,name+' outside tap keeps game');
 assert.equal(await page.locator('.play-square[aria-selected="true"]').count(),0,name+' outside tap only closes');
}
try{
 for(const size of [[390,844],[360,640],[844,390],[1440,900]]){
  const {page,context,errors}=await open(size);
  await shot(page,size,'cue');assert((await page.evaluate(()=>window.cueDraws))>=3,'move and card cue squares draw');
  assert.equal(await page.locator('[data-file]').first().evaluate(el=>getComputedStyle(el,'::after').fontSize),'12px');
  assert.equal(await page.locator('.play-history-strip').evaluate(el=>el.getBoundingClientRect().height),44);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight>innerHeight),false);
  await panel(page,size,page.getByRole('button',{name:'Menu',exact:true}),'.play-reader[data-floating="true"]','menu','Close menu');
  await panel(page,size,page.locator('.play-rival-cards'),'.play-reader[data-floating="true"]','opponent-cards',/^Close Computer/);
  await panel(page,size,page.locator('.play-history-toggle'),'.play-scroll-panel','history','Close history');
  await panel(page,size,page.locator('.play-effects-toggle'),'.play-scroll-panel','effects','Close effects');
  await page.locator('.play-square[data-square="24"]').click();await page.waitForTimeout(220);
  assert.equal(await page.evaluate(()=>window.lastCueAt<=window.boardInputAt),true,'an empty-square input removes cue');
  await page.locator('.play-square[data-square="8"]').click();
  assert.equal(await page.locator('.play-square[data-square="8"]').getAttribute('aria-selected'),'true','first board input acts');
  await page.waitForTimeout(220);assert.equal(await page.evaluate(()=>window.lastCueAt<=window.boardInputAt),true,'piece input acts with no past cue');
  const help=page.getByRole('button',{name:'All about the Pawn',exact:true});await help.click();
  await geometry(page,'.play-reader[data-floating="true"]',size);await page.keyboard.press('Escape');
  assert.equal(await help.evaluate(el=>el===document.activeElement),true,'rule returns focus to piece');
  await page.locator('.play-square[data-square="16"]').click();
  assert.equal(await page.getByRole('button',{name:'Undo',exact:true}).getAttribute('aria-disabled'),'false');
  await page.locator('.play-history-toggle').click();
  assert.match(await page.locator('.play-history-turn').first().innerText(),/This turn/);
  await page.keyboard.press('Escape');await page.getByRole('button',{name:'Undo',exact:true}).click();
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('kingdown.save')).staged??0),0,'Undo changes board at once');
  assert.equal(await page.locator('.play-ink-wipe').count(),0,'reduced Undo has no wipe');
  assert.equal(await page.getByRole('button',{name:'Show again',exact:true}).count(),0);
  await panel(page,size,page.locator('.play-card').first(),'.play-reader[data-floating="true"]','card','Cancel Freeze');
  assert.equal(await page.locator('.play-game').getAttribute('data-armed'),'','Escape and X cancel the card');
  await page.getByRole('button',{name:'Menu',exact:true}).click();
  const symbols=page.getByRole('switch',{name:/Use symbols/}),ribbon=page.getByRole('switch',{name:/Use ribbon/});
  await symbols.click();assert.equal(await page.evaluate(()=>localStorage.getItem('kingdown.piece-view')),'symbols');await symbols.click();
  await ribbon.click();assert.equal(await page.evaluate(()=>localStorage.getItem('kingdown.hand')),'ribbon');await ribbon.click();
  assert.equal(await page.getByText('Motion speed',{exact:true}).count(),0);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('kingdown.save')).pace),'off','Menu keeps the stored motion speed');
  await page.getByRole('button',{name:'Resign',exact:true}).click();await page.locator('dialog.kd-dialog[open]').waitFor();
  await page.keyboard.press('Escape');assert.equal(await page.locator('dialog.kd-dialog[open]').count(),0);
  await page.keyboard.press('Escape');
  assert.deepEqual(errors,[]);results.push({size,ok:true});await context.close();console.log('ok',size.join('x'));
 }
 {
  const {page,context,errors}=await open([1440,900],'no-preference');
  await page.waitForFunction(()=>window.idleSides.size===2,null,{timeout:45000});
  assert((await page.evaluate(()=>window.idleMax))<=3,'the drawn board idles never exceed three');
  await page.evaluate(()=>document.querySelector('.play-square[data-square="8"]').click());
  assert.equal(await page.locator('.play-square[data-square="8"]').getAttribute('aria-selected'),'true','input takes effect during idle');
  await page.waitForSelector('canvas.play-portrait-idle',{timeout:25000});await shot(page,[1440,900],'portrait-idle');
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(300);
  assert.equal(await page.locator('canvas.play-portrait-idle').count(),0,'Reduce Motion stops the portrait');
  const still=await page.locator('.play-board-host > canvas').first().evaluate(el=>el.toDataURL());await page.waitForTimeout(250);
  assert.equal(await page.locator('.play-board-host > canvas').first().evaluate(el=>el.toDataURL()),still,'Reduce Motion stops board idle');
  await page.locator('.play-history-toggle').click();
  assert.equal(await page.locator('.play-scroll-panel').evaluate(el=>el.getAnimations().length),0,'reduced scroll opens at once');
  assert.deepEqual(errors,[]);results.push({motion:'board and portrait',max:await page.evaluate(()=>window.idleMax),ok:true});await context.close();console.log('ok board and portrait motion');
 }
 {
  const {page,context,errors}=await open([390,844],'no-preference',undoFixture);
  await page.locator('.play-history-toggle').click();
  assert.match(await page.locator('.play-history-turn').first().innerText(),/d5/);
  await page.keyboard.press('z');
  assert.match(await page.locator('.play-square[data-square="18"]').getAttribute('aria-label'),/Knight/);
  assert.match(await page.locator('.play-square[data-square="35"]').getAttribute('aria-label'),/empty/);
  assert.match(await page.locator('.play-scroll-panel .play-ink-wipe').innerText(),/d5/);
  await page.waitForTimeout(240);assert.equal(await page.locator('.play-ink-wipe').count(),0);
  assert.match(await page.locator('.play-history-turn').first().innerText(),/c3/);
  await page.emulateMedia({reducedMotion:'reduce'});await page.keyboard.press('z');
  assert.equal(await page.locator('.play-ink-wipe').count(),0,'reduced Undo removes the line at once');
  assert.deepEqual(errors,[]);results.push({motion:'Undo and scroll',ok:true});await context.close();console.log('ok Undo and scroll motion');
 }
 writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));
}finally{await browser.close();await server?.httpServer.close();}
