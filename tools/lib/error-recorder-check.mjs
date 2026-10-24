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
 const reports = [], fingerprints = new Set(), tag = `Recorder check ${randomUUID().slice(0, 8)}`;
 await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
 context.on('request', request => {
  if (new URL(request.url()).pathname !== '/api/client-errors') return;
  const text = request.postData(); assert(Buffer.byteLength(text) <= 4096);
  const report = JSON.parse(text); reports.push(report); fingerprints.add(report.fingerprint);
  assert.deepEqual(Object.keys(report).sort(), ['browser', 'build', 'fingerprint', 'frames', 'kind', 'message', 'name', 'route', 'size']);
  assert.equal(report.route, '/play'); assert.match(report.build, /^[a-f0-9]{40}$/);
  assert.match(report.browser, /^(?:Chrome|Safari|Firefox|Edge|Opera) \d+$/);
  assert.equal(report.size, 'desktop');
  assert(report.frames.length > 0 && report.frames.length <= 10);
  for (const frame of report.frames) assert.match(frame, /^\/assets\/[\w.-]+\.js:\d+:\d+$/);
  for (const privateValue of ['person@example.com', 'private-query', 'private-fragment', 'private-token', 'chrome-extension://']) assert(!text.includes(privateValue));
 });
 const stored = async () => (await pool.query('select * from public.client_errors where fingerprint=any($1::text[])', [[...fingerprints]])).rows;
 const emit = async (page, kind, word) => {
  const body = kind === 'rejection' ? `void Promise.reject(new Error(${JSON.stringify(`${tag} ${word}`)}));` : `setTimeout(() => { throw new Error(${JSON.stringify(`${tag} ${word}`)}); }, 0);`;
  await page.evaluate(body + `\n//# sourceURL=${origin}${asset}`);
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
   const error = new Error('Extension fault'); error.stack = 'Error: Extension fault\n at f (chrome-extension://private/page.js:1:2)';
   window.dispatchEvent(new ErrorEvent('error', { error, message: error.message }));
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
  console.log('Error recorder: thrown error, rejection, private fields, extension filter, duplicate and five-report limit pass; ChatGPT bundle has no recorder');
 } finally {
  await context.close();
  await pool.query('delete from public.client_errors where fingerprint=any($1::text[])', [[...fingerprints]]);
 }
}
