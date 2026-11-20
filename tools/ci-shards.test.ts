import { globSync } from 'node:fs';
import { expect, it } from 'vitest';
import { checkShards, filePattern } from './ci-shards.mjs';
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
  expect(shards.length + 3).toBeLessThanOrEqual(20);
});

it('places each baseline browser check once per browser with both fixture parts', () => {
  const chromium = checks.filter(check => !check.byName && !check.gpu).map(check => check.name);
  expect(chromium).toEqual(expect.arrayContaining([
    'account', 'character-clips', 'character-prepare', 'cursor-adoption', 'end', 'game-screen', 'home', 'leap-start',
    'menu-extra', 'new-game', 'powers', 'qa', 'read-piece', 'selftest', 'special-moves', 'their-turn', 'turn',
    'ux-defects', 'verb-marks', 'visual-design',
  ]));
  chromium.push('plugin-oauth', 'plugin-ui:opening', 'plugin-ui:board', 'plugin-ui-http', 'web-online', 'signin-speed', 'web-game');
  const webkit = ['plugin-ui:opening', 'plugin-ui:board', 'web-online', 'signin-speed'];
  const jobs = checkShards();
  for (const [browser, expected] of [['chromium', chromium], ['webkit', webkit]] as const) {
    const actual = jobs.filter(job => job.browser === browser).flatMap(job =>
      job.checks.map(name => job.part && name === 'plugin-ui' ? `${name}:${job.part}` : name));
    expect(stable(actual)).toEqual(stable(expected));
  }
});

it('assigns a new default and a new WebKit check without a workflow edit', () => {
  const registry = [...checks,
    { name: 'new-default', limit: 60 },
    { name: 'new-journey', byName: true, ci: 'journey', webkit: true, limit: 60 },
  ];
  const jobs = checkShards({ registry });
  expect(jobs.filter(job => job.checks.includes('new-default')).map(job => job.browser)).toEqual(['chromium']);
  expect(stable(jobs.filter(job => job.checks.includes('new-journey')).map(job => job.browser))).toEqual(['chromium', 'webkit']);
});
