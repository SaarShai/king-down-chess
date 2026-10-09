import { describe, expect, it } from 'vitest';
import { LESSONS } from './lessons';
import { contextLine, type ContextState } from './context-line';

describe('contextLine', () => {
  it('names the learned piece instead of the lesson task', () => {
    expect(contextLine({ voice: 'you', lesson: 'Lesson 1 of 6: Archer', lessonNote: 'Well done. A rule.', lessonLearned: 'Archer', waiting: true, check: true, checkCause: 'Their rook attacks your king.' })).toMatchObject({ rank: 'lesson', line: 'Archer learned.', note: '' });
  });
  it('shows the cause below an active check', () => {
    expect(contextLine({ voice: 'you', check: true, checkCause: 'Their knight attacks your king.' }))
      .toMatchObject({ rank: 'check', line: 'Check! Your move.', note: 'Their knight attacks your king.' });
    expect(contextLine({ voice: 'White', check: true, checkCause: 'Their archer can shoot over e2.' }).note)
      .toBe('Their archer can shoot over e2.');
  });

  it('keeps a check cause out of a staged turn, read or selection', () => {
    for (const state of [{ waiting: true }, { stagedEnd: 'Checkmate.' }, { read: 'Black knight.' }, { selected: 'White king.' }]) {
      expect(contextLine({ voice: 'you', check: true, checkCause: 'Their knight attacks your king.', ...state }).note).not.toContain('Their knight');
    }

  });
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
    expect(contextLine({ voice: 'you', selected: 'White ogre.', readNote: 'Tap a neighbour to shove or capture.' }).note).toBe('Tap a neighbour to shove or capture.');
  });
  it('keeps a refusal above a waiting turn', () => {
    expect(contextLine({ voice: 'you', refusal: 'Only a king can take a guard.', waiting: true }).line).toBe('Only a king can take a guard.');
  });
  it('keeps the result above armed power, read and waiting states', () => {
    expect(contextLine({ voice: 'you', result: 'White wins.', armed: 'Freeze', read: 'Black archer.', waiting: true }).line).toBe('White wins.');
  });
  it('keeps named piece rules below a result, refusal or link', () => {
    for (const status of [{ result: 'White wins.' }, { refusal: 'Tap End turn, or Undo.' }, { link: "Wait for your friend’s link." }]) {
      expect(contextLine({ voice: 'you', ...status, read: 'Black knight.', readNote: 'Jumps in an L shape.' }).note).toBe('Black knight. Jumps in an L shape.');
    }
  });
  it('keeps the first instruction within eight words, including armed powers and lessons', () => {
    expect(contextLine({ voice: 'you', armed: 'Freeze' }).line).toBe('Tap an enemy piece.');
    const states: Partial<ContextState>[] = [
      {}, { review: 'Review. Move 1.' }, { result: 'White wins.' }, { refusal: 'Only a king can take a guard.' }, { link: "Wait for your friend's link." },
      ...(['Freeze', 'IceWall', 'Haste', 'Sacrifice', 'Strike', 'Flight', 'March', 'Leap', 'HolyLight', 'Mercy', 'DeathTouch', 'Darkness'] as const).map(armed => ({ armed })),
      { chain: true }, { read: 'Black knight.' }, { midWay: true }, { midWay: true, free: true }, { selected: 'White pawn.' },
      { stagedEnd: 'Checkmate.' }, { waiting: true }, { check: true }, { computer: true }, { asset: 'A piece cannot load. Reload to try again.' },
      ...LESSONS.map(l => ({ lesson: l.name, lessonNote: l.task })),
    ];
    for (const state of states) expect(contextLine({ voice: 'you', ...state }).line.split(/\s+/).length).toBeLessThanOrEqual(8);
  });
  it('keeps lesson words when its move makes a turn ready', () => {
    expect(contextLine({ voice: 'you', lesson: 'Lesson 1: Archer.', lessonNote: 'Well done.', waiting: true, check: true, turnLine: 'Tap End turn.' })).toMatchObject({ rank: 'lesson', line: 'Well done.', note: '' });
  });
});
