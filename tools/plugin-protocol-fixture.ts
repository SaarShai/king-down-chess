/** Disposable engine fixture for the UI harness; production uses the durable MatchService. */
import { createMatch, type LocalMatch, type MatchSetup } from '../src/match';
import type { MatchView } from '../src/plugin/view';
export function fixtureService() {
  const matches = new Map<string, { match: LocalMatch; mode: 'solo' | 'friend'; players: string[] }>();
  async function get(actor: string, id: string): Promise<MatchView> {
    const entry = matches.get(id); if (!entry || !entry.players.includes(actor)) throw new Error('Match unavailable');
    const snapshot = await entry.match.snapshot();
    return { matchId: id, mode: entry.mode, playerColor: entry.players.indexOf(actor) as 0 | 1, waiting: entry.mode === 'friend' && entry.players.length === 1, snapshot };
  }
  return {
    get,
    async resume(actor: string) { const latest = [...matches.entries()].reverse().find(([, entry]) => entry.players.includes(actor)); return latest ? get(actor, latest[0]) : null; },
    async create(actor: string, setup: MatchSetup, mode: 'solo' | 'friend') { const id = crypto.randomUUID(); matches.set(id, { match: await createMatch(setup.fen ? setup : { backRank: 'RNBQKBNR', ...setup }), mode, players: [actor] }); return get(actor, id); },
    async move(actor: string, id: string, command: { id: string; expectedRevision: number; lan: string }) { await get(actor, id); await matches.get(id)!.match.apply(command); return get(actor, id); },
    async computer(actor: string, id: string, command: { id: string; expectedRevision: number }) { const current = await get(actor, id); if (current.mode !== 'solo' || current.snapshot.turn === current.playerColor) throw new Error('Not a computer turn'); const match = matches.get(id)!.match; const lan = await match.chooseMove({ maxTimeMs: 250, maxDepth: 6 }); await match.apply({ ...command, lan }); return get(actor, id); },
    async invite(actor: string, id: string) { await get(actor, id); return { token: id, expiresAt: new Date(Date.now() + 60000).toISOString() }; },
    async join(actor: string, token: string) { const entry = matches.get(token); if (!entry || entry.players.length !== 1) throw new Error('Invitation unavailable'); entry.players.push(actor); return get(actor, token); },
    async close() { await Promise.all([...matches.values()].map(entry => entry.match.close())); },
  };
}
