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
try {
  await page.addInitScript(() => {
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
  assert.equal(await frame.locator('#home-card button').count(), 2, 'The inline home card has only Play and Your games');
  await frame.locator('#home-play:not(:disabled)').waitFor();
  assert.deepEqual(await page.evaluate(() => window.harnessDeclaredModes), ['inline', 'fullscreen'], 'App declares both display modes to the host');
  assert.equal(await frame.locator('.inline-line').innerText(), 'Your move in 0 games.', 'Home uses the server turn count and the sample line');
  assert.equal(await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_get').length), 0, 'An empty home reads no board');
  await frame.locator('[data-art]').evaluateAll(images => Promise.all(images.map(image => image.decode())));

  for (const [width,height] of [[390,844],[1440,900],[400,900],[360,844]]) {
    await page.setViewportSize({width,height});
    assert.equal(await frame.locator('body').evaluate(el=>el.scrollWidth>innerWidth), false, `Home has no horizontal scroll at ${width}px`);
    assert.equal(await frame.locator('.wordmark').evaluate(el => getComputedStyle(el).fontSize), '40px', 'Home keeps the sample wordmark size');
    await shot(page, `shell-home-${width}-${mode}`);
  }
  await page.setViewportSize({width:1000,height:1000});
  await frame.getByRole('button', { name: 'Play', exact: true }).click();
  await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
  assert.deepEqual(await frame.locator('[data-screen="play"] .row-title').allTextContents(), ['Computer', 'A friend', 'A random player', 'Profile', 'Settings']);
  assert(await frame.locator('[data-screen="play"] h2').evaluate(el => getComputedStyle(el).fontFamily.includes('Cinzel')), 'The page uses the approved Cinzel heading');
  assert.deepEqual(await page.evaluate(() => window.harnessDisplayRequests), ['fullscreen'], 'Play asks the host for fullscreen');
  async function openPlay() {
    if (await frame.locator('#board-sheet[open]').count()) await frame.locator('#board-sheet [aria-label="Close"]').click();
    for (let i = 0; i < 2 && !await frame.locator('[data-screen="play"]:not([hidden])').count(); i++) await frame.locator('#page-back').click();
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
  async function legacyStart(kind) {
    const board_id = await page.evaluate(() => window.harnessWidgetState?.privateContent?.board_id);
    const result = await (await page.request.post(new URL('/fixture-tool',base).href, { data: { name: 'kingdown_create', arguments: { kind, options, colour: 'white', board_id } } })).json();
    const reads = await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_get').length);
    assert(!result.isError); await page.evaluate(result => window.harnessShow(result), result);
    await page.waitForFunction(n => window.harnessCalls.filter(c => c.name === 'kingdown_get').length > n, reads);
    await idleBoard(); await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    return result;
  }
  async function handleGate(fail = false) {
    const reads = await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_get').length);
    await page.evaluate(() => {
      const saved = window.harnessWidgetState.privateContent;
      window.harnessWidgetState = { modelContent: {}, privateContent: { screen: 'play', sheet: undefined, board_id: saved.board_id, pending: { name: 'kingdown_create', args: { kind: 'friend', colour: 'white' }, game_id: window.harnessView?.game_id, screen: 'play', error: 'Harness saved send failed', error_screen: 'play' } } };
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
  const navCalls = await page.evaluate(() => window.harnessCalls.length);
  for (const [id, route] of [['solo','setup'], ['friend','setup'], ['random','lobby']]) {
    await frame.locator(`#${id}`).click(); await frame.locator(`[data-screen="${route}"]:not([hidden])`).waitFor(); await openPlay();
  }
  await frame.locator('#token').fill('K7QX2M'); await frame.locator('#join').click(); await frame.locator('[data-screen="join"]:not([hidden])').waitFor(); await openPlay();
  assert.equal(await page.evaluate(() => window.harnessCalls.length), navCalls, 'Play rows and Back change page memory without a tool call');
  assert.equal(await page.evaluate(() => JSON.stringify(window.harnessWidgetState).includes('K7QX2M')), false, 'The join code stays in page memory');
  await legacyStart('solo');
  const pollBoard = await page.evaluate(() => window.harnessWidgetState.privateContent.board_id);
  const changedBoard = await (await page.request.post(new URL('/fixture-tool', base).href, { data: { name: 'kingdown_create', arguments: { kind: 'solo', options, colour: 'black', board_id: pollBoard } } })).json();
  assert(!changedBoard.isError);
  await frame.locator('body').evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await frame.locator('#strip-me .player-name small').filter({ hasText: 'Black' }).waitFor({ timeout: 5000 });
  assert.equal(await page.evaluate(() => window.harnessView.game_id), changedBoard._meta.view.game_id, 'A poll follows the current board and gets the new game rules');
  await openPlay();
  await handleGate();
  assert.equal(await frame.locator('#presets button').count(), 17, 'The name screen has the 17 game pictures');
  assert.equal(await frame.locator('[data-screen="handle"] .quiet-line').last().innerText(), 'Each name is unique. You pick it once, at your first game against a person.');
  assert.equal(await frame.locator('#page-back').innerText(), '‹ Play');

  async function fits(screen, width) {
    await frame.locator(`[data-screen="${screen}"]:not([hidden])`).waitFor();
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
  assert.match(await savedGame.locator('.line').innerText(), /Your turn · move 1/);
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

  const backCalls = await page.evaluate(() => window.harnessCalls.length);
  await openPlay();
  assert.equal(await page.evaluate(() => window.harnessCalls.length), backCalls, 'Back changes only the page');
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
    await frame.locator('#status').filter({hasText:'Harness definitive rejection'}).waitFor();
    assert.equal(await frame.locator('#last-move').innerText(), 'Move 1.', `${code} restores the last server position and move line`);
  }
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
  const snapshot = await page.evaluate(() => window.harnessView), moveNumber = Number(snapshot.fen.split(' ')[5]);
  assert(snapshot.revision >= 2 && snapshot.revision <= 5);
  const readsBeforeRemount = await page.evaluate(() => window.harnessCalls.filter(call => call.name === 'kingdown_get').length);
  await page.locator('#remount').click();
  await page.waitForFunction(count => window.harnessCalls.filter(call => call.name === 'kingdown_get').length > count, readsBeforeRemount);
  await frame.locator('#last-move').filter({ hasText: `Move ${moveNumber}` }).waitFor();
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
  await frame.locator('#last-move').filter({ hasText: `Move ${moveNumber}` }).waitFor();
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
  const friendTool = async (name,args={}) => (await page.request.post(new URL('/fixture-friend-tool',base).href,{data:{name,arguments:args}})).json();
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
  await frame.locator('[data-screen="profile"]:not([hidden])').waitFor(); assert.equal(await frame.locator('#over').isVisible(),false);
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
    await frame.locator('#context-actions #accept-draw').click(); await frame.locator('#board-sheet').getByRole('button',{name:'Accept',exact:true}).click();
    await frame.locator('#over.end-card[open] h2').filter({hasText:'Draw'}).waitFor(); await idleBoard();
    if (mode==='fixture') { await frame.locator('.end-facts').filter({hasText:'1561?'}).waitFor(); assert.match(await frame.locator('.end-facts').innerText(),/\+61/); assert.match(await frame.locator('.new-badge img').getAttribute('src'),/badge-fairy-tale-/); }
    current=await page.evaluate(()=>window.harnessView);
    const buddyOffer=await friendTool('kingdown_rematch',{game_id:human.game_id,command_id:randomUUID(),expected_revision:current.revision,choice:'offer'}); assert(!buddyOffer.isError); const offeredEnd=await readGame();
    for(const deleted of [true,false]) {
      await page.evaluate(({view,deleted})=>{window.holdNext='kingdown_get'; window.harnessNextView={...view,rules:undefined,opponent:{...view.opponent,deleted}};},{view:offeredEnd,deleted});
      await page.clock.fastForward(3100); await page.waitForFunction(()=>typeof window.releaseHeld==='function');
      assert(await frame.locator('#page-back').isEnabled(),'An end poll leaves controls enabled'); await page.evaluate(()=>window.releaseHeld());
      await frame.locator('#over').getByRole('button',{name:'Accept',exact:true}).waitFor({state:deleted?'detached':'visible',timeout:3000});
    }
    await frame.locator('#over').getByRole('button',{name:'Decline',exact:true}).click(); await idleBoard(); current=await page.evaluate(()=>window.harnessView); assert.equal(current.rematch_offer,null);
    await frame.locator('#over').getByRole('button',{name:'Rematch',exact:true}).click(); await idleBoard(); current=await page.evaluate(()=>window.harnessView);
    assert.equal(await frame.locator('#over').getByRole('button',{name:'Rematch',exact:true}).count(),0,'An offer has no second Rematch button');
    const buddyAccept=await friendTool('kingdown_rematch',{game_id:human.game_id,command_id:randomUUID(),expected_revision:current.revision,choice:'accept'}); assert(!buddyAccept.isError);
    await page.clock.fastForward(31000); await page.waitForFunction(id=>window.harnessView.game_id!==id,human.game_id); await idleBoard();
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
    await openPlay(); await legacyStart('friend'); await idleBoard();
    await frame.locator('#status').filter({ hasText: 'Waiting for your friend' }).waitFor();
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
    await openPlay(); await legacyStart('friend'); await idleBoard();
    await frame.locator('#status').filter({ hasText: 'Waiting for your friend' }).waitFor();
    await menuAction('invite'); await idleBoard();
    const code = /^Share this code: ([A-HJKMNP-Z2-9]{6})$/.exec(await frame.locator('#invitation').innerText())?.[1]; assert(code);
    const joined = await friendTool('kingdown_join',{code});
    assert(!joined.isError);
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
      return window.harnessShow({ content: [], structuredContent: { game_id: base.game_id, board_id }, _meta: { view: base } }, true);
    }, { base: routeBase, board_id: routeBoard, status, kind, options });
    await page.waitForFunction(n => window.harnessCalls.filter(c => c.name === 'kingdown_get').length > n, reads);
    await frame.locator(`[data-screen="${screen}"]:not([hidden])`).waitFor();
    await page.waitForFunction(() => document.querySelector('iframe').contentDocument.querySelector('#reload').disabled === false);
  }
  const routes = ['home','play','setup','friend','join','wait','lobby','seat','board','end','profile','collection','settings','handle'];
  assert.deepEqual(await frame.locator('[data-screen]').evaluateAll(els => els.map(el => el.dataset.screen).sort()), [...routes].sort());
  for (const [width,height] of [[390,844],[400,900],[1440,900]]) {
    await page.setViewportSize({width,height});
    for (const screen of routes) {
      const reads = await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_get').length);
      const settingsReads = await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_settings').length);
      await page.evaluate(screen => { window.harnessWidgetState = { modelContent: {}, privateContent: { screen, sheet: undefined, board_id: window.harnessWidgetState.privateContent.board_id, pending: undefined } }; }, screen);
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
      assert(error.isError && !error.structuredContent?.board_id && !error._meta?.preview);
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
    assert.equal(await waitingRow.locator('.row-title').textContent(), 'Waiting for an opponent');
    assert.match(await waitingRow.locator('.line').textContent(), /Open for 0 hours/);
    assert.equal(await waitingRow.locator('.row-ico use[href="#i-clock"]').count(), 1);
    const home = await tool('kingdown_open');
    reads = await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_get').length);
    await page.evaluate(result => window.harnessShow(result), home);
    await frame.locator('#home-card').waitFor();
    assert.equal(await frame.locator('#home-line').innerText(), `Your move in ${home.structuredContent.your_turn_count} games.`);
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
    assert.equal((await tool('kingdown_get',{board_id:shown.structuredContent.board_id}))._meta.view.game_id,open._meta.view.game_id);
    const resumed = await tool('kingdown_resume',{board_id:shown.structuredContent.board_id,game_id:rematch._meta.view.rematch_game_id}); assert(!resumed.isError); await page.evaluate(r=>window.harnessShow(r),resumed);
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
      await page.evaluate(value=>{window.harnessNextView=value; return window.harnessShow({content:[],structuredContent:{board_id:window.harnessWidgetState.privateContent.board_id,game_id:value.game_id,screen:'board'},_meta:{view:value}});},value);
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
  await page.waitForFunction(() => window.harnessWidgetState?.modelContent?.revision === 0);
  await frame.locator('#status').filter({ hasText: 'Your move' }).waitFor();
  assert.equal(await page.evaluate(() => window.harnessWidgetState.modelContent.revision), 0, 'Hosts without widget state still receive standard model context');
  if (mode === 'fixture') {
  await page.goto(new URL('/?terminal=1', base).href);
  await frame.locator('#status').filter({ hasText: 'Checkmate' }).waitFor();
  assert.equal(await frame.locator('#computer').isVisible(), false);
  assert.equal(await frame.locator('#choices button').count(), 0);
  }
  await page.evaluate(() => window.harnessTeardown());
  assertNoErrors();
  console.log(`Harness mode: ${mode}`);
  console.log(`PASS: chat join preview and code-error mounts, shared private games rows, home card, fullscreen request, Settings remount, 4 viewport widths, 14 route remounts, four widget fields, background reads, all piece SVGs and threat endpoints in both seats, safe areas, theme, touch, handle gate and 17 pictures, SDK AppBridge initialization, painted board move, iframe remount with identical FEN/revision, Haste ambiguity, lost-reply same-ID retry committed once, bounded computer turn, definitive rejection recovery, match switch recovery, ${capabilities.friend ? 'friend join/reply polling, ' : ''}no fullscreen control, 390px touch moves, no page errors${mode === 'fixture' ? ', terminal fixture' : ', real HTTP MCP and PostgreSQL'}`);
} catch (error) {
  console.error('Page check state:', await page.evaluate(() => ({ screen: window.harnessWidgetState?.privateContent?.screen, pending: window.harnessWidgetState?.privateContent?.pending?.name, view: window.harnessView && { status: window.harnessView.status, kind: window.harnessView.kind, speed: window.harnessView.speed, revision: window.harnessView.revision, turn: window.harnessView.turn, seat: window.harnessView.seat, opponent: window.harnessView.opponent, server_now: window.harnessView.server_now, commands: window.harnessView.last_commands.map(c => ({ seat: c.seat, at: c.at })) }, calls: (window.harnessCalls ?? []).slice(-6).map(c => c.name) })));
  console.error('Board check state:', await page.frameLocator('iframe').locator('body').evaluate(() => ({ hidden: document.hidden, status: document.querySelector('#status').textContent, error: document.querySelector('#error').textContent, reloadDisabled: document.querySelector('#reload').disabled })));
  assertNoErrors(); throw error;
} finally { await browser.close(); unregister(); }
