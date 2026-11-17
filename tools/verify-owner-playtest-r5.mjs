/** Send recovery, Ready refusals, obsolete panel actions, and king-save notices through unchanged polls. */
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { env, launch, trapErrors, assertNoErrors } from './lib/checks.mjs';
import { visibleBounds } from './lib/visible-bounds.mjs';

const browser = await launch(), origin = env('PLAYABLE_URL'), out = env('PLAYABLE_OUT');
mkdirSync(out, { recursive: true });
const sizes = (process.env.R5_SIZES || '360x640,390x844,844x390,1440x900').split(',').map(s => s.split('x').map(Number));
const saveLine = 'Your king stays for this visit. It cannot save on this device.', results = [], failures = [];
const cell = (page, n) => page.locator(`.play-square[data-square="${n}"]`);
const ready = page => page.waitForFunction(() => document.querySelectorAll('.play-square').length === 64 && document.querySelector('.play-board-host')?.style.visibility !== 'hidden' && !document.querySelector('.shell-departing'));
const playing = async page => { await page.waitForFunction(() => window.r6Controller?.state().view?.status === 'playing', null, { timeout: 10000 }); await ready(page); };
const shot = (page, size, name) => page.screenshot({ path: join(out, `${size.join('x')}-${name}.png`), animations: 'disabled' });

async function online(page, context, { setup = false, manual = false, seat = 0, accept = false, refuseAll = false, setupNotice = false, power = false, withCards = false, fen, readyFault, waiting = false } = {}) {
  let view, redeemed = false, commands = 0, fail = 'network', chooseFault = setupNotice;
  if (setup) await context.route('**/src/interface/people/controller.ts*', async route => {
    const response = await route.fetch(), body = await response.text(), marker = 'async ready(order) {';
    assert(body.includes(marker), 'the fixture counts the real Ready calls');
    // Bound the old emit loop so its failing check can finish. Every attempted storage write still refuses.
    await route.fulfill({ response, body: body.replace(marker, `${marker} globalThis.r6Controller = this; globalThis.r6ReadyCalls = (globalThis.r6ReadyCalls || 0) + 1; if (globalThis.r6ReadyCalls > 12) return false;
      if (globalThis.r6ReadyCalls === 1 && globalThis.r7ReadyFault === 'busy') localStorage.setItem('kingdown.account-command.tester', JSON.stringify({ name: 'kingdown_find', args: { game_id: 'another', command_id: 'busy' } }));
      if (globalThis.r7ReadyFault === 'offline') Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });`) });
  });
  await context.route('**/src/account/client.ts*', route => route.fulfill({ contentType: 'text/javascript', body: 'export function connect() { return { onSession() {}, readSession: async () => ({ userId: "tester", accessToken: "fixture" }) }; }' }));
  await context.addInitScript(({ refuse, refuseAll, readyFault }) => {
    localStorage.setItem('kingdown.auth', 'fixture');
    // Each fixture starts online. The offline cases set their own state below.
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
    // Full storage starts with an existing signed-in generation, before Ready can write.
    if (refuseAll) localStorage.setItem('kingdown.deleted-account.tester', JSON.stringify({ generation: 'ready-fixture', session: 'fixture', deleted: false }));
    window.r7ReadyFault = readyFault; window.r7RefuseKing = refuse; window.r6RefuseAll = refuseAll; window.r6ReceiptWrites = 0;
    window.r6WaitingLines = [];
    new MutationObserver(records => { for (const record of records) for (const node of record.addedNodes) if (node.nodeType === 1 && node.matches('.online-waiting')) window.r6WaitingLines.push(node.textContent); }).observe(document, { childList: true, subtree: true });
    if (refuse) { const write = Storage.prototype.setItem; Storage.prototype.setItem = function(key, value) {
      if (window.r6RefuseAll && key.startsWith('kingdown.account-command.')) window.r6ReceiptWrites++;
      if (window.r6RefuseAll || window.r7RefuseKing && key.startsWith('kingdown.people-king.')) throw new DOMException('full', 'QuotaExceededError'); return write.call(this, key, value);
    }; }
  }, { refuse: setup, refuseAll, readyFault });
  await context.route('**/api/**', async route => {
    const req = route.request(), path = new URL(req.url()).pathname;
    const json = value => route.fulfill({ contentType: 'application/json', body: JSON.stringify(value) });
    if (path === '/api/me/settings') return json({ me: { handle: 'tester', icon: null }, settings: {} });
    if (path === '/api/me/games') return json({ games: view && (!setup || redeemed) ? [{ game_id: view.game_id }] : [], invitations: view && setup && accept && !redeemed ? [{ invite_id: 'invite', game_id: view.game_id, revision: 1, direction: 'incoming', state: 'open', player: { user_id: 'other', handle: 'opponent', icon: null }, options: view.options }] : [] });
    if (path === '/api/me/record') return json({ history: [], record: {}, blocks: [] });
    if (path === '/api/invites/preview') return json({ code: 'OK', creator: { handle: 'opponent', icon: null }, colour: seat ? 'black' : 'white', options: view.options });
    if (path === '/api/invites/redeem') { redeemed = true; return json(view); }
    if (path.endsWith('/commands')) {
      commands++;
      const body = req.postDataJSON();
      if (body.action.type === 'abort' && waiting) { view = { ...view, status: 'setup', abort_open: false }; return route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ code: 'NOT_ALLOWED', message: 'The opponent joins.' }) }); }
      if (chooseFault || fail === 'refused') return route.fulfill({ status: 429, contentType: 'application/json', body: JSON.stringify({ code: 'RATE_LIMITED', message: 'Please try again later.' }) });
      if (body.action.type === 'choose') {
        view = { ...view, status: 'playing', revision: view.revision + 1, ready: [true, true] };
        return json({ type: 'ack', command_id: body.command_id, revision: view.revision, view });
      }
      if (fail === 'auth') return route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ code: 'UNAUTHENTICATED', message: 'The fixture session ends.' }) });
      return route.abort('failed');
    }
    return json(view);
  });
  await page.goto(new URL('next.html', origin).href); await page.locator('.play-home').waitFor();
  const template = await page.evaluate(async ({ setup, power, withCards, fen }) => {
    const { Game } = await import('/src/game.ts'), { toFen } = await import('/src/rules/setup.ts'), { rulesOf } = await import('/src/interface/play/saved.ts'), { DEFAULT_OPTIONS } = await import('/src/match/setup.ts'), { PAGE_ENGINE } = await import('/src/account-game/engine-identity.ts');
    const hand = ['Freeze', 'IceWall', 'Haste', 'Flight'];
    const game = new Game('RNBQKBNR', rulesOf(setup ? withCards ? 'both' : 'powers' : power ? 'powers' : 'cards', [{ king: power ? 'Frost' : 'Spirit', power: power ? 'Freeze' : 'Mercy' }, { king: 'Shadow', power: 'Darkness' }], [hand, hand]));
    if (fen) game.load(game.context.fromFen(fen));
    return { engine_fingerprint: PAGE_ENGINE ?? 'r5-fixture', fen: toFen(game.pos), rules: game.rules, history: { initial_fen: toFen(game.pos), actions: [] }, legal: game.legal.map(m => game.context.toLan(game.pos, m)), options: { ...DEFAULT_OPTIONS, kingPowers: setup || power, cards: withCards || !setup && !power, arrangement: false } };
  }, { setup, power, withCards, fen });
  view = { ...template, options: { ...template.options, arrangement: manual }, game_id: 'r5-online', revision: 1, server_now: new Date().toISOString(), status: waiting ? 'waiting' : setup ? 'setup' : 'playing', seat, turn: seat, action: 'ready', kind: 'friend', speed: 'daily', days_per_move: 3, deadline_at: new Date(Date.now() + 864e5).toISOString(), abort_open: waiting, last_commands: [], opponent: { handle: 'opponent', user_id: 'other', computer: false, deleted: false, icon: null }, draw_offer: null,
    ...(setup ? { draw: 'RNBQKBNR', deal: withCards ? ['Freeze', 'IceWall', 'Haste', 'Flight'] : [], ready: seat ? [manual || refuseAll, false] : [false, true] } : {}) };
  await page.goto(new URL(`next.html${setup && !accept ? '#join=' + 'a'.repeat(43) : ''}`, origin).href);
  if (setup) await page.getByRole('button', { name: accept ? 'Accept' : 'Join the game', exact: true }).click();
  else await page.locator('.home-game-row[data-game]').first().click();
  return { commands: () => commands, chooseFault: value => { chooseFault = value; }, fail: value => { fail = value; }, set: value => { view = { ...view, ...value }; }, move: async () => {
    const next = await page.evaluate(async view => {
      const { Game } = await import('/src/game.ts'), { toFen } = await import('/src/rules/setup.ts');
      const game = new Game(undefined, view.rules); game.load(game.context.fromFen(view.fen));
      const move = game.legal.find(m => !m.power), lan = game.context.toLan(game.pos, move), seat = game.pos.turn; game.play(move);
      return { fen: toFen(game.pos), turn: game.pos.turn, history: { ...view.history, actions: [...view.history.actions, lan] }, last_commands: [{ seq: view.revision + 1, seat, at: new Date().toISOString(), action: { type: 'turn', actions: [lan] } }] };
    }, view);
    view = { ...view, ...next, revision: view.revision + 1 };
  }, refresh: async () => {
    const response = page.waitForResponse(r => r.request().method() === 'GET' && new URL(r.url()).pathname === '/api/games/r5-online');
    await page.evaluate(() => window.dispatchEvent(new Event('online'))); await response;
    await page.evaluate(() => new Promise(requestAnimationFrame));
  } };
}
async function normalReader(page) {
  assert.equal(await page.locator('.play-detail .play-b').isVisible(), true, 'the normal reader returns inside the reader');
  const state = page.locator('.play-detail .play-b .play-turn-state');
  if (await state.count()) assert.match(await state.innerText(), /Your turn\./, 'the reader restores the turn state');
  else assert.equal(await page.locator('.play-detail .play-headline').innerText(), 'Move it again, or select Send.', 'the compact reader restores the Haste instruction');
}
async function bounds(page) {
  await visibleBounds(page, '.online-status p'); await visibleBounds(page, '.online-actions button', true);
  assert.equal(await page.evaluate(() => document.documentElement.scrollHeight > innerHeight), false, 'no page scroll');
  if (await page.locator('.play-game').getAttribute('data-layout') === 'portrait') {
    const reader = await page.locator('.play-detail').boundingBox(), board = await page.locator('.play-board').boundingBox();
    assert(reader.y >= board.y + board.height - 1, `recovery stays below the board: reader top ${reader.y}, board bottom ${board.y + board.height}`);
  }
}
async function send(page, context, size, auth = false) {
  const server = await online(page, context); await ready(page);
  if (auth) server.fail('auth');
  await page.locator('.play-own .play-card').filter({ hasText: 'Haste' }).tap();
  await cell(page, 1).tap(); await cell(page, 18).tap();
  assert.equal(await cell(page, 18).getAttribute('aria-selected'), 'true', 'Haste keeps its piece selected before Send');
  const send = page.getByRole('button', { name: 'Send', exact: true });
  assert.equal(await send.getAttribute('aria-disabled'), 'false'); await send.tap();
  await page.waitForFunction(() => localStorage.getItem('kingdown.account-command.tester') !== null);
  if (auth) {
    await page.locator('.people-sheet[open]').waitFor();
    await page.locator('.online-actions').getByRole('button', { name: 'Sign in again', exact: true }).waitFor();
    await page.keyboard.press('Escape');
    await bounds(page); await shot(page, size, 'haste-send-sign-in'); return;
  }
  const check = page.getByRole('button', { name: 'Check again', exact: true }); await check.waitFor();
  for (let i = 0; i < 2; i++) {
    // Each Check ends after all four transport attempts, not after the first failed request.
    const expected = server.commands() + 4;
    const failed = page.waitForEvent('requestfailed', request => request.url().endsWith('/commands') && server.commands() === expected);
    await check.tap(); await failed;
    await page.evaluate(() => new Promise(requestAnimationFrame));
  }
  await page.getByRole('button', { name: 'Discard send', exact: true }).waitFor();
  assert.equal(await cell(page, 18).getAttribute('aria-selected'), 'false', 'Send clears the selection at the same revision');
  await bounds(page); await shot(page, size, 'haste-send-recovery');
  await page.getByRole('button', { name: 'Discard send', exact: true }).tap();
  await page.waitForFunction(() => !document.querySelector('.online-actions'));
  assert.equal(await send.getAttribute('aria-disabled'), 'false', 'discard restores Send for the draft');
  await normalReader(page);
  assert.equal(server.commands(), 12, 'Send and two failed checks each make four transport attempts');
}
async function notice(page, context, size, manual, seat, accept) {
  const server = await online(page, context, { setup: true, manual, seat, accept });
  if (!manual && seat) {
    await page.locator('.online-waiting').waitFor();
    assert.equal((await page.locator('.online-waiting').innerText()).includes(saveLine), false, 'setup waiting does not take the save line');
    await server.refresh();
    assert.equal((await page.locator('.online-waiting').innerText()).includes(saveLine), false, 'a setup poll keeps the line pending');
    assert.equal(server.commands(), 0, 'the second seat waits through a setup poll');
    server.set({ ready: [true, false] }); await server.refresh();
  }
  if (manual) {
    await ready(page); await page.locator('.play-game[data-state="arrange"]').waitFor();
    assert.equal((await page.locator('.play-detail').innerText()).includes(saveLine), false, 'the arrangement reader does not take the save line');
    await server.refresh();
    assert.equal((await page.locator('.play-detail').innerText()).includes(saveLine), false, 'an arrangement poll keeps the line pending');
    await page.getByRole('button', { name: 'Ready', exact: true }).tap();
  }
  await ready(page); await page.locator('.play-game[data-state="arrange"]').waitFor({ state: 'detached' });
  assert.equal(await page.evaluate(line => window.r6WaitingLines.some(text => text.includes(line)), saveLine), false, 'no setup waiting frame shows the save line');
  const line = page.locator('.play-detail').getByText(saveLine, { exact: true }); await line.waitFor();
  await page.waitForTimeout(350); assert.equal(await line.isVisible(), true, 'the save line stays after setup ends');
  await visibleBounds(page, `.play-detail :text-is("${saveLine}")`); await shot(page, size, `king-save-${manual ? 'manual' : 'automatic'}-${seat}-${accept ? 'accept' : 'join'}`);
  for (let i = 0; i < 2; i++) { await server.refresh(); assert.equal(await line.isVisible(), true, 'the same revision keeps the save line'); }
  await shot(page, size, `king-save-same-revision-${manual ? 'manual' : 'automatic'}-${seat}-${accept ? 'accept' : 'join'}`);
  await server.move(); await server.refresh();
  assert.equal(await line.count(), 0, 'a move at a new revision ends the save line');
  await server.refresh(); assert.equal(await line.count(), 0, 'the line does not return after the revision changes');
}
async function menuSend(page, context, size, action) {
  const server = await online(page, context); await ready(page);
  server.set({ abort_open: true }); await server.refresh();
  await cell(page, 1).tap(); assert.equal(await cell(page, 1).getAttribute('aria-selected'), 'true');
  await page.getByRole('button', { name: 'Menu', exact: true }).tap();
  await page.locator('.game-menu').getByRole('button', { name: action, exact: true }).tap();
  if (action === 'Resign') await page.locator('dialog[open]').getByRole('button', { name: 'Resign', exact: true }).tap();
  await page.getByRole('button', { name: 'Close menu', exact: true }).tap();
  const check = page.getByRole('button', { name: 'Check again', exact: true }); await check.waitFor();
  for (let i = 0; i < 2; i++) {
    const expected = server.commands() + 4;
    const failed = page.waitForEvent('requestfailed', request => request.url().endsWith('/commands') && server.commands() === expected);
    await check.tap(); await failed; await page.evaluate(() => new Promise(requestAnimationFrame));
  }
  await page.getByRole('button', { name: 'Discard send', exact: true }).waitFor();
  await bounds(page); await shot(page, size, `menu-${action.toLowerCase().replaceAll(' ', '-')}-recovery`);
  await page.getByRole('button', { name: 'Discard send', exact: true }).tap();
  await page.waitForFunction(() => !document.querySelector('.online-actions'));
  await normalReader(page);
  assert.match(await page.locator('.play-detail .play-headline').innerText(), /Knight/, 'the selected piece returns after recovery');
  assert.equal(server.commands(), 12, 'the Menu command and two checks each make four attempts');
}
async function refusedReady(page, context, size, seat, accept) {
  const server = await online(page, context, { setup: true, refuseAll: true, seat, accept });
  const waiting = page.locator('.online-waiting'); await waiting.waitFor();
  const refused = waiting.getByText('This device cannot save the send. Free some space, then try again.', { exact: true }); await refused.waitFor();
  await page.waitForTimeout(750);
  assert.equal(await page.evaluate(() => window.r6ReceiptWrites), 1, 'a refused receipt does not repeat automatic Ready');
  assert.equal(await page.evaluate(() => window.r6ReadyCalls), 1, 'automatic Ready runs once during the fixed interval');
  await server.refresh(); assert.equal(await page.evaluate(() => window.r6ReceiptWrites), 1, 'a later poll does not repeat a refused automatic send');
  assert.equal(server.commands(), 0, 'no choose reaches the server without its receipt');
  assert.equal((await waiting.innerText()).includes(saveLine), false, 'the setup box keeps the king-save line pending');
  await visibleBounds(page, '.online-waiting .play-notice'); await visibleBounds(page, '.online-waiting button', true);
  assert.equal(await page.evaluate(() => document.documentElement.scrollHeight > innerHeight), false, 'waiting has no page scroll');
  await shot(page, size, `refused-storage-${seat}-${accept ? 'accept' : 'join'}`);
  await waiting.getByRole('button', { name: 'Back to home', exact: true }).tap(); await page.locator('.play-home').waitFor();
  // Home remains usable. Reopen without reload, then let the next scheduled poll retry.
  await page.locator('.home-game-row[data-game]').first().click(); await waiting.waitFor();
  await page.evaluate(() => { window.r6RefuseAll = false; window.r7RefuseKing = false; });
  await playing(page);
  assert.equal(server.commands(), 1, 'the next poll starts setup after storage works, without a reload');
  assert.equal(await page.evaluate(() => window.r6ReadyCalls), 2, 'one later Ready follows the refusal');
  await shot(page, size, `storage-works-after-poll-${seat}-${accept ? 'accept' : 'join'}`);

}
async function manualRefusal(page, context, size, fault) {
  const server = await online(page, context, { setup: true, manual: true, setupNotice: fault === 'rate' });
  await ready(page); await page.locator('.play-game[data-state="arrange"]').waitFor();
  await page.evaluate(fault => {
    if (fault === 'storage') window.r6RefuseAll = true;
    if (fault === 'offline') { Object.defineProperty(navigator, 'onLine', { configurable: true, value: false }); window.dispatchEvent(new Event('offline')); }
  }, fault);
  const finish = page.getByRole('button', { name: 'Ready', exact: true }); await finish.tap();
  const message = fault === 'storage' ? 'This device cannot save the send. Free some space, then try again.' : fault === 'offline' ? 'You are offline. Your unsent turn stays.' : 'Please try again later.';
  const line = page.locator('.play-detail').getByText(message, { exact: true }); await line.waitFor();
  await server.refresh(); assert.equal(await line.isVisible(), true, 'an unchanged poll keeps the Ready refusal');
  assert.equal((await page.locator('.play-detail').innerText()).includes(saveLine), false, 'Manual setup keeps the king-save line hidden');
  assert.equal(await finish.getAttribute('aria-disabled'), 'false', 'Ready permits a retry');
  await visibleBounds(page, '.play-detail .play-notice'); await visibleBounds(page, '.play-arrange-rule');
  assert.equal(await page.evaluate(() => document.documentElement.scrollHeight > innerHeight), false, 'Manual refusal has no page scroll');
  await shot(page, size, `manual-${fault}-refusal`);
  // Swap a rook and knight, then restore them. The order remains editable after a refusal.
  const before = await cell(page, 0).getAttribute('aria-label');
  await cell(page, 0).tap(); await cell(page, 1).tap();
  assert.notEqual(await cell(page, 0).getAttribute('aria-label'), before, 'the arrangement still changes');
  await cell(page, 0).tap(); await cell(page, 1).tap();
  assert.equal(await finish.getAttribute('aria-disabled'), 'false');
  await page.evaluate(() => { window.r6RefuseAll = false; window.r7RefuseKing = false; Object.defineProperty(navigator, 'onLine', { configurable: true, value: true }); window.dispatchEvent(new Event('online')); });
  server.chooseFault(false); await finish.tap(); await playing(page);
  assert.equal(await page.locator('.play-game[data-state="arrange"]').count(), 0, 'Ready ends setup after recovery');
}

async function lateInvite(page, context, size, action, exit, game) {
  await context.route('**/src/interface/people/host/index.ts*', async route => {
    const response = await route.fetch(), body = await response.text();
    assert(body.includes('function stopGame() {') && body.includes('controller = current;'));
    await route.fulfill({ response, body: body.replace('function stopGame() {', 'function stopGame() { globalThis.r9Stops = (globalThis.r9Stops || 0) + 1;').replace('controller = current;', 'controller = current; globalThis.r9Controller = current;') });
  });
  const server = await online(page, context); await ready(page);
  const home = async () => { await page.getByRole('button', { name: 'Menu', exact: true }).tap(); await page.getByRole('button', { name: 'Back to home', exact: true }).tap(); await page.locator('.play-home').waitFor(); };
  await home();
  let release, requested, submitted, created;
  const requestStarted = new Promise(resolve => { requested = resolve; });
  const held = new Promise(resolve => { release = resolve; });
  await context.route('**/api/friends*', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ friends: [{ handle: 'ada', icon: null }] }) }));
  await context.route('**/api/games', async route => {
    submitted = route.request().postDataJSON(); requested(); await held;
    created = await page.evaluate(async options => {
      const { Game } = await import('/src/game.ts'), { toFen } = await import('/src/rules/setup.ts');
      const g = new Game('RNBQKBNR');
      return { game_id: 'r9-created', revision: 1, status: 'waiting', seat: 0, turn: 0, kind: 'friend', speed: 'daily', options, rules: g.rules, fen: toFen(g.pos), history: { initial_fen: toFen(g.pos), actions: [] }, opponent: null, abort_open: true, last_commands: [] };
    }, submitted.options);
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ view: created, invite: { token: 'a'.repeat(43) } }) });
  });
  await page.getByRole('button', { name: 'New game', exact: true }).first().tap();
  const panel = page.locator('dialog.new-game-panel[open]');
  await panel.getByRole('checkbox', { name: 'With powers', exact: true }).check();
  await panel.locator('[data-section="pieces"]').tap(); await panel.getByRole('radio', { name: 'Manual', exact: true }).tap(); await panel.locator('[data-section="pieces"]').tap();
  await panel.getByRole('radio', { name: 'Player', exact: true }).tap();
  await panel.getByRole('button', { name: action === 'link' ? 'Send link' : 'Invite by name', exact: true }).tap();
  if (action === 'name') await panel.getByRole('button', { name: 'Invite ada', exact: true }).tap();
  await requestStarted;
  assert(submitted, 'the invite request starts before Close or Back');
  if (exit === 'back') {
    await panel.getByRole('button', { name: 'Back', exact: true }).tap();
    await panel.getByRole('checkbox', { name: 'With cards', exact: true }).check();
  } else if (exit === 'close') {
    await panel.getByRole('button', { name: 'Close', exact: true }).tap(); await panel.waitFor({ state: 'detached' });
    if (game === 'online') { await page.locator('.home-game-row[data-game="r5-online"]').tap(); await ready(page); }
    else {
      await page.getByRole('button', { name: 'New game', exact: true }).first().tap();
      await page.getByRole('button', { name: 'Start game', exact: true }).tap(); await ready(page);
    }
  }
  const before = await page.evaluate(() => ({ route: location.href, options: localStorage.getItem('kingdown.game-options'), type: localStorage.getItem('kingdown.game-type'), stops: document.querySelector('.play-game') ? window.r9Stops : null }));
  await page.evaluate(() => { window.r9Board = document.querySelector('.play-game'); window.r9Current = window.r9Controller; });
  release();
  await page.waitForFunction(() => !!localStorage.getItem('kingdown.people-king.tester.r9-created.0'));
  await page.waitForTimeout(200);
  if (exit === 'normal') {
    await page.locator('.play-home').waitFor();
    assert.equal(await page.evaluate(() => localStorage.getItem('kingdown.game-type')), submitted.options.cards ? 'both' : 'powers', 'an open panel applies the submitted options');
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('kingdown.game-options')).arrangement), 'manual', 'the submitted arrangement is stored');
  } else {
    assert.deepEqual(await page.evaluate(() => ({ route: location.href, options: localStorage.getItem('kingdown.game-options'), type: localStorage.getItem('kingdown.game-type'), stops: document.querySelector('.play-game') ? window.r9Stops : null })), before, 'a late reply keeps the route, stored options and controller');
    if (exit === 'back') { assert.equal(await panel.isVisible(), true); assert.equal(await panel.getByRole('checkbox', { name: 'With cards', exact: true }).isChecked(), true); await panel.getByRole('button', { name: 'Close', exact: true }).tap(); }
    else {
      assert.equal(await page.evaluate(() => window.r9Board === document.querySelector('.play-game') && window.r9Current === window.r9Controller), true, 'the current game and controller stay mounted');
      await shot(page, size, `late-${action}-${game}`);
      if (game === 'online') { await server.move(); await server.refresh(); assert.equal(await page.evaluate(() => window.r9Current.state().view.revision), 2, 'the online controller still receives moves'); }
      else { await cell(page, 8).tap(); await cell(page, 16).tap(); await page.getByRole('button', { name: 'End turn', exact: true }).tap(); await page.waitForFunction(() => JSON.parse(localStorage.getItem('kingdown.save')).moves.length >= 2); }
      await home();
    }
  }
  await page.locator('.home-game-row[data-game="r9-created"]').waitFor();
}
async function noticePriority(page, context, size) {
  const server = await online(page, context, { setup: true, setupNotice: true });
  const setup = page.locator('.online-waiting, .play-detail'); await setup.getByText('Please try again later.', { exact: true }).waitFor();
  assert.equal((await setup.innerText()).includes(saveLine), false, 'a setup server notice leaves the save line pending');
  await server.refresh(); assert.equal((await setup.innerText()).includes(saveLine), false);
  server.chooseFault(false); await page.evaluate(() => window.r6Controller.ready()); await ready(page);
  const line = page.locator('.play-detail').getByText(saveLine, { exact: true }); await line.waitFor();
  server.fail('refused');
  await page.getByRole('button', { name: 'Menu', exact: true }).tap(); await page.getByRole('button', { name: 'Offer draw', exact: true }).tap();
  await page.getByRole('button', { name: 'Close menu', exact: true }).tap();
  await page.locator('.play-detail').getByText('Please try again later.', { exact: true }).waitFor();
  assert.equal(await line.count(), 0, 'a same-revision server notice wins in play');
  await server.refresh(); assert.equal(await line.count(), 0, 'the server notice keeps priority on a poll');
  await page.evaluate(() => { const c = window.r6Controller; c.stage(c.state().draft.legal.find(m => !m.power)); c.undo(); });
  await line.waitFor(); await server.refresh(); assert.equal(await line.isVisible(), true, 'the line returns after the server notice at the same revision');
  await shot(page, size, 'king-save-after-server-notice');
  const another = '66666666-6666-4666-8666-666666666666'; server.set({ game_id: another });
  const opening = page.waitForResponse(r => r.request().method() === 'GET' && new URL(r.url()).pathname === '/api/games/' + another);
  await page.evaluate(id => { location.hash = '#online=' + id; }, another); await opening; await ready(page);
  assert.equal(await page.locator('.play-detail').getByText(saveLine, { exact: true }).count(), 0, 'another game drops the local line');
}
async function readyRetry(page, context, size, fault) {
  const server = await online(page, context, { setup: true, refuseAll: fault === 'storage', setupNotice: fault === 'rate', readyFault: fault });
  const waiting = page.locator('.online-waiting, .play-detail'); await waiting.waitFor();
  if (fault === 'storage' || fault === 'rate') {
    await waiting.getByText(fault === 'storage' ? 'This device cannot save the send. Free some space, then try again.' : 'Please try again later.', { exact: true }).waitFor();
  } else await page.waitForFunction(() => window.r6ReadyCalls > 0);
  await page.waitForTimeout(750);
  assert.equal(await page.evaluate(() => window.r6ReadyCalls), 1, `${fault}: no repeated or recursive automatic Ready inside the interval`);
  await server.refresh();
  assert.equal(await page.evaluate(() => window.r6ReadyCalls), 1, `${fault}: an early poll does not repeat Ready`);
  if (fault === 'storage' || fault === 'rate') {
    await shot(page, size, `retry-${fault}-before-poll`);
    await page.evaluate(() => { window.r6RefuseAll = false; window.r7RefuseKing = false; }); server.chooseFault(false);
    // No wake event or reload: the controller's scheduled setup poll must do the work.
    await playing(page);
    assert.equal(server.commands(), fault === 'storage' ? 1 : 2, 'one working choose ends setup at the next scheduled poll');
    await shot(page, size, `retry-${fault}-after-poll`);
  } else {
    assert.equal(server.commands(), 0, 'blocked Ready sends no choose');
    const home = page.getByRole('button', { name: 'Back to home', exact: true }); await home.tap(); await page.locator('.play-home').waitFor();
  }
}
async function cancelReady(page, context) {
  const server = await online(page, context, { setup: true, waiting: true });
  const refusal = page.waitForResponse(r => r.url().endsWith('/commands') && r.status() === 403);
  await page.getByRole('button', { name: 'Cancel game', exact: true }).tap(); await refusal;
  await playing(page);
  assert.equal(server.commands(), 2, 'a refused Cancel does not block the first Ready');
}
async function noticeAction(page, context, size) {
  const server = await online(page, context, { setup: true, withCards: true }); await ready(page);
  const line = page.locator('.play-detail').getByText(saveLine, { exact: true }); await line.waitFor();
  await cell(page, 1).tap(); await server.refresh();
  assert.equal(await line.count(), 0, 'a board tap drops the king-save line through a same-revision poll');
  await page.locator('.play-own .play-card').filter({ hasText: 'Haste' }).tap();
  await cell(page, 1).tap(); await cell(page, 18).tap();
  for (let i = 0; i < 2; i++) {
    await server.refresh();
    assert.equal(await line.count(), 0, 'a staged move keeps the local save line cleared');
    assert.match(await page.locator('.play-detail .play-headline').innerText(), /Move it again, or select Send\./, 'the staged Haste hint stays after an unchanged poll');
  }
  await shot(page, size, 'staged-haste-hint-after-polls');
}
async function noticeSaved(page, context) {
  const server = await online(page, context, { setup: true, seat: 1 });
  await page.locator('.online-waiting').waitFor();
  assert.equal(await page.evaluate(() => localStorage.getItem('kingdown.people-king.tester.r5-online.1')), null, 'the first king write refuses');
  await page.evaluate(() => { window.r7RefuseKing = false; });
  server.set({ ready: [true, false] }); await server.refresh(); await ready(page);
  assert.notEqual(await page.evaluate(() => localStorage.getItem('kingdown.people-king.tester.r5-online.1')), null, 'Ready saves the king');
  for (let i = 0; i < 2; i++) {
    await server.refresh();
    assert.equal(await page.locator('.play-detail').getByText(saveLine, { exact: true }).count(), 0, 'a later successful king write ends the save line');
  }
}
async function menuArmed(page, context, size, kind) {
  const server = await online(page, context, { power: kind === 'power', fen: kind === 'choice' ? '7k/8/8/2r5/2O5/8/8/K7 w - - 0 1' : undefined }); await ready(page);
  if (kind === 'choice') { await cell(page, 26).tap(); await cell(page, 34).tap(); }
  else await page.locator(kind === 'power' ? '.play-own .play-power' : '.play-own .play-card').filter({ hasText: 'Freeze' }).tap();
  const cancel = kind === 'choice' ? 'Cancel action choice' : 'Cancel Freeze';
  await page.getByRole('button', { name: cancel, exact: true }).waitFor();
  const before = await page.locator('.play-detail .play-headline').innerText();
  await page.getByRole('button', { name: 'Menu', exact: true }).tap();
  await page.locator('.game-menu').getByRole('button', { name: 'Offer draw', exact: true }).tap();
  await page.getByRole('button', { name: 'Close menu', exact: true }).tap();
  const check = page.getByRole('button', { name: 'Check again', exact: true }); await check.waitFor();
  for (let i = 0; i < 2; i++) {
    const expected = server.commands() + 4;
    const failed = page.waitForEvent('requestfailed', request => request.url().endsWith('/commands') && server.commands() === expected);
    await check.tap(); await failed; await page.evaluate(() => new Promise(requestAnimationFrame));
  }
  await page.getByRole('button', { name: 'Discard send', exact: true }).waitFor();
  await bounds(page); await shot(page, size, `menu-${kind}-recovery`);
  if (kind !== 'choice') {
    // A subject the player opens still takes the reader during recovery.
    await page.locator(kind === 'power' ? '.play-opp .play-power' : '.play-rival-cards').tap();
    await page.locator(kind === 'power' ? '.play-reader .learn-short' : '.play-rival-rows').waitFor();
    assert.equal(await page.locator('.online-actions').count(), 0, 'the open subject panel keeps its content');
    await page.keyboard.press('Escape'); await check.waitFor();
  }
  await page.getByRole('button', { name: 'Discard send', exact: true }).tap();
  await page.getByRole('button', { name: cancel, exact: true }).waitFor();
  assert.equal(await page.locator('.play-detail .play-headline').innerText(), before, 'Discard restores the armed step or choice');
  await visibleBounds(page, '.play-detail button', true);
  if (kind === 'choice') assert.equal(await page.locator('.play-choices button').count(), 2, 'Capture and Push both return');
  await shot(page, size, `menu-${kind}-restored`);
}
const cases = { noticeAction, noticeSaved, cancelReady, hasteSend: send, hasteAuth: (page, context, size) => send(page, context, size, true), noticePriority };
for (const fault of ['storage', 'offline', 'rate']) cases[`manual-${fault}`] = (page, context, size) => manualRefusal(page, context, size, fault);
for (const action of ['link', 'name']) {
  for (const game of ['computer', 'online']) cases[`late-${action}-${game}`] = (page, context, size) => lateInvite(page, context, size, action, 'close', game);
  for (const exit of ['back', 'normal']) cases[`invite-${action}-${exit}`] = (page, context, size) => lateInvite(page, context, size, action, exit);
}
for (const fault of ['storage', 'rate', 'busy', 'offline']) cases[`retry-${fault}`] = (page, context, size) => readyRetry(page, context, size, fault);
for (const kind of ['power', 'card', 'choice']) cases[`armed-${kind}`] = (page, context, size) => menuArmed(page, context, size, kind);
for (const action of ['Offer draw', 'Resign', 'End with no result']) cases[`menu-${action}`] = (page, context, size) => menuSend(page, context, size, action);
for (const seat of [0, 1]) for (const accept of [false, true]) cases[`refused-${seat}-${accept ? 'accept' : 'join'}`] = (page, context, size) => refusedReady(page, context, size, seat, accept);
for (const manual of [false, true]) for (const seat of [0, 1]) for (const accept of [false, true]) cases[`notice-${manual ? 'manual' : 'automatic'}-${seat}-${accept ? 'accept' : 'join'}`] = (page, context, size) => notice(page, context, size, manual, seat, accept);
try {
  for (const size of sizes) for (const [name, run] of Object.entries(cases)) {
    if (process.env.R5_CASES && !process.env.R5_CASES.split(',').includes(name)) continue;
    const context = await browser.newContext({ viewport: { width: size[0], height: size[1] }, hasTouch: true, serviceWorkers: 'block', reducedMotion: 'reduce' });
    const page = await context.newPage(); page.setDefaultTimeout(5000);
    const errors = trapErrors(page, name === 'hasteAuth' ? [{ pattern: /Failed to load resource: the server responded with a status of 401/, reason: 'This case refuses the send with a 401 to test sign-in recovery.' }] : name === 'hasteSend' || name.startsWith('menu-') || name.startsWith('armed-') ? [{ pattern: /Failed to load resource: net::ERR_FAILED/, reason: 'This case drops the send and both checks to test unknown-answer recovery.' }] : name === 'cancelReady' ? [{ pattern: /Failed to load resource: the server responded with a status of 403/, reason: 'Cancel races the other player joining.' }] : name === 'noticePriority' || name === 'retry-rate' || name === 'manual-rate' ? [{ pattern: /Failed to load resource: the server responded with a status of 429/, reason: 'This case gives a server notice during setup and play.' }] : []);
    try { await run(page, context, size); assertNoErrors(errors); results.push({ name, size, ok: true }); console.log('ok', name, size.join('x')); }
    catch (error) { await shot(page, size, `failure-${name}`); failures.push(`${name} ${size.join('x')}: ${error.message}`); console.error(failures.at(-1)); }
    finally { await context.close(); }
  }
  writeFileSync(join(out, 'r5-results.json'), JSON.stringify({ results, failures }, null, 2));
  assert.equal(failures.length, 0, failures.join('\n'));
} finally { await browser.close(); }
