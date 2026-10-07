// Unit test for the shared browser-check settings (checks-and-hooks/05).
// The assertions and shot() have a browser self-test: tools/check-selftest.mjs.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tmpdir } from 'node:os';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { env, outRoot } from './checks.mjs';

const checkout = resolve(__dirname, '../..');
let argv1: string;

beforeEach(() => {
  argv1 = process.argv[1];
  process.argv[1] = '/somewhere/tools/verify-workshop.mjs';
  for (const name of ['PLAYABLE_URL', 'PLAYABLE_OUT', 'PLAYABLE_BROWSER', 'CLAUDE_CODE_REMOTE']) vi.stubEnv(name, undefined);
});
afterEach(() => {
  process.argv[1] = argv1;
  vi.unstubAllEnvs();
});

describe('env defaults when the variable is not set', () => {
  it('PLAYABLE_URL is the local preview at port 5189', () => {
    expect(env('PLAYABLE_URL')).toBe('http://127.0.0.1:5189/');
  });
  it('PLAYABLE_OUT is a folder named for the check inside the output root', () => {
    expect(env('PLAYABLE_OUT')).toBe(join(outRoot, 'workshop'));
    expect(outRoot).toBe(join(tmpdir(), 'kingdown-checks'));
  });
  it('PLAYABLE_OUT is never inside the checkout', () => {
    const rel = relative(checkout, env('PLAYABLE_OUT'));
    expect(rel.startsWith('..') || isAbsolute(rel)).toBe(true);
  });
  it('PLAYABLE_BROWSER is chrome when CLAUDE_CODE_REMOTE is not set', () => {
    expect(env('PLAYABLE_BROWSER')).toBe('chrome');
  });
  it('PLAYABLE_BROWSER is chromium when CLAUDE_CODE_REMOTE is true', () => {
    vi.stubEnv('CLAUDE_CODE_REMOTE', 'true');
    expect(env('PLAYABLE_BROWSER')).toBe('chromium');
  });
});

describe('env values when the variable is set', () => {
  it('gives each set value', () => {
    vi.stubEnv('PLAYABLE_URL', 'http://127.0.0.1:40123/');
    vi.stubEnv('PLAYABLE_OUT', '/tmp/elsewhere');
    vi.stubEnv('PLAYABLE_BROWSER', 'chromium');
    expect(env('PLAYABLE_URL')).toBe('http://127.0.0.1:40123/');
    expect(env('PLAYABLE_OUT')).toBe('/tmp/elsewhere');
    expect(env('PLAYABLE_BROWSER')).toBe('chromium');
  });
  it('a set PLAYABLE_BROWSER wins over CLAUDE_CODE_REMOTE', () => {
    vi.stubEnv('CLAUDE_CODE_REMOTE', 'true');
    vi.stubEnv('PLAYABLE_BROWSER', 'chrome');
    expect(env('PLAYABLE_BROWSER')).toBe('chrome');
  });
});

it('env refuses an unknown setting', () => {
  expect(() => env('PLAYABLE_PORT')).toThrow(/PLAYABLE_PORT/);
});
