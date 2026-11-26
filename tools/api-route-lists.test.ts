// The route lists inside src/api/http.ts name routes by string: the `created` set (status 201), the `engine` list
// (the MAX_ACTIVE_ENGINE bound) and the special cases `route.key === '...'`. A renamed or mistyped key there drops
// out without a type error, so this test requires each such string to be a route key.
// It also holds each route key to the one form that tools/plugin-server-build.test.ts reads (two spaces, single quotes).
import { expect, it } from 'vitest';
import { httpSource, quoted, routeKeys, strictRouteKeys } from './api-route-keys';

it('writes each route key of src/api/http.ts in the form that every key scan reads', () => {
  const http = httpSource(), strict = new Set(strictRouteKeys(http));
  expect(routeKeys(http).length, 'the route key scan of tools/api-route-keys.ts finds no key in src/api/http.ts; update the scan').toBeGreaterThan(0);
  const other = routeKeys(http).filter(key => !strict.has(key))
    .map(key => `src/api/http.ts: write the route key ${key} on its own line as two spaces, single quotes and a colon (  '${key}': ...); tools/plugin-server-build.test.ts and the operation sets read that form only`);
  expect(other).toEqual([]);
});

it('names only route keys in the created, engine and special-case lists of src/api/http.ts', () => {
  const http = httpSource(), keys = new Set(routeKeys(http));
  const lists: Record<string, string[] | undefined> = {
    created: /const created = new Set\(\[([^\]]*)\]\)/.exec(http)?.[1]?.split(',').flatMap(quoted),
    engine: /const engine = \[([^\]]*)\]/.exec(http)?.[1]?.split(',').flatMap(quoted),
    'route.key ===': [...http.matchAll(/route\.key\s*[!=]==?\s*(['"`])([^'"`]+)\1/g)].map(match => match[2]),
  };
  const stale: string[] = [];
  for (const [name, list] of Object.entries(lists)) {
    expect(list?.length, `src/api/http.ts has no ${name} list; update this test`).toBeGreaterThan(0);
    for (const key of list!) if (!keys.has(key)) stale.push(`${name}: ${key}`);
  }
  expect(stale, 'In src/api/http.ts each key of these lists must be a route key of the routes object. Fix the key there or add the route').toEqual([]);
});
