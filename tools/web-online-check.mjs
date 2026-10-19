/** Check the built website at its root with the compiled server and a test database. */
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { EventEmitter, once } from 'node:events';
import { mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { release as osRelease, tmpdir } from 'node:os';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { endTurn, lanMoves, pressMenu, readyBoard, startLesson, waitForUi } from './app-ui.mjs';
import { assertNoErrors, env, launch, launchPersistent, shot, STEP, trapErrors } from './lib/checks.mjs';
import { tapSquare } from './lib/tap-board.mjs';
import { ART_TYPES } from './plugin-art-headers.mjs';
import { testDatabase } from './plugin-db-config.mjs';
import { build } from 'vite';
import { buildPluginServer } from './plugin-server-build.mjs';

/** Apply the site build routes, as vercel-check.mjs does. */
export function siteRoute(config, path) {
  const routes = config.routes.filter(route => new RegExp(route.src).test(path));
  return {
    dest: routes.find(route => route.dest)?.dest ?? path,
    headers: Object.assign({}, ...routes.map(route => route.headers)),
  };
}

/** An external recovery input must be a complete combined output. */
export async function recoveryOutput(path) {
  const root = resolve(path);
  const files = ['config.json', 'static/index.html', 'static/sw.js', 'functions/mcp.func/server.mjs', 'functions/mcp.func/.vc-config.json', 'functions/mcp.func/board.html', 'functions/mcp.func/runtime/index.mjs', 'functions/mcp.func/runtime/worker.mjs'];
  const hashes = {};
  for (const file of files) hashes[file] = createHash('sha256').update(await readFile(join(root, file))).digest('hex');
  const worker = await readFile(join(root, 'static/sw.js'), 'utf8');
  assert.match(worker, /const POLICY = 'public-build-v1';/, 'Recovery keeps the safe policy');
  assert.doesNotMatch(worker, /const VERSION = 'dev';|const ALLOWLIST = \[\];|const PRECACHE = \[\];/, 'Recovery has built worker lists');
  const allowlist = JSON.parse(worker.match(/const ALLOWLIST = (.+);/)[1]);
  for (const file of allowlist) {
    assert.ok(file === './' || /^[\w./-]+$/.test(file) && !file.includes('..'), 'Recovery public paths stay in the static tree');
    const path = `static/${file === './' ? 'index.html' : file}`;
    hashes[path] = createHash('sha256').update(await readFile(join(root, path))).digest('hex');
  }
  const engines = await readdir(join(root, 'functions/mcp.func/runtime/engines'));
  assert.ok(engines.some(file => file.endsWith('.mjs')), 'Recovery keeps the engine archive');
  for (const file of engines.filter(file => file.endsWith('.mjs'))) {
    const path = `functions/mcp.func/runtime/engines/${file}`;
    hashes[path] = createHash('sha256').update(await readFile(join(root, path))).digest('hex');
  }
  return { root, hashes };
}

/** Each protected request follows a fresh reply and the last old-cache deletion. */
export function assertProbeOrder(events, marker, after = 0) {
  const slice = events.slice(after), probe = slice.findIndex(event => event.event === 'probe' && event.marker === marker);
  assert.ok(probe >= 0, `${marker}: the closed API receives the probe`);
  assert.equal(slice.filter(event => event.event === 'probe' && event.marker === marker).length, 1, `${marker}: exactly one private send`);
  const replies = slice.slice(0, probe).filter(event => event.event === 'reply' && event.client === slice[probe].client && event.version === slice[probe].version);
  assert.ok(replies.length, `${marker}: this tab proves the current policy before the probe`);
  assert.deepEqual(replies.at(-1).applicationCaches, [`kingdown-${replies.at(-1).version}`], `${marker}: only the current application cache remains at reply receipt`);
  assert.ok(slice.findLastIndex(event => event.event === 'deleted') < slice.findLastIndex(event => event === replies.at(-1)), `${marker}: purge ends before the reply`);
  assert.ok(!slice.slice(probe).some(event => event.event === 'deleted'), `${marker}: deletion ends before the probe`);
}

/** An interrupted purge reaches refusal without a reply or private send. */
export function assertInterruptedPurge(events, after = 0) {
  const slice = events.slice(after);
  assert.ok(slice.some(event => event.event === 'refused' && event.marker === 'interrupted'), 'Interrupted purge reaches refusal before the check ends');
  assert.equal(slice.filter(event => ['reply', 'probe'].includes(event.event)).length, 0, 'Interrupted purge has no reply or send');
}

/** Compile the real private client for the fixture page. */
export async function buildWorkerProbe() {
  const probeBuild = await build({ configFile: false, envDir: false, publicDir: false, logLevel: 'warn', build: { write: false, minify: false, lib: { entry: resolve('tools/fixtures/web-worker/page.ts'), formats: ['es'] } } });
  return probeBuild[0].output.find(file => file.type === 'chunk').code;
}

export async function main() {
  const connectionString = testDatabase(process.env.PLUGIN_TEST_DATABASE_URL);
  const work = await mkdtemp(join(tmpdir(), 'kingdown-web-check-'));
  let browser, persistent, server, app, cleaning;
  const started = performance.now(), events = [], signal = new EventEmitter();
  const record = event => { events.push(event); signal.emit('record'); };
  let served, old = false, instrument = false, deleteMode = 'ok', holdReply = false, failPrecache = false;
  const held = new Set();
  function cleanup() {
    return cleaning ??= (async () => {
      const failures = [];
      for (const finish of [
        () => browser?.close(),
        () => persistent?.close(),
        () => { for (const response of held) response.end(); held.clear(); },
        async () => { if (server?.listening) { server.closeAllConnections(); await new Promise((done, reject) => server.close(error => error ? reject(error) : done())); } },
        () => app?.pool.end(),
        () => rm(work, { recursive: true, force: true }),
      ]) { try { await finish(); } catch (error) { failures.push(error); } }
      if (failures.length) throw new AggregateError(failures, 'Web check cleanup failed');
    })();
  }
  for (const [signal, code] of [['SIGINT', 130], ['SIGTERM', 143], ['SIGHUP', 129]]) {
    process.once(signal, () => { void (async () => {
      await mkdir(env('PLAYABLE_OUT'), { recursive: true });
      await writeFile(join(env('PLAYABLE_OUT'), 'worker-events.json'), JSON.stringify(events, null, 2));
    })().finally(cleanup).finally(() => process.exit(code)); });
  }
  try {
    // The check runner builds dist. Keep the site and function in one temporary release tree.
    const tree = await buildPluginServer(join(work, 'release'), { site: resolve('dist') });
    let recovery;
    if (process.env.KINGDOWN_WEB_RECOVERY_OUTPUT) recovery = await recoveryOutput(process.env.KINGDOWN_WEB_RECOVERY_OUTPUT);
    else {
      const site = join(work, 'recovery-site');
      await build({ envDir: false, build: { outDir: site }, plugins: [{ name: 'recovery-fixture', transformIndexHtml: html => html.replace('</head>', '<!-- Recovery fixture -->\n</head>') }] });
      const output = await buildPluginServer(join(work, 'recovery'), { site });
      recovery = await recoveryOutput(output);
    }
    served = tree;
    const release = await recoveryOutput(tree);
    const workerVersions = new Map(await Promise.all([tree, recovery.root].map(async output => [output, (await readFile(join(output, 'static/sw.js'), 'utf8')).match(/const VERSION = '([^']+)'/)[1]])));
    assert.notEqual(workerVersions.get(tree), workerVersions.get(recovery.root), 'Release and recovery have distinct worker bytes');
    const pair = process.env.KINGDOWN_WEB_RECOVERY_OUTPUT ? 'external recovery input' : 'fixture pair; no exact recovery approval';
    const oldWorker = await readFile(new URL('./fixtures/web-worker/old-sw.js', import.meta.url), 'utf8');
    const faults = await readFile(new URL('./fixtures/web-worker/faults.js', import.meta.url), 'utf8');
    const probeCode = await buildWorkerProbe();
    await mkdir(env('PLAYABLE_OUT'), { recursive: true });
    await writeFile(join(env('PLAYABLE_OUT'), 'worker-outputs.json'), JSON.stringify({ pair, release, recovery }, null, 2));
    // Vite sets NODE_ENV during the build; the server below is a local test process.
    process.env.NODE_ENV = 'test';
    const configs = new Map(await Promise.all([tree, recovery.root].map(async output => [output, JSON.parse(await readFile(join(output, 'config.json'), 'utf8'))])));
    const { configurePlugin } = await import(pathToFileURL(join(tree, 'functions/mcp.func/server.mjs')).href);
    const types = { ...ART_TYPES, html: 'text/html', js: 'text/javascript', mjs: 'text/javascript', css: 'text/css', json: 'application/json', wasm: 'application/wasm' };
    const exists = path => stat(path).catch(error => { if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') throw error; });
    server = createServer((req, res) => {
      void (async () => {
        const url = new URL(req.url, origin), path = url.pathname;
        if (path !== '/fixture/event') record({ event: path === '/sw.js' && req.headers['service-worker'] === 'script' ? 'worker-update' : 'http', url: req.url });
        res.setHeader('Cache-Control', 'no-store');
        if (path === '/fixture/page') { res.setHeader('Content-Type', 'text/html'); res.end('<script type="module" src="/fixture/probe.js"></script>'); return; }
        if (path === '/fixture/probe.js') { res.setHeader('Content-Type', 'text/javascript'); res.end(probeCode); return; }
        if (path === '/fixture/event') {
          let body = ''; for await (const part of req) body += part;
          record(JSON.parse(body)); res.end(); return;
        }
        if (path === '/fixture/delete') {
          record({ event: 'delete', name: url.searchParams.get('name'), mode: deleteMode, state: url.searchParams.get('state') });
          if (deleteMode === 'activation-hold' && url.searchParams.get('state') === 'activating') held.add(res); else res.end(deleteMode === 'activation-hold' ? 'ok' : deleteMode);
          return;
        }
        if (path === '/fixture/reply') {
          record({ event: 'reply-held', client: url.searchParams.get('client') });
          if (holdReply && !url.searchParams.get('client')?.includes('tab=two')) held.add(res); else res.end();
          return;
        }
        if (path.startsWith('/assets/') && req.headers.authorization === 'Bearer PRIVATE-CANARY') {
          record({ event: 'asset-authorization', url: req.url });
          res.setHeader('Content-Type', 'text/javascript'); res.end('// private canary'); return;
        }
        if (path.startsWith('/assets/') && url.searchParams.has('variant')) {
          record({ event: 'asset-query', url: req.url });
          res.removeHeader('Cache-Control'); res.setHeader('Content-Type', 'text/javascript'); res.end('// query variant'); return;
        }
        if (path.startsWith('/api/')) record({ event: 'probe', marker: req.headers.authorization?.replace(/^Bearer /, ''), client: req.headers['x-fixture-tab'], version: old ? 'dev' : workerVersions.get(served), url: req.url });
        if (failPrecache && path.startsWith('/assets/')) {
          record({ event: 'install-failed', url: req.url }); res.writeHead(503).end(); return;
        }
        if (path === '/sw.js') {
          res.setHeader('Content-Type', 'text/javascript');
          res.end(old ? oldWorker + "\nself.addEventListener('message', event => { if (event.data?.type === 'fixture-version') event.ports[0].postMessage({ version: VERSION }); });" : (instrument ? faults : '') + await readFile(join(served, 'static/sw.js'), 'utf8')); return;
        }
        res.setHeader('Cache-Control', 'no-cache, must-revalidate');
        const { dest, headers } = siteRoute(configs.get(served), path);
        for (const [name, value] of Object.entries(headers)) res.setHeader(name, value);
        const file = join(served, 'static', dest.endsWith('/') ? `${dest}index.html` : dest);
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
    await writeFile(join(env('PLAYABLE_OUT'), 'worker-browser.json'), JSON.stringify({ engine: env('PLAYABLE_BROWSER'), version: browser.version(), node: process.version, platform: process.platform, osRelease: osRelease(), arch: process.arch }, null, 2));
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
    await browser.close(); browser = undefined;
    const waitEvent = async (event, after = 0) => {
      if (events.slice(after).some(event)) return;
      await new Promise((done, reject) => {
        const finish = () => { clearTimeout(timer); signal.off('record', check); };
        const check = () => { if (events.slice(after).some(event)) { finish(); done(); } };
        const timer = setTimeout(() => { finish(); reject(new Error('Worker event is absent')); }, 30_000 * STEP);
        signal.on('record', check); check();
      });
    };
    const options = { headless: true, viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' };
    const openProfile = async profile => {
      persistent = await launchPersistent(profile, options);
      await persistent.exposeFunction('recordWorkerEvent', record);
      const page = persistent.pages()[0] ?? await persistent.newPage();
      page.setDefaultTimeout(30_000 * STEP);
      page.setDefaultNavigationTimeout(30_000 * STEP);
      await page.goto(`${origin}/fixture/page`); await page.waitForFunction(() => typeof window.privateProbe === 'function');
      return page;
    };
    const controlled = page => page.waitForFunction(() => !!navigator.serviceWorker.controller);
    const retained = async (page, version) => {
      const kept = await page.evaluate(async () => {
        const registration = await navigator.serviceWorker.getRegistration('/'), controller = navigator.serviceWorker.controller;
        return { controlled: !!controller, active: !!registration?.active, same: controller === registration?.active, url: controller?.scriptURL };
      });
      assert.ok(kept.controlled && kept.active && kept.same, 'The reopened profile keeps its registration and controller before the probe');
      assert.equal(kept.url, origin + '/sw.js');
      if (version === 'dev') {
        await page.evaluate(() => {
          window.retainedVersion = undefined;
          const channel = new MessageChannel();
          channel.port1.onmessage = event => { window.retainedVersion = event.data.version; channel.port1.close(); channel.port2.close(); };
          navigator.serviceWorker.controller.postMessage({ type: 'fixture-version' }, [channel.port2]);
        });
        await page.waitForFunction(() => window.retainedVersion === 'dev');
      }
      record({ event: 'retained', version, ...kept });
    };
    const takeover = async (page, output, withFaults = instrument) => {
      await page.evaluate(() => {
        window.changed = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => { window.changed = true; }, { once: true });
      });
      served = output; instrument = withFaults;
      await page.evaluate(async () => { await (await navigator.serviceWorker.getRegistration('/')).update(); });
      await page.waitForFunction(() => window.changed && navigator.serviceWorker.controller?.state === 'activated');
    };
    const seed = async page => {
      const asset = JSON.parse((await readFile(join(served, 'static/sw.js'), 'utf8')).match(/const ALLOWLIST = (.+);/)[1]).find(file => file.startsWith('assets/') && file.endsWith('.js'));
      await page.evaluate(async asset => {
        const cache = await caches.open('kingdown-stale');
        await cache.put('/' + asset, new Response('STALE-ASSET'));
        for (const path of ['/api/me/games?account=one', '/api/me/games?account=two', '/play.html?token=private']) await cache.put(path, new Response('PRIVATE-CANARY'));
        await (await caches.open('unrelated-app')).put('/keep', new Response('keep'));
        localStorage.setItem('fixture-local', 'keep');
        await new Promise((resolve, reject) => {
          const request = indexedDB.open('fixture-keep', 1);
          request.onupgradeneeded = () => request.result.createObjectStore('keep');
          request.onerror = () => reject(request.error);
          request.onsuccess = () => {
            const database = request.result, transaction = database.transaction('keep', 'readwrite');
            transaction.objectStore('keep').put('keep', 'sentinel');
            transaction.oncomplete = () => { database.close(); resolve(); };
            transaction.onerror = () => reject(transaction.error);
          };
        });
        localStorage.setItem('kingdown.save', JSON.stringify({ back: 'RNBQKBNR', fen: '', moves: ['e2-e4'], white: 'human', black: 'human', sound: false, pace: 'off' }));
        localStorage.setItem('kingdown.lessons', JSON.stringify({ done: ['Archer'], tricks: [] }));
        localStorage.setItem('kingdown.workshop', JSON.stringify({ v: 1, designs: [] }));
      }, asset);
    };
    const inspect = async page => {
      const result = await page.evaluate(async () => {
        const keys = await caches.keys(), entries = [];
        for (const name of keys.filter(key => key.startsWith('kingdown-'))) {
          const cache = await caches.open(name);
          for (const request of await cache.keys()) entries.push(request.url);
        }
        const stored = await new Promise((resolve, reject) => {
          const open = indexedDB.open('fixture-keep', 1);
          open.onerror = () => reject(open.error);
          open.onsuccess = () => {
            const database = open.result, request = database.transaction('keep').objectStore('keep').get('sentinel');
            request.onsuccess = () => { database.close(); resolve(request.result); };
            request.onerror = () => reject(request.error);
          };
        });
        return { keys, entries, stored, save: JSON.parse(localStorage.getItem('kingdown.save')), lessons: localStorage.getItem('kingdown.lessons'), workshop: localStorage.getItem('kingdown.workshop'), keep: await (await caches.open('unrelated-app')).match('/keep').then(response => response?.text()), local: localStorage.getItem('fixture-local') };
      });
      assert.ok(!result.keys.includes('kingdown-stale'), 'Old application cache is absent');
      assert.ok(!result.entries.some(url => /\/api|play.html|account=|token=/.test(url)), 'Private query canaries are absent from every application cache');
      assert.equal(result.keep, 'keep'); assert.equal(result.local, 'keep'); assert.equal(result.stored, 'keep');
      assert.equal(result.save?.moves[0], 'e2-e4', 'Takeover keeps the local move');
      assert.equal(result.lessons, JSON.stringify({ done: ['Archer'], tricks: [] }));
      assert.equal(result.workshop, JSON.stringify({ v: 1, designs: [] }));
    };
    const probe = async (page, marker, safety = true) => {
      const after = events.length;
      assert.deepEqual(await page.evaluate(marker => window.privateProbe(marker), marker), { status: 404, code: 'UNAVAILABLE' }, `${marker}: API stays closed`);
      if (safety) assertProbeOrder(events, marker, after);
      else assert.equal(events.slice(after).filter(event => event.event === 'probe' && event.marker === marker).length, 1);
    };
    const closeProfile = async () => { await persistent.close(); persistent = undefined; };
    const releaseHolds = () => { for (const response of held) response.end('ok'); held.clear(); };
    let active;
    old = true;
    active = await openProfile(join(work, 'retry-profile'));
    await assert.rejects(() => retained(active, 'dev'), /keeps its registration and controller/, 'A fresh profile cannot pass the retained-worker check');
    await active.evaluate(() => navigator.serviceWorker.register('/sw.js', { scope: '/' })); await controlled(active); await seed(active);
    old = false; failPrecache = true;
    const failedAfter = events.length;
    assert.deepEqual(await active.evaluate(() => window.privateProbe('failed-install')), { status: 503, code: 'UNAVAILABLE' });
    await waitEvent(event => event.event === 'install-failed', failedAfter);
    assert.equal(events.slice(failedAfter).filter(event => event.event === 'probe').length, 0, 'Failed install keeps the private send closed');
    failPrecache = false;
    await probe(active, 'same-page-retry'); await inspect(active); await closeProfile();
    for (const [index, output] of [tree, recovery.root].entries()) {
      served = output;
      const profile = join(work, `retained-profile-${index}`);
      old = true;
      active = await openProfile(profile);
      await active.evaluate(() => navigator.serviceWorker.register('/sw.js', { scope: '/' })); await controlled(active);
      await seed(active);
      // This real profile keeps its old controller while the server changes output.
      old = false; instrument = false;
      await probe(active, 'active-old'); await inspect(active);
      await seed(active); await closeProfile();
      active = await openProfile(profile);
      await retained(active, workerVersions.get(output));
      await probe(active, 'worker-restart'); await inspect(active);
      await closeProfile();
      old = true;
      const dormantProfile = join(work, `dormant-profile-${index}`);
      active = await openProfile(dormantProfile);
      await active.evaluate(() => navigator.serviceWorker.register('/sw.js', { scope: '/' })); await controlled(active); await seed(active); await closeProfile();
      active = await openProfile(dormantProfile);
      await retained(active, 'dev'); old = false;
      await probe(active, 'dormant-old'); await inspect(active);

      await seed(active); await probe(active, output === tree ? 'release-takeover' : 'recovery-takeover');
      await takeover(active, output, true);
      for (const mode of ['throw', 'false']) {
        await seed(active); deleteMode = mode;
        const after = events.length;
        assert.deepEqual(await active.evaluate(marker => window.privateProbe(marker), `failed-${mode}`), { status: 503, code: 'UNAVAILABLE' });
        assert.equal(events.slice(after).filter(event => event.event === 'probe').length, 0, `${mode}: no private send`);
        deleteMode = 'ok'; await probe(active, `repair-${mode}`); await inspect(active);
      }
      await takeover(active, output === tree ? recovery.root : tree);
      await seed(active); await probe(active, 'safe-predecessor');
      await seed(active); deleteMode = 'activation-hold'; served = output;
      const interruptedAfter = events.length;
      await active.evaluate(async () => { await (await navigator.serviceWorker.getRegistration('/')).update(); });
      await waitEvent(event => event.event === 'delete' && event.state === 'activating', interruptedAfter);
      void active.evaluate(() => window.privateProbe('interrupted')).catch(() => {});
      await waitEvent(event => event.event === 'refused' && event.marker === 'interrupted', interruptedAfter);
      assertInterruptedPurge(events, interruptedAfter);
      await closeProfile(); deleteMode = 'ok'; releaseHolds();
      assertInterruptedPurge(events, interruptedAfter);
      active = await openProfile(dormantProfile); await probe(active, 'after-interruption'); await inspect(active);

      await takeover(active, output, false);
      const second = await persistent.newPage();
      second.setDefaultTimeout(30_000 * STEP); second.setDefaultNavigationTimeout(30_000 * STEP);
      await second.goto(`${origin}/fixture/page?tab=two`); await second.waitForFunction(() => window.privateProbe);
      await seed(active);
      holdReply = true;
      let after = events.length;
      void active.evaluate(() => window.privateProbe('account-one')).catch(() => {});
      await probe(second, 'account-two');
      await waitEvent(event => event.event === 'reply-held' && !event.client.includes('tab=two'), after);
      assert.equal(events.slice(after).filter(event => event.event === 'probe' && event.marker === 'account-one').length, 0, 'One tab waits while the other proves its policy');
      await takeover(active, output === tree ? recovery.root : tree);
      await probe(second, 'account-two-current');
      assert.equal(events.slice(after).filter(event => event.event === 'probe' && event.marker === 'account-one').length, 0, 'The held tab proves the replacement before it sends');
      holdReply = false; releaseHolds();
      await waitEvent(event => event.event === 'probe' && event.marker === 'account-one', after);
      assertProbeOrder(events, 'account-one', after);
      await seed(active); await probe(active, 'account-two'); await seed(second); await probe(second, 'account-one'); await inspect(active);
      await second.close(); await closeProfile();
    }

    // Use unmodified emitted workers for bypass and the complete local offline graph.
    instrument = false;
    active = await openProfile(join(work, 'offline-profile')); await seed(active);
    for (const output of [tree, recovery.root]) {
      if (await active.evaluate(() => !!navigator.serviceWorker.controller)) await takeover(active, output);
      else served = output;
      await probe(active, 'plain-worker', false);
      for (const path of ['/play/', '/play.html', '/g/inert', '/j/inert', '/api/games']) {
        const response = await active.request.get(origin + path, { maxRedirects: 0 });
        assert.equal(response.status(), 404, `${path}: release and recovery keep account routes closed`);
      }
      const allowlist = JSON.parse((await readFile(join(output, 'static/sw.js'), 'utf8')).match(/const ALLOWLIST = (.+);/)[1]);
      const asset = allowlist.find(file => file.startsWith('assets/') && file.endsWith('.js'));
      const paths = ['/api', '/mcp', '/authorize', '/consent', '/consent.mjs', '/auth', '/oauth', '/login', '/logout', '/signin', '/signout', '/callback', '/internal', '/play', '/play.html', '/g', '/j', '/.well-known/', '/unknown'];
      const queryAfter = events.length;
      const cached = await active.evaluate(async asset => (await caches.match('/' + asset)).text(), asset);
      const variants = await active.evaluate(async ({ paths, asset }) => {
        for (const path of paths) for (const query of ['', '?variant=one', '?variant=two']) await fetch(path + query);
        const variants = [];
        for (const query of ['one', 'two']) variants.push(await (await fetch('/' + asset + '?variant=' + query)).text());
        const authorized = await (await fetch('/' + asset, { headers: { Authorization: 'Bearer PRIVATE-CANARY' } })).text();
        return { variants, authorized };
      }, { paths, asset });
      assert.deepEqual(variants, { variants: ['// query variant', '// query variant'], authorized: '// private canary' }, 'Query and Authorization requests reach the server');
      assert.equal(events.slice(queryAfter).filter(event => event.event === 'asset-query').length, 2);
      assert.equal(await active.evaluate(async asset => (await caches.match('/' + asset)).text(), asset), cached, 'Asset queries keep the canonical public bytes');
      await inspect(active);
      const keys = await active.evaluate(async () => { const entries = []; for (const name of await caches.keys()) if (name.startsWith('kingdown-')) for (const request of await (await caches.open(name)).keys()) entries.push(new URL(request.url).pathname + new URL(request.url).search); return entries; });
      assert.ok(keys.every(key => !key.includes('?') && allowlist.some(file => new URL(file, origin + '/').pathname === key)), 'Every cache key is exactly public');
      await active.goto(`${origin}/?title=0`); await readyBoard(active);
      await active.evaluate(() => {
        localStorage.setItem('kingdown.save', JSON.stringify({ back: 'RNBQKBNR', fen: '', moves: ['e2-e4'], white: 'human', black: 'human', sound: false, pace: 'off' }));
        sessionStorage.setItem('kingdown.title-seen', '1');
      });
      await persistent.setOffline(true);
      const offlineAfter = events.length;
      await active.goto(origin); await readyBoard(active); assert.deepEqual(await lanMoves(active), ['e2-e4']);
      const saved = await active.evaluate(() => localStorage.getItem('kingdown.save'));
      await startLesson(active, 'Beast'); await active.locator('#show-me').click();
      await active.waitForFunction(() => window.view.marks.hint.length > 0); await active.locator('#return-game').click();
      await pressMenu(active, 'Workshop'); await active.locator('#workshop').waitFor({ state: 'visible' });
      await active.locator('#workshop').evaluate(dialog => dialog.close());
      assert.equal(await active.evaluate(() => localStorage.getItem('kingdown.save')), saved, 'Offline lesson and lazy Workshop keep the save');
      await active.goto(`${origin}/?army=RNBQKBNR&moves=e2-e4&players=human,ai`); await readyBoard(active);
      assert.deepEqual(await lanMoves(active), ['e2-e4'], 'The offline game link keeps the local move');
      await active.evaluate(() => {
        const saved = JSON.parse(localStorage.getItem('kingdown.save')); saved.black = 'ai'; saved.link = null;
        localStorage.setItem('kingdown.save', JSON.stringify(saved));
      });
      await active.goto(origin); await readyBoard(active);
      await active.waitForFunction(() => JSON.parse(localStorage.getItem('kingdown.save')).moves.length >= 2, null, { timeout: 30_000 * STEP });
      assert.equal((await lanMoves(active))[0], 'e2-e4', 'The offline AI continues the saved game');
      await inspect(active);
      assert.equal(events.slice(offlineAfter).filter(event => event.event === 'http').length, 0, 'Offline play fetches no page or asset from the server');
      await persistent.setOffline(false);
      await active.goto(`${origin}/fixture/page`); await active.waitForFunction(() => window.privateProbe);
    }
    await closeProfile();
    active = await openProfile(join(work, 'blocked-profile'));
    await seed(active);
    await active.evaluate(() => { navigator.serviceWorker.register = async () => { throw new Error('Blocked registration'); }; });
    await active.evaluate(() => { window.cacheDelete = caches.delete.bind(caches); caches.delete = async () => false; });
    const blockedAfter = events.length;
    assert.deepEqual(await active.evaluate(() => window.privateProbe('blocked-storage')), { status: 503, code: 'UNAVAILABLE' });
    assert.equal(events.slice(blockedAfter).filter(event => event.event === 'probe').length, 0, 'Failed page cleanup keeps the send closed');
    await active.evaluate(() => { caches.delete = window.cacheDelete; });
    await probe(active, 'blocked-empty', false); await inspect(active);
    await active.evaluate(() => Object.defineProperty(navigator, 'serviceWorker', { value: undefined, configurable: true }));
    await probe(active, 'no-worker', false);
    old = true;
    await active.reload(); await active.waitForFunction(() => window.privateProbe);
    await active.evaluate(() => navigator.serviceWorker.register('/sw.js', { scope: '/' })); await controlled(active);
    await active.evaluate(() => { navigator.serviceWorker.register = async () => { throw new Error('Blocked registration'); }; });
    const after = events.length;
    assert.deepEqual(await active.evaluate(() => window.privateProbe('blocked-old')), { status: 503, code: 'UNAVAILABLE' });
    assert.equal(events.slice(after).filter(event => event.event === 'probe').length, 0, 'Blocked old controller keeps the send closed');
    await writeFile(join(env('PLAYABLE_OUT'), 'worker-events.json'), JSON.stringify(events, null, 2));
    console.log(`PASS: worker journeys; ${pair}; ${events.filter(event => event.event === 'probe').length} protected/bypass requests; ${((performance.now() - started) / 1000).toFixed(1)} s`);
    console.log(`PASS: web-online (${env('PLAYABLE_BROWSER')}): built root, test database, local move, End turn, saved reload, closed account and API routes`);
  } finally {
    try {
      await mkdir(env('PLAYABLE_OUT'), { recursive: true });
      await writeFile(join(env('PLAYABLE_OUT'), 'worker-events.json'), JSON.stringify(events, null, 2));
    } finally { await cleanup(); }
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
