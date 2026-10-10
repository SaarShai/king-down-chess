import { describe, expect, it } from 'vitest';
import type { Side } from '../game';
import { momentText } from '../moment';
import { findKing, type Move, type Position, type Status } from '../rules/engine';
import { fromFen } from '../rules/setup';
import { endReason, previewText, resultText, shareResultText } from './moments';

/** Black to move: the position of a mate (the rules' status comes from the caller). */
const mated = fromFen('k7/1Q6/1K6/8/8/8/8/8 b - - 0 1');
/** The same, with the black king taken. */
const noKing: Position = { ...mated, board: mated.board.map((p, sq) => (sq === findKing(mated.board, 1) ? 0 : p)) };

describe('the result line', () => {
  it('names who resigned and who wins', () => {
    expect(resultText('playing', mated, 0)).toBe('White resigns — Black wins.');
    expect(resultText('playing', mated, 1)).toBe('Black resigns — White wins.');
  });

  it('names the winner and how; a draw names its rule; a game in play has none', () => {
    expect(resultText('checkmate', mated, null)).toBe('White wins by checkmate.');
    expect(resultText('checkmate', noKing, null)).toBe('White wins by taking the king.');
    expect((['stalemate', 'draw50', 'drawRepetition', 'drawMaterial', 'playing'] as Status[]).map(s => resultText(s, mated, null))).toEqual([
      'Draw by stalemate.', 'Draw by the 50-move rule.', 'Draw by repetition.', 'Draw by insufficient material.', '']);
  });
});

describe('the end reason of the result dialog', () => {
  it('gives the rule that ended the game before the last moment line', () => {
    expect(endReason('checkmate', mated, null, 'said')).toBe('The king is in check and no legal move escapes it.');
    expect(endReason('checkmate', noKing, null, 'said')).toBe('The king was taken.');
    expect((['stalemate', 'draw50', 'drawRepetition', 'drawMaterial'] as Status[]).map(s => endReason(s, mated, null, 'said'))).toEqual([
      'No legal move, and the king is not in check.', 'Fifty moves with no take and no pawn move.',
      'The same position came up three times.', 'Neither side has enough material to mate.']);
  });

  it('a resign gives up; else the last moment line stays', () => {
    expect(endReason('playing', mated, 1, 'said')).toBe('That side gave up.');
    expect(endReason('playing', mated, null, 'The archer shot without moving.')).toBe('The archer shot without moving.');
  });
});

describe("today's result to share", () => {
  const base = {
    sides: ['human', 'ai'] as Side[], resigned: null, status: 'checkmate' as Status, turn: 1 as const, result: 'White wins by checkmate.',
    skill: 'club' as const, daily: '2026-10-08', army: 'RNBQKBNR', moves: 23, page: 'https://kingdown.dev/',
  };

  it('says won, lost or drew against the computer', () => {
    expect(shareResultText(base)).toBe('King Down daily 2026-10-08 (RNBQKBNR): won in 23 moves against the club computer. https://kingdown.dev/');
    expect(shareResultText({ ...base, sides: ['ai', 'human'] })).toMatch(/: lost in 23 moves against the club computer\. /);
    expect(shareResultText({ ...base, resigned: 0, status: 'playing' })).toMatch(/: lost in /);
    expect(shareResultText({ ...base, status: 'stalemate', result: 'Draw by stalemate.', moves: 1 })).toMatch(/: drew in 1 move against /);
  });

  it('between two people, gives the result line', () => {
    expect(shareResultText({ ...base, sides: ['human', 'human'], skill: 'strong' }))
      .toBe('King Down daily 2026-10-08 (RNBQKBNR): white wins by checkmate in 23 moves. https://kingdown.dev/');
  });
});

describe('the moment preview under the pointer', () => {
  const pos = { board: new Array(64).fill(0), turn: 0 } as unknown as Position;
  const pass = { from: 0, to: 0, captures: [], pass: true } as unknown as Move;
  const quiet = { from: 8, to: 16, captures: [] } as unknown as Move;

  it('shows the moment of the one move that a tap finishes, and marks it as not yet seen', () => {
    const seen = new Set<string>();
    expect(previewText(pos, [pass], seen, 'said')).toBe('End the turn without the second move.');
    expect(seen.size).toBe(0);
    expect(momentText(pos, pass, seen)).toBe('The hasted piece stayed put.');
  });

  it('keeps the last line said for no move, two moves, or a move with no moment', () => {
    const seen = new Set<string>();
    expect(previewText(pos, [], seen, 'said')).toBe('said');
    expect(previewText(pos, [pass, pass], seen, 'said')).toBe('said');
    expect(previewText(pos, [quiet], seen, 'said')).toBe('said');
  });
});
