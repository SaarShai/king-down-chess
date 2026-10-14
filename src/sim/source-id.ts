import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** The code that decides how a stored game plays back. A `weights.ts` retrain changes this on purpose. */
const SRC_ROOTS = ['src/rules', 'src/ai', 'src/sim', 'src/workshop']; // src/rules reads the Workshop's design model (ticket 16)

function filesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...filesUnder(p));
    else if (p.endsWith('.ts')) out.push(p);
  }
  return out;
}

export function sourceId(root = '.'): string {
  const h = createHash('sha1');
  for (const dir of SRC_ROOTS) {
    for (const f of filesUnder(join(root, dir))) {
      h.update(f.slice(root.length)); // relative path, so the hash does not depend on where the repo sits
      h.update('\0');
      h.update(readFileSync(f));
      h.update('\0');
    }
  }
  return h.digest('hex').slice(0, 12);
}

