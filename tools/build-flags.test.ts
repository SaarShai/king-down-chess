import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { BUNDLES, defineBlock, FLAG_NAMES, importGraph, scanFlags } from './build-flags.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
// The quoted folders also make tools/lib/test-select.mjs select this test for a change of any file in them.
const reads: { name: string; place: string; client: boolean }[] = scanFlags(root, ['src/', 'tools/', 'vite.config.ts', 'package.json']);
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

describe('import.meta.env names in each bundle', () => {
  // Vite gives a bundle only the VITE_* names and its built-in names. Each other name needs a define in the build() call
  // of each bundle that holds the file, else that bundle reads undefined. BUNDLES in tools/build-flags.mjs lists the bundles.
  const own = (read: { name: string; client: boolean }) => read.client && !read.name.startsWith('VITE_');
  const graphs = BUNDLES.map(bundle => ({ ...bundle, files: importGraph(root, bundle.entries, 'external' in bundle ? bundle.external : []) as Set<string>, block: defineBlock(text(bundle.build), bundle.call) as string | undefined }));
  const file = (place: string) => place.slice(0, place.lastIndexOf(':'));

  it('finds the entries and the define block of each bundle', () => {
    const broken = graphs.flatMap(bundle => [
      ...bundle.entries.filter(entry => !existsSync(root + entry)).map(entry => `BUNDLES in tools/build-flags.mjs: the ${bundle.name} bundle names the entry ${entry}, which does not exist. Give the entry file of the bundle`),
      ...bundle.block === undefined ? [`BUNDLES in tools/build-flags.mjs: ${bundle.build} has not one build() call with ${bundle.call} and a closed define block. Give a text that only the build() call of the ${bundle.name} bundle holds`] : [],
    ]);
    expect(broken).toEqual([]);
  });

  it('each non-VITE_ name has a define in each bundle that reads it', () => {
    const names = reads.filter(own);
    expect(names.length).toBeGreaterThan(0);
    const undefinedNames = [...new Set(graphs.flatMap(bundle => names.filter(read => bundle.files.has(file(read.place)) && !bundle.block?.includes(`'import.meta.env.${read.name}'`))
      .map(read => `${read.place} reads import.meta.env.${read.name}, and the ${bundle.name} bundle holds the file, but ${bundle.call ? `the build() call with ${bundle.call} in ${bundle.build}` : `the define block of ${bundle.build}`} has no define of 'import.meta.env.${read.name}'. Add 'import.meta.env.${read.name}': JSON.stringify(...) to its define block, or the bundle reads undefined`)))];
    expect(undefinedNames).toEqual([]);
  });

  it('does not follow an import that holds only type specifiers', () => {
    // Vite removes `import { type X } from` and `export { type X } from`, so the bundle does not hold the target file.
    const dir = mkdtempSync(join(tmpdir(), 'build-flags-graph-'));
    try {
      const files: Record<string, string> = {
        'entry.ts': "import { type A } from './only-type';\nimport {\n  type B,\n  type C,\n} from './only-type-lines';\nexport { type D } from './only-type-export';\nimport { type E, value } from './mixed';\nimport Main, { type F } from './default';\nimport {} from './empty';\nimport './side';\n",
      };
      for (const name of ['only-type', 'only-type-lines', 'only-type-export', 'mixed', 'default', 'empty', 'side']) files[`${name}.ts`] = 'export const value = 1;\n';
      for (const [name, code] of Object.entries(files)) writeFileSync(join(dir, name), code);
      const graph = [...(importGraph(dir, ['entry.ts']) as Set<string>)].sort();
      expect(graph, 'importGraph in tools/build-flags.mjs: skip an import whose specifiers are all types, and follow each other import').toEqual(['default.ts', 'empty.ts', 'entry.ts', 'mixed.ts', 'side.ts']);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });

  it('each file that reads a non-VITE_ name is in a listed bundle', () => {
    // A build file names each define key as 'import.meta.env.NAME'; that is not a read.
    const builds = new Set(BUNDLES.map(bundle => bundle.build));
    const lost = [...new Set(reads.filter(read => own(read) && !builds.has(file(read.place)) && !graphs.some(bundle => bundle.files.has(file(read.place))))
      .map(read => `${read.place} reads import.meta.env.${read.name}, but no bundle in BUNDLES of tools/build-flags.mjs imports the file. Add the bundle that holds it to BUNDLES (its build file, its build() call and its entries), and give that call a define of 'import.meta.env.${read.name}'`))];
    expect(lost).toEqual([]);
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
    expect(cleared.has('KINGDOWN_TEST_FILE'), "tools/build-flags.test.ts finds no clear list in the run(['test'], ...) call of the 'tests' mode in tools/ci-plan.mjs; update its reader of that call").toBe(true);
  });

  it('clears each name in the child npm test, or keeps it for a reason', () => {
    const names = [...new Set(reads.map(read => read.name).filter(name => name.startsWith('KINGDOWN_TEST_')))].sort();
    const open = names.filter(name => !cleared.has(name) && !(name in KEPT))
      .map(name => `${firstPlace(name)} reads ${name}. Add ${name}: '' to the run(['test'], ...) call of the 'tests' mode in tools/ci-plan.mjs, or add it to KEPT in tools/build-flags.test.ts with the reason that it can pass to the child npm test`);
    expect(open).toEqual([]);
    expect(Object.keys(KEPT).filter(name => !names.includes(name) || cleared.has(name)), 'remove these names from KEPT in tools/build-flags.test.ts: no file reads them now, or tools/ci-plan.mjs clears them').toEqual([]);
  });
});
