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

test('the MVP helper and routes match the cron source and the internal server header', () => {
 const read = (file: string) => readFileSync(file, 'utf8').replace(/--[^\n]*/g, '');
 const sql = read('docs/specs/chatgpt-mvp/release/cron-mvp.sql'), source = read('supabase/ops/cron.sql');
 const helper = (text: string) => text.match(/create or replace function kingdown_jobs\.call\(path text\)[\s\S]*?revoke all on function kingdown_jobs\.call\(text\)[^;]*;/)![0];
 expect(helper(sql)).toBe(helper(source));
 expect(sql).toContain("url := 'https://kingdown.dev' || path");
 expect(sql).toContain("name = 'kingdown_internal_secret'");
 const server = readFileSync('src/api/http.ts', 'utf8');
 const header = server.match(/req\.headers\['(x-kingdown-internal)'\]/)![1];
 expect(sql).toContain(`'${header}'`);
 const schedules = (text: string) => [...text.matchAll(/select cron\.schedule\([^;]+;/g)].map(match => match[0]);
 expect(schedules(sql)).toEqual(schedules(source));
 for (const path of ['/internal/tick', '/internal/daily']) expect(server).toContain(`'${path}'`);
});
