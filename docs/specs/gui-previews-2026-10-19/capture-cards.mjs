import { register } from 'tsx/esm/api';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
register();
const { startHarness } = await import('../../../tools/plugin-ui-harness.ts');
const { DEFAULT_OPTIONS } = await import('../../../src/match/setup.ts');
const { RULES, setRules, legalMoves } = await import('../../../src/rules/engine.ts');
const { fromFen, toFen, toLan } = await import('../../../src/rules/setup.ts');
const [out, phase, build, only] = process.argv.slice(2);
await mkdir(out, { recursive: true });
const wanted = item => !only || only.split(',').includes(item);
const webOnly = process.argv.includes('--web-only');
const browser = await chromium.launch({ headless: true });
let harness, web;
try {
  harness = await startHarness({ boardPath: resolve(build, 'board.html'), sourcePage: !process.argv.includes('--built') });
  for (const [width, height] of (webOnly ? [] : [[390,844],[1280,800]])) for (const theme of ['light','dark']) {
    const ctx = await browser.newContext({ viewport: {width,height}, deviceScaleFactor: 2, colorScheme: theme, isMobile: width === 390, hasTouch: width === 390, serviceWorkers: 'block' });
    const p = await ctx.newPage(); p.setDefaultTimeout(10000);
    let sampleView;
    if (process.argv.includes('--built')) await p.route('**/fixture-tool', async route => {
      if (sampleView && route.request().postDataJSON()?.name === 'kingdown_get') await route.fulfill({json:{content:[],structuredContent:{game_id:sampleView.game_id},_meta:{view:sampleView}}});
      else await route.continue();
    });
    await p.addInitScript(theme => { window.harnessHostContext = {theme,displayMode:'fullscreen'}; }, theme);
    await p.goto(harness.url); const f = p.frameLocator('iframe');
    await f.locator('#home-play:not(:disabled)').waitFor({state:'attached'});
    await p.addStyleTag({content:'#remount{display:none}iframe{height:100dvh!important}'});
    await p.evaluate(() => window.harnessSetContext({displayMode:'fullscreen'}));
    async function shot(item, name) {
      await f.locator('html').evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))); });
      await p.waitForTimeout(180);
      await p.screenshot({path:resolve(out,`${item}-plugin-${name}-${width}x${height}-${theme}-${phase}.png`)});console.log(item,name,width,theme);
    }
    async function open(screen) {
      if (process.argv.includes('--built')) {
        const route=screen==='collection'?'profile':screen;
        const result=await (await p.request.post(new URL('/fixture-tool',harness.url).href,{data:{name:'kingdown_open',arguments:{screen:route}}})).json();
        await p.evaluate(result=>window.harnessShow(result,true),result);
        if(screen==='collection') await f.locator('[data-screen="profile"] [data-nav="collection"]').click();
      } else await f.locator('html').evaluate((_,screen)=>window.harnessApp.navigate(screen),screen);
      await f.locator(`[data-screen="${screen}"]:not([hidden])`).waitFor();
    }
    async function scrollShots(item,name,pane) {
      await pane.evaluate(e=>e.scrollTop=0); await shot(item,name);
      const {h,total}=await pane.evaluate(e=>({h:e.clientHeight,total:e.scrollHeight}));
      for(let y=h*.8,n=2;y<total;y+=h*.8,n++) {
        const at=await pane.evaluate((e,y)=>{e.scrollTop=y;return e.scrollTop;},y); await shot(item,`${name}-scroll-${n}`);
        if(at+h>=total-1) break;
      }
    }
    if(wanted('A5')||wanted('A33')) {
      await open('play');
      await f.locator('#setup-options').evaluate(e=>{e.open=true;});
      await f.locator('#setup-toggle-cards').check();
      if(wanted('A5')) await shot('A5','setup-cards');
      for(const item of ['A5','A33'].filter(wanted)) await scrollShots(item,'card-pool',f.locator('#setup-card-pool'));
    }
    for(const item of ['A5','A33','A40'].filter(wanted)) {
      await open('collection');
      for(const tab of (item==='A40'?['Pieces','Kings','Powers','Cards']:['Cards'])) {
        await f.locator(`#collection-tabs input[value="${tab}"]`).locator('..').click();
        await scrollShots(item,`collection-${tab.toLowerCase()}`,f.locator('#collection-sheet .new-game-body'));
      }
    }
    async function board(hands, extra={}) {
      setRules({hands}); const pos=fromFen('7k/6p1/8/8/8/8/P7/KN5R w - - 0 1');
      if (extra.spent) pos.used=[1,0];
      const fen=toFen(pos);delete extra.spent;
      const next={game_id:crypto.randomUUID(),revision:0,created_at:'2026-10-19T00:00:00Z',abort_open:false,seat:0,kind:'solo',speed:'daily',days_per_move:3,status:'playing',turn:0,action:'ready',fen,in_check:false,legal:legalMoves(pos).map(m=>toLan(pos,m)),last_commands:[],opponent:{handle:null,icon:null,computer:true,deleted:false,last_seen_ms:null},draw_offer:null,deadline_at:null,server_now:'2026-10-19T00:00:00Z',rules:structuredClone(RULES),...extra};
      if (process.argv.includes('--built')) {sampleView=next;await p.evaluate(view=>window.harnessShow({content:[],structuredContent:{screen:'board',game_id:view.game_id},_meta:{view,board_id:'card-preview'}},true),next);}
      else await f.locator('html').evaluate((_,next)=>window.harnessApp.routeView(next),next);
      await f.locator('#board[aria-busy="false"]').waitFor();
    }
    for(const item of ['A5','A16','A33','A35'].filter(wanted)) {
      await board(item==='A33'?[['Curse','MirrorB','MorphP','FireStarter'],['Burn','Rally','Control','EarthQuake']]:[['Strike','Haste','Flight','March'],['Freeze','IceWall','Leap','Salvation']]);
      if(item==='A5'||item==='A33') await shot(item,'board-cards');
      const coins=item==='A5'?[0,1,2]:[0];
      for(const i of coins) {
        await f.locator(`#card-w-${i}`).click(); await shot(item,`card-read-${i}`); await f.locator('#board-sheet [aria-label="Close"]').click();
      }
      if(item==='A16'||item==='A35') {
        await board(item==='A35'?[['MirrorB'],['Burn']]:[['Curse','MirrorB','MorphP','FireStarter'],['Burn','Rally','Control','EarthQuake']]);
        await f.locator(item==='A35'?'#card-w-0':'#card-w-1').click(); await shot(item,'card-no-move'); await f.locator('#board-sheet [aria-label="Close"]').click();
      }
      if(item==='A35') {
        await f.locator('#card-b-0').click(); await shot(item,'card-opponent'); await f.locator('#board-sheet [aria-label="Close"]').click();
        await board([['MirrorB'],['Burn']],{spent:true});await f.locator('#card-w-0').click();await shot(item,'card-spent');await f.locator('#board-sheet [aria-label="Close"]').click();
      }
    }
    await ctx.close();
  }
  if(wanted('A5')||wanted('A33')) {
    web = await createServer({server:{host:'127.0.0.1',port:0,strictPort:true},logLevel:'error'}); await web.listen();
    for(const [width,height] of [[390,844],[1440,900]]) {
      const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:2,isMobile:width===390,hasTouch:width===390,serviceWorkers:'block'}),p=await ctx.newPage();p.setDefaultTimeout(10000);
      console.log('Web opens',width);p.on('pageerror',e=>console.log('Web error',e.message));await p.goto(web.resolvedUrls.local[0]+'?title=0&players=human,human'); await p.waitForFunction(()=>!!document.getElementById('menu-btn')?.onclick);
      console.log('Web menu',width);await p.locator('#menu-btn').click(); await p.locator('[data-go="extra"]').click();console.log('Web workshop');await p.locator('#workshop-btn').click();await p.locator('#pg-tab-cards').click();
      const shot=async(item,name)=>{console.log('Web capture',item,name);await p.evaluate(()=>document.fonts.ready);await p.waitForFunction(()=>[...document.querySelectorAll('#workshop img')].filter(i=>i.checkVisibility()&&i.hasAttribute('src')).every(i=>i.complete));await p.waitForTimeout(180);await p.screenshot({path:resolve(out,`${item}-web-${name}-${width}x${height}-light-${phase}.png`)});};
      for(const item of ['A5','A33'].filter(wanted)) await shot(item,'workshop-cards');
      // The stack holds the cards with no painting in the base.
      if(await p.locator('[data-lab="Strike"]').count()===0) await p.locator('[data-act="cardsall"]').click();
      if(wanted('A5')) for(const card of ['Strike','Haste','Flight']) { await p.locator(`[data-lab="${card}"]`).click();await shot('A5',`workshop-${card.toLowerCase()}`); }
      if(wanted('A33')) {
        if(await p.locator('[data-lab="Burn"]').count()===0) await p.locator('[data-act="cardsall"]').click();
        await shot('A33','workshop-more-cards');await p.locator('[data-lab="Burn"]').click();await shot('A33','workshop-burn');
      }
      await ctx.close();
    }
  }
} finally { await web?.close(); await harness?.close(); await browser.close(); }
console.log(`Capture ${phase} ${only||'all'} complete`);
