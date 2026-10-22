// Compare the published site with the tested build. tools/deploy.sh runs this after publish.
// Send no cookie. Keep the bounded propagation check for a new deployment.
// DEPLOY_LIVE_URL defaults to https://kingdown.dev; DEPLOY_LIVE_TIMEOUT_MS defaults to 180000.
// Exit: 0 pass, 1 live difference, 2 invalid build or arguments.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const legalPages = ['privacy.html', 'terms.html', 'delete-data.html', 'support.html'];
const challenge = '.well-known/openai-apps-challenge';
// The site routes these to the app shell (tools/plugin-server-build.mjs vercelRoutes); other paths stay 404.
const appPages = ['/play', '/play/', '/play/profile', '/play/settings', '/g/00000000-0000-4000-8000-000000000000', '/j', '/j/'];
const closedPages = ['/play.html', '/j/deploy-check-inert-token', '/deploy-check-unknown'];
// The website account API: /api/status reports the 0016 switch; an unsigned account call refuses in both states.
const apiProbes = [
  { method: 'GET', path: '/api', status: () => 404, code: () => 'NOT_FOUND' },
  { method: 'POST', path: '/api', status: () => 404, code: () => 'NOT_FOUND' },
  { method: 'POST', path: '/api/status', status: () => 405, code: () => 'NOT_ALLOWED' },
  ...['GET /api/me/games', 'POST /api/games'].map(key => ({ method: key.split(' ')[0], path: key.split(' ')[1], status: open => (open ? 401 : 503), code: open => (open ? 'UNAUTHENTICATED' : 'UNAVAILABLE') })),
];
const fault = message => { console.error(`live-check: ${message}`); process.exit(2); };

/** The src of the first module script, or null. */
function bundleOf(html) {
  for (const [tag] of html.matchAll(/<script\b[^>]*>/gi)) {
    const src = /\btype=["']?module\b/i.test(tag) && /\bsrc=["']?([^"'\s>]+)/i.exec(tag)?.[1];
    if (src) return src;
  }
  return null;
}

/** Read the policy ID from the built worker. Byte equality also checks its live value. */
function policyOf(worker) {
  return /\bconst POLICY = ['"]([^'"]+)['"];/.exec(worker)?.[1];
}

function publicPath(name) {
  const url = new URL(name, 'https://build.invalid/');
  if (url.origin !== 'https://build.invalid' || url.search || url.hash) fault(`invalid public build path ${name}`);
  return url.pathname;
}

function workerFiles(worker, name) {
  try {
    const files = JSON.parse(new RegExp(`\\bconst ${name} = (\\[[^;]*\\]);`).exec(worker)?.[1] ?? 'null');
    if (!Array.isArray(files) || !files.length || files.some(file => typeof file !== 'string')) throw new Error();
    return files.map(publicPath);
  } catch { fault(`the build's sw.js has no valid ${name}`); }
}

function typesOf(path) {
  if (path === `/${challenge}`) return ['text/plain'];
  const types = { '.js': ['text/javascript', 'application/javascript'], '.mjs': ['text/javascript', 'application/javascript'], '.css': ['text/css'], '.html': ['text/html'], '.json': ['application/json'], '.webmanifest': ['application/manifest+json', 'application/json'], '.woff2': ['font/woff2'], '.svg': ['image/svg+xml'], '.png': ['image/png'], '.webp': ['image/webp'], '.txt': ['text/plain'], '.wasm': ['application/wasm'] };
  return path === '/' ? ['text/html'] : types[extname(path)];
}

const [folder, ...extra] = process.argv.slice(2);
if (!folder || extra.length) fault('usage: node tools/deploy-live-check.mjs <build folder>');
for (const name of ['index.html', 'sw.js', ...legalPages]) if (!existsSync(join(folder, name))) fault(`the build has no ${name} in ${folder}`);
const bundle = bundleOf(readFileSync(join(folder, 'index.html'), 'utf8'));
if (!bundle) fault(`the build's index.html has no module script in ${folder}`);
const worker = readFileSync(join(folder, 'sw.js'), 'utf8');
const version = /\bconst VERSION = ['"]([^'"]+)['"];/.exec(worker)?.[1], policy = policyOf(worker);
if (!version || !policy) fault('the build\'s sw.js has no version or policy ID');
const checkedPages = [...legalPages, ...(existsSync(join(folder, challenge)) ? [challenge] : [])];
const paths = [...new Set(['/', '/sw.js', publicPath(bundle), ...checkedPages.map(name => `/${name}`), ...workerFiles(worker, 'ALLOWLIST'), ...workerFiles(worker, 'PRECACHE')])];
const built = new Map(paths.map(path => {
  const file = path === '/' ? 'index.html' : path.slice(1);
  if (!existsSync(join(folder, file))) fault(`the build has no ${file} in ${folder}`);
  const types = typesOf(path);
  if (!types) fault(`the build has no checked content type for ${file}`);
  return [path, { bytes: readFileSync(join(folder, file)), types }];
}));
const base = (process.env.DEPLOY_LIVE_URL || 'https://kingdown.dev').replace(/\/+$/, '');
const limit = Number(process.env.DEPLOY_LIVE_TIMEOUT_MS ?? 180_000);
if (!(limit >= 0)) fault('DEPLOY_LIVE_TIMEOUT_MS must be a number of milliseconds');

/** Use manual redirects for every probe. Node fetch keeps no cookie jar. */
async function get(path, method = 'GET') {
  try {
    const res = await fetch(base + path, { method, credentials: 'omit', redirect: 'manual', headers: { 'cache-control': 'no-cache' }, signal: AbortSignal.timeout(15_000) });
    return { status: res.status, location: res.headers.get('location'), type: (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase(), cache: res.headers.get('cache-control'), bytes: Buffer.from(await res.arrayBuffer()) };
  } catch (error) {
    return { error: `${method} ${path}: fetch failed (${error.cause?.code ?? error.message})` };
  }
}

const json = bytes => { try { return JSON.parse(bytes.toString('utf8')); } catch { return undefined; } };
let access;

/** One complete probe of public files, app routes, closed routes and the account API. */
async function differences() {
  const probes = [...paths.map(path => ['GET', path]), ...appPages.map(path => ['GET', path]), ...closedPages.map(path => ['GET', path]), ['GET', '/api/status'], ...apiProbes.map(({ method, path }) => [method, path])];
  const results = await Promise.all(probes.map(([method, path]) => get(path, method)));
  const found = [];
  const next = (() => { let i = 0; return () => results[i++]; })();
  const expectBytes = (path, expected) => {
    const { error, status, location, type, bytes } = next();
    if (error) { found.push(error); return; }
    if (status !== 200 || location) { found.push(`${path}: HTTP ${status}${location ? ' with a redirect' : ''}`); return; }
    if (path === '/') {
      const live = bundleOf(bytes.toString('utf8'));
      if (live !== bundle) found.push(`bundle: the live site loads ${live ?? 'no module script'}, the build ${bundle}`);
    }
    if (!expected.types.includes(type)) found.push(`${path}: expected ${expected.types.join(' or ')}, got ${type || 'no content type'}`);
    if (!bytes.equals(expected.bytes)) found.push(`${path === '/' ? 'index.html' : path.slice(1)}${appPages.includes(path) ? ' (app page)' : ''}: the live page differs from the build (live ${bytes.length} bytes, build ${expected.bytes.length} bytes)`);
  };
  for (const path of paths) expectBytes(path, built.get(path));
  for (const path of appPages) expectBytes(path, built.get('/'));
  for (const path of closedPages) {
    const { error, status, location } = next();
    if (error) found.push(error);
    else if (status !== 404 || location) found.push(`GET ${path}: expected 404 without redirect, got HTTP ${status}${location ? ' with a redirect' : ''}`);
  }
  const apiReply = (method, path, status, code) => {
    const reply = next();
    if (reply.error) { found.push(reply.error); return; }
    const body = json(reply.bytes);
    if (reply.status !== status || reply.location || reply.type !== 'application/json' || reply.cache !== 'no-store' || (code && body?.code !== code)) {
      found.push(`${method} ${path}: expected JSON HTTP ${status}${code ? ` ${code}` : ''} with no-store and no redirect, got HTTP ${reply.status}${reply.location ? ' with a redirect' : ''}, ${reply.type || 'no content type'}, ${reply.cache || 'no cache policy'}, ${body?.code ?? 'no code'}`);
      return;
    }
    return body;
  };
  const status = apiReply('GET', '/api/status', 200);
  access = status?.account_access;
  if (status && !(['closed', 'open'].includes(access) && Number.isInteger(status.valid_for_ms))) { found.push(`GET /api/status: expected account_access closed or open, got ${JSON.stringify(status)}`); access = undefined; }
  for (const probe of apiProbes) {
    if (access) apiReply(probe.method, probe.path, probe.status(access === 'open'), probe.code(access === 'open'));
    else next();
  }
  return found;
}

const start = Date.now();
const deadline = start + limit;
console.log(`live-check: ${base} against ${folder} (bundle ${bundle}, time limit ${Math.round(limit / 1000)} s)`);
console.log(`live-check: sw.js version ${version}, policy ${policy}, sha256 ${createHash('sha256').update(built.get('/sw.js').bytes).digest('hex')}`);
for (;;) {
  const found = await differences();
  if (!found.length) {
    console.log(`live-check: pass: ${base} loads ${bundle}; ${checkedPages.join(', ')} are identical to the build; ${paths.length} public files match bytes and types; ${appPages.length} app pages serve the build's index.html; ${closedPages.length} closed paths answer 404; account_access ${access}; ${apiProbes.length} API probes pass`);
    process.exit(0);
  }
  const left = deadline - Date.now();
  if (left <= 0) {
    console.error(`live-check: FAIL after ${Math.round((Date.now() - start) / 1000)} s: ${base} does not serve the build`);
    for (const line of found) console.error(`live-check:   ${line}`);
    process.exit(1);
  }
  await new Promise(done => setTimeout(done, Math.min(5000, left)));
}
