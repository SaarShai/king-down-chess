/** The online account (report part 01, sections 5.3 to 5.8; part 03, section 8.8): handle, icon, privacy
 * settings, follows and blocks, the deletion request and alert choices. Server only, on the store's pool
 * (the runtime role). The actor is a verified user ID, never input; other input is `unknown` and checked here. */
import type { Pool, PoolClient } from 'pg';
import { z } from 'zod';
import { CHALLENGE_FROM, handleProblem, ICONS, NOTIFY_DEFAULTS, ONLINE_VISIBLE_TO, RENAME_DAYS, type MyProfile, type NotifyKind, type NotifyPrefs, type AccountNotice, type AccountNotices } from '../account/profile';
import { fail, id, parse } from '../match/service';
import type { PostgresMatchStore } from '../match/store';

const DAY = 86_400_000;
/** A decimal PostgreSQL bigint, kept as text so IDs above Number.MAX_SAFE_INTEGER stay exact. */
export const noticesBeforeSchema = z.string().refine(value => /^[1-9]\d{0,18}$/.test(value) && BigInt(value) <= 9223372036854775807n, 'Expected a positive notice ID');
const moderationNotice = z.object({ action_id: z.number().int().positive().safe(), action: z.enum(['warning', 'rename', 'hide', 'suspension']), statement: z.string(), ends_at: z.iso.datetime({ offset: true }).nullable() });
const appealNotice = z.object({ action_id: z.number().int().positive().safe(), status: z.enum(['upheld', 'reversed']), note: z.string() });
type Client = Pool | PoolClient;
const settingsSchema = z.strictObject({
  icon: z.string().refine(key => Object.hasOwn(ICONS, key)).nullable(),
  challenge_from: z.enum(CHALLENGE_FROM), online_visible_to: z.enum(ONLINE_VISIBLE_TO),
  quiet_mode: z.boolean(), accepting_games: z.boolean(), on_leaderboards: z.boolean(),
}).partial().refine(changes => Object.keys(changes).length > 0);
/** One other player: by handle, by a game you share with them, or by user ID. */
export const targetSchema = { handle: z.string().max(40).optional(), game_id: z.string().optional(), user_id: z.string().optional() };
const relationSchema = z.strictObject({ kind: z.enum(['follow', 'block']), ...targetSchema });
const channels = z.strictObject({ email: z.boolean(), push: z.boolean() }).partial();
const prefsSchema = z.partialRecord(z.enum(Object.keys(NOTIFY_DEFAULTS) as [NotifyKind, ...NotifyKind[]]), channels);

/** The user ID of the one player that `target` names; never the actor. A game names your opponent in it. */
export async function who(client: Client, actor: string, target: { handle?: string; game_id?: string; user_id?: string }): Promise<string> {
  if ([target.handle, target.game_id, target.user_id].filter(value => value !== undefined).length !== 1) fail('INVALID_INPUT', 400, 'Name one player: a handle, a game or a user ID');
  const result = target.handle !== undefined ? await client.query('select id from public.profiles where handle=$1', [target.handle.trim().toLowerCase()])
    : target.game_id !== undefined ? await client.query('select op.user_id as id from public.game_players me join public.game_players op on op.game_id=me.game_id and op.seat<>me.seat where me.game_id=$1 and me.user_id=$2', [id(target.game_id), actor])
    : await client.query('select id from public.profiles where id=$1', [id(target.user_id)]);
  const other: string = result.rows[0]?.id ?? fail('NOT_FOUND', 404, 'Player not found');
  return other === actor ? fail('INVALID_INPUT', 400, 'Name another player') : other;
}

export class AccountService {
  constructor(readonly store: PostgresMatchStore) {}
  /** The actor's own profile: handle, when a rename opens, settings and a waiting deletion. */
  async profile(actor: string, client: Client = this.store.pool): Promise<MyProfile> {
    actor = id(actor);
    const result = await client.query(`select p.id as user_id,p.handle,p.handle_changed_at,p.icon,p.challenge_from,p.online_visible_to,p.quiet_mode,p.accepting_games,p.on_leaderboards,d.requested_at,d.run_after
      from public.profiles p left join public.account_deletions d on d.user_id=p.id and d.cancelled_at is null and d.done_at is null where p.id=$1`, [actor]);
    const { handle_changed_at, requested_at, run_after, ...row } = result.rows[0] ?? fail('NOT_FOUND', 404, 'Profile not found');
    const opens = row.handle && handle_changed_at ? new Date(handle_changed_at.getTime() + RENAME_DAYS * DAY) : null;
    return { ...row, can_rename_at: opens && opens > new Date() ? opens.toISOString() : null,
      deletion: requested_at ? { requested_at: requested_at.toISOString(), run_after: run_after.toISOString() } : null };
  }
  /** Only the actor's own moderation and appeal notices. Payload is projected to the player's safe DTO. */
  async notices(actor: string, before?: string): Promise<AccountNotices> {
    const cursor = parse(noticesBeforeSchema.optional(), before);
    const rows = (await this.store.pool.query("select id::text,kind,payload,created_at from public.notifications where user_id=$1 and kind in ('moderation','appeal') and ($2::bigint is null or id<$2) order by notifications.id desc limit 21", [id(actor), cursor ?? null])).rows;
    const notices: AccountNotice[] = rows.slice(0, 20).map(row => {
      const base = { id: row.id, created_at: row.created_at.toISOString() };
      if (row.kind === 'moderation') {
        const payload = moderationNotice.safeParse(row.payload);
        const data = payload.success ? payload.data : fail('UNAVAILABLE', 503, 'An account notice could not be read');
        return { ...base, kind: 'moderation', action_id: data.action_id, action: data.action, text: data.statement, ends_at: data.ends_at };
      }
      const payload = appealNotice.safeParse(row.payload);
      const data = payload.success ? payload.data : fail('UNAVAILABLE', 503, 'An account notice could not be read');
      return { ...base, kind: 'appeal', action_id: data.action_id, status: data.status, text: data.note };
    });
    return { notices, next_notices_before: rows.length > 20 ? notices.at(-1)!.id : null };
  }
  /** Picks or changes the handle: the first pick and the first change are free, then one change in 90 days.
   * Migration 0008 keeps every old handle reserved and refuses a reserved one. */
  async setHandle(actor: string, input: unknown): Promise<MyProfile> {
    actor = id(actor); const handle = parse(z.strictObject({ handle: z.string().max(40) }), input).handle.trim().toLowerCase();
    const problem = handleProblem(handle); if (problem) fail('INVALID_INPUT', 400, problem);
    return this.store.transaction(async client => {
      const row = (await client.query('select handle,handle_changed_at from public.profiles where id=$1 for update', [actor])).rows[0] ?? fail('NOT_FOUND', 404, 'Profile not found');
      if (row.handle === handle) return this.profile(actor, client);
      if (row.handle && row.handle_changed_at > new Date(Date.now() - RENAME_DAYS * DAY)) fail('NOT_ALLOWED', 409, `You can change your handle once in ${RENAME_DAYS} days`);
      try { await client.query('update public.profiles set handle=$2,handle_changed_at=case when handle is null then handle_changed_at else now() end where id=$1', [actor, handle]); }
      catch (error) { if ((error as { code?: string }).code === '23505') fail('HANDLE_TAKEN', 409, 'This handle is taken'); throw error; }
      return this.profile(actor, client);
    });
  }
  /** Icon and privacy settings; send only the fields that change. */
  async updateSettings(actor: string, input: unknown): Promise<MyProfile> {
    actor = id(actor); const changes = parse(settingsSchema, input), keys = Object.keys(changes) as (keyof typeof changes)[];
    // The keys are the schema's own field names, so they are safe as column names.
    await this.store.pool.query(`update public.profiles set ${keys.map((key, index) => `${key}=$${index + 2}`).join(',')} where id=$1`, [actor, ...keys.map(key => changes[key])]);
    return this.profile(actor);
  }
  /** Follow or block. A block also ends the follows both ways; a follow across a block is refused. A block is not secret
   * (as on most game sites): the blocked player's follow leaves their own list, so a silent 204 here would not hide it. */
  async relate(actor: string, input: unknown): Promise<void> {
    actor = id(actor); const { kind, ...target } = parse(relationSchema, input);
    await this.store.transaction(async client => {
      const other = await who(client, actor, target), pair = 'user_id=$1 and other_id=$2 or user_id=$2 and other_id=$1';
      if (kind === 'block') await client.query(`delete from public.relations where kind='follow' and (${pair})`, [actor, other]);
      else if ((await client.query(`select from public.relations where kind='block' and (${pair})`, [actor, other])).rowCount) fail('NOT_ALLOWED', 409, 'You cannot follow this player');
      await client.query('insert into public.relations(user_id,other_id,kind) values($1,$2,$3) on conflict do nothing', [actor, other, kind]);
    });
  }
  async unrelate(actor: string, input: unknown): Promise<void> {
    actor = id(actor); const { kind, ...target } = parse(relationSchema, input);
    await this.store.pool.query('delete from public.relations where user_id=$1 and other_id=$2 and kind=$3', [actor, await who(this.store.pool, actor, target), kind]);
  }
  /** The actor's own follows and blocks. Nobody sees another player's lists (record of measures, M05). */
  async relations(actor: string): Promise<{ kind: 'follow' | 'block'; user_id: string; handle: string | null; created_at: string }[]> {
    const result = await this.store.pool.query('select r.kind,r.other_id as user_id,p.handle,r.created_at from public.relations r left join public.profiles p on p.id=r.other_id where r.user_id=$1 order by r.created_at desc limit 1000', [id(actor)]);
    return result.rows.map(row => ({ ...row, created_at: row.created_at.toISOString() }));
  }
  /** Asks for the deletion after a 7-day grace; a second request keeps the first date. A sign-in or `cancelDeletion` stops it.
   * Migration 0008's helper sets the dates: the runtime role may not write them. */
  async requestDeletion(actor: string): Promise<MyProfile> {
    actor = id(actor);
    await this.store.pool.query('select kingdown_jobs.request_deletion($1)', [actor]);
    return this.profile(actor);
  }
  async cancelDeletion(actor: string): Promise<MyProfile> {
    actor = id(actor);
    await this.store.pool.query('update public.account_deletions set cancelled_at=now() where user_id=$1 and cancelled_at is null and done_at is null', [actor]);
    return this.profile(actor);
  }
  /** Each alert's email and push choice; an alert with no row has its default. */
  async notificationPrefs(actor: string): Promise<NotifyPrefs> {
    const rows = (await this.store.pool.query('select kind,email,push from public.notification_prefs where user_id=$1', [id(actor)])).rows;
    return Object.fromEntries(Object.entries(NOTIFY_DEFAULTS).map(([kind, value]) => {
      const row = rows.find(r => r.kind === kind);
      return [kind, row ? { email: row.email, push: row.push } : { ...value }];
    })) as NotifyPrefs;
  }
  /** Changes only the channels sent, each alert in one statement, so two changes at once both stay. */
  async setNotificationPrefs(actor: string, input: unknown): Promise<NotifyPrefs> {
    actor = id(actor);
    for (const [kind, change] of Object.entries(parse(prefsSchema, input)) as [NotifyKind, z.infer<typeof channels>][])
      await this.store.pool.query(`insert into public.notification_prefs as n (user_id,kind,email,push) values($1,$2,coalesce($3::boolean,$5),coalesce($4::boolean,$6))
        on conflict (user_id,kind) do update set email=coalesce($3::boolean,n.email),push=coalesce($4::boolean,n.push)`,
        [actor, kind, change.email ?? null, change.push ?? null, NOTIFY_DEFAULTS[kind].email, NOTIFY_DEFAULTS[kind].push]);
    return this.notificationPrefs(actor);
  }
}
