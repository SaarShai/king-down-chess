/** Server-only PostgreSQL I/O for online games; never import into a browser bundle. The service decides; this writes. */
import type { Pool, PoolClient } from 'pg';
import type { Options, Choice } from './setup';
import type { SkillName } from '../ai/skill';
import type { CardName } from '../rules/rules';
import type { MatchSetup, MatchSnapshot, PublicMatchRules } from './index';
import type { EndReason, ErrorCode, GameStatus, InboxEntry, LoggedCommand, Preset, Seat, SeatAction, Surface } from './protocol';
export class MatchServiceError extends Error {
 constructor(public code: ErrorCode, public status: number, message: string) { super(message); this.name = 'MatchServiceError'; }
}
export interface Player { seat: Seat; user_id: string | null; computer: boolean; handle_at_start: string | null; /** current, from profiles */ handle: string | null; power: string; choice: Choice | null; ready: boolean; action: SeatAction; turns_played: number; draw_offers: number; said: Preset[]; last_seen_at: Date | null; last_surface: Surface | null; active: boolean; ended_at: Date | null }
export interface Game {
 id: string; kind: 'solo' | 'friend' | 'random'; speed: 'daily' | 'live'; days_per_move: 1 | 3 | 7 | null; category: string; readings: string | null; colour_rule: 'white' | 'black' | 'random';
 options: Options | null; draw: string | null; deal: CardName[] | null; level: SkillName; setup_deadline_at: Date | null; rematch_offer: Seat | null; rematch_game_id: string | null;
 engine_fingerprint: string | null; setup: MatchSetup; rules: PublicMatchRules | null; status: GameStatus; result: 'white' | 'black' | 'draw' | null; end_reason: EndReason | null;
 turn: Seat; revision: number; draw_offer: Seat | null; /** the engine save; loaded only for engine work */ state?: string | null; snapshot: MatchSnapshot | null;
 deadline_at: Date | null; deadline_kind: 'first_turn' | 'move' | null; moves: string[] | null; created_by: string | null;
 created_at: Date; started_at: Date | null; finished_at: Date | null; updated_at: Date; players: [Player, Player];
}
/** One game_commands row: a seat's command, or an event (no command_id). */
export interface Log { seat: Seat | null; actor_id: string | null; command_id: string | null; kind: string; payload: object; actions: string[] | null; surface: Surface | null; received_at: Date }
export interface Outgoing { notify: { user_id: string; kind: string; payload: object }[]; outbox: { kind: string; payload: object }[] }
type Client = Pool | PoolClient;
const GAME = 'id,kind,speed,days_per_move,category,readings,colour_rule,engine_fingerprint,setup,rules,status,result,end_reason,turn,revision,draw_offer,snapshot,deadline_at,deadline_kind,moves,created_by,created_at,started_at,finished_at,updated_at,options,draw,deal,level,setup_deadline_at,rematch_offer,rematch_game_id';
const PLAYER = 'p.seat,p.user_id,p.computer,p.handle_at_start,pr.handle,p.power,p.choice,p.ready,p.action,p.turns_played,p.draw_offers,p.said,p.last_seen_at,p.last_surface,p.active,p.ended_at';
/** SQL: no block either way between users `a` and `b`. */
const unblocked = (a: string, b: string) => `not exists(select from public.relations where kind='block' and ((user_id=${a} and other_id=${b}) or (user_id=${b} and other_id=${a})))`;
/** SQL: `viewer` may see when `other` was last seen (their "who sees that I am online", given in `setting`). */
const online = (viewer: string, other: string, setting: string) => `${unblocked(viewer, other)} and (${setting}='everyone' or ${setting}='mutual'
 and exists(select from public.relations where user_id=${viewer} and other_id=${other} and kind='follow') and exists(select from public.relations where user_id=${other} and other_id=${viewer} and kind='follow'))`;

export class PostgresMatchStore {
 constructor(readonly pool: Pool) {}
 async transaction<T>(action: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await this.pool.connect();
  try { await client.query('begin'); const value = await action(client); await client.query('commit'); return value; }
  catch (error) { await client.query('rollback'); throw error; }
  finally { client.release(); }
 }
 /** `lock` takes the game row for the rest of the transaction; every write takes it first. */
 async load(id: string, { client = this.pool as Client, lock = false, state = false } = {}): Promise<Game> {
  const game = await client.query(`select ${GAME}${state ? ',state' : ''} from public.games where id=$1${lock ? ' for update' : ''}`, [id]);
  if (!game.rows[0]) throw new MatchServiceError('NOT_FOUND', 404, 'Game not found');
  const players = await client.query(`select ${PLAYER} from public.game_players p left join public.profiles pr on pr.id=p.user_id where p.game_id=$1 order by p.seat`, [id]);
  return { ...game.rows[0], players: players.rows as [Player, Player] };
 }
 async insert(game: Game): Promise<void> {
  await this.transaction(async client => {
   await client.query(`insert into public.games(id,kind,speed,days_per_move,category,readings,colour_rule,engine_fingerprint,setup,rules,status,turn,revision,state,snapshot,created_by,created_at,started_at,updated_at,options,draw,deal,level,setup_deadline_at)
    values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$17,$19,$20,$21,$22,$23)`,
    [game.id, game.kind, game.speed, game.days_per_move, game.category, game.readings, game.colour_rule, game.engine_fingerprint, game.setup, game.rules, game.status, game.turn, game.revision, game.state, game.snapshot, game.created_by, game.created_at, game.started_at, game.options, game.draw, game.deal === null ? null : JSON.stringify(game.deal), game.level, game.setup_deadline_at]);
   for (const p of game.players) await client.query(`insert into public.game_players(game_id,seat,user_id,computer,handle_at_start,power,action,last_seen_at,choice,ready)
    values($1,$2,$3,$4,(select handle from public.profiles where id=$3),$5,$6,$7,$8,$9)`, [game.id, p.seat, p.user_id, p.computer, p.power, p.action, p.last_seen_at, p.choice, p.ready]);
  });
 }
 /** Writes `next` (revision = before + 1), its log row and its alerts. State and snapshot are written only when they changed. */
 async save(client: PoolClient, before: Game, next: Game, log: Log, out: Outgoing): Promise<void> {
  await client.query(`update public.games set status=$2,result=$3,end_reason=$4,turn=$5,revision=$6,draw_offer=$7,state=coalesce($8,state),snapshot=coalesce($9,snapshot),
   deadline_at=$10,deadline_kind=$11,moves=$12,started_at=$13,finished_at=$14,updated_at=now(),setup=$15,rules=$16,engine_fingerprint=$17,setup_deadline_at=$18 where id=$1`,
   [next.id, next.status, next.result, next.end_reason, next.turn, next.revision, next.draw_offer, next.state !== before.state ? next.state : null, next.snapshot !== before.snapshot ? next.snapshot : null,
    next.deadline_at, next.deadline_kind, next.moves, next.started_at, next.finished_at, next.setup, next.rules, next.engine_fingerprint, next.setup_deadline_at]);
  // A seat keeps the handle its opponent first saw; it is copied once, when the seat gets its player.
  for (const p of next.players) await client.query(`update public.game_players set user_id=$3,handle_at_start=coalesce(handle_at_start,(select handle from public.profiles where id=$3)),action=$4,turns_played=$5,draw_offers=$6,said=$7,
   last_seen_at=$8,last_surface=$9,active=$10,ended_at=$11,choice=$12,ready=$13,power=$14 where game_id=$1 and seat=$2`,
   [next.id, p.seat, p.user_id, p.action, p.turns_played, p.draw_offers, p.said, p.last_seen_at, p.last_surface, p.active, p.ended_at, p.choice, p.ready, p.power]);
  await client.query(`insert into public.game_commands(game_id,seq,seat,actor_id,command_id,kind,payload,actions,turn_after,status_after,surface,received_at)
   values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
   [next.id, next.revision, log.seat, log.actor_id, log.command_id, log.kind, log.payload, log.actions, next.turn, next.status, log.surface, log.received_at]);
  for (const n of out.notify) await client.query('insert into public.notifications(user_id,kind,payload) values($1,$2,$3)', [n.user_id, n.kind, n.payload]);
  for (const e of out.outbox) await client.query('insert into public.outbox(kind,payload) values($1,$2)', [e.kind, e.payload]);
 }
 /** True when this seat already sent this command with the same input; COMMAND_CONFLICT for other input. */
 async receipt(client: Client, game: string, seat: Seat, commandId: string, payload: object): Promise<boolean> {
  const result = await client.query('select payload=$4::jsonb as same from public.game_commands where game_id=$1 and seat=$2 and command_id=$3', [game, seat, commandId, JSON.stringify(payload)]);
  if (!result.rows.length) return false;
  if (!result.rows[0].same) throw new MatchServiceError('COMMAND_CONFLICT', 409, 'Command ID was used with different input');
  return true;
 }
 /** The commands after `since` (at most 50, the newest), or the last 10. */
 async commands(game: string, since?: number, client: Client = this.pool): Promise<LoggedCommand[]> {
  const result = await client.query(`select seq,seat,kind,payload,actions,created_at from public.game_commands where game_id=$1 and seq>$2 order by seq desc limit $3`, [game, since ?? 0, since === undefined ? 10 : 50]);
  return result.rows.reverse().map(r => ({ seq: r.seq, seat: r.seat, at: r.created_at.toISOString(),
   action: r.kind === 'join' || r.kind === 'expire' ? { type: r.kind } : r.kind === 'computer' ? { type: 'computer', actions: r.actions } : r.payload.action }));
 }
 async addInvite(client: PoolClient, row: { token_hash: string; code_hash: string; game_id: string; seat: Seat; created_by: string; expires_at: Date }): Promise<boolean> {
  const result = await client.query('insert into public.game_invites(token_hash,code_hash,game_id,seat,created_by,expires_at) values($1,$2,$3,$4,$5,$6) on conflict do nothing',
   [row.token_hash, row.code_hash, row.game_id, row.seat, row.created_by, row.expires_at]);
  return result.rowCount === 1;
 }
 /** Counts one short-code try, on its own commit so a refused join still counts: RATE_LIMITED after 10 in one hour
  * (report part 03, section 8.5). The row lock queues tries at once, so a burst cannot pass the limit. */
 async codeTry(actor: string): Promise<void> {
  const fresh = "t.window_start>now()-interval '1 hour'";
  const { tries } = (await this.pool.query(`insert into public.invite_code_tries as t (user_id) values($1) on conflict (user_id) do update
   set tries=case when ${fresh} then t.tries+1 else 1 end,window_start=case when ${fresh} then t.window_start else now() end returning tries`, [actor])).rows[0];
  if (tries > 10) throw new MatchServiceError('RATE_LIMITED', 429, 'Too many invitation codes. Wait one hour, or use the invitation link.');
 }
 /** A block either way refuses; so does the host's "who can challenge me" setting (nobody, or only people they follow). */
 async mayJoin(client: Client, host: string, joiner: string): Promise<boolean> {
  const result = await client.query(`select ${unblocked('$1', '$2')}
   and case (select challenge_from from public.profiles where id=$1) when 'nobody' then false
    when 'follows' then exists(select from public.relations where user_id=$1 and other_id=$2 and kind='follow') else true end as allowed`, [host, joiner]);
  return result.rows[0].allowed;
 }
 async inbox(actor: string): Promise<InboxEntry[]> {
  const result = await this.pool.query(`select g.id as game_id,g.kind,g.speed,g.status,me.seat,me.action,g.turn,g.revision,g.deadline_at,g.updated_at,
    op.user_id as op_user,op.computer as op_computer,case when ${online('$1', 'op.user_id', 'pr.online_visible_to')} then op.last_seen_at end as op_seen,pr.handle as op_handle
   from public.game_players me join public.games g on g.id=me.game_id
   join public.game_players op on op.game_id=me.game_id and op.seat<>me.seat left join public.profiles pr on pr.id=op.user_id
   where me.user_id=$1 and me.active order by me.action='ready' desc,g.deadline_at asc nulls last,g.updated_at desc limit 100`, [actor]);
  const now = Date.now();
  return result.rows.map(({ op_user, op_computer, op_seen, op_handle, ...r }) => ({ ...r, deadline_at: r.deadline_at?.toISOString() ?? null, updated_at: r.updated_at.toISOString(),
   opponent: r.status === 'waiting' && !op_user ? null : { handle: op_handle ?? null, computer: op_computer, deleted: !op_user && !op_computer, last_seen_ms: op_seen ? now - op_seen.getTime() : null } }));
 }
 /** What `viewer` sees of `other`: their presets (no block, and the viewer's quiet mode is off) and when they were last seen. */
 async privacy(client: Client, viewer: string, other: string): Promise<{ presets: boolean; online: boolean }> {
  const result = await client.query(`select ${unblocked('$1', '$2')} and not (select quiet_mode from public.profiles where id=$1) as presets,
   coalesce((select ${online('$1', '$2', 'online_visible_to')} from public.profiles where id=$2), false) as online`, [viewer, other]);
  return result.rows[0];
 }
 /** Games past their Daily deadline, oldest first, then waiting games whose invitation ran out (a game has at most one). */
 async due(now: Date, limit = 100): Promise<string[]> {
  return (await this.pool.query(`(select id from public.games where status='playing' and deadline_at<=$1 order by deadline_at limit $2)
   union all (select id from public.games where status='setup' and setup_deadline_at<=$1 order by setup_deadline_at limit $2)
   union all (select i.game_id from public.game_invites i join public.games g on g.id=i.game_id where g.status='waiting' and i.used_by is null and i.expires_at<=$1 limit $2)`, [now, limit])).rows.map(r => r.id);
 }
}
