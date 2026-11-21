import { spawnSync } from 'node:child_process';
import { globSync } from 'node:fs';
import { expect, it } from 'vitest';
import { checkShards, filePattern } from './ci-shards.mjs';
import { localPlan, pathPlan, riskyPaths } from './lib/ci-paths.mjs';
import { checks } from './lib/registry.mjs';

const stable = (list: string[]) => list.sort();
const webkitFiles = [
  'tools/plugin-board.test.ts', 'tools/plugin-board-input.test.ts', 'tools/plugin-board-drafts.test.ts',
  'tools/plugin-ios-size.test.ts', 'tools/plugin-preview-size.test.ts',
];

it('assigns every test file once and keeps the five extra WebKit test files', () => {
  const shards = checkShards();
  const files = (browser: string) => shards.filter(job => job.browser === browser)
    .flatMap(job => job.tests.length ? globSync(filePattern(job.tests)) : []);
  expect(stable(files('chromium'))).toEqual(stable(globSync([
    'src/**/*.test.ts', 'tools/**/*.test.ts', '.claude/hooks/**/*.test.ts',
    'docs/2d-first-pieces/**/*.test.mjs', 'src/render/painted/**/*.test.mjs',
  ])));
  expect(stable(files('webkit'))).toEqual(stable(webkitFiles));
  // Reuse and record-tree are in series with the matrix and verify.
  expect(shards.length + 2).toBeLessThanOrEqual(19);
  const chromiumBoardJobs = shards.filter(job => job.browser === 'chromium' &&
    job.tests.some(file => /^tools\/plugin-board(?:-input|-drafts)?\.test\.ts$/.test(file)));
  expect(chromiumBoardJobs).toHaveLength(2);
});

it('places each baseline browser check once per browser with both fixture parts', () => {
  const chromium = checks.filter(check => !check.byName && !check.gpu).map(check => check.name);
  expect(chromium).toEqual(expect.arrayContaining([
    'account', 'character-clips', 'character-prepare', 'cursor-adoption', 'end', 'game-screen', 'home', 'leap-start',
    'menu-extra', 'new-game', 'powers', 'qa', 'read-piece', 'selftest', 'special-moves', 'their-turn', 'turn',
    'ux-defects', 'verb-marks', 'visual-design',
  ]));
  chromium.push('plugin-oauth', 'plugin-ui:opening', 'plugin-ui:board', 'plugin-ui-http', 'web-online', 'signin-speed', 'web-game',
    'daylight-tabs', 'next-save', 'next-art-wait', 'play-scenes', 'release-site', 'release-history');
  const webkit = ['plugin-ui:opening', 'plugin-ui:board', 'web-online', 'signin-speed', 'daylight-tabs', 'next-art-wait', 'release-site', 'release-history'];
  const jobs = checkShards();
  for (const [browser, expected] of [['chromium', chromium], ['webkit', webkit]] as const) {
    const actual = jobs.flatMap(job => job.checks.flatMap(name => {
      const engines = checks.find(check => check.name === name)?.ciBrowsers ?? [job.browser];
      return engines.includes(browser) ? [job.part && name === 'plugin-ui' ? `${name}:${job.part}` : name] : [];
    }));
    expect(stable(actual)).toEqual(stable(expected));
  }
});

it.each(['daylight-tabs', 'next-art-wait'])('installs both engines in the %s journey shard', name => {
  expect(checkShards().filter(job => job.checks.includes(name))).toMatchObject([
    { name: expect.stringMatching(/^browser-default /), browsers: ['chromium', 'webkit'] },
  ]);
});

it('assigns a new default and a new WebKit check without a workflow edit', () => {
  const registry = [...checks,
    { name: 'new-default', limit: 60 },
    { name: 'new-journey', byName: true, ci: 'journey', webkit: true, limit: 60 },
    { name: 'new-standalone', byName: true, ci: 'standalone', limit: 60 },
  ];
  const jobs = checkShards({ registry });
  expect(jobs.filter(job => job.checks.includes('new-default')).map(job => job.browser)).toEqual(['chromium']);
  expect(stable(jobs.filter(job => job.checks.includes('new-journey')).map(job => job.browser))).toEqual(['chromium', 'webkit']);
  expect(jobs.filter(job => job.checks.includes('new-standalone'))).toMatchObject([
    { name: 'new-standalone', tests: [], checks: ['new-standalone'], browsers: ['chromium'], testPages: false },
  ]);
});

it('runs scenes on their own runner with test pages and shares a runner for both release checks', () => {
  const jobs = checkShards();
  const newChecks = ['play-scenes', 'release-site', 'release-history'];
  expect(jobs.filter(job => job.checks.some(name => newChecks.includes(name)))).toMatchObject([
    { name: 'browser-webkit-board (drafts)', checks: ['release-site', 'release-history'],
      tests: ['tools/plugin-board-drafts.test.ts'], browsers: ['chromium', 'webkit'], testPages: false },
    { name: 'play-scenes', checks: ['play-scenes'], tests: [], browsers: ['chromium'], testPages: true },
  ]);
  expect(jobs.filter(job => job.testPages).map(job => job.name)).toEqual(['play-scenes']);
});

it('keeps both compiled HTTP widget parts on one Chromium runner', () => {
  expect(checkShards().filter(job => job.checks.includes('plugin-ui-http'))).toEqual([
    expect.objectContaining({ browser: 'chromium', part: 'parallel' }),
  ]);
});

it('uses the verify runner for the Chromium board and drafts tests', () => {
  expect(checkShards().find(job => job.name === 'verify')).toMatchObject({
    browser: 'chromium', tests: ['tools/plugin-board.test.ts', 'tools/plugin-board-drafts.test.ts'],
  });
});

it('keeps the iOS shell tests from the full Ubuntu plan on the short plan', () => {
  const path = 'ios/App/App.xcodeproj/project.pbxproj';
  const changes = [{ path }];
  const plan = pathPlan(changes, true);
  const tests = ['tools/ios-app.test.ts'];
  expect(plan).toEqual({ mode: 'docs', tests });
  const fullTests = checkShards().flatMap(job => job.tests);
  expect(fullTests).toContain(tests[0]);
  expect(fullTests).not.toContain('ios/store.test.ts');
  expect(localPlan(changes)).toEqual(plan);
  expect(checkShards({ selection: { checks: [], tests: [], ...plan } })).toMatchObject([{ name: 'verify', tests, checks: [] }]);
  expect(riskyPaths([path])).toEqual([path]);
  expect(pathPlan(changes, false)).toEqual({ mode: 'full' });
  expect(pathPlan([...changes, { path: 'src/platform.ts' }], true)).toEqual({ mode: 'full' });
});

it('lets a nested test run select a file outside the parent shard', () => {
  expect(process.env.KINGDOWN_TEST_FILE, 'test workers must not inherit the shard file filter').toBeFalsy();
  const result = spawnSync('npm', ['test', 'tools/test-lock-guard.test.ts'], {
    encoding: 'utf8', timeout: 20_000,
    env: { ...process.env, KINGDOWN_TEST_NAME: '', KINGDOWN_TEST_NO_TYPECHECK: '1' },
  });
  const output = result.stdout + result.stderr;
  expect(result.status, output).toBe(0);
}, 30_000);

it('fails a test shard when neither a TS nor an MJS file matches', () => {
  const result = spawnSync('npm', ['test'], {
    encoding: 'utf8', timeout: 20_000,
    env: { ...process.env, KINGDOWN_TEST_FILE: '{tools/missing-shard.test.ts,src/render/painted/missing-shard.test.mjs}', KINGDOWN_TEST_NO_TYPECHECK: '1' },
  });
  const output = result.stdout + result.stderr;
  expect(output).toContain('No test files found');
  expect(result.status, output).toBe(1);
}, 30_000);
