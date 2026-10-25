/** Read fault counts through the owner's database connection. Never print that connection. */
import { pathToFileURL } from 'node:url';
import pg from 'pg';

type FaultRow = {
 fingerprint: string; count: string; first_seen: Date; last_seen: Date; build: string; kind: string;
 name: string; message: string; routes: string[]; browsers: string[]; size_classes: string[];
};
export function formatErrorReport(rows: FaultRow[], limitedAt?: Date): string {
 const groups = new Map<string, { count: bigint; first: Date; last: Date; builds: Set<string>; routes: Set<string>; browsers: Set<string>; sizes: Set<string>; sample: FaultRow }>();
 for (const row of rows) {
  let group = groups.get(row.fingerprint);
  if (!group) {
   group = { count: 0n, first: row.first_seen, last: row.last_seen, builds: new Set(), routes: new Set(), browsers: new Set(), sizes: new Set(), sample: row };
   groups.set(row.fingerprint, group);
  }
  group.count += BigInt(row.count);
  if (row.first_seen < group.first) group.first = row.first_seen;
  if (row.last_seen > group.last) { group.last = row.last_seen; group.sample = row; }
  group.builds.add(row.build);
  for (const route of row.routes) group.routes.add(route);
  for (const browser of row.browsers) group.browsers.add(browser);
  for (const size of row.size_classes) group.sizes.add(size);
 }
 const report = [...groups.entries()].sort((a, b) => b[1].last.getTime() - a[1].last.getTime()).map(([fingerprint, group]) => [
  `${fingerprint} | count ${group.count} | ${group.sample.kind}`,
  `First: ${group.first.toISOString()} | Last: ${group.last.toISOString()}`,
  `Builds: ${[...group.builds].sort().join(', ')}`, `Routes: ${[...group.routes].sort().join(', ')}`,
  `Browsers: ${[...group.browsers].sort().join(', ') || 'server'} | Size: ${[...group.sizes].sort().join(', ') || 'server'}`,
  `${group.sample.name}: ${group.sample.message}`,
 ].join('\n')).join('\n\n') || 'No fault reports.';
 return limitedAt ? `Hourly group limit: ${limitedAt.toISOString()}. Later groups can be absent.\n\n${report}` : report;
}
export function sinceDays(args: string[]): number {
 if (!args.length) return 30;
 if (args.length !== 2 || args[0] !== '--since' || !/^(?:[1-9]|[12]\d|30)$/.test(args[1])) throw new Error('Use errors:report [--since <1 to 30 days>]');
 return Number(args[1]);
}
export async function reportErrors(args = process.argv.slice(2)): Promise<void> {
 const days = sinceDays(args), connectionString = process.env.PLUGIN_DATABASE_URL;
 if (!connectionString) throw new Error('Set PLUGIN_DATABASE_URL to read fault reports');
 const pool = new pg.Pool({ connectionString, max: 1, connectionTimeoutMillis: 5000, statement_timeout: 10_000 });
 try {
  const { rows } = await pool.query<FaultRow>(`select fingerprint,count,first_seen,last_seen,build,kind,name,message,routes,browsers,size_classes
   from public.client_errors where last_seen >= now()-($1::int * interval '24 hours') order by last_seen desc`, [days]);
  const limit = await pool.query<{ limited_at: Date }>(`select limited_at from public.client_error_budget
   where limited_at >= now()-($1::int * interval '24 hours')`, [days]);
  console.log(formatErrorReport(rows, limit.rows[0]?.limited_at));
 } finally { await pool.end(); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
 try { await reportErrors(); }
 catch { console.error('Could not read fault reports. Check PLUGIN_DATABASE_URL and --since (1 to 30 days).'); process.exitCode = 1; }
}
