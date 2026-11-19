import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { expect, it } from 'vitest';
import { soloLaunch } from './solo-launch.mjs';
import { vercelRoutes } from './plugin-server-build.mjs';

it('requires an explicit launch flag and leaves the default root route unchanged', () => {
  expect(soloLaunch('')).toBe(false); expect(soloLaunch('0')).toBe(false); expect(soloLaunch('1')).toBe(true);
  expect(() => soloLaunch('true')).toThrow('0 or 1');
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
const support = readFileSync('tools/solo-launch/browser-support.js', 'utf8');
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
  const privacy = readFileSync('tools/solo-launch/privacy.html', 'utf8');
  expect(privacy).not.toMatch(/lessons|badges|lesson progress/);
  for (const text of ['Solo games on the website run on your device.', 'Muse', 'Facebook', '30 days without use']) expect(privacy).toContain(text);
  for (const page of ['terms', 'support', 'delete-data']) expect(readFileSync(`tools/solo-launch/${page}.html`, 'utf8')).toContain('href="/play"');
  expect(readFileSync('tools/solo-launch/delete-data.html', 'utf8')).toContain('Settings → Account');
});
it('sets the new-page title and share preview before script execution', () => {
  const html = readFileSync('tools/solo-launch/next.html', 'utf8');
  for (const text of ['<title>King Down</title>', 'property="og:title" content="King Down"', 'property="og:image"', 'name="description"', 'id="browser-support"']) expect(html).toContain(text);
});

it('uses the Daylight page colour before the styles load and in the launch manifest', () => {
  const paper = /--paper-50: (#[0-9a-f]{6});/.exec(readFileSync('src/interface/ui/tokens.css', 'utf8'))![1];
  for (const file of ['next.html', 'tools/solo-launch/next.html', 'people.html']) {
    const html = readFileSync(file, 'utf8');
    expect(html, file).toContain(`name="theme-color" content="${paper}"`);
    expect(html, file).toContain(`html { background: ${paper}; }`);
  }
  expect(readFileSync('vite.config.ts', 'utf8')).toContain(`background_color: '${paper}', theme_color: '${paper}'`);
});

it('does not list parked features as current deletion data', () => {
 const page = readFileSync('tools/solo-launch/delete-data.html', 'utf8');
 expect(page).not.toMatch(/lesson progress|badges and unlocks/);
 expect(page).toContain('cloud saves, old progress data, ratings and rating history. It also deletes');
});

it('gives each launch legal link a 44 px target on a light page', () => {
 for (const page of ['privacy', 'terms', 'support', 'delete-data']) {
  const html = readFileSync(`tools/solo-launch/${page}.html`, 'utf8');
  expect(html, page).toMatch(/nav a \{[^}]*display: inline-flex;[^}]*min-height: 44px;/);
  expect(html, page).toContain('body { margin: 0; background: #f7f5ed;');
 }
});

it('strips the new-page recorder route in the off build and stops when that line changes', async () => {
 const { launchSource } = await import('./solo-launch.mjs');
 const source = readFileSync('src/diagnostics/data.ts', 'utf8'), id = '/src/diagnostics/data.ts';
 expect(source).toContain("return '/next.html';");
 expect(launchSource(source, id, true)).toBe(source);
 expect(launchSource(source, id, false)).not.toContain("'/next.html'");
 expect(() => launchSource(source.replace("return '/next.html';", "return '/next.html'; "), id, false)).toThrow('Launch recorder route has changed');
});

it('keeps the original entries off and attaches the launch controls to the actual online entry', async () => {
 const { launchSource } = await import('./solo-launch.mjs');
 const source = readFileSync('src/online/entry.ts', 'utf8');
 expect(launchSource(source, '/src/online/entry.ts', false)).toBeUndefined();
 const launch = launchSource(source, '/src/online/entry.ts', true)!;
 expect(launch).toContain('installLocalSolo(api, session.userId);'); expect(launch).toContain('installAccountControls(auth, session);');
 expect(launch.indexOf('installLocalSolo(api, session.userId);')).toBeLessThan(launch.indexOf('const host = createBrowserRuntime'));
});
