// Classifier unit test for the QA known-red list (checks-and-hooks/09, story 15).
// A case result is { id, ok }; the list maps a case id to its open ticket.
import { describe, expect, it } from 'vitest';
import { classify } from './known-red.mjs';

const list = { 'listed case': 'docs/specs/some-feature/issues/01-a-fault.md' };

describe('classify', () => {
  it('a listed fail gives XFAIL, and the run passes', () => {
    const run = classify([{ id: 'listed case', ok: false }], list);
    expect(run.cases).toEqual([{ id: 'listed case', verdict: 'XFAIL', ticket: list['listed case'] }]);
    expect(run.ok).toBe(true);
  });

  it('a listed pass gives XPASS, and the run fails', () => {
    const run = classify([{ id: 'listed case', ok: true }], list);
    expect(run.cases[0].verdict).toBe('XPASS');
    expect(run.ok).toBe(false);
  });

  it('an unlisted fail gives FAIL, and the run fails', () => {
    const run = classify([{ id: 'other case', ok: false }], list);
    expect(run.cases[0]).toEqual({ id: 'other case', verdict: 'FAIL', ticket: null });
    expect(run.ok).toBe(false);
  });

  it('an unlisted pass gives PASS, and the run passes', () => {
    const run = classify([{ id: 'other case', ok: true }], list);
    expect(run.cases[0].verdict).toBe('PASS');
    expect(run.ok).toBe(true);
  });

  it('counts each verdict for the final line', () => {
    const run = classify([
      { id: 'a', ok: true }, { id: 'b', ok: true }, { id: 'c', ok: false }, { id: 'listed case', ok: false },
    ], list);
    expect(run.counts).toEqual({ PASS: 2, FAIL: 1, XFAIL: 1, XPASS: 0 });
    expect(run.summary).toBe('qa: 2 PASS, 1 FAIL, 1 XFAIL, 0 XPASS');
    expect(run.ok).toBe(false);
  });
});
