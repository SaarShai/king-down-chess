import { describe, expect, it } from 'vitest';
import { browserFamily, browserFrames, errorFingerprint, errorName, errorRoute, errorMessage, scrub } from './data';
import { serverFrames } from './server';
import { fromFen } from '../rules/setup';

describe('fault report data', () => {
 it('removes private values before the 300-character cut', () => {
  // Build the token fixture from parts so the source secret check stays active.
  const values = ['person@example.com', 'd137864c-e174-4f38-9277-6bdd0a4289dc', 'abcdef0123456789abcd', 'aB+/'.repeat(12), 'Bearer short-token', 'token=small', `token='private message'`, 'sb_' + 'secret_short', 'eyJabc.def.ghi', 'password:small', 'https://example.com/g/private?q=secret#secret', "'private message'", 'e2-e4', 'Ra1-a4!H', 'Nf3', 'e4', '127.0.0.1', '2001:db8::1', 'k7/8/8/8/8/8/8/K7', '/play/?token=secret#private'];
  for (const value of values) {
   expect(scrub(`Fault ${value}`)).toContain('[redacted]');
   expect(scrub(`Fault ${value}`)).not.toContain(value);
  }
  expect(scrub('a'.repeat(280) + ' ' + 'person@example.com')).not.toContain('person@');
  expect(scrub('word '.repeat(100))).toHaveLength(300);
  expect(scrub('Fault\nline\u0000')).toBe('Fault line ');
  expect(scrub(scrub('Fault token=secret'))).toBe(scrub('Fault token=secret'));
  expect(errorName('person@example.com')).toBe('Error');
 });
 it('keeps at most ten own bundle locations, with no origin or query', () => {
  const own = 'https://kingdown.dev';
  const stack = `Error: fault\n    at fn (${own}/assets/index-AbC.js?secret=yes#token:12:7)\nfn@${own}/assets/worker-X.js:2:3\n    at extension (chrome-extension://extension/page.js:1:1)\n    at foreign (https://other.example/assets/main.js:4:8)\n    at input (${own}/g/private.js:1:1)`;
  expect(browserFrames(stack, own, 'fault')).toEqual(['/assets/index-AbC.js:12:7', '/assets/worker-X.js:2:3']);
  expect(browserFrames(Array(12).fill(`    at ${own}/assets/index.js:1:2`).join('\n'), own, '')).toHaveLength(10);
  expect(browserFrames('Error at chrome-extension://a/file.js:1:2', own, '')).toEqual([]);
  expect(browserFrames(`    at ${own}/assets/../../private.js:1:2`, own, '')).toEqual([]);
 });
 it('removes all non-route words and all game IDs', () => {
  expect(errorRoute('/g/d137864c-e174-4f38-9277-6bdd0a4289dc?token=x#private')).toBe('/g/:game');
  expect(errorRoute('/play/private-id')).toBe('/play/:game');
  expect(errorRoute('/api/games/private-id/commands')).toBe('/api/games/:game/commands');
  expect(errorRoute('/private/12345')).toBe('/:id/:id');
  for (const path of ['/', '/play/profile', '/play/settings', '/api/games/find', '/g/:game']) expect(errorRoute(path)).toBe(path);
 });
 it.each([
  '    at https://kingdown.dev/assets/private.js:12345678:91 (https://kingdown.dev/assets/app.js:2:4)',
  '    at https://kingdown.dev/assets/app.js:2:4',
  'https://kingdown.dev/assets/private.js:12345678:91@https://kingdown.dev/assets/app.js:2:4',
  '@https://kingdown.dev/assets/app.js:2:4',
 ])('reads only the file location: %s', line => {
  const message = 'Private input\n    at https://kingdown.dev/assets/message.js:87654321:92\nf@https://kingdown.dev/assets/message.js:76543210:93';
  expect(browserFrames(`TypeError: ${message}\n${line}`, 'https://kingdown.dev', message, 'TypeError')).toEqual(['/assets/app.js:2:4']);
  expect(browserFrames(line, 'https://kingdown.dev', message, 'TypeError')).toEqual(['/assets/app.js:2:4']);
 });
 it('groups a message pattern and top location, with a stable fingerprint', () => {
  const first = errorFingerprint('Error', 'Load failed after 12 ms', '/assets/app.js:1:2');
  expect(first).toMatch(/^[a-f0-9]{16}$/);
  expect(errorFingerprint('Error', 'Load failed after 99 ms', '/assets/app.js:1:2')).toBe(first);
  expect(errorFingerprint('Error', 'Load failed after 12 ms', '/assets/app.js:1:3')).not.toBe(first);
  expect(errorFingerprint('TypeError', 'Load failed after 12 ms', '/assets/app.js:1:2')).not.toBe(first);
 });
 it.each([
  ['Mozilla Version/18.4 Safari/605.1.15', 'Safari 18'], ['Chrome/131.0 Safari/537.36', 'Chrome 131'],
  ['Chrome/131.0 Safari/537.36 Edg/131.2', 'Edge 131'], ['Chrome/130.0 OPR/115.0', 'Opera 115'],
  ['Firefox/132.0', 'Firefox 132'], ['FxiOS/129.2 Mobile Safari/605.1', 'Firefox 129'],
  ['CriOS/130.0 Mobile Safari/604.1', 'Chrome 130'], ['EdgiOS/130.0 Safari/604.1', 'Edge 130'], ['private raw agent', 'Other'],
 ])('reduces %s to %s', (ua, expected) => expect(browserFamily(ua)).toBe(expected));
 it('keeps only app server locations, without a machine path', () => {
  expect(serverFrames('Error: fault\n    at f (/private/task/src/api/http.ts:23:8)\n    at g (file:///var/task/server.mjs:4:9)\n    at z (/var/task/runtime/index.mjs:1:2)\n    at pg (/task/node_modules/pg/src/index.ts:2:3)\n    at x (node:internal/thing:1:1)', 'fault')).toEqual(['src/api/http.ts:23:8', 'server.mjs:4:9', 'runtime/index.mjs:1:2']);
 });
});

it('keeps source forms and removes each template value', () => {
 for (const [raw, expected] of [
  ['Invalid game setup', 'Invalid game setup'], ['bad FEN t7/8/8/8/8/8/8/K6X w - - 0 1', 'bad FEN [value]'],
  ['unknown king "private" (private | none)', 'unknown king [redacted] ([value] | none)'],
 ]) { expect(errorMessage(raw)).toBe(expected); expect(errorMessage(expected)).toBe(expected); }
});
it('keeps only fixed engine forms', () => {
 for (const text of ["Cannot read properties of undefined (reading 'x')", 'x is not a function', "undefined is not an object (evaluating 'a.b')", 'Failed to fetch', 'Load failed', 'NetworkError when attempting to fetch resource.', 'Maximum call stack size exceeded', 'fetch failed']) {
  const kept = errorMessage(text); expect(kept).not.toBe('Unlisted message'); expect(errorMessage(kept)).toBe(kept);
 }
 for (const text of ["Cannot read properties of undefined (reading 'private message')", '123456789 is not a function', 'a'.repeat(33) + ' is not a function', "undefined is not an object (evaluating '/path?private#fragment')"]) expect(errorMessage(text)).toBe('Unlisted message');
 expect(errorMessage('Failed to fetch dynamically imported module: https://example.com/private?id=secret#fragment')).toBe('Dynamic import failed');
});
it.each(['account123456789', 'K6X', 'MeetMeAtTheStation', 'e2e4'])('removes each engine name: %s', value => {
 for (const [raw, expected] of [
  [`Cannot read properties of undefined (reading '${value}')`, 'Cannot read properties of [value] (reading [value])'],
  [`Cannot read properties of null (reading '${value}')`, 'Cannot read properties of [value] (reading [value])'],
  [`${value} is not a function`, '[value] is not a function'],
  [`undefined is not an object (evaluating '${value}')`, '[value] is not an object (evaluating [value])'],
  [`${value} is not defined`, '[value] is not defined'],
 ]) {
  expect(errorMessage(raw)).toBe(expected);
  expect(errorMessage(expected)).toBe(expected);
 }
});
it('does not read false stack lines from the full error message', () => {
 const message = 'Unexpected input\nsrc/api/private-id.ts:1:2\n    at f (/task/src/api/private-id.ts:1:2)';
 const error = new Error(message);
 error.stack = `Error: ${message}\n    at f (/task/server.mjs:10:20)`;
 expect(serverFrames(error.stack, error.message)).toEqual(['server.mjs:10:20']);
 expect(serverFrames('Error: other\n    at f (/task/server.mjs:1:2)', error.message)).toEqual([]);
});

it('removes the board from the real FEN parser fault', () => {
 let fault: Error | undefined;
 try { fromFen('t7/8/8/8/8/8/8/K6X w - - 0 1'); } catch (error) { fault = error as Error; }
 expect(fault?.message).toContain('bad FEN ');
 expect(errorMessage(fault!.message)).toBe('bad FEN [value]');
});
