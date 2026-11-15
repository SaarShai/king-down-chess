import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { chromium, type Browser } from 'playwright';
import { createServer, type ViteDevServer } from 'vite';
import { fileURLToPath } from 'node:url';
import type { AddressInfo } from 'node:net';

vi.setConfig({ testTimeout: 30_000, hookTimeout: 30_000 });
let server: ViteDevServer, browser: Browser, origin: string;
const browserErrors: string[] = [];
beforeAll(async () => {
  server = await createServer({ configFile: false, root: fileURLToPath(new URL('../../../..', import.meta.url)), logLevel: 'error', server: { host: '127.0.0.1', port: 0, hmr: false, watch: null }, optimizeDeps: { noDiscovery: true, include: [] },
    plugins: [{ name: 'safety-fixture', configureServer(vite) { vite.middlewares.use('/safety-check', (_req, res) => { res.setHeader('Content-Type', 'text/html'); res.end(`<html><body><button id="source">Open</button><script type="module">
      import * as safety from '/src/interface/people/screens/safety.ts'; window.safety = safety;
      import { onlineHost } from '/src/interface/people/host/index.ts';
      import '/src/interface/ui/tokens.css'; import '/src/interface/ui/components.css';
      window.calls = []; window.fail = false; window.pageCount = 0;
      window.api = {
        onAccountChange: () => () => {},
        report: async args => { calls.push(['report', args]); if (window.fail) throw Error(); return { id: 17 }; },
        block: async args => { calls.push(['block', args]); if (window.fail) throw Error(); return { blocked: args.blocked }; },
        relate: async (...args) => { calls.push(['relate', ...args]); },
        record: async cursor => { calls.push(['record', cursor]); if (window.fail) throw Error(); return pageCount++ ? { blocks: [{ user_id: 'two', handle: 'second' }], next_blocks_after: null } : { blocks: [{ user_id: 'one', handle: 'first' }], next_blocks_after: 'one' }; }
      };
      window.current = 'alice';
      window.host = onlineHost({ rules: () => 'pieces', setRules() {}, changed() {}, open() {}, home() {}, toast() {},
        storage: localStorage,
        auth: async () => ({ onSession: callback => { window.sessionChanged = callback; },
          readSession: async () => current ? { userId: current, accessToken: 'fixture-' + current } : null,
          signOut: async () => { current = null; sessionChanged(null); } }),
        fetch: async (input, init) => {
          const path = new URL(input, location.origin).pathname;
          if (path.endsWith('/deletion')) { if (window.fail) throw Error(); if (window.holdDeletion) await new Promise(resolve => window.deletionReply = resolve); return Response.json({ deletion: { run_after: '2026-12-01T12:00:00Z' } }); }
          if (path.endsWith('/settings')) return Response.json({ me: { handle: current, icon: null } });
          window.bearer = init.headers.Authorization;
          if (path.endsWith('/record')) return Response.json(await api.record({}));
          if (path.endsWith('/reports')) return Response.json(await api.report(JSON.parse(init.body)));
          if (path.endsWith('/blocks')) return Response.json(await api.block(JSON.parse(init.body)));
          if (path.endsWith('/relations')) { await api.relate('block', JSON.parse(init.body)); return new Response(null, { status: 204 }); }
          throw Error('Unexpected fixture path');
        } });
      await host.signIn();
      window.changeAccount = value => { current = value; sessionChanged(value ? { user: { id: value } } : null); };
    </script></body></html>`); }); } }] });
  await server.listen(); origin = `http://127.0.0.1:${(server.httpServer!.address() as AddressInfo).port}`;
  browser = await chromium.launch({ headless: true });
});
afterAll(async () => { await browser?.close(); await server?.close(); expect(browserErrors).toEqual([]); });
async function open(viewport = { width: 360, height: 640 }) { const page = await browser.newPage({ viewport }); page.on('pageerror', error => browserErrors.push(error.message)); page.on('console', message => { if (message.type() === 'error') browserErrors.push(message.text()); }); await page.goto(origin + '/safety-check'); await page.waitForFunction(() => !!(window as any).changeAccount); return page; }

it('a failed report keeps its draft; success shows the reference and the support path', async () => {
  const page = await open();
  try {
    await page.evaluate(() => { const w = window as any; w.fail = true; w.safety.reportPlayer(w.api, { game_id: 'game' }, document.querySelector('#source')); });
    await page.getByLabel('Reason').selectOption('offensive_handle'); await page.getByLabel('Note (optional)').fill('Test note');
    await page.getByRole('button', { name: 'Send report', exact: true }).click();
    await expect.poll(() => page.getByRole('status').textContent()).toContain('second report');
    expect(await page.getByLabel('Note (optional)').inputValue()).toBe('Test note');
    await page.evaluate(() => { (window as any).fail = false; });
    await page.getByRole('button', { name: 'Send report', exact: true }).click();
    await expect.poll(() => page.locator('h2').textContent()).toBe('Report sent');
    expect(await page.locator('dialog').textContent()).toContain('Reference 17');
    expect(await page.getByRole('link', { name: 'Support' }).getAttribute('href')).toBe('/support.html');
    expect((await page.getByRole('link', { name: 'Support' }).boundingBox())!.height).toBeGreaterThanOrEqual(44);
    expect(await page.evaluate(() => (window as any).calls[0])).toEqual(['report', { game_id: 'game', target: 'handle', category: 'offensive_handle', note: 'Test note' }]);
  } finally { await page.close(); }
});
it('block waits for confirm, retries failure and keeps the current game', async () => {
  const page = await open();
  try {
    await page.evaluate(() => { const w = window as any; w.fail = true; w.safety.blockPlayer(w.api, { game_id: 'game' }, document.querySelector('#source'), () => w.changed = true); });
    expect(await page.evaluate(() => (window as any).calls)).toEqual([]);
    await page.getByRole('button', { name: 'Block player', exact: true }).click();
    await expect.poll(() => page.getByRole('status').textContent()).toContain('Try again');
    await page.evaluate(() => { (window as any).fail = false; });
    await page.getByRole('button', { name: 'Block player', exact: true }).click();
    await expect.poll(() => page.locator('h2').textContent()).toBe('Player blocked');
    expect(await page.locator('dialog').textContent()).toContain('current game continues');
    expect(await page.evaluate(() => (window as any).calls)).toEqual([['block', { game_id: 'game', blocked: true }], ['block', { game_id: 'game', blocked: true }]]);
  } finally { await page.close(); }
});
it('player options replaces its sheet and returns focus to the original control', async () => {
  const page = await open();
  try {
    await page.evaluate(() => { const w = window as any; w.safety.playerOptions(w.api, { user_id: 'inviter' }, document.querySelector('#source'), () => {}); });
    await page.getByRole('button', { name: 'Report player', exact: true }).click();
    expect(await page.locator('dialog').count()).toBe(1);
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('source');
    expect(await page.locator('dialog').count()).toBe(0);
  } finally { await page.close(); }
});
it('loads all block pages and keeps a failed unblock row', async () => {
  const page = await open();
  try {
    await page.evaluate(() => { const w = window as any; w.safety.blockedPlayers(w.api, document.querySelector('#source')); });
    await page.getByRole('button', { name: 'Load more' }).click();
    await expect.poll(() => page.locator('.safety-block-row').count()).toBe(2);
    expect(await page.evaluate(() => (window as any).calls.filter((c: any[]) => c[0] === 'record'))).toEqual([['record', {}], ['record', { blocks_after: 'one' }]]);
    await page.evaluate(() => { (window as any).fail = true; }); await page.getByRole('button', { name: 'Unblock', exact: true }).first().click();
    await expect.poll(() => page.getByRole('status').textContent()).toContain('Try again'); expect(await page.locator('.safety-block-row').count()).toBe(2);
    await page.evaluate(() => { (window as any).fail = false; }); await page.getByRole('button', { name: 'Unblock', exact: true }).first().click();
    await expect.poll(() => page.locator('.safety-block-row').count()).toBe(1);
  } finally { await page.close(); }
});
it('deletion needs confirm, keeps retry on failure and shows only the received date', async () => {
  const page = await open();
  try {
    await page.evaluate(() => { const w = window as any; w.fail = true; w.deletion = w.host.deletion; w.safety.deleteAccount(document.querySelector('#source'), { ...w.deletion, remove: async () => { w.calls.push('delete'); return w.deletion.remove(); } }); });
    expect(await page.evaluate(() => (window as any).calls)).toEqual([]);
    await page.getByRole('button', { name: 'Cancel', exact: true }).click(); expect(await page.locator('dialog').count()).toBe(0);
    await page.evaluate(() => { const w = window as any; w.deletion = w.host.deletion; w.safety.deleteAccount(document.querySelector('#source'), { ...w.deletion, remove: async () => { w.calls.push('delete'); return w.deletion.remove(); } }); });
    await page.getByRole('button', { name: 'Delete account', exact: true }).click();
    await expect.poll(() => page.getByRole('status').textContent()).toContain('same date');
    await page.evaluate(() => { (window as any).fail = false; }); await page.getByRole('button', { name: 'Delete account', exact: true }).click();
    await expect.poll(() => page.locator('h2').textContent()).toBe('Deletion requested');
    expect(await page.locator('dialog').textContent()).toContain('Dec 1, 2026'); expect(await page.locator('dialog').textContent()).toContain('signed out');
  } finally { await page.close(); }
});


for (const next of [null, 'bob']) {
  it(`closes an open blocked list on account change to ${next}`, async () => {
    const page = await open();
    try {
      await page.evaluate(() => { const w = window as any; w.safety.blockedPlayers(w.host.safety, document.querySelector('#source')); });
      await expect.poll(() => page.locator('.safety-block-row').count()).toBe(1);
      expect(await page.evaluate(() => (window as any).bearer)).toBe('Bearer fixture-alice');
      await page.evaluate(value => { const w = window as any; w.staleUnblock = document.querySelector('.safety-block-row button'); w.changeAccount(value); w.staleUnblock.click(); }, next);
      expect(await page.locator('dialog').count()).toBe(0);
      expect(await page.evaluate(() => (window as any).calls.filter((call: any[]) => call[0] === 'block'))).toEqual([]);
    } finally { await page.close(); }
  });
  it(`closes a report draft on account change to ${next}`, async () => {
    const page = await open();
    try {
      await page.evaluate(() => { const w = window as any; w.oldApi = w.host.safety; w.safety.reportPlayer(w.oldApi, { game_id: 'game' }, document.querySelector('#source')); });
      await page.getByLabel('Reason').selectOption('other'); await page.getByLabel('Note (optional)').fill('Private draft');
      await page.evaluate(value => { const w = window as any; w.form = document.querySelector('form'); w.changeAccount(value); w.form.dispatchEvent(new Event('submit', { cancelable: true })); }, next);
      expect(await page.locator('dialog, textarea').count()).toBe(0);
      expect(await page.evaluate(async () => { const w = window as any; try { await w.oldApi.report({ user_id: 'one', target: 'player', category: 'other' }); return 'sent'; } catch (error) { return (error as any).code; } })).toBe('UNAUTHENTICATED');
      expect(await page.evaluate(() => (window as any).calls.filter((call: any[]) => call[0] === 'report'))).toEqual([]);
    } finally { await page.close(); }
  });
  it(`rejects a delayed blocked list after account change to ${next}`, async () => {
    const page = await open();
    try {
      await page.evaluate(() => {
        const w = window as any; w.api.record = () => new Promise(resolve => { w.reply = resolve; });
        w.oldApi = w.host.safety; w.safety.blockedPlayers(w.oldApi, document.querySelector('#source'));
      });
      await page.waitForFunction(() => !!(window as any).reply);
      await page.evaluate(value => { const w = window as any; w.changeAccount(value); w.reply({ blocks: [{ user_id: 'one', handle: 'private-name' }], next_blocks_after: null }); }, next);
      await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 0)));
      expect(await page.locator('dialog, .safety-block-row').count()).toBe(0);
      expect(await page.locator('body').textContent()).not.toContain('private-name');
    } finally { await page.close(); }
  });
}
it('rejects a late reply even before the account event reaches the tab', async () => {
  const page = await open();
  try {
    expect(await page.evaluate(async () => {
      const w = window as any; w.api.record = async () => { w.current = 'bob'; return { blocks: [{ user_id: 'one', handle: 'private-name' }], next_blocks_after: null }; };
      try { await w.host.safety.record(); return 'accepted'; } catch (error) { return (error as any).code; }
    })).toBe('UNAUTHENTICATED');
  } finally { await page.close(); }
});
it('local sign-out closes the safety sheet', async () => {
  const page = await open();
  try {
    await page.evaluate(() => { const w = window as any; w.safety.reportPlayer(w.host.safety, { game_id: 'game' }, document.querySelector('#source')); });
    await page.evaluate(async () => { await (window as any).host.signOut(); });
    expect(await page.locator('dialog').count()).toBe(0);
  } finally { await page.close(); }
});

it('checks the account after a delayed response body arrives', async () => {
  const page = await open();
  try {
    expect(await page.evaluate(async () => {
      const w = window as any;
      const json = Response.prototype.json;
      Response.prototype.json = async function () { const value = await json.call(this); w.current = 'bob'; return value; };
      try { await w.host.safety.record(); return 'accepted'; } catch (error) { return (error as any).code; }
      finally { Response.prototype.json = json; }
    })).toBe('UNAUTHENTICATED');
  } finally { await page.close(); }
});

for (const viewport of [{ width: 360, height: 640 }, { width: 390, height: 844 }, { width: 1440, height: 900 }]) {
for (const eventFirst of [false, true]) it(`closes deletion on an unrelated account change, event first: ${eventFirst}, width: ${viewport.width}`, async () => {
  const page = await open(viewport);
  try {
    await page.evaluate(() => { const w = window as any; w.holdDeletion = true; w.safety.deleteAccount(document.querySelector('#source'), w.host.deletion); });
    await page.getByRole('button', { name: 'Delete account', exact: true }).click(); await page.waitForFunction(() => !!(window as any).deletionReply);
    await page.evaluate(first => { const w = window as any; w.current = 'bob'; if (first) w.changeAccount('bob'); w.deletionReply(); }, eventFirst);
    await expect.poll(() => page.locator('dialog').count()).toBe(0);
    if (!eventFirst) await page.evaluate(() => (window as any).changeAccount('bob'));
    expect(await page.evaluate(() => (window as any).current)).toBe('bob'); expect(await page.locator('body').textContent()).not.toContain('signed out');
  } finally { await page.close(); }
});
it(`keeps the deletion receipt on its expected sign-out, then closes it for a new account, width: ${viewport.width}`, async () => {
  const page = await open(viewport);
  try {
    await page.evaluate(() => { const w = window as any; w.safety.deleteAccount(document.querySelector('#source'), w.host.deletion); });
    await page.getByRole('button', { name: 'Delete account', exact: true }).click();
    await expect.poll(() => page.locator('h2').textContent()).toBe('Deletion requested');
    expect(await page.evaluate(() => (window as any).current)).toBeNull();
    await page.evaluate(() => (window as any).changeAccount('bob'));
    expect(await page.locator('dialog').count()).toBe(0);
  } finally { await page.close(); }
});
}
