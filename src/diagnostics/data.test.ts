import { describe, expect, it } from 'vitest';
import { browserFamily, errorFingerprint, errorName, errorRoute, errorMessage, scrub } from './data';
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
 it('removes all non-route words and all game IDs', () => {
  expect(errorRoute('/g/d137864c-e174-4f38-9277-6bdd0a4289dc?token=x#private')).toBe('/g/:game');
  expect(errorRoute('/play/private-id')).toBe('/other');
  expect(errorRoute('/api/games/private-id/commands')).toBe('/api/games/:game/commands');
  expect(errorRoute('/private/12345')).toBe('/other');
  for (const path of ['/', '/play/profile', '/play/settings', '/api/games/find', '/g/:game']) expect(errorRoute(path)).toBe(path);
 });
 it('groups by fixed name, cleaned message, cleaned route and build', () => {
  const build = 'a'.repeat(40), first = errorFingerprint('Error', 'Failed to fetch', '/play', build);
  expect(first).toMatch(/^[a-f0-9]{16}$/);
  expect(errorFingerprint('Error', 'Failed to fetch', '/play', build)).toBe(first);
  expect(errorFingerprint('Error', 'Load failed', '/play', build)).not.toBe(first);
  expect(errorFingerprint('Error', 'Failed to fetch', '/profile', build)).not.toBe(first);
  expect(errorFingerprint('Error', 'Failed to fetch', '/play', 'b'.repeat(40))).not.toBe(first);
  expect(errorFingerprint('TypeError', 'Failed to fetch', '/play', build)).not.toBe(first);
 });
 it.each([
  ['Mozilla Version/18.4 Safari/605.1.15', 'Safari 18'], ['Chrome/131.0 Safari/537.36', 'Chrome 131'],
  ['Chrome/131.0 Safari/537.36 Edg/131.2', 'Edge 131'], ['Chrome/130.0 OPR/115.0', 'Opera 115'],
  ['Firefox/132.0', 'Firefox 132'], ['FxiOS/129.2 Mobile Safari/605.1', 'Firefox 129'],
  ['CriOS/130.0 Mobile Safari/604.1', 'Chrome 130'], ['EdgiOS/130.0 Safari/604.1', 'Edge 130'], ['private raw agent', 'Other'],
 ])('reduces %s to %s', (ua, expected) => expect(browserFamily(ua)).toBe(expected));

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
  [`undefined is not an object (evaluating '${value}')`, 'Cannot read properties of [value] (reading [value])'],
  [`${value} is not defined`, '[value] is not defined'],
 ]) {
  expect(errorMessage(raw)).toBe(expected);
  expect(errorMessage(expected)).toBe(expected);
 }
});
it('removes the board from the real FEN parser fault', () => {
 let fault: Error | undefined;
 try { fromFen('t7/8/8/8/8/8/8/K6X w - - 0 1'); } catch (error) { fault = error as Error; }
 expect(fault?.message).toContain('bad FEN ');
 expect(errorMessage(fault!.message)).toBe('bad FEN [value]');
});

it('maps made-up routes to one value and keeps real API patterns', () => {
 for (let i = 0; i < 32; i++) {
  const path = '/play/profile/' + Array.from({ length: 5 }, (_, bit) => i & (1 << bit) ? 'settings' : 'profile').join('/');
  expect(errorRoute(path)).toBe('/other');
 }
 for (const suffix of ['', '/accept', '/cancel', '/preview', '/seen', '/commands', '/invite']) {
  expect(errorRoute('/api/games/private-game' + suffix)).toBe('/api/games/:game' + suffix);
  expect(errorRoute('/api/games/:game' + suffix)).toBe('/api/games/:game' + suffix);
 }
 for (const path of ['/j/', '/play/', '/play/profile/', '/play/settings/']) expect(errorRoute(path)).toBe(path.slice(0, -1));
});

it.each([
 ['Invalid array length', 'Invalid array length'], ['invalid array length', 'Invalid array length'],
 ['Invalid time value', 'Invalid time value'], ['invalid date', 'Invalid time value'],
 ['Cannot convert undefined or null to object', 'Cannot convert undefined or null to object'],
 ["can't convert null to object", 'Cannot convert undefined or null to object'],
 ["can't convert undefined to object", 'Cannot convert undefined or null to object'],
 ['Assignment to constant variable.', 'Assignment to constant variable.'],
 ["invalid assignment to const 'privateValue'", 'Assignment to constant variable.'],
 ["Cannot set properties of undefined (setting 'account123456789')", 'Cannot set properties of [value] (setting [value])'],
 ["Cannot set properties of null (setting 'account123456789')", 'Cannot set properties of [value] (setting [value])'],
 ['can\'t access property "account123456789", privateValue is undefined', 'Cannot read properties of [value] (reading [value])'],
 ['can\'t access property "account123456789", privateValue is null', 'Cannot read properties of [value] (reading [value])'],
])('keeps a fixed category for %s', (raw, expected) => {
 expect(errorMessage(raw)).toBe(expected); expect(errorMessage(expected)).toBe(expected);
 expect(expected).not.toMatch(/account123456789|privateValue/);
});

it('rejects variable text outside the bounded native forms', () => {
 for (const raw of [
  'Invalid array length 12345', 'invalid date privateValue', 'Assignment to constant variable. privateValue',
  "Cannot set properties of undefined (setting '12345')", "Cannot set properties of null (setting 'a[privateValue]')",
  `Cannot set properties of null (setting '${'x'.repeat(33)}')`,
  'can\'t access property "privateValue", x[12345] is undefined',
  'can\'t access property "{privateValue:12345}", x is null',
  "invalid assignment to const '12345'", 'JSON.parse: unexpected character at line 1 column 12345 of the JSON data',
 ]) expect(errorMessage(raw)).toBe('Unlisted message');
});
