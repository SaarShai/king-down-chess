// Compare the published site with the tested build. tools/deploy.sh runs this after publish.
// Send no cookie. Keep the bounded propagation check for a new deployment.
// DEPLOY_LIVE_URL defaults to https://kingdown.dev; DEPLOY_LIVE_TIMEOUT_MS defaults to 120000.
// Exit: 0 pass, 1 live difference, 2 invalid build or arguments.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const legalPages = ['privacy.html', 'terms.html', 'delete-data.html', 'support.html'];
const challenge = '.well-known/openai-apps-challenge';
const closedPages = ['/play', '/play/', '/play/profile', '/play/settings', '/play.html', '/g/00000000-0000-4000-8000-000000000000', '/j', '/j/', '/j/deploy-check-inert-token', '/deploy-check-unknown'];
const closed = [...closedPages.map(path => ({ path, method: 'GET' })), ...['/api', '/api/status', '/api/games', '/api/me/games'].flatMap(path => ['GET', 'POST'].map(method => ({ path, method })))];
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
const limit = Number(process.env.DEPLOY_LIVE_TIMEOUT_MS ?? 120_000);
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

/** One complete probe of public files and the closed routes. */
async function differences() {
  const results = await Promise.all([...paths.map(path => get(path)), ...closed.map(({ path, method }) => get(path, method))]);
  const found = [];
  paths.forEach((path, i) => {
    const { error, status, location, type, bytes } = results[i], expected = built.get(path);
    if (error) { found.push(error); return; }
    if (status !== 200 || location) { found.push(`${path}: HTTP ${status}${location ? ' with a redirect' : ''}`); return; }
    if (path === '/') {
      const live = bundleOf(bytes.toString('utf8'));
      if (live !== bundle) found.push(`bundle: the live site loads ${live ?? 'no module script'}, the build ${bundle}`);
    }
    if (!expected.types.includes(type)) found.push(`${path}: expected ${expected.types.join(' or ')}, got ${type || 'no content type'}`);
    if (!bytes.equals(expected.bytes)) found.push(`${path.slice(1) || 'index.html'}: the live page differs from the build (live ${bytes.length} bytes, build ${expected.bytes.length} bytes)`);
  });
  closed.forEach(({ path, method }, i) => {
    const { error, status, location, type, cache, bytes } = results[paths.length + i];
    if (error) found.push(error);
    else if (status !== 404 || location) found.push(`${method} ${path}: expected 404 without redirect, got HTTP ${status}${location ? ' with a redirect' : ''}`);
    else if (/^\/api(?:\/|$)/.test(path)) {
      let code;
      try { code = JSON.parse(bytes.toString('utf8'))?.code; } catch { /* Invalid JSON fails the closure check. */ }
      if (type !== 'application/json' || cache !== 'no-store' || code !== 'NOT_FOUND') found.push(`${method} ${path}: expected JSON NOT_FOUND with no-store, got ${type || 'no content type'}, ${cache || 'no cache policy'}, ${code ?? 'no code'}`);
    }
  });
  return found;
}

const start = Date.now();
const deadline = start + limit;
console.log(`live-check: ${base} against ${folder} (bundle ${bundle}, time limit ${Math.round(limit / 1000)} s)`);
console.log(`live-check: sw.js version ${version}, policy ${policy}, sha256 ${createHash('sha256').update(built.get('/sw.js').bytes).digest('hex')}`);
for (;;) {
  const found = await differences();
  if (!found.length) {
    console.log(`live-check: pass: ${base} loads ${bundle}; ${checkedPages.join(', ')} are identical to the build; ${paths.length} public files match bytes and types; ${closed.length} closed-route probes pass`);
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
