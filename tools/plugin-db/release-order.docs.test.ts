// The owner's release steps (supabase/README.md) name the last migration that the server needs and the last block of
// the runtime grants. A ticket that adds a migration or a role block changes those steps in the same commit.
import { readFileSync } from 'node:fs';
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
