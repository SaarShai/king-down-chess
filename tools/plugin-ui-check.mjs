import { checkAndroidFixes } from './lib/plugin-android-check.mjs';
import { cardFaces } from './lib/plugin-card-faces.mjs';
import { controlBounds } from './lib/plugin-control-bounds.mjs';
import { boxText, layoutMessage } from './lib/layout-message.mjs';
import { assertCardReadState } from './lib/plugin-card-read.mjs';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { register } from 'tsx/esm/api';
const unregister = register();
const { fromFen, toFen, toLan } = await import('../src/rules/setup.ts');
const { setRules, legalMoves, inCheck, typeOf, N, RULES, sqName, moveNumber: positionMoveNumber } = await import('../src/rules/engine.ts');
const { DEFAULT_OPTIONS } = await import('../src/match/setup.ts');
const { applyLan, cardCoins, replayHistory } = await import('../src/plugin/screens/board-model.ts');
const { threatsIn } = await import('../src/move-text.ts');
const { cardName } = await import('../src/powers-ui.ts');
const { POP_MS, RIPPLE_MS } = await import('../src/render/marks.ts');
const iconNames = { P:'pawn', N:'knight', B:'bishop', R:'rook', Q:'queen', K:'king', A:'archer', L:'paladin', G:'guard', M:'maester', S:'beast', O:'ogre' };
const iconSources = Object.fromEntries(await Promise.all(Object.values(iconNames).map(async name => [name, await readFile(`public/ui/icons/${name}.svg`, 'utf8')])));
import { assertNoErrors, env, launch, shot, trapErrors } from './lib/checks.mjs';
const base = env('PLAYABLE_URL');
const testHandle = `mvp_${randomUUID().replaceAll('-', '').slice(0,12)}`;
const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1000, height: 1000 }, hasTouch: true });
trapErrors(page);
page.on('pageerror', error => console.error(error.stack));

try {
  await checkAndroidFixes(browser, base);
  // Ticket 13: install the clock before the page sets any timer.
  await page.clock.install();
  await page.addInitScript(() => {
    // The terminal mount below has no Home check to release this hold.
    if (!new URLSearchParams(location.search).has('terminal')) window.holdBeforeNext = 'kingdown_settings';
    window.harnessTableIdConflicts = [];
    const tableIds = ['game-table','strip-me','strip-them','context-line','context-text','moves-line','last-move','table-bar'];
    new MutationObserver(() => {
      for (const id of tableIds) if (document.querySelectorAll(`#${id}`).length > 1 && !window.harnessTableIdConflicts.includes(id)) window.harnessTableIdConflicts.push(id);
    }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['id'] });
    // The harness holds each frame boot for this delay on the page clock. The host counts each frame that has set its
    // boot timer (harnessBoots), so remountFrame() sees when a new frame is ready for the clock step.
    window.harnessBootDelay = 300;
    window.harnessArrowLines = [];
    window.harnessGhostSymbols = [];
    window.harnessSwapMarks = 0;
    const paths = new WeakMap(), proto = CanvasRenderingContext2D.prototype;
    const drawImage = proto.drawImage;
    proto.drawImage = function(image, ...args) {
      if (this.globalAlpha === 0.5 && image.src?.includes('.svg')) window.harnessGhostSymbols.push(image.src);
      return drawImage.call(this, image, ...args);
    };
    for (const name of ['beginPath', 'moveTo', 'lineTo', 'stroke', 'fill']) {
      const original = proto[name];
      proto[name] = function(...args) {
        if (name === 'beginPath') paths.set(this, []);
        if (name === 'moveTo' || name === 'lineTo') paths.get(this)?.push(args);
        const path = paths.get(this);
        if (name === 'stroke' && this.strokeStyle === '#7d5ba6') window.harnessSwapMarks++;
        if (name === 'stroke' && this.strokeStyle === '#d63428' && path?.length === 2) window.harnessArrowStart = path[0];
        if (name === 'fill' && this.fillStyle === '#d63428' && path?.length === 4 && window.harnessArrowStart) window.harnessArrowLines.push([window.harnessArrowStart, path[0]]);
        return original.apply(this, args);
      };
    }
  });
  await page.goto(base);
  const capabilities = await (await page.request.get(new URL('/harness-mode', base).href)).json();
  const mode = capabilities.mode;
  if (process.env.PLUGIN_EXPECT_MODE) assert.equal(mode, process.env.PLUGIN_EXPECT_MODE, 'Connected to the expected harness backend');
  const frame = page.frameLocator('iframe');
  // The widget frame is on another origin, so the host page cannot read it: code that waits on the frame runs in it.
  const widget = () => page.mainFrame().childFrames()[0];
  const options = {fairy:true,pool:['R','A','G','Q','M','S','O'],arrangement:false,classic:false,cards:false,cardPool:[],kingPowers:false};
  // Waits until every tool call at the host has returned, then one frame in the frame. A released reply reaches the
  // frame before the check reads the DOM. The built page hides its client, so the host's own count stands in.
  async function settled() {
    const end = Date.now() + 10000;
    for (;;) {
      const done = await page.evaluate(() => (window.harnessInflight ?? 0) === (window.harnessHeld ?? 0));
      if (done) break;
      if (Date.now() > end) throw new Error('settled: a tool call still waits');
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    await frame.locator('html').evaluate(() => new Promise(resolve => requestAnimationFrame(() => resolve(undefined))));
  }

  async function boardBox() {
    await frame.locator('#board[aria-busy="false"]:not([data-animating="true"])').waitFor();
    await frame.locator('canvas').evaluate(c => new Promise((resolve, reject) => {
      const end = performance.now() + 10000; let last;
      const tick = () => {
        const rect = c.getBoundingClientRect(), key = [rect.x, rect.y, rect.width, rect.height].join(',');
        // A small phone can have a board below 250 px; wait for stable, nonzero bounds.
        if (rect.width > 0 && rect.height > 0 && key === last) resolve();
        else if (performance.now() > end) reject(new Error('The visible board did not settle'));
        else { last = key; requestAnimationFrame(tick); }
      }; requestAnimationFrame(tick);
    }));
    return frame.locator('canvas').boundingBox();
  }
  // A remount boots a new frame, and the check only waits while the frame boots. So when the new frame has set its
  // 300 ms boot timer, this steps the page clock over that timer and does not wait in real time. The step stays, as a
  // real wait would: the lost Start check measures the time since the start on the page clock (Retry by the server
  // clock), so a page date set back below the real time makes the new game look older than the start.
  // Each frame clock adds real time when a script reads the date, and fastForward drops the real time since the last
  // read. So the step reads the date in both frames directly before it.
  async function remountFrame() {
    const before = await page.evaluate(() => window.harnessBoots);
    await page.locator('#remount').click();
    await page.waitForFunction(n => window.harnessBoots > n, before);
    await widget().evaluate(() => Date.now());
    await page.evaluate(() => Date.now());
    await page.clock.fastForward(300);
  }
  // The per-control scroll and measure in one page call. Playwright's scrollIntoViewIfNeeded first waits until the
  // control keeps its box from one frame to the next; here the whole list does (two equal reads 20 ms apart). Then
  // controlBounds scrolls each control as scrollIntoViewIfNeeded does and measures it, in list order.
  async function controlsInView(controls) {
    const boxes = () => controls.evaluateAll(els => JSON.stringify(els.map(el => { const r = el.getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; })));
    for (let last = await boxes(), end = Date.now() + 30000; ;) {
      await new Promise(resolve => setTimeout(resolve, 20));
      const next = await boxes(); if (next === last) break;
      assert(Date.now() < end, `The controls keep moving: ${next}`); last = next;
    }
    return controls.evaluateAll(controlBounds, true);
  }

  await page.waitForFunction(() => typeof window.releaseBefore === 'function');
  await frame.locator('#home-card').waitFor();
  assert.equal(await frame.locator('#app-head').count(), 0, 'The approved sample has no page title or tabs');
  assert.equal(await frame.locator('symbol').count(), 23, 'The page has the full game sprite');
  assert.equal(await frame.locator('#over').count(), 1, 'The frame has one shared overlay');
  assert.equal(await frame.locator('#i-back, #i-close, #i-plus, #i-mic').count(), 0, 'Host icons stay with the host');
  assert(await frame.locator('#home-play').isDisabled(), 'Play waits for the page and the host to connect');
  assert.equal(await frame.locator('#home-card button').count(), 2, 'The inline home card has only Play now and Choose a game');
  await page.evaluate(() => window.releaseBefore());
  await frame.locator('#home-play:not(:disabled)').waitFor();
  assert.deepEqual(await page.evaluate(() => window.harnessDeclaredModes), ['inline', 'fullscreen'], 'App declares both display modes to the host');
  assert.equal(await frame.locator('.inline-line').first().innerText(), 'Chess, the way it was never meant to be played.', 'Home uses the owner pitch line');
  assert(await frame.locator('#home-line').isHidden(), 'Home hides the zero turn count');
  assert.deepEqual(await page.evaluate(() => window.harnessDisplayRequests ?? []), [], 'Mount sends no fullscreen request');
  assert.equal(await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_get').length), 0, 'An empty home reads no board');
  await frame.locator('#home-games').click();
  await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
  assert.equal(await page.evaluate(() => window.harnessWidgetState.privateContent.screen), 'play', 'Home Choose a game opens the Play hall');
  // M3: a failed first read on Play has one error and one way to read again.
  async function readErrorOnce(screen) {
    const message = 'Harness saved-game read failed';
    await frame.locator('#error').filter({ hasText: message }).waitFor();
    assert.equal((await frame.locator('body').innerText()).split(message).length - 1, 1, `${screen} shows the read error once`);
    assert.equal(await frame.getByRole('button', { name: 'Try again', exact: true }).count(), 1, `${screen} has one Try again`);
    assert(await frame.getByRole('button', { name: 'Try again', exact: true }).isEnabled(), `${screen} can read again`);
  }
  await page.evaluate(() => { window.rejectNextGet = true; });
  await remountFrame();
  await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
  await readErrorOnce('Play');
  await frame.getByRole('button', { name: 'Try again', exact: true }).click();
  await frame.locator('#retry').waitFor({ state: 'hidden' });
  assert.equal(await frame.locator('#error').innerText(), '', 'A good Play read clears the error');
  const homeAgain = await (await page.request.post(new URL('/fixture-tool',base).href, { data: { name: 'kingdown_open', arguments: { screen: 'home' } } })).json();
  await page.evaluate(result => window.harnessShow(result), homeAgain);
  await frame.locator('#home-play:not(:disabled)').waitFor();
  await page.evaluate(() => { window.harnessDisplayRequests = []; });
  await frame.locator('[data-art]').evaluateAll(images => Promise.all(images.map(image => image.decode())));

  for (const [width,height] of [[390,844],[1440,900],[400,900],[360,844]]) {
    await page.setViewportSize({width,height});
    assert.equal(await frame.locator('body').evaluate(el=>el.scrollWidth>innerWidth), false, `Home has no horizontal scroll at ${width}px`);
    assert.equal(await frame.locator('.wordmark').evaluate(el => getComputedStyle(el).fontSize), '40px', 'Home keeps the sample wordmark size');
    await shot(page, `shell-home-${width}-${mode}`);
  }
  await page.setViewportSize({width:1000,height:1000});
  await frame.getByRole('button', { name: 'Choose a game', exact: true }).click();
  await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
  assert.deepEqual(await frame.locator('[data-screen="play"] .row-title:visible').allTextContents(), ['Profile', 'Settings']);
  assert(await frame.locator('[data-screen="play"] h2').evaluate(el => getComputedStyle(el).fontFamily.includes('Cinzel')), 'The page uses the approved Cinzel heading');
  assert.deepEqual(await page.evaluate(() => window.harnessDisplayRequests), ['fullscreen'], 'Choose a game asks the host for fullscreen');
  async function openPlay() {
    if (await frame.locator('#board-sheet[open]').count()) await frame.locator('#board-sheet [aria-label="Close"]').click();
    for (let i = 0; i < 2 && !await frame.locator('[data-screen="play"]:not([hidden])').count(); i++) {
      await widget().waitForFunction(() => {
        const d=document;
        return !d.querySelector('[data-screen="play"]').hidden || [...d.querySelectorAll('#page-back, .table-back')].some(b=>!b.disabled&&b.getClientRects().length);
      });
      // A computer abort can open Play while Back waits for a call. Check and act in the same frame.
      await frame.locator('html').evaluate(() => {
        if (!document.querySelector('[data-screen="play"]').hidden) return;
        [...document.querySelectorAll('#page-back, .table-back')].find(b=>!b.disabled&&b.getClientRects().length)?.click();
      });
    }
    await frame.locator('[data-screen="play"]:not([hidden])').waitFor({ timeout: 5000 });
  }
  async function openScreen(screen) { await openPlay(); await frame.locator(`[data-screen="play"] [data-nav="${screen}"]`).click(); }
  async function idleBoard() { await widget().waitForFunction(() => document.querySelector('#reload')?.disabled === false); }
  async function remount(screen) {
    // Each mount reads the settings; a mount with no board makes no board read.
    const reads = await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_settings').length);
    await remountFrame();
    await page.waitForFunction(n => window.harnessCalls.filter(c => c.name === 'kingdown_settings').length > n, reads);
    // The new page can show its inputs before its first read binds them.
    await idleBoard();
    await frame.locator(`[data-screen="${screen}"]:not([hidden])`).waitFor();
  }
  async function openMoveChoices() {
    if (await frame.locator('#board-sheet[open] h2').count() && await frame.locator('#board-sheet h2').innerText() === 'Choose a move') return;
    if (await frame.locator('#board-sheet[open]').count()) await frame.locator('#board-sheet [aria-label="Close"]').click();
    await frame.locator('#board-menu').click(); await frame.locator('#board-sheet').getByRole('button', {name:'Choose a move', exact:true}).click();
  }
  async function menuAction(id) {
    if (await frame.locator('#board-sheet[open]').count()) await frame.locator('#board-sheet [aria-label="Close"]').click();
    await frame.locator('#board-menu').click(); await frame.locator('#' + id).click();
  }
  // A chat-made game opens the screen of its status (U1): a waiting friend game opens its code screen.
  async function legacyStart(kind, screen = 'board') {
    const board_id = await page.evaluate(() => window.harnessWidgetState?.privateContent?.board_id);
    const result = await (await page.request.post(new URL('/fixture-tool',base).href, { data: { name: 'kingdown_create', arguments: { kind, options, colour: 'white', board_id } } })).json();
    const reads = await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_get').length);
    assert(!result.isError); await page.evaluate(result => window.harnessShow(result), result);
    await page.waitForFunction(n => window.harnessCalls.filter(c => c.name === 'kingdown_get').length > n, reads);
    await idleBoard(); await frame.locator(`[data-screen="${screen}"]:not([hidden])`).waitFor();
    return result;
  }
  async function handleGate(fail = false) {
    const reads = await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_get').length);
    await page.evaluate(() => {
      const saved = window.harnessWidgetState.privateContent;
      window.harnessWidgetState = { modelContent: {}, privateContent: { screen: 'play', sheet: undefined, board_id: saved.board_id, pending: { name: 'kingdown_create', args: { kind: 'friend', colour: 'white' }, game_tag: window.harnessView?.game_id.slice(0, 8), screen: 'play', error: 'Harness saved send failed', error_screen: 'play' } } };
    });
    await remountFrame();
    await page.waitForFunction(n => window.harnessCalls.filter(c => c.name === 'kingdown_get').length > n, reads);
    await widget().waitForFunction(() => document.querySelector('#reload').disabled === false);
    await frame.locator('#retry').waitFor();
    await page.evaluate(fail => { window.requireHandleNext = true; window.failActionAfterHandle = fail; }, fail);
    await frame.locator('#retry').click(); await frame.locator('[data-screen="handle"]:not([hidden])').waitFor();
    assert.equal(await frame.locator('#retry').isVisible(), false, 'HANDLE_NEEDED waits for Save without Retry');
    assert.equal(await frame.locator('#error').textContent(), '', 'HANDLE_NEEDED has no failed-send words');
  }
  // Ticket 16: profile and collection.
  {
    const { BADGES } = await import('../src/match/badges.ts');
    const { WHY } = await import('../src/plugin/ending.ts');
    const { tmpdir } = await import('node:os'), { join } = await import('node:path'), { mkdir } = await import('node:fs/promises');
    const { default: sharp } = await import('sharp');
    const look = join(tmpdir(), 'kingdown-look', '16b'); await mkdir(look, { recursive: true });
    const goals = { first_win: 'Win a game.', friend_match: 'Finish a game with a friend.', stranger_match: 'Finish a game with a random player.', purist: 'Win a Classic game.', fairy_tale: 'Win with fairy pieces.', architect: 'Win with your own arrangement.', card_sharp: 'Win a game with cards.', crowned: 'Win with a king power.', royal_collection: 'Win with all six kings.', giant_slayer: 'Beat the Strong computer.' };
    const profileTool = async (name, args = {}, friend = false) => {
      const reply = await (await page.request.post(new URL(friend ? '/fixture-friend-tool' : '/fixture-tool', base).href, { data: { name, arguments: args } })).json();
      assert(!reply.isError, `${name}: ${JSON.stringify(reply.content)}`); return reply;
    };
    const history = Array.from({length:23}, (_,i) => ({ game_id: randomUUID(), finished_at: new Date(Date.UTC(2026,9,10,12-i)).toISOString(), kind:'friend', colour:i%2?'black':'white', result:i<12?'won':i<15?'drawn':'lost', reason:i>=12&&i<15?'agreement':'resignation', opponent:{handle:i===0?'abcdefghijklmnopqrst':i===3||i===1||i===4?null:`player_${i}`,icon:'spirit',computer:i===1||i===4,deleted:i===2,level:i===1?'club':null}, features:{fairy:true,arrangement:true,classic:true,cards:true,powers:true,king:'Spirit',power:'Mercy'} }));
    const record = { totals:{played:23,won:12,drawn:3,lost:8}, rating:{rating:1500.4,rd:350,volatility:.06,provisional:true}, badges:['first_win','friend_match','stranger_match','fairy_tale','architect','crowned'].map(badge=>({badge,earned_at:'2026-10-10T12:00:00Z'})) };
    async function seed(data) { const response = await page.request.post(new URL('/fixture-seed',base).href,{data:{actor:'alice',data}}); assert.equal(response.status(),200); }
    if (mode === 'fixture') await seed({history,record});
    else {
      const prior = (await profileTool('kingdown_profile'))._meta.record.totals;
      const solo = await profileTool('kingdown_create',{kind:'solo',options,colour:'white'});
      await profileTool('kingdown_resign',{game_id:solo._meta.view.game_id});
      for (const draw of [false,true]) {
        const game = await profileTool('kingdown_create',{kind:'friend',options,colour:'white'}), game_id = game._meta.view.game_id;
        const invite = await profileTool('kingdown_invite',{game_id}); await profileTool('kingdown_join',{code:invite.structuredContent.code},true);
        if (draw) { await profileTool('kingdown_draw',{game_id,choice:'offer'}); await profileTool('kingdown_draw',{game_id,choice:'accept'},true); }
        else await profileTool('kingdown_resign',{game_id},true);
      }
      const totals = (await profileTool('kingdown_profile'))._meta.record.totals;
      assert.deepEqual(totals,{played:prior.played+3,won:prior.won+1,drawn:prior.drawn+1,lost:prior.lost+1},'Three real ends update PostgreSQL totals');
    }
    const openIds = [];
    for (const kind of ['solo','friend']) openIds.push((await profileTool('kingdown_create',{kind,options,colour:'white'}))._meta.view.game_id);
    const result = await profileTool('kingdown_profile'), data = result._meta, seenImages = new Set(), faults = [];
    for (const entry of data.history) if (entry.opponent.handle) assert(!JSON.stringify([result.content,result.structuredContent]).includes(entry.opponent.handle),'Opponent handles stay in _meta');
    if (mode === 'http') assert(data.history.some(row=>row.opponent.handle),'The HTTP history has the friend handle');
    const responseFault = response => { if (response.status() >= 400) faults.push(`${response.status()} ${response.url()}`); }; page.on('response',responseFault);
    async function images(selector) {
      const loaded = await frame.locator(`${selector} img`).evaluateAll(async imgs => Promise.all(imgs.map(async img => { await img.decode(); return {src:img.src,width:img.naturalWidth}; })));
      assert(loaded.every(img=>img.width>0),'Every page image has naturalWidth > 0'); loaded.forEach(img=>seenImages.add(img.src));
    }
    async function layout(screen) {
      const found = await frame.locator('body').evaluate((_,screen) => {
        const failures=[], limit=innerHeight-(innerWidth>=900?128:96), root=document.querySelector(`[data-screen="${screen}"]`);
        for (const el of [document.scrollingElement,document.querySelector('.frame'),...root.querySelectorAll('.new-game-body,.registry')]) if (el.scrollWidth>el.clientWidth+1) failures.push('sideways scroll');
        const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
        for(let n;(n=walker.nextNode());) {
          if(!n.textContent.trim()||n.parentElement.closest('svg')) continue;
          const range=document.createRange(); range.selectNodeContents(n);
          for(const r of range.getClientRects()) {
            if(r.width<1||r.top>=innerHeight||r.bottom<=0) continue;
            const p=n.parentElement.getBoundingClientRect(); if(p.right>innerWidth+1) failures.push('text past the right edge');
            if(r.bottom>limit&&r.top<innerHeight) { const top=document.elementFromPoint(Math.min(innerWidth-1,Math.max(0,r.left+r.width/2)),Math.max(limit,r.top)+1); if(top&&(n.parentElement===top||n.parentElement.contains(top))) failures.push('text over the composer'); }
          }
        }
        return failures;
      },screen);
      assert.deepEqual(found,[],`${screen}: ${found.join(', ')}`);
    }
    async function rollers() {
      // The scroll is part of the page scroll (fault F15): the top roller shows at the page top, the bottom roller at the page end.
      const bounds = await frame.locator('#profile-sheet .scroll').evaluate(el => {
        const page=el.closest('.new-game-body'), registry=el.querySelector('.registry'), css=getComputedStyle(el);
        page.scrollTop=0; const top=el.getBoundingClientRect().top, bodyTop=page.getBoundingClientRect().top;
        page.scrollTop=page.scrollHeight; const bottom=el.getBoundingClientRect().bottom, bodyBottom=page.getBoundingClientRect().bottom; page.scrollTop=0;
        return {top,bottom,bodyTop,bodyBottom,inner:registry.scrollHeight-registry.clientHeight,slice:css.borderImageSlice,width:css.borderImageWidth,source:css.borderImageSource};
      });
      assert(bounds.top>=bounds.bodyTop && bounds.bottom<=bounds.bodyBottom+1,'Each scroll roller shows in full at its end of the page');
      assert(bounds.inner<=1,'The scroll has no scroll area of its own');
      assert.equal(bounds.slice,'126 68 120 fill','One rule keeps the two complete rollers and the side edges');
      assert.equal(bounds.width,'1.3125 1 1.2','The rollers and their shadows keep the art scale; only the flat parchment stretches');
      assert(bounds.source.includes('/scroll-'),'scroll.webp loads through the art helper');
    }
    async function capture(state,size,width,height) {
      const path=await shot(page,`${state}-${size}-${mode}`);
      if(size!=='panel') { const left=await sharp(`docs/specs/chatgpt-mvp/sample/png/${state}-${size}.png`).resize(width,height).toBuffer(), right=await sharp(path).toBuffer(); await sharp({create:{width:width*2,height,channels:3,background:'#fff'}}).composite([{input:left,left:0,top:0},{input:right,left:width,top:0}]).png().toFile(join(look,`${state}-${size}-${mode}.png`)); }
    }
    for (const [size,width,height] of [['phone',390,844],['panel',400,900],['desktop',1440,900]]) {
      await page.setViewportSize({width,height}); await openScreen('profile');
      await frame.locator('#profile-open button').first().waitFor();
      assert.deepEqual(await frame.locator('#profile-open button').evaluateAll(rows=>rows.map(row=>row.dataset.gameId)),openIds,'Open games keep your turn first');
      assert.equal(await frame.locator('#profile-open button').first().locator('.when .turn-mark').textContent(),'Turn');
      assert(await frame.locator('#profile-open').evaluate(el=>!!(el.compareDocumentPosition(document.querySelector('#profile-history'))&Node.DOCUMENT_POSITION_FOLLOWING)),'Open rows precede finished rows');
      assert.deepEqual(await frame.locator('#profile-totals b').allTextContents(),Object.values(data.record.totals).map(String));
      assert.equal(await frame.locator('#profile-rating b').textContent(),String(Math.round(data.record.rating.rating)));
      assert.equal(await frame.locator('#profile-rating .q').isVisible(),data.record.rating.provisional);
      assert.equal(await frame.locator('#profile-history li').count(),data.history.length);
      for(const [i,row] of data.history.entries()) {
        const li=frame.locator('#profile-history li').nth(i), op=row.opponent;
        assert.equal(await li.locator('time').getAttribute('datetime'),row.finished_at);
        assert((await li.locator('time').textContent()).trim());
        assert.equal(await li.locator('img').getAttribute('alt'),`${row.colour} king`);
        assert.equal(await li.locator('b').textContent(),op.computer?`Computer${op.level?' · '+op.level[0].toUpperCase()+op.level.slice(1):''}`:op.deleted?'Deleted player':op.handle??'A player');
        assert.equal(await li.locator('.res').textContent(),{won:'W',drawn:'D',lost:'L'}[row.result]);
        assert.equal(await li.locator('small').textContent(),WHY[row.reason]);
        assert.equal(await li.locator('.feats use').count(),['fairy','arrangement','classic','cards','powers'].filter(key=>row.features[key]).length);
      }
      await rollers(); await images('#profile-sheet'); await layout('profile');
      if(mode==='fixture') {
        assert.equal(await frame.locator('#profile-history li').first().locator('.feats use').count(),5);
        await frame.locator('#profile-more').click();
        await widget().waitForFunction(()=>document.querySelectorAll('#profile-history li').length===23);
        assert.deepEqual(await page.evaluate(()=>window.harnessCalls.findLast(c=>c.name==='kingdown_profile').arguments),{before:data.next_before},'More sends the unchanged cursor');
        const ids=await frame.locator('#profile-history li').evaluateAll(rows=>rows.map(row=>row.dataset.gameId)); assert.equal(new Set(ids).size,23);
        await frame.locator('#profile-history li').last().scrollIntoViewIfNeeded(); assert((await frame.locator('#profile-history li').last().evaluate(controlBounds)).accessible,'The last row clears the composer');
      }
      assert.equal(await frame.locator('#profile-more').isVisible(),false);
      await rollers();
      await frame.locator('html').evaluate(()=>document.fonts.ready); await capture('profile',size,width,height);
      assert.equal(await frame.locator('#profile-badges .badge').count(),10);
      assert(await frame.locator('#profile-badges .badge button').evaluateAll(buttons => buttons.every(button => {
        const style = getComputedStyle(button);
        return style.backgroundImage === 'none' && style.backgroundColor === 'rgba(0, 0, 0, 0)' && style.boxShadow === 'none';
      })), 'Profile badges keep their transparent face');
      for(const [badge,name] of Object.entries(BADGES)) {
        const cell=frame.locator(`[data-badge="${badge}"]`), earned=data.record.badges.find(item=>item.badge===badge);
        assert.equal(await cell.evaluate(el=>el.classList.contains('no')),!earned);
        assert.equal(await cell.locator('time').count(),earned?1:0);
        if(earned) assert.equal(await cell.locator('time').getAttribute('datetime'),earned.earned_at);
        await cell.locator('button').click(); await frame.getByRole('dialog',{name,exact:true}).waitFor(); await images('#over');
        const detail=await frame.locator('#badge-detail').textContent(); if(earned) assert(detail.startsWith('Earned ')); else assert.equal(detail,goals[badge]);
        assert.equal(await cell.locator('button').getAttribute('aria-label'),`${name}. ${detail}`);
        assert((await frame.locator('#badge-close').evaluate(controlBounds)).accessible,'The badge close control clears the composer'); await frame.locator('#badge-close').click();
      }
      await frame.locator('#profile-sheet .new-game-body').evaluate(el=>{el.scrollTop=el.scrollHeight;}); await layout('profile'); await capture('profile-badges',size,width,height);
      await frame.locator('[data-screen="profile"] [data-nav="collection"]').click();
      for(const [tab,count] of [['Pieces',11],['Kings',6],['Powers',12],['Cards',21]]) {
        await frame.locator('#collection-tabs label').filter({hasText:tab}).click(); assert.equal(await frame.locator('#collection-items > *').count(),count); assert.equal(await frame.locator('#collection-items .unlocked').count(),count);
        assert((await frame.locator('#collection-items > *').allTextContents()).every(text=>text.includes('Unlocked')&&text.trim().length>30),'Each collection entry has its rule');
        await images('#collection-sheet'); await layout('collection');
        await frame.locator('#collection-items > *').last().scrollIntoViewIfNeeded(); assert((await frame.locator('#collection-items > *').last().evaluate(controlBounds)).accessible,'The last collection entry clears the composer');
        await frame.locator('#collection-sheet .new-game-body').evaluate(el=>{el.scrollTop=0;});
        if(tab==='Pieces') await capture('collection',size,width,height);
      }
      const settingsReads=await page.evaluate(()=>window.harnessCalls.filter(c=>c.name==='kingdown_settings').length); await remountFrame();
      await page.waitForFunction(n=>window.harnessCalls.filter(c=>c.name==='kingdown_settings').length>n,settingsReads);
      await frame.locator('#collection-items [data-card="SkyLift"]').waitFor({state:'attached'});
      assert.equal(await page.evaluate(()=>window.harnessWidgetState.privateContent.screen),'collection'); assert.equal(await frame.getByRole('radio',{name:'Cards',exact:true}).isChecked(),true);
      await frame.locator('#page-back').click(); await frame.locator('#profile-open button').first().waitFor();
      await frame.locator('#profile-open button').first().click(); await frame.locator('[data-screen="board"]:not([hidden])').waitFor(); assert.equal(await page.evaluate(()=>window.harnessView.game_id),openIds[0]);
      assert.deepEqual(await page.evaluate(()=>Object.keys(window.harnessWidgetState.privateContent).sort()),['board_id','pending','screen','sheet']); assert.deepEqual(await page.evaluate(()=>window.harnessWidgetState.modelContent),{});
      const saved=await page.evaluate(()=>JSON.stringify(window.harnessWidgetState)); for(const row of data.history) { assert(!saved.includes(row.game_id)); if(row.opponent.handle) assert(!saved.includes(row.opponent.handle)); }
    }
    if(mode==='fixture') await seed({history,record:{...record,rating:{rating:1600.6,rd:90,volatility:.06,provisional:false}}});
    await openScreen('profile'); await frame.locator('#profile-status').filter({hasText:'Loading profile…'}).waitFor({state:'hidden'});
    if(mode==='fixture') { assert.equal(await frame.locator('#profile-rating .q').isVisible(),false); assert.equal(await frame.locator('#profile-rating b').textContent(),'1601'); }
    const reads=await page.evaluate(()=>window.harnessCalls.filter(c=>c.name==='kingdown_profile').length); await remountFrame();
    await page.waitForFunction(n=>window.harnessCalls.filter(c=>c.name==='kingdown_profile').length>n,reads); await frame.locator('#profile-open button').first().waitFor();
    assert.equal(await page.evaluate(()=>window.harnessWidgetState.privateContent.screen),'profile');
    for(const basename of ['pawn-w','archer-w','paladin-w','guard-w','maester-w','beast-w','ogre-w','rook-w','bishop-w','knight-w','queen-w','flame','frost','stratus','mud','spirit','shadow','freeze','icewall','leap','march','mimic','sacrifice','salvation','skylift','vault']) assert([...seenImages].some(src=>src.includes('/'+basename+'-')&&src.endsWith('.webp')),`${basename}.webp loads on the page`);
    assert.deepEqual(faults,[],'No page response is 4xx'); page.off('response',responseFault);
    for(const game_id of openIds) await profileTool('kingdown_abort',{game_id});
    await openPlay(); console.log(`Profile and collection: two open games, ${mode==='fixture'?'23 rows in two pages, six badges, provisional change':'three real PostgreSQL results and private handles'}, all four collection tabs, images, remounts and three viewport sizes. Look: ${look}`);
  }
  const navCalls = await page.evaluate(() => window.harnessCalls.length);
  await frame.getByRole('radio', { name: 'A random player', exact: true }).locator('..').click(); await frame.locator('#play-open').click(); await frame.locator('[data-screen="lobby"]:not([hidden])').waitFor(); await openPlay();
  await frame.getByRole('radio', { name: 'A friend', exact: true }).locator('..').click(); await frame.locator('#token').fill('K7QX2M'); await frame.locator('#join').click(); await frame.locator('[data-screen="join"]:not([hidden])').waitFor(); await openPlay();
  // Opening a screen may read (the lobby list, a join preview, the games rows) but never writes: no game, seat or setting changes.
  const navWrites = await page.evaluate(n => window.harnessCalls.slice(n).filter(({ name, arguments: a = {} }) =>
    !['kingdown_get', 'kingdown_games', 'kingdown_lobby', 'kingdown_profile'].includes(name)
    && !(name === 'kingdown_join' && a.preview === true) && !(name === 'kingdown_handle' && a.check === true)
    && !(name === 'kingdown_settings' && Object.keys(a).every(k => k === 'board_id'))).map(c => c.name), navCalls);
  assert.deepEqual(navWrites, [], 'Play rows and Back send no write call');
  assert.equal(await page.evaluate(() => JSON.stringify(window.harnessWidgetState).includes('K7QX2M')), false, 'The join code stays in page memory');
  // Ticket 12: setup and its three sheets.
  {
    const { DEFAULT_OPTIONS, DEAL_CARDS } = await import('../src/match/setup.ts');
    const { tmpdir } = await import('node:os');
    const { join } = await import('node:path');
    const { mkdir } = await import('node:fs/promises');
    const { default: sharp } = await import('sharp');
    const look = join(tmpdir(), 'kingdown-look', '12'); await mkdir(look, { recursive: true });
    const setupTool = async (name, args = {}, friend = false) => {
      const result = await (await page.request.post(new URL(friend ? '/fixture-friend-tool' : '/fixture-tool', base).href, { data: { name, arguments: args } })).json();
      assert(!result.isError, `${name}: ${JSON.stringify(result.content)}`); return result;
    };
    async function abortSetup(game) {
      // The computer can still make its first move. Let that command end before cleanup reads and aborts.
      if (await page.evaluate(id=>window.harnessWidgetState.privateContent.screen==='board'&&window.harnessView.game_id===id&&window.harnessView.kind==='solo',game)) {
        await frame.locator('#status').filter({hasText:'Your move'}).waitFor({timeout:5000}); await idleBoard();
      }
      await setupTool('kingdown_abort',{game_id:game});
    }
    const baseSetup = { kind: 'solo', options: DEFAULT_OPTIONS, colour: 'white', level: 'club', king: null };
    async function setupMount(last_setup) {
      await setupTool('kingdown_settings', { last_setup });
      const reads = await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_settings').length);
      await page.evaluate(() => { window.harnessDropWidgetWrites=true; window.harnessWidgetState.privateContent.screen = 'play'; window.harnessWidgetState.privateContent.sheet = undefined; window.harnessWidgetState.privateContent.pending = undefined; });
      await remountFrame();
      await page.waitForFunction(n => window.harnessCalls.filter(c => c.name === 'kingdown_settings').length > n, reads);
      await frame.locator('#setup-start:not(:disabled)').waitFor();
      await page.evaluate(()=>{window.harnessDropWidgetWrites=false;});
    }
    async function setupFits(width, height, state, compare = true) {
      await page.setViewportSize({ width, height });
      const root = await frame.locator('body').evaluate(el => ({ overflow: el.scrollWidth > innerWidth, width: innerWidth }));
      assert(!root.overflow && root.width <= width, `${state} document fits ${width}px`);
      for (const selector of ['#new-game .new-game-body', '#menu-sheet .sheet-body']) {
        const sizes = await frame.locator(selector).evaluateAll(els => els.map(el => ({ width: el.clientWidth, scroll: el.scrollWidth, wide: [...el.querySelectorAll('*')].filter(child => child.getBoundingClientRect().right > el.getBoundingClientRect().right).map(child => ({ tag: child.tagName, id: child.id, cls: child.className, width: child.getBoundingClientRect().width, text: child.textContent.slice(0,60) })) })));
        assert(sizes.every(size => size.scroll <= size.width + 1), `${state} ${selector} has no sideways scroll: ${JSON.stringify(sizes)}`);
      }
      assert(await frame.locator('#new-game label.toggle').evaluateAll(rows => rows.every(row => { const r = row.getBoundingClientRect(), text = row.querySelector('.grow').getBoundingClientRect(); return text.top >= r.top - 1 && text.bottom <= r.bottom + 1; })), `${state} toggle text stays inside its row`);
      const sheet = await frame.locator('#menu-sheet').count();
      const controls = frame.locator(sheet ? '#menu-sheet button:visible, #menu-sheet label:visible' : '#setup-body button:visible, #setup-body label:visible, #setup-start');
      const bounds = await controlsInView(controls), labels = await controls.allInnerTexts();
      for (const [i, control] of bounds.entries()) {
        assert(control.accessible, `${state} control fits ${width}px: ${labels[i]}`);
        const target = await controls.nth(i).boundingBox(); assert(target.width >= 44 && target.height >= 44, `${state} keeps a 44 px target at ${width}px: ${labels[i]} (${target.width} x ${target.height})`);
      }
      const footer = frame.locator(sheet ? '#setup-done' : '#setup-start');
      assert((await footer.evaluate(controlBounds)).accessible, `${state} footer stays above the composer`);
      await frame.locator(sheet ? '#menu-sheet .sheet-body' : '#new-game .new-game-body').evaluate(el => { el.scrollTop = 0; });
      await frame.locator('#new-game img, #menu-sheet img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
      const shotPath = await shot(page, `${state}-${width}-${mode}`);
      if (compare && (width === 390 || width === 1440)) {
        const size = width === 390 ? 'phone' : 'desktop', reference = await sharp(`docs/specs/chatgpt-mvp/sample/png/${state}-${size}.png`).resize(width, height).toBuffer();
        const actual = await readFile(shotPath);
        await sharp({ create: { width: width * 2, height, channels: 4, background: '#ffffff' } }).composite([{ input: reference, left: 0, top: 0 }, { input: actual, left: width, top: 0 }]).png().toFile(join(look, `${state}-${size}-${mode}.png`));
      }
    }
    await frame.getByRole('radio', { name: 'Computer', exact: true }).locator('..').click();
    assert.equal(await frame.locator('#setup-start').count(), 1, 'Setup has the game controls and its fixed Start footer');
    assert(await frame.getByRole('checkbox', { name: 'Fairy pieces', exact: true }).isChecked());
    assert(await frame.getByRole('checkbox', { name: 'Arrangement', exact: true }).isChecked());
    assert(!await frame.getByRole('checkbox', { name: 'Cards', exact: true }).isChecked());
    assert(!await frame.getByRole('checkbox', { name: 'King powers', exact: true }).isChecked());
    assert(await frame.locator('input[name="setup-colour"][value="white"]').isChecked());
    assert(await frame.locator('input[name="setup-level"][value="club"]').isChecked());
    await frame.getByRole('radio', { name: 'A friend', exact: true }).locator('..').click(); assert(!await frame.locator('#setup-level').isVisible());
    await frame.getByRole('radio', { name: 'Computer', exact: true }).locator('..').click();
    await frame.getByRole('checkbox', { name: 'Fairy pieces', exact: true }).uncheck();
    assert(!await frame.locator('#arrangement-row').isVisible()); assert(!await frame.locator('#setup-pieces').isVisible());
    await frame.getByRole('checkbox', { name: 'Classic chess', exact: true }).check();
    await frame.getByRole('checkbox', { name: 'Fairy pieces', exact: true }).check();
    assert(await frame.getByRole('checkbox', { name: 'Arrangement', exact: true }).isChecked()); assert(!await frame.locator('#classic-row').isVisible());
    await frame.getByRole('checkbox', { name: 'Fairy pieces', exact: true }).uncheck(); assert(await frame.getByRole('checkbox', { name: 'Classic chess', exact: true }).isChecked());
    await setupMount({ ...baseSetup, colour: 'random', options: { ...DEFAULT_OPTIONS, arrangement: false, kingPowers: true } });
    await frame.locator('#setup-king').click(); await frame.locator('#setup-done').click();
    await page.evaluate(() => { window.holdNext = 'kingdown_settings'; });
    await frame.locator('#setup-start').click(); await page.waitForFunction(() => !!window.releaseHeld);
    await frame.getByRole('checkbox', { name: 'Cards', exact: true }).check(); await frame.locator('#setup-king').click(); await page.evaluate(() => window.releaseHeld());
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    assert.equal(await page.evaluate(() => window.harnessView.options.cards), false, 'Start sends the same choices it saves before the delayed reply');
    assert.equal(await frame.locator('#menu-sheet').count(), 0, 'A sheet opened during Start closes when the page changes');
    await frame.locator('#status').filter({ hasText: /Your move|Their move/ }).waitFor({ timeout: 5000 }); await boardBox();
    assert.equal((await setupTool('kingdown_settings'))._meta.settings.last_setup.king, null, 'Opening the king sheet without a pick keeps the server seat default');
    await abortSetup(await page.evaluate(() => window.harnessView.game_id));
    const { checkCardChoices } = await import('./lib/plugin-cards-check.mjs');
    await checkCardChoices(page, frame, setupMount, { ...baseSetup, options: { ...DEFAULT_OPTIONS, cards: true } }, DEAL_CARDS);
    await setupMount({ ...baseSetup, options: { ...DEFAULT_OPTIONS, cards: true } }); await frame.locator('#setup-cards').click();
    assert((await frame.locator('label.card-face:has(input[value="Freeze"]) small').innerText()).startsWith('As your move, freeze'), 'Card text uses the rules of a game with king powers off');
    await frame.locator('#setup-done').click();
    const sampleSetup = { ...baseSetup, options: { ...DEFAULT_OPTIONS, cards: true, kingPowers: true, cardPool: DEAL_CARDS.filter((_, i) => ![9,12,13,16,18].includes(i)) }, king: { king: 'Mud', power: 'March' } };
    for (const state of ['setup','setup-classic','setup-pieces','setup-cards','setup-king']) {
      const last = state === 'setup-classic' ? { ...baseSetup, options: { ...DEFAULT_OPTIONS, fairy: false, arrangement: false, classic: true } }
        : state === 'setup-pieces' ? { ...sampleSetup, options: { ...sampleSetup.options, pool: ['N','A','M','S'] } } : sampleSetup;
      await setupMount(last);
      if (state === 'setup-pieces') await frame.locator('#setup-pieces').click();
      if (state === 'setup-cards') await frame.locator('#setup-cards').click();
      if (state === 'setup-king') {
        await frame.locator('#setup-king').click();
        assert.equal(await frame.locator('#king-picker .emblem').count(), 6);
        assert(await frame.locator('#king-picker .emblem').evaluateAll(buttons => buttons.every(button => {
          const style = getComputedStyle(button), box = button.getBoundingClientRect();
          return style.backgroundImage === 'none' && !style.boxShadow.includes('inset') && box.width >= 44 && box.height >= 44;
        })), 'King pictures keep their own face, including selected and disabled pictures');
        assert.equal(await frame.locator('#king-picker .emblem:disabled').count(), 3);
        assert(await frame.locator('#king-picker .emblem:disabled').evaluateAll(buttons => buttons.every(button => {
          const style = getComputedStyle(button);
          return style.backgroundColor === 'rgba(0, 0, 0, 0)' && style.borderColor === 'rgba(0, 0, 0, 0)';
        })), 'Disabled king pictures keep their transparent face and border');
        assert(await frame.locator('#king-picker .emblem[aria-pressed="true"]').evaluate(button => {
          const selected = getComputedStyle(button), clear = getComputedStyle(button.parentElement.querySelector('[aria-pressed="false"]'));
          return selected.borderColor !== clear.borderColor && selected.backgroundColor !== clear.backgroundColor;
        }), 'The selected king picture keeps its selection mark');
      }
      for (const [width,height] of [[390,844],[400,900],[1440,900],[360,844]]) await setupFits(width, height, state);
      if (state === 'setup-king') {
        await page.setViewportSize({ width: 1440, height: 900 });
        const frameBox = await frame.locator('#app-frame').boundingBox(), sheetBox = await frame.locator('#menu-sheet').boundingBox();
        assert(Math.abs(sheetBox.height - (frameBox.height - 48)) < 2, 'The desktop king sheet keeps the sample height');
      }
      await page.evaluate(() => window.harnessSetContext({ theme: 'light', deviceCapabilities: { touch: true }, safeAreaInsets: { top: 6, right: 8, bottom: 18, left: 12 } }));
      await setupFits(390, 844, `${state}-safe`, false);
      await page.evaluate(() => window.harnessSetContext({ theme: 'light', deviceCapabilities: { touch: true }, safeAreaInsets: { top: 0, right: 0, bottom: 0, left: 0 } }));
      if (state !== 'setup' && state !== 'setup-classic') await frame.locator('#setup-done').click();
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await setupMount({ ...sampleSetup, options: { ...sampleSetup.options, pool: ['N','A','M','S'] } });
    await frame.locator('#setup-pieces').click();
    assert.equal(await frame.locator('.pick-list input:checked:disabled').count(), 4, 'Four kinds supply exactly seven pieces');
    await frame.getByRole('checkbox', { name: 'Queen', exact: true }).check();
    assert(!await frame.getByRole('checkbox', { name: 'Beast', exact: true }).isDisabled(), 'Adding one piece frees the one-piece lock');
    assert(await frame.getByRole('checkbox', { name: 'Archer', exact: true }).isDisabled(), 'Eight pieces still cannot lose two archers');
    await frame.locator('#setup-done').click(); await frame.locator('#setup-cards').click();
    const keep = ['Freeze','IceWall','Strike','Haste'];
    for (const card of sampleSetup.options.cardPool.filter(c => !keep.includes(c))) await frame.locator(`.card-grid input[value="${card}"]`).uncheck();
    assert.equal(await frame.locator('.card-grid input:checked:disabled').count(), 0, 'Cards do not lock at four');
    await frame.locator('.card-grid input[value="Leap"]').check(); assert(!await frame.locator('.card-grid input[value="Freeze"]').isDisabled());
    await frame.locator('#setup-done').click(); await frame.locator('#setup-king').click();
    assert.equal(await frame.locator('.emblem.is-out[aria-disabled="true"]').count(), 3, 'Cards exclude Frost, Flame and Stratus');
    assert(await frame.locator('[data-power="Leap"]').isDisabled());
    assert.equal(await frame.getByRole('button', { name: 'No power', exact: true }).count(), 0);
    await frame.locator('[data-king="Shadow"]').click(); await frame.locator('[data-power="Darkness"]').click(); await frame.locator('#setup-done').click();
    await frame.getByRole('radio', { name: 'Strong', exact: true }).locator('..').click(); await frame.getByRole('radio', { name: 'Black', exact: true }).locator('..').click();
    await frame.getByRole('checkbox', { name: 'Arrangement', exact: true }).uncheck();
    await frame.locator('#setup-start').click(); await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    assert.equal(await page.evaluate(() => window.harnessView.seat), 1);
    assert.deepEqual(await page.evaluate(() => window.harnessView.kings[1]), { king: 'Shadow', power: 'Darkness' });
    // Ticket 22: measure the card image against its card coin. The image is centred when the two gaps on each axis
    // match (x and y are 0). It fills the coin face inside the ring when it keeps a 4 px gutter at each size:
    // 26 px in a 34 px coin and 36 px in a 44 px coin, with the 1 px border, the 2 px ring and 1 px of light.
    // `cardFaces` holds `#game-table` (a strip redraw keeps it) and finds the images in the same page call as the
    // measure, so the computer's reply, which redraws the strips, cannot detach a found image.
    const faceFaults = (faces, size) => faces.filter(face => !['strip-me', 'strip-them'].includes(face.side)
      || face.coin !== size || face.image !== size - 8 || face.x !== 0 || face.y !== 0);
    await page.setViewportSize({ width: 393, height: 852 });
    await frame.locator('#board[aria-busy="false"]:not([data-animating="true"])').waitFor();
    await widget().waitForFunction(() => document.querySelector('#game-table').getAnimations({ subtree: true }).every(animation => animation.playState === 'finished'));
    assert.equal(await frame.locator('#game-table .coin').count(), 10, 'Both strips show four cards and one power');
    const coins44 = await frame.locator('#game-table').evaluate(table => [...table.querySelectorAll('.coin')].map(coin => {
      const style = getComputedStyle(coin), box = coin.getBoundingClientRect();
      return { id: coin.id, width: box.width, height: box.height, radii: [style.borderTopLeftRadius, style.borderTopRightRadius, style.borderBottomLeftRadius, style.borderBottomRightRadius], radial: style.backgroundImage.includes('radial-gradient'), stone: style.backgroundImage.includes('stone-control'), disabled: coin.disabled, motion: coin.getAnimations().map(animation => animation.playState) };
    }));
    assert(coins44.every(coin => coin.radii.every(radius => radius === '50%') && Math.abs(coin.width - coin.height) < .5 && coin.width >= 44 && coin.radial && !coin.stone), `Card and power coins stay round with 44 px targets at 393 × 852: ${JSON.stringify(coins44)}`);
    const faces44 = await cardFaces(frame);
    assert.equal(faces44.length, 8, 'Both strips show four card coins at 393 × 852');
    assert.deepEqual(faceFaults(faces44, 44), [], 'The card image is centred in the 44 px card coin and fills its face in both strips');
    assert(await frame.locator('#board').evaluate(board => [board, board.parentElement].every(surface => !getComputedStyle(surface).backgroundImage.includes('stone-control'))), 'The board and its parent keep the stone control face off the board');
    // The Black seat waits for the computer's first move. Until its reply the Menu is off and shows the disabled face;
    // the real server (plugin-ui-http) replies later than the fixture.
    await frame.locator('#board-menu:not(:disabled)').waitFor();
    assert((await frame.locator('#board-menu').evaluate(button => getComputedStyle(button).backgroundImage)).includes('stone-control'), 'Menu keeps the stone face');
    await shot(page, `base-round-coins-393-${mode}`);
    await page.setViewportSize({ width: 390, height: 844 });
    const desktop = await browser.newPage({ viewport: { width: 1000, height: 1000 }, hasTouch: false, reducedMotion: 'reduce' });
    trapErrors(desktop);
    try {
      await desktop.goto(base);
      const desktopFrame = desktop.frameLocator('iframe');
      await desktopFrame.locator('#home-play:not(:disabled)').waitFor();
      await desktop.evaluate(() => window.harnessSetContext({ displayMode: 'fullscreen', deviceCapabilities: { touch: false } }));
      const opened = await setupTool('kingdown_open', { game_id: await page.evaluate(() => window.harnessView.game_id) });
      await desktop.evaluate(result => window.harnessShow(result, true), opened);
      await desktopFrame.locator('#board[aria-busy="false"]:not([data-animating="true"])').waitFor();
      assert.equal(await desktopFrame.locator('#game-table .coin').count(), 10);
      assert(await desktopFrame.locator('#game-table').evaluate(table => [...table.querySelectorAll('.coin')].every(coin => {
        const style = getComputedStyle(coin), box = coin.getBoundingClientRect();
        return style.borderRadius === '50%' && Math.abs(box.width - box.height) < .5 && box.width === (coin.classList.contains('card-coin') ? 34 : 40);
      })), 'Card and power coins stay round on a desktop without touch');
      // Ticket 22: the same face rule holds on a desktop without touch, at the 34 px card coin.
      await desktop.setViewportSize({ width: 1280, height: 800 });
      await desktopFrame.locator('#board[aria-busy="false"]:not([data-animating="true"])').waitFor();
      await desktop.mainFrame().childFrames()[0].waitForFunction(() => document.querySelector('#game-table').getAnimations({ subtree: true }).every(animation => animation.playState === 'finished'));
      const faces34 = await cardFaces(desktopFrame);
      assert.equal(faces34.length, 8, 'Both strips show four card coins at 1280 × 800');
      assert.deepEqual(faceFaults(faces34, 34), [], 'The card image is centred in the 34 px card coin and fills its face in both strips');
    } finally { await desktop.close(); }
    const saved = (await setupTool('kingdown_settings'))._meta.settings.last_setup;
    assert.deepEqual(saved.king, { king: 'Shadow', power: 'Darkness' }); assert.equal(saved.level, 'strong'); assert.equal(saved.colour, 'black');
    await abortSetup(await page.evaluate(() => window.harnessView.game_id));
    await setupMount(saved); assert.equal(await frame.locator('#setup-king-name').innerText(), 'Shadow · Darkness');
    assert(await frame.getByRole('radio', { name: 'Strong', exact: true }).isChecked()); assert(await frame.getByRole('radio', { name: 'Black', exact: true }).isChecked());
    for (const kind of ['friend', 'random']) {
      const remembered = { ...saved, kind, options: { ...saved.options, arrangement: true } };
      await setupMount(remembered);
      // Spec J10 a: the hall has Play now (the home card shows it only while you have no games).
      await frame.locator('#hall-play').click();
      await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
      const quick = await page.evaluate(() => window.harnessView);
      assert.equal(quick.kind, 'solo', `Play now starts a computer game from a saved ${kind} setup`);
      assert.equal(quick.level, 'beginner');
      assert.deepEqual(quick.options, { ...remembered.options, arrangement: false });
      assert(await frame.locator('[data-screen="seat"]').isHidden(), 'Play now skips the seat screen with saved Arrangement on');
      assert.deepEqual((await setupTool('kingdown_settings'))._meta.settings.last_setup, remembered, `Play now keeps the saved ${kind} setup`);
      await openPlay();
      assert(await frame.getByRole('radio', { name: kind === 'friend' ? 'A friend' : 'A random player', exact: true }).isChecked());
      assert(await frame.getByRole('checkbox', { name: 'Arrangement', exact: true }).isChecked());
      await frame.getByRole('radio', { name: 'Computer', exact: true }).locator('..').click();
      assert(await frame.getByRole('radio', { name: 'Strong', exact: true }).isChecked(), 'New game keeps the saved level');
      await abortSetup(quick.game_id);
    }
    for (const [name, recovery] of [['kingdown_create', 'retry'], ['kingdown_create', 'remount'], ['kingdown_choose', 'retry'], ['kingdown_get', 'retry']]) {
      const remembered = { ...baseSetup, kind: 'friend', level: 'strong', options: { ...DEFAULT_OPTIONS, arrangement: true, kingPowers: true } };
      await setupMount(remembered);
      await page.evaluate(name => { window.dropNextReply = name; }, name);
      await frame.locator('#hall-play').click();
      await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
      await frame.locator('#retry:not(:disabled)').waitFor();
      const pending = await page.evaluate(() => window.harnessWidgetState.privateContent.pending);
      assert.equal(pending.name, name);
      assert.equal(pending.quick, true, `${name} keeps the Play now marker`);
      assert(await frame.getByRole('radio', { name: 'Computer', exact: true }).isChecked());
      assert(await frame.getByRole('radio', { name: 'Beginner', exact: true }).isChecked());
      assert(!await frame.getByRole('checkbox', { name: 'Arrangement', exact: true }).isChecked());
      assert.doesNotMatch(await frame.locator('#setup-start').innerText(), /Strong|Arrangement/);
      // A remount of a pending with an error shows its saved words and Retry; the player taps Retry (design §5.3).
      if (recovery === 'remount') { await page.locator('#remount').click(); await frame.locator('#retry:not(:disabled)').waitFor(); }
      await frame.locator('#retry').click();
      await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
      const quick = await page.evaluate(() => window.harnessView);
      assert.equal(quick.kind, 'solo'); assert.equal(quick.level, 'beginner'); assert.equal(quick.options.arrangement, false);
      assert.deepEqual((await setupTool('kingdown_settings'))._meta.settings.last_setup, remembered);
      if (name === 'kingdown_choose') assert.equal(await page.evaluate(() => window.harnessCalls.findLast(c => c.name === 'kingdown_choose').arguments.command_id), pending.args.command_id, 'Retry keeps the king choice command ID');
      await openPlay();
      assert(await frame.getByRole('radio', { name: 'A friend', exact: true }).isChecked());
      assert(await frame.locator('input[name="setup-level"][value="strong"]').isChecked());
      assert(await frame.getByRole('checkbox', { name: 'Arrangement', exact: true }).isChecked());
      await abortSetup(quick.game_id);
    }
    assert.deepEqual(page.viewportSize(), { width: 390, height: 844 }, 'The setup mixes and recovery checks use the phone size');
    const levels = ['beginner','casual','club','strong']; let mix = 0;
    for (const fairy of [true,false]) for (const secondary of [false,true]) for (const cards of [false,true]) for (const powers of [false,true]) {
      const options = { ...DEFAULT_OPTIONS, fairy, arrangement: fairy && secondary, classic: !fairy && secondary, cards, kingPowers: powers };
      const last = { ...baseSetup, options, colour: ['white','black','random'][mix % 3], level: levels[mix++ % 4] };
      // Abort keeps the last game's king. Give each toggle case the same starting draft.
      await setupMount(baseSetup); await frame.getByRole('radio', { name: 'Computer', exact: true }).locator('..').click();
      await frame.getByRole('checkbox', { name: 'Fairy pieces', exact: true }).setChecked(fairy);
      await frame.getByRole('checkbox', { name: fairy ? 'Arrangement' : 'Classic chess', exact: true }).setChecked(secondary);
      await frame.getByRole('checkbox', { name: 'Cards', exact: true }).setChecked(cards);
      await frame.getByRole('checkbox', { name: 'King powers', exact: true }).setChecked(powers);
      await frame.getByRole('radio', { name: last.colour[0].toUpperCase() + last.colour.slice(1), exact: true }).locator('..').click();
      await frame.getByRole('radio', { name: last.level[0].toUpperCase() + last.level.slice(1), exact: true }).locator('..').click();
      await frame.locator('#setup-start').click();
      await page.waitForFunction(() => ['board','seat'].includes(window.harnessWidgetState.privateContent.screen) && !window.harnessWidgetState.privateContent.pending);
      let view = await page.evaluate(() => window.harnessView);
      assert.deepEqual(view.options, options, `Toggle mix ${mix} reaches the server`); assert.equal(view.level, last.level);
      if (last.colour !== 'random') assert.equal(view.seat, last.colour === 'black' ? 1 : 0);
      if (options.classic) assert.equal(view.draw, 'RNBQKBNR');
      else { assert.equal(view.draw.length, 8); assert.equal([...view.draw].filter(l => l === 'K').length, 1); if (fairy) assert([...view.draw].filter(l => l !== 'K').every(l => options.pool.includes(l))); else assert.equal([...view.draw].sort().join(''), 'BBKNNQRR'); }
      assert.equal(view.deal.length, cards ? 4 : 0); assert(view.deal.every(c => options.cardPool.includes(c)));
      if (view.status === 'setup') view = (await setupTool('kingdown_choose', { game_id: view.game_id, command_id: randomUUID(), expected_revision: view.revision, king: view.choices[view.seat].king, order: view.draw, ready: true }))._meta.view;
      assert.equal(view.status, 'playing'); assert.deepEqual(view.kings, powers ? [{ king: 'Spirit', power: 'Mercy' }, { king: 'Shadow', power: 'Darkness' }] : [null,null]);
      await abortSetup(view.game_id);
    }
    const waitingLast = { ...sampleSetup, kind: 'friend' };
    await setupMount(waitingLast); await page.evaluate(() => { window.requireHandleNext = true; }); await frame.locator('#setup-start').click();
    await frame.locator('[data-screen="handle"]:not([hidden])').waitFor(); assert.deepEqual((await setupTool('kingdown_settings'))._meta.settings.last_setup, waitingLast, 'Settings reach the server before HANDLE_NEEDED');
    await frame.locator('#handle').fill(testHandle); await frame.locator('#save-handle').click(); await frame.locator('[data-screen="friend"]:not([hidden])').waitFor();
    assert.equal(await page.evaluate(() => window.harnessView.days_per_move), 3);
    const waiting = await page.evaluate(() => window.harnessView); assert.equal(waiting.choices[waiting.seat].king.king, 'Spirit', 'Waiting keeps the server default; the remembered king goes to the seat screen');
    await abortSetup(waiting.game_id);
    // A lost Start reply survives a remount without a second game: the remount shows Retry, and Retry sends the same
    // command ID, so the receipt gives back the first game (design §5.2 and §5.3).
    await setupMount({ ...baseSetup, options: { ...DEFAULT_OPTIONS, arrangement: false, kingPowers: true } });
    await page.evaluate(() => { window.dropNextReply = 'kingdown_create'; }); await frame.locator('#setup-start').click(); await frame.locator('#retry').waitFor();
    const startId = await page.evaluate(() => window.harnessCalls.findLast(c => c.name === 'kingdown_create').arguments.command_id);
    await remountFrame(); await frame.locator('#retry:not(:disabled)').waitFor(); await frame.locator('#retry').click();
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor({ timeout: 5000 });
    assert.equal(await page.evaluate(() => window.harnessCalls.findLast(c => c.name === 'kingdown_create').arguments.command_id), startId, 'Retry sends the same Create command ID');
    const privateState = await page.evaluate(() => window.harnessWidgetState.privateContent);
    assert.deepEqual(Object.keys(privateState).sort(), ['board_id','pending','screen','sheet']);
    assert.equal(await page.evaluate(() => JSON.stringify(window.harnessWidgetState.modelContent)), '{}', 'Setup puts no choice or draw in model context');
    await openPlay(); await frame.getByRole('radio', { name: 'Computer', exact: true }).locator('..').click();
    assert.equal(await frame.locator('#setup-body .modes label').count(), 3, 'Setup still builds after a restored Start');
    const recovered = await page.evaluate(() => window.harnessView); await abortSetup(recovered.game_id);
    await setupMount({ ...baseSetup, kind: 'random', options: { ...DEFAULT_OPTIONS, arrangement: false } }); await frame.locator('#setup-start').click(); await frame.locator('[data-screen="wait"]:not([hidden])').waitFor();
    const random = await page.evaluate(() => window.harnessView); assert.equal(random.kind, 'random'); await setupTool('kingdown_cancel', { game_id: random.game_id });
    // Find takes an open game with the same five switches (approval D1 a); its piece pool may differ from the sent one.
    const offeredOptions = { ...DEFAULT_OPTIONS, arrangement: false, pool: ['Q', 'R', 'B', 'N'] };
    await setupTool('kingdown_create', { kind: 'random', options: offeredOptions, colour: 'white' }, true);
    await setupMount({ ...baseSetup, kind: 'random', options: { ...DEFAULT_OPTIONS, arrangement: false } }); await frame.locator('#setup-start').click(); await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    const accepted = await page.evaluate(() => window.harnessView);
    assert.deepEqual(accepted.options, offeredOptions, 'Find uses the accepted game features instead of the sent choices');
    await abortSetup(accepted.game_id);
    // A lost Choose reply keeps its command receipt and still opens the board after remount.
    await setupMount({ ...baseSetup, options: { ...DEFAULT_OPTIONS, arrangement: false, kingPowers: true } });
    await page.evaluate(() => { window.dropNextReply = 'kingdown_choose'; }); await frame.locator('#setup-start').click(); await frame.locator('#retry').waitFor();
    const chooseId = await page.evaluate(() => window.harnessWidgetState.privateContent.pending.args.command_id);
    await remountFrame(); await frame.locator('#retry').waitFor(); await frame.locator('#retry').click();
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor({ timeout: 5000 });
    assert.equal(await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_choose').at(-1).arguments.command_id), chooseId);
    await abortSetup(await page.evaluate(() => window.harnessView.game_id));
    // S5 review: the start's Choose waits while a newer chat result opens Profile.
    await setupMount({ ...baseSetup, king: {king:'Frost',power:'Freeze'}, options:{...DEFAULT_OPTIONS,arrangement:true,kingPowers:true} });
    await page.evaluate(() => { window.dropNextReply = 'kingdown_create'; });
    await frame.locator('#setup-start').click(); await frame.locator('#retry:not(:disabled)').waitFor();
    const lateGame = await page.evaluate(() => window.harnessView.game_id);
    await page.evaluate(() => { window.holdNext = 'kingdown_choose'; });
    await frame.locator('#retry').click(); await page.waitForFunction(() => !!window.releaseHeld);
    const profile = await setupTool('kingdown_open', {screen:'profile'});
    await page.evaluate(result => window.harnessShow(result), profile);
    await frame.locator('[data-screen="profile"]:not([hidden])').waitFor();
    await page.evaluate(() => window.releaseHeld()); await settled();
    assert(await frame.locator('[data-screen="profile"]').isVisible(), 'A late Choose keeps the newer Profile screen');
    assert.equal(await page.evaluate(() => window.harnessWidgetState.privateContent.pending ?? null), null);
    await abortSetup(lateGame);
    // A computer reply must leave the newer game's mount in its own epoch.
    const nextSeat = await setupTool('kingdown_create', { kind: 'solo', colour: 'white', options: { ...DEFAULT_OPTIONS, arrangement: true, kingPowers: false } });
    await setupMount({ ...baseSetup, colour: 'black', options: { ...DEFAULT_OPTIONS, arrangement: false, kingPowers: false } });
    await page.evaluate(() => { window.holdNext = 'kingdown_computer'; });
    await frame.locator('#setup-start').click(); await page.waitForFunction(() => !!window.releaseHeld);
    const oldComputerGame = await page.evaluate(() => window.harnessView.game_id);
    const seatResult = await setupTool('kingdown_open', { game_id: nextSeat._meta.view.game_id });
    const getsBeforeSeat = await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_get').length);
    await page.evaluate(result => { window.holdNextGet = true; return window.harnessShow(result); }, seatResult);
    await page.evaluate(() => window.releaseHeld());
    await page.waitForFunction(() => !!window.releaseHeldGet); await settled();
    assert.equal(await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_get').length), getsBeforeSeat + 1, 'The old computer reply sends no recovery read over the mount');
    await page.evaluate(() => window.releaseHeldGet()); await settled();
    await frame.locator('[data-screen="seat"]:not([hidden])').waitFor();
    assert.equal(await page.evaluate(() => window.harnessWidgetState.privateContent.screen), 'seat');
    await abortSetup(nextSeat._meta.view.game_id); await abortSetup(oldComputerGame);
    // Check the mount lock before release, then the returned list and all error lines.
    for (const held of ['kingdown_settings', 'kingdown_get', 'kingdown_games']) {
      const mountGame = await setupTool('kingdown_create', { kind: 'solo', colour: 'white', options: { ...DEFAULT_OPTIONS, arrangement: true, kingPowers: false } });
      const mountResult = await setupTool('kingdown_open', { game_id: mountGame._meta.view.game_id });
      await page.evaluate(result => window.harnessShow(result), mountResult);
      await frame.locator('[data-screen="seat"]:not([hidden])').waitFor(); await settled();
      const listed = (await setupTool('kingdown_games'))._meta.games;
      await page.evaluate(name => { window.holdNext = name; }, held);
      await remountFrame(); await page.waitForFunction(() => !!window.releaseHeld);
      await page.clock.fastForward(20_000); await settled();
      assert(await frame.locator('#home-play').isDisabled(), `${held} still holds the mount lock after 20 s`);
      assert(await frame.locator('#setup-start').isDisabled(), `${held} still locks Start`);
      assert.equal(await frame.locator('#error').textContent(), '');
      assert.equal(await frame.locator('#home-error').textContent(), '');
      if (held === 'kingdown_games') assert.equal(await frame.locator('#games-status').textContent(), 'Loading games…');
      await page.evaluate(() => window.releaseHeld()); await settled();
      await frame.locator('#home-play:not(:disabled)').waitFor({ state: 'attached' });
      assert.equal(await frame.locator('#error').textContent(), '');
      assert.equal(await frame.locator('#home-error').textContent(), '');
      assert.equal(await frame.locator('#games-status').textContent(), '');
      assert.deepEqual(await frame.locator('#games-list [data-game-id]').evaluateAll(rows => rows.map(row => row.dataset.gameId).sort()), listed.map(game => game.game_id).sort());
      assert.equal(await page.evaluate(() => window.harnessWidgetState.privateContent.screen), 'seat');
      await frame.locator('[data-screen="seat"]:not([hidden]) #seat-ready').waitFor();
      await abortSetup(mountGame._meta.view.game_id);
    }
    const newArt = ['archer-w','paladin-w','guard-w','maester-w','beast-w','ogre-w','rook-w','bishop-w','knight-w','queen-w','frost','flame','stratus','mud','spirit','shadow','shadow-b','freeze','icewall','sacrifice','march','leap','salvation','mimic','vault','skylift','back'];
    const html = await frame.locator('html').innerHTML(); for (const file of newArt) assert(html.includes(`/${file}-`), `Setup names ${file}.webp through art`);
    await openPlay();
    console.log(`PASS: setup defaults, 16 toggle mixes, seat kings, four levels, weighted locks, card-safe powers, HANDLE_NEEDED, saved choices and lost Start remount; look checks in ${look}`);
  }
  await legacyStart('solo');
  // Ticket 14: the hidden seat setup step.
  {
    const { DEFAULT_OPTIONS } = await import('../src/match/setup.ts');
    const { tmpdir } = await import('node:os'), { join } = await import('node:path'), { mkdir } = await import('node:fs/promises'), { default: sharp } = await import('sharp');
    const look = join(tmpdir(), 'kingdown-look', '14b'); await mkdir(look, { recursive: true });
    const seatTool = async (name, args = {}, buddy = false) => {
      const result = await (await page.request.post(new URL(buddy ? '/fixture-friend-tool' : '/fixture-tool', base).href, { data: { name, arguments: args } })).json();
      assert(!result.isError, `${name}: ${JSON.stringify(result.content)}`); return result;
    };
    const features = { ...DEFAULT_OPTIONS, pool: ['R','B','N','G'], cards: true, kingPowers: true };
    await seatTool('kingdown_settings', { last_setup: { kind: 'friend', colour: 'white', level: 'club', options: { ...features, cards: false }, king: { king: 'Mud', power: 'Leap' } } });
    async function seatShow(result) {
      const { screen, ...summary } = result.structuredContent;
      const reads = await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_get').length);
      await page.evaluate(r => window.harnessShow(r, true), { ...result, structuredContent: summary });
      await page.waitForFunction(n => window.harnessCalls.filter(c => c.name === 'kingdown_get').length > n, reads);
      await frame.locator('[data-screen="seat"]:not([hidden])').waitFor();
      assert.deepEqual(await frame.locator('body').evaluate(() => window.harnessTableIdConflicts), [], 'Setup and board keep one set of table IDs through seat reads');
      await frame.locator('#seat-menu:not(:disabled)').waitFor(); await boardBox(); await seatRemount();
    }
    async function seatRemount() {
      const reads = await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_get').length);
      await remountFrame();
      await page.waitForFunction(n => window.harnessCalls.filter(c => c.name === 'kingdown_get').length > n, reads);
      await frame.locator('#seat-menu:not(:disabled)').waitFor(); await boardBox();
    }
    async function seatTap(index, pawn = false) {
      const v = await page.evaluate(() => window.harnessView), box = await boardBox(), file = v.seat === 1 ? 7 - index : index;
      await page.touchscreen.tap(box.x + (32 + (file + .5) * 112) * box.width / 960, box.y + (96 + ((pawn ? 6 : 7) + .5) * 112) * box.width / 960);
    }
    const rankLine = (order, seat) => `Your back rank: ${(seat === 1 ? [...order].reverse() : [...order]).join(' ')}`;
    const swapped = (order, a, b) => { const row = [...order]; [row[a], row[b]] = [row[b], row[a]]; return row.join(''); };
    async function seatFits(state) {
      for (const [width,height] of [[390,844],[400,900],[1440,900],[360,844]]) {
        await page.setViewportSize({ width, height }); await boardBox();
        assert(!await frame.locator('body').evaluate(el => el.scrollWidth > innerWidth), `${state} document fits ${width}px`);
        assert(await frame.locator('[data-seat-id="game-table"]').evaluate(el => el.scrollWidth <= el.clientWidth + 1), `${state} table fits ${width}px`);
        for (const id of ['#seat-ready','#seat-shuffle','#seat-menu','#seat-king','#page-back','#seat-screen .table-back']) {
          const button = frame.locator(id); if (!await button.isVisible()) continue;
          const bounds = await button.evaluate(controlBounds); assert(bounds.accessible, `${state} ${id} stays above the composer at ${width}px: ${JSON.stringify(bounds)}`);
          const rect = await button.boundingBox(); assert(rect.width >= 44 && rect.height >= 44, `${id} keeps a 44 px target`);
        }
        const veil = await frame.locator('.veil').boundingBox(), box = await boardBox();
        assert(veil.width > box.width * .9 && veil.height > box.width * .45 && veil.height < box.width * .5, 'The veil covers the top half of the board');
        assert(veil.x >= box.x && veil.y >= box.y && veil.x + veil.width <= box.x + box.width + 1, 'The veil stays on the board');
        await frame.locator('#seat-screen img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
        const shotPath = await shot(page, `${state}-${width}-${mode}`);
        if (width === 390 || width === 1440) {
          const size = width === 390 ? 'phone' : 'desktop', reference = await sharp(`docs/specs/chatgpt-mvp/sample/png/${state}-${size}.png`).resize(width,height).toBuffer(), actual = await readFile(shotPath);
          await sharp({ create: { width: width * 2, height, channels: 4, background: '#ffffff' } }).composite([{ input: reference, left: 0, top: 0 }, { input: actual, left: width, top: 0 }]).png().toFile(join(look, `${state}-${size}-${mode}.png`));
        }
      }
      await page.setViewportSize({ width: 390, height: 844 });
    }
    async function friendSeat(black = false, settings = features) {
      const created = await seatTool('kingdown_create', { kind: 'friend', options: settings, colour: 'white' }, black);
      const invite = await seatTool('kingdown_invite', { game_id: created._meta.view.game_id }, black);
      const joined = await seatTool('kingdown_join', { code: invite.structuredContent.code }, !black);
      const opened = black ? joined : await seatTool('kingdown_open', { game_id: created._meta.view.game_id });
      await seatShow(opened); return opened._meta.view;
    }
    async function buddyReady(v) {
      const read = await seatTool('kingdown_get', { game_id: v.game_id }, true), next = read._meta.view;
      return seatTool('kingdown_choose', { game_id: next.game_id, command_id: randomUUID(), expected_revision: next.revision, ...next.choices[next.seat], ready: true }, true);
    }
    assert.deepEqual(page.viewportSize(), { width: 390, height: 844 }, 'The first seat and king sheet checks use the phone size');
    const sheetSeat = await friendSeat();
    await frame.locator('#seat-king').click();
    await buddyReady(sheetSeat);
    // A setup game polls every 5 seconds. Each poll wait below steps the page clock over the poll timer instead of
    // waiting for it in real time; fastForward fires each due timer once.
    await page.clock.fastForward(5000);
    await frame.locator('#seat-them-line').filter({ hasText: 'Ready' }).waitFor({ timeout: 10000 });
    await frame.locator('#setup-done:not(:disabled)').waitFor();
    assert(await frame.locator('[data-power="Leap"]').evaluate(el => el.disabled), 'A setup poll keeps the forbidden Cards power disabled');
    assert(await frame.locator('[data-king="Frost"]').evaluate(el => el.disabled), 'A setup poll keeps the forbidden Cards king disabled');
    await frame.locator('#setup-done').click();
    await seatTool('kingdown_abort', { game_id: sheetSeat.game_id });
    let v = await friendSeat();
    assert.equal(v.choices[1], null, 'The other choice stays hidden');
    assert.equal(await frame.locator('#seat-me-line').innerText(), 'Mud · March · select the coin to change', 'Cards clean the remembered power to the same king');
    assert((await frame.locator('#seat-them-picture').getAttribute('src')).includes('/shadow-b-'), 'The other strip shows the plain Black king');
    await frame.locator('#seat-king').click();
    assert(await frame.locator('[data-power="Leap"]').isDisabled()); assert(await frame.locator('[data-king="Frost"]').isDisabled());
    await seatRemount(); await frame.locator('#menu-sheet').waitFor({ timeout: 5000 });
    assert(await frame.locator('[data-power="Leap"]').isDisabled(), 'The restored sheet keeps the Cards power limit');
    await frame.locator('#setup-done').click();
    const initial = v.choices[0].order, r = initial.indexOf('R'), n = initial.indexOf('N');
    assert.equal(await frame.locator('#seat-context').innerText(), 'Select a marked piece to swap the knight with it.', 'The seat starts with the sample knight selected before a board tap');
    await widget().waitForFunction(() => window.harnessSwapMarks > 0);
    await seatFits('seat');
    await seatTap(r); assert.equal(await frame.locator('[data-seat-id="last-move"]').innerText(), rankLine(swapped(initial,n,r),0));
    const beforePawn = await frame.locator('[data-seat-id="last-move"]').innerText(); await seatTap(0,true); assert.equal(await frame.locator('[data-seat-id="last-move"]').innerText(), beforePawn, 'Pawns do not react');
    await seatRemount(); assert.equal(await frame.locator('[data-seat-id="last-move"]').innerText(), rankLine(initial,0), 'A draft remount starts at the server choice');
    const g = initial.indexOf('G'), k = initial.indexOf('K'), away = [...initial].findIndex((p,i) => p !== 'B' && p !== 'K' && Math.abs(i-k) > 1);
    await seatTap(n); await seatTap(g); await seatTap(away);
    assert.equal(await frame.locator('#seat-context').innerText(), 'The guard must stand next to the king.');
    assert.equal(await frame.locator('#seat-ready').getAttribute('aria-disabled'), 'true');
    const sends = await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_choose').length);
    await frame.locator('#seat-ready').evaluate(el => el.click());
    assert.equal(await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_choose').length), sends, 'Illegal Ready sends no tool');
    await frame.locator('#seat-shuffle').click();
    await page.evaluate(() => { window.dropNextReply = 'kingdown_choose'; }); await frame.locator('#seat-ready').click(); await frame.locator('#retry').waitFor();
    const pending = await page.evaluate(() => window.harnessWidgetState.privateContent.pending);
    assert(pending.args.order); assert.equal(pending.name,'kingdown_choose'); assert.equal(pending.args.game_id,undefined);
    await seatRemount(); await frame.locator('#retry').click();
    await frame.locator('#retry').waitFor({ state: 'hidden' });
    assert.equal(await page.evaluate(() => window.harnessCalls.findLast(c => c.name === 'kingdown_choose').arguments.command_id), pending.args.command_id, 'Lost Ready retries the same ID');
    assert.equal(await frame.locator('#seat-context').innerText(), 'Waiting for the other player.');
    for (const id of ['seat-ready','seat-shuffle','seat-king']) assert(await frame.locator(`#${id}`).isDisabled(), `${id} locks after Ready`);
    await seatFits('seat-waiting'); await seatRemount();
    assert.equal(await frame.locator('#seat-context').innerText(), 'Waiting for the other player.');
    assert.match(await frame.locator('#seat-note').innerText(), /3 days to choose/);
    await page.evaluate(() => { const v = window.harnessView; window.harnessNextView = { ...v, server_now: new Date(Date.parse(v.server_now) + 86400000).toISOString() }; });
    await frame.locator('body').evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    await page.waitForFunction(() => !window.harnessNextView);
    await widget().waitForFunction(() => document.querySelector('#seat-note').textContent.includes('2 days to choose'), undefined, { timeout: 3000 });
    assert.match(await frame.locator('#seat-them-line').innerText(), /2 days left/, 'An unchanged setup read refreshes both days-left lines');
    const state = await page.evaluate(() => window.harnessWidgetState);
    assert.deepEqual(Object.keys(state.privateContent).sort(), ['board_id','pending','screen','sheet']); assert.deepEqual(state.modelContent, {});
    assert(!JSON.stringify(state).includes('order') && !JSON.stringify(state).includes('game_id'), 'Idle widget state has no order or game ID');
    const hidden = (await seatTool('kingdown_get', { game_id: v.game_id }, true))._meta.view;
    assert.equal(hidden.choices[0],null); assert.deepEqual(hidden.last_commands.at(-1).action,{type:'hidden'});
    const started = await buddyReady(v);
    await page.clock.fastForward(5000);
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor({ timeout: 10000 });
    assert.deepEqual(await frame.locator('body').evaluate(() => window.harnessTableIdConflicts), [], 'Ready returns to the board with one set of table IDs');
    assert.equal(await page.evaluate(() => window.harnessView.fen), started._meta.view.fen);
    assert.deepEqual(await page.evaluate(() => window.harnessView.kings[0]), { king:'Mud',power:'March' });
    assert(await page.evaluate(() => window.harnessCalls.findLast(c => c.name === 'kingdown_get').arguments.since_revision === undefined), 'Start gets the full rules');
    await seatTool('kingdown_abort', { game_id: v.game_id });
    v = await friendSeat(true, { ...features, cards:false,kingPowers:false });
    const blackOrder = v.choices[1].order, br = blackOrder.indexOf('R'), bn = blackOrder.indexOf('N');
    assert.equal(await frame.locator('[data-seat-id="last-move"]').innerText(), rankLine(blackOrder,1));
    assert(!await frame.locator('#seat-king').isVisible());
    await seatTap(bn); await seatTap(br); await seatTap(bn);
    const blackDraft = swapped(blackOrder,br,bn); assert.equal(await frame.locator('[data-seat-id="last-move"]').innerText(), rankLine(blackDraft,1));
    // Hide the page so the buddy's first Ready cannot reach it through a poll before this Ready.
    await frame.locator('body').evaluate(() => { Object.defineProperty(document,'hidden',{configurable:true,value:true}); document.dispatchEvent(new Event('visibilitychange')); });
    await buddyReady(v);
    const count = await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_choose').length);
    await frame.locator('#seat-ready').click(); await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    const retries = await page.evaluate(n => window.harnessCalls.filter(c => c.name === 'kingdown_choose').slice(n), count);
    assert.equal(retries.length,2, 'Stale Ready reads and resends'); assert.notEqual(retries[0].arguments.command_id,retries[1].arguments.command_id);
    assert.equal(retries[1].arguments.expected_revision,retries[0].arguments.expected_revision+1);
    assert.equal(retries[1].arguments.order,blackDraft); assert.equal(retries[1].arguments.king,null);
    await frame.locator('body').evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
    await seatTool('kingdown_abort', { game_id: v.game_id });
    const solo = await seatTool('kingdown_create',{kind:'solo',options:{...features,cards:false,kingPowers:false},colour:'black',level:'beginner'});
    await seatShow(solo);
    // An old game's retained read must not lock Ready on this game's seat.
    const oldTag = v.game_id.slice(0,8);
    await page.evaluate(game_tag => {
      window.harnessWidgetState.privateContent.pending = {name:'kingdown_get',args:{},game_tag,screen:'seat',error:'Cannot connect. Check your connection, then try again.'};
    }, oldTag);
    await seatRemount();
    assert.equal(await page.evaluate(() => window.harnessWidgetState.privateContent.pending?.game_tag), oldTag);
    assert(await frame.locator('#seat-ready').isEnabled(), 'A retained read of another game leaves Ready enabled');
    assert(await frame.locator('#retry').isHidden(), 'The old read has no Retry on this game');
    await page.evaluate(() => { window.dropNextReply = 'kingdown_choose'; });
    await frame.locator('#seat-ready').click(); await frame.locator('#retry').waitFor();
    const soloId = await page.evaluate(() => window.harnessWidgetState.privateContent.pending.args.command_id);
    await remountFrame(); await frame.locator('#retry:not(:disabled)').waitFor(); await frame.locator('#retry').click();
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor({ timeout: 5000 });
    assert.equal(await page.evaluate(() => window.harnessCalls.findLast(c => c.name === 'kingdown_choose').arguments.command_id),soloId,'A started solo Ready keeps the same command after remount');
    assert.equal(await page.evaluate(() => window.harnessView.seat),1);
    // Ticket 15 owns the automatic start reply. This base still has its old Computer move control.
    if (await frame.locator('#computer').isVisible()) await frame.locator('#computer').click();
    await page.waitForFunction(() => window.harnessView.turn === window.harnessView.seat);
    await seatTool('kingdown_abort',{game_id:solo._meta.view.game_id});
    const fullRead = await seatTool('kingdown_create',{kind:'solo',options:{...features,cards:false,kingPowers:false},colour:'white'});
    await seatShow(fullRead);
    const boardLabel = await frame.locator('#board').getAttribute('aria-label');
    await frame.locator('#board').press('ArrowRight');
    assert.equal(await frame.locator('#board').getAttribute('aria-label'), 'Your back rank, b1. Enter selects a piece.');
    await page.evaluate(() => { window.rejectNextGet = true; });
    await frame.locator('#seat-ready').click(); await frame.locator('#retry').waitFor({ timeout: 5000 });
    assert.equal(await page.evaluate(() => window.harnessWidgetState.privateContent.pending.name),'kingdown_get','A failed start read stays pending');
    await frame.locator('#retry').click(); await frame.locator('[data-screen="board"]:not([hidden])').waitFor({ timeout: 5000 });
    assert(await page.evaluate(() => !!window.harnessView.rules));
    assert.equal(await frame.locator('#board').getAttribute('aria-label'), boardLabel, 'The board hand-off restores its label with its keyboard handler');
    await frame.locator('#board').press('ArrowRight');
    assert.equal(await frame.locator('#board').getAttribute('aria-label'), 'Chess board, b1. Enter selects a square.', 'Ready restores a working board keyboard handler after a setup remount');
    await seatTool('kingdown_abort',{game_id:fullRead._meta.view.game_id});
    const legacy = await (await page.request.post(new URL('/fixture-position?case=threats',base).href)).json();
    assert(!legacy.isError); assert.equal(legacy._meta.view.options,undefined);
    let legacyReads = await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_get').length);
    await page.evaluate(result => window.harnessShow(result),legacy);
    await page.waitForFunction(n => window.harnessCalls.filter(c => c.name === 'kingdown_get').length > n,legacyReads);
    await frame.locator('#reload:not(:disabled)').waitFor({ state: 'attached' });
    // The setter, not an edit in place, so a frame write still in flight does not replace it.
    await page.evaluate(() => { const saved = window.harnessWidgetState; window.harnessWidgetState = { ...saved, privateContent: { ...saved.privateContent, screen: 'seat' } }; });
    legacyReads = await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_get').length);
    await remountFrame();
    await page.waitForFunction(n => window.harnessCalls.filter(c => c.name === 'kingdown_get').length > n,legacyReads);
    await frame.locator('#reload:not(:disabled)').waitFor({ state: 'attached' }); await frame.locator('[data-screen="board"]:not([hidden])').waitFor({timeout:5000});
    await seatTool('kingdown_abort',{game_id:legacy._meta.view.game_id});
    const aborted = await friendSeat(false,{...features,cards:false,kingPowers:true,arrangement:false});
    assert(!await frame.locator('#seat-shuffle').isVisible());
    await frame.locator('#seat-menu').click(); await frame.locator('#seat-abort').click();
    assert.equal(await frame.locator('#seat-menu-title').innerText(),'Abort this game?');
    await frame.locator('#seat-abort-cancel').click(); assert.equal(await page.evaluate(() => window.harnessView.status),'setup');
    await frame.locator('#seat-menu').click(); await frame.locator('#seat-abort').click(); await frame.locator('#seat-abort-confirm').click();
    await frame.locator('[data-screen="end"]:not([hidden])').waitFor();
    assert.equal(await page.evaluate(() => window.harnessView.game_id),aborted.game_id);
    assert.equal(await page.evaluate(() => window.harnessView.choices[1]),null,'Abort keeps the other choice hidden');
    const html = await frame.locator('html').innerHTML();
    for (const file of ['spirit','shadow-b','mud']) assert(html.includes(`/${file}-`), `Seat names ${file}.webp through art`);
    await legacyStart('solo');
    console.log(`PASS: both hidden seats, swaps, legality, Cards-safe king, Ready lock, same-ID retry, stale resend, remounts, full-read hand-off, solo Black and Abort; seat look checks in ${look}`);
  }
  const pollBoard = await page.evaluate(() => window.harnessWidgetState.privateContent.board_id);
  const changedBoard = await (await page.request.post(new URL('/fixture-tool', base).href, { data: { name: 'kingdown_create', arguments: { kind: 'solo', options, colour: 'black', board_id: pollBoard } } })).json();
  assert(!changedBoard.isError);
  await frame.locator('body').evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await frame.locator('#strip-me .player-name small').filter({ hasText: 'Black' }).waitFor({ timeout: 5000 });
  assert.equal(await page.evaluate(() => window.harnessView.game_id), changedBoard._meta.view.game_id, 'A poll follows the current board and gets the new game rules');
  await openPlay();
  await handleGate();
  assert.equal(await frame.locator('#presets button').count(), 17, 'The name screen has the 17 game pictures');
  assert(await frame.locator('#presets button').evaluateAll(buttons => buttons.every(button => {
    const style = getComputedStyle(button);
    return style.borderRadius === '50%' && style.backgroundImage === 'none' && style.backgroundColor === 'rgba(0, 0, 0, 0)';
  })), 'Name pictures keep their round transparent face');
  assert(await frame.locator('#setup-body').evaluate(body => {
    const button = document.createElement('button');
    button.className = 'preset'; button.textContent = 'King Down'; body.append(button);
    try {
      const style = getComputedStyle(button);
      return style.backgroundImage.includes('stone-control') && style.borderRadius !== '50%' && style.aspectRatio === 'auto';
    } finally { button.remove(); }
  }), 'A preset button outside the name pictures keeps its stone face and control shape');
  assert.equal(await frame.locator('[data-screen="handle"] .quiet-line').last().innerText(), 'Each name is unique.');
  assert.equal(await frame.locator('#page-back').innerText(), '‹ Play');

  async function fits(screen, width) {
    await frame.locator(`[data-screen="${screen}"]:not([hidden])`).waitFor();
    await idleBoard();
    if (screen === 'end') await page.clock.runFor(34);
    // The full read replaces old rows and resets the registry scroll.
    if (screen === 'profile') await frame.locator('#profile-status').waitFor({ state: 'hidden' });
    if (screen === 'play') await frame.locator('#games-status').filter({hasText:'Loading games…'}).waitFor({state:'hidden'});
    const layout = await frame.locator('body').evaluate(el => ({ overflow: el.scrollWidth > innerWidth, width: innerWidth, heading: getComputedStyle(document.querySelector(`[data-screen="${el.dataset.page}"] h2`) ?? el).fontFamily }));
    assert.equal(layout.overflow, false, `${screen} has no horizontal scroll at ${width}px`);
    assert(layout.width <= width);
    const controls = frame.locator(`[data-screen="${screen}"] button:visible, [data-screen="${screen}"] input:visible, #page-head button:visible, #retry:visible, #error:visible`);
    for (const bounds of await controlsInView(controls)) assert(bounds.accessible, `${screen} control scrolls into the safe area at ${width}px: ${JSON.stringify(bounds)}`);
    await frame.locator(`[data-screen="${screen}"] .new-game-body`).evaluateAll(els => els.forEach(el => { el.scrollTop = 0; }));
    if (screen === 'handle') {
      await frame.locator('#handle-free:not([hidden])').waitFor();
      assert(await frame.locator('#handle-free').evaluate(el => { const r = el.getBoundingClientRect(), row = el.parentElement.getBoundingClientRect(); return r.left >= row.left && r.right <= row.right + 1; }), `The server Free mark fits the name row at ${width}px`);
    }
    if (screen === 'handle') assert(await frame.locator('#presets').evaluate(el => {
      const box = el.getBoundingClientRect();
      return [...el.querySelectorAll('button')].every(button => { const rect = button.getBoundingClientRect(); return rect.left >= box.left && rect.right <= box.right + 1; });
    }), `All 17 pictures fit the name screen at ${width}px`);
  }
  for (const [width, height] of [[390,844], [1440,900], [400,900], [360,844]]) {
    await page.setViewportSize({width,height});
    await fits('handle', width); await shot(page, `shell-handle-${width}-${mode}`);
    for (const screen of ['play','profile','settings']) {
      if (screen === 'play') await openPlay(); else await openScreen(screen);
      await fits(screen, width);
      if (screen === 'settings') {
        const settings = await (await page.request.post(new URL('/fixture-tool', base).href, { data: { name: 'kingdown_settings', arguments: {} } })).json();
        assert.equal(await frame.locator('#me-handle').innerText(), settings._meta.me.handle, 'Settings shows the server handle');
        assert(await frame.locator('.sym-demo img').evaluateAll(images => images.length === 2 && images.every(image => image.naturalWidth > 0)), 'Settings shows the painted knight and its own symbol');
        assert.deepEqual(await frame.locator('.set-line').first().evaluate(el => { const css = getComputedStyle(el); return [css.marginTop,css.marginBottom]; }), ['-6px','6px'], 'Settings keeps the sample help spacing');
        assert.equal(await frame.locator('[data-screen="settings"] .quiet-line').last().innerText(), 'Your settings and your record go with you to any device and any chat.');
      }
      await shot(page, `shell-${screen}-${width}-${mode}`);
    }
    await frame.locator('[data-screen="settings"] [data-nav="handle"]').click();
  }
  await page.setViewportSize({width:1000,height:1000});
  await openPlay();
  const savedGame = frame.locator('#games-list button').first();
  await savedGame.waitFor();
  const inbox = await (await page.request.post(new URL('/fixture-tool', base).href, { data: { name: 'kingdown_games', arguments: {} } })).json();
  assert.deepEqual(await frame.locator('#games-list button[data-game-id]').evaluateAll(rows => rows.map(row => row.dataset.gameId)), inbox._meta.games.map(row => row.game_id), 'The shared rows keep the private server order');
  assert.equal(await savedGame.locator('.row-title').innerText(), 'Computer · Club');
  assert.equal(await savedGame.locator('.turn-mark').innerText(), 'Your turn');
  assert.match(await savedGame.locator('.line').innerText(), /^Move 1\b/);
  assert.equal(await savedGame.locator('.feats use[href="#i-fairy"]').count(), 1);
  const savedId = await savedGame.getAttribute('data-game-id');
  await savedGame.click();
  await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
  assert.deepEqual(await page.evaluate(() => { const { name, arguments: args } = window.harnessCalls.findLast(call => call.name === 'kingdown_resume'); return { name, arguments: args }; }), { name: 'kingdown_resume', arguments: { board_id: await page.evaluate(() => window.harnessWidgetState.privateContent.board_id), game_id: savedId } }, 'Your games resumes on the same board through the API contract');
  await openScreen('settings');
  await page.evaluate(() => window.harnessSetContext({theme:'dark',safeAreaInsets:{top:10,right:12,bottom:20,left:12},deviceCapabilities:{touch:true}}));
  await frame.locator('body[data-theme="dark"][data-touch="true"]').waitFor();
  assert.deepEqual(await frame.locator('body').evaluate(el => ({theme:el.dataset.theme,touch:el.dataset.touch,left:getComputedStyle(document.documentElement).getPropertyValue('--safe-left')})), {theme:'dark',touch:'true',left:'12px'});
  for (const [width,height] of [[360,844],[390,844],[400,900],[1440,900]]) { await page.setViewportSize({width,height}); await fits('settings',width); }
  await page.setViewportSize({width:1000,height:1000});
  await page.evaluate(() => window.harnessSetContext({theme:'light',safeAreaInsets:{top:0,right:0,bottom:0,left:0},deviceCapabilities:{touch:true}}));
  await frame.locator('[data-screen="settings"] [data-nav="handle"]').click();
  await frame.locator('#handle').fill(testHandle);
  await frame.locator('#handle-free:not([hidden])').waitFor();
  assert.deepEqual(await page.evaluate(() => window.harnessCalls.findLast(c => c.name === 'kingdown_handle').arguments), { handle: testHandle, check: true }, 'Free comes from the server check without a write');
  await frame.locator('#presets button[aria-label="knight"]').click();
  await frame.locator('#save-handle').click();
  await frame.locator('[data-screen="friend"]:not([hidden])').waitFor();
  assert.deepEqual(await page.evaluate(() => window.harnessHandle), { handle: testHandle, icon: 'knight' });

  await openPlay();
  const newFriendId = await page.evaluate(() => window.harnessView.game_id);
  await frame.locator(`#games-list [data-game-id="${newFriendId}"]`).waitFor();
  assert.equal(await frame.locator(`#games-list [data-game-id="${newFriendId}"] .row-title`).innerText(), 'Waiting for a friend', 'Back shows the new game row');
  await legacyStart('solo');
  await idleBoard();
  await frame.locator('#status').filter({ hasText: 'Your move' }).waitFor();
  // The board leaves its floor clear, as the web game and the approved sample do.
  await boardBox();
  const floorPixel = () => frame.locator('canvas').evaluate(c => [...c.getContext('2d').getImageData(1, 1, 1, 1).data].join(','));
  const floor = await floorPixel();
  assert.equal(floor, '0,0,0,0', 'The plugin board shares the game’s parchment floor');
  // The art is not in the page (ticket 09): each named file loads from the plugin origin and a canvas may read it.
  const art = await frame.locator('html').evaluate(async () => {
    const urls = [...new Set(document.documentElement.innerHTML.match(/https?:\/\/[^"'`\s]+\/plugin-art\/[\w-]+\.webp/g))];
    return Promise.all(urls.map(async src => { const image = Object.assign(new Image(), { crossOrigin: 'anonymous', src }); await image.decode(); const c = document.createElement('canvas'); c.width = c.height = 8; const g = c.getContext('2d'); g.drawImage(image, 0, 0, 8, 8); g.getImageData(0, 0, 8, 8); return { src, width: image.naturalWidth }; }));
  });
  assert(art.length >= 20, 'The page names the board art and menu art');
  assert(art.some(file => file.src.includes('/scroll-')), 'scroll.webp loads from the plugin origin');
  assert(art.some(file => file.src.includes('/badge-stranger-match-')), 'badge-stranger-match.webp loads from the plugin origin');
  assert(art.some(file => file.src.includes('/badge-royal-collection-')), 'badge-royal-collection.webp loads from the plugin origin');
  assert(art.some(file => file.src.includes('/badge-purist-')), 'badge-purist.webp loads from the plugin origin');
  assert(art.some(file => file.src.includes('/badge-giant-slayer-')), 'badge-giant-slayer.webp loads from the plugin origin');
  assert(art.some(file => file.src.includes('/badge-friend-match-')), 'badge-friend-match.webp loads from the plugin origin');
  assert(art.some(file => file.src.includes('/badge-first-win-')), 'badge-first-win.webp loads from the plugin origin');
  assert(art.some(file => file.src.includes('/badge-fairy-tale-')), 'badge-fairy-tale.webp loads from the plugin origin');
  assert(art.some(file => file.src.includes('/badge-crowned-')), 'badge-crowned.webp loads from the plugin origin');
  assert(art.some(file => file.src.includes('/badge-card-sharp-')), 'badge-card-sharp.webp loads from the plugin origin');
  assert(art.some(file => file.src.includes('/badge-architect-')), 'badge-architect.webp loads from the plugin origin'); assert(art.every(file => file.width > 0), 'Every art file decodes');
  // The host page's origin: the widget page has its own origin, as in ChatGPT.
  assert.equal(art.every(file => new URL(file.src).origin === new URL(base).origin), mode === 'fixture', 'The HTTP board loads its art from the plugin origin, not the page origin');
  assert.equal(await page.content().then(html => html.includes('data:image/webp')), false);
  await shot(page, `board-art-${mode}`);
  await openScreen('settings');
  await frame.locator('#symbols-only').check();
  await frame.locator('#symbols-only:not(:disabled)').waitFor();
  assert(await frame.locator('#symbols-only').isChecked());
  assert.equal(await page.evaluate(() => window.harnessWidgetState.modelContent.game_id), undefined);
  assert.deepEqual(await page.evaluate(() => Object.keys(window.harnessWidgetState.privateContent).sort()), ['board_id', 'pending', 'screen', 'sheet']);
  const settingsReads = await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_get').length);
  await remountFrame();
  await page.waitForFunction(n => window.harnessCalls.filter(c => c.name === 'kingdown_get').length > n, settingsReads);
  await frame.locator('[data-screen="settings"]:not([hidden])').waitFor();
  await frame.locator('#symbols-only:not(:disabled)').waitFor();
  assert(await frame.locator('#symbols-only').isChecked(), 'Settings return from the server on each mount');
  await frame.locator('#symbols-only').uncheck();
  await openPlay();
  await handleGate(true);
  await frame.locator('[data-screen="handle"]:not([hidden])').waitFor();
  await frame.locator('#handle').fill(testHandle); await frame.locator('#save-handle').click();
  await frame.locator('#error').filter({ hasText: 'Harness action after Save failed' }).waitFor();
  assert(await frame.locator('#retry').isVisible(), 'A failed send shows Retry with its error words');
  for (const width of [360,400]) { await page.setViewportSize({width,height:844}); await fits('play',width); await shot(page, `shell-failure-${width}-${mode}`); }
  await page.setViewportSize({width:1000,height:1000});
  assert.equal(await page.evaluate(() => window.harnessWidgetState.privateContent.pending?.name), 'kingdown_create', 'Save keeps the action until it succeeds');
  await remountFrame();
  await frame.locator('#retry').waitFor(); await frame.locator('#retry').click();
  await frame.locator('[data-screen="friend"]:not([hidden])').waitFor();
  assert.equal(await page.evaluate(() => window.harnessWidgetState.privateContent.pending), undefined);
  await openPlay(); await legacyStart('solo'); await idleBoard();

  // Ticket 15: the board and end routes.
  assert.equal(await frame.locator('#game-table').count(), 1, 'The board uses the approved game table');

  async function hostPage(width, height, top, bottom) {
    const page = await browser.newPage({ viewport: { width, height }, isMobile: true, hasTouch: true }), frame = page.frameLocator('iframe');
    trapErrors(page);
    await page.goto(base);
    await page.locator('#remount').evaluate(el => { el.style.display = 'none'; });
    await page.locator('iframe').evaluate(el => { el.style.setProperty('height', '100dvh', 'important'); });
    await frame.locator('#home-play:not(:disabled)').waitFor();
    await page.evaluate(() => window.harnessSetContext({ displayMode: 'fullscreen' }));
    const result = await page.evaluate(() => window.harnessTool({ name: 'kingdown_open', arguments: { screen: 'play' } }));
    await page.evaluate(result => window.harnessShow(result), result);
    await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
    await page.evaluate(safeAreaInsets => window.harnessSetContext({ displayMode: 'fullscreen', safeAreaInsets, deviceCapabilities: { touch: true } }), { top, bottom, left: 0, right: 0 });
    return { page, frame };
  }

  // Ticket 13: friend, join, lobby and wait.
  {
    const { mkdir } = await import('node:fs/promises'), { tmpdir } = await import('node:os'), { join } = await import('node:path');
    const sharp = (await import('sharp')).default, look = join(tmpdir(), 'kingdown-look', '13'); await mkdir(look, { recursive: true });
    const tool = async (name, args = {}, friend = false) => (await page.request.post(new URL(friend ? '/fixture-friend-tool' : '/fixture-tool', base).href, { data: { name, arguments: args } })).json();
    const binding = () => page.evaluate(() => window.harnessWidgetState.privateContent.board_id);
    async function showCreated(kind, choices = options) {
      const result = await tool('kingdown_create', { kind, options: choices, colour: 'white', board_id: await binding() }); assert(!result.isError);
      await page.evaluate(result => window.harnessShow({ ...result, structuredContent: { ...result.structuredContent, screen: undefined } }, true), result); return result._meta.view;
    }
    async function lookAt(state, screen) {
      for (const [width, height, suffix] of [[390,844,'phone'],[1440,900,'desktop'],[400,900,'side']]) {
        await page.setViewportSize({ width, height }); await fits(screen, width);
        await frame.locator('html').evaluate(() => document.fonts.ready);
        await frame.locator(`[data-screen="${screen}"] img`).evaluateAll(images => Promise.all(images.map(img => img.decode())));
        for (const button of await frame.locator('#over.found button:visible').all()) assert((await button.evaluate(controlBounds)).accessible, 'Found controls stay above the composer');
        const capture = await page.screenshot(); await sharp(capture).toFile(join(look, `${state}-${suffix}-${mode}.png`));
        if (suffix !== 'side' && state !== 'join') {
          const sample = await sharp(`docs/specs/chatgpt-mvp/sample/png/${state}-${suffix}.png`).resize(width,height).toBuffer();
          await sharp({ create: { width: width*2, height, channels: 3, background: '#ffffff' } }).composite([{ input: sample, left: 0, top: 0 }, { input: capture, left: width, top: 0 }]).png().toFile(join(look, `${state}-${suffix}-${mode}-compare.png`));
        }
      }
      await page.setViewportSize({ width: 390, height: 844 });
    }
    await openPlay(); await lookAt('play', 'play');
    const friend = await showCreated('friend'); await frame.locator('[data-screen="friend"]:not([hidden])').waitFor();
    await frame.locator('#friend-new').click(); await frame.locator('.game-code span').first().waitFor();
    const code = (await frame.locator('.game-code span').allTextContents()).join(''); assert(code.length === 6, 'Create gives six code tiles');
    const fullInvite = `Join King Down game ${code}. Rules: Fairy pieces.`;
    assert.deepEqual(await frame.locator('#friend-actions button').allTextContents(), ['Share', 'Copy']);
    assert(await frame.locator('#friend-share').evaluate(button => button.classList.contains('primary')), 'Share is the main action');
    assert((await frame.locator('#friend-expiry').innerText()).startsWith('Ends '), 'The Ends line stays');
    await lookAt('friend-code', 'friend');
    // Ticket 32 D: use fresh mobile hosts, including the real 200% host geometry.
    for (const [width, height, top, bottom] of [[197, 426, 51, 59], [320, 568, 63, 84], [393, 852, 102, 118], [1280, 800, 0, 0]]) {
      const host = await hostPage(width, height, top, bottom);
      try {
        await host.frame.getByRole('radio', { name: 'A friend', exact: true }).locator('..').click();
        await host.frame.locator('#setup-start').click();
        await host.frame.locator('.game-code span').first().waitFor();
        await host.frame.locator('html').evaluate(() => document.fonts.ready);
        const labels = await host.frame.locator('#friend-actions').evaluate(row => [...row.querySelectorAll('button')].map(button => {
          const label = button.querySelector('.label') ?? button, range = document.createRange();
          range.selectNodeContents(label);
          const box = button.getBoundingClientRect(), text = range.getBoundingClientRect();
          return { id: button.id, scroll: label.scrollWidth, client: label.clientWidth, rightGap: box.right - text.right, left: box.left, top: box.top, right: box.right, bottom: box.bottom, width: box.width, rowWidth: row.getBoundingClientRect().width };
        }));
        const all = `Friend actions at ${width} x ${height}: ${JSON.stringify(labels)}`;
        console.log(all);
        assert.deepEqual(labels.map(label => label.id), ['friend-share', 'friend-copy'], all);
        for (const label of labels) {
          assert(label.scroll <= label.client, `The ${label.id} label fits: ${all}`);
          assert(label.rightGap >= 8, `The ${label.id} text keeps at least 8 px on the right: ${all}`);
        }
        if (width <= 299) assert(labels[1].top >= labels[0].bottom && labels.every(label => Math.abs(label.width - label.rowWidth) < 1), `Share and Copy stack at full width: ${all}`);
        else assert(Math.abs(labels[0].top - labels[1].top) < 1 && labels[0].right <= labels[1].left, `Share and Copy stay side by side: ${all}`);
        await host.frame.locator('#friend-copy').scrollIntoViewIfNeeded();
        await shot(host.page, `friend-actions-${width}-${mode}`);
      } finally { await host.page.close(); }
    }

    await frame.locator('html').evaluate(() => {
      window.inviteShareCalls = 0;
      Object.defineProperty(navigator, 'share', { configurable: true, value: async () => { window.inviteShareCalls++; } });
    });
    // Chromium reads the real clipboard back. WebKit has no clipboard-read permission, so it captures the widget's platform call.
    const webkit = browser.browserType().name() === 'webkit';
    if (!webkit) await page.context().grantPermissions(['clipboard-read','clipboard-write']);
    await frame.locator('html').evaluate((_, webkit) => {
      window.ticket13Clipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard'); window.ticket13Copy = document.execCommand;
      if (webkit) Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.ticket13CopiedText = text; } } });
    }, webkit);
    await frame.locator('#friend-copy').click();
    await frame.locator('#friend-copy-status').filter({ hasText: /^Copied$/ }).waitFor();
    if (webkit) assert.equal(await frame.locator('html').evaluate(() => window.ticket13CopiedText), fullInvite, 'Copy sends the full invite to the clipboard');
    else assert.equal(await page.evaluate(() => navigator.clipboard.readText()), fullInvite, 'The granted clipboard contains the full invite');
    await frame.locator('html').evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Denied'); } } }); document.execCommand = () => false;
    });
    await frame.locator('#friend-copy').click(); await frame.locator('#friend-copy-status').filter({ hasText: 'Select the invite and copy it' }).waitFor();
    assert.equal(await frame.locator('html').evaluate(() => getSelection().toString()), fullInvite, 'The refused clipboard leaves the full invite selected');
    assert.equal(await frame.locator('html').evaluate(() => window.inviteShareCalls), 0, 'A refused Copy does not open the share sheet');
    await frame.locator('html').evaluate(() => { if (window.ticket13Clipboard) Object.defineProperty(navigator, 'clipboard', window.ticket13Clipboard); else delete navigator.clipboard; document.execCommand = window.ticket13Copy; getSelection().removeAllRanges(); });
    await frame.locator('html').evaluate(() => {
      Object.defineProperty(navigator, 'share', { configurable: true, value: async data => { window.sharedInvite = data.text; } });
    });
    await frame.locator('#friend-share').click();
    await frame.locator('#friend-copy-status').filter({ hasText: /^Shared$/ }).waitFor();
    assert.equal(await frame.locator('html').evaluate(() => window.sharedInvite), fullInvite, 'Share sends the same full invite');
    const invites = await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_invite').length);
    await openPlay();
    const inviteRow = frame.locator('.friend-invite-row').filter({ hasText: code });
    await inviteRow.waitFor();
    for (const [width, height] of [[197,426], [320,568], [390,844]]) {
      await page.setViewportSize({ width, height });
      assert(await inviteRow.evaluate(async row => {
        await document.fonts.ready;
        const bounds = row.querySelector('button[data-game-id]').getBoundingClientRect();
        const share = row.querySelector('button[aria-label]').getBoundingClientRect();
        const texts = document.createTreeWalker(row.querySelector('button[data-game-id]'), NodeFilter.SHOW_TEXT);
        while (texts.nextNode()) {
          if (!texts.currentNode.textContent.trim()) continue;
          const range = document.createRange(); range.selectNodeContents(texts.currentNode);
          for (const box of range.getClientRects()) {
            if (box.left < bounds.left - 1 || box.right > bounds.right + 1 || box.top < bounds.top - 1 || box.bottom > bounds.bottom + 1) return false;
            if (box.left < share.right && box.right > share.left && box.top < share.bottom && box.bottom > share.top) return false;
          }
        }
        return row.scrollWidth <= row.clientWidth + 1;
      }), `The friend row text fits and stays clear of Share at ${width} px`);
      await inviteRow.screenshot({ path: join(look, `friend-row-${width}-${mode}.png`) });
    }
    const resumes = await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_resume').length);
    await inviteRow.getByRole('button', { name: `Share game ${code}`, exact: true }).click();
    await inviteRow.getByRole('status').filter({ hasText: /^Shared$/ }).waitFor();
    assert.equal(await frame.locator('html').evaluate(() => window.sharedInvite), fullInvite, 'Your games shares the code and rule names');
    assert.equal(await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_resume').length), resumes, 'Share does not open the game');
    assert.equal(await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_invite').length), invites, 'Share keeps the same code');
    await inviteRow.locator('button[data-game-id]').click();
    await frame.locator('[data-screen="friend"]:not([hidden])').waitFor();
    await remount('friend'); await frame.locator('#friend-new').waitFor();
    assert.equal(await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_invite').length), invites, 'Remount makes no new code');
    assert.equal(await frame.locator('.game-code span').count(), 0, 'The saved game shows Make a new code');
    assert(!(await tool('kingdown_join', { code }, true)).isError, 'The buddy joins the page code');
    await frame.locator('body').evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    assert.equal((await tool('kingdown_get', { game_id: friend.game_id }, true))._meta.view.status, 'playing');
    // Part 18-a: each choice sends only its own field and persists on remount.
    await openScreen('settings');
    for (const value of ['everyone', 'nobody', 'mutual']) {
      const choice = frame.locator(`#online-visibility input[value="${value}"]`);
      await choice.locator('..').click();
      await frame.locator(`#online-visibility input[value="${value}"]:not(:disabled)`).waitFor({ state: 'attached' });
      assert(await choice.isChecked());
      assert.deepEqual(await page.evaluate(()=>window.harnessCalls.filter(c=>c.name==='kingdown_settings').at(-1).arguments), {online_visible_to:value});
      assert((await choice.locator('..').boundingBox()).height >= 44, 'Online choices have 44 px targets');
      const reads = await page.evaluate(()=>window.harnessCalls.filter(c=>c.name==='kingdown_settings').length);
      await page.locator('#remount').click();
      await page.waitForFunction(n=>window.harnessCalls.filter(c=>c.name==='kingdown_settings').length>n, reads);
      await openScreen('settings');
      assert(await frame.locator(`#online-visibility input[value="${value}"]`).isChecked(), 'Online choice persists');
    }
    const mutual = frame.locator('#online-visibility input[value="mutual"]');
    await mutual.focus();
    await mutual.press('ArrowRight');
    const nobody = frame.locator('#online-visibility input[value="nobody"]');
    await nobody.locator('xpath=self::*[not(@disabled)]').waitFor({state:'attached'});
    assert(await nobody.isChecked());
    assert(await nobody.evaluate(input=>document.activeElement===input), 'Online save keeps keyboard focus');
    await nobody.press('ArrowLeft');
    await mutual.locator('xpath=self::*[not(@disabled)]').waitFor({state:'attached'});
    assert(await mutual.isChecked(), 'The next arrow key changes the saved value');
    assert(await mutual.evaluate(input=>document.activeElement===input));
    await page.evaluate(()=>{window.holdNext='kingdown_settings';});
    await mutual.press('ArrowRight');
    await page.waitForFunction(()=>typeof window.releaseHeld==='function');
    await frame.locator('#page-back').focus();
    await page.evaluate(()=>window.releaseHeld());
    await nobody.locator('xpath=self::*[not(@disabled)]').waitFor({state:'attached'});
    assert(await frame.locator('#page-back').evaluate(button=>document.activeElement===button), 'A save does not take focus from another control');
    assert(await frame.locator('#online-visibility').evaluate(control => control.nextElementSibling.getBoundingClientRect().top >= control.getBoundingClientRect().bottom), 'The online help text does not overlap the choices');
    await shot(page, `online-visibility-${mode}`);
    await openPlay();
    await frame.locator(`#games-list [data-game-id="${friend.game_id}"]`).click();
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor(); await idleBoard();
    // Part 18-b: a failed status read keeps the other Menu controls and can retry.
    let failBlockRead = true;
    const blockRoute = async route => {
      const request = route.request().postDataJSON();
      if (failBlockRead && request.name === 'kingdown_block') {
        failBlockRead = false;
        return route.fulfill({ json: { isError: true, content: [{ type: 'text', text: 'Cannot read block setting.' }] } });
      }
      return route.continue();
    };
    await page.route('**/fixture-tool', blockRoute);
    await frame.locator('#board-menu').click();
    await frame.locator('#menu-block-player').filter({ hasText: 'Cannot read block setting. Retry' }).waitFor();
    assert(await frame.locator('#board-sheet').getByRole('button', { name: 'Settings', exact: true }).isEnabled());
    await frame.locator('#menu-block-player').click();
    await frame.locator('#menu-block-player').filter({ hasText: 'Block player' }).waitFor();
    await page.unroute('**/fixture-tool', blockRoute);
    // Cancel writes nothing. Block and Unblock survive a remount.
    await frame.locator('#menu-block-player').filter({ hasText: 'Block player' }).click();
    await frame.locator('#board-sheet-title').filter({ hasText: 'Block player?' }).waitFor();
    await shot(page, `block-confirm-${mode}`);
    await frame.locator('#board-sheet').getByRole('button', { name: 'Keep playing', exact: true }).click();
    assert.equal((await tool('kingdown_block', { game_id: friend.game_id }))._meta.blocked, false, 'Cancel keeps contact');
    await frame.locator('#board-menu').click(); await frame.locator('#menu-block-player').click();
    await frame.locator('#board-sheet').getByRole('button', { name: 'Block player', exact: true }).click();
    await frame.locator('#board-menu:not(:disabled)').waitFor();
    await frame.locator('#context-note').filter({hasText:'Player blocked. Your current game continues.'}).waitFor();
    assert.equal(await frame.locator('#context-text').getAttribute('aria-live'),'polite');
    assert.equal((await tool('kingdown_block', { game_id: friend.game_id }))._meta.blocked, true);
    assert.equal((await tool('kingdown_get', { game_id: friend.game_id }))._meta.view.status, 'playing', 'Block keeps the game');
    await remount('board');
    await frame.locator('#board-menu').click();
    await frame.locator('#menu-block-player').filter({ hasText: 'Unblock player' }).waitFor();
    await shot(page, `block-undo-${mode}`);
    await frame.locator('#menu-block-player').click();
    await frame.locator('#board-sheet').getByRole('button', { name: 'Unblock player', exact: true }).click();
    await frame.locator('#board-menu:not(:disabled)').waitFor();
    assert.equal((await tool('kingdown_block', { game_id: friend.game_id }))._meta.blocked, false);
    await frame.locator('#context-note').filter({hasText:'Player unblocked. Follows stay off.'}).waitFor();
    // The end card can block a person, and Profile keeps the undo path.
    const resigned = await tool('kingdown_resign', { game_id: friend.game_id });
    await page.evaluate(result=>window.harnessShow(result),resigned);
    await frame.locator('#over.end-card[open]').waitFor(); await idleBoard();
    await frame.locator('#over #end-block-player').filter({hasText:'Block player'}).click();
    await frame.locator('#board-sheet-title').filter({hasText:'Block player?'}).waitFor();
    assert.match(await frame.locator('#board-sheet').innerText(),/You can unblock them in Profile/);
    await frame.locator('#board-sheet').getByRole('button',{name:'Block player',exact:true}).click();
    await frame.locator('#end-block-status').filter({hasText:'Player blocked.'}).waitFor();
    assert.equal(await frame.locator('#end-block-status').innerText(),'Player blocked.');
    await frame.locator('#over #end-block-player').filter({hasText:'Unblock player'}).waitFor();
    assert.equal(await frame.locator('#over').getByRole('button',{name:'Rematch',exact:true}).count(),0);
    const blockReads = await page.evaluate(()=>window.harnessCalls.filter(c=>c.name==='kingdown_block').length);
    await page.clock.fastForward(3100);
    await frame.locator('#over #end-block-player').filter({hasText:'Unblock player'}).waitFor();
    assert.equal(await page.evaluate(()=>window.harnessCalls.filter(c=>c.name==='kingdown_block').length),blockReads,'An end poll reuses the saved Block control');
    await shot(page, `end-block-${mode}`);
    await openScreen('profile');
    if (mode === 'fixture') {
      const profile = await tool('kingdown_profile'), cursor = randomUUID();
      const blockPages = async route => {
        const request = route.request().postDataJSON();
        if (request.name !== 'kingdown_profile') return route.continue();
        const more = request.arguments.blocks_after === cursor;
        return route.fulfill({json:{...profile,_meta:{...profile._meta,
          blocks:more?profile._meta.blocks:Array.from({length:50},(_,n)=>({user_id:randomUUID(),handle:`blocked-${n}`})),
          next_blocks_after:more?null:cursor}}});
      };
      await page.route('**/fixture-tool',blockPages);
      await openPlay(); await openScreen('profile');
      await frame.locator('#profile-blocks-more').click();
      await page.waitForFunction(cursor=>window.harnessCalls.some(c=>c.name==='kingdown_profile'&&c.arguments.blocks_after===cursor),cursor);
      await frame.locator('#profile-blocks-more').waitFor({state:'hidden'});
      assert.equal(await frame.locator('#profile-blocks button').count(),51,'More appends the last page of blocks');
      await page.unroute('**/fixture-tool',blockPages);
    }
    await frame.locator('#profile-blocks button').last().click();
    await frame.locator('#board-sheet').getByRole('button', { name: 'Cancel', exact: true }).click();
    assert.equal((await tool('kingdown_profile'))._meta.blocks.length, 1, 'Cancel keeps the block');
    await frame.locator('#profile-blocks button').last().click();
    await frame.locator('#board-sheet').getByRole('button', { name: 'Unblock player', exact: true }).click();
    await frame.locator('#profile-blocks-empty:not([hidden])').waitFor();
    assert.equal((await tool('kingdown_profile'))._meta.blocks.length, 0, 'Profile can unblock after a finished game');



    async function buddyCode(choices = options) {
      const game = await tool('kingdown_create', { kind: 'friend', options: choices, colour: 'white' }, true); assert(!game.isError);
      const invite = await tool('kingdown_invite', { game_id: game._meta.view.game_id }, true); assert(!invite.isError);
      assert(Math.abs(Date.parse(invite.structuredContent.expires_at) - Date.now() - 7*86400000) < 60000, 'Friend codes end after seven days');
      return { game: game._meta.view, code: invite.structuredContent.code };
    }
    const offered = await buddyCode(); await openPlay();
    const lower = offered.code.toLowerCase(); await frame.getByRole('radio', { name: 'A friend', exact: true }).locator('..').click(); await frame.locator('#token').fill(`${lower.slice(0,3)}-${lower.slice(3)}`); await frame.locator('#join').click();
    await frame.locator('#join-confirm').waitFor();
    assert.equal(await frame.locator('#join-confirm').innerText(), 'Join and take Black');
    await lookAt('join', 'join');
    // The mount ends with joinScreen(), which writes the saved code into the field. Type after it: an enabled Preview
    // button shows that the mount has ended (the real server of plugin-ui-http reads slower than the fixture).
    await remount('join'); await frame.locator('#join-entry button:not(:disabled)').waitFor();
    await frame.locator('#join-code').fill(lower); await frame.locator('#join-entry button').click(); await frame.locator('#join-confirm').waitFor();
    const joins = await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_join' && !c.arguments.preview).length);
    await frame.locator('#join-decline').click();
    assert.equal(await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_join' && !c.arguments.preview).length), joins, 'Decline sends no Join');
    assert.equal((await tool('kingdown_get', { game_id: offered.game.game_id }, true))._meta.view.status, 'waiting', 'Decline keeps the buddy game waiting');
    await frame.getByRole('radio', { name: 'A friend', exact: true }).locator('..').click(); await frame.locator('#token').fill(lower); await frame.locator('#join').click(); await frame.locator('#join-confirm').waitFor(); await frame.locator('#join-confirm').click();
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    assert(!(await page.evaluate(code => JSON.stringify(window.harnessWidgetState).includes(code), offered.code)), 'The code stays out of widget state');
    const seatCode = await buddyCode({ ...options, arrangement: true });
    const opened = await tool('kingdown_open', { code: seatCode.code }); assert(!opened.isError);
    await page.evaluate(result => window.harnessShow(result, true), opened); await frame.locator('#join-confirm').waitFor();
    await frame.locator('#join-confirm').click(); await frame.locator('[data-screen="seat"]:not([hidden])').waitFor();
    assert.equal((await tool('kingdown_get', { game_id: seatCode.game.game_id }, true))._meta.view.status, 'setup', 'Arrangement routes the joiner to the seat screen');

    const longName = `wwwwwwwwwwwwwwww${randomUUID().slice(0,4)}`;
    assert(!(await tool('kingdown_handle', { handle: longName, icon: 'paladin' }, true)).isError);
    const random = await tool('kingdown_create', { kind: 'random', options, colour: 'white' }, true); assert(!random.isError);
    await openPlay(); await frame.getByRole('radio', { name: 'A random player', exact: true }).locator('..').click(); await frame.locator('#play-open').click(); await frame.locator('#lobby-list .game-row').filter({ hasText: longName }).waitFor();
    const lobbyRow = frame.locator('#lobby-list .game-row').filter({ hasText: longName });
    assert.equal(await lobbyRow.locator('.row-title').innerText(), longName);
    assert(await lobbyRow.locator('.row-title').evaluate(el => { const r = el.getBoundingClientRect(), hit = document.elementFromPoint(r.x+r.width/2, r.y+r.height/2); return el.contains(hit) || hit?.closest('button')?.classList.contains('menu-row'); }), 'The name stays visible beside Accept');
    assert.equal(await lobbyRow.locator('.feats [title="Fairy pieces"]').count(), 1);
    await lookAt('lobby', 'lobby');
    assert(await lobbyRow.locator('.row-title').evaluate(el => getComputedStyle(el).textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth), 'The long handle has an ellipsis on the phone');
    await remount('lobby'); await frame.locator('#lobby-list .game-row').filter({ hasText: longName }).waitFor();
    await lobbyRow.click(); await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    assert.equal((await tool('kingdown_get', { game_id: random._meta.view.game_id }, true))._meta.view.status, 'playing', 'Accept starts both seats');
    await openScreen('settings'); await frame.locator('[data-nav="handle"]').click(); await lookAt('handle', 'handle'); await openPlay();
    const setup = await tool('kingdown_settings', { last_setup: { kind: 'random', options, colour: 'white', level: 'club', king: null } }); assert(!setup.isError);
    // Only Open mounts the app. It carries the board ID and the new saved settings.
    const play = await tool('kingdown_open', { screen: 'play' }); assert(!play.isError);
    await page.evaluate(result => window.harnessShow(result, true), play);
    await frame.getByRole('radio', { name: 'A random player', exact: true }).locator('..').click(); await frame.locator('#play-open').click(); await frame.locator('#lobby-status').filter({ hasText: /^$/ }).waitFor({ state: 'attached' });
    await frame.locator('#find-opponent').click(); await frame.locator('[data-screen="wait"]:not([hidden])').waitFor();
    await remount('wait'); await frame.locator('#wait-cancel').click(); await frame.locator('[data-screen="lobby"]:not([hidden])').waitFor();
    await frame.locator('#lobby-status').filter({ hasText: /^$/ }).waitFor({ state: 'attached' });
    // Pause the page clock one second from its own now. A slow runner can pass the pause point between the read and
    // the call, so read the time again and retry: pauseAt never receives a time in the past.
    for (let tries = 0; ; tries++) {
      const now = await page.evaluate(() => Date.now());
      try { await page.clock.pauseAt(new Date(now + 1000)); break; }
      catch (error) { if (tries >= 100) throw error; await new Promise(resolve => setTimeout(resolve, 5)); }
    }
    // The frame tells the host page of each reply it has handled; the host page counts the kingdown_get replies for the waiting game.
    await page.evaluate(() => { const push = window.harnessCalls.push; window.harnessCalls.push = function(call) { call.at = Date.now(); return push.call(this, call); }; window.ticket13Reads = []; window.ticket13Ids = new Set(); addEventListener('message', event => {
      if (event.data?.method === 'tools/call' && event.data.params?.name === 'kingdown_get') window.ticket13Ids.add(event.data.id);
      if (event.data?.ticket13Reply !== undefined && window.ticket13Ids.delete(event.data.ticket13Reply) && event.data.game === window.ticket13WaitingId) { window.ticket13Reads.push(Date.now()); dispatchEvent(new Event('ticket13-read')); }
    }); });
    await frame.locator('html').evaluate(() => addEventListener('message', event => {
      if (event.source === parent && event.data?.result) parent.postMessage({ ticket13Reply: event.data.id, game: event.data.result._meta?.view?.game_id }, '*');
    }));
    const receipt = n => page.evaluate(n => new Promise(resolve => {
      if (window.ticket13Reads.length > n) resolve(); else addEventListener('ticket13-read', resolve, { once: true });
    }), n);
    // The clock stays paused in this block, so each step lands exactly on the poll timer: fastForward fires the
    // timers that are due, and it does not paint every frame of the skipped time as runFor does.
    async function advance(ms) {
      const n = await page.evaluate(() => window.ticket13Reads.length), read = receipt(n); let limit;
      await page.clock.fastForward(ms);
      try { await Promise.race([read, new Promise((_, reject) => { limit = setTimeout(() => reject(new Error('The game read does not finish')), 10000); })]); }
      finally { clearTimeout(limit); }
    }
    await frame.locator('#find-opponent').click(); await frame.locator('[data-screen="wait"]:not([hidden])').waitFor();
    const waiting = await page.evaluate(() => { window.ticket13WaitingId = window.harnessView.game_id; return window.harnessView; });
    assert.equal(waiting.options.arrangement, false, 'Find uses the last setup choices');
    assert(!(await frame.locator('#wait-computer').isVisible()), 'The computer offer waits for 25 seconds');
    for (let i=0;i<5;i++) await advance(5000);
    await frame.locator('#wait-computer').waitFor(); await lookAt('lobby-wait', 'wait');
    const count = await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_find').length);
    await openPlay(); await frame.getByRole('radio', { name: 'A random player', exact: true }).locator('..').click(); await frame.locator('#play-open').click(); await frame.locator('#find-opponent').click(); await frame.locator('[data-screen="wait"]:not([hidden])').waitFor();
    assert.equal(await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_find').length), count, 'The page reuses its open game');
    const first = await page.evaluate(() => window.ticket13Reads.length), initialRead = receipt(first);
    await frame.locator('#wait-computer').click(); await frame.locator('[data-screen="board"]:not([hidden])').waitFor(); await initialRead;
    const solo = await page.evaluate(() => window.harnessView);
    const watchCall = await page.evaluate(id => window.harnessCalls.findLast(c => c.name === 'kingdown_get' && c.arguments.game_id === id), waiting.game_id);
    assert(watchCall && !('board_id' in watchCall.arguments), 'The background watch sends no board ID');
    for (let i=5;i<24;i++) await advance(5000);
    const gets = await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_get' && c.arguments.game_id === window.harnessView.game_id).length);
    // This counts the watch calls, not the replies: the host records a call when the poll sends it, during the step,
    // but a reply comes back after fastForward returns.
    const watchGets = () => page.evaluate(id => window.harnessCalls.filter(c => c.name === 'kingdown_get' && c.arguments.game_id === id).length, waiting.game_id);
    const getsAtTwo = await watchGets();
    await page.clock.fastForward(14999); assert.equal(await watchGets(), getsAtTwo, 'No five-second poll remains after two minutes');
    await advance(1);
    const times = await page.evaluate(id => window.harnessCalls.filter(c => c.name === 'kingdown_get' && c.arguments.game_id === id).map(c => c.at), waiting.game_id);
    assert.equal(times.at(-1)-times.at(-2), 15000, 'The later wait uses a fifteen-second gap');
    assert.equal(await page.evaluate(id => window.harnessCalls.filter(c => c.name === 'kingdown_get' && c.arguments.game_id === id).length, solo.game_id), gets, 'The watch reads the open game only');
    await frame.locator('html').evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
    const hiddenGets = await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_get').length);
    await page.clock.fastForward(30000); assert.equal(await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_get').length), hiddenGets, 'A hidden page reads no game');
    const visibleRead = receipt(await page.evaluate(() => window.ticket13Reads.length));
    await frame.locator('html').evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange')); }); await visibleRead;
    assert(!(await tool('kingdown_accept', { game_id: waiting.game_id }, true)).isError);
    await advance(15000); await frame.locator('#over.found[open]').waitFor();
    await page.clock.resume(); await boardBox(); await lookAt('opponent-found', 'board');
    await frame.locator('#found-switch').click(); await frame.locator('#over.found[open]').waitFor({ state: 'hidden' });
    assert.equal(await page.evaluate(() => window.harnessView.game_id), waiting.game_id, 'Switch selects the human game');
    const ended = await tool('kingdown_get', { game_id: solo.game_id }); assert(!ended.isError && ended._meta.view.status === 'aborted' && !ended._meta.view.outcome, 'Switch ends the computer game with no result');
    // remount() waits for the mount's board read to start; harnessView changes at its reply. An enabled Menu shows that
    // the mount has ended (the real server of plugin-ui-http replies later than the fixture).
    await remount('board'); await frame.locator('#board-menu:not(:disabled)').waitFor();
    assert.equal(await page.evaluate(() => window.harnessView?.game_id), waiting.game_id, 'The human board survives remount');
    console.log(`Ticket 13 look comparisons: ${look}`);
    await openPlay(); await legacyStart('solo');
  }

  const pixels = () => frame.locator('canvas').evaluate(c => {
    const data = c.getContext('2d').getImageData(0,0,c.width,c.height).data; let hash=0, red=0;
    for (let i=0;i<data.length;i+=4) { hash=(hash+data[i]*3+data[i+1]*5+data[i+2]*7+data[i+3]*11)>>>0; if(data[i]>150&&data[i+1]<110&&data[i+2]<110&&data[i+3]>0) red++; }
    return {hash,red};
  });
  async function seedBoard(scenario) {
    const seeded = await (await page.request.post(new URL(`/fixture-position?case=${scenario}`,base).href)).json(); assert(!seeded.isError);
    delete seeded._meta.settings;
    const reads=await page.evaluate(()=>window.harnessCalls.filter(c=>c.name==='kingdown_get').length);
    await page.evaluate(result=>window.harnessShow(result),seeded);
    await page.waitForFunction(n=>window.harnessCalls.filter(c=>c.name==='kingdown_get').length>n,reads);
    await idleBoard(); await boardBox(); return seeded;
  }
  async function boardSetting(id, checked) {
    await frame.locator('#'+id).setChecked(checked);
    await widget().waitForFunction(({id,checked})=>{const input=document.getElementById(id); return !input.disabled && input.checked===checked;},{id,checked});
  }
  for (const scenario of ['threats','threats-black']) {
    const seeded = await seedBoard(scenario), plain = await pixels();
    await openScreen('settings'); await boardSetting('show-threats',true);
    await page.evaluate(result=>window.harnessShow(result),seeded); await idleBoard(); await boardBox();
    const threatReads = await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_get').length);
    await remountFrame();
    await page.waitForFunction(n => window.harnessCalls.filter(c => c.name === 'kingdown_get').length > n, threatReads);
    await idleBoard(); await boardBox();
    assert(await frame.locator('#show-threats').isChecked(), 'Show threats returns from the server after mount');
    await frame.locator('canvas').evaluate(() => { window.harnessArrowLines = []; });
    const arrowBox = await boardBox(); await page.mouse.move(arrowBox.x+arrowBox.width/2, arrowBox.y+arrowBox.height/2);
    await frame.locator('canvas').evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    await widget().waitForFunction(() => window.harnessArrowLines.length > 0);
    const arrows = await frame.locator('canvas').evaluate((c, black) => {
      const square = ([x,y]) => { const col = Math.floor((x-32)/112), row = Math.floor((y-32)/112); return black ? 7-col+8*row : col+8*(7-row); };
      return [...new Set(window.harnessArrowLines.map(path => path.map(square).join(':')))].sort();
    }, seeded._meta.view.seat === 1);
    setRules(seeded._meta.view.rules); const expectedArrows = threatsIn({ ...fromFen(seeded._meta.view.fen), turn: seeded._meta.view.seat }).map(t => `${t.from}:${t.to}`).sort();
    assert.deepEqual(arrows, expectedArrows, `${scenario}: every arrow starts and ends on the threatsIn squares`);
    const threats = await pixels(); assert(threats.red > plain.red + 10, `${scenario}: Show threats draws enemy arrows to your pieces`);
    await openScreen('settings'); await boardSetting('symbols-only',true);
    await page.evaluate(result=>window.harnessShow(result),seeded); await idleBoard(); await boardBox();
    await frame.locator('canvas').evaluate((c, minimum) => new Promise((resolve,reject) => {
      const end=performance.now()+5000;
      const tick=()=>{ const data=c.getContext('2d').getImageData(0,0,c.width,c.height).data; let red=0; for(let i=0;i<data.length;i+=4) if(data[i]>150&&data[i+1]<110&&data[i+2]<110&&data[i+3]>0) red++; if(red>minimum) resolve(); else if(performance.now()>end) reject(new Error('The symbols threats did not paint')); else requestAnimationFrame(tick); }; tick();
    }),plain.red+10);
    let flat = await pixels(); for(let i=0;i<20&&flat.hash===threats.hash;i++) { await frame.locator('canvas').evaluate(()=>new Promise(r=>requestAnimationFrame(r))); flat=await pixels(); }
    assert.notEqual(flat.hash, threats.hash, 'Symbols only replaces the painted figures'); assert(flat.red > plain.red + 10, 'Threat arrows stay on the symbols board');
    const disc = await frame.locator('canvas').evaluate((c,black) => {
      const file=black?3:4, row=6, k=c.width/960;
      return [...c.getContext('2d').getImageData(Math.round((32+(file+.5)*112+.17*112)*k),Math.round((96+(row+.5)*112-.17*112)*k),1,1).data].slice(0,3);
    }, scenario==='threats-black');
    const expected = scenario==='threats-black' ? [74,72,80] : [255,252,244];
    assert(disc.every((channel,i)=>Math.abs(channel-expected[i])<8), `The ${scenario==='threats-black'?'black':'white'} pawn shows its rulebook symbol and army colour (${disc})`);

    for (const [width,height] of [[360,844],[390,844],[400,900],[1440,900]]) {
      await page.setViewportSize({width,height}); await boardBox(); await fits('board',width); await shot(page, `shell-symbols-${scenario}-${width}-${mode}`);
      const bounds=await frame.locator('.board-actions').evaluate(el=>({bottom:el.getBoundingClientRect().bottom,height:innerHeight})); assert(bounds.bottom <= bounds.height-(width >= 900 ? 128 : 96), 'Board controls stay above the composer');
    }
    await openScreen('settings'); await boardSetting('symbols-only',false); await boardSetting('show-threats',false);
  }
  await page.setViewportSize({width:1000,height:1000});
  await openPlay(); await legacyStart('solo'); await idleBoard(); await boardBox();
  async function clickSquare(file, rank) {
    const box = await boardBox(); assert(box);
    await page.mouse.click(box.x + (32 + (file + .5) * 112) * box.width / 960, box.y + (64 + 32 + (7 - rank + .5) * 112) * box.width / 960);
  }
  await page.clock.install();
  const computerBefore = await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_computer').length);
  await page.evaluate(() => { window.holdNext = 'kingdown_computer'; });
  await clickSquare(4,1); await clickSquare(4,3); await sendTurn();
  await page.waitForFunction(() => typeof window.releaseHeld === 'function', undefined, {timeout:5000});
  await page.clock.fastForward(1100);
  await frame.locator('#strip-them .player-name small').filter({hasText:'thinking…'}).waitFor();
  assert.equal(await frame.getByRole('button', {name:'Computer move', exact:true}).count(), 0, 'The computer needs no move button');
  await page.evaluate(() => window.releaseHeld());
  await frame.locator('#status').filter({hasText:'Your move'}).waitFor(); await idleBoard();
  assert.equal(await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_computer').length), computerBefore + 1, 'One normal computer turn sends one command');
  async function sendTurn() { await idleBoard(); await frame.locator('#end-turn[aria-disabled="false"]').click(); }
  async function haste() { const result = await (await page.request.post(new URL('/fixture-position?case=haste',base).href)).json(); assert(!result.isError); await page.evaluate(result=>window.harnessShow(result),result); await frame.locator('#status').filter({hasText:'Your move'}).waitFor(); await idleBoard(); }
  await seedBoard('swap');
  await frame.locator('canvas').evaluate(() => { window.harnessSwapMarks = 0; });
  await clickSquare(3, 3);
  await widget().waitForFunction(() => window.harnessSwapMarks > 0);
  assert(await frame.locator('#choices button').count() > 0, 'The Maester fixture offers a swap and PaintedView draws its violet mark');
  assert.equal(await frame.locator('#status').innerText(), 'White Maester.', 'T5: the selected piece uses its shared display name');
  const swapViewport = page.viewportSize();
  for (const [width,height] of [[320,568],[393,852]]) {
    await page.setViewportSize({width,height});
    await frame.locator('#piece-info-art').evaluate(image => image.decode());
    const info = frame.getByRole('button', {name:'All rules',exact:true});
    const layout = await frame.locator('#context-line').evaluate(async row => {
      await document.fonts.ready;
      const button = row.querySelector('#all-rules'), image = button.querySelector('img'), text = row.querySelector('#context-text');
      const r = row.getBoundingClientRect(), b = button.getBoundingClientRect(), t = text.getBoundingClientRect();
      return {first:row.firstElementChild === button, loaded:image.naturalWidth > 0, portrait:image.src.includes('/maester-w-'),
        size:b.width >= 44 && b.height >= 44, inside:b.left >= r.left && b.top >= r.top && b.right <= r.right && b.bottom <= r.bottom,
        wordsAfter:t.left >= b.right, lines:text.scrollHeight / parseFloat(getComputedStyle(text).lineHeight), clipped:text.scrollHeight > text.clientHeight + 1};
    });
    assert(layout.first && layout.loaded && layout.portrait && layout.size && layout.inside && layout.wordsAfter, `T4 at ${width}: the named piece portrait starts and fits the context row: ${JSON.stringify(layout)}`);
    assert(layout.lines <= 2 && !layout.clipped, `T4 at ${width}: the swap words keep at most the sample's two lines: ${JSON.stringify(layout)}`);
    await info.click();
    await frame.locator('#board-sheet[open]').waitFor();
    assert((await frame.locator('#board-sheet').innerText()).includes('Swaps places with a friendly piece.'), 'T4: the portrait opens the selected piece rules');
    // Close keeps the swap selected; Escape clears the selected piece.
    await frame.locator('#board-sheet').getByRole('button', {name:'Close',exact:true}).click();
    assert(await info.evaluate(el => el === document.activeElement), 'T4: closing the rules returns focus to the portrait');
    await shot(page, `swap-portrait-${width}-${mode}`);
  }
  await page.setViewportSize(swapViewport);
  await shot(page, `shell-swap-${mode}`);
  await zoomBoardFits('board-swap-preview');
  await haste();
  await clickSquare(4, 1);
  assert(await frame.locator('#choices button').count() > 0);
  assert(await frame.locator('#choices button').count() > 1, 'Haste and ordinary moves must stay distinct');
  for (const code of ['STALE_REVISION', 'INVALID_MOVE', 'WRONG_TURN', 'COMMAND_CONFLICT', 'MATCH_INCOMPATIBLE']) {
    if (!await frame.locator('#choices button[title="e2-e4"]').count()) await clickSquare(4,1);
    await page.evaluate(code => { window.rejectNextMove = code; }, code);
    await openMoveChoices(); await frame.locator('#choices button[title="e2-e4"]').click(); await sendTurn();
    await idleBoard();
    assert.equal(await frame.locator('#retry').isVisible(), false, `${code} must release the pending command`);
    await frame.locator('#error').filter({hasText:'Harness definitive rejection'}).waitFor();
    // W7 ticket 04: only INVALID_MOVE drops the draft. The re-read keeps it for the other codes, and Undo takes it back.
    // STALE_REVISION and WRONG_TURN also show the T6 line.
    if (['STALE_REVISION', 'WRONG_TURN'].includes(code)) assert.equal(await frame.locator('#status').innerText(), 'The game changed. Check it, then tap End turn.', `${code} keeps the draft with the T6 line`);
    else assert.equal(await frame.locator('#status').innerText(), '', 'The error appears once in the error row');
    if (code !== 'INVALID_MOVE') await frame.locator('#undo').click();
    assert.equal(await frame.locator('#last-move').innerText(), 'Move 1.', `${code} restores the last server position and move line`);
  }
  await haste();
  const race = await page.evaluate(() => window.harnessView);
  const winner = await (await page.request.post(new URL('/fixture-tool',base).href,{data:{name:'kingdown_move',arguments:{game_id:race.game_id,command_id:randomUUID(),expected_revision:race.revision,lan:'d2-d4'}}})).json();
  assert(!winner.isError,'Another tab wins the move race');
  await page.evaluate(() => { window.dropNextReply='kingdown_move'; window.holdNext='kingdown_computer'; });
  await clickSquare(4,1); await openMoveChoices(); await frame.locator('#choices button[title="e2-e4"]').click(); await sendTurn();
  await frame.locator('#retry').waitFor();
  assert.match(await frame.locator('#last-move').innerText(),/White pawn e2 to e4/,'The lost refusal keeps the move until Retry');
  const raceReads = await page.evaluate(() => window.harnessCalls.filter(c=>c.name==='kingdown_get').length);
  await frame.locator('#retry').click(); await page.waitForFunction(()=>typeof window.releaseHeld==='function');
  assert.doesNotMatch(await frame.locator('#last-move').innerText(),/e2 to e4/,'A final Retry refusal removes the refused move');
  // Retry sends the move with no read first (design 5.3); the refusal's rollback reads the board in full.
  assert(await page.evaluate(n=>window.harnessCalls.filter(c=>c.name==='kingdown_get').length>=n+1,raceReads),'Retry reads in full after the refusal');
  await page.waitForFunction(()=>typeof window.releaseHeld==='function'); await page.evaluate(()=>window.releaseHeld()); await idleBoard();
  await haste(); await clickSquare(4,1);
  if (!await frame.locator('#choices button[title="e2-e4"]').count()) await clickSquare(4,1);
  await page.evaluate(() => { window.holdNext = 'kingdown_move'; window.dropNextMoveReply = true; });
  await openMoveChoices(); await frame.locator('#choices button[title="e2-e4"]').click(); await sendTurn();
  await page.waitForFunction(() => typeof window.releaseHeld === 'function');
  assert(await frame.locator('#reload').isDisabled(), 'The generic hold hook keeps Move pending');
  assert.match(await frame.locator('#last-move').innerText(), /White pawn e2 to e4/, 'The move shows before the held reply');
  assert.equal(await frame.locator('#retry').isVisible(), false);
  await page.evaluate(() => window.releaseHeld());
  await frame.locator('#retry').waitFor();
  await remountFrame();
  await frame.locator('#retry').waitFor();
  await page.waitForFunction(()=>window.harnessView.revision===1);
  assert.equal(await page.evaluate(() => window.harnessView.revision), 1, 'Remount must restore the selected game and its pending command');
  await menuAction('reload');
  await idleBoard();
  assert(await frame.locator('#retry').isVisible(), 'Reload must preserve the pending command');
  await frame.locator('#retry').click();
  await frame.locator('#retry').waitFor({ state: 'hidden' });
  // Retry hides before its queued send reaches the host. Count this game's sends before comparing them.
  await page.waitForFunction(() => window.harnessCalls.filter(call => call.name === 'kingdown_move' && call.arguments.game_id === window.harnessMatchId).length >= 2);
  const commands = await page.evaluate(() => window.harnessCalls.filter(call => call.name === 'kingdown_move' && call.arguments.game_id === window.harnessMatchId));
  assert.equal(commands.length, 2); assert.deepEqual(commands[0].arguments, commands[1].arguments);
  await page.waitForFunction(() => window.harnessCalls.some(c => c.name === 'kingdown_computer' && c.arguments.game_id === window.harnessMatchId));
  assert.equal(await page.evaluate(() => window.harnessCalls.find(c => c.name === 'kingdown_computer' && c.arguments.game_id === window.harnessMatchId).arguments.expected_revision), 1, 'Lost reply and retry commit exactly once');
  await idleBoard();
  await frame.locator('#status').filter({ hasText: 'Your move' }).waitFor();
  const id = await page.evaluate(() => window.harnessMatchId);
  const snapshot = await page.evaluate(() => window.harnessView), lastMove = await frame.locator('#last-move').innerText();
  assert(snapshot.revision >= 2 && snapshot.revision <= 5);
  // M3 and B3: a failed live read keeps the last board and turns its actions off.
  const boardRect = box => [box.width, box.height].map(Math.round);
  const lastBoard = boardRect(await frame.locator('#board canvas').boundingBox());
  await page.evaluate(() => { window.rejectNextGet = true; });
  await menuAction('reload');
  await readErrorOnce('Board');
  assert.equal(await frame.locator('#status').innerText(), 'Not current', 'The last board is marked Not current');
  assert.deepEqual(boardRect(await frame.locator('#board canvas').boundingBox()), lastBoard, 'The last board keeps its size after a failed read');
  assert.equal(await frame.locator('#end-turn').getAttribute('aria-disabled'), 'true', 'The stale board cannot send a turn');
  assert.equal(await frame.locator('#choices button').count(), 0, 'The stale board offers no move');
  await frame.getByRole('button', { name: 'Try again', exact: true }).click();
  await frame.locator('#retry').waitFor({ state: 'hidden' });
  assert.equal(await frame.locator('#error').innerText(), '', 'A good Board read clears the error');
  const readsBeforeRemount = await page.evaluate(() => window.harnessCalls.filter(call => call.name === 'kingdown_get').length);
  await remountFrame();
  await page.waitForFunction(count => window.harnessCalls.filter(call => call.name === 'kingdown_get').length > count, readsBeforeRemount);
  await frame.locator('#last-move').filter({ hasText: lastMove }).waitFor();
  await idleBoard();
  assert.equal(await page.evaluate(() => window.harnessMatchId), id);
  assert.deepEqual(await page.evaluate(() => ({ revision: window.harnessView.revision, fen: window.harnessView.fen })), { revision: snapshot.revision, fen: snapshot.fen });
  assert.equal(await page.evaluate(() => window.harnessCalls.findLast(call => call.name === 'kingdown_get').arguments.board_id), await page.evaluate(() => window.harnessWidgetState.privateContent.board_id), 'A replayed initial result fetches the board current game');
  await page.evaluate(() => { window.rejectNextGet = true; });
  await remountFrame();
  await frame.locator('#error').filter({ hasText: 'Harness saved-game read failed' }).waitFor();
  assert.equal(await frame.locator('#choices button').count(), 0, 'A failed saved-game read must not expose stale moves');
  assert(!/Your move|Their move/.test(await frame.locator('#status').innerText()), 'A failed read must not show the replayed position');
  await menuAction('reload');
  await frame.locator('#last-move').filter({ hasText: lastMove }).waitFor();
  await idleBoard();
  assert.equal(await frame.getByRole('button', { name: 'Fullscreen', exact: true }).count(), 0);
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await frame.locator('body').evaluate(el => el.scrollWidth > window.innerWidth), false);
  const canvas = await boardBox(); assert(canvas && canvas.width > 250 && canvas.width <= 390);
  await openPlay(); await legacyStart('solo'); await idleBoard();
  async function tapSquare(file, rank) {
    const box = await boardBox(); assert(box);
    await page.touchscreen.tap(box.x + (32 + (file + .5) * 112) * box.width / 960, box.y + (64 + 32 + (7 - rank + .5) * 112) * box.width / 960);
  }
  await tapSquare(4, 1);
  assert.equal(await frame.locator('#move-hint').innerText(), 'Select a marked square to move, or choose a move below.');
  await tapSquare(4, 3);
  await sendTurn(); await idleBoard();
  assert.equal(await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_move' && c.arguments.game_id === window.harnessMatchId && c.arguments.actions?.[0] === 'e2-e4').length), 1, 'Touch destination commits the ordinary move once');
  for (const [width,height] of [[320,568],[393,852],[1280,800]]) {
    await zoomViewport(width,height,0,0);
    for (const [target,lan] of [[[2,5],'Rc4-c6'],[[0,3],'Rc4-a4']]) {
      const seeded = await seedBoard('swap'), touch = browser.browserType().name()==='chromium';
      await tapSquare(2,3);
      assert.equal(await frame.locator('#status').innerText(),'White Rook.',`${width}: a touch tap selects the rook`);
      await tapSquare(2,3);
      const box = await boardBox(), point = ([file,rank]) => ({x:box.x+(32+(file+.5)*112)*box.width/960,y:box.y+(96+(7-rank+.5)*112)*box.width/960});
      if (touch) {
        const input = await page.context().newCDPSession(page);
        try { await touchStroke(input,point([2,3]),point(target)); }
        finally { await input.detach(); }
      } else {
        const from=point([2,3]),to=point(target);
        await page.mouse.move(from.x,from.y); await page.mouse.down(); await page.mouse.move(to.x,to.y,{steps:20}); await page.mouse.up();
      }
      await frame.locator('#end-turn[aria-disabled="false"]').waitFor();
      assert.equal(await page.evaluate(()=>window.harnessView.revision),seeded._meta.view.revision,`${width}: the drag waits for End turn`);
      await sendTurn(); await idleBoard();
      assert.equal(await page.evaluate(({id,lan})=>window.harnessCalls.filter(c=>c.name==='kingdown_move'&&c.arguments.game_id===id&&c.arguments.actions?.[0]===lan).length,{id:seeded._meta.view.game_id,lan}),1,`${width}: a ${touch?'touch':'mouse'} drag sends ${lan} once`);
    }
  }
  await zoomViewport(390,844,0,0);
  await openPlay(); await legacyStart('solo'); await idleBoard();
  await haste(); await tapSquare(4, 1);
  await openMoveChoices(); await frame.locator('#choices button').filter({ hasText: 'e2 to e4, with Haste' }).tap();
  await idleBoard();
  assert.equal(await frame.locator('#status').innerText(), 'Move it again, or select End turn.', 'Explicit Haste keeps the extra move');
  assert.equal(await page.evaluate(() => window.harnessView.revision), 0);
  await tapSquare(4, 3); await tapSquare(4, 3);
  assert.equal(await page.evaluate(() => window.harnessView.revision), 0, 'Second tap must not pass Haste');
  assert.equal(await frame.locator('#choices button').count(),0,'Second tap deselects');
  async function dragOwnSquare(file,rank,black=false) {
    const box=await boardBox(); assert(box);
    const x=box.x+(32+((black?7-file:file)+.5)*112)*box.width/960;
    const y=box.y+(96+((black?rank:7-rank)+.5)*112)*box.width/960;
    await page.mouse.move(x,y); await page.mouse.down(); await page.mouse.move(x+10,y); await page.mouse.up();
  }
  await tapSquare(4,3); await dragOwnSquare(4,3);
  assert.equal(await page.evaluate(() => window.harnessView.revision),0,'Drag start must not pass Haste');
  await tapSquare(4, 3); await tapSquare(4, 4);
  await sendTurn(); await idleBoard();
  assert.equal(await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_move' && c.arguments.game_id === window.harnessMatchId).length), 1, 'One press sends both Haste actions');
  await openPlay();
  await shot(page, 'mobile');
  for (const scenario of ['archer','freeze']) {
    const seeded=await (await page.request.post(new URL(`/fixture-position?case=${scenario}`,base).href)).json(); assert(!seeded.isError);
    // A seeded friend game may count its join as a revision: compare with the seeded revision.
    const start=seeded._meta.view.revision;
    const reads=await page.evaluate(()=>window.harnessCalls.filter(c=>c.name==='kingdown_get').length);
    await page.evaluate(result=>window.harnessShow(result),seeded);
    await page.waitForFunction(n=>window.harnessCalls.filter(c=>c.name==='kingdown_get').length>n,reads);
    await idleBoard();
    const black=scenario==='freeze';
    async function tap(file,rank) { const box=await boardBox(); await page.touchscreen.tap(box.x+(32+((black?7-file:file)+.5)*112)*box.width/960,box.y+(96+((black?rank:7-rank)+.5)*112)*box.width/960); }
    const file=black?4:2, rank=black?3:2;
    await tap(file,rank); await tap(file,rank);
    assert.equal(await frame.locator('#choices button').count(),0,`${scenario}: second tap deselects without submitting`);
    assert.equal(await page.evaluate(()=>window.harnessView.revision),start);
    await tap(file,rank);
    if (!black) { await dragOwnSquare(file,rank); assert.equal(await page.evaluate(()=>window.harnessView.revision),start,'Drag must not shoot'); await tap(2,2); await tap(2,4); }
    else { await frame.locator('#power-b').click(); await frame.locator('#board-sheet').getByRole('button', {name:'Use', exact:true}).click(); await openMoveChoices(); await frame.locator('#choices button').filter({hasText:/freeze/i}).click(); }
    // W7: End turn sends the whole turn, so the turn passes to the friend. Wait for the reply before the keys (blocked()).
    await sendTurn(); await page.waitForFunction(r=>window.harnessView.revision>=r,start+1);
    await idleBoard();
    await frame.locator('#board').focus();
    for (let i=0;i<9;i++) await page.keyboard.press('ArrowRight');
    assert.match(await frame.locator('#board').getAttribute('aria-label'),black?/a[1-8]/:/h[1-8]/);
    for (let i=0;i<9;i++) await page.keyboard.press('ArrowUp');
    assert.match(await frame.locator('#board').getAttribute('aria-label'),black?/a1/:/h8/);
  }
  // Every piece type and every king is drawn (ticket 09): each square of the gallery differs from the same square
  // with no piece on it ('apart' keeps its kings and pawns off those squares), in three games for the six kings.
  const GALLERY=[0,1,6,7].flatMap(rank=>[0,1,2,3,4,5,6,7].map(file=>[file,rank]));
  async function seed(scenario,kings) {
    const seeded=await (await page.request.post(new URL(`/fixture-position?case=${scenario}&kings=${kings}`,base).href)).json(); assert(!seeded.isError);
    const reads=await page.evaluate(()=>window.harnessCalls.filter(c=>c.name==='kingdown_get').length);
    await page.evaluate(result=>window.harnessShow(result),seeded);
    await page.waitForFunction(n=>window.harnessCalls.filter(c=>c.name==='kingdown_get').length>n,reads);
    await idleBoard();
  }
  /** The mean colour change of each gallery square's centre (48 board units square) against the stored empty board. */
  const squareChange=(store)=>frame.locator('canvas').evaluate(async (c,{squares,store})=>{
    // The scene draws a synced board on its next frame.
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    const g=c.getContext('2d'), k=c.width/960, h=Math.round(24*k);
    const boxes=squares.map(([f,r])=>g.getImageData(Math.round((32+(f+.5)*112)*k)-h,Math.round((96+(7-r+.5)*112)*k)-h,2*h,2*h).data);
    if (store) { window.emptyBoxes=boxes; return []; }
    return boxes.map((box,i)=>{ let sum=0; for (let j=0;j<box.length;j++) sum+=Math.abs(box[j]-window.emptyBoxes[i][j]); return sum/box.length; });
  },{squares:GALLERY,store});
  for (const kings of [0,1,2]) {
    await seed('apart',kings); await squareChange(true);
    await seed('gallery',kings);
    let change=await squareChange(false);
    for (let i=0;i<50&&Math.min(...change)<8;i++) { await page.waitForTimeout(200); change=await squareChange(false); }
    const blank=GALLERY.filter((_,i)=>change[i]<8).map(([f,r])=>'abcdefgh'[f]+(r+1));
    assert.deepEqual(blank,[],`King pair ${kings}: every piece and king is drawn (least change ${Math.min(...change).toFixed(1)})`);
    await shot(page,`board-gallery-${kings}-${mode}`);
    await openScreen('settings'); await frame.locator('#symbols-only').check();
    await page.evaluate(result => window.harnessShow(result), (await (await page.request.post(new URL(`/fixture-position?case=gallery&kings=${kings}`,base).href)).json()));
    await idleBoard(); await boardBox();
    const symbolErrors = await frame.locator('canvas').evaluate(async (c, { sources, names }) => {
      const images = new Map();
      for (const [name, source] of Object.entries(sources)) for (const side of [0,1]) {
        const style = side ? 'color:#2b2621;--pi-disc:#4a4850;--pi-ring:#6e6a74;--pi-glyph:#f3ead7' : 'color:#2b2621;--pi-disc:#fffcf4';
        const image = new Image(); image.src = 'data:image/svg+xml,' + encodeURIComponent(source.replace('<svg ', `<svg style="${style}" `)); await image.decode(); images.set(`${name}-${side}`, image);
      }
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const expected = document.createElement('canvas'); expected.width = c.width; expected.height = c.height;
      const g = expected.getContext('2d'), scale = c.width / 960;
      for (const [rank, row] of [[0,'RNBQKALG'],[1,'MSOPPPPP'],[6,'msoppppp'],[7,'rnbqkalg']]) [...row].forEach((letter, file) => {
        g.drawImage(images.get(`${names[letter.toUpperCase()]}-${rank >= 6 ? 1 : 0}`), (32+file*112+14)*scale, (96+(7-rank)*112+14)*scale, 84*scale, 84*scale);
      });
      const want = g.getImageData(0,0,c.width,c.height).data, got = c.getContext('2d').getImageData(0,0,c.width,c.height).data;
      return [[0,'RNBQKALG'],[1,'MSOPPPPP'],[6,'msoppppp'],[7,'rnbqkalg']].flatMap(([rank,row]) => [...row].map((letter,file) => {
        let sum=0, n=0;
        for(let y=Math.ceil((96+(7-rank)*112+14)*scale);y<(96+(7-rank)*112+98)*scale;y++) for(let x=Math.ceil((32+file*112+14)*scale);x<(32+file*112+98)*scale;x++) {
          const i=(y*c.width+x)*4; if(want[i+3]<254) continue;
          for(let channel=0;channel<3;channel++) { sum+=Math.abs(got[i+channel]-want[i+channel]); n++; }
        }
        return { square: 'abcdefgh'[file]+(rank+1), piece: names[letter.toUpperCase()], error: sum/n };
      })).filter(item => !Number.isFinite(item.error) || item.error > 3);
    }, { sources: iconSources, names: iconNames });
    assert.deepEqual(symbolErrors, [], 'Every piece on both armies matches its own source SVG');
    await clickSquare(1,0); await frame.locator('canvas').evaluate(() => { window.harnessGhostSymbols = [];
    window.harnessSwapMarks = 0; });
    const box = await boardBox(); await page.mouse.move(box.x+(32+.5*112)*box.width/960, box.y+(96+5.5*112)*box.width/960);
    await frame.locator('canvas').evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    assert(await frame.locator('canvas').evaluate(() => window.harnessGhostSymbols.some(src => /knight-0-/.test(src))), 'The knight move preview uses the same symbol at half opacity');
    await openScreen('settings'); await frame.locator('#symbols-only').uncheck();
  }
  await openPlay(); await legacyStart('solo'); await idleBoard();
  const cardBoard = await page.evaluate(() => window.harnessWidgetState.privateContent.board_id);
  const cardGame = await (await page.request.post(new URL('/fixture-tool',base).href,{data:{name:'kingdown_create',arguments:{kind:'solo',colour:'white',board_id:cardBoard,options:{...DEFAULT_OPTIONS,arrangement:false,kingPowers:false,cards:true,cardPool:['Freeze','IceWall','MorphP','Vault']}}}})).json();
  assert(!cardGame.isError); await page.evaluate(r=>window.harnessShow(r),cardGame); await idleBoard(); await boardBox();
  const { measureCardCoins } = await import('./lib/plugin-cards-check.mjs');
  await measureCardCoins(frame, env('PLAYABLE_OUT'));
  const cardView = cardGame._meta.view; setRules(cardView.rules);
  const cardPos = fromFen(cardView.fen), cardLegal = legalMoves(cardPos).filter(m => cardView.legal.includes(toLan(cardPos,m))), hand = cardCoins(cardPos,cardView.seat,cardView.rules.hands[cardView.seat],cardLegal);
  const cardIndex = hand.findIndex(c=>c.card === 'Vault' && c.moves.length); assert(cardIndex>=0,'The dealt Vault has a move');
  const card = hand[cardIndex], cardWords = cardName(card.card), cardLan = toLan(cardPos,card.moves[0]);
  assert.equal(await frame.locator('#strip-me .card-coin').count(),4); assert.equal(await frame.locator('#strip-them .card-coin').count(),4);
  const beforeCardRead = await page.evaluate(() => window.harnessWidgetState);
  await frame.locator('#strip-me .card-coin').nth(cardIndex).click();
  await frame.locator('#board-sheet[open] h2').filter({ hasText: cardWords }).waitFor();
  await page.waitForFunction(() => window.harnessWidgetState.privateContent.sheet === 'board-sheet');
  assertCardReadState(beforeCardRead, await page.evaluate(() => window.harnessWidgetState));
  await frame.locator('#board-sheet').getByRole('button',{name:'Use',exact:true}).click();
  for (const [width, height, top, bottom] of [[197, 426, 51, 59], [393, 852, 102, 118]]) {
    const host = await hostPage(width, height, top, bottom);
    try {
      await host.frame.locator('html').evaluate(() => Object.defineProperty(document, 'hidden', { configurable: true, value: true }));
      await host.page.evaluate(view => {
        window.harnessNextView = view;
        return window.harnessShow({ content: [], structuredContent: { game_id: view.game_id, screen: 'board' }, _meta: { board_id: window.harnessWidgetState.privateContent.board_id, view } });
      }, cardView);
      await host.frame.locator('#card-w-' + cardIndex).click();
      await host.frame.locator('#board-sheet').getByRole('button', { name: 'Use', exact: true }).click();
      assert.equal(await host.frame.locator('#status').textContent(), 'Vault.', `The armed card name ends with a stop at ${width} x ${height}`);
      await host.frame.locator('#context-text').scrollIntoViewIfNeeded();
      await host.frame.locator('html').evaluate(() => document.fonts.ready);
      await shot(host.page, `board-cards-armed-${width}-${mode}`);
    } finally { await host.page.close(); }
  }
  await zoomBoardFits('board-cards-armed');
  await openMoveChoices(); await frame.locator(`#choices button[title="${cardLan}"]`).click(); await sendTurn();
  await page.waitForFunction(({id,n})=>window.harnessCalls.some(c=>c.name==='kingdown_move'&&c.arguments.game_id===id&&c.arguments.actions?.[0]===n),{id:cardView.game_id,n:cardLan}); await idleBoard();
  await frame.locator('#strip-me .card-coin').nth(cardIndex).and(frame.locator('[data-state="used"]')).waitFor();
  assert.equal(await frame.locator('#strip-me .card-coin').nth(cardIndex).getAttribute('data-state'),'used','The played card is spent');
  await page.waitForFunction(id=>window.harnessView.game_id===id&&window.harnessView.turn===window.harnessView.seat,cardView.game_id); await idleBoard(); await boardBox();
  async function arrivalTool(name,args,friend=false) {return (await page.request.post(new URL(friend?'/fixture-friend-tool':'/fixture-tool',base).href,{data:{name,arguments:args}})).json();}
  const arrival=await arrivalTool('kingdown_create',{kind:'friend',colour:'white',board_id:cardBoard,options:{...DEFAULT_OPTIONS,fairy:false,arrangement:false,kingPowers:false,cards:true,cardPool:['Salvation','Freeze','IceWall','Vault']}}); assert(!arrival.isError);
  const arrivalInvite=await arrivalTool('kingdown_invite',{game_id:arrival._meta.view.game_id}); assert(!arrivalInvite.isError);
  const arrivalJoin=await arrivalTool('kingdown_join',{code:arrivalInvite.structuredContent.code},true); assert(!arrivalJoin.isError);
  async function arrivalRead() {const result=await arrivalTool('kingdown_get',{board_id:cardBoard}); await page.evaluate(r=>window.harnessShow(r),result); await page.waitForFunction(id=>window.harnessView.game_id===id,arrival._meta.view.game_id); await idleBoard(); await boardBox(); return result._meta.view;}
  let arrivalView=await arrivalRead();
  const arrivalRules=arrivalView.rules; setRules(arrivalRules);
  const arrivalPos=fromFen(arrivalView.fen), knight=legalMoves(arrivalPos).find(m=>typeOf(arrivalPos.board[m.from])===N&&m.to>>3===2&&!m.power);
  assert(knight); const middle=knight.to%8, targetFile=middle+2<8?middle+2:middle-2, pawnFile=targetFile+1<8?targetFile+1:targetFile-1, target=24+targetFile;
  for(const [source,destination,blackFrom,blackTo] of [[knight.from,knight.to,48+pawnFile,32+pawnFile],[knight.to,target,32+pawnFile,target]]) {
    setRules(arrivalRules); const pre=fromFen(arrivalView.fen), move=legalMoves(pre).find(m=>m.from===source&&m.to===destination&&!m.power); assert(move); const white=toLan(pre,move);
    await clickSquare(source%8,source>>3); await openMoveChoices();
    await frame.locator(`#choices button[title="${white}"]`).click(); await sendTurn(); await page.waitForFunction(rev=>window.harnessView.revision>rev,arrivalView.revision); await idleBoard();
    arrivalView=await page.evaluate(()=>window.harnessView);
    setRules(arrivalRules); const blackPos=fromFen(arrivalView.fen), blackMove=legalMoves(blackPos).find(m=>m.from===blackFrom&&m.to===blackTo&&!m.power); assert(blackMove); const black=toLan(blackPos,blackMove);
    const moved=await arrivalTool('kingdown_move',{game_id:arrivalView.game_id,command_id:randomUUID(),expected_revision:arrivalView.revision,lan:black},true); assert(!moved.isError); arrivalView=await arrivalRead();
  }
  const salvation=arrivalView.rules.hands[arrivalView.seat].indexOf('Salvation'), arrivalLan=arrivalView.legal.find(lan=>lan.startsWith('N@'+sqName(knight.from))); assert(salvation>=0&&arrivalLan,'The dealt Salvation can return the taken knight');
  await frame.locator('#strip-me .card-coin').nth(salvation).click();
  assert.match(await frame.locator('#board-sheet .cf-art img').getAttribute('src'),/salvation-/,'salvation.webp loads from the plugin origin');
  await frame.locator('#board-sheet').getByRole('button',{name:'Use',exact:true}).click(); await openMoveChoices();
  await frame.locator(`#choices button[title="${arrivalLan}"]`).click(); await sendTurn();
  await page.waitForFunction(rev=>window.harnessView.revision>rev,arrivalView.revision); await idleBoard(); await boardBox();
  await frame.locator('#strip-me .card-coin').nth(salvation).and(frame.locator('[data-state="used"]')).waitFor();
  assert.equal(await frame.locator('#strip-me .card-coin').nth(salvation).getAttribute('data-state'),'used','The arrival spends Salvation');
  assert.match(await frame.locator('#last-move img').getAttribute('src'),/knight-0-/,'The returned knight supplies the move icon');
  const blackGame=await (await page.request.post(new URL('/fixture-tool',base).href,{data:{name:'kingdown_create',arguments:{kind:'solo',options,colour:'black',board_id:cardBoard}}})).json(); assert(!blackGame.isError);
  await page.evaluate(r=>window.harnessShow(r),blackGame);
  await page.waitForFunction(id=>window.harnessView.game_id===id&&window.harnessView.turn===window.harnessView.seat,blackGame._meta.view.game_id);
  await frame.locator('#status').filter({hasText:'Your move'}).waitFor(); await idleBoard();
  assert.equal(await page.evaluate(()=>window.harnessView.turn),1,'The computer plays first for a Black seat');
  assert.equal(await page.evaluate(id=>window.harnessCalls.filter(c=>c.name==='kingdown_computer'&&c.arguments.game_id===id).length,blackGame._meta.view.game_id),1,'Mount sends one computer turn for Black');
  await openPlay(); await legacyStart('solo'); await idleBoard();
  const deleted=await page.evaluate(()=>window.harnessView);
  await page.request.post(new URL('/fixture-delete-match',base).href,{data:{game_id:deleted.game_id}});
  await menuAction('reload'); await frame.locator('#error').filter({hasText:'deleted'}).waitFor();
  await openPlay(); await legacyStart('solo'); await idleBoard();
  const replacement=await page.evaluate(()=>window.harnessView.game_id); assert.notEqual(replacement,deleted.game_id);
  const recoveryReads=await page.evaluate(()=>window.harnessCalls.filter(c=>c.name==='kingdown_get').length);
  await remountFrame();
  await page.waitForFunction(n=>window.harnessCalls.filter(c=>c.name==='kingdown_get').length>n,recoveryReads);
  await frame.locator('#status').filter({hasText:'Your move'}).waitFor();
  assert.equal(await page.evaluate(()=>window.harnessView.game_id),replacement,'Deleted-game recovery survives immediate remount');
  const friendTool = async (name,args={}) => (await page.request.post(new URL('/fixture-friend-tool',base).href,{data:{name,arguments:args,fresh:true}})).json();
  const tool = async (name,args={}) => (await page.request.post(new URL('/fixture-tool',base).href,{data:{name,arguments:args}})).json();
  // S5 review: full reads keep the draft words. A real draw offer refuses the old revision once.
  {
    const gameTool = async (name, args = {}, friend = false) => {
      const result = await (await page.request.post(new URL(friend ? '/fixture-friend-tool' : '/fixture-tool', base).href, {data:{name,arguments:args}})).json();
      assert(!result.isError, `${name}: ${JSON.stringify(result.content)}`); return result;
    };
    const classic = {fairy:false,pool:[],classic:true,arrangement:false,cards:false,cardPool:[],kingPowers:false};
    const created = await gameTool('kingdown_create', {kind:'friend',colour:'white',options:classic});
    const game_id = created._meta.view.game_id;
    const invite = await gameTool('kingdown_invite', {game_id});
    await gameTool('kingdown_join', {code:invite.structuredContent.code}, true);
    const opened = await gameTool('kingdown_open', {game_id});
    await page.evaluate(result => window.harnessShow(result), opened);
    await frame.locator('#status').filter({hasText:'Your move'}).waitFor(); await idleBoard();
    await clickSquare(4,1); await clickSquare(4,3); await boardBox();
    const draftWords = async () => {
      assert.equal(await frame.locator('#last-move').innerText(), 'White pawn e2 to e4.');
      assert.equal(await frame.locator('#short-move-words').innerText(), 'White pawn e2 → e4');
    };
    await draftWords();
    await remountFrame(); await frame.locator('#end-turn[aria-disabled="false"]').waitFor(); await draftWords();
    await frame.locator('#board-menu').click();
    await frame.locator('#board-sheet').getByRole('button',{name:'Settings',exact:true}).click();
    await frame.locator('#page-back').click();
    await frame.locator('#end-turn[aria-disabled="false"]').waitFor(); await draftWords();
    const offered = await gameTool('kingdown_draw', {game_id,choice:'offer'}, true);
    await sendTurn();
    await frame.locator('#status').filter({hasText:'The game changed. Check it, then tap Send your turn.'}).waitFor();
    await idleBoard(); await draftWords();
    assert.match(await frame.locator('#context-note').innerText(), /Your opponent offers a draw/);
    assert.equal(await frame.locator('#undo').getAttribute('aria-disabled'), 'false');
    await sendTurn(); await settled(); await idleBoard();
    const saved = (await gameTool('kingdown_get', {game_id}))._meta.view;
    assert.equal(saved.revision, offered._meta.view.revision + 1);
    setRules(opened._meta.view.rules);
    assert.equal(saved.fen, toFen(applyLan(fromFen(opened._meta.view.fen),'e2-e4',opened._meta.view.rules).pos));
    assert.equal(saved.draw_offer, null);
    assert.deepEqual(saved.history.actions, ['e2-e4']);
    assert.equal(await page.evaluate(() => window.harnessWidgetState.privateContent.pending ?? null), null);
    assert.equal(await page.evaluate(() => window.harnessWidgetState.privateContent.draft ?? null), null);
    await gameTool('kingdown_resign', {game_id});
    await legacyStart('solo');
  }
  async function zoomViewport(width,height,top,bottom) {
    const safeAreaInsets = {top,right:0,bottom,left:0};
    await page.setViewportSize({width,height});
    await page.evaluate(safeAreaInsets => window.harnessSetContext({deviceCapabilities:{touch:true},safeAreaInsets}), safeAreaInsets);
    // The widget applies host insets after the host sends them.
    await widget().waitForFunction(expected => {
      const css = getComputedStyle(document.documentElement);
      return Object.entries(expected).every(([edge,value]) => parseFloat(css.getPropertyValue(`--safe-${edge}`)) === value);
    }, safeAreaInsets);
    // The board canvas takes its size from a ResizeObserver one frame later; a read before then sees the old canvas.
    await frame.locator('body').evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  }
  async function scrollVertically(control) {
    await control.evaluate(el => {
      for (let parent = el.parentElement; parent; parent = parent.parentElement) {
        // A strip's coin row scrolls sideways on its own at 200% zoom (ticket 28 T2); every other box stays at the left.
        if (parent.classList.contains('coin-row') && /(auto|scroll)/.test(getComputedStyle(parent).overflowX)) {
          const rect = el.getBoundingClientRect(), box = parent.getBoundingClientRect();
          parent.scrollLeft += rect.left + rect.width / 2 - box.left - parent.clientWidth / 2;
        } else parent.scrollLeft = 0;
        if (/(auto|scroll)/.test(getComputedStyle(parent).overflowY) && parent.scrollHeight > parent.clientHeight) {
          const rect = el.getBoundingClientRect(), box = parent.getBoundingClientRect();
          parent.scrollTop += rect.top + rect.height / 2 - box.top - parent.clientHeight / 2;
        }
      }
    });
  }
  async function tapCentre(control) {
    await scrollVertically(control);
    assert((await control.evaluate(controlBounds)).accessible, 'The full control fits after vertical scroll');
    const box = await control.boundingBox(); assert(box);
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  }
  // Ticket 28: the boxes of a 200% zoom layout, rounded to [left, top, width, height] for the assert messages.
  function zoomBoxes(selectors) { return frame.locator('#app-frame').evaluate((frameEl, selectors) => {
    const box = el => { if (!el) return null; const r = el.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(Math.round); };
    return { frame: box(frameEl), ...Object.fromEntries(selectors.map(s => [s, box(document.querySelector(s))])) };
  }, selectors); }
  function inFrame(b, f) { return b && b[2] > 0 && b[3] > 0 && b[0] >= f[0] - 1 && b[1] >= f[1] - 1 && b[0] + b[2] <= f[0] + f[2] + 1 && b[1] + b[3] <= f[1] + f[3] + 1; }
  // T2: at 197 x 426 the context words show in full, the coins stay on one row, the board keeps its usable floor, and
  // the strips, the context line, Undo, End turn and Menu each come fully into the frame (the screen scrolls).
  async function zoomBoardFits(label) {
    if (['board-turn','board-cards-armed','board-swap-preview','board-their-turn'].includes(label)) await touchBoardScroll(label);
    const viewport = page.viewportSize();
    await zoomViewport(197,426,51,59);
    await frame.locator('#status').evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    const ids = ['#strip-them','#strip-me','#context-line','#undo','#end-turn','#board-menu'];
    const m = await zoomBoxes([...ids,'#board','#board canvas','#context-text']);
    const text = await frame.locator('#context-text').evaluate(el => ({scroll:el.scrollHeight,client:el.clientHeight,clip:getComputedStyle(el).overflowY}));
    const coinRows = await frame.locator('#game-table .coin-row').evaluateAll(rows => rows.map(row => [...row.children].map(c => { const r = c.getBoundingClientRect(); return Math.round(r.top + r.height / 2); })));
    const all = JSON.stringify({...m, text, coinRows});
    assert(text.clip === 'visible' || text.scroll <= text.client + 1, `${label} at 197 x 426: #context-text shows all its words: ${all}`);
    assert(coinRows.every(tops => tops.every(t => Math.abs(t - tops[0]) <= 1)), `${label} at 197 x 426: each strip keeps its coins on one row: ${all}`);
    assert(m['#board canvas'] && m['#board canvas'][2] >= 192, `${label} at 197 x 426: the board keeps its 192 px floor: ${all}`);
    for (const id of ids) {
      await scrollVertically(frame.locator(id));
      const seen = await zoomBoxes([id]);
      assert(inFrame(seen[id], seen.frame), `${label} at 197 x 426: ${id} comes fully into the frame: ${JSON.stringify(seen)} (${all})`);
    }
    await frame.locator('[data-screen="board"]').evaluate(el => { el.scrollTop = 0; });
    await shot(page, `zoom-fit-${label}-${mode}`);
    await zoomViewport(viewport.width, viewport.height, 0, 0);
  }
  // Ticket 32 C: use a fresh mobile host. A cut New game shows that the card scrolls; each action stays reachable.
  async function zoomEndFits(label, height = 426) {
    // Both results use the three solo actions named in ticket 32 C.
    const view = await page.evaluate(() => ({ ...window.harnessView, kind: 'solo', opponent: { ...window.harnessView.opponent, computer: true } }));
    const host = await browser.newPage({ viewport: { width: 197, height }, isMobile: true, hasTouch: true });
    trapErrors(host);
    const frame = host.frameLocator('iframe');
    try {
      await host.goto(base);
      await host.locator('#remount').evaluate(el => { el.style.display = 'none'; });
      await host.locator('iframe').evaluate(el => { el.style.setProperty('height', '100dvh', 'important'); });
      await frame.locator('#home-play:not(:disabled)').waitFor();
      await host.evaluate(bottom => window.harnessSetContext({ displayMode: 'fullscreen', safeAreaInsets: { top: 51, bottom, left: 0, right: 0 }, deviceCapabilities: { touch: true } }), height === 426 ? 59 : 0);
      // The win sample exists only in the check. A live poll must not replace it.
      await frame.locator('html').evaluate(() => Object.defineProperty(document, 'hidden', { configurable: true, value: true }));
      await host.evaluate(view => {
        window.harnessNextView = view;
        return window.harnessShow({ content: [], structuredContent: { game_id: view.game_id, screen: 'board' }, _meta: { board_id: window.harnessWidgetState.privateContent.board_id, view } });
      }, view);
      const card = frame.locator('#over.end-card[open]');
      await card.waitFor();
      await frame.locator('html').evaluate(async () => {
        await document.fonts.ready;
        for (let run; (run = document.getAnimations().filter(a => a.playState !== 'finished')).length;) await Promise.all(run.map(a => a.finished.catch(() => {})));
      });
      for (const gap of height === 426 ? [96, 59] : [96]) {
        // The second case tests the host inset alone, with no estimated composer floor.
        await frame.locator('#app-frame').evaluate((el, gap) => { el.style.bottom = `${gap}px`; }, gap);
        await card.evaluate(el => { el.scrollTop = 0; });
        const m = await card.evaluate(el => {
          const box = el => { const r = el.getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; };
          return { frame: box(document.querySelector('#app-frame')), card: box(el), reason: box(el.querySelector('#end-reason')), buttons: [...el.querySelectorAll('form button:not([hidden])')].map(box), scroll: el.scrollTop, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight };
        });
        const all = `${label} at 197 x ${height}, bottom gap ${gap}: ${JSON.stringify(m)}`, bottom = m.card[1] + m.card[3];
        assert.equal(m.frame[1], 51, all); assert.equal(m.frame[1] + m.frame[3], height - gap, all);
        assert.equal(m.buttons.length, 3, all);
        await shot(host, `zoom-fit-${label}-${height}-gap-${gap}-${mode}`);
        assert(inFrame(m.reason, m.frame) && inFrame(m.reason, m.card), `The result line shows with no scroll: ${all}`);
        if (height === 426) {
          assert(m.scroll === 0 && m.buttons[1][1] <= bottom - 12 && m.buttons[1][1] + m.buttons[1][3] > bottom, `New game crosses the card edge with at least 12 px in view: ${all}`);
        } else {
          assert(m.scroll === 0 && m.scrollHeight <= m.clientHeight && m.buttons.every(button => inFrame(button, m.card) && inFrame(button, m.frame)), `All three end actions show in full with no scroll in a tall frame: ${all}`);
        }
        assert(inFrame(m.buttons[0], m.frame) && inFrame(m.buttons[0], m.card), `Play again shows in full with no scroll: ${all}`);
        for (const name of ['Play again', 'New game', 'See the board']) {
          const button = card.getByRole('button', { name, exact: true });
          await button.evaluate(el => {
            const card = el.closest('dialog'), r = el.getBoundingClientRect(), c = card.getBoundingClientRect();
            card.scrollTop += r.top + r.height / 2 - c.top - card.clientHeight / 2;
          });
          const seen = await button.evaluate(el => {
            const box = el => { const r = el.getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; }, r = el.getBoundingClientRect();
            return { button: box(el), card: box(el.closest('dialog')), frame: box(document.querySelector('#app-frame')), hit: el.contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)) };
          });
          assert(inFrame(seen.button, seen.card) && inFrame(seen.button, seen.frame) && seen.hit, `${name} scrolls fully into the card and frame, and its centre takes a tap: ${JSON.stringify(seen)}`);
        }
        console.log(`PASS: ${all}; all three end actions fit and take a tap after scroll`);
      }
    } finally { await host.close(); }
  }
  // CDP touch input tests native pan. Desktop WebKit cannot pan with raw touch input; check its CSS and wheel scroll.
  async function touchStroke(input,from,to) {
    await input.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...from,id:0}]});
    for (let i=1;i<=20;i++) {
      await input.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:from.x+(to.x-from.x)*i/20,y:from.y+(to.y-from.y)*i/20,id:0}]});
      await new Promise(r=>setTimeout(r,16));
    }
    await new Promise(r=>setTimeout(r,100));
    await input.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...to,id:0}]});
    await input.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await new Promise(r=>setTimeout(r,100));
  }
  async function touchBoardScroll(label) {
    const viewport = page.viewportSize(), screen = frame.locator('[data-screen="board"]');
    const touch = browser.browserType().name()==='chromium' ? await page.context().newCDPSession(page) : undefined;
    const gesture = touch ? 'touch swipe' : 'wheel scroll';
    async function swipe(x, y) {
      if (touch) {
        await touch.send('Input.synthesizeScrollGesture',{x,y,yDistance:-500,speed:800,gestureSourceType:'touch',preventFling:true});
        return;
      }
      assert.deepEqual(await frame.locator('#board, #board canvas').evaluateAll(els=>els.map(el=>getComputedStyle(el).touchAction)),['pan-y','pan-y'],'WebKit parses vertical pan on the board and canvas');
      await page.mouse.move(x,y); await page.mouse.wheel(0,500);
      await new Promise(r=>setTimeout(r,250));
    }
    const reset = async () => {
      await screen.evaluate(el=>{document.getElementById('board').focus({preventScroll:true});el.scrollTop=0;});
      // Let the compositor apply the scroll reset before the next native gesture.
      await new Promise(r=>setTimeout(r,250));
      await screen.evaluate(el=>{el.scrollTop=0;});
    };
    try {
      await page.evaluate(()=>window.harnessSetContext({displayMode:'fullscreen'}));
      for (const [top,bottom] of [[31,17],[62,34]]) {
        await zoomViewport(201,357,top,bottom); await boardBox(); await reset();
        if (label==='board-swap-preview') {
          await tapSquare(3,3); await tapSquare(3,3);
          assert.equal(await frame.locator('#status').innerText(),'White Maester.','At 201 px a touch tap still selects the piece before the swipe');
          assert(await frame.locator('#choices button').count()>0,'The touch tap keeps the swap choices');
          await reset();
        }
        // A piece starts a drag. Use the empty square nearest the visible board centre for a scroll.
        const view = await page.evaluate(()=>({fen:window.harnessView.fen,seat:window.harnessView.seat}));
        const start = await frame.locator('canvas').evaluate((c,{occupied,black})=>{
          const b=c.getBoundingClientRect(), f=document.querySelector('.frame').getBoundingClientRect();
          const cx=(Math.max(b.left,f.left)+Math.min(b.right,f.right))/2, cy=(Math.max(b.top,f.top)+Math.min(b.bottom,f.bottom))/2;
          const empty=occupied.flatMap((piece,sq)=>{
            if(piece) return [];
            const file=sq%8,rank=Math.floor(sq/8),x=b.x+(32+((black?7-file:file)+.5)*112)*b.width/960,y=b.y+(96+((black?rank:7-rank)+.5)*112)*b.width/960;
            return x>f.left&&x<f.right&&y>f.top&&y<f.bottom&&document.elementFromPoint(x,y)===c ? [{x,y,sq,distance:Math.hypot(x-cx,y-cy)}] : [];
          }).sort((a,b)=>a.distance-b.distance);
          return {...empty[0],hit:empty.length>0,action:getComputedStyle(c).touchAction,boardAction:getComputedStyle(c.parentElement).touchAction,scroll:c.closest('[data-screen="board"]').scrollTop};
        },{occupied:Array.from(fromFen(view.fen).board),black:view.seat===1});
        const host = await page.locator('iframe').boundingBox(); assert(host && start.hit,`${label}: the swipe starts on the visible board`);
        await frame.locator('canvas').evaluate(c=>{
          window.touchTrace=[];
          for(const name of ['pointerdown','pointercancel','touchstart']) document.addEventListener(name,e=>window.touchTrace.push({name,target:e.target.tagName,id:e.target.id,action:getComputedStyle(e.target).touchAction}),{once:true});
        });
        await swipe(host.x+start.x,host.y+start.y);
        const boardScroll = await screen.evaluate(el=>el.scrollTop);
        const boxes = await zoomBoxes(['#undo','#end-turn','#board-menu']);
        const endHit = await frame.locator('#end-turn').evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));});
        const trace = await frame.locator('canvas').evaluate(()=>window.touchTrace);
        await shot(page,`touch-scroll-${label}-${top}-${mode}`);
        let stripScroll;
        if (label==='board-swap-preview'&&top===31) {
          await reset();
          const strip = await frame.locator('#strip-them .player-name').boundingBox(); assert(strip);
          await swipe(strip.x+strip.width/2,strip.y+strip.height/2);
          stripScroll = await screen.evaluate(el=>el.scrollTop);
          assert(stripScroll>0,`${label}: a ${gesture} from the top strip scrolls the board screen`);
        }
        console.log(`T-A ${label} 201x357 insets ${top}/${bottom} ${gesture}: strip scrollTop=${stripScroll}, board scrollTop=${boardScroll}, start=${JSON.stringify(start)}, input=${JSON.stringify(trace)}`);
        assert(boardScroll>start.scroll,`${label}: a ${gesture} from the board scrolls the board screen`);
        for (const id of ['#undo','#end-turn','#board-menu']) assert(inFrame(boxes[id],boxes.frame),`${label}: ${id} fits after a board swipe: ${JSON.stringify(boxes)}`);
        assert(endHit,`${label}: End turn receives a tap after a board swipe`);
      }
    } finally {
      await touch?.detach();
      await reset(); await zoomViewport(viewport.width,viewport.height,0,0);
    }
  }
  // T3: the boxes of the hall that the page cuts. Each box outside a scroll box must hold its box inside its holder box
  // (its nearest clip parent, or the frame), and a box that cuts its content (hidden or clip overflow, no scroll box
  // inside) must show that content in full: the player cannot scroll to it. The content of an auto or scroll box is
  // reachable, so that content scrolls into view (M1/R1, the row below the fold is a layout choice).
  const hallCuts = () => frame.locator('.page-sheet').evaluate(sheet => {
    const scrolls = el => { const s = getComputedStyle(el); return /(auto|scroll)/.test(s.overflowY) || /(auto|scroll)/.test(s.overflowX); };
    const clips = el => { const s = getComputedStyle(el); return /(auto|scroll|hidden|clip)/.test(s.overflowY) || /(auto|scroll|hidden|clip)/.test(s.overflowX); };
    const name = el => el.id || `${el.tagName.toLowerCase()}${typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/)[0] : ''}`;
    const box = el => { const r = el.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(Math.round); };
    const frame = sheet.parentElement, frameBox = box(frame), found = [];
    // A box inside a scroll box scrolls into view, so only the boxes outside every scroll box must fit their holder.
    const visit = (el, holder, holderName, scrolled) => {
      const style = getComputedStyle(el), r = el.getBoundingClientRect();
      if (!scrolled && r.width && r.height && style.visibility === 'visible') {
        const out = r.top < holder[1] - 1 || r.bottom > holder[1] + holder[3] + 1 || r.left < holder[0] - 1 || r.right > holder[0] + holder[2] + 1;
        const words = el.textContent.trim().length > 0, innerScroll = [...el.querySelectorAll('*')].some(scrolls);
        const cutDown = words && !innerScroll && /(hidden|clip)/.test(style.overflowY) && el.scrollHeight > el.clientHeight + 1;
        const cutAcross = words && !innerScroll && /(hidden|clip)/.test(style.overflowX) && el.scrollWidth > el.clientWidth + 1;
        if (out || cutDown || cutAcross) found.push(`${name(el)} ${JSON.stringify(box(el))}${out ? ` outside ${holderName} ${JSON.stringify(holder)}` : ''}${cutDown ? ` cuts ${el.scrollHeight - el.clientHeight} px down` : ''}${cutAcross ? ` cuts ${el.scrollWidth - el.clientWidth} px across` : ''}`);
      }
      const inner = scrolled || scrolls(el), held = clips(el) ? { box: box(el), name: name(el) } : { box: holder, name: holderName };
      for (const child of el.children) visit(child, held.box, held.name, inner);
    };
    visit(sheet, frameBox, 'frame', false);
    return found.slice(0, 6);
  });
  // T3: at 197 x 426 the hall scrolls to its end above the pinned Start game bar, and the page clips nothing.
  async function zoomHallFits() {
    const viewport = page.viewportSize();
    await zoomViewport(197,426,51,59);
    const body = frame.locator('#new-game .new-game-body');
    await body.evaluate(el => { el.scrollTop = el.scrollHeight; });
    const last = await body.evaluate(el => { const kids = [...el.querySelectorAll('button, label, input')].filter(k => k.getClientRects().length); const r = kids.at(-1).getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(Math.round); });
    const m = await zoomBoxes(['.page-sheet','#new-game','#new-game .new-game-head','#new-game .new-game-body','#new-game .new-game-foot']);
    const cut = await hallCuts();
    const all = JSON.stringify({...m, last, cut}), foot = m['#new-game .new-game-foot'];
    assert(last[1] + last[3] <= foot[1] + 1, `The hall at 197 x 426: the last choice ends above the top of the Start game bar: ${all}`);
    assert(inFrame(m['.page-sheet'],m.frame)&&inFrame(m['#new-game'],m.frame)&&inFrame(m['#new-game .new-game-body'],m.frame)&&inFrame(foot,m.frame)&&cut.length===0, `The hall at 197 x 426: the sheet, the dialog, the body and the Start game bar all fit the frame, and the page clips nothing: ${all}`);
    // The audit must see the fault that the QA report names (a dialog cut by a taller body): a body 900 px tall leaves it.
    await frame.locator('head').evaluate(head => { const s = document.createElement('style'); s.id = 'zoom-clip-probe'; s.textContent = '#new-game .new-game-body { min-height: 900px }'; head.append(s); });
    const probed = await hallCuts();
    await frame.locator('#zoom-clip-probe').evaluate(el => el.remove());
    assert(probed.length > 0 && (await hallCuts()).length === 0, `The hall at 197 x 426: the clip audit sees a body taller than its holder: ${JSON.stringify(probed)}`);
    await shot(page, `zoom-fit-hall-${mode}`);
    await body.evaluate(el => { el.scrollTop = 0; });
    await zoomViewport(viewport.width, viewport.height, 0, 0);
  }
  async function tapEndAtZoom(name) {
    const viewport = page.viewportSize();
    const card = frame.locator('#over.end-card[open]'), button = card.getByRole('button',{name,exact:true});
    for (const [width,height,top,bottom] of [[262,568,68,79],[197,426,51,59]]) {
      await zoomViewport(width,height,top,bottom);
      // A portrait phone hides the page head on game pages; the table's own Back then takes its place.
      const back = frame.locator('#page-back:visible, #game-table .table-back:visible').first();
      const layout = await card.evaluate(el => ({top:el.getBoundingClientRect().top,head:Math.max(0,...[...document.querySelectorAll('#page-head, #game-table .table-back')].filter(e=>e.getClientRects().length).map(e=>e.getBoundingClientRect().bottom)),scrolls:el.scrollHeight>el.clientHeight}));
      assert(layout.top >= layout.head, `At ${width} px the end card leaves the page head and Back clear`);
      assert(layout.scrolls, `At ${width} px the end card scrolls inside`);
      assert((await back.evaluate(controlBounds)).accessible, `At ${width} px Back stays in view`);
      assert(await back.evaluate(el => { const r=el.getBoundingClientRect(); return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)); }), `At ${width} px the end card leaves Back clear for a tap`);
      await scrollVertically(button);
      assert((await button.evaluate(controlBounds)).accessible, `At ${width} px ${name} scrolls into view`);
      await shot(page,`zoom-end-${width}-${name.replaceAll(' ','-')}-${mode}`);
    }
    await tapCentre(button);
    await zoomViewport(viewport.width,viewport.height,0,0);
  }
  await legacyStart('solo'); await frame.locator('#board-menu').click(); await frame.locator('#menu-resign').click();
  await frame.locator('#board-sheet h2').filter({hasText:'Lay your king down?'}).waitFor({timeout:3000});
  assert.equal(await page.evaluate(()=>window.harnessView.status),'playing','Resign waits for its confirm');
  await frame.locator('#board-sheet').getByRole('button',{name:'Keep playing',exact:true}).click();
  await boardBox();
  const boardBeforeEnd = await frame.locator('#board canvas').boundingBox();
  const rounded = (box) => box && [box.x, box.y, box.width, box.height].map(v => Math.round(v));
  await frame.locator('#board-menu').click(); await frame.locator('#menu-resign').click(); await frame.locator('#board-sheet').getByRole('button',{name:'Resign',exact:true}).click();
  await frame.locator('#over.end-card[open] h2').filter({hasText:'You lose'}).waitFor(); await idleBoard();
  // F14: the end card is an overlay over #game-table. The board and its canvas keep their rect, and the table bar
  // keeps its cell in the grid, so the board never resizes and the canvas does not redraw at a new size.
  assert.deepEqual(rounded(await frame.locator('#board canvas').boundingBox()), rounded(boardBeforeEnd), 'The board keeps its rect when the end card opens');
  assert(await frame.locator('#table-bar').evaluate(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0;}),'The table bar keeps its grid cell behind the end card');
  assert.equal(await frame.locator('#end-reason').innerText(),'You resigned.');
  assert.equal(await frame.locator('#over.is-win, #board[data-toppling]').count(),0,'A loss stays calm');
  const ended = await page.evaluate(()=>window.harnessView), rematchCalls = await page.evaluate(()=>window.harnessCalls.length);
  await page.clock.fastForward(1100);
  await page.evaluate(()=>{window.dropNextReply='kingdown_rematch';});
  for (const height of [426, 800]) await zoomEndFits('end-loss', height);
  await tapEndAtZoom('Play again');
  await frame.locator('#over #retry').waitFor();
  const pendingRematch=await page.evaluate(()=>window.harnessWidgetState.privateContent.pending);
  await tapEndAtZoom('Retry');
  await page.waitForFunction(id=>window.harnessView.game_id!==id,ended.game_id); await idleBoard();
  assert.equal(await page.evaluate(()=>window.harnessView.seat),ended.seat,'Play again keeps the player colour');
  const rematchSent = await page.evaluate(n=>window.harnessCalls.slice(n),rematchCalls);
  assert.equal(rematchSent.find(c=>c.name==='kingdown_rematch').arguments.choice,'offer','Solo rematch offers, never accepts');
  assert.deepEqual(rematchSent.filter(c=>c.name==='kingdown_rematch').map(c=>c.arguments.command_id),[pendingRematch.args.command_id,pendingRematch.args.command_id],'A lost rematch reply retries the same command');
  const resumedCall = rematchSent.find(c=>c.name==='kingdown_resume'); assert(resumedCall && resumedCall.arguments.board_id,'The new game resumes on the same board');
  assert(!rematchSent.some(c=>c.name==='kingdown_get' && c.arguments.game_id===resumedCall.arguments.game_id),'Rematch never reads the new game by ID');
  assert(['board','seat'].includes(await page.evaluate(()=>window.harnessWidgetState.privateContent.screen)));
  await legacyStart('solo'); await frame.locator('#board-menu').click(); await frame.locator('#menu-resign').click(); await frame.locator('#board-sheet').getByRole('button',{name:'Resign',exact:true}).click();
  await frame.locator('#over.end-card[open]').waitFor(); await idleBoard();
  await page.clock.fastForward(1100);
  await tapEndAtZoom('New game');
  await frame.locator('[data-screen="play"]:not([hidden])').waitFor(); assert.equal(await frame.locator('#over').isVisible(),false);
  await zoomHallFits();
  await openPlay(); await legacyStart('solo'); await frame.locator('#board-menu').click(); await frame.locator('#menu-abort').click();
  await frame.locator('#board-sheet').getByRole('button',{name:'Abort',exact:true}).click();
  await frame.locator('[data-screen="play"]:not([hidden])').waitFor(); await idleBoard();
  assert.equal(await frame.locator('#over[open], #board[data-toppling]').count(),0,'A computer abort returns to the draft with no ceremony');
  assert(await frame.getByRole('radio',{name:'Computer',exact:true}).isChecked());
  assert(await frame.getByRole('radio',{name:'White',exact:true}).isChecked());
  if (capabilities.friend) {
    async function joinedGame() {
      const board_id=await page.evaluate(()=>window.harnessWidgetState.privateContent.board_id);
      const made=await tool('kingdown_create',{kind:'friend',options,colour:'white',board_id}); assert(!made.isError);
      const invite=await tool('kingdown_invite',{game_id:made._meta.view.game_id}); assert(!invite.isError);
      const join=await friendTool('kingdown_join',{code:invite.structuredContent.code}); assert(!join.isError);
      const full=await tool('kingdown_get',{board_id}); await page.evaluate(r=>window.harnessShow(r),full); await idleBoard();
      await frame.locator('[data-screen="board"]:not([hidden])').waitFor(); return full._meta.view;
    }
    async function readGame() { const board_id=await page.evaluate(()=>window.harnessWidgetState.privateContent.board_id); const full=await tool('kingdown_get',{board_id}); await page.evaluate(r=>window.harnessShow(r),full); await idleBoard(); return full._meta.view; }
    let human=await joinedGame();
    await frame.locator('#board-menu').click(); await frame.locator('#menu-draw').click(); await frame.locator('#board-sheet').getByRole('button',{name:'Offer draw',exact:true}).click(); await idleBoard();
    let current=await page.evaluate(()=>window.harnessView);
    assert.equal(current.draw_offer,current.seat);
    const decline=await friendTool('kingdown_draw',{game_id:human.game_id,command_id:randomUUID(),expected_revision:current.revision,choice:'decline'}); assert(!decline.isError); await readGame();
    current=await page.evaluate(()=>window.harnessView);
    const offer=await friendTool('kingdown_draw',{game_id:human.game_id,command_id:randomUUID(),expected_revision:current.revision,choice:'offer'}); assert(!offer.isError); await readGame();
    // A declined draw sends a page-board read first, then the command. A foreground read no longer locks the frame
    // (design §2 and §3.3), so wait for the command itself, then for its reply to settle.
    const declines=await page.evaluate(()=>window.harnessCalls.filter(c=>c.name==='kingdown_draw').length);
    await frame.locator('#context-actions #decline-draw').click(); await frame.locator('#board-sheet').getByRole('button',{name:'Decline',exact:true}).click();
    await page.waitForFunction(n=>window.harnessCalls.filter(c=>c.name==='kingdown_draw').length>n,declines); await settled(); await idleBoard();
    current=await page.evaluate(()=>window.harnessView); assert.equal(current.draw_offer,null);
    const offerAgain=await friendTool('kingdown_draw',{game_id:human.game_id,command_id:randomUUID(),expected_revision:current.revision,choice:'offer'}); assert(!offerAgain.isError); await readGame();
    if (mode==='fixture') await page.request.post(new URL('/fixture-seed',base).href,{data:{actor:'alice',data:{views:{[human.game_id]:{outcome:{rating_before:1500,rating:1561,provisional:true,badges:[{badge:'fairy_tale',earned_at:new Date().toISOString()}]}}}}}});
    await page.evaluate(()=>{window.holdNext='kingdown_draw';});
    await frame.locator('#context-actions #accept-draw').click(); await frame.locator('#board-sheet').getByRole('button',{name:'Accept',exact:true}).click();
    await page.waitForFunction(()=>typeof window.releaseHeld==='function');
    await page.evaluate(()=>{window.rejectNextGet=true; window.releaseHeld();});
    await frame.locator('#over.end-card[open] h2').filter({hasText:'Draw'}).waitFor(); await idleBoard();
    assert.equal(await frame.locator('#end-reason').innerText(),'Draw by agreement.');
    assert.equal(await frame.locator('#over.is-win, #board[data-toppling]').count(),0,'A draw stays calm');
    await frame.locator('#over #retry').waitFor({timeout:3000});
    assert.equal(await frame.locator('#over .end-facts').innerText(),'','A failed full end read shows no guessed rating or badge');
    await frame.locator('#over #retry').click(); await frame.locator('#over #retry').waitFor({state:'hidden'}); await idleBoard();
    if (mode==='fixture') { await frame.locator('.end-facts').filter({hasText:'New player'}).waitFor(); assert(!/1561|\+61|\?/.test(await frame.locator('.end-facts').innerText()), 'A new player sees no provisional number'); assert.match(await frame.locator('.new-badge img').getAttribute('src'),/badge-fairy-tale-/); }
    await page.setViewportSize({width:197,height:426});
    await page.locator('iframe').evaluate(e=>e.style.setProperty('height','100dvh','important'));
    await page.evaluate(()=>window.harnessSetContext({displayMode:'fullscreen',safeAreaInsets:{top:51,bottom:59,left:0,right:0},deviceCapabilities:{touch:true}}));
    assert(await frame.locator('#over').evaluate(e=>e.scrollHeight>e.clientHeight),'The 197 px end card scrolls');
    assert(await frame.locator('#game-table .table-back').evaluate(e=>{const r=e.getBoundingClientRect(),card=document.getElementById('over').getBoundingClientRect();return r.height>=44&&r.bottom<=card.top&&e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),'Back stays clear of the end card');
    for (const name of ['Rematch','New game','See the board']) {
      const b=frame.locator('#over').getByRole('button',{name,exact:true}); await b.scrollIntoViewIfNeeded();
      assert(await b.evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),name+' stays reachable at 197 px');
    }
    assert.equal(await frame.locator('#over').evaluate(e=>e.scrollWidth-e.clientWidth),0,'The end card has no horizontal scroll');
    await shot(page,'end-197x426-'+mode);
    await frame.locator('#over').getByRole('button',{name:'See the board',exact:true}).click();
    const endReads=await page.evaluate(()=>window.harnessCalls.filter(c=>c.name==='kingdown_get'&&c.arguments.since_revision!==undefined).length);
    // A second poll proves the first reply has reached End. A new chat result routes to the board again.
    for (let n=1;n<=2;n++) {
      await page.clock.fastForward(3100);
      await page.waitForFunction(count=>window.harnessCalls.filter(c=>c.name==='kingdown_get'&&c.arguments.since_revision!==undefined).length>=count,endReads+n);
    }
    assert.equal(await frame.locator('#over[open]').count(),0,'A poll keeps the end card closed');
    await frame.locator('#end-result').click(); await frame.locator('#over[open]').waitFor();
    await page.locator('iframe').evaluate(e=>e.style.removeProperty('height'));
    await page.setViewportSize({width:1000,height:1000});
    await page.evaluate(()=>window.harnessSetContext({displayMode:'fullscreen',safeAreaInsets:{top:0,bottom:0,left:0,right:0},deviceCapabilities:{touch:true}}));
    console.log('PASS: plain draw reason, calm result, See the board and end actions at 197 by 426');
    current=await page.evaluate(()=>window.harnessView);
    const buddyOffer=await friendTool('kingdown_rematch',{game_id:human.game_id,command_id:randomUUID(),expected_revision:current.revision,choice:'offer'}); assert(!buddyOffer.isError);
    await page.clock.fastForward(3100);
    await frame.locator('#over').getByRole('button',{name:'Accept',exact:true}).waitFor({timeout:3000});
    const offeredEnd=await page.evaluate(()=>window.harnessView);
    assert.equal(offeredEnd.rematch_offer,1,'A later Rematch offer arrives without a manual read');
    for (const allowed of [false,true]) {
      await page.evaluate(({view,allowed})=>{window.holdNext='kingdown_get'; window.harnessNextView={...view,rules:undefined,rematch_allowed:allowed};},{view:offeredEnd,allowed});
      await page.clock.fastForward(3100); await page.waitForFunction(()=>typeof window.releaseHeld==='function');
      await page.evaluate(()=>window.releaseHeld());
      await frame.locator('#over').getByRole('button',{name:'Accept',exact:true}).waitFor({state:allowed?'visible':'detached',timeout:3000});
    }
    for(const deleted of [true,false]) {
      await page.evaluate(({view,deleted})=>{window.holdNext='kingdown_get'; window.harnessNextView={...view,rules:undefined,opponent:{...view.opponent,deleted}};},{view:offeredEnd,deleted});
      await page.clock.fastForward(3100); await page.waitForFunction(()=>typeof window.releaseHeld==='function');
      assert(await frame.locator('#page-back').isEnabled(),'An end poll leaves controls enabled'); await page.evaluate(()=>window.releaseHeld());
      await frame.locator('#over').getByRole('button',{name:'Accept',exact:true}).waitFor({state:deleted?'detached':'visible',timeout:3000});
      if (deleted) {
        assert.equal(await frame.locator('#over #end-block-player').count(),0,'A deleted opponent has no Block control');
        const reads=await page.evaluate(()=>window.harnessCalls.filter(c=>c.name==='kingdown_get').length);
        await page.clock.fastForward(31000);
        assert.equal(await page.evaluate(()=>window.harnessCalls.filter(c=>c.name==='kingdown_get').length),reads,'A deleted opponent stops end polling');
        await readGame();
      }
    }
    await tapEndAtZoom('Decline'); await idleBoard(); current=await page.evaluate(()=>window.harnessView); assert.equal(current.rematch_offer,null);
    await frame.locator('#over').getByRole('button',{name:'Rematch',exact:true}).click(); await idleBoard(); current=await page.evaluate(()=>window.harnessView);
    assert.equal(await frame.locator('#over').getByRole('button',{name:'Rematch',exact:true}).count(),0,'An offer has no second Rematch button');
    const buddyDecline=await friendTool('kingdown_rematch',{game_id:human.game_id,command_id:randomUUID(),expected_revision:current.revision,choice:'decline'}); assert(!buddyDecline.isError);
    const buddyOfferAgain=await friendTool('kingdown_rematch',{game_id:human.game_id,command_id:randomUUID(),expected_revision:buddyDecline._meta.view.revision,choice:'offer'}); assert(!buddyOfferAgain.isError);
    // Here the next end poll is due in up to 30 seconds (the daily-game step of pollDelay), not in 3.
    await page.clock.fastForward(30000); await frame.locator('#over').getByRole('button',{name:'Accept',exact:true}).waitFor();
    const acceptCalls=await page.evaluate(()=>window.harnessCalls.length), acceptBoard=await page.evaluate(()=>window.harnessWidgetState.privateContent.board_id);
    await tapEndAtZoom('Accept');
    await page.waitForFunction(id=>window.harnessView.game_id!==id,human.game_id); await idleBoard();
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor(); await boardBox();
    const accepted=await page.evaluate(()=>window.harnessView), acceptedCalls=await page.evaluate(n=>window.harnessCalls.slice(n),acceptCalls);
    assert(acceptedCalls.some(c=>c.name==='kingdown_rematch'&&c.arguments.choice==='accept'),'The end-card Accept sends the rematch command');
    assert(acceptedCalls.some(c=>c.name==='kingdown_resume'&&c.arguments.game_id===accepted.game_id&&c.arguments.board_id===acceptBoard),'Accept resumes the new game on the same board');
    assert.equal(accepted.status,'playing'); assert.equal(accepted.seat,1,'The accepted rematch swaps colours'); assert.deepEqual(accepted.options,human.options,'The accepted rematch keeps its features');
    human=await joinedGame();
    await clickSquare(4,1); await clickSquare(4,3); await sendTurn(); await idleBoard(); current=await page.evaluate(()=>window.harnessView);
    const blackMove=await friendTool('kingdown_move',{game_id:human.game_id,command_id:randomUUID(),expected_revision:current.revision,lan:'e7-e5'}); assert(!blackMove.isError); await readGame();
    await clickSquare(3,1); await clickSquare(3,3); await sendTurn(); await idleBoard(); current=await page.evaluate(()=>window.harnessView); assert.equal(current.abort_open,false);
    if (mode==='fixture') await page.request.post(new URL('/fixture-seed',base).href,{data:{actor:'alice',data:{views:{[human.game_id]:{deadline_at:new Date(Date.now()-60000).toISOString()}}}}});
    else { const {Client}=await import('pg'); const db=new Client({connectionString:process.env.PLUGIN_TEST_DATABASE_URL}); await db.connect(); try {await db.query("update public.games set deadline_at=now()-interval '1 minute', deadline_kind='move' where id=$1",[human.game_id]);} finally {await db.end();} }
    await readGame(); await frame.locator('#context-actions #claim').click(); await frame.locator('#board-sheet').getByRole('button',{name:'Claim the win',exact:true}).click();
    await frame.locator('#over.end-card[open] h2').filter({hasText:'You win'}).waitFor(); await idleBoard(); assert.equal(await frame.locator('#end-reason').innerText(),'Your opponent ran out of time.');
    human=await joinedGame(); await clickSquare(4,1); await clickSquare(4,3); await sendTurn(); await idleBoard(); current=await page.evaluate(()=>window.harnessView); assert.equal(current.abort_open,true);
    if (mode==='fixture') await page.request.post(new URL('/fixture-seed',base).href,{data:{actor:'alice',data:{views:{[human.game_id]:{deadline_at:new Date(Date.now()-60000).toISOString()}}}}});
    else {const {Client}=await import('pg'); const db=new Client({connectionString:process.env.PLUGIN_TEST_DATABASE_URL}); await db.connect(); try {await db.query("update public.games set deadline_at=now()-interval '1 minute', deadline_kind='first_turn' where id=$1",[human.game_id]);} finally {await db.end();}}
    await readGame(); assert.equal(await frame.locator('#context-actions #claim').innerText(),'End game');
    await frame.locator('#context-actions #claim').click(); await frame.locator('#board-sheet').getByRole('button',{name:'End game',exact:true}).click();
    await frame.locator('#over.end-card[open] h2').filter({hasText:'No first move. No result.'}).waitFor(); await idleBoard();
    assert.equal(await frame.locator('#over').getByRole('button',{name:'Rematch',exact:true}).count(),0);
  }
  if (capabilities.friend) {
    await openPlay();
    await openPlay(); await legacyStart('friend', 'friend'); await idleBoard();
    await frame.locator('#friend-new').waitFor();
    await page.evaluate(() => { window.holdNextGet = true; });
    await page.clock.fastForward(5000);
    await page.waitForFunction(() => typeof window.releaseHeldGet === 'function');
    assert(await frame.locator('#page-back').isEnabled(), 'Background polling must not disable game controls');
    await openPlay(); await legacyStart('solo');
    await frame.locator('#status').filter({ hasText: 'Your move' }).waitFor();
    await idleBoard();
    await page.evaluate(() => { window.releaseHeldGet(); });
    await page.waitForFunction(() => window.heldGetReturned);
    await frame.locator('#status').evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.match(await frame.locator('#status').innerText(), /Your move/, 'An old friend read must not replace the newly selected solo game');
    await openPlay(); await legacyStart('friend', 'friend'); await idleBoard();
    await frame.locator('#friend-new').click(); await frame.locator('.game-code span').first().waitFor();
    const code = (await frame.locator('.game-code span').allTextContents()).join(''); assert.match(code, /^[A-HJKMNP-Z2-9]{6}$/);
    const joined = await friendTool('kingdown_join',{code});
    assert(!joined.isError, JSON.stringify(joined.content));
    await page.clock.fastForward(5000);
    await frame.locator('#status').filter({ hasText: 'Your move' }).waitFor();
    await clickSquare(4, 1); await clickSquare(4, 3);
    await sendTurn(); await idleBoard();
    const friend = await page.evaluate(() => window.harnessView);
    const replied = await friendTool('kingdown_move',{ game_id: friend.game_id, command_id: 'friend-reply', expected_revision: friend.revision, lan: 'e7-e5' });
    assert(!replied.isError);
    await page.clock.fastForward(30000);
    await settled();
    await frame.locator('#status').filter({ hasText: 'Your move' }).waitFor();
    assert.equal(await page.evaluate(() => window.harnessView.revision), friend.revision + 1);
    await openPlay(); await legacyStart('solo'); await idleBoard();
    assert.equal(await frame.locator('#invitation').innerText(), '');
    const waiting = await friendTool('kingdown_create',{kind:'friend',colour:'white',options});
    const invitation = await friendTool('kingdown_invite',{game_id:waiting._meta.view.game_id});
    assert(!invitation.isError);
    await page.evaluate(() => { window.harnessDropWidgetWrites = true; });
    // The board's Join takes the short code too, in lower case with a dash.
    const otherCode = invitation.structuredContent.code;
    const board_id = await page.evaluate(() => window.harnessWidgetState.privateContent.board_id);
    const joinResult = await (await page.request.post(new URL('/fixture-tool',base).href,{data:{name:'kingdown_join',arguments:{code:`${otherCode.slice(0,3).toLowerCase()}-${otherCode.slice(3)}`,board_id}}})).json();
    assert(!joinResult.isError); await page.evaluate(result=>window.harnessShow(result),joinResult);
    await frame.locator('#strip-me .player-name small').filter({ hasText: 'Black' }).waitFor({ timeout: 5000 });
    const joinedView = await page.evaluate(() => window.harnessView);
    const readsBeforeJoinRemount = await page.evaluate(() => window.harnessCalls.filter(call => call.name === 'kingdown_get').length);

    await remountFrame();
    await page.waitForFunction(count => window.harnessCalls.filter(call => call.name === 'kingdown_get').length > count, readsBeforeJoinRemount);
    await frame.locator('#strip-me .player-name small').filter({ hasText: 'Black' }).waitFor({ timeout: 5000 });
    assert.equal(await page.evaluate(() => window.harnessMatchId), joinedView.game_id, 'Remount must keep the joined game instead of the original solo game');
    await page.evaluate(() => { window.harnessDropWidgetWrites = false; });
    await openPlay();
    await openPlay(); await legacyStart('solo'); await idleBoard();
  }
  const routeBase = await page.evaluate(() => window.harnessView), routeBoard = await page.evaluate(() => window.harnessWidgetState.privateContent.board_id);
  const routeCases = [['waiting','friend',undefined,'friend'], ['waiting','random',undefined,'wait'], ['setup','friend',{},'seat'], ['setup','solo',undefined,'board'], ['playing','solo',undefined,'board'], ['finished','friend',undefined,'end'], ['aborted','random',undefined,'end']];
  for (const [status, kind, options, screen] of routeCases) {
    const reads = await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_get').length);
    await page.evaluate(({base, board_id, status, kind, options}) => {
      window.harnessNextView = { ...base, status, kind, options };
      return window.harnessShow({ content: [], structuredContent: {game_id:base.game_id}, _meta: {board_id,view:base} }, true);
    }, { base: routeBase, board_id: routeBoard, status, kind, options });
    await page.waitForFunction(n => window.harnessCalls.filter(c => c.name === 'kingdown_get').length > n, reads);
    await frame.locator(`[data-screen="${screen}"]:not([hidden])`).waitFor();
    await widget().waitForFunction(() => document.querySelector('#reload').disabled === false);
  }
  const routes = ['home','play','friend','join','wait','lobby','seat','board','end','profile','collection','settings','handle'];
  assert.deepEqual(await frame.locator('[data-screen]').evaluateAll(els => els.map(el => el.dataset.screen).sort()), [...routes].sort());
  for (const [width,height] of [[390,844],[400,900],[1440,900]]) {
    await page.setViewportSize({width,height});
    for (const screen of routes) {
      const settingsReads = await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_settings').length);
      const route = routeCases.find(route => route[3] === screen);
      await page.evaluate(({screen,base,route}) => {
        // A saved game screen follows the fresh status, so its viewport sample needs a matching game.
        window.harnessNextView = route ? { ...base, status: route[0], kind: route[1], options: route[2], ...(screen === 'end' ? { result: { winner: 0, reason: 'resign' } } : {}) } : undefined;
        window.harnessWidgetState = { modelContent: {}, privateContent: { screen, sheet: undefined, board_id: window.harnessWidgetState.privateContent.board_id, pending: undefined } };
      }, {screen,base:routeBase,route});
      await remount(screen); await fits(screen,width);
      assert.deepEqual(await page.evaluate(() => window.harnessCalls.findLast(c => c.name === 'kingdown_get').arguments), { board_id: routeBoard }, 'A mount reads with the board ID alone');
      assert.equal(await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_settings').length), settingsReads + 1, 'Each mount reads server settings and me');
      assert.deepEqual(await page.evaluate(() => Object.keys(window.harnessWidgetState.privateContent).sort()), ['board_id','pending','screen','sheet']);
      assert.deepEqual(await page.evaluate(() => window.harnessWidgetState.modelContent), {});
    }
  }
  await page.setViewportSize({width:1000,height:1000}); await legacyStart('solo'); await boardBox();
  const other = await (await page.request.post(new URL('/fixture-tool',base).href,{data:{name:'kingdown_create',arguments:{kind:'solo',options,colour:'white'}}})).json(); assert(!other.isError);
  const backgroundBefore = await frame.locator('#status').innerText(), binding = await page.evaluate(() => window.harnessWidgetState.privateContent.board_id);
  const afterBinding = await frame.locator('html').evaluate(async (_, game_id) => {
    const { createClient } = await import('/src/plugin/client.ts');
    // The host page's harnessTool, through the harness postMessage hook (tools/plugin-ui-host.ts).
    const callServerTool = params => new Promise((resolve, reject) => {
      const id = Math.random(); addEventListener('message', function reply(event) { if (event.source !== parent || event.data?.harness !== 'tool' || event.data.id !== id) return; removeEventListener('message', reply); if (event.data.error) reject(new Error(event.data.error)); else resolve(event.data.result); });
      parent.postMessage({ harness: 'tool', id, params }, '*');
    });
    const client = createClient({ callServerTool }, window.openai);
    await client.call('kingdown_get', { game_id, board_id: 'discard' }, { background: true }); return client.state.board_id;
  }, other._meta.view.game_id);
  assert.equal(afterBinding, binding);
  assert.deepEqual(await page.evaluate(() => window.harnessCalls.at(-1).arguments), { game_id: other._meta.view.game_id }, 'A background read sends no board ID');
  assert.equal(await frame.locator('#status').innerText(), backgroundBefore, 'The background read leaves the board view alone');
  if (capabilities.friend) {
    const friend = await friendTool('kingdown_create', { kind: 'friend', options, colour: 'white' });
    const invite = await friendTool('kingdown_invite', { game_id: friend._meta.view.game_id });
    const preview = await tool('kingdown_open', { code: invite.structuredContent.code });
    assert(!preview.isError && preview._meta.preview);
    let reads = await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_get').length);
    await page.evaluate(result => window.harnessShow(result), preview);
    await frame.locator('[data-screen="join"]:not([hidden])').waitFor();
    assert.equal(await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_get').length), reads, 'A chat join preview reads no board');
    assert(!await page.evaluate(code => JSON.stringify(window.harnessWidgetState).includes(code), invite.structuredContent.code), 'The preview code stays out of widget state');
    await remountFrame();
    await page.waitForFunction(n => window.harnessCalls.filter(c => c.name === 'kingdown_get').length > n, reads);
    await frame.locator('[data-screen="join"]:not([hidden])').waitFor();
    const own = await tool('kingdown_create', { kind: 'friend', options, colour: 'white' });
    const ownInvite = await tool('kingdown_invite', { game_id: own._meta.view.game_id });
    for (const code of ['bad?', ownInvite.structuredContent.code]) {
      const error = await tool('kingdown_open', { code });
      assert(error.isError && !error._meta?.board_id && !error._meta?.preview);
      for (const remount of [false, true]) {
        const opens = await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_open').length);
        const oldBoard = await page.evaluate(() => window.harnessWidgetState.privateContent.board_id);
        reads = await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_get').length);
        if (remount) await remountFrame(); else await page.evaluate(result => window.harnessShow(result, true), error);
        await page.waitForFunction(n => window.harnessCalls.filter(c => c.name === 'kingdown_open').length > n, opens);
        await frame.locator('[data-screen="join"]:not([hidden])').waitFor();
        await page.waitForFunction(old => !!window.harnessWidgetState.privateContent.board_id && window.harnessWidgetState.privateContent.board_id !== old, oldBoard);
        assert.deepEqual(await page.evaluate(() => window.harnessCalls.findLast(c => c.name === 'kingdown_open').arguments), {}, 'A failed chat mount gets a board through empty Open');
        assert.equal(await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_get').length), reads, 'A failed code mount reads no board');
      }
    }
    const waitingRow = frame.locator(`#games-list [data-game-id="${own._meta.view.game_id}"]`);
    assert.equal(await waitingRow.locator('.row-title').textContent(), 'Waiting for a friend');
    assert.match(await waitingRow.locator('.line').textContent(), /Just opened/);
    assert.equal(await waitingRow.locator('.row-ico use[href="#i-clock"]').count(), 1);
    const home = await tool('kingdown_open');
    reads = await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_get').length);
    await page.evaluate(result => window.harnessShow(result), home);
    await frame.locator('#home-card').waitFor();
    assert.equal(await frame.locator('#home-line').isHidden(), home.structuredContent.your_turn_count === 0);
    if (home.structuredContent.your_turn_count) assert.equal(await frame.locator('#home-line').innerText(), `Your move in ${home.structuredContent.your_turn_count} game${home.structuredContent.your_turn_count === 1 ? '' : 's'}.`);
    assert.equal(await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_get').length), reads, 'Empty Open shows home with no board read');
    await legacyStart('solo');
  }
  if (capabilities.friend) {
    const open = await tool('kingdown_find',{options,colour:'white'}); assert(!open.isError);
    const lobby = await friendTool('kingdown_lobby'); assert(lobby._meta.lobby.games.some(g=>g.game_id===open._meta.view.game_id));
    const accepted = await friendTool('kingdown_accept',{game_id:open._meta.view.game_id}); assert(!accepted.isError);
    const shown = await tool('kingdown_open',{game_id:open._meta.view.game_id}); await page.evaluate(r=>window.harnessShow(r),shown);
    await frame.locator('#status').filter({hasText:'Your move'}).waitFor(); await idleBoard();
    const resign = await tool('kingdown_resign',{game_id:open._meta.view.game_id}); assert(!resign.isError);
    const offer = await tool('kingdown_rematch',{game_id:open._meta.view.game_id,command_id:'rematch-offer',expected_revision:resign._meta.view.revision,choice:'offer'}); assert(!offer.isError);
    const rematch = await friendTool('kingdown_rematch',{game_id:open._meta.view.game_id,command_id:'rematch-accept',expected_revision:offer._meta.view.revision,choice:'accept'}); assert(!rematch.isError);
    assert.equal((await tool('kingdown_get',{board_id:shown._meta.board_id}))._meta.view.game_id,open._meta.view.game_id);
    const resumed = await tool('kingdown_resume',{board_id:shown._meta.board_id,game_id:rematch._meta.view.rematch_game_id}); assert(!resumed.isError); await page.evaluate(r=>window.harnessShow(r),resumed);
    await frame.locator('#strip-me .player-name small').filter({hasText:'Black'}).waitFor(); await idleBoard();
    assert.equal(await page.evaluate(()=>window.harnessView.game_id),rematch._meta.view.rematch_game_id);
    await legacyStart('solo');
  }
  for (const viewport of [{width:390,height:844},{width:1440,height:900},{width:400,height:900}]) {
    await page.setViewportSize(viewport); await frame.locator('#status').evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    assert.equal(await frame.locator('body').evaluate(el=>el.scrollWidth>window.innerWidth),false);
    const reserve=viewport.width<900?96:128;
    const lower = await frame.locator('#table-bar').evaluate(el=>el.getBoundingClientRect().bottom);
    const pane=await page.locator('iframe').boundingBox(); assert(pane);
    assert(pane.y+lower<=viewport.height-reserve,`The page controls clear the composer at ${viewport.width}×${viewport.height}`);
    assert(pane.y+Math.min(lower,pane.height)<=viewport.height-reserve,'Visible controls stay inside the app pane');
  }
  // The approved table states use public views and the host's existing reply override.
  // These sample games are not in the service; a background poll must not replace them.
  await frame.locator('html').evaluate(()=>Object.defineProperty(document,'hidden',{configurable:true,value:true}));
  await settled();
  // R1: use the board's public view, as the table samples below do.
  {
    const original = await page.evaluate(() => window.harnessView);
    const initial_fen = 'rmnqkgbs/pppppppp/8/8/8/8/PPPPPPPP/RMNQKGBS w - - 0 1';
    setRules({});
    const rules = structuredClone(RULES);
    const snapshot = { ...original, game_id: randomUUID(), revision: 0, kind: 'solo', level: 'beginner', status: 'playing', action: 'ready', seat: 0, turn: 0, fen: initial_fen, rules, in_check: false, result: undefined, outcome: undefined, draw_offer: null, deadline_at: null, last_commands: [], history: { initial_fen, actions: [] } };
    async function showLesson(value) {
      await page.evaluate(value => { window.harnessNextView = value; return window.harnessShow({ content: [], structuredContent: { game_id: value.game_id, screen: 'board' }, _meta: { board_id: window.harnessWidgetState.privateContent.board_id, view: value } }); }, value);
      await frame.locator('#status').filter({ hasText: value.in_check ? 'Check!' : 'Your move.' }).waitFor();
      await idleBoard(); await boardBox();
    }
    await showLesson(snapshot);
    assert.equal(await frame.locator('#context-note').innerText(), 'New pieces in this game. Select any piece to read its rule.', 'R1: White keeps the first-turn note');
    let position = fromFen(initial_fen);
    const actions = [];
    function advance(lan) {
      const step = applyLan(position, lan, rules); assert(step, `R1: ${lan} is legal`);
      position = step.pos; actions.push(lan);
      return { ...snapshot, seat: 1, turn: position.turn, revision: actions.length, fen: toFen(position), legal: legalMoves(position).map(m => toLan(position, m)), history: { initial_fen, actions: [...actions] } };
    }
    const first = advance('Mb1<>a1');
    await showLesson({ ...first, game_id: randomUUID() });
    assert.equal(await frame.locator('#context-note').innerText(), 'Their maester swapped places with one of their pieces.', 'R1: Black sees the first enemy swap before the general note');
    const game_id = await page.evaluate(() => window.harnessView.game_id);
    advance('a7-a6');
    const later = advance('Ma1<>b1');
    await showLesson({ ...later, game_id });
    assert.equal(await frame.locator('#context-note').innerText(), '', 'R1: a later swap does not repeat a shown lesson');
    const hiddenGame = randomUUID();
    await showLesson({ ...first, game_id: hiddenGame, in_check: true });
    assert.notEqual(await frame.locator('#context-note').innerText(), 'Their maester swapped places with one of their pieces.', 'R1: check has priority over the lesson');
    await showLesson({ ...later, game_id: hiddenGame });
    assert.equal(await frame.locator('#context-note').innerText(), 'Their maester swapped places with one of their pieces.', 'R1: a hidden lesson stays available for a later swap');
    console.log('R1: White first note, Black first enemy lesson, later swap and hidden lesson pass.');
  }
  const look = join(tmpdir(),'kingdown-look','15'); await mkdir(look,{recursive:true});
  const sharp = (await import('sharp')).default;
  const sampleHand=['Vault','Leap','Salvation','Curse'], sampleRules={kings:[{king:'Mud',power:'March'},{king:'Shadow',power:'Darkness'}],hands:[sampleHand,sampleHand],marchUses:0};
  const mid='r2gk1a1/pp1m1ppp/2p1ps2/4P3/2L5/2N2O2/PP3PPP/R2GK1A1 b - - 0 13';
  const sampleStates=[
    {name:'board',fen:mid,play:['e6-d5'],select:[2,2]},
    {name:'board-rails',fen:mid.replace('2N2O2','2NQ1O2'),play:['e6-d5'],select:[3,2]},
    {name:'board-check',fen:'r2gk1a1/pp1m1ppp/2p2s2/3pP3/2L2n2/2N2O2/PP3PPP/R2GK1A1 b - - 0 14',play:['Nf4-d3'],threats:true},
    {name:'board-abort',fen:'rnbgkmal/pppppppp/8/8/8/8/PPPPPPPP/RNBGKMAL w - - 0 1',play:[],abort:true,used:[0,0]},
    {name:'board-claim',fen:mid,play:['e6-d5','Nc3xd5'],claim:true},
    {name:'board-symbols',fen:'r2gk1a1/pp1m1ppp/2p2s2/3pP2n/2L5/2N2O2/PP3PPP/R2GK1A1 b - - 0 14',play:['Nh5-f4'],symbols:true,threats:true},
    {name:'end',fen:'6k1/5ppp/8/8/3O4/8/5PPP/R5K1 w - - 0 31',play:['Ra1-a8'],used:[3,9],end:true},
  ];
  for (const state of sampleStates) {
    await openScreen('settings'); await boardSetting('symbols-only',!!state.symbols); await boardSetting('show-threats',!!state.threats);
    const original=await page.evaluate(()=>window.harnessView), game_id=randomUUID();
    const snapshot={...original,game_id,revision:100,status:'playing',kind:'friend',speed:'daily',days_per_move:3,seat:0,abort_open:!!state.abort,result:undefined,outcome:undefined,draw_offer:null,rematch_offer:null,rematch_game_id:null,rules:sampleRules,kings:sampleRules.kings,hands:sampleRules.hands,opponent:{handle:'mira_k',computer:false,deleted:false,rating:{rating:1540,provisional:false},last_seen_ms:121000},last_commands:[],deadline_at:null,server_now:new Date().toISOString()};
    setRules(sampleRules); let position={...fromFen(state.fen),used:state.used??[3,1]};
    const initial_fen = toFen(position);
    async function showSnapshot(value, words=`Move ${positionMoveNumber(fromFen(value.fen))}.`) {
      await page.evaluate(value=>{window.harnessNextView=value; return window.harnessShow({content:[],structuredContent:{game_id:value.game_id,screen:'board'},_meta:{board_id:window.harnessWidgetState.privateContent.board_id,view:value}});},value);
      await page.waitForFunction(value=>window.harnessView.game_id===value.game_id&&window.harnessView.fen===value.fen,value);
      await frame.locator('#last-move').filter({hasText:words}).waitFor();
      await idleBoard(); await boardBox();
    }
    const legal=()=>position.turn===0?legalMoves(position).map(m=>toLan(position,m)):[];
    await showSnapshot({...snapshot,fen:initial_fen,turn:position.turn,in_check:inCheck(position),legal:legal()});
    const commands=[]; let story=`Move ${positionMoveNumber(position)}.`;
    for (const [index,lan] of state.play.entries()) {const step=applyLan(position,lan,sampleRules); assert(step,`${state.name}: the sample move is legal`); commands.push({seq:101+index,seat:position.turn,at:snapshot.server_now,action:{type:'turn',actions:[lan]}}); position=step.pos; story=step.words;}
    const finished=state.end?{status:'finished',result:{winner:0,reason:'checkmate'},outcome:{rating_before:1500,rating:1561,provisional:true,badges:[{badge:'fairy_tale',earned_at:snapshot.server_now}]}}:{};
    await showSnapshot({...snapshot,...finished,revision:100+commands.length,fen:toFen(position),turn:position.turn,in_check:inCheck(position),legal:state.end?[]:legal(),last_commands:commands,deadline_at:state.claim?new Date(Date.now()-60000).toISOString():null},story);
    if (state.select) {await clickSquare(...state.select); await page.clock.runFor(POP_MS+14*RIPPLE_MS+50);}
    if (state.claim) assert.equal(await frame.locator('#status').innerText(),'mira_k has not moved for 3 days.');
    if (state.end) {
      const viewport = page.viewportSize();
      for (const [width, height] of [[360, 640], [400, 800]]) {
        await page.setViewportSize({ width, height });
        const before = { ...snapshot, game_id: randomUUID(), fen: initial_fen, turn: fromFen(initial_fen).turn, legal: legalMoves(fromFen(initial_fen)).map(move => toLan(fromFen(initial_fen), move)) };
        await showSnapshot(before); await boardBox();
        await showSnapshot({ ...before, ...finished, revision: 101, fen: toFen(position), turn: position.turn, in_check: true, legal: [], last_commands: commands }, story);
        await frame.locator('#over.end-card[open]').waitFor();
        await frame.locator('#board[data-toppling]').waitFor({ state: 'attached' });
        const sampling = frame.locator('html').evaluate(() => new Promise(resolve => {
          const report = { samples: 0, wordSamples: 0, scaledSamples: 0, overflow: [], whole: true };
          function sample() {
            const doc = document.documentElement, board = document.getElementById('board'), words = board.querySelector('.kd-words:not([hidden])');
            report.samples++;
            if (doc.scrollWidth > doc.clientWidth) report.overflow.push([doc.scrollWidth, doc.clientWidth]);
            if (words) {
              report.wordSamples++;
              if (getComputedStyle(words).transform !== 'none') report.scaledSamples++;
              const range = document.createRange(); range.selectNodeContents(words);
              const text = range.getBoundingClientRect(), clip = board.getBoundingClientRect();
              report.whole &&= words.textContent === 'King Down' && text.left >= clip.left && text.right <= clip.right;
            }
            if (board.hasAttribute('data-toppling')) requestAnimationFrame(sample); else resolve(report);
          }
          sample();
        }));
        // Keep the 400 px regression: restart the real entrance while its words exist.
        if (width === 400) await frame.locator('#board .kd-words:not([hidden])').evaluate(word => {
          word.classList.remove('is-in'); void word.getBoundingClientRect(); word.classList.add('is-in');
        });
        await page.clock.runFor(1200);
        const report = await sampling;
        console.log(`M2 win width at ${width} x ${height}: ${JSON.stringify(report)}`);
        assert(report.samples > 1 && report.wordSamples > 0 && report.scaledSamples > 0, 'M2 samples the live win text while it scales');
        assert.deepEqual(report.overflow, [], `The page never scrolls sideways during the win at ${width} x ${height}`);
        assert(report.whole, 'Clipping keeps the full King Down text');
        // The result card opens while the win words still scale outside the board.
        await frame.locator('#board[data-toppling]').waitFor({ state: 'detached' });
        assert.equal(await frame.locator('#board .kd-words').count(), 0, 'End layout starts after the win sequence');
      }
      await page.setViewportSize(viewport);
    }
    // Ticket 28 T1 and T2 at 200% zoom.
    const zoomName={board:'board-turn','board-abort':'board-cards'}[state.name];
    if (zoomName) await zoomBoardFits(zoomName);
    if (state.end) for (const height of [426, 800]) await zoomEndFits('end-win', height);
    if (state.name === 'board-abort') {
      const viewport = page.viewportSize();
      const screen = frame.locator('[data-screen="board"]');
      const noSidewaysScroll = async () => {
        const readBounds = () => screen.evaluate(el => ({width:el.clientWidth,scrollWidth:el.scrollWidth,left:el.scrollLeft}));
        let bounds = await readBounds();
        if (bounds.scrollWidth > bounds.width || bounds.left !== 0) {
          // PaintedView sizes the canvas from a ResizeObserver, one frame behind the viewport and inset change, so the
          // first read can see the old canvas (344 px in a 197 px screen). Read again after two frames; a real overflow stays.
          await screen.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
          bounds = await readBounds();
        }
        assert(bounds.scrollWidth <= bounds.width && bounds.left === 0, `The board screen has no sideways overflow or scroll: ${JSON.stringify(bounds)}`);
      };
      for (const [width,height,top,bottom] of [[197,426,51,59],[250,542,0,0],[262,568,68,79],[280,606,0,0],[287,621,0,0],[319,691,0,0]]) {
        await zoomViewport(width,height,top,bottom);
        await screen.evaluate(el => { el.scrollLeft = 0; });
        await noSidewaysScroll();
        for (const side of ['me','them']) {
          const coins = frame.locator(`#strip-${side} .coin`);
          assert.equal(await coins.count(),5, 'Both strips have a power coin and four cards');
          for (const coin of await coins.all()) {
            await scrollVertically(coin);
            const bounds = await coin.evaluate(controlBounds);
            assert(bounds.accessible && bounds.rect[2] >= 44 && bounds.rect[3] >= 44, `At ${width} px each ${side} coin fits with a 44 px target: ${JSON.stringify(bounds)}`);
            await noSidewaysScroll();
          }
          const last = frame.locator(`#strip-${side} .card-coin`).last();
          await shot(page,`zoom-coins-${width}-${side}-${mode}`);
          await tapCentre(last);
          await frame.locator('#board-sheet[open] h2').filter({hasText:'Curse'}).waitFor();
          await noSidewaysScroll();
          await shot(page,`zoom-last-card-${width}-${side}-${mode}`);
          await tapCentre(frame.locator('#board-sheet [aria-label="Close"]'));
        }
      }
      for (const [width,height,top,bottom] of [[240,640,0,0],[240,800,20,20],[197,760,0,0],[314,681,0,0],[314,681,82,94],[280,653,0,0]]) {
        await zoomViewport(width,height,top,bottom);
        // The table bar has Menu only (Resign is in Menu).
        for (const [id,title] of [['board-menu','Menu']]) {
          await tapCentre(frame.locator(`#${id}`));
          await frame.locator('#board-sheet[open] h2').filter({hasText:title}).waitFor();
          await noSidewaysScroll();
          await tapCentre(frame.locator('#board-sheet [aria-label="Close"]'));
        }
      }
      await zoomViewport(viewport.width,viewport.height,0,0);
    }
    for (const [width,height] of [[390,844],[400,900],[1440,900],[360,844]]) {
      await page.setViewportSize({width,height}); await boardBox();
      await frame.locator('#game-table img,#over.end-card img').evaluateAll(images=>Promise.all(images.map(img=>img.decode())));
      const bounds=await frame.locator('#game-table').evaluate(el=>{const r=el.getBoundingClientRect(),box=b=>({left:b.left,right:b.right,top:b.top,bottom:b.bottom,width:b.width});return {overflow:el.scrollWidth>el.clientWidth+1,scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,el:box(r),frame:box(document.querySelector('#app-frame').getBoundingClientRect()),left:r.left,right:r.right,width:innerWidth,body:document.body.scrollWidth>innerWidth,bodyScroll:document.body.scrollWidth,outside:[...el.querySelectorAll('*')].filter(child=>child.getClientRects().length).map(child=>({id:child.id,tag:child.tagName,class:typeof child.className==='string'?child.className:'',...box(child.getBoundingClientRect())})).filter(child=>child.right>r.right+1||child.left<r.left-1).slice(0,16)};});
      assert(!bounds.overflow&&!bounds.body&&bounds.left>=-1&&bounds.right<=bounds.width+1,layoutMessage(state.name,width,bounds.el,bounds.frame,`window width ${bounds.width}, table scroll ${bounds.scrollWidth}/${bounds.clientWidth}, body scroll ${bounds.bodyScroll}; outside ${JSON.stringify(bounds.outside)}`));
      const ids=state.end?['#over','#context-line']:['#table-bar','#context-line'];
      for(const id of ids) { const box=await frame.locator(id).evaluate(el=>{const r=el.getBoundingClientRect(),frame=document.querySelector('#app-frame').getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,frameBottom:frame.bottom,width:innerWidth,el:{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width},frame:{left:frame.left,right:frame.right,top:frame.top,bottom:frame.bottom,width:frame.width}};}); assert(box.top>=0&&box.bottom<=box.frameBottom+1&&box.left>=-1&&box.right<=box.width+1,`${state.name} ${id} stays inside the frame at ${width}px: ${boxText('element',box.el)}; ${boxText('frame',box.frame)}; window width ${box.width}`); }
      const shotPath=await shot(page,`ticket15-${state.name}-${width}-${mode}`);
      if (width===390||width===1440) {
        const size=width===390?'phone':'desktop', actual=await readFile(shotPath), golden=await readFile(`docs/specs/chatgpt-mvp/sample/png/${state.name}-${size}.png`);
        const left=await sharp(golden).resize(width,height).toBuffer();
        await sharp({create:{width:width*2,height,channels:3,background:'#fff'}}).composite([{input:left,left:0,top:0},{input:actual,left:width,top:0}]).png().toFile(join(look,`${state.name}-${size}-${mode}.png`));
      }
    }
    // Ticket 28 T2: the other player's turn has its own game id, since the board ignores a second view at one revision.
    // A new game needs its matching full history to restore the last move.
    if (state.claim) {
      const theirTurn = {...snapshot,game_id:randomUUID(),revision:100+commands.length,fen:toFen(position),turn:position.turn,in_check:inCheck(position),legal:[],last_commands:commands,history:{initial_fen,actions:state.play},deadline_at:null};
      assert.equal(replayHistory(theirTurn,sampleRules)?.at(-1)?.words,story,'The sample history keeps its spent-power counts and restores the last move');
      await showSnapshot(theirTurn,story); await zoomBoardFits('board-their-turn');
      // T6: match the tall-phone capture: full host height, no cards or powers, and the other player's turn.
      const tallRules = {kings:[null,null],hands:[[],[]]}, tallStart = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1';
      setRules(tallRules);
      let tallPosition = fromFen(tallStart);
      const tallActions = [], tallWords = [];
      for (const [from,to] of [[12,28],[52,36],[6,21],[57,42],[5,26],[62,45],[11,19],[51,43]]) {
        const move = legalMoves(tallPosition).find(move => move.from === from && move.to === to && !move.power);
        assert(move, 'The tall-phone sample uses legal moves');
        const lan = toLan(tallPosition,move), step = applyLan(tallPosition,lan,tallRules);
        tallActions.push(lan); tallWords.push(step.words); tallPosition = step.pos;
      }
      const tallView = {...theirTurn,game_id:randomUUID(),revision:0,fen:toFen(tallPosition),turn:tallPosition.turn,seat:1,last_commands:[],history:{initial_fen:tallStart,actions:tallActions},options,rules:tallRules,kings:[null,null],hands:[[],[]]};
      await showSnapshot(tallView,tallWords.at(-1));
      const viewport = page.viewportSize();
      const hostStyle = await page.locator('iframe').getAttribute('style');
      await page.locator('iframe').evaluate(el => el.style.setProperty('height','100dvh','important'));
      await zoomViewport(393,852,0,0); await boardBox();
      const boxes = await zoomBoxes(['#board','#board canvas','#strip-them','#strip-me','#context-line','#moves-line','#recent-moves','#table-bar']);
      console.log(`T6/T7 tall-phone boxes: ${JSON.stringify(boxes)}`);
      const expected = {
        frame:[0,0,393,756], '#board':[4,44,385,411], '#board canvas':[4,44,385,411],
        '#strip-them':[0,0,393,44], '#strip-me':[0,455,393,44], '#context-line':[12,499,369,44],
        '#moves-line':[12,543,369,44], '#recent-moves':[12,587,369,108], '#table-bar':[0,708,393,48],
      };
      for (const [id,box] of Object.entries(expected)) assert(boxes[id]?.every((value,i) => Math.abs(value-box[i]) <= 1),
        `At 393 x 852 ${id} keeps its measured box (1 px rounding): ${JSON.stringify(boxes)}`);
      const movesControl = frame.locator('#moves-line'), recentMoves = frame.locator('#recent-moves');
      await frame.locator('#moves-line[aria-expanded="true"]').waitFor();
      assert.match(await movesControl.innerText(), /Moves/, 'The Moves control keeps its name');
      assert.equal(await movesControl.getAttribute('aria-controls'), 'recent-moves', 'Moves names the list it controls');
      assert(await movesControl.evaluate(el => !!(el.compareDocumentPosition(document.getElementById('recent-moves')) & Node.DOCUMENT_POSITION_FOLLOWING)), 'The recent list follows its control in source order');
      assert.equal(await recentMoves.locator('p').count(), tallActions.length, 'The list contains the game history');
      assert((await recentMoves.locator('p').last().innerText()).endsWith(tallWords.at(-1)), 'The list ends with the last move');
      const lastVisible = await recentMoves.evaluate(el => {
        const list = el.getBoundingClientRect(), last = el.lastElementChild.getBoundingClientRect();
        return last.top >= list.top && last.bottom <= list.bottom + 1 && el.scrollTop > 0;
      });
      assert(lastVisible, 'The open list scrolls to the last move');
      const noPageScroll = await frame.locator('#app-frame').evaluate(el => [document.documentElement,document.body,el,document.querySelector('[data-screen="board"]')].every(node => node.scrollHeight <= node.clientHeight + 1));
      assert(noPageScroll, 'The open list adds no page scroll');
      assert.equal(boxes['#table-bar'][1] + boxes['#table-bar'][3], boxes.frame[1] + boxes.frame[3], 'The bar stays at the bottom');
      await shot(page,`tall-board-their-turn-393-${mode}`);
      for (const [width,height] of [[320,568],[197,426],[393,740]]) {
        await zoomViewport(width,height,0,0);
        await frame.locator('#moves-line[aria-expanded="false"]').waitFor({state:'attached'});
        assert(await recentMoves.isHidden(), `The list stays closed at ${width} x ${height}`);
      }
      await zoomViewport(393,852,0,0);
      await frame.locator('#moves-line[aria-expanded="true"]').waitFor();
      await tapCentre(movesControl);
      assert.equal(await movesControl.getAttribute('aria-expanded'), 'false', 'A tap closes Moves');
      assert(await recentMoves.isHidden(), 'A tap hides the list');
      await showSnapshot({...tallView,revision:1},tallWords.at(-1));
      await zoomViewport(320,568,0,0); await zoomViewport(393,852,0,0);
      await boardBox();
      assert.equal(await movesControl.getAttribute('aria-expanded'), 'false', 'The player close holds after a board update and resize');
      await tapCentre(movesControl);
      assert.equal(await movesControl.getAttribute('aria-expanded'), 'true', 'A tap opens Moves');
      assert(await recentMoves.isVisible(), 'A tap shows the list');
      await tapCentre(movesControl);
      await showSnapshot({...tallView,game_id:randomUUID()},tallWords.at(-1));
      await frame.locator('#moves-line[aria-expanded="true"]').waitFor();
      assert(await recentMoves.isVisible(), 'A new board view can open the list by itself');
      await page.locator('iframe').evaluate((el,style) => style === null ? el.removeAttribute('style') : el.setAttribute('style',style),hostStyle);
      await zoomViewport(viewport.width,viewport.height,0,0);
    }
  }
  // Ticket 05: a draw offer keeps its size when piece and card actions show.
  const drawRules = {...sampleRules, hands:[['Haste'],['Haste']]};
  setRules(drawRules);
  const drawStart = {...fromFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'),used:[0,0]};
  const drawHaste = legalMoves(drawStart).find(move => move.from===12 && move.to===28 && move.power==='haste');
  assert(drawHaste, 'The draw sample has a legal Haste move');
  const drawMid = applyLan(drawStart,toLan(drawStart,drawHaste),drawRules).pos;
  for (const [stage,position] of [['start',drawStart],['mid',drawMid]]) {
    const original=await page.evaluate(()=>window.harnessView), snapshot={...original,game_id:randomUUID(),revision:100,status:'playing',kind:'friend',seat:0,turn:0,action:'ready',fen:toFen(position),in_check:false,rules:drawRules,kings:drawRules.kings,hands:drawRules.hands,history:undefined,last_commands:[],legal:legalMoves(position).map(move=>toLan(position,move)),draw_offer:1,result:undefined,outcome:undefined,abort_open:false,deadline_at:null,server_now:new Date().toISOString()};
    await page.evaluate(value=>{window.harnessNextView=value; return window.harnessShow({content:[],structuredContent:{game_id:value.game_id,screen:'board'},_meta:{board_id:window.harnessWidgetState.privateContent.board_id,view:value}});},snapshot);
    await page.waitForFunction(id=>window.harnessView.game_id===id,snapshot.game_id); await idleBoard();
    for (const [width,height] of [[320,568],[360,640],[852,393]]) {
      await page.setViewportSize({width,height});
      await page.evaluate(portrait=>window.harnessSetContext({safeAreaInsets:{top:portrait?63:0,right:0,bottom:portrait?84:0,left:0}}),height>width);
      await frame.locator('#board').press('Escape');
      await frame.locator('#status').evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
      const before=await frame.locator('#board canvas').boundingBox(), row=await frame.locator('#context-line').boundingBox();
      for (let n=0;n<7;n++) {await frame.locator('#board').press('ArrowLeft'); await frame.locator('#board').press('ArrowDown');}
      for (let n=0;n<4;n++) await frame.locator('#board').press('ArrowRight');
      await frame.locator('#board').press('Enter');
      const king=await frame.locator('#board canvas').boundingBox(); assert(Math.abs(before.width-king.width)<1,'Selecting the king keeps the board size');
      for (let n=0;n<(stage==='start'?1:3);n++) await frame.locator('#board').press('ArrowUp');
      await frame.locator('#board').press('Enter');
      if(stage==='start') assert(await frame.locator('#context-actions').getByRole('button',{name:'Choose a move',exact:true}).count(),'The pawn offers an ordinary move and Haste');
      else {
        assert.equal(await frame.locator('#end-turn').getAttribute('aria-disabled'),'false','The Haste turn permits the press');
        assert.equal(await frame.locator('#context-actions').getByRole('button',{name:'Stop here',exact:true}).count(),0,'The turn button replaces Stop here');
        assert.equal(await frame.locator('#context-actions').getByRole('button',{name:'Choose a move',exact:true}).count(),0,'The turn button ends the mid-way turn');
      }
      const after=await frame.locator('#board canvas').boundingBox(), selectedRow=await frame.locator('#context-line').boundingBox();
      assert(Math.abs(before.width-after.width)<1 && Math.abs(row.height-selectedRow.height)<1,`The draw offer keeps the board and row size at ${width}×${height} (${stage})`);
      assert(await frame.locator('#context-actions').evaluate(el=>el.scrollWidth<=el.clientWidth+1),'Draw and piece actions have no horizontal overflow');
      // Q3 b: the board keeps its size, and the screen scrolls to the replies (short landscape and small phones).
      await frame.locator('#context-actions').scrollIntoViewIfNeeded();
      for (const action of await frame.locator('#context-actions button').all()) {const bounds=await action.evaluate(controlBounds); assert(bounds.accessible,`Draw and piece action fits at ${width}×${height} (${stage}): ${JSON.stringify(bounds)}`);}
      await shot(page,`ticket05-draw-${stage}-${width}-${mode}`);
      if(stage==='start') {
        await frame.locator('#card-w-0').click(); await frame.locator('#board-sheet').getByRole('button',{name:'Use',exact:true}).click();
        await frame.locator('#board').press('Enter');
        assert(await frame.locator('#context-actions').getByRole('button',{name:'Cancel',exact:true}).count(),'The armed card keeps Cancel beside draw replies');
        assert.equal(await frame.locator('#context-actions').getByRole('button',{name:'Choose a move',exact:true}).count(),0,'An armed card keeps its move list in Menu');
        const armed=await frame.locator('#board canvas').boundingBox(), armedRow=await frame.locator('#context-line').boundingBox(); assert(Math.abs(before.width-armed.width)<1 && (width>height || Math.abs(row.height-armedRow.height)<1),'Arming a card keeps the board size and the portrait row size');
        if(width>height) assert(await frame.locator('#context-text').evaluate(el=>getComputedStyle(el).maxHeight==='none' && getComputedStyle(el).overflowY==='visible' && el.scrollHeight<=el.clientHeight+1),'The full armed rule shows beside draw replies in landscape');
        assert(await frame.locator('#context-actions').evaluate(el=>el.scrollWidth<=el.clientWidth+1),'Cancel and draw replies have no horizontal overflow');
        // Q3 b: the screen scrolls to the replies.
        await frame.locator('#context-actions').scrollIntoViewIfNeeded();
        for (const action of await frame.locator('#context-actions button').all()) {const bounds=await action.evaluate(controlBounds); assert(bounds.accessible,`Cancel and draw reply fits: ${JSON.stringify(bounds)}`);}
        await shot(page,`ticket05-draw-armed-${width}-${mode}`);
      }
    }
  }
  await frame.locator('html').evaluate(()=>{delete document.hidden;});
  await page.evaluate(()=>window.harnessSetContext({safeAreaInsets:{top:0,right:0,bottom:0,left:0}}));
  await page.setViewportSize({width:1000,height:1000});
  // Ticket 26: check the approved words and preview on the built page at each required size.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const { cardText, ruleLine } = await import('../src/powers-ui.ts');
  for (const [width,height] of [[320,568],[393,852],[1280,800],[852,393]]) {
    await page.setViewportSize({width,height});
    await page.evaluate(width => window.harnessSetContext({displayMode:'fullscreen',safeAreaInsets:{top:width===320?63:width===393?102:0,bottom:width===320?84:width===393?118:0,left:0,right:0}}),width);
    const boardId = await page.evaluate(()=>window.harnessWidgetState.privateContent.board_id);
    const cards = await (await page.request.post(new URL('/fixture-tool',base).href,{data:{name:'kingdown_create',arguments:{kind:'solo',colour:'white',board_id:boardId,options:{...DEFAULT_OPTIONS,arrangement:false,kingPowers:false,cards:true,cardPool:['EarthQuake','SkyLift','MorphP','Freeze']}}}})).json();
    assert(!cards.isError); await page.evaluate(r=>window.harnessShow(r),cards); await idleBoard(); await boardBox();
    for (const [card,targets] of [['EarthQuake','Tap a marked square.'],['SkyLift','Choose a marked piece, then a marked square.']]) {
      const index = cards._meta.view.rules.hands[0].indexOf(card); assert(index>=0);
      const before = await frame.locator('#board canvas').boundingBox();
      await frame.locator(`#card-w-${index}`).click(); await frame.locator('#board-sheet').getByRole('button',{name:'Use',exact:true}).click();
      assert.equal(await frame.locator('#context-note').textContent(),`${targets} ${ruleLine(cardText(card,cards._meta.view.rules))}`);
      assert(await frame.locator('#context-text').evaluate((el,words)=>{
        const note=el.querySelector('#context-note'), range=document.createRange(); range.setStart(note.firstChild,0); range.setEnd(note.firstChild,words.length);
        const text=range.getBoundingClientRect(), row=el.getBoundingClientRect(); return text.bottom<=row.bottom+1 && text.right<=row.right+1;
      },targets.split(',')[0]),`${card}: the next action stays in view at ${width}px`);
      if(width>height) {
        assert(await frame.locator('#context-text').evaluate(el=>getComputedStyle(el).maxHeight==='none' && getComputedStyle(el).overflowY==='visible' && el.scrollHeight<=el.clientHeight+1),`${card}: the full rule shows at ${width}px`);
      } else {
        await frame.locator('#context-actions').getByRole('button',{name:'Cancel',exact:true}).focus(); await page.keyboard.press('Shift+Tab');
        assert(await frame.locator('#context-text').evaluate(el=>el===document.activeElement && el.tabIndex===0),'The keyboard reaches the armed text');
        await page.keyboard.press('End');
        await widget().waitForFunction(()=>document.getElementById('context-text').scrollTop>0);
        assert(await frame.locator('#context-text').evaluate(el=>el.scrollTop>0),'The keyboard scrolls the armed rule');
        await page.keyboard.press('Home');
      }
      const after = await frame.locator('#board canvas').boundingBox(); assert(Math.abs(before.width-after.width)<1,'G1 keeps the board size');
      await boardBox();
      await shot(page,`ticket26-targets-${card}-${width}-${mode}`);
      await frame.locator('#context-actions').getByRole('button',{name:'Cancel',exact:true}).click();
      assert.equal(await frame.locator('#context-text').getAttribute('tabindex'),'-1','Cancel removes the armed text tab stop');
    }
    for (const [action,fen,from,target,other] of [
      ['shove','k7/8/8/8/8/8/4P3/4O2K w - - 0 1',4,12,3],
      ['swap','7k/8/8/8/2RM4/8/8/K7 w - - 0 1',27,26,28],
    ]) {
      await seedBoard(`picks&fen=${encodeURIComponent(fen)}`);
      const calls = await page.evaluate(()=>window.harnessCalls.filter(c=>c.name==='kingdown_move').length);
      await clickSquare(from&7,from>>3); await clickSquare(target&7,target>>3);
      assert.equal(await frame.locator('#status').textContent(),`Tap again to ${action}.`);
      assert.equal(await frame.locator('#undo').getAttribute('aria-disabled'),'true','The first tap adds no draft step');
      // The status changes before the canvas paints its new marks.
      await boardBox();
      await shot(page,`ticket26-preview-${action}-${width}-${mode}`);
      await clickSquare(other&7,other>>3);
      assert.equal(await frame.locator('#status').textContent(),'Your move.','A tap elsewhere clears the preview');
      assert.equal(await frame.locator('#undo').getAttribute('aria-disabled'),'true','A tap elsewhere plays no move');
      const box=await boardBox(), point=sq=>({x:box.x+(32+((sq&7)+.5)*112)*box.width/960,y:box.y+(96+(7-(sq>>3)+.5)*112)*box.width/960}), a=point(from), b=point(target);
      await page.mouse.move(a.x,a.y); await page.mouse.down(); await page.mouse.move(b.x,b.y,{steps:8}); await page.mouse.up();
      assert.equal(await frame.locator('#status').textContent(),`Tap again to ${action}.`,'A drag shows the same preview');
      assert.equal(await frame.locator('#undo').getAttribute('aria-disabled'),'true','A drag adds no draft step');
      await clickSquare(target&7,target>>3); await boardBox();
      assert.equal(await frame.locator('#undo').getAttribute('aria-disabled'),'false','A second tap adds the draft step');
      assert.equal(await page.evaluate(()=>window.harnessCalls.filter(c=>c.name==='kingdown_move').length),calls,'The preview and draft send no move');
      await frame.locator('#undo').click(); assert.equal(await frame.locator('#undo').getAttribute('aria-disabled'),'true','One Undo removes the one draft step');
    }
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.evaluate(()=>window.harnessSetContext({safeAreaInsets:{top:0,right:0,bottom:0,left:0}}));
  await page.setViewportSize({width:1000,height:1000});
  console.log('PASS: G1 targets first; G3 tap, drag, cancel and one draft step at 320, 393, 852 and 1280 px');
  console.log(`Ticket 15 look comparisons: ${look}`);
  await openScreen('settings'); await boardSetting('symbols-only',false); await boardSetting('show-threats',false); await openPlay(); await legacyStart('solo');
  for (const [kind,features,status] of [['friend',options,'waiting'],['solo',{...options,arrangement:true},'setup']]) {
    const start = await legacyStart('solo');
    await frame.locator('#status').filter({hasText:'Your move'}).waitFor();
    await clickSquare(4,1); await page.evaluate(()=>{window.dropNextMoveReply=true;});
    await openMoveChoices(); await frame.locator('#choices button[title="e2-e4"]').click(); await sendTurn(); await frame.locator('#retry').waitFor();
    const switched = await tool('kingdown_create',{kind,options:features,colour:'white'});
    assert.equal(switched._meta.view.status,status); assert.equal(switched._meta.view.fen,'');
    await page.evaluate(result=>window.harnessShow(result),switched);
    await frame.locator('#retry').waitFor({state:'hidden'});
    // A view of another game never clears a game command: the old move stays for its own game, and the shown game
    // shows no Retry (design §5.3 and §6; B1 changed, finding 8). The old "clears the old command" rule is gone.
    const kept = await page.evaluate(()=>window.harnessWidgetState?.privateContent?.pending);
    assert.equal(kept?.name,'kingdown_move','An empty-FEN host switch keeps the old command for its own game');
    assert.notEqual(kept?.game_tag,switched._meta.view.game_id.slice(0,8),'The kept command belongs to the game it left, not the empty-FEN game on show');
  }
  await legacyStart('solo');
  await frame.locator('#status').filter({hasText:'Your move'}).waitFor();
  // A host notification can switch games independently of a pending submission.
  await clickSquare(4, 1);
  await page.evaluate(() => { window.dropNextMoveReply = true; });
  await openMoveChoices(); await frame.locator('#choices button[title="e2-e4"]').click(); await sendTurn(); await frame.locator('#retry').waitFor();
  // White, as the board's Solo button sends: with no colour the seat is random, and Black has no move before the computer.
  const switched = await (await page.request.post(new URL('/fixture-tool', base).href, { data: { name: 'kingdown_create', arguments: { kind: 'solo', options, colour: 'white' } } })).json();
  await page.evaluate(async result => { await window.harnessShow(result); }, switched);
  await frame.locator('#retry').waitFor({ state: 'hidden' });
  await frame.locator('#reload:not(:disabled)').waitFor({ state: 'attached' });
  await clickSquare(4, 1); assert(await frame.locator('#choices button').count() > 0);
  await page.evaluate(() => { window.harnessWidgetState = { modelContent: { game_id: window.harnessMatchId } }; });
  await remountFrame();
  await frame.locator('[data-screen="board"]:not([hidden])').waitFor({ timeout: 5000 });
  await frame.locator('#status').filter({ hasText: 'Your move' }).waitFor();
  await page.evaluate(() => { window.harnessWithoutWidgetState = true; window.harnessWidgetState = undefined; });
  await remountFrame();
  await page.waitForFunction(() => window.harnessWidgetState?.modelContent?.status === 'playing' && window.harnessWidgetState?.modelContent?.your_turn === true);
  await frame.locator('#status').filter({ hasText: 'Your move' }).waitFor();
  assert.deepEqual(await page.evaluate(() => window.harnessWidgetState.modelContent), {status:'playing',your_turn:true}, 'Hosts without widget state receive useful model context without an internal revision');
  if (mode === 'fixture') {
  await page.goto(new URL('/?terminal=1', base).href);
    await page.evaluate(() => window.harnessSetContext({ displayMode: 'fullscreen' }));
  await frame.locator('#status').filter({ hasText: 'Checkmate' }).waitFor();
  assert.equal(await frame.locator('#computer').isVisible(), false);
  assert.equal(await frame.locator('#choices button').count(), 0);
  }
  await page.evaluate(() => window.harnessTeardown());
  for (const state of await page.evaluate(() => window.harnessWidgetStates ?? [])) {
    const json = JSON.stringify(state).replace(/"board_id":"[0-9a-f-]+"/gi, '');
    assert(!/[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}/i.test(json), 'Each widget write has no full UUID except board_id');
    assert(!state.privateContent?.pending?.args?.code && !state.privateContent?.pending?.args?.handle, 'Pending state has no code or handle');
  }
  assert.deepEqual(await frame.locator('body').evaluate(() => window.harnessTableIdConflicts), [], 'The board hand-off keeps one set of table IDs');
  assertNoErrors();
  console.log(`Harness mode: ${mode}`);
  console.log(`PASS: chat join preview and code-error mounts, shared private games rows, home card, fullscreen request, Settings remount, 4 viewport widths, 14 route remounts, four widget fields, background reads, all piece SVGs and threat endpoints in both seats, safe areas, theme, touch, handle gate and 17 pictures, SDK AppBridge initialization, painted board move, iframe remount with identical FEN/revision, Haste ambiguity, lost-reply same-ID retry committed once, bounded computer turn, definitive rejection recovery, match switch recovery, ${capabilities.friend ? 'friend join/reply polling, ' : ''}no fullscreen control, 390px touch moves, no page errors${mode === 'fixture' ? ', terminal fixture' : ', real HTTP MCP and PostgreSQL'}`);
} catch (error) {
  console.error(error);
  console.error('Page check state:', await page.evaluate(() => ({ screen: window.harnessWidgetState?.privateContent?.screen, pending: window.harnessWidgetState?.privateContent?.pending?.name, view: window.harnessView && { status: window.harnessView.status, kind: window.harnessView.kind, speed: window.harnessView.speed, revision: window.harnessView.revision, turn: window.harnessView.turn, seat: window.harnessView.seat, opponent: window.harnessView.opponent, server_now: window.harnessView.server_now, commands: window.harnessView.last_commands.map(c => ({ seat: c.seat, at: c.at })) }, calls: (window.harnessCalls ?? []).slice(-6).map(c => c.name) })));
  if (page.mainFrame().childFrames().length) console.error('Board check state:', await page.frameLocator('iframe').locator('body').evaluate(() => ({ hidden: document.hidden, status: document.querySelector('#status').textContent, error: document.querySelector('#error').textContent, reloadDisabled: document.querySelector('#reload').disabled })));
  assertNoErrors(); throw error;
} finally { await browser.close(); unregister(); }
