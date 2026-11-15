// The people screens in a browser (docs/specs/people-screens, issue 01): the test page `people.html` on a Vite dev
// server, with its fixture in place of the server and the sign-in service. Each test names the rules that it holds.
import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import type { AddressInfo } from 'node:net';
import { fileURLToPath } from 'node:url';
import { chromium, type Browser, type Page } from 'playwright';
import { createServer, type ViteDevServer } from 'vite';

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });
let server: ViteDevServer, browser: Browser, origin = '';
beforeAll(async () => {
  server = await createServer({ configFile: false, root: fileURLToPath(new URL('../../../..', import.meta.url)), logLevel: 'error',
    server: { host: '127.0.0.1', port: 0, hmr: false, watch: null }, optimizeDeps: { noDiscovery: true, include: [] } });
  await server.listen();
  origin = `http://127.0.0.1:${(server.httpServer!.address() as AddressInfo).port}`;
  browser = await chromium.launch({ headless: true });
});
afterAll(async () => { await browser?.close(); await server?.close(); });

async function open(state: string, query = '', size = { width: 390, height: 844 }) {
  const page = await browser.newPage({ viewport: size }); page.setDefaultTimeout(10_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(`${origin}/people.html${query}#${state}`);
  return Object.assign(page, { errors });
}
const calls = (page: Page) => page.evaluate(() => (window as any).peopleDemo.calls as string[]);
const toasts = (page: Page) => page.evaluate(() => (window as any).peopleDemo.toasts as string[]);
const fail = (page: Page, name: string, fault: unknown) => page.evaluate(([name, fault]) => (window as any).peopleDemo.fail(name, fault), [name, fault] as const);
const sheet = (page: Page) => page.locator('dialog.people-sheet');
const title = (page: Page) => sheet(page).locator('h2');
const press = (page: Page, name: string | RegExp) => (name === 'Close' ? sheet(page).locator('.people-sheet-close') : sheet(page).getByRole('button', { name, exact: typeof name === 'string' })).click();

it('Send a link: one game for a fast second tap, busy while it is made, a copy on a computer, the toast, and the focus back on the row', async () => {
  const page = await open('person', '?make=800');
  try {
    await expect.poll(() => title(page).textContent()).toBe('Play a person');
    // Two taps in one task: the second comes before any answer.
    await sheet(page).getByRole('button', { name: 'Send a link' }).evaluate((main: HTMLElement) => { main.click(); main.click(); });
    await expect.poll(() => sheet(page).locator('[aria-busy="true"]').textContent()).toContain('Making your game…');
    await expect.poll(() => toasts(page)).toEqual(['Link copied.']);
    expect((await calls(page)).filter(c => c.startsWith('createLink'))).toEqual(['createLink:pieces']);
    expect(await page.evaluate(() => (window as any).peopleDemo.copied)).toEqual([`${origin}/j#${'k'.repeat(43)}`]);
    expect(await sheet(page).count()).toBe(0);
    expect(await page.evaluate(() => document.activeElement?.hasAttribute('data-demo-open'))).toBe(true);
    expect(page.errors).toEqual([]);
  } finally { await page.close(); }
});

it('Send a link on a touch device: the share list with the share text; a closed share list keeps the sheet and the same game', async () => {
  const page = await open('person', '?touch&share=cancel&make=50');
  try {
    await press(page, 'Send a link');
    await expect.poll(() => page.evaluate(() => (window as any).peopleDemo.shared.length)).toBe(1);
    await expect.poll(() => sheet(page).getByRole('button', { name: 'Send a link' }).getAttribute('aria-busy')).toBe('false');
    await press(page, 'Send a link');
    await expect.poll(() => page.evaluate(() => (window as any).peopleDemo.shared.length)).toBe(2);
    expect((await calls(page)).filter(c => c.startsWith('createLink'))).toHaveLength(1);
    expect(await page.evaluate(() => (window as any).peopleDemo.shared[0])).toEqual({ text: 'alex invites you to a game of King Down.', url: `${origin}/j#${'k'.repeat(43)}` });
    expect(await toasts(page)).toEqual([]);
  } finally { await page.close(); }
  const sent = await open('person', '?touch&make=50');
  try {
    await press(sent, 'Send a link');
    await expect.poll(() => toasts(sent)).toEqual(['Link sent. We tell you when your friend joins.']);
  } finally { await sent.close(); }
});

it('Play again: 3 rows at most, Invite with the chosen game, and the quiet name search; a new player gets "Invite by name"', async () => {
  const page = await open('person');
  try {
    await expect.poll(() => sheet(page).locator('.people-again .people-row').count()).toBe(3);
    expect(await sheet(page).locator('.people-again').innerText()).toContain('You win, 2 days ago');
    await sheet(page).getByRole('radio', { name: 'With powers', exact: true }).click();
    await press(page, 'Invite dana-r');
    await expect.poll(() => toasts(page)).toEqual(['Invite sent to dana-r. dana-r sees it in Play.']);
    expect(await calls(page)).toContain('rules:powers');
    expect(await calls(page)).toContain('invite:dana-r:powers');
  } finally { await page.close(); }
  const fresh = await open('person-new');
  try {
    await expect.poll(() => calls(fresh)).toContain('recent');
    await expect.poll(() => sheet(fresh).getByRole('button', { name: 'Invite by name', exact: true }).count()).toBe(1);
    expect(await sheet(fresh).locator('.people-again').isHidden()).toBe(true);
  } finally { await fresh.close(); }
});

it('Invite by name: Players you know, a search only from 2 letters, "No player has this name.", and the line of a refused invite', async () => {
  const page = await open('person');
  try {
    await expect.poll(() => sheet(page).getByRole('button', { name: 'Invite another player by name' }).count()).toBe(1);
    await press(page, 'Invite another player by name');
    await expect.poll(() => title(page).textContent()).toBe('Invite by name');
    await expect.poll(() => sheet(page).getByText('Players you know').isVisible()).toBe(true);
    const field = sheet(page).getByLabel('Game name');
    await field.fill('d'); await page.waitForTimeout(600);
    expect((await calls(page)).filter(c => c.startsWith('find'))).toEqual([]);
    await field.fill('da');
    await expect.poll(() => calls(page)).toContain('find:da');
    await expect.poll(() => sheet(page).locator('.people-row').count()).toBe(2);
    await field.fill('zz');
    await expect.poll(() => sheet(page).getByRole('status').textContent()).toBe('No player has this name.');
    await field.fill('');
    await fail(page, 'invite:noor-k:pieces', { code: 'FRIEND_INVITE_LIMIT', status: 409 });
    await press(page, 'Invite noor-k');
    await expect.poll(() => sheet(page).getByRole('status').textContent()).toBe('You sent noor-k 2 invites. Wait until noor-k accepts one.');
    await sheet(page).getByRole('button', { name: 'Back', exact: true }).click();
    await expect.poll(() => title(page).textContent()).toBe('Play a person');
  } finally { await page.close(); }
});

it('A refused link: the line of the limit, and the line of a lost connection', async () => {
  const page = await open('person', '?make=50');
  try {
    await fail(page, 'createLink:pieces', { code: 'OPEN_INVITE_LIMIT', status: 409 });
    await press(page, 'Send a link');
    await expect.poll(() => sheet(page).getByRole('status').textContent()).toBe('You have 2 open links. Cancel one in Your games first.');
    await fail(page, 'createLink:pieces', 'network');
    await press(page, 'Send a link');
    await expect.poll(() => sheet(page).getByRole('status').textContent()).toBe('The game service does not answer. Your games are safe. Try again in a few minutes.');
  } finally { await page.close(); }
});

it('Sign-in: only the ways that the service reports, in the fixed order; Not now, Escape and the scrim close with no change', async () => {
  const page = await open('sign-in', '?ways=email,github,google');
  try {
    await expect.poll(() => sheet(page).locator('.people-ways .kd-button').allTextContents()).toEqual(['Continue with Google', 'Continue with GitHub', 'Continue with email']);
    expect(await title(page).textContent()).toBe('Sign in to play a person');
    await press(page, 'Not now');
    expect(await sheet(page).count()).toBe(0);
    await page.getByRole('button', { name: 'Play a person' }).click();
    await expect.poll(() => sheet(page).count()).toBe(1);
    await page.keyboard.press('Escape');
    await expect.poll(() => sheet(page).count()).toBe(0);
    await page.getByRole('button', { name: 'Play a person' }).click();
    await page.mouse.click(195, 20);
    await expect.poll(() => sheet(page).count()).toBe(0);
    expect((await calls(page)).filter(c => c !== 'ways')).toEqual([]);
  } finally { await page.close(); }
});

it('Play a person when signed out: sign-in, then the ready name, then the sheet goes on by itself', async () => {
  const page = await open('person-signed-out');
  try {
    await press(page, 'Continue with Google');
    await expect.poll(() => title(page).textContent()).toBe('You play as');
    // The first ready name is taken (the fixture): the sheet shows the next one.
    await expect.poll(() => sheet(page).locator('.people-name').textContent()).not.toBe('quiet-flame-36');
    expect(await calls(page)).toContain('checkName:quiet-flame-36');
    const name = await sheet(page).locator('.people-name').textContent();
    await press(page, `Play as ${name}`);
    await expect.poll(() => title(page).textContent()).toBe('Play a person');
    expect(await calls(page)).toContain(`saveName:${name}`);
  } finally { await page.close(); }
});

it('The name sheet saves the next name with no message when the name is taken, and says a lost connection', async () => {
  const page = await open('name');
  try {
    await expect.poll(() => sheet(page).getByRole('button', { name: /^Play as / }).getAttribute('aria-busy')).toBe('false');
    const name = (await sheet(page).locator('.people-name').textContent())!;
    await fail(page, `saveName:${name}`, { code: 'HANDLE_TAKEN', status: 409 });
    await press(page, `Play as ${name}`);
    await expect.poll(() => toasts(page)).toHaveLength(1);
    const saves = (await calls(page)).filter(c => c.startsWith('saveName'));
    expect(saves).toHaveLength(2); expect(saves[0]).toBe(`saveName:${name}`);
    expect(await toasts(page)).toEqual([`Saved ${saves[1].slice('saveName:'.length)}.`]);
  } finally { await page.close(); }
  const lost = await open('name');
  try {
    await expect.poll(() => sheet(lost).getByRole('button', { name: /^Play as / }).getAttribute('aria-busy')).toBe('false');
    const name = (await sheet(lost).locator('.people-name').textContent())!;
    await fail(lost, `saveName:${name}`, 'network');
    await press(lost, `Play as ${name}`);
    await expect.poll(() => sheet(lost).getByRole('status').textContent()).toBe('Could not save your name. Check your connection and try again.');
    expect(await sheet(lost).getByRole('button', { name: `Play as ${name}` }).getAttribute('aria-disabled')).toBe('false');
  } finally { await lost.close(); }
});

it('The email code: the code step stays after a reload, a wrong code has its line, and the right code signs in', async () => {
  const page = await open('sign-in');
  try {
    await press(page, 'Continue with email');
    await expect.poll(() => title(page).textContent()).toBe('Continue with email');
    await sheet(page).getByLabel('Email').fill('jo@example.com');
    await page.keyboard.press('Enter');
    await expect.poll(() => title(page).textContent()).toBe('Enter the code');
    expect(await sheet(page).innerText()).toContain('We sent 6 digits to jo@example.com. The code works for 1 hour.');
    expect(await sheet(page).getByLabel('Code').getAttribute('autocomplete')).toBe('one-time-code');
    await page.reload();
    await expect.poll(() => title(page).textContent()).toBe('Enter the code');
    await sheet(page).getByLabel('Code').fill('000000'); await press(page, 'Continue');
    await expect.poll(() => sheet(page).getByRole('status').textContent()).toBe('That code is wrong or has expired. Try again, or ask for a new code.');
    await sheet(page).getByLabel('Code').fill('123456'); await press(page, 'Continue');
    await expect.poll(() => toasts(page)).toEqual(['Signed in.']);
    expect(await page.evaluate(() => sessionStorage.getItem('kingdown.email-code'))).toBeNull();
  } finally { await page.close(); }
});

it('Sign-in does not work now: the computer, another try and Cancel; a suspended account has its line', async () => {
  const page = await open('sign-in');
  try {
    await expect.poll(() => sheet(page).locator('.people-ways .kd-button').count()).toBe(4);
    await fail(page, 'ways', 'network'); await press(page, 'Not now');
    await page.getByRole('button', { name: 'Play a person' }).click();
    await expect.poll(() => title(page).textContent()).toBe('Sign-in does not work now');
    expect(await sheet(page).getByRole('button').allTextContents()).toEqual(['Close panel', 'Play the computer', 'Try again', 'Cancel']);
    await press(page, 'Try again');
    await expect.poll(() => title(page).textContent()).toBe('Sign in to play a person');
    await fail(page, 'start:google', 'banned');
    await press(page, 'Continue with Google');
    await expect.poll(() => sheet(page).getByRole('status').first().textContent()).toBe('This account is suspended. To ask for a review, write to hello@kingdown.dev.');
  } finally { await page.close(); }
});

it('The link landing: signed out, Join signs in, takes the name and joins; an ended invite offers a new invite to the inviter', async () => {
  const page = await open('landing-plain');
  try {
    await expect.poll(() => page.locator('.people-landing h2').textContent()).toBe('A friend invites you to a game');
    await page.getByRole('button', { name: 'Join the game' }).click();
    await expect.poll(() => title(page).textContent()).toBe("Sign in to join your friend's game");
    await press(page, 'Continue with Google');
    await expect.poll(() => title(page).textContent()).toBe('You play as');
    await expect.poll(() => sheet(page).getByRole('button', { name: /^Play as / }).getAttribute('aria-busy')).toBe('false');
    await sheet(page).getByRole('button', { name: /^Play as / }).click();
    await expect.poll(() => calls(page)).toContain('join');
    await expect.poll(() => page.locator('h1').textContent()).toBe('Joined');
  } finally { await page.close(); }
  const ended = await open('landing-ended-known');
  try {
    await expect.poll(() => ended.locator('.people-landing h2').textContent()).toBe('jo-m invites you to a game');
    expect(await ended.locator('.people-fact').allTextContents()).toEqual(['Pieces', '3 days for each move', 'You play Black']);
    await ended.getByRole('button', { name: 'Join the game' }).click();
    await expect.poll(() => ended.locator('.people-landing h2').textContent()).toBe('This invite has ended');
    expect(await ended.locator('.people-landing h2').evaluate(e => e === document.activeElement)).toBe(true);
    expect(await ended.locator('.people-landing').innerText()).toContain('Invites last 7 days. jo-m can send you a new one.');
    await ended.getByRole('button', { name: 'Invite jo-m to a new game' }).click();
    await expect.poll(() => toasts(ended)).toEqual(['Invite sent to jo-m.']);
    expect(await calls(ended)).toContain('inviteBack:jo-m');
  } finally { await ended.close(); }
});

it('late recent rows and sign-in ways keep the visible action in the same place', async () => {
  for (const size of [{ width: 360, height: 640 }, { width: 390, height: 844 }, { width: 844, height: 390 }, { width: 1440, height: 900 }]) {
    for (const [state, method, label] of [['person', 'recent', 'Send a link'], ['sign-in', 'ways', 'Not now']]) {
      const page = await open('', '', size);
      try {
        await page.evaluate(([state, method]) => {
          const host = (window as any).peopleDemo.host, old = host[method];
          host[method] = async () => { await new Promise(resolve => { (window as any).releasePeople = resolve; }); return old(); };
          location.hash = state;
        }, [state, method]);
        const control = sheet(page).getByRole('button', { name: label, exact: true });
        await page.waitForFunction(() => !!(window as any).releasePeople); await page.waitForTimeout(400);
        const before = await control.isVisible() ? await control.boundingBox() : null;
        await page.evaluate(() => (window as any).releasePeople());
        await sheet(page).locator(state === 'person' ? '.people-again .people-row' : '.people-ways button').first().waitFor();
        const after = await control.boundingBox();
        if (before) expect(Math.abs(after!.y - before.y), `${state} ${size.width}x${size.height}`).toBeLessThan(1);
        expect(after).not.toBeNull();
        expect(page.errors).toEqual([]);
      } finally { await page.close(); }
    }
  }
});

it('a slow optional list times out without a late layout change; slow sign-in ways offer another try', async () => {
  for (const [state, method] of [['person', 'recent'], ['sign-in', 'ways']]) {
    const page = await open('');
    try {
      await page.evaluate(([state, method]) => {
        const host = (window as any).peopleDemo.host, old = host[method];
        host[method] = async () => { await new Promise(r => { (window as any).releasePeople = r; }); return old(); };
        location.hash = state;
      }, [state, method]);
      await expect.poll(() => title(page).textContent(), { timeout: 4000 }).toBe(state === 'person' ? 'Play a person' : 'Sign-in does not work now');
      await sheet(page).evaluate(element => Promise.all(element.getAnimations().map(animation => animation.finished)));
      const before = await sheet(page).boundingBox();
      await page.evaluate(() => (window as any).releasePeople()); await page.waitForTimeout(350);
      expect(await sheet(page).boundingBox()).toEqual(before);
      expect(await sheet(page).locator('.people-again .people-row, .people-ways button').count()).toBe(0);
    } finally { await page.close(); }
  }
});

it('the opener stays busy while rows load, so a second tap cannot open another sheet', async () => {
  const page = await open('');
  try {
    await page.evaluate(() => {
      const host = (window as any).peopleDemo.host, old = host.recent;
      (window as any).recentCalls = 0;
      host.recent = async () => { (window as any).recentCalls++; await new Promise(resolve => { (window as any).releasePeople = resolve; }); return old(); };
      location.hash = 'person';
    });
    await page.waitForFunction(() => !!(window as any).releasePeople);
    const opener = page.locator('[data-demo-open]');
    expect(await opener.getAttribute('aria-busy')).toBe('true');
    await opener.evaluate((button: HTMLElement) => { button.click(); button.click(); });
    expect(await page.evaluate(() => (window as any).recentCalls)).toBe(1);
    await page.evaluate(() => (window as any).releasePeople());
    await sheet(page).waitFor();
    expect(await sheet(page).count()).toBe(1);
    expect(await opener.getAttribute('aria-busy')).toBe('false');
  } finally { await page.close(); }
});

it('the name field stays in place while known players and search results change', async () => {
  const page = await open('', '', { width: 1440, height: 900 });
  try {
    await page.evaluate(() => {
      const host = (window as any).peopleDemo.host, old = host.known;
      host.known = async () => { await new Promise(resolve => { (window as any).releasePeople = resolve; }); return old(); };
      location.hash = 'by-name';
    });
    const field = sheet(page).getByLabel('Game name');
    await field.waitFor(); await page.waitForTimeout(400);
    const before = await field.boundingBox();
    await page.evaluate(() => (window as any).releasePeople());
    await expect.poll(() => sheet(page).locator('.people-row').count()).toBe(3);
    expect(await field.boundingBox()).toEqual(before);
    await field.fill('da');
    await expect.poll(() => sheet(page).locator('.people-row').count()).toBe(2);
    expect(await field.boundingBox()).toEqual(before);
    await field.fill('zz');
    await expect.poll(() => sheet(page).getByRole('status').textContent()).toBe('No player has this name.');
    expect(await field.boundingBox()).toEqual(before);
  } finally { await page.close(); }
});

it('Close ends pending sign-in tasks, so they cannot reopen a sheet or join a game', async () => {
  for (const state of ['sign-in', 'code', 'landing-plain']) {
    const page = await open(state, '?wait=800');
    try {
      if (state === 'landing-plain') { await page.getByRole('button', { name: 'Join the game' }).click(); await press(page, 'Continue with email'); }
      else if (state === 'sign-in') await press(page, 'Continue with email');
      if (state === 'code') { await sheet(page).getByLabel('Code').fill('123456'); await press(page, 'Continue'); }
      else { await sheet(page).getByLabel('Email').fill('jo@example.com'); await press(page, 'Send code'); }
      await press(page, 'Close'); await page.waitForTimeout(1100);
      expect(await sheet(page).count(), state).toBe(0);
      expect(await toasts(page), state).toEqual([]);
      expect(await calls(page), state).not.toContain('join');
    } finally { await page.close(); }
  }
  const page = await open('sign-in');
  try {
    await press(page, 'Continue with email');
    await page.evaluate(() => {
      const host = (window as any).peopleDemo.host;
      host.ways = async () => { await new Promise(r => setTimeout(r, 800)); throw new Error('offline'); };
    });
    await press(page, 'Back'); await press(page, 'Close'); await page.waitForTimeout(1100);
    expect(await sheet(page).count()).toBe(0);
  } finally { await page.close(); }
});

it('email and code errors use product copy in a persistent status linked to the field; pasted digits keep the last digit', async () => {
  const page = await open('sign-in');
  try {
    await press(page, 'Continue with email');
    const email = sheet(page).getByLabel('Email'), status = sheet(page).getByRole('status');
    expect(await status.evaluate(e => e.hasAttribute('hidden') || getComputedStyle(e).display === 'none')).toBe(false);
    expect(await email.getAttribute('aria-describedby')).toBe(await status.getAttribute('id'));
    await email.fill('broken'); await press(page, 'Send code');
    await expect.poll(() => status.textContent()).toBe('Could not send a code to that address. Check it and try again.');
    await email.fill('jo@example.com'); await press(page, 'Send code');
    await expect.poll(() => title(page).textContent()).toBe('Enter the code');
    const code = sheet(page).getByLabel('Code');
    expect(await code.getAttribute('aria-describedby')).toBe(await status.getAttribute('id'));
    await code.fill('12'); await press(page, 'Continue');
    await expect.poll(() => status.textContent()).toBe('That code is wrong or has expired. Try again, or ask for a new code.');
    await code.fill(' 123 456 ');
    expect(await code.inputValue()).toBe('123456');
    await press(page, 'Continue'); await expect.poll(() => toasts(page)).toEqual(['Signed in.']);
  } finally { await page.close(); }
});

it('a failed copy focuses the visible link and a new rule choice makes a new link', async () => {
  for (const size of [{ width: 360, height: 640 }, { width: 844, height: 390 }]) {
    const page = await open('person', '?copy=fail&make=50', size);
    try {
      await press(page, 'Send a link');
      const link = sheet(page).getByLabel('Link', { exact: true });
      await expect.poll(() => link.isVisible()).toBe(true);
      const facts = await link.evaluate(e => { const r = e.getBoundingClientRect(); return { focused: e === document.activeElement, visible: r.top >= 0 && r.bottom <= innerHeight }; });
      expect(facts).toEqual({ focused: true, visible: true });
      expect(await sheet(page).getByRole('status').textContent()).toBe('Copy this link and send it to your friend.');
      await sheet(page).getByRole('radio', { name: 'With powers', exact: true }).click();
      expect(await link.isVisible()).toBe(false);
      await press(page, 'Send a link');
      await expect.poll(() => calls(page)).toContain('createLink:powers');
    } finally { await page.close(); }
  }
});

it('the name and picture show only after the check ends', async () => {
  const page = await open('');
  try {
    await page.evaluate(() => {
      const host = (window as any).peopleDemo.host, old = host.checkName;
      host.checkName = async (handle: string) => { await new Promise(r => setTimeout(r, 700)); return old(handle); };
      location.hash = 'name';
    });
    await expect.poll(() => title(page).textContent()).toBe('You play as');
    await page.waitForTimeout(300);
    const before = await sheet(page).locator('[data-kind="main"]').boundingBox();
    expect(await sheet(page).locator('.people-name:visible').count()).toBe(0);
    expect(await sheet(page).locator('.people-picture:visible').count()).toBe(0);
    expect(await sheet(page).getByRole('button', { name: /^Play as / }).count()).toBe(0);
    await expect.poll(() => sheet(page).getByRole('button', { name: /^Play as / }).getAttribute('aria-busy'), { timeout: 4000 }).toBe('false');
    expect(Math.abs((await sheet(page).locator('[data-kind="main"]').boundingBox())!.y - before!.y)).toBeLessThan(1);
  } finally { await page.close(); }
});

it('the service landing retries its read; a failed sign-in check uses the offline line', async () => {
  const page = await open('landing-service');
  try {
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect.poll(() => page.locator('.people-landing h2').textContent()).toBe('jo-m invites you to a game');
    expect((await calls(page)).filter(c => c === 'preview')).toHaveLength(2);
  } finally { await page.close(); }
  const offline = await open('');
  try {
    await offline.evaluate(() => { const host = (window as any).peopleDemo.host; host.online = () => false; host.ways = async () => { throw new Error('offline'); }; location.hash = 'sign-in'; });
    await expect.poll(() => sheet(offline).innerText()).toContain('No connection. Your games on this device still work.');
  } finally { await offline.close(); }
});

it('an older name search cannot replace a newer result', async () => {
  const page = await open('by-name');
  try {
    await page.evaluate(() => { (window as any).peopleDemo.host.find = async (text: string) => { await new Promise(r => setTimeout(r, text === 'da' ? 900 : 20)); return [{ handle: text, icon: null }]; }; });
    await sheet(page).getByLabel('Game name').fill('da');
    await page.waitForTimeout(350);
    await sheet(page).getByLabel('Game name').fill('no');
    await expect.poll(() => sheet(page).locator('.people-row strong').allTextContents()).toEqual(['no']);
    await page.waitForTimeout(1000);
    expect(await sheet(page).locator('.people-row strong').allTextContents()).toEqual(['no']);
  } finally { await page.close(); }
});

it.each([['HANDLE_NEEDED', 409, 'You play as'], ['UNAUTHENTICATED', 401, "Sign in to join jo-m's game"], ['RATE_LIMITED', 429, '']])('Join handles %s', async (code, status, heading) => {
  const page = await open('landing-valid');
  try {
    await expect.poll(() => page.locator('.people-landing h2').textContent()).toBe('jo-m invites you to a game');
    await fail(page, 'join', { code, status });
    await page.getByRole('button', { name: 'Join the game' }).click();
    if (heading) await expect.poll(() => title(page).textContent()).toBe(heading);
    else await expect.poll(() => page.locator('.people-status').textContent()).toBe('Too many tries. Wait a minute and try again.');
  } finally { await page.close(); }
});

it('The link landing states: your own link, a game limit, a refused invite, a broken link and no service', async () => {
  const cases: [string, string, string][] = [
    ['landing-own', 'This is your invite', 'Send the link again'],
    ['landing-blocked', 'This link does not open a game', 'Play the computer'],
    ['landing-bad', 'This link does not open a game', 'Play the computer'],
    ['landing-ended', 'This invite has ended', 'Play the computer'],
  ];
  for (const [state, heading, main] of cases) {
    const page = await open(state);
    try {
      await expect.poll(() => page.locator('.people-landing h2').textContent(), { message: state }).toBe(heading);
      expect(await page.locator('.people-landing .kd-button[data-kind="main"]').allTextContents(), state).toEqual([main]);
    } finally { await page.close(); }
  }
  const limit = await open('landing-limit');
  try {
    await limit.getByRole('button', { name: 'Join the game' }).click();
    await expect.poll(() => limit.locator('.people-landing h2').textContent()).toBe('You have 5 games with jo-m');
    expect(await limit.locator('.people-landing .kd-button[data-kind="main"]').allTextContents()).toEqual(['Open your games']);
  } finally { await limit.close(); }
  const service = await open('landing-service');
  try {
    await expect.poll(() => service.locator('.people-landing [role="status"]').textContent()).toBe('The game service does not answer. Your games are safe. Try again in a few minutes.');
  } finally { await service.close(); }
});

it('Recovery: another account asks one check before the sign-out; a gone game goes back to Play', async () => {
  const page = await open('account');
  try {
    expect(await page.locator('.people-recovery').innerText()).toContain('You are signed in as alex. Sign in with the account that plays this game.');
    await page.getByRole('button', { name: 'Switch account' }).click();
    const check = page.locator('dialog.kd-dialog[open]');
    expect(await check.innerText()).toContain('We sign out alex on this device. Then you sign in with the other account.');
    await check.getByRole('button', { name: 'Switch account' }).click();
    await expect.poll(() => toasts(page)).toEqual(['Signed out. The sign-in sheet opens here.']);
  } finally { await page.close(); }
  const gone = await open('gone');
  try {
    await gone.getByRole('button', { name: 'Back to Play' }).click();
    expect(await calls(gone)).toContain('toPlay');
  } finally { await gone.close(); }
});

it('Sign in again sends the kept turn; the sign-in sheet says why the last sign-in did not finish; "Try again" reads the game again', async () => {
  const again = await open('again');
  try {
    await expect.poll(() => title(again).textContent()).toBe('Sign in again');
    expect(await sheet(again).getByText('Your sign-in has ended. Your turn stays on this device. Sign in to send it.').count()).toBe(1);
    await press(again, 'Continue with Google');
    await expect.poll(() => toasts(again)).toEqual(['Signed in. Turn sent.']);
    expect(await sheet(again).count()).toBe(0);
    expect(await calls(again)).toContain('start:google');
    expect(again.errors).toEqual([]);
  } finally { await again.close(); }
  for (const [state, line] of [['sign-in-retry', 'Sign-in did not finish. Try again.'], ['sign-in-expired', 'Sign-in took too long. Try again.']]) {
    const page = await open(state);
    try {
      await expect.poll(() => sheet(page).locator('.people-status').textContent()).toBe(line);
      await expect.poll(() => sheet(page).locator('.people-ways .kd-button').count()).toBe(4);
    } finally { await page.close(); }
  }
  const down = await open('down');
  try {
    await expect.poll(() => down.locator('.people-recovery p').textContent()).toBe('The game service does not answer. Your games are safe. Try again in a few minutes.');
    await down.getByRole('button', { name: 'Try again' }).click();
    await expect.poll(() => toasts(down)).toEqual(['The game reads again.']);
    expect(down.errors).toEqual([]);
  } finally { await down.close(); }
});

it('fits a small phone: no side scroll, controls 44 px or more, no text below 14 px, the main action in view', async () => {
  for (const state of ['person', 'sign-in', 'name', 'landing-valid']) {
    const page = await open(state, '', { width: 320, height: 568 });
    try {
      await page.waitForTimeout(800);
      const facts = await page.evaluate(() => {
        const scope = document.querySelector('dialog.people-sheet') ?? document.querySelector('.people-landing')!;
        const controls = [...scope.querySelectorAll<HTMLElement>('button, input, a')].filter(e => e.offsetParent);
        const small = controls.map(e => e.getBoundingClientRect()).filter(r => r.height < 44 || r.width < 44);
        const texts = [...scope.querySelectorAll<HTMLElement>('*')].filter(e => e.offsetParent && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent!.trim()) && parseFloat(getComputedStyle(e).fontSize) < 14);
        // The main action is whole in the visible part of the sheet body (a long sheet scrolls under it), or of the page.
        const main = scope.querySelector('.kd-button[data-kind="main"]')?.getBoundingClientRect();
        const view = (scope.querySelector('.people-sheet-body') ?? document.documentElement).getBoundingClientRect();
        const mainInView = !main || main.top >= view.top - 1 && main.bottom <= Math.min(view.bottom, innerHeight) + 1;
        return { side: document.documentElement.scrollWidth > innerWidth, wide: scope.scrollWidth > scope.clientWidth + 1, small: small.length, texts: texts.map(e => e.textContent), mainInView };
      });
      expect(facts, state).toEqual({ side: false, wide: false, small: 0, texts: [], mainInView: true });
      expect(page.errors, state).toEqual([]);
    } finally { await page.close(); }
  }
});

it('keeps the content out of the safe areas; on a phone on the side the landing column keeps its 30rem', async () => {
  const upright = { top: 59, right: 0, bottom: 34, left: 0 }, side = { top: 0, right: 59, bottom: 21, left: 59 };
  for (const [state, size, safe] of [['person', { width: 390, height: 844 }, upright], ['account', { width: 390, height: 844 }, upright], ['gone', { width: 390, height: 844 }, upright], ['down', { width: 390, height: 844 }, upright], ['landing-valid', { width: 390, height: 844 }, upright], ['landing-valid', { width: 844, height: 390 }, side]] as const) {
    const page = await open(state, '', size);
    try {
      await page.waitForTimeout(800);
      const room = await page.evaluate(safe => {
        for (const [edge, px] of Object.entries(safe)) document.documentElement.style.setProperty(`--safe-${edge}`, `${px}px`);
        const element = document.querySelector<HTMLElement>('.people-sheet-panel, .people-landing, .people-recovery')!;
        // From each screen edge to the content box; a page that scrolls meets the screen's foot at its end.
        const s = getComputedStyle(element), r = element.getBoundingClientRect(), end = Math.max(innerHeight, document.scrollingElement!.scrollHeight) - scrollY;
        const left = r.left + parseFloat(s.paddingLeft), right = innerWidth - r.right + parseFloat(s.paddingRight);
        return { top: r.top + parseFloat(s.paddingTop), right, bottom: end - r.bottom + parseFloat(s.paddingBottom), left, width: innerWidth - left - right };
      }, safe);
      for (const edge of ['top', 'right', 'bottom', 'left'] as const) expect(room[edge], `${state} ${size.width}x${size.height} ${edge}`).toBeGreaterThanOrEqual(safe[edge]);
      if (size.width > size.height) expect(room.width, `${state} column`).toBeGreaterThanOrEqual(479);
      expect(page.errors, state).toEqual([]);
    } finally { await page.close(); }
  }
});
