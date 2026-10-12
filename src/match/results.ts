import type { Pool, PoolClient } from 'pg';
import { GLICKO2, growRd, provisional, rateGame, type Rating } from '../online/glicko2';
import type { GameFeatures, GameOutcome, HistoryEntry, HistoryPage, PlayerRecord, Seat } from './protocol';
import type { Game } from './store';
import { earnedBadges, type Badge } from './badges';
import type { KingName } from '../rules/rules';
import type { PublicMatchRules } from './index';

const DAY = 86_400_000;
interface StoredRating extends Rating { user_id: string; last_game_at: Date | null }
const idleDays = (at: Date, last: Date | null) => last ? Math.max(0, (at.getTime() - last.getTime()) / DAY) : 0;
type FeatureGame = Pick<Game, 'options' | 'setup'> & { rules: Pick<PublicMatchRules, 'kings' | 'hands' | 'classicChess'> | null };
function features(game: FeatureGame, seat: Seat): GameFeatures {
 const king = game.rules?.kings[seat];
 return { fairy: game.options?.fairy ?? /[ALGMOS]/i.test((game.setup.backRank ?? game.setup.fen ?? '').split(' ')[0]),
  arrangement: game.options?.arrangement ?? false, classic: game.options?.classic ?? game.rules?.classicChess ?? false,
  cards: game.options?.cards ?? !!game.rules?.hands?.some(hand => hand.length), powers: game.options?.kingPowers ?? !!game.rules?.kings.some(Boolean),
  king: king?.king ?? (seat === 0 ? 'Spirit' : 'Shadow'), power: king?.power ?? null };
}

/** The game row is locked first. Player rows lock in ID order, also across games, so no rating update is lost. */
export async function recordResult(client: PoolClient, game: Game): Promise<void> {
 const users = game.players.flatMap(p => p.user_id ? [p.user_id] : []).sort(), at = game.finished_at!;
 for (const user of users) await client.query('insert into public.player_ratings(user_id) values($1) on conflict do nothing', [user]);
 const ratings: StoredRating[] = (await client.query('select * from public.player_ratings where user_id=any($1) order by user_id for update', [users])).rows;
 if (game.kind !== 'solo' && game.players.every(p => p.user_id && !p.computer)) {
  const before = game.players.map(p => ratings.find(r => r.user_id === p.user_id)!) as [StoredRating, StoredRating];
  const after = rateGame(before[0], before[1], game.result === 'white' ? 1 : game.result === 'black' ? 0 : 0.5,
   { idle: [idleDays(at, before[0].last_game_at), idleDays(at, before[1].last_game_at)] });
  for (const [seat, rating] of after.entries()) {
   const old = before[seat];
   await client.query('update public.player_ratings set rating=$2,rd=$3,volatility=$4,last_game_at=greatest(last_game_at,$5) where user_id=$1', [old.user_id, rating.rating, rating.rd, rating.volatility, at]);
   await client.query(`insert into public.rating_history(game_id,user_id,rating_before,rd_before,volatility_before,rating,rd,volatility,created_at) values($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [game.id, old.user_id, old.rating, old.rd, old.volatility, rating.rating, rating.rd, rating.volatility, at]);
  }
 }
 for (const p of game.players) if (p.user_id) {
  const badges: Badge[] = (await client.query('select badge from public.player_badges where user_id=$1', [p.user_id])).rows.map(r => r.badge);
  const wonKings: KingName[] = (await client.query(`select distinct coalesce(g.rules->'kings'->(p.seat::int)->>'king',case p.seat when 0 then 'Spirit' else 'Shadow' end) as king
   from public.game_players p join public.games g on g.id=p.game_id where p.user_id=$1 and g.id<>$2 and g.status='finished' and g.result=case p.seat when 0 then 'white' else 'black' end`, [p.user_id, game.id])).rows.map(r => r.king);
  const opponent = game.players[1 - p.seat];
  const finished: HistoryEntry = { game_id: game.id, finished_at: at.toISOString(), kind: game.kind, colour: p.seat === 0 ? 'white' : 'black',
   result: game.result === 'draw' ? 'drawn' : game.result === (p.seat === 0 ? 'white' : 'black') ? 'won' : 'lost', reason: game.end_reason!,
   opponent: { handle: opponent.handle, icon: null, computer: opponent.computer, deleted: !opponent.user_id && !opponent.computer, level: opponent.computer ? game.level : null }, features: features(game, p.seat) };
  for (const badge of earnedBadges(finished, { badges, wonKings })) await client.query('insert into public.player_badges(user_id,badge,earned_at,game_id) values($1,$2,$3,$4) on conflict do nothing', [p.user_id, badge, at, game.id]);
 }
}

/** One statement gives totals and rating from the same database snapshot; it writes nothing. */
export async function playerRecord(pool: Pool, actor: string): Promise<PlayerRecord> {
 const row = (await pool.query(`select t.*,coalesce(r.rating,1500) as rating,coalesce(r.rd,350) as rd,coalesce(r.volatility,0.06) as volatility,r.last_game_at,
  coalesce((select jsonb_agg(jsonb_build_object('badge',badge,'earned_at',earned_at) order by earned_at,badge) from public.player_badges where user_id=$1),'[]'::jsonb) as badges
  from (select count(*)::int as played,count(*) filter (where g.result=case p.seat when 0 then 'white' else 'black' end)::int as won,
   count(*) filter (where g.result='draw')::int as drawn,count(*) filter (where g.result<>case p.seat when 0 then 'white' else 'black' end and g.result<>'draw')::int as lost
   from public.game_players p join public.games g on g.id=p.game_id where p.user_id=$1 and g.status='finished') t
  left join public.player_ratings r on r.user_id=$1`, [actor])).rows[0];
 const rating = growRd(row.last_game_at ? row : { rating: GLICKO2.rating, rd: GLICKO2.rd, volatility: GLICKO2.volatility }, idleDays(new Date(), row.last_game_at));
 return { totals: { played: row.played, won: row.won, drawn: row.drawn, lost: row.lost }, rating: { ...rating, provisional: provisional(rating.rd) },
  badges: row.badges.map((b: { badge: Badge; earned_at: string }) => ({ ...b, earned_at: new Date(b.earned_at).toISOString() })) };
}

export async function gameHistory(pool: Pool, actor: string, before: [string, string] | undefined, limit: number): Promise<HistoryPage> {
 const rows = (await pool.query(`select g.id as game_id,g.finished_at,to_char(g.finished_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') as cursor_at,
  g.kind,g.result,g.end_reason as reason,g.level,g.options,g.setup,
  jsonb_build_object('kings',g.rules->'kings','hands',g.rules->'hands','classicChess',g.rules->'classicChess') as rules,
  me.seat,op.user_id as op_user,op.computer as op_computer,pr.handle,pr.icon
  from public.game_players me join public.games g on g.id=me.game_id
  join public.game_players op on op.game_id=me.game_id and op.seat<>me.seat left join public.profiles pr on pr.id=op.user_id
  where me.user_id=$1 and g.status='finished' and ($2::timestamptz is null or (g.finished_at,g.id)<($2::timestamptz,$3::uuid))
  order by g.finished_at desc,g.id desc limit $4`, [actor, before?.[0] ?? null, before?.[1] ?? null, limit + 1])).rows;
 const games = rows.slice(0, limit).map((r): HistoryEntry => ({ game_id: r.game_id, finished_at: r.finished_at.toISOString(), kind: r.kind,
  colour: r.seat === 0 ? 'white' : 'black', result: r.result === 'draw' ? 'drawn' : r.result === (r.seat === 0 ? 'white' : 'black') ? 'won' : 'lost', reason: r.reason,
  opponent: { handle: r.handle, icon: r.icon, computer: r.op_computer, deleted: !r.op_user && !r.op_computer, level: r.op_computer ? r.level : null }, features: features(r, r.seat) }));
 const last = rows[limit - 1];
 return { games, next_before: rows.length > limit ? `${last.cursor_at}|${last.game_id}` : null };
}

/** Full page reads only. A computer game has no rating-history row. */
export async function opponentRating(client: Pool | PoolClient, actor: string): Promise<{ rating: number; provisional: boolean }> {
 const row = (await client.query('select rating,rd,volatility,last_game_at from public.player_ratings where user_id=$1', [actor])).rows[0];
 const rating = row ? growRd(row, idleDays(new Date(), row.last_game_at)) : GLICKO2;
 return { rating: rating.rating, provisional: provisional(rating.rd) };
}
export async function gameOutcome(client: Pool | PoolClient, actor: string, game: string): Promise<GameOutcome> {
 const [rating, badges] = await Promise.all([
  client.query('select rating_before,rating,rd from public.rating_history where user_id=$1 and game_id=$2', [actor, game]),
  client.query('select badge,earned_at from public.player_badges where user_id=$1 and game_id=$2 order by earned_at,badge', [actor, game]),
 ]);
 const row = rating.rows[0];
 return { rating_before: row?.rating_before ?? null, rating: row?.rating ?? null, provisional: row ? provisional(row.rd) : true,
  badges: badges.rows.map(r => ({ badge: r.badge, earned_at: r.earned_at.toISOString() })) };
}
