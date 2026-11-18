import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('keeps Q20 in line with the shared deal and the four-card minimum', () => {
  const deal = readFileSync('docs/specs/chatgpt-mvp/spec.md', 'utf8').split('\n').find(line => line.startsWith('| Q20 | The deal |'))!;
  expect(deal).toContain('Both players get the same 4 cards.');
  expect(deal).toContain('Cards starts with all 21 selected.');
  expect(deal).toContain('At 4, the editor names the cards in catalog order.');
  expect(deal).toContain('An attempt to remove one keeps it checked and shows the minimum in the footer.');
});
