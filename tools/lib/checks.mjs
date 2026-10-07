// Shared module for the browser checks (checks-and-hooks/05).
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';

/** The runner's output root: one fixed system temp folder, outside every checkout. */
export const outRoot = join(tmpdir(), 'kingdown-checks');

/** The check's short name: its script name without the folder, the extension and `verify-`. */
const checkName = () => basename(process.argv[1] ?? 'check').replace(/\.[^.]+$/, '').replace(/^verify-/, '');

const defaults = {
  PLAYABLE_URL: () => 'http://127.0.0.1:5189/',
  PLAYABLE_OUT: () => join(outRoot, checkName()),
  PLAYABLE_BROWSER: () => (process.env.CLAUDE_CODE_REMOTE === 'true' ? 'chromium' : 'chrome'),
};

export function env(name) {
  if (!(name in defaults)) throw new Error(`env: unknown setting ${name}; known: ${Object.keys(defaults).join(', ')}`);
  return process.env[name] || defaults[name]();
}
