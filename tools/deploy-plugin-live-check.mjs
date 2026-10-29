// Unsigned release check. No player token, session cookie or match operation is used.
// It checks the surface that the build has. A build without the consent script parks the ChatGPT plugin
// (tools/chatgpt-plugin.mjs): then each plugin path must answer 404.
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { PARKED_PATHS } from './chatgpt-plugin.mjs';

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
const plugin = existsSync(join(folder, 'consent.mjs'));
const script = plugin ? readFileSync(join(folder, 'consent.mjs')) : undefined;
// One made-up art name per parked check: the parked tree has no board art.
const parkedPaths = [...PARKED_PATHS, '/plugin-art/deploy-check-0000.webp'];
const artDir = join(folder, '../../static/plugin-art'), configFile = join(folder, '../../config.json');
const routes = existsSync(configFile) ? JSON.parse(readFileSync(configFile, 'utf8')).routes ?? [] : [];
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
const resource = `${origin}/mcp`;
const metadataUrl = `${origin}/.well-known/oauth-protected-resource/mcp`;
const deadline = Date.now() + limit;

const get = (path, options = {}) => fetch(origin + path, {
  ...options, credentials: 'omit', redirect: 'error',
  headers: { 'cache-control': 'no-cache', ...options.headers },
  signal: AbortSignal.timeout(Math.max(1, Math.min(15_000, deadline - Date.now()))),
});

/** The parked plugin: no metadata, MCP, consent page, consent script or board art. */
async function parkedCheck() {
  const responses = await Promise.all(parkedPaths.flatMap(path => [get(path), get(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })]));
  for (const [i, response] of responses.entries()) assert.equal(response.status, 404, `${i % 2 ? 'POST' : 'GET'} ${parkedPaths[i >> 1]} status (parked)`);
}

async function check() {
  const [discovery, rootDiscovery, challenge, consent, liveScript, ...liveArt] = await Promise.all([
    get('/.well-known/oauth-protected-resource/mcp'), get('/.well-known/oauth-protected-resource'),
    get('/mcp', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }),
    get(authorize), get('/consent.mjs'), ...art.map(file => get(file.path)),
  ]);
  assert.equal(discovery.status, 200, 'discovery status');
  const metadata = await discovery.json();
  assert.equal(metadata.resource, resource, 'discovery resource');
  assert.deepEqual(metadata.authorization_servers, [issuer], 'discovery issuer');
  assert(metadata.scopes_supported?.includes('openid'), 'discovery scope');
  assert.equal(rootDiscovery.status, 200, 'root discovery status');
  assert.deepEqual(await rootDiscovery.json(), metadata, 'root discovery metadata');
  assert.equal(challenge.status, 401, 'unsigned MCP status');
  assert.equal(challenge.headers.get('www-authenticate'), `Bearer resource_metadata="${metadataUrl}", scope="openid"`, 'OAuth challenge');
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
    if (plugin) {
      await check();
      console.log(`plugin-live-check: pass: ${origin}; both metadata paths, unsigned challenge, consent query/script and ${art.length} art files with built headers`);
    } else {
      await parkedCheck();
      console.log(`plugin-live-check: pass: ${origin}; ChatGPT plugin parked: ${parkedPaths.length} plugin paths answer 404 to GET and POST`);
    }
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
