import { randomUUID } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { build } from 'vite';
import { afterEach, expect, it } from 'vitest';
import { buildPluginServer, vercelRoutes } from './plugin-server-build.mjs';
import { CHATGPT_PLUGIN } from './chatgpt-plugin.mjs';

it('the site build keeps the domain challenge dot folder and exact bytes', async () => {
  const root = mkdtempSync(join(tmpdir(), 'kingdown-challenge-'));
  const challenge = '.well-known/openai-apps-challenge';
  const token = Buffer.from(randomUUID());
  try {
    mkdirSync(join(root, 'public/.well-known'), { recursive: true });
    writeFileSync(join(root, 'public', challenge), token);
    cpSync(resolve('public/sw.js'), join(root, 'public/sw.js'));
    writeFileSync(join(root, 'index.html'), '<!doctype html><title>Build check</title>');
    await build({ configFile: resolve('vite.config.ts'), root, logLevel: 'silent', envFile: false });
    expect(readFileSync(join(root, 'dist', challenge))).toEqual(token);
    const worker = readFileSync(join(root, 'dist/sw.js'), 'utf8');
    const precache = JSON.parse(/const PRECACHE = (\[.*\]);/.exec(worker)![1]);
    expect(precache).toEqual(['./']);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

const sites: string[] = [];
afterEach(() => {
  for (const site of sites.splice(0)) rmSync(site, { recursive: true, force: true });
});

function site(token?: string) {
  const root = mkdtempSync(join(tmpdir(), 'kingdown-challenge-routes-'));
  sites.push(root);
  if (token !== undefined) {
    mkdirSync(join(root, '.well-known'));
    writeFileSync(join(root, '.well-known/openai-apps-challenge'), token);
  }
  return root;
}

it('serves the domain challenge as plain text with no rewrite or redirect when the ChatGPT plugin is in', () => {
  const routes = vercelRoutes(site(randomUUID()), { chatgpt: true });
  const matching = routes.filter(route => new RegExp(route.src).test('/.well-known/openai-apps-challenge'));
  expect(matching).toEqual([{ src: '^/\\.well-known/openai-apps-challenge$', headers: { 'Content-Type': 'text/plain' }, continue: true }]);
  for (const path of ['/xwell-known/openai-apps-challenge', '/.well-known/openai-apps-challenge/extra', '/.well-known/oauth-protected-resource/mcp']) {
    expect(new RegExp(matching[0].src).test(path), path).toBe(false);
  }
});

it('adds no challenge route when the site or the token file is absent', () => {
  for (const root of [undefined, site()]) {
    expect(vercelRoutes(root, { chatgpt: true }).some(route => new RegExp(route.src).test('/.well-known/openai-apps-challenge'))).toBe(false);
  }
});

it('adds no challenge route while the ChatGPT plugin is parked, also with a token file', () => {
  expect(CHATGPT_PLUGIN).toBe(false);
  for (const routes of [vercelRoutes(site(randomUUID())), vercelRoutes(site('token\n'))]) {
    expect(routes.some(route => /well-known|plugin-art/.test(route.src))).toBe(false);
  }
});

it('leaves the domain challenge out of a parked site tree', async () => {
  const root = site(randomUUID());
  writeFileSync(join(root, 'index.html'), '<!doctype html><title>Parked</title>');
  const out = mkdtempSync(join(tmpdir(), 'kingdown-parked-tree-'));
  sites.push(out);
  const output = await buildPluginServer(out, { site: root });
  expect(existsSync(join(output, 'static/index.html'))).toBe(true);
  expect(existsSync(join(output, 'static/.well-known'))).toBe(false);
  expect(existsSync(join(output, 'static/plugin-art'))).toBe(false);
}, 120_000);

it.each(['', ' ', '\n', 'token\n', 'token\r\n', ' token', 'token ', 'two tokens', 'token\tvalue'])('refuses an empty token or white space: %j', async token => {
  const root = site(token);
  await expect(buildPluginServer(join(root, 'build'), { site: root, chatgpt: true })).rejects.toThrow('must contain only the token');
});
