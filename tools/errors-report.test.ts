import { expect, it } from 'vitest';
import { formatErrorReport, sinceDays } from './errors-report';

it('groups fingerprints across builds, sorts newest first and keeps the newest sample', () => {
 const row = { fingerprint: 'a'.repeat(16), count: '2', first_seen: new Date('2026-10-01Z'), last_seen: new Date('2026-10-02Z'), build: 'a'.repeat(40), kind: 'error', name: 'Error', message: 'Earlier', frames: ['/assets/a.js:1:2'], routes: ['/'], browsers: ['Safari 18'], size_classes: ['phone'] };
 const output = formatErrorReport([row, { ...row, build: 'b'.repeat(40), count: '3', first_seen: new Date('2026-10-03Z'), last_seen: new Date('2026-10-04Z'), message: 'Later', routes: ['/g/:game'], browsers: ['Chrome 131'] }, { ...row, fingerprint: 'c'.repeat(16), last_seen: new Date('2026-10-05Z') }]);
 expect(output.indexOf('c'.repeat(16))).toBeLessThan(output.indexOf('a'.repeat(16)));
 for (const text of ['count 5', 'First: 2026-10-01', 'Last: 2026-10-04', 'a'.repeat(40), 'b'.repeat(40), '/g/:game', 'Safari 18', 'Chrome 131', 'Error: Later', '/assets/a.js:1:2']) expect(output).toContain(text);
 expect(formatErrorReport([])).toBe('No fault reports.');
});
it('accepts only a bounded day count', () => {
 expect(sinceDays([])).toBe(30); expect(sinceDays(['--since', '7'])).toBe(7);
 for (const args of [['--since', '0'], ['--since', '31'], ['--since', '1;select'], ['--since'], ['7']]) expect(() => sinceDays(args)).toThrow();
});
