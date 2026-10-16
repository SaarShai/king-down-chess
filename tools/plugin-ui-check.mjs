import { controlBounds } from './lib/plugin-control-bounds.mjs';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { register } from 'tsx/esm/api';
const unregister = register();
const { fromFen, toFen, toLan } = await import('../src/rules/setup.ts');
const { setRules, legalMoves, inCheck, typeOf, N, sqName, moveNumber: positionMoveNumber } = await import('../src/rules/engine.ts');
const { DEFAULT_OPTIONS } = await import('../src/match/setup.ts');
const { applyLan, cardCoins } = await import('../src/plugin/screens/board-model.ts');
const { threatsIn } = await import('../src/move-text.ts');
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
  // Ticket 13: install the clock before the page sets any timer.
  await page.clock.install();
  await page.addInitScript(() => {
    window.harnessTableIdConflicts = [];
    const tableIds = ['game-table','strip-me','strip-them','context-line','context-text','moves-line','last-move','table-bar'];
    new MutationObserver(() => {
      for (const id of tableIds) if (document.querySelectorAll(`#${id}`).length > 1 && !window.harnessTableIdConflicts.includes(id)) window.harnessTableIdConflicts.push(id);
    }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['id'] });
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
  const options = {fairy:true,pool:['R','A','G','Q','M','S','O'],arrangement:false,classic:false,cards:false,cardPool:[],kingPowers:false};

  async function boardBox() {
    await frame.locator('#board[aria-busy="false"]:not([data-animating="true"])').waitFor();
    await frame.locator('canvas').evaluate(c => new Promise((resolve, reject) => {
      const end = performance.now() + 10000; let last;
      const tick = () => {
        const rect = c.getBoundingClientRect(), key = [rect.x, rect.y, rect.width, rect.height].join(',');
        if (rect.width > 250 && key === last) resolve();
        else if (performance.now() > end) reject(new Error('The visible board did not settle'));
        else { last = key; requestAnimationFrame(tick); }
      }; requestAnimationFrame(tick);
    }));
    return frame.locator('canvas').boundingBox();
  }

  await frame.locator('#home-card').waitFor();
  assert.equal(await frame.locator('#app-head').count(), 0, 'The approved sample has no page title or tabs');
  assert.equal(await frame.locator('symbol').count(), 21, 'The page has the full game sprite');
  assert.equal(await frame.locator('#over').count(), 1, 'The frame has one shared overlay');
  assert.equal(await frame.locator('#i-back, #i-close, #i-plus, #i-mic').count(), 0, 'Host icons stay with the host');
  assert(await frame.locator('#home-play').isDisabled(), 'Play waits for the page and the host to connect');
  assert.equal(await frame.locator('#home-card button').count(), 2, 'The inline home card has only Play now and Choose a game');
  await frame.locator('#home-play:not(:disabled)').waitFor();
  assert.deepEqual(await page.evaluate(() => window.harnessDeclaredModes), ['inline', 'fullscreen'], 'App declares both display modes to the host');
  assert.equal(await frame.locator('.inline-line').innerText(), 'No games need your move.', 'Home uses the server turn count and the sample line');
  assert.equal(await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_get').length), 0, 'An empty home reads no board');
  await frame.locator('#home-games').click();
  await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
  assert.equal(await page.evaluate(() => window.harnessWidgetState.privateContent.screen), 'play', 'Home Choose a game opens the Play hall');
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
    for (let i = 0; i < 2 && !await frame.locator('[data-screen="play"]:not([hidden])').count(); i++) await frame.locator('#page-back:visible, .table-back:visible').click();
    await frame.locator('[data-screen="play"]:not([hidden])').waitFor({ timeout: 5000 });
  }
  async function openScreen(screen) { await openPlay(); await frame.locator(`[data-screen="play"] [data-nav="${screen}"]`).click(); }
  async function idleBoard() { await page.waitForFunction(() => document.querySelector('iframe').contentDocument.querySelector('#reload')?.disabled === false); }
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
    await page.locator('#remount').click();
    await page.waitForFunction(n => window.harnessCalls.filter(c => c.name === 'kingdown_get').length > n, reads);
    await page.waitForFunction(() => document.querySelector('iframe').contentDocument.querySelector('#reload').disabled === false);
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
        await page.waitForFunction(()=>document.querySelector('iframe').contentDocument.querySelectorAll('#profile-history li').length===23);
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
      const settingsReads=await page.evaluate(()=>window.harnessCalls.filter(c=>c.name==='kingdown_settings').length); await page.locator('#remount').click();
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
    const reads=await page.evaluate(()=>window.harnessCalls.filter(c=>c.name==='kingdown_profile').length); await page.locator('#remount').click();
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
    const baseSetup = { kind: 'solo', options: DEFAULT_OPTIONS, colour: 'white', level: 'club', king: null };
    async function setupMount(last_setup) {
      await setupTool('kingdown_settings', { last_setup });
      const reads = await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_settings').length);
      await page.evaluate(() => { window.harnessDropWidgetWrites=true; window.harnessWidgetState.privateContent.screen = 'play'; window.harnessWidgetState.privateContent.sheet = undefined; window.harnessWidgetState.privateContent.pending = undefined; });
      await page.locator('#remount').click();
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
      for (let i = 0; i < await controls.count(); i++) {
        const control = controls.nth(i); await control.scrollIntoViewIfNeeded();
        assert((await control.evaluate(controlBounds)).accessible, `${state} control fits ${width}px: ${await control.innerText()}`);
        const target = await control.boundingBox(); assert(target.width >= 44 && target.height >= 44, `${state} keeps a 44 px target at ${width}px: ${await control.innerText()} (${target.width} x ${target.height})`);
      }
      const footer = frame.locator(sheet ? '#setup-done' : '#setup-start');
      assert((await footer.evaluate(controlBounds)).accessible, `${state} footer stays above the composer`);
      await frame.locator(sheet ? '#menu-sheet .sheet-body' : '#new-game .new-game-body').evaluate(el => { el.scrollTop = 0; });
      await frame.locator('#new-game img, #menu-sheet img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
      await shot(page, `${state}-${width}-${mode}`);
      if (compare && (width === 390 || width === 1440)) {
        const size = width === 390 ? 'phone' : 'desktop', reference = await sharp(`docs/specs/chatgpt-mvp/sample/png/${state}-${size}.png`).resize(width, height).toBuffer();
        const actual = await page.screenshot();
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
    await setupTool('kingdown_abort', { game_id: await page.evaluate(() => window.harnessView.game_id) });
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
    assert.equal(await frame.locator('.card-grid input:checked:disabled').count(), 4, 'The last four cards lock');
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
    await page.setViewportSize({ width: 393, height: 852 });
    await frame.locator('#board[aria-busy="false"]:not([data-animating="true"])').waitFor();
    await page.waitForFunction(() => document.querySelector('iframe').contentDocument.querySelector('#game-table').getAnimations({ subtree: true }).every(animation => animation.playState === 'finished'));
    assert.equal(await frame.locator('#game-table .coin').count(), 10, 'Both strips show four cards and one power');
    assert(await frame.locator('#game-table .coin').evaluateAll(coins => coins.every(coin => {
      const style = getComputedStyle(coin), box = coin.getBoundingClientRect();
      return [style.borderTopLeftRadius, style.borderTopRightRadius, style.borderBottomLeftRadius, style.borderBottomRightRadius].every(radius => radius === '50%')
        && Math.abs(box.width - box.height) < .5 && box.width >= 44 && style.backgroundImage.includes('radial-gradient') && !style.backgroundImage.includes('stone-control');
    })), 'Card and power coins stay round with 44 px targets at 393 × 852');
    assert(await frame.locator('#board').evaluate(board => [board, board.parentElement].every(surface => !getComputedStyle(surface).backgroundImage.includes('stone-control'))), 'The board and its parent keep the stone control face off the board');
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
      assert(await desktopFrame.locator('#game-table .coin').evaluateAll(coins => coins.every(coin => {
        const style = getComputedStyle(coin), box = coin.getBoundingClientRect();
        return style.borderRadius === '50%' && Math.abs(box.width - box.height) < .5 && box.width === (coin.classList.contains('card-coin') ? 34 : 40);
      })), 'Card and power coins stay round on a desktop without touch');
    } finally { await desktop.close(); }
    const saved = (await setupTool('kingdown_settings'))._meta.settings.last_setup;
    assert.deepEqual(saved.king, { king: 'Shadow', power: 'Darkness' }); assert.equal(saved.level, 'strong'); assert.equal(saved.colour, 'black');
    await setupTool('kingdown_abort', { game_id: await page.evaluate(() => window.harnessView.game_id) });
    await setupMount(saved); assert.equal(await frame.locator('#setup-king-name').innerText(), 'Shadow · Darkness');
    assert(await frame.getByRole('radio', { name: 'Strong', exact: true }).isChecked()); assert(await frame.getByRole('radio', { name: 'Black', exact: true }).isChecked());
    for (const kind of ['friend', 'random']) {
      const remembered = { ...saved, kind, options: { ...saved.options, arrangement: true } };
      await setupMount(remembered);
      const home = await setupTool('kingdown_open', { screen: 'home' });
      await page.evaluate(result => window.harnessShow(result), home);
      await frame.getByRole('button', { name: 'Play now', exact: true }).click();
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
      await setupTool('kingdown_abort', { game_id: quick.game_id });
    }
    await setupMount(baseSetup);
    assert.deepEqual(page.viewportSize(), { width: 390, height: 844 }, 'The setup mixes and recovery checks use the phone size');
    const levels = ['beginner','casual','club','strong']; let mix = 0;
    for (const fairy of [true,false]) for (const secondary of [false,true]) for (const cards of [false,true]) for (const powers of [false,true]) {
      const options = { ...DEFAULT_OPTIONS, fairy, arrangement: fairy && secondary, classic: !fairy && secondary, cards, kingPowers: powers };
      const last = { ...baseSetup, options, colour: ['white','black','random'][mix % 3], level: levels[mix++ % 4] };
      await openPlay(); await frame.getByRole('radio', { name: 'Computer', exact: true }).locator('..').click();
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
      await setupTool('kingdown_abort', { game_id: view.game_id });
    }
    const waitingLast = { ...sampleSetup, kind: 'friend' };
    await setupMount(waitingLast); await page.evaluate(() => { window.requireHandleNext = true; }); await frame.locator('#setup-start').click();
    await frame.locator('[data-screen="handle"]:not([hidden])').waitFor(); assert.deepEqual((await setupTool('kingdown_settings'))._meta.settings.last_setup, waitingLast, 'Settings reach the server before HANDLE_NEEDED');
    await frame.locator('#handle').fill(testHandle); await frame.locator('#save-handle').click(); await frame.locator('[data-screen="friend"]:not([hidden])').waitFor();
    assert.equal(await page.evaluate(() => window.harnessView.days_per_move), 3);
    const waiting = await page.evaluate(() => window.harnessView); assert.equal(waiting.choices[waiting.seat].king.king, 'Spirit', 'Waiting keeps the server default; the remembered king goes to the seat screen');
    await setupTool('kingdown_abort', { game_id: waiting.game_id });
    // A lost Start reply survives a remount without a second game.
    await setupMount({ ...baseSetup, options: { ...DEFAULT_OPTIONS, arrangement: false, kingPowers: true } });
    await page.evaluate(() => { window.dropNextReply = 'kingdown_create'; }); await frame.locator('#setup-start').click(); await frame.locator('#retry').waitFor();
    const creates = await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_create').length);
    await page.locator('#remount').click();
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor({ timeout: 5000 });
    assert.equal(await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_create').length), creates, 'Recovered Start sends no second create');
    assert(await page.evaluate(() => window.harnessCalls.some(c => c.name === 'kingdown_games')), 'Pending Start reads Games before a resend');
    const privateState = await page.evaluate(() => window.harnessWidgetState.privateContent);
    assert.deepEqual(Object.keys(privateState).sort(), ['board_id','pending','screen','sheet']);
    assert.equal(await page.evaluate(() => JSON.stringify(window.harnessWidgetState.modelContent)), '{}', 'Setup puts no choice or draw in model context');
    await openPlay(); await frame.getByRole('radio', { name: 'Computer', exact: true }).locator('..').click();
    assert.equal(await frame.locator('#setup-body .modes label').count(), 3, 'Setup still builds after a restored Start');
    const recovered = await page.evaluate(() => window.harnessView); await setupTool('kingdown_abort', { game_id: recovered.game_id });
    await setupMount({ ...baseSetup, kind: 'random', options: { ...DEFAULT_OPTIONS, arrangement: false } }); await frame.locator('#setup-start').click(); await frame.locator('[data-screen="wait"]:not([hidden])').waitFor();
    const random = await page.evaluate(() => window.harnessView); assert.equal(random.kind, 'random'); await setupTool('kingdown_cancel', { game_id: random.game_id });
    const offeredOptions = { ...DEFAULT_OPTIONS, fairy: false, arrangement: false, classic: true };
    await setupTool('kingdown_create', { kind: 'random', options: offeredOptions, colour: 'white' }, true);
    await setupMount({ ...baseSetup, kind: 'random' }); await frame.locator('#setup-start').click(); await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    const accepted = await page.evaluate(() => window.harnessView);
    assert.deepEqual(accepted.options, offeredOptions, 'Find uses the accepted game features instead of the sent choices');
    await setupTool('kingdown_abort', { game_id: accepted.game_id });
    // A lost Choose reply keeps its command receipt and still opens the board after remount.
    await setupMount({ ...baseSetup, options: { ...DEFAULT_OPTIONS, arrangement: false, kingPowers: true } });
    await page.evaluate(() => { window.dropNextReply = 'kingdown_choose'; }); await frame.locator('#setup-start').click(); await frame.locator('#retry').waitFor();
    const chooseId = await page.evaluate(() => window.harnessWidgetState.privateContent.pending.args.command_id);
    await page.locator('#remount').click(); await frame.locator('#retry').waitFor(); await frame.locator('#retry').click();
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor({ timeout: 5000 });
    assert.equal(await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_choose').at(-1).arguments.command_id), chooseId);
    await setupTool('kingdown_abort', { game_id: await page.evaluate(() => window.harnessView.game_id) });
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
      await page.locator('#remount').click();
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
        await shot(page, `${state}-${width}-${mode}`);
        if (width === 390 || width === 1440) {
          const size = width === 390 ? 'phone' : 'desktop', reference = await sharp(`docs/specs/chatgpt-mvp/sample/png/${state}-${size}.png`).resize(width,height).toBuffer(), actual = await page.screenshot();
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
    await page.waitForFunction(() => document.querySelector('iframe').contentWindow.harnessSwapMarks > 0);
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
    await page.waitForFunction(() => document.querySelector('iframe').contentDocument.querySelector('#seat-note').textContent.includes('2 days to choose'), undefined, { timeout: 3000 });
    assert.match(await frame.locator('#seat-them-line').innerText(), /2 days left/, 'An unchanged setup read refreshes both days-left lines');
    const state = await page.evaluate(() => window.harnessWidgetState);
    assert.deepEqual(Object.keys(state.privateContent).sort(), ['board_id','pending','screen','sheet']); assert.deepEqual(state.modelContent, {});
    assert(!JSON.stringify(state).includes('order') && !JSON.stringify(state).includes('game_id'), 'Idle widget state has no order or game ID');
    const hidden = (await seatTool('kingdown_get', { game_id: v.game_id }, true))._meta.view;
    assert.equal(hidden.choices[0],null); assert.deepEqual(hidden.last_commands.at(-1).action,{type:'hidden'});
    const started = await buddyReady(v);
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
    await seatShow(solo); await page.evaluate(() => { window.dropNextReply = 'kingdown_choose'; });
    await frame.locator('#seat-ready').click(); await frame.locator('#retry').waitFor();
    const soloId = await page.evaluate(() => window.harnessWidgetState.privateContent.pending.args.command_id);
    await page.locator('#remount').click(); await frame.locator('[data-screen="board"]:not([hidden])').waitFor({ timeout: 5000 });
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
    await page.evaluate(() => { window.harnessWidgetState.privateContent.screen = 'seat'; });
    legacyReads = await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_get').length);
    await page.locator('#remount').click();
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
    if (screen === 'end') { await frame.locator('#reload:not(:disabled)').waitFor({ state: 'attached' }); await page.clock.runFor(34); }
    // The full read replaces old rows and resets the registry scroll.
    if (screen === 'profile') await frame.locator('#profile-status').waitFor({ state: 'hidden' });
    const layout = await frame.locator('body').evaluate(el => ({ overflow: el.scrollWidth > innerWidth, width: innerWidth, heading: getComputedStyle(document.querySelector(`[data-screen="${el.dataset.page}"] h2`) ?? el).fontFamily }));
    assert.equal(layout.overflow, false, `${screen} has no horizontal scroll at ${width}px`);
    assert(layout.width <= width);
    const controls = frame.locator(`[data-screen="${screen}"] button:visible, [data-screen="${screen}"] input:visible, #page-head button:visible, #retry:visible, #error:visible`);
    for (let i = 0; i < await controls.count(); i++) {
      const control = controls.nth(i); await control.scrollIntoViewIfNeeded();
      const bounds = await control.evaluate(controlBounds);
      assert(bounds.accessible, `${screen} control scrolls into the safe area at ${width}px: ${JSON.stringify(bounds)}`);
    }
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
        assert.equal(await frame.locator('[data-screen="settings"] .quiet-line').innerText(), 'Your settings and your record go with you to any device and any chat.');
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
  assert.deepEqual(await frame.locator('#games-list button').evaluateAll(rows => rows.map(row => row.dataset.gameId)), inbox._meta.games.map(row => row.game_id), 'The shared rows keep the private server order');
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
    return Promise.all(urls.map(async src => { const image = Object.assign(new Image(), { crossOrigin: 'anonymous', src }); await image.decode(); const c = document.createElement('canvas'); c.width = c.height = 8; const g = c.getContext('2d'); g.drawImage(image, 0, 0, 8, 8); g.getImageData(0, 0, 8, 8); return { src, page: new URL(src).origin === location.origin, width: image.naturalWidth }; }));
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
  assert.equal(art.every(file => file.page), mode === 'fixture', 'The HTTP board loads its art from the plugin origin, not the page origin');
  assert.equal(await page.content().then(html => html.includes('data:image/webp')), false);
  await shot(page, `board-art-${mode}`);
  await openScreen('settings');
  await frame.locator('#symbols-only').check();
  assert(await frame.locator('#symbols-only').isChecked());
  assert.equal(await page.evaluate(() => window.harnessWidgetState.modelContent.game_id), undefined);
  assert.deepEqual(await page.evaluate(() => Object.keys(window.harnessWidgetState.privateContent).sort()), ['board_id', 'pending', 'screen', 'sheet']);
  const settingsReads = await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_get').length);
  await page.locator('#remount').click();
  await page.waitForFunction(n => window.harnessCalls.filter(c => c.name === 'kingdown_get').length > n, settingsReads);
  await frame.locator('[data-screen="settings"]:not([hidden])').waitFor();
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
  await page.locator('#remount').click();
  await frame.locator('#retry').waitFor(); await frame.locator('#retry').click();
  await frame.locator('[data-screen="friend"]:not([hidden])').waitFor();
  assert.equal(await page.evaluate(() => window.harnessWidgetState.privateContent.pending), undefined);
  await openPlay(); await legacyStart('solo'); await idleBoard();

  // Ticket 15: the board and end routes.
  assert.equal(await frame.locator('#game-table').count(), 1, 'The board uses the approved game table');

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
    async function remount(screen) {
      const reads = await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_get').length);
      await page.locator('#remount').click();
      await page.waitForFunction(n => window.harnessCalls.filter(c => c.name === 'kingdown_get').length > n, reads);
      await frame.locator(`[data-screen="${screen}"]:not([hidden])`).waitFor();
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
    await lookAt('friend-code', 'friend');
    await page.context().grantPermissions(['clipboard-read','clipboard-write']); await frame.locator('#friend-copy').click();
    await frame.locator('#friend-copy-status').filter({ hasText: /^Copied$/ }).waitFor();
    assert(await page.evaluate(code => navigator.clipboard.readText().then(text => text === code), code), 'The granted clipboard contains the code');
    await frame.locator('html').evaluate(() => {
      window.ticket13Clipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard'); window.ticket13Copy = document.execCommand;
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Denied'); } } }); document.execCommand = () => false;
    });
    await frame.locator('#friend-copy').click(); await frame.locator('#friend-copy-status').filter({ hasText: 'Select the code and copy it' }).waitFor();
    assert(await frame.locator('html').evaluate(() => getSelection().toString().replace(/\s/g, '').length === 6), 'The refused clipboard leaves selectable code text');
    await frame.locator('html').evaluate(() => { if (window.ticket13Clipboard) Object.defineProperty(navigator, 'clipboard', window.ticket13Clipboard); else delete navigator.clipboard; document.execCommand = window.ticket13Copy; getSelection().removeAllRanges(); });
    const invites = await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_invite').length);
    await remount('friend'); await frame.locator('#friend-new').waitFor();
    assert.equal(await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_invite').length), invites, 'Remount makes no new code');
    assert.equal(await frame.locator('.game-code span').count(), 0, 'The saved game shows Make a new code');
    assert(!(await tool('kingdown_join', { code }, true)).isError, 'The buddy joins the page code');
    await frame.locator('body').evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    assert.equal((await tool('kingdown_get', { game_id: friend.game_id }, true))._meta.view.status, 'playing');

    async function buddyCode(choices = options) {
      const game = await tool('kingdown_create', { kind: 'friend', options: choices, colour: 'white' }, true); assert(!game.isError);
      const invite = await tool('kingdown_invite', { game_id: game._meta.view.game_id }, true); assert(!invite.isError);
      assert(Math.abs(Date.parse(invite.structuredContent.expires_at) - Date.now() - 7*86400000) < 60000, 'Friend codes end after seven days');
      return { game: game._meta.view, code: invite.structuredContent.code };
    }
    const offered = await buddyCode(); await openPlay();
    const lower = offered.code.toLowerCase(); await frame.getByRole('radio', { name: 'A friend', exact: true }).locator('..').click(); await frame.locator('#token').fill(`${lower.slice(0,3)}-${lower.slice(3)}`); await frame.locator('#join').click();
    await frame.locator('#join-confirm').waitFor(); await lookAt('join', 'join');
    await remount('join'); await frame.locator('#join-entry').waitFor();
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
    await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now()) + 1000));
    await page.evaluate(() => { const push = window.harnessCalls.push; window.harnessCalls.push = function(call) { call.at = Date.now(); return push.call(this, call); }; window.ticket13Reads = []; window.ticket13Ids = new Set(); addEventListener('message', event => { if (event.data?.method === 'tools/call' && event.data.params?.name === 'kingdown_get') window.ticket13Ids.add(event.data.id); }); });
    await frame.locator('html').evaluate(() => addEventListener('message', event => {
      if (parent.ticket13Ids.delete(event.data?.id) && event.data.result?._meta?.view?.game_id === parent.ticket13WaitingId) { parent.ticket13Reads.push(Date.now()); parent.dispatchEvent(new Event('ticket13-read')); }
    }));
    const receipt = n => page.evaluate(n => new Promise(resolve => {
      if (window.ticket13Reads.length > n) resolve(); else addEventListener('ticket13-read', resolve, { once: true });
    }), n);
    async function advance(ms) {
      const n = await page.evaluate(() => window.ticket13Reads.length), read = receipt(n); let limit;
      await page.clock.runFor(ms);
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
    const readsAtTwo = await page.evaluate(() => window.ticket13Reads.length);
    await page.clock.runFor(14999); assert.equal(await page.evaluate(() => window.ticket13Reads.length), readsAtTwo, 'No five-second poll remains after two minutes');
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
    await remount('board'); assert.equal(await page.evaluate(() => window.harnessView.game_id), waiting.game_id, 'The human board survives remount');
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
    await page.waitForFunction(({id,checked})=>{const input=document.querySelector('iframe').contentDocument.getElementById(id); return !input.disabled && input.checked===checked;},{id,checked});
  }
  for (const scenario of ['threats','threats-black']) {
    const seeded = await seedBoard(scenario), plain = await pixels();
    await openScreen('settings'); await boardSetting('show-threats',true);
    await page.evaluate(result=>window.harnessShow(result),seeded); await idleBoard(); await boardBox();
    const threatReads = await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_get').length);
    await page.locator('#remount').click();
    await page.waitForFunction(n => window.harnessCalls.filter(c => c.name === 'kingdown_get').length > n, threatReads);
    await idleBoard(); await boardBox();
    assert(await frame.locator('#show-threats').isChecked(), 'Show threats returns from the server after mount');
    await frame.locator('canvas').evaluate(() => { window.harnessArrowLines = []; });
    const arrowBox = await boardBox(); await page.mouse.move(arrowBox.x+arrowBox.width/2, arrowBox.y+arrowBox.height/2);
    await frame.locator('canvas').evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    await page.waitForFunction(() => document.querySelector('iframe').contentWindow.harnessArrowLines.length > 0);
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
  await clickSquare(4,1); await clickSquare(4,3);
  await page.waitForFunction(() => typeof window.releaseHeld === 'function', undefined, {timeout:5000});
  await page.clock.fastForward(1100);
  await frame.locator('#strip-them .player-name small').filter({hasText:'thinking…'}).waitFor();
  assert.equal(await frame.getByRole('button', {name:'Computer move', exact:true}).count(), 0, 'The computer needs no move button');
  await page.evaluate(() => window.releaseHeld());
  await frame.locator('#status').filter({hasText:'Your move'}).waitFor(); await idleBoard();
  assert.equal(await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_computer').length), computerBefore + 1, 'One normal computer turn sends one command');
  async function haste() { const result = await (await page.request.post(new URL('/fixture-position?case=haste',base).href)).json(); assert(!result.isError); await page.evaluate(result=>window.harnessShow(result),result); await frame.locator('#status').filter({hasText:'Your move'}).waitFor(); await idleBoard(); }
  await seedBoard('swap');
  await frame.locator('canvas').evaluate(() => { window.harnessSwapMarks = 0; });
  await clickSquare(3, 3);
  await page.waitForFunction(() => document.querySelector('iframe').contentWindow.harnessSwapMarks > 0);
  assert(await frame.locator('#choices button').count() > 0, 'The Maester fixture offers a swap and PaintedView draws its violet mark');
  await shot(page, `shell-swap-${mode}`);
  await haste();
  await clickSquare(4, 1);
  assert(await frame.locator('#choices button').count() > 0);
  assert(await frame.locator('#choices button').count() > 1, 'Haste and ordinary moves must stay distinct');
  for (const code of ['STALE_REVISION', 'INVALID_MOVE', 'WRONG_TURN', 'COMMAND_CONFLICT', 'MATCH_INCOMPATIBLE']) {
    if (!await frame.locator('#choices button[title="e2-e4"]').count()) await clickSquare(4,1);
    await page.evaluate(code => { window.rejectNextMove = code; }, code);
    await openMoveChoices(); await frame.locator('#choices button[title="e2-e4"]').click();
    await idleBoard();
    assert.equal(await frame.locator('#retry').isVisible(), false, `${code} must release the pending command`);
    await frame.locator('#error').filter({hasText:'Harness definitive rejection'}).waitFor();
    assert.equal(await frame.locator('#status').innerText(), '', 'The error appears once in the error row');
    assert.equal(await frame.locator('#last-move').innerText(), 'Move 1.', `${code} restores the last server position and move line`);
  }
  await haste();
  const race = await page.evaluate(() => window.harnessView);
  const winner = await (await page.request.post(new URL('/fixture-tool',base).href,{data:{name:'kingdown_move',arguments:{game_id:race.game_id,command_id:randomUUID(),expected_revision:race.revision,lan:'d2-d4'}}})).json();
  assert(!winner.isError,'Another tab wins the move race');
  await page.evaluate(() => { window.dropNextReply='kingdown_move'; window.holdNext='kingdown_computer'; });
  await clickSquare(4,1); await openMoveChoices(); await frame.locator('#choices button[title="e2-e4"]').click();
  await frame.locator('#retry').waitFor();
  assert.match(await frame.locator('#last-move').innerText(),/White pawn e2 to e4/,'The lost refusal keeps the move until Retry');
  const raceReads = await page.evaluate(() => window.harnessCalls.filter(c=>c.name==='kingdown_get').length);
  await frame.locator('#retry').click(); await page.waitForFunction(()=>typeof window.releaseHeld==='function');
  assert.doesNotMatch(await frame.locator('#last-move').innerText(),/e2 to e4/,'A final Retry refusal removes the refused move');
  assert(await page.evaluate(n=>window.harnessCalls.filter(c=>c.name==='kingdown_get').length>=n+2,raceReads),'Retry reads in full after the refusal');
  await page.waitForFunction(()=>typeof window.releaseHeld==='function'); await page.evaluate(()=>window.releaseHeld()); await idleBoard();
  await haste(); await clickSquare(4,1);
  if (!await frame.locator('#choices button[title="e2-e4"]').count()) await clickSquare(4,1);
  await page.evaluate(() => { window.holdNext = 'kingdown_move'; window.dropNextMoveReply = true; });
  await openMoveChoices(); await frame.locator('#choices button[title="e2-e4"]').click();
  await page.waitForFunction(() => typeof window.releaseHeld === 'function');
  assert(await frame.locator('#reload').isDisabled(), 'The generic hold hook keeps Move pending');
  assert.match(await frame.locator('#last-move').innerText(), /White pawn e2 to e4/, 'The move shows before the held reply');
  assert.equal(await frame.locator('#retry').isVisible(), false);
  await page.evaluate(() => window.releaseHeld());
  await frame.locator('#retry').waitFor();
  await page.locator('#remount').click();
  await frame.locator('#retry').waitFor();
  await page.waitForFunction(()=>window.harnessView.revision===1);
  assert.equal(await page.evaluate(() => window.harnessView.revision), 1, 'Remount must restore the selected game and its pending command');
  await menuAction('reload');
  await idleBoard();
  assert(await frame.locator('#retry').isVisible(), 'Reload must preserve the pending command');
  await frame.locator('#retry').click();
  await frame.locator('#retry').waitFor({ state: 'hidden' });
  const commands = await page.evaluate(() => window.harnessCalls.filter(call => call.name === 'kingdown_move').slice(-2));
  assert.equal(commands.length, 2); assert.deepEqual(commands[0].arguments, commands[1].arguments);
  await page.waitForFunction(() => window.harnessCalls.some(c => c.name === 'kingdown_computer' && c.arguments.game_id === window.harnessMatchId));
  assert.equal(await page.evaluate(() => window.harnessCalls.find(c => c.name === 'kingdown_computer' && c.arguments.game_id === window.harnessMatchId).arguments.expected_revision), 1, 'Lost reply and retry commit exactly once');
  await idleBoard();
  await frame.locator('#status').filter({ hasText: 'Your move' }).waitFor();
  const id = await page.evaluate(() => window.harnessMatchId);
  const snapshot = await page.evaluate(() => window.harnessView), lastMove = await frame.locator('#last-move').innerText();
  assert(snapshot.revision >= 2 && snapshot.revision <= 5);
  const readsBeforeRemount = await page.evaluate(() => window.harnessCalls.filter(call => call.name === 'kingdown_get').length);
  await page.locator('#remount').click();
  await page.waitForFunction(count => window.harnessCalls.filter(call => call.name === 'kingdown_get').length > count, readsBeforeRemount);
  await frame.locator('#last-move').filter({ hasText: lastMove }).waitFor();
  await idleBoard();
  assert.equal(await page.evaluate(() => window.harnessMatchId), id);
  assert.deepEqual(await page.evaluate(() => ({ revision: window.harnessView.revision, fen: window.harnessView.fen })), { revision: snapshot.revision, fen: snapshot.fen });
  assert.equal(await page.evaluate(() => window.harnessCalls.findLast(call => call.name === 'kingdown_get').arguments.board_id), await page.evaluate(() => window.harnessWidgetState.privateContent.board_id), 'A replayed initial result fetches the board current game');
  await page.evaluate(() => { window.rejectNextGet = true; });
  await page.locator('#remount').click();
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
  assert.equal(await frame.locator('#move-hint').innerText(), 'Tap a marked square to move, or choose a move below.');
  await tapSquare(4, 3);
  await idleBoard();
  assert.equal(await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_move' && c.arguments.game_id === window.harnessMatchId && c.arguments.lan === 'e2-e4').length), 1, 'Touch destination commits the ordinary move once');
  await openPlay(); await legacyStart('solo'); await idleBoard();
  await haste(); await tapSquare(4, 1);
  await openMoveChoices(); await frame.locator('#choices button').filter({ hasText: 'e2 to e4, with Haste' }).tap();
  await idleBoard();
  assert.equal(await frame.locator('#status').innerText(), 'Move it again, or stop here.', 'Explicit Haste keeps the extra move');
  assert.equal(await page.evaluate(() => window.harnessView.revision), 1);
  await tapSquare(4, 3); await tapSquare(4, 3);
  assert.equal(await page.evaluate(() => window.harnessView.revision), 1, 'Second tap must not pass Haste');
  assert.equal(await frame.locator('#choices button').count(),0,'Second tap deselects');
  async function dragOwnSquare(file,rank,black=false) {
    const box=await boardBox(); assert(box);
    const x=box.x+(32+((black?7-file:file)+.5)*112)*box.width/960;
    const y=box.y+(96+((black?rank:7-rank)+.5)*112)*box.width/960;
    await page.mouse.move(x,y); await page.mouse.down(); await page.mouse.move(x+10,y); await page.mouse.up();
  }
  await tapSquare(4,3); await dragOwnSquare(4,3);
  assert.equal(await page.evaluate(() => window.harnessView.revision),1,'Drag start must not pass Haste');
  await tapSquare(4, 3); await tapSquare(4, 4);
  await idleBoard();
  assert.equal(await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_move' && c.arguments.game_id === window.harnessMatchId).length), 2, 'Touch finishes the explicit Haste action');
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
    await page.waitForFunction(r=>window.harnessView.revision>=r,start+1);
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
  const cardView = cardGame._meta.view; setRules(cardView.rules);
  const cardPos = fromFen(cardView.fen), cardLegal = legalMoves(cardPos).filter(m => cardView.legal.includes(toLan(cardPos,m))), hand = cardCoins(cardPos,cardView.seat,cardView.rules.hands[cardView.seat],cardLegal);
  const cardIndex = hand.findIndex(c=>c.moves.length); assert(cardIndex>=0,'The dealt hand has a card to play');
  const card = hand[cardIndex], cardWords = card.card.replace(/([a-z])([A-Z])/g,'$1 $2'), cardLan = toLan(cardPos,card.moves[0]);
  assert.equal(await frame.locator('#strip-me .card-coin').count(),4); assert.equal(await frame.locator('#strip-them .card-coin').count(),4);
  await frame.locator('#strip-me .card-coin').nth(cardIndex).click();
  assert(!(await page.evaluate(()=>JSON.stringify(window.harnessWidgetState))).includes(cardWords),'A card read stores no hand data in widget state');
  await frame.locator('#board-sheet').getByRole('button',{name:'Use',exact:true}).click();
  await openMoveChoices(); await frame.locator(`#choices button[title="${cardLan}"]`).click();
  await page.waitForFunction(({id,n})=>window.harnessCalls.some(c=>c.name==='kingdown_move'&&c.arguments.game_id===id&&c.arguments.lan===n),{id:cardView.game_id,n:cardLan}); await idleBoard();
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
    await frame.locator(`#choices button[title="${white}"]`).click(); await page.waitForFunction(rev=>window.harnessView.revision>rev,arrivalView.revision); await idleBoard();
    arrivalView=await page.evaluate(()=>window.harnessView);
    setRules(arrivalRules); const blackPos=fromFen(arrivalView.fen), blackMove=legalMoves(blackPos).find(m=>m.from===blackFrom&&m.to===blackTo&&!m.power); assert(blackMove); const black=toLan(blackPos,blackMove);
    const moved=await arrivalTool('kingdown_move',{game_id:arrivalView.game_id,command_id:randomUUID(),expected_revision:arrivalView.revision,lan:black},true); assert(!moved.isError); arrivalView=await arrivalRead();
  }
  const salvation=arrivalView.rules.hands[arrivalView.seat].indexOf('Salvation'), arrivalLan=arrivalView.legal.find(lan=>lan.startsWith('N@'+sqName(knight.from))); assert(salvation>=0&&arrivalLan,'The dealt Salvation can return the taken knight');
  await frame.locator('#strip-me .card-coin').nth(salvation).click();
  assert.match(await frame.locator('#board-sheet .cf-art img').getAttribute('src'),/salvation-/,'salvation.webp loads from the plugin origin');
  await frame.locator('#board-sheet').getByRole('button',{name:'Use',exact:true}).click(); await openMoveChoices();
  await frame.locator(`#choices button[title="${arrivalLan}"]`).click();
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
  await page.locator('#remount').click();
  await page.waitForFunction(n=>window.harnessCalls.filter(c=>c.name==='kingdown_get').length>n,recoveryReads);
  await frame.locator('#status').filter({hasText:'Your move'}).waitFor();
  assert.equal(await page.evaluate(()=>window.harnessView.game_id),replacement,'Deleted-game recovery survives immediate remount');
  const friendTool = async (name,args={}) => (await page.request.post(new URL('/fixture-friend-tool',base).href,{data:{name,arguments:args,fresh:true}})).json();
  const tool = async (name,args={}) => (await page.request.post(new URL('/fixture-tool',base).href,{data:{name,arguments:args}})).json();
  await legacyStart('solo'); await frame.locator('#resign').click();
  await frame.locator('#board-sheet h2').filter({hasText:'Lay your king down?'}).waitFor({timeout:3000});
  assert.equal(await page.evaluate(()=>window.harnessView.status),'playing','Resign waits for its confirm');
  await frame.locator('#board-sheet').getByRole('button',{name:'Keep playing',exact:true}).click();
  await frame.locator('#resign').click(); await frame.locator('#board-sheet').getByRole('button',{name:'Resign',exact:true}).click();
  await frame.locator('#over.end-card[open] h2').filter({hasText:'You lose'}).waitFor(); await idleBoard();
  assert.match(await frame.locator('#end-reason').innerText(),/Resignation/);
  const ended = await page.evaluate(()=>window.harnessView), rematchCalls = await page.evaluate(()=>window.harnessCalls.length);
  await page.evaluate(()=>{window.dropNextReply='kingdown_rematch';});
  await frame.locator('#over').getByRole('button',{name:'Rematch',exact:true}).click();
  await frame.locator('#over #retry').waitFor();
  const pendingRematch=await page.evaluate(()=>window.harnessWidgetState.privateContent.pending);
  await frame.locator('#over #retry').click();
  await page.waitForFunction(id=>window.harnessView.game_id!==id,ended.game_id); await idleBoard();
  const rematchSent = await page.evaluate(n=>window.harnessCalls.slice(n),rematchCalls);
  assert.equal(rematchSent.find(c=>c.name==='kingdown_rematch').arguments.choice,'offer','Solo rematch offers, never accepts');
  assert.deepEqual(rematchSent.filter(c=>c.name==='kingdown_rematch').map(c=>c.arguments.command_id),[pendingRematch.args.command_id,pendingRematch.args.command_id],'A lost rematch reply retries the same command');
  const resumedCall = rematchSent.find(c=>c.name==='kingdown_resume'); assert(resumedCall && resumedCall.arguments.board_id,'The new game resumes on the same board');
  assert(!rematchSent.some(c=>c.name==='kingdown_get' && c.arguments.game_id===resumedCall.arguments.game_id),'Rematch never reads the new game by ID');
  assert(['board','seat'].includes(await page.evaluate(()=>window.harnessWidgetState.privateContent.screen)));
  await legacyStart('solo'); await frame.locator('#resign').click(); await frame.locator('#board-sheet').getByRole('button',{name:'Resign',exact:true}).click();
  await frame.locator('#over.end-card[open]').waitFor(); await idleBoard();
  await frame.locator('#over').getByRole('button',{name:'Your games',exact:true}).click();
  await frame.locator('[data-screen="play"]:not([hidden])').waitFor(); assert.equal(await frame.locator('#over').isVisible(),false);
  await openPlay(); await legacyStart('solo'); await frame.locator('#context-actions #abort').click();
  await frame.locator('#board-sheet').getByRole('button',{name:'Abort',exact:true}).click();
  await frame.locator('#over.end-card[open] h2').filter({hasText:'Game aborted'}).waitFor(); await idleBoard();
  assert.equal(await frame.locator('#over').getByRole('button',{name:'Rematch',exact:true}).count(),0,'An abort has no rematch');
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
    await frame.locator('#offer-draw').click(); await frame.locator('#board-sheet').getByRole('button',{name:'Offer draw',exact:true}).click(); await idleBoard();
    let current=await page.evaluate(()=>window.harnessView);
    assert.equal(current.draw_offer,current.seat);
    const decline=await friendTool('kingdown_draw',{game_id:human.game_id,command_id:randomUUID(),expected_revision:current.revision,choice:'decline'}); assert(!decline.isError); await readGame();
    current=await page.evaluate(()=>window.harnessView);
    const offer=await friendTool('kingdown_draw',{game_id:human.game_id,command_id:randomUUID(),expected_revision:current.revision,choice:'offer'}); assert(!offer.isError); await readGame();
    await frame.locator('#context-actions #decline-draw').click(); await frame.locator('#board-sheet').getByRole('button',{name:'Decline',exact:true}).click(); await idleBoard();
    current=await page.evaluate(()=>window.harnessView); assert.equal(current.draw_offer,null);
    const offerAgain=await friendTool('kingdown_draw',{game_id:human.game_id,command_id:randomUUID(),expected_revision:current.revision,choice:'offer'}); assert(!offerAgain.isError); await readGame();
    if (mode==='fixture') await page.request.post(new URL('/fixture-seed',base).href,{data:{actor:'alice',data:{views:{[human.game_id]:{outcome:{rating_before:1500,rating:1561,provisional:true,badges:[{badge:'fairy_tale',earned_at:new Date().toISOString()}]}}}}}});
    await page.evaluate(()=>{window.holdNext='kingdown_draw';});
    await frame.locator('#context-actions #accept-draw').click(); await frame.locator('#board-sheet').getByRole('button',{name:'Accept',exact:true}).click();
    await page.waitForFunction(()=>typeof window.releaseHeld==='function');
    await page.evaluate(()=>{window.rejectNextGet=true; window.releaseHeld();});
    await frame.locator('#over.end-card[open] h2').filter({hasText:'Draw'}).waitFor(); await idleBoard();
    await frame.locator('#over #retry').waitFor({timeout:3000});
    assert.equal(await frame.locator('#over .end-facts').innerText(),'','A failed full end read shows no guessed rating or badge');
    await frame.locator('#over #retry').click(); await frame.locator('#over #retry').waitFor({state:'hidden'}); await idleBoard();
    if (mode==='fixture') { await frame.locator('.end-facts').filter({hasText:'1561?'}).waitFor(); assert.match(await frame.locator('.end-facts').innerText(),/\+61/); assert.match(await frame.locator('.new-badge img').getAttribute('src'),/badge-fairy-tale-/); }
    current=await page.evaluate(()=>window.harnessView);
    const buddyOffer=await friendTool('kingdown_rematch',{game_id:human.game_id,command_id:randomUUID(),expected_revision:current.revision,choice:'offer'}); assert(!buddyOffer.isError);
    await page.clock.fastForward(3100);
    await frame.locator('#over').getByRole('button',{name:'Accept',exact:true}).waitFor({timeout:3000});
    const offeredEnd=await page.evaluate(()=>window.harnessView);
    assert.equal(offeredEnd.rematch_offer,1,'A later Rematch offer arrives without a manual read');
    for(const deleted of [true,false]) {
      await page.evaluate(({view,deleted})=>{window.holdNext='kingdown_get'; window.harnessNextView={...view,rules:undefined,opponent:{...view.opponent,deleted}};},{view:offeredEnd,deleted});
      await page.clock.fastForward(3100); await page.waitForFunction(()=>typeof window.releaseHeld==='function');
      assert(await frame.locator('#page-back').isEnabled(),'An end poll leaves controls enabled'); await page.evaluate(()=>window.releaseHeld());
      await frame.locator('#over').getByRole('button',{name:'Accept',exact:true}).waitFor({state:deleted?'detached':'visible',timeout:3000});
      if (deleted) {
        const reads=await page.evaluate(()=>window.harnessCalls.filter(c=>c.name==='kingdown_get').length);
        await page.clock.fastForward(31000);
        assert.equal(await page.evaluate(()=>window.harnessCalls.filter(c=>c.name==='kingdown_get').length),reads,'A deleted opponent stops end polling');
        await readGame();
      }
    }
    await frame.locator('#over').getByRole('button',{name:'Decline',exact:true}).click(); await idleBoard(); current=await page.evaluate(()=>window.harnessView); assert.equal(current.rematch_offer,null);
    await frame.locator('#over').getByRole('button',{name:'Rematch',exact:true}).click(); await idleBoard(); current=await page.evaluate(()=>window.harnessView);
    assert.equal(await frame.locator('#over').getByRole('button',{name:'Rematch',exact:true}).count(),0,'An offer has no second Rematch button');
    const buddyDecline=await friendTool('kingdown_rematch',{game_id:human.game_id,command_id:randomUUID(),expected_revision:current.revision,choice:'decline'}); assert(!buddyDecline.isError);
    const buddyOfferAgain=await friendTool('kingdown_rematch',{game_id:human.game_id,command_id:randomUUID(),expected_revision:buddyDecline._meta.view.revision,choice:'offer'}); assert(!buddyOfferAgain.isError);
    await page.clock.fastForward(3100); await frame.locator('#over').getByRole('button',{name:'Accept',exact:true}).waitFor();
    const acceptCalls=await page.evaluate(()=>window.harnessCalls.length), acceptBoard=await page.evaluate(()=>window.harnessWidgetState.privateContent.board_id);
    await frame.locator('#over').getByRole('button',{name:'Accept',exact:true}).click();
    await page.waitForFunction(id=>window.harnessView.game_id!==id,human.game_id); await idleBoard();
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor(); await boardBox();
    const accepted=await page.evaluate(()=>window.harnessView), acceptedCalls=await page.evaluate(n=>window.harnessCalls.slice(n),acceptCalls);
    assert(acceptedCalls.some(c=>c.name==='kingdown_rematch'&&c.arguments.choice==='accept'),'The end-card Accept sends the rematch command');
    assert(acceptedCalls.some(c=>c.name==='kingdown_resume'&&c.arguments.game_id===accepted.game_id&&c.arguments.board_id===acceptBoard),'Accept resumes the new game on the same board');
    assert.equal(accepted.status,'playing'); assert.equal(accepted.seat,1,'The accepted rematch swaps colours'); assert.deepEqual(accepted.options,human.options,'The accepted rematch keeps its features');
    human=await joinedGame();
    await clickSquare(4,1); await clickSquare(4,3); await idleBoard(); current=await page.evaluate(()=>window.harnessView);
    const blackMove=await friendTool('kingdown_move',{game_id:human.game_id,command_id:randomUUID(),expected_revision:current.revision,lan:'e7-e5'}); assert(!blackMove.isError); await readGame();
    await clickSquare(3,1); await clickSquare(3,3); await idleBoard(); current=await page.evaluate(()=>window.harnessView); assert.equal(current.abort_open,false);
    if (mode==='fixture') await page.request.post(new URL('/fixture-seed',base).href,{data:{actor:'alice',data:{views:{[human.game_id]:{deadline_at:new Date(Date.now()-60000).toISOString()}}}}});
    else { const {Client}=await import('pg'); const db=new Client({connectionString:process.env.PLUGIN_TEST_DATABASE_URL}); await db.connect(); try {await db.query("update public.games set deadline_at=now()-interval '1 minute', deadline_kind='move' where id=$1",[human.game_id]);} finally {await db.end();} }
    await readGame(); await frame.locator('#context-actions #claim').click(); await frame.locator('#board-sheet').getByRole('button',{name:'Claim the win',exact:true}).click();
    await frame.locator('#over.end-card[open] h2').filter({hasText:'You win'}).waitFor(); await idleBoard(); assert.match(await frame.locator('#end-reason').innerText(),/Time/);
    human=await joinedGame(); await clickSquare(4,1); await clickSquare(4,3); await idleBoard(); current=await page.evaluate(()=>window.harnessView); assert.equal(current.abort_open,true);
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
    await frame.locator('#status').filter({ hasText: 'Your move' }).waitFor();
    await clickSquare(4, 1); await clickSquare(4, 3);
    await idleBoard();
    const friend = await page.evaluate(() => window.harnessView);
    const replied = await friendTool('kingdown_move',{ game_id: friend.game_id, command_id: 'friend-reply', expected_revision: friend.revision, lan: 'e7-e5' });
    assert(!replied.isError);
    await frame.locator('#status').filter({ hasText: 'Your move' }).waitFor({ timeout: 35000 });
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

    await page.locator('#remount').click();
    await page.waitForFunction(count => window.harnessCalls.filter(call => call.name === 'kingdown_get').length > count, readsBeforeJoinRemount);
    await frame.locator('#strip-me .player-name small').filter({ hasText: 'Black' }).waitFor({ timeout: 5000 });
    assert.equal(await page.evaluate(() => window.harnessMatchId), joinedView.game_id, 'Remount must keep the joined game instead of the original solo game');
    await page.evaluate(() => { window.harnessDropWidgetWrites = false; });
    await openPlay();
    await openPlay(); await legacyStart('solo'); await idleBoard();
  }
  const routeBase = await page.evaluate(() => window.harnessView), routeBoard = await page.evaluate(() => window.harnessWidgetState.privateContent.board_id);
  for (const [status, kind, options, screen] of [['waiting','friend',undefined,'friend'], ['waiting','random',undefined,'wait'], ['setup','friend',{},'seat'], ['setup','solo',undefined,'board'], ['playing','solo',undefined,'board'], ['finished','friend',undefined,'end'], ['aborted','random',undefined,'end']]) {
    const reads = await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_get').length);
    await page.evaluate(({base, board_id, status, kind, options}) => {
      window.harnessNextView = { ...base, status, kind, options };
      return window.harnessShow({ content: [], structuredContent: {game_id:base.game_id}, _meta: {board_id,view:base} }, true);
    }, { base: routeBase, board_id: routeBoard, status, kind, options });
    await page.waitForFunction(n => window.harnessCalls.filter(c => c.name === 'kingdown_get').length > n, reads);
    await frame.locator(`[data-screen="${screen}"]:not([hidden])`).waitFor();
    await page.waitForFunction(() => document.querySelector('iframe').contentDocument.querySelector('#reload').disabled === false);
  }
  const routes = ['home','play','friend','join','wait','lobby','seat','board','end','profile','collection','settings','handle'];
  assert.deepEqual(await frame.locator('[data-screen]').evaluateAll(els => els.map(el => el.dataset.screen).sort()), [...routes].sort());
  for (const [width,height] of [[390,844],[400,900],[1440,900]]) {
    await page.setViewportSize({width,height});
    for (const screen of routes) {
      const reads = await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_get').length);
      const settingsReads = await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_settings').length);
      await page.evaluate(({screen,base}) => { window.harnessNextView = screen === 'end' ? { ...base, status: 'finished', result: { winner: 0, reason: 'resign' } } : undefined; window.harnessWidgetState = { modelContent: {}, privateContent: { screen, sheet: undefined, board_id: window.harnessWidgetState.privateContent.board_id, pending: undefined } }; }, {screen,base:routeBase});
      await page.locator('#remount').click();
      await page.waitForFunction(n => window.harnessCalls.filter(c => c.name === 'kingdown_get').length > n, reads);
      await frame.locator(`[data-screen="${screen}"]:not([hidden])`).waitFor(); await fits(screen,width);
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
    const client = createClient({ callServerTool: request => parent.harnessTool(request) }, window.openai);
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
    await page.locator('#remount').click();
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
        if (remount) await page.locator('#remount').click(); else await page.evaluate(result => window.harnessShow(result, true), error);
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
    assert.equal(await frame.locator('#home-line').innerText(), home.structuredContent.your_turn_count === 0 ? 'No games need your move.' : `Your move in ${home.structuredContent.your_turn_count} game${home.structuredContent.your_turn_count === 1 ? '' : 's'}.`);
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
    const lower = await frame.locator('nav').evaluate(el=>el.getBoundingClientRect().bottom);
    const pane=await page.locator('iframe').boundingBox(); assert(pane);
    assert(pane.y+lower<=viewport.height-reserve,`The page controls clear the composer at ${viewport.width}×${viewport.height}`);
    assert(pane.y+Math.min(lower,pane.height)<=viewport.height-reserve,'Visible controls stay inside the app pane');
  }
  // The approved table states use public views and the host's existing reply override.
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
    async function showSnapshot(value, words=`Move ${positionMoveNumber(fromFen(value.fen))}.`) {
      await page.evaluate(value=>{window.harnessNextView=value; return window.harnessShow({content:[],structuredContent:{game_id:value.game_id,screen:'board'},_meta:{board_id:window.harnessWidgetState.privateContent.board_id,view:value}});},value);
      await page.waitForFunction(value=>window.harnessView.game_id===value.game_id&&window.harnessView.fen===value.fen,value);
      await frame.locator('#last-move').filter({hasText:words}).waitFor();
      await idleBoard(); await boardBox();
    }
    const legal=()=>position.turn===0?legalMoves(position).map(m=>toLan(position,m)):[];
    await showSnapshot({...snapshot,fen:toFen(position),turn:position.turn,in_check:inCheck(position),legal:legal()});
    const commands=[]; let story=`Move ${positionMoveNumber(position)}.`;
    for (const [index,lan] of state.play.entries()) {const step=applyLan(position,lan,sampleRules); assert(step,`${state.name}: the sample move is legal`); commands.push({seq:101+index,seat:position.turn,at:snapshot.server_now,action:{type:'turn',actions:[lan]}}); position=step.pos; story=step.words;}
    const finished=state.end?{status:'finished',result:{winner:0,reason:'checkmate'},outcome:{rating_before:1500,rating:1561,provisional:true,badges:[{badge:'fairy_tale',earned_at:snapshot.server_now}]}}:{};
    await showSnapshot({...snapshot,...finished,revision:100+commands.length,fen:toFen(position),turn:position.turn,in_check:inCheck(position),legal:state.end?[]:legal(),last_commands:commands,deadline_at:state.claim?new Date(Date.now()-60000).toISOString():null},story);
    if (state.select) {await clickSquare(...state.select); await page.clock.runFor(POP_MS+14*RIPPLE_MS+50);}
    if (state.claim) assert.equal(await frame.locator('#status').innerText(),'mira_k has not moved for 3 days.');
    if (state.end) await frame.locator('#over.end-card[open]').waitFor();
    for (const [width,height] of [[390,844],[400,900],[1440,900],[360,844]]) {
      await page.setViewportSize({width,height}); await boardBox();
      await frame.locator('#game-table img,#over.end-card img').evaluateAll(images=>Promise.all(images.map(img=>img.decode())));
      const bounds=await frame.locator('#game-table').evaluate(el=>{const r=el.getBoundingClientRect();return {overflow:el.scrollWidth>el.clientWidth+1,left:r.left,right:r.right,width:innerWidth,body:document.body.scrollWidth>innerWidth};});
      assert(!bounds.overflow&&!bounds.body&&bounds.left>=-1&&bounds.right<=bounds.width+1,`${state.name} fits at ${width}px`);
      const ids=state.end?['#over','#context-line']:['#table-bar','#context-line'];
      for(const id of ids) { const box=await frame.locator(id).evaluate(el=>{const r=el.getBoundingClientRect(),frame=document.querySelector('#app-frame').getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,frameBottom:frame.bottom,width:innerWidth};}); assert(box.top>=0&&box.bottom<=box.frameBottom+1&&box.left>=-1&&box.right<=box.width+1,`${state.name} ${id} stays inside the frame at ${width}px`); }
      await shot(page,`ticket15-${state.name}-${width}-${mode}`);
      if (width===390||width===1440) {
        const size=width===390?'phone':'desktop', actual=await page.screenshot(), golden=await readFile(`docs/specs/chatgpt-mvp/sample/png/${state.name}-${size}.png`);
        const left=await sharp(golden).resize(width,height).toBuffer();
        await sharp({create:{width:width*2,height,channels:3,background:'#fff'}}).composite([{input:left,left:0,top:0},{input:actual,left:width,top:0}]).png().toFile(join(look,`${state.name}-${size}-${mode}.png`));
      }
    }
  }
  console.log(`Ticket 15 look comparisons: ${look}`);
  await openScreen('settings'); await boardSetting('symbols-only',false); await boardSetting('show-threats',false); await openPlay(); await legacyStart('solo');
  for (const [kind,features,status] of [['friend',options,'waiting'],['solo',{...options,arrangement:true},'setup']]) {
    const start = await legacyStart('solo');
    await frame.locator('#status').filter({hasText:'Your move'}).waitFor();
    await clickSquare(4,1); await page.evaluate(()=>{window.dropNextMoveReply=true;});
    await openMoveChoices(); await frame.locator('#choices button[title="e2-e4"]').click(); await frame.locator('#retry').waitFor();
    const switched = await tool('kingdown_create',{kind,options:features,colour:'white'});
    assert.equal(switched._meta.view.status,status); assert.equal(switched._meta.view.fen,'');
    await page.evaluate(result=>window.harnessShow(result),switched);
    await frame.locator('#retry').waitFor({state:'hidden'});
    assert.equal(await page.evaluate(()=>window.harnessWidgetState?.privateContent?.pending),undefined,'An empty-FEN host switch clears the old command');
  }
  await legacyStart('solo');
  await frame.locator('#status').filter({hasText:'Your move'}).waitFor();
  // A host notification can switch games independently of a pending submission.
  await clickSquare(4, 1);
  await page.evaluate(() => { window.dropNextMoveReply = true; });
  await openMoveChoices(); await frame.locator('#choices button[title="e2-e4"]').click(); await frame.locator('#retry').waitFor();
  // White, as the board's Solo button sends: with no colour the seat is random, and Black has no move before the computer.
  const switched = await (await page.request.post(new URL('/fixture-tool', base).href, { data: { name: 'kingdown_create', arguments: { kind: 'solo', options, colour: 'white' } } })).json();
  await page.evaluate(async result => { await window.harnessShow(result); }, switched);
  await frame.locator('#retry').waitFor({ state: 'hidden' });
  await clickSquare(4, 1); assert(await frame.locator('#choices button').count() > 0);
  await page.evaluate(() => { window.harnessWidgetState = { modelContent: { game_id: window.harnessMatchId } }; });
  await page.locator('#remount').click();
  await frame.locator('[data-screen="board"]:not([hidden])').waitFor({ timeout: 5000 });
  await frame.locator('#status').filter({ hasText: 'Your move' }).waitFor();
  await page.evaluate(() => { window.harnessWithoutWidgetState = true; window.harnessWidgetState = undefined; });
  await page.locator('#remount').click();
  await page.waitForFunction(() => window.harnessWidgetState?.modelContent?.status === 'playing' && window.harnessWidgetState?.modelContent?.your_turn === true);
  await frame.locator('#status').filter({ hasText: 'Your move' }).waitFor();
  assert.deepEqual(await page.evaluate(() => window.harnessWidgetState.modelContent), {status:'playing',your_turn:true}, 'Hosts without widget state receive useful model context without an internal revision');
  if (mode === 'fixture') {
  await page.goto(new URL('/?terminal=1', base).href);
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
  console.error('Board check state:', await page.frameLocator('iframe').locator('body').evaluate(() => ({ hidden: document.hidden, status: document.querySelector('#status').textContent, error: document.querySelector('#error').textContent, reloadDisabled: document.querySelector('#reload').disabled })));
  assertNoErrors(); throw error;
} finally { await browser.close(); unregister(); }
