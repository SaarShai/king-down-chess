// Repo gate: the git hooks call it to refuse a change that must not go into git.
//
// Interface (fixed by checks-and-hooks/02; the git hooks call the gate through npm):
//   npm run gate -- staged
//     From pre-commit. The gate checks the staged change: the index that GIT_INDEX_FILE names.
//     It reads only added and changed files, so a file that the change does not touch passes.
//     stdin is empty.
//   npm run gate -- push <remote> <url>
//     From pre-push. stdin holds git's pre-push lines:
//     <local ref> <local object name> <remote ref> <remote object name>
//     This mode applies no rule yet; secrets-and-public-gates/05 adds the rules.
//   Environment: the GIT_ variables that git sets for the hook stay. The current folder is the
//   top folder of the work tree.
//   Exit codes: 0 passes. Any other exit refuses the commit or the push. A missing `gate` script
//   in package.json also refuses. The hook shows the gate's stderr, so write each reason there.
//   The gate gives 1 when a rule refuses and 2 for a gate fault (bad input, git cannot read an
//   object, a bad allowlist line). Each fault is one line on stderr:
//     gate: <rule>: <short commit or "index">: <path>: <reason>
//   Exit 0 gives no output.
//
// Rules (one module each in tools/gate/):
//   size: a file over 2,000,000 bytes fails, unless tools/gate/size-allowlist.txt holds its path
//         with a reason.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { GateFault } from './gate/fault.mjs';
import { ALLOWLIST, readAllowlist, sizeFaults } from './gate/size.mjs';

/** Runs git with the hook's environment and gives its stdout. A failure is a gate fault. */
const git = (/** @type {string[]} */ args, input = '') => {
  const result = spawnSync('git', args, { input, encoding: 'utf8', maxBuffer: 1 << 30 });
  if (result.error) throw new GateFault(`cannot start git: ${result.error.message}`);
  if (result.status !== 0) throw new GateFault(`git ${args[0]} failed: ${result.stderr.trim().split('\n')[0]}`);
  return result.stdout;
};

/** The added and changed files of the index, as { path, oid }. Submodule entries have no blob. */
const stagedFiles = () => {
  const head = spawnSync('git', ['rev-parse', '--verify', '-q', 'HEAD^{commit}'], { encoding: 'utf8' });
  const base = head.status === 0 ? head.stdout.trim() : git(['hash-object', '-t', 'tree', '/dev/null']).trim();
  const fields = git(['diff-index', '--cached', '-z', '--no-renames', '--diff-filter=AMT', base]).split('\0');
  const files = [];
  for (let i = 0; i + 1 < fields.length; i += 2) {
    const [, mode, , oid] = fields[i].split(' ');
    if (mode !== '160000') files.push({ path: fields[i + 1], oid });
  }
  return files;
};

/** Gives the size of each blob, with the path. An object that git cannot read is a gate fault. */
const withSizes = (/** @type {{ path: string, oid: string }[]} */ files, /** @type {string} */ where) => {
  if (!files.length) return [];
  const answers = git(['cat-file', '--batch-check'], files.map(f => f.oid).join('\n') + '\n').trim().split('\n');
  return files.map((file, i) => {
    const [oid, type, size] = answers[i]?.split(' ') ?? [];
    if (oid !== file.oid || type !== 'blob') throw new GateFault(`${where}: ${file.path}: git cannot read object ${file.oid.slice(0, 12)}`);
    return { ...file, size: Number(size) };
  });
};

/** The text of a work tree file, or '' when it is absent. */
const readText = (/** @type {string} */ path) => {
  try { return readFileSync(path, 'utf8'); } catch (error) {
    if (/** @type {NodeJS.ErrnoException} */ (error).code === 'ENOENT') return '';
    throw error;
  }
};

const staged = () => sizeFaults(withSizes(stagedFiles(), 'index'), readAllowlist(readText(ALLOWLIST)), 'index');

const modes = { staged, push: () => [] };

const main = () => {
  const mode = process.argv[2];
  if (!Object.hasOwn(modes, mode)) throw new GateFault(`unknown mode "${mode ?? ''}"; the modes are ${Object.keys(modes).join(' and ')}`);
  const faults = modes[/** @type {keyof typeof modes} */ (mode)]();
  for (const line of faults) process.stderr.write(`gate: ${line}\n`);
  return faults.length ? 1 : 0;
};

try {
  process.exitCode = main();
} catch (error) {
  process.stderr.write(`gate: fault: ${error instanceof GateFault ? '' : 'internal: '}${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 2;
}
