// Repo gate test (secrets-and-public-gates/04, 05 and 06): the size, private and secret rules in
// `staged` and `push` mode. Each commit case drives the real pre-commit hook through `git commit`, and each push
// case drives the real pre-push hook through `git push`, in a temporary repository with a bare
// remote. The package `gate` script starts the real gate.
import { randomUUID } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { tempRepo } from './lib/temp-repo.mjs';

const gatePath = join(import.meta.dirname, 'gate.mjs');
const big = 3 * 1024 * 1024;
type Repo = ReturnType<typeof tempRepo>;

const repos: Repo[] = [];
afterEach(() => { while (repos.length) repos.pop()!.cleanup(); });
/**
 * A temporary repository whose pre-commit hook starts the real gate. The two secret sources point
 * at missing files, so that no case reads the real secrets.
 */
const make = () => {
  const repo = tempRepo();
  repos.push(repo);
  repo.env.GATE_SECRETS_DIR = join(repo.root, 'no-secrets');
  repo.env.GATE_TYPESAFE_KEY = join(repo.root, 'no-key');
  const pkg = JSON.parse(repo.read('package.json'));
  pkg.scripts.gate = `node "${gatePath}"`;
  repo.write('package.json', JSON.stringify(pkg));
  return repo;
};
const commit = (repo: Repo, message: string, ...paths: string[]) => {
  repo.git('add', ...paths);
  return repo.git('commit', '-q', '-m', message);
};
const lines = (text: string, word: string) => text.split('\n').filter(line => line.includes(word));

describe('size rule through the real pre-commit hook', () => {
  it('refuses a commit that adds a 3 MB file, with one line that names the rule and the path', () => {
    const repo = make();
    repo.write('media/big.bin', 'x'.repeat(big));
    const result = commit(repo, 'add big', 'media/big.bin');
    expect(result.status).not.toBe(0);
    expect(repo.git('rev-parse', '--verify', '-q', 'HEAD').status).not.toBe(0);
    const faults = lines(result.stderr, 'gate: size:');
    expect(faults).toHaveLength(1);
    expect(faults[0]).toContain('media/big.bin');
    expect(faults[0]).toContain('index');
  });
});

describe('size allowlist', () => {
  it('lets the same commit pass when the allowlist holds the path and a reason', () => {
    const repo = make();
    repo.write('tools/gate/size-allowlist.txt', '# comment\n\nmedia/big.bin  a test video, approved\n');
    repo.write('media/big.bin', 'x'.repeat(big));
    const result = commit(repo, 'add big', 'media/big.bin', 'tools/gate/size-allowlist.txt');
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toBe('');
  });
});

describe('gate faults give exit 2 and one fault line', () => {
  const gate = (repo: Repo, ...args: string[]) => repo.run('node', [gatePath, ...args]);
  const oneFault = (result: { status: number | null, stdout: string, stderr: string }) => {
    expect(result.status).toBe(2);
    expect(result.stdout).toBe('');
    expect(result.stderr.trim().split('\n')).toHaveLength(1);
    expect(result.stderr).toMatch(/^gate: fault: /);
  };

  it('an allowlist line with no reason', () => {
    const repo = make();
    repo.write('tools/gate/size-allowlist.txt', 'media/ok.bin a reason\nmedia/big.bin\n');
    const result = gate(repo, 'staged');
    oneFault(result);
    expect(result.stderr).toContain('line 2');
    expect(result.stderr).toContain('media/big.bin');
  });

  it('an unknown mode, and no mode', () => {
    const repo = make();
    oneFault(gate(repo, 'sideways'));
    expect(gate(repo, 'sideways').stderr).toContain('unknown mode "sideways"');
    oneFault(gate(repo));
  });

  it('a corrupt input: the index names an object that git does not have', () => {
    const repo = make();
    const ghost = 'deadbeef'.repeat(5);
    expect(repo.git('update-index', '--add', '--info-only', '--cacheinfo', `100644,${ghost},ghost.bin`).status).toBe(0);
    const result = gate(repo, 'staged');
    oneFault(result);
    expect(result.stderr).toContain('gate: fault: index: ghost.bin: ');
  });

  it('exit 0 gives no output', () => {
    const repo = make();
    repo.write('a.txt', 'a\n');
    repo.git('add', 'a.txt');
    expect(gate(repo, 'staged')).toEqual({ status: 0, stdout: '', stderr: '' });
  });
});

describe('the gate reads only added and changed files', () => {
  /** Commits a large file past the hooks, as a file that is already on origin. */
  const withBigFile = () => {
    const repo = make();
    repo.write('media/big.bin', 'x'.repeat(big));
    repo.git('add', 'media/big.bin');
    expect(repo.git('commit', '-q', '--no-verify', '-m', 'old big file').status).toBe(0);
    return repo;
  };

  it('passes a commit that changes only a small file while a large file stays in the tree', () => {
    const repo = withBigFile();
    repo.write('notes.txt', 'small\n');
    const result = commit(repo, 'small change', 'notes.txt');
    expect(result.status, result.stderr).toBe(0);
    expect(repo.git('ls-files', 'media/big.bin').stdout.trim()).toBe('media/big.bin');
  });

  it('refuses a commit that changes a large file that is not on the allowlist', () => {
    const repo = withBigFile();
    repo.write('media/big.bin', 'y'.repeat(big));
    const result = commit(repo, 'change big', 'media/big.bin');
    expect(result.status).not.toBe(0);
    expect(lines(result.stderr, 'gate: size: index: media/big.bin: ')).toHaveLength(1);
  });
});

describe('the size allowlist of this repository', () => {
  const root = join(import.meta.dirname, '..');
  const text = readFileSync(join(root, 'tools/gate/size-allowlist.txt'), 'utf8');
  const entries = text.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'))
    .map(line => { const [path, ...reason] = line.split(/\s+/); return { path, reason: reason.join(' ') }; });

  it('holds the two Workshop motion videos and the five figure samples, each with a reason', () => {
    expect(entries.map(e => e.path).sort()).toEqual([
      'docs/visual-design/workshop/figure-samples-2026-10-06/fast-minimal.png',
      'docs/visual-design/workshop/figure-samples-2026-10-06/mixed-archer-face.png',
      'docs/visual-design/workshop/figure-samples-2026-10-06/mixed-minimal.png',
      'docs/visual-design/workshop/figure-samples-2026-10-06/mixed.png',
      'docs/visual-design/workshop/figure-samples-2026-10-06/strong-minimal.png',
      'docs/visual-design/workshop/motion-desktop.webm',
      'docs/visual-design/workshop/motion-phone.webm',
    ]);
    for (const entry of entries) expect(entry.reason, entry.path).not.toBe('');
  });

  it('has no stale line: each listed path exists in the tree and is over 2,000,000 bytes', () => {
    for (const { path } of entries) {
      expect(existsSync(join(root, path)), `${path} is not in the tree`).toBe(true);
      expect(statSync(join(root, path)).size, path).toBeGreaterThan(2_000_000);
    }
  });
});

/** Commits past the hooks, so that only the push meets the gate. `git add -f` also takes ignored files. */
const commitPast = (repo: Repo, message: string, ...paths: string[]) => {
  if (paths.length) expect(repo.git('add', '-f', ...paths).status).toBe(0);
  const result = repo.git('commit', '-q', '--no-verify', '-m', message);
  expect(result.status, result.stderr).toBe(0);
  return repo.git('rev-parse', 'HEAD').stdout.trim();
};
/** Pushes through the real pre-push hook. GATE_TRACE collects the paths that the gate reads. */
const push = (repo: Repo, ...refspecs: string[]) =>
  repo.run('git', ['push', 'origin', ...refspecs], { env: { GATE_TRACE: join(repo.root, 'trace.txt') } });
const traced = (repo: Repo) => {
  const file = join(repo.root, 'trace.txt');
  const paths = existsSync(file) ? readFileSync(file, 'utf8').split('\n').filter(Boolean) : [];
  repo.run('rm', ['-f', file]);
  return paths;
};
const remoteHead = (repo: Repo, branch: string) =>
  repo.git('--git-dir', repo.remote, 'rev-parse', '-q', '--verify', `refs/heads/${branch}`).stdout.trim();
/** The commit id as the gate prints it. */
const short = (sha: string) => sha.slice(0, 12);
/** A temporary repository whose main holds one commit on the remote. */
const seeded = () => {
  const repo = make();
  repo.write('README.md', 'seed\n');
  commitPast(repo, 'seed', 'README.md');
  expect(repo.git('push', '-q', '--no-verify', 'origin', 'main').status).toBe(0);
  return repo;
};

describe('push mode: the size rule through the real pre-push hook', () => {
  it('refuses a push of a 3 MB file without an allowlist line', () => {
    const repo = seeded();
    repo.write('media/big.bin', 'x'.repeat(big));
    const sha = commitPast(repo, 'add big', 'media/big.bin');
    const result = push(repo, 'HEAD:refs/heads/feature');
    expect(result.status).not.toBe(0);
    const faults = lines(result.stderr, 'gate: ');
    expect(faults).toHaveLength(1);
    expect(faults[0]).toMatch(new RegExp(`^gate: size: ${short(sha)}: media/big\\.bin: `));
    expect(remoteHead(repo, 'feature')).toBe('');
  });

  it('passes the same push when the pushed commit holds the allowlist line', () => {
    const repo = seeded();
    repo.write('media/big.bin', 'x'.repeat(big));
    repo.write('tools/gate/size-allowlist.txt', 'media/big.bin  a test video, approved\n');
    const sha = commitPast(repo, 'add big', 'media/big.bin', 'tools/gate/size-allowlist.txt');
    const result = push(repo, 'HEAD:refs/heads/feature');
    expect(result.status, result.stderr).toBe(0);
    expect(lines(result.stderr, 'gate: ')).toEqual([]);
    expect(remoteHead(repo, 'feature')).toBe(sha);
  });
});

describe('private rule', () => {
  it('push: a transcript that one commit adds and a later commit deletes refuses the push; the fault names the first commit', () => {
    const repo = seeded();
    repo.write('docs/claude-recovery/session.md', 'a transcript\n');
    const added = commitPast(repo, 'add transcript', 'docs/claude-recovery/session.md');
    expect(repo.git('rm', '-q', 'docs/claude-recovery/session.md').status).toBe(0);
    const deleted = commitPast(repo, 'delete transcript');
    const result = push(repo, 'HEAD:refs/heads/feature');
    expect(result.status).not.toBe(0);
    const faults = lines(result.stderr, 'gate: ');
    expect(faults).toHaveLength(1);
    expect(faults[0]).toMatch(new RegExp(`^gate: private: ${short(added)}: docs/claude-recovery/session\\.md: `));
    expect(result.stderr).not.toContain(short(deleted));
    expect(remoteHead(repo, 'feature')).toBe('');
  });

  /** A repository that ignores the art source folder except its manifest, as this repository does. */
  const withIgnores = () => {
    const repo = seeded();
    repo.write('.gitignore', '/.secrets/\n/art-src/*\n!/art-src/MANIFEST.md\n');
    repo.write('art-src/MANIFEST.md', '# Art sources\n');
    commitPast(repo, 'ignore rules and manifest', '.gitignore', 'art-src/MANIFEST.md');
    expect(repo.git('push', '-q', '--no-verify', 'origin', 'main').status).toBe(0);
    repo.write('.secrets/kaggle.json', '{}\n');
    repo.write('art-src/workshop/king.png', 'png\n');
    return repo;
  };

  it('staged: a file in the secrets folder and a forced art source file each refuse the commit', () => {
    const repo = withIgnores();
    expect(repo.git('add', 'art-src/workshop/king.png').status).not.toBe(0);
    for (const path of ['.secrets/kaggle.json', 'art-src/workshop/king.png']) {
      expect(repo.git('add', '-f', path).status).toBe(0);
      const result = repo.git('commit', '-q', '-m', `add ${path}`);
      expect(result.status).not.toBe(0);
      const faults = lines(result.stderr, 'gate: ');
      expect(faults).toHaveLength(1);
      expect(faults[0]).toContain(`gate: private: index: ${path}: `);
      expect(repo.git('rm', '-q', '--cached', path).status).toBe(0);
    }
  });

  it('push: a file in the secrets folder and a forced art source file refuse the push', () => {
    const repo = withIgnores();
    const secret = commitPast(repo, 'add secret', '.secrets/kaggle.json');
    const art = commitPast(repo, 'add art', 'art-src/workshop/king.png');
    const result = push(repo, 'HEAD:refs/heads/feature');
    expect(result.status).not.toBe(0);
    expect(lines(result.stderr, 'gate: ')).toEqual([
      expect.stringContaining(`gate: private: ${short(secret)}: .secrets/kaggle.json: `),
      expect.stringContaining(`gate: private: ${short(art)}: art-src/workshop/king.png: `),
    ]);
  });

  it('passes an edit of the art manifest and a file in a research context-recovery folder, at commit and at push', () => {
    const repo = withIgnores();
    repo.write('art-src/MANIFEST.md', '# Art sources\n\nOne more line.\n');
    repo.write('docs/research/m1-results/x-context-recovery/notes.md', 'notes\n');
    const result = commit(repo, 'manifest and research', 'art-src/MANIFEST.md', 'docs/research/m1-results/x-context-recovery/notes.md');
    expect(result.status, result.stderr).toBe(0);
    const pushed = push(repo, 'HEAD:refs/heads/feature');
    expect(pushed.status, pushed.stderr).toBe(0);
    expect(remoteHead(repo, 'feature')).toBe(repo.git('rev-parse', 'HEAD').stdout.trim());
  });

  it('passes a commit and a push that delete transcript files', () => {
    const repo = seeded();
    repo.write('docs/claude-recovery/a.md', 'a\n');
    repo.write('docs/cursor-recovery/b.md', 'b\n');
    commitPast(repo, 'old transcripts', 'docs/claude-recovery/a.md', 'docs/cursor-recovery/b.md');
    expect(repo.git('push', '-q', '--no-verify', 'origin', 'main').status).toBe(0);
    expect(repo.git('rm', '-q', '-r', 'docs/claude-recovery', 'docs/cursor-recovery').status).toBe(0);
    const result = repo.git('commit', '-q', '-m', 'transcripts leave the tree');
    expect(result.status, result.stderr).toBe(0);
    const pushed = push(repo, 'HEAD:refs/heads/feature');
    expect(pushed.status, pushed.stderr).toBe(0);
  });
});

describe('push mode reads only what origin does not reach', () => {
  it('reads no file of a commit that origin already reaches, and passes a branch deletion in the same push', () => {
    const repo = seeded();
    repo.write('a.txt', 'a\n');
    commitPast(repo, 'a', 'a.txt');
    expect(push(repo, 'HEAD:refs/heads/feature').status).toBe(0);
    expect(traced(repo)).toEqual(['a.txt']);

    expect(push(repo, 'HEAD:refs/heads/copy').status).toBe(0);
    expect(traced(repo)).toEqual([]);

    repo.write('b.txt', 'b\n');
    const head = commitPast(repo, 'b', 'b.txt');
    const result = push(repo, 'HEAD:refs/heads/feature', ':refs/heads/copy');
    expect(result.status, result.stderr).toBe(0);
    expect(traced(repo)).toEqual(['b.txt']);
    expect(remoteHead(repo, 'feature')).toBe(head);
    expect(remoteHead(repo, 'copy')).toBe('');
  });

  it('reads no file that a merge takes from a branch that origin holds', () => {
    const repo = seeded();
    expect(repo.git('switch', '-q', '-c', 'side').status).toBe(0);
    repo.write('c.txt', 'c\n');
    commitPast(repo, 'c', 'c.txt');
    expect(repo.git('push', '-q', '--no-verify', 'origin', 'side').status).toBe(0);
    expect(repo.git('switch', '-q', 'main').status).toBe(0);
    repo.write('d.txt', 'd\n');
    commitPast(repo, 'd', 'd.txt');
    expect(repo.git('merge', '-q', '--no-edit', '--no-verify', 'side').status).toBe(0);
    const result = push(repo, 'HEAD:refs/heads/feature');
    expect(result.status, result.stderr).toBe(0);
    expect(traced(repo)).toEqual(['d.txt']);
  });

  it('a pushed object that git does not have gives exit 2 and one fault line', () => {
    const repo = seeded();
    const result = repo.run('node', [gatePath, 'push', 'origin', repo.remote],
      { input: `refs/heads/main ${'ab'.repeat(20)} refs/heads/main ${'0'.repeat(40)}\n` });
    expect(result.status).toBe(2);
    expect(result.stderr.trim().split('\n')).toHaveLength(1);
    expect(result.stderr).toMatch(/^gate: fault: /);
  });
});

// A push case runs the fixture hooks and git several times; under load this takes over 5 s.
describe('secret rule', { timeout: 30_000 }, () => {
  /** A fake secret value; each case makes new ones. */
  const fake = () => `fake-${randomUUID()}`;
  /**
   * Writes fake secret sources and points the gate at them: `files` go into the secrets folder,
   * `key` into the Typesafe key file.
   */
  const sources = (repo: Repo, files: Record<string, string>, key?: string) => {
    const folder = join(repo.root, 'secrets');
    mkdirSync(folder, { recursive: true });
    for (const [name, text] of Object.entries(files)) writeFileSync(join(folder, name), text);
    repo.env.GATE_SECRETS_DIR = folder;
    if (key !== undefined) writeFileSync(join(repo.root, 'typesafe-key'), key);
    repo.env.GATE_TYPESAFE_KEY = join(repo.root, 'typesafe-key');
    return folder;
  };
  /** Asserts that no output holds a value. */
  const silent = (result: { stdout: string, stderr: string }, ...values: string[]) => {
    for (const value of values) {
      expect(result.stdout.includes(value), 'stdout holds the value').toBe(false);
      expect(result.stderr.includes(value), 'stderr holds the value').toBe(false);
    }
  };
  const refused = (repo: Repo, result: { status: number | null, stdout: string, stderr: string }, expected: string[], ...values: string[]) => {
    expect(result.status).not.toBe(0);
    expect(lines(result.stderr, 'gate: ')).toEqual(expected.map(start => expect.stringMatching(new RegExp(`^${start.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`))));
    expect(remoteHead(repo, 'feature')).toBe('');
    silent(result, ...values);
  };

  it('push: a value in a text file, in a binary file and in a commit message each refuse the push', () => {
    const repo = seeded();
    const token = fake(), key = fake();
    sources(repo, { kaggle_api_token: `${token}\n` }, `  ${key}\n`);
    repo.write('notes.txt', `the token is ${token} here\n`);
    const text = commitPast(repo, 'notes', 'notes.txt');
    mkdirSync(join(repo.dir, 'media'));
    writeFileSync(join(repo.dir, 'media/blob.bin'), Buffer.concat([Buffer.from([0, 0xff, 0xfe, 0x80]), Buffer.from(key), Buffer.from([0xc3, 0x28, 0])]));
    const binary = commitPast(repo, 'binary', 'media/blob.bin');
    repo.write('c.txt', 'c\n');
    const message = commitPast(repo, `a message with ${token}`, 'c.txt');
    const result = push(repo, 'HEAD:refs/heads/feature');
    refused(repo, result, [
      `gate: secret: ${short(text)}: notes.txt: .secrets/kaggle_api_token`,
      `gate: secret: ${short(binary)}: media/blob.bin: typesafe key`,
      `gate: secret: ${short(message)}: message: .secrets/kaggle_api_token`,
    ], token, key);
  });

  it('push: a value that one commit adds and a later commit removes refuses the push; the fault names the first commit', () => {
    const repo = seeded();
    const token = fake();
    sources(repo, { kaggle_api_token: token });
    repo.write('notes.txt', `${token}\n`);
    const added = commitPast(repo, 'add', 'notes.txt');
    repo.write('notes.txt', 'clean\n');
    const cleaned = commitPast(repo, 'clean', 'notes.txt');
    const result = push(repo, 'HEAD:refs/heads/feature');
    refused(repo, result, [`gate: secret: ${short(added)}: notes.txt: .secrets/kaggle_api_token`], token);
    expect(result.stderr).not.toContain(short(cleaned));
  });

  it('push: a JSON value under a key such as username passes; values under secretapikey and token refuse', () => {
    const repo = seeded();
    const user = fake(), apikey = fake(), token = fake();
    sources(repo, {
      'porkbun_api.json': JSON.stringify({ username: user, secretapikey: apikey }),
      'oauth.json': JSON.stringify({ app: { Token: token, url: 'https://example.invalid' }, retries: 3 }),
    });
    repo.write('public.txt', `${user}\n`);
    commitPast(repo, 'public', 'public.txt');
    const pass = push(repo, 'HEAD:refs/heads/feature');
    expect(pass.status, pass.stderr).toBe(0);
    expect(lines(pass.stderr, 'gate: ')).toEqual([]);
    silent(pass, user);

    repo.write('a.txt', `${apikey}\n`);
    const a = commitPast(repo, 'a', 'a.txt');
    repo.write('b.txt', `${token}\n`);
    const b = commitPast(repo, 'b', 'b.txt');
    const result = push(repo, 'HEAD:refs/heads/feature2');
    expect(result.status).not.toBe(0);
    expect(lines(result.stderr, 'gate: ')).toEqual([
      expect.stringMatching(new RegExp(`^gate: secret: ${short(a)}: a\\.txt: \\.secrets/porkbun_api\\.json: `)),
      expect.stringMatching(new RegExp(`^gate: secret: ${short(b)}: b\\.txt: \\.secrets/oauth\\.json: `)),
    ]);
    silent(result, user, apikey, token);
  });

  it('staged: a commit through the real pre-commit hook that stages a value fails', () => {
    const repo = seeded();
    const key = fake();
    sources(repo, {}, key);
    repo.write('src/config.ts', `export const key = '${key}';\n`);
    const result = commit(repo, 'config', 'src/config.ts');
    expect(result.status).not.toBe(0);
    expect(lines(result.stderr, 'gate: ')).toEqual([expect.stringMatching(/^gate: secret: index: src\/config\.ts: typesafe key: /)]);
    expect(repo.git('rev-list', '--count', 'HEAD').stdout.trim()).toBe('1');
    silent(result, key);
  });

  it('takes the secrets folder of the main checkout, also in a linked worktree', () => {
    const repo = seeded();
    const token = fake();
    delete repo.env.GATE_SECRETS_DIR;
    mkdirSync(join(repo.dir, '.secrets'));
    writeFileSync(join(repo.dir, '.secrets/kaggle_api_token'), token);
    const linked = join(repo.root, 'linked');
    expect(repo.git('worktree', 'add', '-q', '-b', 'linked', linked).status).toBe(0);
    writeFileSync(join(linked, 'leak.txt'), token);
    expect(repo.run('git', ['add', 'leak.txt'], { cwd: linked }).status).toBe(0);
    const result = repo.run('node', [gatePath, 'staged'], { cwd: linked });
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/^gate: secret: index: leak\.txt: \.secrets\/kaggle_api_token: /);
    silent(result, token);
  });

  it('passes when both sources are missing', () => {
    const repo = seeded();
    repo.write('notes.txt', 'notes\n');
    const result = commit(repo, 'notes', 'notes.txt');
    expect(result.status, result.stderr).toBe(0);
  });

  it('a source folder or a key file with no read access gives exit 2', () => {
    const repo = seeded();
    const folder = sources(repo, { kaggle_api_token: fake() }, fake());
    repo.write('notes.txt', 'notes\n');
    repo.git('add', 'notes.txt');
    const gate = () => repo.run('node', [gatePath, 'staged']);
    chmodSync(folder, 0);
    try {
      const result = gate();
      expect(result.status).toBe(2);
      expect(result.stderr).toMatch(/^gate: fault: secrets: .*cannot read/);
      expect(result.stderr.trim().split('\n')).toHaveLength(1);
    } finally { chmodSync(folder, 0o700); }
    chmodSync(join(repo.root, 'typesafe-key'), 0);
    const result = gate();
    expect(result.status).toBe(2);
    expect(result.stderr).toMatch(/^gate: fault: secrets: typesafe key: cannot read/);
    chmodSync(join(repo.root, 'typesafe-key'), 0o600);
  });

  it('a JSON file that does not parse gives exit 2, and the fault line does not quote it', () => {
    const repo = seeded();
    const token = fake();
    sources(repo, { 'oauth.json': `{"token": "${token}"` });
    repo.write('notes.txt', 'notes\n');
    repo.git('add', 'notes.txt');
    const result = repo.run('node', [gatePath, 'staged']);
    expect(result.status).toBe(2);
    expect(result.stderr.trim()).toBe('gate: fault: secrets: .secrets/oauth.json: cannot read (not valid JSON)');
    silent(result, token);
  });
});
