// One-screen Workshop acceptance checks against a running production build.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
const base=process.env.PLAYABLE_URL || 'http://127.0.0.1:5189/';
const out=mkdtempSync('/tmp/workshop-dashboard-');
const browser=await chromium.launch({channel:'chrome'});
const errors=[];
const saved=p=>p.evaluate(()=>JSON.parse(localStorage.getItem('kingdown.workshop')).designs[0]);
const cell=(p,mode,x=1,y=2)=>p.locator(`.ws-board[data-action="${mode}"] .ws-cell[data-x="${x}"][data-y="${y}"]`);
try {
 for(const [width,height] of [[320,568],[390,844],[568,320],[768,1024],[1280,900]]) {
  const ctx=await browser.newContext({viewport:{width,height},hasTouch:width<721,permissions:['clipboard-read','clipboard-write']});
  const p=await ctx.newPage();p.setDefaultTimeout(10000);p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>sessionStorage.setItem('kingdown.title-seen','1'));
  await p.goto(base);await p.waitForFunction(()=>window.view?.ready);await p.evaluate(()=>window.view.ready());
  await p.click('#workshop-btn');await p.click('[data-door="piece"]');
  assert.equal(await p.locator('[data-new-figure]').count(),34);
  await p.click('[data-new-figure="antler-guardian"]');
  await p.waitForLoadState('networkidle');await p.screenshot({path:`${out}/${width}-initial.png`});
  assert.deepEqual((await saved(p)).squares,[]);
  assert.equal(await p.locator('.ws-board').count(),2);
  assert.equal(await p.locator('#workshop').locator('.ws-edit-sheet,.ws-die,.ws-card-edit,.ws-plinth,.ws-floor,.ws-rim,input[type="range"]').count(),0);
  assert.equal(await p.locator('.ws-model img').count(),1);
  const meter=await p.locator('.ws-thermometer').boundingBox();assert.ok(meter.height>meter.width);
  assert.equal(await p.getAttribute('.ws-thermometer','role'),'meter');
  await p.selectOption('[name="ws-paint"]','one');
  if(width===390) await cell(p,'move').tap(); else await cell(p,'move').click();assert.equal((await saved(p)).squares[0].mark,'move');
  await cell(p,'take').click();assert.equal((await saved(p)).squares[0].mark,'both');
  await cell(p,'move').click();assert.equal((await saved(p)).squares[0].mark,'take');
  await p.click('.ws-undo');assert.equal((await saved(p)).squares[0].mark,'both');
  await p.selectOption('.ws-take-mode select','shoot');
  await cell(p,'shoot').click();await cell(p,'shoot').click();assert.equal((await saved(p)).squares[0].mark,'moveShoot');
  await p.selectOption('.ws-take-mode select','take');await cell(p,'take').click();await cell(p,'take').click();
  await p.click('.ws-add');assert.equal(await p.locator('#workshop dialog[open]').count(),0);
  await p.click('.ws-book-row[data-a="chain"]');assert.equal((await saved(p)).rules.length,1);
  await p.click('.ws-add');await p.click('.ws-book-row[data-a="movesLike"]');
  await p.click('.ws-pill[data-pill="when"]');assert.equal(await p.locator('#workshop dialog[open]').count(),0);
  const condition=(await saved(p)).rules[1].when;
  await p.locator('.ws-property-options label').filter({hasText:'In the enemy half'}).first().click();
  assert.notDeepEqual((await saved(p)).rules[1].when,condition);
  await p.locator('.ws-remove').last().click();assert.equal((await saved(p)).rules.length,1);
  await p.click('.ws-name');await p.fill('.ws-name-in','Test Sentinel');await p.keyboard.press('Enter');
  assert.equal((await saved(p)).name,'Test Sentinel');
  await p.click('.ws-eye');await p.click('.ws-gallery summary');await p.click('.ws-gallery [data-figure="clay-golem"]');
  await p.locator('.ws-army label').filter({has:p.locator('input[value="1"]')}).click();
  assert.equal((await saved(p)).look.figure,'clay-golem');
  await p.click('.ws-eye');
  assert.equal(await p.evaluate(()=>document.querySelector('.ws-workspace').scrollWidth>document.querySelector('.ws-workspace').clientWidth+1),false,'no sideways scroll');
  for(const board of await p.locator('.ws-board').all()) {const r=await board.boundingBox();assert.ok(r.x>=0&&r.x+r.width<=width+1,'board fits width');}
  await p.locator('.ws-workspace').evaluate(e=>e.scrollTop=0);await p.waitForLoadState('networkidle');
  await p.screenshot({path:`${out}/${width}-dashboard.png`});
  if(width===1280) {
    await cell(p,'move',0,0).focus();await p.keyboard.press('ArrowRight');await p.keyboard.press('Enter');
    assert.ok((await saved(p)).squares.some(s=>s.x===1&&s.y===0));await p.keyboard.press('Control+z');
    await p.evaluate(()=>{window.originalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='kingdown.workshop')throw Error('full');return window.originalSet.call(this,k,v);};});
    await cell(p,'move',1,0).click();assert.equal(await p.locator('.ws-alert').isVisible(),true);
    await p.evaluate(()=>Storage.prototype.setItem=window.originalSet);await p.click('.ws-alert-retry');assert.equal(await p.locator('.ws-alert').isVisible(),false);
    await p.click('.ws-undo');
  }
  const before=await saved(p);
  await p.click('.ws-share');await p.click('.ws-copy-link');const link=await p.evaluate(()=>navigator.clipboard.readText());
  await p.click('.ws-try');await p.waitForSelector('.tb-me');assert.match(await p.getAttribute('.tb-me','src'),/clay-golem-w.webp/);
  await p.click('.ws-back');await p.click('.ws-undo');assert.equal((await saved(p)).look.army,0);
  await p.goto(link);await p.waitForSelector('.ws-keep-copy');assert.equal(await p.locator('.ws-cell:not([disabled])').count(),0);
  await p.click('.ws-keep-copy');assert.equal((await saved(p)).name,before.name);
  await p.reload();await p.waitForFunction(()=>window.view?.ready);await p.evaluate(()=>window.view.ready());
  await p.click('#workshop-btn');await p.locator('.ws-tile').first().click();assert.equal((await saved(p)).look.figure,'clay-golem');
  console.log(`ok ${width}x${height}: blank cast, separate channels, inline properties, name, appearance, thermometer, undo, share, reload and Try it`);
  await ctx.close();
 }
 assert.deepEqual(errors,[]);
} finally {await browser.close();}
console.log(`Screens: ${out}`);
