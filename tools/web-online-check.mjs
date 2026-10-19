/** Check the built website at its root with the compiled server and a test database. */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { endTurn, lanMoves, readyBoard, waitForUi } from './app-ui.mjs';
import { assertNoErrors, env, launch, shot, STEP, trapErrors } from './lib/checks.mjs';
import { tapSquare } from './lib/tap-board.mjs';
import { ART_TYPES } from './plugin-art-headers.mjs';
import { testDatabase } from './plugin-db-config.mjs';
import { buildPluginServer } from './plugin-server-build.mjs';

/** Apply the site build routes, as vercel-check.mjs does. */
export function siteRoute(config, path) {
  const routes = config.routes.filter(route => new RegExp(route.src).test(path));
  return {
    dest: routes.find(route => route.dest)?.dest ?? path,
    headers: Object.assign({}, ...routes.map(route => route.headers)),
  };
}

async function main() {
  const connectionString = testDatabase(process.env.PLUGIN_TEST_DATABASE_URL);
  const work = await mkdtemp(join(tmpdir(), 'kingdown-web-check-'));
  let browser, server, app, cleaning;
  function cleanup() {
    return cleaning ??= (async () => {
      const failures = [];
      for (const finish of [
        () => browser?.close(),
        async () => { if (server?.listening) { server.closeAllConnections(); await new Promise((done, reject) => server.close(error => error ? reject(error) : done())); } },
        () => app?.pool.end(),
        () => rm(work, { recursive: true, force: true }),
      ]) { try { await finish(); } catch (error) { failures.push(error); } }
      if (failures.length) throw new AggregateError(failures, 'Web check cleanup failed');
    })();
  }
  for (const [signal, code] of [['SIGINT', 130], ['SIGTERM', 143], ['SIGHUP', 129]]) {
    process.once(signal, () => { void cleanup().finally(() => process.exit(code)); });
  }
  try {
    // The check runner builds dist. Keep the site and function in one temporary release tree.
    const tree = await buildPluginServer(work, { site: resolve('dist') });
    // Vite sets NODE_ENV during the build; the server below is a local test process.
    process.env.NODE_ENV = 'test';
    const config = JSON.parse(await readFile(join(tree, 'config.json'), 'utf8'));
    const { configurePlugin } = await import(pathToFileURL(join(tree, 'functions/mcp.func/server.mjs')).href);
    const types = { ...ART_TYPES, html: 'text/html', js: 'text/javascript', mjs: 'text/javascript', css: 'text/css', json: 'application/json', wasm: 'application/wasm' };
    const exists = path => stat(path).catch(error => { if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') throw error; });
    server = createServer((req, res) => {
      void (async () => {
        const path = new URL(req.url, origin).pathname;
        const { dest, headers } = siteRoute(config, path);
        for (const [name, value] of Object.entries(headers)) res.setHeader(name, value);
        const file = join(tree, 'static', dest.endsWith('/') ? `${dest}index.html` : dest);
        if (['GET', 'HEAD'].includes(req.method) && (await exists(file))?.isFile()) {
          if (!res.hasHeader('Content-Type')) res.setHeader('Content-Type', types[extname(file).slice(1)] ?? 'application/octet-stream');
          res.end(req.method === 'HEAD' ? undefined : await readFile(file));
        } else if (await exists(join(tree, 'functions', `${dest}.func`))) {
          await app.handler(req, res);
        } else { res.writeHead(404).end(); }
      })().catch(() => { if (!res.headersSent) res.writeHead(500); res.end(); });
    });
    server.listen(0, '127.0.0.1'); await once(server, 'listening');
    const origin = `http://127.0.0.1:${server.address().port}`;
    app = await configurePlugin({ NODE_ENV: 'test', KINGDOWN_PLUGIN_ORIGIN: origin, KINGDOWN_PLUGIN_DATABASE_URL: connectionString, KINGDOWN_INTERNAL_SECRET: randomUUID() }, { localDev: true });

    browser = await launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, hasTouch: true, reducedMotion: 'reduce', serviceWorkers: 'block' });
    page.setDefaultTimeout(30_000 * STEP);
    page.setDefaultNavigationTimeout(30_000 * STEP);
    const errors = trapErrors(page);
    await page.addInitScript(() => {
      sessionStorage.setItem('kingdown.title-seen', '1');
      // Seed once. A reload must read the save that the move writes.
      if (!sessionStorage.getItem('web-online.seeded')) {
        localStorage.setItem('kingdown.save', JSON.stringify({ back: 'RNBQKBNR', fen: '', moves: [], white: 'human', black: 'human', sound: false, pace: 'off' }));
        sessionStorage.setItem('web-online.seeded', '1');
      }
    });
    assert.equal((await page.goto(origin)).status(), 200, 'The site root serves the built page');
    await readyBoard(page);
    assert.equal(new URL(page.url()).pathname, '/', 'The game opens at the site root');
    assert.equal(page.mainFrame().childFrames().length, 0, 'The game is a top-level page');
    assert.deepEqual(await lanMoves(page), [], 'The local game starts with no moves');
    await tapSquare(page, 12); await tapSquare(page, 28);
    await waitForUi(page, ui => ui.lan.length === 1 && !window.view.scene.animating);
    assert.deepEqual(await lanMoves(page), ['e2-e4'], 'The board tap stages the local move');
    await endTurn(page);
    await page.waitForFunction(() => document.getElementById('end-turn').getAttribute('aria-disabled') === 'true');
    assert.equal(await page.locator('#turn').textContent(), 'Black to move', 'End turn hands over to Black');
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('kingdown.save'))?.moves.join() === 'e2-e4');
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('kingdown.save')));
    await page.reload(); await readyBoard(page);
    assert.deepEqual(await lanMoves(page), ['e2-e4'], 'Reload restores the move list');
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('kingdown.save'))), saved, 'Reload keeps the saved game');
    assert.deepEqual(await page.evaluate(() => [window.view.pos.board[12], window.view.pos.board[28]]), [0, 1], 'Reload restores the pawn on e4');
    assert.equal(await page.locator('#turn').textContent(), 'Black to move', 'Reload keeps the next side');
    await shot(page, 'local-turn-after-reload');

    const mcp = await page.request.get(`${origin}/mcp`, { maxRedirects: 0 });
    assert.equal(mcp.status(), 405, 'MCP reaches the compiled server');
    assert.match(mcp.headers()['content-type'], /^application\/json/, 'The compiled server answers with JSON');
    for (const path of ['/play/', `/g/${randomUUID()}`, '/j']) {
      const response = await page.request.get(origin + path, { maxRedirects: 0 });
      assert.equal(response.status(), 404, `${path} has no account page`);
    }
    for (const path of ['/api', '/api/games', '/api/me/games']) {
      for (const method of ['GET', 'POST']) {
        const response = await page.request.fetch(origin + path, { method, maxRedirects: 0, ...(method === 'POST' ? { data: {} } : {}) });
        assert.equal(response.status(), 404, `${method} ${path} stays closed`);
      }
    }
    assertNoErrors(errors);
    console.log(`PASS: web-online (${env('PLAYABLE_BROWSER')}): built root, test database, local move, End turn, saved reload, closed account and API routes`);
  } finally { await cleanup(); }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
