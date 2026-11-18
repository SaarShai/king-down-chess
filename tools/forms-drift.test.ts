import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { pieces, powerLines } from '../src/interface/play/texts';
import { DEAL_CARDS, DEFAULT_OPTIONS, draw, switches } from '../src/match/setup';
import { POWER_NAME } from '../src/powers-ui';
import { NAMES } from '../src/rules/engine';

// The web game, the plugin and the Muse connector each hold some names and rule facts as written
// text. These tests fail when one form changes and another does not (docs/FORMS.md).

test('the web piece names are the engine names', () => {
  for (const [type, { name }] of Object.entries(pieces)) expect(name.toLowerCase()).toBe(NAMES[Number(type)]);
});

test('the web game has one short line for each king power and each dealt card', () => {
  expect(Object.keys(powerLines).sort()).toEqual([...new Set([...Object.keys(POWER_NAME), ...DEAL_CARDS])].sort());
});

test('the plugin tool text states the hand size and the switch count of the code', () => {
  const toolText = readFileSync(new URL('../src/plugin/server.ts', import.meta.url), 'utf8');
  expect(draw({ ...DEFAULT_OPTIONS, cards: true }, () => 0.5).hand).toHaveLength(4);
  expect(toolText).toContain('four shared cards');
  expect(Object.keys(JSON.parse(switches(DEFAULT_OPTIONS)))).toHaveLength(5);
  expect(toolText).toContain('the five feature switches');
});
