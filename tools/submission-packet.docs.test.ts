// Ticket 15 (part 15-packet): the packet grades and texts must fit the merged build.
import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';

const checklist = readFileSync('docs/submission/checklist.md', 'utf8');
const grade = (n: number) => checklist.match(new RegExp(`^\\| ${n} \\|[^|]*\\|[^|]*\\| ([^|]+) \\|`, 'm'))![1];

test('the re-check grades rows 8, 17, 27, 31, 33 and 40', () => {
 expect([8, 17, 27, 31, 33, 40].map(grade)).toEqual(['met', 'owner: screenshots required', 'met', 'met', 'met', 'met (code)']);
});

test('N2 gives the King Down scope as its reason, not a hint value', () => {
 const n2 = readFileSync('docs/submission/test-cases.md', 'utf8').match(/^\| N2 \|.*$/m)![0];
 expect(n2).toContain('Every tool acts only on King Down games and accounts');
 expect(n2).not.toContain('openWorldHint');
});

test('the limit refusals quoted in row 31 are the server text', () => {
 expect(readFileSync('src/plugin/service.ts', 'utf8')).toContain("'Too many new games. Wait one minute, then try again.'");
 expect(checklist).toContain('"Too many new games. Wait one minute, then try again."');
});

test('the release notes record the short-code decision, and the runbook has the website note', () => {
 expect(readFileSync('docs/submission/release-notes.md', 'utf8')).toContain('the listing needs no note about the change from plain short codes to HMAC short codes');
 expect(readFileSync('docs/specs/chatgpt-mvp/release/RUNBOOK.md', 'utf8')).toContain('Old short codes stop working at this release');
});
