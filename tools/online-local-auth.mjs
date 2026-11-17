/**
 * Loopback-only stand-in for Supabase Auth used by `npm run online:local`.
 * Refuses to start unless the target database is loopback and ends in `_test`.
 * Never imported by browser bundles or production server entrypoints.
 */
import { createHash, generateKeyPairSync, randomBytes, randomUUID } from 'node:crypto';
import { readFileSync, realpathSync } from 'node:fs';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { exportJWK, jwtVerify, SignJWT } from 'jose';
import pg from 'pg';
import { testDatabase } from './plugin-db-config.mjs';

export const LOCAL_ONLINE_AUTH_MARKER = 'KINGDOWN_LOCAL_ONLINE_AUTH_STANDIN';
const ACCOUNTS_PATH = new URL('./online-local-accounts.json', import.meta.url);
const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '::1', '[::1]']);
const isLoopbackHost = host => LOOPBACK_HOSTS.has(String(host).toLowerCase());
const esc = value => String(value).replace(/[&<>"']/g, ch => `&#${ch.charCodeAt(0)};`);

/** Validate that the stand-in runs only on loopback HTTP against a `_test` database outside production. */
export function validateLocalAuthEnv({ databaseUrl, authOrigin, pageOrigin, nodeEnv = process.env.NODE_ENV }) {
  if (nodeEnv === 'production') throw new Error('Local auth stand-in refuses NODE_ENV=production');
  if (!databaseUrl) throw new Error('PLUGIN_TEST_DATABASE_URL is required');
  testDatabase(databaseUrl);
  let auth, page;
  try { auth = new URL(authOrigin ?? ''); } catch { throw new Error('Valid local authOrigin URL is required'); }
  try { page = new URL(pageOrigin ?? ''); } catch { throw new Error('Valid local pageOrigin URL is required'); }
  for (const [label, parsed] of [['authOrigin', auth], ['pageOrigin', page]]) {
    if (parsed.protocol !== 'http:' || !isLoopbackHost(parsed.hostname) || parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) {
      throw new Error(`${label} must be a bare loopback HTTP origin`);
    }
  }
  return { databaseUrl, authOrigin: auth.origin, pageOrigin: page.origin };
}

/** Load and validate the static seeded test accounts fixture. */
export function readLocalAccounts(path = ACCOUNTS_PATH) {
  const list = JSON.parse(readFileSync(path, 'utf8'));
  if (!Array.isArray(list) || list.length === 0) throw new Error('Seeded accounts fixture must be a non-empty array');
  return list;
}

function readJsonBody(req, limit = 32 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let bytes = 0;
    req.on('data', chunk => {
      bytes += chunk.length;
      if (bytes > limit) { reject(new Error('Body too large')); req.destroy(); return; }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); }
      catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

function writeJson(res, status, body, pageOrigin) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': pageOrigin,
    Vary: 'Origin',
    'X-Kingdown-Local-Auth': LOCAL_ONLINE_AUTH_MARKER,
  });
  res.end(JSON.stringify(body));
}

function writeHtml(res, status, html, pageOrigin) {
  res.writeHead(status, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': pageOrigin,
    'X-Kingdown-Local-Auth': LOCAL_ONLINE_AUTH_MARKER,
  });
  res.end(html);
}

function chooserHtml(accounts, authorizeUrl) {
  const links = accounts.map(account => {
    const next = new URL(authorizeUrl.href);
    next.searchParams.set('as', account.handle);
    const kind = account.provider === 'email' ? 'email' : account.provider;
    const note = account.raw_user_meta_data?.avatar_url ? 'with picture' : 'no picture';
    return `<li style="margin:8px 0"><a data-account="${esc(account.handle)}" href="${esc(next.href)}" style="display:inline-block;padding:10px 14px;border:1px solid #333;border-radius:8px;text-decoration:none;color:#111;background:#f7f5ed;font-family:sans-serif">Sign in as <strong>${esc(account.handle)}</strong> (${esc(kind)}, ${esc(note)})</a></li>`;
  }).join('');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="kingdown-marker" content="${LOCAL_ONLINE_AUTH_MARKER}"><title>Local test sign-in</title></head>
<body style="font-family:sans-serif;max-width:460px;margin:48px auto;padding:0 16px">
<h1>Local test sign-in</h1>
<p>Choose a seeded test account. This page runs only on loopback against a disposable test database.</p>
<ul style="list-style:none;padding:0">${links}</ul>
</body></html>`;
}

function supabaseUser(account, row) {
  const now = new Date().toISOString();
  const meta = row.raw_user_meta_data && typeof row.raw_user_meta_data === 'object' ? row.raw_user_meta_data : {};
  return {
    id: row.id,
    aud: 'authenticated',
    role: 'authenticated',
    email: row.email,
    email_confirmed_at: '2026-01-01T00:00:00.000Z',
    confirmed_at: '2026-01-01T00:00:00.000Z',
    last_sign_in_at: now,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: now,
    is_anonymous: false,
    app_metadata: { provider: account.provider, providers: [account.provider] },
    user_metadata: meta,
    identities: [{
      identity_id: row.id,
      id: row.id,
      user_id: row.id,
      identity_data: { email: row.email, email_verified: true, sub: row.id },
      provider: account.provider,
      last_sign_in_at: now,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: now,
    }],
  };
}

/** Start the loopback Auth stand-in HTTP server and return handle + close helper. */
export async function startLocalAuthServer({ databaseUrl, authOrigin, pageOrigin, nodeEnv = process.env.NODE_ENV }) {
  const cfg = validateLocalAuthEnv({ databaseUrl, authOrigin, pageOrigin, nodeEnv });
  const accounts = readLocalAccounts();
  const byHandle = new Map(accounts.map(a => [a.handle, a]));
  const byEmail = new Map(accounts.map(a => [a.email.toLowerCase(), a]));
  const byId = new Map(accounts.map(a => [a.id.toLowerCase(), a]));

  const pool = new pg.Pool({ connectionString: cfg.databaseUrl, max: 3, ssl: false });
  const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const jwk = { ...(await exportJWK(publicKey)), kid: 'local-online-1', alg: 'ES256', use: 'sig' };
  const issuer = `${cfg.authOrigin}/auth/v1`;

  const pkceCodes = new Map();
  const refreshTokens = new Map();
  const activeSessions = new Map();
  const pendingOtps = new Map();

  async function loadUserRow(id) {
    const result = await pool.query('select id, email, raw_user_meta_data, banned_until from auth.users where id = $1', [id]);
    const row = result.rows[0];
    if (!row) return null;
    if (row.banned_until && Date.parse(row.banned_until) > Date.now()) return { ...row, banned: true };
    return { ...row, banned: false };
  }

  async function mintSession(account, row) {
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = 3600;
    const sessionId = randomUUID();
    const refreshToken = randomBytes(24).toString('base64url');
    const user = supabaseUser(account, row);
    activeSessions.set(sessionId, { userId: row.id.toLowerCase(), handle: account.handle });
    refreshTokens.set(refreshToken, { userId: row.id.toLowerCase(), sessionId });
    const accessToken = await new SignJWT({
      iss: issuer,
      aud: 'authenticated',
      sub: row.id,
      role: 'authenticated',
      is_anonymous: false,
      session_id: sessionId,
      email: row.email,
      app_metadata: user.app_metadata,
      user_metadata: user.user_metadata,
    }).setProtectedHeader({ alg: 'ES256', kid: 'local-online-1', typ: 'JWT' })
      .setIssuedAt(now)
      .setExpirationTime(now + expiresIn)
      .sign(privateKey);
    return {
      access_token: accessToken,
      token_type: 'bearer',
      expires_in: expiresIn,
      expires_at: now + expiresIn,
      refresh_token: refreshToken,
      user,
    };
  }

  const server = createServer(async (req, res) => {
    try {
      if (req.method === 'OPTIONS') {
        res.writeHead(204, {
          'Access-Control-Allow-Origin': cfg.pageOrigin,
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'apikey, authorization, content-type, x-client-info, x-supabase-api-version',
          'Access-Control-Max-Age': '600',
          Vary: 'Origin',
          'X-Kingdown-Local-Auth': LOCAL_ONLINE_AUTH_MARKER,
        });
        res.end();
        return;
      }

      const url = new URL(req.url ?? '/', cfg.authOrigin);
      const path = url.pathname;

      if (req.method === 'GET' && path === '/auth/v1/settings') {
        writeJson(res, 200, { external: { google: true, github: true, facebook: true, email: true } }, cfg.pageOrigin);
        return;
      }

      if (req.method === 'GET' && path === '/auth/v1/.well-known/jwks.json') {
        writeJson(res, 200, { keys: [jwk] }, cfg.pageOrigin);
        return;
      }

      if (req.method === 'GET' && path === '/auth/v1/.well-known/openid-configuration') {
        writeJson(res, 200, { issuer, jwks_uri: `${issuer}/.well-known/jwks.json` }, cfg.pageOrigin);
        return;
      }

      if (req.method === 'GET' && path === '/auth/v1/authorize') {
        const redirectRaw = url.searchParams.get('redirect_to') ?? '';
        let redirectUrl;
        try { redirectUrl = new URL(redirectRaw); } catch { redirectUrl = null; }
        if (!redirectUrl || redirectUrl.origin !== cfg.pageOrigin || redirectUrl.pathname !== '/next.html') {
          writeJson(res, 400, { error: 'invalid_request', error_description: 'redirect_to must point to the local page /next.html' }, cfg.pageOrigin);
          return;
        }
        const challenge = url.searchParams.get('code_challenge') ?? '';
        const method = (url.searchParams.get('code_challenge_method') ?? '').toLowerCase();
        if (!challenge || method !== 's256') {
          writeJson(res, 400, { error: 'invalid_request', error_description: 'PKCE S256 challenge is required' }, cfg.pageOrigin);
          return;
        }
        let handle = url.searchParams.get('as') ?? '';
        if (!handle && req.headers.referer) {
          try {
            const ref = new URL(req.headers.referer);
            if (ref.origin === cfg.pageOrigin) handle = ref.searchParams.get('as') ?? '';
          } catch { /* ignore invalid referer */ }
        }
        if (!handle) {
          writeHtml(res, 200, chooserHtml(accounts, url), cfg.pageOrigin);
          return;
        }
        const account = byHandle.get(handle);
        if (!account) {
          writeJson(res, 400, { error: 'invalid_request', error_description: `Unknown local test account: ${handle}` }, cfg.pageOrigin);
          return;
        }
        const row = await loadUserRow(account.id);
        if (!row || row.banned) {
          writeJson(res, 403, { error: 'access_denied', error_description: 'Test account is unavailable in database' }, cfg.pageOrigin);
          return;
        }
        const code = randomBytes(16).toString('base64url');
        pkceCodes.set(code, { userId: account.id.toLowerCase(), codeChallenge: challenge, expiresAt: Date.now() + 60_000 });
        redirectUrl.searchParams.set('code', code);
        res.writeHead(302, {
          Location: redirectUrl.href,
          'Cache-Control': 'no-store',
          'X-Kingdown-Local-Auth': LOCAL_ONLINE_AUTH_MARKER,
        });
        res.end();
        return;
      }

      if (req.method === 'POST' && path === '/auth/v1/token') {
        const grantType = url.searchParams.get('grant_type');
        const body = await readJsonBody(req);
        if (grantType === 'pkce') {
          const code = typeof body.auth_code === 'string' ? body.auth_code : '';
          const verifier = typeof body.code_verifier === 'string' ? body.code_verifier : '';
          const pending = pkceCodes.get(code);
          pkceCodes.delete(code);
          if (!pending || pending.expiresAt < Date.now() || !verifier) {
            writeJson(res, 400, { error: 'invalid_grant', error_description: 'Expired or missing PKCE authorization code', error_code: 'bad_code_verifier' }, cfg.pageOrigin);
            return;
          }
          const derived = createHash('sha256').update(verifier).digest('base64url');
          if (derived !== pending.codeChallenge) {
            writeJson(res, 400, { error: 'invalid_grant', error_description: 'PKCE code verifier mismatch', error_code: 'bad_code_verifier' }, cfg.pageOrigin);
            return;
          }
          const account = byId.get(pending.userId);
          const row = account ? await loadUserRow(account.id) : null;
          if (!account || !row || row.banned) {
            writeJson(res, 403, { error: 'access_denied', error_description: 'Account unavailable' }, cfg.pageOrigin);
            return;
          }
          writeJson(res, 200, await mintSession(account, row), cfg.pageOrigin);
          return;
        }
        if (grantType === 'refresh_token') {
          const token = typeof body.refresh_token === 'string' ? body.refresh_token : '';
          const entry = refreshTokens.get(token);
          refreshTokens.delete(token);
          if (!entry) {
            writeJson(res, 400, { error: 'invalid_grant', error_description: 'Invalid refresh token', error_code: 'refresh_token_not_found' }, cfg.pageOrigin);
            return;
          }
          activeSessions.delete(entry.sessionId);
          const account = byId.get(entry.userId);
          const row = account ? await loadUserRow(account.id) : null;
          if (!account || !row || row.banned) {
            writeJson(res, 403, { error: 'access_denied', error_description: 'Account unavailable' }, cfg.pageOrigin);
            return;
          }
          writeJson(res, 200, await mintSession(account, row), cfg.pageOrigin);
          return;
        }
        writeJson(res, 400, { error: 'unsupported_grant_type', error_description: 'Unsupported grant_type' }, cfg.pageOrigin);
        return;
      }

      if (req.method === 'POST' && path === '/auth/v1/otp') {
        const body = await readJsonBody(req);
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
        const account = byEmail.get(email);
        const row = account ? await loadUserRow(account.id) : null;
        if (!account || !row || row.banned) {
          writeJson(res, 400, { error_code: 'user_not_found', msg: 'Unknown test account email' }, cfg.pageOrigin);
          return;
        }
        pendingOtps.set(email, { expiresAt: Date.now() + 300_000 });
        writeJson(res, 200, {}, cfg.pageOrigin);
        return;
      }

      if (req.method === 'POST' && path === '/auth/v1/verify') {
        const body = await readJsonBody(req);
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
        const token = typeof body.token === 'string' ? body.token.trim() : '';
        const type = typeof body.type === 'string' ? body.type : '';
        const pending = pendingOtps.get(email);
        if (type !== 'email' || !pending || pending.expiresAt < Date.now() || !/^\d{6}$/.test(token)) {
          writeJson(res, 403, { error_code: 'otp_expired', msg: 'Invalid or expired email verification code' }, cfg.pageOrigin);
          return;
        }
        pendingOtps.delete(email);
        const account = byEmail.get(email);
        const row = account ? await loadUserRow(account.id) : null;
        if (!account || !row || row.banned) {
          writeJson(res, 403, { error_code: 'user_banned', msg: 'Account unavailable' }, cfg.pageOrigin);
          return;
        }
        writeJson(res, 200, await mintSession(account, row), cfg.pageOrigin);
        return;
      }

      if (req.method === 'GET' && path === '/auth/v1/user') {
        const header = req.headers.authorization ?? '';
        const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
        if (!token) { writeJson(res, 401, { error_code: 'bad_jwt', msg: 'Missing bearer token' }, cfg.pageOrigin); return; }
        let payload;
        try {
          ({ payload } = await jwtVerify(token, publicKey, { issuer, audience: 'authenticated', algorithms: ['ES256'] }));
        } catch {
          writeJson(res, 401, { error_code: 'bad_jwt', msg: 'Invalid bearer token' }, cfg.pageOrigin);
          return;
        }
        const sessionId = typeof payload.session_id === 'string' ? payload.session_id : '';
        if (!activeSessions.has(sessionId)) {
          writeJson(res, 401, { error_code: 'session_not_found', msg: 'Session ended' }, cfg.pageOrigin);
          return;
        }
        const sub = typeof payload.sub === 'string' ? payload.sub.toLowerCase() : '';
        const account = byId.get(sub);
        const row = account ? await loadUserRow(account.id) : null;
        if (!account || !row || row.banned) {
          writeJson(res, 403, { error_code: 'user_banned', msg: 'Account unavailable' }, cfg.pageOrigin);
          return;
        }
        writeJson(res, 200, supabaseUser(account, row), cfg.pageOrigin);
        return;
      }

      if (req.method === 'POST' && path === '/auth/v1/logout') {
        const header = req.headers.authorization ?? '';
        const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
        if (token) {
          try {
            const { payload } = await jwtVerify(token, publicKey, { issuer, audience: 'authenticated', algorithms: ['ES256'] });
            if (typeof payload.session_id === 'string') activeSessions.delete(payload.session_id);
          } catch { /* ignore expired tokens on logout */ }
        }
        res.writeHead(204, {
          'Access-Control-Allow-Origin': cfg.pageOrigin,
          Vary: 'Origin',
          'X-Kingdown-Local-Auth': LOCAL_ONLINE_AUTH_MARKER,
        });
        res.end();
        return;
      }

      writeJson(res, 404, { error: 'not_found' }, cfg.pageOrigin);
    } catch (error) {
      writeJson(res, 500, { error: 'server_error', message: error instanceof Error ? error.message : 'Unknown error' }, cfg.pageOrigin);
    }
  });

  const listenUrl = new URL(cfg.authOrigin);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(Number(listenUrl.port || 80), listenUrl.hostname.replace(/^\[|\]$/g, ''), resolve);
  });

  const close = async () => {
    await new Promise(resolve => { server.closeAllConnections(); server.close(resolve); });
    await pool.end();
  };
  return { server, close, origin: cfg.authOrigin };
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const instance = await startLocalAuthServer({
    databaseUrl: process.env.PLUGIN_TEST_DATABASE_URL,
    authOrigin: process.env.LOCAL_AUTH_ORIGIN,
    pageOrigin: process.env.KINGDOWN_PLUGIN_ORIGIN,
  });
  console.log(`Local online auth stand-in listening at ${instance.origin} (${LOCAL_ONLINE_AUTH_MARKER})`);
  const stop = async () => { await instance.close(); process.exit(0); };
  process.once('SIGINT', () => { void stop(); });
  process.once('SIGTERM', () => { void stop(); });
}
