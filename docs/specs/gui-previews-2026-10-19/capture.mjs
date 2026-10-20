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
const item = process.argv[3] || process.env.KD_GUI_PREVIEW;
assert(item, 'Name the preview item');
assert(['A14','A15','A17','A18','A27','A39','A8'].includes(item), 'Name a board preview item');
const browser = await chromium.launch({ headless: true });
let current, web;
const notes = [];
function watchFrost() {
  const clear = CanvasRenderingContext2D.prototype.clearRect, draw = CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.clearRect = function (...args) {
    if (this.canvas.closest('#board')) window.frostDraws = [];
    return clear.apply(this,args);
  };
  CanvasRenderingContext2D.prototype.drawImage = function (image,...args) {
    if (this.canvas.closest('#board') && image instanceof HTMLImageElement && image.src.startsWith('data:image/svg+xml,')) {
      const svg = decodeURIComponent(image.src);
      if (svg.includes('kdm-frost')) (window.frostDraws ??= []).push({svg,box:args});
    }
    return draw.call(this,image,...args);
  };
}
async function assertFrost(locator, turns) {
  await locator.evaluate(async (_, turns) => {
    for (let tries = 0; tries < 100; tries++) {
      const marks = window.frostDraws ?? [];
      if (turns ? marks.length === 2 && marks[0].svg.includes('fill="url(#kdm-frost)"') && (marks[1].svg.match(/<circle /g) ?? []).length === turns : marks.length === 0) return;
      await new Promise(resolve => setTimeout(resolve,20));
    }
    throw new Error(`Frost draw mismatch: turns=${turns}, pips=${window.frostDraws?.map(m => (m.svg.match(/<circle /g) ?? []).length)}`);
  },turns);
}
try {
  const { existsSync } = await import('node:fs');
  const snapshot = process.argv[4] === 'before' ? 'base' : item;
  const saved = join(root, `${snapshot}-plugin/board.html`);
  const pluginPath = process.argv[4] === 'before' ? saved : join(process.argv[2], 'board.html');
  assert(existsSync(pluginPath), `Missing saved preview build: ${pluginPath}`);
  current = await startHarness({ boardPath: pluginPath });
  const savedWeb = join(root, `${snapshot}-web`);
  if (['A15','base'].includes(snapshot)) {
    assert(existsSync(savedWeb), `Missing saved web build: ${savedWeb}`);
    web = await preview({ configFile: false, logLevel: 'error', build: { outDir: savedWeb }, preview: { host: '127.0.0.1', port: 0, strictPort: true } });
  }
  const phases = [process.argv[4] || 'after'];
  for (const phase of phases) {
    const items = [item];
    let pluginURL = current.url, webURL = web?.resolvedUrls.local[0] || process.env.PLAYABLE_URL;
    for (const width of [390,1280]) for (const theme of ['light','dark']) {
      const height = width === 390 ? 844 : 800;
      const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, hasTouch: width === 390, colorScheme: theme, serviceWorkers: 'block' });
      const p = await ctx.newPage(); p.setDefaultTimeout(10000);
      if (item === 'A17') await p.addInitScript(watchFrost);
      await p.addInitScript(theme => { window.harnessHostContext = { theme, displayMode: 'fullscreen' }; window.harnessDisplayMode = 'fullscreen'; }, theme);
      await p.goto(pluginURL); await p.waitForFunction(() => window.harnessShow && window.harnessBoots > 0);
      await p.addStyleTag({ content: '#remount{display:none}body{margin:0}iframe{height:100dvh!important}' });
      const f = p.frameLocator('iframe'); await f.locator('#home-play:not(:disabled)').waitFor({ state: 'attached' });
      async function ready() { await f.locator('#board[aria-busy="false"]:not([data-animating="true"])').waitFor(); await f.locator('html').evaluate(() => document.fonts.ready); }
      async function seed(fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1', extra = {}) {
        const r = await (await p.request.post(new URL('/fixture-position?fen=' + encodeURIComponent(fen) + (extra.seat === 1 ? '&black=1' : ''), pluginURL).href)).json(); assert(!r.isError);
        Object.assign(r._meta.view, extra);
        await p.evaluate(r => { window.harnessNextView = r._meta.view; return window.harnessShow(r); }, r);
        await ready();
      }
      async function tap(sq, flipped = false) {
        if (flipped) sq = 63 - sq;
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
        await seed();
        if (id === 'A39') {
          if (phase === 'before') continue;
          for (const flipped of [false,true]) {
            await seed(flipped ? 'K7/3P4/3o4/8/8/8/8/7k b - - 0 1' : '7k/8/8/8/8/3O4/3p4/K7 w - - 0 1', { seat: flipped ? 1 : 0 });
            await f.locator('#board').focus();
            await tap(flipped ? 43 : 19, flipped); await tap(flipped ? 51 : 11, flipped);
            await f.locator('#board-sheet[open]').waitFor();
            assert.equal(await f.locator('#choices button').count(), 2, 'Take and Shove are legal');
            await p.keyboard.press('Shift+Tab');
            assert(await f.locator('#choices button').last().evaluate(b => b === document.activeElement), 'Shift+Tab stays in the choice');
            await p.keyboard.press('Tab');
            assert(await f.locator('#board-sheet [aria-label="Close"]').evaluate(b => b === document.activeElement), 'Tab returns to Close');
            async function clearSquares() {
              await f.locator('html').evaluate(async () => {
                for (let tries = 0; tries < 100; tries++) {
                  const board = document.querySelector('#board').getBoundingClientRect(), canvas = document.querySelector('#board canvas').getBoundingClientRect(), choice = document.querySelector('#board-sheet').getBoundingClientRect(), frame = document.querySelector('#app-frame').getBoundingClientRect();
                  if (canvas.height > 0 && canvas.bottom <= board.bottom + 1 && choice.top >= board.bottom + 11 && choice.bottom <= frame.bottom - 11) return;
                  await new Promise(resolve => setTimeout(resolve,20));
                }
                throw new Error('The plugin move choice must leave the full board in view');
              });
            }
            await clearSquares(); await shot(id,flipped ? 'take-shove-flipped' : 'take-shove');
            await p.setViewportSize({width,height:height-100}); await clearSquares();
            await p.setViewportSize({width,height}); await clearSquares();
            assert(await f.locator('#board-sheet').evaluate(d => d.contains(document.activeElement)), 'The choice keeps focus after resize');
            if (flipped) await f.locator('#board-sheet [aria-label="Close"]').click();
            else await p.keyboard.press('Escape');
            assert(!(await f.locator('#board-sheet').evaluate(d => d.open)), 'Cancel closes the choice');
            assert.equal(await f.locator('#board').evaluate(b => b.style.maxHeight), '', 'Cancel releases the board space');
            assert.equal(await f.locator('#board').evaluate(b => b === document.activeElement), true, 'Cancel returns focus to the board');
            assert.equal(await f.locator('#undo').getAttribute('aria-disabled'), 'true', 'Cancel plays no move');
          }
        }
        if (id === 'A14') {
          await tap(12); await tap(28); await shot(id,'turn-computer');
          if (phase === 'after') assert.equal(await f.locator('#end-turn').getAttribute('aria-label'), 'End turn');
          await seed(undefined, { kind: 'friend', opponent: { handle: 'mira_k', computer: false, deleted: false } });
          await tap(12); await tap(28); await shot(id,'turn-person');
          if (phase === 'after') {
            assert.equal(await f.locator('#end-turn').getAttribute('aria-label'), 'Send your turn');
            const fit = await f.locator('#end-turn').evaluate(e => { const b=e.getBoundingClientRect(), s=getComputedStyle(e); return { font:s.fontSize, bold:s.fontWeight, fits:e.scrollWidth<=e.clientWidth, height:b.height }; });
            assert.equal(await f.locator('#end-turn').innerText(), ''); assert.equal(await f.locator('#end-turn .turn-sword').count(), 1); assert(fit.fits && fit.height >= 44, JSON.stringify(fit));
          }
        }
        if (id === 'A15') { await tap(12); await shot(id,'selected-behind'); }
        if (id === 'A17') {
          await seed('7k/8/8/4p3/8/8/P7/K7 w - - 0 1 me5w2', { rules: { kings: [{king:'Frost',power:'Freeze'},null] } });
          if (phase === 'after') await assertFrost(f.locator('html'),2);
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
          await p.evaluate(() => window.releaseBefore?.()); await p.waitForFunction(() => window.harnessInflight === 0); await ready();
        }
        if (id === 'A8') {
          await f.locator('#board-menu').click(); await f.getByRole('button',{name:'Settings',exact:true}).click(); await shot(id,'settings');
          if (phase === 'after') {
            assert.equal(await f.locator('#animations').count(), 0, 'Settings has no animation choice');
            assert.deepEqual(await f.locator('.fields label input').evaluateAll(nodes => nodes.map(n => n.id)), ['symbols-only','show-threats','sound']);
            await p.locator('#remount').evaluate(b => b.click()); await f.locator('#sound').waitFor({state:'attached'});
            assert.equal(await f.locator('#animations').count(), 0, 'Remount keeps the restored Settings');
          }
        }
      }
      await ctx.close();
    }
    for (const width of [390,1440]) {
      const height=width===390?844:900;
      const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:2,serviceWorkers:'block'});
      const p=await ctx.newPage();p.setDefaultTimeout(10000);
      if (item === 'A8' && phase === 'after') await p.clock.install();
      if (item === 'A17') await p.addInitScript(watchFrost);
      async function open(fen, args='') { await p.goto(webURL+'?title=0&players=human,human&fen='+encodeURIComponent(fen)+args);await p.waitForFunction(()=>window.view?.ready);await p.evaluate(()=>window.view.ready());await p.evaluate(()=>document.fonts.ready); }
      async function tap(sq){ const point=await p.evaluate(sq=>window.view.screenOf(sq),sq);await p.mouse.click(point.x,point.y);await p.waitForTimeout(400); }
      async function shot(id,screen){const file=`${id}-web-${screen}-${width}x${height}-light-${phase}.png`;await p.screenshot({path:join(out,file)});notes.push(file);}
      for(const id of items) {
        if(id==='A15'){await open('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1');await tap(12);await shot(id,'selected-behind');}
        if (id === 'A17') {
          await open('7k/8/8/4p3/8/8/P7/K7 w - - 0 1', '&kings=Frost:Freeze,none');
          await p.locator('#menu-btn').click(); await p.locator('#pace').selectOption('off'); await p.locator('#menu-close').click();
          await p.locator('#power-w').click(); await p.locator('#power-use').click(); await tap(36);
          await assertFrost(p.locator('html'),1); await shot(id,'frozen');
          await p.locator('#undo').click(); await assertFrost(p.locator('html'),0);
          await p.locator('#power-w').click(); await p.locator('#power-use').click(); await tap(36);
          await assertFrost(p.locator('html'),1);
          await tap(8); await tap(16); await p.locator('#end-turn').click();
          await tap(63); await tap(62); await p.locator('#end-turn').click();
          await assertFrost(p.locator('html'),0);
        }
        if (id === 'A39') {
          for (const flipped of [false, true]) {
            await open(flipped ? 'K7/3p4/3O4/8/8/8/8/7k w - - 0 1' : '7k/8/8/8/8/3O4/3p4/K7 w - - 0 1');
            await p.evaluate(flipped => window.view.flip(flipped), flipped);
            await tap(flipped ? 43 : 19); await tap(flipped ? 51 : 11);
            await p.locator('#move-choice[open]').waitFor();
            async function clearSquares() {
              await p.waitForFunction(() => {
                const board = document.querySelector('#board').getBoundingClientRect(), canvas = document.querySelector('#board canvas').getBoundingClientRect(), choice = document.querySelector('#move-choice').getBoundingClientRect();
                return board.height > 0 && canvas.bottom <= board.bottom + 1 && choice.top >= board.bottom + 11 && choice.bottom <= innerHeight - 11;
              });
            }
            if (phase === 'after') await clearSquares();
            await shot(id, flipped ? 'take-shove-flipped' : 'take-shove');
            if (phase === 'after') {
              await p.setViewportSize({width, height:height - 100}); await clearSquares();
              await p.setViewportSize({width,height}); await clearSquares();
              assert.equal(await p.locator('#move-choice').evaluate(d => d.contains(document.activeElement)), true, 'The choice keeps focus after resize');
            }
            await p.keyboard.press('Escape');
            assert.equal(await p.locator('#move-choice').evaluate(d => d.open), false);
            if (phase === 'after') assert.equal(await p.locator('#board').evaluate(b => b.style.maxHeight), '', 'Cancel releases the board space');
          }
        }
        if (id === 'A8') {
          await open('7k/8/8/8/8/8/A7/K7 w - - 0 1');
          await p.locator('#menu-btn').click();
          const pace = p.locator('#pace');
          await pace.waitFor({state:'visible'});
          assert.equal(await p.locator('#sound').isVisible(), true, 'Sound is on the Menu');
          assert.equal(await p.locator('#sound').evaluate(el => el.closest('label').firstChild.textContent.trim()), 'Sound');
          assert.equal(await pace.evaluate(el => el.closest('label').firstChild.textContent.trim()), 'Motion');
          assert.deepEqual(await pace.locator('option').allTextContents(), ['Normal','Fast','Off']);
          await shot(id,'settings');
          if (phase === 'after') {
            await pace.selectOption('off'); await p.locator('#menu-close').click();
            await p.clock.pauseAt(new Date(Date.now() + 100));
            await tap(8); await p.clock.runFor(100);
            const target = await p.evaluate(() => window.view.screenOf(9));
            const frames = await p.evaluate(() => window.view.scene.frames);
            await p.mouse.move(target.x,target.y); await p.clock.runFor(500);
            assert.equal(await p.evaluate(() => window.view.scene.frames),frames + 1,'Off aims in one frame and schedules no weapon motion');
          }
        }
      }
      await ctx.close();
    }
  }
  await writeFile(join(root,`capture-${item}.json`),JSON.stringify(notes,null,2)+'\n');
  console.log(`Board previews: ${notes.length} screens at device scale 2 (${item}).`);
} finally { await browser.close(); await current?.close(); await new Promise(resolve => web ? web.httpServer.close(resolve) : resolve()); unregister(); }
