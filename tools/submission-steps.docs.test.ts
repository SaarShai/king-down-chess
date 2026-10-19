// The owner steps in docs/submission/checklist.md (approval items D8 a, O1) must fit the code and the SQL that they
// drive: the owner's test runs use a test account, only the review address keeps a password sign-in, the old audit
// rows go, and the owner's answers are recorded.
import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';

const checklist = readFileSync('docs/submission/checklist.md', 'utf8');
/** One numbered owner step, with its sub-steps. */
const step = (n: number) => checklist.match(new RegExp(`^${n}\\. \\*\\*[\\s\\S]*?(?=^\\d+\\. \\*\\*|^## )`, 'm'))![0];

test('the owner tests with a test account, so the review account stays as the seed left it', () => {
 for (const n of [3, 5]) expect(step(n), `step ${n}`).toContain('with the test account');
 expect(step(2)).toContain('KINGDOWN_REVIEW_HANDLE=test-player');
 // Each setting that a seed command names is one that the seed reads.
 const seed = readFileSync('tools/plugin-db/seed-review.ts', 'utf8'), names = [...step(2).matchAll(/\b((?:KINGDOWN|PLUGIN)_[A-Z_]+)=/g)].map(match => match[1]);
 expect(new Set(names)).toEqual(new Set(['PLUGIN_DATABASE_URL', 'KINGDOWN_REVIEW_EMAIL', 'KINGDOWN_REVIEW_OPPONENT_EMAIL', 'KINGDOWN_REVIEW_HANDLE']));
 for (const name of names) expect(seed, name).toContain(`${name}:`);
});

test('at the upload, only the review address can sign in with a password', () => {
 expect(step(2)).toContain("delete from kingdown_auth.password_accounts where email = '<opponent address>';");
 expect(step(7)).toContain("delete from kingdown_auth.password_accounts where email = '<test address>';");
 expect(readFileSync('plugin-deploy/review-signup-hook.sql', 'utf8')).toContain("delete from kingdown_auth.password_accounts where email <> 'YOUR-REVIEW-ADDRESS';");
 // Each removed address is signed out on every device at once (its refresh tokens go with its sessions).
 const signOut = (address: string) => `delete from auth.sessions where user_id in (select id from auth.users where lower(email) = '${address}');`;
 expect(step(2)).toContain(signOut('<opponent address>'));
 expect(step(7)).toContain(signOut('<test address>'));
 expect(readFileSync('plugin-deploy/review-signup-hook.sql', 'utf8')).toContain("delete from auth.sessions where user_id in (select id from auth.users where lower(email) in ('OPPONENT', 'TEST'));");
 // A refresh of a password session gets the same check (the amr claim keeps the sign-in method).
 expect(readFileSync('plugin-deploy/oauth-audience-hook.sql', 'utf8')).toContain(`claims -> 'amr' @> '[{"method": "password"}]'`);
 // The list limits password sessions too, not only new accounts (tools/plugin-db/review-signup-hook.db.test.ts).
 expect(readFileSync('plugin-deploy/oauth-audience-hook.sql', 'utf8')).toMatch(/authentication_method' = 'password'[\s\S]*kingdown_auth\.password_accounts/);
 expect(step(2)).toContain('plugin-deploy/oauth-audience-hook.sql');
});

test('the owner deletes the sign-in audit rows that Auth wrote before the switch-off', () => {
 expect(step(6)).toContain('delete from auth.audit_log_entries;');
 expect(readFileSync('docs/submission/privacy-additions.md', 'utf8')).toContain('delete from auth.audit_log_entries;');
});

test('the last owner answer of 2026-10-16 on the online setting is recorded', () => {
 const question = checklist.slice(checklist.indexOf('For the owner')).split('\n').find(line => line.includes('Friends only'))!;
 expect(question).toMatch(/^\d+\. Closed: keep the friends-only default .*Part 18-a builds it.*\(owner, 2026-10-16, after the review; .*\)\.$/);
 expect(readFileSync('docs/submission/privacy-additions.md', 'utf8')).not.toContain('Choice for the owner');
});

test('row 52 puts the exact token through a pull request before publish and checks the live result', () => {
 const row = checklist.split('\n').find(line => line.startsWith('| 52 |'))!;
 expect(row).toContain('only the token, no final newline');
 expect(row).toMatch(/public\/\.well-known\/openai-apps-challenge.*on a branch.*pull request into main.*tools\/deploy\.sh --publish.*live-check pass line.*\.well-known\/openai-apps-challenge/);
});

test('the checklist keeps the completed checks and its counts match the rows', () => {
 const rows = checklist.split('\n').filter(line => /^\| \d+ \|/.test(line) && /\| (met|drafted|owner|deploy) \|/.test(line));
 expect(rows).toHaveLength(60);
 for (const n of [29, 31, 32, 37, 56]) expect(rows.find(line => line.startsWith(`| ${n} |`))).toContain('| met |');
 const counts = ['met', 'drafted', 'owner', 'deploy'].map(status => rows.filter(line => line.includes(`| ${status} |`)).length);
 expect(checklist).toContain(`| ${counts.join(' | ')} | ${rows.length} |`);
});

test('the chat privacy evidence cites tool inputs without a stale consent quote', () => {
 const evidence = readFileSync('docs/submission/privacy-additions.md', 'utf8').split('## 3. OpenAI as a recipient')[1].split('## 4.')[0];
 expect(evidence).toContain('The MCP server receives only tool arguments.');
 expect(evidence).toContain('`createPluginServer()` in `src/plugin/server.ts`');
 expect(evidence).not.toContain('cannot read the surrounding chat');
});

test('case N2 bases the other-site refusal on tool inputs', () => {
 const row = readFileSync('docs/submission/test-cases.md', 'utf8').split('\n').find(line => line.startsWith('| N2 |'))!;
 expect(row).toContain('`src/plugin/server.ts` input schemas');
 expect(row).not.toContain('openWorldHint');
});

test('the deploy steps record the invite secret variable name without a value', () => {
 const row = checklist.split('\n').find(line => line.startsWith('| 51 |'))!;
 expect(row).toContain('`KINGDOWN_INTERNAL_SECRET`');
 expect(row).toContain('name only, never a value');
 const ownerSteps = readFileSync('docs/specs/chatgpt-mvp/release/OWNER-STEPS.md', 'utf8');
 expect(ownerSteps).toContain('KINGDOWN_INTERNAL_SECRET');
 expect(ownerSteps).not.toMatch(/KINGDOWN_INTERNAL_SECRET=/);
});
