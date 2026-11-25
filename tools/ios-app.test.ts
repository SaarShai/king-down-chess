// The iOS shell of the launch build (docs/IOS.md): page routes, the build shell, the origin, the lowest iOS, universal
// links, swipe Back, devices, orientations and colours. CI runs this file for a change under ios/.
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { buildTarget } from '../vite.config';
import { siteRoute } from './lib/site-route.mjs';
import { vercelRoutes } from './plugin-server-build.mjs';

const read = (path: string) => readFileSync(path, 'utf8');
const swift = read('ios/App/App/SceneDelegate.swift');

it('routes the pages in the app as the host does, from the same build marker', () => {
  expect(swift).toContain('rootViewController = AppViewController()');
  expect(swift).toContain('override func router() -> Router { AppRouter() }');
  expect(/static let marker = "(.+?)"/.exec(swift)?.[1]).toBe('solo-launch.json');
  const online = new RegExp(/static let onlinePages = #"(.+?)"#/.exec(swift)![1]);
  const site = mkdtempSync(join(tmpdir(), 'ios-routes-'));
  try {
    writeFileSync(join(site, 'solo-launch.json'), '{"soloLaunch":true}');
    const config = { routes: vercelRoutes(site) };
    for (const path of ['/', '/play', '/play/', '/play/settings', '/playground', '/g/game', '/g/game/', '/g/a/b', '/j', '/j/', '/missing']) {
      // The website translates invite fragments; native universal links use UniversalLink.localURL.
      if (path === '/j' || path === '/j/') { expect(siteRoute(config, path).dest).toBe('/join.html'); continue; }
      expect(online.test(path) ? '/index.html' : '/next.html', path).toBe(siteRoute(config, path).dest);
    }
  } finally { rmSync(site, { recursive: true, force: true }); }
});

it('builds the app with the new page whatever the website cutover is', () => {
  const sync = read('tools/ios-sync.sh');
  const build = sync.indexOf('\nnpm run build');
  expect(build).toBeGreaterThan(0);
  // Set after the stage settings and before the build, so no caller value of the website switch reaches the app.
  expect(sync.slice(0, build).trimEnd().split('\n').at(-1)).toBe('export KINGDOWN_SOLO_LAUNCH=1');
  expect(sync.slice(build)).not.toContain('KINGDOWN_SOLO_LAUNCH');
  // A store archive takes no test page and no production Apple sign-in from the caller's shell (decision 3 of
  // docs/specs/platform-seam/spec.md). The Apple release changes the production line on purpose.
  const stages = sync.slice(sync.indexOf('\ncase '), sync.indexOf('\nesac\n'));
  expect(stages.split('\n').filter(line => line.includes('VITE_KINGDOWN_APPLE_SIGN_IN'))).toEqual([expect.stringMatching(/^ {2}production\) .*export .*\bVITE_KINGDOWN_APPLE_SIGN_IN=0\b/)]);
  expect(sync.slice(sync.indexOf('\nesac\n'), build).split('\n')).toContain('unset KINGDOWN_TEST_PAGES');
  expect(sync.slice(build)).not.toMatch(/KINGDOWN_TEST_PAGES|VITE_KINGDOWN_APPLE_SIGN_IN/);
});

it('keeps the app origin capacitor://localhost: no server host, scheme or address in the Capacitor config', () => {
  const config = JSON.parse(read('capacitor.config.json'));
  for (const key of ['hostname', 'iosScheme', 'url']) expect(config.server?.[key], key).toBeUndefined();
  for (const file of ['capacitor.config.ts', 'capacitor.config.js']) expect(existsSync(file), file).toBe(false);
});

it('gives the app the lowest iOS of the web build target', () => {
  const version = (name: string) => buildTarget.find(target => target.startsWith(name))?.slice(name.length);
  const targets = read('ios/App/App.xcodeproj/project.pbxproj').match(/IPHONEOS_DEPLOYMENT_TARGET = [^;]+;/g)!;
  expect(targets.length).toBeGreaterThan(0);
  for (const name of ['ios', 'safari']) expect(targets, name).toEqual(Array(targets.length).fill(`IPHONEOS_DEPLOYMENT_TARGET = ${version(name)};`));
});

it('pins the association file to the app and its game and invite links', () => {
  expect(JSON.parse(read('public/.well-known/apple-app-site-association')).applinks.details).toEqual([
    { appIDs: ['6M9C2YSWT4.dev.kingdown.app'], components: [{ '/': '/g/*' }, { '/': '/j' }, { '/': '/j/' }] },
  ]);
});

it('opens in the app the links that the association file names, and the host serves each as a page', () => {
  const app = new RegExp(/percentEncodedPath\.range\(of: #"(.+?)"#/.exec(read('ios/App/App/UniversalLink.swift'))![1]);
  // Apple's `*` matches any characters and `?` one character. The file of today uses no other match rule.
  const components = JSON.parse(read('public/.well-known/apple-app-site-association')).applinks.details
    .flatMap((detail: { components: { '/': string }[] }) => detail.components)
    .map(({ '/': path }: { '/': string }) => new RegExp('^' + path.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$'));
  const game = '0f8b3c1e-2a4d-4b6f-8c9e-1a2b3c4d5e6f';
  const accepted = ['/', '/g/' + game, '/g/' + game + '/', '/g/' + game.toUpperCase(), '/g/game', '/g/a/b', '/j', '/j/', '/j/token', '/play', '/next.html']
    .filter(path => app.test(path));
  expect(accepted).toEqual(['/g/' + game, '/g/' + game + '/', '/g/' + game.toUpperCase(), '/j', '/j/']);
  for (const path of accepted) expect(components.some((component: RegExp) => component.test(path)), path).toBe(true);
  for (const component of components) expect(accepted.some(path => component.test(path)), component.source).toBe(true);
  const site = mkdtempSync(join(tmpdir(), 'ios-links-'));
  try {
    writeFileSync(join(site, 'solo-launch.json'), '{"soloLaunch":true}');
    const config = { routes: vercelRoutes(site) };
    for (const path of accepted) expect(siteRoute(config, path), path).toEqual({ dest: expect.stringMatching(/^\/(?:index|join)\.html$/), headers: {} });
  } finally { rmSync(site, { recursive: true, force: true }); }
});

it('copies only the H.264 reveal films into the app', () => {
  const sync = read('tools/ios-sync.sh');
  expect(sync.slice(sync.indexOf('\nnpm run build'), sync.indexOf('\nnpx cap sync ios')))
    .toContain('rm -f dist/interface/reveal/*-av1.mp4 dist/interface/reveal/*-hevc.mp4');
});

it('gives the app the browser Back as a swipe, and a start address only in a debug build', () => {
  expect(swift).toContain('webView?.allowsBackForwardNavigationGestures = true');
  expect(swift.slice(swift.indexOf('#if DEBUG'), swift.indexOf('#endif'))).toContain('"KingDownStart"');
});

it('runs on iPhone upright and on the side, on iPad in all orientations, in the light style', () => {
  const plist = read('ios/App/App/Info.plist');
  const list = (key: string) => [...new RegExp(`<key>${key}</key>\\s*<array>([\\s\\S]*?)</array>`).exec(plist)![1].matchAll(/<string>UIInterfaceOrientation(\w+)<\/string>/g)].map(m => m[1]);
  expect(list('UISupportedInterfaceOrientations')).toEqual(['Portrait', 'LandscapeLeft', 'LandscapeRight']);
  expect(list('UISupportedInterfaceOrientations~ipad')).toEqual(['Portrait', 'PortraitUpsideDown', 'LandscapeLeft', 'LandscapeRight']);
  expect(plist).toMatch(/<key>UIUserInterfaceStyle<\/key>\s*<string>Light<\/string>/);
  expect(read('ios/App/App.xcodeproj/project.pbxproj').match(/TARGETED_DEVICE_FAMILY = [^;]+;/g)).toEqual(Array(2).fill('TARGETED_DEVICE_FAMILY = "1,2";'));
});

it('paints the launch screen and the web view in the page colour, with no link preview', () => {
  const page = /--paper-50: (#[0-9a-f]{6});/.exec(read('src/interface/ui/tokens.css'))![1];
  const config = JSON.parse(read('capacitor.config.json'));
  expect(config.backgroundColor).toBe(page);
  expect(config.ios.allowsLinkPreview).toBe(false);
  for (const file of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) {
    // A palette of one colour: each pixel of the launch image has that colour.
    const png = readFileSync(`ios/App/App/Assets.xcassets/Splash.imageset/${file}`), at = png.indexOf('PLTE');
    expect([png.readUInt32BE(at - 4), '#' + png.subarray(at + 4, at + 7).toString('hex')], file).toEqual([3, page]);
  }
});

it('includes the native haptics plugin in the package and iOS project', () => {
  const pkg = JSON.parse(read('package.json'));
  expect(pkg.dependencies['@capacitor/haptics']).toMatch(/^\d+\.\d+\.\d+$/);
  const spm = read('ios/App/CapApp-SPM/Package.swift');
  expect(spm).toContain('.product(name: "CapacitorHaptics", package: "CapacitorHaptics")');
  expect(spm).toContain('node_modules/@capacitor/haptics');
});
