// Installation guard (dev-environment/01). `npm test` fails when node_modules is a link and the
// lock file differs from the lock file of the checkout that owns the linked packages. `wt add`
// links only to the main checkout's packages, so for its links that is the main checkout's lock
// file. Such a worktree must get its own installation: an `npm ci` through the link would empty
// the other checkout's folder. INSTALL_GUARD_CHECKOUT names another checkout to examine; the
// worktree script test uses it.
import { lstatSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

const checkout = resolve(process.env.INSTALL_GUARD_CHECKOUT ?? fileURLToPath(new URL('..', import.meta.url)));

const read = (path: string) => { try { return readFileSync(path); } catch { return null; } };

/** The fault text, or '' when the packages fit the lock file. */
function fault(): string {
  const link = join(checkout, 'node_modules');
  try { if (!lstatSync(link).isSymbolicLink()) return ''; } catch { return ''; }
  let owner = '(a missing folder)';
  try { owner = dirname(realpathSync(link)); } catch { /* a broken link: no lock file to compare */ }
  const own = read(join(checkout, 'package-lock.json'));
  const linked = read(join(owner, 'package-lock.json'));
  if (own && linked && own.equals(linked)) return '';
  return `node_modules links the packages of ${owner}, but package-lock.json differs from that checkout's.\n`
    + `An npm ci or npm install through the link would change those packages. Give this worktree its own installation:\n`
    + `  wt add ${checkout}   (the script is tools/wt.sh)`;
}

it('node_modules is no link to packages of a different lock file', () => {
  const text = fault();
  expect(text, text).toBe('');
});
