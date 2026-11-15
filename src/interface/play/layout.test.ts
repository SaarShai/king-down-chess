import { describe, expect, it } from 'vitest';
import { clearance, gameLayout, ONE_ROW, type Setup } from './layout';

// Stage "readingb" (launch decisions 33 and 34): the layout classes of the game screen.
const MATRIX = [[360, 640], [375, 667], [390, 844], [430, 932], [667, 375], [844, 390], [932, 430], [768, 1024], [820, 1180], [1024, 768], [1180, 820], [1366, 1024], [1280, 720], [1440, 900], [1920, 1080], [2560, 1440]];
const setups: Setup[] = ['pieces', 'powers', 'cards'];

describe('the reference sizes of the design (decision 33)', () => {
  it('390x844: a tall stack with the 376 px board at y 352 and a 283 px reader', () => {
    expect(gameLayout(390, 844, 'cards')).toMatchObject({ kind: 'stack', form: 'tall', board: 376, head: 13, boardX: 7, boardY: 352, col: 376, opp: 56, reader: 283, own: 56, fin: 60, ownRows: 1 });
  });
  it('360x640: a compact stack with the 352 px board at y 190 and a 134 px reader', () => {
    expect(gameLayout(360, 640, 'cards')).toMatchObject({ kind: 'stack', form: 'compact', board: 352, head: 12, boardX: 4, boardY: 190, col: 352, opp: 44, reader: 134, own: 46, fin: 52, ownRows: 1 });
  });
  it('1440x900: a wide rail of 440 px, the 800 px board at x 84 and y 62.5, two resource rows', () => {
    const l = gameLayout(1440, 900, 'cards');
    expect(l).toMatchObject({ kind: 'rail', form: 'wide', board: 800, head: 25, gap: 32, col: 440, boardX: 84, boardY: 62.5, railTop: 37.5, railH: 825, opp: 56, own: 208, fin: 64, ownRows: 2 });
    // 28 turn state + 96 headline + 329 subject + 44 effects summary.
    expect(l.reader).toBe(28 + 96 + 329 + 44);
  });
  it('Pieces only gives the resource row to the reader and puts the board lower: y 408 and y 236', () => {
    expect(gameLayout(390, 844, 'pieces')).toMatchObject({ board: 376, boardY: 408, own: 0, ownRows: 0, reader: 283 + 56 });
    expect(gameLayout(360, 640, 'pieces')).toMatchObject({ board: 352, boardY: 236, own: 0, reader: 134 + 46 });
    // On wide the absent rows go and the reader extends downward; With powers keeps the power row only.
    expect(gameLayout(1440, 900, 'pieces')).toMatchObject({ board: 800, own: 0, reader: 497 + 208 });
    expect(gameLayout(1440, 900, 'powers')).toMatchObject({ board: 800, own: 64, ownRows: 1 });
    expect(gameLayout(390, 844, 'powers')).toMatchObject({ own: 56, ownRows: 1, boardY: 352 });
  });
});

describe('the classes at each size of the matrix (decision 34)', () => {
  it('a rail when the width is 1.2 times the height or more; a stack in every other case', () => {
    for (const [W, H] of MATRIX) expect(gameLayout(W, H, 'cards').kind, `${W}x${H}`).toBe(W >= H * 1.2 ? 'rail' : 'stack');
  });
  it('the stack forms: tall from 760 px of height, compact below it', () => {
    expect(gameLayout(390, 760, 'cards').form).toBe('tall');
    expect(gameLayout(390, 759, 'cards').form).toBe('compact');
  });
  it('the rail forms: wide when the rail is 400 px or more and H is 700 or more; compact when H is under 600', () => {
    for (const [W, H] of MATRIX.filter(([W, H]) => W >= H * 1.2)) {
      const l = gameLayout(W, H, 'cards');
      expect(l.form, `${W}x${H}`).toBe(H < 600 ? 'compact' : l.col >= 400 && H >= 700 ? 'wide' : 'tall');
      expect(l.col, `${W}x${H} rail`).toBeGreaterThanOrEqual(280);
      expect(l.col, `${W}x${H} rail`).toBeLessThanOrEqual(440);
      // A wide rail has two resource rows (option c1); one row also cannot hold 14 px names under 352 px.
      expect(l.ownRows, `${W}x${H} rows`).toBe(l.form === 'wide' || l.col < ONE_ROW ? 2 : 1);
    }
  });
  it('squares of 44 px or more, the board stops at 960 px, and every part fits the height and the width', () => {
    for (const [W, H] of MATRIX) for (const setup of setups) {
      const l = gameLayout(W, H, setup), what = `${W}x${H} ${setup}`;
      expect(l.board % 8, what).toBe(0);
      expect(l.board / 8, what).toBeGreaterThanOrEqual(44);
      expect(l.board, what).toBeLessThanOrEqual(960);
      expect(l.head, what).toBe(clearance(l.board));
      expect(l.boardX, what).toBeGreaterThanOrEqual(0);
      expect(l.boardX + l.board, what).toBeLessThanOrEqual(W);
      expect(l.boardY - l.head, what).toBeGreaterThanOrEqual(0);
      expect(l.boardY + l.board, what).toBeLessThanOrEqual(H);
      if (l.kind === 'stack') {
        expect(l.opp + l.reader + l.head + l.board + l.own + l.fin, what).toBe(H);
        expect(l.reader, what).toBeGreaterThanOrEqual(l.form === 'tall' ? 283 : 134);
        expect(l.col, what).toBeLessThanOrEqual(W);
      } else {
        expect(l.boardX + l.board + l.gap + l.col, what).toBeLessThanOrEqual(W);
        expect(l.opp + l.reader + l.own + l.fin, what).toBe(l.railH);
        expect(l.railTop, what).toBeGreaterThanOrEqual(0);
        expect(l.railTop + l.railH, what).toBeLessThanOrEqual(H);
        expect(l.reader, what).toBeGreaterThanOrEqual(134);
      }
    }
  });
  it('a stack column has the width of the board and is centred: a tablet gets a large board, not a stretched phone', () => {
    const l = gameLayout(820, 1180, 'cards');
    expect(l.col).toBe(l.board);
    expect(l.board).toBeGreaterThan(640);
    expect(l.boardX).toBe((820 - l.board) / 2);
  });
  it('the soft case 320x568: the board gives way, the strips keep 312 px and the reader keeps 134 px', () => {
    const l = gameLayout(320, 568, 'cards');
    expect(l).toMatchObject({ kind: 'stack', form: 'compact', col: 312, narrow: true, ownRows: 2, own: 92 });
    expect(l.board / 8).toBeLessThan(44);
    expect(l.reader).toBeGreaterThanOrEqual(134);
    expect(l.opp + l.reader + l.head + l.board + l.own + l.fin).toBe(568);
  });
  it('a phone on the side keeps 44 px squares: the rail gives way to 280 px before the board', () => {
    const l = gameLayout(667, 375, 'cards');
    expect(l).toMatchObject({ kind: 'rail', form: 'compact', board: 352, ownRows: 2, narrow: true });
    expect(l.col).toBeGreaterThanOrEqual(280);
  });
  it('the safe areas come off before the calculation: 390x844 with 59 and 34 is a compact stack', () => {
    expect(gameLayout(390, 844 - 59 - 34, 'cards')).toMatchObject({ kind: 'stack', form: 'compact', board: 376 });
    expect(gameLayout(844 - 59 - 59, 390 - 21, 'cards')).toMatchObject({ kind: 'rail', form: 'compact', board: 352 });
  });
  it('the game type does not change the board side; the game state is not an input', () => {
    for (const [W, H] of MATRIX) expect(new Set(setups.map(setup => gameLayout(W, H, setup).board)).size, `${W}x${H}`).toBe(1);
  });
});
