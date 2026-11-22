import { expect, it } from 'vitest';
import { KNOWN, markOf } from './plugin-known.mjs';

it('names the run tag <tag>, so a known Profile mark matches in each run', () => {
  const mark = markOf('profile 390x844 150%', 'text "host1-294255f7" is cut by b');
  expect(mark).toBe('profile 390x844 150%: text "host1-<tag>" is cut by b');
  expect(KNOWN.has(mark)).toBe(true);
  expect(KNOWN.has(markOf('profile 390x844 150%', 'text "Account notices" is cut by h3.group-head'))).toBe(false);
});
