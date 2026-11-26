// Change guards for a new database migration (change rehearsals of 2026-11-25, kind "new migration").
// Each place that names the migrations follows the folder supabase/migrations. Each failure names the place to change.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';

const root = join(import.meta.dirname, '../..');
const read = (file: string) => readFileSync(join(root, file), 'utf8');
const files = readdirSync(join(root, 'supabase/migrations')).filter(name => /^\d{4}_.*\.sql$/.test(name)).sort();
const last = files.at(-1)!.slice(0, 4);
const listed = (file: string) => [...read(file).matchAll(/'(\d{4}_[\w-]+\.sql)'/g)].map(match => match[1]);

it.each([
  ['tools/plugin-db/bootstrap-test.mjs', files],
  ['tools/plugin-db/migrate.ts', files.slice(1)],
])('lists each migration in %s', (file, expected) => {
  expect(listed(file), `${file}: add each new migration file at the end of its migration list`).toEqual(expected);
});

it.each([
  ['tools/plugin-db/bootstrap-test.mjs', `(migrations 0001-${last})`],
  ['tools/plugin-db/migrate.ts', `Server migrations 0002-${last} applied`],
  ['supabase/README.md', `\`npm run plugin:db:init-test\` applies 0001–${last} twice`],
])('names the last migration in the range of %s', (file, text) => {
  expect(read(file), `${file}: change the range to end at ${last}: "${text}"`).toContain(text);
});

// The release steps of a migration from 0020 on tell the owner when to apply it. 0026 has one ordered list for
// production that starts with "do the same steps on staging first", so it has no separate staging line.
const noStagingLine: Record<string, string> = { '0026': 'its production steps say "do the same steps on staging first"' };
const released = files.map(name => name.slice(0, 4)).filter(number => number >= '0020');

it.each(released)('gives migration %s its apply lines in supabase/README.md', number => {
  const readme = read('supabase/README.md');
  const stages = number in noStagingLine ? ['production'] : ['staging', 'production'];
  for (const stage of stages) {
    expect(readme, `supabase/README.md: migration ${number} has no ${stage} step; add `
      + `"Apply ${number} on ${stage} before ..." under its section, or add ${number} to noStagingLine in tools/plugin-db/migration-places.docs.test.ts with the reason`).toContain(`Apply ${number} on ${stage} before`);
  }
});

// The other tests here see only the files named NNNN_<name>.sql; a file with another name has no guard.
it('names each migration file NNNN_<name>.sql', () => {
  const wrong = readdirSync(join(root, 'supabase/migrations')).filter(name => !/^\d{4}_\w+\.sql$/.test(name))
    .map(name => `supabase/migrations/${name}: rename it to NNNN_<name>.sql (four digits, an underscore, letters, digits and _)`);
  expect(wrong).toEqual([]);
});

// Each table that a migration makes gets a grant block in plugin-deploy/runtime-role.sql (the server's restricted
// role), or an entry here with the reason that the server does not use it.
const noRuntimeGrant: Record<string, string> = {
  user_data: 'the browser reads and writes it with the publishable key (0001: grants and Row Level Security)',
  mod_actions: "the owner's moderation (tools/mod.ts) uses the admin connection (runtime-role.sql, block of 0008)",
};

it('gives each new table a grant in plugin-deploy/runtime-role.sql', () => {
  const grants = read('plugin-deploy/runtime-role.sql').replace(/--.*$/gm, '');
  const tables = files.flatMap(file => [...read(`supabase/migrations/${file}`).replace(/--.*$/gm, '')
    .matchAll(/create table (?:if not exists )?public\.(\w+)/gi)].map(match => ({ file, table: match[1] })));
  const missed = tables.filter(({ table }) => !(table in noRuntimeGrant) && !new RegExp(`public\\.${table}(?!\\w)`).test(grants))
    .map(({ file, table }) => `supabase/migrations/${file} makes table public.${table}, and plugin-deploy/runtime-role.sql `
      + `grants nothing on it; add a grant block (begin; grant ... on public.${table} to kingdown_plugin_runtime; commit;), `
      + 'or add it to noRuntimeGrant in tools/plugin-db/migration-places.docs.test.ts with the reason');
  expect(missed).toEqual([]);
  const stale = Object.keys(noRuntimeGrant).filter(table => !tables.some(entry => entry.table === table))
    .map(table => `tools/plugin-db/migration-places.docs.test.ts: remove "${table}" from noRuntimeGrant; no migration makes it`);
  expect(stale).toEqual([]);
});
