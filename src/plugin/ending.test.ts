import { expect, test } from 'vitest';
import type { View } from '../match/protocol';
import { endReason } from './ending';

test.each([0, 1] as const)('names the end reason for seat %i', seat => {
  const reason = (why: NonNullable<View['result']>['reason'], winner: 0 | 1 | null = null) => endReason({ seat, result: { reason: why, winner } } as View);
  expect(reason('resignation', (1-seat) as 0 | 1)).toBe('You resigned.');
  expect(reason('resignation', seat)).toBe('Your opponent resigned.');
  expect(reason('timeout', seat)).toBe('Your opponent ran out of time.');
  expect(reason('timeout', (1-seat) as 0 | 1)).toBe('You ran out of time.');
  expect(reason('checkmate', seat)).toBe('You gave checkmate.');
  expect(reason('checkmate', (1-seat) as 0 | 1)).toBe('Your opponent gave checkmate.');
  expect(reason('agreement')).toBe('Draw by agreement.');
  expect(reason('stalemate')).toBe('Draw by stalemate.');
  expect(reason('draw50')).toBe('Draw by the fifty-move rule.');
  expect(reason('history')).toBe('Draw: the game reached its length limit.');
  expect(reason('drawRepetition')).toBe('Draw by repetition.');
  expect(reason('drawMaterial')).toBe('Neither side has enough pieces to give checkmate.');
  expect(reason('abort')).toBe('');
  expect(reason('no_start')).toBe('');
  expect(endReason({ seat } as View)).toBe('');
});
