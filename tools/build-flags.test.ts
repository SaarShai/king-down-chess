import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { FLAG_NAMES, scanFlags } from './build-flags.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const reads: { name: string; place: string; client: boolean }[] = scanFlags(root);
const firstPlace = (name: string) => reads.find(read => read.name === name)?.place;
const text = (file: string) => readFileSync(root + file, 'utf8');

describe('build flags and environment variables', () => {
  it('lists each name that the source reads', () => {
    const listed = new Set<string>(FLAG_NAMES);
    const missing = [...new Set(reads.map(read => read.name))].filter(name => !listed.has(name)).sort()
      .map(name => `${firstPlace(name)} reads ${name}, which tools/build-flags.mjs does not list. If it is a typo, use the listed name. Else add it to FLAG_NAMES, and look at each place that the comment of tools/build-flags.mjs names`);
    expect(missing).toEqual([]);
  });

  it('lists no name that the source does not read', () => {
    const read = new Set(reads.map(read => read.name));
    const stale = FLAG_NAMES.filter(name => !read.has(name))
      .map(name => `tools/build-flags.mjs lists ${name}, but no file in src/ or tools/ reads it. Remove it from FLAG_NAMES`);
    expect(stale).toEqual([]);
  });
});

describe('import.meta.env names in src', () => {
  // Vite gives a bundle only the VITE_* names and its built-in names. Each other name needs a define, else it reads undefined.
  it('each non-VITE_ name has a define in the plugin server build', () => {
    const build = text('tools/plugin-server-build.mjs');
    const names = [...new Set(reads.filter(read => read.client && read.place.startsWith('src/') && !read.name.startsWith('VITE_')).map(read => read.name))];
    expect(names.length).toBeGreaterThan(0);
    const undefinedNames = names.filter(name => !build.includes(`'import.meta.env.${name}'`))
      .map(name => `${firstPlace(name)} reads import.meta.env.${name}, but tools/plugin-server-build.mjs has no define of 'import.meta.env.${name}'. Add the define to each build of a bundle that holds the file, or the bundle reads undefined`);
    expect(undefinedNames).toEqual([]);
  });
});

describe('KINGDOWN_TEST_* names', () => {
  // `npm run test:changed` runs `npm test` with this clear list, so a filter of the caller's shell cannot select the tests.
  const plan = text('tools/ci-plan.mjs'), tests = plan.slice(plan.indexOf("process.argv[2] === 'tests'"));
  const call = tests.slice(tests.indexOf("run(['test'], {")).split('\n', 1)[0];
  const cleared = new Set([...call.matchAll(/(KINGDOWN_TEST_[A-Z0-9_]+):/g)].map(match => match[1]));
  // Each name here may pass from the caller's shell into the child `npm test`.
  const KEPT: Record<string, string> = {
    KINGDOWN_TEST_BASE: 'only tools/ci-plan.mjs reads it, to find the base of the change',
    KINGDOWN_TEST_WHY: 'only tools/ci-plan.mjs reads it, to print why it selects a slow file',
    KINGDOWN_TEST_LOCKED: 'tools/test-lock.sh sets it; a child command uses the lease of its parent',
    KINGDOWN_TEST_LOCK_WAIT: 'it sets only how long tools/test-lock.sh waits for the lease',
    KINGDOWN_TEST_OUT: 'it sets only the output folder of ios/store.test.ts',
    KINGDOWN_TEST_PAGES: 'it adds test pages to a build; src/interface/people/screens/build.test.ts sets its own value',
  };

  it('finds the clear list of the child npm test', () => {
    expect(cleared.has('KINGDOWN_TEST_FILE')).toBe(true);
  });

  it('clears each name in the child npm test, or keeps it for a reason', () => {
    const names = [...new Set(reads.map(read => read.name).filter(name => name.startsWith('KINGDOWN_TEST_')))].sort();
    const open = names.filter(name => !cleared.has(name) && !(name in KEPT))
      .map(name => `${firstPlace(name)} reads ${name}. Add ${name}: '' to the run(['test'], ...) call of the 'tests' mode in tools/ci-plan.mjs, or add it to KEPT in tools/build-flags.test.ts with the reason that it can pass to the child npm test`);
    expect(open).toEqual([]);
    expect(Object.keys(KEPT).filter(name => !names.includes(name) || cleared.has(name))).toEqual([]);
  });
});
