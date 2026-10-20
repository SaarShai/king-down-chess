import { GameReadError, type GameClient } from '../account-game/client';
import { OnlineError, type OnlineClient } from './client';

export function webGameClient(api: Pick<OnlineClient, 'games' | 'game'>): GameClient {
  async function read<T>(send: () => Promise<T>, signal?: AbortSignal): Promise<T> {
    try {
      signal?.throwIfAborted();
      const result = await send();
      signal?.throwIfAborted();
      return result;
    } catch (error) {
      if (signal?.aborted) throw new DOMException('Read cancelled', 'AbortError');
      if (error instanceof OnlineError) throw new GameReadError(error.code, error.message);
      throw error;
    }
  }
  return {
    games: signal => read(() => api.games(signal), signal),
    game: (id, signal) => read(() => api.game(id, undefined, signal), signal),
  };
}
