// The owner's release steps (supabase/README.md) name the last migration that the server needs and the last block of
// the runtime grants. A ticket that adds a migration or a role block changes those steps in the same commit.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';

const read = (file: string) => readFileSync(join(import.meta.dirname, '../..', file), 'utf8');

it('names the last server migration and the last role block in the release steps', () => {
  const last = [...read('tools/plugin-db/migrate.ts').matchAll(/'(\d{4})_\w+\.sql'/g)].at(-1)![1];
  const blocks = read('plugin-deploy/runtime-role.sql').match(/^begin;$/gm)!.length;
  const readme = read('supabase/README.md');
  expect(readme).toContain(`\`npm run plugin:db:migrate\` applies 0002–${last}`);
  expect(readme).toContain(`apply 0005–${last}, then blocks 3–${blocks} of \`plugin-deploy/runtime-role.sql\``);
  expect(readme).toContain(`- \`${last}_`);
});

it.each(['supabase/README.md', 'docs/specs/test-guards/issues/02-deletion-grace-utc.md'])(
  'requires 0020 before a staging deploy and production release in %s', file => {
    const text = read(file);
    expect(text).toContain('Apply 0020 on staging before a deploy that depends on it.');
    expect(text).toContain('Apply 0020 on production before the release that carries it.');
  },
);

it('keeps the migration lists ordered with one number per migration', () => {
  const files = readdirSync('supabase/migrations').filter(name => /^\d{4}_.*\.sql$/.test(name)).sort();
  expect(new Set(files.map(name => name.slice(0, 4))).size).toBe(files.length);
  const listed = (file: string) => [...read(file).matchAll(/'(\d{4}_\w+\.sql)'/g)].map(match => match[1]);
  expect(listed('tools/plugin-db/bootstrap-test.mjs')).toEqual(files);
  expect(listed('tools/plugin-db/migrate.ts')).toEqual(files.slice(1));
  expect(files.slice(-2)).toEqual(['0019_client_errors.sql', '0020_deletion_utc.sql']);
});
