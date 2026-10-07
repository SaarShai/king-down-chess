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
//     The gate checks each commit that a pushed object reaches and no ref of <remote> reaches
//     (refs/remotes/<remote>/*, and each remote object name that git has). It reads the files that
//     each commit adds or changes; a merge counts a file only when it differs from each parent.
//     So a file in any pushed commit fails, also when a later commit deletes it. The size
//     allowlist comes from the pushed commit, not from the work tree. A deletion line passes.
//   Environment: the GIT_ variables that git sets for the hook stay. The current folder is the
//   top folder of the work tree. When GATE_TRACE names a file, the gate adds to it one line with
//   the path of each blob that it reads (the tests count them).
//   Exit codes: 0 passes. Any other exit refuses the commit or the push. A missing `gate` script
//   in package.json also refuses. The hook shows the gate's stderr, so write each reason there.
//   The gate gives 1 when a rule refuses and 2 for a gate fault (bad input, git cannot read an
//   object, a bad allowlist line). Each fault is one line on stderr:
//     gate: <rule>: <short commit or "index">: <path>: <reason>
//   Exit 0 gives no output.
//
// Rules (one module each in tools/gate/), in both modes:
//   private: an added or changed path in a transcript folder, the secrets folder or the art source
//            folder fails; the art manifest passes.
//   size: a file over 2,000,000 bytes fails, unless tools/gate/size-allowlist.txt holds its path
//         with a reason.
//   secret: a file, or in push mode a commit message, that holds the exact value of a current secret
//           fails. The fault line names the secret file ("message" in place of the path), never
//           the value. GATE_SECRETS_DIR and GATE_TYPESAFE_KEY replace the two sources (for tests);
//           tools/gate/secret.mjs states the sources.
import { spawnSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { GateFault } from './gate/fault.mjs';
import { privateFaults } from './gate/private.mjs';
import { readSecrets, secretFaults } from './gate/secret.mjs';
import { ALLOWLIST, readAllowlist, sizeFaults } from './gate/size.mjs';

/** Runs git with the hook's environment and gives its stdout as bytes. A failure is a gate fault. */
const gitBytes = (/** @type {string[]} */ args, input = '') => {
  const result = spawnSync('git', args, { input, maxBuffer: 1 << 30 });
  if (result.error) throw new GateFault(`cannot start git: ${result.error.message}`);
  if (result.status !== 0) throw new GateFault(`git ${args[0]} failed: ${result.stderr.toString().trim().split('\n')[0]}`);
  return result.stdout;
};
/** Runs git and gives its stdout as text. */
const git = (/** @type {string[]} */ args, input = '') => gitBytes(args, input).toString('utf8');

/** True when git exits 0. */
const gitPasses = (/** @type {string[]} */ args) => spawnSync('git', args, { stdio: 'ignore' }).status === 0;
const zero = /^0+$/;
const gitlink = '160000';

/** @typedef {{ where: string, path: string, oid: string }} File `where` is the short commit, or "index" */

/** The added and changed files of the index. Submodule entries have no blob. */
const stagedFiles = () => {
  const head = spawnSync('git', ['rev-parse', '--verify', '-q', 'HEAD^{commit}'], { encoding: 'utf8' });
  const base = head.status === 0 ? head.stdout.trim() : git(['hash-object', '-t', 'tree', '/dev/null']).trim();
  const fields = git(['diff-index', '--cached', '-z', '--no-renames', '--diff-filter=AMT', base]).split('\0');
  /** @type {File[]} */
  const files = [];
  for (let i = 0; i + 1 < fields.length; i += 2) {
    const [, mode, , oid] = fields[i].split(' ');
    if (mode !== gitlink) files.push({ where: 'index', path: fields[i + 1], oid });
  }
  return files;
};

/**
 * The added and changed files of each commit. The combined diff (-c) of a merge lists a file only
 * when it differs from each parent. A raw line starts with one ":" per parent, then the modes and
 * the object names of the parents and of the commit; the commit's own come last.
 */
const commitFiles = (/** @type {string[]} */ commits) => {
  const fields = git(['diff-tree', '--stdin', '-r', '-z', '--no-renames', '--root', '-c'], commits.join('\n') + '\n').split('\0');
  /** @type {File[]} */
  const files = [];
  let where = '';
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i];
    if (!field) continue;
    if (!field.startsWith(':')) { where = field.slice(0, 12); continue; }
    const parents = /** @type {RegExpMatchArray} */ (field.match(/^:+/))[0].length;
    const words = field.slice(parents).split(' ');
    const mode = words[parents], oid = words[2 * parents + 1], path = fields[++i];
    if (!zero.test(oid) && mode !== gitlink) files.push({ where, path, oid });
  }
  return files;
};

/** Gives the size of each file. It reads each blob once. An object that git cannot read is a gate fault. */
const withSizes = (/** @type {File[]} */ files) => {
  /** @type {Map<string, File>} */
  const first = new Map();
  for (const file of files) if (!first.has(file.oid)) first.set(file.oid, file);
  if (!first.size) return [];
  const oids = [...first.keys()];
  const trace = process.env.GATE_TRACE;
  if (trace) appendFileSync(trace, oids.map(oid => `${first.get(oid)?.path}\n`).join(''));
  const answers = git(['cat-file', '--batch-check'], oids.join('\n') + '\n').trim().split('\n');
  const sizes = new Map(oids.map((oid, i) => {
    const [got, type, size] = answers[i]?.split(' ') ?? [];
    const file = /** @type {File} */ (first.get(oid));
    if (got !== oid || type !== 'blob') throw new GateFault(`${file.where}: ${file.path}: git cannot read object ${oid.slice(0, 12)}`);
    return [oid, Number(size)];
  }));
  return files.map(file => ({ ...file, size: /** @type {number} */ (sizes.get(file.oid)) }));
};

/**
 * The content of each object. Each line of `git cat-file --batch` output is "<id> <type> <size>",
 * then the content and a newline. An object that git cannot read is a gate fault.
 */
const contents = (/** @type {string[]} */ oids) => {
  const out = gitBytes(['cat-file', '--batch'], oids.join('\n') + '\n');
  /** @type {Map<string, Buffer>} */
  const found = new Map();
  let at = 0;
  for (const oid of oids) {
    const end = out.indexOf(10, at);
    const [got, , size] = out.subarray(at, end).toString('utf8').split(' ');
    if (got !== oid || size === undefined) throw new GateFault(`git cannot read object ${oid.slice(0, 12)}`);
    at = end + 1 + Number(size) + 1;
    found.set(oid, out.subarray(end + 1, end + 1 + Number(size)));
  }
  return found;
};

/** The top folder of the main checkout: the parent of git's common folder, also from a linked worktree. */
const mainCheckout = () => dirname(git(['rev-parse', '--path-format=absolute', '--git-common-dir']).trim());

/**
 * Applies the secret rule to the files and to the message of each commit. It reads no content
 * when no source gives a value.
 */
const secretCheck = (/** @type {File[]} */ files, /** @type {string[]} */ commits) => {
  if (!files.length && !commits.length) return [];
  const secrets = readSecrets(process.env.GATE_SECRETS_DIR ? '' : mainCheckout());
  if (!secrets.length) return [];
  const found = contents([...new Set([...files.map(file => file.oid), ...commits])]);
  const order = new Map(commits.map((commit, i) => [commit.slice(0, 12), i]));
  const texts = [
    ...files.map(({ where, path, oid }) => ({ where, path, content: /** @type {Buffer} */ (found.get(oid)) })),
    ...commits.map(commit => {
      const object = /** @type {Buffer} */ (found.get(commit));
      const body = object.indexOf('\n\n');
      return { where: commit.slice(0, 12), path: 'message', content: body < 0 ? Buffer.alloc(0) : object.subarray(body + 2) };
    }),
  ].map((text, i) => ({ text, i })).sort((a, b) => (order.get(a.text.where) ?? 0) - (order.get(b.text.where) ?? 0) || a.i - b.i);
  return secretFaults(texts.map(({ text }) => text), secrets);
};

/** The text of a work tree file, or '' when it is absent. */
const readText = (/** @type {string} */ path) => {
  try { return readFileSync(path, 'utf8'); } catch (error) {
    if (/** @type {NodeJS.ErrnoException} */ (error).code === 'ENOENT') return '';
    throw error;
  }
};

/** The text of a file in a commit, or '' when the commit does not hold it. */
const textAt = (/** @type {string} */ commit, /** @type {string} */ path) =>
  gitPasses(['cat-file', '-e', `${commit}:${path}`]) ? git(['cat-file', 'blob', `${commit}:${path}`]) : '';

/** Applies each rule to the files and the commits; `allowlist` gives the size allowlist text. */
const check = (/** @type {File[]} */ files, /** @type {() => string} */ allowlist, /** @type {string[]} */ commits = []) =>
  [...privateFaults(files), ...sizeFaults(withSizes(files), readAllowlist(allowlist())), ...secretCheck(files, commits)];

const staged = () => check(stagedFiles(), () => readText(ALLOWLIST));

const push = () => {
  const remote = process.argv[3];
  if (!remote) throw new GateFault('push mode needs the arguments <remote> <url>');
  const updates = readFileSync(0, 'utf8').split('\n').filter(Boolean).map(line => {
    const [, local = '', , remoteSha = ''] = line.split(' ');
    if (!/^[0-9a-f]+$/.test(local) || !/^[0-9a-f]+$/.test(remoteSha)) throw new GateFault(`bad pre-push line from git: "${line}"`);
    return { local, remoteSha };
  });
  const known = updates.map(u => u.remoteSha).filter(sha => !zero.test(sha) && gitPasses(['cat-file', '-e', `${sha}^{commit}`]));
  /** @type {string[]} */
  const done = [];
  return updates.filter(u => !zero.test(u.local)).flatMap(({ local }) => {
    const commits = git(['rev-list', '--reverse', '--topo-order', local, '--not', `--remotes=${remote}`, ...known, ...done])
      .split('\n').filter(Boolean);
    done.push(local);
    return commits.length ? check(commitFiles(commits), () => textAt(local, ALLOWLIST), commits) : [];
  });
};

const modes = { staged, push };

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
