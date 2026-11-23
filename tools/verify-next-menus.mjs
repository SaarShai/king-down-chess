// The menus and sides repair. Run through check:browser next-menus, or with PLAYABLE_URL and PLAYABLE_OUT.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { assertNoErrors, env, launch, trapErrors } from './lib/checks.mjs';

const { outputFiles: [copy] } = await build({
  stdin: {
    resolveDir: fileURLToPath(new URL('../', import.meta.url)),
    contents: `
      export { text, panelText, pieces } from './src/interface/play/texts.ts';
      export { homeText } from './src/interface/play/home.ts';
      export { sideText } from './src/interface/play/sides.ts';
      export { SETTING_ORDER } from './src/interface/play/menus.ts';
      export { POWER_NAME } from './src/powers-ui.ts';
      export { M, N } from './src/rules/engine.ts';
      export { rulesOf } from './src/interface/play/saved.ts';`,
  },
  bundle: true, platform: 'node', format: 'esm', write: false, loader: { '.svg': 'text' },
});
const { text, panelText, pieces, homeText, sideText, SETTING_ORDER, POWER_NAME, M, N, rulesOf } =
  await import('data:text/javascript;base64,' + Buffer.from(copy.contents).toString('base64'));

const browser = await launch(), out = env('PLAYABLE_OUT');
mkdirSync(out, { recursive: true });
const sizes = (process.env.MENUS_SIZES || '360x640,375x667,390x844,430x932,667x375,844x390,932x430,768x1024,820x1180,1024x768,1180x820,1366x1024,1280x720,1440x900,1920x1080,2560x1440,320x568').split(',');
const NEXT = new URL('next.html', env('PLAYABLE_URL')).href, MAIN = '.play-home .kd-button[data-kind="main"]';
const results = [];
const ready = page => page.waitForFunction(() => { const g = document.querySelector('.play-game'); return g?.style.visibility !== 'hidden' && g?.dataset.state === 'ready' && !document.querySelector('.play-home, .play-versus'); });
const saved = page => page.evaluate(() => localStorage.getItem('kingdown.save'));
const sameSave = (a, b) => {
  if (!a || !b) return a === b;
  const x = JSON.parse(a), y = JSON.parse(b);
  delete x.summary; delete y.summary;
  return JSON.stringify(x) === JSON.stringify(y);
};
const order = page => page.locator('[data-setting]').evaluateAll(nodes => nodes.map(n => n.dataset.setting));
const shot = async (page, name) => {
  await page.waitForTimeout(650); // Capture the settled page, after the sheet and dialog departure.
  return page.screenshot({ path: join(out, `${page.viewportSize().width}x${page.viewportSize().height}-${name}.png`) });
};
// Each rendered line, from actual character rectangles. A ch value alone does not set the character count.
const lines = (page, selector) => page.locator(selector).evaluateAll(nodes => nodes.flatMap(node => {
  const rows = new Map(), walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) { const text = walker.currentNode; for (let i = 0; i < text.length; i++) {
    const range = document.createRange(); range.setStart(text, i); range.setEnd(text, i + 1);
    const r = range.getBoundingClientRect(); if (!r.height) continue;
    const y = Math.round(r.top); rows.set(y, (rows.get(y) || '') + text.textContent[i]);
  } }
  return [...rows.values()].map(line => line.trim().length);
}));
// An empty set fails: a stale selector must not pass.
const unbroken = (page, target) => (typeof target === 'string' ? page.locator(target) : target).evaluateAll(nodes => nodes.length > 0 && nodes.every(node => {
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) { const text = walker.currentNode; for (const match of text.textContent.matchAll(/\S+/g)) {
    const range = document.createRange(); range.setStart(text, match.index); range.setEnd(text, match.index + match[0].length);
    if (new Set([...range.getClientRects()].map(r => Math.round(r.top))).size > 1) return false;
  } } return true;
}));
// A stored session and a stand-in server: no network and no real account. An online game request stays pending.
const invite = (id, handle) => ({ revision: 1, invite_id: id, game_id: `game-${id}`, direction: 'incoming', recipient_id: 'u-tester', player: { user_id: `u-${handle}`, handle, icon: null }, options: null, expires_at: new Date(Date.now() + 864e5).toISOString(), state: 'open' });
async function signedIn(context, invites, redeem, polls = {}) {
  await context.addInitScript(() => {
    const now = Math.floor(Date.now() / 1000);
    localStorage.setItem('kingdown.auth', JSON.stringify({ access_token: 'local-check', token_type: 'bearer', expires_in: 86400, expires_at: now + 86400, refresh_token: 'local-check', user: { id: 'u-tester', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' } }));
  });
  await context.route(/supabase\.co/, route => route.abort());
  await context.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname, json = body => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
    if (path === '/api/me/settings') return json({ settings: {}, me: { handle: 'tester', icon: null } });
    if (path === '/api/me/games') return polls.held ? polls.held.then(() => json({ games: [], invitations: invites })) : json({ games: [], invitations: invites });
    if (path === '/api/me/record') return json({ handle: 'tester', icon: null, record: {}, blocks: [], history: [], next_before: null, next_blocks_after: null });
    if (path === '/api/invites/redeem' && redeem) return redeem(json);
    if (path.startsWith('/api/games/')) return;
    return route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
  });
}
//Accept, open New game, then press `action`. The page holds every Back in window.kdBacks, and home polls wait, until
// the app has handled the late invite reply: only that reply can remove the invite row. The route must wait for the
// Back. `preload` starts a local game first, so a faulty local start fails at once instead of after a slow import.
// `reopen` presses New game again while the Back is held: the panel waits, and the game route goes first.
const openSetup = page => page.locator('.home-summary:visible, .home-side-new:visible').first();
const backHome = () => text.backTo(text.homeLabel);
// The house tint of each seat (own, opponent), and the feet line: both figure boxes end on the same line.
const seatTints = setup => setup.locator('.setup-figures').evaluate(node => `${node.dataset.own ?? ''},${node.dataset.opponent ?? ''}`);
const tintTime = setup => setup.locator('.setup-figures').evaluate(node => getComputedStyle(node).transitionDuration);
const feetLevel = setup => setup.locator('.setup-figure').evaluateAll(nodes => nodes.length === 2 && Math.abs(nodes[0].getBoundingClientRect().bottom - nodes[1].getBoundingClientRect().bottom) < 1);
async function panelRace(page, context, check, action, game, { preload = false, reopen = false } = {}) {
  const invites = [{ ...invite('i1', 'ada'), game_id: game }], polls = {};
  let release; const held = new Promise(done => { release = done; });
  await signedIn(context, invites, async json => { await held; invites.length = 0; return json({ game_id: game, revision: 1, status: 'setup', seat: 0, kind: 'person', action: 'wait', deadline_at: null }); }, polls);
  await page.goto(NEXT); await page.waitForSelector('.home-invite-row');
  const newGame = () => openSetup(page), panel = page.locator('dialog.new-game-panel');
  if (preload) {
    await newGame().click(); await page.waitForSelector('dialog.new-game-panel[open]');
    await panel.getByRole('button', { name: homeText.startGame, exact: true }).click(); await ready(page);
    await page.goBack(); await page.waitForSelector('.home-invite-row');
    await page.waitForTimeout(650); // Start blocks page clicks for --dur-sheet-in + 300 ms (begin() in home.ts)
  }
  let openPolls; polls.held = new Promise(done => { openPolls = done; });
  await page.evaluate(() => {
    const back = history.back.bind(history); window.kdBacks = []; history.back = () => { window.kdBacks.push(back); };
    if (window.navigation) {
      const traverse = navigation.traverseTo.bind(navigation);
      navigation.traverseTo = key => {
        const committed = new Promise(done => { window.kdBacks.push(() => { traverse(key); done(); }); });
        return { committed, finished: committed };
      };
    }
  });
  const start = await page.evaluate(() => history.length), save = await saved(page);
  await page.getByRole('button', { name: 'Accept', exact: true }).click();
  await newGame().click(); await page.waitForSelector('dialog.new-game-panel[open]');
  await panel.getByRole('button', { name: action, exact: true }).click();
  check(await page.waitForFunction(() => window.kdBacks.length === 1).then(() => true, () => false), `the Back of ${action} is held`);
  release();
  check(await page.waitForFunction(() => !document.querySelector('.home-invite-row')).then(() => true, () => false), 'the late reply reaches the app while the Back is held');
  check(await page.evaluate(() => !location.hash.startsWith('#online') && document.body.dataset.page === 'home'), 'the route waits for the held Back');
  if (reopen) {
    await newGame().click();
    check(await page.locator('dialog.new-game-panel[open]').count() === 0, 'New game waits for the held Back');
    if (await page.locator('dialog.new-game-panel[open]').count()) await panel.getByRole('button', { name: backHome(), exact: true }).click();
  }
  await page.evaluate(() => { while (window.kdBacks.length) window.kdBacks.shift()(); });
  check(await page.waitForFunction(id => location.hash === `#online=${id}`, game, { timeout: 5000 }).then(() => true, () => false), 'the reply opens the online game after the Back');
  await page.waitForTimeout(500); // a wrong order returns to Play, opens a panel or starts a local game here
  check(await page.evaluate(id => location.hash === `#online=${id}` && document.body.dataset.page === 'game' && !document.querySelector('.play-game'), game), 'the online game stays open');
  // A preload leaves the local game as a forward entry, which the panel entry replaces.
  check(await page.evaluate(n => history.length === n && !document.querySelector('dialog.new-game-panel') && window.kdBacks.length === 0, start + (preload ? 0 : 1)), 'one history entry for the game, no panel, no other Back');
  check(await saved(page) === save, 'no local game is written');
  openPolls();
}
// An online game with a power and four cards for each side. `answer` holds the game view; the page reads it at each request.
const HAND = ['IceWall', 'Haste', 'Salvation', 'MirrorB'], ONLINE = '00000000-0000-4000-8000-0000000000aa';
const onlineRules = rulesOf('both', [{ king: 'Spirit', power: 'HolyLight' }, { king: 'Shadow', power: 'DeathTouch' }], [HAND, HAND]);
const onlineView = (extra = {}) => { const at = new Date().toISOString(); return { game_id: ONLINE, rating_policy: 'casual', revision: 7, created_at: at, server_now: at, abort_open: false, seat: 0, kind: 'friend', speed: 'daily', days_per_move: 3,
  status: 'playing', turn: 0, action: 'ready', in_check: false, legal: [], last_commands: [], draw_offer: null, rematch_allowed: true, rematch_game_id: null, rematch_offer: null,
  deadline_at: new Date(Date.now() + 2.5 * 864e5).toISOString(), fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', rules: onlineRules, kings: onlineRules.kings, hands: onlineRules.hands,
  history: { initial_fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', actions: [] },
  opponent: { handle: 'test-b', icon: 'frost', avatar: null, computer: false, deleted: false, last_seen_ms: 0 }, ...extra }; };
async function openOnline(page, context, answer) {
  await signedIn(context, []);
  await page.route(`**/api/games/${ONLINE}**`, route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/seen')) return route.fulfill({ status: 204 });
    if (path === `/api/games/${ONLINE}` && route.request().method() === 'GET') return answer.status ? route.fulfill({ status: answer.status, contentType: 'application/json', body: JSON.stringify({ code: 'UNAUTHENTICATED', message: 'Sign in again' }) }) : route.fulfill({ json: answer.view });
    return route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
  });
  await page.goto(`${NEXT}#online=${ONLINE}`);
  await page.waitForSelector('.play-game:has(.play-hand > .play-card:nth-child(4):last-child) .play-own .play-power');
}
const handTop = page => page.locator('.play-own').evaluate(n => Math.round(n.getBoundingClientRect().top));
// The notice and each of its controls show whole: one line of notice, no scroll in the status, each control inside the viewport.
// The status has room for one notice line only (83 px at 320x568 and 360x640): a second line needs a scroll.
const noticeWhole = page => page.locator('.online-status').evaluate(status => status.scrollHeight <= status.clientHeight + 1
  && [...status.querySelectorAll('.online-actions p')].every(p => p.getBoundingClientRect().height <= 19)
  && [...status.querySelectorAll('.kd-button')].every(b => { const r = b.getBoundingClientRect(), s = status.getBoundingClientRect(); return r.top >= s.top - 1 && r.bottom <= Math.min(s.bottom, innerHeight) + 1; }));
const cases = {
  async code_fault(page, context, check) {
    const pattern = /\/assets\/board-api-[\w-]+\.js$/;
    await context.route(pattern, r => r.abort());
    await page.goto(NEXT); await page.locator(MAIN).click(); if (await page.locator('dialog.new-game-panel[open]').count()) await page.getByRole('button', { name: homeText.startGame, exact: true }).click();
    await page.waitForFunction(() => document.querySelector('body > .kd-sr')?.textContent.includes('The board cannot load.'));
    check(await page.locator('.home-load-fault').isVisible(), 'the board-code fault has a visible line');
    check(await page.locator('.home-load-fault').textContent().catch(() => '') === text.loadFailed, 'the visible line names the safe step');
    check(await saved(page) === null, 'the failed load writes no game');
    await shot(page, 'code-fault');
    await context.unroute(pattern); await page.locator(MAIN).click(); if (await page.locator('dialog.new-game-panel[open]').count()) await page.getByRole('button', { name: homeText.startGame, exact: true }).click(); await ready(page);
    check(await page.locator('.home-load-fault').count() === 0, 'a new press clears the fault and opens the game');
  },
  async font_fault(page, context, check) {
    await context.route('**/fonts/alegreya-sans-bold-latin.woff2', r => r.abort());
    await page.goto(NEXT); await page.waitForSelector('.play-home');
    await page.waitForTimeout(250);
    check(await page.locator('#boot-fault').count() === 0, 'a failed font does not show a page-code fault');
  },
  async home_art(page, context, check) {
    await context.route('**/ui/pieces/*.webp', r => r.abort());
    await page.goto(NEXT); await page.waitForSelector('.play-home');
    const video = page.locator('.home-reveal-video[data-ready]');
    await video.waitFor();
    check(await page.locator('.home-brand').evaluate(node => Number(getComputedStyle(node).opacity) === 0),
      'the Home title clears the film lettering while it plays');
    check(await video.evaluate(node => {
      if (getComputedStyle(node).objectFit !== 'contain') return true;
      const filmHeight = Math.min(node.parentElement.clientHeight, node.clientWidth * node.videoHeight / node.videoWidth);
      return Math.abs(node.clientHeight - filmHeight) <= 1;
    }), 'the wide bottom feather meets the film edge');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(250);
    check(await page.locator('.home-army-block').count() === 0, 'the removed next-army block stays absent');
    await openSetup(page).click();
    await page.getByRole('button', { name: panelText.more, exact: true }).click();
    await page.getByRole('radio', { name: panelText.pool, exact: true }).click();
    check(await page.locator('.pool-row').evaluateAll(rows => rows.length === 15 && rows.every(row => row.textContent.trim())), 'each piece option keeps its name when art fails');
    check(await unbroken(page, '.pool-row > span'), 'piece names keep whole words');
    await shot(page, 'home-art');
  },
  async panel(page, context, check) {
    await page.goto(NEXT); await page.waitForSelector('.play-home');
    const before = await saved(page), choices = await page.locator('.home-summary').innerText();
    await openSetup(page).click();
    await page.getByRole('button', { name: panelText.more, exact: true }).click();
    const sides = page.getByRole('radiogroup', { name: homeText.side, exact: true });
    await sides.scrollIntoViewIfNeeded();
    check(await unbroken(page, sides.getByRole('radio')), 'side labels keep each word on one line');
    await shot(page, 'panel');
    await sides.getByRole('radio', { name: sideText.dark, exact: true }).click();
    await page.getByRole('button', { name: text.close, exact: true }).click();
    await page.getByRole('button', { name: backHome(), exact: true }).click();
    await page.waitForFunction(() => !history.state?.layer);
    check(await saved(page) === before && await page.locator('.home-summary').innerText() === choices, 'Close keeps the save and choices');
    await shot(page, 'panel-closed');
  },
  async friend_side(page, context, check) {
    // Play a friend: sides are random, so the seats name no side with Powers and Cards off.
    await page.goto(NEXT); await page.waitForSelector('.play-home');
    await page.getByRole('button', { name: text.friend, exact: true }).click();
    const setup = page.locator('dialog.new-game-panel[open]');
    for (const name of ['Powers', text.cards]) {
      const toggle = setup.getByRole('switch', { name, exact: true });
      if (await toggle.getAttribute('aria-checked') === 'true') await toggle.click();
    }
    const seats = await setup.locator('.setup-figures').innerText();
    check(!/Light|Dark/.test(seats), `the friend seats name no side: ${seats.replace(/\s+/g, ' ')}`);
    // A random side shows no side: both seats show the same grey figure.
    const figures = await setup.locator('.setup-figure').evaluateAll(nodes => nodes.map(node =>
      ({ src: node.querySelector('img')?.getAttribute('src') ?? '', random: node.classList.contains('setup-figure-random') })));
    check(figures.length === 2 && figures.every(figure => figure.src === '/ui/pieces/king-shadow-w.webp'), `both friend seats show the same side-less king: ${JSON.stringify(figures)}`);
    check(figures.every(figure => figure.random), 'both friend seat figures are grey');
    check(await seatTints(setup) === ',', 'a random side has no house tint');
    // A tint layer paints its full box on each frame of a sheet slide (WebKit CI, no GPU): no tint, no layer.
    const tintLayers = await setup.locator('.setup-figures').evaluate(node => ['::before', '::after'].map(part => getComputedStyle(node, part).content).join() + ' ' + getComputedStyle(node).isolation);
    check(tintLayers === 'none,none auto', `no tint draws no tint layer: ${tintLayers}`);
    // Each extra layer under the slide costs the same CPU-only WebKit: plinths and crest are backgrounds, the row is static.
    const stone = await setup.locator('.setup-figures, .setup-figure, .setup-vs').evaluateAll(nodes => nodes.map(node => getComputedStyle(node).position + ' ' + getComputedStyle(node, '::before').content).join());
    check(stone === 'static none,relative none,static none,relative none', `plinths and crest draw no layer: ${stone}`);
    check(/^0s/.test(await tintTime(setup)), 'reduced motion: the tint has no transition');
    check(await feetLevel(setup), 'both plinths share one baseline');
    // At 150% text "Random side" wraps in one seat only: the plinths still share one line. A short landscape has none.
    await page.evaluate(() => { document.documentElement.style.fontSize = '150%'; });
    const short = page.viewportSize().height <= 500;
    const plinths = await setup.locator('.setup-figure').evaluateAll(nodes => nodes.map(node => getComputedStyle(node).backgroundImage.slice(0, 8)));
    check(plinths.every(image => image === (short ? 'none' : 'url("da')), `a short landscape has no plinth: ${plinths}`);
    check(short || await feetLevel(setup), 'both plinths share one baseline at 150% text');
    await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
    await shot(page, 'friend-side');
  },
  async seat_tint(page, context, check) {
    // A known king has a quiet house tint only with Powers on. The tint changes in 180 ms (friend_side: reduced motion has none).
    await page.goto(NEXT); await page.waitForSelector('.play-home');
    await openSetup(page).click();
    const setup = page.locator('dialog.new-game-panel[open]'), powers = setup.getByRole('switch', { name: 'Powers', exact: true });
    if (await powers.getAttribute('aria-checked') !== 'true') await powers.click();
    const own = await setup.locator('#setup-own-king').innerText();
    check(new RegExp(await seatTints(setup).then(t => t.split(',')[0]), 'i').test(own) && /^\w+,$/.test(await seatTints(setup)), `Powers on tints the known king only: ${await seatTints(setup)} for ${own}`);
    check(await feetLevel(setup), 'both plinths share one baseline');
    check(/^0\.18s/.test(await tintTime(setup)), `the tint changes in 180 ms: ${await tintTime(setup)}`);
    await powers.click();
    check(await seatTints(setup) === ',', 'Powers off removes the tint');
  },
  async panel_refresh(page, context, check) {
    // A signed-in player opens New game; a new invite arrives through the home poll and redraws Play. The open panel,
    // its draft choice and the focus stay.
    const invites = [invite('i1', 'ada')];
    await signedIn(context, invites);
    await page.goto(NEXT); await page.waitForSelector('.home-invite-row');
    const reveal = await page.locator('.home-reveal-video').elementHandle();
    const opener = openSetup(page), openerClass = await opener.evaluate(node => node.classList.contains('home-summary') ? 'home-summary' : 'home-side-new');
    await opener.click(); await page.waitForSelector('dialog.new-game-panel[open]');
    const level = page.getByRole('radiogroup', { name: text.level, exact: true });
    await level.getByRole('radio', { name: text.club, exact: true }).click();
    invites.push(invite('i2', 'bo'));
    const refreshed = await page.waitForFunction(() => document.querySelectorAll('.home-invite-row').length === 2, null, { timeout: 15000 }).then(() => true, () => false);
    check(refreshed, 'a new invite redraws Play while the panel is open');
    check(await reveal.evaluate(node => node === document.querySelector('.home-reveal-video')), 'the Home film stays in place after the refresh');
    check(await page.locator('dialog.new-game-panel[open]').count() === 1, 'the panel stays open after the refresh');
    check(await level.getByRole('radio', { name: text.club, exact: true }).getAttribute('aria-checked') === 'true', 'the draft choice stays after the refresh');
    check(await page.evaluate(() => !!document.activeElement?.closest('dialog.new-game-panel')), 'the focus stays in the panel after the refresh');
    await shot(page, 'panel-refresh');
    if (await page.locator('dialog.new-game-panel[open]').count()) {
      await page.locator('dialog.new-game-panel').getByRole('button', { name: backHome(), exact: true }).click();
      await page.waitForFunction(() => !history.state?.layer);
      const back = await page.waitForFunction(name => document.activeElement?.classList.contains(name) && document.activeElement.isConnected, openerClass, { timeout: 3000 }).then(() => true, () => false);
      check(back, 'Close returns the focus to New game on the redrawn Play');
    }
  },
  async panel_first_invite(page, context, check) {
    // No games: Play shows the setup summary. The first invite redraws Play while the panel is open.
    const invites = [];
    await signedIn(context, invites);
    await page.goto(NEXT); await openSetup(page).click(); await page.waitForSelector('dialog.new-game-panel[open]');
    invites.push(invite('i1', 'ada'));
    check(await page.waitForSelector('.home-invite-row', { timeout: 15000 }).then(() => true, () => false), 'the first invite redraws Play while the panel is open');
    check(await page.locator('dialog.new-game-panel[open]').count() === 1, 'the panel stays open after the first invite');
    await page.locator('dialog.new-game-panel').getByRole('button', { name: backHome(), exact: true }).click();
    const back = await page.waitForFunction(() => { const a = document.activeElement; return !!a?.matches('.home-summary, .home-side-new') && a.getClientRects().length > 0; }, null, { timeout: 3000 }).then(() => true, () => false);
    check(back, 'Close returns the focus to the visible New game when the large New game is gone');
  },
  async panel_accept(page, context, check) {
    // Accept, then open New game before the reply. The reply opens the online game: the panel closes, and its history
    // entry becomes the game, so Back returns to Play.
    const invites = [invite('i1', 'ada')], game = '00000000-0000-4000-8000-000000000001';
    let release; const held = new Promise(done => { release = done; });
    await signedIn(context, invites, async json => { await held; invites.length = 0; return json({ game_id: game, revision: 1, status: 'setup', seat: 0, kind: 'person', action: 'wait', deadline_at: null }); });
    await page.goto(NEXT); await page.waitForSelector('.home-invite-row');
    const start = await page.evaluate(() => history.length);
    await page.getByRole('button', { name: 'Accept', exact: true }).click();
    await openSetup(page).click(); await page.waitForSelector('dialog.new-game-panel[open]');
    release();
    check(await page.waitForFunction(id => location.hash === `#online=${id}`, game).then(() => true, () => false), 'the late reply opens the online game');
    check(await page.waitForFunction(() => !document.querySelector('dialog.new-game-panel')).then(() => true, () => false), 'the panel leaves with the route change');
    check(await page.evaluate(n => !history.state?.layer && history.length === n + 1, start), 'the game replaces the panel history entry');
    await page.goBack();
    check(await page.waitForFunction(() => document.body.dataset.page === 'home' && !location.hash.startsWith('#online')).then(() => true, () => false), 'Back from the game returns to Play');
    check(await page.locator('dialog.new-game-panel').count() === 0, 'Back shows no panel');
  },
  async panel_close_race(page, context, check) {
    // Accept, open New game, then Close: the late reply arrives while the Back of Close is still pending. The game
    // opens after that Back and stays open.
    await panelRace(page, context, check, backHome(), '00000000-0000-4000-8000-000000000002');
  },
  async panel_start_race(page, context, check) {
    // The same order with Start game: the local start stops, and no local game is written.
    await panelRace(page, context, check, homeText.startGame, '00000000-0000-4000-8000-000000000003', { preload: true });
  },
  async panel_double_reopen(page, context, check) {
    // Close, then New game twice before the Back lands: one panel opens after the Back, with one history entry.
    await page.goto(NEXT); await openSetup(page).waitFor();
    await page.evaluate(() => {
      const back = history.back.bind(history); window.kdBacks = []; history.back = () => { window.kdBacks.push(back); };
      if (window.navigation) {
        const traverse = navigation.traverseTo.bind(navigation);
        navigation.traverseTo = key => {
          const committed = new Promise(done => { window.kdBacks.push(() => { traverse(key); done(); }); });
          return { committed, finished: committed };
        };
      }
    });
    const start = await page.evaluate(() => history.length), change = openSetup(page), panel = page.locator('dialog.new-game-panel');
    await change.click(); await page.waitForSelector('dialog.new-game-panel[open]');
    await panel.getByRole('button', { name: backHome(), exact: true }).click();
    check(await page.waitForFunction(() => window.kdBacks.length === 1).then(() => true, () => false), 'the Back of Close is held');
    await change.click(); await change.click();
    check(await page.locator('dialog.new-game-panel[open]').count() === 0, 'both opens wait for the held Back');
    await page.evaluate(() => window.kdBacks.shift()());
    check(await page.waitForFunction(() => document.querySelectorAll('dialog.new-game-panel[open]').length === 1).then(() => true, () => false), 'one panel opens after the Back');
    await page.waitForTimeout(300);
    check(await page.evaluate(() => document.querySelectorAll('dialog.new-game-panel').length === 1 && history.state?.layer === true), 'only one panel and one layer entry');
    await panel.getByRole('button', { name: backHome(), exact: true }).click();
    check(await page.waitForFunction(() => window.kdBacks.length === 1).then(() => true, () => false), 'the second Close holds one Back');
    await page.evaluate(() => window.kdBacks.shift()());
    check(await page.waitForFunction(n => !history.state?.layer && history.length === n + 1 && !document.querySelector('dialog.new-game-panel'), start).then(() => true, () => false), 'Play with no panel and no extra entry');
  },
  async panel_reopen_race(page, context, check) {
    // Close, a late reply, then New game again before the Back lands: the game opens; no panel opens over it.
    await panelRace(page, context, check, backHome(), '00000000-0000-4000-8000-000000000004', { reopen: true });
  },
  async you(page, context, check) {
    await page.goto(`${NEXT}#you`); await page.waitForSelector('dialog.settings-sheet[open]');
    const settings = (await order(page)).join(',');
    check(settings === SETTING_ORDER.join(','), `settings keep one order: ${settings}`);
    check(await unbroken(page, '[data-setting="motion"] [role="radio"]'), 'Motion speed keeps each word on one line');
    check(await page.locator('[role="switch"]').evaluateAll(nodes => nodes.every(n => !n.hasAttribute('aria-describedby') && n.querySelectorAll('.kd-switch-copy > span').length === 0)), 'an empty switch description creates no empty note');
    const sound = page.getByRole('switch', { name: text.sound, exact: true }); await sound.click();
    check(await sound.getAttribute('aria-checked') === 'true' && await sound.locator('.kd-switch-state').innerText() === text.on, 'the switch state word follows its value');
    // Decision 35: a touch screen gets no hover style. One known rule is open (the help tip in help.css).
    const loose = await page.evaluate(() => {
      const found = [], scan = (rules, hover = false) => { for (const rule of rules) {
        if (rule.selectorText?.includes(':hover') && !hover) found.push(rule.selectorText);
        if (rule.cssRules) scan(rule.cssRules, hover || !!rule.conditionText?.includes('(hover: hover)'));
      } };
      for (const sheet of document.styleSheets) scan(sheet.cssRules);
      return found;
    });
    check(loose.every(rule => rule === '.daylight-help-info:is(:hover, :focus-visible)::before'), `hover rules require a hover pointer: ${loose.join(' | ')}`);
    await shot(page, 'you');
  },
  async guide(page, context, check, size) {
    const w = Number(size.split('x')[0]);
    await page.goto(`${NEXT}#guide`); await page.waitForSelector('.guide-page'); await page.evaluate(() => document.fonts.ready);
    const width = await page.locator('.guide-page').evaluate(n => { const cs = getComputedStyle(n); return n.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight); });
    check(width <= (w >= 900 ? 1120 : 640), 'the Guide content stays within its width class');
    await page.getByRole('tab', { name: text.rules, exact: true }).click(); await page.waitForTimeout(800);
    check(Math.max(...await lines(page, '.turn-steps p')) <= 70, 'turn text has at most 70 characters per line');
    await page.getByRole('tab', { name: text.pieces, exact: true }).click();
    await page.waitForSelector('nav.guide-list-pane[aria-label="Pieces"]');
    await page.locator('.guide-row', { hasText: pieces[N].name }).click();
    if (w >= 900) {
      check(await page.locator('.guide-page:not(.shell-departing) nav.guide-list-pane[aria-label="Pieces"]').count() === 1, 'the named entry list is navigation');
      check(await page.locator('.guide-page:not(.shell-departing) .guide-list-pane h2').count() === 2, 'the entry list groups new and chess pieces');
    } else {
      await page.getByRole('button', { name: text.backTo(text.pieces), exact: true }).click();
      await page.waitForTimeout(800);
      check(await page.locator('.guide-row', { hasText: pieces[N].name }).evaluate(n => { const r = n.getBoundingClientRect(); return document.activeElement === n && r.top >= 0 && r.bottom <= innerHeight; }), 'Back restores the Knight row and its focus in view');
      await shot(page, 'guide-back');
    }
    await page.getByRole('tab', { name: text.cards, exact: true }).click(); await page.locator('.guide-card').first().click(); await page.waitForTimeout(800);
    const measure = Math.max(...await lines(page, '.guide-entry-pane .learn-rule, .guide-entry-pane .learn-limits, .guide-entry-pane .learn-against'));
    check(measure <= 75, `entry text has at most 75 characters per line (${measure})`);
    await shot(page, 'guide-entry');
  },
  async guide_reload(page, context, check) {
    await page.goto(`${NEXT}#guide`);
    await page.getByRole('tab', { name: text.pieces, exact: true }).click();
    await page.locator('.guide-row', { hasText: pieces[M].name }).click();
    const heading = page.getByRole('heading', { name: new RegExp(pieces[M].name) });
    await heading.waitFor();
    const before = await page.evaluate(async () => {
      await document.fonts.ready;
      for (let i = 0; i < 4; i++) await new Promise(done => requestAnimationFrame(done));
      scrollTo(0, document.body.scrollHeight);
      return scrollY;
    });
    const canScroll = await page.evaluate(() => document.body.scrollHeight > innerHeight);
    await page.reload();
    await heading.waitFor();
    const restored = await page.waitForFunction(y => Math.abs(scrollY - y) <= 2, before, { timeout: 4000 }).then(() => true, () => false);
    check((!canScroll || before > 0) && restored, 'the Maester entry keeps its reading position after reload');
  },
  async home_piece_close(page, context, check) {
    await page.goto(NEXT); await openSetup(page).click();
    const preview = page.getByRole('button', { name: text.cards, exact: true });
    await preview.press('Enter');
    const card = page.getByRole('button', { name: POWER_NAME.IceWall, exact: true });
    await card.press('Space');
    check(await card.getAttribute('aria-pressed') === 'false', 'Space removes the card from the pool');
    const box = await card.boundingBox(); check(box.width >= 44 && box.height >= 44, 'The card is a 44 px target');
    check(await card.evaluate(n => n === document.activeElement), 'The card keeps focus after a change');
    await page.keyboard.press('Escape');
    check(await preview.evaluate(n => n === document.activeElement), 'Escape returns focus to the Cards preview');
    await page.goBack(); check(await page.locator('dialog[open]').count() === 0, 'Browser Back closes New game');
  },
  // Online notices with a control (decision of tweaks-2): the hand keeps one place under an open reader; the notice and
  // its controls show whole; Menu asks the server for the block state.
  async notice(page, context, check, size) {
    if (!['320x568', '360x640', '390x844', '667x375'].includes(size)) return;
    const portrait = size === '320x568' || size === '360x640', answer = { view: onlineView({ draw_offer: 1 }) };
    let release; const held = new Promise(done => { release = done; }), blocks = [];
    await page.route('**/api/blocks', async route => { blocks.push(route.request().postDataJSON()); await held; return route.fulfill({ json: { blocked: true } }); });
    await openOnline(page, context, answer);
    await page.locator('.online-status .online-actions .kd-button', { hasText: 'Keep playing' }).waitFor();
    check(await page.locator('.play-game[data-online-action="true"]').count() === 1, 'a draw offer sets the mark');
    const before = await handTop(page);
    if (portrait) check(await noticeWhole(page), 'the draw offer and its controls show whole');
    await shot(page, 'draw-offer');
    await page.locator('.play-square[data-square="6"]').click();
    await page.locator('.play-reader .play-title', { hasText: 'Knight' }).waitFor();
    const reading = await handTop(page);
    check(reading === before, `the hand stays in place under a piece reader (${before} then ${reading})`);
    await shot(page, 'draw-offer-piece');
    await page.locator('.play-square[data-square="6"]').click();
    await page.locator('.online-status .online-actions .kd-button', { hasText: 'Keep playing' }).waitFor();
    check(await handTop(page) === before, 'the hand stays in place when the reader closes');
    if (size === '390x844') {
      await page.getByRole('button', { name: text.menu, exact: true }).click();
      const control = page.locator('dialog.game-menu-dialog[open] .online-menu-actions .kd-button').last();
      check(await control.evaluate(n => n.getAttribute('aria-busy') === 'true' && n.querySelector('[data-button-label]').textContent === 'Block player'), 'Menu shows a busy Block player while the server answer waits');
      release();
      check(await control.filter({ hasText: 'Unblock player' }).waitFor().then(() => true, () => false), 'Menu shows Unblock player for a blocked player');
      check(blocks.length === 1 && JSON.stringify(blocks[0]) === JSON.stringify({ game_id: ONLINE }), `Menu reads the block state once (${JSON.stringify(blocks)})`);
      await shot(page, 'menu-unblock');
      await page.keyboard.press('Escape'); await page.waitForSelector('dialog[open]', { state: 'detached' });
    }
    // The opponent's next read clears the offer: the mark goes with the notice.
    answer.view = onlineView({ revision: 8 });
    await page.evaluate(() => window.dispatchEvent(new Event('online')));
    check(await page.waitForSelector('.play-game[data-online-action="false"]').then(() => true, () => false), 'the mark goes when the offer goes');
    if (!portrait) return;
    // A lost sign-in keeps the turn on this device.
    answer.status = 401;
    await page.evaluate(() => window.dispatchEvent(new Event('online')));
    await page.locator('.online-status .kd-button', { hasText: 'Sign in again' }).waitFor({ state: 'attached' });
    if (await page.locator('dialog[open]').count()) { await page.keyboard.press('Escape'); await page.waitForSelector('dialog[open]', { state: 'detached' }); }
    check(await noticeWhole(page), 'the sign-in notice and its control show whole');
    await shot(page, 'notice-auth');
    // A saved send that this device cannot read: the turn needs a check, and Discard send shows at once.
    const second = await context.newPage();
    await second.addInitScript(() => localStorage.setItem('kingdown.account-command.u-tester', 'not a receipt'));
    await openOnline(second, context, { view: onlineView() });
    await second.locator('.online-status .kd-button', { hasText: 'Discard send' }).waitFor();
    check(await noticeWhole(second), 'the check notice and its controls show whole');
    await shot(second, 'notice-check');
    await second.close();
  },
  async menu(page, context, check, size) {
    await page.goto(NEXT); await page.locator(MAIN).click(); if (await page.locator('dialog.new-game-panel[open]').count()) await page.getByRole('button', { name: homeText.startGame, exact: true }).click(); await ready(page);
    const before = await saved(page);
    await page.getByRole('button', { name: text.menu, exact: true }).click();
    const settings = (await order(page)).join(',');
    check(settings === SETTING_ORDER.join(','), `settings keep one order: ${settings}`);
    check(await page.locator('.menu-note').count() === 0, 'a healthy save shows no warning note in Menu');
    check(await page.locator('.menu-settings').evaluate(n => n.clientHeight >= 44), 'at least one whole setting row fits');
    check(await unbroken(page, '.menu-settings [role="switch"]'), 'Menu labels keep each word on one line');
    const [w, h] = size.split('x').map(Number), landscape = w > h;
    await page.evaluate(landscape => {
      for (const [edge, value] of Object.entries(landscape ? { top: 0, left: 59, right: 59, bottom: 21 } : { top: 59, right: 0, left: 0, bottom: 34 })) document.documentElement.style.setProperty(`--safe-${edge}`, `${value}px`);
      window.dispatchEvent(new Event('resize'));
    }, landscape);
    const rect = await page.locator('.play-game').boundingBox();
    check(rect.x >= (landscape ? 59 : 0) && rect.y >= (landscape ? 0 : 59) && rect.x + rect.width <= w - (landscape ? 59 : 0) + 1 && rect.y + rect.height <= h - (landscape ? 21 : 34) + 1, 'the game and Menu use the safe-area variables');
    await page.waitForTimeout(200); await shot(page, 'safe-menu');
    await page.getByRole('button', { name: text.homeLabel, exact: true }).click(); await page.waitForSelector('.play-home');
    check(sameSave(await saved(page), before), 'an immediate Menu exit keeps the save');
    await page.locator(MAIN).click(); if (await page.locator('dialog.new-game-panel[open]').count()) await page.getByRole('button', { name: homeText.startGame, exact: true }).click(); await ready(page);
    await page.getByRole('button', { name: text.menu, exact: true }).click(); await page.getByRole('button', { name: text.resign, exact: true }).click();
    await page.locator('dialog[open]').getByRole('button', { name: text.resign, exact: true }).click();
    await page.waitForSelector('.play-result', { state: 'attached' });
    check(await page.locator('.play-result-actions .kd-button').evaluateAll(nodes => nodes.every(n => !getComputedStyle(n).textDecorationLine.includes('underline'))), 'result controls have no underline');
  },
  async rematch_art(page, context, check) {
    // Rematch must request a king still that the first game does not use.
    await context.addInitScript(() => localStorage.setItem('kingdown.setup', 'powers'));
    await page.goto(NEXT); await page.locator(MAIN).click(); if (await page.locator('dialog.new-game-panel[open]').count()) await page.getByRole('button', { name: homeText.startGame, exact: true }).click(); await ready(page);
    await page.getByRole('button', { name: text.menu, exact: true }).click(); await page.getByRole('button', { name: text.resign, exact: true }).click();
    await page.locator('dialog[open]').getByRole('button', { name: text.resign, exact: true }).click();
    await page.waitForSelector('.play-result', { state: 'attached' });
    await page.evaluate(() => {
      const used = JSON.parse(localStorage.getItem('kingdown.save')).rules.kings.map(k => k.king);
      const index = ['Frost', 'Flame', 'Stratus', 'Mud'].findIndex(king => !used.includes(king));
      Math.random = () => (index + .1) / 6;
    });
    let failed = 0; await context.route('**/ui/pieces/*.webp', r => { failed++; return r.abort(); });
    // The base result layout has no height at 667x375. This case tests the retained board callback only.
    const rematch = page.locator('.play-result-actions button').first();
    if (await rematch.isVisible()) await rematch.click(); else await rematch.evaluate(n => n.click());
    await ready(page);
    check(failed > 0, 'the rematch asks for a new still');
    check(await page.locator('.play-board-host canvas').isVisible(), 'the board draws after a rematch art fault');
    check(await page.locator('.play-fault').count() === 0, 'the rematch can play after a failed still');
    await shot(page, 'rematch-art');
  },
};
try {
  const only = process.env.MENUS_CASES ? process.env.MENUS_CASES.split(',') : null;
  const list = !process.env.MENUS_SIZES && only?.length === 1 && only[0] === 'notice'
    ? ['320x568', '360x640', '390x844', '667x375'] : sizes;
  for (const size of list) for (const [name, run] of Object.entries(cases)) {
    if (only && !only.includes(name)) continue;
    const [width, height] = size.split('x').map(Number), context = await browser.newContext({ viewport: { width, height }, reducedMotion: ['guide', 'home_art', 'seat_tint'].includes(name) ? 'no-preference' : 'reduce' });
    const page = await context.newPage(), failures = [], errors = [];
    page.setDefaultTimeout(12000);
    const trapped = trapErrors(page);
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', e => errors.push(e.message));
    const check = (ok, label) => { if (!ok) failures.push(label); };
    try { await run(page, context, check, size); } catch (e) { failures.push(String(e)); }
    // Only these fault cases deliberately abort requests (notice: a 401 read and the aborted account project). A page exception is never expected.
    if (!['code_fault', 'font_fault', 'home_art', 'rematch_art', 'notice'].includes(name)) {
      try { assertNoErrors(trapped); } catch (e) { failures.push(String(e)); }
      check(errors.length === 0, `no console error: ${errors.join('; ')}`);
    } else check(!errors.some(e => !/Failed to load resource|Load failed|net::ERR_FAILED/.test(e)), `only blocked requests fail: ${errors.join('; ')}`);
    const result = { size, name, failures, errors }; results.push(result);
    console.log(`${failures.length ? 'FAIL' : 'PASS'} ${size} ${name} ${failures.join(' | ')}`);
    await context.close();
  }
} finally { await browser.close(); writeFileSync(join(out, 'results.json'), JSON.stringify(results, null, 2)); }
if (!results.length) console.error('FAIL no menu cases ran');
process.exitCode = !results.length || results.some(r => r.failures.length) ? 1 : 0;
