import { expect, test } from 'vitest';
import type { View } from '../../match/protocol';
import { rematchChoices } from './end-model';
test('a rematch excludes deleted seats and gives only the available choices', () => {
  const view = {status:'finished',kind:'solo',seat:0,rematch_game_id:null,rematch_offer:null,opponent:{deleted:false}} as View;
  expect(rematchChoices(view)).toEqual(['offer']);
  expect(rematchChoices({...view,kind:'friend',rematch_offer:0})).toEqual([]);
  expect(rematchChoices({...view,kind:'friend',rematch_offer:1})).toEqual(['accept','decline']);
  expect(rematchChoices({...view,opponent:{...view.opponent!,deleted:true}})).toEqual([]);
  expect(rematchChoices({...view,rematch_game_id:'next'})).toEqual([]);
  expect(rematchChoices({...view,status:'aborted'})).toEqual([]);
});
