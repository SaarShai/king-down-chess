import assert from 'node:assert/strict';

export function assertCardReadState(before, after) {
  // A public setup pool can already contain the card name. Only the sheet may change.
  assert.deepEqual(after, { ...before, privateContent: { ...before.privateContent, sheet: 'board-sheet' } }, 'A card read saves only the open sheet');
}
