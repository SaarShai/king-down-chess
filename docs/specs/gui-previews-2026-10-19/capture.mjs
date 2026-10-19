// Run through the lane's plugin-ui check with KD_GUI_PREVIEW and KD_GUI_PREVIEW_ROOT.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { register } from 'tsx/esm/api';
import { preview } from 'vite';
import { chromium } from 'playwright';
const unregister = register();
const { startHarness } = await import('../../../tools/plugin-ui-harness.ts');
const root = process.env.KD_GUI_PREVIEW_ROOT || '/tmp/kd-gui-prev-board-previews';
const out = join(root, 'previews'); await mkdir(out, { recursive: true });
const item = process.env.KD_GUI_PREVIEW || JSON.parse(await (await import('node:fs/promises')).readFile(new URL('./capture.json', import.meta.url), 'utf8')).item;
const all = ['A14','A15','A17','A18','A27','A39','A8'];
const browser = await chromium.launch({ headless: true });
let baseline, current, web;
const notes = [];
try {
  current = await startHarness({ boardPath: join(process.argv[2], 'board.html') });
  const phases = item === 'base' ? ['before', 'after'] : ['after'];
  for (const phase of phases) {
    const items = phase === 'before' || item === 'all' ? all : [item === 'base' ? 'A14' : item];
    let pluginURL = current.url, webURL = process.env.PLAYABLE_URL;
    if (phase === 'before') {
      baseline = await startHarness({ boardPath: join(root, 'base-plugin/board.html') }); pluginURL = baseline.url;
      web = await preview({ configFile: false, logLevel: 'error', build: { outDir: join(root, 'base-web') }, preview: { host: '127.0.0.1', port: 0, strictPort: true } });
      webURL = web.resolvedUrls.local[0];
    }
    for (const width of [390,1280]) for (const theme of ['light','dark']) {
      const height = width === 390 ? 844 : 800;
      const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, hasTouch: width === 390, colorScheme: theme, serviceWorkers: 'block' });
      const p = await ctx.newPage(); p.setDefaultTimeout(10000);
      await p.addInitScript(theme => { window.harnessHostContext = { theme, displayMode: 'fullscreen' }; window.harnessDisplayMode = 'fullscreen'; }, theme);
      await p.goto(pluginURL); await p.waitForFunction(() => window.harnessShow && window.harnessBoots > 0);
      await p.addStyleTag({ content: '#remount{display:none}body{margin:0}iframe{height:100dvh!important}' });
      const f = p.frameLocator('iframe'); await f.locator('#home-play:not(:disabled)').waitFor({ state: 'attached' });
      async function ready() { await f.locator('#board[aria-busy="false"]:not([data-animating="true"])').waitFor(); await f.locator('html').evaluate(() => document.fonts.ready); }
      async function seed(fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1', extra = {}) {
        const r = await (await p.request.post(new URL('/fixture-position?fen=' + encodeURIComponent(fen), pluginURL).href)).json(); assert(!r.isError);
        Object.assign(r._meta.view, extra);
        await p.evaluate(r => { window.harnessNextView = r._meta.view; return window.harnessShow(r); }, r);
        await ready();
      }
      async function tap(sq) {
        const box = await f.locator('canvas').boundingBox();
        await p.mouse.click(box.x + (32 + (sq % 8 + .5) * 112) * box.width / 960, box.y + (96 + (7 - (sq >> 3) + .5) * 112) * box.width / 960);
        await ready();
      }
      async function shot(id, screen) {
        await p.waitForTimeout(400);
        const file = `${id}-plugin-${screen}-${width}x${height}-${theme}-${phase}.png`;
        await p.locator('iframe').screenshot({ path: join(out,file) }); notes.push(file);
      }
      for (const id of items) {
        if (id === 'A39') continue;
        await seed();
        if (id === 'A14') {
          await tap(12); await tap(28); await shot(id,'turn-computer');
          if (phase === 'after') assert.equal(await f.locator('#end-turn .turn-label').innerText(), 'End turn');
          await seed(undefined, { kind: 'friend', opponent: { handle: 'mira_k', computer: false, deleted: false } });
          await tap(12); await tap(28); await shot(id,'turn-person');
          if (phase === 'after') {
            assert.equal(await f.locator('#end-turn .turn-label').innerText(), 'Send your turn');
            const fit = await f.locator('#end-turn').evaluate(e => { const b=e.getBoundingClientRect(), s=getComputedStyle(e); return { font:s.fontSize, bold:s.fontWeight, fits:e.scrollWidth<=e.clientWidth, height:b.height }; });
            assert.equal(fit.font,'16px'); assert.equal(fit.bold,'700'); assert(fit.fits && fit.height >= 44, JSON.stringify(fit));
          }
        }
        if (id === 'A15') { await tap(4); await shot(id,'selected-behind'); }
        if (id === 'A17') {
          await seed('7k/8/8/4p3/8/8/P7/K7 w - - 0 1 me5w2', { rules: { kings: [{king:'Frost',power:'Freeze'},null] } });
          await shot(id,'frozen');
        }
        if (id === 'A18') {
          await tap(12); await tap(28);
          await f.locator('#board-menu').click(); await f.getByRole('button',{name:'Moves',exact:true}).click(); await shot(id,'moves-empty');
          if (phase === 'after') assert.equal(await f.locator('#board-sheet .sheet-body').innerText(),'No turns sent yet.');
          await f.locator('#board-sheet [aria-label="Close"]').click();
        }
        if (id === 'A27') {
          await shot(id,'moves-start');
          if (phase === 'after' && width === 390) assert(await f.locator('#recent-moves').isHidden(),'The empty band stays shut');
          await tap(12); await tap(28); await shot(id,'moves-staged');
          if (phase === 'after' && width === 390) assert(await f.locator('#recent-moves').isHidden(),'A staged move is not sent history');
          await p.evaluate(() => window.holdBeforeNext='kingdown_computer');
          await f.locator('#end-turn[aria-disabled="false"]').click();
          await p.waitForFunction(() => window.harnessView.last_commands?.length > 0); await ready(); await shot(id,'moves-sent');
          if (phase === 'after' && width === 390) {
            assert(await f.locator('#recent-moves').isVisible(),'The first sent move opens the band');
            await f.locator('#moves-line').click(); assert(await f.locator('#recent-moves').isHidden(),'A manual close stays shut');
            await p.setViewportSize({width:width+1,height}); await p.setViewportSize({width,height});
            assert(await f.locator('#recent-moves').isHidden(),'Resize keeps the manual choice');
          }
          await p.evaluate(() => window.releaseBefore?.()); await ready();
        }
        if (id === 'A8') {
          await f.locator('#board-menu').click(); await f.getByRole('button',{name:'Settings',exact:true}).click(); await shot(id,'settings');
          if (phase === 'after') {
            const pace = f.locator('#animations');
            for (const value of ['fast','off','normal']) { await pace.selectOption(value); assert.equal(await pace.inputValue(),value); }
          }
        }
      }
      await ctx.close();
    }
    for (const width of [390,1440]) {
      const height=width===390?844:900;
      const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:2,serviceWorkers:'block'});
      const p=await ctx.newPage();p.setDefaultTimeout(10000);
      async function open(fen, args='') { await p.goto(webURL+'?title=0&players=human,human&fen='+encodeURIComponent(fen)+args);await p.waitForFunction(()=>window.view?.ready);await p.evaluate(()=>window.view.ready());await p.evaluate(()=>document.fonts.ready); }
      async function tap(sq){ const point=await p.evaluate(sq=>window.view.screenOf(sq),sq);await p.mouse.click(point.x,point.y);await p.waitForTimeout(400); }
      async function shot(id,screen){const file=`${id}-web-${screen}-${width}x${height}-light-${phase}.png`;await p.screenshot({path:join(out,file)});notes.push(file);}
      for(const id of items) {
        if(id==='A15'){await open('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1');await tap(4);await shot(id,'selected-behind');}
        if(id==='A17'){await open('7k/8/8/4p3/8/8/P7/K7 w - - 0 1 me5w2','&kings=Frost:Freeze,none');await shot(id,'frozen');}
        if(id==='A39'){await open('7k/8/8/3p4/3O4/8/8/K7 w - - 0 1');await tap(27);await tap(35);await p.locator('#move-choice[open]').waitFor();await shot(id,'take-shove');if(phase==='after'){const bounds=await p.evaluate(()=>{const b=document.querySelector('#board').getBoundingClientRect(),d=document.querySelector('#move-choice').getBoundingClientRect(),q=window.view.screenOf(35);return {board:b.bottom,top:d.top,bottom:d.bottom,height:innerHeight,target:q.y};});assert(bounds.top>bounds.target && bounds.bottom<=bounds.height,JSON.stringify(bounds));}}
        if(id==='A8'){await open('7k/8/8/8/8/8/P7/K7 w - - 0 1');await p.locator('#menu-btn').click();await p.locator('[data-go="help"]').click();await shot(id,'settings');}
      }
      await ctx.close();
    }
  }
  await writeFile(join(root,`capture-${item}.json`),JSON.stringify(notes,null,2)+'\n');
  console.log(`Board previews: ${notes.length} screens at device scale 2 (${item}).`);
} finally { await browser.close(); await baseline?.close(); await current?.close(); await new Promise(resolve => web ? web.httpServer.close(resolve) : resolve()); unregister(); }
