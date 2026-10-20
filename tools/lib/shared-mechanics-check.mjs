/** The same real board controls against emitted web and MCP AppBridge builds. */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { assertNoErrors, env, shot, trapErrors } from './checks.mjs';
import { checkWidgetState } from './plugin-widget-state-check.mjs';

async function ready(ui) {
  await ui.locator('[data-screen="board"]:not([hidden])').waitFor();
  await ui.locator('#board[aria-busy="false"]:not([data-animating="true"])').waitFor();
  await ui.locator('#board-menu:not(:disabled)').waitFor();
}

async function closeSheet(ui) {
  const close = ui.locator('#board-sheet[open] [aria-label="Close"]');
  if (await close.count()) await close.click();
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
  }
  await closeSheet(ui);
  await ui.locator('#end-turn[aria-disabled="false"]').click();
}

export async function checkSharedMechanics({ browser, context, root, origin, actors, pool, tool, tokens }) {
  const { SHARED_MECHANICS, assertMechanicExpected } = await import('../fixtures/shared-mechanics.ts');
  const { GameRules } = await import('../../src/game-rules.ts');
  const { toLan } = await import('../../src/rules/setup.ts');
  const { cardCoins } = await import('../../src/plugin/screens/board-model.ts');
  const { startHarness } = await import('../plugin-ui-harness.ts');
  const { createMatch } = await import(pathToFileURL(join(root, 'functions/mcp.func/runtime/index.mjs')).href);
  const harnesses = [], contexts = [], reports = [], failures = [];
  const read = async (seat, id) => (await tool(seat, 'kingdown_get', { game_id: id }))._meta.view;
  async function seed(setup) {
    const match = await createMatch(setup), id = randomUUID();
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
    }
    for (const row of SHARED_MECHANICS) {
      const states = [];
      for (const surface of ['web', 'chatgpt']) {
        console.log(`START shared-mechanics ${row.id} ${surface}`);
        const { id, match } = await seed(row.setup);
        try {
          let expected = await match.snapshot(), applied = [], finalSeat = expected.turn;
          const turns = row.turns ?? [row.actions];
          for (const actions of turns) {
            const seat = expected.turn, before = await read(seat, id), page = (surface === 'web' ? webPages : pluginPages)[seat];
            finalSeat = seat;
            const ui = surface === 'web' ? page : page.frameLocator('iframe');
            if (surface === 'web') await page.goto(`${origin}/g/${id}`);
            else {
              const mounted = page.waitForResponse(response => new URL(response.url()).pathname === '/fixture-tool' && response.request().postDataJSON()?.name === 'kingdown_get');
              await page.evaluate(result => window.harnessShow(result), await tool(seat, 'kingdown_open', { game_id: id }));
              assert.equal((await (await mounted).json())._meta?.view?.game_id, id, `${row.id}: the mounted board reads the selected game`);
            }
            try { await ready(ui); }
            catch (error) {
              await shot(page, `shared-mechanics-${row.id}-${surface}-mount-failure`);
              console.error(`${row.id}/${surface} mount: ${await ui.locator('body').innerText()}`);
              throw error;
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
              throw error;
            }
            assert.equal((await committed).status(), 200, `${row.id}/${surface}: command response`);
            for (const lan of actions) expected = await match.apply({ id: randomUUID(), expectedRevision: expected.revision, lan });
            applied.push(...actions);
            const after = await read(expected.turn, id);
            assert.equal(after.revision, before.revision + 1, `${row.id}/${surface}: one committed turn`);
            assert.equal(after.fen, expected.fen, `${row.id}/${surface}: authoritative state`);
            assert.equal(after.turn, expected.turn, `${row.id}/${surface}: next actor`);
            assert.deepEqual([...after.legal].sort(), [...expected.legal].sort(), `${row.id}/${surface}: legal continuation`);
            assert.deepEqual(after.history.actions, applied, `${row.id}/${surface}: accepted history`);
            assert.deepEqual(after.last_commands.at(-1).action, { type: 'turn', actions }, `${row.id}/${surface}: complete command`);
            for (const checkpoint of row.checkpoints ?? []) if (checkpoint.after === applied.length) assertMechanicExpected(after, checkpoint.expected, `${row.id}/${surface} checkpoint`);
          }
          const page = (surface === 'web' ? webPages : pluginPages)[finalSeat], ui = surface === 'web' ? page : page.frameLocator('iframe');
          const reloaded = page.waitForResponse(response => {
            if (surface === 'web') return response.request().method() === 'GET' && new URL(response.url()).pathname === `/api/games/${id}`;
            return new URL(response.url()).pathname === '/fixture-tool' && response.request().postDataJSON()?.name === 'kingdown_get';
          });
          if (surface === 'web') await page.reload(); else await page.locator('#remount').click();
          assert.equal((await reloaded).status(), 200, `${row.id}/${surface}: reload reads the service`);
          await ready(ui);
          const resumed = await read(expected.turn, id);
          assert.equal(resumed.fen, expected.fen, `${row.id}/${surface}: reload state`);
          assert.deepEqual(resumed.history.actions, row.actions, `${row.id}/${surface}: reload history`);
          assertMechanicExpected(resumed, row.expected, `${row.id}/${surface}`);
          const commands = (await pool.query("select surface, actions from public.game_commands where game_id=$1 and kind='turn' order by seq", [id])).rows;
          assert.deepEqual(commands.map(command => command.surface), turns.map(() => surface), `${row.id}/${surface}: real transport`);
          assert.deepEqual(commands.map(command => command.actions), turns, `${row.id}/${surface}: saved complete turns`);
          await ui.locator('#board-menu').click();
          await ui.locator('#board-sheet').getByRole('button', { name: 'Moves', exact: true }).click();
          assert.equal(await ui.locator('#board-sheet p').count(), row.actions.length, `${row.id}/${surface}: reloaded UI history`);
          await closeSheet(ui);
          states.push({ fen: resumed.fen, turn: resumed.turn, history: resumed.history.actions });
          reports.push({ id: row.id, surface, game_id: id, revision: resumed.revision, ...states.at(-1) });
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
    await writeFile(join(env('PLAYABLE_OUT'), 'shared-mechanics.json'), JSON.stringify({ cases: SHARED_MECHANICS.length, reports }, null, 2));
  } finally {
    for (const context of contexts) await context.close();
    for (const harness of harnesses) await harness.close();
  }
}
