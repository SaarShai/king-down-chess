// Ticket lint for the QA known-red list (checks-and-hooks/09, story 15). Each entry in
// tools/qa-known-red.json must name an open ticket file in the specs tracker. The fixture cases use a
// temporary root; the last case lints the real list in this checkout.
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { lintList } from './lib/known-red.mjs';

const roots: string[] = [];
afterEach(() => { while (roots.length) rmSync(roots.pop()!, { recursive: true, force: true }); });

/** A temporary root with one ticket file for each { path: status line } item. */
function root(tickets: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), 'known-red-lint-'));
  roots.push(dir);
  for (const [path, status] of Object.entries(tickets)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), `# A fault\n\n${status}\n\nBody.\n`);
  }
  return dir;
}

const TICKET = 'docs/specs/some-feature/issues/01-a-fault.md';

describe('known-red ticket lint', () => {
  it('the empty list passes', () => {
    expect(lintList({}, root({}))).toEqual([]);
  });

  it('an entry with an open ticket passes', () => {
    expect(lintList({ 'a case': TICKET }, root({ [TICKET]: '**Status:** ready-for-agent' }))).toEqual([]);
    expect(lintList({ 'a case': TICKET }, root({ [TICKET]: 'Status: needs-triage' }))).toEqual([]);
  });

  it('an entry whose ticket file does not exist fails', () => {
    const faults = lintList({ 'a case': TICKET }, root({}));
    expect(faults).toHaveLength(1);
    expect(faults[0]).toMatch(/a case.*01-a-fault\.md.*does not exist/);
  });

  it('an entry whose ticket is resolved or wontfix fails', () => {
    expect(lintList({ 'a case': TICKET }, root({ [TICKET]: '**Status:** resolved' }))[0]).toMatch(/a case.*status is resolved/);
    expect(lintList({ 'a case': TICKET }, root({ [TICKET]: 'Status: wontfix' }))[0]).toMatch(/a case.*status is wontfix/);
  });

  it('an entry whose ticket has no Status line fails', () => {
    const dir = root({ [TICKET]: 'No status here.' });
    expect(lintList({ 'a case': TICKET }, dir)[0]).toMatch(/a case.*no Status line/);
  });

  it('an entry outside the specs tracker fails', () => {
    const path = 'TASKS.md';
    expect(lintList({ 'a case': path }, root({ [path]: 'Status: open' }))[0]).toMatch(/a case.*not a ticket in docs\/specs/);
  });

  it('the list in this checkout names open tickets only', () => {
    const list = JSON.parse(readFileSync(join(__dirname, 'qa-known-red.json'), 'utf8'));
    expect(lintList(list, join(__dirname, '..'))).toEqual([]);
  });
});
