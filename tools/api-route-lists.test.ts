// The route lists inside src/api/http.ts name routes by string: the `created` set (status 201), the `engine` list
// (the MAX_ACTIVE_ENGINE bound) and the special cases `route.key === '...'`. A renamed or mistyped key there drops
// out without a type error, so this test requires each such string to be a route key.
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('names only route keys in the created, engine and special-case lists of src/api/http.ts', () => {
  const http = readFileSync(new URL('../src/api/http.ts', import.meta.url), 'utf8');
  // The same key scan as tools/plugin-server-build.test.ts.
  const keys = new Set([...http.matchAll(/^  '([A-Z]+ \/api[^']*)':/gm)].map(match => match[1]));
  expect(keys.size, 'the route key scan of src/api/http.ts finds no key; update this test').toBeGreaterThan(0);
  const strings = (text: string) => [...text.matchAll(/'([^']+)'/g)].map(match => match[1]);
  const lists: Record<string, string[] | undefined> = {
    created: /const created = new Set\(\[([^\]]*)\]\)/.exec(http)?.[1]?.split(',').flatMap(strings),
    engine: /const engine = \[([^\]]*)\]/.exec(http)?.[1]?.split(',').flatMap(strings),
    'route.key ===': [...http.matchAll(/route\.key [!=]== '([^']+)'/g)].map(match => match[1]),
  };
  const stale: string[] = [];
  for (const [name, list] of Object.entries(lists)) {
    expect(list?.length, `src/api/http.ts has no ${name} list; update this test`).toBeGreaterThan(0);
    for (const key of list!) if (!keys.has(key)) stale.push(`${name}: ${key}`);
  }
  expect(stale, 'In src/api/http.ts each key of these lists must be a route key. Fix the key there or add the route').toEqual([]);
});
