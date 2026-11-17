/** Regression cases for the second merged repair. Uses a dev page and local account replies. */
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { env, launch, trapErrors, assertNoErrors } from './lib/checks.mjs';
import { visibleBounds } from './lib/visible-bounds.mjs';
const browser = await launch(), origin = env('PLAYABLE_URL'), out = env('PLAYABLE_OUT');
mkdirSync(out, { recursive: true });
const save = JSON.parse(readFileSync(new URL('../docs/specs/owner-playtest/board-fixture.json', import.meta.url)));
const sizes = (process.env.R2_SIZES || '360x640,390x844,844x390,1440x900').split(',').map(s => s.split('x').map(Number));
const results = [], failures = [];
const cell = (page, n) => page.locator(`.play-square[data-square="${n}"]`);
const ready = page => page.waitForFunction(() => document.querySelectorAll('.play-square').length === 64 && document.querySelector('.play-board-host')?.style.visibility !== 'hidden' && !document.querySelector('.play-home, .shell-departing'));
const home = async page => { await page.getByRole('button', { name: 'Menu', exact: true }).click(); await page.getByRole('button', { name: 'Back to home', exact: true }).click(); await page.waitForFunction(() => !document.querySelector('.play-game')); await page.waitForTimeout(650); };
const resume = async page => { await page.locator('.home-game-row[data-kind="computer"]').click(); await ready(page); };
const shot = async (page, size, name) => { await page.waitForTimeout(240); await page.screenshot({ path: join(out, `${size.join('x')}-${name}.png`), animations: 'disabled' }); };
async function startManual(page, type = 'cards', side = 'light') {
  await page.goto(new URL('next.html', origin).href);
  await page.evaluate(({ type, side }) => {
    localStorage.removeItem('kingdown.save'); localStorage.setItem('kingdown.game-type', type); localStorage.setItem('kingdown.side', side);
    localStorage.setItem('kingdown.game-options', JSON.stringify({ arrangement: 'manual', pool: ['B', 'N', 'R', 'G'] }));
  }, { type, side });
  await page.reload(); await page.locator('.play-home .kd-button[data-kind="main"]').click();
  await page.getByRole('button', { name: 'Start game', exact: true }).click();
  await page.locator('.play-game[data-state="arrange"]').waitFor(); await ready(page);
}
async function breakRules(page, side = 0) {
  const row = await page.locator('.play-square').evaluateAll((cells, side) => cells.sort((a, b) => Number(a.dataset.square) - Number(b.dataset.square)).slice(side * 56, side * 56 + 8).map(c => c.getAttribute('aria-label').split(' ').slice(2).join(' ')), side);
  // Find one swap that breaks both rules, with a deterministic trial of the eight-piece order.
  let pair;
  for (let a = 0; a < 8 && !pair; a++) for (let b = a + 1; b < 8 && !pair; b++) {
    const order = [...row]; [order[a], order[b]] = [order[b], order[a]];
    const bishops = order.flatMap((p, i) => p === 'Bishop' ? [i] : []);
    if (bishops.length === 2 && (bishops[0] + bishops[1]) % 2 === 0 && Math.abs(order.indexOf('Guard') - order.indexOf('King')) !== 1) pair = [a, b];
  }
  assert(pair, 'the deal admits a swap that breaks both rules');
  for (const i of pair) await cell(page, side * 56 + i).tap();
  assert.match(await page.locator('.play-arrange-rule').innerText(), /Bishops.*guard/s);
}
async function clearBoard(page) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollHeight > innerHeight), false, 'no page scroll');
  const layout = await page.locator('.play-game').getAttribute('data-layout');
  if (layout === 'portrait') {
    const reader = await page.locator('.play-detail').boundingBox(), board = await page.locator('.play-board').boundingBox();
    assert(reader.y >= board.y + board.height - 1, 'the reader stays below the board');
  }
}
const cases = {
  async cards(page, context, size) {
    await context.addInitScript(save => localStorage.setItem('kingdown.save', JSON.stringify(save)), { ...save, rules: { ...save.rules, kings: [{ king: 'Spirit', power: 'HolyLight' }, { king: 'Shadow', power: 'Darkness' }] } });
    await page.goto(new URL('next.html', origin).href); await resume(page);
    await page.locator('.play-rival-cards').tap();
    await visibleBounds(page, '.play-rival-rows button', true); await shot(page, size, 'opponent-cards');
    const count = await page.locator('.play-rival-rows button').count(); assert.equal(count, 4);
    for (let i = 0; i < count; i++) {
      const name = await page.locator('.play-rival-rows button').nth(i).innerText();
      await page.locator('.play-rival-rows button').nth(i).tap();
      await page.locator('.learn-panel').waitFor(); assert.match(await page.locator('.learn-top').innerText(), new RegExp(name.split('\n')[0]));
      await page.keyboard.press('Escape'); await page.locator('.play-rival-cards').tap();
    }
    await page.keyboard.press('Escape'); await page.locator('.play-opp .play-power').tap();
    await visibleBounds(page, '.play-reader .learn-owner, .play-reader .learn-short'); await shot(page, size, 'opponent-power');
  },
  async manual(page, context, size) {
    for (const type of ['powers', 'cards', 'both']) for (const side of [0, 1]) {
      await startManual(page, type, side ? 'dark' : 'light'); await breakRules(page, side);
      if (type !== 'powers' && process.env.R2_BADGE !== 'off') {
        assert.equal(await page.locator('.play-rival-count').textContent(), '4', 'Manual creates the badge with the dealt hand size');
        assert.match(await page.locator('.play-rival-cards').getAttribute('aria-label'), /4 cards/);
      }
      await visibleBounds(page, '.play-headline, .play-arrange-rule');
      await visibleBounds(page, '.play-turn button', true); await clearBoard(page);
      assert.equal(await page.locator('.play-history-strip').isVisible(), true, 'history has its own row during Manual instructions');
      if (size[0] === 1440 && type !== 'powers') await visibleBounds(page, '.play-rival-count');
      await shot(page, size, `manual-${type}-${side}-warning`);
      await home(page);
    }
  },
  async saves(page, context, size) {
    if (size[0] !== 360) return;
    for (const type of ['pieces', 'powers', 'cards', 'both']) {
      await startManual(page, type);
      const stale = await context.newPage(); await stale.goto(new URL('next.html', origin).href); await resume(stale);
      await stale.locator('.play-game[data-state="arrange"]').waitFor();
      const row = await page.locator('.play-square').evaluateAll(cells => cells.filter(n => Number(n.dataset.square) < 8).sort((a,b) => Number(a.dataset.square) - Number(b.dataset.square)).map(n => n.getAttribute('aria-label')));
      for (let i = 0; i < 4; i++) { await cell(page, i).tap(); await cell(page, 7 - i).tap(); }
      await page.getByRole('button', { name: 'Ready', exact: true }).tap();
      const saved = await page.evaluate(() => localStorage.getItem('kingdown.save')), marker = await page.evaluate(() => localStorage.getItem('kingdown.arrangement'));
      await stale.getByRole('button', { name: 'Ready', exact: true }).tap();
      assert.equal(await stale.evaluate(() => localStorage.getItem('kingdown.save')), saved, 'stale Ready cannot write over the newer game');
      assert.equal(await stale.evaluate(() => localStorage.getItem('kingdown.arrangement')), marker, 'stale Ready cannot write a setup marker');
      await home(stale); await resume(stale); await stale.locator('.play-game[data-state="ready"]').waitFor();
      await page.reload(); await resume(page); await page.locator('.play-game[data-state="ready"]').waitFor();
      for (const tab of [page, stale]) {
        const current = await tab.locator('.play-square').evaluateAll(cells => cells.filter(n => Number(n.dataset.square) < 8).sort((a,b) => Number(a.dataset.square) - Number(b.dataset.square)).map(n => n.getAttribute('aria-label').split(' ').slice(2).join(' ')));
        assert.deepEqual(current, [...row].reverse().map(s => s.split(' ').slice(2).join(' ')), 'each tab resumes the accepted order');
      }
      await stale.close(); await home(page);
    }
    await startManual(page);
    await page.evaluate(() => { const write = Storage.prototype.setItem; window.saveFails = true; Storage.prototype.setItem = function(key, value) { if (key === 'kingdown.save' && window.saveFails) throw new DOMException('full', 'QuotaExceededError'); return write.call(this, key, value); }; });
    await page.getByRole('button', { name: 'Ready', exact: true }).tap(); await page.locator('.play-game[data-state="ready"]').waitFor();
    await home(page);
    await page.locator('.home-top-new:visible, .home-side-new:visible').first().click();
    await page.locator('.new-game-panel[open]').waitFor();
    assert.equal(await page.locator('.new-game-panel .panel-warning').isVisible(), true, 'the memory game keeps the replacement warning');
    await page.locator('.new-game-panel').getByRole('button', { name: 'Close', exact: true }).click();
    await resume(page); await page.locator('.play-game[data-state="ready"]').waitFor();
    await page.evaluate(() => { window.saveFails = false; });
    await cell(page, 8).tap(); await cell(page, 16).tap();
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('kingdown.save')).back), '', 'the next write saves the confirmed FEN game');
  },
  async rematches(page, context, size) {
    if (size[0] !== 360) return;
    for (const type of ['pieces', 'powers', 'cards', 'both']) for (const side of [0, 1]) {
      await startManual(page, type, side ? 'light' : 'dark');
      await page.getByRole('button', { name: 'Ready', exact: true }).tap();
      await page.getByRole('button', { name: 'Menu', exact: true }).tap();
      await page.getByRole('button', { name: 'Resign', exact: true }).tap();
      await page.locator('dialog[open]').getByRole('button', { name: 'Resign', exact: true }).tap();
      await page.getByRole('button', { name: 'Rematch', exact: true }).tap();
      await page.locator('.play-game[data-state="arrange"]').waitFor();
      const saved = await page.evaluate(() => localStorage.getItem('kingdown.save'));
      assert.equal(JSON.parse(saved).back, '', 'the Manual rematch starts from FEN');
      if (type === 'both') await breakRules(page, side);
      assert.equal(await page.evaluate(() => localStorage.getItem('kingdown.save')), saved, 'the invalid draft does not enter the save');
      await page.reload(); await resume(page); await page.locator('.play-game[data-state="arrange"]').waitFor();
      await home(page); await resume(page); await page.locator('.play-game[data-state="arrange"]').waitFor();
      await page.getByRole('button', { name: 'Ready', exact: true }).tap();
      await page.locator('.play-game[data-state="arrange"]').waitFor({ state: 'detached' });
      if (type === 'cards' || type === 'both') assert.equal(await page.locator('.play-rival-count').textContent(), '4', 'Ready keeps all four cards');
      await home(page); await resume(page);
      assert.equal(await page.locator('.play-game').getAttribute('data-state') === 'arrange', false, 'unchanged Ready resumes play');
      await home(page);
    }
  },
  async accounts(page, context, size) {
    if (size[0] !== 360) return;
    await page.goto(new URL('next.html', origin).href); await page.locator('.play-home').waitFor();
    const template = await page.evaluate(async () => {
      const { Game } = await import('/src/game.ts'), { toFen } = await import('/src/rules/setup.ts');
      const game = new Game('RNBQKBNR', { kings: [{ king: 'Spirit', power: 'Mercy' }, { king: 'Shadow', power: 'Darkness' }], hands: [[], []] });
      return { fen: toFen(game.pos), rules: game.rules, history: { initial_fen: toFen(game.pos), actions: [] }, legal: game.legal.map(m => game.context.toLan(game.pos, m)) };
    });
    await context.route('**/src/account/client.ts*', route => route.fulfill({ contentType: 'text/javascript', body: 'export function connect() { return window.checkAuth; }' }));
    await context.addInitScript(() => {
      let actor = 'alice'; const listeners = [];
      const session = () => actor ? { userId: actor, accessToken: actor } : null;
      window.checkAuth = { readSession: async () => session(), onSession: cb => { listeners.push(cb); return () => {}; }, providers: async () => ['email'], sendEmailCode: async () => {}, verifyEmailCode: async () => { actor = 'bob'; for (const cb of listeners) cb({ user: { id: actor } }); } };
      window.checkSignOut = () => { actor = null; for (const cb of listeners) cb(null); };
      localStorage.setItem('kingdown.auth', 'fixture');
      if (sessionStorage.getItem('refuse-king')) { const write = Storage.prototype.setItem; Storage.prototype.setItem = function(key, value) { if (key.startsWith('kingdown.people-king.')) throw new DOMException('full', 'QuotaExceededError'); return write.call(this, key, value); }; }
    });
    const gameId = '11111111-1111-1111-1111-111111111111', bobId = '22222222-2222-2222-2222-222222222222';
    const makeView = id => ({ ...template, options: { kingPowers: true, cards: false }, game_id: id, revision: 1, server_now: new Date().toISOString(), status: 'playing', seat: 0, turn: 0, action: 'ready', kind: 'friend', speed: 'daily', days_per_move: 3, deadline_at: new Date(Date.now() + 864e5).toISOString(), abort_open: false, last_commands: [], opponent: { handle: 'opponent', user_id: 'other', computer: false, deleted: false, icon: null }, draw_offer: null });
    let release, held = false, mode = 'accept', redeemed = false;
    const tokenA = 'a'.repeat(43), tokenB = 'b'.repeat(43);
    await context.route('**/api/**', async route => {
      const req = route.request(), path = new URL(req.url()).pathname, bob = req.headers().authorization === 'Bearer bob';
      const json = body => route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) });
      if (path === '/api/me/settings') return json({ me: { handle: bob ? 'bob' : 'alice', icon: null }, settings: {} });
      if (path === '/api/me/games') return json({ games: redeemed ? [{ game_id: gameId }, { game_id: bobId }] : [], invitations: !redeemed && mode.includes('accept') ? [{ invite_id: 'invite', game_id: gameId, revision: 1, direction: 'incoming', state: 'open', player: { user_id: 'other', handle: 'opponent', icon: null }, options: null }] : [] });
      if (path === '/api/me/record') return json({ history: [], record: {}, blocks: [] });
      if (path === '/api/invites/preview') return json({ code: 'OK', creator: { handle: 'opponent', icon: null }, colour: 'white', options: { kingPowers: true, cards: false } });
      if (path === '/api/invites/redeem') {
        if (held && !bob) { await new Promise(done => { release = done; }); }
        if (mode.startsWith('reject') && !bob) return route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ code: 'UNAUTHENTICATED', message: 'Old account request.' }) });
        redeemed = true; return json(makeView(bob ? bobId : gameId));
      }
      return json(makeView(path.includes(bobId) ? bobId : gameId));
    });
    for (const path of ['accept', 'join', 'reject-accept', 'reject-join', 'notice-accept', 'notice-join']) {
      if (process.env.R2_ACCOUNT_MODE && !path.startsWith(process.env.R2_ACCOUNT_MODE)) continue;
      console.log('account path', path);
      mode = path; redeemed = false; held = !path.startsWith('notice'); release = undefined;
      await page.evaluate(fail => { localStorage.clear(); sessionStorage.clear(); if (fail) sessionStorage.setItem('refuse-king', 'yes'); }, !held);
      await page.goto(new URL(`next.html?account=${path}${path.endsWith('join') ? '#join=' + tokenA : ''}`, origin).href);
      if (path.endsWith('accept')) await page.getByRole('button', { name: 'Accept', exact: true }).click();
      else await page.getByRole('button', { name: 'Join the game', exact: true }).click();
      if (held) {
        for (let i = 0; i < 20 && !release; i++) await page.waitForTimeout(50);
        assert(release, `the old account ${path} reaches the stand-in server`);
        await page.evaluate(() => window.checkSignOut());
        await page.locator('.play-home').waitFor();
        await page.evaluate(token => { location.hash = 'join=' + token; }, tokenB);
        await page.getByRole('button', { name: 'Join the game', exact: true }).click();
        await page.getByRole('button', { name: 'Continue with email', exact: true }).click();
        await page.getByRole('textbox', { name: 'Email', exact: true }).fill('bob@fixture.test');
        await page.getByRole('button', { name: 'Send code', exact: true }).click();
        await page.getByRole('textbox', { name: 'Code', exact: true }).fill('123456');
        await page.getByRole('button', { name: 'Continue', exact: true }).click(); await ready(page);
        await page.getByRole('button', { name: 'Menu', exact: true }).click();
        const before = await page.evaluate(() => ({ hash: location.hash, page: document.body.dataset.page, menu: document.querySelector('.play-reader[data-floating="true"]')?.innerText, sheets: document.querySelectorAll('.people-sheet, dialog[open]').length }));
        release(); await page.waitForTimeout(700);
        const after = await page.evaluate(() => ({ hash: location.hash, page: document.body.dataset.page, menu: document.querySelector('.play-reader[data-floating="true"]')?.innerText, sheets: document.querySelectorAll('.people-sheet, dialog[open]').length }));
        assert.deepEqual(after, before, `late ${path} leaves B's game and layers unchanged`);
        assert.equal(await page.getByText('The invite cannot accept right now. Try again.', { exact: true }).count(), 0);
      } else {
        await ready(page);
        const notice = page.locator('.play-detail').getByText('Your king stays for this visit. It cannot save on this device.', { exact: true });
        await notice.waitFor(); await visibleBounds(page, '.play-headline-line'); await shot(page, size, path);
        assert.equal(await notice.count(), 1, 'one game notice');
        await home(page); assert.equal(await page.getByText('Your king stays for this visit. It cannot save on this device.', { exact: true }).count(), 0, 'no stale home notice');
        await page.locator(`.home-game-row[data-game="${bobId}"]`).click(); await ready(page);
        assert.equal(await notice.count(), 0, 'the next game clears the notice');
      }
    }
  },
  async online(page, context, size) {
    await page.goto(new URL('next.html', origin).href); await page.locator('.play-home').waitFor();
    const template = await page.evaluate(async () => {
      const { Game } = await import('/src/game.ts'), { toFen } = await import('/src/rules/setup.ts'), { rulesOf } = await import('/src/interface/play/saved.ts');
      const hand = ['Freeze', 'IceWall', 'Haste', 'Flight'], game = new Game('RNBQKBNR', rulesOf('both', [{ king: 'Spirit', power: 'HolyLight' }, { king: 'Shadow', power: 'Darkness' }], [hand, hand]));
      return { fen: toFen(game.pos), rules: game.rules, history: { initial_fen: toFen(game.pos), actions: [] }, legal: game.legal.map(m => game.context.toLan(game.pos, m)) };
    });
    const now = new Date().toISOString();
    let authFail = false, commandFails = false;
    let view = { ...template, game_id: 'r2-online', revision: 1, server_now: now, created_at: now, status: 'playing', seat: 0, turn: 0, action: 'ready', kind: 'friend', speed: 'daily', days_per_move: 3, deadline_at: new Date(Date.now() + 864e5).toISOString(), abort_open: false, rating_policy: 'casual', last_commands: [], opponent: { handle: 'opponent', user_id: 'other', computer: false, deleted: false, icon: null }, draw_offer: 1, kings: template.rules.kings, hands: template.rules.hands };
    await context.addInitScript(() => {
      const now = Math.floor(Date.now() / 1000);
      localStorage.setItem('kingdown.auth', JSON.stringify({ access_token: 'local-check', refresh_token: 'local-check', token_type: 'bearer', expires_at: now + 86400, expires_in: 86400, user: { id: 'r2-tester', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' } }));
    });
    await context.route('**/api/**', route => {
      const req = route.request(), path = new URL(req.url()).pathname;
      const json = value => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(value) });
      if (path === '/api/me/settings') return json({ me: { handle: 'tester', icon: null }, settings: {} });
      if (path === '/api/me/games') return json({ games: [{ game_id: view.game_id }], invitations: [] });
      if (path === '/api/me/record') return json({ history: [], record: {}, blocks: [] });
      if (authFail && path.startsWith('/api/games/')) return route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ code: 'UNAUTHENTICATED', message: 'The fixture session ends.' }) });
      if (path.endsWith('/commands') && commandFails) return route.abort('failed');
      if (path.endsWith('/commands')) { const body = req.postDataJSON(); view = { ...view, revision: view.revision + 1, draw_offer: body.action.type === 'claim' ? view.draw_offer : null, deadline_at: new Date(Date.now() + 864e5).toISOString() }; return json({ type: 'ack', command_id: body.command_id, revision: view.revision, view }); }
      return json(view);
    });
    await page.reload(); await page.locator('.home-game-row[data-game]').first().click(); await ready(page);
    await page.getByRole('button', { name: 'Accept draw', exact: true }).waitFor();
    await visibleBounds(page, '.online-status p'); await visibleBounds(page, '.online-actions button', true);
    await clearBoard(page); await shot(page, size, 'opponent-draw-offer');
    const panels = async label => {
      if (label === 'auth') { await page.locator('.people-sheet[open]').waitFor(); await page.keyboard.press('Escape'); await page.locator('.people-sheet[open]').waitFor({ state: 'detached' }); }
      await page.locator('.play-rival-cards').tap();
      assert.equal(await page.locator('.play-rival-rows button').count(), 4, 'the open subject takes priority over online actions');
      await visibleBounds(page, '.play-rival-rows button', true); await shot(page, size, `online-${label}-cards`);
      for (let i = 0; i < 4; i++) {
        const name = await page.locator('.play-rival-rows button').nth(i).innerText();
        await page.locator('.play-rival-rows button').nth(i).tap(); await page.locator('.learn-panel').waitFor();
        assert.match(await page.locator('.learn-top').innerText(), new RegExp(name.split('\n')[0]));
        await page.keyboard.press('Escape'); await page.locator('.play-rival-cards').tap();
      }
      await page.keyboard.press('Escape');
      await page.locator('.play-opp .play-power').tap();
      await visibleBounds(page, '.play-reader .learn-owner, .play-reader .learn-short');
      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: label === 'draw' ? 'Accept draw' : label === 'check' ? 'Check again' : 'Sign in again', exact: true }).waitFor();
    };
    if (process.env.R2_ONLINE_MODE !== 'actions') await panels('draw');
    commandFails = true;
    await page.getByRole('button', { name: 'Keep playing', exact: true }).tap();
    await page.getByRole('button', { name: 'Check again', exact: true }).waitFor();
    await visibleBounds(page, '.online-status p'); await visibleBounds(page, '.online-actions button', true); await clearBoard(page);
    assert.equal(await page.getByRole('button', { name: 'Accept draw', exact: true }).count(), 0, 'send recovery defers the draw reply');
    await shot(page, size, 'draw-reply-checking');
    if (process.env.R2_ONLINE_MODE !== 'actions') await panels('check');
    commandFails = false;
    await page.getByRole('button', { name: 'Check again', exact: true }).tap();
    await page.waitForFunction(() => !document.querySelector('.online-actions button'));
    assert.equal(await page.locator('.play-history-strip').isVisible(), true, 'history returns after recovery and draw reply end');
    await page.evaluate(() => localStorage.setItem('kingdown.account-command.r2-tester', 'bad receipt')); await page.reload();
    await page.locator('.home-game-row[data-game]').first().click(); await ready(page);
    await page.getByRole('button', { name: 'Check again', exact: true }).waitFor();
    await visibleBounds(page, '.online-status p'); await visibleBounds(page, '.online-actions button', true); await clearBoard(page);
    await shot(page, size, 'check-again');
    await page.getByRole('button', { name: 'Discard send', exact: true }).tap();
    await page.waitForFunction(() => !document.querySelector('.online-actions button'));
    assert.equal(await page.locator('.play-history-strip').isVisible(), true, 'history returns after send recovery');
    view = { ...view, draw_offer: 1, revision: view.revision + 1, server_now: new Date().toISOString(), turn: 1, fen: view.fen.replace(' w ', ' b '), history: { ...view.history, initial_fen: view.history.initial_fen.replace(' w ', ' b ') }, deadline_at: new Date(Date.now() - 1000).toISOString() };
    await page.reload(); await page.locator('.home-game-row[data-game]').first().click(); await ready(page);
    await page.getByRole('button', { name: 'Claim win', exact: true }).waitFor();
    await visibleBounds(page, '.online-status p'); await visibleBounds(page, '.online-actions button', true); await clearBoard(page);
    assert.equal(await page.getByRole('button', { name: 'Accept draw', exact: true }).count(), 0, 'claim defers the draw reply');
    await shot(page, size, 'draw-plus-claim');
    await page.getByRole('button', { name: 'Claim win', exact: true }).tap();
    await page.getByRole('button', { name: 'Accept draw', exact: true }).waitFor();
    await visibleBounds(page, '.online-actions button', true);
    await page.getByRole('button', { name: 'Keep playing', exact: true }).tap();
    await page.waitForFunction(() => !document.querySelector('.online-actions button'));
    assert.equal(await page.locator('.play-history-strip').isVisible(), true, 'history returns after the claim and draw reply end');
    authFail = true; await page.evaluate(() => window.dispatchEvent(new Event('online')));
    await page.getByRole('button', { name: 'Sign in again', exact: true }).waitFor();
    await visibleBounds(page, '.online-status p'); await visibleBounds(page, '.online-actions button', true); await clearBoard(page);
    await shot(page, size, 'sign-in-again');
    if (process.env.R2_ONLINE_MODE !== 'actions') await panels('auth');
    authFail = false;
    view = { ...view, draw_offer: 1, turn: 0, fen: view.fen.replace(' b ', ' w '), history: { ...view.history, initial_fen: view.history.initial_fen.replace(' b ', ' w ') }, deadline_at: new Date(Date.now() + 864e5).toISOString() };
    await page.reload(); await page.locator('.home-game-row[data-game]').first().click(); await ready(page);
    await page.getByRole('button', { name: 'Keep playing', exact: true }).tap();
    await page.waitForFunction(() => !document.querySelector('.online-actions button'));
    assert.equal(await page.locator('.play-history-strip').isVisible(), true, 'history returns when both groups end');
    const used = await page.evaluate(async template => {
      const { Game } = await import('/src/game.ts'), { toFen } = await import('/src/rules/setup.ts');
      const game = new Game('RNBQKBNR', template.rules), initial = template.history.initial_fen.replace(' w ', ' b ');
      game.load(game.context.fromFen(initial));
      const move = game.legal.find(m => m.power === 'freeze');
      if (!move) throw new Error('The fixture needs a legal opponent card.');
      const action = game.context.toLan(game.pos, move); game.play(move);
      const finish = game.legal.find(m => !m.power && !m.pass);
      if (!finish) throw new Error('The opponent needs a move after the card.');
      const final = game.context.toLan(game.pos, finish); game.play(finish);
      return { fen: toFen(game.pos), turn: game.pos.turn, history: { initial_fen: initial, actions: [action, final] } };
    }, template);
    view = { ...view, ...used, draw_offer: null, revision: view.revision + 1 };
    await page.reload(); await page.locator('.home-game-row[data-game]').first().click(); await ready(page);
    const replay = page.getByRole('button', { name: 'Replay', exact: true });
    assert.equal(await replay.count(), 1, 'an online opponent turn gives Replay');
    await replay.tap();
    assert.equal(await page.locator('.play-game').getAttribute('data-replaying'), null, 'reduced online Replay has no motion');
    view = { ...view, opponent: { ...view.opponent, handle: 'long-player-name-1234567890' } };
    await page.evaluate(() => window.dispatchEvent(new Event('online')));
    await page.waitForFunction(() => document.querySelector('.play-opponent-name')?.textContent === 'long-player-name-1234567890');
    assert.equal(await page.locator('.play-opponent-name').evaluate(n => getComputedStyle(n).whiteSpace), 'nowrap');
    assert.equal(await page.locator('.play-rival-count').innerText(), '3', 'an opponent card use reduces the badge');
    assert.match(await page.locator('.play-rival-cards').getAttribute('aria-label'), /3 cards left/);



  },
};
try {
  for (const size of sizes) for (const [name, run] of Object.entries(cases)) {
    if (process.env.R2_CASES && !process.env.R2_CASES.split(',').includes(name)) continue;
    const context = await browser.newContext({ viewport: { width: size[0], height: size[1] }, hasTouch: true, serviceWorkers: 'block', reducedMotion: 'reduce' });
    const page = await context.newPage(); page.setDefaultTimeout(10000); const errors = trapErrors(page, name === 'accounts' ? [{ pattern: /Failed to load resource: the server responded with a status of 401/, reason: 'The old account request is refused after sign-in as B.' }] : name === 'online' ? [{ pattern: /Failed to load resource: (?:the server responded with a status of 401|net::ERR_FAILED)/, reason: 'The fixture refuses the draw reply and ends the session.' }] : []);
    try { await run(page, context, size); assertNoErrors(errors); results.push({ name, size, ok: true }); console.log('ok', name, size.join('x')); }
    catch (error) { await shot(page, size, `failure-${name}`); failures.push(`${name} ${size.join('x')}: ${error.message}`); console.error(failures.at(-1)); }
    finally { await context.close(); }
  }
  writeFileSync(join(out, 'r2-results.json'), JSON.stringify({ results, failures }, null, 2));
  assert.equal(failures.length, 0, failures.join('\n'));
} finally { await browser.close(); }
