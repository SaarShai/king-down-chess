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

test('the policy names the online control as Settings shows it, says the default applies, and names OpenAI for the parked app', () => {
 const label = readFileSync('src/plugin/index.html', 'utf8').match(/<legend>(Who sees when you are online)<\/legend>/)![1];
 const html = readFileSync('src/plugin/index.html', 'utf8') + readFileSync('src/account-game/hall.ts', 'utf8');
 expect(html.match(new RegExp(`Symbols only, Show threats, ${label}\\.`, 'g'))).toHaveLength(1);
 expect(text).toContain(`${label} has three choices: Everyone, Friends only and Nobody`);
 expect(text).toContain('Friends only is the default: only a player who follows you and whom you follow gets your time');
 expect(text).toContain('Nobody hides it from all opponents');
 const limit = 'King Down has no way to follow a player yet, so Friends only shows your time to nobody for now.';
 for (const source of [text, html, readFileSync('docs/submission/review-notes.md', 'utf8')]) expect(source).toContain(limit);
 expect(text).not.toContain('off by default');
 expect(text).toContain('the default applies, and no setting stops it');
 // The ChatGPT app is parked (tools/chatgpt-plugin.mjs): the policy says that it is closed and what OpenAI received.
 expect(text).toContain('That app is closed, and King Down sends no data to OpenAI now');
 expect(text).toContain('OpenAI received what the app sent to ChatGPT');
});

test('the policy names each try counter that the server keeps for an account', () => {
 const migrations = readdirSync('supabase/migrations').map(file => readFileSync(`supabase/migrations/${file}`, 'utf8')).join('\n');
 // A new counter fails here: add it to the list in public/privacy.html, then here.
 expect([...migrations.matchAll(/create table if not exists public\.(\w+_tries)/g)].map(match => match[1]).sort()).toEqual(['invite_code_tries', 'plugin_tool_tries']);
 expect(text).toContain('how many invitation codes you tried in the last hour');
 // The website API uses the same counter (src/api/http.ts toolTry).
 expect(text).toContain('how many new games, computer turns and reports you asked for in the last minute or hour');
});

test('the policy mentions ChatGPT only in the note about the closed app', () => {
 const outside = policy.replace(/<p id="chatgpt-app">[\s\S]*?<\/p>/, '');
 expect(outside).not.toMatch(/ChatGPT|OpenAI/);
 expect(text).toContain('The daily job deletes the record of which game a ChatGPT board showed after 7 days');
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
 expect([...new Set(kinds)].sort()).toEqual(['appeal', 'moderation']);
 // The policy also covers turn alerts already stored before the writer was removed.
 expect(text).toContain('alerts about your games against other players (that it is your move), and notices about an action on a report or about an appeal');
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

test('the policy names stored relations, the block control, its effects and the undo path', () => {
 expect(text).toContain('the players you follow and block');
 expect(text).toContain('open Menu and select Block player');
 expect(text).toContain('Confirm to end follows both ways, stop matches through Find and joins to open games, and hide their messages');
 expect(text).toContain('Your current game continues');
 expect(text).toContain('A block also stops new rematch offers and accepts');
 expect(text).toContain('The end card has Block player after a game ends');
 expect(text).toContain('The same Menu has Unblock player');
 expect(text).toContain('Unblock does not restore follows');
 expect(text).toContain('Profile also lists blocked players, with Unblock for each player');
});


test('the policy keeps the first-party fault disclosure and its 30-day period', () => {
 const paragraph = policy.match(/<p id="fault-reports">([\s\S]*?)<\/p>/)?.[1];
 expect(paragraph).toBeDefined();
 expect(readFileSync('docs/submission/privacy-additions.md', 'utf8')).toContain(`<p id="fault-reports">${paragraph}</p>`);
 for (const words of ['To find and fix faults', 'fault type and name', 'private values removed', '300 characters', 'No code location is sent or stored', 'without code file locations or browser details', 'route path with IDs removed', 'build commit', 'browser family and major version', 'phone or desktop', 'fault group code', 'first and last times', 'Supabase for 30 days', 'not linked to your account', 'no account number, IP address, full browser string, moves, player messages or game IDs', 'no URL query or fragment']) expect(paragraph).toContain(words);
 expect(policy.indexOf('id="fault-reports"')).toBeGreaterThan(policy.indexOf('Vercel keeps them for 1 day'));
 expect(readFileSync('src/diagnostics/server.ts', 'utf8')).toContain("interval '30 days'");
 expect(readFileSync('src/online/jobs.ts', 'utf8')).toContain("client_errors where last_seen<now()-interval '30 days'");
});
