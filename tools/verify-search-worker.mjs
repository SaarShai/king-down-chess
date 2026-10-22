// U04: compile the real Game, Engine and browser worker, then inspect their ownership and turns.
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { build, preview } from 'vite';
import { assertNoErrors, env, launch, trapErrors } from './lib/checks.mjs';

const out = await mkdtemp(join(tmpdir(), 'kingdown-search-worker-'));
let server, browser;
try {
  await build({ configFile: false, envDir: false, publicDir: false, worker: { format: 'es' },
    build: { outDir: out, emptyOutDir: true, rolldownOptions: { input: resolve('tools/search-worker.html') } } });
  server = await preview({ configFile: false, root: process.cwd(), publicDir: false, build: { outDir: out }, preview: { host: '127.0.0.1', port: 0 } });
  browser = await launch();
  const page = await browser.newPage();
  trapErrors(page);
  await page.goto(`${server.resolvedUrls.local[0]}tools/search-worker.html`);
  await page.waitForFunction(() => window.searchProbe);

  const retention = await page.evaluate(async () => {
    const { Game, Engine, DEFAULT_RULES, RULES_2017, toLan } = window.searchProbe;
    const configs = [DEFAULT_RULES, RULES_2017], opts = { maxDepth: 3 };
    const run = async (engine, game) => {
      const result = await engine.think(game, opts);
      return { ...result, move: result.move && toLan(game.pos, result.move) };
    };
    const fresh = [];
    for (const rules of configs) {
      const engine = new Engine(), game = new Game('RALSKMOG', rules);
      fresh.push([await run(engine, game), await run(engine, game)]);
    }
    const engines = configs.map(() => new Engine()), games = configs.map(rules => new Game('RALSKMOG', rules));
    const interleaved = [];
    for (const index of [0, 1, 0, 1]) interleaved.push(await run(engines[index], games[index]));
    const shared = new Engine(), switched = [];
    for (const index of [0, 1, 0, 1]) switched.push(await run(shared, games[index]));
    const beforeReset = games[0].identity;
    games[0].newGame('RALSKMOG');
    const reset = await run(engines[0], games[0]);
    return { fresh, interleaved, switched, reset, identityChanged: beforeReset !== games[0].identity };
  });
  assert.deepEqual(retention.fresh.map(pair => pair[0].move), ['c2-c3', 'Mf1<>g1'], 'compiled workers use their own current/2017 rules');
  assert.deepEqual(retention.interleaved, [retention.fresh[0][0], retention.fresh[1][0], retention.fresh[0][1], retention.fresh[1][1]], 'interleaved game workers match independent warm workers exactly');
  assert.deepEqual(retention.switched, [0, 1, 0, 1].map(index => retention.fresh[index][0]), 'one Engine replaces its worker when the game changes');
  assert.ok(retention.fresh.every(([cold, warm]) => warm.nodes < cold.nodes), 'each game retains its warm search state');
  assert.ok(retention.identityChanged, 'newGame starts a new search lifetime');
  assert.deepEqual(retention.reset, retention.fresh[0][0], 'newGame has fresh tables with identical rules');
  console.log('ok compiled search: separate and interleaved current/2017 workers, warm state, game switches and newGame');

  const turns = await page.evaluate(async () => {
    const { Game, Engine, DEFAULT_RULES, parseKings, fromFen, toLan, toFen, events } = window.searchProbe;
    const fixtures = [
      { name: 'Haste', rules: { ...DEFAULT_RULES, kings: parseKings('flame:haste,none') }, fen: '7k/8/8/r3r3/8/8/8/R5K1 w - - 0 1', first: 'Ra1xa5!H' },
      { name: 'free Freeze', rules: { ...DEFAULT_RULES, kings: parseKings('frost:freeze,none'), markFree: true }, fen: '4k3/p7/8/3n4/8/8/P7/4K3 w - - 0 1', first: '!F:d5' },
    ];
    const run = async (fixture, distract) => {
      const game = new Game(undefined, fixture.rules), engine = new Engine();
      game.load(fromFen(fixture.fen));
      const start = events.length, actions = [];
      for (let index = 0; index < 2; index++) {
        if (distract) await distract();
        const rootMoves = index === 0 ? game.legal.filter(move => toLan(game.pos, move) === fixture.first) : undefined;
        if (index === 0 && rootMoves.length !== 1) throw new Error(`Missing first action: ${fixture.first}`);
        const opts = { timeMs: 1000, maxDepth: 2, ...(rootMoves ? { rootMoves } : {}) };
        const turn = game.pos.turn, result = await engine.think(game, opts);
        if (!result.move || !game.legal.some(move => JSON.stringify(move) === JSON.stringify(result.move))) throw new Error('Worker returned an illegal action');
        game.play(result.move);
        actions.push({ lan: game.history.at(-1).lan, before: turn, after: game.pos.turn, depth: result.depth, score: result.score, nodes: result.nodes, fen: toFen(game.pos) });
      }
      const requests = events.slice(start).filter(event => event.kind === 'request' && event.data.opts.timeMs === 1000).map(event => ({ worker: event.worker, opts: event.data.opts }));
      return { name: fixture.name, actions, requests, history: game.history.map(row => row.lan) };
    };
    const distractionGame = new Game('RALSKMOG', { ...DEFAULT_RULES, ...window.searchProbe.RULES_2017 }), distractionEngine = new Engine();
    const distraction = () => distractionEngine.think(distractionGame, { maxDepth: 3 });
    const independent = [], interleaved = [];
    for (const fixture of fixtures) independent.push(await run(fixture));
    for (const fixture of fixtures) interleaved.push(await run(fixture, distraction));
    return { independent, interleaved };
  });
  for (let i = 0; i < turns.independent.length; i++) {
    const solo = turns.independent[i], mixed = turns.interleaved[i];
    assert.deepEqual(mixed.actions, solo.actions, `${solo.name}: interleaving preserves each action's result and node count`);
    assert.deepEqual(mixed.history, solo.history, `${solo.name}: accepted history preserves action order`);
    assert.equal(solo.actions[0].before, solo.actions[0].after, `${solo.name}: the first action holds the turn`);
    assert.notEqual(solo.actions[1].before, solo.actions[1].after, `${solo.name}: the second action completes the turn`);
    for (const turn of [solo, mixed]) {
      assert.equal(turn.requests.length, 2, `${turn.name}: one search for each action`);
      assert.equal(new Set(turn.requests.map(request => request.worker)).size, 1, `${turn.name}: both actions reuse the same worker`);
      assert.deepEqual(turn.requests.map(request => [request.opts.timeMs, request.opts.maxDepth]), [[1000, 2], [1000, 2]], `${turn.name}: every action receives its full budget`);
    }
  }
  assert.deepEqual(turns.independent[0].history, ['Ra1xa5!H', 'Ra5xe5'], 'the computer commits both Haste actions in order');
  assert.equal(turns.independent[1].history[0], '!F:d5', 'the computer commits its free mark before its move');
  console.log('ok compiled held turns: Haste and free Freeze preserve action budgets, warm worker and accepted order');

  const cancellation = await page.evaluate(async () => {
    const { Game, Engine, DEFAULT_RULES, RULES_2017, toLan, events } = window.searchProbe;
    const engine = new Engine(), game = new Game('RALSKMOG', DEFAULT_RULES);
    await engine.think(game, { maxDepth: 1 }); // The worker is ready before cancellation interrupts a long search.
    let answered = false;
    const start = events.length;
    void engine.think(game, { timeMs: 30000 }).then(() => { answered = true; });
    await new Promise(resolve => setTimeout(resolve, 30));
    engine.cancel();
    const next = new Game('RALSKMOG', RULES_2017), result = await engine.think(next, { maxDepth: 3 });
    await new Promise(resolve => setTimeout(resolve, 30));
    return { answered, result: { ...result, move: result.move && toLan(next.pos, result.move) }, events: events.slice(start) };
  });
  assert.equal(cancellation.answered, false, 'a cancelled search never resolves');
  assert.deepEqual(cancellation.result, retention.fresh[1][0], 'replacement search matches a fresh worker');
  const cancelled = cancellation.events.find(event => event.kind === 'request').worker;
  assert.ok(cancellation.events.some(event => event.kind === 'terminate' && event.worker === cancelled), 'cancellation terminates the active worker');
  assert.ok(!cancellation.events.some(event => event.kind === 'reply' && event.worker === cancelled), 'the cancelled worker publishes no late result');
  console.log('ok compiled cancellation: active worker terminates, its promise stays silent, replacement uses the next game');

  const inline = await page.evaluate(async () => {
    const { Game, Engine, DEFAULT_RULES, RULES_2017, toLan } = window.searchProbe;
    window.searchProbe.stop(); window.searchProbe.inline();
    const engines = [new Engine(), new Engine()], games = [DEFAULT_RULES, RULES_2017].map(rules => new Game('RALSKMOG', rules));
    const results = [];
    for (const index of [0, 1, 0, 1, 1]) {
      const result = await engines[index].think(games[index], { maxDepth: 3 });
      results.push({ ...result, move: result.move && toLan(games[index].pos, result.move) });
    }
    return results;
  });
  assert.deepEqual(inline.slice(0, 4), [0, 1, 0, 1].map(index => retention.fresh[index][0]), 'compiled inline fallback clears tables when game ownership changes');
  assert.deepEqual(inline[4], retention.fresh[1][1], 'compiled inline fallback retains the same game’s warm state');
  assertNoErrors();
  await mkdir(env('PLAYABLE_OUT'), { recursive: true });
  await writeFile(join(env('PLAYABLE_OUT'), 'search-worker.json'), JSON.stringify({ browser: browser.version(), retention, turns, cancellation, inline }, null, 2));
  console.log('ok compiled inline fallback: alternating games remain isolated and the same game stays warm');
} finally {
  await browser?.close(); await server?.close(); await rm(out, { recursive: true, force: true });
}
