/** Server-only PostgreSQL I/O for online games; never import into a browser bundle. The service decides; this writes. */
import type { Pool, PoolClient } from 'pg';
import type { Options, Choice, SetupAdmission } from './setup';
import type { Icon } from '../account/profile';
import type { SkillName } from '../ai/skill';
import type { CardName } from '../rules/rules';
import type { MatchSetup, MatchSnapshot, PublicMatchRules } from './index';
import type { EndReason, ErrorCode, RatingPolicy, GameStatus, InboxEntry, LobbyEntry, LoggedCommand, Preset, Seat, SeatAction, Surface, LimitDetails, InvitationPage, FriendsPage } from './protocol';
export class MatchServiceError extends Error {
 constructor(public code: ErrorCode, public status: number, message: string, public details?: LimitDetails) { super(message); this.name = 'MatchServiceError'; }
}
export interface Player { seat: Seat; user_id: string | null; computer: boolean; handle_at_start: string | null; /** current, from profiles */ handle: string | null; icon?: Icon | null; power: string; choice: Choice | null; ready: boolean; action: SeatAction; turns_played: number; draw_offers: number; said: Preset[]; last_seen_at: Date | null; last_seen_ms: number | null; last_surface: Surface | null; active: boolean; ended_at: Date | null }
export interface Game {
 rating_policy: RatingPolicy; id: string; kind: 'solo' | 'friend' | 'random'; speed: 'daily' | 'live'; days_per_move: 1 | 3 | 7 | null; category: string; readings: string | null; colour_rule: 'white' | 'black' | 'random';
 setup_admission: SetupAdmission | null; options: Options | null; draw: string | null; deal: CardName[] | null; level: SkillName; setup_deadline_at: Date | null; rematch_offer: Seat | null; rematch_game_id: string | null;
 engine_fingerprint: string | null; setup: MatchSetup; rules: PublicMatchRules | null; status: GameStatus; result: 'white' | 'black' | 'draw' | null; end_reason: EndReason | null;
 turn: Seat; revision: number; draw_offer: Seat | null; /** the engine save; loaded only for engine work */ state?: string | null; snapshot: MatchSnapshot | null;
 deadline_at: Date | null; deadline_kind: 'first_turn' | 'move' | null; moves: string[] | null; created_by: string | null;
 created_at: Date; started_at: Date | null; finished_at: Date | null; updated_at: Date; players: [Player, Player];
}
/** One game_commands row: a seat's command, or an event (no command_id). */
export interface Log { seat: Seat | null; actor_id: string | null; command_id: string | null; kind: string; payload: object; actions: string[] | null; surface: Surface | null; received_at: Date }
type Client = Pool | PoolClient;
const GAME = 'rating_policy,id,kind,speed,days_per_move,category,readings,colour_rule,engine_fingerprint,setup,rules,status,result,end_reason,turn,revision,draw_offer,snapshot,deadline_at,deadline_kind,moves,created_by,created_at,started_at,finished_at,updated_at,options,draw,deal,level,setup_deadline_at,rematch_offer,rematch_game_id,setup_admission';
const PLAYER = 'p.seat,p.user_id,p.computer,p.handle_at_start,pr.handle,pr.icon,p.power,p.choice,p.ready,p.action,p.turns_played,p.draw_offers,p.said,p.last_seen_at,(extract(epoch from statement_timestamp()-p.last_seen_at)*1000)::double precision as last_seen_ms,p.last_surface,p.active,p.ended_at';
/** SQL: no block either way between users `a` and `b`. */
const unblocked = (a: string, b: string) => `not exists(select from public.relations where kind='block' and ((user_id=${a} and other_id=${b}) or (user_id=${b} and other_id=${a})))`;
/** SQL: `viewer` may see when `other` was last seen (their "who sees that I am online", given in `setting`). */
const online = (viewer: string, other: string, setting: string) => `${unblocked(viewer, other)} and (${setting}='everyone' or ${setting}='mutual'
 and exists(select from public.relations where user_id=${viewer} and other_id=${other} and kind='follow') and exists(select from public.relations where user_id=${other} and other_id=${viewer} and kind='follow'))`;

export class PostgresMatchStore {
 /** Account locks precede game and invite row locks. Permission writes use the same order. */
 async lockAccounts(client: PoolClient, users: (string | null | undefined)[]): Promise<void> {
  for (const user of [...new Set(users.filter((u): u is string => !!u))].sort())
   await client.query('select pg_advisory_xact_lock(hashtextextended($1, 0))', [`account:${user}`]);
 }
 async now(client: Client = this.pool): Promise<Date> { return (await client.query('select statement_timestamp() as at')).rows[0].at; }
 /** Count on its own commit so failed writes still use the budget. */
 async toolTry(actor: string, tool: string, { count, seconds, message }: { count: number; seconds: number; message: string }): Promise<void> {
  const fresh = "t.window_start>now()-$3*interval '1 second'";
  const { tries } = (await this.pool.query(`insert into public.plugin_tool_tries as t(user_id,tool) values($1,$2)
   on conflict(user_id,tool) do update set tries=case when ${fresh} then least(t.tries+1,$4) else 1 end,
   window_start=case when ${fresh} then t.window_start else now() end returning tries`, [actor, tool, seconds, count+1])).rows[0];
  if (tries > count) throw new MatchServiceError('RATE_LIMITED', 429, message);
 }
 async friendTry(actor: string): Promise<void> {
  await this.toolTry(actor, 'kingdown_friends', { count: 60, seconds: 60, message: 'Too many invitation requests. Wait one minute, then try again.' });
 }
 async inviteExpired(client: Client, inviteId: string): Promise<boolean> {
  return (await client.query('select expires_at<=statement_timestamp() as expired from public.game_invites where token_hash=$1', [inviteId])).rows[0]?.expired ?? true;
 }
 async pairCount(client: Client, a: string, b: string): Promise<number> {
  return (await client.query(`select count(distinct g.id)::int as n from public.game_players a
   join public.game_players b on b.game_id=a.game_id join public.games g on g.id=a.game_id
   where a.user_id=$1 and b.user_id=$2 and not a.computer and not b.computer and g.kind<>'solo' and g.status in ('setup','playing')`, [a, b])).rows[0].n;
 }
 async pendingCount(client: Client, sender: string, recipient: string | null): Promise<number> {
  return (await client.query(`select count(*)::int as n from public.game_invites i join public.games g on g.id=i.game_id
   where i.created_by=$1 and ${recipient ? 'i.recipient_id=$2' : 'i.recipient_id is null'} and i.state='open'
   and i.expires_at>statement_timestamp() and g.status='waiting'`, recipient ? [sender, recipient] : [sender])).rows[0].n;
 }
 async invitations(actor: string, before?: [string, string], limit = 20, client: Client = this.pool): Promise<InvitationPage> {
  // The cursor keeps PostgreSQL microseconds. JavaScript dates keep only milliseconds.
  const rows = (await client.query(`select i.token_hash as invite_id,i.game_id,g.revision,i.recipient_id,i.created_at,
   to_char(i.created_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') as cursor_at,
   case when i.created_by=$1 then 'outgoing' else 'incoming' end as direction,
   case when (i.state='open' or i.state='cancelled' and g.end_reason='no_start') and i.expires_at<=statement_timestamp() then 'expired' else i.state end as state,
   i.expires_at,g.options,p.id as user_id,p.handle,p.icon from public.game_invites i join public.games g on g.id=i.game_id
   left join public.profiles p on p.id=case when i.created_by=$1 then i.recipient_id else i.created_by end
   where (i.created_by=$1 or i.recipient_id=$1 and ${unblocked('i.created_by', '$1')})
   and ($2::timestamptz is null or (i.created_at,i.token_hash)<($2::timestamptz,$3::text))
   order by i.created_at desc,i.token_hash desc limit $4`, [actor, before?.[0] ?? null, before?.[1] ?? null, limit + 1])).rows;
  return { invitations: rows.slice(0, limit).map(({ created_at: _at, cursor_at: _cursor, user_id, handle, icon, ...row }) => ({ ...row,
   player: user_id ? { user_id, handle, icon } : null, expires_at: row.expires_at.toISOString() })),
   next_before: rows.length > limit ? `${rows[limit-1].cursor_at}|${rows[limit-1].invite_id}` : null };
 }
 async friends(actor: string, after?: string, limit = 20, handle?: string): Promise<FriendsPage> {
  const rows = (await this.pool.query(`with candidates as (
   select op.user_id as user_id,'recent' as source,max(g.updated_at) as recent from public.game_players me
   join public.game_players op on op.game_id=me.game_id and op.seat<>me.seat and not op.computer
   join public.games g on g.id=me.game_id where me.user_id=$1 and op.user_id is not null group by op.user_id
   union all select other_id,'follow',null::timestamptz from public.relations where user_id=$1 and kind='follow'
  ), people as (select (select max(c.recent) from candidates c where c.user_id=p.id) as recent,p.id as user_id,p.handle,p.icon,case when exists(select from candidates c where c.user_id=p.id and c.source='recent') then 'recent' when exists(select from candidates c where c.user_id=p.id) then 'follow' else 'lookup' end as source
   from public.profiles p where p.id<>$1 and p.handle is not null and ${unblocked('$1', 'p.id')}
   and (p.challenge_from in ('signed-in','everyone') or p.challenge_from='follows' and exists(select from public.relations where user_id=p.id and other_id=$1 and kind='follow'))
   and ($4::text is null and exists(select from candidates c where c.user_id=p.id) or p.handle=$4))
   , ordered as (select *,row_number() over(order by source desc,recent desc nulls last,user_id) as position from people)
   select user_id,handle,icon,source from ordered where $2::uuid is null or position>(select position from ordered where user_id=$2)
   order by position limit $3`, [actor, after ?? null, limit + 1, handle?.trim().toLowerCase() ?? null])).rows;
  // Recent opponents precede follows. The cursor includes a user ID from this actor's own list.
  return { friends: rows.slice(0, limit), next_after: rows.length > limit ? rows[limit-1].user_id : null };
 }

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
 /** False when a game with this ID exists already: a resent start keeps the first game. */
 async insert(game: Game, client?: PoolClient): Promise<boolean> {
  if (!client) return this.transaction(c => this.insert(game, c));
  const added = await client.query(`insert into public.games(id,kind,speed,days_per_move,category,readings,colour_rule,engine_fingerprint,setup,rules,status,turn,revision,state,snapshot,created_by,created_at,started_at,updated_at,options,draw,deal,level,setup_deadline_at,deadline_at,deadline_kind,setup_admission,rating_policy)
   values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$17,$19,$20,$21,$22,$23,$24,$25,$26,$27) on conflict (id) do nothing`,
   [game.id, game.kind, game.speed, game.days_per_move, game.category, game.readings, game.colour_rule, game.engine_fingerprint, game.setup, game.rules, game.status, game.turn, game.revision, game.state, game.snapshot, game.created_by, game.created_at, game.started_at, game.options, game.draw, game.deal === null ? null : JSON.stringify(game.deal), game.level, game.setup_deadline_at, game.deadline_at, game.deadline_kind, game.setup_admission, game.rating_policy]);
  if (!added.rowCount) return false;
  for (const p of game.players) await client.query(`insert into public.game_players(game_id,seat,user_id,computer,handle_at_start,power,action,last_seen_at,choice,ready)
   values($1,$2,$3,$4,(select handle from public.profiles where id=$3),$5,$6,$7,$8,$9)`, [game.id, p.seat, p.user_id, p.computer, p.power, p.action, p.last_seen_at, p.choice, p.ready]);
  return true;
 }
 /** The user's seat activity, at most once each 30 seconds; a user with no seat changes nothing. */
 async seen(game: string, user: string): Promise<void> {
  await this.pool.query("update public.game_players set last_seen_at=statement_timestamp() where game_id=$1 and user_id=$2 and (last_seen_at is null or last_seen_at<=statement_timestamp()-interval '30 seconds')", [game, user]);
 }
 /** Writes `next` (revision = before + 1) and its log row. State and snapshot are written only when they changed. */
 async save(client: PoolClient, before: Game, next: Game, log: Log): Promise<void> {
  await client.query(`update public.games set status=$2,result=$3,end_reason=$4,turn=$5,revision=$6,draw_offer=$7,state=coalesce($8,state),snapshot=coalesce($9,snapshot),
   deadline_at=$10,deadline_kind=$11,moves=$12,started_at=$13,finished_at=$14,updated_at=now(),setup=$15,rules=$16,engine_fingerprint=$17,setup_deadline_at=$18,rematch_offer=$19,rematch_game_id=$20 where id=$1`,
   [next.id, next.status, next.result, next.end_reason, next.turn, next.revision, next.draw_offer, next.state !== before.state ? next.state : null, next.snapshot !== before.snapshot ? next.snapshot : null,
    next.deadline_at, next.deadline_kind, next.moves, next.started_at, next.finished_at, next.setup, next.rules, next.engine_fingerprint, next.setup_deadline_at, next.rematch_offer, next.rematch_game_id]);
  // A seat keeps the handle its opponent first saw; it is copied once, when the seat gets its player.
  for (const p of next.players) await client.query(`update public.game_players set user_id=$3,handle_at_start=coalesce(handle_at_start,(select handle from public.profiles where id=$3)),action=$4,turns_played=$5,draw_offers=$6,said=$7,
   last_seen_at=greatest(last_seen_at,$8),last_surface=$9,active=$10,ended_at=$11,choice=$12,ready=$13,power=$14 where game_id=$1 and seat=$2`,
   [next.id, p.seat, p.user_id, p.action, p.turns_played, p.draw_offers, p.said, p.last_seen_at, p.last_surface, p.active, p.ended_at, p.choice, p.ready, p.power]);
  await client.query(`insert into public.game_commands(game_id,seq,seat,actor_id,command_id,kind,payload,actions,turn_after,status_after,surface,received_at)
   values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
   [next.id, next.revision, log.seat, log.actor_id, log.command_id, log.kind, log.payload, log.actions, next.turn, next.status, log.surface, log.received_at]);
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
  // A start receipt is no move: its time would show when a player who hides online status chose Find (RV7-2).
  const result = await client.query(`select seq,seat,kind,payload,actions,created_at from public.game_commands where game_id=$1 and seq>$2 and kind<>'start' order by seq desc limit $3`, [game, since ?? 0, since === undefined ? 10 : 50]);
  return result.rows.reverse().map(r => ({ seq: r.seq, seat: r.seat, at: r.created_at.toISOString(),
   action: r.kind === 'join' || r.kind === 'expire' || r.kind === 'decline' ? { type: r.kind } : r.kind === 'computer' ? { type: 'computer', actions: r.actions } : r.payload.action }));
 }
 async hasJoined(game: string, client: Client = this.pool): Promise<boolean> {
  return (await client.query("select exists(select from public.game_commands where game_id=$1 and kind='join') as joined", [game])).rows[0].joined;
 }
 async canSwitch(actor: string, started: Date, client: Client = this.pool): Promise<boolean> {
  return (await client.query(`select exists(select from public.games g join public.game_commands c on c.game_id=g.id and c.kind='join'
   where g.created_by=$1 and g.kind='random' and g.status in ('setup','playing') and g.created_at<=$2 and c.created_at>$2) as available`, [actor, started])).rows[0].available;
 }
 async addInvite(client: PoolClient, row: { token_hash: string; code_hash: string; game_id: string; seat: Seat; created_by: string; expires_at: Date | string; recipient_id: string | null }): Promise<boolean> {
  const result = await client.query('insert into public.game_invites(token_hash,code_hash,game_id,seat,created_by,expires_at,recipient_id) values($1,$2,$3,$4,$5,$6,$7) on conflict do nothing',
   [row.token_hash, row.code_hash, row.game_id, row.seat, row.created_by, row.expires_at, row.recipient_id]);
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
  const result = await client.query(`select exists(select from public.profiles where id=$1 and handle is not null) and ${unblocked('$1', '$2')}
   and case (select challenge_from from public.profiles where id=$1) when 'nobody' then false
    when 'follows' then exists(select from public.relations where user_id=$1 and other_id=$2 and kind='follow') else true end as allowed`, [host, joiner]);
  return result.rows[0].allowed;
 }
 async unblocked(client: Client, host: string, joiner: string): Promise<boolean> {
  return (await client.query(`select ${unblocked('$1', '$2')} as allowed`, [host, joiner])).rows[0].allowed;
 }
 async inbox(actor: string): Promise<InboxEntry[]> {
  const result = await this.pool.query(`select g.id as game_id,g.rating_policy,g.kind,g.speed,g.status,me.seat,me.action,g.turn,g.revision,g.deadline_at,g.updated_at,g.options,g.level,g.created_at,
    nullif(split_part(g.snapshot->>'fen',' ',6),'')::int as move,
    case when g.kind='friend' and g.status='waiting' then (select token_hash from public.game_invites where game_id=g.id) end as invite_id,
    case when g.status='waiting' then case when g.kind='random' then g.created_at+interval '24 hours' else (select expires_at from public.game_invites where game_id=g.id) end end as open_until,
    op.user_id as op_user,op.computer as op_computer,case when ${online('$1', 'op.user_id', 'pr.online_visible_to')} then (extract(epoch from statement_timestamp()-op.last_seen_at)*1000)::double precision end as op_seen,pr.handle as op_handle,pr.icon as op_icon
   from public.game_players me join public.games g on g.id=me.game_id
   join public.game_players op on op.game_id=me.game_id and op.seat<>me.seat left join public.profiles pr on pr.id=op.user_id
   where me.user_id=$1 and me.active order by me.action='ready' desc,g.deadline_at asc nulls last,g.updated_at desc limit 100`, [actor]);
  return result.rows.map(({ op_user, op_computer, op_seen, op_handle, op_icon, ...r }) => ({ ...r, created_at: r.created_at.toISOString(), open_until: r.open_until?.toISOString() ?? null, deadline_at: r.deadline_at?.toISOString() ?? null, updated_at: r.updated_at.toISOString(),
   opponent: r.status === 'waiting' && !op_user ? null : { handle: op_handle ?? null, icon: op_icon ?? null, computer: op_computer, deleted: !op_user && !op_computer, last_seen_ms: op_seen } }));
 }
 /** Open random games, oldest first. `switches` (JSON) keeps only games whose options contain those values. */
 async lobby(actor: string, { client = this.pool as Client, lock = false, switches, ratingPolicy }: { client?: Client; lock?: boolean; switches?: string; ratingPolicy?: RatingPolicy } = {}): Promise<LobbyEntry[]> {
  const result = await client.query(`select g.id as game_id,g.rating_policy,g.options,p.seat,pr.handle,pr.icon,g.created_at from public.games g
   join public.game_players p on p.game_id=g.id and p.user_id is null and not p.computer
   join public.profiles pr on pr.id=g.created_by
   where g.kind='random' and g.status='waiting' and g.created_at>statement_timestamp()-interval '24 hours' and g.created_by<>$1 and pr.handle is not null and ${unblocked('$1', 'g.created_by')}
   and (select count(distinct paired.id) from public.game_players a join public.game_players b on b.game_id=a.game_id join public.games paired on paired.id=a.game_id
    where a.user_id=$1 and b.user_id=g.created_by and not a.computer and not b.computer and paired.kind<>'solo' and paired.status in ('setup','playing'))<5
   and ($2::jsonb is null or g.options @> $2::jsonb) and ($3::text is null or g.rating_policy=$3) order by g.created_at,g.id limit ${lock ? 1 : 100}${lock ? ' for update of g skip locked' : ''}`, [actor, switches ?? null, ratingPolicy ?? null]);
  return result.rows.map(({ seat, handle, icon, created_at, ...row }) => ({ ...row, colour: seat === 0 ? 'white' : 'black', creator: { handle, icon }, created_at: created_at.toISOString() }));
 }
 async activeCount(): Promise<number> {
  return (await this.pool.query("select count(distinct user_id)::int as n from public.game_players where user_id is not null and last_seen_at>=now()-interval '10 minutes'")).rows[0].n;
 }
 /** What `viewer` sees of `other`: their presets (no block, and the viewer's quiet mode is off) and when they were last seen. */
 async privacy(client: Client, viewer: string, other: string): Promise<{ presets: boolean; online: boolean; unblocked: boolean }> {
  const result = await client.query(`select ${unblocked('$1', '$2')} as unblocked, ${unblocked('$1', '$2')} and not (select quiet_mode from public.profiles where id=$1) as presets,
   coalesce((select ${online('$1', '$2', 'online_visible_to')} from public.profiles where id=$2), false) as online`, [viewer, other]);
  return result.rows[0];
 }
 /** Games past their deadline, expired invitations, friends with no code after 7 days and random games after 24 hours. */
 async due(now: Date, limit = 100): Promise<string[]> {
  return (await this.pool.query(`(select id from public.games where status='playing' and deadline_at<=$1 order by deadline_at limit $2)
   union all (select id from public.games where status='setup' and setup_deadline_at<=$1 order by setup_deadline_at limit $2)
   union all (select i.game_id from public.game_invites i join public.games g on g.id=i.game_id where g.status='waiting' and g.kind<>'random' and i.state='open' and i.expires_at<=statement_timestamp() limit $2)
   union all (select g.id from public.games g where g.kind='friend' and g.status='waiting' and g.created_at<=$1::timestamptz-interval '7 days' and not exists(select from public.game_invites where game_id=g.id) order by g.created_at limit $2)
   union all (select id from public.games where kind='random' and status='waiting' and created_at<=$1::timestamptz-interval '24 hours' order by created_at limit $2)`, [now, limit])).rows.map(r => r.id);
 }
}
