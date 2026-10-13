import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Hash engine inputs, including local imports, without a Git or working-directory dependency. */
export function studySource(root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')): string {
  const paths = new Set<string>();
  function add(path: string): void {
    if (paths.has(path) || path.endsWith('.test.ts')) return;
    const full = resolve(root, path);
    const source = readFileSync(full, 'utf8');
    paths.add(path);
    if (!path.endsWith('.ts')) return;
    for (const match of source.matchAll(/(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g)) {
      const base = resolve(dirname(full), match[1]);
      const found = [base, `${base}.ts`, resolve(base, 'index.ts')].find(candidate => existsSync(candidate) && candidate.endsWith('.ts'));
      if (!found) throw new Error(`Cannot fingerprint local import ${match[1]} in ${path}.`);
      add(relative(root, found).split('\\').join('/'));
    }
  }
  function walk(path: string): void {
    for (const entry of readdirSync(resolve(root, path), { withFileTypes: true })) {
      const next = `${path}/${entry.name}`;
      if (entry.isDirectory()) walk(next);
      else if (next.endsWith('.ts')) add(next);
    }
  }
  walk('src/rules');
  walk('src/ai');
  for (const path of ['src/game.ts', 'src/workshop/model.ts', 'src/study/model.ts', 'src/study/session.ts', 'src/study/check.ts', 'package-lock.json']) add(path);
  const hash = createHash('sha256');
  for (const path of [...paths].sort()) hash.update(path).update('\0').update(readFileSync(resolve(root, path))).update('\0');
  return `sha256:${hash.digest('hex')}`;
}
