import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { visibleBounds } from './lib/visible-bounds.mjs';
import { chromium, webkit } from '/Users/za/Documents/king down chess (new)/app/node_modules/playwright/index.mjs';
const base = process.env.PLAYABLE_URL;
assert(base, 'Set PLAYABLE_URL to the lane preview.');
const out = process.env.PLAYABLE_OUT;
assert(out, 'Set PLAYABLE_OUT to the screenshot folder.');
mkdirSync(out, { recursive: true });
const sizes = [[360,640],[390,844],[430,932],[768,1024],[844,390],[1440,900]], results = [];
let count = 0;
const check = (condition, message) => { assert(condition, message); count++; };
const caseNames = ['long-result','result-menu-close','result-menu-escape','result-resize','result-rotate','result-panel','result-panel-tap','result-board-tap','promotion-replay'];
// R2B_CASES runs only the named new cases. The r2 check reads R2_CASES, so the two names stay apart.
const selectedCases = process.env.R2B_CASES?.split(',');
assert(!selectedCases || selectedCases.every(name => caseNames.includes(name)), `Unknown R2B_CASES: ${selectedCases}`);
const repairSizes = [[360,640],[390,844],[390,763],[430,932],[768,1024],[844,390],[1440,900]];
async function stateRules(page, label) {
 const data = await page.evaluate(() => {
  const visible = node => {
   for (let p=node;p;p=p.parentElement) { const c=getComputedStyle(p); if(c.display==='none'||c.visibility!=='visible'||c.opacity==='0') return false; }
   const r=node.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight;
  };
  const game=document.querySelector('.play-game'), boxes=sel=>[...game.querySelectorAll(sel)].filter(visible).map(n=>({name:n.getAttribute('aria-label')||n.textContent,r:n.getBoundingClientRect().toJSON()}));
  const squares=boxes('.play-square'), controls=boxes('button'), smallText=[], walker=document.createTreeWalker(game,NodeFilter.SHOW_TEXT);
  while(walker.nextNode()) {
   const n=walker.currentNode,p=n.parentElement;
   if(!n.textContent.trim()||p.closest('.kd-sr,svg')||!visible(p))continue;
   const range=document.createRange();range.selectNodeContents(n);
   if(![...range.getClientRects()].some(r=>r.width&&r.height&&r.bottom>0&&r.top<innerHeight))continue;
   const px=parseFloat(getComputedStyle(p).fontSize);if(px<14)smallText.push({text:n.textContent,px});
  }
  const box=sel=>game.querySelector(sel)?.getBoundingClientRect().toJSON();
  return {scroll:{width:document.scrollingElement.scrollWidth,height:document.scrollingElement.scrollHeight,viewport:[innerWidth,innerHeight]},
   squareCount:squares.length,minSquare:Math.min(...squares.flatMap(n=>[n.r.width,n.r.height])),
   smallControls:controls.filter(n=>n.r.width<43.99||n.r.height<43.99),smallText,
   top:box('.play-opp'),board:box('.play-board'),strip:box('.play-history-strip'),reader:box('.play-reader'),result:box('.play-result'),reading:game.dataset.reading,stripVisible:!!game.querySelector('.play-history-strip')&&visible(game.querySelector('.play-history-strip'))};
 });
 const faults=[];
 if(data.scroll.width>data.scroll.viewport[0]+1||data.scroll.height>data.scroll.viewport[1]+1)faults.push(`page scroll ${JSON.stringify(data.scroll)}`);
 if(data.squareCount!==64||data.minSquare<43.99)faults.push(`squares: count ${data.squareCount}, minimum ${data.minSquare} px`);
 if(data.smallControls.length)faults.push(`controls under 44 px: ${JSON.stringify(data.smallControls)}`);
 if(data.smallText.length)faults.push(`text under 14 px: ${JSON.stringify(data.smallText)}`);
 if(await page.locator('.play-game').getAttribute('data-layout')==='portrait'&&data.reader.top<data.board.bottom-1)faults.push(`reader top ${data.reader.top}, board bottom ${data.board.bottom}`);
 if(data.reading==='result') {
  if(!data.stripVisible)faults.push('the result needs a visible history strip');
  if(!data.strip||data.reader.top<data.strip.bottom-0.5)faults.push(`result reader top ${data.reader.top}, strip bottom ${data.strip?.bottom}`);
 }
 check(!faults.length,`${label}: ${faults.join('; ')}`);
 return data;
}
async function setupManual(page, context, storage) {
 let view;
 await context.route('**/src/account/client.ts*',r=>r.fulfill({contentType:'text/javascript',body:'export function connect(){return {onSession(){},readSession:async()=>({userId:"tester",accessToken:"fixture"})}}'}));
 await context.addInitScript(()=>{
  localStorage.setItem('kingdown.auth','fixture');const write=Storage.prototype.setItem;
  Storage.prototype.setItem=function(key,value){if(window.round2Refuse&&key.startsWith('kingdown.account-command.'))throw new DOMException('full','QuotaExceededError');return write.call(this,key,value);};
 });
 await context.route('**/api/**',r=>{
  const path=new URL(r.request().url()).pathname,json=value=>r.fulfill({contentType:'application/json',body:JSON.stringify(value)});
  if(path==='/api/me/settings')return json({me:{handle:'tester',icon:null},settings:{}});
  if(path==='/api/me/games')return json({games:[],invitations:[]});
  if(path==='/api/me/record')return json({history:[],record:{},blocks:[]});
  if(path==='/api/invites/preview')return json({code:'OK',creator:{handle:'opponent',icon:null},colour:'white',options:view.options});
  return json(view);
 });
 await page.goto(new URL('next.html',base).href);await page.locator('.play-home').waitFor();
 view=await page.evaluate(async()=>{
  const {Game}=await import('/src/game.ts'),{toFen}=await import('/src/rules/setup.ts'),{rulesOf}=await import('/src/interface/play/saved.ts'),{DEFAULT_OPTIONS}=await import('/src/match/setup.ts'),{PAGE_ENGINE}=await import('/src/account-game/engine-identity.ts');
  const game=new Game('RNBQKBNR',rulesOf('both',[{king:'Spirit',power:'Mercy'},{king:'Shadow',power:'Darkness'}],[['Freeze','IceWall','Haste','Flight'],['Freeze','IceWall','Haste','Flight']]));
  return {engine_fingerprint:PAGE_ENGINE??'round2-fixture',fen:toFen(game.pos),rules:game.rules,history:{initial_fen:toFen(game.pos),actions:[]},legal:game.legal.map(m=>game.context.toLan(game.pos,m)),options:{...DEFAULT_OPTIONS,kingPowers:true,cards:true,arrangement:true}};
 });
 view={...view,game_id:'round2-manual',revision:1,status:'setup',seat:0,turn:0,action:'ready',kind:'friend',speed:'daily',days_per_move:3,server_now:new Date().toISOString(),deadline_at:new Date(Date.now()+864e5).toISOString(),abort_open:false,last_commands:[],opponent:{handle:'opponent',user_id:'other',computer:false,deleted:false,icon:null},draw_offer:null,draw:'RNBQKBNR',deal:['Freeze','IceWall','Haste','Flight'],ready:[false,true]};
 await page.goto(new URL('next.html#join='+ 'a'.repeat(43),base).href);await page.getByRole('button',{name:'Join the game',exact:true}).click();
 await page.locator('.play-game[data-state=arrange]').waitFor();await page.locator('.play-board-host[style*="visibility: hidden"]').waitFor({state:'detached'});await page.locator('.shell-departing').waitFor({state:'detached'});
 if(storage){
  await page.evaluate(()=>window.round2Refuse=true);await page.getByRole('button',{name:'Ready',exact:true}).tap();
  await page.locator('.play-notice').filter({hasText:'This device cannot save the send. Free some space, then try again.'}).waitFor();
 }
}
async function observeBoard(context) {
 // Observe the real board calls. Keep their bodies and playback timing intact.
 await context.route('**/src/interface/board-api.ts*',async route=>{
  const response=await route.fetch();let body=await response.text();
  for(const marker of ['async play(action, after) {','setPosition(next, context = rules) {','finally {'])assert(body.includes(marker),`board observer anchor: ${marker}`);
  body=body.replace('setPosition(next, context = rules) {','setPosition(next, context = rules) { globalThis.round2Board ??= {events:[],pending:0}; globalThis.round2Board.position=structuredClone(next);');
  body=body.replace('async play(action, after) {',`async play(action, after) { globalThis.round2Board.pending++; globalThis.round2Board.events.push({kind:'start',move:structuredClone(action),replaying:document.querySelector('.play-game').dataset.replaying,floating:document.querySelector('.play-reader').dataset.floating});`);
  body=body.replace('finally {',`finally { globalThis.round2Board.pending--; globalThis.round2Board.position=structuredClone(position); globalThis.round2Board.events.push({kind:'end',move:structuredClone(action)});`);
  await route.fulfill({response,body});
 });
}
async function seedResult(page,promotion=false) {
 await page.goto(new URL('next.html',base).href);await page.locator('.play-home').waitFor();
 await page.evaluate(async promotion=>{
  const {Game}=await import('/src/game.ts'),{rulesOf}=await import('/src/interface/play/saved.ts');
  const rules=rulesOf('powers',[null,promotion?{king:'Frost',power:'Freeze'}:{king:'Flame',power:'Haste'}],[[],[]]);
  const fen=promotion?'7k/P7/8/8/8/8/1P6/7K w - - 0 1':'8/8/3q4/8/8/5k2/P7/7K w - - 0 1';
  const moves=promotion?['Kh1-g1','!F:b2','Kh8-g8']:[];
  const game=new Game('RNBQKBNR',rules);game.load(game.context.fromFen(fen));game.playLan(moves);
  if(game.status!=='playing')throw Error('the case must start in a live game');
  localStorage.setItem('kingdown.save',JSON.stringify({back:'',fen,moves,white:'human',black:'ai',skill:'club',coords:true,resigned:null,rules:game.rules,pace:promotion?'normal':'off',sound:false}));
 },promotion);
 await page.reload();await page.locator('.home-game-row[data-kind=computer]').click();
 await page.locator('.play-game[data-state=ready]').waitFor({timeout:45000});await page.locator('.play-home,.shell-departing').waitFor({state:'detached'});await page.locator('.play-board-host[style*="visibility: hidden"]').waitFor({state:'detached'});
}
async function longResultRules(page,label,errors) {
 await page.waitForFunction(()=>{const n=document.querySelector('.play-result');return n&&getComputedStyle(n).opacity==='1'&&!document.querySelector('.game-menu');});
 const data=await page.evaluate(()=>{
  const game=document.querySelector('.play-game'),card=game.querySelector('.play-result'),reader=game.querySelector('.play-reader'),strip=game.querySelector('.play-history-strip'),fit=game.getAttribute('data-result-fit');
  let natural;
  try {game.removeAttribute('data-result-fit');natural={card:card.getBoundingClientRect().toJSON(),reader:reader.getBoundingClientRect().toJSON()};}
  finally {if(fit===null)game.removeAttribute('data-result-fit');else game.setAttribute('data-result-fit',fit);}
  const box=n=>n.getBoundingClientRect().toJSON(),figure=game.querySelector('.play-result-art');
  const cause=game.querySelector('.play-result-cause'),range=document.createRange();range.selectNodeContents(cause);
  const clips=[];for(let n=cause;n;n=n.parentElement){const css=getComputedStyle(n),r=box(n);clips.push({r,x:/(hidden|clip|auto|scroll)/.test(css.overflowX),y:/(hidden|clip|auto|scroll)/.test(css.overflowY)});}
  return {fit,natural,layout:game.dataset.layout,form:game.dataset.form,card:box(card),reader:box(reader),strip:box(strip),stripVisible:strip.checkVisibility(),figureVisible:figure.checkVisibility()&&figure.getBoundingClientRect().height>0,cause:cause.innerText,causeBox:box(cause),text:[...range.getClientRects()].map(r=>r.toJSON()),clips,actions:[...game.querySelectorAll('.play-result-actions button')].map(n=>({r:box(n),visible:n.checkVisibility()})),height:innerHeight,width:innerWidth,scroll:[document.scrollingElement.scrollWidth,document.scrollingElement.scrollHeight]};
 });
 check(data.stripVisible&&data.reader.top>=data.strip.bottom-0.5,`${label}: visible history before result: ${JSON.stringify(data)}`);
 check(data.card.bottom<=data.height,`${label}: result bottom ${data.card.bottom} <= ${data.height}`);
 check(data.cause.startsWith('Checkmate.')&&data.cause.length===119,`${label}: the real computer mate has its full long cause: ${data.cause}`);
 await visibleBounds(page,'.play-result-cause');await visibleBounds(page,'.play-result-actions button',true);
 check(data.text.length>0&&data.text.every(r=>r.left>=0&&r.right<=data.width&&r.top>=0&&r.bottom<=data.height&&data.clips.every(c=>(!c.x||r.left>=c.r.left&&r.right<=c.r.right)&&(!c.y||r.top>=c.r.top&&r.bottom<=c.r.bottom))),`${label}: every cause line fits without clipping: ${JSON.stringify(data)}`);
 check(data.actions.length===3&&data.actions.every(({r,visible})=>visible&&r.left>=0&&r.right<=data.width&&r.top>=0&&r.bottom<=data.height),`${label}: all result buttons fit: ${JSON.stringify(data.actions)}`);
 check(data.scroll[0]<=data.width&&data.scroll[1]<=data.height,`${label}: no page scroll ${data.scroll}`);
 if(data.layout==='portrait')check((data.fit==='tight')===(data.natural.card.bottom>data.natural.reader.bottom),`${label}: tight exactly matches natural overflow: ${JSON.stringify(data)}`);
 else check(data.fit===null,`${label}: the wide result needs no portrait fit`);
 check(data.figureVisible===(data.fit!=='tight'&&data.form!=='compact'),`${label}: the full result shows its figure; compact and tight results hide it`);
 await stateRules(page,label);check(!errors.length,`${label}: no page errors ${errors}`);
 return data;
}
for (const engine of [chromium, webkit]) {
 const browser = await engine.launch();
 try {
  for (const [width, height] of selectedCases ? [] : sizes) for (const setup of ['pieces','powers','cards','both']) {
   const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce', hasTouch: true });
   await context.route(/supabase\.co/, route => route.abort());
   const page = await context.newPage(), errors = [];
   page.on('pageerror', e => errors.push(e.message));
   const label = `${engine.name()}-${width}x${height}-${setup}`;
   try {
    await page.goto(new URL('next.html', base).href); await page.locator('.play-home').waitFor();
    await page.evaluate(async setup => {
     const { Game } = await import('/src/game.ts'), { toFen } = await import('/src/rules/setup.ts'), { rulesOf } = await import('/src/interface/play/saved.ts');
     const hands = ['cards','both'].includes(setup) ? ['Freeze','IceWall','Haste','Flight'] : [];
     const game = new Game('RNBQKBNR', rulesOf(setup, [{king:'Spirit',power:'Mercy'},{king:'Mud',power:'March'}], [hands,hands]));
     game.playLan(['e2-e4','e7-e5']);
     localStorage.setItem('kingdown.save', JSON.stringify({back:game.backRank, fen:toFen(game.history[0].pos), moves:game.history.map(h=>h.lan), white:'human', black:'ai', skill:'casual', coords:true, resigned:null, rules:game.rules, pace:'off'}));
    }, setup);
    await page.reload(); await page.locator('.home-game-row[data-kind=computer]').click();
    const ready = async () => { await page.locator('.play-game[data-state=ready]').waitFor({timeout:45000}); await page.locator('.play-home').waitFor({state:'detached'}); await page.locator('.play-board-host[style*="visibility: hidden"]').waitFor({state:'detached'}); };
    await ready();
    const geometry = await page.evaluate(() => {
     const box = s => document.querySelector(s).getBoundingClientRect().toJSON();
     const parts = ['.play-opp','.play-board','.play-history-strip','.play-reader','.play-own','.play-turn'].map(box);
     const rail = document.querySelector('.play-game').dataset.layout === 'wide';
     const visible = b => {const r=b.getBoundingClientRect();return r.width && r.height && getComputedStyle(b).visibility !== 'hidden' && !b.closest('[hidden]');};
     const small = [...document.querySelectorAll('.play-game button')].filter(visible).map(b=>({name:b.getAttribute('aria-label')||b.textContent, r:b.getBoundingClientRect()})).filter(({r})=>r.width<43.5||r.height<43.5).map(({name,r})=>`${name}: ${r.width}x${r.height}`);
     return {parts,rail,small,scroll:document.scrollingElement.scrollHeight>innerHeight+1||document.scrollingElement.scrollWidth>innerWidth+1,
      identity:[...document.querySelectorAll('.play-opponent-group strong > *')].map(n=>({text:n.textContent,nowrap:getComputedStyle(n).whiteSpace,r:n.getBoundingClientRect().toJSON()})),
      records:[...document.querySelectorAll('.play-history-record')].map(n=>({text:n.textContent,r:n.getBoundingClientRect().toJSON()}))};
    });
    check(!geometry.scroll, `${label}: no page scroll`); check(!geometry.small.length, `${label}: 44 px controls ${geometry.small}`);
    const [top, board, scroll, reader, hand, finish] = geometry.parts;
    const ordered = geometry.rail ? [top,scroll,reader,hand,finish] : geometry.parts;
    for(let i=1;i<ordered.length;i++) if(ordered[i].height) check(ordered[i].top >= ordered[i-1].bottom-1, `${label}: part ${i} follows its previous part`);
    if(geometry.rail) check(scroll.left >= board.right, `${label}: scroll stays in the rail`);
    check(geometry.identity.map(n=>n.text).join('|')==='Computer|Focused', `${label}: full opponent words`);
    check(geometry.identity.every(n=>n.nowrap==='nowrap' && n.r.top>=top.top && n.r.bottom<=top.bottom), `${label}: name and level fit the header`);
    check(geometry.records.length===2 && /e7 to e5/.test(geometry.records[0].text) && /e2 to e4/.test(geometry.records[1].text), `${label}: newest two records`);
    check(geometry.records.every(n=>n.r.top>=scroll.top && n.r.bottom<=scroll.bottom), `${label}: both records fit`);
    check(await page.getByRole('button',{name:/Effects/}).count()===0, `${label}: no Effects control`);
    const replay = page.getByRole('button',{name:'Replay',exact:true}); check(await replay.count()===1, `${label}: Replay after opponent turn`);
    const save = await page.evaluate(()=>localStorage.getItem('kingdown.save'));
    await replay.tap(); check(await page.evaluate(()=>localStorage.getItem('kingdown.save'))===save, `${label}: reduced replay preserves the save`);
    for(const key of ['Enter','Space']) {
     await page.locator('.play-history-toggle').focus(); await page.keyboard.press(key); await page.locator('.play-scroll-panel').waitFor({state:'visible'});
     const all = await page.locator('.play-history-line').allTextContents();check(/e7 to e5/.test(all[0]) && /e2 to e4/.test(all[1]), `${label}: ${key} opens newest first`);
     await page.keyboard.press('Escape');
    }
    await page.locator('.play-history-toggle').tap(); await page.getByRole('button',{name:'Close history'}).tap();
    await page.screenshot({path:`${out}/${label}.png`});
    if(setup==='both') {
     await page.locator('.play-card').first().tap();
     const armed = await page.locator('.play-step').boundingBox(), cancel = await page.getByRole('button',{name:'Cancel Freeze',exact:true}).boundingBox();
     check(armed && armed.y>=reader.y && armed.y+armed.height<=reader.bottom+1, `${label}: armed next step stays in view`);
     check(cancel && cancel.width>=44 && cancel.height>=44 && cancel.y+cancel.height<=reader.bottom+1, `${label}: armed Cancel stays in view`);
     await page.screenshot({path:`${out}/${label}-armed.png`}); await page.keyboard.press('Escape');
    }
    await page.locator('.play-square[data-square="11"]').tap(); await page.locator('.play-square[data-square="27"]').tap();
    await page.getByRole('button',{name:'Undo',exact:true}).tap();check(await replay.count()===1, `${label}: Undo returns to Replay`);
    await page.locator('.play-square[data-square="11"]').tap(); await page.locator('.play-square[data-square="27"]').tap();
    await page.getByRole('button',{name:'End turn',exact:true}).tap(); await ready();
    check(await replay.count()===1, `${label}: Replay after the computer reply`);
    check(errors.length===0, `${label}: no page errors ${errors}`);
    results.push({label,pass:true,geometry}); console.log(`PASS ${label}`);
   } catch(error) { results.push({label,pass:false,error:error.message}); console.log(`FAIL ${label}: ${error.message}`); }
   finally { await context.close(); }
  }
 for(const [width,height] of selectedCases ? [] : repairSizes) {
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',hasTouch:true});
  const page=await context.newPage();await context.route(/supabase\.co/,r=>r.abort());
  try {
   await page.goto(new URL('next.html',base).href);await page.locator('.play-home').waitFor();
   await page.evaluate(async()=>{
    const {Game}=await import('/src/game.ts'),{rulesOf}=await import('/src/interface/play/saved.ts');
    const game=new Game('RNBQKBNR',rulesOf('both',[{king:'Spirit',power:'Mercy'},{king:'Mud',power:'March'}],[['Freeze','IceWall','Haste','Flight'],['Freeze','IceWall','Haste','Flight']]));
    localStorage.setItem('kingdown.save',JSON.stringify({back:'',fen:'7k/P7/8/8/8/8/8/7K w - - 0 1',moves:['Kh1-g1','Kh8-g8'],white:'human',black:'ai',rules:game.rules,skill:'casual',resigned:null,coords:true,pace:'off'}));
   });
   await page.reload();await page.locator('.home-game-row[data-kind=computer]').click();await page.locator('.play-home').waitFor({state:'detached'});
   await page.locator('.play-square[data-square="48"]').tap();await page.locator('.play-square[data-square="56"]').tap();
   await page.locator('.play-game[data-state=choice]').waitFor();
   await visibleBounds(page,'.play-choices button',true);await visibleBounds(page,'.play-choice-cancel',true);
   await visibleBounds(page,'.play-headline');await visibleBounds(page,'.play-b[data-form="compact"] .play-turn-state, .play-b:not([data-form="compact"]) .play-target');
   check(/a8/.test(await page.locator('.play-b[data-form="compact"] .play-turn-state, .play-b:not([data-form="compact"]) .play-target').innerText()),`${engine.name()} ${width}: the promotion target names a8`);
   await stateRules(page,`${engine.name()}-${width}x${height}-choice`);
   check(await page.locator('.play-choices button').count()>=4,`${engine.name()} ${width}: all promotion choices stay in view`);
   await page.screenshot({path:`${out}/${engine.name()}-${width}x${height}-choice.png`});
   await page.getByRole('button',{name:'Cancel action choice',exact:true}).tap();
   results.push({label:`${engine.name()}-${width}x${height}-choice`,pass:true});
  }catch(error){results.push({label:`${engine.name()}-${width}x${height}-choice`,pass:false,error:error.message});console.log(`FAIL choice: ${error.message}`);}
  finally{await context.close();}
 }
 for(const [width,height] of selectedCases ? [] : repairSizes) for(const state of ['armed-card','armed-power','manual','manual-storage','result']) {
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',hasTouch:true,serviceWorkers:'block'});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(10000);
  await context.route(/supabase\.co/,r=>r.abort());
  const label=`${engine.name()}-${width}x${height}-${state}`;
  try {
   if(state.startsWith('manual')) {
    await setupManual(page,context,state==='manual-storage');
    check(/Tap two pieces to swap\.\s*Select Ready to start\./.test(await page.locator('.play-detail').innerText()),`${label}: full setup instruction`);
    await visibleBounds(page,state==='manual-storage'?'.play-notice, .play-arrange-rule':'.play-headline, .play-arrange-rule');
    await visibleBounds(page,'.play-turn button',true);
   } else {
    await page.goto(new URL('next.html',base).href);await page.locator('.play-home').waitFor();
    await page.evaluate(async state=>{
     const {Game}=await import('/src/game.ts'),{rulesOf}=await import('/src/interface/play/saved.ts');
     const hands=state==='armed-power'?[]:['Freeze','IceWall','Haste','Flight'];
     const game=new Game('RNBQKBNR',rulesOf(state==='armed-power'?'powers':'both',[state==='armed-power'?{king:'Frost',power:'Freeze'}:{king:'Spirit',power:'Mercy'},{king:'Shadow',power:'Darkness'}],[hands,hands]));
     localStorage.setItem('kingdown.save',JSON.stringify({back:'',fen:'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1',moves:[],white:'human',black:'ai',skill:'casual',coords:true,resigned:null,rules:game.rules,pace:'off'}));
    },state);
    await page.reload();await page.locator('.home-game-row[data-kind=computer]').click();
    await page.locator('.play-game[data-state=ready]').waitFor();await page.locator('.play-home,.shell-departing').waitFor({state:'detached'});await page.locator('.play-board-host[style*="visibility: hidden"]').waitFor({state:'detached'});
    if(state==='result') {
     const before=await page.evaluate(()=>{const box=s=>document.querySelector(s).getBoundingClientRect();return {boardTop:box('.play-board').top,topBottom:box('.play-opp').bottom,hostTop:box('.play-board-host').top};});
     await page.getByRole('button',{name:'Menu',exact:true}).tap();await page.getByRole('button',{name:'Resign',exact:true}).tap();
     await page.locator('dialog[open]').getByRole('button',{name:'Resign',exact:true}).tap();await page.locator('.play-result').waitFor();
     await page.waitForFunction(()=>{
      let node=document.querySelector('.play-result');
      if(!node||document.querySelector('dialog[open], .shell-dialog-ghost, .shell-dialog-scrim'))return false;
      for(;node;node=node.parentElement){const css=getComputedStyle(node);if(css.opacity!=='1'||css.visibility!=='visible'||css.display==='none')return false;}
      return true;
     });
     await visibleBounds(page,'.play-opponent-group > strong');await visibleBounds(page,'.play-opp > button',true);await visibleBounds(page,'.play-result');
     const boxes=await page.evaluate(()=>{const box=s=>document.querySelector(s).getBoundingClientRect().toJSON(),game=document.querySelector('.play-game');return {top:box('.play-opp'),board:box('.play-board'),host:box('.play-board-host'),result:box('.play-result'),portrait:game.dataset.layout==='portrait',height:innerHeight};});
     check(boxes.top.top>=0&&boxes.top.bottom<=height,`${label}: top line stays visible ${JSON.stringify(boxes.top)}`);
     check(boxes.board.top-boxes.host.top<=before.boardTop-before.hostTop+1,`${label}: no new band inside the board host: gap ${boxes.board.top-boxes.host.top}, normal gap ${before.boardTop-before.hostTop}`);
     check(boxes.board.top<=before.boardTop+1,`${label}: no empty band above the board: board top ${boxes.board.top}, normal top ${before.boardTop}`);
     if(boxes.portrait)check(boxes.board.top-boxes.top.bottom<=before.boardTop-before.topBottom+1,`${label}: the top line keeps its normal board gap: gap ${boxes.board.top-boxes.top.bottom}, normal gap ${before.boardTop-before.topBottom}`);
     check(boxes.result.bottom<=height,`${label}: result bottom ${boxes.result.bottom}, screen bottom ${height}`);
    } else {
     await page.locator(state==='armed-power'?'.play-own .play-power':'.play-own .play-card').filter({hasText:'Freeze'}).tap();
     check(await page.locator('.play-step').innerText()==='Choose a target.',`${label}: full target instruction`);
     await visibleBounds(page,'.play-step');await visibleBounds(page,'.play-detail button',true);
    }
   }
   const metrics=await stateRules(page,label);check(!errors.length,`${label}: no page errors ${errors}`);
   await page.screenshot({path:`${out}/${label}.png`});results.push({label,pass:true,metrics});console.log(`PASS ${label}`);
  }catch(error){await page.screenshot({path:`${out}/${label}-failure.png`});results.push({label,pass:false,error:error.message});console.log(`FAIL ${label}: ${error.message}`);}
  finally{await context.close();}
 }
 if(!selectedCases) {
 const context = await browser.newContext({viewport:{width:390,height:844},reducedMotion:'no-preference'});
 const page = await context.newPage(); await context.route(/supabase\.co/, r=>r.abort());
 await context.addInitScript(()=>localStorage.setItem('kingdown.game-options',JSON.stringify({pool:['G','A','M','O','L','S']})));
 // The opening tags live about one second. The page records each tag's font size when the tag arrives, so a slow driver cannot miss them.
 await context.addInitScript(()=>{window.round2TagSizes=[];new MutationObserver(list=>{for(const m of list)for(const n of m.addedNodes)if(n.nodeType===1)for(const tag of [n,...n.querySelectorAll('.play-tag')])if(tag.matches('.play-tag'))window.round2TagSizes.push(parseFloat(getComputedStyle(tag).fontSize));}).observe(document,{childList:true,subtree:true});});
 try {
  await page.goto(new URL('next.html',base).href); await page.locator('.play-home').waitFor();
  await page.locator('.home-hero-new, .home-top-new:visible, .home-side-new:visible').first().click();
  const panel=page.locator('dialog.new-game-panel');
  await panel.getByRole('checkbox',{name:/With powers/}).setChecked(false);await panel.getByRole('checkbox',{name:/With cards/}).setChecked(false);
  await panel.getByRole('button',{name:'Start game',exact:true}).click();
  await page.locator('.play-game[data-state=ready]').waitFor();await page.locator('.play-home').waitFor({state:'detached'});
  await page.waitForFunction(()=>window.round2TagSizes.length>0);
  const tagSizes=await page.evaluate(()=>window.round2TagSizes);
  check(tagSizes.length>0&&tagSizes.every(px=>px>=14),`${engine.name()}: opening tags use at least 14 px: ${tagSizes}`);
  const undo=page.getByRole('button',{name:'Undo',exact:true});
  check(await undo.getAttribute('aria-disabled')==='true',`${engine.name()}: first turn Undo is off`);
  check(await undo.locator('[data-icon=undo]').count()===1,`${engine.name()}: first turn uses undo ink`);
  await page.locator('.play-square[data-square="12"]').click();await page.locator('.play-square[data-square="28"]').click();
  await undo.click();check(await undo.getAttribute('aria-disabled')==='true',`${engine.name()}: first-turn Undo returns to off`);
  await page.locator('.play-square[data-square="12"]').click();await page.locator('.play-square[data-square="28"]').click();
  await page.getByRole('button',{name:'End turn',exact:true}).click();await page.locator('.play-game[data-state=ready]').waitFor({timeout:45000});
  const saved=await page.evaluate(()=>localStorage.getItem('kingdown.save'));
  await page.getByRole('button',{name:'Replay',exact:true}).click();
  await page.locator('.play-game[data-replaying=true]').waitFor();
  await page.locator('.play-game[data-replaying=false]').waitFor({timeout:20000});
  check(await page.evaluate(()=>localStorage.getItem('kingdown.save'))===saved,`${engine.name()}: moving replay preserves the position and save`);
  await page.getByRole('button',{name:'Replay',exact:true}).click();await page.locator('.play-game[data-replaying=true]').waitFor();
  await page.locator('.play-square[data-square="11"]').click();
  check(await page.locator('.play-game').getAttribute('data-replaying')==='false',`${engine.name()}: input stops replay before it acts`);
  check(await page.locator('.play-square[data-square="11"]').getAttribute('aria-selected')==='true',`${engine.name()}: input acts on the restored board`);
  results.push({label:`${engine.name()}-first-turn-and-motion`,pass:true});
 }catch(error){results.push({label:`${engine.name()}-first-turn-and-motion`,pass:false,error:error.message});console.log(`FAIL motion: ${error.message}`);}
 finally{await context.close();}
 }
 for(const name of caseNames) {
  if(selectedCases&&!selectedCases.includes(name))continue;
  const caseSizes=name==='result-resize'?[[430,932]]:name==='result-rotate'?[[844,390]]:name==='promotion-replay'||name==='result-panel'||name==='result-panel-tap'||name==='result-board-tap'?[[390,844]]:[[390,844],[430,932],[360,640],[390,763]];
  for(const [width,height] of caseSizes) {
   const context=await browser.newContext({viewport:{width,height},reducedMotion:name==='promotion-replay'||name==='result-panel-tap'||name==='result-board-tap'?'no-preference':'reduce',hasTouch:true,serviceWorkers:'block'});
   await context.route(/supabase\.co/,r=>r.abort());
   const page=await context.newPage(),errors=[],metrics=[],label=`${engine.name()}-${width}x${height}-${name}`;
   page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
   try {
    if(name==='promotion-replay'||name==='result-panel'||name==='result-panel-tap'||name==='result-board-tap')await observeBoard(context);
    await seedResult(page,name==='promotion-replay');
    if(name==='promotion-replay') {
     await page.locator('.play-square[data-square="48"]').tap();await page.locator('.play-square[data-square="56"]').tap();
     await page.locator('.play-game[data-state=choice]').waitFor();
     check(await page.evaluate(()=>!matchMedia('(prefers-reduced-motion: reduce)').matches&&document.documentElement.dataset.motion==='normal'),`${label}: full motion`);
     await page.evaluate(()=>window.round2Board.events=[]);
     // One page task: Replay starts, its first step is checked, and Queen is chosen while that step plays. A slow driver cannot let the next step start first.
     const replay=await page.evaluate(()=>{
      const named=name=>[...document.querySelectorAll('.play-game button')].filter(b=>(b.getAttribute('aria-label')??b.textContent.trim())===name);
      const [replayButton]=named('Replay');replayButton.click();
      const replaying=document.querySelector('.play-game').dataset.replaying,first=window.round2Board.events.filter(e=>e.kind==='start'),pending=window.round2Board.pending;
      const queens=named('Queen');queens[0]?.click();
      return {replaying,first,pending,queens:queens.length,starts:window.round2Board.events.filter(e=>e.kind==='start')};
     });
     const {first,starts}=replay;
     check(replay.replaying==='true'&&replay.queens===1,`${label}: Replay plays and one Queen choice shows: ${JSON.stringify(replay)}`);
     check(first.length===1&&first[0].move.power==='freeze'&&replay.pending>=1,`${label}: the first Replay step is still playing: ${JSON.stringify(replay)}`);
     check(starts.length===2&&starts[1].move.promo&&starts[1].replaying==='false',`${label}: Replay stops before promotion starts: ${JSON.stringify(starts)}`);
     await page.waitForFunction(()=>window.round2Board.pending===0&&document.querySelector('.play-game')?.dataset.state==='draft');
     const promoted=async()=>{
      check(/Queen/.test(await page.locator('.play-square[data-square="56"]').getAttribute('aria-label')),`${label}: Queen stands on a8`);
      const value=await page.evaluate(async()=>{const save=JSON.parse(localStorage.getItem('kingdown.save')),{readStored}=await import('/src/interface/play/saved.ts');const loaded=readStored();return {saved:save,board:window.round2Board.position.board[56],draft:loaded?.resume?.draft.position.board[56]};});
      check(value.board===5&&value.draft===5,`${label}: the rendered board and saved draft have a Queen on a8: ${JSON.stringify(value)}`);
      return value.saved;
     };
     const saved=await promoted();
     // All cancelled play promises finish before the extra frame turns check for a later restore.
     await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
     check(JSON.stringify(await promoted())===JSON.stringify(saved),`${label}: no later Replay step restores the old board or save`);
     check((await page.evaluate(()=>window.round2Board.events.filter(e=>e.kind==='start').length))===2,`${label}: Replay never starts its second step`);
     check(!(await page.locator('.play-detail').innerText()).includes('The board already plays an action.'),`${label}: no busy-board notice`);
    } else {
     await page.locator('.play-square[data-square="8"]').tap();await page.locator('.play-square[data-square="16"]').tap();
     if(name==='result-panel') {
      const opened=await page.evaluate(()=>{document.querySelector('.play-turn button.kd-button-main, .play-turn button:last-child').click();document.querySelector('.play-opp .play-power').click();const g=document.querySelector('.play-game');return {state:g.dataset.state,floating:document.querySelector('.play-reader').dataset.floating};});
      check(opened.state==='thinking'&&opened.floating==='true',`${label}: the computer panel opens during the live reply: ${JSON.stringify(opened)}`);
     } else {
      // Decision 129: a tap while the computer's mating move still plays must not replace the result.
      // The page watches before End turn, so the tap cannot come too late on a slow driver.
      if(name==='result-panel-tap'||name==='result-board-tap')await page.evaluate(target=>{window.round2Tap=(async()=>{
       for(let frame=0;frame<3600;frame++) {
        await new Promise(resolve=>requestAnimationFrame(resolve));
        const game=document.querySelector('.play-game'),save=JSON.parse(localStorage.getItem('kingdown.save')||'{"moves":[]}');
        if(game.querySelector('.play-result'))return {ok:false,why:'the result shows before the tap',frame};
        if(save.moves.length<2)continue;
        if(window.round2Board.pending<1)return {ok:false,why:'the mating move ends before the tap',frame};
        const before={state:game.dataset.state,reading:game.dataset.reading,pending:window.round2Board.pending},node=game.querySelector(target);
        node.click();
        return {ok:true,frame,before,label:node.getAttribute('aria-label'),live:[...document.querySelectorAll('body > [role=status]')].map(n=>n.textContent),after:{reading:game.dataset.reading,floating:document.querySelector('.play-reader').dataset.floating}};
       }
       return {ok:false,why:'the computer does not reply'};
      })();},name==='result-panel-tap'?'.play-opp .play-power':'.play-square[data-square="7"]');
      await page.getByRole('button',{name:'End turn',exact:true}).tap();
     }
     if(name==='result-panel-tap'||name==='result-board-tap') {
      const tapped=await page.evaluate(()=>window.round2Tap);
      check(tapped.ok&&tapped.before.state==='thinking'&&tapped.before.reading!=='result',`${label}: the tap lands while the mating move plays: ${JSON.stringify(tapped)}`);
      if(name==='result-board-tap') {
       check(/King/.test(tapped.label),`${label}: the tap is on a square with a piece: ${JSON.stringify(tapped)}`);
       check(tapped.live.some(t=>t.endsWith('The computer wins. Checkmate.')),`${label}: the live region keeps the result after the board tap: ${JSON.stringify(tapped)}`);
      }
      await page.waitForFunction(()=>window.round2Board.pending===0);
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      const kept=await page.evaluate(()=>{const game=document.querySelector('.play-game');return {reading:game.dataset.reading,result:!!game.querySelector('.play-result'),floating:document.querySelector('.play-reader').dataset.floating,focus:document.activeElement?.textContent?.trim()};});
      check(kept.reading==='result'&&kept.result&&kept.floating!=='true',`${label}: the result keeps its place after the tap: ${JSON.stringify({tapped,kept})}`);
      check(await page.getByRole('button',{name:'Rematch',exact:true}).isVisible(),`${label}: Rematch stays after the tap`);
      if(name==='result-board-tap') {
       const live=await page.evaluate(()=>[...document.querySelectorAll('body > [role=status]')].map(n=>n.textContent));
       check(live.some(t=>t.endsWith('The computer wins. Checkmate.')),`${label}: no later step replaces the result announcement: ${JSON.stringify(live)}`);
       check(kept.focus==='Rematch',`${label}: the focus stays on Rematch: ${JSON.stringify(kept)}`);
      }
     }
     await page.locator('.play-result').waitFor({timeout:45000});
     if(name==='result-menu-close'||name==='result-menu-escape') {
      await page.getByRole('button',{name:'Menu',exact:true}).tap();await page.locator('.game-menu').waitFor();
      if(name==='result-menu-close')await page.getByRole('button',{name:'Close menu',exact:true}).tap();else await page.keyboard.press('Escape');
      await page.locator('.game-menu').waitFor({state:'detached'});
     }
     if(name==='result-panel') {
      const end=await page.evaluate(()=>{const reader=document.querySelector('.play-reader'),strip=document.querySelector('.play-history-strip'),moves=window.round2Board.events.filter(e=>e.kind==='start'&&e.move.to!==undefined);return {lastMove:moves.at(-1),floating:reader.dataset.floating,readerTop:reader.getBoundingClientRect().top,stripBottom:strip.getBoundingClientRect().bottom};});
      check(end.lastMove?.floating==='true',`${label}: the panel stays open when the mating move starts: ${JSON.stringify(end)}`);
      check(end.floating!=='true'&&end.readerTop>=end.stripBottom-0.5,`${label}: the result reader docks after the computer panel: ${JSON.stringify(end)}`);
     }
     metrics.push(await longResultRules(page,label,errors));
     for(const [w,h] of name==='result-resize'?[[390,808],[390,784],[430,932]]:name==='result-rotate'?[[390,844]]:[]) {
      await page.setViewportSize({width:w,height:h});
      await page.waitForFunction(([w,h])=>{const g=document.querySelector('.play-game').getBoundingClientRect();return g.width===w&&g.height===h;},[w,h]);
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      metrics.push(await longResultRules(page,`${label}-to-${w}x${h}`,errors));
     }
    }
    check(!errors.length,`${label}: no page errors ${errors}`);
    await page.screenshot({path:`${out}/${label}.png`});results.push({label,pass:true,metrics});console.log(`PASS ${label}`);
   } catch(error) {
    await page.screenshot({path:`${out}/${label}-failure.png`});results.push({label,pass:false,error:error.message,metrics});console.log(`FAIL ${label}: ${error.message}`);
   } finally {await context.close();}
  }
 }
 } finally { await browser.close(); }
}
writeFileSync(`${out}/round2-b.json`,JSON.stringify({checks:count,results},null,2));
const failed=results.filter(r=>!r.pass);console.log(`${count} assertions; ${results.length-failed.length} cases pass, ${failed.length} fail`);
if(!results.length)console.log('FAIL no case ran');
process.exitCode=failed.length||!results.length?1:0;
