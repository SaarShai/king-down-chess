// Unit test for the shared browser-check settings (checks-and-hooks/05) and isInside.
// The assertions and shot() have a browser self-test: tools/check-selftest.mjs.
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, realpathSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { chromium, firefox, webkit } from 'playwright';
import { env, isInside, launch, outRoot } from './checks.mjs';

const checkout = resolve(__dirname, '../..');
let argv1: string;

beforeEach(() => {
  argv1 = process.argv[1];
  process.argv[1] = '/somewhere/tools/verify-workshop.mjs';
  for (const name of ['PLAYABLE_URL', 'PLAYABLE_OUT', 'PLAYABLE_BROWSER', 'CLAUDE_CODE_REMOTE', 'CI']) vi.stubEnv(name, undefined);
});
afterEach(() => {
  process.argv[1] = argv1;
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('launch', () => {
  it.each(['chrome', 'chromium'])('opens the %s channel with the caller options', async channel => {
    vi.stubEnv('PLAYABLE_BROWSER', channel);
    const chromiumLaunch = vi.spyOn(chromium, 'launch').mockResolvedValue({} as any);
    const firefoxLaunch = vi.spyOn(firefox, 'launch').mockResolvedValue({} as any);
    const webkitLaunch = vi.spyOn(webkit, 'launch').mockResolvedValue({} as any);
    const options = { headless: true, slowMo: 10 };
    const browser = await launch(options);
    expect(chromiumLaunch).toHaveBeenCalledWith({ channel, ...options });
    expect(firefoxLaunch).not.toHaveBeenCalled();
    expect(webkitLaunch).not.toHaveBeenCalled();
    expect(browser).toBe(await chromiumLaunch.mock.results[0].value);
  });

  it('opens WebKit with the caller options and no Chromium channel', async () => {
    vi.stubEnv('PLAYABLE_BROWSER', 'webkit');
    const chromiumLaunch = vi.spyOn(chromium, 'launch').mockResolvedValue({} as any);
    const firefoxLaunch = vi.spyOn(firefox, 'launch').mockResolvedValue({} as any);
    const webkitLaunch = vi.spyOn(webkit, 'launch').mockResolvedValue({} as any);
    const options = { headless: true, slowMo: 10 };
    const browser = await launch(options);
    expect(webkitLaunch).toHaveBeenCalledWith(options);
    expect(chromiumLaunch).not.toHaveBeenCalled();
    expect(firefoxLaunch).not.toHaveBeenCalled();
    expect(browser).toBe(await webkitLaunch.mock.results[0].value);
  });

  it('keeps the default options for WebKit', async () => {
    vi.stubEnv('PLAYABLE_BROWSER', 'webkit');
    const webkitLaunch = vi.spyOn(webkit, 'launch').mockResolvedValue({} as any);
    await launch();
    expect(webkitLaunch).toHaveBeenCalledWith({});
  });

  it('uses an explicit channel before the default setting', async () => {
    const chromiumLaunch = vi.spyOn(chromium, 'launch').mockResolvedValue({} as any);
    await launch({ channel: 'chromium', headless: true });
    expect(chromiumLaunch).toHaveBeenCalledWith({ channel: 'chromium', headless: true });
  });

  it('accepts WebKit as an explicit channel without sending it to Playwright', async () => {
    const webkitLaunch = vi.spyOn(webkit, 'launch').mockResolvedValue({} as any);
    await launch({ channel: 'webkit', headless: true });
    expect(webkitLaunch).toHaveBeenCalledWith({ headless: true });
  });

  it.each([undefined, 'firefox'])('opens Firefox with caller options (explicit channel: %s)', async channel => {
    vi.stubEnv('PLAYABLE_BROWSER', channel ? 'chromium' : 'firefox');
    const firefoxLaunch = vi.spyOn(firefox, 'launch').mockResolvedValue({} as any);
    const chromiumLaunch = vi.spyOn(chromium, 'launch').mockResolvedValue({} as any);
    const webkitLaunch = vi.spyOn(webkit, 'launch').mockResolvedValue({} as any);
    const options = { headless: true, slowMo: 10 };
    const browser = await launch({ ...options, ...(channel ? { channel } : {}) });
    expect(firefoxLaunch).toHaveBeenCalledWith(options);
    expect(chromiumLaunch).not.toHaveBeenCalled();
    expect(webkitLaunch).not.toHaveBeenCalled();
    expect(browser).toBe(await firefoxLaunch.mock.results[0].value);
  });

  // Some checks use CDP or open Chromium directly, so the runner help must not offer WebKit or Firefox for every check.
  it('limits WebKit and Firefox to their checks in the runner help', () => {
    const help = spawnSync(process.execPath, ['tools/check.mjs', '--help'], { cwd: checkout, encoding: 'utf8' });
    expect(help.status).toBe(0);
    expect(help.stdout.replace(/\s+/g, ' ')).toContain('Use webkit for plugin-ui, plugin-ui-http and web-online, and firefox for web-online only');
  });
});

describe('CI step limits', () => {
  it.each([['webkit', 3], ['firefox', 3], ['chromium', 2], ['chrome', 2]] as const)('scales %s waits on CI by %s', async (channel, factor) => {
    vi.stubEnv('CI', 'true');
    vi.stubEnv('PLAYABLE_BROWSER', channel);
    vi.resetModules();
    expect((await import('./checks.mjs')).STEP).toBe(factor);
  });

  it.each(['webkit', 'firefox', 'chromium', 'chrome'])('keeps local %s waits at 1', async channel => {
    vi.stubEnv('PLAYABLE_BROWSER', channel);
    vi.resetModules();
    expect((await import('./checks.mjs')).STEP).toBe(1);
  });
});

describe('env defaults when the variable is not set', () => {
  it('PLAYABLE_URL is the local preview at port 5189', () => {
    expect(env('PLAYABLE_URL')).toBe('http://127.0.0.1:5189/');
  });
  it('PLAYABLE_OUT is a folder named for the check in the by-hand folder of the output root', () => {
    expect(env('PLAYABLE_OUT')).toBe(join(outRoot, 'by-hand', 'workshop'));
    expect(outRoot).toBe(join(tmpdir(), 'kingdown-check-runs'));
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

describe('isInside', () => {
  const temp = mkdtempSync(join(realpathSync(tmpdir()), 'inside-'));
  afterAll(() => rmSync(temp, { recursive: true, force: true }));
  it('is true for the folder and for any path in it, also one that does not exist yet', () => {
    expect(isInside(checkout, checkout)).toBe(true);
    expect(isInside(checkout, join(checkout, 'docs'))).toBe(true);
    expect(isInside(checkout, join(checkout, 'no-such-folder', 'renders'))).toBe(true);
    expect(isInside(checkout, join(checkout, 'docs', '..', 'tools'))).toBe(true);
  });
  it('is false for a path outside the folder, also for a name that starts with two dots', () => {
    expect(isInside(checkout, outRoot)).toBe(false);
    expect(isInside(checkout, join(checkout, '..'))).toBe(false);
    expect(isInside(join(temp, 'a'), join(temp, 'a..b'))).toBe(false);
    expect(isInside(join(temp, 'a'), join(temp, 'ab'))).toBe(false);
  });
  it('follows a symbolic link to where it points', () => {
    symlinkSync(checkout, join(temp, 'link'));
    expect(isInside(checkout, join(temp, 'link', 'renders'))).toBe(true);
    expect(isInside(join(temp, 'link'), join(checkout, 'docs'))).toBe(true);
  });
});

it('env refuses an unknown setting', () => {
  expect(() => env('PLAYABLE_PORT')).toThrow(/PLAYABLE_PORT/);
});
