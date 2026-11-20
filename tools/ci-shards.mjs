import { globSync } from 'node:fs';
import { matchesGlob } from 'node:path';
import { checks } from './lib/registry.mjs';

const board = 'tools/plugin-board';
const fixtures = ['opening', 'board'];
const testGlobs = [
  'src/**/*.test.ts', 'tools/**/*.test.ts', '.claude/hooks/**/*.test.ts',
  '{docs/2d-first-pieces,src/render/painted}/**/*.test.mjs',
];

// Files over one minute in the previous full test run. The app file gets a runner to itself.
// New files start with the default weight and enter a shard automatically.
const testSeconds = new Map([
  ['ios-size', 278], ['races', 259], ['motion', 238], ['lobby', 213], ['setup-owner', 110],
  ['profile', 86], ['real-host', 76], ['menus', 67], ['join-review', 62], ['motion-concepts', 61],
].map(([name, seconds]) => [`tools/plugin-${name}.test.ts`, seconds]));
testSeconds.set('tools/deploy.test.ts', 180);
testSeconds.set('tools/painted-attack-package.test.ts', 88);
testSeconds.set('src/ai/search.test.ts', 84);
testSeconds.set('src/interface/people/screens/pages.test.ts', 79);

function balance(items, count, seconds) {
  const bins = Array.from({ length: count }, () => ({ items: [], total: 0 }));
  for (const item of [...items].sort((a, b) => seconds(b) - seconds(a))) {
    const bin = bins.reduce((lightest, candidate) => candidate.total < lightest.total ? candidate : lightest);
    bin.items.push(item);
    bin.total += seconds(item);
  }
  return bins.map(bin => bin.items);
}

export const filePattern = files => files.length === 1 ? files[0] : `{${files.join(',')}}`;

export function checkShards({ registry = checks, selection = { mode: 'full', tests: [], checks: [] } } = {}) {
  if (selection.mode === 'docs' || selection.mode === 'reuse') return [];
  const jobs = [];
  const files = globSync(testGlobs).sort();
  const all = selection.mode === 'full';
  const selected = registry.filter(check => !check.gpu && (!check.byName || check.ci)
    && (all || selection.checks.includes(check.name)));
  const add = (name, browser, tests, entries = [], part = '') => {
    const picked = tests.filter(file => files.includes(file) && (all || selection.tests.some(pattern => matchesGlob(file, pattern))));
    if (picked.length || entries.length) jobs.push({ name, browser, tests: picked, checks: entries.map(check => check.name), part });
  };
  const boardFiles = ['', '-input', '-drafts'].map(suffix => `${board}${suffix}.test.ts`);
  const app = 'tools/plugin-app.test.ts';
  add('test (app)', 'chromium', [app]);
  const ordinary = files.filter(file => file !== app && !boardFiles.includes(file));
  balance(ordinary, 2, file => testSeconds.get(file) ?? 3)
    .forEach((group, i) => add(`test (${i + 1})`, 'chromium', group));
  for (const file of boardFiles) {
    const name = file.slice('tools/plugin-'.length, -'.test.ts'.length);
    add(`browser-board (${name})`, 'chromium', [file]);
  }

  const webkit = selected.filter(check => check.webkit);
  add('browser-webkit', 'webkit', [boardFiles[0], 'tools/plugin-ios-size.test.ts', 'tools/plugin-preview-size.test.ts']);
  add('browser-webkit-board (input)', 'webkit', [boardFiles[1]], webkit);
  add('browser-webkit-board (drafts)', 'webkit', [boardFiles[2]]);

  const journeys = selected.filter(check => !check.ci || check.ci === 'journey');
  balance(journeys, 3, check => check.ciSeconds ?? check.limit)
    .forEach((group, i) => add(`browser-default (${i + 1})`, 'chromium', [], selected.filter(check => group.includes(check))));
  add('browser-ui (http)', 'chromium', [], selected.filter(check => check.ci === 'plugin'));
  const fixture = selected.filter(check => check.ci === 'fixture');
  for (const browser of ['chromium', 'webkit']) {
    const name = browser === 'webkit' ? 'browser-webkit-ui' : 'browser-ui';
    for (const part of fixtures) add(`${name} (${part})`, browser, [], fixture, part);
  }
  return jobs;
}
