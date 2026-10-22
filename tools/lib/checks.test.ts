// Unit test for the shared browser-check settings (checks-and-hooks/05) and isInside.
// The assertions and shot() have a browser self-test: tools/check-selftest.mjs.
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, realpathSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { chromium, firefox, webkit } from 'playwright';
import { answerCheckHost, CHECK_SITE_ENV, env, isInside, launch, launchPersistent, outRoot, trapErrors } from './checks.mjs';

const checkout = resolve(__dirname, '../..');
// The browser of the suite, read before beforeEach clears the setting.
const suiteBrowser = process.env.PLAYABLE_BROWSER || 'chromium';
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

/** A fake context that records its routes, and a fake browser whose newContext gives one. */
const fakeContext = () => ({ routes: [] as [string, Function][], route(pattern: string, handler: Function) { this.routes.push([pattern, handler]); return Promise.resolve(); } }) as any;
const fakeBrowser = () => ({ newContext: vi.fn(async () => fakeContext()) }) as any;
/** Runs a route handler on a fake request and returns the answer that it gives. */
const answer = async (handler: Function, method: string, url: string) => {
  let reply: any;
  await handler({ request: () => ({ method: () => method, url: () => url }), fulfill: (r: any) => { reply = r; } });
  return reply;
};

describe('check host', () => {
  const host = CHECK_SITE_ENV.VITE_SUPABASE_URL;
  it('answers the fake account project in each new context and each persistent profile', async () => {
    vi.stubEnv('PLAYABLE_BROWSER', 'chromium');
    const engine = fakeBrowser(), open = engine.newContext;
    vi.spyOn(chromium, 'launch').mockResolvedValue(engine);
    const browser = await launch();
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    expect(open).toHaveBeenCalledWith({ viewport: { width: 390, height: 844 } });
    expect(context.routes.map(([p]: [string]) => p)).toEqual([`${host}/**`]);
    vi.spyOn(chromium, 'launchPersistentContext').mockResolvedValue(fakeContext());
    expect((await launchPersistent('/tmp/profile')).routes.map(([p]: [string]) => p)).toEqual([`${host}/**`]);
  });

  it('lists Google and GitHub, and gives each other path an empty answer', async () => {
    const context = fakeContext();
    await answerCheckHost(context);
    const [, handler] = context.routes[0];
    const settings = await answer(handler, 'GET', `${host}/auth/v1/settings`);
    expect(JSON.parse(settings.body)).toEqual({ external: { google: true, github: true } });
    expect(settings.headers['access-control-allow-origin']).toBe('*');
    expect(await answer(handler, 'OPTIONS', `${host}/auth/v1/settings`)).toMatchObject({ status: 204 });
    expect(await answer(handler, 'GET', `${host}/rest/v1/user_data?select=*`)).toMatchObject({ body: '[]' });
    expect(await answer(handler, 'POST', `${host}/auth/v1/logout`)).toMatchObject({ status: 204 });
  });
});

describe('launch', () => {
  it.each(['chrome', 'chromium'])('opens the %s channel with the caller options', async channel => {
    vi.stubEnv('PLAYABLE_BROWSER', channel);
    const chromiumLaunch = vi.spyOn(chromium, 'launch').mockResolvedValue(fakeBrowser());
    const firefoxLaunch = vi.spyOn(firefox, 'launch').mockResolvedValue(fakeBrowser());
    const webkitLaunch = vi.spyOn(webkit, 'launch').mockResolvedValue(fakeBrowser());
    const options = { headless: true, slowMo: 10 };
    const browser = await launch(options);
    expect(chromiumLaunch).toHaveBeenCalledWith({ channel, ...options });
    expect(firefoxLaunch).not.toHaveBeenCalled();
    expect(webkitLaunch).not.toHaveBeenCalled();
    expect(browser).toBe(await chromiumLaunch.mock.results[0].value);
  });

  it('opens WebKit with the caller options and no Chromium channel', async () => {
    vi.stubEnv('PLAYABLE_BROWSER', 'webkit');
    const chromiumLaunch = vi.spyOn(chromium, 'launch').mockResolvedValue(fakeBrowser());
    const firefoxLaunch = vi.spyOn(firefox, 'launch').mockResolvedValue(fakeBrowser());
    const webkitLaunch = vi.spyOn(webkit, 'launch').mockResolvedValue(fakeBrowser());
    const options = { headless: true, slowMo: 10 };
    const browser = await launch(options);
    expect(webkitLaunch).toHaveBeenCalledWith(options);
    expect(chromiumLaunch).not.toHaveBeenCalled();
    expect(firefoxLaunch).not.toHaveBeenCalled();
    expect(browser).toBe(await webkitLaunch.mock.results[0].value);
  });

  it('keeps the default options for WebKit', async () => {
    vi.stubEnv('PLAYABLE_BROWSER', 'webkit');
    const webkitLaunch = vi.spyOn(webkit, 'launch').mockResolvedValue(fakeBrowser());
    await launch();
    expect(webkitLaunch).toHaveBeenCalledWith({});
  });

  it('uses an explicit channel before the default setting', async () => {
    const chromiumLaunch = vi.spyOn(chromium, 'launch').mockResolvedValue(fakeBrowser());
    await launch({ channel: 'chromium', headless: true });
    expect(chromiumLaunch).toHaveBeenCalledWith({ channel: 'chromium', headless: true });
  });

  it('accepts WebKit as an explicit channel without sending it to Playwright', async () => {
    const webkitLaunch = vi.spyOn(webkit, 'launch').mockResolvedValue(fakeBrowser());
    await launch({ channel: 'webkit', headless: true });
    expect(webkitLaunch).toHaveBeenCalledWith({ headless: true });
  });

  it.each([undefined, 'firefox'])('opens Firefox with caller options (explicit channel: %s)', async channel => {
    vi.stubEnv('PLAYABLE_BROWSER', channel ? 'chromium' : 'firefox');
    const firefoxLaunch = vi.spyOn(firefox, 'launch').mockResolvedValue(fakeBrowser());
    const chromiumLaunch = vi.spyOn(chromium, 'launch').mockResolvedValue(fakeBrowser());
    const webkitLaunch = vi.spyOn(webkit, 'launch').mockResolvedValue(fakeBrowser());
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

describe('launchPersistent', () => {
  it.each(['chrome', 'chromium', 'webkit', 'firefox'])('opens a retained %s profile', async channel => {
    vi.stubEnv('PLAYABLE_BROWSER', channel);
    const methods = [chromium, webkit, firefox].map(engine => vi.spyOn(engine, 'launchPersistentContext').mockResolvedValue(fakeContext()));
    const selected = channel === 'webkit' ? 1 : channel === 'firefox' ? 2 : 0;
    await launchPersistent('/tmp/retained-profile', { headless: true });
    for (const [index, method] of methods.entries()) {
      if (index === selected) expect(method).toHaveBeenCalledWith('/tmp/retained-profile', { headless: true, ...(selected === 0 ? { channel } : {}) });
      else expect(method).not.toHaveBeenCalled();
    }
  });
  it('uses an explicit engine before the setting', async () => {
    vi.stubEnv('PLAYABLE_BROWSER', 'chromium');
    const method = vi.spyOn(webkit, 'launchPersistentContext').mockResolvedValue(fakeContext());
    await launchPersistent('/tmp/profile', { channel: 'webkit' });
    expect(method).toHaveBeenCalledWith('/tmp/profile', {});
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

describe('trapErrors', () => {
  it('keeps the caller stack without widening an allowed message pattern', () => {
    const listeners = new Map<string, (value: any) => void>();
    const page = { on: (name: string, listener: (value: any) => void) => listeners.set(name, listener) };
    const errors = trapErrors(page, [{ pattern: 'expected disconnect', reason: 'An intentional transport fault' }]);
    listeners.get('pageerror')!({ message: 'Cannot read scale', stack: 'Cannot read scale\nat expected disconnect.js:12:3' });
    listeners.get('pageerror')!({ message: 'expected disconnect', stack: 'expected disconnect\nat app.js:1:2' });
    expect(errors).toEqual(['pageerror: Cannot read scale\nat expected disconnect.js:12:3']);
  });
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
