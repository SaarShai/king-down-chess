import { it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { buildPluginServer, vercelRoutes } from '../tools/plugin-server-build.mjs';

const read = (path: string) => readFileSync(path, 'utf8');
const plist = (path: string) => JSON.parse(execFileSync('plutil', ['-convert', 'json', '-o', '-', path], { encoding: 'utf8' }));
const run = resolve(process.env.KINGDOWN_TEST_OUT ?? '../run/store-checks');

it('accepts only game and invite links from the associated HTTPS host', () => {
  mkdirSync(run, { recursive: true });
  writeFileSync(resolve(run, 'AppRouter.swift'), 'import Foundation\nprotocol Router {}\n' + read('ios/App/App/SceneDelegate.swift').slice(read('ios/App/App/SceneDelegate.swift').indexOf('struct AppRouter: Router')));
  execFileSync('xcrun', ['swiftc', '-module-cache-path', resolve(run, 'ModuleCache'), 'ios/App/App/UniversalLink.swift', resolve(run, 'AppRouter.swift'), 'ios/Tests/UniversalLinkChecks.swift', '-o', resolve(run, 'links')], { timeout: 90000 });
  const checks = execFileSync(resolve(run, 'links'), { encoding: 'utf8' });
  expect(checks).toContain('30 passed'); expect(checks).toContain('Native invite route checks: 18 passed');
  const scene = read('ios/App/App/SceneDelegate.swift');
  expect(scene).toContain('for activity in connectionOptions.userActivities');
  expect(scene).toContain('openUniversalLink(userActivity)');
  expect(scene).toContain('activity.activityType == NSUserActivityTypeBrowsingWeb');
  expect(scene).toContain('soloLaunch: FileManager.default.fileExists(atPath: config.appLocation.path + "/" + AppRouter.marker)');
}, 120000);

it('wires automatic signing and the association with the owner team', () => {
  const project = read('ios/App/App.xcodeproj/project.pbxproj');
  expect(project.match(/CODE_SIGN_ENTITLEMENTS = App\/App.entitlements;/g)).toHaveLength(2);
  expect(project.match(/DEVELOPMENT_TEAM = 6M9C2YSWT4;/g)).toHaveLength(2);
  expect(project.match(/CURRENT_PROJECT_VERSION = 4;/g)).toHaveLength(2);
  expect(project.match(/PRODUCT_BUNDLE_IDENTIFIER = dev.kingdown.app;/g)).toHaveLength(2);
  expect(project.match(/CODE_SIGN_STYLE = Automatic;/g)).toHaveLength(2);
  expect(project).toContain('UniversalLink.swift in Sources');
  const exported = plist('ios/ExportOptions.plist');
  expect(exported).toMatchObject({ method: 'app-store-connect', destination: 'upload', signingStyle: 'automatic', teamID: '6M9C2YSWT4', manageAppVersionAndBuildNumber: false });
  expect(plist('ios/App/App/App.entitlements')['com.apple.developer.associated-domains']).toEqual(['applinks:kingdown.dev']);
  expect(JSON.parse(read('public/.well-known/apple-app-site-association')).applinks.details).toEqual([
    { appIDs: ['6M9C2YSWT4.dev.kingdown.app'], components: [{ '/': '/g/*' }, { '/': '/j' }, { '/': '/j/' }] },
  ]);
});

it('uses a complete opaque icon and keeps the platform security defaults', async () => {
  const icon = await sharp('ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png').metadata();
  expect([icon.width, icon.height, icon.hasAlpha]).toEqual([1024, 1024, false]);
  const info = plist('ios/App/App/Info.plist');
  expect(info.ITSAppUsesNonExemptEncryption).toBe(false);
  expect(info.NSAppTransportSecurity).toBeUndefined();
  expect(Object.keys(info).filter(key => key.endsWith('UsageDescription'))).toEqual([]);
  expect(info.UIRequiresFullScreen).toBeUndefined();
  expect(info.UILaunchStoryboardName).toBe('LaunchScreen');
});

it('declares account profile data and the app-owned defaults reason without tracking', () => {
  const privacy = plist('ios/App/App/PrivacyInfo.xcprivacy');
  expect(privacy.NSPrivacyTracking).toBe(false);
  expect(privacy.NSPrivacyAccessedAPITypes).toEqual([{ NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults', NSPrivacyAccessedAPITypeReasons: ['CA92.1'] }]);
  expect(privacy.NSPrivacyCollectedDataTypes.map((row: any) => row.NSPrivacyCollectedDataType).sort()).toEqual(['EmailAddress', 'UserID', 'Name', 'PhotosorVideos', 'GameplayContent', 'OtherUserContent', 'ProductInteraction', 'OtherDiagnosticData'].map(type => 'NSPrivacyCollectedDataType' + type).sort());
  for (const row of privacy.NSPrivacyCollectedDataTypes) expect([row.NSPrivacyCollectedDataTypeLinked, row.NSPrivacyCollectedDataTypeTracking, row.NSPrivacyCollectedDataTypePurposes]).toEqual([true, false, ['NSPrivacyCollectedDataTypePurposeAppFunctionality']]);
});

it('keeps the association file in a parked site build and serves JSON before the fallback', async () => {
  const site = resolve(run, 'site'), output = resolve(run, 'server');
  mkdirSync(resolve(site, '.well-known'), { recursive: true });
  copyFileSync('public/.well-known/apple-app-site-association', resolve(site, '.well-known/apple-app-site-association'));
  writeFileSync(resolve(site, '.well-known/openai-apps-challenge'), 'test-domain-challenge');
  writeFileSync(resolve(site, 'solo-launch.json'), '{}');
  await buildPluginServer(output, { site, chatgpt: false, muse: false });
  expect(read(resolve(output, '.vercel/output/static/.well-known/apple-app-site-association'))).toBe(read('public/.well-known/apple-app-site-association'));
  expect(JSON.parse(read(resolve(output, '.vercel/output/static/.well-known/apple-app-site-association'))).applinks.details[0].appIDs).toEqual(['6M9C2YSWT4.dev.kingdown.app']);
  const joinPage = read(resolve(output, '.vercel/output/static/join.html'));
  let destination = '';
  runInNewContext(/<script>(.*?)<\/script>/.exec(joinPage)![1], { location: { hash: '#fixture-token', replace: (value: string) => { destination = value; } } });
  expect(destination).toBe('/next.html#join=fixture-token');
  const routes = vercelRoutes(site, { chatgpt: false, muse: false });
  const at = routes.findIndex((row: any) => row.src === '^/\\.well-known/apple-app-site-association$');
  expect(routes[at]).toMatchObject({ headers: { 'Content-Type': 'application/json' }, continue: true });
  expect(at).toBeLessThan(routes.findIndex((row: any) => row.handle === 'filesystem'));
  expect(() => read(resolve(output, '.vercel/output/static/.well-known/openai-apps-challenge'))).toThrow();
}, 120000);

it('wires the local Apple sheet without a new package or an active sign-in entitlement', () => {
  const swift = read('ios/App/App/AppleSignInPlugin.swift');
  expect(swift).toContain('request.nonce = nonce');
  expect(swift).toContain('credential.state == expectedState');
  expect(swift).toContain('request.requestedScopes = [.email]');
  expect(read('ios/App/App/SceneDelegate.swift')).toContain('registerPluginInstance(AppleSignInPlugin())');
  expect(read('ios/App/App.xcodeproj/project.pbxproj')).toContain('AppleSignInPlugin.swift in Sources');
  expect(plist('ios/App/App/App.entitlements')['com.apple.developer.applesignin']).toBeUndefined();
});
