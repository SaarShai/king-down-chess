/** Send recovery after Haste and a king-save line that survives setup. */
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
const shot = (page, size, name) => page.screenshot({ path: join(out, `${size.join('x')}-${name}.png`), animations: 'disabled' });

async function online(page, context, { setup = false, manual = false, seat = 0, accept = false } = {}) {
  let view, redeemed = false, commands = 0, fail = 'network';
  await context.route('**/src/account/client.ts*', route => route.fulfill({ contentType: 'text/javascript', body: 'export function connect() { return { onSession() {}, readSession: async () => ({ userId: "tester", accessToken: "fixture" }) }; }' }));
  await context.addInitScript(refuse => {
    localStorage.setItem('kingdown.auth', 'fixture');
    if (refuse) { const write = Storage.prototype.setItem; Storage.prototype.setItem = function(key, value) { if (key.startsWith('kingdown.people-king.')) throw new DOMException('full', 'QuotaExceededError'); return write.call(this, key, value); }; }
  }, setup);
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
  const template = await page.evaluate(async setup => {
    const { Game } = await import('/src/game.ts'), { toFen } = await import('/src/rules/setup.ts'), { rulesOf } = await import('/src/interface/play/saved.ts'), { DEFAULT_OPTIONS } = await import('/src/match/setup.ts'), { PAGE_ENGINE } = await import('/src/account-game/engine-identity.ts');
    const hand = ['Freeze', 'IceWall', 'Haste', 'Flight'];
    const game = new Game('RNBQKBNR', rulesOf(setup ? 'powers' : 'cards', [{ king: 'Spirit', power: 'Mercy' }, { king: 'Shadow', power: 'Darkness' }], [hand, hand]));
    return { engine_fingerprint: PAGE_ENGINE ?? 'r5-fixture', fen: toFen(game.pos), rules: game.rules, history: { initial_fen: toFen(game.pos), actions: [] }, legal: game.legal.map(m => game.context.toLan(game.pos, m)), options: { ...DEFAULT_OPTIONS, kingPowers: setup, cards: !setup, arrangement: false } };
  }, setup);
  view = { ...template, options: { ...template.options, arrangement: manual }, game_id: 'r5-online', revision: 1, server_now: new Date().toISOString(), status: setup ? 'setup' : 'playing', seat, turn: seat, action: 'ready', kind: 'friend', speed: 'daily', days_per_move: 3, deadline_at: new Date(Date.now() + 864e5).toISOString(), abort_open: false, last_commands: [], opponent: { handle: 'opponent', user_id: 'other', computer: false, deleted: false, icon: null }, draw_offer: null,
    ...(setup ? { draw: 'RNBQKBNR', deal: [], ready: seat ? [manual, false] : [false, true] } : {}) };
  await page.goto(new URL(`next.html${setup && !accept ? '#join=' + 'a'.repeat(43) : ''}`, origin).href);
  if (setup) await page.getByRole('button', { name: accept ? 'Accept' : 'Join the game', exact: true }).click();
  else await page.locator('.home-game-row[data-game]').first().click();
  return { commands: () => commands, fail: value => { fail = value; }, set: value => { view = { ...view, ...value }; }, refresh: async () => {
    const response = page.waitForResponse(r => r.request().method() === 'GET' && new URL(r.url()).pathname === '/api/games/r5-online');
    await page.evaluate(() => window.dispatchEvent(new Event('online'))); await response;
    await page.evaluate(() => new Promise(requestAnimationFrame));
  } };
}
async function bounds(page) {
  await visibleBounds(page, '.online-status p'); await visibleBounds(page, '.online-actions button', true);
  assert.equal(await page.evaluate(() => document.documentElement.scrollHeight > innerHeight), false, 'no page scroll');
  if (await page.locator('.play-game').getAttribute('data-layout') === 'portrait') {
    const reader = await page.locator('.play-detail').boundingBox(), board = await page.locator('.play-board').boundingBox();
    assert(reader.y + reader.height <= board.y + 1, 'recovery stays above the board');
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
  assert.equal(await page.locator('.play-history-strip').isVisible(), true, 'the normal reader returns');
  assert.equal(server.commands(), 12, 'Send and two failed checks each make four transport attempts');
}
async function notice(page, context, size, manual, seat, accept) {
  const server = await online(page, context, { setup: true, manual, seat, accept });
  if (!manual && seat) {
    await page.locator('.online-waiting').waitFor(); await server.refresh();
    assert.equal(server.commands(), 0, 'the second seat waits through a setup poll');
    server.set({ ready: [true, false] }); await server.refresh();
  }
  if (manual) {
    await ready(page); await page.locator('.play-game[data-state="arrange"]').waitFor();
    await server.refresh(); await page.getByRole('button', { name: 'Ready', exact: true }).tap();
  }
  await ready(page); await page.locator('.play-game[data-state="arrange"]').waitFor({ state: 'detached' });
  const line = page.locator('.play-detail').getByText(saveLine, { exact: true }); await line.waitFor();
  await page.waitForTimeout(350); assert.equal(await line.isVisible(), true, 'the save line stays after setup ends');
  await visibleBounds(page, `.play-detail :text-is("${saveLine}")`); await shot(page, size, `king-save-${manual ? 'manual' : 'automatic'}-${seat}-${accept ? 'accept' : 'join'}`);
  await server.refresh(); await line.waitFor({ state: 'detached' });
  await server.refresh(); assert.equal(await line.count(), 0, 'the play frame takes the line once');
}
const cases = { hasteSend: send, hasteAuth: (page, context, size) => send(page, context, size, true) };
for (const manual of [false, true]) for (const seat of [0, 1]) for (const accept of [false, true]) cases[`notice-${manual ? 'manual' : 'automatic'}-${seat}-${accept ? 'accept' : 'join'}`] = (page, context, size) => notice(page, context, size, manual, seat, accept);
try {
  for (const size of sizes) for (const [name, run] of Object.entries(cases)) {
    if (process.env.R5_CASES && !process.env.R5_CASES.split(',').includes(name)) continue;
    const context = await browser.newContext({ viewport: { width: size[0], height: size[1] }, hasTouch: true, serviceWorkers: 'block', reducedMotion: 'reduce' });
    const page = await context.newPage(); page.setDefaultTimeout(5000);
    const errors = trapErrors(page, name === 'hasteAuth' ? [{ pattern: /Failed to load resource: the server responded with a status of 401/, reason: 'This case refuses the send with a 401 to test sign-in recovery.' }] : name === 'hasteSend' ? [{ pattern: /Failed to load resource: net::ERR_FAILED/, reason: 'This case drops the send and both checks to test unknown-answer recovery.' }] : []);
    try { await run(page, context, size); assertNoErrors(errors); results.push({ name, size, ok: true }); console.log('ok', name, size.join('x')); }
    catch (error) { await shot(page, size, `failure-${name}`); failures.push(`${name} ${size.join('x')}: ${error.message}`); console.error(failures.at(-1)); }
    finally { await context.close(); }
  }
  writeFileSync(join(out, 'r5-results.json'), JSON.stringify({ results, failures }, null, 2));
  assert.equal(failures.length, 0, failures.join('\n'));
} finally { await browser.close(); }
