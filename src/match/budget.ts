import type { Pool } from 'pg';
import { fail, id } from './service';

export const TOOL_LIMITS = {
 kingdown_computer: { count: 120, seconds: 60, message: 'Too many computer turns. Wait one minute, then try again.' },
 kingdown_create: { count: 60, seconds: 60, message: 'Too many new games. Wait one minute, then try again.' },
 kingdown_open: { count: 60, seconds: 60, message: 'Too many new boards. Wait one minute, then try again.' },
 kingdown_report: { count: 30, seconds: 3600, message: 'Too many reports. Wait one hour, then try again.' },
};

/** Count in a separate commit before service work, so a refused call keeps its charge. The upsert locks the row. */
export async function toolTry(pool: Pool, actor: string, tool: keyof typeof TOOL_LIMITS): Promise<void> {
 const { count, seconds, message } = TOOL_LIMITS[tool];
 const fresh = "t.window_start>now()-$3*interval '1 second'";
 const { tries } = (await pool.query(`insert into public.plugin_tool_tries as t (user_id,tool) values($1,$2)
      on conflict (user_id,tool) do update set tries=case when ${fresh} then least(t.tries+1,$4) else 1 end,
      window_start=case when ${fresh} then t.window_start else now() end returning tries`, [id(actor), tool, seconds, count + 1])).rows[0];
 if (tries > count) fail('RATE_LIMITED', 429, message);
}
