import { expect, it } from 'vitest';
import { checkWidgetState } from './lib/plugin-widget-state-check.mjs';
const board = '11111111-1111-4111-8111-111111111111', game = '22222222-2222-4222-8222-222222222222', other = '33333333-3333-4333-8333-333333333333';
const rules = JSON.stringify({ kings: [null, null] });
const state = () => ({ modelContent: {}, privateContent: { board_id: board, draft: { game_tag: game.slice(0, 8), fen: 'fen', lans: ['e2-e4'], scope: { account: board, game, revision: 7, rules } } } });
const bases = { [`${game}:7`]: rules };
it('permits only the observed full draft scope in private state', () => {
  expect(() => checkWidgetState(state(), bases)).not.toThrow();
});
it.each(['model', 'other-private', 'scope-extra', 'account', 'game', 'revision', 'rules'] as const)('rejects an unproved or leaked %s value', field => {
  const saved: any = state();
  if (field === 'model') saved.modelContent.game = game;
  if (field === 'other-private') saved.privateContent.opponent = other;
  if (field === 'scope-extra') saved.privateContent.draft.scope.opponent = other;
  if (field === 'account') saved.privateContent.draft.scope.account = other;
  if (field === 'game') saved.privateContent.draft.scope.game = other;
  if (field === 'revision') saved.privateContent.draft.scope.revision = 8;
  if (field === 'rules') saved.privateContent.draft.scope.rules = '{}';
  expect(() => checkWidgetState(saved, bases)).toThrow();
});

it('keeps the existing public two-field summary for hosts without private widget state', () => {
  expect(() => checkWidgetState({ modelContent: { status: 'playing', your_turn: true } }, bases)).not.toThrow();
  expect(() => checkWidgetState({ modelContent: { status: 'playing', your_turn: true, game } }, bases)).toThrow();
});
