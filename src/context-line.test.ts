import { describe, expect, it } from 'vitest';
import { contextLine } from './context-line';

describe('contextLine', () => {
  it('at rest speaks to the player, or names the side on one device', () => {
    expect(contextLine({ voice: 'you' })).toMatchObject({ rank: 'your-move', line: 'Your move.', actions: [] });
    expect(contextLine({ voice: 'White' }).line).toBe('White to move.');
  });
  it('shows the ready turn before a check against the next side', () => {
    expect(contextLine({ voice: 'you', check: true, waiting: true }).line).toBe('Check. Your turn is ready.');
    expect(contextLine({ voice: 'you', check: true, waiting: true, turnLine: 'Check. Tap Send your turn.' }).line).toBe('Check. Tap Send your turn.');
  });
  it('keeps a piece read above a mid-way turn', () => {
    expect(contextLine({ voice: 'you', read: 'Black archer.', midWay: true }).line).toBe('Black archer.');
    expect(contextLine({ voice: 'you', selected: 'White ogre.', readNote: 'Tap a neighbour to push or capture.' }).note).toBe('Tap a neighbour to push or capture.');
  });
  it('keeps a refusal above a waiting turn', () => {
    expect(contextLine({ voice: 'you', refusal: 'Only a king can take a guard.', waiting: true }).line).toBe('Only a king can take a guard.');
  });
  it('keeps the result above armed power, read and waiting states', () => {
    expect(contextLine({ voice: 'you', result: 'White wins.', armed: 'Freeze', read: 'Black archer.', waiting: true }).line).toBe('White wins.');
  });
  it('keeps lesson words when its move makes a turn ready', () => {
    expect(contextLine({ voice: 'you', lesson: 'Lesson 1: Archer.', lessonNote: 'Well done.', waiting: true, check: true, turnLine: 'Tap End turn.' })).toMatchObject({ rank: 'lesson', line: 'Lesson 1: Archer.', note: 'Well done.' });
  });
});
