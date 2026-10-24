import type { IncomingMessage } from 'node:http';
import type { Pool } from 'pg';
import { z } from 'zod';
import { BUILD_ID, ERROR_NAMES, errorFingerprint, errorName, errorRoute, MAX_ERROR_BODY, errorMessage, type ClientErrorReport, type ErrorReport } from './data';

const reportSchema = z.strictObject({
 kind: z.enum(['error', 'rejection', 'worker']), name: z.enum(ERROR_NAMES), message: z.string().max(300),
 route: z.string().max(120).refine(value => errorRoute(value) === value), build: z.string().regex(BUILD_ID),
 browser: z.string().regex(/^(?:(?:Safari|Chrome|Firefox|Edge|Opera) [1-9]\d{0,2}|Other)$/),
 size: z.enum(['phone', 'desktop']), fingerprint: z.string().regex(/^[a-f0-9]{16}$/),
});
const storedReportSchema = reportSchema.extend({
 kind: z.enum(['error', 'rejection', 'worker', 'server']),
 browser: reportSchema.shape.browser.optional(), size: reportSchema.shape.size.optional(),
});
export type ErrorWriter = (report: ErrorReport) => Promise<void>;

/** No IP keys. The fixed window and in-flight bound apply to the whole function instance. */
export function errorAdmission(): () => boolean {
 let start = 0, count = 0;
 return () => {
  const now = Date.now();
  if (now - start >= 60_000) { start = now; count = 0; }
  return count++ < 60;
 };
}

export async function readClientError(req: IncomingMessage): Promise<ClientErrorReport | undefined> {
 if (Number(req.headers['content-length']) > MAX_ERROR_BODY) return;
 let bytes = 0;
 const chunks: Buffer[] = [];
 for await (const chunk of req.iterator({ destroyOnReturn: false })) {
  if ((bytes += chunk.length) > MAX_ERROR_BODY) return;
  chunks.push(Buffer.from(chunk));
 }
 const parsed = reportSchema.safeParse(JSON.parse(Buffer.concat(chunks).toString('utf8')));
 if (!parsed.success) return;
 const report = parsed.data;
 report.message = errorMessage(report.message);
 const fingerprint = errorFingerprint(report.name, report.message, report.route, report.build);
 if (report.fingerprint !== fingerprint) return;
 report.fingerprint = fingerprint;
 return report;
}

/** Keep one sample and bounded sets for the report. Never expose a write failure to the caller. */
export function createErrorWriter(pool: Pool): ErrorWriter {
 const admit = errorAdmission();
 let active = 0;
 return async report => {
  if (active >= 2 || pool.idleCount <= pool.waitingCount && pool.totalCount >= (pool.options.max ?? 10) || !admit()) return;
  if (!storedReportSchema.safeParse(report).success) return;
  active++;
  let client;
  try {
   client = await pool.connect();
   await client.query('begin');
   await client.query("set local statement_timeout = '500ms'; set local lock_timeout = '500ms'");
   // An index bounds the search; each write deletes at most 100 expired rows.
   const cleanup = { text: `delete from public.client_errors where id in
    (select id from public.client_errors where last_seen < now()-interval '30 days' order by last_seen limit 100 for update skip locked)` };
   await client.query(cleanup);
   const insert = { text: `insert into public.client_errors
    (fingerprint,build,hour,kind,name,message,routes,browsers,size_classes)
    values($1,$2,date_trunc('hour',now()),$3,$4,$5,$6,$7,$8)
    on conflict(fingerprint,build,hour) do update set
     count=client_errors.count+1, last_seen=now(),
     routes=array(select distinct x from unnest(client_errors.routes || excluded.routes) x order by x limit 20),
     browsers=array(select distinct x from unnest(client_errors.browsers || excluded.browsers) x order by x limit 20),
     size_classes=array(select distinct x from unnest(client_errors.size_classes || excluded.size_classes) x order by x limit 2)`,
    values: [errorFingerprint(report.name, errorMessage(report.message), report.route, report.build), report.build, report.kind, report.name, errorMessage(report.message),
     [report.route], report.browser ? [report.browser] : [], report.size ? [report.size] : []] };
   await client.query(insert);
   await client.query('commit');
  } catch {
   if (client) try { await client.query('rollback'); } catch { client.release(true); client = undefined; }
  } finally { client?.release(); active--; }
 };
}

export async function recordServerError(write: ErrorWriter | undefined, error: unknown, route: string, build: string): Promise<void> {
 try {
  if (!write || !BUILD_ID.test(build)) return;
  const name = errorName(error instanceof Error ? error.name : undefined);
  const message = errorMessage(error instanceof Error ? error.message : 'Non-Error server fault');
  const path = errorRoute(route);
  await write({ kind: 'server', name, message, route: path, build, fingerprint: errorFingerprint(name, message, path, build) });
 } catch { /* The HTTP response must stay the same. */ }
}
