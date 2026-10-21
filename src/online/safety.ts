/** Reports and moderation (report part 01, section 8.2; part 03, section 8.10): a player's report, the owner's
 * queue, actions with a statement of reasons, appeals and the report hold for NCA cases. `report` runs on the
 * store's pool (the runtime role) with the reporter from verified identity. The owner's functions need the
 * admin connection (tools/mod.ts): the runtime role cannot read the queue or write `mod_actions`. */
import type { PoolClient } from 'pg';
import { z } from 'zod';
import { handleProblem, REPORT_CATEGORIES } from '../account/profile';
import { PRESETS } from '../match/protocol';
import { fail, id, parse } from '../match/service';
import type { PostgresMatchStore } from '../match/store';
import { targetSchema, who } from './accounts';

const DAY = 86_400_000;
/** Every statement of reasons ends with this line (Ofcom ICU D9 to D13; DSA Article 17). */
export const APPEAL = 'How to appeal: follow the steps at https://kingdown.dev/support.html#appeals.';
/** Control characters (C0, DEL and C1) and the bidi controls: a terminal acts on them, or they reorder the text that the owner reads. */
export const CONTROLS = '\\p{Cc}\\u061c\\u200e\\u200f\\u202a-\\u202e\\u2066-\\u2069';
// Newlines are allowed; the other controls (a terminal escape, for one) are not.
const prose = (max: number) => z.string().trim().min(1).max(max).regex(new RegExp(`^(?:\\n|[^${CONTROLS}])*$`, 'u'));
const reportSchema = z.strictObject({
  target: z.enum(['player', 'handle', 'message']), category: z.enum(REPORT_CATEGORIES), intimate_image: z.boolean().optional(),
  note: prose(1000).optional(), preset: z.enum(PRESETS).optional(), ...targetSchema,
});
const intakeSchema = reportSchema.extend({
  evidence: prose(200).refine(value => !value.includes('\n'), 'Use one support evidence reference'), note: prose(700),
});
const actSchema = z.strictObject({
  action: z.enum(['warning', 'rename', 'hide', 'suspension', 'none']), facts: prose(800).optional(), rule: prose(400).optional(),
  days: z.number().int().min(1).max(3650).optional(), handle: z.string().max(40).optional(),
});
const appealSchema = z.strictObject({ status: z.enum(['open', 'upheld', 'reversed']), note: prose(1000) });
const holdSchema = z.strictObject({ nca_reference: prose(100), days: z.number().int().min(1).max(3650).optional() });
const serial = (value: unknown): number => Number.isSafeInteger(value) && (value as number) > 0 ? value as number : fail('INVALID_INPUT', 400, 'Expected a positive whole number');

export class SafetyService {
  constructor(readonly store: PostgresMatchStore, readonly appealInstructions = APPEAL) {}
  /** A player reports another player, their handle, or one of their presets in a game that both share.
   * The report keeps the handle or preset as it was, as evidence. "Intimate image" is a choice of child safety. */
  async report(actor: string, input: unknown): Promise<{ id: number; created_at: string }> {
    actor = id(actor); const { target, category, intimate_image = false, note, preset, ...named } = parse(reportSchema, input);
    if (intimate_image && category !== 'child_safety_or_illegal') fail('INVALID_INPUT', 400, 'The intimate image choice is part of child safety or illegal content');
    if (target === 'message' ? preset === undefined || named.game_id === undefined : preset !== undefined) fail('INVALID_INPUT', 400, 'A message report names the game and the preset; other reports name no preset');
    const pool = this.store.pool, reported = await who(pool, actor, named);
    let content: string | null;
    if (target === 'message') {
      const said: string[] = (await pool.query('select said from public.game_players where game_id=$1 and user_id=$2', [id(named.game_id), reported])).rows[0]?.said ?? [];
      content = said.includes(preset!) ? preset! : fail('NOT_FOUND', 404, 'That message is not in this game');
    } else content = (await pool.query('select handle from public.profiles where id=$1', [reported])).rows[0]?.handle ?? null;
    const row = (await pool.query('insert into public.reports(reporter_id,reported_id,game_id,target,category,intimate_image,note,content) values($1,$2,$3,$4,$5,$6,$7,$8) returning id,created_at',
      [actor, reported, named.game_id === undefined ? null : id(named.game_id), target, category, intimate_image, note ?? null, content])).rows[0];
    return { id: Number(row.id), created_at: row.created_at.toISOString() };
  }
  /** The operator records an email case after verifying its reporter's account. Reuse the normal
   * target and evidence rules; the moderation grant keeps this off the player-facing connection. */
  async intake(actor: string, input: unknown): Promise<{ id: number; created_at: string }> {
    const { evidence, ...report } = parse(intakeSchema, input);
    const allowed = (await this.store.pool.query("select has_table_privilege(current_user,'public.mod_actions','INSERT') as allowed")).rows[0]?.allowed;
    if (!allowed) fail('FORBIDDEN', 403, 'Support intake needs the moderation connection');
    return this.report(actor, { ...report, note: `Support evidence: ${evidence}\n${report.note}` });
  }
  /** Open reports: child safety or illegal content first (intimate images before the rest, each with its
   * 48-hour take-down time), then the oldest. */
  async queue(): Promise<Record<string, unknown>[]> {
    const result = await this.store.pool.query(`select r.id,r.category,r.intimate_image,case when r.intimate_image then r.created_at+interval '48 hours' end as take_down_by,
      r.target,r.content,rp.handle as reported_handle,r.game_id,r.note,r.created_at,r.hold_until,fp.handle as reporter_handle
      from public.reports r left join public.profiles rp on rp.id=r.reported_id left join public.profiles fp on fp.id=r.reporter_id
      where r.status='open' order by r.category='child_safety_or_illegal' desc,r.intimate_image desc,r.created_at limit 200`);
    return result.rows.map(row => ({ ...row, id: Number(row.id) }));
  }
  /** One report, with the reported player's earlier actions and how many open reports name them. */
  async show(reportId: number): Promise<Record<string, unknown>> {
    const pool = this.store.pool;
    const report = (await pool.query(`select r.*,rp.handle as reported_handle,fp.handle as reporter_handle from public.reports r
      left join public.profiles rp on rp.id=r.reported_id left join public.profiles fp on fp.id=r.reporter_id where r.id=$1`, [serial(reportId)])).rows[0] ?? fail('NOT_FOUND', 404, 'Report not found');
    const actions = (await pool.query('select id,action,statement,created_at,ends_at,appeal_status,appeal_note from public.mod_actions where user_id=$1 order by created_at', [report.reported_id])).rows;
    const open = (await pool.query(`select count(*)::int as n from public.reports where reported_id=$1 and status='open'`, [report.reported_id])).rows[0].n;
    return { ...report, id: Number(report.id), actions: actions.map(row => ({ ...row, id: Number(row.id) })), open_reports_on_player: open };
  }
  /** The owner acts on a report in one transaction: the action, its statement of reasons (the facts, the rule,
   * how to appeal), the player's notice, and the report closed. `none` closes the report with no action.
   * rename: a new handle that the owner gives; hide: no handle until the player picks one. Both block the old one. */
  async act(reportId: number, input: unknown, by = 'owner'): Promise<{ action_id: number | null }> {
    const { action, facts, rule, days, handle } = parse(actSchema, input);
    if (action !== 'none' && (!facts || !rule)) fail('INVALID_INPUT', 400, 'An action needs the facts and the rule');
    if ((action === 'suspension') !== (days !== undefined) || (action === 'rename') !== (handle !== undefined)) fail('INVALID_INPUT', 400, 'A suspension needs its days and a rename its new handle');
    return this.store.transaction(async client => {
      const report = (await client.query('select id,reported_id from public.reports where id=$1 for update', [serial(reportId)])).rows[0] ?? fail('NOT_FOUND', 404, 'Report not found');
      const actionId = action === 'none' ? null : await this.apply(client, report.reported_id ?? fail('NOT_FOUND', 404, 'The reported account no longer exists'),
        { action, statement: `What happened: ${facts}\nThe rule: ${rule}\n${this.appealInstructions}`, days, handle }, by, report.id);
      await client.query(`update public.reports set status='closed',reviewed_at=now(),outcome=$2 where id=$1`, [report.id, action]);
      return { action_id: actionId };
    });
  }
  private async apply(client: PoolClient, user: string, { action, statement, days, handle }: { action: 'warning' | 'rename' | 'hide' | 'suspension'; statement: string; days?: number; handle?: string }, by: string, reportId: number): Promise<number> {
    let old: string | null = null, ends: Date | null = null;
    if (action === 'rename' || action === 'hide') {
      // The handle goes at once and never returns unless an appeal reverses the action; the player may pick another at once.
      const next = handle === undefined ? null : handle.trim().toLowerCase(), problem = next === null ? null : handleProblem(next);
      if (problem) fail('INVALID_INPUT', 400, problem);
      old = (await client.query('select handle from public.profiles where id=$1 for update', [user])).rows[0]?.handle ?? fail('NOT_ALLOWED', 409, 'The player has no handle');
      await client.query(`insert into public.reserved_handles(handle,reason,user_id) values($1,'blocked',$2) on conflict (handle) do update set reason='blocked',user_id=excluded.user_id`, [old, user]);
      try { await client.query('update public.profiles set handle=$2,handle_changed_at=null where id=$1', [user, next]); }
      catch (error) { if ((error as { code?: string }).code === '23505') fail('HANDLE_TAKEN', 409, 'This handle is taken'); throw error; }
      await client.query('update public.game_players set handle_at_start=$3 where user_id=$1 and handle_at_start=$2', [user, old, next]);
    } else if (action === 'suspension') {
      ends = new Date(Date.now() + days! * DAY);
      // Supabase Auth refuses a banned account's sign-ins and token refreshes.
      // ponytail: a token issued before the ban works until it expires (1 hour at most); the game server does not check bans itself.
      await client.query('update auth.users set banned_until=$2 where id=$1', [user, ends]);
    }
    const row = (await client.query('insert into public.mod_actions(user_id,action,statement,by,ends_at,report_id,handle) values($1,$2,$3,$4,$5,$6,$7) returning id',
      [user, action, statement, by, ends, reportId, old])).rows[0];
    await client.query(`insert into public.notifications(user_id,kind,payload) values($1,'moderation',$2)`, [user, { action_id: Number(row.id), action, statement, ends_at: ends?.toISOString() ?? null }]);
    return Number(row.id);
  }
  /** Records an appeal (it comes to the owner by email) and the decision. A reversal undoes the action:
   * a suspension ends, and a renamed or hidden handle comes back. */
  async appeal(actionId: number, input: unknown): Promise<void> {
    const { status, note } = parse(appealSchema, input);
    await this.store.transaction(async client => {
      const done = (await client.query('select id,user_id,action,handle,appeal_status from public.mod_actions where id=$1 for update', [serial(actionId)])).rows[0] ?? fail('NOT_FOUND', 404, 'Action not found');
      if (done.appeal_status === 'reversed') fail('NOT_ALLOWED', 409, 'This action is already reversed');
      if (status === 'reversed' && done.user_id) {
        await client.query('update auth.users u set banned_until=null from public.mod_actions m where m.id=$1 and u.id=m.user_id and m.action=\'suspension\' and u.banned_until=m.ends_at', [done.id]);
        if (done.handle) {
          await client.query(`delete from public.reserved_handles where handle=$1 and reason='blocked'`, [done.handle]);
          await client.query('update public.profiles set handle=$2 where id=$1', [done.user_id, done.handle]);
        }
      }
      await client.query(`update public.mod_actions set appeal_status=$2,appeal_note=$3,ends_at=case when $2='reversed' then now() else ends_at end where id=$1`, [done.id, status, note]);
      if (status !== 'open' && done.user_id) await client.query(`insert into public.notifications(user_id,kind,payload) values($1,'appeal',$2)`, [done.user_id, { action_id: Number(done.id), status, note }]);
    });
  }
  /** After a report to the National Crime Agency: the reported player's data stays for a year (S.I. 2026/268);
   * the deletion job skips a held player. A hold only grows. The player is not told. */
  async hold(reportId: number, input: unknown): Promise<{ hold_until: string }> {
    const { nca_reference, days = 365 } = parse(holdSchema, input);
    const row = (await this.store.pool.query('update public.reports set nca_reference=$2,hold_until=greatest(hold_until,now()+make_interval(days=>$3)) where id=$1 returning hold_until',
      [serial(reportId), nca_reference, days])).rows[0] ?? fail('NOT_FOUND', 404, 'Report not found');
    return { hold_until: row.hold_until.toISOString() };
  }
}
