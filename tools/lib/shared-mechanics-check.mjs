/** The same real board controls against emitted web and MCP AppBridge builds. */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { assertNoErrors, env, shot, trapErrors } from './checks.mjs';
import { checkWidgetState } from './plugin-widget-state-check.mjs';

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

async function routeTrace(ui, phase) {
  return ui.locator('body').evaluate((body, phase) => {
    const trace = body.ownerDocument.defaultView.__mechanicsRouteTrace;
    if (phase) trace?.record({ event: 'phase', phase });
    return trace?.entries ?? [];
  }, phase, { timeout: 2000 }).catch(() => []);
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
    position = rules.makeMove(position, move);
    await ready(ui);
    await routeTrace(ui, 'staged');
  }
  await closeSheet(ui);
  await routeTrace(ui, 'send-turn');
  await ui.locator('#end-turn[aria-disabled="false"]').click();
}

export async function checkSharedMechanics({ browser, context, root, origin, actors, pool, tool, tokens }) {
  const { SHARED_MECHANICS, assertMechanicExpected } = await import('../fixtures/shared-mechanics.ts');
  const { GameRules } = await import('../../src/game-rules.ts');
  const { toLan } = await import('../../src/rules/setup.ts');
  const { cardCoins } = await import('../../src/plugin/screens/board-model.ts');
  const { startHarness } = await import('../plugin-ui-harness.ts');
  const { createMatch, createPinnedMatch } = await import(pathToFileURL(join(root, 'functions/mcp.func/runtime/index.mjs')).href);
  const haste = SHARED_MECHANICS.find(row => row.id === 'power-haste');
  assert(haste, 'The archived continuation reuses the Haste fixture');
  const rows = [...SHARED_MECHANICS, { ...haste, id: 'archived-power-haste', engine: 'sha256:bab22e94d4df81591374763a7f3abe703c30534f80ce771ee3fe7e095dcec7da' }];
  const harnesses = [], contexts = [], reports = [], failures = [];
  const read = async (seat, id) => (await tool(seat, 'kingdown_get', { game_id: id }))._meta.view;
  async function seed(setup, engine) {
    const match = engine ? await createPinnedMatch(setup, engine) : await createMatch(setup), id = randomUUID();
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
        const { id, match } = await seed(row.setup, row.engine);
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
            try { await ready(ui); await routeTrace(ui, 'mounted'); }
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
            await routeTrace(ui, 'committed');
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
          const beforeRoutes = await routeTrace(ui, 'before-reload');
          const beforeUrl = new URL(page.url()), network = [];
          const record = event => { network.push(event); if (network.length > 20) network.shift(); };
          const responseEvent = response => {
            const url = new URL(response.url()), request = response.request();
            if (url.origin === beforeUrl.origin && (response.status() >= 400 || url.pathname.startsWith('/api/') || url.pathname === '/fixture-tool' || request.resourceType() === 'document'))
              record({ event: 'response', method: request.method(), path: url.pathname, status: response.status() });
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
