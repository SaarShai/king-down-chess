/** Test-only moderation queue over src/online/safety.ts (report part 01, section 8.2).
 * KINGDOWN_ADMIN_DATABASE_URL names the admin connection; it is not an argument, so no password shows in a process list.
 *
 *   npm run mod -- list                                  open reports, child safety first
 *   npm run mod -- show <report>                         one report and the player's earlier actions
 *   npm run mod -- act <report> warning|hide|none --facts "…" --rule "…"
 *   npm run mod -- act <report> rename --handle <new> --facts "…" --rule "…"
 *   npm run mod -- act <report> suspension --days <n> --facts "…" --rule "…"
 *   npm run mod -- appeal <action> open|upheld|reversed --note "…"
 *   npm run mod -- hold <report> --nca <reference> [--days 365]
 */
import { parseArgs } from 'node:util';
import pg from 'pg';
import { PostgresMatchStore } from '../src/match/store';
import { CONTROLS, SafetyService } from '../src/online/safety';
import { testDatabase } from './plugin-db-config.mjs';

const { positionals: [command, first, second], values } = parseArgs({ allowPositionals: true, options: Object.fromEntries(
  ['facts', 'rule', 'days', 'handle', 'note', 'nca'].map(name => [name, { type: 'string' as const }])) });
const url = process.env.KINGDOWN_ADMIN_DATABASE_URL;
if (!url) { console.error('Set KINGDOWN_ADMIN_DATABASE_URL to the admin database connection.'); process.exit(2); }
testDatabase(url);
const pool = new pg.Pool({ connectionString: url, max: 1 }), safety = new SafetyService(new PostgresMatchStore(pool));
const days = values.days === undefined ? undefined : Number(values.days);
const commands: Record<string, () => Promise<unknown>> = {
  list: () => safety.queue(),
  show: () => safety.show(Number(first)),
  act: () => safety.act(Number(first), { action: second, facts: values.facts, rule: values.rule, days, handle: values.handle }),
  appeal: () => safety.appeal(Number(first), { status: second, note: values.note }),
  hold: () => safety.hold(Number(first), { nca_reference: values.nca, days }),
};
try {
  if (!commands[command]) throw new Error('Commands: list, show, act, appeal, hold. The top of tools/mod.ts shows each one.');
  // JSON escapes the C0 controls in text and this the rest (DEL, C1, bidi), so no text in a report can change the terminal.
  // A raw newline is only the layout of the JSON.
  console.log(JSON.stringify(await commands[command](), null, 1)?.replace(new RegExp(`[${CONTROLS}]`, 'gu'), c => c === '\n' ? c : `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`) ?? 'Done.');
} catch (error) {
  console.error(error instanceof Error ? `${'code' in error ? `${error.code}: ` : ''}${error.message}` : error);
  process.exitCode = 1;
} finally { await pool.end(); }
