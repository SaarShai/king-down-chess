// The menus and sides repair. Run through check:browser next-menus, or with PLAYABLE_URL and PLAYABLE_OUT.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { assertNoErrors, env, launch, trapErrors } from './lib/checks.mjs';

const browser = await launch(), out = env('PLAYABLE_OUT');
mkdirSync(out, { recursive: true });
const sizes = (process.env.MENUS_SIZES || '360x640,375x667,390x844,430x932,667x375,844x390,932x430,768x1024,820x1180,1024x768,1180x820,1366x1024,1280x720,1440x900,1920x1080,2560x1440,320x568').split(',');
const NEXT = new URL('next.html', env('PLAYABLE_URL')).href, MAIN = '.play-home .kd-button[data-kind="main"]';
const results = [];
const ready = page => page.waitForFunction(() => { const g = document.querySelector('.play-game'); return g?.style.visibility !== 'hidden' && g?.dataset.state === 'ready' && !document.querySelector('.play-home, .play-versus'); });
const saved = page => page.evaluate(() => localStorage.getItem('kingdown.save'));
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
const unbroken = (page, selector) => page.locator(selector).evaluateAll(nodes => nodes.every(node => {
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
// Accept, open New game, then press `action`. The page holds every Back in window.kdBacks, and home polls wait, until
// the app has handled the late invite reply: only that reply can remove the invite row. The route must wait for the
// Back. `preload` starts a local game first, so a faulty local start fails at once instead of after a slow import.
// `reopen` presses New game again while the Back is held: the panel waits, and the game route goes first.
async function panelRace(page, context, check, action, game, { preload = false, reopen = false } = {}) {
  const invites = [{ ...invite('i1', 'ada'), game_id: game }], polls = {};
  let release; const held = new Promise(done => { release = done; });
  await signedIn(context, invites, async json => { await held; invites.length = 0; return json({ game_id: game, revision: 1, status: 'setup', seat: 0, kind: 'person', action: 'wait', deadline_at: null }); }, polls);
  await page.goto(NEXT); await page.waitForSelector('.home-invite-row');
  const newGame = () => page.locator('.home-top-new:visible, .home-side-new:visible').first(), panel = page.locator('dialog.new-game-panel');
  if (preload) {
    await newGame().click(); await page.waitForSelector('dialog.new-game-panel[open]');
    await panel.getByRole('button', { name: 'Start game', exact: true }).click(); await ready(page);
    await page.goBack(); await page.waitForSelector('.home-invite-row');
    await page.waitForTimeout(650); // Start blocks page clicks for --dur-sheet-in + 300 ms (begin() in home.ts)
  }
  let openPolls; polls.held = new Promise(done => { openPolls = done; });
  await page.evaluate(() => { const back = history.back.bind(history); window.kdBacks = []; history.back = () => { window.kdBacks.push(back); }; });
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
    if (await page.locator('dialog.new-game-panel[open]').count()) await panel.getByRole('button', { name: 'Close', exact: true }).click();
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
const cases = {
  async code_fault(page, context, check) {
    const pattern = /\/assets\/board-api-[\w-]+\.js$/;
    await context.route(pattern, r => r.abort());
    await page.goto(NEXT); await page.locator(MAIN).click(); if (await page.locator('dialog.new-game-panel[open]').count()) await page.getByRole('button', { name: 'Start game', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('body > .kd-sr')?.textContent.includes('The board cannot load.'));
    check(await page.locator('.home-load-fault').isVisible(), 'the board-code fault has a visible line');
    check(await page.locator('.home-load-fault').textContent().catch(() => '') === 'The board cannot load. Reload the page.', 'the visible line names the safe step');
    check(await saved(page) === null, 'the failed load writes no game');
    await shot(page, 'code-fault');
    await context.unroute(pattern); await page.locator(MAIN).click(); if (await page.locator('dialog.new-game-panel[open]').count()) await page.getByRole('button', { name: 'Start game', exact: true }).click(); await ready(page);
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
    await page.waitForTimeout(250);
    check(await page.locator('.home-army-block').count() === 0, 'the removed next-army block stays absent');
    await page.locator('.home-hero button').click(); await page.locator('[data-section="pieces"]').click();
    check(await page.locator('.pool-row').evaluateAll(rows => rows.length === 15 && rows.every(row => row.textContent.trim())), 'each piece option keeps its name when art fails');
    check(await unbroken(page, '.pool-row > span'), 'piece names keep whole words');
    await shot(page, 'home-art');
  },
  async panel(page, context, check, size) {
    await page.goto(NEXT); await page.waitForSelector('.play-home');
    const before = await saved(page), choices = await page.locator('.home-summary p').innerText();
    await page.locator('.home-hero button').click();
    await page.getByRole('slider', { name: 'Your pieces' }).scrollIntoViewIfNeeded();
    check(await unbroken(page, '.side-control .level-labels button'), 'side labels keep each word on one line');
    const [w, h] = size.split('x').map(Number), panel = await page.locator('dialog[open]').boundingBox();
    check(w < 600 || panel.height <= h * .9 + 1, 'a wide panel uses at most 90 percent of the height');
    await shot(page, 'panel');
    await page.getByRole('button', { name: 'Dark', exact: true }).click();
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await page.waitForFunction(() => !history.state?.layer);
    check(await saved(page) === before && await page.locator('.home-summary p').innerText() === choices, 'Close keeps the save and choices');
    await shot(page, 'panel-closed');
  },
  async panel_refresh(page, context, check) {
    // A signed-in player opens New game; a new invite arrives through the home poll and redraws Play. The open panel,
    // its draft choice and the focus stay.
    const invites = [invite('i1', 'ada')];
    await signedIn(context, invites);
    await page.goto(NEXT); await page.waitForSelector('.home-invite-row');
    const opener = page.locator('.home-top-new:visible, .home-side-new:visible').first(), openerClass = await opener.evaluate(node => node.classList.contains('home-top-new') ? 'home-top-new' : 'home-side-new');
    await opener.click(); await page.waitForSelector('dialog.new-game-panel[open]');
    await page.getByRole('button', { name: 'Dark', exact: true }).click();
    invites.push(invite('i2', 'bo'));
    const refreshed = await page.waitForFunction(() => document.querySelectorAll('.home-invite-row').length === 2, null, { timeout: 15000 }).then(() => true, () => false);
    check(refreshed, 'a new invite redraws Play while the panel is open');
    check(await page.locator('dialog.new-game-panel[open]').count() === 1, 'the panel stays open after the refresh');
    check(await page.getByRole('slider', { name: 'Your pieces' }).getAttribute('aria-valuetext') === 'Dark', 'the draft choice stays after the refresh');
    check(await page.evaluate(() => !!document.activeElement?.closest('dialog.new-game-panel')), 'the focus stays in the panel after the refresh');
    await shot(page, 'panel-refresh');
    if (await page.locator('dialog.new-game-panel[open]').count()) {
      await page.locator('dialog.new-game-panel').getByRole('button', { name: 'Close', exact: true }).click();
      await page.waitForFunction(() => !history.state?.layer);
      const back = await page.waitForFunction(name => document.activeElement?.classList.contains(name) && document.activeElement.isConnected, openerClass, { timeout: 3000 }).then(() => true, () => false);
      check(back, 'Close returns the focus to New game on the redrawn Play');
    }
  },
  async panel_first_invite(page, context, check) {
    // No games: Play shows the large New game. The first invite replaces it with the New game of a games list while the panel is open.
    const invites = [];
    await signedIn(context, invites);
    await page.goto(NEXT); await page.locator('.home-hero-new').click(); await page.waitForSelector('dialog.new-game-panel[open]');
    invites.push(invite('i1', 'ada'));
    check(await page.waitForSelector('.home-invite-row', { timeout: 15000 }).then(() => true, () => false), 'the first invite redraws Play while the panel is open');
    check(await page.locator('dialog.new-game-panel[open]').count() === 1, 'the panel stays open after the first invite');
    await page.locator('dialog.new-game-panel').getByRole('button', { name: 'Close', exact: true }).click();
    const back = await page.waitForFunction(() => { const a = document.activeElement; return !!a?.matches('.home-top-new, .home-side-new') && a.getClientRects().length > 0; }, null, { timeout: 3000 }).then(() => true, () => false);
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
    await page.locator('.home-top-new:visible, .home-side-new:visible').first().click(); await page.waitForSelector('dialog.new-game-panel[open]');
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
    await panelRace(page, context, check, 'Close', '00000000-0000-4000-8000-000000000002');
  },
  async panel_start_race(page, context, check) {
    // The same order with Start game: the local start stops, and no local game is written.
    await panelRace(page, context, check, 'Start game', '00000000-0000-4000-8000-000000000003', { preload: true });
  },
  async panel_double_reopen(page, context, check) {
    // Close, then New game twice before the Back lands: one panel opens after the Back, with one history entry.
    await page.goto(NEXT); await page.waitForSelector('.home-hero-new');
    await page.evaluate(() => { const back = history.back.bind(history); window.kdBacks = []; history.back = () => { window.kdBacks.push(back); }; });
    const start = await page.evaluate(() => history.length), change = page.locator('.home-hero-new'), panel = page.locator('dialog.new-game-panel');
    await change.click(); await page.waitForSelector('dialog.new-game-panel[open]');
    await panel.getByRole('button', { name: 'Close', exact: true }).click();
    check(await page.waitForFunction(() => window.kdBacks.length === 1).then(() => true, () => false), 'the Back of Close is held');
    await change.click(); await change.click();
    check(await page.locator('dialog.new-game-panel[open]').count() === 0, 'both opens wait for the held Back');
    await page.evaluate(() => window.kdBacks.shift()());
    check(await page.waitForFunction(() => document.querySelectorAll('dialog.new-game-panel[open]').length === 1).then(() => true, () => false), 'one panel opens after the Back');
    await page.waitForTimeout(300);
    check(await page.evaluate(() => document.querySelectorAll('dialog.new-game-panel').length === 1 && history.state?.layer === true), 'only one panel and one layer entry');
    await panel.getByRole('button', { name: 'Close', exact: true }).click();
    check(await page.waitForFunction(() => window.kdBacks.length === 1).then(() => true, () => false), 'the second Close holds one Back');
    await page.evaluate(() => window.kdBacks.shift()());
    check(await page.waitForFunction(n => !history.state?.layer && history.length === n + 1 && !document.querySelector('dialog.new-game-panel'), start).then(() => true, () => false), 'Play with no panel and no extra entry');
  },
  async panel_reopen_race(page, context, check) {
    // Close, a late reply, then New game again before the Back lands: the game opens; no panel opens over it.
    await panelRace(page, context, check, 'Close', '00000000-0000-4000-8000-000000000004', { reopen: true });
  },
  async you(page, context, check) {
    await page.goto(`${NEXT}#you`); await page.waitForSelector('.you-page');
    const settings = (await order(page)).join(',');
    check(settings === 'pieces,hand,coords,sound,motion', `settings keep one order: ${settings}`);
    check(await unbroken(page, '[data-setting="motion"] [role="radio"]'), 'Motion speed keeps each word on one line');
    check(await page.locator('[role="switch"]').evaluateAll(nodes => nodes.every(n => !n.hasAttribute('aria-describedby') && n.querySelectorAll('.kd-switch-copy > span').length === 0)), 'an empty switch description creates no empty note');
    const sound = page.getByRole('switch', { name: 'Sound', exact: true }); await sound.click();
    check(await sound.getAttribute('aria-checked') === 'true' && await sound.locator('.kd-switch-state').innerText() === 'On', 'the switch state word follows its value');
    check(await page.evaluate(() => {
      const scan = (rules, hover = false) => [...rules].every(rule => {
        const guarded = hover || rule.conditionText?.includes('(hover: hover)');
        if (rule.selectorText?.includes(':hover') && !hover) return false;
        return !rule.cssRules || scan(rule.cssRules, guarded);
      });
      return [...document.styleSheets].every(sheet => scan(sheet.cssRules));
    }), 'hover rules require a hover pointer');
    await shot(page, 'you');
  },
  async ribbon(page, context, check) {
    await page.goto(`${NEXT}#you`);
    await page.locator('.ribbon-sample').waitFor();
    for (const size of [100, 150, 200]) {
      await page.evaluate(size => { document.documentElement.style.fontSize = `${size}%`; }, size);
      const ribbonFits = await page.locator('.ribbon-sample').evaluate(sample => {
        const art = sample.getBoundingClientRect(), button = sample.closest('button').getBoundingClientRect();
        return art.left >= button.left && art.right <= button.right && art.top >= button.top && art.bottom <= button.bottom;
      });
      check(ribbonFits && await unbroken(page, '.ribbon-sample'), `the Ribbon sample fits with whole words at ${size}%`);
    }
  },
  async guide(page, context, check, size) {
    const w = Number(size.split('x')[0]);
    await page.goto(`${NEXT}#guide`); await page.waitForSelector('.guide-page'); await page.evaluate(() => document.fonts.ready);
    const width = await page.locator('.guide-page').evaluate(n => { const cs = getComputedStyle(n); return n.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight); });
    check(width <= (w >= 900 ? 1120 : 640), 'the Guide content stays within its width class');
    await page.locator('[data-section="How a turn works"]').click(); await page.waitForTimeout(800);
    check(Math.max(...await lines(page, '.turn-steps p')) <= 70, 'turn text has at most 70 characters per line');
    await page.getByRole('button', { name: 'Back to Guide', exact: true }).click();
    await page.locator('[data-section="Pieces"]').click();
    await page.locator('.guide-row', { hasText: 'Knight' }).click();
    if (w >= 900) {
      check(await page.locator('nav.entry-list[aria-label="Pieces"]').count() === 1, 'the named entry list is navigation');
      check(await page.locator('.entry-list h2').count() === 0, 'the entry list has no heading before the page title');
    }
    await page.getByRole('button', { name: 'Back to Pieces', exact: true }).click();
    await page.waitForTimeout(800);
    check(await page.locator('.guide-row', { hasText: 'Knight' }).evaluate(n => { const r = n.getBoundingClientRect(); return document.activeElement === n && r.top >= 0 && r.bottom <= innerHeight - (innerWidth < 900 ? 56 : 0); }), 'Back restores the Knight row and its focus in view');
    await shot(page, 'guide-back');
    await page.getByRole('button', { name: 'Back to Guide', exact: true }).click();
    await page.locator('[data-section="Cards"]').click(); await page.locator('.guide-card').first().click(); await page.waitForTimeout(800);
    const measure = Math.max(...await lines(page, '.learn-rule, .learn-limits, .learn-against'));
    check(measure <= 70, `entry text has at most 70 characters per line (${measure})`);
    await shot(page, 'guide-entry');
  },
  async guide_reload(page, context, check) {
    await page.goto(`${NEXT}#guide`);
    await page.locator('[data-section="Pieces"]').click();
    await page.locator('.guide-row', { hasText: 'Maester' }).click();
    const heading = page.getByRole('heading', { name: /Maester/ });
    await heading.waitFor();
    const before = await page.evaluate(async () => {
      await document.fonts.ready;
      scrollTo(0, document.body.scrollHeight);
      return scrollY;
    });
    await page.reload();
    await heading.waitFor();
    const restored = await page.waitForFunction(y => Math.abs(scrollY - y) <= 2, before, { timeout: 4000 }).then(() => true, () => false);
    check(before > 0 && restored, 'the Maester entry keeps its reading position after reload');
  },
  async home_piece_close(page, context, check) {
    await page.goto(NEXT); await page.locator('.home-hero-new').click();
    const preview = page.getByRole('button', { name: 'Cards', exact: true });
    await preview.press('Enter');
    const card = page.getByRole('button', { name: 'Ice Wall', exact: true });
    await card.press('Space');
    check(await card.getAttribute('aria-pressed') === 'false', 'Space removes the card from the pool');
    const box = await card.boundingBox(); check(box.width >= 44 && box.height >= 44, 'The card is a 44 px target');
    check(await card.evaluate(n => n === document.activeElement), 'The card keeps focus after a change');
    await page.keyboard.press('Escape');
    check(await preview.evaluate(n => n === document.activeElement), 'Escape returns focus to the Cards preview');
    await page.goBack(); check(await page.locator('dialog[open]').count() === 0, 'Browser Back closes New game');
  },
  async menu(page, context, check, size) {
    await page.goto(NEXT); await page.locator(MAIN).click(); if (await page.locator('dialog.new-game-panel[open]').count()) await page.getByRole('button', { name: 'Start game', exact: true }).click(); await ready(page);
    const before = await saved(page);
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    // The game Menu keeps four settings; Motion is on You only (src/interface/play/menus.ts, the Menu rows).
    const settings = (await order(page)).join(',');
    check(settings === 'pieces,hand,coords,sound', `settings keep one order: ${settings}`);
    check(await page.locator('.menu-note').evaluate(n => parseFloat(getComputedStyle(n).fontSize) >= 14), 'the save note is at least 14 px');
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
    await page.getByRole('button', { name: 'Back to home', exact: true }).click(); await page.waitForSelector('.play-home');
    check(await saved(page) === before, 'an immediate Menu exit keeps the save');
    await page.locator(MAIN).click(); if (await page.locator('dialog.new-game-panel[open]').count()) await page.getByRole('button', { name: 'Start game', exact: true }).click(); await ready(page);
    await page.getByRole('button', { name: 'Menu', exact: true }).click(); await page.getByRole('button', { name: 'Resign', exact: true }).click();
    await page.locator('dialog[open]').getByRole('button', { name: 'Resign', exact: true }).click();
    await page.waitForSelector('.play-result', { state: 'attached' });
    check(await page.locator('.play-result-actions .kd-button').evaluateAll(nodes => nodes.every(n => !getComputedStyle(n).textDecorationLine.includes('underline'))), 'result controls have no underline');
  },
  async rematch_art(page, context, check) {
    // Rematch must request a king still that the first game does not use.
    await context.addInitScript(() => localStorage.setItem('kingdown.setup', 'powers'));
    await page.goto(NEXT); await page.locator(MAIN).click(); if (await page.locator('dialog.new-game-panel[open]').count()) await page.getByRole('button', { name: 'Start game', exact: true }).click(); await ready(page);
    await page.getByRole('button', { name: 'Menu', exact: true }).click(); await page.getByRole('button', { name: 'Resign', exact: true }).click();
    await page.locator('dialog[open]').getByRole('button', { name: 'Resign', exact: true }).click();
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
    await page.waitForFunction(() => document.querySelector('.play-game')?.dataset.fault === 'art', null, { timeout: 4000 }).catch(() => {});
    check(failed > 0, 'the rematch asks for a new still');
    check(await page.locator('.play-fault').isVisible(), 'an art fault after Rematch shows Try again');
    await shot(page, 'rematch-art');
  },
};
try {
  for (const size of sizes) for (const [name, run] of Object.entries(cases)) {
    if (process.env.MENUS_CASES && !process.env.MENUS_CASES.split(',').includes(name)) continue;
    const [width, height] = size.split('x').map(Number), context = await browser.newContext({ viewport: { width, height }, reducedMotion: name === 'guide' ? 'no-preference' : 'reduce' });
    const page = await context.newPage(), failures = [], errors = [];
    page.setDefaultTimeout(12000);
    const trapped = trapErrors(page);
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', e => errors.push(e.message));
    const check = (ok, label) => { if (!ok) failures.push(label); };
    try { await run(page, context, check, size); } catch (e) { failures.push(String(e)); }
    // Only these fault cases deliberately abort requests. A page exception is never expected.
    if (!['code_fault', 'font_fault', 'home_art', 'rematch_art'].includes(name)) {
      try { assertNoErrors(trapped); } catch (e) { failures.push(String(e)); }
      check(errors.length === 0, `no console error: ${errors.join('; ')}`);
    } else check(!errors.some(e => !/Failed to load resource|Load failed|net::ERR_FAILED/.test(e)), `only blocked requests fail: ${errors.join('; ')}`);
    const result = { size, name, failures, errors }; results.push(result);
    console.log(`${failures.length ? 'FAIL' : 'PASS'} ${size} ${name} ${failures.join(' | ')}`);
    await context.close();
  }
} finally { await browser.close(); writeFileSync(join(out, 'results.json'), JSON.stringify(results, null, 2)); }
process.exitCode = results.some(r => r.failures.length) ? 1 : 0;
