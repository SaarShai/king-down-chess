import type { InboxEntry, View } from '../match/protocol';

export interface GameClient {
  games(signal?: AbortSignal): Promise<InboxEntry[]>;
  game(gameId: string, signal?: AbortSignal): Promise<View>;
}

export type ReadRoute =
  | { screen: 'play' | 'profile' | 'settings' }
  | { screen: 'game'; gameId: string };

export type PageViewport = {
  touch: boolean;
  safe: { top: number; right: number; bottom: number; left: number };
};

export interface PageHost {
  // Emit startup and later routes when the host is ready. Return its cleanup.
  start(enter: (route: ReadRoute) => void, close: () => void): () => void;
  // Change the host route, then emit it once. Send no game action.
  navigate(route: ReadRoute): void;
  // Save only this host's page route. False means storage fails.
  save(route: ReadRoute): boolean;
  viewport(): PageViewport;
}

// Keep the service code. Cancelled reads use AbortError instead.
export class GameReadError extends Error {
  constructor(readonly code: string, message: string) { super(message); this.name = 'GameReadError'; }
}
