// The iOS shell of the launch build (docs/IOS.md): page routes, swipe Back, devices, orientations and colours.
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
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
