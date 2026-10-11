/** In-memory stand-in for PluginService (src/plugin/service.ts) for the protocol check and the UI harness: real engine
 * workers, no database. ponytail: moves, the computer, resign and abort only; the database tests cover the rest. */
import { randomBytes, randomInt, randomUUID } from 'node:crypto';
import { createMatch, type LocalMatch } from '../src/match';
import { MatchServiceError } from '../src/match/store';
import type { Command, CreateOptions, InboxEntry, View } from '../src/match/protocol';
import type { PluginService } from '../src/plugin/service';

const CODE = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const fail = (code: MatchServiceError['code'], status: number, message: string): never => { throw new MatchServiceError(code, status, message); };
interface Game { id: string; kind: 'solo' | 'friend'; speed: 'daily' | 'live'; days: 1 | 3 | 7 | null; match: LocalMatch; players: (string | null)[]; revision: number; status: View['status']; result?: View['result']; commands: Map<string, string>; invite?: { token: string; code: string }; updated: number }
export function fixtureService(): Pick<PluginService, keyof PluginService> & { deleteMatch(id: string): Promise<void>; close(): Promise<void> } {
  const games = new Map<string, Game>(), boards = new Map<string, { actor: string; game: string | null }>();
  let reports = 0;
  const load = (id: string) => games.get(id) ?? fail('NOT_FOUND', 404, 'Game not found');
  const seatOf = (game: Game, actor: string) => { const seat = game.players.indexOf(actor); return seat < 0 ? fail('FORBIDDEN', 403, 'You do not have a seat in this game') : seat as 0 | 1; };
  async function end(game: Game) { const after = await game.match.snapshot(); if (after.status !== 'playing') Object.assign(game, { status: 'finished', result: { winner: after.status === 'checkmate' ? 1 - after.turn : null, reason: after.status } }); }
  async function view(actor: string, id: string, since?: number): Promise<View> {
    const game = load(id), seat = seatOf(game, actor), snapshot = await game.match.snapshot(), playing = game.status === 'playing', open = game.players[1 - seat] === null;
    return { game_id: id, revision: game.revision, seat, kind: game.kind, speed: game.speed, days_per_move: game.days, status: game.status, turn: snapshot.turn,
      action: playing ? (snapshot.turn === seat ? 'ready' : 'waiting') : game.status === 'waiting' ? 'waiting' : 'done', fen: snapshot.fen, in_check: snapshot.inCheck,
      legal: playing && snapshot.turn === seat ? snapshot.legal : [], last_commands: [], opponent: open && game.kind === 'friend' ? null : { handle: null, computer: open, deleted: false, last_seen_ms: null },
      draw_offer: null, ...(game.result && { result: game.result }), deadline_at: null, server_now: new Date().toISOString(), ...(since === undefined && { rules: snapshot.rules }) };
  }
  return {
    view, async inbox(actor) {
      const mine = [...games.values()].filter(game => game.players.includes(actor) && (game.status === 'playing' || game.status === 'waiting'));
      const entries = await Promise.all(mine.map(async game => ({ view: await view(actor, game.id), updated: game.updated })));
      return entries.sort((a, b) => Number(b.view.action === 'ready') - Number(a.view.action === 'ready') || b.updated - a.updated)
        .map(({ view: v }) => ({ game_id: v.game_id, kind: v.kind, speed: v.speed, status: v.status as InboxEntry['status'], seat: v.seat, action: v.action, turn: v.turn, revision: v.revision, deadline_at: null, opponent: v.opponent, updated_at: v.server_now }));
    },
    async create(actor, input) {
      const options = input as CreateOptions, id = randomUUID(), seat = options.colour === 'black' ? 1 : options.colour === 'white' ? 0 : randomInt(2), speed = options.speed ?? (options.kind === 'friend' ? 'daily' : 'live');
      const players: (string | null)[] = [null, null]; players[seat] = actor;
      const game: Game = { id, kind: options.kind, speed, days: speed === 'daily' ? options.days_per_move ?? 3 : null, match: await createMatch(options.setup ?? {}), players, revision: 0, status: options.kind === 'solo' ? 'playing' : 'waiting', commands: new Map(), updated: Date.now() };
      games.set(id, game); await end(game);
      return view(actor, id);
    },
    async command(actor, id, input) {
      const game = load(id), seat = seatOf(game, actor), { command_id, expected_revision, action } = input as Command, key = JSON.stringify({ expected_revision, action });
      const seen = game.commands.get(command_id);
      // A command reply has no rules, as in the database service.
      if (seen !== undefined) return seen === key ? view(actor, id, game.revision) : fail('COMMAND_CONFLICT', 409, 'Command ID was used with different input');
      if (expected_revision !== game.revision) fail('STALE_REVISION', 409, 'The game changed; reload before you act');
      if (game.status === 'finished' || game.status === 'aborted') fail('MATCH_TERMINAL', 409, 'The game has ended');
      if (game.status === 'waiting' && action.type !== 'abort') fail('WAITING', 409, 'Waiting for the other player');
      const { turn } = await game.match.snapshot();
      if (action.type === 'turn' || action.type === 'computer') {
        if (action.type === 'turn' ? turn !== seat : game.kind !== 'solo' || turn === seat) fail('WRONG_TURN', 403, 'This operation is not permitted on the current turn');
        for (const lan of action.type === 'turn' ? action.actions : [await game.match.chooseMove({ maxTimeMs: 250, maxDepth: 6 })])
          try { await game.match.apply({ id: randomUUID(), expectedRevision: (await game.match.snapshot()).revision, lan }); } catch { fail('INVALID_MOVE', 400, 'This move is no longer available. Reload and choose a move.'); }
        await end(game);
      } else if (action.type === 'resign') Object.assign(game, { status: 'finished', result: { winner: 1 - seat, reason: 'resignation' } });
      else if (action.type === 'abort') Object.assign(game, { status: 'aborted', result: { winner: null, reason: 'abort' } });
      else fail('NOT_ALLOWED', 409, 'The fixture plays moves, the computer, resign and abort');
      game.revision++; game.updated = Date.now(); game.commands.set(command_id, key);
      return view(actor, id, game.revision);
    },
    async invite(actor, id) {
      const game = load(id); seatOf(game, actor);
      if (game.kind !== 'friend' || game.status !== 'waiting') fail('FORBIDDEN', 403, 'Only the waiting creator can invite');
      game.invite = { token: randomBytes(32).toString('base64url'), code: Array.from({ length: 6 }, () => CODE[randomInt(CODE.length)]).join('') };
      return { ...game.invite, expires_at: new Date(Date.now() + 86_400_000).toISOString() };
    },
    async join(actor, invitation) {
      const key = String(invitation).trim(), code = key.toUpperCase().replace(/[\s-]/g, '');
      const game = [...games.values()].find(g => g.invite && (g.invite.token === key || g.invite.code === code)) ?? fail('INVITE_UNAVAILABLE', 404, 'Invitation unavailable');
      if (game.players.includes(actor)) return view(actor, game.id);
      const seat = game.players.indexOf(null);
      if (game.status !== 'waiting' || seat < 0) fail('FORBIDDEN', 403, 'This seat cannot be joined');
      Object.assign(game, { status: 'playing', revision: game.revision + 1, updated: Date.now() }); game.players[seat] = actor;
      return view(actor, game.id);
    },
    async report() { return { id: ++reports, created_at: new Date().toISOString() }; },
    async profile(actor) { return { user_id: actor, handle: null }; },
    async history() { return { games: [], next_before: null }; },
    async record() { return { totals: { played: 0, won: 0, drawn: 0, lost: 0 }, rating: { rating: 1500, rd: 350, volatility: 0.06, provisional: true }, badges: [] }; },
    async openBoard(actor, id) { seatOf(load(id), actor); const board = randomUUID(); boards.set(board, { actor, game: id }); return board; },
    async board(actor, board) { const row = boards.get(board); if (!row || row.actor !== actor) fail('FORBIDDEN', 403, 'Board unavailable for this account'); return row!.game ?? fail('MATCH_REMOVED', 404, 'This game was deleted. Start, resume or join another game.'); },
    async selectBoard(actor, board, id) { seatOf(load(id), actor); const row = boards.get(board); if (!row || row.actor !== actor) fail('FORBIDDEN', 403, 'Board unavailable for this account'); row!.game = id; },
    async deleteMatch(id) { await games.get(id)?.match.close(); games.delete(id); for (const row of boards.values()) if (row.game === id) row.game = null; },
    async close() { await Promise.all([...games.values()].map(game => game.match.close())); },
  };
}
