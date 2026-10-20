import { expect, it } from 'vitest';
import { boardFoot } from './board-foot';
it('puts the choice below a phone board with room for it', () => {
  expect(boardFoot({left:8,bottom:470,width:374},{width:358,height:240},{width:390,height:844})).toEqual({left:'16px',top:'482px'});
});
it('keeps the choice below the board after the caller reserves space', () => {
  expect(boardFoot({left:20,bottom:624,width:850},{width:460,height:240},{width:1440,height:900})).toEqual({left:'215px',top:'636px'});
  expect(boardFoot({left:0,bottom:126,width:390},{width:358,height:240},{width:390,height:390})).toEqual({left:'16px',top:'138px'});
});
