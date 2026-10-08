// Unit test of the runner's first-fault line (checks-and-hooks/06, story 10): the line names the fault,
// not the source line that Node prints before an uncaught error.
import { describe, expect, it } from 'vitest';
import { firstFault } from './first-fault.mjs';

describe('firstFault(log)', () => {
  it('gives the thrown message, not the source line that holds "Error("', () => {
    const log = [
      'file:///repo/tools/lib/checks.mjs:82',
      '  throw new Error(`${name}: "${selector}" at viewport ${viewport.w}x${viewport.h}`);',
      '        ^',
      '',
      'Error: minTarget: "button" at viewport 390x844, box x=0 y=0 w=30 h=30: smaller than 44 px',
      '    at fail (file:///repo/tools/lib/checks.mjs:82:9)',
    ].join('\n');
    expect(firstFault(log)).toBe('Error: minTarget: "button" at viewport 390x844, box x=0 y=0 w=30 h=30: smaller than 44 px');
  });

  it('gives the XPASS line, not an earlier XFAIL line that holds "Error"', () => {
    const log = ['PASS a — fine', 'XFAIL b — TypeError in the menu (known-red: x/01)', 'XPASS c — it passes now (known-red: y/02)'].join('\n');
    expect(firstFault(log)).toBe('XPASS c — it passes now (known-red: y/02)');
  });

  it('gives a FAIL line', () => {
    expect(firstFault('ok 3 cases\nFAIL shot: wrote /tmp/x.png\n')).toBe('FAIL shot: wrote /tmp/x.png');
  });

  it('falls back to a "timed out" line, then to the last line, then to null', () => {
    expect(firstFault('start\nthe page timed out\nend')).toBe('the page timed out');
    expect(firstFault('start\nend\n')).toBe('end');
    expect(firstFault('')).toBeNull();
  });
});
