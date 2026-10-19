import { expect, test } from 'vitest';
import type { View } from '../../match/protocol';
import { endTapAllowed, rematchChoices } from './end-model';

test('keys work at once while pointer taps keep the one-second guard', () => {
  expect(endTapAllowed({ detail: 0 }, 100, 1100)).toBe(true);
  expect(endTapAllowed({ detail: 0 }, 100, Infinity)).toBe(true);
  expect(endTapAllowed({ detail: 1 }, 100, 1100)).toBe(false);
  expect(endTapAllowed({ detail: 1 }, 1099, 1100)).toBe(false);
  expect(endTapAllowed({ detail: 1 }, 1100, 1100)).toBe(true);
  expect(endTapAllowed({ detail: 2 }, 100, 1100)).toBe(false);
});
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
