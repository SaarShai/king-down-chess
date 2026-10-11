import assert from 'node:assert/strict';
import { assertNoErrors, env, launch, shot, trapErrors } from './lib/checks.mjs';
const base = env('PLAYABLE_URL');
const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1000, height: 1000 }, hasTouch: true });
trapErrors(page);
try {
  await page.addInitScript(() => { window.harnessBootDelay = 300; });
  await page.goto(base);
  const capabilities = await (await page.request.get(new URL('/harness-mode', base).href)).json();
  const mode = capabilities.mode;
  if (process.env.PLUGIN_EXPECT_MODE) assert.equal(mode, process.env.PLUGIN_EXPECT_MODE, 'Connected to the expected harness backend');
  const frame = page.frameLocator('iframe');
  async function boardBox() {
    await frame.locator('#board[aria-busy="false"]').waitFor();
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
  assert(await frame.locator('#home-play').isDisabled(), 'Play waits for the page and the host to connect');
  assert.equal(await frame.locator('#home-card button').count(), 2, 'The inline home card has only Play and Your games');
  await frame.locator('#home-play:not(:disabled)').waitFor();
  await frame.locator('[data-art]').evaluateAll(images => Promise.all(images.map(image => image.decode())));

  for (const [width,height] of [[390,844],[1440,900],[400,900],[360,844]]) {
    await page.setViewportSize({width,height});
    assert.equal(await frame.locator('body').evaluate(el=>el.scrollWidth>innerWidth), false, `Home has no horizontal scroll at ${width}px`);
    await shot(page, `shell-home-${width}-${mode}`);
  }
  await page.setViewportSize({width:1000,height:1000});
  await frame.getByRole('button', { name: 'Play', exact: true }).click();
  await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
  assert.deepEqual(await frame.locator('[data-screen="play"] .row-title').allTextContents(), ['Computer', 'A friend', 'A random player', 'Your games', 'Profile', 'Settings']);
  assert(await frame.locator('[data-screen="play"] h2').evaluate(el => getComputedStyle(el).fontFamily.includes('Cinzel')), 'The page uses the approved Cinzel heading');
  assert.deepEqual(await page.evaluate(() => window.harnessDisplayRequests), ['fullscreen'], 'Play asks the host for fullscreen');
  async function openPlay() {
    for (let i = 0; i < 2 && !await frame.locator('[data-screen="play"]:not([hidden])').count(); i++) await frame.locator('[data-screen]:not([hidden]) [data-back]').click();
    await frame.locator('[data-screen="play"]:not([hidden])').waitFor({ timeout: 5000 });
  }
  async function openScreen(screen) { await openPlay(); await frame.locator(`[data-screen="play"] [data-nav="${screen}"]`).click(); }
  await frame.locator('#random').click();
  await frame.locator('#random:not(:disabled)').waitFor();
  assert.equal(await page.evaluate(() => window.harnessCalls.at(-1).name), 'kingdown_find', 'Random uses the API contract tool');
  await page.evaluate(() => { window.requireHandleNext = true; });
  await frame.locator('#friend').click();
  await frame.locator('[data-screen="handle"]:not([hidden])').waitFor({ timeout: 5000 });
  assert.equal(await frame.locator('#presets button').count(), 17, 'The name screen has the 17 game pictures');

  async function fits(screen, width) {
    await frame.locator(`[data-screen="${screen}"]:not([hidden])`).waitFor();
    const layout = await frame.locator('body').evaluate(el => ({ overflow: el.scrollWidth > innerWidth, width: innerWidth, heading: getComputedStyle(document.querySelector(`[data-screen="${el.dataset.page}"] h2`) ?? el).fontFamily }));
    assert.equal(layout.overflow, false, `${screen} has no horizontal scroll at ${width}px`);
    assert(layout.width <= width);
    if (screen === 'handle') assert(await frame.locator('#presets').evaluate(el => {
      const box = el.getBoundingClientRect();
      return [...el.querySelectorAll('button')].every(button => { const rect = button.getBoundingClientRect(); return rect.left >= box.left && rect.right <= box.right + 1; });
    }), `All 17 pictures fit the name screen at ${width}px`);
  }
  for (const [width, height] of [[390,844], [1440,900], [400,900], [360,844]]) {
    await page.setViewportSize({width,height});
    await fits('handle', width); await shot(page, `shell-handle-${width}-${mode}`);
    for (const screen of ['play','games','profile','settings']) {
      if (screen === 'play') await openPlay(); else await openScreen(screen);
      await fits(screen, width); await shot(page, `shell-${screen}-${width}-${mode}`);
    }
    await frame.locator('[data-screen="settings"] [data-nav="handle"]').click();
  }
  await page.setViewportSize({width:1000,height:1000});
  await openScreen('games');
  const savedGame = frame.locator('#games-list button').first();
  await savedGame.waitFor();
  const savedId = await savedGame.getAttribute('data-game-id');
  await savedGame.click();
  await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
  assert.deepEqual(await page.evaluate(() => { const { name, arguments: args } = window.harnessCalls.findLast(call => call.name === 'kingdown_open'); return { name, arguments: args }; }), { name: 'kingdown_open', arguments: { screen: 'board', game_id: savedId } }, 'Your games opens the selected board through the API contract');
  await openScreen('settings');
  await page.evaluate(() => window.harnessSetContext({theme:'dark',safeAreaInsets:{top:10,right:12,bottom:20,left:12},deviceCapabilities:{touch:true}}));
  await frame.locator('body[data-theme="dark"][data-touch="true"]').waitFor();
  assert.deepEqual(await frame.locator('body').evaluate(el => ({theme:el.dataset.theme,touch:el.dataset.touch,left:getComputedStyle(document.documentElement).getPropertyValue('--safe-left')})), {theme:'dark',touch:'true',left:'12px'});
  await page.evaluate(() => window.harnessSetContext({theme:'light',safeAreaInsets:{top:0,right:0,bottom:0,left:0},deviceCapabilities:{touch:true}}));
  await frame.locator('[data-screen="settings"] [data-nav="handle"]').click();
  await frame.locator('#handle').fill('mvp_test');
  await frame.locator('#presets button[aria-label="knight"]').click();
  await frame.locator('#save-handle').click();
  await frame.locator('#status').filter({ hasText: 'Waiting for your friend' }).waitFor();
  assert.deepEqual(await page.evaluate(() => window.harnessHandle), { handle: 'mvp_test', icon: 'knight' });

  const backCalls = await page.evaluate(() => window.harnessCalls.length);
  await openPlay();
  assert.equal(await page.evaluate(() => window.harnessCalls.length), backCalls, 'Back changes only the page');
  await frame.locator('#solo').click();
  await frame.locator('#reload:not(:disabled)').waitFor();
  await frame.locator('#status').filter({ hasText: 'White to move' }).waitFor();
  // The board leaves its floor clear, as the web game and the approved sample do.
  await boardBox();
  const floorPixel = () => frame.locator('canvas').evaluate(c => [...c.getContext('2d').getImageData(1, 1, 1, 1).data].join(','));
  let floor = await floorPixel();
  for (let i = 0; i < 50 && floor !== '0,0,0,0'; i++) { await page.waitForTimeout(200); floor = await floorPixel(); }
  assert.equal(floor, '0,0,0,0', 'The plugin board shares the game’s parchment floor');
  // The art is not in the page (ticket 09): each named file loads from the plugin origin and a canvas may read it.
  const art = await frame.locator('html').evaluate(async () => {
    const urls = [...new Set(document.documentElement.innerHTML.match(/https?:\/\/[^"'`\s]+\/plugin-art\/[\w-]+\.webp/g))];
    return Promise.all(urls.map(async src => { const image = Object.assign(new Image(), { crossOrigin: 'anonymous', src }); await image.decode(); const c = document.createElement('canvas'); c.width = c.height = 8; const g = c.getContext('2d'); g.drawImage(image, 0, 0, 8, 8); g.getImageData(0, 0, 8, 8); return { src, page: new URL(src).origin === location.origin, width: image.naturalWidth }; }));
  });
  assert(art.length >= 20, 'The page names the board art and menu art'); assert(art.every(file => file.width > 0), 'Every art file decodes');
  assert.equal(art.every(file => file.page), mode === 'fixture', 'The HTTP board loads its art from the plugin origin, not the page origin');
  assert.equal(await page.content().then(html => html.includes('data:image/webp')), false);
  await shot(page, `board-art-${mode}`);
  await openScreen('settings');
  await frame.locator('#symbols-only').check();
  await page.waitForFunction(() => window.harnessWidgetState?.privateContent?.settings?.symbols_only === true, undefined, { timeout: 5000 });
  const settingsReads = await page.evaluate(() => window.harnessCalls.filter(c => c.name === 'kingdown_get').length);
  await page.locator('#remount').click();
  await page.waitForFunction(n => window.harnessCalls.filter(c => c.name === 'kingdown_get').length > n, settingsReads);
  await frame.locator('[data-screen="settings"]:not([hidden])').waitFor();
  assert(await frame.locator('#symbols-only').isChecked(), 'Symbols only survives a remount');
  await frame.locator('#symbols-only').uncheck();
  await openPlay(); await frame.locator('#solo').click(); await frame.locator('#reload:not(:disabled)').waitFor();


  const pixels = () => frame.locator('canvas').evaluate(c => {
    const data = c.getContext('2d').getImageData(0,0,c.width,c.height).data; let hash=0, red=0;
    for (let i=0;i<data.length;i+=4) { hash=(hash+data[i]*3+data[i+1]*5+data[i+2]*7+data[i+3]*11)>>>0; if(data[i]>150&&data[i+1]<110&&data[i+2]<110&&data[i+3]>0) red++; }
    return {hash,red};
  });
  async function seedBoard(scenario) {
    const seeded = await (await page.request.post(new URL(`/fixture-position?case=${scenario}`,base).href)).json(); assert(!seeded.isError);
    const reads=await page.evaluate(()=>window.harnessCalls.filter(c=>c.name==='kingdown_get').length);
    await page.evaluate(result=>window.harnessShow(result),seeded);
    await page.waitForFunction(n=>window.harnessCalls.filter(c=>c.name==='kingdown_get').length>n,reads);
    await frame.locator('#reload:not(:disabled)').waitFor(); await boardBox(); return seeded;
  }
  for (const scenario of ['threats','threats-black']) {
    const seeded = await seedBoard(scenario), plain = await pixels();
    await openScreen('settings'); await frame.locator('#show-threats').check();
    await page.evaluate(result=>window.harnessShow(result),seeded); await frame.locator('#reload:not(:disabled)').waitFor(); await boardBox();
    const threats = await pixels(); assert(threats.red > plain.red + 10, `${scenario}: Show threats draws enemy arrows to your pieces`);
    await openScreen('settings'); await frame.locator('#symbols-only').check();
    await page.evaluate(result=>window.harnessShow(result),seeded); await frame.locator('#reload:not(:disabled)').waitFor(); await boardBox();
    let flat = await pixels(); for(let i=0;i<20&&flat.hash===threats.hash;i++) { await frame.locator('canvas').evaluate(()=>new Promise(r=>requestAnimationFrame(r))); flat=await pixels(); }
    assert.notEqual(flat.hash, threats.hash, 'Symbols only replaces the painted figures'); assert(flat.red > plain.red + 10, 'Threat arrows stay on the symbols board');
    const disc = await frame.locator('canvas').evaluate((c,black) => {
      const file=black?3:4, row=6, k=c.width/960;
      return [...c.getContext('2d').getImageData(Math.round((32+(file+.5)*112+.17*112)*k),Math.round((96+(row+.5)*112-.17*112)*k),1,1).data].slice(0,3);
    }, scenario==='threats-black');
    const expected = scenario==='threats-black' ? [74,72,80] : [255,252,244];
    assert(disc.every((channel,i)=>Math.abs(channel-expected[i])<8), `The ${scenario==='threats-black'?'black':'white'} pawn shows its rulebook symbol and army colour (${disc})`);

    for (const [width,height] of [[390,844],[1440,900]]) {
      await page.setViewportSize({width,height}); await boardBox(); await fits('board',width); await shot(page, `shell-symbols-${scenario}-${width}-${mode}`);
      const bounds=await frame.locator('.board-actions').evaluate(el=>({bottom:el.getBoundingClientRect().bottom,height:innerHeight})); assert(bounds.bottom <= bounds.height-96, 'Board controls stay above the composer');
    }
    await openScreen('settings'); await frame.locator('#symbols-only').uncheck(); await frame.locator('#show-threats').uncheck();
  }
  await page.setViewportSize({width:1000,height:1000});
  await openPlay(); await frame.locator('#solo').click(); await frame.locator('#reload:not(:disabled)').waitFor(); await boardBox();
  async function clickSquare(file, rank) {
    const box = await boardBox(); assert(box);
    await page.mouse.click(box.x + (32 + (file + .5) * 112) * box.width / 960, box.y + (64 + 32 + (7 - rank + .5) * 112) * box.width / 960);
  }
  await clickSquare(4, 1);
  assert(await frame.locator('#choices button').count() > 0);
  assert(await frame.locator('#choices button').count() > 1, 'Haste and ordinary moves must stay distinct');
  for (const code of ['STALE_REVISION', 'INVALID_MOVE', 'WRONG_TURN', 'COMMAND_CONFLICT', 'MATCH_INCOMPATIBLE']) {
    await page.evaluate(code => { window.rejectNextMove = code; }, code);
    await frame.locator('#choices button[title="e2-e4"]').click();
    await frame.locator('#reload:not(:disabled)').waitFor();
    assert.equal(await frame.locator('#retry').isVisible(), false, `${code} must release the pending command`);
  }
  await page.evaluate(() => { window.dropNextMoveReply = true; });
  await frame.locator('#choices button[title="e2-e4"]').click();
  await frame.locator('#retry').waitFor();
  await page.locator('#remount').click();
  await frame.locator('#retry').waitFor();
  assert.equal(await page.evaluate(() => window.harnessView.revision), 1, 'Remount must restore the selected game and its pending command');
  await frame.locator('#reload').click();
  await frame.locator('#status').filter({ hasText: 'Black to move' }).waitFor();
  assert(await frame.locator('#retry').isVisible(), 'Reload must preserve the pending command');
  await frame.locator('#retry').click();
  await frame.locator('#retry').waitFor({ state: 'hidden' });
  const commands = await page.evaluate(() => window.harnessCalls.filter(call => call.name === 'kingdown_move').slice(-2));
  assert.equal(commands.length, 2); assert.deepEqual(commands[0].arguments, commands[1].arguments);
  assert.equal(await page.evaluate(() => window.harnessView.revision), 1, 'Lost reply and retry commit exactly once');
  await frame.locator('#status').filter({ hasText: 'Black to move' }).waitFor();
  for (let action = 0; action < 4 && await frame.locator('#computer').isVisible(); action++) {
    await frame.locator('#computer').click();
    await frame.locator('#reload:not(:disabled)').waitFor();
  }
  await frame.locator('#status').filter({ hasText: 'White to move' }).waitFor();
  const id = await page.evaluate(() => window.harnessMatchId);
  const snapshot = await page.evaluate(() => window.harnessView), moveNumber = Number(snapshot.fen.split(' ')[5]);
  assert(snapshot.revision >= 2 && snapshot.revision <= 5);
  const readsBeforeRemount = await page.evaluate(() => window.harnessCalls.filter(call => call.name === 'kingdown_get').length);
  await page.locator('#remount').click();
  await page.waitForFunction(count => window.harnessCalls.filter(call => call.name === 'kingdown_get').length > count, readsBeforeRemount);
  await frame.locator('#status').filter({ hasText: `Move ${moveNumber}` }).waitFor();
  await frame.locator('#reload:not(:disabled)').waitFor();
  assert.equal(await page.evaluate(() => window.harnessMatchId), id);
  assert.deepEqual(await page.evaluate(() => ({ revision: window.harnessView.revision, fen: window.harnessView.fen })), { revision: snapshot.revision, fen: snapshot.fen });
  assert.equal(await page.evaluate(() => window.harnessCalls.at(-1).name), 'kingdown_get', 'A replayed initial result must fetch the saved game');
  await page.evaluate(() => { window.rejectNextGet = true; });
  await page.locator('#remount').click();
  await frame.locator('#error').filter({ hasText: 'Harness saved-game read failed' }).waitFor();
  assert.equal(await frame.locator('#choices button').count(), 0, 'A failed saved-game read must not expose stale moves');
  assert(!/to move/.test(await frame.locator('#status').innerText()), 'A failed read must not show the replayed position');
  await frame.locator('#reload').click();
  await frame.locator('#status').filter({ hasText: `Move ${moveNumber}` }).waitFor();
  await frame.locator('#reload:not(:disabled)').waitFor();
  assert.equal(await frame.getByRole('button', { name: 'Fullscreen', exact: true }).count(), 0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(100);
  assert.equal(await frame.locator('body').evaluate(el => el.scrollWidth > window.innerWidth), false);
  const canvas = await boardBox(); assert(canvas && canvas.width > 250 && canvas.width <= 390);
  await openPlay(); await frame.locator('#solo').click(); await frame.locator('#reload:not(:disabled)').waitFor();
  async function tapSquare(file, rank) {
    const box = await boardBox(); assert(box);
    await page.touchscreen.tap(box.x + (32 + (file + .5) * 112) * box.width / 960, box.y + (64 + 32 + (7 - rank + .5) * 112) * box.width / 960);
  }
  await tapSquare(4, 1);
  assert.equal(await frame.locator('#move-hint').innerText(), 'Tap a marked square to move, or choose a move below.');
  await tapSquare(4, 3);
  await frame.locator('#status').filter({ hasText: 'Black to move' }).waitFor();
  assert.equal(await page.evaluate(() => window.harnessView.revision), 1, 'Touch destination commits the ordinary move once');
  await openPlay(); await frame.locator('#solo').click(); await frame.locator('#reload:not(:disabled)').waitFor();
  await tapSquare(4, 1);
  await frame.locator('#choices button').filter({ hasText: 'e2 to e4, with Haste' }).tap();
  await frame.locator('#reload:not(:disabled)').waitFor();
  assert.match(await frame.locator('#status').innerText(), /White to move/, 'Explicit Haste keeps the extra move');
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
  await frame.locator('#status').filter({ hasText: 'Black to move' }).waitFor();
  assert.equal(await page.evaluate(() => window.harnessView.revision), 2, 'Touch finishes the explicit Haste action');
  await openPlay();
  await shot(page, 'mobile');
  for (const scenario of ['archer','freeze']) {
    const seeded=await (await page.request.post(new URL(`/fixture-position?case=${scenario}`,base).href)).json(); assert(!seeded.isError);
    // A seeded friend game may count its join as a revision: compare with the seeded revision.
    const start=seeded._meta.view.revision;
    const reads=await page.evaluate(()=>window.harnessCalls.filter(c=>c.name==='kingdown_get').length);
    await page.evaluate(result=>window.harnessShow(result),seeded);
    await page.waitForFunction(n=>window.harnessCalls.filter(c=>c.name==='kingdown_get').length>n,reads);
    await frame.locator('#reload:not(:disabled)').waitFor();
    const black=scenario==='freeze';
    async function tap(file,rank) { const box=await boardBox(); await page.touchscreen.tap(box.x+(32+((black?7-file:file)+.5)*112)*box.width/960,box.y+(96+((black?rank:7-rank)+.5)*112)*box.width/960); }
    const file=black?4:2, rank=black?3:2;
    await tap(file,rank); await tap(file,rank);
    assert.equal(await frame.locator('#choices button').count(),0,`${scenario}: second tap deselects without submitting`);
    assert.equal(await page.evaluate(()=>window.harnessView.revision),start);
    await tap(file,rank);
    if (!black) { await dragOwnSquare(file,rank); assert.equal(await page.evaluate(()=>window.harnessView.revision),start,'Drag must not shoot'); await tap(2,2); await tap(2,4); }
    else { await frame.locator('#choices button').filter({hasText:/freeze/i}).click(); }
    await page.waitForFunction(r=>window.harnessView.revision===r,start+1);
    await frame.locator('#reload:not(:disabled)').waitFor();
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
    await frame.locator('#reload:not(:disabled)').waitFor();
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
  }
  await openPlay(); await frame.locator('#solo').click(); await frame.locator('#reload:not(:disabled)').waitFor();
  const deleted=await page.evaluate(()=>window.harnessView);
  await page.request.post(new URL('/fixture-delete-match',base).href,{data:{game_id:deleted.game_id}});
  await frame.locator('#reload').click(); await frame.locator('#error').filter({hasText:'deleted'}).waitFor();
  await openPlay(); await frame.locator('#solo').click(); await frame.locator('#reload:not(:disabled)').waitFor();
  const replacement=await page.evaluate(()=>window.harnessView.game_id); assert.notEqual(replacement,deleted.game_id);
  const recoveryReads=await page.evaluate(()=>window.harnessCalls.filter(c=>c.name==='kingdown_get').length);
  await page.locator('#remount').click();
  await page.waitForFunction(n=>window.harnessCalls.filter(c=>c.name==='kingdown_get').length>n,recoveryReads);
  await frame.locator('#status').filter({hasText:'White to move'}).waitFor();
  assert.equal(await page.evaluate(()=>window.harnessView.game_id),replacement,'Deleted-game recovery survives immediate remount');
  if (capabilities.friend) {
    await openPlay();
    await openPlay(); await frame.locator('#friend').click(); await frame.locator('#reload:not(:disabled)').waitFor();
    await frame.locator('#status').filter({ hasText: 'Waiting for your friend' }).waitFor();
    await page.evaluate(() => { window.holdNextGet = true; });
    await page.waitForFunction(() => typeof window.releaseHeldGet === 'function');
    assert(await frame.locator('[data-screen]:not([hidden]) [data-back]').isEnabled(), 'Background polling must not disable game controls');
    await openPlay(); await frame.locator('#solo').click();
    await frame.locator('#status').filter({ hasText: 'White to move' }).waitFor();
    await frame.locator('#reload:not(:disabled)').waitFor();
    await page.evaluate(() => { window.releaseHeldGet(); });
    await page.waitForFunction(() => window.heldGetReturned);
    await frame.locator('#status').evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.match(await frame.locator('#status').innerText(), /White to move/, 'An old friend read must not replace the newly selected solo game');
    await openPlay(); await frame.locator('#friend').click(); await frame.locator('#reload:not(:disabled)').waitFor();
    await frame.locator('#status').filter({ hasText: 'Waiting for your friend' }).waitFor();
    await frame.locator('#invite').click(); await frame.locator('#reload:not(:disabled)').waitFor();
    // The friend joins with the full link.
    const link = /^Share this link: (\S+) · or the code [A-HJKMNP-Z2-9]{6}$/.exec(await frame.locator('#invitation').innerText())?.[1]; assert.match(link, /\/j\/[A-Za-z0-9_-]{43}$/);
    const joined = await (await page.request.post(new URL('/fixture-friend-join', base).href, { data: { invitation: link } })).json();
    assert(!joined.isError);
    await frame.locator('#status').filter({ hasText: 'White to move' }).waitFor();
    await clickSquare(4, 1); await clickSquare(4, 3);
    await frame.locator('#status').filter({ hasText: 'Black to move' }).waitFor();
    const friend = await page.evaluate(() => window.harnessView);
    const replied = await (await page.request.post(new URL('/fixture-friend-move', base).href, { data: { game_id: friend.game_id, command_id: 'friend-reply', expected_revision: friend.revision, lan: 'e7-e5' } })).json();
    assert(!replied.isError);
    await frame.locator('#status').filter({ hasText: 'White to move' }).waitFor();
    assert.equal(await page.evaluate(() => window.harnessView.revision), friend.revision + 1);
    await openPlay(); await frame.locator('#solo').click(); await frame.locator('#reload:not(:disabled)').waitFor();
    assert.equal(await frame.locator('#invitation').innerText(), '');
    const invitation = await (await page.request.post(new URL('/fixture-friend-invite', base).href)).json();
    assert(!invitation.isError);
    await page.evaluate(() => { window.harnessDropWidgetWrites = true; });
    // The board's Join takes the short code too, in lower case with a dash.
    const { code } = invitation.structuredContent;
    await openPlay(); await frame.locator('#token').fill(`${code.slice(0, 3).toLowerCase()}-${code.slice(3)}`); await frame.locator('#join').click();
    await frame.locator('#status').filter({ hasText: 'You play Black' }).waitFor({ timeout: 5000 });
    const joinedView = await page.evaluate(() => window.harnessView);
    const readsBeforeJoinRemount = await page.evaluate(() => window.harnessCalls.filter(call => call.name === 'kingdown_get').length);

    await page.locator('#remount').click();
    await page.waitForFunction(count => window.harnessCalls.filter(call => call.name === 'kingdown_get').length > count, readsBeforeJoinRemount);
    await frame.locator('#status').filter({ hasText: 'You play Black' }).waitFor({ timeout: 5000 });
    assert.equal(await page.evaluate(() => window.harnessMatchId), joinedView.game_id, 'Remount must keep the joined game instead of the original solo game');
    await page.evaluate(() => { window.harnessDropWidgetWrites = false; });
    await openPlay();
    await openPlay(); await frame.locator('#solo').click(); await frame.locator('#reload:not(:disabled)').waitFor();
  }
  // A host notification can switch games independently of a pending submission.
  await clickSquare(4, 1);
  await page.evaluate(() => { window.dropNextMoveReply = true; });
  await frame.locator('#choices button[title="e2-e4"]').click(); await frame.locator('#retry').waitFor();
  // White, as the board's Solo button sends: with no colour the seat is random, and Black has no move before the computer.
  const switched = await (await page.request.post(new URL('/fixture-tool', base).href, { data: { name: 'kingdown_create', arguments: { mode: 'solo', colour: 'white' } } })).json();
  await page.evaluate(async result => { await window.harnessShow(result); }, switched);
  await frame.locator('#retry').waitFor({ state: 'hidden' });
  await clickSquare(4, 1); assert(await frame.locator('#choices button').count() > 0);
  await page.evaluate(() => { window.harnessWidgetState = { modelContent: { game_id: window.harnessMatchId } }; });
  await page.locator('#remount').click();
  await frame.locator('[data-screen="board"]:not([hidden])').waitFor({ timeout: 5000 });
  await frame.locator('#status').filter({ hasText: 'White to move' }).waitFor();
  await page.evaluate(() => { window.harnessWithoutWidgetState = true; window.harnessWidgetState = undefined; });
  await page.locator('#remount').click();
  await page.waitForFunction(() => window.harnessWidgetState?.modelContent?.game_id === window.harnessMatchId);
  await frame.locator('#status').filter({ hasText: 'White to move' }).waitFor();
  assert.equal(await page.evaluate(() => window.harnessWidgetState.modelContent.revision), 0, 'Hosts without widget state still receive standard model context');
  if (mode === 'fixture') {
  await page.goto(new URL('/?terminal=1', base).href);
  await frame.locator('#status').filter({ hasText: 'Checkmate' }).waitFor();
  assert.equal(await frame.locator('#computer').isVisible(), false);
  assert.equal(await frame.locator('#choices button').count(), 0);
  }
  assertNoErrors();
  console.log(`Harness mode: ${mode}`);
  console.log(`PASS: home card, fullscreen request, Settings remount, 4 viewport widths, symbols and threats in both seats, safe areas, theme, touch, handle gate and 17 pictures, SDK AppBridge initialization, painted board move, iframe remount with identical FEN/revision, Haste ambiguity, lost-reply same-ID retry committed once, bounded computer turn, definitive rejection recovery, match switch recovery, ${capabilities.friend ? 'friend join/reply polling, ' : ''}no fullscreen control, 390px touch moves, no page errors${mode === 'fixture' ? ', terminal fixture' : ', real HTTP MCP and PostgreSQL'}`);
} catch (error) {
  assertNoErrors(); throw error;
} finally { await browser.close(); }
