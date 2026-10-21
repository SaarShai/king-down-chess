/** Real emitted website + HTTP + MCP on one disposable local database. No provider or production calls. */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'vite';
import pg from 'pg';
import { register } from 'tsx/esm/api';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import { testDatabase } from './plugin-db-config.mjs';
import { buildPluginServer } from './plugin-server-build.mjs';
import { recoveryOutput, serveSite } from './web-online-check.mjs';
import { launch, shot, trapErrors, assertNoErrors, env } from './lib/checks.mjs';
import { checkRecoveryConsumers, checkSharedMechanics } from './lib/shared-mechanics-check.mjs';

const unregister = register();
const mechanics = process.argv[2] === 'mechanics';
const recovery = process.argv[2] === 'recovery';
const desktop = process.argv[2] === 'desktop';
assert(process.argv.length === (mechanics || recovery || desktop ? 3 : 2), 'Use web-game-check.mjs [mechanics|recovery|desktop]');
if (recovery) assert(process.env.KINGDOWN_WEB_RECOVERY_OUTPUT, 'Recovery consumers require an exact external KINGDOWN_WEB_RECOVERY_OUTPUT');
const { fromFen } = await import('../src/rules/setup.ts');
const { M, N, P, parseSq, typeOf } = await import('../src/rules/engine.ts');
const connectionString = process.env.PLUGIN_TEST_DATABASE_URL;
testDatabase(connectionString);
const work = await mkdtemp(join(tmpdir(), 'kingdown-web-game-'));
const actors = Array.from({ length: recovery ? 4 : 2 }, () => randomUUID());
const pool = new pg.Pool({ connectionString, max: 1 });
let app, server, browser, savedAccess;
const failures = [], commands = [];
let lostReplies = 0;
try {
  // Use public fake settings only. The browser gets a real signed local session; no OAuth provider is contacted.
  await build({ logLevel: 'warn', define: {
    'import.meta.env.VITE_KINGDOWN_STAGE': JSON.stringify(''),
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://web-proof.supabase.co'),
    'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify('sb_publishable_local_test'),
  }, build: { outDir: join(work, 'site'), emptyOutDir: true } });
  const root = await buildPluginServer(join(work, 'combined'), { site: join(work, 'site') });
  process.env.NODE_ENV = 'test';
  const config = JSON.parse(await readFile(join(root, 'config.json'), 'utf8'));
  let siteRoot = root, siteConfig = config;
  const { configurePlugin } = await import(pathToFileURL(join(root, 'functions/mcp.func/server.mjs')).href);
  await pool.query('insert into auth.users(id) select unnest($1::uuid[])', [actors]);
  savedAccess = (await pool.query('select enabled from public.web_account_access where singleton=true')).rows[0].enabled;
  await pool.query('update public.web_account_access set enabled=true where singleton=true');
  server = createServer((req, res) => { void serveSite({ root: siteRoot, config: siteConfig, handler: app.handler }, req, res).catch(() => res.destroy()); });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  const pair = await generateKeyPair('ES256');
  const websiteKeys = createLocalJWKSet({ keys: [{ ...await exportJWK(pair.publicKey), kid: 'local-web', alg: 'ES256' }] });
  const tokens = await Promise.all(actors.map(sub => new SignJWT({ sub, iss: 'https://web-proof.supabase.co/auth/v1', aud: 'authenticated', role: 'authenticated', is_anonymous: false })
    .setProtectedHeader({ alg: 'ES256', kid: 'local-web' }).setExpirationTime('10m').sign(pair.privateKey)));
  const runtimeSettings = { NODE_ENV: 'test', KINGDOWN_PLUGIN_ORIGIN: origin, KINGDOWN_PLUGIN_DATABASE_URL: connectionString,
    KINGDOWN_INTERNAL_SECRET: randomUUID(), SUPABASE_URL: 'https://web-proof.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_local_test', KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS: randomUUID() };
  const runtimeOptions = { localDev: true, websiteKeys, websiteCurrentUser: async (token, actor) => { assert.equal(tokens[actors.indexOf(actor)], token); } };
  app = await configurePlugin(runtimeSettings, runtimeOptions);
  let rpcId = 0;
  async function tool(seat, name, args = {}) {
    const response = await fetch(origin + '/mcp', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json,text/event-stream', 'X-Kingdown-Dev-Actor': actors[seat], 'MCP-Protocol-Version': '2025-11-25' },
      body: JSON.stringify({ jsonrpc: '2.0', id: ++rpcId, method: 'tools/call', params: { name, arguments: args } }) });
    assert.equal(response.status, 200);
    const { result, error } = await response.json(); assert(!error, `${name}: RPC error`); assert(!result.isError, `${name}: ${JSON.stringify(result)}`); return result;
  }
  if (!mechanics && !recovery) for (const seat of [0, 1]) await tool(seat, 'kingdown_handle', { handle: `web${seat}-${actors[seat].slice(0, 8)}` });
  const view = async seat => (await tool(seat, 'kingdown_get', { game_id: gameId }))._meta.view;
  browser = await launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1100, height: 1000 } });
  await context.addInitScript(({ origin, actor, token }) => { if (location.origin === origin && !localStorage.getItem('kingdown.auth')) localStorage.setItem('kingdown.auth', JSON.stringify({
    access_token: token, refresh_token: 'local-test-refresh', token_type: 'bearer', expires_in: 600, expires_at: Math.floor(Date.now() / 1000) + 600, user: { id: actor, aud: 'authenticated', role: 'authenticated', email: 'browser@example.invalid', app_metadata: { provider: 'google' }, user_metadata: {}, created_at: new Date().toISOString() },
  })); }, { origin, actor: actors[0], token: tokens[0] });
  // Reject any accidental external request, including refresh and provider user lookups.
  if (!desktop) await context.route('**/*', async route => {
    if (new URL(route.request().url()).origin !== origin) { failures.push('External request blocked'); return route.abort(); }
    return route.continue();
  });
  if (desktop) {
    const { measureDesktop } = await import('./lib/desktop-performance.mjs');
    await measureDesktop({ browser, root, origin, actors, pool, tool, tokens });
  } else if (recovery) {
    const release = await recoveryOutput(root), prior = await recoveryOutput(process.env.KINGDOWN_WEB_RECOVERY_OUTPUT);
    assert.notEqual(prior.root, release.root, 'Recovery is an external output');
    await checkRecoveryConsumers({ browser, root, origin, actors, pool, tool, tokens, release, recovery: prior,
      switchOutput: async (backend, site) => {
        const { configurePlugin } = await import(pathToFileURL(join(backend.root, 'functions/mcp.func/server.mjs')).href);
        const config = JSON.parse(await readFile(join(site.root, 'config.json'), 'utf8'));
        const next = await configurePlugin(runtimeSettings, runtimeOptions), old = app;
        app = next; siteRoot = site.root; siteConfig = config;
        await old.pool.end();
      } });
    assert.deepEqual(failures, [], 'No external request');
  } else if (mechanics) {
    await checkSharedMechanics({ browser, context, root, origin, actors, pool, tool, tokens });
    assert.deepEqual(failures, [], 'No external request');
  } else {
  const page = await context.newPage(); page.setDefaultTimeout(15_000);
  const errors = trapErrors(page);
  page.on('requestfailed', request => {
    const fault = request.failure()?.errorText, path = new URL(request.url()).pathname;
    if (fault === 'net::ERR_ABORTED') return;
    if (fault === 'net::ERR_FAILED' && request.method() === 'POST' && path.endsWith('/commands')) lostReplies++;
    else failures.push(`${fault} ${path}`);
  });
  page.on('response', response => {
    const path = new URL(response.url()).pathname;
    if (response.status() >= 400 || response.request().resourceType() === 'script' && !/javascript/.test(response.headers()['content-type'] ?? '')) failures.push(`${response.status()} ${path} ${response.headers()['content-type'] ?? ''}`);
  });
  await page.goto(origin + '/play/');
  try { await page.locator('[data-screen="play"]:not([hidden]) #setup-start:not(:disabled)').waitFor(); }
  catch (error) { await shot(page, 'web-bootstrap-failure'); console.error({ resources: failures, errors, page: await page.locator('body').innerText() }); throw error; }
  await page.locator('label.mode').filter({ has: page.getByRole('radio', { name: 'A friend', exact: true }) }).click();
  await page.locator('#setup-colour label').filter({ has: page.getByRole('radio', { name: 'White', exact: true }) }).click();
  for (const [key, on] of [['arrangement', false], ['cards', false], ['kingPowers', true]]) {
    const input = page.locator(`#setup-toggle-${key}`);
    if (await input.isChecked() !== on) await page.locator(`#${key}-row`).click();
    assert.equal(await input.isChecked(), on);
  }
  await page.locator('#setup-king').click();
  await page.locator('#menu-sheet [data-king="Flame"]').click();
  await page.locator('#menu-sheet [data-power="Haste"]').click();
  await page.locator('#setup-done').click();
  const created = page.waitForResponse(response => response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/games');
  await page.locator('#setup-start').click();
  const startResponse = await created; assert.equal(startResponse.status(), 201);
  const start = await startResponse.json(), gameId = start.view.game_id;
  assert.equal(start.view.options.arrangement, false); assert.equal(start.view.options.kingPowers, true);
  await page.locator('#friend-code').filter({ hasText: /[A-Z0-9]{6}/ }).waitFor();
  const code = (await page.locator('#friend-code').innerText()).trim();
  await tool(1, 'kingdown_join', { code });
  await page.locator('[data-screen="seat"]:not([hidden])').waitFor();
  await page.locator('#seat-screen #board[aria-busy="false"] canvas').waitFor({ state: 'visible' });
  await page.locator('.veil').waitFor({ state: 'visible' });
  assert.equal(await page.locator('[data-seat-id="game-table"]').evaluate(node => getComputedStyle(node).display), 'grid');
  for (const [strip, area] of [['strip-me', 'me'], ['strip-them', 'them']]) {
    assert.deepEqual(await page.locator(`[data-seat-id="${strip}"]`).evaluate(node => { const style = getComputedStyle(node); return [style.display, style.gridArea]; }), ['flex', area]);
  }
  const setupCanvas = await page.locator('#seat-screen #board canvas').boundingBox(), veil = await page.locator('.veil').boundingBox();
  assert(setupCanvas && setupCanvas.width >= 200 && setupCanvas.height >= 200);
  assert(veil && veil.width >= setupCanvas.width * .8 && veil.height >= setupCanvas.height * .35);
  assert.match(await page.locator('.veil').innerText(), /hidden/);
  let a = await view(0), b = await view(1);
  assert.equal(a.game_id, b.game_id); assert.equal(a.choices[1], null); assert.equal(b.choices[0], null); assert.equal(a.fen, ''); assert.equal(b.fen, '');
  await shot(page, 'web-hidden-setup');
  await page.locator('#seat-ready').click();
  await page.waitForFunction(() => document.querySelector('#seat-context')?.textContent?.includes('Waiting'));
  b = await view(1); assert.equal(b.choices[0], null, 'MCP cannot read the ready opponent choice');
  await tool(1, 'kingdown_choose', { game_id: gameId, command_id: randomUUID(), expected_revision: b.revision, order: b.draw, king: { king: 'Frost', power: 'Freeze' }, ready: true });
  await page.locator('[data-screen="board"]:not([hidden])').waitFor();
  await page.locator('#board[aria-busy="false"]:not([data-animating="true"])').waitFor();
  a = await view(0); assert.equal(a.status, 'playing'); assert.deepEqual(a.rules.kings[0], { king: 'Flame', power: 'Haste' });
  // The canvas and End turn control send the first move. The server applies it, then the reply is lost.
  const box = await page.locator('#board canvas').boundingBox(); assert(box);
  const tap = (file, rank) => page.mouse.click(box.x + (32 + (file + .5) * 112) * box.width / 960, box.y + (96 + (7 - rank + .5) * 112) * box.width / 960);
  await page.locator('#power-w').click();
  await page.locator('#board-sheet').getByRole('button', { name: 'Use', exact: true }).click();
  await tap(4, 1); await tap(4, 2);
  await page.locator('#board[data-animating="false"]').waitFor();
  await tap(4, 2); await tap(4, 3);
  await page.locator('#board[data-animating="false"]').waitFor();
  let applied;
  const lost = new Promise(resolve => { applied = resolve; });
  await page.route('**/api/games/*/commands', async route => {
    const body = route.request().postDataJSON(); commands.push(body);
    const response = await route.fetch(); assert.equal(response.status(), 200);
    if (commands.length === 1) { await route.abort('failed'); applied(); }
    else await route.fulfill({ response });
  });
  await page.locator('#end-turn[aria-disabled="false"]').click(); await lost;
  const replay = page.waitForResponse(response => response.request().method() === 'POST' && new URL(response.url()).pathname === `/api/games/${gameId}/commands`);
  await page.reload();
  await page.locator('[data-screen="board"]:not([hidden])').waitFor();
  // Replay is explicit on reload, preserving the saved command and its exact input.
  if (await page.locator('#retry').isVisible()) await page.locator('#retry').click();
  assert.equal((await replay).status(), 200);
  b = await view(1); assert.equal(b.revision, a.revision + 1); assert.equal(b.last_commands.at(-1).action.type, 'turn');
  assert.deepEqual(commands[0].action, { type: 'turn', actions: ['e2-e3!H', 'e3-e4'] });
  assert(commands.length >= 2); for (const command of commands) assert.deepEqual(command, commands[0]);
  const moved = b.fen;
  assert.notEqual(moved, a.fen);
  // Same account and full game URL resume through the actual emitted index and the same service.
  const resumed = page.waitForResponse(response => response.request().method() === 'GET' && new URL(response.url()).pathname === `/api/games/${gameId}`);
  await page.goto(origin + '/g/' + gameId);
  const resumedView = await (await resumed).json(); assert.equal(resumedView.fen, moved); assert.equal(resumedView.revision, b.revision);
  await page.locator('[data-screen="board"]:not([hidden])').waitFor();
  assert.equal((await view(0)).fen, moved);
  await shot(page, 'web-shared-board');
  await tool(1, 'kingdown_resign', { game_id: gameId, command_id: randomUUID(), expected_revision: b.revision });
  await page.locator('[data-screen="end"]:not([hidden])').waitFor();
  a = await view(0); b = await view(1); assert.deepEqual(a.result, b.result); assert.equal(a.result.winner, 0); assert.equal(a.result.reason, 'resignation');
  assert.equal(await page.locator('#over-title').innerText(), 'You win');
  await shot(page, 'web-shared-result');
  await page.unroute('**/api/games/*/commands');
  // Seven weighted pool pieces force the army's contents; each seat still submits a real setup choice.
  const options = { fairy: true, pool: ['O', 'A', 'G', 'M', 'S'], arrangement: true, classic: false,
    cards: true, cardPool: ['Freeze', 'IceWall', 'MorphP', 'Vault'], kingPowers: true };
  async function http(seat, path, body, status = 200) {
    const response = await fetch(origin + path, { method: body === undefined ? 'GET' : 'POST',
      headers: { Authorization: `Bearer ${tokens[seat]}`, 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const value = await response.json(); assert.equal(response.status, status, `${path}: ${JSON.stringify(value)}`); return value;
  }
  const combined = await http(0, '/api/games', { kind: 'friend', colour: 'white', options, command_id: randomUUID() }, 201);
  const combinedId = combined.view.game_id;
  const readCombined = async seat => (await tool(seat, 'kingdown_get', { game_id: combinedId }))._meta.view;
  assert.deepEqual([...combined.view.draw].sort(), [...'OAAGMMSK'].sort());
  assert.deepEqual([...combined.view.deal].sort(), [...options.cardPool].sort());
  await tool(1, 'kingdown_join', { code: combined.invite.code });
  let combinedView = await readCombined(0);
  await http(0, `/api/games/${combinedId}/commands`, { command_id: randomUUID(), expected_revision: combinedView.revision,
    action: { type: 'choose', choice: { order: 'MAOGKAMS', king: { king: 'Mud', power: 'March' } }, ready: true } });
  combinedView = await readCombined(1);
  await tool(1, 'kingdown_choose', { game_id: combinedId, command_id: randomUUID(), expected_revision: combinedView.revision,
    order: 'MAOGKAMS', king: { king: 'Shadow', power: 'Darkness' }, ready: true });
  combinedView = await readCombined(0);
  assert.equal(combinedView.status, 'playing'); assert.deepEqual(combinedView.options, options);
  assert.deepEqual(combinedView.kings, [{ king: 'Mud', power: 'March' }, { king: 'Shadow', power: 'Darkness' }]);
  assert.equal(combinedView.rules.marchUses, 0, 'March is always on with Cards');
  assert.deepEqual(combinedView.hands.map(hand => [...hand].sort()), [options.cardPool, options.cardPool].map(hand => [...hand].sort()));
  const initialCombined = combinedView;
  const combinedTurns = [];
  async function combinedMove(seat, lan, surface) {
    const before = await readCombined(seat);
    assert(before.legal.includes(lan), `${lan} must be legal in the authoritative engine`);
    const input = { command_id: randomUUID(), expected_revision: before.revision };
    if (surface === 'web') await http(seat, `/api/games/${combinedId}/commands`, { ...input, action: { type: 'turn', actions: [lan] } });
    else await tool(seat, 'kingdown_move', { game_id: combinedId, ...input, actions: [lan] });
    const after = await readCombined(seat);
    assert.equal(after.revision, before.revision + 1);
    assert.deepEqual(after.last_commands.at(-1).action, { type: 'turn', actions: [lan] });
    combinedTurns.push({ seat, lan, surface, revision: after.revision }); return after;
  }
  await combinedMove(0, 'e2-e3', 'web');
  await combinedMove(1, 'h7-h6', 'chatgpt');
  combinedView = await combinedMove(0, 'e3-e5', 'chatgpt');
  assert.equal(typeOf(fromFen(combinedView.fen).board[parseSq('e5')]), P);
  assert.equal(fromFen(combinedView.fen).used?.[0] ?? 0, 0, 'Always-on March spends no card');
  await combinedMove(1, 'h6-h5', 'web');
  combinedView = await combinedMove(0, 'Ma1<>a2', 'web');
  assert.equal(typeOf(fromFen(combinedView.fen).board[parseSq('a2')]), M);
  assert.equal(typeOf(fromFen(combinedView.fen).board[parseSq('a1')]), P);
  await combinedMove(1, 'g7-g6', 'chatgpt');
  // The emitted website opens the same full URL, then its card sheet and End turn send MorphP.
  await page.goto(origin + '/g/' + combinedId);
  await page.locator('[data-screen="board"]:not([hidden])').waitFor();
  await page.locator('#board[aria-busy="false"]:not([data-animating="true"])').waitFor();
  combinedView = await readCombined(0);
  const morph = '!IP:b2=N', morphIndex = combinedView.hands[0].indexOf('MorphP');
  assert(combinedView.legal.includes(morph), 'The authoritative engine permits MorphP on b2');
  assert(morphIndex >= 0);
  await page.locator(`#card-w-${morphIndex}`).click();
  await page.locator('#board-sheet').getByRole('button', { name: 'Use', exact: true }).click();
  await page.locator('#board-menu').click();
  await page.locator('#board-sheet').getByRole('button', { name: 'Choose a move', exact: true }).click();
  await page.locator(`#choices button[title="${morph}"]`).click();
  const morphed = page.waitForResponse(response => response.request().method() === 'POST' && new URL(response.url()).pathname === `/api/games/${combinedId}/commands`);
  await page.locator('#end-turn[aria-disabled="false"]').click();
  assert.equal((await morphed).status(), 200);
  const finalCombined = await readCombined(0), finalPosition = fromFen(finalCombined.fen);
  assert.equal(finalCombined.revision, combinedView.revision + 1);
  assert.equal(typeOf(finalPosition.board[parseSq('b2')]), N);
  assert.equal(finalPosition.used[0], 1 << morphIndex, 'Only the played MorphP card is spent');
  const actions = ['e2-e3', 'h7-h6', 'e3-e5', 'h6-h5', 'Ma1<>a2', 'g7-g6', morph];
  assert.deepEqual(finalCombined.history.actions, actions);
  assert.deepEqual(finalCombined.last_commands.filter(command => command.action.type === 'turn').map(command => command.action.actions), actions.map(lan => [lan]));
  combinedTurns.push({ seat: 0, lan: morph, surface: 'web', revision: finalCombined.revision });
  await page.locator(`#card-w-${morphIndex}[data-state="used"]`).waitFor();
  await shot(page, 'web-combined-features');
  const combinedReload = page.waitForResponse(response => response.request().method() === 'GET' && new URL(response.url()).pathname === `/api/games/${combinedId}`);
  await page.reload();
  const reloaded = await (await combinedReload).json();
  for (const field of ['game_id', 'revision', 'fen', 'history', 'kings', 'hands']) assert.deepEqual(reloaded[field], finalCombined[field], `Reload preserves ${field}`);
  await page.locator(`#card-w-${morphIndex}[data-state="used"]`).waitFor();
  const otherSeat = await readCombined(1); assert.equal(otherSeat.fen, finalCombined.fen); assert.deepEqual(otherSeat.history, finalCombined.history);
  const surfaces = (await pool.query("select seat, surface, actions from public.game_commands where game_id=$1 and kind='turn' order by seq", [combinedId])).rows;
  assert.deepEqual(surfaces.map(row => row.surface), combinedTurns.map(turn => turn.surface));
  assert.deepEqual(surfaces.map(row => row.actions), actions.map(lan => [lan]));
  await tool(1, 'kingdown_resign', { game_id: combinedId, command_id: randomUUID(), expected_revision: finalCombined.revision });
  await page.locator('[data-screen="end"]:not([hidden])').waitFor();
  const finishedCombined = await readCombined(0);
  assert.equal(finishedCombined.status, 'finished');
  assert.deepEqual(finishedCombined.result, { winner: 0, reason: 'resignation' });
  assert.deepEqual((await readCombined(1)).result, finishedCombined.result);
  await writeFile(join(env('PLAYABLE_OUT'), 'combined-features.json'), JSON.stringify({ game_id: combinedId,
    options, kings: finalCombined.kings, hands: finalCombined.hands, initial_fen: initialCombined.fen, final_fen: finalCombined.fen,
    revision: finishedCombined.revision, turns: combinedTurns, spent: finalPosition.used, reloaded: true, result: finishedCombined.result,
    checks: ['fairy army and ready choices', 'Cards with always-on March', 'March off the home rank', 'Maester swap', 'UI MorphP and End turn', 'same actors alternate web and MCP', 'accepted history and card use', 'same full game URL after reload'] }, null, 2));
  assert.deepEqual(failures, [], 'No failed resource or external request');
  assert.equal(lostReplies, 1, 'Only the deliberate lost command reply fails on the network');
  // The deliberately lost HTTP reply produces one browser network error.
  assertNoErrors(errors.filter(error => !String(error).includes('net::ERR_FAILED')));
  await writeFile(join(env('PLAYABLE_OUT'), 'proof.json'), JSON.stringify({ game_id: gameId, origin, revision: a.revision, commands: commands.length, result: a.result, checks: ['emitted /play/ and /g assets', 'real HTTP create', 'MCP join', 'hidden setup', 'UI ready and two-action Haste turn', 'lost reply reload', 'same account MCP', 'shared result'] }, null, 2));
  console.log(`PASS web-game: emitted website, HTTP and MCP share one game; proof ${resolve(env('PLAYABLE_OUT'))}`);
  }
} finally {
  await browser?.close();
  if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
  await app?.pool.end();
  if (savedAccess !== undefined) await pool.query('update public.web_account_access set enabled=$1 where singleton=true', [savedAccess]);
  await pool.query("delete from public.outbox where payload->>'game_id' in (select g.id::text from public.games g where exists(select from public.game_players p where p.game_id=g.id and p.user_id=any($1::uuid[])))", [actors]);
  await pool.query('delete from public.games g where exists(select from public.game_players p where p.game_id=g.id and p.user_id=any($1::uuid[]))', [actors]);
  await pool.query('delete from auth.users where id=any($1::uuid[])', [actors]);
  await pool.end(); await rm(work, { recursive: true, force: true }); unregister();
}
