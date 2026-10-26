/** The one write path for online games (report part 03, section 5.2). Actor IDs come from verified identity, never from input. */
import { createHash, createHmac, randomBytes, randomInt, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { createMatch, createPinnedMatch, loadMatch, MatchError, type MatchSnapshot } from './index';
import { commandSchema, createSchema, draftSchema, MAX_REVISION, TURN_ACTIONS, type Command, type CreationMode, type RatingPolicy, type CreateOptions, type DraftPosition, type DraftPreview, type EndReason, type InboxEntry, type Invite, type JoinPreview, type Lobby, type Seat, type SeatAction, type Surface, type View } from './protocol';
import { MatchServiceError, PostgresMatchStore, type Game, type Log, type Outgoing, type Player } from './store';
import { INVITE_NOTICES } from './invite-notices';
import { inviteSchema, friendsSchema, invitationsSchema, type InvitationRow, type InvitationPage, type FriendsPage } from './protocol';
import { diagnostic } from '../plugin/diagnostics';
import { buildSetup, RANKED_OPTIONS, defaultChoice, draw, seatChoicesNeeded, switches, setupAdmission, validateChoice } from './setup';
import type { HistoryPage, PlayerRecord } from './protocol';
import { gameHistory, gameOutcome, opponentRating, playerRecord, recordResult } from './results';
export { MatchServiceError } from './store';

const DAY = 86_400_000, FIRST_TURN_DAYS = 3, DRAW_OFFERS = 3, LIMIT = 1000; // the last revision in play
// Each start receipt on an open game takes one of its revisions: Find with new command IDs on your own open game stops here, so play keeps its revisions.
const START_RECEIPTS = 20;
// The same for an unready setup choice: past this revision only Ready is open, so setup cannot spend the revisions of play.
const SETUP_REVISIONS = 100;
// The engine keeps at most this many actions (worker.ts MAX_COMMANDS, the same in every released bundle). A copy: a worker.ts change makes a new engine fingerprint.
const ENGINE_ACTIONS = 1000;
export const FRIEND_CODE_DAYS = 7; // a friend code in a game against a person (owner, 2026-10-11)
// The one time for each move in a game against a person; there is no speed or days choice (owner, 2026-10-24; F-031). Older games keep 1 or 7.
export const TURN_DAYS = 3 as const;
export const UNFINISHED = 'This turn is not finished. Send the whole turn in one command.';
const ENGINE_REJECTS = ['Illegal or ambiguous move', 'Match terminal', 'Match history limit reached', 'Stale revision', 'Command ID conflict', 'Malformed command'];
const CODE = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no I, L, O, 0 or 1
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const fail = (code: MatchServiceError['code'], status: number, message: string): never => { throw new MatchServiceError(code, status, message); };
const hash = (text: string) => createHash('sha256').update(text).digest('hex');
/** The game ID of a player's start command (a version 8 UUID): a resent Create or Find makes no second game. */
function startId(actor: string, commandId: string): string {
 const h = hash(`start:${actor}:${commandId}`);
 return `${h.slice(0, 8)}-${h.slice(8, 12)}-8${h.slice(13, 16)}-${'89ab'[parseInt(h[16], 16) & 3]}${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
/** Serializes the starts with one command ID: a Create and a Find with that ID cannot both write a receipt. */
async function startLock(client: Parameters<PostgresMatchStore['save']>[0], actor: string, commandId: string): Promise<void> {
 await client.query('select pg_advisory_xact_lock(hashtextextended($1, 0))', [`start:${actor}:${commandId}`]);
}
/** Ranked opens only on the staging server (plan D2; ticket 67). Production keeps 'ranked' in the tool schema and refuses it here. */
export const RANKED_UNAVAILABLE = 'Ranked is not available. Play a Casual game.';
function requireRanked(): void { if (process.env.KINGDOWN_STAGE !== 'staging') fail('RANKED_UNAVAILABLE', 409, RANKED_UNAVAILABLE); }
function canonicalCreate(input: CreateOptions): CreateOptions {
 if (input.mode === 'ranked') requireRanked();
 return input.mode === 'ranked' ? { ...input, colour: 'random', options: RANKED_OPTIONS } : input;
}
/** A start's input with its defaults. The start receipt keeps it; a resend with other input is COMMAND_CONFLICT.
 * Speed and days come from the kind; they stay in the key, so the receipts of older starts still match. */
export function startKey(input: CreateOptions, anyRules = false) {
 const speed: View['speed'] = input.kind === 'solo' ? 'live' : 'daily';
 return { mode: input.mode ?? 'casual', kind: input.kind, speed, days_per_move: speed === 'daily' ? TURN_DAYS : null, colour: input.colour ?? 'white', level: input.level ?? 'club', options: input.options ?? null, setup: input.setup ?? null, any_rules: anyRules, ...(input.recipient_id && { recipient_id: input.recipient_id }), ...(input.recipient_handle && { recipient_handle: input.recipient_handle.trim().toLowerCase() }), ...(input.open_link && { open_link: true }) };
}
type StartKey = ReturnType<typeof startKey>;
export function id(value: unknown): string { return typeof value === 'string' && uuid.test(value) ? value.toLowerCase() : fail('INVALID_INPUT', 400, 'Expected a UUID'); }
export function parse<T>(schema: z.ZodType<T>, input: unknown): T { const result = schema.safeParse(input); return result.success ? result.data : fail('INVALID_INPUT', 400, 'Invalid input'); }
function seatOf(game: Game, actor: string): Seat { return game.players.find(p => p.user_id === actor)?.seat ?? fail('FORBIDDEN', 403, 'You do not have a seat in this game'); }
const colour = (seat: Seat) => seat === 0 ? 'white' : 'black';
const other = (seat: Seat) => (1 - seat) as Seat;
/** The next revision of a game, for one change to edit. */
function step(game: Game): Game { return { ...game, revision: game.revision + 1, players: [{ ...game.players[0] }, { ...game.players[1] }] }; }
/** No room for the next whole turn, in the revisions or in the engine history: the turn that fills it ends the game as a draw. */
const full = (game: Game) => game.revision >= LIMIT || game.snapshot!.revision > ENGINE_ACTIONS - TURN_ACTIONS;
function actionOf(game: Game, seat: Seat): SeatAction { return game.status === 'playing' ? (game.turn === seat ? 'ready' : 'waiting') : game.status === 'setup' ? (game.players[seat].ready ? 'waiting' : 'ready') : game.status === 'waiting' ? 'waiting' : 'done'; }

/** Refuses what the seat may not do now. True when a Daily deadline has passed: the game then ends on time instead. */
function check(game: Game, seat: Seat, { expected_revision, action }: Command, at: Date, switchOpen = false): boolean {
 if (game.revision !== expected_revision) fail('STALE_REVISION', 409, 'The game changed; reload before you act');
 if (action.type === 'rematch') {
  if (game.revision >= MAX_REVISION) fail('MATCH_LIMIT', 409, 'Match history limit reached');
  if (game.status !== 'finished' || game.rematch_game_id || game.players.some(p => !p.user_id && !p.computer) || (game.kind === 'solo' ? action.choice !== 'offer' : action.choice === 'offer' ? game.rematch_offer !== null : game.rematch_offer !== other(seat))) fail('NOT_ALLOWED', 409, 'No rematch is available now');
  return false;
 }
 if (game.status === 'finished' || game.status === 'aborted') fail('MATCH_TERMINAL', 409, 'The game has ended');
 if (game.status === 'waiting' && action.type !== 'abort') fail('WAITING', 409, 'Waiting for the other player');
 const expired = game.status === 'setup' ? !!game.setup_deadline_at && game.setup_deadline_at <= at : game.status === 'playing' && !!game.deadline_at && game.deadline_at <= at;
 if (action.type === 'claim' && (game.status !== 'playing' || !expired || game.turn === seat)) fail('NOT_ALLOWED', 409, 'There is no missed deadline to claim');
 if (expired) return true;
 if (game.status === 'setup' && action.type !== 'choose' && action.type !== 'abort' || action.type === 'choose' && (game.status !== 'setup' || game.players[seat].ready)) fail('NOT_ALLOWED', 409, 'This action is not available during setup');
 if (action.type === 'choose' && !action.ready && game.revision >= SETUP_REVISIONS) fail('RATE_LIMITED', 429, 'Too many setup changes in this game. Mark your seat Ready.');
 // The last revision is kept for a turn or the end of the game: a turn that fills the history ends the game as a draw (full), so the player to move can always play.
 if (game.revision >= LIMIT - 1 && !['turn', 'computer', 'resign', 'abort'].includes(action.type) && !(action.type === 'draw' && action.choice === 'accept')) fail('MATCH_LIMIT', 409, 'Match history limit reached');
 const me = game.players[seat], offer = game.draw_offer;
 if (action.type === 'turn' && game.turn !== seat || action.type === 'computer' && !game.players[game.turn].computer) fail('WRONG_TURN', 403, 'This operation is not permitted on the current turn');
 // Abort stays open until each side has completed its first turn (turns, not actions: Haste).
 if (action.type === 'abort' && game.status === 'playing' && game.players.every(p => p.turns_played > 0) && !switchOpen) fail('NOT_ALLOWED', 409, 'Abort is open only before each side has played a turn');
 if (action.type === 'draw' && (game.kind === 'solo' || (action.choice === 'offer' ? offer !== null || me.draw_offers >= DRAW_OFFERS : offer !== other(seat)))) fail('NOT_ALLOWED', 409, 'No draw offer is possible now');
 if (action.type === 'say' && (game.kind === 'solo' || me.said.includes(action.preset))) fail('NOT_ALLOWED', 409, 'Each preset message goes once in each game');
 return false;
}
function end(game: Game, out: Outgoing, result: Game['result'], reason: EndReason, at: Date): void {
 Object.assign(game, { status: reason === 'abort' || reason === 'no_start' ? 'aborted' : 'finished', result, end_reason: reason, finished_at: at, moves: game.snapshot?.history ?? [], draw_offer: null, deadline_at: null, deadline_kind: null, setup_deadline_at: null });
 out.outbox.push({ kind: 'game_finished', payload: { game_id: game.id, result, reason } });
}
/** A missed Daily deadline: no first turn cancels the game; a later turn loses on time. */
function expire(game: Game, out: Outgoing, at: Date): void {
 if (game.status === 'setup' || game.deadline_kind === 'first_turn') end(game, out, null, 'no_start', at); else end(game, out, colour(other(game.turn)), 'timeout', at);
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
  const actions = lans === 'computer' ? [await match.chooseMove(game.options ? { level: game.level, maxTimeMs: 2500 } : { maxTimeMs: 250, maxDepth: 6 })] : lans;
  let snapshot = game.snapshot!;
  for (const [index, lan] of actions.entries()) {
   // One command is one side's turn: an action after the turn passed is refused with the whole command.
   if (snapshot.status !== 'playing' || snapshot.turn !== mover) fail('INVALID_MOVE', 400, 'This move is no longer available. Reload and choose a move.');
   snapshot = await match.apply({ id: engineId(index), expectedRevision: snapshot.revision, lan });
  }
  // A player's command is a whole turn (W7 ticket 06). The computer still plays one action for each call.
  if (lans !== 'computer' && snapshot.status === 'playing' && snapshot.turn === mover) fail('INVALID_MOVE', 400, UNFINISHED);
  return { actions, state: await match.exportSave(), snapshot };
 } catch (error) {
  if (error instanceof MatchServiceError) throw error;
  if (error instanceof MatchError && ENGINE_REJECTS.includes(error.message)) fail('INVALID_MOVE', 400, 'This move is no longer available. Reload and choose a move.');
  return fail('UNAVAILABLE', 503, 'The game worker is unavailable. Retry.');
 } finally { await match.close(); }
}

export class GameService {
 constructor(readonly store: PostgresMatchStore, private readonly inviteSecret = process.env.KINGDOWN_INTERNAL_SECRET) {}
 private codeHash(code: string): string {
  const secret = this.inviteSecret;
  if (!secret || secret.length < 32) return fail('UNAVAILABLE', 503, 'Invitation codes are unavailable. Try again later.');
  return createHmac('sha256', secret).update('kingdown:invite-code:').update(code).digest('hex');
 }
 /** With a command ID, a resent Create (the reply was lost or late) gets the first game; other input is COMMAND_CONFLICT. */
 async create(actor: string, input: unknown, commandId?: string): Promise<View> {
  actor = id(actor); const options = canonicalCreate(parse(createSchema, input)), key = startKey(options);
  if (options.level && !options.options) fail('INVALID_INPUT', 400, 'A computer level needs game options');
  if (options.kind !== 'solo') await this.requireHandle(actor);
  const done = commandId === undefined ? undefined : await this.started(undefined, actor, commandId, key, options.mode === undefined);
  if (done) return done;
  if (options.kind === 'friend' && (options.recipient_id || options.recipient_handle || options.open_link)) await this.store.friendTry(actor);
  const game = await this.newGame(actor, options, commandId === undefined ? randomUUID() : startId(actor, commandId));
  settle(game, game.created_at);
  if (options.kind === 'solo' && commandId === undefined) { await this.store.insert(game); return this.render(game, seatOf(game, actor), { rules: true }); }
  return this.store.transaction(async client => {
   if (commandId !== undefined) await startLock(client, actor, commandId);
   const done = commandId === undefined ? undefined : await this.started(client, actor, commandId, key, options.mode === undefined);
   if (done) return done;
   const send = options.kind === 'friend' && !!(options.recipient_id || options.recipient_handle || options.open_link);
   const recipient = send ? await this.recipient(client, actor, options) : null;
   await this.store.lockAccounts(client, [actor, recipient]);
   if (options.kind !== 'solo') await this.requireHandle(actor, client);
   if (send) await this.checkSend(client, actor, recipient);
   if (!await this.store.insert(game, client)) return this.view(actor, game.id);
   const invite = send ? await this.issue(client, game, actor, recipient) : undefined;
   const view = commandId === undefined ? await this.render(game, seatOf(game, actor), { client, rules: true }) : await this.receipt(client, game, actor, commandId, key);
   return { ...view, ...(invite && { invite }) };
  });
 }
 /** The game that this start command ID already made, joined or reused, or undefined. Other input is COMMAND_CONFLICT.
  * A start from before start receipts has no input to compare: a Find's join row keeps {}, and a made game has no row but has the derived ID. */
 private async started(client: Parameters<PostgresMatchStore['save']>[0] | undefined, actor: string, commandId: string, key: StartKey, legacyRetry: boolean): Promise<View | undefined> {
  const db = client ?? this.store.pool;
  const row = (await db.query(`select c.game_id,(c.payload=$3::jsonb or $4 and (c.payload=$3::jsonb-'mode' or c.kind='join' and c.payload='{}'::jsonb and $3::jsonb->>'kind'='random')) as same from public.game_players p join public.game_commands c
   on c.game_id=p.game_id and c.seat=p.seat and c.command_id=$2 and c.kind in ('start','join') where p.user_id=$1 limit 1`, [actor, commandId, JSON.stringify(key), legacyRetry])).rows[0]
   ?? (await db.query("select id as game_id,($2 and rating_policy='legacy') as same from public.games where id=$1", [startId(actor, commandId), legacyRetry])).rows[0];
  if (!row) return;
  if (!row.same) fail('COMMAND_CONFLICT', 409, 'Command ID was used with different input');
  // The full read, as view() gives: the reply keeps the move history.
  const game = await this.store.load(row.game_id, { client, state: true });
  return this.render(game, seatOf(game, actor), { client, rules: true });
 }
 /** Writes the start receipt on a game that a start made or reused: a 'start' row with the command ID and the input. */
 private async receipt(client: Parameters<PostgresMatchStore['save']>[0], game: Game, actor: string, commandId: string, key: StartKey): Promise<View> {
  if (game.revision >= START_RECEIPTS) fail('RATE_LIMITED', 429, 'Too many starts on this open game. Wait for an opponent, or cancel the game.');
  const next = step(game), seat = seatOf(game, actor);
  await this.write(client, game, next, { seat, actor_id: actor, command_id: commandId, kind: 'start', payload: key, actions: null, surface: null, received_at: new Date() }, { notify: [], outbox: [] });
  return this.render(next, seat, { client, rules: true });
 }
 private async newGame(actor: string, input: CreateOptions, gameId: string = randomUUID()): Promise<Game> {
  const { speed, days_per_move: days } = startKey(input), options = input.options ?? null;
  const seat: Seat = input.colour === 'black' ? 1 : input.colour === 'random' ? randomInt(2) as Seat : 0;
  const at = new Date(), solo = input.kind === 'solo';
  const drawn = options ? draw(options, () => Math.random()) : null, needs = options && Object.values(seatChoicesNeeded(options)).some(Boolean);
  const player = (s: Seat): Player => ({ seat: s, user_id: s === seat ? actor : null, computer: solo && s !== seat, handle_at_start: null, handle: null, power: 'none',
   choice: options ? defaultChoice(options, drawn!, s, Math.random, solo && s !== seat) : null, ready: !!options && (solo && s !== seat || !needs),
   action: 'waiting', turns_played: 0, draw_offers: 0, said: [], last_seen_at: s === seat ? at : null, last_seen_ms: s === seat ? 0 : null, last_surface: null, active: true, ended_at: null });
  const powers = options?.kingPowers ?? false;
  const game: Game = {
   id: gameId, rating_policy: input.mode === 'ranked' ? 'ranked-v1' : 'casual', kind: input.kind, speed, days_per_move: days, category: `${speed}${days ? `-${days}d` : ''}/${powers ? 'powers' : 'no-powers'}/${options?.cards ? 'cards' : 'no-cards'}`,
   readings: powers ? 'POWERS_BALANCED' : null, colour_rule: input.colour ?? 'white', engine_fingerprint: null, setup: input.setup ?? {}, rules: null,
   setup_admission: options ? setupAdmission(options) : null, options, draw: drawn?.army ?? null, deal: drawn?.hand ?? null, level: input.level ?? 'club', setup_deadline_at: null, rematch_offer: null, rematch_game_id: null,
   status: solo ? needs ? 'setup' : 'playing' : 'waiting', result: null, end_reason: null, turn: 0, revision: 0, draw_offer: null, state: null, snapshot: null,
   deadline_at: null, deadline_kind: null, moves: null, created_by: actor, created_at: at, started_at: null, finished_at: null, updated_at: at,
   players: [player(0), player(1)],
  };
  if (options) {
   let probe;
   try {
    probe = await createMatch(buildSetup(options, drawn!, [game.players[0].choice!, game.players[1].choice!], game.setup_admission!));
    game.engine_fingerprint = JSON.parse(await probe.exportSave()).engine;
   } catch { fail('UNAVAILABLE', 503, 'The game worker is unavailable. Retry.'); }
   finally { await probe?.close(); }
  }
  if (!options || solo && !needs) await this.start(game, at);
  return game;
 }
 private async start(game: Game, at: Date): Promise<void> {
  if (game.options) {
   if (!game.engine_fingerprint || !game.setup_admission) fail('MATCH_INCOMPATIBLE', 409, 'This unfinished setup has no fixed game version.');
   game.setup = buildSetup(game.options, { army: game.draw!, hand: game.deal! }, [game.players[0].choice!, game.players[1].choice!], game.setup_admission!);
  }
  let match;
  try {
   match = game.options ? await createPinnedMatch(game.setup, game.engine_fingerprint!) : await createMatch(game.setup);
   const snapshot = await match.snapshot(), state = await match.exportSave(), powers = snapshot.rules.kings.some(Boolean);
   Object.assign(game, { snapshot, state, rules: snapshot.rules, turn: snapshot.turn, engine_fingerprint: JSON.parse(state).engine, setup_deadline_at: null });
   if (game.status !== 'waiting') Object.assign(game, { status: 'playing', started_at: at });
   if (!game.options) Object.assign(game, { readings: powers ? 'POWERS_BALANCED' : null, category: `${game.speed}${game.days_per_move ? `-${game.days_per_move}d` : ''}/${powers ? 'powers' : 'no-powers'}/no-cards` });
   for (const p of game.players) p.power = snapshot.rules.kings[p.seat]?.power ?? 'none';
  } catch (error) {
   if (error instanceof MatchError && error.code === 'MATCH_INCOMPATIBLE') fail('MATCH_INCOMPATIBLE', 409, 'This unfinished setup uses an unavailable game version.');
   if (error instanceof MatchError && /^(Malformed |Noncanonical FEN|Unsupported or malformed power state|Private card data unsupported)/.test(error.message)) fail('INVALID_INPUT', 400, 'Invalid game setup');
   fail('UNAVAILABLE', 503, 'The game worker is unavailable. Retry.');
  } finally { await match?.close(); }
 }
 private async enterSetup(game: Game, at: Date): Promise<void> {
  if (!game.options || game.snapshot) { Object.assign(game, { status: 'playing', started_at: at }); return; }
  if (!game.engine_fingerprint || !game.setup_admission) fail('MATCH_INCOMPATIBLE', 409, 'This unfinished setup has no fixed game version.');
  game.status = 'setup';
  if (game.players.every(p => p.ready)) await this.start(game, at);
  else game.setup_deadline_at = new Date(at.getTime() + FIRST_TURN_DAYS * DAY);
 }
 /** Records the actor's seat activity at most once each 30 seconds. A read (view) never writes. */
 async seen(actor: string, gameId: string): Promise<void> {
  actor = id(actor); gameId = id(gameId);
  seatOf(await this.store.load(gameId), actor);
  await this.store.seen(gameId, actor);
 }
 /** One seat's view. Read-only. */
 async view(actor: string, gameId: string, since?: number): Promise<View> {
  actor = id(actor); gameId = id(gameId);
  if (since !== undefined && !(Number.isInteger(since) && since >= 0 && since <= MAX_REVISION)) fail('INVALID_INPUT', 400, 'Invalid revision');
  // A full read also loads the engine save: its initial position starts the move history.
  const game = await this.store.load(gameId, { state: since === undefined });
  return this.render(game, seatOf(game, actor), { since, rules: since === undefined });
 }
 /** A private draft read: the disposable worker changes, the stored game does not. */
 async previewDraft(actor: string, gameId: string, input: unknown): Promise<DraftPreview> {
  actor = id(actor); gameId = id(gameId);
  const { expected_revision, engine_fingerprint, actions } = parse(draftSchema, input);
  const game = await this.store.load(gameId, { state: true }), seat = seatOf(game, actor);
  if (game.revision !== expected_revision) fail('STALE_REVISION', 409, 'The game changed; reload before you act');
  if (!game.state || !game.snapshot || game.engine_fingerprint !== engine_fingerprint || JSON.parse(game.state).engine !== engine_fingerprint) fail('MATCH_INCOMPATIBLE', 409, 'This game implementation is unavailable');
  if (game.status !== 'playing') fail('NOT_ALLOWED', 409, 'This game is not in play');
  if (game.turn !== seat) fail('WRONG_TURN', 403, 'This operation is not permitted on the current turn');
  let match;
  try { match = await loadMatch(game.state!); }
  catch (error) { if (error instanceof MatchError && error.code === 'MATCH_INCOMPATIBLE') fail('MATCH_INCOMPATIBLE', 409, 'This game implementation is unavailable'); return fail('UNAVAILABLE', 503, 'The game worker is unavailable. Retry.'); }
  try {
   let snapshot = await match.snapshot();
   const positions: DraftPosition[] = [];
   const keep = () => positions.push({ fen: snapshot.fen, status: snapshot.status, turn: snapshot.turn, in_check: snapshot.inCheck, moves: snapshot.moves });
   keep();
   for (const lan of actions) {
    if (snapshot.status !== 'playing' || snapshot.turn !== seat) fail('INVALID_MOVE', 400, 'This turn is already complete');
    snapshot = await match.apply({ id: `preview-${randomUUID()}`, expectedRevision: snapshot.revision, lan });
    keep();
   }
   return { game_id: gameId, revision: expected_revision, engine_fingerprint, actions, positions };
  } catch (error) {
   if (error instanceof MatchServiceError) throw error;
   if (error instanceof MatchError && ENGINE_REJECTS.includes(error.message)) fail('INVALID_MOVE', 400, 'This move is not available. Choose another move.');
   return fail('UNAVAILABLE', 503, 'The game worker is unavailable. Retry.');
  } finally { await match.close(); }
 }
 /** The actor's active games: your turn first, then the nearest deadline. */
 async inbox(actor: string): Promise<InboxEntry[]> { return this.store.inbox(id(actor)); }
 async lobby(actor: string): Promise<Lobby> {
  actor = id(actor);
  const [games, count] = await Promise.all([this.store.lobby(actor), this.store.activeCount()]);
  return { games, ...(count >= 10 && { active_count: count }) };
 }
 private async requireHandle(actor: string, client: Parameters<PostgresMatchStore['privacy']>[0] = this.store.pool): Promise<void> {
  if (!(await client.query('select handle from public.profiles where id=$1', [actor])).rows[0]?.handle) fail('HANDLE_NEEDED', 409, 'Pick a handle before you play another person');
 }
 async accept(actor: string, gameId: string, ratingPolicy?: RatingPolicy): Promise<View> {
  actor = id(actor); gameId = id(gameId);
  await this.requireHandle(actor);
  const before = await this.store.load(gameId);
  if (before.rating_policy === 'ranked-v1') requireRanked();
  if (ratingPolicy !== before.rating_policy && !(ratingPolicy === undefined && before.rating_policy === 'legacy')) fail('MATCH_INCOMPATIBLE', 409, 'Choose this game policy before you accept the seat');
  const prepared = before.status === 'waiting' ? await this.prepareEntry(before) : undefined;
  return this.store.transaction(async client => {
   await this.store.lockAccounts(client, [actor, before.created_by]);
   await this.requireHandle(actor, client);
   const game = await this.store.load(gameId, { client, lock: true });
   if (game.rating_policy === 'ranked-v1') requireRanked();
   if (ratingPolicy !== game.rating_policy && !(ratingPolicy === undefined && game.rating_policy === 'legacy')) fail('MATCH_INCOMPATIBLE', 409, 'Choose this game policy before you accept the seat');
   return this.acceptSeat(client, game, actor, undefined, undefined, undefined, prepared);
  });
 }
 /** Takes the oldest open game in the same policy with the same five switches (`anyRules` broadens only the switches), else opens a new table.
  * With a command ID, a resent Find gets the game that the first send opened, joined or reused; other input is COMMAND_CONFLICT. */
 async find(actor: string, options: unknown, colour?: unknown, commandId?: string, anyRules = false, mode?: CreationMode): Promise<View> {
  actor = id(actor); const input = canonicalCreate(parse(createSchema, { kind: 'random', options, colour, mode })), key = startKey(input, anyRules === true);
  if (input.mode === 'ranked' && anyRules) fail('INVALID_INPUT', 400, 'Ranked uses the fixed ranked rules');
  const ratingPolicy = input.mode === 'ranked' ? 'ranked-v1' : 'casual';
  const gameId = commandId === undefined ? randomUUID() : startId(actor, commandId), wanted = key.any_rules ? undefined : switches(input.options!);
  const prepared = new Map<string, Game>();
  const seek = (made?: Game) => this.store.transaction(async client => {
   // An empty lobby has no row to lock. The search lock stays first.
   await client.query('select pg_advisory_xact_lock(7007008)');
   if (commandId !== undefined) await startLock(client, actor, commandId);
   const done = commandId === undefined ? undefined : await this.started(client, actor, commandId, key, mode === undefined);
   if (done) return done;
   await this.requireHandle(actor, client);
   const own = (await client.query(`select id from public.games where created_by=$1 and kind='random' and status='waiting' and created_at>statement_timestamp()-interval '24 hours'
    and ($2::jsonb is null or options @> $2::jsonb) and rating_policy=$3 order by created_at,id limit 1`, [actor, wanted ?? null, ratingPolicy])).rows[0];
   if (own) {
    await this.store.lockAccounts(client, [actor]);
    const game = await this.store.load(own.id, { client, lock: true });
    if (game.status !== 'waiting') return;
    return commandId === undefined ? this.render(game, seatOf(game, actor), { client, rules: true }) : this.receipt(client, game, actor, commandId, key);
   }
   const candidates = await this.store.lobby(actor, { client, switches: wanted, ratingPolicy });
   for (const open of candidates) {
    const before = await this.store.load(open.game_id, { client });
    const ready = prepared.get(before.id);
    if (!ready || ready.revision !== before.revision + 1) return { prepare: before };
    await client.query('savepoint candidate');
    await this.store.lockAccounts(client, [actor, before.created_by]);
    // A candidate row can be busy. Do not wait on it while the global search lock is held.
    if (!(await client.query('select id from public.games where id=$1 for update skip locked', [before.id])).rowCount) { await client.query('rollback to savepoint candidate'); continue; }
    const game = await this.store.load(before.id, { client }), at = await this.store.now(client);
    if (game.status !== 'waiting' || game.created_at.getTime() + DAY <= at.getTime() || !game.created_by || await this.store.pairCount(client, actor, game.created_by) >= 5 || !await this.store.unblocked(client, actor, game.created_by)) { await client.query('rollback to savepoint candidate'); continue; }
    return this.acceptSeat(client, game, actor, at, commandId, key, ready);
   }
   if (!made) return;
   await this.store.lockAccounts(client, [actor]);
   await this.requireHandle(actor, client);
   if (!await this.store.insert(made, client)) return this.view(actor, made.id);
   return commandId === undefined ? this.render(made, seatOf(made, actor), { client, rules: true }) : this.receipt(client, made, actor, commandId, key);
  });
  let made: Game | undefined;
  // A bounded preparation pass builds outside every lock. Capped pairs are excluded in the lobby query.
  for (let attempt = 0; attempt < 102; attempt++) {
   const found = await seek(made);
   if (found && 'prepare' in found) { prepared.set(found.prepare.id, await this.prepareEntry(found.prepare)); continue; }
   if (found) return found;
   made = await this.newGame(actor, input, gameId); settle(made, made.created_at);
  }
  return fail('UNAVAILABLE', 503, 'The open games change too fast. Retry.');
 }

 async cancel(actor: string, gameId: string): Promise<View> {
  actor = id(actor); gameId = id(gameId);
  const before = await this.store.load(gameId);
  return this.store.transaction(async client => {
   await this.store.lockAccounts(client, [actor, before.created_by]);
   const game = await this.store.load(gameId, { client, lock: true });
   if (game.created_by !== actor) fail('FORBIDDEN', 403, 'Only the creator can cancel this open game');
   if (game.kind !== 'random') fail('NOT_ALLOWED', 409, 'Only an open random game can be cancelled');
   const seat = seatOf(game, actor);
   if (game.status === 'aborted' && game.end_reason === 'abort') return this.render(game, seat, { client });
   if (game.status !== 'waiting') fail('NOT_ALLOWED', 409, 'This game is no longer waiting for an opponent');
   const at = new Date(), next = step(game), out: Outgoing = { notify: [], outbox: [] };
   end(next, out, null, 'abort', at);
   await this.write(client, game, next, { seat, actor_id: actor, command_id: null, kind: 'abort', payload: { action: { type: 'abort' } }, actions: null, surface: null, received_at: at }, out);
   return this.render(next, seat, { client });
  });
 }
 /** A Find's command ID and input go on its join row, the start receipt that a resent Find reads. */
 private async acceptSeat(client: Parameters<PostgresMatchStore['save']>[0], game: Game, actor: string, at?: Date, commandId?: string, key?: StartKey, prepared?: Game): Promise<View> {
  at ??= (await client.query('select statement_timestamp() as at')).rows[0].at as Date;
  if (game.kind !== 'random' || game.created_by === actor) fail('NOT_ALLOWED', 409, 'This open game cannot be accepted');
  const seated = game.players.find(p => p.user_id === actor);
  if (seated) return this.render(game, seated.seat, { client, rules: true });
  const seat = game.players.find(p => !p.user_id && !p.computer)?.seat;
  if (game.status !== 'waiting' || seat === undefined || game.created_at.getTime() + DAY <= at.getTime()) return fail('NOT_ALLOWED', 409, 'This open game is no longer available');
  if (!game.created_by || !await this.store.unblocked(client, game.created_by, actor)) fail('FORBIDDEN', 403, 'This open game cannot be accepted');
  await this.checkPair(client, actor, game.created_by!, true);
  const next = step(game), out: Outgoing = { notify: [], outbox: [] };
  Object.assign(next.players[seat], { user_id: actor, last_seen_at: at });
  this.enterPrepared(next, prepared!, at); turnTo(next, out, at, actor);
  await this.write(client, game, next, { seat, actor_id: actor, command_id: commandId ?? null, kind: 'join', payload: commandId === undefined ? {} : key!, actions: null, surface: null, received_at: at }, out);
  return this.render(next, seat, { client, rules: true });
 }
 async record(actor: string): Promise<PlayerRecord> { return playerRecord(this.store.pool, id(actor)); }
 async history(actor: string, before?: string, limit = 20): Promise<HistoryPage> {
  actor = id(actor);
  const page = parse(z.strictObject({ before: z.string().max(100).optional(), limit: z.number().int().min(1).max(20) }), { before, limit });
  const cursor = page.before === undefined ? undefined : parse(z.tuple([z.iso.datetime(), z.string().uuid()]), page.before.split('|'));
  return gameHistory(this.store.pool, actor, cursor, page.limit);
 }
 /** One transaction per command: lock, dedupe, seat, turn, revision, status, lazy Daily deadline, write, alerts. */
 async command(actor: string, gameId: string, input: unknown, surface: Surface = 'web'): Promise<View> {
  actor = id(actor); gameId = id(gameId); const command = parse(commandSchema, input), at = new Date(), { action } = command;
  const payload = { expected_revision: command.expected_revision, action };
  // Engine work runs before the lock; the commit re-checks the revision, so a race costs the loser STALE_REVISION, never a wrong write.
  const before = await this.store.load(gameId, { state: true }), seat = seatOf(before, actor);
  if (before.kind === 'friend' && action.type === 'abort') await this.store.friendTry(actor);
  let played: Played | undefined;
  if ((action.type === 'turn' || action.type === 'computer') && !await this.store.receipt(this.store.pool, gameId, seat, command.command_id, payload) && !check(before, seat, command, at))
   played = await play(before, action.type === 'turn' ? seat : before.turn, action.type === 'turn' ? action.actions : 'computer', index => hash(`${seat}:${command.command_id}:${index}`));
  let rematch: Game | undefined;
  if (action.type === 'rematch' && (action.choice === 'accept' || before.kind === 'solo' && action.choice === 'offer')
   && !await this.store.receipt(this.store.pool, gameId, seat, command.command_id, payload)) {
   check(before, seat, command, at);
   const initiator = before.created_by ?? actor, previousSeat = seatOf(before, initiator);
   rematch = await this.newGame(initiator, { kind: before.kind, colour: colour(before.kind === 'solo' ? previousSeat : other(previousSeat)), level: before.level, ...(before.options ? { options: before.options } : { setup: before.setup }) });
   if (before.kind !== 'solo') {
    for (const p of rematch.players) { p.user_id = before.players[other(p.seat)].user_id; p.computer = before.players[other(p.seat)].computer; }
    await this.enterSetup(rematch, at);
   }
  }
  const inviteRecipient = action.type === 'abort' ? (await this.store.pool.query('select recipient_id from public.game_invites where game_id=$1', [gameId])).rows[0]?.recipient_id : null;
  const outcome = await this.store.transaction(async client => {
   if (action.type === 'abort' || action.type === 'rematch') await this.store.lockAccounts(client, [...before.players.map(p => p.user_id), inviteRecipient]);
   const game = await this.store.load(gameId, { client, lock: true });
   if (await this.store.receipt(client, gameId, seat, command.command_id, payload)) return this.render(game, seat, { client });
   if (action.type === 'rematch' && action.choice !== 'decline' && game.kind !== 'solo' && game.players.every(p => p.user_id) && !await this.store.unblocked(client, actor, game.players[other(seat)].user_id!)) fail('NOT_ALLOWED', 409, 'No rematch is available with this player');
   if (action.type === 'abort' && game.kind === 'friend' && game.created_by === actor && game.status === 'aborted') return this.render(game, seat, { client });
   if (action.type === 'abort' && before.status === 'waiting' && game.status !== 'waiting') fail('NOT_ALLOWED', 409, INVITE_NOTICES.closed);
   if (action.type === 'rematch' && action.choice !== 'decline' && game.kind !== 'solo') await this.checkPair(client, actor, game.players[other(seat)].user_id!);
   const switchOpen = action.type === 'abort' && game.kind === 'solo' && await this.store.canSwitch(actor, game.created_at, client);
   // Only unseen commands check time again after engine work, permission reads and the row-lock wait.
   const at = new Date(), next = step(game), out: Outgoing = { notify: [], outbox: [] };
   const log: Log = { seat, actor_id: actor, command_id: command.command_id, kind: action.type, payload, actions: null, surface, received_at: at };
   if (check(game, seat, command, at, switchOpen)) {
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
    // After the whole turn: the computer plays one action for each call and finishes its turn in the space that full keeps.
    // An older save can start a turn past that space; when the engine takes no more actions, the turn cannot finish.
    else if (full(next) && (next.turn !== mover || played.snapshot.revision >= ENGINE_ACTIONS)) end(next, out, 'draw', 'history', at); // migration 0021 adds the reason
    else if (next.turn !== mover) turnTo(next, out, at, actor);
   } else if (action.type === 'rematch') {
    if (action.choice === 'decline') next.rematch_offer = null;
    else if (action.choice === 'offer' && game.kind !== 'solo') next.rematch_offer = seat;
    else {
     if (!rematch) fail('STALE_REVISION', 409, 'The game changed; reload before you act');
     if (rematch!.status === 'playing') rematch!.started_at = at;
     if (rematch!.status === 'setup') rematch!.setup_deadline_at = new Date(at.getTime() + FIRST_TURN_DAYS * DAY);
     turnTo(rematch!, out, at, actor); settle(rematch!, at);
     await this.store.insert(rematch!, client);
     next.rematch_offer = null; next.rematch_game_id = rematch!.id;
    }
   } else if (action.type === 'choose') {
    if (!game.engine_fingerprint || !game.setup_admission) fail('MATCH_INCOMPATIBLE', 409, 'This unfinished setup has no fixed game version.');
   const error = validateChoice(game.options!, { army: game.draw!, hand: game.deal! }, action.choice, game.setup_admission!);
    if (error) fail('INVALID_INPUT', 400, error);
    Object.assign(next.players[seat], { choice: action.choice, ready: action.ready });
    if (next.players.every(p => p.ready)) { await this.start(next, at); turnTo(next, out, at, actor); }
   } else if (action.type === 'resign') end(next, out, colour(other(seat)), 'resignation', at);
   else if (action.type === 'abort') {
    end(next, out, null, 'abort', at);
    await client.query("update public.game_invites set state='cancelled',closed_at=statement_timestamp() where game_id=$1 and state='open'", [gameId]);
   }
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
 private async recipient(client: Parameters<PostgresMatchStore['save']>[0], actor: string, input: { recipient_id?: string; recipient_handle?: string }): Promise<string | null> {
  if (!input.recipient_id && !input.recipient_handle) return null;
  const row = (await client.query(`select id from public.profiles where ${input.recipient_id ? 'id=$1' : 'handle=$1'} and handle is not null`,
   [input.recipient_id ?? input.recipient_handle!.trim().toLowerCase()])).rows[0];
  if (!row || row.id === actor) fail('NOT_FOUND', 404, INVITE_NOTICES.notFound);
  return row.id;
 }
 private async checkSend(client: Parameters<PostgresMatchStore['save']>[0], actor: string, recipient: string | null): Promise<void> {
  if (recipient && !await this.store.mayJoin(client, recipient, actor)) fail('FORBIDDEN', 403, INVITE_NOTICES.permission);
  if (recipient) await this.checkPair(client, actor, recipient);
  const count = await this.store.pendingCount(client, actor, recipient);
  if (count >= 2) throw new MatchServiceError(recipient ? 'FRIEND_INVITE_LIMIT' : 'OPEN_INVITE_LIMIT', 409,
   recipient ? INVITE_NOTICES.namedLimit(await this.currentHandle(client, recipient), count) : INVITE_NOTICES.openLimit,
   { count, ...(recipient && { handle: await this.currentHandle(client, recipient) }) });
 }
 private async currentHandle(client: Parameters<PostgresMatchStore['privacy']>[0], user: string): Promise<string | null> {
  return (await client.query('select handle from public.profiles where id=$1', [user])).rows[0]?.handle ?? null;
 }
 private async checkPair(client: Parameters<PostgresMatchStore['privacy']>[0], actor: string, opponent: string, accepting = false): Promise<void> {
  const count = await this.store.pairCount(client, actor, opponent);
  if (count >= 5) {
   const handle = await this.currentHandle(client, opponent);
   throw new MatchServiceError('FRIEND_GAME_LIMIT', 409, INVITE_NOTICES.gameLimit(count, handle, accepting), { count, handle });
  }
 }
 private async issue(client: Parameters<PostgresMatchStore['save']>[0], game: Game, actor: string, recipient: string | null, expires?: Date): Promise<Invite> {
  expires ??= new Date((await this.store.now(client)).getTime() + FRIEND_CODE_DAYS * DAY);
  for (let attempt = 0; attempt < 5; attempt++) {
   const token = randomBytes(32).toString('base64url'), code = Array.from({ length: 6 }, () => CODE[randomInt(CODE.length)]).join('');
   const invite_id = hash(token);
   if (await this.store.addInvite(client, { token_hash: invite_id, code_hash: this.codeHash(code), game_id: game.id, seat: other(seatOf(game, actor)), created_by: actor, expires_at: expires, recipient_id: recipient }))
    return { token, code, expires_at: expires.toISOString(), invite_id, recipient_id: recipient };
  }
  return fail('UNAVAILABLE', 503, 'Could not make an invitation. Retry.');
 }
 async invite(actor: string, gameId: string, input: unknown = {}): Promise<Invite> {
  actor = id(actor); gameId = id(gameId); const options = parse(inviteSchema, input);
  await this.store.friendTry(actor);
  return this.store.transaction(async client => {
   const old = (await client.query('select * from public.game_invites where game_id=$1', [gameId])).rows[0];
   const recipient = old?.recipient_id ?? (old ? null : await this.recipient(client, actor, options));
   await this.store.lockAccounts(client, [actor, recipient]);
   const game = await this.store.load(gameId, { client, lock: true });
   if (game.created_by !== actor || game.kind !== 'friend') fail('FORBIDDEN', 403, INVITE_NOTICES.unavailable);
   const stored = (await client.query('select * from public.game_invites where game_id=$1 for update', [gameId])).rows[0];
   // Re-read after account locks. A concurrent send can add the first invitation.
   if ((stored?.recipient_id ?? null) !== recipient) fail('INVITE_UNAVAILABLE', 409, INVITE_NOTICES.unavailable);
   if (game.status !== 'waiting' || stored && stored.state !== 'open') fail('INVITE_UNAVAILABLE', 409, INVITE_NOTICES.closed);
   if (stored && await this.store.inviteExpired(client, stored.token_hash)) fail('INVITE_UNAVAILABLE', 409, INVITE_NOTICES.expired);
   if (stored && (options.recipient_id && options.recipient_id !== recipient || options.recipient_handle || options.open_link && recipient)) fail('INVALID_INPUT', 400, 'Keep the invitation recipient.');
   if (stored && options.rotate === false) fail('NOT_ALLOWED', 409, 'Make a new code to share this invitation.');
   if (recipient && !await this.store.mayJoin(client, recipient, actor)) fail('FORBIDDEN', 403, INVITE_NOTICES.permission);
   if (!stored) await this.checkSend(client, actor, recipient);
   if (stored) await client.query('delete from public.game_invites where game_id=$1', [gameId]);
   return this.issue(client, game, actor, recipient, stored?.expires_at);
  });
 }
 private async invitation(actor: string, tokenOrCode: unknown) {
  if (typeof tokenOrCode === 'object' && tokenOrCode !== null) {
   const { invite_id } = parse(z.strictObject({ invite_id: z.string().regex(/^[a-f0-9]{64}$/) }), tokenOrCode);
   return { column: 'token_hash', value: invite_id, code: '', byId: true };
  }
  const key = typeof tokenOrCode === 'string' ? tokenOrCode.trim() : '', token = /^[A-Za-z0-9_-]{43}$/.test(key), code = key.toUpperCase().replace(/[\s-]/g, '');
  if (!token && !/^[A-HJKMNP-Z2-9]{6}$/.test(code)) fail('INVALID_INPUT', 400, 'Invalid invitation');
  if (!token) await this.store.codeTry(actor);
  let value = token ? hash(key) : this.codeHash(code);
  // shortcut: legacy codes last at most FRIEND_CODE_DAYS after this build is published, remove this fallback after that.
  if (!token) value = (await this.store.pool.query(`select code_hash from public.game_invites where code_hash=$1 or code_hash=$2
   order by (code_hash=$1) desc limit 1`, [value, hash(code)])).rows[0]?.code_hash ?? value;
  return { column: token ? 'token_hash' : 'code_hash', value, code: token ? key : code, byId: false };
 }
 private unavailable(): never { return fail('INVITE_UNAVAILABLE', 404, INVITE_NOTICES.unavailable); }
 private visible(invite: { created_by: string; recipient_id: string | null }, actor: string, byId = false): void {
  if (byId ? invite.recipient_id !== actor : invite.recipient_id && invite.recipient_id !== actor && invite.created_by !== actor) this.unavailable();
 }
 async preview(actor: string, tokenOrCode: unknown): Promise<JoinPreview> {
  actor = id(actor); const { column, value, code, byId } = await this.invitation(actor, tokenOrCode);
  const invite = (await this.store.pool.query(`select * from public.game_invites where ${column}=$1`, [value])).rows[0] ?? this.unavailable();
  this.visible(invite, actor, byId);
  const game = await this.store.load(invite.game_id), host = game.players[other(invite.seat as Seat)];
  if ((invite.state === 'open' || invite.state === 'cancelled' && game.end_reason === 'no_start') && await this.store.inviteExpired(this.store.pool, invite.token_hash)) fail('INVITE_UNAVAILABLE', 409, INVITE_NOTICES.expired);
  if (host.user_id !== actor && (!host.user_id || !await this.store.mayJoin(this.store.pool, invite.recipient_id ?? host.user_id, invite.recipient_id ? host.user_id : actor))) this.unavailable();
  if (invite.state !== 'open' || game.status !== 'waiting') fail('INVITE_UNAVAILABLE', 409, INVITE_NOTICES.closed);
  const recipient = invite.recipient_id ? (await this.store.pool.query('select handle from public.profiles where id=$1', [invite.recipient_id])).rows[0]?.handle : null;
  return { code, options: game.options, colour: colour(invite.seat), kind: game.kind, creator: { handle: host.handle, icon: host.icon ?? null }, expires_at: invite.expires_at.toISOString(), recipient_id: invite.recipient_id, recipient_handle: recipient, invite_id: invite.token_hash };
 }
 /** Build a possible starting position before account or row locks. Recheck the revision on commit. */
 private async prepareEntry(game: Game): Promise<Game> {
  const prepared = step(game); await this.enterSetup(prepared, new Date()); return prepared;
 }
 private enterPrepared(next: Game, prepared: Game, at: Date): void {
  if (next.revision !== prepared.revision) fail('STALE_REVISION', 409, 'The game changed; reload before you act');
  for (const key of ['state', 'snapshot', 'rules', 'setup', 'engine_fingerprint', 'status'] as const) Object.assign(next, { [key]: prepared[key] });
  if (next.status === 'playing') next.started_at = at;
  next.setup_deadline_at = next.status === 'setup' ? new Date(at.getTime() + FIRST_TURN_DAYS * DAY) : null;
  for (const p of next.players) p.power = prepared.players[p.seat].power;
 }
 async join(actor: string, tokenOrCode: unknown): Promise<View> {
  actor = id(actor); await this.requireHandle(actor); await this.store.friendTry(actor);
  const { column, value, byId } = await this.invitation(actor, tokenOrCode);
  const found = (await this.store.pool.query(`select * from public.game_invites where ${column}=$1`, [value])).rows[0] ?? this.unavailable();
  this.visible(found, actor, byId);
  const before = await this.store.load(found.game_id);
  const prepared = found.state === 'open' ? await this.prepareEntry(before) : undefined;
  return this.store.transaction(async client => {
   await this.store.lockAccounts(client, [actor, found.created_by, found.recipient_id]);
   const game = await this.store.load(found.game_id, { client, lock: true });
   const invite = (await client.query(`select * from public.game_invites where ${column}=$1 for update`, [value])).rows[0] ?? this.unavailable();
   this.visible(invite, actor, byId);
   const seat = invite.seat as Seat, host = game.players[other(seat)].user_id;
   if (invite.state === 'accepted' && invite.used_by === actor && game.players[seat].user_id === actor) return this.render(game, seat, { client, rules: true });
   const at = await this.store.now(client);
   if ((invite.state === 'open' || invite.state === 'cancelled' && game.end_reason === 'no_start') && await this.store.inviteExpired(client, invite.token_hash)) fail('INVITE_UNAVAILABLE', 409, INVITE_NOTICES.expired);
   if (invite.state !== 'open') fail('INVITE_UNAVAILABLE', 409, INVITE_NOTICES.closed);
   if (game.status !== 'waiting' || game.players[seat].user_id || host === actor || !host) this.unavailable();
   if (!await this.store.mayJoin(client, invite.recipient_id ?? host!, invite.recipient_id ? host! : actor)) this.unavailable();
   await this.requireHandle(actor, client);
   await this.checkPair(client, actor, host!, true);
   const next = step(game), out: Outgoing = { notify: [], outbox: [] };
   Object.assign(next.players[seat], { user_id: actor, last_seen_at: at });
   this.enterPrepared(next, prepared!, at); turnTo(next, out, at, actor);
   await this.write(client, game, next, { seat, actor_id: actor, command_id: null, kind: 'join', payload: {}, actions: null, surface: null, received_at: at }, out);
   await client.query("update public.game_invites set state='accepted',used_by=$2,used_at=$3,closed_at=$3 where token_hash=$1", [invite.token_hash, actor, at]);
   return this.render(next, seat, { client, rules: true });
  });
 }
 async invitations(actor: string, input: unknown = {}): Promise<InvitationPage> {
  actor = id(actor); const page = parse(invitationsSchema, input);
  const cursor = page.before === undefined ? undefined : parse(z.tuple([z.iso.datetime(), z.string().regex(/^[a-f0-9]{64}$/)]), page.before.split('|'));
  return this.store.invitations(actor, cursor, page.limit);
 }
 async friends(actor: string, input: unknown = {}): Promise<FriendsPage> {
  actor = id(actor); const page = parse(friendsSchema, input);
  await this.store.friendTry(actor);
  const result = await this.store.friends(actor, page.after, page.limit, page.handle);
  if (page.handle && !result.friends.length) fail('NOT_FOUND', 404, INVITE_NOTICES.notFound);
  return result;
 }
 async declineInvite(actor: string, inviteId: string): Promise<InvitationRow> {
  actor = id(actor); inviteId = parse(z.string().regex(/^[a-f0-9]{64}$/), inviteId);
  await this.store.friendTry(actor);
  const found = (await this.store.pool.query('select * from public.game_invites where token_hash=$1', [inviteId])).rows[0] ?? this.unavailable();
  this.visible(found, actor, true);
  return this.store.transaction(async client => {
   await this.store.lockAccounts(client, [actor, found.created_by]);
   const game = await this.store.load(found.game_id, { client, lock: true });
   const invite = (await client.query('select * from public.game_invites where token_hash=$1 for update', [inviteId])).rows[0] ?? this.unavailable();
   this.visible(invite, actor, true);
   const at = await this.store.now(client);
   if (invite.state === 'open' && !await this.store.inviteExpired(client, invite.token_hash) && game.status === 'waiting') {
    const next = step(game), out: Outgoing = { notify: [], outbox: [] };
    end(next, out, null, 'abort', at);
    await this.write(client, game, next, { seat: null, actor_id: actor, command_id: null, kind: 'decline', payload: {}, actions: null, surface: null, received_at: at }, out);
    await client.query("update public.game_invites set state='declined',closed_at=$2 where token_hash=$1", [inviteId, at]);
   }
   return await this.invitationRow(client, actor, inviteId) ?? this.unavailable();
  });
 }
 private async invitationRow(client: Parameters<PostgresMatchStore['privacy']>[0], actor: string, inviteId: string, byGame = false): Promise<InvitationRow | null> {
  const r = (await client.query(`select i.*,i.expires_at<=statement_timestamp() as expired,g.options,g.end_reason,p.id as player_id,p.handle,p.icon from public.game_invites i join public.games g on g.id=i.game_id
   left join public.profiles p on p.id=case when i.created_by=$2 then i.recipient_id else i.created_by end where ${byGame ? 'i.game_id' : 'i.token_hash'}=$1`, [inviteId, actor])).rows[0];
  if (!r) return null;
  return { invite_id: r.token_hash, game_id: r.game_id, recipient_id: r.recipient_id, direction: r.created_by === actor ? 'outgoing' : 'incoming', player: r.player_id ? { user_id: r.player_id, handle: r.handle, icon: r.icon } : null,
   options: r.options, expires_at: r.expires_at.toISOString(), state: (r.state === 'open' || r.state === 'cancelled' && r.end_reason === 'no_start') && r.expired ? 'expired' : r.state };
 }
 /** Ends missed deadlines, expired invitations and 24-hour open games; safe to run twice at once. */
 async sweep(now = new Date()): Promise<number> {
  let ended = 0;
  for (const gameId of await this.store.due(now)) try {
   const before = await this.store.load(gameId);
   const recipient = (await this.store.pool.query('select recipient_id from public.game_invites where game_id=$1', [gameId])).rows[0]?.recipient_id;
   ended += await this.store.transaction(async client => {
    await this.store.lockAccounts(client, [...before.players.map(p => p.user_id), recipient]);
    const game = await this.store.load(gameId, { client, lock: true });
    // A command, a new invitation or another sweep may have come first.
    const late = game.status === 'setup' ? !!game.setup_deadline_at && game.setup_deadline_at <= now : game.status === 'playing' ? !!game.deadline_at && game.deadline_at <= now
     : game.status === 'waiting' && (game.kind === 'random' ? game.created_at.getTime() + DAY <= now.getTime()
      : !!(await client.query("select from public.game_invites where game_id=$1 and state='open' and expires_at<=$2", [gameId, now])).rowCount || game.created_at.getTime() + FRIEND_CODE_DAYS * DAY <= now.getTime() && !(await client.query('select from public.game_invites where game_id=$1', [gameId])).rowCount);
    if (!late) return 0;
    if (game.status === 'waiting') await client.query("update public.game_invites set state='cancelled',closed_at=statement_timestamp() where game_id=$1 and state='open'", [gameId]);
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
  if (before.status !== 'finished' && next.status === 'finished') await recordResult(client, next);
  await this.store.save(client, before, next, log, out);
 }
 private async render(game: Game, seat: Seat, { since, client, rules = false }: { since?: number; client?: Parameters<PostgresMatchStore['save']>[0]; rules?: boolean } = {}): Promise<View> {
  const now = new Date(), opponent = game.players[other(seat)], playing = game.status === 'playing';
  // A block or my quiet mode hides the opponent's presets; their own setting decides if I see when they were last here.
  const sees = opponent.user_id ? await this.store.privacy(client ?? this.store.pool, game.players[seat].user_id!, opponent.user_id) : { presets: true, online: true, unblocked: true };
  const commands = await this.store.commands(game.id, since, client);
  const db = client ?? this.store.pool;
  // Read the identity and metadata together. A concurrent rotation must not split this read.
  const inviteMeta = game.kind === 'friend' ? await this.invitationRow(db, game.players[seat].user_id!, game.id, true) : null;
  const invitation = game.kind === 'friend' ? { invite_id: inviteMeta?.invite_id ?? null } : {};
  const vacant = !opponent.user_id && !opponent.computer && !opponent.handle_at_start && !await this.store.hasJoined(game.id, db);
  const rating = rules && opponent.user_id ? await opponentRating(db, opponent.user_id) : undefined;
  const outcome = rules && game.status === 'finished' ? await gameOutcome(db, game.players[seat].user_id!, game.id) : undefined;
  return {
   ...invitation, ...(inviteMeta && { invitation: inviteMeta }),
   created_at: game.created_at.toISOString(), abort_open: game.status === 'waiting' || game.status === 'setup' || playing && (game.players.some(p => p.turns_played === 0) || game.kind === 'solo' && await this.store.canSwitch(game.players[seat].user_id!, game.created_at, db)),
   ...(outcome && { outcome }), level: game.level,
   game_id: game.id, rating_policy: game.rating_policy, revision: game.revision, engine_fingerprint: game.engine_fingerprint, seat, kind: game.kind, speed: game.speed, days_per_move: game.days_per_move, status: game.status, turn: game.turn, action: actionOf(game, seat),
   fen: game.snapshot?.fen ?? '', in_check: game.snapshot?.inCheck ?? false, legal: playing && game.turn === seat ? game.snapshot!.legal : [],
   last_commands: commands.map(entry => entry.seat === opponent.seat && (entry.action.type === 'choose' && !game.players.every(p => p.ready) || entry.action.type === 'say' && !sees.presets) ? { ...entry, action: { type: 'hidden' as const } } : entry),
   opponent: vacant ? null : { handle: opponent.handle, icon: opponent.icon ?? null, ...(rating && { rating }), computer: opponent.computer, deleted: !opponent.user_id && !opponent.computer, last_seen_ms: sees.online ? opponent.last_seen_ms : null },
   rematch_allowed: sees.unblocked, draw_offer: game.draw_offer, rematch_offer: game.rematch_offer, rematch_game_id: game.rematch_game_id,
   ...(game.options && { options: game.options, ...(game.setup_admission && { setup_admission: game.setup_admission }), draw: game.draw!, deal: game.deal!, level: game.level,
    choices: game.players.map(p => p.seat === seat || game.players.every(s => s.ready) ? p.choice : null) as View['choices'],
    ready: game.players.map(p => p.ready) as [boolean, boolean], setup_deadline_at: game.setup_deadline_at?.toISOString() ?? null }),
   ...(game.snapshot && { kings: game.snapshot.rules.kings, hands: game.snapshot.rules.hands }),
   ...(game.end_reason && { result: { winner: game.result === 'white' ? 0 : game.result === 'black' ? 1 : null, reason: game.end_reason } }),
   deadline_at: game.deadline_at?.toISOString() ?? null, server_now: now.toISOString(),
   ...(rules && game.rules && { rules: game.rules }),
   ...(rules && game.state && game.snapshot && { history: { initial_fen: JSON.parse(game.state).initialFen, actions: game.snapshot.history } }),
  };
 }
}
