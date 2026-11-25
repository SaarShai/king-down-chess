/**
 * A synchronous child process in a test needs its own timeout below the test limit. Without one, a
 * hung child holds the test worker past the vitest limit, `npm test` does not end, and the shared
 * machine lease stays taken (2026-10-02).
 *
 * This test reads each *.test.ts file under src/, tools/ and .claude/hooks/ and counts the
 * execFileSync, spawnSync and execSync calls with no `timeout` in their arguments. A file can keep
 * the count frozen in UNBOUNDED; it cannot go up, and a new file starts at 0. When a file gets its
 * timeouts, lower its count here (the list only shrinks).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(import.meta.dirname, '..');

/** Calls with no timeout today, per file. Lower a count when you add timeouts; never raise it. */
const UNBOUNDED: Record<string, number> = {
  '.claude/hooks/session-facts.test.ts': 1,
  '.claude/hooks/tool-gate.test.ts': 1,
  'tools/anim/promote-painted-moves.test.ts': 2,
  'tools/anim/recolor.test.ts': 6,
  'tools/anim/wrap-up.test.ts': 1,
  'tools/animation-bank.test.ts': 2,
  'tools/animation-coverage.test.ts': 1,
  'tools/board-grain.test.ts': 1,
  'tools/character-runtime-package.test.ts': 5,
  'tools/child-timeouts.test.ts': 1, // a parser artifact: the stripper leaves one call shape from the sample text
  'tools/ci-green-tree.test.ts': 2,
  'tools/deploy-plugin-env.test.ts': 1,
  'tools/engines.test.ts': 4,
  'tools/lib/checks.test.ts': 1,
  'tools/lib/lock.test.ts': 1,
  'tools/merge-on-green.test.ts': 1,
  'tools/model-names.docs.test.ts': 1,
  'tools/offline-build.test.ts': 3,
  'tools/plugin-server-build.test.ts': 2,
  'tools/save-secret.test.ts': 2,
  'tools/steering.docs.test.ts': 1,
  'tools/test-lock.test.ts': 4,
};

/** Each *.test.ts path under `dir`, relative to the repository, without node_modules or dist. */
function testFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(join(root, dir), { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) { if (!['node_modules', 'dist', '.git'].includes(entry.name)) out.push(...testFiles(path)); }
    else if (entry.name.endsWith('.test.ts')) out.push(path);
  }
  return out;
}

/** The synchronous child calls in `text` with no timeout; comments and strings do not count. */
function unboundedCalls(text: string): string[] {
  const source = text.replace(/\/\/[^\n]*|\/\*.*?\*\/|(['"`])(?:\\.|(?!\1).)*\1/gs, '');
  // A call with its arguments, up to three levels of nested parentheses.
  const calls = source.match(/\b(?:execFileSync|spawnSync|execSync)\((?:[^()]|\((?:[^()]|\([^()]*\))*\))*\)/g) ?? [];
  return calls.filter(call => !/\btimeout\b/.test(call));
}

describe('synchronous child limits in every test file', () => {
  it('counts a call with no timeout, and not one in a comment or a string', () => {
    expect(unboundedCalls([
      "// spawnSync('node');",
      "const a = spawnSync('node', ['-e', 'x'], { encoding: 'utf8' });",
      "const b = execSync(`ls ${join('a', 'b')}`, { timeout: 2_000 });",
      "const c = execFileSync(process.execPath, [resolve('x')], { stdio: 'pipe' });",
      "const d = spawnSync('git', args, { timeout });",
    ].join('\n'))).toHaveLength(2);
  });

  it('no test file adds a synchronous child call without a timeout', () => {
    const files = ['src', 'tools', '.claude/hooks'].flatMap(testFiles);
    expect(files.length).toBeGreaterThan(100);
    const grown: string[] = [], shrunk: string[] = [];
    for (const file of files) {
      const found = unboundedCalls(readFileSync(join(root, file), 'utf8')).length, allowed = UNBOUNDED[file] ?? 0;
      if (found > allowed) grown.push(`${file}: ${found - allowed} execFileSync/spawnSync/execSync call(s) without a timeout; add { timeout: <ms below the test limit> }`);
      if (found < allowed) shrunk.push(`${file}: ${found} unbounded call(s) now; lower its UNBOUNDED count in tools/child-timeouts-ratchet.test.ts to ${found}`);
    }
    for (const file of Object.keys(UNBOUNDED)) if (!files.includes(file)) shrunk.push(`${file}: no such test file; remove it from UNBOUNDED`);
    expect(grown).toEqual([]);
    expect(shrunk).toEqual([]);
  });
});
