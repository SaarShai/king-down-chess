// Change guards for a new database migration (change rehearsals of 2026-11-25, kind "new migration").
// Each place that names the migrations follows the folder supabase/migrations. Each failure names the place to change.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';

const root = join(import.meta.dirname, '../..');
const read = (file: string) => readFileSync(join(root, file), 'utf8');
const files = readdirSync(join(root, 'supabase/migrations')).filter(name => /^\d{4}_.*\.sql$/.test(name)).sort();
const last = files.at(-1)!.slice(0, 4);
const listed = (file: string) => [...read(file).matchAll(/'(\d{4}_\w+\.sql)'/g)].map(match => match[1]);

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
      + `"Apply ${number} on ${stage} before ..." under its section`).toContain(`Apply ${number} on ${stage} before`);
  }
});
