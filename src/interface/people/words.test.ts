import { expect, it } from 'vitest';
import { agoWords, timeWords, urgent } from './words';

const MINUTE = 60_000, HOUR = 60 * MINUTE, DAY = 24 * HOUR;

it('says the time left in days, one day, hours or less than one hour, and rounds down', () => {
  expect(timeWords(3 * DAY)).toBe('3 days');
  expect(timeWords(2 * DAY + 23 * HOUR)).toBe('2 days');
  expect(timeWords(2 * DAY - 1)).toBe('1 day');
  expect(timeWords(DAY)).toBe('1 day');
  expect(timeWords(DAY - 1)).toBe('23 hours');
  expect(timeWords(8.5 * HOUR)).toBe('8 hours');
  expect(timeWords(HOUR)).toBe('1 hour');
  expect(timeWords(HOUR - 1)).toBe('less than 1 hour');
  expect(urgent(DAY - 1)).toBe(true); expect(urgent(DAY)).toBe(false);
});

it('says the time since a move in minutes, hours or days', () => {
  expect(agoWords(0)).toBe('1 minute');
  expect(agoWords(5 * MINUTE)).toBe('5 minutes');
  expect(agoWords(3 * HOUR + 59 * MINUTE)).toBe('3 hours');
  expect(agoWords(HOUR)).toBe('1 hour');
  expect(agoWords(DAY)).toBe('1 day');
  expect(agoWords(2 * DAY)).toBe('2 days');
});
