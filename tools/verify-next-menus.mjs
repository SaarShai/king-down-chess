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
      export { M, N, parseSq } from './src/rules/engine.ts';
      export { Game } from './src/game.ts';
      export { DraftTurn } from './src/interface/play/turn.ts';
      export { gameJSON } from './src/screen/save.ts';
      export { rulesOf, snapshot } from './src/interface/play/saved.ts';`,
  },
  bundle: true, platform: 'node', format: 'esm', write: false, loader: { '.svg': 'text' },
});
const { text, panelText, pieces, homeText, sideText, SETTING_ORDER, POWER_NAME, M, N, parseSq, Game, DraftTurn, gameJSON, rulesOf, snapshot } =
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
    // A reload on an open result card: Home opens when the board code cannot load.
    await page.getByRole('button', { name: text.menu, exact: true }).click(); await page.getByRole('button', { name: text.resign, exact: true }).click();
    await page.locator('dialog[open]').getByRole('button', { name: text.resign, exact: true }).click();
    await page.waitForSelector('.play-result', { state: 'attached' });
    await context.route(pattern, r => r.abort()); await page.reload();
    check(await page.waitForSelector('.play-home h1').then(() => true, () => false) && await page.locator('#boot-fault, .people-loading').count() === 0, 'a result card with no board code opens Home');
    await context.unroute(pattern);
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
  async home_wide(page, context, check, size) {
    // A desktop window (1200 px or wider, 3:2 or wider, a mouse) whose panel fits below the kings: the painting fills the
    // window and the actions sit on it. Phones, tablets, touch screens, short windows and large text keep the split layout.
    const filled = async () => {
      const { width: w, height: h } = page.viewportSize(), hero = await page.locator('.home-hero').boundingBox();
      const fit = await page.locator('.home-reveal-still').evaluate(n => getComputedStyle(n).objectFit);
      return Math.abs(hero.x) < 1 && Math.abs(hero.y) < 1 && Math.abs(hero.width - w) < 1 && hero.height >= h - 1 && fit === 'cover';
    };
    // The kings stand in the top third of the painting: in the wide layout no control reaches them, and each control is
    // 44 px high or more and inside the window. The utilities have a solid fill, no blur, and an inset focus ring at 3:1.
    const wideLayout = async label => {
      await page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
      const wide = await filled();
      if (!wide) return false;
      // The painting (16:9) covers the window; the kings end at 30% of its height.
      check(await page.locator('.home-start, .home-topbar').evaluateAll(nodes => nodes.every(n => n.getBoundingClientRect().top >= .34 * Math.max(innerHeight, innerWidth * 9 / 16))), `${label}: the actions stay below the kings`);
      check(await page.locator('.home-start .kd-button, .home-topbar .kd-button:not([hidden])').evaluateAll(nodes => nodes.every(n => {
        const r = n.getBoundingClientRect();
        return r.height >= 44 && r.width >= 44 && r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight;
      })), `${label}: each Home control is 44 px or more in width and height and inside the window`);
      const guide = page.locator('.home-guide-btn');
      await guide.focus();
      check(await guide.evaluate(n => {
        const rgb = value => { const c = document.createElement('canvas').getContext('2d'); c.fillStyle = value; c.fillRect(0, 0, 1, 1); return [...c.getImageData(0, 0, 1, 1).data]; };
        const lum = ([r, g, b]) => [r, g, b].map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
        const style = getComputedStyle(n), fill = rgb(style.backgroundColor), ring = rgb(style.outlineColor), [a, b] = [lum(fill), lum(ring)].sort((x, y) => y - x);
        return n.matches(':focus-visible') && fill[3] === 255 && style.backdropFilter === 'none' && parseFloat(style.outlineOffset) < 0 && (a + .05) / (b + .05) >= 3;
      }), `${label}: the utilities have a solid fill, no blur, and an inset focus ring at 3:1`);
      return true;
    };
    const [w, h] = size.split('x').map(Number), gate = w >= 1200 && w / h >= 1.5;
    await page.goto(NEXT); await page.waitForSelector('.play-home .home-reveal-still');
    check(await filled() === gate, `the Home painting ${gate ? 'fills' : 'does not fill'} the window`);
    if (gate) await wideLayout('new');
    // Focus order: the title, then the utilities.
    await page.locator('.home-brand h1').focus(); await page.keyboard.press('Tab');
    check(await page.evaluate(() => !!document.activeElement?.closest('.home-topbar')), 'the first Tab after the title goes to the utilities');
    if (size !== '1280x800' && size !== '1920x1080') return;
    // Both gate edges, at this height.
    for (const [edge, wide] of [[[1199, 799], false], [[1200, 800], true], [[1200, 801], false]]) {
      await page.setViewportSize({ width: edge[0], height: edge[1] });
      check(await filled() === wide, `${edge.join('x')}: the Home painting ${wide ? 'fills' : 'does not fill'} the window`);
    }
    // A resize into the wide layout loads the wide still.
    await page.setViewportSize({ width: 500, height: 1000 }); await page.reload(); await page.waitForSelector('.play-home .home-reveal-still');
    await page.setViewportSize({ width: w, height: h });
    check(await page.waitForFunction(() => document.querySelector('.home-reveal-still')?.src.endsWith('hero-wide.webp'), null, { timeout: 3000 }).then(() => true, () => false), 'a resize into the wide layout loads the wide still');
    // Touch input keeps the split layout.
    const touch = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: false }), tapped = await touch.newPage();
    await tapped.goto(NEXT); await tapped.waitForSelector('.play-home .home-reveal-still');
    check(!(await tapped.locator('.home-hero').evaluate(n => getComputedStyle(n.querySelector('.home-reveal-still')).objectFit === 'cover' && n.getBoundingClientRect().width >= innerWidth - 1)), 'a touch screen keeps the split layout');
    await touch.close();
    // A saved game keeps the wide layout. Continue grows a copy of the card with the card's own padding.
    const save = { back: 'RNBQKBNR', fen: '', moves: ['e2-e4', 'e7-e5'], white: 'human', black: 'ai', sound: false };
    await context.addInitScript(s => localStorage.setItem('kingdown.save', s), JSON.stringify(save));
    await page.goto(NEXT); await page.waitForSelector('.home-continue');
    check(await wideLayout('saved'), 'a saved game keeps the wide layout');
    await shot(page, 'home-wide-saved');
    await page.emulateMedia({ reducedMotion: 'no-preference' }); await page.reload(); await page.waitForSelector('.home-continue');
    const source = await page.locator('.home-start .home-card').evaluate(n => new Promise(done => requestAnimationFrame(() => done(getComputedStyle(n).padding))));
    await page.locator('.home-continue').click();
    const copy = await page.waitForSelector('.home-growing-card', { timeout: 2000 }).then(n => n.evaluate(c => getComputedStyle(c).padding), () => null);
    check(copy === source, `the growing card keeps the card padding: ${copy} for ${source}`);
    // Signed-in rows, at 100% and 150% text, and in a short window: wide only where all fits below the kings.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await signedIn(context, [invite('i1', 'ada'), invite('i2', 'bo'), invite('i3', 'cy'), invite('i4', 'di')]);
    await page.goto(NEXT); await page.waitForSelector('.home-continue'); await page.waitForSelector('.home-invite-row');
    await wideLayout('saved, signed in');
    await shot(page, 'home-wide-signed-in');
    await page.evaluate(() => { document.documentElement.style.fontSize = '150%'; });
    await wideLayout('saved, signed in, 150% text');
    await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
    await page.setViewportSize({ width: w, height: Math.round(w / 2.4) });
    await wideLayout('saved, signed in, short window');
  },
  // Home opens narrow with a fresh cache, then enters the wide layout during the film: each painted frame of the wide
  // layout has the wide picture. A resize back, two fast resizes and a failed picture change nothing. After the wide
  // layout, the narrow layout gets its own still: the wide picture stays, whole, until that is ready, and no frame is blank or cuts a king.
  async home_resize(page, context, check, size) {
    if (size !== '1280x720') return;
    const open = async (label, { reduced = false, ended = false, fail = false, viewport = { width: 500, height: 1000 } } = {}) => {
      const tab = await (await browser.newContext({ viewport, reducedMotion: reduced ? 'reduce' : 'no-preference' })).newPage();
      let release; const held = new Promise(done => { release = done; }), asked = [], state = { fail };
      // The pictures of the other layout: those that the tab has not loaded yet.
      await tab.route(viewport.width === 500 ? '**/hero-wide.webp' : /hero-(portrait|square)\.webp$/, async r => { asked.push(r); await held; return state.fail ? r.abort() : r.continue(); });
      await tab.addInitScript(() => { window.kdErrors = []; addEventListener('error', event => { if (event.message) window.kdErrors.push(event.message); }); });
      await tab.goto(NEXT); await tab.waitForSelector('.play-home .home-reveal-still');
      await tab.waitForFunction(() => document.querySelector('.home-reveal-still').naturalWidth > 0);
      if (!reduced) await tab.locator('.home-reveal-video[data-ready]').waitFor();
      if (ended) await tab.evaluate(() => document.querySelector('.home-reveal-video').dispatchEvent(new Event('ended')));
      // A task after the frame sees the layout that the frame painted: the size observer has run. A resize between the
      // two gives no sample: resize() waits for a later frame of its window. A visible layer is the film or the still.
      await tab.evaluate(() => {
        window.kdFrames = [];
        const frame = () => requestAnimationFrame(() => { const size = `${innerWidth}x${innerHeight}`; setTimeout(() => {
          frame();
          if (size !== `${innerWidth}x${innerHeight}`) return;
          const still = document.querySelector('.home-reveal-still'), film = document.querySelector('.home-reveal-video'), hero = document.querySelector('.home-hero').getBoundingClientRect();
          const visible = node => getComputedStyle(node).opacity > 0, shape = url => /(portrait|square|wide)[^/]*$/.exec(url)?.[1] ?? 'none';
          const playing = film.hasAttribute('src') && (visible(film) || film.matches('.home-art:not(.home-art-still, .home-art-settled) [data-ready]')); // it fades in
          // A narrow layout cuts the kings of a picture of another shape, unless it is whole and has no edge fade.
          const art = document.querySelector('.home-art'), aspect = art.clientWidth / art.clientHeight, own = aspect <= .78 ? 'portrait' : aspect <= 1.25 ? 'square' : 'wide';
          const whole = getComputedStyle(art).maskImage === 'none' && [still, film].every(node => getComputedStyle(node).objectFit === 'contain');
          const fits = shape => shape === own || whole;
          window.kdFrames.push({ size, cut: matchMedia('(max-aspect-ratio: 5/4)').matches && !([...(playing ? [film.src] : []), ...(visible(still) ? [still.currentSrc] : [])].every(url => fits(shape(url)))), wide: getComputedStyle(still).objectFit === 'cover' && innerWidth >= 1200 && hero.width >= innerWidth - 1, film: playing,
            layers: [...(playing ? [shape(film.src)] : []), ...(visible(still) ? [still.complete && still.naturalWidth ? shape(still.currentSrc) : 'blank'] : [])] });
        }); });
        frame();
      });
      const frames = () => tab.evaluate(() => window.kdFrames.splice(0));
      const resize = async (width, height) => {
        const before = await tab.evaluate(() => window.kdFrames.length);
        await tab.setViewportSize({ width, height });
        await tab.waitForFunction(([before, size]) => window.kdFrames.slice(before).filter(f => f.size === size).length > 2, [before, `${width}x${height}`]);
      };
      return { tab, asked, state, release, frames, resize, close: () => tab.context().close(),
        clean: seen => check(seen.every(f => f.layers.length && (!f.wide || f.layers.every(shape => shape === 'wide'))), `${label}: each frame has a picture, and no frame of the wide layout has another picture: ${JSON.stringify(seen.find(f => !f.layers.length || f.wide && f.layers.some(shape => shape !== 'wide')))}`),
        calm: async () => check(!(await tab.evaluate(() => window.kdErrors)).length, `${label}: no error in the window: ${await tab.evaluate(() => window.kdErrors)}`),
        settled: () => tab.waitForFunction(() => window.kdFrames.at(-1)?.wide, null, { timeout: 4000 }).then(() => true, () => false) };
    };
    // Each size in turn, to 500x1000; then the wide layout again.
    const wayBack = async (home, label, sizes = []) => {
      for (const [w, h] of sizes) await home.resize(w, h);
      const passed = await home.frames();
      await home.resize(500, 1000);
      // Opened wide: the narrow picture is held, so each frame until now has the wide one.
      if (sizes.length) {
        passed.push(...await home.frames());
        check(home.asked.length > 0 && passed.at(-1).size === '500x1000' && passed.every(f => f.layers.join() === 'wide'), `${label}, back to narrow: the wide picture stays while the narrow one loads: ${home.asked.length} ${JSON.stringify(passed.find(f => f.layers.join() !== 'wide'))}`);
        if (label === 'opened wide, film') await home.tab.screenshot({ path: join(out, 'resize-narrow-held-500.png') });
      }
      if (sizes.length && home.state.fail) {
        // The load fails, then the device is offline: the wide picture stays, whole. A later resize tries again.
        home.release(); await home.tab.waitForTimeout(400);
        await home.tab.context().setOffline(true); await home.resize(501, 1000); await home.resize(500, 1000); await home.tab.waitForTimeout(400);
        passed.push(...await home.frames());
        check(passed.every(f => f.layers.join() === 'wide') && await home.tab.locator('.home-start').isVisible(), `${label}, back to narrow: the wide picture and the actions stay: ${JSON.stringify(passed.find(f => f.layers.join() !== 'wide'))}`);
        await home.tab.context().setOffline(false); home.state.fail = false; await home.resize(501, 1000);
      }
      home.release();
      const came = await home.tab.waitForFunction(() => window.kdFrames.at(-1)?.layers.join() === 'portrait', null, { timeout: 4000 }).then(() => true, () => false);
      if (came) { await home.resize(501, 1000); await home.resize(500, 1000); }
      const seen = [...passed, ...await home.frames()], own = seen.findIndex(f => f.layers.join() === 'portrait');
      check(came && own >= 0 && seen.slice(own).every(f => !f.wide && !f.film && f.layers.join() === 'portrait'), `${label}, back to narrow: the portrait still comes and stays, with no film: ${JSON.stringify(seen.at(-1))}`);
      const blank = seen.find(f => f.layers.length !== 1 || !/^(portrait|square|wide)$/.test(f.layers[0]));
      check(!blank, `${label}, back to narrow: each frame has one picture: ${JSON.stringify(blank)}`);
      const cut = seen.find(f => f.cut);
      check(!cut, `${label}, back to narrow: no frame cuts a king: ${JSON.stringify(cut)}`);
      if (label === 'film') await home.tab.screenshot({ path: join(out, 'resize-narrow-return-500.png') });
      await home.resize(1280, 720);
      check(await home.settled(), `${label}: the wide layout comes again`);
      home.clean(await home.frames()); await home.calm();
    };
    for (const [label, how] of [['film', {}], ['reduced motion', { reduced: true }], ['film ended', { ended: true }]]) {
      const home = await open(label, how);
      await home.resize(1280, 720); await home.resize(1290, 730); await home.resize(1280, 720);
      const waiting = await home.frames();
      check(home.asked.length > 0 && waiting.length > 5 && waiting.every(f => !f.wide), `${label}: the split layout stays while the picture loads: ${home.asked.length} ${waiting.length} ${JSON.stringify(waiting.find(f => f.wide))}`);
      if (label === 'film') await home.tab.screenshot({ path: join(out, 'resize-split-1280.png') });
      home.release();
      check(await home.settled(), `${label}: the wide layout comes with the wide picture`);
      home.clean([...waiting, ...await home.frames()]); await home.calm();
      if (label === 'film') await home.tab.screenshot({ path: join(out, 'resize-wide-1280.png') });
      await wayBack(home, label);
      await home.close();
    }
    // A drag: the wide layout ends at a wide shape, and the window goes on to narrow.
    for (const [label, how] of [['opened wide, film', {}], ['opened wide, film ended', { ended: true }], ['opened wide, reduced motion', { reduced: true }], ['opened wide, load error', { fail: true }]]) {
      const home = await open(label, { ...how, viewport: { width: 1280, height: 720 } });
      await wayBack(home, label, [[1150, 720], [800, 900]]);
      await home.close();
    }
    const back = await open('resize back');
    await back.resize(1280, 720); await back.resize(500, 1000); back.release(); await back.tab.waitForTimeout(400);
    const stayed = await back.frames();
    check(stayed.every(f => !f.wide && f.layers.join() === 'portrait') && stayed.at(-1).film, `resize back: the portrait film stays: ${JSON.stringify(stayed.find(f => f.wide || f.layers.join() !== 'portrait'))}`);
    await back.resize(1280, 720); check(await back.settled(), 'resize back: a later resize is wide'); back.clean(await back.frames()); await back.calm();
    await back.close();
    const failed = await open('load error', { fail: true });
    await failed.resize(1280, 720); failed.release(); await failed.tab.waitForTimeout(400);
    const bad = (await failed.frames()).find(f => f.wide || f.layers.join() !== 'portrait');
    check(!bad, `load error: the split layout stays with its picture: ${JSON.stringify(bad)} ${failed.asked.length}`);
    await failed.close();
    // Home that opens wide: the wide layout from its first frame.
    const wide = await browser.newContext({ viewport: { width: 1280, height: 720 } }), first = await wide.newPage();
    await first.addInitScript(() => {
      window.kdSplit = 0; window.kdHome = 0;
      const frame = () => requestAnimationFrame(() => setTimeout(() => { const home = document.querySelector('.play-home'); if (home) { window.kdHome++; if (home.classList.contains('home-split')) window.kdSplit++; } frame(); }));
      frame();
    });
    for (const visit of ['new', 'cached']) {
      await first.goto(NEXT); await first.waitForFunction(() => window.kdHome > 20);
      check(await first.evaluate(() => window.kdSplit === 0), `${visit}: Home that opens wide has no frame of the split layout`);
    }
    await wide.close();
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
    check(plinths.every(image => image === (short ? 'none' : 'url("dat')), `a short landscape has no plinth: ${plinths}`);
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
  // A reload on the open result card shows it again, at rest, and writes nothing. Each other way back opens Home.
  async result_reload(page, context, check, size) {
    if (!['390x844', '1280x720'].includes(size)) return;
    const ended = (fen, moves, { player = 0, resigned = null } = {}) => {
      const game = new Game('RNBQKBNR', rulesOf('pieces', [null, null], [[], []]));
      if (fen) game.load(game.context.fromFen(fen));
      for (const [from, to] of moves) { const draft = new DraftTurn(game); draft.stage(draft.at(parseSq(from), parseSq(to))[0]); draft.commit(); }
      return { ...snapshot(new DraftTurn(game), resigned, player, 125000), skill: 'casual', sound: true, pace: 'normal', gameAt: 500 };
    };
    const MATE = '7k/6pp/8/8/8/R7/8/6K1 w - - 0 1', KEY = 'kingdown.result';
    const ends = [
      ['win', ended(MATE, [['a3', 'a8']]), 'You win', 'Checkmate.'],
      ['loss', ended(MATE, [['a3', 'a8']], { player: 1 }), 'The computer wins', 'Checkmate.'],
      ['draw', ended('k7/8/8/8/8/8/1p6/K7 w - - 0 1', [['a1', 'b2']]), 'Draw', 'Insufficient material.'],
      ['resign', ended('7k/7p/8/8/8/8/P7/K7 w - - 0 1', [['a2', 'a3']], { resigned: 0 }), 'The computer wins', 'You resign.'],
      ['resign before a move', ended(null, [], { resigned: 0 }), 'The computer wins', 'You resign.'],
    ];
    const markOf = save => `${save.gameAt}|${gameJSON(save)}`;
    await context.addInitScript(() => {
      localStorage.setItem('kingdown.solo-launch-seen', '1');
      window.kdSeen = { writes: [], moments: [] };
      const get = Storage.prototype.getItem;
      Storage.prototype.getItem = function (key) { if (key === 'kingdown.result') window.kdRead ??= performance.now(); return get.call(this, key); };
      // The first frame that shows the loading line, in ms after the page reads the mark.
      const line = () => requestAnimationFrame(() => { if (document.querySelector('.people-loading')) window.kdLine ??= performance.now() - window.kdRead; line(); });
      line();
      const set = Storage.prototype.setItem, animate = Element.prototype.animate, start = AudioBufferSourceNode.prototype.start;
      Storage.prototype.setItem = function (key, value) { if (this === localStorage) window.kdSeen.writes.push(key); return set.call(this, key, value); };
      Element.prototype.animate = function (...args) { window.kdSeen.moments.push(`animate ${this.className}`); return animate.apply(this, args); };
      AudioBufferSourceNode.prototype.start = function (...args) { window.kdSeen.moments.push('sound'); return start.apply(this, args); };
      new MutationObserver(records => { for (const { addedNodes } of records) for (const node of addedNodes) if (node instanceof Element && (node.matches('.play-sequence-skip, .play-versus, .play-home') || node.querySelector('.play-sequence-skip, .play-versus, .play-home'))) window.kdSeen.moments.push(node.className); }).observe(document, { childList: true, subtree: true });
    });
    const seed = (save, mark) => page.evaluate(([save, mark, key]) => {
      localStorage.setItem('kingdown.save', save); sessionStorage.removeItem(key); if (mark) sessionStorage.setItem(key, mark);
      history.replaceState(null, '', '#game');
    }, [JSON.stringify(save), mark, KEY]);
    const card = () => page.locator('.play-game:not([style*="hidden"]) .play-result').waitFor({ state: 'attached' });
    const home = async label => check(await page.waitForFunction(key => document.body.dataset.page === 'home' && document.querySelector('.play-home h1') && !document.querySelector('.play-result') && sessionStorage.getItem(key) === null, KEY, { timeout: 6000 }).then(() => true, () => false), label);
    const press = control => control.evaluate(node => node.click()); // the short result layout can hide a control
    await page.goto(NEXT); await page.waitForSelector('.play-home h1');
    for (const [name, save, title, cause] of ends) {
      await seed(save, markOf(save)); await page.reload(); await card(); await page.waitForTimeout(800);
      const words = await page.locator('.play-result').evaluate(n => [n.querySelector('h3').textContent, n.querySelector('.play-result-cause').textContent]);
      check(words.join('|') === `${title}|${cause}`, `${name}: the card shows its own result: ${words}`);
      const seen = await page.evaluate(() => window.kdSeen);
      check(seen.moments.length === 0, `${name}: the card comes at rest, with no Home before it: ${seen.moments}`);
      check(!seen.writes.some(key => ['kingdown.save', 'kingdown.sync'].includes(key)) && await saved(page) === JSON.stringify(save), `${name}: no second record: ${seen.writes}`);
      check(await page.evaluate(() => !(window.kdLine < 250)), `${name}: the loading line does not flash: ${await page.evaluate(() => window.kdLine)} ms`);
      check(await page.evaluate(() => document.activeElement?.closest('.play-result-actions') !== null), `${name}: the first action has the focus`);
      check((await page.locator('.play-game').getAttribute('data-moment')) === ({ win: 'win', loss: 'loss' }[name] ?? null), `${name}: the board has the light of its result`);
      if (name === 'win') await page.screenshot({ path: join(out, `reload-result-${size.split('x')[0]}.png`) });
      await press(page.locator('.play-result-actions .kd-button', { hasText: 'Home' })); await home(`${name}: Home clears the mark`);
      await page.reload(); await home(`${name}: a reload after Home opens Home`);
      await seed(save, null); await page.reload(); await home(`${name}: no mark opens Home`);
      await seed(save, markOf(save)); await page.goto(`${NEXT}?visit`); await home(`${name}: a new visit to the tab opens Home`);
      // Rematch of the restored card: the same level and the other side, as on the first open.
      await seed(save, markOf(save)); await page.reload(); await card();
      await press(page.locator('.play-result-actions .kd-button').first());
      await page.waitForFunction(() => JSON.parse(localStorage.getItem('kingdown.save')).resigned === null && !document.querySelector('.play-result'));
      const next = JSON.parse(await saved(page));
      check(next.skill === 'casual' && next[save.white === 'human' ? 'black' : 'white'] === 'human', `${name}: Rematch keeps the level and swaps the side: ${next.skill} ${next.white}`);
      check(await page.evaluate(key => sessionStorage.getItem(key) === null, KEY), `${name}: Rematch clears the mark`);
    }
    // The player's own checkmate, then a reload; See the game keeps the mark; Back opens Home.
    await page.evaluate(save => { localStorage.setItem('kingdown.save', save); location.hash = ''; }, JSON.stringify({ ...ends[0][1], moves: [] }));
    await page.goto(`${NEXT}?play`); await page.locator('.home-continue').click(); await ready(page);
    await page.locator('.play-square[data-square="16"]').click(); await page.locator('.play-square[data-square="56"]').click();
    await page.getByRole('button', { name: text.finish, exact: true }).click(); await card();
    check(await page.evaluate(key => sessionStorage.getItem(key) !== null, KEY), 'the open card sets the mark');
    const entries = await page.evaluate(() => history.length);
    await page.reload(); await card();
    await press(page.locator('.play-result-actions .kd-button', { hasText: 'See the game' }));
    check(await page.locator('.play-game[data-review="true"]').count() === 1, 'See the game shows the board');
    await page.reload(); await card();
    check(await page.evaluate(() => history.length) === entries, 'a reload adds no history entry');
    await press(page.locator('.play-result-new')); await page.waitForSelector('dialog.new-game-panel[open]');
    await page.keyboard.press('Escape'); await page.waitForSelector('dialog[open]', { state: 'detached' });
    await page.goBack(); await home('Back from the restored card opens Home');
    if (size !== '1280x720') return;
    // The restore waits for the board code: `reload` returns while the code is held, and `free` lets it load.
    const [, win] = ends[0], BOARD = /\/assets\/board-api-[\w-]+\.js$/;
    let asked, free;
    const held = async (pattern, run) => {
      const open = new Promise(done => { free = done; });
      asked = 0;
      await context.route(pattern, async route => { asked++; await open; await route.continue().catch(() => {}); });
      await run(); free(); await context.unroute(pattern);
    };
    const reload = async () => {
      const before = asked; await page.reload({ waitUntil: 'commit' });
      const end = Date.now() + 8000; while (asked === before && Date.now() < end) await page.waitForTimeout(20);
      check(asked > before, 'the reload asks for the board code');
      check(await page.waitForFunction(() => window.kdRead, null, { timeout: 2000 }).then(() => true, () => false), 'the reload reads the mark');
    };
    const card2 = async label => check(await page.locator('.play-game:not([style*="hidden"]) .play-result').waitFor({ state: 'attached', timeout: 6000 }).then(() => true, () => false), label);
    await held(BOARD, async () => {
      await seed(win, markOf(win)); await reload();
      check(await page.locator('.people-loading').waitFor({ timeout: 3000 }).then(() => true, () => false), 'a slow load shows the loading line');
      check(await page.evaluate(() => location.hash) === '#game', 'the address of the game stays during the load');
      await reload(); check(await page.evaluate(() => location.hash) === '#game', 'a second reload keeps the address');
    });
    await card2('a second reload during the load shows the card'); check(await page.locator('.people-loading').count() === 0, 'the loading line goes when the board opens');
    // Another tab replaces the save during the load; the same moves at another time are another game.
    const again = { ...win, gameAt: win.gameAt + 1 };
    await held(BOARD, async () => { await seed(win, markOf(win)); await reload(); await page.evaluate(save => localStorage.setItem('kingdown.save', save), JSON.stringify(again)); });
    await home('a save that another tab replaces during the load opens Home');
    await seed(again, markOf(win)); await page.reload(); await home('the same moves in a later game open Home');
    // Back during the load: Home stays, and its entry does too.
    await page.goto(`${NEXT}?back`); await page.waitForSelector('.play-home h1');
    await held(BOARD, async () => {
      await seed(win, null); await page.evaluate(([mark, key]) => { history.replaceState({ shell: { place: 'play' }, key: 'home' }, '', location.pathname); history.pushState({ shell: { place: 'game' }, key: 'game' }, '', '#game'); sessionStorage.setItem(key, mark); }, [markOf(win), KEY]);
      await reload(); await page.evaluate(() => history.back()); await page.waitForFunction(() => location.hash !== '#game');
    });
    await page.waitForTimeout(600); await home('Back during the load opens Home'); check(await page.evaluate(() => location.hash !== '#game' && history.state.key === 'home'), 'Back during the load keeps the Home entry');
    // A new visit with a copied mark is not a reload.
    await seed(win, markOf(win)); await page.goto(`${NEXT}?copied#game`); await home('a new visit with a copied mark opens Home');
    // An invite link that opens during the load keeps its route, also when its own page is slow.
    await seed(win, markOf(win)); let letGo; const slow = new Promise(done => { letGo = done; });
    await context.route(/\/assets\/landing-[\w-]+\.js$/, async route => { await slow; await route.continue(); });
    await held(BOARD, async () => { await reload(); await page.evaluate(() => { location.hash = '#join=abcdefgh'; }); });
    await page.waitForTimeout(600);
    check(await page.evaluate(() => location.hash) === '#join=abcdefgh', `an invite link that opens during the load keeps its route: ${await page.evaluate(() => location.hash)}`);
    letGo(); check(await page.waitForFunction(() => document.body.dataset.page === 'join' && !document.querySelector('.people-loading, .play-home, .play-result')).then(() => true, () => false), 'the invite page opens after the load');
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
    const [width, height] = size.split('x').map(Number), context = await browser.newContext({ viewport: { width, height }, reducedMotion: ['guide', 'home_art', 'seat_tint', 'result_reload'].includes(name) ? 'no-preference' : 'reduce' });
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
