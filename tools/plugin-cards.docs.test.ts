import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('keeps Q20 in line with the two card modes and the Done check', () => {
  const deal = readFileSync('docs/specs/chatgpt-mvp/spec.md', 'utf8').split('\n').find(line => line.startsWith('| Q20 | The deal |'))!;
  expect(deal).toContain('Both players get the same 4 cards.');
  expect(deal).toContain('Use all cards accepts a pool of 4 or more cards and deals a random 4.');
  expect(deal).toContain('Pick four starts empty and deals exactly those 4.');
  expect(deal).toContain('The pool check runs at Done only.');
});
