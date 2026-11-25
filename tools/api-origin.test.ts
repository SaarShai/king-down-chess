// The site-origin rules of docs/IOS.md. The app page is capacitor://localhost, so a relative site link or /api call
// does not reach the site there. A link or call that the code builds from parts passes these scans.
import { readdirSync, readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

const sources = readdirSync('src', { recursive: true, encoding: 'utf8' })
  .filter(file => /\.(?:ts|mjs|js|html)$/.test(file) && !/\.test\./.test(file))
  .map(file => ({ file: `src/${file}`, text: readFileSync(`src/${file}`, 'utf8') }));
/** Each match of `pattern` as `file:line: text`. */
const hits = (pattern: RegExp) => sources.flatMap(({ file, text }) => text.split('\n')
  .flatMap((line, at) => [...line.matchAll(pattern)].map(match => ({ where: `${file}:${at + 1}`, match }))));

it('reads the source files', () => expect(sources.length).toBeGreaterThan(100));

it('gives no site page link a relative path: a link from the app to a site page uses apiOrigin', () => {
  expect(hits(/\bhref\s*[=:]/g).length).toBeGreaterThan(0);
  // next.html and index.html are pages of the bundle.
  const links = hits(/href\s*[=:]\s*(['"`])(\/[^'"`#?]*\.html)[^'"`]*\1/g)
    .filter(({ match }) => !['/next.html', '/index.html'].includes(match[2])).map(({ where, match }) => `${where}: ${match[2]}`);
  expect(links).toEqual([]);
});

it('starts no /api call with a relative path: an /api call uses apiOrigin', () => {
  const calls = hits(/\b(?:fetch|sendBeacon)(?:\?\.)?\(\s*['"`]\/api/g).map(({ where }) => where);
  // The website beacon: the app sends its reports with fetch to apiOrigin.
  expect(calls).toEqual([`src/diagnostics/browser.ts:${sources.find(({ file }) => file === 'src/diagnostics/browser.ts')!.text.split('\n')
    .findIndex(line => line.includes("if (!apiOrigin) try { queued = navigator.sendBeacon?.('/api/client-errors'")) + 1}`]);
});

it('gives each online client origin: apiOrigin', () => {
  const clients = sources.flatMap(({ file, text }) => [...text.matchAll(/(?<!function )\bonlineClient\(\{/g)].map(match => {
    let depth = 0, end = match.index + match[0].length - 1;
    do { if (text[end] === '{') depth++; else if (text[end] === '}') depth--; end++; } while (depth);
    return { file, options: text.slice(match.index + match[0].length - 1, end) };
  }));
  expect(clients.length).toBeGreaterThan(0);
  for (const { file, options } of clients) expect(options, file).toMatch(/\borigin: apiOrigin\b/);
});
