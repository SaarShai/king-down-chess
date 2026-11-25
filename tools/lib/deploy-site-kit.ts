// Local live sites for the deploy tests (secrets-and-public-gates/10). A local server stands in for the
// live site. It serves a set of files and records each request; a request with a cookie header gets a 400
// and is recorded. Each test file that uses it calls `afterEach(closeSites)`.
import { spawn } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const liveCheck = fileURLToPath(new URL('../deploy-live-check.mjs', import.meta.url));
export const keepAssets = fileURLToPath(new URL('../deploy-keep-assets.mjs', import.meta.url));
export const pluginLiveCheck = fileURLToPath(new URL('../deploy-plugin-live-check.mjs', import.meta.url));

const folders: string[] = [];
const servers: { close: () => void }[] = [];
export function closeSites() {
  while (servers.length) servers.pop()!.close();
  while (folders.length) rmSync(folders.pop()!, { recursive: true, force: true });
}

/** The pages of a build: the entry script name is the bundle name. */
const offlineFiles = ['./', 'index.html', 'assets/style.css', 'assets/lazy.js', 'assets/ai-worker.js', 'fonts/game.woff2', 'icons/game.png', 'ui/board.webp', 'ui/piece.svg', 'manifest.webmanifest'];
export const googleVerification = 'googlea1baf648ae09b150.html';
export const pages = (bundle = 'index-Abc123_x', terms = 'Terms v1') => ({
  'index.html': `<!doctype html><html><head><script type="module" crossorigin src="./assets/${bundle}.js"></script></head><body></body></html>`,
  'privacy.html': '<!doctype html><title>Privacy</title><p>Privacy v1</p>\n',
  'terms.html': `<!doctype html><title>Terms</title><p>${terms}</p>\n`,
  'delete-data.html': '<!doctype html><title>Delete data</title><p>Delete v1</p>\n',
  'support.html': '<!doctype html><title>Support</title><p>Support v1</p>\n',
  [googleVerification]: `google-site-verification: ${googleVerification}\n`,
  'sw.js': `const VERSION = 'build-v1';\nconst POLICY = 'public-build-v1';\nconst ALLOWLIST = ${JSON.stringify([...offlineFiles, `assets/${bundle}.js`])};\nconst PRECACHE = ${JSON.stringify([...offlineFiles, `assets/${bundle}.js`])};`,
  [`assets/${bundle}.js`]: 'entry-v1',
  'assets/style.css': 'body { color: black; }',
  'assets/lazy.js': 'lazy-v1',
  'assets/ai-worker.js': 'worker-v1',
  'fonts/game.woff2': 'font-v1',
  'icons/game.png': 'icon-v1',
  'ui/board.webp': 'board-v1',
  'ui/piece.svg': '<svg/>',
  'manifest.webmanifest': '{}',
});
export const appPages = ['/play', '/play/', '/play/profile', '/play/settings', '/g/00000000-0000-4000-8000-000000000000', '/j', '/j/'];
export const closedPages = ['/play.html', '/j/deploy-check-inert-token', '/deploy-check-unknown'];
const apiPaths = ['/api', '/api/status', '/api/games', '/api/me/games'];
export const apiProbes = ['GET /api', 'POST /api', 'GET /api/status', 'POST /api/status', 'GET /api/me/games', 'POST /api/games'];
export const apiClosure = JSON.stringify({ code: 'NOT_FOUND', message: 'Not found' });
type Access = 'closed' | 'open';
/** The site API's answer to an unsigned probe while the 0016 switch is `access` (src/api/http.ts). */
function apiAnswer(method: string, path: string, access: Access): [number, unknown] {
  if (path === '/api') return [404, { code: 'NOT_FOUND', message: 'Not found' }];
  if (path === '/api/status' && method === 'GET') return [200, { account_access: access, valid_for_ms: access === 'open' ? 4999 : 0 }];
  if (`${method} ${path}` === 'GET /api/me/games' || `${method} ${path}` === 'POST /api/games') return access === 'open' ? [401, { code: 'UNAUTHENTICATED', message: 'Sign in again' }] : [503, { code: 'UNAVAILABLE', message: 'Account play is temporarily unavailable.' }];
  return [405, { code: 'NOT_ALLOWED', message: 'Method not allowed' }];
}
/** Serve an app page or an API answer as the site routes do; false for any other path. */
function siteRoute(req: IncomingMessage, res: ServerResponse, path: string, files: Record<string, string>, access: Access) {
  if (appPages.includes(path)) { res.writeHead(200, { 'content-type': 'text/html' }).end(files['index.html']); return true; }
  if (!apiPaths.includes(path)) return false;
  const [status, body] = apiAnswer(req.method ?? 'GET', path, access);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }).end(JSON.stringify(body));
  return true;
}
const contentType = (path: string) => ({ js: 'text/javascript', css: 'text/css', json: 'application/json', woff2: 'font/woff2', png: 'image/png', webp: 'image/webp', svg: 'image/svg+xml', webmanifest: 'application/manifest+json', wav: 'audio/wav' })[path.split('.').at(-1)!] ?? 'text/html';

/** A build folder with the given pages. */
export function buildFolder(files: Record<string, string>) {
  const dir = mkdtempSync(join(realpathSync(tmpdir()), 'deploy-build-'));
  folders.push(dir);
  for (const [name, text] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, name)), { recursive: true });
    writeFileSync(join(dir, name), text);
  }
  return dir;
}

/** The files of a folder by path, as `pages()` gives them. */
export const tree = (dir: string): Record<string, string> => Object.fromEntries(readdirSync(dir, { recursive: true }).map(String)
  .filter(file => statSync(join(dir, file)).isFile()).map(file => [file, readFileSync(join(dir, file), 'utf8')]));

/** A folder that a local site serves as the live site: `files` until the fake CLI puts the publish copy
 *  there (STUB_PUBLISH_DIR), as Vercel switches to a new deployment. */
export function liveFolder(files: Record<string, string>) {
  const dir = join(buildFolder({}), 'live');
  cpSync(buildFolder(files), dir, { recursive: true });
  return dir;
}

/** An old live build: its bundle imports a lazy chunk, the chunk names a style and the style an image. */
export const oldBuild = (): Record<string, string> => ({
  ...pages('index-OldA1234'),
  'assets/index-OldA1234.js': 'import("./chunk-OldB1234.js")',
  'assets/chunk-OldB1234.js': 'const style = "assets/style-OldC1234.css";',
  'assets/style-OldC1234.css': 'body { background: url(/assets/art-OldD1234.webp) }',
  'assets/art-OldD1234.webp': 'old art',
});

/** A local site. `files` can change between requests; `/` serves `index.html`. */
export async function site(files: () => Record<string, string>, challengeReply: { status?: number; type?: string | null; location?: string; path?: string; body?: string; cache?: string | null; drop?: number; delayMs?: number } = {}, access: Access = 'closed') {
  const requests: { path: string; method?: string; cookie?: string }[] = [];
  let active = 0, peak = 0;
  const server = createServer(async (req, res) => {
    const path = (req.url ?? '/').split('?')[0];
    requests.push({ path, method: req.method, cookie: req.headers.cookie });
    peak = Math.max(peak, ++active);
    res.once('close', () => { active--; });
    // drop: close the connection with no reply this many times, as a network fault does.
    if (challengeReply.drop && path === challengeReply.path) { challengeReply.drop--; req.socket.destroy(); return; }
    if (req.headers.cookie !== undefined) { res.writeHead(400).end('cookie sent'); return; }
    if (challengeReply.delayMs && (!challengeReply.path || path === challengeReply.path)) await new Promise(done => setTimeout(done, challengeReply.delayMs));
    const body = files()[path === '/' ? (files()['solo-launch.json'] ? 'next.html' : 'index.html') : path.slice(1)];
    if (path === (challengeReply.path ?? '/.well-known/openai-apps-challenge')) {
      const api = apiPaths.includes(path);
      const type = challengeReply.type === undefined ? (api ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8') : challengeReply.type;
      const cache = challengeReply.cache === undefined && api ? 'no-store' : challengeReply.cache;
      res.writeHead(challengeReply.status ?? (body === undefined ? 404 : 200), { ...(type ? { 'content-type': type } : {}), ...(cache ? { 'cache-control': cache } : {}), ...(challengeReply.location ? { location: challengeReply.location } : {}) }).end(challengeReply.body ?? body);
      return;
    }
    if (body === undefined && siteRoute(req, res, path, files(), access)) return;
    if (body === undefined) { res.writeHead(404).end('not found'); return; }
    res.writeHead(200, { 'content-type': contentType(path), 'set-cookie': 'visit=1; Path=/', ...(/^\/character-runtime\/assets\/[a-f0-9]{64}\.webp$/.test(path) ? {'cache-control':'public, max-age=31536000, immutable'} : {}) }).end(body);
  });
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
  servers.push(server);
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return { url, requests, get peak() { return peak; } };
}

/** Runs a command without a block on the event loop, so that the local site can answer. */
export function runAsync(command: string, args: string[], options: { cwd?: string; env: Record<string, string | undefined> }) {
  return new Promise<{ status: number | null; stdout: string; stderr: string; seconds: number }>(done => {
    const start = Date.now();
    const child = spawn(command, args, { cwd: options.cwd, env: options.env });
    let stdout = '', stderr = '';
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('close', status => done({ status, stdout, stderr, seconds: (Date.now() - start) / 1000 }));
  });
}

export const check = (folder: string, url: string, timeoutMs = 1500) =>
  runAsync(process.execPath, [liveCheck, folder], { env: { ...process.env, DEPLOY_LIVE_URL: url, DEPLOY_LIVE_TIMEOUT_MS: String(timeoutMs) } });

export const keep = (folder: string, url: string) => runAsync(process.execPath, [keepAssets, folder], { env: { ...process.env, DEPLOY_LIVE_URL: url } });

export async function pluginSite(fault = '', files?: Record<string, string> | (() => Record<string, string>)) {
  const requests: { path: string; method?: string; cookie?: string; authorization?: string }[] = [];
  let url = '';
  const supabase = fault === 'staging' ? 'https://puhspsyjyzaghmgtkzqd.supabase.co' : 'https://utqzovjmclfyojedmwok.supabase.co';
  const server = createServer(async (req, res) => {
    const path = req.url ?? '/';
    requests.push({ path, method: req.method, cookie: req.headers.cookie, authorization: req.headers.authorization });
    res.setHeader('set-cookie', 'visit=1; Path=/');
    const served = typeof files === 'function' ? files() : files;
    const file = served?.[path === '/' ? 'index.html' : path.slice(1)];
    if (file !== undefined) { res.setHeader('content-type', contentType(path)); res.end(file); }
    // parked: the live site without the ChatGPT plugin (tools/chatgpt-plugin.mjs) answers 404 for each plugin path.
    else if (fault === 'parked') { if (!(served && siteRoute(req, res, path, served, 'closed'))) res.writeHead(404).end(); }
    // muse and both: the Muse connector serves its resource; muse parks each ChatGPT path but the consent page.
    // staging: the staging Muse connector, with the staging account issuer.
    else if (['muse', 'both', 'staging'].includes(fault) && path === '/.well-known/oauth-protected-resource/muse/mcp') res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ resource: `${url}/muse/mcp`, authorization_servers: [`${supabase}/auth/v1`], scopes_supported: ['openid'] }));
    else if (['muse', 'both', 'staging'].includes(fault) && path === '/muse/mcp') res.writeHead(401, { 'www-authenticate': `Bearer resource_metadata="${url}/.well-known/oauth-protected-resource/muse/mcp", scope="openid"` }).end('{}');
    else if (['muse', 'staging'].includes(fault) && (/^\/(mcp|plugin-art\/|\.well-known\/)/.test(path))) res.writeHead(404).end();
    else if (path === '/.well-known/oauth-protected-resource/mcp' || path === '/.well-known/oauth-protected-resource') {
      if (fault === 'metadata-root' && path === '/.well-known/oauth-protected-resource') { res.writeHead(404).end(); return; }
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ resource: `${url}/mcp`, authorization_servers: [fault === 'issuer' ? 'https://wrong.example/auth/v1' : 'https://utqzovjmclfyojedmwok.supabase.co/auth/v1'], scopes_supported: ['openid'] }));
    } else if (path === '/mcp') {
      res.writeHead(fault === 'challenge' ? 200 : 401, { 'www-authenticate': `Bearer resource_metadata="${url}/.well-known/oauth-protected-resource/mcp", scope="openid"` }).end('{}');
    } else if (path.split('?')[0] === '/authorize') {
      if (fault === 'query' && path.includes('?')) { res.writeHead(307, { location: '/authorize' }).end(); return; }
      res.setHeader('content-type', 'text/html');
      res.end(`<script type="application/json" id="kingdown-consent-config">{"supabaseUrl":"${supabase}"}</script><script type="module" src="/consent.mjs"></script>`);
    } else if (path === '/plugin-art/test-art.webp') {
      const headers: Record<string, string> = { ...artHeaders };
      if (fault === 'csp') headers['Content-Security-Policy'] = "default-src 'none'";
      if (fault === 'cors') {
        delete headers['Access-Control-Allow-Origin'];
        // This reply takes longer than the old 250 ms deadline.
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      if (fault === 'charset') {
        headers['Content-Type'] += '; charset=utf-8';
        await new Promise(resolve => setTimeout(resolve, 1600));
      }
      res.writeHead(200, headers).end(fault === 'art' ? 'stale-art' : 'art-v1');
    } else if (path === '/consent.mjs') res.end(fault === 'script' ? 'old-consent' : 'consent-v1');
    else if (!(served && siteRoute(req, res, path, served, 'closed'))) res.writeHead(404).end();
  });
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
  servers.push(server);
  url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return { url, requests };
}

const artHeaders = { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=31536000, immutable', 'Access-Control-Allow-Origin': '*', 'Cross-Origin-Resource-Policy': 'cross-origin', 'Content-Security-Policy': "default-src 'self'" };
export function pluginFolder() {
  const tree = buildFolder({}), folder = join(tree, 'functions/mcp.func');
  mkdirSync(folder, { recursive: true }); mkdirSync(join(tree, 'static/plugin-art'), { recursive: true });
  writeFileSync(join(folder, 'consent.mjs'), 'consent-v1');
  writeFileSync(join(tree, 'static/plugin-art/test-art.webp'), 'art-v1');
  writeFileSync(join(tree, 'config.json'), JSON.stringify({ version: 3, routes: [{ src: '^/plugin-art/', headers: artHeaders, continue: true }] }));
  return folder;
}
