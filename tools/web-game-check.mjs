/** Real emitted website + HTTP + MCP on one disposable local database. No provider or production calls. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'vite';
import pg from 'pg';
import { register } from 'tsx/esm/api';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import { testDatabase } from './plugin-db-config.mjs';
import { buildPluginServer } from './plugin-server-build.mjs';
import { recoveryOutput, serveSite } from './web-online-check.mjs';
import { launch, shot, trapErrors, assertNoErrors, env } from './lib/checks.mjs';
import { checkRecoveryConsumers, checkSharedMechanics } from './lib/shared-mechanics-check.mjs';
import { checkErrorRecorder } from './lib/error-recorder-check.mjs';
import { checkSoloSync } from './lib/solo-sync-check.mjs';

const unregister = register();
const mechanics = process.argv[2] === 'mechanics';
const recovery = process.argv[2] === 'recovery';
const desktop = process.argv[2] === 'desktop';
const discovery = process.argv[2] === 'discovery';
const stagingLogin = process.argv[2] === 'staging-login';
// VITE_KINGDOWN_STAGE=staging runs the website Ranked flow; without it the build is the production build (ticket 67).
const rankedStage = !stagingLogin && process.env.VITE_KINGDOWN_STAGE === 'staging';
const accountOrigin = stagingLogin || rankedStage ? 'https://puhspsyjyzaghmgtkzqd.supabase.co' : 'https://web-proof.supabase.co';
// The local server starts as a localDev server without a stage, and production refuses the staging project
// there (ticket 66). So the server and the signed test sessions use a local test issuer; only the site build
// names the account project of its stage.
const issuerOrigin = 'https://web-proof.supabase.co';
assert(process.argv.length === (mechanics || recovery || desktop || discovery || stagingLogin ? 3 : 2), 'Use web-game-check.mjs [mechanics|recovery|desktop|discovery|staging-login]');
if (recovery) assert(process.env.KINGDOWN_WEB_RECOVERY_OUTPUT, 'Recovery consumers require an exact external KINGDOWN_WEB_RECOVERY_OUTPUT');
const { fromFen } = await import('../src/rules/setup.ts');
const { M, N, P, parseSq, typeOf } = await import('../src/rules/engine.ts');
const connectionString = process.env.PLUGIN_TEST_DATABASE_URL;
testDatabase(connectionString);
// Another branch can change the shared test schema before this check gets its slot.
execFileSync(process.execPath, [fileURLToPath(new URL('./plugin-db/bootstrap-test.mjs', import.meta.url))], { timeout: 60_000 });
const work = await mkdtemp(join(tmpdir(), 'kingdown-web-game-'));
const actors = Array.from({ length: recovery ? 4 : 2 }, () => randomUUID());
const pool = new pg.Pool({ connectionString, max: 1 });
let app, server, browser, savedAccess;
const failures = [], commands = [];
let lostReplies = 0;
try {
  // Use public fake settings only. The browser gets a real signed local session; no OAuth provider is contacted.
  await build({ logLevel: 'warn', define: {
    'import.meta.env.VITE_KINGDOWN_STAGE': JSON.stringify(stagingLogin || rankedStage ? 'staging' : ''),
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(accountOrigin),
    'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify('sb_publishable_local_test'),
  }, build: { outDir: join(work, 'site'), emptyOutDir: true } });
  // The check drives seats through the MCP tools as well as the web page, so its tree keeps the parked plugin.
  const root = await buildPluginServer(join(work, 'combined'), { site: join(work, 'site'), chatgpt: true });
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
  const tokens = await Promise.all(actors.map(sub => new SignJWT({ sub, iss: issuerOrigin + '/auth/v1', aud: 'authenticated', role: 'authenticated', is_anonymous: false })
    .setProtectedHeader({ alg: 'ES256', kid: 'local-web' }).setExpirationTime('10m').sign(pair.privateKey)));
  const runtimeSettings = { NODE_ENV: 'test', KINGDOWN_PLUGIN_ORIGIN: origin, KINGDOWN_PLUGIN_DATABASE_URL: connectionString,
    KINGDOWN_INTERNAL_SECRET: randomUUID(), SUPABASE_URL: issuerOrigin, SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_local_test', KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS: randomUUID() };
  const runtimeOptions = { localDev: true, websiteKeys, websiteCurrentUser: async (token, actor) => { assert.equal(tokens[actors.indexOf(actor)], token); } };
  app = await configurePlugin(runtimeSettings, runtimeOptions);
  // The service reads the stage at each start; the loopback settings above stay local.
  if (rankedStage) process.env.KINGDOWN_STAGE = 'staging';
  let rpcId = 0;
  async function tool(seat, name, args = {}) {
    const response = await fetch(origin + '/mcp', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json,text/event-stream', 'X-Kingdown-Dev-Actor': actors[seat], 'MCP-Protocol-Version': '2025-11-25' },
      body: JSON.stringify({ jsonrpc: '2.0', id: ++rpcId, method: 'tools/call', params: { name, arguments: args } }) });
    assert.equal(response.status, 200);
    const { result, error } = await response.json(); assert(!error, `${name}: RPC error`); assert(!result.isError, `${name}: ${JSON.stringify(result)}`); return result;
  }
  if (!mechanics && !recovery) for (const seat of [0, 1]) await tool(seat, 'kingdown_handle', { handle: `web${seat}-${actors[seat].slice(0, 8)}` });
  browser = await launch({ headless: true });
  if (!mechanics && !recovery && !desktop && !discovery && !stagingLogin) await checkErrorRecorder({ browser, origin, pool, root });
  const context = await browser.newContext({ viewport: { width: 1100, height: 1000 } });
  await context.addInitScript(({ origin, actor, token }) => { if (location.origin === origin && !localStorage.getItem('kingdown.auth')) localStorage.setItem('kingdown.auth', JSON.stringify({
    access_token: token, refresh_token: 'local-test-refresh', token_type: 'bearer', expires_in: 600, expires_at: Math.floor(Date.now() / 1000) + 600, user: { id: actor, aud: 'authenticated', role: 'authenticated', email: 'browser@example.invalid', app_metadata: { provider: 'google' }, user_metadata: {}, created_at: new Date().toISOString() },
  })); }, { origin, actor: actors[0], token: tokens[0] });
  // Reject any accidental external request, including refresh and provider user lookups.
  if (!desktop) await context.route('**/*', async route => {
    if (new URL(route.request().url()).origin !== origin) { failures.push('External request blocked'); return route.abort(); }
    return route.continue();
  });
  if (stagingLogin) {
    const { checkStagingLogin } = await import('./lib/staging-login-check.mjs');
    await checkStagingLogin({ browser, origin, accountOrigin, actors, tokens, tool });
  } else if (discovery) {
    const { checkAccountDiscovery } = await import('./lib/account-discovery-check.mjs');
    await checkAccountDiscovery({ browser, context, origin, actors, pool, tool });
    assert.deepEqual(failures, [], 'No external request');
  } else if (desktop) {
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
  await page.clock.install();
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
  await page.locator('#setup-options summary').click();
  await page.locator('label.mode').filter({ has: page.getByRole('radio', { name: 'A friend', exact: true }) }).click();
  await page.locator('#setup-colour label').filter({ has: page.getByRole('radio', { name: 'White', exact: true }) }).click();
  await page.locator('#setup-sorting').getByRole('radio', {name:'Random',exact:true}).locator('..').click();
  assert(await page.locator('#setup-sorting').getByRole('radio', {name:'Random',exact:true}).isChecked());
  for (const [key, on] of [['cards', false], ['kingPowers', true]]) {
    const input = page.locator(`#setup-toggle-${key}`);
    await input.setChecked(on);
    assert.equal(await input.isChecked(), on);
  }
  await page.locator('#setup-king').click();
  await page.locator('#menu-sheet [data-king="Flame"]').click();
  await page.locator('#menu-sheet [data-power="Haste"]').click();
  await page.locator('#setup-done').click();
  // Keep the real invitation and shorten only its UI deadline to exercise expiry without a seven-day wait.
  const shortInvite = async route => {
    const response = await route.fetch(), body = await response.json();
    assert(body.invite);
    body.invite.expires_at = new Date(await page.evaluate(() => Date.now()) + 60_000).toISOString();
    await route.fulfill({ response, json: body });
  };
  await page.route('**/api/games', shortInvite);
  const created = page.waitForResponse(response => response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/games');
  await page.locator('#setup-start').click();
  const startResponse = await created; assert.equal(startResponse.status(), 201);
  const start = await startResponse.json(); let gameId = start.view.game_id;
  const view = async seat => (await tool(seat, 'kingdown_get', { game_id: gameId }))._meta.view;
  assert.equal(start.view.options.arrangement, false); assert.equal(start.view.options.kingPowers, true);
  await page.locator('#friend-code').filter({ hasText: /[A-Z0-9]{6}/ }).waitFor();
  let code = (await page.locator('#friend-code').innerText()).trim();
  await page.unroute('**/api/games', shortInvite);
  await pool.query("update public.game_invites set expires_at=now()-interval '1 second' where game_id=$1", [gameId]);
  assert.equal((await http(1, '/api/invites/preview', { code }, 409)).code, 'INVITE_UNAVAILABLE');
  await page.clock.fastForward(60_001);
  await page.locator('#friend-new').waitFor();
  assert.match(await page.locator('#friend-help').innerText(), /expired/);
  assert.equal(await page.locator('#friend-actions').isVisible(), false);
  assert.equal((await pool.query('select expires_at < now() as expired from public.game_invites where game_id=$1', [gameId])).rows[0].expired, true, 'Expiry does not renew the invite');
  await shot(page, 'web-expired-friend-code');
  await page.clock.setSystemTime(new Date());
  const oldCode = code;
  // An expired game stays closed. Use a new game for the code rotation checks.
  const fresh = await http(0, '/api/games', { kind: 'friend', options: start.view.options, colour: 'white', command_id: randomUUID() }, 201);
  gameId = fresh.view.game_id;
  await page.goto(`${origin}/g/${gameId}`);
  await page.locator('#friend-new').waitFor();
  await page.locator('#friend-new').click(); await page.locator('#friend-code').filter({ hasText: /[A-Z0-9]{6}/ }).waitFor();
  code = (await page.locator('#friend-code').innerText()).trim(); assert.notEqual(code, oldCode);
  assert.equal((await http(1, '/api/invites/preview', { code: oldCode }, 409)).code, 'INVITE_UNAVAILABLE');
  // Another host replaces this still-open page's code. The ordinary read must revoke its Share/Copy.
  const replacedCode = code;
  const remoteInvite = await tool(0, 'kingdown_invite', { game_id: gameId });
  assert(!remoteInvite.isError);
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await page.locator('#friend-help').filter({ hasText: 'replaced on another page' }).waitFor();
  assert.equal(await page.locator('#friend-actions').isVisible(), false);
  assert.equal(await page.locator('#friend-code').isVisible(), false);
  assert.equal((await http(1, '/api/invites/preview', { code: replacedCode }, 404)).code, 'INVITE_UNAVAILABLE');
  assert.equal((await pool.query('select token_hash from public.game_invites where game_id=$1', [gameId])).rows[0].token_hash, remoteInvite.structuredContent.invite_id, 'The read does not renew the remote invite');
  await shot(page, 'web-replaced-friend-code');
  await page.locator('#friend-new').click(); await page.locator('#friend-code').filter({ hasText: /[A-Z0-9]{6}/ }).waitFor();
  code = (await page.locator('#friend-code').innerText()).trim(); assert.notEqual(code, replacedCode);
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
  const recoveryDestination = (await tool(0, 'kingdown_create', { kind: 'friend', mode: 'casual', colour: 'white', command_id: randomUUID(),
    options: { fairy: true, pool: ['O', 'A', 'G', 'M', 'S'], arrangement: true, classic: false, cards: false, cardPool: [], kingPowers: false } }))._meta.view;
  const invite = await tool(0, 'kingdown_invite', { game_id: recoveryDestination.game_id });
  await tool(1, 'kingdown_join', { code: invite.structuredContent.code });
  const destination = (await tool(0, 'kingdown_get', { game_id: recoveryDestination.game_id }))._meta.view;
  let applied, releaseRecovery, recoveryStarted, failRecovery = true;
  const recoveryHeld = new Promise(resolve => { releaseRecovery = resolve; });
  const recovering = new Promise(resolve => { recoveryStarted = resolve; });
  const lost = new Promise(resolve => { applied = resolve; });
  await page.route('**/api/games/*/commands', async route => {
    const body = route.request().postDataJSON(); commands.push(body);
    if (commands.length > 1 && failRecovery) { recoveryStarted(); await recoveryHeld; await route.abort('failed'); return; }
    const response = await route.fetch(); assert.equal(response.status(), 200);
    if (commands.length === 1) { await route.abort('failed'); applied(); }
    else await route.fulfill({ response });
  });
  await page.locator('#end-turn[aria-disabled="false"]').click(); await lost;
  // A full navigation keeps the URL's game while it recovers another game's durable command.
  await page.goto(origin + '/g/' + destination.game_id);
  // The destination's setup appears even while the source command's recovery is held.
  await page.locator('[data-screen="seat"]:not([hidden])').waitFor();
  await page.locator('#seat-ready:disabled').waitFor();
  assert.equal(new URL(page.url()).pathname, '/g/' + destination.game_id);
  await recovering;
  releaseRecovery();
  await page.locator('#retry:not(:disabled)').waitFor({ state: 'visible' });
  assert(await page.locator('#seat-ready').isDisabled(), 'Another game cannot replace the saved command after recovery fails');
  await shot(page, 'web-other-game-recovery-retry');
  const replay = page.waitForResponse(response => response.request().method() === 'POST' && new URL(response.url()).pathname === `/api/games/${gameId}/commands`);
  failRecovery = false;
  await page.locator('#retry').click();
  assert.equal((await replay).status(), 200);
  await page.locator('#seat-ready:not(:disabled)').waitFor();
  await page.clock.fastForward(5000);
  assert.equal(new URL(page.url()).pathname, '/g/' + destination.game_id, 'Recovering the source command keeps the selected URL');
  assert(await page.locator('[data-screen="seat"]:not([hidden])').isVisible(), 'The recovered source reply cannot replace the selected setup');
  assert.equal((await tool(0, 'kingdown_get', { game_id: destination.game_id }))._meta.view.revision, destination.revision, 'Recovery never sends the source command to the destination');
  await shot(page, 'web-pending-command-keeps-url-game');
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
  // Keep the return route in this document; a page reload would clear the result screen's attempt state.
  await page.locator('#board-menu').click(); await page.locator('#board-sheet').getByRole('button', {name: 'Main menu', exact: true}).click();
  await page.locator(`#games-list [data-game-id="${gameId}"]`).click();
  await page.locator('[data-screen="board"]:not([hidden])').waitFor();
  const rematchDocument = await page.evaluate(() => performance.timeOrigin);
  await tool(1, 'kingdown_resign', { game_id: gameId, command_id: randomUUID(), expected_revision: b.revision });
  await page.locator('[data-screen="end"]:not([hidden])').waitFor();
  a = await view(0); b = await view(1); assert.deepEqual(a.result, b.result); assert.equal(a.result.winner, 0); assert.equal(a.result.reason, 'resignation');
  assert.equal(await page.locator('#over-title').innerText(), 'You win');
  await shot(page, 'web-shared-result');
  await page.unroute('**/api/games/*/commands');
  // Browser Back supplies a newer route while the accepted rematch is still opening.
  let releaseRematch, rematchHeld;
  const heldRematch = new Promise(resolve => { rematchHeld = resolve; });
  const holdRematch = async route => {
    if (route.request().method() !== 'GET' || new URL(route.request().url()).pathname === `/api/games/${gameId}` || releaseRematch) return route.continue();
    const response = await route.fetch();
    await new Promise(resolve => { releaseRematch = resolve; rematchHeld(); });
    await route.fulfill({ response });
  };
  await page.route('**/api/games/*', holdRematch);
  try {
    await page.clock.fastForward(1100);
    await page.locator('#over').getByRole('button', { name: 'Rematch', exact: true }).click();
    await page.locator('#over .quiet-line').filter({ hasText: 'Rematch offered' }).waitFor();
    b = await view(1);
    const accepted = await tool(1, 'kingdown_rematch', { game_id: gameId, command_id: randomUUID(), expected_revision: b.revision, choice: 'accept' });
    const rematchId = accepted._meta.view.rematch_game_id;
    assert(rematchId && rematchId !== gameId);
    await heldRematch;
    await page.goBack();
    await page.locator('[data-screen="play"]:not([hidden])').waitFor();
    await page.goForward();
    await page.locator('[data-screen="end"]:not([hidden])').waitFor();
    assert.equal(await page.evaluate(() => performance.timeOrigin), rematchDocument, 'History navigation preserves the mounted result screen');
    assert.equal(await page.locator('#over-title').innerText(), 'You win');
    releaseRematch();
    await page.waitForURL(origin + '/g/' + rematchId);
    await page.locator('[data-screen="seat"]:not([hidden])').waitFor();
    assert.equal(await page.locator('#retry').isVisible(), false);
    assert.equal((await view(0)).rematch_game_id, rematchId, 'Return opens the same accepted rematch');
    assert.deepEqual((await view(0)).result, a.result, 'The original result is preserved');
    await shot(page, 'web-rematch-selection-recovered');
  } finally { releaseRematch?.(); await page.unroute('**/api/games/*', holdRematch); }
  await checkSoloSync({ page, ui: page, tool: (name, args) => tool(0, name, args), open: id => page.goto(origin + '/g/' + id), label: 'web' });
  {
    // A fresh /play/ load recovers a pending computer reply on its source board; the URL names that board.
    const solo = (await tool(0, 'kingdown_create', { kind: 'solo', mode: 'casual', colour: 'white', level: 'beginner', command_id: randomUUID(),
      options: { fairy: true, pool: ['Q', 'O', 'L', 'R', 'B', 'N', 'A', 'G', 'M', 'S'], arrangement: false, classic: false, cards: true, cardPool: ['Freeze', 'IceWall', 'March', 'MorphP'], kingPowers: true } }))._meta.view;
    const soloPath = '/g/' + solo.game_id, readSolo = async () => (await tool(0, 'kingdown_get', { game_id: solo.game_id }))._meta.view;
    await tool(0, 'kingdown_choose', { game_id: solo.game_id, command_id: randomUUID(), expected_revision: solo.revision, order: solo.draw, king: { king: 'Mud', power: 'March' }, ready: true });
    await page.goto(origin + soloPath);
    await page.locator('[data-screen="board"]:not([hidden])').waitFor();
    await page.locator('#board[aria-busy="false"]:not([data-animating="true"])').waitFor();
    let computerSent, releaseComputer, heldId;
    const sent = new Promise(resolve => { computerSent = resolve; }), released = new Promise(resolve => { releaseComputer = resolve; });
    const holdComputer = async route => {
      const body = route.request().postDataJSON();
      if (body?.action?.type !== 'computer') return route.continue();
      heldId = body.command_id; computerSent(); await released;
      await route.abort('aborted').catch(() => {});
    };
    await page.route('**/api/games/*/commands', holdComputer);
    const canvas = page.locator('#board canvas'), box = await canvas.boundingBox(); assert(box);
    const square = (file, rank) => canvas.click({ position: { x: (32 + (file + .5) * 112) * box.width / 960, y: (96 + (7 - rank + .5) * 112) * box.width / 960 } });
    await square(0, 1); await square(0, 2);
    await page.locator('#end-turn[aria-disabled="false"]').click();
    await sent;
    const moved = await readSolo();
    await page.unroute('**/api/games/*/commands', holdComputer);
    const computerCalls = [];
    const logComputer = response => {
      const request = response.request(), body = request.method() === 'POST' && request.postDataJSON();
      if (body?.action?.type === 'computer') computerCalls.push({ id: body.command_id, status: response.status() });
    };
    page.on('response', logComputer);
    await page.goto(origin + '/play/');
    releaseComputer();
    await page.locator('[data-screen="board"]:not([hidden])').waitFor();
    assert.equal(new URL(page.url()).pathname, soloPath, 'Recovery names the source game in the URL');
    // A tap during a board animation only skips it (owner pick A8 a), so Back waits for the board to stop.
    await page.locator('#status').filter({ hasText: 'Your move' }).waitFor();
    await page.locator('#board[aria-busy="false"]:not([data-animating="true"])').waitFor();
    page.off('response', logComputer);
    // The server plays one computer action for each call (W7 ticket 06). A card or a Haste first move keeps the
    // computer's turn, and the board then sends one more call with a new ID.
    const replied = await readSolo(), reply = replied.last_commands.filter(command => command.seq > moved.last_commands.at(-1).seq);
    assert.equal(computerCalls[0]?.id, heldId, 'Recovery sends the held computer command first');
    assert.equal(new Set(computerCalls.map(call => call.id)).size, computerCalls.length, 'No computer command goes twice');
    assert.deepEqual(computerCalls.map(call => call.status), computerCalls.map(() => 200), 'The server accepts each computer call');
    assert.deepEqual(reply.map(command => command.action.type), computerCalls.map(() => 'computer'), 'Each computer call adds one computer action and nothing else');
    assert.equal(replied.revision, moved.revision + computerCalls.length);
    assert.equal(replied.turn, replied.seat, 'The player moves after the computer turn');
    assert.equal(new URL(page.url()).pathname, soloPath, 'The settled reply keeps the source game URL');
    await shot(page, 'web-recovered-solo-url');
    await page.locator('#board-menu').click(); await page.locator('#board-sheet').getByRole('button', {name: 'Main menu', exact: true}).click();
    await page.locator('[data-screen="play"]:not([hidden])').waitFor();
    assert.equal(new URL(page.url()).pathname, '/play/', 'Menu returns to the games list');
    console.log(`web: a fresh /play/ load recovers a pending computer reply under its source game URL (computer calls: ${computerCalls.length})`);
  }
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
  assert.equal(finishedCombined.rating_policy, 'casual');
  assert.equal(finishedCombined.outcome.rating, null);
  assert.equal((await pool.query('select count(*)::int as n from public.rating_history where game_id=any($1::uuid[])', [[gameId,combinedId]])).rows[0].n, 0, 'Both new Casual human games keep results without ratings');
  await writeFile(join(env('PLAYABLE_OUT'), 'combined-features.json'), JSON.stringify({ game_id: combinedId,
    options, kings: finalCombined.kings, hands: finalCombined.hands, initial_fen: initialCombined.fen, final_fen: finalCombined.fen,
    revision: finishedCombined.revision, turns: combinedTurns, spent: finalPosition.used, reloaded: true, result: finishedCombined.result,
    checks: ['fairy army and ready choices', 'Cards with always-on March', 'March off the home rank', 'Maester swap', 'UI MorphP and End turn', 'same actors alternate web and MCP', 'accepted history and card use', 'same full game URL after reload'] }, null, 2));
  if (rankedStage) {
    // The real shared setup creates the fixed ranked family; MCP takes the other seat.
    await page.goto(origin + '/play/');
    await page.locator('#setup-options summary').click();
    await page.locator('#setup-body .modes').getByRole('radio', {name:'Random',exact:true}).locator('..').click();
    await page.locator('#setup-rating input[value="ranked"]').locator('..').click();
    assert.match(await page.locator('#setup-ranked-rules').innerText(), /3 days per move/);
    for (const id of ['anyRules-row','fairy-row','cards-row','setup-sorting','setup-colour']) assert(await page.locator('#'+id).isHidden(), `Ranked fixes ${id}`);
    const rankedStart=page.waitForResponse(response=>response.request().method()==='POST' && new URL(response.url()).pathname==='/api/games/find');
    await page.locator('#setup-start').click();
    const rankedResponse=await rankedStart, ranked=await rankedResponse.json(); assert.equal(rankedResponse.status(),200,JSON.stringify(ranked));
    assert.equal(ranked.rating_policy,'ranked-v1'); assert.equal(ranked.days_per_move,3); assert.equal(ranked.deal.length,4);
    const rankedId=ranked.game_id, readRanked=async actor=>(await tool(actor,'kingdown_get',{game_id:rankedId}))._meta.view;
    const joinedRanked=(await tool(1,'kingdown_find',{mode:'ranked',command_id:randomUUID()}))._meta.view;
    assert.equal(joinedRanked.game_id,rankedId); assert.equal(joinedRanked.rating_policy,'ranked-v1');
    await page.locator('[data-screen="seat"]:not([hidden]) #seat-ready:not(:disabled)').waitFor();
    await page.locator('#seat-ready').click();
    await page.waitForFunction(()=>document.querySelector('#seat-context')?.textContent?.includes('Waiting'));
    let other=await readRanked(1);
    await tool(1,'kingdown_choose',{game_id:rankedId,command_id:randomUUID(),expected_revision:other.revision,...other.choices[other.seat],ready:true});
    await page.locator('[data-screen="board"]:not([hidden])').waitFor();
    let mine=await readRanked(0);
    if (mine.turn!==mine.seat) {
      other=await readRanked(1);
      await tool(1,'kingdown_move',{game_id:rankedId,command_id:randomUUID(),expected_revision:other.revision,actions:[other.legal.find(lan=>!lan.includes('!'))]});
      mine=await readRanked(0);
    }
    await page.locator('#status').filter({hasText:'Your move'}).waitFor();
    await page.locator('#board[aria-busy="false"]:not([data-animating="true"])').waitFor();
    await page.locator('#board-menu').click();
    assert.match(await page.locator('#board-sheet').innerText(), /Ranked/);
    await page.locator('#board-sheet').getByRole('button',{name:'Ranked game',exact:true}).click();
    assert.match(await page.locator('#board-sheet').innerText(), /Do not use engine, AI or human advice/);
    await page.locator('#board-sheet [aria-label="Close"]').click(); await page.locator('#board-menu').click();
    const rankedMove=mine.legal.find(lan=>!lan.includes('!')); assert(rankedMove);
    await page.locator('#board-sheet').getByRole('button',{name:'Choose a move',exact:true}).click();
    await page.locator(`#choices button[title="${rankedMove}"]`).click();
    const rankedCommit=page.waitForResponse(response=>response.request().method()==='POST' && new URL(response.url()).pathname===`/api/games/${rankedId}/commands`);
    await page.locator('#end-turn[aria-disabled="false"]').click(); assert.equal((await rankedCommit).status(),200);
    other=await readRanked(1); assert.equal(other.revision,mine.revision+1); assert.equal(other.history.actions.at(-1),rankedMove);
    await shot(page,'web-ranked-turn');
    await tool(1,'kingdown_resign',{game_id:rankedId,command_id:randomUUID(),expected_revision:other.revision});
    await page.locator('[data-screen="end"]:not([hidden])').waitFor();
    assert.match(await page.locator('#end-reason').innerText(),/^Ranked/);
    const rankedEnd=await readRanked(0); assert.notEqual(rankedEnd.outcome.rating,null);
    assert.equal((await pool.query('select count(*)::int as n from public.rating_history where game_id=$1',[rankedId])).rows[0].n,2);
    await shot(page,'web-ranked-result');
    await writeFile(join(env('PLAYABLE_OUT'),'ranked-policy.json'),JSON.stringify({game_id:rankedId,rating_policy:rankedEnd.rating_policy,options:rankedEnd.options,days_per_move:rankedEnd.days_per_move,engine:rankedEnd.engine_fingerprint,revision:rankedEnd.revision,history:rankedEnd.history.actions,outcome:rankedEnd.outcome,checks:['actual shared web Ranked setup','MCP ranked join','web UI move read through MCP','Casual outcomes without rating rows','Ranked outcome with two rating rows']},null,2));
  } else {
    // Production: the shared setup offers no Ranked choice, and HTTP and MCP refuse a ranked start.
    await page.goto(origin + '/play/');
    await page.locator('#setup-options summary').click();
    await page.locator('#setup-body .modes').getByRole('radio', {name:'Random',exact:true}).locator('..').click();
    assert(await page.locator('#setup-rating').isHidden(), 'Production shows no Ranked choice');
    assert.doesNotMatch(await page.locator('#setup-body').innerText(), /Ranked/);
    const refused = await http(0, '/api/games/find', { mode: 'ranked', command_id: randomUUID() }, 409);
    assert.deepEqual(refused, { code: 'RANKED_UNAVAILABLE', message: 'Ranked is not available. Play a Casual game.' });
    const response = await fetch(origin + '/mcp', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json,text/event-stream', 'X-Kingdown-Dev-Actor': actors[1], 'MCP-Protocol-Version': '2025-11-25' },
      body: JSON.stringify({ jsonrpc: '2.0', id: ++rpcId, method: 'tools/call', params: { name: 'kingdown_find', arguments: { mode: 'ranked', command_id: randomUUID() } } }) });
    const { result } = await response.json(); assert(result.isError); assert.equal(result._meta?.code, 'RANKED_UNAVAILABLE');
    assert.equal((await pool.query("select count(*)::int as n from public.games where rating_policy='ranked-v1' and created_by=any($1::uuid[])", [actors])).rows[0].n, 0);
  }
  // Hold an actual old HTTP list while the player leaves and returns after the offer is cancelled.
  const staleOffer = (await tool(1, 'kingdown_create', { kind: 'random', mode: 'casual', command_id: randomUUID() }))._meta.view;
  await page.goto(origin + '/play/'); await page.locator('[data-screen="play"]:not([hidden]) #setup-start:not(:disabled)').waitFor();
  await page.locator('#setup-options summary').click();
  await page.locator('#setup-body .modes').getByRole('radio', {name:'Random',exact:true}).locator('..').click();
  if (rankedStage) await page.locator('#setup-rating input[value="casual"]').locator('..').click();
  let releaseLobby, heldLobby;
  const held = new Promise(resolve => { heldLobby = resolve; });
  const delayedLobby = async route => {
    const response = await route.fetch();
    if (!releaseLobby) {
      assert((await response.json()).games.some(game => game.game_id === staleOffer.game_id), 'The held response contains the old offer');
      await new Promise(resolve => { releaseLobby = resolve; heldLobby(); });
    }
    await route.fulfill({ response });
  };
  await page.route('**/api/lobby', delayedLobby);
  try {
    await page.locator('#play-open').click(); await held;
    await page.locator('#page-back').click(); await page.locator('[data-screen="play"]:not([hidden])').waitFor();
    await tool(1, 'kingdown_cancel', { game_id: staleOffer.game_id });
    await page.locator('#play-open').click(); await page.locator('#lobby-status').filter({ hasText: /^$/ }).waitFor({ state: 'attached' });
    const currentRows = await page.locator('#lobby-list').innerText();
    const oldReply = page.waitForResponse(response => new URL(response.url()).pathname === '/api/lobby');
    releaseLobby(); await (await oldReply).finished();
    await page.locator('html').evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.equal(await page.locator('#lobby-list').innerText(), currentRows, 'An old website lobby reply cannot restore the cancelled offer');
    await shot(page, 'web-current-opponents');
  } finally { releaseLobby?.(); await page.unroute('**/api/lobby', delayedLobby); }
  // Settings-only logout uses the real auth client with local fake identities; no provider is contacted.
  const savedGames = async () => (await pool.query('select id,revision,status,state from public.games where created_by=any($1::uuid[]) order by id', [actors])).rows;
  const gamesBeforeLogout = await savedGames(), commandsBeforeLogout = commands.length;
  const logoutProof = [];
  async function checkLogout(width, height, touch) {
    const ctx = await browser.newContext({ viewport: { width, height }, hasTouch: touch });
    let releaseLogout;
    const held = new Promise(resolve => { releaseLogout = resolve; });
    try {
      await ctx.addInitScript(({ origin, actor, token }) => {
        if (location.origin !== origin || sessionStorage.getItem('logout-proof')) return;
        sessionStorage.setItem('logout-proof', '1');
        localStorage.setItem('kingdown.auth', JSON.stringify({ access_token: token, refresh_token: 'local-test-refresh', token_type: 'bearer', expires_in: 600, expires_at: Math.floor(Date.now() / 1000) + 600,
          user: { id: actor, aud: 'authenticated', role: 'authenticated', email: 'browser@example.invalid', app_metadata: { provider: 'google' }, user_metadata: {}, created_at: new Date().toISOString() } }));
      }, { origin, actor: actors[0], token: tokens[0] });
      await ctx.route('**/*', route => {
        if (new URL(route.request().url()).origin !== origin) { failures.push('External request blocked'); return route.abort(); }
        return route.continue();
      });
      const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
      let logouts = 0;
      await ctx.route(`${accountOrigin}/auth/v1/settings`, route => route.fulfill({ headers, json: { external: { google: true, github: true } } }));
      await ctx.route(`${accountOrigin}/auth/v1/logout**`, async route => {
        if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
        assert.equal(route.request().method(), 'POST');
        assert.equal(new URL(route.request().url()).searchParams.get('scope'), 'local');
        logouts++; await held;
        return route.fulfill({ headers, json: {} });
      });
      const screen = await ctx.newPage(); screen.setDefaultTimeout(15_000);
      const logoutErrors = trapErrors(screen);
      await screen.goto(origin + '/play/profile');
      await screen.locator('#profile-status').filter({ hasText: /^$/ }).waitFor({ state: 'attached' });
      assert.equal(await screen.locator('#profile-sheet').getByRole('button', { name: 'Log out', exact: true }).count(), 0, 'Profile has no logout button');
      await screen.goto(origin + '/play/settings');
      const logout = screen.getByRole('button', { name: 'Log out', exact: true });
      await logout.scrollIntoViewIfNeeded();
      assert.equal(await logout.count(), 1, 'Settings has one logout button');
      assert(await logout.evaluate(button => button.parentElement === button.parentElement.parentElement.lastElementChild), 'Log out is the last Settings row');
      const box = await logout.boundingBox();
      assert(box && box.width >= 48 && box.height >= 48, 'Log out has a 48 by 48 pixel target');
      await screen.evaluate(() => document.fonts.ready);
      await screen.mouse.move(0, 0);
      await shot(screen, touch ? 'settings-logout-phone' : 'settings-logout-desktop');
      await screen.keyboard.press('Tab'); await logout.focus();
      assert(await logout.evaluate(button => button.matches(':focus-visible') && getComputedStyle(button).outlineStyle !== 'none'), 'Log out has visible keyboard focus');
      const receiptKey = `kingdown.account-command.${actors[0]}`;
      const receipt = JSON.stringify({ name: 'kingdown_move', args: { game_id: combinedId, command_id: randomUUID(), expected_revision: finishedCombined.revision, actions: ['e2-e4'] } });
      await screen.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: receiptKey, value: receipt });
      const sent = screen.waitForRequest(request => new URL(request.url()).pathname === '/auth/v1/logout' && request.method() === 'POST');
      if (touch) await logout.tap();
      else { await screen.keyboard.down('Enter'); await screen.keyboard.down('Enter'); await screen.keyboard.up('Enter'); }
      await sent;
      await screen.mouse.dblclick(box.x + box.width / 2, box.y + box.height / 2);
      await screen.locator('#settings-sheet [data-nav="handle"]').click();
      await screen.locator('[data-screen="handle"]:not([hidden])').waitFor();
      assert(await screen.locator('#settings-logout').isDisabled(), 'The name screen lock keeps pending logout disabled');
      await screen.locator('#page-back').click();
      await screen.locator('[data-screen="settings"]:not([hidden])').waitFor();
      assert(await logout.evaluate(button => !button.disabled && button.matches(':disabled')), 'The fieldset keeps pending logout disabled after the real lock clears the button state');
      await logout.evaluate(button => { button.disabled = false; button.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
      assert.equal(logouts, 1, 'Repeated activation sends one local logout across a page update');
      releaseLogout();
      await screen.getByText('Sign in to play with your account.', { exact: true }).waitFor();
      assert.equal(new URL(screen.url()).pathname, '/play/');
      assert.equal(await screen.locator('#app-root').count(), 0, 'Logout removes the private screen');
      await screen.reload();
      await screen.getByRole('button', { name: 'Continue with Google', exact: true }).waitFor();
      assert.equal(await screen.locator('#app-root').count(), 0, 'A reload stays signed out');
      assert.equal(await screen.evaluate(key => localStorage.getItem(key), receiptKey), receipt, 'Logout keeps the pending game receipt');
      assert.equal(logouts, 1, 'One activation sends one local logout');
      assertNoErrors(logoutErrors);
      logoutProof.push({ width, height, target: { width: box.width, height: box.height }, logouts, focus: true, pageUpdate: true, nativeFieldsetLock: true, signedOutReload: true });
    } finally { releaseLogout(); await ctx.close(); }
  }
  await checkLogout(1280, 800, false);
  await checkLogout(390, 844, true);
  assert.deepEqual(await savedGames(), gamesBeforeLogout, 'Keyboard and touch logout keep every saved game unchanged');
  assert.equal(commands.length, commandsBeforeLogout, 'Logout sends no game command');
  await writeFile(join(env('PLAYABLE_OUT'), 'settings-logout-proof.json'), JSON.stringify({ screens: logoutProof, savedGames: 'unchanged', pendingReceipt: 'unchanged', gameCommands: 0 }, null, 2));
  assert.deepEqual(failures, [], 'No failed resource or external request');
  assert.equal(lostReplies, 5, 'Only the lost reply and four deliberate recovery attempts fail on the network');
  // The exhausted retry reports one connection diagnostic; all other app errors remain failures.
  const recoveryError = 'console.error: King Down connection failed TypeError: Failed to fetch';
  assert.equal(errors.filter(error => String(error).startsWith(recoveryError)).length, 1);
  assertNoErrors(errors.filter(error => !String(error).includes('net::ERR_FAILED') && !String(error).startsWith(recoveryError)));
  await writeFile(join(env('PLAYABLE_OUT'), 'proof.json'), JSON.stringify({ game_id: gameId, origin, revision: a.revision, commands: commands.length, result: a.result, checks: ['emitted /play/ and /g assets', 'real HTTP create', 'MCP join', 'hidden setup', 'UI ready and two-action Haste turn', 'lost reply navigation', 'failed recovery Retry keeps destination setup', 'same account MCP', 'shared result', 'pending solo recovery names its game URL'] }, null, 2));
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
