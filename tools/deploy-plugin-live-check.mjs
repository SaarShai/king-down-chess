// Unsigned release check. No player token, session cookie or match operation is used.
// It checks the surface that the build has: the ChatGPT plugin, the Muse connector, both or neither. A build without the
// consent script parks both (tools/chatgpt-plugin.mjs, tools/muse-connector.mjs): then each connector path must answer 404.
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { PARKED_PATHS } from './chatgpt-plugin.mjs';
import { MUSE_PATHS } from './muse-connector.mjs';

const [folder, origin, ...extra] = process.argv.slice(2);
const limit = Number(process.env.DEPLOY_LIVE_TIMEOUT_MS || 120_000);
if (!folder || !origin || extra.length || !Number.isFinite(limit) || limit < 0) {
  console.error('usage: node tools/deploy-plugin-live-check.mjs <function folder> <origin>');
  process.exit(2);
}
const base = new URL(origin);
if (base.origin !== origin || (base.protocol !== 'https:' && !['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname))) {
  console.error('plugin-live-check: expected an HTTPS origin (HTTP only on loopback)');
  process.exit(2);
}
const consentBuilt = existsSync(join(folder, 'consent.mjs'));
const script = consentBuilt ? readFileSync(join(folder, 'consent.mjs')) : undefined;
const artDir = join(folder, '../../static/plugin-art'), configFile = join(folder, '../../config.json');
const routes = existsSync(configFile) ? JSON.parse(readFileSync(configFile, 'utf8')).routes ?? [] : [];
// A Muse build routes /muse/mcp to the function (tools/plugin-server-build.mjs). A consent script without that route,
// or with the board widget beside it, is the ChatGPT plugin.
const muse = consentBuilt && routes.some(route => route.src === '^/muse/mcp$');
const chatgpt = consentBuilt && (!muse || existsSync(join(folder, 'board.html')));
// One made-up art name per parked check: a tree without the ChatGPT plugin has no board art.
const parkedPaths = [...chatgpt ? [] : [...PARKED_PATHS.filter(path => !muse || !['/authorize', '/consent.mjs'].includes(path)), '/plugin-art/deploy-check-0000.webp'], ...muse ? [] : MUSE_PATHS];
// One file per art format checks the static routes without a player token.
const formats = new Set();
const art = (existsSync(artDir) ? readdirSync(artDir).sort() : []).filter(name => {
  const format = /^[\w-]+\.(webp|png|svg|woff2)$/.exec(name)?.[1];
  if (!format || formats.has(format)) return false;
  formats.add(format); return true;
}).map(name => {
  const path = `/plugin-art/${name}`;
  return { path, bytes: readFileSync(join(artDir, name)), headers: Object.assign({}, ...routes.filter(route => new RegExp(route.src).test(path)).map(route => route.headers)) };
});
const authorize = '/authorize?authorization_id=deploy-check%2Bquery&state=keep%20me';
const issuer = 'https://utqzovjmclfyojedmwok.supabase.co/auth/v1';
const deadline = Date.now() + limit;

const get = (path, options = {}) => fetch(origin + path, {
  ...options, credentials: 'omit', redirect: 'error',
  headers: { 'cache-control': 'no-cache', ...options.headers },
  signal: AbortSignal.timeout(Math.max(1, Math.min(15_000, deadline - Date.now()))),
});

/** The parked paths: no metadata, MCP, consent page, consent script or board art of a connector that is off. */
async function parkedCheck() {
  const responses = await Promise.all(parkedPaths.flatMap(path => [get(path), get(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })]));
  for (const [i, response] of responses.entries()) assert.equal(response.status, 404, `${i % 2 ? 'POST' : 'GET'} ${parkedPaths[i >> 1]} status (parked)`);
}

/** One connector's resource: its metadata, and the OAuth challenge to an unsigned call. */
async function resourceCheck(path) {
  const metadataUrl = `${origin}/.well-known/oauth-protected-resource${path}`;
  const [discovery, challenge] = await Promise.all([get(`/.well-known/oauth-protected-resource${path}`), get(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })]);
  assert.equal(discovery.status, 200, `${path} discovery status`);
  const metadata = await discovery.json();
  assert.equal(metadata.resource, origin + path, `${path} discovery resource`);
  assert.deepEqual(metadata.authorization_servers, [issuer], `${path} discovery issuer`);
  assert(metadata.scopes_supported?.includes('openid'), `${path} discovery scope`);
  assert.equal(challenge.status, 401, `unsigned ${path} status`);
  assert.equal(challenge.headers.get('www-authenticate'), `Bearer resource_metadata="${metadataUrl}", scope="openid"`, `${path} OAuth challenge`);
  return metadata;
}

async function check() {
  if (chatgpt) {
    const metadata = await resourceCheck('/mcp'), rootDiscovery = await get('/.well-known/oauth-protected-resource');
    assert.equal(rootDiscovery.status, 200, 'root discovery status');
    assert.deepEqual(await rootDiscovery.json(), metadata, 'root discovery metadata');
  }
  if (muse) await resourceCheck('/muse/mcp');
  if (parkedPaths.length) await parkedCheck();
  if (!consentBuilt) return;
  const [consent, liveScript, ...liveArt] = await Promise.all([get(authorize), get('/consent.mjs'), ...art.map(file => get(file.path))]);
  assert.equal(consent.status, 200, 'consent status');
  assert.equal(consent.url, origin + authorize, 'consent authorization query');
  const html = await consent.text();
  const config = /<script type="application\/json" id="kingdown-consent-config">([^<]+)<\/script>/.exec(html)?.[1];
  assert(config, 'consent configuration');
  assert.equal(`${JSON.parse(config).supabaseUrl}/auth/v1`, issuer, 'consent issuer');
  assert(html.includes('src="/consent.mjs"'), 'consent script reference');
  assert.equal(liveScript.status, 200, 'consent script status');
  assert(script.equals(Buffer.from(await liveScript.arrayBuffer())), 'consent script differs from the build');
  for (const [i, file] of art.entries()) {
    const response = liveArt[i];
    assert.equal(response.status, 200, `${file.path} status`);
    for (const [name, value] of Object.entries(file.headers)) assert.equal(response.headers.get(name), value, `${file.path} ${name}`);
    assert(file.bytes.equals(Buffer.from(await response.arrayBuffer())), `${file.path} differs from the build`);
  }
}

for (;;) {
  try {
    await check();
    const served = [chatgpt && `ChatGPT plugin: both metadata paths, unsigned challenge and ${art.length} art files with built headers`, muse && 'Muse connector: metadata and unsigned challenge', consentBuilt && 'consent query/script'].filter(Boolean);
    console.log(`plugin-live-check: pass: ${origin}; ${served.length ? served.join('; ') : 'ChatGPT plugin parked'}${parkedPaths.length ? `; ${parkedPaths.length} parked paths answer 404 to GET and POST` : ''}`);
    break;
  } catch (error) {
    if (Date.now() >= deadline) {
      // Do not print provider responses or embedded public configuration.
      console.error(`plugin-live-check: FAIL: ${error.code === 'ERR_ASSERTION' ? error.message.split('\n')[0] : 'request failed'}`);
      process.exit(1);
    }
    await new Promise(done => setTimeout(done, Math.min(5000, deadline - Date.now())));
  }
}
