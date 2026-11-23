import { expect, it } from 'vitest';
import { gameLayout, panelBox } from './layout';

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

it('stacks the wide rail from the board top: History, the hand 18 px later, the tray 16 px below the hand', () => {
  for (const [w, h, board] of [[1280, 800, 688], [1440, 900, 704], [1024, 768, 598], [1920, 1080, 704]] as const) {
    const l = gameLayout(w, h, 'both');
    expect(l).toMatchObject({ form: 'wide', board, railTop: l.boardY, readerY: l.boardY + l.opp + 26 });
    // reading-b.css: the History row starts 32 px after the reader and is 48 px high.
    expect(l.handY).toBe(l.readerY + l.reader + 32 + 48 + 18);
    expect(l.actionY).toBe(l.handY + l.own + 16);
    expect(l.actionY + l.fin).toBeLessThan(l.boardY + l.board);
  }
});

it('keeps the phone and short landscape places', () => {
  expect(gameLayout(390, 844, 'both')).toEqual({ kind: 'stack', form: 'tall', W: 390, H: 844, board: 374, col: 358, gap: 0, opp: 60, reader: 76, own: 110, fin: 56, railTop: 47, railH: 844, boardX: 8, boardY: 127, readerY: 554, handY: 648, actionY: 772 });
  expect(gameLayout(844, 390, 'both')).toEqual({ kind: 'rail', form: 'compact', W: 844, H: 390, board: 374, col: 380, gap: 22, opp: 48, reader: 60, own: 90, fin: 48, railTop: 12, railH: 374, boardX: 34, boardY: 12, readerY: 70, handY: 238, actionY: 338 });
  expect(gameLayout(360, 640, 'both')).toEqual({ kind: 'stack', form: 'compact', W: 360, H: 640, board: 352, col: 336, gap: 0, opp: 48, reader: 60, own: 90, fin: 48, railTop: 2, railH: 640, boardX: 4, boardY: 67, readerY: 425, handY: 488, actionY: 586 });
});

it('opens a panel below its control when 220 px fit above the floor, else above it', () => {
  expect(panelBox(844, 500, 560)).toEqual({ top: 560, height: 276 });
  expect(panelBox(844, 700, 760)).toEqual({ top: 320, height: 380 });
});
