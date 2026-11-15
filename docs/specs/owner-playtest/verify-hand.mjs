// Lane H: run against this worktree's Vite server on port 5444. All account replies are local fixtures.
import { chromium } from '/Users/za/Documents/king down chess (new)/app/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const origin = (process.env.PLAYABLE_URL ?? 'http://127.0.0.1:5444').replace(/\/$/, ''), out = process.env.PLAYABLE_OUT;
assert(out, 'Set PLAYABLE_OUT to the evidence folder.'); mkdirSync(out, { recursive: true });
const browser = await chromium.launch(), results = [], sizes = [[360, 640], [390, 844], [844, 390], [1440, 900]];
const check = (value, label) => { assert(value, label); results.push(label); };
async function open(size, touch = false) {
  const context = await browser.newContext({ viewport: { width: size[0], height: size[1] }, hasTouch: touch });
  await context.route(/supabase\.co/, route => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
  const page = await context.newPage(); page.setDefaultTimeout(10000);
  page.on('pageerror', e => { results.push(`PAGE ERROR: ${e.message}`); });
  await page.goto(`${origin}/next.html`); await page.waitForSelector('.play-home');
  return { context, page };
}
async function seed(page, type) {
  await page.evaluate(async type => {
    const { Game } = await import('/src/game.ts'), { DraftTurn } = await import('/src/interface/play/turn.ts');
    const { snapshot, rulesOf } = await import('/src/interface/play/saved.ts');
    const { rulesFor, DEFAULT_OPTIONS } = await import('/src/interface/play/new-game.ts');
    const hand = type === 'names' ? ['Salvation', 'EarthQuake', 'Sacrifice', 'FireStarter'] : ['Freeze', 'IceWall', 'Haste', 'Flight'];
    const rules = type === 'cards' ? rulesFor('cards', Math.random, { ...DEFAULT_OPTIONS, cardPool: hand }) : type === 'powers'
      ? rulesOf('powers', [{ king: 'Frost', power: 'Freeze' }, { king: 'Frost', power: 'IceWall' }], [[], []])
      : rulesOf('both', [{ king: 'Spirit', power: 'HolyLight' }, { king: 'Shadow', power: 'Darkness' }], [hand, hand]);
    const game = new Game('RNBQKBNR', rules);
    game.play(game.legal.find(m => m.from === 12 && m.to === 28)); game.play(game.legal.find(m => m.from === 52 && m.to === 36));
    localStorage.setItem('kingdown.save', JSON.stringify({ ...snapshot(new DraftTurn(game)), skill: 'beginner', pace: 'off' }));
    localStorage.setItem('kingdown.piece-view', 'figures'); localStorage.setItem('kingdown.hand', 'hand');
  }, type);
  await page.reload(); await page.waitForSelector('.home-game-row'); await page.locator('.home-game-row').first().click();
  await gameReady(page);
}
async function gameReady(page) {
  await page.waitForFunction(() => { const g = document.querySelector('.play-game'); return g && g.style.visibility !== 'hidden' && ['ready', 'draft'].includes(g.dataset.state) && !document.querySelector('.play-versus'); }).catch(async e => { console.log('Not ready:', page.url(), await page.locator('body').innerText()); await shot(page, 'fault'); throw e; });
  await page.waitForTimeout(200);
}
async function shot(page, name, fullPage = false) { await page.screenshot({ path: join(out, `${page.viewportSize().width}x${page.viewportSize().height}-${name}.png`), fullPage }); }
async function geometry(page, type) {
  const m = await page.evaluate(() => {
    const rect = n => n.getBoundingClientRect().toJSON(), game = document.querySelector('.play-game');
    return { layout: game.dataset.layout, own: rect(document.querySelector('.play-own')), board: rect(document.querySelector('.play-board')), turn: rect(document.querySelector('.play-turn')),
      cards: [...document.querySelectorAll('.play-own .play-card')].map(n => ({ box: rect(n), art: rect(n.querySelector('img')), font: getComputedStyle(n).fontSize, angle: getComputedStyle(n).transform })),
      coins: [...document.querySelectorAll('.play-power')].map(n => ({ box: rect(n), state: n.dataset.coin, img: n.querySelector('img').complete && n.querySelector('img').naturalWidth > 0 })),
      stack: rect(document.querySelector('.play-rival-cards')), count: document.querySelector('.play-rival-count').textContent,
      menu: rect(document.querySelector('.play-opp > button')), group: rect(document.querySelector('.play-opponent-group')),
      scroll: document.documentElement.scrollHeight > innerHeight || document.documentElement.scrollWidth > innerWidth };
  });
  check(m.cards.length === 4 && m.count === '4', `${type}: both hands show four cards`);
  check(m.coins.length === (type === 'cards' ? 0 : 2), `${type}: no empty coin`);
  check(!m.scroll && m.own.bottom <= m.turn.top + 1, `${type}: hand and finish fit without page scroll`);
  if (m.layout === 'portrait') check(m.cards.every(c => c.box.top >= m.board.bottom), `${type}: hand stays below the home rank`);
  check(m.cards.every(c => c.box.width >= 44 && c.box.height >= 44 && c.art.height >= 35 && c.font === '14px'), `${type}: cards have 44 px targets, visible art and 14 px names`);
  check(m.cards.some(c => c.angle !== 'none'), `${type}: the resting hand is a fan`);
  check(m.coins.every(c => c.img && c.box.width >= 44 && c.box.height >= 44), `${type}: both power emblems load in touch targets`);
  check(m.menu.left >= m.group.right + 6 && m.stack.width >= 44, `${type}: Menu stands apart from the resource group`);
}
try {
  for (const size of sizes) for (const type of ['both', 'cards']) {
    const { context, page } = await open(size, size[0] === 360);
    try {
      await seed(page, type); await geometry(page, type); await shot(page, `${type}-resting`);
      const freeze = page.locator('.play-own .play-card').filter({ hasText: 'Freeze' });
      if (size[0] === 360) { await freeze.tap(); check(await freeze.getAttribute('aria-pressed') === 'true', `${type}: touch selects the card`); await freeze.tap(); }
      await freeze.focus(); await page.keyboard.press('Enter');
      check(await freeze.getAttribute('aria-pressed') === 'true', `${type}: keyboard selects a card`); await shot(page, `${type}-selected`);
      await page.locator('.play-square[data-square="57"]').click();
      check(await freeze.getAttribute('data-spent') === 'true' && await freeze.locator('.play-card-state').innerText() === 'Used', `${type}: a played card is Used`);
      check(await freeze.evaluate(n => getComputedStyle(n).transform === 'none'), `${type}: the used card lies flat`); await shot(page, `${type}-used`);
      await page.reload(); await page.waitForSelector('.home-game-row'); await page.locator('.home-game-row').first().click(); await gameReady(page);
      check(await page.locator('.play-own .play-card[data-spent="true"]').count() === 1, `${type}: resume keeps the used card`);
      await page.locator('.play-square[data-square="6"]').click(); await page.locator('.play-square[data-square="21"]').click();
      check(await page.locator('.play-turn button').last().getAttribute('aria-disabled') === 'false', `${type}: a move after the card can finish`);
      await page.locator('.play-turn button').last().click(); await gameReady(page);
      check(await page.locator('.play-own .play-card[data-spent="true"]').count() >= 1, `${type}: a whole turn and the computer reply keep the used state`);
      await page.locator('.play-rival-cards').click();
      check(await page.locator('.play-rival-rows button').count() === 4, `${type}: the stack opens all opponent cards`);
      if (size[0] === 390 && type === 'both') {
        await page.keyboard.press('Escape');
        await page.getByRole('button', { name: 'Menu', exact: true }).click();
        await page.getByRole('switch', { name: /Use ribbon/ }).click();
        await page.getByRole('button', { name: 'Close menu', exact: true }).first().click();
        await page.waitForSelector('.play-game[data-reading=normal]'); await page.waitForTimeout(300);
        if (await page.locator('.play-rival-rows').count()) { await page.locator('.play-reader').getByRole('button', { name: 'Close menu', exact: true }).click(); await page.waitForTimeout(200); }
        check(await page.locator('.play-game').getAttribute('data-hand') === 'ribbon', 'Ribbon remains a working setting'); await shot(page, 'ribbon');
      }
    } finally { await context.close(); }
  }
  for (const size of sizes) {
    const { context, page } = await open(size);
    try {
      await seed(page, 'powers');
      const coin = page.locator('.play-own .play-power');
      check(await coin.getAttribute('data-coin') === 'ready' && await coin.locator('.play-power-notch').count() === 1, 'ready coin has its use notch');
      await shot(page, 'coin-ready'); await coin.click();
      check(await coin.getAttribute('data-coin') === 'armed', 'armed coin has its own state'); await shot(page, 'coin-armed');
      await page.locator('.play-square[data-square="57"]').click();
      check(await coin.getAttribute('data-coin') === 'used' && await coin.locator('small').innerText() === 'Used', 'used coin has a flat Used state'); await shot(page, 'coin-used');
    } finally { await context.close(); }
  }
  {
    const { context, page } = await open([360, 640]);
    try {
      await seed(page, 'names');
      check(await page.locator('.play-card [data-button-label]').evaluateAll(nodes => nodes.every(n => n.scrollWidth <= n.clientWidth && n.scrollHeight <= 34)), 'long card names fit the 14 px top label');
      await shot(page, 'long-card-names');
    } finally { await context.close(); }
  }
  // The real online host redraws Play after a local server reply changes. No live account or service is used.
  for (const size of sizes) {
    const { context, page } = await open(size);
    try {
      const template = await page.evaluate(async () => {
        const { Game } = await import('/src/game.ts'), { toFen } = await import('/src/rules/setup.ts'), { rulesOf } = await import('/src/interface/play/saved.ts');
        const hand = ['Freeze', 'IceWall', 'Haste', 'Flight'];
        const game = new Game('RNBQKBNR', rulesOf('both', [{ king: 'Spirit', power: 'HolyLight' }, { king: 'Shadow', power: 'Darkness' }], [hand, hand]));
        return { fen: toFen(game.pos), rules: game.rules, history: { initial_fen: toFen(game.pos), actions: [] }, legal: game.legal.map(m => game.context.toLan(game.pos, m)) };
      });
      const now = new Date().toISOString(), deadline = new Date(Date.now() + 2 * 864e5).toISOString();
      const views = Array.from({ length: 6 }, (_, i) => ({ ...template, game_id: `h-game-${i}`, revision: 1, created_at: now, server_now: now, abort_open: false, rating_policy: 'casual', seat: 0, kind: 'friend', speed: 'daily', days_per_move: 3, status: 'playing', turn: 0, action: 'ready', last_commands: [], opponent: { handle: ['alexandra-r', 'bo', 'carol', 'dana', 'erin', 'frank'][i], user_id: `h-user-${i}`, computer: false, deleted: false, icon: null }, draw_offer: null, deadline_at: deadline, kings: template.rules.kings, hands: template.rules.hands }));
      let count = 2, revision = 1, reads = 0;
      await context.addInitScript(() => {
        const now = Math.floor(Date.now() / 1000);
        localStorage.setItem('kingdown.auth', JSON.stringify({ access_token: 'local-check', token_type: 'bearer', expires_in: 86400, expires_at: now + 86400, refresh_token: 'local-check', user: { id: 'h-tester', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' } }));
      });
      await context.route('**/api/**', route => {
        const path = new URL(route.request().url()).pathname; if (path === '/api/me/games') reads++;
        const body = path === '/api/me/settings' ? { settings: {}, me: { handle: 'tester', icon: null } } : path === '/api/me/games' ? { games: views.slice(0, count).map(v => ({ game_id: v.game_id })), invitations: [] }
          : path === '/api/me/record' ? { handle: 'tester', icon: null, record: {}, blocks: [], history: [], next_before: null, next_blocks_after: null }
          : path.startsWith('/api/games/') ? { ...views.find(v => v.game_id === path.split('/')[3]), revision } : {};
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
      });
      for (count of [2, 4, 6]) {
        await page.reload(); await page.waitForFunction(n => document.querySelectorAll('.home-game-row').length === n, count);
        const list = page.locator('.home-game-list');
        check(await list.getAttribute('data-collapsed') === String(count > 3), `${count} games: the list applies the three-row rule`);
        const boxes = await list.locator('li:not([hidden])').evaluateAll(nodes => nodes.map(n => n.getBoundingClientRect().toJSON()));
        const box = await list.boundingBox();
        if (count > 3) check(Math.abs(box.height - (boxes[3].top - box.y + 80)) <= 1 && boxes[2].bottom <= box.y + box.height - 80, `${count} games: three full rows and half of the fourth`);
        check(await page.locator('.mini-board').first().evaluate(n => n.getBoundingClientRect().width) === 140, `${count} games: the board is 140 px`);
        check(await page.locator('.home-game-row strong').first().innerText() === 'alexandra-r', `${count} games: the opponent name stays visible`);
        await shot(page, `games-${count}`, true);
      }
      const all = page.getByRole('button', { name: 'Show all games', exact: true }); await all.focus(); await page.keyboard.press('Enter');
      check(await page.locator('.home-game-list').getAttribute('data-collapsed') === 'false', 'the chevron opens all games with a keyboard');
      const before = reads; revision = 2; views[0].opponent.handle = 'alexandra-r-updated'; await page.evaluate(() => { document.dispatchEvent(new Event('visibilitychange')); });
      await page.waitForFunction(() => document.querySelector('.home-game-row strong')?.textContent === 'alexandra-r-updated');
      check(reads > before, 'the online host reads a new games reply');
      check(await page.locator('.home-game-list > li:not([hidden])').count() === 6 && await page.locator('.all-games').count() === 0, 'a host refresh keeps all six rows open');
      await shot(page, 'games-open-refresh', true);
      await page.locator('.home-game-row').first().click(); await gameReady(page);
      check(await page.locator('.play-opponent-group > strong').innerText().then(t => t.includes('alexandra-r') && t.includes('left')), 'the person group shows their name and deadline');
      await shot(page, 'person-group');
    } finally { await context.close(); }
  }
  check(!results.some(r => r.startsWith('PAGE ERROR')), 'no page error');
} finally {
  await browser.close(); writeFileSync(join(out, 'checks.json'), JSON.stringify(results, null, 2) + '\n');
}
console.log(`${results.length} checks pass. Screenshots: ${out}`);
