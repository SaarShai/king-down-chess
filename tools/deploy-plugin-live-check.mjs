// Unsigned release check. No player token, session cookie or match operation is used.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

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
const script = readFileSync(join(folder, 'consent.mjs'));
const issuer = 'https://utqzovjmclfyojedmwok.supabase.co/auth/v1';
const resource = `${origin}/mcp`;
const metadataUrl = `${origin}/.well-known/oauth-protected-resource/mcp`;
const deadline = Date.now() + limit;

async function check() {
  const get = (path, options = {}) => fetch(origin + path, {
    ...options, credentials: 'omit', redirect: 'error',
    headers: { 'cache-control': 'no-cache', ...options.headers },
    signal: AbortSignal.timeout(Math.max(1, Math.min(15_000, deadline - Date.now()))),
  });
  const [discovery, challenge, consent, liveScript] = await Promise.all([
    get('/.well-known/oauth-protected-resource/mcp'),
    get('/mcp', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }),
    get('/authorize'), get('/consent.mjs'),
  ]);
  assert.equal(discovery.status, 200, 'discovery status');
  const metadata = await discovery.json();
  assert.equal(metadata.resource, resource, 'discovery resource');
  assert.deepEqual(metadata.authorization_servers, [issuer], 'discovery issuer');
  assert(metadata.scopes_supported?.includes('openid'), 'discovery scope');
  assert.equal(challenge.status, 401, 'unsigned MCP status');
  assert.equal(challenge.headers.get('www-authenticate'), `Bearer resource_metadata="${metadataUrl}", scope="openid"`, 'OAuth challenge');
  assert.equal(consent.status, 200, 'consent status');
  const html = await consent.text();
  const config = /<script type="application\/json" id="kingdown-consent-config">([^<]+)<\/script>/.exec(html)?.[1];
  assert(config, 'consent configuration');
  assert.equal(`${JSON.parse(config).supabaseUrl}/auth/v1`, issuer, 'consent issuer');
  assert(html.includes('src="/consent.mjs"'), 'consent script reference');
  assert.equal(liveScript.status, 200, 'consent script status');
  assert(script.equals(Buffer.from(await liveScript.arrayBuffer())), 'consent script differs from the build');
}

for (;;) {
  try {
    await check();
    console.log(`plugin-live-check: pass: ${origin}; discovery, unsigned challenge and built consent script`);
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
