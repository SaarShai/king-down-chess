import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';

test('the private release schedules only tick, daily and history, and removes old alert jobs', () => {
 const sql = readFileSync('docs/specs/chatgpt-mvp/release/cron-mvp.sql', 'utf8').replace(/--[^\n]*/g, '');
 const jobs = [...sql.matchAll(/\bcron\.schedule\s*\(\s*'([^']+)'/gi)].map(match => match[1]).sort();
 expect(jobs).toEqual(['kingdown-cron-history', 'kingdown-daily', 'kingdown-tick']);
 expect(sql.match(/\bcron\.schedule\s*\(/gi)).toHaveLength(3);
 expect(sql).not.toMatch(/\/internal\/(?:outbox|reminders)/i);
 expect(sql).toMatch(/cron\.unschedule\(jobid\)\s+from cron\.job\s+where jobname in \('kingdown-outbox', 'kingdown-reminders'\)/i);
});
