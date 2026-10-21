/** The same real board controls against emitted web and MCP AppBridge builds. */
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { assertNoErrors, env, shot, trapErrors } from './checks.mjs';
import { checkWidgetState } from './plugin-widget-state-check.mjs';
import { recoveryOutput } from '../web-online-check.mjs';

async function seedMechanic(runtime, pool, actors, setup, engine) {
  const match = engine ? await runtime.createPinnedMatch(setup, engine) : await runtime.createMatch(setup), id = randomUUID();
  try {
    const snapshot = await match.snapshot(), state = await match.exportSave();
    await pool.query(`insert into public.games(id,kind,speed,category,colour_rule,engine_fingerprint,setup,rules,status,turn,revision,state,snapshot,created_by,started_at)
      values($1,'friend','live','check','white',$2,$3,$4,'playing',$5,0,$6,$7,$8,now())`,
    [id, JSON.parse(state).engine, setup, snapshot.rules, snapshot.turn, state, snapshot, actors[0]]);
    await pool.query(`insert into public.game_players(game_id,seat,user_id,computer,action) values($1,0,$2,false,$3),($1,1,$4,false,$5)`,
      [id, actors[0], snapshot.turn === 0 ? 'ready' : 'waiting', actors[1], snapshot.turn === 1 ? 'ready' : 'waiting']);
    return { id, match };
  } catch (error) { await match.close(); throw error; }
}

async function ready(ui, finished = false) {
  await ui.locator(`[data-screen="${finished ? 'end' : 'board'}"]:not([hidden])`).waitFor();
  if (finished) await ui.locator('#over').getByRole('button', { name: 'See the board', exact: true }).click();
  await ui.locator('#board[aria-busy="false"]:not([data-animating="true"])').waitFor();
  // See the board leaves the table on End, where the play menu stays hidden.
  await ui.locator(finished ? '#end-result' : '#board-menu:not(:disabled)').waitFor();
}

async function closeSheet(ui) {
  const close = ui.locator('#board-sheet[open] [aria-label="Close"]');
  if (await close.count()) await close.click();
}

async function routeTrace(ui) {
  return ui.locator('body').evaluate(body => body.ownerDocument.defaultView.__mechanicsRouteTrace?.entries ?? [], undefined, { timeout: 2000 }).catch(() => []);
}

async function readsGame(response, id) {
  if (response.request().method() !== 'POST' || new URL(response.url()).pathname !== '/fixture-tool') return false;
  const request = response.request().postDataJSON();
  // An outgoing poll can finish after the next fixture starts; wait for the selected game's full read.
  if (request?.name !== 'kingdown_get' || request.arguments?.since_revision !== undefined) return false;
  const game = request.arguments?.game_id;
  return game !== undefined ? game === id : (await response.json())._meta?.view?.game_id === id;
}

async function choices(ui) {
  await closeSheet(ui);
  await ui.locator('#board-menu').click();
  await ui.locator('#board-sheet').getByRole('button', { name: 'Choose a move', exact: true }).click();
}

async function square(ui, position, seat) {
  const box = await ui.locator('#board canvas').boundingBox();
  assert(box, 'The board canvas has bounds');
  const file = seat ? 7 - position % 8 : position % 8;
  const rank = seat ? Math.floor(position / 8) : 7 - Math.floor(position / 8);
  await ui.locator('#board canvas').click({ position: {
    x: (32 + (file + .5) * 112) * box.width / 960,
    y: (96 + (rank + .5) * 112) * box.width / 960,
  } });
}

/** All fixture effects use the player's coin, move-choice sheet and End turn control. */
async function playTurn(ui, view, actions, { GameRules, toLan, cardCoins }) {
  const rules = new GameRules(view.rules);
  let position = rules.fromFen(view.fen);
  for (const lan of actions) {
    // End turn supplies the existing explicit pass for a held Haste/Rally turn.
    if (lan === '--') continue;
    await ready(ui);
    const legal = rules.legalMoves(position), move = legal.find(move => toLan(position, move) === lan);
    assert(move, `${lan}: fixture action is legal before its UI input`);
    const cards = cardCoins(position, view.seat, rules.rules.hands[view.seat], legal);
    const card = cards.findIndex(card => card.moves.includes(move));
    if (card >= 0 || move.power) {
      const coin = ui.locator(card >= 0 ? `#card-${view.seat ? 'b' : 'w'}-${card}` : `#power-${view.seat ? 'b' : 'w'}`);
      await coin.click();
      const use = ui.locator('#board-sheet').getByRole('button', { name: 'Use', exact: true });
      // Always-on king abilities have no arming step.
      if (await use.count()) await use.click();
      else await closeSheet(ui);
    }
    // Shots stay on their source square but still need the piece selected.
    if (card < 0 && move.drop === undefined && (move.from !== move.to || !move.power)) await square(ui, move.from, view.seat);
    await choices(ui);
    await ui.locator(`#choices button[title=${JSON.stringify(lan)}]`).click();
    // A stored-engine preview closes the choice sheet only after its accepted prefix arrives.
    await ui.locator('#board-sheet[open]').waitFor({ state: 'hidden' });
    position = rules.makeMove(position, move);
    await ready(ui);
  }
  await closeSheet(ui);
  await ui.locator('#end-turn[aria-disabled="false"]').click();
}

/** Four focused consumer paths; the complete mechanics matrix below stays separate. */
export async function checkRecoveryConsumers({ browser, origin, actors, pool, tool, tokens, release, recovery, switchOutput }) {
  const { SHARED_MECHANICS, assertMechanicExpected } = await import('../fixtures/shared-mechanics.ts');
  const { DEFAULT_OPTIONS } = await import('../../src/match/setup.ts');
  const { GameRules } = await import('../../src/game-rules.ts');
  const { toLan } = await import('../../src/rules/setup.ts');
  const { cardCoins } = await import('../../src/plugin/screens/board-model.ts');
  const { startHarness } = await import('../plugin-ui-harness.ts');
  const runtime = await import(pathToFileURL(join(release.root, 'functions/mcp.func/runtime/index.mjs')).href);
  const haste = SHARED_MECHANICS.find(row => row.id === 'power-haste');
  assert(haste, 'Recovery reuses the Haste fixture and controls');
  const helper = 'functions/mcp.func/runtime/search-worker.mjs';
  async function identity(output) {
    const checked = await recoveryOutput(output.root);
    checked.hashes[helper] = createHash('sha256').update(await readFile(join(output.root, helper))).digest('hex');
    const worker = await readFile(join(output.root, 'functions/mcp.func/runtime/worker.mjs'), 'utf8');
    const stamps = [...new Set(worker.match(/sha256:[a-f0-9]{64}/g))];
    assert.equal(stamps.length, 1, 'The default worker has one exact implementation stamp');
    return { ...checked, engine: stamps[0] };
  }
  const inputs = { release: await identity(release), recovery: await identity(recovery) };
  const releaseEngine = inputs.release.engine, recoveryEngine = inputs.recovery.engine;
  assert.notEqual(releaseEngine, recoveryEngine, 'Recovery uses a different prior default worker');
  assert.notEqual(inputs.release.hashes['functions/mcp.func/server.mjs'], inputs.recovery.hashes['functions/mcp.func/server.mjs'], 'Recovery switches a distinct server artifact');
  const reports = [];
  // Each real host sets its actor's handle once; separate phase pairs avoid rename cooldowns.
  for (const phase of ['loaded-current', 'fresh-recovery']) for (const surface of ['chatgpt', 'web']) {
    console.log(`START recovery-consumers ${phase} ${surface}`);
    await switchOutput(release, release);
    // Both games originate in the release runtime, including the new-engine recovery client path.
    const actor = phase === 'loaded-current' ? 0 : 2;
    const { id, match } = await seedMechanic(runtime, pool, actors.slice(actor, actor + 2), haste.setup, phase === 'loaded-current' ? recoveryEngine : undefined);
    let context, harness;
    try {
      const players = actors.slice(actor, actor + 2);
      for (const seat of [actor, actor + 1]) {
        const profile = (await pool.query('select handle from public.profiles where id=$1', [actors[seat]])).rows[0];
        if (!profile.handle) await tool(seat, 'kingdown_handle', { handle: `recovery-${actors[seat].slice(0, 8)}` });
      }
      // Use the release creation path: a raw fixture row defaults to Legacy and cannot prove Casual recovery.
      const created = (await tool(actor, 'kingdown_create', { kind: 'friend', mode: 'casual', colour: 'white',
        options: { ...DEFAULT_OPTIONS, fairy: false, arrangement: false, classic: true } }))._meta.view;
      assert.equal(created.rating_policy, 'casual', 'Release creates a new Casual game');
      const invite = await tool(actor, 'kingdown_invite', { game_id: created.game_id });
      const casual = (await tool(actor + 1, 'kingdown_join', { code: invite.structuredContent.code }))._meta.view;
      assert.equal(casual.status, 'playing'); assert.equal(casual.game_id, created.game_id);
      // Missing rating rows have the same initial values that the result transaction inserts.
      const ratings = async () => (await pool.query(`select p.user_id,coalesce(r.rating,1500) as rating,coalesce(r.rd,350) as rd,
        coalesce(r.volatility,0.06) as volatility,r.last_game_at from unnest($1::uuid[]) p(user_id)
        left join public.player_ratings r on r.user_id=p.user_id order by p.user_id`, [players])).rows;
      const ratingsBefore = await ratings();
      const totalsBefore = await Promise.all([actor, actor + 1].map(async seat => (await tool(seat, 'kingdown_profile'))._meta.record.totals));
      const before = (await tool(actor, 'kingdown_get', { game_id: id }))._meta.view;
      const engine = phase === 'loaded-current' ? recoveryEngine : releaseEngine;
      assert.equal(before.engine_fingerprint, engine, `${phase}/${surface}: release-created game identity`);
      const site = phase === 'loaded-current' ? release : recovery;
      if (phase === 'fresh-recovery') await switchOutput(recovery, recovery);
      if (surface === 'chatgpt') harness = await startHarness({ boardPath: join(site.root, 'functions/mcp.func/board.html'), endpoint: new URL('/mcp', origin), actor: actors[actor] });
      context = await browser.newContext({ viewport: { width: 1100, height: 1000 }, reducedMotion: 'reduce' });
      await context.addInitScript(({ origin, actor, token }) => {
        if (location.origin === origin) localStorage.setItem('kingdown.auth', JSON.stringify({ access_token: token, refresh_token: 'local-test-refresh', token_type: 'bearer', expires_in: 600, expires_at: Math.floor(Date.now() / 1000) + 600,
          user: { id: actor, aud: 'authenticated', role: 'authenticated', email: 'recovery@example.invalid', app_metadata: { provider: 'google' }, user_metadata: {}, created_at: new Date().toISOString() } }));
      }, { origin, actor: actors[actor], token: tokens[actor] });
      const failures = [], allowed = new Set([origin, ...(harness ? [new URL(harness.url).origin] : [])]);
      // The real SDK harness serves its sandbox frame on a separate loopback port.
      if (harness) {
        const html = await (await fetch(harness.url)).text(), frame = html.match(/data-src="([^"]+)"/);
        assert(frame, 'The SDK host declares its sandbox resource'); allowed.add(new URL(frame[1]).origin);
      }
      await context.route('**/*', route => {
        if (allowed.has(new URL(route.request().url()).origin)) return route.continue();
        failures.push('External request blocked'); return route.abort();
      });
      const page = await context.newPage(), errors = trapErrors(page);
      page.setDefaultTimeout(15_000);
      const ui = surface === 'web' ? page : page.frameLocator('iframe');
      const previewResponse = actions => page.waitForResponse(response => {
        const request = response.request();
        if (request.method() !== 'POST') return false;
        const input = request.postDataJSON();
        return surface === 'web'
          ? new URL(response.url()).pathname === `/api/games/${id}/preview` && JSON.stringify(input?.actions) === JSON.stringify(actions)
          : new URL(response.url()).pathname === '/fixture-tool' && input?.name === 'kingdown_preview' && input.arguments?.game_id === id && JSON.stringify(input.arguments.actions) === JSON.stringify(actions);
      });
      async function acceptedPreview(pending, actions, fen) {
        const response = await pending, body = await response.json(), draft = surface === 'web' ? body : body._meta?.draft;
        assert.equal(response.status(), 200, `${phase}/${surface}: real preview response`);
        assert.equal(draft?.game_id, id); assert.equal(draft?.revision, before.revision);
        assert.equal(draft?.engine_fingerprint, engine); assert.deepEqual(draft?.actions, actions);
        assert.equal(draft?.positions.at(-1)?.fen, fen);
        return draft;
      }
      if (harness) {
        await page.goto(harness.url);
        await ui.locator('#home-games:not(:disabled)').click();
        await ui.locator('[data-screen="play"]:not([hidden])').waitFor();
      }
      const initial = previewResponse([]); void initial.catch(() => {});
      if (surface === 'web') await page.goto(`${origin}/g/${id}`);
      else {
        const mounted = page.waitForResponse(response => readsGame(response, id)); void mounted.catch(() => {});
        await page.evaluate(result => window.harnessShow(result), await tool(actor, 'kingdown_open', { game_id: id }));
        assert.equal((await (await mounted).json())._meta?.view?.game_id, id);
      }
      await ready(ui); const initialDraft = await acceptedPreview(initial, [], before.fen);
      await ui.locator('#power-w[data-state="ready"]').waitFor();
      const document = await ui.locator('html').elementHandle();
      assert(document, 'The mounted consumer has a document');
      if (phase === 'loaded-current') await switchOutput(recovery, release);
      // Start observers only after the actual switch; the initial preview cannot satisfy them.
      const prefix = previewResponse(haste.actions.slice(0, 1)); void prefix.catch(() => {});
      const committed = page.waitForResponse(response => {
        const request = response.request();
        if (request.method() !== 'POST') return false;
        return surface === 'web' ? new URL(response.url()).pathname === `/api/games/${id}/commands`
          : new URL(response.url()).pathname === '/fixture-tool' && request.postDataJSON()?.name === 'kingdown_move' && request.postDataJSON().arguments?.game_id === id;
      }); void committed.catch(() => {});
      let expected = await match.snapshot(), prefixFen;
      for (const lan of haste.actions) {
        expected = await match.apply({ id: randomUUID(), expectedRevision: expected.revision, lan });
        prefixFen ??= expected.fen;
      }
      await playTurn(ui, before, haste.actions, { GameRules, toLan, cardCoins });
      const prefixDraft = await acceptedPreview(prefix, haste.actions.slice(0, 1), prefixFen);
      const commandResponse = await committed, commandBody = await commandResponse.json();
      assert.equal(commandResponse.status(), 200); assert(!commandBody.isError, 'Recovery accepts the consumer command');
      assert(await document.evaluate(element => element.isConnected && element.ownerDocument.documentElement === element), 'The same loaded document continues across the backend switch');
      const after = (await tool(actor + 1, 'kingdown_get', { game_id: id }))._meta.view;
      assert.equal(after.game_id, id); assert.equal(after.engine_fingerprint, engine); assert.equal(after.revision, before.revision + 1);
      assert.deepEqual(after.rules, before.rules); assert.equal(after.fen, expected.fen); assert.equal(after.turn, expected.turn);
      assert.deepEqual([...after.legal].sort(), [...expected.legal].sort()); assert.deepEqual(after.history.actions, haste.actions);
      assertMechanicExpected(after, haste.expected, `${phase}/${surface}`);
      const reloaded = page.waitForResponse(response => surface === 'web' ? response.request().method() === 'GET' && new URL(response.url()).pathname === `/api/games/${id}` : readsGame(response, id));
      void reloaded.catch(() => {});
      if (surface === 'web') await page.reload(); else await page.locator('#remount').click();
      const reloadResponse = await reloaded; assert.equal(reloadResponse.status(), 200);
      await ready(ui);
      const resumed = (await tool(actor + 1, 'kingdown_get', { game_id: id }))._meta.view;
      assert.equal(resumed.engine_fingerprint, engine); assert.equal(resumed.game_id, id); assert.equal(resumed.revision, after.revision);
      assert.equal(resumed.fen, after.fen); assert.deepEqual(resumed.history.actions, haste.actions);
      await ui.locator('#moves-line').click();
      await ui.locator('#board-sheet[open]').getByRole('heading', { name: 'Moves', exact: true }).waitFor();
      assert.equal(await ui.locator('#board-sheet p').count(), haste.actions.length, 'Reloaded consumer shows the accepted history');
      const commands = (await pool.query("select surface, actions from public.game_commands where game_id=$1 and kind='turn' order by seq", [id])).rows;
      assert.deepEqual(commands, [{ surface, actions: haste.actions }], 'One complete turn uses the real consumer transport');
      if (harness) {
        const { states, bases } = await page.evaluate(() => ({ states: window.harnessWidgetStates, bases: window.harnessDraftBases }));
        for (const state of states) checkWidgetState(state, bases);
      }
      const recoveredCasual = (await tool(actor + 1, 'kingdown_get', { game_id: casual.game_id }))._meta.view;
      assert.equal(recoveredCasual.engine_fingerprint, casual.engine_fingerprint);
      assert.equal(recoveredCasual.fen, casual.fen); assert.deepEqual(recoveredCasual.history, casual.history);
      const resign = { game_id: casual.game_id, command_id: randomUUID(), expected_revision: casual.revision };
      let finished;
      if (surface === 'web') {
        const response = await fetch(`${origin}/api/games/${casual.game_id}/commands`, { method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens[actor + 1]}` },
          body: JSON.stringify({ command_id: resign.command_id, expected_revision: resign.expected_revision, action: { type: 'resign' } }) });
        assert.equal(response.status, 200, 'Recovery accepts the real web Casual finish');
        finished = await response.json();
      } else finished = (await tool(actor + 1, 'kingdown_resign', resign))._meta.view;
      assert.equal(finished.status, 'finished'); assert.deepEqual(finished.result, { winner: 0, reason: 'resignation' });
      const stored = (await pool.query('select rating_policy,status from public.games where id=$1', [casual.game_id])).rows[0];
      assert.deepEqual(stored, { rating_policy: 'casual', status: 'finished' });
      const ratingHistory = (await pool.query('select game_id from public.rating_history where game_id=$1', [casual.game_id])).rows;
      assert.deepEqual(ratingHistory, [], 'Recovery must not rate a release-created Casual result');
      const ratingsAfter = await ratings();
      assert.deepEqual(ratingsAfter, ratingsBefore, 'A Casual finish changes no stored rating value or last rated date');
      for (const [index, seat] of [actor, actor + 1].entries()) {
        const profile = (await tool(seat, 'kingdown_profile'))._meta, prior = totalsBefore[index];
        assert.deepEqual(profile.record.totals, { played: prior.played + 1, won: prior.won + Number(index === 0), drawn: prior.drawn, lost: prior.lost + Number(index === 1) });
        const history = profile.history.find(game => game.game_id === casual.game_id);
        assert(history, 'Recovery keeps the Casual result in account history');
        assert.equal(history.rating_policy, 'casual'); assert.equal(history.result, index === 0 ? 'won' : 'lost');
      }
      assert.deepEqual((await pool.query("select surface from public.game_commands where game_id=$1 and kind='resign'", [casual.game_id])).rows,
        [{ surface }], 'The Casual result uses the selected recovery transport');
      assertNoErrors(errors); assert.deepEqual(failures, []);
      reports.push({ phase, surface, game_id: id, engine, ui_engine: phase === 'loaded-current' ? releaseEngine : recoveryEngine,
        initial_backend: inputs[phase === 'loaded-current' ? 'release' : 'recovery'].hashes['functions/mcp.func/server.mjs'],
        continuation_backend: inputs.recovery.hashes['functions/mcp.func/server.mjs'], same_document: true,
        initial_preview: initialDraft, prefix_preview: prefixDraft, revision: resumed.revision, fen: resumed.fen, history: resumed.history.actions, commands,
        casual: { game_id: casual.game_id, rating_policy: stored.rating_policy, result: finished.result, rating_history: ratingHistory, ratings_before: ratingsBefore, ratings_after: ratingsAfter } });
      console.log(`PASS recovery-consumers ${phase} ${surface}`);
    } finally { await context?.close(); await harness?.close(); await match.close(); }
  }
  assert.deepEqual(await identity(release), inputs.release, 'Release artifact remains unchanged');
  assert.deepEqual(await identity(recovery), inputs.recovery, 'Recovery artifact remains unchanged');
  await mkdir(env('PLAYABLE_OUT'), { recursive: true });
  await writeFile(join(env('PLAYABLE_OUT'), 'recovery-consumers.json'), JSON.stringify({ inputs, reports }, null, 2));
}

export async function checkSharedMechanics({ browser, context, root, origin, actors, pool, tool, tokens }) {
  const { SHARED_MECHANICS, assertMechanicExpected } = await import('../fixtures/shared-mechanics.ts');
  const { GameRules } = await import('../../src/game-rules.ts');
  const { toLan } = await import('../../src/rules/setup.ts');
  const { cardCoins } = await import('../../src/plugin/screens/board-model.ts');
  const { startHarness } = await import('../plugin-ui-harness.ts');
  const runtime = await import(pathToFileURL(join(root, 'functions/mcp.func/runtime/index.mjs')).href);
  const haste = SHARED_MECHANICS.find(row => row.id === 'power-haste');
  assert(haste, 'The archived continuation reuses the Haste fixture');
  const rows = [...SHARED_MECHANICS, { ...haste, id: 'archived-power-haste', engine: 'sha256:bab22e94d4df81591374763a7f3abe703c30534f80ce771ee3fe7e095dcec7da' }];
  const harnesses = [], contexts = [], reports = [], failures = [];
  const read = async (seat, id) => (await tool(seat, 'kingdown_get', { game_id: id }))._meta.view;
  try {
    const webPages = [await context.newPage()];
    const black = await browser.newContext({ viewport: { width: 1100, height: 1000 }, reducedMotion: 'reduce' }); contexts.push(black);
    await black.addInitScript(({ origin, token, actor }) => {
      if (location.origin === origin) localStorage.setItem('kingdown.auth', JSON.stringify({ access_token: token, refresh_token: 'local-test-refresh', token_type: 'bearer', expires_in: 600, expires_at: Math.floor(Date.now() / 1000) + 600,
        user: { id: actor, aud: 'authenticated', role: 'authenticated', email: 'matrix@example.invalid', app_metadata: { provider: 'google' }, user_metadata: {}, created_at: new Date().toISOString() } }));
    }, { origin, token: tokens[1], actor: actors[1] });
    await black.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    webPages.push(await black.newPage());
    const pluginPages = [];
    for (const seat of [0, 1]) {
      const harness = await startHarness({ boardPath: join(root, 'functions/mcp.func/board.html'), endpoint: new URL('/mcp', origin), actor: actors[seat] });
      harnesses.push(harness);
      const pluginContext = await browser.newContext({ viewport: { width: 1100, height: 1000 }, reducedMotion: 'reduce' }); contexts.push(pluginContext);
      const page = await pluginContext.newPage(); pluginPages.push(page);
      await page.goto(harness.url);
      const ui = page.frameLocator('iframe');
      await ui.locator('#home-play:not(:disabled)').waitFor();
      // Inline hosts keep the board behind Home until the host opens its full game surface.
      await ui.getByRole('button', { name: 'Choose a game', exact: true }).click();
      await ui.locator('[data-screen="play"]:not([hidden])').waitFor();
    }
    for (const page of [...webPages, ...pluginPages]) {
      page.setDefaultTimeout(15_000); failures.push(trapErrors(page));
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const installTrace = () => {
        if (window.__mechanicsRouteTrace) return;
        const entries = [], record = entry => {
          entries.push({ path: location.pathname, screen: document.body?.dataset.page, ...entry });
          if (entries.length > 20) entries.shift();
        };
        window.__mechanicsRouteTrace = { entries, record };
        for (const method of ['pushState', 'replaceState']) {
          const original = history[method];
          history[method] = function(state, unused, url) {
            const stack = new Error().stack?.split('\n').slice(1, 7).join('\n').replace(/\?[^)\s]*/g, '').slice(0, 1600);
            record({ event: method, to: new URL(url ?? location.href, location.href).pathname, stack });
            return original.apply(this, arguments);
          };
        }
        document.addEventListener('click', event => {
          const target = event.target instanceof Element ? event.target.closest('button,a,input,canvas') ?? event.target : undefined;
          if (target) record({ event: 'click', tag: target.tagName, id: target.id.slice(0, 80), label: (target.getAttribute('aria-label') ?? target.getAttribute('title') ?? target.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 80) });
        }, true);
      };
      await page.addInitScript(installTrace);
      for (const frame of page.frames()) await frame.evaluate(installTrace);
    }
    for (const row of rows) {
      const states = [];
      for (const surface of ['web', 'chatgpt']) {
        console.log(`START shared-mechanics ${row.id} ${surface}`);
        const { id, match } = await seedMechanic(runtime, pool, actors, row.setup, row.engine);
        try {
          let expected = await match.snapshot(), applied = [], finalSeat = expected.turn;
          const turns = row.turns ?? [row.actions];
          for (const actions of turns) {
            const seat = expected.turn, before = await read(seat, id), page = (surface === 'web' ? webPages : pluginPages)[seat];
            finalSeat = seat;
            const ui = surface === 'web' ? page : page.frameLocator('iframe');
            const previewed = row.engine && page.waitForResponse(response => {
              const request = response.request();
              if (request.method() !== 'POST') return false;
              const input = request.postDataJSON();
              return surface === 'web'
                ? new URL(response.url()).pathname === `/api/games/${id}/preview` && input?.actions?.length === 0
                : new URL(response.url()).pathname === '/fixture-tool' && input?.name === 'kingdown_preview' && input.arguments?.game_id === id && input.arguments?.actions?.length === 0;
            });
            if (previewed) void previewed.catch(() => {});
            if (surface === 'web') await page.goto(`${origin}/g/${id}`);
            else {
              const mounted = page.waitForResponse(response => readsGame(response, id));
              await page.evaluate(result => window.harnessShow(result), await tool(seat, 'kingdown_open', { game_id: id }));
              assert.equal((await (await mounted).json())._meta?.view?.game_id, id, `${row.id}: the mounted board reads the selected game`);
            }
            try { await ready(ui); }
            catch (error) {
              await shot(page, `shared-mechanics-${row.id}-${surface}-mount-failure`);
              console.error(`${row.id}/${surface} mount: ${await ui.locator('body').innerText()}`);
              console.error(`${row.id}/${surface} routes: ${JSON.stringify(await routeTrace(ui))}`);
              throw error;
            }
            if (previewed) {
              const response = await previewed, body = await response.json(), preview = surface === 'web' ? body : body._meta?.draft;
              assert.equal(response.status(), 200, `${row.id}/${surface}: stored-engine preview response`);
              assert.equal(preview?.engine_fingerprint, row.engine, `${row.id}/${surface}: preview uses the retained archive`);
              assert.equal(preview?.revision, before.revision, `${row.id}/${surface}: preview uses the current base`);
              assert.equal(preview?.positions[0]?.fen, before.fen, `${row.id}/${surface}: preview starts at the accepted board`);
              await ui.locator(`#power-${seat ? 'b' : 'w'}[data-state="ready"]`).waitFor();
            }
            const committed = page.waitForResponse(response => {
              const request = response.request();
              if (request.method() !== 'POST') return false;
              if (surface === 'web') return new URL(response.url()).pathname === `/api/games/${id}/commands`;
              return new URL(response.url()).pathname === '/fixture-tool' && request.postDataJSON()?.name === 'kingdown_move';
            });
            // Report the failed interaction, rather than an unhandled response wait while it is in flight.
            void committed.catch(() => {});
            try { await playTurn(ui, before, actions, { GameRules, toLan, cardCoins }); }
            catch (error) {
              await shot(page, `shared-mechanics-${row.id}-${surface}-failure`);
              console.error(`${row.id}/${surface}: ${await ui.locator('body').innerText()}`);
              console.error(`${row.id}/${surface} routes: ${JSON.stringify(await routeTrace(ui))}`);
              throw error;
            }
            assert.equal((await committed).status(), 200, `${row.id}/${surface}: command response`);
            for (const lan of actions) expected = await match.apply({ id: randomUUID(), expectedRevision: expected.revision, lan });
            applied.push(...actions);
            const after = await read(expected.turn, id);
            assert.equal(after.revision, before.revision + 1, `${row.id}/${surface}: one committed turn`);
            assert.equal(after.fen, expected.fen, `${row.id}/${surface}: authoritative state`);
            assert.equal(after.turn, expected.turn, `${row.id}/${surface}: next actor`);
            assert.equal(after.status, expected.status === 'playing' ? 'playing' : 'finished', `${row.id}/${surface}: game status`);
            assert.deepEqual(after.result, expected.status === 'playing' ? undefined : { winner: expected.status === 'checkmate' ? 1 - expected.turn : null, reason: expected.status }, `${row.id}/${surface}: result`);
            assert.deepEqual([...after.legal].sort(), [...expected.legal].sort(), `${row.id}/${surface}: legal continuation`);
            assert.deepEqual(after.history.actions, applied, `${row.id}/${surface}: accepted history`);
            assert.deepEqual(after.last_commands.at(-1).action, { type: 'turn', actions }, `${row.id}/${surface}: complete command`);
            for (const checkpoint of row.checkpoints ?? []) if (checkpoint.after === applied.length) assertMechanicExpected(after, checkpoint.expected, `${row.id}/${surface} checkpoint`);
          }
          const page = (surface === 'web' ? webPages : pluginPages)[finalSeat], ui = surface === 'web' ? page : page.frameLocator('iframe');
          const beforeRoutes = await routeTrace(ui);
          const beforeUrl = new URL(page.url()), network = [];
          const record = event => { network.push(event); if (network.length > 20) network.shift(); };
          const responseEvent = response => {
            const url = new URL(response.url()), request = response.request();
            if (url.origin === beforeUrl.origin && (response.status() >= 400 || url.pathname.startsWith('/api/') || url.pathname === '/fixture-tool' || request.resourceType() === 'document')) {
              const event = { event: 'response', method: request.method(), path: url.pathname, status: response.status() };
              record(event);
              if (url.pathname === '/api/status') void response.json().then(status => {
                event.public_status = {
                  account_access: ['open', 'closed'].includes(status?.account_access) ? status.account_access : 'invalid',
                  valid_for_ms: Number.isInteger(status?.valid_for_ms) && status.valid_for_ms >= 0 && status.valid_for_ms <= 5000 ? status.valid_for_ms : 'invalid',
                };
                event.elapsed_ms = Math.round(request.timing().responseEnd);
              }).catch(() => { event.public_status = 'unavailable'; });
            }
          };
          const failedEvent = request => {
            const url = new URL(request.url());
            if (url.origin === beforeUrl.origin) record({ event: 'requestfailed', method: request.method(), path: url.pathname });
          };
          page.on('response', responseEvent); page.on('requestfailed', failedEvent);
          try {
            const reloaded = page.waitForResponse(response => {
              if (surface === 'web') return response.request().method() === 'GET' && new URL(response.url()).pathname === `/api/games/${id}`;
              return readsGame(response, id);
            });
            // Capture reload failures even if the observer rejects before reload itself returns.
            void reloaded.catch(() => {});
            if (surface === 'web') await page.reload(); else await page.locator('#remount').click();
            const reloadResponse = await reloaded;
            assert.equal(reloadResponse.status(), 200, `${row.id}/${surface}: reload reads the service`);
            if (surface === 'chatgpt') assert.equal((await reloadResponse.json())._meta?.view?.game_id, id, `${row.id}: the remounted board reads the selected game`);
            await ready(ui, expected.status !== 'playing');
          } catch (error) {
            const afterUrl = new URL(page.url());
            const [body, screenshot] = await Promise.allSettled([
              ui.locator('body').innerText({ timeout: 2000 }),
              shot(page, `shared-mechanics-${row.id}-${surface}-reload-failure`),
            ]);
            const errors = failures[[...webPages, ...pluginPages].indexOf(page)];
            console.error(`${row.id}/${surface} reload: ${JSON.stringify({
              beforeUrl: beforeUrl.origin + beforeUrl.pathname, afterUrl: afterUrl.origin + afterUrl.pathname,
              body: body.status === 'fulfilled' ? body.value.slice(0, 4000) : 'unavailable',
              screenshot: screenshot.status === 'fulfilled' ? screenshot.value : 'unavailable',
              errors: errors.slice(-10).map(value => value.slice(0, 2000)), network,
              beforeRoutes, afterRoutes: await routeTrace(ui),
            })}`);
            throw error;
          } finally {
            page.off('response', responseEvent); page.off('requestfailed', failedEvent);
          }
          const resumed = await read(expected.turn, id);
          assert.equal(resumed.fen, expected.fen, `${row.id}/${surface}: reload state`);
          assert.equal(resumed.turn, expected.turn, `${row.id}/${surface}: reload actor`);
          assert.equal(resumed.status, expected.status === 'playing' ? 'playing' : 'finished', `${row.id}/${surface}: reload status`);
          assert.deepEqual(resumed.result, expected.status === 'playing' ? undefined : { winner: expected.status === 'checkmate' ? 1 - expected.turn : null, reason: expected.status }, `${row.id}/${surface}: reload result`);
          assert.deepEqual(resumed.history.actions, row.actions, `${row.id}/${surface}: reload history`);
          assertMechanicExpected(resumed, row.expected, `${row.id}/${surface}`);
          const commands = (await pool.query("select surface, actions from public.game_commands where game_id=$1 and kind='turn' order by seq", [id])).rows;
          assert.deepEqual(commands.map(command => command.surface), turns.map(() => surface), `${row.id}/${surface}: real transport`);
          assert.deepEqual(commands.map(command => command.actions), turns, `${row.id}/${surface}: saved complete turns`);
          await ui.locator('#moves-line').click();
          await ui.locator('#board-sheet[open]').getByRole('heading', { name: 'Moves', exact: true }).waitFor();
          assert.equal(await ui.locator('#board-sheet p').count(), row.actions.length, `${row.id}/${surface}: reloaded UI history`);
          await closeSheet(ui);
          states.push({ fen: resumed.fen, turn: resumed.turn, history: resumed.history.actions, status: resumed.status, result: resumed.result });
          reports.push({ id: row.id, surface, game_id: id, revision: resumed.revision, ...(row.engine && { engine: row.engine, server_preview: true }), ...states.at(-1) });
          failures.forEach(assertNoErrors);
          if (row.id === 'promotion-darkness') console.log(`${row.id}/${surface} accepted routes: ${JSON.stringify({ beforeUrl: beforeUrl.origin + beforeUrl.pathname, beforeRoutes })}`);
          console.log(`PASS shared-mechanics ${row.id} ${surface}`);
        } finally { await match.close(); }
      }
      assert.deepEqual(states[0], states[1], `${row.id}: both surfaces agree`);
    }
    for (const page of pluginPages) {
      const { states, bases } = await page.evaluate(() => ({ states: window.harnessWidgetStates, bases: window.harnessDraftBases }));
      for (const state of states) checkWidgetState(state, bases);
    }
    failures.forEach(assertNoErrors);
    await mkdir(env('PLAYABLE_OUT'), { recursive: true });
    await writeFile(join(env('PLAYABLE_OUT'), 'shared-mechanics.json'), JSON.stringify({ cases: rows.length, mechanics_cases: SHARED_MECHANICS.length, archived_cases: rows.length - SHARED_MECHANICS.length, reports }, null, 2));
  } finally {
    for (const context of contexts) await context.close();
    for (const harness of harnesses) await harness.close();
  }
}
