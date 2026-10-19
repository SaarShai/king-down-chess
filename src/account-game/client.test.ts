import { describe, expect, it } from 'vitest';
import { GameReadError } from './client';

describe('game read error', () => {
  it('keeps the service code and message as an Error', () => {
    const error = new GameReadError('FORBIDDEN', 'This game is not available.');
    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({ name: 'GameReadError', code: 'FORBIDDEN', message: 'This game is not available.' });
  });
});
