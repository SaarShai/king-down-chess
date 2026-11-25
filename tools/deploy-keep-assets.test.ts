// The keep-assets step of the publish (tools/deploy-keep-assets.mjs), against a local site
// (tools/lib/deploy-site-kit.ts).
import { afterEach, describe, expect, it, vi } from 'vitest';
vi.setConfig({ testTimeout: 60_000 }); // each case runs a real script or hook in a child process; under load one takes more than vitest's 5 s
import { buildFolder, closeSites, keep, keepAssets, runAsync, site, tree } from './lib/deploy-site-kit';

afterEach(closeSites);

describe('deploy-keep-assets.mjs', () => {
  // Each form in which a Vite build names a file under assets/, also with a query or a fragment. The
  // image holds a quoted name that the walk must not read; the page holds a sibling name outside
  // assets/. The live list of a previous release names a file that this release does not keep.
  const live = (): Record<string, string> => ({
    'index.html': '<script type="module" src="/assets/index-AAAA1111.js"></script><link rel="stylesheet" href="./assets/style-BBBB2222.css"><a href="./page-CCCC3333.js"><img srcset="/assets/small-PPPP6666.webp 1x, /assets/big-QQQQ7777.webp 2x">',
    'sw.js': 'const PRECACHE = ["assets/pre-DDDD4444.js","assets/plain.js"];',
    'assets/index-AAAA1111.js': 'import{a}from"./shared-EEEE5555.js";const m=()=>import(\'./lazy-FFFF6666.js\');const d=["assets/dep-GGGG7777.js"];new URL("/assets/worker-HHHH8888.js",import.meta.url);const p=`/assets/pic-II-I9999.webp`;const q="/assets/data-OOOO5555.json?raw";',
    'assets/style-BBBB2222.css': '@font-face{src:url(/assets/font-JJJJ0000.woff2)}.m{mask-image:url("/assets/shape-NNNN4444.svg#mark")}',
    'assets/data-OOOO5555.json': '{}', 'assets/shape-NNNN4444.svg': '<svg/>', 'assets/small-PPPP6666.webp': 'small', 'assets/big-QQQQ7777.webp': 'big',
    'assets/pre-DDDD4444.js': 'pre', 'assets/shared-EEEE5555.js': 'shared', 'assets/lazy-FFFF6666.js': 'lazy', 'assets/dep-GGGG7777.js': 'dep', 'assets/worker-HHHH8888.js': 'worker',
    'assets/pic-II-I9999.webp': 'image "./bogus-KKKK1111.js"', 'assets/font-JJJJ0000.woff2': 'font', 'assets/plain.js': 'plain', 'page-CCCC3333.js': 'page',
    'assets/kept-files.json': '["older-LLLL2222.js"]\n', 'assets/older-LLLL2222.js': 'older',
  });
  const build = (): Record<string, string> => ({ 'index.html': '<script type="module" src="/assets/index-New11111.js"></script>', 'sw.js': 'new worker', 'assets/index-New11111.js': 'import"./shared-EEEE5555.js"', 'assets/shared-EEEE5555.js': 'shared' });
  const kept = ['big-QQQQ7777.webp', 'data-OOOO5555.json', 'dep-GGGG7777.js', 'font-JJJJ0000.woff2', 'index-AAAA1111.js', 'lazy-FFFF6666.js', 'pic-II-I9999.webp', 'pre-DDDD4444.js', 'shape-NNNN4444.svg', 'small-PPPP6666.webp', 'style-BBBB2222.css', 'worker-HHHH8888.js'];

  it('keeps each file that the live build names, and changes no file of the build', async () => {
    const site_ = await site(live), folder = buildFolder(build());
    const result = await keep(folder, site_.url);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain(`serves 13 content-named files under /assets/; 1 are in the build with the same bytes; kept 12: ${kept.join(', ')}`);
    expect(tree(folder)).toEqual({ ...build(), ...Object.fromEntries(kept.map(file => [`assets/${file}`, live()[`assets/${file}`]])), 'assets/kept-files.json': `${JSON.stringify(kept)}\n` });
    expect(site_.requests.map(r => `${r.method} ${r.path}`).sort()).toEqual(['GET /', 'GET /sw.js', ...['shared-EEEE5555.js', ...kept].map(file => `GET /assets/${file}`)].sort());
    expect(site_.requests.filter(r => r.cookie !== undefined)).toEqual([]);
  });

  it.each([
    ['a missing file', { 'assets/lazy-FFFF6666.js': undefined }, {}, 'GET /assets/lazy-FFFF6666.js: expected HTTP 200, got 404'],
    ['an HTML fallback', {}, { path: '/assets/lazy-FFFF6666.js', type: 'text/html', body: '<!doctype html>' }, 'GET /assets/lazy-FFFF6666.js: expected text/javascript or application/javascript, got text/html'],
    ['other bytes at a name of the build', { 'assets/shared-EEEE5555.js': 'changed' }, {}, '/assets/shared-EEEE5555.js: the live file differs from the build\'s file of the same name'],
    ['a page that names no asset', { 'index.html': 'no script', 'sw.js': 'no list' }, {}, 'and /sw.js name no file under /assets/'],
    ['a missing worker', { 'sw.js': undefined }, {}, 'GET /sw.js: expected HTTP 200, got 404'],
    ['an HTML fallback for the worker', {}, { path: '/sw.js', type: 'text/html' }, 'GET /sw.js: expected text/javascript or application/javascript, got text/html'],
    ['a page of another type', {}, { path: '/', type: 'text/plain' }, 'GET /: expected text/html, got text/plain'],
    ['an old file of a type with no check', { 'assets/style-BBBB2222.css': 'b{background:url(/assets/photo-MMMM3333.jpg)}', 'assets/photo-MMMM3333.jpg': 'jpeg' }, {}, 'GET /assets/photo-MMMM3333.jpg: the live build names a file of a type with no check'],
    ['an old file with an upper-case extension', { 'assets/style-BBBB2222.css': 'b{background:url(/assets/photo-MMMM3333.PNG)}', 'assets/photo-MMMM3333.PNG': 'png' }, {}, 'GET /assets/photo-MMMM3333.PNG: the live build names a file of a type with no check'],
  ])('stops at %s and writes no file', async (_, change, reply, message) => {
    const files = { ...live(), ...change } as Record<string, string>;
    const site_ = await site(() => files, reply), folder = buildFolder(build());
    const result = await keep(folder, site_.url);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/^keep-assets: /);
    expect(result.stderr).toContain(message);
    expect(tree(folder)).toEqual(build());
  });

  it('tries a file again after a network fault, and stops after the third fault', async () => {
    const path = '/assets/lazy-FFFF6666.js', reply = { path, type: 'text/javascript' };
    const once = await site(live, { ...reply, drop: 2 }), kept_ = buildFolder(build());
    const result = await keep(kept_, once.url);
    expect(result.status, result.stderr).toBe(0);
    expect(once.requests.filter(r => r.path === path)).toHaveLength(3);
    expect(tree(kept_)['assets/lazy-FFFF6666.js']).toBe('lazy');
    // An HTTP reply gets no second try.
    const gone = live();
    delete gone['assets/lazy-FFFF6666.js'];
    const missing = await site(() => gone);
    expect((await keep(buildFolder(build()), missing.url)).status).toBe(1);
    expect(missing.requests.filter(r => r.path === path)).toHaveLength(1);
    const always = await site(live, { ...reply, drop: 3 }), folder = buildFolder(build());
    const failed = await keep(folder, always.url);
    expect(failed.status).toBe(1);
    expect(failed.stderr).toContain(`keep-assets: GET ${path}: fetch failed`);
    expect(always.requests.filter(r => r.path === path)).toHaveLength(3);
    expect(tree(folder)).toEqual(build());
  });

  it('keeps the files of the live list again when the live page is the page of this build', async () => {
    // A first publish of this build kept lazy-FFFF6666.js and named it in its list. A rerun keeps it again.
    const first = { ...build(), 'assets/lazy-FFFF6666.js': 'lazy', 'assets/kept-files.json': '["lazy-FFFF6666.js"]\n' };
    const site_ = await site(() => first), folder = buildFolder(build());
    const result = await keep(folder, site_.url);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('serves 3 content-named files under /assets/ (a rerun: the live page is the page of this build; the live list names 1); 2 are in the build with the same bytes; kept 1: lazy-FFFF6666.js; assets/kept-files.json names them');
    expect(tree(folder)).toEqual(first);
    // The first publish with this tool finds no live list; a list with another name stops the publish.
    for (const [list, status, message] of [[undefined, 0, '(a rerun: the live page is the page of this build; no live list); 2 are in the build with the same bytes; kept 0'], ['["../index.html"]', 1, 'the live list is not a list of content names'], ['{"files":[]}', 1, 'the live list is not a list of content names']] as const) {
      const served = { ...build(), ...(list === undefined ? {} : { 'assets/kept-files.json': list }) };
      const rerun = await keep(buildFolder(build()), (await site(() => served)).url);
      expect([rerun.status, rerun.stdout + rerun.stderr]).toEqual([status, expect.stringContaining(message)]);
    }
  });

  it('refuses invalid arguments, a build without assets/, a build file with no checked type and a build with a list before any request', async () => {
    const site_ = await site(live);
    for (const [args, message] of [[[], 'usage:'], [[buildFolder({ 'index.html': 'page', 'sw.js': 'worker' })], 'the build has no assets'], [[buildFolder({ ...build(), 'assets/song-ABCD1234.mp3': 'song' })], 'no checked content type for assets/song-ABCD1234.mp3'], [[buildFolder({ ...build(), 'assets/kept-files.json': '[]' })], 'the build already has assets/kept-files.json']] as const) {
      const result = await runAsync(process.execPath, [keepAssets, ...args], { env: { ...process.env, DEPLOY_LIVE_URL: site_.url } });
      expect(result.status).toBe(2);
      expect(result.stderr).toContain(message);
    }
    expect(site_.requests).toEqual([]);
  });
});
