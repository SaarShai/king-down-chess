// The privacy policy must say what the code does (approval items D9 a, D12 a, D14 a): each cleanup period of the
// daily job, the Settings control by its exact name, OpenAI as a recipient, each kind of stored alert, and what a
// deletion keeps. A changed period, label or alert kind fails here.
import { readdirSync, readFileSync } from 'node:fs';
import { expect, test } from 'vitest';

const policy = readFileSync('public/privacy.html', 'utf8'), text = policy.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ');

test('the policy gives each cleanup period of the daily job', () => {
 const job = readFileSync('src/online/jobs.ts', 'utf8').match(/export async function cleanup[\s\S]*?\n}/)![0];
 const periods = [...new Set([...job.matchAll(/interval '(\d+ (?:days|months))'/g)].map(match => match[1]))].sort();
 expect(periods).toEqual(['12 months', '30 days', '7 days']);
 for (const period of periods) expect(text, period).toContain(`${period}`);
});

test('the policy names the online control as Settings shows it, says the default applies, and names OpenAI', () => {
 const label = readFileSync('src/plugin/index.html', 'utf8').match(/<label>(Show when I am online) <input id="show-online"/)![1];
 expect(text).toContain(`only when ${label} is on in the app's Settings`);
 expect(text).toContain('the default applies, and no setting stops it');
 expect(text).toContain('OpenAI receives what the app sends to ChatGPT');
});

test('the policy names each try counter that the server keeps for an account', () => {
 const migrations = readdirSync('supabase/migrations').map(file => readFileSync(`supabase/migrations/${file}`, 'utf8')).join('\n');
 // A new counter fails here: add it to the list in public/privacy.html, then here.
 expect([...migrations.matchAll(/create table if not exists public\.(\w+_tries)/g)].map(match => match[1]).sort()).toEqual(['invite_code_tries', 'plugin_tool_tries']);
 expect(text).toContain('how many invitation codes you tried in the last hour');
 expect(text).toContain('how many new games, new boards, computer turns and reports you asked for in the ChatGPT app');
});

test('the policy has no placeholder left from the draft', () => {
 expect(policy).not.toMatch(/<[A-Z][A-Z ,."_-]{3,}>/);
 expect(text).not.toContain('can stay after deletion');
});

test('the policy names the alerts and notices that the server stores for an account', () => {
 const code = readdirSync('src', { recursive: true, encoding: 'utf8' }).filter(file => file.endsWith('.ts') && !file.endsWith('.test.ts'))
  .map(file => readFileSync(`src/${file}`, 'utf8')).join('\n');
 const kinds = [...code.matchAll(/insert into public\.notifications\(user_id,kind,payload\) values\(\$1,'(\w+)'|notify\.push\(\{ user_id: [^,]+, kind: '(\w+)'/g)].map(match => match[1] ?? match[2]);
 // A new kind fails here: add it to the list item in public/privacy.html, then here.
 expect([...new Set(kinds)].sort()).toEqual(['appeal', 'moderation', 'reminder', 'turn']);
 expect(text).toContain('alerts about your Daily games (that it is your move, or that a move deadline is near), and notices about an action on a report or about an appeal');
 // A deletion deletes them with the account (on delete cascade).
 expect(readFileSync('supabase/migrations/0006_games.sql', 'utf8')).toMatch(/table if not exists public\.notifications \([^;]*user_id uuid not null references auth\.users \(id\) on delete cascade/);
 expect(text).toContain('badges, alerts and games against the computer');
});

test('the policy says that a deletion keeps the handle in stored games and in records of action', () => {
 expect(readFileSync('supabase/migrations/0006_games.sql', 'utf8')).toContain('handle_at_start text');
 expect(readFileSync('supabase/migrations/0008_accounts_safety.sql', 'utf8')).toContain('alter table public.mod_actions add column if not exists handle text');
 expect(text).toContain('The stored game keeps the handle that you had in that game, but not your account number or your email address');
 expect(text).toContain('After a deletion, it keeps the removed handle, if there is one, but not your account number');
 expect(text).not.toContain('no link to your account');
});
