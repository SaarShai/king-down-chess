// The lean-build park (docs/PARKED.md) has a ticket in the specs folder, as AGENTS.md asks: it holds the
// owner's request, the plan, the verification results and the review record.
import { existsSync, readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

const TICKET = 'docs/specs/park-lean/spec.md';

it('docs/PARKED.md links to its ticket', () => {
  expect(readFileSync('docs/PARKED.md', 'utf8')).toContain('(specs/park-lean/spec.md)');
});

it('the park ticket holds the request, the plan, the verification and the reviews', () => {
  expect(existsSync(TICKET), TICKET).toBe(true);
  const text = readFileSync(TICKET, 'utf8');
  expect(text).toMatch(/^Status: /m);
  for (const heading of ["## 1. The owner's words", '## 2. The plan', '## 3. Verification', '## 4. Reviews'])
    expect(text, heading).toContain(heading);
  for (const commit of ['50c492f1', '067f6b78']) expect(text, commit).toContain(commit);
});
