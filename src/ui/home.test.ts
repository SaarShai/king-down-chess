import { afterEach, expect, it } from 'vitest';
import { Game } from '../game';
import { setRules } from '../rules/engine';
import { homeState, shouldShowHome, type HomeInput } from './home';

afterEach(() => setRules());
const state = (game: Game, changes: Partial<HomeInput> = {}) => homeState({
  game, sides: ['human', 'ai'], level: 'club', linkSide: null, staged: false, result: '', ...changes,
});

it('shows the saved board turn and the last move in words', () => {
  const game = new Game('RNBQKBNR');
  expect(game.playLan(['e2-e4', 'e7-e5'])).toBe(2);
  expect(homeState({ game, sides: ['human', 'ai'], level: 'club', linkSide: null, staged: false, result: '' })).toEqual({
    opponent: 'vs Computer · Club',
    progress: 'Move 2',
    action: 'Continue',
    detail: 'Your move',
    review: false,
    lastMove: 'Black pawn e7 to e5.',
    result: '',
  });
});

it('names the next player on this device or in a link game', () => {
  const game = new Game('RNBQKBNR');
  game.playLan(['e2-e4']);
  expect(state(game).detail).toBe('Their move');
  expect(state(game, { sides: ['human', 'human'] })).toMatchObject({ opponent: 'White vs Black', detail: 'Your move' });
  expect(state(game, { sides: ['human', 'human'], linkSide: 0 })).toMatchObject({ opponent: 'vs your friend', detail: 'Their move' });
  expect(state(game, { sides: ['human', 'human'], linkSide: 1 }).detail).toBe('Your move');
});

it('keeps a staged move or mate ready to continue and undo', () => {
  const live = new Game('RNBQKBNR');
  live.playLan(['e2-e4']);
  expect(state(live, { staged: true }).detail).toBe('Your turn is ready');
  const game = new Game('RNBQKBNR');
  expect(game.playLan(['f2-f3', 'e7-e5', 'g2-g4', 'Qd8-h4'])).toBe(4);
  expect(game.status).toBe('checkmate');
  expect(state(game, { staged: true, result: 'Black wins by checkmate' })).toMatchObject({
    action: 'Continue', detail: 'Your turn is ready', progress: 'Move 3', review: false, result: '',
  });
  expect(game.history).toHaveLength(4);
});

it('offers Rematch and review after the game ends', () => {
  const game = new Game('RNBQKBNR');
  game.playLan(['f2-f3', 'e7-e5', 'g2-g4', 'Qd8-h4']);
  expect(state(game, { result: 'Black wins by checkmate' })).toMatchObject({
    action: 'Rematch', detail: 'Same army. You play Black.', progress: 'Finished', review: true, result: 'Black wins by checkmate',
  });
  expect(state(game, { sides: ['human', 'human'], result: 'Black wins by checkmate' }).detail).toBe('Same army. Both sides play here.');
  const live = new Game('RNBQKBNR');
  live.playLan(['e2-e4']);
  expect(state(live, { sides: ['ai', 'human'], result: 'Black resigns — White wins' })).toMatchObject({
    action: 'Rematch', detail: 'Same army. You play White.', progress: 'Finished', review: true, result: 'Black resigns — White wins',
  });
});

it('offers Continue and the player side for a game with no moves', () => {
  const game = new Game('RNBQKBNR');
  expect(state(game)).toMatchObject({ action: 'Continue', progress: 'Move 1', detail: 'A new game. You play White.', lastMove: '' });
  expect(state(game, { sides: ['ai', 'human'] }).detail).toBe('A new game. You play Black.');
});

it('opens Home once for a save and keeps position links clear', () => {
  const gate = { hasSave: true, titleSeen: false, firstVisit: false };
  expect(shouldShowHome(new URLSearchParams(), gate)).toBe(true);
  expect(shouldShowHome(new URLSearchParams(), { ...gate, hasSave: false })).toBe(false);
  expect(shouldShowHome(new URLSearchParams(), { ...gate, titleSeen: true })).toBe(false);
  expect(shouldShowHome(new URLSearchParams(), { ...gate, firstVisit: true })).toBe(false);
  for (const query of ['title=0', 'army=QRNAKBBS', 'army=QRNAKBBS&moves=e2-e4', 'fen=position', 'design=piece']) {
    expect(shouldShowHome(new URLSearchParams(query), gate), query).toBe(false);
  }
});
