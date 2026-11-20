import { expect, it } from 'vitest';
import { gameLayout } from './layout';

const sizes = [[390, 844], [360, 640], [844, 390], [820, 1180], [1280, 800], [1440, 900], [812, 752], [1024, 768]] as const;

it.each(sizes)('keeps the board and the dock fixed at %s by %s', (w, h) => {
  const l = gameLayout(w, h, 'both');
  expect(gameLayout(w, h, 'pieces')).toEqual(l);
  expect(l.board / 8).toBeGreaterThanOrEqual(44);
  expect(l.boardX).toBeGreaterThanOrEqual(0);
  expect(l.boardX + l.board).toBeLessThanOrEqual(w);
  expect(l.boardY + l.board).toBeLessThanOrEqual(h);
  expect(l.readerY + l.reader).toBeLessThanOrEqual(l.handY);
  expect(l.handY + l.own).toBeLessThan(l.actionY);
  expect(l.actionY + l.fin).toBeLessThanOrEqual(h);
  if (l.kind === 'rail') expect(l.boardX).toBe(Math.round((w - l.board - l.gap - l.col) / 2));
  if (l.kind === 'stack') {
    expect(l.readerY).toBeGreaterThan(l.boardY + l.board);
    expect(l.handY - 21).toBeGreaterThan(l.boardY + l.board);
  }
});

it('uses the normal and compact Daylight rows', () => {
  expect(gameLayout(390, 844, 'both')).toMatchObject({ kind: 'stack', board: 374, opp: 60, reader: 76, fin: 56 });
  expect(gameLayout(360, 640, 'both')).toMatchObject({ kind: 'stack', board: 352, opp: 48, reader: 60, fin: 48 });
  expect(gameLayout(1440, 900, 'both')).toMatchObject({ kind: 'rail', board: 704, col: 380, gap: 56, opp: 60, reader: 76, fin: 56 });
});
