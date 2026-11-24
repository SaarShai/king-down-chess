import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { pieces, powerLines } from '../src/interface/play/texts';
import { DEAL_CARDS, DEFAULT_OPTIONS, draw, switches } from '../src/match/setup';
import { POWER_NAME } from '../src/powers-ui';
import { LETTERS, NAMES } from '../src/rules/engine';
import { CLASSIC_CHESS, POOL } from '../src/rules/setup';
import { learningNotes } from '../src/interface/play/learning-content';

// The web game, the plugin and the Muse connector each hold some names and rule facts as written
// text. These tests fail when one form changes and another does not (docs/FORMS.md).

// The released pieces: the pawn, the classic army and the draw pool. NAMES also holds the lab pieces (docs/MATRIX.md).
const released = [...new Set(['P', ...CLASSIC_CHESS, ...POOL])].map(letter => LETTERS.indexOf(letter)).sort((a, b) => a - b);

test('the web piece names are the engine names', () => {
  expect(Object.keys(pieces).map(Number).sort((a, b) => a - b), 'texts.ts pieces: one entry for each released piece').toEqual(released);
  for (const type of released) expect(pieces[type]?.name.toLowerCase(), `texts.ts pieces: ${NAMES[type]}`).toBe(NAMES[type]);
});

test('the Guide has notes for each released piece', () => {
  for (const type of released) expect(learningNotes[pieces[type]?.name], `learning-content.ts learningNotes: ${NAMES[type]}`).toBeDefined();
});

test('the web game has one short line for each king power and each dealt card', () => {
  expect(Object.keys(powerLines).sort()).toEqual([...new Set([...Object.keys(POWER_NAME), ...DEAL_CARDS])].sort());
  for (const line of Object.values(powerLines)) expect(line).toBeTruthy();
});

test('the plugin tool text states the hand size and the switch count of the code', () => {
  const toolText = readFileSync(new URL('../src/plugin/server.ts', import.meta.url), 'utf8');
  expect(draw({ ...DEFAULT_OPTIONS, cards: true }, () => 0.5).hand).toHaveLength(4);
  expect(toolText).toContain('four shared cards');
  expect(Object.keys(JSON.parse(switches(DEFAULT_OPTIONS)))).toHaveLength(5);
  expect(toolText).toContain('the five feature switches');
});
