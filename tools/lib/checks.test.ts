// Unit test for the shared browser-check settings (checks-and-hooks/05) and isInside.
// The assertions and shot() have a browser self-test: tools/check-selftest.mjs.
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, realpathSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { chromium, webkit } from 'playwright';
import { env, isInside, launch, outRoot, trapErrors } from './checks.mjs';

const checkout = resolve(__dirname, '../..');
// The browser of the suite, read before beforeEach clears the setting.
const suiteBrowser = process.env.PLAYABLE_BROWSER || 'chromium';
let argv1: string;

beforeEach(() => {
  argv1 = process.argv[1];
  process.argv[1] = '/somewhere/tools/verify-workshop.mjs';
  for (const name of ['PLAYABLE_URL', 'PLAYABLE_OUT', 'PLAYABLE_BROWSER', 'CLAUDE_CODE_REMOTE']) vi.stubEnv(name, undefined);
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
    const webkitLaunch = vi.spyOn(webkit, 'launch').mockResolvedValue({} as any);
    const options = { headless: true, slowMo: 10 };
    const browser = await launch(options);
    expect(chromiumLaunch).toHaveBeenCalledWith({ channel, ...options });
    expect(webkitLaunch).not.toHaveBeenCalled();
    expect(browser).toBe(await chromiumLaunch.mock.results[0].value);
  });

  it('opens WebKit with the caller options and no Chromium channel', async () => {
    vi.stubEnv('PLAYABLE_BROWSER', 'webkit');
    const chromiumLaunch = vi.spyOn(chromium, 'launch').mockResolvedValue({} as any);
    const webkitLaunch = vi.spyOn(webkit, 'launch').mockResolvedValue({} as any);
    const options = { headless: true, slowMo: 10 };
    const browser = await launch(options);
    expect(webkitLaunch).toHaveBeenCalledWith(options);
    expect(chromiumLaunch).not.toHaveBeenCalled();
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

  // Some checks use CDP or open Chromium directly, so the runner help must not offer WebKit for every check.
  it('limits WebKit to plugin-ui in the runner help', () => {
    const help = spawnSync(process.execPath, ['tools/check.mjs', '--help'], { cwd: checkout, encoding: 'utf8' });
    expect(help.status).toBe(0);
    expect(help.stdout.replace(/\s+/g, ' ')).toContain('Use webkit for plugin-ui only');
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

describe('trapErrors', () => {
  // Playwright holds a handle to each console argument, and the page keeps the object until the handle is disposed.
  // A long check page kept every widget document that its host logged (chatgpt-mvp ticket 53).
  it('lets the page free an object that it logged', async () => {
    const browser = await launch({ headless: true, channel: suiteBrowser });
    try {
      const page = await browser.newPage();
      trapErrors(page);
      // The browser also keeps its last console messages (Chromium 1000, WebKit 100), so more lines push the object out.
      await page.evaluate(() => {
        const logged = { name: 'logged' };
        (window as any).loggedRef = new WeakRef(logged);
        console.log('object', logged);
        for (let i = 0; i < 1100; i++) console.log(`line ${i}`);
      });
      await expect.poll(async () => {
        await page.requestGC();
        return page.evaluate(() => (window as any).loggedRef.deref() === undefined);
      }, { timeout: 10_000 }).toBe(true);
    } finally { await browser.close(); }
  }, 30_000);
});

it('env refuses an unknown setting', () => {
  expect(() => env('PLAYABLE_PORT')).toThrow(/PLAYABLE_PORT/);
});
