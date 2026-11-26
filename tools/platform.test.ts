import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { expect, it } from 'vitest';
import { parseAccountRoute } from '../src/online/routes';
import { siteRoute } from './lib/site-route.mjs';
import { vercelRoutes } from './plugin-server-build.mjs';

it('gives the new page at / only for a tree with the launch marker', () => {
  const site = mkdtempSync(join(tmpdir(), 'platform-routes-'));
  try {
    expect(vercelRoutes(site).some(route => route.src === '^/$')).toBe(false);
    writeFileSync(join(site, 'solo-launch.json'), '{"soloLaunch":true}');
    const routes = vercelRoutes(site);
    expect(routes).toContainEqual({ src: '^/$', dest: '/next.html' });
    for (const path of ['/play', '/play/', '/play/settings', '/g/game']) {
      expect(routes.find(route => route.src && new RegExp(route.src).test(path) && route.dest)?.dest, path).toBe('/index.html');
    }
    for (const path of ['/j', '/j/']) expect(routes.find(route => route.src && new RegExp(route.src).test(path) && route.dest)?.dest, path).toBe('/join.html');
    expect(routes.slice(-2)).toEqual([{ handle: 'filesystem' }, { src: '^/.*$', dest: '/next.html', status: 404 }]);
  } finally { rmSync(site, { recursive: true, force: true }); }
});
it('requires revalidation for the runtime index and parts, with immutable hashed frames', () => {
  const routes = vercelRoutes('/missing/site');
  for (const path of ['/character-runtime/index.json', '/character-runtime/parts/king-frost.white.json']) {
    expect(routes.filter(route => new RegExp(route.src).test(path)).map(route => route.headers?.['Cache-Control'])).toEqual(['no-cache']);
  }
  expect(routes.find(route => new RegExp(route.src).test('/character-runtime/assets/' + 'a'.repeat(64) + '.webp'))?.headers?.['Cache-Control']).toBe('public, max-age=31536000, immutable');
});
const support = readFileSync('public/browser-support.js', 'utf8');
/** The shipped legal pages (vite.config.ts copies privacy and support from tools/solo-launch/). */
const legal = (page: string) => readFileSync(['privacy', 'support'].includes(page) ? `tools/solo-launch/${page}.html` : `public/${page}.html`, 'utf8');
it.each([
  ['Mozilla Chrome/110.0 Safari/537.36', false], ['Mozilla Chrome/111.0 Safari/537.36', true],
  ['Mozilla Firefox/113.0', false], ['Mozilla Firefox/114.0', true],
  ['Mozilla Version/16.3 Safari/605.1', false], ['Mozilla Version/16.4 Safari/605.1', true],
  ['Mozilla iPhone OS 16_3 Version/16.3 Safari/605.1', false], ['Mozilla iPhone OS 16_4 Version/16.4 Safari/605.1', true],
])('shows the browser message at the build floor for %s', (ua, supported) => {
  const window: { kingdownSupported?: boolean } = {}, message = { hidden: true };
  runInNewContext(support, { window, navigator: { userAgent: ua }, document: { createElement: () => ({ noModule: false }), getElementById: () => message, addEventListener: (_: string, ready: () => void) => ready() } });
  expect(window.kingdownSupported).toBe(supported); expect(message.hidden).toBe(supported);
});
it('uses the existing bounded fault report for the daily summary', () => {
  expect(JSON.parse(readFileSync('package.json', 'utf8')).scripts['errors:daily']).toBe('tsx tools/errors-report.ts --since 1');
});
it('keeps the launch legal facts and the old in-app deletion path', () => {
  const privacy = legal('privacy');
  expect(privacy).not.toMatch(/lessons|badges|lesson progress/);
  for (const text of ['Solo games on the website run on your device.', 'Muse', 'Facebook', '30 days without use']) expect(privacy).toContain(text);
  for (const page of ['terms', 'support', 'delete-data']) expect(legal(page)).toContain('href="/play"');
  expect(legal('delete-data')).toContain('Settings → Account');
});
it('leads with the kingdown.dev paths and keeps the /play path second', () => {
  const plain = (page: string) => legal(page).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').replace(/&amp;/g, '&');
  for (const page of ['support', 'terms', 'delete-data']) expect(legal(page), page).toContain('Last updated: 26 November 2026');
  const remove = plain('delete-data');
  expect(remove.indexOf('Open Account & settings. In Account, choose Delete account and confirm.')).toBeGreaterThan(-1);
  expect(remove.indexOf('Open Account & settings')).toBeLessThan(remove.indexOf('Settings → Account'));
  const support = plain('support');
  expect(support).toContain('Open kingdown.dev and select Play to play the computer. To play a person, select Play a friend and sign in.');
  expect(support.indexOf('select Play a friend')).toBeLessThan(support.indexOf('Play King Down'));
  expect(support.match(/If you already have access to the King Down app in ChatGPT/g)?.length).toBeGreaterThanOrEqual(2);
  expect(support.indexOf('After the game, select Player options, then Report player.')).toBeLessThan(support.indexOf('At /play, the Menu has Report player too.'));
  const terms = plain('terms');
  expect(terms.indexOf('select Play a friend on kingdown.dev and sign in')).toBeLessThan(terms.indexOf('The older online game at /play'));
});
it('names King Down in the launch HTML before script execution', () => {
  const html = readFileSync('next.html', 'utf8');
  expect(Array.from(html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi), ([, title]) => title.trim())).toEqual(['King Down']);
  expect(html).toMatch(/<section id="browser-support" hidden\b/);
  for (const text of [
    '<title>King Down</title>', 'name="application-name" content="King Down"',
    'property="og:site_name" content="King Down"', 'property="og:title" content="King Down"',
    'property="og:image"', 'name="description"',
  ]) expect(html).toContain(text);
});

it('uses the Daylight page colour before the styles load and in the launch manifest', () => {
  const paper = /--paper-50: (#[0-9a-f]{6});/.exec(readFileSync('src/interface/ui/tokens.css', 'utf8'))![1];
  for (const file of ['next.html', 'people.html']) {
    const html = readFileSync(file, 'utf8');
    expect(html, file).toContain(`name="theme-color" content="${paper}"`);
    expect(html, file).toContain(`html { background: ${paper}; }`);
  }
  expect(readFileSync('vite.config.ts', 'utf8')).toContain(`background_color: '${paper}', theme_color: '${paper}'`);
});

it('does not list parked features as current deletion data', () => {
 const page = legal('delete-data');
 expect(page).not.toMatch(/lesson progress|badges and unlocks/);
 expect(page).toContain('cloud saves, old progress data, ratings and rating history. It also deletes');
});

it('gives each launch legal link a 44 px target on a light page', () => {
 for (const page of ['privacy', 'terms', 'support', 'delete-data']) {
  const html = legal(page);
  expect(html, page).toMatch(/nav a \{[^}]*display: inline-flex;[^}]*min-height: 44px;/);
  expect(html, page).toContain('body { margin: 0; background: #f7f5ed;');
 }
});

it('reads a page route only where the host serves that page', async () => {
  // A path in a variable keeps this module out of the tools type check: it imports the whole board at run time.
  const platform = '../src/interface/platform', { launchRoute } = await import(platform);
  const site = mkdtempSync(join(tmpdir(), 'page-routes-'));
  try {
    writeFileSync(join(site, 'solo-launch.json'), '{"soloLaunch":true}');
    // The host serves the files of a launch tree and the join page that its build writes.
    const host = { routes: vercelRoutes(site) }, files = new Set(['/index.html', '/next.html', '/join.html']);
    const game = '0f8b3c1e-2a4d-4b6f-8c9e-1a2b3c4d5e6f';
    let routes = 0;
    for (const path of ['/', '/next.html', '/index.html', '/join.html', '/play', '/play/', '/play/friend', '/play/settings', '/play/x/y', '/playground', `/g/${game}`, `/g/${game}/`, '/g/game', '/g/a/b', '/j', '/j/', '/j/token', '/missing', '/api/status']) {
      const { dest, status } = siteRoute(host, path, files.has(path)), url = new URL(path + '#ABCDEF', 'https://kingdown.dev');
      if (parseAccountRoute(url)) { routes++; expect(['/index.html', '/join.html'], path).toContain(dest); }
      expect(launchRoute(url) === 'home', path).toBe(dest === '/next.html' && !status);
    }
    expect(routes).toBeGreaterThan(0);
  } finally { rmSync(site, { recursive: true, force: true }); }
});
