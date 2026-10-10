import { afterEach, expect, it } from 'vitest';
import { setRules } from './rules/engine';
import { startPosition, toFen } from './rules/setup';
import { FIRST_DEAL, isFirstVisit } from './first-deal';

afterEach(() => setRules());

it('starts with the approved first deal, one Archer and one Beast', () => {
  setRules();
  expect(FIRST_DEAL).toBe('QRNAKBBS');
  expect(toFen(startPosition(FIRST_DEAL))).toBe('qrnakbbs/pppppppp/8/8/8/8/PPPPPPPP/QRNAKBBS w - - 0 1');
  expect(FIRST_DEAL.match(/A/g)).toHaveLength(1);
  expect(FIRST_DEAL.match(/S/g)).toHaveLength(1);
  expect(FIRST_DEAL.replace(/[AS]/g, '')).toMatch(/^[QRBNK]+$/);
  const bishops = [...FIRST_DEAL].flatMap((p, i) => p === 'B' ? [i] : []);
  expect((bishops[0] + bishops[1]) % 2).toBe(1);
});

it('keeps Start through the empty start-up save, until a deal or a move', () => {
  expect(isFirstVisit(false, 0)).toBe(true);
  expect(isFirstVisit(true, 0)).toBe(false);
  expect(isFirstVisit(false, 1)).toBe(false);
});
