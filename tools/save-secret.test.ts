// Tests for tools/save-secret.sh. Fake `pbpaste` and `pbcopy` on PATH replace the clipboard:
// `pbpaste` prints the clip file, `pbcopy` writes its stdin to the copied file.
import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const script = fileURLToPath(new URL('./save-secret.sh', import.meta.url));
const value = 'fake-key-0123456789abcdef\n';

let root: string;
let clip: string;
let copied: string;
let secrets: string;
let env: Record<string, string>;

beforeEach(() => {
  root = mkdtempSync(join(realpathSync(tmpdir()), 'save-secret-'));
  const bin = join(root, 'bin');
  mkdirSync(bin);
  clip = join(root, 'clip');
  copied = join(root, 'copied');
  secrets = join(root, 'secrets');
  writeFileSync(join(bin, 'pbpaste'), `#!/bin/sh\ncat "${clip}"\n`);
  writeFileSync(join(bin, 'pbcopy'), `#!/bin/sh\ncat > "${copied}"\n`);
  chmodSync(join(bin, 'pbpaste'), 0o755);
  chmodSync(join(bin, 'pbcopy'), 0o755);
  env = {};
  for (const [key, val] of Object.entries(process.env)) if (val !== undefined && !key.startsWith('GIT_')) env[key] = val;
  env.PATH = `${bin}:${process.env.PATH}`;
  env.GATE_SECRETS_DIR = secrets;
});

afterEach(() => rmSync(root, { recursive: true, force: true }));

function run(args: string[], options: { script?: string; env?: Record<string, string> } = {}) {
  const result = spawnSync(options.script ?? script, args, { cwd: root, env: options.env ?? env, encoding: 'utf8' });
  if (result.error) throw result.error;
  return result;
}

const mode = (path: string) => statSync(path).mode & 0o777;

describe('save-secret.sh', () => {
  it('writes the clipboard bytes to the named file, mode 600, in a folder with mode 700', () => {
    writeFileSync(clip, value);
    const result = run(['typesafe_key']);
    expect(result.status).toBe(0);
    const file = join(secrets, 'typesafe_key');
    expect(readFileSync(file, 'utf8')).toBe(value);
    expect(mode(file)).toBe(0o600);
    expect(mode(secrets)).toBe(0o700);
  });

  it('prints the name, the size and a hash prefix, never the value, and clears the clipboard', () => {
    writeFileSync(clip, value);
    const result = run(['typesafe_key']);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('typesafe_key');
    expect(result.stdout).toContain(`${Buffer.byteLength(value)} bytes`);
    expect(result.stdout).toMatch(/sha256 [0-9a-f]{8}\b/);
    expect(result.stdout).not.toContain(value.trim());
    expect(result.stdout).not.toContain('0123456789');
    expect(readFileSync(copied, 'utf8')).toBe('');
  });

  it('refuses an empty clipboard and writes no file', () => {
    writeFileSync(clip, '');
    const result = run(['typesafe_key']);
    expect(result.status).not.toBe(0);
    expect(existsSync(join(secrets, 'typesafe_key'))).toBe(false);
  });

  it('refuses an existing file, which stays unchanged; --force replaces it', () => {
    mkdirSync(secrets);
    writeFileSync(join(secrets, 'typesafe_key'), 'old\n');
    writeFileSync(clip, value);
    const refused = run(['typesafe_key']);
    expect(refused.status).not.toBe(0);
    expect(refused.stderr).toContain('--force');
    expect(readFileSync(join(secrets, 'typesafe_key'), 'utf8')).toBe('old\n');

    const forced = run(['--force', 'typesafe_key']);
    expect(forced.status).toBe(0);
    expect(readFileSync(join(secrets, 'typesafe_key'), 'utf8')).toBe(value);
    expect(mode(join(secrets, 'typesafe_key'))).toBe(0o600);
  });

  it.each(['a/b', '../up', '.hidden'])('refuses the name %s', name => {
    writeFileSync(clip, value);
    const result = run([name]);
    expect(result.status).not.toBe(0);
    expect(existsSync(secrets)).toBe(false);
  });

  it('from a linked worktree, writes into the main checkout\'s secrets folder', () => {
    const main = join(root, 'main');
    const linked = join(root, 'linked');
    const gitConfig = join(root, 'gitconfig');
    writeFileSync(gitConfig, '');
    const gitEnv = { ...env, GIT_CONFIG_GLOBAL: gitConfig, GIT_CONFIG_NOSYSTEM: '1' };
    delete gitEnv.GATE_SECRETS_DIR;
    const git = (cwd: string, ...args: string[]) => {
      const result = spawnSync('git', args, { cwd, env: gitEnv, encoding: 'utf8' });
      expect(result.status, result.stderr).toBe(0);
    };
    mkdirSync(main);
    git(main, 'init', '-q', '-b', 'main');
    git(main, '-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-q', '--allow-empty', '-m', 'start');
    git(main, 'worktree', 'add', '-q', linked);
    mkdirSync(join(linked, 'tools'));
    writeFileSync(join(linked, 'tools', 'save-secret.sh'), readFileSync(script));
    chmodSync(join(linked, 'tools', 'save-secret.sh'), 0o755);

    writeFileSync(clip, value);
    const result = run(['typesafe_key'], { script: join(linked, 'tools', 'save-secret.sh'), env: gitEnv });
    expect(result.status, result.stderr).toBe(0);
    expect(readFileSync(join(main, '.secrets', 'typesafe_key'), 'utf8')).toBe(value);
    expect(mode(join(main, '.secrets'))).toBe(0o700);
    expect(existsSync(join(linked, '.secrets'))).toBe(false);
  });
});
