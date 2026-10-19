import assert from 'node:assert/strict';

export const resultFallCases = [
  { loser: 1, square: 63, fen: '7k/6Q1/6K1/8/8/8/8/8 b - - 0 1' },
  { loser: 1, square: 56, fen: 'k7/1Q6/2K5/8/8/8/8/8 b - - 0 1' },
  { loser: 1, square: 35, fen: '8/8/R7/3k4/3Q4/3K4/8/8 b - - 0 1' },
  { loser: 0, square: 7, fen: '8/8/8/8/8/6k1/6q1/7K w - - 0 1' },
  { loser: 0, square: 0, fen: '8/8/8/8/8/2k5/1q6/K7 w - - 0 1' },
  { loser: 0, square: 27, fen: '8/8/3k4/3q4/3K4/r7/8/8 w - - 0 1' },
];

export async function assertResultFall(root, { loser, square }, seat) {
  const figure = root.locator(`#over .over-${loser ? 'b' : 'w'}.is-fallen`);
  assert.equal(await figure.count(), 1, 'The beaten king lies down on the card');
  const crown = await figure.evaluate(el => {
    const style = getComputedStyle(el);
    // CSS applies the separate rotation before the transform list.
    const matrix = new DOMMatrix(`rotate(${style.rotate === 'none' ? '0deg' : style.rotate})`)
      .multiply(new DOMMatrix(style.transform));
    return { x: -matrix.c, y: -matrix.d };
  });
  const col = seat ? 7 - (square & 7) : square & 7;
  const angle = col === 7 ? 1.5 : -1.5, facing = loser ? -1 : 1;
  const name = `King ${loser}, square ${square}, view ${seat}`;
  // The board scales by the army facing, then rotates the crown vector (0, -1).
  assert(Math.abs(crown.x - facing * Math.sin(angle)) < 0.0001, `${name}: the crown points in the board direction`);
  assert(Math.abs(crown.y + Math.cos(angle)) < 0.0001, `${name}: the crown has the board tilt`);
}
