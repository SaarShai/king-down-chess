import { expect, it, vi } from 'vitest';
vi.mock('../../play/motion', () => ({ ms: () => 0, tabChange() {}, travelMarker() {} }));
import { addressRoute, routeHash } from '../../play/shell';

it('an online address keeps its checked game ID through a reload', () => {
  const id='ABCDEF12-3456-7890-ABCD-1234567890AB';
  expect(addressRoute('#online='+id)).toEqual({place:'online',entry:id.toLowerCase()});
  expect(routeHash({place:'online',entry:id.toLowerCase()})).toBe('#online='+id.toLowerCase());
});
it.each(['#online=bad','#online=12345678-1234-1234-1234-zzzzzzzzzzzz','#game'])('an invalid game address opens Play: %s', hash => {
  expect(addressRoute(hash)).toEqual({place:'play'});
});
it('the person route and the landing retain the task; the landing validates its own key', () => {
  const token='a'.repeat(43);
  expect(addressRoute('#person')).toEqual({place:'person'});
  expect(addressRoute('#join='+token)).toEqual({place:'join',entry:token});
  expect(routeHash({place:'join',entry:token})).toBe('#join='+token);
});
