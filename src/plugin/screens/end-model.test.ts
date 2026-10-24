import { expect, test } from 'vitest';
import type { View } from '../../match/protocol';
import { rematchChoices, rematchNote } from './end-model';
test('a rematch excludes deleted seats and gives only the available choices', () => {
  const view = {status:'finished',kind:'solo',seat:0,rematch_game_id:null,rematch_offer:null,opponent:{deleted:false}} as View;
  expect(rematchChoices(view)).toEqual(['offer']);
  expect(rematchChoices({...view,kind:'friend',rematch_offer:0})).toEqual([]);
  expect(rematchChoices({...view,kind:'friend',rematch_offer:1})).toEqual(['accept','decline']);
  expect(rematchChoices({...view,opponent:{...view.opponent!,deleted:true}})).toEqual([]);
  expect(rematchChoices({...view,rematch_game_id:'next'})).toEqual([]);
  expect(rematchChoices({...view,status:'aborted'})).toEqual([]);
  expect(rematchChoices({...view,kind:'friend',rematch_allowed:false})).toEqual([]);
  expect(rematchChoices({...view,kind:'friend',rematch_offer:1,rematch_allowed:false})).toEqual([]);
});
test('only a ranked result sends the player back to Ranked (F-006)', () => {
  const ranked = ' Return to Ranked to find another ranked opponent.', rematch = 'A rematch is Casual. It keeps the features and swaps the colours.';
  // The winner and the loser of a casual friend match read the same line; it never names Ranked.
  for (const seat of [0, 1] as const) {
    const friend = {kind:'friend',rating_policy:'casual',seat,result:{winner:0,reason:'checkmate'}} as View;
    expect(rematchNote(friend, true)).toBe(rematch);
    expect(rematchNote(friend, false)).toBe(rematch);
  }
  expect(rematchNote({kind:'random',rating_policy:'casual'}, true)).toBe(rematch);
  expect(rematchNote({kind:'friend',rating_policy:'legacy'}, true)).toBe(rematch);
  expect(rematchNote({kind:'random',rating_policy:'ranked-v1'}, true)).toBe(rematch + ranked);
  // Production offers no Ranked (ticket 67): a ranked result keeps only the rematch line.
  expect(rematchNote({kind:'random',rating_policy:'ranked-v1'}, false)).toBe(rematch);
  expect(rematchNote({kind:'solo',rating_policy:'casual'}, true)).toBe('Play again with the same rules and colour.');
});
