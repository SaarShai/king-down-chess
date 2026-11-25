import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FLAG_NAMES, scanFlags } from './build-flags.mjs';

const root = new URL('..', import.meta.url).pathname;
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
