import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { buildPluginServer, vercelRoutes } from './plugin-server-build.mjs';

it('routes only the site API boundary to the one MCP function for every method', () => {
  const site = mkdtempSync(join(tmpdir(), 'kingdown-api-routes-'));
  try {
    const routes = vercelRoutes(site), rule = { src: '^/api(?:/.*)?$', dest: '/mcp' };
    expect(routes.filter(route => new RegExp(route.src).test('/api'))).toEqual([rule]);
    for (const path of ['/api', '/api/', '/api/games/a', '/api/games/a/commands', '/api/unknown/deep']) {
      expect(routes.filter(route => new RegExp(route.src).test(path)), path).toEqual([rule]);
    }
    for (const path of ['/apix', '/apiary', '/API', '/', '/play/', '/g/a', '/j', '/mcp', '/authorize', '/plugin-art/a.webp', '/internal/tick', '/.well-known/oauth-protected-resource']) {
      expect(new RegExp(rule.src).test(path), path).toBe(false);
    }
    expect(routes).toContainEqual({ src: '^/internal/.+$', dest: '/internal' });
    expect(routes.filter(route => route.src.startsWith('^/plugin-art/'))).toEqual(vercelRoutes());
    expect(vercelRoutes().some(route => new RegExp(route.src).test('/api'))).toBe(false);
    // The parked ChatGPT plugin (tools/chatgpt-plugin.mjs) has no art routes; with the plugin in, one per art format.
    expect(vercelRoutes()).toEqual([]);
    expect(vercelRoutes(undefined, { chatgpt: true }).map(route => route.src)).toEqual(['webp', 'png', 'svg', 'woff2'].map(type => `^/plugin-art/[\\w-]+\\.${type}$`));
  } finally { rmSync(site, { recursive: true, force: true }); }
});

it('serves account routes from the shared browser entry', () => {
  const routes = vercelRoutes('/missing/site'), rule = routes.find(route => route.dest === '/index.html')!;
  for (const path of ['/play', '/play/', '/play/settings', '/play/profile', '/g/uuid', '/j', '/j/']) expect(new RegExp(rule.src).test(path), path).toBe(true);
  for (const path of ['/', '/api/status', '/mcp', '/j/token', '/player', '/game/uuid', '/g/a/b']) expect(new RegExp(rule.src).test(path), path).toBe(false);
  expect(vercelRoutes().some(route => route.dest === '/index.html')).toBe(false);
});

it('keeps every isolated operation set equal to the handler route keys', () => {
  const http = readFileSync(new URL('../src/api/http.ts', import.meta.url), 'utf8');
  const keys = [...http.matchAll(/^  '([A-Z]+ \/api[^']*)':/gm)].map(match => match[1]).sort();
  expect(keys.length).toBeGreaterThan(0);
  for (const file of ['./plugin-server.mjs', '../src/api/http.test.ts', '../src/api/http.db.test.ts']) {
    const source = readFileSync(new URL(file, import.meta.url), 'utf8');
    const set = /const (?:ENABLED_WEB_OPERATIONS|operations) = new Set\(\[([\s\S]*?)\]\);/.exec(source)![1];
    expect([...set.matchAll(/'([^']+)'/g)].map(match => match[1]).sort(), file).toEqual(keys);
  }
});

it('omits the website recorder and the parked ChatGPT plugin surface from the emitted server', async () => {
 const out = mkdtempSync(join(tmpdir(), 'plugin-without-recorder-'));
 try {
  const output = await buildPluginServer(out, { vercel: true });
  const server = readFileSync(join(output, 'functions/mcp.func/server.mjs'), 'utf8');
  for (const text of ['/api/client-errors', 'client_errors', 'Unlisted message', 'Error message exceeds limit', 'Cannot read properties of [value]', '500ms']) expect(server.includes(text), text).toBe(false);
  expect(server).toContain('King Down API failed');
  // The parked build drops the MCP handler code, not only its routes. (PluginService stays: the website API shares its
  // rate limits, so its tool keys such as kingdown_open stay too.)
  for (const text of ['registerResource', 'oauth-protected-resource', 'chatgpt.com']) expect(server.includes(text), text).toBe(false);
  // Parked: no widget, art, consent page or OAuth function path; only the one function and its internal link.
  for (const path of ['functions/mcp.func/board.html', 'functions/mcp.func/consent.html', 'functions/mcp.func/consent.mjs', 'static/plugin-art', 'functions/authorize.func', 'functions/consent.mjs.func', 'functions/.well-known']) expect(existsSync(join(output, path)), path).toBe(false);
  expect(readdirSync(join(output, 'functions')).sort()).toEqual(['mcp.func']);
  expect(JSON.parse(readFileSync(join(output, 'config.json'), 'utf8')).routes).toEqual([]);
 } finally { rmSync(out, { recursive: true, force: true }); }
}, 60_000);

it('refuses a recovery rehearsal on a parked build instead of reporting a pass', () => {
  const release = mkdtempSync(join(tmpdir(), 'parked-release-')), recovery = mkdtempSync(join(tmpdir(), 'parked-recovery-'));
  try {
    const run = spawnSync(process.execPath, ['tools/plugin-server-check.mjs', release, recovery], { encoding: 'utf8', env: { PATH: process.env.PATH } });
    expect(run.status).not.toBe(0);
    expect(run.stderr).toContain('The parked build (CHATGPT_PLUGIN=false) has no recovery continuation check');
  } finally { rmSync(release, { recursive: true, force: true }); rmSync(recovery, { recursive: true, force: true }); }
});
it('keeps CI on the parked plugin source over compiled HTTP and PostgreSQL', () => {
  const workflow = readFileSync('.github/workflows/plugin-checks.yml', 'utf8');
  expect(workflow).toContain('- run: npm run plugin:build:chatgpt\n      - run: npm run plugin:server:check -- plugin-server-chatgpt\n');
  expect(JSON.parse(readFileSync('package.json', 'utf8')).scripts['plugin:build:chatgpt']).toBe('node tools/plugin-server-build.mjs plugin-server-chatgpt --chatgpt');
});
it('builds the legacy plugin target with the plugin surface that its release gates test', () => {
  // tools/deploy.sh --target plugin publishes this tree to kingdown-plugin after the plugin protocol and browser gates,
  // which test a `chatgpt: true` tree. A parked tree here would retire the old plugin behind gates that never saw it.
  const out = mkdtempSync(join(tmpdir(), 'legacy-plugin-target-'));
  try {
    const [command, ...args] = JSON.parse(readFileSync('package.json', 'utf8')).scripts['plugin:build:vercel'].split(' ');
    expect(command).toBe('node');
    const run = spawnSync(process.execPath, [...args, out], { encoding: 'utf8', env: { PATH: process.env.PATH } });
    expect(run.status, run.stderr).toBe(0);
    for (const path of ['functions/mcp.func/consent.mjs', 'functions/mcp.func/board.html', 'functions/authorize.func', 'functions/.well-known']) expect(existsSync(join(out, '.vercel/output', path)), path).toBe(true);
  } finally { rmSync(out, { recursive: true, force: true }); }
}, 120_000);
