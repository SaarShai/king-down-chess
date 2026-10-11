/** The one write path for online games (report part 03, section 5.2). Actor IDs come from verified identity, never from input. */
import { createHash, randomBytes, randomInt, randomUUID } from 'node:crypto';
import type { z } from 'zod';
import { createMatch, loadMatch, MatchError, type MatchSnapshot } from './index';
import { commandSchema, createSchema, type Command, type CreateOptions, type EndReason, type InboxEntry, type Invite, type Seat, type SeatAction, type Surface, type View } from './protocol';
import { MatchServiceError, PostgresMatchStore, type Game, type Log, type Outgoing, type Player } from './store';
import { diagnostic } from '../plugin/diagnostics';
import { buildSetup, defaultChoice, draw, seatChoicesNeeded, validateChoice } from './setup';
export { MatchServiceError } from './store';

const DAY = 86_400_000, FIRST_TURN_DAYS = 3, DRAW_OFFERS = 3, LIMIT = 1000; // LIMIT: the last revision that 0006 allows
const ENGINE_REJECTS = ['Illegal or ambiguous move', 'Match terminal', 'Match history limit reached', 'Stale revision', 'Command ID conflict', 'Malformed command'];
const CODE = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no I, L, O, 0 or 1
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const fail = (code: MatchServiceError['code'], status: number, message: string): never => { throw new MatchServiceError(code, status, message); };
const hash = (text: string) => createHash('sha256').update(text).digest('hex');
export function id(value: unknown): string { return typeof value === 'string' && uuid.test(value) ? value.toLowerCase() : fail('INVALID_INPUT', 400, 'Expected a UUID'); }
export function parse<T>(schema: z.ZodType<T>, input: unknown): T { const result = schema.safeParse(input); return result.success ? result.data : fail('INVALID_INPUT', 400, 'Invalid input'); }
function seatOf(game: Game, actor: string): Seat { return game.players.find(p => p.user_id === actor)?.seat ?? fail('FORBIDDEN', 403, 'You do not have a seat in this game'); }
const colour = (seat: Seat) => seat === 0 ? 'white' : 'black';
const other = (seat: Seat) => (1 - seat) as Seat;
/** The next revision of a game, for one change to edit. */
function step(game: Game): Game { return { ...game, revision: game.revision + 1, players: [{ ...game.players[0] }, { ...game.players[1] }] }; }
function actionOf(game: Game, seat: Seat): SeatAction { return game.status === 'playing' ? (game.turn === seat ? 'ready' : 'waiting') : game.status === 'setup' ? (game.players[seat].ready ? 'waiting' : 'ready') : game.status === 'waiting' ? 'waiting' : 'done'; }

/** Refuses what the seat may not do now. True when a Daily deadline has passed: the game then ends on time instead. */
function check(game: Game, seat: Seat, { expected_revision, action }: Command, at: Date): boolean {
 if (game.revision !== expected_revision) fail('STALE_REVISION', 409, 'The game changed; reload before you act');
 if (game.status === 'finished' || game.status === 'aborted') fail('MATCH_TERMINAL', 409, 'The game has ended');
 if (game.status === 'waiting' && action.type !== 'abort') fail('WAITING', 409, 'Waiting for the other player');
 if (game.status === 'setup' && action.type !== 'choose' && action.type !== 'abort' || action.type === 'choose' && (game.status !== 'setup' || game.players[seat].ready)) fail('NOT_ALLOWED', 409, 'This action is not available during setup');
 const expired = game.status === 'playing' && !!game.deadline_at && game.deadline_at <= at;
 if (action.type === 'claim' && (!expired || game.turn === seat)) fail('NOT_ALLOWED', 409, 'There is no missed deadline to claim');
 if (expired) return true;
 // The last revision is kept for the end of the game (a resignation, an abort, a claim or the sweep), so a game never stops at the limit while in play.
 if (game.revision >= LIMIT - 1 && action.type !== 'resign' && action.type !== 'abort') fail('MATCH_LIMIT', 409, 'Match history limit reached');
 const me = game.players[seat], offer = game.draw_offer;
 if (action.type === 'turn' && game.turn !== seat || action.type === 'computer' && !game.players[game.turn].computer) fail('WRONG_TURN', 403, 'This operation is not permitted on the current turn');
 // Abort stays open until each side has completed its first turn (turns, not actions: Haste).
 if (action.type === 'abort' && game.status === 'playing' && game.players.every(p => p.turns_played > 0)) fail('NOT_ALLOWED', 409, 'Abort is open only before each side has played a turn');
 if (action.type === 'draw' && (game.kind === 'solo' || (action.choice === 'offer' ? offer !== null || me.draw_offers >= DRAW_OFFERS : offer !== other(seat)))) fail('NOT_ALLOWED', 409, 'No draw offer is possible now');
 if (action.type === 'say' && (game.kind === 'solo' || me.said.includes(action.preset))) fail('NOT_ALLOWED', 409, 'Each preset message goes once in each game');
 return false;
}
function end(game: Game, out: Outgoing, result: Game['result'], reason: EndReason, at: Date): void {
 Object.assign(game, { status: reason === 'abort' || reason === 'no_start' ? 'aborted' : 'finished', result, end_reason: reason, finished_at: at, moves: game.snapshot?.history ?? [], draw_offer: null, deadline_at: null, deadline_kind: null });
 out.outbox.push({ kind: 'game_finished', payload: { game_id: game.id, result, reason } });
}
/** A missed Daily deadline: no first turn cancels the game; a later turn loses on time. */
function expire(game: Game, out: Outgoing, at: Date): void {
 if (game.deadline_kind === 'first_turn') end(game, out, null, 'no_start', at); else end(game, out, colour(other(game.turn)), 'timeout', at);
}
/** The turn is now `game.turn`'s: a Daily friend game sets its deadline and alerts that player. */
function turnTo(game: Game, out: Outgoing, at: Date, actor: string): void {
 if (game.kind === 'solo' || game.speed !== 'daily' || game.status !== 'playing') return;
 const next = game.players[game.turn], first = next.turns_played === 0;
 game.deadline_kind = first ? 'first_turn' : 'move';
 game.deadline_at = new Date(at.getTime() + (first ? FIRST_TURN_DAYS : game.days_per_move!) * DAY);
 if (!next.user_id || next.user_id === actor) return;
 const payload = { game_id: game.id, revision: game.revision, deadline_at: game.deadline_at.toISOString() };
 out.notify.push({ user_id: next.user_id, kind: 'turn', payload }); out.outbox.push({ kind: 'turn', payload: { user_id: next.user_id, ...payload } });
}
/** Every seat's action state follows the engine turn; an ended game frees both seats. */
function settle(game: Game, at: Date): void {
 for (const p of game.players) { p.action = actionOf(game, p.seat); if (p.action === 'done' && p.active) { p.active = false; p.ended_at = at; } }
}
interface Played { actions: string[]; state: string; snapshot: MatchSnapshot }
/** Applies a turn's actions in the game's engine worker, all or nothing. Runs before the lock. */
async function play(game: Game, mover: Seat, lans: string[] | 'computer', engineId: (index: number) => string): Promise<Played> {
 let match;
 try { match = await loadMatch(game.state!); }
 catch (error) { if (error instanceof MatchError && error.code === 'MATCH_INCOMPATIBLE') fail('MATCH_INCOMPATIBLE', 409, 'This saved game uses a different game version. Start a new game to continue playing.'); throw error; }
 try {
  const actions = lans === 'computer' ? [await match.chooseMove({ maxTimeMs: 250, maxDepth: 6 })] : lans;
  let snapshot = game.snapshot!;
  for (const [index, lan] of actions.entries()) {
   // One command is one side's turn: an action after the turn passed is refused with the whole command.
   if (snapshot.status !== 'playing' || snapshot.turn !== mover) fail('INVALID_MOVE', 400, 'This move is no longer available. Reload and choose a move.');
   snapshot = await match.apply({ id: engineId(index), expectedRevision: snapshot.revision, lan });
  }
  return { actions, state: await match.exportSave(), snapshot };
 } catch (error) {
  if (error instanceof MatchServiceError) throw error;
  if (error instanceof MatchError && ENGINE_REJECTS.includes(error.message)) fail('INVALID_MOVE', 400, 'This move is no longer available. Reload and choose a move.');
  return fail('UNAVAILABLE', 503, 'The game worker is unavailable. Retry.');
 } finally { await match.close(); }
}

export class GameService {
 constructor(readonly store: PostgresMatchStore) {}
 async create(actor: string, input: unknown): Promise<View> {
  actor = id(actor);
  const game = await this.newGame(actor, parse(createSchema, input));
  settle(game, game.created_at);
  await this.store.insert(game);
  return this.render(game, seatOf(game, actor), { rules: true });
 }
 private async newGame(actor: string, input: CreateOptions): Promise<Game> {
  const speed = input.speed ?? (input.kind === 'solo' ? 'live' : 'daily'), options = input.options ?? null;
  if (input.days_per_move && speed !== 'daily' || input.kind === 'solo' && speed === 'daily' || options && input.setup) fail('INVALID_INPUT', 400, 'Invalid game setup');
  const seat: Seat = input.colour === 'black' ? 1 : input.colour === 'random' ? randomInt(2) as Seat : 0;
  const at = new Date(), solo = input.kind === 'solo', days = speed === 'daily' ? input.days_per_move ?? 3 : null;
  const drawn = options ? draw(options, () => Math.random()) : null, needs = options && Object.values(seatChoicesNeeded(options)).some(Boolean);
  const player = (s: Seat): Player => ({ seat: s, user_id: s === seat ? actor : null, computer: solo && s !== seat, handle_at_start: null, handle: null, power: 'none',
   choice: options ? defaultChoice(options, drawn!, s, Math.random, solo && s !== seat) : null, ready: !!options && (solo && s !== seat || !needs),
   action: 'waiting', turns_played: 0, draw_offers: 0, said: [], last_seen_at: s === seat ? at : null, last_surface: null, active: true, ended_at: null });
  const powers = options?.kingPowers ?? false;
  const game: Game = {
   id: randomUUID(), kind: input.kind, speed, days_per_move: days, category: `${speed}${days ? `-${days}d` : ''}/${powers ? 'powers' : 'no-powers'}/${options?.cards ? 'cards' : 'no-cards'}`,
   readings: powers ? 'POWERS_BALANCED' : null, colour_rule: input.colour ?? 'white', engine_fingerprint: null, setup: input.setup ?? {}, rules: null,
   options, draw: drawn?.army ?? null, deal: drawn?.hand ?? null, level: input.level ?? 'club', setup_deadline_at: null, rematch_offer: null, rematch_game_id: null,
   status: solo ? needs ? 'setup' : 'playing' : 'waiting', result: null, end_reason: null, turn: 0, revision: 0, draw_offer: null, state: null, snapshot: null,
   deadline_at: null, deadline_kind: null, moves: null, created_by: actor, created_at: at, started_at: null, finished_at: null, updated_at: at,
   players: [player(0), player(1)],
  };
  if (!options || solo && !needs) await this.start(game, at);
  return game;
 }
 private async start(game: Game, at: Date): Promise<void> {
  if (game.options) game.setup = buildSetup(game.options, { army: game.draw!, hand: game.deal! }, [game.players[0].choice!, game.players[1].choice!]);
  let match;
  try {
   match = await createMatch(game.setup);
   const snapshot = await match.snapshot(), state = await match.exportSave(), powers = snapshot.rules.kings.some(Boolean);
   Object.assign(game, { snapshot, state, rules: snapshot.rules, turn: snapshot.turn, engine_fingerprint: JSON.parse(state).engine, setup_deadline_at: null });
   if (game.status !== 'waiting') Object.assign(game, { status: 'playing', started_at: at });
   if (!game.options) Object.assign(game, { readings: powers ? 'POWERS_BALANCED' : null, category: `${game.speed}${game.days_per_move ? `-${game.days_per_move}d` : ''}/${powers ? 'powers' : 'no-powers'}/no-cards` });
   for (const p of game.players) p.power = snapshot.rules.kings[p.seat]?.power ?? 'none';
  } catch (error) {
   if (error instanceof MatchError && /^(Malformed |Noncanonical FEN|Unsupported or malformed power state|Private card data unsupported)/.test(error.message)) fail('INVALID_INPUT', 400, 'Invalid game setup');
   fail('UNAVAILABLE', 503, 'The game worker is unavailable. Retry.');
  } finally { await match?.close(); }
 }
 /** Read-only: one seat's view. `since` returns the commands after that revision. */
 async view(actor: string, gameId: string, since?: number): Promise<View> {
  actor = id(actor); gameId = id(gameId);
  if (since !== undefined && !(Number.isInteger(since) && since >= 0 && since <= 1000)) fail('INVALID_INPUT', 400, 'Invalid revision');
  const game = await this.store.load(gameId);
  return this.render(game, seatOf(game, actor), { since, rules: since === undefined });
 }
 /** The actor's active games: your turn first, then the nearest deadline. */
 async inbox(actor: string): Promise<InboxEntry[]> { return this.store.inbox(id(actor)); }
 /** One transaction per command: lock, dedupe, seat, turn, revision, status, lazy Daily deadline, write, alerts. */
 async command(actor: string, gameId: string, input: unknown, surface: Surface = 'web'): Promise<View> {
  actor = id(actor); gameId = id(gameId); const command = parse(commandSchema, input), at = new Date(), { action } = command;
  const payload = { expected_revision: command.expected_revision, action };
  // Engine work runs before the lock; the commit re-checks the revision, so a race costs the loser STALE_REVISION, never a wrong write.
  const before = await this.store.load(gameId, { state: true }), seat = seatOf(before, actor);
  let played: Played | undefined;
  if (!await this.store.receipt(this.store.pool, gameId, seat, command.command_id, payload) && !check(before, seat, command, at) && (action.type === 'turn' || action.type === 'computer'))
   played = await play(before, action.type === 'turn' ? seat : before.turn, action.type === 'turn' ? action.actions : 'computer', index => hash(`${seat}:${command.command_id}:${index}`));
  const outcome = await this.store.transaction(async client => {
   const game = await this.store.load(gameId, { client, lock: true });
   if (await this.store.receipt(client, gameId, seat, command.command_id, payload)) return this.render(game, seat, { client });
   const next = step(game), out: Outgoing = { notify: [], outbox: [] };
   const log: Log = { seat, actor_id: actor, command_id: command.command_id, kind: action.type, payload, actions: null, surface, received_at: at };
   if (check(game, seat, command, at)) {
    expire(next, out, at);
    // Any other command learns that the game ended on time; the claim is the command that ends it.
    if (action.type !== 'claim') { await this.write(client, game, next, { ...log, seat: null, actor_id: null, command_id: null, kind: 'expire', payload: {}, surface: null }, out); return 'expired' as const; }
   } else if (action.type === 'turn' || action.type === 'computer') {
    if (!played) return fail('STALE_REVISION', 409, 'The game changed; reload before you act');
    const mover = game.turn;
    Object.assign(next, { state: played.state, snapshot: played.snapshot, turn: played.snapshot.turn });
    if (next.draw_offer !== mover) next.draw_offer = null; // a move declines the opponent's offer
    log.actions = played.actions;
    const status = played.snapshot.status;
    if (status !== 'playing' || next.turn !== mover) next.players[mover].turns_played++;
    if (status !== 'playing') end(next, out, status === 'checkmate' ? colour(other(next.turn)) : 'draw', status, at);
    else if (next.turn !== mover) turnTo(next, out, at, actor);
   } else if (action.type === 'choose') {
    const error = validateChoice(game.options!, { army: game.draw!, hand: game.deal! }, action.choice);
    if (error) fail('INVALID_INPUT', 400, error);
    Object.assign(next.players[seat], { choice: action.choice, ready: action.ready });
    if (next.players.every(p => p.ready)) { await this.start(next, at); turnTo(next, out, at, actor); }
   } else if (action.type === 'resign') end(next, out, colour(other(seat)), 'resignation', at);
   else if (action.type === 'abort') end(next, out, null, 'abort', at);
   else if (action.type === 'draw') {
    if (action.choice === 'offer') { next.draw_offer = seat; next.players[seat].draw_offers++; }
    else if (action.choice === 'decline') next.draw_offer = null;
    else end(next, out, 'draw', 'agreement', at);
   } else if (action.type === 'say') next.players[seat].said = [...next.players[seat].said, action.preset];
   next.players[seat].last_seen_at = at; next.players[seat].last_surface = surface;
   await this.write(client, game, next, log, out);
   return this.render(next, seat, { client });
  });
  return outcome === 'expired' ? fail('MATCH_TERMINAL', 409, 'The game ended: the time for a move ran out') : outcome;
 }
 async invite(actor: string, gameId: string): Promise<Invite> {
  actor = id(actor); gameId = id(gameId);
  return this.store.transaction(async client => {
   const game = await this.store.load(gameId, { client, lock: true }), seat = seatOf(game, actor);
   if (game.kind !== 'friend' || game.status !== 'waiting') fail('FORBIDDEN', 403, 'Only the waiting creator can invite');
   // One invitation for each game: a new one ends the old one.
   await client.query('delete from public.game_invites where game_id=$1', [game.id]);
   const expires = new Date(Date.now() + (game.speed === 'daily' ? 14 : 1) * DAY);
   for (let attempt = 0; attempt < 5; attempt++) {
    const token = randomBytes(32).toString('base64url'), code = Array.from({ length: 6 }, () => CODE[randomInt(CODE.length)]).join('');
    if (await this.store.addInvite(client, { token_hash: hash(token), code_hash: hash(code), game_id: game.id, seat: other(seat), created_by: actor, expires_at: expires })) return { token, code, expires_at: expires.toISOString() };
   }
   return fail('UNAVAILABLE', 503, 'Could not make an invitation. Retry.');
  });
 }
 /** Takes the open seat with the link token or the short code. A retry by the same player returns the game. */
 async join(actor: string, tokenOrCode: unknown): Promise<View> {
  actor = id(actor);
  const key = typeof tokenOrCode === 'string' ? tokenOrCode.trim() : '', token = /^[A-Za-z0-9_-]{43}$/.test(key), code = key.toUpperCase().replace(/[\s-]/g, '');
  if (!token && !/^[A-HJKMNP-Z2-9]{6}$/.test(code)) fail('INVALID_INPUT', 400, 'Invalid invitation');
  if (!token) await this.store.codeTry(actor); // a 6-character code can be guessed; a 43-character token cannot
  const column = token ? 'token_hash' : 'code_hash', value = hash(token ? key : code), at = new Date();
  return this.store.transaction(async client => {
   const found = await client.query(`select game_id from public.game_invites where ${column}=$1`, [value]);
   if (!found.rows[0]) fail('INVITE_UNAVAILABLE', 404, 'Invitation unavailable');
   // The game lock comes first, as in invite(), so two joiners queue on it.
   const game = await this.store.load(found.rows[0].game_id, { client, lock: true });
   const invite = (await client.query(`select * from public.game_invites where ${column}=$1 for update`, [value])).rows[0] ?? fail('INVITE_UNAVAILABLE', 404, 'Invitation unavailable');
   const seat = invite.seat as Seat, host = game.players[other(seat)].user_id;
   if (invite.used_by === actor && game.players[seat].user_id === actor) return this.render(game, seat, { client, rules: true });
   if (invite.used_by || invite.expires_at <= at) fail('INVITE_UNAVAILABLE', 409, 'Invitation expired or used');
   if (game.status !== 'waiting' || game.players[seat].user_id || host === actor) fail('FORBIDDEN', 403, 'This seat cannot be joined');
   if (host && !await this.store.mayJoin(client, host, actor)) fail('FORBIDDEN', 403, 'This seat cannot be joined');
   const next = step(game), out: Outgoing = { notify: [], outbox: [] };
   Object.assign(next.players[seat], { user_id: actor, last_seen_at: at });
   if (next.options) {
    next.status = 'setup';
    if (next.players.every(p => p.ready)) await this.start(next, at);
    else next.setup_deadline_at = new Date(at.getTime() + FIRST_TURN_DAYS * DAY);
   } else Object.assign(next, { status: 'playing', started_at: at });
   turnTo(next, out, at, actor);
   await this.write(client, game, next, { seat, actor_id: actor, command_id: null, kind: 'join', payload: {}, actions: null, surface: null, received_at: at }, out);
   await client.query('update public.game_invites set used_by=$2,used_at=$3 where token_hash=$1', [invite.token_hash, actor, at]);
   return this.render(next, seat, { client, rules: true });
  });
 }
 /** Ends Daily games whose deadline passed, and waiting games whose invitation ran out (no start); safe to run twice at once. Returns how many it ended. */
 async sweep(now = new Date()): Promise<number> {
  let ended = 0;
  for (const gameId of await this.store.due(now)) try {
   ended += await this.store.transaction(async client => {
    const game = await this.store.load(gameId, { client, lock: true });
    // A command, a new invitation or another sweep may have come first.
    const late = game.status === 'playing' ? !!game.deadline_at && game.deadline_at <= now
     : game.status === 'waiting' && !!(await client.query('select from public.game_invites where game_id=$1 and used_by is null and expires_at<=$2', [gameId, now])).rowCount;
    if (!late) return 0;
    const next = step(game), out: Outgoing = { notify: [], outbox: [] };
    if (game.status === 'waiting') end(next, out, null, 'no_start', now); else expire(next, out, now);
    await this.write(client, game, next, { seat: null, actor_id: null, command_id: null, kind: 'expire', payload: {}, actions: null, surface: null, received_at: now }, out);
    return 1;
   });
  } catch (error) {
   // One game that cannot end must not stop the others. It stays due, so each run logs it again.
   // ponytail: 100 such games, the first in due(), would hold back the rest; the log shows each one.
   console.error('King Down sweep failed', { game_id: gameId, ...diagnostic(error) });
  }
  return ended;
 }
 private async write(client: Parameters<PostgresMatchStore['save']>[0], before: Game, next: Game, log: Log, out: Outgoing): Promise<void> {
  settle(next, log.received_at);
  await this.store.save(client, before, next, log, out);
 }
 private async render(game: Game, seat: Seat, { since, client, rules = false }: { since?: number; client?: Parameters<PostgresMatchStore['save']>[0]; rules?: boolean } = {}): Promise<View> {
  const now = new Date(), opponent = game.players[other(seat)], playing = game.status === 'playing';
  // A block or my quiet mode hides the opponent's presets; their own setting decides if I see when they were last here.
  const sees = opponent.user_id ? await this.store.privacy(client ?? this.store.pool, game.players[seat].user_id!, opponent.user_id) : { presets: true, online: true };
  const commands = await this.store.commands(game.id, since, client);
  return {
   game_id: game.id, revision: game.revision, seat, kind: game.kind, speed: game.speed, days_per_move: game.days_per_move, status: game.status, turn: game.turn, action: actionOf(game, seat),
   fen: game.snapshot?.fen ?? '', in_check: game.snapshot?.inCheck ?? false, legal: playing && game.turn === seat ? game.snapshot!.legal : [],
   last_commands: commands.map(entry => entry.seat === opponent.seat && (entry.action.type === 'choose' && !game.players.every(p => p.ready) || entry.action.type === 'say' && !sees.presets) ? { ...entry, action: { type: 'hidden' as const } } : entry),
   opponent: game.status === 'waiting' && !opponent.user_id ? null : { handle: opponent.handle, computer: opponent.computer, deleted: !opponent.user_id && !opponent.computer, last_seen_ms: sees.online && opponent.last_seen_at ? now.getTime() - opponent.last_seen_at.getTime() : null },
   draw_offer: game.draw_offer,
   ...(game.end_reason && { result: { winner: game.result === 'white' ? 0 : game.result === 'black' ? 1 : null, reason: game.end_reason } }),
   deadline_at: game.deadline_at?.toISOString() ?? null, server_now: now.toISOString(),
   ...(rules && game.rules && { rules: game.rules }),
  };
 }
}
