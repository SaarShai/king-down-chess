import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/** The Workshop stylesheets (the old Workshop's and the Proving Ground's) hold no rule for a class that no Workshop markup uses. */
const here = new URL('./', import.meta.url);
const read = (u: URL): string => readFileSync(u, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
// The Workshop source, and the shared piece icons that it puts into Try it.
const source = [
  ...readdirSync(here).filter(f => f.endsWith('.ts') && !f.endsWith('.test.ts')).map(f => read(new URL(f, here))),
  read(new URL('../piece-icons.ts', import.meta.url)),
].join('\n').replace(/^\s*\/\/.*$/gm, '');
// A data URI (the legend's SVGs) holds no class: "www.w3.org" is not one.
const css = ['workshop.css', 'ground.css'].map(f => read(new URL(f, here))).join('\n').replace(/url\("[^"]*"\)/g, 'url()');
const classes = [...new Set([...css.matchAll(/\.(-?[_a-zA-Z][-\w]*)/g)].map(m => m[1]))];
const esc = (s: string): string => s.replace(/[$-]/g, '\\$&');

// The class families that the source makes from a value, as `mk-${kind}`.
const MADE = ['ln-', 'mk-', 'f-'];

/** A class is in use when the source names it in a selector (`.name`) or as a word in a class string. */
const used = (c: string): boolean =>
  new RegExp(`\\.${esc(c)}(?![-\\w])`).test(source) || new RegExp(`["'\`\\s]${esc(c)}(?=["'\`\\s$])`).test(source);

describe('workshop.css and ground.css', () => {
  it('styles only classes that the Workshop source uses', () => {
    expect(classes.length).toBeGreaterThan(50);
    expect(classes.filter(c => !used(c) && !MADE.some(p => c.startsWith(p)))).toEqual([]);
  });

  it('styles each made class family that the source makes', () => {
    for (const p of MADE) expect(source.includes(`${p}\${`), p).toBe(true);
  });
});
