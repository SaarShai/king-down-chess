/** Emitted site -> same-origin HTTP -> local database. The page has no account. */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function checkErrorRecorder({ browser, origin, pool, root }) {
 const board = await readFile(join(root, 'functions/mcp.func/board.html'), 'utf8');
 assert(!board.includes('/api/client-errors'), 'The ChatGPT bundle has no report endpoint');
 assert(!board.includes('sendBeacon'), 'The ChatGPT bundle has no recorder transport');
 const html = await readFile(join(root, 'static/index.html'), 'utf8');
 const asset = html.match(/<script[^>]+src="([^"]+\.js)"/)?.[1];
 assert(asset?.startsWith('/assets/'), 'The website uses an emitted bundle');
 const context = await browser.newContext({ viewport: { width: 1100, height: 1000 } });
 let nativeChecks = false;
 const reports = [], fingerprints = new Set(), locations = new Map(), tag = `Recorder check ${randomUUID().slice(0, 8)}`;
 await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
 context.on('request', request => {
  if (nativeChecks) return;
  if (new URL(request.url()).pathname !== '/api/client-errors') return;
  const text = request.postData(); assert(Buffer.byteLength(text) <= 4096);
  const report = JSON.parse(text); reports.push(report); fingerprints.add(report.fingerprint);
  assert.deepEqual(Object.keys(report).sort(), ['browser', 'build', 'fingerprint', 'frames', 'kind', 'message', 'name', 'route', 'size']);
  assert.equal(report.route, '/play'); assert.match(report.build, /^[a-f0-9]{40}$/);
  assert.match(report.browser, /^(?:Chrome|Safari|Firefox|Edge|Opera) \d+$/);
  assert.equal(report.size, 'desktop'); assert.equal(report.message, 'Unlisted message');
  assert.equal(report.frames.length, report.kind === 'rejection' ? 0 : 1);
  for (const frame of report.frames) assert.match(frame, /^\/assets\/[\w.-]+\.js:\d+:\d+$/);
  for (const privateValue of ['person@example.com', 'private-query', 'private-fragment', 'private-token', 'chrome-extension://']) assert(!text.includes(privateValue));
 });
 const stored = async () => (await pool.query('select * from public.client_errors where fingerprint=any($1::text[])', [[...fingerprints]])).rows;
 const emit = async (page, kind, word) => {
  const body = kind === 'rejection' ? `void Promise.reject(new Error(${JSON.stringify(`${tag} ${word}`)}));` : `setTimeout(() => { throw new Error(${JSON.stringify(`${tag} ${word}`)}); }, 0);`;
  if (!locations.has(word)) locations.set(word, locations.size + 1);
  // Playwright trims leading white space; keep a comment before each test location.
  await page.evaluate('/* Fault location */' + '\n'.repeat(locations.get(word)) + body + `\n//# sourceURL=${origin}${asset}`);
 };
 const response = page => page.waitForResponse(reply => new URL(reply.url()).pathname === '/api/client-errors' && reply.status() === 204);
 const open = async () => { const page = await context.newPage(); await page.goto(origin + '/play/?private-query#private-fragment'); return page; };
 try {
  const page = await open();
  let done = response(page); await emit(page, 'error', 'thrown person@example.com token=private-token'); await done;
  done = response(page); await emit(page, 'rejection', 'rejected'); await done;
  let rows = await stored(); assert.equal(rows.length, 2); assert.deepEqual(rows.map(row => row.kind).sort(), ['error', 'rejection']);
  assert(rows.every(row => row.count === '1' && row.routes.join() === '/play'));
  await page.evaluate(() => {
   const error = new Error('Extension fault');
   window.dispatchEvent(new ErrorEvent('error', { error, message: error.message, filename: 'chrome-extension://private/page.js', lineno: 1, colno: 2 }));
  });
  await emit(page, 'error', 'thrown person@example.com token=private-token');
  // A later accepted report is a barrier for the ignored events on this page.
  done = response(page); await emit(page, 'error', 'barrier'); await done;
  assert.equal(reports.length, 3); assert.equal((await stored()).length, 3);
  const limited = await open();
  for (const word of ['alpha', 'bravo', 'charlie', 'delta', 'echo']) { done = response(limited); await emit(limited, 'error', word); await done; }
  await emit(limited, 'error', 'sixth');
  // A request to the same server completes after the event task.
  await limited.evaluate(() => new Promise(resolve => setTimeout(resolve, 0)));
  await limited.request.get(origin + '/api/status');
  assert.equal(reports.length, 8); rows = await stored(); assert.equal(rows.length, 8); assert(rows.every(row => row.count === '1'));
  const columns = (await pool.query("select column_name from information_schema.columns where table_schema='public' and table_name='client_errors'")).rows.map(row => row.column_name).sort();
  assert.deepEqual(columns, ['id', 'fingerprint', 'build', 'hour', 'kind', 'name', 'message', 'frames', 'routes', 'browsers', 'size_classes', 'count', 'first_seen', 'last_seen'].sort());
  const rollout = await open();
  await pool.query('alter table public.client_errors rename to recorder_rollout_errors');
  try {
   done = response(rollout); await emit(rollout, 'error', 'missing table'); await done;
   assert.equal((await rollout.request.get(origin + '/api/status')).status(), 200);
   assert.equal(await rollout.evaluate(() => document.readyState), 'complete');
  } finally { await pool.query('alter table public.recorder_rollout_errors rename to client_errors'); }
  nativeChecks = true;
  await checkNativeLocations({ context, origin, pool, asset, build: reports[0].build, browserFamily: reports[0].browser });
  console.log('Error recorder: thrown error, rejection, private fields, extension filter, duplicate, five-report limit and missing table pass; ChatGPT bundle has no recorder');
 } finally {
  await context.close();
  await pool.query('delete from public.client_errors where fingerprint=any($1::text[])', [[...fingerprints]]);
 }
}

/** Use actual script events. Do not assign Error.stack in these cases. */
async function checkNativeLocations({ context, origin, pool, asset, build, browserFamily }) {
 const cases = [
  { label: 'name-v8', key: `${origin}${asset}:12345678:91\n    at x` },
  { label: 'name-v8-lines', key: `private\n    at ${origin}${asset}:12345678:91\nx` },
  { label: 'name-parentheses', key: `private (${origin}${asset}:76543210:93)\n    at x` },
  { label: 'name-webkit', key: `private\nf@${origin}${asset}:87654321:92\nx` },
  { label: 'name-unknown', key: `${origin}/assets/account123456789.js:1:2\n    at x` },
  { label: 'name-cut', key: (() => { const prefix = origin + '/assets/account987654321.js?'; return prefix + 'x'.repeat(32768 - 7 - prefix.length - 4) + ':1:2'; })() },
  { label: 'rejection', key: `private\nf@${origin}${asset}:87654321:92\nx` },
  { label: 'property', key: 'account123456789' },
  { label: 'async' }, { label: 'eval' }, { label: 'eval-known' }, { label: 'eval-rejection' }, { label: 'worker', key: `${origin}${asset}:76543210:93\n    at x` },
 ];
 let nameFingerprint;
 const privateValues = ['12345678', '87654321', '76543210', 'account123456789', 'account987654321', 'private-query', 'private-fragment'];
 for (const item of cases) {
  const page = await context.newPage(), sent = [];
  await page.goto(origin + '/?private-query#private-fragment');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => {
   window.addEventListener('error', event => {
    event.preventDefault();
    window.nativeFault = { kind: 'error', name: event.error?.name ?? 'Error', message: event.error?.message ?? event.message, filename: event.filename, line: event.lineno, column: event.colno };
   });
   window.addEventListener('unhandledrejection', event => {
    event.preventDefault();
    window.nativeFault = { kind: 'rejection', name: event.reason.name, message: event.reason.message };
   });
  });
  page.on('request', request => { if (new URL(request.url()).pathname === '/api/client-errors') sent.push(request.postDataJSON()); });
  await page.evaluate(key => { globalThis.nativeKey = key; }, item.key);
  const code = item.label === 'eval-known' ? `eval(${JSON.stringify('setTimeout(()=>{throw new Error("Failed to fetch")},0)\n//# sourceURL=' + origin + asset + '?eval-private-query#private-fragment')})`
   : item.label === 'eval-rejection' ? `eval('void (async()=>{await 0;throw new Error("Failed to fetch")})()')`
   : item.label === 'eval' ? `eval('setTimeout(()=>{throw new Error("Failed to fetch")},0)')`
   : item.label === 'async' ? 'void (async()=>{await window.foreignFault()})()'
   : item.label === 'property' ? `const input=undefined;input[${JSON.stringify(item.key)}]`
   : item.label === 'rejection' ? `void (async()=>{const key=globalThis.nativeKey;const holder={[key](){throw new Error('Failed to fetch')}};holder[key]()})()`
   : `const key=globalThis.nativeKey;const holder={[key](){throw new Error('Failed to fetch')}};holder[key]()`;
  if (item.label === 'async') await page.addScriptTag({ content: `window.foreignFault=async function foreignFault(){await 0;throw new Error('Failed to fetch')};\n//# sourceURL=${origin}/external.js` });
  const source = origin + asset + '?recorder-native=' + item.label;
  await page.route(source, route => route.fulfill({ contentType: 'text/javascript', body: item.label === 'worker' ? `globalThis.nativeKey=${JSON.stringify(item.key)};` + code : code }));
  const response = page.waitForResponse(reply => new URL(reply.url()).pathname === '/api/client-errors' && reply.status() === 204, { timeout: 5000 }).catch(() => undefined);
  if (item.label === 'worker') {
   await page.evaluate(url => {
    const worker = new Worker(url);
    worker.onerror = event => {
     event.preventDefault();
     window.nativeFault = { kind: 'worker', name: 'Error', message: event.message, filename: event.filename, line: event.lineno, column: event.colno };
     window.dispatchEvent(new CustomEvent('kingdown-worker-error', { detail: event }));
     worker.terminate();
    };
   }, source);
  } else await page.addScriptTag({ url: source });
  await page.waitForFunction(() => window.nativeFault);
  const native = await page.evaluate(() => window.nativeFault);
  const frames = native.filename && new URL(native.filename).origin === origin && new URL(native.filename).pathname === asset && native.line > 0 && native.column > 0
   ? [`${asset}:${native.line}:${native.column}`] : [];
  const hasReport = native.kind === 'rejection' || frames.length > 0;
  if (hasReport) {
   assert(await response, item.label + ' response');
   assert.equal(sent.length, 1, item.label);
   const report = sent[0], message = item.label === 'property' ? 'Cannot read properties of [value] (reading [value])' : item.label === 'worker' ? 'Unlisted message' : 'Failed to fetch';
   assert.deepEqual(report, { kind: native.kind, name: native.name, message, frames: native.kind === 'rejection' ? [] : frames, route: '/', build, browser: browserFamily, size: 'desktop', fingerprint: report.fingerprint });
   if (item.label.startsWith('name-')) {
    nameFingerprint ??= report.fingerprint;
    assert.equal(report.fingerprint, nameFingerprint, item.label + ' same native location');
   }
   const stored = (await pool.query('select * from public.client_errors where fingerprint=$1', [report.fingerprint])).rows;
   assert.equal(stored.length, 1, item.label);
   assert.deepEqual(stored[0].frames, report.frames);
   assert.equal(stored[0].message, message); assert.equal(stored[0].name, report.name);
   assert.deepEqual(stored[0].routes, ['/']); assert.deepEqual(stored[0].browsers, [browserFamily]); assert.deepEqual(stored[0].size_classes, ['desktop']);
   assert.equal(stored[0].build, build); assert.equal(stored[0].kind, report.kind);
   for (const value of privateValues) { assert(!JSON.stringify(sent).includes(value), item.label + ' body'); assert(!JSON.stringify(stored).includes(value), item.label + ' row'); }
   await pool.query('delete from public.client_errors where fingerprint=$1', [report.fingerprint]);
  } else {
   await response; await page.request.get(origin + '/api/status'); assert.equal(sent.length, 0, item.label);
  }
  await page.close();
 }
 console.log('Native error locations: names with new lines, length cut, unknown asset, rejection, property, async, eval and worker pass');
}
