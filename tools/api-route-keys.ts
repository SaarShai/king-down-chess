// The route keys of src/api/http.ts, read in every form: any indentation, single or double quotes (a back quote is not
// a valid object key), and more than one key on a line. The tests that read the keys use this scan, so a key in another form cannot drop out of a list.
// tools/api-route-lists.test.ts holds the keys to the one form that the scan of tools/plugin-server-build.test.ts reads.
import { readFileSync } from 'node:fs';

export const httpSource = () => readFileSync(new URL('../src/api/http.ts', import.meta.url), 'utf8');

/** The text of the `routes` object of createApiHandler; it throws when the scan cannot find the object. */
export function routesBlock(http: string): string {
  const start = http.indexOf('const routes: Record<string, Route> = {'), end = http.indexOf('\n };\n', start);
  if (start < 0 || end < 0) throw new Error('src/api/http.ts: the scan of tools/api-route-keys.ts finds no "const routes: Record<string, Route> = {" ... " };" block; update the scan');
  return http.slice(start, end);
}

/** Each route key of the `routes` object, in any form. */
export const routeKeys = (http = httpSource()) =>
  [...routesBlock(http).matchAll(/(?:^|[{,])[ \t]*(['"])([A-Z]+ \/api[^'"]*)\1[ \t]*:/gm)].map(match => match[2]);

/** The one form that the strict scans read: two spaces, single quotes, a colon. */
export const strictRouteKeys = (http = httpSource()) => [...http.matchAll(/^  '([A-Z]+ \/api[^']*)':/gm)].map(match => match[1]);

/** The strings of a list, in single, double or back quotes. */
export const quoted = (text: string) => [...text.matchAll(/(['"`])([^'"`]+)\1/g)].map(match => match[2]);
